<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  ArrowRight,
  Edit,
  Trash2,
  Briefcase,
  Calendar,
  Layers,
  CheckCircle2,
  XCircle,
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
import type { ServiceDto } from '@/domain/models/service.model'
import type { AppError } from '@/domain/models/common.model'

const route = useRoute()
const router = useRouter()
const { toast, confirm } = useFeedback()
const { t, locale } = useI18n()
const isAr = computed(() => locale.value === 'ar')

const serviceId = route.params.id as string
const service = ref<ServiceDto | null>(null)
const isLoading = ref(true)
const errorMessage = ref<string | null>(null)
const activeTab = ref<'ar' | 'en'>('ar')

const loadService = async () => {
  isLoading.value = true
  errorMessage.value = null
  try {
    const data = await coreServices.services.getById(serviceId)
    service.value = data
  } catch (err: unknown) {
    const appErr = err as AppError
    errorMessage.value = appErr?.message || (isAr.value ? 'تعذر تحميل بيانات الخدمة' : 'Failed to load service details')
    toast.error(errorMessage.value)
  } finally {
    isLoading.value = false
  }
}

const handleDelete = async () => {
  if (!service.value) return
  const title = isAr.value ? (service.value.titleAr || service.value.titleEn) : (service.value.titleEn || service.value.titleAr)
  const ok = await confirm({
    title: t('services.deleteConfirmTitle'),
    message: `${t('services.deleteConfirmDesc')} ("${title}")`,
    confirmText: t('common.delete'),
    cancelText: t('common.cancel'),
    type: 'danger'
  })

  if (!ok) return

  try {
    await coreServices.services.delete(service.value.id)
    toast.success(isAr.value ? 'تم حذف الخدمة بنجاح' : 'Service deleted successfully')
    router.push('/services')
  } catch (err: unknown) {
    const appErr = err as AppError
    toast.error(appErr?.message || (isAr.value ? 'فشل حذف الخدمة' : 'Failed to delete service'))
  }
}

// Edit Modal State & Logic
const isEditModalOpen = ref(false)
const isSubmitting = ref(false)

const form = ref({
  titleEn: '',
  titleAr: '',
  descriptionEn: '',
  descriptionAr: '',
  contentEn: '',
  contentAr: '',
  iconName: 'TrendingUp',
  imageUrl: '',
  linkRoute: '',
  displayOrder: 1,
  isActive: true
})

const openEditModal = () => {
  if (!service.value) return
  form.value = {
    titleEn: service.value.titleEn || '',
    titleAr: service.value.titleAr || '',
    descriptionEn: service.value.descriptionEn || '',
    descriptionAr: service.value.descriptionAr || '',
    contentEn: service.value.contentEn || '',
    contentAr: service.value.contentAr || '',
    iconName: service.value.iconName || 'TrendingUp',
    imageUrl: service.value.imageUrl || '',
    linkRoute: service.value.linkRoute || '',
    displayOrder: service.value.displayOrder ?? 1,
    isActive: service.value.isActive ?? true
  }
  isEditModalOpen.value = true
}

const handleSaveEdit = async () => {
  if (!form.value.titleEn.trim() && !form.value.titleAr.trim()) {
    toast.error(isAr.value ? 'يرجى إدخال عنوان الخدمة' : 'Service title is required')
    return
  }
  if (!form.value.descriptionEn.trim() && !form.value.descriptionAr.trim()) {
    toast.error(isAr.value ? 'يرجى إدخال وصف الخدمة' : 'Service description is required')
    return
  }

  isSubmitting.value = true
  try {
    await coreServices.services.update(serviceId, {
      titleEn: form.value.titleEn.trim() || form.value.titleAr.trim(),
      titleAr: form.value.titleAr.trim() || form.value.titleEn.trim(),
      descriptionEn: form.value.descriptionEn.trim() || form.value.descriptionAr.trim(),
      descriptionAr: form.value.descriptionAr.trim() || form.value.descriptionEn.trim(),
      contentEn: form.value.contentEn.trim() || undefined,
      contentAr: form.value.contentAr.trim() || undefined,
      iconName: service.value?.iconName || form.value.iconName || 'TrendingUp',
      imageUrl: form.value.imageUrl.trim() || null,
      linkRoute: null,
      displayOrder: Number(form.value.displayOrder) || 1,
      isActive: Boolean(form.value.isActive)
    })
    toast.success(isAr.value ? 'تم حفظ تعديلات الخدمة بنجاح' : 'Service updated successfully')
    isEditModalOpen.value = false
    await loadService()
  } catch (err: unknown) {
    const appErr = err as AppError
    toast.error(appErr?.message || (isAr.value ? 'فشل حفظ التعديلات' : 'Failed to update service'))
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  loadService()
})
</script>

<template>
  <AppShell>
    <div class="flex flex-col max-w-7xl mx-auto space-y-6">
      
      <!-- Top Header & Actions -->
      <PageHeader
        :title="isAr ? (service?.titleAr || service?.titleEn || 'تفاصيل الخدمة') : (service?.titleEn || service?.titleAr || 'Service Details')"
        :description="isAr ? 'عرض ومراجعة مميزات الخدمة التعريفية المقدمة للعملاء ومعاينتها على تطبيق الجوال' : 'Review informational service features showcased to clients and preview on mobile'"
      >
        <template #actions>
          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="router.push('/services')"
              class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              <component :is="isAr ? ArrowRight : ArrowLeft" class="w-3.5 h-3.5" />
              {{ isAr ? 'العودة للخدمات' : 'Back to Services' }}
            </button>

            <button
              v-if="service"
              type="button"
              @click="openEditModal"
              class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Edit class="w-3.5 h-3.5" />
              {{ isAr ? 'تعديل الخدمة' : 'Edit Service' }}
            </button>

            <button
              v-if="service"
              type="button"
              @click="handleDelete"
              class="p-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              :title="t('common.delete')"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </template>
      </PageHeader>

      <!-- Main Body Handler -->
      <DataState
        :loading="isLoading"
        :error="errorMessage"
        :empty="!isLoading && !service"
        @retry="loadService"
      >
        <div v-if="service" class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          <!-- Left Column: Service Details (7 cols) -->
          <div class="lg:col-span-7 flex flex-col gap-6">
            
            <!-- Quick Stat Bar Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <!-- Active Status -->
              <div class="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-2xs flex flex-col gap-1">
                <span class="text-[11px] font-bold text-slate-400">{{ t('services.status') }}</span>
                <div class="flex items-center gap-1.5 mt-0.5">
                  <CheckCircle2 v-if="service.isActive" class="w-4 h-4 text-emerald-600" />
                  <XCircle v-else class="w-4 h-4 text-slate-400" />
                  <span class="text-xs font-black text-slate-900">
                    {{ service.isActive ? (isAr ? 'نشط' : 'Active') : (isAr ? 'غير نشط' : 'Inactive') }}
                  </span>
                </div>
              </div>

              <!-- Display Order -->
              <div class="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-2xs flex flex-col gap-1">
                <span class="text-[11px] font-bold text-slate-400">{{ t('services.displayOrder') }}</span>
                <div class="flex items-center gap-1.5 mt-0.5">
                  <Layers class="w-4 h-4 text-indigo-500" />
                  <span class="text-xs font-black text-slate-900">
                    {{ service.displayOrder }}
                  </span>
                </div>
              </div>

              <!-- Created Date -->
              <div class="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-2xs flex flex-col gap-1">
                <span class="text-[11px] font-bold text-slate-400">{{ isAr ? 'تاريخ الإنشاء' : 'Created At' }}</span>
                <div class="flex items-center gap-1.5 mt-0.5 text-xs font-bold text-slate-700">
                  <Calendar class="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{{ service.createdAt ? new Date(service.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-' }}</span>
                </div>
              </div>
            </div>

            <!-- Bilingual Content Card -->
            <div class="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
              <div class="flex items-center gap-2 px-5 pt-4 border-b border-slate-100">
                <button
                  type="button"
                  @click="activeTab = 'ar'"
                  class="pb-3 px-3 text-xs font-black transition-all border-b-2 cursor-pointer"
                  :class="activeTab === 'ar' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-700'"
                >
                  العربية (Arabic)
                </button>
                <button
                  type="button"
                  @click="activeTab = 'en'"
                  class="pb-3 px-3 text-xs font-black transition-all border-b-2 cursor-pointer"
                  :class="activeTab === 'en' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-700'"
                >
                  English
                </button>
              </div>

              <div class="p-6 flex flex-col gap-4">
                <!-- Arabic Tab -->
                <div v-if="activeTab === 'ar'" dir="rtl" class="flex flex-col gap-3">
                  <div>
                    <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">اسم الخدمة</span>
                    <h2 class="text-lg font-black text-slate-900 mt-1">
                      {{ service.titleAr || 'لا يوجد عنوان بالعربية' }}
                    </h2>
                  </div>

                  <div>
                    <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">وصف الخدمة</span>
                    <div class="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed mt-1">
                      {{ service.descriptionAr || 'لا يوجد وصف بالعربية للخدمة.' }}
                    </div>
                  </div>

                  <div v-if="service.contentAr">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">تفاصيل ومميزات الخدمة</span>
                    <div
                      class="p-4 rounded-2xl bg-white border border-slate-100 text-xs text-slate-700 leading-relaxed mt-1 shadow-2xs"
                      v-html="service.contentAr"
                    ></div>
                  </div>
                </div>

                <!-- English Tab -->
                <div v-else dir="ltr" class="flex flex-col gap-3">
                  <div>
                    <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Service Title</span>
                    <h2 class="text-lg font-black text-slate-900 mt-1">
                      {{ service.titleEn || 'No English title provided' }}
                    </h2>
                  </div>

                  <div>
                    <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Description</span>
                    <div class="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed mt-1">
                      {{ service.descriptionEn || 'No English description provided.' }}
                    </div>
                  </div>

                  <div v-if="service.contentEn">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Full Details & Features</span>
                    <div
                      class="p-4 rounded-2xl bg-white border border-slate-100 text-xs text-slate-700 leading-relaxed mt-1 shadow-2xs"
                      v-html="service.contentEn"
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Service Cover Image Box -->
            <div v-if="service.imageUrl" class="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-2xs flex flex-col gap-3">
              <span class="text-xs font-bold text-slate-700">{{ isAr ? 'صورة الخدمة المرفقة' : 'Attached Service Image' }}</span>
              <div class="w-full h-56 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                <img
                  :src="resolveAttachmentUrl(service.imageUrl, 'image')"
                  :alt="service.titleEn"
                  class="w-full h-full object-cover"
                  @error="handleImageError($event, 'image')"
                />
              </div>
            </div>

          </div>

          <!-- Right Column: Interactive Flutter Mobile Phone Preview (5 cols) -->
          <div class="lg:col-span-5 sticky top-6">
            <div class="bg-slate-50/70 border border-slate-200/70 rounded-3xl p-5 shadow-xs flex flex-col items-center">
              <MobileDeviceFrame
                type="service"
                :service="service"
                :default-lang="isAr ? 'ar' : 'en'"
              />
            </div>
          </div>

        </div>
      </DataState>

      <!-- Edit Service Modal -->
      <div
        v-if="isEditModalOpen"
        class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150"
      >
        <div class="bg-white rounded-3xl border border-slate-200 max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
          <!-- Modal Header -->
          <div class="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0 bg-white">
            <div>
              <h3 class="text-sm font-black text-slate-900">
                {{ isAr ? 'تعديل بيانات الخدمة' : 'Edit Service' }}
              </h3>
              <p class="text-xs text-slate-400 mt-0.5">
                {{ isAr ? 'تعديل التفاصيل والمميزات المعروضة للعملاء' : 'Update details and features showcased to clients' }}
              </p>
            </div>
            <button
              type="button"
              @click="isEditModalOpen = false"
              class="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- Form Body (Scrollable) -->
          <form id="editServiceForm" @submit.prevent="handleSaveEdit" class="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
            <!-- Titles (Bilingual) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold text-slate-700">
                  {{ isAr ? 'عنوان الخدمة (عربي) *' : 'Title (Arabic) *' }}
                </label>
                <input
                  v-model="form.titleAr"
                  type="text"
                  dir="rtl"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
                />
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold text-slate-700">
                  {{ isAr ? 'عنوان الخدمة (إنجليزي) *' : 'Title (English) *' }}
                </label>
                <input
                  v-model="form.titleEn"
                  type="text"
                  dir="ltr"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
                />
              </div>
            </div>

            <!-- Descriptions (Bilingual) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold text-slate-700">
                  {{ isAr ? 'الوصف المختصر (عربي) *' : 'Description (Arabic) *' }}
                </label>
                <textarea
                  v-model="form.descriptionAr"
                  rows="3"
                  dir="rtl"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 resize-none"
                ></textarea>
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold text-slate-700">
                  {{ isAr ? 'الوصف المختصر (إنجليزي) *' : 'Description (English) *' }}
                </label>
                <textarea
                  v-model="form.descriptionEn"
                  rows="3"
                  dir="ltr"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 resize-none"
                ></textarea>
              </div>
            </div>

            <!-- Rich Content Details / Features (Bilingual) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold text-slate-700">
                  {{ isAr ? 'تفاصيل ومميزات الخدمة (عربي)' : 'Service Content / Features (Arabic)' }}
                </label>
                <textarea
                  v-model="form.contentAr"
                  rows="4"
                  dir="rtl"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 resize-none"
                ></textarea>
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold text-slate-700">
                  {{ isAr ? 'تفاصيل ومميزات الخدمة (إنجليزي)' : 'Service Content / Features (English)' }}
                </label>
                <textarea
                  v-model="form.contentEn"
                  rows="4"
                  dir="ltr"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 resize-none"
                ></textarea>
              </div>
            </div>

            <!-- Display Order & Active Toggle -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold text-slate-700">{{ isAr ? 'ترتيب العرض' : 'Display Order' }}</label>
                <input
                  v-model.number="form.displayOrder"
                  type="number"
                  min="0"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
                />
              </div>

              <div class="flex items-center sm:pt-5">
                <label class="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    v-model="form.isActive"
                    type="checkbox"
                    class="w-4.5 h-4.5 text-emerald-600 rounded-md border-slate-300 focus:ring-emerald-500"
                  />
                  <span class="text-xs font-bold text-slate-800">{{ isAr ? 'حالة التفعيل' : 'Active Status' }}</span>
                </label>
              </div>
            </div>

            <!-- Image Uploader -->
            <ImageUploader
              v-model="form.imageUrl"
              :label="isAr ? 'صورة الغلاف' : 'Cover Image'"
              :hint="isAr ? 'صورة معبرة عن الخدمة للمعاينة في التطبيق' : 'Informative service preview image'"
            />
          </form>

          <!-- Fixed Modal Actions Footer -->
          <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 shrink-0 bg-slate-50/50">
            <button
              type="button"
              @click="isEditModalOpen = false"
              class="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {{ isAr ? 'إلغاء' : 'Cancel' }}
            </button>
            <button
              type="submit"
              form="editServiceForm"
              :disabled="isSubmitting"
              class="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <span v-if="isSubmitting">{{ isAr ? 'جاري الحفظ...' : 'Saving...' }}</span>
              <span v-else>{{ isAr ? 'حفظ التعديلات' : 'Save Changes' }}</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  </AppShell>
</template>
