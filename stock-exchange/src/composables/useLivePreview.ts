import { ref, computed } from 'vue'
import { coreServices } from '@/di'

let cachedCss = ''

export function useLivePreview(getEndpointUrl: () => string) {
  const previewHtml = ref('')
  const isPreviewLoading = ref(false)

  /**
   * Resolves the server base URL for static assets (like /pages/pages.css).
   * Uses coreServices.httpClient.getServerBaseUrl() or environment configuration.
   */
  const serverBaseUrl = computed(() => {
    const fromClient = coreServices.httpClient.getServerBaseUrl()
    if (fromClient) return fromClient

    const envApi = (import.meta.env?.VITE_API_URL as string | undefined)?.trim()
    if (envApi && (envApi.startsWith('http://') || envApi.startsWith('https://'))) {
      try {
        return new URL(envApi).origin
      } catch {
        // ignore
      }
    }

    return typeof window !== 'undefined' ? window.location.origin : ''
  })

  const fetchCss = async (base: string): Promise<string> => {
    if (cachedCss) return cachedCss
    try {
      const url = base ? `${base.replace(/\/+$/, '')}/pages/pages.css` : '/pages/pages.css'
      const res = await fetch(url)
      if (res.ok) {
        cachedCss = await res.text()
        return cachedCss
      }
    } catch {
      // ignore
    }
    return ''
  }

  const fetchPreviewHtml = async () => {
    const url = getEndpointUrl()
    if (!url) return

    isPreviewLoading.value = true
    try {
      const res = await fetch(url)
      if (res.ok) {
        let raw = await res.text()
        const base = serverBaseUrl.value

        // 1. Fetch and inline pages.css so it renders styled immediately without MIME or relative path issues
        const css = await fetchCss(base)
        if (css && raw.includes('</head>')) {
          raw = raw.replace('</head>', `<style>\n${css}\n</style></head>`)
        }

        // 2. Rewrite relative URLs for /pages/ and inject <base> for safety
        if (base) {
          raw = raw.replace(/href=(['"])\/pages\//g, `href=$1${base}/pages/`)
                   .replace(/src=(['"])\/pages\//g, `src=$1${base}/pages/`)

          if (raw.includes('<head>')) {
            raw = raw.replace('<head>', `<head><base href="${base}/" />`)
          }
        }

        previewHtml.value = raw
      } else {
        previewHtml.value = `<div style="padding: 2.5rem; text-align: center; color: #ef4444; font-family: sans-serif; direction: rtl;">فشل في تحميل المعاينة (رمز الحالة: ${res.status})</div>`
      }
    } catch {
      previewHtml.value = `<div style="padding: 2.5rem; text-align: center; color: #ef4444; font-family: sans-serif; direction: rtl;">تعذر الاتصال بخادم المعاينة المباشرة</div>`
    } finally {
      isPreviewLoading.value = false
    }
  }

  return {
    serverBaseUrl,
    previewHtml,
    isPreviewLoading,
    fetchPreviewHtml
  }
}
