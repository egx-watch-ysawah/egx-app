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
    if (!s.ok) return { t: 'بيانات ناقصة', c: 'na', col: '#8b97ad' };
    if (s.votes.trend && s.votes.mid) return { t: 'فوق المتوسطين', c: 'go', col: '#99b9df' };
    if (!s.votes.trend && !s.votes.mid) return { t: 'تحت المتوسطين', c: 'wait', col: '#99b9df' };
    return { t: 'بين المتوسطين', c: 'watch', col: '#99b9df' };
}
function reason(s: any): string {
    if (!s.ok) return 'تاريخ السهم ناقص في المصدر المجاني.';
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

function Stock({ k }: { k: string }) {
    const s = DATA.stocks[k];
    const [tf, setTf] = useState<TF>('D');
    const [n, setN] = useState(130);
    const trows = React.useMemo(() => s.ok ? mkRows(resample(s.bars, tf)) : [], [k, tf]);
    const [t, setT] = useState({ sma: true, vol: false, rsi: false, macd: false, plan: false, bb: false });
    const tg = (key: keyof typeof t, name: string) => <button type="button" className={'eg-chip' + (t[key] ? ' on' : '')} onClick={() => setT({ ...t, [key]: !t[key] })}>{name}</button>;
    const v = verdict(s);
    return <div className="eg-pad">
        <Link className="eg-back" to="/">← كل الأسهم</Link>
        <div className="eg-in">
            <h2 className="eg-h">{s.name} <span dir="ltr">({k})</span></h2>
            {!s.ok ? <p className="eg-note">المصدر المجاني معندوش تاريخ كفاية للسهم ده، فمفيش تقييم. السعر حوالي <L>{fmt(s.close)}</L>.</p> : <>
                <div className="eg-top2"><Price v={s.close} /><span className={'eg-chg ' + (s.chg20 >= 0 ? 'u' : 'd')}>شهر <L>{pc(s.chg20)}</L></span></div>
                <div className={'eg-verdict eg-v-' + v.c}><div><b>{v.t}</b><p>{reason(s)}</p></div></div>
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
                <Det title="الشارت" open>
                    <div className="eg-chips">{(['D', 'W', 'M'] as TF[]).map(x => <button type="button" key={x} className={'eg-chip' + (tf === x ? ' on' : '')} onClick={() => { setTf(x); setN(RANGES[x][1][1]); }}>{TF_AR[x]}</button>)}</div>
                <div className="eg-chips">{RANGES[tf].map(([a, b]) => <button type="button" key={a} className={'eg-chip eg-sm' + (n === b ? ' on' : '')} onClick={() => setN(b)}>{a}</button>)}</div>
                <p className="eg-note">الشمعة = {tf === 'D' ? 'يوم تداول' : tf === 'W' ? 'أسبوع تداول' : 'شهر تداول'}. مفيش شارت لحظي (دقائق/ساعات) لأن البيانات المجانية آخر اليوم بس. اختيار الأسبوعي أو الشهري بيغيّر الرسم ومؤشراته فقط؛ التقييم والسيناريو فوق بيفضلوا على اليومي.</p>
                <StockChart key={k + tf} rows={trows} n={n} t={t} plan={s.plan} />

                <div className="eg-chips">{tg('plan', 'مستويات السيناريو')}{tg('sma', 'متوسطات')}{tg('vol', 'حجم')}{tg('bb', 'بولينجر')}{tg('rsi', 'RSI')}{tg('macd', 'MACD')}</div>
                <Det title="افهم الشارت والألوان">
                    <p>الخط الفاتح = سعر الإقفال. لو اخترت شموع: الجسم بين الفتح والإقفال، والخيط بين أعلى وأقل سعر. الأخضر إقفال أعلى من الفتح، والأحمر العكس.</p>
                    <p>البرتقالي متوسط 50 شمعة، والأزرق متوسط 200 شمعة على الإطار المختار. خطوط الخطة اختيارية: أزرق دخول مشروط، أحمر وقف بعد الدخول، أخضر وقف متحرك مرجعي، مش هدف ربح.</p>
                    <p>الأرقام أعلى الشارت تخص الفترة اللي اخترتها: فتح، أعلى، أقل، إقفال، والتغير من الفتح للإقفال. الحجم عدد الأسهم المتداولة. RSI مقياس زخم من 0 لـ100، مش نسبة ربح متوقعة.</p>
                </Det>
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
            <li>آخر إقفال اتراجع على مصدر تاني، لكن التاريخ كله لأ.</li>
            <li>بنيان (BONY) تاريخها ناقص في المصدر.</li>
            <li>حوالي 40 يوم فاضيين من كل سهم. أسعار UNIP وORHD اتصححت يدويًا من تقسيم أسهم.</li>
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

function Portfolio() {
    const [holdings,setHoldings] = useState<any[]>([]);
    const [err,setErr] = useState('');
    async function load(e: React.ChangeEvent<HTMLInputElement>) {
        try {
            const f=e.target.files?.[0]; if(!f)return;
            if(f.size>100000)throw Error('الملف أكبر من الحجم المسموح.');
            const x=JSON.parse(await f.text());
            if(x.version!==1||!Array.isArray(x.holdings)||x.holdings.length>100)throw Error('صيغة الملف مش مدعومة.');
            const seen=new Set();
            const rows=x.holdings.map((h:any)=>{
                if(!KEYS.includes(h.symbol)||seen.has(h.symbol)||!Number.isFinite(h.weight)||h.weight<0||h.weight>100||!(h.averageCost===null||(Number.isFinite(h.averageCost)&&h.averageCost>0)))throw Error('راجع رموز الأسهم والأوزان ومتوسطات الشراء في الملف.');
                seen.add(h.symbol);if(h.quantity!==undefined&&(!Number.isFinite(h.quantity)||h.quantity<=0))throw Error('راجع الكميات.');
                return {symbol:h.symbol,weight:h.weight,averageCost:h.averageCost,quantity:h.quantity??null};
            });
            if(Math.abs(rows.reduce((a:number,h:any)=>a+h.weight,0)-100)>.1)throw Error('مجموع الأوزان لازم يكون 100% تقريبًا.');
            setHoldings(rows);setErr('');
        }catch(ex){setErr(ex instanceof SyntaxError?'الملف مش JSON سليم. اختار ملف المحفظة المجهز لك.':ex instanceof Error?ex.message:'مقدرتش أقرأ الملف.');setHoldings([]);}
        e.target.value='';
    }
    return <div className="eg-pad"><h2 className="eg-h">محفظتي</h2>
        <p className="eg-note">البيانات بتتفتح على جهازك للجلسة دي بس. مش بتترفع لسيرفر، ومش بتتحط في الرابط. إعادة تحميل الصفحة بتمسحها. مفيش حفظ أو مزامنة تلقائية.</p>
        <label className="portfolio-import">افتح ملف المحفظة الخاص <input type="file" accept="application/json,.json" onChange={load}/></label>
        <p className="eg-note">استخدم ملف JSON المجهز لك بشكل خاص، مش صورة ولا كشف حساب. احتفظ بالملف في مكان آمن؛ أي شخص عنده الملف يقدر يقرأه.</p>
        {err&&<p role="alert" className="eg-note eg-warn">{err}</p>}
        {!!holdings.length&&<>
            <button type="button" className="eg-chip" onClick={()=>setHoldings([])}>امسح البيانات من الجلسة</button>
            <p className="eg-note">الأوزان لقطة ملفك، مش أوزان لحظية ولا رصيد متصل بالوسيط. ملف 24 نوفمبر: الأوزان الساعة 07:58، والمتوسطات والكميات الساعة 15:18. بنستخدم إقفال <L>{DATA.stocks.MASR.date}</L>، مش آخر تداول في الصور الأحدث. فرق سعر قبل الرسوم والتوزيعات، مش ربح محقق.</p>
            {holdings.map(h=>{const s=DATA.stocks[h.symbol];const pnl=h.averageCost?100*(s.close/h.averageCost-1):null;return <section className="portfolio-holding" key={h.symbol}><h3><bdi dir="ltr">{h.symbol}</bdi><span>{h.weight.toFixed(2)}% من الأسهم في الملف</span></h3><div className="portfolio-values"><div><small>متوسط الشراء</small><b dir="ltr">{h.averageCost===null?'غير متاح':h.averageCost.toFixed(5)}</b></div><div><small>آخر إقفال متاح</small><b dir="ltr">{fmt(s.close)}</b></div><div><small>فرق السعر عن التكلفة</small><b dir="ltr">{pnl===null?'غير محسوب':pc(pnl)}</b></div></div><p className="eg-note">{h.quantity!==null&&<>الكمية <L>{h.quantity.toLocaleString('en-US')}</L> سهم. </>}فرق السعر لا يشمل التوزيعات النقدية أو الأسهم المجانية أو الرسوم، ولا يطابق بالضرورة إجمالي الربح في تطبيق الوسيط.</p>{s.ok?<Det title="افهم قراءة السهم في سياق مركزك"><Evidence s={s}/></Det>:<p className="eg-note">التاريخ المجاني ناقص، فمفيش قراءة فنية كافية.</p>}</section>})}
            <p className="eg-note">أكبر وزن في الملف <L>{Math.max(...holdings.map(h=>h.weight)).toFixed(2)}%</L>. لو سهم وزنه 20% اتحرك 10%، أثره التقريبي على جزء الأسهم 2% مع ثبات الباقي. ده شرح للحساسية، مش توقع.</p>
            <p className="eg-note">المتوسط المعروض 5 منازل عشرية، فضربه في الكمية ممكن يختلف قروش عن إجمالي تكلفة الوسيط بسبب التقريب. متوسط الشراء مرجع حسابي، مش سعر لازم السهم يرجع له ولا سبب كافي للاحتفاظ أو البيع. التطبيق لا ينفذ أوامر ولا يحفظ مراكز.</p>
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
    const loc = useLocation();
    const p = loc.pathname.replace(/\/$/, '');
    const tabs: [string, string, boolean][] = [['/', 'الأسهم', !p.endsWith('/info') && !p.endsWith('/portfolio')], ['/portfolio', 'محفظتي', p.endsWith('/portfolio')], ['/info', 'معلومات', p.endsWith('/info')]];
    return <FileCard lang="ar" dir="rtl">
        <div className="eg-top"><h1 className="eg-title">أسهمي</h1><span className="eg-live">بيانات يومية</span></div>
        <nav className="eg-tabs" aria-label="التنقل">{tabs.map(([to, name, on]) => <NavLink key={to} to={to} className={on ? 'on' : ''}>{name}</NavLink>)}</nav>
        <Routes>
            <Route path="/" element={<Home />} />
            {KEYS.map(k => <Route key={k} path={'/' + k.toLowerCase()} element={<Stock k={k} />} />)}
            <Route path="/info" element={<Info />} />
            <Route path="/portfolio" element={<Portfolio />} />
        </Routes>
    </FileCard>;
}
