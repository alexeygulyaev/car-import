// Тарифы и ставки (ФТС / ЕАЭС, 2026).
// Это «доменная» часть: при изменении законодательства правьте ставки здесь.

// ---------- Единая ставка таможенной пошлины (физлицо), евро — проверено по ФТС 2026 ----------
function ratePerCC_3to5(cc) { // 3–5 лет, €/см³ по объёму
  if (cc <= 1000) return 1.5;
  if (cc <= 1500) return 1.7;
  if (cc <= 1800) return 2.5;
  if (cc <= 2300) return 2.7;
  if (cc <= 3000) return 3.0;
  return 3.6;
}
function ratePerCC_gt5(cc) { // старше 5 лет, €/см³ по объёму
  if (cc <= 1000) return 3.0;
  if (cc <= 1500) return 3.2;
  if (cc <= 1800) return 3.5;
  if (cc <= 2300) return 4.8;
  if (cc <= 3000) return 5.0;
  return 5.7;
}
function dutyLt3(valueEur, cc) { // до 3 лет: % от стоимости, но не менее €/см³
  let pct, minCC;
  if (valueEur <= 8500)        { pct = 0.54; minCC = 2.5; }
  else if (valueEur <= 16700)  { pct = 0.48; minCC = 3.5; }
  else if (valueEur <= 42300)  { pct = 0.48; minCC = 5.5; }
  else if (valueEur <= 84500)  { pct = 0.48; minCC = 7.5; }
  else if (valueEur <= 169000) { pct = 0.48; minCC = 15;  }
  else                         { pct = 0.48; minCC = 20;  }
  const byPct = valueEur * pct;
  const byCC = cc * minCC;
  return byPct >= byCC
    ? { eur: byPct, note: (pct * 100) + '% от стоимости' }
    : { eur: byCC,  note: minCC + ' €/см³ (минимум)' };
}

// ---------- Таможенный сбор за оформление (₽ по стоимости) — ФТС 2026 ----------
function customsFee(valueRub) {
  if (valueRub <= 200000)   return 1067;
  if (valueRub <= 450000)   return 2134;
  if (valueRub <= 1200000)  return 4269;
  if (valueRub <= 2700000)  return 11746;
  if (valueRub <= 4200000)  return 16524;
  if (valueRub <= 5500000)  return 21344;
  if (valueRub <= 7000000)  return 27540;
  return 30000;
}

// ---------- Утильсбор, ₽ — льгота только для личного пользования и до 160 л.с. ----------
function utilFee(age, hp, cc) {
  if (hp <= 160) // льготный (личное пользование, до 160 л.с.)
    return { rub: age === 'lt3' ? 3400 : 5200, lgota: true };
  // свыше 160 л.с. — коммерческий (повышенный) сбор, ФТС 2026, зависит от объёма и мощности
  const isNew = age === 'lt3';
  let rub;
  if (cc <= 2000) {            // 1–2 л (легальный для ввоза из Японии диапазон)
    if (hp <= 190)      rub = isNew ? 900000  : 1492000;
    else if (hp <= 220) rub = isNew ? 952800  : 1584000;
    else                rub = isNew ? 1142000 : 1828000; // до 280 л.с. и выше
  } else {                     // свыше 2 л
    if (hp <= 190)      rub = isNew ? 2306800 : 3456000;
    else                rub = isNew ? 2834400 : 3981600; // до 370 л.с. и выше
  }
  return { rub, lgota: false };
}
