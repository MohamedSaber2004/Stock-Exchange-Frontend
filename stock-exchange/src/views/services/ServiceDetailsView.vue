<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  ArrowRight,
  Edit,
  Trash2,
  Briefcase,
  TrendingUp,
  Link,
  Layers,
  CheckCircle2,
  XCircle,
  FileText,
  Sparkles,
  RefreshCw
} from 'lucide-vue-next'
import AppShell from '@/components/layout/AppShell.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import DataState from '@/components/ui/DataState.vue'
import MobileDeviceFrame from '@/components/mobile-preview/MobileDeviceFrame.vue'
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
        :description="isAr ? 'مراجعة بيانات الخدمة ومميزاتها ومعاينتها على تطبيق الجوال' : 'Inspect service features, routes, and Flutter mobile preview'"
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
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
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

              <!-- Icon -->
              <div class="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-2xs flex flex-col gap-1">
                <span class="text-[11px] font-bold text-slate-400">{{ t('services.iconName') }}</span>
                <div class="flex items-center gap-1.5 mt-0.5 font-mono text-xs font-bold text-slate-700">
                  <Briefcase class="w-4 h-4 text-emerald-600" />
                  <span>{{ service.iconName || 'TrendingUp' }}</span>
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

              <!-- Link Route -->
              <div class="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-2xs flex flex-col gap-1">
                <span class="text-[11px] font-bold text-slate-400">{{ t('services.linkRoute') }}</span>
                <div class="flex items-center gap-1.5 mt-0.5 truncate text-xs font-mono text-slate-600">
                  <Link class="w-4 h-4 text-slate-400 shrink-0" />
                  <span class="truncate">{{ service.linkRoute || '-' }}</span>
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

    </div>
  </AppShell>
</template>
