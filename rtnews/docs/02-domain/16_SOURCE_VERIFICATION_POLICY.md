# 🔍 Source Verification Policy

> متى نقبل مصدراً رسمياً؟ ومتى نرفضه؟

## معايير القبول

### يجب أن تتوفر ALL (AND):
1. ✅ الجهة حكومية أو شبه حكومية أو مؤسسة مالية رسمية
2. ✅ الموقع رسمي (ليس مدونة، ليس شبكة اجتماعية)
3. ✅ المحتوى أصلي (ليس إعادة نشر)
4. ✅ الموقع نشط (تحديث خلال آخر 90 يوماً)

## المصادر المقبولة

### ✅ بنوك مركزية
- الموقع الرسمي (.gov, .central.bank)
- صفحة الأخبار/البيانات الصحفية
- RSS إن وُجد

**أمثلة:**
- federalreserve.gov ✅
- ecb.europa.eu ✅
- bankofengland.co.uk ✅

### ✅ هيئات إحصاء حكومية
- الموقع الرسمي (.gov)
- صفحة البيانات/التقارير
- API إن وُجد

**أمثلة:**
- bls.gov ✅
- bea.gov ✅
- eurostat.ec.europa.eu ✅

### ✅ جهات تنظيمية
- الموقع الرسمي
- صفحة الإيداعات/القرارات
- API (SEC EDGAR)

**أمثلة:**
- sec.gov ✅
- finra.org ✅
- fca.org.uk ✅

### ✅ بورصات رسمية
- الموقع الرسمي
- صفحة Corporate Actions
- صفحة الإدراج/الشطب

**أمثلة:**
- nyse.com ✅
- nasdaq.com ✅
- cmegroup.com ✅

### ✅ وزارات المالية
- الموقع الرسمي (.gov)
- صفحة الموازنة/الدين

**أمثلة:**
- home.treasury.gov ✅
- gov.uk/government/organisations/hm-treasury ✅

### ✅ هيئات دولية
- الموقع الرسمي (.org)
- صفحة التقارير/البيانات

**أمثلة:**
- imf.org ✅
- worldbank.org ✅
- bis.org ✅

### ✅ صفحات Investor Relations للشركات
- الصفحة الرسمية للشركة
- قسم Investor Relations
- Press Releases
- SEC Filings

**أمثلة:**
- investor.apple.com ✅
- investors.microsoft.com ✅
- ir.tesla.com ✅

## المصادر المرفوضة

### ❌ مواقع إخبارية
- Reuters, Bloomberg, CNBC, CNN, etc.
- حتى لو "رسمية" — ليست مصدر بيانات أولي

### ❌ مدونات
- حتى لو على موقع رسمي
- الاستثناء: مدونة رسمية لبنك مركزي (تُقبل كـ HTML source)

### ❌ شبكات اجتماعية
- Twitter/X — حتى الحسابات الرسمية
- LinkedIn — حتى صفحات الشركات
- Facebook — حتى الصفحات الرسمية

**السبب:** المحتوى غير دائم، قابل للحذف، لا ضمان للسلامة.

### ❌ YouTube
- حتى القنوات الرسمية
- الاستثناء: خطابات مسؤولين (تُقبل كـ "speech" لكن مع transcript مطلوب)

### ❌ GitHub
- حتى المستودعات الرسمية
- الاستثناء: Whitepapers تقنية للعملات الرقمية (تُقبل بمراجعة)

### ❌ Reddit, Telegram, Discord
- حتى المجتمعات الرسمية
- غير رسمية بطبيعتها

### ❌ ويكيبيديا
- ليست مصدراً أولياً
- ممكن كمصدر للـ metadata فقط (تواريخ، أسماء)

## الحالات الخاصة

### 📋 Speeches (خطابات)
**مقبول إذا:**
- منشور على الموقع الرسمي للجهة
- نص كامل (وليس ملخص)
- تاريخ محدد

**مرفوض إذا:**
- فقط فيديو YouTube
- ملخص إعلامي

### 📋 Transcripts (محاضر)
**مقبول إذا:**
- منشور على الموقع الرسمي
- نص كامل

### 📋 Social Media Posts
**مقبول فقط إذا:**
- الحساب رسمي وموثق (blue check)
- المحتوى مالي رسمي (قرار، رقم)
- يوجد نسخة على الموقع الرسمي أيضاً

**مثال:** FOMC statement على Twitter = مقبول إذا موجود على federalreserve.gov

### 📋 Press Releases
**مقبول إذا:**
- منشور على الموقع الرسمي
- أو من خدمة رسمية (BusinessWire, PRNewswire) للشركات المدرجة

## عملية التحقق

```
Step 1: Automated Check
├── Domain is .gov or recognized .org?
├── SSL valid?
├── Content-Type correct?
└── Robots.txt allows?

Step 2: Manual Review (admin)
├── Is this an official entity?
├── Is the URL correct?
├── Is the content original?
└── Is the frequency sustainable?

Step 3: Trial Period
├── Fetch for 7 days
├── Check content quality
├── Verify no errors
└── If OK → isVerified = true
```

## مراجعة دورية

### شهرياً
- فحص `lastFetchedAt` للمصادر النشطة
- تعطيل أي مصدر لم يُجلب منه شيء منذ 30 يوماً

### ربع سنوياً
- مراجعة `authorityScore` لكل المصادر
- تحديث التصنيفات

### سنوياً
- مراجعة شاملة لـ Source Verification Policy
- تحديث معايير القبول
