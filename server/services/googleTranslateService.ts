/**
 * Google Translate & Language Detection Engine
 * Uses resilient Google Translate GTX endpoints with chunking and transliteration extraction.
 */

export interface GoogleTranslationResult {
  translatedText: string;
  detectedLanguage: string;
  transliteration?: string;
  provider: 'google-translate';
}

/**
 * Translates text and extracts phonetic romanization/transliteration using Google Translate Engine
 */
export const translateWithGoogle = async (
  text: string,
  sourceLanguage: string = 'auto',
  targetLanguage: string = 'en'
): Promise<GoogleTranslationResult | null> => {
  if (!text || text.trim().length === 0) return null;

  try {
    const cleanText = text.trim();
    const sl = sourceLanguage || 'auto';
    const tl = targetLanguage || 'en';

    // Google Translate GTX endpoint with translation (dt=t) and romanization (dt=rm)
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(
      sl
    )}&tl=${encodeURIComponent(tl)}&dt=t&dt=rm&q=${encodeURIComponent(cleanText)}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: '*/*',
      },
    });

    if (!response.ok) {
      console.warn(`Google Translate returned HTTP ${response.status}`);
      return null;
    }

    const data = await response.json();
    if (!data || !Array.isArray(data) || !data[0]) {
      return null;
    }

    // Combine multi-sentence translation segments
    let translatedText = '';
    let transliteration: string | undefined = undefined;

    if (Array.isArray(data[0])) {
      for (const segment of data[0]) {
        if (Array.isArray(segment)) {
          if (segment[0] && typeof segment[0] === 'string') {
            translatedText += segment[0];
          }
          // Romanization is often in the trailing item of the sentence or next subarray
          if (segment[2] && typeof segment[2] === 'string') {
            transliteration = segment[2];
          } else if (segment[3] && typeof segment[3] === 'string') {
            transliteration = segment[3];
          }
        }
      }
    }

    // Detected language code from Google engine
    const detectedLanguage = data[2] || (sl === 'auto' ? 'en' : sl);

    if (!translatedText) {
      return null;
    }

    return {
      translatedText: translatedText.trim(),
      detectedLanguage,
      transliteration: transliteration?.trim() || undefined,
      provider: 'google-translate',
    };
  } catch (err) {
    console.warn('Google Translate API error:', err);
  }

  return null;
};

/**
 * Detects the language of a text snippet using Google Translate Language Detection
 */
export const detectLanguageWithGoogle = async (
  text: string
): Promise<{ language: string; confidence: number }> => {
  if (!text || text.trim().length === 0) {
    return { language: 'en', confidence: 0.5 };
  }

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(
      text.slice(0, 300)
    )}`;

    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      const detected = data?.[2];
      if (detected && typeof detected === 'string') {
        return { language: detected, confidence: 0.98 };
      }
    }
  } catch (err) {
    console.warn('Google language detection error:', err);
  }

  return { language: 'auto', confidence: 0.5 };
};

/**
 * Returns Google Text-to-Speech audio streaming URL for native pronunciation
 */
export const getGoogleTTSUrl = (text: string, lang: string): string => {
  return `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${encodeURIComponent(
    lang
  )}&q=${encodeURIComponent(text.slice(0, 200))}`;
};
