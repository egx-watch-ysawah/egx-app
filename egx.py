import json,re,subprocess,warnings,datetime
import pandas as pd,numpy as np
warnings.filterwarnings("ignore")
UA="Mozilla/5.0"
SYM={'MASR':'MASR.CA','BONY':'EGS656M1C010.CA','HRHO':'HRHO.CA','UNIP':'UNIP.CA','PHAR':'PHAR.CA','ORHD':'ORHD.CA'}
def curl(u): return subprocess.run(["curl","-s","-m","30","-A",UA,u],capture_output=True,text=True).stdout
def load(sym):
    r=json.loads(curl(f"https://query1.finance.yahoo.com/v8/finance/chart/{sym}?range=5y&interval=1d&events=splits"))['chart']['result'][0]
    q=r['indicators']['quote'][0]
    df=pd.DataFrame(q,index=pd.to_datetime(r['timestamp'],unit='s').normalize())
    for sp in (r.get('events',{}).get('splits') or {}).values():
        ratio=sp['numerator']/sp['denominator'];d0=pd.to_datetime(sp['date'],unit='s').normalize()
        w=df.close.dropna();ch=w.pct_change().abs();ch=ch[(ch.index>=d0-pd.Timedelta(days=15))&(ch.index<=d0+pd.Timedelta(days=15))]
        if ratio>1.2 and len(ch) and ch.max()>0.3:
            day=ch.idxmax();m=df.index<day
            for c in ['open','high','low','close']: df.loc[m,c]=df.loc[m,c]/ratio
            df.loc[m,'volume']=df.loc[m,'volume']*ratio
            print('split-adjusted',sym,day.date(),round(ratio,3))
    return df
def quality(df):
    n0=len(df);df=df.dropna(); df=df[df.volume>0]
    ret=df.close.pct_change()
    jumps=int((ret.abs()>0.25).sum())
    gap=(df.index.to_series().diff().dt.days>7).sum()
    return df,dict(rows=len(df),dropped=n0-len(df),jumps=jumps,gaps=int(gap),last=str(df.index[-1].date()))
def ind(df):
    c=df.close
    d=c.diff();up=d.clip(lower=0).ewm(alpha=1/14,adjust=False).mean();dn=(-d.clip(upper=0)).ewm(alpha=1/14,adjust=False).mean()
    df['rsi']=100-100/(1+up/dn)
    e12=c.ewm(span=12,adjust=False).mean();e26=c.ewm(span=26,adjust=False).mean()
    df['macd']=e12-e26;df['sig']=df.macd.ewm(span=9,adjust=False).mean()
    df['sma50']=c.rolling(50).mean();df['sma200']=c.rolling(200).mean()
    df['hi20']=c.shift(1).rolling(20).max();df['vavg']=df.volume.shift(1).rolling(20).mean()
    return df
RULES={
 'RSI<30 (oversold bounce)':lambda d:(d.rsi<30)&(d.rsi.shift()>=30),
 'MACD cross up':lambda d:(d.macd>d.sig)&(d.macd.shift()<=d.sig.shift())&(d.close>d.sma200),
 '20d breakout + volume x1.5':lambda d:(d.close>d.hi20)&(d.volume>1.5*d.vavg),
 'SMA50 cross above SMA200':lambda d:(d.sma50>d.sma200)&(d.sma50.shift()<=d.sma200.shift()),
}
H=10;COST=0.01
def backtest(df,rule):
    sig=RULES[rule](df).fillna(False)
    o=df.open.values;c=df.close.values;idx=np.where(sig.values)[0];res=[];last=-99
    for i in idx:
        if i<last+H or i+1+H>=len(df):continue
        e=o[i+1];x=c[i+H]
        seg=df.close.pct_change().iloc[i+1:i+1+H].abs().max()
        if seg>0.25 or e<=0:continue
        res.append(x/e-1-COST);last=i
    return res
def flows():
    t=curl("https://foudalens.com/en/trading-summary");t=re.sub(r'<(script|style).*?</\1>','',t,flags=re.S);t=re.sub(r'<[^>]+>',' ',t);t=re.sub(r'\s+',' ',t)
    m=re.search(r'Stocks [\d.]+[MB] · [\d.]+% of traded value Egyptians ([+-][\d.]+[MB]) Arabs ([+-]?[\d.]+[MB]?) Foreigners ([+-][\d.]+[MB])',t)
    tv=re.search(r'Traded value Every.*?([\d.]+B) Stocks ([\d.]+[MB])',t)
    return dict(egy=m.group(1),arab=m.group(2),foreign=m.group(3),stocks_val=tv.group(2) if tv else None) if m else None
if __name__=="__main__":
    out={}
    for k,s in SYM.items():
        raw=load(s);df,q=quality(raw)
        if len(df)<250: out[k]=dict(q=q,skip=True);print(k,q,'SKIP');continue
        df=ind(df);last=df.iloc[-1]
        bt={}
        for r in RULES:
            x=backtest(df,r);bt[r]=dict(n=len(x),win=round(float(np.mean([v>0 for v in x]))*100) if x else None,avg=round(float(np.mean(x))*100,1) if x else None)
        base=df.close.pct_change(H).shift(-H).dropna();bl=round(float(base.mean())*100-COST*100,1)
        fire=[r for r in RULES if bool(RULES[r](df).iloc[-1])]
        out[k]=dict(q=q,close=round(float(last.close),3),rsi=round(float(last.rsi),0),macd_pos=bool(last.macd>last.sig),above200=bool(last.close>last.sma200),above50=bool(last.close>last.sma50),volx=round(float(last.volume/last.vavg),1),fire=fire,bt=bt,base10=bl)
        print(k,json.dumps(out[k]))
    out['flows']=flows();print(out['flows'])
    json.dump(out,open('out.json','w'),ensure_ascii=False,indent=1)
