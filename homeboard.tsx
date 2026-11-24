import React from 'react';
import { Link } from './shim';
import { DATA } from './data';

const fmt = (v: number) => (v >= 10 ? v.toFixed(2) : v.toFixed(3));
const sgn = (v: number, d = 2) => (v > 0 ? '+' : v < 0 ? '-' : '') + Math.abs(v).toFixed(d);
const money = (v: number) => Math.round(v).toLocaleString('en-US');

function prevClose(s: any): number | null {
  const b = s && s.bars;
  if (!Array.isArray(b) || b.length < 2) return null;
  const a = b[b.length - 2][4], z = b[b.length - 1][4];
  if (!Number.isFinite(a) || a <= 0 || !Number.isFinite(z) || Math.abs(z - s.close) > 1e-9) return null;
  return a;
}

function stamp(): string {
  const g = (DATA as any).generated_at;
  const d = g ? new Date(g) : null;
  if (!d || isNaN(+d)) return (DATA as any).asof || '';
  const o: any = { timeZone: 'Africa/Cairo' };
  const day = d.toLocaleDateString('en-GB', { ...o, day: '2-digit', month: '2-digit' });
  const t = d.toLocaleTimeString('en-GB', { ...o, hour: '2-digit', minute: '2-digit' });
  return day + ' ' + t;
}

export function HomeBoard({ holdings }: { holdings: any[] }) {
  const rows = [...holdings].sort((a, b) => b.weight - a.weight).map(h => {
    const s = DATA.stocks[h.symbol];
    const p = prevClose(s);
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
  const up = rows.filter(r => r.dp !== null && r.dp > 0).length;
  const down = rows.filter(r => r.dp !== null && r.dp < 0).length;
  const worst = rows.filter(r => r.dp !== null).sort((a, b) => (a.dp as number) - (b.dp as number))[0];
  const best = rows.filter(r => r.dp !== null).sort((a, b) => (b.dp as number) - (a.dp as number))[0];
  const cls = (v: number | null) => (v === null ? '' : v >= 0 ? 'hb-up' : 'hb-down');
  return (
    <section className="hb" aria-label="متابعة المحفظة">
      <div className="hb-top">
        <small>{useQty ? 'إجمالي المحفظة (ج.م)' : 'حركة المحفظة اليوم'}</small>
        {useQty && total !== null && <b className="hb-total" dir="ltr">{money(total)}</b>}
        {dayPct !== null && (
          <div className={'hb-day ' + cls(dayPct)} dir="ltr">
            {dayAmt !== null && <span>{sgn(dayAmt, 0)}</span>}
            <span>{dayPct >= 0 ? '▲' : '▼'} {sgn(dayPct)}%</span>
          </div>
        )}
        {!useQty && <small className="hb-note">نسبة تقريبية بأوزان لقطة 24 نوفمبر. أضف الكميات في الملف المشفر عشان تظهر القيمة بالجنيه.</small>}
        <small className="hb-stamp">آخر تحديث {stamp()} · إقفال يومي، مش أسعار لحظية</small>
      </div>
      <div className="hb-tiles">
        <div><small>صاعد</small><b className="hb-up">{up}</b></div>
        <div><small>هابط</small><b className="hb-down">{down}</b></div>
        <div><small>الأقوى</small><b dir="ltr">{best ? best.h.symbol : '-'}</b>{best && <em className="hb-up" dir="ltr">{sgn(best.dp as number)}%</em>}</div>
        <div><small>الأضعف</small><b dir="ltr">{worst ? worst.h.symbol : '-'}</b>{worst && <em className="hb-down" dir="ltr">{sgn(worst.dp as number)}%</em>}</div>
      </div>
      <div className="hb-list">
        {rows.map(({ h, s, d, dp }) => (
          <Link key={h.symbol} to={'/' + h.symbol.toLowerCase()} className="hb-row">
            <i className={'hb-ico ' + cls(dp)} dir="ltr">{h.symbol.slice(0, 2)}</i>
            <span className="hb-name"><b dir="ltr">{h.symbol}</b><small>{s.name} · وزن {h.weight.toFixed(1)}%</small></span>
            <span className="hb-val">
              <b dir="ltr">{useQty ? money(h.quantity * s.close) : fmt(s.close)}</b>
              {dp !== null && d !== null
                ? <em className={cls(dp)} dir="ltr">{useQty ? sgn(h.quantity * d, 0) + ' ' : sgn(d, d >= 10 || d <= -10 ? 2 : 3) + ' '}{dp >= 0 ? '▲' : '▼'} {Math.abs(dp).toFixed(2)}%</em>
                : <em dir="ltr">-</em>}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
