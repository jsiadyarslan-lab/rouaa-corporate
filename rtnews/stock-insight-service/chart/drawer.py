"""
Chart Drawer — Generates K-line chart images using PyEcharts + Pyppeteer.
Supports two modes: bg (global background) and windows (sliding window).
"""

import os
import asyncio
from typing import List, Optional, Tuple
from abc import ABC, abstractmethod

import pandas as pd
from pyecharts import options as opts
from pyecharts.charts import Bar, Grid, Kline, Line
from loguru import logger

# Try to import pyppeteer for snapshot; fallback to static rendering
try:
    from pyppeteer import launch
    HAS_PYPPETEER = True
except ImportError:
    HAS_PYPPETEER = False
    logger.warning("Pyppeteer not available, using static chart rendering")


class ChartDrawer:
    """Main chart drawer that delegates to bg or windows mode."""

    def __init__(self, stock_name: str, width: int = 1080, height: int = 1920,
                 chart_mode: str = "bg"):
        self.stock_name = stock_name
        self.width = width
        self.height = height
        self.chart_mode = chart_mode

    async def draw_kline(self, df: pd.DataFrame, output_dir: str) -> List[str]:
        """Draw K-line chart and return list of image file paths."""
        if df.empty:
            logger.warning("Empty DataFrame, cannot draw charts")
            return []

        os.makedirs(output_dir, exist_ok=True)

        if self.chart_mode == "windows":
            return await self._draw_windows_mode(df, output_dir)
        else:
            return await self._draw_bg_mode(df, output_dir)

    def _create_chart(self, df: pd.DataFrame, end_idx: int = None,
                      start_idx: int = 0, show_all_bg: bool = False) -> Grid:
        """Create a single K-line chart with Bollinger Bands and Volume."""
        if end_idx is None:
            end_idx = len(df)

        dates = df["date"].iloc[start_idx:end_idx].tolist()
        kline_data = df[["open", "close", "low", "high"]].iloc[start_idx:end_idx]
        volume_data = df[["volume"]].iloc[start_idx:end_idx]

        # Prepare Bollinger data
        bb_lower = df["Boll_Lower"].iloc[start_idx:end_idx].tolist()
        bb_mid = df["Boll_Mid"].iloc[start_idx:end_idx].tolist()
        bb_upper = df["Boll_Upper"].iloc[start_idx:end_idx].tolist()

        # Determine rise/fall colors
        rise = df[["open", "close"]].iloc[start_idx:end_idx].apply(
            lambda x: 1 if x.iloc[0] < x.iloc[1] else -1, axis=1
        ).tolist()

        # Bollinger Band line
        bb_line = (
            Line()
            .add_xaxis(dates)
            .add_yaxis(
                series_name="Boll Lower",
                y_axis=bb_lower,
                is_smooth=True,
                is_symbol_show=False,
                linestyle_opts=opts.LineStyleOpts(opacity=0),
                stack="Boll",
                symbol=None,
            )
            .add_yaxis(
                series_name="Boll Upper",
                y_axis=bb_upper,
                is_smooth=True,
                is_symbol_show=False,
                linestyle_opts=opts.LineStyleOpts(opacity=0),
                areastyle_opts=opts.AreaStyleOpts(color="#ccc", opacity=0.2),
                stack="Boll",
                symbol=None,
            )
            .add_yaxis(
                series_name="Boll Mid",
                y_axis=bb_mid,
                is_smooth=True,
                is_symbol_show=False,
                linestyle_opts=opts.LineStyleOpts(opacity=0.3),
                itemstyle_opts=opts.ItemStyleOpts(color="#999"),
            )
            .set_global_opts(
                xaxis_opts=opts.AxisOpts(is_scale=True),
                yaxis_opts=opts.AxisOpts(
                    is_scale=True,
                    splitarea_opts=opts.SplitAreaOpts(
                        is_show=True,
                        areastyle_opts=opts.AreaStyleOpts(opacity=1)
                    ),
                ),
                title_opts=opts.TitleOpts(
                    title=f"{self.stock_name} Boll & Kline",
                    subtitle=f"{dates[0]} ~ {dates[-1]}" if len(dates) > 1 else "",
                    pos_top="1%",
                    pos_left="center",
                ),
                tooltip_opts=opts.TooltipOpts(trigger="axis", axis_pointer_type="cross"),
                legend_opts=opts.LegendOpts(is_show=False),
            )
        )

        # K-line
        kline = (
            Kline()
            .add_xaxis(dates)
            .add_yaxis(
                series_name="",
                y_axis=kline_data.values.tolist(),
                itemstyle_opts=opts.ItemStyleOpts(
                    color="#ef232a",
                    color0="#14b143",
                    border_color="#ef232a",
                    border_color0="#14b143",
                ),
            )
            .set_global_opts(
                xaxis_opts=opts.AxisOpts(grid_index=0),
                yaxis_opts=opts.AxisOpts(grid_index=0),
                legend_opts=opts.LegendOpts(is_show=False),
            )
        )

        overlap = bb_line.overlap(kline)

        # Volume bar
        vol_list = [[i, v, r] for i, (v, r) in enumerate(zip(
            volume_data["volume"].tolist(), rise
        ))]

        bar = (
            Bar()
            .add_xaxis(dates)
            .add_yaxis(
                series_name="volume",
                y_axis=vol_list,
                xaxis_index=1,
                yaxis_index=1,
                label_opts=opts.LabelOpts(is_show=False),
                bar_width="60%",
            )
            .set_global_opts(
                xaxis_opts=opts.AxisOpts(
                    type_="category",
                    is_scale=True,
                    grid_index=1,
                    boundary_gap=True,
                    axislabel_opts=opts.LabelOpts(is_show=False),
                    min_="dataMin",
                    max_="dataMax",
                ),
                yaxis_opts=opts.AxisOpts(
                    grid_index=1,
                    is_scale=True,
                    split_number=2,
                    axislabel_opts=opts.LabelOpts(is_show=False),
                    axisline_opts=opts.AxisLineOpts(is_show=False),
                    axistick_opts=opts.AxisTickOpts(is_show=False),
                    splitline_opts=opts.SplitLineOpts(is_show=False),
                ),
                legend_opts=opts.LegendOpts(is_show=False),
                visualmap_opts=opts.VisualMapOpts(
                    is_show=False,
                    dimension=2,
                    series_index=0,
                    is_piecewise=True,
                    pieces=[
                        {"value": 1, "color": "#ef232a"},
                        {"value": -1, "color": "#14b143"},
                    ],
                ),
            )
        )

        grid = Grid(
            init_opts=opts.InitOpts(
                animation_opts=opts.AnimationOpts(animation=False),
                width=f"{self.width // 2}px",
                height=f"{self.height // 2}px",
                bg_color="#fff",
            )
        )
        grid.add(
            overlap,
            grid_opts=opts.GridOpts(pos_left="10%", pos_top="8%", pos_right="8%", height="50%"),
        )
        grid.add(
            bar,
            grid_opts=opts.GridOpts(pos_left="10%", pos_top="60%", pos_right="8%", height="16%"),
        )

        return grid

    async def _draw_bg_mode(self, df: pd.DataFrame, output_dir: str) -> List[str]:
        """Global background mode — show all data, progressively add candlesticks."""
        image_files = []
        total = len(df)
        # Generate keyframes (not every single day to keep count manageable)
        step = max(1, total // 30)  # ~30 frames
        indices = list(range(step, total + 1, step))
        if indices[-1] != total:
            indices.append(total)

        browser = None
        if HAS_PYPPETEER:
            try:
                browser = await launch(headless=True, args=["--no-sandbox", "--disable-setuid-sandbox"])
            except Exception as e:
                logger.warning(f"Failed to launch browser: {e}, using static rendering")

        for i, end_idx in enumerate(indices):
            image_path = os.path.join(output_dir, f"kline_{i:04d}.png")
            if os.path.exists(image_path):
                image_files.append(image_path)
                continue

            try:
                grid = self._create_chart(df, end_idx=end_idx)

                if browser:
                    html_path = os.path.join(output_dir, f"render_{i:04d}.html")
                    grid.render(html_path)
                    page = await browser.newPage()
                    await page.setViewport({"width": self.width // 2, "height": self.height // 2})
                    await page.goto(f"file://{os.path.abspath(html_path)}")
                    await page.screenshot({"path": image_path})
                    await page.close()
                    if os.path.exists(html_path):
                        os.remove(html_path)
                else:
                    # Static rendering fallback — use PIL to draw a simple chart
                    self._draw_pil_fallback(df, end_idx, image_path)
                    if not os.path.exists(image_path):
                        logger.warning(f"Skipping chart frame {i} - PIL fallback failed")
                        continue

                image_files.append(image_path)

            except Exception as e:
                logger.error(f"Error drawing chart frame {i}: {e}")
                continue

        if browser:
            try:
                await browser.close()
            except Exception:
                pass

        image_files.sort()
        return image_files

    async def _draw_windows_mode(self, df: pd.DataFrame, output_dir: str) -> List[str]:
        """Sliding window mode — focus on local detail."""
        image_files = []
        total = len(df)
        window_size = min(100, total)
        step = 3

        browser = None
        if HAS_PYPPETEER:
            try:
                browser = await launch(headless=True, args=["--no-sandbox", "--disable-setuid-sandbox"])
            except Exception as e:
                logger.warning(f"Failed to launch browser: {e}")

        idx = 0
        for start in range(0, total - window_size + 1, step):
            end = start + window_size
            image_path = os.path.join(output_dir, f"kline_{idx:04d}.png")

            if not os.path.exists(image_path):
                try:
                    grid = self._create_chart(df, start_idx=start, end_idx=end)

                    if browser:
                        html_path = os.path.join(output_dir, f"render_{idx:04d}.html")
                        grid.render(html_path)
                        page = await browser.newPage()
                        await page.setViewport({"width": self.width // 2, "height": self.height // 2})
                        await page.goto(f"file://{os.path.abspath(html_path)}")
                        await page.screenshot({"path": image_path})
                        await page.close()
                        if os.path.exists(html_path):
                            os.remove(html_path)

                except Exception as e:
                    logger.error(f"Error drawing window frame {idx}: {e}")
                    idx += 1
                    continue

            if not os.path.exists(image_path):
                # Try PIL fallback
                self._draw_pil_fallback(df, end, image_path)
                if not os.path.exists(image_path):
                    idx += 1
                    continue

            image_files.append(image_path)
            idx += 1

        if browser:
            try:
                await browser.close()
            except Exception:
                pass

        image_files.sort()
        return image_files
