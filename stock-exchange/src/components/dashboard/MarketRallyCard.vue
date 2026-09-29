<script setup lang="ts">
import { Activity } from 'lucide-vue-next'

interface Props {
  title?: string
  percentage?: string
  subtitle?: string
}

withDefaults(defineProps<Props>(), {
  title: 'Market Rally',
  percentage: '+18%',
  subtitle: 'Top Gainer'
})
</script>

<template>
  <div class="bg-white rounded-2xl border border-slate-200/80 p-4.5 flex flex-col justify-between shadow-2xs">
    <div class="flex items-center justify-between">
      <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">{{ title }}</span>
      <div class="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
        <Activity class="w-4 h-4" />
      </div>
    </div>

    <div class="mt-2 flex items-baseline justify-between">
      <div>
        <div class="text-2xl font-black text-emerald-600 tracking-tight">
          {{ percentage }}
        </div>
        <div class="text-[11px] text-slate-400 font-semibold mt-0.5">
          {{ subtitle }}
        </div>
      </div>

      <!-- Mini Chart SVG -->
      <div class="w-24 h-10">
        <svg viewBox="0 0 100 40" class="w-full h-full stroke-emerald-500 fill-none stroke-2">
          <path d="M0,35 Q20,32 40,22 T70,18 T100,5" />
          <path d="M0,35 Q20,32 40,22 T70,18 T100,5 L100,40 L0,40 Z" class="fill-emerald-500/10 stroke-none" />
        </svg>
      </div>
    </div>
  </div>
</template>
