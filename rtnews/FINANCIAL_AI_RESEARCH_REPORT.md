# Comprehensive Research Report: Financial AI Assistants & Infrastructure (2025-2026)

---

## 1. Best Financial AI Assistants in the World (2025-2026)

### 1.1 Bloomberg ASKB (Agentic AI on Bloomberg Terminal)
- **URL**: professional.bloomberg.com/products/bloomberg-terminal/ai
- **Architecture**: Coordinated network of AI agents working in parallel to analyze Bloomberg's proprietary data, news, research, and analytics universe
- **Key Features**:
  - Natural language query interface (type "ASKB GO" in Terminal command line)
  - Synthesizes answers from Bloomberg's proprietary data + Third Bridge expert insights
  - Scheduled/triggered execution: morning briefs, weekly thesis health checks, pre/post-earnings analysis
  - Designed to apply AI agents directly within financial analysis and portfolio workflows
  - Built with MCP (Model Context Protocol) for trustworthy financial AI infrastructure
- **CTO Insights** (Shawn Edwards): Data quality, rigorous evaluations, and cost discipline are key to making ASKB work
- **Pricing**: Included with Bloomberg Terminal subscription (~$24,000/yr)

### 1.2 BloombergGPT
- **URL**: bloomberg.com/company/press/bloomberggpt-50-billion-parameter-llm-tuned-finance
- 50-billion parameter LLM specifically tuned for finance
- Outperforms similarly-sized open models on financial NLP tasks by significant margins without sacrificing general performance
- Trained on Bloomberg's 40+ years of proprietary financial data

### 1.3 FinGPT (Open-Source)
- **URL**: github.com/ai4finance-foundation/fingpt
- Open-source financial LLM by AI4Finance Foundation
- Supports ChatGPT-style fine-tuning for financial tasks
- Democratizes financial AI — anyone can fine-tune on domain-specific data
- Use cases: sentiment analysis, financial forecasting, risk assessment

### 1.4 Fiscal.ai (formerly FinChat.io)
- **URL**: fiscal.ai
- Raised $10M Series A, rebranded from FinChat to Fiscal.ai
- AI-powered stock research with data on 100,000+ stocks
- Conversational interface for investment research
- Features: earnings estimates, analyst ratings, financial statements, company profiles
- Pricing: Free tier available; Premium plans for institutional-grade data

### 1.5 Danelfin
- **URL**: danelfin.com
- AI-powered stock picker using Explainable AI (XAI)
- **Performance**: +376% returns from Jan 2017 to June 2025 vs. S&P 500's +166%
- **AI Score**: Rates stocks 1-10 based on 900+ fundamental, technical, and sentiment indicators
- **Key Feature**: Explainability — shows which factors drove each rating
- **New API**: Available at $70/month for 500 calls/month
- **Pricing**: Free trial, Plus and Pro annual plans
- **New Model**: +21% alpha vs. S&P 500 with enhanced predictability and explainability

### 1.6 TipRanks
- **URL**: tipranks.com
- **Smart Score**: Proprietary 1-10 quantitative rating system
- AI-powered stock sorting combining: analyst ratings, news sentiment, technical indicators, fundamentals, insider activity, hedge fund activity, blogger sentiment, investor sentiment
- **MCP Integration**: TipRanks MCP server (mcp.tipranks.com) provides live financial data for Claude, ChatGPT, and Cursor — built for AI agents
- **Features**: Analyst price targets & consensus, news sentiment, dividends, earnings, technical analysis
- **Pricing**: Free tier with limited features; Premium ~$30/month; Ultimate ~$60/month

### 1.7 StockHero
- **URL**: stockhero.ai
- Cloud-based AI trading platform with zero-code bot creation
- Features: DCA bots, Grid bots, AI-powered strategy backtesting
- **Pricing**: Free plan available; paid plans for advanced strategies
- Risk: Automated trading without emotions; built-in stop-losses and trailing stops

### 1.8 TradingView AI
- **URL**: tradingview.com
- Not a standalone AI assistant but integrates AI features
- Pine Script for custom indicators and strategy automation
- Economic calendar integration, social sentiment from community ideas
- AI-assisted pattern recognition and technical analysis tools

### 1.9 General-Purpose AI (ChatGPT, Claude, Gemini)
- Per Investing.com's 2026 ranking:
  1. **WarrenAI** (part of InvestingPro) — top specialized finance chatbot
  2. **ChatGPT** — strong general-purpose, can analyze financial data when provided
  3. **Gemini** — Google's model with real-time search capability
  4. **Claude** (post-August 2025) — improved financial reasoning
- These are increasingly capable but lack specialized financial data integrations natively

---

## 2. Real-Time Financial Data APIs

### 2.1 Stock Market Data APIs

| API | Free Tier | Base Paid Plan | Key Features | Best For |
|-----|-----------|---------------|--------------|----------|
| **Financial Modeling Prep (FMP)** | Yes (500MB bandwidth) | $19/mo (Starter) | Fundamentals, technicals, sentiment, earnings, SEC filings | Best value all-in-one |
| **Massive (formerly Polygon.io)** | Yes (limited) | $199/mo | Tick-level data, WebSockets, full US equity coverage | Professional tick data |
| **Twelve Data** | Yes (800 API credits/day) | $29/mo | Stocks, forex, crypto, fundamentals, technicals | Multi-asset coverage |
| **Alpha Vantage** | 25 calls/day, 5/min | $50/mo | Stocks, forex, crypto, commodities, technicals | Hobbyists/students |
| **Finnhub** | Yes (60 calls/min) | From free | Real-time stocks, forex, crypto, news sentiment | News sentiment + data |
| **Marketstack** | Yes (100 requests/mo) | $10/mo | EOD & real-time stock data, 70+ exchanges | Basic stock data |
| **IEX Cloud** | Limited free | $9/mo | Real-time US stock data, deep market data | US equities focus |

### 2.2 Forex/Currency Data APIs

| API | Coverage | Free Tier | Paid From | Key Feature |
|-----|----------|-----------|-----------|-------------|
| **Fixer.io** | 170 currencies | Yes (limited) | $15/mo | Simple, lightweight, real-time + historical |
| **Open Exchange Rates** | 200+ currencies | Yes (1,000/mo) | $12/mo | Time-series & conversion APIs |
| **TraderMade** | 150+ FX pairs | Free trial | $15/mo | WebSocket + REST + FIX API, millisecond data |
| **ExchangeRatesAPI** | 170+ currencies | Yes (hourly updates) | $10/mo | Updated every 60 minutes |
| **FastForex** | 170+ currencies | Yes | $18/mo | 1M+ API calls, real-time |
| **ForexRateAPI** | 150+ currencies | Yes | Custom | Lightweight, live + historical |

### 2.3 Crypto Data APIs

| API | Free Tier | Paid From | Coverage | Key Feature |
|-----|-----------|-----------|----------|-------------|
| **CoinGecko** | 10,000 calls/mo | $35/mo | 15,000+ coins, 700+ exchanges | Most comprehensive free tier; #1 by GitHub activity |
| **CoinMarketCap** | Yes (Basic tier) | $29/mo (Hobbyist); $95/mo (Startup) | 10,000+ coins | Deeper historical data on paid plans |
| **Finnhub** | Yes | Free | Major crypto | Combined with stock/forex data |
| **Twelve Data** | Yes | $29/mo | Major crypto pairs | Multi-asset unified API |

### 2.4 Commodity Data APIs

| API | Coverage | Free Tier | Key Feature |
|-----|----------|-----------|-------------|
| **Commodities-API** | Gold, silver, oil, gas + more | Yes | Updated every 60 seconds, 2 decimal precision |
| **CommodityPriceAPI** | Oil, gold, silver, corn, wheat, gas | Limited | Simple REST API, real-time + historical |
| **Metals-API** | Precious metals (gold, silver, platinum) | Yes | Real-time metals pricing |
| **EODHD** | 23 commodity series from FRED | Free tier | Historical commodity prices |
| **AllTick** | Gold, silver, crude, gas | Free historical | 170ms latency real-time push |
| **Alpha Vantage** | Gold, silver, crude oil, natural gas, copper | 25 calls/day | Combined with stock/forex data |

### 2.5 Economic Calendar Data APIs

| Source | Type | API Available | Key Feature |
|--------|------|---------------|-------------|
| **Trading Economics** | Calendar + Historical | Yes (paid API) | 1,000+ indicators, forecasts, historical data |
| **Finnhub** | Economic calendar | Yes (free tier) | Market-moving events |
| **Investing.com** | Comprehensive calendar | No official API (scraping needed) | Most comprehensive free calendar |
| **ForexFactory** | Forex-focused calendar | No official API | Best for forex-specific events |
| **FXStreet** | Economic calendar | Limited API | Real-time event tracking |
| **TradingView** | Economic calendar | Via Pine Script | Visual integration with charts |

### 2.6 Recommended API Stack for a Financial AI Assistant

**Best free/minimal-cost combination:**
- **Finnhub** (free tier) — stocks, forex, crypto, news sentiment, economic calendar
- **CoinGecko** (free tier, 10K calls/mo) — comprehensive crypto data
- **Alpha Vantage** (free tier, 25 calls/day) — commodity data + technical indicators
- **FRED API** (free) — macroeconomic data
- **Yahoo Finance** (via yfinance Python lib, free) — historical data fallback

**Best professional combination:**
- **FMP** ($19/mo) — all-in-one fundamentals, technicals, sentiment
- **Twelve Data** ($29/mo) — multi-asset real-time data
- **TraderMade** ($15/mo) — professional forex data
- **Trading Economics API** — economic calendar + forecasts
- **CoinGecko Analyst** ($35/mo) — crypto data

---

## 3. Technical Analysis APIs and Libraries

### 3.1 Python Libraries

#### TA-Lib (Gold Standard)
- **URL**: ta-lib.org
- **Language**: C core with Python wrapper
- **Indicators**: 150+ indicators (ADX, MACD, RSI, Stochastic, Bollinger Bands, etc.)
- **Candlestick Patterns**: 60+ pattern recognition functions
- **Performance**: C-based = extremely fast, suitable for production
- **Installation**: `pip install TA-Lib` (requires C library build)
- **Best For**: Production trading systems requiring speed

#### pandas-ta (Most Comprehensive Python-Native)
- **URL**: github.com/twopirllc/pandas-ta
- **Indicators**: 192 indicators + 62 candlestick patterns
- **Integration**: Native pandas DataFrame integration
- **Installation**: `pip install pandas-ta`
- **Best For**: Research and prototyping; easy pandas integration

#### pandas-ta-classic (Maintained Fork)
- **URL**: pypi.org/project/pandas-ta-classic
- Maintained fork of pandas-ta with 192 indicators + 62 candlestick patterns
- More actively maintained than original pandas-ta

#### technical (Lightweight)
- **URL**: technical-analysis-library-in-python.readthedocs.io
- Built on Pandas, lightweight
- Momentum indicators, volume indicators, volatility indicators
- Good for feature engineering from OHLCV data

### 3.2 APIs That Return Technical Indicators

| API | Indicators Available | Free Tier | Notes |
|-----|---------------------|-----------|-------|
| **Twelve Data** | 20+ indicators (RSI, MACD, BB, SMA, EMA, ATR, etc.) | Yes | Returns calculated values via API |
| **Alpha Vantage** | SMA, EMA, MACD, RSI, BB, Stochastic, ATR, etc. | 25 calls/day | Most comprehensive free technical API |
| **FMP** | Technical indicators + signals | Yes | Combined with fundamentals |
| **TraderMade** | SMA, RSI, MACD via SDK + TA-Lib | Free trial | Forex-focused with TA-Lib integration |

### 3.3 Calculating Support/Resistance Levels Programmatically

**Method 1: Pivot Points (Classic)**
```
Pivot Point (PP) = (High + Low + Close) / 3
S1 = 2 * PP - High
S2 = PP - (High - Low)
R1 = 2 * PP - Low
R2 = PP + (High - Low)
```

**Method 2: Local Maxima/Minima**
- Scan price data for local turning points over a lookback window (e.g., 100 bars)
- Cluster nearby price levels using tolerance threshold
- Repeating upper bounds = resistance; repeating lower bounds = support

**Method 3: K-Means Clustering**
- Group price action into clusters using K-Means on historical price levels
- Dense clusters near price extremes identify key support/resistance zones
- More robust than pivot points for finding historical S/R

**Method 4: Volume Profile**
- Calculate volume traded at each price level
- High-volume nodes (HVN) = strong support/resistance
- Low-volume nodes (LVN) = price moves through quickly

**Implementation Resources:**
- Stack Overflow: "Support Resistance Algorithm" — local turning point approach
- Medium: "Programmatic Identification of Support/Resistance Trend Lines with Python"
- Alpharithms: "Calculating Support & Resistance using K-Means Clustering"
- TheFinAnalytics: "Support and Resistance Levels | Python"

---

## 4. Fundamental Analysis Data Sources

### 4.1 Central Bank Interest Rates

| Source | Coverage | API | Free |
|--------|----------|-----|------|
| **FRED** (fred.stlouisfed.org) | Fed Funds Rate, Discount Rate, all major central banks | REST API | Yes |
| **Trading Economics** | 50+ central bank rates | Paid API | No |
| **BIS** (Bank for International Settlements) | Global policy rates | Bulk download | Yes |
| **IMF Data** (imf.org/en/data) | International rates and financial statistics | API | Yes |

**Key FRED Series IDs:**
- `FEDFUNDS` — Federal Funds Effective Rate
- `DFF` — Daily Federal Funds Rate
- `INTDSRGBM193N` — UK Bank Rate
- `INTDSREZM193N` — ECB Main Refinancing Rate

### 4.2 DXY (Dollar Index) Data

| Source | API | Free | Notes |
|--------|-----|------|-------|
| **FRED** | `DTWEXBGS` (Broad) / `DTWEXM` (Major) | Yes | Daily updates |
| **Twelve Data** | Ticker: DXY | Paid | Real-time + historical |
| **Investing.com** | No official API | Scraping only | Most popular retail source |
| **TradingView** | Via Pine Script | Free account | Real-time charting |

### 4.3 Bond Yields (10Y, 2Y)

**FRED Series IDs (FREE, most reliable):**
- `DGS10` — 10-Year Treasury Yield (daily)
- `DGS2` — 2-Year Treasury Yield (daily)
- `T10Y2Y` — 10Y-2Y Yield Spread (recession indicator)
- `DGS30` — 30-Year Treasury Yield
- `DGS5` — 5-Year Treasury Yield

**Other Sources:**
- **U.S. Treasury Fiscal Data API** (fiscaldata.treasury.gov/api-documentation) — official treasury data
- **Trading Economics** — global government bond yields
- **FMP** — Treasury yield data in API

### 4.4 Inflation/CPI Data

**FRED Series IDs (FREE):**
- `CPIAUCSL` — CPI for All Urban Consumers (headline)
- `CPILFESL` — Core CPI (ex-food & energy)
- `PCEPI` — PCE Price Index
- `PCEPILFE` — Core PCE (Fed's preferred inflation gauge)
- `T10YIE` — 10-Year Breakeven Inflation Rate

**Other Sources:**
- **BLS** (Bureau of Labor Statistics) API — official CPI releases
- **IMF Data** — global inflation data
- **World Bank API** — historical inflation across countries

### 4.5 GDP Data

**FRED Series IDs (FREE):**
- `GDP` — US GDP (quarterly)
- `A191RL1Q225SBEA` — Real GDP Growth Rate
- `NYGDPMKTPCDWLD` — World GDP (from World Bank)

**Other Sources:**
- **BEA API** (Bureau of Economic Analysis) — official US GDP
- **World Bank API** (api.worldbank.org) — international GDP data, FREE
- **IMF Data** — WEO (World Economic Outlook) forecasts

### 4.6 Employment Data

**FRED Series IDs (FREE):**
- `UNRATE` — Unemployment Rate
- `PAYEMS` — Total Nonfarm Payrolls
- `ICSA` — Initial Jobless Claims
- `JTSJOL` — Job Openings (JOLTS)
- `CIVPART` — Labor Force Participation Rate

**Other Sources:**
- **BLS API** — official employment statistics
- **ADP Employment Report** — private payroll data

### 4.7 Python Implementation

```python
# FRED API via fredapi library
pip install fredapi

from fredapi import Fred
fred = Fred(api_key='YOUR_KEY')

# Get 10Y yield
yield_10y = fred.get_series('DGS10')
# Get CPI
cpi = fred.get_series('CPIAUCSL')
# Get unemployment rate
unemployment = fred.get_series('UNRATE')
# Get Fed Funds Rate
fed_rate = fred.get_series('FEDFUNDS')
# Get GDP
gdp = fred.get_series('GDP')
```

---

## 5. AI Agent Architecture for Financial Assistants

### 5.1 Bloomberg ASKB Architecture (Industry Reference)

Bloomberg's ASKB is the gold standard for financial AI agents:
- **Coordinated Network of AI Agents** working in parallel (not a single monolithic model)
- **Agentic AI**: Agents autonomously navigate Bloomberg's data, news, research, and analytics
- **Key Design Principles** (from CTO Shawn Edwards):
  1. **Data is the moat** — proprietary, curated, trusted data feeds
  2. **Rigorous evaluations** — constant testing against financial ground truth
  3. **Cost discipline** — managing inference costs for production scale
- **MCP Integration**: Built Model Context Protocol features for trustworthy financial AI
- **Workflow Integration**: Scheduled/triggered execution (morning briefs, thesis health checks, earnings analysis)

### 5.2 Agent Architecture Patterns

#### Pattern 1: ReAct (Reason + Act)
- **Foundation of modern LangChain agents**
- LLM alternates between thinking (reasoning) and acting (tool use)
- Loop: Think → Act → Observe → Think → ...
- **Best For**: Simple financial queries requiring 1-3 tool calls

#### Pattern 2: Planner-Executor
- Separate planning agent from execution agent
- Planner breaks complex financial analysis into sub-tasks
- Executor handles each sub-task with specific tools
- **Best For**: Multi-step financial analysis (e.g., "Analyze AAPL: fundamentals + technicals + sentiment + risk")

#### Pattern 3: Router/Dispatcher
- Router LLM classifies the query type
- Dispatches to specialized sub-agents (technical analyst, fundamental analyst, risk manager)
- **Best For**: Multi-domain financial assistant

#### Pattern 4: Multi-Agent Orchestration (LangGraph/CrewAI)
- Multiple specialized agents collaborate
- Each agent has domain expertise (macro, technical, sentiment, risk)
- Shared memory/context between agents
- **Best For**: Complex institutional-grade analysis

### 5.3 Tool Calling / Function Calling for Finance

**Key Tools to Expose:**
```json
{
  "tools": [
    {"name": "get_stock_quote", "description": "Get real-time stock price"},
    {"name": "get_technical_indicators", "description": "Calculate RSI, MACD, BB, etc."},
    {"name": "get_fundamentals", "description": "PE ratio, EPS, revenue, margins"},
    {"name": "get_economic_data", "description": "Interest rates, CPI, GDP from FRED"},
    {"name": "get_news_sentiment", "description": "News sentiment score for a ticker"},
    {"name": "calculate_position_size", "description": "Position sizing based on risk params"},
    {"name": "get_forex_rate", "description": "Real-time forex rates"},
    {"name": "get_economic_calendar", "description": "Upcoming economic events"}
  ]
}
```

**Best LLMs for Function Calling (2025 benchmarks):**
- **Claude 3.5/4 Sonnet** — excellent tool-use accuracy
- **GPT-4o** — reliable structured output + function calling
- **Gemini 2.5 Pro** — strong multi-tool orchestration
- **Key Insight**: Function calling performance depends on reliable tool availability; authentication failures and rate limits break multi-step workflows

### 5.4 Injecting Real-Time Data into LLM Prompts

**Approach 1: Tool-Call-Then-Inject**
1. LLM identifies data needed via function call
2. System fetches real-time data from APIs
3. Data injected back into LLM context
4. LLM reasons over real-time data

**Approach 2: RAG (Retrieval-Augmented Generation)**
1. Pre-index financial documents, reports, news into vector DB
2. LLM query triggers semantic search
3. Relevant documents retrieved and injected into prompt
4. **SMARTFinRAG** (arXiv 2025): Specialized framework for financial RAG
5. **Live RAG**: Real-time data pipeline feeds fresh documents into vector store

**Approach 3: 3-Pipeline Architecture (Production Pattern)**
1. **Ingestion Pipeline**: Real-time data feeds → vector DB + cache
2. **Retrieval Pipeline**: Semantic search + structured data queries
3. **Generation Pipeline**: LLM with retrieved context + real-time data

**Approach 4: MCP (Model Context Protocol)**
- Bloomberg's chosen approach for ASKB
- Standardized protocol for AI models to access external data sources
- TipRanks MCP (mcp.tipranks.com) provides live financial data for Claude, ChatGPT, Cursor

### 5.5 Structured Output (JSON Schema)

**Perplexity API Approach:**
- `response_format` parameter with JSON schemas
- Extract structured, typed JSON from Agent API
- Enforces specific response formats for consistent, machine-readable data

**OpenAI Structured Output:**
- JSON Schema enforcement via `response_format`
- Guarantees output conforms to specified schema
- More reliable than JSON mode alone

**Financial Output Schema Example:**
```json
{
  "type": "object",
  "properties": {
    "ticker": {"type": "string"},
    "recommendation": {"enum": ["strong_buy", "buy", "hold", "sell", "strong_sell"]},
    "confidence": {"type": "number", "minimum": 0, "maximum": 100},
    "target_price": {"type": "number"},
    "stop_loss": {"type": "number"},
    "risk_reward_ratio": {"type": "number"},
    "reasoning": {"type": "string"},
    "key_factors": {"type": "array", "items": {"type": "string"}},
    "time_horizon": {"enum": ["short_term", "medium_term", "long_term"]}
  },
  "required": ["ticker", "recommendation", "confidence", "reasoning"]
}
```

### 5.6 Frameworks for Building Financial AI Agents

| Framework | Type | Best For |
|-----------|------|----------|
| **LangChain + LangGraph** | ReAct, Multi-agent | Complex financial research agents |
| **CrewAI** | Multi-agent | Team of specialized financial analysts |
| **OpenAI Agents SDK** | Single/multi-agent | Simple, official OpenAI integration |
| **Google ADK** | Agent development | Gemini-based financial assistants |
| **LlamaIndex Workflows** | RAG + agents | Document-heavy financial analysis |
| **Microsoft Agent Framework** | Enterprise | Enterprise financial AI systems |

---

## 6. Sentiment Analysis for Financial News

### 6.1 News Sentiment APIs

| API | Coverage | Free Tier | Key Feature |
|-----|----------|-----------|-------------|
| **Finnhub News Sentiment** | Major financial news sources | Yes (60 calls/min) | Weekly sentiment scores per ticker, buzz score, sector benchmark |
| **FMP Social Sentiment** | StockTwits, Twitter, Reddit | Yes | Real-time social sentiment signal |
| **EODHD Financial News API** | Financial news with sentiment | Free tier | Filter by date, type, ticker |
| **Context Analytics** | Social media sentiment | Paid | Proprietary sentiment metrics, predictive short-term equity movement |
| **Alpha Vantage** | News & Sentiment | 25 calls/day | News sentiment with relevance scores |

### 6.2 Best Approaches for News Sentiment Scoring

**Approach 1: FinBert / Financial BERT Models**
- Pre-trained on financial text (10-K filings, earnings calls, financial news)
- HuggingFace models: `ProsusAI/finbert`, `yiyanghkust/finbert-tone`
- Output: Positive, Negative, Neutral + confidence scores
- **Best For**: Dedicated financial sentiment analysis

**Approach 2: LLM-Based Sentiment**
- Use GPT-4, Claude, or Gemini with sentiment extraction prompt
- Structured output to get consistent scoring
- Can incorporate context (market conditions, sector trends)
- **Best For**: Complex, context-aware sentiment analysis

**Approach 3: Transformer-Based Multi-Source**
- Academic research (Emerald, 2025): AI-driven sentiment using transformer models
- Combines financial news + social media data
- Achieves predictive power for short-term price movements

### 6.3 Social Media Sentiment

| Source | API/Method | Key Insight |
|--------|------------|-------------|
| **StockTwits** | Streaming API | Real-time trader sentiment, bullish/bearish signals |
| **Twitter/X** | API v2 | Volume spikes often precede price moves |
| **Reddit** (r/wallstreetbets, r/investing) | PRAW (Python) | Retail sentiment, meme stock detection |
| **Context Analytics** | Proprietary API | Social sentiment predicts short-term equity movement |

### 6.4 Combining Multiple Sentiment Sources

**Ensemble Sentiment Architecture:**
1. **News Sentiment** (weight: 0.4) — Finnhub/FMP news API + FinBERT scoring
2. **Social Sentiment** (weight: 0.25) — StockTwits/Twitter bullish/bearish ratio
3. **Analyst Sentiment** (weight: 0.25) — TipRanks analyst consensus
4. **Insider Sentiment** (weight: 0.1) — Insider buying/selling patterns

**Composite Score Formula:**
```
Sentiment_Score = (0.4 * News) + (0.25 * Social) + (0.25 * Analyst) + (0.1 * Insider)
```
- Score range: -1 (extremely bearish) to +1 (extremely bullish)
- Thresholds: >0.3 = Bullish, <-0.3 = Bearish, between = Neutral

---

## 7. Risk Management in AI Trading Recommendations

### 7.1 Position Sizing Methods

#### Fixed Percentage Risk (Most Common)
```
Position Size = (Account * Risk%) / (Entry - Stop Loss)
```
- Standard: Risk 1-2% of account per trade
- Simple, effective, prevents catastrophic losses

#### Kelly Criterion (Optimal Growth)
```
f* = (p * b - q) / b
where:
  f* = fraction of capital to risk
  p  = probability of winning
  q  = probability of losing (1 - p)
  b  = win/loss ratio
```
- Maximizes long-term geometric growth rate
- **Practical Rule**: Use half-Kelly (f*/2) for safety — full Kelly is too aggressive

#### Volatility-Based (ATR Method)
```
Position Size = (Account * Risk%) / ATR
```
- Uses Average True Range (ATR) as stop-loss distance
- Adapts to market volatility automatically
- Most recommended for AI-driven systems

#### Risk-Per-Trade Formula
```
Position Size = Account Risk / (Entry Price - Stop Loss)
```

### 7.2 Risk/Reward Ratios

| Ratio | Win Rate Needed to Break Even | Typical Use Case |
|-------|-------------------------------|------------------|
| 1:1 | 50% | Scalping |
| 1:2 | 33% | Day trading |
| 1:3 | 25% | Swing trading |
| 1:5+ | 17% | Position trading |

**AI Recommendation**: Target minimum 1:2 risk/reward ratio; 1:3 for higher-confidence setups

### 7.3 Stop-Loss Calculation Methods

#### 1. ATR-Based Stop Loss
```
Stop Loss (Long) = Entry - (ATR * multiplier)
Stop Loss (Short) = Entry + (ATR * multiplier)
```
- Common multiplier: 1.5x to 3x ATR
- Adapts to volatility automatically

#### 2. Support/Resistance-Based Stop
- Place stop just below support (for long) or above resistance (for short)
- Uses pivot points or identified S/R levels

#### 3. Percentage-Based Stop
- Fixed percentage from entry (e.g., 5%, 8%)
- Simple but doesn't adapt to volatility

#### 4. Trailing Stop
```
Trailing Stop = Highest Price - (ATR * multiplier)
```
- Locks in profits as price moves favorably
- Never moves backward

#### 5. Stop-Loss Adjusted Labeling (ML Approach)
- From ScienceDirect (2023): Stop-loss adjusted labeling scheme for ML/AI trading models
- Can be incorporated into any ML/AI predictive model
- Improves risk-adjusted returns vs. standard labeling

### 7.4 Confidence Scoring for Recommendations

**Multi-Factor Confidence Model:**
```python
confidence_score = (
    0.25 * technical_alignment +    # Multiple TAs agree on direction
    0.20 * fundamental_strength +   # Valuation + growth metrics support
    0.20 * sentiment_alignment +    # News + social sentiment support
    0.15 * macro_environment +      # Interest rates, GDP support the trade
    0.10 * volume_confirmation +    # Volume supports the move
    0.10 * historical_win_rate      # Similar setups have worked historically
) * 100
```

**Confidence Levels:**
- **90-100%**: Strong conviction — full position size
- **70-89%**: Moderate conviction — 75% position size
- **50-69%**: Low conviction — 50% position size
- **<50%**: No trade recommended

### 7.5 Risk Management Best Practices for AI Systems

1. **Never risk more than 1-2% per trade** regardless of AI confidence
2. **Maximum 5-6% total portfolio risk** across all open positions
3. **Use ATR-based stops** that adapt to market volatility
4. **Implement circuit breakers**: halt trading after 3 consecutive losses or 5% daily drawdown
5. **Position correlation**: Ensure open positions aren't highly correlated
6. **Time-based exits**: Close positions that haven't moved in expected direction after N periods
7. **Slippage modeling**: Account for slippage in backtests and live trading
8. **Gradual position building**: Scale into positions rather than all-at-once entry

---

## Summary: Recommended Architecture for a Financial AI Assistant

### Core Data Stack
1. **FMP** ($19/mo) — fundamentals, technicals, sentiment, earnings
2. **Twelve Data** ($29/mo) — real-time multi-asset data
3. **FRED API** (free) — macroeconomic data (rates, CPI, GDP, employment)
4. **CoinGecko** (free tier) — crypto data
5. **Finnhub** (free tier) — news sentiment, economic calendar

### Technical Analysis
1. **TA-Lib** for production indicator calculation
2. **pandas-ta** for research/prototyping
3. Custom support/resistance via pivot points + K-Means clustering

### AI Architecture
1. **ReAct agent** via LangChain/LangGraph for core reasoning loop
2. **Tool calling** for real-time data injection
3. **Structured output** (JSON schema) for consistent recommendation format
4. **RAG pipeline** for financial document analysis
5. **Multi-agent pattern** for complex analysis (technical + fundamental + sentiment + risk agents)

### Sentiment Stack
1. **Finnhub news sentiment** API
2. **FinBERT** for custom news sentiment scoring
3. **FMP social sentiment** for StockTwits/Twitter data
4. **TipRanks** analyst consensus

### Risk Framework
1. ATR-based stop losses (1.5-3x ATR)
2. Fixed percentage risk (1-2% per trade)
3. Half-Kelly position sizing for optimal growth
4. Multi-factor confidence scoring (0-100%)
5. Circuit breakers and correlation checks

---

*Research conducted March 2026. All pricing and features subject to change.*
