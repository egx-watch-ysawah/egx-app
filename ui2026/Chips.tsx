import React from 'react';
import { verdict } from '../shared';
import { loadAtrAll, atrOf, xTech, xRsi, xChg, xPos, xAtr, xVol, xRef } from './Explain';
import { VAL, VAL_ASOF, VAL_METHOD } from './valuation';
// Chip row for stock pages. Uses only fields already in the stock JSON (close, date, chg5/20/60, rsi, votes, plan.atrpct, volx, hi52, lo52).
// Every missing field is a grey "غير متوفر" chip, never a made-up number.
const num = (v: any) => typeof v === 'number' && Number.isFinite(v);
const sg = (v: number) => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(1) + '%';
const dir = (v: number) => (v > 0 ? 'up' : v < 0 ? 'dn' : 'gr');
const NA = <b className="chp-v gr">غير متوفر</b>;
export function StockChips({ s, code }: { s: any; code?: string }) {
  const [atrAll, setAtrAll] = React.useState<number[] | null>(null);
  React.useEffect(() => { let on = true; loadAtrAll().then(a => on && setAtrAll(a)); return () => { on = false; }; }, []);
  if (!s || s.nohist) return null;
  const val = code ? VAL[code.toUpperCase()] : undefined;
  const v = s.ok ? verdict(s) : null;
  const vcls = !v ? 'gr' : v.c === 'go' ? 'up' : v.c === 'wait' ? 'dn' : 'gr';
  const lo = s.lo52, hi = s.hi52, c = s.close;
  const pos = num(lo) && num(hi) && num(c) && hi > lo ? Math.max(0, Math.min(100, ((c - lo) / (hi - lo)) * 100)) : null;
  const ch: [string, any][] = [['5 جلسات', s.chg5], ['20 جلسة', s.chg20], ['60 جلسة', s.chg60]];
  const planAtr = s.plan && num(s.plan.atrpct) ? s.plan.atrpct : null;
  const atr = atrAll && atrAll.length >= 30 && code ? atrOf(code) : planAtr;
  return (
    <section className="chp" aria-label="ملخص بالأرقام">
      <div className="chp-c"><small>القراءة الفنية</small>{v ? <b className={'chp-v ' + vcls}>{vcls === 'up' ? '+ ' : vcls === 'dn' ? '− ' : ''}{v.t}</b> : NA}<p className="chp-x">{v && v.c !== 'na' ? xTech(v.c) : ''}</p></div>
      <div className="chp-c"><small>RSI 14</small>{num(s.rsi) ? <b className="chp-v gr" dir="ltr">{s.rsi.toFixed(0)}</b> : NA}<p className="chp-x">{xRsi(s.rsi)}</p></div>
      <div className="chp-c chp-w"><small>التغير</small>
        <div className="chp-3">{ch.map(([n, x]) => <span key={n}><i>{n}</i>{num(x) ? <b className={dir(x)} dir="ltr">{sg(x)}</b> : <b className="gr">غير متوفر</b>}</span>)}</div><p className="chp-x">{xChg(s.chg5, s.chg20, s.chg60)}</p></div>
      <div className="chp-c chp-w"><small>مكان السعر في مدى سنة (إقفال)</small>
        {pos === null ? NA : <><div className="chp-bar" dir="ltr"><u style={{ left: pos + '%' }} /></div><div className="chp-rg" dir="ltr"><span>{lo}</span><span>{c}</span><span>{hi}</span></div><p className="chp-x">{xPos(pos)}</p></>}</div>
      <div className="chp-c"><small>تذبذب يومي (متوسط 14 جلسة)</small>{atr === null ? NA : <b className="chp-v gr" dir="ltr">{atr}%</b>}<p className="chp-x">{xAtr(atr, atrAll)}</p></div>
      <div className="chp-c"><small>حجم آخر جلسة من المعتاد</small>{num(s.volx) ? <b className="chp-v gr" dir="ltr">{Math.round(s.volx * 100)}%</b> : NA}<p className="chp-x">{xVol(s.volx)}</p></div>
      {val && (val.fv == null || val.price == null
        ? <div className="chp-c chp-w"><small>مرجع التحقق</small><b className="chp-v gr">غير متوفر</b><p className="chp-s">{val.why} · بتاريخ {VAL_ASOF}</p></div>
        : (() => { const price = val.price as number; const gap = (price / val.fv - 1) * 100; const wide = val.lo != null && val.hi != null && (val.hi - val.lo) / val.fv > 2; 
          return <div className="chp-c chp-w"><small>مرجع تحقق (وسيط {val.methods} طرق، نموذج مختلف)</small>
            <b className="chp-v gr" dir="ltr">{val.fv} ← {price} ({(gap > 0 ? '+' : '−') + Math.abs(gap).toFixed(1)}%)</b>
            <span className="chp-n">{gap > 0 ? 'السعر فوق مرجع التحقق' : 'السعر تحت مرجع التحقق'}</span>{val.models_differ ? <span className="chp-wd">نموذجان مختلفان</span> : null}{val.ke_ar ? <span className="chp-n" dir="rtl" style={{unicodeBidi:"plaintext"}}>{val.ke_ar}</span> : null}
            {val.lo != null && <div className="chp-rg" dir="ltr"><span>{val.lo}</span><span>المدى</span><span>{val.hi}</span></div>}
            <p className="chp-x">{xRef(gap)}</p>
            {wide && <span className="chp-wd">مدى واسع: الرقم تقدير تقريبي، مش دقيق</span>}
            <p className="chp-s">عدد الطرق: {val.methods == null ? 'غير متوفر هنا' : val.methods} · {VAL_METHOD} · بتاريخ {VAL_ASOF} · السعر إقفال {val.price_date} · مش توصية.</p></div>; })())}
      <p className="chp-s">لحد إقفال {s.date} · {s.sourceName || 'المصدر المجاني'} · وصف للي حصل، مش توصية.</p>
    </section>
  );
}
