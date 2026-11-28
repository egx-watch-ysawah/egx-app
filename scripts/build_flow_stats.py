#!/usr/bin/env python3
"""build_flow_stats.py - one-shot builder for flow_stats.json (EGX accumulation-signal backtest).

Reads cached Starta Markets daily history (chunk_*.json, each {sym: [rows]})
and writes flow_stats.json: pooled stats + perStock entries, same rules as the
approved backtest:
  A: session traded value (close*volume) > 2x median value of previous 60 sessions
  B: close in top third of day range: (close-low)/(high-low) >= 2/3
  C: up-day volume share over last 10 sessions > 60% AND close > SMA20
  dedup: no re-fire within 5 sessions of a kept fire
  forward windows containing a |daily move| > 25% day (suspected unadjusted
  split/corporate action) are excluded from stats. Prices are raw/unadjusted.
"""
import json, glob, os, datetime, sys
import pandas as pd, numpy as np
from zoneinfo import ZoneInfo

if len(sys.argv) < 4:
    print('usage: build_flow_stats.py HIST_DIR OUT EXPECTED_SESSION(YYYY-MM-DD)')
    sys.exit(2)
HIST_DIR, OUT, EXPECTED_SESSION = sys.argv[1], sys.argv[2], sys.argv[3]

H = {}
for fn in sorted(glob.glob(os.path.join(HIST_DIR, 'chunk_*.json'))):
    H.update(json.load(open(fn)))

def load_df(rows):
    df = pd.DataFrame(rows)[['date','open','high','low','close','volume']]
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date').drop_duplicates('date').set_index('date')
    for c in ['open','high','low','close','volume']:
        df[c] = pd.to_numeric(df[c], errors='coerce')
    df = df.dropna()
    return df[(df.volume > 0) & (df.low <= df[['open','close']].min(axis=1))
              & (df[['open','close']].max(axis=1) <= df.high) & (df.close > 0)]

def conds(df):
    v = df.close * df.volume
    med60 = v.shift(1).rolling(60).median()
    A = v > 2 * med60
    B = ((df.close - df.low) / (df.high - df.low).replace(0, np.nan)) >= (2/3 - 1e-9)
    up = df.close > df.close.shift(1)
    us = (df.volume * up).rolling(10).sum() / df.volume.rolling(10).sum()
    C = (us > 0.6) & (df.close > df.close.rolling(20).mean())
    return A, B, C, us, med60

def signals(df):
    A, B, C, _, _ = conds(df)
    fire = (A & B & C).fillna(False)
    kept, last = [], -10
    for i in np.flatnonzero(fire.values):
        if i - last > 5:
            kept.append(i); last = i
    return kept, int(fire.sum())

now = datetime.datetime.now(ZoneInfo('Africa/Cairo'))
pooled = {5: {'s': [], 'b': []}, 10: {'s': [], 'b': []}, 20: {'s': [], 'b': []}}
per_stock = {}
last_sessions = []

def raw_flagged_suspended(rows, last_date):
    # Exemption evidence must come from the raw feed itself: an explicit suspended
    # marker on a row dated on/after the stock's last session. Starta rows today
    # carry no such field, so this path stays dormant unless the feed adds one.
    for r in rows:
        if str(r.get('date', '')) >= last_date and (r.get('suspended') or str(r.get('status', '')).lower() == 'suspended'):
            return True
    return False

EXCLUDE = {'VLMR'}  # removed from the app's flow stats (builder's VLMR removal package)
for sym in sorted(H):
    if sym in EXCLUDE:
        continue
    df = load_df(H[sym])
    if len(df) < 260:
        continue
    c = df.close.values; n = len(df)
    last_sessions.append(str(df.index[-1].date()))
    kept, raw_days = signals(df)
    chg = np.abs(np.diff(c) / c[:-1])
    glitch = np.zeros(n, bool); glitch[1:] = chg > 0.25
    A, B, C, us, med60 = conds(df)
    e = {'history': {'from': str(df.index[0].date()), 'to': str(df.index[-1].date()), 'sessions': int(n)},
         'signals': {'total': len(kept), 'rawDaysAllTrue': raw_days},
         'firesOnLastSession': bool(A.iloc[-1] and B.iloc[-1] and C.iloc[-1]),
         'lastSessionComponents': {'A_valueGt2xMed60': bool(A.iloc[-1]), 'B_closeTopThird': bool(B.iloc[-1]),
            'C_upVolShareAndGtSma20': bool(C.iloc[-1]),
            'volXmed60': round(float((df.close * df.volume).iloc[-1] / med60.iloc[-1]), 2) if pd.notna(med60.iloc[-1]) else None,
            'upShare10': round(float(us.iloc[-1]), 2) if pd.notna(us.iloc[-1]) else None}}
    rets20 = {}
    for k in (5, 10, 20):
        f = np.full(n, np.nan); f[:-k] = c[k:] / c[:-k] - 1
        winok = np.zeros(n, bool)
        for i in range(n - k):
            winok[i] = not glitch[i+1:i+k+1].any()
        valid = ~np.isnan(f)
        b = f[valid & winok]
        s = np.array([f[i] for i in kept if valid[i] and winok[i]])
        pooled[k]['s'].extend(s.tolist()); pooled[k]['b'].extend(b.tolist())
        e[f'h{k}'] = {'n': int(len(s)),
            'win': round(100 * (s > 0).mean(), 1) if len(s) else None,
            'mean': round(100 * np.mean(s), 2) if len(s) else None,
            'median': round(100 * np.median(s), 2) if len(s) else None,
            'baseWin': round(100 * (b > 0).mean(), 1), 'baseMean': round(100 * np.mean(b), 2)}
        if k == 20:
            rets20 = {i: f[i] for i in kept if valid[i] and winok[i]}
    e['signals']['open'] = [str(df.index[i].date()) for i in kept if i not in rets20]
    worst = sorted(rets20.items(), key=lambda kv: kv[1])[:3]
    e['worst'] = [{'date': str(df.index[i].date()), 'ret20': round(100 * float(r), 1)} for i, r in worst]
    rec = sorted(rets20.items())[-10:]
    e['recentClosed20'] = [{'date': str(df.index[i].date()), 'ret20': round(100 * float(r), 1)} for i, r in rec]
    if rec:
        arr = np.array([r for _, r in rec])
        e['recentClosedSummary'] = {'n': int(len(arr)), 'wins': int((arr > 0).sum()), 'losses': int((arr <= 0).sum())}
    e['fireDates'] = [str(df.index[i].date()) for i in kept]
    e['signals']['firstSignal'] = e['fireDates'][0] if e['fireDates'] else None
    per_stock[sym] = e

# QA gate: every pooled stock must end on the EXPECTED session (the one flow_signal
# reports), so a wholly stale feed fails instead of silently shifting the window.
# Sole exemption: the stock's raw feed rows explicitly flag it suspended; exempted
# stocks are listed in the output under suspendedExempt. Anything else fails.
last_seen = {s: e['history']['to'] for s, e in per_stock.items()}
offenders = {s: d for s, d in last_seen.items() if d != EXPECTED_SESSION}
suspended_exempt = sorted(s for s in offenders if raw_flagged_suspended(H[s], last_seen[s]))
hard_fails = {s: d for s, d in offenders.items() if s not in suspended_exempt}
if hard_fails:
    print('FAIL: stocks not on expected session %s and not flagged suspended in raw data: %s' % (EXPECTED_SESSION, hard_fails))
    sys.exit(1)
if suspended_exempt:
    print('note: exempted as raw-flagged suspended:', suspended_exempt)

pooled_out = {}
for k in (5, 10, 20):
    s = np.array(pooled[k]['s']); b = np.array(pooled[k]['b'])
    d = {'n': int(len(s)),
         'win': round(100 * (s > 0).mean(), 1), 'mean': round(100 * s.mean(), 2), 'median': round(100 * np.median(s), 2),
         'baseN': int(len(b)), 'baseWin': round(100 * (b > 0).mean(), 1), 'baseMean': round(100 * b.mean(), 2)}
    if k == 20:
        d['p10'] = round(100 * np.percentile(s, 10), 2)
        d['p25'] = round(100 * np.percentile(s, 25), 2)
        d['shareLosingGt10'] = round(100 * (s < -0.10).mean(), 1)
        d['shareLosingGt20'] = round(100 * (s < -0.20).mean(), 1)
    pooled_out[f'h{k}'] = d

doc = {
  'asof': now.date().isoformat(),
  'generated_at': now.isoformat(timespec='seconds'),
  'source': 'startamarkets.com/api/v1/egx/history/<SYM> daily OHLCV (raw, unadjusted)',
  'lastSession': EXPECTED_SESSION,
  'stocksWithSignals': sum(1 for e in per_stock.values() if e['signals']['total'] > 0),
  'stocksCovered': len(per_stock),
  'suspendedExempt': suspended_exempt,
  'rule': {
    'A': 'traded value > 2x median of previous 60 sessions',
    'B': 'close in top third of day range',
    'C': '10-session up-day volume share > 60% and close > SMA20',
    'dedup': 'no re-fire within 5 sessions of a kept fire',
    'glitchFilter': 'forward windows containing a |daily move| > 25% day excluded',
    'glitchFilterAr': 'أي إشارة بييجي في فترة حساب العائد بتاعتها يوم السعر فيه اتحرك أكتر من 25% بنستبعدها من الإحصائيات خالص، لأن الحركة دي غالبًا انقسام أو إجراء شركات مش متظبط في البيانات',
    'ruleAr': ['قيمة التداول النهارده أكتر من ضعف متوسط آخر 60 جلسة',
               'الإقفال في الثلث الأعلى من مدى اليوم',
               'أكتر من 60% من حجم آخر 10 جلسات في أيام صاعدة والسعر فوق متوسط 20 جلسة']},
  'limits': ['أسعار خام غير معدلة بالانقسامات أو التوزيعات', 'بدون تكاليف تداول',
             'الإشارات بتتجمع في موجات فمش مستقلة إحصائيًا', 'انحياز نجاة: الأسهم الحالية بس',
             'وصف تاريخي مش وعد'],
  'pooled': pooled_out,
  'perStock': per_stock}

def clean(o):
    if isinstance(o, dict): return {k: clean(v) for k, v in o.items()}
    if isinstance(o, list): return [clean(x) for x in o]
    if isinstance(o, (np.integer,)): return int(o)
    if isinstance(o, (np.floating,)): return float(o)
    if isinstance(o, (np.bool_,)): return bool(o)
    return o

tmp = OUT + '.tmp'
json.dump(clean(doc), open(tmp, 'w'), ensure_ascii=False, indent=1)
os.replace(tmp, OUT)  # atomic: readers never see a partial flow_stats.json
print('wrote', OUT, '| stocks:', len(per_stock), '| h20 pooled:', pooled_out['h20'])
