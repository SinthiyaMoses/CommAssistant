import React, { createContext, useContext, useState, useEffect } from 'react';
import { SupportedLanguageCode, LanguageInfo } from '../types';
import { SUPPORTED_LANGUAGES, getLanguageByCode } from '../services/languageService';
import { db } from '../services/db';

interface LanguageContextType {
  targetLanguage: SupportedLanguageCode;
  targetLanguageInfo: LanguageInfo;
  setTargetLanguage: (code: SupportedLanguageCode) => void;
  detectedSourceLanguage: SupportedLanguageCode | null;
  detectedSourceLanguageInfo: LanguageInfo | null;
  detectedConfidence: number | null;
  setDetectedSource: (code: SupportedLanguageCode | null, confidence?: number) => void;
  supportedLanguages: LanguageInfo[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [targetLanguage, setTargetLanguageState] = useState<SupportedLanguageCode>('ta');
  const [detectedSourceLanguage, setDetectedSourceLanguage] = useState<SupportedLanguageCode | null>(null);
  const [detectedConfidence, setDetectedConfidence] = useState<number | null>(null);

  // Load persisted target language preference from IndexedDB
  useEffect(() => {
    const loadPreference = async () => {
      try {
        const settings = await db.settings.get('user_preferences');
        if (settings?.targetLanguage) {
          setTargetLanguageState(settings.targetLanguage);
        }
      } catch (err) {
        console.warn('Could not load target language setting:', err);
      }
    };
    loadPreference();
  }, []);

  const setTargetLanguage = async (code: SupportedLanguageCode) => {
    // Crucial rule: User explicitly chooses target language; it is strictly preserved
    setTargetLanguageState(code);
    try {
      await db.settings.update('user_preferences', { targetLanguage: code });
    } catch {
      // Ignore
    }
  };

  const setDetectedSource = (code: SupportedLanguageCode | null, confidence = 0.9) => {
    // Notice: We update detected source language BUT NEVER overwrite targetLanguage!
    setDetectedSourceLanguage(code);
    setDetectedConfidence(confidence);
  };

  const targetLanguageInfo = getLanguageByCode(targetLanguage);
  const detectedSourceLanguageInfo = detectedSourceLanguage ? getLanguageByCode(detectedSourceLanguage) : null;

  return (
    <LanguageContext.Provider
      value={{
        targetLanguage,
        targetLanguageInfo,
        setTargetLanguage,
        detectedSourceLanguage,
        detectedSourceLanguageInfo,
        detectedConfidence,
        setDetectedSource,
        supportedLanguages: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
