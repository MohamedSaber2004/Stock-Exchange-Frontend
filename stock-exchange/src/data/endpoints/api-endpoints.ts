export class ApiEndpoints {
  public static readonly AboutUs = {
    Base: '/about-us',
    View: '/about-us/view',
  } as const

  public static readonly ActivityLogs = {
    Base: '/activity-logs',
    Summary: '/activity-logs/summary',
    ById: (id: string | number) => `/activity-logs/${id}`,
  } as const

  public static readonly Articles = {
    Base: '/articles',
    ById: (id: string | number) => `/articles/${id}`,
  } as const

  public static readonly ArticleCategories = {
    Base: '/article-categories',
    ById: (id: string | number) => `/article-categories/${id}`,
  } as const

  public static readonly Attachments = {
    Base: '/attachments',
    Upload: '/attachments/upload',
    UploadMultiple: '/attachments/upload-multiple',
    Update: '/attachments/update',
    Download: '/attachments/download',
  } as const

  public static readonly Authentication = {
    Base: '/authentication',
    Login: '/authentication/login',
    LoginWithGoogle: '/authentication/login-with-google',
    Register: '/authentication/register',
    Logout: '/authentication/logout',
    RefreshToken: '/authentication/refresh-token',
    ForgetPassword: '/authentication/forget-password',
    VerifyOtp: '/authentication/verify-otp',
    ResetPassword: '/authentication/reset-password',
    ChangePassword: '/authentication/change-password',
    UserProfile: '/authentication/my-profile',
    UpdateProfile: '/authentication/update/myprofile',
  } as const

  public static readonly Countries = {
    Base: '/countries',
    Paginated: '/countries/paginated',
    ById: (id: string | number) => `/countries/${id}`,
  } as const

  public static readonly Experts = {
    Base: '/experts',
    ById: (id: string | number) => `/experts/${id}`,
  } as const

  public static readonly HelpCenter = {
    Base: '/help-center',
    ById: (id: string | number) => `/help-center/${id}`,
    View: '/help-center/view',
  } as const

  public static readonly HelpCenterCategories = {
    Base: '/help-center-categories',
    ById: (id: string | number) => `/help-center-categories/${id}`,
  } as const

  public static readonly PrivacyPolicy = {
    Base: '/privacy-policy',
    ById: (id: string | number) => `/privacy-policy/${id}`,
    View: '/privacy-policy/view',
  } as const

  public static readonly TermsAndConditions = {
    Base: '/terms-and-conditions',
    ById: (id: string | number) => `/terms-and-conditions/${id}`,
    View: '/terms-and-conditions/view',
  } as const

  public static readonly Home = {
    Base: '/home',
    Hero: '/home/hero',
    News: '/home/news',
    Services: '/home/services',
    Articles: '/home/articles',
    Videos: '/home/videos',
    Plans: '/home/plans',
    Experts: '/home/experts',
  } as const

  public static readonly News = {
    Base: '/news',
    ById: (id: string | number) => `/news/${id}`,
  } as const

  public static readonly Overview = {
    Base: '/overview',
  } as const

  public static readonly Search = {
    Base: '/search',
    Global: (query: string, limit: number = 5) => `/search?query=${encodeURIComponent(query)}&limit=${limit}`,
  } as const

  public static readonly Services = {
    Base: '/services',
    ById: (id: string | number) => `/services/${id}`,
  } as const

  public static readonly SubscriptionPlans = {
    Base: '/subscription-plans',
  } as const

  public static readonly Users = {
    Base: '/users',
    ById: (id: string | number) => `/users/${id}`,
    ChangePassword: (id: string | number) => `/users/${id}/change-password`,
  } as const

  public static readonly Videos = {
    Base: '/videos',
    ById: (id: string | number) => `/videos/${id}`,
  } as const

  public static readonly VideoCategories = {
    Base: '/video-categories',
    ById: (id: string | number) => `/video-categories/${id}`,
  } as const
}

export const ApiRoutes = ApiEndpoints
