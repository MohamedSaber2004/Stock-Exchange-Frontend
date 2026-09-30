<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Check, X, Sparkles } from 'lucide-vue-next'
import AppShell from '@/components/layout/AppShell.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import ActionMenu from '@/components/ui/ActionMenu.vue'
import DynamicListInput from '@/components/forms/DynamicListInput.vue'
import { useFeedback } from '@/composables/useFeedback'
import { useI18n } from 'vue-i18n'
import { usePlanPermissions, type PlanTier } from '@/composables/usePlanPermissions'

const router = useRouter()
const { confirm, toast } = useFeedback()
const { t, locale } = useI18n()

const isAr = computed(() => locale.value === 'ar')

const { getActiveFeaturesForPlan } = usePlanPermissions()

interface Plan {
  id: string
  name: PlanTier
  nameKey: string
  price: string
  periodKey: string
  isPopular?: boolean
  features?: string[]
  status: 'Active' | 'Inactive'
}

const plans = ref<Plan[]>([
  {
    id: 'plan-1',
    name: 'FREE',
    nameKey: 'planFree',
    price: '0',
    periodKey: 'perMonth',
    features: [],
    status: 'Active'
  },
  {
    id: 'plan-2',
    name: 'BASIC',
    nameKey: 'planBasic',
    price: '200',
    periodKey: 'perMonth',
    isPopular: true,
    features: [],
    status: 'Active'
  },
  {
    id: 'plan-3',
    name: 'PRO',
    nameKey: 'planPro',
    price: '399',
    periodKey: 'perMonth',
    features: [],
    status: 'Active'
  }
])

// Dynamic features for each plan from permissions matrix
const getPlanFeatures = (planName: PlanTier) => {
  return getActiveFeaturesForPlan(planName, isAr.value)
}

// Edit Modal State
const isEditModalOpen = ref(false)
const editingPlan = ref<Plan | null>(null)

const handleEdit = (plan: Plan) => {
  editingPlan.value = {
    ...JSON.parse(JSON.stringify(plan)),
    features: plan.features ? [...plan.features] : []
  }
  isEditModalOpen.value = true
}

const savePlanModal = () => {
  if (editingPlan.value) {
    const idx = plans.value.findIndex(p => p.id === editingPlan.value!.id)
    if (idx !== -1) {
      plans.value[idx] = { ...editingPlan.value }
      toast.success(t('subscriptions.planUpdated'))
    }
    isEditModalOpen.value = false
  }
}

const handleAction = async (actionId: string, plan: Plan) => {
  if (actionId === 'edit') {
    handleEdit(plan)
  } else if (actionId === 'delete') {
    const ok = await confirm({
      title: t('subscriptions.deleteConfirmTitle'),
      message: `${t('subscriptions.deleteConfirmDesc')} ("${plan.name}")`,
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      type: 'danger'
    })
    if (ok) {
      plans.value = plans.value.filter(p => p.id !== plan.id)
      toast.success(isAr.value ? 'تم حذف باقة الاشتراك بنجاح' : 'Subscription plan deleted successfully')
    }
  }
}
</script>

<template>
  <AppShell>
    <div class="flex flex-col max-w-7xl mx-auto">
      <PageHeader
        :title="t('subscriptions.title')"
        :description="t('subscriptions.subtitle')"
      >
        <template #actions>
          <div class="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              @click="router.push('/subscriptions/create')"
              class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex-1 sm:flex-initial justify-center"
            >
              <Plus class="w-3.5 h-3.5 stroke-[3]" />
              {{ t('subscriptions.addPlan') }}
            </button>
          </div>
        </template>
      </PageHeader>

      <!-- Plans Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch">
        <div
          v-for="plan in plans"
          :key="plan.id"
          :class="[
            'bg-white rounded-3xl border p-6 sm:p-7 flex flex-col justify-between shadow-2xs relative transition-all hover:shadow-md',
            plan.isPopular ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200/80'
          ]"
        >
          <!-- Most Popular Badge -->
          <div
            v-if="plan.isPopular"
            class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-sm"
          >
            {{ t('subscriptions.mostPopular') }}
          </div>

          <!-- Top Info -->
          <div>
            <div class="flex items-center justify-between mb-4">
              <span class="text-xs font-black tracking-wider text-slate-800 uppercase">
                {{ t('users.' + plan.nameKey) || plan.name }}
              </span>
              <StatusBadge :status="plan.status">
                {{ t('common.' + plan.status.toLowerCase()) || plan.status }}
              </StatusBadge>
            </div>

            <!-- Price -->
            <div class="flex items-baseline gap-1.5 my-4">
              <span class="text-3xl font-black text-slate-900 tracking-tight">{{ plan.price }} {{ t('subscriptions.currency') }}</span>
              <span class="text-xs text-slate-400 font-semibold">{{ t('subscriptions.perMonth') }}</span>
            </div>

            <div class="w-full h-px bg-slate-100 my-5" />

            <!-- Active Features Header with Count -->
            <div class="flex items-center justify-between mb-3">
              <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {{ isAr ? 'الميزات والصلاحيات المفعلة' : 'Active Features' }}
              </span>
              <span class="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {{ getPlanFeatures(plan.name).length }} {{ isAr ? 'ميزات' : 'features' }}
              </span>
            </div>

            <!-- Features List dynamically loaded from permissions matrix -->
            <div class="flex flex-col gap-2.5">
              <div
                v-for="feat in getPlanFeatures(plan.name)"
                :key="feat.id"
                class="flex items-start gap-2.5 text-xs text-slate-700 font-medium group"
              >
                <div class="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <Check class="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <div class="flex flex-col">
                  <span class="font-bold text-slate-800 leading-snug">{{ feat.name }}</span>
                  <span class="text-[10px] text-slate-400 leading-tight">{{ feat.description }}</span>
                </div>
              </div>

              <div
                v-if="getPlanFeatures(plan.name).length === 0"
                class="p-4 text-center rounded-xl bg-slate-50 text-[11px] text-slate-400 font-medium"
              >
                {{ isAr ? 'لا توجد ميزات مفعلة لهذه الخطة حالياً' : 'No features currently enabled for this plan' }}
              </div>
            </div>
          </div>

          <!-- Bottom Actions -->
          <div class="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              @click="handleEdit(plan)"
              class="flex-1 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition-colors cursor-pointer text-center"
            >
              {{ t('common.edit') }}
            </button>
            <ActionMenu
              :items="[
                { id: 'edit', label: t('common.edit') },
                { id: 'delete', label: t('common.delete'), danger: true }
              ]"
              @select="(act) => handleAction(act, plan)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Plan Modal -->
    <div
      v-if="isEditModalOpen && editingPlan"
      class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
    >
      <div class="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 class="text-sm font-black text-slate-900">{{ t('subscriptions.editPlanTitle', { name: editingPlan.name }) }}</h3>
          <button
            type="button"
            @click="isEditModalOpen = false"
            class="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="flex flex-col gap-3.5">
          <div class="grid grid-cols-2 gap-3">
            <div class="flex flex-col gap-1">
              <label class="text-xs font-bold text-slate-700">{{ t('subscriptions.planName') }}</label>
              <input
                v-model="editingPlan.name"
                type="text"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-xs font-bold text-slate-700">{{ t('subscriptions.priceDisplay') }}</label>
              <input
                v-model="editingPlan.price"
                type="text"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          <DynamicListInput
            v-model="editingPlan.features"
            :label="t('subscriptions.planFeatures')"
            :placeholder="t('subscriptions.featurePlaceholder')"
            :buttonText="t('subscriptions.addFeature')"
          />

          <div class="flex items-center gap-4 pt-1">
            <label class="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                v-model="editingPlan.isPopular"
                class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <span>{{ t('subscriptions.markAsPopular') }}</span>
            </label>

            <label class="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                :checked="editingPlan.status === 'Active'"
                @change="editingPlan.status = ($event.target as HTMLInputElement).checked ? 'Active' : 'Inactive'"
                class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <span>{{ t('common.active') }}</span>
            </label>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 mt-2">
          <button
            type="button"
            @click="isEditModalOpen = false"
            class="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            type="button"
            @click="savePlanModal"
            class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            {{ t('common.save') }}
          </button>
        </div>
      </div>
    </div>
  </AppShell>
</template>
