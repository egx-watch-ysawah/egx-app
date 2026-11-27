import React, { useEffect, useRef } from 'react';
import { LiveHero, GramCard, OwnChart, useLive, fromHigh, GOLD_SKIN, GOLD_SKIN2 } from '../ui2026/GoldVisual';
import { VerdictVisual, ForecastBoard, GoldFacts, GOLD_SKIN3, GOLD_SKIN3B } from '../ui2026/GoldForecast';
// All gold code in this one file (flag, data, cards, styles). Isolated from the EGX code.

// Keep numbers, signs and % in left-to-right order inside Arabic lines (wraps number tokens only; text unchanged).
const NUM_RE = /(^|[^\dA-Za-z.,:%+\-$])([+\-]?\$?\d(?:[\d,.:]*\d)?(?:-\d(?:[\d,.:]*\d)?)?%?)/g;
function fixNums(c: any): any {
  if (typeof c === 'string') {
    const out: any[] = []; let last = 0; let m: RegExpExecArray | null; NUM_RE.lastIndex = 0;
    while ((m = NUM_RE.exec(c))) { const start = m.index + m[1].length; if (start > last) out.push(c.slice(last, start)); out.push(<bdi key={start} dir="ltr">{m[2]}</bdi>); last = start + m[2].length; }
    if (last < c.length) out.push(c.slice(last));
    return out;
  }
  if (Array.isArray(c)) return c.map((x, i) => <React.Fragment key={i}>{fixNums(x)}</React.Fragment>);
  if (React.isValidElement(c) && typeof c.type === 'string' && (c.type === 'b' || c.type === 'span')) return React.cloneElement(c as any, {}, fixNums((c as any).props.children));
  return c;
}
const P = (p: any) => <p {...p}>{fixNums(p.children)}</p>;
const H3 = (p: any) => <h3 {...p}>{fixNums(p.children)}</h3>;
const H4 = (p: any) => <h4 {...p}>{fixNums(p.children)}</h4>;
const Li = (p: any) => <li {...p}>{fixNums(p.children)}</li>;
// Gold tab feature flag. Staging: open the app once with #/gold?gold=1 or set localStorage egx-gold=1.
// Live: set GOLD_LIVE = true to show the tab for everyone.
export const GOLD_LIVE = true;
export function goldOn(): boolean {
  if (GOLD_LIVE) return true;
  try { if (localStorage.getItem('egx-gold') === '1') return true; if (/[?&]gold=1/.test(location.hash + location.search)) { localStorage.setItem('egx-gold', '1'); return true; } } catch (e) {}
  return false;
}

const GOLD: any = {
  "updated": "2026-11-26T21:50:00+02:00",
  "peak": { "close": 5405.0, "date": "2026-01-29", "label": "29 يناير 2026" },
  "low": { "close": 3538.19, "date": "2026-11-20", "label": "20 نوفمبر 2026" },
  "fallPct": 34.5,
  "lastSourceDate": "2026-11-25",
  "source": { "name": "GoldPrice.com", "url": "https://www.goldprice.com/gold-price-today/2026-11-25", "note": "إقفال/تثبيت يومي من GoldPrice.com (تثبيت لندن لحد سنين قريبة، إقفال يومي بعد كده - المصدر مش بيحدد سنة التبديل)" },
  "price": { "status": "not_updated", "value": null, "asOf": null, "source": null },
  "falls": [
    { "id": "1996", "label": "1996-1999", "peak": "5 فبراير 1996", "peakClose": 414.8, "lowDate": "20 يوليو 1999", "low": 252.8, "pct": 39.1, "days": 2885, "dots": 289 },
    { "id": "2006", "label": "2006", "peak": "12 مايو 2006", "peakClose": 725.0, "lowDate": "6 أكتوبر 2006", "low": 560.75, "pct": 22.7, "days": 495, "dots": 50 },
    { "id": "2008", "label": "2008", "peak": "17 مارس 2008", "peakClose": 1011.25, "lowDate": "24 أكتوبر 2008", "low": 712.5, "pct": 29.5, "days": 548, "dots": 55 },
    { "id": "2011", "label": "2011-2015", "peak": "5 سبتمبر 2011", "peakClose": 1895.0, "lowDate": "17 ديسمبر 2015", "low": 1049.4, "pct": 44.6, "days": 3245, "dots": 325 },
    { "id": "2020", "label": "2020-2023", "peak": "6 أغسطس 2020", "peakClose": 2067.15, "lowDate": "3 نوفمبر 2022", "low": 1628.75, "pct": 21.2, "days": 1238, "dots": 124 }
  ]
};
// Final texts from the gold team (checker PASS). Do not reword.
const shortLabel = (u: string) => { try { const x = new URL(u); const h = x.hostname.replace(/^www\./, ''); const last = x.pathname.split('/').filter(Boolean).pop() || ''; return h.indexOf('fred') === 0 ? h + ' · ' + last : h; } catch (e) { return u; } };
const L = (u: string, t?: string) => <a href={u} target="_blank" rel="noreferrer" dir="ltr">{t || shortLabel(u)}</a>;

const Cond = ({ children }: any) => <Li>{children}</Li>;

const DAY = 86400000;
function cairoToday(): number {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(new Date()); // YYYY-MM-DD
  return Date.parse(p + 'T00:00:00Z');
}
const AR=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
function todayLabel(){const t=new Date(cairoToday());return t.getUTCDate()+' '+AR[t.getUTCMonth()]+' '+t.getUTCFullYear();}
export function daysSincePeak(): number { return Math.round((cairoToday() - Date.parse((GOLD as any).peak.date + 'T00:00:00Z')) / DAY); }
const nf = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function TVChart({ h = 420, cap }: { h?: number; cap?: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [bad, setBad] = React.useState(false);
  useEffect(() => { const t = setTimeout(() => { const el = ref.current; if (el && !el.querySelector('iframe')) setBad(true); }, 9000); return () => clearTimeout(t); }, []);
  useEffect(() => {
    const el = ref.current; if (!el) return; el.innerHTML = '';
    const w = document.createElement('div'); w.className = 'tradingview-widget-container__widget'; w.style.height = h + 'px'; w.style.width = '100%'; el.appendChild(w);
    const s = document.createElement('script'); s.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'; s.async = true;
    s.innerHTML = JSON.stringify({ autosize: true, symbol: 'OANDA:XAUUSD', interval: 'D', timezone: 'Africa/Cairo', theme: 'dark', style: '1', locale: 'ar_AE', allow_symbol_change: false, hide_side_toolbar: true, hide_top_toolbar: true, support_host: 'https://www.tradingview.com' });
    el.appendChild(s);
  }, [h]);
  if (bad) return <section className="gd-card"><p className="gd-note">شارت TradingView ما اشتغلش دلوقتي (الاتصال بيه فشل). الشارت اللي فوق (آخر 90 يوم) بديل.</p></section>;
  return <div className="gd-chart"><div style={{ height: h, width: '100%', position: 'relative' }}><div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9fb0c8', fontSize: 13 }}>الشارت بيحمّل...</div><div className="tradingview-widget-container" ref={ref} style={{ height: '100%', width: '100%', position: 'relative', zIndex: 1 }} /></div>
    <P className="gd-note">شارت OANDA XAUUSD (<a href="https://www.tradingview.com/" target="_blank" rel="noreferrer">TradingView</a>)، إرشادي وممكن يتأخر.</P></div>;
}




// v2 preview (bigger chart + inner tabs). Open with #/gold?v2=1. Public tab is unchanged until V2_LIVE = true.
export const V2_LIVE = true;
function v2On(): boolean { if (V2_LIVE) return true; try { return /[?&]v2=1/.test(location.hash + location.search); } catch (e) { return false; } }
const TABS: { id: string; label: string }[] = [{ id: 'ov', label: 'الذهب' }, { id: 'fc', label: 'التوقعات' }];
const Eff = ({ t }: any) => <P className="gld-eff">{Rng(t)}</P>;
const URLRE = /(https?:\/\/[^\s)،]+)/;
const Txt = ({ t }: { t: string }) => <>{String(t).split(URLRE).map((x: string, i: number) => i % 2 ? <a key={i} href={x} target="_blank" rel="noreferrer" dir="ltr">المصدر</a> : <React.Fragment key={i}>{Rng(x)}</React.Fragment>)}</>;
const cairo = (s: string) => { const m = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})/.exec(String(s)); return m ? <>{ar(m[1])}، <bdi dir="ltr">{m[2]}</bdi> بتوقيت القاهرة</> : <>{s}</>; };
// Forecasts data. Built to record schema v2 (records immutable, results separate). Preview only until checker and skeptic clear it.
const hq = (k: string) => { try { const m = new RegExp('[?&]' + k + '=([a-z0-9_-]+)').exec(location.hash + location.search); return m ? m[1] : ''; } catch (e) { return ''; } };
const hoursSince = (iso: string) => (Date.now() - new Date(iso).getTime()) / 36e5;
const MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const ar = (d: string) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d); return m ? `${+m[3]} ${MONTHS[+m[2] - 1]} ${m[1]}` : d; };
const Rng = (s: any) => String(s).split(/('[A-Za-z][^'\n]*'|\d{1,2}:\d{2}(?:\s?(?:[AaPp]\.?[Mm]\.?))?(?:\s?(?:EST|EDT|EET|CET|GMT|UTC|ET))?(?:\s=\s\d{1,2}:\d{2}(?:\s?(?:[AaPp]\.?[Mm]\.?))?(?:\s?(?:EST|EDT|EET|CET|GMT|UTC|ET))?)*|\$?[−+-]?\d[\d.,\/–-]*%?(?:\s\$|\s(?:GMT|CET|UTC|EST|ET|PM|AM)\b)?|[A-Za-z][A-Za-z0-9.&'-]*(?: (?:- )?[A-Za-z0-9][A-Za-z0-9.&',$%:-]*)*)/).map((x: string, i: number) => i % 2 ? (/^'[A-Za-z]/.test(x) ? <span key={i} dir="ltr" style={{ display: 'block', textAlign: 'left', margin: '2px 0' }}>{x}</span> : <bdi key={i} dir="ltr" style={/\d:\d\d/.test(x) ? { whiteSpace: 'nowrap' } : undefined}>{x}</bdi>) : <React.Fragment key={i}>{fixNums(x)}</React.Fragment>);
const Lnk = ({ u, t }: { u: string; t: string }) => <a href={u} target="_blank" rel="noreferrer" dir="ltr">{t}</a>;
const GOLD_CLOSE = 3589.44;
function GoldTabsV2({ overview }: { overview: any }) {
  const barRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => { const b = barRef.current && barRef.current.querySelector('.on') as HTMLElement | null; if (b && b.scrollIntoView) b.scrollIntoView({ inline: 'center', block: 'nearest' }); });
  const [t, setT] = React.useState(() => { const k = hq('tab'); return TABS.some(x => x.id === k) ? k : 'ov'; });
  return <>
    <div className="gld-tabs" role="tablist" ref={barRef}>{TABS.map(x => <button key={x.id} role="tab" aria-selected={t === x.id} className={t === x.id ? 'on' : ''} onClick={() => setT(x.id)}>{x.label}</button>)}</div>
    {t === 'ov' ? overview : <ForecastBoard />}</>;
}

export function GoldTab() {
  injectGoldCss();
  useEffect(() => { document.body.classList.add('gold-route'); return () => { document.body.classList.remove('gold-route'); }; }, []);
  const g: any = GOLD; const d = daysSincePeak();
  return <div className="eg-pad gold" dir="rtl">
    <P className="gd-tag">ذهب عالمي · مش مرتبط بالبورصة المصرية</P>
    <LiveHero peak={g.peak} low={g.low} days={d} />
    <OwnChart />
    <GramCard />
    <VerdictVisual />
    <><TVChart h={360} /><GoldTabsV2 overview={<GoldFacts />} /></>
  </div>;
}

const GOLD_CSS = `body.gold-route .tk,body.gold-route .eg-top{display:none!important}
body.gold-route .eg-card-root{padding-top:calc(46px + env(safe-area-inset-top))!important}body.gold-route .eg-card-root .eg-pad.gold{padding-top:0!important}
.gold{max-width:560px;margin:0 auto;color:#dfe6f2}
.gd-tag{color:#d9b43a;font-size:13px;text-align:center;margin:6px 0}
.gd-hero{text-align:center;background:radial-gradient(ellipse at top,#3a3210 0,#0f1520 70%);border-radius:14px;padding:14px 12px;margin:8px 0}
.gd-hero small{color:#9fb0c8}.gd-count{font-size:76px;line-height:1;font-weight:700;color:#e8c14a;direction:ltr}
.gd-hero p{font-size:12.5px;color:#aab6c9;margin:6px 0}.gd-ref b{color:#e8c14a}
.gd-card,.gd-chart{background:#141b29;border-radius:14px;padding:12px;margin:10px 0}
.gd-more summary{cursor:pointer;color:#e8c14a;font-size:13px;padding:8px 0;list-style:none}.gd-more summary::-webkit-details-marker{display:none}
.gd-bl{text-align:start;margin:4px 0 8px;padding-inline-start:18px;font-size:13px;line-height:1.8;color:#c3cddd}.gd-bl li{margin:3px 0}
@media (max-width:700px){.eg-pad.gold{overflow-x:visible!important}.gold .gd-chart{max-width:none;margin:10px -14px!important;border-radius:0;padding:0!important;box-sizing:border-box;overflow:hidden;direction:ltr}.gold .gd-chart .gd-note{direction:rtl}.gold .gd-chart .gd-note{padding:4px 12px 8px;margin:0}}
.gld-eff{margin:8px 0 0;padding:4px 8px;border-inline-start:3px solid #e8c14a;color:#e8c14a;font-size:13px;line-height:1.6}.gd-card h3{color:#e8c14a;margin:0 0 4px}.gd-note{font-size:12px;color:#9fb0c8}
.gd-note a{color:#9fb0c8}
.gd-row{margin:10px 0}.gd-rl{font-size:13px;margin-bottom:4px}.gd-rs{font-size:11.5px;color:#8c9bb3;margin-top:4px}
.gd-dots{display:grid;grid-template-columns:repeat(auto-fill,6px);gap:2px;direction:ltr}
.gd-dots i{width:6px;height:6px;border-radius:50%;background:#8da0c0;display:block}
.gd-dots.cur i{background:#e8c14a}
.gd-asof{display:block;margin:2px 0}
.gold{box-sizing:border-box;width:100%;overflow-x:hidden}
.gold *{box-sizing:border-box;max-width:100%}
.gold a,.gold p,.gold li{overflow-wrap:anywhere;word-break:break-word}
.gold a[dir=ltr]{unicode-bidi:plaintext;display:inline}
.gold ul{padding:0 18px 0 0;margin:6px 0}.gold li{margin:6px 0;font-size:13.5px;line-height:1.7}
.gold p{font-size:13.5px;line-height:1.7}.gold h4{margin:8px 0 2px;color:#e8c14a;font-size:13px}
.gd-card .gd-tag{text-align:right;margin:0 0 4px}
.gld-tabs{display:flex;gap:6px;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;margin:10px 0;padding:2px}.gld-tabs button{flex:0 0 auto;white-space:nowrap;background:#141b29;color:#9fb0c8;border:1px solid #243049;border-radius:999px;padding:8px 14px;font:inherit;font-size:13.5px;cursor:pointer}.gld-tabs button.on{background:#e8c14a;color:#1a1500;border-color:#e8c14a;font-weight:700}
.gld-q{margin:6px 0;padding:6px 10px;border-inline-start:3px solid #e8c14a55;color:#cfd6e4;font-size:13px;line-height:1.6;unicode-bidi:plaintext}.gld-head{display:flex;justify-content:space-between;align-items:flex-start;gap:8px}.gld-head h3{margin:0 0 6px;font-size:15px}.gld-chip{flex:none;background:#2a2410;color:#e8c14a;border-radius:999px;padding:2px 10px;font-size:12px}.gld-stale{background:#3a2c10;color:#f0cf7a;border-radius:8px;padding:6px 10px;font-size:12.5px}.gld-more{background:none;border:0;color:#e8c14a;font:inherit;font-size:13px;padding:6px 0;cursor:pointer}
.gld-seg{display:flex;gap:6px;margin:6px 0}.gld-seg button{flex:1;background:#141b29;color:#9fb0c8;border:1px solid #243049;border-radius:10px;padding:10px 6px;font:inherit;font-size:13.5px;cursor:pointer}.gld-seg button.on{background:#e8c14a;color:#1a1500;border-color:#e8c14a;font-weight:700}
.gld-item{padding:10px 0;border-top:1px solid #243049}.gld-item:first-of-type{border-top:0}
`;
function injectGoldCss() { if (!document.getElementById('gold-css')) { const st = document.createElement('style'); st.id = 'gold-css'; st.textContent = GOLD_CSS + GOLD_SKIN + GOLD_SKIN2 + GOLD_SKIN3 + GOLD_SKIN3B; document.head.appendChild(st); } }
