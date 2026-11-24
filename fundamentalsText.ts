// Plain-Egyptian text blocks for the automatic fundamentals tab. Content only, no styling.
export const AUTO_LABEL = "آلي، غير مراجَع";
export const AUTO_NOTE = "الأرقام دي بتتسحب آليًا من مصدر بيانات مجاني غير رسمي، ومش متراجعة على القوائم الأصلية. ممكن تتأخر عن آخر قوائم، وبنكتب الفترة جنب كل رقم. الأسهم المراجَعة بس هي اللي اتقرت قوائمها بنفسنا.";
export const AUTO_DISCLAIMER = "تقديري، مش سعر مستهدف ولا نصيحة شراء أو بيع.";
export const NO_DATA = "مفيش بيانات كفاية";

export type Tpl = "standard" | "bank" | "real_estate" | "holding";
export const TPL_NAME: Record<Tpl, string> = { standard: "شركة عادية", bank: "بنك", real_estate: "عقارات", holding: "قابضة / استثمار" };

export const CARD_TEXT: Record<string, { title: string; what: string; effect: string }> = {
  net_income_ttm: { title: "صافي الربح (آخر 12 شهر)", what: "اللي فضل للشركة بعد كل المصاريف والضرائب في آخر سنة. زي مرتبك بعد الخصومات. الرقم هنا ممكن يشمل حصة الأقلية، فمش بالضرورة هو ربح مساهمي الأم.", effect: "كل ما بيزيد باستمرار، السهم بيبقى أقوى. لكن لو الزيادة من بند مرة واحدة، مش بتتكرر." },
  total_revenue_ttm: { title: "الإيرادات (آخر 12 شهر)", what: "كل اللي دخل الشركة من البيع قبل أي مصاريف. زي إجمالي مبيعات المحل.", effect: "إيرادات بتكبر معناها نشاط بيتوسع، بس لازم الربح يكبر معاها." },
  earnings_per_share_basic_ttm: { title: "ربحية السهم", what: "نصيب السهم الواحد من الربح السنوي. زي نصيبك من الغلة لو الشركة مقسمة أسهم.", effect: "السعر مقسوم عليها هو مضاعف الربحية. كل ما قل، السهم أرخص نسبيًا." },
  total_equity_fq: { title: "حقوق المساهمين", what: "اللي يفضل للمساهمين لو الشركة سدّدت كل ديونها بالقيمة الدفترية. زي ثمن البيت بعد خصم قسط الشقة.", effect: "السعر مقارنة بيها هو P/B. تحت 1 معناها السهم أرخص من قيمته الدفترية، بس الدفترية مش دايمًا سعر السوق." },
  total_debt_fq: { title: "الديون", what: "اللي الشركة مستلفاه من بنوك أو سندات.", effect: "الديون الكتير مع فايدة عالية بتاكل الربح. مهم نقارنها بالحقوق وبالتدفق النقدي." },
  cash_f_operating_activities_ttm: { title: "التدفق النقدي التشغيلي", what: "الفلوس اللي دخلت فعلًا من نشاط الشركة، مش بس على الورق.", effect: "ربح كبير وتدفق نقدي ضعيف علامة نحتاج نراجعها: ممكن العملاء لسه ما دفعوش." },
  net_margin_ttm: { title: "هامش صافي الربح", what: "من كل 100 جنيه مبيعات، كام جنيه بيفضل ربح.", effect: "هامش بيرتفع معناها كفاءة أحسن. بيختلف جدًا بين القطاعات." },
  pe: { title: "مضاعف الربحية P/E", what: "السعر مقسوم على ربح السهم السنوي. يعني كام سنة ربح تدفع تمنها.", effect: "رقم قليل معناه رخص نسبي، لكن ممكن يكون لأن الربح غير متكرر." },
  pb: { title: "السعر للقيمة الدفترية P/B", what: "السعر مقسوم على حقوق المساهمين للسهم الواحد.", effect: "أهم مقياس للبنوك والعقارات والقابضة." },
  roe_ttm_pct: { title: "العائد على حقوق المساهمين ROE", what: "الشركة بتكسب كام في المية من فلوس المساهمين في السنة. نقارنه بفايدة الإيداع.", effect: "ROE أعلى من الفايدة معناها الشركة بتشغّل الفلوس أحسن من البنك." },
};

// which cards to show per template
export const CARDS: Record<Tpl, string[]> = {
  standard: ["total_revenue_ttm", "net_income_ttm", "earnings_per_share_basic_ttm", "net_margin_ttm", "cash_f_operating_activities_ttm", "total_debt_fq", "total_equity_fq", "pe", "pb", "roe_ttm_pct"],
  bank: ["net_income_ttm", "earnings_per_share_basic_ttm", "total_equity_fq", "pb", "pe", "roe_ttm_pct"],
  real_estate: ["total_revenue_ttm", "net_income_ttm", "total_equity_fq", "total_debt_fq", "pb", "pe", "roe_ttm_pct"],
  holding: ["net_income_ttm", "total_equity_fq", "total_debt_fq", "pb", "roe_ttm_pct"],
};

export const TPL_NOTE: Record<Tpl, string> = {
  standard: "الشركة العادية بتتقيّم أساسًا بمضاعف الربحية على ربح آخر 12 شهر.",
  bank: "البنك مالوش هامش ربح ولا ديون بالمعنى العادي، فبنقيّمه بالسعر للقيمة الدفترية والعائد على الحقوق. مؤشرات زي القروض المتعثرة وكفاية رأس المال مش متاحة هنا.",
  real_estate: "إيرادات العقارات بتتأثر بوقت التسليم، فالقيمة الدفترية هي الأساس. الأصول بتتسجل بالتكلفة، وقيمتها السوقية ممكن تختلف كتير. أرباح إعادة التقييم مش ظاهرة هنا.",
  holding: "الشركة القابضة قيمتها من أجزائها، وقيمة كل جزء مش متاحة هنا، فبنقيّم بالقيمة الدفترية والعائد على الحقوق.",
};

export const FV_METHOD = (basis: string, m: number[]) =>
  `المدى ده بيضرب ${basis === "P/E" ? "ربحية السهم" : "القيمة الدفترية للسهم"} في ثلاث مضاعفات افتراضية عامة (${m.join(" / ")}) للسيناريو الحذر والأساسي والمتفائل. المضاعفات دي مش مبنية على دراسة السهم نفسه. ${AUTO_DISCLAIMER}`;
