import React from 'react';
import { staleBySession, useHolidays } from './FlowSignal';
// Per-stock "same state in the past" block. Data: flow_combo_<CODE>.json (data engineer). Only stocks with a file get the block.
const nn = (v: any) => typeof v === 'number' && isFinite(v);
const M = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const arD = (iso: string) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); return m ? Number(m[3]) + ' ' + M[Number(m[2]) - 1] + ' ' + m[1] : String(iso || ''); };
const L = (v: any) => <bdi dir="ltr">{v}</bdi>;
const pc = (v: number) => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(1) + '%';
const NAMES: Record<string, string> = { A: 'قيمة التداول (أ)', B: 'الإقفال في الثلث الأعلى (ب)', C: 'الحجم الصاعد (ج)' };
const cache: Record<string, Promise<any>> = {};
export const loadCombo = (k: string): Promise<any> => cache[k] || (cache[k] = fetch('flow_combo_' + k + '.json?t=' + Date.now(), { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).catch(() => null).then((j: any) => { const ok = j && j.symbol === k && j.today && j.combos && j.history ? j : null; if (!ok) delete cache[k]; return ok; }));
export const useCombo = (k: string) => { const [c, setC] = React.useState<any>(undefined); React.useEffect(() => { let on = true; loadCombo(k).then(x => on && setC(x)); return () => { on = false; }; }, [k]); return c; };
const countLine = (n: number, hist: any) => n === 0 ? <>الحالة دي ما حصلتش قبل كده في تاريخ السهم المتاح ({arD(hist.from)} إلى {arD(hist.to)})، فمفيش نتيجة نعرضها.</> : n === 1 ? 'حصلت مرة واحدة بس في تاريخ السهم المتاح. دي حالة واحدة، مش كفاية نستنتج منها.' : n === 2 ? 'حصلت مرتين بس.' : n <= 10 ? <>حصلت {L(n)} مرات بس، عينة صغيرة جدًا.</> : n < 30 ? <>حصلت {L(n)} مرة، عينة صغيرة.</> : <>حصلت {L(n)} مرة.</>;
function Row({ h, x, base }: { h: number; x: any; base: any }) {
  if (!x || !nn(x.n) || x.n === 0 || !nn(x.up)) return <div className="fcb"><b>بعد {L(h)} {h <= 10 ? 'جلسات' : 'جلسة'}</b><div className="fc-na">غير متوفر: مفيش حالة مدتها خلصت.</div></div>;
  const big = x.n >= 30; const u = x.n === 1 ? 'مرة' : x.n === 2 ? 'مرتين' : x.n <= 10 ? 'مرات' : 'مرة';
  return <div className="fcb"><b>بعد {L(h)} {h <= 10 ? 'جلسات' : 'جلسة'}</b>
    <div className="fc-l">زاد {L(x.up)} من {x.n === 2 ? 'مرتين' : <>{L(x.n)} {u}</>}{nn(x.mean) ? <>، ومتوسط التغير <b className={x.mean >= 0 ? 'up' : 'dn'}>{L(pc(x.mean))}</b></> : null}{big && nn(x.win) ? <> ({L(x.win + '%')} زادوا)</> : null}</div>
    {x.n <= 40 ? <div className="fx-dots" dir="ltr" aria-hidden="true">{Array.from({ length: x.n }, (_, i) => <i key={i} className={i < x.up ? 'u hi' : ''} />)}</div> : <div className="fx-bar" dir="ltr"><i style={{ width: (100 * x.up / x.n) + '%', background: '#25b896' }} /></div>}
    {base && nn(base.win) ? <div className="fc-b">لو بصينا على كل أيام السهم: زاد {L(base.win + '%')} من الأيام{nn(base.mean) ? <>، ومتوسط التغير {L(pc(base.mean))}</> : null}</div> : null}</div>;
}
// Lazy: the file is fetched only when the block is near the screen (the /fair list has many stocks). A missing/invalid file is not cached, so the next mount retries.
export function FlowCombo({ k }: { k: string }) {
  const ref = React.useRef<HTMLDivElement>(null); const [on, setOn] = React.useState(typeof IntersectionObserver === 'undefined');
  React.useEffect(() => { if (on || !ref.current) return; const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { setOn(true); io.disconnect(); } }, { rootMargin: '800px 0px' }); io.observe(ref.current); return () => io.disconnect(); }, [on]);
  return on ? <FlowComboBody k={k} /> : <div ref={ref} style={{ minHeight: 1 }} aria-hidden="true" />;
}
function FlowComboBody({ k }: { k: string }) {
  const c = useCombo(k); const hol = useHolidays();
  if (c === undefined || hol === undefined) return null;
  if (!c) return <><div className="sm-sec" style={{ marginTop: 18 }}>لما نفس الحالة دي حصلت قبل كده في السهم ده، حصل إيه؟</div><div className="sm-card fc"><style>{CSS}</style><div className="fx-na"><b>غير متوفر</b><span>التاريخ ده لسه ما اتحسبش للسهم ده (أو الملف مش متاح دلوقتي)، فمفيش أرقام نعرضها.</span></div></div></>;
  const t = c.today; const s: string = typeof t.state === 'string' ? t.state : ''; const cnt = s.length;
  const stale = typeof t.date !== 'string' || staleBySession(t.date, hol);
  const hd = <div className="sm-sec" style={{ marginTop: 18 }}>لما نفس الحالة دي حصلت قبل كده في السهم ده، حصل إيه؟</div>;
  if (stale) return <>{hd}<div className="sm-card fc"><style>{CSS}</style><div className="fx-na"><b>غير متوفر</b><span>حالة السهم قديمة: آخر جلسة عندنا {arD(t.date)} وفيه جلسة أحدث.</span></div></div></>;
  if (t.valid === false) { const h0 = c.history || {}; return <>{hd}<div className="sm-card fc"><style>{CSS}</style><div className="fx-na"><b>غير متوفر</b><span>السهم ليه {L(h0.sessions)} جلسة بس في البيانات المتاحة ({arD(h0.firstDate || h0.from)} إلى {arD(h0.to)})، والحساب محتاج {L(60)} جلسة على الأقل قبل ما أي شرط يتقاس، فمفيش أرقام نعرضها.</span></div></div></>; }
  const b = c.combos[s]; const hs = c.history;
  return <>{hd}<div className="sm-card fc"><style>{CSS}</style>
    {c.test ? <div className="fc-test">اختبار فقط: حالة مفروضة ({s}) مش حالة السهم الحقيقية</div> : null}
    <div className="fc-hist">ده تاريخ أيام فاتت كانت فيها نفس الحالة. مش توقع ومش توصية.</div>
    <div className="fc-td"><b>حالة النهارده ({arD(t.date)}):</b> {cnt === 0 ? 'مفيش شرط اتحقق.' : <>اتحقق {L(cnt)} من {L(3)} شروط: {s.split('').map(x => NAMES[x]).join(' و')}.</>}</div>
    <div className="fx-cs">{['A', 'B', 'C'].map(x => <span key={x} className={'fx-c ' + (s.includes(x) ? 'y' : 'n')}>{s.includes(x) ? '✓' : '✗'} {NAMES[x]}</span>)}</div>
    {cnt === 0 || !b ? <div className="fx-na"><b>الصفحة بتستنى</b><span>النهارده مفيش شرط اتحقق، فمفيش حساب. الصفحة بتستنى لحد ما يتحقق شرط.</span></div> : <>
      <div className="fc-n"><b>{countLine(b.n, hs)}</b></div>
      {b.n > 0 ? <>
        {[5, 10, 20].map(h => <Row key={h} h={h} x={b['h' + h]} base={c.baseline && c.baseline['h' + h]} />)}
        {b.h20 && b.h20.n > 0 && nn(b.h20.worst) && nn(b.h20.best) ? <div className="fc-b">أسوأ مرة: <b className={b.h20.worst >= 0 ? 'up' : 'dn'}>{L(pc(b.h20.worst))}</b> وأحسن مرة: <b className={b.h20.best >= 0 ? 'up' : 'dn'}>{L(pc(b.h20.best))}</b> بعد {L(20)} جلسة.</div> : null}
        {Array.isArray(b.open) && b.open.length > 0 ? <div className="fc-b">{b.open.length === 1 ? 'مرة واحدة' : b.open.length === 2 ? 'مرتين' : <>{L(b.open.length)} {b.open.length <= 10 ? 'مرات' : 'مرة'}</>} لسه ما خلصتش مدتها (مش داخلة في النتايج).</div> : null}</> : null}
      <details className="sm-tip sm-tipd"><summary>التفاصيل والحدود</summary>
        <div className="fc-d">{L(b.n)} حالة بعد ما شلنا المتكرر في أقل من 5 جلسات{nn(b.rawDays) ? <>، من أصل {L(b.rawDays)} يوم كانت فيهم نفس الحالة</> : null}.</div>
        {Array.isArray(b.events20) && b.events20.length > 0 ? <div className="fc-d"><div>آخر {L(b.events20.length)} حالات خلصت مدتها، التغير بعد {L(20)} جلسة:</div><div className="fc-ev">{b.events20.map((e: any, i: number) => nn(e.ret20) ? <span key={i} className="fc-e">{arD(e.date)}: <b className={e.ret20 >= 0 ? 'up' : 'dn'}>{L(pc(e.ret20))}</b></span> : null)}</div></div> : null}
        {Array.isArray(c.limitsAr) ? c.limitsAr.filter((x: any) => typeof x === 'string' && x).map((x: string, i: number) => <div key={i} className="fc-d">{x}.</div>) : null}
        {Array.isArray(b.excluded20) && b.excluded20.length > 0 ? <div className="fc-d">{b.excluded20.length === 1 ? 'حالة واحدة اتشالت' : b.excluded20.length === 2 ? 'حالتين اتشالوا' : <>{L(b.excluded20.length)} {b.excluded20.length <= 10 ? 'حالات اتشالوا' : 'حالة اتشالوا'}</>} من حساب النتايج.</div> : null}
        <div className="fc-d">الشروط: أ = قيمة التداول أكتر من ضعف متوسط آخر 60 جلسة. ب = الإقفال في الثلث الأعلى من مدى اليوم. ج = أكتر من 60% من حجم آخر 10 جلسات في أيام صاعدة والسعر فوق متوسط 20 جلسة.</div>
        <div className="fc-d">الأسعار زي ما هي من المصدر، بدون تكاليف تداول ولا توزيعات. الحالات بتتجمع في موجات فمش مستقلة. الأسهم الحالية بس. وصف تاريخي مش وعد. الأرقام من تاريخ السهم ده لوحده.</div>
      </details></>}
    {hs.shortHistory === true ? <div className="fc-d">تاريخ السهم قصير ({L(hs.sessions)} جلسة)، فالأرقام دي من عينة صغيرة وممكن تتغير كتير مع الأيام.</div> : null}
    <small className="fx-g">{hs.firstDayIsListing === true ? 'من أول يوم تداول للسهم' : (hs.startLabelAr ? String(hs.startLabelAr) : 'من أول يوم في البيانات المتاحة')} ({arD(hs.firstDate || hs.from)}) إلى {arD(hs.to)} ({L(hs.sessions)} جلسة){hs.statsFrom ? <>، والحساب بيبدأ من {arD(hs.statsFrom)}</> : null} · أسعار يومية مجانية من Starta Markets · مش نصيحة</small>
  </div></>;
}
const CSS = `.fc .fc-hist{font-size:12.5px;color:#b4bac4;line-height:1.7}.fc-td{margin:8px 0;font-size:14px;line-height:1.8;color:#edeef0}.fc-n{margin:10px 0 2px;font-size:15px;line-height:1.7;color:#edeef0}.fcb{background:#0b0f12;border-radius:12px;padding:12px;margin-top:10px}.fcb>b{font-size:14px;color:#edeef0}.fc-l{margin:6px 0 8px;font-size:13.5px;line-height:1.7;color:#edeef0}.fc-l b.up,.fc-b b.up,.fc-e b.up{color:#25b896}.fc-l b.dn,.fc-b b.dn,.fc-e b.dn{color:#de575b}.fc-b{margin-top:8px;font-size:12.5px;line-height:1.7;color:#b4bac4}.fc-na{font-size:12.5px;color:#a5aab2;margin-top:6px}.fc-d{margin-top:8px;font-size:12.5px;line-height:1.8;color:#b4bac4}.fc-ev{display:flex;flex-wrap:wrap;gap:4px 14px;margin-top:6px}.fc-e{display:inline-block}.fc summary{min-height:44px;display:flex;align-items:center;gap:8px;padding:6px 0;list-style:none}.fc summary::-webkit-details-marker{display:none}.fc summary::after{content:'\\25C0';font-size:12px}.fc details[open]>summary::after{content:'\\25BC'}.fc-test{background:#de575b;color:#0b0f12;font-weight:700;font-size:13px;padding:6px 10px;border-radius:8px;margin-bottom:8px;text-align:center}.fc .fx-dots{display:flex;gap:4px}.fc .fx-dots i{flex:1;max-width:18px;aspect-ratio:1;border-radius:50%;background:#de575b88}.fc .fx-dots i.u{background:#25b896}.fc .fx-bar{height:16px;background:#de575b88;border-radius:8px;overflow:hidden}.fc .fx-bar i{display:block;height:100%}.fc .fx-cs{display:flex;flex-wrap:wrap;gap:6px}.fc .fx-c{font-size:12px;padding:5px 9px;border-radius:999px;min-height:28px;display:inline-flex;align-items:center}.fc .fx-c.y{background:#25b89622;color:#25b896}.fc .fx-c.n{background:#1e252f;color:#b4bac4}.fc .fx-g{display:block;color:#a5aab2;font-size:12px;line-height:1.5;margin-top:10px}.fc .fx-na{border:1px dashed #3a4350;border-radius:10px;padding:12px;text-align:center;display:flex;flex-direction:column;gap:4px;margin:8px 0}.fc .fx-na b{font-size:17px;color:#b4bac4}.fc .fx-na span{font-size:12px;color:#a5aab2}`;
