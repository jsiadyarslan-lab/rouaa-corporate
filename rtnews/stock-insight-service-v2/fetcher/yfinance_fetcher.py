"""
YFinance Data Fetcher — Replaces Chinese East Money with global yfinance.
Supports stocks, crypto, forex, commodities, and indices worldwide.
"""

import pandas as pd
import yfinance as yf
from loguru import logger


class YFinanceDataFetcher:
    """Fetches market data using yfinance and calculates technical indicators."""

    def __init__(self, name: str, symbol: str, period: str = "1y", interval: str = "1d"):
        self.name = name
        self.symbol = symbol
        self.period = period
        self.interval = interval

    def calc_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate technical indicators: MA, Bollinger, MACD, RSI, Volume MA."""
        df = df.copy()

        # Moving Averages
        df["MA5"] = df["close"].rolling(5).mean()
        df["MA20"] = df["close"].rolling(20).mean()
        df["MA60"] = df["close"].rolling(60).mean()
        df["MA120"] = df["close"].rolling(120).mean()

        # Bollinger Bands
        df["Boll_Mid"] = df["close"].rolling(20).mean()
        df["Boll_Std"] = df["close"].rolling(20).std()
        df["Boll_Upper"] = df["Boll_Mid"] + 2 * df["Boll_Std"]
        df["Boll_Lower"] = df["Boll_Mid"] - 2 * df["Boll_Std"]

        # MACD
        df["EMA12"] = df["close"].ewm(span=12, adjust=False).mean()
        df["EMA26"] = df["close"].ewm(span=26, adjust=False).mean()
        df["DIF"] = df["EMA12"] - df["EMA26"]
        df["DEA"] = df["DIF"].ewm(span=9, adjust=False).mean()
        df["MACD"] = (df["DIF"] - df["DEA"]) * 2

        # RSI
        df["change"] = df["close"].diff()
        df["gain"] = df["change"].apply(lambda x: x if x > 0 else 0)
        df["loss"] = df["change"].apply(lambda x: -x if x < 0 else 0)
        window = 14
        df["avg_gain"] = df["gain"].rolling(window).mean()
        df["avg_loss"] = df["loss"].rolling(window).mean()
        df["RSI14"] = 100 - (100 / (1 + (df["avg_gain"] / df["avg_loss"])))

        # Volume Moving Averages
        df["VOL5"] = df["volume"].rolling(5).mean()
        df["VOL10"] = df["volume"].rolling(10).mean()

        return df[[
            "date", "open", "high", "low", "close", "volume",
            "MA5", "MA20", "MA60", "MA120",
            "Boll_Upper", "Boll_Mid", "Boll_Lower",
            "DIF", "DEA", "MACD", "RSI14",
            "VOL5", "VOL10",
        ]]

    def get_hist_data(self) -> pd.DataFrame:
        """Fetch historical data from yfinance."""
        try:
            ticker = yf.Ticker(self.symbol)
            hist = ticker.history(period=self.period, interval=self.interval)

            if hist.empty:
                logger.warning(f"No data returned for {self.symbol}")
                return pd.DataFrame()

            df = hist.reset_index()
            # Normalize column names
            df.columns = [c.lower().replace(' ', '_') for c in df.columns]

            # Ensure date is string
            if 'date' in df.columns:
                df['date'] = pd.to_datetime(df['date']).dt.strftime('%Y-%m-%d')
            elif df.index.name == 'Date':
                df['date'] = pd.to_datetime(df.index).strftime('%Y-%m-%d')

            # Ensure numeric types
            for col in ['open', 'high', 'low', 'close', 'volume']:
                if col in df.columns:
                    df[col] = pd.to_numeric(df[col], errors='coerce')

            # Drop rows with NaN close
            df = df.dropna(subset=['close'])

            logger.info(f"Fetched {len(df)} rows for {self.symbol}")
            return df

        except Exception as e:
            logger.error(f"Error fetching data for {self.symbol}: {e}")
            return pd.DataFrame()

    def get_data(self) -> pd.DataFrame:
        """Fetch data and calculate indicators."""
        df = self.get_hist_data()
        if df.empty:
            return df
        return self.calc_indicators(df)
