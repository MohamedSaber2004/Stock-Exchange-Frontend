<script setup lang="ts">
interface Props {
  modelValue?: string | number
  label?: string
  placeholder?: string
  type?: string
  error?: string
  hint?: string
  disabled?: boolean
  required?: boolean
}

withDefaults(defineProps<Props>(), {
  modelValue: '',
  type: 'text',
  placeholder: '',
  disabled: false,
  required: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'blur', event: FocusEvent): void
}>()
</script>

<template>
  <div class="flex flex-col gap-1.5 w-full text-start">
    <label v-if="label" class="text-xs font-semibold text-slate-700 flex items-center justify-between">
      <span>
        {{ label }}
        <span v-if="required" class="text-rose-500">*</span>
      </span>
      <span v-if="hint" class="text-slate-400 font-normal">{{ hint }}</span>
    </label>

    <div class="relative flex items-center">
      <div v-if="$slots.prefix" class="absolute start-3 text-slate-400 flex items-center pointer-events-none">
        <slot name="prefix" />
      </div>

      <input
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :class="[
          'w-full bg-white border rounded-xl text-sm text-slate-900 placeholder-slate-400 shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 py-2.5',
          $slots.prefix ? 'ps-10' : 'ps-3.5',
          $slots.suffix ? 'pe-10' : 'pe-3.5',
          error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20' : 'border-slate-300 hover:border-slate-400 focus:border-blue-600',
          disabled ? 'opacity-60 cursor-not-allowed bg-slate-100' : '',
        ]"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @blur="emit('blur', $event)"
      />

      <div v-if="$slots.suffix" class="absolute end-3 text-slate-400 flex items-center">
        <slot name="suffix" />
      </div>
    </div>

    <p v-if="error" class="text-xs text-rose-500 mt-0.5">
      {{ error }}
    </p>
  </div>
</template>
