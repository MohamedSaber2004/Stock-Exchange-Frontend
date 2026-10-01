import { ref } from 'vue'
import { hasAdminRole, type AuthTokens, type User } from '@/domain/models/user.model'

const ACCESS_TOKEN_COOKIE = 'admin_access_token'
const REFRESH_TOKEN_COOKIE = 'admin_refresh_token'
const USER_KEY = 'admin_user'

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const nameEQ = `${encodeURIComponent(name)}=`
  const ca = document.cookie.split(';')
  for (let i = 0; i < ca.length; i++) {
    const c = ca[i]?.trim() || ''
    if (c.indexOf(nameEQ) === 0) {
      return decodeURIComponent(c.substring(nameEQ.length))
    }
  }
  return null
}

function setCookie(name: string, value: string, maxAgeSeconds: number = 30 * 24 * 60 * 60): void {
  if (typeof document === 'undefined') return
  const isSecure = typeof location !== 'undefined' && location.protocol === 'https:'
  const secureFlag = isSecure ? '; Secure' : ''
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Strict${secureFlag}`
}

function removeCookie(name: string): void {
  if (typeof document === 'undefined') return
  const isSecure = typeof location !== 'undefined' && location.protocol === 'https:'
  const secureFlag = isSecure ? '; Secure' : ''
  document.cookie = `${encodeURIComponent(name)}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict${secureFlag}`
}

export class TokenStore {
  private memoryAccessToken: string | null = null
  private memoryRefreshToken: string | null = null
  private userRef = ref<User | null>(null)

  constructor() {
    this.memoryAccessToken = getCookie(ACCESS_TOKEN_COOKIE)
    this.memoryRefreshToken = getCookie(REFRESH_TOKEN_COOKIE)
    this.userRef.value = this.readUserFromStorage()

    // تنظيف أي توكنات قديمة كانت مخزنة في localStorage لضمان وجودها في الـ cookies فقط
    this.purgeLocalStorageTokens()
  }

  private purgeLocalStorageTokens(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('admin_access_token')
      localStorage.removeItem('admin_refresh_token')
      localStorage.removeItem('app_access_token')
      localStorage.removeItem('app_refresh_token')
    }
  }

  getAccessToken(): string | null {
    return this.memoryAccessToken || getCookie(ACCESS_TOKEN_COOKIE)
  }

  getRefreshToken(): string | null {
    return this.memoryRefreshToken || getCookie(REFRESH_TOKEN_COOKIE)
  }

  setTokens(tokens: AuthTokens): void {
    this.memoryAccessToken = tokens.accessToken
    this.memoryRefreshToken = tokens.refreshToken

    // حفظ التوكنات الحساسة في الـ Cookies فقط مع إعدادات الأمان الصارمة
    setCookie(ACCESS_TOKEN_COOKIE, tokens.accessToken)
    setCookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken)

    // التأكد التام من عدم كتابة التوكنات في localStorage
    this.purgeLocalStorageTokens()
  }

  private readUserFromStorage<T = User>(): T | null {
    if (typeof localStorage === 'undefined') return null
    const raw = localStorage.getItem(USER_KEY) || localStorage.getItem('app_user_data')
    if (!raw) return null
    try {
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  }

  getUser<T = User>(): T | null {
    // Tracking this.userRef.value ensures Vue computed properties (like in AppHeader) update reactively
    return (this.userRef.value as unknown as T) || this.readUserFromStorage<T>()
  }

  setUser(user: User): void {
    this.userRef.value = user
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    }
  }

  clear(): void {
    this.memoryAccessToken = null
    this.memoryRefreshToken = null
    this.userRef.value = null

    // حذف التوكنات من الـ Cookies فوراً
    removeCookie(ACCESS_TOKEN_COOKIE)
    removeCookie(REFRESH_TOKEN_COOKIE)

    // تنظيف بيانات المستخدم وأي بقايا توكنات
    this.purgeLocalStorageTokens()
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(USER_KEY)
      localStorage.removeItem('app_user_data')
    }
  }

  hasValidToken(): boolean {
    return Boolean(this.getAccessToken())
  }

  isAdmin(): boolean {
    const user = this.getUser()
    if (!user) return false
    return hasAdminRole(user.roles || user.role)
  }
}
