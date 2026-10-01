<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, X, Play, Clock, User } from 'lucide-vue-next'
import AppShell from '@/components/layout/AppShell.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import TableFilterBar from '@/components/data-table/TableFilterBar.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import ActionMenu from '@/components/ui/ActionMenu.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import { useFeedback } from '@/composables/useFeedback'
import { useI18n } from 'vue-i18n'
import { resolveAttachmentUrl, handleImageError } from '@/utils/attachment'

const router = useRouter()
const { confirm, toast } = useFeedback()
const { t, locale } = useI18n()
const isAr = computed(() => locale.value === 'ar')

const search = ref('')
const selectedCategory = ref('')
const selectedStatus = ref('')
const currentPage = ref(1)

const previewVideo = ref<VideoLesson | null>(null)
const isPreviewOpen = ref(false)

const filters = computed(() => [
  {
    id: 'category',
    label: t('videos.categoryCol'),
    value: selectedCategory.value,
    options: [
      { label: t('videos.catBeginner'), value: 'Beginner' },
      { label: t('videos.catMarket'), value: 'Market' },
      { label: t('videos.catTechnical'), value: 'Technical' },
      { label: t('videos.catInvesting'), value: 'Investing' },
    ]
  },
  {
    id: 'status',
    label: t('videos.statusCol'),
    value: selectedStatus.value,
    options: [
      { label: t('common.published'), value: 'Published' },
      { label: t('common.draft'), value: 'Draft' },
    ]
  }
])

const handleFilterChange = (filterId: string, val: string) => {
  if (filterId === 'category') selectedCategory.value = val
  if (filterId === 'status') selectedStatus.value = val
}

const getCategoryLabel = (category: string) => {
  const c = (category || '').toLowerCase()
  if (c === 'beginner') return t('videos.catBeginner')
  if (c === 'market') return t('videos.catMarket')
  if (c === 'technical') return t('videos.catTechnical')
  if (c === 'investing') return t('videos.catInvesting')
  return category
}

const getStatusLabel = (status: string) => {
  const s = (status || '').toLowerCase()
  if (s === 'published') return t('common.published')
  if (s === 'draft') return t('common.draft')
  return status
}

interface VideoLesson {
  id: string
  title: string
  thumbnail: string
  category: string
  educator: string
  duration: string
  status: 'Published' | 'Draft'
}

const videos = ref<VideoLesson[]>([
  {
    id: 'vid-1',
    title: 'Investing 101',
    thumbnail: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=150&auto=format&fit=crop&q=80',
    category: 'Beginner',
    educator: 'Ali Hussain',
    duration: '15:30',
    status: 'Published'
  },
  {
    id: 'vid-2',
    title: 'Stock Market Basics',
    thumbnail: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=150&auto=format&fit=crop&q=80',
    category: 'Market',
    educator: 'Maryam Ali',
    duration: '21:45',
    status: 'Published'
  },
  {
    id: 'vid-3',
    title: 'Technical Analysis',
    thumbnail: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=150&auto=format&fit=crop&q=80',
    category: 'Technical',
    educator: 'Omar Ali',
    duration: '18:20',
    status: 'Draft'
  },
  {
    id: 'vid-4',
    title: 'Portfolio Building',
    thumbnail: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=150&auto=format&fit=crop&q=80',
    category: 'Investing',
    educator: 'Sarah Ahmed',
    duration: '25:10',
    status: 'Published'
  }
])

const filteredVideos = computed(() => {
  return videos.value.filter(vid => {
    const matchesSearch = !search.value || 
      vid.title.toLowerCase().includes(search.value.toLowerCase()) || 
      vid.educator.toLowerCase().includes(search.value.toLowerCase())
    const matchesCat = !selectedCategory.value || vid.category === selectedCategory.value
    const matchesStatus = !selectedStatus.value || vid.status === selectedStatus.value
    return matchesSearch && matchesCat && matchesStatus
  })
})

const handleAction = async (actionId: string, vid: VideoLesson) => {
  if (actionId === 'edit') {
    router.push(`/videos/${vid.id}/edit`)
  } else if (actionId === 'preview') {
    previewVideo.value = vid
    isPreviewOpen.value = true
  } else if (actionId === 'delete') {
    const ok = await confirm({
      title: t('videos.deleteConfirmTitle'),
      message: `${t('videos.deleteConfirmDesc')} ("${vid.title}")`,
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      type: 'danger'
    })
    if (ok) {
      videos.value = videos.value.filter(v => v.id !== vid.id)
      toast.success(isAr.value ? 'تم حذف الفيديو بنجاح' : 'Video deleted successfully')
    }
  }
}
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

        <!-- Data Table -->
        <div class="overflow-x-auto">
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
                v-for="vid in filteredVideos"
                :key="vid.id"
                class="hover:bg-slate-50/60 transition-colors"
              >
                <!-- Thumbnail Image -->
                <td class="py-3 px-4 text-start">
                  <img
                    :src="resolveAttachmentUrl(vid.thumbnail, 'image')"
                    :alt="vid.title"
                    @error="handleImageError($event, 'image')"
                    class="w-12 h-9 rounded-lg object-cover border border-slate-200"
                  />
                </td>

                <!-- Title -->
                <td class="py-3 px-4 font-bold text-slate-900 text-start">{{ vid.title }}</td>

                <!-- Category -->
                <td class="py-3 px-4 text-slate-600 font-medium text-start">
                  {{ getCategoryLabel(vid.category) }}
                </td>

                <!-- Educator -->
                <td class="py-3 px-4 text-slate-800 font-medium text-start">{{ vid.educator }}</td>

                <!-- Duration -->
                <td class="py-3 px-4 text-slate-500 font-medium text-start">{{ vid.duration }}</td>

                <!-- Status -->
                <td class="py-3 px-4 text-start">
                  <StatusBadge :status="vid.status">
                    {{ getStatusLabel(vid.status) }}
                  </StatusBadge>
                </td>

                <!-- Actions Menu -->
                <td class="py-3 px-4 text-end">
                  <ActionMenu
                    :items="[
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
        <AppPagination v-model:current-page="currentPage" :total-pages="5" />
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
          @click.self="isPreviewOpen = false"
        >
          <div class="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 flex flex-col gap-4 overflow-hidden">
            <!-- Modal Header -->
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Play class="w-4 h-4 fill-emerald-600" />
                </div>
                <div>
                  <h3 class="text-sm font-bold text-slate-900 leading-tight">
                    {{ previewVideo.title }}
                  </h3>
                  <div class="flex items-center gap-2 mt-0.5">
                    <span class="text-[11px] text-slate-500 font-medium">{{ getCategoryLabel(previewVideo.category) }}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                @click="isPreviewOpen = false"
                class="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <X class="w-4 h-4" />
              </button>
            </div>

            <!-- Video Player Mockup -->
            <div class="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-950 group flex items-center justify-center shadow-inner">
              <img
                :src="resolveAttachmentUrl(previewVideo.thumbnail, 'image')"
                :alt="previewVideo.title"
                @error="handleImageError($event, 'image')"
                class="w-full h-full object-cover opacity-75 group-hover:scale-105 transition-transform duration-300"
              />
              <div class="absolute inset-0 bg-slate-950/40 group-hover:bg-slate-950/30 transition-colors"></div>
              
              <!-- Play Button Overlay -->
              <div class="absolute z-10 w-16 h-16 rounded-full bg-emerald-600/90 text-white flex items-center justify-center shadow-xl hover:scale-110 hover:bg-emerald-600 transition-all cursor-pointer">
                <Play class="w-7 h-7 fill-white translate-x-0.5" />
              </div>

              <!-- Video Info Overlay at Bottom -->
              <div class="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent flex items-center justify-between text-white text-xs">
                <div class="flex items-center gap-3">
                  <div class="flex items-center gap-1.5 font-medium">
                    <User class="w-3.5 h-3.5 text-emerald-400" />
                    <span>{{ previewVideo.educator }}</span>
                  </div>
                </div>
                <div class="flex items-center gap-1.5 font-mono text-[11px] bg-slate-900/80 px-2 py-0.5 rounded-md border border-white/10">
                  <Clock class="w-3 h-3 text-slate-400" />
                  <span>{{ previewVideo.duration }}</span>
                </div>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <div class="flex items-center gap-2">
                <StatusBadge :status="previewVideo.status" />
              </div>
              <div class="flex items-center justify-end gap-2">
                <button
                  type="button"
                  @click="isPreviewOpen = false"
                  class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  {{ t('common.close') }}
                </button>
                <button
                  type="button"
                  @click="router.push(`/videos/${previewVideo.id}/edit`)"
                  class="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-xs cursor-pointer"
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
