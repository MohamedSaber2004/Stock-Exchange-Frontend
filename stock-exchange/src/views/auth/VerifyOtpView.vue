<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { TrendingUp, ArrowRight, ArrowLeft, ShieldCheck, CheckCircle2, RotateCw, Smartphone, Shield } from 'lucide-vue-next'
import { useFeedback } from '@/composables/useFeedback'
import { useI18n } from 'vue-i18n'
import LanguageSwitcher from '@/components/ui/LanguageSwitcher.vue'

const router = useRouter()
const route = useRoute()
const { toast } = useFeedback()
const { t, locale } = useI18n()
const isAr = computed(() => locale.value === 'ar')

const email = ref((route.query.email as string) || 'admin@gmail.com')
const digits = ref(['', '', '', '', '', ''])
const inputRefs = ref<HTMLInputElement[]>([])
const isLoading = ref(false)
const resendTimer = ref(60)
let timerInterval: any = null

const startTimer = () => {
  resendTimer.value = 60
  clearInterval(timerInterval)
  timerInterval = setInterval(() => {
    if (resendTimer.value > 0) {
      resendTimer.value--
    } else {
      clearInterval(timerInterval)
    }
  }, 1000)
}

onMounted(() => {
  startTimer()
  setTimeout(() => {
    inputRefs.value[0]?.focus()
  }, 100)
})

onUnmounted(() => {
  clearInterval(timerInterval)
})

const handleInput = (index: number, event: Event) => {
  const target = event.target as HTMLInputElement
  const value = target.value

  if (!/^\d*$/.test(value)) {
    digits.value[index] = ''
    return
  }

  if (value && index < 5) {
    inputRefs.value[index + 1]?.focus()
  }
}

const handleKeyDown = (index: number, event: KeyboardEvent) => {
  if (event.key === 'Backspace' && !digits.value[index] && index > 0) {
    inputRefs.value[index - 1]?.focus()
  }
}

const handlePaste = (event: ClipboardEvent) => {
  event.preventDefault()
  const pasted = event.clipboardData?.getData('text') || ''
  const cleanDigits = pasted.replace(/\D/g, '').slice(0, 6).split('')
  
  cleanDigits.forEach((d, idx) => {
    if (idx < 6) digits.value[idx] = d
  })

  if (cleanDigits.length > 0) {
    const nextIdx = Math.min(cleanDigits.length, 5)
    inputRefs.value[nextIdx]?.focus()
  }
}

const handleResend = () => {
  if (resendTimer.value > 0) return
  toast.success(isAr.value ? 'تم إرسال رمز تحقق جديد مكون من 6 أرقام!' : 'A new 6-digit OTP code has been dispatched!')
  startTimer()
}

const handleVerify = () => {
  const code = digits.value.join('')
  if (code.length < 6) {
    toast.error(isAr.value ? 'يرجى إدخال جميع الأرقام الستة لرمز التحقق' : 'Please enter all 6 digits of the OTP code')
    return
  }

  isLoading.value = true

  setTimeout(() => {
    isLoading.value = false
    toast.success(
      isAr.value ? 'تم التحقق من الرمز بنجاح!' : 'Code verified successfully!',
      isAr.value ? 'تم التحقق' : 'Verified'
    )
    router.push({
      path: '/reset-password',
      query: { email: email.value, otp: code }
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

      <!-- Left Side: OTP Form -->
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
              <Smartphone class="w-6 h-6 stroke-[2.2]" />
            </div>
            <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {{ t('auth.verifyOtpTitle') }}
            </h1>
            <p class="text-xs text-slate-500 mt-1.5 font-medium leading-relaxed">
              {{ t('auth.verifyOtpDesc') }} <strong class="text-slate-800 dir-ltr">{{ email }}</strong>
            </p>
          </div>

          <!-- 6-digit OTP Inputs -->
          <form @submit.prevent="handleVerify" class="flex flex-col gap-6">
            <div class="flex items-center justify-between gap-2" dir="ltr" @paste="handlePaste">
              <input
                v-for="(_, index) in 6"
                :key="index"
                ref="inputRefs"
                v-model="digits[index]"
                type="text"
                maxlength="1"
                inputmode="numeric"
                autocomplete="one-time-code"
                class="w-11 sm:w-12 h-12 sm:h-13 text-center text-lg font-black text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition-all shadow-2xs"
                @input="handleInput(index, $event)"
                @keydown="handleKeyDown(index, $event)"
              />
            </div>

            <!-- Resend action -->
            <div class="flex items-center justify-between text-xs">
              <span class="text-slate-500 font-medium">{{ t('auth.didntReceiveCode') }}</span>
              <button
                type="button"
                :disabled="resendTimer > 0"
                @click="handleResend"
                class="font-bold inline-flex items-center gap-1 transition-colors cursor-pointer disabled:text-slate-400 disabled:cursor-not-allowed text-emerald-600 hover:text-emerald-700"
              >
                <RotateCw class="w-3 h-3" />
                <span>{{ resendTimer > 0 ? `${t('auth.resendIn')} ${resendTimer}s` : t('auth.resendCode') }}</span>
              </button>
            </div>

            <!-- Verify Button -->
            <button
              type="submit"
              :disabled="isLoading || digits.join('').length < 6"
              class="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{{ isLoading ? t('auth.verifyingOtp') : t('auth.verifyContinue') }}</span>
              <ArrowRight v-if="!isLoading" class="w-3.5 h-3.5 rtl:rotate-180" />
            </button>
          </form>

          <!-- Back to Change Email -->
          <div class="mt-6 text-center">
            <RouterLink
              to="/forgot-password"
              class="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-600 transition-colors"
            >
              <ArrowLeft class="w-3.5 h-3.5 rtl:rotate-180" />
              <span>{{ t('auth.changeEmail') }}</span>
            </RouterLink>
          </div>
        </div>

        <!-- Footnote -->
        <div class="mt-8 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
          <ShieldCheck class="w-3.5 h-3.5 text-emerald-600" />
          <span>{{ t('auth.encryptedToken') }}</span>
        </div>
      </div>

      <!-- Right Side: Brand OTP Illustration Card -->
      <div class="hidden md:flex flex-col justify-center items-center p-12 bg-gradient-to-br from-emerald-50/60 via-teal-50/40 to-slate-50 border-s border-slate-100 relative overflow-hidden">
        <div class="absolute -right-20 -top-20 w-64 h-64 bg-emerald-200/40 rounded-full blur-3xl" />
        <div class="absolute -left-20 -bottom-20 w-64 h-64 bg-teal-200/40 rounded-full blur-3xl" />

        <div class="relative z-10 flex flex-col items-center text-center max-w-xs">
          <!-- Identity Smartphone & Shield Graphic Badge -->
          <div class="w-24 h-24 rounded-3xl bg-white border border-emerald-100 shadow-xl shadow-emerald-500/10 flex items-center justify-center mb-6">
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md">
              <ShieldCheck class="w-8 h-8 stroke-[2.2]" />
            </div>
          </div>

          <h2 class="text-lg font-black text-slate-900 tracking-tight leading-snug">
            {{ t('auth.twoFactorProtection') }}<br />
            <span class="text-emerald-600">{{ t('auth.zeroTrustSecurity') }}</span>
          </h2>

          <p class="text-xs text-slate-500 mt-2.5 font-medium leading-relaxed">
            {{ t('auth.verifyQuote') }}
          </p>
        </div>
      </div>

    </div>
  </div>
</template>
