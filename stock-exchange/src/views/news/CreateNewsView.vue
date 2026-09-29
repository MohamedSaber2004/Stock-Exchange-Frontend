<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import ImageUploader from '@/components/forms/ImageUploader.vue'
import RichTextEditor from '@/components/forms/RichTextEditor.vue'
import { useFeedback } from '@/composables/useFeedback'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { toast } = useFeedback()
const { t, locale } = useI18n()
const isAr = computed(() => locale.value === 'ar')

const form = ref({
  headline: '',
  badge: 'LIVE',
  summary: '',
  source: 'FinWise Editorial Team',
  featuredImage: '',
  pinToHome: true
})

const handlePublish = () => {
  if (!form.value.headline) {
    toast.error(isAr.value ? 'يرجى إدخال عنوان الخبر' : 'Please enter headline')
    return
  }
  toast.success(isAr.value ? 'تم إنشاء ونشر الخبر بنجاح' : 'News published successfully')
  router.push('/news')
}
</script>

<template>
  <AppShell>
    <div class="flex flex-col max-w-5xl mx-auto">
      <PageHeader
        :title="t('news.createNews')"
        :description="t('news.subtitle')"
      />

      <div class="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-2xs">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <!-- Left Main Form: 2 cols -->
          <div class="lg:col-span-2 flex flex-col gap-5">
            <h2 class="text-xs font-bold text-slate-400 uppercase tracking-wider">
              News Details
            </h2>

            <!-- Headline -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">Headline *</label>
              <input
                v-model="form.headline"
                type="text"
                placeholder="Enter headline..."
                class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
              />
            </div>

            <!-- Badge & Source -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold text-slate-700">Badge Type</label>
                <select
                  v-model="form.badge"
                  class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 cursor-pointer"
                >
                  <option value="LIVE">LIVE</option>
                  <option value="BREAKING">BREAKING</option>
                  <option value="UPDATE">UPDATE</option>
                </select>
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold text-slate-700">Source</label>
                <input
                  v-model="form.source"
                  type="text"
                  placeholder="e.g. FinWise Editorial Team"
                  class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
                />
              </div>
            </div>

            <!-- Summary -->
            <RichTextEditor
              v-model="form.summary"
              label="Summary *"
              placeholder="Write news content..."
              :rows="5"
            />

            <!-- Pin / Mobile Banner Checkbox -->
            <label class="flex items-center gap-2.5 mt-2 cursor-pointer select-none">
              <input
                type="checkbox"
                v-model="form.pinToHome"
                class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <span class="text-xs font-bold text-slate-700">Show as Top Banner on Mobile</span>
            </label>
          </div>

          <!-- Right Column: 1 col -->
          <div class="flex flex-col gap-6">
            <!-- Featured Image Upload -->
            <ImageUploader
              v-model="form.featuredImage"
              label="Featured Image"
              hint="Recommended size: 1200×675"
            />
          </div>

        </div>

        <!-- Footer Actions -->
        <div class="mt-8 pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            @click="router.push('/news')"
            class="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="handlePublish"
            class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer"
          >
            Publish News
          </button>
        </div>
      </div>
    </div>
  </AppShell>
</template>
