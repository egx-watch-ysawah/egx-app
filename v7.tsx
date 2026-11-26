import React, { useEffect, useState } from 'react';
let cache: Promise<any> | null = null;
const loadP = (): Promise<any> => pcache || (pcache = fetch('studies_rest/studies_rest/egx14_v7_pilot.json?t=' + Math.floor(Date.now() / 300000), { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).catch(() => null));
let pcache: Promise<any> | null = null;
const load = () => cache || (cache = fetch('studies_rest/studies_rest/egx14_v7.json?t=' + Math.floor(Date.now() / 300000), { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).catch(() => null));
export const V7_CODES = ['MASR', 'BONY', 'HRHO', 'UNIP', 'SWDY', 'TMGH', 'ORHD', 'MTIE', 'JUFO', 'PHAR', 'AMOC', 'CLHO', 'ETEL', 'EGAL', 'ABUK', 'MFPC', 'EAST', 'MCQE', 'PHDC', 'RMDA', 'FWRY', 'EFID', 'MBSC', 'MPRC', 'ISPH', 'ELKA', 'ETRS', 'EFIH', 'ATQA', 'OCDI', 'SCEM', 'ORAS', 'LCSW', 'RAYA'];
export const isV7 = (k: string) => V7_CODES.includes(k);
export function V7Card({ k, fair }: { k: string; fair?: boolean }) {
  const [d, setD] = useState<any>(null);
  useEffect(() => { if (!isV7(k)) return; const ok = (x: any) => x && x.stocks && x.stocks[k] ? { ...x.stocks[k], footer: x.footer_ar } : null; (fair ? loadP().then(p => ok(p) || load().then(ok)) : load().then(ok)).then(setD); }, [k, fair]);
  if (!isV7(k) || !d) return null;
  const scs: any[] = (d.scenarios || []).filter((n: any) => n.note_ar || n.note2_ar);
  const shared = scs.length > 1 && scs.every((n: any) => n.note_ar === scs[0].note_ar && n.note2_ar === scs[0].note2_ar);
  const big = (n: any, key: any) => n.text_ar
    ? (fair && String(key).startsWith('s') ? <div key={key} className="v7-n"><b>السيناريو</b><p className="eg-note">{n.text_ar}</p></div> : <p key={key} className="eg-note">{n.text_ar}</p>)
    : <div key={key} className="v7-n">{n.case_type_ar ? <small className="v7-ct">{n.case_type_ar}</small> : null}<b>{n.label_ar}</b><div className="v7-v"><bdi>{n.value}</bdi> {n.unit_ar}</div>{n.as_of_ar ? <small>{n.as_of_ar}</small> : null}{n.status_ar ? <p className="eg-note">{n.status_ar}</p> : null}{n.source_ar ? <p className="eg-note">{n.source_ar}</p> : null}{n.tap_ar ? <p className="eg-note">{n.tap_ar}</p> : null}{!shared && n.note_ar ? <p className="eg-note">{n.note_ar}</p> : null}{!shared && n.note2_ar ? <p className="eg-note">{n.note2_ar}</p> : null}{n.assumptions_ar && n.assumptions_ar.length ? <details className="v7-as"><summary>الافتراضات</summary><ul>{n.assumptions_ar.map((a: string, j: number) => <li key={j}>{a}</li>)}</ul>{n.assumptions_more_ar && n.assumptions_more_ar.length ? <details className="v7-as"><summary>{n.more_label_ar || 'عرض المزيد'}</summary><ul>{n.assumptions_more_ar.map((a: string, j: number) => <li key={j}>{a}</li>)}</ul></details> : null}</details> : null}</div>;
  const paras = (t: any, key: any) => typeof t === 'string' && t ? <div key={key}>{t.split('\n').filter((x: string) => x.trim()).map((x: string, j: number) => <p key={j} className="eg-note v7-s">{x}</p>)}</div> : null;
  const small = (n: any, key: any) => n.text_ar
    ? <React.Fragment key={key}><p className="eg-note">{n.text_ar}</p>{n.standalone_line ? <p className="eg-note v7-s"><b>{n.standalone_line.label_ar}:</b> <bdi>{n.standalone_line.value}</bdi> {n.standalone_line.unit_ar}{n.standalone_line.as_of_ar ? ' (' + n.standalone_line.as_of_ar + ')' : ''}</p> : null}{n.standalone_line && n.standalone_line.tap_ar ? <p className="eg-note">{n.standalone_line.tap_ar}</p> : null}{paras(n.auditor_note_ar, 'an')}</React.Fragment>
    : <React.Fragment key={key}><p className="eg-note v7-s"><b>{n.label_ar}:</b> <bdi>{n.value}</bdi> {n.unit_ar}{n.as_of_ar ? ' (' + n.as_of_ar + ')' : ''}</p>{n.caveat_line_ar ? <p className="eg-note v7-s"><b>تنبيه:</b> {n.caveat_line_ar}</p> : null}{n.tap_ar ? <p className="eg-note">{n.tap_ar}</p> : null}</React.Fragment>;
  const bodyNode = <div className="eg-exb v7-in">
      {d.period_ar && d.period_ar !== 'غير متوفر' ? <p className="eg-note">الفترة: {d.period_ar}</p> : null}
      {d.analyst ? big(d.analyst, 'a') : null}
      {(d.scenarios || []).map((n: any, i: number) => big(n, 's' + i))}
      {shared ? <div className="v7-sh">{scs[0].note_ar ? <p className="eg-note">{scs[0].note_ar}</p> : null}{scs[0].note2_ar ? <p className="eg-note">{scs[0].note2_ar}</p> : null}</div> : null}
      {d.book_value ? small(d.book_value, 'b') : null}
      {paras(d.auditor_note_ar, 'dn')}
      {(d.extra || []).map((n: any, i: number) => small(n, 'x' + i))}
      {d.unavailable && d.unavailable.length && !(fair && (d.scenarios || []).some((n: any) => n.text_ar)) ? <div className="v7-u"><b>غير متوفر</b>{d.unavailable.map((u: any, i: number) => <p key={i} className="eg-note">{u.item_ar}: {u.reason_ar}</p>)}</div> : null}
      {d.risks_ar && d.risks_ar.length ? (fair ? <div className="v7-u"><b>نقاط محتاجة انتباه</b>{d.risks_ar.map((r: string, i: number) => <p key={i} className="eg-note">{r}</p>)}</div> : d.risks_ar.map((r: string, i: number) => <p key={i} className="eg-note">{r}</p>)) : null}
    </div>;
  if (fair) return <div className="v7-fair"><div className="v7-fh"><b>السعر العادل</b> <span className="tg">{d.tag_ar}</span></div>{bodyNode}</div>;
  return <details className="eg-ex v7"><summary>الأرقام المراجَعة ({d.tag_ar})</summary>
    {bodyNode}</details>;
}
export function useFairNew(k: string) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!isV7(k)) { setOn(false); return; }
    if (/[?&]new(=|&|$)/.test(location.hash)) { setOn(true); return; }
    let live = true;
    fetch('studies_rest/studies_rest/fair_new.json?t=' + Math.floor(Date.now() / 300000), { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).then(x => { if (live) setOn(!!(x && Array.isArray(x.codes) && x.codes.includes(k))); }).catch(() => {});
    return () => { live = false; };
  }, [k]);
  return on;
}
