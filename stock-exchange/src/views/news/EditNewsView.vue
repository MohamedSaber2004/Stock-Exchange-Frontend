<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { RefreshCw, ArrowLeft } from 'lucide-vue-next'
import AppShell from '@/components/layout/AppShell.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import DataState from '@/components/ui/DataState.vue'
import ImageUploader from '@/components/forms/ImageUploader.vue'
import RichTextEditor from '@/components/forms/RichTextEditor.vue'
import { useFeedback } from '@/composables/useFeedback'
import { useI18n } from 'vue-i18n'
import { coreServices } from '@/di'
import type { UpdateNewsPayload } from '@/domain/models/news.model'
import type { AppError } from '@/domain/models/common.model'

const route = useRoute()
const router = useRouter()
const { toast } = useFeedback()
const { t, locale } = useI18n()
const isAr = computed(() => locale.value === 'ar')

const newsId = computed(() => route.params.id as string)

const isLoading = ref(true)
const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)

const form = ref({
  titleAr: '',
  titleEn: '',
  summaryAr: '',
  summaryEn: '',
  contentAr: '',
  contentEn: '',
  categoryEn: 'LIVE',
  categoryAr: 'مباشر',
  imageUrl: '',
  publishedAt: '',
  isFeaturedOnHome: true,
  displayOrder: 1,
  isActive: true
})

const fetchNewsItem = async () => {
  if (!newsId.value) return
  isLoading.value = true
  errorMessage.value = null

  try {
    const item = await coreServices.news.getById(newsId.value)
    if (item) {
      form.value = {
        titleAr: item.titleAr || '',
        titleEn: item.titleEn || '',
        summaryAr: item.summaryAr || '',
        summaryEn: item.summaryEn || '',
        contentAr: item.contentAr || '',
        contentEn: item.contentEn || '',
        categoryEn: item.categoryEn || 'LIVE',
        categoryAr: item.categoryAr || 'مباشر',
        imageUrl: item.imageUrl || '',
        publishedAt: item.publishedAt || '',
        isFeaturedOnHome: item.isFeaturedOnHome ?? false,
        displayOrder: item.displayOrder ?? 1,
        isActive: item.isActive ?? true
      }
    }
  } catch (err: unknown) {
    const appErr = err as AppError
    errorMessage.value = appErr?.message || (isAr.value ? 'تعذر تحميل بيانات الخبر' : 'Failed to load news article')
    toast.error(errorMessage.value)
  } finally {
    isLoading.value = false
  }
}

const handleBadgeChange = (val: string) => {
  form.value.categoryEn = val
  if (val === 'LIVE') form.value.categoryAr = 'مباشر'
  else if (val === 'BREAKING') form.value.categoryAr = 'عاجل'
  else if (val === 'UPDATE') form.value.categoryAr = 'تحديث'
}

const handleSave = async () => {
  if (!form.value.titleAr.trim() && !form.value.titleEn.trim()) {
    toast.error(isAr.value ? 'يرجى إدخال عنوان الخبر بلغة واحدة على الأقل' : 'Please enter headline in at least one language')
    return
  }

  isSubmitting.value = true
  try {
    const payload: UpdateNewsPayload = {
      titleAr: form.value.titleAr.trim() || form.value.titleEn.trim(),
      titleEn: form.value.titleEn.trim() || form.value.titleAr.trim(),
      summaryAr: form.value.summaryAr.trim() || form.value.summaryEn.trim(),
      summaryEn: form.value.summaryEn.trim() || form.value.summaryAr.trim(),
      contentAr: form.value.contentAr.trim() || undefined,
      contentEn: form.value.contentEn.trim() || undefined,
      categoryAr: form.value.categoryAr.trim() || 'مباشر',
      categoryEn: form.value.categoryEn.trim() || 'LIVE',
      imageUrl: form.value.imageUrl.trim() || null,
      publishedAt: form.value.publishedAt || new Date().toISOString(),
      displayOrder: Number(form.value.displayOrder) || 1,
      isFeaturedOnHome: Boolean(form.value.isFeaturedOnHome),
      isActive: Boolean(form.value.isActive)
    }

    await coreServices.news.update(newsId.value, payload)
    toast.success(t('news.newsUpdatedSuccess'))
    router.push('/news')
  } catch (err: unknown) {
    const appErr = err as AppError
    toast.error(appErr?.message || (isAr.value ? 'حدث خطأ أثناء تعديل الخبر' : 'Failed to update news'))
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  fetchNewsItem()
})
</script>

<template>
  <AppShell>
    <div class="flex flex-col max-w-5xl mx-auto space-y-6">
      <PageHeader
        :title="t('news.editNews')"
        :description="t('news.subtitle')"
      >
        <template #actions>
          <button
            type="button"
            @click="router.push('/news')"
            class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <ArrowLeft class="w-4 h-4" :class="{ 'rotate-180': isAr }" />
            {{ t('common.back') }}
          </button>
        </template>
      </PageHeader>

      <div class="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-7 shadow-2xs">
        <DataState
          :loading="isLoading"
          :error="errorMessage"
          @retry="fetchNewsItem"
        >
          <form @submit.prevent="handleSave" class="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            
            <!-- Left Main Form: 2 cols -->
            <div class="lg:col-span-2 flex flex-col gap-5">
              <h2 class="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {{ isAr ? 'تعديل تفاصيل الخبر' : 'Edit News Details' }}
              </h2>

              <!-- Headlines (Bilingual) -->
              <div class="flex flex-col gap-4">
                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-bold text-slate-700">
                    {{ t('news.titleAr') }} *
                  </label>
                  <input
                    v-model="form.titleAr"
                    type="text"
                    dir="rtl"
                    placeholder="أدخل عنوان الخبر بالعربية..."
                    class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
                  />
                </div>

                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-bold text-slate-700">
                    {{ t('news.titleEn') }} *
                  </label>
                  <input
                    v-model="form.titleEn"
                    type="text"
                    dir="ltr"
                    placeholder="Enter headline in English..."
                    class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
                  />
                </div>
              </div>

              <!-- Badge / Highlight & Order -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-bold text-slate-700">{{ t('news.badgeCol') }}</label>
                  <select
                    :value="form.categoryEn"
                    @change="(e) => handleBadgeChange((e.target as HTMLSelectElement).value)"
                    class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 cursor-pointer"
                  >
                    <option value="LIVE">LIVE (مباشر)</option>
                    <option value="BREAKING">BREAKING (عاجل)</option>
                    <option value="UPDATE">UPDATE (تحديث)</option>
                  </select>
                </div>

                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-bold text-slate-700">{{ t('news.displayOrder') }}</label>
                  <input
                    v-model.number="form.displayOrder"
                    type="number"
                    min="1"
                    class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              <!-- Summaries (Bilingual) -->
              <div class="flex flex-col gap-4">
                <RichTextEditor
                  v-model="form.summaryAr"
                  :label="t('news.summaryAr')"
                  placeholder="اكتب تفاصيل أو ملخص الخبر بالعربية..."
                  :rows="4"
                />

                <RichTextEditor
                  v-model="form.summaryEn"
                  :label="t('news.summaryEn')"
                  placeholder="Write news summary or details in English..."
                  :rows="3"
                />

                <!-- Full News Story Content -->
                <RichTextEditor
                  v-model="form.contentAr"
                  :label="isAr ? 'القصة الكاملة للخبر (عربي)' : 'Full News Story (Arabic)'"
                  :placeholder="isAr ? 'اكتب التفاصيل الكاملة للخبر بالعربية...' : 'Write full news story in Arabic...'"
                  :rows="6"
                />

                <RichTextEditor
                  v-model="form.contentEn"
                  :label="isAr ? 'القصة الكاملة للخبر (إنجليزي)' : 'Full News Story (English)'"
                  :placeholder="isAr ? 'اكتب التفاصيل الكاملة للخبر بالإنجليزية...' : 'Write full news story in English...'"
                  :rows="6"
                />
              </div>

              <!-- Toggles -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <label class="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    v-model="form.isFeaturedOnHome"
                    class="rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span class="text-xs font-bold text-slate-700">{{ t('news.isFeaturedOnHome') }}</span>
                </label>

                <label class="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    v-model="form.isActive"
                    class="rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span class="text-xs font-bold text-slate-700">{{ t('news.isActive') }}</span>
                </label>
              </div>
            </div>

            <!-- Right Column: 1 col -->
            <div class="flex flex-col gap-6">
              <!-- Featured Image Upload -->
              <ImageUploader
                v-model="form.imageUrl"
                :label="t('news.featuredImage')"
                :hint="isAr ? 'الحجم الموصى به: 1200×675' : 'Recommended size: 1200×675'"
                aspect-ratio="aspect-video"
              />
            </div>

            <!-- Footer Actions -->
            <div class="col-span-full mt-4 pt-5 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3">
              <button
                type="button"
                @click="router.push('/news')"
                class="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition-colors cursor-pointer text-center"
              >
                {{ t('common.cancel') }}
              </button>
              <button
                type="submit"
                :disabled="isSubmitting"
                class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer text-center disabled:opacity-50"
              >
                <RefreshCw v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
                {{ t('common.save') }}
              </button>
            </div>
          </form>
        </DataState>
      </div>
    </div>
  </AppShell>
</template>
