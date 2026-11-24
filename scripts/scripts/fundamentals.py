import json, urllib.request, datetime, sys
URL = "https://scanner.tradingview.com/egypt/scan"
COLS = ["name","description","close","market_cap_basic","sector","industry",
 "total_shares_outstanding_fundamental","fiscal_period_current","earnings_release_date",
 "total_revenue_fq","net_income_fq","total_revenue_fy","net_income_fy","total_revenue_ttm","net_income_ttm",
 "earnings_per_share_basic_ttm","total_equity_fq","total_debt_fq","book_value_per_share_fq",
 "cash_f_operating_activities_ttm","free_cash_flow_ttm","gross_margin_ttm","operating_margin_ttm","net_margin_ttm","price_earnings_ttm"]
REVIEWED = {"COMI","MASR","BONY","HRHO","UNIP","PHAR","ORHD"}
LABEL = "آلي، غير مراجَع"
# generic multiples: assumptions, not stock-specific targets
MULT = {"standard": ("P/E", [5, 7, 9]), "bank": ("P/B", [0.8, 1.1, 1.5]),
        "real_estate": ("P/B", [0.6, 0.9, 1.3]), "holding": ("P/B", [0.6, 0.9, 1.2])}

def template(industry, sector):
    s = (industry or "").lower()
    if "investment bank" in s or "broker" in s: return "holding"
    if "bank" in s: return "bank"
    if "real estate" in s or "homebuilding" in s: return "real_estate"
    if "conglomerate" in s or "holding" in s or "investment trust" in s: return "holding"
    return "standard"

def fetch(n, tickers=None):
    body = {"markets": ["egypt"], "symbols": ({"tickers": ["EGX:" + t for t in tickers]} if tickers else {"query": {"types": ["stock"]}}), "columns": COLS,
            "sort": {"sortBy": "market_cap_basic", "sortOrder": "desc"}, "range": [0, n]}
    req = urllib.request.Request(URL, json.dumps(body).encode(), {"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"})
    return json.load(urllib.request.urlopen(req, timeout=60))["data"]

def num(x): return x if isinstance(x, (int, float)) else None
def r(x, k=2): return None if x is None else round(x, k)

def build(row):
    d = dict(zip(COLS, row["d"])); sym = row["s"].split(":")[1]
    t = template(d["industry"], d["sector"])
    sh, eq = num(d["total_shares_outstanding_fundamental"]), num(d["total_equity_fq"])
    bv = num(d["book_value_per_share_fq"]) or (eq / sh if eq and sh else None)
    eps, px = num(d["earnings_per_share_basic_ttm"]), num(d["close"])
    ni_ttm = num(d["net_income_ttm"])
    roe = ni_ttm / eq * 100 if ni_ttm is not None and eq else None
    basis, mults = MULT[t]
    fv, why = None, None
    if t == "standard":
        if eps and eps > 0: fv = [r(eps * m) for m in mults]
        else: why = "مفيش ربحية سنوية موجبة متاحة"
    else:
        if bv and bv > 0: fv = [r(bv * m) for m in mults]
        else: why = "مفيش قيمة دفترية متاحة"
    if sym in REVIEWED: fv, why = None, "الدراسة المراجَعة هي المرجع"
    return sym, {
        "name": d["description"], "template": t, "industry": d["industry"], "sector": d["sector"],
        "reviewed": sym in REVIEWED, "label": "مراجَع" if sym in REVIEWED else LABEL,
        "price": r(px), "market_cap": num(d["market_cap_basic"]), "shares": sh,
        "period": d["fiscal_period_current"], "release_date": d["earnings_release_date"],
        "fields": {k: r(num(d[k]), 4) for k in COLS[9:24] if num(d[k]) is not None},
        "derived": {"bvps": r(bv), "roe_ttm_pct": r(roe, 1), "pb": r(px / bv) if px and bv and bv > 0 else None,
                    "pe": r(px / eps) if px and eps and eps > 0 else None},
        "fair_value": {"basis": basis, "multiples": mults, "low_base_high": fv, "status": ("تقدير آلي" if fv else ("راجع الدراسة المراجَعة" if sym in REVIEWED else "مفيش بيانات كفاية")), "reason": why,
                       "note": "مضاعفات عامة افتراضية، مش سعر مستهدف"},
        "source": "TradingView scanner (غير رسمي)"}

if __name__ == "__main__":
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 100
    syms = [x.strip() for x in open(sys.argv[3]).read().split() if x.strip()] if len(sys.argv) > 3 else None
    rows = fetch(len(syms) if syms else n, syms)
    out = {"source": URL, "note": "بيانات آلية غير مراجَعة من القوائم الأصلية، قد تكون متأخرة", "fetched_at_utc": datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"), "stocks": dict(build(x) for x in rows)}
    if syms: out["not_found"] = sorted(set(syms) - set(out["stocks"])); n = len(syms)
    if len(out["stocks"]) < n * 0.8: raise SystemExit("incomplete")
    json.dump(out, open(sys.argv[2] if len(sys.argv) > 2 else "fundamentals.json", "w"), ensure_ascii=False, indent=1, sort_keys=True)
    print(len(out["stocks"]))
