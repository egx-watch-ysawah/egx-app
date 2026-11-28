import { StockChips } from './ui2026/Chips';
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
import { StatusBanner } from './ui2026/StockStatus';
import { AllStocks } from './unavail';


import { Det, ENCRYPTED_PORTFOLIO, Evidence, FinancialStudy, KEYS, L, PORTFOLIO_KEY, Plan3, Price, RULE_AR, Short, fmt, invalidCandles, num, pc, reason, records, verdict, w20, why } from './shared';
import { Home } from './screen_home';
import { About, Info, Market } from './screen_info';
import { BonyFundamentals, DataAge, HoldingComparison, HoldingContext, PartialHistory, Portfolio, PortfolioVisual, averagePosition, calendarAge, consumeSetupFragment, parsePortfolio, setupMessage } from './screen_portfolio';
import { App } from './App';
export function MyPosition({k}:{k:string}){
    let h:any=null;
    try{const v=localStorage.getItem(PORTFOLIO_KEY);if(v)h=parsePortfolio(JSON.parse(v)).find((x:any)=>x.symbol===k);}catch{}
    if(!h)return null;
    const px=(DATA as any).stocks[k]?.close;
    const gap=h.averageCost>0&&Number.isFinite(px)?100*(px/h.averageCost-1):null;
    const cls=gap===null?'':gap>=0?'u':'d';
    const arrow=gap===null?'':gap>=0?'▲':'▼';
    const gtxt=gap===null?'غير متاح':(gap>=0?'+':'')+gap.toFixed(1)+'%';
    const avg=h.averageCost===null?'غير متاح':h.averageCost.toFixed(h.averageCost<1?4:2);
    const qty=h.quantity!==null?h.quantity.toLocaleString('en-US'):'غير متاح';
    return <section className="mp mp-b" aria-label="مركزك"><div className="mp-big"><span>الإقفال مقارنة بمتوسط تكلفتك</span><b className={cls} dir="ltr">{arrow} {gtxt}</b></div><div className="mp-line"><span>متوسط التكلفة <bdi dir="ltr">{avg}</bdi></span><span>الكمية <bdi dir="ltr">{qty}</bdi> سهم</span><span>السعر <bdi dir="ltr">{fmt(px)}</bdi></span></div><small className="mp-foot">لقطة 24/11 15:18 · مش نصيحة</small></section>;
}
export function Stock({ k }: { k: string }) {
    const s = DATA.stocks[k];
    const [tf, setTf] = useState<TF>('D');
    const [n, setN] = useState(130);
    const trows = React.useMemo(() => s.ok ? mkRows(resample(s.bars, tf)) : [], [k, tf]);
    const [t, setT] = useState({ sma: true, vol: false, rsi: false, macd: false, plan: false, bb: false });
    const tg = (key: keyof typeof t, name: string) => <button type="button" className={'eg-chip' + (t[key] ? ' on' : '')} aria-pressed={t[key]} onClick={() => setT({ ...t, [key]: !t[key] })}>{t[key] ? '✓ ' : ''}{name}</button>;
    const v = verdict(s);
    if(invalidCandles(s))return <div className="eg-pad"><Link className="eg-back" to="/">← محفظتي</Link><h2 className="eg-h">{s.name} <L>{k}</L></h2><Price v={s.close}/><DataAge date={s.date}/><section className="holding-context" role="status"><h3>مراجعة جودة بيانات الشموع</h3><p>المصدر فيه جلسات فتحها أو إقفالها خارج الأعلى والأدنى. وقفنا الشموع وATR وADX ومستويات الدخول والوقف والاختبارات المعتمدة عليها لحد تصحيح المصدر. الرسم تحت للإقفال فقط، مش شموع مصححة بالتخمين. اختلاف المصدر لا يعني إن السهم نفسه فيه مشكلة.</p></section><Det title="الشارت" open><StockChart rows={mkRows(s.bars) as any} n={130} t={{sma:true,vol:false,rsi:false,macd:false,plan:false,bb:false}} plan={{entry:0,stop:0,target:0,trail:0}} closeOnly/><p className="eg-note">المتوسطات مبنية على الإقفال المتاح، مش تقييم للشركة ولا أمر تداول. بيانات الإقفال نفسها محتاجة مقارنة بتاريخ المصدر قبل الاعتماد.</p></Det><Det title="دراسة الشركة · الأداء المالي والتقييم">{k==='BONY'?<BonyFundamentals/>:<FinancialStudy symbol={k}/>}</Det></div>;
    const chartNode = <Det title="الشارت" open>
                    <div className="eg-rowlab">مدة الشمعة</div><div className="eg-chips">{(['D', 'W', 'M'] as TF[]).map(x => <button type="button" key={x} className={'eg-chip' + (tf === x ? ' on' : '')} onClick={() => { setTf(x); setN(RANGES[x][1][1]); }}>{TF_AR[x]}</button>)}</div>
                <div className="eg-rowlab">الفترة المعروضة</div><div className="eg-chips">{RANGES[tf].filter(([,b])=>b<=trows.length).concat([['المتاح كله',trows.length]] as [string,number][]).map(([a, b]) => <button type="button" key={a} className={'eg-chip eg-sm' + (n === b ? ' on' : '')} onClick={() => setN(b)}>{a}</button>)}</div>
                <StockChart key={k + tf} rows={trows} n={n} t={t} plan={s.plan} closeDate={s.date} tfName={{D:'يومية',W:'أسبوعية',M:'شهرية'}[tf]} rangeLabel={(RANGES[tf].find(([,b])=>b===n)||['المتاح كله'])[0]} bar={<>{tg('plan', 'مستويات السيناريو')}{tg('sma', 'متوسطات')}{tg('vol', 'حجم')}{tg('bb', 'بولينجر')}{tg('rsi', 'RSI')}{tg('macd', 'MACD')}</>} />
    </Det>;
    return <div className="eg-pad">
        <a className="eg-back" href="#/" onClick={e => { if (window.history.length > 1) { e.preventDefault(); window.history.back(); } }}>← محفظتي</a>
        <div className="eg-in">
            <h2 className="eg-h">{s.name} <span dir="ltr">({k})</span></h2><MyPosition k={k}/><TopWarn k={k}/><StatusBanner k={k} />
            {s.qualityChecked&&<p className="eg-note">إقفال <bdi>{((d:string)=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(d||''));return m?(+m[3])+' '+['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'][+m[2]-1]+' '+m[1]:String(d||'')})(s.date)}</bdi> · <L>{s.historyCount}</L> جلسة من <a href={s.source} target="_blank" rel="noreferrer"><bdi>{s.sourceName}</bdi></a></p>}
            <PartialHistory s={s}/>
            {s.ok&&<StockChips s={s} code={k}/>}{s.ok&&<StockGuide s={s} k={k} r={records[k]} chart={chartNode}/>}{s.partial&&s.bars?.length>1&&<Det title="الشارت المتاح" open><StockChart rows={mkRows(s.bars) as any} n={s.bars.length} t={{sma:true,vol:true,rsi:false,macd:false,plan:false,bb:false}} plan={{entry:0,stop:0,target:0,trail:0}}/></Det>}
            <OnTab id="f"><Det title="دراسة الشركة · الأداء المالي والتقييم">{k==='BONY'?<BonyFundamentals/>:<FinancialStudy symbol={k}/>}</Det></OnTab>
            {!s.ok ? <p className="eg-note">{s.partial?'نافذة تاريخ متاحة جزئيًا، والتفاصيل تحت بتوضح المؤشرات الممكنة.':'المصدر المجاني معندوش تاريخ كفاية للسهم ده، فمفيش تقييم.'} السعر حوالي <L>{fmt(s.close)}</L>.</p> :<OnTab id="t">

                
                <Det title="افهم الشارت والألوان">
                    <p>الخط الفاتح = سعر الإقفال. لو اخترت شموع: الجسم بين الفتح والإقفال، والخيط بين أعلى وأقل سعر. الأخضر إقفال أعلى من الفتح، والأحمر العكس.</p>
                    <p>البرتقالي متوسط 50 شمعة، والأزرق متوسط 200 شمعة على الإطار المختار. خطوط الخطة اختيارية: أزرق مستوى مراقبة، أحمر مستوى مراقبة سفلي، أخضر مرجع متحرك، مش هدف ربح.</p>
                    <p>الأرقام أعلى الشارت تخص الفترة اللي اخترتها: فتح، أعلى، أقل، إقفال، والتغير من الفتح للإقفال. الحجم عدد الأسهم المتداولة. RSI مقياس زخم من 0 لـ100، مش نسبة ربح متوقعة.</p>
                </Det>
                <Det title="الفريم ومدة المتابعة"><Use>تعرف تتابع السهم كام يوم أو أسبوع، مش مضاربة جوه الجلسة.</Use><p>التقييم والسيناريو على شمعة يومية بعد الإقفال، أقرب لمتابعة على أيام أو أسابيع، مش مضاربة جوه الجلسة.</p><p>التطبيق مش بيتابع مركزك ولا تاريخ دخولك، والمرجع المتحرك بيتحسب من جديد كل يوم، مش مستوى محفوظ.</p></Det>
                <Det title="سيناريو افتراضي للمتابعة، مش توصية"><Use>مستويات سعر للمراقبة بس، تقدر تفهم بيها لو السعر وصل لحاجة منها الصورة الفنية بتتغير إزاي. مش أمر ومش توصية.</Use>
                    <p className="eg-note">المستويات دي حساب افتراضي من حركة السعر والتذبذب، مش خطة لحد. الحالة الحالية: {v.t}.</p>
                    <Plan3 s={s} />
                    <p className="eg-note">{s.plan.mode === 'pullback' ? 'الصندوق بيوصف مستوى تراجع للسعر مش شراء بالسعر الحالي. الوصول للمستوى لوحده مش معناه إن الصورة اتغيرت.' : 'الصندوق بيوصف مستوى اختراق للسعر مش شراء بالسعر الحالي. الاختراق من غير حجم أعلى من المعتاد ضعيف الدلالة.'}</p>

                </Det>
                {s.plan.tv < 1 && <p className="eg-note eg-warn">السيولة ضعيفة (حوالي {s.plan.tv} مليون جنيه في اليوم).</p>}

                

                
                {s.fire.length > 0 && <div className="eg-fire">إشارة جديدة {tdW()}: {s.fire.map((f: string) => RULE_AR[f]).join(' + ')}{(s.fire.some((f: string) => /breakout/.test(f)) && s.volx) ? ' (الحجم الفعلي ' + Math.round(s.volx*100) + '% من المعتاد)' : ''}{!s.votes.trend ? '. السعر لسه تحت متوسط 200 جلسة.' : ''}</div>}
                <Det title="ليه الحكم ده؟">
                    <div className="eg-why">{why(s).map((w, i) => <div key={i} className="eg-w" style={{ animationDelay: i * 50 + 'ms' }}><span className={w.ok === null ? '' : w.ok ? 'ok' : 'no'}>{w.ok === null ? '•' : w.ok ? '✓' : '✗'}</span>{w.t}</div>)}<div className="eg-legend" style={{ fontSize: 12, opacity: .75, marginTop: 6, lineHeight: 1.8 }}>✓ الشرط متحقق · ✗ الشرط مش متحقق · • محايد: في النص، لا بيأكد ولا بيضعف (زي حجم قريب من المعتاد أو RSI بين 30 و70)</div></div>
                <Ex>{X.why()}</Ex>

                
                </Det>
                <Det title="المؤشرات بالتفصيل">
                    <div className="eg-grid2">
                    <div className="eg-m"><span>RSI</span><b dir="ltr">{s.rsi}</b><i>من 0 لـ100. فوق 70 مبالغ، تحت 30 مبالغ في النزول.</i></div>
                    <div className="eg-m"><span>التذبذب اليومي</span><b dir="ltr">{s.plan.atrpct}%</b><i>الحركة المعتادة في اليوم (متوسط آخر 14 جلسة). بنحسب منها المستوى الافتراضي.</i></div>
                    <div className="eg-m"><span>قوة الاتجاه ADX</span><b dir="ltr">{s.plan.adx}</b><i>{s.plan.adx > 25 ? 'حركة قوية نسبيًا (ADX بيقيس القوة مش الاتجاه).' : s.plan.adx >= 20 ? 'فوق 25 اتجاه واضح، وحوالي 20 اتجاه بيتكون.' : 'فوق 25 تبقى الحركة قوية. دلوقتي مفيش قوة واضحة.'}</i></div>
                    <div className="eg-m"><span>مكانه في بولينجر</span><b dir="ltr">{s.plan.bbpos}%</b><i>0% عند الحد الأدنى للنطاق المعتاد و100% عند الأعلى. 20% أو أقل يعني الخُمس الأدنى، و80% أو أكتر الخُمس الأعلى، وبينهم منطقة وسطى.</i></div>
                    <div className="eg-m"><span>أعلى 20 جلسة (شامل {tdA()})</span><b dir="ltr">{fmt(s.plan.res)}</b><i>{w20(s).hp != null ? `قبل ${inSessionNow() ? 'جلسة النهارده' : 'آخر جلسة'}: ${fmt(w20(s).hp)}. إشارة الاختراق بتقارن الإقفال بأعلى إقفال في الـ20 جلسة قبله (${fmt(w20(s).hc)})، فالإشارة ممكن تظهر والسعر لسه تحت أعلى سعر المعروض فوق.` : 'مقاومة محتملة.'}</i></div>
                    <div className="eg-m"><span>أقل 20 جلسة (شامل {tdA()})</span><b dir="ltr">{fmt(s.plan.sup)}</b><i>{w20(s).lp != null ? `قبل ${inSessionNow() ? 'جلسة النهارده' : 'آخر جلسة'}: ${fmt(w20(s).lp)}. أقل إقفال في الـ20 جلسة قبله: ${fmt(w20(s).lc)}.` : 'دعم محتمل.'}</i></div>
                </div>
                <Ex label="اشرحلي RSI">{X.rsi(s)}</Ex>
                <Ex label="اشرحلي التذبذب (ATR)">{X.atr(s)}</Ex>
                <Ex label="اشرحلي ADX">{X.adx(s)}</Ex>
                <Ex label="اشرحلي بولينجر">{X.bb(s)}</Ex>
                <Ex label="اشرحلي الدعم والمقاومة">{X.sr(s)}</Ex>
                <Ex label="اشرحلي مؤشر الزخم (ماكد)">{X.macd()}</Ex>

                
                </Det>
                <Det title="طريقة حساب السيناريو والمخاطرة"><Use>تفهم الأرقام جاية منين وتتأكد منها.</Use>
                    <Ex>{X.plan(s)}</Ex>
                </Det>
                
                
                <p className="eg-note eg-foot">قراءة تاريخية للسعر والتذبذب، مش نصيحة ولا توقع. السعر ممكن يتخطى أي مستوى بفجوة. المؤشرات مشتقة من نفس الأسعار فمش أدلة مستقلة، وميزة التنبؤ مش مثبتة، والبيانات من مصدر مجاني واحد ممكن يتأخر أو يحتاج تصحيح تقسيمات.</p>
            </OnTab>}
            <OnTab id="f"><V7Card k={k} /></OnTab>
            <OnTab id="f"><TeamBlock code={k} /></OnTab><OnTab id="d"><NewsBlock code={k} /></OnTab><OnTab id="t"><Glossary /></OnTab>
        </div>
    </div>;
}
