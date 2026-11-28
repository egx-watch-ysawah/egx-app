import React from 'react';
import { FlowSignal, staleBySession, useHolidays } from './FlowSignal';
const co = (n: number) => (n >= 3 && n <= 10 ? 'شركات' : 'شركة');
// السعر العادل page per portfolio stock = flow panel + peer comparison. Peers: TradingView scanner (unofficial), 27 Nov 2026, current only, no history test. Hint only, never a fair value.
const CSS = `.pr .t{font-weight:700;font-size:15px;line-height:1.6;color:#edeef0}.pr .q{font-size:13px;line-height:1.8;color:#b4bac4;margin:4px 0 10px}.pr .tr{position:relative;height:14px;border-radius:7px;background:#0b0f12;margin:18px 0 8px}.pr .rg{position:absolute;top:3px;height:8px;border-radius:4px;background:#3a4350}.pr .md{position:absolute;top:-4px;width:2px;height:22px;background:#edeef0}.pr .me{position:absolute;top:-3px;width:20px;height:20px;margin-left:-10px;border-radius:50%;background:#25b896;border:2px solid #0b0f12}.pr .lg{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;text-align:center;font-size:12px;color:#a5aab2}.pr .lg b{display:block;font-size:17px;color:#edeef0}.pr .lg .g b{color:#25b896}.pr .v{display:block;margin-top:10px;padding:8px 12px;border-radius:12px;background:#0b0f12;font-size:13px;line-height:1.7;color:#edeef0}.pr .n{font-size:12px;line-height:1.7;color:#a5aab2;margin-top:10px}.pr .na{padding:10px 12px;border-radius:12px;background:#1e252f;font-size:13px;line-height:1.7;color:#b4bac4;margin-top:8px}.pr .na b{color:#edeef0}.pr .sb{display:inline-block;padding:4px 10px;border-radius:999px;background:#de575b22;color:#de575b;font-size:12px;margin-bottom:8px}.pr hr{border:0;border-top:1px solid #1e252f;margin:14px 0}`;
const EX: Record<string, string> = { ORHD: 'ORHD في تصنيف المصدر "إنشاءات سكنية" (4 شركات بس)، فاستخدمنا المجموعة الأوسع: شركات التطوير العقاري. ', UNIP: 'المصدر بيصنف UNIP "ورق" (Pulp & Paper)، والمجموعة هنا شركات التعبئة والتغليف، فالتشابه تقريبي. ' };
const GR: [string, string][] = [['Real Estate', 'شركات تطوير عقاري'], ['Investment Banks', 'بنوك استثمار وسمسرة'], ['Pharma', 'شركات أدوية'], ['Containers', 'شركات تعبئة وتغليف']];
const grAr = (g: string) => (GR.find(x => g.startsWith(x[0])) || [0, g])[1];
const iso2ar = (iso: string) => { const M = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']; return Number(iso.slice(8, 10)) + ' ' + M[Number(iso.slice(5, 7)) - 1] + ' ' + iso.slice(0, 4); };
function Metric({ code, s, k }: { code: string; s: any; k: 'pb' | 'pe' }) {
  const isPb = k === 'pb'; const own = s[k], n = s['n_' + k], md = s['median_' + k], rg = s['range_' + k];
  const title = isPb ? 'بتدفع كام في السهم مقابل قيمة الشركة في دفاترها؟ (P/B)' : 'بتدفع كام في السهم مقابل ربح الشركة؟ (P/E)';
  const expl = isPb ? 'P/B: سعر السهم مقسوم على قيمة الشركة في دفاترها لكل سهم. لو الرقم 1 يبقى بتدفع جنيه مقابل كل جنيه في الدفاتر.' : 'P/E: سعر السهم مقسوم على ربح السهم في آخر 12 شهر. لو الرقم 10 يبقى بتدفع 10 جنيه مقابل كل جنيه ربح في السنة.';
  if (own == null && (n == null || n < 3)) return <div className="na"><b>{title.split(' (')[0]}: غير متوفر</b><br />{n ? <>المصدر مطلعش الرقم ده للسهم نفسه، وكمان الشركات اللي شبهه ومعاها الرقم ده عددها {n} بس، وده قليل، فمفيش مقارنة.</> : 'المصدر مطلعش الرقم ده للسهم نفسه، ومفيش ولا شركة شبهه معاها الرقم ده، فمفيش مقارنة.'}</div>;
  if (own != null && (s.quality === 'weak' || (typeof n === 'number' && n < 5))) return <div className="na"><b>{title.split(' (')[0]}: غير متوفر</b><br />الشركات اللي شبه السهم ده ومعاها الرقم ده عددها {n == null ? 'قليل' : n} بس{s.quality === 'weak' ? '، وجودة المقارنة ضعيفة (الأرقام متباعدة جدًا)' : ''}، فمفيش مقارنة.</div>;
  if (own == null) return <div className="na"><b>{title.split(' (')[0]}: غير متوفر</b><br />المصدر مطلعش رقم للشركة نفسها، فمفيش مقارنة.</div>;
  if (md == null || !rg) return <><div className="t">{title}</div><div className="na"><b>مفيش مقارنة</b><br />السهم ده <bdi dir="ltr">{own.toFixed(2)}</bdi>، بس الشركات اللي شبهه ومعاها الرقم ده عددها {n} بس، وده قليل.</div></>;
  const cap = Math.max(3 * md, own * 1.2), cut = rg[1] > cap, ax = (cut ? cap : rg[1]) * 1.05; const X = (v: number) => Math.min(100, Math.max(0, v / Math.max(ax, own * 1.05) * 100));
  const small = n < 10, wide = rg[1] / rg[0] > 10;
  return <><div className="t">{title}</div><div className="q">{expl} الرقم الأصغر يعني بتدفع أقل.</div>
    <div className="tr" dir="ltr"><div className="rg" style={{ left: X(rg[0]) + '%', width: (cut ? 100 : X(rg[1])) - X(rg[0]) + '%', borderRadius: cut ? '4px 0 0 4px' : 4 }} /><div className="md" style={{ left: X(md) + '%' }} /><div className="me" style={{ left: X(own) + '%' }} /></div>
    {cut && <div className="n" style={{ marginTop: 0 }}>⋯ الشريط مقصوص، الأعلى <bdi dir="ltr">{rg[1].toFixed(rg[1] >= 100 ? 0 : 2)}</bdi></div>}
    <div className="lg"><div className="g"><b dir="ltr">{own.toFixed(2)}</b>{code}</div><div><b dir="ltr">{md.toFixed(2)}</b>الوسط ({n} {co(n)})</div><div><b dir="ltr">{rg[0].toFixed(2)} – {rg[1].toFixed(rg[1] >= 100 ? 0 : 2)}</b>أقل وأعلى رقم</div></div>
    <span className="v">{s['vs_' + k] === 'cheaper' ? 'رقم السهم ده أقل من وسط المجموعة.' : s['vs_' + k] === 'dearer' ? 'رقم السهم ده أعلى من وسط المجموعة.' : 'رقم السهم ده قريب من وسط المجموعة.'} ده تلميح، مش سعر عادل.</span>
    <div className="n">{EX[code] || ''}{s.feed_industry && (s.group === s.feed_industry || (GR.findIndex(x => String(s.group).startsWith(x[0])) >= 0 && GR.findIndex(x => String(s.group).startsWith(x[0])) === GR.findIndex(x => String(s.feed_industry).startsWith(x[0])))) ? 'المجموعة حسب تصنيف مزود البيانات' : 'المجموعة مش تصنيف البورصة الرسمي'}: {grAr(s.group)} ({n} {co(n)}){small ? '، وده عدد صغير فالمقارنة تقريبية' : ''}{wide ? '، والأرقام متباعدة جدًا فالوسط مش ثابت' : ''}.</div></>;
}
export function Peers({ code }: { code: string }) {
  const hol = useHolidays();
  const [j, setJ] = React.useState<any>(undefined);
  React.useEffect(() => { fetch('peer_compare.json?t=' + Date.now(), { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).catch(() => null).then(setJ); }, []);
  if (j === undefined || hol === undefined) return null;
  const s = j && j.stocks && j.stocks[code];
  if (!s) return <><div className="sm-sec">مقارنة بالشركات اللي زيه</div><div className="sm-card pr"><style>{CSS}</style><div className="na"><b>غير متوفر</b><br />ملف المقارنة مش متاح دلوقتي.</div></div></>;
  const stale = j.status === 'stale' || (typeof j.up_to_date === 'boolean' ? !j.up_to_date : (j.expected_session && j.price_session ? j.price_session < j.expected_session : staleBySession(j.price_session || j.generated_utc, hol)));
  const none = s.pb == null && s.pe == null;
  return <><div className="sm-sec">مقارنة بالشركات اللي زيه</div><div className="sm-card pr"><style>{CSS}</style>
    {stale && <span className="sb">أرقام قديمة: أسعار إقفال {iso2ar(j.price_session || j.generated_utc)}</span>}
    {none ? <div className="na"><b>مفيش بيانات للمقارنة</b><br />المصدر مش بيدي أرقام للسهم ده (لا قيمة دفترية ولا ربح)، فمفيش مقارنة. ما بنحطش أرقام من عندنا.</div> : <><Metric code={code} s={s} k="pb" /><hr /><Metric code={code} s={s} k="pe" /></>}
    <div className="n">المصدر: TradingView scanner (غير رسمي، مصدر واحد) · {j.price_session ? 'أسعار إقفال ' + iso2ar(j.price_session) : 'تاريخ جلسة الأسعار مش مذكور في الملف (الملف اتقرا ' + iso2ar(j.generated_utc) + ')'} · أرقام الوقت الحالي بس، مفيش اختبار على السنين اللي فاتت · مش نصيحة.</div>
  </div></>;
}
