<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { TrendingUp, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-vue-next'
import { useFeedback } from '@/composables/useFeedback'
import { coreServices } from '@/di'
import { useI18n } from 'vue-i18n'
import LanguageSwitcher from '@/components/ui/LanguageSwitcher.vue'

const router = useRouter()
const { toast } = useFeedback()
const { t } = useI18n()

const email = ref('admin@gmail.com')
const password = ref('admin@123')
const isLoading = ref(false)

const handleLogin = async () => {
  if (!email.value || !password.value) {
    toast.error(t('auth.fillBothFields'))
    return
  }

  isLoading.value = true

  // Simulate authentication
  setTimeout(() => {
    coreServices.tokenStore.setTokens({
      accessToken: 'finwise_admin_token_mock',
      refreshToken: 'finwise_admin_refresh_mock',
      expiresIn: 86400
    })

    coreServices.tokenStore.setUser({
      id: 'usr_admin_1',
      name: 'Admin',
      email: email.value,
      role: 'ADMIN',
      createdAt: new Date().toISOString()
    })

    toast.success(t('auth.loginSuccess'))
    isLoading.value = false
    router.push('/')
  }, 400)
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

          <div class="mb-8">
            <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {{ t('auth.welcomeBack') }}
            </h1>
            <p class="text-xs text-slate-500 mt-1 font-medium">
              {{ t('auth.signInSubtitle') }}
            </p>
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
                  required
                  placeholder="admin@finwise.com"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl ps-10 pe-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition-all"
                />
              </div>
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
                  type="password"
                  required
                  placeholder="••••••••"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl ps-10 pe-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition-all"
                />
              </div>
            </div>

            <!-- Sign In Button -->
            <button
              type="submit"
              :disabled="isLoading"
              class="w-full mt-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
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
