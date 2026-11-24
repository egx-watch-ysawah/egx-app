import React, { useEffect, useMemo, useState } from 'react';

// 1) Portfolio value curve. One point per day, kept only in this browser (localStorage), never uploaded.
const KEY = 'egx-hist';
type Hist = Record<string, number>;
const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
function load(): Hist { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch { return {}; } }
const money = (n: number) => Math.round(n).toLocaleString('en-US');

export function HistCurve({ value }: { value: number | null }) {
  const [h, setH] = useState<Hist>(load);
  const [rng, setRng] = useState<30 | 90 | 0>(30);
  useEffect(() => {
    if (value === null || !Number.isFinite(value) || value <= 0) return;
    const n = { ...load(), [today()]: Math.round(value * 100) / 100 };
    try { localStorage.setItem(KEY, JSON.stringify(n)); } catch { /* ignore */ }
    setH(n);
  }, [value === null ? null : Math.round(value)]);
  const pts = useMemo(() => {
    const all = Object.entries(h).sort((a, b) => a[0].localeCompare(b[0]));
    if (!rng) return all;
    const cut = Date.now() - rng * 86400000;
    return all.filter(([d]) => new Date(d).getTime() >= cut);
  }, [h, rng]);
  const W = 320, H = 130;
  const vals = pts.map(p => p[1]);
  const mn = Math.min(...vals), mx = Math.max(...vals), span = mx - mn || 1;
  const xy = pts.map((p, i) => [pts.length > 1 ? i * W / (pts.length - 1) : W / 2, H - 14 - (p[1] - mn) / span * (H - 30)]);
  const d = xy.map((q, i) => (i ? 'L' : 'M') + q[0].toFixed(1) + ',' + q[1].toFixed(1)).join(' ');
  return (
    <section className="hc" aria-label="منحنى قيمة المحفظة">
      <div className="hc-top"><b>منحنى قيمة المحفظة</b>
        <span className="hc-tabs">{([[30, 'شهر'], [90, '3 شهور'], [0, 'الكل']] as const).map(([r, t]) => <button type="button" key={r} className={rng === r ? 'on' : ''} onClick={() => setRng(r as 30 | 90 | 0)}>{t}</button>)}</span></div>
      {pts.length < 2
        ? <p className="hc-empty">المنحنى بيبدأ يتسجل من النهارده، نقطة كل يوم تفتح فيه التطبيق. ارجع بعد يوم أو أكتر عشان يظهر الخط.</p>
        : <>
          <svg viewBox={`0 0 ${W} ${H}`} className="hc-svg" dir="ltr" role="img" aria-label="منحنى قيمة المحفظة"><path d={d + ` L${W},${H} L0,${H} Z`} className="hc-area" /><path d={d} className="hc-line" /></svg>
          <div className="hc-meta" dir="ltr"><span>{pts[0][0]}</span><span>{pts[pts.length - 1][0]}</span></div>
          <div className="hc-mm"><span>أعلى قيمة <b dir="ltr">{money(mx)}</b></span><span>أقل قيمة <b dir="ltr">{money(mn)}</b></span></div>
        </>}
      <small className="hc-note">القيم بتتسجل على موبايلك بس (مش في الملف المشفر ولا بتتبعت لأي مكان). لو مسحت بيانات المتصفح بتتمسح.</small>
    </section>
  );
}

// 2) Dividend calendar: past dividends only, from one cited source. No future dates are published for these stocks in a free reliable source.
const SRC = 'stockanalysis.com (بيانات S&P Global Market Intelligence)';
const CHECKED = '24 نوفمبر 2026';
const DIV: { s: string; n: string; line: string | null }[] = [
  { s: 'MASR', n: 'مدينة مصر', line: 'آخر توزيع: خصم 20 مايو 2026 · 0.15 جم للسهم · صرف 24 مايو 2026' },
  { s: 'HRHO', n: 'إي إف جي القابضة', line: 'آخر توزيع: خصم 25 يونيو 2026 · 0.278 جم للسهم · صرف 29 يونيو 2026' },
  { s: 'PHAR', n: 'إيبيكو', line: 'آخر توزيع: خصم 28 أبريل 2026 · 3.50 جم للسهم · صرف 30 سبتمبر 2026' },
  { s: 'BONY', n: 'بنيان', line: null },
  { s: 'ORHD', n: 'أوراسكوم للتنمية مصر', line: 'آخر توزيع: خصم 23 سبتمبر 2025 · 0.38435 جم للسهم · صرف 25 سبتمبر 2025' },
  { s: 'UNIP', n: 'يونيفرسال للورق', line: 'آخر توزيع: خصم 16 يونيو 2021 · 0.00374 جم للسهم · صرف 20 يونيو 2021 (قديم)' },
];
export function DivCalendar() {
  return (
    <section className="dc" aria-label="تقويم التوزيعات">
      <div className="hc-top"><b>تقويم توزيعات الأرباح</b></div>
      {DIV.map(r => <div className="dc-row" key={r.s}><b dir="ltr">{r.s}</b><span><small>{r.n}</small>{r.line ?? 'مفيش بيانات توزيعات في المصدر لهذا السهم'}</span></div>)}
      <p className="dc-none">مواعيد النتائج والتوزيعات القادمة: غير منشورة في مصدر مجاني موثوق، فمش هنكتب تواريخ مش متأكدين منها.</p>
      <small className="hc-note">المصدر: {SRC}، اتراجع {CHECKED}. دي توزيعات سابقة، مش وعد بتوزيع جاي.</small>
    </section>
  );
}
