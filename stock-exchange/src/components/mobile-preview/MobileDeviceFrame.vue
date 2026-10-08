<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  ChevronLeft,
  ChevronRight,
  Share2,
  Bookmark,
  Clock,
  Play,
  CheckCircle,
  Sparkles,
  TrendingUp,
  Wifi,
  Battery,
  Calendar,
  Layers,
  User,
  Star
} from 'lucide-vue-next'
import { resolveAttachmentUrl, handleImageError } from '@/utils/attachment'
import type { ArticleDto } from '@/domain/models/article.model'
import type { VideoDto } from '@/domain/models/video.model'
import type { ServiceDto } from '@/domain/models/service.model'
import type { NewsDto } from '@/domain/models/news.model'
import type { ExpertDto } from '@/domain/models/expert.model'

interface Props {
  type: 'article' | 'video' | 'service' | 'news' | 'expert'
  article?: ArticleDto | null
  video?: VideoDto | null
  service?: ServiceDto | null
  news?: NewsDto | null
  expert?: ExpertDto | null
  defaultLang?: 'ar' | 'en'
}

const props = withDefaults(defineProps<Props>(), {
  defaultLang: 'ar'
})

const previewLang = ref<'ar' | 'en'>(props.defaultLang)
const isAr = computed(() => previewLang.value === 'ar')

watch(
  () => props.defaultLang,
  (newVal) => {
    if (newVal) previewLang.value = newVal
  }
)

const toggleLang = () => {
  previewLang.value = previewLang.value === 'ar' ? 'en' : 'ar'
}

// Format duration for videos
const formatDuration = (seconds?: number) => {
  if (!seconds || seconds <= 0) return '10:00'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Format date
const formatDate = (dateStr?: string) => {
  if (!dateStr) return isAr.value ? 'اليوم' : 'Today'
  try {
    return new Date(dateStr).toLocaleDateString(isAr.value ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return dateStr
  }
}
</script>

<template>
  <div class="flex flex-col items-center">
    <!-- Lang Switcher Pills on top of Frame -->
    <div class="flex items-center justify-between w-full max-w-[340px] mb-3 px-2">
      <span class="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        {{ isAr ? 'معاينة تطبيق فلاتر' : 'Flutter Mobile Preview' }}
      </span>

      <button
        type="button"
        @click="toggleLang"
        class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white border border-slate-200 shadow-2xs hover:bg-slate-50 text-slate-700 transition-all cursor-pointer"
      >
        <span :class="!isAr ? 'text-emerald-600 font-black' : 'text-slate-400'">EN</span>
        <span class="text-slate-300">/</span>
        <span :class="isAr ? 'text-emerald-600 font-black' : 'text-slate-400'">عربي</span>
      </button>
    </div>

    <!-- Phone Chassis Frame -->
    <div
      class="w-full max-w-[340px] bg-slate-900 rounded-[50px] p-3.5 shadow-2xl border-4 border-slate-800 relative select-none"
      :dir="isAr ? 'rtl' : 'ltr'"
    >
      <!-- Hardware Notch / Dynamic Island -->
      <div class="absolute top-6 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-950 rounded-full z-30 flex items-center justify-end pe-2">
        <div class="w-2.5 h-2.5 rounded-full bg-slate-800/80 border border-slate-700/50"></div>
      </div>

      <!-- Phone Screen Inside Chassis -->
      <div class="bg-white rounded-[40px] overflow-hidden flex flex-col h-[650px] relative border border-slate-200/60 shadow-inner">

        <!-- Status Bar -->
        <div class="h-9 px-6 flex items-center justify-between text-[11px] font-semibold text-slate-900 z-20 shrink-0 select-none bg-white/80 backdrop-blur-xs">
          <span>09:41</span>
          <div class="flex items-center gap-1.5 text-slate-800">
            <span class="text-[9px] font-bold tracking-tighter">5G</span>
            <Wifi class="w-3 h-3 stroke-[2.5]" />
            <Battery class="w-3.5 h-3.5 stroke-[2.5] text-emerald-600" />
          </div>
        </div>

        <!-- In-App Top Bar -->
        <div class="px-4 py-2.5 flex items-center justify-between border-b border-slate-100 bg-white/95 backdrop-blur-xs shrink-0 z-10">
          <button type="button" class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 hover:bg-slate-200 transition-colors">
            <component :is="isAr ? ChevronRight : ChevronLeft" class="w-4 h-4 stroke-[2.5]" />
          </button>

          <span class="text-xs font-black text-slate-900 tracking-tight">
            {{ isAr ? 'بورصة الأوراق المالية' : 'Stock Exchange' }}
          </span>

          <div class="flex items-center gap-1">
            <button type="button" class="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors">
              <Bookmark class="w-3.5 h-3.5" />
            </button>
            <button type="button" class="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors">
              <Share2 class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <!-- Scrollable Screen Content Body -->
        <div class="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 text-start scroll-smooth">

          <div v-if="type === 'article' && article" class="space-y-4">
            <div class="relative w-full h-44 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-xs">
              <img
                v-if="article.imageUrl"
                :src="resolveAttachmentUrl(article.imageUrl, 'image')"
                :alt="article.titleEn"
                class="w-full h-full object-cover"
                @error="handleImageError($event, 'image')"
              />
              <div v-else class="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-700 text-white">
                <Sparkles class="w-8 h-8 mb-1" />
                <span class="text-[10px] font-bold tracking-wider uppercase">FinWise Research</span>
              </div>

              <!-- Floating Category Pill -->
              <span class="absolute top-2.5 start-2.5 px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold">
                {{ isAr ? (article.categoryArName || article.categoryEnName || 'سوق المال') : (article.categoryEnName || article.categoryArName || 'Markets') }}
              </span>
            </div>

            <div>
              <h2 class="text-sm font-black text-slate-900 leading-snug">
                {{ isAr ? (article.titleAr || article.titleEn) : (article.titleEn || article.titleAr) }}
              </h2>

              <div class="flex items-center gap-3 mt-2.5 text-[10px] text-slate-500 border-y border-slate-100 py-2">
                <div class="flex items-center gap-1 font-semibold text-slate-700">
                  <div class="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[9px] font-black">
                    {{ (article.authorName || 'A')[0] }}
                  </div>
                  <span>{{ article.authorName || 'Analyst' }}</span>
                </div>
                <span>•</span>
                <span class="flex items-center gap-1">
                  <Clock class="w-3 h-3 text-slate-400" />
                  {{ article.readMinutes || 5 }} {{ isAr ? 'دقائق' : 'min' }}
                </span>
                <span>•</span>
                <span class="flex items-center gap-1">
                  <Calendar class="w-3 h-3 text-slate-400" />
                  {{ formatDate(article.publishedAt) }}
                </span>
              </div>
            </div>

            <div class="p-3 rounded-xl bg-emerald-50/70 border-s-4 border-emerald-500 text-[11px] text-emerald-950 font-medium leading-relaxed italic">
              {{ isAr ? (article.excerptAr || article.excerptEn) : (article.excerptEn || article.excerptAr) }}
            </div>

            <div class="text-[11px] text-slate-700 leading-relaxed space-y-2.5">
              <div
                v-if="isAr ? (article.contentAr || article.contentEn) : (article.contentEn || article.contentAr)"
                class="prose prose-xs max-w-none text-slate-700 font-normal leading-relaxed"
                v-html="isAr ? (article.contentAr || article.contentEn) : (article.contentEn || article.contentAr)"
              ></div>
              <div v-else class="space-y-2 text-slate-500">
                <p>{{ isAr ? 'يقدم هذا التقرير التحليلي نظرة شاملة على مستجدات البورصة وسلوك المستثمرين خلال الفترة الحالية.' : 'This report provides in-depth analysis on stock exchange developments and market behavior.' }}</p>
                <p>{{ isAr ? 'يُنصح بمتابعة المؤشرات الفنية ونقاط الدعم والمقاومة قبل اتخاذ القرارات الاستثمارية.' : 'It is advised to follow key technical indicators before making investment decisions.' }}</p>
              </div>
            </div>

            <div class="pt-2 flex flex-wrap gap-1.5">
              <span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[9px] font-semibold">#Stocks</span>
              <span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[9px] font-semibold">#Analysis</span>
              <span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[9px] font-semibold">#Investment</span>
            </div>
          </div>

          <div v-else-if="type === 'video' && video" class="space-y-4">
            <div class="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-md group flex items-center justify-center">
              <img
                v-if="video.thumbnailUrl"
                :src="resolveAttachmentUrl(video.thumbnailUrl, 'image')"
                :alt="video.titleEn"
                class="w-full h-full object-cover opacity-80"
                @error="handleImageError($event, 'image')"
              />
              <div v-else class="w-full h-full bg-gradient-to-tr from-slate-900 via-emerald-950 to-slate-900 opacity-90"></div>

              <div class="absolute inset-0 flex items-center justify-center">
                <div class="w-12 h-12 rounded-full bg-emerald-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <Play class="w-5 h-5 ms-0.5 fill-current" />
                </div>
              </div>

              <div class="absolute bottom-2 inset-x-2 flex items-center justify-between text-[10px] text-white/90 bg-slate-950/70 backdrop-blur-md px-2.5 py-1 rounded-lg">
                <span class="font-mono">00:00 / {{ formatDuration(video.durationSeconds) }}</span>
                <span class="px-1.5 py-0.2 rounded bg-emerald-500/80 text-[9px] font-bold text-white uppercase">HD</span>
              </div>
            </div>

            <div>
              <div class="flex items-center gap-2 mb-1.5">
                <span class="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                  {{ isAr ? (video.categoryArName || video.categoryAr || video.categoryEn || 'تعليمي') : (video.categoryEnName || video.categoryEn || video.categoryAr || 'Educational') }}
                </span>
                <span v-if="video.isPreviewable" class="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[9px] font-bold">
                  {{ isAr ? 'معاينة مجانية' : 'Free Preview' }}
                </span>
              </div>

              <h2 class="text-sm font-black text-slate-900 leading-snug">
                {{ isAr ? (video.titleAr || video.titleEn) : (video.titleEn || video.titleAr) }}
              </h2>

              <div class="flex items-center gap-2 mt-2 text-[11px] text-slate-600">
                <div class="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center font-bold text-[9px]">
                  {{ (video.instructorName || 'I')[0] }}
                </div>
                <span class="font-semibold">{{ video.instructorName || 'Instructor' }}</span>
              </div>
            </div>

            <!-- Description -->
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 leading-relaxed">
              <p class="font-bold text-slate-800 mb-1">{{ isAr ? 'حول هذا الدرس:' : 'About this lesson:' }}</p>
              <p>{{ isAr ? (video.descriptionAr || video.descriptionEn || 'شرح عملي ومبسط حول تحليل حركة الأسهم وإدارة المخاطر.') : (video.descriptionEn || video.descriptionAr || 'Practical hands-on guide covering stock market analysis and risk management.') }}</p>
            </div>

            <!-- What you will learn -->
            <div class="space-y-1.5 pt-1">
              <p class="text-[11px] font-black text-slate-800">{{ isAr ? 'ما ستتعلمه:' : 'What you will learn:' }}</p>
              <div class="flex items-center gap-2 text-[10px] text-slate-600">
                <CheckCircle class="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{{ isAr ? 'قراءة الرسوم البيانية بدقة' : 'Chart pattern recognition' }}</span>
              </div>
              <div class="flex items-center gap-2 text-[10px] text-slate-600">
                <CheckCircle class="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{{ isAr ? 'تحديد نقاط الدخول والخروج' : 'Entry & exit timing' }}</span>
              </div>
            </div>

            <!-- Related / Up Next Lessons -->
            <div v-if="video.relatedVideos && video.relatedVideos.length > 0" class="pt-3 border-t border-slate-100 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-black text-slate-900">{{ isAr ? 'فيديوهات ذات صلة' : 'Related Lessons' }}</span>
                <span class="text-[9px] font-semibold text-emerald-600 font-mono">{{ video.relatedVideos.length }}</span>
              </div>
              <div class="space-y-2">
                <div
                  v-for="rel in video.relatedVideos.slice(0, 3)"
                  :key="rel.id"
                  class="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition-colors"
                >
                  <div class="w-16 h-11 rounded-lg overflow-hidden bg-slate-900 relative shrink-0">
                    <img
                      v-if="rel.thumbnailUrl"
                      :src="resolveAttachmentUrl(rel.thumbnailUrl, 'image')"
                      :alt="rel.titleEn"
                      class="w-full h-full object-cover"
                      @error="handleImageError($event, 'image')"
                    />
                    <div v-else class="w-full h-full flex items-center justify-center bg-slate-900 text-slate-500">
                      <Play class="w-3 h-3 fill-white/80 text-white/80" />
                    </div>
                    <span class="absolute bottom-0.5 right-0.5 text-[7px] font-mono font-bold bg-black/80 text-white px-1 rounded">
                      {{ formatDuration(rel.durationSeconds) }}
                    </span>
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-[10px] font-bold text-slate-800 line-clamp-1 leading-snug">
                      {{ isAr ? (rel.titleAr || rel.titleEn) : (rel.titleEn || rel.titleAr) }}
                    </p>
                    <p class="text-[9px] text-slate-400 truncate mt-0.5">
                      {{ rel.instructorName || (isAr ? 'مدرب معتمد' : 'Instructor') }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ================= SERVICE VIEW ================= -->
          <div v-else-if="type === 'service' && service" class="space-y-4">
            <!-- Service Cover Image (if uploaded) -->
            <div v-if="service.imageUrl" class="w-full h-36 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-2xs">
              <img
                :src="resolveAttachmentUrl(service.imageUrl, 'image')"
                :alt="service.titleEn"
                class="w-full h-full object-cover"
                @error="handleImageError($event, 'image')"
              />
            </div>

            <!-- Service Header Card -->
            <div class="p-5 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white shadow-lg flex flex-col items-center text-center gap-3">
              <div class="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
                <TrendingUp class="w-7 h-7 text-emerald-200" />
              </div>

              <div>
                <h2 class="text-sm font-black text-white">
                  {{ isAr ? (service.titleAr || service.titleEn) : (service.titleEn || service.titleAr) }}
                </h2>
                <p class="text-[10px] text-emerald-100 mt-1">
                  {{ isAr ? (service.descriptionAr || service.descriptionEn) : (service.descriptionEn || service.descriptionAr) }}
                </p>
              </div>

              <span class="px-3 py-1 rounded-full bg-emerald-500/40 text-[9px] font-bold uppercase tracking-wider text-emerald-100">
                {{ isAr ? 'خدمة تعريفية' : 'Informational Service' }}
              </span>
            </div>

            <!-- Features / What this service offers -->
            <div class="bg-white rounded-2xl border border-slate-100 p-3.5 shadow-2xs space-y-2.5">
              <h3 class="text-xs font-black text-slate-800">
                {{ isAr ? 'ما تقدمه هذه الخدمة:' : 'What this service offers:' }}
              </h3>

              <div class="space-y-2 text-[11px] text-slate-600">
                <div class="flex items-start gap-2">
                  <CheckCircle class="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{{ isAr ? 'تغطية تحليلية شاملة لأسواق المال والأسهم' : 'Comprehensive market intelligence & equity coverage' }}</span>
                </div>
                <div class="flex items-start gap-2">
                  <CheckCircle class="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{{ isAr ? 'إحصاءات وبيانات مالية مدققة ومحدثة باستمرار' : 'Regular audited financial indicators & statistics' }}</span>
                </div>
                <div class="flex items-start gap-2">
                  <CheckCircle class="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{{ isAr ? 'توجيهات استثمارية وإرشادية مبنية على معايير مهنية' : 'Professional guidance based on verified market standards' }}</span>
                </div>
              </div>
            </div>

            <!-- Full Service Content -->
            <div
              v-if="isAr ? (service.contentAr || service.contentEn) : (service.contentEn || service.contentAr)"
              class="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-[11px] text-slate-700 leading-relaxed"
              v-html="isAr ? (service.contentAr || service.contentEn) : (service.contentEn || service.contentAr)"
            ></div>

            <!-- Informational Service Note (Showcase only, no order/booking flow) -->
            <div class="p-3.5 rounded-2xl bg-emerald-50/90 border border-emerald-100 flex items-start gap-2.5 text-emerald-950">
              <div class="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <CheckCircle class="w-3.5 h-3.5" />
              </div>
              <div class="text-[10px] leading-relaxed">
                <p class="font-bold text-emerald-900">{{ isAr ? 'خدمة تعريفية وإرشادية للعملاء' : 'Client Informational & Guidance Service' }}</p>
                <p class="text-emerald-700/90 text-[9px] mt-0.5">
                  {{ isAr ? 'هذا المحتوى متاح لاطلاع وتعريف المستثمرين بقدرات المنصة ولا يتطلب أي طلب أو شراء.' : 'Showcased to introduce investors to our platform capabilities with no ordering or purchase required.' }}
                </p>
              </div>
            </div>
          </div>

          <!-- ================= NEWS VIEW ================= -->
          <div v-else-if="type === 'news' && news" class="space-y-4">
            <!-- News Badge & Category -->
            <div class="flex items-center justify-between">
              <span class="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[9px] font-black uppercase tracking-wider">
                {{ isAr ? 'عاجل' : 'Breaking' }}
              </span>
              <span class="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                <Clock class="w-3 h-3" />
                {{ formatDate(news.publishedAt) }}
              </span>
            </div>

            <!-- News Headline -->
            <h2 class="text-sm font-black text-slate-900 leading-snug">
              {{ isAr ? (news.titleAr || news.titleEn) : (news.titleEn || news.titleAr) }}
            </h2>

            <!-- Cover Image -->
            <div v-if="news.imageUrl" class="w-full h-40 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80">
              <img
                :src="resolveAttachmentUrl(news.imageUrl, 'image')"
                :alt="news.titleEn"
                class="w-full h-full object-cover"
                @error="handleImageError($event, 'image')"
              />
            </div>

            <!-- Summary Lead -->
            <div class="p-3 rounded-xl bg-slate-50 border-s-4 border-emerald-600 text-[11px] text-slate-700 font-medium leading-relaxed">
              {{ isAr ? (news.summaryAr || news.summaryEn) : (news.summaryEn || news.summaryAr) }}
            </div>

            <!-- Full News Story -->
            <div class="text-[11px] text-slate-700 leading-relaxed space-y-2">
              <div
                v-if="isAr ? (news.contentAr || news.contentEn) : (news.contentEn || news.contentAr)"
                class="prose prose-xs max-w-none text-slate-700 font-normal leading-relaxed"
                v-html="isAr ? (news.contentAr || news.contentEn) : (news.contentEn || news.contentAr)"
              ></div>
              <div v-else class="space-y-2 text-slate-500">
                <p>{{ isAr ? 'شهدت مؤشرات البورصة اليوم حركة تداولات نشطة وسط إقبال متزايد من المستثمرين المحليين والمؤسسات الاستثمارية.' : 'Stock market indices saw elevated trading volume today driven by institutional and retail participation.' }}</p>
                <p>{{ isAr ? 'وأكد المحللون أن مستويات السيولة تعكس ثقة متزايدة في أداء القطاعات الاقتصادية القيادية.' : 'Analysts highlighted that liquidity conditions reflect growing investor sentiment across leading market sectors.' }}</p>
              </div>
            </div>

            <!-- Source Footer -->
            <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
              <span>{{ isAr ? 'المصدر: غرفة أخبار البورصة' : 'Source: Market News Desk' }}</span>
              <span>#FinWiseNews</span>
            </div>
          </div>

          <!-- ================= EXPERT VIEW ================= -->
          <div v-else-if="type === 'expert' && expert" class="space-y-4">
            <!-- Simulated Top Badge -->
            <div class="flex items-center justify-between">
              <span class="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-bold uppercase tracking-wider border border-emerald-100">
                {{ isAr ? 'خبير معتمد' : 'Verified Expert' }}
              </span>
              <span
                v-if="expert.isFeaturedOnHome"
                class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[9px] font-bold border border-amber-200/60"
              >
                <Star class="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                <span>{{ isAr ? 'مميز بالرئيسية' : 'Featured' }}</span>
              </span>
            </div>

            <!-- Profile Hero in App -->
            <div class="p-5 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-md flex flex-col items-center text-center gap-3">
              <div class="w-20 h-20 rounded-full overflow-hidden bg-white/10 border-2 border-white/20 shadow-inner flex items-center justify-center shrink-0">
                <img
                  v-if="expert.avatarUrl"
                  :src="resolveAttachmentUrl(expert.avatarUrl, 'avatar')"
                  :alt="expert.fullNameEn"
                  class="w-full h-full object-cover"
                  @error="handleImageError($event, 'avatar')"
                />
                <User v-else class="w-10 h-10 text-slate-300" />
              </div>

              <div>
                <h2 class="text-sm font-black text-white">
                  {{ isAr ? (expert.fullNameAr || expert.fullNameEn) : (expert.fullNameEn || expert.fullNameAr) }}
                </h2>
                <p class="text-[10px] text-emerald-300 font-semibold mt-0.5">
                  {{ isAr ? (expert.titleAr || expert.titleEn) : (expert.titleEn || expert.titleAr) }}
                </p>
              </div>

              <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold"
                :class="expert.isActive ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30' : 'bg-slate-700 text-slate-300'"
              >
                <span class="w-1.5 h-1.5 rounded-full" :class="expert.isActive ? 'bg-emerald-400' : 'bg-slate-400'"></span>
                <span>{{ expert.isActive ? (isAr ? 'متاح للاستشارات والتحليل' : 'Active Analyst') : (isAr ? 'غير متاح حالياً' : 'Currently Inactive') }}</span>
              </div>
            </div>

            <!-- Expert Info Card -->
            <div class="bg-white rounded-2xl border border-slate-100 p-3.5 shadow-2xs space-y-2.5">
              <h3 class="text-xs font-black text-slate-800">
                {{ isAr ? 'المجالات الاستشارية:' : 'Consultation Areas:' }}
              </h3>
              <div class="space-y-2 text-[11px] text-slate-600">
                <div class="flex items-start gap-2">
                  <CheckCircle class="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{{ isAr ? 'تحليل القوائم المالية وتقارير الشركات' : 'Financial statements & company report analysis' }}</span>
                </div>
                <div class="flex items-start gap-2">
                  <CheckCircle class="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{{ isAr ? 'متابعة حركة السيولة والمؤشرات الفنية' : 'Liquidity trends & technical chart patterns' }}</span>
                </div>
                <div class="flex items-start gap-2">
                  <CheckCircle class="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{{ isAr ? 'تقديم رؤى استثمارية وتوصيات إرشادية' : 'Market insights & strategic investment guidance' }}</span>
                </div>
              </div>
            </div>

            <!-- Disclaimer Box -->
            <div class="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-[10px] text-slate-500 leading-relaxed text-center">
              {{ isAr ? 'تحليلات الخبير تعبر عن رؤيته المهنية بهدف التوعية والتثقيف المالي.' : 'Expert views represent professional commentary intended for market awareness.' }}
            </div>
          </div>

          <!-- Slot Fallback -->
          <div v-else-if="$slots.default">
            <slot />
          </div>

          <!-- Empty fallback -->
          <div v-else class="py-20 flex flex-col items-center justify-center text-center text-slate-400">
            <Layers class="w-10 h-10 mb-2 stroke-1" />
            <p class="text-xs font-semibold">{{ isAr ? 'لا توجد بيانات متاحة للمعاينة' : 'No data available to preview' }}</p>
          </div>

        </div>

        <!-- Phone Bottom Home Bar Indicator -->
        <div class="h-6 w-full flex items-center justify-center shrink-0 bg-white select-none">
          <div class="w-28 h-1 bg-slate-800/80 rounded-full"></div>
        </div>

      </div>
    </div>
  </div>
</template>
