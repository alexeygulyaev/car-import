// Универсальные UI-виджеты: степперы − / + и тултипы.

// ---------- Степперы − / + ----------
function stepField(input, dir) {
  const stepStr = input.dataset.step || '1';
  const step = parseFloat(stepStr);
  const decimals = stepStr.includes('.') ? stepStr.split('.')[1].length : 0;
  let v = (parseFloat(input.value.replace(/\s/g, '')) || 0) + dir * step;
  const minAttr = input.getAttribute('min');
  const min = minAttr !== null && minAttr !== '' ? parseFloat(minAttr) : -Infinity;
  if (v < min) v = min;
  input.value = decimals ? parseFloat(v.toFixed(decimals)) : Math.round(v);
  input.dispatchEvent(new Event('input', { bubbles: true })); // пересчёт (и переформатирование для .num)
}

function holdRepeat(btn, input, dir) {
  let timer, interval;
  const start = (e) => {
    e.preventDefault();
    stepField(input, dir);
    timer = setTimeout(() => { interval = setInterval(() => stepField(input, dir), 70); }, 400);
  };
  const stop = () => { clearTimeout(timer); clearInterval(interval); };
  btn.addEventListener('pointerdown', start);
  btn.addEventListener('pointerup', stop);
  btn.addEventListener('pointerleave', stop);
  btn.addEventListener('pointercancel', stop);
}

document.querySelectorAll('.stepper').forEach(s => {
  const input = s.querySelector('input');
  holdRepeat(s.querySelector('.dec'), input, -1);
  holdRepeat(s.querySelector('.inc'), input, +1);
});

// ---------- Разделение чисел пробелами (3 000 000) для полей с классом .num ----------
// прочитать число из любого поля, убрав пробелы-разделители
function numVal(id) {
  return parseFloat(document.getElementById(id).value.replace(/\s/g, '')) || 0;
}
// строка из одних цифр → с пробелами по тысячам
function formatNumStr(raw) {
  const digits = String(raw).replace(/\D/g, '').replace(/^0+(?=\d)/, '');
  return digits ? digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : '';
}
// живое форматирование при вводе с сохранением позиции курсора
function onNumInput(e) {
  const el = e.target;
  const before = el.value.slice(0, el.selectionStart).replace(/\D/g, '').length; // цифр слева от курсора
  el.value = formatNumStr(el.value);
  let pos = 0, seen = 0;
  while (pos < el.value.length && seen < before) {
    const c = el.value.charCodeAt(pos);
    if (c >= 48 && c <= 57) seen++;
    pos++;
  }
  try { el.setSelectionRange(pos, pos); } catch (_) {}
}
document.querySelectorAll('input.num').forEach(el => {
  el.value = formatNumStr(el.value);        // начальное форматирование
  el.addEventListener('input', onNumInput); // живое форматирование при вводе
});

// ---------- Тултипы (позиционирование с зажимом по краям экрана) ----------
const tip = document.createElement('div');
tip.id = 'tooltip';
document.body.appendChild(tip);

let activeHint = null;
// устройства с мышью показывают тултип по наведению; на тач-экранах — по тапу
const canHover = window.matchMedia('(hover: hover)').matches;

function showTip(el) {
  tip.textContent = el.dataset.tip || '';
  if (!tip.textContent) return;
  const pad = 8;
  const r = el.getBoundingClientRect();
  const tw = tip.offsetWidth, th = tip.offsetHeight;
  // по горизонтали: ставим к левому краю иконки, но не даём выйти за экран
  let left = Math.min(r.left, window.innerWidth - tw - pad);
  left = Math.max(left, pad);
  // по вертикали: снизу, а если не влезает — сверху
  let top = r.bottom + 8;
  if (top + th > window.innerHeight - pad && r.top - th - 8 > pad) top = r.top - th - 8;
  tip.style.left = left + 'px';
  tip.style.top = top + 'px';
  tip.classList.add('show');
}
function hideTip() {
  tip.classList.remove('show');
  if (activeHint) { activeHint.classList.remove('open'); activeHint = null; }
}

function openTip(el) { showTip(el); el.classList.add('open'); activeHint = el; }

document.querySelectorAll('.hint').forEach(el => {
  if (canHover) {
    // мышь: наведение + фокус с клавиатуры
    el.addEventListener('pointerenter', () => openTip(el));
    el.addEventListener('pointerleave', hideTip);
    el.addEventListener('focus', () => openTip(el));
    el.addEventListener('blur', hideTip);
  } else {
    // тач: тап переключает подсказку (повторный тап или тап вне — скрывает)
    el.addEventListener('click', (e) => {
      e.preventDefault();
      if (activeHint === el) hideTip();
      else openTip(el);
    });
  }
});

// единый способ закрыть подсказку на мобильных: тап вне иконки, прокрутка, поворот, Esc
document.addEventListener('pointerdown', (e) => {
  if (activeHint && !(e.target.closest && e.target.closest('.hint'))) hideTip();
});
window.addEventListener('scroll', hideTip, true);
window.addEventListener('resize', hideTip);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideTip(); });
