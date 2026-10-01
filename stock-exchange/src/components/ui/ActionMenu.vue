<script setup lang="ts">
import { MoreHorizontal } from 'lucide-vue-next'
import { ref, computed, nextTick, onMounted, onBeforeUnmount, type Component } from 'vue'
import { useI18n } from 'vue-i18n'

export interface ActionMenuItem {
  id: string
  label: string
  icon?: Component
  danger?: boolean
}

interface Props {
  items?: ActionMenuItem[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'select', itemId: string): void
}>()

const { t } = useI18n()

const defaultItems = computed<ActionMenuItem[]>(() => [
  { id: 'edit', label: t('common.edit') || 'Edit' },
  { id: 'preview', label: t('common.preview') || 'Preview' },
  { id: 'delete', label: t('common.delete') || 'Delete', danger: true }
])

const menuItems = computed(() => props.items || defaultItems.value)

const isOpen = ref(false)
const buttonRef = ref<HTMLElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)
const menuStyle = ref<{ top: string; left: string }>({ top: '0px', left: '0px' })

const updatePosition = () => {
  if (!buttonRef.value) return
  const rect = buttonRef.value.getBoundingClientRect()
  const menuWidth = 148
  const menuHeight = (menuItems.value.length * 36) + 12
  
  let top = rect.bottom + 6
  if (top + menuHeight > window.innerHeight - 10 && rect.top - menuHeight > 10) {
    top = rect.top - menuHeight - 6
  }
  
  const isRtl = document.documentElement.dir === 'rtl' || 
                document.documentElement.getAttribute('dir') === 'rtl' || 
                document.body.dir === 'rtl'
  
  let left = isRtl ? rect.left : rect.right - menuWidth
  
  // Viewport boundary constraints
  if (left < 10) left = 10
  if (left + menuWidth > window.innerWidth - 10) {
    left = window.innerWidth - menuWidth - 10
  }
  
  menuStyle.value = {
    top: `${Math.round(top)}px`,
    left: `${Math.round(left)}px`
  }
}

const toggle = async () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    await nextTick()
    updatePosition()
  }
}

const handleSelect = (id: string) => {
  isOpen.value = false
  emit('select', id)
}

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as Node
  if (
    buttonRef.value && !buttonRef.value.contains(target) &&
    dropdownRef.value && !dropdownRef.value.contains(target)
  ) {
    isOpen.value = false
  }
}

const handleScrollOrResize = () => {
  if (isOpen.value) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('scroll', handleScrollOrResize, { capture: true, passive: true })
  window.addEventListener('resize', handleScrollOrResize, { passive: true })
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('scroll', handleScrollOrResize, true)
  window.removeEventListener('resize', handleScrollOrResize)
})
</script>

<template>
  <div class="inline-block text-start">
    <button
      ref="buttonRef"
      type="button"
      @click.stop="toggle"
      class="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
    >
      <MoreHorizontal class="w-4 h-4" />
    </button>

    <!-- Teleported Dropdown Menu to prevent table overflow clipping -->
    <Teleport to="body">
      <div
        v-if="isOpen"
        ref="dropdownRef"
        :style="menuStyle"
        class="fixed w-36 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-9999 animate-in fade-in zoom-in-95 duration-100 text-start"
        @click.stop
      >
        <button
          v-for="item in menuItems"
          :key="item.id"
          type="button"
          @click="handleSelect(item.id)"
          :class="[
            'w-full text-start px-3 py-1.5 text-xs font-semibold flex items-center gap-2 hover:bg-slate-50 transition-colors cursor-pointer',
            item.danger ? 'text-rose-600 hover:bg-rose-50' : 'text-slate-700'
          ]"
        >
          <component :is="item.icon" v-if="item.icon" class="w-3.5 h-3.5 shrink-0" />
          <span>{{ item.label }}</span>
        </button>
      </div>
    </Teleport>
  </div>
</template>
