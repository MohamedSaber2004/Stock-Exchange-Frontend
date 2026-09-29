import { createI18n } from 'vue-i18n'
import ar from './locales/ar'
import en from './locales/en'

const savedLocale = localStorage.getItem('app_user_locale') || 'ar'

// Set initial document direction based on locale
if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('dir', savedLocale === 'ar' ? 'rtl' : 'ltr')
  document.documentElement.setAttribute('lang', savedLocale)
}

export const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'en',
  messages: {
    ar,
    en,
  },
})
