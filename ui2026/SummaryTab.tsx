import React from 'react';
import { PairBars, Gauge, Num, Unavail, nf, pct, Delta, Tip } from './SummaryBits';
import { T, tipFor } from './tips';
import './summary.css';

const NUMRE = /([+\-−]?[\d][\d,]*(?:\.\d+)?%?)/g;
// Wrap each number in an LTR bold span; text itself is unchanged.
const Hi = ({ t }: { t: string }) => <>{String(t).split(NUMRE).map((x, i) => i % 2 ? <bdi key={i} dir="ltr" className="sm-hi">{x}</bdi> : x)}</>;
const UNAV = /غير متوفر/;

function splitSentences(t: string): string[] {
  return String(t).split(/(?<=[.؟])\s+/).map(x => x.trim()).filter(Boolean);
}

export function SummaryTab({ s, k, p, legacy }: { s: any; k: string; p: any; legacy?: React.ReactNode }) {
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
  const ff = /الأسهم حرة التداول\s*([\d.]+)%/.exec(p.liquidity_ar || '');
  const miss = splitSentences(p.missing_ar || '');
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
        {d.up.length > 0 && <div className="sm-grp up"><div className="sm-gh"><span className="sm-b up">▲ إيجابي · <bdi dir="ltr">{d.up.length}</bdi></span></div>{d.up.map((t: string, i: number) => <p key={i}><Hi t={t} /></p>)}<Tip t={T.up} /></div>}
        {d.down.length > 0 && <div className="sm-grp dn"><div className="sm-gh"><span className="sm-b dn">▼ محتاج انتباه · <bdi dir="ltr">{d.down.length}</bdi></span></div>{d.down.map((t: string, i: number) => <p key={i}><Hi t={t} /></p>)}<Tip t={T.down} /></div>}
        {d.flip && <div className="sm-grp gr"><div className="sm-gh"><span className="sm-b gr">⇄ اللي يغير الصورة</span></div><p><Hi t={d.flip} /></p><Tip t={T.flip} /></div>}
      </div></>}
    {earn.length > 0 && <><div className="sm-sec">مقارنة الفترتين</div>
      <div className="sm-card">{earn.map(e => <PairBars key={e.label} label={e.label} a={e.a} b={e.b} la={PER[e.ka] || e.ka} lb={PER[e.kb] || e.kb} tip={tipFor(e.key, pct(e.a, e.b), revG)} />)}{ft.unit_ar && <small className="sm-u">بال{ft.unit_ar}</small>}</div></>}
    {eps.length > 0 && <><div className="sm-sec">ربح السهم (جنيه)</div>
      <div className="sm-card">{eps.map((e, i) => <div key={i} className="sm-eps"><div className="sm-br"><u><i className={i === 0 ? 'up' : 'gr2'} style={{ width: Math.max(2, e.value / (epsMax || 1) * 100) + '%' }} /></u><Num v={e.value} /></div><small className="sm-u">{e.label}</small></div>)}
        <small className="sm-u">الأعمدة أرقام القوائم أو حسابنا للمقارنة بس، مش توقع.</small><Tip t={T.eps} /></div></>}
    {miss.length > 0 && <><div className="sm-sec">لسه ناقص</div>
      <div className="sm-card sm-miss">{miss.map((t, i) => <div key={i} className="sm-un"><span>{UNAV.test(t) ? 'غير متوفر' : 'ملاحظة'}</span><p><Hi t={t.replace(/^غير متوفر[:،]?\s*/, '')} /></p></div>)}<Tip t={T.miss} /></div></>}
    <details className="sm-q"><summary>اسأل نفسك قبل أي قرار<small>ثلاث أسئلة: المدة، التذبذب، القطاع</small></summary>
      <div className="sm-qs">
        <div className="sm-qc"><b>المدة</b><p>هتتابع السهم كام يوم أو أسبوع؟ الشارت مبني على أيام وأسابيع.</p></div>
        <div className="sm-qc"><b>التذبذب</b><p>أقصى تذبذب تقدر تستحمله في السهم ده كام %؟ قارنه بالتذبذب اليومي فوق.</p></div>
        <div className="sm-qc"><b>القطاع</b><p>السهم ده بيخلي أغلب فلوسك في نفس القطاع؟ فكر في الأسهم اللي عندك من نفس القطاع.</p></div>
      </div><Tip t={T.q} /></details>
    {legacy ? <details className="sm-full"><summary>الشرح بالنص الكامل</summary>{legacy}</details> : null}
  </div>;
}
