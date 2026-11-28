import React from 'react';
// Status banner + one currency map. Data: stock_status.json (static, data engineer). Nothing is estimated here.
const M = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const arD = (iso: string) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); return m ? Number(m[3]) + ' ' + M[Number(m[2]) - 1] + ' ' + m[1] : ''; };
type SS = { rows: Record<string, any>; cur: Record<string, string>; unconf: Record<string, boolean>; vend: Record<string, boolean>; nc: Record<string, boolean>; fs: Record<string, string>; session: string };
const lj = (u: string) => fetch(u + '?t=' + Date.now(), { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).catch(() => null);
let P: Promise<SS | null> | null = null;
// stock_status.json = banner rows. stock_currency.json = the one currency map (all USD-quoted stocks) plus never-traded temporary listings.
const load = () => P || (P = Promise.all([lj('stock_status.json'), lj('stock_currency.json')]).then(([j, c]: any[]) => {
  const okS = j && Array.isArray(j.stocks), okC = c && Array.isArray(c.stocks);
  if (!okS && !okC) { P = null; return null; }
  const rows: Record<string, any> = {}; const cur: Record<string, string> = {}; const unconf: Record<string, boolean> = {}; const vend: Record<string, boolean> = {}; const nc: Record<string, boolean> = {}; const fs: Record<string, string> = {};
  if (okC) for (const x of c.stocks) if (x && typeof x.code === 'string') {
    if (typeof x.currency === 'string') cur[x.code] = x.currency.toUpperCase();
    if (typeof x.fs_currency === 'string') fs[x.code] = /^USD/i.test(x.fs_currency) ? 'USD' : /^EGP/i.test(x.fs_currency) ? 'EGP' : 'none';
    if (x.unconfirmed === true) unconf[x.code] = true;
    if (typeof x.second_source_status === 'string' && /^NOT/i.test(x.second_source_status)) nc[x.code] = true;
    if (typeof x.second_source_status === 'string' && /vendor only/i.test(x.second_source_status)) vend[x.code] = true;
    if (x.not_trading_yet === true) rows[x.code] = { code: x.code, status: 'not_trading_yet', status_ar: 'مقيد مؤقتًا ولسه ماتداولش', last_traded: null, last_close: null, currency: x.currency };
  }
  if (okS) for (const x of j.stocks) if (x && typeof x.code === 'string' && typeof x.status_ar === 'string') { rows[x.code] = x; if (!okC && typeof x.currency === 'string') cur[x.code] = x.currency.toUpperCase(); }
  return { rows, cur, unconf, vend, nc, fs, session: okS && typeof j.session === 'string' ? j.session : '' };
}).catch(() => { P = null; return null; }));
function useSS(): SS | null | undefined { const [m, setM] = React.useState<SS | null | undefined>(undefined); React.useEffect(() => { let on = true; load().then(x => on && setM(x)); return () => { on = false; }; }, []); return m; }
export function useStatus(k: string): any { const m = useSS(); return m ? m.rows[k] || null : null; }
export function useCurMap(): Record<string, string> | undefined { const m = useSS(); return m === undefined ? undefined : m ? m.cur : {}; }
export function useCur(k: string): { word: string; short: string; usd: boolean; ready: boolean; unconf: boolean; nc: boolean; fs: string } { const m = useSS(); const usd = !!(m && m.cur[k] === 'USD'); const ready = m !== undefined; const unconf = !!(m && m.unconf[k]); const nc = !!(m && m.nc[k]); const fs = (m && m.fs[k]) || 'EGP'; return usd ? { word: 'دولار', short: 'دولار', usd, ready, unconf, nc, fs } : { word: 'جنيه', short: 'ج.م', usd, ready, unconf, nc, fs }; }
export function useNty(): Record<string, boolean> | undefined { const m = useSS(); if (m === undefined) return undefined; const o: Record<string, boolean> = {}; if (m) for (const k of Object.keys(m.rows)) if (m.rows[k].status === 'not_trading_yet') o[k] = true; return o; }
// Egypt trading week: Sun-Thu. Count trading days after `from` up to `to` (holidays not subtracted).
const tdays = (from: string, to: string) => { const a = Date.parse(from + 'T00:00:00Z'), b = Date.parse(to + 'T00:00:00Z'); if (!isFinite(a) || !isFinite(b) || b <= a) return 0; let n = 0; for (let t = a + 864e5; t <= b; t += 864e5) { const w = new Date(t).getUTCDay(); if (w !== 5 && w !== 6) n++; } return n; };
const label = (s: any, session: string): string => {
  if (s.status === 'thin') return s.last_traded && session && tdays(s.last_traded, session) <= 5 ? 'مفيش تداول في آخر جلسة' : 'تداوله واقف';
  return String(s.status_ar);
};
// The gap line shows only when the flag is true AND the page (source) price really differs from the close in the banner.
export function useLabel(k: string): string { const m = useSS(); const s = m && m.rows[k]; return s && m ? label(s, m.session) : ''; }
export const gapOn = (s: any): boolean => !!s && s.price_gap_flag === true && typeof s.tv_reference_price === 'number' && typeof s.last_close === 'number' && s.tv_reference_price !== s.last_close;
export function StatusBanner({ k }: { k: string }) {
  const m = useSS(); const s = m && m.rows[k]; if (!s || !m) return null;
  const lag = s.status === 'feed_lag'; const d = arD(s.last_traded);
  const px = typeof s.last_close === 'number' && isFinite(s.last_close) ? s.last_close : null;
  const usd = (m.cur[k] || 'EGP') === 'USD'; const un = usd ? 'دولار' : 'جنيه';
  const unconf = usd && !!m.unconf[k];
  const sp = typeof s.last_trade_price_starta === 'number' && px != null && s.last_trade_price_starta !== px;
  const dormant = s.status === 'dormant';
  const bd = lag ? '#3a424e' : '#e0a030';
  return <section dir="rtl" role="status" aria-label="حالة السهم" className="ss-b" style={{ boxSizing: 'border-box', width: '100%', margin: '10px 0 14px', padding: '12px 14px', borderRadius: 12, border: '1px solid ' + bd, borderRightWidth: 4, background: '#111822', color: '#e6e9ee', textAlign: 'right', lineHeight: 1.8, fontSize: 14, overflowWrap: 'anywhere' }}>
    <b>{label(s, m.session)}</b>
    {lag ? <>{d ? <> - السعر لحد {d}{px != null ? <> (<bdi dir="ltr">{px}</bdi> {un})</> : null}</> : null}{s.starta_last_bar ? <>، والتحليل لحد {arD(s.starta_last_bar)}</> : null}</> : dormant ? (px != null ? <> - آخر سعر <bdi dir="ltr">{px}</bdi> {un}</> : null)
      : <>{d ? <> - آخر تداول {d}</> : null}{px != null ? <>{sp ? <> · {s.last_close_note ? 'آخر إقفال' : 'إقفال رسمي'} </> : <> بسعر </>}<bdi dir="ltr">{px}</bdi> {un}{unconf ? ' (العملة حسب المصدر)' : ''}</> : null}</>}
    {gapOn(s) ? <div style={{ fontSize: 13, color: '#b4bac4', marginTop: 2 }}>آخر سعر تداول <bdi dir="ltr">{px}</bdi> {un}، وسعر المصدر <bdi dir="ltr">{s.tv_reference_price}</bdi> والفرق بينهم سببه مش معروف عندنا</div> : null}
  </section>;
}
// Inside the combo / signal blocks: no second banner, one short line.
export function BlockNone({ k }: { k: string }) {
  const m = useSS(); const s = m && m.rows[k]; if (!s || !m) return null;
  const why = s.status === 'feed_lag' ? 'لأن بيانات السهم متأخرة عندنا' : s.status === 'not_trading_yet' ? 'لأن السهم لسه ماتداولش' : s.status === 'halted' ? 'لأن السهم ' + label(s, m.session) : 'لأن ' + label(s, m.session);
  return <p className="eg-note ss-n" style={{ margin: '8px 0' }}>مفيش علامة ولا مقارنة تاريخية للسهم ده {why}</p>;
}

// One short line near the price on USD pages + the currency caveat for codes the data file flags as unconfirmed.
export function UsdNote({ k }: { k: string }) {
  const c = useCur(k); const st = useStatus(k); if (!c.usd) return null;
  return <p className="eg-note ss-u" style={{ margin: '6px 0' }}>السعر بالدولار{c.unconf && !st ? ' (العملة حسب المصدر)' : ''}</p>;
}
