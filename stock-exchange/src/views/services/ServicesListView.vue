<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  Plus,
  Search,
  X,
  RefreshCw,
  Briefcase,
  CheckCircle2,
  XCircle
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
import type { ServiceDto, CreateServicePayload, UpdateServicePayload } from '@/domain/models/service.model'
import type { AppError } from '@/domain/models/common.model'
import { resolveAttachmentUrl, handleImageError } from '@/utils/attachment'

const { toast, confirm } = useFeedback()
const router = useRouter()
const { t, locale } = useI18n()
const isAr = computed(() => locale.value === 'ar')

// State
const services = ref<ServiceDto[]>([])
const isLoading = ref(true)
const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)

// Pagination & Filtering
const searchQuery = ref('')
const selectedStatus = ref<string>('all')
const currentPage = ref(1)
const pageSize = ref(10)
const totalPages = ref(1)
const totalCount = ref(0)

// Modal State
const isModalOpen = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const editingId = ref<string | null>(null)

interface FormState {
  titleEn: string
  titleAr: string
  descriptionEn: string
  descriptionAr: string
  iconName: string
  imageUrl: string
  linkRoute: string
  displayOrder: number
  isActive: boolean
}

const form = ref<FormState>({
  titleEn: '',
  titleAr: '',
  descriptionEn: '',
  descriptionAr: '',
  iconName: '',
  imageUrl: '',
  linkRoute: '',
  displayOrder: 1,
  isActive: true
})

const formErrors = ref<Record<string, string>>({})

const fetchServices = async () => {
  isLoading.value = true
  errorMessage.value = null

  try {
    const params: {
      pageNumber: number
      pageSize: number
      search?: string
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

    const result = await coreServices.services.getAll(params)
    services.value = result?.items || []
    totalPages.value = result?.totalPages || 1
    totalCount.value = result?.totalCount || 0
  } catch (err: unknown) {
    const appErr = err as AppError
    errorMessage.value = appErr?.message || (isAr.value ? 'تعذر تحميل الخدمات' : 'Failed to load services')
    toast.error(errorMessage.value)
  } finally {
    isLoading.value = false
  }
}

// Watch filters
watch([searchQuery, selectedStatus], () => {
  currentPage.value = 1
  fetchServices()
})

watch(currentPage, () => {
  fetchServices()
})

const openCreateModal = () => {
  modalMode.value = 'create'
  editingId.value = null
  form.value = {
    titleEn: '',
    titleAr: '',
    descriptionEn: '',
    descriptionAr: '',
    iconName: 'TrendingUp',
    imageUrl: '',
    linkRoute: '',
    displayOrder: (services.value.length || 0) + 1,
    isActive: true
  }
  formErrors.value = {}
  isModalOpen.value = true
}

const openEditModal = (service: ServiceDto) => {
  modalMode.value = 'edit'
  editingId.value = service.id
  form.value = {
    titleEn: service.titleEn || '',
    titleAr: service.titleAr || '',
    descriptionEn: service.descriptionEn || '',
    descriptionAr: service.descriptionAr || '',
    iconName: service.iconName || 'TrendingUp',
    imageUrl: service.imageUrl || '',
    linkRoute: service.linkRoute || '',
    displayOrder: service.displayOrder ?? 1,
    isActive: service.isActive ?? true
  }
  formErrors.value = {}
  isModalOpen.value = true
}

const validateForm = (): boolean => {
  const errors: Record<string, string> = {}

  if (!form.value.titleEn.trim() && !form.value.titleAr.trim()) {
    errors.title = isAr.value
      ? 'يرجى إدخال عنوان الخدمة بلغة واحدة على الأقل'
      : 'Service title is required in at least one language'
  }

  if (!form.value.descriptionEn.trim() && !form.value.descriptionAr.trim()) {
    errors.description = isAr.value
      ? 'يرجى إدخال وصف الخدمة بلغة واحدة على الأقل'
      : 'Service description is required in at least one language'
  }

  formErrors.value = errors
  return Object.keys(errors).length === 0
}

const handleSubmit = async () => {
  if (!validateForm()) return

  isSubmitting.value = true
  try {
    const payload: CreateServicePayload | UpdateServicePayload = {
      titleEn: form.value.titleEn.trim() || form.value.titleAr.trim(),
      titleAr: form.value.titleAr.trim() || form.value.titleEn.trim(),
      descriptionEn: form.value.descriptionEn.trim() || form.value.descriptionAr.trim(),
      descriptionAr: form.value.descriptionAr.trim() || form.value.descriptionEn.trim(),
      iconName: form.value.iconName.trim() || 'TrendingUp',
      imageUrl: form.value.imageUrl.trim() || null,
      linkRoute: form.value.linkRoute.trim() || null,
      displayOrder: Number(form.value.displayOrder) || 1,
      isActive: Boolean(form.value.isActive)
    }

    if (modalMode.value === 'create') {
      await coreServices.services.create(payload)
      toast.success(t('services.serviceCreatedSuccess'))
    } else if (editingId.value) {
      await coreServices.services.update(editingId.value, payload)
      toast.success(t('services.serviceUpdatedSuccess'))
    }

    isModalOpen.value = false
    await fetchServices()
  } catch (err: unknown) {
    const appErr = err as AppError
    toast.error(appErr?.message || (isAr.value ? 'حدث خطأ أثناء حفظ الخدمة' : 'An error occurred while saving service'))
  } finally {
    isSubmitting.value = false
  }
}

const toggleStatus = async (service: ServiceDto) => {
  try {
    const newStatus = !service.isActive
    await coreServices.services.update(service.id, {
      titleEn: service.titleEn,
      titleAr: service.titleAr,
      descriptionEn: service.descriptionEn,
      descriptionAr: service.descriptionAr,
      iconName: service.iconName,
      imageUrl: service.imageUrl,
      linkRoute: service.linkRoute,
      displayOrder: service.displayOrder,
      isActive: newStatus
    })
    service.isActive = newStatus
    toast.success(isAr.value ? 'تم تحديث حالة الخدمة' : 'Service status updated')
  } catch (err: unknown) {
    const appErr = err as AppError
    toast.error(appErr?.message || (isAr.value ? 'تعذر تغيير الحالة' : 'Failed to toggle status'))
  }
}

const handleDelete = async (service: ServiceDto) => {
  const name = isAr.value ? (service.titleAr || service.titleEn) : (service.titleEn || service.titleAr)
  const ok = await confirm({
    title: t('services.deleteConfirmTitle'),
    message: `${t('services.deleteConfirmDesc')} ("${name}")`,
    confirmText: t('common.delete'),
    cancelText: t('common.cancel'),
    type: 'danger'
  })

  if (!ok) return

  try {
    await coreServices.services.delete(service.id)
    toast.success(t('services.serviceDeletedSuccess'))
    await fetchServices()
  } catch (err: unknown) {
    const appErr = err as AppError
    toast.error(appErr?.message || (isAr.value ? 'تعذر حذف الخدمة' : 'Failed to delete service'))
  }
}

const handleAction = (act: string, item: ServiceDto) => {
  if (act === 'details') router.push(`/services/${item.id}`)
  else if (act === 'edit') openEditModal(item)
  else if (act === 'delete') handleDelete(item)
}

onMounted(() => {
  fetchServices()
})
</script>

<template>
  <AppShell>
    <div class="flex flex-col max-w-7xl mx-auto space-y-6">
      <!-- Page Header -->
      <PageHeader
        :title="t('services.title')"
        :description="t('services.subtitle')"
      >
        <template #actions>
          <button
            type="button"
            @click="openCreateModal"
            class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs hover:shadow-md cursor-pointer"
          >
            <Plus class="w-4 h-4 stroke-[2.5]" />
            {{ t('services.addService') }}
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
              :placeholder="t('services.searchPlaceholder')"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl ps-9 pe-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition-all"
            />
          </div>

          <!-- Status Filter -->
          <div class="flex items-center gap-2">
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
              @click="fetchServices"
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
          :empty="!isLoading && services.length === 0"
          :empty-title="t('services.noServicesFound')"
          :empty-message="t('services.noServicesDesc')"
          @retry="fetchServices"
        >
          <div class="overflow-x-auto">
            <table class="w-full text-start text-xs min-w-[700px]">
              <thead>
                <tr class="text-[11px] font-bold text-slate-400 border-b border-slate-100 uppercase tracking-wider bg-slate-50/50">
                  <th class="py-3.5 px-4 text-start">{{ t('services.serviceTitle') }}</th>
                  <th class="py-3.5 px-4 text-start">{{ isAr ? 'الوصف' : 'Description' }}</th>
                  <th class="py-3.5 px-4 text-center">{{ t('services.iconName') }}</th>
                  <th class="py-3.5 px-4 text-center">{{ t('services.displayOrder') }}</th>
                  <th class="py-3.5 px-4 text-center">{{ t('services.status') }}</th>
                  <th class="py-3.5 px-4 text-end">{{ t('common.actions') }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr
                  v-for="service in services"
                  :key="service.id"
                  class="hover:bg-slate-50/70 transition-colors"
                >
                  <!-- Title & Image / Cover -->
                  <td class="py-3.5 px-4 text-start">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-xl overflow-hidden bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                        <img
                          v-if="service.imageUrl"
                          :src="resolveAttachmentUrl(service.imageUrl, 'image')"
                          :alt="service.titleEn"
                          class="w-full h-full object-cover"
                          @error="handleImageError"
                        />
                        <Briefcase v-else class="w-5 h-5 text-emerald-600" />
                      </div>
                      <div class="flex flex-col min-w-0">
                        <span class="font-bold text-slate-900 truncate">
                          {{ isAr ? (service.titleAr || service.titleEn) : (service.titleEn || service.titleAr) }}
                        </span>
                        <span class="text-[11px] text-slate-400 truncate">
                          {{ isAr ? service.titleEn : service.titleAr }}
                        </span>
                      </div>
                    </div>
                  </td>

                  <!-- Description -->
                  <td class="py-3.5 px-4 text-start max-w-xs">
                    <p class="text-slate-600 font-normal line-clamp-2">
                      {{ isAr ? (service.descriptionAr || service.descriptionEn) : (service.descriptionEn || service.descriptionAr) }}
                    </p>
                  </td>

                  <!-- Icon / Route -->
                  <td class="py-3.5 px-4 text-center">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-mono">
                      {{ service.iconName || 'TrendingUp' }}
                    </span>
                  </td>

                  <!-- Display Order -->
                  <td class="py-3.5 px-4 text-center font-bold text-slate-700">
                    {{ service.displayOrder }}
                  </td>

                  <!-- Active Status Toggle -->
                  <td class="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      @click="toggleStatus(service)"
                      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer"
                      :class="service.isActive ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'"
                    >
                      <CheckCircle2 v-if="service.isActive" class="w-3.5 h-3.5 text-emerald-600" />
                      <XCircle v-else class="w-3.5 h-3.5 text-slate-400" />
                      {{ service.isActive ? t('common.active') : t('common.inactive') }}
                    </button>
                  </td>

                  <!-- Actions -->
                  <td class="py-3.5 px-4 text-end">
                    <ActionMenu
                      :items="[
                        { id: 'details', label: isAr ? 'عرض التفاصيل' : 'View Details' },
                        { id: 'edit', label: t('common.edit') },
                        { id: 'delete', label: t('common.delete'), danger: true }
                      ]"
                      @select="(act) => handleAction(act, service)"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span class="text-xs text-slate-500">
              {{ isAr ? `إجمالي الخدمات: ${totalCount}` : `Total Services: ${totalCount}` }}
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

    <!-- Create / Edit Service Modal -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
    >
      <div class="bg-white rounded-3xl border border-slate-200 max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl flex flex-col gap-5">
        <!-- Modal Header -->
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 class="text-sm font-black text-slate-900">
              {{ modalMode === 'create' ? t('services.addService') : t('services.editService') }}
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">
              {{ t('services.modalDesc') }}
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
          <!-- Titles (Bilingual) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">
                {{ t('services.serviceTitleAr') }} *
              </label>
              <input
                v-model="form.titleAr"
                type="text"
                dir="rtl"
                placeholder="مثال: استشارات الأسهم والتحليل الفني"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">
                {{ t('services.serviceTitleEn') }} *
              </label>
              <input
                v-model="form.titleEn"
                type="text"
                dir="ltr"
                placeholder="e.g. Stock Advisory & Technical Analysis"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
              />
            </div>
          </div>
          <p v-if="formErrors.title" class="text-xs text-rose-500 font-semibold">{{ formErrors.title }}</p>

          <!-- Descriptions (Bilingual) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">
                {{ t('services.descriptionAr') }} *
              </label>
              <textarea
                v-model="form.descriptionAr"
                rows="3"
                dir="rtl"
                placeholder="اكتب وصفاً موجزاً للخدمة..."
                class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 resize-none"
              ></textarea>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">
                {{ t('services.descriptionEn') }} *
              </label>
              <textarea
                v-model="form.descriptionEn"
                rows="3"
                dir="ltr"
                placeholder="Write a brief description of the service..."
                class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 resize-none"
              ></textarea>
            </div>
          </div>
          <p v-if="formErrors.description" class="text-xs text-rose-500 font-semibold">{{ formErrors.description }}</p>

          <!-- Icon, Route, Display Order -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">{{ t('services.iconName') }}</label>
              <input
                v-model="form.iconName"
                type="text"
                placeholder="TrendingUp / Shield / BarChart"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">{{ t('services.linkRoute') }}</label>
              <input
                v-model="form.linkRoute"
                type="text"
                placeholder="/services/advisory"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">{{ t('services.displayOrder') }}</label>
              <input
                v-model.number="form.displayOrder"
                type="number"
                min="1"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          <!-- Cover Image Upload -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold text-slate-700">{{ t('services.imageUrl') }}</label>
            <ImageUploader
              v-model="form.imageUrl"
              :label="t('services.imageUrl')"
              hint="PNG, JPG or WEBP (Max 5MB)"
              aspect-ratio="aspect-video"
            />
          </div>

          <!-- Active Toggle -->
          <label class="flex items-center gap-3 cursor-pointer select-none py-1">
            <input
              v-model="form.isActive"
              type="checkbox"
              class="w-4 h-4 text-emerald-600 rounded-md border-slate-300 focus:ring-emerald-500"
            />
            <span class="text-xs font-bold text-slate-800">{{ t('services.isActive') }}</span>
          </label>

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
