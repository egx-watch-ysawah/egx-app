import React from 'react';
import { Link } from 'react-router-dom';
import D from './fair_six.json';
// Six-stock fair-value view. Text, numbers and bar widths are the approved preview4 content, unchanged.
// Colors: green = value above market price, red = below. The sign is also written (+/−), so color is never the only cue.
const sgn = (s: string) => s.replace('−', '−');
export function FairSix() {
  return <div className="eg-pad fs"><h1 className="fs-h">القيمة العادلة: الأسهم الستة</h1><p className="fs-dt">الأسعار: إقفال 26 نوفمبر 2026 (من بيانات التطبيق)</p><span className="fs-tag">تجريبي · معاينة فقط</span>
    {(D as any).cards.map((c: any) => <section key={c.code} className="fs-c" aria-label={c.code}>
      <header><b>{c.code}</b><span>{c.name}</span><em dir="ltr">{c.px}</em></header>
      {c.rows.map((r: any, i: number) => <div key={i} className="fs-r">
        {r.na ? <div className="fs-l"><span>{r.nm}</span><span className="fs-na">{r.na}</span></div> : <>
          <div className="fs-l"><span>{r.nm}</span><b className={r.dir} dir="ltr">{r.dir === 'up' ? '▲ ' : '▼ '}{sgn(r.pc)}</b><strong className={r.dir} dir="ltr">{r.v}</strong></div>
          <div className="fs-b"><i>سعره في البورصة دلوقتي</i><div className="fs-t" dir="ltr"><div className="fs-f p" style={{ width: r.w[0] + '%' }} /></div><u>{r.u[0]}</u></div>
          <div className="fs-b"><i>قيمته بالحساب</i><div className="fs-t" dir="ltr"><div className={'fs-f ' + r.dir} style={{ width: r.w[1] + '%' }} /></div><u>{r.u[1]}</u></div></>}
        <div className="fs-d">{r.d}</div>
      </div>)}
      <p className="fs-s">{c.sm}</p>
    </section>)}
    <p className="fs-ft">{(D as any).foot}</p></div>;
}
export function FairLink() {
  return <Link to="/fair" className="fs-link"><span><b>القيمة العادلة: الأسهم الستة</b><small>كام يساوي السهم بالحساب مقابل سعره. تجريبي.</small></span><em aria-hidden="true">‹</em></Link>;
}
