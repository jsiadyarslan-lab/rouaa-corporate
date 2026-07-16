"""
Video Composer — Uses FFmpeg directly for memory-efficient video assembly.
Replaces MoviePy to avoid OOM issues on constrained environments.
"""

import os
import subprocess
import json
from typing import List, Optional
from loguru import logger


class VideoComposer:
    """Composes all visual and audio elements into a final video using FFmpeg."""

    def __init__(self, width: int = 1080, height: int = 1920,
                 fps: int = 24, locale: str = "en"):
        self.width = width
        self.height = height
        self.fps = fps
        self.locale = locale

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
        Create the final video using FFmpeg.
        Returns the video duration in seconds.
        """
        os.makedirs(os.path.dirname(output_file), exist_ok=True)

        if not image_files and not report_frames:
            raise ValueError("No images or report frames provided")

        # ─── Step 1: Create a concat file for FFmpeg ────────────────────
        concat_dir = os.path.dirname(output_file)
        concat_list = []

        # Title segment: first report frame for 3 seconds
        title_duration = 3.0
        if report_frames:
            concat_list.append({
                "path": report_frames[0],
                "duration": title_duration,
                "type": "image"
            })
        elif image_files:
            concat_list.append({
                "path": image_files[0],
                "duration": title_duration,
                "type": "image"
            })

        # Report segment: next frames for 5 seconds total
        report_duration = 5.0
        if len(report_frames) > 1:
            per_frame = report_duration / min(5, len(report_frames) - 1)
            for frame in report_frames[1:6]:
                concat_list.append({
                    "path": frame,
                    "duration": per_frame,
                    "type": "image"
                })

        # Chart segment: main content
        # Calculate total audio duration
        total_audio_duration = subtitles[-1].end_time if subtitles else 15.0
        if image_files:
            per_image = total_audio_duration / len(image_files)
            for img_path in image_files:
                concat_list.append({
                    "path": img_path,
                    "duration": per_image,
                    "type": "image"
                })
        else:
            # Fallback: use last report frame for audio duration
            if report_frames:
                concat_list.append({
                    "path": report_frames[-1],
                    "duration": total_audio_duration,
                    "type": "image"
                })

        # ─── Step 2: Write concat file ─────────────────────────────────
        concat_file = os.path.join(concat_dir, "concat.txt")
        with open(concat_file, 'w') as f:
            for item in concat_list:
                # FFmpeg concat format for images with duration
                abs_path = os.path.abspath(item["path"])
                f.write(f"file '{abs_path}'\n")
                f.write(f"duration {item['duration']}\n")
            # FFmpeg requires last file repeated without duration
            if concat_list:
                abs_path = os.path.abspath(concat_list[-1]["path"])
                f.write(f"file '{abs_path}'\n")

        # ─── Step 3: Build audio from TTS segments ──────────────────────
        audio_clips = []
        offset = title_duration + report_duration

        for sub in subtitles:
            if os.path.exists(sub.audio_file):
                audio_clips.append({
                    "path": sub.audio_file,
                    "start": sub.start_time + offset,
                })

        # ─── Step 4: Compose with FFmpeg ────────────────────────────────
        # Step 4a: Create silent video from image sequence
        silent_video = os.path.join(concat_dir, "silent.mp4")
        cmd = [
            "ffmpeg", "-y",
            "-f", "concat", "-safe", "0",
            "-i", concat_file,
            "-vf", f"scale={self.width}:{self.height}:force_original_aspect_ratio=decrease,pad={self.width}:{self.height}:(ow-iw)/2:(oh-ih)/2:color=black",
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            "-r", str(self.fps),
            "-preset", "fast",
            "-crf", "23",
            silent_video
        ]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
            if result.returncode != 0:
                logger.error(f"FFmpeg silent video failed: {result.stderr[-500:]}")
                raise RuntimeError(f"FFmpeg failed: {result.stderr[-200:]}")
        except subprocess.TimeoutExpired:
            raise RuntimeError("FFmpeg timed out creating silent video")

        # Step 4b: Add audio tracks
        if audio_clips:
            # Build complex filter for multiple audio inputs
            filter_inputs = []
            filter_parts = []
            
            for i, clip in enumerate(audio_clips):
                filter_inputs.extend(["-i", clip["path"]])
                filter_parts.append(f"[{i+1}:a]adelay={int(clip['start']*1000)}|{int(clip['start']*1000)}[a{i}]")
            
            # Mix all audio tracks
            mix_inputs = "".join(f"[a{i}]" for i in range(len(audio_clips)))
            filter_parts.append(f"{mix_inputs}amix=inputs={len(audio_clips)}:duration=longest[aout]")
            
            filter_complex = ";".join(filter_parts)

            cmd = [
                "ffmpeg", "-y",
                "-i", silent_video,
                *filter_inputs,
                "-filter_complex", filter_complex,
                "-map", "0:v",
                "-map", "[aout]",
                "-c:v", "copy",
                "-c:a", "aac",
                "-shortest",
                output_file
            ]
            
            try:
                result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
                if result.returncode != 0:
                    # If audio mixing fails, just use the silent video
                    logger.warning(f"Audio mixing failed, using silent video: {result.stderr[-200:]}")
                    os.rename(silent_video, output_file)
            except subprocess.TimeoutExpired:
                os.rename(silent_video, output_file)
        else:
            os.rename(silent_video, output_file)

        # Clean up temp files
        for f in [concat_file, silent_video]:
            if os.path.exists(f):
                try:
                    os.remove(f)
                except Exception:
                    pass

        # ─── Step 5: Generate thumbnail ──────────────────────────────────
        if thumbnail_path and image_files:
            try:
                from PIL import Image
                img = Image.open(image_files[0])
                img = img.resize((self.width // 2, self.height // 2))
                img.save(thumbnail_path)
            except Exception as e:
                logger.warning(f"Could not generate thumbnail: {e}")

        # Calculate duration
        total_duration = title_duration + report_duration + total_audio_duration
        logger.info(f"Video created: {output_file} ({total_duration:.1f}s)")
        return total_duration
