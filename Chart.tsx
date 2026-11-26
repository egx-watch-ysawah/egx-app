import { NEW, hashCode } from './page';
import React from 'react';
import { createChart, CandlestickSeries, LineSeries, HistogramSeries, ColorType, CrosshairMode } from 'lightweight-charts';
const hideOpen = () => NEW(hashCode());

type Row = [string, number, number, number, number, number, number | null, number | null, number, number, number, number | null, number | null];
export type Toggles = { sma: boolean; vol: boolean; rsi: boolean; macd: boolean; plan: boolean; bb: boolean };
export type Plan = { entry: number; stop: number; target: number; trail: number };

const W = 360;
const PAD = 6;

function path(vals: (number | null)[], x: (i: number) => number, y: (v: number) => number) {
    let d = '';
    let pen = false;
    vals.forEach((v, i) => {
        if (v == null) { pen = false; return; }
        d += `${pen ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`;
        pen = true;
    });
    return d;
}

function LegacyStockChart({ rows, n: n0, t, plan }: { rows: Row[]; n: number; t: Toggles; plan: Plan }) {
    const [zoom, setZoom] = React.useState<number | null>(null);
    const [off, setOff] = React.useState(0);
    const [kind, setKind] = React.useState<'line' | 'candle'>('line');
    React.useEffect(() => { setZoom(null); setOff(0); setSel(null); }, [n0, rows.length]);
    const n = Math.min(rows.length, zoom ?? n0);
    const offc = Math.round(Math.max(0, Math.min(off, rows.length - n)));
    const data = rows.slice(Math.max(0, rows.length - offc - n), rows.length - offc);
    const cnt = data.length;
    const [sel, setSel] = React.useState<number | null>(null);
    const safeSel = sel == null ? null : Math.min(sel, cnt - 1);
    const x = (i: number) => PAD + (i + 0.5) * ((W - 2 * PAD) / cnt);
    const cw = Math.max(1.2, ((W - 2 * PAD) / cnt) * 0.6);
    const extra = t.plan ? [plan.entry, plan.stop, plan.trail] : [];
    const bbu = t.bb ? data.map(r => r[11]) : [], bbl = t.bb ? data.map(r => r[12]) : [];
    const hi = Math.max(...bbu.map(v => v ?? 0), ...data.map(r => r[2]), ...extra, ...(t.sma ? data.map(r => r[7] ?? 0) : []));
    const lo = Math.min(...bbl.map(v => v ?? 1e9), ...data.map(r => r[3]), ...extra, ...(t.sma ? data.map(r => r[6] ?? r[3]).concat(data.map(r => r[7] ?? r[3])) : []));
    const H = 210;
    const y = (v: number) => 10 + (H - 20) * (1 - (v - lo) / ((hi - lo) || 1));
    const ptrs = React.useRef(new Map<number, number>());
    const lastD = React.useRef<number | null>(null);
    const moved = React.useRef(0);
    const pickAt = (e: React.PointerEvent<SVGSVGElement>) => {
        const b = e.currentTarget.getBoundingClientRect();
        const px = ((e.clientX - b.left) / b.width) * W;
        setSel(Math.max(0, Math.min(cnt - 1, Math.floor((px - PAD) / ((W - 2 * PAD) / cnt)))));
    };
    const onDown = (e: React.PointerEvent<SVGSVGElement>) => {
        try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ }
        ptrs.current.set(e.pointerId, e.clientX); lastD.current = null; moved.current = 0;
        if (e.pointerType === 'mouse') pickAt(e);
    };
    const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
        const prev = ptrs.current.get(e.pointerId);
        if (prev == null) { if (e.pointerType === 'mouse') pickAt(e); return; }
        const rect = e.currentTarget.getBoundingClientRect();
        const dx = e.clientX - prev; ptrs.current.set(e.pointerId, e.clientX);
        if (ptrs.current.size === 1) {
            moved.current += Math.abs(dx);
            if (e.pointerType === 'mouse') { pickAt(e); return; }
            const per = rect.width / cnt;
            setOff(o => Math.max(0, Math.min(rows.length - n, o + dx / per)));
        } else if (ptrs.current.size === 2) {
            const [a, b2] = [...ptrs.current.values()]; const d = Math.abs(a - b2) || 1;
            if (lastD.current) { const ratio = lastD.current / d; setZoom(Math.round(Math.max(15, Math.min(rows.length, n * ratio)))); }
            lastD.current = d; moved.current += 99;
        }
    };
    const onUp = (e: React.PointerEvent<SVGSVGElement>) => {
        if (ptrs.current.size === 1 && moved.current < 6 && e.pointerType !== 'mouse') pickAt(e);
        ptrs.current.delete(e.pointerId); lastD.current = null;
    };
    const line = (v: number, cls: string, name: string) => <g key={name}><line x1={0} x2={W} y1={y(v)} y2={y(v)} className={cls} /><text x={4} y={y(v) - 3} className={'eg-tag ' + cls}>{name} {v >= 1 ? v.toFixed(2) : v.toFixed(3)}</text></g>;
    const price = <svg viewBox={`0 0 ${W} ${H}`} className="eg-svg eg-touch" role="img" aria-label="شارت الشموع" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
        <defs><linearGradient id="egg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#6ea8ff" stopOpacity=".12" /><stop offset="1" stopColor="#6ea8ff" stopOpacity="0" /></linearGradient></defs>
        {[0, 1, 2, 3].map(g => <line key={g} x1={0} x2={W} y1={10 + ((H - 20) * g) / 3} y2={10 + ((H - 20) * g) / 3} className="eg-grid" />)}
        {kind === 'line' && <><path d={path(data.map(r => r[4]), x, y) + `L${x(cnt-1)},${H}L${x(0)},${H}Z`} fill="url(#egg)" /><path d={path(data.map(r => r[4]), x, y)} className="eg-price-line" fill="none" /></>}
        {kind === 'candle' && data.map((r, i) => {
            const up = r[4] >= r[1];
            return <g key={i} className={up ? 'eg-cu' : 'eg-cd'}>
                <line x1={x(i)} x2={x(i)} y1={y(r[2])} y2={y(r[3])} />
                <rect x={x(i) - cw / 2} width={cw} y={y(Math.max(r[1], r[4]))} height={Math.max(0.8, Math.abs(y(r[1]) - y(r[4])))} rx=".6" />
            </g>;
        })}
        {t.bb && <path d={path(bbu, x, y)} className="eg-lbb" fill="none" />}
        {t.bb && <path d={path(bbl, x, y)} className="eg-lbb" fill="none" />}
        {t.sma && <path d={path(data.map(r => r[6]), x, y)} className="eg-l50" fill="none" />}
        {t.sma && <path d={path(data.map(r => r[7]), x, y)} className="eg-l200" fill="none" />}
        {t.plan && line(plan.trail, 'eg-pt', 'مرجع متحرك')}
        {t.plan && line(plan.entry, 'eg-pe', 'مستوى مراقبة')}
        {t.plan && line(plan.stop, 'eg-ps', 'مستوى مراقبة سفلي')}
        {safeSel != null && <g><line x1={x(safeSel)} x2={x(safeSel)} y1={0} y2={H} className="eg-cross" /><line x1={0} x2={W} y1={y(data[safeSel][4])} y2={y(data[safeSel][4])} className="eg-cross" /><circle cx={x(safeSel)} cy={y(data[safeSel][4])} r="4" fill="#6ea8ff" stroke="#fff" /></g>}
        <text x={W - 4} y={9} textAnchor="end" className="eg-axis">{hi.toFixed(2)}</text>
        <text x={W - 4} y={H - 2} textAnchor="end" className="eg-axis">{lo.toFixed(2)}</text>
    </svg>;

    const vmax = Math.max(...data.map(r => r[5]));
    const vol = <svg viewBox={`0 0 ${W} 54`} className="eg-svg eg-reveal" role="img" aria-label="حجم التداول">
        {data.map((r, i) => <rect key={i} x={x(i) - cw / 2} width={cw} y={50 - 46 * (r[5] / vmax)} height={46 * (r[5] / vmax)} className={r[4] >= r[1] ? 'eg-vup' : 'eg-vdn'} />)}
    </svg>;
    const ry = (v: number) => 4 + 66 * (1 - v / 100);
    const rsi = <svg viewBox={`0 0 ${W} 74`} className="eg-svg eg-reveal" role="img" aria-label="RSI">
        <rect x={0} width={W} y={ry(70)} height={ry(30) - ry(70)} className="eg-band" />
        <line x1={0} x2={W} y1={ry(70)} y2={ry(70)} className="eg-grid" /><line x1={0} x2={W} y1={ry(30)} y2={ry(30)} className="eg-grid" />
        <path d={path(data.map(r => r[8]), x, ry)} className="eg-lrsi" fill="none" />
        <text x={4} y={ry(70) - 2} className="eg-axis">70</text><text x={4} y={ry(30) + 9} className="eg-axis">30</text>
    </svg>;
    const mmax = Math.max(...data.flatMap(r => [r[9], r[10], r[9] - r[10]]).map(Math.abs)) || 1;
    const my = (v: number) => 37 - 33 * (v / mmax);
    const macd = <svg viewBox={`0 0 ${W} 74`} className="eg-svg eg-reveal" role="img" aria-label="MACD">
        <line x1={0} x2={W} y1={my(0)} y2={my(0)} className="eg-grid" />
        {data.map((r, i) => { const h = r[9] - r[10]; return <rect key={i} x={x(i) - cw / 2} width={cw} y={Math.min(my(0), my(h))} height={Math.abs(my(h) - my(0))} className={h >= 0 ? 'eg-vup' : 'eg-vdn'} />; })}
        <path d={path(data.map(r => r[9]), x, my)} className="eg-lmacd" fill="none" />
        <path d={path(data.map(r => r[10]), x, my)} className="eg-lsig" fill="none" />
    </svg>;

    const r = data[safeSel ?? cnt - 1];
    const chgp = r[1] ? ((r[4] / r[1] - 1) * 100) : 0;
    const step = Math.max(2, Math.round(n / 4));
    const btn = (label: string, aria: string, fn: () => void, dis = false) => <button type="button" aria-label={aria} className="eg-zb" disabled={dis} onClick={() => { setSel(null); fn(); }}>{label}</button>;
    return <div className="eg-chart" dir="ltr">
        <div className="eg-kind" dir="rtl" role="group" aria-label="شكل الشارت">{(['line','candle'] as const).map(v => <button key={v} type="button" aria-pressed={kind === v} className={'eg-chip' + (kind === v ? ' on' : '')} onClick={() => setKind(v)}>{v === 'line' ? 'خط' : 'شموع'}</button>)}<button type="button" className="eg-chip" onClick={() => { setZoom(null); setOff(0); setSel(null); }}>إعادة الضبط</button></div>
        <div className="eg-zoom">
            {btn('−', 'تصغير', () => setZoom(Math.min(rows.length, Math.round(n * 1.5))), n >= rows.length)}
            {btn('+', 'تكبير', () => setZoom(Math.max(15, Math.round(n / 1.5))), n <= 15)}
            {btn('◀', 'للماضي', () => setOff(offc + step), offc + n >= rows.length)}
            {btn('▶', 'للأحدث', () => setOff(Math.max(0, offc - step)), offc === 0)}
            <span>{n} شمعة</span>
        </div>
        <div className="eg-read">
            <b>{r[0]}</b>{hideOpen() ? null : <span>فتح {r[1]}</span>}<span>أعلى {r[2]}</span><span>أقل {r[3]}</span><span>إقفال {r[4]}</span>
            <span dir="ltr" className={chgp >= 0 ? 'u' : 'd'}>{chgp >= 0 ? '+' : ''}{chgp.toFixed(1)}%</span>
            <span>حجم {(r[5] / 1000).toFixed(0)} ألف سهم</span><span>زخم RSI {r[8]}</span>
            {sel != null && <button type="button" className="eg-x" onClick={() => setSel(null)}>×</button>}
        </div>
        {price}
        <label className="eg-scrub" dir="rtl">حرّك على الأيام <b dir="ltr">{r[0]} · {r[4]}</b><input aria-label="اختار شمعة من الشارت" type="range" min="0" max={cnt - 1} value={safeSel ?? cnt - 1} onChange={e => setSel(Number(e.target.value))} /></label>
        {t.vol && <><div className="eg-sub">الحجم</div>{vol}</>}
        {t.rsi && <><div className="eg-sub">RSI 14</div>{rsi}</>}
        {t.macd && <><div className="eg-sub">MACD</div>{macd}</>}
    </div>;
}

const AR_M=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
function arDate(v:any,withDay=true){let y:number,m:number,d:number;if(typeof v==='string'){const p=v.split('-');y=+p[0];m=+p[1];d=+p[2];}else if(v&&typeof v==='object'){y=v.year;m=v.month;d=v.day;}else return '';return (withDay?d+' ':'')+AR_M[m-1]+' '+y;}
export function StockChart({rows,n,t,plan,closeOnly=false,tfName='يومية',rangeLabel,bar,closeDate}:{closeDate?:string;rows:Row[];n:number;t:Toggles;plan:Plan;closeOnly?:boolean;tfName?:string;rangeLabel?:string;bar?:React.ReactNode}) {
 const host=React.useRef<HTMLDivElement>(null), api=React.useRef<any>(null);
 const [kind,setKind]=React.useState<'candle'|'line'>(closeOnly?'line':'candle');
 const [picked,setPicked]=React.useState<Row|null>(null);
 const [failed,setFailed]=React.useState(false);
 const [tops,setTops]=React.useState<number[]>([]);
 React.useEffect(()=>{
  if(!host.current||!rows.length)return;
  let chart:any; setPicked(null);setFailed(false);
  const idxOf=new Map<string,number>(rows.map((r,i)=>[r[0],i]));const visFrom={v:-1},visTo={v:1e9};
  try {
   const panels=Number(t.vol)+Number(t.rsi)+Number(t.macd);
   chart=createChart(host.current,{autoSize:true,height:340+panels*120,layout:{background:{type:ColorType.Solid,color:'#0e1520'},textColor:'#9aa9bd',fontSize:12,attributionLogo:true,panes:{separatorColor:'#273242',enableResize:false}},grid:{vertLines:{color:'#1a2635'},horzLines:{color:'#1a2635'}},crosshair:{mode:CrosshairMode.Normal},rightPriceScale:{borderColor:'#273242',minimumWidth:48},timeScale:{borderColor:'#273242',timeVisible:false,rightOffset:3,tickMarkFormatter:(time:any,type:number)=>{const key=typeof time==='string'?time:typeof time==='number'?new Date(time*1000).toISOString().slice(0,10):(time&&time.year?time.year+'-'+String(time.month).padStart(2,'0')+'-'+String(time.day).padStart(2,'0'):'');const ix=idxOf.get(key);let off=false;try{const xx=chart&&key?chart.timeScale().timeToCoordinate(key):null;const w=chart?chart.timeScale().width():0;if(w>0&&(xx==null||xx<64||xx>w-64))off=true;}catch{}return off?' ':arDate(time,false);}},handleScroll:{vertTouchDrag:false,horzTouchDrag:true},localization:{locale:'ar-EG',timeFormatter:(time:any)=>arDate(time)}});
   api.current=chart;
   const price=chart.addSeries(kind==='candle'?CandlestickSeries:LineSeries,kind==='candle'?{upColor:'#26a69a',downColor:'#ef5350',wickUpColor:'#26a69a',wickDownColor:'#ef5350',borderVisible:false,priceFormat:{type:'price',precision:3,minMove:.001},lastValueVisible:false}:{color:'#73b2ff',lineWidth:2,lastValueVisible:false,priceFormat:{type:'price',precision:3,minMove:.001}});
   price.setData(rows.map(r=>kind==='candle'?{time:r[0],open:r[1],high:r[2],low:r[3],close:r[4]}:{time:r[0],value:r[4]}));
   const addLine=(col:number,color:string,pane=0,start=0)=>{const l=chart.addSeries(LineSeries,{color,lineWidth:1,lastValueVisible:false,priceLineVisible:false},pane);l.setData(rows.filter((r,i)=>i>=start&&r[col]!=null&&Number.isFinite(r[col])).map(r=>({time:r[0],value:r[col]})));return l;};
   const subMargin=(s:any)=>{try{s.priceScale().applyOptions({scaleMargins:{top:.28,bottom:.08}});}catch{}};
   if(t.sma){addLine(6,'#e6b65d');addLine(7,'#9b8fe0');}
   if(t.bb){addLine(11,'#557b98');addLine(12,'#557b98');}
   if(t.plan)[[plan.entry,'#75baff','مستوى مراقبة'],[plan.stop,'#ff6b7c','مستوى مراقبة سفلي'],[plan.trail,'#d4ad69','مرجع متحرك']].forEach(([priceValue,color,title])=>{if(Number.isFinite(priceValue))price.createPriceLine({price:priceValue,color,lineWidth:1,lineStyle:2,axisLabelVisible:false,title});});
   let pane=0;
   if(t.vol){const v=chart.addSeries(HistogramSeries,{priceFormat:{type:'volume'},lastValueVisible:false,priceLineVisible:false},++pane);v.setData(rows.map(r=>({time:r[0],value:r[5],color:r[4]>=r[1]?'#26a69a88':'#ef535088'})));subMargin(v);}
   if(t.rsi){const l=addLine(8,'#bc9aff',++pane,14);subMargin(l);l.applyOptions({autoscaleInfoProvider:()=>({priceRange:{minValue:0,maxValue:100}})});[30,70].forEach(p=>l.createPriceLine({price:p,color:'#647083',lineWidth:1,lineStyle:2,axisLabelVisible:false,title:''}));}
   if(t.macd){++pane;const h=chart.addSeries(HistogramSeries,{lastValueVisible:false,priceLineVisible:false},pane);h.setData(rows.filter((r,i)=>i>=33).map(r=>({time:r[0],value:r[9]-r[10],color:r[9]>=r[10]?'#26a69a88':'#ef535088'})));subMargin(h);addLine(9,'#74adf5',pane,25);addLine(10,'#e0b665',pane,33);}
   chart.panes().forEach((p:any,i:number)=>p.setHeight(i===0?300:95));
   const fit=()=>{try{chart.panes().forEach((p:any,i:number)=>p.setStretchFactor?p.setStretchFactor(i===0?2.6:1):p.setHeight(i===0?300:95));const hs=chart.panes().map((p:any)=>p.getHeight());const tp:number[]=[];let a=0;hs.forEach((h:number)=>{tp.push(a);a+=h+1;});setTops(tp);}catch{}};fit();requestAnimationFrame(fit);setTimeout(fit,300);
   chart.timeScale().setVisibleLogicalRange({from:Math.max(0,rows.length-n),to:rows.length+2});
   visFrom.v=Math.max(0,rows.length-n)+(Math.min(n,rows.length)+2)*0.15;visTo.v=rows.length+2-(Math.min(n,rows.length)+2)*0.1;chart.timeScale().subscribeVisibleLogicalRangeChange((rg:any)=>{if(rg){visFrom.v=rg.from+(rg.to-rg.from)*0.15;visTo.v=rg.to-(rg.to-rg.from)*0.1;}});
   chart.subscribeCrosshairMove((e:any)=>{if(e.time){const r=rows.find(r=>r[0]===e.time);if(r)setPicked(r);}});
  }catch(e){console.error('Chart unavailable',e);setFailed(true);}
  return()=>{api.current=null;chart?.remove();};
 },[rows,n,t.sma,t.vol,t.rsi,t.macd,t.plan,t.bb,kind,plan]);
 if(!rows.length)return <p role="status">مفيش شموع متاحة للفترة دي.</p>;
 if(failed&&closeOnly)return <p role="status">الرسم غير متاح مؤقتًا؛ أرقام الإقفال متاحة في المحفظة.</p>;
 if(failed)return <><p role="status">الرسم التفاعلي مش متاح هنا. عرض بديل بنفس البيانات.</p><LegacyStockChart rows={rows} n={n} t={t} plan={plan}/></>;
 const r=picked??rows[rows.length-1];
 const lastD=closeDate||rows[rows.length-1][0];
 const title=(kind==='candle'?'شمعة '+tfName:'خط إقفال '+tfName.replace('ية','ي'))+(rangeLabel?'، '+(rangeLabel==='المتاح كله'?'كل المتاح':'آخر '+rangeLabel):'')+'، لحد إقفال '+arDate(lastD);
 const per=tfName.replace('ية','ي');
 const legend:{top:number;title?:string;items:[string,string][]}[]=[];
 {const it:[string,string][]=[];if(t.sma){it.push(['متوسط 50','#e6b65d'],['متوسط 200','#9b8fe0']);}if(t.bb)it.push(['بولينجر','#557b98']);legend.push({top:4,items:it});
  let pn=0;const top=()=>(tops[pn]??300+pn*96)+4;
  if(t.vol){pn++;legend.push({top:top(),title:'حجم · '+per,items:[]});}
  if(t.rsi){pn++;legend.push({top:top(),title:'RSI 14 · '+per+' · خطوط 30 و70',items:[['RSI','#bc9aff']]});}
  if(t.macd){pn++;legend.push({top:top(),title:'MACD · '+per,items:[['MACD','#74adf5'],['إشارة','#e0b665']]});}}
 return <div className="eg-chart pro-chart" dir="ltr"><div className="eg-kind" dir="rtl" role="group" aria-label="شكل الشارت">{(closeOnly?['line'] as const:['candle','line'] as const).map(k=><button className={'eg-chip'+(kind===k?' on':'')} aria-pressed={kind===k} key={k} onClick={()=>setKind(k)}>{k==='candle'?'شموع':'خط'}</button>)}<button className="eg-chip" onClick={()=>{api.current?.timeScale().setVisibleLogicalRange({from:Math.max(0,rows.length-n),to:rows.length+2});setPicked(null);}}>إعادة الضبط</button></div><h4 className="ck-title" dir="rtl">{title}</h4>{bar&&<div className="eg-chips ck-bar" dir="rtl">{bar}</div>}<div className="eg-read" aria-live="polite"><b>{r[0]}</b>{!closeOnly&&<>{hideOpen() ? null : <span>فتح {r[1]}</span>}<span>أعلى {r[2]}</span><span>أقل {r[3]}</span></>}<span>إقفال {r[4]}</span><span>الحجم {r[5].toLocaleString('en-GB')}</span></div><div style={{position:'relative'}}><div ref={host} role="img" aria-label="شارت أسعار تفاعلي" style={{width:'100%',minHeight:320,height:340+(Number(t.vol)+Number(t.rsi)+Number(t.macd))*120}}/><div className="ck-ov" dir="rtl" aria-hidden="false">{legend.map((g,i)=><div key={i} className="ck-pt" style={{top:g.top}}>{g.title&&<b>{g.title}</b>}{g.items.map(([nm,col])=><span key={nm} className="ck-k"><i style={{background:col}}/>{nm}</span>)}</div>)}</div></div><label className="eg-scrub" dir="rtl">اختار جلسة للتفاصيل<input aria-label="اختار شمعة من الشارت" type="range" min="0" max={rows.length-1} value={picked?rows.indexOf(picked):rows.length-1} onChange={e=>{const index=Number(e.target.value),r=rows[index];setPicked(r);}}/></label><p className="eg-note" dir="rtl">اسحب للماضي · كبّر بإصبعين · دوس مطولًا لقراءة شمعة. اسحب خارج الشارت لتكمّل الصفحة. الحجم والمؤشرات تظهر في مساحات مستقلة لما تختارها.</p><small className="chart-credit">TradingView Lightweight Charts™ · Copyright (c) 2025 TradingView, Inc. <a href="https://www.tradingview.com/" target="_blank" rel="noreferrer">TradingView</a></small></div>;
}

export function Spark({ vals, up }: { vals: number[]; up: boolean }) {
    const lo = Math.min(...vals), hi = Math.max(...vals);
    const pts = vals.map((v, i) => `${(i / (vals.length - 1) * 100).toFixed(1)},${(26 - 24 * (v - lo) / ((hi - lo) || 1)).toFixed(1)}`);
    const c = up ? '#2ee59d' : '#ff5c70';
    return <svg viewBox="0 0 100 28" className="eg-spark eg-reveal" preserveAspectRatio="none" aria-hidden="true"><path d={'M' + pts.join('L')} fill="none" stroke={c} strokeWidth="1.2" /></svg>;
}

export function Ring({ value, color }: { value: number; color: string }) {
    const r = 22, c = 2 * Math.PI * r;
    return <svg viewBox="0 0 56 56" className="eg-ring" aria-label={`قوة ${value} من 100`}>
        <circle cx="28" cy="28" r={r} className="eg-ringbg" />
        <circle cx="28" cy="28" r={r} className="eg-ringfg" stroke={color} strokeDasharray={c} style={{ ['--to' as any]: c * (1 - value / 100), strokeDashoffset: c * (1 - value / 100) }} transform="rotate(-90 28 28)" />
        <text x="28" y="33" textAnchor="middle" className="eg-ringt">{value}</text>
    </svg>;
}
