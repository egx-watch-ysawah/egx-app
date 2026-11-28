#!/usr/bin/env python3
"""fetch_flow_hist.py - cache Starta daily history for the flow jobs.

Writes HIST_DIR/chunk_0.json as {sym: [OHLCV rows]} - the format both
flow_signal.py (FLOW_HIST_DIR offline mode) and build_flow_stats.py read.
The symbol list is the SYMS literal in scripts/flow_signal.py (single source).
Atomic write via temp file + rename; exits 1 (old cache kept) if symbols are
still missing after retries.

Rate-limit handling (Starta returns HTTP 429 under burst load):
- 0.75s pacing between symbols,
- per-symbol backoff of 2s / 8s / 20s (4 attempts),
- if more than 3 symbols still fail, one whole-run retry of the failed
  symbols after a 180s cool-down.

Usage: python3 scripts/fetch_flow_hist.py [hist_dir]   (default flow_hist)
"""
import ast, json, os, sys, time, urllib.request

ENDPOINT = 'https://startamarkets.com/api/v1/egx/history/'
PACE_S = 0.75          # delay between symbols
BACKOFF_S = (2, 8, 20) # sleep before each retry; attempts = 1 + len(BACKOFF_S)
RUN_RETRY_AFTER_S = 180
RUN_RETRY_MIN_FAILS = 3  # whole-run retry only if more than this many symbols failed

def syms():
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'flow_signal.py')
    for node in ast.parse(open(path).read()).body:
        if isinstance(node, ast.Assign) and getattr(node.targets[0], 'id', '') == 'SYMS':
            return [e.value for e in node.value.elts]
    raise SystemExit('SYMS not found in flow_signal.py')

def fetch(sym):
    last = None
    for attempt in range(1 + len(BACKOFF_S)):
        if attempt:
            time.sleep(BACKOFF_S[attempt - 1])
        try:
            req = urllib.request.Request(ENDPOINT + sym, headers={'User-Agent': 'Mozilla/5.0'})
            raw = json.loads(urllib.request.urlopen(req, timeout=25).read())
            if not isinstance(raw, list) or len(raw) < 250:
                raise ValueError('insufficient history: %s' % len(raw))
            return raw
        except Exception as e:
            last = e
    raise last

def pass_symbols(todo, H):
    failed = []
    for s in todo:
        try:
            H[s] = fetch(s)
        except Exception as e:
            print('FAIL %s: %s' % (s, e))
            failed.append(s)
        time.sleep(PACE_S)
    return failed

out_dir = sys.argv[1] if len(sys.argv) > 1 else 'flow_hist'
os.makedirs(out_dir, exist_ok=True)
H = {}
failed = pass_symbols(syms(), H)
if len(failed) > RUN_RETRY_MIN_FAILS:
    print('%d symbols failed; cooling down %ds before one whole-run retry' % (len(failed), RUN_RETRY_AFTER_S))
    time.sleep(RUN_RETRY_AFTER_S)
    failed = pass_symbols(failed, H)
if failed:
    print('FAIL: history fetch errors: %s' % failed)
    sys.exit(1)
tmp = os.path.join(out_dir, 'chunk_0.json.tmp')
with open(tmp, 'w') as fh:
    json.dump(H, fh)
os.replace(tmp, os.path.join(out_dir, 'chunk_0.json'))
print('cached %d symbols to %s/chunk_0.json' % (len(H), out_dir))
