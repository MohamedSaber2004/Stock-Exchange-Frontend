<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  ArrowRight,
  Edit,
  Trash2,
  User,
  Star,
  CheckCircle2,
  XCircle,
  Calendar,
  Globe,
  Smartphone,
  RefreshCw,
  X
} from 'lucide-vue-next'
import AppShell from '@/components/layout/AppShell.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import DataState from '@/components/ui/DataState.vue'
import MobileDeviceFrame from '@/components/mobile-preview/MobileDeviceFrame.vue'
import ImageUploader from '@/components/forms/ImageUploader.vue'
import { useFeedback } from '@/composables/useFeedback'
import { useI18n } from 'vue-i18n'
import { coreServices } from '@/di'
import { resolveAttachmentUrl, handleImageError } from '@/utils/attachment'
import type { ExpertDto, UpdateExpertPayload } from '@/domain/models/expert.model'
import type { AppError } from '@/domain/models/common.model'

const route = useRoute()
const router = useRouter()
const { toast, confirm } = useFeedback()
const { t, locale } = useI18n()
const isAr = computed(() => locale.value === 'ar')

const expertId = route.params.id as string
const expert = ref<ExpertDto | null>(null)
const isLoading = ref(true)
const errorMessage = ref<string | null>(null)

// Display tabs
const activeTab = ref<'ar' | 'en'>('ar')
const isTogglingActive = ref(false)
const isTogglingFeatured = ref(false)

// Edit Modal State
const isEditModalOpen = ref(false)
const isSubmitting = ref(false)
const editForm = ref({
  fullNameEn: '',
  fullNameAr: '',
  titleEn: '',
  titleAr: '',
  avatarUrl: '',
  displayOrder: 1,
  isFeaturedOnHome: true,
  isActive: true
})
const editErrors = ref<Record<string, string>>({})

const loadExpert = async () => {
  isLoading.value = true
  errorMessage.value = null
  try {
    const data = await coreServices.experts.getById(expertId)
    expert.value = data
  } catch (err: unknown) {
    const appErr = err as AppError
    errorMessage.value = appErr?.message || (isAr.value ? 'تعذر تحميل بيانات الخبير' : 'Failed to load expert details')
    toast.error(errorMessage.value)
  } finally {
    isLoading.value = false
  }
}

const toggleActive = async () => {
  if (!expert.value || isTogglingActive.value) return
  isTogglingActive.value = true
  const newActive = !expert.value.isActive
  try {
    const payload: UpdateExpertPayload = {
      fullNameEn: expert.value.fullNameEn,
      fullNameAr: expert.value.fullNameAr,
      titleEn: expert.value.titleEn,
      titleAr: expert.value.titleAr,
      avatarUrl: expert.value.avatarUrl,
      displayOrder: expert.value.displayOrder,
      isFeaturedOnHome: expert.value.isFeaturedOnHome,
      isActive: newActive
    }
    await coreServices.experts.update(expert.value.id, payload)
    expert.value.isActive = newActive
    toast.success(t('experts.toggleActiveSuccess'))
  } catch (err: unknown) {
    const appErr = err as AppError
    toast.error(appErr?.message || (isAr.value ? 'تعذر تعديل الحالة' : 'Failed to toggle active state'))
  } finally {
    isTogglingActive.value = false
  }
}

const toggleFeatured = async () => {
  if (!expert.value || isTogglingFeatured.value) return
  isTogglingFeatured.value = true
  const newFeatured = !expert.value.isFeaturedOnHome
  try {
    const payload: UpdateExpertPayload = {
      fullNameEn: expert.value.fullNameEn,
      fullNameAr: expert.value.fullNameAr,
      titleEn: expert.value.titleEn,
      titleAr: expert.value.titleAr,
      avatarUrl: expert.value.avatarUrl,
      displayOrder: expert.value.displayOrder,
      isFeaturedOnHome: newFeatured,
      isActive: expert.value.isActive
    }
    await coreServices.experts.update(expert.value.id, payload)
    expert.value.isFeaturedOnHome = newFeatured
    toast.success(t('experts.toggleFeaturedSuccess'))
  } catch (err: unknown) {
    const appErr = err as AppError
    toast.error(appErr?.message || (isAr.value ? 'تعذر تعديل التمييز' : 'Failed to toggle featured state'))
  } finally {
    isTogglingFeatured.value = false
  }
}

const handleDelete = async () => {
  if (!expert.value) return
  const name = isAr.value
    ? (expert.value.fullNameAr || expert.value.fullNameEn)
    : (expert.value.fullNameEn || expert.value.fullNameAr)

  const ok = await confirm({
    title: t('experts.deleteConfirmTitle'),
    message: `${t('experts.deleteConfirmDesc')} ("${name}")`,
    confirmText: t('common.delete'),
    cancelText: t('common.cancel'),
    type: 'danger'
  })

  if (!ok) return

  try {
    await coreServices.experts.delete(expert.value.id)
    toast.success(t('experts.expertDeletedSuccess'))
    router.push('/experts')
  } catch (err: unknown) {
    const appErr = err as AppError
    toast.error(appErr?.message || (isAr.value ? 'تعذر حذف الخبير' : 'Failed to delete expert'))
  }
}

const openEditModal = () => {
  if (!expert.value) return
  editForm.value = {
    fullNameEn: expert.value.fullNameEn || '',
    fullNameAr: expert.value.fullNameAr || '',
    titleEn: expert.value.titleEn || '',
    titleAr: expert.value.titleAr || '',
    avatarUrl: expert.value.avatarUrl || '',
    displayOrder: expert.value.displayOrder ?? 1,
    isFeaturedOnHome: expert.value.isFeaturedOnHome ?? true,
    isActive: expert.value.isActive ?? true
  }
  editErrors.value = {}
  isEditModalOpen.value = true
}

const validateEditForm = (): boolean => {
  const errors: Record<string, string> = {}
  if (!editForm.value.fullNameEn.trim() && !editForm.value.fullNameAr.trim()) {
    errors.name = isAr.value
      ? 'يرجى إدخال اسم الخبير بلغة واحدة على الأقل'
      : 'Expert full name is required in at least one language'
  }
  if (!editForm.value.titleEn.trim() && !editForm.value.titleAr.trim()) {
    errors.title = isAr.value
      ? 'يرجى إدخال المسمى المهني بلغة واحدة على الأقل'
      : 'Professional title is required in at least one language'
  }
  editErrors.value = errors
  return Object.keys(errors).length === 0
}

const handleSaveEdit = async () => {
  if (!expert.value || !validateEditForm()) return
  isSubmitting.value = true
  try {
    const payload: UpdateExpertPayload = {
      fullNameEn: editForm.value.fullNameEn.trim() || editForm.value.fullNameAr.trim(),
      fullNameAr: editForm.value.fullNameAr.trim() || editForm.value.fullNameEn.trim(),
      titleEn: editForm.value.titleEn.trim() || editForm.value.titleAr.trim(),
      titleAr: editForm.value.titleAr.trim() || editForm.value.titleEn.trim(),
      avatarUrl: editForm.value.avatarUrl.trim() || null,
      displayOrder: Number(editForm.value.displayOrder) || 1,
      isFeaturedOnHome: Boolean(editForm.value.isFeaturedOnHome),
      isActive: Boolean(editForm.value.isActive)
    }

    await coreServices.experts.update(expert.value.id, payload)
    toast.success(t('experts.expertUpdatedSuccess'))
    isEditModalOpen.value = false
    await loadExpert()
  } catch (err: unknown) {
    const appErr = err as AppError
    toast.error(appErr?.message || (isAr.value ? 'حدث خطأ أثناء حفظ التعديلات' : 'Failed to update expert'))
  } finally {
    isSubmitting.value = false
  }
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-'
  try {
    return new Date(dateStr).toLocaleDateString(isAr.value ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch {
    return dateStr
  }
}

const displayName = computed(() => {
  if (!expert.value) return ''
  return isAr.value
    ? (expert.value.fullNameAr || expert.value.fullNameEn)
    : (expert.value.fullNameEn || expert.value.fullNameAr)
})

const displayRole = computed(() => {
  if (!expert.value) return ''
  return isAr.value
    ? (expert.value.titleAr || expert.value.titleEn)
    : (expert.value.titleEn || expert.value.titleAr)
})

onMounted(() => {
  loadExpert()
})
</script>

<template>
  <AppShell>
    <div class="flex flex-col max-w-7xl mx-auto space-y-6">
      <!-- Breadcrumb & Back Nav -->
      <div class="flex items-center justify-between">
        <button
          type="button"
          @click="router.push('/experts')"
          class="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-emerald-600 transition-colors cursor-pointer group"
        >
          <component
            :is="isAr ? ArrowRight : ArrowLeft"
            class="w-4 h-4 transition-transform group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0.5"
          />
          <span>{{ t('experts.backToExperts') }}</span>
        </button>

        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="loadExpert"
            :disabled="isLoading"
            class="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            :title="t('common.refresh')"
          >
            <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': isLoading }" />
          </button>
        </div>
      </div>

      <!-- Data State Wrapper -->
      <DataState
        :loading="isLoading"
        :error="errorMessage"
        :empty="!isLoading && !expert"
        :empty-title="t('experts.notFoundTitle')"
        :empty-message="t('experts.notFoundDesc')"
        @retry="loadExpert"
      >
        <div v-if="expert" class="space-y-6">
          <!-- Page Header -->
          <PageHeader
            :title="displayName"
            :description="displayRole"
          >
            <template #actions>
              <div class="flex items-center gap-2 flex-wrap">
                <!-- Status Badges -->
                <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border"
                  :class="expert.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' : 'bg-slate-100 text-slate-600 border-slate-200'"
                >
                  <CheckCircle2 v-if="expert.isActive" class="w-3.5 h-3.5 text-emerald-600" />
                  <XCircle v-else class="w-3.5 h-3.5 text-slate-400" />
                  {{ expert.isActive ? t('common.active') : t('common.inactive') }}
                </div>

                <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border"
                  :class="expert.isFeaturedOnHome ? 'bg-amber-50 text-amber-700 border-amber-200/60' : 'bg-slate-50 text-slate-500 border-slate-200'"
                >
                  <Star class="w-3.5 h-3.5" :class="expert.isFeaturedOnHome ? 'fill-amber-500 text-amber-500' : 'text-slate-400'" />
                  {{ expert.isFeaturedOnHome ? (isAr ? 'مميز بالرئيسية' : 'Featured on Home') : (isAr ? 'عرض قياسي' : 'Standard') }}
                </div>

                <!-- Edit Button -->
                <button
                  type="button"
                  @click="openEditModal"
                  class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Edit class="w-3.5 h-3.5" />
                  {{ t('common.edit') }}
                </button>

                <!-- Delete Button -->
                <button
                  type="button"
                  @click="handleDelete"
                  class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/80 text-xs font-bold transition-all cursor-pointer"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                  {{ t('common.delete') }}
                </button>
              </div>
            </template>
          </PageHeader>

          <!-- Main Grid -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <!-- Left Column: Details & Cards -->
            <div class="lg:col-span-7 xl:col-span-7 space-y-6">
              <!-- Profile Overview Card -->
              <div class="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs">
                <div class="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div class="flex items-center gap-2">
                    <User class="w-4 h-4 text-emerald-600" />
                    <h3 class="text-xs font-bold uppercase tracking-wider text-slate-700">
                      {{ t('experts.profileCard') }}
                    </h3>
                  </div>

                  <span class="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                    <Calendar class="w-3.5 h-3.5 text-slate-400" />
                    {{ formatDate(expert.createdAt) }}
                  </span>
                </div>

                <div class="pt-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
                  <!-- Avatar Large Display -->
                  <div class="relative group shrink-0">
                    <div class="w-28 h-28 rounded-2xl overflow-hidden bg-slate-100 border-2 border-slate-200/80 shadow-xs flex items-center justify-center">
                      <img
                        v-if="expert.avatarUrl"
                        :src="resolveAttachmentUrl(expert.avatarUrl, 'avatar')"
                        :alt="displayName"
                        class="w-full h-full object-cover"
                        @error="handleImageError"
                      />
                      <User v-else class="w-12 h-12 text-slate-300" />
                    </div>

                    <span
                      class="absolute -bottom-1.5 -end-1.5 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-white"
                      :class="expert.isActive ? 'bg-emerald-500' : 'bg-slate-400'"
                      :title="expert.isActive ? t('common.active') : t('common.inactive')"
                    >
                      <CheckCircle2 v-if="expert.isActive" class="w-3.5 h-3.5" />
                      <XCircle v-else class="w-3.5 h-3.5" />
                    </span>
                  </div>

                  <!-- Profile Details Info -->
                  <div class="flex-1 flex flex-col items-center sm:items-start text-center sm:text-start space-y-3">
                    <div>
                      <h2 class="text-lg font-bold text-slate-900 leading-tight">
                        {{ displayName }}
                      </h2>
                      <p class="text-xs font-semibold text-emerald-700 mt-0.5">
                        {{ displayRole }}
                      </p>
                    </div>

                    <!-- Quick Action Toggles -->
                    <div class="flex items-center gap-2 pt-2 flex-wrap">
                      <button
                        type="button"
                        @click="toggleActive"
                        :disabled="isTogglingActive"
                        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer disabled:opacity-50"
                        :class="expert.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'"
                      >
                        <RefreshCw v-if="isTogglingActive" class="w-3.5 h-3.5 animate-spin" />
                        <CheckCircle2 v-else class="w-3.5 h-3.5" />
                        <span>{{ expert.isActive ? (isAr ? 'تعطيل الحساب' : 'Deactivate') : (isAr ? 'تفعيل الحساب' : 'Activate') }}</span>
                      </button>

                      <button
                        type="button"
                        @click="toggleFeatured"
                        :disabled="isTogglingFeatured"
                        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer disabled:opacity-50"
                        :class="expert.isFeaturedOnHome ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100' : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'"
                      >
                        <RefreshCw v-if="isTogglingFeatured" class="w-3.5 h-3.5 animate-spin" />
                        <Star v-else class="w-3.5 h-3.5" :class="expert.isFeaturedOnHome ? 'fill-amber-500 text-amber-500' : 'text-slate-400'" />
                        <span>{{ expert.isFeaturedOnHome ? (isAr ? 'إلغاء التمييز' : 'Unfeature') : (isAr ? 'تمييز بالرئيسية' : 'Feature on Home') }}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Bilingual Information Card -->
              <div class="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs">
                <div class="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div class="flex items-center gap-2">
                    <Globe class="w-4 h-4 text-emerald-600" />
                    <h3 class="text-xs font-bold uppercase tracking-wider text-slate-700">
                      {{ t('experts.bilingualInfo') }}
                    </h3>
                  </div>

                  <!-- Language Tab Switcher -->
                  <div class="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80">
                    <button
                      type="button"
                      @click="activeTab = 'ar'"
                      class="px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer"
                      :class="activeTab === 'ar' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'"
                    >
                      العربية (AR)
                    </button>
                    <button
                      type="button"
                      @click="activeTab = 'en'"
                      class="px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer"
                      :class="activeTab === 'en' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'"
                    >
                      English (EN)
                    </button>
                  </div>
                </div>

                <div class="pt-5 space-y-4">
                  <!-- Arabic Tab Content -->
                  <div v-if="activeTab === 'ar'" class="space-y-4">
                    <div class="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 space-y-1">
                      <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        {{ t('experts.fullNameAr') }}
                      </span>
                      <p class="text-sm font-bold text-slate-900">
                        {{ expert.fullNameAr || '-' }}
                      </p>
                    </div>

                    <div class="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 space-y-1">
                      <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        {{ t('experts.titleAr') }}
                      </span>
                      <p class="text-sm font-medium text-slate-700">
                        {{ expert.titleAr || '-' }}
                      </p>
                    </div>
                  </div>

                  <!-- English Tab Content -->
                  <div v-else class="space-y-4">
                    <div class="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 space-y-1">
                      <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        {{ t('experts.fullNameEn') }}
                      </span>
                      <p class="text-sm font-bold text-slate-900">
                        {{ expert.fullNameEn || '-' }}
                      </p>
                    </div>

                    <div class="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 space-y-1">
                      <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        {{ t('experts.titleEn') }}
                      </span>
                      <p class="text-sm font-medium text-slate-700">
                        {{ expert.titleEn || '-' }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Metadata Card -->
              <div class="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs">
                <div class="flex items-center gap-2 pb-4 border-b border-slate-100">
                  <Calendar class="w-4 h-4 text-emerald-600" />
                  <h3 class="text-xs font-bold uppercase tracking-wider text-slate-700">
                    {{ t('experts.metadataCard') }}
                  </h3>
                </div>

                <div class="pt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <!-- Created At -->
                  <div class="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 space-y-1">
                    <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      {{ isAr ? 'تاريخ الإنشاء' : 'Created Date' }}
                    </span>
                    <div class="flex items-center gap-2 text-xs font-bold text-slate-800">
                      <Calendar class="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{{ formatDate(expert.createdAt) }}</span>
                    </div>
                  </div>

                  <!-- Home Feature State -->
                  <div class="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 space-y-1">
                    <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      {{ t('experts.isFeaturedOnHome') }}
                    </span>
                    <span
                      class="inline-flex items-center gap-1 text-xs font-bold"
                      :class="expert.isFeaturedOnHome ? 'text-amber-600' : 'text-slate-500'"
                    >
                      <Star class="w-3.5 h-3.5" :class="expert.isFeaturedOnHome ? 'fill-amber-500' : ''" />
                      {{ expert.isFeaturedOnHome ? (isAr ? 'نعم، مميز بالرئيسية' : 'Yes, Featured on Home') : (isAr ? 'عرض قياسي' : 'Standard') }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Column: Interactive Mobile Frame Preview -->
            <div class="lg:col-span-5 xl:col-span-5 space-y-6">
              <div class="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs">
                <div class="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div class="flex items-center gap-2">
                    <Smartphone class="w-4 h-4 text-emerald-600" />
                    <div>
                      <h3 class="text-xs font-bold uppercase tracking-wider text-slate-700">
                        {{ t('experts.mobilePreviewTitle') }}
                      </h3>
                      <p class="text-[11px] text-slate-400">
                        {{ t('experts.mobilePreviewSubtitle') }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Phone Frame Container -->
                <div class="pt-6 flex justify-center">
                  <MobileDeviceFrame
                    type="expert"
                    :expert="expert"
                    :default-lang="activeTab"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </DataState>
    </div>

    <!-- Edit Expert Modal -->
    <div
      v-if="isEditModalOpen"
      class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
    >
      <div class="bg-white rounded-3xl border border-slate-200 max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl flex flex-col gap-5">
        <!-- Modal Header -->
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 class="text-base font-bold text-slate-900">
              {{ t('experts.editExpert') }}
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">
              {{ t('experts.modalDesc') }}
            </p>
          </div>
          <button
            type="button"
            @click="isEditModalOpen = false"
            class="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Form Body -->
        <form @submit.prevent="handleSaveEdit" class="space-y-4">
          <!-- Avatar Uploader -->
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1.5">
              {{ t('experts.avatarUrl') }}
            </label>
            <ImageUploader
              v-model="editForm.avatarUrl"
              entity-type="avatar"
              aspect-ratio="1:1"
            />
          </div>

          <!-- Bilingual Names -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">
                {{ t('experts.fullNameAr') }}
              </label>
              <input
                v-model="editForm.fullNameAr"
                type="text"
                placeholder="مثال: د. أحمد المحمودي"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
              />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">
                {{ t('experts.fullNameEn') }}
              </label>
              <input
                v-model="editForm.fullNameEn"
                type="text"
                placeholder="e.g. Dr. Ahmed El-Mahmoudy"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
              />
            </div>
          </div>
          <p v-if="editErrors.name" class="text-[11px] text-red-500 font-semibold">
            {{ editErrors.name }}
          </p>

          <!-- Bilingual Titles / Roles -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">
                {{ t('experts.titleAr') }}
              </label>
              <input
                v-model="editForm.titleAr"
                type="text"
                placeholder="مثال: كبير محللي أسواق المال"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
              />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">
                {{ t('experts.titleEn') }}
              </label>
              <input
                v-model="editForm.titleEn"
                type="text"
                placeholder="e.g. Senior Financial Market Analyst"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
              />
            </div>
          </div>
          <p v-if="editErrors.title" class="text-[11px] text-red-500 font-semibold">
            {{ editErrors.title }}
          </p>

          <!-- Display Order -->
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">
              {{ t('experts.displayOrder') }}
            </label>
            <input
              v-model.number="editForm.displayOrder"
              type="number"
              min="1"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
            />
          </div>

          <!-- Toggles -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <label class="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/60 transition-colors">
              <input
                v-model="editForm.isFeaturedOnHome"
                type="checkbox"
                class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span class="text-xs font-bold text-slate-700">{{ t('experts.isFeaturedOnHome') }}</span>
            </label>

            <label class="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/60 transition-colors">
              <input
                v-model="editForm.isActive"
                type="checkbox"
                class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span class="text-xs font-bold text-slate-700">{{ t('experts.isActive') }}</span>
            </label>
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              @click="isEditModalOpen = false"
              class="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
              <span>{{ t('common.save') }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </AppShell>
</template>
