// Light theme: dark stays default. When light is on, every colour in the loaded
// stylesheets is remapped at runtime into an override sheet (html[data-theme=light]).
type RGBA = [number, number, number, number];

function toHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  const d = mx - mn;
  if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h *= 60; if (h < 0) h += 360;
  return [h, s, l];
}
function fromHsl(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}
function mapColor([r, g, b, a]: RGBA, shadow: boolean): RGBA {
  const [h, s, l] = toHsl(r, g, b);
  let nl = l, ns = s;
  if (s < 0.28) {
    if (shadow && l < 0.15) return [r, g, b, a];
    nl = Math.min(0.97, Math.max(0.05, 1 - l));
    if (l > 0.85 && a < 0.5 && !shadow) nl = 0.1; // white overlays become dark overlays
    ns = Math.min(s, 0.3);
  } else if (l > 0.36) {
    nl = Math.min(l, 0.37);
  } else {
    nl = 0.97 - l * 0.45;
    ns = Math.min(1, s * 0.9);
  }
  const [R, G, B] = fromHsl(h, ns, nl);
  return [R, G, B, a];
}
const fmt = ([r, g, b, a]: RGBA) => a >= 1 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${+a.toFixed(3)})`;

const RE = /#([0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})\b|rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)(?:[\s,/]+([\d.]+%?))?\s*\)|\b(white|black)\b/gi;
function mapValue(v: string, shadow: boolean, seen?: RGBA[]): string {
  const parts = v.split(/(url\([^)]*\))/);
  return parts.map(p => p.startsWith('url(') ? p.replace(/%23([0-9a-f]{6})/gi, (_m: string, x: string) => { const o = mapColor([parseInt(x.slice(0, 2), 16), parseInt(x.slice(2, 4), 16), parseInt(x.slice(4, 6), 16), 1], false); return '%23' + [o[0], o[1], o[2]].map(n => n.toString(16).padStart(2, '0')).join(''); }) : p.replace(RE, (m, hex, r, g, b, al, kw) => {
    let c: RGBA;
    if (hex) {
      let x = hex; if (x.length <= 4) x = x.split('').map((q: string) => q + q).join('');
      c = [parseInt(x.slice(0, 2), 16), parseInt(x.slice(2, 4), 16), parseInt(x.slice(4, 6), 16), x.length === 8 ? parseInt(x.slice(6, 8), 16) / 255 : 1];
    } else if (kw) c = kw.toLowerCase() === 'white' ? [255, 255, 255, 1] : [0, 0, 0, 1];
    else c = [+r, +g, +b, al === undefined ? 1 : al.endsWith('%') ? parseFloat(al) / 100 : parseFloat(al)];
    const o = mapColor(c, shadow);
    if (seen) seen.push(o);
    return fmt(o);
  })).join('');
}
const isLightText = (v: string) => { const m = v.match(RE); if (!m) return false; return /#fff\b|#ffffff\b|white|#f[0-9a-f]{5}\b/i.test(v); };
const SHORT = ['background', 'border', 'border-top', 'border-bottom', 'border-left', 'border-right', 'border-inline-start', 'border-inline-end', 'border-block-start', 'border-block-end', 'outline', 'border-color', 'box-shadow', 'text-shadow'];
const COLORISH = /color|background|border|shadow|fill|stroke|outline|^--|filter|caret/;

function prefix(sel: string): string {
  return sel.split(',').map(s => {
    s = s.trim();
    if (/^(html|:root)\b/.test(s)) return s.replace(/^(html|:root)/, 'html[data-theme=light]');
    return 'html[data-theme=light] ' + s;
  }).join(',');
}
function ruleCss(rule: CSSRule): string {
  if (rule instanceof CSSStyleRule) {
    const decl: string[] = [];
    const st = rule.style;
    let solidFill = false;
    for (let i = 0; i < st.length; i++) {
      const p = st[i];
      if (/^background/.test(p)) { const seen: RGBA[] = []; mapValue(st.getPropertyValue(p), false, seen); if (seen.some(c => c[3] >= 0.8 && toHsl(c[0], c[1], c[2])[1] > 0.4 && toHsl(c[0], c[1], c[2])[2] < 0.5)) solidFill = true; }
    }
    const names = new Set<string>(Array.from({ length: st.length }, (_, i) => st[i]));
    SHORT.forEach(n => names.add(n));
    for (const p of names) {
      if (!COLORISH.test(p)) continue;
      const v = st.getPropertyValue(p);
      if (!/#|rgb|white|black|%23/i.test(v)) continue;
      if (p === 'color' && solidFill && isLightText(v)) continue;
      decl.push(`${p}:${mapValue(v, /shadow/.test(p))}!important`);
    }
    return decl.length ? `${prefix(rule.selectorText)}{${decl.join(';')}}` : '';
  }
  if (rule instanceof CSSMediaRule) {
    const inner = Array.from(rule.cssRules).map(ruleCss).join('');
    return inner ? `@media ${rule.conditionText}{${inner}}` : '';
  }
  if (rule instanceof CSSSupportsRule) {
    const inner = Array.from(rule.cssRules).map(ruleCss).join('');
    return inner ? `@supports ${rule.conditionText}{${inner}}` : '';
  }
  return '';
}

const ID = 'egx-light-sheet';
let timer = 0;
function build() {
  let css = '';
  for (const sh of Array.from(document.styleSheets)) {
    if ((sh.ownerNode as HTMLElement | null)?.id === ID) continue;
    try { css += Array.from(sh.cssRules).map(ruleCss).join('\n'); } catch { /* cross-origin */ }
  }
  css += `
html[data-theme=light] .eg-chart canvas{filter:invert(1) hue-rotate(180deg)}
html[data-theme=light] .set-theme{color:#334155}
html[data-theme=light] .gd-tab.on{color:#fff!important;background:#0f766e!important}
html[data-theme=light] .set-inst{color:#fff!important}
html[data-theme=light] .hc-tabs button.on{color:#fff!important;background:#0f766e!important}`;
  let el = document.getElementById(ID) as HTMLStyleElement | null;
  if (!el) { el = document.createElement('style'); el.id = ID; document.head.appendChild(el); }
  if (el.textContent !== css) el.textContent = css;
}
function schedule() { clearTimeout(timer); timer = window.setTimeout(build, 60); }

export function getTheme(): 'dark' | 'light' {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}
export function setTheme(t: 'dark' | 'light') {
  const de = document.documentElement;
  if (t === 'light') { de.dataset.theme = 'light'; build(); } else { delete de.dataset.theme; }
  de.style.colorScheme = t;
  try { localStorage.setItem('egx-theme', t); } catch { /* ignore */ }
  const m = document.querySelector('meta[name=theme-color]');
  if (m) m.setAttribute('content', t === 'light' ? '#f4f7fb' : '#0a0e17');
  window.dispatchEvent(new Event('egx-theme'));
}
export function initTheme() {
  let t: string | null = null;
  try { t = localStorage.getItem('egx-theme'); } catch { /* ignore */ }
  if (t === 'light') setTheme('light');
  new MutationObserver(ms => {
    if (getTheme() !== 'light') return;
    const inStyle = (n: Node | null): boolean => { const e = n && (n.nodeType === 1 ? (n as HTMLElement) : n.parentElement); return !!e && e.tagName === 'STYLE' && e.id !== ID; };
    if (ms.some(m => inStyle(m.target) || Array.from(m.addedNodes).some(n => inStyle(n) || (n.nodeType === 1 && !!(n as HTMLElement).querySelector('style'))))) schedule();
  }).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
}
