"""
Report Frames — Generates visual report overlay images from analysis text.
Renders Markdown to HTML, then captures as PNG using Pyppeteer.
"""

import os
import base64
from typing import List, Optional

import mistune
from loguru import logger

try:
    from pyppeteer import launch
    HAS_PYPPETEER = True
except ImportError:
    HAS_PYPPETEER = False

# ─── HTML Templates ──────────────────────────────────────────────────────────

ARABIC_TEMPLATE = """
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<style>
html, body {{
    margin: 0;
    padding: 0;
    width: {width}px;
    height: {height}px;
    font-family: 'Noto Sans SC', 'Noto Sans Arabic', sans-serif;
    overflow: hidden;
    position: relative;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
}}

body::before {{
    content: "";
    position: absolute;
    width: 100%;
    height: 100%;
    background: url('data:image/png;base64,{encoded_string}') no-repeat center center;
    background-size: cover;
    filter: opacity({bg_opacity});
    z-index: 0;
}}

.overlay {{
    position: relative;
    z-index: 1;
    width: 100%;
    height: 100%;
}}

.container {{
    width: 85%;
    margin: 50px auto;
    padding: 40px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 20px;
    box-shadow: 0 12px 48px rgba(0, 0, 0, 0.2);
    font-size: 26px;
    line-height: 1.6;
    color: #1e293b;
    direction: rtl;
    text-align: right;
}}

h1 {{
    font-size: 48px;
    color: #1e40af;
    text-align: center;
    margin-bottom: 20px;
    direction: rtl;
}}

strong {{
    color: #d97706;
    font-weight: bold;
}}

ul {{
    padding-right: 2em;
    padding-left: 0;
}}

li {{
    margin-bottom: 0.6em;
}}
</style>
</head>
<body>
<div class="overlay">
    <div class="container">{html_content}</div>
</div>
</body>
</html>
"""

ENGLISH_TEMPLATE = """
<!DOCTYPE html>
<html dir="ltr" lang="en">
<head>
<style>
html, body {{
    margin: 0;
    padding: 0;
    width: {width}px;
    height: {height}px;
    font-family: 'Inter', 'Tinos', sans-serif;
    overflow: hidden;
    position: relative;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
}}

body::before {{
    content: "";
    position: absolute;
    width: 100%;
    height: 100%;
    background: url('data:image/png;base64,{encoded_string}') no-repeat center center;
    background-size: cover;
    filter: opacity({bg_opacity});
    z-index: 0;
}}

.overlay {{
    position: relative;
    z-index: 1;
    width: 100%;
    height: 100%;
}}

.container {{
    width: 85%;
    margin: 50px auto;
    padding: 40px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 20px;
    box-shadow: 0 12px 48px rgba(0, 0, 0, 0.2);
    font-size: 26px;
    line-height: 1.6;
    color: #1e293b;
}}

h1 {{
    font-size: 48px;
    color: #1e40af;
    text-align: center;
    margin-bottom: 20px;
}}

strong {{
    color: #d97706;
    font-weight: bold;
}}

ul {{
    padding-left: 2em;
}}

li {{
    margin-bottom: 0.6em;
}}
</style>
</head>
<body>
<div class="overlay">
    <div class="container">{html_content}</div>
</div>
</body>
</html>
"""


async def generate_report_frames(
    md_text: str,
    title: str,
    background_image_path: Optional[str],
    output_dir: str,
    locale: str = "en",
    width: int = 1080,
    height: int = 1920,
    total_frames: int = 15,
) -> List[str]:
    """Generate report overlay frames as PNG images."""
    os.makedirs(output_dir, exist_ok=True)

    # Encode background image
    encoded_string = ""
    if background_image_path and os.path.exists(background_image_path):
        with open(background_image_path, "rb") as f:
            encoded_string = base64.b64encode(f.read()).decode("utf-8")

    # Convert markdown to HTML
    html_content = mistune.html(md_text)

    template = ARABIC_TEMPLATE if locale == "ar" else ENGLISH_TEMPLATE

    output_paths = []

    if HAS_PYPPETEER:
        browser = None
        try:
            browser = await launch(headless=True, args=["--no-sandbox", "--disable-setuid-sandbox"])
            page = await browser.newPage()
            await page.setViewport({"width": width, "height": height})

            for frame in range(total_frames + 1):
                output_path = os.path.join(output_dir, f"frame_{frame:03}.png")
                if os.path.exists(output_path):
                    output_paths.append(output_path)
                    continue

                progress = (frame / total_frames) ** 3
                opacity = round(1.0 - progress, 3)
                bg_opacity = round(progress, 3)

                html = template.format(
                    width=width,
                    height=height,
                    encoded_string=encoded_string,
                    html_content=html_content,
                    opacity=opacity,
                    bg_opacity=bg_opacity,
                )

                temp_html_path = os.path.join(output_dir, f"temp_frame_{frame:03}.html")
                with open(temp_html_path, "w", encoding="utf-8") as f:
                    f.write(html)

                await page.goto(f"file://{os.path.abspath(temp_html_path)}")
                await page.waitForSelector(".container")
                await page.screenshot({"path": output_path, "fullPage": True})

                os.remove(temp_html_path)
                output_paths.append(output_path)

        except Exception as e:
            logger.error(f"Report frame generation error: {e}")
        finally:
            if browser:
                try:
                    await browser.close()
                except Exception:
                    pass
    else:
        # Fallback: create simple frame images using PIL
        try:
            from PIL import Image, ImageDraw, ImageFont

            for frame in range(3):
                output_path = os.path.join(output_dir, f"frame_{frame:03}.png")
                if os.path.exists(output_path):
                    output_paths.append(output_path)
                    continue

                img = Image.new("RGB", (width, height), (15, 23, 42))
                draw = ImageDraw.Draw(img)

                # Draw title
                try:
                    font = ImageFont.truetype("/usr/share/fonts/truetype/english/Tinos-Regular.ttf", 48)
                except Exception:
                    font = ImageFont.load_default()

                # Center title text
                draw.text((width // 2, height // 3), title, fill="white",
                         font=font, anchor="mm")

                # Draw content preview
                try:
                    small_font = ImageFont.truetype("/usr/share/fonts/truetype/english/Tinos-Regular.ttf", 28)
                except Exception:
                    small_font = ImageFont.load_default()

                # Simple text wrapping
                lines = md_text.split('\n')[:8]
                y_pos = height // 2
                for line in lines:
                    if line.strip():
                        clean = line.replace('#', '').replace('**', '').replace('*', '').strip()
                        draw.text((width // 2, y_pos), clean[:60], fill="#94a3b8",
                                 font=small_font, anchor="mm")
                        y_pos += 50

                img.save(output_path)
                output_paths.append(output_path)

        except ImportError:
            logger.warning("PIL not available, creating minimal placeholder frames")
            for frame in range(3):
                output_path = os.path.join(output_dir, f"frame_{frame:03}.png")
                # Create a tiny 1x1 placeholder
                with open(output_path, 'wb') as f:
                    # Minimal PNG
                    f.write(base64.b64decode(
                        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                    ))
                output_paths.append(output_path)

    return output_paths
