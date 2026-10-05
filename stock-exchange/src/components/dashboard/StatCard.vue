<script setup lang="ts">
import { computed, type Component } from 'vue'
import { RouterLink } from 'vue-router'

interface Props {
  title: string
  value: string | number
  icon?: Component
  trend?: string
  trendType?: 'up' | 'down' | 'neutral'
  loading?: boolean
  to?: string
  subtitle?: string
  variant?: 'emerald' | 'blue' | 'indigo' | 'violet' | 'amber' | 'rose' | 'default'
}

const props = withDefaults(defineProps<Props>(), {
  trendType: 'up',
  loading: false,
  variant: 'default'
})

const trendColor = computed(() => {
  if (props.trendType === 'down') return 'text-rose-600 bg-rose-50'
  if (props.trendType === 'neutral') return 'text-slate-500 bg-slate-100'
  return 'text-emerald-700 bg-emerald-50'
})

const iconStyles = computed(() => {
  switch (props.variant) {
    case 'emerald':
      return 'bg-emerald-50 border-emerald-100 text-emerald-600'
    case 'blue':
      return 'bg-blue-50 border-blue-100 text-blue-600'
    case 'indigo':
      return 'bg-indigo-50 border-indigo-100 text-indigo-600'
    case 'violet':
      return 'bg-violet-50 border-violet-100 text-violet-600'
    case 'amber':
      return 'bg-amber-50 border-amber-100 text-amber-600'
    case 'rose':
      return 'bg-rose-50 border-rose-100 text-rose-600'
    default:
      return 'bg-slate-50 border-slate-100 text-slate-600'
  }
})
</script>

<template>
  <component
    :is="to ? RouterLink : 'div'"
    :to="to"
    :class="[
      'bg-white rounded-2xl border border-slate-200/80 p-4.5 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all relative overflow-hidden group',
      to ? 'cursor-pointer hover:border-slate-300' : ''
    ]"
  >
    <div class="flex items-center justify-between">
      <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">{{ title }}</span>
      <div
        v-if="icon"
        :class="[
          'w-8 h-8 rounded-xl border flex items-center justify-center transition-transform group-hover:scale-105',
          iconStyles
        ]"
      >
        <component :is="icon" class="w-4 h-4" />
      </div>
    </div>

    <div class="mt-3">
      <div v-if="loading" class="space-y-2">
        <div class="h-7 w-24 bg-slate-200 animate-pulse rounded-md"></div>
        <div class="h-3 w-16 bg-slate-100 animate-pulse rounded-md"></div>
      </div>
      <div v-else>
        <div class="text-2xl font-black text-slate-900 tracking-tight flex items-baseline gap-2">
          <span>{{ typeof value === 'number' ? value.toLocaleString() : value }}</span>
          <span v-if="subtitle" class="text-xs font-medium text-slate-400">
            {{ subtitle }}
          </span>
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
  </component>
</template>
