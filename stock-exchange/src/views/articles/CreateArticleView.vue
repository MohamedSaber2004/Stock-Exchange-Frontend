<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import ImageUploader from '@/components/forms/ImageUploader.vue'
import AttachmentUploader, { type AttachmentItem } from '@/components/forms/AttachmentUploader.vue'
import RichTextEditor from '@/components/forms/RichTextEditor.vue'
import { useFeedback } from '@/composables/useFeedback'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { toast } = useFeedback()
const { t, locale } = useI18n()
const isAr = computed(() => locale.value === 'ar')

const form = ref({
  title: '',
  category: '',
  author: '',
  authorRole: '',
  readingTime: '',
  content: '',
  coverImage: '',
  attachments: [] as AttachmentItem[],
  status: 'Published'
})

const handleSaveDraft = () => {
  form.value.status = 'Draft'
  toast.success(isAr.value ? 'تم حفظ مسودة المقال' : 'Draft saved successfully')
  router.push('/articles')
}

const handlePublish = () => {
  if (!form.value.title) {
    toast.error(isAr.value ? 'يرجى إدخال عنوان المقال' : 'Please provide an article title')
    return
  }
  form.value.status = 'Published'
  toast.success(isAr.value ? 'تم نشر المقال بنجاح' : 'Article published successfully')
  router.push('/articles')
}
</script>

<template>
  <AppShell>
    <div class="flex flex-col max-w-5xl mx-auto">
      <PageHeader
        :title="t('articles.createArticle')"
        :description="t('articles.subtitle')"
      />

      <div class="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-2xs">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <!-- Left Main Form: 2 cols -->
          <div class="lg:col-span-2 flex flex-col gap-5">
            <h2 class="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {{ isAr ? 'معلومات المقال' : 'Article Information' }}
            </h2>

            <!-- Title -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">{{ isAr ? 'عنوان المقال *' : 'Title *' }}</label>
              <input
                v-model="form.title"
                type="text"
                :placeholder="isAr ? 'أدخل عنوان المقال' : 'Enter article title'"
                class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
              />
            </div>

            <!-- Category -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">{{ isAr ? 'التصنيف *' : 'Category *' }}</label>
              <select
                v-model="form.category"
                class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 cursor-pointer"
              >
                <option value="">{{ isAr ? 'اختر التصنيف' : 'Select category' }}</option>
                <option value="Beginner">{{ isAr ? 'مبتدئ' : 'Beginner' }}</option>
                <option value="Technical Analysis">{{ isAr ? 'التحليل الفني' : 'Technical Analysis' }}</option>
                <option value="Market News">{{ isAr ? 'أخبار السوق' : 'Market News' }}</option>
                <option value="Investing">{{ isAr ? 'الاستثمار' : 'Investing' }}</option>
              </select>
            </div>

            <!-- Author & Role -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold text-slate-700">{{ isAr ? 'الكاتب *' : 'Author *' }}</label>
                <input
                  v-model="form.author"
                  type="text"
                  :placeholder="isAr ? 'أدخل اسم الكاتب' : 'Enter author name'"
                  class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
                />
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold text-slate-700">{{ isAr ? 'صفة الكاتب' : 'Author Role' }}</label>
                <input
                  v-model="form.authorRole"
                  type="text"
                  :placeholder="isAr ? 'مثال: محلل مالي' : 'e.g. Financial Analyst'"
                  class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
                />
              </div>
            </div>

            <!-- Reading Time -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">{{ isAr ? 'وقت القراءة' : 'Reading Time' }}</label>
              <input
                v-model="form.readingTime"
                type="text"
                :placeholder="isAr ? 'مثال: 5 دقائق' : 'e.g. 5 min'"
                class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
              />
            </div>

            <!-- Content Editor -->
            <RichTextEditor
              v-model="form.content"
              :label="isAr ? 'محتوى المقال *' : 'Content *'"
              :placeholder="isAr ? 'اكتب محتوى المقال هنا...' : 'Write your article content here...'"
              :rows="8"
            />
          </div>

          <!-- Right Sidebar Form: 1 col -->
          <div class="flex flex-col gap-6">
            <!-- Cover Image Upload -->
            <ImageUploader
              v-model="form.coverImage"
              :label="isAr ? 'صورة الغلاف' : 'Cover Image'"
              :hint="isAr ? 'الحجم الموصى به: 1200×675' : 'Recommended size: 1200×675'"
            />

            <!-- Attachments & Documents Upload with Accessible Progress Bar -->
            <AttachmentUploader
              v-model="form.attachments"
              :label="isAr ? 'المرفقات والتقارير المالية' : 'Attachments & Financial Documents'"
              :hint="isAr ? 'PDF, Excel, Word (بحد أقصى 15MB)' : 'PDF, Excel, Word (max 15MB)'"
            />

            <!-- Status Selector -->
            <div class="flex flex-col gap-2 p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80">
              <label class="text-xs font-bold text-slate-700">{{ isAr ? 'الحالة' : 'Status' }}</label>
              <div class="flex items-center gap-4">
                <label class="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    v-model="form.status"
                    value="Draft"
                    class="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>{{ isAr ? 'مسودة' : 'Draft' }}</span>
                </label>
                <label class="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    v-model="form.status"
                    value="Published"
                    class="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>{{ isAr ? 'منشور' : 'Published' }}</span>
                </label>
              </div>
            </div>
          </div>

        </div>

        <!-- Form Actions Footer -->
        <div class="mt-8 pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            @click="router.push('/articles')"
            class="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition-colors cursor-pointer"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            type="button"
            @click="handleSaveDraft"
            class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            {{ isAr ? 'حفظ كمسودة' : 'Save Draft' }}
          </button>
          <button
            type="button"
            @click="handlePublish"
            class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer"
          >
            {{ isAr ? 'نشر المقال' : 'Publish' }}
          </button>
        </div>
      </div>
    </div>
  </AppShell>
</template>
