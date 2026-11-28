import React from 'react';
import { PairBars, Gauge, Num, Unavail, nf, pct, Delta, Tip } from './SummaryBits';
import { T, tipFor } from './tips';
import './summary.css';

const NUMRE = /([+\-−]?[\d][\d,]*(?:\.\d+)?%?)/g;
// Wrap each number in an LTR bold span; text itself is unchanged.
const Hi = ({ t }: { t: string }) => <>{String(t).split(NUMRE).map((x, i) => i % 2 ? <bdi key={i} dir="ltr" className="sm-hi">{x}</bdi> : x)}</>;
const UNAV = /غير متوفر/;
// EPS bars always show at least 2 decimals (1.00, not 1) and up to 4 for tiny values.
// One decimal count per card: the most any value in the card needs (min 2, max 4), so 0.0061 and 0.006 both show 4 decimals.
const epsDec = (vs: number[]) => Math.max(2, ...vs.map(v => { for (let d = 2; d < 4; d++) if (Math.abs(+v.toFixed(d) - v) < 1e-9) return d; return 4; }));
const epsFmt = (v: number, d = 2) => v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
// Two EPS labels said "full year" for a figure that is not (BONY: the source does not state the period of 219, the bar assumes 9 months x 4/3 = 292; UNIP: 15.6 is 9 months). Fixed here until the page data is corrected.
const FIXLBL: [string, string][] = [
  ['الربح المتكرر حسب تعريف الشركة 219 مليون لسنة كاملة على', 'الربح المتكرر حسب تعريف الشركة 219 مليون (المصدر مش بيذكر الفترة، فافترضنا 9 شهور وحوّلناها لسنة كاملة بضرب 4 على 3 = 292 مليون) على'],
  ['ربح 9 شهور من غير مكسب بيع الأصول لسنة كاملة 15.6 مليون', 'ربح 9 شهور من غير مكسب بيع الأصول (9 شهور بس، مش محوّل لسنة كاملة) 15.6 مليون'],
];
const fixLbl = (t: string) => FIXLBL.reduce((a, [x, y]) => a.split(x).join(y), String(t));
// A percent written in the text next to a pair label must equal the badge computed from the same two numbers.
const PCTLBL: Record<string, string[]> = { revenue: ['الإيراد'], pretax: ['الربح قبل الضريبة'], parent_profit: ['ربح مساهمي الأم', 'ربح الأم'], net_profit: ['صافي الربح'] };
const reconcile = (t: string, earn: any[]) => earn.reduce((a: string, e: any) => { const c = pct(e.a, e.b); if (c == null) return a; return (PCTLBL[e.key] || []).reduce((z: string, l: string) => z.replace(new RegExp('(' + l + '\\s*)([+\\-−]?\\d+(?:\\.\\d+)?)%', 'g'), (m: string, pre: string, num: string) => Math.abs(parseFloat(num.replace('−', '-')) - c) <= 0.15 ? pre + (c > 0 ? '+' : '') + c.toFixed(1) + '%' : m), a); }, String(t));

function splitSentences(t: string): string[] {
  return String(t).split(/(?<=[.؟])\s+/).map(x => x.trim()).filter(Boolean);
}

type CovRow = { src: string; txt: string; when: string };
// The news/disclosure search line, rewritten so it only says what that search covered and never denies the targets shown above it.
function newsLine(line: string, cov: CovRow[] = []): string {
  const provs = Array.from(new Set(cov.map(r => String(r.src || '').trim()).filter(Boolean)));
  const dm = /لحد (\d{1,2} \S+ \d{4})/.exec(line);
  if (/فيه رأي منشور/.test(line)) {
    const m = /\(([^)]+)\)/.exec(line);
    return 'في الأخبار والإفصاحات بس: فيه رأي منشور من جهة تانية' + (m ? ' (' + m[1] + ')' : '') + '، وأرقامه ما نقلناهاش هنا. ' + (provs.length ? 'الأهداف اللي فوق من ' + provs.join(' و') + '.' : 'الأهداف اللي فوق من المصادر المكتوبة جنب كل سطر.');
  }
  return 'في الأخبار والإفصاحات' + (dm ? ' (لحد ' + dm[1] + ')' : '') + ' ما لقيناش رأي منشور. ده عن الأخبار والإفصاحات بس، مش عن الأهداف اللي فوق.';
}

export function SummaryTab({ s, k, p, legacy, cov }: { s: any; k: string; p: any; legacy?: React.ReactNode; cov?: CovRow[] }) {
  if (s && s.nohist) return <div className="sm"><div className="sm-card sm-miss"><Unavail>مفيش تاريخ أسعار كفاية عند المصدر (أقل من 60 جلسة)، فالمؤشرات والتغيرات مش معروضة.</Unavail></div></div>;
  const d = p.dec_ar || { up: [], down: [], flip: '' };
  const pl = s.plan || {};
  const hi = s.hi52, lo = s.lo52, c = s.close;
  const fromHi = hi ? (c / hi - 1) * 100 : null;
  const pos = hi && lo && hi > lo ? Math.min(100, Math.max(0, (c - lo) / (hi - lo) * 100)) : null;
  const ft = p.financial_tab || {};
  const pair = (key: string, label: string) => { const v = ft[key]; if (!v || typeof v !== 'object') return null; const ks = Object.keys(v).filter(x => typeof v[x] === 'number'); return ks.length >= 2 ? { key, label, a: v[ks[0]], b: v[ks[1]], ka: ks[0], kb: ks[1] } : null; };
  const PER: Record<string, string> = { '9M26': '9 شهور 2026', '9M25': '9 شهور 2025', '6M26': '6 شهور 2026', '6M25': '6 شهور 2025', FY26: 'سنة 2026', FY25: 'سنة 2025', '3M26': '3 شهور 2026', '3M25': '3 شهور 2025', Q1FY27: 'ربع 1', Q1FY26: 'ربع 1 سابق', M9_26: '9 شهور 2026', M9_25: '9 شهور 2025' };
  const earn = [pair('revenue', 'الإيراد'), pair('pretax', 'الربح قبل الضريبة'), pair('parent_profit', 'ربح مساهمي الأم'), pair('net_profit', 'صافي الربح')].filter(Boolean) as any[];
  const revG = earn.length && earn[0].key === 'revenue' ? pct(earn[0].a, earn[0].b) : null;
  const eps: any[] = Array.isArray(p.eps_table_ar) ? p.eps_table_ar.filter((e: any) => typeof e.value === 'number') : [];
  const epsMax = Math.max(0, ...eps.map(e => e.value));
  const epsD = epsDec(eps.map(e => e.value));
  const ff = /الأسهم حرة التداول\s*([\d.]+)%/.exec(p.liquidity_ar || '');
  const hasCov = !!cov && cov.length > 0;
  const covLine = String(p.external_coverage_line_ar || '');
  const allMiss = splitSentences(p.missing_ar || '');
  const noCardLine = !hasCov ? (allMiss.find(t => /^آراء منشورة/.test(t)) || null) : null;
  const miss = allMiss.filter(t => !((hasCov || noCardLine) && (/^آراء منشورة/.test(t) || (hasCov && /^ما لقيناش رأي تاني/.test(t)))));
  const bar = (up: boolean) => up ? 'up' : 'dn';
  return <div className="sm">
    <div className="sm-card">
      <div className="sm-ph"><b>السعر</b><span className="sm-gv"><Num v={c} /> جنيه</span></div>
      {pos != null && <div className="sm-range"><span><Num v={lo} /></span><div className="sm-rt"><em style={{ insetInlineStart: pos + '%' }} /></div><span><Num v={hi} /></span></div>}
      <small className="sm-u">مدى 52 أسبوع (أقل إقفال → أعلى إقفال){fromHi != null && <> · عن أعلى إقفال في سنة <Delta p={fromHi} /></>}</small>
    <Tip t={T.range(pos)} /></div>
    <div className="sm-sec">مؤشرات التداول</div>
    <div className="sm-card sm-2">
      {pl.tv != null && <Gauge label="السيولة اليومية" value={pl.tv} min={0.5} max={1000} log text={<><Num v={pl.tv} d={1} /> م.ج</>} tick={5} tickLabel="5" tone={pl.tv < 5 ? 'dn' : undefined} tip={T.liquidity(pl.tv)} note={pl.tv < 5 ? 'أقل من 5 مليون في اليوم: ضعيفة' : 'وسيط قيمة التداول في 60 جلسة (مقياس لوغاريتمي)'} />}
      {pl.atrpct != null && <Gauge label="التذبذب اليومي" value={pl.atrpct} min={0} max={10} text={<Num v={pl.atrpct} d={1} suf="%" />} note="متوسط حركة 14 جلسة من السعر، مش خسارة متوقعة" tip={T.vol(pl.atrpct)} />}
      {ff && <Gauge label="أسهم حرة التداول" value={parseFloat(ff[1])} min={0} max={100} text={<Num v={parseFloat(ff[1])} d={1} suf="%" />} tick={15} tickLabel="15" note="العلامة عند 15%" tip={T.float(parseFloat(ff[1]))} />}
    </div>
    {(d.up.length > 0 || d.down.length > 0) && <><div className="sm-sec">إيه اللي في الأرقام</div>
      <div className="sm-card">
        {d.up.length > 0 && <div className="sm-grp up"><div className="sm-gh"><span className="sm-b up">▲ إيجابي · <bdi dir="ltr">{d.up.length}</bdi></span></div>{d.up.map((t: string, i: number) => <p key={i}><Hi t={reconcile(t, earn)} /></p>)}<Tip t={T.up} /></div>}
        {d.down.length > 0 && <div className="sm-grp dn"><div className="sm-gh"><span className="sm-b dn">▼ محتاج انتباه · <bdi dir="ltr">{d.down.length}</bdi></span></div>{d.down.map((t: string, i: number) => <p key={i}><Hi t={reconcile(t, earn)} /></p>)}<Tip t={T.down} /></div>}
        {d.flip && <div className="sm-grp gr"><div className="sm-gh"><span className="sm-b gr">⇄ اللي يغير الصورة</span></div><p><Hi t={reconcile(d.flip, earn)} /></p><Tip t={T.flip} /></div>}
      </div></>}
    {earn.length > 0 && <><div className="sm-sec">مقارنة الفترتين</div>
      <div className="sm-card">{earn.map(e => <PairBars key={e.label} label={e.label} a={e.a} b={e.b} la={PER[e.ka] || e.ka} lb={PER[e.kb] || e.kb} tip={tipFor(e.key, pct(e.a, e.b), revG)} />)}{ft.unit_ar && <small className="sm-u">بال{ft.unit_ar}</small>}</div></>}
    {eps.length > 0 && <><div className="sm-sec">ربح السهم (جنيه)</div>
      <div className="sm-card">{eps.map((e, i) => <div key={i} className="sm-eps"><div className="sm-br"><u><i className={i === 0 ? 'up' : 'gr2'} style={{ width: Math.max(2, e.value / (epsMax || 1) * 100) + '%' }} /></u><bdi dir="ltr" className="sm-n">{epsFmt(e.value, epsD)}</bdi></div><small className="sm-u">{fixLbl(e.label)}</small></div>)}
        <small className="sm-u">الأعمدة أرقام القوائم أو حسابنا للمقارنة بس، مش توقع.</small><Tip t={T.eps} /></div></>}
    {(hasCov || noCardLine) && <><div className="sm-sec">آراء الجهات الخارجية</div>
      <div className="sm-card sm-cov">{hasCov ? cov!.map((r, i) => { const short = r.txt.replace(/[.،]?\s*دي آراء الجهات دي مش رأي التطبيق ومش توصية\.?$/, ''); return <div key={i} className="sm-cv"><b>{r.src}</b><p><Hi t={short} /></p><small>{r.when} · مش توصية</small></div>; }) : <div className="sm-un"><span>غير متوفر</span><p><Hi t={noCardLine!.replace(/^آراء منشورة:?\s*/, '').replace(/^غير متوفر[:،]?\s*/, '')} /></p></div>}
        {hasCov && <p className="sm-cvn"><Hi t={covLine ? newsLine(covLine, cov || []) : 'الأهداف دي من المصادر المكتوبة جنب كل سطر، مش من الأخبار والإفصاحات.'} /></p>}
        {hasCov && <small className="sm-u sm-nr">مش رأي التطبيق ومش توصية.</small>}</div></>}
    {miss.length > 0 && <><div className="sm-sec">لسه ناقص</div>
      <div className="sm-card sm-miss">{miss.slice(0, 2).map((t, i) => <div key={i} className="sm-un"><span>{UNAV.test(t) || /^وأسماء الإدارة/.test(t) ? 'غير متوفر' : 'ملاحظة'}</span><p><Hi t={t.replace(/^وأسماء الإدارة/, 'أسماء الإدارة').replace(/^غير متوفر[:،]?\s*/, '') + (/^آراء منشورة:\s*فيه رأي/.test(t) && t.indexOf('مش رأي التطبيق') < 0 ? ' ودي مش رأي التطبيق ومش توصية.' : '')} /></p></div>)}{miss.length > 2 && <details className="sm-tip sm-tipd"><summary>باقي الناقص <bdi dir="ltr">({miss.length - 2})</bdi></summary>{miss.slice(2).map((t, i) => <div key={i} className="sm-un"><span>{UNAV.test(t) || /^وأسماء الإدارة/.test(t) ? 'غير متوفر' : 'ملاحظة'}</span><p><Hi t={t.replace(/^وأسماء الإدارة/, 'أسماء الإدارة').replace(/^غير متوفر[:،]?\s*/, '') + (/^آراء منشورة:\s*فيه رأي/.test(t) && t.indexOf('مش رأي التطبيق') < 0 ? ' ودي مش رأي التطبيق ومش توصية.' : '')} /></p></div>)}</details>}<Tip t={T.miss} /></div></>}
    <details className="sm-q"><summary>اسأل نفسك قبل أي قرار<small>ثلاث أسئلة: المدة، التذبذب، القطاع</small></summary>
      <div className="sm-qs">
        <div className="sm-qc"><b>المدة</b><p>هتتابع السهم كام يوم أو أسبوع؟ الشارت مبني على أيام وأسابيع.</p></div>
        <div className="sm-qc"><b>التذبذب</b><p>أقصى تذبذب تقدر تستحمله في السهم ده كام %؟ قارنه بالتذبذب اليومي فوق.</p></div>
        <div className="sm-qc"><b>القطاع</b><p>السهم ده بيخلي أغلب فلوسك في نفس القطاع؟ فكر في الأسهم اللي عندك من نفس القطاع.</p></div>
      </div><Tip t={T.q} /></details>
    {legacy ? <details className="sm-full"><summary>الشرح بالنص الكامل<small>تفاصيل الأرقام والمصادر (آراء الجهات الخارجية ظاهرة فوق)</small></summary>{legacy}</details> : null}
  </div>;
}
