# 03-ROUAA-ENGINEERING-SPECIFICATION-v1.md

**ROUAA Engineering Specification**

Version: v1.0
Status: Technical Implementation Standard

Derived from:

* ROUAA Technical Architecture Implementation Plan
* ROUAA API Contract Model
* ROUAA Data Model
* ROUAA Object Model
* ROUAA Intelligence Pipeline Model
* ROUAA AI Agent Model
* ROUAA Execution Sprint Plan

---

> **Structural note:** This is the **fourth document in the Execution phase**. It tells an engineer exactly how to write code — stack choice, architectural pattern, database schema, API contracts, repository structure, deployment, CI/CD, testing, and coding standards. After this, the next document narrows to the 90-day MVP.

---

# 0. Purpose

هذه الوثيقة تحدد **المواصفات الهندسية الفعلية** لبناء ROUAA.

الوثائق السابقة أجابت:

* لماذا نبني ROUAA؟
* ماذا نبني؟
* كيف تقسم المنظومة؟

هذه الوثيقة تجيب:

> كيف يكتب المهندس النظام فعليًا؟

---

# 1. Engineering Decision Summary

## القرار الأساسي

ROUAA لن تبدأ كـ Microservices كاملة.

الاختيار:

# Modular Monolith + Event-Driven Architecture

---

## السبب

Microservices مبكرًا ستضيف:

* تعقيد DevOps.
* صعوبة Debugging.
* تكلفة تشغيلية.
* مشاكل Distributed Systems.

لكن Monolith تقليدي سيؤدي إلى:

* ترابط شديد.
* صعوبة التوسع.

الحل:

```text
Single Deployment

+

Strong Internal Modules

+

Async Events

+

Clear Service Boundaries
```

---

# 2. Final Technology Stack

---

# Backend

## Primary

Node.js + TypeScript

Framework:

NestJS

---

الأسباب:

* Enterprise structure.
* Dependency Injection.
* Modules.
* Guards.
* Testing support.
* مناسب للـ API platform.

---

# AI / Data Processing

Python

Frameworks:

* FastAPI
* Pandas
* PyTorch ecosystem
* LangChain/LangGraph (where appropriate)

---

# Frontend

React + TypeScript

Build:

Vite

Framework layer:

* React Router
* TanStack Query
* Zustand

---

# UI System

ROUAA Design System

Based on:

* Component library
* Design tokens
* Accessibility standards

---

# Database Layer

## Primary Database

PostgreSQL

الاستخدام:

* Users
* Organizations
* Facts
* Events
* Evidence metadata
* Products
* Permissions

---

## Vector Database

للذكاء الدلالي:

Options:

* pgvector initially
* Dedicated vector database later

---

## Graph Database

للـ Knowledge Graph:

المرحلة الأولى:

PostgreSQL graph model

المرحلة المتقدمة:

Neo4j أو Graph database dedicated

---

# Object Storage

الاستخدام:

* PDFs
* Documents
* Reports
* Media

Compatible:

S3 API

---

# Cache

Redis

الاستخدام:

* Sessions
* API cache
* Queues
* Temporary intelligence results

---

# Message Queue

البداية:

BullMQ + Redis

التوسع:

Kafka

---

# 3. Repository Architecture

الهيكل:

```text
rouaa-platform/

├── apps/

│   ├── web/
│   ├── intelligence-portal/
│   ├── trading-platform/
│   ├── developer-portal/
│   └── admin/

│

├── backend/

│   ├── api/
│   ├── workers/
│   └── scheduler/

│

├── intelligence/

│   ├── document-engine/
│   ├── fact-engine/
│   ├── event-engine/
│   ├── evidence-engine/
│   ├── reasoning-engine/
│   └── agents/

│

├── packages/

│   ├── ui/
│   ├── types/
│   ├── database/
│   ├── auth/
│   ├── search/
│   └── utils/

│

├── infrastructure/

│   ├── docker/
│   ├── deployment/
│   └── monitoring/

│

└── docs/
```

---

# 4. Backend Module Architecture

NestJS Modules:

```text
src/

├── auth/

├── organizations/

├── users/

├── sources/

├── documents/

├── facts/

├── events/

├── evidence/

├── entities/

├── knowledge/

├── search/

├── insights/

├── agents/

├── products/

├── billing/

└── audit/
```

---

# 5. Data Architecture

## Core Entities

---

# Source

يمثل المصدر الرسمي.

Example:

Federal Reserve

Properties:

```text
id
name
type
country
authority_level
trust_score
status
```

---

# Document

يمثل الوثيقة.

```text
id
source_id
title
type
published_at
raw_content
processed_status
```

---

# Fact

يمثل الحقيقة المالية.

```text
id
metric
value
unit
period
source_document
confidence
```

---

# Event

يمثل الحدث.

```text
id
event_type
importance
affected_entities
impact_score
```

---

# Evidence

يمثل الدليل.

```text
id
fact_id
document_id
location
citation
hash
```

---

# Entity

يمثل:

* Company
* Institution
* Country
* Sector

---

# Insight

يمثل الناتج الاستخباراتي.

```text
id
type
summary
reasoning
evidence_links
```

---

# 6. API Specification

Base:

```text
/api/v1
```

---

# Sources API

```text
GET /sources

GET /sources/:id

POST /sources/import
```

---

# Documents API

```text
GET /documents

GET /documents/:id

POST /documents/process
```

---

# Facts API

```text
GET /facts

GET /facts/:id

POST /facts/extract
```

---

# Events API

```text
GET /events

GET /events/:id
```

---

# Evidence API

```text
GET /evidence/:id

GET /facts/:id/evidence
```

---

# Intelligence API

```text
GET /insights

POST /insights/generate
```

---

# Agent API

```text
POST /agents/query

GET /agents/:id/status
```

---

# 7. Intelligence Pipeline Implementation

المسار:

```text
Source

↓

Collector

↓

Raw Storage

↓

Document Processor

↓

Fact Extractor

↓

Event Detector

↓

Evidence Builder

↓

Knowledge Graph

↓

Reasoning Engine

↓

Insight
```

---

# 8. Worker Architecture

Workers مستقلة:

---

## Source Worker

وظيفته:

جلب البيانات.

---

## Document Worker

وظيفته:

المعالجة.

---

## Fact Worker

وظيفته:

استخراج الحقائق.

---

## Event Worker

وظيفته:

كشف الأحداث.

---

## AI Worker

وظيفته:

تشغيل الوكلاء.

---

# 9. AI Engineering Standards

## Rule 1

لا يوجد AI بدون Evidence.

---

## Rule 2

كل Agent يجب أن يحدد:

* Inputs
* Tools
* Reasoning Steps
* Outputs
* Confidence

---

## Rule 3

كل نتيجة AI يجب أن تحمل:

```text
Generated By

Evidence Used

Reasoning Trace

Timestamp
```

---

# 10. Search Architecture

## المرحلة الأولى

Hybrid Search:

```text
PostgreSQL Full Text

+

pgvector
```

---

## Search Flow

```text
User Query

↓

Intent Detection

↓

Semantic Retrieval

↓

Knowledge Filtering

↓

Evidence Ranking

↓

Answer
```

---

# 11. Authentication & Enterprise Security

## Authentication

JWT

مع دعم:

* OAuth
* SSO لاحقاً

---

## Authorization

RBAC:

```text
Organization

↓

Role

↓

Permission

↓

Resource
```

---

# 12. Multi-Tenant Model

كل بيانات العميل مرتبطة:

```text
tenant_id
```

---

Isolation:

* Database level
* API level
* Permission level

---

# 13. Testing Strategy

---

## Unit Tests

لكل Module.

---

## Integration Tests

لـ:

* APIs
* Database
* Workers

---

## Pipeline Tests

مثال:

```text
Official Document

↓

Fact

↓

Evidence

↓

Insight
```

---

## AI Evaluation Tests

قياس:

* Accuracy
* Hallucination rate
* Citation completeness

---

# 14. Observability

## Logging

Structured JSON logs.

---

## Metrics

مثل:

* Documents processed/hour
* Fact extraction accuracy
* API latency
* Queue failures

---

## Monitoring

Components:

* Application monitoring
* Database monitoring
* Worker monitoring

---

# 15. Deployment Architecture

## MVP Deployment

```text
Frontend

↓

API Server

↓

Worker Services

↓

PostgreSQL

↓

Redis

↓

Object Storage
```

---

## Production Deployment

```text
Load Balancer

↓

Containers

↓

Services

↓

Databases

↓

Monitoring
```

---

# 16. CI/CD Pipeline

كل Pull Request:

```text
Code Check

↓

Lint

↓

Tests

↓

Build

↓

Security Scan

↓

Deploy
```

---

# 17. Coding Standards

## Backend

* TypeScript strict mode
* Clean modules
* DTO validation
* Dependency injection

---

## Frontend

* Reusable components
* No duplicated logic
* Typed APIs

---

## AI

* Prompt versioning
* Model tracking
* Evaluation datasets

---

# 18. Development Order

الترتيب الإجباري:

## المرحلة الأولى

Foundation:

* Database
* Auth
* Source Registry

---

## المرحلة الثانية

Intelligence:

* Documents
* Facts
* Events
* Evidence

---

## المرحلة الثالثة

Knowledge:

* Entities
* Graph
* Search

---

## المرحلة الرابعة

AI:

* Agents
* Reasoning
* Insights

---

## المرحلة الخامسة

Products:

* Media
* Research
* Trading
* Risk

---

# 19. Engineering Anti-Patterns

يمنع:

❌ بناء UI قبل API
❌ بناء AI قبل Evidence
❌ بناء Agent بدون Evaluation
❌ إضافة Feature بدون Product Owner
❌ إنشاء خدمة مستقلة بدون سبب معماري
❌ تخزين معلومات بدون provenance

---

# 20. First Production Target

الهدف الأول ليس بناء كل ROUAA.

الهدف:

## Verified Intelligence Loop

النظام يجب أن يثبت:

```text
Official Source

↓

Document

↓

Fact

↓

Event

↓

Evidence

↓

AI Insight

↓

Published Intelligence
```

---

# Final Engineering State

بعد هذه الوثيقة:

لدينا:

| المجال                    | الحالة |
| ------------------------- | ------ |
| Vision                    | ✅      |
| Ecosystem                 | ✅      |
| Products                  | ✅      |
| Solutions                 | ✅      |
| Execution                 | ✅      |
| Sprints                   | ✅      |
| Architecture              | ✅      |
| Engineering Specification | ✅      |

---

## الخطوة التالية

الآن وصلنا إلى نقطة يجب فيها التوقف عن كتابة وثائق عامة.

الوثيقة التالية المفيدة فعلاً ستكون:

# **ROUAA MVP Build Specification v1.0**

لأنها ستجيب:

**ما الذي نبنيه خلال أول 90 يومًا فقط؟**

وتحدد:

* النسخة الأولى القابلة للعرض.
* الميزات التي تؤجل.
* ما يدخل الـ MVP.
* ما لا يدخل.
* ترتيب البناء الحقيقي بموارد محدودة.

وهذه الوثيقة مهمة جدًا لأن أكبر خطر على ROUAA الآن ليس نقص الأفكار، بل اتساع الرؤية أكثر من قدرة التنفيذ.

---
