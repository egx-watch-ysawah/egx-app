import React from 'react';
import { DATA } from '../data';
// HRHO-only panel: "علامة تجميع". pound verdicts. Numbers come from flow_signal.json (daily) and flow_stats.json (history test, dated).
type Cond = { value: { x: number; ok: boolean }; close: { pos: number; ok: boolean }; flow: { share: number; aboveAvg: boolean | null; ok: boolean } };
type Sig = { asof: string; stocks: Record<string, { date: string; fired: boolean; deduped?: boolean; conditions: Cond }> };
type Stats = { tested: string; glitch?: string; perStock: Record<string, any> };
const lj = (u: string) => fetch(u + '?t=' + Date.now(), { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).catch(() => null);
let SP: Promise<Sig | null> | null = null, TP: Promise<Stats | null> | null = null;
const nn = (v: any) => typeof v === 'number' && isFinite(v);
const arDm = (iso: string) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); return m ? M[Number(m[2]) - 1] + ' ' + m[1] : ''; };
const loadSig = () => SP || (SP = lj('flow_signal.json').then((j: any) => {
  if (!j || typeof j.session !== 'string' || !j.stocks || typeof j.stocks !== 'object') return null;
  const o: Sig = { asof: j.session, stocks: {} };
  for (const k of Object.keys(j.stocks)) { const v = j.stocks[k]; if (!v || !nn(v.volXmed60) || !nn(v.upShare10) || typeof v.date !== 'string') continue;
    const share = Math.round(v.upShare10 * 100); const C = !!v.C_upVolShareAndGtSma20;
    o.stocks[k] = { date: v.date, fired: !!v.rawFired, deduped: !!v.rawFired && !v.fired, conditions: { value: { x: v.volXmed60, ok: !!v.A_valueGt2xMed60 }, close: { pos: 0, ok: !!v.B_closeTopThird }, flow: { share, ok: C, aboveAvg: C ? true : share > 60 ? false : null } } } as any; }
  return o; }));
const loadStats = () => TP || (TP = lj('flow_stats.json').then((j: any) => {
  if (!j || !j.perStock || typeof j.perStock !== 'object') return null;
  const o: any = { tested: (j.asof || '').slice(0, 10), glitch: j.rule && typeof j.rule.glitchFilterAr === 'string' ? j.rule.glitchFilterAr : '', perStock: {} };
  for (const k of Object.keys(j.perStock)) { const v = j.perStock[k]; if (!v || !v.history || !v.signals) continue;
    const rows = [5, 10, 20].map(h => { const x = v['h' + h]; return x && { h, win: x.win, winAny: x.baseWin, avg: x.mean, avgAny: x.baseMean }; }).filter(Boolean);
    const r = v.recentClosedSummary;
    o.perStock[k] = { signals: v.signals.total, sessions: nn(v.history.sessions) ? v.history.sessions : null, sinceLabel: arDm(v.history.from), toLabel: arD(v.history.to), rows, worst: (v.worst || []).filter((w: any) => nn(w.ret20)).map((w: any) => ({ v: w.ret20, d: arD(w.date) })), raw: nn(v.signals.rawDaysAllTrue) ? v.signals.rawDaysAllTrue : null, firstLabel: typeof v.signals.firstSignal === 'string' ? arDm(v.signals.firstSignal) : Array.isArray(v.fireDates) && v.fireDates.length ? arDm([...v.fireDates].sort()[0]) : '', recent: r && nn(r.n) ? { n: r.n, wins: r.wins, losses: r.losses } : null }; }
  return o; }));
const M = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const arD = (iso: string) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); return m ? Number(m[3]) + ' ' + M[Number(m[2]) - 1] + ' ' + m[1] : String(iso || ''); };
// Data counts as current until the session AFTER its own date has closed (EGX trades Sun-Thu, closes about 14:30 Cairo).
// Official holidays come from egx_holidays.json ({ "dates": ["YYYY-MM-DD", ...] }); until the data side supplies it the list is empty and only Fri/Sat are skipped.
let HP: Promise<Set<string>> | null = null;
export const loadHolidays = () => HP || (HP = fetch('egx_holidays.json?t=' + Date.now(), { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).catch(() => null).then((j: any) => new Set<string>(j && Array.isArray(j.dates) ? j.dates.filter((x: any) => typeof x === 'string') : [])));
export const staleBySession = (iso: string, hol?: Set<string>) => { const f = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()); const g = (t: string) => f.find(x => x.type === t)!.value; const today = g('year') + '-' + g('month') + '-' + g('day'); const hr = Number(g('hour'));
  const d = new Date(iso.slice(0, 10) + 'T00:00:00Z'); do { d.setUTCDate(d.getUTCDate() + 1); } while (d.getUTCDay() === 5 || d.getUTCDay() === 6 || (hol && hol.has(d.toISOString().slice(0, 10)))); const nx = d.toISOString().slice(0, 10); return today > nx || (today === nx && hr >= 15); };
export const useHolidays = () => { const [h, setH] = React.useState<Set<string> | undefined>(undefined); React.useEffect(() => { let on = true; loadHolidays().then(x => on && setH(x)); return () => { on = false; }; }, []); return h; };
const sess = (h: number) => (h <= 10 ? 'جلسات' : 'جلسة');
const N = (v: number) => <bdi dir="ltr">{v}</bdi>;
const verdict = (d: number): [any, string] => { const g = Math.abs(d).toFixed(1); return d >= 1 ? [<>العلامة زادت <bdi dir="ltr">{g}</bdi> جنيه</>, 'y'] : d > -1 ? [<>مفيش فرق يتحس: <bdi dir="ltr">{g}</bdi> جنيه بس</>, 'g'] : [<>العلامة نقصت <bdi dir="ltr">{g}</bdi> جنيه</>, 'n']; };
const Bar = ({ label, v, max, hi }: { label: string; v: number; max: number; hi?: boolean }) => <div className="fx-dr"><span className="fx-dl">{label}</span>
  <div className="fx-bar" dir="ltr"><i style={{ width: Math.max(2, (v - 100) / (max - 100) * 100) + '%', background: hi ? '#25b896' : '#6b7380' }} /></div><b className="fx-dn" dir="ltr">{v.toFixed(1)}</b></div>;
function Block({ r, max }: { r: any; max: number }) {
  const m1 = 100 * (1 + r.avg / 100), m2 = 100 * (1 + r.avgAny / 100); const v = verdict(m1 - m2);
  return <div className="fx-b"><div className="fx-bh"><b>لو بعته بعد {N(r.h)} {sess(r.h)}</b></div>
    <Bar label="اشتريت لما العلامة ظهرت" v={m1} max={max} hi /><Bar label="اشتريت في يوم عادي من غير علامة" v={m2} max={max} /><div className={'fx-chip ' + v[1]} style={{marginTop:8,display:'inline-block'}}>{v[0]}</div>
    <div className="fx-g" style={{marginTop:6,fontSize:12,color:'#a5aab2',lineHeight:1.7}}>المرات اللي كسب فيها بعد العلامة: <bdi dir="ltr">{r.win}%</bdi> ومن غير علامة: <bdi dir="ltr">{r.winAny}%</bdi>{r.win <= r.winAny ? '، يعني الكسب مش أكتر.' : '.'}</div></div>;
}
export function FlowSignal({ k }: { k: string }) {
  const [sig, setSig] = React.useState<Sig | null | undefined>(undefined);
  const [st, setSt] = React.useState<Stats | null | undefined>(undefined); const hol = useHolidays();
  React.useEffect(() => { let on = true; loadSig().then(x => on && setSig(x)); loadStats().then(x => on && setSt(x)); return () => { on = false; }; }, []);
  if (sig === undefined || st === undefined || hol === undefined) return null;
  if (sig === null) return <><div className="sm-sec">علامة تجميع (سعر وحجم)</div><div className="sm-card fx"><style>{FX_CSS}</style><div className="fx-na"><b>غير متوفر</b><span>ملف العلامة اليومية مش متاح دلوقتي، فمعرضناش حاجة.</span></div></div></>;
  const ps0 = st && st.perStock && st.perStock[k]; const ps = ps0 || {};
  const me = sig && sig.stocks[k]; const stale = !me || staleBySession(me.date, hol);
  const rows: any[] = (Array.isArray(ps.rows) ? ps.rows : []).filter((r: any) => [r.h, r.win, r.winAny, r.avg, r.avgAny].every(nn));
  const r20 = rows.find(r => r.h === 20); const ord = [...rows].sort((a, b) => b.h - a.h);
  const small = nn(ps.signals) && ps.signals < 30; const hist = rows.length > 0 && !small;
  const noEdge = hist && ord.every(r => (100 * (1 + r.avg / 100) - 100 * (1 + r.avgAny / 100)) < 1);
  const mx = Math.max(100.5, ...rows.map(r => 100 * (1 + Math.max(r.avg, r.avgAny) / 100)));
  return <><div className="sm-sec">علامة تجميع (سعر وحجم)</div>
    <div className="sm-card fx"><style>{FX_CSS}</style>
      {stale ? <div className="fx-na"><b>غير متوفر</b><span>{me ? 'العلامة قديمة: آخر جلسة عندنا ' + arD(me.date) + ' وفيه جلسة أحدث' : 'العلامة مش متاحة دلوقتي'}</span></div> : me && <>
        <div className="fx-g" style={{margin:'0 0 8px',color:'#b4bac4',fontSize:13,lineHeight:1.7}}>إحنا مش شايفين مين بيشتري، دي بصمة سعر وحجم.</div>
        <div className={'fx-v ' + (me.fired ? 'y' : 'g')}><span className="fx-vi">{me.fired ? '▲' : '—'}</span><div><b>{me.fired ? 'فيه علامة تجميع على السهم في آخر جلسة' : 'مفيش علامة تجميع في آخر جلسة'}</b><small>جلسة {arD(me.date)}{me.deduped ? ' · جت بعد علامة قريبة (أقل من 5 جلسات)، فمش بتتعد مرة تانية في الاختبار' : ''}</small></div></div>
        <div className="fx-cs"><span className={'fx-c ' + (me.conditions.value.ok ? 'y' : 'n')}><span>{me.conditions.value.ok ? '✓' : '✗'}&nbsp;{me.conditions.value.x < 0.5 ? <>التداول أقل من نص المعتاد (<bdi dir="ltr">{me.conditions.value.x.toFixed(2)}</bdi> من المعتاد، ولازم أكتر من ضعفين)</> : <>التداول&nbsp;<bdi dir="ltr">{me.conditions.value.x.toFixed(me.conditions.value.x < 1 ? 2 : 1)}</bdi>&nbsp;{me.conditions.value.x < 1 ? 'من المعتاد' : me.conditions.value.x < 2 ? 'ضعف المعتاد' : 'أضعاف المعتاد'}{me.conditions.value.ok ? '' : ' (لازم أكتر من ضعفين)'}</>}</span></span>
          <span className={'fx-c ' + (me.conditions.close.ok ? 'y' : 'n')}>{me.conditions.close.ok ? '✓' : '✗'} الإقفال في الثلث الأعلى من مدى الجلسة (أقل سعر لأعلى سعر)</span>
          <span className={'fx-c ' + (me.conditions.flow.ok ? 'y' : 'n')}><span>{me.conditions.flow.ok ? '✓' : '✗'}&nbsp;حجم آخر 10 جلسات: <bdi dir="ltr">{me.conditions.flow.share}%</bdi> في جلسات صعود (لازم أكتر من <bdi dir="ltr">60%</bdi>){me.conditions.flow.aboveAvg === null ? '' : <> والسعر {me.conditions.flow.aboveAvg ? 'فوق' : 'تحت'} متوسط آخر 20 جلسة (لازم فوقه)</>}</span></span>
          </div></>}
      {small ? <div className="fx-na"><b>عينة صغيرة، مش كفاية</b><span>العلامة ظهرت {ps.signals} مرات بس في السهم ده من {ps.sinceLabel}. ده قليل، فمش هنقول إنها نفعت أو لا. مفيش أرقام ولا حكم.</span></div> : rows.length === 0 ? <div className="fx-na"><b>اختبار العلامة على تاريخ السهم ده: غير متوفر</b><span>لسه ما اتعملش اختبار على أسعار {k} القديمة، فمفيش أرقام عن اللي حصل بعد العلامة. العلامة نفسها (فوق) محسوبة من بيانات آخر جلسة.</span></div> : <>
      <div className="fx-t">هل العلامة بتفيد؟</div>
      <div className="fx-g" style={{margin:'4px 0 8px',color:'#b4bac4',lineHeight:1.7}}>نسأل: لو اشتريت من غير علامة، هتكسب نفس الكسب؟ لو أيوه، العلامة ملهاش لازمة. لو كسبت أقل، العلامة بتفيد. الأرقام دي بتقول: لو اشتريت بـ <bdi dir="ltr">100</bdi> جنيه، بقوا كام في المتوسط بعد المدة. "كسب" معناها إن سعر السهم بعد المدة بقى أعلى من يوم الشراء. (العلامة ظهرت في السهم ده {N(ps.signals)} مرة قبل كده)</div>
      {ord.map(r => <Block key={r.h} r={r} max={mx} />)}
      {noEdge && <div className="fx-w"><b>الإشارة ما ضافتش حاجة على السهم ده تاريخيًا</b></div>}
      {Array.isArray(ps.worst) && ps.worst.length > 0 && <div className="fx-w"><b>أسوأ حاجة حصلت بعد العلامة: <bdi dir="ltr" className="dn">{(100 + Math.min(...ps.worst.filter((w: any) => nn(w.v)).map((w: any) => w.v))).toFixed(0)}</bdi> جنيه رجعلك من كل <bdi dir="ltr">100</bdi></b>
        {ps.worst.filter((w: any) => nn(w.v)).map((w: any, i: number) => <span key={i}>{w.d}: بقوا <b dir="ltr" className="dn">{(100 + w.v).toFixed(0)}</b></span>)}</div>}
      <div className="fx-hn"><b>خد بالك</b>
        <span>الفترة المختبرة: البيانات بتبدأ من {ps.sinceLabel}، وأول علامة كانت {ps.firstLabel || 'غير متوفر'}، ولحد {ps.toLabel || 'غير متوفر'}. العلامة ظهرت {N(ps.signals)} مرة{ps.raw ? <>، من أصل <bdi dir="ltr">{ps.raw}</bdi> يوم استوفى الشروط قبل ما نشيل المتكرر في أقل من 5 جلسات</> : ''}.</span>
        {st && st.glitch ? <span>{st.glitch}</span> : null}
        {ps.sessions ? <span>الاختبار ده على {N(ps.sessions)} جلسة من Starta{(() => { const st = (DATA as any).stocks && (DATA as any).stocks[k]; const hc = st ? st.historyCount : null; if (!nn(hc)) return ''; return hc <= 760 ? (ps.sessions > hc ? <>، وصفحة السهم بتعرض <bdi dir="ltr">{hc}</bdi> جلسة بس</> : '') : ps.sessions > 760 ? <>، أطول من آخر 3 سنين اللي بتعرضهم صفحة السهم</> : ''; })()}.</span> : null}
        <span>الأسعار المختبرة خام: مش معدلة بتوزيعات الأرباح ولا بالتقسيمات، وبدون عمولات ومصاريف تداول.</span>
        <span>الأسهم المختبرة هي الموجودة دلوقتي بس، فالنتايج ممكن تطلع أحلى من الحقيقة.</span>
        <span>العلامات بتيجي ورا بعض في فترات قريبة، فالمرات مش مستقلة عن بعض.</span>
        <span>{ps.recent ? <>آخر <bdi dir="ltr">{ps.recent.n}</bdi> مرات اتقفلت بعد 20 جلسة: <bdi dir="ltr">{ps.recent.wins}</bdi> كسبت و<bdi dir="ltr">{ps.recent.losses}</bdi> خسرت. ده السجل القريب، ممكن يختلف عن السجل الطويل.</> : 'السجل القريب (آخر المرات): غير متوفر للسهم ده.'}</span></div>
      </>}
      <small className="fx-g">{!hist ? 'مش نصيحة' : <>اللي حصل قبل كده، مش وعد · اتجرب {arD(st ? st.tested : '')} على بيانات لحد {ps && ps.toLabel ? ps.toLabel : 'غير متوفر'} · أسعار يومية مجانية من Starta Markets · مش نصيحة</>}</small>
    </div></>;
}
const FX_CSS = `.fx-hn{margin-top:12px;padding:10px 12px;border-radius:12px;background:#0b0f12;font-size:12.5px;line-height:1.8;color:#b4bac4}.fx-hn b{display:block;color:#edeef0;font-size:13px}.fx-hn span{display:block}.fx-v{display:flex;gap:12px;align-items:center;padding:12px;border-radius:12px;margin-bottom:10px}.fx-v.y{background:#25b89622}.fx-v.g{background:#1e252f}.fx-vi{font-size:22px;font-weight:700;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex:none}.fx-v.y .fx-vi{background:#25b896;color:#0b0f12}.fx-v.g .fx-vi{background:#3a4350;color:#edeef0}
.fx-v b{display:block;font-size:16px;color:#edeef0;line-height:1.4}.fx-v small{color:#b4bac4;font-size:12px}
.fx-cs{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px}.fx-c{font-size:12px;padding:5px 9px;border-radius:999px;min-height:28px;display:inline-flex;align-items:center}.fx-c.y{background:#25b89622;color:#25b896}.fx-c.n{background:#de575b22;color:#de575b}.fx-c.g{background:#1e252f;color:#b4bac4}
.fx-t{font-size:14px;font-weight:600;color:#edeef0;margin:16px 0 4px;line-height:1.5;border-top:1px solid #1e252f;padding-top:14px}
.fx-b{background:#0b0f12;border-radius:12px;padding:12px;margin-top:10px}.fx-bh{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px}.fx-bh b{font-size:14px;color:#edeef0}
.fx-chip{font-size:12px;padding:4px 10px;border-radius:999px;white-space:nowrap}.fx-chip.y{background:#25b89622;color:#25b896}.fx-chip.g{background:#1e252f;color:#b4bac4}.fx-chip.n{background:#de575b22;color:#de575b}
.fx-dr{display:grid;grid-template-columns:104px 1fr auto;align-items:center;gap:8px;margin:7px 0}.fx-dl{font-size:12px;color:#b4bac4;line-height:1.3}.fx-dn{font-size:12.5px;color:#edeef0;white-space:nowrap}
.fx-bar{height:16px;background:#111822;border-radius:8px;overflow:hidden}.fx-bar i{display:block;height:100%;border-radius:8px}.fx-dots{display:flex;gap:4px}.fx-dots i{flex:1;max-width:18px;aspect-ratio:1;border-radius:50%;background:#de575b44}.fx-dots i.u{background:#25b89688}.fx-dots i.u.hi{background:#25b896}
.fx-m{font-size:12.5px;color:#b4bac4;margin-top:8px;display:flex;flex-wrap:wrap;gap:4px;align-items:baseline}.fx-m b{font-size:15px;color:#edeef0}.fx-m b.up{color:#25b896}.fx-m b.dn{color:#de575b}
.fx-w{margin-top:12px;font-size:12.5px;color:#b4bac4;display:flex;flex-wrap:wrap;gap:4px 10px;align-items:baseline}.fx-w b{color:#edeef0}.fx-w b.dn{color:#de575b;font-size:15px}
.fx-tr{margin-top:14px;padding-top:12px;border-top:1px solid #1e252f;font-size:12.5px;line-height:1.6;color:#b4bac4}.fx-tr b{color:#edeef0}
.fx-g{display:block;color:#a5aab2;font-size:12px;line-height:1.5;margin-top:10px}.fx-na{border:1px dashed #3a4350;border-radius:10px;padding:12px;text-align:center;display:flex;flex-direction:column;gap:4px;margin:8px 0}.fx-na b{font-size:17px;color:#b4bac4}.fx-na span{font-size:12px;color:#a5aab2}`;
