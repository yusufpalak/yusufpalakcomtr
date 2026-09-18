import 'dotenv/config'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { and, eq } from 'drizzle-orm'
import {
  blogPosts,
  certificates,
  educations,
  experiences,
  homepageSections,
  projectCategories,
  projectTechnologies,
  projects,
  socialLinks,
  stats,
  technologies,
} from '../server/database/schema'

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL zorunludur.')
const client = postgres(process.env.DATABASE_URL)
const db = drizzle(client)

// Kaynak: https://www.linkedin.com/in/yusufpalak/ (herkese açık profil, Eylül 2026).
// Doğrulanamayan iş unvanları, tarihleri ve görseller özellikle eklenmez.

const sections = [
  { key: 'hero-intro', title: 'Fikirleri çalışan yazılıma dönüştürüyorum.', content: 'Web uygulamaları, yönetim panelleri ve veritabanı çözümleri geliştiriyorum. Kullanımı kolay, güvenilir ve sürdürülebilir ürünler üretmeye odaklanıyorum.', sortOrder: 0 },
  { key: 'yaklasim', title: 'İhtiyaca göre tasarlanmış çözümler', content: 'Bir projede yalnızca çalışan ekranlar değil, içerik yönetimi, yetkilendirme ve ölçülebilir sonuçlar da önemlidir. Çalışmalarımda bu parçaları bir bütün olarak ele alıyorum.', sortOrder: 10 },
  { key: 'kernela-soft', title: 'Kernela Soft’ta ürün geliştirme', content: 'Kernela Soft’un kurucu ortağı olarak işletmelerin dijital süreçlerini kolaylaştıran ürünlere odaklanıyorum. Şirketimizin DineX dijital menü ürünü, restoran ve kafelerin menülerini tek panelden yönetmesine yardımcı oluyor.', sortOrder: 20 },
  { key: 'about:intro', title: 'Merhaba, ben Yusuf Palak.', content: 'Web ve uygulama geliştirme, veritabanı sistemleri ve yönetim panelleriyle ilgilenen bir yazılım geliştiriciyim. Öğrendiklerimi gerçek ihtiyaçlara yanıt veren ürünlere dönüştürmeyi seviyorum.', sortOrder: 0 },
  { key: 'about:egitim', title: 'Öğrenme yolculuğum', content: 'Bilişim Teknolojileri alanındaki eğitimimin ardından Anadolu Üniversitesi’nde öğrenimime devam ediyorum. Web, uygulama ve veritabanı geliştirme alanlarında kendimi geliştirmeyi sürdürüyorum.', sortOrder: 10 },
  { key: 'about:yaklasim', title: 'Çalışma yaklaşımım', content: 'Artemis Halı için geliştirdiğim dijital katalog ve yönetim panelinde ürün yönetimi, QR kod, analitik ve kullanıcı yetkilerini tek bir çözümde bir araya getirdim. Benzer projelerde anlaşılır arayüzler ve yönetilebilir sistemler kurmaya odaklanıyorum.', sortOrder: 20 },
  { key: 'about:kernela-soft', title: 'Kernela Soft ve DineX', content: 'Kernela Soft’un kurucu ortağıyım. Şirketimizin DineX ürünü, restoran ve kafelere QR kodla erişilen dijital menü, ürün ve fiyat güncelleme, kampanya alanları, çoklu dil ve para birimi ile görüntüleme analitiği sunuyor. Bu çalışmalar, yazılımı gerçek işletme ihtiyaçlarıyla buluşturma yaklaşımımın bir parçası.', sortOrder: 30 },
  { key: 'about:calisma-alanlari', title: 'Çalışma alanlarım', content: 'Web geliştirme, Android ve mobil uygulama geliştirme, veritabanı geliştirme ve ihtiyaca özel yazılım çözümleri üzerinde çalışıyorum. Her projede teknik gereksinimleri anlaşılır ve kullanılabilir bir ürüne dönüştürmeye odaklanıyorum.', sortOrder: 40 },
] as const

for (const section of sections) {
  await db.insert(homepageSections).values(section).onConflictDoNothing({ target: homepageSections.key })
}

const educationEntries = [
  { school: 'Anadolu Üniversitesi', department: null, degree: null, isCurrent: true, description: '2023 yılından bu yana devam eden üniversite eğitimi.', sortOrder: 0 },
  { school: 'Mehmet Ali Büyükhanlı Mesleki ve Teknik Anadolu Lisesi', department: 'Bilişim Teknolojileri', degree: null, isCurrent: false, description: 'Bilişim Teknolojileri alanında eğitim.', sortOrder: 10 },
] as const

for (const entry of educationEntries) {
  const [existing] = await db.select({ id: educations.id }).from(educations).where(eq(educations.school, entry.school)).limit(1)
  if (!existing) await db.insert(educations).values(entry)
}

// Kurucu ortaklık bilgisi kullanıcı tarafından doğrulandı; başlangıç tarihi ve bireysel görev kapsamı belirtilmedi.
const [kernelaExperience] = await db.select({ id: experiences.id }).from(experiences)
  .where(and(eq(experiences.company, 'Kernela Soft'), eq(experiences.position, 'Kurucu Ortak'))).limit(1)
if (!kernelaExperience) await db.insert(experiences).values({
  company: 'Kernela Soft',
  position: 'Kurucu Ortak',
  isCurrent: true,
  summary: 'İşletmelerin dijital süreçlerine yönelik yazılım ürünleri geliştiren Kernela Soft’un kurucu ortağı. Şirketin DineX ürünü, restoran ve kafelere QR tabanlı dijital menü ve yönetim deneyimi sunuyor.',
  sortOrder: -10,
})

// LinkedIn yalnızca ay ve yılı gösterir. Ayın ilk günü depolama konvansiyonudur.
const certificateEntries = [
  { name: 'Web Tasarımın Temelleri(HTML&CSS)', issuer: 'Bilgeİş', month: '2021-06', category: 'Web geliştirme' },
  { name: 'Bilgi Teknolojilerine Giriş', issuer: 'Bilgi Teknolojileri ve İletişim Kurumu - BTK - ICT', month: '2021-03', category: 'Bilişim' },
  { name: 'Dijital Okuryazarlık 101', issuer: 'Turkcell Geleceği Yazanlar', month: '2021-03', category: 'Dijital okuryazarlık' },
  { name: 'Dijital Okuryazarlık 201', issuer: 'Turkcell Geleceği Yazanlar', month: '2021-03', category: 'Dijital okuryazarlık' },
  { name: 'Dijital Okuryazarlık 301', issuer: 'Turkcell Geleceği Yazanlar', month: '2021-03', category: 'Dijital okuryazarlık' },
  { name: 'Dijital Okuryazarlık 401', issuer: 'Turkcell Geleceği Yazanlar', month: '2021-03', category: 'Dijital okuryazarlık' },
  { name: 'Microsoft Word Temelleri', issuer: 'Bilgi Teknolojileri ve İletişim Kurumu - BTK - ICT', month: '2021-03', category: 'Bilişim' },
  { name: 'Programlamanın Temelleri', issuer: 'Bilgeİş', month: '2021-03', category: 'Programlama' },
  { name: 'Web Programlama 201', issuer: 'Turkcell Geleceği Yazanlar', month: '2020-03', category: 'Web geliştirme' },
  { name: 'Web Programlama 101', issuer: 'Turkcell Geleceği Yazanlar', month: '2018-09', category: 'Web geliştirme' },
] as const

for (const [index, entry] of certificateEntries.entries()) {
  const [existing] = await db.select({ id: certificates.id }).from(certificates).where(and(eq(certificates.name, entry.name), eq(certificates.issuer, entry.issuer))).limit(1)
  if (!existing) await db.insert(certificates).values({
    name: entry.name,
    issuer: entry.issuer,
    issuedAt: new Date(`${entry.month}-01T00:00:00.000Z`),
    category: entry.category,
    sortOrder: index,
  })
}

const [category] = await db.insert(projectCategories).values({ name: 'Kurumsal Yazılım', slug: 'kurumsal-yazilim' }).onConflictDoNothing({ target: projectCategories.slug }).returning({ id: projectCategories.id })
const categoryId = category?.id || (await db.select({ id: projectCategories.id }).from(projectCategories).where(eq(projectCategories.slug, 'kurumsal-yazilim')).limit(1))[0]?.id
if (!categoryId) throw new Error('Proje kategorisi oluşturulamadı.')

const [project] = await db.insert(projects).values({
  title: 'Artemis Halı Dijital Katalog ve Yönetim Paneli',
  slug: 'artemis-hali-dijital-katalog',
  summary: 'Ürün kataloğu, QR kod, analitik ve yetki yönetimini bir araya getiren dijital fuar çözümü.',
  content: '<h2>Proje özeti</h2><p>Artemis Halı için ürünlerin sergilendiği dijital katalog ile operasyonel süreçleri yöneten bir panel geliştirdim.</p><h2>Öne çıkan özellikler</h2><ul><li>Ürün, desen, ebat ve fiyat listelerinin yönetimi</li><li>Ürün ve ebat bazında QR kod oluşturma</li><li>Oy ve beğeni verilerini inceleyen analitik ekranları</li><li>Yönetici ve alt kullanıcılar için yetki yönetimi</li></ul><p>Uygulamada .NET Core ve SQL Server kullandım.</p>',
  categoryId,
  clientName: 'Artemis Halı',
  role: 'Uçtan uca geliştirme',
  isFeatured: true,
  status: 'published',
  sortOrder: 0,
}).onConflictDoNothing({ target: projects.slug }).returning({ id: projects.id })
const projectId = project?.id || (await db.select({ id: projects.id }).from(projects).where(eq(projects.slug, 'artemis-hali-dijital-katalog')).limit(1))[0]?.id
if (!projectId) throw new Error('Proje oluşturulamadı.')

const [dinexCategory] = await db.insert(projectCategories).values({ name: 'Dijital Ürün', slug: 'dijital-urun' }).onConflictDoNothing({ target: projectCategories.slug }).returning({ id: projectCategories.id })
const dinexCategoryId = dinexCategory?.id || (await db.select({ id: projectCategories.id }).from(projectCategories).where(eq(projectCategories.slug, 'dijital-urun')).limit(1))[0]?.id
if (!dinexCategoryId) throw new Error('DineX proje kategorisi oluşturulamadı.')
await db.insert(projects).values({
  title: 'DineX — Dijital Menü',
  slug: 'dinex-dijital-menu',
  summary: 'Kernela Soft’un restoran ve kafeler için sunduğu QR tabanlı dijital menü ve yönetim ürünü.',
  content: '<h2>Ürün özeti</h2><p>DineX, Kernela Soft’un restoran ve kafelerin menülerini dijital ortamda yönetmesi için sunduğu üründür. Müşteriler QR kodla mobil uyumlu menüye erişirken işletme menü içeriğini tek panelden güncelleyebilir.</p><h2>Öne çıkan özellikler</h2><ul><li>Ürün ve fiyatları anlık güncelleme</li><li>Kampanya bannerlarıyla öne çıkan içerikleri yönetme</li><li>Çoklu dil ve para birimi desteği</li><li>QR erişimi ve görüntüleme analitiği</li></ul>',
  categoryId: dinexCategoryId,
  clientName: 'Kernela Soft',
  role: 'Kurucu ortak',
  isFeatured: true,
  status: 'published',
  sortOrder: 10,
}).onConflictDoNothing({ target: projects.slug })

for (const name of ['.NET Core', 'SQL Server']) {
  const slug = name === '.NET Core' ? 'dotnet-core' : 'sql-server'
  const [created] = await db.insert(technologies).values({ name, slug }).onConflictDoNothing({ target: technologies.slug }).returning({ id: technologies.id })
  const technologyId = created?.id || (await db.select({ id: technologies.id }).from(technologies).where(eq(technologies.slug, slug)).limit(1))[0]?.id
  if (technologyId) await db.insert(projectTechnologies).values({ projectId, technologyId }).onConflictDoNothing()
}

const statEntries = [
  { key: 'projects', label: 'Proje', mode: 'automatic', sortOrder: 0 },
  { key: 'posts', label: 'Blog yazısı', mode: 'automatic', sortOrder: 10 },
  { key: 'collaborations', label: 'İş birliği', mode: 'automatic', sortOrder: 20 },
  { key: 'certificates', label: 'Sertifika', mode: 'automatic', sortOrder: 30 },
] as const
for (const entry of statEntries) await db.insert(stats).values(entry).onConflictDoNothing({ target: stats.key })

const linkedInUrl = 'https://www.linkedin.com/in/yusufpalak/'
const [linkedIn] = await db.select({ id: socialLinks.id }).from(socialLinks).where(eq(socialLinks.url, linkedInUrl)).limit(1)
if (!linkedIn) await db.insert(socialLinks).values({ label: 'LinkedIn', platform: 'linkedin', url: linkedInUrl, username: 'yusufpalak', sortOrder: 10 })

const [postCount] = await db.select({ id: blogPosts.id }).from(blogPosts).limit(1)
console.log(`İçerik tamamlandı. Blog kaydı ${postCount ? 'mevcut' : 'yok'}; mevcut kayıtlar değiştirilmedi.`)
await client.end()
