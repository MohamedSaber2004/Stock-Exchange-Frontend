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
  title: 'Investing 101: A Beginner\'s Guide',
  category: 'Beginner',
  author: 'Maryam Ali',
  authorRole: 'Financial Analyst',
  readingTime: '5 min',
  content: 'Investing is one of the most powerful ways to build long-term wealth and beat inflation over time. When you invest, you put your capital to work in assets that have the potential to appreciate in value or generate income...',
  coverImage: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=80',
  attachments: [
    {
      id: 'att-101',
      name: 'Beginner_Investor_CheatSheet.pdf',
      size: 1420000,
      status: 'success'
    }
  ] as AttachmentItem[],
  status: 'Published'
})

const handleSaveChanges = () => {
  toast.success(isAr.value ? 'تم حفظ تعديلات المقال بنجاح' : 'Article changes saved successfully')
  router.push('/articles')
}
</script>

<template>
  <AppShell>
    <div class="flex flex-col max-w-5xl mx-auto">
      <PageHeader
        :title="t('articles.editArticle')"
        :description="t('articles.subtitle')"
      />

      <div class="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 lg:p-8 shadow-2xs">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          
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
                class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 font-medium"
              />
            </div>

            <!-- Category -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">{{ isAr ? 'التصنيف *' : 'Category *' }}</label>
              <select
                v-model="form.category"
                class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 cursor-pointer font-medium"
              >
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
                  class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 font-medium"
                />
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold text-slate-700">{{ isAr ? 'صفة الكاتب' : 'Author Role' }}</label>
                <input
                  v-model="form.authorRole"
                  type="text"
                  class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 font-medium"
                />
              </div>
            </div>

            <!-- Reading Time -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">{{ isAr ? 'وقت القراءة' : 'Reading Time' }}</label>
              <input
                v-model="form.readingTime"
                type="text"
                class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 font-medium"
              />
            </div>

            <!-- Content Editor -->
            <RichTextEditor
              v-model="form.content"
              :label="isAr ? 'محتوى المقال *' : 'Content *'"
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
        <div class="mt-8 pt-6 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3">
          <button
            type="button"
            @click="router.push('/articles')"
            class="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition-colors cursor-pointer text-center"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            type="button"
            @click="handleSaveChanges"
            class="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer text-center"
          >
            {{ isAr ? 'حفظ التعديلات' : 'Save Changes' }}
          </button>
        </div>
      </div>
    </div>
  </AppShell>
</template>
