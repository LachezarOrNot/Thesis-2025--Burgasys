import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import en from '../locales/en.json';
import bg from '../locales/bg.json';
import de from '../locales/de.json';
import ru from '../locales/ru.json';

const resources = {
  en: {
    translation: en
  },
  bg: {
    translation: bg
  },
  de: {
    translation: de
  },
    ru: {
    translation: ru
}
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

export default i18n;