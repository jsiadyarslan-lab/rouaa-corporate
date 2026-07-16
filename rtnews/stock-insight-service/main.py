"""
Stock Insight Video Service — FastAPI Microservice for RouaTradingNews
Converts financial data into professional analysis videos with charts, TTS, and subtitles.
"""

import os
import uuid
import json
import shutil
import asyncio
from typing import Optional, List
from datetime import datetime, timedelta

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from loguru import logger

# Configure logger
logger.add("service.log", rotation="10 MB", level="INFO")

app = FastAPI(
    title="Stock Insight Video Service",
    description="Generates financial analysis videos for RouaTradingNews platform",
    version="1.0.0",
)

# CORS — allow requests from RouaTradingNews
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Output directory ────────────────────────────────────────────────────────
OUTPUT_DIR = os.environ.get("OUTPUT_DIR", "/tmp/stock-videos")
os.makedirs(OUTPUT_DIR, exist_ok=True)


# ─── Request / Response Models ───────────────────────────────────────────────

class VideoRequest(BaseModel):
    symbol: str                           # e.g. "AAPL", "BTC-USD", "EURUSD=X"
    name: str                             # e.g. "Apple Inc.", "Bitcoin"
    locale: str = "en"                    # "ar" | "en"
    title: Optional[str] = None           # Custom title override
    analysis_text: Optional[str] = None   # Pre-generated analysis from Roua AI
    period: str = "1y"                    # yfinance period: 1mo,3mo,6mo,1y,2y,5y
    chart_mode: str = "bg"                # "bg" (global background) | "windows" (sliding)
    interval: str = "1d"                  # yfinance interval: 1d,1wk,1mo
    fps: int = 24
    width: int = 1080
    height: int = 1920
    callback_url: Optional[str] = None    # URL to notify when video is ready


class VideoResponse(BaseModel):
    job_id: str
    status: str                           # pending | processing | completed | failed
    video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    duration: Optional[float] = None
    error: Optional[str] = None


class VideoStatusResponse(BaseModel):
    job_id: str
    status: str
    video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    duration: Optional[float] = None
    error: Optional[str] = None
    progress: Optional[str] = None


# ─── Job Store (in-memory, replace with Redis/DB for production) ─────────────
jobs: dict[str, VideoStatusResponse] = {}


# ─── Core Pipeline Imports (lazy to avoid startup crash if deps missing) ─────

def get_fetcher():
    from fetcher.yfinance_fetcher import YFinanceDataFetcher
    return YFinanceDataFetcher

def get_chart_drawer():
    from chart.drawer import ChartDrawer
    return ChartDrawer

def get_tts_engine():
    from tts.engine import TTSEngine
    return TTSEngine

def get_video_composer():
    from video.composer import VideoComposer
    return VideoComposer


# ─── Background Video Generation ─────────────────────────────────────────────

async def generate_video_pipeline(req: VideoRequest, job_id: str):
    """Full pipeline: data → indicators → chart → TTS → video."""
    job = jobs[job_id]
    output_dir = os.path.join(OUTPUT_DIR, job_id)
    os.makedirs(output_dir, exist_ok=True)

    try:
        job.status = "processing"
        job.progress = "Fetching market data..."

        # 1. Fetch data
        Fetcher = get_fetcher()
        fetcher = Fetcher(
            name=req.name,
            symbol=req.symbol,
            period=req.period,
            interval=req.interval,
        )
        df = fetcher.get_data()

        if df.empty:
            raise ValueError(f"No data returned for symbol: {req.symbol}")

        job.progress = "Calculating technical indicators..."

        # 2. Generate chart images
        Drawer = get_chart_drawer()
        drawer = Drawer(
            stock_name=req.name,
            width=req.width,
            height=req.height,
            chart_mode=req.chart_mode,
        )
        image_dir = os.path.join(output_dir, "images")
        os.makedirs(image_dir, exist_ok=True)
        image_files = await drawer.draw_kline(df, image_dir)

        if not image_files:
            raise ValueError("Chart generation produced no images")

        job.progress = "Generating report frames..."

        # 3. Generate report frames (text overlay)
        from report.frames import generate_report_frames
        report_dir = os.path.join(output_dir, "reports")
        os.makedirs(report_dir, exist_ok=True)

        report_text = req.analysis_text or generate_default_analysis(req, df)
        title = req.title or f"{req.name} ({req.symbol}) Analysis"

        report_frames = await generate_report_frames(
            md_text=report_text,
            title=title,
            background_image=image_files[0] if image_files else None,
            output_dir=report_dir,
            locale=req.locale,
            width=req.width,
            height=req.height,
        )

        job.progress = "Generating audio narration..."

        # 4. Generate TTS audio + subtitles
        TTS = get_tts_engine()
        tts = TTS(locale=req.locale)
        audio_dir = os.path.join(output_dir, "audios")
        os.makedirs(audio_dir, exist_ok=True)

        contents = extract_tts_segments(report_text, req.locale)
        subtitles = await tts.text_to_speech(contents, audio_dir)

        job.progress = "Composing final video..."

        # 5. Compose video
        Composer = get_video_composer()
        composer = Composer(
            width=req.width,
            height=req.height,
            fps=req.fps,
            locale=req.locale,
        )
        output_video = os.path.join(output_dir, "output.mp4")
        thumbnail_path = os.path.join(output_dir, "thumbnail.png")

        duration = await composer.create_video(
            report_frames=report_frames,
            image_files=image_files,
            title=title,
            subtitles=subtitles,
            output_file=output_video,
            thumbnail_path=thumbnail_path,
        )

        # 6. Update job
        job.status = "completed"
        job.video_url = f"/videos/{job_id}/output.mp4"
        job.thumbnail_url = f"/videos/{job_id}/thumbnail.png"
        job.duration = duration
        job.progress = "Complete"

        logger.info(f"Video generation completed: {job_id}")

    except Exception as e:
        logger.error(f"Video generation failed for {job_id}: {str(e)}")
        job.status = "failed"
        job.error = str(e)
        job.progress = "Failed"

        # Cleanup on failure
        if os.path.exists(output_dir):
            shutil.rmtree(output_dir, ignore_errors=True)


def generate_default_analysis(req: VideoRequest, df) -> str:
    """Generate a basic analysis from the DataFrame when no pre-generated text is provided."""
    locale = req.locale
    latest = df.iloc[-1]
    prev = df.iloc[-2] if len(df) > 1 else latest

    change_pct = ((latest["close"] - prev["close"]) / prev["close"] * 100) if prev["close"] != 0 else 0

    if locale == "ar":
        return f"""# {req.name} - تحليل السوق

**السعر الحالي**: {latest['close']:.2f}
**التغيير**: {change_pct:+.2f}%

**ملخص الأداء**
- أعلى سعر: {latest['high']:.2f}
- أدنى سعر: {latest['low']:.2f}
- حجم التداول: {int(latest.get('volume', 0)):,}

**المؤشرات الفنية**
- MA5: {latest.get('MA5', 'N/A')}
- MA20: {latest.get('MA20', 'N/A')}
- RSI14: {latest.get('RSI14', 'N/A')}
"""
    else:
        return f"""# {req.name} - Market Analysis

**Current Price**: {latest['close']:.2f}
**Change**: {change_pct:+.2f}%

**Performance Summary**
- High: {latest['high']:.2f}
- Low: {latest['low']:.2f}
- Volume: {int(latest.get('volume', 0)):,}

**Technical Indicators**
- MA5: {latest.get('MA5', 'N/A')}
- MA20: {latest.get('MA20', 'N/A')}
- RSI14: {latest.get('RSI14', 'N/A')}
"""


def extract_tts_segments(text: str, locale: str) -> List[str]:
    """Extract TTS-friendly segments from analysis text."""
    # Remove markdown headers and formatting
    lines = text.split('\n')
    segments = []
    for line in lines:
        line = line.strip()
        if not line:
            continue
        if line.startswith('#'):
            continue  # Skip headers
        if line.startswith('**') and line.endswith('**'):
            continue  # Skip bold-only lines
        # Clean markdown
        clean = line.replace('**', '').replace('*', '').strip()
        if clean and len(clean) > 10:  # Skip very short lines
            segments.append(clean)

    # If no segments found, use the whole text
    if not segments:
        segments = [text.replace('#', '').replace('**', '').replace('*', '').strip()]

    # Split long segments into smaller ones for better TTS
    result = []
    for seg in segments:
        if len(seg) > 200:
            # Split by sentences
            sentences = []
            current = ""
            for char in seg:
                current += char
                if char in '.!?。！？':
                    if current.strip():
                        sentences.append(current.strip())
                    current = ""
            if current.strip():
                sentences.append(current.strip())
            result.extend(sentences)
        else:
            result.append(seg)

    return result if result else ["Market analysis complete."]


# ─── API Endpoints ───────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "service": "stock-insight-video", "version": "1.0.0"}


@app.post("/generate", response_model=VideoResponse)
async def generate_video(req: VideoRequest, background_tasks: BackgroundTasks):
    """Start async video generation. Returns job ID immediately."""
    job_id = str(uuid.uuid4())[:8]

    jobs[job_id] = VideoStatusResponse(
        job_id=job_id,
        status="pending",
        progress="Queued",
    )

    background_tasks.add_task(generate_video_pipeline, req, job_id)

    return VideoResponse(
        job_id=job_id,
        status="pending",
    )


@app.get("/status/{job_id}", response_model=VideoStatusResponse)
async def get_status(job_id: str):
    """Check video generation status."""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    return jobs[job_id]


@app.get("/videos/{job_id}/{filename}")
async def serve_video(job_id: str, filename: str):
    """Serve generated video files."""
    from fastapi.responses import FileResponse
    file_path = os.path.join(OUTPUT_DIR, job_id, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    media_type = "video/mp4" if filename.endswith(".mp4") else "image/png"
    return FileResponse(file_path, media_type=media_type)


@app.delete("/jobs/{job_id}")
async def delete_job(job_id: str):
    """Delete a job and its files."""
    if job_id in jobs:
        del jobs[job_id]
    output_dir = os.path.join(OUTPUT_DIR, job_id)
    if os.path.exists(output_dir):
        shutil.rmtree(output_dir, ignore_errors=True)
    return {"status": "deleted"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
