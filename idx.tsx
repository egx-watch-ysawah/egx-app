import { StockChips } from './ui2026/Chips';
import { TechnicalSummary } from './ui2026/TechnicalSummary';
import { xList } from './ui2026/ExplainLists';
import { xHome } from './ui2026/Explain';
import { ListHead, ListRow, ListNote, ListSpark, useSpark, statusBadge, voteScore } from './ui2026/Lists';
import React, { useEffect, useState } from 'react';
import { useStarta, URL_INDEX, inSessionNow } from './feed';
import { RefreshBar } from './refresh';
import { Link, useParams } from './shim';
import { StockChart } from './Chart';
import { rows as mkRows, resample, RANGES, TF_AR, TF } from './indic';
import { NoteCard, SourcesBar } from './srcs';
import { ScenarioBlock, TeamBlock, StudyMeta, Glossary, stampNote } from './scen';
import { useClientStock } from './clientidx';
import { OtherFacts, OtherLight } from './others';
import { NewsBlock } from './news';
import { useStudy, StudyFin, StudyFair } from './studyrest';
import { WIDE, WideFair, WideFin } from './wide';
import { V7Card, isV7, useFairNew } from './v7';
import { NEW, PVN, usePage, usePageGate } from './page';
import { TopWarn } from './topwarn';
import { StockGuide, OnTab, isReviewed, reviewedRec, HELD } from './guide';
import { AUTO_LABEL, AUTO_NOTE, AUTO_DISCLAIMER, NO_DATA, CARD_TEXT, CARDS, TPL_NOTE, TPL_NAME, FV_METHOD, Tpl } from './fundamentalsText';

const cache: Record<string, Promise<any>> = {};
// Arabic display names for the few companies the data source only lists in English. Short names, checked by the content agent.
const AR_NAMES: Record<string, string> = {
  FWRY: 'فوري',
  RMDA: 'راميدا',
  EFIH: 'إي فاينانس',
  VLMRA: 'فالمور القابضة',
  OFH: 'أو بي المالية القابضة',
  ISMQ: 'الحديد والصلب للمناجم والمحاجر',
  MCRO: 'ماكرو جروب',
  TAQA: 'طاقة عربية',
  IEEC: 'المشروعات الصناعية والهندسية',
  ACTF: 'أكت فاينانشال',
  CNFN: 'كونتكت المالية القابضة',
  VALU: 'يو للتمويل الاستهلاكي (فاليو)',
  GDWA: 'جدوى للتنمية الصناعية',
  BONY: 'بنيان للتنمية والتجارة',
  GOUR: 'جورميه',
  PRDC: 'بايونيرز بروبرتيز',
};
const arName = (code: string, name: string) => (/[A-Za-z]{3}/.test(String(name || '')) && AR_NAMES[code]) || name;
const getJson = (p: string) => cache[p] || (cache[p] = fetch(p, { cache: 'no-store' }).then(r => { if (!r.ok) throw new Error(p); return r.json(); }));
function useJson(p: string) {
  const [d, setD] = useState<any>(null); const [e, setE] = useState(false);
  useEffect(() => { let on = true; getJson(p).then(x => { if (x && Array.isArray(x.rows)) x.rows.forEach((r: any) => { r.name = arName(r.code, r.name); }); else { const mm = /idx\/([A-Z0-9]+)\.json$/.exec(p); if (x && mm) x.name = arName(mm[1], x.name); } on && setD(x); }).catch(() => { delete cache[p]; on && setE(true); }); return () => { on = false; }; }, [p]);
  return [d, e] as const;
}
const overlay = (d: any, f: any) => {
  if (!d || !Array.isArray(d.rows) || !f) return d;
  const rows = d.rows.map((r: any) => { const s = f.rows[r.code]; return s && !s.stale ? { ...r, price: s.price, chg: s.chg, vol: s.vol, val: s.price * s.vol } : r; });
  return { ...d, rows, asof: f.at };
};
const L = ({ children }: { children: React.ReactNode }) => <bdi dir="ltr">{children}</bdi>;
const fmt = (v: number) => (v >= 1 ? v.toFixed(2) : v.toFixed(3));
const pc = (v: number) => (v > 0 ? '+' : '') + v.toFixed(2) + '%';
const big = (v: number) => { const a = Math.abs(v); return a >= 1e9 ? (v / 1e9).toFixed(2) + ' مليار' : a >= 1e6 ? (v / 1e6).toLocaleString('en-US', { maximumFractionDigits: 1 }) + ' مليون' : Math.round(v).toLocaleString('en-US'); };
const shortN = (v: number) => v >= 1e6 ? (v / 1e6).toFixed(2) + 'M' : v >= 1e3 ? Math.round(v / 1e3) + 'K' : String(Math.round(v));
const Det = ({ title, children, open }: { title: string; children: React.ReactNode; open?: boolean }) => <details className="eg-ex" open={open}><summary>{title}</summary><div className="eg-exb">{children}</div></details>;

function status(r: any) {
  if (r.full) return 'صفحة تحليل كاملة';
  if (!r.ok) return 'مفيش تاريخ كفاية للتحليل الفني';
  const v = r.votes || {};
  return v.trend && v.mid ? 'فوق متوسط 200 و50' : !v.trend && !v.mid ? 'تحت متوسط 200 و50' : v.trend ? 'فوق متوسط 200، تحت 50' : 'تحت متوسط 200، فوق 50';
}

const INDICES_URL = 'https://raw.githubusercontent.com/egx-watch-ysawah/egx-app/main/indices.json';
function IndexSummary({ which }: { which: 'egx30' | 'egx70' }) {
  const [j, setJ] = useState<any>(() => { try { return JSON.parse(localStorage.getItem('egx-indices-v1') || 'null'); } catch { return null; } });
  useEffect(() => {
    let dead = false;
    const save = (x: any) => { if (dead || !x || !x.indices) return; setJ(x); try { localStorage.setItem('egx-indices-v1', JSON.stringify(x)); } catch { /* ignore */ } };
    const go = () => fetch(URL_INDEX + '?t=' + Date.now(), { cache: 'no-store' }).then(r => r.ok ? r.json() : Promise.reject()).then(q => {
      const k = q && q.quote;
      if (!k || !(k.value > 0) || !Number.isFinite(k.changePercent) || !k.timestamp) return Promise.reject();
      save({ indices: { egx30: { name: 'EGX 30', close: k.value, chg: k.changePercent, chg_abs: k.change } }, fetched_at_utc: k.timestamp, live: true, loaded_at: new Date().toISOString(), delay_s: Number.isFinite(q.delaySeconds) ? q.delaySeconds : 900 });
    }).catch(() => fetch(INDICES_URL + '?t=' + Date.now(), { cache: 'no-store' }).then(r => r.ok ? r.json() : Promise.reject()).then(save).catch(() => {}));
    go();
    window.addEventListener('egx-refresh', go);
    const tm = setInterval(() => { if (document.visibilityState === 'visible' && inSessionNow()) go(); }, 60000);
    return () => { dead = true; clearInterval(tm); window.removeEventListener('egx-refresh', go); };
  }, []);
  if (which !== 'egx30') return null;
  const x = j && j.indices && j.indices[which];
  if (!x || !Number.isFinite(x.close) || !Number.isFinite(x.chg)) return <section className="hb ixs"><div className="hb-top"><small>{which === 'egx30' ? 'EGX 30' : 'EGX 70'}</small><p className="eg-note">مستوى المؤشر مش متاح دلوقتي.</p></div></section>;
  const up = x.chg >= 0, cls = up ? 'hb-up' : 'hb-down';
  // Market closed: the card shows the last session's close, so the wording must not say "today" or "delayed".
  const closed = !inSessionNow();
  const lastSess = (() => { const C = (d: Date) => Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Cairo', weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(d).map(p => [p.type, p.value])) as any; const n = C(new Date()); const mins = +n.hour * 60 + +n.minute; for (let i = 0; i < 8; i++) { const p = C(new Date(Date.now() - i * 86400000)); if (['Sun', 'Mon', 'Tue', 'Wed', 'Thu'].includes(p.weekday) && (i > 0 ? true : mins >= 890)) return p.day + '/' + p.month; } return ''; })();
  const sg = (v: number, d: number) => (v > 0 ? '+' : v < 0 ? '-' : '') + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const ft = (iso: string, timeOnly?: boolean) => { try { const dt = new Date(iso); const o: any = { timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit', hour12: false }; const tm = dt.toLocaleTimeString('en-GB', o); const dd = dt.toLocaleDateString('en-GB', { timeZone: 'Africa/Cairo', day: '2-digit', month: '2-digit' }); const today = new Date().toLocaleDateString('en-GB', { timeZone: 'Africa/Cairo', day: '2-digit', month: '2-digit' }); return timeOnly || dd === today ? tm : tm + ' ' + dd; } catch { return ''; } };
  let at = '';
  try { const dt = new Date(j.fetched_at_utc); const o: any = { timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit', hour12: false }; const t = dt.toLocaleTimeString('en-GB', o); const d = dt.toLocaleDateString('en-GB', { timeZone: 'Africa/Cairo', day: '2-digit', month: '2-digit' }); at = t + ' ' + d; } catch { /* ignore */ }
  return <section className="hb ixs" aria-label={'مؤشر ' + x.name}>
    <div className="hb-top">
      <small>{which === 'egx30' ? 'مؤشر EGX 30' : 'مؤشر EGX 70 (متساوي الأوزان)'}</small>
      <b className="hb-total" dir="ltr">{x.close.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</b>
      <div className={'hb-day ' + cls} dir="ltr"><span>{sg(x.chg_abs, 1)}</span><span>{up ? '▲' : '▼'} {sg(x.chg, 2)}%</span></div>
      <p className="ixs-s">{closed && lastSess ? (up ? 'المؤشر طالع في آخر جلسة ' : 'المؤشر نازل في آخر جلسة ') + '(' + lastSess + ')' : up ? 'المؤشر طالع النهارده' : 'المؤشر نازل النهارده'}</p>
      {closed && lastSess ? <p className="ixs-t">إقفال آخر جلسة (<bdi dir="ltr">{lastSess}</bdi>)</p> : j.live ? <p className="ixs-t">اتحمّل الساعة <bdi dir="ltr">{ft(j.loaded_at)}</bdi> · المصدر بيعلن إن المؤشر متأخر حوالي {Math.round((j.delay_s || 900) / 60)} دقيقة، مش لحظي. الوقت المسجّل عنده للمؤشر ثابت <bdi dir="ltr">{ft(j.fetched_at_utc, true)}</bdi> طول اليوم، فمش بنعتمد عليه.</p>
        : <p className="ixs-t">{at && <>آخر تحديث <bdi dir="ltr">{at}</bdi> · </>}{stampNote(j.fetched_at_utc)}</p>}
    </div>
  </section>;
}

import { useUN, UnNote } from './unavail';
const normQ = (s: string) => String(s || '').toLowerCase().replace(/[\u064B-\u0652\u0640]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').trim();

export function IndexList({ which }: { which: 'egx30' | 'egx70' }) {
  const [d0, err] = useJson('idx/index.json');
  const sf = useStarta();
  const d = React.useMemo(() => overlay(d0, sf), [d0, sf]);
  const [sort, setSort] = useState<'val' | 'up' | 'down'>('val');
  const [q, setQ] = useState('');
  const spk = useSpark();
  const title = which === 'egx30' ? 'EGX 30' : 'EGX 70';
  if (err) return <div className="eg-pad"><h2 className="eg-h">{title}</h2><p className="eg-note">مقدرتش أحمل القايمة. جرب تفتح التطبيق تاني.</p></div>;
  if (!d) return <div className="eg-pad"><h2 className="eg-h">{title}</h2><p className="eg-note">بحمّل القايمة...</p></div>;
  const nq = normQ(q);
  const rows = d.rows.filter((r: any) => !(r.code === 'VLMR') && (nq ? (normQ(r.code) + ' ' + normQ(r.name)).includes(nq) : (r.lists.includes(which)))).slice();
  rows.sort((a: any, b: any) => sort === 'val' ? (b.val || 0) - (a.val || 0) : sort === 'up' ? (b.chg ?? -99) - (a.chg ?? -99) : (a.chg ?? 99) - (b.chg ?? 99));
  const chip = (id: 'val' | 'up' | 'down', n: string) => <button type="button" className={'eg-chip' + (sort === id ? ' on' : '')} onClick={() => setSort(id)}>{n}</button>;
  return <div className="eg-pad ix">
    <h2 className="eg-h">{title} <span className="ix-n">{nq ? '· نتايج البحث (' + rows.length + ')' : '(' + rows.length + ' سهم)'}</span></h2>
    <IndexSummary which={which} />
    <RefreshBar />
    <label className="ix-search"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M15.5 15.5 21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg><input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="ادخل رمز أو اسم الشركة" aria-label="بحث عن سهم" autoComplete="off" /></label>
    <ListNote line="الحالة وصف للسعر من المتوسطات، مش توصية." date={String(rows.reduce((m: string, r: any) => (r.date && r.date > m ? r.date : m), '') || '').slice(5).split('-').reverse().join('/')}>
      <p>الأسعار: {stampNote(d.asof)}. التغيّر يومي. الحالة وصف للسعر من متوسط 200 و50 جلسة، مش توصية.{which === 'egx70' ? ' ' + d.note70 : ''}</p>
      <p>الدايرة = عدد الفحوص الفنية الإيجابية من 5 (اتجاه طويل، متوسط، ماكد، RSI، حجم). الخط = إقفال آخر 30 جلسة.</p>
    </ListNote>
    <div className="eg-chips">{chip('val', 'الأعلى تداولًا')}{chip('up', 'الأكثر ارتفاعًا')}{chip('down', 'الأكثر هبوطًا')}</div>
    <p className="eg-note ix-lg"><b>الحجم:</b> عدد الأسهم اللي اتداولت. <b>القيمة:</b> فلوس التداول بالمليون جنيه.</p>
    <p className="chp-x">{xHome.value} {xList.score}</p>
    <ListHead mid="آخر 30 جلسة" />
    {nq && rows.length === 0 && <p className="eg-note">مفيش سهم بالاسم ده في EGX 30 أو EGX 70.</p>}
    {rows.map((r: any) => {
      const to = r.full ? '/' + r.code.toLowerCase() : '/s/' + r.code;
      const vl = <><span className="ls-c1"><bdi dir="ltr">{r.vol != null ? shortN(r.vol) : '-'}</bdi> <bdi>سهم</bdi></span><span className="ls-c2">{r.val != null && r.code !== 'VLMRA' ? <><bdi dir="ltr">{Math.round(r.val / 1e6).toLocaleString('en-US')}</bdi> <bdi>مليون جنيه</bdi></> : null}</span></>;
      return <ListRow key={r.code} to={to} off={!(r.ok || r.full)} name={r.name} code={r.code} tag={nq ? (r.lists.includes('egx30') ? 'EGX 30' : r.lists.includes('egx70') ? 'EGX 70' : '') : undefined} badge={statusBadge(r)} score={voteScore(r)} spark={r.code === "VLMRA" ? <span className="ls-na">غير متوفر</span> : <ListSpark c={spk && spk[r.code] ? spk[r.code].c : undefined} />} price={r.price != null ? fmt(r.price) : undefined} chg={r.code === 'VLMRA' ? null : r.chg} na={r.code === 'VLMRA' ? 'السعر بالدولار، مش معروض بالجنيه' : undefined} volLine={vl} />;
    })}
    <p className="eg-note">آخر تحديث للقايمة: <L>{(() => { try { const t = new Date(d.asof); return t.toLocaleDateString('en-GB', { timeZone: 'Africa/Cairo', day: '2-digit', month: '2-digit' }) + ' ' + t.toLocaleTimeString('en-GB', { timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit', hour12: false }); } catch { return String(d.asof).slice(0, 10); } })()}</L> · الأسهم اللي فيها تاريخ ناقص بتظهر بالسعر بس.</p>
  </div>;
}

function Card({ k, f }: { k: string; f: any }) {
  const t = CARD_TEXT[k]; if (!t) return null;
  const fl = f.fields || {}, dv = f.derived || {};
  const raw = k in fl ? fl[k] : k === 'pe' ? dv.pe : k === 'pb' ? dv.pb : k === 'roe_ttm_pct' ? dv.roe_ttm_pct : null;
  if (raw == null) return null;
  const val = k === 'earnings_per_share_basic_ttm' ? raw.toFixed(2) + ' ج' : k === 'net_margin_ttm' || k === 'roe_ttm_pct' ? raw.toFixed(1) + '%' : k === 'pe' || k === 'pb' ? raw.toFixed(2) + '×' : big(raw) + ' ج';
  return <div className="gd-it mid"><div className="gd-h"><span>{t.title}</span><b dir="ltr">{val}</b></div>
    <p><em>يعني إيه: </em>{t.what}</p><p><em>تأثيره على السهم: </em>{t.effect}</p>
    <p className="ix-lbl">{AUTO_LABEL} · {f.period}</p></div>;
}
function AutoFin({ f }: { f: any }) {
  if (!f) return <div className="gd-sum">{NO_DATA}<small>{AUTO_LABEL}</small></div>;
  const tpl: Tpl = f.template; const fl = f.fields || {}, dv = f.derived || {};
  const cards = (CARDS[tpl] || CARDS.standard).map(k => <Card key={k} k={k} f={f} />).filter(Boolean);
  const bits: string[] = [];
  const ni = fl.net_income_ttm ?? fl.net_income_fy;
  if (ni != null) bits.push((fl.net_income_ttm != null ? 'ربح آخر 12 شهر ' : 'ربح آخر سنة مالية ') + big(ni) + ' ج.م');
  if (tpl === 'standard' || tpl === 'bank') { if (dv.pe != null) bits.push('السهم بيتداول بمضاعف ربحية ' + dv.pe.toFixed(1) + '×'); }
  else if (dv.pb != null) bits.push('السهم بيتداول بـ ' + dv.pb.toFixed(2) + '× القيمة الدفترية');
  return <>
    <p className="gd-sum">{bits.length ? bits.join('، ') + '.' : NO_DATA}<small>{AUTO_LABEL} · {f.period} · {TPL_NAME[tpl]}</small></p>
    <p className="gd-foot">{AUTO_NOTE}</p>
    <details className="gd-det"><summary>التفاصيل</summary>{cards.length ? cards : <p className="gd-foot">{NO_DATA}</p>}<p className="gd-foot">{TPL_NOTE[tpl]}</p></details>
  </>;
}
function AutoFair({ f, close }: { f: any; close: number }) {
  const fv = f && f.fair_value;
  if (!fv || !fv.low_base_high) return <p className="gd-sum">{NO_DATA}<small>{fv && fv.reason ? fv.reason + ' · ' : ''}{AUTO_LABEL}</small></p>;
  const [lo, mid, hi] = fv.low_base_high;
  const pos = close < lo ? 'تحت أقل رقم في' : close > hi ? 'فوق أعلى رقم في' : 'جوه';
  const fmx = (x: number) => (x >= 1 ? x.toFixed(2) : x.toFixed(3));
  return <div className="gd-fv"><h4>مدى تقديري بمضاعفات عامة · {AUTO_LABEL}</h4>
    <p className="gd-sum">السعر الحالي {pos} المدى التقديري (الحذر {fmx(lo)}، المتفائل {fmx(hi)}).<small>{AUTO_DISCLAIMER} · مضاعفات افتراضية عامة مش مبنية على دراسة السهم · {f.period}</small></p>
    <div className="gd-rng"><div><small>حذر</small><b dir="ltr">{fmx(lo)}</b></div><div><small>أساسي</small><b dir="ltr">{fmx(mid)}</b></div><div><small>متفائل</small><b dir="ltr">{fmx(hi)}</b></div></div>
    <details className="gd-det"><summary>التفاصيل</summary><p className="gd-foot">{FV_METHOD(fv.basis, fv.multiples)}</p><p className="gd-foot">{TPL_NOTE[f.template as Tpl]}</p></details></div>;
}

export function IdxStock() {
  const { code: kc = '' } = useParams();
  const okp = usePageGate(kc);
  if (!okp) return <p className="eg-note">بحمّل...</p>;
  return <IdxStockInner key={kc} />;
}

export function PageSwitch({ k, old }: { k: string; old: React.ReactElement }) {
  const ok = usePageGate(k); usePage(k);
  if (!ok) return <p className="eg-note">بحمّل...</p>;
  return NEW(k) ? <IdxStockInner key={k} code={k} /> : old;
}
function IdxStockInner({ code: codeP }: { code?: string }) {
  const prm = useParams();
  const code = codeP || prm.code || '';
  const [s1, err1] = useJson('idx/' + code + '.json');
  const cl = useClientStock(code, !!err1);
  const s = s1 || cl.s;
  const err = !!err1 && cl.done && !cl.s;
  const [fund] = useJson('fundamentals.json');
  const [fundR] = useJson('fundamentals_rest.json');
  const study = useStudy(code);
  const [ix0] = useJson('idx/index.json');
  const sf = useStarta();
  const ix = React.useMemo(() => overlay(ix0, sf), [ix0, sf]);
  const reviewed = isReviewed(code);
  const v7NR = isV7(code) && !reviewed && !NEW(code);
  const fairNew = useFairNew(code);
  const pgT = usePage(code);
  const UNS = useUN();
  const unr = UNS && !NEW(code) ? UNS.map[String(code).toUpperCase()] || null : null;
  const unNode = unr ? <div className="gd-sum"><b>غير متوافر حاليا:</b> {unr.reason_ar}</div> : null;
  const held = HELD.includes(code);
  const finNew = !!(NEW(code) && pgT && pgT.fin_items_ar);
  const [tf, setTf] = useState<TF>('D'); const [n, setN] = useState(130);
  const [t, setT] = useState({ sma: true, vol: false, rsi: false, macd: false, plan: false, bb: false });
  const trows = React.useMemo(() => s && !s.nohist ? mkRows(resample(s.bars, tf)) : [], [s, tf]);
  const row = ix && ix.rows.find((r: any) => r.code === code);
  const isOther = !!cl.s || (!!err1 && !row);
  useEffect(() => { (window as any).__egxOther = isOther; window.dispatchEvent(new Event('egx-nav')); return () => { (window as any).__egxOther = false; window.dispatchEvent(new Event('egx-nav')); }; }, [isOther]);
  const back = isOther ? '/others' : row && !row.lists.includes('egx30') ? '/egx70' : '/egx30';
  const tg = (key: keyof typeof t, name: string) => <button type="button" className={'eg-chip' + (t[key] ? ' on' : '')} aria-pressed={t[key]} onClick={() => setT({ ...t, [key]: !t[key] })}>{t[key] ? '✓ ' : ''}{name}</button>;
  if (err) return <><OtherLight code={code} row={cl.row || null} reason={cl.fail || ''} />{unr ? <div className="eg-pad"><div className="gd-sum"><b>غير متوافر حاليا:</b> {unr.reason_ar}</div></div> : null}</>;
  if (!s) return <div className="eg-pad"><Link className="eg-back" to={back}>← رجوع</Link><p className="eg-note">بحمّل...</p></div>;
  const f = (fund && fund.stocks && fund.stocks[code]) || (fundR && fundR.stocks && fundR.stocks[code]);
  const chartNode = code === 'VLMRA' ? null : <Det title="الشارت" open>
        <div className="eg-rowlab">مدة الشمعة</div><div className="eg-chips">{(['D', 'W', 'M'] as TF[]).map(x => <button type="button" key={x} className={'eg-chip' + (tf === x ? ' on' : '')} onClick={() => { setTf(x); setN(RANGES[x][1][1]); }}>{TF_AR[x]}</button>)}</div>
        <div className="eg-rowlab">الفترة المعروضة</div><div className="eg-chips">{RANGES[tf].filter(([, b]) => b <= trows.length).concat([['المتاح كله', trows.length]] as [string, number][]).map(([a, b]) => <button type="button" key={a} className={'eg-chip eg-sm' + (n === b ? ' on' : '')} onClick={() => setN(b)}>{a}</button>)}</div>
        <StockChart key={code + tf} rows={trows} n={n} t={t} plan={s.plan && s.plan.entry > 0 && s.plan.tv >= 1 ? s.plan : { entry: 0, stop: 0, target: 0, trail: 0 }} closeDate={s.date} tfName={{D:'يومية',W:'أسبوعية',M:'شهرية'}[tf]} rangeLabel={(RANGES[tf].find(([,b])=>b===n)||['المتاح كله'])[0]} bar={<>{s.plan && s.plan.entry > 0 && s.plan.tv >= 1 ? tg('plan', 'مستويات السيناريو') : null}{tg('sma', 'متوسطات')}{tg('vol', 'حجم')}{tg('bb', 'بولينجر')}{tg('rsi', 'RSI')}{tg('macd', 'MACD')}</>} />
      </Det>;
  return <div className="eg-pad">
    <Link className="eg-back" to={back}>← {back === '/others' ? 'باقي الأسهم' : back === '/egx70' ? 'EGX 70' : 'EGX 30'}</Link>
    <div className="eg-in">
      <h2 className="eg-h ix-top">{unr && unr.name_ar ? unr.name_ar : NEW(code) && pgT && pgT.title_ar_short ? pgT.title_ar_short : s.name} {/^EGS/.test(code) ? null : <span dir="ltr">({code})</span>}</h2><TopWarn k={code}/>{unr ? <UnNote r={unr} /> : null}
      <p className="eg-note">إقفال <bdi>{((d:string)=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(d||''));return m?(+m[3])+' '+['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'][+m[2]-1]+' '+m[1]:String(d||'')})(s.date)}</bdi> {s.nohist ? null : <>· <L>{s.historyCount}</L> جلسة{code === 'MTIE' && PVN() ? ' (آخر 3 سنين)' : ''}</>} <span style={{ whiteSpace: 'nowrap' }}>من <a href={s.source} target="_blank" rel="noreferrer"><bdi>{s.sourceName}</bdi></a> · تحليل آلي</span></p>
      {s.nohist ? <p className="eg-note"><b>تنبيه:</b> مفيش تاريخ أسعار حديث عند المصدر، فالقراءة الفنية والشارت والسيناريوهات المبنية على السعر غير متاحة. آخر سعر عند المصدر: <bdi>{s.close}</bdi> ج.م. الدراسة المالية (المالي والسعر العادل والخلاصة) مبنية على القوائم.</p> : null}
      <StockChips s={s} code={code} />
      <StockGuide s={s} k={code} r={reviewed ? reviewedRec(code) : null} light={!reviewed && !NEW(code)} fin={unNode ? unNode : v7NR ? <div className="gd-sum">{NO_DATA}</div> : WIDE.includes(code) ? <><WideFin k={code} />{reviewed || finNew ? null : study ? <StudyFin st={study} /> : <AutoFin f={f} />}</> : finNew ? null : study ? <StudyFin st={study} /> : <AutoFin f={f} />} fair={unNode ? unNode : v7NR ? <div className="gd-sum">{NO_DATA}</div> : WIDE.includes(code) ? <WideFair k={code} fallback={study ? <StudyFair st={study} /> : <AutoFair f={f} close={s.close} />} /> : study ? <StudyFair st={study} /> : <AutoFair f={f} close={s.close} />} chart={chartNode} fairNew={fairNew} unNote={unNode} />
      {fairNew || held ? null : <OnTab id="f"><V7Card k={code} /></OnTab>}
      {fairNew ? <><style>{'.gd-fv{display:none}'}</style><OnTab id="v"><V7Card k={code} fair /></OnTab></> : null}
      {held ? null : <OnTab id="f">{cl.s && cl.row ? <OtherFacts row={cl.row} /> : null}</OnTab>}
      {held ? null : <OnTab id="f">{reviewed ? null : <NoteCard code={code} />}</OnTab>}
      
      <OnTab id="t">{s.short ? <p className="eg-note"><b>تنبيه:</b> تاريخ سعر السهم قصير (أقل من 260 جلسة)، فالمؤشرات الفنية والشارت والسيناريوهات أقل موثوقية. الدراسة المالية (المالي والسعر العادل والخلاصة) مبنية على القوائم.</p> : null}{s.jump ? <p className="eg-note"><b>تنبيه:</b> تاريخ سعر السهم فيه قفزة أكبر من 25% في يوم واحد، فالمؤشرات الفنية والشارت والسيناريوهات المبنية على السعر مش موثوقة. الدراسة المالية (المالي والسعر العادل والخلاصة) مبنية على القوائم ومش متأثرة.</p> : null}</OnTab>
      <OnTab id="t"><TechnicalSummary s={s} /></OnTab>
      <OnTab id="t">{code === 'VLMRA' || s.jump || s.short || s.nohist ? null : <ScenarioBlock s={s} />}</OnTab>
      {held ? null : <OnTab id="f"><TeamBlock code={code} /></OnTab>}
      {held ? null : <OnTab id={reviewed ? 'd' : 'f'}><NewsBlock code={code} /></OnTab>}
      <OnTab id="t"><Glossary /></OnTab>
      {held ? null : <OnTab id="f">{reviewed ? <StudyMeta code={code} /> : null}</OnTab>}
      {held ? null : <OnTab id="f"><SourcesBar code={code} reviewed={reviewed} /></OnTab>}
    </div>
  </div>;
}
