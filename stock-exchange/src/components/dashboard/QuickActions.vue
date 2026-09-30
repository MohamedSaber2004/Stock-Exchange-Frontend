<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <div class="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
    <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
      {{ t('dashboard.quickActions') }}
    </h3>

    <div class="flex items-center gap-2.5 sm:gap-3 flex-wrap">
      <RouterLink
        to="/articles/create"
        class="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex-1 min-w-[120px] sm:flex-initial"
      >
        <Plus class="w-3.5 h-3.5 stroke-[3]" />
        {{ t('dashboard.newArticle') }}
      </RouterLink>

      <RouterLink
        to="/videos/create"
        class="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex-1 min-w-[120px] sm:flex-initial"
      >
        <Plus class="w-3.5 h-3.5 stroke-[3]" />
        {{ t('dashboard.newVideo') }}
      </RouterLink>

      <RouterLink
        to="/news/create"
        class="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex-1 min-w-[120px] sm:flex-initial"
      >
        <Plus class="w-3.5 h-3.5 stroke-[3]" />
        {{ t('dashboard.postNews') }}
      </RouterLink>
    </div>
  </div>
</template>
