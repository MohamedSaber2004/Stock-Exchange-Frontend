<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { 
  ShieldCheck, 
  Search, 
  RotateCcw, 
  Check, 
  CreditCard, 
  Newspaper, 
  FileText, 
  Video, 
  Sliders,
  Sparkles
} from 'lucide-vue-next'
import AppShell from '@/components/layout/AppShell.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { useFeedback } from '@/composables/useFeedback'
import { useI18n } from 'vue-i18n'
import { usePlanPermissions, type PlanTier, type FeatureCategory } from '@/composables/usePlanPermissions'

const router = useRouter()
const { toast, confirm } = useFeedback()
const { t, locale } = useI18n()

const isAr = computed(() => locale.value === 'ar')

const {
  permissions,
  groupedPermissions,
  planFeatureCounts,
  togglePermission,
  setPermission,
  resetToDefault,
} = usePlanPermissions()

const searchQuery = ref('')
const selectedCategory = ref<string>('all')

const categoryIcons: Record<FeatureCategory, any> = {
  news: Newspaper,
  articles: FileText,
  videos: Video
}

// Filtered groups based on search and category tab
const filteredGroups = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return groupedPermissions.value
    .filter(g => selectedCategory.value === 'all' || g.category === selectedCategory.value)
    .map(g => {
      const matchingFeatures = g.features.filter(f => {
        if (!query) return true
        return (
          f.name.toLowerCase().includes(query) ||
          f.nameAr.includes(query) ||
          f.description.toLowerCase().includes(query) ||
          f.descriptionAr.includes(query)
        )
      })
      return {
        ...g,
        features: matchingFeatures
      }
    })
    .filter(g => g.features.length > 0)
})

const handleToggle = (featureId: string, plan: PlanTier, featureName: string) => {
  togglePermission(featureId, plan)
  toast.success(
    isAr.value
      ? `تم تحديث صلاحية (${featureName}) لخطة ${plan} وتحديث صفحة خطط الاشتراك فوراً`
      : `Updated (${featureName}) for ${plan} plan. Synced with Subscription Plans!`
  )
}

const handleReset = async () => {
  const confirmed = await confirm({
    title: isAr.value ? 'استعادة الإعدادات الافتراضية' : 'Reset to Default Permissions',
    message: isAr.value
      ? 'هل أنت متأكد من رغبتك في استعادة مصفوفة الصلاحيات الافتراضية لجميع الخطط؟'
      : 'Are you sure you want to reset feature permissions for all subscription plans to factory defaults?',
    confirmText: isAr.value ? 'استعادة' : 'Reset',
    cancelText: t('common.cancel'),
    type: 'warning'
  })

  if (confirmed) {
    resetToDefault()
    toast.info(
      isAr.value
        ? 'تمت استعادة الصلاحيات الافتراضية ومزامنتها مع خطط الاشتراكات'
        : 'Permissions reset to defaults and synced with Subscription Plans'
    )
  }
}

// Bulk enable/disable for a specific category and plan
const toggleAllInCategory = (category: FeatureCategory, plan: PlanTier, enable: boolean) => {
  const targetGroup = groupedPermissions.value.find(g => g.category === category)
  if (targetGroup) {
    targetGroup.features.forEach(f => {
      setPermission(f.id, plan, enable)
    })
    toast.success(
      isAr.value
        ? `تم تحديث كافة صلاحيات قسم (${targetGroup.nameAr}) لخطة ${plan}`
        : `Updated all (${targetGroup.name}) features for ${plan} plan`
    )
  }
}
</script>

<template>
  <AppShell>
    <div class="flex flex-col max-w-7xl mx-auto space-y-6">
      <!-- Page Header with Navigation Button to Subscription Plans -->
      <PageHeader
        :title="isAr ? 'إدارة صلاحيات وميزات الخطط' : 'Plan Features & Permissions Matrix'"
        :description="isAr ? 'التحكم الدقيق في الميزات والصلاحيات المتاحة لكل خطة اشتراك (المجانية، الأساسية، والاحترافية). التعديلات تسمع فوراً في صفحة خطط الاشتراكات.' : 'Configure feature availability and permissions across Free, Basic, and Pro subscription tiers. Changes sync instantly with the Subscription Plans page.'"
      >
        <template #actions>
          <div class="flex items-center gap-2.5">
            <button
              type="button"
              @click="handleReset"
              class="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-2xs"
            >
              <RotateCcw class="w-3.5 h-3.5 text-slate-400" />
              <span>{{ isAr ? 'استعادة الافتراضي' : 'Reset Defaults' }}</span>
            </button>

            <button
              type="button"
              @click="router.push('/subscriptions')"
              class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <CreditCard class="w-4 h-4" />
              <span>{{ isAr ? 'عرض خطط الاشتراكات' : 'View Subscription Plans' }}</span>
            </button>
          </div>
        </template>
      </PageHeader>

      <!-- Sync Banner Indicator -->
      <div class="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs shrink-0">
            <Sparkles class="w-5 h-5" />
          </div>
          <div>
            <h4 class="text-xs font-bold text-slate-900">
              {{ isAr ? 'مزامنة حية وتلقائية مع خطط الاشتراكات' : 'Real-Time Sync with Subscription Plans' }}
            </h4>
            <p class="text-[11px] text-slate-500">
              {{ isAr ? 'أي تفعيل أو إلغاء تفعيل لأي ميزة هنا يظهر فوراً في بطاقة الخطة المقابلة داخل صفحة خطط الاشتراكات.' : 'Any toggle state change here updates the active features shown on user subscription tier cards immediately.' }}
            </p>
          </div>
        </div>

        <!-- Plan Feature Counters -->
        <div class="flex items-center gap-2 shrink-0">
          <div class="px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-2">
            <span class="text-[11px] font-bold text-slate-600">{{ isAr ? 'مجانية' : 'FREE' }}:</span>
            <span class="text-xs font-black text-slate-900">{{ planFeatureCounts.FREE }}</span>
          </div>
          <div class="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 shadow-2xs flex items-center gap-2">
            <span class="text-[11px] font-bold text-emerald-800">{{ isAr ? 'أساسية' : 'BASIC' }}:</span>
            <span class="text-xs font-black text-emerald-700">{{ planFeatureCounts.BASIC }}</span>
          </div>
          <div class="px-3 py-1.5 rounded-xl bg-emerald-600 text-white shadow-2xs flex items-center gap-2">
            <span class="text-[11px] font-bold text-emerald-100">{{ isAr ? 'احترافية' : 'PRO' }}:</span>
            <span class="text-xs font-black text-white">{{ planFeatureCounts.PRO }}</span>
          </div>
        </div>
      </div>

      <!-- Filters & Category Navigation -->
      <div class="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <!-- Search bar -->
        <div class="relative flex-1 max-w-md">
          <Search class="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="isAr ? 'ابحث في الميزات، الصلاحيات، والخدمات...' : 'Search features, capabilities, or keywords...'"
            class="w-full bg-slate-50 border border-slate-200 rounded-xl ps-10 pe-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 font-medium"
          />
        </div>

        <!-- Category Tabs -->
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            @click="selectedCategory = 'all'"
            :class="[
              'px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer',
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            ]"
          >
            {{ isAr ? 'كافة الأقسام' : 'All Modules' }}
          </button>
          <button
            v-for="cat in (['news', 'articles', 'videos'] as FeatureCategory[])"
            :key="cat"
            type="button"
            @click="selectedCategory = cat"
            :class="[
              'px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5',
              selectedCategory === cat
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            ]"
          >
            <component :is="categoryIcons[cat]" class="w-3.5 h-3.5" />
            <span>
              {{
                cat === 'news' ? (isAr ? 'أخبار السوق' : 'Market News') :
                cat === 'articles' ? (isAr ? 'المقالات' : 'Articles') :
                (isAr ? 'الفيديوهات' : 'Videos')
              }}
            </span>
          </button>
        </div>
      </div>

      <!-- Permissions Matrix Table -->
      <div class="space-y-6">
        <div
          v-for="group in filteredGroups"
          :key="group.category"
          class="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden"
        >
          <!-- Category Header Banner -->
          <div class="px-6 py-4 bg-slate-50/80 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                <component :is="categoryIcons[group.category]" class="w-4 h-4" />
              </div>
              <div>
                <h3 class="text-sm font-bold text-slate-900">
                  {{ isAr ? group.nameAr : group.name }}
                </h3>
                <span class="text-[11px] text-slate-500 font-medium">
                  {{ group.features.length }} {{ isAr ? 'ميزات وصلاحيات فرعية' : 'sub-features configured' }}
                </span>
              </div>
            </div>

            <!-- Quick Batch Selectors -->
            <div class="flex items-center gap-3 text-[11px] text-slate-500 font-bold">
              <span>{{ isAr ? 'تفعيل للكل:' : 'Batch enable:' }}</span>
              <button
                type="button"
                @click="toggleAllInCategory(group.category, 'FREE', true)"
                class="hover:text-emerald-700 cursor-pointer underline"
              >
                {{ isAr ? 'المجانية' : 'FREE' }}
              </button>
              <span>•</span>
              <button
                type="button"
                @click="toggleAllInCategory(group.category, 'BASIC', true)"
                class="hover:text-emerald-700 cursor-pointer underline"
              >
                {{ isAr ? 'الأساسية' : 'BASIC' }}
              </button>
              <span>•</span>
              <button
                type="button"
                @click="toggleAllInCategory(group.category, 'PRO', true)"
                class="hover:text-emerald-700 cursor-pointer underline"
              >
                {{ isAr ? 'الاحترافية' : 'PRO' }}
              </button>
            </div>
          </div>

          <!-- Features Table -->
          <div class="overflow-x-auto">
            <table class="w-full text-start text-xs border-collapse">
              <thead>
                <tr class="border-b border-slate-100 bg-slate-50/40 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th class="ps-6 pe-4 py-3 text-start w-1/2">
                    {{ isAr ? 'الميزة / الخدمة والتفاصيل' : 'Feature & Capability' }}
                  </th>
                  <th class="px-4 py-3 text-center w-1/6">
                    <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-black">
                      <span>{{ isAr ? 'خطة مجانية' : 'FREE' }}</span>
                    </div>
                  </th>
                  <th class="px-4 py-3 text-center w-1/6">
                    <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-black">
                      <span>{{ isAr ? 'خطة أساسية' : 'BASIC' }}</span>
                    </div>
                  </th>
                  <th class="pe-6 ps-4 py-3 text-center w-1/6">
                    <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-black">
                      <span>{{ isAr ? 'خطة احترافية' : 'PRO' }}</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr
                  v-for="feature in group.features"
                  :key="feature.id"
                  class="hover:bg-slate-50/60 transition-colors"
                >
                  <!-- Feature Info Column -->
                  <td class="ps-6 pe-4 py-4">
                    <div class="flex flex-col">
                      <div class="flex items-center gap-2">
                        <span class="font-bold text-slate-900 text-xs sm:text-sm">
                          {{ isAr ? feature.nameAr : feature.name }}
                        </span>
                      </div>
                      <p class="text-[11px] text-slate-500 mt-1 leading-relaxed max-w-xl">
                        {{ isAr ? feature.descriptionAr : feature.description }}
                      </p>
                    </div>
                  </td>

                  <!-- Free Plan Toggle -->
                  <td class="px-4 py-4 text-center">
                    <button
                      type="button"
                      @click="handleToggle(feature.id, 'FREE', isAr ? feature.nameAr : feature.name)"
                      :class="[
                        'w-12 h-6.5 rounded-full transition-all cursor-pointer relative p-0.5 inline-flex items-center shadow-2xs',
                        feature.plans.FREE ? 'bg-emerald-600' : 'bg-slate-200'
                      ]"
                      :title="`${isAr ? 'تبديل' : 'Toggle'} FREE: ${feature.name}`"
                    >
                      <span
                        :class="[
                          'w-5.5 h-5.5 rounded-full bg-white shadow-xs transition-transform transform flex items-center justify-center',
                          feature.plans.FREE ? (isAr ? '-translate-x-5.5' : 'translate-x-5.5') : 'translate-x-0'
                        ]"
                      >
                        <Check v-if="feature.plans.FREE" class="w-3 h-3 text-emerald-600 stroke-[3]" />
                      </span>
                    </button>
                  </td>

                  <!-- Basic Plan Toggle -->
                  <td class="px-4 py-4 text-center">
                    <button
                      type="button"
                      @click="handleToggle(feature.id, 'BASIC', isAr ? feature.nameAr : feature.name)"
                      :class="[
                        'w-12 h-6.5 rounded-full transition-all cursor-pointer relative p-0.5 inline-flex items-center shadow-2xs',
                        feature.plans.BASIC ? 'bg-emerald-600' : 'bg-slate-200'
                      ]"
                      :title="`${isAr ? 'تبديل' : 'Toggle'} BASIC: ${feature.name}`"
                    >
                      <span
                        :class="[
                          'w-5.5 h-5.5 rounded-full bg-white shadow-xs transition-transform transform flex items-center justify-center',
                          feature.plans.BASIC ? (isAr ? '-translate-x-5.5' : 'translate-x-5.5') : 'translate-x-0'
                        ]"
                      >
                        <Check v-if="feature.plans.BASIC" class="w-3 h-3 text-emerald-600 stroke-[3]" />
                      </span>
                    </button>
                  </td>

                  <!-- Pro Plan Toggle -->
                  <td class="pe-6 ps-4 py-4 text-center">
                    <button
                      type="button"
                      @click="handleToggle(feature.id, 'PRO', isAr ? feature.nameAr : feature.name)"
                      :class="[
                        'w-12 h-6.5 rounded-full transition-all cursor-pointer relative p-0.5 inline-flex items-center shadow-2xs',
                        feature.plans.PRO ? 'bg-emerald-600' : 'bg-slate-200'
                      ]"
                      :title="`${isAr ? 'تبديل' : 'Toggle'} PRO: ${feature.name}`"
                    >
                      <span
                        :class="[
                          'w-5.5 h-5.5 rounded-full bg-white shadow-xs transition-transform transform flex items-center justify-center',
                          feature.plans.PRO ? (isAr ? '-translate-x-5.5' : 'translate-x-5.5') : 'translate-x-0'
                        ]"
                      >
                        <Check v-if="feature.plans.PRO" class="w-3 h-3 text-emerald-600 stroke-[3]" />
                      </span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Empty Results -->
        <div
          v-if="filteredGroups.length === 0"
          class="bg-white rounded-2xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center"
        >
          <Sliders class="w-10 h-10 text-slate-300 mb-3" />
          <h4 class="text-sm font-bold text-slate-700">
            {{ isAr ? 'لا توجد ميزات مطابقة للبحث' : 'No matching features found' }}
          </h4>
          <p class="text-xs text-slate-400 mt-1">
            {{ isAr ? 'جرب البحث بكلمات أخرى أو اختر قسماً آخر' : 'Try adjusting your search terms or filter criteria' }}
          </p>
        </div>
      </div>
    </div>
  </AppShell>
</template>
