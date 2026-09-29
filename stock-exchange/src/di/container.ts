export type Constructor<T = unknown> = new (...args: unknown[]) => T
export type Factory<T = unknown> = () => T

export class DIContainer {
  private services = new Map<unknown, unknown>()
  private factories = new Map<unknown, Factory<unknown>>()

  register<T>(token: unknown, factory: Factory<T>): void {
    this.factories.set(token, factory as Factory<unknown>)
    this.services.delete(token)
  }

  registerInstance<T>(token: unknown, instance: T): void {
    this.services.set(token, instance)
  }

  resolve<T>(token: unknown): T {
    if (this.services.has(token)) {
      return this.services.get(token) as T
    }

    const factory = this.factories.get(token)
    if (!factory) {
      throw new Error(`[DIContainer] No provider registered for token: ${String(token)}`)
    }

    const instance = factory()
    this.services.set(token, instance)
    return instance as T
  }

  reset(): void {
    this.services.clear()
    this.factories.clear()
  }
}

export const container = new DIContainer()
