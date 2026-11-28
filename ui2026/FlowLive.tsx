import React from 'react';
import { useStarta, inSessionNow } from '../feed';
import { useHolidays } from './FlowSignal';
import { DATA } from '../data';
// Provisional (intraday) read of the flow signal for the six. Inputs: shipped daily bars (idx/<CODE>.json) + the delayed live feed row
// (price, previous close, volume so far, day high/low, feed time). Condition B uses the day high/low from the same row.
const nn = (v: any) => typeof v === 'number' && isFinite(v);
const barsOf = (k: string): any[] | null => { const b = DATA && DATA.stocks && DATA.stocks[k] && DATA.stocks[k].bars; return Array.isArray(b) ? b.filter((x: any) => Array.isArray(x) && x.length >= 6 && [1, 2, 3, 4, 5].every(i => nn(x[i]))) : null; };
const AM = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
// Feed time in Cairo. Returns null unless it is today's Cairo date, a trading day (Sun-Thu, not in egx_holidays.json), and not before 10:00. No upper bound here: inSessionNow() in feed.ts already limits the end.
export const feedWin = (iso: string, hol?: Set<string>) => { const d = new Date(iso); if (isNaN(+d)) return null; const p: any = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(d).map(x => [x.type, x.value])); const date = p.year + '-' + p.month + '-' + p.day; const wd = new Date(date + 'T00:00:00Z').getUTCDay(); const m = +p.hour * 60 + +p.minute; const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); if (date !== today || wd === 5 || wd === 6 || (hol && hol.has(date)) || m < 600) return null; return { date, time: p.hour + ':' + p.minute, ar: Number(p.day) + ' ' + AM[Number(p.month) - 1] + ' ' + p.year }; };
const med = (a: number[]) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const N = (v: string | number) => <bdi dir="ltr">{v}</bdi>;
export const LIVE_CSS = `.fl{margin:12px 0;padding:12px;border-radius:12px;background:#0b0f12;border:1px solid #1e252f;font-size:13px;line-height:1.8;color:#b4bac4}.fl b{color:#edeef0}.fl .fh{display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-size:15px;color:#edeef0;font-weight:700}.fl .tg{font-size:12px;font-weight:600;padding:2px 10px;border-radius:999px;background:#1e252f;color:#edeef0}.fl .c{display:block;margin-top:4px}.fl .c.y{color:#25b896}.fl .c.n{color:#de575b}.fl .c.u{color:#a5aab2}.fl details{margin-top:8px}.fl summary{min-height:44px;display:flex;align-items:center;cursor:pointer;color:#edeef0}.fl .bn{margin-top:6px;color:#b4bac4}.fl .bn b{color:#25b896}.fl small{display:block;color:#a5aab2;font-size:12px;line-height:1.7}`;
export function FlowLive({ k }: { k: string }) {
  const f = useStarta(); const hol = useHolidays(); const b = React.useMemo(() => barsOf(k), [k]);
  const row = f && f.rows[k]; if (!inSessionNow() || !row || row.src !== 'starta' || row.stale || !b || b.length < 61) return null;
  if (hol === undefined) return null; const t = feedWin(row.at, hol); if (!t) return null;
  const last = b[b.length - 1][0]; if (!(t.date > last)) return null; if (!nn(row.price) || Math.abs(row.price / b[b.length - 1][4] - 1) > 0.25) return null; // sanity bound // only while the shipped bars do not yet hold this session
  if (!nn(row.price) || !nn(row.prev) || !(row.vol > 0)) return null;
  const h = b.slice(-60); const m60 = med(h.map((r: any) => r[4] * r[5])); if (!(m60 > 0)) return null;
  const x = row.price * row.vol / m60, A = x > 2;
  const l9 = b.slice(-9); const pc = b[b.length - 10][4]; let up = 0, tot = 0;
  l9.forEach((r: any, i: number) => { const p = i === 0 ? pc : l9[i - 1][4]; tot += r[5]; if (r[4] > p) up += r[5]; });
  tot += row.vol; if (row.price > row.prev) up += row.vol;
  const shr = tot > 0 ? 100 * up / tot : 0; const share = Math.abs(shr - 60) < 1 ? shr.toFixed(1) : String(Math.round(shr)); const sma = (b.slice(-19).reduce((s: number, r: any) => s + r[4], 0) + row.price) / 20; const C = shr > 60 && row.price > sma;
  const tol = 0.005 * row.price; const okHL = nn(row.hi) && nn(row.lo) && (row.hi as number) > (row.lo as number) && row.price >= (row.lo as number) - tol && row.price <= (row.hi as number) + tol; const pos = okHL ? (row.price - (row.lo as number)) / ((row.hi as number) - (row.lo as number)) : 0; const Bk = okHL && pos >= 2 / 3;
  const cnt = [A, C, okHL && Bk].filter(Boolean).length; const tot3 = okHL ? 3 : 2;
  const ck = (ok: boolean, y: React.ReactNode, n: React.ReactNode) => <span className={'c ' + (ok ? 'y' : 'n')}>{ok ? '✓' : '✗'}&nbsp;{ok ? y : n}</span>;
  return <div className="fl"><style>{LIVE_CSS}</style>
    <div className="fh">قراءة أولية للجلسة دي <span className="tg">أولية</span></div>
    <div>{tot3 === 3 ? <>{N(cnt)} من {N(3)} شروط ظاهرة</> : cnt === 2 ? 'شرطين من شرطين ظاهرين' : cnt === 1 ? 'شرط واحد من شرطين ظاهر' : 'ولا شرط من شرطين ظاهر'} لحد دلوقتي، لكن مش إشارة قبل الحساب النهائي{okHL ? '' : ' (الشرط التالت غير متوفر)'} · سعر Starta الساعة {N(t.time)}.</div>
    <div className="bn"><b>تستفيد منها إزاي:</b> دي نظرة بدري على الجلسة. استنى الحساب النهائي بعد الإقفال قبل ما تعتمد عليها. مش توقع ولا توصية.</div>
    <details className="sm-tip sm-tipd"><summary>التفاصيل والمصدر</summary>
    <div>آخر سعر وصل الساعة {N(t.time)} يوم {t.ar} (متأخر عن السوق). الجلسة دي لسه ما اتحسبتش في الاختبار اليومي، فالرقم أولي لحد ما الحساب النهائي يطلع.</div>
    {ck(A, <>التداول لحد دلوقتي <b>{N(x < 0.5 ? '< 0.5' : x.toFixed(1))}</b> مرة بالنسبة للمعتاد (لازم أكتر من مرتين)</>, <>التداول لحد دلوقتي {x < 0.5 ? 'أقل من نص المعتاد' : <><b>{N(x.toFixed(1))}</b> مرة بالنسبة للمعتاد</>} (لازم أكتر من مرتين، والحجم ممكن لسه بيتجمع)</>)}
    {ck(C, <>حجم آخر 10 جلسات: {N(share + '%')} في جلسات صعود، والسعر فوق متوسط 20 جلسة (وفيه حجم جزء من اليوم)</>, <>حجم آخر 10 جلسات: {N(share + '%')} في جلسات صعود (لازم أكتر من {N('60%')} والسعر فوق متوسط 20 جلسة، وفيه حجم جزء من اليوم)</>)}
    {okHL ? ck(Bk, <>السعر في الثلث الأعلى من مدى الجلسة لحد دلوقتي (أقل سعر لأعلى سعر)</>, <>السعر مش في الثلث الأعلى من مدى الجلسة لحد دلوقتي (أقل سعر لأعلى سعر)</>) : <span className="c u" style={{ color: "#a5aab2" }}>— شرط الثلث الأعلى: غير متوفر. المصدر ما بعتش أعلى وأقل سعر للجلسة دي، أو هم متساويين أو السعر خارج مداهم.</span>}
    <div style={{ marginTop: 6 }}>مش هنقول "فيه إشارة" قبل الحساب النهائي، لأن السعر والمدى لسه بيتغيروا. الحكم الرسمي بيطلع بعد ما الجلسة تخلص وتتحسب.</div>
      <small>الحجم بيتجمع أسرع في أول الجلسة من باقيها، فمقارنة حجم جزء من اليوم بيوم كامل مش متكافئة. ما بنتوقعش الحجم لآخر اليوم، والرقم هيتغير لحد الإقفال.</small>
      <small>القيمة المعتادة = وسيط (سعر الإقفال في الحجم) لآخر 60 جلسة كاملة من Starta Markets (أسعار يومية مجانية متأخرة). السعر والحجم والمدى لحد دلوقتي من نفس المصدر. مفيش اختبار تاريخي للقراءة الأولية دي. مش نصيحة.</small></details></div>;
}
