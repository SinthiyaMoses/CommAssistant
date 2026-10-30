import React, { useEffect } from 'react';
import { AccessibilityProvider } from './contexts/AccessibilityContext';
import { AudioProvider } from './contexts/AudioContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { TranslationProvider } from './contexts/TranslationContext';
import { AppShell } from './components/layout/AppShell';
import { initializeDatabase } from './services/db';

export const App: React.FC = () => {
  useEffect(() => {
    // Seed initial AAC phrases and user preferences
    initializeDatabase();
  }, []);

  return (
    <AccessibilityProvider>
      <AudioProvider>
        <LanguageProvider>
          <TranslationProvider>
            <AppShell />
          </TranslationProvider>
        </LanguageProvider>
      </AudioProvider>
    </AccessibilityProvider>
  );
};

export default App;
