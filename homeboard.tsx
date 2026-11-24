import React, { useEffect, useRef, useState } from 'react';
import { Link } from './shim';
import { DATA } from './data';

const fmt = (v: number) => (v >= 10 ? v.toFixed(2) : v.toFixed(3));
const sgn = (v: number, d = 2) => (v > 0 ? '+' : v < 0 ? '-' : '') + Math.abs(v).toFixed(d);
const money = (v: number) => Math.round(v).toLocaleString('en-US');

const PRICES_URL = 'https://raw.githubusercontent.com/egx-watch-ysawah/egx-app/main/prices.json';
type Live = { at: string; stocks: Record<string, { close: number; prev: number }> } | null;

export function useLive(): Live {
  const [live, setLive] = useState<Live>(null);
  useEffect(() => {
    let dead = false;
    const go = async () => {
      try {
        const r = await fetch(PRICES_URL + '?t=' + Date.now(), { cache: 'no-store' });
        if (!r.ok) throw 0;
        const j = await r.json();
        const out: Record<string, { close: number; prev: number }> = {};
        for (const k of Object.keys(j.stocks || {})) {
          const x = j.stocks[k];
          if (x && Number.isFinite(x.close) && x.close > 0 && Number.isFinite(x.prev_close) && x.prev_close > 0) out[k] = { close: x.close, prev: x.prev_close };
        }
        if (!dead && Object.keys(out).length) setLive({ at: j.fetched_at_utc || '', stocks: out });
      } catch { /* keep the daily data */ }
    };
    go();
    const id = setInterval(go, 60000);
    return () => { dead = true; clearInterval(id); };
  }, []);
  return live;
}

function inSession(): boolean {
  const p: any = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'Africa/Cairo', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).map(x => [x.type, x.value]));
  const m = +p.hour * 60 + +p.minute;
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'].includes(p.weekday) && m >= 600 && m <= 875;
}
function freshState(at?: string): string {
  if (!inSession()) return 'closed';
  const t = at ? Date.parse(at) : NaN;
  if (!Number.isFinite(t)) return 'stale';
  const age = (Date.now() - t) / 60000;
  return age <= 20 ? 'fresh' : age <= 45 ? 'aging' : 'stale';
}
function FlashVal({ v, children }: { v: number; children: React.ReactNode }) {
  const prev = useRef(v);
  const [c, setC] = useState('');
  useEffect(() => {
    if (prev.current === v) return;
    setC(v > prev.current ? 'fl-up' : 'fl-down');
    prev.current = v;
    const t = setTimeout(() => setC(''), 900);
    return () => clearTimeout(t);
  }, [v]);
  return <span className={'hb-val ' + c}>{children}</span>;
}

function prevClose(s: any): number | null {
  const b = s && s.bars;
  if (!Array.isArray(b) || b.length < 2) return null;
  const a = b[b.length - 2][4], z = b[b.length - 1][4];
  if (!Number.isFinite(a) || a <= 0 || !Number.isFinite(z) || Math.abs(z - s.close) > 1e-9) return null;
  return a;
}

function stamp(at?: string): string {
  const g = at || (DATA as any).generated_at;
  const d = g ? new Date(g) : null;
  if (!d || isNaN(+d)) return (DATA as any).asof || '';
  const o: any = { timeZone: 'Africa/Cairo' };
  const day = d.toLocaleDateString('en-GB', { ...o, day: '2-digit', month: '2-digit' });
  const t = d.toLocaleTimeString('en-GB', { ...o, hour: '2-digit', minute: '2-digit' });
  return day + ' ' + t;
}

export function HomeBoard({ holdings }: { holdings: any[] }) {
  const live = useLive();
  const [, tick] = useState(0);
  useEffect(() => { const id = setInterval(() => tick(x => x + 1), 30000); return () => clearInterval(id); }, []);
  const fresh = freshState(live ? live.at : undefined);
  const rows = [...holdings].sort((a, b) => b.weight - a.weight).map(h => {
    const base = DATA.stocks[h.symbol];
    const L = live && live.stocks[h.symbol];
    const s = L ? { ...base, close: L.close } : base;
    const p = L ? L.prev : prevClose(base);
    const d = p ? s.close - p : null;
    const dp = p ? 100 * (s.close / p - 1) : null;
    return { h, s, d, dp };
  });
  const useQty = rows.length > 0 && rows.every(r => Number.isFinite(r.h.quantity) && r.h.quantity > 0 && r.d !== null);
  const wSum = rows.reduce((a, r) => a + (r.dp !== null ? r.h.weight : 0), 0);
  const wDay = wSum > 0 ? rows.reduce((a, r) => a + (r.dp !== null ? r.h.weight * r.dp : 0), 0) / wSum : null;
  const total = useQty ? rows.reduce((a, r) => a + r.h.quantity * r.s.close, 0) : null;
  const dayAmt = useQty ? rows.reduce((a, r) => a + r.h.quantity * (r.d as number), 0) : null;
  const dayPct = useQty && total !== null && dayAmt !== null && total - dayAmt > 0 ? 100 * dayAmt / (total - dayAmt) : wDay;
  const hasCost = useQty && rows.every(r => Number.isFinite(r.h.averageCost) && r.h.averageCost > 0);
  const cost = hasCost ? rows.reduce((a, r) => a + r.h.quantity * r.h.averageCost, 0) : null;
  const costAmt = cost !== null && total !== null ? total - cost : null;
  const costPct = cost !== null && cost > 0 && costAmt !== null ? 100 * costAmt / cost : null;
  const up = rows.filter(r => r.dp !== null && r.dp > 0).length;
  const down = rows.filter(r => r.dp !== null && r.dp < 0).length;
  const worst = rows.filter(r => r.dp !== null).sort((a, b) => (a.dp as number) - (b.dp as number))[0];
  const best = rows.filter(r => r.dp !== null).sort((a, b) => (b.dp as number) - (a.dp as number))[0];
  const cls = (v: number | null) => (v === null ? '' : v >= 0 ? 'hb-up' : 'hb-down');
  return (
    <section className="hb" data-fresh={fresh} aria-label="متابعة المحفظة">
      <div className="hb-top">
        <small>{useQty ? 'إجمالي المحفظة (ج.م)' : 'حركة المحفظة اليوم'}</small>
        {useQty && total !== null && <b className="hb-total" dir="ltr">{money(total)}</b>}
        {dayPct !== null && (
          <div className={'hb-day ' + cls(dayPct)} dir="ltr">
            {dayAmt !== null && <span>{sgn(dayAmt, 0)}</span>}
            <span>{dayPct >= 0 ? '▲' : '▼'} {sgn(dayPct)}%</span>
          </div>
        )}
        {costAmt !== null && costPct !== null && (
          <div className={'hb-cost ' + cls(costAmt)} dir="ltr">
            <small>عن التكلفة</small>
            <span>{sgn(costAmt, 0)}</span>
            <span>{costAmt >= 0 ? '▲' : '▼'} {sgn(costPct)}%</span>
          </div>
        )}
        {!useQty && <small className="hb-note">نسبة تقريبية بأوزان لقطة 24 نوفمبر. أضف الكميات في الملف المشفر عشان تظهر القيمة بالجنيه.</small>}
        <small className="hb-stamp"><i className="fd" role="img" aria-label={fresh} title={fresh} />{live ? 'آخر تحديث ' + stamp(live.at) + ' · متأخر حتى 20 دقيقة، مش لحظي' : 'آخر تحديث ' + stamp() + ' · إقفال يومي، مش أسعار لحظية'}</small>
      </div>
      <div className="hb-tiles">
        <div><small>صاعد اليوم</small><b className="hb-up" data-dir="up">{up}</b></div>
        <div><small>هابط اليوم</small><b className="hb-down" data-dir="down">{down}</b></div>
        <div><small>الأقوى</small><b dir="ltr">{best ? best.h.symbol : '-'}</b>{best && <em className="hb-up" dir="ltr">{sgn(best.dp as number)}%</em>}</div>
        <div><small>الأضعف</small><b dir="ltr">{worst ? worst.h.symbol : '-'}</b>{worst && <em className="hb-down" dir="ltr">{sgn(worst.dp as number)}%</em>}</div>
      </div>
      <p className="hb-lbl">النسبة = تغيّر اليوم عن إقفال أمس</p>
      <div className="hb-list">
        {rows.map(({ h, s, d, dp }) => (
          <Link key={h.symbol} to={'/' + h.symbol.toLowerCase()} className="hb-row" data-dir={dp === null ? undefined : dp >= 0 ? 'up' : 'down'}>
            <i className={'hb-ico ' + cls(dp)} dir="ltr">{h.symbol.slice(0, 2)}</i>
            <span className="hb-name"><b dir="ltr">{h.symbol}</b><small>{s.name} · وزن {h.weight.toFixed(1)}%</small></span>
            <FlashVal v={s.close}>
              <b dir="ltr">{useQty ? money(h.quantity * s.close) : fmt(s.close)}</b>
              {dp !== null && d !== null
                ? <em className={cls(dp)} dir="ltr">{useQty ? sgn(h.quantity * d, 0) + ' ' : sgn(d, d >= 10 || d <= -10 ? 2 : 3) + ' '}{dp >= 0 ? '▲' : '▼'} {Math.abs(dp).toFixed(2)}%</em>
                : <em dir="ltr">-</em>}
            </FlashVal>
          </Link>
        ))}
      </div>
    </section>
  );
}
