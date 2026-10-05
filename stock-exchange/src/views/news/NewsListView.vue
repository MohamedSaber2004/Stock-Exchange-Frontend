<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, X, Search, RefreshCw, CheckCircle2, XCircle, Star, Newspaper } from 'lucide-vue-next'
import AppShell from '@/components/layout/AppShell.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import DataState from '@/components/ui/DataState.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import ActionMenu from '@/components/ui/ActionMenu.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import { useFeedback } from '@/composables/useFeedback'
import { useI18n } from 'vue-i18n'
import { coreServices } from '@/di'
import type { NewsDto } from '@/domain/models/news.model'
import type { AppError } from '@/domain/models/common.model'
import { resolveAttachmentUrl, handleImageError } from '@/utils/attachment'

const router = useRouter()
const { confirm, toast } = useFeedback()
const { t, locale } = useI18n()
const isAr = computed(() => locale.value === 'ar')

// State
const newsList = ref<NewsDto[]>([])
const isLoading = ref(true)
const errorMessage = ref<string | null>(null)

// Filtering & Pagination
const search = ref('')
const selectedBadge = ref('')
const selectedFeatured = ref('all')
const currentPage = ref(1)
const pageSize = ref(10)
const totalPages = ref(1)
const totalCount = ref(0)

// Preview Modal State
const isPreviewModalOpen = ref(false)
const previewingItem = ref<NewsDto | null>(null)

const getBadgeLabel = (b: string) => {
  if (b === 'LIVE') return t('news.badgeLive')
  if (b === 'BREAKING') return t('news.badgeBreaking')
  if (b === 'UPDATE') return t('news.badgeUpdate')
  return b
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString(locale.value === 'ar' ? 'ar-EG' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  } catch {
    return dateStr
  }
}

const fetchNews = async () => {
  isLoading.value = true
  errorMessage.value = null

  try {
    const params: {
      pageNumber: number
      pageSize: number
      search?: string
      isFeaturedOnHome?: boolean
      applyLanguageFilter: boolean
    } = {
      pageNumber: currentPage.value,
      pageSize: pageSize.value,
      applyLanguageFilter: false
    }

    if (search.value.trim()) {
      params.search = search.value.trim()
    }

    if (selectedFeatured.value === 'featured') {
      params.isFeaturedOnHome = true
    } else if (selectedFeatured.value === 'not_featured') {
      params.isFeaturedOnHome = false
    }

    const result = await coreServices.news.getAll(params)
    newsList.value = result?.items || []
    totalPages.value = result?.totalPages || 1
    totalCount.value = result?.totalCount || 0
  } catch (err: unknown) {
    const appErr = err as AppError
    errorMessage.value = appErr?.message || (isAr.value ? 'تعذر تحميل أخبار السوق' : 'Failed to load market news')
    toast.error(errorMessage.value)
  } finally {
    isLoading.value = false
  }
}

watch([search, selectedFeatured], () => {
  currentPage.value = 1
  fetchNews()
})

watch(currentPage, () => {
  fetchNews()
})

const filteredNews = computed(() => {
  if (!selectedBadge.value) return newsList.value
  return newsList.value.filter(n => {
    const badge = (n.categoryEn || n.categoryAr || '').toUpperCase()
    return badge === selectedBadge.value.toUpperCase()
  })
})

const handleAction = async (actionId: string, item: NewsDto) => {
  if (actionId === 'details') {
    router.push(`/news/${item.id}`)
  } else if (actionId === 'edit') {
    router.push(`/news/${item.id}/edit`)
  } else if (actionId === 'preview') {
    previewingItem.value = item
    isPreviewModalOpen.value = true
  } else if (actionId === 'delete') {
    const title = isAr.value ? (item.titleAr || item.titleEn) : (item.titleEn || item.titleAr)
    const ok = await confirm({
      title: t('news.deleteConfirmTitle'),
      message: `${t('news.deleteConfirmDesc')} ("${title}")`,
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      type: 'danger'
    })
    if (ok) {
      try {
        await coreServices.news.delete(item.id)
        toast.success(t('news.newsDeletedSuccess'))
        await fetchNews()
      } catch (err: unknown) {
        const appErr = err as AppError
        toast.error(appErr?.message || (isAr.value ? 'تعذر حذف الخبر' : 'Failed to delete news'))
      }
    }
  }
}

const toggleFeatured = async (item: NewsDto) => {
  try {
    const newFeatured = !item.isFeaturedOnHome
    await coreServices.news.update(item.id, {
      titleEn: item.titleEn,
      titleAr: item.titleAr,
      summaryEn: item.summaryEn,
      summaryAr: item.summaryAr,
      imageUrl: item.imageUrl,
      categoryEn: item.categoryEn,
      categoryAr: item.categoryAr,
      publishedAt: item.publishedAt,
      displayOrder: item.displayOrder,
      isFeaturedOnHome: newFeatured,
      isActive: item.isActive
    })
    item.isFeaturedOnHome = newFeatured
    toast.success(isAr.value ? 'تم تحديث التمييز بالرئيسية' : 'Featured status updated')
  } catch (err: unknown) {
    const appErr = err as AppError
    toast.error(appErr?.message || (isAr.value ? 'تعذر التحديث' : 'Failed to update'))
  }
}

const toggleStatus = async (item: NewsDto) => {
  try {
    const newStatus = !item.isActive
    await coreServices.news.update(item.id, {
      titleEn: item.titleEn,
      titleAr: item.titleAr,
      summaryEn: item.summaryEn,
      summaryAr: item.summaryAr,
      imageUrl: item.imageUrl,
      categoryEn: item.categoryEn,
      categoryAr: item.categoryAr,
      publishedAt: item.publishedAt,
      displayOrder: item.displayOrder,
      isFeaturedOnHome: item.isFeaturedOnHome,
      isActive: newStatus
    })
    item.isActive = newStatus
    toast.success(isAr.value ? 'تم تحديث حالة الخبر' : 'Status updated')
  } catch (err: unknown) {
    const appErr = err as AppError
    toast.error(appErr?.message || (isAr.value ? 'تعذر تغيير الحالة' : 'Failed to toggle status'))
  }
}

onMounted(() => {
  fetchNews()
})
</script>

<template>
  <AppShell>
    <div class="flex flex-col max-w-7xl mx-auto space-y-6">
      <PageHeader
        :title="t('news.title')"
        :description="t('news.subtitle')"
      >
        <template #actions>
          <button
            type="button"
            @click="router.push('/news/create')"
            class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs hover:shadow-md cursor-pointer"
          >
            <Plus class="w-4 h-4 stroke-[2.5]" />
            {{ t('news.postNews') }}
          </button>
        </template>
      </PageHeader>

      <!-- Table Box -->
      <div class="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
        <!-- Filter Bar -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
          <div class="relative flex-1 max-w-md">
            <Search class="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              v-model="search"
              type="text"
              :placeholder="t('news.searchPlaceholder')"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl ps-9 pe-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition-all"
            />
          </div>

          <div class="flex items-center gap-2 flex-wrap">
            <select
              v-model="selectedBadge"
              class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white cursor-pointer"
            >
              <option value="">{{ t('news.allBadges') }}</option>
              <option value="LIVE">{{ t('news.badgeLive') }}</option>
              <option value="BREAKING">{{ t('news.badgeBreaking') }}</option>
              <option value="UPDATE">{{ t('news.badgeUpdate') }}</option>
            </select>

            <select
              v-model="selectedFeatured"
              class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white cursor-pointer"
            >
              <option value="all">{{ isAr ? 'كل التمييز' : 'All Featured' }}</option>
              <option value="featured">{{ isAr ? 'مميز بالرئيسية' : 'Featured on Home' }}</option>
              <option value="not_featured">{{ isAr ? 'غير مميز' : 'Not Featured' }}</option>
            </select>

            <button
              type="button"
              @click="fetchNews"
              :disabled="isLoading"
              class="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              :title="t('common.refresh')"
            >
              <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': isLoading }" />
            </button>
          </div>
        </div>

        <!-- Data State Handler -->
        <DataState
          :loading="isLoading"
          :error="errorMessage"
          :empty="!isLoading && filteredNews.length === 0"
          :empty-title="t('news.noNewsFound')"
          :empty-message="t('news.noNewsDesc')"
          @retry="fetchNews"
        >
          <div class="overflow-x-auto">
            <table class="w-full text-start text-xs min-w-[700px]">
              <thead>
                <tr class="text-[11px] font-bold text-slate-400 border-b border-slate-100 uppercase tracking-wider bg-slate-50/50">
                  <th class="py-3.5 px-4 text-start">{{ t('news.headlineCol') }}</th>
                  <th class="py-3.5 px-4 text-center">{{ t('news.badgeCol') }}</th>
                  <th class="py-3.5 px-4 text-center">{{ t('news.isFeatured') }}</th>
                  <th class="py-3.5 px-4 text-center">{{ t('news.publishedCol') }}</th>
                  <th class="py-3.5 px-4 text-center">{{ t('news.isActive') }}</th>
                  <th class="py-3.5 px-4 text-end">{{ t('common.actions') }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr
                  v-for="item in filteredNews"
                  :key="item.id"
                  class="hover:bg-slate-50/70 transition-colors"
                >
                  <!-- Headline & Image -->
                  <td class="py-3.5 px-4 text-start max-w-md">
                    <div class="flex items-center gap-3">
                      <div class="w-12 h-10 rounded-lg overflow-hidden bg-emerald-50 border border-slate-100 shrink-0 flex items-center justify-center">
                        <img
                          v-if="item.imageUrl"
                          :src="resolveAttachmentUrl(item.imageUrl, 'image')"
                          :alt="item.titleEn"
                          class="w-full h-full object-cover"
                          @error="handleImageError"
                        />
                        <Newspaper v-else class="w-5 h-5 text-emerald-600" />
                      </div>
                      <div class="flex flex-col min-w-0">
                        <span class="font-bold text-slate-900 truncate">
                          {{ isAr ? (item.titleAr || item.titleEn) : (item.titleEn || item.titleAr) }}
                        </span>
                        <span class="text-[11px] text-slate-400 truncate">
                          {{ isAr ? (item.summaryAr || item.summaryEn) : (item.summaryEn || item.summaryAr) }}
                        </span>
                      </div>
                    </div>
                  </td>

                  <!-- Badge / Tag -->
                  <td class="py-3.5 px-4 text-center">
                    <StatusBadge :status="(item.categoryEn || item.categoryAr || 'LIVE').toUpperCase()">
                      {{ getBadgeLabel((item.categoryEn || item.categoryAr || 'LIVE').toUpperCase()) }}
                    </StatusBadge>
                  </td>

                  <!-- Home Featured -->
                  <td class="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      @click="toggleFeatured(item)"
                      class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer"
                      :class="item.isFeaturedOnHome ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'"
                    >
                      <Star class="w-3.5 h-3.5" :class="item.isFeaturedOnHome ? 'fill-amber-500 text-amber-500' : 'text-slate-400'" />
                      {{ item.isFeaturedOnHome ? (isAr ? 'مميز' : 'Featured') : (isAr ? 'عادي' : 'Standard') }}
                    </button>
                  </td>

                  <!-- Published Date -->
                  <td class="py-3.5 px-4 text-center text-slate-500 font-medium">
                    {{ formatDate(item.publishedAt || item.createdAt) }}
                  </td>

                  <!-- Active Status Toggle -->
                  <td class="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      @click="toggleStatus(item)"
                      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer"
                      :class="item.isActive ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'"
                    >
                      <CheckCircle2 v-if="item.isActive" class="w-3.5 h-3.5 text-emerald-600" />
                      <XCircle v-else class="w-3.5 h-3.5 text-slate-400" />
                      {{ item.isActive ? t('common.active') : t('common.inactive') }}
                    </button>
                  </td>

                  <!-- Actions Menu -->
                  <td class="py-3.5 px-4 text-end">
                    <ActionMenu
                      :items="[
                        { id: 'details', label: isAr ? 'عرض التفاصيل' : 'View Details' },
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
          <div class="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span class="text-xs text-slate-500">
              {{ isAr ? `إجمالي الأخبار: ${totalCount}` : `Total News: ${totalCount}` }}
            </span>
            <AppPagination
              v-if="totalPages > 1"
              v-model:current-page="currentPage"
              :total-pages="totalPages"
            />
          </div>
        </DataState>
      </div>
    </div>

    <!-- Preview News Modal -->
    <div
      v-if="isPreviewModalOpen && previewingItem"
      class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
    >
      <div class="bg-white rounded-3xl border border-slate-200 max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl flex flex-col gap-4">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div class="flex items-center gap-2">
            <StatusBadge :status="(previewingItem.categoryEn || previewingItem.categoryAr || 'LIVE').toUpperCase()">
              {{ getBadgeLabel((previewingItem.categoryEn || previewingItem.categoryAr || 'LIVE').toUpperCase()) }}
            </StatusBadge>
            <span class="text-xs text-slate-400">{{ formatDate(previewingItem.publishedAt || previewingItem.createdAt) }}</span>
          </div>
          <button
            type="button"
            @click="isPreviewModalOpen = false"
            class="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <div v-if="previewingItem.imageUrl" class="w-full h-48 rounded-2xl overflow-hidden bg-slate-100">
          <img
            :src="resolveAttachmentUrl(previewingItem.imageUrl, 'image')"
            :alt="previewingItem.titleEn"
            class="w-full h-full object-cover"
            @error="handleImageError"
          />
        </div>

        <div class="flex flex-col gap-2">
          <h2 class="text-base font-black text-slate-900 leading-snug">
            {{ isAr ? (previewingItem.titleAr || previewingItem.titleEn) : (previewingItem.titleEn || previewingItem.titleAr) }}
          </h2>
          <h3 v-if="previewingItem.titleEn && previewingItem.titleAr" class="text-xs text-slate-400">
            {{ isAr ? previewingItem.titleEn : previewingItem.titleAr }}
          </h3>
          <div class="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap mt-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
            {{ isAr ? (previewingItem.summaryAr || previewingItem.summaryEn) : (previewingItem.summaryEn || previewingItem.summaryAr) }}
          </div>
        </div>

        <div class="flex justify-end pt-2 border-t border-slate-100">
          <button
            type="button"
            @click="isPreviewModalOpen = false"
            class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            {{ t('common.close') }}
          </button>
        </div>
      </div>
    </div>
  </AppShell>
</template>
