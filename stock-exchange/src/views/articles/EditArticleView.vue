<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import ImageUploader from '@/components/forms/ImageUploader.vue'
import RichTextEditor from '@/components/forms/RichTextEditor.vue'
import { useFeedback } from '@/composables/useFeedback'
import { useI18n } from 'vue-i18n'
import { extractApiErrors } from '@/domain/models/common.model'
import { coreServices } from '@/di'
import { sanitizeAttachmentName } from '@/utils/attachment'
import type { ArticleCategory } from '@/domain/models/article-category.model'

const router = useRouter()
const route = useRoute()
const { toast } = useFeedback()
const { locale } = useI18n()
const isAr = computed(() => locale.value === 'ar')

const articleId = route.params.id as string
const categories = ref<ArticleCategory[]>([])
const isLoading = ref(true)
const isSubmitting = ref(false)
const initialImageUrl = ref('')

const form = ref({
  titleEn: '',
  titleAr: '',
  excerptEn: '',
  excerptAr: '',
  contentEn: '',
  contentAr: '',
  authorName: '',
  imageUrl: '',
  categoryId: '',
  publishedAt: null as string | null,
  isFeaturedOnHome: true,
  isActive: true,
  displayOrder: 0,
})

const loadCategories = async () => {
  try {
    categories.value = await coreServices.articles.getCategories({ applyLanguageFilter: false })
  } catch {
    categories.value = []
  }
}

const loadArticle = async () => {
  isLoading.value = true
  try {
    const article = await coreServices.articles.getById(articleId)
    const cleanedImg = sanitizeAttachmentName(article.imageUrl)
    form.value.titleEn = article.titleEn || ''
    form.value.titleAr = article.titleAr || ''
    form.value.excerptEn = article.excerptEn || ''
    form.value.excerptAr = article.excerptAr || ''
    form.value.contentEn = article.contentEn || ''
    form.value.contentAr = article.contentAr || ''
    form.value.authorName = article.authorName || ''
    form.value.imageUrl = cleanedImg
    initialImageUrl.value = cleanedImg
    form.value.categoryId = article.categoryId || article.articleCategoryId || ''
    form.value.publishedAt = article.publishedAt || null
    form.value.isFeaturedOnHome = article.isFeaturedOnHome
    form.value.isActive = article.isActive
    form.value.displayOrder = article.displayOrder || 0
  } catch (err: unknown) {
    console.error('Load article failed:', err)
    const errorDetails = extractApiErrors(err)
    toast.error(errorDetails.generalMessage || (isAr.value ? 'فشل تحميل بيانات المقال' : 'Failed to load article data'))
    router.push('/articles')
  } finally {
    isLoading.value = false
  }
}

const handleSaveChanges = async () => {
  if (!form.value.titleEn.trim()) {
    toast.error(isAr.value ? 'يرجى إدخال عنوان المقال بالإنجليزية' : 'Please provide English title')
    return
  }
  if (!form.value.titleAr.trim()) {
    toast.error(isAr.value ? 'يرجى إدخال عنوان المقال بالعربية' : 'Please provide Arabic title')
    return
  }
  if (!form.value.authorName.trim()) {
    toast.error(isAr.value ? 'يرجى إدخال اسم الكاتب' : 'Please provide author name')
    return
  }
  if (!form.value.excerptEn.trim()) {
    toast.error(isAr.value ? 'يرجى إدخال الوصف المختصر بالإنجليزية' : 'Please provide English excerpt')
    return
  }
  if (!form.value.excerptAr.trim()) {
    toast.error(isAr.value ? 'يرجى إدخال الوصف المختصر بالعربية' : 'Please provide Arabic excerpt')
    return
  }

  isSubmitting.value = true
  try {
    await coreServices.articles.update(articleId, {
      titleEn: form.value.titleEn.trim(),
      titleAr: form.value.titleAr.trim(),
      excerptEn: form.value.excerptEn.trim(),
      excerptAr: form.value.excerptAr.trim(),
      contentEn: form.value.contentEn.trim() || undefined,
      contentAr: form.value.contentAr.trim() || undefined,
      authorName: form.value.authorName.trim(),
      imageUrl: form.value.imageUrl || null,
      categoryId: form.value.categoryId || null,
      publishedAt: form.value.publishedAt || null,
      isFeaturedOnHome: form.value.isFeaturedOnHome,
      isActive: form.value.isActive,
      displayOrder: form.value.displayOrder,
    })
    toast.success(isAr.value ? 'تم حفظ تعديلات المقال بنجاح' : 'Article changes saved successfully')
    router.push('/articles')
  } catch (err: unknown) {
    console.error('Update article failed:', err)
    const errorDetails = extractApiErrors(err)
    toast.error(errorDetails.generalMessage || (isAr.value ? 'فشل حفظ التعديلات' : 'Failed to save changes'))
  } finally {
    isSubmitting.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadCategories(), loadArticle()])
})
</script>

<template>
  <AppShell>
    <div class="flex flex-col max-w-5xl mx-auto">
      <PageHeader
        :title="isAr ? 'تعديل المقال' : 'Edit Article'"
        :description="isAr ? 'تعديل بيانات المقال' : 'Update article information'"
      />

      <!-- Loading skeleton -->
      <div v-if="isLoading" class="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-2xs flex items-center justify-center py-20">
        <div class="flex flex-col items-center gap-3">
          <div class="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <span class="text-xs text-slate-500 font-medium">{{ isAr ? 'جاري تحميل البيانات...' : 'Loading article data...' }}</span>
        </div>
      </div>

      <div v-else class="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 lg:p-8 shadow-2xs">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">

          <!-- Left Main Form: 2 cols -->
          <div class="lg:col-span-2 flex flex-col gap-5">
            <h2 class="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {{ isAr ? 'معلومات المقال' : 'Article Information' }}
            </h2>

            <!-- English Title -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">{{ isAr ? 'العنوان (إنجليزي) *' : 'Title (English) *' }}</label>
              <input
                v-model="form.titleEn"
                type="text"
                class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 font-medium"
                dir="ltr"
              />
            </div>

            <!-- Arabic Title -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">{{ isAr ? 'العنوان (عربي) *' : 'Title (Arabic) *' }}</label>
              <input
                v-model="form.titleAr"
                type="text"
                class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 font-medium"
                dir="rtl"
              />
            </div>

            <!-- Category -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">{{ isAr ? 'التصنيف' : 'Category' }}</label>
              <select
                v-model="form.categoryId"
                class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 cursor-pointer font-medium"
              >
                <option value="">{{ isAr ? 'بدون تصنيف' : 'No category' }}</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                  {{ isAr ? cat.categoryArName : cat.categoryEnName }}
                </option>
              </select>
            </div>

            <!-- Author -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">{{ isAr ? 'الكاتب *' : 'Author *' }}</label>
              <input
                v-model="form.authorName"
                type="text"
                class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 font-medium"
              />
            </div>

            <!-- Excerpt English -->
            <RichTextEditor
              v-model="form.excerptEn"
              :label="isAr ? 'الوصف المختصر (إنجليزي) *' : 'Excerpt (English) *'"
              :rows="4"
            />

            <!-- Excerpt Arabic -->
            <RichTextEditor
              v-model="form.excerptAr"
              :label="isAr ? 'الوصف المختصر (عربي) *' : 'Excerpt (Arabic) *'"
              :rows="3"
            />

            <!-- Full Content English -->
            <RichTextEditor
              v-model="form.contentEn"
              :label="isAr ? 'المحتوى الكامل للمقال (إنجليزي)' : 'Full Article Content (English)'"
              :placeholder="isAr ? 'اكتب المحتوى الكامل للمقال بالإنجليزية...' : 'Write full article content in English...'"
              :rows="8"
            />

            <!-- Full Content Arabic -->
            <RichTextEditor
              v-model="form.contentAr"
              :label="isAr ? 'المحتوى الكامل للمقال (عربي)' : 'Full Article Content (Arabic)'"
              :placeholder="isAr ? 'اكتب المحتوى الكامل للمقال بالعربية...' : 'Write full article content in Arabic...'"
              :rows="8"
            />
          </div>

          <!-- Right Sidebar Form: 1 col -->
          <div class="flex flex-col gap-6">
            <!-- Cover Image Upload -->
            <ImageUploader
              v-model="form.imageUrl"
              :old-file-name="initialImageUrl"
              :label="isAr ? 'صورة الغلاف' : 'Cover Image'"
              :hint="isAr ? 'الحجم الموصى به: 1200×675' : 'Recommended size: 1200×675'"
            />

            <!-- Display Order -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">{{ isAr ? 'ترتيب العرض' : 'Display Order' }}</label>
              <input
                v-model.number="form.displayOrder"
                type="number"
                min="0"
                class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 font-medium"
              />
            </div>

            <!-- Toggles -->
            <div class="flex flex-col gap-3 p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80">
              <label class="text-xs font-bold text-slate-700">{{ isAr ? 'الإعدادات' : 'Settings' }}</label>

              <label class="flex items-center justify-between gap-3 cursor-pointer">
                <span class="text-xs font-medium text-slate-700">{{ isAr ? 'مميز في الرئيسية' : 'Featured on Home' }}</span>
                <div
                  @click="form.isFeaturedOnHome = !form.isFeaturedOnHome"
                  :class="['w-10 h-5 rounded-full transition-colors cursor-pointer relative', form.isFeaturedOnHome ? 'bg-emerald-500' : 'bg-slate-200']"
                >
                  <div :class="['absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-xs transition-all', form.isFeaturedOnHome ? 'start-5' : 'start-0.5']"></div>
                </div>
              </label>

              <label class="flex items-center justify-between gap-3 cursor-pointer">
                <span class="text-xs font-medium text-slate-700">{{ isAr ? 'نشط' : 'Active' }}</span>
                <div
                  @click="form.isActive = !form.isActive"
                  :class="['w-10 h-5 rounded-full transition-colors cursor-pointer relative', form.isActive ? 'bg-emerald-500' : 'bg-slate-200']"
                >
                  <div :class="['absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-xs transition-all', form.isActive ? 'start-5' : 'start-0.5']"></div>
                </div>
              </label>
            </div>
          </div>

        </div>

        <!-- Form Actions Footer -->
        <div class="mt-8 pt-6 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3">
          <button
            type="button"
            @click="router.push('/articles')"
            class="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition-colors cursor-pointer text-center"
          >
            {{ isAr ? 'إلغاء' : 'Cancel' }}
          </button>
          <button
            type="button"
            @click="handleSaveChanges"
            :disabled="isSubmitting"
            class="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer text-center disabled:opacity-50"
          >
            <span v-if="isSubmitting" class="inline-flex items-center gap-2">
              <div class="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
              {{ isAr ? 'جاري الحفظ...' : 'Saving...' }}
            </span>
            <span v-else>{{ isAr ? 'حفظ التعديلات' : 'Save Changes' }}</span>
          </button>
        </div>
      </div>
    </div>
  </AppShell>
</template>
