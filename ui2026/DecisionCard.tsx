import React, { useEffect, useState } from 'react';

// Decision card for one stock, inside the الفني tab. Reads the same fair-value file the fair-value tab reads.
const DAYS = ['الأحد', 'الاتنين', 'التلات', 'الأربع', 'الخميس', 'الجمعة', 'السبت'];
const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const dateAr = (iso: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || '')); if (!m) return '';
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return DAYS[d.getUTCDay()] + ' ' + (+m[3]) + ' ' + MONTHS[+m[2] - 1] + ' ' + m[1];
};
const f2 = (v: number) => v.toFixed(Math.abs(v) < 1 ? 3 : 2);
const N = ({ v }: { v: number }) => <bdi dir="ltr">{f2(v)}</bdi>;
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

export function DecisionCard({ code, close, date: dt }: { code: string; close?: number; date?: string }) {
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
    <p className="dc-ft">{fin && fin.peer_data_date_ar ? fin.peer_data_date_ar : 'غير متوفر: تاريخ بيانات الشركات المقارنة (peer_data_date_ar)'}</p>
    {nt.map((x, i) => <p key={i} className="dc-ft">ملاحظة: {x}</p>)}
    <p className="dc-ft">دي قراءة تحليلية مش توصية بشراء أو بيع، والقرار النهائي قرارك ومسؤوليتك.</p>
  </section>;
}
