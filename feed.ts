import { useEffect, useState } from 'react';
// Direct browser read of Starta Markets' public delayed feed (CORS open, allowed by its robots.txt).
// Used so prices refresh while the app is open, without depending on a scheduled GitHub job.
export type StartaRow = { price: number; prev: number; chg: number; vol: number; at: string; stale: boolean };
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

export async function loadStarta(): Promise<StartaFeed> {
  if (busy) return feed;
  busy = true;
  try {
    const r = await fetch(URL_STOCKS + '?t=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) throw 0;
    const j = await r.json();
    if (!Array.isArray(j)) throw 0;
    const rows: Record<string, StartaRow> = {};
    let at = '';
    for (const x of j) {
      if (!x || !x.symbol || !(x.last_price > 0) || !(x.prev_close > 0) || !x.as_of) continue;
      rows[x.symbol] = { price: x.last_price, prev: x.prev_close, chg: Number.isFinite(x.change_percent) ? x.change_percent : 100 * (x.last_price / x.prev_close - 1), vol: Number.isFinite(x.volume) ? x.volume : 0, at: x.as_of, stale: !!x.is_stale };
      if (!x.is_stale && x.as_of > at) at = x.as_of;
    }
    if (Object.keys(rows).length > 20 && at) { feed = { at, rows }; subs.forEach(f => f(feed)); }
  } catch { /* keep the last good data */ }
  busy = false;
  return feed;
}

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
