<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import DataState from '@/components/ui/DataState.vue'
import AppButton from '@/components/ui/AppButton.vue'
import {
  Tags,
  Plus,
  Search,
  Edit3,
  Trash2,
  X,
  RefreshCw,
  FileText,
  Video,
  Calendar
} from 'lucide-vue-next'
import { useFeedback } from '@/composables/useFeedback'
import { useI18n } from 'vue-i18n'
import { coreServices } from '@/di'
import type { ArticleCategory } from '@/domain/models/article-category.model'
import type { VideoCategory } from '@/domain/models/video-category.model'
import type { AppError } from '@/domain/models/common.model'

const route = useRoute()
const router = useRouter()
const { toast, confirm } = useFeedback()
const { t, locale } = useI18n()
const isAr = computed(() => locale.value === 'ar')

// Active tab: 'articles' or 'videos'
const activeTab = ref<'articles' | 'videos'>(route.query.tab === 'videos' ? 'videos' : 'articles')

watch(
  () => route.query.tab,
  (newTab) => {
    if (newTab === 'videos' || newTab === 'articles') {
      activeTab.value = newTab
    }
  }
)

const switchTab = (tab: 'articles' | 'videos') => {
  activeTab.value = tab
  router.replace({ query: { ...route.query, tab } })
}

// Data state
const articleCategories = ref<ArticleCategory[]>([])
const videoCategories = ref<VideoCategory[]>([])
const isLoading = ref(true)
const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)
const searchQuery = ref('')

// Modal state
const isModalOpen = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const modalTargetType = ref<'articles' | 'videos'>('articles')
const formData = ref<{
  id?: string
  categoryArName: string
  categoryEnName: string
}>({
  categoryArName: '',
  categoryEnName: ''
})
const formErrors = ref<Record<string, string>>({})

// Metrics
const totalArticleCategoriesCount = computed(() => articleCategories.value.length)
const totalVideoCategoriesCount = computed(() => videoCategories.value.length)
const totalCategoriesCount = computed(() => totalArticleCategoriesCount.value + totalVideoCategoriesCount.value)

// Current displayed list based on active tab and local search
const currentList = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  const list = activeTab.value === 'articles' ? articleCategories.value : videoCategories.value

  if (!query) return list

  return list.filter((item) => {
    const ar = (item.categoryArName || '').toLowerCase()
    const en = (item.categoryEnName || '').toLowerCase()
    return ar.includes(query) || en.includes(query)
  })
})

// Fetch all categories
const fetchCategories = async (showLoading = true) => {
  if (showLoading) isLoading.value = true
  errorMessage.value = null

  try {
    const [articlesRes, videosRes] = await Promise.all([
      coreServices.articles.getCategories(),
      coreServices.videos.getCategories()
    ])
    articleCategories.value = articlesRes || []
    videoCategories.value = videosRes || []
  } catch (err: unknown) {
    const appErr = err as AppError
    errorMessage.value = appErr?.message || (isAr.value ? 'تعذر تحميل التصنيفات' : 'Failed to load categories')
    toast.error(errorMessage.value)
  } finally {
    if (showLoading) isLoading.value = false
  }
}

onMounted(() => {
  fetchCategories()
})

// Modal Actions
const openCreateModal = () => {
  modalMode.value = 'create'
  modalTargetType.value = activeTab.value
  formData.value = {
    categoryArName: '',
    categoryEnName: ''
  }
  formErrors.value = {}
  isModalOpen.value = true
}

const openEditModal = (item: ArticleCategory | VideoCategory, type: 'articles' | 'videos') => {
  modalMode.value = 'edit'
  modalTargetType.value = type
  formData.value = {
    id: item.id,
    categoryArName: item.categoryArName,
    categoryEnName: item.categoryEnName
  }
  formErrors.value = {}
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  formErrors.value = {}
}

const validateForm = () => {
  const errors: Record<string, string> = {}
  if (!formData.value.categoryArName.trim()) {
    errors.categoryArName = t('categories.nameArRequired')
  }
  if (!formData.value.categoryEnName.trim()) {
    errors.categoryEnName = t('categories.nameEnRequired')
  }
  formErrors.value = errors
  return Object.keys(errors).length === 0
}

const handleSaveCategory = async () => {
  if (!validateForm()) return

  isSubmitting.value = true
  try {
    const payload = {
      categoryArName: formData.value.categoryArName.trim(),
      categoryEnName: formData.value.categoryEnName.trim()
    }

    if (modalTargetType.value === 'articles') {
      if (modalMode.value === 'create') {
        await coreServices.articles.createCategory(payload)
        toast.success(t('categories.createdSuccess'))
      } else if (formData.value.id) {
        await coreServices.articles.updateCategory(formData.value.id, {
          id: formData.value.id,
          ...payload
        })
        toast.success(t('categories.updatedSuccess'))
      }
    } else {
      if (modalMode.value === 'create') {
        await coreServices.videos.createCategory(payload)
        toast.success(t('categories.createdSuccess'))
      } else if (formData.value.id) {
        await coreServices.videos.updateCategory(formData.value.id, {
          id: formData.value.id,
          ...payload
        })
        toast.success(t('categories.updatedSuccess'))
      }
    }

    closeModal()
    await fetchCategories(false)
  } catch (err: unknown) {
    const appErr = err as AppError
    toast.error(appErr?.message || (isAr.value ? 'فشلت عملية حفظ التصنيف' : 'Failed to save category'))
  } finally {
    isSubmitting.value = false
  }
}

// Delete Action
const handleDeleteCategory = async (item: ArticleCategory | VideoCategory, type: 'articles' | 'videos') => {
  const categoryName = isAr.value ? item.categoryArName : item.categoryEnName
  const confirmed = await confirm({
    title: t('categories.deleteTitle'),
    message: `${t('categories.deleteConfirm')} ("${categoryName}")\n${t('categories.deleteWarning')}`,
    confirmText: t('common.delete'),
    cancelText: t('common.cancel'),
    type: 'danger'
  })

  if (!confirmed) return

  try {
    if (type === 'articles') {
      await coreServices.articles.deleteCategory(item.id)
    } else {
      await coreServices.videos.deleteCategory(item.id)
    }
    toast.success(t('categories.deletedSuccess'))
    await fetchCategories(false)
  } catch (err: unknown) {
    const appErr = err as AppError
    toast.error(appErr?.message || (isAr.value ? 'تعذر حذف التصنيف' : 'Failed to delete category'))
  }
}

const getItemCount = (item: ArticleCategory | VideoCategory) => {
  if (activeTab.value === 'articles') {
    return (item as ArticleCategory).articlesCount ?? 0
  }
  return (item as VideoCategory).videosCount ?? 0
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString(locale.value === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return dateStr
  }
}
</script>

<template>
  <AppShell>
    <div class="space-y-6">
      <!-- Page Header -->
      <PageHeader
        :title="t('categories.title')"
        :description="t('categories.subtitle')"
      >
        <template #actions>
          <AppButton
            variant="primary"
            size="md"
            class="shadow-sm shadow-emerald-500/20"
            @click="openCreateModal"
          >
            <template #prefix>
              <Plus class="w-4 h-4" />
            </template>
            {{ t('categories.addCategory') }}
          </AppButton>
        </template>
      </PageHeader>

      <!-- Stat Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <!-- Card 1: Total Categories -->
        <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4 transition-all hover:shadow-md">
          <div class="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Tags class="w-6 h-6" />
          </div>
          <div>
            <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {{ t('categories.totalCategories') }}
            </div>
            <div class="text-2xl font-black text-slate-900 mt-1">
              {{ totalCategoriesCount }}
            </div>
          </div>
        </div>

        <!-- Card 2: Article Categories -->
        <div
          class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4 cursor-pointer transition-all hover:shadow-md hover:border-blue-300"
          :class="{ 'ring-2 ring-blue-500/20 border-blue-500': activeTab === 'articles' }"
          @click="switchTab('articles')"
        >
          <div class="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FileText class="w-6 h-6" />
          </div>
          <div>
            <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {{ t('categories.totalArticleCategories') }}
            </div>
            <div class="text-2xl font-black text-slate-900 mt-1">
              {{ totalArticleCategoriesCount }}
            </div>
          </div>
        </div>

        <!-- Card 3: Video Categories -->
        <div
          class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4 cursor-pointer transition-all hover:shadow-md hover:border-purple-300"
          :class="{ 'ring-2 ring-purple-500/20 border-purple-500': activeTab === 'videos' }"
          @click="switchTab('videos')"
        >
          <div class="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Video class="w-6 h-6" />
          </div>
          <div>
            <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {{ t('categories.totalVideoCategories') }}
            </div>
            <div class="text-2xl font-black text-slate-900 mt-1">
              {{ totalVideoCategoriesCount }}
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content Card -->
      <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <!-- Card Header: Tabs & Filter Bar -->
        <div class="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <!-- Segmented Tab Switcher -->
          <div class="inline-flex p-1 bg-slate-100/80 rounded-xl max-w-fit">
            <button
              type="button"
              class="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all"
              :class="activeTab === 'articles' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'"
              @click="switchTab('articles')"
            >
              <FileText class="w-4 h-4 text-blue-600" />
              <span>{{ t('categories.articlesTab') }}</span>
              <span class="px-1.5 py-0.5 text-xs rounded-full bg-blue-50 text-blue-700 font-semibold">
                {{ totalArticleCategoriesCount }}
              </span>
            </button>
            <button
              type="button"
              class="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all"
              :class="activeTab === 'videos' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'"
              @click="switchTab('videos')"
            >
              <Video class="w-4 h-4 text-purple-600" />
              <span>{{ t('categories.videosTab') }}</span>
              <span class="px-1.5 py-0.5 text-xs rounded-full bg-purple-50 text-purple-700 font-semibold">
                {{ totalVideoCategoriesCount }}
              </span>
            </button>
          </div>

          <!-- Controls: Search & Refresh -->
          <div class="flex items-center gap-2.5 w-full md:w-auto">
            <div class="relative flex-1 md:w-80">
              <Search class="w-4 h-4 absolute top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none start-3" />
              <input
                v-model="searchQuery"
                type="text"
                :placeholder="t('categories.searchPlaceholder')"
                class="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl py-2 ps-9 pe-8 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400"
              />
              <button
                v-if="searchQuery"
                type="button"
                class="absolute top-1/2 -translate-y-1/2 end-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                @click="searchQuery = ''"
              >
                <X class="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              class="p-2 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all shrink-0"
              :title="t('common.refresh')"
              :disabled="isLoading"
              @click="fetchCategories(true)"
            >
              <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': isLoading }" />
            </button>
          </div>
        </div>

        <!-- Table View with DataState -->
        <DataState
          :loading="isLoading"
          :error="errorMessage"
          :empty="currentList.length === 0"
          :empty-title="t('categories.emptyTitle')"
          :empty-message="t('categories.emptyDesc')"
          @retry="fetchCategories(true)"
        >
          <template #empty-action>
            <AppButton
              variant="outline"
              size="sm"
              class="mt-2"
              @click="openCreateModal"
            >
              <template #prefix>
                <Plus class="w-3.5 h-3.5" />
              </template>
              {{ t('categories.addCategory') }}
            </AppButton>
          </template>

          <div class="overflow-x-auto">
            <table class="w-full text-start text-xs sm:text-sm">
              <thead>
                <tr class="border-b border-slate-200/80 bg-slate-50/60 text-slate-500 font-bold uppercase text-[11px] tracking-wider">
                  <th class="py-3.5 px-4 text-start w-14">#</th>
                  <th class="py-3.5 px-4 text-start">{{ t('categories.nameAr') }}</th>
                  <th class="py-3.5 px-4 text-start">{{ t('categories.nameEn') }}</th>
                  <th class="py-3.5 px-4 text-start w-36">{{ t('categories.itemsCount') }}</th>
                  <th class="py-3.5 px-4 text-start w-40">{{ t('categories.createdAt') }}</th>
                  <th class="py-3.5 px-4 text-end w-28">{{ t('categories.actions') }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-700">
                <tr
                  v-for="(item, idx) in currentList"
                  :key="item.id"
                  class="hover:bg-slate-50/70 transition-colors group"
                >
                  <!-- Index -->
                  <td class="py-3.5 px-4 font-mono text-xs text-slate-400">
                    {{ idx + 1 }}
                  </td>

                  <!-- Arabic Name -->
                  <td class="py-3.5 px-4">
                    <div class="font-bold text-slate-900 flex items-center gap-2">
                      <span
                        class="w-2 h-2 rounded-full shrink-0"
                        :class="activeTab === 'articles' ? 'bg-blue-500' : 'bg-purple-500'"
                      />
                      <span>{{ item.categoryArName }}</span>
                    </div>
                  </td>

                  <!-- English Name -->
                  <td class="py-3.5 px-4">
                    <span class="text-slate-600 font-medium">{{ item.categoryEnName }}</span>
                  </td>

                  <!-- Linked items count -->
                  <td class="py-3.5 px-4">
                    <div
                      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                      :class="activeTab === 'articles'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                        : 'bg-purple-50 text-purple-700 border border-purple-200/60'"
                    >
                      <component
                        :is="activeTab === 'articles' ? FileText : Video"
                        class="w-3.5 h-3.5"
                      />
                      <span>
                        {{ getItemCount(item) }}
                      </span>
                      <span class="text-[10px] text-slate-400">
                        {{ activeTab === 'articles' ? t('nav.articles') : t('nav.videos') }}
                      </span>
                    </div>
                  </td>

                  <!-- Created Date -->
                  <td class="py-3.5 px-4 text-slate-500 text-xs whitespace-nowrap">
                    <div class="flex items-center gap-1.5">
                      <Calendar class="w-3.5 h-3.5 text-slate-400" />
                      <span>{{ formatDate(item.createdAt) }}</span>
                    </div>
                  </td>

                  <!-- Actions -->
                  <td class="py-3.5 px-4 text-end whitespace-nowrap">
                    <div class="inline-flex items-center gap-1">
                      <button
                        type="button"
                        class="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        :title="t('common.edit')"
                        @click="openEditModal(item, activeTab)"
                      >
                        <Edit3 class="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        class="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        :title="t('common.delete')"
                        @click="handleDeleteCategory(item, activeTab)"
                      >
                        <Trash2 class="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </DataState>
      </div>
    </div>

    <!-- Create / Edit Category Modal Dialog -->
    <Teleport to="body">
      <div
        v-if="isModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        @click.self="closeModal"
      >
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <!-- Modal Header -->
          <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                :class="modalTargetType === 'articles' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'"
              >
                <component :is="modalTargetType === 'articles' ? FileText : Video" class="w-5 h-5" />
              </div>
              <div>
                <h3 class="text-base font-bold text-slate-900">
                  {{ modalMode === 'create' ? t('categories.modalAddTitle') : t('categories.modalEditTitle') }}
                </h3>
                <p class="text-xs text-slate-500 mt-0.5">
                  {{ t('categories.modalDesc') }}
                </p>
              </div>
            </div>

            <button
              type="button"
              class="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              @click="closeModal"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Modal Body Form -->
          <form @submit.prevent="handleSaveCategory" class="p-6 space-y-4">
            <!-- Category Type Selector (when creating) -->
            <div v-if="modalMode === 'create'" class="space-y-1.5">
              <label class="text-xs font-bold text-slate-700 block">
                {{ isAr ? 'نوع التصنيف' : 'Category Type' }}
              </label>
              <div class="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  class="flex items-center justify-center gap-2 p-3 rounded-xl border text-xs sm:text-sm font-bold transition-all"
                  :class="modalTargetType === 'articles'
                    ? 'border-blue-500 bg-blue-50/50 text-blue-700 ring-2 ring-blue-500/20'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'"
                  @click="modalTargetType = 'articles'"
                >
                  <FileText class="w-4 h-4" />
                  <span>{{ t('categories.articlesTab') }}</span>
                </button>
                <button
                  type="button"
                  class="flex items-center justify-center gap-2 p-3 rounded-xl border text-xs sm:text-sm font-bold transition-all"
                  :class="modalTargetType === 'videos'
                    ? 'border-purple-500 bg-purple-50/50 text-purple-700 ring-2 ring-purple-500/20'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'"
                  @click="modalTargetType = 'videos'"
                >
                  <Video class="w-4 h-4" />
                  <span>{{ t('categories.videosTab') }}</span>
                </button>
              </div>
            </div>

            <!-- Arabic Name Input -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>{{ t('categories.nameAr') }}</span>
                <span class="text-[10px] text-slate-400 font-mono">AR</span>
              </label>
              <input
                v-model="formData.categoryArName"
                dir="rtl"
                type="text"
                :placeholder="t('categories.nameArPlaceholder')"
                class="w-full text-sm bg-slate-50 border rounded-xl px-3.5 py-2.5 focus:outline-none focus:bg-white transition-all text-slate-900"
                :class="formErrors.categoryArName ? 'border-rose-400 focus:border-rose-500 bg-rose-50/30' : 'border-slate-200 focus:border-emerald-500'"
              />
              <p v-if="formErrors.categoryArName" class="text-xs text-rose-600">
                {{ formErrors.categoryArName }}
              </p>
            </div>

            <!-- English Name Input -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>{{ t('categories.nameEn') }}</span>
                <span class="text-[10px] text-slate-400 font-mono">EN</span>
              </label>
              <input
                v-model="formData.categoryEnName"
                dir="ltr"
                type="text"
                :placeholder="t('categories.nameEnPlaceholder')"
                class="w-full text-sm bg-slate-50 border rounded-xl px-3.5 py-2.5 focus:outline-none focus:bg-white transition-all text-slate-900"
                :class="formErrors.categoryEnName ? 'border-rose-400 focus:border-rose-500 bg-rose-50/30' : 'border-slate-200 focus:border-emerald-500'"
              />
              <p v-if="formErrors.categoryEnName" class="text-xs text-rose-600">
                {{ formErrors.categoryEnName }}
              </p>
            </div>

            <!-- Modal Footer -->
            <div class="pt-4 mt-6 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <AppButton
                type="button"
                variant="ghost"
                size="md"
                :disabled="isSubmitting"
                @click="closeModal"
              >
                {{ t('common.cancel') }}
              </AppButton>
              <AppButton
                type="submit"
                variant="primary"
                size="md"
                :loading="isSubmitting"
                class="shadow-sm shadow-emerald-500/20"
              >
                {{ t('categories.saveCategory') }}
              </AppButton>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </AppShell>
</template>
