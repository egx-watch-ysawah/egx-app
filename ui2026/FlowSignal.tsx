import React from 'react';
import { FlowLive } from './FlowLive';
import { FlowCombo } from './FlowCombo';
// HRHO-only panel: "علامة تجميع". pound verdicts. Numbers come from flow_signal.json (daily) and flow_stats.json (history test, dated).
type Cond = { value: { x: number; ok: boolean }; close: { pos: number; ok: boolean }; flow: { share: number; aboveAvg: boolean | null; ok: boolean } };
type Sig = { asof: string; stocks: Record<string, { date: string; fired: boolean; deduped?: boolean; conditions: Cond }> };
const lj = (u: string) => fetch(u + '?t=' + Date.now(), { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).catch(() => null);
let SP: Promise<Sig | null> | null = null;
const nn = (v: any) => typeof v === 'number' && isFinite(v);
const loadSig = () => SP || (SP = lj('flow_signal.json').then((j: any) => {
  if (!j || typeof j.session !== 'string' || !j.stocks || typeof j.stocks !== 'object') return null;
  const o: Sig = { asof: j.session, stocks: {} };
  for (const k of Object.keys(j.stocks)) { const v = j.stocks[k]; if (!v || !nn(v.volXmed60) || !nn(v.upShare10) || typeof v.date !== 'string') continue;
    const share = Math.round(v.upShare10 * 100); const C = !!v.C_upVolShareAndGtSma20;
    o.stocks[k] = { date: v.date, fired: !!v.rawFired, deduped: !!v.rawFired && !v.fired, conditions: { value: { x: v.volXmed60, ok: !!v.A_valueGt2xMed60 }, close: { pos: 0, ok: !!v.B_closeTopThird }, flow: { share, ok: C, aboveAvg: C ? true : share > 60 ? false : null } } } as any; }
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
export function FlowSignal({ k }: { k: string }) {
  const [sig, setSig] = React.useState<Sig | null | undefined>(undefined);
  const hol = useHolidays();
  React.useEffect(() => { let on = true; loadSig().then(x => on && setSig(x)); return () => { on = false; }; }, []);
  if (sig === undefined || hol === undefined) return null;
  if (sig === null) return <><div className="sm-sec">علامة تجميع (سعر وحجم)</div><div className="sm-card fx"><style>{FX_CSS}</style><div className="fx-na"><b>غير متوفر</b><span>ملف العلامة اليومية مش متاح دلوقتي، فمعرضناش حاجة.</span></div></div><FlowCombo k={k} /></>;
  const me = sig && sig.stocks[k]; const stale = !me || staleBySession(me.date, hol);
  return <><div className="sm-sec">علامة تجميع (سعر وحجم)</div>
    <div className="sm-card fx"><style>{FX_CSS}</style>
      {stale ? <div className="fx-na"><b>غير متوفر</b><span>{me ? 'العلامة قديمة: آخر جلسة عندنا ' + arD(me.date) + ' وفيه جلسة أحدث' : 'العلامة اليومية مش بتغطي السهم ده'}</span></div> : me && <>
        <div className={'fx-v ' + (me.fired ? 'y' : 'g')}><span className="fx-vi">{me.fired ? '▲' : '—'}</span><div><b>{me.fired ? 'فيه علامة تجميع على السهم في آخر جلسة' : 'مفيش علامة تجميع في آخر جلسة'}</b><small>جلسة {arD(me.date)}{me.deduped ? ' · جت بعد علامة قريبة (أقل من 5 جلسات)، فمش بتتعد مرة تانية في الاختبار' : ''}</small><small style={{display:"block"}}>ده وصف للي حصل، مش توقع.</small></div></div>
        <div className="fx-bn"><b>تستفيد منها إزاي:</b> لو العلامة ظهرت، افتح الشارت وراجع السهم بنفسك قبل أي قرار. مش توقع ولا توصية.</div></>}
      <FlowCombo k={k} />
      <FlowLive k={k} />
      <details className="sm-tip sm-tipd"><summary>التفاصيل والاختبار التاريخي</summary>
      {!stale && me && <>
        <div className="fx-g" style={{margin:'0 0 8px',color:'#b4bac4',fontSize:13,lineHeight:1.7}}>إحنا مش شايفين مين بيشتري، دي بصمة سعر وحجم.</div>
        <div className="fx-cs"><span className={'fx-c ' + (me.conditions.value.ok ? 'y' : 'n')}><span>{me.conditions.value.ok ? '✓' : '✗'}&nbsp;{me.conditions.value.x < 0.5 ? <>التداول أقل من نص المعتاد (<bdi dir="ltr">{me.conditions.value.x.toFixed(2)}</bdi> من المعتاد، ولازم أكتر من ضعفين)</> : <>التداول&nbsp;<bdi dir="ltr">{me.conditions.value.x.toFixed(me.conditions.value.x < 1 ? 2 : 1)}</bdi>&nbsp;{me.conditions.value.x < 1 ? 'من المعتاد' : me.conditions.value.x < 2 ? 'ضعف المعتاد' : 'أضعاف المعتاد'}{me.conditions.value.ok ? '' : ' (لازم أكتر من ضعفين)'}</>}</span></span>
          <span className={'fx-c ' + (me.conditions.close.ok ? 'y' : 'n')}>{me.conditions.close.ok ? '✓' : '✗'} الإقفال في الثلث الأعلى من مدى الجلسة (أقل سعر لأعلى سعر)</span>
          <span className={'fx-c ' + (me.conditions.flow.ok ? 'y' : 'n')}><span>{me.conditions.flow.ok ? '✓' : '✗'}&nbsp;حجم آخر 10 جلسات: <bdi dir="ltr">{me.conditions.flow.share}%</bdi> في جلسات صعود (لازم أكتر من <bdi dir="ltr">60%</bdi>){me.conditions.flow.aboveAvg === null ? '' : <> والسعر {me.conditions.flow.aboveAvg ? 'فوق' : 'تحت'} متوسط آخر 20 جلسة (لازم فوقه)</>}</span></span>
          </div>
      </>}
      <small className="fx-g">مش نصيحة</small>
      </details>
    </div></>;
}
const FX_CSS = `.fx-bn{margin-top:8px;font-size:13.5px;line-height:1.8;color:#b4bac4}.fx-bn b{color:#25b896}.fx-hn{margin-top:12px;padding:10px 12px;border-radius:12px;background:#0b0f12;font-size:12.5px;line-height:1.8;color:#b4bac4}.fx-hn b{display:block;color:#edeef0;font-size:13px}.fx-hn span{display:block}.fx-v{display:flex;gap:12px;align-items:center;padding:12px;border-radius:12px;margin-bottom:10px}.fx-v.y{background:#25b89622}.fx-v.g{background:#1e252f}.fx-vi{font-size:22px;font-weight:700;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex:none}.fx-v.y .fx-vi{background:#25b896;color:#0b0f12}.fx-v.g .fx-vi{background:#3a4350;color:#edeef0}
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
