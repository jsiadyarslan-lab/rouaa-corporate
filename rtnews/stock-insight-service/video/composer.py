"""
Video Composer — Combines chart images, report frames, TTS audio, and subtitles
into a professional analysis video using MoviePy.
"""

import os
import math
from typing import List, Optional

from loguru import logger

try:
    from moviepy import (
        AudioFileClip,
        ColorClip,
        CompositeAudioClip,
        CompositeVideoClip,
        ImageClip,
        TextClip,
        concatenate_videoclips,
    )
    HAS_MOVIEPY = True
except ImportError:
    HAS_MOVIEPY = False
    logger.error("MoviePy not available — video generation will fail")


class VideoComposer:
    """Composes all visual and audio elements into a final video."""

    def __init__(self, width: int = 1080, height: int = 1920,
                 fps: int = 24, locale: str = "en"):
        self.width = width
        self.height = height
        self.fps = fps
        self.locale = locale

        # Font configuration
        if locale == "ar":
            self.font = "/usr/share/fonts/truetype/chinese/NotoSansSC[wght].ttf"
        else:
            self.font = "/usr/share/fonts/truetype/english/Tinos-Regular.ttf"

    async def create_video(
        self,
        report_frames: List[str],
        image_files: List[str],
        title: str,
        subtitles: list,  # List of TTS Subtitle objects
        output_file: str,
        thumbnail_path: Optional[str] = None,
        bg_audio_path: Optional[str] = None,
    ) -> float:
        """
        Create the final video by composing all elements.

        Returns the video duration in seconds.
        """
        if not HAS_MOVIEPY:
            raise RuntimeError("MoviePy is not installed — cannot generate video")

        if not image_files and not report_frames:
            raise ValueError("No images or report frames provided")

        # Ensure output directory exists
        os.makedirs(os.path.dirname(output_file), exist_ok=True)

        # ─── Build video segments ────────────────────────────────────────

        # Segment 1: Title card (3 seconds)
        title_duration = 3.0
        title_clips = []

        if report_frames:
            title_bg = ImageClip(report_frames[0]).with_duration(title_duration).resize((self.width, self.height))
        else:
            title_bg = ColorClip(
                size=(self.width, self.height), color=(15, 23, 42)
            ).with_duration(title_duration)

        title_clips.append(title_bg)

        # Add title text overlay
        try:
            title_text = TextClip(
                font=self.font,
                text=title,
                font_size=42,
                color="white",
                bg_color="rgba(15,23,42,0.7)",
                text_align="center",
                size=(int(self.width * 0.85), None),
            )
            title_text = title_text.with_duration(title_duration).with_position(
                ("center", self.height * 0.45)
            )
            title_clips.append(title_text)
        except Exception as e:
            logger.warning(f"Could not create title text: {e}")

        # Segment 2: Report summary (5 seconds)
        report_duration = 5.0
        report_clips = []
        if len(report_frames) > 1:
            for i, frame in enumerate(report_frames[1:6]):  # Max 5 report frames
                clip = ImageClip(frame).with_duration(report_duration / min(5, len(report_frames) - 1))
                clip = clip.resize((self.width, self.height))
                report_clips.append(clip)

        # Segment 3: Chart animation (main content, synced with audio)
        total_audio_duration = subtitles[-1].end_time if subtitles else 15.0

        chart_clips = []
        if image_files:
            per_image_duration = total_audio_duration / len(image_files)
            for img_path in image_files:
                try:
                    clip = ImageClip(img_path).with_duration(per_image_duration)
                    clip = clip.resize((self.width, self.height))
                    chart_clips.append(clip)
                except Exception as e:
                    logger.warning(f"Could not load chart image {img_path}: {e}")
        else:
            # Fallback: colored background
            chart_clips.append(
                ColorClip(
                    size=(self.width, self.height), color=(15, 23, 42)
                ).with_duration(total_audio_duration)
            )

        # ─── Combine all segments ────────────────────────────────────────

        all_clips = []

        # Title segment
        if len(title_clips) > 1:
            all_clips.append(CompositeVideoClip(title_clips).with_duration(title_duration))
        else:
            all_clips.extend(title_clips)

        # Report segment
        all_clips.extend(report_clips)

        # Chart segment (main content)
        all_clips.extend(chart_clips)

        video = concatenate_videoclips(all_clips, method="compose")

        # ─── Audio ───────────────────────────────────────────────────────

        audio_clips = []
        offset = title_duration + report_duration  # Audio starts after title+report

        # TTS audio segments
        for sub in subtitles:
            if os.path.exists(sub.audio_file):
                try:
                    audio = AudioFileClip(sub.audio_file)
                    audio_clip = audio.with_start(sub.start_time + offset)
                    audio_clips.append(audio_clip)
                except Exception as e:
                    logger.warning(f"Could not load audio {sub.audio_file}: {e}")

        # Background music (optional)
        if bg_audio_path and os.path.exists(bg_audio_path):
            try:
                final_duration = offset + total_audio_duration
                bg_audio = AudioFileClip(bg_audio_path).with_duration(final_duration)
                bg_audio = bg_audio.with_volume_scaled(0.15)  # Very quiet
                audio_clips.insert(0, bg_audio)
            except Exception as e:
                logger.warning(f"Could not load background audio: {e}")

        # ─── Subtitle overlays ───────────────────────────────────────────

        text_clips = []
        for sub in subtitles:
            try:
                sub_text = TextClip(
                    font=self.font,
                    text=sub.text[:80],  # Truncate long lines
                    font_size=28,
                    color="white",
                    stroke_color="black",
                    stroke_width=1,
                    text_align="center",
                    size=(int(self.width * 0.85), None),
                )
                sub_text = sub_text.with_duration(
                    sub.end_time - sub.start_time
                ).with_start(
                    sub.start_time + offset
                ).with_position(
                    ("center", self.height * 0.88)
                )
                text_clips.append(sub_text)
            except Exception as e:
                logger.warning(f"Could not create subtitle: {e}")

        # ─── Final composition ───────────────────────────────────────────

        final_clips = [video] + text_clips
        final_video = CompositeVideoClip(final_clips)

        if audio_clips:
            final_audio = CompositeAudioClip(audio_clips)
            final_video = final_video.with_audio(final_audio)

        # Write to file
        final_video.write_videofile(
            output_file,
            fps=self.fps,
            codec="libx264",
            threads=2,
            logger=None,
        )

        duration = title_duration + report_duration + total_audio_duration

        # ─── Generate thumbnail ──────────────────────────────────────────
        if thumbnail_path and image_files:
            try:
                from PIL import Image
                img = Image.open(image_files[0])
                img = img.resize((self.width // 2, self.height // 2))
                img.save(thumbnail_path)
            except Exception as e:
                logger.warning(f"Could not generate thumbnail: {e}")

        logger.info(f"Video created: {output_file} ({duration:.1f}s)")
        return duration
