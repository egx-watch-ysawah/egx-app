import React from 'react';
import { useLive, livePrice, useGoldSnap, fromHigh } from './GoldVisual';

// Gold opinion + forecasts as numbers and charts. Every target keeps its source, publish date and a confirmed/unconfirmed mark.
// Colors: green = target above today's price, red = below. Sign (+/−) and ▲▼ are always written too.
export type Tgt = { n: number; org: string; v: number; hi?: number; d: string; kind: string; pub: string; urls: [string, string][]; extra?: string };
export const STAMP = '27 نوفمبر 2026، 21:10 القاهرة';
// Reviewed list (main, 27 Nov 2026 21:10). Only these rows, each with its link.
export const TARGETS: Tgt[] = [
  { n: 1, org: 'ستاندرد تشارترد', v: 4000, d: '2027-02-20', kind: 'بعد 3 شهور', pub: 'توقع 20 نوفمبر', urls: [['المصدر (PDF)', 'https://www.sc.com/en/uploads/sites/66/content/docs/wm-weekly-market-view-staying-diversified-adding-us-mega-caps-20-november-2026.pdf']] },
  { n: 2, org: 'جولدمان ساكس', v: 4150, d: '2026-12-31', kind: 'آخر 2026', pub: '6 نوفمبر', urls: [['المصدر', 'https://www.miningweekly.com/article/goldman-sachs-trims-gold-forecasts-as-fed-stays-hawkish-2026-11-06']] },
  { n: 3, org: 'UBS', v: 4500, d: '2026-12-31', kind: 'آخر 2026', pub: '18 و21 نوفمبر', urls: [['المصدر 21 نوفمبر', 'https://www.investing.com/news/commodities-news/ubs-flags-further-gold-weakness-before-fed-ratecut-expectations-return-5043537'], ['المصدر 18 نوفمبر', 'https://www.boerse-express.com/news/articles/ubs-aktie-goldprognose-gesenkt-964375']] },
  { n: 4, org: 'ستاندرد تشارترد', v: 4500, d: '2027-11-20', kind: 'بعد 12 شهر', pub: 'توقع 20 نوفمبر', urls: [['المصدر (PDF)', 'https://www.sc.com/en/uploads/sites/66/content/docs/wm-weekly-market-view-staying-diversified-adding-us-mega-caps-20-november-2026.pdf']] },
  { n: 5, org: 'جي بي مورغان', v: 4500, hi: 4600, d: '2027-12-31', kind: 'آخر 2027', pub: '24 و27 نوفمبر', urls: [['كيتكو 27 نوفمبر', 'https://www.kitco.com/news/article/2026-11-27/gold-will-reach-4600oz-q4-2027-rates-fall-usd-gives-back-10-overvaluation'], ['رويترز 24 نوفمبر', 'https://www.tradingview.com/news/reuters.com%2C2026:newsml_L3N4751FV:0-jp-morgan-cuts-base-metals-outlook-sees-gold-at-4-500-by-end-2027/']] },
  { n: 6, org: 'جولدمان ساكس', v: 4650, d: '2027-12-31', kind: 'آخر 2027', pub: '17 نوفمبر', urls: [['المصدر', 'https://www.kitco.com/news/article/2026-11-17/gold-will-reclaim-5600oz-2028-rate-cuts-bring-western-investors-back']] },
  { n: 7, org: 'UBS', v: 5000, d: '2027-12-31', kind: 'آخر 2027', pub: '18 و21 نوفمبر', urls: [['المصدر', 'https://www.investing.com/news/commodities-news/ubs-flags-further-gold-weakness-before-fed-ratecut-expectations-return-5043537']], extra: 'في الطريق: مارس 4,200 · يونيو 4,600 · سبتمبر 4,800' },
  { n: 8, org: 'جولدمان ساكس', v: 5600, d: '2028-12-31', kind: 'آخر 2028، بشرط تخفيض الفايدة', pub: '17 نوفمبر', urls: [['المصدر', 'https://www.kitco.com/news/article/2026-11-17/gold-will-reclaim-5600oz-2028-rate-cuts-bring-western-investors-back']] },
];
const WB_URL = 'https://www.worldbank.org/en/news/press-release/2026/10/28/commodity-markets-outlook-october-2026';
export const WB = [{ y: 2026, v: 4600 }, { y: 2027, v: 4250 }, { y: 2028, v: 4000 }];
const MON = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const adt = (iso: string) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso); return m ? Number(m[3]) + ' ' + MON[Number(m[2]) - 1] + ' ' + m[1] : iso; };
const n0 = (v: number) => Math.round(v).toLocaleString('en-US');
const pc = (v: number) => (v > 0 ? '▲ +' : v < 0 ? '▼ −' : '') + Math.abs(v).toFixed(0) + '%';
const cl = (v: number) => (v > 0 ? 'up' : v < 0 ? 'dn' : 'gr');
const T = (iso: string) => Date.parse(iso + 'T00:00:00Z');
const FALLBACK = { p: 3638, src: 'gold-api، ' + STAMP };

export function useGoldPx(): { p: number; src: string; live: boolean } {
  const l = useLive(); const { snap } = useGoldSnap();
  const lp = livePrice(l, snap);
  if (lp && lp.live && lp.p > 0) return { p: lp.p, src: lp.src, live: true };
  return { p: FALLBACK.p, src: FALLBACK.src, live: false };
}

export function ForecastChart({ px }: { px: number }) {
  const W = 360, H = 250, L = 38, R = 8, Tp = 12, B = 26;
  const t0 = Date.now(), t1 = T('2028-12-31') + 20 * 864e5;
  const lo = 3400, hi = 5800;
  const x = (t: number) => L + ((t - t0) / (t1 - t0)) * (W - L - R);
  const y = (v: number) => Tp + (1 - (v - lo) / (hi - lo)) * (H - Tp - B);
  const byDate: Record<string, Tgt[]> = {};
  TARGETS.forEach(a => { (byDate[a.d] = byDate[a.d] || []).push(a); });
  const pos = (a: Tgt) => { const g = byDate[a.d]; const i = g.indexOf(a); return x(T(a.d)) + (i - (g.length - 1) / 2) * 21 - (a.d === '2028-12-31' ? 14 : 0); };
  const yrs = ['2027-01-01', '2028-01-01', '2029-01-01'];
  const lv = (v: number, below: boolean) => <g key={v}><line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="#a5aab2" strokeWidth="1" strokeDasharray="1 3" /><text x={W - R} y={y(v) + (below ? 12 : -4)} textAnchor="end" fontSize="10" fill="#b4bac4">{n0(v)}</text></g>;
  return <svg className="gf-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="سعر الذهب دلوقتي ومستويات وأهداف منشورة بتواريخها" dir="ltr" style={{ direction: 'ltr', unicodeBidi: 'isolate' }}>
    {[4000, 4500, 5000, 5500].map(v => <g key={v}><line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="#1e252f" /><text x={L - 4} y={y(v) + 3} textAnchor="end" fontSize="10" fill="#a5aab2">{n0(v)}</text></g>)}
    <text x={L - 4} y={y(3500) + 3} textAnchor="end" fontSize="10" fill="#a5aab2">3,500</text>
    {yrs.map(d => <g key={d}><line x1={x(T(d))} x2={x(T(d))} y1={Tp} y2={H - B} stroke="#1e252f" strokeDasharray="2 3" /><text x={x(T(d)) - 4} y={H - 8} textAnchor="end" fontSize="10" fill="#a5aab2">{Number(d.slice(0, 4)) - 1}</text></g>)}
    {lv(5405, true)}
    {lv(4000, true)}
    {lv(3500, true)}
    <line x1={L} x2={W - R} y1={y(px)} y2={y(px)} stroke="#edeef0" strokeDasharray="5 4" />
    <text x={W - R} y={y(px) - 4} textAnchor="end" fontSize="10.5" fill="#edeef0">{n0(px)}</text>
    <circle cx={L} cy={y(px)} r="4.5" fill="#edeef0" />
    {TARGETS.map(a => { const cx = pos(a); const mid = a.hi ? (a.v + a.hi) / 2 : a.v; const col = mid > px ? '#25b896' : '#de575b'; const cy = y(mid);
      return <g key={a.n}>
        {a.hi ? <line x1={cx} x2={cx} y1={y(a.hi)} y2={y(a.v)} stroke={col} strokeWidth="5" strokeLinecap="round" opacity=".55" /> : null}
        <circle cx={cx} cy={cy} r="9" fill={col} stroke={col} strokeWidth="1.6" />
        <text x={cx} y={cy + 3.5} textAnchor="middle" fontSize="10" fontWeight="700" fill="#0b0f12">{a.n}</text></g>; })}
  </svg>;
}

const Key = () => <><p className="gf-key lv"><span><b>• • •</b> 5,405 قمة إقفال (29 يناير) من GoldPrice.com، من إقفال لإقفال</span><span><b>• • •</b> 4,000 كان دعم، اتكسر 23 أكتوبر</span><span><b>• • •</b> 3,500 قاع 20 نوفمبر: إقفال 3,538، أقل سعر في اليوم 3,503</span><span><b>- - -</b> السعر دلوقتي</span></p><p className="gf-key"><span><b className="up">أخضر</b> أعلى من السعر · <b className="dn">أحمر</b> أقل</span></p></>;
const cairoDay = () => T(new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(new Date()));

// Overview block: price now, US rate, next event, chart. No verdict, no strength rating.
export function VerdictVisual() {
  const g = useGoldPx();
  const dd = (d: string) => { const n = Math.round((T(d) - cairoDay()) / 864e5); return n >= 0 ? String(n) : '—'; };
  return <section className="gd-card gf" id="gld-verdict"><h3>الذهب بالأرقام</h3>
    <div className="gf-t3 two">
      <span><i>سعر الأونصة دلوقتي</i><b className="gr" dir="ltr">{g.live ? g.p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : n0(g.p)}</b><em>دولار · {g.live ? 'gold-api لايف' : g.src}</em></span>
      <span><i>الفايدة الأمريكية</i><b className="gr" dir="ltr">3.75–4.00%</b><em>{STAMP}</em></span>
    </div>
    <div className="gf-evs">
      <div className="gf-e3"><span className="gf-dd"><b dir="ltr">{dd('2026-12-09')}</b><small>يوم</small></span>
        <div><b>قرار الفيدرالي · الأربعاء 9 ديسمبر</b>
          <div className="gf-rf"><b dir="ltr" className="gr">~98%</b><small>السوق شايف رفع (CME، 27 نوفمبر)</small></div>
          <div className="gf-bt gf-p" dir="ltr"><div className="gf-bf" style={{ width: '98%' }} /></div>
          <p className="gf-e">الفايدة العالية بتضغط على الذهب.</p></div></div>
      <div className="gf-e3 s"><span className="gf-dd"><b dir="ltr">{dd('2026-12-04')}</b><small>يوم</small></span><div><b>تقرير الوظائف الأمريكي</b><small>الجمعة 4 ديسمبر · 15:30 القاهرة</small></div></div>
      <div className="gf-e3 s"><span className="gf-dd"><b dir="ltr">{dd('2026-12-10')}</b><small>يوم</small></span><div><b>التضخم الأمريكي (CPI)</b><small>الخميس 10 ديسمبر · 15:30 القاهرة</small></div></div>
    </div>
    <h4 className="gf-h">السعر ومستويات وأهداف الجهات</h4>
    <ForecastChart px={g.p} /><Key />
    <p className="gf-ex">الأرقام بتواريخها في تبويب التوقعات. أهداف الجهات مش توقعنا.</p>
  </section>;
}

export function ForecastBoard() {
  const g = useGoldPx();
  return <div className="gf">
    <section className="gd-card"><h3>أهداف الجهات (مش توقعنا)</h3>
      <p className="gf-ex">آراء جهات منشورة، بتواريخها. آخر مراجعة {STAMP}.</p>
      <ForecastChart px={g.p} /><Key />
      <div className="gf-tb">{TARGETS.map(a => {
        const mid = a.hi ? (a.v + a.hi) / 2 : a.v; const gp = (mid / g.p - 1) * 100;
        return <div className="gf-tr" key={a.n}>
          <span className={'gf-n f ' + cl(gp)}>{a.n}</span>
          <div className="gf-m"><b>{a.org}</b><span dir="ltr" className="gf-v1">{a.hi ? n0(a.v) + ' – ' + n0(a.hi) : n0(a.v)}</span></div>
          <div className="gf-g"><b className={cl(gp)} dir="ltr">{a.hi ? pc((a.v / g.p - 1) * 100) + ' / ' + pc((a.hi / g.p - 1) * 100) : pc(gp)}</b><small>{adt(a.d)}</small></div>
          <p className="gf-e">{a.kind}{a.pub ? ' · ' + a.pub : ''} · {a.urls.map(([t, u], i) => <React.Fragment key={u}>{i ? ' · ' : ''}<a href={u} target="_blank" rel="noreferrer">{t}</a></React.Fragment>)}</p>{a.extra ? <p className="gf-e">{a.extra}</p> : null}
        </div>; })}
        <div className="gf-tr wb"><span className="gf-n na">—</span>
          <div className="gf-m"><b>البنك الدولي</b><span className="gf-wb" dir="ltr">{WB.map(w => <span key={w.y}><i>{w.y}</i><b>{n0(w.v)}</b></span>)}</span></div>
          <p className="gf-e">متوسط السنة كلها، مش سعر يوم (28 أكتوبر). مش على الرسم. <a href={WB_URL} target="_blank" rel="noreferrer">المصدر</a></p></div>
      </div>
      <p className="gf-ex">النسبة = الفرق عن السعر الآن ({g.live ? 'لايف' : g.src}). تاريخ "بعد 3 شهور" محسوب من تاريخ النشر.</p>
    </section>
    <GoldFooter />
  </div>;
}

export const GOLD_SKIN3 = `
.gf h3{margin:0 0 8px}.gf-h{margin:14px 0 4px!important;color:#edeef0!important;font-size:14px!important}
.gf-v{display:flex;flex-direction:column;gap:8px}.gf-r{background:#0b0f12;border-radius:12px;padding:10px 12px;display:flex;flex-direction:column;gap:4px}
.gf-k{font-size:12px;color:#a5aab2}.gf-pill{align-self:flex-start;font-size:15px;color:#edeef0;border-radius:999px;padding:4px 12px;border:1px solid #1e252f;background:#111822}.gf-pill.up{color:#25b896;border-color:#25b89655}
.gf-r p,.gf-ex{margin:0;font-size:12px!important;line-height:1.55!important;color:#b4bac4}.gf-ex.warn{color:#de575b}
.gf-meter{display:flex;gap:4px;direction:ltr;align-self:flex-start}.gf-meter i{width:34px;height:8px;border-radius:4px;background:#1e252f}.gf-meter i.on{background:#b4bac4}
.gf-t3{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:10px 0}.gf-t3.one{grid-template-columns:1fr}.gf-t3 span{display:flex;flex-direction:column;align-items:center;text-align:center;gap:2px;background:#0b0f12;border-radius:10px;padding:8px 4px}
.gf-t3 i{font-style:normal;font-size:11.5px;color:#a5aab2}.gf-t3 b{font-size:20px;font-variant-numeric:tabular-nums;color:#edeef0}.gf-t3 b.up{color:#25b896}.gf-t3 b.dn{color:#de575b}.gf-t3 em{font-style:normal;font-size:11px;color:#a5aab2;line-height:1.4}
.gf-svg{width:100%;height:auto;display:block;margin:6px 0;background:#0b0f12;border-radius:10px}
.gf-key{display:flex;flex-wrap:wrap;gap:6px 12px;margin:2px 0 8px!important;font-size:11.5px!important;color:#b4bac4}.gf-key span{display:inline-flex;align-items:center;gap:5px}.gf-key i{width:12px;height:12px;border-radius:50%;display:inline-block;border:1.6px solid #25b896}.gf-key i.f{background:#25b896}.gf-key i.h{border-style:dashed}.gf-key .up{color:#25b896}.gf-key .dn{color:#de575b}
.gf-tb{display:flex;flex-direction:column}.gf-tr{display:grid;grid-template-columns:30px 1fr auto;column-gap:10px;align-items:center;padding:10px 0;border-top:1px solid #1e252f}.gf-tr:first-child{border-top:0}
.gf-n{width:26px;height:26px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border:1.6px solid}.gf-n.f.up{background:#25b896;color:#0b0f12;border-color:#25b896}.gf-n.f.dn{background:#de575b;color:#0b0f12;border-color:#de575b}.gf-n.h{color:#edeef0;border-style:dashed}.gf-n.h.up{border-color:#25b896}.gf-n.h.dn{border-color:#de575b}
.gf-m{display:flex;flex-direction:column;gap:1px;min-width:0}.gf-m b{font-size:13.5px;color:#edeef0}.gf-v1{font-size:19px;font-weight:700;color:#edeef0;font-variant-numeric:tabular-nums;text-align:end}
.gf-g{display:flex;flex-direction:column;align-items:flex-end;gap:1px}.gf-g b{font-size:14px;font-variant-numeric:tabular-nums}.gf-g b.up{color:#25b896}.gf-g b.dn{color:#de575b}.gf-g small{font-size:11px;color:#a5aab2}
.gf-e{grid-column:1/-1;margin:2px 0 0!important;font-size:11.5px!important;line-height:1.5!important;color:#a5aab2}.gf-e a{color:#b4bac4;text-decoration:underline;display:inline-flex;align-items:center;min-height:44px}
.gf-ev{display:flex;flex-direction:column;gap:8px}.gf-e3{display:grid;grid-template-columns:56px 1fr;gap:10px;background:#0b0f12;border-radius:12px;padding:10px}
.gf-dd{display:flex;flex-direction:column;align-items:center;justify-content:center;background:#111822;border-radius:10px}.gf-dd b{font-size:26px;color:#edeef0;font-variant-numeric:tabular-nums}.gf-dd small{font-size:11px;color:#a5aab2}
.gf-e3>div>b{font-size:14px;color:#edeef0;display:block}.gf-e3>div>small{font-size:11.5px;color:#a5aab2;display:block}.gf-rf{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;margin-top:4px}.gf-rf b{font-size:17px}.gf-rf b.gr{color:#edeef0}.gf-rf b.na{color:#a5aab2;font-size:14px}.gf-rf small{font-size:11px;color:#a5aab2}
.gf-bars{display:flex;flex-direction:column;gap:8px;margin-bottom:8px}.gf-b{display:grid;grid-template-columns:96px 1fr 48px;gap:8px;align-items:center;font-size:12px;color:#b4bac4}.gf-b b{font-size:13px;color:#edeef0;font-variant-numeric:tabular-nums;text-align:end}
.gf-bt{position:relative;height:10px;background:#1e252f;border-radius:5px;overflow:hidden}.gf-bf{height:100%;background:#a5aab2;border-radius:5px}.gf-bt u{position:absolute;top:0;bottom:0;width:2px;background:#edeef0}
`;
export const GOLD_SKIN3B = `
.gf-lk{display:flex;flex-wrap:wrap;align-items:center;gap:0 10px}
.gf-t3 .gf-w{grid-column:1/-1}
.gf-wb{display:flex;gap:6px}.gf-wb span{display:flex;flex-direction:column;align-items:center;background:#0b0f12;border-radius:8px;padding:4px 8px}.gf-wb i{font-style:normal;font-size:11px;color:#a5aab2}.gf-wb b{font-size:15px;color:#edeef0}
.gf-key.lv{flex-direction:column;gap:3px}.gf-key.lv b{color:#a5aab2;letter-spacing:1px;margin-inline-end:4px}
.gf-evs{display:flex;flex-direction:column;gap:8px}.gf-e3.s{align-items:center}.gf-e3.s .gf-dd{padding:6px 0}
.gf-t3.two{grid-template-columns:1fr 1fr}.gf-p{margin:6px 0}.gf-v1.sm{font-size:13px;text-align:start}.gf-n.na{border:0;color:#a5aab2}.gf-foot{padding:6px 2px}
`;

const F = (u: string, t: string) => <a href={u} target="_blank" rel="noreferrer">{t}</a>;
export function GoldFooter() { return <p className="gf-ex gf-foot">ده رأي الجهات، مش توقعنا.<br />بنحدث لما الجهة تنشر رقم جديد.<br />مش نصيحة، والقرار قرارك.</p>; }
// Rest of the gold tab: only dated, sourced numbers. No opinion lines, no backtests.
export function GoldFacts() {
  return <div className="gf">
    <section className="gd-card"><h3>الفايدة والدولار</h3>
      <div className="gf-t3">
        <span className="gf-w"><i>الفايدة الأمريكية</i><b dir="ltr">3.75–4.00%</b><em>{STAMP}</em></span>
        <span><i>العائد الحقيقي</i><b dir="ltr">2.79%</b><em>24 نوفمبر</em></span>
        <span><i>مؤشر الدولار</i><b dir="ltr">123.60</b><em>20 نوفمبر</em></span>
      </div>
      <p className="gf-e gf-lk"><span>الفايدة: رفع 16 سبتمبر</span>{F('https://www.federalreserve.gov/newsevents/pressreleases/monetary20260916a.htm', 'الفيدرالي')}<span>العائد الحقيقي</span>{F('https://fred.stlouisfed.org/series/DFII10', 'FRED DFII10')}<span>الدولار</span>{F('https://fred.stlouisfed.org/series/DTWEXBGS', 'FRED DTWEXBGS')}</p>
    </section>
    <section className="gd-card"><h3>شراء البنوك المركزية</h3>
      <div className="gf-bars">
        <div className="gf-b"><span>الربع التالت 2026</span><div className="gf-bt" dir="ltr"><div className="gf-bf" style={{ width: '100%' }} /></div><b dir="ltr">321</b></div>
        <div className="gf-b"><span>متوسط الربع في 5 سنين</span><div className="gf-bt" dir="ltr"><div className="gf-bf" style={{ width: (227 / 321 * 100) + '%' }} /></div><b dir="ltr">227</b></div>
      </div>
      <div className="gf-t3 two"><span><i>من أول السنة</i><b dir="ltr">675</b><em>طن، تقدير</em></span><span><i>المعلن منهم</i><b dir="ltr">120</b><em>طن، من الـ321</em></span></div>
      <p className="gf-e gf-lk"><span>بالطن، تقدير مجلس الذهب العالمي (يوليو لسبتمبر 2026)، والباقي غير معلن</span>{F('https://www.gold.org/goldhub/research/gold-demand-trends/gold-demand-trends-q3-2026/central-banks', 'WGC')}</p>
    </section>
    <details className="gd-more gd-card"><summary>المصادر</summary><ul className="gd-bl">
      <li>{F('https://www.goldprice.com/gold-price-today/2026-11-25', 'GoldPrice.com')}: القمة 5,405.00 (29 يناير) وأدنى إقفال 3,538.19 (20 نوفمبر)، إقفال يومي.</li>
      <li>{F('https://www.reuters.com/world/china/asia-gold-india-gold-premiums-decadal-high-china-demand-undeterred-by-price-rise-2026-01-30/', 'رويترز')}: أعلى سعر لحظي 5,594.82 (29 يناير).</li>
      <li>gold-api.com: السعر الفوري. CoinGecko (PAXG): خط 90 يوم. ExchangeRate-API: الدولار. OANDA عبر TradingView: الشارت.</li>
    </ul></details>
    <GoldFooter />
  </div>;
}
