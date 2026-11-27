import React, { useEffect, useState } from 'react';
import { Link } from '../shim';
import { DATA } from '../data';
import { RULE_AR, KEYS } from '../shared';
// Signals screen. Only data that exists:
//  - fired signals + their own backtest sample (n, win %, avg %) for the 6 held stocks (data.json: fire, bt)
//  - technical score = count of positive indicators out of 5 (votes) for EGX30/EGX70 rows in idx/index.json
// Missing = grey badge with reason. No stock is in both the strong and the weak list (score >=4 vs <=1).
const MIN_N = 20; // proposed minimum sample for a colored result (product agent to confirm)
const NAMES = ['trend', 'mid', 'macd', 'rsi', 'vol'] as const;
const LBL: Record<string, string> = { trend: 'فوق 200', mid: 'فوق 50', macd: 'ماكد', rsi: 'RSI', vol: 'حجم' };
const sg = (v: number) => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(1) + '%';
const cls = (v: number) => (v > 0 ? 'up' : v < 0 ? 'dn' : 'gr');
const to = (code: string) => (KEYS.includes(code) ? '/' + code.toLowerCase() : '/s/' + code);

function Dots({ votes }: { votes: any }) {
  return <span className="sg-dots" dir="ltr" aria-label="المؤشرات الإيجابية">{NAMES.map(n => <i key={n} className={votes[n] ? 'on' : ''} title={LBL[n]} />)}</span>;
}

export function Signals() {
  const [d, setD] = useState<any>(null); const [err, setErr] = useState(false);
  useEffect(() => { fetch('idx/index.json', { cache: 'no-store' }).then(r => r.json()).then(setD).catch(() => setErr(true)); }, []);
  const fired: any[] = [];
  KEYS.forEach(k => { const s = (DATA as any).stocks[k]; if (s && s.ok) (s.fire || []).forEach((f: string) => fired.push({ k, s, f, bt: s.bt && s.bt[f] })); });
  const rows: any[] = d ? d.rows.filter((r: any) => r.votes) : [];
  const score = (r: any) => NAMES.reduce((a, n) => a + (r.votes[n] ? 1 : 0), 0);
  const strong = rows.filter(r => score(r) >= 4).sort((a, b) => score(b) - score(a));
  const weak = rows.filter(r => score(r) <= 1).sort((a, b) => score(a) - score(b));
  const missing = d ? d.rows.length - rows.length : 0;
  const Row = ({ r }: { r: any }) => (
    <Link to={to(r.code)} className="sg-r">
      <div className="sg-n"><b>{r.name}</b><small dir="ltr">{r.code}</small><Dots votes={r.votes} /></div>
      <div className="sg-k" dir="ltr">{score(r)}/5</div>
      <div className="sg-q" dir="ltr">{r.price}</div>
      <div className={'sg-g ' + (typeof r.chg === 'number' ? cls(r.chg) : 'gr')} dir="ltr">{typeof r.chg === 'number' ? (r.chg > 0 ? '▲ ' : r.chg < 0 ? '▼ ' : '') + sg(r.chg) : '—'}</div>
    </Link>);
  const Head = () => <div className="sg-hd" aria-hidden="true"><span>السهم</span><span>النقاط</span><span>السعر</span><span>التغير</span></div>;
  return (
    <div className="eg-pad sg">
      <h2 className="eg-h" style={{ marginTop: 56 }}>الإشارات</h2>
      <p className="sg-note">وصف للي حصل لحد الإقفال، مش توصية. الأرقام من نفس بيانات صفحات الأسهم.</p>
      <h3 className="sg-h">إشارات اليوم</h3>
      {fired.length === 0 ? <div className="sg-na">مفيش إشارة اتفعلت النهاردة في الأسهم الستة · {(DATA as any).stocks.HRHO?.date}</div> :
        fired.map(x => (
          <div key={x.k + x.f} className="sg-c">
            <Link to={to(x.k)} className="sg-n"><b>{x.s.name}</b><small dir="ltr">{x.k}</small></Link>
            <div className="sg-t">{RULE_AR[x.f] || x.f}</div>
            {x.bt ? <div className="sg-3" dir="ltr">
              <span><i>العينة</i><b>{x.bt.n}</b></span>
              <span><i>نجحت</i><b className="gr">{x.bt.win}%</b></span>
              <span><i>متوسط النتيجة</i><b className={x.bt.n >= MIN_N ? cls(x.bt.avg) : 'gr'}>{sg(x.bt.avg)}</b></span>
            </div> : <div className="sg-na">نتايج التجارب السابقة غير متوفرة للإشارة دي</div>}
            {x.bt && x.bt.n < MIN_N ? <div className="sg-na">عينة صغيرة (أقل من {MIN_N} إشارة)، النتيجة مش للاعتماد</div> : null}
            <div className="sg-f">إقفال {x.s.date} · {x.s.sourceName}</div>
          </div>))}
      <p className="sg-note">باقي الأسهم (EGX 30 و70 غير الستة): الإشارات المفعّلة غير متوفرة هنا حاليًا، لأن بيانات الإشارة مش متضمنة في القايمة العامة.</p>
      <h3 className="sg-h">أقوى قراءة فنية (4 من 5 مؤشرات إيجابية أو أكتر)</h3>
      {err ? <div className="sg-na">مقدرتش أحمل القايمة</div> : !d ? <div className="sg-na">بحمّل...</div> : strong.length ? <><Head />{strong.map(r => <Row key={r.code} r={r} />)}</> : <div className="sg-na">مفيش</div>}
      <h3 className="sg-h">أضعف قراءة فنية (مؤشر واحد إيجابي أو أقل)</h3>
      {d ? <><Head />{weak.map(r => <Row key={r.code} r={r} />)}</> : null}
      <p className="sg-note">النقط الخمسة: فوق متوسط 200 · فوق متوسط 50 · ماكد · RSI · الحجم. نقطة مضيئة = إيجابي. {missing ? missing + ' أسهم بدون بيانات كافية (مش معروضة).' : ''} {d ? 'القايمة بتاريخ ' + String(d.asof).slice(0, 10) + '، المصدر Starta Markets.' : ''}</p>
    </div>
  );
}
