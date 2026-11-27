import React from 'react';
import { Sparkline, dirOf } from './Sparkline';
import { xHold } from './Explain';

const fin = (x: any): x is number => typeof x === 'number' && isFinite(x);
const Chip = ({ l, v }: { l: string; v: any }) => fin(v)
  ? <span className={'hm-c ' + (v > 0 ? 'u' : v < 0 ? 'd' : 'f')} dir="ltr"><small>{l}</small><b>{v > 0 ? '▲' : v < 0 ? '▼' : ''} {Math.abs(v).toFixed(1)}%</b></span>
  : <span className="hm-c f"><small>{l}</small><b>غير متوفر</b></span>;

// Presentation only: mini chart and number chips from the closes already loaded for the holding.
export function HoldingMini({ s }: { s: any }) {
  const bars: any[] = Array.isArray(s && s.bars) ? s.bars : [];
  const closes = bars.slice(-30).map(r => r[4]).filter(fin);
  const v = (s && s.votes) || {};
  return <span className="hm" dir="ltr">
    <Sparkline data={closes} w={96} h={30} dir={closes.length > 1 ? dirOf(closes[0], closes[closes.length - 1]) : 'flat'} />
    <Chip l="5ج" v={s && s.chg5} /><Chip l="20ج" v={s && s.chg20} />
    {fin(s && s.rsi) ? <span className="hm-c f"><small>RSI</small><b>{Math.round(s.rsi)}</b></span> : null}
    {s && s.ok ? <span className={'hm-c ' + (v.trend ? 'u' : 'd')}><small>200</small><b>{v.trend ? '▲ فوق' : '▼ تحت'}</b></span> : null}
    {s && s.ok ? <span className="hm-x" dir="rtl">{xHold(!!v.trend)}</span> : null}
  </span>;
}
