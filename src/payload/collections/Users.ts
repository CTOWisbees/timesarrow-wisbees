import type { CollectionConfig } from 'payload'

import { adminFieldOnly, adminOnly, hasRole, ROLES } from '../access/roles'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['name', 'email', 'role'],
    group: 'Admin',
  },
  auth: true,
  access: {
    // Staff can see each other; only admins manage accounts.
    read: ({ req }) => Boolean(req.user),
    create: adminOnly,
    delete: adminOnly,
    update: ({ req, id }) => hasRole(req.user, 'admin') || req.user?.id === id,
  },
  fields: [
    { name: 'name', type: 'text' },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      saveToJWT: true,
      options: ROLES.map((role) => ({ label: role[0].toUpperCase() + role.slice(1), value: role })),
      access: { create: adminFieldOnly, update: adminFieldOnly },
      admin: {
        description:
          'Editors draft content. Compliance reviews and publishes. Admins also manage users.',
      },
    },
  ],
}
