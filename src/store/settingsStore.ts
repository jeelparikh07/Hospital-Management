'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Settings } from '@/types';

const defaultSettings: Settings = {
  general: {
    systemName: 'QueueMed',
    defaultLanguage: 'English',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
  },
  appearance: {
    darkMode: false,
    primaryColor: '#0EA5E9',
    sidebarStyle: 'Full',
    animations: true,
  },
  queue: {
    tokenPrefix: 'TKN',
    maxTokensPerDay: 100,
    tokenResetTime: '00:00',
    allowWalkIns: true,
    defaultAppointmentDuration: 15,
  },
  security: {
    sessionTimeout: 30,
  },
};

interface SettingsState {
  settings: Settings;
  updateSettings: (section: keyof Settings, values: Partial<Settings[keyof Settings]>) => void;
  resetSettings: () => void;
  getSettings: () => Settings;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,

      updateSettings: (section, values) => {
        set((state) => ({
          settings: {
            ...state.settings,
            [section]: {
              ...state.settings[section],
              ...values,
            },
          },
        }));
      },

      resetSettings: () => {
        set({ settings: defaultSettings });
      },

      getSettings: () => {
        return get().settings;
      },
    }),
    {
      name: 'queuemed_settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Helper to apply dark mode
export const applyDarkMode = (isDark: boolean) => {
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

// Helper to save settings
export const saveSettings = (settings: Settings) => {
  localStorage.setItem('queuemed_settings', JSON.stringify(settings));
  applyDarkMode(settings.appearance.darkMode);
};

// Helper to load settings
export const loadSettings = (): Settings => {
  try {
    const stored = localStorage.getItem('queuemed_settings');
    if (stored) {
      const settings = JSON.parse(stored);
      applyDarkMode(settings.appearance.darkMode);
      return settings;
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
  return defaultSettings;
};
