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


import { Home } from './screen_home';
import { MyPosition, Stock } from './screen_stock';
import { About, Info, Market } from './screen_info';
import { BonyFundamentals, DataAge, HoldingComparison, HoldingContext, PartialHistory, Portfolio, PortfolioVisual, averagePosition, calendarAge, consumeSetupFragment, parsePortfolio, setupMessage } from './screen_portfolio';
import { App } from './App';
export const KEYS = ['MASR', 'BONY', 'HRHO', 'UNIP', 'PHAR', 'ORHD'];
export const RULE_AR: Record<string, string> = {
    'RSI<30 (oversold bounce)': 'RSI نزل تحت 30 (احتمال ارتداد)',
    'MACD cross up': 'تقاطع مؤشر الزخم (ماكد) لأعلى والسعر فوق متوسط 200',
    '20d breakout + volume x1.5': 'إقفال أعلى من أعلى إقفال في 20 جلسة قبله، بحجم أعلى من المعتاد بـ50% أو أكتر',
    'SMA50 cross above SMA200': 'متوسط 50 قطع متوسط 200 لأعلى',
};
export const fmt = (v: number) => (v >= 1 ? v.toFixed(2) : v.toFixed(3));
export const pc = (v: number) => (v > 0 ? '+' : '') + v.toFixed(1) + '%';
export const L = ({ children }: { children: React.ReactNode }) => <bdi dir="ltr">{children}</bdi>;

export function verdict(s: any) {
    if (!s.ok) return { t: s.partial?'تاريخ جزئي':'بيانات ناقصة', c: 'na', col: '#8b97ad' };
    if (s.votes.trend && s.votes.mid) return { t: 'فوق المتوسطين', c: 'go', col: '#99b9df' };
    if (!s.votes.trend && !s.votes.mid) return { t: 'تحت المتوسطين', c: 'wait', col: '#99b9df' };
    return { t: 'بين المتوسطين', c: 'watch', col: '#99b9df' };
}
export function reason(s: any): string {
    if (!s.ok) return s.partial?'نافذة متاحة جزئيًا؛ كل مؤشر حسب عدد جلساته.':'تاريخ السهم ناقص في المصدر المجاني.';
    const v = s.votes, p = s.plan;
    if (verdict(s).c === 'go') return 'الإقفال فوق متوسط 50 و200 جلسة. وصف للاتجاه، مش توقع ربح.';
    if (p.ext > 4) return 'طلع بسرعة: السعر بعيد عن إقفاله من 20 جلسة بأكتر من 4 أضعاف التذبذب اليومي (متوسط آخر 14 جلسة).';
    if (p.tv < 1) return 'السيولة ضعيفة: ممكن يبقى صعب تخرج بسرعة.';
    if (!v.trend) return 'تحت متوسط 200 يوم، الاتجاه الطويل لسه ضعيف.';
    if (!v.mid) return 'الاتجاه الطويل تمام بس القصير ضعيف. الإشارة لسه ما اتأكدتش.';
    return 'نص المؤشرات إيجابي. الإشارة لسه ما اتأكدتش.';
}
export function Plan3({ s }: { s: any }) {
    const p = s.plan;
    return <div className="eg-p3">
        <div><span>{p.mode === 'pullback' ? 'مستوى تراجع للمراقبة' : 'مستوى اختراق للمراقبة'}</span><b dir="ltr">{fmt(p.entry)}</b><i>{(p.entry_pct >= 0 ? "أعلى من السعر بحوالي " : "أقل من السعر بحوالي ") + Math.abs(p.entry_pct).toFixed(0) + "%"}</i></div>
    </div>;
}
export function Det({ title, children, open }: { title: string; children: React.ReactNode; open?: boolean }) {
    return <details className="eg-ex" open={open}><summary>{title}</summary><div className="eg-exb">{children}</div></details>;
}

export function Price({ v }: { v: number }) { return <span className="eg-price" dir="ltr">{fmt(v)}</span>; }

export function w20(s: any): { hp: number | null; lp: number | null; hc: number | null; lc: number | null } { const b = (s.bars || []).slice(-21, -1); return b.length === 20 ? { hp: Math.max(...b.map((x: any) => x[2])), lp: Math.min(...b.map((x: any) => x[3])), hc: Math.max(...b.map((x: any) => x[4])), lc: Math.min(...b.map((x: any) => x[4])) } : { hp: null, lp: null, hc: null, lc: null }; }
export function why(s: any): { ok: boolean | null; t: string }[] {
    const v = s.votes, p = s.plan, o: { ok: boolean | null; t: string }[] = [];
    o.push({ ok: !!v.trend, t: v.trend ? 'السعر فوق متوسط 200 يوم: الاتجاه الطويل صاعد.' : 'السعر تحت متوسط 200 يوم: الاتجاه الطويل لسه نازل أو ضعيف.' });
    o.push({ ok: !!v.mid, t: v.mid ? 'فوق متوسط 50 يوم: الاتجاه المتوسط إيجابي.' : 'تحت متوسط 50 يوم: الاتجاه المتوسط سلبي.' });
    o.push({ ok: !!v.macd, t: v.macd ? 'MACD فوق خط الإشارة: الزخم بيتحسن.' : 'MACD تحت خط الإشارة: الزخم ضعيف.' });
    o.push({ ok: s.rsi >= 30 && s.rsi <= 70 ? null : false, t: s.rsi > 70 ? `RSI ${s.rsi}: فوق 70، صعد بسرعة، خطر تصحيح.` : s.rsi < 30 ? `RSI ${s.rsi}: تحت 30، نزل بسرعة، وممكن يرتد.` : `RSI ${s.rsi}: بين 30 و70، مش في منطقة تشبع بيع أو شراء.` });
    o.push({ ok: s.volx >= 1.5 ? !!v.vol : s.volx >= 0.7 ? null : false, t: `حجم آخر جلسة = ${Math.round(s.volx*100)}% من متوسط آخر 20 جلسة، يعني ${((x: number) => x >= 1.5 ? 'أعلى من المعتاد' : x < 0.7 ? 'أقل من المعتاد' : 'قريب من المعتاد')(s.volx)} (أعلى من المعتاد: 1.5 فأكتر، وأقل: أقل من 0.7)${s.volx >= 1.5 ? (v.vol ? ' مع يوم صعود.' : ': مفيش تأكيد من الحجم.') : s.volx >= 0.7 ? ': محايد، لا يؤكد ولا يضعف.' : ': مفيش تأكيد من الحجم.'}` });
    return o;
}

export function Evidence({ s }: { s: any }) {
    const trend = s.votes.trend, mid = s.votes.mid, macd = s.votes.macd;
    const disagreements = [trend !== mid ? 'الاتجاه الطويل والمتوسط مختلفين.' : '', !!mid !== !!macd ? 'اتجاه متوسط 50 والزخم مش في نفس الاتجاه.' : '', s.chg5 > 0 && !(s.volx >= 1.5 && s.votes.vol) ? 'السعر أعلى من 5 جلسات، لكن حجم آخر جلسة ما أكدش الصعود.' : ''].filter(Boolean);
    return <section className="evidence" aria-label="ملخص الأدلة">
        <div className="evidence-head"><h3>ورا الحالة إيه؟</h3><span>يومي · <bdi dir="ltr">{s.date}</bdi></span></div>
        <p className="evidence-intro">قراءة للبيانات، مش توقع ولا تعليمات تداول.</p>
        <div className="evidence-row"><span>الاتجاه</span><div><b>{trend ? 'فوق' : 'تحت'} متوسط 200{s.historyCount && s.historyCount < 400 ? ` (من ${s.historyCount} جلسة متاحة)` : ''}، و{mid ? 'فوق' : 'تحت'} متوسط 50 جلسة</b><small>بيوصف مكان السعر من تاريخه، مش اتجاه بكرة.</small></div></div>
        <div className="evidence-row"><span>الزخم</span><div><b>مؤشر الزخم (ماكد) {macd ? 'أعلى' : 'أقل'} من خطه · RSI <bdi dir="ltr">{s.rsi}</bdi></b><small>{s.rsi > 70 ? 'حركة صعود قوية؛ مش معناها إن الهبوط لازم يبدأ.' : s.rsi < 30 ? 'حركة نزول قوية؛ مش معناها إن الارتداد مضمون.' : 'RSI بين 30 و70، مش في منطقة تشبع بيع أو شراء، وده لوحده مش إشارة.'}</small></div></div>
        <div className="evidence-row"><span>الحجم</span><div><b><bdi dir="ltr">{Math.round(s.volx*100)}%</bdi> من متوسط 20 جلسة سابقة</b><small>{((x: number) => x >= 1.5 ? 'أعلى من المعتاد' : x < 0.7 ? 'أقل من المعتاد' : 'قريب من المعتاد')(s.volx)}. {s.volx >= 1.5 && s.votes.vol ? 'شرط صعود بحجم أعلى من المعتاد بـ50% أو أكتر متحقق.' : 'شرط صعود بحجم أعلى من المعتاد بـ50% أو أكتر مش متحقق.'} مش دليل إن المشتري مؤسسات.</small></div></div>
        <div className="evidence-conflict"><b>فين التعارض؟</b><p>{disagreements.length ? disagreements.join(' ') : 'مفيش تعارض في الفحوصات دي، لكن اتفاقها مش ضمان ولا أدلة مستقلة.'}</p></div>
        <Det title="إيه اللي يغيّر القراءة؟">
            <p>إقفال جلسة جديدة على الناحية التانية من متوسط 50 أو 200 يغيّر وصف الاتجاه. تقاطع مؤشر الزخم (ماكد) مع خطه يغيّر وصف الزخم. حجم أعلى من متوسط الـ20 جلسة السابقة مع إقفال صاعد يغيّر وصف الحجم.</p>
            <p>دي تعريفات للتغير، مش مستويات شراء أو بيع. المتوسطات نفسها بتتغير كل جلسة. بلوغ مستوى لحظيًا مش إقفال مؤكد.</p>
        </Det>
        <p className="evidence-limit">المؤشرات مشتقة من أسعار متداخلة، متعدّهاش كأصوات مستقلة. حجم التداول مش صافي مؤسسات. ميزة التنبؤ مش مثبتة؛ البيانات مصدر مجاني واحد وقد تتأخر أو تحتاج تصحيح تقسيمات.</p>
    </section>;
}

export const records:any={
MASR:{name:'مدينة مصر',revenue:8133.847,prior:7378.170,profit:1812.455,margin:22.3,tag:'الإيراد أعلى، لكن ربح مساهمي الأم أقل',facts:[['مجمل الربح',4185.058,'مليون ج.م'],['أرباح التشغيل بعد التمويل',2460.455,'مليون ج.م']],risk:'الإيراد زاد 10.2% لكن ربح مساهمي الأم نزل 22.9%. هامش مجمل الربح نزل من 66.0% إلى 51.5%؛ الشركة بتقول إن الهامش نزل لأن التسليمات الأخيرة من مشروعات أقدم هوامشها أقل، ولأن أرباح مشروعات التطوير المشترك بتتأجل لحد تسليم الوحدات. (إعلان الشركة صفحة 2 بالعربي وصفحة 16 بالإنجليزي). الشرح ده عن هامش صافي الربح، مش عن هامش مجمل الربح لوحده. المبيعات التعاقدية والتحصيلات والإيراد المحاسبي مش نفس الحاجة.',change:'تابع تحويل التعاقدات لتحصيلات وتسليمات، وهامش الربح وتكلفة التمويل. ارتفاع المبيعات وحده مش سبب كافي للإضافة.',method:'تقييم مشروعات بتدفق نقدي على مواعيد التحصيل والتكلفة والتسليم، مع دين وكاش والتزامات الأرض.',missing:'ناقص توقيت تحصيلات وتكلفة إكمال كل مشروع، التزامات الأرض والشركاء والضريبة، ومعدل خصم مبرر بالجنيه.',source:'https://foudalens.com/disclosures/MASR.CA/financial_statement/2026-11-16_297949_1.pdf',pages:'قائمة الدخل، صفحة PDF 7',extra:'https://foudalens.com/disclosures/MASR.CA/other/2026-11-24_298434_1.pdf',note:'الديون 7.8 مليار، والنقدية والأذون 7 مليار، يعني صافي الدين حوالي 0.76 مليار (قائمة المركز المالي 30 سبتمبر 2026). رقم 6.8 مليار في عرض الإدارة بتعريف مختلف عن القوائم، مش صافي نقدية؛ لا نعتبره صافي كاش ولا نخصم أي أصل مقيد. الإيجارات والتزامات الأرض محتاجة معالجة مستقلة بلا عد مرتين.'},
HRHO:{name:'إي إف جي القابضة',revenue:19517.585,profit:2529.783,margin:13.0,tag:'مجموعة مالية، مش شركة صناعية',facts:[['حقوق مساهمي الأم',37558.564,'مليون ج.م'],['اضمحلال الأصول',1237.050,'مليون ج.م']],risk:'ربح الأم 2,529.8 مليون مقابل 2,853.0 مليون في 9 شهور 2025. خسائر اضمحلال الأصول زادت من 799.0 إلى 1,237.1 مليون. البند أوسع من خسائر الائتمان فقط.',change:'تابع ربحية وجودة أصول البنك والتمويل غير المصرفي، وربحية بنك الاستثمار كل واحد لوحده. ودائع العملاء مش دين صناعي نخصمه آليًا.',method:'مجموع أجزاء: بنك الاستثمار والتمويل غير المصرفي والبنك، مع نسب الملكية وحقوق الأقلية وتكلفة الشركة القابضة. القيمة الدفترية مرجع محاسبي، مش سعر عادل.',missing:'عائد مستدام على حقوق الملكية لكل جزء، تكلفة رأس مال وافتراضات نمو مبررة. عدد الأسهم بالقوائم 1,435,893,008 في 30 سبتمبر يحتاج مراجعة أي أحداث لاحقة.',source:'https://efgholding.com/uploads/EFG_Holding_Consolidated_Financial_Statements_3_Q2026_b9ec32d58f.pdf',pages:'قوائم 30 سبتمبر وملاحظة 26',extra:'https://efgholding.com/uploads/EFG_Holding_3_Q26_Earnings_Release_a81e8f40bf.pdf',note:'الإيراد هنا من القوائم. صافي الدخل التشغيلي بإصدار الإدارة 19,789 مليون تعريف مختلف، مش رقم بديل. ربح السهم المنشور 1.76 لفترة 9 شهور، مش سنة كاملة. أنشطة السمسرة (1,574.9 مليون) وإدارة الأصول (533.8) والبنك (1,920.9) كسبانة قبل نصيب الشركاء الآخرين. 3 أنشطة تانية خسرانة: القابضة والخزانة (972.6)، وبنك الاستثمار (98.9)، والتمويل متناهي الصغر (234.3). وحوالي 37% من ربح الفترة بيروح للشركاء الآخرين مش لمساهمي الشركة الأم. دي نتائج أنشطة محددة مش جمع كامل ولا نصيب مساهم HRHO، فلا نضربها في رقم ونضيفها للقيمة. اضمحلال (خسائر متوقعة على القروض) التمويل متناهي الصغر 397.9 مليون والاستهلاكي 401.0 والبنك 322.9، فقراءة المخاطر محتاجة كل نشاط لوحده. مش هنحسب العائد على أموال المساهمين من قسمة ربح الفترة على حقوق آخر يوم، لأن حقوق الشركاء الآخرين وتصنيف الأنشطة بيغيّروا الرقم. السعر حوالي 1.0 مرة القيمة الدفترية للسهم (26.16). دي مقارنة مش نطاق سعر عادل: مفيش رقم بالسهم هنا.'},
UNIP:{name:'يونيباك',revenue:1172.512,prior:1037.370,profit:14.794,margin:1.3,tag:'مبيعات أعلى، وصافي هامش رفيع جدًا',facts:[['ربح التشغيل',110.746,'مليون ج.م'],['مصروف التمويل',97.607,'مليون ج.م']],risk:'ربح التشغيل زاد من 104.355 إلى 110.746 مليون، لكن هامشه نزل تقريبًا من 10.1% إلى 9.4%. التمويل 97.6 مليون يستهلك جزءًا كبيرًا من ربح التشغيل. صافي الربح 14.8 مقابل 14.0 مليون.',change:'تابع هامش التشغيل والتمويل والتحصيل والمخزون. تحسن المبيعات من غير تحسن الكاش والهامش مش كفاية لتأكيد تحسن جودة الربح.',method:'أرباح تشغيل طبيعية وتدفق نقدي بعد احتياجات التشغيل من مخزون وعملاء وموردين والاستثمار، ثم صافي الدين. مضاعف الربحية على هامش ضعيف جدًا حساس لأي تغير صغير.',missing:'ناقص توقع تحصيلات العملاء والمخزون والاستثمار والتمويل وربح تشغيل طبيعي، مش مجرد مضاعف للربح الحالي. المكسب الرأسمالي 4.311 مليون مقابل 23.379 مليون، مش مبيعات تشغيل.',note:'الكاش التشغيلي سالب 44.4 مليون مقابل موجب 118.8 مليون في نفس الفترة السابقة، رغم ربح محاسبي 14.8 مليون. مشتريات أصول ثابتة 12.7 مليون فوقه، ودفعة 103 مليون لشراء وحدات عقارية داخلة في التدفق التشغيلي؛ فلا نعمم العجز كأنه متكرر. ديون الشركة حوالي 573.4 مليون والنقدية 47.4 مليون، يعني صافي دين حوالي 526.0 مليون. الرقم ده للوصف بس، مش بيقول إن السهم رخيص أو غالي. ملاحظة رأس المال: 2,291,442,606 سهم بقيمة اسمية 0.10 جنيه. أي تغيير لاحق لازم يتراجع.',source:'https://foudalens.com/disclosures/UNIP.CA/financial_statement/2026-11-24_298468_1.pdf',pages:'قائمة الدخل PDF 5، التدفقات 8، وملاحظات 9 و10 و11 و14'},
PHAR:{name:'إيبيكو',revenue:7389.499,prior:7157.721,profit:792.973,margin:10.7,tag:'تنبيه مهم: مراجع الحسابات (المحاسب الخارجي) قال إنه مش قادر يتأكد من جزء من أرقام الشركة، فخد الأرقام دي بحذر.',facts:[['مجمل الربح',3051.952,'مليون ج.م'],['مصروف التمويل',1131.416,'مليون ج.م']],risk:'الفحص المجمع متحفظ لأن قوائم شركة شقيقة، المهن الطبية للأدوية، في 30 سبتمبر غير متاحة لحساب نصيب النتائج وحقوق الملكية. قيمة الاستثمار 374.9 مليون مش سقف تأثير التحفظ على الربح.',change:'تابع زوال سبب التحفظ وتكلفة التمويل والتدفق النقدي. سلامة القوائم المستقلة لا تلغي تحفظ القوائم المجمعة.',method:'تدفق نقدي للأدوية حسب الهوامش واحتياجات التشغيل من مخزون وعملاء وموردين والاستثمار والتمويل، مع فصل أثر الشركة الشقيقة. أي تقييم قبل حل التحفظ يحتاج سيناريو صريح لأثره.',missing:'قوائم الشركة الشقيقة وأثرها، خطة التمويل والاستثمار ونمو ربح تشغيلي طبيعي. صافي الربح هنا عائد للأم، مش صافي المجموعة قبل الأقلية.',source:'https://foudalens.com/disclosures/PHAR.CA/financial_statement/2026-11-15_297626_2.pdf',pages:'تقرير الفحص وقائمة الدخل، صفحتا PDF 4 و6',extra:'https://foudalens.com/disclosures/PHAR.CA/other/2026-11-17_298137_1.pdf',note:'صافي كاش التشغيل سالب 171.4 مليون مقابل موجب 1,303.7 مليون لنفس الفترة السابقة، رغم ربح مساهمي الأم 793.0 مليون. المخزون والعملاء والأرصدة المدينة استهلكوا الكاش. شراء الأصول الثابتة 110.4 مليون ومدفوعات المشروعات تحت التنفيذ 681.4 مليون؛ وده غير 603.2 مليون دفعتهم الشركة عشان تشتري السيطرة على شركة جديدة. (الاسم الكامل للشركة دي مش مقروء بالكامل من القوائم، فمش بنكتب اسم مش متأكدين منه.). الفوائد المدفوعة ظاهرة ضمن التمويل، فصافي التشغيل هنا قبلها؛ لا نعتبر فرق التشغيل والاستثمار وحده تدفقًا حرًا بعد خدمة الدين. المصدر: قائمة التدفقات PDF 9.'},
ORHD:{name:'أوراسكوم للتنمية مصر',revenue:23339.324,prior:17242.232,profit:4345.700,margin:18.6,tag:'اقرأ الربح مع الكاش وتأثير أسهم المنحة',facts:[['مجمل الربح بالقوائم',6414.873,'مليون ج.م'],['صافي كاش التشغيل',1456.754,'مليون ج.م']],risk:'ربح مساهمي الأم 4,345.7 مليون مقابل 4,083.4 مليون. ربح المجموعة 4,708.9 مليون يشمل 363.2 مليون للأقلية. مجمل الربح بالقوائم 6,414.9 مليون وهامشه 27.5% مقابل 32.2%؛ إصدار الإدارة يعرض 7,614.1 مليون و32.6% بتصنيف مختلف، فلا نخلط المقياسين.',change:'تابع الهامش والتدفق النقدي بنفس تعريف المقارنة، وتحصيلات وتسليمات العقارات وربحية الفنادق من غير الاعتماد على مبيعات أرض غير متكررة. صافي كاش التشغيل أقل من ربح المجموعة، فالنمو المحاسبي وحده مش دليل على كاش متاح للتوزيع.',method:'مجموع أجزاء: تدفقات التطوير والأرض والفنادق والأصول التجارية، مع الدين والأقلية ومنع عد نفس الأصل مرتين. لا نضرب ربح السهم القديم في مضاعف بعد منحة غيرت عدد الأسهم.',missing:'تدفقات كل مشروع وتكلفة الإكمال والتزامات الأرض وتقييم الفنادق وافتراضات خصم مبررة. القوائم تؤكد تنفيذ المنحة 7 أكتوبر: الأسهم ارتفعت من 1,130,473,523 إلى 3,650,130,360. ربح السهم لنفس الـ9 شهور بعد المنحة 1.19 بدل 3.84 قبلها؛ ده تعديل عدد أسهم مش انهيار في الربح. نراجع أي إجراءات لاحقة قبل تقييم بتاريخ اليوم.',source:'https://foudalens.com/disclosures/ORHD.CA/financial_statement/2026-11-11_297369_2.pdf',pages:'القوائم: PDF 4 و5 و8، وملاحظة 12 بصفحة 14 وملاحظة 36 بصفحة 26',extra:'https://foudalens.com/disclosures/ORHD.CA/financial_statement/2026-11-11_297371_2.pdf',note:'كاش التشغيل قبل الفايدة والضريبة 3,564.6 مليون؛ بعد فايدة مدفوعة 958.1 وضريبة 1,149.7 يبقى الصافي 1,456.8 مليون. شراء أصول ومشروعات 2,049.6 مليون، والفرق سالب 592.9 مليون. ده حساب للفترة (مش تدفق حر مستدام)، مش تدفق حر مستدام ولا تقييم. رصيد الميزانية: قروض 12,993.8 مليون، وكاش 10,299.1 وأذون 673.6 واستثمارات حالية 178.0؛ مقارنة بين الرقمين: 1,843.1 مليون قبل قيود السيولة. التزامات الأرض 6,422.6 مليون منفصلة وتتعالج داخل تدفقات المشروعات بلا عد مرتين.'}
};
export const num=(n:number)=>n.toLocaleString('en-GB',{maximumFractionDigits:1});
export function Short({text,n}:{text:string;n:number}){const parts=String(text||'').split(/(?<=\.)\s+/);if(parts.length<=n)return <p>{text}</p>;return <><p>{parts.slice(0,n).join(' ')}</p><details className="eg-more"><summary>تفاصيل أكتر</summary><p>{parts.slice(n).join(' ')}</p></details></>;}
export function FinancialStudy({symbol}:{symbol:string}){const r=records[symbol];if(!r)return null;const max=Math.max(r.revenue,r.prior||0);return <section className="fin-study" aria-label={'التحليل المالي '+symbol}><div className="bf-head"><h3>{r.name} · الأداء المالي</h3><span>9 شهور · 30 سبتمبر 2026</span></div><p className="fin-thesis">{r.tag}</p>{r.prior&&<div className="fin-compare"><div className="fin-comp-head"><b>الإيراد · نفس الـ9 شهور</b><span dir="ltr">+{((r.revenue/r.prior-1)*100).toFixed(1)}%</span></div>{[[2026,r.revenue],[2025,r.prior]].map(([y,v])=><div className="fin-bar" key={y}><span>{y}</span><u><i style={{width:(v/max*100)+'%'}}/></u><b dir="ltr">{num(v)}</b></div>)}</div>}<details open={symbol==='PHAR'}><summary>جودة الربح والمخاطر</summary><Short text={r.risk} n={2}/>{r.note&&<Short text={r.note} n={1}/>}<p className="eg-note">*قسمة ربح الأم على إيراد المجموعة توضيح تقريبي، مش هامش قطاع موحد. لا تقارن شركة مالية بمصنع بنفس المقياس.</p></details><FinVal6 k={symbol}/><details><summary>منهج التقييم والمدخلات الناقصة</summary><Short text={r.method} n={1}/><Short text={r.missing} n={1}/></details><details><summary>المصادر وطريقة القراءة</summary><p><a href={r.source} target="_blank" rel="noreferrer">المصدر الأصلي</a> · {r.pages}{r.extra&&<> · <a href={r.extra} target="_blank" rel="noreferrer">مصدر مكمل</a></>}</p><p>مراجعة 24 نوفمبر 2026. الأرقام بالمليون ومقربة من بيانات الشركة المجمعة. مش أرقام محفظتك. نمو الإيراد محسوب من نفس الفترة السابقة، مش مقارنة بربع سنة. إصدار النتائج ومقاييس الإدارة مميزين عن بنود القوائم.</p></details></section>}

export function invalidCandles(s:any){return Array.isArray(s.bars)&&s.bars.some((b:any)=>!Array.isArray(b)||b.length<6||!b.slice(1,6).every(Number.isFinite)||b[3]<=0||b[2]<Math.max(b[1],b[4])-0.00001||b[3]>Math.min(b[1],b[4])+0.00001);}
export const ENCRYPTED_PORTFOLIO:any = {"v":1,"iterations":600000,"salt":"tnUEv7WCzZzCVeSTebL0Vg==","iv":"S/ADps5QTp2zkhvd","data":"S3ROCkhvvc354uD9hBAACaVMOPXQrLaWbsI/q0fhTvGlHrVIsy6RoTRtia4meHqByFX9kyKvQWYBIvnrviJNPyjgrydsiY/I75fwVFSciAu1Nn755lbxiuhXqrtA390Pw+MxegCf9COV4bslCnATxy1SY55ZQu0iK33M2FtLgtwxYcbJqafarqgy4aHC/Q0cXn7TvxpmtQUdCaYq2kUCrJPDHQ8rYZ/NSD7cLArDMHOoxKpE5b6ePLzljiTquWFiGRf4T4fSKpLgpdL30zuSqynoL4g4DVOIbyM+7Qrbwrie3BJvmYQDhmZDSN4eOLuraZFLutJq9iASGRaMsGuy46Z4oTO3StPS47nkT7T/DqW1PcGMISqx9clGAAFl8q4dWdCjQ6ni4OmD3OxAK53U8U7hctjjvfbIABZXmOBvcuhjMw/zFtgILqKx8Cde+6KdhuO0Ia1VbVGJBGIdtfbPT65YF37GG5pT77yabY+uBRgKsFQPjjRirD7D8Tjq8Q0lbq6jNd7IeuLiz73cAAtBMvprkZAjiAwbvU3X3SHkPY3gD9AOxRQMejBgkGF5xVbwbvfrtuYYl+CFKlLPm2L7KRL62f+SOzhktoAMTMvw/G7dUGHHrV+0AJ7jK3U0HLpOGH6UuDnNrcv0h/fslxaVhwbLX0tuahFG+Krr1UEHJU6IIybNJmH4t14qvWsbA4jz0H7BD5yNPa2MN3i+sybuZmjA3ouQA30+MOqTCLvFub2NAER16TPEsI8sHkC832Tse/BD/mVOYpSHQdASnTbWdj5ZJc5ohOX49LKtR2/s2WJao0g2rMd1ohDr0+OLKBfAZTyyoAxgaSjpPL/zxe218imRr99/k74kNwNaoWpoAq4T//ARgl9D3u020u8ezOSmFe6Q1hVyjvXhOLSsyJmSPAAZ46qiNFlbicT4R3bpQzt9E998TN7OtAJiIUrulNRHR1c3y1+id1bRv+w6VtwZ4yGlW692tpQSEXW9HNrChXRjPsopfs+Jqkr+W8SoEYSK+uXmd6XK1/Mrqsr5y5wUWusIKKjUTYYoaxONH7A3CLGSPynxcfl9I048rGOYNsxi+9KwkUnrJ1uPc7FCiXDlphdRBdGky/FSjLbFWFdw7xz/GCgPMRXO1AdtqMmDJ7ISpCCyDkCIy+wc6R3NMOeFZI440X3NzhskIAAAMxmKYT/8JapzhX+YiD1Itpr9mx3TfsnNM6gzgB+qznbH4BQalAaBo++WYg4bBxGa7SI74lodAj7vHvTbkE7tLMZ+dGjZ/AMfySqNyrau9bv2VmIHrIvNKNGFGlxVMS8WYBPfVnRSTAtiyIECgBt83OfzXFUwarf/RTuawFXyj5MsjIgvSInh65T6y2r8qbqxtczn8zCR268ZFmUPLQ8PY0ZCejuY6jQa"}; // ENCRYPTED_BLOB
export const PORTFOLIO_KEY = 'egx-private-portfolio-v1';
