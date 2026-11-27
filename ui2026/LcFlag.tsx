import React, { useEffect, useState } from 'react';
import { getLc, FLAG } from './HomePanel';

// Status of one stock's last close in the static last-close snapshot. Renders nothing when confirmed or when the file is missing.
export function useLcStatus(code?: string): { text: string; date: string } | null {
  const [lc, setLc] = useState<any>(null);
  useEffect(() => { let on = true; getLc().then(l => on && setLc(l)); return () => { on = false; }; }, []);
  const st = code && lc && lc.stocks && lc.stocks[code.toUpperCase()] && lc.stocks[code.toUpperCase()].status;
  return st && st !== 'confirmed' ? { text: FLAG[st] || 'غير مؤكد', date: String(lc.session_date || '') } : null;
}
// small = inline tag for list rows. Default = one line for the stock page header.
export function LcFlag({ code, small }: { code?: string; small?: boolean }) {
  const f = useLcStatus(code);
  if (!f) return null;
  return small ? <em className="hp-fl"> · {f.text}</em>
    : <p className="lc-fl">{f.text}: إقفال {f.date}. {f.text === 'مصدر واحد' ? 'السعر جاي من مصدر واحد ومش متطابق مع مصدر تاني.' : 'السعر مش متطابق بين المصدرين، فاعتبره تقريبي.'}</p>;
}
