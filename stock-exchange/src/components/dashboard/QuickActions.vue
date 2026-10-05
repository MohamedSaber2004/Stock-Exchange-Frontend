<script setup lang="ts">
import { Plus, Users, Globe, HelpCircle } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <div class="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
    <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
      {{ t('dashboard.quickActions') }}
    </h3>

    <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
      <RouterLink
        to="/articles/create"
        class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer group"
      >
        <Plus class="w-3.5 h-3.5 stroke-[3] group-hover:rotate-90 transition-transform" />
        <span class="truncate">{{ t('dashboard.newArticle') }}</span>
      </RouterLink>

      <RouterLink
        to="/videos/create"
        class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer group"
      >
        <Plus class="w-3.5 h-3.5 stroke-[3] group-hover:rotate-90 transition-transform" />
        <span class="truncate">{{ t('dashboard.newVideo') }}</span>
      </RouterLink>

      <RouterLink
        to="/news/create"
        class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer group"
      >
        <Plus class="w-3.5 h-3.5 stroke-[3] group-hover:rotate-90 transition-transform" />
        <span class="truncate">{{ t('dashboard.postNews') }}</span>
      </RouterLink>

      <RouterLink
        to="/users"
        class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
      >
        <Users class="w-3.5 h-3.5 text-slate-500" />
        <span class="truncate">{{ t('dashboard.addUser') }}</span>
      </RouterLink>

      <RouterLink
        to="/countries"
        class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
      >
        <Globe class="w-3.5 h-3.5 text-slate-500" />
        <span class="truncate">{{ t('dashboard.addCountry') }}</span>
      </RouterLink>

      <RouterLink
        to="/help-center"
        class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
      >
        <HelpCircle class="w-3.5 h-3.5 text-slate-500" />
        <span class="truncate">{{ t('nav.helpCenter') }}</span>
      </RouterLink>
    </div>
  </div>
</template>
