<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  ArrowRight,
  Edit,
  Trash2,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  Video as VideoIcon,
  ShieldCheck,
  Play,
  ArrowUpRight
} from 'lucide-vue-next'
import AppShell from '@/components/layout/AppShell.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import DataState from '@/components/ui/DataState.vue'
import MobileDeviceFrame from '@/components/mobile-preview/MobileDeviceFrame.vue'
import { useFeedback } from '@/composables/useFeedback'
import { useI18n } from 'vue-i18n'
import { coreServices } from '@/di'
import { resolveAttachmentUrl, handleImageError } from '@/utils/attachment'
import type { VideoDto } from '@/domain/models/video.model'
import type { AppError } from '@/domain/models/common.model'

const route = useRoute()
const router = useRouter()
const { toast, confirm } = useFeedback()
const { t, locale } = useI18n()
const isAr = computed(() => locale.value === 'ar')

const video = ref<VideoDto | null>(null)
const isLoading = ref(true)
const errorMessage = ref<string | null>(null)
const activeTab = ref<'ar' | 'en'>('ar')

const loadVideo = async (targetId?: string) => {
  const id = targetId || (route.params.id as string)
  if (!id) return
  isLoading.value = true
  errorMessage.value = null
  try {
    const data = await coreServices.videos.getById(id)
    video.value = data
  } catch (err: unknown) {
    const appErr = err as AppError
    errorMessage.value = appErr?.message || (isAr.value ? 'فشل تحميل تفاصيل الفيديو' : 'Failed to load video details')
    toast.error(errorMessage.value)
  } finally {
    isLoading.value = false
  }
}

watch(
  () => route.params.id,
  (newId) => {
    if (newId) {
      loadVideo(newId as string)
    }
  }
)

const handleDelete = async () => {
  if (!video.value) return
  const title = isAr.value ? (video.value.titleAr || video.value.titleEn) : (video.value.titleEn || video.value.titleAr)
  const ok = await confirm({
    title: t('videos.deleteConfirmTitle'),
    message: `${t('videos.deleteConfirmDesc')} ("${title}")`,
    confirmText: t('common.delete'),
    cancelText: t('common.cancel'),
    type: 'danger'
  })

  if (!ok) return

  try {
    await coreServices.videos.delete(video.value.id)
    toast.success(isAr.value ? 'تم حذف الفيديو بنجاح' : 'Video deleted successfully')
    router.push('/videos')
  } catch (err: unknown) {
    const appErr = err as AppError
    toast.error(appErr?.message || (isAr.value ? 'فشل حذف الفيديو' : 'Failed to delete video'))
  }
}

const formatDuration = (seconds?: number) => {
  if (!seconds || seconds <= 0) return '-'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

onMounted(() => {
  loadVideo()
})
</script>

<template>
  <AppShell>
    <div class="flex flex-col max-w-7xl mx-auto space-y-6">
      
      <!-- Top Header & Actions -->
      <PageHeader
        :title="isAr ? (video?.titleAr || video?.titleEn || 'تفاصيل الفيديو') : (video?.titleEn || video?.titleAr || 'Video Details')"
        :description="isAr ? 'معاينة الفيديو وبياناته ومحاكاته المباشرة على تطبيق الهاتف' : 'Review video playback, metadata, and Flutter mobile preview'"
      >
        <template #actions>
          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="router.push('/videos')"
              class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              <component :is="isAr ? ArrowRight : ArrowLeft" class="w-3.5 h-3.5" />
              {{ isAr ? 'العودة إلى الفيديوهات' : 'Back to Videos' }}
            </button>

            <button
              v-if="video"
              type="button"
              @click="router.push(`/videos/${video.id}/edit`)"
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Edit class="w-3.5 h-3.5" />
              {{ t('common.edit') }}
            </button>

            <button
              v-if="video"
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
        :empty="!isLoading && !video"
        @retry="loadVideo"
      >
        <div v-if="video" class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          <!-- Left Column: Video Details & Player (7 cols) -->
          <div class="lg:col-span-7 flex flex-col gap-6">
            
            <!-- Video Player Preview Container -->
            <div class="bg-black rounded-3xl border border-slate-800 shadow-xl overflow-hidden relative">
              <video
                v-if="video.videoUrl"
                controls
                class="w-full aspect-video object-cover"
                :poster="video.thumbnailUrl ? resolveAttachmentUrl(video.thumbnailUrl, 'image') : undefined"
              >
                <source :src="resolveAttachmentUrl(video.videoUrl, 'video')" type="video/mp4" />
                {{ isAr ? 'المتصفح لا يدعم تشغيل الفيديو' : 'Your browser does not support HTML5 video.' }}
              </video>
              <div v-else class="w-full aspect-video flex flex-col items-center justify-center text-slate-400 gap-2 bg-slate-950">
                <VideoIcon class="w-12 h-12 stroke-1 text-slate-600" />
                <span class="text-xs font-semibold">{{ isAr ? 'لا يوجد ملف فيديو مرفوع' : 'No video file uploaded' }}</span>
              </div>
            </div>

            <!-- Quick Stat Bar Cards -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <!-- Active Status -->
              <div class="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-2xs flex flex-col gap-1">
                <span class="text-[11px] font-bold text-slate-400">{{ t('videos.statusCol') }}</span>
                <div class="flex items-center gap-1.5 mt-0.5">
                  <CheckCircle2 v-if="video.isActive" class="w-4 h-4 text-emerald-600" />
                  <XCircle v-else class="w-4 h-4 text-slate-400" />
                  <span class="text-xs font-black text-slate-900">
                    {{ video.isActive ? (isAr ? 'نشط' : 'Active') : (isAr ? 'غير نشط' : 'Inactive') }}
                  </span>
                </div>
              </div>

              <!-- Duration -->
              <div class="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-2xs flex flex-col gap-1">
                <span class="text-[11px] font-bold text-slate-400">{{ t('videos.duration') }}</span>
                <div class="flex items-center gap-1.5 mt-0.5">
                  <Clock class="w-4 h-4 text-emerald-600" />
                  <span class="text-xs font-black text-slate-900 font-mono">
                    {{ formatDuration(video.durationSeconds) }}
                  </span>
                </div>
              </div>

              <!-- Preview Access -->
              <div class="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-2xs flex flex-col gap-1">
                <span class="text-[11px] font-bold text-slate-400">{{ isAr ? 'صلاحية المشاهدة' : 'Access' }}</span>
                <div class="flex items-center gap-1.5 mt-0.5">
                  <ShieldCheck v-if="video.isPreviewable" class="w-4 h-4 text-blue-600" />
                  <ShieldCheck v-else class="w-4 h-4 text-amber-500" />
                  <span class="text-xs font-black text-slate-900">
                    {{ video.isPreviewable ? (isAr ? 'مجاني' : 'Free Preview') : (isAr ? 'للمشتركين' : 'Subscribers') }}
                  </span>
                </div>
              </div>

              <!-- Instructor -->
              <div class="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-2xs flex flex-col gap-1">
                <span class="text-[11px] font-bold text-slate-400">{{ t('videos.instructor') }}</span>
                <div class="flex items-center gap-1.5 mt-0.5 truncate">
                  <User class="w-4 h-4 text-slate-400 shrink-0" />
                  <span class="text-xs font-black text-slate-900 truncate">
                    {{ video.instructorName || '-' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Bilingual Content & Descriptions -->
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
                    <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">عنوان الفيديو</span>
                    <h2 class="text-lg font-black text-slate-900 mt-1">
                      {{ video.titleAr || 'لا يوجد عنوان بالعربية' }}
                    </h2>
                  </div>

                  <div>
                    <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">وصف الفيديو</span>
                    <div class="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed mt-1">
                      {{ video.descriptionAr || 'لا يوجد وصف تفصيلي بالعربية للفيديو.' }}
                    </div>
                  </div>
                </div>

                <!-- English Tab -->
                <div v-else dir="ltr" class="flex flex-col gap-3">
                  <div>
                    <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">English Title</span>
                    <h2 class="text-lg font-black text-slate-900 mt-1">
                      {{ video.titleEn || 'No English title provided' }}
                    </h2>
                  </div>

                  <div>
                    <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Video Description</span>
                    <div class="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed mt-1">
                      {{ video.descriptionEn || 'No English description provided for this video.' }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Related Videos Section -->
            <div class="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
              <div class="p-5 border-b border-slate-100 flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <VideoIcon class="w-4 h-4" />
                  </div>
                  <div>
                    <h3 class="text-sm font-black text-slate-900">
                      {{ isAr ? 'فيديوهات ذات صلة' : 'Related Videos' }}
                    </h3>
                    <p class="text-[11px] text-slate-400 font-medium">
                      {{ isAr ? 'مقاطع مقترحة من نفس التصنيف أو محتوى تعليمي مرتبط' : 'Suggested videos from the same category or related topics' }}
                    </p>
                  </div>
                </div>

                <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-100">
                  {{ video.relatedVideos?.length || 0 }} {{ isAr ? 'فيديو' : 'videos' }}
                </span>
              </div>

              <div class="p-5">
                <!-- If Related Videos Exist -->
                <div
                  v-if="video.relatedVideos && video.relatedVideos.length > 0"
                  class="grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                  <div
                    v-for="rel in video.relatedVideos"
                    :key="rel.id"
                    @click="router.push(`/videos/${rel.id}`)"
                    class="group relative bg-slate-50/70 hover:bg-slate-100/90 border border-slate-200/70 hover:border-emerald-300 rounded-2xl p-3 transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-2xs hover:shadow-sm"
                  >
                    <!-- Thumbnail with duration & preview badges -->
                    <div class="aspect-video w-full rounded-xl overflow-hidden bg-slate-950 relative border border-slate-200/60">
                      <img
                        v-if="rel.thumbnailUrl"
                        :src="resolveAttachmentUrl(rel.thumbnailUrl, 'image')"
                        :alt="rel.titleEn"
                        class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        @error="handleImageError($event, 'image')"
                      />
                      <div v-else class="w-full h-full flex items-center justify-center bg-slate-900 text-slate-600">
                        <VideoIcon class="w-8 h-8 stroke-1" />
                      </div>

                      <!-- Play Overlay Hover -->
                      <div class="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div class="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <Play class="w-4 h-4 fill-white ml-0.5" />
                        </div>
                      </div>

                      <!-- Access Badge (Top-left) -->
                      <span
                        class="absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-md shadow-xs backdrop-blur-xs"
                        :class="rel.isPreviewable ? 'bg-blue-600/90 text-white' : 'bg-slate-900/90 text-slate-200'"
                      >
                        {{ rel.isPreviewable ? (isAr ? 'مجاني' : 'Free Preview') : (isAr ? 'للمشتركين' : 'Subscribers') }}
                      </span>

                      <!-- Duration Badge (Bottom-right) -->
                      <span class="absolute bottom-2 right-2 text-[10px] font-mono font-bold bg-black/80 backdrop-blur-xs text-white px-1.5 py-0.5 rounded">
                        {{ formatDuration(rel.durationSeconds) }}
                      </span>
                    </div>

                    <!-- Title & Details -->
                    <div class="mt-3 flex flex-col gap-1.5 flex-1">
                      <h4 class="text-xs font-black text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug">
                        {{ isAr ? (rel.titleAr || rel.titleEn) : (rel.titleEn || rel.titleAr) }}
                      </h4>

                      <div class="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <User class="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span class="truncate">{{ rel.instructorName || (isAr ? 'مدرب غير محدد' : 'No instructor') }}</span>
                      </div>
                    </div>

                    <!-- Card Footer: Category & Action -->
                    <div class="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                      <span class="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md truncate max-w-[130px]">
                        {{ isAr ? (rel.categoryArName || rel.categoryAr || rel.categoryEn || 'تعليمي') : (rel.categoryEnName || rel.categoryEn || rel.categoryAr || 'Educational') }}
                      </span>

                      <div class="flex items-center gap-1 text-slate-400 group-hover:text-emerald-600 transition-colors font-bold">
                        <span>{{ isAr ? 'عرض' : 'View' }}</span>
                        <ArrowUpRight class="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Empty State -->
                <div
                  v-else
                  class="py-8 px-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center text-center gap-2"
                >
                  <div class="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                    <VideoIcon class="w-5 h-5 stroke-1" />
                  </div>
                  <p class="text-xs font-bold text-slate-700">
                    {{ isAr ? 'لا توجد فيديوهات ذات صلة حالياً' : 'No related videos available' }}
                  </p>
                  <p class="text-[11px] text-slate-400 max-w-sm">
                    {{ isAr ? 'سيتم ربط وإظهار الفيديوهات المشابهة تلقائياً عند إضافة المزيد من الدروس في نفس التصنيف.' : 'Similar lessons will appear here automatically when more videos are added to the same category.' }}
                  </p>
                </div>
              </div>
            </div>

          </div>

          <!-- Right Column: Interactive Flutter Mobile Phone Preview (5 cols) -->
          <div class="lg:col-span-5 sticky top-6">
            <div class="bg-slate-50/70 border border-slate-200/70 rounded-3xl p-5 shadow-xs flex flex-col items-center">
              <MobileDeviceFrame
                type="video"
                :video="video"
                :default-lang="isAr ? 'ar' : 'en'"
              />
            </div>
          </div>

        </div>
      </DataState>

    </div>
  </AppShell>
</template>