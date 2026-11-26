import React from 'react';
import { PVN, NEW, pageOf } from './page';
const LBL: Record<string, string> = { revenue: 'الإيراد', gross: 'مجمل الربح', operating: 'الربح التشغيلي', pretax: 'الربح قبل الضريبة', parent_profit: 'ربح مساهمي الشركة الأم', eps_printed_post_bonus: 'ربح السهم المطبوع (بعد الأسهم المجانية)', eps_printed_pre_bonus: 'ربح السهم المطبوع (قبل الأسهم المجانية)', equity_parent: 'حقوق مساهمي الأم', cash: 'النقدية', operating_cash_flow: 'التدفق النقدي التشغيلي' };
const PER: Record<string, string> = { '9M26': '9 شهور 2026', '9M25': '9 شهور 2025', '30_9_26': '30 سبتمبر 2026', '31_12_25': '31 ديسمبر 2025' };
const fmt = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 2 });
export function FinTabBlock({ k }: { k: string }) {
  const p = pageOf(k);
  if (PVN() && NEW(k) && p && p.fin_items_ar) return p.financial_tab && p.financial_tab_bills_ar ? <p className="gd-foot">{p.financial_tab_bills_ar}</p> : null;
  if (!(PVN() && NEW(k) && p && p.financial_tab)) return null;
  const ft = p.financial_tab;
  return <div className="gd-it mid"><div className="gd-h"><span>أرقام القوائم{ft.unit_ar ? ' (' + ft.unit_ar + ')' : ''}</span></div>
    {Object.keys(LBL).filter(x => ft[x] != null).map(x => { const v = ft[x]; return typeof v === 'string' ? <p key={x}>• {LBL[x]}: {v}</p> : <p key={x}>• {LBL[x]}: {Object.keys(v).map((q, i) => <span key={q}>{i ? ' مقابل ' : ''}<bdi dir="ltr">{fmt(v[q])}</bdi> ({PER[q] || q})</span>)}</p>; })}
    {p.statements_line_date_ar ? <p><small>{p.statements_line_date_ar}</small></p> : null}
    {p.cash_assets_line_ar ? <p>• {p.cash_assets_line_ar}</p> : null}
    {p.financial_tab_bills_ar ? <p>• {p.financial_tab_bills_ar}</p> : null}
  </div>;
}
