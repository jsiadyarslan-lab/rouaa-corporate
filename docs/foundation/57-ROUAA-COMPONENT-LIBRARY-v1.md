# 57-ROUAA-COMPONENT-LIBRARY-v1.md

> **الوثيقة التي تحدد مكتبة المكونات الأساسية لموقع رؤى المؤسسي، وتحول نظام التصميم والـ Homepage Wireframe إلى وحدات قابلة لإعادة الاستخدام عبر جميع صفحات المنصة.**
>
> الهدف ليس بناء مجموعة UI Components فقط، بل بناء **Institutional Communication Components**؛ أي مكونات قادرة على نقل:
>
> * الثقة
> * الأدلة
> * المعمارية
> * القيمة المؤسسية
> * السلطة المعرفية
>
> تعتمد على:
>
> * ROUAA-DESIGN-SYSTEM-v1
> * ROUAA-HOMEPAGE-WIREFRAME-v1
> * SITE-NARRATIVE-v1
> * ENTERPRISE-TRUST-MODEL-v1
> * ROUAA-PLATFORM-MODEL-v1
> * ROUAA-BRAND-MODEL-v1
>
> تجيب عن السؤال:
>
> **ما هي الوحدات البصرية والتفاعلية التي تجعل تجربة رؤى متسقة وقابلة للتوسع؟**

**الإصدار:** v1.0
**الحالة:** Component Architecture Foundation — وثيقة تنفيذية
**النطاق:** Component Library & React Implementation Model

---

# 0. فلسفة مكتبة المكونات

في المنتجات الاستهلاكية:

Component = عنصر واجهة.

---

في رؤى:

Component = وحدة ثقة واتصال.

---

مثال:

بطاقة عادية:

```text
Title
Description
Button
```

---

بطاقة رؤى:

```text
Institutional Problem

↓

Capability

↓

Evidence / Context

↓

Business Outcome
```

---

# 1. Component Architecture

المكتبة تنقسم إلى خمس طبقات:

```text
ROUAA Component Library

|

├── Foundation Components

├── Intelligence Components

├── Trust Components

├── Enterprise Components

└── Conversion Components
```

---

# 2. Foundation Components

المكونات الأساسية المستخدمة في كل الصفحات.

---

# 2.1 Navigation System

## الهدف

إظهار بنية مؤسسة وليس موقع تسويقي.

---

Structure:

```text
Logo

Platform

Solutions

Trust

Research

Developers

Company

Request Briefing
```

---

خصائص:

* ثابت
* هادئ
* واضح
* لا يشتت

---

# 2.2 Hero Container

المكون الرئيسي للصفحات.

---

Structure:

```text
Eyebrow

Headline

Supporting Statement

Primary CTA

Secondary CTA

Visual Area
```

---

الاستخدام:

* Homepage
* Platform
* Research
* Trust

---

# 2.3 Section Header

لتقديم الأقسام.

---

Structure:

```text
Section Label

Heading

Explanation
```

---

مثال:

```text
TRUST FRAMEWORK

Every insight has a trace.
```

---

# 2.4 Content Grid

النظام الموحد للعرض.

يدعم:

* 2 Columns
* 3 Columns
* 4 Cards
* Asymmetric Layout

---

# 2.5 Data Point

لعرض مؤشرات مهمة.

---

Structure:

```text
Metric

Value

Context
```

---

مثال:

```text
Evidence Coverage

100%

Every insight traceable
```

---

# 3. Intelligence Components

المكونات التي تميز رؤى عن أي موقع Enterprise تقليدي.

---

# 3.1 Intelligence Flow Component

## أهم مكون بصري

يعرض تحول:

```text
Source

↓

Evidence

↓

Knowledge

↓

Reasoning

↓

Decision
```

---

الاستخدام:

* Homepage Hero
* Platform Page

---

التفاعل:

عند المرور:

تظهر تفاصيل كل طبقة.

---

# 3.2 Architecture Layer Component

لعرض طبقات النظام.

---

Structure:

```text
Layer Name

Purpose

Capabilities

Connected Layers
```

---

مثال:

```text
Knowledge Layer

Connects entities, events, and relationships.
```

---

# 3.3 Intelligence Object Card

مكون أساسي.

---

يعرض:

```text
Object Type

Definition

Source

Relationships
```

---

أنواع Objects:

* Fact
* Event
* Evidence
* Insight
* Decision

---

# 3.4 Knowledge Graph Preview

عرض مبسط لشبكة المعرفة.

---

العناصر:

```text
Entity

Relationship

Event

Context
```

---

الهدف:

إظهار العمق وليس استعراض التقنية.

---

# 3.5 Timeline Intelligence

لعرض الأحداث المالية.

---

Structure:

```text
Date

Event

Impact

Evidence
```

---

الاستخدام:

* Market Intelligence
* Research

---

# 4. Trust Components

هذه أهم طبقة للبيع المؤسسي.

---

# 4.1 Evidence Chain Component

المكون الأهم في رؤى.

---

Structure:

```text
Claim

↓

Evidence

↓

Source

↓

Timestamp

↓

Verification Status
```

---

الرسالة:

كل نتيجة لها أصل.

---

# 4.2 Source Citation Component

يعرض المصدر.

---

Structure:

```text
Source Name

Source Type

Date

Reference
```

---

يدعم:

* Official Sources
* Regulatory Documents
* Reports

---

# 4.3 Provenance Badge

شارة الثقة.

---

الحالات:

```text
Verified

Auditable

Governed

Reviewed
```

---

# 4.4 Trust Score Component

لعرض مستوى الثقة.

---

لا يستخدم كرقم تسويقي فقط.

بل:

```text
Confidence Level

Why?

Based On?
```

---

# 4.5 Governance Panel

مكون يشرح الحوكمة.

---

يعرض:

* Access
* Controls
* Review
* Audit

---

# 5. Enterprise Components

مكونات مخاطبة المؤسسات.

---

# 5.1 Outcome Card

بديل Feature Card.

---

Structure:

```text
Institutional Challenge

↓

ROUAA Capability

↓

Business Outcome
```

---

مثال:

بدل:

"AI Search"

نقول:

"Reduce research discovery time."

---

# 5.2 Solution Module

لشرائح العملاء.

---

Structure:

```text
Audience

Challenge

Workflow

Outcome
```

---

مثال:

```text
Asset Managers

Improve investment research consistency.
```

---

# 5.3 Capability Matrix

للمقارنة.

---

Structure:

```text
Capability

Current State

ROUAA State
```

---

# 5.4 Enterprise Architecture Diagram

لعملاء التقنية.

---

يعرض:

* Data
* Intelligence
* APIs
* Governance

---

# 5.5 Security Overview Card

يعرض:

```text
Security Principle

Implementation

Enterprise Benefit
```

---

# 6. Research Components

مكونات السلطة الفكرية.

---

# 6.1 Research Report Card

Structure:

```text
Report Title

Research Area

Date

Download / Explore
```

---

# 6.2 Framework Card

يعرض:

```text
Framework Name

Problem Solved

Application
```

---

# 6.3 Thought Leadership Article Card

ليس Blog Card تقليدي.

---

Structure:

```text
Insight

Research Question

Author / Institute

Read
```

---

# 6.4 Institute Highlight

عرض:

* Research Institute
* Fellows
* Publications

---

# 7. Conversion Components

مكونات التحويل.

---

# 7.1 Institutional CTA Block

المكون الرئيسي.

---

Structure:

```text
Problem Statement

Value

Request Briefing Button
```

---

لا:

```text
Sign Up
```

---

# 7.2 Briefing Request Form

ليس Contact Form.

---

الحقول:

```text
Name

Organization

Role

Area of Interest

Team Size

Message
```

---

# 7.3 Enterprise Qualification Flow

قبل المبيعات.

---

يجمع:

* المؤسسة
* المجال
* الاحتياج
* المرحلة

---

# 8. Component Naming Convention

النظام:

```text
Rouaa + Category + Component
```

---

أمثلة:

```text
RouaaEvidenceChain

RouaaOutcomeCard

RouaaArchitectureLayer

RouaaResearchCard
```

---

# 9. Component States

كل مكون يجب أن يدعم:

## Default

الحالة الأساسية.

---

## Hover

تفاعل بسيط.

---

## Expanded

تفاصيل إضافية.

---

## Mobile

عرض صغير.

---

## Dark Mode

بيئة المؤسسة.

---

# 10. Component Documentation

كل مكون يحتوي:

```text
Purpose

Usage

Do / Don't

Props

States

Examples
```

---

# 11. React Implementation Model

البنية المقترحة:

```text
src/

components/

├── foundation/

├── intelligence/

├── trust/

├── enterprise/

├── research/

└── conversion/
```

---

# 12. Design System Integration

المكونات تعتمد على:

```text
Tokens

↓

Components

↓

Pages

↓

Applications
```

---

# 13. Component Quality Test

قبل اعتماد أي مكون:

السؤال:

هل يزيد:

* الفهم؟
* الثقة؟
* القرار؟

إذا لا:

لا يتم بناؤه.

---

# 14. ما يجب عدم بنائه

لا نبني:

❌ Generic Pricing Cards
❌ SaaS Feature Cards
❌ AI Chat Widget UI
❌ Social Media Sections
❌ Excessive Animations
❌ Marketing Counters بلا معنى

---

# 15. الأولوية التنفيذية

## Phase 1 — Core Enterprise Components

يجب تنفيذ:

1. Hero Container
2. Intelligence Flow
3. Outcome Card
4. Evidence Chain
5. Architecture Layer
6. Trust Block
7. Institutional CTA

---

## Phase 2 — Content Components

8. Research Card
9. Framework Card
10. Solution Module

---

## Phase 3 — Advanced

11. Knowledge Graph Preview
12. Timeline Intelligence
13. Enterprise Architecture Viewer

---

# 16. النتيجة النهائية

مكتبة مكونات رؤى تحول الموقع من:

```text
Static Corporate Website
```

إلى:

```text
Institutional Intelligence Experience System
```

---

# STATUS

## 57-ROUAA-COMPONENT-LIBRARY-v1

COMPLETED:

✓ Component Philosophy
✓ Architecture Layers
✓ Foundation Components
✓ Intelligence Components
✓ Trust Components
✓ Enterprise Components
✓ Research Components
✓ Conversion Components
✓ Naming Convention
✓ React Structure
✓ Documentation Rules
✓ Implementation Priority

---

## NEXT DOCUMENT

# 58-ROUAA-PAGE-ARCHITECTURE-MODEL-v1.md

الخطوة المنطقية التالية:

تحديد جميع صفحات الموقع المؤسسي:

* صفحات المنصة
* صفحات الحلول
* صفحات الثقة
* صفحات البحث
* صفحات المطورين
* صفحات الشركة

مع وظيفة كل صفحة، الرسائل، والمكونات المستخدمة قبل بدء كتابة HTML/React.

---
