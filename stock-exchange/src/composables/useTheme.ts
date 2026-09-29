import { ref } from 'vue'

const THEME_KEY = 'app_user_theme'
export type Theme = 'dark' | 'light'

export function useTheme() {
  const currentTheme = ref<Theme>((localStorage.getItem(THEME_KEY) as Theme) || 'dark')

  const setTheme = (theme: Theme) => {
    currentTheme.value = theme
    localStorage.setItem(THEME_KEY, theme)
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const toggleTheme = () => {
    setTheme(currentTheme.value === 'dark' ? 'light' : 'dark')
  }

  return {
    currentTheme,
    setTheme,
    toggleTheme,
  }
}
