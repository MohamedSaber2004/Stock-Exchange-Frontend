/**
 * Global SVG Data URI Fallbacks (Self-contained, always works offline/without network)
 */
export const DEFAULT_AVATAR_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120' width='120' height='120'%3E%3Cdefs%3E%3ClinearGradient id='bg' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23059669'/%3E%3Cstop offset='100%25' stop-color='%230d9488'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='120' height='120' rx='32' fill='url(%23bg)'/%3E%3Ccircle cx='60' cy='46' r='19' fill='%23ffffff' opacity='0.92'/%3E%3Cpath d='M28 100 C28 78 42 72 60 72 C78 72 92 78 92 100 Z' fill='%23ffffff' opacity='0.92'/%3E%3C/svg%3E"

export const DEFAULT_IMAGE_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300' width='400' height='300'%3E%3Crect width='400' height='300' rx='16' fill='%23f8fafc' stroke='%23cbd5e1' stroke-width='2' stroke-dasharray='6 6'/%3E%3Cg transform='translate(160, 100)' fill='none' stroke='%2394a3b8' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='0' y='0' width='80' height='64' rx='8'/%3E%3Ccircle cx='24' cy='22' r='7' fill='%2394a3b8'/%3E%3Cpath d='M6 56 L30 32 L46 48 L56 38 L74 56'/%3E%3C/g%3E%3Ctext x='200' y='200' text-anchor='middle' font-family='system-ui, sans-serif' font-size='13' font-weight='600' fill='%2394a3b8'%3ENo Image Available%3C/text%3E%3C/svg%3E"

/**
 * Checks whether a URL is a static/external link (like youtube.com, external website)
 * rather than a dynamic uploaded attachment or local blob.
 */
export function isStaticUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false
  const trimmed = url.trim()
  if (!trimmed) return false
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) return false
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    // If it points to our dynamic /files/ endpoint, it is dynamic
    return !trimmed.includes('/files/')
  }
  return false
}

/**
 * Returns clean attachment name or empty string if input is a static/external link.
 */
export function sanitizeAttachmentName(fileName?: string | null): string {
  if (!fileName || typeof fileName !== 'string') return ''
  const trimmed = fileName.trim()
  if (isStaticUrl(trimmed)) return ''
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) return trimmed
  let cleanName = trimmed.replace(/^\.?\/+/, '')
  if (cleanName.startsWith('files/')) {
    cleanName = cleanName.substring(6).replace(/^\/+/, '')
  }
  return cleanName
}

/**
 * Resolves any backend file path to a fully qualified URL,
 * or returns the appropriate global placeholder if no image exists.
 */
export function resolveAttachmentUrl(
  fileName?: string | null,
  fallback?: 'avatar' | 'image' | string
): string {
  const getFallback = () => {
    if (!fallback) return ''
    if (fallback === 'avatar') return DEFAULT_AVATAR_PLACEHOLDER
    if (fallback === 'image') return DEFAULT_IMAGE_PLACEHOLDER
    return fallback
  }

  if (!fileName || typeof fileName !== 'string') {
    return getFallback()
  }

  const trimmed = fileName.trim()
  if (!trimmed) {
    return getFallback()
  }

  // Reject static/external links (like YouTube or third-party web links)
  if (isStaticUrl(trimmed)) {
    return getFallback()
  }

  // Local object URLs or Data URIs
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed
  }

  // If already an absolute URL to /files/
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }

  let cleanName = trimmed.replace(/^\.?\/+/, '')
  if (cleanName.startsWith('files/')) {
    cleanName = cleanName.substring(6).replace(/^\/+/, '')
  }

  if (!cleanName) {
    return getFallback()
  }

  const explicitFileUrl = (import.meta.env?.VITE_FILE_URL as string | undefined)?.trim()
  if (explicitFileUrl) {
    return `${explicitFileUrl.replace(/\/+$/, '')}/files/${cleanName}`
  }

  // If a custom base URL was provided via fallback param (e.g. from HttpClient or explicit param)
  if (fallback && (fallback.startsWith('http://') || fallback.startsWith('https://'))) {
    try {
      const parsed = new URL(fallback)
      return `${parsed.origin}/files/${cleanName}`
    } catch {
      const stripped = fallback.replace(/\/api(\/v\d+)?\/?$/, '').replace(/\/+$/, '')
      return `${stripped}/files/${cleanName}`
    }
  }

  const rawBase = (import.meta.env?.VITE_API_URL || '').trim()

  if (rawBase.startsWith('http://') || rawBase.startsWith('https://')) {
    try {
      const parsed = new URL(rawBase)
      return `${parsed.origin}/files/${cleanName}`
    } catch {
      const stripped = rawBase.replace(/\/api(\/v\d+)?\/?$/, '').replace(/\/+$/, '')
      return `${stripped}/files/${cleanName}`
    }
  }

  return `/files/${cleanName}`
}

/**
 * Global image error handler to attach to @error on <img> tags.
 * Replaces broken images with the fallback placeholder, avoiding infinite loops.
 */
export function handleImageError(
  event: Event,
  fallbackType: 'avatar' | 'image' = 'image'
): void {
  const target = event.target as HTMLImageElement
  if (!target) return

  const fallbackUrl =
    fallbackType === 'avatar' ? DEFAULT_AVATAR_PLACEHOLDER : DEFAULT_IMAGE_PLACEHOLDER

  if (target.src !== fallbackUrl) {
    target.src = fallbackUrl
  }
}

/**
 * Cleans phone numbers by stripping duplicate country dialing codes and national trunk zeros,
 * since the country code is already shown and acts as the complement.
 */
export function getCleanPhoneInfo(
  phone?: string | null,
  countryCode?: string | null
): {
  code: string
  cleanNumber: string
  hasPhone: boolean
  display: string
} {
  const code = (countryCode || '').trim() // e.g. "+20"
  const digitsOnlyCode = code.replace(/\D/g, '') // e.g. "20"

  if (!phone || typeof phone !== 'string') {
    return {
      code,
      cleanNumber: '',
      hasPhone: false,
      display: code ? `${code} -` : '-'
    }
  }

  let raw = phone.trim().replace(/[\s\-()]/g, '')

  // Remove leading plus or 00
  if (raw.startsWith('+')) {
    raw = raw.substring(1)
  } else if (raw.startsWith('00')) {
    raw = raw.substring(2)
  }

  // Remove duplicated country code digits from the start
  if (digitsOnlyCode && raw.startsWith(digitsOnlyCode)) {
    raw = raw.substring(digitsOnlyCode.length)
  }

  // Remove national trunk prefix '0' (e.g. 0100... becomes 100...)
  while (raw.startsWith('0')) {
    raw = raw.substring(1)
  }

  if (!raw) {
    return {
      code,
      cleanNumber: '',
      hasPhone: false,
      display: code ? `${code} -` : '-'
    }
  }

  // Format clean local number with non-breaking spaces for readability (e.g. "100 123 4567")
  const formatted = raw.replace(/(\d{3})(?=\d)/g, '$1\u00A0').trim()

  return {
    code,
    cleanNumber: formatted,
    hasPhone: true,
    display: code ? `${code}\u00A0${formatted}` : formatted
  }
}

export const getAttachmentUrl = resolveAttachmentUrl
export const resolveAttachment = resolveAttachmentUrl

export default resolveAttachmentUrl
