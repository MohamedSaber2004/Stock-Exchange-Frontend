<script setup lang="ts">
interface Props {
  title: string
  description?: string
}

defineProps<Props>()
</script>

<template>
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
    <div>
      <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
        {{ title }}
      </h1>
      <p v-if="description" class="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
        {{ description }}
      </p>
    </div>

    <div v-if="$slots.actions" class="flex items-center gap-2.5 sm:gap-3 flex-wrap shrink-0">
      <slot name="actions" />
    </div>
  </div>
</template>
