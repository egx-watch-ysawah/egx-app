import React, { useEffect, useState } from 'react';
import { OthersList } from './others';
import { GoldTab, goldOn } from './gold/gold';
import { FileCard, NavLink, Link, Route, Routes, useLocation } from './shim';
import { DATA } from './data';import { V7Card } from './v7';
import { StockGuide, OnTab } from './guide';
import { StockChart, Spark, Ring } from './Chart';
import { rows as mkRows, resample, RANGES, TF_AR, TF } from './indic';
import { Ex, X } from './explain';
import { HomeBoard } from './homeboard';
import { IndexList, IdxStock, PageSwitch } from './idx';
import { TeamBlock, Use, Glossary } from './scen';
import { tdA, tdW, inSessionNow } from './feed';
import { NewsBlock } from './news';
import { FinVal6 } from './fv6';
import { TopWarn } from './topwarn';
import { AllStocks } from './unavail';


import { Det, ENCRYPTED_PORTFOLIO, Evidence, FinancialStudy, KEYS, L, PORTFOLIO_KEY, Plan3, Price, RULE_AR, Short, fmt, invalidCandles, num, pc, reason, records, verdict, w20, why } from './shared';
import { Home } from './screen_home';
import { MyPosition, Stock } from './screen_stock';
import { About, Info, Market } from './screen_info';
import { App } from './App';
export function parsePortfolio(x:any) {
    if(x.version!==1||!Array.isArray(x.holdings)||!x.holdings.length||x.holdings.length>100)throw Error('صيغة الملف مش مدعومة.');
    const seen=new Set();
    const rows=x.holdings.map((h:any)=>{
        if(!KEYS.includes(h.symbol)||seen.has(h.symbol)||!Number.isFinite(h.weight)||h.weight<0||h.weight>100||!(h.averageCost===null||(Number.isFinite(h.averageCost)&&h.averageCost>0)))throw Error('راجع رموز الأسهم والأوزان ومتوسطات الشراء في الملف.');
        seen.add(h.symbol);if(h.quantity!==undefined&&h.quantity!==null&&(!Number.isFinite(h.quantity)||h.quantity<=0))throw Error('راجع الكميات.');
        return {symbol:h.symbol,weight:h.weight,averageCost:h.averageCost,quantity:h.quantity??null};
    });
    if(Math.abs(rows.reduce((a:number,h:any)=>a+h.weight,0)-100)>.1)throw Error('مجموع الأوزان لازم يكون 100% تقريبًا.');
    return rows;
}
// Fragment setup never uses a query string or a network request.
let setupMessage = '';
export function consumeSetupFragment() {
    const hash=window.location.hash;
    if(!hash.startsWith('#/portfolio?setup='))return '';
    const encoded=hash.slice('#/portfolio?setup='.length);
    window.history.replaceState(null,'',window.location.pathname+window.location.search+'#/portfolio');
    try {
        if(encoded.length>15000)throw Error();
        const raw=atob(encoded.replace(/-/g,'+').replace(/_/g,'/'));
        const rows=parsePortfolio(JSON.parse(raw));
        localStorage.setItem(PORTFOLIO_KEY,JSON.stringify({version:1,holdings:rows}));
        return 'تم إعداد المحفظة على المتصفح ده من الرابط. الرابط الأصلي فيه بياناتك، متشاركوش.';
    } catch { return 'مقدرناش نحفظ بيانات رابط الإعداد. ممكن المتصفح مانع التخزين أو الرابط ناقص. جرّب لصق رابط الإعداد كاملًا في الخانة اللي تحت.'; }
}
setupMessage=consumeSetupFragment() || '';
window.addEventListener('hashchange',()=>{const result=consumeSetupFragment();if(result){setupMessage=result;window.dispatchEvent(new Event('egx-portfolio-imported'));}});
export function calendarAge(date:unknown,now=new Date()) {
    if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date))return null;
    const t=Date.parse(date+'T00:00:00Z');
    if(!Number.isFinite(t)||new Date(t).toISOString().slice(0,10)!==date)return null;
    const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Cairo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
    const v=(type:string)=>day.find(p=>p.type===type)!.value;
    return Math.round((Date.parse(v('year')+'-'+v('month')+'-'+v('day')+'T00:00:00Z')-t)/86400000);
}
export function DataAge({date}:{date:any}) {
    const age=calendarAge(date);
    return <p className="data-age" role="note">{age===null?'تاريخ الإقفال غير متاح؛ حداثة البيانات غير معروفة.':age<0?'تاريخ الإقفال بعد تاريخ جهازك؛ راجع ساعة الجهاز والمصدر.':<>عمر الإقفال <L>{age}</L> يوم تقويمي حسب توقيت القاهرة. {age>3?'البيانات أقدم من 3 أيام؛ قارن التاريخ بالمصدر قبل الاعتماد عليها.':'مش سعر مباشر، ومش تأكيد إنه أحدث جلسة.'}</>} أيام تقويمية، مش جلسات فائتة. العطلات غير متحققة.</p>;
}
export function averagePosition(s:any,n:number) {
    if(!Array.isArray(s.bars)||s.bars.length<n)return s.partial?'المتاح أقل من '+n:'غير متاح';
    const closes=s.bars.slice(-n).map((r:any)=>r[4]);
    if(!Number.isFinite(s.close)||closes.some((v:any)=>!Number.isFinite(v)||v<=0))return 'غير متاح';
    const avg=closes.reduce((a:number,b:number)=>a+b,0)/n;
    return Math.abs(s.close-avg)<1e-8?'يساوي':s.close>avg?'فوق':'تحت';
}
export function PortfolioVisual({holdings}:{holdings:any[]}) {
    const [selected,setSelected]=useState<string|null>(null);
    return <section className="pv-board" aria-label="لوحة المحفظة"><div className="pv-title"><h3>محفظتك في لقطة</h3><span>إقفالات يومية · مش مباشر</span></div><p className="pv-label">الرسوم: آخر 50 جلسة · النسبة: تغيّر 5 جلسات</p><div className="pv-grid">{[...holdings].sort((a,b)=>b.weight-a.weight).map(h=>{const s=DATA.stocks[h.symbol],bars=s.bars||[],change=s.chg5;return <button type="button" key={h.symbol} className={'pv-card '+(selected===h.symbol?'pv-active':'')} onClick={()=>setSelected(selected===h.symbol?null:h.symbol)} aria-expanded={selected===h.symbol}><div className="pv-top"><b dir="ltr">{h.symbol}</b><span>{h.weight.toFixed(1)}%<small> وزن اللقطة</small></span></div><div className="pv-price"><b dir="ltr">{fmt(s.close)}</b><small>ج.م</small><span className={change>=0?'pv-up':'pv-down'} dir="ltr">{change>=0?'↗':'↘'} {Number.isFinite(change)?pc(change):'—'}</span></div><div className="pv-spark">{bars.length>1?<Spark vals={bars.slice(-50).map((r:any)=>r[4])} up={change>=0}/>:<small>تاريخ قصير</small>}</div><div className="pv-foot"><span>{s.partial?'نافذة جزئية':averagePosition(s,50)==='فوق'?'فوق متوسط 50':'تحت متوسط 50'}</span><small dir="ltr">{s.date||'—'}</small></div></button>;})}</div>{selected&&(()=>{const s=DATA.stocks[selected];return <div className="pv-expanded"><b><L>{selected}</L> · مؤشرات وصفية</b><Link className="desk-open" to={"/"+selected.toLowerCase()}>افتح صفحة السهم والشارت ←</Link><div className="holding-signals"><div><small>السعر / متوسط 50</small><b>{averagePosition(s,50)}</b></div><div><small>السعر / متوسط 200</small><b>{averagePosition(s,200)}</b></div><div><small>الحجم / السابق 20</small><b>{Number.isFinite(s.volx)?Math.round(s.volx*100)+'% من المعتاد':'غير متاح'}</b></div><div><small>أداء 5 جلسات</small><b dir="ltr">{Number.isFinite(s.chg5)?pc(s.chg5):'غير متاح'}</b></div></div><button type="button" className="eg-chip" onClick={()=>{const el=document.getElementById('held-'+selected);el?.scrollIntoView({block:'start'});el?.focus({preventScroll:true});}}>التفاصيل والتكلفة ←</button><Det title="يعني إيه الحجم من المعتاد؟"><p className="eg-note">بنقارن عدد أسهم آخر جلسة بمتوسط الـ20 جلسة اللي قبلها. <L>30%</L> من المعتاد، يعني حوالي التلت. <L>50%</L> يعني النص، و<L>20%</L> يعني الخُمس. ده نشاط تداول أقل، مش دليل لوحده على اهتمام الناس أو اتجاه السعر. الأرقام تخص تاريخ الإقفال، مش النهارده مباشر.</p></Det></div>;})()}</section>;
}
export function HoldingComparison({holdings}:{holdings:any[]}) {
    return <section className="portfolio-overview" aria-label="مقارنة الاتجاه" id="holding-comparison" tabIndex={-1}><h3>الاتجاه في نظرة</h3><p className="eg-note">السعر فين من متوسطه؟ مقارنة وصفية، مش ترتيب أفضلية. مرتبة بالرمز. اضغط الرمز لفتح تفاصيله.</p><table className="holding-compare"><thead><tr><th>السهم / الإقفال</th><th>متوسط<br/>50 جلسة</th><th>متوسط<br/>200 جلسة</th><th>الحجم<br/>× المعتاد</th></tr></thead><tbody>{[...holdings].sort((a,b)=>a.symbol.localeCompare(b.symbol)).map(h=>{const s=DATA.stocks[h.symbol];const age=calendarAge(s.date);return <tr key={h.symbol}><th scope="row"><button type="button" onClick={()=>{const el=document.getElementById('held-'+h.symbol);el?.scrollIntoView({block:'start'});el?.focus({preventScroll:true});}}><L>{h.symbol}</L></button><small><L>{s.date||'غير متاح'}</L></small>{(age===null||age<0||age>3)&&<small>راجع التاريخ</small>}</th><td>{averagePosition(s,50)}</td><td>{averagePosition(s,200)}</td><td>{(s.ok||s.partial)&&s.bars?.length>=21&&Number.isFinite(s.volx)?<L>{Math.round(s.volx*100)}%</L>:'غير متاح'}</td></tr>;})}</tbody></table><p className="eg-note">كل سهم مقارن بمتوسطاته هو، مش بسهم تاني. الحجم مقارنة بمتوسط 20 جلسة سابقة للسهم نفسه. فوق أو تحت مش تقييم لجودة الشركة، والصفوف مش أدلة مستقلة. الناقص ظاهر كغير متاح.</p></section>;
}
export function PartialHistory({s}:{s:any}) {
    if(!s.partial)return null;
    return <section className="holding-context" aria-label="نافذة التاريخ المتاح"><h3>{s.name} · قراءة على قد التاريخ المتاح</h3><p>المصدر هنا موفر <L>{s.historyCount}</L> جلسة لحد <L>{s.date}</L>، مش كل تاريخ السهم. دي نافذة المصدر البديل بعد عيوب في شموع المصدر السابق، مش كل تاريخ التداول ولا عيب في السهم.</p><div className="holding-signals"><div><small>السعر / متوسط 50</small><b>{averagePosition(s,50)}</b></div><div><small>السعر / متوسط 200</small><b>المتاح أقل من 200 جلسة</b></div><div><small>حجم آخر جلسة / السابق 20</small><b><L>{Math.round(s.volx*100)}%</L></b></div><div><small>تغيّر آخر 5 جلسات</small><b><L>{pc(s.chg5)}</L></b></div></div><p className="eg-note">متوسط 50 مدعوم بعدد الجلسات المتاحة. متوسط 200 غير محسوب، ومش بنستبدله بمتوسط أقصر. مفيش متوسط 200 أو مؤشر الزخم (ماكد) أو اختبار تاريخي أو مستويات مراقبة من النافذة القصيرة دي. <a href={s.source} target="_blank" rel="noreferrer">مصدر البيانات: <bdi>{s.sourceName}</bdi></a>. تحقق من اختلافات التسوية قبل مقارنة التكلفة.</p></section>;
}
export function HoldingContext({h,s,maxWeight}:{h:any;s:any;maxWeight:number}) {
    const distance=Number.isFinite(h.averageCost)&&h.averageCost>0&&Number.isFinite(s.close)&&s.close>0?100*(s.close/h.averageCost-1):null;
    return <section className="holding-context" aria-label="قراءة مركزك">
        <div className="evidence-head"><b>قراءة مركزك</b><small>إقفال <bdi dir="ltr">{s.date}</bdi></small></div>
        {(()=>{const a=calendarAge(s.date);return (a===null||a<0||a>3)?<DataAge date={s.date}/>:null;})()}<PartialHistory s={s}/>
        <p>{distance===null?'متوسط التكلفة مش متاح.':<>الإقفال {distance<0?'أقل':'أعلى'} من متوسطك بـ <L>{Math.abs(distance).toFixed(1)}%</L>. </>}{s.ok?<>حالة الاتجاه: <b>{verdict(s).t}</b>.</>:'التاريخ المجاني مش كافي لقراءة الاتجاه.'}</p>
        <div className="weight-track" role="img" aria-label={'وزن اللقطة '+h.weight.toFixed(2)+' بالمئة'}><span style={{width:h.weight+'%'}}/></div>
        <p className="eg-note">{h.weight===maxWeight?'ده من أكبر الأوزان في اللقطة. ':''}وزنه <L>{h.weight.toFixed(2)}%</L>. حركة السهم ±10% تعني تقريبًا ±<L>{(h.weight/10).toFixed(2)}%</L> من قيمة جزء الأسهم، لو الباقي ثابت. قياس حساسية، مش توقع.</p>
        </section>;
}
export function BonyFundamentals(){
    const release='https://ir.bonyanegypt.com/files/Bonyan%20Earnings%20Release%20-%209M%202026%20-%20English%20-%2011112026.pdf';
    const fs='https://ir.bonyanegypt.com/files/Bonyan%20-%20Arabic%20Financial%20Statements%20%26%20Auditors%20Report%2030%20Sep%202026.pdf';
    return <section className="bony-fin" aria-label="التحليل المالي لبنيان"><div className="bf-head"><h3>بنيان · تحت الغطا</h3><span>9 شهور · 30 سبتمبر 2026</span></div><div className="bf-profit"><b>الأرباح المعلنة مش كلها دخل متكرر</b><div><span>صافي معلن</span><u><i style={{width:'100%'}}/></u><strong>1,268</strong></div><div><span>متكرر*</span><u><i style={{width:(219/1267.8*100)+'%'}}/></u><strong>219</strong></div><small>مليون جنيه · المقارنة مش تسوية محاسبية بين الرقمين</small></div><div className="bf-assets"><div><small>أصول الشركة</small><b>18.258</b></div><span>−</span><div><small>كل الالتزامات</small><b>4.758</b></div><span>=</span><div><small>حقوق الملكية</small><b>13.499</b></div></div><p className="bf-unit">مليار جنيه · فروق تقريب · حقوق ملكية دفترية، مش سعر عادل</p><FinVal6 k="BONY" bony/><Det title="اختبار حساسية الأصول، تقدير تجريبي منا"><p className="eg-note">القوائم نفسها بتعرض حساسية تقييم العقارات لتغير سعر البيع ±10%. بنطبق نفس الصدمة على رصيد الاستثمار العقاري 16.688 مليار، مع افتراض تغير الضريبة المؤجلة بـ22.5% من فرق التقييم زي معدل إيضاح الضريبة. باقي الأصول والالتزامات ثابتة.</p><div className="fin-facts">{[["عقارات أقل 10%","12.21"],["حقوق الملكية بالقوائم","13.50"],["عقارات أعلى 10%","14.79"]].map(([label,value])=><div key={label}><small>{label}</small><b dir="ltr">{value}</b><span>مليار ج.م</span></div>)}</div><p className="eg-note">المعادلة: 13.499 + (16.688 × نسبة الصدمة × 77.5%). ده ضغط حسابي على حقوق ملكية 30 سبتمبر، تقدير تجريبي منا، مش سعر بيع للأصول. لا يشمل خصم السيولة أو تكلفة التصرف أو تغير الإيجارات أو شراء الخزينة بعد الفترة. لو افتراض الضريبة مختلف، النتيجة تختلف. الشركة بتقول إن عقاراتها قيمتها 19.0 مليار في عرضها، وقوائمها الرسمية مكتوب فيها 16.7 مليار. الفرق (حوالي 2.3 مليار) لسه مش مفسّر، فمش بنستخدم رقم الـ19.، والأرقام بالسهم تحت تقدير دفتري مؤرخ، تقدير تجريبي منا.</p><div className="fin-facts">{[["عقارات أقل 10%","6.51"],["حقوق الملكية بالقوائم","7.20"],["عقارات أعلى 10%","7.89"]].map(([label,value])=><div key={label}><small>{label}</small><b dir="ltr">{value}</b><span>ج.م للسهم</span></div>)}</div><p className="eg-note">القسمة على 1,874.84 مليون سهم (عدد الأسهم بالقوائم في 30 سبتمبر). عدد الأسهم 1,874,843,549 حسب إفصاح 13 أكتوبر 2026 (موقف 30 سبتمبر، ومفيش أسهم خزينة في النموذج). شراء الخزينة: غير متوفر: ما لقيناش إفصاح رسمي بالرقم ده. نموذج 30 سبتمبر مفيهوش أسهم خزينة، ونصوص إفصاحات البورصة الخاصة بالشراء مش متاحة لنا. عدد الأسهم المستخدم هو اللي في النموذج، وأي شراء بعد 30 سبتمبر مش محسوب. حقوق الملكية هنا الإجمالية بالقوائم، والقوائم منفردة (الشركة وحدها، مفيش قوائم مجمعة ولا حقوق أقلية).</p></Det><Det title="ليه الأرباح مختلفة؟ وإيه اللي ناقص للتقييم؟"><p className="eg-note">ربح إعادة تقييم العقارات 1,387 مليون جنيه قبل الضريبة، ومش تحصيل كاش. المتكرر 219 مليون مقياس بتعلنه الشركة، بيستبعد بيع الوحدات وإعادة التقييم ومصاريف الطرح غير المتكررة، ومش بند مستقل مدقق. التدفق التشغيلي 516 مليون لكنه يشمل تحصيلات بيع وحدات، مش إيجار بس.</p><p className="eg-note">ضمن الالتزامات ضريبة مؤجلة 3.215 مليار وقروض 824 مليون، فلا نخصمهم تاني من حقوق الملكية. العقارات الاستثمارية بالقوائم 16.688 مليار، بينما تقييم محفظة الشركة الإجمالي المعلن 19 مليار ونطاق مطابقته مع القوائم لسه محتاج تسوية. أي زيادة افتراضية لازم تتراجع مع الضريبة ونطاق الأصول.</p><p className="eg-note">إيضاح رأس المال: حوالي 1.875 مليار سهم في 30 سبتمبر، قيمة اسمية جنيه. بعدها موافقة على زيادة 2% لنظام الإثابة في 12 أكتوبر. شراء الخزينة: غير متوفر: ما لقيناش إفصاح رسمي بالرقم ده. نموذج 30 سبتمبر مفيهوش أسهم خزينة، ونصوص إفصاحات البورصة الخاصة بالشراء مش متاحة لنا. عدد الأسهم المستخدم هو اللي في النموذج، وأي شراء بعد 30 سبتمبر مش محسوب. الموافقة مش تنفيذ، ومفيش افتراض إن ده آخر وضع يومنا. علشان كده لسه مفيش نطاق سعر عادل ولا مضاعف مضلل مبني على ربح إعادة التقييم.</p><p className="eg-note">المصدر: <a href={release} target="_blank" rel="noreferrer">نتائج الشركة، صفحات 3 و5 و8 و9</a> · <a href={fs} target="_blank" rel="noreferrer">القوائم وإيضاحات 8 و15 و20</a> · <a href="https://foudalens.com/en/news/297121" target="_blank" rel="noreferrer">إفصاح الخزينة 5 نوفمبر</a>. مراجعة المصادر 24 نوفمبر 2026. الأرقام للشركة كلها، مش قيمة محفظتك.</p></Det></section>;
}

export function Portfolio() {
    const [holdings,setHoldings] = useState<any[]>(()=>{try {const v=localStorage.getItem(PORTFOLIO_KEY);return v?parsePortfolio(JSON.parse(v)):[];}catch{return [];}});
    const [err,setErr] = useState(setupMessage);
    const [setupCode,setSetupCode] = useState('');
    const [passphrase,setPassphrase] = useState('');
    const [unlocking,setUnlocking] = useState(false);
    const [holdingSort,setHoldingSort] = useState('weight');
    const gap=(h:any)=>h.averageCost?Math.abs(100*(DATA.stocks[h.symbol].close/h.averageCost-1)):-1;
    const orderedHoldings=[...holdings].sort((a,b)=>holdingSort==='gap'?gap(b)-gap(a):b.weight-a.weight);
    const topTwoWeight=[...holdings].sort((a,b)=>b.weight-a.weight).slice(0,2).reduce((n,h)=>n+h.weight,0);
    const [saved,setSaved] = useState(()=>{try{return !!localStorage.getItem(PORTFOLIO_KEY);}catch{return false;}});
    useEffect(()=>{const update=()=>{try{const v=localStorage.getItem(PORTFOLIO_KEY);setHoldings(v?parsePortfolio(JSON.parse(v)):[]);setSaved(!!v);setErr(setupMessage);}catch{setErr('تعذر قراءة البيانات المحفوظة.');}};window.addEventListener('egx-portfolio-imported',update);return()=>window.removeEventListener('egx-portfolio-imported',update);},[]);
    async function load(e: React.ChangeEvent<HTMLInputElement>) {
        try {
            const f=e.target.files?.[0]; if(!f)return;
            if(f.size>100000)throw Error('الملف أكبر من الحجم المسموح.');
            const rows=parsePortfolio(JSON.parse(await f.text()));
            setHoldings(rows);setErr('');
            try{localStorage.setItem(PORTFOLIO_KEY,JSON.stringify({version:1,holdings:rows}));setSaved(true);}catch{setSaved(false);setErr('المتصفح رفض الحفظ. البيانات مفتوحة للجلسة الحالية بس؛ جرّب متصفح عادي مش وضع خاص.');}
        }catch(ex){setErr(ex instanceof SyntaxError?'الملف مش JSON سليم. اختار ملف المحفظة المجهز لك.':ex instanceof Error?ex.message:'مقدرتش أقرأ الملف.');}
        e.target.value='';
    }
    async function unlock(){
        setUnlocking(true);setErr('');
        try{
            const blob=ENCRYPTED_PORTFOLIO;
            if(!blob||blob.v!==1||blob.iterations!==600000)throw Error();
            const bytes=(v:string)=>Uint8Array.from(atob(v),c=>c.charCodeAt(0));
            const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(passphrase),'PBKDF2',false,['deriveKey']);
            const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:bytes(blob.salt),iterations:blob.iterations,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['decrypt']);
            const raw=await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(blob.iv)},key,bytes(blob.data));
            const rows=parsePortfolio(JSON.parse(new TextDecoder().decode(raw)));
            localStorage.setItem(PORTFOLIO_KEY,JSON.stringify({version:1,holdings:rows}));
            setHoldings(rows);setSaved(true);setPassphrase('');setErr('تم فتح المحفظة وحفظها على المتصفح ده.');
        }catch{setErr('كلمة الفتح مش صحيحة، أو المتصفح منع الحفظ. جرّب تاني في نفس المتصفح العادي.');}
        finally{setUnlocking(false);}
    }
    function remove(){try{localStorage.removeItem(PORTFOLIO_KEY);setHoldings([]);setSaved(false);setErr('');}catch{setErr('المتصفح منع حذف التخزين. امسح بيانات الموقع من إعداداته.');}}
    return <div className="eg-pad"><h2 className="eg-h">محفظتي</h2>
        <p className="eg-note eg-priv">الحفظ: نسخة مشفرة على الموقع، وبعد الفتح بتتحفظ نسخة غير مشفرة على المتصفح ده بس. اللي يستخدم نفس المتصفح يقدر يشوفها، ومسح بيانات الموقع يضيّعها، ومفيش مزامنة بين الأجهزة.</p>
        {!holdings.length&&ENCRYPTED_PORTFOLIO&&<section className="portfolio-import"><h3>افتح محفظتك</h3><p className="eg-note">اكتب كلمة الفتح مرة واحدة. بعدها البيانات هتفتح تلقائيًا على المتصفح ده من غير ملف.</p><form onSubmit={e=>{e.preventDefault();unlock();}}><input type="password" aria-label="كلمة فتح المحفظة" autoComplete="off" value={passphrase} onChange={e=>setPassphrase(e.target.value)} style={{width:'100%',padding:12,boxSizing:'border-box'}}/><button className="eg-chip" type="submit" disabled={unlocking||!passphrase}>{unlocking?'جاري الفتح...':'افتح واحفظ محفظتي'}</button></form><p className="eg-note">الموقع فيه نسخة مشفرة قابلة للتحميل. حد يقدر يجرب كلمات عليها خارج الموقع من غير حد، فعبارة الفتح لازم تكون طويلة وصعبة. مسح النسخة المحلية لا يمسح النسخة المشفرة من الموقع أو تاريخه.</p></section>}
        {!ENCRYPTED_PORTFOLIO&&(!holdings.length ? <label className="portfolio-import">إعداد المحفظة مرة واحدة <input type="file" accept="application/json,.json" onChange={load}/></label> : <Det title="تحديث ملف المحفظة"><label className="portfolio-import">اختار الملف الجديد <input type="file" accept="application/json,.json" onChange={load}/></label></Det>)}
        {!ENCRYPTED_PORTFOLIO&&<Det title="الإعداد من غير اختيار ملف"><p className="eg-note">لو الرابط مفتحش البيانات تلقائيًا، انسخ رابط الإعداد الخاص من الرسالة والصقه هنا. اللصق والاستيراد بيحصلوا على جهازك من غير رفع.</p><textarea aria-label="رابط الإعداد الخاص" value={setupCode} onChange={e=>setSetupCode(e.target.value)} style={{width:'100%',minHeight:80,boxSizing:'border-box'}}/><button type="button" className="eg-chip" onClick={()=>{try{const text=setupCode.trim();const code=text.includes('setup=')?text.split('setup=')[1].split(/[\s&#]/)[0]:text;if(!code||code.length>15000)throw Error();const rows=parsePortfolio(JSON.parse(atob(code.replace(/-/g,'+').replace(/_/g,'/'))));localStorage.setItem(PORTFOLIO_KEY,JSON.stringify({version:1,holdings:rows}));setHoldings(rows);setSaved(true);setSetupCode('');setErr('تم إعداد المحفظة وحفظها على المتصفح ده.');}catch{setErr('الرابط ناقص أو المتصفح منع الحفظ. انسخ رسالة الرابط كاملة وحاول تاني.');}}}>احفظ المحفظة من الرابط</button></Det>}
        
        <Link to="/all" className="un-link"><b>كل الأسهم</b><small>كل الأسهم اللي عندنا، واللي مالهاش دراسة مكتوب جنبها السبب</small></Link>
        {err&&<p role="alert" className="eg-note eg-warn">{err}</p>}
        {!!holdings.length&&<>
            <HomeBoard holdings={holdings}/>

            
            
            <p className="portfolio-saved">{saved?'محفوظ على المتصفح ده · هيفتح تلقائيًا المرة الجاية':'مفتوح للجلسة فقط، الحفظ غير متاح'}</p>
            <button type="button" className="eg-chip" onClick={remove}>احذف محفظتي من المتصفح</button>
            <p className="eg-note">الأوزان لقطة ملفك، مش أوزان لحظية ولا رصيد متصل بالوسيط. ملف 24 نوفمبر: الأوزان الساعة 07:58، والمتوسطات والكميات الساعة 15:18. بنستخدم إقفال <L>{DATA.stocks.MASR.date}</L>، مش آخر تداول في الصور الأحدث. فرق سعر قبل الرسوم والتوزيعات، مش ربح محقق.</p>
            

            <p className="eg-note">المتوسط المعروض 5 منازل عشرية، فضربه في الكمية ممكن يختلف قروش عن إجمالي تكلفة الوسيط بسبب التقريب. متوسط الشراء مرجع حسابي، مش سعر لازم السهم يرجع له ولا سبب كافي للاحتفاظ أو البيع. التطبيق لا ينفذ أوامر ولا يتصل بحساب الوسيط.</p>
        </>}
    </div>;
}
