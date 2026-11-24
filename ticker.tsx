import React from 'react';
import { Link } from './shim';
import { DATA } from './data';
import { useLive } from './homeboard';

const SYMS = ['MASR', 'BONY', 'HRHO', 'UNIP', 'PHAR', 'ORHD'];
const fmt = (v: number) => (v >= 10 ? v.toFixed(2) : v.toFixed(3));

function dayChange(s: any): number | null {
  const b = s && s.bars;
  if (!Array.isArray(b) || b.length < 2) return null;
  const a = b[b.length - 2][4], z = b[b.length - 1][4];
  if (!Number.isFinite(a) || !Number.isFinite(z) || a <= 0 || Math.abs(z - s.close) > 1e-9) return null;
  return 100 * (z / a - 1);
}

export function Ticker() {
  const live = useLive();
  const items = SYMS.filter(k => DATA.stocks[k] && Number.isFinite(DATA.stocks[k].close)).map(k => {
    const s = DATA.stocks[k], L = live && live.stocks[k];
    const d = L ? 100 * (L.close / L.prev - 1) : dayChange(s);
    return { k, close: (L ? L.close : s.close) as number, d };
  });
  const row = (suffix: string) => items.map(i => (
    <Link key={i.k + suffix} to={'/' + i.k.toLowerCase()} className="tk-i" tabIndex={suffix ? -1 : 0} aria-hidden={suffix ? true : undefined}>
      <b dir="ltr">{i.k}</b>
      <span dir="ltr">{fmt(i.close)}</span>
      {i.d !== null && <em dir="ltr" className={i.d >= 0 ? 'u' : 'd'}>{i.d >= 0 ? '▲' : '▼'} {(i.d >= 0 ? '+' : '') + i.d.toFixed(2)}%</em>}
    </Link>
  ));
  return (
    <div className="tk" role="region" aria-label="شريط الأسهم">
      <div className="tk-track">{row('')}{row('-b')}</div>
    </div>
  );
}
