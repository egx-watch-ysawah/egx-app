#!/usr/bin/env python3
"""Refuse a refreshed data file that is clearly worse than the committed one.

Usage: python3 scripts/guard_refresh.py <path> [<path> ...]

Rules per file (compared against `git show HEAD:<path>`):
- JSON with top-level "stocks" (data.json): refreshed stock count must be
  at least 90% of the committed count.
- JSON with top-level "rows"/"errors" (idx/index.json): refreshed rows must
  be at least 90% of committed rows, and the error count must not jump by
  more than 3.

No committed version (bootstrap) passes. An unreadable refreshed file fails.
Exit 1 on any violation so the calling workflow step can restore the old
file and fail the run loudly instead of committing degraded data.
"""
import json
import subprocess
import sys


def committed(path):
    r = subprocess.run(["git", "show", "HEAD:" + path], capture_output=True, text=True)
    if r.returncode != 0:
        return None
    try:
        return json.loads(r.stdout)
    except Exception:
        return None


ok = True
for path in sys.argv[1:]:
    old = committed(path)
    if old is None:
        print("guard: %s: no committed version, bootstrap pass" % path)
        continue
    try:
        new = json.load(open(path))
    except Exception as e:
        print("guard: %s: refreshed file unreadable: %s" % (path, e))
        ok = False
        continue
    if isinstance(old.get("stocks"), dict):
        o = len(old["stocks"])
        n = len(new.get("stocks") or {})
        if n < 0.9 * o:
            print("guard: %s: stock count dropped %d -> %d (below 90%%)" % (path, o, n))
            ok = False
        else:
            print("guard: %s: stocks %d -> %d ok" % (path, o, n))
    if isinstance(old.get("rows"), list):
        orow = len(old["rows"])
        nrow = len(new.get("rows") or [])
        oerr = len(old.get("errors") or [])
        nerr = len(new.get("errors") or [])
        if nrow < 0.9 * orow:
            print("guard: %s: rows dropped %d -> %d (below 90%%)" % (path, orow, nrow))
            ok = False
        elif nerr > oerr + 3:
            print("guard: %s: errors jumped %d -> %d" % (path, oerr, nerr))
            ok = False
        else:
            print("guard: %s: rows %d -> %d, errors %d -> %d ok" % (path, orow, nrow, oerr, nerr))

sys.exit(0 if ok else 1)
