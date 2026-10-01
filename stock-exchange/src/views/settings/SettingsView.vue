<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Lock, Camera, Loader2, AlertCircle, Phone, Globe } from 'lucide-vue-next'
import AppShell from '@/components/layout/AppShell.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import UploadProgressBar from '@/components/forms/UploadProgressBar.vue'
import { useFeedback } from '@/composables/useFeedback'
import { useI18n } from 'vue-i18n'
import { coreServices } from '@/di'
import { MediaType } from '@/domain/models/attachment.model'
import { extractApiErrors } from '@/domain/models/common.model'
import type { CountryDto } from '@/domain/models/country.model'
import { resolveAttachmentUrl, DEFAULT_AVATAR_PLACEHOLDER, handleImageError } from '@/utils/attachment'

const { toast } = useFeedback()
const { t, locale } = useI18n()
const isAr = computed(() => locale.value === 'ar')

const isPageLoading = ref(true)
const isSavingProfile = ref(false)
const isChangingPassword = ref(false)

const countries = ref<CountryDto[]>([])
const selectedCountryId = ref('')

const profile = ref({
  id: '',
  name: '',
  email: '',
  phoneNumber: '',
  countryId: '',
  phoneCode: '',
  avatar: DEFAULT_AVATAR_PLACEHOLDER,
  avatarFileName: '',
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const selectedCountry = computed(() => {
  return countries.value.find((c) => c.id === selectedCountryId.value)
})

const selectedCountryCode = computed(() => {
  return selectedCountry.value?.code || profile.value.phoneCode || ''
})

const fieldErrors = ref<Record<string, string>>({})
const generalError = ref<string | null>(null)

const avatarInput = ref<HTMLInputElement | null>(null)
const isUploadingAvatar = ref(false)
const avatarProgress = ref(0)
const avatarFileName = ref('')
const avatarFileSize = ref(0)

const loadCountries = async () => {
  try {
    const list = await coreServices.countries.getAll()
    countries.value = list

    if (profile.value.countryId && !selectedCountryId.value) {
      selectedCountryId.value = profile.value.countryId
    } else if (profile.value.phoneCode && !selectedCountryId.value) {
      const match = list.find((c) => c.code === profile.value.phoneCode)
      if (match) selectedCountryId.value = match.id
    }
  } catch {
  }
}

const fetchProfile = async () => {
  isPageLoading.value = true
  try {
    const data = await coreServices.auth.getUserProfile()
    if (data.id) profile.value.id = data.id
    if (data.fullName) profile.value.name = data.fullName
    if (data.email) profile.value.email = data.email
    if (data.phoneNumber) profile.value.phoneNumber = data.phoneNumber
    if (data.phoneCode) profile.value.phoneCode = data.phoneCode

    if (data.countryId) {
      profile.value.countryId = data.countryId
      selectedCountryId.value = data.countryId
    } else if (data.phoneCode && countries.value.length > 0) {
      const match = countries.value.find((c) => c.code === data.phoneCode)
      if (match) selectedCountryId.value = match.id
    }

    if (data.profilePictureUrl) {
      profile.value.avatar = resolveAttachmentUrl(data.profilePictureUrl)
      profile.value.avatarFileName = data.profilePictureUrl
    }
  } catch (err: unknown) {
    const extracted = extractApiErrors(err)
    toast.error(
      extracted.generalMessage || (isAr.value ? 'تعذر جلب بيانات الملف الشخصي' : 'Failed to load profile'),
      isAr.value ? 'خطأ' : 'Error'
    )
  } finally {
    isPageLoading.value = false
  }
}

onMounted(async () => {
  // تحميل سريع من بيانات الجلسة الحالية لتجنب فراغ الحقول فور فتح الشاشة
  const cachedUser = coreServices.auth.getCurrentUser()
  if (cachedUser) {
    if (cachedUser.id) profile.value.id = cachedUser.id
    if (cachedUser.fullName || cachedUser.name) profile.value.name = cachedUser.fullName || cachedUser.name
    if (cachedUser.email) profile.value.email = cachedUser.email
    if (cachedUser.phoneNumber) profile.value.phoneNumber = cachedUser.phoneNumber
    if (cachedUser.countryId) {
      profile.value.countryId = cachedUser.countryId
      selectedCountryId.value = cachedUser.countryId
    }
    const pic = cachedUser.avatarUrl || cachedUser.profilePictureUrl
    if (pic) {
      profile.value.avatar = resolveAttachmentUrl(pic)
      profile.value.avatarFileName = pic
    }
  }

  await loadCountries()
  await fetchProfile()
})

const handleAvatarUpload = () => {
  avatarInput.value?.click()
}

const cancelAvatarUpload = () => {
  isUploadingAvatar.value = false
  avatarProgress.value = 0
  if (avatarInput.value) avatarInput.value.value = ''
}

const onAvatarFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (!target.files || !target.files[0]) return

  const file = target.files[0]
  if (!file.type.startsWith('image/')) {
    toast.error(isAr.value ? 'يرجى اختيار صورة صالحة' : 'Please select a valid image file')
    return
  }

  isUploadingAvatar.value = true
  avatarProgress.value = 25
  avatarFileName.value = file.name
  avatarFileSize.value = file.size

  try {
    avatarProgress.value = 60
    let storedFileName = ''

    const isPhysicalStoredAttachment = (name?: string | null): boolean => {
      if (!name) return false
      const trimmed = name.trim().toLowerCase()
      return !trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('data:') && !trimmed.startsWith('blob:')
    }

    if (profile.value.avatarFileName && isPhysicalStoredAttachment(profile.value.avatarFileName)) {
      try {
        storedFileName = await coreServices.attachments.update({
          oldFileName: profile.value.avatarFileName,
          file,
          mediaType: MediaType.Image,
          place: 0,
        })
      } catch {
        // Fallback to fresh upload if old file cannot be updated on server
        storedFileName = await coreServices.attachments.upload({
          file,
          mediaType: MediaType.Image,
          place: 0,
        })
      }
    } else {
      storedFileName = await coreServices.attachments.upload({
        file,
        mediaType: MediaType.Image,
        place: 0,
      })
    }

    avatarProgress.value = 100
    profile.value.avatarFileName = storedFileName
    profile.value.avatar = resolveAttachmentUrl(storedFileName)

    // تحديث صورة الملف الشخصي فورياً في الـ Backend والـ TokenStore
    await coreServices.auth.updateProfile({
      profilePictureUrl: storedFileName,
      pictureProfileUrl: storedFileName,
    })

    toast.success(
      isAr.value ? 'تم رفع وتحديث الصورة بنجاح' : 'Avatar image uploaded successfully'
    )
  } catch (err: unknown) {
    const extracted = extractApiErrors(err)
    toast.error(
      extracted.generalMessage || (isAr.value ? 'فشل رفع الصورة' : 'Failed to upload photo'),
      isAr.value ? 'خطأ بالرفع' : 'Upload Error'
    )
  } finally {
    setTimeout(() => {
      isUploadingAvatar.value = false
      avatarProgress.value = 0
    }, 400)
  }
}

const handleSaveProfile = async () => {
  fieldErrors.value = {}
  generalError.value = null

  if (!profile.value.name.trim()) {
    fieldErrors.value.fullName = isAr.value ? 'الاسم مطلوب' : 'Name is required'
    return
  }

  isSavingProfile.value = true

  try {
    const msg = await coreServices.auth.updateProfile({
      fullName: profile.value.name.trim(),
      email: profile.value.email.trim(),
      phoneNumber: profile.value.phoneNumber.trim() || undefined,
      countryId: selectedCountryId.value || undefined,
      profilePictureUrl: profile.value.avatarFileName || undefined,
      pictureProfileUrl: profile.value.avatarFileName || undefined,
    })

    toast.success(msg || t('settings.profileUpdated'))
  } catch (err: unknown) {
    const extracted = extractApiErrors(err)
    fieldErrors.value = extracted.fieldErrors
    generalError.value = extracted.generalMessage
    toast.error(
      extracted.generalMessage || (isAr.value ? 'فشل تحديث البيانات' : 'Update Failed'),
      isAr.value ? 'خطأ' : 'Error'
    )
  } finally {
    isSavingProfile.value = false
  }
}

const handleChangePassword = async () => {
  if (!profile.value.currentPassword) {
    toast.error(isAr.value ? 'يرجى إدخال كلمة المرور الحالية' : 'Please enter your current password')
    return
  }
  if (!profile.value.newPassword || profile.value.newPassword.length < 8) {
    toast.error(
      isAr.value
        ? 'يجب أن تكون كلمة المرور الجديدة 8 أحرف على الأقل'
        : 'New password must be at least 8 characters'
    )
    return
  }
  if (profile.value.newPassword !== profile.value.confirmPassword) {
    toast.error(isAr.value ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match')
    return
  }

  isChangingPassword.value = true

  try {
    await coreServices.auth.changePassword({
      currentPassword: profile.value.currentPassword,
      newPassword: profile.value.newPassword,
      confirmNewPassword: profile.value.confirmPassword,
    })

    profile.value.currentPassword = ''
    profile.value.newPassword = ''
    profile.value.confirmPassword = ''

    toast.success(
      isAr.value ? 'تم تغيير كلمة المرور بنجاح' : 'Password changed successfully'
    )
  } catch (err: unknown) {
    const extracted = extractApiErrors(err)
    toast.error(
      extracted.generalMessage || (isAr.value ? 'فشل تغيير كلمة المرور' : 'Failed to change password'),
      isAr.value ? 'خطأ' : 'Error'
    )
  } finally {
    isChangingPassword.value = false
  }
}
</script>

<template>
  <AppShell>
    <div class="flex flex-col max-w-3xl mx-auto">
      <PageHeader
        :title="t('settings.title')"
        :description="t('settings.subtitle')"
      />

      <!-- Loading skeleton -->
      <div v-if="isPageLoading" class="bg-white rounded-2xl border border-slate-200/80 p-8 flex justify-center items-center">
        <Loader2 class="w-8 h-8 text-emerald-600 animate-spin" />
      </div>

      <!-- Profile & Security Form -->
      <div v-else class="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 lg:p-8 shadow-2xs flex flex-col gap-6">
        <h2 class="text-xs font-bold text-slate-400 uppercase tracking-wider">
          {{ t('settings.profileTab') }}
        </h2>

        <!-- General Error Banner -->
        <div
          v-if="generalError"
          class="p-3 rounded-xl bg-rose-50/90 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2.5 animate-fadeIn"
        >
          <AlertCircle class="w-4 h-4 shrink-0 text-rose-600" />
          <span class="leading-relaxed">{{ generalError }}</span>
        </div>

        <!-- Avatar Section -->
        <div class="flex flex-col gap-4">
          <input
            ref="avatarInput"
            type="file"
            accept="image/*"
            class="hidden"
            tabindex="-1"
            aria-hidden="true"
            @change="onAvatarFileSelect"
          />

          <div class="flex items-center gap-3.5 sm:gap-4">
            <div class="relative group shrink-0">
              <img
                :src="profile.avatar"
                @error="handleImageError($event, 'avatar')"
                :alt="profile.name"
                class="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover ring-2 ring-emerald-500/20"
              />
              <button
                type="button"
                :disabled="isUploadingAvatar"
                @click="handleAvatarUpload"
                class="absolute inset-0 bg-slate-900/40 rounded-2xl opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
                :aria-label="isAr ? 'تغيير الصورة الشخصية' : 'Change avatar picture'"
              >
                <Camera class="w-5 h-5" />
              </button>
            </div>
            <div class="flex flex-col">
              <span class="text-xs font-bold text-slate-900">{{ profile.name }}</span>
              <span class="text-[11px] text-slate-400 font-medium">{{ profile.email }}</span>
              <button
                type="button"
                :disabled="isUploadingAvatar"
                @click="handleAvatarUpload"
                class="text-xs font-semibold text-emerald-600 hover:text-emerald-700 text-start mt-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none rounded-md self-start disabled:opacity-50"
              >
                {{ isAr ? 'تغيير الصورة' : 'Change Photo' }}
              </button>
            </div>
          </div>

          <!-- Accessible Avatar Upload Progress Bar -->
          <div v-if="isUploadingAvatar" class="w-full max-w-md">
            <UploadProgressBar
              :progress="avatarProgress"
              :file-name="avatarFileName"
              :file-size="avatarFileSize"
              :status="avatarProgress === 100 ? 'success' : 'uploading'"
              :can-cancel="true"
              @cancel="cancelAvatarUpload"
              @remove="cancelAvatarUpload"
            />
          </div>
        </div>

        <div class="w-full h-px bg-slate-100" />

        <!-- Full Name, Email, and Phone Number -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold text-slate-700">{{ t('settings.fullName') }}</label>
            <input
              v-model="profile.name"
              type="text"
              class="w-full bg-slate-50/50 border rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white transition-all font-medium"
              :class="fieldErrors.fullName ? 'border-rose-400 focus:ring-2 focus:ring-rose-500/10' : 'border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10'"
            />
            <span v-if="fieldErrors.fullName" class="text-[11px] text-rose-600 font-bold">
              {{ fieldErrors.fullName }}
            </span>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold text-slate-700">{{ t('settings.adminEmail') }}</label>
            <input
              v-model="profile.email"
              type="email"
              class="w-full bg-slate-50/50 border rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white transition-all font-medium"
              :class="fieldErrors.email ? 'border-rose-400 focus:ring-2 focus:ring-rose-500/10' : 'border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10'"
            />
            <span v-if="fieldErrors.email" class="text-[11px] text-rose-600 font-bold">
              {{ fieldErrors.email }}
            </span>
          </div>

          <!-- Country Selection -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold text-slate-700">
              {{ isAr ? 'الدولة / كود الاتصال' : 'Country / Dial Code' }}
            </label>
            <div class="relative">
              <Globe class="w-3.5 h-3.5 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                v-model="selectedCountryId"
                class="w-full bg-slate-50/50 border border-slate-200 rounded-xl ps-9 pe-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all font-medium cursor-pointer"
              >
                <option value="">{{ isAr ? 'اختر الدولة' : 'Select Country' }}</option>
                <option v-for="c in countries" :key="c.id" :value="c.id">
                  {{ isAr ? c.countryArName : c.countryEnName }} ({{ c.code }})
                </option>
              </select>
            </div>
          </div>

          <!-- Phone Number -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold text-slate-700">
              {{ isAr ? 'رقم الهاتف' : 'Phone Number' }}
            </label>
            <div class="relative flex items-center">
              <span
                v-if="selectedCountryCode"
                class="absolute start-3 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200/70 select-none z-10"
                dir="ltr"
              >
                {{ selectedCountryCode }}
              </span>
              <Phone v-else class="w-3.5 h-3.5 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                v-model="profile.phoneNumber"
                type="tel"
                :placeholder="selectedCountryCode ? '1012345678' : '+201234567890'"
                class="w-full bg-slate-50/50 border rounded-xl pe-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white transition-all font-medium"
                :class="[
                  selectedCountryCode ? 'ps-18' : 'ps-9',
                  fieldErrors.phoneNumber ? 'border-rose-400 focus:ring-2 focus:ring-rose-500/10' : 'border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10'
                ]"
              />
            </div>
            <span v-if="fieldErrors.phoneNumber" class="text-[11px] text-rose-600 font-bold">
              {{ fieldErrors.phoneNumber }}
            </span>
          </div>
        </div>

        <!-- Save Profile Action -->
        <div class="flex justify-end">
          <button
            type="button"
            :disabled="isSavingProfile"
            @click="handleSaveProfile"
            class="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Loader2 v-if="isSavingProfile" class="w-4 h-4 animate-spin" />
            <span>{{ isSavingProfile ? (isAr ? 'جاري الحفظ...' : 'Saving...') : t('settings.saveSettings') }}</span>
          </button>
        </div>

        <div class="w-full h-px bg-slate-100" />

        <!-- Change Password Fields -->
        <div class="flex flex-col gap-3 pt-2">
          <h3 class="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Lock class="w-3.5 h-3.5 text-slate-400" />
            {{ t('settings.securityTab') }}
          </h3>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold text-slate-700">{{ t('settings.currentPassword') }}</label>
            <input
              v-model="profile.currentPassword"
              type="password"
              placeholder="••••••••"
              class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">{{ t('settings.newPassword') }}</label>
              <input
                v-model="profile.newPassword"
                type="password"
                placeholder="••••••••"
                class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">{{ t('settings.confirmNewPassword') }}</label>
              <input
                v-model="profile.confirmPassword"
                type="password"
                placeholder="••••••••"
                class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
              />
            </div>
          </div>

          <div class="pt-2 flex justify-end">
            <button
              type="button"
              :disabled="isChangingPassword || !profile.currentPassword || !profile.newPassword"
              @click="handleChangePassword"
              class="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Loader2 v-if="isChangingPassword" class="w-4 h-4 animate-spin" />
              <span>{{ isChangingPassword ? (isAr ? 'جاري التحديث...' : 'Updating...') : (isAr ? 'تحديث كلمة المرور' : 'Update Password') }}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  </AppShell>
</template>
