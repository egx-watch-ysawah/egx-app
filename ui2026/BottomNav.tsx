import React from 'react';
import { NavLink } from '../shim';
// 5 tabs, RTL (first = rightmost). Only grey + one green accent. Portfolio keeps its existing route "/".
const I = (p: string) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={p} /></svg>;
export const TABS: { to: string; label: string; icon: string; match?: string[] }[] = [
  { to: '/home', label: 'الرئيسية', icon: 'M3 11l9-8 9 8M5 10v10h14V10' },
  { to: '/egx30', label: 'الأسهم', icon: 'M4 20V10M10 20V4M16 20v-8M22 20H2', match: ['/egx30', '/egx70', '/others', '/all', '/s/', '/o/'] },
  { to: '/signals', label: 'الإشارات', icon: 'M3 17l6-6 4 4 8-8M15 7h6v6' },
  { to: '/', label: 'محفظتي', icon: 'M3 7h18v13H3zM8 7V4h8v3' },
  { to: '/more', label: 'المزيد', icon: 'M4 7h16M4 12h16M4 17h16' },
];
export function BottomNav() {
  return (
    <nav className="bn" aria-label="التنقل">
      {TABS.map(t => (
        <NavLink key={t.to} to={t.to} end={t.to === '/'} className={({ isActive }: any) => 'bn-i' + (isActive ? ' on' : '')}>
          {I(t.icon)}<span>{t.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
// Old links keep working: /egx30 /egx70 /others /all /gold /s/:code /o/:code /masr.. stay as routes; "/" stays portfolio.
