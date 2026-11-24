import React, { useEffect, useState } from 'react';
import { useLocation } from './shim';

// Page-enter animation + compact sticky total on home. Reads existing DOM text only, computes nothing.
export function Motion() {
  const loc = useLocation();
  const [bar, setBar] = useState<{ t: string; d: string; dir: string } | null>(null);
  useEffect(() => {
    const el = document.querySelector('.eg-pad');
    if (!el) return;
    el.classList.remove('pg-in');
    void (el as HTMLElement).offsetWidth;
    el.classList.add('pg-in');
    const id = setTimeout(() => el.classList.remove('pg-in'), 400);
    return () => clearTimeout(id);
  }, [loc.pathname]);
  useEffect(() => {
    const read = () => {
      const t = document.querySelector('.hb-total') as HTMLElement | null;
      const d = document.querySelector('.hb-day') as HTMLElement | null;
      if (!t || t.getBoundingClientRect().bottom > 52) { setBar(null); return; }
      const dir = d && d.classList.contains('hb-down') ? 'down' : 'up';
      const pct = d && d.lastElementChild ? d.lastElementChild.textContent || '' : '';
      setBar(p => (p && p.t === (t.textContent || '') && p.d === pct && p.dir === dir ? p : { t: t.textContent || '', d: pct, dir }));
    };
    read();
    window.addEventListener('scroll', read, { passive: true });
    const iv = setInterval(read, 1500);
    return () => { window.removeEventListener('scroll', read); clearInterval(iv); };
  }, [loc.pathname]);
  return (
    <div className={'tot-bar' + (bar ? ' on' : '')} aria-hidden="true" data-dir={bar ? bar.dir : undefined}>
      {bar && <><small>إجمالي المحفظة</small><b dir="ltr">{bar.t}</b><em dir="ltr">{bar.d}</em></>}
    </div>
  );
}
