 
import '@vue/runtime-core'

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $resolveAttachment: (fileName?: string | null, customBaseUrl?: string) => string
    $attachmentUrl: (fileName?: string | null, customBaseUrl?: string) => string
  }
}
