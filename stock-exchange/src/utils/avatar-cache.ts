/**
 * Global In-Memory User Avatar Cache
 * Remembers resolved avatar URLs by userId and userEmail
 * across activity logs, dashboard activities, and user operations.
 */
class UserAvatarCache {
  private cache = new Map<string, string>()
  private inFlight = new Map<string, Promise<string | null>>()

  private normalizeKey(key?: string | null): string {
    return (key || '').trim().toLowerCase()
  }

  get(userId?: string | null, email?: string | null): string | null {
    if (userId) {
      const found = this.cache.get(this.normalizeKey(userId))
      if (found) return found
    }
    if (email) {
      const found = this.cache.get(this.normalizeKey(email))
      if (found) return found
    }
    return null
  }

  set(userId?: string | null, email?: string | null, avatarUrl?: string | null): void {
    if (!avatarUrl || typeof avatarUrl !== 'string' || !avatarUrl.trim()) return
    const cleanUrl = avatarUrl.trim()
    if (userId && userId.trim()) {
      this.cache.set(this.normalizeKey(userId), cleanUrl)
    }
    if (email && email.trim()) {
      this.cache.set(this.normalizeKey(email), cleanUrl)
    }
  }

  async fetchAndCache(
    userId?: string | null,
    fetchFn?: (id: string) => Promise<string | null | undefined>
  ): Promise<string | null> {
    if (!userId || !userId.trim() || !fetchFn) return null
    const normId = this.normalizeKey(userId)
    const existing = this.cache.get(normId)
    if (existing) return existing

    if (this.inFlight.has(normId)) {
      return this.inFlight.get(normId)!
    }

    const promise = (async () => {
      try {
        const url = await fetchFn(userId)
        if (url && typeof url === 'string' && url.trim()) {
          this.set(userId, null, url.trim())
          return url.trim()
        }
      } catch {
        // Silently ignore network or not-found errors
      } finally {
        this.inFlight.delete(normId)
      }
      return null
    })()

    this.inFlight.set(normId, promise)
    return promise
  }
}

export const userAvatarCache = new UserAvatarCache()
