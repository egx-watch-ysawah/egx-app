import React, { useState } from 'react';
import './lists.css';
import { xMore } from './ExplainLists';
// "المزيد" screen: icon cards with the market-rule numbers. Each opens the original sentence(s). Numbers are the ones already in the app text (EFG Hermes / EGX guide).
const I = (d: React.ReactNode) => <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#25b896" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>;
const CARDS: { id: string; icon: React.ReactNode; k: string; v: string; sub: string; body: React.ReactNode }[] = [
  { id: 'h', icon: I(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>), k: 'ساعات الجلسة', v: '10:00 – 14:15', sub: 'مزاد الإغلاق لحد 14:30', body: <p>التداول من الأحد للخميس: 10:00 لـ14:15 تداول متواصل، وبعدها مزاد الإغلاق لحد 14:30.</p> },
  { id: 'l', icon: I(<><path d="M4 8l4-4 4 4M8 4v16" /><path d="M20 16l-4 4-4-4M16 20V4" /></>), k: 'حد السعر اليومي', v: '20% / 10%', sub: 'تمياز 10%', body: <><p>الحد اليومي للسعر حوالي 20% صعود أو نزول من إقفال أمس، فأي أمر وقف ممكن يتنفذ بفجوة.</p><p>أسهم الشركات الصغيرة (تمياز) حدها 10%.</p></> },
  { id: 's', icon: I(<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>), k: 'التسوية', v: 'T+2', sub: 'يومين عمل', body: <p>التسوية T+2: الأسهم اللي تشتريها النهارده تدخل حسابك بعد يومين عمل.</p> },
  { id: 'c', icon: I(<><path d="M12 3v18" /><path d="M16 7.5c0-1.7-1.8-2.5-4-2.5s-4 .8-4 2.5 1.8 2.2 4 2.5 4 .8 4 2.5-1.8 2.5-4 2.5-4-.8-4-2.5" /></>), k: 'ضريبة الدمغة', v: '0.05%', sub: 'على المشتري وعلى البايع', body: <p>ضريبة دمغة 0.05% على المشتري وعلى البايع، غير عمولة الوسيط (مثال منشور لتطبيق ثندر: 0.10% + 2 جنيه للأمر). التكلفة بتختلف حسب حجم الأمر والوسيط والرسوم وفرق سعر الشراء والبيع، ومفيش نسبة واحدة مضمونة.</p> },
];
export function RuleCards() {
  const [o, setO] = useState<string | null>(null);
    return <section className="mc" aria-label="قواعد البورصة المصرية باختصار">
    <h3 className="mc-h">قواعد البورصة المصرية باختصار</h3>
    <div className="mc-g">{CARDS.map(x => <button type="button" key={x.id} className={'mc-c' + (o === x.id ? ' on' : '')} aria-expanded={o === x.id} onClick={() => setO(o === x.id ? null : x.id)}>{x.icon}<small>{x.k}</small><b dir="ltr">{x.v}</b><span>{x.sub}</span><p className="chp-x">{xMore[x.id]}</p></button>)}</div>
    {CARDS.map(x => <div key={x.id} className="mc-d" hidden={o !== x.id}><b>{x.k}</b>{x.body}</div>)}
    <p className="mc-s">المصادر: دليل EFG Hermes، وبورصة مصر، ودليل أسعار ثندر (عن طريق Perplexity). اتأكد من إعلانات البورصة لكل سهم.</p>
  </section>;
}
export function DisclaimerLine() {
  const [o, setO] = useState(false);
  return <div className="mc-dis eg-disc"><p>مش نصيحة استثمار ومش توصية، والقرار قرارك.</p><button type="button" aria-expanded={o} onClick={() => setO(!o)}>{o ? 'إخفاء' : 'تفاصيل'}</button>
    <p className="mc-dd" hidden={!o}>تنبيه مهم: التطبيق ده مش تابع لجهة مرخصة من الهيئة العامة للرقابة المالية ولا معتمد منها. اللي هنا معلومات وقراءات مبنية على أرقام مجانية منشورة ممكن تتأخر أو تتغير، مش نصيحة استثمار ومش توصية بشراء أو بيع، ومفيش أي وعد بربح. الاستثمار في الأسهم فيه مخاطر وممكن تخسر جزء من فلوسك أو كلها. القرار النهائي قرارك لوحدك ومسؤوليتك.</p></div>;
}
