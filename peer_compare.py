#!/usr/bin/env python3
"""Daily peer comparison for the six held stocks, the 5 P0 pilot stocks, the 21 B1-B3 batch stocks and the 20 B4-B6 batch stocks and the 20 C1 batch stocks (72 in all). Source: TradingView scanner (free, delayed, single source).
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
 'ORHD':('Real Estate Development (wider group; feed label is Homebuilding)',lambda r:r['industry']=='Real Estate Development'),
 'MASR':('Real Estate Development',lambda r:r['industry']=='Real Estate Development'),
 'BONY':('Real Estate Development',lambda r:r['industry']=='Real Estate Development'),
 'HRHO':('Investment Banks/Brokers',lambda r:r['industry']=='Investment Banks/Brokers'),
 'PHAR':('Pharmaceuticals (Health Technology sector)',lambda r:r['sector']=='Health Technology'),
 'UNIP':('Containers/Packaging',lambda r:r['industry']=='Containers/Packaging'),
 # P0 pilot stocks added 28 Nov. Group choices are by feed label only; reasons are in NOTES below (not in the group label, which must stay a short clean label).
 'COMI':('Regional Banks',lambda r:r['industry']=='Regional Banks'),
 'ETEL':('Major Telecommunications',lambda r:r['industry']=='Major Telecommunications'),
 'TMGH':('Real Estate Development',lambda r:r['industry']=='Real Estate Development'),
 'SWDY':('Electrical Products',lambda r:r['industry']=='Electrical Products'),
 'EAST':('Tobacco',lambda r:r['industry']=='Tobacco'),
 # B1-B3 batches added 28 Nov (one cumulative package). Group choices are by feed label only; reasons are in NOTES below.
 'TAQA':('Electric Utilities',lambda r:r['industry']=='Electric Utilities'),
 'SKPC':('Chemicals: Specialty + Agricultural',lambda r:r['industry'] in ('Chemicals: Specialty','Chemicals: Agricultural')),
 'ABUK':('Chemicals: Agricultural',lambda r:r['industry']=='Chemicals: Agricultural'),
 'ORAS':('Engineering & Construction',lambda r:r['industry']=='Engineering & Construction'),
 'PHDC':('Real Estate Development',lambda r:r['industry']=='Real Estate Development'),
 'ADIB':('Regional Banks',lambda r:r['industry']=='Regional Banks'),
 'FWRY':('Technology Services',lambda r:r['sector']=='Technology Services'),
 'RMDA':('Pharmaceuticals: Major',lambda r:r['industry']=='Pharmaceuticals: Major'),
 'RAYA':('Technology Services',lambda r:r['sector']=='Technology Services'),
 'ORWE':('Home Furnishings',lambda r:r['industry']=='Home Furnishings'),
 'MFPC':('Chemicals: Agricultural',lambda r:r['industry']=='Chemicals: Agricultural'),
 'MCQE':('Construction Materials',lambda r:r['industry']=='Construction Materials'),
 'LCSW':('Producer Manufacturing',lambda r:r['sector']=='Producer Manufacturing'),
 'JUFO':('Food: Meat/Fish/Dairy',lambda r:r['industry']=='Food: Meat/Fish/Dairy'),
 'ISPH':('Medical Distributors',lambda r:r['industry']=='Medical Distributors'),
 'ISMA':('Agricultural Commodities/Milling',lambda r:r['industry']=='Agricultural Commodities/Milling'),
 'ICFC':('Chemicals: Agricultural',lambda r:r['industry']=='Chemicals: Agricultural'),
 'HDBK':('Regional Banks',lambda r:r['industry']=='Regional Banks'),
 'ELKA':('Real Estate Development',lambda r:r['industry']=='Real Estate Development'),
 'EFIH':('Technology Services',lambda r:r['sector']=='Technology Services'),
 'EFID':('Food: Specialty/Candy',lambda r:r['industry']=='Food: Specialty/Candy'),
 # B4-B6 batches added 28 Nov (one cumulative package). Group choices are by feed label only; reasons are in NOTES below.
 'DSCW':('Apparel/Footwear',lambda r:r['industry']=='Apparel/Footwear'),
 'ARCC':('Construction Materials',lambda r:r['industry']=='Construction Materials'),
 'AMOC':('Oil Refining/Marketing',lambda r:r['industry']=='Oil Refining/Marketing'),
 'UEGC':('Engineering & Construction',lambda r:r['industry']=='Engineering & Construction'),
 'MEPA':('Containers/Packaging',lambda r:r['industry']=='Containers/Packaging'),
 'ETRS':('Other Transportation',lambda r:r['industry']=='Other Transportation'),
 'AMER':('Real Estate Development',lambda r:r['industry']=='Real Estate Development'),
 'MCRO':('Pharmaceuticals: Major',lambda r:r['industry']=='Pharmaceuticals: Major'),
 'ENGC':('Building Products',lambda r:r['industry']=='Building Products'),
 'MPRC':('Movies/Entertainment',lambda r:r['industry']=='Movies/Entertainment'),
 'ATQA':('Producer Manufacturing',lambda r:r['sector']=='Producer Manufacturing'),
 'POUL':('Agricultural Commodities/Milling',lambda r:r['industry']=='Agricultural Commodities/Milling'),
 'MTIE':('Electronics Distributors',lambda r:r['industry']=='Electronics Distributors'),
 'MBSC':('Construction Materials',lambda r:r['industry']=='Construction Materials'),
 'SCEM':('Construction Materials',lambda r:r['industry']=='Construction Materials'),
 'EXPA':('Regional Banks',lambda r:r['industry']=='Regional Banks'),
 'OCDI':('Real Estate Development',lambda r:r['industry']=='Real Estate Development'),
 'EGAL':('Aluminum + Steel',lambda r:r['industry'] in ('Aluminum','Steel')),
 'CLHO':('Hospital/Nursing Management',lambda r:r['industry']=='Hospital/Nursing Management'),
 'CCAP':('Investment Managers',lambda r:r['industry']=='Investment Managers'),
 # C1 batch added 28 Nov: studies_rest stocks that have flow data and a viable peer group. Group choices are by feed label only; reasons are in NOTES below.
 'AIFI':('Agricultural Commodities/Milling',lambda r:r['industry']=='Agricultural Commodities/Milling'),
 'ALCN':('Other Transportation',lambda r:r['industry']=='Other Transportation'),
 'ASCM':('Construction Materials',lambda r:r['industry']=='Construction Materials'),
 'DAPH':('Real Estate Development',lambda r:r['industry']=='Real Estate Development'),
 'EGCH':('Chemicals: Agricultural',lambda r:r['industry']=='Chemicals: Agricultural'),
 'EHDR':('Real Estate Development',lambda r:r['industry']=='Real Estate Development'),
 'ELSH':('Real Estate Development',lambda r:r['industry']=='Real Estate Development'),
 'EMFD':('Real Estate Development',lambda r:r['industry']=='Real Estate Development'),
 'GBCO':('Wholesale Distributors',lambda r:r['industry']=='Wholesale Distributors'),
 'GPIM':('Real Estate Development',lambda r:r['industry']=='Real Estate Development'),
 'HELI':('Homebuilding',lambda r:r['industry']=='Homebuilding'),
 'IDRE':('Homebuilding',lambda r:r['industry']=='Homebuilding'),
 'IEEC':('Engineering & Construction',lambda r:r['industry']=='Engineering & Construction'),
 'MPCO':('Agricultural Commodities/Milling',lambda r:r['industry']=='Agricultural Commodities/Milling'),
 'NCCW':('Engineering & Construction',lambda r:r['industry']=='Engineering & Construction'),
 'OBRI':('Real Estate Development',lambda r:r['industry']=='Real Estate Development'),
 'PRDC':('Real Estate Development',lambda r:r['industry']=='Real Estate Development'),
 'SDTI':('Hotels/Resorts/Cruise lines',lambda r:r['industry']=='Hotels/Resorts/Cruise lines'),
 'SIPC':('Pharmaceuticals: Major',lambda r:r['industry']=='Pharmaceuticals: Major'),
 'ZMID':('Real Estate Development',lambda r:r['industry']=='Real Estate Development'),
}
NOTES={ # structural explanations only (design choices that do not depend on today's data). Data-state sentences are generated from the reason fields.
 'ORHD':'Uses the wider Real Estate Development group because the feed label (Homebuilding) has too few stocks.',
 'COMI':'Banks are compared on P/B first. P/E is secondary and must not be read alone.',
 'ETEL':'Group is the feed industry and is not widened to a broader sector.',
 'SWDY':'Group is the feed industry and is not widened to a broader sector.',
 'EAST':'Group is the feed industry and is not widened to a broader sector.',
 'TAQA':'Group is the feed industry (Electric Utilities). It is not widened to the whole Utilities sector, which mixes gas distribution with power generation.',
 'SKPC':'Group combines the two feed chemicals industries (Specialty and Agricultural) because Specialty alone has too few stocks with figures. Both are chemical producers in the same feed sector.',
 'ABUK':'Group is the feed industry and is not widened to a broader sector.',
 'ORAS':'Group is the feed industry and is not widened to a broader sector.',
 'PHDC':'Group is the feed industry and is not widened to a broader sector.',
 'ADIB':'Banks are compared on P/B first. P/E is secondary and must not be read alone.',
 'FWRY':'Uses the wider Technology Services sector because the feed industry (Packaged Software) has too few stocks with figures. All members are technology companies; the comparison is flagged weak.',
 'RMDA':'Group is the feed industry (Pharmaceuticals: Major, 9 peers with P/B and 5 with P/E) and is not widened, same treatment as ETEL, SWDY and EAST.',
 'RAYA':'Uses the wider Technology Services sector because the feed industry (Information Technology Services) has only one other stock, with no figures. All members are technology companies; the comparison is flagged weak.',
 'ORWE':'Group is the feed industry (Home Furnishings). It is not widened: the wider Consumer Durables sector is mostly real-estate developers, a different business.',
 'MFPC':'Group is the feed industry (Chemicals: Agricultural, mainly fertilizer makers) and is not widened.',
 'MCQE':'Group is the feed industry (Construction Materials, cement and related) and is not widened.',
 'LCSW':'Uses the wider Producer Manufacturing sector because the feed industry (Building Products) has only 2 peers with a P/B. The sector is all industrial manufacturers; the comparison is flagged weak.',
 'JUFO':'Group is the feed industry (Food: Meat/Fish/Dairy). It is not widened: the wider Consumer Non-Durables sector mixes tobacco, personal care and sweets, which are different businesses.',
 'ISPH':'Group is the feed industry (Medical Distributors) and is not widened to wholesale distributors or pharma makers, which have a different business model.',
 'ISMA':'Group is the feed industry (Agricultural Commodities/Milling), which mixes poultry, feed, sugar and milling companies, so the spread is wide.',
 'ICFC':'Group is the feed industry (agricultural chemicals and fertilizers).',
 'HDBK':'Banks are compared on P/B first. P/E is secondary and must not be read alone.',
 'ELKA':'Group is the feed industry (Real Estate Development), the same group used for ORHD, MASR, BONY and TMGH. P/B is read against asset-heavy peers.',
 'EFIH':'Uses the wider Technology Services sector because the feed industry (Packaged Software) has only 2 peers with a P/B. Same treatment as FWRY and RAYA; the comparison is flagged weak.',
 'EFID':'Group is the feed industry (Food: Specialty/Candy) and is not widened to the wider Consumer Non-Durables sector, which mixes unlike businesses.',
 # B4-B6. Structural explanations only; no fixed numbers that depend on the data of the day.
 'DSCW':'Group is the feed industry (Apparel/Footwear). It is not widened to the wider Consumer Non-Durables sector, which mixes tobacco, personal care and food, different businesses.',
 'ARCC':'Group is the feed industry (Construction Materials, cement and related), the same group as MCQE, and is not widened.',
 'AMOC':'Group is the feed industry (Oil Refining/Marketing). It is the only stock in that industry in the feed; the other energy names are drilling, oilfield services and gas distribution, different businesses, so the group is not widened.',
 'UEGC':'Group is the feed industry, the same group as ORAS, and is not widened to a broader sector.',
 'MEPA':'Group is the feed industry, the same group as UNIP. It is not widened to the wider Process Industries sector, which mixes chemicals, paper and other unlike businesses.',
 'ETRS':'Group is the feed industry (Other Transportation, transport and logistics). It is not widened: the rest of the Transportation sector is marine shipping, a different business.',
 'AMER':'Group is the feed industry, the same group used for ORHD, MASR, BONY, TMGH, PHDC and ELKA. P/B is read against asset-heavy peers.',
 'MCRO':'Group is the feed industry, the same group as RMDA, and is not widened to the whole Health Technology sector.',
 'ENGC':'Group is the feed industry (Building Products) and is not widened to a broader sector.',
 'MPRC':'Group is the feed industry (Movies/Entertainment). It is the only stock in that industry in the feed; the wider Consumer Services sector mixes hotels and other services, different businesses, so the group is not widened.',
 'ATQA':'Uses the wider Producer Manufacturing sector because the feed industry (Metal Fabrication) has too few peers with figures. The sector is all industrial manufacturers; the comparison is flagged weak.',
 'POUL':'Group is the feed industry, the same group as ISMA, which mixes poultry, feed, sugar and milling companies, so the spread is wide.',
 'MTIE':'Group is the feed industry (Electronics Distributors). It is the only stock in that industry in the feed; it is not widened to wholesale or food distributors, a different business model.',
 'MBSC':'Group is the feed industry, the same group as MCQE, and is not widened.',
 'SCEM':'Group is the feed industry, the same group as MCQE and MBSC, and is not widened.',
 'EXPA':'Banks are compared on P/B first. P/E is secondary and must not be read alone.',
 'OCDI':'Group is the feed industry, the same group used for the other real-estate developers. P/B is read against asset-heavy peers.',
 'EGAL':'Group combines the feed Aluminum and Steel industries, both primary metal producers, because the Aluminum industry alone is too small.',
 'CLHO':'Group is the feed industry (Hospital/Nursing Management, hospital operators). It is not widened to the wider Health Services sector.',
 'CCAP':'Group is the feed industry (Investment Managers, asset and investment management). It is not mixed with investment banks and brokers, a different business.',
 # C1. Structural explanations only; no fixed numbers that depend on the data of the day.
 'AIFI':'Group is the feed industry, the same group as ISMA and POUL, which mixes poultry, feed, sugar and milling companies, so the spread is wide.',
 'ALCN':'Group is the feed industry (Other Transportation, transport and logistics), the same group as ETRS. It is not widened: the rest of the Transportation sector is marine shipping, a different business.',
 'ASCM':'Group is the feed industry, the same group as MCQE, and is not widened.',
 'DAPH':'Group is the feed industry, the same group used for the other real-estate developers. P/B is read against asset-heavy peers.',
 'EGCH':'Group is the feed industry (agricultural chemicals and fertilizers), the same group as ABUK, MFPC and ICFC.',
 'EHDR':'Group is the feed industry, the same group used for the other real-estate developers. P/B is read against asset-heavy peers.',
 'ELSH':'Group is the feed industry, the same group used for the other real-estate developers. P/B is read against asset-heavy peers.',
 'EMFD':'Group is the feed industry, the same group used for the other real-estate developers. P/B is read against asset-heavy peers.',
 'GBCO':'Group is the feed industry (Wholesale Distributors, wholesale traders). It is not widened to the whole Distribution Services sector, which mixes food and electronics distribution.',
 'GPIM':'Group is the feed industry, the same group used for the other real-estate developers. P/B is read against asset-heavy peers.',
 'HELI':'Group is the feed industry (Homebuilding, residential builders) and is not widened to the wider real-estate development group.',
 'IDRE':'Group is the feed industry (Homebuilding, residential builders) and is not widened to the wider real-estate development group.',
 'IEEC':'Group is the feed industry, the same group as ORAS, and is not widened to a broader sector.',
 'MPCO':'Group is the feed industry, the same group as ISMA and POUL, which mixes poultry, feed, sugar and milling companies, so the spread is wide.',
 'NCCW':'Group is the feed industry, the same group as ORAS, and is not widened to a broader sector.',
 'OBRI':'Group is the feed industry, the same group used for the other real-estate developers. P/B is read against asset-heavy peers.',
 'PRDC':'Group is the feed industry, the same group used for the other real-estate developers. P/B is read against asset-heavy peers.',
 'SDTI':'Group is the feed industry (Hotels/Resorts/Cruise lines, hotels and resorts). It is not widened to the wider Consumer Services sector, which mixes movies and other services.',
 'SIPC':'Group is the feed industry, the same group as RMDA and MCRO, and is not widened to the whole Health Technology sector.',
 'ZMID':'Group is the feed industry, the same group used for the other real-estate developers. P/B is read against asset-heavy peers.'}
def make_note(c,res):
    parts=[NOTES[c]] if c in NOTES else []
    for key,lab in (('pb','P/B'),('pe','P/E')):
        r=res['reason_'+key]
        if r=='no_own_figure': parts.append('The feed has no own %s for this stock.'%lab)
        elif r=='no_peers': parts.append('Fewer than 3 peers with a %s in the feed group, so no %s comparison.'%(lab,lab))
    return ' '.join(parts) or None
BANK_INDUSTRIES={'Regional Banks','Major Banks'}
# Second share line of the same company (identical market cap in the feed). Excluded as a peer so one company is not counted twice.
DUP={'VLMRA','FAITA'}
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
    missing=[c for c in G if c not in rows]
    if len(rows)<200: raise AssertionError('feed returned only %d stocks'%len(rows))
    if missing: raise AssertionError('stocks missing from feed: '+', '.join(missing))
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
    me=rows[c];peers=[r for k,r in rows.items() if k!=c and k not in DUP and f(r)]
    rd=lambda v:round(v,2) if v else None
    res={'group':label,'feed_industry':me['industry'],'price_session':sess(me),'price':me['close'],'pb':rd(pos(me['price_book_fq'])),'pe':rd(pos(me['price_earnings_ttm']))}
    for key,fld in (('pb','price_book_fq'),('pe','price_earnings_ttm')):
        v=sorted(x for x in (pos(r[fld]) for r in peers) if x is not None)
        n=len(v);res['n_'+key]=n;res['median_'+key]=med(v) if n>=3 else None
        if res[key] is not None and n>=3: res['vs_'+key]='cheaper' if res[key]<res['median_'+key] else 'dearer' if res[key]>res['median_'+key] else 'same'
        else: res['vs_'+key]=None
        res['range_'+key]=[v[0],v[-1]] if n else None
        wide=n>=3 and (v[-1]>5*med(v) or v[0]<0.2*med(v))
        res['comparable_'+key]=res['vs_'+key] is not None   # medians/ranges may be stored for context but are a comparison only when this is true
        res['range_'+key+'_show']=n>=3 and not wide          # hide ranges with under 3 values or extreme values
        res['reason_'+key]=None if res['comparable_'+key] else ('no_own_figure' if res[key] is None else 'no_peers')
    ql=lambda n:'none' if n<3 else 'weak' if n<5 else 'ok'
    res['quality_pb']=ql(res['n_pb']);res['quality_pe']=ql(res['n_pe'])
    # overall quality = the best metric that has an own figure (a valid comparison on one metric is not hidden by the other)
    n=max([res[k] for k in('n_pb','n_pe') if res['pb' if k=='n_pb' else 'pe'] is not None] or [0])
    res['quality']=ql(n)
    res['quality_reason']=None if res['quality']!='none' else ('no_own_figure' if res['pb'] is None and res['pe'] is None else 'no_peers')
    res['pe_secondary']=me['industry'] in BANK_INDUSTRIES   # banks: P/B first, vs_pe must not be read alone
    res['note']=make_note(c,res)
    out['stocks'][c]=res
try: old=json.loads(OUT.read_text())
except Exception: old=None
core=lambda d:{k:v for k,v in d.items() if k not in('generated_utc','status','stale_checked_utc','stale_reason','checked_utc','expected_session','up_to_date')}
if old and core(old)==core(out):
    out['generated_utc']=old['generated_utc']  # unchanged data keeps its old stamp, never restamped as new
out['checked_utc']=datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
OUT.write_text(json.dumps(out,ensure_ascii=False,indent=1))
for c,r in out['stocks'].items(): print(c,r['pb'],r['median_pb'],r['n_pb'],'|',r['pe'],r['median_pe'],r['n_pe'],r['quality'],r['quality_reason'],r['vs_pb'],r['vs_pe'],'pe_secondary' if r['pe_secondary'] else '')
