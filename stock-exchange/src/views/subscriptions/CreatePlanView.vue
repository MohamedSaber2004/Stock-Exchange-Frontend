<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import DynamicListInput from '@/components/forms/DynamicListInput.vue'
import { useFeedback } from '@/composables/useFeedback'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { toast } = useFeedback()
const { t, locale } = useI18n()
const isAr = computed(() => locale.value === 'ar')

const form = ref({
  name: 'Pro Plan',
  price: '399',
  currency: 'EGP',
  benefits: [
    'Daily market news',
    'Unlimited videos',
    'Premium articles'
  ],
  isPopular: true,
  isActive: true
})

const handleSave = () => {
  if (!form.value.name || !form.value.price) {
    toast.error(isAr.value ? 'يرجى إدخال اسم الباقة وسعرها' : 'Please enter plan name and price')
    return
  }
  toast.success(isAr.value ? 'تم إنشاء باقة الاشتراك بنجاح' : 'Subscription plan created successfully')
  router.push('/subscriptions')
}
</script>

<template>
  <AppShell>
    <div class="flex flex-col max-w-3xl mx-auto">
      <PageHeader
        :title="t('subscriptions.createPlan')"
        :description="t('subscriptions.subtitle')"
      />

      <div class="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-2xs flex flex-col gap-6">
        <!-- Plan Name & Price -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="sm:col-span-2 flex flex-col gap-1.5">
            <label class="text-xs font-bold text-slate-700">{{ t('subscriptions.planName') }} *</label>
            <input
              v-model="form.name"
              type="text"
              placeholder="e.g. Pro Plan"
              class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold text-slate-700">{{ t('subscriptions.monthlyPrice') }} *</label>
            <div class="flex items-center gap-1.5">
              <input
                v-model="form.price"
                type="number"
                placeholder="399"
                class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
              />
              <span class="text-xs font-bold text-slate-500">{{ t('subscriptions.currency') }}</span>
            </div>
          </div>
        </div>

        <!-- Benefits List (DynamicListInput) -->
        <DynamicListInput
          v-model="form.benefits"
          :label="t('subscriptions.benefits')"
          :placeholder="t('subscriptions.benefitPlaceholder')"
          :buttonText="t('subscriptions.addBenefit')"
        />

        <!-- Options -->
        <div class="flex flex-col gap-3 pt-2">
          <label class="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              v-model="form.isPopular"
              class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
            />
            <span class="text-xs font-bold text-slate-700">{{ t('subscriptions.markAsPopular') }}</span>
          </label>

          <label class="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              v-model="form.isActive"
              class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
            />
            <span class="text-xs font-bold text-slate-700">{{ t('common.active') }}</span>
          </label>
        </div>

        <!-- Footer Actions -->
        <div class="mt-4 pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            @click="router.push('/subscriptions')"
            class="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition-colors cursor-pointer"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            type="button"
            @click="handleSave"
            class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer"
          >
            {{ t('subscriptions.savePlan') }}
          </button>
        </div>
      </div>
    </div>
  </AppShell>
</template>
