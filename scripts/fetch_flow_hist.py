#!/usr/bin/env python3
"""fetch_flow_hist.py - cache Starta daily history for the flow jobs.

Writes HIST_DIR/chunk_0.json as {sym: [OHLCV rows]} - the format both
flow_signal.py (FLOW_HIST_DIR offline mode) and build_flow_stats.py read.
The symbol list is the SYMS literal in scripts/flow_signal.py (single source).

Incremental and resumable (Starta hard-throttles runner IPs with HTTP 429
for hours at a time, and a from-scratch 96-symbol backfill no longer fits in
one job): the cache is loaded at start, saved atomically after EVERY
successful symbol, and a sidecar chunk_0.meta records the Cairo date
each symbol was last fetched. Symbols already fetched today are skipped, so
repeated runs accumulate progress instead of restarting from zero. A partial
cache is a valid output: the workflow commits it so the next run resumes.
Exits 1 when symbols are still missing after retries (the flow-signal step
does not run then, so a partial cache can never produce a thin flow_signal).

Rate-limit handling (Starta returns HTTP 429 under burst load):
- 0.75s pacing between symbols,
- per-symbol backoff of 2s / 8s / 20s (4 attempts),
- if more than 3 symbols still fail, one whole-run retry of the failed
  symbols after a 180s cool-down.

Usage: python3 scripts/fetch_flow_hist.py [hist_dir]   (default flow_hist)
"""
import ast, json, os, sys, time, urllib.request
from datetime import datetime
from zoneinfo import ZoneInfo

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

def save(out_dir, H, meta):
    tmp = os.path.join(out_dir, 'chunk_0.json.tmp')
    with open(tmp, 'w') as fh:
        json.dump(H, fh)
    os.replace(tmp, os.path.join(out_dir, 'chunk_0.json'))
    mtmp = os.path.join(out_dir, 'chunk_0.meta.tmp')
    with open(mtmp, 'w') as fh:
        json.dump(meta, fh)
    os.replace(mtmp, os.path.join(out_dir, 'chunk_0.meta'))

def pass_symbols(todo, H, meta, today, out_dir):
    failed = []
    for s in todo:
        try:
            H[s] = fetch(s)
            meta[s] = today
            save(out_dir, H, meta)  # bank progress after every symbol
            print('cached %s (%d/%d cached)' % (s, len(H), len(H) + len(todo)), flush=True)
        except Exception as e:
            print('FAIL %s: %s' % (s, e), flush=True)
            failed.append(s)
        time.sleep(PACE_S)
    return failed

out_dir = sys.argv[1] if len(sys.argv) > 1 else 'flow_hist'
os.makedirs(out_dir, exist_ok=True)
today = datetime.now(ZoneInfo('Africa/Cairo')).date().isoformat()

H, meta = {}, {}
try:
    H = json.load(open(os.path.join(out_dir, 'chunk_0.json')))
    meta = json.load(open(os.path.join(out_dir, 'chunk_0.meta')))
    print('resuming: %d symbols already cached' % len(H), flush=True)
except Exception:
    print('no existing cache, full fetch', flush=True)

todo = [s for s in syms() if not (s in H and meta.get(s) == today)]
print('%d symbols to fetch, %d skipped (fresh today)' % (len(todo), len(syms()) - len(todo)), flush=True)

failed = pass_symbols(todo, H, meta, today, out_dir)
if len(failed) > RUN_RETRY_MIN_FAILS:
    print('%d symbols failed; cooling down %ds before one whole-run retry' % (len(failed), RUN_RETRY_AFTER_S), flush=True)
    time.sleep(RUN_RETRY_AFTER_S)
    failed = pass_symbols(failed, H, meta, today, out_dir)
if failed:
    print('FAIL: history fetch errors: %s (partial cache of %d symbols kept)' % (failed, len(H)), flush=True)
    sys.exit(1)
save(out_dir, H, meta)
print('cached %d symbols to %s/chunk_0.json' % (len(H), out_dir), flush=True)
