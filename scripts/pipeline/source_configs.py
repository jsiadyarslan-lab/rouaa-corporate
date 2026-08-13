"""
Source configurations for the vertical slice pipeline.
Extracted from mvp/backend/src/config/seed-data.ts — 5 central banks
with real RSS feed URLs for Phase A testing.

Each config contains ONLY:
  - Source identity (code, name, type, country, jurisdiction, trustTier)
  - Fetch configuration (feed_url, website_url)
  - Extraction patterns (generic regex for monetary policy decisions)

NO source-specific code. All differences are configuration.
"""

SOURCES = {
    "ECB": {
        "code": "ECB",
        "name": "European Central Bank",
        "type": "central_bank",
        "country": "EU",
        "jurisdiction": "European Union",
        "trustTier": 1,
        "websiteUrl": "https://www.ecb.europa.eu",
        "feedUrl": "https://www.ecb.europa.eu/rss/press.xml",
        # Generic patterns for monetary policy decisions
        "rate_patterns": [
            # "maintained/kept/keep/held its three key interest rates unchanged"
            (r"(?:maintained|kept|keep|held|hold)\s+(?:its\s+|the\s+)?three\s+key\s+(?:ECB\s+)?interest\s+rates", "rate_maintain"),
            # "decided to raise/keep/cut/hold the key interest rates"
            (r"(?:decided to|has)\s+(raise[d]?|kept|keep|cut|lowered|increased|maintained|hold|held)\s+(?:the\s+)?(?:three\s+)?key\s+(?:ECB\s+)?interest\s+rates", "rate_action"),
            # "key ECB interest rates at" + value
            (r"key\s+ECB\s+interest\s+rates?\s+at\s+(\d+(?:\.\d+)?)\s*(?:percent|%|pct)", "rate_value"),
            # "main refinancing operations" + value
            (r"main\s+refinancing\s+operations?\s*(?:rate)?\s*(?:at\s+)?(\d+(?:\.\d+)?)\s*(?:percent|%|pct)?", "rate_value"),
            # "interest rates unchanged"
            (r"interest\s+rates?\s+(?:unchanged|at\s+(?:their\s+)?current\s+levels)", "rate_maintain"),
        ],
        "event_type": "monetary_policy_decision",
        "content_keywords": ["interest rate", "monetary policy", "key rates", "refinancing", "deposit facility", "marginal lending"],
    },
    "BOE": {
        "code": "BOE",
        "name": "Bank of England",
        "type": "central_bank",
        "country": "GB",
        "jurisdiction": "United Kingdom",
        "trustTier": 1,
        "websiteUrl": "https://www.bankofengland.co.uk",
        "feedUrl": "https://www.bankofengland.co.uk/rss/news",
        "rate_patterns": [
            (r"Bank\s+Rate\s+(?:at|to)\s+(\d+(?:\.\d+)?)\s*(?:percent|%|pct)", "rate_value"),
            (r"(?:maintained|kept|held|hold)\s+(?:the\s+)?Bank\s+Rate\s+at", "rate_maintain"),
            (r"(?:increased|raised|cut|reduced|lowered)\s+(?:the\s+)?Bank\s+Rate", "rate_action"),
            (r"MPC\s+(?:voted|decided|has\s+voted)", "monetary_policy_committee"),
            (r"Bank\s+Rate\s+(?:unchanged|at\s+(?:its\s+)?current)", "rate_maintain"),
            # "voted to maintain Bank Rate at 3.75%"
            (r"voted\s+.*?\s+to\s+(maintain|keep|raise|cut|increase|lower)\s+Bank\s+Rate\s+at\s+(\d+(?:\.\d+)?)", "rate_action_with_value"),
            # "maintain Bank Rate at 3.75%"
            (r"(?:maintain|keep)\s+Bank\s+Rate\s+at\s+(\d+(?:\.\d+)?)", "rate_value"),
        ],
        "event_type": "monetary_policy_decision",
        "content_keywords": ["bank rate", "monetary policy committee", "MPC", "interest rate", "policy rate"],
    },
    "FED": {
        "code": "FED",
        "name": "Federal Reserve",
        "type": "central_bank",
        "country": "US",
        "jurisdiction": "United States",
        "trustTier": 1,
        "websiteUrl": "https://www.federalreserve.gov",
        "feedUrl": "https://www.federalreserve.gov/feeds/press_all.xml",
        "rate_patterns": [
            # "target range for the federal funds rate at 3-1/2 to 3-3/4 percent"
            # Group captures full fractional expression: 3-1/2, 3 3/4, 3.5, or 3
            (r"target\s+range\s+for\s+the\s+federal\s+funds\s+rate\s+at\s+(\d+(?:[-\s]\d+/\d+|\.\d+)?)\s*(?:to|-)\s*(\d+(?:[-\s]\d+/\d+|\.\d+)?)\s*(?:percent|%|pct)", "rate_range"),
            (r"(?:maintained|kept|hold|held)\s+(?:the\s+)?target\s+range\s+for\s+the\s+federal\s+funds\s+rate", "rate_maintain"),
            (r"(?:raised|increased|cut|lowered|decreased)\s+(?:the\s+)?target\s+range\s+for\s+the\s+federal\s+funds\s+rate", "rate_action"),
            (r"federal\s+funds\s+rate\s+(?:at|to)\s+(\d+(?:\.\d+)?)\s*(?:percent|%|pct)", "rate_value"),
            (r"(?:maintain|keep|hold)\s+(?:the\s+)?target\s+range", "rate_maintain"),
            (r"decided\s+to\s+(maintain|keep|raise|cut|lower|increase)\s+(?:the\s+)?target\s+range", "rate_action"),
        ],
        "event_type": "monetary_policy_decision",
        "content_keywords": ["federal funds rate", "FOMC", "target range", "monetary policy", "open market"],
    },
    "BOC": {
        "code": "BOC",
        "name": "Bank of Canada",
        "type": "central_bank",
        "country": "CA",
        "jurisdiction": "Canada",
        "trustTier": 1,
        "websiteUrl": "https://www.bankofcanada.ca",
        # Press releases feed (contains actual rate decision press releases,
        # not event listings). The general /feed/ includes upcoming-event pages
        # which have no substantive rate text.
        "feedUrl": "https://www.bankofcanada.ca/content_type/press-releases/feed/",
        "rate_patterns": [
            (r"target\s+for\s+the\s+overnight\s+rate\s+(?:at|to)\s+(\d+(?:\.\d+)?)\s*(?:percent|%|pct)", "rate_value"),
            (r"(?:maintained|kept|held|hold)\s+(?:the\s+)?target\s+for\s+the\s+overnight\s+rate", "rate_maintain"),
            (r"(?:raised|increased|cut|lowered|decreased)\s+(?:the\s+)?target\s+for\s+the\s+overnight\s+rate", "rate_action"),
            (r"overnight\s+rate\s+target\s+(?:at|to)\s+(\d+(?:\.\d+)?)\s*(?:percent|%|pct)", "rate_value"),
            (r"overnight\s+rate\s+(?:unchanged|at\s+(?:its\s+)?current)", "rate_maintain"),
            # "held its target for the overnight rate" — possessive pronoun variant
            (r"held\s+\w+\s+target\s+for\s+the\s+overnight\s+rate\s+at\s+(\d+(?:\.\d+)?)", "rate_value"),
        ],
        "event_type": "monetary_policy_decision",
        "content_keywords": ["overnight rate", "target rate", "monetary policy", "policy rate", "interest rate"],
    },
    "RBA": {
        "code": "RBA",
        "name": "Reserve Bank of Australia",
        "type": "central_bank",
        "country": "AU",
        "jurisdiction": "Australia",
        "trustTier": 1,
        "websiteUrl": "https://www.rba.gov.au",
        "feedUrl": "https://www.rba.gov.au/rss/rss-cb-media-releases.xml",
        "rate_patterns": [
            (r"cash\s+rate\s+target\s+(?:at|to)\s+(\d+(?:\.\d+)?)\s*(?:percent|%|pct)", "rate_value"),
            (r"(?:maintained|kept|held|hold)\s+(?:the\s+)?cash\s+rate\s+(?:target\s+)?at", "rate_maintain"),
            (r"(?:raised|increased|cut|lowered|decreased)\s+(?:the\s+)?cash\s+rate", "rate_action"),
            (r"cash\s+rate\s+(?:at|to)\s+(\d+(?:\.\d+)?)\s*(?:percent|%|pct)", "rate_value"),
            (r"cash\s+rate\s+(?:unchanged|at\s+(?:its\s+)?current)", "rate_maintain"),
        ],
        "event_type": "monetary_policy_decision",
        "content_keywords": ["cash rate", "monetary policy", "policy rate", "interest rate", "RBA"],
    },
}

# ============================================================================
# Phase B sources — 10 new sources across 6 categories
# Goal: test abstraction generalization across diverse source types
# Rule: NO source-specific code. All differences are configuration.
# ============================================================================

# --- Central Banks (different terminology from Phase A) ---

PHASE_B_SOURCES_LIST = {

    "BOJ": {
        "code": "BOJ",
        "name": "Bank of Japan",
        "type": "central_bank",
        "country": "JP",
        "jurisdiction": "Japan",
        "trustTier": 1,
        "websiteUrl": "https://www.boj.or.jp/en/",
        "feedUrl": "https://www.boj.or.jp/en/rss/whatsnew.xml",
        "rate_patterns": [
            # BOJ uses "uncollateralized overnight call rate" as policy rate
            (r"uncollateralized\s+overnight\s+call\s+rate\s+(?:at|to|around)\s+(\d+(?:\.\d+)?)\s*(?:percent|%|pct)", "rate_value"),
            # "policy interest rate" — more flexible than "policy-rate balance"
            (r"(?:maintain|kept|keep|hold|held)\s+(?:the\s+)?policy\s+interest\s+rate", "rate_maintain"),
            # Extraction Hardening: added capture group (was non-capturing, producing generic "action")
            (r"(raise|raised|increase|increased|cut|lower|lowered|decrease|decreased)\s+(?:the\s+)?policy\s+interest\s+rate", "rate_action"),
            # "short-term policy rate" with hyphen variations
            (r"short[- ]term\s+policy\s+rate\s+(?:at|to)\s+([+-]?\d+(?:\.\d+)?)\s*(?:percent|%|pct)", "rate_value"),
            # "policy-rate balance" (original BOJ terminology)
            (r"(?:maintain|kept|keep|hold|held)\s+(?:the\s+)?policy[- ]rate\s+balance", "rate_maintain"),
            # Extraction Hardening: added capture group (was non-capturing, producing generic "action")
            (r"(raised|increased|cut|lowered|decreased)\s+(?:the\s+)?policy[- ]rate\s+balance", "rate_action"),
            # "interest rate applied to the complementary-lending facility"
            (r"interest\s+rate\s+applied\s+to\s+(?:the\s+)?complementary[- ]lending\s+facility\s+(?:at|to)\s+(\d+(?:\.\d+)?)", "rate_value"),
            (r"basic\s+loan\s+rate\s+(?:at|to)\s+(\d+(?:\.\d+)?)\s*(?:percent|%|pct)", "rate_value"),
            # "decided to maintain/raise/cut the policy rate"
            (r"decided\s+to\s+(maintain|keep|raise|cut|lower|increase)\s+(?:the\s+)?policy[- ]?rate", "rate_action"),
            # "continue to raise/maintain the policy interest rate"
            (r"continue\s+to\s+(raise|maintain|cut|lower|increase)\s+(?:the\s+)?policy\s+interest\s+rate", "rate_action"),
        ],
        # B-Closure remediation: role_patterns for BOJ minutes/opinions documents.
        # BOJ minutes contain individual member views that must be classified as
        # dissent/alternative, not primary. Without this, IOs contain mixed
        # rate_decision facts (maintain + hike + action) from different members.
        "role_patterns": {
            "dissent": [
                # Individual member views
                "one member expressed the view",
                "one member expressed the recognition",
                "a different member said",
                "one of these members pointed out",
                "some members said",
                "a few members said",
                "one member pointed out",
                "one member stated",
                "a member argued",
                "one member argued",
                # Preference language
                "preferred to increase",
                "preferred to raise",
                "preferred to cut",
                "preferred to lower",
                "preferred to maintain",
                "would have preferred",
                # Voting language
                "votes to increase", "votes to raise", "votes to cut", "votes to lower",
                "voted against", "voted to increase", "voted to raise",
                "voted to cut", "voted to lower",
                "preferring to increase", "preferring to raise",
                "dissented", "dissenting",
                "objected to", "opposed the",
            ],
            "alternative": [
                # Proposed but not adopted
                "proposed to", "suggested", "recommend",
                "alternative", "counterfactual",
                "considered but", "evaluated but",
                "expressed the view that it was appropriate",
                "expressed the recognition that",
                # Extraction Hardening: member recommendation language
                "it is necessary for the bank to",
                "it is necessary to",
                "the bank needs to",
                "should maintain its stance",
                "should continue to",
                "necessary to raise",
                "necessary to cut",
                "necessary to adjust",
            ],
            "context": [
                "previous meeting", "last meeting", "prior to",
                "compared to", "since the previous",
                "has been at", "was at", "had been",
                "previously stood at", "changed from",
                "since the previous meeting",
            ],
            "forecast": [
                "forecast", "projected", "expected to",
                "outlook for", "anticipates", "anticipate",
                "guidance of", "guidance range",
                "is expected to", "are expected to",
                # Extraction Hardening: future guidance language
                "will continue to", "will raise", "will cut",
                "will maintain", "will adjust",
                "will be faster", "will be slower",
                "pace of rate hikes",
                "policy interest rate hikes will",
            ],
            "revision": [
                "revised from", "restated", "previously reported as",
                "corrected from", "updated from",
                "preliminary", "final estimate",
                "revised estimate", "revised value",
            ],
        },
        "event_type": "monetary_policy_decision",
        "content_keywords": ["policy rate", "monetary policy", "interest rate", "call rate", "money market", "policy interest rate"],
    },

    "RBNZ": {
        "code": "RBNZ",
        "name": "Reserve Bank of New Zealand",
        "type": "central_bank",
        "country": "NZ",
        "jurisdiction": "New Zealand",
        "trustTier": 1,
        "websiteUrl": "https://www.rbnz.govt.nz/",
        "feedUrl": "https://www.rbnz.govt.nz/feeds/news",
        "rate_patterns": [
            # RBNZ uses "Official Cash Rate (OCR)"
            (r"Official\s+Cash\s+Rate\s+(?:at|to)\s+(\d+(?:\.\d+)?)\s*(?:percent|%|pct)", "rate_value"),
            (r"OCR\s+(?:at|to)\s+(\d+(?:\.\d+)?)\s*(?:percent|%|pct)", "rate_value"),
            (r"(?:maintained|kept|held|hold)\s+(?:the\s+)?(?:Official\s+Cash\s+Rate|OCR)\s+at", "rate_maintain"),
            (r"(?:raised|increased|cut|lowered|decreased)\s+(?:the\s+)?(?:Official\s+Cash\s+Rate|OCR)", "rate_action"),
            (r"(?:maintain|keep|hold)\s+(?:the\s+)?OCR\s+at\s+(\d+(?:\.\d+)?)", "rate_value"),
        ],
        "event_type": "monetary_policy_decision",
        "content_keywords": ["official cash rate", "OCR", "monetary policy", "policy rate", "interest rate"],
    },

    # --- Financial Regulators ---

    "SEC": {
        "code": "SEC",
        "name": "US Securities and Exchange Commission",
        "type": "financial_regulator",
        "country": "US",
        "jurisdiction": "United States",
        "trustTier": 1,
        "websiteUrl": "https://www.sec.gov",
        "feedUrl": "https://www.sec.gov/news/pressreleases.rss",
        # SEC has no rate decisions — uses regulatory_patterns (new pattern category)
        "rate_patterns": [],  # no monetary policy patterns
        "regulatory_patterns": [
            # Penalty amounts: "$X million penalty", "agreed to pay $X"
            (r"(?:agreed\s+to\s+pay|pay|settle|settled\s+for|ordered\s+to\s+pay|penalty\s+of)\s+(?:approximately\s+)?\$([\d,]+(?:\.\d+)?)\s+(million|billion)", "penalty_amount"),
            (r"\$([\d,]+(?:\.\d+)?)\s+(million|billion)\s+(?:penalty|settlement|fine)", "penalty_amount"),
            # Defendant names: "charged X with", "SEC v. X"
            (r"charged\s+([A-Z][A-Za-z\s,&\.]{3,80}?)\s+with\s+(?:fraud|insider\s+trading|violat)", "defendant_name"),
            (r"SEC\s+v\.?\s+([A-Z][A-Za-z\s,&\.]{3,80})", "defendant_name"),
            # Violation types
            (r"(?:with|for)\s+(fraud|insider\s+trading|accounting\s+fraud|market\s+manipulation|violat\w+\s+(?:of|the))", "violation_type"),
            # Action type: "settled", "charged", "filed"
            (r"(settled|charged|filed|ordered|sanctioned)\s+(?:charges?\s+)?(?:against\s+)?", "action_type"),
        ],
        "event_type": "regulatory_enforcement",
        "content_keywords": ["SEC", "charged", "settlement", "penalty", "enforcement", "fraud", "violations"],
    },

    "FCA": {
        "code": "FCA",
        "name": "UK Financial Conduct Authority",
        "type": "financial_regulator",
        "country": "GB",
        "jurisdiction": "United Kingdom",
        "trustTier": 1,
        "websiteUrl": "https://www.fca.org.uk",
        "feedUrl": "https://www.fca.org.uk/news/rss.xml",
        "rate_patterns": [],
        "regulatory_patterns": [
            # UK amounts: "£X million" or "X,million fine"
            (r"(?:fine[ds]?|penalty|settlement|sanction\w*)\s+(?:of\s+)?(?:£|GBP\s)?([\d,]+(?:\.\d+)?)\s*(?:million|billion|m|bn)", "penalty_amount"),
            (r"(?:£|GBP\s)([\d,]+(?:\.\d+)?)\s*(?:million|billion)\s+(?:fine|penalty|settlement)", "penalty_amount"),
            # Extraction Hardening: case_sensitive=True for defendant_name patterns.
            # The extractor applies re.IGNORECASE by default, which makes [A-Z] match
            # lowercase. This caused "defined benefit pension schemes" to match as a
            # defendant name (from "defined" → "fined" prefix + "benefit...").
            # With case_sensitive=True (generic mechanism), [A-Z] only matches uppercase,
            # so only proper noun names (e.g., "Barclays Bank") are captured.
            # This is a GENERIC mechanism — any pattern in any source can use it.
            (r"fined\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})", "defendant_name", True),
            # "X has been fined" / "X was fined" — also case_sensitive
            (r"([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})\s+(?:has\s+been|was)\s+fined", "defendant_name", True),
            # Violation types
            (r"(?:for|due\s+to|over)\s+(?:failures?\s+in|breach(?:es)?\s+of|inadequate|poor)\s+([a-z\s,]{5,60})", "violation_type"),
            # Action type — removed "final notice" (it's a document type, not an action)
            (r"\b(fined|penalis\w+|sanction\w+|enforcement\s+action)\b", "action_type"),
        ],
        "event_type": "regulatory_enforcement",
        "content_keywords": ["FCA", "fine", "enforcement", "final notice", "regulated", "breach", "consumer"],
    },

    # --- Statistical Authorities ---

    "ONS": {
        "code": "ONS",
        "name": "UK Office for National Statistics",
        "type": "statistical_authority",
        "country": "GB",
        "jurisdiction": "United Kingdom",
        "trustTier": 1,
        "websiteUrl": "https://www.ons.gov.uk",
        "feedUrl": "https://www.ons.gov.uk/releasecalendar?rss&highlight=true&limit=10&page=1&release-type=type-published&sort=date-newest",
        "rate_patterns": [],
        "statistical_patterns": [
            # CPI/inflation: "CPI inflation was X%" or "annual rate of X%"
            (r"(?:CPI|Consumer\s+Prices\s+Index)\s+(?:inflation|annual\s+rate|growth)\s+(?:was\s+|of\s+|stood\s+at\s+)([+-]?\d+(?:\.\d+)?)\s*(?:percent|%|pct)", "inflation_rate"),
            (r"annual\s+(?:rate\s+of\s+)?inflation\s+(?:was\s+|of\s+|stood\s+at\s+)([+-]?\d+(?:\.\d+)?)\s*(?:percent|%|pct)", "inflation_rate"),
            # GDP: "GDP grew by X%" or "fell by X%"
            (r"GDP\s+(?:grew|fell|rose|declined|increased|decreased)\s+by\s+([+-]?\d+(?:\.\d+)?)\s*(?:percent|%|pct)", "gdp_growth"),
            # Unemployment: "unemployment rate was X%"
            (r"unemployment\s+rate\s+(?:was\s+|of\s+|stood\s+at\s+)([+-]?\d+(?:\.\d+)?)\s*(?:percent|%|pct)", "unemployment_rate"),
            # Employment count: "X million people in employment"
            (r"([\d,]+(?:\.\d+)?)\s+(million|billion)\s+people\s+(?:were\s+)?in\s+employment", "employment_level"),
            # Generic numeric statistic
            (r"(?:estimated|recorded|reported)\s+(?:at\s+|of\s+)([+-]?[\d,]+(?:\.\d+)?)\s*(?:million|billion|thousand|percent|%)", "statistic_value"),
        ],
        "event_type": "statistical_release",
        "content_keywords": ["CPI", "inflation", "GDP", "unemployment", "employment", "statistics", "ONS"],
    },

    "BIS_STATS": {
        "code": "BIS_STATS",
        "name": "BIS Statistical Releases",
        "type": "statistical_authority",
        "country": "INT",
        "jurisdiction": "International",
        "trustTier": 1,
        "websiteUrl": "https://www.bis.org",
        "feedUrl": "https://www.bis.org/doclist/all_statistics.rss",
        "rate_patterns": [],
        "statistical_patterns": [
            # BIS-specific: "global liquidity indicators", "international banking statistics"
            # Numeric values often in "$X trillion" or "X% of GDP"
            (r"(?:USD|US\$|\$)\s*([\d,]+(?:\.\d+)?)\s+(trillion|billion|million)", "usd_amount"),
            (r"([\d,]+(?:\.\d+)?)\s+(trillion|billion)\s+(?:US\s+dollars?|USD)", "usd_amount"),
            (r"([+-]?\d+(?:\.\d+)?)\s*(?:percent|%|pct)\s+(?:of\s+GDP|year[- ]on[- ]year|qoq)", "percentage_statistic"),
            # "cross-border claims grew by X%"
            (r"cross[- ]border\s+claims\s+(?:grew|fell|rose|declined|increased|decreased)\s+by\s+([+-]?\d+(?:\.\d+)?)\s*(?:percent|%|pct)", "cross_border_change"),
            # "international banking statistics show X"
            (r"international\s+banking\s+statistics\s+(?:show|revealed|indicated)", "statistic_release"),
        ],
        "event_type": "statistical_release",
        "content_keywords": ["global liquidity", "international banking", "statistics", "cross-border", "BIS"],
    },

    # --- Corporate IR ---

    "APPLE": {
        "code": "APPLE",
        "name": "Apple Inc. Newsroom",
        "type": "corporate_ir",
        "country": "US",
        "jurisdiction": "United States",
        "trustTier": 1,
        "websiteUrl": "https://www.apple.com/newsroom/",
        "feedUrl": "https://www.apple.com/newsroom/rss-feed.rss",
        "rate_patterns": [],
        "earnings_patterns": [
            # Revenue: "revenue of $X billion" or "X billion in revenue"
            (r"revenue\s+of\s+\$([\d,]+(?:\.\d+)?)\s+(billion|million)", "revenue"),
            (r"\$([\d,]+(?:\.\d+)?)\s+(billion|million)\s+(?:in\s+)?(?:revenue|sales|quarterly\s+revenue)", "revenue"),
            (r"quarterly\s+revenue\s+of\s+\$([\d,]+(?:\.\d+)?)\s+(billion|million)", "revenue"),
            # EPS: "earnings per share of $X" or "diluted EPS of $X"
            (r"(?:diluted\s+)?earnings\s+per\s+share\s+(?:of\s+|were\s+)?\$([\d,]+(?:\.\d+)?)", "eps"),
            (r"(?:diluted\s+)?EPS\s+of\s+\$([\d,]+(?:\.\d+)?)", "eps"),
            # Net income: "net income of $X billion"
            (r"net\s+income\s+of\s+\$([\d,]+(?:\.\d+)?)\s+(billion|million)", "net_income"),
            # Gross margin
            (r"gross\s+margin\s+of\s+([+-]?\d+(?:\.\d+)?)\s*(?:percent|%)", "gross_margin"),
            # Year-over-year comparison: "up X% year over year"
            (r"(?:up|down|increase\s+of|decrease\s+of)\s+([+-]?\d+(?:\.\d+)?)\s*(?:percent|%)\s+(?:year[- ]over[- ]year|yoy)", "yoy_change"),
        ],
        "event_type": "earnings_release",
        "content_keywords": ["revenue", "earnings", "quarter", "fiscal", "Apple", "EPS", "iPhone", "Mac"],
    },

    "ARAMCO": {
        "code": "ARAMCO",
        "name": "Saudi Aramco Investor Relations",
        "type": "corporate_ir",
        "country": "SA",
        "jurisdiction": "Saudi Arabia",
        "trustTier": 1,
        "websiteUrl": "https://www.aramco.com",
        "feedUrl": "https://www.aramco.com/en/news-and-events",
        "rate_patterns": [],
        "earnings_patterns": [
            # Aramco dividend: "dividend of $X billion" — matches investment-intelligence evidence ($33.6B)
            (r"dividend\s+(?:of\s+)?\$([\d,]+(?:\.\d+)?)\s+(billion|million)", "dividend_amount"),
            (r"\$([\d,]+(?:\.\d+)?)\s+(billion|million)\s+(?:in\s+)?dividend", "dividend_amount"),
            # Net income: "net income of $X billion"
            (r"net\s+income\s+(?:of\s+|was\s+)?\$([\d,]+(?:\.\d+)?)\s+(billion|million)", "net_income"),
            # Revenue: "revenue of $X billion"
            (r"revenue\s+(?:of\s+|was\s+)?\$([\d,]+(?:\.\d+)?)\s+(billion|million)", "revenue"),
            # Total assets
            (r"total\s+assets\s+of\s+\$([\d,]+(?:\.\d+)?)\s+(billion|million)", "total_assets"),
            # EPS: "earnings per share of $X"
            (r"earnings\s+per\s+share\s+(?:of\s+|was\s+)?\$([\d,]+(?:\.\d+)?)", "eps"),
        ],
        "event_type": "earnings_release",
        "content_keywords": ["Aramco", "dividend", "earnings", "net income", "quarter", "third quarter", "fiscal"],
    },

    # --- Government / Regulatory Publication ---

    "OFAC": {
        "code": "OFAC",
        "name": "US Treasury OFAC Recent Actions",
        "type": "government_regulatory",
        "country": "US",
        "jurisdiction": "United States",
        "trustTier": 1,
        "websiteUrl": "https://ofac.treasury.gov",
        # OFAC has no RSS — uses HTML index page
        # The pipeline will need to discover document URLs from the index
        "feedUrl": "https://ofac.treasury.gov/recent-actions",
        "feed_format": "html_index",  # signals: parse HTML index, not RSS
        # Generic link pattern — used by HTML-index adapter to discover document URLs
        # Pattern matches date-based URLs like /recent-actions/20260807
        "link_pattern": r"/recent-actions/\d{8}",
        "link_pattern_prefix": "https://ofac.treasury.gov",  # prefix for relative URLs
        "rate_patterns": [],
        "regulatory_patterns": [
            # Designated entity names: "the following individuals have been added to OFAC's SDN List"
            (r"SDN\s+List\s*:\s*([A-Z][A-Za-z\s,'\"\-\.]{3,80}?),\s*([A-Z][a-z]+)", "designated_entity"),  # name, country
            # Country: "Iran;", "Russia;", "North Korea"
            (r"(?:SDN\s+List|designated)\s*:\s*[A-Z][A-Za-z\s,'\-\.\"]{3,80}?,\s*([A-Z][a-z]+);", "designated_country"),
            # Sanctions program: "[IRAN-EO13902]", "[SYRIA]", "[RUSSIA-EO14024]"
            (r"\[([A-Z][A-Z0-9\-]{2,40})\]", "sanctions_program"),
            # Action type
            (r"(added\s+to|removed\s+from|designated\s+pursuant\s+to|updated\s+the\s+(?:SDN|List))", "action_type"),
            # FAQ issuance
            (r"issuing\s+(?:an?\s+)?(?:amended|new|updated)\s+(Iran|Russia|North\s+Korea|Venezuela|Syria|Cuba|Cyber)[\-\s]related\s+(?:Frequently\s+Asked\s+Question|FAQ)", "faq_topic"),
        ],
        "event_type": "sanctions_designation",
        "content_keywords": ["OFAC", "SDN", "Specially Designated Nationals", "sanctions", "designated", "Iran", "Russia"],
    },

    # --- PDF-heavy source ---

    "BIS_QR": {
        "code": "BIS_QR",
        "name": "BIS Quarterly Review",
        "type": "pdf_heavy",
        "country": "INT",
        "jurisdiction": "International",
        "trustTier": 1,
        "websiteUrl": "https://www.bis.org/publ/quarterly.htm",
        # PDF source — fetch URL is the PDF itself
        "feedUrl": "https://www.bis.org/publ/qtrpdf/r_qt2606.pdf",
        "feed_format": "pdf",  # signals: parse as PDF, not RSS
        # Publication date — extracted from URL pattern (r_qtYYMM.pdf → Q2 2026)
        "published_at": "2026-06-30",
        "rate_patterns": [],
        # BIS QR contains analysis of financial markets, FX, derivatives
        # Not rate decisions but market statistics
        "statistical_patterns": [
            # FX turnover: "FX turnover was $X trillion"
            (r"FX\s+(?:turnover|trading)\s+(?:was\s+|of\s+|stood\s+at\s+)(?:USD\s*)?\$?([\d,]+(?:\.\d+)?)\s+(trillion|billion)", "fx_turnover"),
            (r"foreign\s+exchange\s+turnover\s+(?:was\s+|of\s+)(?:USD\s*)?\$?([\d,]+(?:\.\d+)?)\s+(trillion|billion)", "fx_turnover"),
            # Interest rate derivatives: "interest rate derivatives turnover"
            (r"interest\s+rate\s+derivatives\s+turnover\s+(?:was\s+|of\s+)(?:USD\s*)?\$?([\d,]+(?:\.\d+)?)\s+(trillion|billion)", "ird_turnover"),
            # CDS / credit derivatives
            (r"credit\s+default\s+swaps?\s+(?:turnover|notional)\s+(?:was\s+|of\s+)(?:USD\s*)?\$?([\d,]+(?:\.\d+)?)\s+(trillion|billion)", "cds_turnover"),
            # Generic BIS QR statistic
            (r"(?:USD|US\$|\$)\s*([\d,]+(?:\.\d+)?)\s+(trillion|billion)", "usd_amount"),
            # Percentage changes in financial aggregates
            (r"(?:rose|fell|increased|decreased|declined)\s+by\s+([+-]?\d+(?:\.\d+)?)\s*(?:percent|%|pct)", "percentage_change"),
        ],
        "event_type": "market_statistic_release",
        "content_keywords": ["BIS", "Quarterly Review", "international banking", "FX", "derivatives", "turnover"],
    },
}

# Combine Phase A and Phase B sources (Phase A retained for regression)
SOURCES.update(PHASE_B_SOURCES_LIST)

# Source codes for Phase A (regression set)
PHASE_A_SOURCES = ["ECB", "BOE", "FED", "BOC", "RBA"]

# Source codes for Phase B (new generalization set)
PHASE_B_SOURCES = ["BOJ", "RBNZ", "SEC", "FCA", "ONS", "BIS_STATS", "APPLE", "ARAMCO", "OFAC", "BIS_QR"]

# ============================================================================
# Phase 2B — Cross-Class Validation: SNB (Central Bank)
# First-attempt config-only onboarding test
# Validation Protocol v2 — APPROVED
# ============================================================================

SNB_SOURCE = {
    "code": "SNB",
    "name": "Swiss National Bank",
    "type": "central_bank",
    "country": "CH",
    "jurisdiction": "Switzerland",
    "trustTier": 1,
    "websiteUrl": "https://www.snb.ch/en",
    "feedUrl": "https://www.snb.ch/public/rss/en/news",
    "rate_patterns": [
        # "SNB policy rate unchanged at 0%"
        (r"SNB\s+policy\s+rate\s+(?:unchanged|at|to)\s+(\d+(?:\.\d+)?)\s*(?:percent|%|pct)?", "rate_value"),
        # "decided to leave the SNB policy rate unchanged"
        (r"decided\s+to\s+(leave|maintain|keep|raise|cut|lower|increase|decrease)\s+(?:the\s+)?SNB\s+policy\s+rate", "rate_action"),
        # "leave the SNB policy rate unchanged at 0%"
        (r"(?:leave|maintain|keep|held)\s+(?:the\s+)?SNB\s+policy\s+rate\s+unchanged\s+at\s+(\d+(?:\.\d+)?)", "rate_value"),
        # "interest rate" general
        (r"interest\s+rate\s+(?:at|to|unchanged\s+at)\s+(\d+(?:\.\d+)?)\s*(?:percent|%|pct)?", "rate_value"),
        # "expansion of monetary policy" / "restriction of monetary policy"
        (r"(?:expansion|restriction)\s+of\s+monetary\s+policy", "rate_action"),
        # "SARON" rate
        (r"SARON\s+(?:at|to|stood\s+at)\s+(\d+(?:\.\d+)?)\s*(?:percent|%|pct)?", "rate_value"),
        # "policy rate" generic
        (r"policy\s+rate\s+(?:unchanged|at|to)\s+(\d+(?:\.\d+)?)\s*(?:percent|%|pct)?", "rate_value"),
        # "decided to" + verb
        (r"decided\s+to\s+(maintain|keep|raise|cut|lower|increase|decrease)\s+(?:the\s+)?(?:policy\s+)?rate", "rate_action"),
    ],
    "event_type": "monetary_policy_decision",
    "content_keywords": ["rate", "monetary policy", "interest rate", "SNB", "policy rate", "SARON"],
}

SOURCES["SNB"] = SNB_SOURCE
