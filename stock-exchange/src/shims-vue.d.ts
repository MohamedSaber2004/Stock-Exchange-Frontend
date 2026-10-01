/* eslint-disable */
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

import '@vue/runtime-core'

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $resolveAttachment: (fileName?: string | null, customBaseUrl?: string) => string
    $attachmentUrl: (fileName?: string | null, customBaseUrl?: string) => string
  }
}
