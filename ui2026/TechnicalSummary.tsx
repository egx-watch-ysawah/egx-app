import React from 'react';
import { rows as mkRows } from '../indic';
import './lists.css';
import { xTechS } from './ExplainLists';
// Technical tab, text parts as numbers: trend badge, price vs 50/200-day averages, support/resistance lines over the last 60 closes.
// Support = lowest low of the last 20 sessions (plan.sup), resistance = highest high of the last 20 (plan.res), as in the old text. The chart itself is not touched.
const UP = '#25b896', DN = '#de575b', GR = '#8b95a5';
const ok = (v: any): v is number => typeof v === 'number' && Number.isFinite(v);
const f = (v: number) => (v >= 1 ? v.toFixed(2) : v.toFixed(3));
function AvgBar({ name, avg, price }: { name: string; avg: number | null; price: number }) {
  if (!ok(avg)) return <div className="ts-a"><span>{name}</span><em className="ls-b gr ts-na">غير متوفر: تاريخ أقل من المدة</em></div>;
  const d = (price / avg - 1) * 100, c = d >= 0 ? UP : DN, pos = 50 + Math.max(-20, Math.min(20, d)) * 2.5;
  return <div className="ts-a"><span>{name}</span><bdi className="ts-n" dir="ltr">{f(avg)}</bdi>
    <b className="ts-n" style={{ color: c }} dir="ltr">{d >= 0 ? '+' : '−'}{Math.abs(d).toFixed(1)}%</b>
    <div className="ts-bar" dir="ltr"><i /><u style={{ left: pos + '%', background: c }} /></div><small>{d >= 0 ? 'السعر فوق المتوسط' : 'السعر تحت المتوسط'}</small></div>;
}
export function TechnicalSummary({ s }: { s: any }) {
  if (!s) return null;
  if (s.nohist || !Array.isArray(s.bars) || s.bars.length < 2) return <section className="ts" aria-label="القراءة الفنية بالأرقام"><em className="ls-b gr">غير متوفر</em><p className="ts-f">السبب: مفيش تاريخ أسعار حديث عند المصدر، فمتوسطات 50 و200 والدعم والمقاومة مش متحسبة. مفيش رقم بديل.</p></section>;
  const r = mkRows(s.bars), last = r[r.length - 1], s50 = last[6], s200 = last[7], price = s.close as number;
  const v = s.votes || {};
  const t = v.trend && v.mid ? ['فوق المتوسطين', 'up'] : !v.trend && !v.mid ? ['تحت المتوسطين', 'dn'] : ['اتجاه مختلط', 'gr'];
  const c = s.bars.slice(-60).map((b: any) => b[4]) as number[];
  const sup = s.plan && ok(s.plan.sup) ? s.plan.sup : null, res = s.plan && ok(s.plan.res) ? s.plan.res : null;
  const lv = [...c, ...(sup ? [sup] : []), ...(res ? [res] : [])], mn = Math.min(...lv), mx = Math.max(...lv), rg = mx - mn || 1, W = 330, H = 110, p = 6;
  const X = (i: number) => p + (i * (W - 2 * p - 40)) / (c.length - 1), Y = (y: number) => H - p - ((y - mn) / rg) * (H - 2 * p);
  const line = (y: number | null, lab: string, col: string) => y == null ? null : <g key={lab}><line x1={p} x2={W - 40} y1={Y(y)} y2={Y(y)} stroke={col} strokeWidth={1} strokeDasharray="4 3" /><text x={W - 38} y={Y(y) + 3} fontSize={10} fill={col}>{f(y)}</text></g>;
  return <section className="ts" aria-label="القراءة الفنية بالأرقام">
    <div className="ts-t"><em className={'ls-b ' + t[1]}>{t[0]}</em><small>اتجاه طويل: {v.trend ? 'إيجابي' : 'سلبي'} · متوسط: {v.mid ? 'إيجابي' : 'سلبي'}</small></div>
    <div className="ts-hd" aria-hidden="true"><span>المتوسط</span><span>قيمته</span><span>بُعد السعر</span></div>
    <AvgBar name="متوسط 50 جلسة" avg={s50} price={price} />
    <AvgBar name="متوسط 200 جلسة" avg={s200} price={price} />
    <p className="chp-x">{xTechS.avg}</p>
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} dir="ltr" role="img" aria-label="آخر 60 إقفال مع الدعم والمقاومة">
      {line(res, 'res', DN)}{line(sup, 'sup', UP)}
      <path d={c.map((y, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(y).toFixed(1)).join('')} fill="none" stroke="#e8ecf2" strokeWidth={1.5} strokeLinejoin="round" />
      <circle cx={X(c.length - 1)} cy={Y(c[c.length - 1])} r={3} fill="#e8ecf2" />
    </svg>
    <div className="ts-l"><span><i style={{ background: DN }} />مقاومة (أعلى 20 جلسة) <bdi dir="ltr">{res != null ? f(res) : 'غير متوفر'}</bdi></span><span><i style={{ background: UP }} />دعم (أقل 20 جلسة) <bdi dir="ltr">{sup != null ? f(sup) : 'غير متوفر'}</bdi></span></div>
    <p className="chp-x">{xTechS.lv}</p>
    {s.bars.length < 200 && <p className="ts-f"><b>تنبيه:</b> التاريخ <bdi dir="ltr">{s.bars.length}</bdi> جلسة بس (أقل من 200)، فمتوسط 200 غير متوفر. باقي الأرقام أقل موثوقية.</p>}
    <p className="ts-f">لحد إقفال {s.date} · آخر 60 جلسة · مستويات للمراقبة بس، وصف للي حصل، مش توصية.</p>
  </section>;
}
