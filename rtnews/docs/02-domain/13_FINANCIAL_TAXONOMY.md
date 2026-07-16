# 🌳 Financial Taxonomy

> تصنيف هرمي لكل الأحداث والكيانات المالية في النظام.
> بدون Taxonomy، البحث والفلترة والتحليل ستكون فوضى.

## بنية التصنيف

```
Domain (مجال)
  ↓
Category (فئة)
  ↓
Subcategory (فئة فرعية)
  ↓
Type (نوع)
  ↓
Subtype (نوع فرعي)
```

## 1. Macro (اقتصاد كلي)

```
Macro
├── Monetary Policy (سياسة نقدية)
│   ├── Rate Decision
│   │   ├── Hike (رفع)
│   │   ├── Cut (خفض)
│   │   └── Hold (إبقاء)
│   ├── Forward Guidance
│   ├── QE/QT (تيسير كمي/تشديد كمي)
│   └── Minutes (محاضر)
├── Inflation (تضخم)
│   ├── CPI
│   │   ├── Headline
│   │   └── Core
│   ├── PCE
│   │   ├── Headline
│   │   └── Core
│   ├── PPI
│   └── Wage Growth
├── Employment (توظيف)
│   ├── Non-Farm Payrolls
│   ├── Unemployment Rate
│   ├── Jobless Claims
│   │   ├── Initial
│   │   └── Continuing
│   └── Labor Force Participation
├── Growth (نمو)
│   ├── GDP
│   │   ├── Advance
│   │   ├── Second
│   │   └── Final
│   ├── Retail Sales
│   ├── Industrial Production
│   └── Consumer Confidence
├── Trade (تجارة)
│   ├── Trade Balance
│   ├── Tariffs
│   └── Export/Import Data
└── Fiscal (مالية عامة)
    ├── Budget
    ├── Debt
    └── Tax Policy
```

## 2. Corporate (شركات)

```
Corporate
├── Earnings (أرباح)
│   ├── Revenue
│   ├── EPS
│   ├── Guidance
│   └── Margin
├── Filings (إيداعات)
│   ├── 8-K (Material Event)
│   ├── 10-Q (Quarterly)
│   ├── 10-K (Annual)
│   ├── S-1 (IPO)
│   └── DEF 14A (Proxy)
├── Corporate Actions
│   ├── Dividend
│   │   ├── Declaration
│   │   └── Cut
│   ├── Stock Split
│   ├── Buyback
│   └── Delisting
├── M&A (استحواذ/اندماج)
│   ├── Acquisition
│   ├── Merger
│   └── Divestiture
└── Management
    ├── CEO Change
    ├── Board Change
    └── Executive Departure
```

## 3. Markets (أسواق)

```
Markets
├── Equities (أسهم)
│   ├── Listing
│   ├── Trading Halt
│   ├── Circuit Breaker
│   └── Index Rebalance
├── Fixed Income (سندات)
│   ├── Auction
│   ├── Yield Change
│   └── Credit Spread
├── Forex (عملات)
│   ├── Intervention
│   ├── Peg Change
│   └── Reserve Change
├── Commodities (سلع)
│   ├── Inventory
│   ├── Production Cut
│   └── Supply Disruption
└── Crypto
    ├── Hard Fork
    ├── Protocol Upgrade
    ├── Listing
    └── Delisting
```

## 4. Regulatory (تنظيمي)

```
Regulatory
├── Enforcement
│   ├── Fine
│   ├── Investigation
│   └── Ban
├── Rule Making
│   ├── Proposed Rule
│   ├── Final Rule
│   └── Effective Date
├── Rating Actions
│   ├── Upgrade
│   ├── Downgrade
│   ├── Outlook Change
│   └── Watch
└── Compliance
    ├── Filing Deadline
    ├── Disclosure
    └── Restatement
```

## 5. Geopolitical (جيوسياسي)

```
Geopolitical
├── Conflict
│   ├── Escalation
│   ├── Ceasefire
│   └── Resolution
├── Sanctions
│   ├── Imposition
│   ├── Easing
│   └── Removal
├── Trade
│   ├── Tariff
│   ├── Agreement
│   └── Dispute
├── Political
│   ├── Election
│   ├── Policy Change
│   └── Government Change
└── Energy Security
    ├── Supply Disruption
    ├── Strategic Reserve
    └── Pipeline
```

## 6. Energy (طاقة)

```
Energy
├── Oil
│   ├── OPEC Decision
│   ├── Inventory (EIA)
│   ├── Production
│   └── Rig Count
├── Natural Gas
│   ├── Inventory
│   ├── Production
│   └── LNG
├── Renewables
│   ├── Capacity
│   └── Investment
└── Nuclear
    ├── Output
    └── Policy
```

## 7. Metals (معادن)

```
Metals
├── Precious
│   ├── Gold
│   ├── Silver
│   ├── Platinum
│   └── Palladium
├── Industrial
│   ├── Copper
│   ├── Aluminum
│   ├── Nickel
│   └── Zinc
└── Rare Earth
```

## استخدام Taxonomy

### في قاعدة البيانات
```prisma
model OfficialEvent {
  // ...
  domain      String  // macro | corporate | markets | regulatory | geopolitical | energy | metals
  category    String  // monetary_policy | earnings | etc.
  subcategory String? // rate_decision | revenue | etc.
  type        String  // hike | cut | hold | etc.
}
```

### في البحث
```
GET /api/events?domain=macro&category=monetary_policy&type=hike
GET /api/events?domain=corporate&category=earnings&entity=AAPL
```

### في الفلاتر
```
[Macro] [Corporate] [Markets] [Regulatory] [Geopolitical] [Energy] [Metals]
   ↓        ↓          ↓          ↓            ↓            ↓         ↓
[Monetary][Earnings] [Equities] [Enforcement][Conflict]  [Oil]    [Gold]
```
