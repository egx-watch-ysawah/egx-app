"""Dated 60-session OHLCV window. Do not mix it with unverified older candles."""
import datetime,json,re,urllib.request
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
def parse_history(html):
    bars=[]
    for tr in re.findall(r'<tr[^>]*>(.*?)</tr>',html,re.S):
        cells=[re.sub(r'<[^>]+>','',c).strip() for c in re.findall(r'<t[dh][^>]*>(.*?)</t[dh]>',tr,re.S)]
        if len(cells)!=6 or not re.fullmatch(r'\d{4}-\d{2}-\d{2}',cells[0]):continue
        day=cells[0];datetime.date.fromisoformat(day)
        vals=[float(c.replace(',','')) for c in cells[1:]]
        o,h,l,c,v=vals
        if not (0<l<=min(o,c)<=max(o,c)<=h and v>0):raise ValueError('Invalid OHLCV')
        if completed_date(day):bars.append([day,o,h,l,c,int(v)])
    bars.sort()
    if len(bars)<50 or len({r[0] for r in bars})!=len(bars):raise ValueError('Short or duplicate history')
    return bars

def make_stock(k,bars):
    p=bars[-1][4];prior=bars[-21:-1];vavg=sum(r[5] for r in prior)/20
    return dict(name=NAMES[k],ok=False,partial=True,windowOnly=True,date=bars[-1][0],close=p,bars=bars,volx=round(bars[-1][5]/vavg,2),historyCount=len(bars),source=SOURCES[k],sourceName='Starta Markets',chg5=round((p/bars[-6][4]-1)*100,1),chg20=round((p/bars[-21][4]-1)*100,1))

def main():
    try:previous=json.loads(Path('data.json').read_text())
    except Exception:previous={'stocks':{}}
    now=datetime.datetime.now(ZoneInfo('Africa/Cairo'))
    out=dict(asof=now.date().isoformat(),generated_at=now.isoformat(),stocks={},refresh_errors={},flows=None)
    for k,url in SOURCES.items():
        try:
            req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'})
            html=urllib.request.urlopen(req,timeout=25).read().decode()
            stock=make_stock(k,parse_history(html));old=previous.get('stocks',{}).get(k,{})
            if old.get('windowOnly') and old.get('date','')>stock['date']:raise ValueError('Date regressed')
            out['stocks'][k]=stock
        except Exception as error:
            old=previous.get('stocks',{}).get(k,{})
            if not old.get('windowOnly'):raise
            out['stocks'][k]=old;out['refresh_errors'][k]=type(error).__name__
        print(k,out['stocks'][k]['date'],out['stocks'][k]['close'])
    payload=json.dumps(out,ensure_ascii=False,separators=(',',':'),allow_nan=False)
    Path('data.next.json').write_text(payload);Path('data.next.json').replace('data.json')
if __name__=='__main__':main()
