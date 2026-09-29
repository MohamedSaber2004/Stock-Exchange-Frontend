<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { TrendingUp, Mail, ArrowRight, ArrowLeft, ShieldCheck, KeyRound } from 'lucide-vue-next'
import { useFeedback } from '@/composables/useFeedback'
import { useI18n } from 'vue-i18n'
import LanguageSwitcher from '@/components/ui/LanguageSwitcher.vue'

const router = useRouter()
const { toast } = useFeedback()
const { t, locale } = useI18n()
const isAr = computed(() => locale.value === 'ar')

const email = ref('admin@gmail.com')
const isLoading = ref(false)

const handleSendOtp = () => {
  if (!email.value) {
    toast.error(isAr.value ? 'يرجى إدخال عنوان بريدك الإلكتروني المسجل' : 'Please enter your registered email address')
    return
  }

  isLoading.value = true

  setTimeout(() => {
    isLoading.value = false
    toast.success(
      isAr.value ? `تم إرسال رمز التحقق إلى ${email.value}` : `Verification code sent to ${email.value}`,
      isAr.value ? 'تم إرسال رمز التحقق' : 'OTP Dispatched'
    )
    router.push({
      path: '/verify-otp',
      query: { email: email.value }
    })
  }, 500)
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 select-none relative">
    <!-- Language Switcher in Top Corner -->
    <div class="absolute top-4 end-4 sm:top-6 sm:end-6 z-20">
      <LanguageSwitcher variant="auth" />
    </div>

    <div class="w-full max-w-4xl bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2">

      <!-- Left Side: Form -->
      <div class="p-8 sm:p-12 flex flex-col justify-between">
        <!-- Top: Logo -->
        <div>
          <div class="flex items-center gap-2 mb-8">
            <div class="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white shadow-sm shadow-emerald-500/30">
              <TrendingUp class="w-4 h-4 stroke-[2.5]" />
            </div>
            <div class="flex items-center">
              <span class="font-extrabold text-lg tracking-tight text-slate-900">Fin</span>
              <span class="font-extrabold text-lg tracking-tight text-emerald-600">Wise</span>
            </div>
          </div>

          <!-- Heading with Identity Icon -->
          <div class="mb-8">
            <div class="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100/80 text-emerald-600 flex items-center justify-center mb-4 shadow-sm">
              <KeyRound class="w-6 h-6 stroke-[2.2]" />
            </div>
            <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {{ t('auth.forgotPasswordTitle') }}
            </h1>
            <p class="text-xs text-slate-500 mt-1.5 font-medium leading-relaxed">
              {{ t('auth.forgotPasswordDesc') }}
            </p>
          </div>

          <!-- Form -->
          <form @submit.prevent="handleSendOtp" class="flex flex-col gap-4">
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">{{ t('auth.email') }}</label>
              <div class="relative">
                <Mail class="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  v-model="email"
                  type="email"
                  required
                  placeholder="admin@finwise.com"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl ps-10 pe-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              :disabled="isLoading"
              class="w-full mt-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{{ isLoading ? t('auth.sendingOtp') : t('auth.sendOtp') }}</span>
              <ArrowRight v-if="!isLoading" class="w-3.5 h-3.5 rtl:rotate-180" />
            </button>
          </form>

          <!-- Back to Login -->
          <div class="mt-6 text-center">
            <RouterLink
              to="/login"
              class="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-600 transition-colors"
            >
              <ArrowLeft class="w-3.5 h-3.5 rtl:rotate-180" />
              <span>{{ t('auth.backToLogin') }}</span>
            </RouterLink>
          </div>
        </div>

        <!-- Footnote -->
        <div class="mt-8 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
          <ShieldCheck class="w-3.5 h-3.5 text-emerald-600" />
          <span>{{ t('auth.secureAccess') }}</span>
        </div>
      </div>

      <!-- Right Side: Brand Recovery Graphic Card -->
      <div class="hidden md:flex flex-col justify-center items-center p-12 bg-gradient-to-br from-emerald-50/60 via-teal-50/40 to-slate-50 border-s border-slate-100 relative overflow-hidden">
        <div class="absolute -right-20 -top-20 w-64 h-64 bg-emerald-200/40 rounded-full blur-3xl" />
        <div class="absolute -left-20 -bottom-20 w-64 h-64 bg-teal-200/40 rounded-full blur-3xl" />

        <div class="relative z-10 flex flex-col items-center text-center max-w-xs">
          <!-- Identity Key & Lock Graphic Badge -->
          <div class="w-24 h-24 rounded-3xl bg-white border border-emerald-100 shadow-xl shadow-emerald-500/10 flex items-center justify-center mb-6">
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md">
              <KeyRound class="w-8 h-8 stroke-[2.2]" />
            </div>
          </div>

          <h2 class="text-lg font-black text-slate-900 tracking-tight leading-snug">
            {{ t('auth.protectedAdminAccess') }}<br />
            <span class="text-emerald-600">{{ t('auth.fastTokenRecovery') }}</span>
          </h2>

          <p class="text-xs text-slate-500 mt-2.5 font-medium leading-relaxed">
            {{ t('auth.forgotQuote') }}
          </p>
        </div>
      </div>

    </div>
  </div>
</template>
