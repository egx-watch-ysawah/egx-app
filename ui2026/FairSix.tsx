import React from 'react';
import { Link } from 'react-router-dom';
import { DATA } from '../data';
import { FlowSignal } from './FlowSignal';
import { Peers } from './Peers';
// Six-stock page: flow signal + peer comparison. The old fair-value cards are cancelled for these stocks.
export const FAIR6: string[] = ['MASR', 'ORHD', 'HRHO', 'PHAR', 'BONY', 'UNIP', 'COMI', 'ETEL', 'TMGH', 'SWDY', 'EAST'];
const M = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const arD = (iso: string) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); return m ? Number(m[3]) + ' ' + M[Number(m[2]) - 1] + ' ' + m[1] : ''; };
const lj = (u: string) => fetch(u + '?t=' + Date.now(), { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).catch(() => null);
// Price and its session date come only from the pipeline files: flow_signal.json (close + date), else peer_compare.json (price + price_session).
function useHeads() {
  const [h, setH] = React.useState<Record<string, { px: number; dt: string }> | undefined>(undefined);
  React.useEffect(() => { Promise.all([lj('flow_signal.json'), lj('peer_compare.json')]).then(([f, p]) => {
    const o: Record<string, { px: number; dt: string }> = {};
    for (const k of FAIR6) {
      const a = f && f.stocks && f.stocks[k], b = p && p.stocks && p.stocks[k];
      if (a && typeof a.close === 'number' && typeof a.date === 'string') o[k] = { px: a.close, dt: a.date };
      else if (b && typeof b.price === 'number' && typeof b.price_session === 'string') o[k] = { px: b.price, dt: b.price_session };
      else if (b && typeof b.price === 'number' && p && typeof p.price_session === 'string') o[k] = { px: b.price, dt: p.price_session };
    }
    setH(o); }); }, []);
  return h;
}
// Company names: DATA.stocks holds the original six; the others come from idx/index.json rows (the repo's own list names).
let NP: Promise<Record<string, string>> | null = null;
const loadNames = () => NP || (NP = lj('idx/index.json').then((j: any) => { const o: Record<string, string> = {}; if (j && Array.isArray(j.rows)) for (const r of j.rows) if (r && typeof r.code === 'string' && typeof r.name === 'string') o[r.code] = r.name; return o; }));
function useNames() { const [n, setN] = React.useState<Record<string, string>>({}); React.useEffect(() => { let on = true; loadNames().then(x => on && setN(x)); return () => { on = false; }; }, []); return n; }
const Head = ({ k, h }: { k: string; h: any }) => { const nm = useNames(); const dn = (DATA as any).stocks && (DATA as any).stocks[k] ? (DATA as any).stocks[k].name : ''; return <section className="fs-c" aria-label={k}><header><b>{k}</b><span>{dn || nm[k] || ''}</span></header>
  <p className="fs-dt">{h ? <>سعر الإقفال: <bdi dir="ltr">{h.px.toFixed(h.px < 1 ? 3 : 2)}</bdi> جنيه، جلسة {arD(h.dt)}</> : 'سعر الإقفال: غير متوفر (ملف الأسعار مش متاح دلوقتي)'}</p></section>; };
// Inside the stock page's السعر العادل tab: no duplicate panel, only the way to the new page.
export function FairCard({ code }: { code: string }) {
  if (!FAIR6.includes(code)) return null;
  return <Link to="/fair" className="fs-link"><span><b>تحليل الأسهم دي</b><small>علامة التجميع ومقارنة بالشركات اللي زيها، للأسهم دي في صفحة واحدة.</small></span><em aria-hidden="true">‹</em></Link>;
}
// Mounted inside the stock page's الفني tab (guide.tsx) for the six: flow signal + peer comparison, each with its own plain unavailable state.
export function FairInline({ code }: { code: string }) {
  if (!FAIR6.includes(code)) return null;
  return <div className="sm fs-in"><FlowSignal k={code} /><Peers code={code} /></div>;
}
export function FairSix() {
  const h = useHeads();
  return <div className="eg-pad fs"><h1 className="fs-h">تحليل الأسهم دي: علامة التجميع والمقارنة</h1><span className="fs-tag">تجريبي</span>
    {h === undefined ? null : FAIR6.map(k => <React.Fragment key={k}><Head k={k} h={h[k]} /><FlowSignal k={k} /><Peers code={k} /></React.Fragment>)}
  </div>;
}
export function FairLink() {
  return <Link to="/fair" className="fs-link"><span><b>تحليل الأسهم دي</b><small>علامة التجميع ومقارنة بالشركات اللي زيها. مش نصيحة.</small></span><em aria-hidden="true">‹</em></Link>;
}
