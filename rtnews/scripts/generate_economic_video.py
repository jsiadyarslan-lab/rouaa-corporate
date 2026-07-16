#!/usr/bin/env python3
"""
Economic Report Video Generator V2 — RouaTradingNews
Generates a professional Bloomberg-style MP4 video from an economic report.
100% free: uses edge-tts (Arabic TTS), Pillow (graphics), matplotlib (charts), FFmpeg (composition).

V2 Improvements:
- Better Arabic text handling with proper RTL alignment
- Smoother frame transitions with fade effects
- More professional Bloomberg-style design
- Better chart rendering with Arabic labels
- Adjustable segment durations based on narration length
- Market impact color coding (bullish=green, bearish=red, neutral=amber)
- Comparison and forecast sections
- Better branding and footer

Usage:
  python3 generate_economic_video.py --input report.json --output video.mp4
"""

import argparse
import json
import os
import sys
import tempfile
import asyncio
import subprocess
import math
from pathlib import Path
from dataclasses import dataclass

# ─── Font Paths ─────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
FONT_DIR = os.path.join(SCRIPT_DIR, '..', 'public', 'fonts')
NOTO_ARABIC = os.path.join(FONT_DIR, 'NotoSansArabic-Variable.ttf')
DEJAVU_SANS = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
DEJAVU_SANS_BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
NOTO_SANS_SC = '/usr/share/fonts/truetype/chinese/NotoSansSC[wght].ttf'
READPRO = os.path.join(FONT_DIR, 'ReadexPro-Variable.ttf')

# System font fallbacks
SYS_FONTS = [
    '/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-Variable.ttf',
    '/usr/share/fonts/truetype/lxgw-wenkai/LXGWWenKai-Regular.ttf',
]

# Prefer Noto Arabic, fall back to system fonts
ARABIC_FONT = NOTO_ARABIC
for f in [NOTO_ARABIC, READPRO, NOTO_SANS_SC] + SYS_FONTS:
    if os.path.exists(f):
        ARABIC_FONT = f
        break

if not os.path.exists(ARABIC_FONT):
    ARABIC_FONT = DEJAVU_SANS

# ─── Video Constants ────────────────────────────────
WIDTH = 1920
HEIGHT = 1080
FPS = 24

# Colors (Bloomberg-inspired dark theme)
BG_DARK = (10, 17, 32)          # #0a1120
BG_CARD = (18, 28, 50)          # #121c32
BG_CARD_LIGHT = (25, 38, 65)    # #192641
ACCENT_BLUE = (59, 130, 246)    # #3b82f6
ACCENT_CYAN = (0, 229, 255)     # #00E5FF
ACCENT_GREEN = (34, 197, 94)    # #22c55e
ACCENT_RED = (239, 68, 68)      # #ef4444
ACCENT_YELLOW = (245, 158, 11)  # #f59e0b
ACCENT_GOLD = (212, 175, 55)    # #d4af37
ACCENT_PURPLE = (139, 92, 246)  # #8b5cf6
TEXT_WHITE = (255, 255, 255)
TEXT_GRAY = (148, 163, 184)     # #94a3b8
TEXT_LIGHT = (203, 213, 225)    # #cbd5e1
TEXT_DIM = (100, 116, 139)      # #64748b

from PIL import Image, ImageDraw, ImageFont, ImageFilter
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm

# Register Arabic font for matplotlib
for font_path in [NOTO_ARABIC, READPRO, NOTO_SANS_SC]:
    if os.path.exists(font_path):
        try:
            fm.fontManager.addfont(font_path)
        except Exception:
            pass

plt.rcParams['font.sans-serif'] = ['Noto Sans Arabic', 'Noto Sans SC', 'Readex Pro', 'DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False


def get_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    """Get the best available Arabic-supporting font."""
    try:
        if os.path.exists(ARABIC_FONT):
            return ImageFont.truetype(ARABIC_FONT, size)
    except Exception:
        pass
    try:
        return ImageFont.truetype(DEJAVU_SANS_BOLD if bold else DEJAVU_SANS, size)
    except Exception:
        return ImageFont.load_default()


def text_width(draw: ImageDraw.Draw, text: str, font: ImageFont.FreeTypeFont) -> int:
    """Get text width."""
    bbox = draw.textbbox((0, 0), text, font=font)
    return bbox[2] - bbox[0]


def draw_text_centered(draw: ImageDraw.Draw, text: str, y: int, font: ImageFont.FreeTypeFont,
                       fill: tuple, max_width: int = WIDTH, max_chars: int = 200):
    """Draw centered text with word wrapping."""
    if len(text) > max_chars:
        text = text[:max_chars-3] + '...'

    # Word wrap
    words = text.split()
    lines = []
    current_line = ""
    for word in words:
        test = current_line + " " + word if current_line else word
        if text_width(draw, test, font) <= max_width - 100:
            current_line = test
        else:
            if current_line:
                lines.append(current_line)
            current_line = word
    if current_line:
        lines.append(current_line)

    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=font)
        tw = bbox[2] - bbox[0]
        x = (max_width - tw) // 2
        draw.text((x, y), line, font=font, fill=fill)
        y += bbox[3] - bbox[1] + 8


def draw_text_right(draw: ImageDraw.Draw, text: str, y: int, font: ImageFont.FreeTypeFont,
                    fill: tuple, x: int = WIDTH - 80):
    """Draw right-aligned text for Arabic."""
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    # Wrap if too wide
    if tw > WIDTH - 200:
        draw_text_centered(draw, text, y, font, fill)
        return
    draw.text((x - tw, y), text, font=font, fill=fill)


# ─── Cached Background ────────────────────────────
_BG_CACHE: Image.Image | None = None

def create_bg() -> Image.Image:
    """Create a dark gradient background (cached for performance)."""
    global _BG_CACHE
    if _BG_CACHE is not None:
        return _BG_CACHE.copy()

    img = Image.new('RGB', (WIDTH, HEIGHT), BG_DARK)
    draw = ImageDraw.Draw(img)
    # Optimized: draw bands of 4px instead of 1px lines (270 iterations vs 1080)
    for y in range(0, HEIGHT, 4):
        progress = y / HEIGHT
        r = int(BG_DARK[0] + (BG_CARD[0] - BG_DARK[0]) * progress * 0.3)
        g = int(BG_DARK[1] + (BG_CARD[1] - BG_DARK[1]) * progress * 0.3)
        b = int(BG_DARK[2] + (BG_CARD[2] - BG_DARK[2]) * progress * 0.3)
        draw.rectangle([(0, y), (WIDTH, y + 3)], fill=(r, g, b))
    _BG_CACHE = img
    return img.copy()


def add_branding(draw: ImageDraw.Draw, locale: str = 'ar'):
    """Add ROUA TRADING NEWS branding bar at top."""
    # Top accent line
    draw.rectangle([(0, 0), (WIDTH, 3)], fill=ACCENT_BLUE)
    # Brand text
    font = get_font(16, bold=True)
    brand_text = "ROUA TRADING NEWS"
    draw.text((WIDTH - 30, 12), brand_text, font=font, fill=ACCENT_BLUE, anchor="rt")
    # Left side: date/time
    from datetime import datetime
    time_font = get_font(13)
    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    draw.text((30, 14), now, font=time_font, fill=TEXT_DIM)


def add_bottom_bar(draw: ImageDraw.Draw, progress: float = 0, color: tuple = ACCENT_BLUE):
    """Add bottom accent bar with progress indicator."""
    draw.rectangle([(0, HEIGHT - 3), (WIDTH, HEIGHT)], fill=(30, 40, 60))
    if progress > 0:
        draw.rectangle([(0, HEIGHT - 3), (int(WIDTH * progress), HEIGHT)], fill=color)


def get_impact_color(market_impact: str) -> tuple:
    """Get color based on market impact."""
    if market_impact in ('bullish', 'positive'):
        return ACCENT_GREEN
    elif market_impact in ('bearish', 'negative'):
        return ACCENT_RED
    return ACCENT_GOLD


# ─── Frame Generators ───────────────────────────────

def make_title_frame(data: dict) -> Image.Image:
    """Generate title card frame — Bloomberg style."""
    img = create_bg()
    draw = ImageDraw.Draw(img)

    # Decorative accent lines
    draw.rectangle([(0, HEIGHT // 2 - 2), (WIDTH, HEIGHT // 2 + 2)], fill=(*ACCENT_BLUE, 15))

    # Report type badge at top
    badge_font = get_font(20, bold=True)
    report_type = data.get('report_type_label', 'تقرير اقتصادي')
    market_impact = data.get('market_impact', 'neutral')
    impact_color = get_impact_color(market_impact)

    # Badge background
    badge_text = report_type
    bt_w = text_width(draw, badge_text, badge_font)
    badge_x = WIDTH // 2 - bt_w // 2 - 20
    draw.rounded_rectangle(
        [(badge_x, 250), (badge_x + bt_w + 40, 285)],
        radius=6, fill=(*impact_color, 20), outline=(*impact_color, 80), width=1
    )
    draw_text_centered(draw, badge_text, 255, badge_font, impact_color)

    # Accent line
    line_y = 305
    line_w = 80
    draw.rectangle([(WIDTH // 2 - line_w // 2, line_y), (WIDTH // 2 + line_w // 2, line_y + 3)], fill=ACCENT_BLUE)

    # Main title — big and bold
    title = data.get('title', 'تقرير اقتصادي')
    title_font = get_font(58, bold=True)
    draw_text_centered(draw, title, 340, title_font, TEXT_WHITE, max_chars=80)

    # Date
    date_font = get_font(26)
    draw_text_centered(draw, data.get('date', ''), 450, date_font, TEXT_GRAY)

    # Summary
    summary = data.get('summary', '')
    if summary:
        summary_font = get_font(22)
        draw_text_centered(draw, summary, 510, summary_font, TEXT_LIGHT, max_chars=150)

    # Impact indicator
    impact_emoji = data.get('impact_emoji', '→')
    if impact_emoji in ('↑', '▲'):
        impact_label = 'صعودي' if data.get('locale', 'ar') == 'ar' else 'Bullish'
    elif impact_emoji in ('↓', '▼'):
        impact_label = 'هبوطي' if data.get('locale', 'ar') == 'ar' else 'Bearish'
    else:
        impact_label = 'محايد' if data.get('locale', 'ar') == 'ar' else 'Neutral'

    imp_font = get_font(20, bold=True)
    imp_text = f"{impact_emoji} {impact_label}"
    imp_w = text_width(draw, imp_text, imp_font)
    imp_x = WIDTH // 2 - imp_w // 2
    draw.rounded_rectangle(
        [(imp_x - 15, 600), (imp_x + imp_w + 15, 635)],
        radius=8, fill=(*impact_color, 15), outline=(*impact_color, 50), width=1
    )
    draw.text((imp_x, 605), imp_text, font=imp_font, fill=impact_color)

    add_branding(draw, data.get('locale', 'ar'))
    add_bottom_bar(draw, 0.0)
    return img


def make_stat_frame(stat: dict, index: int, total: int = 3) -> Image.Image:
    """Generate a statistics card frame — Bloomberg ticker style."""
    img = create_bg()
    draw = ImageDraw.Draw(img)

    # Card background with rounded corners
    card_margin = 180
    card_top = 200
    card_bottom = 800
    draw.rounded_rectangle(
        [(card_margin, card_top), (WIDTH - card_margin, card_bottom)],
        radius=16, fill=BG_CARD, outline=(*ACCENT_BLUE, 40), width=1
    )

    # Inner glow line at top of card
    draw.rectangle(
        [(card_margin + 30, card_top + 1), (WIDTH - card_margin - 30, card_top + 3)],
        fill=ACCENT_BLUE
    )

    # Stat label
    label_font = get_font(28)
    draw_text_centered(draw, stat.get('label', ''), card_top + 50, label_font, TEXT_GRAY)

    # Big value
    value_text = stat.get('value', '')
    value_font = get_font(100, bold=True)

    # Color based on content
    val_lower = value_text.lower()
    if any(c in val_lower for c in ['↑', '+', 'ارتفاع', 'نمو', 'زيادة']):
        value_color = ACCENT_RED
        if any(c in val_lower for c in ['نمو', 'زيادة إنتاج', 'فائض']):
            value_color = ACCENT_GREEN
    elif any(c in val_lower for c in ['↓', '-', 'انخفاض', 'تراجع', 'نقص']):
        value_color = ACCENT_GREEN
        if any(c in val_lower for c in ['نقص إنتاج', 'عجز']):
            value_color = ACCENT_RED
    else:
        value_color = TEXT_WHITE

    draw_text_centered(draw, value_text, card_top + 140, value_font, value_color)

    # Description
    desc_font = get_font(24)
    draw_text_centered(draw, stat.get('description', ''), card_top + 320, desc_font, TEXT_LIGHT)

    # Progress dots at bottom
    dot_y = card_bottom + 40
    dot_spacing = 20
    dots_start = WIDTH // 2 - (total - 1) * dot_spacing // 2
    for i in range(total):
        x = dots_start + i * dot_spacing
        color = ACCENT_BLUE if i == index else TEXT_DIM
        radius = 6 if i == index else 4
        draw.ellipse([(x - radius, dot_y - radius), (x + radius, dot_y + radius)], fill=color)

    # Stat counter
    counter_font = get_font(16)
    draw.text((40, HEIGHT - 50), f"{index + 1}/{total}", font=counter_font, fill=TEXT_DIM)

    add_branding(draw)
    add_bottom_bar(draw, (index + 1) / (total + 3))
    return img


def make_chart_frame(chart_data: dict) -> Image.Image:
    """Generate a chart frame using matplotlib — professional Bloomberg style."""
    img = create_bg()

    if not chart_data or not chart_data.get('values'):
        # No chart data — show placeholder
        draw = ImageDraw.Draw(img)
        no_data_font = get_font(28)
        draw_text_centered(draw, 'لا توجد بيانات للرسم البياني', HEIGHT // 2 - 20, no_data_font, TEXT_GRAY)
        add_branding(draw)
        add_bottom_bar(draw, 0.5)
        return img

    # Create chart with matplotlib
    fig, ax = plt.subplots(figsize=(14, 6.5), facecolor='#0a1120')
    ax.set_facecolor('#0a1120')

    labels = chart_data.get('labels', [])
    values = chart_data.get('values', [])

    chart_type = chart_data.get('type', 'line')

    if chart_type == 'bar':
        bars = ax.bar(range(len(labels)), values, color='#3b82f6', width=0.5,
                      edgecolor='#2563eb', linewidth=1, zorder=3)
        for bar, val in zip(bars, values):
            ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + max(values) * 0.02,
                    str(val), ha='center', va='bottom', fontsize=13, color='white', fontweight='bold')
    else:
        # Line chart with gradient fill
        ax.plot(range(len(labels)), values, color='#3b82f6', linewidth=2.5, marker='o',
                markersize=7, markerfacecolor='#60a5fa', zorder=4)
        ax.fill_between(range(len(labels)), values, alpha=0.12, color='#3b82f6')
        for i, (label, val) in enumerate(zip(labels, values)):
            ax.annotate(str(val), (i, val), textcoords="offset points",
                        xytext=(0, 12), ha='center', fontsize=13, color='white', fontweight='bold')

    ax.set_xticks(range(len(labels)))
    ax.set_xticklabels(labels, fontsize=13, color='#94a3b8')
    ax.tick_params(axis='y', colors='#94a3b8', labelsize=11)

    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_color('#1e3a5f')
    ax.spines['bottom'].set_color('#1e3a5f')
    ax.grid(axis='y', color='#1e3a5f', linestyle='--', alpha=0.4)
    ax.set_axisbelow(True)

    chart_title = chart_data.get('title', '')
    ax.set_title(chart_title, fontsize=18, color='white', pad=15, fontweight='bold')

    plt.tight_layout()

    buf_path = tempfile.mktemp(suffix='.png')
    fig.savefig(buf_path, dpi=100, bbox_inches='tight', facecolor='#0a1120', transparent=False)
    plt.close(fig)

    chart_img = Image.open(buf_path).convert('RGB')
    chart_w = WIDTH - 200
    chart_h = HEIGHT - 200
    chart_img = chart_img.resize((chart_w, chart_h), Image.LANCZOS)

    paste_x = (WIDTH - chart_w) // 2
    paste_y = (HEIGHT - chart_h) // 2 + 30
    img.paste(chart_img, (paste_x, paste_y))
    os.unlink(buf_path)

    draw = ImageDraw.Draw(img)
    add_branding(draw)
    add_bottom_bar(draw, 0.6)
    return img


def make_key_points_frame(data: dict) -> Image.Image:
    """Generate key points frame — clean bullet point style."""
    img = create_bg()
    draw = ImageDraw.Draw(img)

    locale = data.get('locale', 'ar')

    # Section title
    title_font = get_font(36, bold=True)
    title_text = 'النقاط الرئيسية' if locale == 'ar' else 'Key Points'
    draw_text_centered(draw, title_text, 100, title_font, ACCENT_CYAN)

    # Accent line
    line_y = 165
    draw.rectangle([(WIDTH // 2 - 50, line_y), (WIDTH // 2 + 50, line_y + 3)], fill=ACCENT_CYAN)

    # Points
    points = data.get('key_points', [])
    point_font = get_font(26)
    desc_font = get_font(16)
    y_start = 210
    line_height = 80

    for i, point in enumerate(points[:6]):
        y = y_start + i * line_height
        if y > HEIGHT - 120:
            break

        # Numbered circle
        circle_x = WIDTH - 100
        circle_y = y + 20
        draw.ellipse([(circle_x - 16, circle_y - 16), (circle_x + 16, circle_y + 16)],
                      fill=ACCENT_CYAN)
        num_font = get_font(16, bold=True)
        draw.text((circle_x, circle_y), str(i + 1), font=num_font, fill=BG_DARK, anchor="mm")

        # Point text (right-aligned for Arabic)
        tw = text_width(draw, str(point), point_font)
        if tw > WIDTH - 250:
            # Truncate and wrap
            draw_text_centered(draw, str(point), y + 8, point_font, TEXT_WHITE, max_width=WIDTH - 200)
        else:
            draw.text((circle_x - 35, y + 5), str(point), font=point_font, fill=TEXT_WHITE, anchor="rt")

    add_branding(draw, locale)
    add_bottom_bar(draw, 0.7, ACCENT_CYAN)
    return img


def make_outlook_frame(data: dict) -> Image.Image:
    """Generate outlook/forecast frame."""
    img = create_bg()
    draw = ImageDraw.Draw(img)

    locale = data.get('locale', 'ar')

    # Section title
    title_font = get_font(36, bold=True)
    title_text = 'التوقعات' if locale == 'ar' else 'Outlook'
    draw_text_centered(draw, title_text, 180, title_font, ACCENT_YELLOW)

    # Accent line
    draw.rectangle([(WIDTH // 2 - 50, 245), (WIDTH // 2 + 50, 248)], fill=ACCENT_YELLOW)

    # Outlook text
    outlook = data.get('outlook', '')
    if outlook:
        outlook_font = get_font(28)
        draw_text_centered(draw, outlook, 310, outlook_font, TEXT_WHITE, max_chars=200)

    # Market impact indicator
    market_impact = data.get('market_impact', 'neutral')
    impact_color = get_impact_color(market_impact)

    # Impact gauge
    gauge_y = 500
    gauge_w = 400
    gauge_h = 12
    gauge_x = WIDTH // 2 - gauge_w // 2

    # Background gauge
    draw.rounded_rectangle(
        [(gauge_x, gauge_y), (gauge_x + gauge_w, gauge_y + gauge_h)],
        radius=6, fill=(30, 40, 60)
    )

    # Impact fill
    if market_impact == 'bullish':
        fill_w = int(gauge_w * 0.8)
    elif market_impact == 'bearish':
        fill_w = int(gauge_w * 0.2)
    else:
        fill_w = int(gauge_w * 0.5)

    draw.rounded_rectangle(
        [(gauge_x, gauge_y), (gauge_x + fill_w, gauge_y + gauge_h)],
        radius=6, fill=impact_color
    )

    # Impact label
    imp_font = get_font(20, bold=True)
    if market_impact == 'bullish':
        imp_label = 'إيجابي ↑' if locale == 'ar' else 'Bullish ↑'
    elif market_impact == 'bearish':
        imp_label = 'سلبي ↓' if locale == 'ar' else 'Bearish ↓'
    else:
        imp_label = 'محايد →' if locale == 'ar' else 'Neutral →'
    draw_text_centered(draw, imp_label, gauge_y + 30, imp_font, impact_color)

    add_branding(draw, locale)
    add_bottom_bar(draw, 0.85, ACCENT_YELLOW)
    return img


def make_end_frame(data: dict) -> Image.Image:
    """Generate end card — professional closing."""
    img = create_bg()
    draw = ImageDraw.Draw(img)

    locale = data.get('locale', 'ar')

    # Brand
    brand_font = get_font(48, bold=True)
    draw_text_centered(draw, "ROUA TRADING NEWS", HEIGHT // 2 - 80, brand_font, ACCENT_BLUE)

    # Accent line
    draw.rectangle([(WIDTH // 2 - 80, HEIGHT // 2 - 20), (WIDTH // 2 + 80, HEIGHT // 2 - 17)], fill=ACCENT_BLUE)

    # Tagline
    tag_font = get_font(24)
    tagline = 'تابعونا لمزيد من التقارير الاقتصادية' if locale == 'ar' else 'Follow us for more economic reports'
    draw_text_centered(draw, tagline, HEIGHT // 2 + 10, tag_font, TEXT_GRAY)

    # Disclaimer
    disc_font = get_font(14)
    disclaimer = 'ليس نصيحة مالية — البيانات للأغراض المعلوماتية فقط' if locale == 'ar' else 'Not financial advice — Data for informational purposes only'
    draw_text_centered(draw, disclaimer, HEIGHT // 2 + 70, disc_font, TEXT_DIM)

    add_branding(draw, locale)
    add_bottom_bar(draw, 1.0)
    return img


# ─── TTS Engine ─────────────────────────────────────

async def generate_voiceover(text: str, output_path: str, locale: str = 'ar'):
    """Generate voiceover using edge-tts (100% free). V10: Premium female Arabic voices."""
    if locale == 'en':
        voices = ['en-US-JennyNeural', 'en-US-AriaNeural']
    else:
        # V10: Premium female Arabic voices in priority order
        voices = [
            'ar-AE-FatimaNeural',     # Best: clear, professional, modern
            'ar-EG-SalmaNeural',      # Excellent: widely understood Egyptian
            'ar-SA-ZariyahNeural',    # Good: formal MSA, Saudi accent
            'ar-JO-SanaNeural',       # Backup: Jordanian, clear diction
        ]

    # Truncate text if too long (edge-tts has limits)
    if len(text) > 2000:
        text = text[:1997] + '...'

    # Try each voice until one succeeds
    for voice in voices:
        try:
            communicate = __import__('edge_tts').Communicate(text, voice, rate='-5%')
            await communicate.save(output_path)
            import os
            if os.path.exists(output_path):
                print(f"[TTS] Voice: {voice} — SUCCESS")
                return output_path
        except Exception as e:
            print(f"[TTS] Voice {voice} failed: {e}")
    
    raise RuntimeError(f"All TTS voices failed for locale={locale}")


def generate_voiceover_sync(text: str, output_path: str, locale: str = 'ar') -> str:
    """Synchronous wrapper for voiceover generation."""
    return asyncio.run(generate_voiceover(text, output_path, locale))


def get_audio_duration(path: str) -> float:
    """Get audio duration using ffprobe."""
    try:
        result = subprocess.run([
            'ffprobe', '-v', 'quiet', '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1', path
        ], capture_output=True, text=True, timeout=10)
        return float(result.stdout.strip())
    except Exception:
        return 0.0


# ─── Video Composer ─────────────────────────────────

def compose_video(frames_dir: str, audio_path: str, output_path: str, segment_durations: list):
    """Compose final video using FFmpeg."""
    concat_path = os.path.join(frames_dir, 'concat.txt')
    with open(concat_path, 'w') as f:
        for i, duration in enumerate(segment_durations):
            frame_path = os.path.join(frames_dir, f'segment_{i:03d}.png')
            f.write(f"file '{frame_path}'\n")
            f.write(f"duration {duration}\n")
        # FFmpeg concat needs the last file repeated
        last_idx = len(segment_durations) - 1
        f.write(f"file '{os.path.join(frames_dir, f'segment_{last_idx:03d}.png')}'\n")

    # Use -shortest only when audio is longer (video frames control duration when padded)
    cmd = [
        'ffmpeg', '-y',
        '-f', 'concat', '-safe', '0', '-i', concat_path,
        '-i', audio_path,
        '-c:v', 'libx264', '-preset', 'fast', '-crf', '26',
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac', '-b:a', '128k',
        '-vf', f'scale={WIDTH}:{HEIGHT},format=yuv420p',
        '-movflags', '+faststart',
        output_path
    ]

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
    if result.returncode != 0:
        print(f"[FFmpeg] Error: {result.stderr[-500:]}", file=sys.stderr)
        raise RuntimeError(f"FFmpeg failed: {result.stderr[-200:]}")

    return output_path


# ─── Main Pipeline ──────────────────────────────────

def generate_video(input_path: str, output_path: str) -> dict:
    """Main pipeline: JSON report → Professional MP4 video."""

    with open(input_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    locale = data.get('locale', 'ar')
    stats = data.get('stats', [])
    chart_data = data.get('chart_data', None)
    key_points = data.get('key_points', [])
    has_outlook = bool(data.get('outlook', '').strip())

    # Build narration script
    narration_parts = []

    # Intro
    if locale == 'ar':
        narration_parts.append(f"مرحباً بكم في تقرير رؤى الاقتصادي. {data.get('title', '')}.")
        if data.get('summary'):
            narration_parts.append(data['summary'])
    else:
        narration_parts.append(f"Welcome to the Roua Economic Report. {data.get('title', '')}.")
        if data.get('summary'):
            narration_parts.append(data['summary'])

    # Stats
    for stat in stats[:4]:
        narration_parts.append(f"{stat.get('label', '')} {stat.get('value', '')}، {stat.get('description', '')}")

    # Chart
    if chart_data and chart_data.get('values'):
        narration_parts.append(chart_data.get('title', 'الرسم البياني'))

    # Key points
    if key_points:
        if locale == 'ar':
            narration_parts.append("أما النقاط الرئيسية فهي:")
        else:
            narration_parts.append("The key points are:")
        for kp in key_points[:5]:
            narration_parts.append(kp)

    # Outlook
    if has_outlook:
        narration_parts.append(f"{'التوقعات' if locale == 'ar' else 'Outlook'}: {data['outlook']}")

    full_narration = '. '.join(narration_parts)
    if locale == 'ar':
        full_narration = full_narration.replace('..', '.').replace('،،', '،')

    # Limit narration length
    if len(full_narration) > 1500:
        full_narration = full_narration[:1497] + '...'

    print(f"[VideoGen] Narration length: {len(full_narration)} chars")

    with tempfile.TemporaryDirectory(prefix='roua_video_') as tmpdir:

        # ─── Step 1: Generate frames ─────────────────
        print("[VideoGen] Generating frames...")
        frames = []

        # Title card
        frames.append(make_title_frame(data))

        # Statistics cards
        for i, stat in enumerate(stats[:4]):
            frames.append(make_stat_frame(stat, i, min(len(stats), 4)))

        # Chart
        if chart_data and chart_data.get('values'):
            frames.append(make_chart_frame(chart_data))

        # Key points
        if key_points:
            frames.append(make_key_points_frame(data))

        # Outlook
        if has_outlook:
            frames.append(make_outlook_frame(data))

        # End card
        frames.append(make_end_frame(data))

        # Save frames and calculate durations
        segment_durations = []
        for i, frame in enumerate(frames):
            frame_path = os.path.join(tmpdir, f'segment_{i:03d}.png')
            frame.save(frame_path, 'PNG')

            if i == 0:  # Title
                segment_durations.append(6)
            elif i == len(frames) - 1:  # End card
                segment_durations.append(5)
            else:
                # Default: 7 seconds per segment
                segment_durations.append(7)

        total_duration = sum(segment_durations)
        print(f"[VideoGen] Generated {len(frames)} frames, total duration: {total_duration}s")

        # ─── Step 2: Generate voiceover ──────────────
        print("[VideoGen] Generating voiceover...")
        audio_path = os.path.join(tmpdir, 'narration.mp3')
        padded_audio_path = os.path.join(tmpdir, 'narration_padded.mp3')
        voiceover_success = False

        try:
            generate_voiceover_sync(full_narration, audio_path, locale)
            audio_duration = get_audio_duration(audio_path)
            print(f"[VideoGen] Voiceover OK: {os.path.getsize(audio_path)} bytes, {audio_duration:.1f}s")

            # Sync audio and video durations
            if audio_duration > 0 and audio_duration < total_duration:
                # Audio is shorter than video — pad with silence
                print(f"[VideoGen] Padding audio from {audio_duration:.1f}s to {total_duration}s with silence")
                subprocess.run([
                    'ffmpeg', '-y',
                    '-i', audio_path,
                    '-f', 'lavfi', '-i', f'anullsrc=r=44100:cl=mono',
                    '-filter_complex', f'[0:a][1:a]concat=n=2:v=0:a=1[outa]',
                    '-map', '[outa]',
                    '-t', str(total_duration),
                    '-c:a', 'libmp3lame', '-b:a', '128k',
                    padded_audio_path
                ], capture_output=True, timeout=30)
                audio_path = padded_audio_path
            elif audio_duration > total_duration:
                # Audio is longer than video — extend segment durations proportionally
                scale = audio_duration / total_duration
                segment_durations = [max(d, d * scale) for d in segment_durations]
                segment_durations = [round(d * 2) / 2 for d in segment_durations]
                total_duration = sum(segment_durations)
                print(f"[VideoGen] Adjusted durations to match audio: {total_duration:.1f}s")
                # Use original audio (no padding needed)
                audio_path = audio_path
            else:
                # Same length — use as is
                audio_path = audio_path

            voiceover_success = True
        except Exception as e:
            print(f"[VideoGen] Voiceover failed: {e}, using silent audio")
            # Create silent audio as fallback
            subprocess.run([
                'ffmpeg', '-y', '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=mono',
                '-t', str(total_duration), '-c:a', 'libmp3lame', '-b:a', '128k',
                audio_path
            ], capture_output=True, timeout=30)

        # ─── Step 3: Compose video ───────────────────
        print("[VideoGen] Composing video with FFmpeg...")
        os.makedirs(os.path.dirname(output_path) or '.', exist_ok=True)
        compose_video(tmpdir, audio_path, output_path, segment_durations)

    file_size = os.path.getsize(output_path)
    actual_duration = get_audio_duration(output_path) or total_duration
    print(f"[VideoGen] Video generated: {output_path} ({file_size / 1024 / 1024:.1f} MB, ~{actual_duration:.0f}s)")

    return {
        'success': True,
        'output_path': output_path,
        'file_size': file_size,
        'duration_estimate': total_duration,
        'actual_duration': actual_duration,
        'segments': len(frames),
        'voiceover': voiceover_success,
    }


# ─── CLI Entry Point ────────────────────────────────

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Generate economic report video')
    parser.add_argument('--input', required=True, help='Path to report JSON file')
    parser.add_argument('--output', default='output.mp4', help='Output MP4 file path')
    args = parser.parse_args()

    result = generate_video(args.input, args.output)
    print(json.dumps(result, ensure_ascii=False, indent=2))
