<script setup lang="ts">
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()
const isAr = computed(() => locale.value === 'ar')

interface ActivityItem {
  id: string
  user: string
  action: string
  actionAr?: string
  type: string
  time: string
  timeAr?: string
}

interface Props {
  activities?: ActivityItem[]
}

const defaultActivities = computed<ActivityItem[]>(() => [
  { 
    id: '1', 
    user: isAr.value ? 'أحمد محمد' : 'Ahmed Mohamed', 
    action: 'Purchased Pro plan', 
    actionAr: 'اشترك بالخطة الاحترافية (Pro)', 
    type: 'Payment', 
    time: '2m ago',
    timeAr: 'منذ دقيقتين'
  },
  { 
    id: '2', 
    user: isAr.value ? 'سارة علي' : 'Sara Ali', 
    action: 'Created new account', 
    actionAr: 'أنشأت حساب مستخدم جديد', 
    type: 'User', 
    time: '8m ago',
    timeAr: 'منذ 8 دقائق'
  },
  { 
    id: '3', 
    user: isAr.value ? 'المدير' : 'Admin', 
    action: 'Added new article', 
    actionAr: 'نشر مقال تعليمي جديد', 
    type: 'Article', 
    time: '15m ago',
    timeAr: 'منذ 15 دقيقة'
  },
  { 
    id: '4', 
    user: isAr.value ? 'محمد حسن' : 'Mohamed Hassan', 
    action: 'Published new video', 
    actionAr: 'رفع فيديو تعليمي جديد', 
    type: 'Video', 
    time: '35m ago',
    timeAr: 'منذ 35 دقيقة'
  },
])

const props = defineProps<Props>()
const activitiesList = computed(() => props.activities || defaultActivities.value)

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'Payment': return isAr.value ? 'مدفوعات' : 'Payment'
    case 'User': return isAr.value ? 'مستخدم' : 'User'
    case 'Article': return isAr.value ? 'مقال' : 'Article'
    case 'Video': return isAr.value ? 'فيديو' : 'Video'
    case 'News': return isAr.value ? 'أخبار' : 'News'
    case 'System': return isAr.value ? 'نظام' : 'System'
    default: return type
  }
}
</script>

<template>
  <div class="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
    <div class="p-4 border-b border-slate-100 flex items-center justify-between">
      <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider">
        {{ t('dashboard.recentActivity') }}
      </h3>
      <RouterLink 
        to="/activity" 
        class="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors inline-flex items-center gap-1 group"
      >
        <span>{{ t('dashboard.viewAll') }}</span>
        <span class="group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 rtl:rotate-180 transition-transform">→</span>
      </RouterLink>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-start text-xs min-w-[500px]">
        <thead>
          <tr class="text-[11px] font-bold text-slate-400 border-b border-slate-100 uppercase tracking-wider bg-slate-50/40">
            <th class="py-2.5 px-4 text-start">{{ t('dashboard.userCol') }}</th>
            <th class="py-2.5 px-4 text-start">{{ t('dashboard.actionCol') }}</th>
            <th class="py-2.5 px-4 text-start">{{ t('dashboard.typeCol') }}</th>
            <th class="py-2.5 px-4 text-start">{{ t('dashboard.timeCol') }}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="act in activitiesList" :key="act.id" class="hover:bg-slate-50/60 transition-colors">
            <td class="py-3 px-4 font-bold text-slate-800 text-start">{{ act.user }}</td>
            <td class="py-3 px-4 text-slate-600 font-medium text-start">
              {{ isAr ? (act.actionAr || act.action) : act.action }}
            </td>
            <td class="py-3 px-4 text-start">
              <StatusBadge :status="act.type" variant="info">
                {{ getTypeLabel(act.type) }}
              </StatusBadge>
            </td>
            <td class="py-3 px-4 text-slate-400 font-medium text-start">
              {{ isAr ? (act.timeAr || act.time) : act.time }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
