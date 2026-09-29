import type { AppError } from '@/domain/models/common.model'
import type { TokenStore } from '../storage/token-store'

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>
  requiresAuth?: boolean
  cancelKey?: string
}

export class HttpClient {
  private baseUrl: string
  private tokenStore: TokenStore
  private activeControllers = new Map<string, AbortController>()
  private isRefreshing = false
  private refreshSubscribers: Array<(token: string) => void> = []

  constructor(tokenStore: TokenStore, baseUrl: string = '/api') {
    this.tokenStore = tokenStore
    this.baseUrl = baseUrl
  }

  setBaseUrl(url: string): void {
    this.baseUrl = url
  }

  private buildUrl(path: string, params?: RequestOptions['params']): string {
    const cleanPath = path.startsWith('http') ? path : `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`
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

    if (requiresAuth) {
      const token = this.tokenStore.getAccessToken()
      if (token) {
        headers.set('Authorization', `Bearer ${token}`)
      }
    }

    const targetUrl = this.buildUrl(path, params)

    try {
      const response = await fetch(targetUrl, {
        ...restOptions,
        headers,
      })

      if (cancelKey) {
        this.activeControllers.delete(cancelKey)
      }

      if (response.status === 401 && requiresAuth) {
        const refreshedToken = await this.handle401()
        if (refreshedToken) {
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
      if (err instanceof Error && err.name === 'AbortError') {
        throw { code: 'REQUEST_ABORTED', message: 'Request was cancelled' } as AppError
      }
      throw this.normalizeError(err)
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const isJson = response.headers.get('content-type')?.includes('application/json')
    const payload = isJson ? await response.json() : await response.text()

    if (!response.ok) {
      const error: AppError = {
        code: `HTTP_${response.status}`,
        message: payload?.message || response.statusText || 'An unexpected error occurred',
        status: response.status,
        details: isJson ? payload : undefined,
      }
      throw error
    }

    return payload as T
  }

  private async handle401(): Promise<string | null> {
    const refreshToken = this.tokenStore.getRefreshToken()
    if (!refreshToken) {
      this.tokenStore.clear()
      return null
    }

    if (this.isRefreshing) {
      return new Promise<string>((resolve) => {
        this.refreshSubscribers.push(resolve)
      })
    }

    this.isRefreshing = true
    try {
      const res = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })

      if (!res.ok) {
        this.tokenStore.clear()
        return null
      }

      const data = await res.json()
      if (data?.accessToken) {
        this.tokenStore.setTokens({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken || refreshToken,
          expiresIn: data.expiresIn || 3600,
        })
        this.refreshSubscribers.forEach((callback) => callback(data.accessToken))
        this.refreshSubscribers = []
        return data.accessToken
      }
      return null
    } catch {
      this.tokenStore.clear()
      return null
    } finally {
      this.isRefreshing = false
    }
  }

  private normalizeError(err: unknown): AppError {
    if (typeof err === 'object' && err !== null && 'code' in err && 'message' in err) {
      return err as AppError
    }
    if (err instanceof Error) {
      return { code: 'UNEXPECTED_ERROR', message: err.message }
    }
    return { code: 'UNKNOWN_ERROR', message: 'An unknown network error occurred' }
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
