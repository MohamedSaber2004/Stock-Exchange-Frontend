<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, X, Play, Clock, User, RefreshCw } from 'lucide-vue-next'
import AppShell from '@/components/layout/AppShell.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import TableFilterBar from '@/components/data-table/TableFilterBar.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import ActionMenu from '@/components/ui/ActionMenu.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import { useFeedback } from '@/composables/useFeedback'
import { useI18n } from 'vue-i18n'
import { resolveAttachmentUrl, handleImageError } from '@/utils/attachment'
import { coreServices } from '@/di'
import type { VideoDto } from '@/domain/models/video.model'
import type { VideoCategory } from '@/domain/models/video-category.model'

const router = useRouter()
const { confirm, toast } = useFeedback()
const { t, locale } = useI18n()
const isAr = computed(() => locale.value === 'ar')

const search = ref('')
const selectedCategoryId = ref('')
const selectedStatus = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const totalPages = ref(1)
const totalCount = ref(0)

const videos = ref<VideoDto[]>([])
const categories = ref<VideoCategory[]>([])
const isLoading = ref(true)

const previewVideo = ref<VideoDto | null>(null)
const isPreviewOpen = ref(false)

// Load categories for filter dropdown
const loadCategories = async () => {
  try {
    categories.value = await coreServices.videos.getCategories({ applyLanguageFilter: false })
  } catch {
    categories.value = []
  }
}

// Load videos from API
const loadVideos = async () => {
  isLoading.value = true
  try {
    const isActiveFilter = selectedStatus.value === 'active'
      ? true
      : selectedStatus.value === 'inactive'
        ? false
        : undefined

    const result = await coreServices.videos.getAll({
      pageNumber: currentPage.value,
      pageSize: pageSize.value,
      search: search.value?.trim() || undefined,
      videoCategoryId: selectedCategoryId.value?.trim() || undefined,
      isActive: isActiveFilter,
      applyLanguageFilter: false
    })

    const raw = result as unknown
    if (raw && typeof raw === 'object' && 'data' in (raw as object)) {
      const inner = (raw as { data: typeof result }).data
      videos.value = inner?.items ?? []
      totalPages.value = inner?.totalPages ?? 1
      totalCount.value = inner?.totalCount ?? 0
    } else {
      videos.value = result?.items ?? []
      totalPages.value = result?.totalPages ?? 1
      totalCount.value = result?.totalCount ?? 0
    }
  } catch (err) {
    console.error('Failed to load videos:', err)
    toast.error(isAr.value ? 'فشل تحميل الفيديوهات' : 'Failed to load videos')
    videos.value = []
  } finally {
    isLoading.value = false
  }
}

const filters = computed(() => [
  {
    id: 'category',
    label: t('videos.categoryCol'),
    value: selectedCategoryId.value,
    options: categories.value.map(cat => ({
      label: isAr.value
        ? (cat.categoryArName || cat.categoryEnName || '')
        : (cat.categoryEnName || cat.categoryArName || ''),
      value: cat.id
    }))
  },
  {
    id: 'status',
    label: t('videos.statusCol'),
    value: selectedStatus.value,
    options: [
      { label: isAr.value ? 'نشط' : 'Active', value: 'active' },
      { label: isAr.value ? 'غير نشط' : 'Inactive', value: 'inactive' },
    ]
  }
])

const handleFilterChange = (filterId: string, val: string) => {
  if (filterId === 'category') selectedCategoryId.value = val
  if (filterId === 'status') selectedStatus.value = val
  currentPage.value = 1
}

let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    currentPage.value = 1
    loadVideos()
  }, 400)
})

watch([selectedCategoryId, selectedStatus], () => {
  currentPage.value = 1
  loadVideos()
})

watch(currentPage, () => {
  loadVideos()
})

const getVideoTitle = (vid?: VideoDto | null) => {
  if (!vid) return ''
  return isAr.value ? (vid.titleAr || vid.titleEn || '') : (vid.titleEn || vid.titleAr || '')
}

const getCategoryName = (vid?: VideoDto | null) => {
  if (!vid) return '-'
  if (isAr.value) return vid.categoryArName || vid.categoryAr || vid.categoryEnName || vid.categoryEn || '-'
  return vid.categoryEnName || vid.categoryEn || vid.categoryArName || vid.categoryAr || '-'
}

const formatDuration = (seconds?: number | null) => {
  if (!seconds || seconds <= 0) return '-'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const closePreview = () => {
  isPreviewOpen.value = false
}

const handleAction = async (actionId: string, vid: VideoDto) => {
  if (actionId === 'details') {
    router.push(`/videos/${vid.id}`)
  } else if (actionId === 'edit') {
    router.push(`/videos/${vid.id}/edit`)
  } else if (actionId === 'preview') {
    previewVideo.value = vid
    isPreviewOpen.value = true
  } else if (actionId === 'delete') {
    const title = getVideoTitle(vid)
    const ok = await confirm({
      title: t('videos.deleteConfirmTitle'),
      message: `${t('videos.deleteConfirmDesc')} ("${title}")`,
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      type: 'danger'
    })
    if (ok) {
      try {
        await coreServices.videos.delete(vid.id)
        toast.success(isAr.value ? 'تم حذف الفيديو بنجاح' : 'Video deleted successfully')
        await loadVideos()
      } catch (err) {
        console.error('Delete video failed:', err)
        toast.error(isAr.value ? 'فشل حذف الفيديو' : 'Failed to delete video')
      }
    }
  }
}

onMounted(async () => {
  await loadCategories()
  await loadVideos()
})
</script>

<template>
  <AppShell>
    <div class="flex flex-col max-w-7xl mx-auto">
      <PageHeader
        :title="t('videos.title')"
        :description="t('videos.subtitle')"
      >
        <template #actions>
          <button
            type="button"
            @click="loadVideos"
            :disabled="isLoading"
            class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw :class="['w-3.5 h-3.5', isLoading && 'animate-spin']" />
          </button>
          <button
            type="button"
            @click="router.push('/videos/create')"
            class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus class="w-3.5 h-3.5 stroke-[3]" />
            {{ t('videos.addVideo') }}
          </button>
        </template>
      </PageHeader>

      <!-- Table Box -->
      <div class="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
        <!-- Filter Bar -->
        <TableFilterBar
          :search-placeholder="t('videos.searchPlaceholder')"
          v-model:search-value="search"
          :filters="filters"
          @update:filter="handleFilterChange"
        />

        <!-- Loading State -->
        <div v-if="isLoading" class="flex items-center justify-center py-20">
          <div class="flex flex-col items-center gap-3">
            <div class="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <span class="text-xs text-slate-500 font-medium">{{ isAr ? 'جاري التحميل...' : 'Loading...' }}</span>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="!videos.length" class="flex flex-col items-center justify-center py-20 gap-3">
          <div class="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
            <span class="text-2xl">🎬</span>
          </div>
          <p class="text-sm font-bold text-slate-700">{{ isAr ? 'لا توجد فيديوهات' : 'No videos found' }}</p>
          <p class="text-xs text-slate-400">{{ isAr ? 'أضف فيديوهاً جديداً للبدء' : 'Add a new video to get started' }}</p>
          <button
            type="button"
            @click="router.push('/videos/create')"
            class="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus class="w-3.5 h-3.5 stroke-[3]" />
            {{ t('videos.addVideo') }}
          </button>
        </div>

        <!-- Data Table -->
        <div v-else class="overflow-x-auto">
          <table class="w-full text-start text-xs min-w-[650px]">
            <thead>
              <tr class="text-[11px] font-bold text-slate-400 border-b border-slate-100 uppercase tracking-wider bg-slate-50/50">
                <th class="py-3 px-4 text-start">{{ t('videos.thumbnailCol') }}</th>
                <th class="py-3 px-4 text-start">{{ t('videos.titleCol') }}</th>
                <th class="py-3 px-4 text-start">{{ t('videos.categoryCol') }}</th>
                <th class="py-3 px-4 text-start">{{ t('videos.educatorCol') }}</th>
                <th class="py-3 px-4 text-start">{{ t('videos.durationCol') }}</th>
                <th class="py-3 px-4 text-start">{{ t('videos.statusCol') }}</th>
                <th class="py-3 px-4 text-end">{{ t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="vid in videos"
                :key="vid.id"
                class="hover:bg-slate-50/60 transition-colors"
              >
                <!-- Thumbnail Image -->
                <td class="py-3 px-4 text-start">
                  <img
                    :src="resolveAttachmentUrl(vid.thumbnailUrl ?? '', 'image')"
                    :alt="getVideoTitle(vid)"
                    @error="handleImageError($event, 'image')"
                    class="w-12 h-9 rounded-lg object-cover border border-slate-200"
                  />
                </td>

                <!-- Title -->
                <td class="py-3 px-4 font-bold text-slate-900 text-start">{{ getVideoTitle(vid) }}</td>

                <!-- Category -->
                <td class="py-3 px-4 text-slate-600 font-medium text-start">
                  {{ getCategoryName(vid) }}
                </td>

                <!-- Educator -->
                <td class="py-3 px-4 text-slate-800 font-medium text-start">{{ vid.instructorName }}</td>

                <!-- Duration -->
                <td class="py-3 px-4 text-slate-500 font-medium text-start font-mono">{{ formatDuration(vid.durationSeconds) }}</td>

                <!-- Status -->
                <td class="py-3 px-4 text-start">
                  <StatusBadge :status="vid.isActive ? 'active' : 'inactive'" :variant="vid.isActive ? 'success' : 'neutral'">
                    {{ vid.isActive ? (isAr ? 'نشط' : 'Active') : (isAr ? 'غير نشط' : 'Inactive') }}
                  </StatusBadge>
                </td>

                <!-- Actions Menu -->
                <td class="py-3 px-4 text-end">
                  <ActionMenu
                    :items="[
                      { id: 'details', label: isAr ? 'عرض التفاصيل' : 'View Details' },
                      { id: 'preview', label: t('videos.previewVideo') },
                      { id: 'edit', label: t('common.edit') },
                      { id: 'delete', label: t('common.delete'), danger: true }
                    ]"
                    @select="(act) => handleAction(act, vid)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <AppPagination
          v-if="!isLoading && totalPages > 1"
          v-model:current-page="currentPage"
          :total-pages="totalPages"
        />

        <!-- Total count info -->
        <p v-if="!isLoading && totalCount > 0" class="text-[11px] text-slate-400 mt-3 text-center">
          {{ isAr ? `إجمالي ${totalCount} فيديو` : `${totalCount} video${totalCount !== 1 ? 's' : ''} total` }}
        </p>
      </div>

      <!-- Video Preview Modal -->
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-if="isPreviewOpen && previewVideo"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          @click.self="closePreview"
        >
          <div class="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl border border-slate-100 flex flex-col gap-4">
            <!-- Modal Header -->
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Play class="w-4 h-4 fill-emerald-600" />
                </div>
                <div>
                  <h3 class="text-sm font-bold text-slate-900 leading-tight">
                    {{ getVideoTitle(previewVideo) }}
                  </h3>
                  <div class="flex items-center gap-2 mt-0.5">
                    <span class="text-[11px] text-slate-500 font-medium">{{ getCategoryName(previewVideo) }}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                @click="closePreview"
                class="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X class="w-4 h-4" />
              </button>
            </div>

            <!-- Video Player in Modal -->
            <div class="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center shadow-inner">
              <video
                v-if="resolveAttachmentUrl(previewVideo.videoUrl)"
                :src="resolveAttachmentUrl(previewVideo.videoUrl)"
                :poster="previewVideo.thumbnailUrl ? resolveAttachmentUrl(previewVideo.thumbnailUrl, 'image') : undefined"
                controls
                playsinline
                class="w-full h-full object-contain"
              ></video>
              <div v-else class="w-full h-full relative flex items-center justify-center">
                <img
                  :src="resolveAttachmentUrl(previewVideo.thumbnailUrl ?? '', 'image')"
                  :alt="getVideoTitle(previewVideo)"
                  @error="handleImageError($event, 'image')"
                  class="w-full h-full object-cover opacity-75"
                />
                <!-- Video Info Overlay at Bottom -->
                <div class="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent flex items-center justify-between text-white text-xs">
                  <div class="flex items-center gap-3">
                    <div class="flex items-center gap-1.5 font-medium">
                      <User class="w-3.5 h-3.5 text-emerald-400" />
                      <span>{{ previewVideo.instructorName }}</span>
                    </div>
                  </div>
                  <div class="flex items-center gap-1.5 font-mono text-[11px] bg-slate-900/80 px-2 py-0.5 rounded-md border border-white/10">
                    <Clock class="w-3 h-3 text-slate-400" />
                    <span>{{ formatDuration(previewVideo.durationSeconds) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <div class="flex items-center gap-2">
                <StatusBadge :status="previewVideo.isActive ? 'active' : 'inactive'" :variant="previewVideo.isActive ? 'success' : 'neutral'">
                  {{ previewVideo.isActive ? (isAr ? 'نشط' : 'Active') : (isAr ? 'غير نشط' : 'Inactive') }}
                </StatusBadge>
              </div>
              <div class="flex items-center justify-end gap-2">
                <button
                  type="button"
                  @click="closePreview"
                  class="flex-1 sm:flex-initial text-center px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  {{ t('common.close') }}
                </button>
                <button
                  type="button"
                  @click="router.push(`/videos/${previewVideo.id}/edit`); closePreview()"
                  class="flex-1 sm:flex-initial text-center px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  {{ t('videos.editVideo') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </AppShell>
</template>
