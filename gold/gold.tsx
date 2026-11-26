import React, { useEffect, useRef } from 'react';
// All gold code in this one file (flag, data, cards, styles). Isolated from the EGX code.
// Gold tab feature flag. Staging: open the app once with #/gold?gold=1 or set localStorage egx-gold=1.
// Live: set GOLD_LIVE = true to show the tab for everyone.
export const GOLD_LIVE = false;
export function goldOn(): boolean {
  if (GOLD_LIVE) return true;
  try { if (localStorage.getItem('egx-gold') === '1') return true; if (/[?&]gold=1/.test(location.hash + location.search)) { localStorage.setItem('egx-gold', '1'); return true; } } catch (e) {}
  return false;
}

const GOLD: any = {
  "updated": "2026-11-26T18:55:00+02:00",
  "peak": { "close": 5513.43, "date": "2026-01-28", "label": "28 يناير 2026" },
  "low": { "close": 3539.37, "date": "2026-11-20", "label": "20 نوفمبر 2026" },
  "fallPct": 35.8,
  "lastSourceDate": "2026-11-23",
  "source": { "name": "goldprice.dev", "url": "https://goldprice.dev/blog/gold-drawdowns-since-1996", "note": "تواريخ الجدول مش متسقة داخل المصدر نفسه، والمطابقة لسه معلّقة" },
  "price": { "status": "not_updated", "value": null, "asOf": null, "source": null },
  "falls": [
    { "id": "1996", "label": "1996-2003", "peak": "2 فبراير 1996", "peakClose": 415.25, "low": 252.35, "pct": 39.2, "days": 2888 },
    { "id": "2006", "label": "2006-2007", "peak": "11 مايو 2006", "peakClose": 717.35, "low": 554.75, "pct": 22.7, "days": 495 },
    { "id": "2008", "label": "2008-2009", "peak": "16 مارس 2008", "peakClose": 1015.05, "low": 712.15, "pct": 29.8, "days": 549 },
    { "id": "2011", "label": "2011-2020", "peak": "22 أغسطس 2011", "peakClose": 1909.37, "low": 1053.05, "pct": 44.8, "days": 3261 },
    { "id": "2020", "label": "2020-2023", "peak": "6 أغسطس 2020", "peakClose": 2069.45, "low": 1627.10, "pct": 21.4, "days": 1212 }
  ]
};
// Final texts from the gold team (checker PASS). Do not reword.
const L = (u: string, t?: string) => <a href={u} target="_blank" rel="noreferrer" dir="ltr">{t || u}</a>;
const TAG = 'ذهب عالمي · مش مرتبط بالبورصة المصرية';

export function CorrelationCard() {
  return <section className="gd-card"><p className="gd-tag">{TAG}</p>
    <h3>الذهب والدولار وعائد السندات: وصف للماضي</h3>
    <p>الارتباط رقم بيقيس هل شيئين بيتحركوا مع بعض ولا عكس بعض. الإشارة السالبة معناها عكس بعض: لما واحد يعلى، التاني بيميل ينزل. الارتباط مش معناه إن واحد بيسبب التاني.</p>
    <p>الذهب ومؤشر الدولار الواسع (FRED DTWEXBGS): <b dir="ltr">-0.47</b> على الفترة كلها (من يناير 2006 لنوفمبر 2026)، و<b dir="ltr">-0.48</b> على آخر 10 سنين. الحجم: متوسط.</p>
    <p>الذهب وعائد سندات الخزانة الأمريكية المحمي من التضخم لـ10 سنين (FRED DFII10): <b dir="ltr">-0.33</b> على الفترة كلها، و<b dir="ltr">-0.45</b> على آخر 10 سنين. الحجم: ضعيف لحد متوسط على كل الفترة، ومتوسط على آخر 10 سنين.</p>
    <h4>الفترة الأخيرة</h4>
    <p>الدولار: -0.60 في آخر سنة (51 أسبوع، هامش خطأ حوالي ±0.28)، و-0.64 في آخر 26 أسبوع (25 أسبوع بيانات، هامش حوالي ±0.40). العائد: -0.41 في آخر سنة (±0.28)، و-0.29 في آخر 26 أسبوع (±0.40). الفترات القصيرة حساسة لأسبوع واحد. (الهامش ده نقدّر بيه الضوضاء، مش مضمون.)</p>
    <p className="gd-note">تقسيم الحجم (ضعيف، ضعيف لحد متوسط، متوسط، قوي) تقسيم تقريبي من عندنا. الأرقام محسوبة من متوسطات أسبوعية، فالرقم تقريبي، ومن نفس الأسبوع بس، ومش بتقول مين بيتحرك الأول. بيانات الدولار لحد 20 نوفمبر 2026، وبيانات العائد لحد 24 نوفمبر 2026. أحدث أسبوع للذهب (23 نوفمبر) لسه ماخلصش. اتقرت 26 نوفمبر 2026 الساعة 18:52 بتوقيت القاهرة (FRED) و18:33 تقريبًا (gold-api).</p>
    <p className="gd-note">المصادر: {L('https://fred.stlouisfed.org/series/DTWEXBGS')} · {L('https://fred.stlouisfed.org/series/DFII10')} · {L('https://gold-api.com/docs')}</p>
    <p><b>ده وصف للماضي، مش قاعدة.</b></p></section>;
}

const Cond = ({ children }: any) => <li>{children}</li>;
const NOTE_PATTERN = 'ده النمط اللي بيتشرح عادة، ومش محسوب منا.';

export function ForecastCards() {
  return <div className="gd-fc"><p className="gd-tag">{TAG}</p>
    <section className="gd-card"><h3>سيناريوهات مشروطة</h3>
      <p>ده مش توقع لسعر الذهب ومش نصيحة. الأوقات بتوقيت القاهرة (08:30 نيويورك = 15:30 القاهرة في ديسمبر).</p>
      <p>ما لقيناش مصدر مجاني نقدر نقراه ونتحقق منه لتوقعات المحللين (جربنا tradingeconomics وFedWatch)، فمفيش رقم هنسميه "المتوقع". قراءة الأرقام: 26 نوفمبر 18:52 القاهرة.</p></section>
    <section className="gd-card"><h3>الإغلاق المخزّن</h3><ul>
      <Cond>المصدر: سعر الذهب الفوري من {L('https://api.gold-api.com/price/XAU')} (من غير حساب)، بنخزّن لقطة كل يوم الساعة 17:00 نيويورك، وبنسجّل معاها وقت التحديث اللي المصدر بيرجّعه (updatedAt).</Cond>
      <Cond>17:00 نيويورك = 00:00 القاهرة في الشتا (ديسمبر). اللقطة بتتحدد بنيويورك مش بالقاهرة.</Cond>
      <Cond>"إغلاق يوم الحدث" = لقطة 17:00 نيويورك يوم الحدث، ومقارنتها بلقطة اليوم اللي قبله.</Cond>
      <Cond>لو اللقطة ما اتخزنتش أو وقتها بعيد عن 17:00: "غير محسوب"، مش خطأ.</Cond>
      <Cond>"الأفق" في كل كارت يقصد اللقطة دي.</Cond>
      <Cond>الأرقام التاريخية (القمة 5,513.43، القاع 3,539.37) من مقال {L('https://goldprice.dev/blog/gold-drawdowns-since-1996')} وبتتنقل كمصدر مش بنخزنها.</Cond></ul>
      <p className="gd-note">إغلاقنا المخزّن مش نفس إقفالات goldprice.dev، ممكن يفرق. اللقطة سعر لحظي وقت اللقطة، مش إقفال رسمي.</p></section>
    <section className="gd-card"><h3>كارت 1 · الوظائف، الجمعة 4 ديسمبر 15:30</h3><ul>
      <Cond>السابق (أكتوبر، منشور 6 نوفمبر، ممكن يتعدّل): +165 ألف وظيفة، البطالة 4.1%. {L('https://www.bls.gov/news.release/empsit.nr0.htm')}</Cond>
      <Cond>الشرط بيتحدد بعدد الوظائف بس. البطالة بتتسجل للعلم.</Cond>
      <Cond>السيناريو: لو الوظائف أعلى من الشهر اللي فات (165 ألف)، عادة الدولار والعوائد بيرتفعوا والذهب بيتضغط. لو أقل، العكس. وفي حالات كتير حصل العكس.</Cond>
      <Cond>{NOTE_PATTERN}</Cond>
      <Cond>الأفق: لقطة 4 ديسمبر 17:00 نيويورك. الموعد: {L('https://www.bls.gov/schedule/2026/12_sched.htm')}</Cond></ul></section>
    <section className="gd-card"><h3>كارت 2 · الفيدرالي، 8-9 ديسمبر</h3><ul>
      <Cond>خلفية مؤرّخة، مش تسعير حالي: لحد اجتماع أكتوبر، من محضر 18 نوفمبر: تقريبا كل المشاركين شايفين إن رفع تاني للفايدة غالبا هيكون مناسب. الفايدة وقتها 3.75-4%. {L('https://www.federalreserve.gov/monetarypolicy/fomcminutes20261028.htm')}</Cond>
      <Cond>تعريف بالرقم: يوم 8 ديسمبر نسجّل من مصدر مقروء ومؤرّخ احتمال رفع 25 نقطة أساس في اجتماع ديسمبر. "أكثر تشددا" = القرار رفع واحتمال الرفع المسجّل أقل من 50%. "أقل تشددا" = القرار تثبيت واحتمال الرفع المسجّل أكتر من 50%. غير كده = "زي المتوقع"، ما يتحسبش. لو ما لقيناش مصدر مقروء بالاحتمال: "غير متاح" والكارت ما يتحسبش. <b>(الـ50% تعريف تصميم مننا.)</b></Cond>
      <Cond>السيناريو: لو القرار أو البيان أكثر تشددا من التسعير المسجّل، عادة العوائد والدولار بيرتفعوا والذهب بيتضغط. لو أقل تشددا، العكس. وفي حالات كتير حصل العكس.</Cond>
      <Cond>{NOTE_PATTERN} التثبيت لوحده مش بيتصنف تشديد.</Cond>
      <Cond>الأفق: لقطة 9 ديسمبر 17:00 نيويورك. ساعة البيان عادة 2:00 م نيويورك (ساعة ديسمبر غير منشورة). {L('https://www.federalreserve.gov/newsevents/2026-december.htm')}</Cond></ul>
      <p className="gd-note">حالة الاحتمال المسجّل: <b>غير متاح</b> (لسه مفيش مصدر مقروء ومؤرّخ).</p></section>
    <section className="gd-card"><h3>كارت 3 · التضخم CPI، الخميس 10 ديسمبر 15:30</h3><ul>
      <Cond>السابق (أكتوبر، منشور 10 نوفمبر): الشهري +0.4%، الأساسي +0.3%. {L('https://www.bls.gov/news.release/cpi.nr0.htm')} . مفيش قيم سنوية.</Cond>
      <Cond>المرجع: تقدير نموذج Cleveland Fed (تقدير نموذج، مش توقع محللين). آخر نسخة، تحديث 25 نوفمبر: الشهري 0.00%، الأساسي 0.21%. {L('https://www.clevelandfed.org/indicators-and-data/inflation-nowcasting')} . بيتغير يومياً، فالملزم الرقم المسجّل يوم 9 ديسمبر مع تاريخه.</Cond>
      <Cond>السيناريو: لو الرقم الفعلي (الشهري، والأساسي لوحده) أعلى من تقدير النموذج المسجّل، عادة توقعات الفايدة بترتفع والذهب بيتضغط. لو أقل، العكس. وفي حالات كتير حصل العكس، والذهب أحياناً بيتشرى كحماية من التضخم.</Cond>
      <Cond>{NOTE_PATTERN}</Cond>
      <Cond>الأفق: لقطة 10 ديسمبر 17:00 نيويورك.</Cond></ul></section>
    <section className="gd-card"><h3>التقييم</h3><ul>
      <Cond>بعد الحدث سطر واحد: "الذهب قفل +X% أو -X% في نفس اليوم"، من لقطاتنا المخزّنة، من غير سبب.</Cond>
      <Cond><bdi dir="ltr">0.5%</bdi> = عتبة "ثابت"، اختيار تصميم مش مبني على بيانات.</Cond>
      <Cond>"حصلت" = اتجاه الحركة طابق الجملة المكتوبة لحالة الشرط اللي اتحقق. الحكم باللقطات المخزّنة بس.</Cond>
      <Cond>ما فيش نسبة مئوية قبل 30 توقع محسوم.</Cond></ul></section></div>;
}


const DAY = 86400000;
function cairoToday(): number {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(new Date()); // YYYY-MM-DD
  return Date.parse(p + 'T00:00:00Z');
}
const AR=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
function todayLabel(){const t=new Date(cairoToday());return t.getUTCDate()+' '+AR[t.getUTCMonth()]+' '+t.getUTCFullYear();}
export function daysSincePeak(): number { return Math.round((cairoToday() - Date.parse((GOLD as any).peak.date + 'T00:00:00Z')) / DAY); }
const nf = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function TVChart() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return; el.innerHTML = '';
    const w = document.createElement('div'); w.className = 'tradingview-widget-container__widget'; w.style.height = '100%'; w.style.width = '100%'; el.appendChild(w);
    const s = document.createElement('script'); s.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'; s.async = true;
    s.innerHTML = JSON.stringify({ autosize: true, symbol: 'OANDA:XAUUSD', interval: 'D', timezone: 'Africa/Cairo', theme: 'dark', style: '1', locale: 'ar_AE', allow_symbol_change: false, hide_side_toolbar: true, support_host: 'https://www.tradingview.com' });
    el.appendChild(s);
  }, []);
  return <div className="gd-chart"><div className="tradingview-widget-container" ref={ref} style={{ height: 420, width: '100%' }} />
    <p className="gd-note"><span dir="ltr">Indicative data · OANDA:XAUUSD</span> · بيانات إرشادية، قد تتأخر ومش سعر تنفيذ · التوقيت: القاهرة · <a href="https://www.tradingview.com/" target="_blank" rel="noreferrer">Chart by TradingView</a></p></div>;
}

function Sand() {
  const cur = Math.round(daysSincePeak() / 10);
  const rows = [...(GOLD as any).falls.map((f: any) => ({ id: f.id, label: f.label, n: Math.round(f.days / 10), days: f.days, pct: f.pct, peak: f.peak, peakClose: f.peakClose, low: f.low })), { id: 'now', label: 'دلوقتي', n: cur, days: daysSincePeak(), cur: true }];
  return <section className="gd-card"><h3>رمل الذهب</h3>
    <p className="gd-note">كل نقطة = 10 أيام. من 1996، نفس المقياس لكل نزول 20% أو أكتر. النقط محسوبة من أيام الجدول المنشور ÷ 10 (تقريبي).</p>
    {rows.map((r: any) => <div key={r.id} className="gd-row"><div className="gd-rl">{r.cur ? `دلوقتي (${r.days} يوم لحد دلوقتي)` : r.label}</div>
      <div className={'gd-dots' + (r.cur ? ' cur' : '')} role="img" aria-label={`${r.n} نقطة = ${r.days} يوم`}>{Array.from({ length: r.n }, (_, i) => <i key={i} />)}</div>
      {!r.cur && <div className="gd-rs">من إقفال {r.peak} ({nf(r.peakClose)}$) لحد أدنى إقفال {nf(r.low)}$ (-{r.pct}%) · {r.days.toLocaleString('en-US')} يوم لحد أول إقفال أعلى</div>}</div>)}
    <p className="gd-note">الأرقام على أساس الإقفال اليومي. المصدر: <a href={(GOLD as any).source.url} target="_blank" rel="noreferrer">goldprice.dev</a> · {(GOLD as any).source.note}. آخر إقفال في بيانات المصدر: 23 نوفمبر 2026.</p></section>;
}

function Waits() {
  return <section className="gd-card"><p className="gd-tag">ذهب عالمي · مش مرتبط بالبورصة المصرية</p><h3>المدة لحد أول إقفال أعلى</h3>
    <p>في الحالات الخمسة اللي فاتت (نزول 20% أو أكتر: 2011-2015، 1996-1999، 2008، 2006، 2020-2022) المدة من القمة لحد أول إقفال أعلى كانت: 3,261 / 2,888 / 549 / 495 / 1,212 يوم. الحالة الحالية لسه ما رجعتش لقمتها ({daysSincePeak()} يوم لحد {todayLabel()}).</p>
    <p className="gd-note">الأساس: الإقفال اليومي. حالات قليلة، ومفيش متوسط ولا "عادة". المصدر: <a href="https://goldprice.dev/blog/gold-drawdowns-since-1996" target="_blank" rel="noreferrer">goldprice.dev</a> (تواريخ المصدر مش متسقة، والمطابقة لسه معلّقة). أعلى سعر خلال اليوم ممكن يكون مختلف.</p></section>;
}


const N = ({ children }: any) => <bdi dir="ltr">{children}</bdi>;
const WK_SRC = 'من ملف متوسطات أسبوعية اتقرا من gold-api.com يوم 26 نوفمبر 2026 الساعة 18:33 تقريبًا بتوقيت القاهرة.';
function WeeklyCard() {
  return <section className="gd-card"><p className="gd-tag">ذهب عالمي · مش مرتبط بالبورصة المصرية</p>
    <h3>الذهب بيتحرك قد إيه في الأسبوع؟</h3>
    <p>نص الأسابيع الذهب اتحرك فيها أقل من الرقم ده (لفوق أو لتحت)، والنص التاني اتحرك أكتر. ده مش حد أقصى.</p>
    <ul>
      <li>آخر 26 أسبوع: <N>1.69%</N> مقابل <N>1.17%</N> من 2006</li>
      <li>آخر 52 أسبوع: <N>2.04%</N> مقابل <N>1.17%</N> من 2006</li>
      <li>آخر 10 سنين: <N>1.01%</N></li>
      <li>من 2006 لحد دلوقتي: <N>1.17%</N></li></ul>
    <p>الأسابيع الكبيرة: من 1,091 أسبوع، 28 أسبوع (<N>2.6%</N>) اتحركوا أكتر من 5% لفوق أو لتحت. في آخر 52 أسبوع كانوا 5 أسابيع (<N>9.6%</N>).</p>
    <p>تذكير إن الأرقام الأسبوعية بتخبي أيام كبيرة: أكبر نزول في يوم واحد (إغلاق لإغلاق) كان <N>10.0%</N> في 30 يناير 2026 (goldprice.dev: <a href="https://goldprice.dev/blog/gold-drawdowns-since-1996" target="_blank" rel="noreferrer" dir="ltr">https://goldprice.dev/blog/gold-drawdowns-since-1996</a>). الصفحة دي بتتحدث وتواريخها مش متسقة، فالتاريخ ده تقريبي.</p>
    <p>أعلى سعر لحظي 29 يناير · أعلى إقفال 28 يناير · أكبر نزول يومي 30 يناير</p>
    <p>متوسطات السعر (دولار للأونصة):</p>
    <ul>
      <li>آخر 10 أسابيع: <N>4,011</N></li>
      <li>آخر 40 أسبوع: <N>4,371</N></li>
      <li>الأسبوع الحالي (أسبوع 23 نوفمبر، لسه ماخلصش، ممكن يتغير): <N>3,584</N></li></ul>
    <p>كلها متوسطات أسبوعية، فالأرقام تقريبية. الحركة الفعلية جوه الأسبوع أكبر.</p>
    <p className="gd-note">أعلى سعر لحظي: 5,594.82 في 29 يناير 2026 (رويترز، سعر فوري): <a href="https://www.reuters.com/world/china/asia-gold-india-gold-premiums-decadal-high-china-demand-undeterred-by-price-rise-2026-01-30/" target="_blank" rel="noreferrer" dir="ltr">https://www.reuters.com/world/china/asia-gold-india-gold-premiums-decadal-high-china-demand-undeterred-by-price-rise-2026-01-30/</a><br />أعلى متوسط أسبوعي: 5,213 (أسبوع 23 فبراير 2026). المقياسين مختلفين ومينفعش يتقارنوا.</p>
    <p className="gd-note">بيانات لحد أسبوع 23 نوفمبر 2026.<br />المصدر: {WK_SRC}</p>
    <p><b>ده سياق مش توقع.</b></p></section>;
}
function TroughCard() {
  return <section className="gd-card"><p className="gd-tag">ذهب عالمي · مش مرتبط بالبورصة المصرية</p>
    <h3>حصل إيه بعد قيعان الذهب اللي فاتت؟</h3>
    <p>الارتفاع بعد أقل متوسط أسبوعي، بعد 26 و52 و104 أسبوع:</p>
    <ul>
      <li>2008 (القاع: أسبوع 10 نوفمبر 2008): <N>+25.4%</N> / <N>+51.1%</N> / <N>+89.6%</N></li>
      <li>2011-2015 (القاع: أسبوع 14 ديسمبر 2015): <N>+21.2%</N> / <N>+7.7%</N> / <N>+17.3%</N></li>
      <li>2020-2022 (القاع: أسبوع 17 أكتوبر 2022): <N>+21.6%</N> / <N>+18.4%</N> / <N>+62.9%</N></li></ul>
    <p>3 حالات بس، والأرقام تقريبية. النتيجة اختلفت جدًا: بعد سنة، من <N>+7.7%</N> لحد <N>+51.1%</N>. مفيش قاعدة هنا.</p>
    <p>القاع بيتعرف بعد ما يحصل، مش وقتها.</p>
    <p>الحالة الحالية لسه مفتوحة ومفيش قاع مؤكد. أقل متوسط أسبوعي لحد دلوقتي 3,584 (أسبوع 23 نوفمبر، لسه ماخلصش، ممكن يتغير).</p>
    <p>القيعان هنا محسوبة من المتوسط الأسبوعي، مش من أقل إغلاق يومي، فمش هتطابق جدول النزول 20% أو أكتر.</p>
    <p className="gd-note">بيانات لحد أسبوع 23 نوفمبر 2026.<br />المصدر: {WK_SRC}</p>
    <p><b>ده وصف للماضي، مش توقع.</b></p></section>;
}

const STATUS: Record<string, string> = { verified: 'متحقق منه', gap: 'فجوة بين المصادر', mismatch: 'اختلاف بين المصادر', delayed: 'متأخر', not_updated: 'غير محدّث', closed: 'السوق مقفول' };

export function GoldTab() {
  injectGoldCss();
  const g: any = GOLD; const d = daysSincePeak();
  return <div className="eg-pad gold" dir="rtl">
    <p className="gd-tag">ذهب عالمي · مش مرتبط بالبورصة المصرية</p>
    <section className="gd-hero"><small>من {g.peak.label} (أعلى إقفال)</small><div className="gd-count">{d}</div><b>يوم من القمة ولسه ما رجعش لقمته</b><small className="gd-asof">العدد لحد {todayLabel()} (توقيت القاهرة)</small>
      <p>العداد بيمشي من ساعة جهازك. أعمق نزول لحد آخر إقفال في المصدر ({g.lastSourceDate.split('-').reverse().join('/')}): {g.fallPct}% (إقفال {nf(g.peak.close)}$ لحد {nf(g.low.close)}$ يوم {g.low.label}، يعني 296 يوم من القمة للقاع). الأساس: الإقفال اليومي. أعلى سعر خلال اليوم ممكن يكون مختلف.</p>
      <p className="gd-ref">سعر مرجعي: <b>{STATUS[g.price.status]}</b>{g.price.value ? ' ' + g.price.value : ''} · بنعرض السعر بس لما يكون له مصدر وتوقيت.</p></section>
    <TVChart />
    <Sand />
    <Waits />
    <WeeklyCard />
    <TroughCard />
    <ForecastCards />
    <CorrelationCard />
  </div>;
}

const GOLD_CSS = `.gold{max-width:560px;margin:0 auto;color:#dfe6f2}
.gd-tag{color:#d9b43a;font-size:13px;text-align:center;margin:6px 0}
.gd-hero{text-align:center;background:radial-gradient(ellipse at top,#3a3210 0,#0f1520 70%);border-radius:14px;padding:14px 12px;margin:8px 0}
.gd-hero small{color:#9fb0c8}.gd-count{font-size:76px;line-height:1;font-weight:700;color:#e8c14a;direction:ltr}
.gd-hero p{font-size:12.5px;color:#aab6c9;margin:6px 0}.gd-ref b{color:#e8c14a}
.gd-card,.gd-chart{background:#141b29;border-radius:14px;padding:12px;margin:10px 0}
.gd-card h3{color:#e8c14a;margin:0 0 4px}.gd-note{font-size:12px;color:#9fb0c8}
.gd-note a{color:#9fb0c8}
.gd-row{margin:10px 0}.gd-rl{font-size:13px;margin-bottom:4px}.gd-rs{font-size:11.5px;color:#8c9bb3;margin-top:4px}
.gd-dots{display:grid;grid-template-columns:repeat(auto-fill,6px);gap:2px;direction:ltr}
.gd-dots i{width:6px;height:6px;border-radius:50%;background:#8da0c0;display:block}
.gd-dots.cur i{background:#e8c14a}
.gd-asof{display:block;margin:2px 0}
.gold{box-sizing:border-box;width:100%;overflow-x:hidden}
.gold *{box-sizing:border-box;max-width:100%}
.gold a,.gold p,.gold li{overflow-wrap:anywhere;word-break:break-word}
.gold a[dir=ltr]{unicode-bidi:plaintext;display:inline}
.gold ul{padding:0 18px 0 0;margin:6px 0}.gold li{margin:6px 0;font-size:13.5px;line-height:1.7}
.gold p{font-size:13.5px;line-height:1.7}.gold h4{margin:8px 0 2px;color:#e8c14a;font-size:13px}
.gd-card .gd-tag{text-align:right;margin:0 0 4px}
`;
function injectGoldCss() { if (!document.getElementById('gold-css')) { const st = document.createElement('style'); st.id = 'gold-css'; st.textContent = GOLD_CSS; document.head.appendChild(st); } }
