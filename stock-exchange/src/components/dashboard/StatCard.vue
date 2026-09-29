<script setup lang="ts">
import { computed, type Component } from 'vue'

interface Props {
  title: string
  value: string | number
  icon?: Component
  trend?: string
  trendType?: 'up' | 'down' | 'neutral'
}

const props = withDefaults(defineProps<Props>(), {
  trendType: 'up'
})

const trendColor = computed(() => {
  if (props.trendType === 'down') return 'text-rose-600 bg-rose-50'
  if (props.trendType === 'neutral') return 'text-slate-500 bg-slate-100'
  return 'text-emerald-700 bg-emerald-50'
})
</script>

<template>
  <div class="bg-white rounded-2xl border border-slate-200/80 p-4.5 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-shadow">
    <div class="flex items-center justify-between">
      <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">{{ title }}</span>
      <div v-if="icon" class="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
        <component :is="icon" class="w-4 h-4" />
      </div>
    </div>

    <div class="mt-3">
      <div class="text-2xl font-black text-slate-900 tracking-tight">
        {{ value }}
      </div>

      <div v-if="trend" class="flex items-center gap-1.5 mt-2">
        <span
          :class="[
            'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold',
            trendColor
          ]"
        >
          {{ trend }}
        </span>
      </div>
    </div>
  </div>
</template>
