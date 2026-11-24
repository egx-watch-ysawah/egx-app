import React, { useEffect, useState } from 'react';
import { useLocation } from './shim';

const TITLES = ['الحفظ والخصوصية', 'حدود الحفظ المحلي'];

// Tags the two info cards on the portfolio page so CSS can hide them until settings is opened.
// Text and markup stay owned by App.tsx.
function tag() {
  document.querySelectorAll('details.eg-ex').forEach(d => {
    const t = (d.querySelector('summary')?.textContent || '').trim();
    if (TITLES.includes(t)) d.classList.add('eg-priv');
  });
}

export function SettingsGear() {
  const loc = useLocation();
  const [on, setOn] = useState(false);
  const home = !/^\/[a-z]{3,5}$/i.test(loc.pathname);
  useEffect(() => {
    tag();
    const mo = new MutationObserver(tag);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);
  useEffect(() => { document.documentElement.dataset.set = on && home ? 'on' : ''; }, [on, home]);
  useEffect(() => { setOn(false); }, [loc.pathname]);
  if (!home) return null;
  return (
    <button type="button" className="set-btn" aria-pressed={on} aria-label="الإعدادات" onClick={() => { setOn(!on); window.scrollTo(0, 0); }}>
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" fill="none" stroke="currentColor" strokeWidth="1.8"/><path d="M19.4 13a7.7 7.7 0 0 0 0-2l2-1.5-2-3.4-2.3.9a7.5 7.5 0 0 0-1.7-1L15 3.5h-4l-.4 2.5a7.5 7.5 0 0 0-1.7 1l-2.3-.9-2 3.4 2 1.5a7.7 7.7 0 0 0 0 2l-2 1.5 2 3.4 2.3-.9a7.5 7.5 0 0 0 1.7 1l.4 2.5h4l.4-2.5a7.5 7.5 0 0 0 1.7-1l2.3.9 2-3.4z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>
    </button>
  );
}
