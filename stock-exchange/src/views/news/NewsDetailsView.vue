<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  ArrowRight,
  Edit,
  Trash2,
  Calendar,
  Clock,
  Newspaper,
  Tag,
  Star,
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
import type { NewsDto } from '@/domain/models/news.model'
import type { AppError } from '@/domain/models/common.model'

const route = useRoute()
const router = useRouter()
const { toast, confirm } = useFeedback()
const { t, locale } = useI18n()
const isAr = computed(() => locale.value === 'ar')

const newsId = route.params.id as string
const newsItem = ref<NewsDto | null>(null)
const isLoading = ref(true)
const errorMessage = ref<string | null>(null)
const activeTab = ref<'ar' | 'en'>('ar')

const loadNews = async () => {
  isLoading.value = true
  errorMessage.value = null
  try {
    const data = await coreServices.news.getById(newsId)
    newsItem.value = data
  } catch (err: unknown) {
    const appErr = err as AppError
    errorMessage.value = appErr?.message || (isAr.value ? 'تعذر تحميل بيانات الخبر' : 'Failed to load news details')
    toast.error(errorMessage.value)
  } finally {
    isLoading.value = false
  }
}

const handleDelete = async () => {
  if (!newsItem.value) return
  const title = isAr.value ? (newsItem.value.titleAr || newsItem.value.titleEn) : (newsItem.value.titleEn || newsItem.value.titleAr)
  const ok = await confirm({
    title: t('news.deleteConfirmTitle'),
    message: `${t('news.deleteConfirmDesc')} ("${title}")`,
    confirmText: t('common.delete'),
    cancelText: t('common.cancel'),
    type: 'danger'
  })

  if (!ok) return

  try {
    await coreServices.news.delete(newsItem.value.id)
    toast.success(isAr.value ? 'تم حذف الخبر بنجاح' : 'News item deleted successfully')
    router.push('/news')
  } catch (err: unknown) {
    const appErr = err as AppError
    toast.error(appErr?.message || (isAr.value ? 'فشل حذف الخبر' : 'Failed to delete news'))
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

onMounted(() => {
  loadNews()
})
</script>

<template>
  <AppShell>
    <div class="flex flex-col max-w-7xl mx-auto space-y-6">
      
      <!-- Top Navigation & Actions -->
      <PageHeader
        :title="isAr ? (newsItem?.titleAr || newsItem?.titleEn || 'تفاصيل الخبر') : (newsItem?.titleEn || newsItem?.titleAr || 'News Details')"
        :description="isAr ? 'مراجعة الخبر الاقتصادي ومعاينته على تطبيق الجوال' : 'Inspect market news contents and Flutter mobile preview'"
      >
        <template #actions>
          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="router.push('/news')"
              class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              <component :is="isAr ? ArrowRight : ArrowLeft" class="w-3.5 h-3.5" />
              {{ isAr ? 'العودة للأخبار' : 'Back to News' }}
            </button>

            <button
              v-if="newsItem"
              type="button"
              @click="router.push(`/news/${newsItem.id}/edit`)"
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Edit class="w-3.5 h-3.5" />
              {{ t('common.edit') }}
            </button>

            <button
              v-if="newsItem"
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
        :empty="!isLoading && !newsItem"
        @retry="loadNews"
      >
        <div v-if="newsItem" class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          <!-- Left Column: News Details (7 cols) -->
          <div class="lg:col-span-7 flex flex-col gap-6">
            
            <!-- Quick Stat Bar Cards -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <!-- Active Status -->
              <div class="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-2xs flex flex-col gap-1">
                <span class="text-[11px] font-bold text-slate-400">{{ t('news.status') }}</span>
                <div class="flex items-center gap-1.5 mt-0.5">
                  <CheckCircle2 v-if="newsItem.isActive" class="w-4 h-4 text-emerald-600" />
                  <XCircle v-else class="w-4 h-4 text-slate-400" />
                  <span class="text-xs font-black text-slate-900">
                    {{ newsItem.isActive ? (isAr ? 'نشط' : 'Active') : (isAr ? 'غير نشط' : 'Inactive') }}
                  </span>
                </div>
              </div>

              <!-- Featured on Home -->
              <div class="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-2xs flex flex-col gap-1">
                <span class="text-[11px] font-bold text-slate-400">{{ isAr ? 'الرئيسية' : 'Featured' }}</span>
                <div class="flex items-center gap-1.5 mt-0.5">
                  <Star v-if="newsItem.isFeaturedOnHome" class="w-4 h-4 text-amber-500 fill-amber-500" />
                  <Star v-else class="w-4 h-4 text-slate-300" />
                  <span class="text-xs font-black text-slate-900">
                    {{ newsItem.isFeaturedOnHome ? (isAr ? 'مميز' : 'Featured') : (isAr ? 'عادي' : 'Standard') }}
                  </span>
                </div>
              </div>

              <!-- Category -->
              <div class="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-2xs flex flex-col gap-1">
                <span class="text-[11px] font-bold text-slate-400">{{ t('news.category') }}</span>
                <div class="flex items-center gap-1.5 mt-0.5 truncate">
                  <Tag class="w-4 h-4 text-emerald-600 shrink-0" />
                  <span class="text-xs font-black text-slate-900 truncate">
                    {{ isAr ? (newsItem.categoryAr || newsItem.categoryEn || '-') : (newsItem.categoryEn || newsItem.categoryAr || '-') }}
                  </span>
                </div>
              </div>

              <!-- Published At -->
              <div class="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-2xs flex flex-col gap-1">
                <span class="text-[11px] font-bold text-slate-400">{{ t('news.publishedAt') }}</span>
                <div class="flex items-center gap-1.5 mt-0.5 truncate">
                  <Clock class="w-4 h-4 text-slate-400 shrink-0" />
                  <span class="text-[11px] font-bold text-slate-800 truncate">
                    {{ formatDate(newsItem.publishedAt) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Bilingual Content Card -->
            <div class="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
              <div class="flex items-center justify-between px-5 pt-4 border-b border-slate-100">
                <div class="flex items-center gap-2">
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

                <div class="text-[11px] font-bold text-slate-400 pb-3 flex items-center gap-1.5">
                  <Calendar class="w-3.5 h-3.5" />
                  <span>{{ formatDate(newsItem.publishedAt) }}</span>
                </div>
              </div>

              <div class="p-6 flex flex-col gap-5">
                <!-- Arabic Tab -->
                <div v-if="activeTab === 'ar'" dir="rtl" class="flex flex-col gap-4">
                  <div>
                    <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">عنوان الخبر</span>
                    <h2 class="text-lg font-black text-slate-900 mt-1 leading-snug">
                      {{ newsItem.titleAr || 'لا يوجد عنوان بالعربية' }}
                    </h2>
                  </div>

                  <div>
                    <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">الموجز الصحفي</span>
                    <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 font-medium leading-relaxed mt-1">
                      {{ newsItem.summaryAr || 'لا يوجد موجز بالعربية' }}
                    </div>
                  </div>

                  <div>
                    <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">التفاصيل والقصة الكاملة للخبر</span>
                    <div
                      v-if="newsItem.contentAr"
                      class="p-4 rounded-2xl bg-white border border-slate-100 text-xs text-slate-800 leading-relaxed prose max-w-none mt-1 shadow-2xs"
                      v-html="newsItem.contentAr"
                    ></div>
                    <div v-else class="p-4 rounded-2xl bg-slate-50/50 border border-dashed border-slate-200 text-xs text-slate-400 italic text-center mt-1">
                      لم يتم إدخال تفاصيل إضافية للخبر، يُعرض الموجز كقصة رئيسية.
                    </div>
                  </div>
                </div>

                <!-- English Tab -->
                <div v-else dir="ltr" class="flex flex-col gap-4">
                  <div>
                    <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Headline</span>
                    <h2 class="text-lg font-black text-slate-900 mt-1 leading-snug">
                      {{ newsItem.titleEn || 'No English title provided' }}
                    </h2>
                  </div>

                  <div>
                    <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Summary</span>
                    <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 font-medium leading-relaxed mt-1">
                      {{ newsItem.summaryEn || 'No English summary provided' }}
                    </div>
                  </div>

                  <div>
                    <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Full News Story</span>
                    <div
                      v-if="newsItem.contentEn"
                      class="p-4 rounded-2xl bg-white border border-slate-100 text-xs text-slate-800 leading-relaxed prose max-w-none mt-1 shadow-2xs"
                      v-html="newsItem.contentEn"
                    ></div>
                    <div v-else class="p-4 rounded-2xl bg-slate-50/50 border border-dashed border-slate-200 text-xs text-slate-400 italic text-center mt-1">
                      No full body story provided. Summary serves as headline copy.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Cover Image Preview Box -->
            <div v-if="newsItem.imageUrl" class="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-2xs flex flex-col gap-3">
              <span class="text-xs font-bold text-slate-700">{{ isAr ? 'صورة الخبر المرفقة' : 'News Cover Attachment' }}</span>
              <div class="w-full h-56 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                <img
                  :src="resolveAttachmentUrl(newsItem.imageUrl, 'image')"
                  :alt="newsItem.titleEn"
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
                type="news"
                :news="newsItem"
                :default-lang="isAr ? 'ar' : 'en'"
              />
            </div>
          </div>

        </div>
      </DataState>

    </div>
  </AppShell>
</template>
