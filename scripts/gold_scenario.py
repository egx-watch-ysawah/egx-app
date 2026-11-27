#!/usr/bin/env python3
"""Computes gold/scenario.json: what gold did in the SAME 20-trading-day windows in which the dollar moved.
Gold = COMEX futures GC=F daily closes (Yahoo). Dollar = FRED DTWEXBGS (broad trade-weighted index).
Fail-safe: any fetch/sanity failure exits non-zero WITHOUT touching the existing file."""
import csv, datetime, io, json, statistics, sys, time, urllib.request, os
N = 20; START = '2006-03-01'
def get(url, ua='Mozilla/5.0', tries=3):
    for i in range(tries):
        try:
            rq = urllib.request.Request(url, headers={'User-Agent': ua})
            return urllib.request.urlopen(rq, timeout=20).read().decode()
        except Exception as e:
            err = e; time.sleep(3 * (i + 1))
    raise SystemExit('fetch failed: %s %s' % (url, err))
def pct(a, b): return (b / a - 1) * 100
def q(x, p): x = sorted(x); return x[int(round((len(x) - 1) * p))]
now = int(time.time())
y = json.loads(get('https://query1.finance.yahoo.com/v8/finance/chart/GC=F?period1=1141200000&period2=%d&interval=1d' % (now + 86400)))['chart']['result'][0]
gold = {}
for t, c in zip(y['timestamp'], y['indicators']['quote'][0]['close']):
    if c: gold[datetime.datetime.utcfromtimestamp(t).date().isoformat()] = float(c)
rows = list(csv.reader(io.StringIO(get('https://fred.stlouisfed.org/graph/fredgraph.csv?id=DTWEXBGS', ua='curl/8.5.0'))))
usd = {r[0]: float(r[1]) for r in rows[1:] if len(r) > 1 and r[1] not in ('', '.')}
if len(gold) < 4000 or len(usd) < 4000: raise SystemExit('too few rows')
import math
gd = max(gold)
today = datetime.date.today()
if (today - datetime.date.fromisoformat(gd)).days > 10: raise SystemExit('gold data stale: ' + gd)
# ---- price-range model (EWMA volatility, lognormal 80% interval); the page applies it to the LIVE price ----
gdays = sorted(gold); P = [gold[x] for x in gdays]
R = [math.log(P[i] / P[i - 1]) for i in range(1, len(P))]
V = []; v = R[0] ** 2
for r in R:
    v = 0.94 * v + 0.06 * r * r; V.append(v)
Z = 1.2816
def cover(H, since='2012-01-01'):
    inn = tot = 0
    for i in range(len(R) - H):
        if gdays[i + 1] < since: continue
        sg = math.sqrt(V[i]) * math.sqrt(H); p0 = P[i + 1]; p1 = P[i + 1 + H]
        tot += 1; inn += (p0 * math.exp(-Z * sg) <= p1 <= p0 * math.exp(Z * sg))
    return round(inn / tot * 100, 1), tot
c20, n20 = cover(20); c60, n60 = cover(60)
sig = math.sqrt(V[-1])
rng = {'sigmaDaily': round(sig * 100, 3), 'sigmaAnnual': round(sig * math.sqrt(252) * 100, 1), 'goldThrough': gd, 'lastClose': round(P[-1], 2),
       'inside20': c20, 'inside60': c60, 'n20': n20, 'n60': n60, 'calibFrom': '2012-01-01', 'z': Z, 'lambda': 0.94, 'source': 'COMEX GC=F daily closes (Yahoo Finance)'}
# ---- dollar scenario (non-fatal: on failure keep the previous file's dollar part, its dates then age out on the page) ----
dol = None
try:
    rows = list(csv.reader(io.StringIO(get('https://fred.stlouisfed.org/graph/fredgraph.csv?id=DTWEXBGS', ua='curl/8.5.0'))))
    usd = {r[0]: float(r[1]) for r in rows[1:] if len(r) > 1 and r[1] not in ('', '.')}
    if len(usd) < 4000: raise SystemExit('too few dollar rows')
    ud = max(usd)
    if (today - datetime.date.fromisoformat(ud)).days > 10: raise SystemExit('dollar data stale: ' + ud)
    days = [x for x in sorted(gold) if x in usd and x >= START]
    def scen(sel):
        r = []
        for i in range(N, len(days)):
            if sel(pct(usd[days[i - N]], usd[days[i]])): r.append(pct(gold[days[i - N]], gold[days[i]]))
        if len(r) < 300: raise SystemExit('sample too small')
        return {'n': len(r), 'upOf10': round(sum(1 for v in r if v > 0) / len(r) * 10, 1), 'median': round(statistics.median(r), 1), 'p10': round(q(r, .1), 1), 'p90': round(q(r, .9), 1)}
    ulist = sorted(usd)
    mv = pct(usd[ulist[-1 - N]], usd[ulist[-1]])
    dol = {'kind': 'same-window', 'windowDays': N, 'from': days[0], 'goldThrough': gd, 'dollarThrough': ud,
           'goldSource': 'COMEX GC=F daily closes (Yahoo Finance)', 'dollarSource': 'FRED DTWEXBGS',
           'dollarMove20d': round(mv, 2), 'dollarMoveFrom': ulist[-1 - N], 'dollarUp': scen(lambda v: 1 <= v <= 4), 'dollarDown': scen(lambda v: v < -1)}
except BaseException as e:
    print('dollar part failed, keeping previous:', e)
    try: dol = {k: v for k, v in json.load(open('gold/scenario.json')).items() if k not in ('range', 'computedAt')}
    except Exception: dol = {}
out = dict(dol); out['computedAt'] = datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%MZ'); out['range'] = rng
os.makedirs('gold', exist_ok=True)
tmp = 'gold/scenario.json.tmp'; open(tmp, 'w').write(json.dumps(out, ensure_ascii=False, indent=1) + '\n'); os.replace(tmp, 'gold/scenario.json')
print(json.dumps(out, indent=1))
