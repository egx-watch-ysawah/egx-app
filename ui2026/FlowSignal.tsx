import React from 'react';
// Institutional-accumulation signal panel. Numbers only; every figure has its date.
// flow_signal.json = daily offline compute (scripts/flow_signal.py). flow_stats.json = history test (static, stamped).
type Cond = { value: { x: number; ok: boolean }; close: { pos: number; ok: boolean }; flow: { share: number; aboveAvg: boolean; ok: boolean } };
type Sig = { asof: string; stocks: Record<string, { date: string; fired: boolean; conditions: Cond }> };
type Stats = { tested: string; aggregate: any; perStock: Record<string, any> };
const lj = (u: string) => fetch(u + '?t=' + Date.now(), { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).catch(() => null);
let SP: Promise<Sig | null> | null = null, TP: Promise<Stats | null> | null = null;
const nn = (v: any) => typeof v === 'number' && isFinite(v);
const loadSig = () => SP || (SP = lj('flow_signal.json').then((j: any) => (j && typeof j.asof === 'string' && j.stocks && typeof j.stocks === 'object' ? j : null)));
const loadStats = () => TP || (TP = lj('flow_stats.json').then((j: any) => (j && j.aggregate && ['win', 'winAny', 'avg', 'avgAny', 'median', 'p25', 'p10', 'worst', 'signals', 'lossOver10', 'lossOver20'].every(k => nn(j.aggregate[k])) ? j : null)));
const M = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const arD = (iso: string) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); return m ? Number(m[3]) + ' ' + M[Number(m[2]) - 1] + ' ' + m[1] : String(iso || ''); };
const sp = (v: number, d = 1) => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(d) + '%';
const age = (iso: string) => Math.floor((Date.now() - Date.parse(iso + 'T00:00:00Z')) / 864e5);
const Tick = ({ ok }: { ok: boolean }) => <span className={'fl-k ' + (ok ? 'y' : 'n')}>{ok ? '✓' : '✗'}</span>;
function Pair({ label, win, winAny, avg, avgAny }: { label: string; win: number; winAny: number; avg: number; avgAny: number }) {
  return <div className="fl-pr"><div className="fl-pl">{label}</div>
    <div className="fl-bar" dir="ltr"><i style={{ width: win + '%', background: win >= winAny ? '#25b896' : '#de575b' }} /><u style={{ left: winAny + '%' }} /></div>
    <div className="fl-nums" dir="ltr"><b>{win}%</b><span dir="rtl">أي يوم <bdi dir="ltr">{winAny}%</bdi></span><b className={avg >= 0 ? 'up' : 'dn'}>{sp(avg)}</b><span dir="rtl">أي يوم <bdi dir="ltr">{sp(avgAny, 2)}</bdi></span></div></div>;
}
function Range({ a }: { a: any }) {
  const L = -20, H = 10, X = (v: number) => ((Math.max(L, Math.min(H, v)) - L) / (H - L) * 100);
  return <div className="fl-rg"><div className="fl-rb" dir="ltr"><div className="fl-neg" style={{ width: X(0) + '%' }} /><div className="fl-pos" style={{ left: X(0) + '%', right: 0 }} />
    <em style={{ left: X(0) + '%' }} className="z" /><em style={{ left: X(a.p10) + '%', background: '#de575b' }} /><em style={{ left: X(a.p25) + '%', background: '#de575b', opacity: .7 }} /><em style={{ left: X(a.median) + '%', background: '#25b896' }} /></div>
    <div className="fl-ax" dir="ltr"><span style={{ left: X(a.p10) + '%' }}>{sp(a.p10)}</span><span style={{ left: X(a.p25) + '%', top: 14 }}>{sp(a.p25)}</span><span style={{ left: X(0) + '%' }}>0</span><span style={{ left: X(a.median) + '%', top: 14, color: '#25b896' }}>{sp(a.median, 2)}</span></div></div>;
}
export function FlowSignal({ k }: { k: string }) {
  const [sig, setSig] = React.useState<Sig | null | undefined>(undefined);
  const [st, setSt] = React.useState<Stats | null | undefined>(undefined);
  React.useEffect(() => { let on = true; loadSig().then(x => on && setSig(x)); loadStats().then(x => on && setSt(x)); return () => { on = false; }; }, []);
  if (sig === undefined || st === undefined) return null;
  const me = sig && sig.stocks[k]; const stale = !me || age(me.date) > 6;
  const ag = st && st.aggregate; const ps = st && st.perStock && st.perStock[k];
  return <><div className="sm-sec">تجميع المؤسسات</div>
    <div className="sm-card fl"><style>{FL_CSS}</style>
      <small className="fl-g">اللي حصل تاريخيًا، مش وعد{st ? ' · اتختبر ' + arD(st.tested) + ' · Starta Markets (بيانات متأخرة)' : ''}</small>
      {stale ? <div className="fl-na"><b>غير متوفر</b><span>{me ? 'إشارة اليوم قديمة، آخر بيانات ' + arD(me.date) : 'إشارة اليوم مش متاحة للسهم ده' + (sig ? '، آخر تحديث للملف ' + arD(sig.asof) : '')}</span></div> : me && <>
        <div className="fl-hd"><b>إشارة آخر جلسة <bdi dir="ltr">{arD(me.date)}</bdi></b><span className={'fl-bd ' + (me.fired ? 'y' : 'g')}>{me.fired ? '▲ فيه إشارة' : 'مفيش إشارة'}</span></div>
        <div className="fl-c"><Tick ok={me.conditions.value.ok} /><span>قيمة التداول <bdi dir="ltr">{me.conditions.value.x.toFixed(1)}</bdi> ضعف المعتاد (لازم أكتر من ضعفين)</span></div>
        <div className="fl-c"><Tick ok={me.conditions.close.ok} /><span>الإقفال عند <bdi dir="ltr">{Math.round(me.conditions.close.pos * 100)}%</bdi> من مدى اليوم (لازم في الثلث الأعلى)</span></div>
        <div className="fl-c"><Tick ok={me.conditions.flow.ok} /><span><bdi dir="ltr">{me.conditions.flow.share}%</bdi> من حجم آخر 10 جلسات في أيام صاعدة، والسعر {me.conditions.flow.aboveAvg ? 'فوق' : 'تحت'} متوسط 20 جلسة</span></div>
        <div className="fl-c"><span className="fl-k na">—</span><span className="fl-m">أرخص من القطاع: غير متوفر (مش ممكن نختبره تاريخيًا)</span></div></>}
      {!ag ? <div className="fl-na"><b>غير متوفر</b><span>نتيجة الاختبار التاريخي مش متاحة</span></div> : <>
        {ps && nn(ps.signals) && Array.isArray(ps.rows) && <div className="fl-sec"><div className="fl-t">السهم ده: <bdi dir="ltr">{ps.signals}</bdi> إشارة من {arD(ps.since + '-01').replace(/^1 /, '')}</div>
          {ps.rows.filter((r: any) => [r.win, r.winAny, r.avg, r.avgAny].every(nn)).map((r: any) => <Pair key={r.h} label={'بعد ' + r.h + ' جلسات'} win={r.win} winAny={r.winAny} avg={r.avg} avgAny={r.avgAny} />)}
          {Array.isArray(ps.worst) && <div className="fl-w">{ps.worst.map((w: any, i: number) => <span key={i} dir="ltr" className="dn">▼ {sp(w.v, 0)} <bdi dir="rtl">{w.d}</bdi></span>)}</div>}</div>}
        <div className="fl-sec"><div className="fl-t">{ps ? 'كل الأسهم' : 'السهم ده مفيش له اختبار لوحده، دي نتيجة'} <bdi dir="ltr">{ag.stocks || 96}</bdi> سهم · <bdi dir="ltr">{Number(ag.signals).toLocaleString('en-US')}</bdi> إشارة · بعد 20 جلسة</div>
          <Pair label="إشارة مقابل أي يوم" win={ag.win} winAny={ag.winAny} avg={ag.avg} avgAny={ag.avgAny} />
          <Range a={ag} />
          <div className="fl-t3"><div><b className="up" dir="ltr">{sp(ag.median, 2)}</b><span>الوسيط</span></div><div><b className="dn" dir="ltr">{ag.lossOver10}%</b><span>خسروا أكتر من 10%</span></div><div><b className="dn" dir="ltr">{ag.lossOver20}%</b><span>خسروا أكتر من 20%</span></div>
            {nn(ag.positiveStocks) && <div><b className="up" dir="ltr">{ag.positiveStocks} / {ag.testedStocks}</b><span>سهم متوسطه طلع</span></div>}<div><b className="dn" dir="ltr">{sp(ag.worst)}</b><span>أسوأ حالة</span></div><div><b className="dn" dir="ltr">{100 - ag.win}%</b><span>ما كسبتش</span></div></div></div></>}
    </div></>;
}
const FL_CSS = `.fl-g{display:block;color:#a5aab2;font-size:12px;line-height:1.5;margin-bottom:6px}.fl-hd{display:flex;justify-content:space-between;align-items:center;gap:8px;min-height:44px}.fl-hd b{font-size:14px;color:#edeef0}
.fl-bd{padding:6px 12px;border-radius:999px;font-size:13px;font-weight:700;white-space:nowrap}.fl-bd.y{background:#25b89626;color:#25b896}.fl-bd.g{background:#1e252f;color:#b4bac4}
.fl-c{display:flex;align-items:center;gap:10px;font-size:13px;line-height:1.5;color:#edeef0;margin:8px 0}.fl-m{color:#b4bac4}.fl-k{flex:none;width:22px;height:22px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:13px;font-weight:700}
.fl-k.y{background:#25b89626;color:#25b896}.fl-k.n{background:#de575b26;color:#de575b}.fl-k.na{background:#1e252f;color:#b4bac4}
.fl-sec{border-top:1px solid #1e252f;margin-top:14px;padding-top:12px}.fl-t{font-size:13px;font-weight:600;color:#edeef0;margin-bottom:8px}.fl-pr{margin:10px 0}.fl-pl{font-size:12px;color:#b4bac4;margin-bottom:4px}
.fl-bar{position:relative;height:14px;background:#0b0f12;border-radius:7px;overflow:visible}.fl-bar i{display:block;height:100%;border-radius:7px}.fl-bar u{position:absolute;top:-3px;width:2px;height:20px;background:#a5aab2}
.fl-nums{display:flex;justify-content:space-between;gap:6px;font-size:12px;margin-top:4px;color:#b4bac4}.fl-nums b{font-size:13px;color:#edeef0}.fl-nums b.up,.fl-t3 b.up{color:#25b896}.fl-nums b.dn,.fl-t3 b.dn,.fl-w .dn{color:#de575b}
.fl-w{display:flex;gap:14px;flex-wrap:wrap;font-size:12.5px;margin-top:8px}
.fl-rg{margin:14px 0 4px}.fl-rb{position:relative;height:14px;border-radius:7px;overflow:visible}.fl-neg{position:absolute;left:0;top:0;height:100%;background:#de575b33;border-radius:7px 0 0 7px}.fl-pos{position:absolute;top:0;height:100%;background:#25b89633;border-radius:0 7px 7px 0}
.fl-rb em{position:absolute;top:-1px;width:14px;height:16px;margin-left:-7px;border-radius:50%;border:2px solid #111822;box-sizing:border-box}.fl-rb em.z{width:2px;height:22px;top:-4px;margin-left:-1px;border:0;border-radius:0;background:#a5aab2}
.fl-ax{position:relative;height:34px;margin-top:6px;font-size:11px;color:#b4bac4}.fl-ax span{position:absolute;top:0;transform:translateX(-50%);white-space:nowrap}
.fl-t3{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:10px}.fl-t3 div{background:#0b0f12;border-radius:10px;padding:8px 4px;text-align:center}.fl-t3 b{display:block;font-size:16px}.fl-t3 span{font-size:10.5px;color:#a5aab2}
.fl-na{border:1px dashed #3a4350;border-radius:10px;padding:12px;text-align:center;display:flex;flex-direction:column;gap:4px;margin:8px 0}.fl-na b{font-size:17px;color:#b4bac4}.fl-na span{font-size:12px;color:#a5aab2}`;
