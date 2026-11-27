import { useEffect, useState } from 'react';
// Same engine as egx.py + mkindex.py (RSI, MACD, SMA50/200, ATR, votes, scenario levels), run in the browser on Starta daily history
// for stocks that have no prebuilt idx/<CODE>.json. Nothing here is a new rule.
const r = (x: number, n: number) => { const p = Math.pow(10, n); return Math.round((x + Number.EPSILON * Math.sign(x)) * p) / p; };
function ewm(x: number[], alpha: number): number[] {
  const o: number[] = new Array(x.length).fill(NaN); let prev = NaN;
  for (let i = 0; i < x.length; i++) { if (!Number.isFinite(x[i])) continue; prev = Number.isFinite(prev) ? alpha * x[i] + (1 - alpha) * prev : x[i]; o[i] = prev; }
  return o;
}
const roll = (x: number[], n: number, f: (a: number[]) => number) => x.map((_, i) => i + 1 < n ? NaN : f(x.slice(i + 1 - n, i + 1)));
const sh = (x: number[], k = 1) => x.map((_, i) => i - k >= 0 ? x[i - k] : NaN);
const mean = (a: number[]) => a.reduce((p, c) => p + c, 0) / a.length;
const med = (a: number[]) => { const s = a.slice().sort((p, q) => p - q); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

export type Built = { s: any } | { fail: string };
export function buildStock(code: string, name: string, raw: any[]): Built {
  const now = new Date(); const p: any = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now).map(x => [x.type, x.value]));
  const today = p.year + '-' + p.month + '-' + p.day; const done = +p.hour >= 15;
  let rows = raw.filter(x => x && x.date && (x.date < today || (done && x.date === today)))
    .map(x => [x.date, +x.open, +x.high, +x.low, +x.close, +x.volume] as [string, number, number, number, number, number])
    .filter(([, o, h, l, c, v]) => l > 0 && l <= Math.min(o, c) && Math.max(o, c) <= h && v >= 0);
  rows.sort((a, b) => a[0] < b[0] ? -1 : 1);
  const y = new Date(today); y.setFullYear(y.getFullYear() - 3); const lim = y.toISOString().slice(0, 10);
  rows = rows.filter(x => x[0] >= lim && x[5] > 0 && Number.isFinite(x[4]));
  if (rows.length < 60) return { fail: 'تاريخ السهم قصير جدًا (' + rows.length + ' جلسة).' };
  const short = rows.length < 260;
  const O = rows.map(x => x[1]), H = rows.map(x => x[2]), Lw = rows.map(x => x[3]), C = rows.map(x => x[4]), V = rows.map(x => x[5]);
  let jumps = 0; for (let i = 1; i < C.length; i++) if (Math.abs(C[i] / C[i - 1] - 1) > 0.25) jumps++;
  const jump = jumps > 0; // jump: technical sections only show a note, study tabs still render
  const n = C.length, i1 = n - 1;
  const d = C.map((c, i) => i ? c - C[i - 1] : NaN);
  const up = ewm(d.map(v => Number.isFinite(v) ? Math.max(v, 0) : NaN), 1 / 14), dn = ewm(d.map(v => Number.isFinite(v) ? Math.max(-v, 0) : NaN), 1 / 14);
  const rsi = up.map((u, i) => 100 - 100 / (1 + u / dn[i]));
  const e12 = ewm(C, 2 / 13), e26 = ewm(C, 2 / 27); const macd = e12.map((v, i) => v - e26[i]); const sig = ewm(macd, 2 / 10);
  const s50 = roll(C, 50, mean), s200 = roll(C, 200, mean);
  const hi20 = roll(sh(C), 20, a => Math.max(...a)), vavg = roll(sh(V), 20, mean);
  const P = C[i1];
  const pc = sh(C); const tr = C.map((_, i) => i ? Math.max(H[i] - Lw[i], Math.abs(H[i] - pc[i]), Math.abs(Lw[i] - pc[i])) : H[i] - Lw[i]);
  const atr = ewm(tr, 1 / 14)[i1];
  const votes = { trend: +(P > s200[i1]), mid: +(P > s50[i1]), macd: +(macd[i1] > sig[i1]), rsi: +(40 <= rsi[i1] && rsi[i1] <= 70), vol: +(V[i1] > vavg[i1] && P > C[i1 - 1]) };
  const chg = (k: number) => r((C[i1] / C[i1 - k] - 1) * 100, 1);
  const res = Math.max(...H.slice(-20)), sup = Math.min(...Lw.slice(-20));
  const ema20 = ewm(C, 2 / 21)[i1];
  const at = (a: number[], k: number) => a[n - 1 - k];
  const RULES: Record<string, boolean> = {
    'RSI<30 (oversold bounce)': rsi[i1] < 30 && at(rsi, 1) >= 30,
    'MACD cross up': macd[i1] > sig[i1] && at(macd, 1) <= at(sig, 1) && P > s200[i1],
    '20d breakout + volume x1.5': P > hi20[i1] && V[i1] > 1.5 * vavg[i1],
    'SMA50 cross above SMA200': s50[i1] > s200[i1] && at(s50, 1) <= at(s200, 1),
  };
  const fire = Object.keys(RULES).filter(k => RULES[k]);
  const w: Record<string, number> = { trend: 25, mid: 20, macd: 20, rsi: 15, vol: 10 };
  const strength = Math.trunc(Object.keys(votes).reduce((a, k) => a + w[k] * (votes as any)[k], 0) + (fire.length ? 10 : 0));
  let mode: string, entry: number;
  if (P > ema20 * 1.005) { mode = 'pullback'; entry = ema20; } else { mode = 'breakout'; entry = res; }
  const stop = entry - 2.5 * atr, target = entry + 3 * atr, trail = Math.max(...C.slice(-20)) - 3 * atr;
  const tv = med(C.slice(-60).map((c, i) => c * V[n - 60 + i] ));
  const ext = (P - C[n - 21]) / atr; const sizepct = r(Math.min(25, 1 / Math.abs(stop / entry - 1)), 1);
  const plan = { trail: r(trail, 4), tv: r(tv / 1e6, 1), ext: r(ext, 1), sizepct, mode, entry: r(entry, 4), stop: r(stop, 4), target: r(target, 4), atr: r(atr, 4), atrpct: r(atr / P * 100, 1), entry_pct: r((entry / P - 1) * 100, 1), stop_pct: r((stop / entry - 1) * 100, 1), target_pct: r((target / entry - 1) * 100, 1), res: r(res, 4), sup: r(sup, 4), ema20: r(ema20, 4), strength };
  // ADX / Bollinger fields that App.tsx pages read are not part of idx json; the idx page uses plan + votes only.
  const bars = rows.slice(-420).map(x => [x[0], r(x[1], 4), r(x[2], 4), r(x[3], 4), r(x[4], 4), Math.trunc(x[5])]);
  const s = { name, ok: true, close: r(P, 3), date: rows[i1][0], chg5: chg(5), chg20: chg(20), chg60: chg(60), rsi: r(rsi[i1], 0), votes, volx: r(V[i1] / vavg[i1], 1), plan, fire, bars, hi52: r(Math.max(...C.slice(-250)), 3), lo52: r(Math.min(...C.slice(-250)), 3), historyCount: n, source: 'https://startamarkets.com/symbol/' + code + '/history', sourceName: 'Starta Markets', qualityChecked: true, auto: true, client: true, jump, short };
  return { s };
}

const STOCKS = 'https://startamarkets.com/api/v1/egx/stocks';
const HIST = 'https://startamarkets.com/api/v1/egx/history/';
export type StartaFull = { symbol: string; name_ar: string; name_en: string; sector_name: string; last_price: number; prev_close: number; change_percent: number; volume: number; market_cap: number | null; pe_ratio: number | null; pb_ratio: number | null; high: number; low: number; open_price: number; high_52w: number | null; low_52w: number | null; as_of: string; is_stale: boolean };
export function useClientStock(code: string, enabled: boolean) {
  const [st, setSt] = useState<{ s?: any; fail?: string; row?: StartaFull | null; done: boolean }>({ done: false });
  useEffect(() => {
    if (!enabled) return; let on = true; setSt({ done: false });
    (async () => {
      try {
        const all = await fetch(STOCKS + '?t=' + Date.now(), { cache: 'no-store' }).then(x => x.json());
        const row: StartaFull | null = Array.isArray(all) ? all.find((x: any) => x.symbol === code) || null : null;
        if (!row) { on && setSt({ done: true, fail: 'السهم ده مش موجود عند المصدر دلوقتي.', row: null }); return; }
        const raw = await fetch(HIST + code, { cache: 'no-store' }).then(x => { if (!x.ok) throw 0; return x.json(); });
        const b = buildStock(code, row.name_ar || row.name_en, raw);
        on && setSt('s' in b ? { done: true, s: b.s, row } : { done: true, fail: b.fail, row });
      } catch { on && setSt({ done: true, fail: 'مقدرتش أحمّل التاريخ من المصدر دلوقتي.', row: null }); }
    })();
    return () => { on = false; };
  }, [code, enabled]);
  return st;
}
