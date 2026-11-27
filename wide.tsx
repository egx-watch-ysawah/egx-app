import React, { useEffect, useState } from 'react';
import { SixScen, FV6CSS, Card, Srcs, noCodes, tidy, SIX } from './fv6';

// Wide-range fair-value card (COMI, TMGH first). Data-only: reads studies_rest/studies_rest/fair_value_wide.json and financial_wide.json
// written by the content agent. Renders text as given; unknown keys are ignored and every field is checked before it is read.
export const WIDE = ['COMI', 'TMGH', ...SIX];
const mk = (f: string) => { let c: Promise<any> | null = null; return () => c || (c = fetch('studies_rest/studies_rest/' + f + '?t=' + Math.floor(Date.now() / 300000), { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).catch(() => null)); };
const loadFair = mk('fair_value_wide.json'), loadFin = mk('financial_wide.json');
let c6: Promise<any> | null = null;
const loadSix = () => c6 || (c6 = fetch('studies_rest/studies_rest/fair_value_sourced_six.json?t=' + Math.floor(Date.now() / 300000), { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).then(noCodes).catch(() => null));
const num = (v: any) => typeof v === 'number' && isFinite(v);
const str = (v: any) => (typeof v === 'string' && v.trim() ? v : '');
const arr = (v: any): any[] => (Array.isArray(v) ? v : []);
const fx = (v: number) => '\u2066' + (Math.abs(v) >= 1 ? v.toFixed(2) : v.toFixed(3)) + '\u2069';
const L = ({ v }: { v: number }) => <bdi dir="ltr">{fx(v)}</bdi>;
const A = ({ u }: { u: string }) => <a href={u} target="_blank" rel="noreferrer">{u.replace(/^https?:\/\//, '')}</a>;
const Fold = ({ t, children }: { t: string; children: React.ReactNode }) => <details className="gd-det"><summary>{t}</summary>{children}</details>;
const Tx = ({ t, cls }: { t: any; cls?: string }) => (str(t) ? <div className={cls || 'na'}>{str(t)}</div> : null);
const CSS = `
.wr .q{margin:10px 0 2px;display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:16px;font-weight:700;color:#9da3ab;flex-wrap:wrap}
.wr .tg{font-size:12px;font-weight:400;border:1px solid #454950;color:#8a919c;border-radius:10px;padding:2px 8px;white-space:nowrap}
.wr .tg.conf{border-color:#50565e;color:#8a919c}
.wr .hd{font-size:12.5px;color:#a4a9b1;margin:6px 0 0}
.wr .big{font-size:24px;font-weight:700;color:#fff;margin:2px 0}
.wr .ex{font-size:13px;line-height:1.8;color:#bfc3c9;margin:2px 0 6px}
.wr .na{color:#a4a9b1;font-size:12.5px;line-height:1.8;margin:4px 0}
.wr .ours{color:#aaafb6;font-size:13px;line-height:1.8;margin:4px 0}
.wr .src{color:#aeb3ba;font-size:12.5px;line-height:1.8}.wr .src a,.wr .na a{color:#b7bbc2;word-break:break-all;display:inline-block;padding:10px 0}
.wr .mm{background:#0b0f12;border:1px solid #1e252f;border-radius:10px;padding:9px;margin:8px 0;font-size:13px;line-height:1.8;color:#dbdde1}
.wr .mm h5{margin:0 0 4px;font-size:14px;color:#fff;display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.wr .rg{display:flex;align-items:baseline;gap:6px;flex-wrap:wrap;margin:4px 0}.wr .rg b{font-size:19px;color:#fff}.wr .rg small{color:#969da6;font-size:12px}
.wr .mid{color:#969da6;font-size:12px;margin:0 0 4px}
.wr .nt{font-size:12px;color:#969da6;line-height:1.7;margin:6px 0}
.wr .mk{position:relative;height:auto;margin:8px 2px 4px}
.wr .mk .tr{position:relative;height:10px;background:#111822;border-radius:6px;margin:6px 0}
.wr .mk .bd{position:absolute;top:0;bottom:0;border-radius:6px;background:#42464d}
.wr .mk .bd.ov{background:#5e646e;opacity:.85}
.wr .mk .pt{position:absolute;top:-5px;bottom:-5px;width:2px;background:#6a717c}
.wr .mk .lb{position:relative;height:18px;font-size:12px;color:#aaafb6;white-space:nowrap}
.wr .mk .lb span{position:absolute;transform:translateX(-50%)}
.wr .mk{direction:rtl}.wr .mk .row{display:block;margin:6px 0;font-size:12px;color:#969da6}.wr .mk .cap{display:flex;justify-content:space-between;gap:8px;line-height:1.6;color:#bfc3c9}.wr .mk .cap b{font-weight:500;color:#fff;white-space:nowrap}.wr .mk .row .tr{direction:ltr;margin:3px 0}.wr .mk .bd.alt{background:repeating-linear-gradient(90deg,#42464d 0 6px,#1e252f 6px 9px)}.wr .mk .lb{direction:ltr}
.wr table{width:100%;border-collapse:collapse;font-size:12.5px;margin:4px 0}.wr th,.wr td{border:1px solid #1e252f;padding:6px 4px;text-align:center;min-width:44px}.wr th{color:#a4a9b1;font-weight:500}
.wr ul{margin:2px 0;padding-inline-start:18px}.wr li{margin:2px 0}
.wr .um{color:#aaafb6;font-size:12px;margin-inline-start:4px}
.wr .sub{border-top:1px dashed #42464d;margin-top:8px;padding-top:6px}
`;

// price marker: one captioned bar per method (name and range), alternative ranges too, overlap band on top, one tick for the price. No wording about cheap or expensive.
function Marker({ s, ms }: { s: any; ms: any[] }) {
  const a = s.aggregate || {};
  const price = num(s.price) ? s.price : null;
  type R = { cap: string; lo: number; hi: number; cls: string };
  const rows: R[] = [];
  const ov = a.overlap && num(a.conservative) && num(a.optimistic);
  if (ov) rows.push({ cap: str(a.name_ar) ? 'منطقة التقاطع' : 'منطقة التقاطع', lo: a.conservative, hi: a.optimistic, cls: 'ov' });
  ms.forEach((m, i) => {
    const nm = (ms.filter(x => num(x.conservative) && num(x.optimistic)).length === 1 ? 'طريقة واحدة بس' : 'طريقة ' + (i + 1)) + (str(m.name_ar) || str(m.label_ar) ? ': ' + (str(m.name_ar) || str(m.label_ar)) : '');
    if (num(m.conservative) && num(m.optimistic)) rows.push({ cap: nm, lo: m.conservative, hi: m.optimistic, cls: '' });
  });
  const all: number[] = [];
  rows.forEach(r => all.push(r.lo, r.hi));
  if (price != null) all.push(price);
  if (all.length < 2) return null;
  const lo = Math.min(...all), hi = Math.max(...all), pad = (hi - lo) * 0.06 || 1;
  const x0 = lo - pad, span = hi + pad - x0;
  const p = (v: number) => ((v - x0) / span) * 100;
  const pt = price != null ? <div className="pt" style={{ left: p(price) + '%' }} /> : null;
  return <div className="mk" aria-label="مكان السعر الحالي بالنسبة للنطاقات">
    {rows.map((r, i) => <div className="row" key={i}>
      <div className="cap"><span>{r.cap}</span><b dir="ltr">{fx(r.lo)} – {fx(r.hi)}</b></div>
      <div className="tr"><div className={'bd ' + r.cls} style={{ left: p(r.lo) + '%', width: Math.max(1, p(r.hi) - p(r.lo)) + '%' }} />{pt}</div>
    </div>)}
    {price != null ? <div className="lb"><span style={{ left: Math.min(88, Math.max(12, p(price))) + '%' }}>السعر الحالي {fx(price)}</span></div> : null}
  </div>;
}

function Peers({ m }: { m: any }) {
  const ps = arr(m.peers); if (!ps.length) return null;
  const roe = ps.some((p: any) => num(p.roe_pct));
  return <Fold t="الشركات المشابهة">
    <Tx t={m.peers_label_ar} />
    <table><thead><tr><th>الشركة</th><th>الرقم</th>{roe ? <th>العائد %</th> : null}<th>تاريخ السعر</th></tr></thead><tbody>
      {ps.map((p: any, i: number) => <tr key={(p.code || '') + i}><td>{str(p.name_ar) || p.code}{p.verified === false ? <span className="um" title={str(p.unverified_reason_ar)}> ◌ غير متحقق</span> : null}</td><td dir="ltr">{p.value}</td>{roe ? <td dir="ltr">{num(p.roe_pct) ? p.roe_pct : '—'}</td> : null}<td>{str(p.price_as_of)}</td></tr>)}
    </tbody></table>
    {ps.filter((p: any) => p.verified === false && str(p.unverified_reason_ar)).map((p: any, i: number) => <div className="na" key={'u' + i}>◌ {str(p.name_ar)}: {str(p.unverified_reason_ar)}</div>)}
    <Tx t={m.peers_note} />
  </Fold>;
}
function Sens({ x, m }: { x: any; m?: any }) {
  if (!x || typeof x !== 'object') return null;
  const eu = m && m.eps_used && num(m.eps_used.value) ? m.eps_used.value : null;
  // Sentence text supplied by Main on 25 Nov 2026 (round 12); numbers come from the data file.
  const line = num(x.eps) && eu != null && num(x.conservative) && num(x.optimistic) ? 'لو استخدمنا ربح السهم ' + x.eps + ' بدل ' + eu + ' يبقى نطاق المقارنة بالأرباح ' + x.conservative + ' لـ' + x.optimistic + ' (تجربة، مش طريقة رابعة).' : '';
  return <div className="sub">{line ? <div className="ours" style={{ borderInlineStart: '3px dashed #42464d', paddingInlineStart: 8 }}>{line}</div> : null}<b>{str(x.title_ar)}</b>
    <div className="rg">{num(x.conservative) ? <><small>محافظ</small><b><L v={x.conservative} /></b></> : null}{num(x.optimistic) ? <><small>إلى</small><b><L v={x.optimistic} /></b></> : null}{num(x.base) ? <small>· الوسط <L v={x.base} /></small> : null}</div>
    <Tx t={x.price_position_ar} /><Tx t={x.note_ar} />{str(x.source) ? <div className="src"><A u={x.source} /></div> : null}</div>;
}
function SensTable({ x }: { x: any }) {
  const rows = arr(x && x.rows).filter((r: any) => num(r.ke_pct) && num(r.g_pct) && num(r.value));
  if (!rows.length) return null;
  const ks = Array.from(new Set(rows.map((r: any) => r.ke_pct))).sort((a: any, b: any) => a - b) as number[];
  const gs = Array.from(new Set(rows.map((r: any) => r.g_pct))).sort((a: any, b: any) => a - b) as number[];
  const get = (ke: number, g: number) => (rows.find((r: any) => r.ke_pct === ke && r.g_pct === g) || {}).value;
  return <div className="sub"><b>{str(x.title_ar)} <span className="tg">افتراض</span></b>
    <Tx t={x.note_ar} />
    <table><thead><tr><th>العائد المطلوب ↓ / النمو →</th>{gs.map(g => <th key={g} dir="ltr">{g}%</th>)}</tr></thead><tbody>
      {ks.map(k => <tr key={k}><th dir="ltr">{k}%</th>{gs.map(g => <td key={g} dir="ltr">{num(get(k, g)) ? get(k, g).toFixed(1) : '—'}</td>)}</tr>)}
    </tbody></table>
    {str(x.source) ? <div className="src"><A u={x.source} /></div> : null}</div>;
}
function Cross({ x }: { x: any }) {
  if (!x || typeof x !== 'object') return null;
  return <div className="sub"><b>{str(x.title_ar)}</b>
    <div className="rg">{num(x.conservative) ? <><small>محافظ</small><b><L v={x.conservative} /></b></> : null}{num(x.optimistic) ? <><small>إلى</small><b><L v={x.optimistic} /></b></> : null}{num(x.base) ? <small>· الوسط <L v={x.base} /></small> : null}</div>
    <Tx t={x.price_position_ar} />{arr(x.peers).length ? <div className="na">{arr(x.peers).join('، ')}</div> : null}<Tx t={x.note_ar} /></div>;
}
function Range({ m, lo, hi, base }: { m: any; lo: any; hi: any; base: any }) {
  if (!num(lo) && !num(hi)) return null;
  return <><div className="rg">{num(lo) ? <><small>{str(m.low_label_ar) || 'محافظ'}</small><b><L v={lo} /></b></> : null}{num(lo) && num(hi) ? <small>إلى</small> : null}{num(hi) ? <><small>{str(m.high_label_ar) || 'متفائل'}</small><b><L v={hi} /></b></> : null}</div>
    {num(base) && m.show_midpoint !== true ? <div className="mid">{str(m.median_label_ar) || 'الوسط'}: <L v={base} /></div> : null}
    {num(base) && m.show_midpoint === true ? <div className="mid">الوسط: <L v={base} /></div> : null}</>;
}
const Status = ({ m }: { m: any }) => (str(m.status) ? <span className="tg">{m.status}</span> : null);

// Methods whose range sits outside the overlap zone. Item shape is not final, so accept a string or an object with any of these keys.
function Outside({ list }: { list: any }) {
  const xs = arr(list); if (!xs.length) return null;
  const line = (o: any) => {
    if (typeof o === 'string') return o;
    if (!o || typeof o !== 'object') return '';
    const t = str(o.text_ar) || str(o.label_ar) || str(o.name_ar) || str(o.method_name);
    const r = num(o.conservative) && num(o.optimistic) ? ' ' + fx(o.conservative) + ' إلى ' + fx(o.optimistic) : '';
    return (t + r + (str(o.position_ar) ? ' · ' + o.position_ar : '') + (str(o.price_position_ar) ? ' · ' + o.price_position_ar : '')).trim();
  };
  const ls = xs.map(line).filter(Boolean); if (!ls.length) return null;
  return <div className="mm"><b>خارج منطقة التقاطع:</b><ul>{ls.map((x, i) => <li key={i}>{x}</li>)}</ul></div>;
}

export function WideFair({ k, fallback }: { k: string; fallback?: React.ReactNode }) {
  const [d, setD] = useState<any>(undefined);
  useEffect(() => { let on = true; (SIX.includes(k) ? loadSix : loadFair)().then(x => on && setD(x)); return () => { on = false; }; }, [k]);
  if (d === undefined) return <p className="gd-sum">بحمّل...</p>;
  const s = d && d.stocks && d.stocks[k];
  if (!s) return <>{fallback || <p className="gd-sum">غير متوفر: مقدرتش أحمّل بيانات السعر العادل دلوقتي. جرب تاني بعد شوية.</p>}</>;
  const a = s.aggregate || {}, ms = arr(s.methods), cf = s.confidence || {};
  const ov = a.overlap === true && num(a.conservative) && num(a.optimistic);
  return <div className="gd-fv wr fv6"><style>{FV6CSS}</style><style>{CSS}</style>
    <div className="q"><span>السعر العادل</span><span>{str(s.badge_ar) ? <span className="tg">{s.badge_ar}</span> : null}</span></div>
    {str(s.price_note) ? <p className="hd">السعر المستخدم: {num(s.price) ? <L v={s.price} /> : null} ({s.price_note})</p> : null}
    {ov ? <>
      <div className="hd">{str(a.name_ar) || 'منطقة التقاطع'} {str(a.label) ? <span className="tg">{a.label}</span> : null}</div>
      <div className="big"><L v={a.conservative} /> إلى <L v={a.optimistic} /></div>
      {Array.isArray(a.methods_in_overlap_ar) && a.methods_in_overlap_ar.length && !a.methods_in_overlap_ar.every((x: any) => typeof x === 'string' && str(a.name_ar).includes(x)) ? <div className="ex">داخلين في التقاطع: {a.methods_in_overlap_ar.filter((x: any) => typeof x === 'string').join('، ')}</div> : (Array.isArray(a.methods_in_overlap_ar) ? null : <Tx t={a.methods_in_overlap_ar} cls="ex" />)}
      <Tx t={a.reason_ar} cls="ex" />
      </>
      : <><div className="big">مفيش رقم مجمّع</div><Tx t={a.reason_ar || a.reason} cls="ex" /></>}
    <Tx t={s.basis_line_ar} cls="hd" />
    <Tx t={a.noncore_warning_ar} cls="ours" />
    <Marker s={s} ms={ms} />
    {s.price_marker && str(s.price_marker.text_ar) ? <p className="hd" data-pos={str(s.price_marker.position)}>{s.price_marker.text_ar}</p> : null}
    {str(cf.level_ar) ? <div><span className="tg conf">الثقة: {cf.level_ar}</span>{str(cf.reason_ar) ? <Fold t="ليه الثقة كده؟"><div className="na">{cf.reason_ar}</div></Fold> : null}</div> : null}
    <Fold t="الطرق والمصادر">
      {ms.map((m: any, i: number) => <div className="mm" key={(m.method_key || '') + i}>
        <h5>{ms.length === 1 ? 'طريقة واحدة بس' : 'طريقة ' + (i + 1)}: {str(m.name_ar)} <Status m={m} /></h5>
        <Range m={m} lo={m.conservative} hi={m.optimistic} base={m.base} />
        <Tx t={m.range_text_ar} /><Tx t={m.price_position_ar} cls="ours" />
        {num(m.conservative) || num(m.optimistic) ? <Tx t={m.midpoint_text_ar} /> : null}<Tx t={m.assumed_multiple_label_ar} />
        {str(m.range_kind_ar) ? <span className="tg">{m.range_kind_ar}</span> : null}<Tx t={m.note_ar} /><Tx t={m.shares_status_ar ? 'عدد الأسهم: ' + m.shares_status_ar : ''} />
        {m.card_ar && typeof m.card_ar === 'object' ? <Card c={m.card_ar} /> : null}
        {str(m.status_reason) ? <Tx t={m.status_reason} /> : null}
        <Tx t={m.noncore_warning_ar} cls="ours" />{str(m.caveat) && !m.card_ar ? <div className="ours">ملحوظة: {m.caveat}</div> : null}
        {str(m.basis) && !m.card_ar ? <div>الحساب: {m.basis}</div> : null}
        {str(m.curriculum_basis) || str(m.source) ? <div className="src">{str(m.curriculum_basis)}{str(m.source) ? <><br /><A u={m.source} /></> : null}</div> : null}
        <Peers m={m} />
        <Sens x={m.sensitivity} m={m} /><SensTable x={m.sensitivity_table} /><Cross x={m.cross_check_after_share} />
      </div>)}
      <Tx t={s.peers_note} /><Tx t={s.circular_peers_note_ar} /><Tx t={s.share_basis_note} />
      <Srcs l={s.sources_detail_ar} />
      {arr(s.unavailable).map((u: any, i: number) => <div className="na" key={'u' + i}><b>غير متاح · {str(u.method_name)}:</b> {str(u.reason)}</div>)}
      {s.cross_check_news && str(s.cross_check_news.text_ar) ? <div className="na"><span className="tg">من الأخبار</span> {s.cross_check_news.text_ar} {str(s.cross_check_news.source) ? <A u={s.cross_check_news.source} /> : null}</div> : null}
      <Tx t={d.peer_dates_note_ar} cls="nt" /><Tx t={d.curriculum_note_ar} cls="nt" />
      {arr(s.provenance).length ? <div className="na"><b>المصادر:</b><ul>{arr(s.provenance).map((p: any, i: number) => <li key={i}>{typeof p === 'string' ? p : [str(p.item_ar) || str(p.text_ar) || str(p.title_ar) || str(p.url), p.kind === 'ours' ? '(من عندنا)' : p.kind === 'sourced' ? '(من مصدر)' : '', str(p.as_of)].filter(Boolean).join(' · ')}</li>)}</ul></div> : null}
    </Fold>
    {str(s.backtest_line_ar) ? <p className="nt">{s.backtest_line_ar}</p> : null}
    {SIX.includes(k) ? <SixScen d={d} s={s} /> : null}
    <Tx t={d.note_ar} cls="nt" />
  </div>;
}

// Financial tab: "how we calculated" block.
export function WideFin({ k }: { k: string }) {
  const [d, setD] = useState<any>(undefined);
  useEffect(() => { let on = true; loadFin().then(x => on && setD(x)); return () => { on = false; }; }, []);
  const s = d && d.stocks && d.stocks[k];
  if (!s) return null;
  const ms = arr(s.methods), gl = s.glossary_ar && typeof s.glossary_ar === 'object' ? Object.entries(s.glossary_ar) : [];
  return <div className="gd-fv wr"><style>{CSS}</style>
    <div className="q"><span>{str(s.title) || 'كيف حسبنا السعر العادل'}</span>{str(s.badge_ar) ? <span className="tg">{s.badge_ar}</span> : null}</div>
    {str(s.summary) ? <p className="ex" style={{ whiteSpace: 'normal' }}>{s.summary}</p> : null}
    <Tx t={s.small} cls="nt" />
    <Fold t="كيف حسبنا">
      {ms.map((m: any, i: number) => <div className="mm" key={i}>
        <h5>{ms.length === 1 ? 'طريقة واحدة بس' : 'طريقة ' + (i + 1)}: {str(m.label_ar)} <Status m={m} /></h5>
        <Range m={m} lo={(m.values || {}).conservative} hi={(m.values || {}).optimistic} base={(m.values || {}).base} />
        <Tx t={m.range_text_ar} /><Tx t={m.price_position_ar} cls="ours" /><Tx t={m.midpoint_text_ar} />
        {str(m.how) ? <div>الحساب: {m.how}</div> : null}
        {str(m.caveat) ? <div className="ours">ملحوظة: {m.caveat}</div> : null}
        {str(m.curriculum_basis) || str(m.source) ? <div className="src">{str(m.curriculum_basis)}{str(m.source) ? <><br /><A u={m.source} /></> : null}</div> : null}
        <Peers m={m} /><Sens x={m.sensitivity} m={m} /><SensTable x={m.sensitivity_table} /><Cross x={m.cross_check_after_share} />
      </div>)}
      <Tx t={s.method_explainer} />
      {arr(s.unavailable).map((u: any, i: number) => <div className="na" key={'u' + i}><b>غير متاح · {str(u.method_name)}:</b> {str(u.reason)}</div>)}
      {s.cross_check_news && str(s.cross_check_news.text_ar) ? <div className="na"><span className="tg">من الأخبار</span> {s.cross_check_news.text_ar}</div> : null}
    </Fold>
    {gl.length ? <Fold t="معنى الكلمات">{gl.map(([a, b]: any) => <div className="na" key={a}><b>{a}:</b> {String(b)}</div>)}</Fold> : null}
    {arr(s.sources).length ? <Fold t="المصادر"><div className="src">{arr(s.sources).map((u: any, i: number) => typeof u === 'string' ? <div key={i}><A u={u} /></div> : null)}</div></Fold> : null}
  </div>;
}
