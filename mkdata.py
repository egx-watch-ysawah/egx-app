import json,numpy as np,pandas as pd,datetime
from egx import *
NAMES={'MASR':'مدينة مصر','BONY':'بنيان','HRHO':'إي إف جي هيرميس','UNIP':'يونيفرسال للورق','PHAR':'إيبيكو (فارما)','ORHD':'أوراسكوم للتنمية'}
def votes(d):
    v=pd.DataFrame(index=d.index)
    v['trend']=(d.close>d.sma200).astype(int)
    v['mid']=(d.close>d.sma50).astype(int)
    v['macd']=(d.macd>d.sig).astype(int)
    v['rsi']=((d.rsi>=40)&(d.rsi<=70)).astype(int)
    v['vol']=((d.volume>d.vavg)&(d.close>d.close.shift())).astype(int)
    return v
import urllib.request
from pathlib import Path
from zoneinfo import ZoneInfo
SOURCES={
'MASR':'https://startamarkets.com/ar/symbol/MASR-%D9%85%D8%AF%D9%8A%D9%86%D8%A9-%D9%85%D8%B5%D8%B1/history',
'BONY':'https://startamarkets.com/ar/symbol/BONY-%D8%A8%D9%86%D9%8A%D8%A7%D9%86-%D9%84%D9%84%D8%AA%D9%86%D9%85%D9%8A%D8%A9-%D9%88%D8%A7%D9%84%D8%AA%D8%AC%D8%A7%D8%B1%D8%A9/history',
'HRHO':'https://startamarkets.com/symbol/HRHO/history',
'UNIP':'https://startamarkets.com/symbol/UNIP/history',
'PHAR':'https://startamarkets.com/symbol/PHAR/history',
'ORHD':'https://startamarkets.com/symbol/ORHD/history'}
NAMES={'MASR':'مدينة مصر','BONY':'بنيان','HRHO':'إي إف جي القابضة','UNIP':'يونيباك','PHAR':'إيبيكو','ORHD':'أوراسكوم للتنمية مصر'}
def completed_date(day,now=None):
    now=now or datetime.datetime.now(ZoneInfo('Africa/Cairo'))
    if now.tzinfo is None:raise ValueError('Timezone required')
    now=now.astimezone(ZoneInfo('Africa/Cairo'))
    return day<now.date().isoformat() or (day==now.date().isoformat() and now.time()>=datetime.time(15,0))
def source_frame(k):
    # Endpoint observed in the public chart's own bundle, same source for all dates.
    url='https://startamarkets.com/api/v1/egx/history/'+k
    req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'})
    raw=json.loads(urllib.request.urlopen(req,timeout=25).read())
    if not isinstance(raw,list) or len(raw)<250:raise ValueError('Insufficient history')
    rows=[]
    for r in raw:
        day=r['date'];datetime.date.fromisoformat(day)
        if not completed_date(day):continue
        vals=[float(r[n]) for n in ['open','high','low','close','volume']]
        o,h,l,c,v=vals
        if not all(np.isfinite(vals)) or not(0<l<=min(o,c)<=max(o,c)<=h) or v<0:raise ValueError('Invalid OHLCV')
        rows.append([day,*vals])
    df=pd.DataFrame(rows,columns=['date','open','high','low','close','volume'])
    df.index=pd.to_datetime(df.pop('date'));df=df.sort_index()
    if df.index.duplicated().any():raise ValueError('Duplicate history')
    # Rolling five-year window, not a splice with the rejected Yahoo candles.
    cutoff=pd.Timestamp(datetime.datetime.now(ZoneInfo('Africa/Cairo')).date())-pd.DateOffset(years=3)  # same 3-year window the stock page builds from Starta (clientidx.ts)
    df=df[df.index>=cutoff]
    if len(df)<250:raise ValueError('Insufficient five-year window')
    if (df.close.pct_change().abs()>.25).any():raise ValueError('Unexplained corporate-action jump')
    return df

try:previous=json.loads(Path('data.json').read_text())
except Exception:previous={'stocks':{}}
out={'asof':datetime.datetime.now(ZoneInfo('Africa/Cairo')).date().isoformat(),'generated_at':datetime.datetime.now(ZoneInfo('Africa/Cairo')).isoformat(),'stocks':{},'refresh_errors':{}}
for k,s in SYM.items():
    try:
        raw=source_frame(k);df,q=quality(raw)
        if len(df)<250:
            out['stocks'][k]=dict(name=NAMES[k],ok=False,close=float(df.close.iloc[-1]) if len(df) else None);continue
        df=ind(df.copy());v=votes(df);df['score']=v.sum(axis=1)
        last=df.iloc[-1];lv=v.iloc[-1]
        # score buckets forward 10d
        fwd=df.close.shift(-H)/df.close.shift(-1)*0+df.close.shift(-H)/df.open.shift(-1)-1-COST
        bk={}
        for lo,hi,name in [(0,1,'0-1'),(2,3,'2-3'),(4,5,'4-5')]:
            m=df.score.between(lo,hi)&fwd.notna();x=fwd[m]
            bk[name]=dict(days=int(m.sum()),win=round(float((x>0).mean())*100),avg=round(float(x.mean())*100,1))
        bt={}
        for r in RULES:
            x=backtest(df,r);bt[r]=dict(n=len(x),win=round(float(np.mean([a>0 for a in x]))*100) if x else None,avg=round(float(np.mean(x))*100,1) if x else None)
        pc_=df.close.shift();tr=pd.concat([df.high-df.low,(df.high-pc_).abs(),(df.low-pc_).abs()],axis=1).max(axis=1);atr=float(tr.ewm(alpha=1/14,adjust=False).mean().iloc[-1])
        ema20=float(df.close.ewm(span=20,adjust=False).mean().iloc[-1]);P=float(last.close)
        res=float(df.high.tail(20).max());sup=float(df.low.tail(20).min())
        w={'trend':25,'mid':20,'macd':20,'rsi':15,'vol':10}
        strength=int(sum(w[a]*int(b) for a,b in lv.items())+(10 if any(bool(RULES[r](df).iloc[-1]) for r in RULES) else 0))
        if P>ema20*1.005: mode='pullback';entry=ema20
        else: mode='breakout';entry=res
        stop=entry-2.5*atr;target=entry+3*atr
        hh=float(df.close.tail(20).max());trail=hh-3*atr
        z=df.close.shift(0)*df.volume;tv=float(z.tail(60).median());zd=int((df.volume.tail(60)==0).sum())
        ext=float((P-float(df.close.iloc[-21]))/atr)
        sizepct=round(min(25.0,1.0/abs(stop/entry-1)),1)
        plan=dict(trail=round(trail,4),tv=round(tv/1e6,1),ext=round(ext,1),sizepct=sizepct,mode=mode,entry=round(entry,4),stop=round(stop,4),target=round(target,4),atr=round(atr,4),atrpct=round(atr/P*100,1),
          entry_pct=round((entry/P-1)*100,1),stop_pct=round((stop/entry-1)*100,1),target_pct=round((target/entry-1)*100,1),res=round(res,4),sup=round(sup,4),ema20=round(ema20,4),strength=strength)
        m20=df.close.rolling(20).mean();sd=df.close.rolling(20).std();df['bu']=m20+2*sd;df['bl']=m20-2*sd
        up_=df.high.diff();dn_=-df.low.diff();pdm=np.where((up_>dn_)&(up_>0),up_,0.0);mdm=np.where((dn_>up_)&(dn_>0),dn_,0.0)
        atrs=tr.ewm(alpha=1/14,adjust=False).mean();pdi=100*pd.Series(pdm,index=df.index).ewm(alpha=1/14,adjust=False).mean()/atrs;mdi=100*pd.Series(mdm,index=df.index).ewm(alpha=1/14,adjust=False).mean()/atrs
        adx=float((100*(pdi-mdi).abs()/(pdi+mdi)).ewm(alpha=1/14,adjust=False).mean().iloc[-1]);plan['adx']=round(adx,0);plan['pdi_gt']=bool(pdi.iloc[-1]>mdi.iloc[-1])
        plan['bbpos']=round(float((P-df.bl.iloc[-1])/(df.bu.iloc[-1]-df.bl.iloc[-1])*100))
        t=df.tail(150)
        rows=[[str(i.date()),round(r.open,4),round(r.high,4),round(r.low,4),round(r.close,4),int(r.volume),None if pd.isna(r.sma50) else round(r.sma50,4),None if pd.isna(r.sma200) else round(r.sma200,4),round(r.rsi,1),round(r.macd,4),round(r.sig,4),None if pd.isna(r.bu) else round(r.bu,4),None if pd.isna(r.bl) else round(r.bl,4)] for i,r in t.iterrows()]
        bars=[[str(i.date()),round(r.open,4),round(r.high,4),round(r.low,4),round(r.close,4),int(r.volume)] for i,r in df.tail(900).iterrows()]
        chg=lambda n:round(float(df.close.iloc[-1]/df.close.iloc[-1-n]-1)*100,1)
        out['stocks'][k]=dict(name=NAMES[k],ok=True,close=round(float(last.close),3),date=str(df.index[-1].date()),chg5=chg(5),chg20=chg(20),chg60=chg(60),
          rsi=round(float(last.rsi),0),score=int(last.score),votes={a:int(b) for a,b in lv.items()},volx=round(float(last.volume/last.vavg),2),
          fire=[r for r in RULES if bool(RULES[r](df).iloc[-1])],bt=bt,buckets=bk,plan=plan,bars=bars,base=round(float((df.close.shift(-H)/df.open.shift(-1)-1).mean())*100-COST*100,1),
          hi52=round(float(df.close.tail(250).max()),3),lo52=round(float(df.close.tail(250).min()),3),jumps=q['jumps'],dropped=q['dropped'])
        print(k,out['stocks'][k]['score'],bk)
        if previous.get('stocks',{}).get(k,{}).get('date','')>out['stocks'][k]['date']:raise ValueError('Date regressed')
        out['stocks'][k]['source']=SOURCES[k]
        out['stocks'][k]['sourceName']='Starta Markets'
        out['stocks'][k]['historyCount']=len(df)
        out['stocks'][k]['sourceApi']='https://startamarkets.com/api/v1/egx/history/'+k
        out['stocks'][k]['qualityChecked']=True
    except Exception as error:
        old=previous.get('stocks',{}).get(k,{})
        if not (old.get('qualityChecked') or old.get('windowOnly')):raise
        out['stocks'][k]=old;out['refresh_errors'][k]=type(error).__name__
out['flows']=None
if previous.get('patch_note'):out['patch_note']=previous['patch_note']  # carry the manual patch note forward; a refresh must not silently drop it
payload=json.dumps(out,ensure_ascii=False,separators=(',',':'),allow_nan=False)
Path('data.next.json').write_text(payload);Path('data.next.json').replace('data.json')
import os;print(os.path.getsize('data.json'))
