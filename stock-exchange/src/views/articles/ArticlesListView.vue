<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, X, Clock, User, RefreshCw } from 'lucide-vue-next'
import AppShell from '@/components/layout/AppShell.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import TableFilterBar from '@/components/data-table/TableFilterBar.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import ActionMenu from '@/components/ui/ActionMenu.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import { useFeedback } from '@/composables/useFeedback'
import { useI18n } from 'vue-i18n'
import { extractApiErrors } from '@/domain/models/common.model'
import { resolveAttachmentUrl, handleImageError } from '@/utils/attachment'
import { coreServices } from '@/di'
import type { ArticleDto } from '@/domain/models/article.model'
import type { ArticleCategory } from '@/domain/models/article-category.model'

const router = useRouter()
const { confirm, toast } = useFeedback()
const { t, locale } = useI18n()
const isAr = computed(() => locale.value === 'ar')

const search = ref('')
const selectedCategoryId = ref('')
const selectedStatus = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const totalPages = ref(1)
const totalCount = ref(0)

const articles = ref<ArticleDto[]>([])
const categories = ref<ArticleCategory[]>([])
const isLoading = ref(true)

const previewArticle = ref<ArticleDto | null>(null)
const isPreviewOpen = ref(false)

// Load categories for filter dropdown
const loadCategories = async () => {
  try {
    categories.value = await coreServices.articles.getCategories({ applyLanguageFilter: false })
  } catch {
    categories.value = []
  }
}

// Load articles from API
const loadArticles = async () => {
  isLoading.value = true
  try {
    const isActiveFilter = selectedStatus.value === 'active'
      ? true
      : selectedStatus.value === 'inactive'
        ? false
        : undefined

    const result = await coreServices.articles.getAll({
      pageNumber: currentPage.value,
      pageSize: pageSize.value,
      search: search.value || undefined,
      articleCategoryId: selectedCategoryId.value || undefined,
      isActive: isActiveFilter,
      applyLanguageFilter: false
    })

    const raw = result as unknown
    if (raw && typeof raw === 'object' && 'data' in (raw as object)) {
      const inner = (raw as { data: typeof result }).data
      articles.value = inner?.items ?? []
      totalPages.value = inner?.totalPages ?? 1
      totalCount.value = inner?.totalCount ?? 0
    } else {
      articles.value = result?.items ?? []
      totalPages.value = result?.totalPages ?? 1
      totalCount.value = result?.totalCount ?? 0
    }
  } catch (err: unknown) {
    console.error('Failed to load articles:', err)
    const errorDetails = extractApiErrors(err)
    toast.error(errorDetails.generalMessage || (isAr.value ? 'فشل تحميل المقالات' : 'Failed to load articles'))
    articles.value = []
  } finally {
    isLoading.value = false
  }
}

const filters = computed(() => [
  {
    id: 'category',
    label: t('articles.categoryCol'),
    value: selectedCategoryId.value,
    options: categories.value.map(cat => ({
      label: isAr.value ? cat.categoryArName : cat.categoryEnName,
      value: cat.id
    }))
  },
  {
    id: 'status',
    label: t('articles.statusCol'),
    value: selectedStatus.value,
    options: [
      { label: isAr.value ? 'نشط' : 'Active', value: 'active' },
      { label: isAr.value ? 'غير نشط' : 'Inactive', value: 'inactive' },
    ]
  }
])

const handleFilterChange = (filterId: string, val: string) => {
  if (filterId === 'category') selectedCategoryId.value = val
  if (filterId === 'status') selectedStatus.value = val
  currentPage.value = 1
}

let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    currentPage.value = 1
    loadArticles()
  }, 400)
})

watch([selectedCategoryId, selectedStatus], () => {
  currentPage.value = 1
  loadArticles()
})

watch(currentPage, () => {
  loadArticles()
})

const getArticleTitle = (art: ArticleDto) =>
  isAr.value ? (art.titleAr || art.titleEn) : (art.titleEn || art.titleAr)

const getArticleExcerpt = (art: ArticleDto) =>
  isAr.value ? (art.excerptAr || art.excerptEn) : (art.excerptEn || art.excerptAr)

const getCategoryName = (art: ArticleDto) => {
  if (isAr.value) return art.categoryArName || art.categoryEnName || '-'
  return art.categoryEnName || art.categoryArName || '-'
}

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString(isAr.value ? 'ar-EG' : 'en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    })
  } catch {
    return dateStr
  }
}

const handleAction = async (actionId: string, article: ArticleDto) => {
  if (actionId === 'details') {
    router.push(`/articles/${article.id}`)
  } else if (actionId === 'edit') {
    router.push(`/articles/${article.id}/edit`)
  } else if (actionId === 'preview') {
    previewArticle.value = article
    isPreviewOpen.value = true
  } else if (actionId === 'delete') {
    const title = getArticleTitle(article)
    const ok = await confirm({
      title: t('articles.deleteConfirmTitle'),
      message: `${t('articles.deleteConfirmDesc')} ("${title}")`,
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      type: 'danger'
    })
    if (ok) {
      try {
        await coreServices.articles.delete(article.id)
        toast.success(isAr.value ? 'تم حذف المقال بنجاح' : 'Article deleted successfully')
        await loadArticles()
      } catch (err: unknown) {
        console.error('Delete article failed:', err)
        const errorDetails = extractApiErrors(err)
        toast.error(errorDetails.generalMessage || (isAr.value ? 'فشل حذف المقال' : 'Failed to delete article'))
      }
    }
  }
}

onMounted(async () => {
  await loadCategories()
  await loadArticles()
})
</script>

<template>
  <AppShell>
    <div class="flex flex-col max-w-7xl mx-auto">
      <PageHeader
        :title="t('articles.title')"
        :description="t('articles.subtitle')"
      >
        <template #actions>
          <button
            type="button"
            @click="loadArticles"
            :disabled="isLoading"
            class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw :class="['w-3.5 h-3.5', isLoading && 'animate-spin']" />
          </button>
          <button
            type="button"
            @click="router.push('/articles/create')"
            class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus class="w-3.5 h-3.5 stroke-[3]" />
            {{ t('articles.addArticle') }}
          </button>
        </template>
      </PageHeader>

      <!-- Table Box -->
      <div class="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
        <!-- Filter Bar -->
        <TableFilterBar
          :search-placeholder="t('articles.searchPlaceholder')"
          v-model:search-value="search"
          :filters="filters"
          @update:filter="handleFilterChange"
        />

        <!-- Loading State -->
        <div v-if="isLoading" class="flex items-center justify-center py-20">
          <div class="flex flex-col items-center gap-3">
            <div class="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <span class="text-xs text-slate-500 font-medium">{{ isAr ? 'جاري التحميل...' : 'Loading...' }}</span>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="!articles.length" class="flex flex-col items-center justify-center py-20 gap-3">
          <div class="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
            <span class="text-2xl">📄</span>
          </div>
          <p class="text-sm font-bold text-slate-700">{{ isAr ? 'لا توجد مقالات' : 'No articles found' }}</p>
          <p class="text-xs text-slate-400">{{ isAr ? 'أنشئ مقالاً جديداً للبدء' : 'Create a new article to get started' }}</p>
          <button
            type="button"
            @click="router.push('/articles/create')"
            class="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus class="w-3.5 h-3.5 stroke-[3]" />
            {{ t('articles.addArticle') }}
          </button>
        </div>

        <!-- Data Table -->
        <div v-else class="overflow-x-auto">
          <table class="w-full text-start text-xs min-w-[750px]">
            <thead>
              <tr class="text-[11px] font-bold text-slate-400 border-b border-slate-100 uppercase tracking-wider bg-slate-50/50">
                <th class="py-3 px-4 text-start">{{ t('common.details') }}</th>
                <th class="py-3 px-4 text-start">{{ t('articles.titleCol') }}</th>
                <th class="py-3 px-4 text-start">{{ t('articles.categoryCol') }}</th>
                <th class="py-3 px-4 text-start">{{ t('articles.authorCol') }}</th>
                <th class="py-3 px-4 text-start">{{ isAr ? 'تاريخ النشر' : 'Published' }}</th>
                <th class="py-3 px-4 text-start">{{ t('articles.statusCol') }}</th>
                <th class="py-3 px-4 text-end">{{ t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="article in articles"
                :key="article.id"
                class="hover:bg-slate-50/60 transition-colors"
              >
                <!-- Cover Image -->
                <td class="py-3 px-4 text-start">
                  <img
                    :src="resolveAttachmentUrl(article.imageUrl ?? '', 'image')"
                    :alt="getArticleTitle(article)"
                    @error="handleImageError($event, 'image')"
                    class="w-12 h-9 rounded-lg object-cover border border-slate-200"
                  />
                </td>

                <!-- Title & Excerpt -->
                <td class="py-3 px-4 text-start">
                  <div class="flex flex-col max-w-xs">
                    <span class="font-bold text-slate-900 leading-snug">{{ getArticleTitle(article) }}</span>
                    <span class="text-[11px] text-slate-400 font-medium truncate">{{ getArticleExcerpt(article) }}</span>
                  </div>
                </td>

                <!-- Category -->
                <td class="py-3 px-4 text-slate-600 font-medium text-start">
                  {{ getCategoryName(article) }}
                </td>

                <!-- Author -->
                <td class="py-3 px-4 text-slate-800 font-medium text-start">{{ article.authorName }}</td>

                <!-- Published Date -->
                <td class="py-3 px-4 text-slate-500 font-medium text-start">{{ formatDate(article.publishedAt) }}</td>

                <!-- Status -->
                <td class="py-3 px-4 text-start">
                  <StatusBadge :status="article.isActive ? 'active' : 'inactive'" :variant="article.isActive ? 'success' : 'neutral'">
                    {{ article.isActive ? (isAr ? 'نشط' : 'Active') : (isAr ? 'غير نشط' : 'Inactive') }}
                  </StatusBadge>
                </td>

                <!-- Actions Menu -->
                <td class="py-3 px-4 text-end">
                  <ActionMenu
                    :items="[
                      { id: 'details', label: isAr ? 'عرض التفاصيل' : 'View Details' },
                      { id: 'preview', label: t('articles.previewArticle') },
                      { id: 'edit', label: t('common.edit') },
                      { id: 'delete', label: t('common.delete'), danger: true }
                    ]"
                    @select="(act) => handleAction(act, article)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <AppPagination
          v-if="!isLoading && totalPages > 1"
          v-model:current-page="currentPage"
          :total-pages="totalPages"
        />

        <!-- Total count info -->
        <p v-if="!isLoading && totalCount > 0" class="text-[11px] text-slate-400 mt-3 text-center">
          {{ isAr ? `إجمالي ${totalCount} مقال` : `${totalCount} article${totalCount !== 1 ? 's' : ''} total` }}
        </p>
      </div>

      <!-- Article Preview Modal -->
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-if="isPreviewOpen && previewArticle"
          class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs"
          @click.self="isPreviewOpen = false"
        >
          <div class="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in max-h-[90vh] flex flex-col mx-auto">
            <!-- Header -->
            <div class="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div class="flex items-center gap-2">
                <StatusBadge :status="previewArticle.isActive ? 'active' : 'inactive'" :variant="previewArticle.isActive ? 'success' : 'neutral'">
                  {{ previewArticle.isActive ? (isAr ? 'نشط' : 'Active') : (isAr ? 'غير نشط' : 'Inactive') }}
                </StatusBadge>
                <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">{{ getCategoryName(previewArticle) }}</span>
              </div>
              <button
                type="button"
                @click="isPreviewOpen = false"
                class="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <!-- Scrollable Content -->
            <div class="p-4 sm:p-6 overflow-y-auto flex flex-col gap-4 text-xs">
              <img
                :src="resolveAttachmentUrl(previewArticle.imageUrl ?? '', 'image')"
                :alt="getArticleTitle(previewArticle)"
                @error="handleImageError($event, 'image')"
                class="w-full h-44 sm:h-64 rounded-xl object-cover border border-slate-100"
              />

              <div>
                <h2 class="text-base sm:text-lg font-black text-slate-900 leading-tight">{{ getArticleTitle(previewArticle) }}</h2>
                <p class="text-xs text-slate-500 font-medium mt-1">{{ getArticleExcerpt(previewArticle) }}</p>
              </div>

              <div class="flex items-center gap-3 sm:gap-4 py-2 border-y border-slate-100 text-slate-600 text-[11px] flex-wrap">
                <div class="flex items-center gap-1.5 font-bold">
                  <User class="w-3.5 h-3.5 text-slate-400" />
                  <span>{{ previewArticle.authorName }}</span>
                </div>
                <div class="flex items-center gap-1.5 font-medium text-slate-400">
                  <Clock class="w-3.5 h-3.5" />
                  <span>{{ formatDate(previewArticle.publishedAt) }}</span>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="px-4 sm:px-6 py-3 border-t border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50 shrink-0">
              <span class="text-[11px] text-slate-400 truncate">{{ isAr ? 'نشر في' : 'Published on' }} {{ formatDate(previewArticle.publishedAt) }}</span>
              <button
                type="button"
                @click="router.push(`/articles/${previewArticle.id}/edit`); isPreviewOpen = false"
                class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs shrink-0"
              >
                {{ t('articles.editArticle') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </AppShell>
</template>
