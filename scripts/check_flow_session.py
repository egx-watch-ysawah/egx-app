#!/usr/bin/env python3
"""check_flow_session.py - freshness gate for the daily flow job.

Fails (exit 1) unless flow_signal.json's `session` equals the last expected
trading day: today once it is past 15:00 Africa/Cairo, otherwise the previous
trading day; Fridays, Saturdays and the dates in egx_holidays.json are skipped
(same rule as peer_compare.py's expected_session and ui2026/MarketClock.tsx).
A wholly stale feed (e.g. Starta serving old bars) fails the job, the old JSON
files stay live and the workflow opens an issue.

Usage: python3 scripts/check_flow_session.py flow_signal.json [egx_holidays.json]
"""
import json, sys, datetime
from zoneinfo import ZoneInfo

sig = json.load(open(sys.argv[1]))
hol_path = sys.argv[2] if len(sys.argv) > 2 else 'egx_holidays.json'
try:
    hol = set(json.load(open(hol_path))['dates'])
except FileNotFoundError:
    hol = set()
    print('WARN: %s missing, weekend-only calendar' % hol_path)

now = datetime.datetime.now(ZoneInfo('Africa/Cairo'))
d = now.date()
if now.time() < datetime.time(15, 0):
    d -= datetime.timedelta(1)
for _ in range(31):
    if d.weekday() not in (4, 5) and d.isoformat() not in hol:
        break
    d -= datetime.timedelta(1)
expected = d.isoformat()
session = sig.get('session')
if session != expected:
    print('FAIL: flow_signal session %s != expected trading day %s' % (session, expected))
    sys.exit(1)
print('freshness ok: session %s' % session)
