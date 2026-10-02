import './assets/main.css'

// Silence all console outputs and API error logs globally as requested
if (typeof window !== 'undefined') {
  const noop = () => {}
  try {
    const methods = [
      'log', 'info', 'warn', 'error', 'debug', 'trace', 'table',
      'dir', 'dirxml', 'assert', 'group', 'groupCollapsed',
      'groupEnd', 'clear', 'count', 'time', 'timeEnd'
    ] as const
    methods.forEach((method) => {
      try {
        ;(window.console as unknown as Record<string, unknown>)[method] = noop
      } catch {}
    })
  } catch {}

  window.onerror = () => true
  window.onunhandledrejection = (event) => {
    event.preventDefault()
    return true
  }

  // Suppress unhandled promise rejections (including API errors) from printing in browser console
  window.addEventListener('unhandledrejection', (event) => {
    event.preventDefault()
    event.stopPropagation?.()
  })

  window.addEventListener('error', (event) => {
    event.preventDefault()
    event.stopPropagation?.()
  })
}

import { createApp, type DirectiveBinding } from 'vue'
import App from './App.vue'
import { router } from './router'
import { i18n } from './i18n'
import {
  resolveAttachmentUrl,
  DEFAULT_AVATAR_PLACEHOLDER,
  DEFAULT_IMAGE_PLACEHOLDER,
  handleImageError,
} from './utils/attachment'

const app = createApp(App)

// Suppress internal Vue errors and warnings from printing to console
app.config.errorHandler = () => {}
app.config.warnHandler = () => {}
router.onError(() => {})

// Global attachment resolver method accessible in all templates via $resolveAttachment(fileName, fallback)
app.config.globalProperties.$resolveAttachment = resolveAttachmentUrl
app.config.globalProperties.$attachmentUrl = resolveAttachmentUrl
app.config.globalProperties.$handleImageError = handleImageError

// Global directive: v-fallback-img="'avatar'" or v-fallback-img="'image'"
app.directive('fallback-img', {
  mounted(el: HTMLImageElement, binding: DirectiveBinding<string | undefined>) {
    const type = binding.value === 'avatar' ? 'avatar' : 'image'
    const placeholder = type === 'avatar' ? DEFAULT_AVATAR_PLACEHOLDER : DEFAULT_IMAGE_PLACEHOLDER

    if (!el.getAttribute('src') || el.src === window.location.href) {
      el.src = placeholder
    }

    el.addEventListener('error', () => {
      if (el.src !== placeholder) {
        el.src = placeholder
      }
    })
  },
  updated(el: HTMLImageElement, binding: DirectiveBinding<string | undefined>) {
    const type = binding.value === 'avatar' ? 'avatar' : 'image'
    const placeholder = type === 'avatar' ? DEFAULT_AVATAR_PLACEHOLDER : DEFAULT_IMAGE_PLACEHOLDER

    if (!el.getAttribute('src') || el.src === window.location.href) {
      el.src = placeholder
    }
  },
})

// Global window error listener in capture phase to guarantee fallback placeholders for ALL images across the entire app
if (typeof window !== 'undefined') {
  window.addEventListener(
    'error',
    (event: Event) => {
      const target = event.target as HTMLElement | null
      if (target && target.tagName === 'IMG') {
        const img = target as HTMLImageElement
        const isAvatar =
          img.classList.contains('rounded-full') ||
          img.alt?.toLowerCase().includes('avatar') ||
          img.alt?.toLowerCase().includes('user') ||
          img.src.includes('avatar')
        const placeholder = isAvatar ? DEFAULT_AVATAR_PLACEHOLDER : DEFAULT_IMAGE_PLACEHOLDER
        if (img.src !== placeholder) {
          img.src = placeholder
        }
      }
    },
    true // Capture phase intercepts error events on elements that do not bubble
  )
}

app.use(router)
app.use(i18n)

app.mount('#app')
