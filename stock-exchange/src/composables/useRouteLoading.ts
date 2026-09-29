import { ref, readonly } from 'vue'

const isLoading = ref(false)
const progress = ref(0)
const announcement = ref('')
let timer: ReturnType<typeof setInterval> | null = null
let finishTimeout: ReturnType<typeof setTimeout> | null = null

export function useRouteLoading() {
  const start = (destinationTitle?: string) => {
    if (finishTimeout) {
      clearTimeout(finishTimeout)
      finishTimeout = null
    }
    if (timer) {
      clearInterval(timer)
      timer = null
    }

    isLoading.value = true
    progress.value = 15

    // Accessible screen reader announcement
    announcement.value = destinationTitle
      ? `جاري الانتقال إلى ${destinationTitle}...`
      : 'جاري تحميل الصفحة...'

    // Trickle progress up to 90%
    timer = setInterval(() => {
      if (progress.value < 85) {
        progress.value += Math.floor(Math.random() * 15) + 5
      } else if (progress.value < 95) {
        progress.value += 2
      }
    }, 180)
  }

  const finish = (pageTitle?: string) => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }

    progress.value = 100
    announcement.value = pageTitle
      ? `تم تحميل صفحة ${pageTitle}`
      : 'تم تحميل الصفحة بنجاح'

    finishTimeout = setTimeout(() => {
      isLoading.value = false
      progress.value = 0
      announcement.value = ''
    }, 350)
  }

  const fail = () => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    progress.value = 100
    announcement.value = 'تعذر الانتقال إلى الصفحة المطلوبة'
    finishTimeout = setTimeout(() => {
      isLoading.value = false
      progress.value = 0
    }, 400)
  }

  return {
    isLoading: readonly(isLoading),
    progress: readonly(progress),
    announcement: readonly(announcement),
    start,
    finish,
    fail
  }
}
