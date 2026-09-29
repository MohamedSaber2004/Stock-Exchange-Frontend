<script setup lang="ts">
import { 
  Bold, 
  Italic, 
  Underline, 
  Quote, 
  Link as LinkIcon, 
  List, 
  ListOrdered 
} from 'lucide-vue-next'
import { ref } from 'vue'

interface Props {
  modelValue?: string
  label?: string
  placeholder?: string
  rows?: number
}

withDefaults(defineProps<Props>(), {
  modelValue: '',
  label: 'Content',
  placeholder: 'Write your content here...',
  rows: 6
})

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
}>()

const activeAction = ref<string | null>(null)

const applyFormat = (action: string) => {
  activeAction.value = activeAction.value === action ? null : action
}
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label v-if="label" class="text-xs font-bold text-slate-700">
      {{ label }}
    </label>

    <div class="border border-slate-200 rounded-2xl overflow-hidden bg-white focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all">
      <!-- Toolbar -->
      <div class="flex items-center gap-1 p-2 border-b border-slate-100 bg-slate-50/60 flex-wrap">
        <button
          type="button"
          @click="applyFormat('bold')"
          :class="['p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors', activeAction === 'bold' ? 'bg-slate-200 text-slate-900 font-bold' : '']"
          title="Bold"
        >
          <Bold class="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          @click="applyFormat('italic')"
          :class="['p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors', activeAction === 'italic' ? 'bg-slate-200 text-slate-900' : '']"
          title="Italic"
        >
          <Italic class="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          @click="applyFormat('underline')"
          :class="['p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors', activeAction === 'underline' ? 'bg-slate-200 text-slate-900' : '']"
          title="Underline"
        >
          <Underline class="w-3.5 h-3.5" />
        </button>

        <div class="w-px h-4 bg-slate-200 mx-1" />

        <button
          type="button"
          @click="applyFormat('h1')"
          class="px-2 py-1 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
          title="Heading 1"
        >
          H1
        </button>

        <button
          type="button"
          @click="applyFormat('h2')"
          class="px-2 py-1 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
          title="Heading 2"
        >
          H2
        </button>

        <div class="w-px h-4 bg-slate-200 mx-1" />

        <button
          type="button"
          @click="applyFormat('quote')"
          class="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
          title="Quote"
        >
          <Quote class="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          @click="applyFormat('link')"
          class="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
          title="Insert Link"
        >
          <LinkIcon class="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          @click="applyFormat('list')"
          class="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
          title="Bullet List"
        >
          <List class="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          @click="applyFormat('orderedList')"
          class="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
          title="Numbered List"
        >
          <ListOrdered class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- Editor Area -->
      <textarea
        :value="modelValue"
        @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
        :placeholder="placeholder"
        :rows="rows"
        class="w-full p-3.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none resize-y"
      ></textarea>
    </div>
  </div>
</template>
