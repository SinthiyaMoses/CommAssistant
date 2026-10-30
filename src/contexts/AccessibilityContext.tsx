import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AccessibilityMode, UserSettings } from '../types';
import { db } from '../services/db';

interface AccessibilityContextType {
  accessibilityMode: AccessibilityMode;
  setAccessibilityMode: (mode: AccessibilityMode) => void;
  highContrast: boolean;
  setHighContrast: (enabled: boolean) => void;
  fontSize: 'normal' | 'large' | 'xlarge';
  setFontSize: (size: 'normal' | 'large' | 'xlarge') => void;
  reducedMotion: boolean;
  setReducedMotion: (enabled: boolean) => void;
  autoPlayAudio: boolean;
  setAutoPlayAudio: (enabled: boolean) => void;
  screenReaderAnnouncements: boolean;
  setScreenReaderAnnouncements: (enabled: boolean) => void;
  announceToScreenReader: (message: string) => void;
  liveAnnouncement: string;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accessibilityMode, setAccessibilityModeState] = useState<AccessibilityMode>('standard');
  const [highContrast, setHighContrastState] = useState<boolean>(false);
  const [fontSize, setFontSizeState] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [reducedMotion, setReducedMotionState] = useState<boolean>(false);
  const [autoPlayAudio, setAutoPlayAudioState] = useState<boolean>(true);
  const [screenReaderAnnouncements, setScreenReaderAnnouncementsState] = useState<boolean>(true);
  const [liveAnnouncement, setLiveAnnouncement] = useState<string>('');

  // Load from DB
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await db.settings.get('user_preferences');
        if (settings) {
          if (settings.accessibilityMode) setAccessibilityModeState(settings.accessibilityMode);
          if (settings.highContrast !== undefined) setHighContrastState(settings.highContrast);
          if (settings.fontSize) setFontSizeState(settings.fontSize);
          if (settings.reducedMotion !== undefined) setReducedMotionState(settings.reducedMotion);
          if (settings.autoPlayAudio !== undefined) setAutoPlayAudioState(settings.autoPlayAudio);
        }
      } catch (err) {
        console.warn('Failed to load a11y settings:', err);
      }
    };
    loadSettings();
  }, []);

  // Update DOM classes for accessibility
  useEffect(() => {
    const body = document.body;
    if (highContrast) {
      body.classList.add('high-contrast-mode');
    } else {
      body.classList.remove('high-contrast-mode');
    }

    body.classList.remove('font-large', 'font-xlarge');
    if (fontSize === 'large') body.classList.add('font-large');
    if (fontSize === 'xlarge') body.classList.add('font-xlarge');
  }, [highContrast, fontSize]);

  const updateDB = async (updates: Partial<UserSettings>) => {
    try {
      await db.settings.update('user_preferences', updates);
    } catch {
      // Ignore
    }
  };

  const setAccessibilityMode = (mode: AccessibilityMode) => {
    setAccessibilityModeState(mode);
    if (mode === 'visual') {
      setHighContrastState(true);
      setFontSizeState('large');
    }
    updateDB({ accessibilityMode: mode });
  };

  const setHighContrast = (enabled: boolean) => {
    setHighContrastState(enabled);
    updateDB({ highContrast: enabled });
  };

  const setFontSize = (size: 'normal' | 'large' | 'xlarge') => {
    setFontSizeState(size);
    updateDB({ fontSize: size });
  };

  const setReducedMotion = (enabled: boolean) => {
    setReducedMotionState(enabled);
    updateDB({ reducedMotion: enabled });
  };

  const setAutoPlayAudio = (enabled: boolean) => {
    setAutoPlayAudioState(enabled);
    updateDB({ autoPlayAudio: enabled });
  };

  const setScreenReaderAnnouncements = (enabled: boolean) => {
    setScreenReaderAnnouncementsState(enabled);
    updateDB({ screenReaderAnnouncements: enabled });
  };

  const announceToScreenReader = useCallback(
    (message: string) => {
      if (screenReaderAnnouncements) {
        setLiveAnnouncement(message);
        // Clear announcement after screen reader gets it
        setTimeout(() => setLiveAnnouncement(''), 3000);
      }
    },
    [screenReaderAnnouncements]
  );

  return (
    <AccessibilityContext.Provider
      value={{
        accessibilityMode,
        setAccessibilityMode,
        highContrast,
        setHighContrast,
        fontSize,
        setFontSize,
        reducedMotion,
        setReducedMotion,
        autoPlayAudio,
        setAutoPlayAudio,
        screenReaderAnnouncements,
        setScreenReaderAnnouncements,
        announceToScreenReader,
        liveAnnouncement,
      }}
    >
      {/* ARIA Live Region for Screen Readers */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', border: 0 }}
      >
        {liveAnnouncement}
      </div>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
