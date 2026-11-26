import React, { useEffect, useState } from 'react';

// "آخر الأخبار": reads news.json (written by the news agent, pushed by the app owner). Facts only, no interpretation.
type Item = { code: string; title: string; source: string; url?: string | null; published_at: string; status: 'confirmed' | 'reported'; note?: string | null };
let cache: Promise<any> | null = null;
const load = () => cache || (cache = fetch('news.json?t=' + Math.floor(Date.now() / 300000), { cache: 'no-store' }).then(r => { if (!r.ok) throw new Error('news'); return r.json(); }).catch(e => { cache = null; throw e; }));
const HOURS = 48;
const wd = (x: string) => (x || '').replace(/[٠-٩]/g, c => String('٠١٢٣٤٥٦٧٨٩'.indexOf(c))).replace(/٫/g, '.').replace(/٬/g, ',');
const when = (iso: string) => { try { const d = new Date(iso); return d.toLocaleDateString('en-GB', { timeZone: 'Africa/Cairo', day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('en-GB', { timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit', hour12: false }); } catch { return ''; } };

export function NewsBlock({ code }: { code: string }) {
  const [d, setD] = useState<any>(undefined);
  useEffect(() => { let on = true; load().then(x => on && setD(x)).catch(() => on && setD(null)); return () => { on = false; }; }, []);
  const now = Date.now();
  const items: Item[] = d && Array.isArray(d.items) ? d.items.filter((x: Item) => x.code === code && now - Date.parse(x.published_at) <= HOURS * 3600e3 && Date.parse(x.published_at) <= now + 3600e3).sort((a: Item, b: Item) => Date.parse(b.published_at) - Date.parse(a.published_at)) : [];
  if (code === 'MTIE' && /[?&]new(=|&|$)/.test(location.hash)) return <details className="eg-ex"><summary>آخر الأخبار</summary><div className="eg-exb"><p className="eg-note">{d && d.as_of ? <>آخر تحديث لملف الأخبار: <bdi dir="ltr">{when(d.as_of)}</bdi>. مفيش فيه خبر للسهم ده في آخر 48 ساعة قبل التحديث ده (الفحص بالاسم، ممكن يفوت خبر). آخر إفصاح رسمي لقيناه: 16 نوفمبر 2026، قرارات اجتماع مجلس الإدارة (جلسة 15/11/2026). التفاصيل في مرفقات PDF لسه ما اتقراتش.</> : 'ملف الأخبار مش متاح دلوقتي.'}</p></div></details>;
  return <details className="eg-ex"><summary>آخر الأخبار</summary><div className="eg-exb">
    <p className="eg-use"><b>ده بيفيدك في إيه؟</b> تشوف اللي اتنشر عن الشركة في آخر 48 ساعة ومصدره، من غير تفسير.</p>
    {d === undefined ? <p className="eg-note">بحمّل الأخبار...</p>
      : d === null ? <p className="eg-note">غير متوفر: ملف الأخبار مش متاح دلوقتي.</p>
      : items.length === 0 ? <p className="eg-note">مفيش أخبار في آخر 48 ساعة.</p>
      : <ul className="nw-l">{items.map((x, i) => <li key={i}>
          <b>{x.url ? <a href={x.url} target="_blank" rel="noreferrer">{wd(x.title)}</a> : wd(x.title)}</b>
          <small>{x.source} · <bdi dir="ltr">{when(x.published_at)}</bdi> · <em className={x.status === 'confirmed' ? 'nw-c' : 'nw-r'}>{x.status === 'confirmed' ? 'مؤكد من مصدر رسمي' : 'منشور في الصحافة، محتاج تأكيد'}</em></small>
          {x.note ? <p className="eg-note">{wd(x.note)}</p> : null}
        </li>)}</ul>}
    {d && d.as_of ? <p className="eg-note">آخر تحديث لملف الأخبار: <bdi dir="ltr">{when(Date.parse(d.as_of) > now ? new Date(now).toISOString() : d.as_of)}</bdi></p> : null}
  </div></details>;
}
