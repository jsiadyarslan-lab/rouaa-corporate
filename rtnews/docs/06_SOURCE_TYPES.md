# 📋 Source Types

> قبل بناء OfficialSource، يجب فهم أنواع المصادر وكيف يختلف كل نوع.

## التصنيف الأساسي

### 1. Central Bank (بنك مركزي)
**عدد مستهدف:** 180  
**أمثلة:** Federal Reserve, ECB, BOE, BOJ, PBOC

**طرق الوصول:**
- RSS (الأكثر شيوعاً)
- HTML (صفحة الأخبار)
- PDF (البيانات الصحفية)
- JSON (بعض البنوك الحديثة)

**تكرار التحديث:**
- realtime (أثناء الاجتماعات)
- weekly (محاضر الاجتماعات)
- monthly (التقارير الشهرية)
- quarterly (التوقعات)

**أصول مرتبطة:**
- عملة الدولة (USD, EUR, GBP, JPY, CNY)
- سندات حكومية
- أسهم (مؤشرات)

**أحداث منتظرة:**
- rate_decision
- speech
- minutes
- forecast
- qer_report

---

### 2. Statistics (هيئة إحصاء)
**عدد مستهدف:** 250  
**أمثلة:** BLS, BEA, Eurostat, ONS, Statistics Canada

**طرق الوصول:**
- API (JSON)
- HTML (صفحة البيانات)
- CSV (تنزيل البيانات)
- PDF (التقارير)

**تكرار التحديث:**
- monthly (CPI, Employment)
- quarterly (GDP)
- annual

**أصول مرتبطة:**
- عملة الدولة
- أسهم
- سندات

**أحداث منتظرة:**
- data_release (CPI, GDP, Employment, Inflation)

---

### 3. Regulator (جهة تنظيمية)
**عدد مستهدف:** 400  
**أمثلة:** SEC, CFTC, FINRA, FCA, ESMA, BaFin, AMF

**طرق الوصول:**
- API (SEC EDGAR)
- RSS (FINRA)
- HTML (صفحة الإيداعات)
- XBRL (الإيداعات المالية)

**تكرار التحديث:**
- realtime (SEC filings)
- daily

**أصول مرتبطة:**
- أسهم محددة (حسب الشركة المودعة)

**أحداث منتظرة:**
- filing (8-K, 10-Q, 10-K)
- regulatory_action
- enforcement
- rating_action

---

### 4. Exchange (بورصة)
**عدد مستهدف:** 150  
**أمثلة:** NYSE, NASDAQ, CME, LSE, Euronext, Tadawul

**طرق الوصول:**
- API (market data)
- HTML (announcements)
- RSS (corporate actions)

**تكرار التحديث:**
- realtime

**أصول مرتبطة:**
- أسهم مدرجة
- مشتقات

**أحداث منتظرة:**
- listing
- delisting
- trading_halt
- corporate_action

---

### 5. Ministry (وزارة)
**عدد مستهدف:** 300  
**أمثلة:** US Treasury, UK HM Treasury, Ministries of Finance

**طرق الوصول:**
- RSS
- HTML
- PDF (budget reports)

**تكرار التحديث:**
- monthly
- quarterly
- annual (budget)

**أحداث منتظرة:**
- budget_release
- debt_auction
- policy_announcement

---

### 6. International Organization (هيئة دولية)
**عدد مستهدف:** 50  
**أمثلة:** IMF, World Bank, BIS, OECD, WTO, UNCTAD

**طرق الوصول:**
- HTML
- PDF (reports)
- API (data portals)

**تكرار التحديث:**
- monthly
- quarterly
- annual

**أحداث منتظرة:**
- report_release
- forecast_update
- policy_statement

---

### 7. Company (شركة مدرجة)
**عدد مستهدف:** 5000 (لاحقاً)  
**أمثلة:** Apple, Microsoft, Nvidia, Amazon, Tesla, JPMorgan

**طرق الوصول:**
- HTML (Investor Relations page)
- RSS (press releases)
- XBRL (SEC filings)
- PDF (annual reports)

**تكرار التحديث:**
- quarterly (earnings)
- ad_hoc (press releases)

**أصول مرتبطة:**
- سهم الشركة نفسها

**أحداث منتظرة:**
- earnings
- guidance
- dividend
- split
- m&a
- product_launch

---

### 8. Energy (طاقة)
**عدد مستهدف:** 30  
**أمثلة:** OPEC, IEA, EIA, Baker Hughes

**طرق الوصول:**
- HTML
- PDF (reports)
- CSV (data)

**تكرار التحديث:**
- weekly (EIA inventory)
- monthly (OPEC report)

**أصول مرتبطة:**
- Oil (WTI, Brent)
- Natural Gas
- Energy stocks

---

### 9. Metals (معادن)
**عدد مستهدف:** 20  
**أمثلة:** LBMA, LME, COMEX, World Gold Council, USGS

**أصول مرتبطة:**
- Gold, Silver, Copper, Platinum

---

### 10. Agriculture (زراعة)
**عدد مستهدف:** 20  
**أمثلة:** USDA, FAO, International Grains Council

**أصول مرتبطة:**
- Wheat, Corn, Soybeans, Coffee, Sugar

---

### 11. Crypto (عملات رقمية)
**عدد مستهدف:** 30  
**أمثلة:** Bitcoin Core, Ethereum Foundation, Binance, Coinbase

**أصول مرتبطة:**
- BTC, ETH, وغيرها

---

### 12. Rating Agency (وكالة تصنيف)
**عدد مستهدف:** 10  
**أمثلة:** Moody's, S&P, Fitch, DBRS

**أحداث منتظرة:**
- rating_action (upgrade, downgrade, outlook)

---

## Source Adapter Pattern

كل نوع مصدر يحتاج Adapter مختلف:

```
interface SourceAdapter {
  type: string
  fetch(source: OfficialSource): Promise<RawDocument[]>
  parse(raw: RawDocument): Promise<ParsedDocument>
  validate(doc: ParsedDocument): boolean
}
```

### Adapters المطلوبة:

| Adapter | المصادر المستهدفة | الأولوية |
|---------|-------------------|---------|
| RSSAdapter | البنوك المركزية، الوزارات | عالية |
| HTMLAdapter | الشركات، البورصات | عالية |
| APIAdapter | SEC، BLS، Eurostat | متوسطة |
| PDFAdapter | التقارير، الإيداعات | متوسطة |
| XBRLAdapter | SEC filings | منخفضة |
| CSVAdapter | بيانات الإحصاء | منخفضة |
