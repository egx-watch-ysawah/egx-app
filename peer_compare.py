#!/usr/bin/env python3
"""Daily peer comparison for the six held stocks, the 5 P0 pilot stocks, the 21 B1-B3 batch stocks and the 20 B4-B6 batch stocks and the 20 C1 batch stocks and the 19 D1 batch stocks and the 13 D3 batch stocks and the 17 D4 batch stocks and the 23 D5 batch stocks and the 23 D6 batch stocks and the 22 D7 batch stocks and the 10 D8 batch stocks and the 26 D2 batch stocks (223 in all). Source: TradingView scanner (free, delayed, single source).
Writes peer_compare.json. Peer groups use the feed's own labels (not EGX official sectors).
Rules: medians exclude the stock; only positive values count; n<3 => no comparison; n<5 => quality 'weak'.
If the feed fails or returns too few rows, the old data is kept, marked status=stale, and the run exits 1 (job fails = alert).
Unchanged data keeps its old generated_utc; checked_utc says when it was last checked."""
import json,sys,datetime,statistics as st,urllib.request
from pathlib import Path
OUT=Path(sys.argv[1] if len(sys.argv)>1 else 'peer_compare.json')
COLS=['name','close','sector','industry','price_earnings_ttm','price_book_fq','time','earnings_per_share_basic_ttm','book_value_per_share_fq']
# stock -> (label, filter on feed row). Group definitions are fixed here, so a change is a visible code change.
G={
 'ORHD':('Real Estate Development (wider group; feed label is Homebuilding)',lambda r:r['industry']=='Real Estate Development'),
 'MASR':('Real Estate Development',lambda r:r['industry']=='Real Estate Development'),
 'BONY':('Real Estate Development',lambda r:r['industry']=='Real Estate Development'),
 'HRHO':('Investment Banks/Brokers',lambda r:r['industry']=='Investment Banks/Brokers'),
 'PHAR':('Pharmaceuticals (Health Technology sector)',lambda r:r['sector']=='Health Technology'),
 'UNIP':('Containers/Packaging',lambda r:r['industry']=='Containers/Packaging'),
 # P0 pilot stocks added 28 Nov. Group choices are by feed label only; reasons are in NOTES below (not in the group label, which must stay a short clean label).
 'COMI':('Regional Banks',lambda r:r['industry']=='Regional Banks'),
 'ETEL':('Major Telecommunications',lambda r:r['industry']=='Major Telecommunications'),
 'TMGH':('Real Estate Development',lambda r:r['industry']=='Real Estate Development'),
 'SWDY':('Electrical Products',lambda r:r['industry']=='Electrical Products'),
 'EAST':('Tobacco',lambda r:r['industry']=='Tobacco'),
 # B1-B3 batches added 28 Nov (one cumulative package). Group choices are by feed label only; reasons are in NOTES below.
 'TAQA':('Electric Utilities',lambda r:r['industry']=='Electric Utilities'),
 'SKPC':('Chemicals: Specialty + Agricultural',lambda r:r['industry'] in ('Chemicals: Specialty','Chemicals: Agricultural')),
 'ABUK':('Chemicals: Agricultural',lambda r:r['industry']=='Chemicals: Agricultural'),
 'ORAS':('Engineering & Construction',lambda r:r['industry']=='Engineering & Construction'),
 'PHDC':('Real Estate Development',lambda r:r['industry']=='Real Estate Development'),
 'ADIB':('Regional Banks',lambda r:r['industry']=='Regional Banks'),
 'FWRY':('Technology Services',lambda r:r['sector']=='Technology Services'),
 'RMDA':('Pharmaceuticals: Major',lambda r:r['industry']=='Pharmaceuticals: Major'),
 'RAYA':('Technology Services',lambda r:r['sector']=='Technology Services'),
 'ORWE':('Home Furnishings',lambda r:r['industry']=='Home Furnishings'),
 'MFPC':('Chemicals: Agricultural',lambda r:r['industry']=='Chemicals: Agricultural'),
 'MCQE':('Construction Materials',lambda r:r['industry']=='Construction Materials'),
 'LCSW':('Producer Manufacturing',lambda r:r['sector']=='Producer Manufacturing'),
 'JUFO':('Food: Meat/Fish/Dairy',lambda r:r['industry']=='Food: Meat/Fish/Dairy'),
 'ISPH':('Medical Distributors',lambda r:r['industry']=='Medical Distributors'),
 'ISMA':('Agricultural Commodities/Milling',lambda r:r['industry']=='Agricultural Commodities/Milling'),
 'ICFC':('Chemicals: Agricultural',lambda r:r['industry']=='Chemicals: Agricultural'),
 'HDBK':('Regional Banks',lambda r:r['industry']=='Regional Banks'),
 'ELKA':('Real Estate Development',lambda r:r['industry']=='Real Estate Development'),
 'EFIH':('Technology Services',lambda r:r['sector']=='Technology Services'),
 'EFID':('Food: Specialty/Candy',lambda r:r['industry']=='Food: Specialty/Candy'),
 # B4-B6 batches added 28 Nov (one cumulative package). Group choices are by feed label only; reasons are in NOTES below.
 'DSCW':('Apparel/Footwear',lambda r:r['industry']=='Apparel/Footwear'),
 'ARCC':('Construction Materials',lambda r:r['industry']=='Construction Materials'),
 'AMOC':('Oil Refining/Marketing',lambda r:r['industry']=='Oil Refining/Marketing'),
 'UEGC':('Engineering & Construction',lambda r:r['industry']=='Engineering & Construction'),
 'MEPA':('Containers/Packaging',lambda r:r['industry']=='Containers/Packaging'),
 'ETRS':('Other Transportation',lambda r:r['industry']=='Other Transportation'),
 'AMER':('Real Estate Development',lambda r:r['industry']=='Real Estate Development'),
 'MCRO':('Pharmaceuticals: Major',lambda r:r['industry']=='Pharmaceuticals: Major'),
 'ENGC':('Building Products',lambda r:r['industry']=='Building Products'),
 'MPRC':('Movies/Entertainment',lambda r:r['industry']=='Movies/Entertainment'),
 'ATQA':('Producer Manufacturing',lambda r:r['sector']=='Producer Manufacturing'),
 'POUL':('Agricultural Commodities/Milling',lambda r:r['industry']=='Agricultural Commodities/Milling'),
 'MTIE':('Electronics Distributors',lambda r:r['industry']=='Electronics Distributors'),
 'MBSC':('Construction Materials',lambda r:r['industry']=='Construction Materials'),
 'SCEM':('Construction Materials',lambda r:r['industry']=='Construction Materials'),
 'EXPA':('Regional Banks',lambda r:r['industry']=='Regional Banks'),
 'OCDI':('Real Estate Development',lambda r:r['industry']=='Real Estate Development'),
 'EGAL':('Aluminum + Steel',lambda r:r['industry'] in ('Aluminum','Steel')),
 'CLHO':('Hospital/Nursing Management',lambda r:r['industry']=='Hospital/Nursing Management'),
 'CCAP':('Investment Managers',lambda r:r['industry']=='Investment Managers'),
 # C1 batch added 28 Nov: studies_rest stocks that have flow data and a viable peer group. Group choices are by feed label only; reasons are in NOTES below.
 'AIFI':('Agricultural Commodities/Milling',lambda r:r['industry']=='Agricultural Commodities/Milling'),
 'ALCN':('Other Transportation',lambda r:r['industry']=='Other Transportation'),
 'ASCM':('Construction Materials',lambda r:r['industry']=='Construction Materials'),
 'DAPH':('Real Estate Development',lambda r:r['industry']=='Real Estate Development'),
 'EGCH':('Chemicals: Agricultural',lambda r:r['industry']=='Chemicals: Agricultural'),
 'EHDR':('Real Estate Development',lambda r:r['industry']=='Real Estate Development'),
 'ELSH':('Real Estate Development',lambda r:r['industry']=='Real Estate Development'),
 'EMFD':('Real Estate Development',lambda r:r['industry']=='Real Estate Development'),
 'GBCO':('Wholesale Distributors',lambda r:r['industry']=='Wholesale Distributors'),
 'GPIM':('Real Estate Development',lambda r:r['industry']=='Real Estate Development'),
 'HELI':('Homebuilding',lambda r:r['industry']=='Homebuilding'),
 'IDRE':('Homebuilding',lambda r:r['industry']=='Homebuilding'),
 'IEEC':('Engineering & Construction',lambda r:r['industry']=='Engineering & Construction'),
 'MPCO':('Agricultural Commodities/Milling',lambda r:r['industry']=='Agricultural Commodities/Milling'),
 'NCCW':('Engineering & Construction',lambda r:r['industry']=='Engineering & Construction'),
 'OBRI':('Real Estate Development',lambda r:r['industry']=='Real Estate Development'),
 'PRDC':('Real Estate Development',lambda r:r['industry']=='Real Estate Development'),
 'SDTI':('Hotels/Resorts/Cruise lines',lambda r:r['industry']=='Hotels/Resorts/Cruise lines'),
 'SIPC':('Pharmaceuticals: Major',lambda r:r['industry']=='Pharmaceuticals: Major'),
 'ZMID':('Real Estate Development',lambda r:r['industry']=='Real Estate Development'),
 # D1 batch added 28 Nov: unavailable-study stocks that have flow data (19 of the 20; VLMR held pending the VLMR/VLMRA line pick). Group choices are by feed label only; reasons are in NOTES below.
 'AIH':('Financial Conglomerates',lambda r:r['industry']=='Financial Conglomerates'),
 'AMIA':('Finance/Rental/Leasing',lambda r:r['industry']=='Finance/Rental/Leasing'),
 'ASPI':('Investment Banks/Brokers',lambda r:r['industry']=='Investment Banks/Brokers'),
 'ATLC':('Real Estate Development',lambda r:r['industry']=='Real Estate Development'),
 'BTFH':('Investment Banks/Brokers',lambda r:r['industry']=='Investment Banks/Brokers'),
 'CIEB':('Major Banks',lambda r:r['industry']=='Major Banks'),
 'CNFN':('Finance/Rental/Leasing',lambda r:r['industry']=='Finance/Rental/Leasing'),
 'CSAG':('Other Transportation',lambda r:r['industry']=='Other Transportation'),
 'EGTS':('Electric Utilities',lambda r:r['industry']=='Electric Utilities'),
 'ISMQ':('Steel',lambda r:r['industry']=='Steel'),
 'KABO':('Apparel/Footwear',lambda r:r['industry']=='Apparel/Footwear'),
 'MOED':('Miscellaneous Commercial Services',lambda r:r['industry']=='Miscellaneous Commercial Services'),
 'MPCI':('Pharmaceuticals: Major',lambda r:r['industry']=='Pharmaceuticals: Major'),
 'OFH':('Financial Conglomerates',lambda r:r['industry']=='Financial Conglomerates'),
 'OIH':('Wireless Telecommunications',lambda r:r['industry']=='Wireless Telecommunications'),
 'PRCL':('Specialty Stores',lambda r:r['industry']=='Specialty Stores'),
 'SVCE':('Construction Materials',lambda r:r['industry']=='Construction Materials'),
 'VALU':('Finance/Rental/Leasing',lambda r:r['industry']=='Finance/Rental/Leasing'),
 'ZEOT':('Agricultural Commodities/Milling',lambda r:r['industry']=='Agricultural Commodities/Milling'),
 # D3 batch added 28 Nov: unavailable-study stocks with a small peer group (weak comparison, 3-4 peers with figures). Group choices are by feed label only; reasons are in NOTES below.
 'ACAMD':('Investment Managers',lambda r:r['industry']=='Investment Managers'),
 'BIGP':('Wholesale Distributors',lambda r:r['industry']=='Wholesale Distributors'),
 'BINV':('Investment Managers',lambda r:r['industry']=='Investment Managers'),
 'ELWA':('Hotels/Resorts/Cruise lines',lambda r:r['industry']=='Hotels/Resorts/Cruise lines'),
 'EPPK':('Containers/Packaging',lambda r:r['industry']=='Containers/Packaging'),
 'MBEG':('Wholesale Distributors',lambda r:r['industry']=='Wholesale Distributors'),
 'MHOT':('Hotels/Resorts/Cruise lines',lambda r:r['industry']=='Hotels/Resorts/Cruise lines'),
 'MMAT':('Hotels/Resorts/Cruise lines',lambda r:r['industry']=='Hotels/Resorts/Cruise lines'),
 'ODIN':('Investment Managers',lambda r:r['industry']=='Investment Managers'),
 'SCTS':('Miscellaneous Commercial Services',lambda r:r['industry']=='Miscellaneous Commercial Services'),
 'SEIG':('Investment Managers',lambda r:r['industry']=='Investment Managers'),
 'SPHT':('Hotels/Resorts/Cruise lines',lambda r:r['industry']=='Hotels/Resorts/Cruise lines'),
 'TRTO':('Miscellaneous Commercial Services',lambda r:r['industry']=='Miscellaneous Commercial Services'),
 # D4 batch added 28 Nov: unavailable-study stocks whose own feed industry has too few peers with figures. AMII and VERT use wider like-business groups (same approach as LCSW and FWRY); the rest get no comparison.
 'AFMC':('Food Retail',lambda r:r['industry']=='Food Retail'),
 'AMII':('Producer Manufacturing',lambda r:r['sector']=='Producer Manufacturing'),
 'APSW':('Textiles',lambda r:r['industry']=='Textiles'),
 'BIOC':('Medical Distributors',lambda r:r['industry']=='Medical Distributors'),
 'DEIN':('Property/Casualty Insurance',lambda r:r['industry']=='Property/Casualty Insurance'),
 'EDFM':('Food: Specialty/Candy',lambda r:r['industry']=='Food: Specialty/Candy'),
 'EGREF':('Investment Trusts/Mutual Funds',lambda r:r['industry']=='Investment Trusts/Mutual Funds'),
 'GTWL':('Textiles',lambda r:r['industry']=='Textiles'),
 'ICLE':('Finance/Rental/Leasing',lambda r:r['industry']=='Finance/Rental/Leasing'),
 'MOIL':('Oilfield Services/Equipment',lambda r:r['industry']=='Oilfield Services/Equipment'),
 'MOIN':('Multi-Line Insurance',lambda r:r['industry']=='Multi-Line Insurance'),
 'NDRL':('Contract Drilling',lambda r:r['industry']=='Contract Drilling'),
 'RUBX':('Home Furnishings',lambda r:r['industry']=='Home Furnishings'),
 'SPIN':('Textiles',lambda r:r['industry']=='Textiles'),
 'SPMD':('Medical/Nursing Services',lambda r:r['industry']=='Medical/Nursing Services'),
 'TALM':('Other Consumer Services',lambda r:r['industry']=='Other Consumer Services'),
 'VERT':('Technology Services',lambda r:r['sector']=='Technology Services'),
 # D5 batch added 28 Nov: unavailable-study stocks with no own P/B or P/E in the feed (no comparison; group shown for context).
 'AALR':('Real Estate Development',lambda r:r['industry']=='Real Estate Development'),
 'ACAP':('Real Estate Development',lambda r:r['industry']=='Real Estate Development'),
 'ACFR':('Construction Materials',lambda r:r['industry']=='Construction Materials'),
 'ACTF':('Investment Banks/Brokers',lambda r:r['industry']=='Investment Banks/Brokers'),
 'ADPC':('Food: Meat/Fish/Dairy',lambda r:r['industry']=='Food: Meat/Fish/Dairy'),
 'ADRI':('Real Estate Development',lambda r:r['industry']=='Real Estate Development'),
 'AIDC':('Regional Banks',lambda r:r['industry']=='Regional Banks'),
 'AJWA':('Food: Specialty/Candy',lambda r:r['industry']=='Food: Specialty/Candy'),
 'ALXD':('Unclassified in the feed',lambda r:False),
 'AMES':('Hospital/Nursing Management',lambda r:r['industry']=='Hospital/Nursing Management'),
 'AMPI':('Packaged Software',lambda r:r['industry']=='Packaged Software'),
 'ANCC':('Construction Materials',lambda r:r['industry']=='Construction Materials'),
 'BIDI':('Containers/Packaging',lambda r:r['industry']=='Containers/Packaging'),
 'BQDC':('Major Banks',lambda r:r['industry']=='Major Banks'),
 'CFGH':('Apparel/Footwear Retail',lambda r:r['industry']=='Apparel/Footwear Retail'),
 'CICH':('Finance/Rental/Leasing',lambda r:r['industry']=='Finance/Rental/Leasing'),
 'CID':('Unclassified in the feed',lambda r:False),
 'CPME':('Financial Conglomerates',lambda r:r['industry']=='Financial Conglomerates'),
 'DCCC':('Marine Shipping',lambda r:r['industry']=='Marine Shipping'),
 'DGTZ':('Information Technology Services',lambda r:r['industry']=='Information Technology Services'),
 'DOMT':('Food: Meat/Fish/Dairy',lambda r:r['industry']=='Food: Meat/Fish/Dairy'),
 'ECAP':('Building Products',lambda r:r['industry']=='Building Products'),
 'EEP':('Unclassified in the feed',lambda r:False),
 # D6 batch added 28 Nov: unavailable-study stocks with no own P/B or P/E in the feed (no comparison; group shown for context).
 'EFAC':('Unclassified in the feed',lambda r:False),
 'EGOTH':('Unclassified in the feed',lambda r:False),
 'EGS65101C015':('Engineering & Construction',lambda r:r['industry']=='Engineering & Construction'),
 'EGS65621C012':('Unclassified in the feed',lambda r:False),
 'EGS65861C014':('Engineering & Construction',lambda r:r['industry']=='Engineering & Construction'),
 'EGS72L31C011':('Alternative Power Generation',lambda r:r['industry']=='Alternative Power Generation'),
 'EGSA':('Broadcasting',lambda r:r['industry']=='Broadcasting'),
 'EGWA':('Other Transportation',lambda r:r['industry']=='Other Transportation'),
 'ELAB':('Unclassified in the feed',lambda r:False),
 'ENPI':('Unclassified in the feed',lambda r:False),
 'FIRE':('Real Estate Development',lambda r:r['industry']=='Real Estate Development'),
 'FTNS':('Internet Software/Services',lambda r:r['industry']=='Internet Software/Services'),
 'GEOS':('Engineering & Construction',lambda r:r['industry']=='Engineering & Construction'),
 'GMCI':('Wholesale Distributors',lambda r:r['industry']=='Wholesale Distributors'),
 'GPPL':('Real Estate Development',lambda r:r['industry']=='Real Estate Development'),
 'GROV':('Investment Managers',lambda r:r['industry']=='Investment Managers'),
 'GSSC':('Food Retail',lambda r:r['industry']=='Food Retail'),
 'GTEX':('Financial Conglomerates',lambda r:r['industry']=='Financial Conglomerates'),
 'HDST':('Unclassified in the feed',lambda r:False),
 'IRON':('Steel',lambda r:r['industry']=='Steel'),
 'KNGC':('Home Furnishings',lambda r:r['industry']=='Home Furnishings'),
 'MISR':('Construction Materials',lambda r:r['industry']=='Construction Materials'),
 'MITR':('Unclassified in the feed',lambda r:False),
 # D7 batch added 28 Nov: unavailable-study stocks with no own P/B or P/E in the feed (no comparison; group shown for context).
 'MLIC':('Life/Health Insurance',lambda r:r['industry']=='Life/Health Insurance'),
 'MMHC':('Unclassified in the feed',lambda r:False),
 'NAHO':('Investment Banks/Brokers',lambda r:r['industry']=='Investment Banks/Brokers'),
 'NFCI':('Unclassified in the feed',lambda r:False),
 'NMIN':('Unclassified in the feed',lambda r:False),
 'OCAP':('Unclassified in the feed',lambda r:False),
 'PHGC':('Medical/Nursing Services',lambda r:r['industry']=='Medical/Nursing Services'),
 'PMSC':('Unclassified in the feed',lambda r:False),
 'POCO':('Other Transportation',lambda r:r['industry']=='Other Transportation'),
 'QNBE':('Regional Banks',lambda r:r['industry']=='Regional Banks'),
 'RAKT':('Pulp & Paper',lambda r:r['industry']=='Pulp & Paper'),
 'RTVC':('Engineering & Construction',lambda r:r['industry']=='Engineering & Construction'),
 'SIEG':('Construction Materials',lambda r:r['industry']=='Construction Materials'),
 'SINA':('Steel',lambda r:r['industry']=='Steel'),
 'TOUR':('Other Consumer Services',lambda r:r['industry']=='Other Consumer Services'),
 'TWSA':('Finance/Rental/Leasing',lambda r:r['industry']=='Finance/Rental/Leasing'),
 'TYCN':('Investment Banks/Brokers',lambda r:r['industry']=='Investment Banks/Brokers'),
 'UBEE':('Major Banks',lambda r:r['industry']=='Major Banks'),
 'UPMS':('Medical/Nursing Services',lambda r:r['industry']=='Medical/Nursing Services'),
 'WCDF':('Agricultural Commodities/Milling',lambda r:r['industry']=='Agricultural Commodities/Milling'),
 'WKOL':('Engineering & Construction',lambda r:r['industry']=='Engineering & Construction'),
 'YAYT':('Metal Fabrication',lambda r:r['industry']=='Metal Fabrication'),
 # D8 batch added 28 Nov: unavailable-study stocks the feed does not carry (no row at all). Empty entries; the note says why.
 'AIHC':('Not in the feed',lambda r:False),
 'EEPM':('Not in the feed',lambda r:False),
 'EGS220N1C016':('Not in the feed',lambda r:False),
 'EGS73M81C012':('Not in the feed',lambda r:False),
 'FCMD':('Not in the feed',lambda r:False),
 'HALN':('Not in the feed',lambda r:False),
 'SEIGA':('Not in the feed',lambda r:False),
 'SIDC':('Not in the feed',lambda r:False),
 # D2 batch added 28 Nov: unavailable-study stocks with a full comparison (own figure and enough peers). FAIT included per the user's line pick; FAITA (the USD line of the same bank) stays out and remains a peer-excluded duplicate. Group choices are by feed label only; reasons are in NOTES below.
 'AFDI':('Investment Banks/Brokers',lambda r:r['industry']=='Investment Banks/Brokers'),
 'ARAB':('Real Estate Development',lambda r:r['industry']=='Real Estate Development'),
 'CANA':('Regional Banks',lambda r:r['industry']=='Regional Banks'),
 'CEFM':('Agricultural Commodities/Milling',lambda r:r['industry']=='Agricultural Commodities/Milling'),
 'CPCI':('Pharmaceuticals: Major',lambda r:r['industry']=='Pharmaceuticals: Major'),
 'EASB':('Investment Banks/Brokers',lambda r:r['industry']=='Investment Banks/Brokers'),
 'EBSC':('Investment Banks/Brokers',lambda r:r['industry']=='Investment Banks/Brokers'),
 'EGBE':('Regional Banks',lambda r:r['industry']=='Regional Banks'),
 'ELNA':('Agricultural Commodities/Milling',lambda r:r['industry']=='Agricultural Commodities/Milling'),
 'EOSB':('Investment Banks/Brokers',lambda r:r['industry']=='Investment Banks/Brokers'),
 'FAIT':('Regional Banks',lambda r:r['industry']=='Regional Banks'),
 'GRCA':('Investment Banks/Brokers',lambda r:r['industry']=='Investment Banks/Brokers'),
 'IFAP':('Agricultural Commodities/Milling',lambda r:r['industry']=='Agricultural Commodities/Milling'),
 'KWIN':('Investment Banks/Brokers',lambda r:r['industry']=='Investment Banks/Brokers'),
 'MILS':('Agricultural Commodities/Milling',lambda r:r['industry']=='Agricultural Commodities/Milling'),
 'MIPH':('Pharmaceuticals: Major',lambda r:r['industry']=='Pharmaceuticals: Major'),
 'MOSC':('Agricultural Commodities/Milling',lambda r:r['industry']=='Agricultural Commodities/Milling'),
 'NEDA':('Chemicals: Agricultural',lambda r:r['industry']=='Chemicals: Agricultural'),
 'NIPH':('Pharmaceuticals: Major',lambda r:r['industry']=='Pharmaceuticals: Major'),
 'PRMH':('Investment Banks/Brokers',lambda r:r['industry']=='Investment Banks/Brokers'),
 'RKAZ':('Chemicals: Agricultural',lambda r:r['industry']=='Chemicals: Agricultural'),
 'ROTO':('Real Estate Development',lambda r:r['industry']=='Real Estate Development'),
 'SAIB':('Regional Banks',lambda r:r['industry']=='Regional Banks'),
 'SAUD':('Regional Banks',lambda r:r['industry']=='Regional Banks'),
 'SCFM':('Agricultural Commodities/Milling',lambda r:r['industry']=='Agricultural Commodities/Milling'),
 'UEFM':('Agricultural Commodities/Milling',lambda r:r['industry']=='Agricultural Commodities/Milling'),
}
NOTES={ # structural explanations only (design choices that do not depend on today's data). Data-state sentences are generated from the reason fields.
 'ORHD':'Uses the wider Real Estate Development group because the feed label (Homebuilding) has too few stocks.',
 'COMI':'Banks are compared on P/B first. P/E is secondary and must not be read alone.',
 'ETEL':'Group is the feed industry and is not widened to a broader sector.',
 'SWDY':'Group is the feed industry and is not widened to a broader sector.',
 'EAST':'Group is the feed industry and is not widened to a broader sector.',
 'TAQA':'Group is the feed industry (Electric Utilities). It is not widened to the whole Utilities sector, which mixes gas distribution with power generation.',
 'SKPC':'Group combines the two feed chemicals industries (Specialty and Agricultural) because Specialty alone has too few stocks with figures. Both are chemical producers in the same feed sector.',
 'ABUK':'Group is the feed industry and is not widened to a broader sector.',
 'ORAS':'Group is the feed industry and is not widened to a broader sector.',
 'PHDC':'Group is the feed industry and is not widened to a broader sector.',
 'ADIB':'Banks are compared on P/B first. P/E is secondary and must not be read alone.',
 'FWRY':'Uses the wider Technology Services sector because the feed industry (Packaged Software) has too few stocks with figures. All members are technology companies; the comparison is flagged weak.',
 'RMDA':'Group is the feed industry (Pharmaceuticals: Major, 9 peers with P/B and 5 with P/E) and is not widened, same treatment as ETEL, SWDY and EAST.',
 'RAYA':'Uses the wider Technology Services sector because the feed industry (Information Technology Services) has only one other stock, with no figures. All members are technology companies; the comparison is flagged weak.',
 'ORWE':'Group is the feed industry (Home Furnishings). It is not widened: the wider Consumer Durables sector is mostly real-estate developers, a different business.',
 'MFPC':'Group is the feed industry (Chemicals: Agricultural, mainly fertilizer makers) and is not widened.',
 'MCQE':'Group is the feed industry (Construction Materials, cement and related) and is not widened.',
 'LCSW':'Uses the wider Producer Manufacturing sector because the feed industry (Building Products) has only 2 peers with a P/B. The sector is all industrial manufacturers; the comparison is flagged weak.',
 'JUFO':'Group is the feed industry (Food: Meat/Fish/Dairy). It is not widened: the wider Consumer Non-Durables sector mixes tobacco, personal care and sweets, which are different businesses.',
 'ISPH':'Group is the feed industry (Medical Distributors) and is not widened to wholesale distributors or pharma makers, which have a different business model.',
 'ISMA':'Group is the feed industry (Agricultural Commodities/Milling), which mixes poultry, feed, sugar and milling companies, so the spread is wide.',
 'ICFC':'Group is the feed industry (agricultural chemicals and fertilizers).',
 'HDBK':'Banks are compared on P/B first. P/E is secondary and must not be read alone.',
 'ELKA':'Group is the feed industry (Real Estate Development), the same group used for ORHD, MASR, BONY and TMGH. P/B is read against asset-heavy peers.',
 'EFIH':'Uses the wider Technology Services sector because the feed industry (Packaged Software) has only 2 peers with a P/B. Same treatment as FWRY and RAYA; the comparison is flagged weak.',
 'EFID':'Group is the feed industry (Food: Specialty/Candy) and is not widened to the wider Consumer Non-Durables sector, which mixes unlike businesses.',
 # B4-B6. Structural explanations only; no fixed numbers that depend on the data of the day.
 'DSCW':'Group is the feed industry (Apparel/Footwear). It is not widened to the wider Consumer Non-Durables sector, which mixes tobacco, personal care and food, different businesses.',
 'ARCC':'Group is the feed industry (Construction Materials, cement and related), the same group as MCQE, and is not widened.',
 'AMOC':'Group is the feed industry (Oil Refining/Marketing). It is the only stock in that industry in the feed; the other energy names are drilling, oilfield services and gas distribution, different businesses, so the group is not widened.',
 'UEGC':'Group is the feed industry, the same group as ORAS, and is not widened to a broader sector.',
 'MEPA':'Group is the feed industry, the same group as UNIP. It is not widened to the wider Process Industries sector, which mixes chemicals, paper and other unlike businesses.',
 'ETRS':'Group is the feed industry (Other Transportation, transport and logistics). It is not widened: the rest of the Transportation sector is marine shipping, a different business.',
 'AMER':'Group is the feed industry, the same group used for ORHD, MASR, BONY, TMGH, PHDC and ELKA. P/B is read against asset-heavy peers.',
 'MCRO':'Group is the feed industry, the same group as RMDA, and is not widened to the whole Health Technology sector.',
 'ENGC':'Group is the feed industry (Building Products) and is not widened to a broader sector.',
 'MPRC':'Group is the feed industry (Movies/Entertainment). It is the only stock in that industry in the feed; the wider Consumer Services sector mixes hotels and other services, different businesses, so the group is not widened.',
 'ATQA':'Uses the wider Producer Manufacturing sector because the feed industry (Metal Fabrication) has too few peers with figures. The sector is all industrial manufacturers; the comparison is flagged weak.',
 'POUL':'Group is the feed industry, the same group as ISMA, which mixes poultry, feed, sugar and milling companies, so the spread is wide.',
 'MTIE':'Group is the feed industry (Electronics Distributors). It is the only stock in that industry in the feed; it is not widened to wholesale or food distributors, a different business model.',
 'MBSC':'Group is the feed industry, the same group as MCQE, and is not widened.',
 'SCEM':'Group is the feed industry, the same group as MCQE and MBSC, and is not widened.',
 'EXPA':'Banks are compared on P/B first. P/E is secondary and must not be read alone.',
 'OCDI':'Group is the feed industry, the same group used for the other real-estate developers. P/B is read against asset-heavy peers.',
 'EGAL':'Group combines the feed Aluminum and Steel industries, both primary metal producers, because the Aluminum industry alone is too small.',
 'CLHO':'Group is the feed industry (Hospital/Nursing Management, hospital operators). It is not widened to the wider Health Services sector.',
 'CCAP':'Group is the feed industry (Investment Managers, asset and investment management). It is not mixed with investment banks and brokers, a different business.',
 # C1. Structural explanations only; no fixed numbers that depend on the data of the day.
 'AIFI':'Group is the feed industry, the same group as ISMA and POUL, which mixes poultry, feed, sugar and milling companies, so the spread is wide.',
 'ALCN':'Group is the feed industry (Other Transportation, transport and logistics), the same group as ETRS. It is not widened: the rest of the Transportation sector is marine shipping, a different business.',
 'ASCM':'Group is the feed industry, the same group as MCQE, and is not widened.',
 'DAPH':'Group is the feed industry, the same group used for the other real-estate developers. P/B is read against asset-heavy peers.',
 'EGCH':'Group is the feed industry (agricultural chemicals and fertilizers), the same group as ABUK, MFPC and ICFC.',
 'EHDR':'Group is the feed industry, the same group used for the other real-estate developers. P/B is read against asset-heavy peers.',
 'ELSH':'Group is the feed industry, the same group used for the other real-estate developers. P/B is read against asset-heavy peers.',
 'EMFD':'Group is the feed industry, the same group used for the other real-estate developers. P/B is read against asset-heavy peers.',
 'GBCO':'Group is the feed industry (Wholesale Distributors, wholesale traders). It is not widened to the whole Distribution Services sector, which mixes food and electronics distribution.',
 'GPIM':'Group is the feed industry, the same group used for the other real-estate developers. P/B is read against asset-heavy peers.',
 'HELI':'Group is the feed industry (Homebuilding, residential builders) and is not widened to the wider real-estate development group.',
 'IDRE':'Group is the feed industry (Homebuilding, residential builders) and is not widened to the wider real-estate development group.',
 'IEEC':'Group is the feed industry, the same group as ORAS, and is not widened to a broader sector.',
 'MPCO':'Group is the feed industry, the same group as ISMA and POUL, which mixes poultry, feed, sugar and milling companies, so the spread is wide.',
 'NCCW':'Group is the feed industry, the same group as ORAS, and is not widened to a broader sector.',
 'OBRI':'Group is the feed industry, the same group used for the other real-estate developers. P/B is read against asset-heavy peers.',
 'PRDC':'Group is the feed industry, the same group used for the other real-estate developers. P/B is read against asset-heavy peers.',
 'SDTI':'Group is the feed industry (Hotels/Resorts/Cruise lines, hotels and resorts). It is not widened to the wider Consumer Services sector, which mixes movies and other services.',
 'SIPC':'Group is the feed industry, the same group as RMDA and MCRO, and is not widened to the whole Health Technology sector.',
 'ZMID':'Group is the feed industry, the same group used for the other real-estate developers. P/B is read against asset-heavy peers.',
 # D1. Structural explanations only; no fixed numbers that depend on the data of the day.
 'AIH':'Group is the feed industry (Financial Conglomerates, holding companies with mixed portfolios). The holdings differ from company to company, so the spread is wide.',
 'AMIA':'Group is the feed industry (Finance/Rental/Leasing, leasing and finance companies) and is not widened.',
 'ASPI':'Group is the feed industry (Investment Banks/Brokers) and is not widened to a broader sector.',
 'ATLC':'Group is the feed industry, the same group used for the other real-estate developers. P/B is read against asset-heavy peers.',
 'BTFH':'Group is the feed industry (Investment Banks/Brokers) and is not widened to a broader sector.',
 'CIEB':'Group is the feed industry (Major Banks) and is not widened to regional banks. Banks are compared on P/B first. P/E is secondary and must not be read alone.',
 'CNFN':'Group is the feed industry (Finance/Rental/Leasing, leasing and finance companies) and is not widened.',
 'CSAG':'Group is the feed industry (Other Transportation, transport and logistics), the same group as ETRS and ALCN. It is not widened: the rest of the Transportation sector is marine shipping, a different business.',
 'EGTS':'Group is the feed industry (Electric Utilities), the same group as TAQA. It is not widened to the whole Utilities sector, which mixes gas distribution with power generation.',
 'ISMQ':'Group is the feed industry (Steel, steel producers) and is not widened.',
 'KABO':'Group is the feed industry (Apparel/Footwear), the same group as DSCW. It is not widened to the wider Consumer Non-Durables sector, which mixes tobacco, personal care and food, different businesses.',
 'MOED':'Group is the feed industry (Miscellaneous Commercial Services). The businesses inside the label differ, so the comparison is approximate.',
 'MPCI':'Group is the feed industry, the same group as RMDA, MCRO and SIPC, and is not widened to the whole Health Technology sector.',
 'OFH':'Group is the feed industry (Financial Conglomerates, holding companies with mixed portfolios). The holdings differ from company to company, so the spread is wide.',
 'OIH':'Group is the feed industry (Wireless Telecommunications). It is not widened: the other telecom labels are fixed-line and specialty carriers, a different business.',
 'PRCL':'Group is the feed industry (Specialty Stores). It is not widened to the wider Retail Trade sector, which mixes food and apparel retail, different businesses.',
 'SVCE':'Group is the feed industry, the same group as MCQE, and is not widened.',
 'VALU':'Group is the feed industry (Finance/Rental/Leasing, leasing and finance companies) and is not widened.',
 'ZEOT':'Group is the feed industry, the same group as ISMA and POUL, which mixes poultry, feed, sugar and milling companies, so the spread is wide.',
 # D3. Structural explanations only; no fixed numbers that depend on the data of the day.
 'ACAMD':'Group is the feed industry (Investment Managers, asset and investment management), the same group as CCAP. It is not mixed with investment banks and brokers, a different business.',
 'BIGP':'Group is the feed industry (Wholesale Distributors, wholesale traders), the same group as GBCO. It is not widened to the whole Distribution Services sector, which mixes food and electronics distribution.',
 'BINV':'Group is the feed industry (Investment Managers, asset and investment management), the same group as CCAP. It is not mixed with investment banks and brokers, a different business.',
 'ELWA':'Group is the feed industry (Hotels/Resorts/Cruise lines, hotels and resorts), the same group as SDTI. It is not widened to the wider Consumer Services sector, which mixes movies and other services.',
 'EPPK':'Group is the feed industry, the same group as UNIP and MEPA. It is not widened to the wider Process Industries sector, which mixes chemicals, paper and other unlike businesses.',
 'MBEG':'Group is the feed industry (Wholesale Distributors, wholesale traders), the same group as GBCO. It is not widened to the whole Distribution Services sector, which mixes food and electronics distribution.',
 'MHOT':'Group is the feed industry (Hotels/Resorts/Cruise lines, hotels and resorts), the same group as SDTI. It is not widened to the wider Consumer Services sector, which mixes movies and other services.',
 'MMAT':'Group is the feed industry (Hotels/Resorts/Cruise lines, hotels and resorts), the same group as SDTI. It is not widened to the wider Consumer Services sector, which mixes movies and other services.',
 'ODIN':'Group is the feed industry (Investment Managers, asset and investment management), the same group as CCAP. It is not mixed with investment banks and brokers, a different business.',
 'SCTS':'Group is the feed industry (Miscellaneous Commercial Services), the same group as MOED. The businesses inside the label differ, so the comparison is approximate.',
 'SEIG':'Group is the feed industry (Investment Managers, asset and investment management), the same group as CCAP. It is not mixed with investment banks and brokers, a different business.',
 'SPHT':'Group is the feed industry (Hotels/Resorts/Cruise lines, hotels and resorts), the same group as SDTI. It is not widened to the wider Consumer Services sector, which mixes movies and other services.',
 'TRTO':'Group is the feed industry (Miscellaneous Commercial Services), the same group as MOED. The businesses inside the label differ, so the comparison is approximate.',
 # D4. Structural explanations only; no fixed numbers that depend on the data of the day.
 'AFMC':'Group is the feed industry (Food Retail, grocery and food stores). It is not widened to the wider Retail Trade sector, which mixes apparel and specialty retail, different businesses.',
 'AMII':'Uses the wider Producer Manufacturing sector because the feed industry (Building Products) has too few peers with figures. Same approach as LCSW; the sector is all industrial manufacturers and the comparison is flagged weak.',
 'APSW':'Group is the feed industry (Textiles). It is not widened to the wider Process Industries sector, which mixes chemicals, paper and metals, different businesses.',
 'BIOC':'Group is the feed industry (Medical Distributors), the same group as ISPH. It is not widened to wholesale distributors or pharma makers, which have a different business model.',
 'DEIN':'Group is the feed industry (Property/Casualty Insurance). It is not combined with the other insurance labels (life, multi-line): even together the insurance group is too small for a comparison.',
 'EDFM':'Group is the feed industry (Food: Specialty/Candy), the same group as EFID. It is not widened to the wider Consumer Non-Durables sector, which mixes unlike businesses.',
 'EGREF':'Group is the feed industry (Investment Trusts/Mutual Funds). A fund is not mixed with investment managers or brokers, a different business.',
 'GTWL':'Group is the feed industry (Textiles). It is not widened to the wider Process Industries sector, which mixes chemicals, paper and metals, different businesses.',
 'ICLE':'Group is the feed industry (Finance/Rental/Leasing, leasing and finance companies), the same group as AMIA, CNFN and VALU. It is not widened to the wider Finance sector.',
 'MOIL':'Group is the feed industry (Oilfield Services/Equipment). It is not widened: the other energy names are refining, drilling and gas distribution, different businesses.',
 'MOIN':'Group is the feed industry (Multi-Line Insurance). It is not combined with the other insurance labels (property/casualty, life): even together the insurance group is too small for a comparison.',
 'NDRL':'Group is the feed industry (Contract Drilling). It is not widened to oilfield services or refining, different businesses.',
 'RUBX':'Group is the feed industry (Home Furnishings), the same group as ORWE. It is not widened: the wider Consumer Durables sector is mostly real-estate developers, a different business.',
 'SPIN':'Group is the feed industry (Textiles). It is not widened to the wider Process Industries sector, which mixes chemicals, paper and metals, different businesses.',
 'SPMD':'Group is the feed industry (Medical/Nursing Services). It is not widened to hospital operators or the wider Health Services sector, a different business mix.',
 'TALM':'Group is the feed industry (Other Consumer Services). It is not widened to the wider Consumer Services sector, which mixes hotels, movies and other services.',
 'VERT':'Uses the wider Technology Services sector because the feed industry (Packaged Software) has too few peers with figures. All members are technology companies; the comparison is flagged weak.',
 # D5. Structural explanations only; no fixed numbers that depend on the data of the day.
 'AALR':'Group is the feed industry, the same group used for the other real-estate developers. P/B is read against asset-heavy peers.',
 'ACAP':'Group is the feed industry, the same group used for the other real-estate developers. P/B is read against asset-heavy peers.',
 'ACFR':'Group is the feed industry, the same group as MCQE, and is not widened.',
 'ACTF':'Group is the feed industry (Investment Banks/Brokers) and is not widened to a broader sector.',
 'ADPC':'Group is the feed industry (Food: Meat/Fish/Dairy). It is not widened: the wider Consumer Non-Durables sector mixes tobacco, personal care and sweets, which are different businesses.',
 'ADRI':'Group is the feed industry, the same group used for the other real-estate developers. P/B is read against asset-heavy peers.',
 'AIDC':'Banks are compared on P/B first. P/E is secondary and must not be read alone.',
 'AJWA':'Group is the feed industry (Food: Specialty/Candy), the same group as EFID. It is not widened to the wider Consumer Non-Durables sector, which mixes unlike businesses.',
 'ALXD':'The feed carries no industry label for this stock, so no peer group is defined.',
 'AMES':'Group is the feed industry (Hospital/Nursing Management, hospital operators), the same group as CLHO. It is not widened to the wider Health Services sector.',
 'AMPI':'Group is the feed industry (Packaged Software) and is not widened to the wider Technology Services sector.',
 'ANCC':'Group is the feed industry, the same group as MCQE, and is not widened.',
 'BIDI':'Group is the feed industry, the same group as UNIP and MEPA. It is not widened to the wider Process Industries sector, which mixes chemicals, paper and other unlike businesses.',
 'BQDC':'Banks are compared on P/B first. P/E is secondary and must not be read alone.',
 'CFGH':'Group is the feed industry (Apparel/Footwear Retail). It is not widened to the wider Retail Trade sector, which mixes food and specialty retail, different businesses.',
 'CICH':'Group is the feed industry (Finance/Rental/Leasing, leasing and finance companies), the same group as AMIA, CNFN and VALU. It is not widened to the wider Finance sector.',
 'CID':'The feed carries no industry label for this stock, so no peer group is defined.',
 'CPME':'Group is the feed industry (Financial Conglomerates, holding companies with mixed portfolios), the same group as AIH and OFH. The holdings differ from company to company, so the spread is wide.',
 'DCCC':'Group is the feed industry (Marine Shipping). It is not mixed with transport and logistics companies, a different business.',
 'DGTZ':'Group is the feed industry (Information Technology Services) and is not widened to the wider Technology Services sector.',
 'DOMT':'Group is the feed industry (Food: Meat/Fish/Dairy). It is not widened: the wider Consumer Non-Durables sector mixes tobacco, personal care and sweets, which are different businesses.',
 'ECAP':'Group is the feed industry (Building Products), the same group as ENGC. It is not widened to a broader sector.',
 'EEP':'The feed carries no industry label for this stock, so no peer group is defined.',
 # D6. Structural explanations only; no fixed numbers that depend on the data of the day.
 'EFAC':'The feed carries no industry label for this stock, so no peer group is defined.',
 'EGOTH':'The feed carries no industry label for this stock, so no peer group is defined.',
 'EGS65101C015':'Group is the feed industry, the same group as ORAS, and is not widened to a broader sector.',
 'EGS65621C012':'The feed carries no industry label for this stock, so no peer group is defined.',
 'EGS65861C014':'Group is the feed industry, the same group as ORAS, and is not widened to a broader sector.',
 'EGS72L31C011':'Group is the feed industry (Alternative Power Generation). It is not widened to the whole Utilities sector, which mixes gas distribution with power generation.',
 'EGSA':'Group is the feed industry (Broadcasting). It is not widened to the wider Consumer Services sector, which mixes hotels and other services.',
 'EGWA':'Group is the feed industry (Other Transportation, transport and logistics), the same group as ETRS. It is not widened: the rest of the Transportation sector is marine shipping, a different business.',
 'ELAB':'The feed carries no industry label for this stock, so no peer group is defined.',
 'ENPI':'The feed carries no industry label for this stock, so no peer group is defined.',
 'FIRE':'Group is the feed industry, the same group used for the other real-estate developers. P/B is read against asset-heavy peers.',
 'FTNS':'Group is the feed industry (Internet Software/Services) and is not widened to the wider Technology Services sector.',
 'GEOS':'Group is the feed industry, the same group as ORAS, and is not widened to a broader sector.',
 'GMCI':'Group is the feed industry (Wholesale Distributors, wholesale traders), the same group as GBCO. It is not widened to the whole Distribution Services sector, which mixes food and electronics distribution.',
 'GPPL':'Group is the feed industry, the same group used for the other real-estate developers. P/B is read against asset-heavy peers.',
 'GROV':'Group is the feed industry (Investment Managers, asset and investment management), the same group as CCAP. It is not mixed with investment banks and brokers, a different business.',
 'GSSC':'Group is the feed industry (Food Retail, grocery and food stores). It is not widened to the wider Retail Trade sector, which mixes apparel and specialty retail, different businesses.',
 'GTEX':'Group is the feed industry (Financial Conglomerates, holding companies with mixed portfolios), the same group as AIH and OFH. The holdings differ from company to company, so the spread is wide.',
 'HDST':'The feed carries no industry label for this stock, so no peer group is defined.',
 'IRON':'Group is the feed industry (Steel, steel producers), the same group as ISMQ. It is not widened.',
 'KNGC':'Group is the feed industry (Home Furnishings), the same group as ORWE. It is not widened: the wider Consumer Durables sector is mostly real-estate developers, a different business.',
 'MISR':'Group is the feed industry, the same group as MCQE, and is not widened.',
 'MITR':'The feed carries no industry label for this stock, so no peer group is defined.',
 # D7. Structural explanations only; no fixed numbers that depend on the data of the day.
 'MLIC':'Group is the feed industry (Life/Health Insurance). It is not combined with the other insurance labels: even together the insurance group is too small for a comparison.',
 'MMHC':'The feed carries no industry label for this stock, so no peer group is defined.',
 'NAHO':'Group is the feed industry (Investment Banks/Brokers) and is not widened to a broader sector.',
 'NFCI':'The feed carries no industry label for this stock, so no peer group is defined.',
 'NMIN':'The feed carries no industry label for this stock, so no peer group is defined.',
 'OCAP':'The feed carries no industry label for this stock, so no peer group is defined.',
 'PHGC':'Group is the feed industry (Medical/Nursing Services). It is not widened to hospital operators or the wider Health Services sector, a different business mix.',
 'PMSC':'The feed carries no industry label for this stock, so no peer group is defined.',
 'POCO':'Group is the feed industry (Other Transportation, transport and logistics), the same group as ETRS. It is not widened: the rest of the Transportation sector is marine shipping, a different business.',
 'QNBE':'Banks are compared on P/B first. P/E is secondary and must not be read alone.',
 'RAKT':'Group is the feed industry (Pulp & Paper) and is not mixed with packaging companies, a different business.',
 'RTVC':'Group is the feed industry, the same group as ORAS, and is not widened to a broader sector.',
 'SIEG':'Group is the feed industry, the same group as MCQE, and is not widened.',
 'SINA':'Group is the feed industry (Steel, steel producers), the same group as ISMQ. It is not widened.',
 'TOUR':'Group is the feed industry (Other Consumer Services). It is not widened to the wider Consumer Services sector, which mixes hotels, movies and other services.',
 'TWSA':'Group is the feed industry (Finance/Rental/Leasing, leasing and finance companies), the same group as AMIA, CNFN and VALU. It is not widened to the wider Finance sector.',
 'TYCN':'Group is the feed industry (Investment Banks/Brokers) and is not widened to a broader sector.',
 'UBEE':'Banks are compared on P/B first. P/E is secondary and must not be read alone.',
 'UPMS':'Group is the feed industry (Medical/Nursing Services). It is not widened to hospital operators or the wider Health Services sector, a different business mix.',
 'WCDF':'Group is the feed industry, the same group as ISMA and POUL, which mixes poultry, feed, sugar and milling companies, so the spread is wide.',
 'WKOL':'Group is the feed industry, the same group as ORAS, and is not widened to a broader sector.',
 'YAYT':'Group is the feed industry (Metal Fabrication) and is not widened to the wider Producer Manufacturing sector.',
 # D8. Structural explanations only.
 'AIHC':'The feed does not carry this stock, so there are no figures and no comparison.',
 'EEPM':'The feed does not carry this stock, so there are no figures and no comparison.',
 'EGS220N1C016':'The feed does not carry this stock, so there are no figures and no comparison.',
 'EGS73M81C012':'The feed does not carry this stock, so there are no figures and no comparison.',
 'FCMD':'The feed does not carry this stock, so there are no figures and no comparison.',
 'HALN':'The feed does not carry this stock, so there are no figures and no comparison.',
 'SEIGA':'The feed does not carry this stock, so there are no figures and no comparison.',
 'SIDC':'The feed does not carry this stock, so there are no figures and no comparison.',
 # D2. Structural explanations only; no fixed numbers that depend on the data of the day.
 'AFDI':'Group is the feed industry (Investment Banks/Brokers), the same group as ASPI and BTFH, and is not widened to a broader sector.',
 'ARAB':'Group is the feed industry, the same group used for the other real-estate developers. P/B is read against asset-heavy peers.',
 'CANA':'Banks are compared on P/B first. P/E is secondary and must not be read alone.',
 'CEFM':'Group is the feed industry, the same group as ISMA and POUL, which mixes poultry, feed, sugar and milling companies, so the spread is wide.',
 'CPCI':'Group is the feed industry, the same group as RMDA, MCRO, SIPC and MPCI, and is not widened to the whole Health Technology sector.',
 'EASB':'Group is the feed industry (Investment Banks/Brokers), the same group as ASPI and BTFH, and is not widened to a broader sector.',
 'EBSC':'Group is the feed industry (Investment Banks/Brokers), the same group as ASPI and BTFH, and is not widened to a broader sector.',
 'EGBE':'Banks are compared on P/B first. P/E is secondary and must not be read alone.',
 'ELNA':'Group is the feed industry, the same group as ISMA and POUL, which mixes poultry, feed, sugar and milling companies, so the spread is wide.',
 'EOSB':'Group is the feed industry (Investment Banks/Brokers), the same group as ASPI and BTFH, and is not widened to a broader sector.',
 'FAIT':'Banks are compared on P/B first. P/E is secondary and must not be read alone.',
 'GRCA':'Group is the feed industry (Investment Banks/Brokers), the same group as ASPI and BTFH, and is not widened to a broader sector.',
 'IFAP':'Group is the feed industry, the same group as ISMA and POUL, which mixes poultry, feed, sugar and milling companies, so the spread is wide.',
 'KWIN':'Group is the feed industry (Investment Banks/Brokers), the same group as ASPI and BTFH, and is not widened to a broader sector.',
 'MILS':'Group is the feed industry, the same group as ISMA and POUL, which mixes poultry, feed, sugar and milling companies, so the spread is wide.',
 'MIPH':'Group is the feed industry, the same group as RMDA, MCRO, SIPC and MPCI, and is not widened to the whole Health Technology sector.',
 'MOSC':'Group is the feed industry, the same group as ISMA and POUL, which mixes poultry, feed, sugar and milling companies, so the spread is wide.',
 'NEDA':'Group is the feed industry (agricultural chemicals and fertilizers), the same group as ABUK, MFPC, ICFC and EGCH.',
 'NIPH':'Group is the feed industry, the same group as RMDA, MCRO, SIPC and MPCI, and is not widened to the whole Health Technology sector.',
 'PRMH':'Group is the feed industry (Investment Banks/Brokers), the same group as ASPI and BTFH, and is not widened to a broader sector.',
 'RKAZ':'Group is the feed industry (agricultural chemicals and fertilizers), the same group as ABUK, MFPC, ICFC and EGCH.',
 'ROTO':'Group is the feed industry, the same group used for the other real-estate developers. P/B is read against asset-heavy peers.',
 'SAIB':'Banks are compared on P/B first. P/E is secondary and must not be read alone.',
 'SAUD':'Banks are compared on P/B first. P/E is secondary and must not be read alone.',
 'SCFM':'Group is the feed industry, the same group as ISMA and POUL, which mixes poultry, feed, sugar and milling companies, so the spread is wide.',
 'UEFM':'Group is the feed industry, the same group as ISMA and POUL, which mixes poultry, feed, sugar and milling companies, so the spread is wide.'}
def make_note(c,res):
    parts=[NOTES[c]] if c in NOTES else []
    for key,lab in (('pb','P/B'),('pe','P/E')):
        r=res['reason_'+key]
        if r=='no_own_figure': parts.append('The feed has no own %s for this stock.'%lab)
        elif r=='no_peers': parts.append('Fewer than 3 peers with a %s in the feed group, so no %s comparison.'%(lab,lab))
    return ' '.join(parts) or None
REVIEWED_BVPS={'CNFN':3.68}  # CNFN has no studies_rest page; BVPS from its reviewed study in guide.tsx (reviewed 2026-11-25): parent equity 4,400.1m / 1,196.3m shares
def reviewed_bvps(c):
    # Book value per share from the stock's reviewed study page (9M 2026 statements, as of 30 Sep 2026). Only positive values count.
    # BONY excluded: its study book value is a valuer's upper bound (asset revaluation), not the reported equity,
    # and the UI has no way to flag that, so a computed P/B would mislead. BONY keeps quality 'none' for P/B.
    if c=='BONY': return None
    try:
        v=json.loads(Path('studies_rest/studies_rest/pages/%s.json'%c).read_text())['stocks'][c]['book_value']['value']
        return v if isinstance(v,(int,float)) and v>0 else None
    except Exception:
        return REVIEWED_BVPS.get(c)
BANK_INDUSTRIES={'Regional Banks','Major Banks'}
# Second share line of the same company (identical market cap in the feed). Excluded as a peer so one company is not counted twice.
DUP={'VLMRA','FAITA'}
# Stocks the feed does not carry at all (no price, no industry, no figures). They get an empty entry, not a job failure.
NOFEED={'AIHC','EEPM','EGS220N1C016','EGS73M81C012','FCMD','HALN','SEIGA','SIDC'}
def post(b):
    req=urllib.request.Request('https://scanner.tradingview.com/egypt/scan',data=json.dumps(b).encode(),headers={'Content-Type':'application/json'})
    return json.loads(urllib.request.urlopen(req,timeout=40).read())
from zoneinfo import ZoneInfo
HOL=set()
for a,b in [("2026-01-07",None),("2026-01-29",None),("2026-03-19","2026-03-23"),("2026-04-13",None),("2026-04-25",None),("2026-05-07",None),("2026-05-26",None),("2026-05-27","2026-05-31"),("2026-06-18",None),("2026-07-02",None),("2026-07-23",None),("2026-08-27",None),("2026-10-06",None)]:
    x=datetime.date.fromisoformat(a);y=datetime.date.fromisoformat(b or a)
    while x<=y: HOL.add(x);x+=datetime.timedelta(1)
def expected_session():
    # latest session whose data should exist: today if open and Cairo time >= 15:00, else the previous trading day. Same holiday list as calendar.js (2026 only).
    n=datetime.datetime.now(ZoneInfo('Africa/Cairo'));d=n.date()
    if n.time()<datetime.time(15,0): d-=datetime.timedelta(1)
    for _ in range(31):
        if d.weekday() not in (4,5) and d not in HOL: return d.isoformat()
        d-=datetime.timedelta(1)
    return None
def sess(r):
    t=r.get('time')
    return datetime.datetime.fromtimestamp(t,datetime.timezone.utc).date().isoformat() if isinstance(t,(int,float)) and t>0 else None
def pos(v): return v if isinstance(v,(int,float)) and v>0 else None
def med(vals):
    return round(st.median(vals),2) if vals else None
try:
    data=post({'symbols':{'query':{'types':[]},'tickers':[]},'columns':COLS,'range':[0,600]})['data']
    rows={x['d'][0]:dict(zip(COLS,x['d'])) for x in data}
    missing=[c for c in G if c not in rows and c not in NOFEED]
    if len(rows)<200: raise AssertionError('feed returned only %d stocks'%len(rows))
    if missing: raise AssertionError('stocks missing from feed: '+', '.join(missing))
except Exception as e:
    # keep the old data and its old generated_utc, but mark it stale so the UI can show it; exit 1 fails the job (alert)
    now=datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    try: old=json.loads(OUT.read_text())
    except Exception: old={'stocks':{}}
    old['status']='stale';old['stale_checked_utc']=now;old['stale_reason']=type(e).__name__+': '+str(e)[:120]
    OUT.write_text(json.dumps(old,ensure_ascii=False,indent=1))
    print('FEED FAILED, old data kept and marked stale:',e);sys.exit(1)
from collections import Counter
sd=Counter(sess(r) for r in rows.values() if sess(r)).most_common(1)[0][0]  # latest daily-bar date shared by most stocks
out={'price_session':sd,'generated_utc':datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
 'source':'TradingView scanner egypt/scan (single source, not cross-checked, reuse terms unverified)',
 'expected_session':expected_session(),'up_to_date':sd==expected_session(),'note':'Peer groups are the feed\'s own labels, not EGX official sectors. Medians exclude the stock itself. Hint only, not fair value.','stocks':{}}
for c,(label,f) in G.items():
    me=rows.get(c);peers=[r for k,r in rows.items() if k!=c and k not in DUP and f(r)]
    rd=lambda v:round(v,2) if v else None
    res={'group':label,'feed_industry':me['industry'] if me else None,'price_session':sess(me) if me else None,'price':me['close'] if me else None,'pb':rd(pos(me['price_book_fq'])) if me else None,'pe':rd(pos(me['price_earnings_ttm'])) if me else None}
    # Own-figure fallback when the feed's ratio fields are null: compute from feed components (same source, same session), then from the reviewed study's book value per share.
    if me and res['pb'] is None:
        bv=pos(me.get('book_value_per_share_fq'))
        if bv and res['price']: res['pb']=rd(res['price']/bv);res['pb_src']='feed:book_value_per_share_fq'
        else:
            bv=reviewed_bvps(c)
            if bv and res['price']: res['pb']=rd(res['price']/bv);res['pb_src']='reviewed-study:book value per share (9M 2026 statements, as of 30 Sep 2026)'
    if me and res['pe'] is None:
        eps=pos(me.get('earnings_per_share_basic_ttm'))
        if eps and res['price']: res['pe']=rd(res['price']/eps);res['pe_src']='feed:earnings_per_share_basic_ttm'
    for key,fld in (('pb','price_book_fq'),('pe','price_earnings_ttm')):
        v=sorted(x for x in (pos(r[fld]) for r in peers) if x is not None)
        n=len(v);res['n_'+key]=n;res['median_'+key]=med(v) if n>=3 else None
        if res[key] is not None and n>=3: res['vs_'+key]='cheaper' if res[key]<res['median_'+key] else 'dearer' if res[key]>res['median_'+key] else 'same'
        else: res['vs_'+key]=None
        res['range_'+key]=[v[0],v[-1]] if n else None
        wide=n>=3 and (v[-1]>5*med(v) or v[0]<0.2*med(v))
        res['comparable_'+key]=res['vs_'+key] is not None   # medians/ranges may be stored for context but are a comparison only when this is true
        res['range_'+key+'_show']=n>=3 and not wide          # hide ranges with under 3 values or extreme values
        res['reason_'+key]=None if res['comparable_'+key] else ('no_own_figure' if res[key] is None else 'no_peers')
    ql=lambda n:'none' if n<3 else 'weak' if n<5 else 'ok'
    res['quality_pb']=ql(res['n_pb']);res['quality_pe']=ql(res['n_pe'])
    # overall quality = the best metric that has an own figure (a valid comparison on one metric is not hidden by the other)
    n=max([res[k] for k in('n_pb','n_pe') if res['pb' if k=='n_pb' else 'pe'] is not None] or [0])
    res['quality']=ql(n)
    res['quality_reason']=None if res['quality']!='none' else ('no_own_figure' if res['pb'] is None and res['pe'] is None else 'no_peers')
    res['pe_secondary']=(me['industry'] if me else None) in BANK_INDUSTRIES   # banks: P/B first, vs_pe must not be read alone
    res['note']=make_note(c,res)
    out['stocks'][c]=res
try: old=json.loads(OUT.read_text())
except Exception: old=None
core=lambda d:{k:v for k,v in d.items() if k not in('generated_utc','status','stale_checked_utc','stale_reason','checked_utc','expected_session','up_to_date')}
if old and core(old)==core(out):
    out['generated_utc']=old['generated_utc']  # unchanged data keeps its old stamp, never restamped as new
out['checked_utc']=datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
OUT.write_text(json.dumps(out,ensure_ascii=False,indent=1))
for c,r in out['stocks'].items(): print(c,r['pb'],r['median_pb'],r['n_pb'],'|',r['pe'],r['median_pe'],r['n_pe'],r['quality'],r['quality_reason'],r['vs_pb'],r['vs_pe'],'pe_secondary' if r['pe_secondary'] else '')
