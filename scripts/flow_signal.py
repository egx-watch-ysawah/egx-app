#!/usr/bin/env python3
"""Daily 'institutional accumulation' signal, computed OFFLINE from daily bars already in the repo
(idx/*.json for the index stocks, data.json for the six). No network. Writes flow_signal.json.
Signal = all three in the same session: (1) traded value > 2x the median daily traded value of the previous 60 sessions,
(2) close in the top third of the session range, (3) over the last 10 sessions more than 60% of volume was on up days AND close > 20-session average.
Fail-safe: bad/short data for a stock => that stock is omitted (page shows 'غير متوفر'); nothing is guessed."""
import json, glob, os, statistics, datetime
def load():
    out = {}
    for f in glob.glob('idx/*.json'):
        c = os.path.basename(f)[:-5]
        if c == 'index': continue
        try: j = json.load(open(f))
        except Exception: continue
        if isinstance(j, dict) and j.get('bars'): out[c] = j['bars']
    try:
        for c, j in json.load(open('data.json'))['stocks'].items():
            if j.get('bars'): out[c] = j['bars']
    except Exception: pass
    return out
def check(bars):
    rows = [b for b in bars if len(b) >= 6 and all(isinstance(x, (int, float)) for x in b[1:6]) and b[3] > 0 and b[3] <= min(b[1], b[4]) <= max(b[1], b[4]) <= b[2] and b[5] >= 0]
    return sorted(rows, key=lambda r: r[0]) if len(rows) >= 80 else None
def evalbar(r, i):
    """conditions at index i (needs i>=60)"""
    d, o, h, l, c, v = r[i]
    val = c * v
    med = statistics.median(r[k][4] * r[k][5] for k in range(i - 60, i))
    x = val / med if med > 0 else 0
    pos = (c - l) / (h - l) if h > l else 0
    up = tot = 0.0
    for k in range(i - 9, i + 1):
        tot += r[k][5]
        if r[k][4] > r[k - 1][4]: up += r[k][5]
    share = up / tot if tot > 0 else 0
    sma = sum(r[k][4] for k in range(i - 19, i + 1)) / 20
    return {'value': {'x': round(x, 1), 'ok': x > 2}, 'close': {'pos': round(pos, 2), 'ok': pos >= 2 / 3},
            'flow': {'share': round(share * 100), 'aboveAvg': c > sma, 'ok': share > 0.6 and c > sma}}
def fired(cd): return all(cd[k]['ok'] for k in cd)
def main():
    res = {}; last = ''
    for c, bars in sorted(load().items()):
        r = check(bars)
        if not r or len(r) < 70: continue
        i = len(r) - 1; cd = evalbar(r, i)
        # a signal counts only if the last COUNTED signal is more than 5 sessions earlier (chain from the start of the bars we have)
        lastc = -99; f = False
        for k in range(60, i + 1):
            if fired(evalbar(r, k)) and k - lastc > 5:
                lastc = k; f = (k == i)
        res[c] = {'date': r[i][0], 'fired': f, 'conditions': cd}
        last = max(last, r[i][0])
    if len(res) < 30: raise SystemExit('too few stocks computed, keeping the old file')
    out = {'asof': last, 'computedAt': datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%MZ'), 'source': 'Starta Markets (free delayed daily bars, via the repo data files)', 'stocks': res}
    tmp = 'flow_signal.json.tmp'; open(tmp, 'w').write(json.dumps(out, ensure_ascii=False, separators=(',', ':')) + '\n'); os.replace(tmp, 'flow_signal.json')
    print(len(res), 'stocks, asof', last, 'fired:', [k for k, v in res.items() if v['fired']])
    print('HRHO', res.get('HRHO'))
main()
