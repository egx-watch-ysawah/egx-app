import { useEffect, useState } from 'react';
import I70 from './index70.json';
import PR from './prices.json';
// Direct browser read of Starta Markets' public delayed feed (CORS open, allowed by its robots.txt).
// Used so prices refresh while the app is open, without depending on a scheduled GitHub job.
export type StartaRow = { price: number; prev: number; chg: number; vol: number; at: string; stale: boolean; src?: 'starta' | 'tv' };
export type StartaFeed = { at: string; rows: Record<string, StartaRow> } | null;
const URL_STOCKS = 'https://startamarkets.com/api/v1/egx/stocks';
export const URL_INDEX = 'https://startamarkets.com/api/v1/egx30/index';
let feed: StartaFeed = null;
const subs = new Set<(f: StartaFeed) => void>();
let timer: any = null;
let busy = false;

export function inSessionNow(): boolean {
  const p: any = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'Africa/Cairo', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).map(x => [x.type, x.value]));
  const m = +p.hour * 60 + +p.minute;
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'].includes(p.weekday) && m >= 600 && m <= 890;
}

// Wording helper: "today" only while the market is in session, otherwise the last session.
export const tdA = () => (inSessionNow() ? 'النهارده' : 'آخر جلسة');
export const tdW = () => (inSessionNow() ? 'النهارده' : 'في آخر جلسة');
export const tdP = () => (inSessionNow() ? 'سعر النهارده' : 'سعر آخر جلسة');

let lastAt = 0;
let lastTv = 0;
let lastCodes: string[] = [];
const URL_TV = 'https://scanner.tradingview.com/global/scan';
const TV_DELAY_MS = 15 * 60 * 1000; // documented delay of the scanner feed; it gives no per-row timestamp
const DISAGREE = 1.5; // percent
export type SourceState = { starta: 'ok' | 'down' | 'off'; tv: 'ok' | 'down' | 'off' };
export let sourceState: SourceState = { starta: 'off', tv: 'off' };
export let disagree: string[] = [];

async function fetchStarta(): Promise<Record<string, StartaRow> | null> {
  try {
    const r = await fetch(URL_STOCKS + '?t=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) return null;
    const j = await r.json();
    if (!Array.isArray(j)) return null;
    const rows: Record<string, StartaRow> = {};
    for (const x of j) {
      if (!x || !x.symbol || !(x.last_price > 0) || !(x.prev_close > 0) || !x.as_of) continue;
      rows[x.symbol] = { price: x.last_price, prev: x.prev_close, chg: Number.isFinite(x.change_percent) ? x.change_percent : 100 * (x.last_price / x.prev_close - 1), vol: Number.isFinite(x.volume) ? x.volume : 0, at: x.as_of, stale: !!x.is_stale, src: 'starta' };
    }
    return Object.keys(rows).length > 20 ? rows : null;
  } catch { return null; }
}

// Fallback source: TradingView scanner, the /global/scan endpoint only (the one its robots.txt allows).
async function fetchTv(codes: string[]): Promise<Record<string, StartaRow> | null> {
  try {
    const r = await fetch(URL_TV, { method: 'POST', headers: { 'content-type': 'text/plain' }, body: JSON.stringify({ symbols: { tickers: codes.map(c => 'EGX:' + c) }, columns: ['close', 'change', 'volume', 'update_mode'] }) });
    if (!r.ok) return null;
    const j = await r.json();
    if (!j || !Array.isArray(j.data)) return null;
    const at = new Date(Date.now() - TV_DELAY_MS).toISOString();
    const rows: Record<string, StartaRow> = {};
    for (const x of j.data) {
      const code = String(x.s || '').replace('EGX:', ''); const d = x.d || [];
      if (!code || !(d[0] > 0) || !Number.isFinite(d[1]) || d[1] <= -100) continue;
      rows[code] = { price: d[0], prev: d[0] / (1 + d[1] / 100), chg: d[1], vol: Number.isFinite(d[2]) ? d[2] : 0, at, stale: false, src: 'tv' };
    }
    return Object.keys(rows).length ? rows : null;
  } catch { return null; }
}

// Per stock: take the freshest valid row. A stale Starta row never wins. If both are valid and differ by more than 1.5%, keep the fresher one and flag it.
function merge(s: Record<string, StartaRow> | null, tv: Record<string, StartaRow> | null) {
  const rows: Record<string, StartaRow> = {}; const bad: string[] = [];
  const codes = new Set([...Object.keys(s || {}), ...Object.keys(tv || {})]);
  codes.forEach(c => {
    const a = s && s[c], b = tv && tv[c];
    const av = a && !a.stale ? a : null;
    let pick: StartaRow | undefined;
    if (av && b) { pick = av.at >= b.at ? av : b; if (Math.abs(100 * (av.price / b.price - 1)) > DISAGREE) bad.push(c); }
    else pick = av || b || a || undefined;
    if (pick) rows[c] = pick;
  });
  return { rows, bad };
}

export async function loadStarta(force = false): Promise<StartaFeed> {
  if (busy) return feed;
  if (!force && Date.now() - lastAt < 4000) return feed;
  busy = true; lastAt = Date.now();
  try {
    const s = await fetchStarta();
    if (s) lastCodes = Object.keys(s);
    const staleN = s ? Object.values(s).filter(x => x.stale).length : 0;
    // The fallback is asked only when needed: Starta down, rows stale, or every 4 minutes for the cross-check.
    let tv: Record<string, StartaRow> | null = null;
    sourceState = { starta: s ? 'ok' : 'down', tv: 'off' };
    if (!s || staleN > 0 || force || Date.now() - lastTv > 4 * 60 * 1000) {
      lastTv = Date.now();
      const codes = lastCodes.length ? lastCodes : Array.from(new Set([...(I70 as any).codes, ...Object.keys((PR as any).stocks || {})]));
      tv = await fetchTv(codes);
      sourceState.tv = tv ? 'ok' : 'down';
    }
    const m = merge(s, tv);
    disagree = m.bad;
    let at = '';
    // Snapshot time comes from the Starta rows only. The TradingView fallback has no timestamp (now minus 15 min), so it must not set it.
    if (s) for (const c of Object.keys(s)) { const x = s[c]; if (!x.stale && x.at > at) at = x.at; }
    if (!at) for (const c of Object.keys(m.rows)) { const x = m.rows[c]; if (!x.stale && x.at > at) at = x.at; }
    if (Object.keys(m.rows).length > 20 && at) { feed = { at, rows: m.rows }; subs.forEach(f => f(feed)); }
  } catch { /* keep the last good data */ }
  busy = false;
  return feed;
}

export const getFeed = () => feed;

function start() {
  if (timer) return;
  loadStarta();
  timer = setInterval(() => { if (document.visibilityState === 'visible' && inSessionNow()) loadStarta(); }, 60000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') loadStarta(); });
}

export function useStarta(): StartaFeed {
  const [f, setF] = useState<StartaFeed>(feed);
  useEffect(() => { subs.add(setF); start(); setF(feed); return () => { subs.delete(setF); }; }, []);
  return f;
}
