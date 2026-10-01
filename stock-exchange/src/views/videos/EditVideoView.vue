<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Play } from 'lucide-vue-next'
import AppShell from '@/components/layout/AppShell.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import RichTextEditor from '@/components/forms/RichTextEditor.vue'
import { useFeedback } from '@/composables/useFeedback'
import { useI18n } from 'vue-i18n'
import { resolveAttachmentUrl, handleImageError } from '@/utils/attachment'

const router = useRouter()
const { toast } = useFeedback()
const { t, locale } = useI18n()
const isAr = computed(() => locale.value === 'ar')

const form = ref({
  title: 'Investing 101',
  category: 'Beginner',
  educator: 'Ali Hussain',
  educatorTitle: 'Financial Educator',
  duration: '15:30',
  description: 'A complete guide to investing in the stock market. Learn key investment strategies, risk management fundamentals, and how to analyze financial assets.',
  sourceType: 'YouTube',
  videoUrl: 'https://youtube.com/watch?v=mockvideo101',
  thumbnail: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&auto=format&fit=crop&q=80',
  status: 'Published'
})

const handleSave = () => {
  if (!form.value.title) {
    toast.error(isAr.value ? 'يرجى إدخال عنوان الفيديو' : 'Please enter video title')
    return
  }
  toast.success(isAr.value ? 'تم حفظ بيانات الفيديو بنجاح' : 'Video lesson updated successfully')
  router.push('/videos')
}
</script>

<template>
  <AppShell>
    <div class="flex flex-col max-w-5xl mx-auto">
      <PageHeader
        :title="t('videos.editVideo')"
        :description="t('videos.subtitle')"
      />

      <div class="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 lg:p-8 shadow-2xs">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          
          <!-- Left Main Column: 2 cols -->
          <div class="lg:col-span-2 flex flex-col gap-5">
            <h2 class="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {{ isAr ? 'تفاصيل الدرس المرئي' : 'Video Details' }}
            </h2>

            <!-- Title -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">{{ t('videos.videoTitle') }} *</label>
              <input
                v-model="form.title"
                type="text"
                :placeholder="t('videos.enterTitle')"
                class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 font-medium"
              />
            </div>

            <!-- Category -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">{{ t('videos.category') }} *</label>
              <select
                v-model="form.category"
                class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 cursor-pointer font-medium"
              >
                <option value="Beginner">{{ t('videos.catBeginner') }}</option>
                <option value="Market">{{ t('videos.catMarket') }}</option>
                <option value="Technical">{{ t('videos.catTechnical') }}</option>
                <option value="Investing">{{ t('videos.catInvesting') }}</option>
              </select>
            </div>

            <!-- Educator & Title -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold text-slate-700">{{ t('videos.educator') }} *</label>
                <input
                  v-model="form.educator"
                  type="text"
                  :placeholder="t('videos.enterEducator')"
                  class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 font-medium"
                />
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold text-slate-700">{{ t('videos.educatorRole') }}</label>
                <input
                  v-model="form.educatorTitle"
                  type="text"
                  :placeholder="t('videos.enterEducatorRole')"
                  class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 font-medium"
                />
              </div>
            </div>

            <!-- Duration -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">{{ t('videos.duration') }} *</label>
              <input
                v-model="form.duration"
                type="text"
                placeholder="15:30"
                class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 font-medium font-mono"
              />
            </div>

            <!-- Description -->
            <RichTextEditor
              v-model="form.description"
              :label="t('videos.description') + ' *'"
              :rows="7"
            />
          </div>

          <!-- Right Column: 1 col -->
          <div class="flex flex-col gap-6">
            <!-- Video Source Selector -->
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold text-slate-700">{{ isAr ? 'مصدر الفيديو' : 'Video Source' }}</label>
              <div class="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  v-for="src in ['YouTube', 'Vimeo', 'Direct MP4']"
                  :key="src"
                  @click="form.sourceType = src"
                  :class="[
                    'py-1.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer',
                    form.sourceType === src
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  ]"
                >
                  {{ src }}
                </button>
              </div>
            </div>

            <!-- Video URL Input -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">{{ isAr ? 'رابط الفيديو *' : 'Video URL *' }}</label>
              <input
                v-model="form.videoUrl"
                type="url"
                class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
              />
            </div>

            <!-- Video Preview Player with Play Button -->
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold text-slate-700">{{ isAr ? 'المعاينة / الصورة المصغرة' : 'Thumbnail / Preview' }}</label>
              <div class="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 group aspect-video">
                <img
                  :src="resolveAttachmentUrl(form.thumbnail, 'image')"
                  alt="Video Preview"
                  @error="handleImageError($event, 'image')"
                  class="w-full h-full object-cover opacity-80"
                />
                <!-- Play Button Center Overlay -->
                <div class="absolute inset-0 flex items-center justify-center">
                  <div class="w-12 h-12 rounded-full bg-emerald-500/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform cursor-pointer">
                    <Play class="w-5 h-5 fill-white translate-x-0.5" />
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- Footer Actions -->
        <div class="mt-8 pt-6 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3">
          <button
            type="button"
            @click="router.push('/videos')"
            class="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition-colors cursor-pointer text-center"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            type="button"
            @click="handleSave"
            class="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer text-center"
          >
            {{ t('common.save') }}
          </button>
        </div>
      </div>
    </div>
  </AppShell>
</template>
