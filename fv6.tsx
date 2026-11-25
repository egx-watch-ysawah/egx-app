import React, { useEffect, useState } from 'react';

// Sourced fair price and experimental targets for the six holdings. Data-only: studies_rest/studies_rest/fair_value_sourced_six.json is written by the content agent. Market data only.
export const SIX = ['MASR', 'BONY', 'HRHO', 'UNIP', 'PHAR', 'ORHD'];
let cache: Promise<any> | null = null;
const load = () => cache || (cache = fetch('studies_rest/studies_rest/fair_value_sourced_six.json?t=' + Math.floor(Date.now() / 300000), { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).then(noCodes).catch(() => null));
// Display-only: the content files name the two scenarios T1/T3 (and the removed T2); readers see words, not codes.
const noCodes: any = (x: any) => typeof x === 'string' ? x.replace(/\bT1\b/g, 'سيناريو 1').replace(/\bT3\b/g, 'سيناريو 2').replace(/\bT2\b/g, 'الطريقة التالتة') : Array.isArray(x) ? x.map(noCodes) : x && typeof x === 'object' ? Object.fromEntries(Object.entries(x).map(([k, v]) => [k, noCodes(v)])) : x;
const STALE_AN = 'أهداف المحللين من صفحات stockanalysis وغالبًا محسوبة على أسعار أقدم من سعر النهارده، فنسبة الفرق عن السعر الحالي مش دقيقة.';
const num = (v: any) => typeof v === 'number' && isFinite(v);
const reasonLine = (status: string, reason: string) => { const r = String(reason || ''); const st = String(status || ''); return !st || r.startsWith(st.split(' ')[0]) ? r : st + ': ' + r; };
const PEERS = 'مضاعفات الأقران من stockanalysis آخر 12 شهر ومن تواريخ مختلفة، وربحنا 9 شهور×4/3: الأساس مش متطابق.';
const isPeer = (m: any) => m && (m.method_key === 'PE' || m.method_key === 'PB' || /شركات شبهها|شركات مشابهة|أقران/.test(String(m.name_ar || m.label_ar || '')));
const Cell = ({ l, v }: { l: string; v: any }) => <div><small>{l}</small><b dir="ltr">{num(v) ? fx(v) : '—'}</b></div>;
const Vals = ({ c, b, o }: { c: any; b: any; o: any }) => (num(c) || num(b) || num(o)) ? <div className="vv"><Cell l="محافظ" v={c} /><Cell l="متوسط" v={b} /><Cell l="متفائل" v={o} /></div> : null;
const Caveat = ({ m }: { m: any }) => <>{m.caveat ? <div className="ours">ملحوظة: {m.caveat}</div> : null}{m.number_caveat && !String(m.caveat || '').includes(m.number_caveat) ? <div className="ours">{m.number_caveat}</div> : null}</>;
const rangeOf = (vs: number[]) => vs.length ? (Math.min(...vs) === Math.max(...vs) ? <bdi dir="ltr">{fx(vs[0])}</bdi> : <><bdi dir="ltr">{fx(Math.min(...vs))}</bdi> إلى <bdi dir="ltr">{fx(Math.max(...vs))}</bdi></>) : null;
const fx = (v: number) => '\u2066' + (v >= 1 ? v.toFixed(2) : v.toFixed(3)) + '\u2069';
const CSS = `
.fv6 .q{margin:10px 0 2px;display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:16px;font-weight:700;color:#5eead4}
.fv6 .tg{font-size:11.5px;font-weight:400;border:1px solid #6b5b2a;color:#f5c26b;border-radius:10px;padding:2px 8px;white-space:nowrap}
.fv6 .big{font-size:24px;font-weight:700;color:#fff;margin:2px 0}
.fv6 .vv2{display:flex;gap:8px;margin:4px 0}.fv6 .vv2 div{flex:1;background:#101827;border-radius:10px;text-align:center;padding:6px 2px}.fv6 .vv2 small{display:block;color:#8b97ad;font-size:11.5px}.fv6 .vv2 b{color:#fff;font-size:22px}
.fv6 .ex{font-size:13px;line-height:1.8;color:#b6c0d2;margin:2px 0 6px}
.fv6 .mm{background:#0a0e17;border:1px solid #1b2538;border-radius:10px;padding:9px;margin:8px 0;font-size:13px;line-height:1.8;color:#d5dbe7}
.fv6 .mm h5{margin:0 0 4px;font-size:14px;color:#fff}
.fv6 .vv{display:flex;gap:6px;margin:4px 0}.fv6 .vv div{flex:1;background:#101827;border-radius:8px;text-align:center;padding:4px 2px}
.fv6 .vv small{display:block;color:#8b97ad;font-size:11px}.fv6 .vv b{color:#fff}
.fv6 .src{color:#9fb0c9}.fv6 .src a{color:#7dd3fc;word-break:break-all}.fv6 .ours{color:#f5c26b}
.fv6 .na{color:#9aa6bb;font-size:12.5px;line-height:1.8;margin:4px 0}
.fv6 .an{border-top:1px dashed #2a3650;margin-top:8px;padding-top:6px;font-size:13px;color:#d5dbe7}
.fv6 hr{border:0;border-top:1px solid #263249;margin:12px 0}
.fv6 .nt{font-size:12px;color:#8b97ad;line-height:1.7;margin:6px 0}
`;
const A = ({ u }: { u: string }) => <a href={u} target="_blank" rel="noreferrer">{u.replace('https://', '').slice(0, 60)}</a>;
const Fold = ({ t, children }: { t: string; children: React.ReactNode }) => <details className="gd-det"><summary>{t}</summary>{children}</details>;

export function SourcedFair({ k }: { k: string }) {
  const [d, setD] = useState<any>(undefined);
  useEffect(() => { let on = true; load().then(x => on && setD(x)); return () => { on = false; }; }, []);
  if (d === undefined) return <p className="gd-sum">بحمّل...</p>;
  const s = d && d.stocks && d.stocks[k];
  if (!s) return <p className="gd-sum">غير متوفر: مقدرتش أحمّل بيانات السعر العادل والمستهدف دلوقتي. جرب تاني بعد شوية.</p>;
  const a = s.aggregate, ts: any[] = s.targets_experimental || [], an = s.analyst_reference || {};
  const vis = ts.filter(t => num(t.value)), vs: number[] = vis.map(t => t.value), hiddenN = ts.length - vis.length;
  const aOk = !!a && num(a.conservative) && num(a.optimistic);
  const bt = (vis.find(t => t.backtest_line) || {}).backtest_line;
  const day = (d.as_of === '2026-11-25' ? '25 نوفمبر 2026' : d.as_of);
  return <div className="gd-fv fv6"><style>{CSS}</style>
    <div className="q"><span>السعر العادل</span><span className="tg">تقديري · {day}</span></div>
    {aOk ? <div className="big"><bdi dir="ltr">{fx(a.conservative)}</bdi> إلى <bdi dir="ltr">{fx(a.optimistic)}</bdi></div> : <div className="big">غير متوفر</div>}
    <p className="ex">{aOk ? <>سعر تقديري من طرق ليها مرجع مكتوب تحت، عشان تقارنه بالسعر في السوق. {num(a.base) ? <>الوسط <bdi dir="ltr">{fx(a.base)}</bdi>. </> : null}{a.label} ({a.n_methods} طريقة). </> : <>غير متوفر: {(a && a.reason) || 'مفيش تجميع، لأن الطرق الموثوقة أقل من طريقتين.'} الطرق وحالة كل واحدة تحت. </>}السعر الحالي <bdi dir="ltr">{fx(s.price)}</bdi> ({s.price_note}).</p>
    <Fold t="الطرق والمصادر">
      {s.methods.map((m: any) => <div className="mm" key={m.method_key}>
        <h5>{m.name_ar} <span className="tg">{m.status || m.label}</span></h5>
        <Vals c={m.conservative} b={m.base} o={m.optimistic} />
        {m.status_reason ? <div className="na"><b>{reasonLine(m.status, m.status_reason)}</b></div> : null}
        {isPeer(m) && !m.peers && (num(m.conservative) || num(m.optimistic)) ? <div className="na">{PEERS}</div> : null}
        {Array.isArray(m.peers) && m.peers.length ? <div className="na">الأقران ومضاعف كل واحد وتاريخ سعره:<ul style={{ margin: '2px 0', paddingInlineStart: 18 }}>{m.peers.map((p: any) => <li key={p.code}>{p.name_ar} ({p.code}): <bdi dir="ltr">{p.value}</bdi> · سعر {p.price_as_of}</li>)}</ul></div> : null}
        {m.peers_note ? <div className="na">{m.peers_note}</div> : null}{m.implied_pb ? <div className="na">المضاعف المفترض: <bdi dir="ltr">{m.implied_pb}</bdi></div> : null}
        <div>الحساب: {m.basis}</div>
        <div className="src">المرجع: {m.curriculum_basis}<br /><A u={m.source} /><br /><small>{m.source_status}</small></div>
        <Caveat m={m} /></div>)}
      {s.peers_note ? <div className="na">{s.peers_note}</div> : null}
      {(s.unavailable || []).map((u: any, i: number) => <div className="na" key={i}><b>{u.method_name}:</b> {u.reason}</div>)}
      {aOk ? <div className="na">{a.name_ar}. {a.curriculum_basis}</div> : null}
    </Fold>
    <hr />
    <div className="q"><span>السعر المستهدف</span><span className="tg">تجريبي · {day}</span></div>
    {vis.length ? <div className="vv2">{vis.map((t: any) => <div key={t.key}><small>سيناريو {t.key === 'T1' ? '1' : t.key === 'T3' ? '2' : String(t.key).slice(1)}</small><b dir="ltr">{fx(t.value)}</b></div>)}</div> : <div className="big">غير متوفر</div>}
    <p className="ex">{vs.length ? 'سيناريوهين بسيطين بنجرب بيهم سعر ممكن يوصله السهم، كل واحد بمدخلاته المكتوبة تحت. تجريبي ومش وعد.' : 'غير متوفر: السيناريوهين مخفيين لأنهم مش موثوقين.'}{hiddenN && vis.length === 0 ? ' ' + String((ts.find((t: any) => t.status_reason) || {}).status_reason || '') : ''}</p>
    {d.targets_rule_ar ? <p className="nt">{d.targets_rule_ar}</p> : null}
    {bt ? <p className="nt">{bt}</p> : null}
    <Fold t="السيناريوهين والمصادر">
      {ts.map((t: any) => <div className="mm" key={t.key}>
        <h5>سيناريو {t.key === 'T1' ? '1' : t.key === 'T3' ? '2' : String(t.key).slice(1)}: {num(t.value) ? <bdi dir="ltr">{fx(t.value)}</bdi> : 'غير موثوق'} <span className="tg">{t.status || t.label}</span></h5>
        <div>{t.name_ar}</div>
        {num(t.value) && t.scenario_ar ? <div className="na">{t.scenario_ar}</div> : null}
        {num(t.value) && t.formula_ar ? <div className="ours"><b>الحساب:</b> <bdi dir="ltr">{t.formula_ar}</bdi></div> : null}
        {num(t.value) && t.growth_note_ar ? <div className="na">{t.growth_note_ar}</div> : null}
        {!num(t.value) && t.status_reason ? <div className="na"><b>{t.status_reason}</b></div> : null}
        <div className="src"><b>من المصدر:</b> {t.part_from_source}<br />{t.source_reference}<br />{t.source_status ? <><small>{t.source_status}</small><br /></> : null}{(t.source_links || []).map((u: string) => <A key={u} u={u} />)}</div>
        <div className="ours"><b>من عندنا:</b> {t.part_ours}</div>
        <div className="na">{t.basis_status}</div>
        {num(t.value) && t.t2_note ? <div className="na">{t.t2_note}</div> : null}
        {num(t.value) && t.backtest_line && t.backtest_line !== bt ? <div className="na">{t.backtest_line}</div> : null}</div>)}
      {an.avg != null
        ? <div className="an"><b>{an.label}</b>: متوسط <bdi dir="ltr">{fx(an.avg)}</bdi> (من <bdi dir="ltr">{fx(an.low)}</bdi> إلى <bdi dir="ltr">{fx(an.high)}</bdi>) · {an.n} محللين<br /><small>{an.note}</small>{an.stale ? <><br /><small><b>قديم:</b> مرجع بس، ومش قيمتنا.</small></> : null}{s.analyst_stale_note && !String(an.note || '').includes(s.analyst_stale_note) ? <><br /><small>{s.analyst_stale_note}</small></> : null}<br /><small>{STALE_AN}</small><br /><A u={an.source} /></div>
        : <div className="an"><b>مستهدف المحللين، مش قيمتنا:</b> {an.status || 'غير متوفر'}. {an.reason}</div>}
    </Fold>
    {d.peer_dates_note_ar ? <p className="nt">{d.peer_dates_note_ar}</p> : null}
    {d.t2_removed_note_ar ? <p className="nt">{d.t2_removed_note_ar}</p> : null}
    <p className="nt">{d.curriculum_note_ar}</p>
    <p className="nt">{d.note_ar}</p>
  </div>;
}

// Financial-tab valuation block for the six holdings. Data-only: studies_rest/studies_rest/financial_tab_wording_six.json is written by the content agent.
let cacheF: Promise<any> | null = null;
const loadF = () => cacheF || (cacheF = fetch('studies_rest/studies_rest/financial_tab_wording_six.json?t=' + Math.floor(Date.now() / 300000), { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).then(noCodes).catch(() => null));
const rename = (t: string) => String(t || '').replace(/القيمة العادلة/g, 'السعر العادل');
export function FinVal6({ k, bony }: { k: string; bony?: boolean }) {
  const [d, setD] = useState<any>(undefined);
  useEffect(() => { let on = true; loadF().then(x => on && setD(x)); return () => { on = false; }; }, []);
  if (d === undefined) return null;
  const s = d && d.stocks && d.stocks[k];
  if (!s) return <div className={bony ? 'bf-value' : 'fin-value'}><span>السعر العادل</span><b>غير متوفر</b><small>مقدرتش أحمّل النص دلوقتي.</small></div>;
  const an = s.analyst_reference || {};
  const seenBt = new Set<string>(); const once = (x: any) => { const v = String(x || '').trim(); if (!v || seenBt.has(v)) return null; seenBt.add(v); return <div className="na">{v}</div>; };
  return <>
    <div className={bony ? 'bf-value' : 'fin-value'}><span>{rename(s.block_title || s.title)}</span><b>{/مفيش نطاق/.test(String(s.summary || '')) ? 'غير متوفر' : 'تقديري'}</b><small>{rename(s.summary)} {rename(s.small)}</small>{s.profit_change_line ? <small>{s.profit_change_line}</small> : null}</div>
    <div className="fv6"><style>{CSS}</style>
      <Fold t="طرق السعر العادل ومصادرها">
        {(s.methods || []).map((m: any, i: number) => <div className="mm" key={i}>
          <h5>{m.label_ar} <span className="tg">{m.status || 'تقديري'}</span></h5>
          <Vals c={(m.values || {}).conservative} b={(m.values || {}).base} o={(m.values || {}).optimistic} />
          {m.status_reason ? <div className="na"><b>{reasonLine(m.status, m.status_reason)}</b></div> : null}
          {isPeer({ name_ar: m.label_ar }) && !m.peers && (num((m.values || {}).conservative) || num((m.values || {}).optimistic)) ? <div className="na">{PEERS}</div> : null}
          {Array.isArray(m.peers) && m.peers.length ? <div className="na">الأقران ومضاعف كل واحد وتاريخ سعره:<ul style={{ margin: '2px 0', paddingInlineStart: 18 }}>{m.peers.map((p: any) => <li key={p.code}>{p.name_ar} ({p.code}): <bdi dir="ltr">{p.value}</bdi> · سعر {p.price_as_of}</li>)}</ul></div> : null}
          {m.peers_note ? <div className="na">{m.peers_note}</div> : null}{m.implied_pb ? <div className="na">المضاعف المفترض: <bdi dir="ltr">{m.implied_pb}</bdi></div> : null}
          <div>الحساب: {m.how}</div>
          <div className="src">المرجع: {m.curriculum_basis}<br /><A u={m.source} /></div>
          <Caveat m={m} /></div>)}
        <div className="na">{s.special}</div>
        {s.treasury_note ? <div className="na">{s.treasury_note}</div> : null}
        {(s.unavailable || []).map((u: any, i: number) => <div className="na" key={i}>{typeof u === 'string' ? u : (u.method_name || '') + ': ' + (u.reason || '')}</div>)}
        <div className="na">{rename(s.method_explainer)}</div>
        <div className="na">{s.assumptions}</div>
      </Fold>
      <Fold t="الأهداف التجريبية وتفاصيلها">
        {s.targets_rule_ar ? <div className="na">{s.targets_rule_ar}</div> : null}
        {(s.targets_experimental || []).map((t: any, i: number) => <div className="mm" key={i}>
          <h5>{t.label_ar}: {num(t.value) ? <bdi dir="ltr">{fx(t.value)}</bdi> : 'غير موثوق'} <span className="tg">{t.status || 'تجريبي'}</span></h5>
          {!num(t.value) && t.status_reason ? <div className="na"><b>{t.status_reason}</b></div> : null}
          <div className="src"><b>من المصدر:</b> {t.from_source}<br />{t.source_reference}<br />{t.source_status ? <><small>{t.source_status}</small><br /></> : null}<A u={t.source} /></div>
          {num(t.value) && t.scenario_ar ? <div className="na">{t.scenario_ar}</div> : null}
          {num(t.value) && t.formula_ar ? <div className="ours"><b>الحساب:</b> <bdi dir="ltr">{t.formula_ar}</bdi></div> : null}
          {num(t.value) && t.growth_note_ar ? <div className="na">{t.growth_note_ar}</div> : null}
          <div className="ours"><b>من عندنا:</b> {t.ours}</div>
          <div className="na">{t.note}</div>
          {num(t.value) && t.t2_note ? <div className="na">{t.t2_note}</div> : null}
          {num(t.value) ? once(t.backtest_line) : null}</div>)}
        {an.avg != null
          ? <div className="an"><b>{an.label}</b>: متوسط <bdi dir="ltr">{fx(an.avg)}</bdi> (من <bdi dir="ltr">{fx(an.low)}</bdi> إلى <bdi dir="ltr">{fx(an.high)}</bdi>) · {an.n} محللين<br /><small>{an.note}</small>{an.stale ? <><br /><small><b>قديم:</b> مرجع بس، ومش قيمتنا.</small></> : null}{s.analyst_stale_note && !String(an.note || '').includes(s.analyst_stale_note) ? <><br /><small>{s.analyst_stale_note}</small></> : null}<br /><small>{STALE_AN}</small><br /><A u={an.source} /></div>
          : <div className="an"><b>مستهدف المحللين، مش قيمتنا:</b> {an.status || 'غير متوفر'}. {an.reason}</div>}
        {once(s.backtest_line)}
        {once(s.backtest_note)}
        <div className="na">المصادر: {(s.sources || []).map((u: string) => <A key={u} u={u} />)}</div>
      </Fold>
    </div>
  </>;
}
