# إعداد الجدولة التلقائية لتوليد الأخبار

## نظرة عامة

تم تحديث نظام توليد الأخبار التلقائية ليعمل بشكل مستدام وفعال في جميع البيئات (development و production).

## الميزات الجديدة

### 1. التحكم عبر متغيرات البيئة
- `ENABLE_AUTO_SCHEDULER=true`: تفعيل الجدولة في development mode
- `NODE_ENV=production`: تفعيل تلقائي في production
- `WEBHOOK_SECRET`: سر للمصادقة (مهم للأمان)
- `BASE_URL`: رابط الخادم (اختياري، الافتراضي: localhost:3000)

### 2. إعادة المحاولة التلقائية
- إعادة محاولة حتى 3 مرات عند الفشل
- استخدام `force=true` تلقائياً عند تعليق الـ pipeline
- مهلة 30 ثانية بين المحاولات

### 3. إحصائيات التشغيل
- تسجيل عدد التشغيلات الناجحة والفاشلة
- طباعة إحصائيات كل ساعة
- تتبع آخر خطأ

### 4. الفواصل الزمنية
- **كل 15 دقيقة**: تشغيل warmup pipeline
- **تشغيل أولي**: بعد دقيقتين من بدء الخادم

## الإعداد في Development

### الخطوة 1: تفعيل الجدولة
```bash
# إضافة إلى .env.local
ENABLE_AUTO_SCHEDULER=true
WEBHOOK_SECRET=your-secret-here
```

### الخطوة 2: تشغيل الخادم
```bash
npm run dev
```

### الخطوة 3: التحقق من التشغيل
افتح السجلات (logs) وابحث عن:
```
[Instrumentation] Server starting...
[Instrumentation] Development mode - starting auto scheduler...
[Scheduler] Auto news scheduler initialized
[Scheduler] Will run initial pipeline in 2 minutes...
```

## الإعداد في Production

### على Railway
أضف المتغيرات التالية في Environment Variables:
```
NODE_ENV=production
ENABLE_AUTO_SCHEDULER=true
WEBHOOK_SECRET=your-secure-random-secret
BASE_URL=https://your-domain.railway.app
```

### على Vercel
أضف في Environment Variables:
```
NODE_ENV=production
ENABLE_AUTO_SCHEDULER=true
WEBHOOK_SECRET=your-secure-random-secret
```

### على خادم VPS
```bash
# في /etc/systemd/system/roua-news.service
Environment="NODE_ENV=production"
Environment="ENABLE_AUTO_SCHEDULER=true"
Environment="WEBHOOK_SECRET=your-secure-random-secret"
```

## مراقبة الحالة

### فحص السجلات
افتح logs في Railway أو سجلات الخادم وابحث عن:
```
[Scheduler] Stats: X/Y successful | Errors: Z | Next run in ~Nmin
[Scheduler] Hourly Stats: Total=X, Success=Y, Failed=Z
```

### تشغيل يدوي للاختبار
```bash
# Warmup pipeline
curl -X POST "http://localhost:3000/api/news/warmup"
```

## استكشاف الأخطاء

### المشكلة: الجدولة لا تبدأ
**الحل**: تأكد من ضبط `ENABLE_AUTO_SCHEDULER=true` أو `NODE_ENV=production`

### المشكلة: أخطاء متكررة
**الحل**: النظام يعيد المحاولة تلقائياً. إذا استمر، تحقق من:
- اتصال API الخارجي
- اتصال قاعدة البيانات
- متغيرات البيئة

### المشكلة: لا أخبار جديدة
**الحل**: تحقق من:
- `GLM_API_KEY` صحيح
- اتصال AI يعمل
- endpoint `/api/news/warmup` يعمل

## الأمان

### WEBHOOK_SECRET
يجب أن يكون سلسلة عشوائية طويلة:
```bash
# توليد سر عشوائي
openssl rand -hex 32
```

### في Production
- استخدم HTTPS فقط
- لا تضمن الأسرار في الكود
- استخدم Environment Variables
- قم بتدوير الأسرار بشكل دوري

## الملفات المعدلة

1. `src/instrumentation.ts` - محرك الجدولة التلقائية (محدث)

## الدعم

إذا واجهت مشاكل، تحقق من:
1. سجلات الخادم (logs)
2. endpoint `/api/news/warmup`
