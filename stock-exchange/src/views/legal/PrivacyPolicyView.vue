<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import {
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

const { toast, confirm } = useFeedback()
const { t, locale } = useI18n()
const isRtl = computed(() => locale.value === 'ar')

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

const privacyDoc = ref<DocFormState>({
  id: '',
  titleEn: '',
  titleAr: '',
  descriptionEn: '',
  descriptionAr: '',
  sections: []
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
  return `${apiBase}/privacy-policy/view?lang=${previewLang.value}`
})

const { previewHtml, isPreviewLoading, fetchPreviewHtml } = useLivePreview(() => previewUrl.value)

watch([showPreviewModal, previewLang], ([isOpen]) => {
  if (isOpen) {
    fetchPreviewHtml()
  }
})

const loadDocument = async () => {
  isLoading.value = true
  try {
    const privacyData = await coreServices.legal.getPrivacy(false)
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
  loadDocument()
})

const handleSave = async () => {
  isSaving.value = true
  try {
    const doc = privacyDoc.value
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

    const updated = await coreServices.legal.updatePrivacy(payload)
    privacyDoc.value.id = updated.id
    toast.success(t('legal.saveSuccess'))
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
  const s = privacyDoc.value.sections[index]
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
    privacyDoc.value.sections[editingSectionIndex.value] = { ...s }
    toast.success(t('legal.sectionUpdated'))
  } else {
    privacyDoc.value.sections.push({ ...s })
    toast.success(t('legal.sectionAdded'))
  }
  showSectionModal.value = false
}

const removeSection = async (index: number) => {
  const confirmed = await confirm({
    title: t('legal.deleteSection'),
    message: t('legal.deleteSectionConfirm'),
    type: 'danger'
  })
  if (confirmed) {
    privacyDoc.value.sections.splice(index, 1)
    toast.success(t('legal.sectionRemoved'))
  }
}

const moveSection = (index: number, direction: 'up' | 'down') => {
  const sections = privacyDoc.value.sections
  const targetIndex = direction === 'up' ? index - 1 : index + 1
  if (targetIndex < 0 || targetIndex >= sections.length) return
  const current = sections[index]
  const target = sections[targetIndex]
  if (!current || !target) return
  sections[index] = target
  sections[targetIndex] = current
}
</script>

<template>
  <AppShell>
    <div class="space-y-6">
      <!-- Page Header -->
      <PageHeader
        :title="t('legal.privacyTitle')"
        :description="t('legal.privacySubtitle')"
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
                v-model="privacyDoc.titleEn"
                type="text"
                dir="ltr"
                placeholder="Privacy Policy"
                class="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-900"
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">{{ t('legal.introBannerEn') }}</label>
              <textarea
                v-model="privacyDoc.descriptionEn"
                rows="3"
                dir="ltr"
                :placeholder="t('legal.introBannerPlaceholderEn')"
                class="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-900 resize-y"
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

            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">{{ t('legal.docTitleAr') }}</label>
              <input
                v-model="privacyDoc.titleAr"
                type="text"
                dir="rtl"
                placeholder="سياسة الخصوصية"
                class="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-900"
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">{{ t('legal.introBannerAr') }}</label>
              <textarea
                v-model="privacyDoc.descriptionAr"
                rows="3"
                dir="rtl"
                :placeholder="t('legal.introBannerPlaceholderAr')"
                class="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-900 resize-y"
              ></textarea>
            </div>
          </div>

        </div>

        <!-- Sections & Clauses Management -->
        <div class="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs flex flex-col gap-5">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-sm font-bold text-slate-900">{{ t('legal.sectionsCount') }}</h3>
                <span class="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                  {{ privacyDoc.sections.length }}
                </span>
              </div>
              <p class="text-xs text-slate-500 mt-1">
                {{ t('legal.privacyDesc') }}
              </p>
            </div>

            <button
              type="button"
              @click="openAddSectionModal"
              class="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 transition-colors shrink-0 cursor-pointer"
            >
              <Plus class="w-4 h-4" />
              <span>{{ t('legal.addSection') }}</span>
            </button>
          </div>

          <!-- Clauses List -->
          <div v-if="privacyDoc.sections.length === 0" class="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl">
            <Shield class="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p class="text-xs font-bold text-slate-500">{{ t('legal.noSections') }}</p>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="(section, index) in privacyDoc.sections"
              :key="section.id || index"
              class="group p-4 rounded-xl border border-slate-200/80 hover:border-slate-300 bg-slate-50/50 hover:bg-white transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4"
            >
              <!-- Section Details -->
              <div class="flex items-start gap-3 flex-1 min-w-0">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 mt-2" />
                
                <div class="flex-1 min-w-0 space-y-1">
                  <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span v-if="section.titleAr" class="text-xs font-bold text-slate-900" dir="rtl">
                      {{ section.titleAr }}
                    </span>
                    <span v-if="section.titleAr && section.titleEn" class="text-slate-300 text-xs">/</span>
                    <span v-if="section.titleEn" class="text-xs font-medium text-slate-600" dir="ltr">
                      {{ section.titleEn }}
                    </span>
                  </div>

                  <p v-if="section.contentAr" class="text-xs text-slate-500 line-clamp-2" dir="rtl">
                    {{ section.contentAr }}
                  </p>
                  <p v-if="section.contentEn" class="text-xs text-slate-500 line-clamp-2" dir="ltr">
                    {{ section.contentEn }}
                  </p>
                </div>
              </div>

              <!-- Controls -->
              <div class="flex items-center gap-1 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  @click="moveSection(index, 'up')"
                  :disabled="index === 0"
                  class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  :title="t('legal.moveUp')"
                >
                  <ArrowUp class="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  @click="moveSection(index, 'down')"
                  :disabled="index === privacyDoc.sections.length - 1"
                  class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  :title="t('legal.moveDown')"
                >
                  <ArrowDown class="w-3.5 h-3.5" />
                </button>
                <div class="w-px h-3.5 bg-slate-200 mx-1" />
                <button
                  type="button"
                  @click="openEditSectionModal(index)"
                  class="px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
                >
                  {{ t('common.edit') }}
                </button>
                <button
                  type="button"
                  @click="removeSection(index)"
                  class="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                  :title="t('common.delete')"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Section Edit/Create Modal -->
    <Teleport to="body">
      <div
        v-if="showSectionModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs"
      >
        <div class="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="text-sm font-bold text-slate-900">
              {{ editingSectionIndex !== null ? t('legal.editSection') : t('legal.addSection') }}
            </h3>
            <button
              type="button"
              @click="showSectionModal = false"
              class="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              ✕
            </button>
          </div>

          <div class="space-y-4">
            <!-- Titles -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold text-slate-700">{{ t('legal.sectionTitleAr') }}</label>
                <input
                  v-model="sectionModalData.titleAr"
                  type="text"
                  dir="rtl"
                  placeholder="عنوان البند بالعربية"
                  class="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold text-slate-700">{{ t('legal.sectionTitleEn') }}</label>
                <input
                  v-model="sectionModalData.titleEn"
                  type="text"
                  dir="ltr"
                  placeholder="Clause Title in English"
                  class="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>
            </div>

            <!-- Arabic Content -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">{{ t('legal.sectionContentAr') }}</label>
              <textarea
                v-model="sectionModalData.contentAr"
                rows="4"
                dir="rtl"
                placeholder="نص البند بالعربية..."
                class="text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 focus:bg-white resize-y"
              ></textarea>
            </div>

            <!-- English Content -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">{{ t('legal.sectionContentEn') }}</label>
              <textarea
                v-model="sectionModalData.contentEn"
                rows="4"
                dir="ltr"
                placeholder="Clause text in English..."
                class="text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 focus:bg-white resize-y"
              ></textarea>
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              @click="showSectionModal = false"
              class="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              type="button"
              @click="saveSectionModal"
              class="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700"
            >
              {{ t('legal.saveSection') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Mobile Device Preview Modal -->
    <Teleport to="body">
      <div
        v-if="showPreviewModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
        @click.self="showPreviewModal = false"
      >
        <div class="relative bg-slate-900 p-4 rounded-[44px] shadow-2xl border-4 border-slate-800 max-w-[390px] w-full flex flex-col items-center">
          
          <!-- Top Bar with Close & Language Switch -->
          <div class="w-full flex items-center justify-between px-3 py-2 text-white text-xs mb-2">
            <div class="flex items-center gap-1.5">
              <Languages class="w-3.5 h-3.5 text-emerald-400" />
              <button
                type="button"
                @click="previewLang = previewLang === 'ar' ? 'en' : 'ar'"
                class="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 font-mono text-[11px] font-bold uppercase transition-colors"
              >
                {{ previewLang }}
              </button>
            </div>

            <div class="flex items-center gap-2">
              <a
                :href="previewUrl"
                target="_blank"
                class="p-1 text-slate-400 hover:text-white"
                :title="t('common.preview')"
              >
                <ExternalLink class="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                @click="showPreviewModal = false"
                class="p-1 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>

          <!-- Phone Screen Container -->
          <div class="w-full h-[620px] bg-slate-50 rounded-[32px] overflow-hidden relative shadow-inner flex flex-col">
            <!-- Loading Indicator -->
            <div
              v-if="isPreviewLoading"
              class="absolute inset-0 bg-white/80 backdrop-blur-2xs flex flex-col items-center justify-center gap-2 z-10"
            >
              <RefreshCw class="w-6 h-6 text-emerald-600 animate-spin" />
              <span class="text-xs font-bold text-slate-500">{{ t('common.loadingPreview') }}</span>
            </div>

            <!-- Self-contained HTML Renderer iframe -->
            <iframe
              :srcdoc="previewHtml"
              class="w-full h-full border-0 bg-white"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>

          <!-- Phone Bottom Home Bar -->
          <div class="w-32 h-1 bg-slate-700 rounded-full mt-3.5 mb-1" />
        </div>
      </div>
    </Teleport>
  </AppShell>
</template>
