import { describe, expect, it } from 'vitest'
import en from '../i18n/locales/en.json'
import tr from '../i18n/locales/tr.json'

function messageKeys(value: unknown, prefix = ''): string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return prefix ? [prefix] : []

  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key
    return child && typeof child === 'object' && !Array.isArray(child) ? messageKeys(child, path) : [path]
  })
}

describe('i18n messages', () => {
  it('keeps Turkish and English message keys in sync', () => {
    expect(messageKeys(en).sort()).toEqual(messageKeys(tr).sort())
  })

  it('contains no blank translations', () => {
    for (const messages of [tr, en]) {
      expect(Object.values(messages).length).toBeGreaterThan(0)
      expect(JSON.stringify(messages)).not.toContain('""')
    }
  })
})
