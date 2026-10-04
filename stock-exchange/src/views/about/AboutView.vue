<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import {
  Building2,
  Sparkles,
  Save,
  Plus,
  Trash2,
  ExternalLink,
  Mail,
  RefreshCw,
  Eye,
  CheckCircle2,
  Languages
} from 'lucide-vue-next'
import AppShell from '@/components/layout/AppShell.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { useFeedback } from '@/composables/useFeedback'
import { useI18n } from 'vue-i18n'
import { coreServices } from '@/di'
import type { AboutUsFeatureRequest, UpdateAboutUsPayload } from '@/domain/models/about-us.model'

const { toast, confirm } = useFeedback()
const { t, locale } = useI18n()
const isRtl = computed(() => locale.value === 'ar')

// State
const isLoading = ref(true)
const isSaving = ref(false)
const activeTab = ref<'content' | 'features'>('content')
const showPreviewModal = ref(false)
const previewLang = ref<'ar' | 'en'>('ar')

// Form data
const form = ref({
  id: '',
  storyEn: '',
  storyAr: '',
  missionEn: '',
  missionAr: '',
  visionEn: '',
  visionAr: '',
  supportEmail: ''
})

interface EditableFeature extends AboutUsFeatureRequest {
  id?: string
  displayOrder?: number
}

const features = ref<EditableFeature[]>([])

// New feature modal / form
const showAddFeatureModal = ref(false)
const editingFeatureIndex = ref<number | null>(null)
const featureModalData = ref<EditableFeature>({
  titleEn: '',
  titleAr: '',
  descriptionEn: '',
  descriptionAr: '',
  category: ''
})

import { useLivePreview } from '@/composables'

const previewUrl = computed(() => {
  const apiBase = coreServices.httpClient.getBaseUrl().replace(/\/+$/, '')
  return `${apiBase}/about-us/view?lang=${previewLang.value}`
})

const { previewHtml, isPreviewLoading, fetchPreviewHtml } = useLivePreview(() => previewUrl.value)

watch([showPreviewModal, previewLang], ([isOpen]) => {
  if (isOpen) {
    fetchPreviewHtml()
  }
})

const loadAboutUs = async () => {
  isLoading.value = true
  try {
    const data = await coreServices.aboutUs.get(false)
    form.value = {
      id: data.id,
      storyEn: data.storyEn || '',
      storyAr: data.storyAr || '',
      missionEn: data.missionEn || '',
      missionAr: data.missionAr || '',
      visionEn: data.visionEn || '',
      visionAr: data.visionAr || '',
      supportEmail: data.supportEmail || ''
    }
    features.value = (data.features || []).map(f => ({
      id: f.id,
      titleEn: f.titleEn,
      titleAr: f.titleAr,
      descriptionEn: f.descriptionEn,
      descriptionAr: f.descriptionAr,
      category: f.category,
      displayOrder: f.displayOrder
    }))
  } catch {
    toast.error(t('about.loadError'))
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadAboutUs()
})

const handleSave = async () => {
  isSaving.value = true
  try {
    const payload: UpdateAboutUsPayload = {
      storyEn: form.value.storyEn,
      storyAr: form.value.storyAr,
      missionEn: form.value.missionEn,
      missionAr: form.value.missionAr,
      visionEn: form.value.visionEn,
      visionAr: form.value.visionAr,
      supportEmail: form.value.supportEmail || null,
      features: features.value.map(f => ({
        titleEn: f.titleEn,
        titleAr: f.titleAr,
        descriptionEn: f.descriptionEn,
        descriptionAr: f.descriptionAr,
        category: f.category
      }))
    }

    const updated = await coreServices.aboutUs.update(payload)
    form.value.id = updated.id
    toast.success(t('about.saveSuccess'))
  } catch {
    toast.error(t('about.saveError'))
  } finally {
    isSaving.value = false
  }
}

const openAddFeatureModal = () => {
  editingFeatureIndex.value = null
  featureModalData.value = {
    titleEn: '',
    titleAr: '',
    descriptionEn: '',
    descriptionAr: '',
    category: ''
  }
  showAddFeatureModal.value = true
}

const openEditFeatureModal = (index: number) => {
  const target = features.value[index]
  if (!target) return
  editingFeatureIndex.value = index
  featureModalData.value = {
    id: target.id,
    titleEn: target.titleEn || '',
    titleAr: target.titleAr || '',
    descriptionEn: target.descriptionEn || '',
    descriptionAr: target.descriptionAr || '',
    category: target.category || ''
  }
  showAddFeatureModal.value = true
}

const saveFeatureModal = () => {
  const f = featureModalData.value
  if (!f.titleEn?.trim() && !f.titleAr?.trim()) {
    toast.error(t('about.featureTitleRequired'))
    return
  }
  if (!f.descriptionEn?.trim() && !f.descriptionAr?.trim()) {
    toast.error(t('about.featureDescRequired'))
    return
  }

  if (editingFeatureIndex.value !== null) {
    features.value[editingFeatureIndex.value] = { ...f }
    toast.success(t('about.featureUpdated'))
  } else {
    features.value.push({ ...f })
    toast.success(t('about.featureAdded'))
  }
  showAddFeatureModal.value = false
}

const removeFeature = async (index: number) => {
  const confirmed = await confirm({
    title: t('about.deleteFeature'),
    message: t('about.deleteFeatureConfirm'),
    confirmText: t('common.delete'),
    cancelText: t('common.cancel'),
    type: 'danger'
  })

  if (confirmed) {
    features.value.splice(index, 1)
    toast.info(t('about.featureRemoved'))
  }
}
</script>

<template>
  <AppShell>
    <div class="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
      <!-- Header -->
      <PageHeader
        :title="t('about.title')"
        :description="t('about.subtitle')"
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
              <span>{{ isSaving ? t('about.saving') : t('about.saveChanges') }}</span>
            </button>
          </div>
        </template>
      </PageHeader>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
        <RefreshCw class="w-8 h-8 text-emerald-600 animate-spin mb-3" />
        <span class="text-xs font-bold text-slate-500">{{ t('about.loading') }}</span>
      </div>

      <template v-else>
        <!-- Document Tabs -->
        <div class="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
          <button
            type="button"
            @click="activeTab = 'content'"
            :class="[
              'px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 shrink-0',
              activeTab === 'content'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            ]"
          >
            <Building2 class="w-4 h-4" />
            <span>{{ t('about.storyMissionVision') }}</span>
          </button>

          <button
            type="button"
            @click="activeTab = 'features'"
            :class="[
              'px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 shrink-0',
              activeTab === 'features'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            ]"
          >
            <Sparkles class="w-4 h-4" />
            <span>{{ t('about.coreFeatures') }} ({{ features.length }})</span>
          </button>
        </div>

        <!-- TAB 1: STORY, MISSION, VISION & CONTACT -->
        <div v-if="activeTab === 'content'" class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          
          <!-- English Column -->
          <div class="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs flex flex-col gap-5">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider">{{ t('about.englishContent') }}</h3>
              </div>
              <span class="text-[10px] font-bold text-slate-400 font-mono">EN</span>
            </div>

            <!-- Story EN -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">{{ t('about.ourStoryEn') }}</label>
              <textarea
                v-model="form.storyEn"
                rows="4"
                dir="ltr"
                :placeholder="t('about.storyPlaceholderEn')"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white resize-none font-medium leading-relaxed"
              ></textarea>
            </div>

            <!-- Mission EN -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">{{ t('about.ourMissionEn') }}</label>
              <textarea
                v-model="form.missionEn"
                rows="3"
                dir="ltr"
                :placeholder="t('about.missionPlaceholderEn')"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white resize-none font-medium leading-relaxed"
              ></textarea>
            </div>

            <!-- Vision EN -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">{{ t('about.ourVisionEn') }}</label>
              <textarea
                v-model="form.visionEn"
                rows="3"
                dir="ltr"
                :placeholder="t('about.visionPlaceholderEn')"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white resize-none font-medium leading-relaxed"
              ></textarea>
            </div>
          </div>

          <!-- Arabic Column -->
          <div class="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs flex flex-col gap-5">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider">{{ t('about.arabicContent') }}</h3>
              </div>
              <span class="text-[10px] font-bold text-slate-400 font-mono">AR</span>
            </div>

            <!-- Story AR -->
            <div class="flex flex-col gap-1.5" dir="rtl">
              <label class="text-xs font-bold text-slate-700 text-start">{{ t('about.ourStoryAr') }}</label>
              <textarea
                v-model="form.storyAr"
                rows="4"
                dir="rtl"
                :placeholder="t('about.storyPlaceholderAr')"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white resize-none font-medium leading-relaxed text-start"
              ></textarea>
            </div>

            <!-- Mission AR -->
            <div class="flex flex-col gap-1.5" dir="rtl">
              <label class="text-xs font-bold text-slate-700 text-start">{{ t('about.ourMissionAr') }}</label>
              <textarea
                v-model="form.missionAr"
                rows="3"
                dir="rtl"
                :placeholder="t('about.missionPlaceholderAr')"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white resize-none font-medium leading-relaxed text-start"
              ></textarea>
            </div>

            <!-- Vision AR -->
            <div class="flex flex-col gap-1.5" dir="rtl">
              <label class="text-xs font-bold text-slate-700 text-start">{{ t('about.ourVisionAr') }}</label>
              <textarea
                v-model="form.visionAr"
                rows="3"
                dir="rtl"
                :placeholder="t('about.visionPlaceholderAr')"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white resize-none font-medium leading-relaxed text-start"
              ></textarea>
            </div>
          </div>

          <!-- Bottom: Support Email Card across full width -->
          <div class="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div class="flex items-center gap-3.5">
              <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Mail class="w-5 h-5" />
              </div>
              <div>
                <h4 class="text-xs font-bold text-slate-900">{{ t('about.supportEmail') }}</h4>
                <p class="text-[11px] text-slate-500 font-medium">{{ t('about.supportEmailDesc') }}</p>
              </div>
            </div>

            <div class="w-full sm:w-80">
              <input
                v-model="form.supportEmail"
                type="email"
                dir="ltr"
                :placeholder="t('about.supportEmailPlaceholder')"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>
          </div>

        </div>

        <!-- TAB 2: FEATURES & PILLARS -->
        <div v-else-if="activeTab === 'features'" class="flex flex-col gap-6">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div>
              <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider">{{ t('about.coreFeatures') }}</h3>
              <p class="text-[11px] text-slate-500 font-medium mt-0.5">{{ t('about.coreFeaturesDesc') }}</p>
            </div>

            <button
              type="button"
              @click="openAddFeatureModal"
              class="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer shrink-0"
            >
              <Plus class="w-4 h-4" />
              <span>{{ t('about.addFeature') }}</span>
            </button>
          </div>

          <!-- Feature Cards Grid -->
          <div v-if="features.length === 0" class="text-center py-12 bg-white rounded-2xl border border-slate-200/80 shadow-2xs text-slate-400 text-xs font-bold">
            {{ t('about.noFeatures') }}
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="(feat, index) in features"
              :key="feat.id || index"
              class="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between gap-4 hover:border-slate-300 transition-colors group"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-start gap-3">
                  <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 class="w-4 h-4" />
                  </div>
                  <div class="min-w-0">
                    <span v-if="feat.category" class="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded uppercase">
                      {{ feat.category }}
                    </span>
                    <h4 class="font-bold text-slate-900 text-xs mt-1">{{ isRtl ? (feat.titleAr || feat.titleEn) : (feat.titleEn || feat.titleAr) }}</h4>
                    <p class="text-xs text-slate-500 mt-1 leading-relaxed">{{ isRtl ? (feat.descriptionAr || feat.descriptionEn) : (feat.descriptionEn || feat.descriptionAr) }}</p>
                  </div>
                </div>

                <div class="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    @click="openEditFeatureModal(index)"
                    class="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 cursor-pointer transition-colors"
                    title="Edit"
                  >
                    <Languages class="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    @click="removeFeature(index)"
                    class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                    title="Delete"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </div>

              <!-- Bilingual Indicator footer -->
              <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>EN: {{ feat.titleEn || '—' }}</span>
                <span dir="rtl">AR: {{ feat.titleAr || '—' }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Add/Edit Feature Modal -->
      <div v-if="showAddFeatureModal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="text-sm font-bold text-slate-900">
              {{ editingFeatureIndex !== null ? t('about.editFeature') : t('about.addFeature') }}
            </h3>
            <button
              type="button"
              @click="showAddFeatureModal = false"
              class="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div class="flex flex-col gap-1">
              <label class="text-xs font-bold text-slate-700">{{ t('about.featureTitleEn') }}</label>
              <input
                v-model="featureModalData.titleEn"
                type="text"
                dir="ltr"
                placeholder="e.g. Ultra-Fast Execution"
                class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>

            <div class="flex flex-col gap-1" dir="rtl">
              <label class="text-xs font-bold text-slate-700 text-start">{{ t('about.featureTitleAr') }}</label>
              <input
                v-model="featureModalData.titleAr"
                type="text"
                dir="rtl"
                placeholder="مثال: تنفيذ فائق السرعة"
                class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white text-start"
              />
            </div>
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-xs font-bold text-slate-700">{{ t('about.featureDescEn') }}</label>
            <textarea
              v-model="featureModalData.descriptionEn"
              rows="2"
              dir="ltr"
              placeholder="Detailed explanation in English..."
              class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white resize-none"
            ></textarea>
          </div>

          <div class="flex flex-col gap-1" dir="rtl">
            <label class="text-xs font-bold text-slate-700 text-start">{{ t('about.featureDescAr') }}</label>
            <textarea
              v-model="featureModalData.descriptionAr"
              rows="2"
              dir="rtl"
              placeholder="شرح تفصيلي للميزة بالعربية..."
              class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white resize-none text-start"
            ></textarea>
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-xs font-bold text-slate-700">{{ t('about.featureCategory') }}</label>
            <input
              v-model="featureModalData.category"
              type="text"
              :placeholder="t('about.categoryPlaceholder')"
              class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
            />
          </div>

          <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              @click="showAddFeatureModal = false"
              class="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              type="button"
              @click="saveFeatureModal"
              class="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors cursor-pointer shadow-xs"
            >
              {{ t('about.saveFeature') }}
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
              <span class="text-xs font-bold">{{ t('common.mobilePreview') }}</span>
            </div>

            <div class="flex items-center gap-3">
              <!-- Lang switch -->
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

              <!-- Open in new tab -->
              <a
                :href="previewUrl"
                target="_blank"
                rel="noopener"
                class="text-slate-400 hover:text-white"
                title="Open in new window"
              >
                <ExternalLink class="w-4 h-4" />
              </a>

              <!-- Close -->
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
            title="About Us Mobile View"
          ></iframe>
        </div>
      </div>

    </div>
  </AppShell>
</template>
