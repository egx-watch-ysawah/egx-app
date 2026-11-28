#!/usr/bin/env python3
"""flow_signal.py - daily recompute of the EGX accumulation flow signal.

Run after 15:00 Africa/Cairo (closing auction finished; mkdata.py uses the same
cutoff). For every covered symbol it fetches the Starta Markets daily history
(the same endpoint the app itself uses), evaluates the 3-condition accumulation
signature on the last COMPLETED session, and writes flow_signal.json.

Rules (identical to the flow_stats.json backtest):
  A: traded value (close*volume) > 2x median value of the previous 60 sessions
  B: close in top third of the day range: (close-low)/(high-low) >= 2/3
  C: up-day volume share over the last 10 sessions > 60% AND close > SMA20
  dedup: a fire is kept only if no kept fire in the previous 5 sessions.
  `fired` is the deduped state; `rawFired` is A&B&C on the last session.
Prices are raw/unadjusted; days with |move| > 25% are NOT adjusted, only flagged
in the backtest. This job changes no prices.

Offline/test mode: set FLOW_HIST_DIR to a directory of cached chunk_*.json
files ({sym: [rows]}) and no network calls are made.

Usage: python3 flow_signal.py [output_path]   (default flow_signal.json)
"""
import json, os, glob, sys, time, datetime, urllib.request
import pandas as pd
import numpy as np
from zoneinfo import ZoneInfo

CAIRO = ZoneInfo('Africa/Cairo')
ENDPOINT = 'https://startamarkets.com/api/v1/egx/history/'
SYMS = ["ABUK","ADIB","AIFI","AIH","ALCN","AMER","AMIA","AMOC","ARCC","ASCM","ASPI","ATLC",
        "ATQA","BONY","BTFH","CCAP","CIEB","CLHO","CNFN","COMI","COSG","CSAG","DAPH","DSCW",
        "EAST","EFID","EFIH","EGAL","EGCH","EGTS","EHDR","ELEC","ELKA","ELSH","EMFD","ENGC",
        "ETEL","ETRS","EXPA","FWRY","GBCO","GDWA","GPIM","HDBK","HELI","HRHO","ICFC","IDRE",
        "IEEC","ISMA","ISMQ","ISPH","JUFO","KABO","LCSW","MASR","MBSC","MCQE","MCRO","MEPA",
        "MFPC","MOED","MPCI","MPCO","MPRC","MTIE","NCCW","OBRI","OCDI","OFH","OIH","ORAS",
        "ORHD","ORWE","PHAR","PHDC","POUL","PRCL","PRDC","RAYA","RMDA","SCEM","SDTI","SIPC",
        "SKPC","SVCE","SWDY","TAQA","TMGH","UEGC","UNIP","VALU","VLMRA","ZEOT","ZMID"]
OUT = sys.argv[1] if len(sys.argv) > 1 else 'flow_signal.json'

def completed_date(day, now=None):
    # Same rule as mkdata.py: a session counts once fully past 15:00 Cairo.
    now = now or datetime.datetime.now(CAIRO)
    now = now.astimezone(CAIRO)
    return day < now.date().isoformat() or (day == now.date().isoformat() and now.time() >= datetime.time(15, 0))

def fetch(sym, tries=3):
    for a in range(tries):
        try:
            req = urllib.request.Request(ENDPOINT + sym, headers={'User-Agent': 'Mozilla/5.0'})
            raw = json.loads(urllib.request.urlopen(req, timeout=25).read())
            if not isinstance(raw, list) or len(raw) < 250:
                raise ValueError('insufficient history: %s' % len(raw))
            return raw
        except Exception:
            if a == tries - 1:
                raise
            time.sleep(1.5)

def load_df(rows):
    df = pd.DataFrame(rows)[['date','open','high','low','close','volume']]
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date').drop_duplicates('date').set_index('date')
    for c in ['open','high','low','close','volume']:
        df[c] = pd.to_numeric(df[c], errors='coerce')
    df = df.dropna()
    df = df[(df.volume > 0) & (df.low <= df[['open','close']].min(axis=1))
            & (df[['open','close']].max(axis=1) <= df.high) & (df.close > 0)]
    # Keep completed sessions only (drops a still-running today).
    df = df[[completed_date(str(d.date())) for d in df.index]]
    return df

def conds(df):
    v = df.close * df.volume
    med60 = v.shift(1).rolling(60).median()
    A = v > 2 * med60
    B = ((df.close - df.low) / (df.high - df.low).replace(0, np.nan)) >= (2/3 - 1e-9)
    up = df.close > df.close.shift(1)
    us = (df.volume * up).rolling(10).sum() / df.volume.rolling(10).sum()
    C = (us > 0.6) & (df.close > df.close.rolling(20).mean())
    return A, B, C, us, med60

def kept_signals(df):
    A, B, C, _, _ = conds(df)
    fire = (A & B & C).fillna(False)
    kept, last = [], -10
    for i in np.flatnonzero(fire.values):
        if i - last > 5:
            kept.append(i); last = i
    return kept

cached = {}
hist_dir = os.environ.get('FLOW_HIST_DIR')
if hist_dir:
    for fn in sorted(glob.glob(os.path.join(hist_dir, 'chunk_*.json'))):
        cached.update(json.load(open(fn)))

now = datetime.datetime.now(CAIRO)
doc = {'asof': now.date().isoformat(), 'generated_at': now.isoformat(timespec='seconds'),
       'source': 'startamarkets.com/api/v1/egx/history/<SYM> daily OHLCV (raw, unadjusted)',
       'session': None,
       'rule': {'A': 'traded value > 2x median of previous 60 sessions',
                'B': 'close in top third of day range',
                'C': '10-session up-day volume share > 60% and close > SMA20',
                'dedup': 'no re-fire within 5 sessions of a kept fire',
                'ruleAr': ['قيمة التداول النهارده أكتر من مرتين متوسط آخر 60 جلسة',
                           'الإقفال في الثلث الأعلى من مدى اليوم',
                           'أكتر من 60% من حجم آخر 10 جلسات في أيام صاعدة والسعر فوق متوسط 20 جلسة']},
       'stocks': {}, 'errors': {}}

for sym in SYMS:
    try:
        rows = cached[sym] if hist_dir else fetch(sym)
        df = load_df(rows)
        if len(df) < 80:
            raise ValueError('only %d usable sessions' % len(df))
        A, B, C, us, med60 = conds(df)
        kept = kept_signals(df)
        n = len(df)
        fired = bool(kept and kept[-1] == n - 1)
        val = df.close * df.volume
        doc['stocks'][sym] = {
            'fired': fired,
            'rawFired': bool(A.iloc[-1] and B.iloc[-1] and C.iloc[-1]),
            'A_valueGt2xMed60': bool(A.iloc[-1]),
            'B_closeTopThird': bool(B.iloc[-1]),
            'C_upVolShareAndGtSma20': bool(C.iloc[-1]),
            'volXmed60': round(float(val.iloc[-1] / med60.iloc[-1]), 2) if pd.notna(med60.iloc[-1]) else None,
            'upShare10': round(float(us.iloc[-1]), 2) if pd.notna(us.iloc[-1]) else None,
            'close': round(float(df.close.iloc[-1]), 4),
            'lastFire': str(df.index[kept[-1]].date()) if kept else None,
            'sessionsSinceLastFire': int(n - 1 - kept[-1]) if kept else None,
            'date': str(df.index[-1].date())}
        sess = doc['stocks'][sym]['date']
        doc['session'] = max(doc['session'], sess) if doc['session'] else sess
    except Exception as e:
        doc['errors'][sym] = str(e)
    if not hist_dir:
        time.sleep(0.3)  # be gentle with the free endpoint

def clean(o):
    if isinstance(o, dict): return {k: clean(v) for k, v in o.items()}
    if isinstance(o, list): return [clean(x) for x in o]
    if isinstance(o, (np.integer,)): return int(o)
    if isinstance(o, (np.floating,)): return float(o)
    if isinstance(o, (np.bool_,)): return bool(o)
    return o

doc['asof'] = doc['session']  # asof is the DATA session date, not the run date
if doc['errors']:
    # Fail loudly BEFORE touching the output: the previous flow_signal.json stays intact.
    print('FAILED symbols:', sorted(doc['errors']))
    sys.exit(1)
tmp = OUT + '.tmp'
json.dump(clean(doc), open(tmp, 'w'), ensure_ascii=False, indent=1)
os.replace(tmp, OUT)  # atomic: no partial flow_signal.json is ever visible
firing = [s for s, v in doc['stocks'].items() if v['fired']]
print('session:', doc['session'], '| stocks:', len(doc['stocks']), '| errors: 0 | firing:', firing)
