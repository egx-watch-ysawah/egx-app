import React, { useState } from 'react';

const f = (v: number) => (v >= 10 ? v.toFixed(2) : v.toFixed(3));
const p1 = (v: number) => (v > 0 ? '+' : '') + v.toFixed(1) + '%';
const n1 = (n: number) => n.toLocaleString('en-GB', { maximumFractionDigits: 1 });

type Item = { label: string; value: string; mean: string; effect: string; tone?: 'ok' | 'no' | 'mid' };

const CSS = `
.gd{margin:14px 0 16px;border:1px solid #263249;border-radius:14px;background:#0d1524;overflow:hidden}
.gd-tabs{display:flex;gap:6px;padding:8px;background:#101827;border-bottom:1px solid #1f2a3d}
.gd-tab{flex:1;border:1px solid #263249;background:#0a0e17;color:#9aa6bd;border-radius:10px;padding:10px 4px;font:inherit;font-size:14px;font-weight:700;cursor:pointer}
.gd-tab.on{background:#16315c;color:#fff;border-color:#4d86d6}
.gd-body{padding:12px}
.gd-lead{margin:0 0 10px;color:#c9d3e6;font-size:14px;line-height:1.8}
.gd-it{border:1px solid #1f2a3d;border-radius:12px;padding:10px 12px;margin:0 0 10px;background:#0a101c}
.gd-it.ok{border-inline-start:4px solid #2ee59d}.gd-it.no{border-inline-start:4px solid #ff7a7a}.gd-it.mid{border-inline-start:4px solid #e0b24a}
.gd-h{display:flex;justify-content:space-between;align-items:baseline;gap:10px}
.gd-h span{color:#e8edf5;font-weight:700;font-size:15px}.gd-h b{color:#7fb2ff;font-size:16px}
.gd-it p{margin:6px 0 0;color:#9aa6bd;font-size:13.5px;line-height:1.75}
.gd-it p em{font-style:normal;color:#e8edf5;font-weight:700}
.gd-fv{border:1px dashed #4d86d6;border-radius:12px;padding:12px;margin:0 0 10px;background:#0f1c33}
.gd-fv h4{margin:0 0 6px;color:#e8edf5;font-size:15px}
.gd-rng{display:flex;gap:6px;margin:8px 0}.gd-rng div{flex:1;text-align:center;border:1px solid #263249;border-radius:10px;padding:8px 2px;background:#0a0e17}
.gd-rng small{display:block;color:#9aa6bd;font-size:11.5px}.gd-rng b{display:block;color:#fff;font-size:18px;margin-top:2px}
.gd-foot{margin:6px 0 0;color:#6f7b92;font-size:12.5px;line-height:1.7}
`;

function techItems(s: any): Item[] {
  const v = s.votes || {}, p = s.plan || {}, o: Item[] = [];
  o.push({
    label: 'الاتجاه الطويل (متوسط 200 جلسة)', value: v.trend ? 'فوقه' : 'تحته', tone: v.trend ? 'ok' : 'no',
    mean: 'متوسط 200 جلسة هو متوسط سعر الإقفال في آخر حوالي سنة تداول. السعر فوقه معناه إن اللي اشترى خلال السنة في المتوسط رابح.',
    effect: v.trend ? 'الاتجاه الطويل في صالح السهم، والتراجعات غالبًا بتلاقي مشترين.' : 'الاتجاه الطويل لسه ضعيف، والصعود بيقابله بيع من اللي عايز يخرج على التعادل. لازم إقفال فوقه عشان الصورة تتغير.'
  });
  o.push({
    label: 'الاتجاه المتوسط (متوسط 50 جلسة)', value: v.mid ? 'فوقه' : 'تحته', tone: v.mid ? 'ok' : 'no',
    mean: 'متوسط آخر حوالي شهرين ونص. بيبين اتجاه الشهور القريبة.',
    effect: v.mid ? 'الشهور الأخيرة إيجابية.' : 'الشهور الأخيرة سلبية، والسهم محتاج يقفل فوقه عشان يظهر تحسن.'
  });
  const rsi = s.rsi;
  o.push({
    label: 'RSI (الزخم)', value: String(rsi), tone: rsi > 70 || rsi < 30 ? 'mid' : 'ok',
    mean: 'مقياس من 0 لـ100 لسرعة الصعود أو النزول في آخر 14 جلسة. فوق 70 صعد بسرعة، وتحت 30 نزل بسرعة.',
    effect: rsi > 70 ? 'صعود سريع، احتمال هدوء أو تصحيح، بس مش لازم ينزل.' : rsi < 30 ? 'نزول سريع، ممكن يهدى، بس مش ضمان ارتداد.' : 'في النطاق العادي، فمفيش مبالغة تأثر على القرار لوحدها.'
  });
  o.push({
    label: 'MACD', value: v.macd ? 'أعلى من خطه' : 'أقل من خطه', tone: v.macd ? 'ok' : 'no',
    mean: 'فرق بين متوسطين سريع وبطيء للسعر، بيقارن بخط إشارته. فوقه زخم بيتحسن وتحته زخم بيضعف.',
    effect: v.macd ? 'الزخم القصير بيدعم السعر.' : 'الزخم القصير ضعيف، فأي ارتداد محتاج تأكيد.'
  });
  o.push({
    label: 'حجم التداول', value: s.volx + '×', tone: v.vol ? 'ok' : 'mid',
    mean: 'حجم آخر جلسة مقارنة بمتوسط 20 جلسة قبلها. 1× يعني المعتاد.',
    effect: s.volx < 0.7 ? 'التداول أقل بكتير من المعتاد، فأي حركة سعر ضعيفة الدلالة.' : s.volx > 1.5 ? 'نشاط أعلى من المعتاد. لو مع صعود فده أقوى، بس الحجم لوحده مش دليل إن اللي بيشتري مؤسسات.' : 'قريب من المعتاد، مفيش تأكيد خاص من الحجم.'
  });
  o.push({
    label: 'قوة الاتجاه ADX', value: String(p.adx), tone: p.adx >= 25 ? 'ok' : 'mid',
    mean: 'بيقيس وضوح الاتجاه من غير ما يقول صاعد أو هابط. فوق 25 اتجاه واضح.',
    effect: p.adx >= 25 ? 'فيه اتجاه واضح فمؤشرات الاتجاه أوثق.' : 'السوق متردد، فإشارات المتوسطات ممكن تكون كاذبة أكتر.'
  });
  o.push({
    label: 'التذبذب اليومي ATR', value: p.atrpct + '%', tone: 'mid',
    mean: 'متوسط حركة السهم في اليوم من أعلى لأقل سعر تقريبًا.',
    effect: p.atrpct >= 4 ? 'التذبذب عالي: الوقف لازم يكون بعيد، فالخسارة المحتملة بتكبر لكل جنيه استثمار.' : 'تذبذب معتدل، المسافة بين الدخول والوقف أصغر.'
  });
  if (p.res && p.sup) {
    const dr = (p.res / s.close - 1) * 100, ds = (p.sup / s.close - 1) * 100;
    o.push({
      label: 'مقاومة ودعم (20 جلسة)', value: f(p.res) + ' / ' + f(p.sup), tone: 'mid',
      mean: 'أعلى سعر وأقل سعر في آخر 20 جلسة. المقاومة سقف قريب جرب السعر ما يعديهوش، والدعم أرضية جربها.',
      effect: 'المقاومة بتبعد ' + p1(dr) + ' عن السعر، والدعم ' + p1(ds) + '. كسر المقاومة بحجم أعلى إيجابي، وكسر الدعم سلبي.'
    });
  }
  if (s.hi52 && s.lo52) {
    const pos = ((s.close - s.lo52) / (s.hi52 - s.lo52)) * 100;
    o.push({
      label: 'مكانه في مدى السنة', value: pos.toFixed(0) + '%', tone: 'mid',
      mean: 'صفر% عند أقل سعر في سنة (' + f(s.lo52) + ') و100% عند أعلى سعر (' + f(s.hi52) + ').',
      effect: pos < 30 ? 'قريب من قاع السنة: يا إما فرصة ارتداد يا إما ضعف مستمر، لازم يتقري مع الأساسيات.' : pos > 70 ? 'قريب من قمة السنة: اللي اشترى بدري رابح، والدخول متأخر أخطر.' : 'في نص المدى تقريبًا.'
    });
  }
  o.push({
    label: 'التغير', value: 'شهر ' + p1(s.chg20) + ' · 3 شهور ' + p1(s.chg60), tone: s.chg60 >= 0 ? 'ok' : 'no',
    mean: 'تغير سعر الإقفال في آخر شهر وآخر 3 شهور.',
    effect: 'بيوصف اللي حصل، مش اللي جاي. الـ3 شهور السلبية مع تحسن آخر شهر مثلًا ممكن تكون بداية تعافي، لكن محتاجة تأكيد.'
  });
  return o;
}

const FIN_DICT: [string, string, string][] = [
  ['مجمل الربح', 'الإيراد ناقص التكلفة المباشرة للبيع أو التنفيذ. بيبين كام جنيه فاضل من كل جنيه مبيعات قبل المصاريف.', 'هامش أقل معناه تكلفة بتاكل من المبيعات، ولو استمر بيضغط الربح حتى لو الإيراد بيزيد.'],
  ['ربح التشغيل', 'ربح النشاط نفسه قبل الفوائد والضرائب.', 'لو بيزيد من غير ديون جديدة يبقى الأساس سليم. لو الفوائد بتاكله، ربح المساهم بيقل.'],
  ['مصروف التمويل', 'الفوائد المدفوعة أو المستحقة على الديون.', 'كل ما زاد، جزء أكبر من ربح التشغيل بيروح للبنوك قبل المساهم. مع فايدة 20% الضغط أكبر.'],
  ['صافي كاش التشغيل', 'الكاش اللي دخل فعلًا من النشاط في الفترة بعد الفايدة والضريبة.', 'الربح من غير كاش مش بيسدد ديون ولا يوزع. لو سالب لازم نعرف ليه (مخزون، عملاء، دفعات مقدمة).'],
  ['حقوق مساهمي الأم', 'الفرق بين أصول الشركة والتزاماتها اللي يخص مساهميها. دي القيمة الدفترية.', 'بنقارنها بسعر السهم. سعر أقل بكتير من الدفترية معناه إن السوق مش مصدق قيمة الأصول أو العائد عليها. مش سعر عادل.'],
  ['اضمحلال الأصول', 'خسارة محاسبية بتتسجل لما قيمة أصل أو قرض بتنزل عن المسجل.', 'زيادتها بتقلل الربح وتنبه لجودة الأصول. أهميتها في هل هتتكرر ولا لا.'],
];

function finItems(r: any): Item[] {
  if (!r) return [];
  const o: Item[] = [];
  const g = r.prior ? (r.revenue / r.prior - 1) * 100 : null;
  o.push({
    label: 'الإيراد (9 شهور)', value: n1(r.revenue) + ' م', tone: g != null && g > 0 ? 'ok' : 'mid',
    mean: 'إجمالي مبيعات أو إيرادات الشركة في 9 شهور لحد 30 سبتمبر 2026' + (g != null ? '، ' + p1(g) + ' عن نفس الفترة السنة اللي فاتت.' : '.'),
    effect: 'نمو الإيراد مفيد بس لو اتحول لربح وكاش. إيراد أعلى مع ربح أقل معناه الهامش بيضيق.'
  });
  o.push({
    label: 'ربح مساهمي الأم (9 شهور)', value: n1(r.profit) + ' م', tone: 'mid',
    mean: 'الربح اللي يخص مساهمي الشركة الأم بعد الضريبة وحقوق الأقلية. ده اللي بيتحول لربح السهم.',
    effect: 'بنقسمه على عدد الأسهم للوصول لربح السهم. أسهم المنحة والخزينة بتغيّر القسمة، فلازم عدد الأسهم يتأكد.'
  });
  o.push({
    label: 'صافي الربح / الإيراد', value: r.margin + '%', tone: 'mid',
    mean: 'كام قرش ربح من كل جنيه إيراد، للفترة مش سنويًا. توضيح تقريبي مش هامش قطاع.',
    effect: 'هامش رفيع معناه إن أي زيادة في التكلفة أو الفايدة تمحو الربح بسرعة. ماينفعش نقارن شركة مالية بمصنع.'
  });
  for (const [label, val, unit] of r.facts || []) {
    const d = FIN_DICT.find(x => label.indexOf(x[0]) === 0);
    o.push({
      label, value: n1(val) + ' ' + (unit || ''), tone: 'mid',
      mean: d ? d[1] : 'بند من القوائم المالية الأصلية.',
      effect: d ? d[2] : 'التفسير التفصيلي في دراسة الشركة تحت.'
    });
  }
  return o;
}

const BONY_ITEMS: Item[] = [
  { label: 'إيراد الإيجار (9 شهور)', value: '649 م · +19%', tone: 'ok', mean: 'إيجارات العقارات اللي الشركة بتملكها، وهو الدخل المتكرر الأساسي.', effect: 'نمو الإيجار بيدعم الدخل المتكرر بدون الاعتماد على بيع وحدات أو إعادة تقييم.' },
  { label: 'صافي معلن', value: '1,268 م · -30%', tone: 'mid', mean: 'الربح بالقوائم. بيشمل ربح إعادة تقييم العقارات 1,387 م قبل الضريبة وده مش كاش.', effect: 'ماينفعش نبني عليه توقع، لأن جزء كبير منه محاسبي.' },
  { label: 'صافي متكرر', value: '219 م · +129%', tone: 'ok', mean: 'مقياس بتعلنه الشركة بيستبعد بيع الوحدات وإعادة التقييم والمصاريف غير المتكررة.', effect: 'أقرب لقدرة الشركة المتكررة على الربح، لكنه مقياس إدارة مش بند مدقق.' },
  { label: 'حقوق الملكية', value: '13.499 مليار', tone: 'mid', mean: 'أصول 18.258 مليار ناقص التزامات 4.758 مليار. دفترية مش سعر عادل.', effect: 'أساس نطاق السعر الدفتري تحت. العقارات 16.688 مليار بالقوائم هي أغلب الأصول، فتقييمها هو اللي بيحرك القيمة.' },
  { label: 'الضريبة المؤجلة والقروض', value: '3.215 مليار · 824 م', tone: 'mid', mean: 'التزامات موجودة فعلًا داخل حقوق الملكية، مش بتتخصم تاني.', effect: 'ارتفاع تقييم العقارات بيزود الضريبة المؤجلة، فالزيادة على الورق بتتخصم منها ضريبة.' },
  { label: 'كاش التشغيل', value: '516 م', tone: 'mid', mean: 'الكاش من التشغيل في 9 شهور، بيشمل تحصيلات بيع وحدات مش إيجار بس.', effect: 'لو جزء منه بيع وحدات يبقى مش كله قابل للتكرار.' },
];


const FV: any = {
  HRHO: { profit: 2529.783, shares: 1435.893, todo: ['عدد الأسهم بعد 30 سبتمبر', 'ربح البنك والسمسرة والإدارة كل واحد لوحده (مجموع الأجزاء)', 'حقوق الأقلية'], extra: 'القيمة الدفترية للسهم 26.16 والعائد على حقوق الملكية حوالي 9% سنويًا أقل من فايدة الإيداع، فالمضاعف المحافظ هو الأقرب للحسبة.', src: <a href="https://efgholding.com/uploads/EFG_Holding_Consolidated_Financial_Statements_3_Q2026_b9ec32d58f.pdf" target="_blank" rel="noreferrer">قوائم HRHO</a> },
  MASR: { profit: 1812.455, shares: 2135, todo: ['عدد الأسهم تقريبي: 18.15 مليون = 0.85% حسب خبر البورصة، يعني حوالي 2,135 مليون', 'تدفقات المشروعات والأراضي والضريبة', 'ربح 9 شهور نزل 22.9% وهامش الربح نزل، فضرب 4/3 ممكن يكون متفائل'], src: <a href="https://www.technotime.net/18789" target="_blank" rel="noreferrer">خبر الشراء</a> },
  UNIP: { profit: 14.794, shares: 2291.443, todo: ['الربح صغير جدًا لأن الفوائد 97.6 مليون أكلت 88% من ربح التشغيل 110.7 مليون، فنتيجة المضاعف حساسة جدًا للفايدة', 'تدفق نقدي تشغيلي سالب في الفترة', 'الأصول فيها إعادة تقييم 159.8 مليون'], extra: 'القيمة الدفترية للسهم حوالي 0.216 (0.146 بدون إعادة تقييم الأصول الثابتة)، يعني الدفترية أعلى من نتيجة الأرباح. صافي الدين 526 مليون.', src: <a href="https://foudalens.com/disclosures/UNIP.CA/financial_statement/2026-11-24_298468_1.pdf" target="_blank" rel="noreferrer">قوائم UNIP</a> },
  PHAR: { profit: 792.973, shares: 168.756, todo: ['تحفظ المراجع على القوائم المجمعة (شركة زميلة)، وممكن يغير الربح', 'عدد الأسهم 168.756 مليون من موقع مباشر، يحتاج تأكيد بالقوائم', 'كاش التشغيل سالب 171 مليون في الفترة'], src: <a href="https://foudalens.com/disclosures/PHAR.CA/financial_statement/2026-11-15_297626_2.pdf" target="_blank" rel="noreferrer">قوائم PHAR</a> },
  ORHD: { profit: 4345.7, shares: 3650.13, todo: ['أرباح التطوير العقاري بتتسجل على دفعات، فضرب 4/3 تقدير مش مضمون', 'الكاش الحر سالب 593 مليون بعد المشروعات، وديون 13 مليار', 'أي أحداث رأسمالية بعد 7 أكتوبر'], src: <a href="https://foudalens.com/disclosures/ORHD.CA/financial_statement/2026-11-11_297369_2.pdf" target="_blank" rel="noreferrer">قوائم ORHD</a> },
};

function fairCard(s: any, k: string, r: any) {
  if (k === 'BONY') {
    const lo = 6.63, mid = 7.33, hi = 8.03;
    return <div className="gd-fv"><h4>السعر العادل: تقدير دفتري مؤرخ، مش سعر مستهدف</h4>
      <div className="gd-rng"><div><small>عقارات -10%</small><b dir="ltr">{lo}</b></div><div><small>بالقوائم</small><b dir="ltr">{mid}</b></div><div><small>عقارات +10%</small><b dir="ltr">{hi}</b></div></div>
      <p className="gd-lead">السعر الحالي <bdi dir="ltr">{f(s.close)}</bdi> يعني حوالي {(s.close / mid * 100).toFixed(0)}% من القيمة الدفترية. يعني السوق مسعّر الأصول بخصم كبير. ده مش معناه إن السعر هيرجع للدفترية، لأن الخصم ممكن يكون عن سبب (سيولة ضعيفة، تقييم العقارات، تكلفة التصرف).</p>
      <p className="gd-foot">القسمة على 1,842.8 مليون سهم (إجمالي 1,874.8 ناقص 32 خزينة لحد 5 نوفمبر). زيادة العاملين ومشتريات الخزينة بعد 5 نوفمبر مش محسوبة. حصة غير المسيطرين لسه مش متحقق منها.</p></div>;
  }
  const m = FV[k];
  if (!m) return null;
  const eps = (m.profit / m.shares) * (4 / 3);
  const mult: [string, number, string][] = [['محافظ', 6.67, '6.7×'], ['متوسط', 10, '10×'], ['متفائل', 17.36, '17.4×']];
  const rows = mult.map(([n, x, t]) => ({ n, t, v: eps * x }));
  const pe = s.close / eps;
  const pos = s.close < rows[0].v ? 'أقل من' : s.close > rows[2].v ? 'أعلى من' : 'جوه';
  return <div className="gd-fv"><h4>نطاق السعر العادل · مبدئي، لسه هيتم التحديث</h4>
    <p className="gd-lead">ربح السهم الحسابي <bdi dir="ltr">{eps.toFixed(eps < 0.1 ? 4 : 2)}</bdi> (ربح الأم 9 شهور <bdi dir="ltr">{n1(m.profit)}</bdi> مليون ÷ <bdi dir="ltr">{n1(m.shares)}</bdi> مليون سهم، مضروب في 4/3 لسنة كاملة). السعر الحالي <bdi dir="ltr">{f(s.close)}</bdi> يساوي {pe.toFixed(1)} مرة الربح.</p>
    <div className="gd-rng">{rows.map(r => <div key={r.n}><small>{r.n} · {r.t}</small><b dir="ltr">{f(r.v)}</b></div>)}</div>
    <p className="gd-lead">السعر الحالي {pos} النطاق المبدئي. النطاق واسع لأن فايدة الإيداع 20% بتدي مضاعف صغير، ومضاعف السوق بيدي مضاعف أكبر.</p>
    <div className="gd-it mid"><div className="gd-h"><span>الطريقة</span></div><p>ربح السهم السنوي × مضاعف ربح. المحافظ = 1 ÷ (فايدة الإيداع 20% + علاوة مخاطرة 7% − نمو بحجم التضخم 12%). المتوسط والمتفائل = مضاعف سوق البورصة المصرية: 10 في أغسطس و17.4 في أكتوبر.</p></div>
    <div className="gd-it mid"><div className="gd-h"><span>الافتراضات (علاوة المخاطرة 7% افتراضنا)</span></div><p>ضرب 9 شهور في 4/3 بيفترض ربع رابع مثل المتوسط، وده مش مضمون. المضاعف محتاج مراجعة لكل قطاع.</p></div>
    <div className="gd-it no"><div className="gd-h"><span>لسه هيتم التحديث</span></div>{m.todo.map((t: string, i: number) => <p key={i}>• {t}</p>)}</div>
    {m.extra && <div className="gd-it mid"><div className="gd-h"><span>تقاطع آخر</span></div><p>{m.extra}</p></div>}
    <p className="gd-foot">مصادر: <a href="https://sis.gov.eg/en/media-center/news/egypt-s-central-bank-raises-key-interest-rates-by-1/" target="_blank" rel="noreferrer">فايدة البنك المركزي 20%</a> · <a href="https://economymiddleeast.com/news/egypts-october-inflation-eases-to-12-percent-as-monthly-rate-falls-to-0-6-percent-after-march-peak/" target="_blank" rel="noreferrer">تضخم أكتوبر 12%</a> · <a href="https://enterpriseam.com/egypt/2026/11/05/egx30-sheds-4-43-in-october-to-post-its-first-back-to-back-monthly-loss-of-2026/" target="_blank" rel="noreferrer">مضاعف السوق 17.36</a> · <a href="https://www.agbi.com/analysis/markets/2026/08/foreign-investors-return-as-egypt-stocks-hit-record-highs/" target="_blank" rel="noreferrer">مضاعف 10 في أغسطس</a> · {m.src}. مش نصيحة استثمار ولا سعر مستهدف.</p></div>;
}


const DEC: any = {
  MASR: { up: ['مبيعات متعاقد عليها 45.4 مليار (+25%) وبكلوج إيراد 111 مليار لسه هيتسجل', 'شراء خزينة معتمد 18.15 مليون سهم'], down: ['ربح 9 شهور نزل 22.9% وهامش مجمل الربح من 66% لـ51.5%', 'قطاع عقاري: حساس لفايدة 20%'], flip: 'تحسن الهامش في الربع الجاي، أو تحصيلات المشروعات، أو اكتمال الشراء الفعلي للخزينة.' },
  BONY: { up: ['إيجار +19% ومتكرر +129%', 'شراء خزينة لحد 4%'], down: ['السيولة والخصم الكبير عن الدفترية ممكن يفضل', 'ربح القوائم أغلبه إعادة تقييم مش كاش'], flip: 'نمو الإيجار المتكرر، أو تضييق الخصم عن الدفترية، أو تغير تقييم العقارات.' },
  HRHO: { up: ['سمسرة وإدارة أصول والبنك أرباحهم قوية قبل الأقلية'], down: ['ربح الأم نزل لـ2,530 من 2,853 مليون', 'اضمحلال الأصول زاد لـ1,237 مليون', 'العائد على حقوق الملكية حوالي 9% أقل من فايدة الإيداع 20%'], flip: 'جودة أصول البنك والتمويل الاستهلاكي والمتناهي الصغر، وعودة العائد على حقوق الملكية فوق الفايدة.' },
  UNIP: { up: ['مبيعات +13% (1,172 مقابل 1,037 مليون)'], down: ['السعر 0.300 أعلى من القيمة الدفترية 0.216 تقريبًا', 'الفوائد أكلت 88% من ربح التشغيل', 'صافي دين 526 مليون وكاش تشغيل سالب', ], flip: 'نزول الفايدة أو تخفيض الدين، أو تحول كاش التشغيل لموجب.' },
  PHAR: { up: ['إيراد +3%'], down: ['ربح الأم -30%', 'كاش التشغيل سالب 171 مليون', 'تحفظ المراجع على القوائم المجمعة'], flip: 'نشر قوائم الشركة الشقيقة وزوال التحفظ، وعودة كاش التشغيل للموجب.' },
  ORHD: { up: ['إيراد +35% وربح الأم 4.3 مليار', 'EPS الظاهر انخفض بسبب سهم المنحة مش الربح'], down: ['هامش مجمل الربح 27.5% من 32.2%', 'ديون 13 مليار والكاش الحر سالب بعد المشروعات', 'قطاع عقاري حساس للفايدة'], flip: 'تحصيلات المشروعات، وخفض الديون، وثبات الهامش.' },
};

function DecisionCard({ s, k }: { s: any; k: string }) {
  const d = DEC[k]; const p = s.plan || {};
  const a = (s.close / s.hi52 - 1) * 100;
  return <div>
    <p className="gd-lead">ملخص يساعدك تقرر بنفسك. مش توصية، ومفيش أمر بيع أو شراء.</p>
    <div className="gd-it ok"><div className="gd-h"><span>اللي في صالح السهم</span></div>{d.up.map((t: string, i: number) => <p key={i}>• {t}</p>)}</div>
    <div className="gd-it no"><div className="gd-h"><span>اللي بيقلق</span></div>{d.down.map((t: string, i: number) => <p key={i}>• {t}</p>)}</div>
    <div className="gd-it mid"><div className="gd-h"><span>إيه اللي يغير الصورة</span></div><p>{d.flip}</p></div>
    <div className="gd-it mid"><div className="gd-h"><span>أرقام السعر دلوقتي</span></div>
      <p>السعر {f(s.close)} ويبعد {p1(a)} عن أعلى سعر في سنة. التذبذب اليومي المعتاد {p.atrpct}%، يعني خسارة يوم عادي حوالي {p.atrpct}% من قيمة المركز. السيولة حوالي {p.tv} مليون جنيه في اليوم{p.tv < 5 ? '، وده قليل: الدخول والخروج بكميات كبيرة صعب.' : '.'}</p></div>
    <div className="gd-it mid"><div className="gd-h"><span>اسأل نفسك قبل أي قرار</span></div>
      <p>• المدة: هتستنى أسابيع ولا شهور؟ الشارت مبني على أيام وأسابيع.</p>
      <p>• أقصى خسارة تقبلها على السهم ده كام %؟ قارنها بالتذبذب فوق.</p>
      <p>• السهم ده بيزود تركيزك في نفس القطاع؟ (مدينة مصر وبنيان وأوراسكوم كلهم عقارات.)</p>
      <p>• بدائل: إيداع بفايدة 20% بدون مخاطرة. السهم لازم يعوضك أكتر منها.</p></div>
    <p className="gd-foot">كل رقم هنا من نفس المصادر في تبويب السعر العادل. اللي لسه ناقص مكتوب هناك "لسه هيتم التحديث".</p>
  </div>;
}

function TrendVerdict({ s }: { s: any }) {
  const v = s.votes || {}; const cl = (s.bars || []).map((b: any) => b[4]);
  const sma = (n: number) => cl.length >= n ? cl.slice(-n).reduce((a: number, b: number) => a + b, 0) / n : null;
  const s50 = sma(50), s200 = sma(200);
  const up = v.mid && v.macd, down = !v.mid && !v.macd;
  const kind = up ? 'up' : down ? 'down' : 'side';
  const title = up ? 'الاتجاه القريب: صاعد' : down ? 'الاتجاه القريب: هابط' : 'الاتجاه القريب: عرضي / متردد';
  const why = [v.mid ? 'فوق متوسط 50 جلسة' : 'تحت متوسط 50 جلسة', v.macd ? 'MACD أعلى من خطه' : 'MACD أقل من خطه', 'RSI ' + s.rsi, v.trend ? 'فوق متوسط 200' : 'تحت متوسط 200', 'الحجم ' + s.volx + '×'].join(' · ');
  const flip = s50 ? (up ? 'يتغير لو السعر قفل تحت ' + f(s50) + ' (متوسط 50 جلسة)' : 'يتغير لو السعر قفل فوق ' + f(s50) + ' (متوسط 50 جلسة) والـMACD رجع فوق خطه') : 'مفيش تاريخ كفاية لمستوى التغيير';
  const sub = up ? 'اللي ماسك السهم بيستمر طالما المستوى ده متكسرش.' : down ? 'اللي بيفكر يخرج أو يستنى بيبص على المستوى ده كإشارة تغير.' : 'مفيش اتجاه واضح، والإشارات مختلفة.';
  return <section className={'tv tv-' + kind} aria-label="الاتجاه القريب">
    <b className="tv-t">{title}</b>
    <span className="tv-w">{why}</span>
    <span className="tv-f">{flip}. {sub}</span>
    <small className="tv-n">وصف لحركة السعر لحد إقفال {s.date}، مش أمر بيع أو شراء ومش توقع. ممكن يتغير في جلسة، والوقف ممكن يتكسر بفجوة.</small>
  </section>;
}

function DecSum({ s, k }: { s: any; k: string }) {
  const d = DEC[k];
  let rng = 'نطاق السعر العادل: راجع تبويب السعر العادل.';
  if (k === 'BONY') rng = 'السعر ' + f(s.close) + ' مقابل قيمة دفترية 6.63 / 7.33 / 8.03 (مبدئي).';
  else { const m = FV[k]; if (m) { const e = (m.profit / m.shares) * (4 / 3); rng = 'السعر ' + f(s.close) + ' مقابل نطاق مبدئي ' + f(e * 6.67) + ' / ' + f(e * 10) + ' / ' + f(e * 17.36) + ' (لسه هيتم التحديث).'; } }
  return <section className="dec-sum" aria-label="ملخص للقرار">
    <div className="dec-row"><b>اللي بيحركه</b><span>{d.up[0]}{d.down[0] ? ' · ' + d.down[0] : ''}</span></div>
    <div className="dec-row"><b>اللي يغير القراءة</b><span>{d.flip}</span></div>
    <div className="dec-row"><b>لسه ناقص</b><span>{k === 'BONY' ? 'عدد الأسهم بعد 5 نوفمبر وحصة الأقلية' : k === 'PHAR' ? 'تحفظ المراجع وقوائم الشركة الشقيقة' : k === 'HRHO' ? 'عدد الأسهم بعد 30 سبتمبر وقيمة كل قطاع' : k === 'MASR' ? 'عدد الأسهم الدقيق وكاش المشروعات' : k === 'UNIP' ? 'توقع الفوائد والكاش' : 'تحركات رأس المال بعد 7 أكتوبر وكاش المشروعات'}</span></div>
    <div className="dec-row"><b>السعر والنطاق</b><span>{rng}</span></div>
  </section>;
}

export function StockGuide({ s, k, r }: { s: any; k: string; r: any }) {
  const [tab, setTab] = useState<'t' | 'f' | 'v' | 'd'>('t');
  const tech = techItems(s);
  const fin = k === 'BONY' ? BONY_ITEMS : finItems(r);
  const items = tab === 't' ? tech : fin;
  const lead = tab === 't'
    ? 'قراءة للسعر والحجم بعد إقفال ' + s.date + '. بتوصف اللي حصل، مش بتتوقع، ومش أمر بيع أو شراء.'
    : r && r.tag ? r.tag : 'أرقام من القوائم المالية الأصلية للشركة (9 شهور لحد 30 سبتمبر 2026). كل رقم معاه معناه وتأثيره على السهم.';
  const tb = (id: 't' | 'f' | 'v' | 'd', name: string) => <button type="button" className={'gd-tab' + (tab === id ? ' on' : '')} onClick={() => setTab(id)}>{name}</button>;
  return <><TrendVerdict s={s} /><DecSum s={s} k={k} /><section className="gd" aria-label="ملخص السهم">
    <style>{CSS}</style>
    <div className="gd-tabs">{tb('t', 'الفني')}{tb('f', 'المالي')}{tb('v', 'السعر العادل')}{tb('d', 'للقرار')}</div>
    <div className="gd-body">
      {tab === 'd' ? <DecisionCard s={s} k={k} /> : tab === 'v' ? fairCard(s, k, r) : <>
        <p className="gd-lead">{lead}</p>
        {items.map((it, i) => <div key={i} className={'gd-it ' + (it.tone || '')}>
          <div className="gd-h"><span>{it.label}</span><b dir="ltr">{it.value}</b></div>
          <p><em>يعني إيه: </em>{it.mean}</p>
          <p><em>تأثيره على السهم: </em>{it.effect}</p>
        </div>)}
        {tab === 'f' && r && r.risk && <div className="gd-it mid"><div className="gd-h"><span>أهم تحذير في القوائم</span></div><p>{r.risk}</p></div>}
      </>}
      <p className="gd-foot">مش نصيحة استثمار. الشارت والتفاصيل الأعمق تحت.</p>
    </div>
  </section></>;
}
