<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import {
  HelpCircle,
  FolderPlus,
  Plus,
  Trash2,
  ExternalLink,
  RefreshCw,
  Eye,
  Search,
  ChevronDown,
  ChevronUp,
  Tag,
  FolderEdit,
  Pencil
} from 'lucide-vue-next'
import AppShell from '@/components/layout/AppShell.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { useFeedback } from '@/composables/useFeedback'
import { useI18n } from 'vue-i18n'
import { coreServices } from '@/di'
import type {
  HelpCenterCategoryDto,
  HelpCenterDto,
  CreateHelpCenterPayload,
  UpdateHelpCenterPayload,
  CreateHelpCenterCategoryPayload
} from '@/domain/models/help-center.model'

const { toast, confirm } = useFeedback()
const { t, locale } = useI18n()
const isRtl = computed(() => locale.value === 'ar')

// State
const isLoading = ref(true)
const isSaving = ref(false)
const searchQuery = ref('')
const selectedCategoryId = ref<string | null>(null)
const expandedFaqIds = ref<Set<string>>(new Set())

// Data
const categories = ref<HelpCenterCategoryDto[]>([])
const faqs = ref<HelpCenterDto[]>([])

// Mobile Preview Modal
const showPreviewModal = ref(false)
const previewLang = ref<'ar' | 'en'>('ar')

// FAQ Modal State
const showFaqModal = ref(false)
const isEditingFaq = ref(false)
const faqForm = ref<{
  id: string
  titleEn: string
  titleAr: string
  contentEn: string
  contentAr: string
  categoryId: string | null
  displayOrder: number
}>({
  id: '',
  titleEn: '',
  titleAr: '',
  contentEn: '',
  contentAr: '',
  categoryId: null,
  displayOrder: 1
})

// Category Modal State
const showCategoryModal = ref(false)
const isEditingCategory = ref(false)
const categoryForm = ref<{
  id: string
  titleEn: string
  titleAr: string
}>({
  id: '',
  titleEn: '',
  titleAr: ''
})

import { useLivePreview } from '@/composables'

const previewUrl = computed(() => {
  const apiBase = coreServices.httpClient.getBaseUrl().replace(/\/+$/, '')
  return `${apiBase}/help-center/view?lang=${previewLang.value}`
})

const { previewHtml, isPreviewLoading, fetchPreviewHtml } = useLivePreview(() => previewUrl.value)

watch([showPreviewModal, previewLang], ([isOpen]) => {
  if (isOpen) {
    fetchPreviewHtml()
  }
})

const loadData = async () => {
  isLoading.value = true
  try {
    const [cats, items] = await Promise.all([
      coreServices.helpCenter.getCategories(false),
      coreServices.helpCenter.getAll({ applyLanguageFilter: false })
    ])
    categories.value = cats || []
    faqs.value = items || []
  } catch {
    toast.error(t('helpCenter.loadError'))
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadData()
})

const filteredFaqs = computed(() => {
  let list = faqs.value

  if (selectedCategoryId.value) {
    list = list.filter(f => f.categoryId === selectedCategoryId.value)
  }

  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    list = list.filter(f =>
      f.titleEn.toLowerCase().includes(q) ||
      f.titleAr.toLowerCase().includes(q) ||
      f.contentEn.toLowerCase().includes(q) ||
      f.contentAr.toLowerCase().includes(q)
    )
  }

  return list
})

const toggleAccordion = (id: string) => {
  if (expandedFaqIds.value.has(id)) {
    expandedFaqIds.value.delete(id)
  } else {
    expandedFaqIds.value.add(id)
  }
}

const getCategoryName = (catId?: string | null) => {
  if (!catId) return null
  const cat = categories.value.find(c => c.id === catId)
  if (!cat) return null
  return isRtl.value ? (cat.titleAr || cat.titleEn) : (cat.titleEn || cat.titleAr)
}

// -------------------------------------------------------------
// Category Management
// -------------------------------------------------------------
const openAddCategoryModal = () => {
  isEditingCategory.value = false
  categoryForm.value = { id: '', titleEn: '', titleAr: '' }
  showCategoryModal.value = true
}

const openEditCategoryModal = (cat: HelpCenterCategoryDto) => {
  isEditingCategory.value = true
  categoryForm.value = {
    id: cat.id,
    titleEn: cat.titleEn,
    titleAr: cat.titleAr
  }
  showCategoryModal.value = true
}

const saveCategory = async () => {
  const { id, titleEn, titleAr } = categoryForm.value
  if (!titleEn.trim() && !titleAr.trim()) {
    toast.error(t('helpCenter.categoryTitleRequired'))
    return
  }

  isSaving.value = true
  try {
    if (isEditingCategory.value) {
      const updated = await coreServices.helpCenter.updateCategory(id, { id, titleEn, titleAr })
      const idx = categories.value.findIndex(c => c.id === id)
      if (idx !== -1) categories.value[idx] = updated
      toast.success(t('helpCenter.categoryUpdated'))
    } else {
      const payload: CreateHelpCenterCategoryPayload = { titleEn, titleAr }
      const created = await coreServices.helpCenter.createCategory(payload)
      categories.value.push(created)
      toast.success(t('helpCenter.categoryCreated'))
    }
    showCategoryModal.value = false
  } catch {
    toast.error(t('helpCenter.categorySaveError'))
  } finally {
    isSaving.value = false
  }
}

const deleteCategory = async (cat: HelpCenterCategoryDto) => {
  const confirmed = await confirm({
    title: t('helpCenter.deleteCategory'),
    message: `${t('helpCenter.deleteCategoryConfirm')} (${isRtl.value ? cat.titleAr || cat.titleEn : cat.titleEn || cat.titleAr})`,
    confirmText: t('common.delete'),
    cancelText: t('common.cancel'),
    type: 'danger'
  })

  if (confirmed) {
    try {
      await coreServices.helpCenter.deleteCategory(cat.id)
      categories.value = categories.value.filter(c => c.id !== cat.id)
      if (selectedCategoryId.value === cat.id) {
        selectedCategoryId.value = null
      }
      toast.success(t('helpCenter.categoryDeleted'))
    } catch {
      toast.error(t('helpCenter.categoryDeleteError'))
    }
  }
}

// -------------------------------------------------------------
// FAQ Items Management
// -------------------------------------------------------------
const openAddFaqModal = () => {
  isEditingFaq.value = false
  const nextOrder = faqs.value.length > 0
    ? Math.max(...faqs.value.map(f => f.displayOrder || 0)) + 1
    : 1
  faqForm.value = {
    id: '',
    titleEn: '',
    titleAr: '',
    contentEn: '',
    contentAr: '',
    categoryId: selectedCategoryId.value || null,
    displayOrder: nextOrder
  }
  showFaqModal.value = true
}

const openEditFaqModal = (item: HelpCenterDto) => {
  isEditingFaq.value = true
  faqForm.value = {
    id: item.id,
    titleEn: item.titleEn,
    titleAr: item.titleAr,
    contentEn: item.contentEn,
    contentAr: item.contentAr,
    categoryId: item.categoryId || null,
    displayOrder: item.displayOrder
  }
  showFaqModal.value = true
}

const saveFaq = async () => {
  const f = faqForm.value
  if (!f.titleEn.trim() && !f.titleAr.trim()) {
    toast.error(t('helpCenter.questionRequired'))
    return
  }
  if (!f.contentEn.trim() && !f.contentAr.trim()) {
    toast.error(t('helpCenter.answerRequired'))
    return
  }

  isSaving.value = true
  try {
    if (isEditingFaq.value) {
      const payload: UpdateHelpCenterPayload = {
        id: f.id,
        titleEn: f.titleEn,
        titleAr: f.titleAr,
        contentEn: f.contentEn,
        contentAr: f.contentAr,
        categoryId: f.categoryId || null,
        displayOrder: f.displayOrder
      }
      const updated = await coreServices.helpCenter.update(f.id, payload)
      const idx = faqs.value.findIndex(item => item.id === f.id)
      if (idx !== -1) faqs.value[idx] = updated
      toast.success(t('helpCenter.faqUpdated'))
    } else {
      const payload: CreateHelpCenterPayload = {
        titleEn: f.titleEn,
        titleAr: f.titleAr,
        contentEn: f.contentEn,
        contentAr: f.contentAr,
        categoryId: f.categoryId || null
      }
      const created = await coreServices.helpCenter.create(payload)
      faqs.value.push(created)
      toast.success(t('helpCenter.faqAdded'))
    }
    showFaqModal.value = false
  } catch {
    toast.error(t('helpCenter.faqSaveError'))
  } finally {
    isSaving.value = false
  }
}

const deleteFaq = async (item: HelpCenterDto) => {
  const confirmed = await confirm({
    title: t('helpCenter.deleteFaq'),
    message: t('helpCenter.deleteFaqConfirm'),
    confirmText: t('common.delete'),
    cancelText: t('common.cancel'),
    type: 'danger'
  })

  if (confirmed) {
    try {
      await coreServices.helpCenter.delete(item.id)
      faqs.value = faqs.value.filter(f => f.id !== item.id)
      toast.success(t('helpCenter.faqDeleted'))
    } catch {
      toast.error(t('helpCenter.faqDeleteError'))
    }
  }
}
</script>

<template>
  <AppShell>
    <div class="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
      <!-- Header -->
      <PageHeader
        :title="t('helpCenter.title')"
        :description="t('helpCenter.subtitle')"
      >
        <template #actions>
          <div class="flex items-center gap-2.5">
            <!-- Mobile Preview Button -->
            <button
              type="button"
              @click="showPreviewModal = true"
              class="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-colors shadow-2xs cursor-pointer"
            >
              <Eye class="w-4 h-4 text-emerald-600" />
              <span>{{ t('helpCenter.mobilePreview') }}</span>
            </button>

            <!-- Add Category Button -->
            <button
              type="button"
              @click="openAddCategoryModal"
              class="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-colors shadow-2xs cursor-pointer"
            >
              <FolderPlus class="w-4 h-4 text-emerald-600" />
              <span>{{ t('helpCenter.addCategory') }}</span>
            </button>

            <!-- Add FAQ Button -->
            <button
              type="button"
              @click="openAddFaqModal"
              class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-sm shadow-emerald-600/20 cursor-pointer"
            >
              <Plus class="w-4 h-4" />
              <span>{{ t('helpCenter.addFaq') }}</span>
            </button>
          </div>
        </template>
      </PageHeader>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
        <RefreshCw class="w-8 h-8 text-emerald-600 animate-spin mb-3" />
        <span class="text-xs font-bold text-slate-500">{{ t('helpCenter.loading') }}</span>
      </div>

      <template v-else>
        <!-- Search and Filter Bar -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <!-- Search Input -->
          <div class="relative flex-1">
            <Search class="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="t('helpCenter.searchPlaceholder')"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl ps-10 pe-4 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
            />
          </div>

          <div class="flex items-center gap-2 text-xs font-bold text-slate-500 shrink-0">
            <span>{{ t('helpCenter.totalQuestions', { count: filteredFaqs.length }) }}</span>
          </div>
        </div>

        <!-- Categories Filter Pills Bar -->
        <div class="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            @click="selectedCategoryId = null"
            :class="[
              'px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5',
              selectedCategoryId === null
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            ]"
          >
            <span>{{ t('helpCenter.allCategories') }}</span>
            <span class="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold" :class="selectedCategoryId === null ? 'bg-emerald-700/60 text-white' : 'bg-slate-100 text-slate-500'">
              {{ faqs.length }}
            </span>
          </button>

          <div
            v-for="cat in categories"
            :key="cat.id"
            class="group/cat flex items-center shrink-0"
          >
            <button
              type="button"
              @click="selectedCategoryId = cat.id"
              :class="[
                'px-3.5 py-2 rounded-s-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                selectedCategoryId === cat.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 border-e-0 hover:bg-slate-50'
              ]"
            >
              <span>{{ isRtl ? (cat.titleAr || cat.titleEn) : (cat.titleEn || cat.titleAr) }}</span>
              <span class="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold" :class="selectedCategoryId === cat.id ? 'bg-emerald-700/60 text-white' : 'bg-slate-100 text-slate-500'">
                {{ faqs.filter(f => f.categoryId === cat.id).length }}
              </span>
            </button>

            <!-- Category actions: Edit & Delete -->
            <div class="flex items-center bg-white border border-slate-200 rounded-e-xl px-1 py-1 gap-0.5">
              <button
                type="button"
                @click.stop="openEditCategoryModal(cat)"
                class="p-1 rounded text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                :title="t('helpCenter.editCategory')"
              >
                <FolderEdit class="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                @click.stop="deleteCategory(cat)"
                class="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                :title="t('helpCenter.deleteCategory')"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <!-- FAQs List -->
        <div v-if="filteredFaqs.length === 0" class="text-center py-16 bg-white rounded-2xl border border-slate-200/80 shadow-2xs text-slate-400 text-xs font-bold">
          {{ t('helpCenter.noFaqsFound') }}
        </div>

        <div v-else class="flex flex-col gap-3">
          <div
            v-for="item in filteredFaqs"
            :key="item.id"
            class="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden transition-colors"
          >
            <!-- Question Bar -->
            <div
              @click="toggleAccordion(item.id)"
              class="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors select-none"
            >
              <div class="flex items-center gap-3.5 min-w-0">
                <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <HelpCircle class="w-4 h-4" />
                </div>

                <div class="min-w-0 flex flex-col gap-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span
                      v-if="getCategoryName(item.categoryId)"
                      class="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded uppercase flex items-center gap-1 shrink-0"
                    >
                      <Tag class="w-3 h-3" />
                      <span>{{ getCategoryName(item.categoryId) }}</span>
                    </span>

                    <span class="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                      #{{ item.displayOrder }}
                    </span>
                  </div>

                  <h4 class="font-bold text-slate-900 text-xs sm:text-sm truncate">
                    {{ isRtl ? (item.titleAr || item.titleEn) : (item.titleEn || item.titleAr) }}
                  </h4>
                </div>
              </div>

              <div class="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  @click.stop="openEditFaqModal(item)"
                  class="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 cursor-pointer transition-colors"
                  :title="t('helpCenter.editFaq')"
                >
                  <Pencil class="w-4 h-4" />
                </button>

                <button
                  type="button"
                  @click.stop="deleteFaq(item)"
                  class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                  :title="t('helpCenter.deleteFaq')"
                >
                  <Trash2 class="w-4 h-4" />
                </button>

                <div class="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                  <ChevronUp v-if="expandedFaqIds.has(item.id)" class="w-4 h-4" />
                  <ChevronDown v-else class="w-4 h-4" />
                </div>
              </div>
            </div>

            <!-- Expanded Details View -->
            <div
              v-if="expandedFaqIds.has(item.id)"
              class="p-4 sm:p-5 pt-0 border-t border-slate-100 bg-slate-50/40 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed"
            >
              <!-- English Version -->
              <div class="flex flex-col gap-2 bg-white p-3.5 rounded-xl border border-slate-100">
                <div class="flex items-center justify-between pb-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  <span>{{ t('helpCenter.englishFaq') }}</span>
                  <span>EN</span>
                </div>
                <div class="font-bold text-slate-900 text-xs">{{ item.titleEn || '—' }}</div>
                <p class="text-slate-600 whitespace-pre-line">{{ item.contentEn || '—' }}</p>
              </div>

              <!-- Arabic Version -->
              <div class="flex flex-col gap-2 bg-white p-3.5 rounded-xl border border-slate-100" dir="rtl">
                <div class="flex items-center justify-between pb-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono text-start">
                  <span>{{ t('helpCenter.arabicFaq') }}</span>
                  <span>AR</span>
                </div>
                <div class="font-bold text-slate-900 text-xs text-start">{{ item.titleAr || '—' }}</div>
                <p class="text-slate-600 whitespace-pre-line text-start">{{ item.contentAr || '—' }}</p>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- FAQ Add/Edit Modal -->
      <div v-if="showFaqModal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="text-sm font-bold text-slate-900">
              {{ isEditingFaq ? t('helpCenter.editFaq') : t('helpCenter.addFaq') }}
            </h3>
            <button
              type="button"
              @click="showFaqModal = false"
              class="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>

          <!-- Category and Display Order -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div class="flex flex-col gap-1">
              <label class="text-xs font-bold text-slate-700">{{ t('helpCenter.category') }}</label>
              <select
                v-model="faqForm.categoryId"
                class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
              >
                <option :value="null">{{ t('helpCenter.selectCategory') }}</option>
                <option v-for="c in categories" :key="c.id" :value="c.id">
                  {{ isRtl ? (c.titleAr || c.titleEn) : (c.titleEn || c.titleAr) }}
                </option>
              </select>
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-xs font-bold text-slate-700">{{ t('helpCenter.displayOrder') }}</label>
              <input
                v-model.number="faqForm.displayOrder"
                type="number"
                min="1"
                class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          <!-- Bilingual Question Titles -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div class="flex flex-col gap-1">
              <label class="text-xs font-bold text-slate-700">{{ t('helpCenter.questionEn') }}</label>
              <input
                v-model="faqForm.titleEn"
                type="text"
                dir="ltr"
                placeholder="e.g. How do I deposit funds via bank transfer?"
                class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>

            <div class="flex flex-col gap-1" dir="rtl">
              <label class="text-xs font-bold text-slate-700 text-start">{{ t('helpCenter.questionAr') }}</label>
              <input
                v-model="faqForm.titleAr"
                type="text"
                dir="rtl"
                placeholder="مثال: كيف يمكنني إيداع الأموال عبر التحويل البنكي؟"
                class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white text-start"
              />
            </div>
          </div>

          <!-- Bilingual Answers -->
          <div class="flex flex-col gap-1">
            <label class="text-xs font-bold text-slate-700">{{ t('helpCenter.answerEn') }}</label>
            <textarea
              v-model="faqForm.contentEn"
              rows="4"
              dir="ltr"
              placeholder="Detailed answer in English..."
              class="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white resize-none leading-relaxed"
            ></textarea>
          </div>

          <div class="flex flex-col gap-1" dir="rtl">
            <label class="text-xs font-bold text-slate-700 text-start">{{ t('helpCenter.answerAr') }}</label>
            <textarea
              v-model="faqForm.contentAr"
              rows="4"
              dir="rtl"
              placeholder="نص الإجابة التفصيلي باللغة العربية..."
              class="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white resize-none text-start leading-relaxed"
            ></textarea>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              @click="showFaqModal = false"
              class="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              type="button"
              @click="saveFaq"
              :disabled="isSaving"
              class="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 transition-colors cursor-pointer shadow-xs"
            >
              {{ t('helpCenter.saveFaq') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Category Add/Edit Modal -->
      <div v-if="showCategoryModal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="text-sm font-bold text-slate-900">
              {{ isEditingCategory ? t('helpCenter.editCategory') : t('helpCenter.addCategory') }}
            </h3>
            <button
              type="button"
              @click="showCategoryModal = false"
              class="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-xs font-bold text-slate-700">{{ t('helpCenter.categoryTitleEn') }}</label>
            <input
              v-model="categoryForm.titleEn"
              type="text"
              dir="ltr"
              placeholder="e.g. Deposit & Withdrawal"
              class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
            />
          </div>

          <div class="flex flex-col gap-1" dir="rtl">
            <label class="text-xs font-bold text-slate-700 text-start">{{ t('helpCenter.categoryTitleAr') }}</label>
            <input
              v-model="categoryForm.titleAr"
              type="text"
              dir="rtl"
              placeholder="مثال: الإيداع والسحب"
              class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white text-start"
            />
          </div>

          <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              @click="showCategoryModal = false"
              class="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              type="button"
              @click="saveCategory"
              :disabled="isSaving"
              class="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 transition-colors cursor-pointer shadow-xs"
            >
              {{ t('helpCenter.saveCategory') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Live Mobile View Modal -->
      <div v-if="showPreviewModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div class="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
            <div class="flex items-center gap-2">
              <Eye class="w-4 h-4 text-emerald-400" />
              <span class="text-xs font-bold">{{ t('helpCenter.mobilePreview') }}</span>
            </div>

            <div class="flex items-center gap-3">
              <div class="flex items-center bg-slate-800 rounded-lg p-0.5 text-[11px] font-bold">
                <button
                  type="button"
                  @click="previewLang = 'ar'"
                  :class="['px-2 py-0.5 rounded cursor-pointer', previewLang === 'ar' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white']"
                >
                  عربي
                </button>
                <button
                  type="button"
                  @click="previewLang = 'en'"
                  :class="['px-2 py-0.5 rounded cursor-pointer', previewLang === 'en' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white']"
                >
                  EN
                </button>
              </div>

              <a
                :href="previewUrl"
                target="_blank"
                rel="noopener"
                class="text-slate-400 hover:text-white"
                title="Open in new window"
              >
                <ExternalLink class="w-4 h-4" />
              </a>

              <button
                type="button"
                @click="showPreviewModal = false"
                class="text-slate-400 hover:text-white text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>

          <!-- Loading state -->
          <div v-if="isPreviewLoading" class="flex-1 flex flex-col items-center justify-center bg-slate-50 gap-3">
            <RefreshCw class="w-8 h-8 text-emerald-600 animate-spin" />
            <span class="text-sm font-medium text-slate-500">{{ t('common.loadingPreview') }}</span>
          </div>

          <!-- Iframe loading the live HTML endpoint via srcdoc -->
          <iframe
            v-else
            :srcdoc="previewHtml"
            class="flex-1 w-full border-none bg-slate-50"
            title="Help Center Mobile View"
          ></iframe>
        </div>
      </div>

    </div>
  </AppShell>
</template>
