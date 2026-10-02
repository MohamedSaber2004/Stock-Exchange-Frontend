<script setup lang="ts">
import AppHeader from './AppHeader.vue'
import AppSidebar from './AppSidebar.vue'

interface Props {
  withSidebar?: boolean
}

withDefaults(defineProps<Props>(), {
  withSidebar: true,
})
</script>

<template>
  <div class="h-screen min-h-[100dvh] w-full bg-slate-50/70 text-slate-900 flex overflow-hidden selection:bg-emerald-500/20 selection:text-emerald-900">
    <AppSidebar v-if="withSidebar" />

    <div class="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
      <AppHeader />

      <main class="flex-1 overflow-y-auto p-3.5 sm:p-6 lg:p-8 bg-slate-50/50">
        <slot />
      </main>
    </div>
  </div>
</template>

