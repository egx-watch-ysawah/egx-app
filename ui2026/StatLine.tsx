import React from 'react';
import { Sparkline, COLOR, dirOf } from './Sparkline';
// Number + small chart + one line. Row ~88px at 390px width. RTL: name right, price left.
export function StatLine({ name, sub, value, pct, spark, prevClose, line, asOf, source, onClick }: {
  name: string; sub?: string; value: number | null; pct: number | null; spark?: (number | null)[]; prevClose?: number | null;
  line?: string; asOf?: string; source?: string; onClick?: () => void;
}) {
  const d = pct == null ? 'flat' : pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat';
  const na = <span className="sl-na">غير متوفر</span>;
  return (
    <div className="sl" role={onClick ? 'button' : undefined} onClick={onClick}>
      <div className="sl-r1">
        <div className="sl-name"><b>{name}</b>{sub && <small>{sub}</small>}</div>
        <Sparkline data={spark || []} prevClose={prevClose} dir={spark ? dirOf(spark[0], spark[spark.length - 1]) : 'flat'} />
        <div className="sl-num">
          {value == null ? na : <b dir="ltr">{value.toLocaleString('en-US', { maximumFractionDigits: 2 })}</b>}
          {pct == null ? na : <span className="sl-chip" dir="ltr" style={{ color: COLOR[d as 'up'], background: COLOR[d as 'up'] + '22' }}>{pct > 0 ? '+' : ''}{pct.toFixed(2)}%</span>}
        </div>
      </div>
      {line && <div className="sl-line">{line}</div>}
      {(asOf || source) && <div className="sl-src">{[asOf, source].filter(Boolean).join(' · ')}</div>}
    </div>
  );
}
