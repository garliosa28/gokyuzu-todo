# 08: Otomatik senkron ve durum göstergesi

**Ne yapılacak:** Senkron kendiliğinden tetikleniyor: bağlantı geri geldiğinde, uygulamaya dönüldüğünde ve belirli aralıklarla. Ekranda "çevrimdışı / senkronize ediliyor / güncel" göstergesi var. Uçtan uca senaryo çalışıyor: uçak modunda ekle, bağlantıyı aç, görev diğer cihazda görünsün.

**Önce bitmesi gereken:** 07

**Durum:** tamamlandı (commit `4d93434`)

- [x] Tetikleyiciler: açılış, yerel değişiklik (1,5 sn bekleme), `online`, uygulamaya geri dönüş, 60 sn'de bir
- [x] Aynı anda tek senkron çalışıyor; sürerken istek gelirse bittiğinde bir tur daha
- [x] Sağ üstte rozet: Yerel / Giriş yap / Çevrimdışı / Senkronize ediliyor / Güncel / Senkron hatası
- [x] Senkronizasyon ekranı: son senkron zamanı, "Şimdi senkronize et", "Çıkış yap"
- [x] Durum rozeti, süren senkron bittiğinde ezilmiyor (bulgu 5, düzeltildi)
- [ ] Uçak modu senaryosu iki gerçek cihazda test edilmedi: kullanıcı yapacak
