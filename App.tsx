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
    if (!s.ok) return { t: 'مفيش بيانات', c: 'na', col: '#8b97ad' };
    const st = s.plan.strength;
    if (st >= 70 && s.rsi < 70 && s.plan.ext <= 4 && s.plan.tv >= 1) return { t: 'مرشّح للدخول', c: 'go', col: '#2ee59d' };
    if (st >= 50) return { t: 'راقب', c: 'watch', col: '#ffb84d' };
    return { t: 'استنى', c: 'wait', col: '#ff5c70' };
}
function reason(s: any): string {
    if (!s.ok) return 'تاريخ السهم ناقص في المصدر المجاني.';
    const v = s.votes, p = s.plan;
    if (verdict(s).c === 'go') return 'الاتجاه صاعد والزخم كويس. لو هتدخل، التزم بالوقف.';
    if (p.ext > 4) return 'طالع بسرعة. الدخول دلوقتي متأخر.';
    if (p.tv < 1) return 'السيولة ضعيفة، ممكن تعلق فيه.';
    if (!v.trend) return 'تحت متوسط 200 يوم، الاتجاه الطويل لسه ضعيف.';
    if (!v.mid) return 'الاتجاه الطويل تمام بس القصير ضعيف. استنى تأكيد.';
    return 'نص المؤشرات إيجابي. استنى تأكيد قبل الدخول.';
}
function Plan3({ s }: { s: any }) {
    const p = s.plan;
    return <div className="eg-p3">
        <div><span>{p.mode === 'pullback' ? 'ادخل عند' : 'ادخل لو عدّى'}</span><b dir="ltr">{fmt(p.entry)}</b><i dir="ltr">{pc(p.entry_pct)}</i></div>
        <div className="dn"><span>وقف الخسارة</span><b dir="ltr">{fmt(p.stop)}</b><i dir="ltr">{pc(p.stop_pct)}</i></div>
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

function Home() {
    const [filter, setFilter] = useState('all');
    const order: Record<string, number> = { go: 0, watch: 1, wait: 2, na: 3 };
    const list = KEYS.map(k => ({ k, s: DATA.stocks[k] })).sort((a, b) => order[verdict(a.s).c] - order[verdict(b.s).c] || (b.s.ok ? b.s.plan.strength : -1) - (a.s.ok ? a.s.plan.strength : -1));
    return <div className="eg-pad">
        <p className="eg-lead">بيانات إقفال <L>{DATA.stocks.MASR.date}</L> · مش سعر لحظي</p>
        <div className="eg-filters" role="group" aria-label="فلتر حالة السهم">{[['all','الكل'],['go','مرشّح'],['watch','راقب'],['wait','استنى']].map(([c,label]) => <button type="button" key={c} aria-pressed={filter === c} className={'eg-chip' + (filter === c ? ' on' : '')} onClick={() => setFilter(c)}>{label}<small>{c === 'all' ? list.length : list.filter(x => verdict(x.s).c === c).length}</small></button>)}</div>
        <div key={filter} className="eg-list eg-in">
        {list.filter(x => filter === 'all' || verdict(x.s).c === filter).map(({ k, s }, i) => {
            const v = verdict(s);
            return <Link key={k} className="eg-card eg-in" style={{ animationDelay: i * 60 + 'ms' }} to={'/' + k.toLowerCase()}>
                <div className="eg-c1">
                    <div className="eg-cm"><div className="eg-row1"><b className="eg-sym" dir="ltr">{k}</b><span className="eg-name">{s.name}</span></div></div>
                    <span className={'eg-badge eg-' + v.c}>{v.t}</span>
                </div>
                <p className="eg-why1">{reason(s)}</p>
                {s.ok && <div className="eg-mini"><span>السعر <b dir="ltr">{fmt(s.close)}</b></span><span>{s.plan.mode === 'pullback' ? 'دخول' : 'اختراق'} <b dir="ltr">{fmt(s.plan.entry)}</b></span><span className="dn">وقف <b dir="ltr">{fmt(s.plan.stop)}</b></span></div>}
            </Link>;
        })}
        {filter !== 'all' && !list.some(x => verdict(x.s).c === filter) && <p className="eg-empty">مفيش أسهم بالحالة دي في آخر إقفال.</p>}
        </div>
        <p className="eg-note eg-foot">أداة مراقبة مش نصيحة ولا ضمان ربح.</p>
    </div>;
}

function Stock({ k }: { k: string }) {
    const s = DATA.stocks[k];
    const [tf, setTf] = useState<TF>('D');
    const [n, setN] = useState(130);
    const trows = React.useMemo(() => s.ok ? mkRows(resample(s.bars, tf)) : [], [k, tf]);
    const [t, setT] = useState({ sma: true, vol: false, rsi: false, macd: false, plan: true, bb: false });
    const tg = (key: keyof typeof t, name: string) => <button type="button" className={'eg-chip' + (t[key] ? ' on' : '')} onClick={() => setT({ ...t, [key]: !t[key] })}>{name}</button>;
    const v = verdict(s);
    return <div className="eg-pad">
        <Link className="eg-back" to="/">← كل الأسهم</Link>
        <div className="eg-in">
            <h2 className="eg-h">{s.name} <span dir="ltr">({k})</span></h2>
            {!s.ok ? <p className="eg-note">المصدر المجاني معندوش تاريخ كفاية للسهم ده، فمفيش تقييم. السعر حوالي <L>{fmt(s.close)}</L>.</p> : <>
                <div className="eg-top2"><Price v={s.close} /><span className={'eg-chg ' + (s.chg20 >= 0 ? 'u' : 'd')}>شهر <L>{pc(s.chg20)}</L></span></div>
                <div className={'eg-verdict eg-v-' + v.c}><div><b>{v.t}</b><p>{reason(s)}</p></div></div>
                <Plan3 s={s} />
                <p className="eg-note">الخروج: وقف متحرك حاليًا <L>{fmt(s.plan.trail)}</L>. لو فتح أعلى من الدخول بأكتر من 5% متجريش وراه.</p>
                {s.plan.tv < 1 && <p className="eg-note eg-warn">السيولة ضعيفة (حوالي {s.plan.tv} مليون جنيه في اليوم).</p>}
                <Det title="الشارت" open>
                    <div className="eg-chips">{(['D', 'W', 'M'] as TF[]).map(x => <button type="button" key={x} className={'eg-chip' + (tf === x ? ' on' : '')} onClick={() => { setTf(x); setN(RANGES[x][1][1]); }}>{TF_AR[x]}</button>)}</div>
                <div className="eg-chips">{RANGES[tf].map(([a, b]) => <button type="button" key={a} className={'eg-chip eg-sm' + (n === b ? ' on' : '')} onClick={() => setN(b)}>{a}</button>)}</div>
                <p className="eg-note">الشمعة = {tf === 'D' ? 'يوم تداول' : tf === 'W' ? 'أسبوع تداول' : 'شهر تداول'}. مفيش شارت لحظي (دقائق/ساعات) لأن البيانات المجانية آخر اليوم بس.</p>
                <StockChart key={k + tf} rows={trows} n={n} t={t} plan={s.plan} />
                <Ex>{X.chart(s, tf)}</Ex>
                <div className="eg-chips">{tg('plan', 'الخطة')}{tg('sma', 'متوسطات')}{tg('vol', 'حجم')}{tg('bb', 'بولينجر')}{tg('rsi', 'RSI')}{tg('macd', 'MACD')}</div>
                <Ex>{X.ma(s)}</Ex>
                <Ex label="اشرحلي الحجم">{X.vol(s)}</Ex>
                <p className="eg-note">المس الشارت لاختيار يوم، أو حرّك المؤشر تحته. اسحب الشارت للماضي وكبّر بإصبعين. الأزرق متوسط 200 يوم والبرتقالي متوسط 50 يوم.</p>

                
                </Det>
                <Det title="ليه الحكم ده؟">
                    <div className="eg-why">{why(s).map((w, i) => <div key={i} className="eg-w" style={{ animationDelay: i * 50 + 'ms' }}><span className={w.ok ? 'ok' : 'no'}>{w.ok ? '✓' : '✗'}</span>{w.t}</div>)}</div>
                <Ex>{X.why()}</Ex>
                {s.fire.length > 0 && <div className="eg-fire">إشارة جديدة النهارده: {s.fire.map((f: string) => RULE_AR[f]).join(' + ')}</div>}

                
                </Det>
                <Det title="اشرحلي الخطة (الدخول والوقف والحجم)">
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
                    <p className="eg-note">ندخل تاني يوم ونستنى 10 أيام، بعد خصم 1% تكلفة. متوسط أي يوم عشوائي <L>{pc(s.base)}</L>.</p>
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
            <li>آخر إقفال اتراجع على مصدر تاني، لكن التاريخ كله لأ.</li>
            <li>بنيان (BONY) تاريخها ناقص في المصدر.</li>
            <li>حوالي 40 يوم فاضيين من كل سهم. أسعار UNIP وORHD اتصححت يدويًا من تقسيم أسهم.</li>
        </ul>
        <h3 className="eg-h3">إزاي بنحسب الخطة والقوة</h3>
        <ul className="eg-ul">
            <li><b>القوة من 100:</b> اتجاه طويل 25، اتجاه متوسط 20، MACD 20، RSI صحي 15، حجم 10، وإشارة جديدة 10.</li>
            <li><b>وقف الخسارة:</b> ضعف ونص التذبذب اليومي تحت الدخول. <b>الخروج:</b> وقف متحرك (3 أضعاف التذبذب تحت أعلى سعر في شهر) أو 60 يوم. مفيش هدف ثابت.</li>
            <li><b>الدخول:</b> تراجع لمتوسط 20 يوم لو السعر فوقه، وإلا اختراق أعلى 20 يوم.</li>
        </ul>
        <h3 className="eg-h3">اتختبر ولا لأ؟ (صراحة)</h3>
        <ul className="eg-ul">
            <li>اختبرنا قواعد الدخول والخروج على 10 سنين و10 أسهم بنظام "تدريب ثم اختبار على فترة جديدة" (135 صفقة من 2020 لـ2026).</li>
            <li>بعد تكلفة 1% للصفقة (عمولة وفرق سعر) المتوسط كان إيجابي (حوالي +3.6% للصفقة) بس أقل من نص الصفقات رابحة، والنتيجة معتمدة على كام صفقة كبيرة.</li>
            <li>بعد تكلفة 2% الميزة بقت غير مؤكدة إحصائيًا، والدخول العشوائي كان قريب منها (+2.1%). يعني مفيش دليل قاطع إن الإشارات بتتفوق.</li>
            <li>رقم "القوة" نفسه ضعيف الارتباط بالعائد بعدها بشهر، وكان بيشتغل أسوأ قبل 2022. اعتبره ترتيب للمراقبة مش توقع.</li>
            <li>الجزء المفيد فعلاً هو إدارة المخاطرة: الوقف وحجم الصفقة. التطبيق مبيوعدش إنه يكسب السوق.</li>
        </ul>
        <h3 className="eg-h3">محتاج إيه عشان نبقى أدق؟</h3>
        <ul className="eg-ul"><li>مصدر تاريخ تاني، وحركة المؤسسات لكل سهم.</li></ul>
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
    const loc = useLocation();
    const p = loc.pathname.replace(/\/$/, '');
    const tabs: [string, string, boolean][] = [['/', 'الأسهم', !p.endsWith('/info')], ['/info', 'معلومات', p.endsWith('/info')]];
    return <FileCard lang="ar" dir="rtl">
        <div className="eg-top"><h1 className="eg-title">أسهمي</h1><span className="eg-live">بيانات يومية</span></div>
        <nav className="eg-tabs" aria-label="التنقل">{tabs.map(([to, name, on]) => <NavLink key={to} to={to} className={on ? 'on' : ''}>{name}</NavLink>)}</nav>
        <Routes>
            <Route path="/" element={<Home />} />
            {KEYS.map(k => <Route key={k} path={'/' + k.toLowerCase()} element={<Stock k={k} />} />)}
            <Route path="/info" element={<Info />} />
        </Routes>
    </FileCard>;
}
