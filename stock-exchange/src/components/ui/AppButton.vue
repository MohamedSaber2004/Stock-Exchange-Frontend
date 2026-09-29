<script setup lang="ts">
import { computed } from 'vue'
import { Loader2 } from 'lucide-vue-next'

interface Props {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit' | 'reset'
  loading?: boolean
  disabled?: boolean
  block?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  loading: false,
  disabled: false,
  block: false,
})

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'primary':
      return 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-sm shadow-blue-500/25 font-semibold'
    case 'secondary':
      return 'bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 border border-slate-200'
    case 'danger':
      return 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-sm shadow-rose-500/25'
    case 'outline':
      return 'border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs'
    case 'ghost':
      return 'bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900'
    default:
      return ''
  }
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'px-3 py-1.5 text-xs rounded-lg gap-1.5'
    case 'lg':
      return 'px-5 py-2.5 text-base rounded-xl gap-2.5'
    case 'md':
    default:
      return 'px-4 py-2 text-sm rounded-xl gap-2'
  }
})
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="[
      'inline-flex items-center justify-center font-medium transition-all select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
      variantClasses,
      sizeClasses,
      block ? 'w-full' : '',
      disabled || loading ? 'opacity-60 cursor-not-allowed pointer-events-none' : '',
    ]"
    @click="emit('click', $event)"
  >
    <Loader2 v-if="loading" class="w-4 h-4 animate-spin text-current" />
    <slot name="prefix" />
    <slot />
    <slot name="suffix" />
  </button>
</template>
