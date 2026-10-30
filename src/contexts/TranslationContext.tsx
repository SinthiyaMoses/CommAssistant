import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { TranslationResult, SupportedLanguageCode } from '../types';
import { useLanguage } from './LanguageContext';
import { useAudio } from './AudioContext';
import { useAccessibility } from './AccessibilityContext';
import { translateTextAPI } from '../services/api';
import { db } from '../services/db';

interface TranslationContextType {
  currentTranscript: string;
  setCurrentTranscript: (text: string) => void;
  interimTranscript: string;
  setInterimTranscript: (text: string) => void;
  currentTranslation: TranslationResult | null;
  setCurrentTranslation: (res: TranslationResult | null) => void;
  isTranslating: boolean;
  performTranslation: (
    text: string,
    mode?: 'voice' | 'text' | 'conversation' | 'ocr' | 'aac' | 'sign',
    sourceHint?: SupportedLanguageCode,
    targetOverride?: SupportedLanguageCode
  ) => Promise<TranslationResult | null>;
  history: TranslationResult[];
  deleteHistoryItem: (id: string) => Promise<void>;
  clearAllHistory: () => Promise<void>;
  refreshHistory: () => Promise<void>;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { targetLanguage, setDetectedSource } = useLanguage();
  const { setMicState, speakText } = useAudio();
  const { autoPlayAudio, announceToScreenReader } = useAccessibility();

  const [currentTranscript, setCurrentTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [currentTranslation, setCurrentTranslation] = useState<TranslationResult | null>(null);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [history, setHistory] = useState<TranslationResult[]>([]);

  const refreshHistory = useCallback(async () => {
    try {
      const records = await db.history.orderBy('timestamp').reverse().toArray();
      setHistory(records);
    } catch (err) {
      console.warn('Failed to load history:', err);
    }
  }, []);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  const performTranslation = async (
    text: string,
    mode: 'voice' | 'text' | 'conversation' | 'ocr' | 'aac' | 'sign' = 'voice',
    sourceHint?: SupportedLanguageCode,
    targetOverride?: SupportedLanguageCode
  ): Promise<TranslationResult | null> => {
    if (!text || text.trim().length === 0) return null;

    const effectiveTargetLang = targetOverride || targetLanguage;
    setIsTranslating(true);
    setMicState('TRANSLATING');

    try {
      const result = await translateTextAPI(text.trim(), effectiveTargetLang, sourceHint);

      // Automatic source language detection display
      setDetectedSource(result.sourceLanguage as SupportedLanguageCode, result.confidence);
      setMicState('LANGUAGE_DETECTED');

      const translationRecord: TranslationResult = {
        id: `trans-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        sourceText: text.trim(),
        translatedText: result.translatedText,
        transliteration: result.transliteration,
        sourceLanguage: result.sourceLanguage,
        sourceLanguageName: result.sourceLanguageName,
        targetLanguage: effectiveTargetLang,
        targetLanguageName: result.targetLanguageName,
        confidence: result.confidence,
        timestamp: Date.now(),
        mode,
      };

      setCurrentTranslation(translationRecord);
      setCurrentTranscript(text.trim());
      setInterimTranscript('');

      // Save to IndexedDB local history
      await db.history.add(translationRecord);
      await refreshHistory();

      // Screen reader announcement
      announceToScreenReader(`Translation complete: ${result.translatedText}`);

      // Automatic Text-to-Speech playback if enabled
      if (autoPlayAudio) {
        setMicState('GENERATING_VOICE');
        speakText(result.translatedText, targetLanguage, () => {
          setMicState('COMPLETE');
        });
      } else {
        setMicState('COMPLETE');
      }

      setIsTranslating(false);
      return translationRecord;
    } catch (err) {
      console.error('Translation workflow exception:', err);
      setMicState('ERROR');
      setIsTranslating(false);
      return null;
    }
  };

  const deleteHistoryItem = async (id: string) => {
    try {
      await db.history.delete(id);
      await refreshHistory();
    } catch (err) {
      console.warn('Error deleting history item:', err);
    }
  };

  const clearAllHistory = async () => {
    try {
      await db.history.clear();
      setHistory([]);
    } catch (err) {
      console.warn('Error clearing history:', err);
    }
  };

  return (
    <TranslationContext.Provider
      value={{
        currentTranscript,
        setCurrentTranscript,
        interimTranscript,
        setInterimTranscript,
        currentTranslation,
        setCurrentTranslation,
        isTranslating,
        performTranslation,
        history,
        deleteHistoryItem,
        clearAllHistory,
        refreshHistory,
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = (): TranslationContextType => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};
