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
    if (!s.ok) return { t: 'مفيش بيانات', c: 'na', col: '#8b97ad', d: '' };
    const st = s.plan.strength;
    if (st >= 70 && s.rsi < 70) return { t: 'دخول محتمل', c: 'go', col: '#2ee59d', d: 'المؤشرات متوافقة. لو هتدخل، التزم بالوقف.' };
    if (st >= 50) return { t: 'راقب', c: 'watch', col: '#ffb84d', d: 'فيه نص المؤشرات إيجابي. استنى تأكيد قبل أي دخول.' };
    return { t: 'استنى', c: 'wait', col: '#ff5c70', d: 'أغلب المؤشرات سلبية. مفيش دخول مناسب دلوقتي.' };
}
function strengthWord(v: number) { return v >= 70 ? 'قوية' : v >= 50 ? 'متوسطة' : v >= 30 ? 'ضعيفة' : 'ضعيفة جدًا'; }

function useCount(to: number, dec = 2) {
    const [v, setV] = useState(to);
    useEffect(() => {
        let raf = 0; const t0 = performance.now(); setV(to * 0.9);
        const step = (t: number) => { const p = Math.min(1, (t - t0) / 700); setV(to * (1 - Math.pow(1 - p, 3))); if (p < 1) raf = requestAnimationFrame(step); };
        raf = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf);
    }, [to]);
    return v.toFixed(dec);
}
function Price({ v }: { v: number }) { const d = v >= 10 ? 2 : 3; return <span className="eg-price" dir="ltr">{useCount(v, d)}</span>; }

function why(s: any): { ok: boolean; t: string }[] {
    const v = s.votes, p = s.plan, o: { ok: boolean; t: string }[] = [];
    o.push({ ok: !!v.trend, t: v.trend ? 'السعر فوق متوسط 200 يوم: الاتجاه الطويل صاعد.' : 'السعر تحت متوسط 200 يوم: الاتجاه الطويل لسه نازل أو ضعيف.' });
    o.push({ ok: !!v.mid, t: v.mid ? 'فوق متوسط 50 يوم: الاتجاه المتوسط إيجابي.' : 'تحت متوسط 50 يوم: الاتجاه المتوسط سلبي.' });
    o.push({ ok: !!v.macd, t: v.macd ? 'MACD فوق خط الإشارة: الزخم بيتحسن.' : 'MACD تحت خط الإشارة: الزخم ضعيف.' });
    o.push({ ok: !!v.rsi, t: s.rsi > 70 ? `RSI ${s.rsi}: صعد بسرعة، خطر تصحيح.` : s.rsi < 40 ? `RSI ${s.rsi}: ضعيف، وممكن يرتد لو قرب 30.` : `RSI ${s.rsi}: في المنطقة الصحية.` });
    o.push({ ok: !!v.vol, t: v.vol ? 'حجم التداول أعلى من المعتاد مع صعود: فيه اهتمام شراء.' : `حجم التداول ${s.volx} ضعف المعتاد: مفيش تأكيد من الحجم.` });
    return o;
}

function Home() {
    const list = KEYS.map(k => ({ k, s: DATA.stocks[k] })).sort((a, b) => (b.s.ok ? b.s.plan.strength : -1) - (a.s.ok ? a.s.plan.strength : -1));
    const top = list[0];
    return <div className="eg-pad">
        <div className="eg-hero eg-in">
            <span className="eg-hero-k">الأقوى فنيًا دلوقتي</span>
            <b>{top.s.name} <L>({top.k})</L></b>
            <span className="eg-hero-s">قوة {top.s.plan.strength}/100 · {verdict(top.s).t}. ده ترتيب فني مش ضمان.</span>
        </div>
        <p className="eg-lead">مرتبين من الأقوى للأضعف. آخر إقفال كامل <L>{DATA.stocks.MASR.date}</L>.</p>
        {list.map(({ k, s }, i) => {
            const v = verdict(s);
            return <Link key={k} className="eg-card eg-in" style={{ animationDelay: i * 60 + 'ms' }} to={'/' + k.toLowerCase()}>
                <div className="eg-c1">
                    {s.ok ? <Ring value={s.plan.strength} color={v.col} /> : <div className="eg-ring eg-noring">؟</div>}
                    <div className="eg-cm">
                        <div className="eg-row1"><b className="eg-sym" dir="ltr">{k}</b><span className="eg-name">{s.name}</span></div>
                        <span className={'eg-badge eg-' + v.c}>{v.t}</span>
                    </div>
                    <div className="eg-cp">
                        {s.ok ? <><Price v={s.close} /><span className={'eg-chg ' + (s.chg5 >= 0 ? 'u' : 'd')}><L>{pc(s.chg5)}</L> 5 أيام</span></> : <span className="eg-chg">سعر <L>{fmt(s.close)}</L></span>}
                    </div>
                </div>
                {s.ok ? <Spark vals={s.bars.slice(-60).map((r: any) => r[4])} up={s.chg20 >= 0} /> : <p className="eg-note">تاريخ المصدر المجاني ناقص، فمفيش شارت أو تقييم.</p>}
            </Link>;
        })}
        <p className="eg-note eg-foot">التقييم من 100 تجميع لمؤشرات فنية بسيطة. الاختبار على الماضي ما أثبتش إنه بيتنبأ بالأرباح.</p>
    </div>;
}

function Stock({ k }: { k: string }) {
    const s = DATA.stocks[k];
    const [tf, setTf] = useState<TF>('D');
    const [n, setN] = useState(130);
    const trows = React.useMemo(() => s.ok ? mkRows(resample(s.bars, tf)) : [], [k, tf]);
    const [t, setT] = useState({ sma: true, vol: true, rsi: false, macd: false, plan: true, bb: false });
    const tg = (key: keyof typeof t, name: string) => <button type="button" className={'eg-chip' + (t[key] ? ' on' : '')} onClick={() => setT({ ...t, [key]: !t[key] })}>{name}</button>;
    const v = verdict(s);
    return <div className="eg-pad">
        <div className="eg-pick">{KEYS.map(x => <Link key={x} className={'eg-chip' + (x === k ? ' on' : '')} to={'/' + x.toLowerCase()}>{x}</Link>)}</div>
        <div className="eg-in">
            <h2 className="eg-h">{s.name} <span dir="ltr">({k})</span></h2>
            {!s.ok ? <p className="eg-note">المصدر المجاني معندوش تاريخ كفاية للسهم ده، فمفيش شارت ولا خطة. السعر حوالي <L>{fmt(s.close)}</L>.</p> : <>
                <div className="eg-top2"><Price v={s.close} /><span className={'eg-chg ' + (s.chg20 >= 0 ? 'u' : 'd')}>شهر <L>{pc(s.chg20)}</L></span></div>

                <div className={'eg-verdict eg-v-' + v.c}>
                    <Ring value={s.plan.strength} color={v.col} />
                    <div><b>{v.t}</b><span>قوة {strengthWord(s.plan.strength)} ({s.plan.strength}/100)</span><p>{v.d}</p></div>
                </div>
                <Ex>{X.verdict(s)}</Ex>

                <h3 className="eg-h3">ليه الحكم ده؟</h3>
                <div className="eg-why">{why(s).map((w, i) => <div key={i} className="eg-w" style={{ animationDelay: i * 50 + 'ms' }}><span className={w.ok ? 'ok' : 'no'}>{w.ok ? '✓' : '✗'}</span>{w.t}</div>)}</div>
                <Ex>{X.why()}</Ex>
                {s.fire.length > 0 && <div className="eg-fire">إشارة جديدة النهارده: {s.fire.map((f: string) => RULE_AR[f]).join(' + ')}</div>}

                <h3 className="eg-h3">الشارت</h3>
                <div className="eg-chips">{(['D', 'W', 'M'] as TF[]).map(x => <button type="button" key={x} className={'eg-chip' + (tf === x ? ' on' : '')} onClick={() => { setTf(x); setN(RANGES[x][1][1]); }}>{TF_AR[x]}</button>)}</div>
                <div className="eg-chips">{RANGES[tf].map(([a, b]) => <button type="button" key={a} className={'eg-chip eg-sm' + (n === b ? ' on' : '')} onClick={() => setN(b)}>{a}</button>)}</div>
                <p className="eg-note">الشمعة = {tf === 'D' ? 'يوم تداول' : tf === 'W' ? 'أسبوع تداول' : 'شهر تداول'}. مفيش شارت لحظي (دقائق/ساعات) لأن البيانات المجانية آخر اليوم بس.</p>
                <StockChart rows={trows} n={n} t={t} plan={s.plan} />
                <Ex>{X.chart(s, tf)}</Ex>
                <div className="eg-chips">{tg('plan', 'الخطة')}{tg('sma', 'متوسطات')}{tg('vol', 'حجم')}{tg('bb', 'بولينجر')}{tg('rsi', 'RSI')}{tg('macd', 'MACD')}</div>
                <Ex>{X.ma(s)}</Ex>
                <Ex label="اشرحلي الحجم">{X.vol(s)}</Ex>
                <p className="eg-note">المس الشارت واسحب عشان تشوف أي يوم. الأزرق متوسط 200 يوم والبرتقالي متوسط 50 يوم.</p>

                <h3 className="eg-h3">خطة الدخول لو قررت</h3>
                <div className="eg-plan">
                    <div className="eg-pr"><span>الدخول</span><b dir="ltr">{fmt(s.plan.entry)} <em>({pc(s.plan.entry_pct)} من السعر)</em></b></div>
                    <p className="eg-pn">{s.plan.mode === 'pullback' ? 'استنى تراجع للمتوسط القصير (متوسط 20 يوم) بدل ما تجري ورا السعر.' : `ادخل بس لو السعر اخترق أعلى مستوى في 20 يوم (${fmt(s.plan.res)}) بحجم تداول عالي. قبل كده مفيش دخول.`}</p>
                    <div className="eg-pr dn"><span>وقف الخسارة</span><b dir="ltr">{fmt(s.plan.stop)} <em>({pc(s.plan.stop_pct)})</em></b></div>
                    <p className="eg-pn">الوقف = الدخول ناقص ضعف التذبذب اليومي المعتاد ({s.plan.atrpct}% في اليوم). لو السعر قفل تحته اخرج بدون تردد.</p>
                    <div className="eg-pr up"><span>الهدف</span><b dir="ltr">{fmt(s.plan.target)} <em>({pc(s.plan.target_pct)})</em></b></div>
                    <p className="eg-pn">نسبة العائد للمخاطرة 1.5 لـ1. حجم الصفقة: لو بتخاطر بـ1% من محفظتك، ادخل بحوالي <L>{Math.min(100, 100 / Math.abs(s.plan.stop_pct)).toFixed(0)}%</L> من المحفظة بالكتير.</p>
                </div>
                <Ex>{X.plan(s)}</Ex>
                <p className="eg-note eg-warn">دي مستويات حسابية من الشارت، مش نصيحة استثمار ولا ضمان. السعر ممكن يكسر الوقف بفجوة، والسوق المصري فيه حدود سعرية وسيولة قليلة.</p>

                <h3 className="eg-h3">المؤشرات ببساطة</h3>
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

                <h3 className="eg-h3">التجربة على 5 سنين</h3>
                <p className="eg-note">ندخل تاني يوم ونستنى 10 أيام، بعد خصم 1% تكلفة. متوسط أي يوم عشوائي <L>{pc(s.base)}</L>.</p>
                <table className="eg-tbl"><thead><tr><th>القاعدة</th><th>مرات</th><th>كسب</th><th>متوسط</th></tr></thead><tbody>
                    {Object.keys(s.bt).map(r => <tr key={r}><td>{RULE_AR[r]}</td><td>{s.bt[r].n}</td><td>{s.bt[r].win == null ? '-' : s.bt[r].win + '%'}</td><td dir="ltr">{s.bt[r].avg == null ? '-' : pc(s.bt[r].avg)}</td></tr>)}
                </tbody></table>
                <Ex>{X.bt(s)}</Ex>
                <p className="eg-note eg-warn">العينة صغيرة (غالبًا أقل من 40 مرة) والنتايج مش ثابتة بين الأسهم. الماضي مش ضمان. كمان التقييم من 100 نفسه ما اتثبتش قدرته على التنبؤ في الاختبار.</p>
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
            <li>أسعار اللحظة متأخرة 15 دقيقة على الأقل.</li>
            <li>الفريمات يومي وأسبوعي وشهري بس، لأن المصدر المجاني إقفال يومي (مفيش داخل اليوم).</li>
            <li>المؤشرات (المتوسطات وRSI وMACD وبولينجر وADX وATR) بتتحسب جوه التطبيق، وكل واحد فيه زرار "اشرحلي".</li>
            <li>آخر إقفال اتراجع على مصدر تاني، لكن التاريخ كله لأ.</li>
            <li>بنيان (BONY) تاريخها ناقص في المصدر.</li>
            <li>حوالي 40 يوم فاضيين من كل سهم. أسعار UNIP وORHD اتصححت يدويًا من تقسيم أسهم.</li>
        </ul>
        <h3 className="eg-h3">إزاي بنحسب الخطة والقوة</h3>
        <ul className="eg-ul">
            <li><b>القوة من 100:</b> اتجاه طويل 25، اتجاه متوسط 20، MACD 20، RSI صحي 15، حجم 10، وإشارة جديدة 10.</li>
            <li><b>وقف الخسارة:</b> ضعف التذبذب اليومي تحت الدخول. <b>الهدف:</b> 3 أضعاف التذبذب فوق الدخول.</li>
            <li><b>الدخول:</b> تراجع لمتوسط 20 يوم لو السعر فوقه، وإلا اختراق أعلى 20 يوم.</li>
        </ul>
        <h3 className="eg-h3">محتاج إيه عشان نبقى أدق؟</h3>
        <ul className="eg-ul"><li>مصدر تاريخ تاني، وحركة المؤسسات لكل سهم.</li></ul>
    </div>;
}

export function App() {
    const loc = useLocation();
    const p = loc.pathname.replace(/\/$/, '');
    const onStock = KEYS.some(k => p.endsWith('/' + k.toLowerCase()));
    const tabs: [string, string, boolean][] = [['/', 'الأسهم', p === '' || p === '/'], ['/hrho', 'التفاصيل', onStock], ['/market', 'السوق', p.endsWith('/market')], ['/about', 'عن التطبيق', p.endsWith('/about')]];
    return <FileCard lang="ar" dir="rtl">
        <div className="eg-top"><h1 className="eg-title">أسهمي</h1><span className="eg-live"><i />قايمة مراقبة، مش توصيات</span></div>
        <nav className="eg-tabs" aria-label="التنقل">{tabs.map(([to, name, on]) => <NavLink key={to} to={to} className={on ? 'on' : ''}>{name}</NavLink>)}</nav>
        <Routes>
            <Route path="/" element={<Home />} />
            {KEYS.map(k => <Route key={k} path={'/' + k.toLowerCase()} element={<Stock k={k} />} />)}
            <Route path="/market" element={<Market />} />
            <Route path="/about" element={<About />} />
        </Routes>
    </FileCard>;
            }
