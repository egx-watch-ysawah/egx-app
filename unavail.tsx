import React, { useEffect, useMemo, useState } from 'react';
import { Link } from './shim';

// "الدراسة غير متوافرة حاليا": stocks with no study yet. Data-only: a name, a code, a status and a short reason.
// No numbers, no valuation, no opinion. Data: studies_rest/studies_rest/unavailable.json ([{code,name_ar,reason_ar,extra?}]).
// ready_names.json maps the published study codes to names; pages/index.json says which studies are live.
export type UnRow = { code: string; name_ar: string; reason_ar: string; extra?: boolean };
type St = { map: Record<string, UnRow>; rows: UnRow[]; ready: string[]; names: Record<string, string> } | null;
const bust = () => Math.floor(Date.now() / 300000);
const getJ = (u: string): Promise<any> => fetch('studies_rest/studies_rest/' + u + '?t=' + bust(), { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).catch(() => null);
let cache: Promise<St> | null = null;
const load = (): Promise<St> => cache || (cache = Promise.all([getJ('unavailable.json'), getJ('pages/index.json'), getJ('ready_names.json')]).then(([u, ix, nm]) => {
  const rows: UnRow[] = Array.isArray(u) ? u.filter((r: any) => r && r.code && r.reason_ar) : [];
  const map: Record<string, UnRow> = {}; rows.forEach(r => { map[String(r.code).toUpperCase()] = r; });
  const ready: string[] = ix && Array.isArray(ix.ready) ? ix.ready.map((c: any) => String(c).toUpperCase()) : [];
  return { map, rows, ready, names: nm && typeof nm === 'object' ? nm : {} };
}));
export function useUN(): St {
  const [s, setS] = useState<St>(null);
  useEffect(() => { let on = true; load().then(x => { if (on) setS(x); }); return () => { on = false; }; }, []);
  return s;
}
const CSS = '.un-row{align-items:start}.un-note{grid-column:1/-1;margin-top:4px}.un-badge{display:inline-block;padding:2px 10px;border-radius:999px;background:#ffffff14;color:#cbd5e1;font-size:12px;line-height:1.5}.un-ok{background:#5eead41a;color:#5eead4}.un-why{margin:6px 0 0;font-size:13px;line-height:1.5;color:#b6c2d4;overflow-wrap:anywhere}.un-all{min-width:0}.un-all .ix-r{display:block}.un-top{display:flex;align-items:center;justify-content:space-between;gap:8px;min-width:0}.un-top b{font-size:15px;line-height:1.35;min-width:0;overflow-wrap:anywhere}.un-top small{color:#98a8bf;font-size:12px;flex:none}.un-link{display:block;margin:8px 0;padding:11px 12px;border-radius:14px;background:#10203a;border:1px solid #ffffff12;color:inherit;text-decoration:none}.un-link b{display:block;font-size:15px}.un-link small{color:#98a8bf;font-size:12px}';
if (typeof document !== 'undefined' && !document.getElementById('un-css')) { const el = document.createElement('style'); el.id = 'un-css'; el.textContent = CSS; document.head.appendChild(el); }
export const UnNote = ({ r }: { r: UnRow }) => <div className="un-note"><span className="un-badge">غير متوافر حاليا</span><p className="un-why">{r.reason_ar}</p></div>;
const normQ = (s: string) => String(s || '').toLowerCase().replace(/[\u064B-\u0652\u0640]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/\s+/g, ' ').trim();

export function AllStocks() {
  const st = useUN();
  const [q, setQ] = useState('');
  const all = useMemo(() => {
    if (!st) return [];
    const rs = new Set(st.ready);
    const un = st.rows.filter(r => !rs.has(String(r.code).toUpperCase())).map(r => ({ code: String(r.code).toUpperCase(), name: r.name_ar || r.code, un: r }));
    const unc = new Set(un.map(x => x.code));
    const rd = st.ready.filter(c => !unc.has(c)).map(c => ({ code: c, name: st.names[c] || c, un: null as UnRow | null }));
    return [...rd, ...un].sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  }, [st]);
  const nq = normQ(q);
  const rows = useMemo(() => (nq ? all.filter(x => (normQ(x.code) + ' ' + normQ(x.name)).includes(nq)) : all), [all, nq]);
  if (!st) return <div className="eg-pad"><h2 className="eg-h">كل الأسهم</h2><p className="eg-note">بحمّل القايمة...</p></div>;
  return <div className="eg-pad ix un-all">
    <h2 className="eg-h">كل الأسهم <span className="ix-n" id="un-count">{nq ? '· نتايج البحث (' + rows.length + ')' : '(' + all.length + ' سهم)'}</span></h2>
    <p className="eg-note">كل سهم بيفتح على صفحته. اللي مالوش دراسة متوافرة دلوقتي مكتوب جنبه غير متوافر حاليا مع السبب.</p>
    <label className="ix-search"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M15.5 15.5 21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg><input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="ادخل رمز أو اسم الشركة" aria-label="بحث في كل الأسهم" /></label>
    {rows.length === 0 && <p className="eg-note">مفيش سهم بالاسم ده.</p>}
    {rows.map(x => <Link key={x.code} to={'/s/' + x.code} className="ix-r"><div className="un-top"><b>{x.name}</b><small dir="ltr">{x.code}</small></div>{x.un ? <UnNote r={x.un} /> : <span className="un-badge un-ok">دراسة متوافرة</span>}</Link>)}
  </div>;
}
