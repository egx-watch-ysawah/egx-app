import React, { useEffect, useState } from 'react';
import { useNotTraded, arD } from './StockStatus';

// One source of truth for who is listed and how many: universe.json. The live feed only adds prices, never membership.
export type Uni = { ok: boolean; total: number; n30: number; n70: number; nO: number; asOf: string; s30: Set<string>; s70: Set<string>; sO: Set<string>; canon: (c: string) => string; hidden: Set<string> } | null;
let P: Promise<Uni> | null = null;
const strs = (a: any): string[] | null => (Array.isArray(a) && a.every(x => typeof x === 'string' && x) ? a.map(x => x.toUpperCase()) : null);
export const buildUni = (j: any): Uni => {
  if (!j || typeof j !== 'object') return null;
  const al: Record<string, string> = {}; if (j.aliases && typeof j.aliases === 'object') for (const k of Object.keys(j.aliases)) al[k.toUpperCase()] = String(j.aliases[k]).toUpperCase();
  const canon = (c: string) => { const u = String(c || '').toUpperCase(); return al[u] || u; };
  const hidden = new Set<string>((strs(j.hidden) || []).map(canon));
  const a = strs(j.egx30), b = strs(j.egx70), o = strs(j.others);
  if (!a || !b || !o) return null;
  const s30 = new Set(a.map(canon)), s70 = new Set(b.map(canon)), sO = new Set(o.map(canon));
  const all = new Set<string>([...s30, ...s70, ...sO]);
  const sum = s30.size + s70.size + sO.size;
  const clean = s30.size === a.length && s70.size === b.length && sO.size === o.length && all.size === sum && ![...all].some(c => hidden.has(c));
  const ok = clean && Number.isInteger(j.total) && j.total === sum;
  return { ok, total: sum, n30: s30.size, n70: s70.size, nO: sO.size, asOf: typeof j.as_of === 'string' ? j.as_of : '', s30, s70, sO, canon, hidden };
};
export const getUni = (): Promise<Uni> => P || (P = fetch('universe.json?t=' + Date.now(), { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).catch(() => null).then(buildUni));
// undefined while loading, null when missing or malformed, otherwise the checked universe (u.ok false = counts do not add up, show no number).
export function useUni(): Uni | undefined {
  const [u, setU] = useState<Uni | undefined>(undefined);
  useEffect(() => { let on = true; getUni().then(x => on && setU(x)); return () => { on = false; }; }, []);
  return u;
}
const nf = (n: number) => <bdi dir="ltr">{n}</bdi>;
// Sub-line that adds up to the total.
export function UniSub({ u }: { u: Uni | undefined }) {
  const nt = useNotTraded();
  if (!u || !u.ok) return null;
  const n = nt ? new Set(nt.map(u.canon).filter(c => u.s30.has(c) || u.s70.has(c) || u.sO.has(c))).size : 0;
  return <p className="eg-note" style={{ margin: '4px 0 8px' }}>إجمالي الأسهم في التطبيق {nf(u.total)} = EGX 30 ({nf(u.n30)}) + EGX 70 ({nf(u.n70)}) + باقي الأسهم ({nf(u.nO)}).{n === 1 ? ' منهم سهم واحد لسه ماتداولش.' : n === 2 ? ' منهم سهمين لسه ماتداولوش.' : n > 2 ? <> منهم {nf(n)} سهم لسه ماتداولوش.</> : null}{u.asOf ? <> القايمة بتاريخ {arD(u.asOf)}.</> : null}</p>;
}
