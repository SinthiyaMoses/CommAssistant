import Dexie, { type Table } from 'dexie';
import { TranslationResult, AACPhrase, ConversationTurn, UserSettings } from '../types';
import { INITIAL_AAC_PHRASES } from './phrasesData';

export class VoiceBridgeDatabase extends Dexie {
  history!: Table<TranslationResult, string>;
  phrases!: Table<AACPhrase, string>;
  conversations!: Table<ConversationTurn, string>;
  settings!: Table<UserSettings, string>;

  constructor() {
    super('VoiceBridgeDB');
    this.version(1).stores({
      history: 'id, timestamp, sourceLanguage, targetLanguage, mode',
      phrases: 'id, category, isQuickAccess, usageCount',
      conversations: 'id, timestamp, speaker, sourceLanguage, targetLanguage',
      settings: 'id',
    });
  }
}

export const db = new VoiceBridgeDatabase();

// Initialize default seed data if database is new
export const initializeDatabase = async () => {
  try {
    const phraseCount = await db.phrases.count();
    if (phraseCount === 0) {
      await db.phrases.bulkAdd(INITIAL_AAC_PHRASES);
    }

    const settingsCount = await db.settings.count();
    if (settingsCount === 0) {
      const defaultSettings: UserSettings = {
        id: 'user_preferences',
        targetLanguage: 'ta', // Default to Tamil or English as preferred
        speechRate: 1.0,
        speechPitch: 1.0,
        voiceGender: 'female',
        accessibilityMode: 'standard',
        highContrast: false,
        fontSize: 'normal',
        reducedMotion: false,
        autoPlayAudio: true,
        screenReaderAnnouncements: true,
      };
      await db.settings.add(defaultSettings);
    }
  } catch (err) {
    console.warn('Dexie DB initialization notice:', err);
  }
};
