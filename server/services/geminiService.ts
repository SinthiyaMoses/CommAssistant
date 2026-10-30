import dotenv from 'dotenv';
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export const isGeminiConfigured = (): boolean => {
  return !!GEMINI_API_KEY && GEMINI_API_KEY.trim().length > 0;
};

// Modern Gemini models supported in v1beta API
const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.5-flash-lite', 'gemini-3.7-flash'];

/**
 * Helper to execute generateContent with fallback models
 */
const callGeminiGenerateContent = async (payload: any): Promise<any | null> => {
  if (!isGeminiConfigured()) return null;

  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return { text, model };
      } else {
        const errText = await response.text();
        console.warn(`Gemini model ${model} returned HTTP ${response.status}:`, errText.slice(0, 150));
      }
    } catch (err) {
      console.warn(`Gemini model ${model} fetch failed:`, err);
    }
  }

  return null;
};

/**
 * Translates text with contextual preservation and transliteration using Gemini
 */
export const translateWithGemini = async (
  text: string,
  sourceLanguage: string,
  targetLanguage: string
): Promise<{
  translatedText: string;
  transliteration?: string;
  detectedLanguage?: string;
  provider: string;
} | null> => {
  if (!isGeminiConfigured() || !text || text.trim().length === 0) return null;

  try {
    const prompt = `You are a world-class neural translation engine specializing in Indian and global languages.
Source text: "${text.trim()}"
Source language hint: ${sourceLanguage || 'auto'}
Target language code: ${targetLanguage}

Instructions:
1. Accurately detect the source language code (e.g. en, ta, hi, te, ml, kn, bn, gu, mr, pa, ur, es, fr, de, ar, zh, ja).
2. Translate the source text accurately into the target language code (${targetLanguage}). Ensure fluent, natural idioms, correct grammar, and emotional nuance.
3. If the target language is NOT English (e.g. Tamil, Hindi, Telugu, etc.), provide an accurate phonetic Romanized transliteration (English alphabet pronunciation). If target is English, provide pronunciation or omit.

Respond with ONLY a raw JSON object (no markdown code fences, no extra text):
{
  "detectedLanguage": "en",
  "translatedText": "translated text here",
  "transliteration": "phonetic transliteration here"
}`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    };

    const result = await callGeminiGenerateContent(payload);
    if (!result || !result.text) return null;

    let cleanJson = result.text.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(cleanJson);
    if (!parsed.translatedText) return null;

    return {
      translatedText: parsed.translatedText,
      transliteration: parsed.transliteration || undefined,
      detectedLanguage: parsed.detectedLanguage || sourceLanguage || 'auto',
      provider: `gemini (${result.model})`,
    };
  } catch (err) {
    console.warn('Gemini translation error:', err);
  }

  return null;
};

/**
 * Multimodal Audio Speech-to-Text Transcription using Gemini 2.5 Flash
 */
export const transcribeAudioWithGemini = async (
  audioBuffer: Buffer,
  mimeType: string,
  languageHint?: string
): Promise<{
  transcript: string;
  detectedLanguage: string;
  confidence: number;
  provider: string;
} | null> => {
  if (!isGeminiConfigured() || !audioBuffer || audioBuffer.length === 0) return null;

  try {
    const base64Audio = audioBuffer.toString('base64');
    const prompt = `Transcribe this speech audio accurately.
Language hint: ${languageHint || 'auto-detect (Indian / Global languages)'}.
Task:
1. Accurately transcribe every spoken word into text with correct spelling and punctuation.
2. Identify the language code of the spoken words (e.g., ta, hi, te, ml, kn, bn, en, es, fr, etc.).

Respond with ONLY a raw JSON object:
{
  "transcript": "transcribed speech text",
  "detectedLanguage": "en",
  "confidence": 0.98
}`;

    const payload = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType || 'audio/wav',
                data: base64Audio,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    };

    const result = await callGeminiGenerateContent(payload);
    if (!result || !result.text) return null;

    let cleanJson = result.text.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(cleanJson);
    if (!parsed.transcript) return null;

    return {
      transcript: parsed.transcript,
      detectedLanguage: parsed.detectedLanguage || languageHint || 'en',
      confidence: parsed.confidence || 0.96,
      provider: `gemini-audio (${result.model})`,
    };
  } catch (err) {
    console.warn('Gemini Audio STT error:', err);
  }

  return null;
};

/**
 * Extracts text from an image and translates it into target language using Gemini Vision
 */
export const extractAndTranslateImageWithGemini = async (
  imageBase64: string,
  mimeType: string,
  targetLanguage: string
): Promise<{
  extractedText: string;
  detectedLanguage: string;
  translatedText: string;
  transliteration?: string;
  provider: string;
} | null> => {
  if (!isGeminiConfigured() || !imageBase64) return null;

  try {
    const prompt = `Analyze this image (e.g., signboard, document, notice, menu, poster, book).
1. Accurately extract all visible text from the image verbatim.
2. Accurately detect the source language code of the extracted text (e.g., en, ta, hi, te, ml, kn, bn, gu, mr, pa, ur, es, fr, de, ja, zh, etc.).
3. Translate the extracted text accurately and naturally into the target language code: "${targetLanguage}".
   - Ensure the translation is in target language code "${targetLanguage}" (e.g. if target is hi -> Hindi, if ta -> Tamil, if en -> English, if te -> Telugu, if es -> Spanish, if fr -> French, etc.).
   - If the extracted text is already in the target language (${targetLanguage}), translatedText should be the same as extractedText.
4. If target language is an Indic or non-Latin script, provide Romanized phonetic transliteration (pronunciation in English letters).

Respond with ONLY a raw JSON object (no markdown, no extra commentary):
{
  "extractedText": "exact text from image",
  "detectedLanguage": "detected source language code",
  "translatedText": "translated text in ${targetLanguage}",
  "transliteration": "phonetic transliteration here"
}`;

    const payload = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType || 'image/jpeg',
                data: imageBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    };

    const result = await callGeminiGenerateContent(payload);
    if (!result || !result.text) return null;

    let cleanJson = result.text.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(cleanJson);
    if (!parsed.extractedText || !parsed.translatedText) return null;

    return {
      extractedText: parsed.extractedText,
      detectedLanguage: parsed.detectedLanguage || 'auto',
      translatedText: parsed.translatedText,
      transliteration: parsed.transliteration || undefined,
      provider: `gemini-vision (${result.model})`,
    };
  } catch (err) {
    console.warn('Gemini vision OCR error:', err);
  }

  return null;
};
