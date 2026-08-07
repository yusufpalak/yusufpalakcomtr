# Veri modeli

Şema `server/database/schema.ts` içindedir. UUID anahtarlar, timezone-aware timestamp'ler, slug/e-posta unique indexleri, yayın tarihi/durum ve sıralama indexleri kullanılır. Join tabloları proje-teknoloji ve yazı-etiket çoktan çoğa ilişkilerini temsil eder. İçeriklerde gerektiğinde soft delete, join/galerilerde cascade, paylaşılan kataloglarda restrict uygulanır.
