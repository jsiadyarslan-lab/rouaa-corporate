// ════════════════════════════════════════════════════════════════════
// Lesson Body Content Translations — English (V1041)
// ════════════════════════════════════════════════════════════════════
// Full English translations for the 32 lesson bodies (content, keyPoints,
// practicalExample). Arabic is the canonical source in mock-data.ts;
// this file provides the English equivalent for /en/academy/lesson/[id].
//
// FR/TR/ES translations are deferred — the existing helpers fall back
// to Arabic when no translation is provided, so those locales will
// still show Arabic lesson bodies until separate translation files
// are added in future commits.

export interface LessonBodyTranslation {
  content: string;
  keyPoints: string[];
  practicalExample: string;
}

export const LESSON_BODIES_EN: Record<string, LessonBodyTranslation> = {
  // ── Forex (5 lessons) ──
  l1: {
    content: 'The Forex market, or foreign exchange market, is the largest financial market in the world with a daily trading volume exceeding 7.5 trillion dollars. It operates around the clock five days a week, from the opening of the Sydney session on Monday morning until the close of the New York session on Friday evening. Unlike stock markets, there is no central exchange for Forex — trading takes place over a global electronic network of banks, financial institutions, and brokers.\n\nThe word Forex is derived from the abbreviation of Foreign Exchange, and it involves trading currency pairs where you buy one currency and sell another simultaneously. The most heavily traded pairs are the majors that include the US Dollar, such as EUR/USD, USD/JPY, and GBP/USD.\n\nThe Forex market is influenced by many economic and political factors including interest rates, inflation, economic data, and geopolitical events. Understanding these factors and being able to analyze their impact on currencies is the foundation of successful trading.',
    keyPoints: [
      'Forex is the world\'s largest financial market with daily volume exceeding 7.5 trillion dollars',
      'Operates 24 hours a day, five days a week across consecutive global sessions',
      'Trading is done via currency pairs where you buy one currency and sell another',
      'Economic and political factors are the primary drivers of currency prices',
    ],
    practicalExample: 'If you want to buy EUR/USD at 1.0850, you are buying euros and selling dollars. If the price rises to 1.0900, your profit is 50 pips. With a mini lot size (0.01), each pip equals $0.10, so your profit would be $5. But if the price drops to 1.0800, you would lose $5.',
  },
  l2: {
    content: 'Currency trading takes place through pairs, each consisting of a base currency and a quote currency. The base currency is the first in the pair, and the quote is the second. For example, in EUR/USD, the euro is the base currency and the dollar is the quote. The displayed price shows how much of the quote currency you need to buy one unit of the base currency.\n\nThere are three main categories of currency pairs: majors that include the US Dollar and are the most liquid with the tightest spreads; crosses that don\'t include the dollar such as EUR/GBP; and exotics that include a currency from an emerging market such as USD/TRY.\n\nTrading in Forex is done through different order types: a market order executes immediately at the current price, and a pending order executes when the price reaches a specified level. You can also use stop loss and take profit orders to manage trades automatically.',
    keyPoints: [
      'Each currency pair consists of a base currency (first) and a quote currency (second)',
      'Majors with the US Dollar are the most liquid with the tightest spreads',
      'Order types include market orders, pending orders, stop loss, and take profit',
      'Prices are always displayed with two decimal places and four places for standard Forex',
    ],
    practicalExample: 'You want to buy GBP/USD at 1.2650 with a spread of 1.2 pips. The ask price is 1.26512 and the bid is 1.26500. If you buy a mini lot (0.1) and place a stop loss at 1.2620 and take profit at 1.2720, your risk is 30 pips and your reward is 70 pips. The risk-to-reward ratio is 1:2.3, which is a good ratio.',
  },
  l3: {
    content: 'Understanding how to read currency pair prices is the first step for any trader. The price consists of the bid price — the price the broker offers to buy from you — and the ask price — the price the broker offers to sell to you. The difference between them is the spread, which is the broker\'s source of profit.\n\nA pip is the smallest unit of price change. In most Forex pairs, a pip is the fourth decimal place, but in JPY pairs it\'s the second. The value of a pip changes with lot size: a standard lot (1.0) is approximately $10 per pip, and a micro lot (0.01) is $0.10.\n\nWhen you expect EUR/USD to rise, you buy it (Long). When you expect it to fall, you sell it (Short). In both cases, you can profit from the correct direction — this is a Forex advantage over traditional markets.',
    keyPoints: [
      'The bid price is always lower than the ask price, and the difference is the spread',
      'A pip is the smallest unit of change — the fourth decimal in most pairs',
      'Pip value depends on lot size: standard lot = approximately $10 per pip',
      'You can profit from both rising and falling markets via buy and sell orders',
    ],
    practicalExample: 'If you buy 0.5 lots of USD/CHF at 0.8850 and sell at 0.8900, the difference is 50 pips. The pip value for one lot in this pair is approximately $11.20, so your profit = 50 × 11.20 × 0.5 = $280. But if you sold at 0.8800, you would lose 50 pips, or $280.',
  },
  l4: {
    content: 'The Forex market operates around the clock, but liquidity and volatility vary significantly between sessions. There are three main sessions: the Asian session (Tokyo) from 00:00 to 09:00 GMT, the European session (London) from 07:00 to 16:00, and the American session (New York) from 12:00 to 21:00.\n\nThe most active and liquid periods are during the overlap between the London and New York sessions from 12:00 to 16:00 GMT, where more than 50% of daily Forex volume is traded. This time is ideal for active trading because price movements are stronger and patterns clearer.\n\nDays of the week also matter: Tuesday, Wednesday, and Thursday are usually the best trading days because they contain the most economic data. Monday can be quiet at the start of the week, and Friday after 16:00 GMT sees a noticeable volume drop as the weekly close approaches.',
    keyPoints: [
      'The London-New York overlap (12:00-16:00 GMT) is the most active period',
      'The Asian session is relatively quiet and suitable for JPY and AUD pairs',
      'Tuesday, Wednesday, and Thursday are the best trading days for movement and opportunities',
      'Avoid trading during high-impact news if you\'re a beginner',
    ],
    practicalExample: 'A trader from the Gulf notices that the best time to trade is from 3 PM to 7 PM local time, which corresponds to the London-New York overlap. They plan to open trades during these four hours and only monitor the market the rest of the day, which increases trade quality and reduces random trading.',
  },
  l5: {
    content: 'Calculating profit and loss in Forex depends on three factors: the trade size (lot), the number of pips gained or lost, and the pip value. A standard lot equals 100,000 units of the base currency, a mini lot is 10,000, and a micro lot is 1,000.\n\nThe pip value for a standard lot in pairs ending with the US Dollar (such as EUR/USD and GBP/USD) is exactly 10 dollars. For other pairs, the pip value changes according to the current exchange rate. Therefore, beginners prefer to practice on pairs ending with USD for simpler calculations.\n\nThe basic profit formula: Profit = number of pips × pip value × lot size. Example: if you gain 40 pips on a 0.3 lot trade in EUR/USD, the profit = 40 × 10 × 0.3 = $120. The spread and commissions must be deducted from this profit to calculate the net profit.',
    keyPoints: [
      'Standard lot = 100,000 units, mini = 10,000, micro = 1,000',
      'Pip value for a standard lot in USD pairs is exactly 10 dollars',
      'Profit formula: number of pips × pip value × lot size',
      'Spread and commissions are deducted from profits and added to losses',
    ],
    practicalExample: 'You open a buy trade on EUR/USD with 0.2 lots at 1.0850 and close it at 1.0920. Profit = 70 pips × $10 × 0.2 = $140. If the spread is 1.5 pips, the cost = 1.5 × 10 × 0.2 = $3. Net profit = $137. If the trade had been a sell instead of a buy, you would have lost $143 (140 + 3 spread).',
  },

  // ── Technical Analysis (5 lessons) ──
  l6: {
    content: 'Technical analysis is the study of past price movements to predict future movements, and it relies on three basic principles: price reflects everything, prices move in trends, and history repeats itself. The technical analyst is not concerned with the fundamental reasons behind price movement but with the price itself and trading volume.\n\nBasic tools of technical analysis include: Japanese candlesticks that display the opening, closing, high, and low prices for the period; support and resistance levels that identify areas where price stalls; and technical indicators such as moving averages, RSI, and MACD.\n\nThe timeframe is very important in technical analysis. Analysis on the weekly frame gives a big picture of the general trend, the daily frame for the medium trend, and the hourly frame for trade entries. The golden rule is to analyze the larger timeframe first, then drill down to smaller ones.',
    keyPoints: [
      'Technical analysis studies price and volume to predict future movements',
      'Three principles: price reflects everything, prices trend, history repeats',
      'Japanese candlesticks and support/resistance levels are the basic tools',
      'Start analysis from the larger timeframe then move to smaller ones',
    ],
    practicalExample: 'You want to analyze GBP/USD. You start with the weekly frame and notice a clear uptrend with support at 1.2500. On the daily frame, you see price bouncing from 1.2550 near weekly support. On the 4-hour frame, you notice a bullish reversal pattern. Your decision: buy near 1.2560 with a stop loss below 1.2480 and target 1.2750.',
  },
  l7: {
    content: 'Japanese candlesticks are the most widely used chart type in technical analysis, invented by the Japanese in the 18th century for rice trading. Each candle displays four pieces of information: the opening price, closing price, highest price, and lowest price during the specified time period.\n\nA bullish candle (green) has a closing price higher than its opening, while a bearish candle (red) has a closing lower than its opening. The body is the distance between opening and closing, and the wicks extend from the body to the high and low. A candle with a large body and short wicks indicates clear control, while a candle with long wicks indicates hesitation.\n\nSingle candlestick patterns like the hammer and shooting star give important reversal signals. Multiple candle patterns like engulfing and harami provide stronger confirmation. The most reliable signals come when these patterns appear at key support/resistance levels.',
    keyPoints: [
      'Each candle displays four prices: opening, closing, high, and low',
      'Bullish candle: close is higher than open. Bearish: the opposite',
      'Large body = strong control. Long wicks = hesitation and conflict',
      'Single candle patterns like hammer and star give important reversal signals',
    ],
    practicalExample: 'On the USD/JPY daily chart, you notice a continuous decline then a hammer candle appears at a strong support level. The hammer has a long lower wick and a small body at the top, indicating that sellers pushed the price down but buyers regained control and closed near the open. This is a potential bullish reversal signal.',
  },
  l8: {
    content: 'The Relative Strength Index (RSI) is a momentum oscillator oscillating between 0 and 100, developed by J. Welles Wilder in 1978. RSI calculates the average gains versus average losses over a specified period (usually 14 days). The mathematical formula makes readings above 70 indicate overbought conditions and below 30 indicate oversold.\n\nHowever, overbought doesn\'t mean immediate reversal. In a strong trend, RSI can stay above 70 for a long time while price continues rising. Therefore, RSI is best used with other indicators to confirm signals. One of the strongest RSI signals is divergence: when price records a higher high but RSI records a lower high, indicating weakening momentum and an approaching reversal.\n\nAdvanced uses include: the 50 level as a divider between bullish and bearish, trendlines on RSI itself, and adjusted overbought/oversold zones based on trend (40-50 as support in uptrends, 50-60 as resistance in downtrends).',
    keyPoints: [
      'RSI oscillates between 0 and 100 and measures price momentum (default 14 period)',
      'Above 70 = overbought. Below 30 = oversold. But not necessarily immediate reversal',
      'Divergence between price and RSI is one of the strongest reversal signals',
      'The 50 level acts as a divider between bullish and bearish momentum',
    ],
    practicalExample: 'On the EUR/USD daily chart, price records a new high at 1.0980 while RSI records a lower high at 68 compared to the previous high at 75. This is bearish divergence indicating weakening bullish momentum. You wait for a break of the uptrend line on price to confirm the signal, then open a sell trade with a stop loss above the high.',
  },
  l9: {
    content: 'The MACD indicator combines trend-following and momentum-measuring properties, and is one of the most widely used indicators. It consists of three elements: the MACD line (the difference between the 12 and 26 moving averages), the signal line (the 9-period moving average of the MACD line), and the histogram (the difference between the MACD line and the signal line).\n\nThe most famous MACD signals are crossovers: when the MACD line crosses above the signal line, it\'s a buy signal, and the opposite is a sell signal. Crossovers are more reliable when they occur in extreme zones (far above or below zero). The histogram shows the distance between the two lines and gives an early warning before the crossover itself.\n\nDivergence on MACD is stronger than crossovers. When price rises to a new high but MACD records a lower high, this contradiction indicates an approaching reversal. As with all indicators, MACD gives false signals in sideways markets, so it\'s best used with price analysis.',
    keyPoints: [
      'MACD combines trend-following and momentum measurement in one indicator',
      'MACD line crossing above signal line = buy. The opposite = sell',
      'The histogram gives an early warning before the crossover',
      'Divergence on MACD is one of the strongest advanced reversal signals',
    ],
    practicalExample: 'On the GBP/JPY weekly chart, you notice a bullish crossover of the MACD line above the signal line after a period of decline. The histogram started turning from negative to positive three candles before the crossover. This is an early warning. With strong support on the chart, you open a buy trade with a stop loss below the support.',
  },
  l10: {
    content: 'Chart patterns are geometric shapes that repeat on charts and indicate the direction of future price movement. They are divided into two main categories: reversal patterns that reverse the current trend, and continuation patterns that indicate trend continuation after a pause.\n\nFamous reversal patterns include: Head and Shoulders — one of the strongest reversal signals, consisting of three peaks with the middle one highest; Double Top — resembling the letter M, indicating price failure to break resistance twice; and Double Bottom — resembling the letter W.\n\nContinuation patterns include: Triangles (ascending, descending, and symmetrical), Flags which are short retracement periods within a strong trend, and Wedges which resemble triangles but slope against the trend. Trading volume plays a crucial role in confirming patterns: volume should increase when the neckline breaks.',
    keyPoints: [
      'Reversal patterns: head and shoulders, double tops, double bottoms',
      'Continuation patterns: triangles, flags, wedges',
      'Trading volume confirms pattern validity especially at neckline break',
      'The price target is usually calculated by the neckline distance from the breakout point',
    ],
    practicalExample: 'On the AUD/USD daily chart, you notice a head and shoulders pattern: left shoulder at 0.6650, head at 0.6700, right shoulder at 0.6640. The neckline is at 0.6560. When the neckline breaks with high volume, you open a sell trade. The target = the distance from head to neckline (140 pips) subtracted from the breakout point: 0.6560 - 0.0140 = 0.6420.',
  },

  // ── Fundamental Analysis (5 lessons) ──
  l11: {
    content: 'Fundamental analysis is the study of the economic, political, and social factors that affect the value of currencies and financial assets. While technical analysis focuses on price movement itself, fundamental analysis focuses on the underlying reasons behind these movements. The goal is to determine the true value of an asset and compare it to the market price.\n\nThe main fundamental drivers include: interest rates that determine investment returns in a currency, inflation that erodes purchasing power, labor market data that reflects economic health, gross domestic product as a comprehensive measure of economic growth, and geopolitical events that cause sudden fluctuations.\n\nThe best traders combine both analyses: fundamental to determine the general direction and technical to choose entry and exit points. Understanding fundamental data helps you know why price moves, and technical analysis tells you when to enter the trade.',
    keyPoints: [
      'Fundamental analysis studies the economic and political reasons behind price movements',
      'Interest rates, inflation, and labor data are the strongest fundamental drivers',
      'Combining fundamental and technical analysis gives the best results',
      'The economic calendar is your first tool for tracking fundamental data',
    ],
    practicalExample: 'The Federal Reserve raises interest rates 0.25% more than expected. This strengthens the US Dollar because higher returns attract foreign investment. You expect USD/JPY to rise and EUR/USD to fall. You use technical analysis to determine the best entry point after the market\'s initial reaction.',
  },
  l12: {
    content: 'Employment data, especially the monthly NFP report, is one of the most market-impacting data. The report is released on the first Friday of every month and includes the number of new jobs, the unemployment rate, and average wages. Any surprise in these numbers can move the dollar hundreds of pips in minutes.\n\nThe logic is simple: strong employment means a healthy economy, which supports rate hikes and strengthens the dollar. Weak employment means a need for economic stimulus that may include rate cuts, weakening the dollar. Average wages are also important because rising wages mean inflationary pressure that may require monetary tightening.\n\nNFP impact extends to all dollar pairs, gold (usually inverse relationship), and stock indices. Professional traders avoid opening trades right before NFP and wait for the initial reaction, then enter with the trend after price stabilizes.',
    keyPoints: [
      'NFP is released on the first Friday of every month and strongly moves the dollar',
      'Strong employment = dollar support. Weak employment = dollar weakness',
      'Average wages are an important inflation indicator and may be stronger than the employment number itself',
      'Avoid trading right before NFP and wait for price to stabilize first',
    ],
    practicalExample: 'The NFP report shows 350,000 jobs added versus 180,000 expected. The dollar surges: EUR/USD drops 80 pips in 5 minutes. Instead of buying immediately, you wait for a small retracement then enter short with the trend, with a stop loss above the pre-news high. This is a safer approach than trading during the initial frenzy.',
  },
  l13: {
    content: 'Interest rate decisions are the strongest driver of currency prices in the medium and long term. When a central bank raises interest rates, the currency becomes more attractive to investors seeking higher returns, pushing its value up. The opposite is true when cutting rates. This is the main reason behind major currency movements.\n\nHowever, the market trades on expectations, not the decisions themselves. If everyone expects a hike and the hike happens, the price may not move much because the news is already priced in. Surprises are what move markets: unexpected hikes or signals more aggressive than the market expected.\n\nThe accompanying statement and the chair\'s press conference are sometimes more important than the decision itself. Words like "hawkish" (leaning toward rate hikes) or "dovish" (leaning toward cuts) set market direction for the coming weeks. News trading strategies focus on the gap between expectations and the actual outcome.',
    keyPoints: [
      'Raising rates supports the currency and cutting weakens it — the primary driver',
      'The market prices expectations in advance, so only surprises move price strongly',
      'The accompanying statement and press conference are often more important than the decision itself',
      'Track market expectations via rate futures (Fed Funds Futures) before the decision',
    ],
    practicalExample: 'The European Central Bank raises rates 0.25% as expected, but the President says "more hikes are coming" — stronger than expected. The euro surges against the dollar. You enter a buy trade on EUR/USD with a stop loss below a nearby support, benefiting from the new momentum.',
  },
  l14: {
    content: 'The Consumer Price Index (CPI) is the primary inflation measure and is released monthly in most major countries. It measures the change in the cost of a basket of consumer goods and services. High inflation erodes purchasing power and pressures central banks to raise rates, while low or deflationary inflation may push them to cut rates or use stimulus tools.\n\nCore CPI excludes the volatile prices of energy and food and gives a clearer picture of the true inflation trend. Central banks watch it closely because it is more stable and predictable than headline CPI.\n\nCPI\'s impact on markets is immediate and strong: inflation higher than expected supports the currency (because it increases the likelihood of rate hikes), and lower inflation weakens it. Gold is particularly affected because it is considered an inflation hedge — rising CPI usually supports gold.',
    keyPoints: [
      'CPI measures the change in a consumer basket and is the main inflation gauge',
      'Core CPI excludes food and energy and is more indicative of the inflation trend',
      'Inflation higher than expected = currency support and higher likelihood of rate hikes',
      'Gold usually rises with high CPI because it is an inflation hedge',
    ],
    practicalExample: 'US CPI data shows a monthly rise of 0.5% versus 0.3% expected. This means higher-than-expected inflation and the dollar rises. Gold also rises because high inflation supports hedge assets. You enter a buy trade on gold with a stop loss below a nearby support.',
  },
  l15: {
    content: 'Major economic data includes gross domestic product, manufacturing and services indicators, retail sales, trade balance, and others. Each has its importance, but their impact varies according to the prevailing economic context. In periods of recession concern, growth and employment data are most important, while in inflationary periods, price data has the strongest impact.\n\nThe secret lies in comparing actual data to expectations, not to absolute values. Data better than expected supports the currency, and worse weakens it. Sources of expectations include Bloomberg and Reuters surveys and futures index contracts.\n\nAdvanced strategy: don\'t just read the headline number — look at the details. For example, NFP may show strong jobs but unemployment rose or wages weakened — these contradictions create trading opportunities after the initial reaction settles when the market realizes the full picture.',
    keyPoints: [
      'Compare actual data to expectations, not just absolute values',
      'The importance of each data changes according to the prevailing economic context',
      'Details are sometimes more important than the headline — read the full report',
      'Contradictions within the same report create trading opportunities after the initial reaction',
    ],
    practicalExample: 'US GDP data shows 2.5% growth versus 2.0% expected — positive for the dollar. But in detail: consumer spending fell and inventories rose (unsustainable growth). The dollar initially rises then retreats. You enter short on USD/CHF after the retreat, benefiting from a deeper reading of the data.',
  },

  // ── Risk Management (4 lessons) ──
  l16: {
    content: 'Risk management is the difference between a successful and a failed trader. Studies show that more than 70% of beginner traders lose their capital within the first year, and the main reason is not the inability to analyze the market but the lack of risk management. The goal of risk management is not to prevent loss but to control it so you stay in the game for a long time.\n\nThe first golden rule: do not risk more than 1-2% of your capital in a single trade. If your account is $10,000, the maximum allowed loss in a single trade is $100-200. This ensures you need more than 50 consecutive losing trades to lose half your account — almost impossible with disciplined trading.\n\nThe second rule: diversification. Don\'t put all your risk in one asset or one pair. Distribute trades across different pairs that are not closely correlated. The third rule: prior planning. Determine the entry point, stop loss, and take profit before opening the trade and stick to them.',
    keyPoints: [
      'Risk management is more important than market analysis — it determines your survival',
      'Don\'t risk more than 1-2% of capital in a single trade',
      'Diversify trades across assets that are not closely correlated',
      'Plan in advance: determine entry, stop loss, and target before opening the trade',
    ],
    practicalExample: 'Your account is $5,000 and you want to trade EUR/USD. With a 1% risk, maximum loss = $50. If you place a stop loss 25 pips away, the trade size = 50 / (25 × 0.10) = 20 micro lots (0.20 lot). With this size, if the stop loss is hit, you lose only $50, or 1% of your account.',
  },
  l17: {
    content: 'Stop Loss is an automatic order that closes the trade at a specified price level to limit losses. Take Profit is a similar order that closes the trade at the target level. These two orders are the first line of defense and the financial plan for any trade.\n\nTypes of stop loss: a fixed stop is placed at a specified price level and doesn\'t move; a trailing stop follows the price at a specified distance and locks in profits gradually. An analysis-based stop is placed at a support or resistance level or under a technical pattern, and a percentage-based stop is placed at a percentage of the entry price.\n\nCommon mistakes: placing the stop too tight so it gets hit by a normal move then price continues in your direction; not placing a stop at all and hoping for a rebound; and moving the stop to increase the loss. The rule: never enter a trade without a stop loss, no exceptions.',
    keyPoints: [
      'Stop loss is mandatory in every trade — no exceptions',
      'Trailing stop locks in profits gradually as the trend continues',
      'Place the stop at a logical technical level, not randomly',
      'Risk-to-reward ratio should be at least 1:2 for every trade',
    ],
    practicalExample: 'You buy GBP/USD at 1.2650 and place a stop loss at 1.2590 (60 pips) below strong support. Your target is 1.2770 (120 pips) at resistance. Risk-to-reward ratio = 60:120 = 1:2. If the stop is hit, you lose 60 pips; if the target is reached, you gain 120 pips. You need only a 34% win rate to break even with this ratio.',
  },
  l18: {
    content: 'Position sizing is the most important decision you make after the entry decision itself. A wrong size can turn an analytically correct trade into a financial disaster. The goal is to determine the trade size so the potential loss is always within your acceptable limits.\n\nPosition size formula: lot size = (capital × risk percentage) / (stop loss distance in pips × pip value). Example: $10,000 account with 2% risk and 50-pip stop with $10 pip value. Lot size = (10000 × 0.02) / (50 × 10) = 0.4 lot.\n\nImportant rules: keep the total risk for all open trades no more than 5-6% of capital. If you have 3 open trades each with 2% risk, the total risk is 6%, which is the maximum. Never increase the size after a loss to recover it (this is called martingale and is very dangerous).',
    keyPoints: [
      'Position size = (capital × risk percentage) / (stop distance × pip value)',
      'Total risk for all open trades should not exceed 5-6%',
      'Don\'t increase size after a loss — this is martingale and it\'s catastrophic',
      'Reduce size after a series of losses until you regain your confidence and analysis',
    ],
    practicalExample: 'After a series of losses, your account drops from $10,000 to $8,000. With 1% risk: maximum loss = $80. If your stop is 40 pips on EUR/USD: size = 80 / (40 × 10) = 0.2 lot. You reduced the risk from 2% to 1% to protect the account during difficult times. This is professional behavior.',
  },
  l19: {
    content: 'The Risk/Reward Ratio compares the potential loss to the potential profit in a trade. A 1:2 ratio means you risk one dollar to gain two. This ratio is the cornerstone of any successful trading strategy because it ensures profitability even with a win rate below 50%.\n\nThe calculation is simple: with a 1:2 risk-to-reward ratio, you need only 34% winning trades to break even. With 1:3, you need only 25%. This means you can lose in 2 out of every 3 trades and still be profitable if the risk-to-reward ratio is 1:3.\n\nThe common mistake is closing winning trades early out of fear and letting losers run hoping for improvement. This effectively reverses the ratio: you risk a lot and gain a little. The solution: determine the target in advance, let the price work, and don\'t intervene.',
    keyPoints: [
      '1:2 minimum — risk 1 to gain 2',
      'With a 1:3 ratio you need only 25% wins to be profitable',
      'Don\'t close winners early — this drastically reduces the actual ratio',
      'Choose trades with naturally high ratios at clear support/resistance levels',
    ],
    practicalExample: 'You enter short on USD/CAD at 1.3650 with a stop at 1.3710 (60 pips loss) and target at 1.3530 (120 pips profit). Ratio = 1:2. If this trade repeats 10 times and only 4 win: profit = 4 × 120 = 480 pips. Loss = 6 × 60 = 360 pips. Net profit = 120 pips despite a 40% win rate.',
  },

  // ── Crypto (3 lessons) ──
  l20: {
    content: 'Cryptocurrencies are decentralized digital assets that use blockchain technology to record transactions. Bitcoin was the first cryptocurrency, launched in 2009 by a person or group under the name Satoshi Nakamoto. Today there are more than 20,000 different cryptocurrencies with a total market cap exceeding 2 trillion dollars.\n\nBlockchain is a digital ledger distributed across thousands of computers around the world, making it nearly impossible to hack or modify. This is the basis of security in cryptocurrencies. Every transaction is verified by a network of miners or validators before being recorded.\n\nCrypto features include: decentralization (no central authority controls it), transparency (all transactions are public), and global reach (send to anyone in the world within minutes). But drawbacks include high volatility, limited regulation, and cybersecurity risks.',
    keyPoints: [
      'Blockchain is the underlying technology — a decentralized, tamper-proof digital ledger',
      'Bitcoin is the first and largest cryptocurrency with a market cap exceeding one trillion dollars',
      'Decentralization, transparency, and global reach are the main crypto features',
      'High volatility, regulatory risks, and cyber risks are the main challenges',
    ],
    practicalExample: 'You buy 0.01 bitcoin at $65,000 ($650). Within a week, bitcoin rises 8% to $70,200. Your investment becomes $702. But if it drops 8%, it becomes $598. This illustrates the high volatility: large profits and losses in short periods. That\'s why risk management in crypto is more important than in any other market.',
  },
  l21: {
    content: 'Trading bitcoin and major cryptocurrencies (Ethereum, BNB, Solana) differs from Forex trading in several aspects. The market operates 24/7 without stopping, volatility is much higher, and regulatory news has a huge impact. But the basics of technical and fundamental analysis remain the same.\n\nBitcoin is the primary driver of the entire market. When bitcoin rises, most other coins rise with it (usually by a larger percentage), and when it falls, they all fall. This close correlation means that analyzing bitcoin should be your first step before trading any other coin.\n\nCrypto-specific factors: Bitcoin halving (every 4 years the mining reward is cut in half, which historically reduces supply and pushes the price up), network updates (like Ethereum upgrades), government regulation (SEC decisions and China\'s impact), and exchange risks (platform hacks).',
    keyPoints: [
      'The crypto market operates 24/7 and volatility is much higher than Forex',
      'Bitcoin leads the market — analyze it first before any other coin',
      'Halving every 4 years reduces supply and has historically pushed the price up',
      'Government regulation and platform security are unique crypto risks',
    ],
    practicalExample: 'Bitcoin tests resistance at $70,000 after a strong rally. Ethereum trades at $3,800. Your analysis sees that if bitcoin breaks $70,000 it will reach $80,000. Instead of buying bitcoin directly, you buy Ethereum because it moves by a larger percentage (higher beta). If bitcoin rises 15%, Ethereum might rise 25%.',
  },
  l22: {
    content: 'Crypto market analysis requires understanding unique factors not found in traditional markets. The first is on-chain analysis: studying the blockchain data itself such as transaction volume, number of active wallets, and coin flow to and from exchanges. This data gives a unique view of investor behavior.\n\nThe second: liquidity and supply analysis. Many coins have an unlock schedule that gradually releases new quantities. These releases can pressure the price. Bitcoin is different because its supply is fixed at 21 million coins only.\n\nThe third: crypto-specific sentiment indicators. The Crypto Fear and Greed Index, the number of bitcoin searches, and the network hash rate are all indicators that help gauge market state. In crypto more than any other market, emotions drive short-term prices.',
    keyPoints: [
      'On-chain analysis studies direct blockchain data — a unique crypto advantage',
      'Coin unlock schedules pressure the price — watch them carefully',
      'The Crypto Fear and Greed Index is an important emotional indicator',
      'Emotions are stronger in crypto than in any other market — beware of impulsive decisions',
    ],
    practicalExample: 'On-chain analysis shows a large amount of bitcoin moved from cold wallets to exchanges — usually a sign of selling intent. At the same time, the Fear and Greed Index is at 85 (extreme greed). You decide to reduce your long positions or set a trailing stop to secure profits.',
  },

  // ── Commodities (3 lessons) ──
  l23: {
    content: 'Gold is the oldest financial asset in history and a safe haven in times of crisis. It trades under the symbol XAU/USD and is affected by unique factors, most importantly: the dollar price (usually inverse relationship), real interest rates (interest minus inflation), geopolitical risks, and physical demand from India and China.\n\nWhen the dollar weakens, gold becomes cheaper for buyers with other currencies, increasing demand and price. When real interest rates rise, gold becomes less attractive because it doesn\'t yield a return. But in times of crisis and worry, gold rises regardless of interest because it is a safe store of value.\n\nGold is characterized by moderate volatility (less than crypto and more than Forex) and high liquidity. It trades around the clock, but its best times coincide with the London and New York sessions. Traders use technical analysis successfully on gold because its patterns are clear and relatively reliable.',
    keyPoints: [
      'Gold is a safe haven that rises in crises — usually inverse to the dollar',
      'High real interest rates weaken gold because it doesn\'t yield a return',
      'Physical demand from India and China affects the medium-term price',
      'Moderate volatility and high liquidity — suitable for all levels of traders',
    ],
    practicalExample: 'Geopolitical tensions escalate and the dollar weakens. You buy gold at $2,350 with a stop loss at $2,320 ($30) and target $2,420 ($70). Ratio 1:2.3. If the crisis intensifies, the price may exceed your target significantly, so you set a trailing stop $20 behind the price to lock in profits.',
  },
  l24: {
    content: 'Crude oil trades in two main types: Brent (the global benchmark) and WTI (the American benchmark). Oil price is affected by real supply and demand more than any other factor. OPEC+ controls a large portion of production and its decisions move prices strongly.\n\nSupply factors: OPEC+ production decisions, American shale oil production, and geopolitical events in production regions (Gulf, Russia, Venezuela). Demand factors: global economic growth especially China, the summer travel and driving season, and the long-term shift to clean energy.\n\nThe weekly US oil inventory report (EIA) is released weekly and moves prices immediately. Inventories higher than expected = downward pressure, and lower = upward pressure. Professional traders also watch refining rates and gasoline and distillate inventories.',
    keyPoints: [
      'Brent and WTI are the two main benchmarks — Brent usually trades at a higher price',
      'OPEC+ decisions are the strongest supply driver and move prices strongly',
      'Chinese growth is the main driver of global oil demand',
      'The weekly EIA inventory report is an important event to follow',
    ],
    practicalExample: 'OPEC+ announces a production cut of 2 million barrels per day more than expected. Oil rises 4% in one day. You had bought WTI at $78 before the meeting based on cut rumors. You placed a stop at $76 and now the price is $81.12. You raise the trailing stop to $79 to secure at least $1 profit per barrel.',
  },
  l25: {
    content: 'The US dollar and dollar-denominated commodities have a historical inverse relationship. When the dollar rises, commodities become more expensive for buyers with other currencies, reducing demand and price. The opposite happens when the dollar weakens. This relationship applies strongly to gold, oil, and industrial metals.\n\nBut the relationship isn\'t always mechanical. In times of crisis, both the dollar and gold may rise together because both are considered safe havens. In periods of strong growth, both the dollar and oil may rise together because energy demand increases.\n\nTrading strategy: watch the DXY (dollar index) and gold at the same time. If DXY rises and gold falls, that\'s a normal trend. If both rise, it\'s an indicator of market fear (risk-off). If both fall, it may signal inflationary risks. Understanding these relationships adds an important layer to your analysis.',
    keyPoints: [
      'Historical inverse relationship: strong dollar = cheaper commodities, weak dollar = more expensive',
      'Exceptions occur especially in times of crisis (both rise as safe havens)',
      'Watch DXY and gold simultaneously to understand market direction',
      'Strong dollar + rising gold = risk-off market sentiment',
    ],
    practicalExample: 'DXY drops from 106 to 103 and gold rises from $2,300 to $2,380. The inverse relationship works normally. You open a gold long trade relying on continued dollar weakness. But suddenly DXY rises and gold doesn\'t fall — this contradiction may indicate safe-haven demand for gold due to some crisis. You add a trailing stop to protect your profits.',
  },

  // ── Strategies (4 lessons) ──
  l26: {
    content: 'Trend Following is one of the oldest and most successful strategies in history. The principle is simple: "the trend is your friend" — buy when the market is in an uptrend and sell when in a downtrend. The idea is that trends tend to continue more than they tend to reverse.\n\nIdentifying the trend: the 200-day moving average is the standard. If price is above MA200, the trend is up; if below, it\'s down. On the weekly frame, MA50 defines the medium trend, and on the daily, MA20 for the short trend.\n\nEntry points: the best point is a retracement from the moving average in a primary trend. For example: price above MA200 (uptrend) and bouncing from MA50. You wait for confirmation with a reversal candle or RSI crossing above 50, then buy. Stop loss below the last formed low. Target at the next resistance or using a trailing stop.',
    keyPoints: [
      'Trends tend to continue — trade with them, not against them',
      'MA200 defines the primary trend, MA50 the medium, MA20 the short',
      'Best entry point: retracement from MA in primary trend with confirmation',
      'Use a trailing stop to lock in profits as the trend continues',
    ],
    practicalExample: 'On EUR/USD daily: price above MA200 (uptrend). Price bounces from MA50 at 1.0820. A hammer candle forms with RSI back above 50. You buy at 1.0840 with a stop below the low at 1.0790 (50 pips) and target the last high at 1.0950 (110 pips). Ratio 1:2.2. You set a trailing stop at a 30-pip distance.',
  },
  l27: {
    content: 'The Breakout strategy relies on entering when a major support or resistance level breaks with high trading volume. The idea is that when price breaks a pivotal level, it gains strong momentum in the breakout direction. Breakouts occur after periods of sideways consolidation where price compresses like a spring.\n\nConditions for a valid breakout: the break must be with a strong candle (clear close above/below the level), trading volume at least three times the average, and preferably the level has been tested at least twice before. False breakouts occur when price breaks the level then quickly returns — which is why volume confirmation is important.\n\nEntry point: either at the breakout directly (riskier but higher profit) or at a retest of the broken level (safer but a retest may not happen). Stop loss below/above the broken level. The target is determined by the size of the previous sideways range or with Fibonacci tools.',
    keyPoints: [
      'Breakout = breaking a major level with high volume and strong momentum',
      'Volume confirmation is essential — a breakout without volume is usually false',
      'Enter at the breakout or at the retest (safer)',
      'Stop loss below/above the broken level, target by previous range size',
    ],
    practicalExample: 'GBP/USD trades sideways between 1.2600 and 1.2750 for two weeks. Suddenly it breaks 1.2750 with a strong candle and three times average volume. You buy at 1.2760 with a stop at 1.2740 (just below the broken level). Target = range width (150 pips) + breakout point: 1.2750 + 0.0150 = 1.2900. The 1:7 ratio allows losing several trades and remaining profitable.',
  },
  l28: {
    content: 'Swing Trading holds trades from a few days to a few weeks, targeting medium-term price movements. It is the golden middle between exhausting day trading and slow long-term investing. Suitable for traders who cannot watch the screen all day.\n\nTimeframes: analysis on the daily frame to determine trend and entry points, weekly to confirm the general trend, and 4-hour to fine-tune entry. The rule: make the decision on the daily, execute on the 4-hour.\n\nBest swing opportunities: retracements from strong support/resistance levels with indicator crossovers (like MACD or moving average crossovers), completed reversal patterns on the daily frame, and breakouts after sideways periods. Stop loss is usually 50-150 pips and target 100-400 pips, with a risk-to-reward ratio of at least 1:2.',
    keyPoints: [
      'Swing holds trades for days and weeks — does not require continuous monitoring',
      'Decision on daily, execution on 4-hour',
      'Best opportunities: retracements from strong levels with indicator confirmation',
      'Stop 50-150 pips and target 100-400 pips with 1:2+ ratio',
    ],
    practicalExample: 'USD/JPY on the daily frame: uptrend with rising MA200. Price bounces from MA20 at 154.50 with a bullish MACD crossover. On the 4-hour frame: bullish reversal candle. You buy at 154.80 with a stop below 153.80 (100 pips) and target 157.00 (220 pips). Ratio 1:2.2. The trade may take a week to reach the target.',
  },
  l29: {
    content: 'Scalping is very fast trading that targets small, repeated profits from precise price movements. A scalper opens and closes dozens of trades daily, targeting 5-15 pips per trade. This style requires high focus, fast execution, and a stable internet connection.\n\nScalping requirements: a broker with very low spread (less than a pip on major pairs), a fast execution platform without slippage, and the psychological ability to make quick decisions and stick to the plan without hesitation. Not suitable for traders who hesitate or experience psychological pressure.\n\nBest scalping pairs: EUR/USD and GBP/USD for their tight spreads and high liquidity. Best times: London session and overlap with New York. Technical tools: short moving averages (5, 13, 21), short-period RSI (5), and support/resistance levels on the 1-minute and 5-minute frames.',
    keyPoints: [
      'Scalping targets 5-15 pips per trade with extreme speed',
      'Requires very low spread, fast execution, and high focus',
      'Best pairs: EUR/USD and GBP/USD. Best time: London and New York',
      'Not for beginners — requires experience and excellent psychological discipline',
    ],
    practicalExample: 'A scalper trades EUR/USD on the 1-minute frame. Price bounces from MA21 with RSI(5) exiting oversold. They buy at 1.0852 with a stop at 1.0845 (7 pips) and target 1.0865 (13 pips). Ratio 1:1.9. The trade closes in 3-5 minutes. They repeat this 15-20 times daily targeting a net 50-80 pips.',
  },

  // ── AI (3 lessons) ──
  l30: {
    content: 'Artificial intelligence is revolutionizing the trading world through its ability to analyze massive amounts of data at lightning speed and discover patterns invisible to humans. Its applications in trading include: market sentiment analysis from news and social media, price movement prediction based on historical patterns, automated trading signal detection, and risk management optimization.\n\nTypes of AI used: Machine Learning that learns from historical data and improves its performance over time, Natural Language Processing (NLP) that analyzes texts and news, and deep neural networks that mimic brain structure to discover complex patterns.\n\nIt\'s important to understand: AI is not a crystal ball and doesn\'t guarantee profits. It\'s a powerful tool that helps you make better decisions, but the final decision is yours. The best use of AI is as an assistant, not a replacement. Use it to confirm your analysis or filter opportunities, not to make the entire decision.',
    keyPoints: [
      'AI analyzes massive data and discovers patterns invisible to humans',
      'Applications: sentiment analysis, price prediction, signal detection, risk management',
      'AI is not a crystal ball — it\'s an assistant, not a replacement',
      'Best use: confirming analysis and filtering opportunities, not full decision-making',
    ],
    practicalExample: 'The Rouaa platform uses AI to analyze 500 news sources in real time and issues a sentiment rating for each currency pair. AI discovers that 78% of news on the British pound is negative with a bearish MACD crossover on the daily frame. This double signal (fundamental + technical) increases your confidence in the sell decision on GBP/USD.',
  },
  l31: {
    content: 'AI reads financial markets through three main channels. First: price and volume analysis using machine learning algorithms that discover patterns in price movement that the human mind doesn\'t notice. AI can process hundreds of pairs on dozens of timeframes simultaneously.\n\nSecond: sentiment analysis. AI processes thousands of articles, tweets, and reports per hour and classifies them as positive, negative, or neutral. It calculates an overall sentiment index for each asset and compares it to historical prices to predict the next reaction. When sentiment is excessively positive, it may be time to sell, and vice versa.\n\nThird: correlation analysis. AI discovers relationships between assets that the average trader doesn\'t notice — for example, that rising copper prices usually precede AUD/JPY rises by three days. These advanced correlations give a real competitive advantage.',
    keyPoints: [
      'AI reads markets via: price analysis, sentiment analysis, and correlation analysis',
      'Discovers patterns across hundreds of pairs and dozens of timeframes simultaneously',
      'Sentiment analysis processes thousands of texts and calculates an index per asset',
      'Advanced correlations between assets give a unique competitive advantage',
    ],
    practicalExample: 'AI in the Rouaa platform discovers that the dollar sentiment index has reached extreme pessimism (15/100), the lowest level in 6 months. Historically, when sentiment reaches this level, the dollar rebounds within 5 days 70% of the time. This AI signal adds to confirming your technical analysis that sees a double bottom pattern on DXY.',
  },
  l32: {
    content: 'Building an AI-powered trading strategy requires a deep understanding of both fields: trading and data. The first step is to clearly define the problem: do you want AI to predict direction? Or determine entry and exit points? Or improve risk management? Each goal requires different data and algorithms.\n\nThe second step: data collection. You need historical price data (OHLCV), fundamental data (economic indicators), sentiment data (news and tweets), and on-chain data for crypto. Data quality is more important than algorithm quantity — bad data = bad results.\n\nThe third step: building the model. Start with a simple model (linear regression or decision tree) then gradually increase complexity. Test it on historical data it didn\'t use in training (out-of-sample test). The fourth step: backtesting with attention to spread, slippage, and commissions. The fifth step: demo trading then gradual real-money trading.',
    keyPoints: [
      'Define the problem first: prediction, entry signals, or risk management',
      'Data quality is more important than algorithm complexity',
      'Start with a simple model then increase complexity gradually with testing at each stage',
      'Test on out-of-sample data then demo trade before real money',
    ],
    practicalExample: 'You build an AI model to predict EUR/USD daily direction. You use 5 years of data including: OHLCV prices, 10 technical indicators, and a news sentiment index. You train a Random Forest and achieve 58% accuracy on test data. With a 1:2 risk-to-reward ratio, you need only 35% wins to be profitable. 58% means a clear edge. You start with a month of demo trading.',
  },
};
