# 👹 Yap ya da Yapma Listesi

Saf HTML/CSS/JS ile yazılmış, verileri **Supabase**'de saklayan bir yapılacaklar uygulaması.

## Özellikler

- Görev ekleme, düzenleme, silme ve tamamlama
- Son bitirme **tarihi** ve **kişi atama**
- Her göreve açılabilir **uygulama adımları** (alt görevler), onların da kendi tarihi
- Filtreler: **Tümü · Bugün · Aktif · Tamamlanan**
- Tarihe göre otomatik sıralama, geçmiş/bugün tarih vurgusu

## Teknoloji

- Ön yüz: vanilla HTML/CSS/JS
- Veritabanı: Supabase (PostgreSQL) — `@supabase/supabase-js` CDN üzerinden
- Tablolar: `todos` ve `steps` (bkz. `supabase/migrations/`)

## Yapılandırma

`config.js` içindeki `SUPABASE_URL` ve `SUPABASE_KEY` (publishable anahtar) bağlantıyı sağlar.

## Yerel çalıştırma

`index.html` dosyasını doğrudan tarayıcıda açabilirsin (CDN için internet gerekir).
