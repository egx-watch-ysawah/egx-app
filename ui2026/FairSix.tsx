import React from 'react';
import { Link } from 'react-router-dom';
import D from './fair_six.json';
// Six-stock fair-value view. Text, numbers and bar widths are the approved preview4 content, unchanged.
// Colors: green = value above market price, red = below. The sign is also written (+/−), so color is never the only cue.
const sgn = (s: string) => s.replace('−', '−');
const FairOne = ({ c }: { c: any }) => <section className="fs-c" aria-label={c.code}>
      <header><b>{c.code}</b><span>{c.name}</span><em dir="ltr">{c.px}</em></header>
      <p className="fs-dt">السعر: {c.dt}</p>
      {c.rows.map((r: any, i: number) => <div key={i} className="fs-r">
        {r.na ? <div className="fs-l"><span>{r.nm}</span><span className="fs-na">{r.na}</span></div> : <>
          <div className="fs-l"><span>{r.nm}</span><b className={r.dir} dir="ltr">{r.dir === 'up' ? '▲ ' : '▼ '}{sgn(r.pc)}</b><strong className={r.dir} dir="ltr">{r.v}</strong></div>
          <div className="fs-b"><i>سعره في البورصة دلوقتي</i><div className="fs-t" dir="ltr"><div className="fs-f p" style={{ width: r.w[0] + '%' }} /></div><u>{r.u[0]}</u></div>
          <div className="fs-b"><i>قيمته بالحساب</i><div className="fs-t" dir="ltr"><div className={'fs-f ' + r.dir} style={{ width: r.w[1] + '%' }} /></div><u>{r.u[1]}</u></div></>}
        <div className="fs-d">{r.d}</div>
      </div>)}
      <p className="fs-s">{c.sm}</p>
    </section>;
export const FAIR6: string[] = (D as any).cards.map((c: any) => c.code);
// Same card as #/fair, shown inside the stock page's السعر العادل tab (one source of truth: fair_six.json).
export function FairCard({ code }: { code: string }) {
  const c = (D as any).cards.find((x: any) => x.code === code);
  if (!c) return null;
  return <div className="fs fs-in"><span className="fs-tag">تجريبي · معاينة فقط</span><FairOne c={c} /><p className="fs-ft">{(D as any).foot}</p></div>;
}
export function FairSix() {
  return <div className="eg-pad fs"><h1 className="fs-h">القيمة العادلة: الأسهم الستة</h1><span className="fs-tag">تجريبي · معاينة فقط</span>
    {(D as any).cards.map((c: any) => <FairOne key={c.code} c={c} />)}
    <p className="fs-ft">{(D as any).foot}</p></div>;
}
export function FairLink() {
  return <Link to="/fair" className="fs-link"><span><b>القيمة العادلة: الأسهم الستة</b><small>كام يساوي السهم بالحساب مقابل سعره. تجريبي.</small></span><em aria-hidden="true">‹</em></Link>;
}
