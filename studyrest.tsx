import React, { useEffect, useState } from 'react';
import { hasFile } from './ui2026/FileIndex';

// Financial studies for stocks outside the bundled reviewed set. Data-only: studies_rest/<CODE>.json is written by the content agent.
// Every study carries its own honesty status line; nothing here adds numbers or opinions.
const cache: Record<string, Promise<any>> = {};
const load = (code: string) => cache[code] || (cache[code] = hasFile('studies', code).then(h => (h ? fetch('studies_rest/studies_rest/' + code + '.json?t=' + Math.floor(Date.now() / 300000), { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).catch(() => null) : null)));
export function useStudy(code: string) {
  const [st, setSt] = useState<any>(null);
  useEffect(() => { let on = true; setSt(null); load(code).then(x => { if (on && x && x.record) setSt(x); }); return () => { on = false; }; }, [code]);
  return st;
}
const L = ({ children }: { children: React.ReactNode }) => <bdi dir="ltr">{children}</bdi>;
const num = (v: any) => (typeof v === 'number' ? v.toLocaleString('en-US', { maximumFractionDigits: 3 }) : String(v));
const Src = ({ list }: { list?: string[] }) => list && list.length ? <ul className="st-src">{list.map((u, i) => <li key={i}><a href={u} target="_blank" rel="noreferrer">{'مصدر ' + (i + 1)}</a></li>)}</ul> : null;

export function StudyFin({ st }: { st: any }) {
  const r = st.record || {}; const b = st.bullets || {};
  const g = r.prior ? (r.revenue / r.prior - 1) * 100 : null;
  return <div className="st">
    <p className="eg-note"><b>{st.status}</b> · {st.period}</p>
    <p className="gd-sum">{r.tag}</p>
    {Number.isFinite(r.revenue) ? <div className="eg-grid2">
      <div className="eg-m"><span>الإيراد</span><b dir="ltr">{num(r.revenue)}</b><i>مليون{r.prior ? ' · قبلها ' + num(r.prior) + (g != null ? ' (' + (g >= 0 ? '+' : '') + g.toFixed(1) + '%)' : '') : ''}</i></div>
      <div className="eg-m"><span>ربح المساهمين</span><b dir="ltr">{num(r.profit)}</b><i>مليون{r.profit_prior ? ' · قبلها ' + num(r.profit_prior) : ''}</i></div>
    </div> : null}
    {b.up && b.up.length ? <><h4 className="eg-h4">نقاط إيجابية في الأرقام</h4><ul>{b.up.map((x: string, i: number) => <li key={i}>{x}</li>)}</ul></> : null}
    {b.down && b.down.length ? <><h4 className="eg-h4">نقاط محتاجة انتباه</h4><ul>{b.down.map((x: string, i: number) => <li key={i}>{x}</li>)}</ul></> : null}
    {b.flip ? <><h4 className="eg-h4">إيه اللي يغير الصورة</h4><p>{b.flip}</p></> : null}
    <details className="gd-det"><summary>التفاصيل</summary>
      {(r.facts || []).map((x: any[], i: number) => <div className="gd-it" key={i}><div className="gd-h"><span>{x[0]}</span><b dir="ltr">{num(x[1])} {x[2]}</b></div>{x[3] ? <p>{x[3]}</p> : null}</div>)}
      {r.risk ? <div className="gd-it no"><div className="gd-h"><span>المخاطر</span></div><p>{r.risk}</p></div> : null}
      {r.change ? <div className="gd-it mid"><div className="gd-h"><span>تابع إيه</span></div><p>{r.change}</p></div> : null}
      {r.method ? <div className="gd-it mid"><div className="gd-h"><span>طريقة القراءة</span></div><p>{r.method}</p></div> : null}
      {r.missing ? <div className="gd-it no"><div className="gd-h"><span>غير متوفر</span></div><p>{r.missing}</p></div> : null}
      {r.note ? <p className="gd-foot">{r.note}</p> : null}
      {st.caveats ? <p className="gd-foot">تنبيه: {st.caveats}</p> : null}
      {r.pages ? <p className="gd-foot">{r.pages}</p> : null}
      <Src list={st.sources} />
    </details>
  </div>;
}

const FACT_AR: Record<string, string> = { bvps: 'القيمة الدفترية للسهم', bvps_calc: 'طريقة حسابها', pb_at_feed_price: 'السعر على القيمة الدفترية (بسعر Starta Markets)', pe_annualised_at_feed_price: 'مضاعف الربحية المبسط (بسعر Starta Markets)', price_feed: 'السعر في Starta Markets', price_note: 'ملاحظة السعر', shares: 'عدد الأسهم', par: 'القيمة الاسمية' };
const factLabel = (k: string) => FACT_AR[k] || (/^eps_/.test(k) ? 'ربح السهم (' + k.replace(/^eps_/, '').replace(/_/g, ' ') + ')' : k.replace(/_/g, ' '));
export function StudyFair({ st }: { st: any }) {
  const fv = st.fair_value || {}; const fo = fv.facts_only || {}; const rg = Array.isArray(fv.range) && fv.range.length === 3 ? fv.range : null;
  const mm = fv.multiples || [];
  const fx = (x: number) => (x >= 10 ? x.toFixed(2) : x.toFixed(2));
  if (rg) return <div className="gd-fv"><h4>{fv.status}، تقدير تجريبي منا · الثقة {fv.confidence}</h4>
    <p className="gd-sum">{fv.text}<small>{fv.label}{fv.price_at_check != null ? ' · السعر وقت الفحص ' + fv.price_at_check + ' (' + (fv.price_note || '') + ')' : ''}</small></p>
    <div className="gd-rng">{rg.map((v: number, i: number) => <div key={i}><small>{['حذر', 'أساسي', 'متفائل'][i]}{mm[i] ? ' · ' + mm[i] + ' مرة' : ''}</small><b dir="ltr">{fx(v)}</b></div>)}</div>
    <details className="gd-det"><summary>التفاصيل</summary>
      {fv.basis ? <p className="gd-foot">الأساس: {fv.basis}</p> : null}
      {fv.eps_calc ? <p className="gd-foot">ربح السهم السنوي المبسط {fv.eps_annualised}: {fv.eps_calc}</p> : null}
      {fv.pb_cross_check ? <p className="gd-foot">فحص القيمة الدفترية: قيمة دفترية للسهم {fv.pb_cross_check.bvps}، عائد على حقوق الملكية سنوي {fv.pb_cross_check.roe_annualised_pct}%، والقيمة الناتجة حوالي {fv.pb_cross_check.value}.</p> : null}
      {fv.changes_it ? <p className="gd-foot">اللي يغيّره: {fv.changes_it}</p> : null}
      {Object.keys(fo).map(k => <p className="gd-foot" key={k}>{factLabel(k)}: <bdi dir="ltr">{typeof fo[k] === 'number' ? num(fo[k]) : String(fo[k])}</bdi></p>)}
    </details></div>;
  return <div className="st">
    <p className="gd-sum">غير متوفر<small>{fv.reason || ''}{fv.label ? ' · ' + fv.label : ''}</small></p>
    {Object.keys(fo).length ? <details className="gd-det"><summary>أرقام الأساس (من غير نطاق)</summary>
      {Object.keys(fo).map(k => <div className="gd-it" key={k}><div className="gd-h"><span>{factLabel(k)}</span><b dir="ltr">{typeof fo[k] === 'number' ? num(fo[k]) : ''}</b></div>{typeof fo[k] === 'number' ? null : <p>{String(fo[k])}</p>}</div>)}
    </details> : null}
  </div>;
}
export function StudyLight({ st }: { st: any }) {
  return <details className="eg-ex"><summary>الأداء المالي · قراءة من القوائم، مش مراجَعة</summary><div className="eg-exb"><StudyFin st={st} /></div></details>;
}
export function StudyLightFair({ st }: { st: any }) {
  return <details className="eg-ex"><summary>تقدير الدراسة · {st.fair_value && st.fair_value.status}</summary><div className="eg-exb"><StudyFair st={st} /></div></details>;
}
