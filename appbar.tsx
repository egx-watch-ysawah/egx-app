import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from './shim';
import I70 from './index70.json';
import { goldOn } from './gold/gold';
const C70: string[] = (I70 as any).codes || [];

const SYMS = ['MASR', 'BONY', 'HRHO', 'UNIP', 'PHAR', 'ORHD'];

export function AppBar() {
  const loc = useLocation();
  const [, force] = useState(0);
  useEffect(() => { const h = () => force(x => x + 1); window.addEventListener('egx-nav', h); return () => window.removeEventListener('egx-nav', h); }, []);
  const oth = !!(window as any).__egxOther && loc.pathname.startsWith('/s/');
  const sc = loc.pathname.startsWith('/s/') ? loc.pathname.slice(3).toUpperCase() : (SYMS.some(s => loc.pathname.toLowerCase() === '/' + s.toLowerCase()) ? '' : '');
  const on70 = !oth && !!sc && C70.indexOf(sc) >= 0;
  useEffect(() => { window.scrollTo(0, 0); }, [loc.pathname]);
  const p = loc.pathname.toLowerCase();
  const stocksOn = p === '/egx30' || p === '/egx70' || p === '/others' || p === '/all' || p === '/gold' || p === '/stocks' || p.startsWith('/s/') || p.startsWith('/o/');
  const portOn = p === '/' || SYMS.some(s => p === '/' + s.toLowerCase());
  return (
    <nav className="ab" aria-label="التنقل">
      <NavLink to="/home" className={({ isActive }: any) => 'ab-i' + (isActive ? ' on' : '')}>
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>
        <span>الرئيسية</span>
      </NavLink>
      <NavLink to="/egx30" className={() => 'ab-i' + (stocksOn ? ' on' : '')}>
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-8M22 20H2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
        <span>الأسهم</span>
      </NavLink>
      <NavLink to="/" end className={() => 'ab-i' + (portOn ? ' on' : '')}>
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M3 7h18v13H3zM8 7V4h8v3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>
        <span>محفظتي</span>
      </NavLink>
      <NavLink to="/more" className={({ isActive }: any) => 'ab-i' + (isActive ? ' on' : '')}>
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
        <span>المزيد</span>
      </NavLink>
    </nav>
  );
}

// Segmented sub-tabs shown on the stock list pages (old tabs EGX 30 / EGX 70 / others / gold keep their links).
export function StocksSubTabs() {
  const loc = useLocation();
  const p = loc.pathname.toLowerCase();
  if (!(p === '/egx30' || p === '/egx70' || p === '/others' || p === '/all' || p === '/gold')) return null;
  const items: [string, string, boolean][] = [['/egx30', 'EGX 30', true], ['/egx70', 'EGX 70', true], ['/others', 'باقي الأسهم', false]];
  if (goldOn()) items.push(['/gold', 'الذهب', false]);
  return (
    <div className="sst" role="tablist">
      {items.map(([to, label, ltr]) => <NavLink key={to} to={to} className={({ isActive }: any) => 'sst-i' + (isActive ? ' on' : '')}>{ltr ? <span dir="ltr">{label}</span> : label}</NavLink>)}
    </div>
  );
}
