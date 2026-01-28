import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: 'file:/Users/staff/Library/Application Support/Medical Control/database/medical_control.db',
  },
})
