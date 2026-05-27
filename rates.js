// Курсы валют. ЦБ (€/$/¥) — для таможни и фрахта; рыночный ¥ — основа SWIFT-курса.
// rates.* — ₽ за единицу валюты. jpyCbr — курс ЦБ за 1 ¥. jpyMarket — рыночный курс ¥.
const rates = { usd: 90, eur: 100, jpyCbr: 0.45, jpyMarket: 0.45 };

// >>> Наценка (спред) поверх рыночного курса иены для SWIFT, в процентах..
const SWIFT_SPREAD_PCT = 8;

// Курсы ЦБ (€/$ для таможни и фрахта, ¥ — для таможенной стоимости)
async function loadRates() {
  const status = document.getElementById('rateStatus');
  status.textContent = 'загрузка…';
  status.style.color = 'var(--muted)';
  try {
    const r = await fetch('https://www.cbr-xml-daily.ru/daily_json.js');
    const d = await r.json();
    rates.usd = d.Valute.USD.Value;
    rates.eur = d.Valute.EUR.Value;
    rates.jpyCbr = d.Valute.JPY.Value / d.Valute.JPY.Nominal; // иена котируется за 100
    document.getElementById('rUsd').value = rates.usd.toFixed(2);
    document.getElementById('rEur').value = rates.eur.toFixed(2);
    const date = d.Date ? new Date(d.Date).toLocaleDateString('ru-RU') : '';
    status.textContent = 'ЦБ актуально на ' + date;
    status.style.color = 'var(--accent2)';
  } catch (e) {
    document.getElementById('rUsd').value = rates.usd;
    document.getElementById('rEur').value = rates.eur;
    status.textContent = '⚠ нет связи с ЦБ — значения по умолчанию';
    status.style.color = 'var(--warn)';
  }
}

// Рыночный курс ¥→₽ — основа для SWIFT-курса
async function loadMarketJpy() {
  try {
    const r = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/jpy.json');
    const d = await r.json();
    if (d.jpy && d.jpy.rub) rates.jpyMarket = d.jpy.rub;
  } catch (e) {
    try {
      const r2 = await fetch('https://open.er-api.com/v6/latest/JPY');
      const d2 = await r2.json();
      if (d2.rates && d2.rates.RUB) rates.jpyMarket = d2.rates.RUB;
    } catch (e2) { /* оставляем значение по умолчанию */ }
  }
}

// SWIFT-курс ¥ = рыночный курс + спред (SWIFT_SPREAD_PCT)
function applySwiftRate() {
  document.getElementById('rJpyAtb').value = (rates.jpyMarket * (1 + SWIFT_SPREAD_PCT / 100)).toFixed(4);
}

// Обновить все курсы и пересчитать
async function refreshAll() {
  await Promise.all([loadRates(), loadMarketJpy()]);
  applySwiftRate();
  calc();
}

// Считать курсы ЦБ из полей (пользователь мог поправить вручную)
function readRates() {
  rates.usd = parseFloat(document.getElementById('rUsd').value) || rates.usd;
  rates.eur = parseFloat(document.getElementById('rEur').value) || rates.eur;
}
