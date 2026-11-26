import React from 'react';
import { usePage } from './page';

export function TopWarn({ k }: { k: string }) {
  const p = usePage(k);
  const w = p && typeof p.top_warning_ar === 'string' ? p.top_warning_ar.trim() : '';
  if (!w) return null;
  return (
    <section
      dir="rtl"
      role="alert"
      className="eg-topwarn"
      style={{
        boxSizing: 'border-box',
        width: '100%',
        maxWidth: '100%',
        margin: '10px 0 14px',
        padding: '12px 14px',
        borderRadius: 12,
        border: '1px solid #e0a030',
        background: 'rgba(224, 160, 48, 0.2)',
        color: 'inherit',
        textAlign: 'right',
        lineHeight: 1.8,
        fontSize: 14,
        overflowWrap: 'anywhere',
      }}
    >
      {w}
    </section>
  );
}
