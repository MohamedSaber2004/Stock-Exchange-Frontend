<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  status?: string
  label?: string
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'neutral'
  size?: 'sm' | 'md'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'sm'
})

const { t, locale } = useI18n()
const isAr = computed(() => locale.value === 'ar')

const badgeStyle = computed(() => {
  const s = (props.status || '').toUpperCase()

  if (props.variant === 'success' || ['PUBLISHED', 'ACTIVE', 'FREE', 'ONLINE', 'RESOLVED'].includes(s)) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  }
  if (props.variant === 'warning' || ['DRAFT', 'BASIC', 'PENDING', 'WARNING', 'IN PROGRESS', 'INACTIVE'].includes(s)) {
    return 'bg-amber-50 text-amber-700 border-amber-200'
  }
  if (props.variant === 'danger' || ['BREAKING', 'EXPIRED', 'SUSPENDED', 'DELETED', 'LIVE', 'ERROR', 'HIGH'].includes(s)) {
    return s === 'BREAKING' || s === 'LIVE'
      ? 'bg-rose-500 text-white font-bold tracking-wider'
      : 'bg-rose-50 text-rose-700 border-rose-200'
  }
  if (props.variant === 'purple' || ['PRO', 'POPULAR', 'PREMIUM'].includes(s)) {
    return 'bg-indigo-50 text-indigo-700 border-indigo-200 font-bold'
  }
  if (props.variant === 'info' || ['PAYMENT', 'ARTICLE', 'VIDEO', 'USER', 'OPEN', 'MEDIUM', 'UPDATE'].includes(s)) {
    return 'bg-slate-100 text-slate-700 border-slate-200'
  }

  return 'bg-slate-100 text-slate-700 border-slate-200'
})

const displayStatus = computed(() => {
  if (props.label) return props.label
  const s = props.status || ''
  const upper = s.toUpperCase()

  if (isAr.value) {
    if (upper === 'ACTIVE') return t('common.active')
    if (upper === 'INACTIVE') return t('common.inactive')
    if (upper === 'PUBLISHED') return t('common.published')
    if (upper === 'DRAFT') return t('common.draft')
    if (upper === 'EXPIRED') return t('common.expired')
    if (upper === 'SUSPENDED') return t('common.suspended')
    if (upper === 'FREE') return t('users.planFree') || 'مجاني'
    if (upper === 'BASIC') return t('users.planBasic') || 'أساسي'
    if (upper === 'PRO') return t('users.planPro') || 'احترافي'
    if (upper === 'LIVE') return t('news.badgeLive')
    if (upper === 'BREAKING') return t('news.badgeBreaking')
    if (upper === 'UPDATE') return t('news.badgeUpdate')
    if (upper === 'OPEN') return 'مفتوحة'
    if (upper === 'IN PROGRESS') return 'قيد التنفيذ'
    if (upper === 'RESOLVED') return 'تم الحل'
    if (upper === 'PAYMENT') return 'مدفوعات'
    if (upper === 'USER') return 'مستخدم'
    if (upper === 'ARTICLE') return 'مقال'
    if (upper === 'VIDEO') return 'فيديو'
    if (upper === 'NEWS') return 'أخبار'
    if (upper === 'SYSTEM') return 'نظام'
  }

  return s
})
</script>

<template>
  <span
    :class="[
      'inline-flex items-center justify-center font-semibold rounded-full select-none border transition-colors',
      !isAr ? 'uppercase tracking-wider' : '',
      size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs',
      badgeStyle
    ]"
  >
    <slot>{{ displayStatus }}</slot>
  </span>
</template>
