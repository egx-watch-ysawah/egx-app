# Backtest (2022-2025) - how the labelled numbers are reproduced
Headline (printed in the app): median absolute error of the 12-month-ahead price, T1 (next-year earnings x peer P/E) 81%, T3 (price x earnings growth) 32%, price unchanged 24%.
Reproduce: `python3 reproduce.py` (stdlib only, reads `bt3_rows.json`, 64 usable rows). Verified on 2026-11-25: prints 81 / 32 / 24.
## Pipeline that produced bt3_rows.json
1. `pull.py`, `pull2.py`: Yahoo Finance fundamentals-timeseries (annual net income, equity, shares, EBITDA, net debt, dividends) -> `hist.json`, `hist2.json`.
2. `src.py`, `ext.py`, `per.py`: prices at publication date and +3/+6/+12 months, peer P/E medians (peer groups in `../../val/peers.json` of the original workspace; not shipped here).
3. `bt.py`, `bt2.py`, `bt3.py`: build per-company-year rows (price at publication, EPS, prior EPS, peer median P/E, CBE rate, prices after 3/6/12 months) -> `bt_rows.json`, `bt2_rows.json`, `bt3_rows.json`.
4. `cons.py`, `add2.py`, `add3.py`, `addsheets.py`: tables and workbook sheets.
5. `build_targets.py`: current T1/T3 from live inputs (forward test log, `fwd/`).
## Limits (stated in the app too)
- Free third-party data (Yahoo, stockanalysis), delayed and not audited; EPS from annual statements, peer sets by sector groups chosen by us.
- 64 usable company-years, EGX only, 2022-2025: small sample, overlapping periods. A result, not a proof.
- pull/src scripts need internet and some paths are relative to the original workspace (`/downloads/fund`); `reproduce.py` needs only `bt3_rows.json`.
- T2 (fair value rolled at cost of equity) was tested and removed.
