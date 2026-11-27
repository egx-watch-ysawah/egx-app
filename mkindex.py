import json,sys,time,datetime,urllib.request
import numpy as np,pandas as pd
from pathlib import Path
from zoneinfo import ZoneInfo
from egx import ind,quality,RULES
TV='https://scanner.tradingview.com/egypt/scan'
PORT=['MASR','BONY','HRHO','UNIP','PHAR','ORHD']
def post(body):
    req=urllib.request.Request(TV,data=json.dumps(body).encode(),headers={'Content-Type':'application/json'})
    return json.loads(urllib.request.urlopen(req,timeout=30).read())
def cols(lang,symset=None,tickers=None):
    b={'symbols':{'query':{'types':[]},'tickers':tickers or []},'columns':['name','description','close','change','volume'],'range':[0,400],'options':{'lang':lang}}
    if symset:b['symbols']={'symbolset':[symset]}
    return {x['d'][0]:x['d'] for x in post(b)['data']}
e30=list(cols('en','SYML:EGX;EGX30'))
e70=json.loads(Path('index70.json').read_text())['codes']
# One company, two lines: VLMR is Valmore's USD line, VLMRA its EGP line (https://ir.valmore.com/en/share-and-corporate-information).
# The feed lists both in EGX30, so the list had 31. Keep the EGP line (the app's prices and turnover are in pounds).
TWIN={'VLMR':'VLMRA'}
e30=[c for c in e30 if not (c in TWIN and TWIN[c] in e30)]
e70=[c for c in e70 if not (c in TWIN and TWIN[c] in e70)]
allc=list(dict.fromkeys(e30+e70))
tick=['EGX:'+c for c in allc]
ar=cols('ar',tickers=tick);en=cols('en',tickers=tick)
def hist(k):
    req=urllib.request.Request('https://startamarkets.com/api/v1/egx/history/'+k,headers={'User-Agent':'Mozilla/5.0'})
    raw=json.loads(urllib.request.urlopen(req,timeout=40).read())
    now=datetime.datetime.now(ZoneInfo('Africa/Cairo'))
    rows=[]
    for r in raw:
        d=r['date']
        if not(d<now.date().isoformat() or (d==now.date().isoformat() and now.time()>=datetime.time(15,0))):continue
        o,h,l,c,v=[float(r[n]) for n in ['open','high','low','close','volume']]
        if not(0<l<=min(o,c)<=max(o,c)<=h) or v<0:continue
        rows.append([d,o,h,l,c,v])
    df=pd.DataFrame(rows,columns=['date','open','high','low','close','volume']);df.index=pd.to_datetime(df.pop('date'));df=df.sort_index()
    return df[df.index>=pd.Timestamp(now.date())-pd.DateOffset(years=3)]
def mkplan(df,votes,P,atr,res,sup):
    # Same rules as mkdata.py (no new logic): entry/stop/target/trail from ATR, EMA20 and 20d range.
    ema20=float(df.close.ewm(span=20,adjust=False).mean().iloc[-1])
    fire=[r for r in RULES if bool(RULES[r](df).iloc[-1])]
    w={'trend':25,'mid':20,'macd':20,'rsi':15,'vol':10}
    strength=int(sum(w[a]*int(b) for a,b in votes.items())+(10 if fire else 0))
    if P>ema20*1.005: mode='pullback';entry=ema20
    else: mode='breakout';entry=res
    stop=entry-2.5*atr;target=entry+3*atr
    hh=float(df.close.tail(22).max());trail=hh-3*atr
    z=df.close*df.volume;tv=float(z.tail(60).median())
    ext=float((P-float(df.close.iloc[-21]))/atr)
    sizepct=round(min(25.0,1.0/abs(stop/entry-1)),1)
    plan=dict(trail=round(trail,4),tv=round(tv/1e6,1),ext=round(ext,1),sizepct=sizepct,mode=mode,entry=round(entry,4),stop=round(stop,4),target=round(target,4),atr=round(atr,4),atrpct=round(atr/P*100,1),
      entry_pct=round((entry/P-1)*100,1),stop_pct=round((stop/entry-1)*100,1),target_pct=round((target/entry-1)*100,1),res=round(res,4),sup=round(sup,4),ema20=round(ema20,4),strength=strength)
    return plan,fire
Path('idx').mkdir(exist_ok=True)
def write_atomic(path,text):
    # temp file in the same folder, then rename: a failed run never leaves a half-written file
    import os
    t=Path(str(path)+'.tmp');t.write_text(text);os.replace(t,path)
summary=[];errors={}
# Portfolio rows: record how many sessions data.json holds inside the 3-year window the stock page uses.
try:
    _dj=json.loads(Path('data.json').read_text())
    # data.json is built by mkdata.py with the same 3-year window the stock page shows, so its historyCount is the page's session count
    if str(_dj['asof'])[:10]<'2000':raise ValueError('bad asof')
    DJ={c:v['historyCount'] for c,v in _dj['stocks'].items() if v.get('historyCount')}
except Exception as _e:
    DJ={};print('WARNING: data.json session counts unavailable, portfolio rows get no historyCount:',_e)
# Sanity log (does not fail the job): after the twin drop EGX30 must have 30 codes.
if len(e30)!=30:errors['_egx30_count']='expected 30 got %d'%len(e30)
for k in allc:
    t=ar.get(k) or en.get(k)
    row=dict(code=k,name=(ar.get(k) or ['',k])[1],price=(ar.get(k) or [0,0,None])[2],chg=(ar.get(k) or [0,0,0,None])[3],vol=(ar.get(k) or [0,0,0,0,None])[4],lists=[x for x,l in (('egx30',e30),('egx70',e70)) if k in l],full=k in PORT,ok=False)
    if row['price'] is not None and row['vol'] is not None:row['val']=row['price']*row['vol']
    if k not in PORT:
        try:
            raw=hist(k);df,q=quality(raw)
            if len(df)<260:raise ValueError('short history %d'%len(df))
            if q['jumps']:raise ValueError('jump')
            df=ind(df.copy());last=df.iloc[-1];P=float(last.close)
            pc_=df.close.shift();tr=pd.concat([df.high-df.low,(df.high-pc_).abs(),(df.low-pc_).abs()],axis=1).max(axis=1);atr=float(tr.ewm(alpha=1/14,adjust=False).mean().iloc[-1])
            votes=dict(trend=int(last.close>last.sma200),mid=int(last.close>last.sma50),macd=int(last.macd>last.sig),rsi=int(40<=last.rsi<=70),vol=int(last.volume>last.vavg and last.close>df.close.iloc[-2]))
            chg=lambda n:round(float(df.close.iloc[-1]/df.close.iloc[-1-n]-1)*100,1)
            res=float(df.high.tail(20).max());sup=float(df.low.tail(20).min())
            plan,fire=mkplan(df,votes,P,atr,res,sup)
            s=dict(name=row['name'],ok=True,close=round(P,3),date=str(df.index[-1].date()),chg5=chg(5),chg20=chg(20),chg60=chg(60),rsi=round(float(last.rsi),0),votes=votes,volx=round(float(last.volume/last.vavg),2),
              plan=plan,fire=fire,
              bars=[[str(i.date()),round(r.open,4),round(r.high,4),round(r.low,4),round(r.close,4),int(r.volume)] for i,r in df.tail(420).iterrows()],
              hi52=round(float(df.close.tail(250).max()),3),lo52=round(float(df.close.tail(250).min()),3),historyCount=len(df),historyWindowYears=3,source='https://startamarkets.com/symbol/'+k+'/history',sourceName='Starta Markets',qualityChecked=True,auto=True)
            write_atomic(Path('idx/'+k+'.json'),json.dumps(s,ensure_ascii=False,separators=(',',':'),allow_nan=False))
            row.update(ok=True,date=s['date'],votes=votes,close=s['close'],chg5=s['chg5'])
            if row['price'] is None:row['price']=s['close']
        except Exception as e:
            errors[k]=type(e).__name__+':'+str(e)[:60]
    row['historyWindowYears']=3
    if k in PORT and k in DJ:row['historyCount']=DJ[k]
    summary.append(row);time.sleep(0.15)
write_atomic(Path('idx/index.json'),json.dumps(dict(asof=datetime.datetime.now(ZoneInfo('Africa/Cairo')).isoformat(),egx30=e30,egx70=e70,listsEffective='2026-09-01',listsNextReview='2027-03-01',listsVerified='2026-11-28',listsSource='بيان البورصة المصرية للمراجعة الدورية سبتمبر 2026 كما نشرته masrtimes.com/739069 وmubasher.info/news/4659538، ومقارنة مع TradingView. موقع البورصة نفسه مش متاح للقراءة الآلية، فالتحقق من البيان المنشور.',rows=summary,errors=errors,note70=json.loads(Path('index70.json').read_text())['source']),ensure_ascii=False,separators=(',',':'),allow_nan=False))
real={c:e for c,e in errors.items() if not c.startswith('_')}
print(len(summary),'rows',len(real),'errors',real)
if '_egx30_count' in errors:print('NOTE egx30 count:',errors['_egx30_count'])
