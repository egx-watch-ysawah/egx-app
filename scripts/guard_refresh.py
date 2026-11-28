#!/usr/bin/env python3
"""Refuse a refreshed data file that is clearly worse than the committed one.

Usage: python3 scripts/guard_refresh.py <path> [<path> ...]

Rules per file (compared against `git show HEAD:<path>`):
- JSON with top-level "stocks" (data.json):
  * refreshed stock count must be at least 90% of the committed count;
  * refresh_errors must be empty (any entry means a source failed and the
    stock was carried over stale; fail loudly instead of committing it);
  * if asof moved, the new asof must be an EGX session day (Sun-Thu and not
    in egx_holidays.json) or at least one stock date must have advanced;
    an asof that moves to a non-session day while no stock date moves is a
    masked stale refresh.
- JSON with top-level "rows"/"errors" (idx/index.json):
  * refreshed rows must be at least 90% of committed rows;
  * the error count must not jump by more than 3;
  * len(egx30) must be exactly 30;
  * len(egx70) must be at least 65 and never below the committed count - 1.

No committed version (bootstrap) passes. An unreadable refreshed file fails.
Exit 1 on any violation so the calling workflow step can restore the old
file and fail the run loudly instead of committing degraded data.
"""
import datetime
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


def holidays():
    try:
        h = json.load(open("egx_holidays.json"))
        return set(h.get("dates") or [])
    except Exception:
        return set()


def is_session_day(iso, hol):
    try:
        d = datetime.date.fromisoformat(iso)
    except Exception:
        return True  # unparseable: do not block on this rule
    return d.weekday() not in (4, 5) and iso not in hol  # EGX trades Sun-Thu


def max_stock_date(d):
    dates = [v.get("date") for v in (d.get("stocks") or {}).values() if isinstance(v, dict) and v.get("date")]
    return max(dates) if dates else ""


ok = True
hol = holidays()
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
            continue
        errs = new.get("refresh_errors") or {}
        if errs:
            print("guard: %s: refresh_errors non-empty: %s" % (path, ", ".join(sorted(errs))))
            ok = False
            continue
        new_asof = new.get("asof")
        if new_asof and new_asof != old.get("asof"):
            if not is_session_day(new_asof, hol) and max_stock_date(new) <= max_stock_date(old):
                print("guard: %s: asof moved to non-session day %s with no stock date advance (%s)" % (path, new_asof, max_stock_date(new)))
                ok = False
                continue
        print("guard: %s: stocks %d -> %d ok" % (path, o, n))
    if isinstance(old.get("rows"), list):
        orow = len(old["rows"])
        nrow = len(new.get("rows") or [])
        oerr = len(old.get("errors") or [])
        nerr = len(new.get("errors") or [])
        o30 = old.get("egx30") or []
        n30 = new.get("egx30") or []
        o70 = old.get("egx70") or []
        n70 = new.get("egx70") or []
        if isinstance(o30, list) and len(n30) != 30:
            print("guard: %s: egx30 list length %d (must be exactly 30)" % (path, len(n30)))
            ok = False
        elif isinstance(o70, list) and (len(n70) < 65 or len(n70) < len(o70) - 1):
            print("guard: %s: egx70 list length %d (must be >= 65 and >= committed %d - 1)" % (path, len(n70), len(o70)))
            ok = False
        elif nrow < 0.9 * orow:
            print("guard: %s: rows dropped %d -> %d (below 90%%)" % (path, orow, nrow))
            ok = False
        elif nerr > oerr + 3:
            print("guard: %s: errors jumped %d -> %d" % (path, oerr, nerr))
            ok = False
        else:
            print("guard: %s: rows %d -> %d, errors %d -> %d, egx30 %d, egx70 %d ok" % (path, orow, nrow, oerr, nerr, len(n30), len(n70)))

sys.exit(0 if ok else 1)
