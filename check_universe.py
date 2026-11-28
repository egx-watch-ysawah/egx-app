#!/usr/bin/env python3
"""Universe check. Usage: check_universe.py --root DIR
universe.json is the single source of membership and total. Checks that egx30 + egx70 + others == total, no code is in two lists,
aliases and hidden codes are not listed, EGX 30/70 equal idx/index.json, HALN/BQDC are new_listing rows with no price, and dist matches."""
import json, os, sys
root = sys.argv[sys.argv.index('--root') + 1] if '--root' in sys.argv else '.'
J = lambda p: json.load(open(os.path.join(root, p), encoding='utf8'))
res = []
def chk(name, ok, info=''): res.append((name, bool(ok), info)); print(('[PASS] ' if ok else '[FAIL] ') + name + (' ' + info if info else ''))
u = J('universe.json'); al = {k.upper(): v.upper() for k, v in u.get('aliases', {}).items()}
hid = {c.upper() for c in u.get('hidden', [])}
L = {k: [c.upper() for c in u[k]] for k in ('egx30', 'egx70', 'others')}
S = {k: set(v) for k, v in L.items()}
allc = S['egx30'] | S['egx70'] | S['others']
chk('U1 no duplicate code inside a list', all(len(L[k]) == len(S[k]) for k in L))
chk('U2 no code in two lists', len(allc) == sum(len(S[k]) for k in S), 'union %d, sum %d' % (len(allc), sum(len(S[k]) for k in S)))
chk('U3 egx30 + egx70 + others == total', u['total'] == sum(len(S[k]) for k in S), '%d + %d + %d vs total %d' % (len(S['egx30']), len(S['egx70']), len(S['others']), u['total']))
chk('U4 no alias code and no hidden code is listed', not (allc & set(al)) and not (allc & hid), str(sorted(allc & (set(al) | hid))))
chk('U5 every alias points at a listed code', all(v in allc for v in al.values()))
ix = J('idx/index.json')['rows']
i30 = {al.get(r['code'], r['code']) for r in ix if 'egx30' in r['lists']}; i70 = {al.get(r['code'], r['code']) for r in ix if 'egx70' in r['lists']}
chk('U6 egx30 and egx70 equal idx/index.json', i30 == S['egx30'] and i70 == S['egx70'], 'only idx: %s, only universe: %s' % (sorted((i30 ^ S['egx30']) | (i70 ^ S['egx70'])), ''))
st = {x['code']: x for x in J('stock_status.json')['stocks']}
nl = [c for c in ('HALN', 'BQDC') if c in allc]
chk('U7 HALN and BQDC are listed as new_listing rows with no price', len(nl) == 2 and all(st.get(c, {}).get('status') == 'new_listing' and st[c].get('last_close') is None for c in nl), str(nl))
if os.path.exists(os.path.join(root, 'dist/universe.json')):
    chk('U8 dist/universe.json identical to the repo file', open(os.path.join(root, 'dist/universe.json'), 'rb').read() == open(os.path.join(root, 'universe.json'), 'rb').read())
    js = open(os.path.join(root, 'dist/app.js'), encoding='utf8').read()
    chk('U9 the total is not hard-coded in the bundle', ('%d سهم' % u['total']) not in js and ('"%d"' % u['total']) not in js)
f = sum(1 for r in res if not r[1]); print('=== %d checks: %d PASS, %d FAIL ===' % (len(res), len(res) - f, f)); sys.exit(1 if f else 0)
