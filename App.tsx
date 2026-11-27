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
import { BonyFundamentals, DataAge, HoldingComparison, HoldingContext, PartialHistory, Portfolio, PortfolioVisual, averagePosition, calendarAge, consumeSetupFragment, parsePortfolio, setupMessage } from './screen_portfolio';
export function App() {
    return <FileCard lang="ar" dir="rtl">
        <div className="eg-top"><h1 className="eg-title">أسهمي</h1><span className="eg-live">محفظتي · بيانات يومية</span></div>
        <Routes>{KEYS.map(k=><Route key={k} path={"/"+k.toLowerCase()} element={<PageSwitch k={k} old={<Stock key={k} k={k}/>}/>}/>)}<Route path="/egx30" element={<IndexList which="egx30"/>}/><Route path="/egx70" element={<IndexList which="egx70"/>}/><Route path="/s/:code" element={<IdxStock/>}/>{goldOn()&&<Route path="/gold" element={<GoldTab/>}/>}<Route path="/others" element={<OthersList/>}/><Route path="/all" element={<AllStocks/>}/><Route path="/o/:code" element={<IdxStock/>}/><Route path="*" element={<Portfolio/>}/></Routes>
        <p className="eg-disc" style={{ fontSize: 13, lineHeight: 1.9, color: '#9aa7bd', margin: '18px 0 8px', padding: '10px 0 0', borderTop: '1px solid #253144' }}>تنبيه مهم: التطبيق ده مش تابع لجهة مرخصة من الهيئة العامة للرقابة المالية ولا معتمد منها. اللي هنا معلومات وقراءات مبنية على أرقام مجانية منشورة ممكن تتأخر أو تتغير، مش نصيحة استثمار ومش توصية بشراء أو بيع، ومفيش أي وعد بربح. الاستثمار في الأسهم فيه مخاطر وممكن تخسر جزء من فلوسك أو كلها. القرار النهائي قرارك لوحدك ومسؤوليتك.</p>
    </FileCard>;
}
