import { describe, expect, it } from 'vitest'
import { siteProfileSchema } from '../shared/schemas'

describe('site profile settings', () => {
  it('accepts and trims the fields shown in the editor', () => {
    expect(siteProfileSchema.parse({ name: ' Yusuf Palak ', title: ' Developer ', focus: [' Web ', ' Backend '] })).toEqual({
      name: 'Yusuf Palak',
      title: 'Developer',
      focus: ['Web', 'Backend'],
    })
  })

  it('rejects empty identity fields and too many focus areas', () => {
    expect(siteProfileSchema.safeParse({ name: '', title: 'Developer', focus: [] }).success).toBe(false)
    expect(siteProfileSchema.safeParse({ name: 'Yusuf Palak', title: '', focus: [] }).success).toBe(false)
    expect(siteProfileSchema.safeParse({ name: 'Yusuf Palak', title: 'Developer', focus: Array(13).fill('Web') }).success).toBe(false)
  })
})
