import React from 'react';
import { PairBars, Num, Unavail, pct, Delta, Tip } from './SummaryBits';
import { T, tipFor } from './tips';
import './summary.css';
const LBL: Record<string, string> = { revenue: 'الإيراد', gross: 'مجمل الربح', operating: 'الربح التشغيلي', pretax: 'الربح قبل الضريبة', net_profit: 'صافي الربح', parent_profit: 'ربح مساهمي الأم', net_activity_revenue: 'إيراد النشاط الصافي', equity: 'حقوق الملكية', equity_parent: 'حقوق مساهمي الأم', cash: 'النقدية', operating_cash_flow: 'التدفق النقدي التشغيلي', eps_printed: 'ربح السهم المطبوع', eps_printed_post_bonus: 'ربح السهم المطبوع (بعد الأسهم المجانية)', eps_printed_pre_bonus: 'ربح السهم المطبوع (قبل الأسهم المجانية)', eps_computed: 'ربح السهم (حسابنا)', eps_computed_by_us: 'ربح السهم (حسابنا)' };
const PER: Record<string, string> = { '9M26': '9 شهور 2026', '9M25': '9 شهور 2025', '6M26': '6 شهور 2026', '6M25': '6 شهور 2025', FY26: 'سنة 2026', FY25: 'سنة 2025', '3M26': '3 شهور 2026', '3M25': '3 شهور 2025', Q1FY27: 'ربع 1 (2027)', Q1FY26: 'ربع 1 (2026)', M9_26: '9 شهور 2026', M9_25: '9 شهور 2025', '30_9_26': '30 سبتمبر 2026', '31_12_25': '31 ديسمبر 2025', '30_6_26': '30 يونيو 2026', '30_6_25': '30 يونيو 2025', '31_3_26': '31 مارس 2026', '31_8_26': '31 أغسطس 2026' };
const INC = ['revenue', 'net_activity_revenue', 'gross', 'operating', 'pretax', 'net_profit', 'parent_profit'];
const BAL = ['equity', 'equity_parent', 'cash', 'operating_cash_flow'];
const EPS = ['eps_printed', 'eps_printed_post_bonus', 'eps_printed_pre_bonus', 'eps_computed', 'eps_computed_by_us'];
const nums = (v: any) => (v && typeof v === 'object' ? Object.keys(v).filter(x => typeof v[x] === 'number') : []);

function Margin({ label, ft, key1 }: { label: string; ft: any; key1: string }) {
  const r = ft.revenue, x = ft[key1];
  const ks = nums(r).filter(q => typeof x?.[q] === 'number' && r[q]);
  if (ks.length < 1) return null;
  const max = Math.max(...ks.map(q => Math.abs(x[q] / r[q] * 100)), 1);
  return <div className="sm-pair"><div className="sm-ph"><b>{label} ÷ الإيراد</b>{ks.length > 1 && <Delta p={(x[ks[0]] / r[ks[0]] - x[ks[1]] / r[ks[1]]) * 100} suf=" نقطة" />}</div>
    {ks.map((q, i) => { const m = x[q] / r[q] * 100; return <div className="sm-br" key={q}><span className="sm-pl">{PER[q] || q}</span><u><i className={i ? 'gr' : 'gr2'} style={{ width: Math.max(2, Math.abs(m) / max * 100) + '%' }} /></u><bdi dir="ltr" className="sm-n">{m.toFixed(1)}%</bdi></div>; })}
    {ks.length > 1 && <small className="sm-u">الفرق بنقاط مئوية. نسبة محسوبة من أرقام القوائم.</small>}
    <Tip t={T.margin(ks.length > 1 ? (x[ks[0]] / r[ks[0]] - x[ks[1]] / r[ks[1]]) * 100 : null)} /></div>;
}

export function FinancialTab({ p }: { p: any }) {
  const ft = p.financial_tab;
  if (!ft) return null;
  const present = (keys: string[]) => keys.filter(x => ft[x] != null);
  const strs = Object.keys(ft).filter(x => typeof ft[x] === 'string' && x !== 'unit_ar');
  const rk = nums(ft.revenue); const revG = rk.length >= 2 ? pct(ft.revenue[rk[0]], ft.revenue[rk[1]]) : null;
  const pairBlock = (keys: string[]) => present(keys).map(x => {
    const v = ft[x]; const ks = nums(v);
    if (typeof v !== 'object' || !ks.length) return null;
    if (ks.length >= 2) return <PairBars key={x} label={LBL[x] || x} a={v[ks[0]]} b={v[ks[1]]} la={PER[ks[0]] || ks[0]} lb={PER[ks[1]] || ks[1]} tip={tipFor(x, pct(v[ks[0]], v[ks[1]]), revG)} />;
    return <div className="sm-pair" key={x}><div className="sm-ph"><b>{LBL[x] || x}</b><span className="sm-gv"><Num v={v[ks[0]]} /></span></div><small className="sm-u">{PER[ks[0]] || ks[0]} · الفترة المقابلة غير متوفرة في القوائم</small><Tip t={tipFor(x, null, null)} /></div>;
  });
  const bankish = nums(ft.revenue).some(q => typeof ft.pretax?.[q] === 'number' && ft.revenue[q] && ft.pretax[q] / ft.revenue[q] > 0.6);
  const epsRows = present(EPS).filter(x => typeof ft[x] === 'number' || nums(ft[x]).length);
  return <div className="sm">
    <div className="sm-sec">الأرباح <small>({ft.unit_ar || ''})</small></div>
    <div className="sm-card">{pairBlock(INC)}</div>
    {ft.revenue && bankish && <div className="sm-card sm-miss"><div className="sm-un"><span>غير متوفر</span><p>الهوامش مش معروضة: الربح قبل الضريبة أكتر من 60% من الإيراد، وغالبًا الإيراد هنا مش مبيعات، فالمقارنة بين الشركات مضللة.</p></div></div>}
    {ft.revenue && !bankish && <><div className="sm-sec">الهوامش</div>
      <div className="sm-card"><Margin label="مجمل الربح" ft={ft} key1="gross" /><Margin label="الربح قبل الضريبة" ft={ft} key1="pretax" /><Margin label="ربح مساهمي الأم" ft={ft} key1="parent_profit" /><Margin label="صافي الربح" ft={ft} key1="net_profit" /></div></>}
    {present(BAL).some(x => typeof ft[x] === 'object') && <><div className="sm-sec">الميزانية والنقدية</div><div className="sm-card">{pairBlock(BAL)}</div></>}
    {epsRows.length > 0 && <><div className="sm-sec">ربح السهم (جنيه)</div><div className="sm-card sm-chips">{epsRows.map(x => { const v = ft[x]; return typeof v === 'number' ? <div className="sm-chip" key={x}><small>{LBL[x] || x}</small><Num v={v} /></div> : nums(v).map(q => <div className="sm-chip" key={x + q}><small>{LBL[x] || x} · {PER[q] || q}</small><Num v={v[q]} /></div>); })}<Tip t={T.eps} /></div></>}
    {strs.length > 0 && <div className="sm-card sm-miss">{strs.map(x => <div className="sm-un" key={x}><span>غير متوفر</span><p><b>{LBL[x] || x}: </b>{String(ft[x]).replace(/^غير متوفر[:،]?\s*/, '')}</p></div>)}<Tip t={T.miss} /></div>}
    {p.statements_line_date_ar ? <p className="sm-u2">{p.statements_line_date_ar}</p> : null}
    {p.cash_assets_line_ar ? <p className="sm-u2">• {p.cash_assets_line_ar}</p> : null}
    {p.financial_tab_bills_ar ? <p className="sm-u2">• {p.financial_tab_bills_ar}</p> : null}
  </div>;
}
