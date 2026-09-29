<script setup lang="ts">
import { ref, computed } from 'vue'
import AppShell from '@/components/layout/AppShell.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import RichTextEditor from '@/components/forms/RichTextEditor.vue'
import { 
  FileText, 
  Shield, 
  AlertTriangle, 
  History, 
  Save,
  Clock
} from 'lucide-vue-next'
import { useFeedback } from '@/composables/useFeedback'
import { useI18n } from 'vue-i18n'

const { toast } = useFeedback()
const { t, locale } = useI18n()
const isAr = computed(() => locale.value === 'ar')

// Active Legal Document Tab
const activeDoc = ref<'terms' | 'privacy' | 'disclaimer'>('terms')

// Documents Content State
const documents = ref({
  terms: {
    title: 'Terms of Service',
    version: '2.1.0',
    lastUpdated: 'September 2025',
    status: 'Published',
    content: `## 1. Acceptance of Terms
By downloading, browsing, or using the FinWise mobile application or website, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.

## 2. Educational Purpose Only
FinWise is strictly an educational platform designed to teach financial market literacy, chart analysis, and trading methodologies. **None of the materials, videos, articles, or market highlights constitute financial advice, investment recommendations, or an offer to buy or sell securities.**

## 3. Subscription & Billing
- Subscriptions (Basic & Pro) are billed in advance on a recurring monthly basis.
- You can cancel your subscription at any time through the app settings or app store provider.
- All digital educational content is delivered immediately upon payment verification.

## 4. User Accounts & Security
You are responsible for maintaining the confidentiality of your account credentials and password. FinWise is not liable for any loss resulting from unauthorized access to your account.

## 5. Intellectual Property
All videos, articles, charts, illustrations, and proprietary educational workflows are the copyrighted property of FinWise. Unauthorized duplication, redistribution, or resale is strictly prohibited.`
  },
  privacy: {
    title: 'Privacy Policy',
    version: '1.8.0',
    lastUpdated: 'August 2025',
    status: 'Published',
    content: `## 1. Information We Collect
We collect information you provide directly to us when creating an account:
- Full Name and Email Address.
- Country of residence and phone number.
- Learning preferences, course progress, and video watch history.

## 2. How We Use Your Data
- To deliver personalized educational feeds and progress tracking.
- To process subscription transactions securely via certified payment gateways.
- To send security notifications and platform updates.

## 3. Data Protection & Encryption
We implement industry-standard 256-bit SSL encryption for all data in transit and at rest. We never sell your personal information to third-party brokers or advertisers.

## 4. Your Data Rights
You have the right to request a copy of your personal data or request permanent deletion of your account at any time through the Profile Settings tab.`
  },
  disclaimer: {
    title: 'Risk & Investment Disclaimer',
    version: '1.2.0',
    lastUpdated: 'July 2025',
    status: 'Published',
    content: `## Important Financial Notice
Trading stocks, indices, commodities, currencies, and other financial instruments involves significant risk of loss and is not suitable for every investor.

- **No Guarantee of Profit**: Historical market performances shown in articles or video lessons do not guarantee future results.
- **Independent Decisions**: All investment decisions you make are solely your own responsibility. We strongly recommend consulting with a licensed financial advisor before allocating real capital.`
  }
})

// Version History Log
const versionHistory = ref([
  { id: 'v-3', doc: 'Terms of Service', version: 'v2.1.0', author: 'Admin (Compliance)', date: 'Sep 15, 2025', notes: 'Updated subscription cancellation clauses.' },
  { id: 'v-2', doc: 'Privacy Policy', version: 'v1.8.0', author: 'Admin (Legal)', date: 'Aug 20, 2025', notes: 'Added GDPR data deletion guidelines.' },
  { id: 'v-1', doc: 'Risk Disclaimer', version: 'v1.2.0', author: 'Admin (Compliance)', date: 'Jul 10, 2025', notes: 'Added explicit Egyptian & Arab market risk warnings.' }
])

// Save Action
const handleSaveDocument = () => {
  const current = documents.value[activeDoc.value]
  current.lastUpdated = isAr.value ? 'الآن' : 'Just now'
  const docNameAr = activeDoc.value === 'terms' ? 'شروط الخدمة' : activeDoc.value === 'privacy' ? 'سياسة الخصوصية' : 'إخلاء المسؤولية'
  toast.success(
    isAr.value
      ? `تم حفظ ونشر وثيقة "${docNameAr}" بنجاح!`
      : `${current.title} published and updated successfully!`
  )
}
</script>

<template>
  <AppShell>
    <div class="flex flex-col gap-6 max-w-7xl mx-auto">
      <!-- Header -->
      <PageHeader
        :title="t('legal.title')"
        :description="t('legal.subtitle')"
      >
        <template #actions>
          <button
            type="button"
            @click="handleSaveDocument"
            class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-sm shadow-emerald-600/20 cursor-pointer"
          >
            <Save class="w-4 h-4" />
            <span>{{ t('legal.saveAndPublish') }}</span>
          </button>
        </template>
      </PageHeader>

      <!-- Document Tabs -->
      <div class="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          @click="activeDoc = 'terms'"
          :class="[
            'px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2',
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
          @click="activeDoc = 'privacy'"
          :class="[
            'px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2',
            activeDoc === 'privacy'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          ]"
        >
          <Shield class="w-4 h-4" />
          <span>{{ t('legal.privacyTab') }}</span>
        </button>

        <button
          type="button"
          @click="activeDoc = 'disclaimer'"
          :class="[
            'px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2',
            activeDoc === 'disclaimer'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          ]"
        >
          <AlertTriangle class="w-4 h-4" />
          <span>{{ t('legal.disclaimerTab') }}</span>
        </button>
      </div>

      <!-- Main Editor & Settings Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        <!-- Left: Rich Content Editor (2 cols) -->
        <div class="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs flex flex-col gap-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 class="text-sm font-bold text-slate-900">{{ documents[activeDoc].title }}</h2>
              <span class="text-[11px] text-slate-400 font-medium">Rendered directly inside mobile in-app webview & legal modal</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="font-mono font-bold text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                v{{ documents[activeDoc].version }}
              </span>
              <StatusBadge status="Published" />
            </div>
          </div>

          <!-- Rich Text Content Editor -->
          <RichTextEditor
            v-model="documents[activeDoc].content"
            label="Document Markdown / Text Content"
            placeholder="Type legal clauses and terms..."
          />
        </div>

        <!-- Right: Document Meta & Version Audit History (1 col) -->
        <div class="flex flex-col gap-6">
          
          <!-- Document Settings Card -->
          <div class="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex flex-col gap-4">
            <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Document Meta
            </h3>

            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">Version String</label>
              <input
                v-model="documents[activeDoc].version"
                type="text"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">Last Modified</label>
              <div class="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-semibold">
                <Clock class="w-3.5 h-3.5 text-slate-400" />
                <span>{{ documents[activeDoc].lastUpdated }}</span>
              </div>
            </div>

            <button
              type="button"
              @click="handleSaveDocument"
              class="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              <Save class="w-3.5 h-3.5" />
              <span>Update Legal Policy</span>
            </button>
          </div>

          <!-- Version History Card -->
          <div class="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex flex-col gap-3">
            <div class="flex items-center gap-2">
              <History class="w-4 h-4 text-emerald-600" />
              <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Version History
              </h3>
            </div>

            <div class="flex flex-col divide-y divide-slate-100 text-xs">
              <div
                v-for="vh in versionHistory"
                :key="vh.id"
                class="py-2.5 flex flex-col gap-1 first:pt-0 last:pb-0"
              >
                <div class="flex items-center justify-between">
                  <span class="font-bold text-slate-800">{{ vh.doc }}</span>
                  <span class="font-mono font-bold text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">{{ vh.version }}</span>
                </div>
                <p class="text-[11px] text-slate-500 leading-tight">{{ vh.notes }}</p>
                <span class="text-[10px] text-slate-400">{{ vh.date }} • {{ vh.author }}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </AppShell>
</template>
