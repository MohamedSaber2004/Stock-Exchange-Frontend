<script setup lang="ts">
import { ref } from 'vue'
import { 
  Mail, 
  Globe, 
  Plus, 
  Trash2, 
  Building2, 
  Sparkles, 
  Save, 
  Users, 
  Award, 
  Layers,
  Phone,
  Share2
} from 'lucide-vue-next'
import AppShell from '@/components/layout/AppShell.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { useFeedback } from '@/composables/useFeedback'
import { useI18n } from 'vue-i18n'

const { toast } = useFeedback()
const { t } = useI18n()

// Active Tab
const activeTab = ref<'content' | 'features' | 'team' | 'contact'>('content')

const form = ref({
  // English
  missionEn: 'FinWise was built on a simple belief: everyone deserves access to high-quality financial education. We partner with experienced educators, certified financial planners, and market analysts to bring you content that is trustworthy, engaging, and genuinely useful — regardless of your starting point.',
  visionEn: 'To be the most trusted and comprehensive financial market education platform across the Middle East & North Africa.',
  // Arabic
  missionAr: 'تأسست FinWise انطلاقاً من إيمان راسخ بأن الجميع يستحق الوصول إلى تعليم مالي عالي الجودة وموثوق. نتعاون مع نخبة من الخبراء الماليين المعتمدين ومحللي الأسواق لتقديم محتوى تعليمي تفاعلي وعملي للمتداولين والمستثمرين.',
  visionAr: 'أن نكون المنصة التعليمية المالية الأكثر ثقة وشمولاً في الشرق الأوسط وشمال أفريقيا لتمكين الأفراد من اتخاذ قرارات استثمارية مدروسة.',
  // Meta
  appName: 'FinWise Education & Stock Exchange',
  appVersion: 'v2.4.0',
  foundedYear: '2024',
  headquarters: 'Cairo, Egypt / Dubai, UAE',
  supportEmail: 'support@finwise.app',
  inquiryEmail: 'partners@finwise.app',
  phoneHotline: '+20 2 3456 7890',
  website: 'https://finwise.app',
  instagram: 'https://instagram.com/finwise.app',
  facebook: 'https://facebook.com/finwise.app',
  linkedin: 'https://linkedin.com/company/finwise-app',
  youtube: 'https://youtube.com/@finwise_education',
  xTwitter: 'https://x.com/finwise_app'
})

// Core Features
export interface AppFeature {
  id: string
  title: string
  subtitle: string
  tag: string
}

const features = ref<AppFeature[]>([
  {
    id: 'feat-1',
    title: 'Expert-Led Video Lessons',
    subtitle: 'Step-by-step video courses taught by certified portfolio managers and analysts.',
    tag: 'Education'
  },
  {
    id: 'feat-2',
    title: 'Daily Market News & Analysis',
    subtitle: 'Curated breaking market movements and macroeconomic news in concise formats.',
    tag: 'Market'
  },
  {
    id: 'feat-3',
    title: 'Interactive Articles & Quizzes',
    subtitle: 'Deep dives into candlestick patterns, financial ratios, and investment strategies.',
    tag: 'Learning'
  },
  {
    id: 'feat-4',
    title: 'Tiered Subscription Access',
    subtitle: 'Flexible Free, Basic, and Pro tiers tailored to beginners and active traders.',
    tag: 'Membership'
  }
])

// Key Educators / Team
export interface TeamMember {
  id: string
  name: string
  role: string
  avatar: string
  coursesCount: number
}

const teamMembers = ref<TeamMember[]>([
  {
    id: 'tm-1',
    name: 'Ali Hussien',
    role: 'Senior Market Strategist & Lead Educator',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    coursesCount: 24
  },
  {
    id: 'tm-2',
    name: 'Dr. Sarah Farouk',
    role: 'Chartered Financial Analyst (CFA)',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
    coursesCount: 16
  },
  {
    id: 'tm-3',
    name: 'Omar Mansour',
    role: 'Technical Analysis Instructor',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    coursesCount: 12
  }
])

const newFeature = ref({
  title: '',
  subtitle: '',
  tag: 'Education'
})

const addFeature = () => {
  if (!newFeature.value.title.trim()) {
    toast.error('Feature title is required')
    return
  }
  features.value.push({
    id: `feat-${Date.now()}`,
    title: newFeature.value.title.trim(),
    subtitle: newFeature.value.subtitle.trim() || 'Comprehensive educational feature',
    tag: newFeature.value.tag
  })
  newFeature.value = { title: '', subtitle: '', tag: 'Education' }
  toast.success('Feature added')
}

const removeFeature = (id: string) => {
  features.value = features.value.filter(f => f.id !== id)
  toast.info('Feature removed')
}

const handleSave = () => {
  toast.success('About FinWise information updated successfully!')
}
</script>

<template>
  <AppShell>
    <div class="flex flex-col gap-6 max-w-7xl mx-auto">
      <PageHeader
        :title="t('about.title')"
        :description="t('about.subtitle')"
      >
        <template #actions>
          <button
            type="button"
            @click="handleSave"
            class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-sm shadow-emerald-600/20 cursor-pointer"
          >
            <Save class="w-4 h-4" />
            <span>{{ t('about.saveChanges') }}</span>
          </button>
        </template>
      </PageHeader>

      <!-- Tabs -->
      <div class="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          @click="activeTab = 'content'"
          :class="[
            'px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2',
            activeTab === 'content'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          ]"
        >
          <Building2 class="w-4 h-4" />
          <span>{{ t('about.storyTab') }}</span>
        </button>

        <button
          type="button"
          @click="activeTab = 'features'"
          :class="[
            'px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2',
            activeTab === 'features'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          ]"
        >
          <Sparkles class="w-4 h-4" />
          <span>{{ t('about.featuresTab') }} ({{ features.length }})</span>
        </button>

        <button
          type="button"
          @click="activeTab = 'team'"
          :class="[
            'px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2',
            activeTab === 'team'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          ]"
        >
          <Users class="w-4 h-4" />
          <span>{{ t('about.teamTab') }}</span>
        </button>

        <button
          type="button"
          @click="activeTab = 'contact'"
          :class="[
            'px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2',
            activeTab === 'contact'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          ]"
        >
          <Share2 class="w-4 h-4" />
          <span>{{ t('about.socialTab') }}</span>
        </button>
      </div>

      <!-- TAB 1: STORY & MISSION -->
      <div v-if="activeTab === 'content'" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- English Story -->
        <div class="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs flex flex-col gap-4">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider">English Story & Mission</h3>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold text-slate-700">Our Mission (en)</label>
            <textarea
              v-model="form.missionEn"
              rows="5"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white resize-none font-medium leading-relaxed"
            ></textarea>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold text-slate-700">Our Vision (en)</label>
            <textarea
              v-model="form.visionEn"
              rows="3"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white resize-none font-medium leading-relaxed"
            ></textarea>
          </div>
        </div>

        <!-- Arabic Story -->
        <div class="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs flex flex-col gap-4">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider">القصة والرؤية بالعربية</h3>
          </div>

          <div class="flex flex-col gap-1.5" dir="rtl">
            <label class="text-xs font-bold text-slate-700 text-start">رسالتنا (عربي)</label>
            <textarea
              v-model="form.missionAr"
              rows="5"
              dir="rtl"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white resize-none font-medium leading-relaxed text-start"
            ></textarea>
          </div>

          <div class="flex flex-col gap-1.5" dir="rtl">
            <label class="text-xs font-bold text-slate-700 text-start">رؤيتنا (عربي)</label>
            <textarea
              v-model="form.visionAr"
              rows="3"
              dir="rtl"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white resize-none font-medium leading-relaxed text-start"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- TAB 2: FEATURES & PILLARS -->
      <div v-else-if="activeTab === 'features'" class="flex flex-col gap-6">
        <div class="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex flex-col gap-4">
          <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Add Core Pillar / Feature</h3>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              v-model="newFeature.title"
              type="text"
              placeholder="Feature Title (e.g. Real-Time Insights)"
              class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
            />
            <input
              v-model="newFeature.subtitle"
              type="text"
              placeholder="Short Description..."
              class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
            />
            <button
              type="button"
              @click="addFeature"
              class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus class="w-4 h-4" />
              <span>Add Pillar</span>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            v-for="feat in features"
            :key="feat.id"
            class="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex items-start justify-between gap-4"
          >
            <div class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Sparkles class="w-4 h-4" />
              </div>
              <div>
                <span class="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded uppercase">{{ feat.tag }}</span>
                <h4 class="font-bold text-slate-900 text-xs mt-1.5">{{ feat.title }}</h4>
                <p class="text-xs text-slate-500 mt-0.5">{{ feat.subtitle }}</p>
              </div>
            </div>
            <button
              type="button"
              @click="removeFeature(feat.id)"
              class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- TAB 3: TEAM & EDUCATORS -->
      <div v-else-if="activeTab === 'team'" class="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div
          v-for="tm in teamMembers"
          :key="tm.id"
          class="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs flex flex-col items-center text-center gap-3"
        >
          <img
            :src="tm.avatar"
            :alt="tm.name"
            class="w-16 h-16 rounded-full object-cover ring-2 ring-emerald-500/20"
          />
          <div>
            <h4 class="font-black text-slate-900 text-sm">{{ tm.name }}</h4>
            <p class="text-[11px] text-slate-500 font-semibold mt-0.5">{{ tm.role }}</p>
          </div>
        </div>
      </div>

      <!-- TAB 4: CONTACT & SUPPORT EMAIL -->
      <div v-else-if="activeTab === 'contact'" class="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-2xs flex flex-col gap-6 max-w-xl">
        <div class="flex flex-col gap-2">
          <label class="text-xs font-bold text-slate-800">{{ t('about.supportEmail') }}</label>
          <p class="text-xs text-slate-500 font-medium">{{ t('about.supportEmailDesc') }}</p>
          <div class="relative mt-2">
            <Mail class="w-4 h-4 text-emerald-600 absolute start-3.5 top-1/2 -translate-y-1/2" />
            <input
              v-model="form.supportEmail"
              type="email"
              dir="ltr"
              placeholder="support@finwise.app"
              class="w-full bg-slate-50/60 border border-slate-200 rounded-xl ps-10 pe-4 py-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition-all"
            />
          </div>
        </div>
      </div>
    </div>
  </AppShell>
</template>
