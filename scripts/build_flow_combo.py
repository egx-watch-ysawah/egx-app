#!/usr/bin/env python3
"""build_flow_combo.py - daily flow-state history, one small file per stock.
Rules identical to the approved pilot (same A/B/C as flow_signal.py, exact-combination unit, events = more than 5 sessions after the previous
event of the same combination, 25% single-day filter on forward windows, no pooling, N always shown).
Usage: build_flow_combo.py HIST_DIR OUT_DIR SESSION
  HIST_DIR/chunk_0.json = {sym: [OHLCV rows]} (from fetch_flow_hist.py); writes OUT_DIR/flow_combo_<SYM>.json (flat names, same as the UI loads) and OUT_DIR/flow_combo_index.json.
  A stock whose last bar is not SESSION, or with fewer than 250 rows, is SKIPPED: its old file stays and the name is printed. Exit 1 only if no stock can be built. Files go to a temp dir first, then move."""
import json,sys,os,shutil,datetime
import pandas as pd,numpy as np

DATAGAPS={('2002-10-08','2002-10-24')}  # market-wide gap with no closure evidence
CLOSURES={('2011-01-27','2011-03-23')}  # documented market closure; any other market-wide gap is labelled a data gap
def is_closure(a,b):
    # the market-wide gap 2011-01-27..2011-03-23, or a gap of one stock that starts on 2011-01-27 and ends on or after 2011-03-23
    return str(a)=='2011-01-27' and str(b)>='2011-03-23'
LISTING={}  # sym -> verified first trading day (YYYY-MM-DD); filled from flow_listing_dates.json next to this script or in cwd

def market_gaps(H):
    U=sorted({r['date'][:10] for v in H.values() for r in v if float(r.get('volume') or 0)>0})
    ds=[datetime.date.fromisoformat(k) for k in U]
    return [(ds[i-1],ds[i]) for i in range(1,len(ds)) if (ds[i]-ds[i-1]).days>10]

def compute(SYM,rows,srcnote,MG=()):
    df=pd.DataFrame(rows)[['date','open','high','low','close','volume']];df['date']=pd.to_datetime(df['date'])
    df=df.sort_values('date').drop_duplicates('date').set_index('date')
    for c in df.columns:df[c]=pd.to_numeric(df[c],errors='coerce')
    df=df.dropna();df=df[(df.volume>0)&(df.low<=df[['open','close']].min(axis=1))&(df[['open','close']].max(axis=1)<=df.high)&(df.close>0)]
    v=df.close*df.volume;med60=v.shift(1).rolling(60).median();A=v>2*med60
    B=((df.close-df.low)/(df.high-df.low).replace(0,np.nan))>=(2/3)
    up=df.close>df.close.shift(1);us=(df.volume*up).rolling(10).sum()/df.volume.rolling(10).sum()
    sma20=df.close.rolling(20).mean();C=(us>0.6)&(df.close>sma20)
    valid=(med60.notna()&sma20.notna()&us.notna()).values
    a,b_,c_=A.values,B.values,C.values;n=len(df);cl=df.close.values
    chg=np.abs(np.diff(cl)/cl[:-1]);glitch=np.zeros(n,bool);glitch[1:]=chg>0.25
    KEY=lambda x,y,z:('A' if x else '')+('B' if y else '')+('C' if z else '')
    combo=[KEY(a[i],b_[i],c_[i]) if valid[i] else None for i in range(n)]
    dts=[x.date() for x in df.index];dd_=np.zeros(n,int)
    for j in range(1,n):
        if any(dts[j-1]<=a and dts[j]>=b for a,b in MG):dd_[j]=99;closure=np.zeros(n,bool)
    H=(5,10,20);fwd={};ok={};gapx={}
    for k in H:
        f=np.full(n,np.nan);f[:-k]=cl[k:]/cl[:-k]-1;w=np.zeros(n,bool);g=np.zeros(n,bool)
        for i in range(n-k):
            g[i]=dd_[i+1:i+k+1].max()>10
            w[i]=not glitch[i+1:i+k+1].any() and not g[i]
        fwd[k]=f;ok[k]=~np.isnan(f)&w;gapx[k]=g
    base={k:fwd[k][ok[k]&valid] for k in H}
    ev={};raw={}
    last={}
    for i,k in enumerate(combo):
        if not k:continue
        raw[k]=raw.get(k,0)+1
        if i-last.get(k,-99)>5:ev.setdefault(k,[]).append(i);last[k]=i
    def stats(idx,k):
        s=np.array([fwd[k][i] for i in idx if ok[k][i]])
        r=dict(n=int(len(s)),up=int((s>0).sum()),down=int((s<=0).sum()))
        if len(s):r.update(win=round(100*float((s>0).mean()),1),mean=round(100*float(s.mean()),2),median=round(100*float(np.median(s)),2),best=round(100*float(s.max()),1),worst=round(100*float(s.min()),1))
        return r
    cur=combo[-1]
    out={'symbol':SYM,'pilot':True,'generated_at':datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=2))).isoformat(timespec='seconds'),
     'source':'startamarkets.com/api/v1/egx/history/<SYM> daily OHLCV (prices as given by Starta) - '+srcnote,
     'history':{'firstDayIsListing':bool(LISTING.get(SYM) and LISTING[SYM]==str(df.index[0].date())),'listingDate':LISTING.get(SYM),'startLabelAr':('من أول يوم تداول للسهم' if (LISTING.get(SYM) and LISTING[SYM]==str(df.index[0].date())) else 'من أول يوم في البيانات المتاحة'),'firstDate':str(df.index[0].date()),'statsFrom':str(df.index[60].date()),'warmupSessions':60,'from':str(df.index[0].date()),'to':str(df.index[-1].date()),'sessions':int(n)},
     'rule':{'A':'traded value > 2x median of previous 60 sessions','B':'close in top third of day range','C':'10-session up-day volume share > 60% and close > SMA20',
      'unit':'exact combination of met conditions (A,B,C: 7 non-zero combos); zero met = no calculation',
      'events':'a day is an event for a combination only if more than 5 sessions passed since the previous event of the SAME combination. n = events; rawDays = all days in that state',
      'closureFilter':'forward windows (5/10/20 sessions) that contain a stretch of more than 10 calendar days without bars are excluded from the return statistics and listed in excluded20 with the reason. market closure = the window contains the market-wide gap 2011-01-27 to 2011-03-23, or a gap of one stock that starts on 2011-01-27 and ends on or after 2011-03-23 (documented closure plus the days that stock did not trade after reopening). data gap = it contains exactly the market-wide gap 2002-10-08 to 2002-10-24 (فجوة بيانات, no evidence of a closure). stock gap = any other stretch where this stock own bars skip more than 10 days','glitchFilter':'forward windows containing a |daily move| > 25% day are excluded from the return statistics',
      'noPooling':'statistics come only from this stock\'s own history; no pooled fallback; n is always shown, also 0 and 1'},
     'baseline':{f'h{k}':dict(n=int(len(base[k])),win=round(100*float((base[k]>0).mean()),1),mean=round(100*float(base[k].mean()),2)) for k in H},
     'today':{'date':str(df.index[-1].date()),'valid':bool(valid[-1]),'state':cur,'A':bool(a[-1]),'B':bool(b_[-1]),'C':bool(c_[-1]),'noCalc':(cur=='' or cur is None),
       'volXmed60':round(float(v.iloc[-1]/med60.iloc[-1]),2) if pd.notna(med60.iloc[-1]) else None,'closePosInRange':round(float((df.close.iloc[-1]-df.low.iloc[-1])/(df.high.iloc[-1]-df.low.iloc[-1])),2) if df.high.iloc[-1]>df.low.iloc[-1] else None,'upShare10':round(float(us.iloc[-1]),2) if pd.notna(us.iloc[-1]) else None},
     'limitsAr':[],'combos':{}}
    for k in ['A','B','C','AB','AC','BC','ABC']:
        idx=ev.get(k,[]);e=dict(state=k,n=len(idx),rawDays=raw.get(k,0),dates=[str(df.index[i].date()) for i in idx])
        for h in H:e[f'h{h}']=stats(idx,h)
        e['open']=[str(df.index[i].date()) for i in idx if i+20>=n]  # events whose 20-session window is not finished yet
        e['excluded20']=[dict(date=str(df.index[i].date()),reason=(('market closure (documented, 2011-01-27 to 2011-03-23)' if any(is_closure(dts[j-1],dts[j]) for j in range(i+1,i+21)) else ('data gap (market-wide, 2002-10-08 to 2002-10-24, no closure evidence)' if any((str(dts[j-1]),str(dts[j])) in DATAGAPS for j in range(i+1,i+21)) else 'stock gap (this stock has no bars for over 10 days inside the window)')) if gapx[20][i] else '25% single-day move inside the 20 sessions')) for i in idx if i+20<n and not ok[20][i]]  # never called open
        e['events20']=[{'date':str(df.index[i].date()),'ret20':round(100*float(fwd[20][i]),1)} for i in idx if ok[20][i]][-10:]
        out['combos'][k]=e

    gl=[(str(df.index[i-1].date()),str(df.index[i].date())) for i in range(1,n) if dd_[i]>10]  # market-wide closures crossed by this stock's bars
    out['closures']=[dict(from_=a,to=b,kind=('market closure' if is_closure(datetime.date.fromisoformat(a),datetime.date.fromisoformat(b)) else ('data gap' if (a,b) in DATAGAPS else 'stock gap'))) for a,b in gl]
    rs=[x['reason'] for e in out['combos'].values() for x in e['excluded20']]
    L=[]
    if any(r.startswith('market closure') for r in rs):L.append('استبعدنا حالات حصلت قبل إغلاق السوق في يناير 2011')
    if any(r.startswith('data gap') for r in rs):L.append('استبعدنا حالات حصلت قبل فجوة في البيانات في أكتوبر 2002')
    if any(r.startswith('stock gap') for r in rs):L.append('استبعدنا حالات فيها فترة طويلة من غير بيانات للسهم نفسه')
    out['limitsAr']=L
    return out

if __name__=='__main__':
    hist,outdir,session=sys.argv[1:4]
    for p in (os.path.join(os.path.dirname(os.path.abspath(__file__)),'flow_listing_dates.json'),'flow_listing_dates.json'):
        if os.path.exists(p):LISTING.update({k:v for k,v in json.load(open(p)).items() if not k.startswith('_')});break
    H=json.load(open(os.path.join(hist,'chunk_0.json')))
    MG=market_gaps(H);print('market-wide closures:',[(str(a),str(b)) for a,b in MG])
    tmp=os.path.abspath(outdir).rstrip('/')+'.combo_tmp';shutil.rmtree(tmp,ignore_errors=True);os.makedirs(tmp)
    idx={};bad=[]
    for sym,rows in sorted(H.items()):
        try:
            o=compute(sym,rows,'full Starta history (flow_hist cache), as given by Starta',MG)
            if o['history']['to']!=session or o['history']['sessions']<250:raise ValueError('last bar %s sessions %s'%(o['history']['to'],o['history']['sessions']))
            json.dump(o,open(os.path.join(tmp,'flow_combo_'+sym+'.json'),'w'),ensure_ascii=False,separators=(',',':'))
            idx[sym]=dict(state=o['today']['state'],n=(o['combos'][o['today']['state']]['n'] if o['today']['state'] else None),sessions=o['history']['sessions'],first=o['history']['firstDate'])
        except Exception as e:
            bad.append((sym,str(e)))
    if bad:print('SKIPPED %d stock(s), old file kept (shows stale): %s'%(len(bad),'; '.join('%s (%s)'%b for b in bad)))
    if not idx:
        print('FAIL: no stock could be built');shutil.rmtree(tmp,ignore_errors=True);sys.exit(1)
    json.dump({'session':session,'generated_at':datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=2))).isoformat(timespec='seconds'),'stocks':idx,'skipped':[b[0] for b in bad]},open(os.path.join(tmp,'flow_combo_index.json'),'w'),ensure_ascii=False,indent=1)
    os.makedirs(outdir,exist_ok=True)
    for fn in os.listdir(tmp):os.replace(os.path.join(tmp,fn),os.path.join(outdir,fn))
    shutil.rmtree(tmp,ignore_errors=True)
    print('wrote',len(idx),'stocks to',outdir)
