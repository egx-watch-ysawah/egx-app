import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { URL_INDEX } from '../feed';
import { xHome } from './Explain';
import { MarketClock } from './MarketClock';

const INDICES_URL = 'https://raw.githubusercontent.com/egx-watch-ysawah/egx-app/main/indices.json';
const fin = (x: any): x is number => typeof x === 'number' && isFinite(x);
const sg = (v: number, d = 2) => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(d);
const cairoDate = (iso: string) => { try { return new Date(iso).toLocaleDateString('en-GB', { timeZone: 'Africa/Cairo', day: '2-digit', month: '2-digit', year: 'numeric' }); } catch { return ''; } };

// Home market panel. Every number comes from idx/index.json (all rows share one session date) and indices.json.
export const LC_FILES = ['last_close_fallback.json', 'last_close.json'];
let LC_P: Promise<any> | null = null;
export const getLc = (): Promise<any> => LC_P || (LC_P = LC_FILES.reduce((p: Promise<any>, f) => p.then(x => x || fetch(f, { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).catch(() => null)), Promise.resolve(null)));
export const FLAG: Record<string, string> = { 'single-source': 'مصدر واحد', single: 'مصدر واحد', unconfirmed: 'غير مؤكد' };
export function HomePanel() {
  const [lc, setLc] = useState<any>(null);
  useEffect(() => { let on = true; getLc().then(l => on && setLc(l)); return () => { on = false; }; }, []);
  const flag = (code: string) => { const st = lc && lc.stocks && lc.stocks[code] && lc.stocks[code].status; return st && st !== 'confirmed' ? (FLAG[st] || 'غير مؤكد') : null; };
  const [ix, setIx] = useState<any>(null);
  const [ind, setInd] = useState<any>(() => { try { return JSON.parse(localStorage.getItem('egx-indices-v1') || 'null'); } catch { return null; } });
  useEffect(() => {
    let on = true;
    fetch('idx/index.json', { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).catch(() => null).then(x => on && setIx(x || { err: true }));
    const save = (x: any) => { if (!on || !x || !x.indices) return; setInd(x); try { localStorage.setItem('egx-indices-v1', JSON.stringify(x)); } catch { /* ignore */ } };
    // Same sources and order as the EGX 30 page: live quote first, then the published indices.json.
    fetch(URL_INDEX + '?t=' + Date.now(), { cache: 'no-store' }).then(r => (r.ok ? r.json() : Promise.reject())).then(q => {
      const k = q && q.quote;
      if (!k || !(k.value > 0) || !Number.isFinite(k.changePercent) || !k.timestamp) return Promise.reject();
      save({ indices: { egx30: { name: 'EGX 30', close: k.value, chg: k.changePercent, chg_abs: k.change } }, fetched_at_utc: k.timestamp });
    }).catch(() => fetch(INDICES_URL + '?t=' + Date.now(), { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).catch(() => null).then(x => {
      if (x && x.indices) return save(x);
      // Last resort: static last-close snapshot served with the app (same origin, no CORS).
      return getLc().then(l => {
        const e = l && l.indices && l.indices.egx30;
        if (!on || !e || !(e.close > 0) || !Number.isFinite(e.chg_pct) || !l.session_date) return;
        setInd({ indices: { egx30: { name: 'EGX 30', close: e.close, chg: e.chg_pct, chg_abs: e.chg_abs } }, last_close: String(l.session_date), lc_status: e.status });
      });
    }));
    return () => { on = false; };
  }, []);
  if (!ix) return <section className="hp"><p className="eg-note">بحمّل...</p></section>;
  const rows: any[] = ix.rows ? ix.rows.filter((r: any) => fin(r.chg) && (r.ok !== false || r.full === true)) : [];
  if (!rows.length) return <section className="hp"><p className="hp-na">غير متوفر: مقدرتش أقرا بيانات الأسهم دلوقتي.</p></section>;
  const date = (rows.find((r: any) => r.date) || {}).date as string | undefined;
  const up = rows.filter(r => r.chg > 0).length, dn = rows.filter(r => r.chg < 0).length, fl = rows.length - up - dn;
  const sorted = [...rows].sort((a, b) => b.chg - a.chg);
  const top = sorted.slice(0, 3), bot = sorted.slice(-3).reverse();
  const mx = Math.max(...top.map(r => Math.abs(r.chg)), ...bot.map(r => Math.abs(r.chg)), 0.01);
  const lead = rows.filter(r => fin(r.val)).sort((a, b) => b.val - a.val).slice(0, 5);
  const lm = lead.length ? lead[0].val : 1;
  const q = ind && ind.indices && ind.indices.egx30;
  const e30 = rows.filter(r => (r.lists || []).includes('egx30')), e70 = rows.filter(r => (r.lists || []).includes('egx70'));
  const brd = (a: any[]) => ({ u: a.filter(r => r.chg > 0).length, d: a.filter(r => r.chg < 0).length, n: a.length });
  const Row = ({ r, w }: { r: any; w: number }) => <Link to={'/s/' + r.code} className="hp-r">
    <span className="hp-n"><b title={r.name}>{r.name}</b><small dir="ltr">{r.code}{flag(r.code) ? <em className="hp-fl"> · {flag(r.code)}</em> : null}</small></span>
    <div className="hp-b" dir="ltr"><i className={r.chg > 0 ? 'u' : r.chg < 0 ? 'd' : 'g'} style={{ width: Math.max(3, (Math.abs(r.chg) / w) * 100) + '%' }} /></div>
    <span className={'hp-v ' + (r.chg > 0 ? 'u' : r.chg < 0 ? 'd' : 'f')} dir="ltr">{r.chg > 0 ? '▲' : r.chg < 0 ? '▼' : '–'} {Math.abs(r.chg).toFixed(2)}%</span>
  </Link>;
  const Br = ({ t, a }: { t: string; a: { u: number; d: number; n: number } }) => <div className="hp-br"><span>{t}</span>
    <div className="hp-st" dir="ltr"><i className="u" style={{ flex: a.u }} /><i className="f" style={{ flex: a.n - a.u - a.d }} /><i className="d" style={{ flex: a.d }} /></div>
    <b dir="ltr"><span className="u">▲ {a.u}</span> <span className="d">▼ {a.d}</span></b></div>;
  return <section className="hp" aria-label="ملخص السوق">
    <MarketClock />
    {q && fin(q.close) && fin(q.chg) ? <div className="hp-ix"><small>EGX 30 · {ind.last_close ? 'آخر إقفال · ' + ind.last_close + (ind.lc_status && ind.lc_status !== 'confirmed' ? ' · ' + (FLAG[ind.lc_status] || 'غير مؤكد') : '') : ind.fetched_at_utc ? cairoDate(ind.fetched_at_utc) : ''}</small>
      <b dir="ltr">{q.close.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</b>
      <span className={q.chg >= 0 ? 'u' : 'd'} dir="ltr">{q.chg >= 0 ? '▲' : '▼'} {sg(q.chg)}%</span><p className="chp-x">{xHome.index}</p></div>
      : <div className="hp-ix"><small>EGX 30</small><span className="hp-na">غير متوفر: مستوى المؤشر مش واصل دلوقتي</span></div>}
    <h3 className="hp-h">اتساع السوق {date ? '· ' + date : ''}</h3>
    <div className="hp-st big" dir="ltr"><i className="u" style={{ flex: up }} /><i className="f" style={{ flex: fl }} /><i className="d" style={{ flex: dn }} /></div>
    <div className="hp-lg" dir="ltr"><span className="u">▲ {up} طالع</span><span className="f">{fl} ثابت</span><span className="d">▼ {dn} نازل</span></div>
    <p className="chp-x">{xHome.breadth}</p>
    {e30.length ? <Br t={'EGX 30 · ' + e30.length + ' من 30'} a={brd(e30)} /> : null}{e70.length ? <Br t={'EGX 70 · ' + e70.length + ' من 70'} a={brd(e70)} /> : null}
    <h3 className="hp-h">الأقوى</h3>{top.map(r => <Row key={r.code} r={r} w={mx} />)}
    <p className="chp-x">{xHome.movers}</p>
    <h3 className="hp-h">الأضعف</h3>{bot.map(r => <Row key={r.code} r={r} w={mx} />)}
    <h3 className="hp-h">الأعلى قيمة تداول (مليون جنيه)</h3>
    {lead.map(r => <Link key={r.code} to={'/s/' + r.code} className="hp-r"><span className="hp-n"><b title={r.name}>{r.name}</b><small dir="ltr">{r.code}{flag(r.code) ? <em className="hp-fl"> · {flag(r.code)}</em> : null}</small></span>
      <div className="hp-b" dir="ltr"><i className="g" style={{ width: Math.max(3, (r.val / lm) * 100) + '%' }} /></div>
      <span className="hp-v" dir="ltr">{Math.round(r.val / 1e6).toLocaleString('en-US')}</span></Link>)}
    <p className="chp-x">{xHome.value}</p>
    <p className="hp-na">القطاعات: غير متوفر، مفيش تقسيم قطاعي رسمي من البورصة هنا. الأسهم الستة بس عليها تصنيف مزود البيانات في صفحة تحليلها.</p>
    <p className="hp-note">الأسهم المحسوبة: <bdi dir="ltr">{rows.length}</bdi> سهم من <bdi dir="ltr">EGX 30</bdi> و<bdi dir="ltr">EGX 70</bdi>{Array.isArray(ix.rows) && ix.rows.length > rows.length ? <>، لا يشمل <bdi dir="ltr">{ix.rows.length - rows.length}</bdi> أسهم بياناتها ناقصة أو مش مظبوطة.</> : '.'} أسعار متأخرة من Starta Markets. مش توصية.</p>
  </section>;
}
