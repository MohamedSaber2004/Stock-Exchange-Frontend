<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import ImageUploader from '@/components/forms/ImageUploader.vue'
import VideoUploader from '@/components/forms/VideoUploader.vue'
import { useFeedback } from '@/composables/useFeedback'
import { useI18n } from 'vue-i18n'
import { extractApiErrors } from '@/domain/models/common.model'
import { coreServices } from '@/di'
import { sanitizeAttachmentName } from '@/utils/attachment'
import type { VideoCategory } from '@/domain/models/video-category.model'
import type { VideoDto } from '@/domain/models/video.model'

const router = useRouter()
const route = useRoute()
const { toast } = useFeedback()
const { locale } = useI18n()

const isAr = computed(() => locale.value === 'ar')
const videoId = computed(() => route.params.id as string)

const categories = ref<VideoCategory[]>([])
const isLoading = ref(true)
const isSubmitting = ref(false)
const originalVideo = ref<VideoDto | null>(null)

const form = ref({
  titleEn: '',
  titleAr: '',
  categoryId: '',
  instructorName: '',
  videoUrl: '', // Stored attachment file name (e.g. 0_video.mp4)
  thumbnailUrl: '', // Stored attachment file name
  durationSeconds: 0,
  descriptionEn: '',
  descriptionAr: '',
  isPreviewable: true,
  isFeaturedOnHome: true,
  isActive: true,
  displayOrder: 0,
})

const handleThumbnailCaptured = (payload: { file: File; dataUrl: string; attachmentName?: string }) => {
  if (payload.attachmentName) {
    form.value.thumbnailUrl = payload.attachmentName
    toast.success(
      isAr.value
        ? 'تم التقاط صورة الغلاف ورفعها تلقائياً'
        : 'Cover image captured and uploaded automatically'
    )
  }
}

const loadCategories = async () => {
  try {
    categories.value = await coreServices.videos.getCategories({ applyLanguageFilter: false })
  } catch {
    categories.value = []
  }
}

const loadVideo = async () => {
  if (!videoId.value) return
  isLoading.value = true
  try {
    const video = await coreServices.videos.getById(videoId.value)
    originalVideo.value = video

    let resolvedCatId = video.categoryId ?? video.videoCategoryId ?? ''
    if (!resolvedCatId && categories.value.length) {
      const match = categories.value.find(
        (c) => c.categoryEnName === video.categoryEn || c.categoryArName === video.categoryAr
      )
      if (match) resolvedCatId = match.id
    }

    form.value = {
      titleEn: video.titleEn ?? '',
      titleAr: video.titleAr ?? '',
      categoryId: resolvedCatId,
      instructorName: video.instructorName ?? '',
      videoUrl: sanitizeAttachmentName(video.videoUrl),
      thumbnailUrl: sanitizeAttachmentName(video.thumbnailUrl),
      durationSeconds: video.durationSeconds ?? 0,
      descriptionEn: video.descriptionEn ?? '',
      descriptionAr: video.descriptionAr ?? '',
      isPreviewable: video.isPreviewable ?? true,
      isFeaturedOnHome: video.isFeaturedOnHome ?? true,
      isActive: video.isActive ?? true,
      displayOrder: video.displayOrder ?? 0,
    }
  } catch (err: unknown) {
    console.error('Failed to load video:', err)
    const errorDetails = extractApiErrors(err)
    toast.error(errorDetails.generalMessage || (isAr.value ? 'فشل تحميل بيانات الفيديو' : 'Failed to load video data'))
    router.push('/videos')
  } finally {
    isLoading.value = false
  }
}

const handleSave = async () => {
  if (!form.value.titleEn.trim()) {
    toast.error(isAr.value ? 'يرجى إدخال عنوان الفيديو بالإنجليزية' : 'Please enter video title in English')
    return
  }
  if (!form.value.titleAr.trim()) {
    toast.error(isAr.value ? 'يرجى إدخال عنوان الفيديو بالعربية' : 'Please enter video title in Arabic')
    return
  }
  if (!form.value.instructorName.trim()) {
    toast.error(isAr.value ? 'يرجى إدخال اسم المحاضر' : 'Please enter instructor name')
    return
  }
  if (!form.value.categoryId) {
    toast.error(isAr.value ? 'يرجى اختيار تصنيف الفيديو' : 'Please select a video category')
    return
  }
  if (!form.value.videoUrl) {
    toast.error(
      isAr.value
        ? 'يرجى رفع ملف الفيديو أولاً (لا يُسمح بروابط خارجية)'
        : 'Please upload the video file (direct external links are not allowed)'
    )
    return
  }

  const selectedCat = categories.value.find((c) => c.id === form.value.categoryId)
  const catEn = selectedCat?.categoryEnName || originalVideo.value?.categoryEn || 'General'
  const catAr = selectedCat?.categoryArName || originalVideo.value?.categoryAr || 'عام'

  isSubmitting.value = true
  try {
    await coreServices.videos.update(videoId.value, {
      titleEn: form.value.titleEn.trim(),
      titleAr: form.value.titleAr.trim(),
      thumbnailUrl: form.value.thumbnailUrl || null,
      videoUrl: form.value.videoUrl.trim(),
      durationSeconds: form.value.durationSeconds || 0,
      instructorName: form.value.instructorName.trim(),
      descriptionEn: form.value.descriptionEn.trim() || undefined,
      descriptionAr: form.value.descriptionAr.trim() || undefined,
      categoryEn: catEn,
      categoryAr: catAr,
      categoryId: form.value.categoryId || null,
      isPreviewable: form.value.isPreviewable,
      isFeaturedOnHome: form.value.isFeaturedOnHome,
      isActive: form.value.isActive,
      displayOrder: form.value.displayOrder || 0,
    })

    toast.success(isAr.value ? 'تم حفظ بيانات الفيديو بنجاح' : 'Video updated successfully')
    router.push('/videos')
  } catch (err: unknown) {
    console.error('Update video failed:', err)
    const errorDetails = extractApiErrors(err)
    const fieldMsg = errorDetails.fieldErrors
      ? Object.values(errorDetails.fieldErrors).flat().join(' - ')
      : ''
    toast.error(fieldMsg || errorDetails.generalMessage || (isAr.value ? 'فشل حفظ التعديلات' : 'Failed to save changes'))
  } finally {
    isSubmitting.value = false
  }
}

onMounted(async () => {
  await loadCategories()
  await loadVideo()
})
</script>

<template>
  <AppShell>
    <div class="flex flex-col max-w-5xl mx-auto">
      <PageHeader
        :title="isAr ? 'تعديل الفيديو التعليمي' : 'Edit Video'"
        :description="
          isAr
            ? 'تحديث ملف الفيديو وبيانات المحاضرة'
            : 'Update educational video file and lecture information'
        "
      />

      <!-- Loading skeleton -->
      <div
        v-if="isLoading"
        class="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-2xs flex items-center justify-center py-20"
      >
        <div class="flex flex-col items-center gap-3">
          <div class="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <span class="text-xs text-slate-500 font-medium">
            {{ isAr ? 'جاري تحميل البيانات...' : 'Loading video data...' }}
          </span>
        </div>
      </div>

      <div v-else class="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 lg:p-8 shadow-2xs">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          <!-- Left Column: Details (2 cols) -->
          <div class="lg:col-span-2 flex flex-col gap-5">
            <h2 class="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {{ isAr ? 'تفاصيل الفيديو' : 'Video Details' }}
            </h2>

            <!-- English Title -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">
                {{ isAr ? 'العنوان (إنجليزي) *' : 'Title (English) *' }}
              </label>
              <input
                v-model="form.titleEn"
                type="text"
                class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 font-medium"
                dir="ltr"
              />
            </div>

            <!-- Arabic Title -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">
                {{ isAr ? 'العنوان (عربي) *' : 'Title (Arabic) *' }}
              </label>
              <input
                v-model="form.titleAr"
                type="text"
                class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 font-medium"
                dir="rtl"
              />
            </div>

            <!-- Category -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">{{ isAr ? 'التصنيف *' : 'Category *' }}</label>
              <select
                v-model="form.categoryId"
                class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 cursor-pointer font-medium"
              >
                <option value="" disabled>{{ isAr ? 'اختر التصنيف *' : 'Select category *' }}</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                  {{ isAr ? cat.categoryArName : cat.categoryEnName }}
                </option>
              </select>
            </div>

            <!-- Instructor -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">{{ isAr ? 'المحاضر *' : 'Instructor *' }}</label>
              <input
                v-model="form.instructorName"
                type="text"
                class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 font-medium"
              />
            </div>

            <!-- Description Arabic -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">{{ isAr ? 'وصف الفيديو (عربي)' : 'Video Description (Arabic)' }}</label>
              <textarea
                v-model="form.descriptionAr"
                rows="3"
                dir="rtl"
                :placeholder="isAr ? 'اكتب وصفاً مختصراً لمحتوى الفيديو بالعربية...' : 'Write video description in Arabic...'"
                class="w-full bg-slate-50/50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 resize-none font-medium"
              ></textarea>
            </div>

            <!-- Description English -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">{{ isAr ? 'وصف الفيديو (إنجليزي)' : 'Video Description (English)' }}</label>
              <textarea
                v-model="form.descriptionEn"
                rows="3"
                dir="ltr"
                :placeholder="isAr ? 'اكتب وصفاً لمحتوى الفيديو بالإنجليزية...' : 'Write video description in English...'"
                class="w-full bg-slate-50/50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 resize-none font-medium"
              ></textarea>
            </div>
          </div>

          <!-- Right Column: Media Uploads & Settings (1 col) -->
          <div class="flex flex-col gap-6">
            <!-- Video File Uploader -->
            <VideoUploader
              v-model="form.videoUrl"
              v-model:thumbnail-url="form.thumbnailUrl"
              v-model:duration-seconds="form.durationSeconds"
              :label="isAr ? 'ملف الفيديو *' : 'Video File *'"
              :hint="isAr ? 'صيغ: MP4, MOV, MKV (يتم رفعه والتقاط الغلاف تلقائياً)' : 'Formats: MP4, MOV, MKV (uploaded & cover auto-captured)'"
              @thumbnail-captured="handleThumbnailCaptured"
            />

            <!-- Thumbnail Image Uploader -->
            <ImageUploader
              v-model="form.thumbnailUrl"
              :old-file-name="originalVideo?.thumbnailUrl || undefined"
              :label="isAr ? 'الصورة المصغرة (الغلاف)' : 'Video Thumbnail'"
              :hint="isAr ? 'تُلتقط تلقائياً من الفيديو أو يمكنك اختيار صورة مخصصة' : 'Auto-captured from video or choose custom image'"
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

            <!-- Toggles Settings -->
            <div class="flex flex-col gap-3 p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80">
              <label class="text-xs font-bold text-slate-700">{{ isAr ? 'الإعدادات' : 'Settings' }}</label>

              <!-- Previewable Toggle -->
              <label class="flex items-center justify-between gap-3 cursor-pointer">
                <span class="text-xs font-medium text-slate-700">
                  {{ isAr ? 'متاح للمعاينة المجانية' : 'Available for Preview' }}
                </span>
                <div
                  @click="form.isPreviewable = !form.isPreviewable"
                  :class="[
                    'w-10 h-5 rounded-full transition-colors cursor-pointer relative',
                    form.isPreviewable ? 'bg-emerald-500' : 'bg-slate-200'
                  ]"
                >
                  <div
                    :class="[
                      'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-xs transition-all',
                      form.isPreviewable ? 'start-5' : 'start-0.5'
                    ]"
                  ></div>
                </div>
              </label>

              <!-- Featured on Home Toggle -->
              <label class="flex items-center justify-between gap-3 cursor-pointer">
                <span class="text-xs font-medium text-slate-700">
                  {{ isAr ? 'مميز في الصفحة الرئيسية' : 'Featured on Home' }}
                </span>
                <div
                  @click="form.isFeaturedOnHome = !form.isFeaturedOnHome"
                  :class="[
                    'w-10 h-5 rounded-full transition-colors cursor-pointer relative',
                    form.isFeaturedOnHome ? 'bg-emerald-500' : 'bg-slate-200'
                  ]"
                >
                  <div
                    :class="[
                      'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-xs transition-all',
                      form.isFeaturedOnHome ? 'start-5' : 'start-0.5'
                    ]"
                  ></div>
                </div>
              </label>

              <!-- Active Status Toggle -->
              <label class="flex items-center justify-between gap-3 cursor-pointer">
                <span class="text-xs font-medium text-slate-700">
                  {{ isAr ? 'حالة النشاط' : 'Active Status' }}
                </span>
                <div
                  @click="form.isActive = !form.isActive"
                  :class="[
                    'w-10 h-5 rounded-full transition-colors cursor-pointer relative',
                    form.isActive ? 'bg-emerald-500' : 'bg-slate-200'
                  ]"
                >
                  <div
                    :class="[
                      'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-xs transition-all',
                      form.isActive ? 'start-5' : 'start-0.5'
                    ]"
                  ></div>
                </div>
              </label>
            </div>
          </div>
        </div>

        <!-- Form Actions Footer -->
        <div class="mt-8 pt-6 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3">
          <button
            type="button"
            @click="router.push('/videos')"
            class="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition-colors cursor-pointer text-center"
          >
            {{ isAr ? 'إلغاء' : 'Cancel' }}
          </button>
          <button
            type="button"
            @click="handleSave"
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
