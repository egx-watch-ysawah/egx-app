import React from 'react';

// Staged gold visuals. Numbers: peak and low come from the GOLD data block (GoldPrice.com closes). The price comes from the
// latest line of gold/history.jsonl (written by the gold-snapshot Action) with its date; if the file is missing, the hardcoded
// 25 Nov close is used and labelled as such. No number is invented.
export type Snap = { nyDate: string; price: number; quoteTime?: string; kind?: string };
let SNAP_P: Promise<Snap | null> | null = null;
const loadSnap = (): Promise<Snap | null> => SNAP_P || (SNAP_P = fetch('gold/history.jsonl?t=' + Date.now(), { cache: 'no-store' }).then(r => (r.ok ? r.text() : '')).catch(() => '').then(t => {
  const rows = String(t).split('\n').map(l => { try { return JSON.parse(l); } catch { return null; } }).filter((x: any) => x && typeof x.price === 'number' && isFinite(x.price) && x.price > 0 && typeof x.nyDate === 'string');
  return rows.length ? (rows[rows.length - 1] as Snap) : null;
}));
export function useGoldSnap(): { snap: Snap | null; ready: boolean } {
  const [s, setS] = React.useState<{ snap: Snap | null; ready: boolean }>({ snap: null, ready: false });
  React.useEffect(() => { let on = true; loadSnap().then(x => on && setS({ snap: x, ready: true })); return () => { on = false; }; }, []);
  return s;
}
const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
export const arDate = (iso: string) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso); return m ? Number(m[3]) + ' ' + MONTHS[Number(m[2]) - 1] : iso; };
const f2 = (v: number) => v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pc = (v: number) => (v > 0 ? '▲ +' : v < 0 ? '▼ −' : '') + Math.abs(v).toFixed(1) + '%';
const cl = (v: number) => (v > 0 ? 'up' : v < 0 ? 'dn' : 'gr');

export function goldBase(snap: Snap | null, fallback: number, fallbackIso: string) {
  return snap ? { price: snap.price, label: 'سعر لحظي وقت اللقطة (17:00 نيويورك) يوم ' + arDate(snap.nyDate), date: snap.nyDate, snap: true }
    : { price: fallback, label: 'إقفال ' + arDate(fallbackIso), date: fallbackIso, snap: false };
}

export function GoldHeroCard({ peak, low, fallback, fallbackIso, days }: { peak: { close: number; label: string }; low: { close: number; label: string }; fallback: number; fallbackIso: string; days: number }) {
  const { snap, ready } = useGoldSnap();
  const b = goldBase(snap, fallback, fallbackIso);
  const fromPeak = (b.price / peak.close - 1) * 100;
  const fromLow = (b.price / low.close - 1) * 100;
  const lo = Math.min(low.close, b.price), hi = Math.max(peak.close, b.price);
  const pos = ((b.price - lo) / (hi - lo)) * 100;
  return <section className="gv" aria-label="ملخص سعر الذهب">
    <small className="gv-t">الذهب العالمي (دولار للأونصة) · مش مرتبط بالبورصة المصرية</small>
    <div className="gv-p" dir="ltr">{f2(b.price)}</div>
    <small className="gv-s">{ready ? b.label : 'بقرا آخر سعر مخزن...'}{b.snap ? '' : ' (آخر رقم مخزن، لقطة اليوم لسه مش متاحة)'}</small>
    <div className="gv-3">
      <span><i>من القمة</i><b className={cl(fromPeak)} dir="ltr">{pc(fromPeak)}</b><em>القمة {f2(peak.close)} يوم {peak.label.replace(/\s\d{4}$/, '')}. لو النزول كبير، قارنه بنزولات قديمة قبل ما تحكم.</em></span>
      <span><i>من أدنى سعر قريب</i><b className={cl(fromLow)} dir="ltr">{pc(fromLow)}</b><em>أدنى إقفال {f2(low.close)} يوم {low.label.replace(/\s\d{4}$/, '')}. بيوريك لو السعر ارتد منه ولا لسه.</em></span>
      <span><i>بقاله من القمة</i><b className="gr" dir="ltr">{days}</b><em>يوم من أغلى إقفال. المدة بتوريك طول النزول، مش هيكمل ولا لا.</em></span>
    </div>
    <div className="gv-bar" dir="ltr"><u style={{ left: Math.min(100, Math.max(0, pos)) + '%' }} /></div>
    <div className="gv-rg" dir="ltr"><span>{f2(lo)}</span><span>{f2(hi)}</span></div>
    <p className="gv-x">الشريط: من أدنى إقفال قريب لأعلى إقفال في السنة. مكان السعر عليه بيوريك هو قريب من القمة ولا من القاع.</p>
    <p className="gv-f">القمة والقاع: إقفال يومي من GoldPrice.com. السعر: {b.snap ? 'api.gold-api.com' : 'GoldPrice.com'}. وصف للي حصل، مش توصية.</p>
  </section>;
}

export const GOLD_SKIN = `
body.gold-route{background:#0b0f12}
.gold{color:#edeef0}
.gd-card,.gd-chart{background:#111822;border:1px solid #1e252f;border-radius:14px}
.gd-card h3,.gold h4{color:#edeef0}.gd-more summary{color:#b4bac4;min-height:44px;display:flex;align-items:center}
.gd-tag{color:#a5aab2}
.gd-bl,.gd-bl li,.gold li,.gold p{color:#d3d7dd}.gd-note,.gd-note a,.gd-asof{color:#a5aab2}
.gld-eff{border-inline-start:3px solid #4b5563;color:#b4bac4}
.gd-hero{background:#111822;border:1px solid #1e252f}.gd-count{color:#edeef0}.gd-hero small{color:#a5aab2}
.gd-ref b{color:#edeef0}.gd-dots.cur i{background:#edeef0}
.gld-tabs button{background:#111822;color:#a5aab2;border-color:#1e252f}
.gld-seg button{background:#111822;color:#a5aab2;border-color:#1e252f}.gld-seg button.on{background:#25b896;color:#06201a;border-color:#25b896}
.gld-chip{background:#1e252f;color:#d3d7dd}.gld-item{border-top-color:#1e252f}
.gv{background:#111822;border:1px solid #1e252f;border-radius:16px;padding:14px;margin:8px 0;display:flex;flex-direction:column;gap:8px}
.gv-t{color:#a5aab2;font-size:12px;text-align:center}.gv-p{font-size:44px;font-weight:700;text-align:center;font-variant-numeric:tabular-nums;color:#edeef0;line-height:1.1}
.gv-s{color:#a5aab2;font-size:12px;text-align:center}
.gv-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px}.gv-3 span{display:flex;flex-direction:column;align-items:center;text-align:center;gap:3px;background:#0b0f12;border-radius:10px;padding:8px 4px}
.gv-3 i{font-style:normal;font-size:11px;color:#a5aab2}.gv-3 b{font-size:15px;font-variant-numeric:tabular-nums}.gv-3 b.up{color:#25b896}.gv-3 b.dn{color:#de575b}.gv-3 b.gr{color:#edeef0}
.gv-3 em{font-style:normal;font-size:10.5px;line-height:1.45;color:#a5aab2}
.gv-bar{position:relative;height:8px;background:#1e252f;border-radius:4px;margin:8px 4px 0}.gv-bar u{position:absolute;top:-4px;width:3px;height:16px;background:#fff;border-radius:2px;transform:translateX(-50%)}
.gv-rg{display:flex;justify-content:space-between;font-size:11px;color:#a5aab2;font-variant-numeric:tabular-nums}
.gv-x{margin:0;font-size:11.5px;line-height:1.55;color:#a5aab2}.gv-f{margin:0;font-size:11px;line-height:1.55;color:#a5aab2}
.gd-card{padding:14px;margin:10px 0}.gd-card h3{font-size:17px;margin:0 0 8px}
.gd-card p,.gd-card li{font-size:14px;line-height:1.75}
.gd-hero{padding:10px 14px;border-radius:14px}.gd-hero .gd-count{font-size:34px;line-height:1.1}
.gd-chart{padding:8px;overflow:hidden;margin:10px 0}.gd-chart>div{border-radius:10px;overflow:hidden;background:#0b0f12}
.gd-row{border-top:1px solid #1e252f;padding:8px 0}.gd-rs,.gd-rl{color:#b4bac4}
.gd-dots i{background:#4b5563}.gd-dots.cur i{background:#de575b}
.gld-tabs button,.gld-seg button,.gd-more summary{min-height:44px}
.gold a{color:#b4bac4;text-decoration:underline}
`;

// ---------- live block (free sources: gold-api.com spot, CoinGecko PAXG, open.er-api.com USD/EGP) ----------
export type Live = { spot?: { p: number; at: number }; paxg?: { p: number; chg: number | null; at: number | null }; fx?: { r: number; at: number }; hist?: { t: number; p: number }[]; done: boolean };
let LIVE: Live = { done: false };
const subs = new Set<(l: Live) => void>();
const put = (patch: Partial<Live>) => { LIVE = { ...LIVE, ...patch }; subs.forEach(f => f(LIVE)); };
const j = (u: string) => fetch(u, { cache: 'no-store' }).then(r => { if (!r.ok) throw 0; return r.json(); });
let started = false, timer: any = null;
function pull() {
  const a = j('https://api.gold-api.com/price/XAU').then(x => { if (x && x.price > 0) put({ spot: { p: x.price, at: Date.parse(x.updatedAt) || Date.now() } }); }).catch(() => {});
  const b = j('https://api.coingecko.com/api/v3/simple/price?ids=pax-gold&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true').then(x => { const g = x && x['pax-gold']; if (g && g.usd > 0) put({ paxg: { p: g.usd, chg: typeof g.usd_24h_change === 'number' ? g.usd_24h_change : null, at: g.last_updated_at ? g.last_updated_at * 1000 : null } }); }).catch(() => {});
  const c = j('https://open.er-api.com/v6/latest/USD').then(x => { if (x && x.result === 'success' && x.rates && x.rates.EGP > 0) put({ fx: { r: x.rates.EGP, at: (x.time_last_update_unix || 0) * 1000 } }); }).catch(() => {});
  return Promise.all([a, b, c]).then(() => put({ done: true }));
}
function start() {
  if (started) return; started = true; pull();
  j('https://api.coingecko.com/api/v3/coins/pax-gold/market_chart?vs_currency=usd&days=90&interval=daily').then(x => { const h = (x.prices || []).map((q: any) => ({ t: q[0], p: q[1] })).filter((q: any) => q.p > 0); if (h.length > 5) put({ hist: h }); }).catch(() => {});
  timer = setInterval(pull, 120000);
}
export function useLive(): Live {
  const [l, setL] = React.useState<Live>(LIVE);
  React.useEffect(() => { subs.add(setL); setL(LIVE); start(); return () => { subs.delete(setL); }; }, []);
  return l;
}
const hhmm = (ms: number) => new Date(ms).toLocaleTimeString('en-GB', { timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit', hour12: false });
const dmy = (ms: number) => new Date(ms).toLocaleDateString('ar-EG-u-nu-latn', { timeZone: 'Africa/Cairo', day: 'numeric', month: 'long' });
export const stamp = (ms: number) => dmy(ms) + ' ' + hhmm(ms) + ' بتوقيت القاهرة';
// best live USD/oz: spot first, then PAXG, then the stored snapshot (labelled)
export function livePrice(l: Live, snap: Snap | null) {
  if (l.spot) return { p: l.spot.p, src: 'gold-api.com', at: l.spot.at, live: true };
  if (l.paxg) return { p: l.paxg.p, src: 'PAXG (CoinGecko)', at: l.paxg.at || Date.now(), live: true };
  if (snap) return { p: snap.price, src: 'لقطة ' + arDate(snap.nyDate), at: 0, live: false };
  return null;
}
export const fromHigh = (p: number, hi: number) => (p / hi - 1) * 100;

export function LiveHero({ peak, low, days }: { peak: { close: number; label: string }; low: { close: number; label: string }; days: number }) {
  const l = useLive(); const { snap } = useGoldSnap();
  const lp = livePrice(l, snap);
  if (!lp) return <section className="gv"><small className="gv-t">الذهب العالمي (دولار للأونصة)</small><p className="gv-x">{l.done ? 'غير متوفر: مقدرتش أجيب سعر الذهب دلوقتي (المصدر ما ردّش).' : 'بقرا السعر...'}</p></section>;
  const g24 = l.fx ? lp.p * l.fx.r / 31.1035 : 0;
  const fh = fromHigh(lp.p, peak.close), fl = (lp.p / low.close - 1) * 100;
  const lo = Math.min(low.close, lp.p), hi = Math.max(peak.close, lp.p), pos = ((lp.p - lo) / (hi - lo)) * 100;
  const chg = l.paxg && l.paxg.chg != null ? l.paxg.chg : null;
  const gap = l.spot && l.paxg ? (l.paxg.p / l.spot.p - 1) * 100 : null;
  return <section className="gv" aria-label="سعر الذهب دلوقتي">
    <small className="gv-t">الذهب العالمي · دولار للأونصة · مش مرتبط بالبورصة المصرية</small>
    <div className="gv-p" dir="ltr">{f2(lp.p)}</div>
    <small className="gv-s">{lp.live ? 'اتحدّث ' + stamp(lp.at) : 'مش لحظي: ' + lp.src}</small>
    <div className="gv-2">
      <span><i>تغيّر 24 ساعة</i>{chg == null ? <b className="gr">غير متوفر</b> : <b className={cl(chg)} dir="ltr">{pc(chg)}</b>}<em>{chg == null ? 'المصدر ما بعتش النسبة.' : 'من PAXG، مقارنة بامبارح'}</em></span>
      <span><i>جرام عيار 24 بالجنيه</i>{g24 ? <b className="gr" dir="ltr">{Math.round(g24).toLocaleString('en-US')}</b> : <b className="gr">غير متوفر</b>}<em>{g24 ? 'محسوب، مش سعر محل' : 'سعر الدولار مش متاح دلوقتي.'}</em></span>
    </div>
    <div className="gv-3">
      <span><i>من القمة</i><b className={cl(fh)} dir="ltr">{pc(fh)}</b><em>قمة إقفال {f2(peak.close)} ({peak.label.replace(/\s\d{4}$/, '')})</em></span>
      <span><i>من أدنى سعر</i><b className={cl(fl)} dir="ltr">{pc(fl)}</b><em>أدنى إقفال {f2(low.close)} ({low.label.replace(/\s\d{4}$/, '')})</em></span>
      <span><i>بقاله من القمة</i><b className="gr" dir="ltr">{days}</b><em>يوم من أغلى إقفال</em></span>
    </div>
    <div className="gv-bar" dir="ltr"><u style={{ left: Math.min(100, Math.max(0, pos)) + '%' }} /></div>
    <div className="gv-rg" dir="ltr"><span>{f2(lo)}</span><span>{f2(hi)}</span></div>
    <p className="gv-f" dir="ltr">{l.spot ? 'gold-api.com ' + f2(l.spot.p) + ' (' + hhmm(l.spot.at) + ')' : 'gold-api.com غير متوفر'} · {l.paxg ? 'PAXG ' + f2(l.paxg.p) + (l.paxg.at ? ' (' + hhmm(l.paxg.at) + ')' : '') : 'PAXG غير متوفر'}{gap != null ? ' · gap ' + (gap > 0 ? '+' : '\u2212') + Math.abs(gap).toFixed(2) + '%' : ''}</p>
    <p className="gv-f">القمة والقاع من إقفال لإقفال (GoldPrice.com). أعلى سعر لحظي 5,594.82 يوم 29 يناير (رويترز).</p>
  </section>;
}

export function GramCard() {
  const l = useLive(); const { snap } = useGoldSnap(); const lp = livePrice(l, snap);
  const rows: [string, number][] = [['عيار 24', 24], ['عيار 21', 21], ['عيار 18', 18]];
  if (!lp || !l.fx) return <section className="gd-card" id="gld-gram"><h3>سعر الجرام بالجنيه</h3><p className="gd-note">{l.done ? 'غير متوفر: ' + (!l.fx ? 'سعر الدولار مش متاح دلوقتي' : 'سعر الذهب مش متاح دلوقتي') + '.' : 'بقرا الأسعار...'}</p></section>;
  const g24 = lp.p * l.fx.r / 31.1035; const n = (v: number) => Math.round(v).toLocaleString('en-US');
  return <section className="gd-card gm" id="gld-gram"><h3>سعر الجرام بالجنيه</h3>
    <div className="gm-g">{rows.map(([t, k]) => <span key={k}><i>{t}</i><b dir="ltr">{n(g24 * k / 24)}</b></span>)}<span><i>الجنيه الذهب (8 جرام عيار 21)</i><b dir="ltr">{n(g24 * 21 / 24 * 8)}</b></span></div>
    <p className="gv-f">محسوب: الأونصة {f2(lp.p)} ({lp.src}{lp.live ? '، ' + stamp(lp.at) : ''}) في الدولار {l.fx.r.toFixed(2)} (ExchangeRate-API، {l.fx.at ? dmy(l.fx.at) : ''}) على 31.1035. من غير مصنعية وضريبة المحل.</p></section>;
}

export function OwnChart() {
  const l = useLive();
  const h = l.hist;
  if (!h) return <section className="gd-card"><h3>الذهب آخر 90 يوم</h3><p className="gd-note">{l.done ? 'غير متوفر: مقدرتش أجيب تاريخ السعر.' : 'بقرا...'}</p></section>;
  const W = 340, H = 150, ps = h.map(x => x.p), mn = Math.min(...ps), mx = Math.max(...ps);
  const X = (i: number) => 6 + (i / (h.length - 1)) * (W - 12), Y = (p: number) => 8 + (1 - (p - mn) / (mx - mn || 1)) * (H - 16);
  const d = h.map((x, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(x.p).toFixed(1)).join(' ');
  const up = ps[ps.length - 1] >= ps[0]; const col = up ? '#25b896' : '#de575b';
  const ch = (ps[ps.length - 1] / ps[0] - 1) * 100;
  return <section className="gd-card"><h3>الذهب آخر 90 يوم</h3>
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="خط سعر الذهب آخر 90 يوم" style={{ display: 'block', direction: 'ltr' }}>
      <path d={d + ` L${W} ${H} L0 ${H} Z`} fill={col} opacity=".10" /><path d={d} fill="none" stroke={col} strokeWidth="2" strokeLinejoin="round" />
      <circle cx={X(h.length - 1)} cy={Y(ps[ps.length - 1])} r="3.5" fill="#edeef0" /></svg>
    <div className="gv-rg" dir="ltr"><span>{dmy(h[0].t)}</span><span>{dmy(h[h.length - 1].t)}</span></div>
    <div className="gv-rg" dir="ltr"><span>أدنى {f2(mn)}</span><span className={cl(ch)}>{pc(ch)} في 90 يوم</span><span>أعلى {f2(mx)}</span></div>
    <p className="gv-f">PAXG (ذهب مرمّز) من CoinGecko، قيمة يومية، ممكن تفرق عن الفوري.</p></section>;
}

export const GOLD_SKIN2 = `
.gv-2{display:grid;grid-template-columns:1fr 1fr;gap:6px}.gv-2 span{display:flex;flex-direction:column;align-items:center;text-align:center;gap:3px;background:#0b0f12;border-radius:10px;padding:10px 6px}
.gv-2 i{font-style:normal;font-size:11.5px;color:#a5aab2}.gv-2 b{font-size:24px;font-variant-numeric:tabular-nums}.gv-2 b.up,.gv-rg .up{color:#25b896}.gv-2 b.dn,.gv-rg .dn{color:#de575b}.gv-2 b.gr{color:#edeef0}
.gv-2 em{font-style:normal;font-size:11px;line-height:1.45;color:#a5aab2}
.gm-g{display:grid;grid-template-columns:1fr 1fr;gap:6px}.gm-g span{display:flex;flex-direction:column;align-items:center;gap:2px;background:#0b0f12;border-radius:10px;padding:8px 4px;text-align:center}
.gm-g i{font-style:normal;font-size:11.5px;color:#a5aab2}.gm-g b{font-size:22px;color:#edeef0;font-variant-numeric:tabular-nums}
.gm-x{margin:8px 0 4px;font-size:12px;line-height:1.55;color:#b4bac4}
.vd{display:flex;flex-direction:column;gap:6px}.vd p{margin:0;font-size:14.5px;line-height:1.6;color:#edeef0}.vd small{color:#a5aab2;font-size:12px}
.gd-more>summary{min-height:44px}
`;
