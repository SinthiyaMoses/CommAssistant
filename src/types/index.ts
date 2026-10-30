export type SupportedLanguageCode =
  | 'en'
  | 'ta'
  | 'hi'
  | 'te'
  | 'ml'
  | 'kn'
  | 'bn'
  | 'gu'
  | 'mr'
  | 'pa'
  | 'ur'
  | 'es'
  | 'fr'
  | 'de'
  | 'ar'
  | 'zh'
  | 'ja'
  | 'ru'
  | 'pt'
  | 'it'
  | 'ko'
  | (string & {});

export interface LanguageInfo {
  code: string;
  name: string;
  nativeName: string;
  script: string;
  bcp47: string;
  flag: string;
  indic: boolean;
  samplePhrase: string;
}

export type MicState = 
  | 'IDLE'
  | 'LISTENING'
  | 'PROCESSING'
  | 'LANGUAGE_DETECTED'
  | 'TRANSLATING'
  | 'GENERATING_VOICE'
  | 'COMPLETE'
  | 'ERROR';

export type AccessibilityMode = 'standard' | 'visual' | 'hearing' | 'aac' | 'sign';

export interface TranslationResult {
  id: string;
  sourceText: string;
  translatedText: string;
  transliteration?: string;
  sourceLanguage: SupportedLanguageCode | string;
  sourceLanguageName: string;
  targetLanguage: SupportedLanguageCode;
  targetLanguageName: string;
  confidence: number;
  timestamp: number;
  audioUrl?: string;
  provider?: string;
  mode: 'voice' | 'text' | 'conversation' | 'ocr' | 'aac' | 'sign';
}

export interface ConversationTurn {
  id: string;
  speaker: 'PERSON_A' | 'PERSON_B';
  speakerName: string;
  sourceText: string;
  translatedText: string;
  sourceLanguage: SupportedLanguageCode | string;
  targetLanguage: SupportedLanguageCode;
  timestamp: number;
  audioUrl?: string;
  provider?: string;
}

export interface AACPhrase {
  id: string;
  category: 'Emergency' | 'Medical' | 'Assistance' | 'Everyday' | 'Custom';
  textEn: string;
  customLabel?: string;
  icon?: string;
  isQuickAccess: boolean;
  usageCount: number;
}

export interface UserSettings {
  id: string;
  targetLanguage: SupportedLanguageCode;
  speechRate: number;
  speechPitch: number;
  voiceGender: 'female' | 'male';
  accessibilityMode: AccessibilityMode;
  highContrast: boolean;
  fontSize: 'normal' | 'large' | 'xlarge';
  reducedMotion: boolean;
  autoPlayAudio: boolean;
  screenReaderAnnouncements: boolean;
}

export interface OCRResult {
  extractedText: string;
  detectedLanguage: SupportedLanguageCode | string;
  detectedLanguageName: string;
  translatedText: string;
  transliteration?: string;
  targetLanguage: SupportedLanguageCode;
  targetLanguageName: string;
  imageUrl?: string;
  provider?: string;
}

export interface SignGestureSubtitle {
  id: string;
  gestureId: string;
  gestureName: string;
  emoji: string;
  sourceText: string;
  translatedText: string;
  transliteration?: string;
  targetLanguage: SupportedLanguageCode;
  targetLanguageName: string;
  confidence: number;
  timestamp: number;
}

export type TurnDirection =
  | 'straight'
  | 'slight-right'
  | 'turn-right'
  | 'slight-left'
  | 'turn-left'
  | 'elevator'
  | 'stairs'
  | 'destination';

export interface NavigationStep {
  id: string;
  stepNumber: number;
  instruction: string;
  distanceMeters: number;
  turnDirection: TurnDirection;
  landmarkIcon: string;
  landmarkName: string;
  hazardAlert?: string;
  signCue?: string;
}

export interface WayfindingRoute {
  id: string;
  title: string;
  origin: string;
  destination: string;
  category: 'Hospital' | 'Metro' | 'Airport' | 'University' | 'City';
  totalDistanceMeters: number;
  estimatedMinutes: number;
  icon: string;
  steps: NavigationStep[];
}
