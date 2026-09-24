# 03: Listeler

**Ne yapılacak:** Liste oluşturma, yeniden adlandırma ve silme (soft delete). Görevler bir listeye taşınabiliyor. Gelen Kutusu silinemeyen varsayılan liste.

**Önce bitmesi gereken:** 02

**Durum:** tamamlandı (commit `83921ec`)

- [x] Liste oluştur, yeniden adlandır, sil (silmeden önce onay isteniyor)
- [x] Silinen listenin içindeki görevler de siliniyor (bu cihazda)
- [x] Görev eklerken liste seçilebiliyor, düzenleyiciden başka listeye taşınabiliyor
- [x] Gelen Kutusu silinemiyor ve her zaman ilk sırada
- [x] Listeler ekranında her listenin açık görev sayısı görünüyor
- [x] Testler: `src/data/store.test.ts` ("listeler" bölümü)

> Düzeltildi: Listesi silinmiş görevler artık her cihazda okuma anında gizleniyor.
