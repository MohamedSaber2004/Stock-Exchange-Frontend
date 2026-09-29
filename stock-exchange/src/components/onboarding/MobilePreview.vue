<script setup lang="ts">
import { TrendingUp } from 'lucide-vue-next'
import type { SlideItem } from './SlideCard.vue'

interface Props {
  slides: SlideItem[]
  activeSlide: SlideItem
  activeSlideIndex: number
}

defineProps<Props>()
</script>

<template>
  <div class="w-full max-w-[280px] bg-slate-900 rounded-[38px] p-3 shadow-2xl border-4 border-slate-800 relative select-none">
    <!-- Mobile Speaker / Notch -->
    <div class="w-20 h-3.5 bg-slate-800 rounded-full mx-auto mb-3" />

    <!-- Phone Screen Screen Container -->
    <div class="bg-slate-50 rounded-[28px] overflow-hidden p-5 flex flex-col justify-between items-center text-center min-h-[440px] border border-slate-200/50 shadow-inner">
      
      <!-- Top App Branding -->
      <div class="flex items-center gap-1.5 pt-2">
        <div class="w-5 h-5 rounded-md bg-emerald-500 flex items-center justify-center text-white">
          <TrendingUp class="w-3 h-3 stroke-[2.5]" />
        </div>
        <span class="font-black text-xs text-slate-900">Fin<span class="text-emerald-600">Wise</span></span>
      </div>

      <!-- Main Illustration -->
      <div class="my-auto flex flex-col items-center gap-3">
        <div :class="['w-24 h-24 rounded-3xl flex items-center justify-center text-white shadow-xl', activeSlide.iconBg]">
          <component :is="activeSlide.icon" class="w-12 h-12 stroke-[2]" />
        </div>

        <div class="px-2">
          <h3 class="text-sm font-black text-slate-900 leading-snug">
            {{ activeSlide.title }}
          </h3>
          <p class="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
            {{ activeSlide.description }}
          </p>
        </div>
      </div>

      <!-- Bottom Steps & Dots -->
      <div class="w-full flex flex-col items-center gap-3 pb-2">
        <span class="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-bold tracking-widest uppercase">
          {{ activeSlide.stepBadge }}
        </span>

        <!-- Pagination Dots -->
        <div class="flex items-center gap-1.5">
          <span
            v-for="(s, sIdx) in slides"
            :key="s.id"
            :class="[
              'h-1.5 rounded-full transition-all',
              activeSlideIndex === sIdx ? 'w-4 bg-emerald-600' : 'w-1.5 bg-slate-300'
            ]"
          />
        </div>
      </div>

    </div>

    <!-- Home Bar Indicator -->
    <div class="w-24 h-1 bg-slate-700 rounded-full mx-auto mt-3" />
  </div>
</template>
