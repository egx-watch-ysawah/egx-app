import React from 'react';
import { VAL, VAL_ASOF } from './valuation';
import FSJ from './fv_scenarios.json';
const FS: Record<string, any> = (FSJ as any).stocks || {};
const MN: Record<string, [string, string]> = {"ri": ["الدخل المتبقي (ROE ثابت)", "الدفترية + قيمة الأرباح الزائدة عن تكلفة رأس المال."], "ri_unified": ["الدخل المتبقي الموحد", "نفس الفكرة مع تلاشي ROE وتكلفة رأس المال على 5 سنوات."], "multiples_fwd": ["مضاعف الربحية المتوقعة", "ربح السهم القادم في مضاعف الأقران."], "evebitda": ["مضاعف قيمة المنشأة", "EV/EBITDA الأقران ثم نخصم الدين ونضيف النقد."], "fcff": ["خصم التدفق الحر للمنشأة", "التدفقات قبل الدين ثم نطرح الدين."], "fcfe": ["خصم التدفق الحر للمساهمين", ""], "nav": ["صافي قيمة الأصول", "الأصول ناقص الالتزامات على الأسهم."], "sotp": ["مجموع الأجزاء", "قيمة كل نشاط لوحده ثم نجمعها."], "ddm2": ["خصم التوزيعات مرحلتين", ""], "gordon": ["جوردون", "التوزيع القادم على (العائد المطلوب ناقص النمو)."], "hmodel": ["نموذج H", "نمو توزيعات يتناقص خطيا."], "pb": ["مضاعف القيمة الدفترية العادل", ""], "pe_just": ["مضاعف الربحية العادل", ""], "peg": ["الربحية مقابل النمو", ""], "aeg": ["نمو الأرباح غير العادي", ""], "eva": ["القيمة الاقتصادية المضافة", ""], "grahamNumber": ["رقم جراهام", "حد أعلى للسعر المعقول."], "graham": ["معادلة جراهام للنمو", ""], "ncav": ["صافي الأصول المتداولة", "حد أدنى متحفظ."], "liquidation": ["قيمة التصفية", "حد أدنى."], "montecarlo": ["محاكاة مونت كارلو", "آلاف التجارب والوسيط."], "realoption": ["حق التوسع (خيار حقيقي)", "يضاف ولا يستقل بنفسه."]};
const FLT = ['grahamNumber', 'graham', 'ncav', 'liquidation'];

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
  const fs = FS[code] && FS[code].status === 'available' ? FS[code] : null;
  const A: any = fs ? { growth_pct: fs.growth, ke_pct: fs.ke && fs.ke.year5, g_pct: fs.g, margin_pct: fs.margin } : {};
  const AS: [string, string, string][] = [
    ['growth_pct', 'نمو الأرباح', 'سرعة زيادة الربح كل سنة في حساب مرجع التحقق. أعلى معناها قيمة أعلى، فاسأل هل واقعي.'],
    ['ke_pct', 'العائد المطلوب (سنة 5)', 'اللي المستثمر بيطلبه سنوياً. أعلى معناها قيمة أقل للسهم.'],
    ['g_pct', 'النمو الدائم', 'نمو الأرباح على المدى البعيد. كل ما قرب من التضخم يبقى أهدى.'],
    ['margin_pct', 'هامش الربح', 'كام قرش ربح من كل جنيه إيراد. قارنه بهامش السنين اللي فاتت.'],
  ];
  const why = fs ? 'مش موجود في بيانات مرجع التحقق' : (FS[code] && FS[code].reason) || 'مفيش بيانات منظمة لمرجع التحقق للسهم ده';
  const ms: any[] = fs && fs.method_values ? Object.keys(fs.method_values).filter(k => num(fs.method_values[k])).map(k => ({ name_ar: (MN[k] || [k, ''])[0], tip: (MN[k] || [k, ''])[1], flt: FLT.indexOf(k) >= 0, value: fs.method_values[k] })) : [];
  const mmax = Math.max(price, ...ms.map((m: any) => m.value), 0) || 1;
  const xs: [string, number][] = fs && num(fs.bear) && num(fs.base) && num(fs.bull) ? [['الأقل', fs.bear], ['الأوسط', fs.base], ['الأعلى', fs.bull]] : [];
  const xmax = Math.max(price, ...xs.map(r => r[1])) || 1;
  const rows3: [string, any][] = ([['الحالة الأصعب', lo], ['الأساسي', b0], ['الحالة الأحسن', hi]] as [string, any][]).filter(r => r[1]);
  const smax = Math.max(price, ...rows3.map(r => r[1].value)) || 1;
  const anv = d.analyst && num(d.analyst.value) ? d.analyst : null;
  const big = b0 && price != null && Math.abs(gap as number) > 100;
  const gp = b0 ? Math.abs(gap as number) : 0;
  const xmax2 = b0 ? Math.max(price, b0.value) * 1.08 : 1;
  return <div className="fvd" aria-label="ملخص السعر العادل">
    <div className="fvd-c">
      {b0 ? <>
        <div className="fvd-n" dir="rtl">
          <span><small>السعر الحالي</small><b dir="ltr">{f2(price)}</b></span>
          <span><small>القيمة حسب افتراضات الصفحة</small><b dir="ltr">{f2(b0.value)}</b></span>
        </div>
        <p className={'fvd-s ' + ((gap as number) > 0 ? 'd' : 'u')}>{(gap as number) > 0 ? '▲ السعر أعلى من القيمة حسب الافتراضات بنسبة ' : '▼ السعر أقل من القيمة حسب الافتراضات بنسبة '}<bdi dir="ltr">{gp.toFixed(0)}%</bdi></p>
        <div className="fvd-bar" dir="ltr">
          <i className="fvd-f" style={{ left: (b0.value / xmax2) * 100 + '%' }}><u>القيمة حسب الافتراضات</u></i>
          <i className="fvd-px" style={{ left: (price / xmax2) * 100 + '%' }}><u className="px">السعر</u></i>
        </div>
        {big ? <p className="fvd-w">الفرق كبير: يعني السعر بيتوقع أكتر من افتراضات الحساب، أو افتراضاته متحفظة. اعتبره سؤال محتاج تدقيق مش إشارة.</p> : null}
        <p className="fvd-m">حساب بافتراضات مش توقع، ومش توصية. {d.market_price && d.market_price.as_of_ar ? d.market_price.as_of_ar : ''}</p>
      </> : <p className="fvd-m">القيمة حسب افتراضات الصفحة: غير متوفر، مفيش حساب أساسي منشور للسهم ده.</p>}
    </div>
    <details className="fvd-d"><summary>تفاصيل</summary>
      <p className="fvh-n">متحفظ / متوسط / متفائل: ثلاث حالات للحساب بافتراضات أصعب وأسهل. بتوريك المدى، مش حاجة هتحصل.</p>
    <div className="fvh" aria-label="ملخص مرئي للحساب">
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
      {an != null ? <span><i className="k2" />مرجع من مصدر منشور <bdi dir="ltr">{f2(an)}</bdi></span> : null}
      <span><i className="k3" />السعر <bdi dir="ltr">{f2(price)}</bdi></span>
    </div>
    {rows3.length ? <div className="fvs" dir="ltr" aria-label="سيناريوهات مقابل السعر">
      {rows3.map(([l, n]) => { const g2 = (n.value / price - 1) * 100; return <div key={l} className="fvs-r"><span className="fvs-l">{l}</span>
        <div className="fvs-t"><i className={'fvs-b ' + (g2 >= 0 ? 'up' : 'dn')} style={{ width: Math.max(2, (n.value / smax) * 100) + '%' }} /><i className="fvs-p" style={{ left: (price / smax) * 100 + '%' }} /></div>
        <b className={'fvs-v ' + (g2 >= 0 ? 'u' : 'd')}>{f2(n.value)} <small>{g2 >= 0 ? '▲ +' : '▼ −'}{Math.abs(g2).toFixed(0)}%</small></b></div>; })}
      <p className="fvh-n" dir="rtl">الخط الأبيض = السعر الحالي {f2(price)}. الأخضر أعلى منه والأحمر أقل. افتراضات "لو" مش توقع.</p>
    </div> : null}
    {xs.length ? <div className="fvs fvs2" dir="ltr" aria-label="سيناريوهات مرجع التحقق">
      <p className="fvh-n" dir="rtl"><b>سيناريوهات مرجع التحقق</b> (نموذج مختلف عن الصفحة، مش القيمة العادلة)</p>
      {xs.map(([l, v2]) => { const g2 = (v2 / price - 1) * 100; return <div key={l} className="fvs-r"><span className="fvs-l">{l}</span>
        <div className="fvs-t"><i className="fvs-b ref" style={{ width: Math.max(2, (v2 / xmax) * 100) + '%' }} /><i className="fvs-p" style={{ left: (price / xmax) * 100 + '%' }} /></div>
        <b className="fvs-v">{f2(v2)} <small>{g2 >= 0 ? '▲ +' : '▼ −'}{Math.abs(g2).toFixed(0)}%</small></b></div>; })}
      <p className="fvh-n" dir="rtl">الأساس: دخل متبقي بثلاث افتراضات لعائد حقوق الملكية النهائي (افتراض مش توقع). المصدر: StockAnalysis وصفحات Starta العامة عبر حاسبة خاصة، بتاريخ <bdi dir="ltr">{fs.as_of}</bdi>.</p>
    </div> : <p className="fvh-n">سيناريوهات مرجع التحقق: غير متوفر، {FS[code] && FS[code].reason ? FS[code].reason : 'مفيش بيانات منظمة للسهم ده'}.</p>}
    <p className="fvh-n">{anv ? 'مستهدف الجهات الخارجية: ' + f2(anv.value) + (anv.as_of_ar ? ' (' + anv.as_of_ar + ')' : '') : 'مستهدف الجهات الخارجية: غير متوفر، مفيش مستهدف منشور من جهة خارجية.'}</p>
    {fs ? <div className="fvh-as fva">
      {AS.map(([k, l, m]) => num(A[k]) ? <span key={k} className="fva-c"><i>{l}</i><b dir="ltr">{A[k]}%</b><small>{m}</small></span>
        : <span key={k} className="fva-c na"><i>{l}</i><b>غير متوفر</b><small>{why}</small></span>)}
    </div> : <p className="fvh-n">افتراضات مرجع التحقق (نمو الأرباح، العائد المطلوب، النمو الدائم، هامش الربح): غير متوفر، {why}.</p>}
    {ms.length ? <p className="fvh-n">طرق مرجع التحقق (كل طريقة لوحدها، الخط الأبيض = السعر):</p> : null}
    {ms.length ? <div className="fvm" dir="ltr">{ms.map((m: any, i: number) => <div key={i} className="fvm-r"><span>{m.name_ar}{m.flt ? <em className="fvm-f">فلتر/حد</em> : null}{m.tip ? <small>{m.tip}</small> : null}</span><div className="fvm-t"><i style={{ width: Math.max(2, (m.value / mmax) * 100) + '%' }} /><u style={{ left: (price / mmax) * 100 + '%' }} /></div><b>{f2(m.value)}</b></div>)}</div> : null}
    <p className="fvh-n">حدود الحساب: افتراضات مش توقعات، ومصدر السعر واحد ومتأخر.</p>
    {d.market_price && d.market_price.as_of_ar ? <p className="fvh-n">{d.market_price.as_of_ar}</p> : null}
    </div>
    </details>
  </div>;
}
