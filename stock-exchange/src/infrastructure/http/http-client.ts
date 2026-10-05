import type { ApiResponse, AppError } from '@/domain/models/common.model'
import { extractApiErrors } from '@/domain/models/common.model'
import type { RefreshTokenResponseDto } from '@/domain/models/user.model'
import type { TokenStore } from '../storage/token-store'

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>
  requiresAuth?: boolean
  cancelKey?: string
}

/** Interceptor called before every fetch — receives the mutable Headers object and the request path. */
export type RequestInterceptor = (headers: Headers, path: string, requiresAuth: boolean) => void | Promise<void>

export class HttpClient {
  private baseUrl: string
  private tokenStore: TokenStore
  private activeControllers = new Map<string, AbortController>()
  private isRefreshing = false
  private failedQueue: Array<{
    resolve: (token: string) => void
    reject: (error: unknown) => void
  }> = []
  private interceptors: RequestInterceptor[] = []

  private static detectedClientIp: string | null = null

  static {
    if (typeof window !== 'undefined') {
      try {
        HttpClient.detectedClientIp = window.sessionStorage.getItem('stock_client_ip')
      } catch {}

      if (!HttpClient.detectedClientIp) {
        fetch('https://api.ipify.org?format=json')
          .then((res) => res.json())
          .then((data: { ip?: string }) => {
            if (data?.ip) {
              HttpClient.detectedClientIp = data.ip
              try {
                window.sessionStorage.setItem('stock_client_ip', data.ip)
              } catch {}
            }
          })
          .catch(() => {
            // Silently ignore network failures; backend will use server/proxy headers
          })
      }
    }
  }

  constructor(
    tokenStore: TokenStore,
    baseUrl: string = import.meta.env?.VITE_API_URL || '/api/v1'
  ) {
    this.tokenStore = tokenStore
    this.baseUrl = baseUrl.replace(/\/+$/, '')
    // Register the global auth interceptor — injects Bearer token on every authenticated request
    this.addInterceptor(this.authInterceptor.bind(this))
    this.addInterceptor(this.clientIpInterceptor.bind(this))
  }

  /** Client IP interceptor: sends X-Client-IP header if detected */
  private clientIpInterceptor(headers: Headers): void {
    if (HttpClient.detectedClientIp) {
      headers.set('X-Client-IP', HttpClient.detectedClientIp)
    }
  }

  /**
   * Registers a request interceptor that runs before every fetch call.
   * Interceptors are called in registration order and can mutate the Headers object.
   */
  addInterceptor(interceptor: RequestInterceptor): void {
    this.interceptors.push(interceptor)
  }

  /** Built-in auth interceptor: always injects `Authorization: Bearer <token>` when requiresAuth=true. */
  private authInterceptor(headers: Headers, _path: string, requiresAuth: boolean): void {
    if (!requiresAuth) return
    const token = this.tokenStore.getAccessToken()
    if (token) {
      // Always overwrite to ensure we use the freshest token, not a stale one from customHeaders
      headers.set('Authorization', `Bearer ${token}`)
    }
  }

  /** Runs all registered interceptors in order on the given headers. */
  private async runInterceptors(headers: Headers, path: string, requiresAuth: boolean): Promise<void> {
    for (const interceptor of this.interceptors) {
      await interceptor(headers, path, requiresAuth)
    }
  }

  getBaseUrl(): string {
    return this.baseUrl
  }

  getServerBaseUrl(): string {
    if (this.baseUrl.startsWith('http://') || this.baseUrl.startsWith('https://')) {
      try {
        const url = new URL(this.baseUrl)
        return url.origin
      } catch {
        return this.baseUrl.replace(/\/api(\/v\d+)?\/?$/, '')
      }
    }
    return ''
  }

  setBaseUrl(url: string): void {
    this.baseUrl = url.replace(/\/+$/, '')
  }

  private buildUrl(path: string, params?: RequestOptions['params']): string {
    const cleanPath = path.startsWith('http')
      ? path
      : `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`

    if (!params) return cleanPath

    const url = new URL(cleanPath, window.location.origin)
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, String(value))
      }
    })
    return cleanPath.startsWith('http') ? url.toString() : `${url.pathname}${url.search}`
  }

  cancelRequest(key: string): void {
    const controller = this.activeControllers.get(key)
    if (controller) {
      controller.abort()
      this.activeControllers.delete(key)
    }
  }

  private isAuthBypassUrl(path: string): boolean {
    return (
      path.includes('/authentication/login') ||
      path.includes('/authentication/refresh-token') ||
      path.includes('/authentication/forget-password') ||
      path.includes('/authentication/verify-otp') ||
      path.includes('/authentication/reset-password')
    )
  }

  private processQueue(error: unknown, token: string | null = null): void {
    this.failedQueue.forEach((promise) => {
      if (token) {
        promise.resolve(token)
      } else {
        promise.reject(error)
      }
    })
    this.failedQueue = []
  }

  private handleForceLogout(): void {
    this.tokenStore.clear()
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
      window.location.href = '/login?session_expired=true'
    }
  }

  private async handle401(): Promise<string | null> {
    const refreshToken = this.tokenStore.getRefreshToken()
    if (!refreshToken) {
      this.handleForceLogout()
      return null
    }

    if (this.isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        this.failedQueue.push({ resolve, reject })
      })
    }

    this.isRefreshing = true

    try {
      const refreshUrl = this.buildUrl('/authentication/refresh-token')

      const res = await fetch(refreshUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Accept-Language': this.getCurrentLanguage(),
        },
        body: JSON.stringify({ refreshToken }),
      })

      const payload = (await res.json().catch(() => null)) as ApiResponse<RefreshTokenResponseDto> | null

      if (res.ok && payload?.success && payload.data?.accessToken) {
        const { accessToken, refreshToken: newRefreshToken } = payload.data

        // Token Rotation: تحديث التخزين بالتوكن الجديد فوراً
        this.tokenStore.setTokens({
          accessToken,
          refreshToken: newRefreshToken || refreshToken,
        })

        this.processQueue(null, accessToken)
        return accessToken
      } else {
        throw new Error(payload?.message || 'Token refresh failed')
      }
    } catch (refreshErr) {
      this.processQueue(refreshErr, null)
      this.handleForceLogout()
      return null
    } finally {
      this.isRefreshing = false
    }
  }

  private getCurrentLanguage(): 'ar' | 'en' {
    if (typeof window !== 'undefined') {
      const stored =
        localStorage.getItem('app_user_locale') ||
        localStorage.getItem('app_locale') ||
        localStorage.getItem('app_lang') ||
        document.documentElement.getAttribute('lang')
      if (stored === 'en' || stored?.startsWith('en')) {
        return 'en'
      }
    }
    return 'ar'
  }

  private async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { params, requiresAuth = true, cancelKey, headers: customHeaders, ...restOptions } = options

    if (cancelKey) {
      this.cancelRequest(cancelKey)
      const controller = new AbortController()
      this.activeControllers.set(cancelKey, controller)
      restOptions.signal = controller.signal
    }

    const headers = new Headers(customHeaders || {})
    if (!headers.has('Content-Type') && !(restOptions.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json')
    }
    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json')
    }

    // دعم اللغات التلقائي والديناميكي بناء على اللغة المختارة للمستخدم
    if (!headers.has('Accept-Language')) {
      headers.set('Accept-Language', this.getCurrentLanguage())
    }

    // تطبيق كل الـ interceptors (بما فيها الـ auth interceptor المدمج الذي يضع Bearer token)
    await this.runInterceptors(headers, path, requiresAuth)

    const targetUrl = this.buildUrl(path, params)

    try {
      const response = await fetch(targetUrl, {
        ...restOptions,
        headers,
      })

      if (cancelKey) {
        this.activeControllers.delete(cancelKey)
      }

      const originalStatus = Number(response.headers.get('x-original-status')) || response.status

      // إذا انتهت صلاحية التوكن (401) والطلب محمي وليس مسار مصادقة
      if (originalStatus === 401 && requiresAuth && !this.isAuthBypassUrl(path)) {
        const refreshedToken = await this.handle401()
        // FormData لا يمكن إعادة إرساله بعد أول استهلاك — نكتفي بتجديد التوكن فقط
        if (refreshedToken && !(restOptions.body instanceof FormData)) {
          headers.set('Authorization', `Bearer ${refreshedToken}`)
          const retryRes = await fetch(targetUrl, { ...restOptions, headers })
          return this.handleResponse<T>(retryRes)
        }
      }

      return this.handleResponse<T>(response)
    } catch (err: unknown) {
      if (cancelKey) {
        this.activeControllers.delete(cancelKey)
      }
      throw this.normalizeError(err)
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const originalStatus = Number(response.headers.get('x-original-status')) || response.status
    const isJson = response.headers.get('content-type')?.includes('application/json')
    const payload = isJson ? await response.json().catch(() => null) : await response.text().catch(() => '')

    // إذا فشل الطلب على مستوى HTTP
    if (!response.ok || originalStatus >= 400) {
      const extracted = extractApiErrors(payload)
      const error: AppError = {
        code: `HTTP_${originalStatus}`,
        message: extracted.generalMessage || response.statusText || 'An unexpected error occurred',
        status: originalStatus,
        statusCode: originalStatus,
        errors: (payload && typeof payload === 'object' && payload.errors) || undefined,
        allErrors: extracted.allErrors,
        fieldErrors: extracted.fieldErrors,
        details: payload,
      }
      throw error
    }

    // إذا أعاد السيرفر HTTP 200 ولكن success = false داخل الـ ApiResponse
    if (payload && typeof payload === 'object' && 'success' in payload && payload.success === false) {
      const extracted = extractApiErrors(payload)
      const error: AppError = {
        code: `API_ERROR_${payload.statusCode || 400}`,
        message: extracted.generalMessage || 'Operation failed',
        status: payload.statusCode || 400,
        statusCode: payload.statusCode || 400,
        errors: payload.errors,
        allErrors: extracted.allErrors,
        fieldErrors: extracted.fieldErrors,
        details: payload,
      }
      throw error
    }

    return payload as T
  }

  private normalizeError(err: unknown): AppError {
    if (typeof err === 'object' && err !== null && 'code' in err && 'message' in err) {
      return err as AppError
    }
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        return {
          code: 'REQUEST_ABORTED',
          message: 'تم إلغاء الطلب',
          statusCode: 0,
        }
      }
      return {
        code: 'NETWORK_ERROR',
        message:
          err.message === 'Failed to fetch'
            ? 'تعذر الاتصال بالخادم، يرجى التأكد من اتصال الإنترنت أو عمل السيرفر'
            : err.message,
        statusCode: 0,
      }
    }
    return {
      code: 'UNKNOWN_ERROR',
      message: 'حدث خطأ غير معروف في الاتصال بالشبكة',
      statusCode: 0,
    }
  }

  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' })
  }

  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    })
  }

  put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    })
  }

  patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body),
    })
  }

  delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE' })
  }
}
