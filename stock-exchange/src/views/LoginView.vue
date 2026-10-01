<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import {
  TrendingUp,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  AlertTriangle,
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
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const isLoading = ref(false)

const fieldErrors = ref<Record<string, string>>({})
const generalError = ref<string | null>(null)
const isSessionExpired = ref(false)

onMounted(() => {
  if (route.query.session_expired === 'true') {
    isSessionExpired.value = true
    toast.warning(
      isAr.value
        ? 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً للمتابعة.'
        : 'Your session has expired. Please sign in again.',
      isAr.value ? 'جلسة منتهية' : 'Session Expired'
    )
  }

  if (route.query.forbidden === 'true') {
    generalError.value = isAr.value
      ? 'عفواً، لا تملك الصلاحيات الكافية للوصول إلى لوحة التحكم.'
      : 'You do not have administrative privileges to access this dashboard.'
  }
})

const clearFieldError = (field: string) => {
  if (fieldErrors.value[field]) {
    delete fieldErrors.value[field]
  }
  generalError.value = null
}

const handleLogin = async () => {
  fieldErrors.value = {}
  generalError.value = null

  if (!email.value.trim()) {
    fieldErrors.value.email = isAr.value
      ? 'يرجى إدخال البريد الإلكتروني'
      : 'Please enter your email address'
  }
  if (!password.value) {
    fieldErrors.value.password = isAr.value
      ? 'يرجى إدخال كلمة المرور'
      : 'Please enter your password'
  }

  if (Object.keys(fieldErrors.value).length > 0) {
    return
  }

  isLoading.value = true

  try {
    const authData = await coreServices.auth.login({
      email: email.value.trim(),
      password: password.value,
    })

    toast.success(
      isAr.value ? `مرحباً بعودتك، ${authData.fullName}` : `Welcome back, ${authData.fullName}`,
      isAr.value ? 'تم تسجيل الدخول بنجاح' : 'Signed In Successfully'
    )

    const redirectPath = (route.query.redirect as string) || '/'
    router.push(redirectPath)
  } catch (err: unknown) {
    const extracted = extractApiErrors(err)
    fieldErrors.value = extracted.fieldErrors
    generalError.value = extracted.generalMessage

    toast.error(
      extracted.generalMessage,
      isAr.value ? 'تعذر تسجيل الدخول' : 'Sign In Failed'
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

      <!-- Left Side: Login Form -->
      <div class="p-6 sm:p-8 md:p-12 flex flex-col justify-between">
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

          <div class="mb-6">
            <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {{ t('auth.welcomeBack') }}
            </h1>
            <p class="text-xs text-slate-500 mt-1 font-medium">
              {{ t('auth.signInSubtitle') }}
            </p>
          </div>

          <!-- Session Expired Alert Banner -->
          <div
            v-if="isSessionExpired"
            class="mb-4 p-3 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs font-medium flex items-center gap-2.5 animate-fadeIn"
          >
            <AlertTriangle class="w-4 h-4 shrink-0 text-amber-600" />
            <span>{{ isAr ? 'انتهت جلستك لأسباب أمنية، يرجى تسجيل الدخول مجدداً للمتابعة.' : 'Your session expired. Please sign in again.' }}</span>
          </div>

          <!-- General Backend Error Banner -->
          <div
            v-if="generalError"
            class="mb-4 p-3 rounded-xl bg-rose-50/90 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2.5 animate-fadeIn"
          >
            <AlertCircle class="w-4 h-4 shrink-0 text-rose-600" />
            <span class="leading-relaxed">{{ generalError }}</span>
          </div>

          <form @submit.prevent="handleLogin" class="flex flex-col gap-4">
            <!-- Email -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">{{ t('auth.email') }}</label>
              <div class="relative">
                <Mail class="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  v-model="email"
                  type="email"
                  autocomplete="email"
                  required
                  placeholder="admin@finwise.com"
                  :class="[
                    'w-full bg-slate-50 border rounded-xl ps-10 pe-4 py-2.5 text-xs text-slate-900 transition-all focus:outline-none focus:bg-white',
                    fieldErrors.email
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10'
                      : 'border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10'
                  ]"
                  @input="clearFieldError('email')"
                />
              </div>
              <p v-if="fieldErrors.email" class="text-[11px] text-rose-600 font-bold mt-0.5">
                {{ fieldErrors.email }}
              </p>
            </div>

            <!-- Password -->
            <div class="flex flex-col gap-1.5">
              <div class="flex items-center justify-between">
                <label class="text-xs font-bold text-slate-700">{{ t('auth.password') }}</label>
                <RouterLink
                  to="/forgot-password"
                  class="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  {{ t('auth.forgotPassword') }}
                </RouterLink>
              </div>
              <div class="relative">
                <Lock class="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="current-password"
                  required
                  placeholder="••••••••"
                  :class="[
                    'w-full bg-slate-50 border rounded-xl ps-10 pe-10 py-2.5 text-xs text-slate-900 transition-all focus:outline-none focus:bg-white',
                    fieldErrors.password
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10'
                      : 'border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10'
                  ]"
                  @input="clearFieldError('password')"
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
              <p v-if="fieldErrors.password" class="text-[11px] text-rose-600 font-bold mt-0.5">
                {{ fieldErrors.password }}
              </p>
            </div>

            <!-- Sign In Button -->
            <button
              type="submit"
              :disabled="isLoading"
              class="w-full mt-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <Loader2 v-if="isLoading" class="w-4 h-4 animate-spin" />
              <span>{{ isLoading ? t('auth.signingIn') : t('auth.signIn') }}</span>
              <ArrowRight v-if="!isLoading" class="w-3.5 h-3.5 rtl:rotate-180" />
            </button>
          </form>
        </div>

        <!-- Footnote -->
        <div class="mt-8 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
          <ShieldCheck class="w-3.5 h-3.5 text-emerald-600" />
          <span>{{ t('auth.secureAccess') }}</span>
        </div>
      </div>

      <!-- Right Side: FinWise Illustration Card -->
      <div class="hidden md:flex flex-col justify-center items-center p-12 bg-gradient-to-br from-emerald-50/60 via-teal-50/40 to-slate-50 border-s border-slate-100 relative overflow-hidden">
        <!-- Decorative Glow -->
        <div class="absolute -right-20 -top-20 w-64 h-64 bg-emerald-200/40 rounded-full blur-3xl" />
        <div class="absolute -left-20 -bottom-20 w-64 h-64 bg-teal-200/40 rounded-full blur-3xl" />

        <div class="relative z-10 flex flex-col items-center text-center max-w-xs">
          <!-- Graphic Chart Badge -->
          <div class="w-24 h-24 rounded-3xl bg-white border border-emerald-100 shadow-xl shadow-emerald-500/10 flex items-center justify-center mb-6">
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md">
              <TrendingUp class="w-8 h-8 stroke-[2.5]" />
            </div>
          </div>

          <h2 class="text-lg font-black text-slate-900 tracking-tight leading-snug">
            {{ t('auth.betterKnowledge') }}<br />
            <span class="text-emerald-600">{{ t('auth.biggerOpportunities') }}</span>
          </h2>

          <p class="text-xs text-slate-500 mt-2.5 font-medium leading-relaxed">
            {{ t('auth.loginQuote') }}
          </p>
        </div>
      </div>

    </div>
  </div>
</template>
