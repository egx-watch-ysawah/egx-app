import React from 'react';
import { Ex, X } from './explain';
import TEAM from './team.json';
import META from './study_meta.json';
const fmt = (v: number) => (v >= 1 ? v.toFixed(2) : v.toFixed(3));
const pc = (v: number) => (v > 0 ? '+' : '') + v.toFixed(1) + '%';
const Det = ({ title, children, open }: { title: string; children: React.ReactNode; open?: boolean }) => <details className="eg-ex" open={open}><summary>{title}</summary><div className="eg-exb">{children}</div></details>;
const RULE_AR: Record<string, string> = {
  'RSI<30 (oversold bounce)': 'RSI نزل تحت 30 (احتمال ارتداد)',
  'MACD cross up': 'تقاطع MACD لأعلى والسعر فوق متوسط 200',
  '20d breakout + volume x1.5': 'إقفال أعلى من أعلى إقفال في 20 جلسة قبله، بحجم 1.5 ضعف',
  'SMA50 cross above SMA200': 'متوسط 50 قطع متوسط 200 لأعلى',
};
const state = (s: any) => s.votes.trend && s.votes.mid ? 'فوق المتوسطين' : !s.votes.trend && !s.votes.mid ? 'تحت المتوسطين' : 'بين المتوسطين';
function Plan3({ s }: { s: any }) {
  const p = s.plan;
  return <div className="eg-p3">
    <div><span>{p.mode === 'pullback' ? 'مستوى تراجع للمراقبة' : 'مستوى اختراق للمراقبة'}</span><b dir="ltr">{fmt(p.entry)}</b><i>{(p.entry_pct >= 0 ? "أعلى من السعر بحوالي " : "أقل من السعر بحوالي ") + Math.abs(p.entry_pct).toFixed(0) + "%"}</i></div>
  </div>;
}
// Same sections as the hand-built portfolio pages: timeframe, scenario, method. Needs plan numbers from the daily build.
export function ScenarioBlock({ s }: { s: any }) {
  const p = s.plan || {};
  const has = Number.isFinite(p.entry) && p.entry > 0 && Number.isFinite(p.stop) && Array.isArray(s.fire);
  const thin = has && (p.tv < 1 || (s.historyCount || 0) < 260);
  return <>
    <Det title="الفريم ومدة المتابعة"><Use>تعرف تتابع السهم كام يوم أو أسبوع، مش مضاربة جوه الجلسة.</Use><p>التقييم والسيناريو على شمعة يومية بعد الإقفال، أقرب لمتابعة على أيام أو أسابيع، مش مضاربة جوه الجلسة.</p><p>التطبيق مش بيتابع مركزك ولا تاريخ دخولك، والمرجع المتحرك بيتحسب من جديد كل يوم، مش مستوى محفوظ.</p></Det>
    {!has ? <p className="eg-note">السيناريو لسه مش متاح للسهم ده لحد ما الأرقام تتحدث في التحديث الجاي.</p>
      : thin ? <p className="eg-note eg-warn">السيناريو مش معروض: {p.tv < 1 ? <>السيولة ضعيفة (الرقم الأوسط لقيمة التداول اليومي في آخر 60 جلسة حوالي <bdi dir="ltr">{p.tv}</bdi> مليون جنيه)، فمستويات المراقبة مش موثوقة.</> : 'تاريخ السهم أقصر من الكفاية لحساب مستويات موثوقة.'}</p>
      : <>
        <Det title="سيناريو افتراضي للمتابعة، مش توصية"><Use>مستويات سعر للمراقبة بس، تقدر تفهم بيها لو السعر وصل لحاجة منها الصورة الفنية بتتغير إزاي. مش أمر ومش توصية.</Use>
          <p className="eg-note">المستويات دي حساب افتراضي من حركة السعر والتذبذب، مش خطة لحد. الحالة الحالية: {state(s)}.</p>
          <Plan3 s={s} />
          <p className="eg-note">{p.mode === 'pullback' ? 'الصندوق بيوصف مستوى تراجع للسعر مش شراء بالسعر الحالي. الوصول للمستوى لوحده مش معناه إن الصورة اتغيرت.' : 'الصندوق بيوصف مستوى اختراق للسعر مش شراء بالسعر الحالي. المستوى ده أعلى سعر خلال اليوم في آخر 20 جلسة (شامل النهارده)، أما إشارة "اختراق" فبتتحقق لما الإقفال يعدي أعلى إقفال في الـ20 جلسة قبله، فممكن تظهر والسعر لسه تحت المستوى المعروض. والاختراق من غير حجم أعلى من المعتاد ضعيف الدلالة.'}</p>
        </Det>
        {s.fire.length > 0 && <div className="eg-fire">إشارة جديدة النهارده: {s.fire.map((f: string) => RULE_AR[f] || f).join(' + ')}{(s.fire.some((f: string) => /breakout/.test(f)) && s.volx) ? ' (الحجم الفعلي ' + s.volx.toFixed(1) + ' ضعف المعتاد)' : ''}{!s.votes.trend ? '. السعر لسه تحت متوسط 200 جلسة.' : ''}</div>}
        <Det title="طريقة حساب السيناريو والمخاطرة"><Use>تفهم الأرقام جاية منين وتتأكد منها.</Use><Ex>{X.plan(s)}</Ex></Det>
      </>}
    {!thin && has && <p className="eg-note eg-foot">قراءة تاريخية للسعر والتذبذب، مش نصيحة ولا توقع. السعر ممكن يتخطى أي مستوى بفجوة. المؤشرات مشتقة من نفس الأسعار فمش أدلة مستقلة.</p>}
  </>;
}
export const Use = ({ children }: { children: React.ReactNode }) => <p className="eg-use"><b>ده بيفيدك في إيه؟</b> {children}</p>;
const GLOSS: [string, string][] = [
  ['RSI', 'مقياس من 0 لـ100 بيقول السهم اتشرى أو اتباع بزيادة. فوق 70 يعني صعد بسرعة واحتمال التراجع بيزيد، وتحت 30 يعني نزل بسرعة والارتداد مش مضمون.'],
  ['MACD', 'بيقارن متوسطين لحركة السعر عشان يوريك الزخم بيقوى ولا بيضعف. لما يرجع تحت خط الإشارة بتبقى دي علامة إن الزخم بيضعف، ولوحده بيطلع إشارات كاذبة كتير.'],
  ['ATR', 'متوسط حركة السهم في اليوم الواحد خلال آخر 14 جلسة، كنسبة من سعر الإقفال، وبيشمل الفجوة بين إقفال امبارح وفتح النهارده. بيقيس قد إيه السهم بيهتز، مش بيروح فين. كل ما كبر، السهم أكتر تذبذب.'],
  ['ADX', 'بيقيس قوة الاتجاه مش اتجاهه. أكتر من 25 يعني فيه اتجاه واضح، ومن 20 لـ25 اتجاه بيتكون، وتحت 20 السهم متردد.'],
  ['بولينجر', 'نطاق حوالين متوسط السعر. لو السعر قرب من الحد الأعلى يبقى عالي بالنسبة لمتوسطه الأخير، ولو قرب من الأدنى يبقى واطي بالنسبة له. مش إشارة بيع أو شراء لوحدها.'],
  ['اختراق', 'إن السعر يقفل فوق أعلى سعر في الفترة اللي فاتت. بيدل على قوة محتملة، لكن ممكن يطلع كداب.'],
  ['مستوى المراقبة السفلي', 'سعر افتراضي لو السهم قفل تحته الصورة الفنية بتتغير. في وضع الاختراق بيتحسب من مستوى المقاومة، فممكن يطلع فوق السعر الحالي. هنا رقم مرجعي بس، مش أمر بيتنفذ.'],
  ['دعم ومقاومة', 'الدعم سعر السهم كان بيرتد منه لفوق. المقاومة سعر كان بيرجع منه لتحت. اختراق المقاومة بيدل على قوة محتملة، وكسر الدعم بيدل على ضعف محتمل.'],
];
export function Glossary() {
  return <Det title="معاني المصطلحات بالبساطة"><Use>تفهم الكلام الفني اللي في الصفحة من غير ما تحتاج خلفية.</Use>
    <dl className="eg-gl">{GLOSS.map(([k, v]) => <div key={k}><dt><bdi dir="ltr">{k}</bdi></dt><dd>{v}</dd></div>)}</dl></Det>;
}
const Src = ({ list }: { list?: { label: string; url: string | null }[] }) => list && list.length ? <ul>{list.map((x, i) => <li key={i}>{x.url ? <a href={x.url} target="_blank" rel="noreferrer">{x.label}</a> : x.label}</li>)}</ul> : null;
export function TeamBlock({ code }: { code: string }) {
  const t: any = (TEAM as any).stocks[code];
  if (!t) return <Det title="الفريق وفترة المتابعة"><p className="eg-note">غير متوفر: بيانات الفريق ومواعيد المتابعة للسهم ده لسه ما اتجمعتش ولا اتراجعت من مصادرها.</p></Det>;
  return <Det title="الفريق وفترة المتابعة">
    <Use>تعرف مين بيدير الشركة ومين ماسك نسبة كبيرة منها. التغيير المفاجئ في ده ممكن يكون سبب تدقق فيه.</Use>
    {t.team_ar?.length ? <><h4 className="eg-h4">الفريق</h4><ul>{t.team_ar.map((x: string, i: number) => <li key={i}>{x}</li>)}</ul></> : null}
    <Src list={t.team_sources} />
    {t.team_confidence_ar ? <p className="eg-note">درجة التأكد: {t.team_confidence_ar}</p> : null}
    <h4 className="eg-h4">كبار المساهمين</h4>{Array.isArray(t.holders_ar) ? (t.holders_ar.length ? <ul>{t.holders_ar.map((x: string, i: number) => <li key={i}>{x}</li>)}</ul> : <p>غير متوفر: لسه ما اتجمعتش من إفصاح ملكية حديث.</p>) : <p>{t.holders_ar || 'غير متوفر: لسه ما اتجمعتش من إفصاح ملكية حديث.'}</p>}
    {t.followup_ar ? <><h4 className="eg-h4">فترة المتابعة</h4><Use>تعرف آخر قوائم مالية نزلت إمتى وهل البيانات قديمة.</Use><p>{t.followup_ar}</p></> : null}
    <Src list={t.followup_sources} />
  </Det>;
}
export function StudyMeta({ code }: { code: string }) {
  const m: any = (META as any).studies[code];
  if (!m) return null;
  return <Det title="بطاقة الدراسة"><Use>تعرف تاريخ الدراسة وفترتها، وإن القيمة تقدير تجريبي منا.</Use>
    <ul>
      <li>تاريخ الدراسة: <bdi dir="ltr">{m.study_date}</bdi></li>
      {m.period_ar ? <li>الفترة: {m.period_ar}</li> : null}
      {m.fv_label_ar ? <li>تقدير تجريبي منا</li> : null}
      {m.price_label_ar ? <li>{m.price_label_ar}</li> : null}
      {m.estimated_items ? <li>{m.estimated_items}</li> : null}
      {m.unconfirmed_items ? <li>{m.unconfirmed_items}</li> : null}
    </ul>
  </Det>;
}

// Honest freshness note: "delayed up to 20 minutes" only when the snapshot really is that recent.
export function stampNote(iso?: string): string {
  const t = iso ? Date.parse(iso) : NaN;
  if (!Number.isFinite(t)) return 'مش لحظي';
  if ((Date.now() - t) / 60000 <= 25) return 'متأخر حتى 20 دقيقة، مش لحظي';
  const h = Number(new Date(t).toLocaleTimeString('en-GB', { timeZone: 'Africa/Cairo', hour: '2-digit', hour12: false }));
  return h < 10 ? 'قبل فتح السوق (10:00): آخر لقطة متاحة، مش لحظي' : 'آخر لقطة متاحة، أقدم من 20 دقيقة، مش لحظي';
}
