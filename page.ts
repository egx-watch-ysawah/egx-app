import { useEffect, useState } from 'react';
const pages: Record<string, any> = {};
const asked: Record<string, boolean> = {};
const done: Record<string, boolean> = {};
let ready: string[] = [];
let idxDone = false;
const subs = new Set<() => void>();
const bump = () => subs.forEach(f => f());
const bust = () => Math.floor(Date.now() / 300000);
export const hashCode = (): string => { const m = /^#\/(?:s\/)?([A-Za-z0-9]+)/.exec(location.hash); return m ? m[1].toUpperCase() : ''; };
export const preview = () => /[?&]new(=|&|$)/.test(location.hash);
export const READY = () => ready;
export const PVN = () => preview() || ready.includes(hashCode());
export const loadIndex = () => {
  if (asked['#idx']) return; asked['#idx'] = true;
  fetch('studies_rest/studies_rest/pages/index.json?t=' + bust(), { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).then(x => { if (x && Array.isArray(x.ready)) ready = x.ready.map((c: string) => String(c).toUpperCase()); }).catch(() => {}).then(() => { idxDone = true; bump(); });
};
export const loadPage = (code: string): Promise<any> => {
  if (!code) return Promise.resolve(null);
  if (asked[code]) return Promise.resolve(pages[code] || null); asked[code] = true;
  return fetch('studies_rest/studies_rest/pages/' + code + '.json?t=' + bust(), { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).then(p => { if (p && p.stocks && p.stocks[code]) pages[code] = { ...p.stocks[code], footer: p.footer_ar, footer_ar: p.footer_ar }; }).catch(() => {}).then(() => { done[code] = true; bump(); return pages[code] || null; });
};
export const pageOf = (code: string) => pages[code] || null;
export const NEW = (code: string): boolean => !!pages[code] && (preview() || ready.includes(code));
export const loadPilotM = (code: string): Promise<any> => loadPage(code);
const want = (code: string) => idxDone && !!code && (preview() || ready.includes(code)) && !asked[code];
export function usePage(code: string) {
  const [, f] = useState(0);
  useEffect(() => { const s = () => { if (want(code)) loadPage(code); f(x => x + 1); }; subs.add(s); loadIndex(); s(); return () => { subs.delete(s); }; }, [code]);
  return pages[code] || null;
}
export function usePageGate(code: string): boolean {
  const [, f] = useState(0);
  const [late, setLate] = useState(false);
  useEffect(() => { const s = () => { if (want(code)) loadPage(code); f(x => x + 1); }; subs.add(s); loadIndex(); s(); const t = setTimeout(() => setLate(true), 3000); return () => { subs.delete(s); clearTimeout(t); }; }, [code]);
  if (late || !code) return true;
  if (!idxDone) return false;
  return !(preview() || ready.includes(code)) || !!done[code];
}
