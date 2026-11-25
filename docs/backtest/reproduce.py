#!/usr/bin/env python3
"""Reproduce the headline backtest numbers from bt3_rows.json (stdlib only). Same formulas as cons.py/add3.py:
g = EPS growth vs prior FY, capped to [-30%, +60%]; T1 = EPS*(1+g)*peer-median P/E; T3 = price*(1+g); B1 = price unchanged; horizon 12m (f12).
error = |target - price 12m later| / price 12m later; reported = median over all rows."""
import json,statistics as st,os
H=os.path.dirname(os.path.abspath(__file__))
rows=[r for r in json.load(open(H+'/bt3_rows.json')) if r.get('f12') and r.get('eps_prev') and r['eps_prev']>0 and r.get('pe_med')]
E={'T1':[],'T3':[],'B1':[]}
for r in rows:
    g=max(-.3,min(.6,r['eps']/r['eps_prev']-1))
    t={'T1':r['eps']*(1+g)*r['pe_med'],'T3':r['price']*(1+g),'B1':r['price']}
    for k,v in t.items(): E[k].append(abs(v-r['f12'])/r['f12'])
print('rows',len(rows))
for k,v in E.items(): print(k,'median abs error %.0f%%'%(100*st.median(v)),'mean %.0f%%'%(100*st.mean(v)))
