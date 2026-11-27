import React from 'react';
import './summary.css';
export const nf = (n: number, d?: number) => n.toLocaleString('en-US', { maximumFractionDigits: d ?? (Math.abs(n) < 1 && n !== 0 ? 4 : 2) });
export const Num = ({ v, d, suf }: { v: number; d?: number; suf?: string }) => <bdi dir="ltr" className="sm-n">{nf(v, d)}{suf || ''}</bdi>;
export const pct = (a: number, b: number) => (b ? (a / b - 1) * 100 : null);
export function Delta({ p, suf = '%' }: { p: number | null; suf?: string }) {
  if (p == null || !isFinite(p)) return null;
  const up = p >= 0;
  return <span className={'sm-d ' + (up ? 'up' : 'dn')} dir="ltr">{up ? '▲' : '▼'} {up ? '+' : ''}{p.toFixed(1)}{suf}</span>;
}
// Two-period comparison: current bar coloured by direction, previous grey.
export const Tip = ({ t }: { t?: string }) => t ? <p className="sm-tip"><b>إزاي تستفيد: </b>{t}</p> : null;
export function PairBars({ label, a, b, la, lb, unit, tip }: { label: string; a: number; b: number; la: string; lb: string; unit?: string; tip?: string }) {
  const m = Math.max(Math.abs(a), Math.abs(b)) || 1;
  const p = pct(a, b);
  const up = a >= b;
  return <div className="sm-pair">
    <div className="sm-ph"><b>{label}</b><Delta p={p} /></div>
    <div className="sm-br"><span className="sm-pl">{la}</span><u><i className={up ? 'up' : 'dn'} style={{ width: Math.max(2, Math.abs(a) / m * 100) + '%' }} /></u><Num v={a} /></div>
    <div className="sm-br"><span className="sm-pl">{lb}</span><u><i className="gr" style={{ width: Math.max(2, Math.abs(b) / m * 100) + '%' }} /></u><Num v={b} /></div>
    {unit ? <small className="sm-u">{unit}</small> : null}
    <Tip t={tip} />
  </div>;
}
// Horizontal gauge with optional tick. value placed on [min,max]; colour tone neutral unless given.
export function Gauge({ label, value, min, max, text, tick, tickLabel, tone, note, log, tip }: { tip?: string; label: string; value: number; min: number; max: number; text: React.ReactNode; tick?: number; tickLabel?: string; tone?: 'up' | 'dn' | 'gr'; note?: string; log?: boolean }) {
  const f = (x: number) => { const v = log ? Math.log10(Math.max(x, min)) : x; const lo = log ? Math.log10(min) : min, hi = log ? Math.log10(max) : max; return Math.min(100, Math.max(0, (v - lo) / (hi - lo) * 100)); };
  return <div className="sm-gauge">
    <div className="sm-ph"><b>{label}</b><span className="sm-gv">{text}</span></div>
    <div className="sm-gt"><i className={tone || 'gr2'} style={{ width: f(value) + '%' }} />{tick != null && <em style={{ insetInlineStart: f(tick) + '%' }}><s>{tickLabel}</s></em>}</div>
    {note ? <small className="sm-u">{note}</small> : null}
    <Tip t={tip} />
  </div>;
}
export const Unavail = ({ children }: { children: React.ReactNode }) => <div className="sm-un"><span>غير متوفر</span><p>{children}</p></div>;
