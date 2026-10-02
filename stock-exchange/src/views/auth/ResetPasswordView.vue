<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import {
  TrendingUp,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-vue-next'
import { useFeedback } from '@/composables/useFeedback'
import { coreServices } from '@/di'
import { useI18n } from 'vue-i18n'
import LanguageSwitcher from '@/components/ui/LanguageSwitcher.vue'
import { extractApiErrors } from '@/domain/models/common.model'

const router = useRouter()
const route = useRoute()
const { toast } = useFeedback()
const { t, locale } = useI18n()
const isAr = computed(() => locale.value === 'ar')

const email = ref((route.query.email as string) || '')
const resetToken = ref(
  (route.query.token as string) || (route.query.otp as string) || ''
)

const newPassword = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isLoading = ref(false)

const fieldErrors = ref<Record<string, string>>({})
const generalError = ref<string | null>(null)

onMounted(() => {
  if (!email.value || !resetToken.value) {
    toast.warning(
      isAr.value
        ? 'رمز إعادة التعيين مفقود، يرجى إعادة طلب رمز التحقق'
        : 'Reset token is missing. Please request a verification code again.'
    )
    router.replace('/forgot-password')
  }
})

// Strength criteria
const hasMinLength = computed(() => newPassword.value.length >= 8)
const hasNumber = computed(() => /\d/.test(newPassword.value))
const hasUppercase = computed(() => /[A-Z]/.test(newPassword.value))
const hasSpecial = computed(() => /[^A-Za-z0-9]/.test(newPassword.value))

const strengthScore = computed(() => {
  let score = 0
  if (hasMinLength.value) score++
  if (hasNumber.value) score++
  if (hasUppercase.value) score++
  if (hasSpecial.value) score++
  return score
})

const strengthLabel = computed(() => {
  if (strengthScore.value <= 1)
    return { text: t('auth.weak'), color: 'bg-rose-500', textClass: 'text-rose-600' }
  if (strengthScore.value <= 3)
    return { text: t('auth.moderate'), color: 'bg-amber-500', textClass: 'text-amber-600' }
  return { text: t('auth.strong'), color: 'bg-emerald-500', textClass: 'text-emerald-600' }
})

const passwordsMatch = computed(() => {
  return (
    newPassword.value &&
    confirmPassword.value &&
    newPassword.value === confirmPassword.value
  )
})

const clearFieldError = (field: string) => {
  if (fieldErrors.value[field]) {
    delete fieldErrors.value[field]
  }
  generalError.value = null
}

const handleResetPassword = async () => {
  fieldErrors.value = {}
  generalError.value = null

  if (!newPassword.value || !confirmPassword.value) {
    toast.error(
      isAr.value ? 'يرجى إدخال وتأكيد كلمة المرور الجديدة' : 'Please enter and confirm your new password'
    )
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    fieldErrors.value.confirmPassword = isAr.value
      ? 'كلمتا المرور غير متطابقتين'
      : 'Passwords do not match'
    return
  }

  if (newPassword.value.length < 8) {
    fieldErrors.value.newPassword = isAr.value
      ? 'يجب أن تتكون كلمة المرور من 8 أحرف على الأقل'
      : 'Password must be at least 8 characters long'
    return
  }

  isLoading.value = true

  try {
    await coreServices.auth.resetPassword({
      email: email.value,
      otpCode: resetToken.value,
      newPassword: newPassword.value,
      confirmPassword: confirmPassword.value,
    })

    toast.success(
      isAr.value
        ? 'تمت إعادة تعيين كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول.'
        : 'Your password has been reset successfully! You can now sign in.',
      isAr.value ? 'تم تحديث كلمة المرور' : 'Password Updated'
    )

    router.push('/login')
  } catch (err: unknown) {
    const extracted = extractApiErrors(err)
    fieldErrors.value = extracted.fieldErrors
    generalError.value = extracted.generalMessage

    toast.error(
      extracted.generalMessage,
      isAr.value ? 'فشل إعادة التعيين' : 'Reset Failed'
    )
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 select-none relative">
    <!-- Language Switcher in Top Corner -->
    <div class="absolute top-4 end-4 sm:top-6 sm:end-6 z-20">
      <LanguageSwitcher variant="auth" />
    </div>

    <div class="w-full max-w-4xl bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2">

      <!-- Left Side: Password Form -->
      <div class="p-5 sm:p-8 md:p-12 flex flex-col justify-between">
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
          <div class="mb-6">
            <div class="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100/80 text-emerald-600 flex items-center justify-center mb-4 shadow-sm">
              <Lock class="w-6 h-6 stroke-[2.2]" />
            </div>
            <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {{ t('auth.resetPasswordTitle') }}
            </h1>
            <p class="text-xs text-slate-500 mt-1.5 font-medium leading-relaxed">
              {{ t('auth.resetPasswordDesc') }} <strong class="text-slate-800 dir-ltr">{{ email }}</strong>
            </p>
          </div>

          <!-- General Backend Error Banner -->
          <div
            v-if="generalError"
            class="mb-4 p-3 rounded-xl bg-rose-50/90 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2.5 animate-fadeIn"
          >
            <AlertCircle class="w-4 h-4 shrink-0 text-rose-600" />
            <span class="leading-relaxed">{{ generalError }}</span>
          </div>

          <!-- Form -->
          <form @submit.prevent="handleResetPassword" class="flex flex-col gap-4">
            <!-- New Password -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">{{ t('auth.newPassword') }}</label>
              <div class="relative">
                <Lock class="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  v-model="newPassword"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="new-password"
                  required
                  placeholder="••••••••"
                  :class="[
                    'w-full bg-slate-50 border rounded-xl ps-10 pe-10 py-2.5 text-xs text-slate-900 transition-all focus:outline-none focus:bg-white',
                    fieldErrors.newPassword
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10'
                      : 'border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10'
                  ]"
                  @input="clearFieldError('newPassword')"
                />
                <button
                  type="button"
                  tabindex="-1"
                  @click="showPassword = !showPassword"
                  class="absolute end-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <EyeOff v-if="showPassword" class="w-4 h-4" />
                  <Eye v-else class="w-4 h-4" />
                </button>
              </div>
              <p v-if="fieldErrors.newPassword" class="text-[11px] text-rose-600 font-bold mt-0.5">
                {{ fieldErrors.newPassword }}
              </p>

              <!-- Password Strength Bar -->
              <div v-if="newPassword" class="mt-1 flex flex-col gap-1">
                <div class="flex items-center justify-between text-[10px] font-bold">
                  <span class="text-slate-400">{{ t('auth.strength') }}:</span>
                  <span :class="strengthLabel.textClass">{{ strengthLabel.text }}</span>
                </div>
                <div class="grid grid-cols-4 gap-1 h-1 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    v-for="idx in 4"
                    :key="idx"
                    :class="[
                      'h-full rounded-full transition-all duration-300',
                      idx <= strengthScore ? strengthLabel.color : 'bg-slate-200'
                    ]"
                  />
                </div>
              </div>
            </div>

            <!-- Confirm Password -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">{{ t('auth.confirmPassword') }}</label>
              <div class="relative">
                <Lock class="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  v-model="confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  autocomplete="new-password"
                  required
                  placeholder="••••••••"
                  :class="[
                    'w-full bg-slate-50 border rounded-xl ps-10 pe-10 py-2.5 text-xs text-slate-900 transition-all focus:outline-none focus:bg-white',
                    fieldErrors.confirmPassword
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10'
                      : 'border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10'
                  ]"
                  @input="clearFieldError('confirmPassword')"
                />
                <button
                  type="button"
                  tabindex="-1"
                  @click="showConfirmPassword = !showConfirmPassword"
                  class="absolute end-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <EyeOff v-if="showConfirmPassword" class="w-4 h-4" />
                  <Eye v-else class="w-4 h-4" />
                </button>
              </div>
              <p v-if="fieldErrors.confirmPassword" class="text-[11px] text-rose-600 font-bold mt-0.5">
                {{ fieldErrors.confirmPassword }}
              </p>

              <div v-if="confirmPassword" class="flex items-center gap-1.5 mt-0.5 text-[10px]">
                <Check v-if="passwordsMatch" class="w-3.5 h-3.5 text-emerald-600" />
                <span :class="passwordsMatch ? 'text-emerald-600 font-bold' : 'text-rose-500 font-bold'">
                  {{ passwordsMatch ? t('auth.passwordsMatch') : t('auth.passwordsMismatch') }}
                </span>
              </div>
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              :disabled="isLoading || !passwordsMatch || newPassword.length < 8"
              class="w-full mt-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <Loader2 v-if="isLoading" class="w-4 h-4 animate-spin" />
              <span>{{ isLoading ? t('auth.savingPassword') : t('auth.saveSignIn') }}</span>
              <ArrowRight v-if="!isLoading" class="w-3.5 h-3.5 rtl:rotate-180" />
            </button>
          </form>

          <!-- Back to Login -->
          <div class="mt-6 text-center">
            <RouterLink
              to="/login"
              class="text-xs font-bold text-slate-600 hover:text-emerald-600 transition-colors"
            >
              {{ t('auth.backToLogin') }}
            </RouterLink>
          </div>
        </div>

        <!-- Footnote -->
        <div class="mt-8 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
          <ShieldCheck class="w-3.5 h-3.5 text-emerald-600" />
          <span>{{ t('auth.encryptionProtected') }}</span>
        </div>
      </div>

      <!-- Right Side: Brand Password Security Graphic Card -->
      <div class="hidden md:flex flex-col justify-center items-center p-12 bg-gradient-to-br from-emerald-50/60 via-teal-50/40 to-slate-50 border-s border-slate-100 relative overflow-hidden">
        <div class="absolute -right-20 -top-20 w-64 h-64 bg-emerald-200/40 rounded-full blur-3xl" />
        <div class="absolute -left-20 -bottom-20 w-64 h-64 bg-teal-200/40 rounded-full blur-3xl" />

        <div class="relative z-10 flex flex-col items-center text-center max-w-xs">
          <!-- Identity Security Shield Graphic Badge -->
          <div class="w-24 h-24 rounded-3xl bg-white border border-emerald-100 shadow-xl shadow-emerald-500/10 flex items-center justify-center mb-6">
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md">
              <Lock class="w-8 h-8 stroke-[2.2]" />
            </div>
          </div>

          <h2 class="text-lg font-black text-slate-900 tracking-tight leading-snug">
            {{ t('auth.advancedVaultSecurity') }}<br />
            <span class="text-emerald-600">{{ t('auth.enterpriseCredentials') }}</span>
          </h2>

          <p class="text-xs text-slate-500 mt-2.5 font-medium leading-relaxed">
            {{ t('auth.resetQuote') }}
          </p>
        </div>
      </div>

    </div>
  </div>
</template>
