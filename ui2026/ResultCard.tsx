import React, { useEffect, useState } from 'react';
import { arD } from './StockStatus';

// Home "نتيجتنا" card. Reads result_card.json (written daily by the scoring side). Live data only: nothing is invented here.
const isN = (v: any): v is number => typeof v === 'number' && isFinite(v) && v >= 0 && Math.floor(v) === v;
const card: React.CSSProperties = { background: '#111822', border: '1px solid #1e252f', borderRadius: 14, padding: 14, margin: '12px 0' };
const box: React.CSSProperties = { flex: 1, background: '#0b0f12', border: '1px solid #1e252f', borderRadius: 10, padding: 10, textAlign: 'center' };
const big: React.CSSProperties = { display: 'block', fontSize: 22, fontWeight: 700 };
const sm: React.CSSProperties = { fontSize: 12, color: '#a5aab2' };
const note: React.CSSProperties = { fontSize: 12, color: '#a5aab2', lineHeight: 1.7, margin: '6px 0 0' };
const MAX_AGE_DAYS = 4;
// Arabic count wording: 1 = إشارة واحدة, 2 = إشارتين, 3-10 = إشارات, otherwise إشارة.
const sig = (n: number) => (n === 1 ? 'إشارة واحدة' : n === 2 ? 'إشارتين' : n >= 3 && n <= 10 ? 'إشارات' : 'إشارة');
const cairoParts = (iso: string) => {
  const d = new Date(iso); if (isNaN(d.getTime())) return null;
  const date = d.toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' });
  const time = d.toLocaleTimeString('en-GB', { timeZone: 'Africa/Cairo', hour: 'numeric', minute: '2-digit', hour12: true }).replace(/\s*am/i, ' ص').replace(/\s*pm/i, ' م');
  return { date, time, ms: d.getTime() };
};

export function ResultCard() {
  const [d, setD] = useState<any>(undefined);
  useEffect(() => {
    let on = true;
    fetch('result_card.json?t=' + Date.now(), { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).catch(() => null).then(x => on && setD(x));
    return () => { on = false; };
  }, []);
  if (d === undefined || d === null) return null;
  const p = d && typeof d.as_of === 'string' ? cairoParts(d.as_of) : null;
  const stamp = p ? <>{arD(p.date)}، {p.time}</> : null;
  const ok = d && p && ['early', 'ok', 'no_signals_today'].includes(d.state) && isN(d.total_matured) && isN(d.total_hits) && d.total_hits <= d.total_matured && isN(d.events_today) && isN(d.hits_today) && d.hits_today <= d.events_today;
  const future = !!p && p.ms > Date.now() + 3600000;
  const stale = !!p && !future && Date.now() - p.ms > MAX_AGE_DAYS * 86400000;
  const head = <h3 style={{ margin: '0 0 4px', fontSize: 17 }}>نتيجتنا</h3>;
  if (!ok || future || stale) {
    return <section style={card} aria-label="نتيجتنا">{head}
      <p style={{ ...note, fontSize: 13, margin: 0 }}>{!ok || future ? 'غير متوفر: نتيجة الإشارات في الملف مش مظبوطة' : <>غير متوفر: آخر تحديث لنتيجة الإشارات قديم ({stamp}).</>}</p>
      {!ok || future ? null : <p style={note}>الأرقام اللي في الملف مش بنعرضها لأنها مش حديثة.</p>}
      <p style={note}>مش توصية بشراء أو بيع.</p></section>;
  }
  const mat: number = d.total_matured, hits: number = d.total_hits, min: number = isN(d.min_for_verdict) && d.min_for_verdict > 0 ? d.min_for_verdict : 30;
  const early = mat < min;
  const pct = Math.round((hits / mat) * 100);
  const t = (n: number) => <bdi dir="ltr">{n}</bdi>;
  const method = typeof d.method_note_ar === 'string' && d.method_note_ar.trim() ? d.method_note_ar : null;
  const foot = <>{method ? <p style={note}>{method}</p> : null}
    <p style={{ ...note, borderTop: '1px solid #1e252f', paddingTop: 8, marginTop: 10 }}>آخر تحديث: {stamp}{typeof d.session_date === 'string' ? <> · جلسة {arD(d.session_date)}</> : null}</p>
    <p style={note}>مش توصية بشراء أو بيع.</p></>;
  if (early) {
    return <section style={card} aria-label="نتيجتنا">{head}
      <p style={{ fontSize: 13, color: '#b4bac4', lineHeight: 1.7, margin: '0 0 10px' }}>بنسجّل كل إشارة بنطلّعها، ونشوف بعد كام يوم طلعت صح ولا لأ.</p>
      <div style={{ display: 'flex', gap: 8 }}><div style={box}><b style={{ ...big, color: '#25b896' }}>{t(hits)}</b><span style={sm}>{sig(hits)} صح</span></div><div style={box}><b style={big}>{t(mat)}</b><span style={sm}>{sig(mat)} اتقيّمت</span></div></div>
      <div style={{ height: 8, background: '#1e252f', borderRadius: 4, margin: '10px 0 4px', overflow: 'hidden' }}><i style={{ display: 'block', height: '100%', width: Math.min(100, (mat / min) * 100) + '%', background: '#a5aab2' }} /></div>
      <div style={sm}>اتقيّم {t(mat)} من {t(min)} {sig(min)} لازمين قبل ما نحكم</div>
      <span style={{ display: 'inline-block', background: '#1e252f', color: '#b4bac4', borderRadius: 8, padding: '4px 10px', fontSize: 13, marginTop: 6 }}>لسه بدري نحكم</span>
      {foot}</section>;
  }
  const none = d.events_today === 0;
    return <section style={card} aria-label="نتيجتنا">{head}
    <p style={{ fontSize: 13, color: '#b4bac4', lineHeight: 1.7, margin: '0 0 10px' }}>من {t(mat)} {sig(mat)} اتقيّمت، {t(hits)} طلعت صح، يعني تقريبًا <bdi dir="ltr">{pct}%</bdi>.{none ? ' مفيش إشارات اتسجّلت في آخر جلسة.' : ''}</p>
    <div style={{ display: 'flex', gap: 8 }}><div style={box}><b style={{ ...big, color: '#25b896' }}>{t(hits)}</b><span style={sm}>{sig(hits)} صح</span></div><div style={box}><b style={{ ...big, color: '#de575b' }}>{t(mat - hits)}</b><span style={sm}>{sig(mat - hits)} غلط</span></div><div style={box}><b style={big}>{none ? '—' : t(d.events_today)}</b><span style={sm}>{none ? 'إشارات آخر جلسة' : sig(d.events_today) + ' آخر جلسة'}</span></div></div>
    <div style={{ height: 8, background: '#1e252f', borderRadius: 4, margin: '10px 0 4px', overflow: 'hidden' }}><i style={{ display: 'block', height: '100%', width: pct + '%', background: '#25b896' }} /></div>
    <div style={sm}>النسبة بتتغير مع كل إشارة جديدة.</div>
    {foot}</section>;
}
