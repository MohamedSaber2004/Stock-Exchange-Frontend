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
  X,
  Plus,
  ChevronUp,
  ChevronDown,
  Briefcase
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

interface ConsultationAreaFormItem {
  id?: string
  textEn: string
  textAr: string
  displayOrder: number
}

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
  isActive: true,
  consultationAreas: [] as ConsultationAreaFormItem[]
})
const editErrors = ref<Record<string, string>>({})

const addEditConsultationArea = () => {
  editForm.value.consultationAreas.push({
    textAr: '',
    textEn: '',
    displayOrder: editForm.value.consultationAreas.length + 1
  })
}

const removeEditConsultationArea = (idx: number) => {
  editForm.value.consultationAreas.splice(idx, 1)
}

const moveEditConsultationArea = (idx: number, direction: 'up' | 'down') => {
  const targetIdx = direction === 'up' ? idx - 1 : idx + 1
  if (targetIdx < 0 || targetIdx >= editForm.value.consultationAreas.length) return
  const temp = editForm.value.consultationAreas[idx]!
  editForm.value.consultationAreas[idx] = editForm.value.consultationAreas[targetIdx]!
  editForm.value.consultationAreas[targetIdx] = temp
}

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
    isActive: expert.value.isActive ?? true,
    consultationAreas: expert.value.consultationAreas
      ? expert.value.consultationAreas.map((a, i) => ({
          id: a.id,
          textEn: a.textEn || '',
          textAr: a.textAr || '',
          displayOrder: a.displayOrder ?? (i + 1)
        }))
      : []
  }
  editErrors.value = {}
  isEditModalOpen.value = true
}

const validateEditForm = (): boolean => {
  const errors: Record<string, string> = {}
  if (!editForm.value.fullNameAr.trim()) {
    errors.fullNameAr = isAr.value
      ? 'يرجى إدخال اسم الخبير بالعربية'
      : 'Expert Arabic full name is required'
  }
  if (!editForm.value.fullNameEn.trim()) {
    errors.fullNameEn = isAr.value
      ? 'يرجى إدخال اسم الخبير بالإنجليزية'
      : 'Expert English full name is required'
  }
  if (!editForm.value.titleAr.trim()) {
    errors.titleAr = isAr.value
      ? 'يرجى إدخال المسمى المهني بالعربية'
      : 'Professional title in Arabic is required'
  }
  if (!editForm.value.titleEn.trim()) {
    errors.titleEn = isAr.value
      ? 'يرجى إدخال المسمى المهني بالإنجليزية'
      : 'Professional title in English is required'
  }
  if (!editForm.value.avatarUrl?.trim()) {
    errors.avatarUrl = isAr.value
      ? 'يرجى رفع الصورة الشخصية للخبير'
      : 'Expert avatar picture is required'
  }

  // Validate consultation areas
  for (let i = 0; i < editForm.value.consultationAreas.length; i++) {
    const area = editForm.value.consultationAreas[i]!
    const hasAr = Boolean(area.textAr?.trim())
    const hasEn = Boolean(area.textEn?.trim())
    if (hasAr !== hasEn) {
      toast.error(t('experts.consultationAreaRequired'))
      return false
    }
  }

  editErrors.value = errors
  if (Object.keys(errors).length > 0) {
    const first = Object.values(errors)[0]
    if (first) toast.error(first)
    return false
  }
  return true
}

const handleSaveEdit = async () => {
  if (!expert.value || !validateEditForm()) return
  isSubmitting.value = true
  try {
    const validAreas = editForm.value.consultationAreas
      .filter(a => a.textAr.trim() && a.textEn.trim())
      .map((a, idx) => ({
        id: a.id,
        textAr: a.textAr.trim(),
        textEn: a.textEn.trim(),
        displayOrder: idx + 1
      }))

    const payload: UpdateExpertPayload = {
      fullNameEn: editForm.value.fullNameEn.trim() || editForm.value.fullNameAr.trim(),
      fullNameAr: editForm.value.fullNameAr.trim() || editForm.value.fullNameEn.trim(),
      titleEn: editForm.value.titleEn.trim() || editForm.value.titleAr.trim(),
      titleAr: editForm.value.titleAr.trim() || editForm.value.titleEn.trim(),
      avatarUrl: editForm.value.avatarUrl.trim() || null,
      displayOrder: Number(editForm.value.displayOrder) || 1,
      isFeaturedOnHome: Boolean(editForm.value.isFeaturedOnHome),
      isActive: Boolean(editForm.value.isActive),
      consultationAreas: validAreas
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

              <!-- Consultation Areas Card -->
              <div class="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs">
                <div class="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div class="flex items-center gap-2">
                    <Briefcase class="w-4 h-4 text-emerald-600" />
                    <div>
                      <h3 class="text-xs font-bold uppercase tracking-wider text-slate-700">
                        {{ t('experts.consultationAreasTitle') }}
                      </h3>
                      <p class="text-[11px] text-slate-400">
                        {{ t('experts.consultationAreasSubtitle') }}
                      </p>
                    </div>
                  </div>

                  <span
                    v-if="expert.consultationAreas && expert.consultationAreas.length > 0"
                    class="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100"
                  >
                    {{ expert.consultationAreas.length }}
                  </span>
                </div>

                <div class="pt-5">
                  <div v-if="expert.consultationAreas && expert.consultationAreas.length > 0" class="space-y-3">
                    <div
                      v-for="(area, idx) in expert.consultationAreas"
                      :key="area.id || idx"
                      class="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 flex items-start gap-3 hover:bg-slate-50 transition-colors"
                    >
                      <div class="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        {{ idx + 1 }}
                      </div>
                      <div class="flex-1 space-y-1">
                        <div class="flex items-center gap-2">
                          <CheckCircle2 class="w-4 h-4 text-emerald-600 shrink-0" />
                          <p class="text-xs font-bold text-slate-900 leading-snug">
                            {{ activeTab === 'ar' ? (area.textAr || area.textEn) : (area.textEn || area.textAr) }}
                          </p>
                        </div>
                        <p class="text-[11px] text-slate-400 ps-6">
                          {{ activeTab === 'ar' ? area.textEn : area.textAr }}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div v-else class="text-center py-6 px-4 rounded-xl bg-slate-50 border border-dashed border-slate-200">
                    <p class="text-xs text-slate-400 font-medium">
                      {{ t('experts.noConsultationAreas') }}
                    </p>
                    <button
                      type="button"
                      @click="openEditModal"
                      class="mt-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                    >
                      + {{ t('experts.addConsultationArea') }}
                    </button>
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
              {{ t('experts.avatarUrl') }} *
            </label>
            <ImageUploader
              v-model="editForm.avatarUrl"
              entity-type="avatar"
              aspect-ratio="1:1"
            />
            <p v-if="editErrors.avatarUrl" class="text-[11px] text-red-500 font-semibold mt-1">
              {{ editErrors.avatarUrl }}
            </p>
          </div>

          <!-- Bilingual Names -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">
                {{ t('experts.fullNameAr') }} *
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
                {{ t('experts.fullNameEn') }} *
              </label>
              <input
                v-model="editForm.fullNameEn"
                type="text"
                placeholder="e.g. Dr. Ahmed El-Mahmoudy"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
              />
            </div>
          </div>
          <div v-if="editErrors.fullNameAr || editErrors.fullNameEn" class="flex flex-col gap-0.5">
            <p v-if="editErrors.fullNameAr" class="text-[11px] text-red-500 font-semibold">
              {{ editErrors.fullNameAr }}
            </p>
            <p v-if="editErrors.fullNameEn" class="text-[11px] text-red-500 font-semibold">
              {{ editErrors.fullNameEn }}
            </p>
          </div>

          <!-- Bilingual Titles / Roles -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">
                {{ t('experts.titleAr') }} *
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
                {{ t('experts.titleEn') }} *
              </label>
              <input
                v-model="editForm.titleEn"
                type="text"
                placeholder="e.g. Senior Financial Market Analyst"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
              />
            </div>
          </div>
          <div v-if="editErrors.titleAr || editErrors.titleEn" class="flex flex-col gap-0.5">
            <p v-if="editErrors.titleAr" class="text-[11px] text-red-500 font-semibold">
              {{ editErrors.titleAr }}
            </p>
            <p v-if="editErrors.titleEn" class="text-[11px] text-red-500 font-semibold">
              {{ editErrors.titleEn }}
            </p>
          </div>

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

          <!-- Consultation Areas Management Section -->
          <div class="space-y-3 pt-3 border-t border-slate-100">
            <div class="flex items-center justify-between">
              <div>
                <label class="block text-xs font-bold text-slate-800">
                  {{ t('experts.consultationAreasTitle') }}
                </label>
                <p class="text-[11px] text-slate-400">
                  {{ t('experts.consultationAreasSubtitle') }}
                </p>
              </div>

              <button
                type="button"
                @click="addEditConsultationArea"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200/80 transition-colors cursor-pointer"
              >
                <Plus class="w-3.5 h-3.5" />
                <span>{{ t('experts.addConsultationArea') }}</span>
              </button>
            </div>

            <div v-if="editForm.consultationAreas.length > 0" class="space-y-3 max-h-60 overflow-y-auto pe-1">
              <div
                v-for="(item, idx) in editForm.consultationAreas"
                :key="idx"
                class="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 relative group"
              >
                <div class="flex items-center justify-between pb-1 border-b border-slate-200/40">
                  <span class="text-[11px] font-bold text-slate-500">
                    #{{ idx + 1 }}
                  </span>
                  <div class="flex items-center gap-1">
                    <button
                      type="button"
                      :disabled="idx === 0"
                      @click="moveEditConsultationArea(idx, 'up')"
                      class="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors disabled:opacity-30 cursor-pointer"
                      title="Move Up"
                    >
                      <ChevronUp class="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      :disabled="idx === editForm.consultationAreas.length - 1"
                      @click="moveEditConsultationArea(idx, 'down')"
                      class="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors disabled:opacity-30 cursor-pointer"
                      title="Move Down"
                    >
                      <ChevronDown class="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      @click="removeEditConsultationArea(idx)"
                      class="p-1 rounded-md text-red-500 hover:bg-red-50 transition-colors cursor-pointer ms-1"
                      title="Remove"
                    >
                      <Trash2 class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label class="block text-[10px] font-semibold text-slate-500 mb-0.5">
                      {{ t('experts.consultationAreaTextAr') }}
                    </label>
                    <input
                      v-model="item.textAr"
                      type="text"
                      dir="rtl"
                      :placeholder="t('experts.consultationAreaArPlaceholder')"
                      class="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                  <div>
                    <label class="block text-[10px] font-semibold text-slate-500 mb-0.5">
                      {{ t('experts.consultationAreaTextEn') }}
                    </label>
                    <input
                      v-model="item.textEn"
                      type="text"
                      dir="ltr"
                      :placeholder="t('experts.consultationAreaEnPlaceholder')"
                      class="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="text-center py-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-[11px] text-slate-400">
              {{ t('experts.noConsultationAreas') }}
            </div>
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
