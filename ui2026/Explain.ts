// Fixed one-line "how to use this number" templates. Thresholds are the app's own, same for every stock.
// They describe what a value means and what to compare it to. They are not advice to buy or sell.
const n = (v: any): v is number => typeof v === 'number' && Number.isFinite(v);

export const xTech = (c: string | undefined) =>
  c === 'go' ? 'السعر فوق متوسط 50 و200 جلسة، يعني الاتجاه إيجابي لحد دلوقتي. قارنه بحجم التداول وبنفس السهم من شهر فات.'
  : c === 'wait' ? 'السعر تحت متوسطاته، يعني الاتجاه لسه ضعيف. الأهم تتابع هل بيرجع فوقها ولا لأ.'
  : 'السعر بين متوسطاته، يعني مفيش اتجاه واضح. قارنه بالقراءة بعد كام جلسة.';

export const xRsi = (v: any) => !n(v) ? ''
  : v > 70 ? 'فوق 70: السعر طلع بسرعة، ممكن يهدى وممكن يكمل. قارنه بقراءات السهم السابقة.'
  : v < 30 ? 'تحت 30: السعر نزل بسرعة، ممكن يهدى وممكن يكمل. قارنه بقراءات السهم السابقة.'
  : 'بين 30 و70: حركة عادية، مفيش سخونة ولا نزول سريع.';

export const xChg = (a: any, b: any, c: any) => {
  const xs = [a, b, c].filter(n);
  if (xs.length < 2) return '';
  const up = xs.every(x => x > 0), dn = xs.every(x => x < 0);
  return up ? 'الفترات كلها طالعة: الاتجاه واحد من القريب للبعيد.'
    : dn ? 'الفترات كلها نازلة: الاتجاه واحد من القريب للبعيد.'
    : 'الفترات مختلفة: القريب بيوريك الحركة الأخيرة والبعيد بيوريك الاتجاه، قارن بينهم.';
};

export const xPos = (p: number | null) => p === null ? ''
  : p >= 80 ? 'السعر قريب من أعلى مستوى في سنة. قارنه بسعر شرائك أو بمتوسط 200.'
  : p <= 20 ? 'السعر قريب من أدنى مستوى في سنة. اسأل نفسك ليه نزل قبل ما تحكم.'
  : 'السعر في نص مدى السنة تقريبًا. قارنه بالمتوسطات.';

let ATR_ALL: number[] | null = null;
const ATR_BY: Record<string, number | null> = {};
export const atrOf = (code: string): number | null => (code && typeof ATR_BY[code.toUpperCase()] === 'number' ? ATR_BY[code.toUpperCase()] : null);
let ATR_P: Promise<number[]> | null = null;
export const loadAtrAll = (): Promise<number[]> => ATR_ALL ? Promise.resolve(ATR_ALL) : (ATR_P = ATR_P || fetch('idx/index.json', { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).catch(() => null).then(j => {
  const rows: any[] = j && Array.isArray(j.rows) ? j.rows : [];
  rows.forEach(r => { if (r && r.code) ATR_BY[String(r.code).toUpperCase()] = typeof r.atr_pct === 'number' && isFinite(r.atr_pct) ? r.atr_pct : null; });
  ATR_ALL = rows.map(r => r && r.atr_pct).filter((x: any) => typeof x === 'number' && isFinite(x)).sort((a: number, b: number) => a - b);
  return ATR_ALL;
}));
// Terciles vs the other stocks when atr_pct exists in the index (at least 30 values); otherwise the fixed 2/4% lines.
export const xAtr = (v: any, all?: number[] | null) => {
  if (!n(v)) return '';
  if (all && all.length >= 30) {
    const lo = all[Math.floor(all.length / 3)], hi = all[Math.floor((all.length * 2) / 3)];
    return v >= hi ? 'تذبذب من الأعلى مقارنة بباقي الأسهم (الثلث الأعلى): السعر بيتحرك كتير في اليوم. قارنه بسهم تاني قبل ما تحدد حجم المبلغ.'
      : v >= lo ? 'تذبذب في النص مقارنة بباقي الأسهم (الثلث الأوسط): حركة يومية عادية. قارنه بسهم تاني.'
      : 'تذبذب من الأهدى مقارنة بباقي الأسهم (الثلث الأدنى): السعر بيتحرك قليل في اليوم. قارنه بسهم تاني.';
  }
  return v >= 4 ? 'تذبذب عالي: السعر بيتحرك كتير في اليوم، فأي مبلغ فيه بيتغير أكتر. قارنه بسهم تاني.'
    : v >= 2 ? 'تذبذب عادي: حركة يومية متوسطة. قارنه بسهم تاني قبل ما تحدد حجم المبلغ.'
    : 'تذبذب هادي: السعر بيتحرك قليل في اليوم. قارنه بسهم تاني.';
};

export const xVol = (x: any) => !n(x) ? ''
  : x >= 1.5 ? 'حجم أعلى من المعتاد: اهتمام زيادة بالسهم. شوف السعر طلع ولا نزل معاه.'
  : x < 0.7 ? 'حجم أقل من المعتاد: حركة هادية، وأي حركة سعر وقتها تقل ثقتها.'
  : 'حجم قريب من المعتاد: مفيش حاجة غريبة في التداول.';

export const xRef = (gap: number | null) => gap === null || !isFinite(gap) ? ''
  : Math.abs(gap) <= 25 ? `السعر قريب من الرقم المرجعي (فرق حوالي ${Math.round(Math.abs(gap))}%). ده رقم من نموذج مختلف عن الصفحة، للمقارنة بس، مش توقع.`
  : `السعر ${gap > 0 ? 'فوق' : 'تحت'} الرقم المرجعي بحوالي ${Math.round(Math.abs(gap))}%. ده من نموذج مختلف عن الصفحة، والفرق الكبير معناه الأرقام محتاجة تدقيق، مش إشارة شراء ولا بيع.`;

export const xHome = {
  index: 'المؤشر بيلخص حركة أكبر 30 سهم. قارنه بتغير السهم اللي بتتابعه.',
  breadth: 'لو الطالع أكتر من النازل يبقى السوق ماشي لفوق في أغلب الأسهم. قارنه بحركة المؤشر.',
  movers: 'ده أكبر تغيّر في آخر جلسة بس. قارنه بحجم التداول قبل ما تدي له وزن.',
  value: 'قيمة التداول بتوريك فين السيولة: الرقم الكبير يعني الدخول والخروج أسهل.',
};

export const xSig = (score: number) => score >= 4 ? 'أغلب المؤشرات إيجابية لحد الإقفال، وده وصف للحركة اللي فاتت. قارنه بالحجم وبمتوسط 200 قبل ما تدي له وزن.'
  : score <= 1 ? 'أغلب المؤشرات سلبية لحد الإقفال، وده وصف للحركة اللي فاتت. اسأل ليه ضعف قبل أي حكم.'
  : 'المؤشرات مختلطة. قارنها بباقي الأسهم.';
export const xHold = (above200: boolean | null) => above200 === null ? ''
  : above200 ? 'فوق متوسط 200: الاتجاه الطويل إيجابي لحد الإقفال. قارنه بسعر شرائك مش بتوقع.'
  : 'تحت متوسط 200: الاتجاه الطويل لسه ضعيف. قارن حالتك بسعر شرائك.';
