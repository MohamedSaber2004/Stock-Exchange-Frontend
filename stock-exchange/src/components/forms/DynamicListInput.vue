<script setup lang="ts">
import { Check, Plus, Trash2 } from 'lucide-vue-next'
import { ref } from 'vue'

interface Props {
  modelValue?: string[]
  label?: string
  placeholder?: string
  buttonText?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  label: 'Benefits',
  placeholder: 'e.g. Daily market news',
  buttonText: 'Add Benefit'
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void
}>()

const newItem = ref('')

const addItem = () => {
  if (newItem.value.trim()) {
    const updated = [...props.modelValue, newItem.value.trim()]
    emit('update:modelValue', updated)
    newItem.value = ''
  }
}

const removeItem = (index: number) => {
  const updated = props.modelValue.filter((_, i) => i !== index)
  emit('update:modelValue', updated)
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <label v-if="label" class="text-xs font-bold text-slate-700">
      {{ label }}
    </label>

    <!-- Existing List Items -->
    <div class="flex flex-col gap-2">
      <div
        v-for="(item, idx) in modelValue"
        :key="idx"
        class="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-800"
      >
        <div class="flex items-center gap-2.5">
          <div class="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <Check class="w-2.5 h-2.5 stroke-[3]" />
          </div>
          <span>{{ item }}</span>
        </div>

        <button
          type="button"
          @click="removeItem(idx)"
          class="text-slate-400 hover:text-rose-500 p-1 transition-colors cursor-pointer"
        >
          <Trash2 class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <!-- Add New Item Row -->
    <div class="flex items-center gap-2 mt-1">
      <input
        v-model="newItem"
        type="text"
        :placeholder="placeholder"
        @keydown.enter.prevent="addItem"
        class="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
      />
      <button
        type="button"
        @click="addItem"
        class="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-emerald-200 shrink-0"
      >
        <Plus class="w-3.5 h-3.5 stroke-[3]" />
        {{ buttonText }}
      </button>
    </div>
  </div>
</template>
