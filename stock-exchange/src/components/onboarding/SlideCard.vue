<script setup lang="ts">
import type { Component } from 'vue'

export interface SlideItem {
  id: number
  title: string
  description: string
  stepBadge: string
  icon: Component
  iconBg: string
}

interface Props {
  slide: SlideItem
  isActive?: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'select'): void
}>()
</script>

<template>
  <div
    @click="emit('select')"
    :class="[
      'bg-white rounded-2xl border p-4 flex flex-col items-center justify-between gap-3 text-center transition-all cursor-pointer shadow-2xs',
      isActive
        ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
        : 'border-slate-200/80 hover:border-slate-300'
    ]"
  >
    <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
      Slide {{ slide.id }}
    </div>

    <!-- Graphic / Icon Box -->
    <div :class="['w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-md', slide.iconBg]">
      <component :is="slide.icon" class="w-7 h-7" />
    </div>

    <div class="text-xs font-bold text-slate-900 leading-snug">
      {{ slide.title }}
    </div>

    <button
      type="button"
      :class="[
        'w-full py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer',
        isActive
          ? 'bg-emerald-600 text-white'
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
      ]"
    >
      Edit
    </button>
  </div>
</template>
