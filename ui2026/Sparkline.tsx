import React from 'react';
// Inline SVG sparkline. Green up / red down / grey flat or missing. No axes, no libs.
export type Dir = 'up' | 'down' | 'flat';
export const dirOf = (a?: number | null, b?: number | null): Dir =>
  a == null || b == null || !isFinite(a) || !isFinite(b) || a === b ? 'flat' : b > a ? 'up' : 'down';
export const COLOR: Record<Dir, string> = { up: '#2ebd85', down: '#f6465d', flat: '#8b95a5' };

export function Sparkline({ data, w = 64, h = 28, prevClose, dir }: { data: (number | null)[]; w?: number; h?: number; prevClose?: number | null; dir?: Dir }) {
  const v = (data || []).filter((x): x is number => typeof x === 'number' && isFinite(x));
  if (v.length < 2) return <span className="sp-na" style={{ width: w }} aria-label="غير متوفر">غير متوفر</span>;
  const d = dir ?? dirOf(v[0], v[v.length - 1]);
  const all = prevClose != null && isFinite(prevClose) ? [...v, prevClose] : v;
  const mn = Math.min(...all), mx = Math.max(...all), r = mx - mn || 1, p = 2;
  const X = (i: number) => p + (i * (w - 2 * p)) / (v.length - 1);
  const Y = (y: number) => h - p - ((y - mn) / r) * (h - 2 * p);
  const path = v.map((y, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(y).toFixed(1)).join('');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-hidden="true" dir="ltr">
      {prevClose != null && isFinite(prevClose) && <line x1={0} x2={w} y1={Y(prevClose)} y2={Y(prevClose)} stroke="#8b95a5" strokeWidth={1} strokeDasharray="3 3" opacity={0.6} />}
      <path d={path} fill="none" stroke={COLOR[d]} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
