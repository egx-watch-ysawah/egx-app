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
import { BonyFundamentals, DataAge, HoldingComparison, HoldingContext, PartialHistory, Portfolio, PortfolioVisual, averagePosition, calendarAge, consumeSetupFragment, parsePortfolio, setupMessage } from './screen_portfolio';
import { App } from './App';
export function Market() {
    const f = DATA.flows;
    const num = (x: string) => { const m = /([+-]?)([\d.]+)([MB])/.exec(x); return m ? (m[1] === '-' ? -1 : 1) * parseFloat(m[2]) * (m[3] === 'B' ? 1000 : 1) : 0; };
    const rows = f ? [['المصريين', f.egy], ['العرب', f.arab], ['الأجانب', f.foreign]] : [];
    const mx = Math.max(1, ...rows.map(r => Math.abs(num(r[1]))));
    return <div className="eg-pad eg-in">
        <h2 className="eg-h">حركة السوق (أسهم بس)</h2>
        {f ? <>
            <p className="eg-lead">صافي الشراء في جلسة 24/11 (آخر بيانات متاحة) في الأسهم فقط بالجنيه (M = مليون). لقطة من foudalens يوم 24-11-2026 أثناء الجلسة، والأرقام بتتغير لحد الإغلاق:</p>
            {rows.map(([a, b], i) => { const nv = num(b); return <div key={a} className="eg-flow"><div className="eg-fl"><span>{a}</span><b dir="ltr" className={nv < 0 ? 'd' : 'u'}>{b}</b></div><div className="eg-bar"><i className={nv < 0 ? 'd' : 'u'} style={{ width: (Math.abs(nv) / mx * 100) + '%', animationDelay: i * 120 + 'ms' }} /></div></div>; })}
            <Ex>{X.flow()}</Ex>
            <p className="eg-note">{num(f.foreign) < 0 ? 'الأجانب بيبيعوا صافي والمحليين بيشتروا، يعني السوق ماسكه محليين.' : 'الأجانب بيشتروا صافي، ده بيدعم السوق عادة.'}</p>
            <p className="eg-note eg-warn">تحذير: حركة المؤسسات لكل سهم لوحده مش متاحة مجانًا، والحركة دي لقطة اليوم من غير تاريخ ومش مختبرة.</p>
        </> : <p className="eg-note">مقدرتش أقرا حركة السوق وقت التحديث.</p>}
    </div>;
}

export function About() {
    return <div className="eg-pad eg-in">
        <h2 className="eg-h">عن التطبيق وحدوده</h2>
        <p className="eg-note eg-warn">أداة مراقبة مش ضمان ربح، ومش هتسبق السوق بشكل مضمون. التجربة على الماضي ما طلعتش بقاعدة بسيطة ليها ميزة ثابتة على الأسهم الستة.</p>
        <h3 className="eg-h3">حدود البيانات</h3>
        <ul className="eg-ul">
            <li>أسعار مجانية من مصدر واحد لحد آخر إقفال كامل (<L>{DATA.stocks.MASR.date}</L>). التطبيق بيتحدث تلقائيًا كل يوم بعد الإقفال، ولو المصدر المجاني معداش بيفضل على آخر بيانات سليمة.</li>
            <li>الشاشة دي بتستخدم إقفال يومي، ومبتعرضش أسعار اللحظة.</li>
            <li>الفريمات يومي وأسبوعي وشهري بس، لأن المصدر المجاني إقفال يومي (مفيش داخل اليوم).</li>
            <li>المؤشرات (المتوسطات وRSI ومؤشر الزخم (ماكد) وبولينجر وADX وATR) بتتحسب جوه التطبيق، وكل واحد فيه زرار "اشرحلي".</li>
            <li>التاريخ الحالي من Starta Markets، مع فحوص اتساق الشموع والتواريخ. ده مش تدقيق مستقل لكل صفقة ولا ضمان لتسويات كل إجراء رأسمالي.</li>
            <li>بنيان تاريخها المتاح أقصر من باقي الأسهم، لكن عندها أكثر من 200 جلسة. مفيش دمج مع تاريخ المصدر السابق.</li>
        </ul>
        <h3 className="eg-h3">إزاي بنحسب الخطة والقوة</h3>
        <ul className="eg-ul">
            <li><b>القوة من 100:</b> اتجاه طويل 25، اتجاه متوسط 20، مؤشر الزخم (ماكد) 20، RSI صحي 15، حجم 10، وإشارة جديدة 10.</li>
            <li><b>فريم التقييم:</b> يومي بعد الإقفال. متابعة موجة أيام/أسابيع، من غير مدة ربح مضمونة. فريم الشارت لا يغيّر التقييم.</li>
            <li><b>مستويات مرجعية:</b> المستوى الأدنى للمراقبة = مستوى المراقبة ناقص 2.5 مرة هزة اليوم. الخط المرجعي = أعلى إقفال 20 جلسة ناقص 3 مرات هزة اليوم. التطبيق للمتابعة والتحليل بس: مفيهوش مركز محفوظ ولا بيع عند أي مستوى.</li>
            <li><b>طريقة حساب مستوى المراقبة:</b> تراجع لمتوسط 20 يوم لو السعر فوقه، وإلا مستوى اختراق = أعلى سعر خلال اليوم في آخر 20 جلسة (شامل {tdA()}). إشارة الاختراق نفسها بتتحقق لما الإقفال يعدي أعلى إقفال في الـ20 جلسة قبله.</li>
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

export function Info() {
    return <div className="eg-pad eg-in">
        <Det title="حركة السوق (أسهم بس)"><Market /></Det>
        <Det title="قواعد البورصة المصرية باختصار"><ul className="eg-ul"><li>الحد اليومي للسعر حوالي 20% صعود أو نزول من إقفال أمس، فأي أمر وقف ممكن يتنفذ بفجوة.</li><li>التسوية T+2: الأسهم اللي تشتريها النهارده تدخل حسابك بعد يومين عمل.</li><li>التداول من الأحد للخميس: 10:00 لـ14:15 تداول متواصل، وبعدها مزاد الإغلاق لحد 14:30.</li><li>ضريبة دمغة 0.05% على المشتري وعلى البايع، غير عمولة الوسيط (مثال منشور لتطبيق ثندر: 0.10% + 2 جنيه للأمر). التكلفة بتختلف حسب حجم الأمر والوسيط والرسوم وفرق سعر الشراء والبيع، ومفيش نسبة واحدة مضمونة.</li><li>أسهم الشركات الصغيرة (تمياز) حدها 10%.</li></ul><p className="eg-note">المصادر: دليل EFG Hermes، وبورصة مصر، ودليل أسعار ثندر (عن طريق Perplexity). اتأكد من إعلانات البورصة لكل سهم.</p></Det>
        <Det title="عن التطبيق وحدوده"><About /></Det>
    </div>;
}
