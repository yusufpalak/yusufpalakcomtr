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

await db.insert(siteSettings).values({ key: 'profile', value: { name: 'Yusuf Palak', title: 'Full-Stack Developer', focus: ['Web geliştirme', 'Backend sistemleri', 'Veritabanı', 'DevOps'] } }).onConflictDoNothing({ target: siteSettings.key })

const [createdSkillCategory] = await db.insert(skillCategories).values({ name: 'Teknik', slug: 'teknik' }).onConflictDoNothing({ target: skillCategories.slug }).returning({ id: skillCategories.id })
const skillCategoryId = createdSkillCategory?.id || (await db.select({ id: skillCategories.id }).from(skillCategories).where(eq(skillCategories.slug, 'teknik')).limit(1))[0]?.id
if (!skillCategoryId) throw new Error('Yetenek kategorisi oluşturulamadı.')
for (const name of ['.NET', 'SQL Server', 'JavaScript', 'TypeScript', 'Vue', 'Nuxt', 'Docker', 'PostgreSQL']) {
  const existing = await db.select({ id: skills.id }).from(skills).where(and(eq(skills.name, name), eq(skills.categoryId, skillCategoryId))).limit(1)
  if (!existing.length) await db.insert(skills).values({ categoryId: skillCategoryId, name, level: 'advanced' })
}

const blogSeed = [
  { slug: 'guvenilir-web-uygulamalari', title: 'Güvenilir Web Uygulamaları Tasarlamak', excerpt: 'Modern web projelerinde güvenlik, performans ve bakım kolaylığını aynı mimari içinde ele almak.', category: 'Mimari', date: '2026-01-15', content: '<h2>Güvenlik varsayılan olmalı</h2><p>Doğrulama, yetkilendirme ve güvenli çıktı üretimi ürün tasarımının başlangıcında ele alınmalıdır.</p><h2>Küçük ve ölçülebilir adımlar</h2><p>Güvenlik başlıkları, hız sınırları ve audit kayıtları birlikte çalışan etkili katmanlardır.</p>' },
  { slug: 'nuxt-ile-surdurulebilir-urunler', title: 'Nuxt ile Sürdürülebilir Ürünler Geliştirmek', excerpt: 'SSR, tip güvenliği ve domain odaklı klasör yapısıyla büyümeye hazır bir ürün temeli kurmak.', category: 'Frontend', date: '2026-02-08', content: '<h2>Sayfadan ürüne geçiş</h2><p>İyi bir Nuxt mimarisi veri erişimi, doğrulama ve sunucu sınırlarını anlaşılır hale getirir.</p><h2>Tip güvenliği</h2><p>TypeScript strict mode ekip içinde varsayımları görünür kılar.</p>' },
  { slug: 'postgresql-ve-docker-ile-guvenli-dagitim', title: 'PostgreSQL ve Docker ile Güvenli Dağıtım', excerpt: 'Migration, yedekleme ve container sınırlarını production ortamında doğru konumlandırmak.', category: 'DevOps', date: '2026-03-02', content: '<h2>Migration dağıtımın parçasıdır</h2><p>Sürümlü migration dosyaları ayrı ve gözlemlenebilir bir iş olarak çalıştırılmalıdır.</p><h2>Container sınırları</h2><p>Secret yönetimi, kalıcı veri ve izleme kararları açıkça tasarlanmalıdır.</p>' }
]

for (const seed of blogSeed) {
  const categorySlug = seed.category.toLocaleLowerCase('tr').replace('ı', 'i')
  const [createdCategory] = await db.insert(blogCategories).values({ name: seed.category, slug: categorySlug }).onConflictDoNothing({ target: blogCategories.slug }).returning({ id: blogCategories.id })
  const categoryId = createdCategory?.id || (await db.select({ id: blogCategories.id }).from(blogCategories).where(eq(blogCategories.slug, categorySlug)).limit(1))[0]?.id
  if (!categoryId) throw new Error(`Blog kategorisi oluşturulamadı: ${categorySlug}`)
  await db.insert(blogPosts).values({ title: seed.title, slug: seed.slug, excerpt: seed.excerpt, content: seed.content, categoryId, status: 'published', publishedAt: new Date(seed.date), readingMinutes: readingTime(seed.content) }).onConflictDoNothing({ target: blogPosts.slug })
}

if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
  const email = process.env.ADMIN_EMAIL.toLowerCase()
  const existing = await db.select({ id: adminUsers.id }).from(adminUsers).where(eq(adminUsers.email, email))
  if (!existing.length) {
    if (process.env.ADMIN_PASSWORD.length < 12) throw new Error('ADMIN_PASSWORD en az 12 karakter olmalıdır.')
    const passwordHash = await argon2.hash(process.env.ADMIN_PASSWORD, { type: argon2.argon2id })
    await db.insert(adminUsers).values({ email, passwordHash })
    console.log('Admin hesabı oluşturuldu.')
  }
  else console.log('Admin hesabı zaten mevcut; parola değiştirilmedi.')
} else console.log('ADMIN_EMAIL/ADMIN_PASSWORD yok; admin oluşturulmadı.')

await client.end()
console.log('Seed tamamlandı.')