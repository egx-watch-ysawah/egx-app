import React, { useEffect, useState } from 'react';
let cache: Promise<any> | null = null;
const load = () => cache || (cache = fetch('studies_rest/studies_rest/egx14_v7.json?t=' + Math.floor(Date.now() / 300000), { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).catch(() => null));
export const V7_CODES = ['MASR', 'BONY', 'HRHO', 'UNIP', 'SWDY', 'TMGH', 'ORHD', 'MTIE', 'JUFO', 'PHAR', 'AMOC', 'CLHO', 'ETEL', 'EGAL', 'ABUK', 'MFPC', 'EAST', 'MCQE', 'PHDC', 'RMDA', 'FWRY', 'EFID', 'MBSC', 'MPRC'];
export const isV7 = (k: string) => V7_CODES.includes(k);
export function V7Card({ k }: { k: string }) {
  const [d, setD] = useState<any>(null);
  useEffect(() => { if (isV7(k)) load().then(x => setD(x && x.stocks && x.stocks[k] ? { ...x.stocks[k], footer: x.footer_ar } : null)); }, [k]);
  if (!isV7(k) || !d) return null;
  const big = (n: any, key: any) => n.text_ar
    ? <p key={key} className="eg-note">{n.text_ar}</p>
    : <div key={key} className="v7-n"><b>{n.label_ar}</b><div className="v7-v"><bdi>{n.value}</bdi> {n.unit_ar}</div>{n.as_of_ar ? <small>{n.as_of_ar}</small> : null}{n.status_ar ? <p className="eg-note">{n.status_ar}</p> : null}{n.source_ar ? <p className="eg-note">{n.source_ar}</p> : null}{n.tap_ar ? <p className="eg-note">{n.tap_ar}</p> : null}{n.assumptions_ar && n.assumptions_ar.length ? <details className="v7-as"><summary>الافتراضات</summary><ul>{n.assumptions_ar.map((a: string, j: number) => <li key={j}>{a}</li>)}</ul>{n.assumptions_more_ar && n.assumptions_more_ar.length ? <details className="v7-as"><summary>{n.more_label_ar || 'عرض المزيد'}</summary><ul>{n.assumptions_more_ar.map((a: string, j: number) => <li key={j}>{a}</li>)}</ul></details> : null}</details> : null}</div>;
  const small = (n: any, key: any) => n.text_ar
    ? <p key={key} className="eg-note">{n.text_ar}</p>
    : <p key={key} className="eg-note v7-s"><b>{n.label_ar}:</b> <bdi>{n.value}</bdi> {n.unit_ar}{n.as_of_ar ? ' (' + n.as_of_ar + ')' : ''}{n.tap_ar ? ' · ' + n.tap_ar : ''}</p>;
  return <details className="eg-ex v7"><summary>الأرقام المراجَعة ({d.tag_ar})</summary>
    <div className="eg-exb v7-in">
      {d.period_ar && d.period_ar !== 'غير متوفر' ? <p className="eg-note">الفترة: {d.period_ar}</p> : null}
      {d.analyst ? big(d.analyst, 'a') : null}
      {(d.scenarios || []).map((n: any, i: number) => big(n, 's' + i))}
      {d.book_value ? small(d.book_value, 'b') : null}
      {(d.extra || []).map((n: any, i: number) => small(n, 'x' + i))}
      {d.unavailable && d.unavailable.length ? <div className="v7-u"><b>غير متوفر</b>{d.unavailable.map((u: any, i: number) => <p key={i} className="eg-note">{u.item_ar}: {u.reason_ar}</p>)}</div> : null}
      {d.risks_ar && d.risks_ar.length ? d.risks_ar.map((r: string, i: number) => <p key={i} className="eg-note">{r}</p>) : null}
    </div></details>;
}
