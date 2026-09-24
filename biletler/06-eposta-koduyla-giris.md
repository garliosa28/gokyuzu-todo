# 06: E-posta koduyla giriş

**Ne yapılacak:** Supabase projesi kuruluyor ve yeni kayıtlar kapatılıyor. E-postaya gelen kodla giriş yapılabiliyor ve oturum kalıcı oluyor. Giriş yapılmadan da yerel kullanım sürüyor.

> Planlanan "magic link" yerine **kod** kullanıldı. iPhone'da ana ekrana eklenen uygulama Safari'den ayrı bir depolama kullanıyor. E-postadaki link Safari'de açıldığı için oturum uygulamaya geçmiyor.

**Önce bitmesi gereken:** 01

**Durum:** kod tamamlandı (commit `4d93434`), kurulum kullanıcıda

- [x] Şema, RLS ve tetikleyici: [supabase/schema.sql](../supabase/schema.sql)
- [x] Kurulum rehberi: [SETUP.md](../SETUP.md) (kayıt kapatma, kullanıcı ekleme, e-posta şablonu)
- [x] Senkronizasyon ekranı: e-posta → kod → giriş (`shouldCreateUser: false`)
- [x] Oturum kalıcı; `.env` yoksa uygulama "Yerel" modda tam çalışıyor
- [x] Çıkış yalnızca o cihazdan yapılıyor (bulgu 3, düzeltildi)
- [ ] Supabase projesinin açılması: kullanıcı yapacak
- [ ] Gerçek bir Supabase projesiyle uçtan uca test edilmedi
