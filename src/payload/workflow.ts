import type { CollectionConfig, GlobalConfig } from 'payload'

import { authenticated, publishedOrStaff } from './access/roles'
import { approvalField } from './fields/approval'
import {
  enforcePublishRole,
  enforcePublishRoleGlobal,
  revalidateGlobalOnChange,
  revalidateOnChange,
  revalidateOnDelete,
} from './hooks/compliance'

const versions = { drafts: true, maxPerDoc: 100 } as const

/**
 * Every piece of public website content goes through the same workflow:
 * drafts + version history, publish restricted to compliance/admin, an approval
 * record in the sidebar, and site revalidation when published content changes.
 */
export const contentCollection = (config: CollectionConfig): CollectionConfig => ({
  ...config,
  versions,
  access: {
    read: publishedOrStaff,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
    readVersions: authenticated,
    ...config.access,
  },
  fields: [...config.fields, approvalField],
  hooks: {
    ...config.hooks,
    beforeChange: [enforcePublishRole, ...(config.hooks?.beforeChange ?? [])],
    afterChange: [revalidateOnChange, ...(config.hooks?.afterChange ?? [])],
    afterDelete: [revalidateOnDelete, ...(config.hooks?.afterDelete ?? [])],
  },
})

export const contentGlobal = (config: GlobalConfig): GlobalConfig => ({
  ...config,
  versions: { drafts: true, max: 100 },
  access: {
    read: () => true,
    update: authenticated,
    readVersions: authenticated,
    ...config.access,
  },
  fields: [...config.fields, approvalField],
  hooks: {
    ...config.hooks,
    beforeChange: [enforcePublishRoleGlobal, ...(config.hooks?.beforeChange ?? [])],
    afterChange: [revalidateGlobalOnChange, ...(config.hooks?.afterChange ?? [])],
  },
})
