export const defaultLocale = 'tr' as const

export const supportedLocales = [
  { code: 'tr', name: 'Türkçe', language: 'tr-TR', file: 'tr.json' },
  { code: 'en', name: 'English', language: 'en-US', file: 'en.json' },
] as const

export type SupportedLocale = typeof supportedLocales[number]['code']

export const supportedLocaleCodes = supportedLocales.map(locale => locale.code) as [SupportedLocale, ...SupportedLocale[]]

export function isSupportedLocale(value: unknown): value is SupportedLocale {
  return typeof value === 'string' && supportedLocaleCodes.includes(value as SupportedLocale)
}
