import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const LOCALE_KEY = 'app_user_locale'

export function useLocale() {
  const i18n = useI18n()
  
  const currentLocale = computed(() => i18n.locale.value)
  const isRTL = computed(() => i18n.locale.value === 'ar')

  const setLocale = (lang: 'ar' | 'en') => {
    i18n.locale.value = lang
    localStorage.setItem(LOCALE_KEY, lang)
    localStorage.setItem('app_locale', lang)
    localStorage.setItem('app_lang', lang)
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr')
      document.documentElement.setAttribute('lang', lang)
    }
  }

  const toggleLocale = () => {
    setLocale(i18n.locale.value === 'ar' ? 'en' : 'ar')
  }

  return {
    currentLocale,
    isRTL,
    isAr: isRTL,
    setLocale,
    toggleLocale,
  }
}
