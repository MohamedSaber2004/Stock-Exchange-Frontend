import { ref, computed } from 'vue'

export type PlanTier = 'FREE' | 'BASIC' | 'PRO'

export type FeatureCategory = 'news' | 'articles' | 'videos'

export interface FeaturePermission {
  id: string
  key: string
  name: string
  nameAr: string
  description: string
  descriptionAr: string
  category: FeatureCategory
  categoryName: string
  categoryNameAr: string
  plans: Record<PlanTier, boolean>
}

const STORAGE_KEY = 'finwise_plan_permissions_v4'

const defaultPermissions: FeaturePermission[] = [
  // 1. Market News (CRUD in /news)
  {
    id: 'realtime_news',
    key: 'realtimeNews',
    name: 'Real-Time Market News & Bulletins',
    nameAr: 'أخبار وبيانات السوق اللحظية والعاجلة',
    description: 'Instant corporate disclosures, earnings reports, and breaking financial updates',
    descriptionAr: 'الاطلاع على كافة الأخبار المالية اللحظية وإفصاحات الشركات وتحديثات الأسهم',
    category: 'news',
    categoryName: 'Market News',
    categoryNameAr: 'أخبار السوق',
    plans: { FREE: true, BASIC: true, PRO: true }
  },

  // 2. Educational Articles & Guides (CRUD in /articles)
  {
    id: 'basic_articles',
    key: 'basicArticles',
    name: 'Standard Educational Articles & Guides',
    nameAr: 'قراءة المقالات التعليمية والأدلة الإرشادية',
    description: 'Access to beginner investing concepts, terminology, and foundational guides',
    descriptionAr: 'قراءة المقالات التعليمية العامة وشروحات المفاهيم الاستثمارية الأساسية',
    category: 'articles',
    categoryName: 'Articles & Guides',
    categoryNameAr: 'المقالات والأدلة التعليمية',
    plans: { FREE: true, BASIC: true, PRO: true }
  },
  {
    id: 'market_articles',
    key: 'marketArticles',
    name: 'In-Depth Market Analysis Articles',
    nameAr: 'قراءة المقالات والتحليلات المتعمقة',
    description: 'Comprehensive macroeconomic insights and professional daily stock breakdowns',
    descriptionAr: 'مراجعات اقتصادية شاملة وتقارير بحثية يومية لحركة الأسهم والقطاعات',
    category: 'articles',
    categoryName: 'Articles & Guides',
    categoryNameAr: 'المقالات والأدلة التعليمية',
    plans: { FREE: false, BASIC: true, PRO: true }
  },

  // 3. Educational Video Lessons (CRUD in /videos)
  {
    id: 'beginner_courses',
    key: 'beginnerCourses',
    name: 'Standard Video Lessons Library',
    nameAr: 'مشاهدة مكتبة الفيديوهات التعليمية الأساسية',
    description: 'Core concepts of capital allocation, order execution, and portfolio risk management',
    descriptionAr: 'مشاهدة شروحات الفيديو الأساسية لإدارة رأس المال وتنفيذ الأوامر بالبورصة',
    category: 'videos',
    categoryName: 'Educational Videos',
    categoryNameAr: 'الفيديوهات التعليمية',
    plans: { FREE: false, BASIC: true, PRO: true }
  },
  {
    id: 'technical_masterclass',
    key: 'technicalMasterclass',
    name: 'Advanced Technical Analysis Video Masterclass',
    nameAr: 'مشاهدة الدروس المرئية المتقدمة والتحليل الفني',
    description: 'Complex chart patterns, Fibonacci retracements, Bollinger Bands, and RSI indicators',
    descriptionAr: 'نماذج الشموع المركبة، نسب فيبوناتشي، ومؤشرات الزخم والسيولة المتقدمة بالفيديو',
    category: 'videos',
    categoryName: 'Educational Videos',
    categoryNameAr: 'الفيديوهات التعليمية',
    plans: { FREE: false, BASIC: false, PRO: true }
  }
]

// Global reactive state shared across all components
const permissions = ref<FeaturePermission[]>(loadStoredPermissions())

function loadStoredPermissions(): FeaturePermission[] {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('finwise_plan_permissions_v1')
    localStorage.removeItem('finwise_plan_permissions_v2')
    localStorage.removeItem('finwise_plan_permissions_v3')
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge to ensure only valid implemented features are preserved
          return defaultPermissions.map(def => {
            const found = parsed.find((p: any) => p.id === def.id)
            return found ? { ...def, plans: { ...def.plans, ...found.plans } } : def
          })
        }
      } catch (e) {
        console.error('Failed to parse stored permissions:', e)
      }
    }
  }
  return JSON.parse(JSON.stringify(defaultPermissions))
}

function persistPermissions() {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(permissions.value))
  }
}

export function usePlanPermissions() {
  const togglePermission = (featureId: string, plan: PlanTier) => {
    const target = permissions.value.find(p => p.id === featureId)
    if (target) {
      target.plans[plan] = !target.plans[plan]
      persistPermissions()
    }
  }

  const setPermission = (featureId: string, plan: PlanTier, value: boolean) => {
    const target = permissions.value.find(p => p.id === featureId)
    if (target) {
      target.plans[plan] = value
      persistPermissions()
    }
  }

  const resetToDefault = () => {
    permissions.value = JSON.parse(JSON.stringify(defaultPermissions))
    persistPermissions()
  }

  // Returns list of active features for a given plan in current language
  const getActiveFeaturesForPlan = (plan: PlanTier, isAr: boolean) => {
    return permissions.value
      .filter(p => p.plans[plan])
      .map(p => ({
        id: p.id,
        name: isAr ? p.nameAr : p.name,
        description: isAr ? p.descriptionAr : p.description,
        category: isAr ? p.categoryNameAr : p.categoryName
      }))
  }

  // Grouped features by category for easy display
  const groupedPermissions = computed(() => {
    const groups: {
      category: FeatureCategory
      name: string
      nameAr: string
      features: FeaturePermission[]
    }[] = [
      {
        category: 'news',
        name: 'Market News',
        nameAr: 'أخبار السوق',
        features: permissions.value.filter(p => p.category === 'news')
      },
      {
        category: 'articles',
        name: 'Articles & Guides',
        nameAr: 'المقالات والأدلة',
        features: permissions.value.filter(p => p.category === 'articles')
      },
      {
        category: 'videos',
        name: 'Educational Videos',
        nameAr: 'الفيديوهات التعليمية',
        features: permissions.value.filter(p => p.category === 'videos')
      }
    ]
    return groups
  })

  // Dynamic counts of active features per plan
  const planFeatureCounts = computed(() => ({
    FREE: permissions.value.filter(p => p.plans.FREE).length,
    BASIC: permissions.value.filter(p => p.plans.BASIC).length,
    PRO: permissions.value.filter(p => p.plans.PRO).length,
  }))

  return {
    permissions,
    groupedPermissions,
    planFeatureCounts,
    togglePermission,
    setPermission,
    resetToDefault,
    getActiveFeaturesForPlan,
    persistPermissions,
  }
}
