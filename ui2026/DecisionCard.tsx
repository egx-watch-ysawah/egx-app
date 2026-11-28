import React, { useEffect, useState } from 'react';

// Decision card for one stock, inside the الفني tab. Reads the same fair-value file the fair-value tab reads.
const DAYS = ['الأحد', 'الاتنين', 'التلات', 'الأربع', 'الخميس', 'الجمعة', 'السبت'];
const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const dateAr = (iso: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || '')); if (!m) return '';
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return DAYS[d.getUTCDay()] + ' ' + (+m[3]) + ' ' + MONTHS[+m[2] - 1] + ' ' + m[1];
};
const f2 = (v: number) => (v < 0 ? 'ناقص ' : '') + Math.abs(v).toFixed(Math.abs(v) < 1 ? 3 : 2);
const N = ({ v }: { v: number }) => (v < 0 ? <bdi>ناقص <bdi dir="ltr">{f2(Math.abs(v))}</bdi></bdi> : <bdi dir="ltr">{f2(v)}</bdi>);
let cache: Promise<any> | null = null;
const ld: Record<string, Promise<any>> = {};
const load = (f: string) => ld[f] || (ld[f] = fetch('studies_rest/studies_rest/' + f, { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).catch(() => null));
const FILE = (c: string) => (c === 'COMI' || c === 'TMGH' ? 'fair_value_wide.json' : 'fair_value_sourced_six.json');

const CSS = `
.dc{background:#111822;border:1px solid #1e252f;border-radius:14px;padding:14px;margin:10px 0;color:#dbdde1;direction:rtl}
.dc-top{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}
.dc-t{font-size:16px;font-weight:700;color:#fff}
.dc-tag{font-size:12px;border:1px solid #454950;color:#a5aab2;border-radius:10px;padding:2px 8px;white-space:nowrap}
.dc-fresh{display:inline-block;font-size:12.5px;color:#b4bac4;background:#0b0f12;border:1px solid #1e252f;border-radius:10px;padding:4px 10px;margin:8px 0 2px}
.dc-px{font-size:26px;font-weight:700;color:#fff;margin:6px 0 0}.dc-px small{font-size:13px;color:#a5aab2;font-weight:400;margin-inline-start:6px}
.dc-rg{font-size:14px;line-height:1.8;color:#dbdde1;margin:6px 0 0}.dc-rg b{color:#fff}
.dc-bar{position:relative;direction:ltr;height:10px;background:#0b0f12;border:1px solid #1e252f;border-radius:6px;margin:22px 4px 6px}
.dc-span{position:absolute;top:2px;bottom:2px;background:#2b323c;border-radius:4px}
.dc-ov{position:absolute;top:-1px;bottom:-1px;background:#6a717c;border-radius:5px}
.dc-pt{position:absolute;top:-8px;bottom:-8px;width:3px;background:#fff;border-radius:2px}
.dc-pl{position:absolute;top:-26px;transform:translateX(-50%);font-size:12px;color:#fff;white-space:nowrap}
.dc-ax{display:flex;justify-content:space-between;direction:ltr;font-size:12px;color:#a5aab2;margin:0 4px}
.dc-leg{font-size:12px;color:#b4bac4;line-height:1.8;margin:6px 0 0;display:flex;gap:12px;flex-wrap:wrap}
.dc-leg i{display:inline-block;width:12px;height:8px;border-radius:3px;margin-inline-end:5px;vertical-align:middle}
.dc-v{margin:12px 0 4px;padding:10px 12px;border:1px solid #454950;border-radius:10px;background:#0b0f12;font-size:15px;line-height:1.8;color:#fff;font-weight:700}
.dc-v span{display:block;font-size:12.5px;font-weight:400;color:#b4bac4}
.dc ol{margin:8px 0 0;padding-inline-start:20px;font-size:13.5px;line-height:1.9;color:#dbdde1}
.dc ol li{margin:3px 0}
.dc-ft{font-size:12px;line-height:1.8;color:#a5aab2;margin:10px 0 0}
`;

function TwoCard({ code, close, date: dt }: { code: string; close?: number; date?: string }) {
  const [fin, setFin] = useState<any>(null);
  useEffect(() => { load(FILE(code)).then(j => setFin(j && j.stocks && j.stocks[code] ? j.stocks[code] : null)); }, [code]);
  const price = typeof close === 'number' && close > 0 ? close : null;
  const date = dt ? String(dt).slice(0, 10) : '';
  const norm = (m: any) => { const v = m && m.values ? m.values : m; return v && typeof v.conservative === 'number' && typeof v.optimistic === 'number' ? { values: { conservative: v.conservative, optimistic: v.optimistic } } : null; };
  const ms = fin && Array.isArray(fin.methods) ? fin.methods.map(norm).filter((m: any) => m) : [];
  const style = <style>{CSS}</style>;
  if (price == null || !date) return <section className="dc" aria-label="ملخص القرار">{style}<div className="dc-t">ملخص القرار: غير متوفر</div><p className="dc-ft">غير متوفر: مفيش سعر إقفال متاح للسهم ده دلوقتي.</p></section>;
  const fresh = <div className="dc-fresh">أسعار إقفال يوم {dateAr(date)}</div>;
  if (ms.length < 1) return <section className="dc" aria-label="ملخص القرار">{style}<div className="dc-top"><span className="dc-t">ملخص القرار</span><span className="dc-tag">تجريبي</span></div>{fresh}<div className="dc-px"><N v={price} /><small>جنيه</small></div><div className="dc-v">غير متوفر: مفيش نطاق سعر عادل تقديري للسهم ده.</div></section>;
  const los = ms.map((m: any) => m.values.conservative as number), his = ms.map((m: any) => m.values.optimistic as number);
  const minLo = Math.min(...los), maxHi = Math.max(...his), maxLo = Math.max(...los), minHi = Math.min(...his);
  const allOverlap = maxLo <= minHi;
  const spread = (maxHi / minLo - 1) * 100;
  const agg = fin && fin.aggregate && typeof fin.aggregate.conservative === 'number' && typeof fin.aggregate.optimistic === 'number' ? fin.aggregate : null;
  // one range only: the shared band of all methods, else the two-of-three band the fair-value tab already shows
  let bl: number | null = null, bh: number | null = null, bnote = '';
  if (ms.length >= 2 && allOverlap) { bl = maxLo; bh = minHi; bnote = ms.length === 2 ? 'الطريقتين' : 'الطرق كلها'; }
  else {
    let best: [number, number, number] | null = null;
    for (let i = 0; i < ms.length; i++) for (let j = i + 1; j < ms.length; j++) { const lo = Math.max(los[i], los[j]), hi = Math.min(his[i], his[j]); if (lo <= hi && (!best || hi - lo < best[1] - best[0])) best = [lo, hi, 2]; }
    if (best) { bl = best[0]; bh = best[1]; bnote = 'طريقتين من ' + ms.length; }
  }
  const single = ms.length === 1;
  if (single) { bl = null; bh = null; }
  const disagree = single || !allOverlap || spread > 100;
  const lo = Math.min(minLo, price) * 0.94, hi = Math.max(maxHi, price) * 1.04, X = (v: number) => ((v - lo) / (hi - lo)) * 100;
  const pos = bl != null && bh != null ? (price > bh ? 'فوق' : price < bl ? 'تحت' : 'جوه') : '';
  const conf = fin && fin.confidence && fin.confidence.level_ar ? fin.confidence.level_ar : 'منخفضة';
  const reasons: React.ReactNode[] = [];
  reasons.push(single ? <li key="1">{fin && fin.aggregate && fin.aggregate.reason_ar ? String(fin.aggregate.reason_ar).replace(/\.$/, '') : 'طريقة واحدة بس عندها رقم'}.</li>
    : !allOverlap ? <li key="1">الطرق مش متفقة: أقل رقم <N v={minLo} /> وأعلى رقم <N v={maxHi} /> جنيه.</li>
    : disagree ? <li key="1">الطريقتين بيتقاطعوا، بس المدى واسع: من <N v={minLo} /> لـ <N v={maxHi} /> جنيه.</li>
    : <li key="1">{ms.length === 2 ? 'الطريقتين' : 'الطرق'} بيتقاطعوا، ومدى كل الطرق من <N v={minLo} /> لـ <N v={maxHi} /> جنيه.</li>);
  if (bl != null && bh != null) reasons.push(<li key="2">إقفال <N v={price} /> {pos} النطاق اللي {bnote} متفقين عليه (<N v={bl} /> لـ <N v={bh} />).</li>);
  else if (single) reasons.push(<li key="2">إقفال <N v={price} /> {price > maxHi ? 'فوق' : price < minLo ? 'تحت' : 'جوه'} مدى الطريقة دي (<N v={minLo} /> لـ <N v={maxHi} />)، ودي قراءة طريقة واحدة بس.</li>);
  else reasons.push(<li key="2">مفيش نطاق مشترك بين الطرق، فمفيش رقم نقارن بيه السعر.</li>);
  const nt: string[] = [];
  if (fin && fin.aggregate && fin.aggregate.noncore_warning_ar) nt.push(String(fin.aggregate.noncore_warning_ar));
  if (fin && fin.aggregate && /متحفظ/.test(String(fin.aggregate.reason_ar || ''))) nt.push('الأرقام مبنية على أموال مساهمين وربح مراجع الحسابات متحفظ عليهم.');
  reasons.push(<li key="3">الثقة {conf}: {fin && fin.confidence && fin.confidence.reason_ar ? String(fin.confidence.reason_ar).split('. ')[0].replace(/\.$/, '').replace(/ \([^)]*\)/, '') : 'الأرقام من مصدر مجاني ومش متراجعة على كل القوائم'}.</li>);
  return <section className="dc" aria-label="ملخص القرار">{style}
    <div className="dc-top"><span className="dc-t">ملخص القرار</span><span className="dc-tag">تجريبي</span></div>
    {fresh}
    <div className="dc-px"><N v={price} /><small>جنيه، إقفال {dateAr(date)}</small></div>
    {single ? <div className="dc-rg">نطاق طريقة واحدة بس: من <b><N v={minLo} /></b> لـ <b><N v={maxHi} /></b> جنيه، من غير طريقة تانية تأكده.</div> : bl != null && bh != null ? <div className="dc-rg">نطاق السعر العادل التقديري: من <b><N v={bl} /></b> لـ <b><N v={bh} /></b> جنيه ({allOverlap ? bnote + ' متفقين' : bnote}).</div> : <div className="dc-rg">نطاق السعر العادل التقديري: غير متوفر، لأن الطرق مالهاش نطاق مشترك.</div>}
    <div className="dc-bar" role="img" aria-label="السعر مقابل نطاق السعر العادل التقديري">
      <div className="dc-span" style={{ left: X(minLo) + '%', width: (X(maxHi) - X(minLo)) + '%' }} />
      {bl != null && bh != null && <div className="dc-ov" style={{ left: X(bl) + '%', width: Math.max(1, X(bh) - X(bl)) + '%' }} />}
      <div className="dc-pt" style={{ left: X(price) + '%' }} /><div className="dc-pl" style={{ left: Math.min(88, Math.max(12, X(price))) + '%' }}><bdi dir="ltr">{f2(price)}</bdi></div>
    </div>
    <div className="dc-ax"><span>{f2(minLo)}</span><span>{f2(maxHi)}</span></div>
    <div className="dc-leg">{bl != null && <span><i style={{ background: '#6a717c' }} />النطاق المشترك</span>}<span><i style={{ background: '#2b323c' }} />{single ? 'مدى الطريقة الوحيدة' : 'مدى كل الطرق'}</span><span><i style={{ background: '#fff', width: 3 }} />إقفال {dateAr(date).split(' ').slice(1, 3).join(' ')}</span></div>
    {disagree ? <div className="dc-v">مفيش حكم واحد نقدر نقوله دلوقتي.<span>{single ? 'فيه طريقة واحدة بس عندها رقم، فمنقولش السعر أعلى ولا أقل من النطاق.' : (allOverlap ? 'المدى بين الطرق واسع جدا، فمنقولش السعر أعلى ولا أقل من النطاق.' : 'الطرق مش متفقة على نطاق واحد، فمنقولش السعر أعلى ولا أقل من النطاق.')}</span></div>
      : <div className="dc-v">السعر {pos} النطاق المشترك.<span>ده وصف للأرقام الحالية، مش حكم.</span></div>}
    <ol>{reasons}</ol>
    <p className="dc-ft">{fin && fin.peer_data_date_ar ? fin.peer_data_date_ar : 'غير متوفر: تاريخ بيانات الشركات المقارنة'}</p>
    {nt.map((x, i) => <p key={i} className="dc-ft">ملاحظة: {x}</p>)}
    <p className="dc-ft">دي قراءة تحليلية مش توصية بشراء أو بيع، والقرار النهائي قرارك ومسؤوليتك.</p>
  </section>;
}

// P/B-only card (one comparison, weaker than the two-method cards). Reads studies_rest/pb/<CODE>.json.
const TWO = ['COMI', 'TMGH', 'MASR', 'BONY', 'HRHO', 'UNIP', 'PHAR', 'ORHD'];
const PBCSS = `
.dc-pbt{font-size:12px;border:1px solid #454950;color:#b4bac4;border-radius:10px;padding:2px 8px;white-space:nowrap}
.dc-pbt.w{border-color:#de575b;color:#e8898c}
.dc-det{margin:10px 0 0}.dc-det summary{min-height:44px;display:flex;align-items:center;font-size:13px;color:#b4bac4;cursor:pointer}
.dc-det ul{margin:0;padding-inline-start:20px;font-size:12.5px;line-height:1.9;color:#b4bac4}
`;
const pload = (c: string) => load('pb/' + c + '.json');
const nameOf = (p: any) => (p && p.name_ar ? p.name_ar : <bdi dir="ltr">{p && p.code}</bdi>);
const LEVEL: Record<string, string> = { industry: 'من نفس النشاط', sector: 'من قطاع أوسع مش نفس النشاط', industry_small: 'من نفس النشاط، وعددهم قليل', sector_small: 'من قطاع أوسع مش نفس النشاط، وعددهم قليل' };
const NOR = (st: string, ms: string) => (st === 'non_egp' ? 'النطاق بالجنيه بس، والسهم ده بيتداول بالدولار.'
  : st === 'no_feed' ? 'السهم مش موجود في بيانات السوق اللي بنقارن بيها.'
  : st === 'no_group' ? 'تصنيف نشاط السهم في بيانات السوق، فمنعرفش نقارنه بمين.'
  : /book value/.test(ms) ? 'القيمة الدفترية للسهم. مفيش قوائم مالية ولا رقم ليها في بيانات السوق، فمقدرناش نحسب نطاق.'
  : /peers/.test(ms) ? 'شركات مقارنة. أقل من شركتين في نفس القطاع عندهم P/B، فمفيش نطاق نحسبه.'
  : 'سبب النقص مش متسجل، فمفيش نطاق نحسبه.');

function PBCard({ code, close, date: dt }: { code: string; close?: number; date?: string }) {
  const [d, setD] = useState<any>(undefined);
  useEffect(() => { let on = true; pload(code).then(j => on && setD(j)); return () => { on = false; }; }, [code]);
  const style = <style>{CSS + PBCSS}</style>;
  const date = dt ? String(dt).slice(0, 10) : '';
  if (d === undefined) return null;
  const method = d && d.method ? String(d.method) : 'pb_peers';
  const hist = method === 'price_history_52w', usd = !!d && (d.currency === 'USD' || method === 'usd_pb_peers');
  const unit = usd ? 'دولار' : 'جنيه';
  // USD stocks: no currency conversion, compare in USD only, with the file's own price
  const price = usd ? (d && typeof d.price === 'number' ? d.price : null) : (typeof close === 'number' && close > 0 ? close : null);
  const pdt = usd ? String(d && d.as_of || '') : date;
  const head = <div className="dc-top"><span className="dc-t">ملخص القرار</span><span className="dc-tag">تجريبي</span></div>;
  const foot = <p className="dc-ft">دي قراءة تحليلية مش توصية بشراء أو بيع، والقرار النهائي قرارك ومسؤوليتك.</p>;
  const px = price != null && pdt ? <div className="dc-px"><N v={price} /><small>{unit}، {usd ? 'سعر ' : 'إقفال '}{dateAr(pdt)}</small></div> : null;
  const rg = d && d.range && typeof d.range.low === 'number' && typeof d.range.high === 'number' ? d.range : null;
  const neg = !!d && !!rg && !hist && (rg.low <= 0 || (typeof d.own_bvps === 'number' && d.own_bvps <= 0));
  if (!d || !rg || neg) {
    const line = neg ? 'غير متوفر: القيمة الدفترية للسهم بالسالب، فمفيش نطاق P/B ليه معنى.' : !d ? 'غير متوفر: مفيش نطاق سعر تقديري للسهم ده.' : d.method === 'none' && d.confidence_ar ? String(d.confidence_ar) : 'غير متوفر: ' + (d.missing_ar ? String(d.missing_ar).replace(/[.،]$/, '') : NOR(String(d.status || ''), String(d.missing || ''))) + '.';
    return <section className="dc" aria-label="ملخص القرار">{style}{head}{px}<div className="dc-v">{line}</div>{d && d.profile && d.profile.last_updated ? <p className="dc-ft">ملف الشركة على موقع arabfinance.com آخر تحديث له: <bdi dir="ltr">{String(d.profile.last_updated)}</bdi>.</p> : null}{foot}</section>;
  }
  const mm = d.multiples || {};
  const tag = String(d.confidence_ar || '').split(':')[0] || 'ثقة منخفضة';
  const weak = d.tier === 3 || /ضعيفة/.test(tag);
  const same = price != null && !!pdt && (usd || d.price_date === date || (hist && String(d.as_of) === date));
  const flat = rg.low === rg.high;
  const lo = Math.min(rg.low, price != null ? price : rg.low) * 0.94, hi = Math.max(rg.high, price != null ? price : rg.high) * 1.04, X = (v: number) => (hi > lo ? ((v - lo) / (hi - lo)) * 100 : 50);
  const pos = same ? (price! > rg.high ? 'فوق' : price! < rg.low ? 'تحت' : 'جوه') : '';
  const bvDate = /[\u0600-\u06FF]|^\d/.test(String(d.own_bvps_date || '')) ? String(d.own_bvps_date) : 'آخر ربع في بيانات السوق، تاريخه مش معروف';
  const conv = /USD/.test(String(d.own_bvps_source || ''));
  const bvSrc = conv ? 'محوّلة من قوائم مالية بالدولار' : d.own_bvps_source === 'reviewed statements' ? 'من القوائم المالية' : 'من بيانات السوق';
  const flags: React.ReactNode[] = [];
  (Array.isArray(d.review_flags) ? d.review_flags : []).forEach((f: any, i: number) => {
    const t = String(f);
    if (/spread very wide/.test(t) && typeof mm.min === 'number' && typeof mm.max === 'number') flags.push(<li key={'f' + i}>مدى P/B بين الشركات المقارنة واسع جدا: من <N v={mm.min} /> لـ <N v={mm.max} /> مرة.</li>);
    else if (/raises the top of the range/.test(t)) { const m = /\(([\d.]+) vs ([\d.]+) without it\)/.exec(t); if (m) flags.push(<li key={'f' + i}>شركة مقارنة واحدة (جديدة في البورصة وخسرانة) رفعت أعلى النطاق: الحد الأعلى <N v={+m[1]} /> بيها و<N v={+m[2]} /> من غيرها.</li>); }
    else if (/^feed drift/.test(t)) {
      const o = /own P\/B moved ([\d.]+) \((\d+:\d+) file\) -> ([\d.]+) \((\d+) Nov pull\)/.exec(t), q = /peer P\/B changed vs (\d+:\d+) file: ([A-Z0-9,]+)/.exec(t);
      if (o) flags.push(<li key={'fo' + i}>P/B بتاع السهم نفسه اتحرك في بيانات السوق: من <N v={+o[1]} /> (ملف الساعة <bdi dir="ltr">{o[2]}</bdi>) لـ <N v={+o[3]} /> (سحبة {o[4]} نوفمبر).</li>);
      if (q) flags.push(<li key={'fq' + i}>P/B شركات مقارنة (<bdi dir="ltr">{q[2].split(',').join(' ، ')}</bdi>) اتغير عن ملف الساعة <bdi dir="ltr">{q[1]}</bdi>، فالنطاق ممكن يتحرك.</li>);
    }
    else if (/differs from feed/.test(t)) flags.push(<li key={'f' + i}>القيمة الدفترية للسهم في القوائم مختلفة عن اللي بتطلع من بيانات السوق، فالنطاق ممكن يتحرك.</li>);
    else if (/USD peers/.test(t)) flags.push(<li key={'f' + i}>الشركات المقارنة المسعّرة بالدولار قليلة ومن قطاعات مختلطة، فالنطاق واسع جدا وللاستدلال بس.</li>);
  });
  const peers: any[] = Array.isArray(d.peers) ? d.peers : [];
  const rs = /pulled (\d+) Nov (\d{4})/.exec(String(d.range_source || ''));
  const pdate = d.peer_data_date_ar ? String(d.peer_data_date_ar)
    : hist ? 'مدى الـ52 أسبوع من بيانات السوق' + (rs ? ' (سحبة ' + rs[1] + ' نوفمبر ' + rs[2] + ')' : '') + '، وسعر الإقفال ' + dateAr(String(d.as_of || '')).split(' ').slice(1).join(' ') + '.'
    : 'بيانات الشركات المقارنة بتاريخ ' + dateAr(String(d.as_of || '')).split(' ').slice(1).join(' ') + '.';
  const mline = d.method_ar ? String(d.method_ar) : 'نطاق من مقارنة السعر بالقيمة الدفترية (P/B) للشركات المشابهة';
  return <section className="dc" aria-label="ملخص القرار">{style}
    {head}
    <div className="dc-top" style={{ marginTop: 8 }}><span className="dc-pbt">{hist ? 'مدى سعر تاريخي' : usd ? 'P/B بالدولار' : 'مقارنة P/B بس، مش زي بطاقة الطريقتين'}</span><span className={'dc-pbt' + (weak ? ' w' : '')}>{tag}</span></div>
    <p className="dc-ft" style={{ marginTop: 8 }}>الطريقة: {mline}</p>
    {px}
    {hist ? (flat ? <div className="dc-rg">أدنى وأعلى سعر في آخر 52 أسبوع متساويين: <b><N v={rg.low} /></b> {unit}، يعني مفيش مدى.</div> : <div className="dc-rg">أدنى وأعلى سعر في آخر 52 أسبوع: من <b><N v={rg.low} /></b> لـ <b><N v={rg.high} /></b> {unit}.</div>)
      : <div className="dc-rg">نطاق تقديري {usd ? 'بالدولار ' : ''}من مقارنة السعر بالقيمة الدفترية (P/B) بس: من <b><N v={rg.low} /></b> لـ <b><N v={rg.high} /></b> {unit}.</div>}
    {!flat && <><div className="dc-bar" role="img" aria-label="السعر مقابل النطاق">
      <div className="dc-ov" style={{ left: X(rg.low) + '%', width: Math.max(1, X(rg.high) - X(rg.low)) + '%' }} />
      {price != null && same && <><div className="dc-pt" style={{ left: X(price) + '%' }} /><div className="dc-pl" style={{ left: Math.min(88, Math.max(12, X(price))) + '%' }}><bdi dir="ltr">{f2(price)}</bdi></div></>}
    </div>
    <div className="dc-ax"><span>{f2(lo)}</span><span>{f2(hi)}</span></div></>}
    {hist ? <div className="dc-v">{same && !flat ? 'السعر ' + pos + ' مدى آخر 52 أسبوع.' : 'ده مدى سعر آخر 52 أسبوع.'}<span>ده مدى سعر حصل فعلا، مش تقدير للسعر العادل ولا حكم.</span></div>
      : weak ? <div className="dc-v">ثقة ضعيفة جدا، فالنطاق ده للاطلاع بس.<span>منقارنش بيه السعر ولا بنقول حكم.</span></div>
      : same ? <div className="dc-v">السعر {pos} النطاق ده.<span>ده وصف للأرقام الحالية، مش حكم.</span></div>
      : <div className="dc-v">غير متوفر: مقارنة السعر بالنطاق.<span>تاريخ إقفال الصفحة غير تاريخ بيانات النطاق.</span></div>}
    <ol>
      {typeof d.own_bvps === 'number' && d.own_bvps <= 0 && <li>القيمة الدفترية للسهم بالسالب (<N v={d.own_bvps} /> جنيه للسهم، {bvSrc})، فمقارنة P/B ملهاش معنى.</li>}
      {d.own_pb_at_price != null && typeof d.own_bvps === 'number' && d.own_bvps > 0 && <li>السعر بيساوي <N v={d.own_pb_at_price} /> مرة القيمة الدفترية للسهم (<N v={d.own_bvps} /> جنيه للسهم، {bvSrc}{conv ? ' ' : '، '}{bvDate}).</li>}
      {typeof mm.low === 'number' && typeof mm.high === 'number' && <li>{d.n_peers} شركة {LEVEL[d.peer_level] || (usd ? 'مسعّرة بالدولار' : 'مشابهة')} بتتداول على P/B من <N v={mm.low} /> لـ <N v={mm.high} /> مرة{typeof mm.median === 'number' ? <>، والوسيط <N v={mm.median} /></> : null}. بنضرب ده في القيمة الدفترية للسهم.</li>}
      <li>{d.confidence_ar}</li>
      {conv && <li>النطاق بيتحرك مع سعر صرف الدولار.</li>}
      {flags}
    </ol>
    {peers.length > 0 && <details className="dc-det"><summary>الشركات المقارنة ({peers.length})</summary><ul>{peers.map((p: any, i: number) => <li key={i}>{nameOf(p)}: P/B <N v={+p.pb} /></li>)}</ul></details>}
    <p className="dc-ft">{pdate}</p>
    {foot}
  </section>;
}

// batches switched on (B1 = portfolio, B2 = rest of EGX30); each batch passes the gate before it is added
const B2 = ["EMFD", "ETEL", "ISPH", "MCQE", "MFPC", "PHDC", "RAYA", "EFIH", "GBCO", "RMDA", "TMGH", "CLHO", "EFID", "ORAS", "SKPC", "BTFH", "EAST", "ABUK", "CCAP", "JUFO", "VLMRA", "AMOC", "EGAL", "FWRY", "HELI", "ADIB", "ALCN"];
export const CARD_ON = new Set<string>([...TWO, ...B2]);
export function DecisionCard({ code, close, date }: { code: string; close?: number; date?: string }) {
  return TWO.includes(code) ? <TwoCard code={code} close={close} date={date} /> : <PBCard code={code} close={close} date={date} />;
}
