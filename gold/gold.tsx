import React, { useEffect, useRef } from 'react';
// All gold code in this one file (flag, data, cards, styles). Isolated from the EGX code.

// Keep numbers, signs and % in left-to-right order inside Arabic lines (wraps number tokens only; text unchanged).
const NUM_RE = /(^|[^\dA-Za-z.,:%+\-$])([+\-]?\$?\d(?:[\d,.:]*\d)?(?:-\d(?:[\d,.:]*\d)?)?%?)/g;
function fixNums(c: any): any {
  if (typeof c === 'string') {
    const out: any[] = []; let last = 0; let m: RegExpExecArray | null; NUM_RE.lastIndex = 0;
    while ((m = NUM_RE.exec(c))) { const start = m.index + m[1].length; if (start > last) out.push(c.slice(last, start)); out.push(<bdi key={start} dir="ltr">{m[2]}</bdi>); last = start + m[2].length; }
    if (last < c.length) out.push(c.slice(last));
    return out;
  }
  if (Array.isArray(c)) return c.map((x, i) => <React.Fragment key={i}>{fixNums(x)}</React.Fragment>);
  if (React.isValidElement(c) && typeof c.type === 'string' && (c.type === 'b' || c.type === 'span')) return React.cloneElement(c as any, {}, fixNums((c as any).props.children));
  return c;
}
const P = (p: any) => <p {...p}>{fixNums(p.children)}</p>;
const H3 = (p: any) => <h3 {...p}>{fixNums(p.children)}</h3>;
const H4 = (p: any) => <h4 {...p}>{fixNums(p.children)}</h4>;
const Li = (p: any) => <li {...p}>{fixNums(p.children)}</li>;
// Gold tab feature flag. Staging: open the app once with #/gold?gold=1 or set localStorage egx-gold=1.
// Live: set GOLD_LIVE = true to show the tab for everyone.
export const GOLD_LIVE = true;
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
const shortLabel = (u: string) => { try { const x = new URL(u); const h = x.hostname.replace(/^www\./, ''); const last = x.pathname.split('/').filter(Boolean).pop() || ''; return h.indexOf('fred') === 0 ? h + ' · ' + last : h; } catch (e) { return u; } };
const L = (u: string, t?: string) => <a href={u} target="_blank" rel="noreferrer" dir="ltr">{t || shortLabel(u)}</a>;
const TAG = 'ذهب عالمي · مش مرتبط بالبورصة المصرية';

export function CorrelationCard() {
  return <section className="gd-card"><P className="gd-tag">{TAG}</P>
    <H3>الذهب والدولار وعائد السندات: وصف للماضي</H3>
    <P>الارتباط رقم بيقيس هل شيئين بيتحركوا مع بعض ولا عكس بعض. الإشارة السالبة معناها عكس بعض: لما واحد يعلى، التاني بيميل ينزل. الارتباط مش معناه إن واحد بيسبب التاني.</P>
    <P>الذهب ومؤشر الدولار الواسع (FRED DTWEXBGS): <b>سالب 0.47</b> على الفترة كلها (من يناير 2006 لنوفمبر 2026)، و<b>سالب 0.48</b> على آخر 10 سنين. الحجم: متوسط.</P>
    <P>الذهب وعائد سندات الخزانة الأمريكية المحمي من التضخم لـ10 سنين (FRED DFII10): <b>سالب 0.33</b> على الفترة كلها، و<b>سالب 0.45</b> على آخر 10 سنين. الحجم: ضعيف لحد متوسط على كل الفترة، ومتوسط على آخر 10 سنين.</P>
    <H4>الفترة الأخيرة</H4>
    <P>الدولار (لحد أسبوع 16 نوفمبر): سالب 0.60 في آخر سنة (52 أسبوع، هامش خطأ حوالي 0.28 لفوق أو لتحت)، وسالب 0.64 في آخر 26 أسبوع (هامش خطأ حوالي 0.40 لفوق أو لتحت). العائد (لحد أسبوع 16 نوفمبر): سالب 0.46 في آخر سنة (52 أسبوع، هامش خطأ حوالي 0.28 لفوق أو لتحت)، وسالب 0.35 في آخر 26 أسبوع (هامش خطأ حوالي 0.40 لفوق أو لتحت). الفترات القصيرة حساسة لأسبوع واحد. (الهامش ده نقدّر بيه الضوضاء، مش مضمون.)</P>
    <P className="gd-note">تقسيم الحجم (ضعيف، ضعيف لحد متوسط، متوسط، قوي) تقسيم تقريبي من عندنا. الأرقام محسوبة من متوسطات أسبوعية، فالرقم تقريبي، ومن نفس الأسبوع بس، ومش بتقول مين بيتحرك الأول. بيانات الدولار لحد 20 نوفمبر 2026، وبيانات العائد لحد 24 نوفمبر 2026. أحدث أسبوع للذهب (23 نوفمبر) لسه ماخلصش. اتقرت 26 نوفمبر 2026 الساعة 18:52 بتوقيت القاهرة (FRED) و18:33 تقريبًا (gold-api).</P>
    <P className="gd-note">المصادر:</P><ul className="gd-note"><li>{L('https://fred.stlouisfed.org/series/DTWEXBGS','DTWEXBGS (FRED)')}</li><li>{L('https://fred.stlouisfed.org/series/DFII10','DFII10 (FRED)')}</li><li>{L('https://gold-api.com/docs','gold-api.com')}</li></ul>
    <P><b>ده وصف للماضي، مش قاعدة.</b></P></section>;
}

const Cond = ({ children }: any) => <Li>{children}</Li>;
const NOTE_PATTERN = 'ده النمط اللي بيتشرح عادة، ومش محسوب منا.';

export function ForecastCards() {
  return <div className="gd-fc"><P className="gd-tag">{TAG}</P>
    <section className="gd-card"><H3>سيناريوهات مشروطة</H3>
      <P>ده مش توقع لسعر الذهب ومش نصيحة. الأوقات بتوقيت القاهرة (08:30 نيويورك = 15:30 القاهرة في ديسمبر).</P>
      <P>ما لقيناش مصدر مجاني نقدر نقراه ونتحقق منه لتوقعات المحللين (جربنا tradingeconomics وFedWatch)، فمفيش رقم هنسميه "المتوقع". قراءة الأرقام: 26 نوفمبر 18:52 القاهرة.</P></section>
    <section className="gd-card"><H3>الإغلاق المخزّن</H3><ul>
      <Cond>المصدر: سعر الذهب الفوري من {L('https://api.gold-api.com/price/XAU')} (من غير حساب)، بنخزّن لقطة كل يوم الساعة 17:00 نيويورك، وبنسجّل معاها وقت التحديث اللي المصدر بيرجّعه (updatedAt).</Cond>
      <Cond>17:00 نيويورك = 00:00 القاهرة في الشتا (ديسمبر). اللقطة بتتحدد بنيويورك مش بالقاهرة.</Cond>
      <Cond>"إغلاق يوم الحدث" = لقطة 17:00 نيويورك يوم الحدث، ومقارنتها بلقطة اليوم اللي قبله.</Cond>
      <Cond>لو اللقطة ما اتخزنتش أو وقتها بعيد عن 17:00: "غير محسوب"، مش خطأ.</Cond>
      <Cond>"الأفق" في كل كارت يقصد اللقطة دي.</Cond>
      <Cond>الأرقام التاريخية (القمة 5,513.43، القاع 3,539.37) من مقال {L('https://goldprice.dev/blog/gold-drawdowns-since-1996')} وبتتنقل كمصدر مش بنخزنها.</Cond></ul>
      <P className="gd-note">إغلاقنا المخزّن مش نفس إقفالات goldprice.dev، ممكن يفرق. اللقطة سعر لحظي وقت اللقطة، مش إقفال رسمي.</P></section>
    <section className="gd-card"><H3>كارت 1 · الوظائف، الجمعة 4 ديسمبر 15:30</H3><ul>
      <Cond>السابق (أكتوبر، منشور 6 نوفمبر، ممكن يتعدّل): زيادة 165 ألف وظيفة، البطالة 4.1%. {L('https://www.bls.gov/news.release/empsit.nr0.htm')}</Cond>
      <Cond>الشرط بيتحدد بعدد الوظائف بس. البطالة بتتسجل للعلم.</Cond>
      <Cond>السيناريو: لو الوظائف أعلى من الشهر اللي فات (165 ألف)، عادة الدولار والعوائد بيرتفعوا والذهب بيتضغط. لو أقل، العكس. وفي حالات كتير حصل العكس.</Cond>
      <Cond>{NOTE_PATTERN}</Cond>
      <Cond>الأفق: لقطة 4 ديسمبر 17:00 نيويورك. الموعد: {L('https://www.bls.gov/schedule/2026/12_sched.htm')}</Cond></ul></section>
    <section className="gd-card"><H3>كارت 2 · الفيدرالي، 8-9 ديسمبر</H3><ul>
      <Cond>خلفية مؤرّخة، مش تسعير حالي: لحد اجتماع أكتوبر، من محضر 18 نوفمبر: تقريبا كل المشاركين شايفين إن رفع تاني للفايدة غالبا هيكون مناسب. الفايدة وقتها من 3.75% لـ 4%. {L('https://www.federalreserve.gov/monetarypolicy/fomcminutes20261028.htm')}</Cond>
      <Cond>تعريف بالرقم: يوم 8 ديسمبر نسجّل من مصدر مقروء ومؤرّخ احتمال رفع 25 نقطة أساس في اجتماع ديسمبر. "أكثر تشددا" = القرار رفع واحتمال الرفع المسجّل أقل من 50%. "أقل تشددا" = القرار تثبيت واحتمال الرفع المسجّل أكتر من 50%. غير كده = "زي المتوقع"، ما يتحسبش. لو ما لقيناش مصدر مقروء بالاحتمال: "غير متاح" والكارت ما يتحسبش. <b>(الـ50% تعريف تصميم مننا.)</b></Cond>
      <Cond>السيناريو: لو القرار أو البيان أكثر تشددا من التسعير المسجّل، عادة العوائد والدولار بيرتفعوا والذهب بيتضغط. لو أقل تشددا، العكس. وفي حالات كتير حصل العكس.</Cond>
      <Cond>{NOTE_PATTERN} التثبيت لوحده مش بيتصنف تشديد.</Cond>
      <Cond>الأفق: لقطة 9 ديسمبر 17:00 نيويورك. ساعة البيان عادة 2:00 م نيويورك (ساعة ديسمبر غير منشورة). {L('https://www.federalreserve.gov/newsevents/2026-december.htm')}</Cond></ul>
      <P className="gd-note">حالة الاحتمال المسجّل: <b>غير متاح</b> (لسه مفيش مصدر مقروء ومؤرّخ).</P></section>
    <section className="gd-card"><H3>كارت 3 · التضخم CPI، الخميس 10 ديسمبر 15:30</H3><ul>
      <Cond>السابق (أكتوبر، منشور 10 نوفمبر): الشهري ارتفع 0.4%، الأساسي ارتفع 0.3%. {L('https://www.bls.gov/news.release/cpi.nr0.htm')}. مفيش قيم سنوية.</Cond>
      <Cond>المرجع: تقدير نموذج Cleveland Fed (تقدير نموذج، مش توقع محللين). آخر نسخة، تحديث 25 نوفمبر: الشهري 0.00%، الأساسي 0.21%. {L('https://www.clevelandfed.org/indicators-and-data/inflation-nowcasting')} . بيتغير يومياً، فالملزم الرقم المسجّل يوم 9 ديسمبر مع تاريخه.</Cond>
      <Cond>السيناريو: لو الرقم الفعلي (الشهري، والأساسي لوحده) أعلى من تقدير النموذج المسجّل، عادة توقعات الفايدة بترتفع والذهب بيتضغط. لو أقل، العكس. وفي حالات كتير حصل العكس، والذهب أحياناً بيتشرى كحماية من التضخم.</Cond>
      <Cond>{NOTE_PATTERN}</Cond>
      <Cond>الأفق: لقطة 10 ديسمبر 17:00 نيويورك.</Cond></ul></section>
    <section className="gd-card"><H3>التقييم</H3><ul>
      <Cond>بعد الحدث سطر واحد: "الذهب قفل بزيادة X% أو بنقص X% في نفس اليوم"، من لقطاتنا المخزّنة، من غير سبب.</Cond>
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

function TVChart({ h = 420 }: { h?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return; el.innerHTML = '';
    const w = document.createElement('div'); w.className = 'tradingview-widget-container__widget'; w.style.height = '100%'; w.style.width = '100%'; el.appendChild(w);
    const s = document.createElement('script'); s.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'; s.async = true;
    s.innerHTML = JSON.stringify({ autosize: true, symbol: 'OANDA:XAUUSD', interval: 'D', timezone: 'Africa/Cairo', theme: 'dark', style: '1', locale: 'ar_AE', allow_symbol_change: false, hide_side_toolbar: true, support_host: 'https://www.tradingview.com' });
    el.appendChild(s);
  }, []);
  return <div className="gd-chart"><div className="tradingview-widget-container" ref={ref} style={{ height: h, width: '100%' }} />
    <P className="gd-note"><span dir="ltr">Indicative data · OANDA:XAUUSD</span> · بيانات إرشادية، قد تتأخر ومش سعر تنفيذ · التوقيت: القاهرة · <a href="https://www.tradingview.com/" target="_blank" rel="noreferrer">Chart by TradingView</a></P></div>;
}

function Sand() {
  const cur = Math.round(daysSincePeak() / 10);
  const rows = [...(GOLD as any).falls.map((f: any) => ({ id: f.id, label: f.label, n: Math.round(f.days / 10), days: f.days, pct: f.pct, peak: f.peak, peakClose: f.peakClose, low: f.low })), { id: 'now', label: 'دلوقتي', n: cur, days: daysSincePeak(), cur: true }];
  return <section className="gd-card"><H3>رمل الذهب</H3>
    <P className="gd-note">كل نقطة = 10 أيام. من 1996، نفس المقياس لكل نزول 20% أو أكتر. النقط محسوبة من أيام الجدول المنشور ÷ 10 (تقريبي).</P>
    {rows.map((r: any) => <div key={r.id} className="gd-row"><div className="gd-rl">{fixNums(r.cur ? `دلوقتي (${r.days} يوم لحد دلوقتي)` : r.label)}</div>
      <div className={'gd-dots' + (r.cur ? ' cur' : '')} role="img" aria-label={`${r.n} نقطة = ${r.days} يوم`}>{Array.from({ length: r.n }, (_, i) => <i key={i} />)}</div>
      {!r.cur && <div className="gd-rs">من إقفال {r.peak} (<bdi dir="ltr">${nf(r.peakClose)}</bdi>) لحد أدنى إقفال <bdi dir="ltr">${nf(r.low)}</bdi> <span style={{whiteSpace:'nowrap'}}>(نزل <bdi dir="ltr">{r.pct}%</bdi>)</span> · <bdi dir="ltr">{r.days.toLocaleString('en-US')}</bdi> يوم لحد أول إقفال أعلى</div>}</div>)}
    <P className="gd-note">الأرقام على أساس الإقفال اليومي. المصدر: <a href={(GOLD as any).source.url} target="_blank" rel="noreferrer">goldprice.dev</a> · {(GOLD as any).source.note}. آخر إقفال في بيانات المصدر: 23 نوفمبر 2026.</P></section>;
}

function Waits() {
  return <section className="gd-card"><P className="gd-tag">ذهب عالمي · مش مرتبط بالبورصة المصرية</P><H3>المدة لحد أول إقفال أعلى</H3>
    <P>في الحالات الخمسة اللي فاتت (نزول 20% أو أكتر)، المدة من القمة لحد أول إقفال أعلى كانت:</P>
    <ul>{(GOLD as any).falls.map((f: any) => <Li key={f.id}>{f.label}: {f.days.toLocaleString('en-US')} يوم</Li>)}</ul>
    <P>الحالة الحالية لسه ما رجعتش لقمتها ({daysSincePeak()} يوم لحد {todayLabel()}).</P>
    <P className="gd-note">الأساس: الإقفال اليومي. حالات قليلة، ومفيش متوسط ولا "عادة". المصدر: <a href="https://goldprice.dev/blog/gold-drawdowns-since-1996" target="_blank" rel="noreferrer">goldprice.dev</a> (تواريخ المصدر مش متسقة، والمطابقة لسه معلّقة). أعلى سعر خلال اليوم ممكن يكون مختلف.</P></section>;
}


const N = ({ children }: any) => <bdi dir="ltr">{children}</bdi>;
const WK_SRC = 'من ملف متوسطات أسبوعية اتقرا من gold-api.com يوم 26 نوفمبر 2026 الساعة 18:33 تقريبًا بتوقيت القاهرة.';
function WeeklyCard() {
  return <section className="gd-card"><P className="gd-tag">ذهب عالمي · مش مرتبط بالبورصة المصرية</P>
    <H3>الذهب بيتحرك قد إيه في الأسبوع؟</H3>
    <P>نص الأسابيع الذهب اتحرك فيها أقل من الرقم ده (لفوق أو لتحت)، والنص التاني اتحرك أكتر. ده مش حد أقصى.</P>
    <ul>
      <Li>آخر 26 أسبوع: <N>1.69%</N> مقابل <N>1.17%</N> من 2006</Li>
      <Li>آخر 52 أسبوع: <N>2.04%</N> مقابل <N>1.17%</N> من 2006</Li>
      <Li>آخر 10 سنين: <N>1.01%</N></Li>
      <Li>من 2006 لحد دلوقتي: <N>1.17%</N></Li></ul>
    <P>الأسابيع الكبيرة: من 1,091 أسبوع، 28 أسبوع (<N>2.6%</N>) اتحركوا أكتر من 5% لفوق أو لتحت. في آخر 52 أسبوع كانوا 5 أسابيع (<N>9.6%</N>).</P>
    <P>تذكير إن الأرقام الأسبوعية بتخبي أيام كبيرة: أكبر نزول في يوم واحد (إغلاق لإغلاق) كان <N>10.0%</N> في 30 يناير 2026 (goldprice.dev: <a href="https://goldprice.dev/blog/gold-drawdowns-since-1996" target="_blank" rel="noreferrer" dir="ltr">https://goldprice.dev/blog/gold-drawdowns-since-1996</a>). الصفحة دي بتتحدث وتواريخها مش متسقة، فالتاريخ ده تقريبي.</P>
    <P>أعلى سعر لحظي 29 يناير · أعلى إقفال 28 يناير · أكبر نزول يومي 30 يناير</P>
    <P>متوسطات السعر (دولار للأونصة):</P>
    <ul>
      <Li>آخر 10 أسابيع: <N>4,011</N></Li>
      <Li>آخر 40 أسبوع: <N>4,371</N></Li>
      <Li>الأسبوع الحالي (أسبوع 23 نوفمبر، لسه ماخلصش، ممكن يتغير): <N>3,584</N></Li></ul>
    <P>كلها متوسطات أسبوعية، فالأرقام تقريبية. الحركة الفعلية جوه الأسبوع أكبر.</P>
    <P className="gd-note">أعلى سعر لحظي: 5,594.82 في 29 يناير 2026 (رويترز، سعر فوري): <a href="https://www.reuters.com/world/china/asia-gold-india-gold-premiums-decadal-high-china-demand-undeterred-by-price-rise-2026-01-30/" target="_blank" rel="noreferrer" dir="ltr">reuters.com</a><br />أعلى متوسط أسبوعي: 5,213 (أسبوع 23 فبراير 2026). المقياسين مختلفين ومينفعش يتقارنوا.</P>
    <P className="gd-note">بيانات لحد أسبوع 23 نوفمبر 2026.<br />المصدر: {WK_SRC}</P>
    <P><b>ده سياق مش توقع.</b></P></section>;
}
function TroughCard() {
  return <section className="gd-card"><P className="gd-tag">ذهب عالمي · مش مرتبط بالبورصة المصرية</P>
    <H3>حصل إيه بعد قيعان الذهب اللي فاتت؟</H3>
    <P>الارتفاع بعد أقل متوسط أسبوعي، بعد 26 و52 و104 أسبوع:</P>
    <ul>
      <Li>2008 (القاع: أسبوع 10 نوفمبر 2008):<ul>
        <Li>بعد 26 أسبوع: ارتفع <N>25.4%</N></Li>
        <Li>بعد 52 أسبوع: ارتفع <N>51.1%</N></Li>
        <Li>بعد 104 أسبوع: ارتفع <N>89.6%</N></Li></ul></Li>
      <Li>2011-2015 (القاع: أسبوع 14 ديسمبر 2015):<ul>
        <Li>بعد 26 أسبوع: ارتفع <N>21.2%</N></Li>
        <Li>بعد 52 أسبوع: ارتفع <N>7.7%</N></Li>
        <Li>بعد 104 أسبوع: ارتفع <N>17.3%</N></Li></ul></Li>
      <Li>2020-2022 (القاع: أسبوع 17 أكتوبر 2022):<ul>
        <Li>بعد 26 أسبوع: ارتفع <N>21.6%</N></Li>
        <Li>بعد 52 أسبوع: ارتفع <N>18.4%</N></Li>
        <Li>بعد 104 أسبوع: ارتفع <N>62.9%</N></Li></ul></Li></ul>
    <P>3 حالات بس، والأرقام تقريبية. النتيجة اختلفت جدًا: بعد سنة، الارتفاع كان من <N>7.7%</N> لحد <N>51.1%</N>. مفيش قاعدة هنا.</P>
    <P>القاع بيتعرف بعد ما يحصل، مش وقتها.</P>
    <P>الحالة الحالية لسه مفتوحة ومفيش قاع مؤكد. أقل متوسط أسبوعي لحد دلوقتي 3,584 (أسبوع 23 نوفمبر، لسه ماخلصش، ممكن يتغير).</P>
    <P>القيعان هنا محسوبة من المتوسط الأسبوعي، مش من أقل إغلاق يومي، فمش هتطابق جدول النزول 20% أو أكتر.</P>
    <P className="gd-note">بيانات لحد أسبوع 23 نوفمبر 2026.<br />المصدر: {WK_SRC}</P>
    <P><b>ده وصف للماضي، مش توقع.</b></P></section>;
}

const STATUS: Record<string, string> = { verified: 'متحقق منه', gap: 'فجوة بين المصادر', mismatch: 'اختلاف بين المصادر', delayed: 'متأخر', not_updated: 'غير محدّث', closed: 'السوق مقفول' };


// v2 preview (bigger chart + inner tabs). Open with #/gold?v2=1. Public tab is unchanged until V2_LIVE = true.
export const V2_LIVE = false;
function v2On(): boolean { if (V2_LIVE) return true; try { return /[?&]v2=1/.test(location.hash + location.search); } catch (e) { return false; } }
const DISCLAIMER = 'الاستثمار (في الأسهم أو الذهب) فيه مخاطر.';
const TABS: { id: string; label: string }[] = [{ id: 'ov', label: 'نظرة عامة' }, { id: 'news', label: 'أخبار' }, { id: 'ana', label: 'تحليل' }, { id: 'ops', label: 'آراء المحللين' }, { id: 'fc', label: 'التوقعات' }];
const ITEMS: Record<string, any[]> = { news: [], ana: [], ops: [], fc3: [] };
function ItemList({ id }: { id: string }) {
  const items = ITEMS[id] || [];
  return <section className="gd-card">
    {id === 'ops' && <P className="gd-note">آراء منشورة من جهات تانية، بأرقامها وكلامها زي ما اتنشرت. مش رأينا ومش توصية.</P>}
    {items.length === 0 && <P>لسه مفيش عناصر متأكدة هنا.</P>}
    {items.map((it: any, i: number) => <div key={i} className="gld-item">
      <b>{it.title}</b>
      <div className="gd-rs">{id === 'ops' ? 'رأي منشور من جهة تانية: ' : ''}{it.source} · {it.date} {it.time} (توقيت القاهرة){it.unconfirmed ? ' · غير مؤكد' : ''}</div>
      <a href={it.url} target="_blank" rel="noreferrer" dir="ltr">{it.linkLabel || it.source}</a></div>)}
    <P className="gd-note">{DISCLAIMER}</P></section>;
}
// Forecasts data. Built to record schema v2 (records immutable, results separate). Preview only until checker and skeptic clear it.
const FC_RECORDS: any[] = [{"id": "tp-g1", "lead_row_id": "g1", "kind": "third_party", "lead_kind": "year_end", "view": "speculator", "horizon_days": 55, "org": "Goldman Sachs Research", "title_ar": "Goldman Sachs Research", "targets": [{"label_ar": "نهاية 2026", "value_usd": 4150, "horizon_date": "2026-12-31"}], "value_text_ar": "سعر آخر السنة: 4,150 $ للأونصة (نهاية 2026)", "source_published_at": "2026-11-06", "source_url": "https://www.investing.com/news/commodities-news/goldman-lowers-yearend-gold-price-forecast-on-hawkish-fed-shift-5006662", "previous_source_url": null, "status_ar": "غير مؤكد", "unconfirmed": true, "previous_value_verified": null, "scoring": "level", "scoring_note_ar": "الرقم يتقارن بلقطة يوم الأفق، خطأ %", "previous_value_text": "4,650", "changes": [{"changed_on": "2026-11-06", "old": "4,650", "new": "4,150", "reason_stated_by_source_ar": "حسب المصدر: تحول الفيدرالي لموقف أكثر تشددا", "reason_url": "https://www.investing.com/news/commodities-news/goldman-lowers-yearend-gold-price-forecast-on-hawkish-fed-shift-5006662", "reason_extra": null}], "before_nov20_low_ar": "قبل 20 نوفمبر", "group_ar": "سعر آخر السنة", "lead_note_ar": "مصدرين تانيين اتفقوا (Investing.com وKitco)، صفحة جولدمان ما اتقرتش.", "method_ar": "رأي منشور من جهة تانية، مش حسابنا", "invalidated_by_ar": "الجهة تنشر رقم جديد، أو إغلاق يوم الأفق بعيد عن الرقم (يتسجّل ويتقيّم)", "news_ids": [], "event_ids": [], "snapshot_rule": "لقطة gold-api XAU الساعة 17:00 نيويورك يوم الأفق (مقارنة الرقم باللقطة، خطأ %)", "disclaimer_ar": "ده رأي الجهة، مش توقع منا ومش نصيحة.", "view_note_ar": null, "sha256": "d0f713db9cc9e9884c0727d02562a866593e46d04ec6354e428ed3d89180e582"}, {"id": "tp-g2", "lead_row_id": "g2", "kind": "third_party", "lead_kind": "year_end", "view": "investor", "horizon_days": 412, "org": "Goldman Sachs Research", "title_ar": "Goldman Sachs Research", "targets": [{"label_ar": "نهاية 2027", "value_usd": 4650, "horizon_date": "2027-12-31"}], "value_text_ar": "سعر آخر السنة: 4,650 $ للأونصة (نهاية 2027)", "source_published_at": "2026-11-14", "source_url": "https://www.investing.com/news/commodities-news/goldman-sachs-just-slashed-its-2027-gold-forecast-here-are-the-new-numbers-5027310", "previous_source_url": null, "status_ar": "غير مؤكد", "unconfirmed": true, "previous_value_verified": null, "scoring": "level", "scoring_note_ar": "الرقم يتقارن بلقطة يوم الأفق، خطأ %", "previous_value_text": "4,800", "changes": [{"changed_on": "2026-11-06", "old": "5,400", "new": "4,800", "reason_stated_by_source_ar": "حسب المصدر: تحول الفيدرالي لموقف أكثر تشددا", "reason_url": "https://www.investing.com/news/commodities-news/goldman-lowers-yearend-gold-price-forecast-on-hawkish-fed-shift-5006662", "reason_extra": null}, {"changed_on": "2026-11-14", "old": "4,800", "new": "4,650", "reason_stated_by_source_ar": "حسب المصدر: توقعات رفع تاني للفايدة ممكن تضغط على طلب المستثمرين", "reason_url": "https://www.investing.com/news/commodities-news/goldman-sachs-just-slashed-its-2027-gold-forecast-here-are-the-new-numbers-5027310", "reason_extra": null}], "before_nov20_low_ar": "قبل 20 نوفمبر", "group_ar": "سعر آخر السنة", "lead_note_ar": "4,650 (14 نوفمبر، Investing.com؛ اتقرا تاني 17 نوفمبر). Kitco 13 نوفمبر كتب 4,800 (قبل التعديل). صفحة جولدمان نفسها ما اتقرتش.", "method_ar": "رأي منشور من جهة تانية، مش حسابنا", "invalidated_by_ar": "الجهة تنشر رقم جديد، أو إغلاق يوم الأفق بعيد عن الرقم (يتسجّل ويتقيّم)", "news_ids": [], "event_ids": [], "snapshot_rule": "لقطة gold-api XAU الساعة 17:00 نيويورك يوم الأفق (مقارنة الرقم باللقطة، خطأ %)", "disclaimer_ar": "ده رأي الجهة، مش توقع منا ومش نصيحة.", "view_note_ar": null, "sha256": "6698b1229e78eb36ed49cc39dab227b6a5f7ae979b5d84049d200e63f0058ab6"}, {"id": "tp-g3", "lead_row_id": "g3", "kind": "third_party", "lead_kind": "year_end", "view": "investor", "horizon_days": 775, "org": "Goldman Sachs Research", "title_ar": "Goldman Sachs Research", "targets": [{"label_ar": "نهاية 2028", "value_usd": 5600, "horizon_date": "2028-12-31"}], "value_text_ar": "سعر آخر السنة: 5,600 $ للأونصة (نهاية 2028)، بشرط إن الفيدرالي يبدأ يخفض الفايدة", "source_published_at": "2026-11-17", "source_url": "https://www.investing.com/news/commodities-news/heres-when-goldman-expects-gold-prices-to-reach-5600oz-5032707", "previous_source_url": null, "status_ar": "غير مؤكد", "unconfirmed": true, "previous_value_verified": null, "scoring": "level", "scoring_note_ar": "الرقم يتقارن بلقطة يوم الأفق، خطأ %", "previous_value_text": null, "changes": [], "before_nov20_low_ar": "قبل 20 نوفمبر", "group_ar": "سعر آخر السنة", "lead_note_ar": null, "method_ar": "رأي منشور من جهة تانية، مش حسابنا", "invalidated_by_ar": "الجهة تنشر رقم جديد، أو إغلاق يوم الأفق بعيد عن الرقم (يتسجّل ويتقيّم)", "news_ids": [], "event_ids": [], "snapshot_rule": "لقطة gold-api XAU الساعة 17:00 نيويورك يوم الأفق (مقارنة الرقم باللقطة، خطأ %)", "disclaimer_ar": "ده رأي الجهة، مش توقع منا ومش نصيحة.", "view_note_ar": null, "sha256": "10b8e1d4b9f68db4b979bee10c331bd5666992a49e1a5a65d3b16c17466255e2"}, {"id": "tp-w1", "lead_row_id": "w1", "kind": "third_party", "lead_kind": "average", "view": "speculator", "horizon_days": 64, "org": "World Bank, Commodity Markets Outlook (تقرير 28 أكتوبر)", "title_ar": "World Bank, Commodity Markets Outlook (تقرير 28 أكتوبر)", "targets": [{"label_ar": "متوسط 2026", "value_usd": 4600, "horizon_date": "2026-12-31"}], "value_text_ar": "متوسط السنة: 4,600 $ للأونصة (2026)", "source_published_at": "2026-10-28", "source_url": "https://www.kitco.com/news/article/2026-11-05/world-bank-sees-gold-holding-above-4000-through-2028-warns-silver-faces", "previous_source_url": null, "status_ar": "منقول من Kitco، مش من صفحة البنك الدولي", "unconfirmed": true, "previous_value_verified": null, "scoring": "average", "scoring_note_ar": "متوسط سنة، مش بنخزن متوسطات يومية فمش بيتقيّم", "previous_value_text": "4,700 (توقع أبريل)", "changes": [{"changed_on": "2026-10-28", "old": "4,700 (توقع أبريل)", "new": "4,600", "reason_stated_by_source_ar": "حسب المصدر: عوائد أعلى وسياسة أشد ودولار أقوى", "reason_url": "https://www.kitco.com/news/article/2026-11-05/world-bank-sees-gold-holding-above-4000-through-2028-warns-silver-faces", "reason_extra": null}], "before_nov20_low_ar": "قبل 20 نوفمبر", "group_ar": "متوسط السنة", "lead_note_ar": null, "method_ar": "رأي منشور من جهة تانية، مش حسابنا", "invalidated_by_ar": "الجهة تنشر رقم جديد، أو إغلاق يوم الأفق بعيد عن الرقم (يتسجّل ويتقيّم)", "news_ids": [], "event_ids": [], "snapshot_rule": "لقطة gold-api XAU الساعة 17:00 نيويورك يوم الأفق (مقارنة الرقم باللقطة، خطأ %)", "disclaimer_ar": "ده رأي الجهة، مش توقع منا ومش نصيحة.", "view_note_ar": null, "sha256": "3a0b4cfca94251d0c66857a6daeafccffe02a69d08f9f5ffa0b3570b2ef758d4"}, {"id": "tp-w2", "lead_row_id": "w2", "kind": "third_party", "lead_kind": "average", "view": "investor", "horizon_days": 429, "org": "World Bank, Commodity Markets Outlook (تقرير 28 أكتوبر)", "title_ar": "World Bank, Commodity Markets Outlook (تقرير 28 أكتوبر)", "targets": [{"label_ar": "متوسط 2027", "value_usd": 4250, "horizon_date": "2027-12-31"}], "value_text_ar": "متوسط السنة: 4,250 $ للأونصة (2027)", "source_published_at": "2026-10-28", "source_url": "https://www.kitco.com/news/article/2026-11-05/world-bank-sees-gold-holding-above-4000-through-2028-warns-silver-faces", "previous_source_url": null, "status_ar": "منقول من Kitco، مش من صفحة البنك الدولي", "unconfirmed": true, "previous_value_verified": null, "scoring": "average", "scoring_note_ar": "متوسط سنة، مش بنخزن متوسطات يومية فمش بيتقيّم", "previous_value_text": "4,300 (توقع أبريل)", "changes": [{"changed_on": "2026-10-28", "old": "4,300 (توقع أبريل)", "new": "4,250", "reason_stated_by_source_ar": null, "reason_url": "https://www.kitco.com/news/article/2026-11-05/world-bank-sees-gold-holding-above-4000-through-2028-warns-silver-faces", "reason_extra": null}], "before_nov20_low_ar": "قبل 20 نوفمبر", "group_ar": "متوسط السنة", "lead_note_ar": null, "method_ar": "رأي منشور من جهة تانية، مش حسابنا", "invalidated_by_ar": "الجهة تنشر رقم جديد، أو إغلاق يوم الأفق بعيد عن الرقم (يتسجّل ويتقيّم)", "news_ids": [], "event_ids": [], "snapshot_rule": "لقطة gold-api XAU الساعة 17:00 نيويورك يوم الأفق (مقارنة الرقم باللقطة، خطأ %)", "disclaimer_ar": "ده رأي الجهة، مش توقع منا ومش نصيحة.", "view_note_ar": null, "sha256": "336f3158045eb38934a937092a8cc0f7d70ac1bb6016a9ad887a064b48530e36"}, {"id": "tp-w3", "lead_row_id": "w3", "kind": "third_party", "lead_kind": "average", "view": "investor", "horizon_days": 795, "org": "World Bank, Commodity Markets Outlook (تقرير 28 أكتوبر)", "title_ar": "World Bank, Commodity Markets Outlook (تقرير 28 أكتوبر)", "targets": [{"label_ar": "متوسط 2028", "value_usd": 4000, "horizon_date": "2028-12-31"}], "value_text_ar": "متوسط السنة: 4,000 $ للأونصة (2028)", "source_published_at": "2026-10-28", "source_url": "https://www.kitco.com/news/article/2026-11-05/world-bank-sees-gold-holding-above-4000-through-2028-warns-silver-faces", "previous_source_url": null, "status_ar": "منقول من Kitco، مش من صفحة البنك الدولي", "unconfirmed": true, "previous_value_verified": null, "scoring": "average", "scoring_note_ar": "متوسط سنة، مش بنخزن متوسطات يومية فمش بيتقيّم", "previous_value_text": null, "changes": [], "before_nov20_low_ar": "قبل 20 نوفمبر", "group_ar": "متوسط السنة", "lead_note_ar": null, "method_ar": "رأي منشور من جهة تانية، مش حسابنا", "invalidated_by_ar": "الجهة تنشر رقم جديد، أو إغلاق يوم الأفق بعيد عن الرقم (يتسجّل ويتقيّم)", "news_ids": [], "event_ids": [], "snapshot_rule": "لقطة gold-api XAU الساعة 17:00 نيويورك يوم الأفق (مقارنة الرقم باللقطة، خطأ %)", "disclaimer_ar": "ده رأي الجهة، مش توقع منا ومش نصيحة.", "view_note_ar": null, "sha256": "98c566a7a62b97adc6cc44bb84a794c959918a39daf4014678c1e56a17f8df9f"}, {"id": "tp-s1", "lead_row_id": "s1", "kind": "third_party", "lead_kind": "3_month", "view": "speculator", "horizon_days": 92, "org": "Standard Chartered (Market Outlook 20 نوفمبر)", "title_ar": "Standard Chartered (Market Outlook 20 نوفمبر)", "targets": [{"label_ar": "3 شهور", "value_usd": 4000, "horizon_date": "2027-02-20"}], "value_text_ar": "رقم محدد: 4,000 $ للأونصة (3 شهور)", "source_published_at": "2026-11-20", "source_url": "https://www.goldreporter.de/gold-prognose-standard-chartered-senkt-kursziel-erwartet-aber-erholung/news/263276/", "previous_source_url": null, "status_ar": "منقول من goldreporter.de، مش من صفحة الجهة", "unconfirmed": true, "previous_value_verified": null, "scoring": "level", "scoring_note_ar": "الرقم يتقارن بلقطة يوم الأفق، خطأ %", "previous_value_text": "4,350", "changes": [{"changed_on": "2026-11-20", "old": "4,350", "new": "4,000", "reason_stated_by_source_ar": "حسب المصدر: توقعات فايدة أمريكية أعلى ودولار أقوى", "reason_url": "https://www.goldreporter.de/gold-prognose-standard-chartered-senkt-kursziel-erwartet-aber-erholung/news/263276/", "reason_extra": null}], "before_nov20_low_ar": "", "group_ar": "رقم محدد", "lead_note_ar": "النص الأصلي بالألماني", "method_ar": "رأي منشور من جهة تانية، مش حسابنا", "invalidated_by_ar": "الجهة تنشر رقم جديد، أو إغلاق يوم الأفق بعيد عن الرقم (يتسجّل ويتقيّم)", "news_ids": [], "event_ids": [], "snapshot_rule": "لقطة gold-api XAU الساعة 17:00 نيويورك يوم الأفق (مقارنة الرقم باللقطة، خطأ %)", "disclaimer_ar": "ده رأي الجهة، مش توقع منا ومش نصيحة.", "view_note_ar": null, "sha256": "afa581df96bf7e743f2d285d9f7441b557e23f2466201da9cfbf9312245d3baa"}, {"id": "tp-s2", "lead_row_id": "s2", "kind": "third_party", "lead_kind": "12_month", "view": "investor", "horizon_days": 365, "org": "Standard Chartered (Market Outlook 20 نوفمبر)", "title_ar": "Standard Chartered (Market Outlook 20 نوفمبر)", "targets": [{"label_ar": "12 شهر", "value_usd": 4500, "horizon_date": "2027-11-20"}], "value_text_ar": "رقم محدد: 4,500 $ للأونصة (12 شهر)", "source_published_at": "2026-11-20", "source_url": "https://www.goldreporter.de/gold-prognose-standard-chartered-senkt-kursziel-erwartet-aber-erholung/news/263276/", "previous_source_url": null, "status_ar": "منقول من goldreporter.de، مش من صفحة الجهة", "unconfirmed": true, "previous_value_verified": null, "scoring": "level", "scoring_note_ar": "الرقم يتقارن بلقطة يوم الأفق، خطأ %", "previous_value_text": "4,700", "changes": [{"changed_on": "2026-11-20", "old": "4,700", "new": "4,500", "reason_stated_by_source_ar": null, "reason_url": "https://www.goldreporter.de/gold-prognose-standard-chartered-senkt-kursziel-erwartet-aber-erholung/news/263276/", "reason_extra": null}], "before_nov20_low_ar": "", "group_ar": "رقم محدد", "lead_note_ar": null, "method_ar": "رأي منشور من جهة تانية، مش حسابنا", "invalidated_by_ar": "الجهة تنشر رقم جديد، أو إغلاق يوم الأفق بعيد عن الرقم (يتسجّل ويتقيّم)", "news_ids": [], "event_ids": [], "snapshot_rule": "لقطة gold-api XAU الساعة 17:00 نيويورك يوم الأفق (مقارنة الرقم باللقطة، خطأ %)", "disclaimer_ar": "ده رأي الجهة، مش توقع منا ومش نصيحة.", "view_note_ar": null, "sha256": "899728da94ca1283800fa8c617528b5b918ab532ee108c99691fc44bc94d41cb"}, {"id": "tp-u1", "lead_row_id": "u1", "kind": "third_party", "lead_kind": "range", "view": "speculator", "horizon_days": 54, "org": "UniCredit (Outlook نوفمبر)", "title_ar": "UniCredit (Outlook نوفمبر)", "targets": [{"label_ar": "نهاية 2026، نطاق", "value_usd": null, "horizon_date": "2026-12-31", "range_usd": [3900, 4500]}], "value_text_ar": "مدى: 3,900 إلى 4,500 $ للأونصة (نهاية 2026)", "source_published_at": "2026-11-07", "source_url": "https://www.exchangerates.org.uk/news/47700/2026-11-07-gold-price-forecast-prediction-unicredit-expects-3-900-4-500-consolidation-range.html", "previous_source_url": null, "status_ar": "منقول من exchangerates.org.uk، مش من صفحة الجهة", "unconfirmed": true, "previous_value_verified": null, "scoring": "range", "scoring_note_ar": "داخل النطاق أو خارجه يوم الأفق", "previous_value_text": null, "changes": [], "before_nov20_low_ar": "قبل 20 نوفمبر", "group_ar": "مدى", "lead_note_ar": "نُشر 7 نوفمبر.", "method_ar": "رأي منشور من جهة تانية، مش حسابنا", "invalidated_by_ar": "الجهة تنشر رقم جديد، أو إغلاق يوم الأفق بعيد عن الرقم (يتسجّل ويتقيّم)", "news_ids": [], "event_ids": [], "snapshot_rule": "لقطة gold-api XAU الساعة 17:00 نيويورك يوم الأفق (مقارنة الرقم باللقطة، خطأ %)", "disclaimer_ar": "ده رأي الجهة، مش توقع منا ومش نصيحة.", "view_note_ar": null, "sha256": "659c76283705ae5c43270159fde77efbc988c35aeba84886efc1ac5595bddb89"}, {"id": "tp-r1", "lead_row_id": "r1", "kind": "third_party", "lead_kind": "median", "view": "speculator", "horizon_days": 65, "org": "Reuters poll، 30 محلل (الوسيط)", "title_ar": "Reuters poll، 30 محلل (الوسيط)", "targets": [{"label_ar": "متوسط 2026، وسيط", "value_usd": 4495, "horizon_date": "2026-12-31"}], "value_text_ar": "متوسط السنة (وسيط الاستطلاع): 4,495 $ للأونصة (2026)", "source_published_at": "2026-10-27", "source_url": "https://www.investing.com/news/economy-news/strong-dollar-high-yields-drag-on-gold-outlook-but-centralbank-demand-lends-support-4975805", "previous_source_url": null, "status_ar": "مقروء على نسخة رويترز في Investing.com، مش صفحة رويترز", "unconfirmed": false, "previous_value_verified": null, "scoring": "average", "scoring_note_ar": "متوسط سنة، مش بنخزن متوسطات يومية فمش بيتقيّم", "previous_value_text": "4,509", "changes": [{"changed_on": "2026-10-27", "old": "4,509", "new": "4,495", "reason_stated_by_source_ar": null, "reason_url": "https://www.investing.com/news/economy-news/strong-dollar-high-yields-drag-on-gold-outlook-but-centralbank-demand-lends-support-4975805", "reason_extra": null}], "before_nov20_low_ar": "قبل 20 نوفمبر", "group_ar": "متوسط السنة (وسيط الاستطلاع)", "lead_note_ar": "استطلاع 27 أكتوبر، قبل نزول نوفمبر.", "method_ar": "رأي منشور من جهة تانية، مش حسابنا", "invalidated_by_ar": "الجهة تنشر رقم جديد، أو إغلاق يوم الأفق بعيد عن الرقم (يتسجّل ويتقيّم)", "news_ids": [], "event_ids": [], "snapshot_rule": "لقطة gold-api XAU الساعة 17:00 نيويورك يوم الأفق (مقارنة الرقم باللقطة، خطأ %)", "disclaimer_ar": "ده رأي الجهة، مش توقع منا ومش نصيحة.", "view_note_ar": null, "sha256": "3b6fe1f86e1e7b06d0a1b7c0de3c46a37e411ecc815dd8ffb0e744cbe6ffc65d"}, {"id": "tp-r2", "lead_row_id": "r2", "kind": "third_party", "lead_kind": "median", "view": "investor", "horizon_days": 430, "org": "Reuters poll، 30 محلل (الوسيط)", "title_ar": "Reuters poll، 30 محلل (الوسيط)", "targets": [{"label_ar": "متوسط 2027، وسيط", "value_usd": 4650, "horizon_date": "2027-12-31"}], "value_text_ar": "متوسط السنة (وسيط الاستطلاع): 4,650 $ للأونصة (2027)", "source_published_at": "2026-10-27", "source_url": "https://www.investing.com/news/economy-news/strong-dollar-high-yields-drag-on-gold-outlook-but-centralbank-demand-lends-support-4975805", "previous_source_url": null, "status_ar": "مقروء على نسخة رويترز في Investing.com، مش صفحة رويترز", "unconfirmed": false, "previous_value_verified": null, "scoring": "average", "scoring_note_ar": "متوسط سنة، مش بنخزن متوسطات يومية فمش بيتقيّم", "previous_value_text": "4,610", "changes": [{"changed_on": "2026-10-27", "old": "4,610", "new": "4,650", "reason_stated_by_source_ar": null, "reason_url": "https://www.investing.com/news/economy-news/strong-dollar-high-yields-drag-on-gold-outlook-but-centralbank-demand-lends-support-4975805", "reason_extra": null}], "before_nov20_low_ar": "قبل 20 نوفمبر", "group_ar": "متوسط السنة (وسيط الاستطلاع)", "lead_note_ar": "استطلاع 27 أكتوبر، قبل نزول نوفمبر.", "method_ar": "رأي منشور من جهة تانية، مش حسابنا", "invalidated_by_ar": "الجهة تنشر رقم جديد، أو إغلاق يوم الأفق بعيد عن الرقم (يتسجّل ويتقيّم)", "news_ids": [], "event_ids": [], "snapshot_rule": "لقطة gold-api XAU الساعة 17:00 نيويورك يوم الأفق (مقارنة الرقم باللقطة، خطأ %)", "disclaimer_ar": "ده رأي الجهة، مش توقع منا ومش نصيحة.", "view_note_ar": null, "sha256": "a681600187eb27ecd8270666d3998e6fcb2c15b3b29562573acc04432ea81930"}, {"id": "tp-c1", "lead_row_id": "c1", "kind": "third_party", "lead_kind": "year_end", "view": "investor", "horizon_days": 402, "org": "Commerzbank (Carsten Fritsch)", "title_ar": "Commerzbank (Carsten Fritsch)", "targets": [{"label_ar": "نهاية 2027", "value_usd": 4100, "horizon_date": "2027-12-31"}], "value_text_ar": "سعر آخر السنة: 4,100 $ للأونصة (نهاية 2027)", "source_published_at": "2026-11-24", "source_url": "https://www.fxstreet.com/news/gold-headwinds-set-to-ease-into-2027-commerzbank-202611241324", "previous_source_url": null, "status_ar": "منقول من FXStreet، مش من صفحة الجهة", "unconfirmed": true, "previous_value_verified": null, "scoring": "level", "scoring_note_ar": "الرقم يتقارن بلقطة يوم الأفق، خطأ %", "previous_value_text": null, "changes": [], "before_nov20_low_ar": "", "group_ar": "سعر آخر السنة", "lead_note_ar": null, "method_ar": "رأي منشور من جهة تانية، مش حسابنا", "invalidated_by_ar": "الجهة تنشر رقم جديد، أو إغلاق يوم الأفق بعيد عن الرقم (يتسجّل ويتقيّم)", "news_ids": [], "event_ids": [], "snapshot_rule": "لقطة gold-api XAU الساعة 17:00 نيويورك يوم الأفق (مقارنة الرقم باللقطة، خطأ %)", "disclaimer_ar": "ده رأي الجهة، مش توقع منا ومش نصيحة.", "view_note_ar": null, "sha256": "0a3c09533fd9a00cb50cd714968bb5a1da09d0602d7b2eaed7a7e59833d6ac2f"}, {"id": "tp-j1", "lead_row_id": "j1", "kind": "third_party", "lead_kind": null, "view": "investor", "horizon_days": 402, "org": "J.P. Morgan", "title_ar": "J.P. Morgan", "targets": [{"label_ar": "رقم محدد: 4,500 $ للأونصة بحلول نهاية 2027 (رويترز)", "value_usd": 4500, "horizon_date": "2027-12-31"}], "value_text_ar": "رقم محدد: 4,500 $ للأونصة بحلول نهاية 2027 (رويترز)", "source_published_at": "2026-11-24", "source_url": "https://www.tradingview.com/news/reuters.com%2C2026:newsml_L3N4751FV:0-jp-morgan-cuts-base-metals-outlook-sees-gold-at-4-500-by-end-2027/", "previous_source_url": "https://www.jpmorgan.com/insights/global-research/commodities/gold-prices", "status_ar": "4,500 غير مؤكد، منقول من رويترز؛ 6,300 مقروء في صفحة JPM", "unconfirmed": true, "previous_value_verified": true, "scoring": "level", "scoring_note_ar": "الرقم يتقارن بلقطة يوم الأفق، خطأ %", "previous_value_text": "6,300 بحلول نهاية 2027 (صفحة JPM، 9 يونيو)", "changes": [{"changed_on": "2026-11-24", "old": "6,300 بحلول نهاية 2027 (صفحة JPM، 9 يونيو)", "new": "4,500", "reason_stated_by_source_ar": "نفط أرخص ووقف دورة رفع الفايدة", "reason_url": "https://www.boursorama.com/bourse/actualites/j-p-morgan-revoit-a-la-baisse-ses-previsions-pour-les-metaux-de-base-et-table-sur-un-cours-de-l-or-a-4-500-dollars-d-ici-fin-2027-4c623400bc06d05798e30ff8fd5bfd41", "reason_extra": {"text_ar": "تثبيت الفيدرالي من الربع الأول 2027", "url": "https://squawknews.com/news/977892-jpmorgan-sees-gold-recovering-to-4-500-oz-by-4q27"}}], "before_nov20_low_ar": "", "group_ar": "رقم محدد", "lead_note_ar": "السبب حسب الناشر (رويترز 24 نوفمبر عبر Boursorama): نفط أرخص ووقف دورة رفع الفايدة. (SquawkNews بيضيف: تثبيت الفيدرالي من الربع الأول 2027)", "method_ar": "رأي منشور من جهة تانية، مش حسابنا", "invalidated_by_ar": "الجهة تنشر رقم جديد، أو إغلاق يوم الأفق بعيد عن الرقم (يتسجّل ويتقيّم)", "news_ids": [], "event_ids": [], "snapshot_rule": "لقطة gold-api XAU الساعة 17:00 نيويورك يوم الأفق (مقارنة الرقم باللقطة، خطأ %)", "disclaimer_ar": "ده رأي الجهة، مش توقع منا ومش نصيحة.", "view_note_ar": null, "sha256": "b07a2436bab7e5dbf078e3088ee490b777a5bc1fabf341d8503f12812fa381b3"}, {"id": "tp-b1", "lead_row_id": "b1", "kind": "third_party", "lead_kind": "point_values", "view": "investor", "horizon_days": 224, "org": "UBS (مذكرة 18 نوفمبر)", "title_ar": "UBS (مذكرة 18 نوفمبر)", "targets": [{"label_ar": "يونيو 2027", "value_usd": 4600, "horizon_date": "2027-06-30"}, {"label_ar": "ديسمبر 2027", "value_usd": 5000, "horizon_date": "2027-12-31"}], "value_text_ar": "رقم محدد: 4,600 $ للأونصة (يونيو 2027) و5,000 (ديسمبر 2027)", "source_published_at": "2026-11-18", "source_url": "https://www.investing.com/news/commodities-news/ubs-sees-gold-at-5000-by-the-end-of-2027-brent-easing-to-80-5035763", "previous_source_url": null, "status_ar": "غير مؤكد، قريناه في صفحة Investing.com، مش صفحة UBS", "unconfirmed": true, "previous_value_verified": null, "scoring": "level", "scoring_note_ar": "الرقم يتقارن بلقطة يوم الأفق، خطأ %", "previous_value_text": null, "changes": [], "before_nov20_low_ar": "قبل 20 نوفمبر", "group_ar": "رقم محدد", "lead_note_ar": "مذكرة 18 نوفمبر. السطر القصير الأفق من نفس المذكرة معروض جنب البند، مش جواه.", "method_ar": "رأي منشور من جهة تانية، مش حسابنا", "invalidated_by_ar": "الجهة تنشر رقم جديد، أو إغلاق يوم الأفق بعيد عن الرقم (يتسجّل ويتقيّم)", "news_ids": [], "event_ids": [], "snapshot_rule": "لقطة gold-api XAU الساعة 17:00 نيويورك يوم الأفق (مقارنة الرقم باللقطة، خطأ %)", "disclaimer_ar": "ده رأي الجهة، مش توقع منا ومش نصيحة.", "view_note_ar": null, "sha256": "8133254a845e8204eb33320da7ae9e6564e987560a4a28612036c6de22d6747f"}, {"id": "ev-jobs-2026-12-04", "kind": "scenario", "view": "speculator", "horizon_days": 8, "title_ar": "تقرير الوظائف، الجمعة 4 ديسمبر 15:30 القاهرة", "event_at": "2026-12-04T15:30:00+02:00", "condition": {"metric": "payrolls_change", "reference": 165000, "reference_source": "BLS، منشور 6 نوفمبر واتقرا يوم 26 نوفمبر 2026، ممكن يتعدّل (https://www.bls.gov/news.release/empsit.nr0.htm)", "branches": ["above", "below", "not_available"]}, "pattern_ar": "لو الوظائف أعلى من الشهر اللي فات (165,000)، الكتابات عن السوق بتربطه بدولار وعوائد أعلى وضغط على الذهب. لو أقل، العكس. الربط ده معروف في الكتابات عن السوق، لسه ما قسناهوش هنا. اللي قسناه أسبوعياً بين متوسط الذهب والدولار: حوالي -0.5 على السنين الطويلة (و-0.6 آخر سنة)، ومع الفايدة الحقيقية حوالي -0.3 لـ -0.45. ارتباط متوسط، من متوسطات أسبوعية (متوسطات أسبوعية لحد 16 نوفمبر)، مش قاعدة. ممكن يحصل العكس.", "method_ar": "وصف شرطي مرتبط بحدث، مش توقع ومش محسوب منا", "invalidated_by_ar": "لقطة يوم الحدث عكس النمط المكتوب لفرع الشرط اللي اتحقق", "stable_threshold_pct": 0.5, "news_ids": [], "event_ids": ["ev-jobs-2026-12-04"], "snapshot_rule": "لقطة gold-api XAU الساعة 17:00 نيويورك يوم الأفق مقابل لقطة اليوم السابق", "fixed_before_event": true, "also_logged": "unemployment 4.1%", "sha256": "26026a19b4c59c3eee086c91dbdb86aa72db5440f3f7b338ab8e2fdc05b510b3"}, {"id": "ev-fomc-2026-12-09", "kind": "scenario", "view": "speculator", "horizon_days": 13, "title_ar": "الفيدرالي، 8-9 ديسمبر", "event_at": "2026-12-09", "condition": {"metric": "hike_probability_logged_2026-12-08", "reference": null, "reference_source": "يتسجّل يوم 8 ديسمبر من مصدر مقروء بتاريخه، وإلا 'غير متاح'", "branches": ["above", "below", "not_available"]}, "pattern_ar": "لو القرار أكثر تشددا من التسعير المسجّل، الكتابات عن السوق بتربطه بعوائد ودولار أعلى وضغط على الذهب. لو أقل تشددا، العكس. الربط ده معروف في الكتابات عن السوق، لسه ما قسناهوش هنا. اللي قسناه أسبوعياً بين متوسط الذهب والدولار: حوالي -0.5 على السنين الطويلة (و-0.6 آخر سنة)، ومع الفايدة الحقيقية حوالي -0.3 لـ -0.45. ارتباط متوسط، من متوسطات أسبوعية (متوسطات أسبوعية لحد 16 نوفمبر)، مش قاعدة. ممكن يحصل العكس.", "method_ar": "وصف شرطي مرتبط بحدث، مش توقع ومش محسوب منا", "invalidated_by_ar": "لقطة يوم الحدث عكس النمط المكتوب لفرع الشرط اللي اتحقق", "stable_threshold_pct": 0.5, "news_ids": [], "event_ids": ["ev-fomc-2026-12-09"], "snapshot_rule": "لقطة gold-api XAU الساعة 17:00 نيويورك يوم الأفق مقابل لقطة اليوم السابق", "fixed_before_event": true, "definition_ar": "أكثر تشددا = قرار رفع واحتمال الرفع المسجّل أقل من 50%. أقل تشددا = تثبيت واحتمال الرفع أكتر من 50%. غير كده 'زي المتوقع' ومش بيتحسب (50% اختيار تصميم).", "year_end_note_ar": "نهاية 2026 أقل من 90 يوم، فبتتحسب مضارب", "sha256": "ab91b4c3601b8df410ba083f2179643fbfa6bb55dce446f5fe37e17d59fad5c1"}, {"id": "ev-cpi-2026-12-10", "kind": "scenario", "view": "speculator", "horizon_days": 14, "title_ar": "CPI شهري، الخميس 10 ديسمبر 15:30 القاهرة", "event_at": "2026-12-10T15:30:00+02:00", "condition": {"metric": "cpi_mom_vs_cleveland_nowcast", "reference": null, "reference_source": "تقدير نموذج Cleveland Fed (مش توقع محللين): الشهري 0.00 والأساسي 0.21، اتقرا يوم 26 نوفمبر 2026 (تحديث 25 نوفمبر). الرقم الملزم يتسجّل يوم 9 ديسمبر. السابق (BLS، اتقرا 26 نوفمبر): +0.4% و+0.3%", "branches": ["above", "below", "not_available"]}, "pattern_ar": "لو CPI الشهري أعلى من تقدير نموذج Cleveland Fed المسجّل، الكتابات عن السوق بتربطه بتوقعات فايدة أعلى وضغط على الذهب. لو أقل، العكس. الربط ده معروف في الكتابات عن السوق، لسه ما قسناهوش هنا. اللي قسناه أسبوعياً بين متوسط الذهب والدولار: حوالي -0.5 على السنين الطويلة (و-0.6 آخر سنة)، ومع الفايدة الحقيقية حوالي -0.3 لـ -0.45. ارتباط متوسط، من متوسطات أسبوعية (متوسطات أسبوعية لحد 16 نوفمبر)، مش قاعدة. ممكن يحصل العكس.", "method_ar": "وصف شرطي مرتبط بحدث، مش توقع ومش محسوب منا", "invalidated_by_ar": "لقطة يوم الحدث عكس النمط المكتوب لفرع الشرط اللي اتحقق", "stable_threshold_pct": 0.5, "news_ids": [], "event_ids": ["ev-cpi-2026-12-10"], "snapshot_rule": "لقطة gold-api XAU الساعة 17:00 نيويورك يوم الأفق مقابل لقطة اليوم السابق", "fixed_before_event": true, "sha256": "c790a4ca25f6f33e86f1e2cef48bb178ed2a396e695bd8549e390739efc41b83"}, {"id": "ev-cpicore-2026-12-10", "kind": "scenario", "view": "speculator", "horizon_days": 14, "title_ar": "CPI أساسي، الخميس 10 ديسمبر 15:30 القاهرة", "event_at": "2026-12-10T15:30:00+02:00", "condition": {"metric": "cpi_core_mom_vs_cleveland_nowcast", "reference": null, "reference_source": "تقدير نموذج Cleveland Fed (مش توقع محللين): الشهري 0.00 والأساسي 0.21، اتقرا يوم 26 نوفمبر 2026 (تحديث 25 نوفمبر). الرقم الملزم يتسجّل يوم 9 ديسمبر. السابق (BLS، اتقرا 26 نوفمبر): +0.4% و+0.3%", "branches": ["above", "below", "not_available"]}, "pattern_ar": "لو CPI الأساسي أعلى من تقدير نموذج Cleveland Fed المسجّل، الكتابات عن السوق بتربطه بتوقعات فايدة أعلى وضغط على الذهب. لو أقل، العكس. الربط ده معروف في الكتابات عن السوق، لسه ما قسناهوش هنا. اللي قسناه أسبوعياً بين متوسط الذهب والدولار: حوالي -0.5 على السنين الطويلة (و-0.6 آخر سنة)، ومع الفايدة الحقيقية حوالي -0.3 لـ -0.45. ارتباط متوسط، من متوسطات أسبوعية (متوسطات أسبوعية لحد 16 نوفمبر)، مش قاعدة. ممكن يحصل العكس.", "method_ar": "وصف شرطي مرتبط بحدث، مش توقع ومش محسوب منا", "invalidated_by_ar": "لقطة يوم الحدث عكس النمط المكتوب لفرع الشرط اللي اتحقق", "stable_threshold_pct": 0.5, "news_ids": [], "event_ids": ["ev-cpicore-2026-12-10"], "snapshot_rule": "لقطة gold-api XAU الساعة 17:00 نيويورك يوم الأفق مقابل لقطة اليوم السابق", "fixed_before_event": true, "sha256": "9de5acfa66c3ab13243ffb078d5fae812cf7171cba0a0bfecb35f581fbef2f54"}];
const FC_SIDE: any[] = [{"attaches_to": "tp-b1", "label_ar": "أفق قصير غير محدد في المصدر", "text_ar": "ممكن يتداول تحت 4,000 $ للأونصة في المدى القصير", "source_url": "https://www.ubs.com/us/en/wealth-management/insights/market-news/article.4025355.html", "status_ar": "مقروء في صفحة UBS نفسها"}];
const FC_RESULTS: any[] = [{"record_sha256": "d0f713db9cc9e9884c0727d02562a866593e46d04ec6354e428ed3d89180e582", "id": "tp-g1", "status": "pending", "snap_prev": null, "snap_event": null, "move_pct": null, "line_ar": null}, {"record_sha256": "6698b1229e78eb36ed49cc39dab227b6a5f7ae979b5d84049d200e63f0058ab6", "id": "tp-g2", "status": "pending", "snap_prev": null, "snap_event": null, "move_pct": null, "line_ar": null}, {"record_sha256": "10b8e1d4b9f68db4b979bee10c331bd5666992a49e1a5a65d3b16c17466255e2", "id": "tp-g3", "status": "pending", "snap_prev": null, "snap_event": null, "move_pct": null, "line_ar": null}, {"record_sha256": "3a0b4cfca94251d0c66857a6daeafccffe02a69d08f9f5ffa0b3570b2ef758d4", "id": "tp-w1", "status": "not_scored", "snap_prev": null, "snap_event": null, "move_pct": null, "line_ar": null}, {"record_sha256": "336f3158045eb38934a937092a8cc0f7d70ac1bb6016a9ad887a064b48530e36", "id": "tp-w2", "status": "not_scored", "snap_prev": null, "snap_event": null, "move_pct": null, "line_ar": null}, {"record_sha256": "98c566a7a62b97adc6cc44bb84a794c959918a39daf4014678c1e56a17f8df9f", "id": "tp-w3", "status": "not_scored", "snap_prev": null, "snap_event": null, "move_pct": null, "line_ar": null}, {"record_sha256": "afa581df96bf7e743f2d285d9f7441b557e23f2466201da9cfbf9312245d3baa", "id": "tp-s1", "status": "pending", "snap_prev": null, "snap_event": null, "move_pct": null, "line_ar": null}, {"record_sha256": "899728da94ca1283800fa8c617528b5b918ab532ee108c99691fc44bc94d41cb", "id": "tp-s2", "status": "pending", "snap_prev": null, "snap_event": null, "move_pct": null, "line_ar": null}, {"record_sha256": "659c76283705ae5c43270159fde77efbc988c35aeba84886efc1ac5595bddb89", "id": "tp-u1", "status": "pending", "snap_prev": null, "snap_event": null, "move_pct": null, "line_ar": null}, {"record_sha256": "3b6fe1f86e1e7b06d0a1b7c0de3c46a37e411ecc815dd8ffb0e744cbe6ffc65d", "id": "tp-r1", "status": "not_scored", "snap_prev": null, "snap_event": null, "move_pct": null, "line_ar": null}, {"record_sha256": "a681600187eb27ecd8270666d3998e6fcb2c15b3b29562573acc04432ea81930", "id": "tp-r2", "status": "not_scored", "snap_prev": null, "snap_event": null, "move_pct": null, "line_ar": null}, {"record_sha256": "0a3c09533fd9a00cb50cd714968bb5a1da09d0602d7b2eaed7a7e59833d6ac2f", "id": "tp-c1", "status": "pending", "snap_prev": null, "snap_event": null, "move_pct": null, "line_ar": null}, {"record_sha256": "b07a2436bab7e5dbf078e3088ee490b777a5bc1fabf341d8503f12812fa381b3", "id": "tp-j1", "status": "pending", "snap_prev": null, "snap_event": null, "move_pct": null, "line_ar": null}, {"record_sha256": "8133254a845e8204eb33320da7ae9e6564e987560a4a28612036c6de22d6747f", "id": "tp-b1", "status": "pending", "snap_prev": null, "snap_event": null, "move_pct": null, "line_ar": null}, {"record_sha256": "26026a19b4c59c3eee086c91dbdb86aa72db5440f3f7b338ab8e2fdc05b510b3", "id": "ev-jobs-2026-12-04", "status": "pending", "snap_prev": null, "snap_event": null, "move_pct": null, "line_ar": null}, {"record_sha256": "ab91b4c3601b8df410ba083f2179643fbfa6bb55dce446f5fe37e17d59fad5c1", "id": "ev-fomc-2026-12-09", "status": "pending", "snap_prev": null, "snap_event": null, "move_pct": null, "line_ar": null}, {"record_sha256": "c790a4ca25f6f33e86f1e2cef48bb178ed2a396e695bd8549e390739efc41b83", "id": "ev-cpi-2026-12-10", "status": "pending", "snap_prev": null, "snap_event": null, "move_pct": null, "line_ar": null}, {"record_sha256": "9de5acfa66c3ab13243ffb078d5fae812cf7171cba0a0bfecb35f581fbef2f54", "id": "ev-cpicore-2026-12-10", "status": "pending", "snap_prev": null, "snap_event": null, "move_pct": null, "line_ar": null}];
const FC_REVIEWED_AT = '2026-11-26T20:00:00+02:00'; // last successful review (all sources reopened by the checker)
const FC_INFO: string[] = ["التقسيم لـ المضارب والمستثمر من عندنا وتقريبي: المضارب لحد 3 شهور من تاريخ الرأي، المستثمر أكتر.", "غير مؤكد = اتنقل من موقع تاني ومقرأناش صفحة الجهة.", "سعر الذهب الفوري لايف من gold-api مع وقت التحديث، من غير مقارنة بالنسبة المئوية.", "التعديلات: حسب مواقع قريناها (مش صفحات الجهات): جولدمان وستاندرد تشارترد والبنك الدولي نزلوا أرقامهم. جي بي مورغان: رقمه القديم 6,300 قريناه في صفحته (9 يونيو) والجديد 4,500 منقول من رويترز. استطلاع رويترز: 2026 نزل من 4,509 لـ 4,495، و2027 زاد من 4,610 لـ 4,650.", "متوسط أسابيع 2026 (47 أسبوع بما فيهم الأسبوع الأخير الناقص): حوالي 4,444 $ للأونصة، ومن غير الأسبوع الناقص حوالي 4,462. متوسط عادي لمتوسطات أسبوعية بأوزان متساوية، مش متوسط الإغلاقات اليومية ومش نفس نوع متوسط السنة الكاملة بتاع البنك الدولي. من ملف متوسطات أسبوعية اتقرا من gold-api.com يوم 26 نوفمبر 18:33 القاهرة (رقم ثابت من وقت القراءة، مش بيتحدث لايف).", "جنب بند UBS (أفق قصير غير محدد في المصدر): \"ممكن يتداول تحت 4,000 $ للأونصة في المدى القصير\" (صفحة UBS، قريناها).", "ملاحظات نوعية خارج السجل \"بدون رقم وبدون أفق\": ING (معرّض للضغط لحد ما توقعات الفايدة والدولار تهدى)، WGC (البنوك المركزية غالبا هتفضل مشتري مهم)."];
const FC_EST_INTRO = "جربنا 3 طرق بسيطة على تاريخ عقود الذهب الآجلة COMEX، وماكسبتش على \"هيطلع دايماً\" (53.8%)، فمش هنعرض رقم من عندنا.";
const FC_EST: string[] = ["البيانات: إغلاقات يومية لعقود الذهب الآجلة COMEX من 30 أغسطس 2000، 6,587 يوم. المصدر: Yahoo Finance، قراءة 26 نوفمبر 2026 الساعة 19:56 القاهرة.", "السؤال: الذهب هيبقى أعلى ولا أقل بعد 20 يوم تداول؟ عينات كل 20 يوم، 316 عينة، آخر فترة فيها بتنتهي 4 نوفمبر (نزول آخر نوفمبر مش داخل العينات)، بقواعد ثابتة من غير ضبط.", "زخم آخر 60 يوم: صح في 50.6%. متوسط 50 يوم فوق 200: 51.6%. العودة للمتوسط 200: 51.1% (184 عينة).", "الذهب طلع فعلاً في 53.8% من الفترات. \"هيطلع دايماً\" كان أحسن (53.8%) من الطرق التلاتة.", "في الحجم: تقدير الزخم غلط بمتوسط 4.26% في كل فترة 20 يوم تداول، و\"ما فيش تغيير\" غلط 3.74%. يعني التقدير أسوأ.", "الفترتين (نفس شبكة العينات، من أغسطس 2001 لحد سبتمبر 2012: 138 عينة، ومن سبتمبر 2012 لحد 4 نوفمبر 2026: 178 عينة): في الأولى \"هيطلع دايماً\" 59.4% (الذهب طلع في 59.4%)، الزخم 49.3%، ترند 50/200 55.1%، العودة للمتوسط 54.8% (84 عينة). في التانية \"هيطلع دايماً\" 49.4%، الزخم 51.7%، ترند 48.9%، العودة للمتوسط 48.0% (100 عينة). يعني مفيش طريقة كانت الأحسن في الفترتين، والترتيب اتغير.", "طرق التوقع التلاتة (الزخم والترند والعودة للمتوسط) كلها جوه هامش الخطأ (حوالي ±5.5 نقطة لـ316 عينة، وأكبر للفترات الأصغر)، فمفيش طريقة منهم اتبينت إنها أحسن من رمي العملة. أما \"هيطلع دايماً\" فهي نسبة الفترات اللي الذهب طلع فيها، وكانت 59.4% في 2001-2012 لأن الذهب كان طالع.", "الذهب طلع من حوالي 270$ (من نفس سلسلة عقود COMEX الآجلة) سنة 2000 لفوق 3,500$، فنسبة \"طلع\" (53.8%) سببها الصعود ده، مش قاعدة للمستقبل.", "نقطة ثبات: نتايج الفترات الفرعية بتتحرك لحد حوالي 10 نقط لو إزحنا بداية الشبكة، فخد الأرقام الفرعية بحذر.", "حدود: 3 طرق بسيطة بس. العقد آجل مش السعر الفوري. المصدر واجهة غير رسمية وشروطها ما اتحققتش. الماضي مش بيضمن حاجة."];
const hq = (k: string) => { try { const m = new RegExp('[?&]' + k + '=([a-z0-9_-]+)').exec(location.hash + location.search); return m ? m[1] : ''; } catch (e) { return ''; } };
const hoursSince = (iso: string) => (Date.now() - new Date(iso).getTime()) / 36e5;
const MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const ar = (d: string) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d); return m ? `${+m[3]} ${MONTHS[+m[2] - 1]} ${m[1]}` : d; };
const Rng = (s: any) => String(s).split(/(\d+-\d+|[A-Za-z][A-Za-z0-9.&']*(?: [A-Za-z][A-Za-z0-9.&']*)*)/).map((x: string, i: number) => i % 2 ? <bdi key={i} dir="ltr">{x}</bdi> : <React.Fragment key={i}>{fixNums(x)}</React.Fragment>);
const Lnk = ({ u, t }: { u: string; t: string }) => <a href={u} target="_blank" rel="noreferrer" dir="ltr">{t}</a>;
const UNC = 'غير مؤكد: اتنقل من موقع تاني ومقرأناش صفحة الجهة.';
function FcRow({ r, open }: { r: any; open: boolean }) {
  const [o, setO] = React.useState(open);
  const res = FC_RESULTS.find((x: any) => x.record_sha256 === r.sha256);
  const tp = r.kind === 'third_party';
  const side = FC_SIDE.filter((s: any) => s.attaches_to === r.id);
  const ch = r.changes || [];
  const last = ch.length ? ch[ch.length - 1] : null;
  const why = (c: any) => c.reason_stated_by_source_ar
    ? <>{c.reason_stated_by_source_ar} (<Lnk u={c.reason_url} t="المصدر" />)</>
    : <>في نفس الفترة صدر خبر (<Lnk u={c.reason_url} t="المصدر" />)</>;
  const chLine = (c: any) => <>اتعدل من {Rng(c.old)} لـ {Rng(c.new)} يوم {ar(c.changed_on)}، {why(c)}{c.reason_extra ? <> · كمان: {c.reason_extra.text_ar} (<Lnk u={c.reason_extra.url} t="المصدر" />)</> : null}</>;
  return <section className="gd-card" id={'fc-' + r.id}>
    <div className="gld-head"><h3 dir={/^[A-Za-z]/.test(r.title_ar) ? 'ltr' : undefined} style={/^[A-Za-z]/.test(r.title_ar) ? { textAlign: 'right' } : undefined}>{/^[A-Za-z]/.test(r.title_ar) ? r.title_ar : Rng(r.title_ar)}</h3><span className="gld-chip">{r.view === 'speculator' ? 'مضارب' : 'مستثمر'}</span></div>
    {tp && <P>{r.value_text_ar}</P>}
    {tp && r.before_nov20_low_ar && <P className="gd-note">{r.before_nov20_low_ar}</P>}
    {!tp && <P>{r.pattern_ar}</P>}
    <div className="gd-rs">{tp ? <>{r.status_ar !== 'غير مؤكد' ? <>{Rng(r.status_ar)} · </> : null}{ar(r.source_published_at)} · <Lnk u={r.source_url} t="المصدر" /></> : <>{fixNums(r.condition.reference_source)}</>}</div>
    {tp && r.unconfirmed && <P className="gd-note">{UNC}</P>}
    {tp && side.map((s: any, i: number) => <P key={i} className="gd-note">{s.label_ar}: {s.text_ar} · {s.status_ar} · <Lnk u={s.source_url} t="المصدر" /></P>)}
    {tp && last && <P className="gd-note">{chLine(last)}</P>}
    <P className="gd-note">بيبطل لو: {r.invalidated_by_ar}</P>
    {tp && <P className="gd-note">{r.disclaimer_ar}</P>}
    <button className="gld-more" onClick={() => setO(!o)}>{o ? 'اقفل التفاصيل' : 'تفاصيل'}</button>
    {o && <>
      <ul><Li>الطريقة: {r.method_ar}</Li><Li>قاعدة اللقطة: {r.snapshot_rule}</Li>
        {!tp && r.definition_ar && <Li>التعريف: {r.definition_ar}</Li>}
        <Li>الحالة: {res ? (res.status === 'pending' ? 'لسه مفتوح' : res.status === 'not_computed' ? 'غير محسوب' : res.status === 'not_scored' ? 'ما اتقيّمش' : res.line_ar || res.status) : 'لسه مفتوح'}</Li>
        {tp && r.scoring_note_ar && <Li>{r.scoring_note_ar}</Li>}</ul>
      <H4>سجل التعديلات</H4>
      {ch.length ? <ul>{ch.map((c: any, i: number) => <Li key={i}>{chLine(c)}</Li>)}</ul> : <P className="gd-note">{tp ? 'مفيش تعديل متسجل.' : 'الوصف ده ثابت قبل الحدث.'}</P>}
    </>}
  </section>;
}
function ForecastsV2() {
  const [v, setV] = React.useState(hq('fcv') === 'inv' ? 'inv' : 'spec');
  const openId = hq('open');
  const rows = FC_RECORDS.filter((r: any) => (r.view === 'speculator' ? 'spec' : 'inv') === v);
  const st = (s: string) => FC_RESULTS.filter((x: any) => x.status === s).length;
  const done = st('matched') + st('not_matched') + st('flat');
  const age = FC_REVIEWED_AT ? hoursSince(FC_REVIEWED_AT) : 0;
  const stale = rows.some((r: any) => age > (r.kind === 'scenario' ? 24 : 48));
  return <>
    <P className="gd-tag">ذهب عالمي · مش مرتبط بالبورصة المصرية</P>
    <P><b>ده مش توقع لسعر الذهب ومش نصيحة.</b></P>
    {stale && <P className="gld-stale">بيانات قديمة: آخر مراجعة ناجحة {new Date(FC_REVIEWED_AT).toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' })} بتوقيت القاهرة. الأرقام ممكن تكون اتغيرت.</P>}
    <div className="gld-seg" role="tablist"><button role="tab" aria-selected={v === 'spec'} className={v === 'spec' ? 'on' : ''} onClick={() => setV('spec')}>المضارب · لحد 3 شهور</button><button role="tab" aria-selected={v === 'inv'} className={v === 'inv' ? 'on' : ''} onClick={() => setV('inv')}>المستثمر · أكتر من 3 شهور</button></div>
    <P className="gd-note">عرضين، والتقسيم من عندنا وتقريبي: المضارب (المصدر قال 3 شهور أو أقل) والمستثمر (أكتر من 3 شهور). نهاية 2026 بتتحسب مضارب لأنها أقل من 3 شهور.</P>
    <P className="gd-note">توقعات البنوك بتتراجع من فريقنا بجدول وبعد الأحداث الكبيرة، مش كل دقيقة. لو آخر مراجعة أقدم من 48 ساعة (الأحداث واللقطات 24 ساعة) بيظهر شريط "بيانات قديمة".</P>
    <H3>{v === 'spec' ? 'أحداث وأهداف قصيرة' : 'توقعات الجهات التانية'}</H3>
    {rows.length === 0 && <section className="gd-card"><P>لسه مفيش عناصر متأكدة هنا.</P></section>}
    {rows.map((r: any) => <FcRow key={r.id + v} r={r} open={openId === r.id} />)}
    <section className="gd-card"><H3>تقديرنا: مفيش</H3>
      <P>{FC_EST_INTRO}</P>
      <ul>{FC_EST.map((x, i) => <Li key={i}>{x}</Li>)}</ul></section>
    <section className="gd-card"><H3>السجل</H3>
      <P>اتقالت {done} مرة، حصلت {st('matched')}، عينة صغيرة.</P>
      <P className="gd-note">لسه مفتوح: {st('pending')} · غير محسوب: {st('not_computed')} · ما اتقيّمش: {st('not_scored')}. من غير نسبة مئوية قبل 30 محسومة.</P></section>
    <section className="gd-card"><H3>معلومات عامة</H3><ul>{FC_INFO.map((x, i) => <Li key={i}>{x}</Li>)}</ul></section>
    <P className="gd-note">{DISCLAIMER}</P></>;
}
function GoldTabsV2({ overview }: { overview: any }) {
  const barRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => { const b = barRef.current && barRef.current.querySelector('.on') as HTMLElement | null; if (b && b.scrollIntoView) b.scrollIntoView({ inline: 'center', block: 'nearest' }); });
  const [t, setT] = React.useState(() => { const k = hq('tab'); return TABS.some(x => x.id === k) ? k : 'ov'; });
  return <>
    <div className="gld-tabs" role="tablist" ref={barRef}>{TABS.map(x => <button key={x.id} role="tab" aria-selected={t === x.id} className={t === x.id ? 'on' : ''} onClick={() => setT(x.id)}>{x.label}</button>)}</div>
    {t === 'ov' ? overview : t === 'fc' ? <ForecastsV2 /> : <ItemList id={t} />}</>;
}

export function GoldTab() {
  injectGoldCss();
  const g: any = GOLD; const d = daysSincePeak(); const [v2] = React.useState(v2On);
  return <div className="eg-pad gold" dir="rtl">
    <P className="gd-tag">ذهب عالمي · مش مرتبط بالبورصة المصرية</P>
    <section className="gd-hero"><small>من {g.peak.label} (أعلى إقفال)</small><div className="gd-count">{d}</div><b>يوم من القمة ولسه ما رجعش لقمته</b><small className="gd-asof">العدد لحد {todayLabel()} (توقيت القاهرة)</small>
      <P>العداد بيمشي من ساعة جهازك. أعمق نزول لحد آخر إقفال في المصدر (23 نوفمبر 2026): <bdi dir="ltr">{g.fallPct}%</bdi> (إقفال <bdi dir="ltr">${nf(g.peak.close)}</bdi> لحد <bdi dir="ltr">${nf(g.low.close)}</bdi> يوم {g.low.label}، يعني 296 يوم من القمة للقاع). الأساس: الإقفال اليومي. أعلى سعر خلال اليوم ممكن يكون مختلف.</P>
      <P className="gd-ref">سعر مرجعي: <b>{STATUS[g.price.status]}</b>{g.price.value ? ' ' + g.price.value : ''} · اللقطة مش متاخدة، فمفيش سعر معروض. بنعرض السعر بس لما يكون له مصدر وتوقيت.</P></section>
    {v2 ? <><TVChart h={Math.max(480, Math.round(window.innerHeight * 0.72))} /><GoldTabsV2 overview={<>
    <Sand />
    <Waits />
    <WeeklyCard />
    <TroughCard />
    <ForecastCards />
    <CorrelationCard />
    <P className="gd-note">الاستثمار (في الأسهم أو الذهب) فيه مخاطر.</P></>} /></> : <>
    <TVChart />
    <Sand />
    <Waits />
    <WeeklyCard />
    <TroughCard />
    <ForecastCards />
    <CorrelationCard />
    <P className="gd-note">الاستثمار (في الأسهم أو الذهب) فيه مخاطر.</P>
    </>}
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
.gld-tabs{display:flex;gap:6px;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;margin:10px 0;padding:2px}.gld-tabs button{flex:0 0 auto;white-space:nowrap;background:#141b29;color:#9fb0c8;border:1px solid #243049;border-radius:999px;padding:8px 14px;font:inherit;font-size:13.5px;cursor:pointer}.gld-tabs button.on{background:#e8c14a;color:#1a1500;border-color:#e8c14a;font-weight:700}
.gld-head{display:flex;justify-content:space-between;align-items:flex-start;gap:8px}.gld-head h3{margin:0 0 6px;font-size:15px}.gld-chip{flex:none;background:#2a2410;color:#e8c14a;border-radius:999px;padding:2px 10px;font-size:12px}.gld-stale{background:#3a2c10;color:#f0cf7a;border-radius:8px;padding:6px 10px;font-size:12.5px}.gld-more{background:none;border:0;color:#e8c14a;font:inherit;font-size:13px;padding:6px 0;cursor:pointer}
.gld-seg{display:flex;gap:6px;margin:6px 0}.gld-seg button{flex:1;background:#141b29;color:#9fb0c8;border:1px solid #243049;border-radius:10px;padding:10px 6px;font:inherit;font-size:13.5px;cursor:pointer}.gld-seg button.on{background:#e8c14a;color:#1a1500;border-color:#e8c14a;font-weight:700}
.gld-item{padding:10px 0;border-top:1px solid #243049}.gld-item:first-of-type{border-top:0}
`;
function injectGoldCss() { if (!document.getElementById('gold-css')) { const st = document.createElement('style'); st.id = 'gold-css'; st.textContent = GOLD_CSS; document.head.appendChild(st); } }
