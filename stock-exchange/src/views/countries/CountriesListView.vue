<script setup lang="ts">
import { ref, computed } from 'vue'
import AppShell from '@/components/layout/AppShell.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import { 
  Globe, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  X, 
  Check, 
  Phone, 
  Languages, 
  ToggleLeft, 
  ToggleRight,
  ShieldCheck,
  Building2
} from 'lucide-vue-next'
import { useFeedback } from '@/composables/useFeedback'
import { useI18n } from 'vue-i18n'

const { toast, confirm } = useFeedback()
const { t, locale } = useI18n()
const isAr = computed(() => locale.value === 'ar')

export interface Country {
  id: string // country_id (ISO)
  enname: string
  arname: string
  phonecode: string
  flag: string
  status: 'Active' | 'Inactive'
  usersCount: number
}

const countries = ref<Country[]>([
  {
    id: 'EG',
    enname: 'Egypt',
    arname: 'مصر',
    phonecode: '+20',
    flag: '🇪🇬',
    status: 'Active',
    usersCount: 8420
  },
  {
    id: 'SA',
    enname: 'Saudi Arabia',
    arname: 'المملكة العربية السعودية',
    phonecode: '+966',
    flag: '🇸🇦',
    status: 'Active',
    usersCount: 3190
  },
  {
    id: 'AE',
    enname: 'United Arab Emirates',
    arname: 'الإمارات العربية المتحدة',
    phonecode: '+971',
    flag: '🇦🇪',
    status: 'Active',
    usersCount: 1840
  },
  {
    id: 'KW',
    enname: 'Kuwait',
    arname: 'الكويت',
    phonecode: '+965',
    flag: '🇰🇼',
    status: 'Active',
    usersCount: 940
  },
  {
    id: 'QA',
    enname: 'Qatar',
    arname: 'قطر',
    phonecode: '+974',
    flag: '🇶🇦',
    status: 'Active',
    usersCount: 620
  },
  {
    id: 'BH',
    enname: 'Bahrain',
    arname: 'البحرين',
    phonecode: '+973',
    flag: '🇧🇭',
    status: 'Active',
    usersCount: 410
  },
  {
    id: 'OM',
    enname: 'Oman',
    arname: 'سلطنة عمان',
    phonecode: '+968',
    flag: '🇴🇲',
    status: 'Active',
    usersCount: 380
  },
  {
    id: 'JO',
    enname: 'Jordan',
    arname: 'الأردن',
    phonecode: '+962',
    flag: '🇯🇴',
    status: 'Active',
    usersCount: 510
  },
  {
    id: 'US',
    enname: 'United States',
    arname: 'الولايات المتحدة الأمريكية',
    phonecode: '+1',
    flag: '🇺🇸',
    status: 'Active',
    usersCount: 1250
  },
  {
    id: 'GB',
    enname: 'United Kingdom',
    arname: 'المملكة المتحدة',
    phonecode: '+44',
    flag: '🇬🇧',
    status: 'Inactive',
    usersCount: 190
  }
])

// Search & Filter
const searchQuery = ref('')
const selectedStatus = ref('All')
const currentPage = ref(1)
const itemsPerPage = ref(6)

const filteredCountries = computed(() => {
  return countries.value.filter(c => {
    const query = searchQuery.value.toLowerCase().trim()
    const matchesSearch = 
      !query ||
      c.enname.toLowerCase().includes(query) ||
      c.arname.toLowerCase().includes(query) ||
      c.id.toLowerCase().includes(query) ||
      c.phonecode.includes(query)
      
    const matchesStatus = selectedStatus.value === 'All' || c.status === selectedStatus.value

    return matchesSearch && matchesStatus
  })
})

const totalPages = computed(() => Math.ceil(filteredCountries.value.length / itemsPerPage.value) || 1)

const paginatedCountries = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return filteredCountries.value.slice(start, start + itemsPerPage.value)
})

// Metrics
const totalCount = computed(() => countries.value.length)
const activeCount = computed(() => countries.value.filter(c => c.status === 'Active').length)
const totalUsers = computed(() => countries.value.reduce((acc, c) => acc + c.usersCount, 0))

// Modal State
const isModalOpen = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const formData = ref<{
  id?: string
  enname: string
  arname: string
  phonecode: string
  flag?: string
  status: 'Active' | 'Inactive'
}>({
  enname: '',
  arname: '',
  phonecode: '+',
  status: 'Active'
})

const formErrors = ref<Record<string, string>>({})

const openCreateModal = () => {
  modalMode.value = 'create'
  formData.value = {
    enname: '',
    arname: '',
    phonecode: '+',
    status: 'Active'
  }
  formErrors.value = {}
  isModalOpen.value = true
}

const openEditModal = (country: Country) => {
  modalMode.value = 'edit'
  formData.value = {
    id: country.id,
    enname: country.enname,
    arname: country.arname,
    phonecode: country.phonecode,
    flag: country.flag,
    status: country.status
  }
  formErrors.value = {}
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
}

const validateForm = () => {
  const errors: Record<string, string> = {}

  if (!formData.value.enname.trim()) {
    errors.enname = 'English name is required'
  }

  if (!formData.value.arname.trim()) {
    errors.arname = 'Arabic name is required'
  }

  if (!formData.value.phonecode.trim() || formData.value.phonecode === '+') {
    errors.phonecode = 'International phone code is required (e.g. +20)'
  }

  formErrors.value = errors
  return Object.keys(errors).length === 0
}

const handleSaveCountry = () => {
  if (!validateForm()) return

  if (modalMode.value === 'create') {
    const generatedId = (formData.value.enname.trim().slice(0, 3).toUpperCase() + Math.floor(10 + Math.random() * 90)).replace(/[^A-Z0-9]/g, '')
    countries.value.unshift({
      id: generatedId,
      enname: formData.value.enname.trim(),
      arname: formData.value.arname.trim(),
      phonecode: formData.value.phonecode.trim().startsWith('+') ? formData.value.phonecode.trim() : `+${formData.value.phonecode.trim()}`,
      flag: '🌐',
      status: formData.value.status,
      usersCount: 0
    })
    toast.success(
      isAr.value
        ? `تمت إضافة الدولة "${formData.value.arname || formData.value.enname}" بنجاح!`
        : `Country ${formData.value.enname} added successfully!`,
      isAr.value ? 'تم الإنشاء' : 'Created'
    )
  } else {
    const idx = countries.value.findIndex(c => c.id === formData.value.id)
    if (idx !== -1) {
      const existing = countries.value[idx]!
      countries.value[idx] = {
        id: existing.id,
        flag: existing.flag,
        usersCount: existing.usersCount,
        enname: formData.value.enname.trim(),
        arname: formData.value.arname.trim(),
        phonecode: formData.value.phonecode.trim().startsWith('+') ? formData.value.phonecode.trim() : `+${formData.value.phonecode.trim()}`,
        status: formData.value.status
      }
      toast.success(
        isAr.value
          ? `تم تحديث الدولة "${formData.value.arname || formData.value.enname}" بنجاح!`
          : `Country ${formData.value.enname} updated successfully!`,
        isAr.value ? 'تم التحديث' : 'Updated'
      )
    }
  }

  closeModal()
}

const toggleStatus = (country: Country) => {
  const newStatus = country.status === 'Active' ? 'Inactive' : 'Active'
  country.status = newStatus
  const statusLabel = newStatus === 'Active' ? t('common.active') : t('common.inactive')
  toast.info(isAr.value ? `حالة ${country.arname || country.enname} الآن: ${statusLabel}` : `${country.enname} is now ${newStatus}`)
}

const handleDeleteCountry = async (country: Country) => {
  const countryName = isAr.value ? (country.arname || country.enname) : country.enname
  const confirmed = await confirm({
    title: isAr.value ? `${t('countries.deleteConfirmTitle')} "${countryName}"؟` : `${t('countries.deleteConfirmTitle')} "${countryName}"?`,
    message: isAr.value
      ? `${t('countries.deleteConfirmDesc')} (${country.arname || country.enname})`
      : `${t('countries.deleteConfirmDesc')} (${country.enname} / ${country.arname})`,
    confirmText: t('common.delete'),
    cancelText: t('common.cancel'),
    type: 'danger'
  })

  if (confirmed) {
    countries.value = countries.value.filter(c => c.id !== country.id)
    toast.success(
      isAr.value
        ? `تم حذف دولة "${countryName}" بنجاح`
        : `Country ${country.enname} was deleted successfully`
    )
  }
}

const clearFilters = () => {
  searchQuery.value = ''
  selectedStatus.value = 'All'
  currentPage.value = 1
}
</script>

<template>
  <AppShell>
    <div class="flex flex-col gap-6 max-w-7xl mx-auto">
      <!-- Page Header -->
      <PageHeader
        :title="t('countries.title')"
        :description="t('countries.subtitle')"
      >
        <button
          type="button"
          @click="openCreateModal"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-sm shadow-emerald-600/20 cursor-pointer"
        >
          <Plus class="w-4 h-4" />
          <span>{{ t('countries.addCountry') }}</span>
        </button>
      </PageHeader>

      <!-- Stat Badges -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Globe class="w-5 h-5" />
          </div>
          <div>
            <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">{{ t('countries.totalCountries') }}</div>
            <div class="text-lg font-black text-slate-900">{{ totalCount }}</div>
          </div>
        </div>

        <div class="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div class="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <ShieldCheck class="w-5 h-5" />
          </div>
          <div>
            <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">{{ t('countries.activeJurisdictions') }}</div>
            <div class="text-lg font-black text-teal-600">{{ activeCount }}</div>
          </div>
        </div>

        <div class="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Building2 class="w-5 h-5" />
          </div>
          <div>
            <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">{{ t('countries.registeredTraders') }}</div>
            <div class="text-lg font-black text-blue-600">{{ totalUsers.toLocaleString() }}</div>
          </div>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div class="relative w-full md:w-80">
          <Search class="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="t('countries.searchPlaceholder')"
            class="w-full bg-slate-50/80 border border-slate-200 rounded-xl ps-10 pe-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
          />
        </div>

        <div class="flex items-center gap-2.5 w-full md:w-auto">
          <!-- Status Filter -->
          <select
            v-model="selectedStatus"
            class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="All">{{ t('common.all') }} {{ t('countries.status') }}</option>
            <option value="Active">{{ t('common.active') }}</option>
            <option value="Inactive">{{ t('common.inactive') }}</option>
          </select>

          <button
            v-if="searchQuery || selectedStatus !== 'All'"
            type="button"
            @click="clearFilters"
            class="text-xs font-bold text-slate-500 hover:text-rose-600 px-2 py-1 transition-colors cursor-pointer shrink-0"
          >
            {{ t('common.clear') }}
          </button>
        </div>
      </div>

      <!-- Country Table -->
      <div class="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-start text-xs min-w-[650px]">
            <thead>
              <tr class="text-[11px] font-bold text-slate-400 border-b border-slate-100 uppercase tracking-wider bg-slate-50/50">
                <th class="py-3 px-5 text-start">{{ t('countries.enName') }}</th>
                <th class="py-3 px-5 text-start">{{ t('countries.arName') }}</th>
                <th class="py-3 px-5 text-start">{{ t('countries.phoneCode') }}</th>
                <th class="py-3 px-5 text-start">{{ t('countries.status') }}</th>
                <th class="py-3 px-5 text-start">{{ t('countries.users') }}</th>
                <th class="py-3 px-5 text-end">{{ t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr 
                v-for="country in paginatedCountries" 
                :key="country.id"
                class="hover:bg-slate-50/70 transition-colors group"
              >
                <!-- English Name with Flag -->
                <td class="py-3.5 px-5 text-start">
                  <div class="flex items-center gap-2.5">
                    <span class="text-xl shrink-0 leading-none">{{ country.flag }}</span>
                    <span class="font-bold text-slate-900 text-xs">{{ country.enname }}</span>
                  </div>
                </td>

                <!-- Arabic Name -->
                <td class="py-3.5 px-5 text-start" dir="rtl">
                  <span class="font-bold text-slate-900 text-xs block text-start">{{ country.arname }}</span>
                </td>

                <!-- Phone Code -->
                <td class="py-3.5 px-5 text-start">
                  <div class="flex items-center gap-1.5 font-mono text-emerald-700 font-bold bg-emerald-50 w-fit px-2 py-0.5 rounded-md" dir="ltr">
                    <Phone class="w-3 h-3 text-emerald-600" />
                    <span>{{ country.phonecode }}</span>
                  </div>
                </td>

                <!-- Status -->
                <td class="py-3.5 px-5 text-start">
                  <button
                    type="button"
                    @click="toggleStatus(country)"
                    class="cursor-pointer"
                    title="Click to toggle status"
                  >
                    <StatusBadge :status="country.status">
                      {{ country.status === 'Active' ? t('common.active') : t('common.inactive') }}
                    </StatusBadge>
                  </button>
                </td>

                <!-- User Count -->
                <td class="py-3.5 px-5 text-start">
                  <span class="font-semibold text-slate-600">{{ country.usersCount.toLocaleString() }}</span>
                </td>

                <!-- Actions -->
                <td class="py-3.5 px-5 text-end">
                  <div class="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      @click="openEditModal(country)"
                      class="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                      title="Edit Country"
                    >
                      <Edit3 class="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      @click="handleDeleteCountry(country)"
                      class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete Country"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>

              <tr v-if="filteredCountries.length === 0">
                <td colspan="6" class="py-12 text-center text-slate-400">
                  <Globe class="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p class="font-bold text-slate-700 text-sm">No countries found</p>
                  <p class="text-xs text-slate-400 mt-0.5">Try a different search keyword or status filter.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span class="text-xs font-medium text-slate-500">
            Showing <strong class="text-slate-800">{{ paginatedCountries.length }}</strong> of <strong class="text-slate-800">{{ filteredCountries.length }}</strong> countries
          </span>
          <AppPagination
            v-model:current-page="currentPage"
            :total-pages="totalPages"
          />
        </div>
      </div>
    </div>

    <!-- Create / Edit Country Modal -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div 
        v-if="isModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
      >
        <div class="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in">
          <!-- Header -->
          <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Globe class="w-4 h-4" />
              </div>
              <div>
                <h3 class="text-sm font-bold text-slate-900">
                  {{ modalMode === 'create' ? t('countries.addNewCountry') : t('countries.editCountry') }}
                </h3>
                <span class="text-[10px] text-slate-400">{{ t('countries.subtitle') }}</span>
              </div>
            </div>
            <button
              type="button"
              @click="closeModal"
              class="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Form -->
          <form @submit.prevent="handleSaveCountry" class="p-6 flex flex-col gap-4 text-xs">
            <!-- English Name (enname) -->
            <div class="flex flex-col gap-1">
              <label class="font-bold text-slate-700 flex items-center gap-1">
                <Languages class="w-3.5 h-3.5 text-slate-400" />
                <span>{{ t('countries.enName') }} *</span>
              </label>
              <input
                v-model="formData.enname"
                type="text"
                placeholder="e.g. Egypt, Saudi Arabia"
                class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
              />
              <span v-if="formErrors.enname" class="text-rose-500 text-[10px] font-bold">{{ formErrors.enname }}</span>
            </div>

            <!-- Arabic Name (arname) -->
            <div class="flex flex-col gap-1">
              <label class="font-bold text-slate-700 flex items-center gap-1">
                <Languages class="w-3.5 h-3.5 text-slate-400" />
                <span>{{ t('countries.arName') }} *</span>
              </label>
              <input
                v-model="formData.arname"
                type="text"
                dir="rtl"
                placeholder="مثلاً: مصر، المملكة العربية السعودية"
                class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 text-start font-bold focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
              />
              <span v-if="formErrors.arname" class="text-rose-500 text-[10px] font-bold">{{ formErrors.arname }}</span>
            </div>

            <!-- Phone Code (phonecode) -->
            <div class="flex flex-col gap-1">
              <label class="font-bold text-slate-700 flex items-center gap-1">
                <Phone class="w-3.5 h-3.5 text-slate-400" />
                <span>{{ t('countries.phoneCode') }} *</span>
              </label>
              <input
                v-model="formData.phonecode"
                type="text"
                dir="ltr"
                placeholder="e.g. +20, +966, +971"
                class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
              />
              <span v-if="formErrors.phonecode" class="text-rose-500 text-[10px] font-bold">{{ formErrors.phonecode }}</span>
            </div>

            <!-- Status Switch -->
            <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <span class="font-bold text-slate-800 block">{{ t('countries.activeStatus') }}</span>
                <span class="text-[10px] text-slate-400">{{ t('countries.activeStatusDesc') }}</span>
              </div>
              <button
                type="button"
                @click="formData.status = formData.status === 'Active' ? 'Inactive' : 'Active'"
                class="cursor-pointer"
              >
                <ToggleRight v-if="formData.status === 'Active'" class="w-7 h-7 text-emerald-600" />
                <ToggleLeft v-else class="w-7 h-7 text-slate-400" />
              </button>
            </div>

            <!-- Modal Actions -->
            <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                @click="closeModal"
                class="px-4 py-2 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 cursor-pointer shadow-2xs"
              >
                {{ t('common.cancel') }}
              </button>
              <button
                type="submit"
                class="px-4 py-2 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 cursor-pointer shadow-sm shadow-emerald-600/20 flex items-center gap-1.5"
              >
                <Check class="w-3.5 h-3.5" />
                <span>{{ modalMode === 'create' ? t('countries.saveCountry') : t('countries.updateCountry') }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </AppShell>
</template>
