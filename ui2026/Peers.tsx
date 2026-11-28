import React from 'react';
import { useStarta, inSessionNow } from '../feed';
import { feedWin } from './FlowLive';
import { FlowSignal, staleBySession, useHolidays } from './FlowSignal';
const co = (n: number) => (n >= 3 && n <= 10 ? 'شركات' : 'شركة');
// السعر العادل page per portfolio stock = flow panel + peer comparison. Peers: TradingView scanner (unofficial), 27 Nov 2026, current only, no history test. Hint only, never a fair value.
const CSS = `.pr .t{font-weight:700;font-size:15px;line-height:1.6;color:#edeef0}.pr .bn{margin-top:10px;font-size:13.5px;line-height:1.8;color:#b4bac4}.pr .bn b{color:#25b896}.pr .lg b{white-space:nowrap}.pr .l1{font-size:15px;line-height:1.9;color:#edeef0;margin:6px 0 4px}.pr .l1 b{color:#fff}.pr .pd{font-size:12.5px;line-height:1.8;color:#b4bac4;margin:6px 0 0}.pr .q{font-size:13px;line-height:1.8;color:#b4bac4;margin:4px 0 10px}.pr .tr{position:relative;height:14px;border-radius:7px;background:#0b0f12;margin:18px 0 8px}.pr .rg{position:absolute;top:3px;height:8px;border-radius:4px;background:#3a4350}.pr .md{position:absolute;top:-4px;width:2px;height:22px;background:#edeef0}.pr .me{position:absolute;top:-3px;width:20px;height:20px;margin-left:-10px;border-radius:50%;background:#25b896;border:2px solid #0b0f12}.pr .lg{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;text-align:center;font-size:12px;color:#a5aab2}.pr .lg b{display:block;font-size:17px;color:#edeef0}.pr .lg .g b{color:#25b896}.pr .v{display:block;margin-top:10px;padding:8px 12px;border-radius:12px;background:#0b0f12;font-size:13px;line-height:1.7;color:#edeef0}.pr .n{font-size:12px;line-height:1.7;color:#a5aab2;margin-top:10px}.pr .na{padding:10px 12px;border-radius:12px;background:#1e252f;font-size:13px;line-height:1.7;color:#b4bac4;margin-top:8px}.pr .na b{color:#edeef0}.pr .sb{display:inline-block;padding:4px 10px;border-radius:999px;background:#de575b22;color:#de575b;font-size:12px;margin-bottom:8px}.pr hr{border:0;border-top:1px solid #1e252f;margin:14px 0}`;
const EX: Record<string, string> = { ORHD: 'ORHD في تصنيف المصدر "إنشاءات سكنية" (4 شركات بس)، فاستخدمنا المجموعة الأوسع: شركات التطوير العقاري. ', UNIP: 'المصدر بيصنف UNIP "ورق" (Pulp & Paper)، والمجموعة هنا شركات التعبئة والتغليف، فالتشابه تقريبي. ' };
const GR: [string, string][] = [['Real Estate', 'شركات تطوير عقاري'], ['Investment Banks', 'بنوك استثمار وسمسرة'], ['Pharma', 'شركات أدوية'], ['Containers', 'شركات تعبئة وتغليف']];
const grAr = (g: string) => (GR.find(x => g.startsWith(x[0])) || [0, g])[1];
const iso2ar = (iso: string) => { const M = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']; return Number(iso.slice(8, 10)) + ' ' + M[Number(iso.slice(5, 7)) - 1] + ' ' + iso.slice(0, 4); };
const plNo = (n: number) => (n <= 0 ? 'مفيش ولا شركة' : n === 1 ? 'شركة واحدة بس' : n === 2 ? 'شركتين بس' : n + ' ' + co(n) + ' بس');
type MB = { head: React.ReactNode; det: React.ReactNode };
// Plain version: one line with the meaning first, then the slider. Every honesty line (what the ratio is, cut bar, group note, source) goes under one tap-to-open.
function Metric({ code, s, k }: { code: string; s: any; k: 'pb' | 'pe' }): MB {
  const isPb = k === 'pb'; const own = s[k], n = s['n_' + k], md = s['median_' + k], rg = s['range_' + k];
  const name = isPb ? 'السعر مقابل القيمة في الدفاتر' : 'السعر مقابل الربح';
  const what = isPb ? 'قيمة الشركة في دفاترها' : 'الربح';
  const title = <div className="t">{name} <bdi dir="ltr">({isPb ? 'P/B' : 'P/E'})</bdi></div>;
  const un = (why: React.ReactNode) => ({ head: <div className="na"><b>{name}: غير متوفر</b><br />{why}</div>, det: null });
  if (own == null && (n == null || n < 3)) return un(<>المصدر مطلعش {isPb ? 'القيمة في الدفاتر' : 'الربح'} للسهم ده، {(n || 0) <= 0 ? 'وكمان مفيش ولا شركة شبهه معاها الرقم ده' : 'وكمان مفيش غير ' + plNo(n || 0) + ' شبهه بالرقم ده'}، فمفيش مقارنة.</>);
  if (own == null) return un(<>المصدر مطلعش {isPb ? 'القيمة في الدفاتر' : 'الربح'} للسهم ده، فمفيش مقارنة.</>);
  if (s.quality === 'weak' || (typeof n === 'number' && n < 5)) return un(<>الشركات اللي شبهه قليلة ({plNo(n || 0)}){s.quality === 'weak' ? ' وأرقامها متباعدة جدًا' : ''}، فالمقارنة مش مضمونة.</>);
  if (md == null || !rg) return un(<>السهم ده <bdi dir="ltr">{own.toFixed(2)}</bdi>، بس الشركات اللي شبهه قليلة ({plNo(n || 0)}).</>);
  const cap = Math.max(3 * md, own * 1.2), cut = rg[1] > cap, ax = (cut ? cap : rg[1]) * 1.05; const X = (v: number) => Math.min(100, Math.max(0, v / Math.max(ax, own * 1.05) * 100));
  const small = n < 10, wide = rg[1] / rg[0] > 10;
  const vs = s['vs_' + k] === 'cheaper' ? 'أقل من الوسط' : s['vs_' + k] === 'dearer' ? 'أعلى من الوسط' : s['vs_' + k] === 'same' ? 'قريب من الوسط' : '';
  const head = <>{title}
    <div className="l1">السهم ده بيتباع بـ<b dir="ltr"> {own.toFixed(2)} </b>جنيه مقابل كل جنيه {isPb ? 'من ' + what : 'ربح في السنة'}، والشركات اللي شبهه في الوسط <b dir="ltr">{md.toFixed(2)}</b>. {vs ? 'يعني ' + vs + '. ' : ''}تلميح مش سعر عادل.</div>
    <div className="tr" dir="ltr"><div className="rg" style={{ left: X(rg[0]) + '%', width: (cut ? 100 : X(rg[1])) - X(rg[0]) + '%', borderRadius: cut ? '4px 0 0 4px' : 4 }} /><div className="md" style={{ left: X(md) + '%' }} /><div className="me" style={{ left: X(own) + '%' }} /></div>
    <div className="lg"><div className="g"><b dir="ltr">{own.toFixed(2)}</b>{code}</div><div><b dir="ltr">{md.toFixed(2)}</b>الوسط ({n} {co(n)})</div><div><b dir="ltr">{rg[0].toFixed(2)} – {rg[1].toFixed(rg[1] >= 100 ? 0 : 2)}</b>أقل وأعلى رقم</div></div></>;
  const expl = isPb ? 'P/B: سعر السهم مقسوم على قيمة الشركة في دفاترها لكل سهم. لو الرقم 1 يبقى بتدفع جنيه مقابل كل جنيه في الدفاتر.' : 'P/E: سعر السهم مقسوم على ربح السهم في آخر 12 شهر. لو الرقم 10 يبقى بتدفع 10 جنيه مقابل كل جنيه ربح في السنة.';
  const det = <div className="pd"><p><b>{name}:</b> {expl} الرقم الأصغر يعني بتدفع أقل.</p>
    {cut && <p>الشريط مقصوص من فوق، أعلى رقم في المجموعة <bdi dir="ltr">{rg[1].toFixed(rg[1] >= 100 ? 0 : 2)}</bdi>.</p>}
    <p>{EX[code] || ''}{s.feed_industry && (s.group === s.feed_industry || (GR.findIndex(x => String(s.group).startsWith(x[0])) >= 0 && GR.findIndex(x => String(s.group).startsWith(x[0])) === GR.findIndex(x => String(s.feed_industry).startsWith(x[0])))) ? 'المجموعة حسب تصنيف مزود البيانات' : 'المجموعة مش تصنيف البورصة الرسمي'}: {grAr(s.group)} ({n} {co(n)}){small ? '، وده عدد صغير فالمقارنة تقريبية' : ''}{wide ? '، والأرقام متباعدة جدًا فالوسط مش ثابت' : ''}.</p></div>;
  return { head, det };
}
export function Peers({ code }: { code: string }) {
  const hol = useHolidays(); const fd = useStarta();
  const [j, setJ] = React.useState<any>(undefined);
  React.useEffect(() => { fetch('peer_compare.json?t=' + Date.now(), { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).catch(() => null).then(setJ); }, []);
  if (j === undefined || hol === undefined) return null;
  const s = j && j.stocks && j.stocks[code];
  if (!s) return <><div className="sm-sec">مقارنة بالشركات اللي زيه</div><div className="sm-card pr"><style>{CSS}</style><div className="na"><b>غير متوفر</b><br />ملف المقارنة مش متاح دلوقتي.</div></div></>;
  const stale = j.status === 'stale' || (typeof j.up_to_date === 'boolean' ? !j.up_to_date : (j.expected_session && j.price_session ? j.price_session < j.expected_session : staleBySession(j.price_session || j.generated_utc, hol)));
  const none = s.pb == null && s.pe == null;
  const pb = Metric({ code, s, k: 'pb' }), pe = Metric({ code, s, k: 'pe' });
  const LV: any = (() => { const r = fd && fd.rows[code]; if (!inSessionNow() || !r || r.src !== 'starta' || r.stale || !(s.price > 0) || !(r.price > 0) || !s.price_session || Math.abs(r.price / s.price - 1) > 0.25) return null; const t = feedWin(r.at, hol); if (!t || !(t.date > s.price_session)) return null; const ok = (m: 'pb' | 'pe') => s[m] != null && s.quality !== 'weak' && typeof s['n_' + m] === 'number' && s['n_' + m] >= 5 && s['median_' + m] != null && !!s['range_' + m]; const f = r.price / s.price; const parts = [ok('pb') ? <bdi key="b" dir="ltr">P/B {(s.pb * f).toFixed(2)}</bdi> : null, ok('pe') ? <bdi key="e" dir="ltr">P/E {(s.pe * f).toFixed(2)}</bdi> : null].filter(Boolean); if (!parts.length) return null; return { r, t, parts, el: <div className="l1" style={{ borderTop: '1px solid #1e252f', paddingTop: 8 }}><span style={{ background: "#1e252f", color: "#edeef0", borderRadius: 999, padding: "2px 10px", fontSize: 12, fontWeight: 600 }}>أولية</span> {parts.reduce((a: any[], x: any, i: number) => (i ? [...a, ' · ', x] : [x]), [])} بآخر سعر <bdi dir="ltr">{r.price.toFixed(2)}</bdi> جنيه، من Starta الساعة <bdi dir="ltr">{t.time}</bdi>.</div> }; })();
  return <><div className="sm-sec">مقارنة بالشركات اللي زيه</div><div className="sm-card pr"><style>{CSS}</style>
    {stale && <span className="sb">أرقام قديمة: أسعار إقفال {iso2ar(j.price_session || j.generated_utc)}</span>}
    {none ? <div className="na"><b>مفيش مقارنة للسهم ده</b><br />المصدر مش بيدي له قيمة في الدفاتر ولا ربح. ما بنحطش أرقام من عندنا.</div> : <>{pb.head}<hr />{pe.head}</>}
    {LV && LV.el}
    {!none && (pb.det || pe.det) && <div className="bn"><b>تستفيد منها إزاي:</b> تشوف السهم أقل ولا أعلى من شبهه، وبعدها تراجع بنفسك. مش سعر عادل ومش توصية.</div>}
    <details className="sm-tip sm-tipd"><summary>التفاصيل والمصدر</summary>{pb.det}{pe.det}
      {LV && <p className="pd">السطر الأولي بالأعلى: الوسط والشركات التانية لسه بأسعار إقفال {iso2ar(s.price_session)}، فالمقارنة تقريبية (السطر ده بيظهر وقت الجلسة بس).</p>}<p className="pd">المصدر: TradingView scanner (غير رسمي، مصدر واحد) · {j.price_session ? 'أسعار إقفال ' + iso2ar(j.price_session) : 'تاريخ جلسة الأسعار مش مذكور في الملف (الملف اتقرا ' + iso2ar(j.generated_utc) + ')'} · أرقام الوقت الحالي بس، مفيش اختبار على السنين اللي فاتت · مش نصيحة.</p></details>
  </div></>;
}
