# 02: Gelen kutusuna hızlı görev ekleme (yerel)

**Ne yapılacak:** Tek satırla görev eklenebiliyor, tamamlanıp geri alınabiliyor, silinebiliyor. Görevler cihazda kalıcı: uçak modunda ve sayfa yenilendikten sonra da duruyor. Görevler varsayılan olarak "Gelen Kutusu"na düşüyor.

**Önce bitmesi gereken:** 01

**Durum:** tamamlandı (commit `9c5f4ca`)

- [x] Enter veya "+" ile tek satırda görev ekleme
- [x] Tamamla / geri al
- [x] Silme (soft delete: `deleted_at`)
- [x] Boş başlıklı görev eklenmiyor
- [x] IndexedDB'de (Dexie) kalıcı, yenilemeden sonra duruyor
- [x] Testler: `src/data/store.test.ts`
