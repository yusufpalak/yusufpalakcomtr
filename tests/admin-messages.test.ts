import { describe, expect, it } from 'vitest'
import { adminMessageQuerySchema, adminMessageStatusSchema } from '../shared/schemas'

describe('admin message validation', () => {
  it('uses safe inbox defaults and parses the page number', () => {
    expect(adminMessageQuerySchema.parse({})).toEqual({ status: 'all', q: '', page: 1 })
    expect(adminMessageQuerySchema.parse({ status: 'archived', q: '  Yusuf  ', page: '2' })).toEqual({ status: 'archived', q: 'Yusuf', page: 2 })
  })

  it('rejects invalid filters, pages, and status mutations', () => {
    expect(adminMessageQuerySchema.safeParse({ status: 'deleted' }).success).toBe(false)
    expect(adminMessageQuerySchema.safeParse({ page: '-1' }).success).toBe(false)
    expect(adminMessageStatusSchema.safeParse({ status: 'new' }).success).toBe(true)
    expect(adminMessageStatusSchema.safeParse({ status: 'deleted' }).success).toBe(false)
    expect(adminMessageStatusSchema.safeParse({ status: 'read', deletedAt: null }).success).toBe(false)
  })
})
