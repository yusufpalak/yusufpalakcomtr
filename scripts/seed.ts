import 'dotenv/config'
import argon2 from 'argon2'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { and, eq } from 'drizzle-orm'
import { adminUsers, blogCategories, blogPosts, siteSettings, skillCategories, skills } from '../server/database/schema'
import { readingTime } from '../shared/utils/content'

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL zorunludur.')
const client = postgres(process.env.DATABASE_URL)
const db = drizzle(client)

await db.insert(siteSettings).values({ key: 'profile', value: { name: 'Yusuf Palak', title: 'Full-Stack Developer', focus: ['Web geliştirme', 'Backend sistemleri', 'Veritabanı', 'DevOps'] } }).onConflictDoUpdate({ target: siteSettings.key, set: { value: { name: 'Yusuf Palak', title: 'Full-Stack Developer', focus: ['Web geliştirme', 'Backend sistemleri', 'Veritabanı', 'DevOps'] }, updatedAt: new Date() } })

const [skillCategory] = await db.insert(skillCategories).values({ name: 'Teknik', slug: 'teknik' }).onConflictDoUpdate({ target: skillCategories.slug, set: { name: 'Teknik' } }).returning()
for (const name of ['.NET', 'SQL Server', 'JavaScript', 'TypeScript', 'Vue', 'Nuxt', 'Docker', 'PostgreSQL']) {
  const existing = await db.select({ id: skills.id }).from(skills).where(and(eq(skills.name, name), eq(skills.categoryId, skillCategory!.id))).limit(1)
  if (!existing.length) await db.insert(skills).values({ categoryId: skillCategory!.id, name, level: 'İleri' })
}

const blogSeed = [
  { slug: 'guvenilir-web-uygulamalari', title: 'Güvenilir Web Uygulamaları Tasarlamak', excerpt: 'Modern web projelerinde güvenlik, performans ve bakım kolaylığını aynı mimari içinde ele almak.', category: 'Mimari', date: '2026-01-15', content: '<h2>Güvenlik varsayılan olmalı</h2><p>Doğrulama, yetkilendirme ve güvenli çıktı üretimi ürün tasarımının başlangıcında ele alınmalıdır.</p><h2>Küçük ve ölçülebilir adımlar</h2><p>Güvenlik başlıkları, hız sınırları ve audit kayıtları birlikte çalışan etkili katmanlardır.</p>' },
  { slug: 'nuxt-ile-surdurulebilir-urunler', title: 'Nuxt ile Sürdürülebilir Ürünler Geliştirmek', excerpt: 'SSR, tip güvenliği ve domain odaklı klasör yapısıyla büyümeye hazır bir ürün temeli kurmak.', category: 'Frontend', date: '2026-02-08', content: '<h2>Sayfadan ürüne geçiş</h2><p>İyi bir Nuxt mimarisi veri erişimi, doğrulama ve sunucu sınırlarını anlaşılır hale getirir.</p><h2>Tip güvenliği</h2><p>TypeScript strict mode ekip içinde varsayımları görünür kılar.</p>' },
  { slug: 'postgresql-ve-docker-ile-guvenli-dagitim', title: 'PostgreSQL ve Docker ile Güvenli Dağıtım', excerpt: 'Migration, yedekleme ve container sınırlarını production ortamında doğru konumlandırmak.', category: 'DevOps', date: '2026-03-02', content: '<h2>Migration dağıtımın parçasıdır</h2><p>Sürümlü migration dosyaları ayrı ve gözlemlenebilir bir iş olarak çalıştırılmalıdır.</p><h2>Container sınırları</h2><p>Secret yönetimi, kalıcı veri ve izleme kararları açıkça tasarlanmalıdır.</p>' }
]

for (const seed of blogSeed) {
  const [category] = await db.insert(blogCategories).values({ name: seed.category, slug: seed.category.toLocaleLowerCase('tr').replace('ı', 'i') }).onConflictDoUpdate({ target: blogCategories.slug, set: { name: seed.category } }).returning()
  await db.insert(blogPosts).values({ title: seed.title, slug: seed.slug, excerpt: seed.excerpt, content: seed.content, categoryId: category!.id, status: 'published', publishedAt: new Date(seed.date), readingMinutes: readingTime(seed.content) }).onConflictDoUpdate({ target: blogPosts.slug, set: { title: seed.title, excerpt: seed.excerpt, content: seed.content, categoryId: category!.id, status: 'published', publishedAt: new Date(seed.date), readingMinutes: readingTime(seed.content), updatedAt: new Date() } })
}

if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
  if (process.env.ADMIN_PASSWORD.length < 12) throw new Error('ADMIN_PASSWORD en az 12 karakter olmalıdır.')
  const email = process.env.ADMIN_EMAIL.toLowerCase()
  const existing = await db.select({ id: adminUsers.id }).from(adminUsers).where(eq(adminUsers.email, email))
  const passwordHash = await argon2.hash(process.env.ADMIN_PASSWORD, { type: argon2.argon2id })
  if (!existing.length) await db.insert(adminUsers).values({ email, passwordHash })
  else await db.update(adminUsers).set({ passwordHash, failedAttempts: 0, lockedUntil: null, updatedAt: new Date() }).where(eq(adminUsers.id, existing[0]!.id))
  console.log('Admin hesabı hazır.')
} else console.log('ADMIN_EMAIL/ADMIN_PASSWORD yok; admin oluşturulmadı.')

await client.end()
console.log('Seed tamamlandı.')
