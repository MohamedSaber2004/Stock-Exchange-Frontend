<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import {
  Plus,
  Search,
  X,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Star,
  User
} from 'lucide-vue-next'
import AppShell from '@/components/layout/AppShell.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import DataState from '@/components/ui/DataState.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import ImageUploader from '@/components/forms/ImageUploader.vue'
import ActionMenu from '@/components/ui/ActionMenu.vue'
import { useFeedback } from '@/composables/useFeedback'
import { useI18n } from 'vue-i18n'
import { coreServices } from '@/di'
import type { ExpertDto, CreateExpertPayload, UpdateExpertPayload } from '@/domain/models/expert.model'
import type { AppError } from '@/domain/models/common.model'
import { resolveAttachmentUrl, handleImageError } from '@/utils/attachment'

const { toast, confirm } = useFeedback()
const { t, locale } = useI18n()
const isAr = computed(() => locale.value === 'ar')

// State
const experts = ref<ExpertDto[]>([])
const isLoading = ref(true)
const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)

// Pagination & Filtering
const searchQuery = ref('')
const selectedStatus = ref<string>('all')
const selectedFeatured = ref<string>('all')
const currentPage = ref(1)
const pageSize = ref(10)
const totalPages = ref(1)
const totalCount = ref(0)

// Modal State
const isModalOpen = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const editingId = ref<string | null>(null)

interface FormState {
  fullNameEn: string
  fullNameAr: string
  titleEn: string
  titleAr: string
  avatarUrl: string
  displayOrder: number
  isFeaturedOnHome: boolean
  isActive: boolean
}

const form = ref<FormState>({
  fullNameEn: '',
  fullNameAr: '',
  titleEn: '',
  titleAr: '',
  avatarUrl: '',
  displayOrder: 1,
  isFeaturedOnHome: true,
  isActive: true
})

const formErrors = ref<Record<string, string>>({})

const fetchExperts = async () => {
  isLoading.value = true
  errorMessage.value = null

  try {
    const params: {
      pageNumber: number
      pageSize: number
      search?: string
      isFeaturedOnHome?: boolean
      isActive?: boolean
      applyLanguageFilter: boolean
    } = {
      pageNumber: currentPage.value,
      pageSize: pageSize.value,
      applyLanguageFilter: false
    }

    if (searchQuery.value.trim()) {
      params.search = searchQuery.value.trim()
    }

    if (selectedStatus.value === 'active') {
      params.isActive = true
    } else if (selectedStatus.value === 'inactive') {
      params.isActive = false
    }

    if (selectedFeatured.value === 'featured') {
      params.isFeaturedOnHome = true
    } else if (selectedFeatured.value === 'not_featured') {
      params.isFeaturedOnHome = false
    }

    const result = await coreServices.experts.getAll(params)
    experts.value = result?.items || []
    totalPages.value = result?.totalPages || 1
    totalCount.value = result?.totalCount || 0
  } catch (err: unknown) {
    const appErr = err as AppError
    errorMessage.value = appErr?.message || (isAr.value ? 'تعذر تحميل الخبراء' : 'Failed to load experts')
    toast.error(errorMessage.value)
  } finally {
    isLoading.value = false
  }
}

// Watch filters
watch([searchQuery, selectedStatus, selectedFeatured], () => {
  currentPage.value = 1
  fetchExperts()
})

watch(currentPage, () => {
  fetchExperts()
})

const openCreateModal = () => {
  modalMode.value = 'create'
  editingId.value = null
  form.value = {
    fullNameEn: '',
    fullNameAr: '',
    titleEn: '',
    titleAr: '',
    avatarUrl: '',
    displayOrder: (experts.value.length || 0) + 1,
    isFeaturedOnHome: true,
    isActive: true
  }
  formErrors.value = {}
  isModalOpen.value = true
}

const openEditModal = (expert: ExpertDto) => {
  modalMode.value = 'edit'
  editingId.value = expert.id
  form.value = {
    fullNameEn: expert.fullNameEn || '',
    fullNameAr: expert.fullNameAr || '',
    titleEn: expert.titleEn || '',
    titleAr: expert.titleAr || '',
    avatarUrl: expert.avatarUrl || '',
    displayOrder: expert.displayOrder ?? 1,
    isFeaturedOnHome: expert.isFeaturedOnHome ?? false,
    isActive: expert.isActive ?? true
  }
  formErrors.value = {}
  isModalOpen.value = true
}

const validateForm = (): boolean => {
  const errors: Record<string, string> = {}

  if (!form.value.fullNameEn.trim() && !form.value.fullNameAr.trim()) {
    errors.name = isAr.value
      ? 'يرجى إدخال اسم الخبير بلغة واحدة على الأقل'
      : 'Expert full name is required in at least one language'
  }

  if (!form.value.titleEn.trim() && !form.value.titleAr.trim()) {
    errors.title = isAr.value
      ? 'يرجى إدخال المسمى المهني بلغة واحدة على الأقل'
      : 'Professional title is required in at least one language'
  }

  formErrors.value = errors
  return Object.keys(errors).length === 0
}

const handleSubmit = async () => {
  if (!validateForm()) return

  isSubmitting.value = true
  try {
    const payload: CreateExpertPayload | UpdateExpertPayload = {
      fullNameEn: form.value.fullNameEn.trim() || form.value.fullNameAr.trim(),
      fullNameAr: form.value.fullNameAr.trim() || form.value.fullNameEn.trim(),
      titleEn: form.value.titleEn.trim() || form.value.titleAr.trim(),
      titleAr: form.value.titleAr.trim() || form.value.titleEn.trim(),
      avatarUrl: form.value.avatarUrl.trim() || null,
      displayOrder: Number(form.value.displayOrder) || 1,
      isFeaturedOnHome: Boolean(form.value.isFeaturedOnHome),
      isActive: Boolean(form.value.isActive)
    }

    if (modalMode.value === 'create') {
      await coreServices.experts.create(payload)
      toast.success(t('experts.expertCreatedSuccess'))
    } else if (editingId.value) {
      await coreServices.experts.update(editingId.value, payload)
      toast.success(t('experts.expertUpdatedSuccess'))
    }

    isModalOpen.value = false
    await fetchExperts()
  } catch (err: unknown) {
    const appErr = err as AppError
    toast.error(appErr?.message || (isAr.value ? 'حدث خطأ أثناء حفظ الخبير' : 'An error occurred while saving expert'))
  } finally {
    isSubmitting.value = false
  }
}

const toggleFeatured = async (expert: ExpertDto) => {
  try {
    const newFeatured = !expert.isFeaturedOnHome
    await coreServices.experts.update(expert.id, {
      fullNameEn: expert.fullNameEn,
      fullNameAr: expert.fullNameAr,
      titleEn: expert.titleEn,
      titleAr: expert.titleAr,
      avatarUrl: expert.avatarUrl,
      displayOrder: expert.displayOrder,
      isFeaturedOnHome: newFeatured,
      isActive: expert.isActive
    })
    expert.isFeaturedOnHome = newFeatured
    toast.success(isAr.value ? 'تم تحديث التمييز بالرئيسية' : 'Featured status updated')
  } catch (err: unknown) {
    const appErr = err as AppError
    toast.error(appErr?.message || (isAr.value ? 'تعذر التحديث' : 'Failed to update'))
  }
}

const toggleStatus = async (expert: ExpertDto) => {
  try {
    const newStatus = !expert.isActive
    await coreServices.experts.update(expert.id, {
      fullNameEn: expert.fullNameEn,
      fullNameAr: expert.fullNameAr,
      titleEn: expert.titleEn,
      titleAr: expert.titleAr,
      avatarUrl: expert.avatarUrl,
      displayOrder: expert.displayOrder,
      isFeaturedOnHome: expert.isFeaturedOnHome,
      isActive: newStatus
    })
    expert.isActive = newStatus
    toast.success(isAr.value ? 'تم تحديث حالة التفعيل' : 'Status updated')
  } catch (err: unknown) {
    const appErr = err as AppError
    toast.error(appErr?.message || (isAr.value ? 'تعذر تغيير الحالة' : 'Failed to toggle status'))
  }
}

const handleDelete = async (expert: ExpertDto) => {
  const name = isAr.value ? (expert.fullNameAr || expert.fullNameEn) : (expert.fullNameEn || expert.fullNameAr)
  const ok = await confirm({
    title: t('experts.deleteConfirmTitle'),
    message: `${t('experts.deleteConfirmDesc')} ("${name}")`,
    confirmText: t('common.delete'),
    cancelText: t('common.cancel'),
    type: 'danger'
  })

  if (!ok) return

  try {
    await coreServices.experts.delete(expert.id)
    toast.success(t('experts.expertDeletedSuccess'))
    await fetchExperts()
  } catch (err: unknown) {
    const appErr = err as AppError
    toast.error(appErr?.message || (isAr.value ? 'تعذر حذف الخبير' : 'Failed to delete expert'))
  }
}

const handleAction = (act: string, item: ExpertDto) => {
  if (act === 'edit') openEditModal(item)
  else if (act === 'delete') handleDelete(item)
}

onMounted(() => {
  fetchExperts()
})
</script>

<template>
  <AppShell>
    <div class="flex flex-col max-w-7xl mx-auto space-y-6">
      <!-- Page Header -->
      <PageHeader
        :title="t('experts.title')"
        :description="t('experts.subtitle')"
      >
        <template #actions>
          <button
            type="button"
            @click="openCreateModal"
            class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs hover:shadow-md cursor-pointer"
          >
            <Plus class="w-4 h-4 stroke-[2.5]" />
            {{ t('experts.addExpert') }}
          </button>
        </template>
      </PageHeader>

      <!-- Main Box -->
      <div class="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
        <!-- Top Toolbar & Filters -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
          <!-- Search -->
          <div class="relative flex-1 max-w-md">
            <Search class="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="t('experts.searchPlaceholder')"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl ps-9 pe-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition-all"
            />
          </div>

          <!-- Filters -->
          <div class="flex items-center gap-2 flex-wrap">
            <select
              v-model="selectedFeatured"
              class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white cursor-pointer"
            >
              <option value="all">{{ isAr ? 'كل التمييز' : 'All Featured' }}</option>
              <option value="featured">{{ isAr ? 'مميز بالرئيسية' : 'Featured on Home' }}</option>
              <option value="not_featured">{{ isAr ? 'غير مميز' : 'Not Featured' }}</option>
            </select>

            <select
              v-model="selectedStatus"
              class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white cursor-pointer"
            >
              <option value="all">{{ t('common.all') }}</option>
              <option value="active">{{ t('common.active') }}</option>
              <option value="inactive">{{ t('common.inactive') }}</option>
            </select>

            <button
              type="button"
              @click="fetchExperts"
              :disabled="isLoading"
              class="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              :title="t('common.refresh')"
            >
              <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': isLoading }" />
            </button>
          </div>
        </div>

        <!-- Table State Handler -->
        <DataState
          :loading="isLoading"
          :error="errorMessage"
          :empty="!isLoading && experts.length === 0"
          :empty-title="t('experts.noExpertsFound')"
          :empty-message="t('experts.noExpertsDesc')"
          @retry="fetchExperts"
        >
          <div class="overflow-x-auto">
            <table class="w-full text-start text-xs min-w-[700px]">
              <thead>
                <tr class="text-[11px] font-bold text-slate-400 border-b border-slate-100 uppercase tracking-wider bg-slate-50/50">
                  <th class="py-3.5 px-4 text-start">{{ isAr ? 'الخبير' : 'Expert' }}</th>
                  <th class="py-3.5 px-4 text-start">{{ isAr ? 'المسمى المهني' : 'Title / Role' }}</th>
                  <th class="py-3.5 px-4 text-center">{{ t('experts.displayOrder') }}</th>
                  <th class="py-3.5 px-4 text-center">{{ t('experts.isFeatured') }}</th>
                  <th class="py-3.5 px-4 text-center">{{ t('experts.status') }}</th>
                  <th class="py-3.5 px-4 text-end">{{ t('common.actions') }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr
                  v-for="expert in experts"
                  :key="expert.id"
                  class="hover:bg-slate-50/70 transition-colors"
                >
                  <!-- Avatar & Full Name -->
                  <td class="py-3.5 px-4 text-start">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                        <img
                          v-if="expert.avatarUrl"
                          :src="resolveAttachmentUrl(expert.avatarUrl, 'avatar')"
                          :alt="expert.fullNameEn"
                          class="w-full h-full object-cover"
                          @error="handleImageError"
                        />
                        <User v-else class="w-5 h-5 text-slate-400" />
                      </div>
                      <div class="flex flex-col min-w-0">
                        <span class="font-bold text-slate-900 truncate">
                          {{ isAr ? (expert.fullNameAr || expert.fullNameEn) : (expert.fullNameEn || expert.fullNameAr) }}
                        </span>
                        <span class="text-[11px] text-slate-400 truncate">
                          {{ isAr ? expert.fullNameEn : expert.fullNameAr }}
                        </span>
                      </div>
                    </div>
                  </td>

                  <!-- Title / Role -->
                  <td class="py-3.5 px-4 text-start">
                    <div class="flex flex-col">
                      <span class="font-medium text-slate-700">
                        {{ isAr ? (expert.titleAr || expert.titleEn) : (expert.titleEn || expert.titleAr) }}
                      </span>
                      <span class="text-[11px] text-slate-400">
                        {{ isAr ? expert.titleEn : expert.titleAr }}
                      </span>
                    </div>
                  </td>

                  <!-- Display Order -->
                  <td class="py-3.5 px-4 text-center font-bold text-slate-700">
                    {{ expert.displayOrder }}
                  </td>

                  <!-- Featured on Home Toggle -->
                  <td class="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      @click="toggleFeatured(expert)"
                      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer"
                      :class="expert.isFeaturedOnHome ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'"
                      :title="isAr ? 'تبديل التمييز بالرئيسية' : 'Toggle Home Featured'"
                    >
                      <Star class="w-3.5 h-3.5" :class="expert.isFeaturedOnHome ? 'fill-amber-500 text-amber-500' : 'text-slate-400'" />
                      {{ expert.isFeaturedOnHome ? (isAr ? 'مميز' : 'Featured') : (isAr ? 'عادي' : 'Standard') }}
                    </button>
                  </td>

                  <!-- Active Status Toggle -->
                  <td class="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      @click="toggleStatus(expert)"
                      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer"
                      :class="expert.isActive ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'"
                    >
                      <CheckCircle2 v-if="expert.isActive" class="w-3.5 h-3.5 text-emerald-600" />
                      <XCircle v-else class="w-3.5 h-3.5 text-slate-400" />
                      {{ expert.isActive ? t('common.active') : t('common.inactive') }}
                    </button>
                  </td>

                  <!-- Actions -->
                  <td class="py-3.5 px-4 text-end">
                    <ActionMenu
                      :items="[
                        { id: 'edit', label: t('common.edit') },
                        { id: 'delete', label: t('common.delete'), danger: true }
                      ]"
                      @select="(act) => handleAction(act, expert)"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span class="text-xs text-slate-500">
              {{ isAr ? `إجمالي الخبراء: ${totalCount}` : `Total Experts: ${totalCount}` }}
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

    <!-- Create / Edit Expert Modal -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
    >
      <div class="bg-white rounded-3xl border border-slate-200 max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl flex flex-col gap-5">
        <!-- Modal Header -->
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 class="text-sm font-black text-slate-900">
              {{ modalMode === 'create' ? t('experts.addExpert') : t('experts.editExpert') }}
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">
              {{ t('experts.modalDesc') }}
            </p>
          </div>
          <button
            type="button"
            @click="isModalOpen = false"
            class="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Form Body -->
        <form @submit.prevent="handleSubmit" class="flex flex-col gap-4">
          <!-- Full Names (Bilingual) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">
                {{ t('experts.fullNameAr') }} *
              </label>
              <input
                v-model="form.fullNameAr"
                type="text"
                dir="rtl"
                placeholder="مثال: د. أحمد المنصوري"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">
                {{ t('experts.fullNameEn') }} *
              </label>
              <input
                v-model="form.fullNameEn"
                type="text"
                dir="ltr"
                placeholder="e.g. Dr. Ahmed Al-Mansouri"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
              />
            </div>
          </div>
          <p v-if="formErrors.name" class="text-xs text-rose-500 font-semibold">{{ formErrors.name }}</p>

          <!-- Professional Titles / Roles (Bilingual) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">
                {{ t('experts.titleAr') }} *
              </label>
              <input
                v-model="form.titleAr"
                type="text"
                dir="rtl"
                placeholder="مثال: كبير محللي أسواق المال العالمية"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">
                {{ t('experts.titleEn') }} *
              </label>
              <input
                v-model="form.titleEn"
                type="text"
                dir="ltr"
                placeholder="e.g. Senior Global Market Strategist"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
              />
            </div>
          </div>
          <p v-if="formErrors.title" class="text-xs text-rose-500 font-semibold">{{ formErrors.title }}</p>

          <!-- Display Order -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold text-slate-700">{{ t('experts.displayOrder') }}</label>
            <input
              v-model.number="form.displayOrder"
              type="number"
              min="1"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
            />
          </div>

          <!-- Avatar Image Upload -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold text-slate-700">{{ t('experts.avatarUrl') }}</label>
            <ImageUploader
              v-model="form.avatarUrl"
              :label="t('experts.avatarUrl')"
              hint="Square portrait (PNG, JPG or WEBP)"
              aspect-ratio="aspect-square"
            />
          </div>

          <!-- Feature on Home & Active Toggles -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <label class="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                v-model="form.isFeaturedOnHome"
                type="checkbox"
                class="w-4 h-4 text-emerald-600 rounded-md border-slate-300 focus:ring-emerald-500"
              />
              <span class="text-xs font-bold text-slate-800">{{ t('experts.isFeaturedOnHome') }}</span>
            </label>

            <label class="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                v-model="form.isActive"
                type="checkbox"
                class="w-4 h-4 text-emerald-600 rounded-md border-slate-300 focus:ring-emerald-500"
              />
              <span class="text-xs font-bold text-slate-800">{{ t('experts.isActive') }}</span>
            </label>
          </div>

          <!-- Modal Actions -->
          <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              @click="isModalOpen = false"
              class="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
              {{ t('common.save') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </AppShell>
</template>
