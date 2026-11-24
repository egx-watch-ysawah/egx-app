import React from 'react';

type Row = [string, number, number, number, number, number, number | null, number | null, number, number, number, number | null, number | null];
export type Toggles = { sma: boolean; vol: boolean; rsi: boolean; macd: boolean; plan: boolean; bb: boolean };
export type Plan = { entry: number; stop: number; target: number; trail: number };

const W = 360;
const PAD = 6;

function path(vals: (number | null)[], x: (i: number) => number, y: (v: number) => number) {
    let d = '';
    let pen = false;
    vals.forEach((v, i) => {
        if (v == null) { pen = false; return; }
        d += `${pen ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`;
        pen = true;
    });
    return d;
}

export function StockChart({ rows, n: n0, t, plan }: { rows: Row[]; n: number; t: Toggles; plan: Plan }) {
    const [zoom, setZoom] = React.useState<number | null>(null);
    const [off, setOff] = React.useState(0);
    React.useEffect(() => { setZoom(null); setOff(0); }, [n0, rows.length]);
    const n = Math.min(rows.length, zoom ?? n0);
    const offc = Math.round(Math.max(0, Math.min(off, rows.length - n)));
    const data = rows.slice(Math.max(0, rows.length - offc - n), rows.length - offc);
    const cnt = data.length;
    const [sel, setSel] = React.useState<number | null>(null);
    const x = (i: number) => PAD + (i + 0.5) * ((W - 2 * PAD) / cnt);
    const cw = Math.max(1.2, ((W - 2 * PAD) / cnt) * 0.6);
    const extra = t.plan ? [plan.entry, plan.stop, plan.trail] : [];
    const bbu = t.bb ? data.map(r => r[11]) : [], bbl = t.bb ? data.map(r => r[12]) : [];
    const hi = Math.max(...bbu.map(v => v ?? 0), ...data.map(r => r[2]), ...extra, ...(t.sma ? data.map(r => r[7] ?? 0) : []));
    const lo = Math.min(...bbl.map(v => v ?? 1e9), ...data.map(r => r[3]), ...extra, ...(t.sma ? data.map(r => r[6] ?? r[3]).concat(data.map(r => r[7] ?? r[3])) : []));
    const H = 210;
    const y = (v: number) => 10 + (H - 20) * (1 - (v - lo) / ((hi - lo) || 1));
    const ptrs = React.useRef(new Map<number, number>());
    const lastD = React.useRef<number | null>(null);
    const moved = React.useRef(0);
    const pickAt = (e: React.PointerEvent<SVGSVGElement>) => {
        const b = e.currentTarget.getBoundingClientRect();
        const px = ((e.clientX - b.left) / b.width) * W;
        setSel(Math.max(0, Math.min(cnt - 1, Math.floor((px - PAD) / ((W - 2 * PAD) / cnt)))));
    };
    const onDown = (e: React.PointerEvent<SVGSVGElement>) => {
        try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ }
        ptrs.current.set(e.pointerId, e.clientX); lastD.current = null; moved.current = 0;
        if (e.pointerType === 'mouse') pickAt(e);
    };
    const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
        const prev = ptrs.current.get(e.pointerId);
        if (prev == null) { if (e.pointerType === 'mouse') pickAt(e); return; }
        const rect = e.currentTarget.getBoundingClientRect();
        const dx = e.clientX - prev; ptrs.current.set(e.pointerId, e.clientX);
        if (ptrs.current.size === 1) {
            moved.current += Math.abs(dx);
            if (e.pointerType === 'mouse') { pickAt(e); return; }
            const per = rect.width / cnt;
            setOff(o => Math.max(0, Math.min(rows.length - n, o + dx / per)));
        } else if (ptrs.current.size === 2) {
            const [a, b2] = [...ptrs.current.values()]; const d = Math.abs(a - b2) || 1;
            if (lastD.current) { const ratio = lastD.current / d; setZoom(Math.round(Math.max(15, Math.min(rows.length, n * ratio)))); }
            lastD.current = d; moved.current += 99;
        }
    };
    const onUp = (e: React.PointerEvent<SVGSVGElement>) => {
        if (ptrs.current.size === 1 && moved.current < 6 && e.pointerType !== 'mouse') pickAt(e);
        ptrs.current.delete(e.pointerId); lastD.current = null;
    };
    const line = (v: number, cls: string, name: string) => <g key={name}><line x1={0} x2={W} y1={y(v)} y2={y(v)} className={cls} /><text x={4} y={y(v) - 3} className={'eg-tag ' + cls}>{name} {v >= 10 ? v.toFixed(2) : v.toFixed(3)}</text></g>;
    const price = <svg viewBox={`0 0 ${W} ${H}`} className="eg-svg eg-touch eg-reveal" key={n + '-' + offc} role="img" aria-label="شارت الشموع" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
        <defs><linearGradient id="egg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#6ea8ff" stopOpacity=".12" /><stop offset="1" stopColor="#6ea8ff" stopOpacity="0" /></linearGradient></defs>
        {[0, 1, 2, 3].map(g => <line key={g} x1={0} x2={W} y1={10 + ((H - 20) * g) / 3} y2={10 + ((H - 20) * g) / 3} className="eg-grid" />)}
        {data.map((r, i) => {
            const up = r[4] >= r[1];
            return <g key={i} className={up ? 'eg-cu' : 'eg-cd'}>
                <line x1={x(i)} x2={x(i)} y1={y(r[2])} y2={y(r[3])} />
                <rect x={x(i) - cw / 2} width={cw} y={y(Math.max(r[1], r[4]))} height={Math.max(0.8, Math.abs(y(r[1]) - y(r[4])))} rx=".6" />
            </g>;
        })}
        {t.bb && <path d={path(bbu, x, y)} className="eg-lbb" fill="none" />}
        {t.bb && <path d={path(bbl, x, y)} className="eg-lbb" fill="none" />}
        {t.sma && <path d={path(data.map(r => r[6]), x, y)} className="eg-l50" fill="none" />}
        {t.sma && <path d={path(data.map(r => r[7]), x, y)} className="eg-l200" fill="none" />}
        {t.plan && line(plan.trail, 'eg-pt', 'وقف متحرك')}
        {t.plan && line(plan.entry, 'eg-pe', 'دخول')}
        {t.plan && line(plan.stop, 'eg-ps', 'وقف')}
        {sel != null && <line x1={x(sel)} x2={x(sel)} y1={0} y2={H} className="eg-cross" />}
        <text x={W - 4} y={9} textAnchor="end" className="eg-axis">{hi.toFixed(2)}</text>
        <text x={W - 4} y={H - 2} textAnchor="end" className="eg-axis">{lo.toFixed(2)}</text>
    </svg>;

    const vmax = Math.max(...data.map(r => r[5]));
    const vol = <svg viewBox={`0 0 ${W} 54`} className="eg-svg eg-reveal" role="img" aria-label="حجم التداول">
        {data.map((r, i) => <rect key={i} x={x(i) - cw / 2} width={cw} y={50 - 46 * (r[5] / vmax)} height={46 * (r[5] / vmax)} className={r[4] >= r[1] ? 'eg-vup' : 'eg-vdn'} />)}
    </svg>;
    const ry = (v: number) => 4 + 66 * (1 - v / 100);
    const rsi = <svg viewBox={`0 0 ${W} 74`} className="eg-svg eg-reveal" role="img" aria-label="RSI">
        <rect x={0} width={W} y={ry(70)} height={ry(30) - ry(70)} className="eg-band" />
        <line x1={0} x2={W} y1={ry(70)} y2={ry(70)} className="eg-grid" /><line x1={0} x2={W} y1={ry(30)} y2={ry(30)} className="eg-grid" />
        <path d={path(data.map(r => r[8]), x, ry)} className="eg-lrsi" fill="none" />
        <text x={4} y={ry(70) - 2} className="eg-axis">70</text><text x={4} y={ry(30) + 9} className="eg-axis">30</text>
    </svg>;
    const mmax = Math.max(...data.flatMap(r => [r[9], r[10], r[9] - r[10]]).map(Math.abs)) || 1;
    const my = (v: number) => 37 - 33 * (v / mmax);
    const macd = <svg viewBox={`0 0 ${W} 74`} className="eg-svg eg-reveal" role="img" aria-label="MACD">
        <line x1={0} x2={W} y1={my(0)} y2={my(0)} className="eg-grid" />
        {data.map((r, i) => { const h = r[9] - r[10]; return <rect key={i} x={x(i) - cw / 2} width={cw} y={Math.min(my(0), my(h))} height={Math.abs(my(h) - my(0))} className={h >= 0 ? 'eg-vup' : 'eg-vdn'} />; })}
        <path d={path(data.map(r => r[9]), x, my)} className="eg-lmacd" fill="none" />
        <path d={path(data.map(r => r[10]), x, my)} className="eg-lsig" fill="none" />
    </svg>;

    const r = data[sel ?? cnt - 1];
    const chgp = r[1] ? ((r[4] / r[1] - 1) * 100) : 0;
    const step = Math.max(2, Math.round(n / 4));
    const btn = (label: string, aria: string, fn: () => void, dis = false) => <button type="button" aria-label={aria} className="eg-zb" disabled={dis} onClick={() => { setSel(null); fn(); }}>{label}</button>;
    return <div className="eg-chart" dir="ltr">
        <div className="eg-zoom">
            {btn('−', 'تصغير', () => setZoom(Math.min(rows.length, Math.round(n * 1.5))), n >= rows.length)}
            {btn('+', 'تكبير', () => setZoom(Math.max(15, Math.round(n / 1.5))), n <= 15)}
            {btn('◀', 'للماضي', () => setOff(offc + step), offc + n >= rows.length)}
            {btn('▶', 'للأحدث', () => setOff(Math.max(0, offc - step)), offc === 0)}
            <span>{n} يوم</span>
        </div>
        <div className="eg-read">
            <b>{r[0]}</b><span>O {r[1]}</span><span>H {r[2]}</span><span>L {r[3]}</span><span>C {r[4]}</span>
            <span className={chgp >= 0 ? 'u' : 'd'}>{chgp >= 0 ? '+' : ''}{chgp.toFixed(1)}%</span>
            <span>Vol {(r[5] / 1000).toFixed(0)}K</span><span>RSI {r[8]}</span>
            {sel != null && <button type="button" className="eg-x" onClick={() => setSel(null)}>×</button>}
        </div>
        {price}
        {t.vol && <><div className="eg-sub">Volume</div>{vol}</>}
        {t.rsi && <><div className="eg-sub">RSI 14</div>{rsi}</>}
        {t.macd && <><div className="eg-sub">MACD</div>{macd}</>}
    </div>;
}

export function Spark({ vals, up }: { vals: number[]; up: boolean }) {
    const lo = Math.min(...vals), hi = Math.max(...vals);
    const pts = vals.map((v, i) => `${(i / (vals.length - 1) * 100).toFixed(1)},${(26 - 24 * (v - lo) / ((hi - lo) || 1)).toFixed(1)}`);
    const c = up ? '#2ee59d' : '#ff5c70';
    return <svg viewBox="0 0 100 28" className="eg-spark eg-reveal" preserveAspectRatio="none" aria-hidden="true"><path d={'M' + pts.join('L')} fill="none" stroke={c} strokeWidth="1.2" /></svg>;
}

export function Ring({ value, color }: { value: number; color: string }) {
    const r = 22, c = 2 * Math.PI * r;
    return <svg viewBox="0 0 56 56" className="eg-ring" aria-label={`قوة ${value} من 100`}>
        <circle cx="28" cy="28" r={r} className="eg-ringbg" />
        <circle cx="28" cy="28" r={r} className="eg-ringfg" stroke={color} strokeDasharray={c} style={{ ['--to' as any]: c * (1 - value / 100), strokeDashoffset: c * (1 - value / 100) }} transform="rotate(-90 28 28)" />
        <text x="28" y="33" textAnchor="middle" className="eg-ringt">{value}</text>
    </svg>;
}
