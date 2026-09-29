import { ref, watch, type Ref } from 'vue'

export function useDebounce<T>(source: Ref<T>, delayMs: number = 300): Ref<T> {
  const debounced = ref(source.value) as Ref<T>
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  watch(source, (newVal) => {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      debounced.value = newVal
    }, delayMs)
  })

  return debounced
}
