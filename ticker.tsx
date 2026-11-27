import React from 'react';
import { Link } from './shim';
import { useStarta } from './feed';
import { stampNote } from './scen';

const SYMS = ['MASR', 'BONY', 'HRHO', 'UNIP', 'PHAR', 'ORHD'];
const fmt = (v: number) => (v >= 1 ? v.toFixed(2) : v.toFixed(3));

export function Ticker() {
  const f = useStarta();
  // Only the live Starta snapshot. Nothing is shown until it arrives, so no stale daily numbers can appear.
  if (!f) return null;
  const items = SYMS.filter(k => f.rows[k] && f.rows[k].price > 0 && f.rows[k].prev > 0).map(k => ({ k, close: f.rows[k].price, d: 100 * (f.rows[k].price / f.rows[k].prev - 1) }));
  if (!items.length) return null;
  const hm = (() => { try { return new Date(f.at).toLocaleTimeString('en-GB', { timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit', hour12: false }); } catch { return ''; } })();
  const dm = (() => { try { return new Date(f.at).toLocaleDateString('en-GB', { timeZone: 'Africa/Cairo', day: '2-digit', month: '2-digit' }); } catch { return ''; } })();
  const row = (suffix: string) => items.map(i => (
    <Link key={i.k + suffix} to={'/' + i.k.toLowerCase()} className="tk-i" tabIndex={suffix ? -1 : 0} aria-hidden={suffix ? true : undefined}>
      <b dir="ltr">{i.k}</b>
      <span dir="ltr">{fmt(i.close)}</span>
      <em dir="ltr" className={i.d >= 0 ? 'u' : 'd'}>{i.d >= 0 ? '▲' : '▼'} {(i.d >= 0 ? '+' : '') + i.d.toFixed(2)}%</em>
    </Link>
  ));
  return (
    <div className="tk" role="region" aria-label={'شريط الأسهم، آخر لقطة ' + dm + ' ' + hm} title={'آخر لقطة من المصدر ' + dm + ' ' + hm + '، ' + stampNote(f.at)}>
      <div className="tk-vp"><div className="tk-track">{row('')}{row('-b')}</div></div>
      <span className="tk-at" dir="ltr">{dm} {hm}</span>
    </div>
  );
}
