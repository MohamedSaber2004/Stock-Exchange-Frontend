<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  FileText,
  Shield,
  Save,
  Plus,
  Trash2,
  ExternalLink,
  RefreshCw,
  Eye,
  Languages,
  ArrowUp,
  ArrowDown
} from 'lucide-vue-next'
import AppShell from '@/components/layout/AppShell.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { useFeedback } from '@/composables/useFeedback'
import { useLivePreview } from '@/composables/useLivePreview'
import { useI18n } from 'vue-i18n'
import { coreServices } from '@/di'
import type { LegalSectionRequest, UpdateLegalDocumentPayload } from '@/domain/models/legal-content.model'

const route = useRoute()
const router = useRouter()
const { toast, confirm } = useFeedback()
const { t, locale } = useI18n()
const isRtl = computed(() => locale.value === 'ar')

// Active Document Tab: 'terms' | 'privacy'
const activeDoc = ref<'terms' | 'privacy'>(
  route.query.tab === 'privacy' ? 'privacy' : 'terms'
)

watch(
  () => route.query.tab,
  (newTab) => {
    activeDoc.value = newTab === 'privacy' ? 'privacy' : 'terms'
  }
)

const setDocTab = (tab: 'terms' | 'privacy') => {
  activeDoc.value = tab
  router.replace({ query: { ...route.query, tab } })
}

// State
const isLoading = ref(true)
const isSaving = ref(false)
const showPreviewModal = ref(false)
const previewLang = ref<'ar' | 'en'>('ar')

// Document state
interface DocFormState {
  id: string
  titleEn: string
  titleAr: string
  descriptionEn: string
  descriptionAr: string
  sections: (LegalSectionRequest & { id?: string; displayOrder?: number })[]
}

const termsDoc = ref<DocFormState>({
  id: '',
  titleEn: '',
  titleAr: '',
  descriptionEn: '',
  descriptionAr: '',
  sections: []
})

const privacyDoc = ref<DocFormState>({
  id: '',
  titleEn: '',
  titleAr: '',
  descriptionEn: '',
  descriptionAr: '',
  sections: []
})

// Current active document
const currentDoc = computed(() => {
  return activeDoc.value === 'terms' ? termsDoc.value : privacyDoc.value
})

// Section Modal State
const showSectionModal = ref(false)
const editingSectionIndex = ref<number | null>(null)
const sectionModalData = ref<{
  id?: string
  titleEn: string
  titleAr: string
  contentEn: string
  contentAr: string
}>({
  titleEn: '',
  titleAr: '',
  contentEn: '',
  contentAr: ''
})

const previewUrl = computed(() => {
  const apiBase = coreServices.httpClient.getBaseUrl().replace(/\/+$/, '')
  const path = activeDoc.value === 'terms' ? 'terms-and-conditions' : 'privacy-policy'
  return `${apiBase}/${path}/view?lang=${previewLang.value}`
})

const { previewHtml, isPreviewLoading, fetchPreviewHtml } = useLivePreview(() => previewUrl.value)

watch([showPreviewModal, previewLang, activeDoc], ([isOpen]) => {
  if (isOpen) {
    fetchPreviewHtml()
  }
})

const loadDocuments = async () => {
  isLoading.value = true
  try {
    const [termsData, privacyData] = await Promise.all([
      coreServices.legal.getTerms(false),
      coreServices.legal.getPrivacy(false)
    ])

    termsDoc.value = {
      id: termsData.id,
      titleEn: termsData.titleEn || '',
      titleAr: termsData.titleAr || '',
      descriptionEn: termsData.descriptionEn || '',
      descriptionAr: termsData.descriptionAr || '',
      sections: (termsData.sections || []).map(s => ({
        id: s.id,
        titleEn: s.titleEn,
        titleAr: s.titleAr,
        contentEn: s.contentEn,
        contentAr: s.contentAr,
        displayOrder: s.displayOrder
      }))
    }

    privacyDoc.value = {
      id: privacyData.id,
      titleEn: privacyData.titleEn || '',
      titleAr: privacyData.titleAr || '',
      descriptionEn: privacyData.descriptionEn || '',
      descriptionAr: privacyData.descriptionAr || '',
      sections: (privacyData.sections || []).map(s => ({
        id: s.id,
        titleEn: s.titleEn,
        titleAr: s.titleAr,
        contentEn: s.contentEn,
        contentAr: s.contentAr,
        displayOrder: s.displayOrder
      }))
    }
  } catch {
    toast.error(t('legal.loadError'))
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadDocuments()
})

const handleSave = async () => {
  isSaving.value = true
  try {
    const doc = currentDoc.value
    const payload: UpdateLegalDocumentPayload = {
      titleEn: doc.titleEn,
      titleAr: doc.titleAr,
      descriptionEn: doc.descriptionEn || null,
      descriptionAr: doc.descriptionAr || null,
      sections: doc.sections.map(s => ({
        titleEn: s.titleEn,
        titleAr: s.titleAr,
        contentEn: s.contentEn,
        contentAr: s.contentAr
      }))
    }

    if (activeDoc.value === 'terms') {
      const updated = await coreServices.legal.updateTerms(payload)
      termsDoc.value.id = updated.id
      toast.success(t('legal.saveSuccess'))
    } else {
      const updated = await coreServices.legal.updatePrivacy(payload)
      privacyDoc.value.id = updated.id
      toast.success(t('legal.saveSuccess'))
    }
  } catch {
    toast.error(t('legal.saveError'))
  } finally {
    isSaving.value = false
  }
}

// Section modal controls
const openAddSectionModal = () => {
  editingSectionIndex.value = null
  sectionModalData.value = {
    titleEn: '',
    titleAr: '',
    contentEn: '',
    contentAr: ''
  }
  showSectionModal.value = true
}

const openEditSectionModal = (index: number) => {
  const s = currentDoc.value.sections[index]
  if (!s) return
  editingSectionIndex.value = index
  sectionModalData.value = {
    id: s.id,
    titleEn: s.titleEn || '',
    titleAr: s.titleAr || '',
    contentEn: s.contentEn || '',
    contentAr: s.contentAr || ''
  }
  showSectionModal.value = true
}

const saveSectionModal = () => {
  const s = sectionModalData.value
  if (!s.titleEn?.trim() && !s.titleAr?.trim()) {
    toast.error(t('legal.sectionTitleRequired'))
    return
  }
  if (!s.contentEn?.trim() && !s.contentAr?.trim()) {
    toast.error(t('legal.sectionContentRequired'))
    return
  }

  if (editingSectionIndex.value !== null) {
    currentDoc.value.sections[editingSectionIndex.value] = { ...s }
    toast.success(t('legal.sectionUpdated'))
  } else {
    currentDoc.value.sections.push({ ...s })
    toast.success(t('legal.sectionAdded'))
  }
  showSectionModal.value = false
}

const removeSection = async (index: number) => {
  const confirmed = await confirm({
    title: t('legal.deleteSection'),
    message: t('legal.deleteSectionConfirm'),
    confirmText: t('common.delete'),
    cancelText: t('common.cancel'),
    type: 'danger'
  })

  if (confirmed) {
    currentDoc.value.sections.splice(index, 1)
    toast.info(t('legal.sectionRemoved'))
  }
}

const moveSection = (index: number, direction: 'up' | 'down') => {
  const list = currentDoc.value.sections
  const targetIndex = direction === 'up' ? index - 1 : index + 1
  if (targetIndex < 0 || targetIndex >= list.length) return
  const itemA = list[index]
  const itemB = list[targetIndex]
  if (!itemA || !itemB) return
  list[index] = itemB
  list[targetIndex] = itemA
}
</script>

<template>
  <AppShell>
    <div class="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
      <!-- Header -->
      <PageHeader
        :title="t('legal.title')"
        :description="t('legal.subtitle')"
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
              <span>{{ t('common.mobilePreview') }}</span>
            </button>

            <!-- Save Button -->
            <button
              type="button"
              @click="handleSave"
              :disabled="isSaving || isLoading"
              class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-60 transition-colors shadow-sm shadow-emerald-600/20 cursor-pointer"
            >
              <RefreshCw v-if="isSaving" class="w-4 h-4 animate-spin" />
              <Save v-else class="w-4 h-4" />
              <span>{{ isSaving ? t('about.saving') : t('legal.saveAndPublish') }}</span>
            </button>
          </div>
        </template>
      </PageHeader>

      <!-- Document Tabs -->
      <div class="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        <button
          type="button"
          @click="setDocTab('terms')"
          :class="[
            'px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 shrink-0',
            activeDoc === 'terms'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          ]"
        >
          <FileText class="w-4 h-4" />
          <span>{{ t('legal.termsTab') }}</span>
        </button>

        <button
          type="button"
          @click="setDocTab('privacy')"
          :class="[
            'px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 shrink-0',
            activeDoc === 'privacy'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          ]"
        >
          <Shield class="w-4 h-4" />
          <span>{{ t('legal.privacyTab') }}</span>
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
        <RefreshCw class="w-8 h-8 text-emerald-600 animate-spin mb-3" />
        <span class="text-xs font-bold text-slate-500">{{ t('legal.loadingDocs') }}</span>
      </div>

      <template v-else>
        <!-- Document Titles & Intro Banner Form -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          
          <!-- English Title & Intro -->
          <div class="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs flex flex-col gap-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider">{{ t('legal.headerIntroEn') }}</h3>
              </div>
              <span class="text-[10px] font-bold text-slate-400 font-mono">EN</span>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">{{ t('legal.docTitleEn') }}</label>
              <input
                v-model="currentDoc.titleEn"
                type="text"
                dir="ltr"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">{{ t('legal.introBannerEn') }}</label>
              <textarea
                v-model="currentDoc.descriptionEn"
                rows="3"
                dir="ltr"
                :placeholder="t('legal.introBannerPlaceholderEn')"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white resize-none font-medium leading-relaxed"
              ></textarea>
            </div>
          </div>

          <!-- Arabic Title & Intro -->
          <div class="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs flex flex-col gap-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider">{{ t('legal.headerIntroAr') }}</h3>
              </div>
              <span class="text-[10px] font-bold text-slate-400 font-mono">AR</span>
            </div>

            <div class="flex flex-col gap-1.5" dir="rtl">
              <label class="text-xs font-bold text-slate-700 text-start">{{ t('legal.docTitleAr') }}</label>
              <input
                v-model="currentDoc.titleAr"
                type="text"
                dir="rtl"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white text-start"
              />
            </div>

            <div class="flex flex-col gap-1.5" dir="rtl">
              <label class="text-xs font-bold text-slate-700 text-start">{{ t('legal.introBannerAr') }}</label>
              <textarea
                v-model="currentDoc.descriptionAr"
                rows="3"
                dir="rtl"
                :placeholder="t('legal.introBannerPlaceholderAr')"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white resize-none font-medium leading-relaxed text-start"
              ></textarea>
            </div>
          </div>

        </div>

        <!-- Sections List Management -->
        <div class="flex flex-col gap-4">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div>
              <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider">
                {{ t('legal.sectionsCount') }} ({{ currentDoc.sections.length }})
              </h3>
              <p class="text-[11px] text-slate-500 font-medium mt-0.5">
                {{ activeDoc === 'terms' ? t('legal.termsDesc') : t('legal.privacyDesc') }}
              </p>
            </div>

            <button
              type="button"
              @click="openAddSectionModal"
              class="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer shrink-0"
            >
              <Plus class="w-4 h-4" />
              <span>{{ t('legal.addSection') }}</span>
            </button>
          </div>

          <!-- Empty State -->
          <div v-if="currentDoc.sections.length === 0" class="text-center py-12 bg-white rounded-2xl border border-slate-200/80 shadow-2xs text-slate-400 text-xs font-bold">
            {{ t('legal.noSections') }}
          </div>

          <!-- Section Cards -->
          <div v-else class="flex flex-col gap-3">
            <div
              v-for="(sec, idx) in currentDoc.sections"
              :key="sec.id || idx"
              class="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex flex-col gap-3 hover:border-slate-300 transition-colors"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-center gap-3">
                  <span class="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    {{ idx + 1 }}
                  </span>
                  <div class="min-w-0">
                    <h4 class="font-bold text-slate-900 text-xs">
                      {{ isRtl ? (sec.titleAr || sec.titleEn) : (sec.titleEn || sec.titleAr) }}
                    </h4>
                    <span class="text-[10px] text-slate-400 font-mono">
                      {{ isRtl ? (sec.titleEn ? `EN: ${sec.titleEn}` : '') : (sec.titleAr ? `AR: ${sec.titleAr}` : '') }}
                    </span>
                  </div>
                </div>

                <div class="flex items-center gap-1 shrink-0">
                  <!-- Reorder buttons -->
                  <button
                    type="button"
                    @click="moveSection(idx, 'up')"
                    :disabled="idx === 0"
                    class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 cursor-pointer transition-colors"
                    :title="t('legal.moveUp')"
                  >
                    <ArrowUp class="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    @click="moveSection(idx, 'down')"
                    :disabled="idx === currentDoc.sections.length - 1"
                    class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 cursor-pointer transition-colors"
                    :title="t('legal.moveDown')"
                  >
                    <ArrowDown class="w-4 h-4" />
                  </button>

                  <!-- Edit -->
                  <button
                    type="button"
                    @click="openEditSectionModal(idx)"
                    class="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 cursor-pointer transition-colors"
                    :title="t('common.edit')"
                  >
                    <Languages class="w-4 h-4" />
                  </button>

                  <!-- Delete -->
                  <button
                    type="button"
                    @click="removeSection(idx)"
                    class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                    :title="t('common.delete')"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </div>

              <!-- Content Preview -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 text-xs leading-relaxed">
                <div>
                  <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{{ t('legal.sectionContentEn') }}</span>
                  <p class="text-slate-700 font-medium whitespace-pre-line">{{ sec.contentEn || '—' }}</p>
                </div>
                <div dir="rtl">
                  <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 text-start">{{ t('legal.sectionContentAr') }}</span>
                  <p class="text-slate-700 font-medium whitespace-pre-line text-start">{{ sec.contentAr || '—' }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Section Add/Edit Modal -->
      <div v-if="showSectionModal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="text-sm font-bold text-slate-900">
              {{ editingSectionIndex !== null ? t('legal.editSection') : t('legal.addSection') }}
            </h3>
            <button
              type="button"
              @click="showSectionModal = false"
              class="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div class="flex flex-col gap-1">
              <label class="text-xs font-bold text-slate-700">{{ t('legal.sectionTitleEn') }}</label>
              <input
                v-model="sectionModalData.titleEn"
                type="text"
                dir="ltr"
                placeholder="e.g. Account Responsibilities"
                class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>

            <div class="flex flex-col gap-1" dir="rtl">
              <label class="text-xs font-bold text-slate-700 text-start">{{ t('legal.sectionTitleAr') }}</label>
              <input
                v-model="sectionModalData.titleAr"
                type="text"
                dir="rtl"
                placeholder="مثال: مسؤوليات الحساب"
                class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white text-start"
              />
            </div>
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-xs font-bold text-slate-700">{{ t('legal.sectionContentEn') }}</label>
            <textarea
              v-model="sectionModalData.contentEn"
              rows="4"
              dir="ltr"
              placeholder="Full text of clause in English..."
              class="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white resize-none"
            ></textarea>
          </div>

          <div class="flex flex-col gap-1" dir="rtl">
            <label class="text-xs font-bold text-slate-700 text-start">{{ t('legal.sectionContentAr') }}</label>
            <textarea
              v-model="sectionModalData.contentAr"
              rows="4"
              dir="rtl"
              placeholder="نص البند الكامل باللغة العربية..."
              class="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white resize-none text-start"
            ></textarea>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              @click="showSectionModal = false"
              class="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              type="button"
              @click="saveSectionModal"
              class="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors cursor-pointer shadow-xs"
            >
              {{ t('legal.saveSection') }}
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
              <span class="text-xs font-bold">
                {{ activeDoc === 'terms' ? t('legal.termsTab') : t('legal.privacyTab') }}
              </span>
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
            title="Legal Mobile View"
          ></iframe>
        </div>
      </div>

    </div>
  </AppShell>
</template>
