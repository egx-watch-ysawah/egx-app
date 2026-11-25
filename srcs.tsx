import React from 'react';
import NOTES from './notes.json';
import SRC from './sources.json';
const TYPE_AR: Record<string, string> = { filed_statements: 'قوائم مالية منشورة', company_release: 'بيان من الشركة', press_or_news: 'خبر' };
const Link1 = ({ u, t }: { u: string | null; t: string }) => u ? <a href={u} target="_blank" rel="noreferrer">{t}</a> : <span>{t}</span>;
export function NoteCard({ code }: { code: string }) {
  const n: any = (NOTES as any).notes[code];
  if (!n) return null;
  return <section className="eg-srcc" dir="rtl" aria-label="ملاحظات على القوائم المالية">
    <h3>ملاحظات على القوائم المالية</h3>
    <p>{n.problem_ar}</p>
    {n.confidence_ar ? <p className="eg-srcc-conf">درجة التأكد: {n.confidence_ar}</p> : null}
  </section>;
}
export function SourcesBar({ code, reviewed }: { code: string; reviewed: boolean }) {
  let items: React.ReactNode[] = [];
  if (reviewed) {
    const r: any = (SRC as any).sources[code];
    if (!r || r.status === 'early_page' || !r.sources?.length) return null;
    items = r.sources.map((s: any, i: number) => <li key={i}><b>{TYPE_AR[s.type] || s.type}</b> · <Link1 u={s.url} t={s.label_ar} /></li>);
  } else {
    const n: any = (NOTES as any).notes[code];
    if (!n?.sources?.length) return null;
    items = n.sources.map((s: any, i: number) => <li key={i}><b>قوائم مالية منشورة</b> · <Link1 u={s.url} t={s.label} /></li>);
  }
  return <details className="eg-srcbar" dir="rtl"><summary>المصادر</summary><ul>{items}</ul></details>;
}
