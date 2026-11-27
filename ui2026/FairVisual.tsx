import React from 'react';
import { VAL, VAL_ASOF } from './valuation';

const num = (v: any): v is number => typeof v === 'number' && isFinite(v);
const f2 = (v: number) => (Math.abs(v) >= 1 ? v.toFixed(2) : v.toFixed(3));
const arr = (v: any): any[] => (Array.isArray(v) ? v : []);

// Visual header for the fair value tab. Only adds elements; all existing text stays below.
export function FairHero({ k, s }: { k: string; s: any }) {
  const v = VAL[k];
  const price = num(s.price) ? s.price : v && num(v.price) ? v.price : null;
  const ar = s.analyst_reference && num(s.analyst_reference.low) && num(s.analyst_reference.high) ? s.analyst_reference : null;
  const ms = arr(s.methods);
  const tm = ms.find((m: any) => m.sensitivity_table && arr(m.sensitivity_table.rows).length);
  const rows = tm ? arr(tm.sensitivity_table.rows).filter((r: any) => num(r.ke_pct) && num(r.g_pct) && num(r.value)) : [];
  const HOLD_VAL = false;
  const hasFv = !HOLD_VAL && v && num(v.fv) && num(v.lo) && num(v.hi);
  if (!hasFv && !ar && !rows.length && !(v && v.why)) return null;
  const pts: number[] = [];
  if (hasFv) pts.push(v.lo!, v.hi!);
  if (ar) pts.push(ar.low, ar.high);
  if (price != null) pts.push(price);
  const lo = Math.min(...pts), hi = Math.max(...pts), pad = (hi - lo) * 0.05 || 1;
  const x0 = lo - pad, sp = hi + pad - x0;
  const p = (x: number) => Math.min(100, Math.max(0, ((x - x0) / sp) * 100));
  const wide = hasFv && (v.hi! - v.lo!) / v.fv! > 2;
  const gap = hasFv && price != null ? (price / v.fv! - 1) * 100 : null;
  const ks = Array.from(new Set(rows.map((r: any) => r.ke_pct))).sort((a: any, b: any) => a - b) as number[];
  const gs = Array.from(new Set(rows.map((r: any) => r.g_pct))).sort((a: any, b: any) => a - b) as number[];
  const get = (ke: number, g: number) => (rows.find((r: any) => r.ke_pct === ke && r.g_pct === g) || {}).value;
  return <div className="fvh" aria-label="ملخص مرئي للسعر العادل">
    <div className="fvh-b">
      {hasFv ? <>
        <span className="fvh-t">مرجع تحقق (وسيط {num(v.methods) ? v.methods + ' طرق' : 'الطرق'}، نموذج مختلف) <bdi dir="ltr">{f2(v.fv!)}</bdi></span>{(v as any).ke_ar ? <span className="fvh-t g">{(v as any).ke_ar}</span> : null}
        {gap != null ? <span className="fvh-t g" dir="ltr">السعر {gap >= 0 ? '▲ +' : '▼ −'}{Math.abs(gap).toFixed(0)}% عن مرجع التحقق</span> : null}
        {wide ? <span className="fvh-t g">نطاق واسع</span> : null}
              </> : <span className="fvh-t g">مرجع التحقق غير متوفر{v && v.why ? ': ' + v.why : ''}</span>}
    </div>
    {pts.length >= 2 && (hasFv || ar) ? <div className="fvh-bar" dir="ltr">
      {hasFv ? <div className="fvh-fair" style={{ left: p(v.lo!) + '%', width: Math.max(1, p(v.hi!) - p(v.lo!)) + '%' }} /> : null}
      {hasFv ? <i className="fvh-fv" style={{ left: p(v.fv!) + '%' }} /> : null}
      {ar ? <div className="fvh-an" style={{ left: p(ar.low) + '%', width: Math.max(1, p(ar.high) - p(ar.low)) + '%' }} /> : null}
      {price != null ? <i className="fvh-px" style={{ left: p(price) + '%' }} /> : null}
    </div> : null}
    {pts.length >= 2 && (hasFv || ar) ? <div className="fvh-lg">
      {hasFv ? <span><i className="k1" />نطاق مرجع التحقق <bdi dir="ltr">{f2(v.lo!)}–{f2(v.hi!)}</bdi></span> : null}
      {ar ? <span><i className="k2" />مستهدف الجهات <bdi dir="ltr">{f2(ar.low)}–{f2(ar.high)}</bdi>{num(ar.n) ? ' (' + ar.n + ')' : ''}</span> : null}
      {price != null ? <span><i className="k3" />السعر <bdi dir="ltr">{f2(price)}</bdi></span> : null}
    </div> : null}
    {ks.length && gs.length ? <>
      <div className="fvh-as"><span className="fvh-t g">افتراض: العائد المطلوب <bdi dir="ltr">{ks[0]}–{ks[ks.length - 1]}%</bdi></span><span className="fvh-t g">النمو <bdi dir="ltr">{gs[0]}–{gs[gs.length - 1]}%</bdi></span></div>
      <div className="fvh-hm" dir="ltr" style={{ gridTemplateColumns: 'auto repeat(' + gs.length + ',1fr)' }}>
        <small />{gs.map(g => <small key={g}>نمو {g}%</small>)}
        {ks.map(ke => <React.Fragment key={ke}><small>عائد {ke}%</small>{gs.map(g => { const x = get(ke, g); const c = !num(x) || price == null ? '' : x >= price ? ' up' : ' dn'; return <b key={g} className={'c' + c}>{num(x) ? x.toFixed(1) : '—'}</b>; })}</React.Fragment>)}
      </div>
      <p className="fvh-n">أخضر: القيمة أعلى من السعر. أحمر: أقل. افتراضات مش توقع.</p>
    </> : null}
    {hasFv ? <p className="fvh-n">أرقام العادلة بتاريخ {VAL_ASOF}، السعر بتاريخ {v.price_date}. مش توصية.</p> : null}
  </div>;
}

const pick = (t: any, re: RegExp) => { const m = typeof t === 'string' ? t.match(re) : null; return m ? m[1] : null; };

// Visual header for the page-based fair value tab (v7 pages). Numbers come from the page JSON only.
export function PageFairHero({ d }: { d: any }) {
  const code = String(d.code || '').toUpperCase();
  const vj = VAL[code];
  const price = d.market_price && num(d.market_price.value) ? d.market_price.value : null;
  const sc: any[] = (d.scenarios || []).filter((n: any) => num(n.value));
  if (!sc.length || price == null) return null;
  const isLo = (n: any) => /أصعب/.test(n.label_ar || '');
  const isHi = (n: any) => /أحسن/.test(n.label_ar || '');
  const lo = sc.find(isLo), hi = sc.find(isHi);
  const base = sc.filter(n => !isLo(n) && !isHi(n));
  const an = d.analyst && num(d.analyst.value) ? d.analyst.value : null;
  const pts = [price, ...sc.map(n => n.value), ...(an != null ? [an] : [])];
  const mn = Math.min(...pts), mx = Math.max(...pts), pad = (mx - mn) * 0.05 || 1;
  const x0 = mn - pad, sp = mx + pad - x0;
  const p = (x: number) => Math.min(100, Math.max(0, ((x - x0) / sp) * 100));
  const b0 = base[0];
  const gap = b0 ? (price / b0.value - 1) * 100 : null;
  const rate = pick(d.rate_explain_ar, /العائد المطلوب في السنة الخامسة[^0-9]*([0-9.]+)%/);
  const bond = pick(d.rate_explain_ar, /فايدة السندات النهارده\s*([0-9.]+)%/);
  const infl = pick(d.rate_explain_ar, /التضخم الحضري النهارده\s*([0-9.]+)%/);
  const gro = pick(d.rate_explain_ar, /التضخم\s*([0-9.]+)%\)/);
  return <div className="fvh" aria-label="ملخص مرئي للحساب">
    <div className="fvh-b">
      {b0 ? <span className="fvh-t">الحساب الأساسي (نموذج الصفحة، افتراضات مش قيمة) <bdi dir="ltr">{f2(b0.value)}</bdi></span> : null}
      {b0 && vj && num(vj.fv) ? <span className="fvh-t g">مرجع تحقق (وسيط {vj.methods} طرق، نموذج مختلف) <bdi dir="ltr">{f2(vj.fv)}</bdi>{num(vj.lo) && num(vj.hi) ? <> · <bdi dir="ltr">{f2(vj.lo)}–{f2(vj.hi)}</bdi></> : null}</span> : null}
      {vj && vj.models_differ ? <span className="fvh-t g">نموذجان مختلفان</span> : null}
      {vj && num(vj.fv) && num(vj.lo) && num(vj.hi) && (vj.hi - vj.lo) / vj.fv > 2 ? <span className="fvh-t g">نطاق واسع</span> : null}
      {vj && !num(vj.fv) ? <span className="fvh-t g">مرجع التحقق: غير متوفر{vj.why ? ' (' + vj.why + ')' : ''}</span> : null}
      {gap != null ? <span className="fvh-t g" dir="ltr">السعر {gap >= 0 ? '▲ +' : '▼ −'}{Math.abs(gap).toFixed(0)}% عن الأساسي</span> : null}
          </div>
    <div className="fvh-bar" dir="ltr">
      {lo && hi ? <div className="fvh-fair" style={{ left: p(lo.value) + '%', width: Math.max(1, p(hi.value) - p(lo.value)) + '%' }} /> : null}
      {sc.map((n, i) => <i key={i} className="fvh-fv" style={{ left: p(n.value) + '%' }} />)}
      {an != null ? <i className="fvh-fv" style={{ left: p(an) + '%', background: '#a5aab2' }} /> : null}
      <i className="fvh-px" style={{ left: p(price) + '%' }} />
    </div>
    <div className="fvh-lg">
      {lo && hi ? <span><i className="k1" />حالات للمقارنة <bdi dir="ltr">{f2(lo.value)}–{f2(hi.value)}</bdi></span> : null}
      {!(lo && hi) ? sc.map((n, i) => <span key={i}><i className="k1" /><bdi dir="ltr">{f2(n.value)}</bdi> {String(n.label_ar || '').replace(/^افتراض \d+:\s*/, '')}</span>) : null}
      {an != null ? <span><i className="k2" />مرجع خارجي <bdi dir="ltr">{f2(an)}</bdi></span> : null}
      <span><i className="k3" />السعر <bdi dir="ltr">{f2(price)}</bdi></span>
    </div>
    {rate || bond || infl || gro ? <div className="fvh-as">
      {rate ? <span className="fvh-t g">عائد مطلوب (سنة 5) <bdi dir="ltr">{rate}%</bdi></span> : null}
      {bond ? <span className="fvh-t g">فايدة سندات <bdi dir="ltr">{bond}%</bdi></span> : null}
      {infl ? <span className="fvh-t g">تضخم <bdi dir="ltr">{infl}%</bdi></span> : null}
      {gro ? <span className="fvh-t g">نمو مفترض <bdi dir="ltr">{gro}%</bdi></span> : null}
    </div> : null}
    {d.market_price && d.market_price.as_of_ar ? <p className="fvh-n">{d.market_price.as_of_ar}</p> : null}
  </div>;
}
