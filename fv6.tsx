import React, { useEffect, useState } from 'react';

// Sourced fair price and experimental targets for the six holdings. Data-only: studies_rest/studies_rest/fair_value_sourced_six.json is written by the content agent. Market data only.
export const SIX = ['MASR', 'BONY', 'HRHO', 'UNIP', 'PHAR', 'ORHD'];
let cache: Promise<any> | null = null;
const load = () => cache || (cache = fetch('studies_rest/studies_rest/fair_value_sourced_six.json?t=' + Math.floor(Date.now() / 300000), { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).catch(() => null));
const fx = (v: number) => '\u2066' + (v >= 1 ? v.toFixed(2) : v.toFixed(3)) + '\u2069';
const CSS = `
.fv6 .q{margin:10px 0 2px;display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:16px;font-weight:700;color:#5eead4}
.fv6 .tg{font-size:11.5px;font-weight:400;border:1px solid #6b5b2a;color:#f5c26b;border-radius:10px;padding:2px 8px;white-space:nowrap}
.fv6 .big{font-size:24px;font-weight:700;color:#fff;margin:2px 0}
.fv6 .ex{font-size:13px;line-height:1.8;color:#b6c0d2;margin:2px 0 6px}
.fv6 .mm{background:#0a0e17;border:1px solid #1b2538;border-radius:10px;padding:9px;margin:8px 0;font-size:13px;line-height:1.8;color:#d5dbe7}
.fv6 .mm h5{margin:0 0 4px;font-size:14px;color:#fff}
.fv6 .vv{display:flex;gap:6px;margin:4px 0}.fv6 .vv div{flex:1;background:#101827;border-radius:8px;text-align:center;padding:4px 2px}
.fv6 .vv small{display:block;color:#8b97ad;font-size:11px}.fv6 .vv b{color:#fff}
.fv6 .src{color:#9fb0c9}.fv6 .src a{color:#7dd3fc;word-break:break-all}.fv6 .ours{color:#f5c26b}
.fv6 .na{color:#9aa6bb;font-size:12.5px;line-height:1.8;margin:4px 0}
.fv6 .an{border-top:1px dashed #2a3650;margin-top:8px;padding-top:6px;font-size:13px;color:#d5dbe7}
.fv6 hr{border:0;border-top:1px solid #263249;margin:12px 0}
.fv6 .nt{font-size:12px;color:#8b97ad;line-height:1.7;margin:6px 0}
`;
const A = ({ u }: { u: string }) => <a href={u} target="_blank" rel="noreferrer">{u.replace('https://', '').slice(0, 60)}</a>;
const Fold = ({ t, children }: { t: string; children: React.ReactNode }) => <details className="gd-det"><summary>{t}</summary>{children}</details>;

export function SourcedFair({ k }: { k: string }) {
  const [d, setD] = useState<any>(undefined);
  useEffect(() => { let on = true; load().then(x => on && setD(x)); return () => { on = false; }; }, []);
  if (d === undefined) return <p className="gd-sum">بحمّل...</p>;
  const s = d && d.stocks && d.stocks[k];
  if (!s) return <p className="gd-sum">غير متوفر: مقدرتش أحمّل بيانات السعر العادل والمستهدف دلوقتي. جرب تاني بعد شوية.</p>;
  const a = s.aggregate, ts: any[] = s.targets_experimental || [], an = s.analyst_reference || {};
  const vs = ts.map(t => t.value);
  const day = (d.as_of === '2026-11-25' ? '25 نوفمبر 2026' : d.as_of);
  return <div className="gd-fv fv6"><style>{CSS}</style>
    <div className="q"><span>السعر العادل</span><span className="tg">تقديري · {day}</span></div>
    <div className="big"><bdi dir="ltr">{fx(a.conservative)}</bdi> إلى <bdi dir="ltr">{fx(a.optimistic)}</bdi></div>
    <p className="ex">سعر تقديري من طرق ليها مرجع مكتوب تحت، عشان تقارنه بالسعر في السوق. الوسط <bdi dir="ltr">{fx(a.base)}</bdi>. {a.label} ({a.n_methods} طريقة). السعر الحالي <bdi dir="ltr">{fx(s.price)}</bdi> ({s.price_note}).</p>
    <Fold t="الطرق والمصادر">
      {s.methods.map((m: any) => <div className="mm" key={m.method_key}>
        <h5>{m.name_ar} <span className="tg">{m.label}</span></h5>
        <div className="vv"><div><small>محافظ</small><b dir="ltr">{fx(m.conservative)}</b></div><div><small>متوسط</small><b dir="ltr">{fx(m.base)}</b></div><div><small>متفائل</small><b dir="ltr">{fx(m.optimistic)}</b></div></div>
        <div>الحساب: {m.basis}</div>
        <div className="src">المرجع: {m.curriculum_basis}<br /><A u={m.source} /><br /><small>{m.source_status}</small></div>
        <div className="ours">ملحوظة: {m.caveat}</div></div>)}
      {(s.unavailable || []).map((u: any, i: number) => <div className="na" key={i}><b>{u.method_name}:</b> {u.reason}</div>)}
      <div className="na">{a.name_ar}. {a.curriculum_basis}</div>
    </Fold>
    <hr />
    <div className="q"><span>السعر المستهدف</span><span className="tg">تجريبي · {day}</span></div>
    {vs.length ? <div className="big"><bdi dir="ltr">{fx(Math.min(...vs))}</bdi> إلى <bdi dir="ltr">{fx(Math.max(...vs))}</bdi></div> : <div className="big">غير متوفر</div>}
    <p className="ex">تلات طرق بسيطة بنجرب بيها سعر ممكن يوصله السهم. تجريبي ومش وعد.</p>
    <Fold t="الطرق التلاتة والمصادر">
      {ts.map((t: any) => <div className="mm" key={t.key}>
        <h5>الطريقة {String(t.key).slice(1)}: <bdi dir="ltr">{fx(t.value)}</bdi> <span className="tg">{t.label}</span></h5>
        <div>{t.name_ar}</div>
        <div className="src"><b>من المصدر:</b> {t.part_from_source}<br />{t.source_reference}<br />{(t.source_links || []).map((u: string) => <A key={u} u={u} />)}</div>
        <div className="ours"><b>من عندنا:</b> {t.part_ours}</div>
        <div className="na">{t.basis_status}</div></div>)}
      {an.avg != null
        ? <div className="an"><b>{an.label}</b>: متوسط <bdi dir="ltr">{fx(an.avg)}</bdi> (من <bdi dir="ltr">{fx(an.low)}</bdi> إلى <bdi dir="ltr">{fx(an.high)}</bdi>) · {an.n} محللين<br /><small>{an.note}</small><br /><A u={an.source} /></div>
        : <div className="an"><b>مستهدف المحللين، مش قيمتنا:</b> {an.status || 'غير متوفر'}. {an.reason}</div>}
    </Fold>
    <p className="nt">{d.curriculum_note_ar}</p>
    <p className="nt">{d.note_ar}</p>
  </div>;
}

// Financial-tab valuation block for the six holdings. Data-only: studies_rest/studies_rest/financial_tab_wording_six.json is written by the content agent.
let cacheF: Promise<any> | null = null;
const loadF = () => cacheF || (cacheF = fetch('studies_rest/studies_rest/financial_tab_wording_six.json?t=' + Math.floor(Date.now() / 300000), { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).catch(() => null));
const rename = (t: string) => String(t || '').replace(/القيمة العادلة/g, 'السعر العادل');
export function FinVal6({ k, bony }: { k: string; bony?: boolean }) {
  const [d, setD] = useState<any>(undefined);
  useEffect(() => { let on = true; loadF().then(x => on && setD(x)); return () => { on = false; }; }, []);
  if (d === undefined) return null;
  const s = d && d.stocks && d.stocks[k];
  if (!s) return <div className={bony ? 'bf-value' : 'fin-value'}><span>السعر العادل</span><b>غير متوفر</b><small>مقدرتش أحمّل النص دلوقتي.</small></div>;
  const an = s.analyst_reference || {};
  return <>
    <div className={bony ? 'bf-value' : 'fin-value'}><span>{rename(s.title)}</span><b>تقديري</b><small>{rename(s.summary)} {rename(s.small)}</small></div>
    <div className="fv6"><style>{CSS}</style>
      <Fold t="طرق السعر العادل ومصادرها">
        {(s.methods || []).map((m: any, i: number) => <div className="mm" key={i}>
          <h5>{m.label_ar} <span className="tg">تقديري</span></h5>
          <div className="vv"><div><small>محافظ</small><b dir="ltr">{fx(m.values.conservative)}</b></div><div><small>متوسط</small><b dir="ltr">{fx(m.values.base)}</b></div><div><small>متفائل</small><b dir="ltr">{fx(m.values.optimistic)}</b></div></div>
          <div>الحساب: {m.how}</div>
          <div className="src">المرجع: {m.curriculum_basis}<br /><A u={m.source} /></div>
          <div className="ours">ملحوظة: {m.caveat}</div></div>)}
        <div className="na">{s.special}</div>
        {(s.unavailable || []).map((u: any, i: number) => <div className="na" key={i}>{typeof u === 'string' ? u : (u.method_name || '') + ': ' + (u.reason || '')}</div>)}
        <div className="na">{rename(s.method_explainer)}</div>
        <div className="na">{s.assumptions}</div>
      </Fold>
      <Fold t="الأهداف التجريبية وتفاصيلها">
        {(s.targets_experimental || []).map((t: any, i: number) => <div className="mm" key={i}>
          <h5>{t.label_ar}: <bdi dir="ltr">{fx(t.value)}</bdi> <span className="tg">تجريبي</span></h5>
          <div className="src"><b>من المصدر:</b> {t.from_source}<br />{t.source_reference}<br /><A u={t.source} /></div>
          <div className="ours"><b>من عندنا:</b> {t.ours}</div>
          <div className="na">{t.note}</div></div>)}
        {an.avg != null
          ? <div className="an"><b>{an.label}</b>: متوسط <bdi dir="ltr">{fx(an.avg)}</bdi> (من <bdi dir="ltr">{fx(an.low)}</bdi> إلى <bdi dir="ltr">{fx(an.high)}</bdi>) · {an.n} محللين<br /><small>{an.note}</small><br /><A u={an.source} /></div>
          : <div className="an"><b>مستهدف المحللين، مش قيمتنا:</b> {an.status || 'غير متوفر'}. {an.reason}</div>}
        <div className="na">{s.backtest_note}</div>
        <div className="na">المصادر: {(s.sources || []).map((u: string) => <A key={u} u={u} />)}</div>
      </Fold>
    </div>
  </>;
}
