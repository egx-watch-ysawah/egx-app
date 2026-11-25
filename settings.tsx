import React, { useEffect, useState } from 'react';
import { useLocation } from './shim';
import { getTheme, setTheme } from './theme';

const TITLES = ['الحفظ والخصوصية', 'حدود الحفظ المحلي'];

// Tags the two info cards on the portfolio page so CSS can hide them until settings is opened.
// Text and markup stay owned by App.tsx.
function tag() {
  document.querySelectorAll('details.eg-ex').forEach(d => {
    const t = (d.querySelector('summary')?.textContent || '').trim();
    if (TITLES.includes(t)) d.classList.add('eg-priv');
  });
}

function buildId(): string {
  const s = document.querySelector('script[src*="app.js"]') as HTMLScriptElement | null;
  const m = s && /[?&]v=([\w-]+)/.exec(s.src);
  return m ? m[1] : 'dev';
}

export function SettingsGear() {
  const loc = useLocation();
  const [on, setOn] = useState(false);
  const [th, setTh] = useState(getTheme());
  const [ip, setIp] = useState<any>(null);
  useEffect(() => { const f = (e: any) => { e.preventDefault(); setIp(e); }; window.addEventListener('beforeinstallprompt', f); window.addEventListener('appinstalled', () => setIp(null)); return () => window.removeEventListener('beforeinstallprompt', f); }, []);
  const home = !/^\/[a-z]{3,5}$/i.test(loc.pathname);
  useEffect(() => {
    tag();
    const mo = new MutationObserver(tag);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);
  useEffect(() => { document.documentElement.dataset.set = on && home ? 'on' : ''; }, [on, home]);
  useEffect(() => { setOn(false); }, [loc.pathname]);
  return (
    <>
    <small className="bid">{(()=>{const t=parseInt(String(buildId()),36);if(!t||t<1e12)return "نسخة التطبيق";const d=new Date(t);return "آخر تحديث: "+d.toLocaleDateString("ar-EG",{day:"numeric",month:"long"})+" "+d.toLocaleTimeString("ar-EG",{hour:"2-digit",minute:"2-digit"})})()}</small>
    {home && ip && <button type="button" className="set-inst" onClick={() => { ip.prompt(); setIp(null); }}>تثبيت كتطبيق</button>}
    {home && <button type="button" className="set-theme" aria-label={th === 'light' ? 'الوضع الداكن' : 'الوضع الفاتح'} onClick={() => { const n = th === 'light' ? 'dark' : 'light'; setTheme(n); setTh(n); }}>
      {th === 'light'
        ? <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>
        : <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.8"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>}
    </button>}
    {home && <button type="button" className="set-btn" aria-pressed={on} aria-label="الإعدادات" onClick={() => { setOn(!on); window.scrollTo(0, 0); }}>
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" fill="none" stroke="currentColor" strokeWidth="1.8"/><path d="M19.4 13a7.7 7.7 0 0 0 0-2l2-1.5-2-3.4-2.3.9a7.5 7.5 0 0 0-1.7-1L15 3.5h-4l-.4 2.5a7.5 7.5 0 0 0-1.7 1l-2.3-.9-2 3.4 2 1.5a7.7 7.7 0 0 0 0 2l-2 1.5 2 3.4 2.3-.9a7.5 7.5 0 0 0 1.7 1l.4 2.5h4l.4-2.5a7.5 7.5 0 0 0 1.7-1l2.3.9 2-3.4z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>
    </button>}
    </>
  );
}
