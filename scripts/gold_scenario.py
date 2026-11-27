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
gd, ud = max(gold), max(usd)
today = datetime.date.today()
for nm, d in (('gold', gd), ('dollar', ud)):
    if (today - datetime.date.fromisoformat(d)).days > 10: raise SystemExit('%s data stale: %s' % (nm, d))
days = [x for x in sorted(gold) if x in usd and x >= START]
def scen(sel):
    r = []
    for i in range(N, len(days)):
        if sel(pct(usd[days[i - N]], usd[days[i]])): r.append(pct(gold[days[i - N]], gold[days[i]]))
    if len(r) < 300: raise SystemExit('sample too small')
    return {'n': len(r), 'upOf10': round(sum(1 for v in r if v > 0) / len(r) * 10, 1), 'median': round(statistics.median(r), 1), 'p10': round(q(r, .1), 1), 'p90': round(q(r, .9), 1)}
ulist = sorted(usd)
mv = pct(usd[ulist[-1 - N]], usd[ulist[-1]])
out = {'kind': 'same-window', 'windowDays': N, 'from': days[0], 'goldThrough': gd, 'dollarThrough': ud,
       'computedAt': datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%MZ'),
       'goldSource': 'COMEX GC=F daily closes (Yahoo Finance)', 'dollarSource': 'FRED DTWEXBGS',
       'dollarMove20d': round(mv, 2), 'dollarMoveFrom': ulist[-1 - N],
       'dollarUp': scen(lambda v: 1 <= v <= 4), 'dollarDown': scen(lambda v: v < -1)}
os.makedirs('gold', exist_ok=True)
tmp = 'gold/scenario.json.tmp'; open(tmp, 'w').write(json.dumps(out, ensure_ascii=False, indent=1) + '\n'); os.replace(tmp, 'gold/scenario.json')
print(json.dumps(out, indent=1))
