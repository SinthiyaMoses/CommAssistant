import { Router, Request, Response } from 'express';
import multer from 'multer';
import {
  translateWithGemini,
  extractAndTranslateImageWithGemini,
  isGeminiConfigured,
} from '../services/geminiService';
import {
  translateWithGoogle,
  detectLanguageWithGoogle,
  getGoogleTTSUrl,
} from '../services/googleTranslateService';
import { transcribeAudio, isWhisperConfigured } from '../services/whisperService';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit for audio/image
});

// Health check and provider diagnostic status
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    aiProviders: {
      gemini: isGeminiConfigured() ? 'active (gemini-2.5-flash)' : 'fallback-mode',
      googleTranslate: 'active (gtx-neural-engine)',
      whisper: isWhisperConfigured()
        ? 'active (openai-whisper-1)'
        : isGeminiConfigured()
        ? 'active (gemini-2.5-audio-stt)'
        : 'browser-speech-fallback',
      visionOCR: isGeminiConfigured() ? 'active (gemini-vision)' : 'tesseract-client-fallback',
    },
  });
});

// Translation Endpoint (Multi-Tier: Gemini 2.5 Flash -> Google Translate Engine)
router.post('/translate', async (req: Request, res: Response) => {
  try {
    const { text, sourceLanguage, targetLanguage } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Text parameter is required' });
    }

    if (!targetLanguage) {
      return res.status(400).json({ success: false, error: 'targetLanguage is required' });
    }

    const cleanText = text.trim();
    const srcLang = sourceLanguage || 'auto';

    // Tier 1: Try Google Gemini 2.5 Flash Neural AI
    if (isGeminiConfigured()) {
      const geminiResult = await translateWithGemini(cleanText, srcLang, targetLanguage);
      if (geminiResult && geminiResult.translatedText) {
        return res.json({
          success: true,
          sourceLanguage: geminiResult.detectedLanguage || srcLang,
          targetLanguage,
          translatedText: geminiResult.translatedText,
          transliteration: geminiResult.transliteration,
          confidence: 0.98,
          provider: geminiResult.provider,
        });
      }
    }

    // Tier 2: Resilient Google Translate Engine
    const googleResult = await translateWithGoogle(cleanText, srcLang, targetLanguage);
    if (googleResult && googleResult.translatedText) {
      return res.json({
        success: true,
        sourceLanguage: googleResult.detectedLanguage || srcLang,
        targetLanguage,
        translatedText: googleResult.translatedText,
        transliteration: googleResult.transliteration,
        confidence: 0.95,
        provider: googleResult.provider,
      });
    }

    // If both failed (e.g. offline with identical languages)
    if (srcLang === targetLanguage) {
      return res.json({
        success: true,
        sourceLanguage: srcLang,
        targetLanguage,
        translatedText: cleanText,
        confidence: 1.0,
        provider: 'identity',
      });
    }

    res.status(502).json({
      success: false,
      fallbackRequired: true,
      error: 'Translation services temporarily unavailable',
    });
  } catch (err: any) {
    console.error('Translation error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal translation error' });
  }
});

// Language Detection Endpoint
router.post('/detect-language', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ success: false, error: 'Text parameter required' });
    }

    const detected = await detectLanguageWithGoogle(text);
    res.json({
      success: true,
      detectedLanguage: detected.language,
      confidence: detected.confidence,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Speech Transcription Proxy Endpoint (Whisper & Gemini Multimodal STT)
router.post(
  '/speech/transcribe',
  upload.fields([{ name: 'audio', maxCount: 1 }, { name: 'file', maxCount: 1 }]),
  async (req: Request, res: Response) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      const file = files?.audio?.[0] || files?.file?.[0] || req.file;
      const languageHint = req.body.languageHint || req.body.sourceLanguage;

      if (!file) {
        return res.status(400).json({ success: false, error: 'Audio file required (field: audio or file)' });
      }

      const sttResult = await transcribeAudio(
        file.buffer,
        file.mimetype || 'audio/wav',
        file.originalname || 'speech.wav',
        languageHint
      );

      if (sttResult && sttResult.transcript) {
        return res.json({
          success: true,
          transcript: sttResult.transcript,
          detectedLanguage: sttResult.detectedLanguage,
          confidence: sttResult.confidence,
          provider: sttResult.provider,
        });
      }

      res.status(422).json({
        success: false,
        fallbackRequired: true,
        message: 'Could not extract speech transcript. Check audio format or permissions.',
      });
    } catch (err: any) {
      console.error('STT Error:', err);
      res.status(500).json({ success: false, error: err.message || 'Speech transcription failed' });
    }
  }
);

// OCR Image Translation Endpoint
router.post('/ocr/extract-and-translate', upload.single('image'), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    const { targetLanguage } = req.body;

    if (!file) {
      return res.status(400).json({ success: false, error: 'Image file is required' });
    }

    const base64 = file.buffer.toString('base64');
    const result = await extractAndTranslateImageWithGemini(
      base64,
      file.mimetype,
      targetLanguage || 'en'
    );

    if (result) {
      return res.json({
        success: true,
        extractedText: result.extractedText,
        detectedLanguage: result.detectedLanguage,
        translatedText: result.translatedText,
        transliteration: result.transliteration,
        targetLanguage: targetLanguage || 'en',
        provider: result.provider,
      });
    }

    res.json({
      success: false,
      fallbackRequired: true,
      message: 'Gemini Vision unavailable. Switching to client OCR.',
    });
  } catch (err: any) {
    console.error('OCR Error:', err);
    res.status(500).json({ success: false, error: err.message || 'OCR processing failed' });
  }
});

// Text-to-Speech Streaming Proxy Endpoint
router.get('/tts', async (req: Request, res: Response) => {
  try {
    const text = req.query.text as string;
    const lang = (req.query.lang as string) || 'en';

    if (!text) {
      return res.status(400).json({ error: 'Text query param required' });
    }

    const ttsUrl = getGoogleTTSUrl(text, lang);
    const audioRes = await fetch(ttsUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!audioRes.ok) {
      return res.status(audioRes.status).send('TTS upstream audio error');
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    const arrayBuf = await audioRes.arrayBuffer();
    res.send(Buffer.from(arrayBuf));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
