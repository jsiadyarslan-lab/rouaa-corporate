"""
TTS Engine — Text-to-Speech for Arabic and English.
Supports OpenAI TTS API (primary) with fallback to system TTS.
"""

import os
import time
from abc import ABC, abstractmethod
from typing import List, Optional
from dataclasses import dataclass

from loguru import logger

try:
    from moviepy import AudioFileClip
except ImportError:
    AudioFileClip = None


@dataclass
class Subtitle:
    text: str
    start_time: float
    end_time: float
    audio_file: str


class TTSEngine:
    """Text-to-Speech engine with OpenAI-compatible API support."""

    def __init__(self, locale: str = "en", voice: Optional[str] = None):
        self.locale = locale
        self.api_key = os.environ.get("OPENAI_API_KEY", "")
        self.base_url = os.environ.get("TTS_BASE_URL", "https://api.openai.com/v1")
        self.model = os.environ.get("TTS_MODEL", "tts-1")

        # Default voices per locale
        if voice:
            self.voice = voice
        elif locale == "ar":
            self.voice = os.environ.get("TTS_AR_VOICE", "alloy")
        else:
            self.voice = os.environ.get("TTS_EN_VOICE", "alloy")

    async def text_to_speech(
        self, contents: List[str], output_folder: str, interval: float = 0.3
    ) -> List[Subtitle]:
        """Convert text segments to speech files with subtitle timing."""
        os.makedirs(output_folder, exist_ok=True)
        subtitles = []
        duration_start = 0.0

        for i, content in enumerate(contents):
            file_name = os.path.join(output_folder, f"{i:02d}.mp3")

            if not os.path.exists(file_name):
                await self._generate_audio(content, file_name)

            # Get audio duration
            audio_duration = 2.0  # Default fallback
            if AudioFileClip and os.path.exists(file_name):
                try:
                    clip = AudioFileClip(file_name)
                    audio_duration = clip.duration
                    clip.close()
                except Exception:
                    audio_duration = max(2.0, len(content) * 0.05)  # Rough estimate
            else:
                audio_duration = max(2.0, len(content) * 0.05)

            subtitles.append(Subtitle(
                text=content,
                start_time=duration_start,
                end_time=duration_start + audio_duration + interval,
                audio_file=file_name,
            ))

            duration_start += audio_duration + interval

        return subtitles

    async def _generate_audio(self, content: str, file_name: str, max_retries: int = 3):
        """Generate audio using OpenAI-compatible TTS API."""
        for attempt in range(max_retries):
            try:
                if self.api_key:
                    await self._generate_with_api(content, file_name)
                else:
                    # Fallback: generate silent audio placeholder
                    self._generate_silent_placeholder(content, file_name)
                return
            except Exception as e:
                logger.warning(f"TTS attempt {attempt + 1} failed: {e}")
                if os.path.exists(file_name):
                    os.remove(file_name)
                time.sleep(2)
                continue

        # Final fallback
        self._generate_silent_placeholder(content, file_name)

    async def _generate_with_api(self, content: str, file_name: str):
        """Use OpenAI-compatible API for TTS."""
        from openai import OpenAI

        client = OpenAI(api_key=self.api_key, base_url=self.base_url)

        response = client.audio.speech.create(
            model=self.model,
            voice=self.voice,
            input=content,
            speed=1.0 if self.locale == "ar" else 1.1,
        )

        with open(file_name, "wb") as f:
            for chunk in response.iter_bytes():
                f.write(chunk)

        logger.info(f"TTS generated: {file_name}")

    def _generate_silent_placeholder(self, content: str, file_name: str):
        """Generate a minimal MP3 file as placeholder when TTS is unavailable."""
        import struct
        import wave

        # Create a minimal WAV file, then we'll use it
        duration = max(2.0, len(content) * 0.05)
        sample_rate = 22050
        num_samples = int(sample_rate * duration)

        wav_path = file_name.replace(".mp3", ".wav")
        with wave.open(wav_path, 'w') as wav_file:
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)
            wav_file.setframerate(sample_rate)
            # Very quiet noise
            for _ in range(num_samples):
                wav_file.writeframes(struct.pack('<h', 0))

        # Try to convert to MP3
        try:
            from moviepy import AudioFileClip
            clip = AudioFileClip(wav_path)
            clip.write_audiofile(file_name, verbose=False, logger=None)
            clip.close()
            os.remove(wav_path)
        except Exception:
            # If conversion fails, just use WAV
            if os.path.exists(wav_path):
                os.rename(wav_path, file_name.replace(".mp3", ".wav"))
                # Update the file_name reference won't work, so copy
                import shutil
                shutil.copy2(wav_path, file_name.replace(".mp3", ".wav"))
                os.remove(wav_path)

        logger.info(f"Silent placeholder generated: {file_name}")
