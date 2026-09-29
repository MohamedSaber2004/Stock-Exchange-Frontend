<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, X, Clock, User, Eye } from 'lucide-vue-next'
import AppShell from '@/components/layout/AppShell.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import TableFilterBar from '@/components/data-table/TableFilterBar.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import ActionMenu from '@/components/ui/ActionMenu.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import { useFeedback } from '@/composables/useFeedback'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { confirm, toast } = useFeedback()
const { t, locale } = useI18n()
const isAr = computed(() => locale.value === 'ar')

const search = ref('')
const selectedCategory = ref('')
const selectedTier = ref('')
const selectedStatus = ref('')
const currentPage = ref(1)

const previewArticle = ref<Article | null>(null)
const isPreviewOpen = ref(false)

const filters = computed(() => [
  {
    id: 'category',
    label: t('articles.categoryCol'),
    value: selectedCategory.value,
    options: [
      { label: t('articles.catBeginner'), value: 'Beginner' },
      { label: t('articles.catMarket'), value: 'Market News' },
      { label: t('articles.catTechnical'), value: 'Technical Analysis' },
      { label: t('articles.catInvesting'), value: 'Investing' },
    ]
  },
  {
    id: 'tier',
    label: t('articles.tierCol'),
    value: selectedTier.value,
    options: [
      { label: t('users.planFree'), value: 'FREE' },
      { label: t('users.planBasic'), value: 'BASIC' },
      { label: t('users.planPro'), value: 'PRO' },
    ]
  },
  {
    id: 'status',
    label: t('articles.statusCol'),
    value: selectedStatus.value,
    options: [
      { label: t('common.published'), value: 'Published' },
      { label: t('common.draft'), value: 'Draft' },
    ]
  }
])

const handleFilterChange = (filterId: string, val: string) => {
  if (filterId === 'category') selectedCategory.value = val
  if (filterId === 'tier') selectedTier.value = val
  if (filterId === 'status') selectedStatus.value = val
}

const getCategoryLabel = (category: string) => {
  const c = (category || '').toLowerCase()
  if (c.includes('beginner')) return t('articles.catBeginner')
  if (c.includes('market')) return t('articles.catMarket')
  if (c.includes('technical')) return t('articles.catTechnical')
  if (c.includes('investing')) return t('articles.catInvesting')
  return category
}

const getTierLabel = (tier: string) => {
  const upper = (tier || '').toUpperCase()
  if (upper === 'FREE') return t('users.planFree')
  if (upper === 'BASIC') return t('users.planBasic')
  if (upper === 'PRO') return t('users.planPro')
  return tier
}

const getStatusLabel = (status: string) => {
  const s = (status || '').toLowerCase()
  if (s === 'published') return t('common.published')
  if (s === 'draft') return t('common.draft')
  return status
}

interface Article {
  id: string
  title: string
  subtitle: string
  cover: string
  category: string
  author: string
  tier: 'FREE' | 'BASIC' | 'PRO'
  readTime: string
  published: string
  status: 'Published' | 'Draft'
}

const articles = ref<Article[]>([
  {
    id: 'art-1',
    title: 'Investing 101',
    subtitle: 'A beginner\'s guide to financial growth',
    cover: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=150&auto=format&fit=crop&q=80',
    category: 'Beginner',
    author: 'Maryam Ali',
    tier: 'FREE',
    readTime: '5 min',
    published: 'Sep 27, 2025',
    status: 'Published'
  },
  {
    id: 'art-2',
    title: 'Market Outlook 2026',
    subtitle: 'Trends and predictions for global assets',
    cover: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=150&auto=format&fit=crop&q=80',
    category: 'Market News',
    author: 'Ahmed Hossam',
    tier: 'PRO',
    readTime: '8 min',
    published: 'Sep 21, 2025',
    status: 'Published'
  },
  {
    id: 'art-3',
    title: 'Technical Analysis',
    subtitle: 'Chart patterns and indicators explained',
    cover: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=150&auto=format&fit=crop&q=80',
    category: 'Technical Analysis',
    author: 'Omar Ali',
    tier: 'BASIC',
    readTime: '12 min',
    published: 'Sep 15, 2025',
    status: 'Draft'
  },
  {
    id: 'art-4',
    title: 'Risk Management',
    subtitle: 'Protecting your capital during volatility',
    cover: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=150&auto=format&fit=crop&q=80',
    category: 'Investing',
    author: 'Sarah Ahmed',
    tier: 'FREE',
    readTime: '6 min',
    published: 'Sep 12, 2025',
    status: 'Published'
  }
])

const filteredArticles = computed(() => {
  return articles.value.filter(art => {
    const matchesSearch = !search.value || 
      art.title.toLowerCase().includes(search.value.toLowerCase()) || 
      art.author.toLowerCase().includes(search.value.toLowerCase())
    const matchesCat = !selectedCategory.value || art.category === selectedCategory.value
    const matchesTier = !selectedTier.value || art.tier === selectedTier.value
    const matchesStatus = !selectedStatus.value || art.status === selectedStatus.value
    return matchesSearch && matchesCat && matchesTier && matchesStatus
  })
})

const handleAction = async (actionId: string, article: Article) => {
  if (actionId === 'edit') {
    router.push(`/articles/${article.id}/edit`)
  } else if (actionId === 'preview') {
    previewArticle.value = article
    isPreviewOpen.value = true
  } else if (actionId === 'delete') {
    const ok = await confirm({
      title: t('articles.deleteConfirmTitle'),
      message: `${t('articles.deleteConfirmDesc')} ("${article.title}")`,
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      type: 'danger'
    })
    if (ok) {
      articles.value = articles.value.filter(a => a.id !== article.id)
      toast.success(isAr.value ? 'تم حذف المقال بنجاح' : 'Article deleted successfully')
    }
  }
}
</script>

<template>
  <AppShell>
    <div class="flex flex-col max-w-7xl mx-auto">
      <PageHeader
        :title="t('articles.title')"
        :description="t('articles.subtitle')"
      >
        <template #actions>
          <button
            type="button"
            @click="router.push('/articles/create')"
            class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus class="w-3.5 h-3.5 stroke-[3]" />
            {{ t('articles.addArticle') }}
          </button>
        </template>
      </PageHeader>

      <!-- Table Box -->
      <div class="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
        <!-- Filter Bar -->
        <TableFilterBar
          :search-placeholder="t('articles.searchPlaceholder')"
          v-model:search-value="search"
          :filters="filters"
          @update:filter="handleFilterChange"
        />

        <!-- Data Table -->
        <div class="overflow-x-auto">
          <table class="w-full text-start text-xs">
            <thead>
              <tr class="text-[11px] font-bold text-slate-400 border-b border-slate-100 uppercase tracking-wider bg-slate-50/50">
                <th class="py-3 px-4 text-start">{{ t('common.details') }}</th>
                <th class="py-3 px-4 text-start">{{ t('articles.titleCol') }}</th>
                <th class="py-3 px-4 text-start">{{ t('articles.categoryCol') }}</th>
                <th class="py-3 px-4 text-start">{{ t('articles.authorCol') }}</th>
                <th class="py-3 px-4 text-start">{{ t('articles.tierCol') }}</th>
                <th class="py-3 px-4 text-start">{{ t('articles.readTimeCol') }}</th>
                <th class="py-3 px-4 text-start">{{ t('articles.statusCol') }}</th>
                <th class="py-3 px-4 text-end">{{ t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="article in filteredArticles"
                :key="article.id"
                class="hover:bg-slate-50/60 transition-colors"
              >
                <!-- Cover Image -->
                <td class="py-3 px-4 text-start">
                  <img
                    :src="article.cover"
                    :alt="article.title"
                    class="w-12 h-9 rounded-lg object-cover border border-slate-200"
                  />
                </td>

                <!-- Title & Subtitle -->
                <td class="py-3 px-4 text-start">
                  <div class="flex flex-col max-w-xs">
                    <span class="font-bold text-slate-900 leading-snug">{{ article.title }}</span>
                    <span class="text-[11px] text-slate-400 font-medium truncate">{{ article.subtitle }}</span>
                  </div>
                </td>

                <!-- Category -->
                <td class="py-3 px-4 text-slate-600 font-medium text-start">
                  {{ getCategoryLabel(article.category) }}
                </td>

                <!-- Author -->
                <td class="py-3 px-4 text-slate-800 font-medium text-start">{{ article.author }}</td>

                <!-- Tier -->
                <td class="py-3 px-4 text-start">
                  <StatusBadge :status="article.tier" :variant="article.tier === 'PRO' ? 'purple' : article.tier === 'BASIC' ? 'warning' : 'success'">
                    {{ getTierLabel(article.tier) }}
                  </StatusBadge>
                </td>

                <!-- Read Time -->
                <td class="py-3 px-4 text-slate-500 font-medium text-start">{{ article.readTime }}</td>

                <!-- Published Date -->
                <td class="py-3 px-4 text-slate-500 font-medium text-start">{{ article.published }}</td>

                <!-- Status -->
                <td class="py-3 px-4 text-start">
                  <StatusBadge :status="article.status">
                    {{ getStatusLabel(article.status) }}
                  </StatusBadge>
                </td>

                <!-- Actions Menu -->
                <td class="py-3 px-4 text-end">
                  <ActionMenu
                    :items="[
                      { id: 'preview', label: t('articles.previewArticle') },
                      { id: 'edit', label: t('common.edit') },
                      { id: 'delete', label: t('common.delete'), danger: true }
                    ]"
                    @select="(act) => handleAction(act, article)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <AppPagination v-model:current-page="currentPage" :total-pages="5" />
      </div>

      <!-- Article Preview Modal -->
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div 
          v-if="isPreviewOpen && previewArticle"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
        >
          <div class="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in max-h-[90vh] flex flex-col">
            <!-- Header -->
            <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div class="flex items-center gap-2">
                <StatusBadge :status="previewArticle.tier" :variant="previewArticle.tier === 'PRO' ? 'purple' : 'warning'">
                  {{ getTierLabel(previewArticle.tier) }}
                </StatusBadge>
                <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">{{ getCategoryLabel(previewArticle.category) }}</span>
              </div>
              <button 
                type="button" 
                @click="isPreviewOpen = false" 
                class="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <!-- Scrollable Content -->
            <div class="p-6 overflow-y-auto flex flex-col gap-4 text-xs">
              <img 
                :src="previewArticle.cover" 
                :alt="previewArticle.title" 
                class="w-full h-48 sm:h-64 rounded-xl object-cover border border-slate-100"
              />

              <div>
                <h2 class="text-lg font-black text-slate-900 leading-tight">{{ previewArticle.title }}</h2>
                <p class="text-xs text-slate-500 font-medium mt-1">{{ previewArticle.subtitle }}</p>
              </div>

              <div class="flex items-center gap-4 py-2 border-y border-slate-100 text-slate-600 text-[11px]">
                <div class="flex items-center gap-1.5 font-bold">
                  <User class="w-3.5 h-3.5 text-slate-400" />
                  <span>{{ previewArticle.author }}</span>
                </div>
                <div class="flex items-center gap-1.5 font-medium text-slate-400">
                  <Clock class="w-3.5 h-3.5" />
                  <span>{{ previewArticle.readTime }}</span>
                </div>
                <StatusBadge :status="previewArticle.status">
                  {{ getStatusLabel(previewArticle.status) }}
                </StatusBadge>
              </div>

              <div class="text-slate-700 leading-relaxed font-normal space-y-3">
                <p>Diversification is the practice of spreading your investments around so that your exposure to any one type of asset is limited. This practice is designed to help reduce the volatility of your portfolio over time.</p>
                <p>As an investor in financial markets, having a balanced mix of equities, bonds, indices, and liquid cash ensures that downturns in one specific sector are cushioned by performance across others.</p>
              </div>
            </div>

            <!-- Footer -->
            <div class="px-6 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <span class="text-[11px] text-slate-400">Published on {{ previewArticle.published }}</span>
              <button
                type="button"
                @click="router.push(`/articles/${previewArticle.id}/edit`)"
                class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                {{ t('articles.editArticle') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </AppShell>
</template>
