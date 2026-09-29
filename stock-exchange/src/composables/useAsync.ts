import { ref, type Ref } from 'vue'

export interface UseAsyncState<T> {
  data: Ref<T | null>
  loading: Ref<boolean>
  error: Ref<string | null>
  execute: (...args: unknown[]) => Promise<T | null>
  reset: () => void
}

export function useAsync<T>(asyncFn: (...args: unknown[]) => Promise<T>): UseAsyncState<T> {
  const data = ref<T | null>(null) as Ref<T | null>
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)

  const execute = async (...args: unknown[]): Promise<T | null> => {
    loading.value = true
    error.value = null
    try {
      const result = await asyncFn(...args)
      data.value = result
      return result
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err ? String(err.message) : 'An error occurred'
      error.value = msg
      return null
    } finally {
      loading.value = false
    }
  }

  const reset = () => {
    data.value = null
    loading.value = false
    error.value = null
  }

  return {
    data,
    loading,
    error,
    execute,
    reset,
  }
}
