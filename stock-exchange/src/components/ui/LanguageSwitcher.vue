<script setup lang="ts">
import { Globe } from 'lucide-vue-next'
import { useLocale } from '@/composables/useLocale'

interface Props {
  variant?: 'header' | 'floating' | 'auth'
}

withDefaults(defineProps<Props>(), {
  variant: 'header'
})

const { currentLocale, toggleLocale } = useLocale()
</script>

<template>
  <button
    type="button"
    @click="toggleLocale"
    :title="currentLocale === 'ar' ? 'Switch to English' : 'التحويل إلى العربية'"
    :class="[
      'cursor-pointer select-none transition-all flex items-center gap-1.5 font-bold text-xs',
      variant === 'header' ? 'px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 shadow-2xs' :
      variant === 'auth' ? 'px-3 py-1.5 rounded-xl bg-white/80 backdrop-blur-xs border border-slate-200 text-slate-700 hover:bg-white hover:border-emerald-300 shadow-xs' :
      'p-2 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-sm'
    ]"
  >
    <Globe class="w-3.5 h-3.5 text-emerald-600" />
    <span class="tracking-wide uppercase">{{ currentLocale === 'ar' ? 'EN' : 'العربية' }}</span>
  </button>
</template>
