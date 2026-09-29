<script setup lang="ts">
import { Edit3 } from 'lucide-vue-next'
import type { SlideItem } from './SlideCard.vue'

interface Props {
  slide: SlideItem
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:slide', updated: SlideItem): void
  (e: 'save'): void
}>()

const updateField = <K extends keyof SlideItem>(field: K, val: SlideItem[K]) => {
  emit('update:slide', {
    ...props.slide,
    [field]: val
  })
}
</script>

<template>
  <div class="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs flex flex-col gap-5">
    <div class="flex items-center justify-between border-b border-slate-100 pb-3">
      <h2 class="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
        <Edit3 class="w-3.5 h-3.5 text-emerald-600" />
        Slide {{ slide.id }} Editor
      </h2>
      <span class="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
        {{ slide.stepBadge }}
      </span>
    </div>

    <!-- Title -->
    <div class="flex flex-col gap-1.5">
      <label class="text-xs font-bold text-slate-700">Headline *</label>
      <input
        :value="slide.title"
        @input="updateField('title', ($event.target as HTMLInputElement).value)"
        type="text"
        class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
      />
    </div>

    <!-- Description -->
    <div class="flex flex-col gap-1.5">
      <label class="text-xs font-bold text-slate-700">Description *</label>
      <textarea
        :value="slide.description"
        @input="updateField('description', ($event.target as HTMLTextAreaElement).value)"
        rows="3"
        class="w-full bg-slate-50/50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 resize-none"
      ></textarea>
    </div>

    <!-- Step Badge -->
    <div class="flex flex-col gap-1.5">
      <label class="text-xs font-bold text-slate-700">Step Badge</label>
      <input
        :value="slide.stepBadge"
        @input="updateField('stepBadge', ($event.target as HTMLInputElement).value)"
        type="text"
        class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
      />
    </div>

    <!-- Save Action -->
    <div class="pt-3 flex justify-end">
      <button
        type="button"
        @click="emit('save')"
        class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer"
      >
        Save Changes
      </button>
    </div>
  </div>
</template>
