import React, { useEffect, useState } from 'react';

// EGX session: Sunday to Thursday, 10:00 to 14:15 Cairo time (stock-market-hours.com/markets/egx, read 2026-11-27).
// Holidays: official national holidays 2026 from presidency.eg (read 2026-11-27). Dates after 2026 are NOT known here: no invented dates.
const OPEN = 10 * 60, CLOSE = 14 * 60 + 15;
const H_YEAR = 2026;
const HOL: Record<string, string> = {
  '2026-01-07': 'عيد الميلاد المجيد', '2026-01-29': 'ثورة 25 يناير وعيد الشرطة',
  '2026-03-19': 'عيد الفطر', '2026-03-20': 'عيد الفطر', '2026-03-21': 'عيد الفطر', '2026-03-22': 'عيد الفطر', '2026-03-23': 'عيد الفطر',
  '2026-04-13': 'شم النسيم', '2026-04-25': 'عيد تحرير سيناء', '2026-05-07': 'عيد العمال', '2026-05-26': 'وقفة عرفات',
  '2026-05-27': 'عيد الأضحى', '2026-05-28': 'عيد الأضحى', '2026-05-29': 'عيد الأضحى', '2026-05-30': 'عيد الأضحى', '2026-05-31': 'عيد الأضحى',
  '2026-06-18': 'رأس السنة الهجرية', '2026-07-02': 'ثورة 30 يونيو', '2026-07-23': 'ثورة 23 يوليو',
  '2026-08-27': 'المولد النبوي', '2026-10-06': 'عيد القوات المسلحة',
};
const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

const cairo = (d: Date) => {
  const p = new Intl.DateTimeFormat('en-US', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(d);
  const g = (t: string) => Number(p.find(x => x.type === t)!.value);
  return { y: g('year'), m: g('month'), d: g('day'), min: g('hour') * 60 + g('minute') };
};
const key = (y: number, m: number, d: number) => y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0');
const dow = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d)).getUTCDay();
const addDay = (y: number, m: number, d: number) => { const t = new Date(Date.UTC(y, m - 1, d + 1)); return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() }; };
const trading = (y: number, m: number, d: number) => { const w = dow(y, m, d); return w <= 4 && !HOL[key(y, m, d)]; };
const fmtD = (y: number, m: number, d: number) => DAYS[dow(y, m, d)] + ' ' + d + ' ' + MONTHS[m - 1];
const hm = (min: number) => { const h = Math.floor(min / 60), mm = min % 60; return (h > 12 ? h - 12 : h) + ':' + String(mm).padStart(2, '0') + (h >= 12 ? ' م' : ' ص'); };

export function marketState(now: Date) {
  const c = cairo(now);
  const hol = HOL[key(c.y, c.m, c.d)];
  const today = trading(c.y, c.m, c.d);
  let next = { y: c.y, m: c.m, d: c.d };
  let unknown = false;
  if (!(today && c.min < OPEN)) { next = addDay(c.y, c.m, c.d); }
  for (let i = 0; i < 14 && !trading(next.y, next.m, next.d); i++) next = addDay(next.y, next.m, next.d);
  if (next.y > H_YEAR || c.y > H_YEAR) unknown = true;
  let st: 'open' | 'pre' | 'closed' | 'holiday' | 'weekend';
  if (today && c.min >= OPEN && c.min < CLOSE) st = 'open';
  else if (today && c.min < OPEN) st = 'pre';
  else if (hol && dow(c.y, c.m, c.d) <= 4) st = 'holiday';
  else if (today) st = 'closed';
  else st = 'weekend';
  return { st, c, hol, next, unknown };
}

export function MarketClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t); }, []);
  const s = marketState(now);
  const nxt = fmtD(s.next.y, s.next.m, s.next.d) + ' ' + hm(OPEN);
  const line = s.st === 'open' ? 'السوق مفتوح الآن، بيقفل ' + hm(CLOSE)
    : s.st === 'pre' ? 'السوق لسه ما فتحش، بيفتح النهاردة ' + hm(OPEN)
    : s.st === 'holiday' ? 'السوق مقفول النهاردة (إجازة: ' + s.hol + ')، الجلسة الجاية ' + nxt
    : s.st === 'closed' ? 'السوق قفل النهاردة ' + hm(CLOSE) + '، الجلسة الجاية ' + nxt
    : 'السوق مقفول (الجمعة والسبت إجازة)، الجلسة الجاية ' + nxt;
  return <div className={'mc ' + (s.st === 'open' ? 'on' : '')} role="status">
    <span className="mc-d" aria-hidden="true" />
    <div><b>{line}</b>
      <small>بتوقيت القاهرة الآن {hm(s.c.min)} · جلسات الأحد للخميس 10:00 ص إلى 2:15 م.</small>
      {s.unknown ? <small>إجازات بعد 2026: غير متوفر هنا، راجع موقع البورصة قبل ما تعتمد على الموعد.</small> : null}
      <small>المواعيد: stock-market-hours.com، الإجازات الرسمية 2026: presidency.eg، قُرئت 27-11-2026. البورصة ممكن تغيّر أو تقفل أيام تانية بإعلان منها.</small></div>
  </div>;
}
