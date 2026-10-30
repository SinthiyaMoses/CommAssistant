import dotenv from 'dotenv';
import { transcribeAudioWithGemini } from './geminiService';

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export const isWhisperConfigured = (): boolean => {
  return !!OPENAI_API_KEY && OPENAI_API_KEY.trim().length > 0;
};

export interface STTResult {
  transcript: string;
  detectedLanguage: string;
  confidence: number;
  provider: string;
}

/**
 * Transcribes audio buffer using OpenAI Whisper or Gemini 2.5 Flash Multimodal Audio STT
 */
export const transcribeAudio = async (
  audioBuffer: Buffer,
  mimeType: string = 'audio/wav',
  fileName: string = 'audio.wav',
  languageHint?: string
): Promise<STTResult | null> => {
  if (!audioBuffer || audioBuffer.length === 0) return null;

  // 1. Try OpenAI Whisper API if configured
  if (isWhisperConfigured()) {
    try {
      const formData = new FormData();
      const uint8 = new Uint8Array(audioBuffer);
      const blob = new Blob([uint8], { type: mimeType });
      formData.append('file', blob, fileName);
      formData.append('model', 'whisper-1');
      if (languageHint && languageHint !== 'auto') {
        formData.append('language', languageHint);
      }
      formData.append('response_format', 'verbose_json');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        return {
          transcript: data.text?.trim() || '',
          detectedLanguage: data.language || languageHint || 'en',
          confidence: 0.98,
          provider: 'openai-whisper',
        };
      } else {
        const errText = await response.text();
        console.warn('OpenAI Whisper STT HTTP error:', response.status, errText);
      }
    } catch (err) {
      console.warn('OpenAI Whisper STT failed, trying fallback:', err);
    }
  }

  // 2. Try Gemini 2.5 Flash Audio STT (Multimodal)
  const geminiSTT = await transcribeAudioWithGemini(audioBuffer, mimeType, languageHint);
  if (geminiSTT && geminiSTT.transcript) {
    return geminiSTT;
  }

  return null;
};
