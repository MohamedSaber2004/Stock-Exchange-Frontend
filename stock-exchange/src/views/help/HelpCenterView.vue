<script setup lang="ts">
import { ref, computed } from 'vue'
import AppShell from '@/components/layout/AppShell.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import { 
  HelpCircle, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  MessageSquare, 
  Phone, 
  Mail, 
  CheckCircle, 
  Clock, 
  X, 
  Check, 
  Tag, 
  HelpCircle as QuestionIcon,
  Headphones,
  ExternalLink,
  FolderPlus,
  Layers,
  Shield,
  CreditCard,
  TrendingUp,
  Video,
  BookOpen,
  Users,
  Smartphone,
  Settings as SettingsIcon,
  ToggleLeft,
  ToggleRight
} from 'lucide-vue-next'
import { useFeedback } from '@/composables/useFeedback'
import { useI18n } from 'vue-i18n'

const { toast, confirm } = useFeedback()
const { t, locale } = useI18n()
const isAr = computed(() => locale.value === 'ar')

// Active Tab
const activeTab = ref<'faqs' | 'categories' | 'tickets' | 'contact'>('faqs')

// Help Center Category Model
export interface HelpCategoryItem {
  id: string
  slug: string
  nameEn: string
  nameAr: string
  descriptionEn: string
  descriptionAr: string
  icon: string
  color: 'emerald' | 'blue' | 'purple' | 'amber' | 'rose' | 'indigo' | 'teal'
  order: number
  status: 'Active' | 'Inactive'
}

// Categories State
const categories = ref<HelpCategoryItem[]>([
  {
    id: 'cat-1',
    slug: 'account',
    nameEn: 'Account & Security',
    nameAr: 'الحساب والأمان',
    descriptionEn: 'User login, password reset, 2FA, and profile preferences.',
    descriptionAr: 'تسجيل الدخول، استعادة كلمة المرور، التحقق بخطوتين وتفضيلات الحساب.',
    icon: 'Shield',
    color: 'blue',
    order: 1,
    status: 'Active'
  },
  {
    id: 'cat-2',
    slug: 'subscriptions',
    nameEn: 'Billing & Subscriptions',
    nameAr: 'الاشتراكات والمدفوعات',
    descriptionEn: 'Plan tiers, payments, invoices, upgrades, and cancellations.',
    descriptionAr: 'باقات الاشتراك، طرق الدفع، الفواتير، الترقية وإلغاء الاشتراك.',
    icon: 'CreditCard',
    color: 'emerald',
    order: 2,
    status: 'Active'
  },
  {
    id: 'cat-3',
    slug: 'trading',
    nameEn: 'Trading & Market Basics',
    nameAr: 'التداول وأساسيات السوق',
    descriptionEn: 'Stock basics, indicators, live charts, and fundamental analysis.',
    descriptionAr: 'مفاهيم الأسهم، المؤشرات الفنية، الرسوم البيانية والتحليل الأساسي.',
    icon: 'TrendingUp',
    color: 'purple',
    order: 3,
    status: 'Active'
  },
  {
    id: 'cat-4',
    slug: 'content',
    nameEn: 'Articles & Educational Videos',
    nameAr: 'المقالات والفيديوهات التعليمية',
    descriptionEn: 'Library access, offline viewing, lesson bookmarks, and instructors.',
    descriptionAr: 'الوصول للمكتبة، المشاهدة دون اتصال، حفظ الدروس والمحاضرين.',
    icon: 'Video',
    color: 'amber',
    order: 4,
    status: 'Active'
  },
  {
    id: 'cat-5',
    slug: 'mobile-app',
    nameEn: 'Mobile App & Features',
    nameAr: 'تطبيق الموبايل والمميزات',
    descriptionEn: 'App notifications, device sync, dark mode, and performance.',
    descriptionAr: 'إشعارات التطبيق، مزامنة الأجهزة، الوضع الليلي والأداء.',
    icon: 'Smartphone',
    color: 'indigo',
    order: 5,
    status: 'Active'
  }
])

const selectedCategory = ref('all')
const searchQuery = ref('')
const categorySearchQuery = ref('')

// Category Modal State
const isCategoryModalOpen = ref(false)
const categoryModalMode = ref<'create' | 'edit'>('create')
const categoryForm = ref<HelpCategoryItem>({
  id: '',
  slug: '',
  nameEn: '',
  nameAr: '',
  descriptionEn: '',
  descriptionAr: '',
  icon: 'HelpCircle',
  color: 'emerald',
  order: 1,
  status: 'Active'
})

// FAQ Items Model & State
export interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
  views: number
  status: 'Published' | 'Draft'
  order: number
}

const faqs = ref<FAQItem[]>([
  {
    id: 'faq-1',
    question: 'How do I upgrade my subscription to FinWise Pro?',
    answer: 'You can upgrade anytime from the Subscription tab in the mobile app. Select the Pro plan and choose your preferred payment method (Visa, Mastercard, or local mobile wallet).',
    category: 'subscriptions',
    views: 1420,
    status: 'Published',
    order: 1
  },
  {
    id: 'faq-2',
    question: 'Are the stock market courses suitable for complete beginners?',
    answer: 'Yes! FinWise is structured with beginner-friendly foundations, covering everything from basic stock concepts to chart analysis with step-by-step videos.',
    category: 'trading',
    views: 2310,
    status: 'Published',
    order: 2
  },
  {
    id: 'faq-3',
    question: 'How can I reset my account password?',
    answer: 'On the sign-in screen, tap "Forgot Password", enter your registered email, and verify the 6-digit OTP sent to your inbox to set a new password.',
    category: 'account',
    views: 980,
    status: 'Published',
    order: 3
  },
  {
    id: 'faq-4',
    question: 'Can I download videos to watch offline?',
    answer: 'Offline video downloads are available exclusively for Pro plan subscribers within the iOS and Android mobile apps.',
    category: 'content',
    views: 750,
    status: 'Published',
    order: 4
  }
])

// Support Inquiries / Tickets
export interface TicketItem {
  id: string
  user: string
  email: string
  subject: string
  category: string
  status: 'Open' | 'In Progress' | 'Resolved'
  priority: 'High' | 'Medium' | 'Low'
  date: string
  message: string
}

const tickets = ref<TicketItem[]>([
  {
    id: 'TKT-1042',
    user: 'Karim Tarek',
    email: 'karim@example.com',
    subject: 'Cannot access Pro video library after payment',
    category: 'Billing',
    status: 'Open',
    priority: 'High',
    date: '10m ago',
    message: 'I subscribed to the Pro plan 15 minutes ago via credit card. The money was deducted but the videos are still locked.'
  },
  {
    id: 'TKT-1041',
    user: 'Nouran Mostafa',
    email: 'nouran@example.com',
    subject: 'Question regarding technical analysis indicators',
    category: 'Trading',
    status: 'In Progress',
    priority: 'Medium',
    date: '2h ago',
    message: 'Could you please clarify the difference between RSI and MACD in the third chapter of the video course?'
  },
  {
    id: 'TKT-1040',
    user: 'Youssef Adel',
    email: 'youssef@example.com',
    subject: 'Change account email address',
    category: 'Account',
    status: 'Resolved',
    priority: 'Low',
    date: '1d ago',
    message: 'I need to update my email address associated with my active subscription.'
  }
])

// Contact Channel Settings
const contactSettings = ref({
  supportEmail: 'support@finwise.app',
  inquiryEmail: 'help@finwise.app',
  whatsappNumber: '+20 100 123 4567',
  phoneSupport: '+20 2 3456 7890',
  businessHours: 'Sunday - Thursday, 9:00 AM - 6:00 PM (GMT+2)',
  liveChatEnabled: true,
  autoReplyEnabled: true
})

// FAQ Modal State
const isFaqModalOpen = ref(false)
const faqModalMode = ref<'create' | 'edit'>('create')
const faqForm = ref({
  id: '',
  question: '',
  answer: '',
  category: 'trading',
  status: 'Published' as 'Published' | 'Draft'
})

// Ticket Details Modal
const isTicketModalOpen = ref(false)
const selectedTicket = ref<TicketItem | null>(null)

// Computed FAQ Counts per Category
const getFaqsCountForCategory = (slug: string) => {
  return faqs.value.filter(f => f.category === slug).length
}

// Available Categories Filter List for FAQ tab
const availableCategoriesForFilter = computed(() => {
  return [
    { id: 'all', label: 'All Categories', labelAr: 'جميع الأقسام' },
    ...categories.value.map(c => ({
      id: c.slug,
      label: c.nameEn,
      labelAr: c.nameAr
    }))
  ]
})

// Filtered FAQs
const filteredFaqs = computed(() => {
  return faqs.value.filter(faq => {
    const matchesCategory = selectedCategory.value === 'all' || faq.category === selectedCategory.value
    const query = searchQuery.value.toLowerCase().trim()
    const matchesSearch = !query || 
      faq.question.toLowerCase().includes(query) || 
      faq.answer.toLowerCase().includes(query)
    return matchesCategory && matchesSearch
  })
})

// Filtered Categories
const filteredCategories = computed(() => {
  const query = categorySearchQuery.value.toLowerCase().trim()
  if (!query) return categories.value
  return categories.value.filter(c => 
    c.nameEn.toLowerCase().includes(query) || 
    c.nameAr.toLowerCase().includes(query) || 
    c.slug.toLowerCase().includes(query) ||
    c.descriptionEn.toLowerCase().includes(query) ||
    c.descriptionAr.toLowerCase().includes(query)
  )
})

// Active Categories Count
const activeCategoriesCount = computed(() => {
  return categories.value.filter(c => c.status === 'Active').length
})

// Category CRUD Operations
const openAddCategoryModal = () => {
  categoryModalMode.value = 'create'
  categoryForm.value = {
    id: `cat-${Date.now()}`,
    slug: '',
    nameEn: '',
    nameAr: '',
    descriptionEn: '',
    descriptionAr: '',
    icon: 'HelpCircle',
    color: 'emerald',
    order: categories.value.length + 1,
    status: 'Active'
  }
  isCategoryModalOpen.value = true
}

const openEditCategoryModal = (cat: HelpCategoryItem) => {
  categoryModalMode.value = 'edit'
  categoryForm.value = { ...cat }
  isCategoryModalOpen.value = true
}

const handleSaveCategory = () => {
  if (!categoryForm.value.nameEn.trim() || !categoryForm.value.nameAr.trim()) {
    toast.error(isAr.value ? 'يرجى إدخال اسم القسم باللغتين العربية والإنجليزية' : 'Please provide both English and Arabic category names')
    return
  }

  // Auto-generate slug if empty
  if (!categoryForm.value.slug.trim()) {
    categoryForm.value.slug = categoryForm.value.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
  }

  if (categoryModalMode.value === 'create') {
    // Check if slug already exists
    const slugExists = categories.value.some(c => c.slug === categoryForm.value.slug)
    if (slugExists) {
      toast.error(isAr.value ? 'المعرّف اللطيف (Slug) مستخدم بالفعل. يرجى اختيار معرّف فريد.' : 'Category slug identifier already exists. Please choose a unique slug.')
      return
    }

    categories.value.push({
      ...categoryForm.value,
      nameEn: categoryForm.value.nameEn.trim(),
      nameAr: categoryForm.value.nameAr.trim(),
      slug: categoryForm.value.slug.trim(),
      descriptionEn: categoryForm.value.descriptionEn.trim(),
      descriptionAr: categoryForm.value.descriptionAr.trim(),
    })
    toast.success(isAr.value ? 'تم إنشاء قسم المساعدة بنجاح!' : 'Help category created successfully!')
  } else {
    const idx = categories.value.findIndex(c => c.id === categoryForm.value.id)
    if (idx !== -1) {
      categories.value[idx] = {
        ...categoryForm.value,
        nameEn: categoryForm.value.nameEn.trim(),
        nameAr: categoryForm.value.nameAr.trim(),
        slug: categoryForm.value.slug.trim(),
        descriptionEn: categoryForm.value.descriptionEn.trim(),
        descriptionAr: categoryForm.value.descriptionAr.trim(),
      }
      toast.success(isAr.value ? 'تم تحديث قسم المساعدة بنجاح!' : 'Help category updated successfully!')
    }
  }
  isCategoryModalOpen.value = false
}

const toggleCategoryStatus = (cat: HelpCategoryItem) => {
  cat.status = cat.status === 'Active' ? 'Inactive' : 'Active'
  const catName = isAr.value ? (cat.nameAr || cat.nameEn) : cat.nameEn
  const statusLabel = cat.status === 'Active' ? (isAr.value ? 'نشط' : 'Active') : (isAr.value ? 'غير نشط' : 'Inactive')
  toast.success(isAr.value ? `تم تعيين حالة قسم "${catName}" إلى ${statusLabel}` : `Category "${cat.nameEn}" set to ${cat.status}`)
}

const handleDeleteCategory = async (cat: HelpCategoryItem) => {
  const linkedCount = getFaqsCountForCategory(cat.slug)
  const catName = isAr.value ? (cat.nameAr || cat.nameEn) : cat.nameEn
  let confirmMessage = isAr.value
    ? `هل أنت متأكد من رغبتك في حذف قسم "${catName}"؟`
    : `Are you sure you want to delete category "${cat.nameEn}"?`
  if (linkedCount > 0) {
    confirmMessage += isAr.value
      ? `\nتنبيه: يوجد ${linkedCount} سؤال شائع مرتبط بهذا القسم.`
      : `\nWarning: There are ${linkedCount} FAQ(s) linked to this category.`
  }

  const ok = await confirm({
    title: isAr.value ? 'حذف قسم المساعدة' : 'Delete Help Category',
    message: confirmMessage,
    confirmText: isAr.value ? 'حذف القسم' : 'Delete Category',
    cancelText: t('common.cancel'),
    type: 'danger'
  })

  if (ok) {
    categories.value = categories.value.filter(c => c.id !== cat.id)
    if (selectedCategory.value === cat.slug) {
      selectedCategory.value = 'all'
    }
    toast.success(isAr.value ? 'تم حذف القسم بنجاح' : 'Category removed successfully')
  }
}

// FAQ CRUD Operations
const openAddFaqModal = () => {
  faqModalMode.value = 'create'
  const defaultCat = categories.value[0]?.slug ?? 'general'
  faqForm.value = {
    id: '',
    question: '',
    answer: '',
    category: selectedCategory.value === 'all' ? defaultCat : selectedCategory.value,
    status: 'Published'
  }
  isFaqModalOpen.value = true
}

const openEditFaqModal = (faq: FAQItem) => {
  faqModalMode.value = 'edit'
  faqForm.value = {
    id: faq.id,
    question: faq.question,
    answer: faq.answer,
    category: faq.category,
    status: faq.status
  }
  isFaqModalOpen.value = true
}

const handleSaveFaq = () => {
  if (!faqForm.value.question.trim() || !faqForm.value.answer.trim()) {
    toast.error(isAr.value ? 'يرجى إدخال كل من السؤال والإجابة' : 'Please enter both question and answer')
    return
  }

  if (faqModalMode.value === 'create') {
    faqs.value.unshift({
      id: `faq-${Date.now()}`,
      question: faqForm.value.question.trim(),
      answer: faqForm.value.answer.trim(),
      category: faqForm.value.category,
      views: 0,
      status: faqForm.value.status,
      order: faqs.value.length + 1
    })
    toast.success(isAr.value ? 'تمت إضافة السؤال الشائع بنجاح!' : 'FAQ question added successfully!')
  } else {
    const idx = faqs.value.findIndex(f => f.id === faqForm.value.id)
    if (idx !== -1) {
      const existing = faqs.value[idx]!
      faqs.value[idx] = {
        id: existing.id,
        views: existing.views,
        order: existing.order,
        question: faqForm.value.question.trim(),
        answer: faqForm.value.answer.trim(),
        category: faqForm.value.category,
        status: faqForm.value.status
      }
      toast.success(isAr.value ? 'تم تحديث السؤال الشائع بنجاح!' : 'FAQ updated successfully!')
    }
  }
  isFaqModalOpen.value = false
}

const handleDeleteFaq = async (faq: FAQItem) => {
  const ok = await confirm({
    title: isAr.value ? 'حذف السؤال الشائع' : 'Delete FAQ',
    message: isAr.value ? `هل أنت متأكد من رغبتك في حذف "${faq.question}"؟` : `Are you sure you want to delete "${faq.question}"?`,
    confirmText: isAr.value ? 'حذف' : 'Delete',
    cancelText: t('common.cancel'),
    type: 'danger'
  })

  if (ok) {
    faqs.value = faqs.value.filter(f => f.id !== faq.id)
    toast.success(isAr.value ? 'تم حذف السؤال الشائع بنجاح' : 'FAQ item removed')
  }
}

const openTicketDetails = (ticket: TicketItem) => {
  selectedTicket.value = ticket
  isTicketModalOpen.value = true
}

const updateTicketStatus = (ticket: TicketItem, status: 'Open' | 'In Progress' | 'Resolved') => {
  ticket.status = status
  const statusLabel = status === 'Open'
    ? (isAr.value ? 'مفتوحة' : 'Open')
    : status === 'In Progress'
    ? (isAr.value ? 'قيد المعالجة' : 'In Progress')
    : (isAr.value ? 'تم الحل' : 'Resolved')
  toast.success(isAr.value ? `تم تعيين حالة التذكرة إلى: ${statusLabel}` : `Ticket marked as ${status}`)
}

const saveContactSettings = () => {
  toast.success(isAr.value ? 'تم حفظ إعدادات التواصل بمركز المساعدة بنجاح!' : 'Help Center contact settings updated successfully!')
}

// Icon mapper helper
const getCategoryIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'Shield': return Shield
    case 'CreditCard': return CreditCard
    case 'TrendingUp': return TrendingUp
    case 'Video': return Video
    case 'BookOpen': return BookOpen
    case 'Users': return Users
    case 'Smartphone': return Smartphone
    case 'Settings': return SettingsIcon
    case 'Headphones': return Headphones
    default: return QuestionIcon
  }
}

// Color classes helper
const getColorBadgeClasses = (color: string) => {
  switch (color) {
    case 'blue': return 'bg-blue-50 text-blue-600 border-blue-200'
    case 'purple': return 'bg-purple-50 text-purple-600 border-purple-200'
    case 'amber': return 'bg-amber-50 text-amber-600 border-amber-200'
    case 'rose': return 'bg-rose-50 text-rose-600 border-rose-200'
    case 'indigo': return 'bg-indigo-50 text-indigo-600 border-indigo-200'
    case 'teal': return 'bg-teal-50 text-teal-600 border-teal-200'
    case 'emerald':
    default:
      return 'bg-emerald-50 text-emerald-600 border-emerald-200'
  }
}
</script>

<template>
  <AppShell>
    <div class="flex flex-col gap-6 max-w-7xl mx-auto">
      <!-- Header -->
      <PageHeader
        :title="t('helpCenter.title')"
        :description="t('helpCenter.subtitle')"
      >
        <template #actions>
          <button
            v-if="activeTab === 'faqs'"
            type="button"
            @click="openAddFaqModal"
            class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-sm shadow-emerald-600/20 cursor-pointer"
          >
            <Plus class="w-4 h-4" />
            <span>{{ t('helpCenter.addFaq') }}</span>
          </button>

          <button
            v-if="activeTab === 'categories'"
            type="button"
            @click="openAddCategoryModal"
            class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-sm shadow-emerald-600/20 cursor-pointer"
          >
            <FolderPlus class="w-4 h-4" />
            <span>{{ t('helpCenter.addCategory') }}</span>
          </button>
        </template>
      </PageHeader>

      <!-- Tab Navigation -->
      <div class="flex items-center gap-2 border-b border-slate-200 overflow-x-auto">
        <!-- FAQs Tab -->
        <button
          type="button"
          @click="activeTab = 'faqs'"
          :class="[
            'px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 shrink-0',
            activeTab === 'faqs'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          ]"
        >
          <HelpCircle class="w-4 h-4" />
          <span>{{ t('helpCenter.faqsTab') }} ({{ faqs.length }})</span>
        </button>

        <!-- Categories Tab -->
        <button
          type="button"
          @click="activeTab = 'categories'"
          :class="[
            'px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 shrink-0',
            activeTab === 'categories'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          ]"
        >
          <Layers class="w-4 h-4" />
          <span>{{ t('helpCenter.categoriesTab') }} ({{ categories.length }})</span>
        </button>

        <!-- Support Tickets Tab -->
        <button
          type="button"
          @click="activeTab = 'tickets'"
          :class="[
            'px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 shrink-0',
            activeTab === 'tickets'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          ]"
        >
          <MessageSquare class="w-4 h-4" />
          <span>{{ t('helpCenter.ticketsTab') }} ({{ tickets.length }})</span>
        </button>

        <!-- Contact Channels Tab -->
        <button
          type="button"
          @click="activeTab = 'contact'"
          :class="[
            'px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 shrink-0',
            activeTab === 'contact'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          ]"
        >
          <Headphones class="w-4 h-4" />
          <span>{{ t('helpCenter.contactTab') }}</span>
        </button>
      </div>

      <!-- ==================== TAB 1: FAQ MANAGEMENT ==================== -->
      <div v-if="activeTab === 'faqs'" class="flex flex-col gap-5">
        <!-- Search & Category Filters -->
        <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
          <div class="relative w-full md:w-80">
            <Search class="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="t('helpCenter.searchPlaceholder')"
              class="w-full bg-slate-50/80 border border-slate-200 rounded-xl ps-10 pe-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
            />
          </div>

          <!-- Category Selector -->
          <div class="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            <button
              v-for="cat in availableCategoriesForFilter"
              :key="cat.id"
              type="button"
              @click="selectedCategory = cat.id"
              :class="[
                'px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0',
                selectedCategory === cat.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              ]"
            >
              {{ cat.label }}
            </button>
          </div>
        </div>

        <!-- FAQs Accordion / Cards List -->
        <div class="grid grid-cols-1 gap-3.5">
          <div
            v-for="faq in filteredFaqs"
            :key="faq.id"
            class="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between gap-3"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="flex items-start gap-3">
                <div class="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <QuestionIcon class="w-4 h-4" />
                </div>
                <div class="flex flex-col">
                  <div class="flex items-center gap-2 flex-wrap mb-1">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                      {{ categories.find(c => c.slug === faq.category)?.nameEn || faq.category }}
                    </span>
                    <span class="text-[10px] text-slate-400 font-medium">Order: #{{ faq.order }}</span>
                    <span class="text-[10px] text-slate-400 font-medium">• {{ faq.views }} views</span>
                  </div>
                  <h3 class="text-sm font-bold text-slate-900 leading-snug">
                    {{ faq.question }}
                  </h3>
                </div>
              </div>

              <div class="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  @click="openEditFaqModal(faq)"
                  class="p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                  title="Edit FAQ"
                >
                  <Edit3 class="w-4 h-4" />
                </button>
                <button
                  type="button"
                  @click="handleDeleteFaq(faq)"
                  class="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Delete FAQ"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Answer Content -->
            <div class="ps-10 text-xs text-slate-600 leading-relaxed bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
              {{ faq.answer }}
            </div>

            <div class="ps-10 flex items-center justify-between">
              <StatusBadge :status="faq.status" />
            </div>
          </div>

          <!-- Empty State -->
          <div
            v-if="filteredFaqs.length === 0"
            class="bg-white rounded-2xl border border-slate-200/80 p-12 text-center flex flex-col items-center justify-center gap-3"
          >
            <div class="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
              <QuestionIcon class="w-6 h-6" />
            </div>
            <h4 class="text-sm font-bold text-slate-800">No FAQ questions found</h4>
            <p class="text-xs text-slate-400 max-w-sm">Try adjusting your search query or filter by another category.</p>
          </div>
        </div>
      </div>

      <!-- ==================== TAB 2: CATEGORY MANAGEMENT ==================== -->
      <div v-if="activeTab === 'categories'" class="flex flex-col gap-5">
        <!-- Overview Stats -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
            <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Layers class="w-5 h-5" />
            </div>
            <div>
              <span class="text-xs text-slate-400 font-medium block">Total Categories</span>
              <span class="text-lg font-black text-slate-900">{{ categories.length }}</span>
            </div>
          </div>

          <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
            <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <CheckCircle class="w-5 h-5" />
            </div>
            <div>
              <span class="text-xs text-slate-400 font-medium block">Active in App</span>
              <span class="text-lg font-black text-blue-700">{{ activeCategoriesCount }}</span>
            </div>
          </div>

          <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
            <div class="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <HelpCircle class="w-5 h-5" />
            </div>
            <div>
              <span class="text-xs text-slate-400 font-medium block">Total Linked FAQs</span>
              <span class="text-lg font-black text-purple-700">{{ faqs.length }}</span>
            </div>
          </div>
        </div>

        <!-- Search Bar -->
        <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between gap-3">
          <div class="relative w-full max-w-md">
            <Search class="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              v-model="categorySearchQuery"
              type="text"
              :placeholder="t('helpCenter.searchCategoriesPlaceholder')"
              class="w-full bg-slate-50/80 border border-slate-200 rounded-xl ps-10 pe-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
            />
          </div>

          <span class="text-xs text-slate-400 font-medium hidden sm:inline">
            Showing {{ filteredCategories.length }} categories
          </span>
        </div>

        <!-- Category Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="cat in filteredCategories"
            :key="cat.id"
            class="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between gap-4 relative group"
          >
            <!-- Card Header -->
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-3">
                <div :class="['w-10 h-10 rounded-xl flex items-center justify-center border shrink-0', getColorBadgeClasses(cat.color)]">
                  <component :is="getCategoryIconComponent(cat.icon)" class="w-5 h-5" />
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <h3 class="text-sm font-bold text-slate-900 leading-snug">
                      {{ cat.nameEn }}
                    </h3>
                    <span class="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      #{{ cat.slug }}
                    </span>
                  </div>
                  <span class="text-xs font-semibold text-emerald-700 block mt-0.5" dir="rtl">
                    {{ cat.nameAr }}
                  </span>
                </div>
              </div>

              <!-- Quick Status Toggle -->
              <button
                type="button"
                @click="toggleCategoryStatus(cat)"
                class="cursor-pointer"
                :title="cat.status === 'Active' ? 'Deactivate Category' : 'Activate Category'"
              >
                <StatusBadge :status="cat.status === 'Active' ? 'Active' : 'Inactive'" />
              </button>
            </div>

            <!-- Description -->
            <div class="space-y-1.5 bg-slate-50/50 p-3 rounded-xl border border-slate-100 text-xs text-slate-600">
              <p class="leading-relaxed">{{ cat.descriptionEn }}</p>
              <p class="leading-relaxed text-slate-500 border-t border-slate-200/60 pt-1.5 mt-1" dir="rtl">{{ cat.descriptionAr }}</p>
            </div>

            <!-- Footer: Linked FAQs & Actions -->
            <div class="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-100">
                  <QuestionIcon class="w-3.5 h-3.5" />
                  <span>{{ getFaqsCountForCategory(cat.slug) }} FAQ Questions</span>
                </span>
                <span class="text-[11px] text-slate-400 font-medium">Order: {{ cat.order }}</span>
              </div>

              <div class="flex items-center gap-1">
                <button
                  type="button"
                  @click="openEditCategoryModal(cat)"
                  class="p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                  title="Edit Category"
                >
                  <Edit3 class="w-4 h-4" />
                </button>
                <button
                  type="button"
                  @click="handleDeleteCategory(cat)"
                  class="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Delete Category"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ==================== TAB 3: SUPPORT TICKETS ==================== -->
      <div v-if="activeTab === 'tickets'" class="flex flex-col gap-4">
        <div class="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs overflow-x-auto">
          <table class="w-full text-start text-xs">
            <thead>
              <tr class="text-[11px] font-bold text-slate-400 border-b border-slate-100 uppercase tracking-wider bg-slate-50/50">
                <th class="py-3 px-4 text-start">Ticket ID</th>
                <th class="py-3 px-4 text-start">User</th>
                <th class="py-3 px-4 text-start">Subject</th>
                <th class="py-3 px-4 text-start">Category</th>
                <th class="py-3 px-4 text-start">Priority</th>
                <th class="py-3 px-4 text-start">Status</th>
                <th class="py-3 px-4 text-start">Date</th>
                <th class="py-3 px-4 text-end">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="ticket in tickets" :key="ticket.id" class="hover:bg-slate-50/60 transition-colors">
                <td class="py-3.5 px-4 font-mono font-bold text-slate-800 text-start">{{ ticket.id }}</td>
                <td class="py-3.5 px-4 text-start">
                  <div class="font-bold text-slate-900">{{ ticket.user }}</div>
                  <div class="text-[10px] text-slate-400">{{ ticket.email }}</div>
                </td>
                <td class="py-3.5 px-4 font-medium text-slate-800 text-start max-w-xs truncate">{{ ticket.subject }}</td>
                <td class="py-3.5 px-4 text-slate-500 font-medium text-start">{{ ticket.category }}</td>
                <td class="py-3.5 px-4 text-start">
                  <span
                    :class="[
                      'text-[10px] font-bold px-2 py-0.5 rounded-md border',
                      ticket.priority === 'High' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                      ticket.priority === 'Medium' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                      'bg-slate-50 text-slate-600 border-slate-200'
                    ]"
                  >
                    {{ ticket.priority }}
                  </span>
                </td>
                <td class="py-3.5 px-4 text-start">
                  <StatusBadge :status="ticket.status" />
                </td>
                <td class="py-3.5 px-4 text-slate-400 text-start">{{ ticket.date }}</td>
                <td class="py-3.5 px-4 text-end">
                  <button
                    type="button"
                    @click="openTicketDetails(ticket)"
                    class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Inspect
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ==================== TAB 4: CONTACT CHANNELS ==================== -->
      <div v-if="activeTab === 'contact'" class="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs flex flex-col gap-6 max-w-3xl">
        <div>
          <h3 class="text-sm font-bold text-slate-900">Direct Support & Inquiries Configuration</h3>
          <p class="text-xs text-slate-500 mt-0.5">These contact channels are displayed in the mobile app drawer and Help Center footer.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div class="flex flex-col gap-1.5">
            <label class="font-bold text-slate-700 flex items-center gap-1.5">
              <Mail class="w-3.5 h-3.5 text-emerald-600" />
              Primary Support Email
            </label>
            <input
              v-model="contactSettings.supportEmail"
              type="email"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="font-bold text-slate-700 flex items-center gap-1.5">
              <Mail class="w-3.5 h-3.5 text-emerald-600" />
              General Inquiries Email
            </label>
            <input
              v-model="contactSettings.inquiryEmail"
              type="email"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="font-bold text-slate-700 flex items-center gap-1.5">
              <MessageSquare class="w-3.5 h-3.5 text-emerald-600" />
              WhatsApp Helpdesk Number
            </label>
            <input
              v-model="contactSettings.whatsappNumber"
              type="text"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="font-bold text-slate-700 flex items-center gap-1.5">
              <Phone class="w-3.5 h-3.5 text-emerald-600" />
              Phone Support Line
            </label>
            <input
              v-model="contactSettings.phoneSupport"
              type="text"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
            />
          </div>

          <div class="flex flex-col gap-1.5 md:col-span-2">
            <label class="font-bold text-slate-700 flex items-center gap-1.5">
              <Clock class="w-3.5 h-3.5 text-emerald-600" />
              Working Hours Notice
            </label>
            <input
              v-model="contactSettings.businessHours"
              type="text"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
            />
          </div>
        </div>

        <div class="pt-4 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            @click="saveContactSettings"
            class="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            Save Channels Settings
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== ADD / EDIT CATEGORY MODAL ==================== -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div v-if="isCategoryModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
        <div class="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in">
          <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div class="flex items-center gap-2">
              <FolderPlus class="w-5 h-5 text-emerald-600" />
              <h3 class="text-sm font-bold text-slate-900">
                {{ categoryModalMode === 'create' ? (isAr ? 'إضافة قسم جديد' : 'Create Help Category') : (isAr ? 'تعديل بيانات القسم' : 'Edit Help Category') }}
              </h3>
            </div>
            <button type="button" @click="isCategoryModalOpen = false" class="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer">
              <X class="w-5 h-5" />
            </button>
          </div>

          <form @submit.prevent="handleSaveCategory" class="p-6 flex flex-col gap-4 text-xs">
            <!-- Names Grid (EN / AR) -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="flex flex-col gap-1.5">
                <label class="font-bold text-slate-700">{{ isAr ? 'اسم القسم (بالإنجليزية) *' : 'Category Name (English) *' }}</label>
                <input
                  v-model="categoryForm.nameEn"
                  type="text"
                  placeholder="e.g. Account & Security"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  required
                />
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="font-bold text-slate-700 text-end" dir="rtl">{{ isAr ? 'اسم القسم (بالعربية) *' : 'Category Name (Arabic) *' }}</label>
                <input
                  v-model="categoryForm.nameAr"
                  type="text"
                  placeholder="مثال: الحساب والأمان"
                  dir="rtl"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white text-end"
                  required
                />
              </div>
            </div>

            <!-- Slug & Order -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="flex flex-col gap-1.5">
                <label class="font-bold text-slate-700">{{ isAr ? 'المعرف الفريد (Slug)' : 'Slug Identifier' }}</label>
                <input
                  v-model="categoryForm.slug"
                  type="text"
                  placeholder="e.g. account-security"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white font-mono"
                />
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="font-bold text-slate-700">{{ isAr ? 'ترتيب العرض' : 'Display Order' }}</label>
                <input
                  v-model.number="categoryForm.order"
                  type="number"
                  min="1"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>
            </div>

            <!-- Icon & Color Selection -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="flex flex-col gap-1.5">
                <label class="font-bold text-slate-700">{{ isAr ? 'أيقونة القسم' : 'Category Icon' }}</label>
                <select
                  v-model="categoryForm.icon"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="Shield">Shield (Security & Accounts)</option>
                  <option value="CreditCard">CreditCard (Billing & Plans)</option>
                  <option value="TrendingUp">TrendingUp (Trading & Charts)</option>
                  <option value="Video">Video (Lessons & Courses)</option>
                  <option value="BookOpen">BookOpen (Guides & Glossary)</option>
                  <option value="Smartphone">Smartphone (Mobile App)</option>
                  <option value="Users">Users (Community)</option>
                  <option value="Headphones">Headphones (Support)</option>
                  <option value="HelpCircle">HelpCircle (General)</option>
                </select>
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="font-bold text-slate-700">{{ isAr ? 'لون الشارة المميز' : 'Badge Theme Color' }}</label>
                <select
                  v-model="categoryForm.color"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="emerald">Emerald Green</option>
                  <option value="blue">Blue</option>
                  <option value="purple">Purple</option>
                  <option value="amber">Amber</option>
                  <option value="rose">Rose</option>
                  <option value="indigo">Indigo</option>
                  <option value="teal">Teal</option>
                </select>
              </div>
            </div>

            <!-- Descriptions (EN / AR) -->
            <div class="flex flex-col gap-1.5">
              <label class="font-bold text-slate-700">{{ isAr ? 'الوصف (بالإنجليزية)' : 'Description (English)' }}</label>
              <textarea
                v-model="categoryForm.descriptionEn"
                rows="2"
                placeholder="Brief summary of questions covered in this category"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white resize-none"
              ></textarea>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="font-bold text-slate-700 text-end" dir="rtl">{{ isAr ? 'الوصف (بالعربية)' : 'Description (Arabic)' }}</label>
              <textarea
                v-model="categoryForm.descriptionAr"
                rows="2"
                dir="rtl"
                placeholder="ملخص مختصر للأسئلة والموضوعات المغطاة في هذا القسم"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white resize-none text-end"
              ></textarea>
            </div>

            <!-- Status -->
            <div class="flex flex-col gap-1.5">
              <label class="font-bold text-slate-700">{{ t('common.status') }}</label>
              <div class="flex items-center gap-4">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="radio" v-model="categoryForm.status" value="Active" class="accent-emerald-600" />
                  <span class="font-semibold text-slate-800">{{ isAr ? 'نشط (ظاهر في التطبيق)' : 'Active (Visible in app)' }}</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="radio" v-model="categoryForm.status" value="Inactive" class="accent-emerald-600" />
                  <span class="font-semibold text-slate-500">{{ isAr ? 'غير نشط (مخفي)' : 'Inactive (Hidden)' }}</span>
                </label>
              </div>
            </div>

            <!-- Actions -->
            <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                @click="isCategoryModalOpen = false"
                class="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                {{ t('common.cancel') }}
              </button>
              <button
                type="submit"
                class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                {{ isAr ? 'حفظ القسم' : 'Save Category' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <!-- ==================== ADD / EDIT FAQ MODAL ==================== -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div v-if="isFaqModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
        <div class="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in">
          <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div class="flex items-center gap-2">
              <QuestionIcon class="w-5 h-5 text-emerald-600" />
              <h3 class="text-sm font-bold text-slate-900">
                {{ faqModalMode === 'create' ? (isAr ? 'إضافة سؤال شائع جديد' : 'Add New FAQ Question') : (isAr ? 'تعديل السؤال الشائع' : 'Edit FAQ Question') }}
              </h3>
            </div>
            <button type="button" @click="isFaqModalOpen = false" class="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer">
              <X class="w-5 h-5" />
            </button>
          </div>

          <form @submit.prevent="handleSaveFaq" class="p-6 flex flex-col gap-4 text-xs">
            <div class="flex flex-col gap-1.5">
              <label class="font-bold text-slate-700">{{ isAr ? 'عنوان السؤال *' : 'Question Title *' }}</label>
              <input
                v-model="faqForm.question"
                type="text"
                :placeholder="isAr ? 'مثال: كيف يمكنني ترقية باقة الاشتراك؟' : 'e.g. How do I upgrade my subscription?'"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                required
              />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="flex flex-col gap-1.5">
                <label class="font-bold text-slate-700">{{ isAr ? 'القسم' : 'Category' }}</label>
                <select
                  v-model="faqForm.category"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option v-for="cat in categories" :key="cat.id" :value="cat.slug">
                    {{ isAr ? cat.nameAr : cat.nameEn }}
                  </option>
                </select>
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="font-bold text-slate-700">{{ t('common.status') }}</label>
                <select
                  v-model="faqForm.status"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="Published">{{ t('common.published') }}</option>
                  <option value="Draft">{{ t('common.draft') }}</option>
                </select>
              </div>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="font-bold text-slate-700">{{ isAr ? 'نص الإجابة التفصيلي *' : 'Detailed Answer Content *' }}</label>
              <textarea
                v-model="faqForm.answer"
                rows="5"
                :placeholder="isAr ? 'اكتب تعليمات وإرشادات الإجابة بوضوح...' : 'Write clear, helpful answer instructions...'"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white resize-none"
                required
              ></textarea>
            </div>

            <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                @click="isFaqModalOpen = false"
                class="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                {{ t('common.cancel') }}
              </button>
              <button
                type="submit"
                class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                {{ isAr ? 'حفظ السؤال' : 'Save Question' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <!-- ==================== TICKET INSPECTOR MODAL ==================== -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div v-if="isTicketModalOpen && selectedTicket" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
        <div class="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in">
          <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div class="flex items-center gap-2">
              <span class="font-mono font-bold text-xs text-slate-900 bg-slate-200 px-2 py-0.5 rounded-md" dir="ltr">
                {{ selectedTicket.id }}
              </span>
              <h3 class="text-sm font-bold text-slate-900">{{ isAr ? 'تفاصيل استفسار الدعم' : 'Support Inquiry Details' }}</h3>
            </div>
            <button type="button" @click="isTicketModalOpen = false" class="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer">
              <X class="w-5 h-5" />
            </button>
          </div>

          <div class="p-6 flex flex-col gap-4 text-xs">
            <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div>
                <span class="font-bold text-slate-900 text-xs block">{{ selectedTicket.user }}</span>
                <span class="text-slate-400 text-[10px]">{{ selectedTicket.email }}</span>
              </div>
              <StatusBadge :status="selectedTicket.status" />
            </div>

            <div>
              <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{{ isAr ? 'الموضوع' : 'Subject' }}</span>
              <p class="font-bold text-slate-900">{{ selectedTicket.subject }}</p>
            </div>

            <div>
              <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{{ isAr ? 'نص الرسالة' : 'Message Content' }}</span>
              <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-slate-700 leading-relaxed font-medium">
                {{ selectedTicket.message }}
              </div>
            </div>

            <!-- Quick Status Change Actions -->
            <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span class="text-[11px] font-bold text-slate-400 uppercase">{{ isAr ? 'تغيير الحالة' : 'Change Status' }}</span>
              <div class="flex items-center gap-1.5">
                <button
                  type="button"
                  @click="updateTicketStatus(selectedTicket, 'Open')"
                  class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 cursor-pointer"
                >
                  {{ isAr ? 'مفتوح' : 'Open' }}
                </button>
                <button
                  type="button"
                  @click="updateTicketStatus(selectedTicket, 'In Progress')"
                  class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 cursor-pointer"
                >
                  {{ isAr ? 'قيد المتابعة' : 'In Progress' }}
                </button>
                <button
                  type="button"
                  @click="updateTicketStatus(selectedTicket, 'Resolved')"
                  class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 cursor-pointer"
                >
                  {{ isAr ? 'تم الحل' : 'Resolved' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </AppShell>
</template>
