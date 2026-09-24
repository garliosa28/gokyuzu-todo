# 05: Sabah gözden geçirmesi

**Ne yapılacak:** Günün ilk açılışında dünden kalan görevler bir kartta listeleniyor. Her biri için tek dokunuşla "bugüne al", "ertele" veya "sil" seçilebiliyor. Kart o gün bir daha görünmüyor.

**Önce bitmesi gereken:** 04

**Durum:** tamamlandı (commit `bf5636c`)

- [x] Önceki günlerden kalan yapılmamış görevler "Dünden kalanlar" kartında
- [x] Her görev için Bugün / Ertele (yarına) / Sil
- [x] "Sonra bakarım" kartı o gün için kapatıyor (cihazda hatırlanıyor)
- [x] Kart açıkken Gecikmiş bölümünün yerini alıyor, aynı görevler iki kez görünmüyor
- [x] Testler: `src/data/today.test.ts` ve `src/data/store.test.ts` ("sabah gözden geçirmesi" bölümleri)
- [x] Kart o gün gösterilip boşalınca gün kapanıyor, aynı gün yeniden açılmıyor (bulgu 8, düzeltildi)
