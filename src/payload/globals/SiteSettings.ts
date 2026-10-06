import type { GlobalConfig } from 'payload'

import { linkArray, linkGroup } from '../fields/link'
import { contentGlobal } from '../workflow'

export const SiteSettings: GlobalConfig = contentGlobal({
  slug: 'site-settings',
  label: 'Site settings',
  admin: { group: 'Site' },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Brand',
          fields: [
            { name: 'siteName', type: 'text', required: true, defaultValue: 'WisBees' },
            { name: 'logo', type: 'upload', relationTo: 'media' },
            {
              name: 'metaDescription',
              type: 'textarea',
              admin: { description: 'Used by search engines and link previews.' },
            },
          ],
        },
        {
          label: 'Navigation',
          fields: [linkArray('navItems', 'Menu items'), linkGroup('loginCta', 'Login button')],
        },
        {
          label: 'Footer',
          fields: [
            {
              name: 'footerColumns',
              type: 'array',
              maxRows: 4,
              fields: [{ name: 'heading', type: 'text', required: true }, linkArray('links')],
            },
            {
              name: 'socialLinks',
              type: 'array',
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'platform',
                      type: 'select',
                      required: true,
                      options: ['linkedin', 'instagram', 'x', 'youtube'].map((value) => ({
                        label: value === 'x' ? 'X' : value[0].toUpperCase() + value.slice(1),
                        value,
                      })),
                    },
                    { name: 'href', type: 'text', required: true },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
})
