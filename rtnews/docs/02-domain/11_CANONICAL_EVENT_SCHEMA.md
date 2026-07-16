# ⭐ Canonical Event Schema

> هذا هو العقد (Contract) الذي يلتزم به كل جزء في النظام.
> Collectors, Parsers, AI Agents, Database, APIs, UI, QuantLab.
> إذا صُمم جيداً، يصبح العمود الفقري للنظام كله.

## Event Object — Canonical Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "CanonicalFinancialEvent",
  "description": "The universal contract for all financial events in the system",
  "type": "object",
  "required": ["id", "type", "entity", "eventDate", "source", "confidence", "evidence"],
  "properties": {
    "id": {
      "type": "string",
      "description": "Globally unique identifier (cuid)",
      "pattern": "^c[a-z0-9]{20,}$"
    },
    "domain": {
      "type": "string",
      "enum": ["macro", "corporate", "markets", "regulatory", "geopolitical", "energy", "metals"],
      "description": "Top-level domain classification"
    },
    "category": {
      "type": "string",
      "description": "Category within domain (e.g., monetary_policy, earnings)"
    },
    "subcategory": {
      "type": ["string", "null"],
      "description": "Subcategory (e.g., rate_decision, revenue)"
    },
    "type": {
      "type": "string",
      "description": "Specific event type (e.g., hike, cut, hold, filing_8k)"
    },
    "title": {
      "type": "string",
      "description": "Human-readable event title",
      "minLength": 5,
      "maxLength": 300
    },
    "entity": {
      "type": "object",
      "required": ["name"],
      "properties": {
        "name": { "type": "string", "description": "Federal Reserve, Apple Inc, SEC" },
        "symbol": { "type": ["string", "null"], "description": "Ticker (AAPL) if company" },
        "type": { "type": "string", "enum": ["central_bank", "company", "regulator", "government", "exchange", "intl_org", "rating_agency"] }
      }
    },
    "country": {
      "type": ["object", "null"],
      "properties": {
        "name": { "type": "string" },
        "code": { "type": "string", "pattern": "^[A-Z]{2}$", "description": "ISO 3166-1 alpha-2" }
      }
    },
    "value": {
      "type": ["object", "null"],
      "description": "The primary quantitative value of the event",
      "properties": {
        "amount": { "type": ["string", "number"] },
        "unit": { "type": "string", "description": "bps, %, $, points" },
        "direction": { "type": "string", "enum": ["increase", "decrease", "neutral", "unchanged"] },
        "previous": { "type": ["string", "number", "null"] }
      }
    },
    "affectedAssets": {
      "type": "array",
      "description": "Assets impacted by this event",
      "items": {
        "type": "object",
        "required": ["symbol", "direction"],
        "properties": {
          "symbol": { "type": "string", "description": "USD, GOLD, AAPL, BTC" },
          "direction": { "type": "string", "enum": ["up", "down", "neutral"] },
          "reason": { "type": "string" },
          "magnitude": { "type": ["string", "null"], "description": "high, medium, low" }
        }
      }
    },
    "source": {
      "type": "object",
      "required": ["id", "name"],
      "properties": {
        "id": { "type": "string", "description": "OfficialSource ID" },
        "name": { "type": "string" },
        "authorityScore": { "type": "integer", "minimum": 0, "maximum": 100 }
      }
    },
    "documents": {
      "type": "array",
      "description": "Official documents this event is derived from",
      "items": {
        "type": "object",
        "required": ["id", "url"],
        "properties": {
          "id": { "type": "string" },
          "url": { "type": "string", "format": "uri" },
          "documentType": { "type": "string" },
          "hash": { "type": "string" }
        }
      }
    },
    "evidence": {
      "type": "array",
      "description": "Evidence linking event claims to source documents",
      "items": {
        "type": "object",
        "required": ["documentId", "type"],
        "properties": {
          "documentId": { "type": "string" },
          "type": { "type": "string", "enum": ["quote", "table", "chart", "paragraph"] },
          "reference": { "type": "string", "description": "para 2, table 1, line 5" },
          "text": { "type": "string", "description": "The exact text from the document" },
          "hash": { "type": "string" }
        }
      }
    },
    "confidence": {
      "type": "integer",
      "minimum": 0,
      "maximum": 100,
      "description": "100 = direct from official source, 50 = AI inferred, 0 = unverified"
    },
    "impactLevel": {
      "type": "string",
      "enum": ["low", "medium", "high", "critical"]
    },
    "eventDate": {
      "type": "string",
      "format": "date-time",
      "description": "When the event occurred (not when we detected it)"
    },
    "publishedAt": {
      "type": ["string", "null"],
      "format": "date-time"
    },
    "detectedAt": {
      "type": "string",
      "format": "date-time",
      "description": "When our system detected this event"
    },
    "locale": {
      "type": "string",
      "enum": ["ar", "en", "fr", "tr", "es"]
    },
    "lifecycle": {
      "type": "string",
      "enum": ["detected", "collected", "parsed", "extracted", "validated", "classified", "linked", "published", "archived", "failed"],
      "description": "Current state in the event lifecycle"
    }
  }
}
```

## مثال: قرار الفائدة الفيدرالي

```json
{
  "id": "cmrx7f2e100001l9wbn3m4k2j",
  "domain": "macro",
  "category": "monetary_policy",
  "subcategory": "rate_decision",
  "type": "hike",
  "title": "Federal Reserve Raises Rate by 25bps to 5.50%",
  "entity": {
    "name": "Federal Reserve",
    "symbol": null,
    "type": "central_bank"
  },
  "country": { "name": "USA", "code": "US" },
  "value": {
    "amount": "+25",
    "unit": "bps",
    "direction": "increase",
    "previous": "5.25-5.50%"
  },
  "affectedAssets": [
    { "symbol": "USD", "direction": "up", "reason": "hawkish stance", "magnitude": "medium" },
    { "symbol": "GOLD", "direction": "down", "reason": "higher rates reduce gold appeal", "magnitude": "low" },
    { "symbol": "BONDS", "direction": "down", "reason": "yield increase", "magnitude": "medium" }
  ],
  "source": {
    "id": "cmrw9f3e1000001l9wbn2k1ab",
    "name": "Federal Reserve",
    "authorityScore": 100
  },
  "documents": [
    {
      "id": "cmrx7f3e100002l9wbn4m5k3l",
      "url": "https://federalreserve.gov/newsevents/pressreleases/monetary20260716a.htm",
      "documentType": "html",
      "hash": "a3f2e1b8c9d4e5f6..."
    }
  ],
  "evidence": [
    {
      "documentId": "cmrx7f3e100002l9wbn4m5k3l",
      "type": "quote",
      "reference": "para 2, sentence 1",
      "text": "The Committee decided to raise the target range for the federal funds rate by 25 basis points to 5.50 to 5.75 percent.",
      "hash": "a3f2e1b8c9d4e5f6..."
    }
  ],
  "confidence": 100,
  "impactLevel": "high",
  "eventDate": "2026-07-16T18:00:00Z",
  "publishedAt": "2026-07-16T18:00:00Z",
  "detectedAt": "2026-07-16T18:00:12Z",
  "locale": "ar",
  "lifecycle": "published"
}
```

## قاعدة الذهب

> هذا الـ Schema هو اللغة المشتركة. كل مكون ينتجه أو يستهلكه
> يجب أن يلتزم به 100%. لا استثناءات.
