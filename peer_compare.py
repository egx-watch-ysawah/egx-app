#!/usr/bin/env python3
"""Daily peer comparison for the six held stocks. Source: TradingView scanner (free, delayed, single source).
Writes peer_compare.json. Peer groups use the feed's own labels (not EGX official sectors).
Rules: medians exclude the stock; only positive values count; n<3 => no comparison; n<5 => quality 'weak'.
If the feed fails or returns too few rows, the old data is kept, marked status=stale, and the run exits 1 (job fails = alert).
Unchanged data keeps its old generated_utc; checked_utc says when it was last checked."""
import json,sys,datetime,statistics as st,urllib.request
from pathlib import Path
OUT=Path(sys.argv[1] if len(sys.argv)>1 else 'peer_compare.json')
COLS=['name','close','sector','industry','price_earnings_ttm','price_book_fq','time']
# stock -> (label, filter on feed row). Group definitions are fixed here, so a change is a visible code change.
G={
 'ORHD':('Real Estate Development (wider group; feed puts ORHD in "Homebuilding", 4 peers)',lambda r:r['industry']=='Real Estate Development'),
 'MASR':('Real Estate Development',lambda r:r['industry']=='Real Estate Development'),
 'BONY':('Real Estate Development',lambda r:r['industry']=='Real Estate Development'),
 'HRHO':('Investment Banks/Brokers',lambda r:r['industry']=='Investment Banks/Brokers'),
 'PHAR':('Pharmaceuticals (Health Technology sector)',lambda r:r['sector']=='Health Technology'),
 'UNIP':('Containers/Packaging',lambda r:r['industry']=='Containers/Packaging'),
}
def post(b):
    req=urllib.request.Request('https://scanner.tradingview.com/egypt/scan',data=json.dumps(b).encode(),headers={'Content-Type':'application/json'})
    return json.loads(urllib.request.urlopen(req,timeout=40).read())
from zoneinfo import ZoneInfo
HOL=set()
for a,b in [("2026-01-07",None),("2026-01-29",None),("2026-03-19","2026-03-23"),("2026-04-13",None),("2026-04-25",None),("2026-05-07",None),("2026-05-26",None),("2026-05-27","2026-05-31"),("2026-06-18",None),("2026-07-02",None),("2026-07-23",None),("2026-08-27",None),("2026-10-06",None)]:
    x=datetime.date.fromisoformat(a);y=datetime.date.fromisoformat(b or a)
    while x<=y: HOL.add(x);x+=datetime.timedelta(1)
def expected_session():
    # latest session whose data should exist: today if open and Cairo time >= 15:00, else the previous trading day. Same holiday list as calendar.js (2026 only).
    n=datetime.datetime.now(ZoneInfo('Africa/Cairo'));d=n.date()
    if n.time()<datetime.time(15,0): d-=datetime.timedelta(1)
    for _ in range(31):
        if d.weekday() not in (4,5) and d not in HOL: return d.isoformat()
        d-=datetime.timedelta(1)
    return None
def sess(r):
    t=r.get('time')
    return datetime.datetime.fromtimestamp(t,datetime.timezone.utc).date().isoformat() if isinstance(t,(int,float)) and t>0 else None
def pos(v): return v if isinstance(v,(int,float)) and v>0 else None
def med(vals):
    return round(st.median(vals),2) if vals else None
try:
    data=post({'symbols':{'query':{'types':[]},'tickers':[]},'columns':COLS,'range':[0,600]})['data']
    rows={x['d'][0]:dict(zip(COLS,x['d'])) for x in data}
    assert len(rows)>=200 and all(c in rows for c in G)
except Exception as e:
    # keep the old data and its old generated_utc, but mark it stale so the UI can show it; exit 1 fails the job (alert)
    now=datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    try: old=json.loads(OUT.read_text())
    except Exception: old={'stocks':{}}
    old['status']='stale';old['stale_checked_utc']=now;old['stale_reason']=type(e).__name__+': '+str(e)[:120]
    OUT.write_text(json.dumps(old,ensure_ascii=False,indent=1))
    print('FEED FAILED, old data kept and marked stale:',e);sys.exit(1)
from collections import Counter
sd=Counter(sess(r) for r in rows.values() if sess(r)).most_common(1)[0][0]  # latest daily-bar date shared by most stocks
out={'price_session':sd,'generated_utc':datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
 'source':'TradingView scanner egypt/scan (single source, not cross-checked, reuse terms unverified)',
 'expected_session':expected_session(),'up_to_date':sd==expected_session(),'note':'Peer groups are the feed\'s own labels, not EGX official sectors. Medians exclude the stock itself. Hint only, not fair value.','stocks':{}}
for c,(label,f) in G.items():
    me=rows[c];peers=[r for k,r in rows.items() if k!=c and f(r)]
    rd=lambda v:round(v,2) if v else None
    res={'group':label,'feed_industry':me['industry'],'price_session':sess(me),'price':me['close'],'pb':rd(pos(me['price_book_fq'])),'pe':rd(pos(me['price_earnings_ttm']))}
    for key,fld in (('pb','price_book_fq'),('pe','price_earnings_ttm')):
        v=sorted(x for x in (pos(r[fld]) for r in peers) if x is not None)
        n=len(v);res['n_'+key]=n;res['median_'+key]=med(v) if n>=3 else None
        if res[key] is not None and n>=3: res['vs_'+key]='cheaper' if res[key]<res['median_'+key] else 'dearer' if res[key]>res['median_'+key] else 'same'
        else: res['vs_'+key]=None
        res['range_'+key]=[v[0],v[-1]] if n else None
    n=min([res[k] for k in('n_pb','n_pe') if res['pb' if k=='n_pb' else 'pe'] is not None] or [0])
    res['quality']='none' if n<3 else 'weak' if n<5 else 'ok'
    out['stocks'][c]=res
try: old=json.loads(OUT.read_text())
except Exception: old=None
core=lambda d:{k:v for k,v in d.items() if k not in('generated_utc','status','stale_checked_utc','stale_reason','checked_utc','expected_session','up_to_date')}
if old and core(old)==core(out):
    out['generated_utc']=old['generated_utc']  # unchanged data keeps its old stamp, never restamped as new
out['checked_utc']=datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
OUT.write_text(json.dumps(out,ensure_ascii=False,indent=1))
for c,r in out['stocks'].items(): print(c,r['pb'],r['median_pb'],r['n_pb'],'|',r['pe'],r['median_pe'],r['n_pe'],r['quality'],r['vs_pb'],r['vs_pe'])
