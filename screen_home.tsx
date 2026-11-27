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
import { MyPosition, Stock } from './screen_stock';
import { About, Info, Market } from './screen_info';
import { BonyFundamentals, DataAge, HoldingComparison, HoldingContext, PartialHistory, Portfolio, PortfolioVisual, averagePosition, calendarAge, consumeSetupFragment, parsePortfolio, setupMessage } from './screen_portfolio';
import { App } from './App';
export function Home() {
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
