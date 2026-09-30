<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, X } from 'lucide-vue-next'
import AppShell from '@/components/layout/AppShell.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import TableFilterBar from '@/components/data-table/TableFilterBar.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import ActionMenu from '@/components/ui/ActionMenu.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import { useFeedback } from '@/composables/useFeedback'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { confirm, toast } = useFeedback()
const { t, locale } = useI18n()
const isAr = computed(() => locale.value === 'ar')

const search = ref('')
const selectedBadge = ref('')
const currentPage = ref(1)

const filters = computed(() => [
  {
    id: 'badge',
    label: t('news.badgeCol'),
    value: selectedBadge.value,
    options: [
      { label: t('news.badgeLive'), value: 'LIVE' },
      { label: t('news.badgeBreaking'), value: 'BREAKING' },
      { label: t('news.badgeUpdate'), value: 'UPDATE' },
    ]
  }
])

const getBadgeLabel = (b: string) => {
  if (b === 'LIVE') return t('news.badgeLive')
  if (b === 'BREAKING') return t('news.badgeBreaking')
  if (b === 'UPDATE') return t('news.badgeUpdate')
  return b
}

const handleFilterChange = (filterId: string, val: string) => {
  if (filterId === 'badge') selectedBadge.value = val
}

interface MarketNews {
  id: string
  headline: string
  badge: 'LIVE' | 'BREAKING' | 'UPDATE'
  source: string
  published: string
  summary?: string
}

const newsList = ref<MarketNews[]>([
  {
    id: 'news-1',
    headline: 'Global markets react as inflation cools down across key sectors',
    badge: 'LIVE',
    source: 'FinWise Editorial',
    published: '10:42 AM',
    summary: 'Major indices recorded stable momentum following quarterly inflation reports.'
  },
  {
    id: 'news-2',
    headline: 'Inflation shows signs of easing across major energy sectors',
    badge: 'BREAKING',
    source: 'Market Analyst Team',
    published: 'Yesterday',
    summary: 'Fuel prices and supply chain stabilization contributed to the overall ease.'
  },
  {
    id: 'news-3',
    headline: 'Central bank signals interest rate stability in upcoming session',
    badge: 'BREAKING',
    source: 'Official Bulletin',
    published: 'Yesterday',
    summary: 'Monetary policy committee members discussed liquidity and inflation targets.'
  },
  {
    id: 'news-4',
    headline: 'Tech sector companies lead quarterly enterprise earnings',
    badge: 'UPDATE',
    source: 'FinWise Research',
    published: 'Sep 21, 2025',
    summary: 'Software and AI hardware divisions reported stronger than expected cash flows.'
  }
])

const filteredNews = computed(() => {
  return newsList.value.filter(n => {
    const matchesSearch = !search.value || 
      n.headline.toLowerCase().includes(search.value.toLowerCase()) ||
      n.source.toLowerCase().includes(search.value.toLowerCase())
    const matchesBadge = !selectedBadge.value || n.badge === selectedBadge.value
    return matchesSearch && matchesBadge
  })
})

// Modal States
const isEditModalOpen = ref(false)
const editingItem = ref<MarketNews | null>(null)
const isPreviewModalOpen = ref(false)
const previewingItem = ref<MarketNews | null>(null)

const handleAction = async (actionId: string, item: MarketNews) => {
  if (actionId === 'edit') {
    editingItem.value = { ...item }
    isEditModalOpen.value = true
  } else if (actionId === 'preview') {
    previewingItem.value = item
    isPreviewModalOpen.value = true
  } else if (actionId === 'delete') {
    const ok = await confirm({
      title: t('news.deleteConfirmTitle'),
      message: `${t('news.deleteConfirmDesc')} ("${item.headline}")`,
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      type: 'danger'
    })
    if (ok) {
      newsList.value = newsList.value.filter(n => n.id !== item.id)
      toast.success(isAr.value ? 'تم حذف الخبر بنجاح' : 'News item deleted successfully')
    }
  }
}

const saveEditModal = () => {
  if (editingItem.value) {
    const idx = newsList.value.findIndex(n => n.id === editingItem.value!.id)
    if (idx !== -1) {
      newsList.value[idx] = { ...editingItem.value }
      toast.success(isAr.value ? 'تم حفظ التعديلات بنجاح' : 'Changes saved successfully')
    }
    isEditModalOpen.value = false
  }
}
</script>

<template>
  <AppShell>
    <div class="flex flex-col max-w-7xl mx-auto">
      <PageHeader
        :title="t('news.title')"
        :description="t('news.subtitle')"
      >
        <template #actions>
          <button
            type="button"
            @click="router.push('/news/create')"
            class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus class="w-3.5 h-3.5 stroke-[3]" />
            {{ t('news.postNews') }}
          </button>
        </template>
      </PageHeader>

      <!-- Table Box -->
      <div class="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
        <!-- Filter Bar -->
        <TableFilterBar
          :search-placeholder="t('news.searchPlaceholder')"
          v-model:search-value="search"
          :filters="filters"
          @update:filter="handleFilterChange"
        />

        <!-- Data Table -->
        <div class="overflow-x-auto">
          <table class="w-full text-start text-xs min-w-[650px]">
            <thead>
              <tr class="text-[11px] font-bold text-slate-400 border-b border-slate-100 uppercase tracking-wider bg-slate-50/50">
                <th class="py-3 px-4 text-start">{{ t('news.headlineCol') }}</th>
                <th class="py-3 px-4 text-start">{{ t('news.badgeCol') }}</th>
                <th class="py-3 px-4 text-start">{{ t('news.sourceCol') || 'Source' }}</th>
                <th class="py-3 px-4 text-start">{{ t('news.publishedCol') }}</th>
                <th class="py-3 px-4 text-end">{{ t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="item in filteredNews"
                :key="item.id"
                class="hover:bg-slate-50/60 transition-colors"
              >
                <!-- Headline -->
                <td class="py-3.5 px-4 font-bold text-slate-900 max-w-md text-start">
                  {{ item.headline }}
                </td>

                <!-- Badge -->
                <td class="py-3.5 px-4 text-start">
                  <StatusBadge :status="item.badge">
                    {{ getBadgeLabel(item.badge) }}
                  </StatusBadge>
                </td>

                <!-- Source -->
                <td class="py-3.5 px-4 text-slate-600 font-medium text-start">
                  {{ item.source }}
                </td>

                <!-- Published Time -->
                <td class="py-3.5 px-4 text-slate-500 font-medium text-start">{{ item.published }}</td>

                <!-- Actions Menu -->
                <td class="py-3.5 px-4 text-end">
                  <ActionMenu
                    :items="[
                      { id: 'preview', label: t('news.previewNews') },
                      { id: 'edit', label: t('common.edit') },
                      { id: 'delete', label: t('common.delete'), danger: true }
                    ]"
                    @select="(act) => handleAction(act, item)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <AppPagination v-model:current-page="currentPage" :total-pages="5" />
      </div>
    </div>

    <!-- Edit News Modal -->
    <div
      v-if="isEditModalOpen && editingItem"
      class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
    >
      <div class="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl flex flex-col gap-4">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 class="text-sm font-black text-slate-900">{{ t('news.editNews') }}</h3>
          <button
            type="button"
            @click="isEditModalOpen = false"
            class="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="flex flex-col gap-3">
          <div class="flex flex-col gap-1">
            <label class="text-xs font-bold text-slate-700">{{ t('news.headlineCol') }}</label>
            <input
              v-model="editingItem.headline"
              type="text"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="flex flex-col gap-1">
              <label class="text-xs font-bold text-slate-700">{{ t('news.badgeCol') }}</label>
              <select
                v-model="editingItem.badge"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="LIVE">{{ t('news.badgeLive') }}</option>
                <option value="BREAKING">{{ t('news.badgeBreaking') }}</option>
                <option value="UPDATE">{{ t('news.badgeUpdate') }}</option>
              </select>
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-xs font-bold text-slate-700">{{ t('news.sourceCol') }}</label>
              <input
                v-model="editingItem.source"
                type="text"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 mt-2 flex-wrap">
          <button
            type="button"
            @click="isEditModalOpen = false"
            class="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer flex-1 sm:flex-initial text-center"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            type="button"
            @click="saveEditModal"
            class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer flex-1 sm:flex-initial text-center"
          >
            {{ t('common.save') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Preview News Modal -->
    <div
      v-if="isPreviewModalOpen && previewingItem"
      class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
    >
      <div class="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl flex flex-col gap-4">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div class="flex items-center gap-2">
            <span
              :class="[
                'text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border',
                previewingItem.badge === 'LIVE' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-amber-50 text-amber-600 border-amber-200'
              ]"
            >
              {{ getBadgeLabel(previewingItem.badge) }}
            </span>
            <span class="text-xs text-slate-400 font-medium">{{ previewingItem.published }}</span>
          </div>
          <button
            type="button"
            @click="isPreviewModalOpen = false"
            class="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="flex flex-col gap-3 py-2">
          <h2 class="text-base font-bold text-slate-900 leading-snug">
            {{ previewingItem.headline }}
          </h2>

          <div class="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>{{ t('news.sourceCol') }}:</span>
            <span class="text-slate-800 font-bold">{{ previewingItem.source }}</span>
          </div>
          
          <p v-if="previewingItem.summary" class="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
            {{ previewingItem.summary }}
          </p>
        </div>

        <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 flex-wrap">
          <button
            type="button"
            @click="isPreviewModalOpen = false"
            class="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer flex-1 sm:flex-initial text-center"
          >
            {{ t('common.close') }}
          </button>
          <button
            type="button"
            @click="isEditModalOpen = true; editingItem = { ...previewingItem }; isPreviewModalOpen = false"
            class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer flex-1 sm:flex-initial text-center"
          >
            {{ t('news.editNews') }}
          </button>
        </div>
      </div>
    </div>
  </AppShell>
</template>
