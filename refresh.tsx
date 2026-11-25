import React, { useState } from 'react';
import { useStarta, loadStarta, getFeed, sourceState, disagree } from './feed';
import { stampNote } from './scen';
const hm = (iso?: string) => { try { return new Date(iso as string).toLocaleTimeString('en-GB', { timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit' }); } catch { return ''; } };
// Manual refresh: reloads the price feed on demand and says honestly what came back.
export function RefreshBar() {
  const f = useStarta();
  const [st, setSt] = useState<'idle' | 'load' | 'new' | 'same' | 'fail'>('idle');
  const [when, setWhen] = useState('');
  const go = async () => {
    if (st === 'load') return;
    setSt('load');
    const before = getFeed();
    const sig = (x: any) => x ? x.at + '|' + Object.keys(x.rows).map(k => k + x.rows[k].price).join(',') : '';
    const b = sig(before);
    const after = await loadStarta(true);
    window.dispatchEvent(new Event('egx-refresh'));
    await new Promise(r => setTimeout(r, 700));
    setWhen(new Date().toLocaleTimeString('en-GB', { timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit' }));
    setSt(!after ? 'fail' : sig(after) !== b ? 'new' : 'same');
  };
  const snap = f ? hm(f.at) : '';
  const msg = st === 'load' ? 'بيحدّث الأسعار...'
    : st === 'fail' ? 'مقدرتش أوصل للمصدر دلوقتي. لسه معروض آخر بيانات اتحمّلت.'
    : st === 'new' ? 'اتحدّث الساعة ' + when + '. آخر لقطة من المصدر ' + snap + '.'
    : st === 'same' ? 'مفيش جديد من المصدر الساعة ' + when + '. آخر لقطة ' + snap + '.'
    : f ? 'آخر لقطة أسعار ' + snap + ' · ' + stampNote(f.at) : 'لسه ما اتحملتش لقطة أسعار.';
  const srcLine = sourceState.starta === 'ok' ? (sourceState.tv === 'down' ? 'المصدر: Starta (المصدر الاحتياطي مش متاح دلوقتي)' : 'المصدر: Starta' + (sourceState.tv === 'ok' ? '، والاحتياطي TradingView للمقارنة' : '')) : sourceState.tv === 'ok' ? 'Starta مش متاح، الأسعار من المصدر الاحتياطي TradingView (متأخر حوالي 15 دقيقة)' : sourceState.starta === 'down' ? 'المصدرين مش متاحين دلوقتي' : '';
  const dis = disagree.length ? ' المصدرين مختلفين في ' + disagree.length + ' سهم بأكتر من 1.5% (ممكن يكون فرق توقيت)، والمعروض الأحدث.' : '';
  return <div className="rf-bar">
    <button type="button" className={'rf-btn' + (st === 'load' ? ' spin' : '')} onClick={go} disabled={st === 'load'} aria-label="تحديث الأسعار">
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.6-5.9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M20 4v5h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      <span>تحديث</span>
    </button>
    <small className="rf-msg" role="status" aria-live="polite">{msg}{srcLine ? <><br />{srcLine}.</> : null}{dis}</small>
  </div>;
}
