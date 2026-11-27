import './lists.css';
import React, { useEffect, useState } from 'react';
import { Link } from '../shim';
// Stock-list rows for EGX30 / EGX70 / rest: status badge + score circle + 64x28 sparkline. Numbers come from idx/index.json, idx/spark.json and the Starta row only.
const UP = '#25b896', DN = '#de575b', GR = '#8b95a5';
export type Spk = Record<string, { d: string; c: number[] }>;
let sp: Promise<Spk> | null = null;
export function useSpark(): Spk | null {
  const [d, setD] = useState<Spk | null>(null);
  useEffect(() => { let on = true; (sp = sp || fetch('idx/spark.json', { cache: 'no-store' }).then(r => (r.ok ? r.json() : {})).catch(() => ({}))).then(x => on && setD(x)); return () => { on = false; }; }, []);
  return d;
}
export function ListSpark({ c, w = 64, h = 28 }: { c?: number[]; w?: number; h?: number }) {
  if (!c || c.length < 2) return <span className="ls-na" style={{ width: w, height: h }}>غير متوفر</span>;
  const mn = Math.min(...c), mx = Math.max(...c), r = mx - mn || 1, p = 2;
  const X = (i: number) => p + (i * (w - 2 * p)) / (c.length - 1), Y = (y: number) => h - p - ((y - mn) / r) * (h - 2 * p);
  const col = c[c.length - 1] > c[0] ? UP : c[c.length - 1] < c[0] ? DN : GR;
  return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} dir="ltr" role="img" aria-label={`آخر ${c.length} جلسة`}><path d={c.map((y, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(y).toFixed(1)).join('')} fill="none" stroke={col} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" /></svg>;
}
// Day range (low-high) with last price marker, for stocks that have no price history here.
export function DayRange({ lo, hi, last, w = 64, h = 28 }: { lo?: number; hi?: number; last?: number; w?: number; h?: number }) {
  if (!(typeof lo === 'number' && typeof hi === 'number' && typeof last === 'number' && hi > lo)) return <span className="ls-na" style={{ width: w, height: h }}>غير متوفر</span>;
  const x = 4 + ((last - lo) / (hi - lo)) * (w - 8);
  return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} dir="ltr" role="img" aria-label="مدى اليوم"><line x1={4} x2={w - 4} y1={h / 2} y2={h / 2} stroke="#1e252f" strokeWidth={4} strokeLinecap="round" /><circle cx={x} cy={h / 2} r={4} fill="#e8ecf2" /></svg>;
}
export type Tone = 'up' | 'dn' | 'gr';
export function Badge({ t, tone }: { t: string; tone: Tone }) { return <em className={'ls-b ' + tone}>{t}</em>; }
export function Score({ n, of }: { n: number; of: number }) {
  const r = 11, c = 2 * Math.PI * r, f = n / of, col = f >= 0.6 ? UP : f <= 0.2 ? DN : GR;
  return <svg className="ls-sc" width={28} height={28} viewBox="0 0 28 28" role="img" aria-label={`${n} من ${of} فحوص فنية إيجابية`}><circle cx={14} cy={14} r={r} fill="none" stroke="#1e252f" strokeWidth={3} /><circle cx={14} cy={14} r={r} fill="none" stroke={col} strokeWidth={3} strokeDasharray={c} strokeDashoffset={c * (1 - f)} strokeLinecap="round" transform="rotate(-90 14 14)" /><text x={14} y={17.5} textAnchor="middle" fontSize={10} fontWeight={700} fill="#e8ecf2">{n}</text></svg>;
}
// Status from the stored votes: same rule as the old text line, shorter wording.
export function statusBadge(r: any): { t: string; tone: Tone } {
  if (r.full) return { t: 'تحليل كامل', tone: 'up' };
  if (!r.ok) return { t: 'تاريخ ناقص', tone: 'gr' };
  const v = r.votes || {};
  return v.trend && v.mid ? { t: 'فوق 200 و50', tone: 'up' } : !v.trend && !v.mid ? { t: 'تحت 200 و50', tone: 'dn' } : v.trend ? { t: 'فوق 200، تحت 50', tone: 'gr' } : { t: 'تحت 200، فوق 50', tone: 'gr' };
}
export const voteScore = (r: any): [number, number] | null => { const v = r.votes; if (!v || !Object.keys(v).length) return null; const k = ['trend', 'mid', 'macd', 'rsi', 'vol']; return [k.reduce((a, x) => a + (v[x] ? 1 : 0), 0), k.length]; };
export function ListRow({ to, off, name, code, tag, flag, badge, score, spark, price, chg, volLine, na }: { to?: string; off?: boolean; name: string; code: string; tag?: string; flag?: React.ReactNode; badge?: { t: string; tone: Tone } | null; score?: [number, number] | null; spark: React.ReactNode; price?: string; chg?: number | null; volLine?: React.ReactNode; na?: string }) {
  const body = <>
    <div className="ls-g"><div className="ls-n"><div className="ls-t"><b>{name}</b><small dir="ltr">{code}</small>{flag}{tag && <em className="ix-tag">{tag}</em>}</div>
      <div className="ls-m">{badge && <Badge {...badge} />}{score && <Score n={score[0]} of={score[1]} />}</div>
      {volLine && <div className="ls-v">{volLine}</div>}</div>
    <div className="ls-s">{spark}</div>
    <div className="ls-p">{na ? <small>غير متوفر</small> : <><span dir="ltr">{price ?? '-'}</span>{chg != null && <small className={chg >= 0 ? 'u' : 'd'} dir="ltr">{chg >= 0 ? '▲' : '▼'} {Math.abs(chg).toFixed(2)}%</small>}</>}</div>
    </div>{na && <div className="ls-nt">{na}</div>}
  </>;
  return to && !off ? <Link to={to} className="ls-r">{body}</Link> : <div className={'ls-r' + (off ? ' off' : '')}>{body}</div>;
}
export function ListHead({ mid }: { mid: string }) { return <div className="ls-hd" aria-hidden="true"><span>الشركة</span><span>{mid}</span><span>السعر · التغيّر</span></div>; }
export function ListNote({ line, date, children }: { line: string; date?: string; children: React.ReactNode }) {
  return <details className="ls-note"><summary><span>{line}</span>{date && <em className="ls-b gr" dir="ltr">{date}</em>}<u>تفاصيل</u></summary><div className="ls-nb">{children}</div></details>;
}
