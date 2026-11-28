import { TeamBlock } from './scen';
import { NewsBlock } from './news';
import { useStudy, StudyLight, StudyLightFair } from './studyrest';
import { FairInline, FAIR6 } from './ui2026/FairSix';
import { FlowCombo } from './ui2026/FlowCombo';
import { StatusBanner, UsdNote, useCur, useStatus, useNty } from './ui2026/StockStatus';
const ComboOnly = ({ code }: { code: string }) => FAIR6.includes(code) ? null : <div className="sm fs-in"><FlowCombo k={code} /></div>;
const NMO: Record<string, string> = {"EEP": "منصة مصر للتعليم", "NMIN": "النصر للتعدين", "OCAP": "أو جى كابيتال للاستثمارات ذات غرض الاستحواذ", "EGS370O1C013": "الشركة الوطنية للطباعة", "EGS65621C012": "النصر للاسكان والتعمير"}; // official Arabic names where the feed has only English
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from './shim';
import { RefreshBar } from './refresh';
import { NEW } from './page';
import { xList } from './ui2026/ExplainLists';
import { ListHead, ListRow, ListNote, DayRange } from './ui2026/Lists';
// "باقي الأسهم": Starta symbols that are not in EGX 30, EGX 70 or the portfolio pages. Automatic data only, no review, no verdict.
const URL_STOCKS = 'https://startamarkets.com/api/v1/egx/stocks';
const URL_HIST = 'https://startamarkets.com/api/v1/egx/history/';
const PORT = ['MASR', 'BONY', 'HRHO', 'UNIP', 'PHAR', 'ORHD'];
const fmt = (v: number) => (v == null || !isFinite(v) ? '-' : v >= 1 ? v.toFixed(2) : v.toFixed(3));
const pc = (v: number) => (v > 0 ? '+' : '') + v.toFixed(2) + '%';
const big = (v: number) => { const a = Math.abs(v); return a >= 1e9 ? (v / 1e9).toFixed(2) + ' مليار' : a >= 1e6 ? (v / 1e6).toFixed(1) + ' مليون' : Math.round(v).toLocaleString('en-US'); };
const normQ = (s: string) => String(s || '').toLowerCase().replace(/[\u064B-\u0652\u0640]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').trim();
const cairo = (iso: string) => { try { const d = new Date(iso); return d.toLocaleDateString('en-GB', { timeZone: 'Africa/Cairo', day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('en-GB', { timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit' }); } catch { return ''; } };
const L = ({ children }: { children: React.ReactNode }) => <bdi dir="ltr">{children}</bdi>;
type Row = { symbol: string; name_ar: string; name_en: string; sector_name: string; last_price: number; prev_close: number; change_percent: number; volume: number; market_cap: number | null; pe_ratio?: number | null; pb_ratio?: number | null; high: number; low: number; open_price: number; high_52w: number | null; low_52w: number | null; as_of: string; is_stale: boolean };
type Data = { all: Row[]; mine: Set<string> };
let cache: Promise<Data> | null = null; let cacheAt = 0;
const load = (force = false): Promise<Data> => {
  if (!force && cache && Date.now() - cacheAt < 30000) return cache;
  cacheAt = Date.now();
  cache = Promise.all([
    fetch(URL_STOCKS + '?t=' + Date.now(), { cache: 'no-store' }).then(r => { if (!r.ok) throw 0; return r.json(); }),
    fetch('idx/index.json', { cache: 'no-store' }).then(r => r.json()).catch(() => null),
  ]).then(([s, ix]) => {
    if (!Array.isArray(s)) throw 0;
    const mine = new Set<string>(PORT);
    if (ix && Array.isArray(ix.rows)) ix.rows.forEach((r: any) => mine.add(r.code));
    return { all: s.filter((x: any) => x && x.symbol), mine };
  });
  cache.catch(() => { cache = null; });
  return cache;
};
function useData() {
  const [d, setD] = useState<Data | null>(null); const [err, setErr] = useState(false);
  useEffect(() => {
    let on = true;
    const go = (force = false) => load(force).then(x => { if (on) { setD(x); setErr(false); } }).catch(() => { if (on) setErr(true); });
    go();
    const h = () => go(true); window.addEventListener('egx-refresh', h);
    return () => { on = false; window.removeEventListener('egx-refresh', h); };
  }, []);
  return [d, err] as const;
}
const status = (r: Row) => r.is_stale ? 'آخر سعر قديم، ' + cairo(r.as_of) : !(r.volume > 0) ? 'مفيش تداول في آخر لقطة' : '';
const Label = () => <p className="eg-note ot-lb"><b>بيانات آلية فقط، مش مراجَعة.</b> الأرقام من المصدر زي ما هي، من غير فحص قوائم ولا تحليل ولا رأي.</p>;

export function OthersList() {
  const nty = useNty();
  const [d, err] = useData();
  const [q, setQ] = useState('');
  const rows = useMemo(() => {
    if (!d) return [];
    const nq = normQ(q);
    const base = d.all.filter(r => !d.mine.has(r.symbol) && r.last_price > 0 && r.symbol !== 'VLMR');
    const f = nq ? base.filter(r => (normQ(r.symbol) + ' ' + normQ(r.name_ar) + ' ' + normQ(r.name_en)).includes(nq)) : base;
    return f.slice().sort((a, b) => (b.last_price * (b.volume || 0)) - (a.last_price * (a.volume || 0)));
  }, [d, q]);
  if (err && !d) return <div className="eg-pad"><h2 className="eg-h">باقي الأسهم</h2><p className="eg-note">مقدرتش أوصل للمصدر دلوقتي. جرب تاني بعد شوية.</p></div>;
  if (!d) return <div className="eg-pad"><h2 className="eg-h">باقي الأسهم</h2><p className="eg-note">بحمّل القايمة...</p></div>;
  const at = d.all.reduce((m, r) => (!r.is_stale && r.as_of > m ? r.as_of : m), '');
  return <div className="eg-pad ix">
    <h2 className="eg-h">باقي الأسهم <span className="ix-n">{q ? '· نتايج البحث (' + rows.length + ')' : '(' + rows.length + ' سهم)'}</span></h2>
    <Label />
    <RefreshBar />
    <label className="ix-search"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M15.5 15.5 21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg><input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="ادخل رمز أو اسم الشركة" aria-label="بحث في باقي الأسهم" /></label>
    <ListNote line="آلي من المصدر، مش مراجَع، مش توصية. مرتبة بقيمة التداول." date={at ? cairo(at).slice(0, 5) : undefined}>
      <p>الأسهم دي مش في EGX 30 ولا EGX 70 ولا صفحات محفظتك. المصدر: Starta Markets{at ? '، آخر لقطة ' + cairo(at) : ''}. مرتبة بقيمة التداول.</p>
      <p>الشريط الصغير في الصف = مدى اليوم (أقل وأعلى سعر) ونقطة آخر سعر. مفيش تاريخ أسعار لباقي الأسهم هنا، فمفيش خط تاريخي. غير متوفر = المصدر مش بيدي الرقم.</p>
    </ListNote>
    <p className="ls-lg"><b>الحجم:</b> عدد الأسهم اللي اتداولت.</p>
    <p className="chp-x">{xList.range}</p>
    <ListHead mid="مدى اليوم" />
    {rows.length === 0 && <p className="eg-note">مفيش سهم بالاسم ده في الأسهم الباقية. جرب EGX 30 أو EGX 70.</p>}
    {rows.slice(0, 120).map(r => { const st = nty && nty[r.symbol] ? '' : status(r); return <ListRow key={r.symbol} to={'/s/' + r.symbol} name={NMO[r.symbol] || r.name_ar || r.name_en} code={r.symbol} badge={st ? { t: st, tone: 'gr' } : { t: 'بيانات آلية', tone: 'gr' }} spark={nty && nty[r.symbol] ? undefined : <DayRange lo={r.low} hi={r.high} last={r.last_price} />} price={nty && nty[r.symbol] ? undefined : fmt(r.last_price)} chg={nty && nty[r.symbol] ? null : r.change_percent || 0} na={nty && nty[r.symbol] ? 'مقيد مؤقتًا ولسه ماتداولش' : undefined} volLine={nty && nty[r.symbol] ? undefined : <span className="ls-c1"><bdi dir="ltr">{big(r.volume || 0)}</bdi> <bdi>سهم</bdi></span>} />; })}
    {rows.length > 120 && <p className="eg-note">معروض أول 120 سهم. اكتب في البحث عشان توصل لباقي الأسهم.</p>}
  </div>;
}

function HistChart({ code }: { code: string }) {
  const [h, setH] = useState<{ date: string; close: number }[] | null>(null); const [bad, setBad] = useState(false);
  useEffect(() => {
    let on = true; setH(null); setBad(false);
    fetch(URL_HIST + code, { cache: 'no-store' }).then(r => { if (!r.ok) throw 0; return r.json(); }).then(j => { if (!Array.isArray(j)) throw 0; const c = j.filter((x: any) => x && x.close > 0 && x.date).map((x: any) => ({ date: x.date, close: x.close })); on && setH(c.slice(-250)); }).catch(() => on && setBad(true));
    return () => { on = false; };
  }, [code]);
  if (bad) return <p className="eg-note">مقدرتش أحمل التاريخ من المصدر دلوقتي.</p>;
  if (!h) return <p className="eg-note">بحمّل التاريخ...</p>;
  if (h.length < 20) return <p className="eg-note">التاريخ المتاح قصير ({h.length} يوم)، فمفيش رسم.</p>;
  const v = h.map(x => x.close); const lo = Math.min(...v), hi = Math.max(...v);
  const pts = v.map((y, i) => (i / (v.length - 1) * 300).toFixed(1) + ',' + (88 - 80 * (y - lo) / ((hi - lo) || 1)).toFixed(1));
  const up = v[v.length - 1] >= v[0];
  return <div className="ot-ch">
    <svg viewBox="0 0 300 96" preserveAspectRatio="none" role="img" aria-label="رسم إقفال يومي"><path d={'M' + pts.join('L')} fill="none" stroke={up ? '#4cf0b0' : '#e58f9b'} strokeWidth="1.6" vectorEffect="non-scaling-stroke" /></svg>
    <div className="ot-ax"><span dir="ltr">{h[0].date}</span><span dir="ltr">{fmt(lo)} - {fmt(hi)}</span><span dir="ltr">{h[h.length - 1].date}</span></div>
    <p className="eg-note">إقفال يومي لآخر {h.length} جلسة (المصدر: Starta Markets). الخط بيوصف اللي حصل، مش توقع.</p>
  </div>;
}

const NA = (why: string) => <span className="na">غير متوفر <small>({why})</small></span>;
export function OtherFacts({ row: r, code }: { row: any; code?: string }) {
  const cur = useCur(String(code || (r && r.code) || ''));
  const own = !!(r && r.symbol && NEW(r.symbol));
  const m = (k: string, v: React.ReactNode, i?: React.ReactNode) => <div className="eg-m"><span>{k}</span><b>{v}</b>{i ? <i>{i}</i> : null}</div>;
  const in52 = r.high_52w && r.low_52w && r.high_52w > r.low_52w ? Math.round(100 * (r.last_price - r.low_52w) / (r.high_52w - r.low_52w)) : null;
  return <details className="eg-ex" open={false}><summary>أرقام السوق من المصدر · آلي، مش مراجَع</summary><div className="eg-exb">
    <p className="eg-use"><b>ده بيفيدك في إيه؟</b> تشوف حجم الشركة وسعر السهم بالنسبة لسنة كاملة{own ? '' : ' وبالنسبة لمضاعفات المصدر'}، من غير تحليل.</p>
    <p className="eg-note">آخر لقطة من المصدر: <L>{cairo(r.as_of)}</L>{r.is_stale ? '. السعر ده قديم، مفيش تحديث جديد من المصدر للسهم ده.' : '. متأخرة حتى 20 دقيقة.'} التغيّر يومي.</p>
    <div className="ot-g">
      {m('الحجم', <L>{big(r.volume || 0)}</L>, 'سهم')}
      {m('إقفال امبارح', <L>{fmt(r.prev_close)}</L>)}
      {m('أعلى / أقل اليوم', <L>{fmt(r.high)} / {fmt(r.low)}</L>)}
      {m('نطاق 52 أسبوع', r.high_52w && r.low_52w ? <L>{fmt(r.low_52w)} - {fmt(r.high_52w)}</L> : NA('المصدر مش بيدي النطاق'), in52 != null ? 'السعر عند ' + in52 + '% من النطاق' : undefined)}
      {m('القيمة السوقية', r.market_cap ? <L>{big(r.market_cap)}</L> : NA('المصدر مش بيدي القيمة السوقية للسهم ده'), r.market_cap && cur.word === 'جنيه' ? 'جنيه' : undefined)}
      {own ? null : m('مضاعف الربحية P/E', r.pe_ratio != null ? <L>{(+r.pe_ratio).toFixed(1)}×</L> : NA('المصدر مش بيدي المضاعف'))}
      {own ? null : m('السعر ÷ القيمة الدفترية P/B', r.pb_ratio != null ? <L>{(+r.pb_ratio).toFixed(2)}×</L> : NA('المصدر مش بيدي المضاعف'))}
      {own ? null : m('القطاع (بالمصدر)', r.sector_name ? <L>{r.sector_name}</L> : NA('المصدر مش بيحدده'))}
    </div>
    <p className="eg-note">الأرقام دي من Starta Markets زي ما هي. مفيش مراجعة ولا مقارنة بقوائم الشركة.</p>
  </div></details>;
}

export function OtherLight({ code, row, reason, unNode }: { code: string; row: any; reason: string; unNode?: React.ReactNode }) {
  const study = useStudy(code);
  const cur = useCur(code);
  const nty = useStatus(code);
  const back = <Link className="eg-back" to="/others">← باقي الأسهم</Link>;
  if (code === 'VLMR') return <div className="eg-pad">{back}<p className="eg-note">غير متوفر: السهم ده مش معروض في التطبيق.</p></div>;
  if (!row) return <div className="eg-pad">{back}
    {study ? <h2 className="eg-h">{study.record.name} <L>{code}</L></h2> : null}
    <StatusBanner k={code} />
    <UsdNote k={code} />
    {unNode ? unNode : <p className="eg-note">غير متوفر: {reason || 'مفيش بيانات للسهم ده.'}{study ? ' (سعر السوق والقراءة الفنية). الدراسة المالية تحت من القوائم، مش مراجَعة.' : ''}</p>}
    <FairInline code={code} />
    <ComboOnly code={code} />
    {study ? <><StudyLight st={study} /><StudyLightFair st={study} /><TeamBlock code={code} /><NewsBlock code={code} /></> : null}</div>;
  if (nty && nty.status === 'not_trading_yet') return <div className="eg-pad">{back}
    <h2 className="eg-h">{NMO[code] || nty.name || row.name_ar || row.name_en} <L>{code}</L></h2>
    <StatusBanner k={code} />
    <UsdNote k={code} />
    <p className="eg-note">غير متوفر: سعر ولا تغيير ولا حجم، لأن السهم لسه ماتداولش.</p>
    <FairInline code={code} />
  </div>;
  return <div className="eg-pad">{back}
    <h2 className="eg-h">{NMO[code] || row.name_ar || row.name_en} <L>{code}</L></h2>
    <StatusBanner k={code} />
    <Label />
    <div className="ot-px"><b dir="ltr">{fmt(row.last_price)}</b><small>{cur.short}</small><span className={row.change_percent >= 0 ? 'u' : 'd'} dir="ltr">{row.change_percent >= 0 ? '▲' : '▼'} {Math.abs(row.change_percent || 0).toFixed(2)}%</span></div>
    <UsdNote k={code} />
    <p className="eg-note">غير متوفر: القراءة الفنية والسيناريو والرسم. السبب: {reason}</p>
    <OtherFacts row={row} code={code} />
    <FairInline code={code} />
    <ComboOnly code={code} />
    {study ? <><StudyLight st={study} /><StudyLightFair st={study} /></> : null}
    <TeamBlock code={code} />
    <NewsBlock code={code} />
    <p className="eg-note">المصدر: <a href={'https://startamarkets.com/symbol/' + code} target="_blank" rel="noreferrer">Starta Markets</a>. مش نصيحة استثمار.</p>
  </div>;
}
