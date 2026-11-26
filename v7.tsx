import React, { useEffect, useState } from 'react';
import { loadPage, NEW as NEWP, READY, usePage } from './page';
let cache: Promise<any> | null = null;
const load = () => cache || (cache = fetch('studies_rest/studies_rest/egx14_v7.json?t=' + Math.floor(Date.now() / 300000), { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).catch(() => null));
export const V7_CODES = ['ADIB', 'ENGC', 'ARCC', 'HDBK', 'UEGC', 'ATQA', 'ALCN', 'MCRO', 'DSCW', 'EGAS', 'AMER', 'COMI', 'ELSH', 'CCAP', 'ELEC', 'MASR', 'BONY', 'HRHO', 'UNIP', 'SWDY', 'TMGH', 'ORHD', 'MTIE', 'JUFO', 'PHAR', 'AMOC', 'CLHO', 'ETEL', 'EGAL', 'ABUK', 'MFPC', 'EAST', 'MCQE', 'PHDC', 'RMDA', 'FWRY', 'EFID', 'MBSC', 'MPRC', 'ISPH', 'ELKA', 'ETRS', 'EFIH', 'ATQA', 'OCDI', 'SCEM', 'ORAS', 'LCSW', 'RAYA'];
export { loadPilotM } from './page';
export const isV7 = (k: string) => V7_CODES.includes(k) || READY().includes(k);
const wd = (x: any): any => typeof x === 'string' ? x.replace(/[\u0660-\u0669]/g, (c: string) => String(c.charCodeAt(0) - 0x660)) : Array.isArray(x) ? x.map(wd) : x && typeof x === 'object' ? Object.fromEntries(Object.entries(x).map(([k, y]) => [k, wd(y)])) : x;
export function V7Card({ k, fair }: { k: string; fair?: boolean }) {
  const [d, setD] = useState<any>(null);
  useEffect(() => { if (!isV7(k)) return; const ok = (x: any) => x && x.stocks && x.stocks[k] ? { ...x.stocks[k], footer: x.footer_ar } : null; (fair ? loadPage(k).then(p => p || load().then(ok)) : load().then(ok)).then(x => setD(x ? wd(x) : x)); }, [k, fair]);
  if (!isV7(k) || !d) return null;
  const scs: any[] = (d.scenarios || []).filter((n: any) => n.note_ar || n.note2_ar);
  const shared = scs.length > 1 && scs.every((n: any) => n.note_ar === scs[0].note_ar && n.note2_ar === scs[0].note2_ar);
  const big = (n: any, key: any) => n.text_ar
    ? (fair && String(key).startsWith('s') ? <div key={key} className="v7-n"><b>السيناريو</b><p className="eg-note">{n.text_ar}</p></div> : <p key={key} className="eg-note">{n.text_ar}</p>)
    : <div key={key} className="v7-n">{n.case_type_ar ? <small className="v7-ct">{n.case_type_ar}</small> : null}<b>{n.label_ar}</b>{n.range_label_ar ? <small className="v7-ct">{n.range_label_ar}</small> : null}<div className="v7-v">{n.value == null ? <bdi>غير متوفر</bdi> : <><bdi>{n.value}</bdi> {n.unit_ar}</>}</div>{n.as_of_ar ? <small>{n.as_of_ar}</small> : null}{n.status_ar ? <p className="eg-note">{n.status_ar}</p> : null}{n.source_ar ? <p className="eg-note">{n.source_ar}</p> : null}{n.tap_ar ? <p className="eg-note">{n.tap_ar}</p> : null}{!shared && n.note_ar ? <p className="eg-note">{n.note_ar}</p> : null}{!shared && n.note2_ar ? <p className="eg-note">{n.note2_ar}</p> : null}{n.assumptions_ar && n.assumptions_ar.length ? <details className="v7-as"><summary>الافتراضات</summary><ul>{n.assumptions_ar.map((a: string, j: number) => <li key={j}>{a}</li>)}</ul>{n.assumptions_more_ar && n.assumptions_more_ar.length ? <details className="v7-as"><summary>{n.more_label_ar || 'عرض المزيد'}</summary><ul>{n.assumptions_more_ar.map((a: string, j: number) => <li key={j}>{a}</li>)}</ul></details> : null}</details> : null}{fair && n.range_note_ar ? <p className="eg-note">{n.range_note_ar}</p> : null}</div>;
  const paras = (t: any, key: any) => typeof t === 'string' && t ? <div key={key}>{t.split('\n').filter((x: string) => x.trim()).map((x: string, j: number) => <p key={j} className="eg-note v7-s">{x}</p>)}</div> : null;
  const small = (n: any, key: any) => n.text_ar
    ? <React.Fragment key={key}><p className="eg-note">{n.text_ar}</p>{n.standalone_line ? <p className="eg-note v7-s"><b>{n.standalone_line.label_ar}:</b> <bdi>{n.standalone_line.value}</bdi> {n.standalone_line.unit_ar}{n.standalone_line.as_of_ar ? ' (' + n.standalone_line.as_of_ar + ')' : ''}</p> : null}{n.standalone_line && n.standalone_line.tap_ar ? <p className="eg-note">{n.standalone_line.tap_ar}</p> : null}{paras(n.auditor_note_ar, 'an')}</React.Fragment>
    : <React.Fragment key={key}><p className="eg-note v7-s"><b>{n.label_ar}:</b> <bdi>{n.value}</bdi> {n.unit_ar}{n.as_of_ar ? ' (' + n.as_of_ar + ')' : ''}</p>{n.caveat_line_ar ? <p className="eg-note v7-s"><b>تنبيه:</b> {n.caveat_line_ar}</p> : null}{n.tap_ar ? <p className="eg-note">{n.tap_ar}</p> : null}</React.Fragment>;
  const sc: any[] = d.scenarios || [];
  const v15Node = d.market_assumption ? <div className="eg-exb v7-in">
      {d.period_ar && d.period_ar !== 'غير متوفر' ? <p className="eg-note">الفترة: {d.period_ar}</p> : null}
      {d.study_card_date_ar ? <p className="eg-note v7-s">{d.study_card_date_ar}</p> : null}
      {d.market_price ? <p className="eg-note v7-s"><b>{d.market_price.label_ar}:</b> <bdi>{d.market_price.value}</bdi> {d.market_price.unit_ar}{d.market_price.as_of_ar ? ' · ' + d.market_price.as_of_ar : ''}</p> : null}
      {d.analyst ? big(d.analyst, 'a') : null}
      {sc[0] ? big(sc[0], 's0') : null}
      {d.scenarios_note_ar ? <p className="eg-note">{d.scenarios_note_ar}</p> : null}
      {(d.why_ar || []).map((t: string, i: number) => <p key={'w' + i} className="eg-note">{t}</p>)}
      {d.stake_line_ar ? <p className="eg-note">{d.stake_line_ar}</p> : null}
      {d.range_note_ar ? <p className="eg-note">{d.range_note_ar}</p> : null}
      {d.rate_explain_ar ? <p className="eg-note">{d.rate_explain_ar}</p> : null}
      {d.eps_table_ar && d.eps_table_ar.length ? <table className="v7-tbl"><tbody>{d.eps_table_ar.map((r: any, i: number) => <tr key={i}><td>{r.label}</td><td><bdi>{r.value}</bdi></td></tr>)}</tbody></table> : null}
      {d.items_ar ? <p className="eg-note">{d.items_ar}</p> : null}
      {sc.slice(1).length ? <div className="v7-sub">{sc.slice(1).map((n: any, i: number) => big(n, 'c' + i))}</div> : null}
      {big(d.market_assumption, 'm')}
      {d.market_assumption.no_solution_ar ? <p className="eg-note">{d.market_assumption.no_solution_ar}</p> : null}
      {d.price_to_book_ar ? <p className="eg-note">{d.price_to_book_ar}</p> : null}
      {d.developer_base_ar ? <p className="eg-note">{d.developer_base_ar}</p> : null}
      {d.cash_treatment_ar ? <p className="eg-note">{d.cash_treatment_ar}</p> : null}
      {d.sensitivity_cash_ar ? <details className="eg-ex"><summary>{d.sensitivity_cash_ar.label_ar}</summary><div className="eg-exb"><p className="eg-note v7-s"><bdi>{d.sensitivity_cash_ar.base}</bdi> جنيه للسهم (من <bdi>{d.sensitivity_cash_ar.low}</bdi> لـ<bdi>{d.sensitivity_cash_ar.high}</bdi>).</p>{d.sensitivity_cash_ar.note_ar ? <p className="eg-note v7-s">{d.sensitivity_cash_ar.note_ar}</p> : null}</div></details> : null}
      {d.land_line_ar ? <p className="eg-note">{d.land_line_ar}</p> : null}
      {d.backlog_ar ? <p className="eg-note">{d.backlog_ar}</p> : null}
      {!d.sensitivity_D_ar && d.sensitivity_lines_ar && d.sensitivity_lines_ar.length ? <details className="eg-ex"><summary>تفاصيل الحساسية</summary><div className="eg-exb">{d.sensitivity_lines_ar.map((t: string, i: number) => <p key={i} className="eg-note v7-s">{t}</p>)}</div></details> : null}
      {d.liquidity_ar ? <p className="eg-note">{d.liquidity_ar}</p> : null}
      {d.book_value ? small(d.book_value, 'b') : null}
      {paras(d.auditor_note_ar, 'dn')}
      {d.risks_ar && d.risks_ar.length ? <div className="v7-u"><b>نقاط محتاجة انتباه</b>{d.risks_ar.map((r: string, i: number) => <p key={i} className="eg-note">{r}</p>)}</div> : null}
      {d.summary_points_ar && d.summary_points_ar.length ? <div className="v7-u"><b>ملخص من القوائم</b>{d.summary_points_ar.map((r: string) => (d.cashflow_note_ar && r.indexOf(d.cashflow_note_ar) >= 0 ? r.replace(d.cashflow_note_ar, '').trim() : r)).map((r: string, i: number) => <p key={i} className="eg-note">{r}</p>)}</div> : null}
      {d.scope_note_ar ? <p className="eg-note">{d.scope_note_ar}</p> : null}
      {d.sensitivity_D_ar ? <details className="eg-ex"><summary>تفاصيل الحساسية</summary><div className="eg-exb"><p className="eg-note v7-s">لو حسبنا الأذون ككاش: <bdi>{d.sensitivity_D_ar.bills_as_cash}</bdi> جنيه للسهم (من <bdi>{d.sensitivity_D_ar.bills_as_cash_low}</bdi> لـ<bdi>{d.sensitivity_D_ar.bills_as_cash_high}</bdi>).</p><p className="eg-note v7-s">ولو شلنا الدخل التاني كمان: <bdi>{d.sensitivity_D_ar.also_without_other_income}</bdi> جنيه للسهم.</p>{d.sensitivity_D_note_ar ? <p className="eg-note v7-s">{d.sensitivity_D_note_ar}</p> : null}{(d.sensitivity_lines_ar || []).map((t: string, i: number) => <p key={'sl' + i} className="eg-note v7-s">{t}</p>)}</div></details> : null}
      {d.sources_ar && d.sources_ar.length ? <div className="v7-u"><b>المصادر</b>{d.sources_ar.map((r: any, i: number) => <p key={i} className="eg-note v7-s">{r.url && /^https:\/\//.test(r.url) ? <a href={r.url} target="_blank" rel="noreferrer noopener">{r.label}</a> : /ستارتا ماركتس/.test(r.label || '') ? <a href="https://startamarkets.com/" target="_blank" rel="noreferrer noopener">{r.label}</a> : r.label}</p>)}</div> : null}
      {d.footer_ar ? <p className="eg-note v7-s">{d.footer_ar}</p> : null}
      {d.footer_note_ar ? <p className="eg-note v7-s">{d.footer_note_ar}</p> : null}
    </div> : null;
  const bodyNode = <div className="eg-exb v7-in">
      {d.period_ar && d.period_ar !== 'غير متوفر' ? <p className="eg-note">الفترة: {d.period_ar}</p> : null}
      {d.analyst ? big(d.analyst, 'a') : null}
      {(d.scenarios || []).map((n: any, i: number) => big(n, 's' + i))}
      {d.scenarios_note_ar ? <p className="eg-note">{d.scenarios_note_ar}</p> : null}
      {shared ? <div className="v7-sh">{scs[0].note_ar ? <p className="eg-note">{scs[0].note_ar}</p> : null}{scs[0].note2_ar ? <p className="eg-note">{scs[0].note2_ar}</p> : null}</div> : null}
      {d.book_value ? small(d.book_value, 'b') : null}
      {paras(d.auditor_note_ar, 'dn')}
      {(d.extra || []).map((n: any, i: number) => small(n, 'x' + i))}
      {d.unavailable && d.unavailable.length && !(fair && (d.scenarios || []).some((n: any) => n.text_ar)) ? <div className="v7-u"><b>غير متوفر</b>{d.unavailable.map((u: any, i: number) => <p key={i} className="eg-note">{u.item_ar}: {u.reason_ar}</p>)}</div> : null}
      {d.risks_ar && d.risks_ar.length ? (fair ? <div className="v7-u"><b>نقاط محتاجة انتباه</b>{d.risks_ar.map((r: string, i: number) => <p key={i} className="eg-note">{r}</p>)}</div> : d.risks_ar.map((r: string, i: number) => <p key={i} className="eg-note">{r}</p>)) : null}
    </div>;
  if (fair) return <div className="v7-fair"><div className="v7-fh"><b>السعر العادل</b> <span className="tg">{d.tag_ar}</span></div>{v15Node || bodyNode}</div>;
  return <details className="eg-ex v7"><summary>الأرقام المراجَعة ({d.tag_ar})</summary>
    {bodyNode}</details>;
}
export function useFairNew(k: string) {
  const [on, setOn] = useState(false);
  const pgx = usePage(k);
  useEffect(() => {
    if (!isV7(k)) { setOn(false); return; }
    if (/[?&]new(=|&|$)/.test(location.hash)) { setOn(true); return; }
    if (NEWP(k)) { setOn(true); return; }
    let live = true;
    fetch('studies_rest/studies_rest/fair_new.json?t=' + Math.floor(Date.now() / 300000), { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).then(x => { if (live) setOn(!!(x && Array.isArray(x.codes) && x.codes.includes(k))); }).catch(() => {});
    return () => { live = false; };
  }, [k, pgx]);
  return on;
}
