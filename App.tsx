import React, { useEffect, useState } from 'react';
import { FileCard, NavLink, Link, Route, Routes, useLocation } from './shim';
import { DATA } from './data';
import { StockChart, Spark, Ring } from './Chart';
import { rows as mkRows, resample, RANGES, TF_AR, TF } from './indic';
import { Ex, X } from './explain';


const KEYS = ['MASR', 'BONY', 'HRHO', 'UNIP', 'PHAR', 'ORHD'];
const RULE_AR: Record<string, string> = {
    'RSI<30 (oversold bounce)': 'RSI نزل تحت 30 (احتمال ارتداد)',
    'MACD cross up': 'تقاطع MACD لأعلى والسعر فوق متوسط 200',
    '20d breakout + volume x1.5': 'اختراق أعلى سعر 20 يوم بحجم 1.5 ضعف',
    'SMA50 cross above SMA200': 'متوسط 50 قطع متوسط 200 لأعلى',
};
const fmt = (v: number) => (v >= 10 ? v.toFixed(2) : v.toFixed(3));
const pc = (v: number) => (v > 0 ? '+' : '') + v.toFixed(1) + '%';
const L = ({ children }: { children: React.ReactNode }) => <bdi dir="ltr">{children}</bdi>;

function verdict(s: any) {
    if (!s.ok) return { t: s.partial?'تاريخ جزئي':'بيانات ناقصة', c: 'na', col: '#8b97ad' };
    if (s.votes.trend && s.votes.mid) return { t: 'فوق المتوسطين', c: 'go', col: '#99b9df' };
    if (!s.votes.trend && !s.votes.mid) return { t: 'تحت المتوسطين', c: 'wait', col: '#99b9df' };
    return { t: 'بين المتوسطين', c: 'watch', col: '#99b9df' };
}
function reason(s: any): string {
    if (!s.ok) return s.partial?'نافذة متاحة جزئيًا؛ كل مؤشر حسب عدد جلساته.':'تاريخ السهم ناقص في المصدر المجاني.';
    const v = s.votes, p = s.plan;
    if (verdict(s).c === 'go') return 'الإقفال فوق متوسط 50 و200 جلسة. وصف للاتجاه، مش توقع ربح.';
    if (p.ext > 4) return 'طالع بسرعة. الدخول دلوقتي متأخر.';
    if (p.tv < 1) return 'السيولة ضعيفة، ممكن تعلق فيه.';
    if (!v.trend) return 'تحت متوسط 200 يوم، الاتجاه الطويل لسه ضعيف.';
    if (!v.mid) return 'الاتجاه الطويل تمام بس القصير ضعيف. استنى تأكيد.';
    return 'نص المؤشرات إيجابي. استنى تأكيد قبل الدخول.';
}
function Plan3({ s }: { s: any }) {
    const p = s.plan;
    return <div className="eg-p3">
        <div><span>{p.mode === 'pullback' ? 'تراجع محتمل إلى' : 'اختراق محتمل فوق'}</span><b dir="ltr">{fmt(p.entry)}</b><i dir="ltr">{pc(p.entry_pct)}</i></div>
        <div className="dn"><span>وقف بعد الدخول فقط</span><b dir="ltr">{fmt(p.stop)}</b><i dir="ltr">{pc(p.stop_pct)}</i></div>
        <div><span>حجم الصفقة</span><b dir="ltr">{p.sizepct}%</b><i>من المحفظة</i></div>
    </div>;
}
function Det({ title, children, open }: { title: string; children: React.ReactNode; open?: boolean }) {
    return <details className="eg-ex" open={open}><summary>{title}</summary><div className="eg-exb">{children}</div></details>;
}

function Price({ v }: { v: number }) { return <span className="eg-price" dir="ltr">{fmt(v)}</span>; }

function why(s: any): { ok: boolean; t: string }[] {
    const v = s.votes, p = s.plan, o: { ok: boolean; t: string }[] = [];
    o.push({ ok: !!v.trend, t: v.trend ? 'السعر فوق متوسط 200 يوم: الاتجاه الطويل صاعد.' : 'السعر تحت متوسط 200 يوم: الاتجاه الطويل لسه نازل أو ضعيف.' });
    o.push({ ok: !!v.mid, t: v.mid ? 'فوق متوسط 50 يوم: الاتجاه المتوسط إيجابي.' : 'تحت متوسط 50 يوم: الاتجاه المتوسط سلبي.' });
    o.push({ ok: !!v.macd, t: v.macd ? 'MACD فوق خط الإشارة: الزخم بيتحسن.' : 'MACD تحت خط الإشارة: الزخم ضعيف.' });
    o.push({ ok: !!v.rsi, t: s.rsi > 70 ? `RSI ${s.rsi}: صعد بسرعة، خطر تصحيح.` : s.rsi < 40 ? `RSI ${s.rsi}: ضعيف، وممكن يرتد لو قرب 30.` : `RSI ${s.rsi}: في المنطقة الصحية.` });
    o.push({ ok: !!v.vol, t: v.vol ? 'حجم التداول أعلى من المعتاد مع صعود: فيه اهتمام شراء.' : `حجم التداول ${s.volx} ضعف المعتاد: مفيش تأكيد من الحجم.` });
    return o;
}

function Evidence({ s }: { s: any }) {
    const trend = s.votes.trend, mid = s.votes.mid, macd = s.votes.macd;
    const disagreements = [trend !== mid ? 'الاتجاه الطويل والمتوسط مختلفين.' : '', !!mid !== !!macd ? 'اتجاه متوسط 50 والزخم مش في نفس الاتجاه.' : '', s.chg5 > 0 && !s.votes.vol ? 'السعر أعلى من 5 جلسات، لكن حجم آخر جلسة ما أكدش الصعود.' : ''].filter(Boolean);
    return <section className="evidence" aria-label="ملخص الأدلة">
        <div className="evidence-head"><h3>ورا الحالة إيه؟</h3><span>يومي · <bdi dir="ltr">{s.date}</bdi></span></div>
        <p className="evidence-intro">قراءة للبيانات، مش توقع ولا تعليمات تداول.</p>
        <div className="evidence-row"><span>الاتجاه</span><div><b>{trend ? 'فوق' : 'تحت'} متوسط 200، و{mid ? 'فوق' : 'تحت'} متوسط 50 جلسة</b><small>بيوصف مكان السعر من تاريخه، مش اتجاه بكرة.</small></div></div>
        <div className="evidence-row"><span>الزخم</span><div><b>MACD {macd ? 'أعلى' : 'أقل'} من خطه · RSI <bdi dir="ltr">{s.rsi}</bdi></b><small>{s.rsi > 70 ? 'حركة صعود قوية؛ مش معناها إن الهبوط لازم يبدأ.' : s.rsi < 30 ? 'حركة نزول قوية؛ مش معناها إن الارتداد مضمون.' : 'RSI في النطاق بين 30 و70، وده لوحده مش إشارة.'}</small></div></div>
        <div className="evidence-row"><span>الحجم</span><div><b><bdi dir="ltr">{s.volx}×</bdi> متوسط 20 جلسة سابقة</b><small>{s.votes.vol ? 'حجم أعلى من المتوسط مع إقفال صاعد.' : 'شرط حجم أعلى مع إقفال صاعد مش متحقق.'} مش دليل إن المشتري مؤسسات.</small></div></div>
        <div className="evidence-conflict"><b>فين التعارض؟</b><p>{disagreements.length ? disagreements.join(' ') : 'مفيش تعارض في الفحوصات دي، لكن اتفاقها مش ضمان ولا أدلة مستقلة.'}</p></div>
        <Det title="إيه اللي يغيّر القراءة؟">
            <p>إقفال جلسة جديدة على الناحية التانية من متوسط 50 أو 200 يغيّر وصف الاتجاه. تقاطع MACD مع خطه يغيّر وصف الزخم. حجم أعلى من متوسط الـ20 جلسة السابقة مع إقفال صاعد يغيّر وصف الحجم.</p>
            <p>دي تعريفات للتغير، مش مستويات شراء أو بيع. المتوسطات نفسها بتتغير كل جلسة. بلوغ مستوى لحظيًا مش إقفال مؤكد.</p>
        </Det>
        <p className="evidence-limit">المؤشرات مشتقة من أسعار متداخلة، متعدّهاش كأصوات مستقلة. حجم التداول مش صافي مؤسسات. ميزة التنبؤ مش مثبتة؛ البيانات مصدر مجاني واحد وقد تتأخر أو تحتاج تصحيح تقسيمات.</p>
    </section>;
}

function Home() {
    const [selected, setSelected] = useState('HRHO');
    const [filter, setFilter] = useState('all');
    const [query, setQuery] = useState('');
    const s = DATA.stocks[selected], v = verdict(s);
    const list = KEYS.filter(k => (!query || (k + DATA.stocks[k].name).toLowerCase().includes(query.toLowerCase())) && (filter === 'all' || verdict(DATA.stocks[k]).c === filter));
    const good = KEYS.filter(k => DATA.stocks[k].ok);
    const up = good.filter(k => DATA.stocks[k].chg5 > 0).length;
    return <div className="desk-home">
        <header className="desk-heading"><div><span className="desk-eyebrow">EGX / متابعة يومية بعد الإقفال</span><h2>قائمة المتابعة</h2></div><span className="desk-currency">EGP</span></header>
        <div className="desk-date"><i />إقفال <L>{DATA.stocks.MASR.date}</L><span>مش لحظي</span></div>

        <section className="desk-watch"><div className="desk-list-head"><h3>قارن واختار <small>{KEYS.length}</small></h3><span>المس السهم لعرض السبب والرسم ↓</span></div>
            <input className="desk-search" aria-label="دور على سهم" placeholder="⌕  دور باسم السهم أو الرمز" value={query} onChange={e=>setQuery(e.target.value)} />
            <div className="desk-filters">{[['all','الكل'],['go','فوق المتوسطين'],['watch','بينهم'],['wait','تحت المتوسطين']].map(([c,l])=><button key={c} className={filter===c?'on':''} onClick={()=>setFilter(c)}>{l}</button>)}</div>
            <div className="desk-columns"><span>السهم / مكانه من المتوسطات</span><span>الإقفال</span><span>5 جلسات</span></div>
            {list.map(k=>{const x=DATA.stocks[k],w=verdict(x);return <button key={k} className={'desk-row'+(selected===k?' selected':'')} onClick={()=>{if(x.ok){setSelected(k);requestAnimationFrame(()=>document.querySelector('.desk-feature')?.scrollIntoView({behavior:'smooth',block:'start'}));}}} disabled={!x.ok}><span className="desk-symbol"><b dir="ltr">{k}</b><small><i className={'desk-dot '+w.c}/>{w.t}</small></span><b className="desk-row-price" dir="ltr">{fmt(x.close)}</b><span className={'desk-return '+(x.ok?(x.chg5>=0?'u':'d'):'')} dir="ltr">{x.ok?pc(x.chg5):'ناقص'}</span></button>})}
            {!list.length&&<p className="eg-note">مفيش سهم مطابق للبحث.</p>}
        </section>
        <section className="desk-feature">
            <div className="desk-feature-head"><div><span className="desk-eyebrow">السهم المحدد</span><h3 dir="ltr">{selected}</h3><span>{s.name}</span></div><div className="desk-quote"><b dir="ltr">{fmt(s.close)}</b><span className={s.chg20>=0?'u':'d'} dir="ltr">{pc(s.chg20)} <small>20 جلسة</small></span></div></div>
            <div className="desk-chart-label"><span>الإقفال خلال 60 جلسة</span><span>رسم يومي</span></div>
            <div className="desk-spark"><Spark vals={s.bars.slice(-60).map((b: any)=>b[4])} up={s.chg60>=0} /></div>
            <div className="desk-chart-dates"><span>{s.bars[s.bars.length-60][0]}</span><span>{s.date}</span></div>
            
            <Evidence s={s} />
            <Link className="desk-open" to={'/'+selected.toLowerCase()}>افتح الشارت والشرح <span>←</span></Link>
        </section>
        <p className="desk-disclaimer">متابعة موجة أيام/أسابيع، مش أوامر تداول.<br/>مفيش مدة مضمونة للربح. التقييم الفني مش توقع.</p>
    </div>;
}

const records:any={
MASR:{name:'مدينة مصر',revenue:8133.847,prior:7378.170,profit:1812.455,margin:22.3,tag:'الإيراد أعلى، لكن ربح مساهمي الأم أقل',facts:[['مجمل الربح',4185.058,'مليون ج.م'],['ربح التشغيل',2460.455,'مليون ج.م']],risk:'الإيراد زاد 10.2% لكن ربح مساهمي الأم نزل 22.9%. هامش مجمل الربح نزل من 66.0% إلى 51.5%؛ الإدارة بتربطه بزيادة وزن التسليمات الأقل هامشًا. المبيعات التعاقدية والتحصيلات والإيراد المحاسبي مش نفس الحاجة.',change:'تابع تحويل التعاقدات لتحصيلات وتسليمات، وهامش الربح وتكلفة التمويل. ارتفاع المبيعات وحده مش سبب كافي للإضافة.',method:'تقييم مشروعات بتدفق نقدي على مواعيد التحصيل والتكلفة والتسليم، مع دين وكاش والتزامات الأرض. قيمة الأرض أو المبيعات المتعاقد عليها مش قيمة حقوق المساهمين.',missing:'ناقص توقيت تحصيلات وتكلفة إكمال كل مشروع، التزامات الأرض والشركاء والضريبة، ومعدل خصم مبرر بالجنيه. إعلان 24 نوفمبر يؤكد شراء 400 ألف سهم يوم 23 نوفمبر من تصريح 18.15 مليون؛ ده تنفيذ جزئي مش إجمالي أسهم الخزينة. لسه محتاجين إجمالي قائم متحقق بنفس تاريخ التقييم.',source:'https://foudalens.com/disclosures/MASR.CA/financial_statement/2026-11-16_297949_1.pdf',pages:'قائمة الدخل، صفحة PDF 7',extra:'https://foudalens.com/disclosures/MASR.CA/other/2026-11-24_298434_1.pdf',note:'جسر صافي الدين من جداول الإدارة في 30 سبتمبر: قروض وتسهيلات 7,762.8 مليون، ناقص نقدية 3,461.8 وأذون 3,624.4 وأصول مالية حالية 4.7 = نحو 672.0 مليون. تعريف العنوان 6.8 مليار لم يتصالح مع الجداول؛ لا نعتبره صافي كاش ولا نخصم أي أصل مقيد. الإيجارات والتزامات الأرض محتاجة معالجة مستقلة بلا عد مرتين.'},
HRHO:{name:'إي إف جي القابضة',revenue:19517.585,profit:2529.783,margin:13.0,tag:'مجموعة مالية، مش شركة صناعية',facts:[['حقوق مساهمي الأم',37558.564,'مليون ج.م'],['اضمحلال الأصول',1237.050,'مليون ج.م']],risk:'ربح الأم 2,529.8 مليون مقابل 2,853.0 مليون في 9 شهور 2025. خسائر اضمحلال الأصول زادت من 799.0 إلى 1,237.1 مليون. البند أوسع من خسائر الائتمان فقط.',change:'تابع ربحية وجودة أصول البنك والتمويل غير المصرفي، وربحية بنك الاستثمار كل واحد لوحده. ودائع العملاء مش دين صناعي نخصمه آليًا.',method:'مجموع أجزاء: بنك الاستثمار والتمويل غير المصرفي والبنك، مع نسب الملكية وحقوق الأقلية وتكلفة الشركة القابضة. القيمة الدفترية مرجع محاسبي، مش سعر عادل.',missing:'عائد مستدام على حقوق الملكية لكل جزء، تكلفة رأس مال وافتراضات نمو مبررة. عدد الأسهم بالقوائم 1,435,893,008 في 30 سبتمبر يحتاج مراجعة أي أحداث لاحقة.',source:'https://efgholding.com/uploads/EFG_Holding_Consolidated_Financial_Statements_3_Q2026_b9ec32d58f.pdf',pages:'قوائم 30 سبتمبر وإيضاح 26',extra:'https://efgholding.com/uploads/EFG_Holding_3_Q26_Earnings_Release_a81e8f40bf.pdf',note:'الإيراد هنا من القوائم. صافي الدخل التشغيلي بإصدار الإدارة 19,789 مليون تعريف مختلف، مش رقم بديل. EPS المنشور 1.76 لفترة 9 شهور، مش سنة كاملة. إيضاح القطاعات 34 يعرض ربحًا قبل حقوق الأقلية: السمسرة 1,574.9 مليون وإدارة الأصول 533.8 والبنك 1,920.9؛ في المقابل القابضة والخزانة خسارة 972.6، وبنك الاستثمار خسارة 98.9 والتمويل متناهي الصغر خسارة 234.3 مليون. دي نتائج قطاعات محددة مش جمع كامل ولا نصيب مساهم HRHO، فلا نضربها في مضاعف ونضيفها للقيمة. اضمحلال متناهي الصغر 397.9 مليون والاستهلاكي 401.0 والبنك 322.9، فقراءة المخاطر محتاجة كل نشاط لوحده. اختلاف حقوق الأقلية وتصنيف القطاع يمنع استنتاج ROE مستدام من قسمة ربح فترة على حقوق آخر يوم.'},
UNIP:{name:'يونيباك',revenue:1172.512,prior:1037.370,profit:14.794,margin:1.3,tag:'مبيعات أعلى، وصافي هامش رفيع جدًا',facts:[['ربح التشغيل',110.746,'مليون ج.م'],['مصروف التمويل',97.607,'مليون ج.م']],risk:'ربح التشغيل زاد من 104.355 إلى 110.746 مليون، لكن هامشه نزل تقريبًا من 10.1% إلى 9.4%. التمويل 97.6 مليون يستهلك جزءًا كبيرًا من ربح التشغيل. صافي الربح 14.8 مقابل 14.0 مليون.',change:'تابع هامش التشغيل والتمويل والتحصيل والمخزون. تحسن المبيعات من غير تحسن الكاش والهامش مش كفاية لتأكيد تحسن جودة الربح.',method:'أرباح تشغيل طبيعية وتدفق نقدي بعد احتياج رأس المال العامل والاستثمار، ثم صافي الدين. مضاعف الربحية على هامش ضعيف جدًا حساس لأي تغير صغير.',missing:'ناقص توقع تحصيلات العملاء والمخزون والاستثمار والتمويل وربح تشغيل طبيعي، مش مجرد مضاعف للربح الحالي. المكسب الرأسمالي 4.311 مليون مقابل 23.379 مليون، مش مبيعات تشغيل.',note:'الكاش التشغيلي سالب 44.4 مليون مقابل موجب 118.8 مليون في نفس الفترة السابقة، رغم ربح محاسبي 14.8 مليون. مشتريات أصول ثابتة 12.7 مليون فوقه، ودفعة 103 مليون لشراء وحدات عقارية داخلة في التدفق التشغيلي؛ فلا نعمم العجز كأنه متكرر. التسهيلات والقروض والإيجارات نحو 573.4 مليون مقابل نقدية 47.4 مليون في 30 سبتمبر، صافي نحو 526.0 مليون كجسر وصفي وليس قيمة عادلة. إيضاح رأس المال: 2,291,442,606 سهم بقيمة اسمية 0.10 جنيه، مش 229 مليون سهم. أي تغيير لاحق لازم يتراجع.',source:'https://foudalens.com/disclosures/UNIP.CA/financial_statement/2026-11-24_298468_1.pdf',pages:'قائمة الدخل PDF 5، التدفقات 8، وإيضاحات 9 و10 و11 و14'},
PHAR:{name:'إيبيكو',revenue:7389.499,prior:7157.721,profit:792.973,margin:10.7,tag:'تحفظ فحص محدود لازم يفضل ظاهر',facts:[['مجمل الربح',3051.952,'مليون ج.م'],['مصروف التمويل',1131.416,'مليون ج.م']],risk:'الفحص المجمع متحفظ لأن قوائم شركة شقيقة، المهن الطبية للأدوية، في 30 سبتمبر غير متاحة لحساب نصيب النتائج وحقوق الملكية. قيمة الاستثمار 374.9 مليون مش سقف تأثير التحفظ على الربح.',change:'تابع زوال سبب التحفظ وتكلفة التمويل والتدفق النقدي. سلامة القوائم المستقلة لا تلغي تحفظ القوائم المجمعة.',method:'تدفق نقدي للأدوية حسب الهوامش ورأس المال العامل والاستثمار والتمويل، مع فصل أثر الشركة الشقيقة. أي تقييم قبل حل التحفظ يحتاج سيناريو صريح لأثره.',missing:'قوائم الشركة الشقيقة وأثرها، خطة التمويل والاستثمار ونمو ربح تشغيلي طبيعي. صافي الربح هنا عائد للأم، مش صافي المجموعة قبل الأقلية.',source:'https://foudalens.com/disclosures/PHAR.CA/financial_statement/2026-11-15_297626_2.pdf',pages:'تقرير الفحص وقائمة الدخل، صفحتا PDF 4 و6',extra:'https://foudalens.com/disclosures/PHAR.CA/other/2026-11-17_298137_1.pdf',note:'صافي كاش التشغيل سالب 171.4 مليون مقابل موجب 1,303.7 مليون لنفس الفترة السابقة، رغم ربح مساهمي الأم 793.0 مليون. المخزون والعملاء والأرصدة المدينة استهلكوا الكاش. شراء الأصول الثابتة 103.4 مليون ومدفوعات المشروعات تحت التنفيذ 681.4 مليون؛ منفصل عن 603.2 مليون أثر نقدي لاقتناء السيطرة على API. الفوائد المدفوعة ظاهرة ضمن التمويل، فصافي التشغيل هنا قبلها؛ لا نعتبر فرق التشغيل والاستثمار وحده تدفقًا حرًا بعد خدمة الدين. المصدر: قائمة التدفقات PDF 9.'},
ORHD:{name:'أوراسكوم للتنمية مصر',revenue:23339.324,prior:17242.232,profit:4345.700,margin:18.6,tag:'اقرأ الربح مع الكاش وتأثير أسهم المنحة',facts:[['مجمل الربح بالقوائم',6414.873,'مليون ج.م'],['صافي كاش التشغيل',1456.754,'مليون ج.م']],risk:'ربح مساهمي الأم 4,345.7 مليون مقابل 4,083.4 مليون. ربح المجموعة 4,708.9 مليون يشمل 363.2 مليون للأقلية. مجمل الربح بالقوائم 6,414.9 مليون وهامشه 27.5% مقابل 32.2%؛ إصدار الإدارة يعرض 7,614.1 مليون و32.6% بتصنيف مختلف، فلا نخلط المقياسين.',change:'تابع الهامش والتدفق النقدي بنفس تعريف المقارنة، وتحصيلات وتسليمات العقارات وربحية الفنادق من غير الاعتماد على مبيعات أرض غير متكررة. صافي كاش التشغيل أقل من ربح المجموعة، فالنمو المحاسبي وحده مش دليل على كاش متاح للتوزيع.',method:'مجموع أجزاء: تدفقات التطوير والأرض والفنادق والأصول التجارية، مع الدين والأقلية ومنع عد نفس الأصل مرتين. لا نضرب EPS القديم في مضاعف بعد منحة غيرت عدد الأسهم.',missing:'تدفقات كل مشروع وتكلفة الإكمال والتزامات الأرض وتقييم الفنادق وافتراضات خصم مبررة. القوائم تؤكد تنفيذ المنحة 7 أكتوبر: الأسهم ارتفعت من 1,130,473,523 إلى 3,650,130,360. EPS لنفس الـ9 شهور بعد المنحة 1.19 بدل 3.84 قبلها؛ ده تعديل عدد أسهم مش انهيار في الربح. نراجع أي إجراءات لاحقة قبل تقييم بتاريخ اليوم.',source:'https://foudalens.com/disclosures/ORHD.CA/financial_statement/2026-11-11_297369_2.pdf',pages:'القوائم: PDF 4 و5 و8، وإيضاح 12 بصفحة 14 وإيضاح 36 بصفحة 26',extra:'https://foudalens.com/disclosures/ORHD.CA/financial_statement/2026-11-11_297371_2.pdf',note:'كاش التشغيل قبل الفايدة والضريبة 3,564.6 مليون؛ بعد فايدة مدفوعة 958.1 وضريبة 1,149.7 يبقى الصافي 1,456.8 مليون. شراء أصول ومشروعات 2,049.6 مليون، والفرق سالب 592.9 مليون. ده جسر حسابي للفترة، مش تدفق حر مستدام ولا تقييم. رصيد الميزانية: قروض 12,993.8 مليون، وكاش 10,299.1 وأذون 673.6 واستثمارات حالية 178.0؛ تسوية بسيطة 1,843.1 مليون قبل قيود السيولة. التزامات الأرض 6,422.6 مليون منفصلة وتتعالج داخل تدفقات المشروعات بلا عد مرتين.'}
};
const num=(n:number)=>n.toLocaleString('en-GB',{maximumFractionDigits:1});
function FinancialStudy({symbol}:{symbol:string}){const r=records[symbol];if(!r)return null;const max=Math.max(r.revenue,r.prior||0);return <section className="fin-study" aria-label={'التحليل المالي '+symbol}><div className="bf-head"><h3>{r.name} · الأداء المالي</h3><span>9 شهور · 30 سبتمبر 2026</span></div><p className="fin-thesis">{r.tag}</p><div className="fin-key"><div><small>الإيراد</small><b dir="ltr">{num(r.revenue)}</b><em>مليون ج.م</em></div><div><small>ربح مساهمي الأم</small><b dir="ltr">{num(r.profit)}</b><em>مليون ج.م</em></div><div><small>صافي / إيراد*</small><b dir="ltr">{r.margin}%</b><em>للفترة، مش سنوي</em></div></div>{r.prior&&<div className="fin-compare"><div className="fin-comp-head"><b>الإيراد · نفس الـ9 شهور</b><span dir="ltr">+{((r.revenue/r.prior-1)*100).toFixed(1)}%</span></div>{[[2026,r.revenue],[2025,r.prior]].map(([y,v])=><div className="fin-bar" key={y}><span>{y}</span><u><i style={{width:(v/max*100)+'%'}}/></u><b dir="ltr">{num(v)}</b></div>)}</div>}<div className="fin-facts">{r.facts.map(([label,value,unit]:any)=><div key={label}><small>{label}</small><b dir="ltr">{num(value)}</b><span>{unit}</span></div>)}</div><details open={symbol==='PHAR'}><summary>جودة الربح والمخاطر</summary><p>{r.risk}</p>{r.note&&<p>{r.note}</p>}<p className="eg-note">*قسمة ربح الأم على إيراد المجموعة توضيح تقريبي، مش هامش قطاع موحد. لا تقارن شركة مالية بمصنع بنفس المقياس.</p></details><div className="fin-value"><span>نطاق القيمة العادلة</span><b>غير مكتمل</b><small>مش هنحوّل الربح لمستهدف بمضاعف مختار عشوائيًا.</small></div><details><summary>منهج التقييم والمدخلات الناقصة</summary><p>{r.method}</p><p>{r.missing}</p></details><details><summary>إيه اللي يغيّر القراءة؟</summary><p>{r.change}</p><p>دي متابعة مشروطة، مش أمر شراء أو بيع. مفيش توصية مالية نهائية قبل اكتمال التقييم وربط المخاطر بوضعك.</p></details><details><summary>المصادر وطريقة القراءة</summary><p><a href={r.source} target="_blank" rel="noreferrer">المصدر الأصلي</a> · {r.pages}{r.extra&&<> · <a href={r.extra} target="_blank" rel="noreferrer">مصدر مكمل</a></>}</p><p>مراجعة 24 نوفمبر 2026. الأرقام بالمليون ومقربة من بيانات الشركة المجمعة. مش أرقام محفظتك. نمو الإيراد محسوب من نفس الفترة السابقة، مش مقارنة بربع سنة. إصدار النتائج ومقاييس الإدارة مميزين عن بنود القوائم.</p></details></section>}

function invalidCandles(s:any){return Array.isArray(s.bars)&&s.bars.some((b:any)=>!Array.isArray(b)||b.length<6||!b.slice(1,6).every(Number.isFinite)||b[3]<=0||b[2]<Math.max(b[1],b[4])-0.00001||b[3]>Math.min(b[1],b[4])+0.00001);}
function Stock({ k }: { k: string }) {
    const s = DATA.stocks[k];
    const [tf, setTf] = useState<TF>('D');
    const [n, setN] = useState(130);
    const trows = React.useMemo(() => s.ok ? mkRows(resample(s.bars, tf)) : [], [k, tf]);
    const [t, setT] = useState({ sma: true, vol: false, rsi: false, macd: false, plan: false, bb: false });
    const tg = (key: keyof typeof t, name: string) => <button type="button" className={'eg-chip' + (t[key] ? ' on' : '')} onClick={() => setT({ ...t, [key]: !t[key] })}>{name}</button>;
    const v = verdict(s);
    if(invalidCandles(s))return <div className="eg-pad"><Link className="eg-back" to="/">← محفظتي</Link><h2 className="eg-h">{s.name} <L>{k}</L></h2><Price v={s.close}/><DataAge date={s.date}/><section className="holding-context" role="status"><h3>مراجعة جودة بيانات الشموع</h3><p>المصدر فيه جلسات فتحها أو إقفالها خارج الأعلى والأدنى. وقفنا الشموع وATR وADX ومستويات الدخول والوقف والاختبارات المعتمدة عليها لحد تصحيح المصدر. الرسم تحت للإقفال فقط، مش شموع مصححة بالتخمين. اختلاف المصدر لا يعني إن السهم نفسه فيه مشكلة.</p></section><Det title="الشارت" open><StockChart rows={mkRows(s.bars) as any} n={130} t={{sma:true,vol:false,rsi:false,macd:false,plan:false,bb:false}} plan={{entry:0,stop:0,target:0,trail:0}} closeOnly/><p className="eg-note">المتوسطات مبنية على الإقفال المتاح، مش تقييم للشركة ولا أمر تداول. بيانات الإقفال نفسها محتاجة مقارنة بتاريخ المصدر قبل الاعتماد.</p></Det><Det title="دراسة الشركة · الأداء المالي والتقييم">{k==='BONY'?<BonyFundamentals/>:<FinancialStudy symbol={k}/>}</Det></div>;
    return <div className="eg-pad">
        <Link className="eg-back" to="/">← محفظتي</Link>
        <div className="eg-in">
            <h2 className="eg-h">{s.name} <span dir="ltr">({k})</span></h2>
            {s.qualityChecked&&<p className="eg-note">إقفال <L>{s.date}</L> · <L>{s.historyCount}</L> جلسة من <a href={s.source} target="_blank" rel="noreferrer">{s.sourceName}</a>. المصدر اتغير بعد اكتشاف عيوب شموع المصدر السابق، والمؤشرات اتعادت على نفس التاريخ المتسق. المقارنة مش تحقق مستقل من كل صفقة.</p>}
            <PartialHistory s={s}/>
            {s.partial&&s.bars?.length>1&&<Det title="الشارت المتاح" open><StockChart rows={mkRows(s.bars) as any} n={s.bars.length} t={{sma:true,vol:true,rsi:false,macd:false,plan:false,bb:false}} plan={{entry:0,stop:0,target:0,trail:0}}/></Det>}
            <Det title="دراسة الشركة · الأداء المالي والتقييم">{k==='BONY'?<BonyFundamentals/>:<FinancialStudy symbol={k}/>}</Det>
            {!s.ok ? <p className="eg-note">{s.partial?'نافذة تاريخ متاحة جزئيًا، والتفاصيل تحت بتوضح المؤشرات الممكنة.':'المصدر المجاني معندوش تاريخ كفاية للسهم ده، فمفيش تقييم.'} السعر حوالي <L>{fmt(s.close)}</L>.</p> : <>
                <div className="eg-top2"><Price v={s.close} /><span className={'eg-chg ' + (s.chg20 >= 0 ? 'u' : 'd')}>شهر <L>{pc(s.chg20)}</L></span></div>
                <div className={'eg-verdict eg-v-' + v.c}><div><b>{v.t}</b><p>{reason(s)}</p></div></div>
                <Det title="الشارت" open>
                    <div className="eg-chips">{(['D', 'W', 'M'] as TF[]).map(x => <button type="button" key={x} className={'eg-chip' + (tf === x ? ' on' : '')} onClick={() => { setTf(x); setN(RANGES[x][1][1]); }}>{TF_AR[x]}</button>)}</div>
                <div className="eg-chips">{RANGES[tf].filter(([,b])=>b<=trows.length).concat([['المتاح كله',trows.length]] as [string,number][]).map(([a, b]) => <button type="button" key={a} className={'eg-chip eg-sm' + (n === b ? ' on' : '')} onClick={() => setN(b)}>{a}</button>)}</div>
                <p className="eg-note">الشمعة = {tf === 'D' ? 'يوم تداول' : tf === 'W' ? 'أسبوع تداول' : 'شهر تداول'}. مفيش شارت لحظي (دقائق/ساعات) لأن البيانات المجانية آخر اليوم بس. اختيار الأسبوعي أو الشهري بيغيّر الرسم ومؤشراته فقط؛ التقييم والسيناريو فوق بيفضلوا على اليومي. الرسم يعرض آخر 900 جلسة كحد أقصى، بينما حسابات التقييم اليومي تستخدم حتى 5 سنين من المصدر. كل مدى ظاهر متاح فعلًا للسهم.</p>
                <StockChart key={k + tf} rows={trows} n={n} t={t} plan={s.plan} />

                <div className="eg-chips">{tg('plan', 'مستويات السيناريو')}{tg('sma', 'متوسطات')}{tg('vol', 'حجم')}{tg('bb', 'بولينجر')}{tg('rsi', 'RSI')}{tg('macd', 'MACD')}</div>
                <Det title="افهم الشارت والألوان">
                    <p>الخط الفاتح = سعر الإقفال. لو اخترت شموع: الجسم بين الفتح والإقفال، والخيط بين أعلى وأقل سعر. الأخضر إقفال أعلى من الفتح، والأحمر العكس.</p>
                    <p>البرتقالي متوسط 50 شمعة، والأزرق متوسط 200 شمعة على الإطار المختار. خطوط الخطة اختيارية: أزرق دخول مشروط، أحمر وقف بعد الدخول، أخضر وقف متحرك مرجعي، مش هدف ربح.</p>
                    <p>الأرقام أعلى الشارت تخص الفترة اللي اخترتها: فتح، أعلى، أقل، إقفال، والتغير من الفتح للإقفال. الحجم عدد الأسهم المتداولة. RSI مقياس زخم من 0 لـ100، مش نسبة ربح متوقعة.</p>
                </Det>
                <Evidence s={s} />
                <Det title="الفريم ومدة المتابعة">
                    <p>التقييم والسيناريو مبنيين على شمعة يومية بعد إقفال الجلسة. ده أقرب لمتابعة موجة على أيام أو أسابيع (سوينج)، مش سكالبينج أو شراء وبيع جوه نفس الجلسة، ومش تقييم استثمار طويل الأجل.</p>
                    <p>الاتجاه من متوسط 50 و200 جلسة. السيناريو من متوسط أُسّي 20 جلسة أو أعلى 20 جلسة. الزخم من RSI 14 وMACD 12/26/9، والتذبذب من ATR 14.</p>
                    <p>مفيش عدد أيام بعدها الربح يبدأ. جدول التجربة بيقيس النتيجة بعد 10 جلسات تداول، مش 10 أيام تقويمية، وده أفق اختبار بس، مش ميعاد بيع ولا وعد ربح. ممكن الخسارة تحصل قبلها أو بعدها.</p>
                    <p>التطبيق مش بيتابع مركزك أو تاريخ دخولك، ومش بيحسب مدة احتفاظ شخصية أو جني أرباح آلي. رقم الوقف المتحرك مرجع يومي بيتحسب من جديد، مش وقف محفوظ لصفقتك.</p>
                </Det>
                <Det title="سيناريو صفقة محتملة، مش أمر دخول">
                    <p className="eg-note">المستويات دي لصفقة مستقبلية لو شروطها اتحققت، مش لإدارة أسهم إنت مالكها. الحالة الحالية: {v.t}. الوقف محسوب من الدخول المحتمل، مش من إقفال النهارده، فممكن يكون أعلى من السعر الحالي.</p>
                    <Plan3 s={s} />
                    <p className="eg-note">{s.plan.mode === 'pullback' ? 'السيناريو مستني تراجع للسعر الموضح وتأكيد ارتداد، مش شراء بالسعر الحالي.' : 'السيناريو مستني اختراق المستوى الموضح وتأكيده، مش شراء بالسعر الحالي.'} الوصول للمستوى لوحده مش إشارة كفاية.</p>
                    <p className="eg-note">مرجع متغير يوميًا، مش وقف محفوظ لمركزك: <L>{fmt(s.plan.trail)}</L>. بيتحسب من أعلى إقفال في 22 جلسة ناقص 3 أضعاف ATR اليومي، وممكن ينزل مع إعادة الحساب. التطبيق لا ينفّذ خروجًا.</p>
                </Det>
                {s.plan.tv < 1 && <p className="eg-note eg-warn">السيولة ضعيفة (حوالي {s.plan.tv} مليون جنيه في اليوم).</p>}

                <p className="eg-note">المس الشارت لاختيار يوم، أو حرّك المؤشر تحته. اسحب الشارت للماضي وكبّر بإصبعين. الأزرق متوسط 200 شمعة والبرتقالي متوسط 50 شمعة على الفريم المختار.</p>

                
                </Det>
                <Det title="ليه الحكم ده؟">
                    <div className="eg-why">{why(s).map((w, i) => <div key={i} className="eg-w" style={{ animationDelay: i * 50 + 'ms' }}><span className={w.ok ? 'ok' : 'no'}>{w.ok ? '✓' : '✗'}</span>{w.t}</div>)}</div>
                <Ex>{X.why()}</Ex>
                {s.fire.length > 0 && <div className="eg-fire">إشارة جديدة النهارده: {s.fire.map((f: string) => RULE_AR[f]).join(' + ')}</div>}

                
                </Det>
                <Det title="طريقة حساب السيناريو والمخاطرة">
                    <Ex>{X.plan(s)}</Ex>
                </Det>
                <Det title="المؤشرات بالتفصيل">
                    <div className="eg-grid2">
                    <div className="eg-m"><span>RSI</span><b dir="ltr">{s.rsi}</b><i>من 0 لـ100. فوق 70 مبالغ، تحت 30 مبالغ في النزول.</i></div>
                    <div className="eg-m"><span>التذبذب اليومي</span><b dir="ltr">{s.plan.atrpct}%</b><i>الحركة المعتادة في اليوم. بنقيس بيها الوقف.</i></div>
                    <div className="eg-m"><span>قوة الاتجاه ADX</span><b dir="ltr">{s.plan.adx}</b><i>{s.plan.adx >= 25 ? (s.plan.pdi_gt ? 'اتجاه صاعد قوي.' : 'اتجاه هابط قوي.') : 'فوق 25 يبقى فيه اتجاه واضح. دلوقتي السوق متردد.'}</i></div>
                    <div className="eg-m"><span>مكانه في بولينجر</span><b dir="ltr">{s.plan.bbpos}%</b><i>0% عند الحد الأدنى للنطاق المعتاد و100% عند الأعلى. الأطراف بتدل على مبالغة.</i></div>
                    <div className="eg-m"><span>أعلى 20 يوم</span><b dir="ltr">{fmt(s.plan.res)}</b><i>مقاومة: لو اتخطاها السعر بيبقى اختراق.</i></div>
                    <div className="eg-m"><span>أقل 20 يوم</span><b dir="ltr">{fmt(s.plan.sup)}</b><i>دعم: لو اتكسر ده سلبي.</i></div>
                </div>
                <Ex label="اشرحلي RSI">{X.rsi(s)}</Ex>
                <Ex label="اشرحلي التذبذب (ATR)">{X.atr(s)}</Ex>
                <Ex label="اشرحلي ADX">{X.adx(s)}</Ex>
                <Ex label="اشرحلي بولينجر">{X.bb(s)}</Ex>
                <Ex label="اشرحلي الدعم والمقاومة">{X.sr(s)}</Ex>
                <Ex label="اشرحلي MACD">{X.macd()}</Ex>

                
                </Det>
                <Det title="اختياري: التجربة على الماضي (اضغط للإظهار)">
                    <p className="eg-note">اختبار منفصل: دخول على فتح الجلسة التالية، وقياس عند إقفال الجلسة العاشرة بعد الإشارة، بعد خصم 1% تكلفة. مش اختبار السيناريو المعروض ولا توصية بمدة احتفاظ. متوسط أي يوم عشوائي <L>{pc(s.base)}</L>.</p>
                <table className="eg-tbl"><thead><tr><th>القاعدة</th><th>مرات</th><th>كسب</th><th>متوسط</th></tr></thead><tbody>
                    {Object.keys(s.bt).map(r => <tr key={r}><td>{RULE_AR[r]}</td><td>{s.bt[r].n}</td><td>{s.bt[r].win == null ? '-' : s.bt[r].win + '%'}</td><td dir="ltr">{s.bt[r].avg == null ? '-' : pc(s.bt[r].avg)}</td></tr>)}
                </tbody></table>
                <Ex>{X.bt(s)}</Ex>
                <p className="eg-note eg-warn">العينة صغيرة (غالبًا أقل من 40 مرة) والنتايج مش ثابتة بين الأسهم. الماضي مش ضمان. كمان التقييم من 100 نفسه ما اتثبتش قدرته على التنبؤ في الاختبار.</p>
            
                </Det>
                <p className="eg-note eg-foot">مش نصيحة استثمار ولا ضمان. السعر ممكن يكسر الوقف بفجوة.</p>
            </>}
        </div>
    </div>;
}

function Market() {
    const f = DATA.flows;
    const num = (x: string) => { const m = /([+-]?)([\d.]+)([MB])/.exec(x); return m ? (m[1] === '-' ? -1 : 1) * parseFloat(m[2]) * (m[3] === 'B' ? 1000 : 1) : 0; };
    const rows = f ? [['المصريين', f.egy], ['العرب', f.arab], ['الأجانب', f.foreign]] : [];
    const mx = Math.max(1, ...rows.map(r => Math.abs(num(r[1]))));
    return <div className="eg-pad eg-in">
        <h2 className="eg-h">حركة السوق (أسهم بس)</h2>
        {f ? <>
            <p className="eg-lead">صافي الشراء النهارده في الأسهم فقط بالجنيه (M = مليون). لقطة من foudalens يوم 24-11-2026 أثناء الجلسة، والأرقام بتتغير لحد الإغلاق:</p>
            {rows.map(([a, b], i) => { const nv = num(b); return <div key={a} className="eg-flow"><div className="eg-fl"><span>{a}</span><b dir="ltr" className={nv < 0 ? 'd' : 'u'}>{b}</b></div><div className="eg-bar"><i className={nv < 0 ? 'd' : 'u'} style={{ width: (Math.abs(nv) / mx * 100) + '%', animationDelay: i * 120 + 'ms' }} /></div></div>; })}
            <Ex>{X.flow()}</Ex>
            <p className="eg-note">{num(f.foreign) < 0 ? 'الأجانب بيبيعوا صافي والمحليين بيشتروا، يعني السوق ماسكه محليين.' : 'الأجانب بيشتروا صافي، ده بيدعم السوق عادة.'}</p>
            <p className="eg-note eg-warn">تحذير: حوالي 95% من قيمة التداول اليومية أذون خزانة، فرقم "المؤسسات" الإجمالي مش بيقول حاجة عن الأسهم. وحركة المؤسسات لكل سهم لوحده مش متاحة مجانًا، والحركة دي لقطة اليوم من غير تاريخ ومش مختبرة.</p>
        </> : <p className="eg-note">مقدرتش أقرا حركة السوق وقت التحديث.</p>}
    </div>;
}

function About() {
    return <div className="eg-pad eg-in">
        <h2 className="eg-h">عن التطبيق وحدوده</h2>
        <p className="eg-note eg-warn">أداة مراقبة مش ضمان ربح، ومش هتسبق السوق بشكل مضمون. التجربة على الماضي ما طلعتش بقاعدة بسيطة ليها ميزة ثابتة على الأسهم الستة.</p>
        <h3 className="eg-h3">حدود البيانات</h3>
        <ul className="eg-ul">
            <li>أسعار مجانية من مصدر واحد لحد آخر إقفال كامل (<L>{DATA.stocks.MASR.date}</L>). التطبيق بيتحدث تلقائيًا كل يوم بعد الإقفال، ولو المصدر المجاني معداش بيفضل على آخر بيانات سليمة.</li>
            <li>الشاشة دي بتستخدم إقفال يومي، ومبتعرضش أسعار اللحظة.</li>
            <li>الفريمات يومي وأسبوعي وشهري بس، لأن المصدر المجاني إقفال يومي (مفيش داخل اليوم).</li>
            <li>المؤشرات (المتوسطات وRSI وMACD وبولينجر وADX وATR) بتتحسب جوه التطبيق، وكل واحد فيه زرار "اشرحلي".</li>
            <li>التاريخ الحالي من Starta Markets، مع فحوص اتساق الشموع والتواريخ. ده مش تدقيق مستقل لكل صفقة ولا ضمان لتسويات كل إجراء رأسمالي.</li>
            <li>بنيان تاريخها المتاح أقصر من باقي الأسهم، لكن عندها أكثر من 200 جلسة. مفيش دمج مع تاريخ المصدر السابق.</li>
        </ul>
        <h3 className="eg-h3">إزاي بنحسب الخطة والقوة</h3>
        <ul className="eg-ul">
            <li><b>القوة من 100:</b> اتجاه طويل 25، اتجاه متوسط 20، MACD 20، RSI صحي 15، حجم 10، وإشارة جديدة 10.</li>
            <li><b>فريم التقييم:</b> يومي بعد الإقفال. متابعة موجة أيام/أسابيع، من غير مدة ربح مضمونة. فريم الشارت لا يغيّر التقييم.</li>
            <li><b>مستويات مرجعية:</b> الوقف الافتراضي = الدخول المحتمل ناقص 2.5 ATR. المرجع المتغير = أعلى إقفال 22 جلسة ناقص 3 ATR. التطبيق لا يحفظ مركزًا أو وقفًا متحركًا لصفقة، ولا ينفذ بيعًا بعد 60 جلسة أو عند أي مستوى.</li>
            <li><b>الدخول:</b> تراجع لمتوسط 20 يوم لو السعر فوقه، وإلا اختراق أعلى 20 يوم.</li>
        </ul>
        <h3 className="eg-h3">اتختبر ولا لأ؟ (صراحة)</h3>
        <ul className="eg-ul">
            <li>نتائج الاختبارات القديمة مش صالحة كدليل بعد اكتشاف عيوب في شموع المصدر السابق. الأرقام المعروضة حاليًا تجارب على التاريخ الجديد، مش وعد ربح ولا إثبات تفوق على السوق.</li>
            <li>لازم حساب تكاليف التداول وفروق الأسعار ومراجعة فترات خارج العينة قبل الاعتماد. القوة ترتيب متابعة، مش احتمال ربح.</li>
        </ul>
        <h3 className="eg-h3">محتاج إيه عشان نبقى أدق؟</h3>
        <ul className="eg-ul"><li>مصدر تاريخ تاني، وحركة المؤسسات لكل سهم.</li></ul>
    </div>;
}

const ENCRYPTED_PORTFOLIO:any = {"v":1,"iterations":600000,"salt":"tnUEv7WCzZzCVeSTebL0Vg==","iv":"S/ADps5QTp2zkhvd","data":"S3ROCkhvvc354uD9hBAACaVMOPXQrLaWbsI/q0fhTvGlHrVIsy6RoTRtia4meHqByFX9kyKvQWYBIvnrviJNPyjgrydsiY/I75fwVFSciAu1Nn755lbxiuhXqrtA390Pw+MxegCf9COV4bslCnATxy1SY55ZQu0iK33M2FtLgtwxYcbJqafarqgy4aHC/Q0cXn7TvxpmtQUdCaYq2kUCrJPDHQ8rYZ/NSD7cLArDMHOoxKpE5b6ePLzljiTquWFiGRf4T4fSKpLgpdL30zuSqynoL4g4DVOIbyM+7Qrbwrie3BJvmYQDhmZDSN4eOLuraZFLutJq9iASGRaMsGuy46Z4oTO3StPS47nkT7T/DqW1PcGMISqx9clGAAFl8q4dWdCjQ6ni4OmD3OxAK53U8U7hctjjvfbIABZXmOBvcuhjMw/zFtgILqKx8Cde+6KdhuO0Ia1VbVGJBGIdtfbPT65YF37GG5pT77yabY+uBRgKsFQPjjRirD7D8Tjq8Q0lbq6jNd7IeuLiz73cAAtBMvprkZAjiAwbvU3X3SHkPY3gD9AOxRQMejBgkGF5xVbwbvfrtuYYl+CFKlLPm2L7KRL62f+SOzhktoAMTMvw/G7dUGHHrV+0AJ7jK3U0HLpOGH6UuDnNrcv0h/fslxaVhwbLX0tuahFG+Krr1UEHJU6IIybNJmH4t14qvWsbA4jz0H7BD5yNPa2MN3i+sybuZmjA3ouQA30+MOqTCLvFub2NAER16TPEsI8sHkC832Tse/BD/mVOYpSHQdASnTbWdj5ZJc5ohOX49LKtR2/s2WJao0g2rMd1ohDr0+OLKBfAZTyyoAxgaSjpPL/zxe218imRr99/k74kNwNaoWpoAq4T//ARgl9D3u020u8ezOSmFe6Q1hVyjvXhOLSsyJmSPAAZ46qiNFlbicT4R3bpQzt9E998TN7OtAJiIUrulNRHR1c3y1+id1bRv+w6VtwZ4yGlW692tpQSEXW9HNrChXRjPsopfs+Jqkr+W8SoEYSK+uXmd6XK1/Mrqsr5y5wUWusIKKjUTYYoaxONH7A3CLGSPynxcfl9I048rGOYNsxi+9KwkUnrJ1uPc7FCiXDlphdRBdGky/FSjLbFWFdw7xz/GCgPMRXO1AdtqMmDJ7ISpCCyDkCIy+wc6R3NMOeFZI440X3NzhskIAAAMxmKYT/8JapzhX+YiD1Itpr9mx3TfsnNM6gzgB+qznbH4BQalAaBo++WYg4bBxGa7SI74lodAj7vHvTbkE7tLMZ+dGjZ/AMfySqNyrau9bv2VmIHrIvNKNGFGlxVMS8WYBPfVnRSTAtiyIECgBt83OfzXFUwarf/RTuawFXyj5MsjIgvSInh65T6y2r8qbqxtczn8zCR268ZFmUPLQ8PY0ZCejuY6jQa"}; // ENCRYPTED_BLOB
const PORTFOLIO_KEY = 'egx-private-portfolio-v1';
function parsePortfolio(x:any) {
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
function consumeSetupFragment() {
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
function calendarAge(date:unknown,now=new Date()) {
    if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date))return null;
    const t=Date.parse(date+'T00:00:00Z');
    if(!Number.isFinite(t)||new Date(t).toISOString().slice(0,10)!==date)return null;
    const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Cairo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
    const v=(type:string)=>day.find(p=>p.type===type)!.value;
    return Math.round((Date.parse(v('year')+'-'+v('month')+'-'+v('day')+'T00:00:00Z')-t)/86400000);
}
function DataAge({date}:{date:any}) {
    const age=calendarAge(date);
    return <p className="data-age" role="note">{age===null?'تاريخ الإقفال غير متاح؛ حداثة البيانات غير معروفة.':age<0?'تاريخ الإقفال بعد تاريخ جهازك؛ راجع ساعة الجهاز والمصدر.':<>عمر الإقفال <L>{age}</L> يوم تقويمي حسب توقيت القاهرة. {age>3?'البيانات أقدم من 3 أيام؛ قارن التاريخ بالمصدر قبل الاعتماد عليها.':'مش سعر مباشر، ومش تأكيد إنه أحدث جلسة.'}</>} أيام تقويمية، مش جلسات فائتة. العطلات غير متحققة.</p>;
}
function averagePosition(s:any,n:number) {
    if(!Array.isArray(s.bars)||s.bars.length<n)return s.partial?'المتاح أقل من '+n:'غير متاح';
    const closes=s.bars.slice(-n).map((r:any)=>r[4]);
    if(!Number.isFinite(s.close)||closes.some((v:any)=>!Number.isFinite(v)||v<=0))return 'غير متاح';
    const avg=closes.reduce((a:number,b:number)=>a+b,0)/n;
    return Math.abs(s.close-avg)<1e-8?'يساوي':s.close>avg?'فوق':'تحت';
}
function PortfolioVisual({holdings}:{holdings:any[]}) {
    const [selected,setSelected]=useState<string|null>(null);
    return <section className="pv-board" aria-label="لوحة المحفظة"><div className="pv-title"><h3>محفظتك في لقطة</h3><span>إقفالات يومية · مش مباشر</span></div><p className="pv-label">الرسوم: آخر 50 جلسة · النسبة: تغيّر 5 جلسات</p><div className="pv-grid">{[...holdings].sort((a,b)=>b.weight-a.weight).map(h=>{const s=DATA.stocks[h.symbol],bars=s.bars||[],change=s.chg5;return <button type="button" key={h.symbol} className={'pv-card '+(selected===h.symbol?'pv-active':'')} onClick={()=>setSelected(selected===h.symbol?null:h.symbol)} aria-expanded={selected===h.symbol}><div className="pv-top"><b dir="ltr">{h.symbol}</b><span>{h.weight.toFixed(1)}%<small> وزن اللقطة</small></span></div><div className="pv-price"><b dir="ltr">{fmt(s.close)}</b><small>ج.م</small><span className={change>=0?'pv-up':'pv-down'} dir="ltr">{change>=0?'↗':'↘'} {Number.isFinite(change)?pc(change):'—'}</span></div><div className="pv-spark">{bars.length>1?<Spark vals={bars.slice(-50).map((r:any)=>r[4])} up={change>=0}/>:<small>تاريخ قصير</small>}</div><div className="pv-foot"><span>{s.partial?'نافذة جزئية':averagePosition(s,50)==='فوق'?'فوق متوسط 50':'تحت متوسط 50'}</span><small dir="ltr">{s.date||'—'}</small></div></button>;})}</div>{selected&&(()=>{const s=DATA.stocks[selected];return <div className="pv-expanded"><b><L>{selected}</L> · مؤشرات وصفية</b><Link className="desk-open" to={"/"+selected.toLowerCase()}>افتح صفحة السهم والشارت ←</Link><div className="holding-signals"><div><small>السعر / متوسط 50</small><b>{averagePosition(s,50)}</b></div><div><small>السعر / متوسط 200</small><b>{averagePosition(s,200)}</b></div><div><small>الحجم / السابق 20</small><b>{Number.isFinite(s.volx)?Math.round(s.volx*100)+'% من المعتاد':'غير متاح'}</b></div><div><small>أداء 5 جلسات</small><b dir="ltr">{Number.isFinite(s.chg5)?pc(s.chg5):'غير متاح'}</b></div></div><button type="button" className="eg-chip" onClick={()=>{const el=document.getElementById('held-'+selected);el?.scrollIntoView({block:'start'});el?.focus({preventScroll:true});}}>التفاصيل والتكلفة ←</button><Det title="يعني إيه الحجم من المعتاد؟"><p className="eg-note">بنقارن عدد أسهم آخر جلسة بمتوسط الـ20 جلسة اللي قبلها. <L>0.3× = 30%</L> من المعتاد، يعني حوالي التلت. <L>0.5×</L> يعني النص، و<L>0.2×</L> يعني الخُمس. ده نشاط تداول أقل، مش دليل لوحده على اهتمام الناس أو اتجاه السعر. الأرقام تخص تاريخ الإقفال، مش النهارده مباشر.</p></Det></div>;})()}</section>;
}
function HoldingComparison({holdings}:{holdings:any[]}) {
    return <section className="portfolio-overview" aria-label="مقارنة الاتجاه" id="holding-comparison" tabIndex={-1}><h3>الاتجاه في نظرة</h3><p className="eg-note">السعر فين من متوسطه؟ مقارنة وصفية، مش ترتيب أفضلية. مرتبة بالرمز. اضغط الرمز لفتح تفاصيله.</p><table className="holding-compare"><thead><tr><th>السهم / الإقفال</th><th>متوسط<br/>50 جلسة</th><th>متوسط<br/>200 جلسة</th><th>الحجم<br/>× المعتاد</th></tr></thead><tbody>{[...holdings].sort((a,b)=>a.symbol.localeCompare(b.symbol)).map(h=>{const s=DATA.stocks[h.symbol];const age=calendarAge(s.date);return <tr key={h.symbol}><th scope="row"><button type="button" onClick={()=>{const el=document.getElementById('held-'+h.symbol);el?.scrollIntoView({block:'start'});el?.focus({preventScroll:true});}}><L>{h.symbol}</L></button><small><L>{s.date||'غير متاح'}</L></small>{(age===null||age<0||age>3)&&<small>راجع التاريخ</small>}</th><td>{averagePosition(s,50)}</td><td>{averagePosition(s,200)}</td><td>{(s.ok||s.partial)&&s.bars?.length>=21&&Number.isFinite(s.volx)?<L>{s.volx.toFixed(1)}×</L>:'غير متاح'}</td></tr>;})}</tbody></table><p className="eg-note">كل سهم مقارن بمتوسطاته هو، مش بسهم تاني. الحجم مقارنة بمتوسط 20 جلسة سابقة للسهم نفسه. فوق أو تحت مش تقييم لجودة الشركة، والصفوف مش أدلة مستقلة. الناقص ظاهر كغير متاح.</p></section>;
}
function PartialHistory({s}:{s:any}) {
    if(!s.partial)return null;
    return <section className="holding-context" aria-label="نافذة التاريخ المتاح"><h3>{s.name} · قراءة على قد التاريخ المتاح</h3><p>المصدر هنا موفر <L>{s.historyCount}</L> جلسة لحد <L>{s.date}</L>، مش كل تاريخ السهم. دي نافذة المصدر البديل بعد عيوب في شموع المصدر السابق، مش كل تاريخ التداول ولا عيب في السهم.</p><div className="holding-signals"><div><small>السعر / متوسط 50</small><b>{averagePosition(s,50)}</b></div><div><small>السعر / متوسط 200</small><b>المتاح أقل من 200 جلسة</b></div><div><small>حجم آخر جلسة / السابق 20</small><b><L>{s.volx}×</L></b></div><div><small>تغيّر آخر 5 جلسات</small><b><L>{pc(s.chg5)}</L></b></div></div><p className="eg-note">متوسط 50 مدعوم بعدد الجلسات المتاحة. متوسط 200 غير محسوب، ومش بنستبدله بمتوسط أقصر. مفيش متوسط 200 أو MACD أو اختبار تاريخي أو مستويات دخول/وقف من النافذة القصيرة دي. <a href={s.source} target="_blank" rel="noreferrer">مصدر البيانات: {s.sourceName}</a>. تحقق من اختلافات التسوية قبل مقارنة التكلفة.</p></section>;
}
function HoldingContext({h,s,maxWeight}:{h:any;s:any;maxWeight:number}) {
    const distance=Number.isFinite(h.averageCost)&&h.averageCost>0&&Number.isFinite(s.close)&&s.close>0?100*(s.close/h.averageCost-1):null;
    return <section className="holding-context" aria-label="قراءة مركزك">
        <div className="evidence-head"><b>قراءة مركزك</b><small>إقفال <bdi dir="ltr">{s.date}</bdi></small></div>
        <DataAge date={s.date}/><PartialHistory s={s}/>
        <p>{distance===null?'متوسط التكلفة مش متاح.':<>الإقفال {distance<0?'أقل':'أعلى'} من متوسطك بـ <L>{Math.abs(distance).toFixed(1)}%</L>. </>}{s.ok?<>حالة الاتجاه: <b>{verdict(s).t}</b>. التكلفة بتشرح فرق السعر، مش بتغيّر قراءة الاتجاه.</>:'التاريخ المجاني مش كافي لقراءة الاتجاه.'}</p>
        {s.ok&&<><div className="holding-signals"><div><small>اتجاه 50 جلسة</small><b>{s.votes.mid?'السعر فوقه':'السعر تحته'}</b></div><div><small>اتجاه 200 جلسة</small><b>{s.votes.trend?'السعر فوقه':'السعر تحته'}</b></div><div><small>الزخم MACD</small><b>{s.votes.macd?'فوق خط الإشارة':'تحت خط الإشارة'}</b></div><div><small>حجم التداول</small><b><L>{s.volx}×</L> المعتاد</b></div></div>
        <p className="holding-take">الخلاصة: {s.votes.mid&&s.votes.trend?'الاتجاه فوق المتوسطين':!s.votes.mid&&!s.votes.trend?'الاتجاه تحت المتوسطين':'الاتجاه مختلف بين الأجلين'}، والزخم {s.votes.macd?'فوق':'تحت'} خطه؛ {s.votes.vol?'الحجم أعلى من المعتاد مع إقفال صاعد.':'الحجم لا يحقق شرط تأكيد الصعود.'} دي قراءة الوضع، مش توصية تتصرف في مركزك.</p></>}
        <div className="weight-track" role="img" aria-label={'وزن اللقطة '+h.weight.toFixed(2)+' بالمئة'}><span style={{width:h.weight+'%'}}/></div>
        <p className="eg-note">{h.weight===maxWeight?'ده من أكبر الأوزان في اللقطة. ':''}وزنه <L>{h.weight.toFixed(2)}%</L> في لقطة 24 نوفمبر 07:58، مش وزن لحظي. حركة السهم ±10% تعني تقريبًا ±<L>{(h.weight/10).toFixed(2)}%</L> من قيمة جزء الأسهم وقتها، لو الباقي ثابت. ده قياس حساسية، مش توقع.</p>
        {s.ok&&<Det title="إيه اللي يغيّر قراءة السهم ده؟"><p>{s.votes.mid?'إقفال يرجع تحت متوسط 50 جلسة يغيّر وصف الاتجاه المتوسط.':'إقفال جديد فوق متوسط 50 جلسة يغيّر وصف الاتجاه المتوسط.'} {s.votes.trend?'إقفال تحت متوسط 200 جلسة يغيّر وصف الاتجاه الطويل.':'إقفال فوق متوسط 200 جلسة يغيّر وصف الاتجاه الطويل.'}</p><p>المتوسطات بتتغير مع كل جلسة. لمسها أثناء التداول مش إقفال. الرجوع لمتوسط شرائك لوحده مش تأكيد فني، ولا سبب كافي لقرار. دي شروط وصفية، مش أوامر شراء أو بيع.</p></Det>}
    </section>;
}
function BonyFundamentals(){
    const release='https://ir.bonyanegypt.com/files/Bonyan%20Earnings%20Release%20-%209M%202026%20-%20English%20-%2011112026.pdf';
    const fs='https://ir.bonyanegypt.com/files/Bonyan%20-%20Arabic%20Financial%20Statements%20%26%20Auditors%20Report%2030%20Sep%202026.pdf';
    return <section className="bony-fin" aria-label="التحليل المالي لبنيان"><div className="bf-head"><h3>بنيان · تحت الغطا</h3><span>9 شهور · 30 سبتمبر 2026</span></div><div className="bf-metrics"><div><small>إيراد الإيجار</small><b>649 <i>مليون ج.م</i></b><em>↑ 19% سنويًا</em></div><div><small>صافي متكرر*</small><b>219 <i>مليون ج.م</i></b><em>↑ 129% سنويًا</em></div><div><small>صافي معلن</small><b>1,268 <i>مليون ج.م</i></b><em className="bf-down">↓ 30% سنويًا</em></div></div><div className="bf-profit"><b>الأرباح المعلنة مش كلها دخل متكرر</b><div><span>صافي معلن</span><u><i style={{width:'100%'}}/></u><strong>1,268</strong></div><div><span>متكرر*</span><u><i style={{width:(219/1267.8*100)+'%'}}/></u><strong>219</strong></div><small>مليون جنيه · المقارنة مش تسوية محاسبية بين الرقمين</small></div><div className="bf-assets"><div><small>أصول الشركة</small><b>18.258</b></div><span>−</span><div><small>كل الالتزامات</small><b>4.758</b></div><span>=</span><div><small>حقوق الملكية</small><b>13.499</b></div></div><p className="bf-unit">مليار جنيه · فروق تقريب · حقوق ملكية دفترية، مش سعر عادل</p><div className="bf-value"><span>السعر العادل</span><b>لسه غير محسوب</b><small>مش هنحوّل قيمة العقارات لسعر سهم من غير تسوية الالتزامات والتغيرات في الأسهم.</small></div><Det title="اختبار حساسية الأصول، مش سعر مستهدف"><p className="eg-note">القوائم نفسها بتعرض حساسية تقييم العقارات لتغير سعر البيع ±10%. بنطبق نفس الصدمة على رصيد الاستثمار العقاري 16.688 مليار، مع افتراض تغير الضريبة المؤجلة بـ22.5% من فرق التقييم زي معدل إيضاح الضريبة. باقي الأصول والالتزامات ثابتة.</p><div className="fin-facts">{[["عقارات أقل 10%","12.21"],["حقوق الملكية بالقوائم","13.50"],["عقارات أعلى 10%","14.79"]].map(([label,value])=><div key={label}><small>{label}</small><b dir="ltr">{value}</b><span>مليار ج.م</span></div>)}</div><p className="eg-note">المعادلة: 13.499 + (16.688 × نسبة الصدمة × 77.5%). ده ضغط حسابي على حقوق ملكية 30 سبتمبر، مش نطاق قيمة عادلة ولا سعر بيع للأصول. لا يشمل خصم السيولة أو تكلفة التصرف أو تغير الإيجارات أو شراء الخزينة بعد الفترة. لو افتراض الضريبة مختلف، النتيجة تختلف. مش بنضيف فرق GAV المعلن 19 مليار قبل تسويته مع نطاق أصول القوائم، ومش بنقسم على أسهم يومنا قبل التحقق منها.</p></Det><Det title="ليه الأرباح مختلفة؟ وإيه اللي ناقص للتقييم؟"><p className="eg-note">ربح إعادة تقييم العقارات 1,387 مليون جنيه قبل الضريبة، ومش تحصيل كاش. المتكرر 219 مليون مقياس بتعلنه الشركة، بيستبعد بيع الوحدات وإعادة التقييم ومصاريف الطرح غير المتكررة، ومش بند مستقل مدقق. التدفق التشغيلي 516 مليون لكنه يشمل تحصيلات بيع وحدات، مش إيجار بس.</p><p className="eg-note">ضمن الالتزامات ضريبة مؤجلة 3.215 مليار وقروض 824 مليون، فلا نخصمهم تاني من حقوق الملكية. العقارات الاستثمارية بالقوائم 16.688 مليار، بينما تقييم محفظة الشركة الإجمالي المعلن 19 مليار ونطاق مطابقته مع القوائم لسه محتاج تسوية. أي زيادة افتراضية لازم تتراجع مع الضريبة ونطاق الأصول.</p><p className="eg-note">إيضاح رأس المال: حوالي 1.875 مليار سهم في 30 سبتمبر، قيمة اسمية جنيه. بعدها موافقة على زيادة 2% لنظام الإثابة في 12 أكتوبر، وإفصاح شراء خزينة يوصل الإجمالي لـ32 مليون سهم في 5 نوفمبر. الموافقة مش تنفيذ، ومفيش افتراض إن ده آخر وضع يومنا. علشان كده لسه مفيش نطاق سعر عادل ولا مضاعف مضلل مبني على ربح إعادة التقييم.</p><p className="eg-note">المصدر: <a href={release} target="_blank" rel="noreferrer">نتائج الشركة، صفحات 3 و5 و8 و9</a> · <a href={fs} target="_blank" rel="noreferrer">القوائم وإيضاحات 8 و15 و20</a> · <a href="https://foudalens.com/en/news/297121" target="_blank" rel="noreferrer">إفصاح الخزينة 5 نوفمبر</a>. مراجعة المصادر 24 نوفمبر 2026. الأرقام للشركة كلها، مش قيمة محفظتك.</p></Det></section>;
}

function Portfolio() {
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
        <Det title="الحفظ والخصوصية"><p className="eg-note">إعداد مرة واحدة على جهازك، وبعدها المحفظة بتظهر تلقائيًا هنا في نفس المتصفح. الموقع بيحتفظ بنسخة مشفرة من الأرقام، وبعد فتحها بتتحفظ نسخة مقروءة على جهازك. مفيش مزامنة تلقائية بين الأجهزة.</p></Det>
        {!holdings.length&&ENCRYPTED_PORTFOLIO&&<section className="portfolio-import"><h3>افتح محفظتك</h3><p className="eg-note">اكتب كلمة الفتح مرة واحدة. بعدها البيانات هتفتح تلقائيًا على المتصفح ده من غير ملف.</p><form onSubmit={e=>{e.preventDefault();unlock();}}><input type="password" aria-label="كلمة فتح المحفظة" autoComplete="off" value={passphrase} onChange={e=>setPassphrase(e.target.value)} style={{width:'100%',padding:12,boxSizing:'border-box'}}/><button className="eg-chip" type="submit" disabled={unlocking||!passphrase}>{unlocking?'جاري الفتح...':'افتح واحفظ محفظتي'}</button></form><p className="eg-note">الموقع فيه نسخة مشفرة قابلة للتحميل. حد يقدر يجرب كلمات عليها خارج الموقع من غير حد، فعبارة الفتح لازم تكون طويلة وصعبة. مسح النسخة المحلية لا يمسح النسخة المشفرة من الموقع أو تاريخه.</p></section>}
        {!ENCRYPTED_PORTFOLIO&&(!holdings.length ? <label className="portfolio-import">إعداد المحفظة مرة واحدة <input type="file" accept="application/json,.json" onChange={load}/></label> : <Det title="تحديث ملف المحفظة"><label className="portfolio-import">اختار الملف الجديد <input type="file" accept="application/json,.json" onChange={load}/></label></Det>)}
        {!ENCRYPTED_PORTFOLIO&&<Det title="الإعداد من غير اختيار ملف"><p className="eg-note">لو الرابط مفتحش البيانات تلقائيًا، انسخ رابط الإعداد الخاص من الرسالة والصقه هنا. اللصق والاستيراد بيحصلوا على جهازك من غير رفع.</p><textarea aria-label="رابط الإعداد الخاص" value={setupCode} onChange={e=>setSetupCode(e.target.value)} style={{width:'100%',minHeight:80,boxSizing:'border-box'}}/><button type="button" className="eg-chip" onClick={()=>{try{const text=setupCode.trim();const code=text.includes('setup=')?text.split('setup=')[1].split(/[\s&#]/)[0]:text;if(!code||code.length>15000)throw Error();const rows=parsePortfolio(JSON.parse(atob(code.replace(/-/g,'+').replace(/_/g,'/'))));localStorage.setItem(PORTFOLIO_KEY,JSON.stringify({version:1,holdings:rows}));setHoldings(rows);setSaved(true);setSetupCode('');setErr('تم إعداد المحفظة وحفظها على المتصفح ده.');}catch{setErr('الرابط ناقص أو المتصفح منع الحفظ. انسخ رسالة الرابط كاملة وحاول تاني.');}}}>احفظ المحفظة من الرابط</button></Det>}
        <Det title="حدود الحفظ المحلي"><p className="eg-note">الحفظ مش مشفّر ولا محمي بحساب. اللي يستخدم نفس المتصفح يقدر يشوفه. مسح بيانات الموقع يضيّعه. كلمة الفتح مش محفوظة هنا، لكن البيانات بعد الفتح محفوظة من غير تشفير في المتصفح.</p></Det>
        {err&&<p role="alert" className="eg-note eg-warn">{err}</p>}
        {!!holdings.length&&<>
            <PortfolioVisual holdings={holdings}/>
            <p className="eg-note">افتح أي سهم من الكروت لعرض الشارت ودراسة الشركة. الفني والمالي منفصلين، ونطاق القيمة العادلة لسه غير مكتمل.</p>
            <Det title="مقارنة المتوسطات لكل الأسهم"><HoldingComparison holdings={holdings}/></Det>
            <section className="portfolio-overview" aria-label="خريطة المحفظة"><div className="evidence-head"><h3>خريطة المحفظة</h3><small>أوزان لقطة 24 نوفمبر، مش لحظية</small></div><div className="holding-signals"><div><small>عدد الأسهم</small><b><L>{holdings.length}</L></b></div><div><small>أكبر سهمين من جزء الأسهم</small><b><L>{topTwoWeight.toFixed(2)}%</L></b></div></div><div className="portfolio-map" role="img" aria-label="توزيع الأوزان المسجلة">{[...holdings].sort((a,b)=>b.weight-a.weight).map((h,i)=><span key={h.symbol} style={{width:h.weight+'%',background:['#4386ac','#4aa899','#9288bc','#b59053','#7b99b3','#77885a'][i%6]}} title={h.symbol+' '+h.weight.toFixed(2)+'%'}/>)}</div><div className="portfolio-legend">{[...holdings].sort((a,b)=>b.weight-a.weight).map(h=><span key={h.symbol}><L>{h.symbol} · {h.weight.toFixed(2)}%</L></span>)}</div><p className="eg-note">ده يوضح التركّز وقت اللقطة: حركة أكبر الأوزان أثرها أعلى، لكن تساوي الأوزان مش معناه تنويع المخاطر. الأرقام لا تشمل الكاش أو أي أصول تانية.</p><div className="portfolio-sort"><label htmlFor="holding-sort">رتّب الكروت حسب</label><select id="holding-sort" value={holdingSort} onChange={e=>setHoldingSort(e.target.value)}><option value="weight">أكبر وزن في اللقطة</option><option value="gap">الفرق عن التكلفة، وصف فقط</option></select></div><p className="eg-note">الترتيب لتسهيل المقارنة، مش ترتيب شراء أو بيع. فرق التكلفة مش مقياس لجودة السهم.</p></section>
            <p className="portfolio-saved">{saved?'محفوظ على المتصفح ده · هيفتح تلقائيًا المرة الجاية':'مفتوح للجلسة فقط، الحفظ غير متاح'}</p>
            <button type="button" className="eg-chip" onClick={remove}>احذف محفظتي من المتصفح</button>
            <p className="eg-note">الأوزان لقطة ملفك، مش أوزان لحظية ولا رصيد متصل بالوسيط. ملف 24 نوفمبر: الأوزان الساعة 07:58، والمتوسطات والكميات الساعة 15:18. بنستخدم إقفال <L>{DATA.stocks.MASR.date}</L>، مش آخر تداول في الصور الأحدث. فرق سعر قبل الرسوم والتوزيعات، مش ربح محقق.</p>
            {orderedHoldings.map(h=>{const s=DATA.stocks[h.symbol];const pnl=Number.isFinite(h.averageCost)&&h.averageCost>0&&Number.isFinite(s.close)&&s.close>0?100*(s.close/h.averageCost-1):null;return <section className="portfolio-holding" key={h.symbol} id={'held-'+h.symbol} tabIndex={-1}><h3><bdi dir="ltr">{h.symbol}</bdi><span>{h.weight.toFixed(2)}% من الأسهم في الملف</span></h3><div className="portfolio-values"><div><small>متوسطك · لقطة 24/11 15:18</small><b dir="ltr">{h.averageCost===null?'غير متاح':h.averageCost.toFixed(5)}</b></div><div><small>إقفال <L>{s.date}</L></small><b dir="ltr">{fmt(s.close)}</b></div><div><small>فرق سعر فقط، مش عائد المحفظة</small><b dir="ltr">{pnl===null?'غير محسوب':pc(pnl)}</b></div></div><p className="eg-note">{h.quantity!==null&&<>الكمية <L>{h.quantity.toLocaleString('en-US')}</L> سهم. </>}أساس تسوية السعر والتكلفة ممكن يختلف بعد تقسيم أو توزيع. فرق السعر لا يشمل التوزيعات النقدية أو الأسهم المجانية أو الرسوم، ولا يطابق بالضرورة إجمالي الربح في تطبيق الوسيط.</p><button type="button" className="eg-chip" onClick={()=>{const el=document.getElementById('holding-comparison');el?.scrollIntoView({block:'start'});el?.focus({preventScroll:true});}}>ارجع لمقارنة الاتجاه</button><Det title="سياق مركزك والسيناريوهات"><HoldingContext h={h} s={s} maxWeight={Math.max(...holdings.map(h=>h.weight))}/></Det>{s.ok&&!invalidCandles(s)?<Det title="افهم قراءة السهم في سياق مركزك"><Evidence s={s}/></Det>:<p className="eg-note">{s.partial?'القراءة الجزئية موضحة فوق، من غير افتراض اتجاه طويل غير محسوب.':'التاريخ المجاني ناقص، فمفيش قراءة فنية كافية.'}</p>}</section>})}
            <p className="eg-note">أكبر وزن في الملف <L>{Math.max(...holdings.map(h=>h.weight)).toFixed(2)}%</L>. لو سهم وزنه 20% اتحرك 10%، أثره التقريبي على جزء الأسهم 2% مع ثبات الباقي. ده شرح للحساسية، مش توقع.</p>
            <p className="eg-note">المتوسط المعروض 5 منازل عشرية، فضربه في الكمية ممكن يختلف قروش عن إجمالي تكلفة الوسيط بسبب التقريب. متوسط الشراء مرجع حسابي، مش سعر لازم السهم يرجع له ولا سبب كافي للاحتفاظ أو البيع. التطبيق لا ينفذ أوامر ولا يتصل بحساب الوسيط.</p>
        </>}
    </div>;
}

function Info() {
    return <div className="eg-pad eg-in">
        <Det title="حركة السوق (أسهم بس)"><Market /></Det>
        <Det title="قواعد البورصة المصرية باختصار"><ul className="eg-ul"><li>الحد اليومي للسعر حوالي 20% صعود أو نزول من إقفال أمس، فالوقف ممكن يتنفذ بفجوة.</li><li>التسوية T+2: الأسهم اللي تشتريها النهارده تدخل حسابك بعد يومين عمل.</li><li>التداول من الأحد للخميس: 10:00 لـ14:15 تداول متواصل، وبعدها مزاد الإغلاق لحد 14:30.</li><li>ضريبة دمغة 0.05% على المشتري وعلى البايع، غير عمولة الوسيط (مثال منشور لتطبيق ثندر: 0.10% + 2 جنيه للأمر). التكلفة بتختلف حسب حجم الأمر والوسيط والرسوم وفرق سعر الشراء والبيع، ومفيش نسبة واحدة مضمونة.</li><li>أسهم الشركات الصغيرة (تمياز) حدها 10%.</li></ul><p className="eg-note">المصادر: دليل EFG Hermes، وبورصة مصر، ودليل أسعار ثندر (عن طريق Perplexity). اتأكد من إعلانات البورصة لكل سهم.</p></Det>
        <Det title="عن التطبيق وحدوده"><About /></Det>
    </div>;
}
export function App() {
    return <FileCard lang="ar" dir="rtl">
        <div className="eg-top"><h1 className="eg-title">أسهمي</h1><span className="eg-live">محفظتي · بيانات يومية</span></div>
        <Routes>{KEYS.map(k=><Route key={k} path={"/"+k.toLowerCase()} element={<Stock key={k} k={k}/>}/>)}<Route path="*" element={<Portfolio/>}/></Routes>
    </FileCard>;
}
