// Сборка приложения: форматирование, основной расчёт и инициализация.
// Зависит от tariffs.js (ставки), rates.js (курсы), ui.js (виджеты) — они подключаются раньше.

function fmt(n) {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Math.round(n)) + ' ₽';
}

// ---------- Основной расчёт ----------
function calc() {
  readRates();
  const price = numVal('price');
  const japanFee = numVal('japanFee');
  const curr = document.getElementById('curr').value;
  document.getElementById('curSym').textContent = { jpy: '¥', usd: '$', eur: '€', rub: '₽' }[curr];
  const cc = numVal('cc');
  const age = document.getElementById('age').value;
  const electric = document.getElementById('electric').checked;
  const hp = numVal('hp');
  const atbJpy = parseFloat(document.getElementById('rJpyAtb').value) || rates.jpyCbr;

  // Курс для ОПЛАТЫ авто (что реально платите): иена — по ATB, остальное — по ЦБ
  const payRate = { jpy: atbJpy, usd: rates.usd, eur: rates.eur, rub: 1 }[curr];
  // Курс для ТАМОЖНИ (база пошлины/сбора): всё по ЦБ
  const cbrRate = { jpy: rates.jpyCbr, usd: rates.usd, eur: rates.eur, rub: 1 }[curr];

  const carRubPay = price * payRate;          // стоимость авто (что платите)
  const japanRubPay = japanFee * payRate;     // комиссия японской стороны
  const priceRubCustoms = price * cbrRate;    // таможенная стоимость = стоимость авто
  const valueEur = priceRubCustoms / rates.eur;

  // Пошлина (единая ставка), считается по курсу ЦБ
  let dutyEur, dutyNote;
  if (electric) {
    dutyEur = valueEur * 0.15;
    dutyNote = '15% от стоимости (электро)';
  } else if (age === 'lt3') {
    const d = dutyLt3(valueEur, cc);
    dutyEur = d.eur; dutyNote = d.note;
  } else if (age === '3to5') {
    const r = ratePerCC_3to5(cc);
    dutyEur = cc * r; dutyNote = r + ' €/см³';
  } else {
    const r = ratePerCC_gt5(cc);
    dutyEur = cc * r; dutyNote = r + ' €/см³';
  }
  const dutyRub = dutyEur * rates.eur;

  // Прочие расходы
  const freightRub = numVal('freight') * rates.usd;
  const broker = numVal('broker');
  const sbkts = numVal('sbkts');
  const glonass = numVal('glonass');
  const epts = numVal('epts');
  const other = numVal('other');
  const delivery = numVal('delivery');
  const fee = customsFee(priceRubCustoms);
  const utilInfo = utilFee(age, hp, cc);
  const util = utilInfo.rub;

  const total = carRubPay + japanRubPay + freightRub + dutyRub + fee + util +
                delivery + broker + sbkts + glonass + epts + other;

  // Вывод
  const nf = new Intl.NumberFormat('ru-RU');
  const carNote = curr === 'jpy'
    ? `${nf.format(price)} ¥ × ${atbJpy} (ATB) · там. стоимость €${Math.round(valueEur).toLocaleString('ru-RU')}`
    : `${nf.format(price)} ${curr.toUpperCase()} · там. стоимость €${Math.round(valueEur).toLocaleString('ru-RU')}`;
  const japanNote = curr === 'jpy'
    ? `${nf.format(japanFee)} ¥ × ${atbJpy} (ATB)`
    : `${nf.format(japanFee)} ${curr.toUpperCase()}`;

  const rows = [
    ['Стоимость авто', carRubPay, carNote],
    ['Расходы по Японии (комиссия)', japanRubPay, japanNote],
    ['Фрахт до Владивостока', freightRub, document.getElementById('freight').value + ' $ × курс ЦБ'],
    ['Таможенная пошлина', dutyRub, dutyNote + ` · €${Math.round(dutyEur).toLocaleString('ru-RU')} × курс ЦБ`],
    ['Таможенный сбор', fee, 'по стоимости авто (2026)'],
    ['Утильсбор' + (utilInfo.lgota ? ' (льготный)' : ' (коммерческий)'), util,
      utilInfo.lgota
        ? (age === 'lt3' ? 'до 3 лет · ≤160 л.с.' : '3 года и старше · ≤160 л.с.')
        : 'свыше 160 л.с. — льгота снята'],
    ['Услуги брокера', broker, ''],
    ['СБКТС', sbkts, ''],
    ['ЭРА-ГЛОНАСС', glonass, ''],
    ['ЭПТС', epts, ''],
    ['СВХ / прочее', other, ''],
    ['Доставка по РФ (автовоз)', delivery, ''],
  ];

  let html = '';
  for (const [lbl, val, note] of rows) {
    html += `<div class="line"><span class="lbl">${lbl}${note ? `<span class="note">${note}</span>` : ''}</span><span class="val">${fmt(val)}</span></div>`;
  }
  html += `<div class="line total"><span class="lbl">ИТОГО под ключ</span><span class="val">${fmt(total)}</span></div>`;
  document.getElementById('lines').innerHTML = html;

  const overhead = carRubPay > 0 ? Math.round((total / carRubPay - 1) * 100) : 0;
  document.getElementById('summary').innerHTML =
    `Стоимость авто <b>${fmt(carRubPay)}</b> → под ключ <b>${fmt(total)}</b> ` +
    `<span class="badge">+${overhead}% к цене</span>`;

  // Предупреждения об ограничениях ввоза из Японии и об утильсборе
  const warns = [];
  if (cc > 1900)
    warns.push('🚫 <b>Двигатель больше 1,9 л.</b> Япония с 09.08.2023 запрещает экспорт таких авто в РФ — прямой ввоз из Японии невозможен.');
  if (electric)
    warns.push('🚫 <b>Электромобиль.</b> Япония запрещает экспорт электромобилей (и большинства гибридов) в РФ.');
  if (hp > 160)
    warns.push('⚠️ <b>Мощность больше 160 л.с.</b> Льготный утильсбор не действует — применён коммерческий (повышенный) сбор, он в десятки раз выше.');
  document.getElementById('warnings').innerHTML = warns.map(w => `<div class="warn">${w}</div>`).join('');
}

// ---------- Инициализация ----------
document.addEventListener('input', calc);
document.getElementById('refresh').addEventListener('click', refreshAll);
refreshAll();
