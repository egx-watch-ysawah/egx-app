import React, { useEffect } from 'react';
import { NavLink, useLocation } from './shim';

const SYMS = ['MASR', 'BONY', 'HRHO', 'UNIP', 'PHAR', 'ORHD'];

export function AppBar() {
  const loc = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [loc.pathname]);
  return (
    <nav className="ab" aria-label="التنقل">
      <NavLink to="/" end className={({ isActive }: any) => 'ab-i ab-home' + (isActive || !SYMS.some(s => loc.pathname.toLowerCase() === '/' + s.toLowerCase()) ? ' on' : '')}>
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>
        <span>محفظتي</span>
      </NavLink>
      {SYMS.map(s => (
        <NavLink key={s} to={'/' + s.toLowerCase()} className={({ isActive }: any) => 'ab-i' + (isActive ? ' on' : '')}>
          <span dir="ltr">{s}</span>
        </NavLink>
      ))}
    </nav>
  );
}
