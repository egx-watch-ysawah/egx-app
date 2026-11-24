export type Bar = [string, number, number, number, number, number];
export type TF = 'D' | 'W' | 'M';
export const TF_AR: Record<TF, string> = { D: 'يومي', W: 'أسبوعي', M: 'شهري' };
export const RANGES: Record<TF, [string, number][]> = {
    D: [['شهر', 22], ['3 شهور', 66], ['6 شهور', 130], ['سنة', 250]],
    W: [['6 شهور', 26], ['سنة', 52], ['3 سنين', 156]],
    M: [['سنة', 12], ['3 سنين', 36], ['5 سنين', 60]],
};
export function resample(bars: Bar[], tf: TF): Bar[] {
    if (tf === 'D') return bars;
    const out: Bar[] = []; let key = '';
    for (const b of bars) {
        const d = new Date(b[0] + 'T00:00:00Z');
        const k = tf === 'M' ? b[0].slice(0, 7) : String(Math.floor(d.getTime() / 864e5) - d.getUTCDay());
        if (k !== key || !out.length) { key = k; out.push([b[0], b[1], b[2], b[3], b[4], b[5]]); }
        else { const c = out[out.length - 1]; c[2] = Math.max(c[2], b[2]); c[3] = Math.min(c[3], b[3]); c[4] = b[4]; c[5] += b[5]; }
    }
    return out;
}
function ema(v: number[], span: number) { const a = 2 / (span + 1); const o: number[] = []; v.forEach((x, i) => o.push(i ? a * x + (1 - a) * o[i - 1] : x)); return o; }
export function rows(bars: Bar[]) {
    const c = bars.map(b => b[4]), n = c.length;
    const sma = (p: number) => c.map((_, i) => i + 1 < p ? null : c.slice(i + 1 - p, i + 1).reduce((a, b) => a + b, 0) / p);
    const s50 = sma(50), s200 = sma(200), m20 = sma(20);
    const sd = c.map((_, i) => { if (i + 1 < 20) return null; const w = c.slice(i - 19, i + 1), m = m20[i]!; return Math.sqrt(w.reduce((a, b) => a + (b - m) ** 2, 0) / 19); });
    const e12 = ema(c, 12), e26 = ema(c, 26), macd = e12.map((x, i) => x - e26[i]), sig = ema(macd, 9);
    const rsi: number[] = []; let ag = 0, al = 0;
    for (let i = 0; i < n; i++) {
        if (i === 0) { rsi.push(50); continue; }
        const d = c[i] - c[i - 1], g = Math.max(d, 0), l = Math.max(-d, 0);
        ag = ag * 13 / 14 + g / 14; al = al * 13 / 14 + l / 14;
        rsi.push(i < 14 ? 50 : al === 0 ? 100 : 100 - 100 / (1 + ag / al));
    }
    return bars.map((b, i): any[] => [b[0], b[1], b[2], b[3], b[4], b[5], s50[i], s200[i], +rsi[i].toFixed(1), macd[i], sig[i], m20[i] == null ? null : m20[i]! + 2 * sd[i]!, m20[i] == null ? null : m20[i]! - 2 * sd[i]!]);
}
