# 07: Görev ve listelerin senkronizasyonu

**Ne yapılacak:** Supabase tabloları RLS ile kuruluyor. Yerel değişiklikler gönderiliyor (push), diğer cihazdaki değişiklikler çekiliyor (pull). Aynı kayıt iki yerde değişirse en son değişiklik kazanıyor. Silmeler de senkronize ediliyor.

**Önce bitmesi gereken:** 03, 04, 06

**Durum:** tamamlandı (commit `4d93434`)

- [x] `lists` ve `tasks` tabloları, satır düzeyi güvenlik: `user_id = auth.uid()`
- [x] Push: `dirty = 1` olan satırlar upsert ediliyor. Gönderim sırasında yeniden düzenlenen satır kirli kalıyor.
- [x] Pull: sunucu zamanı `synced_at` imleç olarak kullanılıyor, 10 sn örtüşmeyle
- [x] Son yazan kazanır: hem sunucuda (SQL tetikleyicisi) hem istemcide
- [x] Silmeler `deleted_at` ile senkronize oluyor
- [x] İki cihazda ayrı oluşan Gelen Kutusu tek liste olarak kalıyor
- [x] Testler: `src/data/sync.test.ts` (8 test, yarış durumları dahil)
- [x] Silinen listenin görevleri her cihazda gizleniyor (bulgu 1 ve 11, düzeltildi)
- [x] Saat farkında ve eşit damgada cihazlar aynı sürümde buluşuyor (bulgu 2, düzeltildi)
- [x] Sayfalama (synced_at, id) çiftiyle yapılıyor ve testli (bulgu 6 ve 15, düzeltildi)
