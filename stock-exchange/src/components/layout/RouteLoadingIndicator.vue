<script setup lang="ts">
import { useRouteLoading } from '@/composables/useRouteLoading'
import { Loader2 } from 'lucide-vue-next'
import { useLocale } from '@/composables/useLocale'

const { isLoading, progress, announcement } = useRouteLoading()
const { isAr } = useLocale()
</script>

<template>
  <div>
    <!-- Screen Reader Route Announcement -->
    <div
      class="sr-only"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {{ announcement }}
    </div>

    <!-- Top Loading Progress Bar -->
    <div
      v-if="isLoading || progress > 0"
      class="fixed top-0 left-0 right-0 h-1 z-[9999] bg-emerald-100/40 pointer-events-none"
      role="progressbar"
      :aria-valuenow="progress"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-label="isAr ? 'تقدم تحميل الصفحة' : 'Page loading progress'"
    >
      <div
        class="h-full bg-linear-to-r from-emerald-500 via-teal-400 to-emerald-600 transition-all duration-200 ease-out shadow-[0_0_12px_rgba(16,185,129,0.7)] relative"
        :style="{ width: `${progress}%` }"
      >
        <!-- Glowing Tip -->
        <div class="absolute top-0 right-0 bottom-0 w-8 bg-white/40 blur-xs rounded-full" />
      </div>
    </div>

    <!-- Discreet Elegant Route Spinner Pill -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-2 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-1 scale-95"
    >
      <div
        v-if="isLoading"
        class="fixed bottom-6 end-6 z-[9990] flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/95 backdrop-blur-md border border-emerald-500/20 shadow-xl shadow-emerald-950/10 pointer-events-none"
        aria-hidden="true"
      >
        <div class="w-4 h-4 text-emerald-600 flex items-center justify-center">
          <Loader2 class="w-4 h-4 animate-spin" />
        </div>
        <span class="text-xs font-bold text-slate-800 tracking-tight">
          {{ isAr ? 'جاري تحميل الصفحة...' : 'Loading page...' }}
        </span>
      </div>
    </Transition>
  </div>
</template>
