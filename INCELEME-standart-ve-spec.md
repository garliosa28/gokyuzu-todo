# İki eksenli inceleme: standartlar ve plana uygunluk

> Tarih: 2026-09-22 · Kapsam: projenin tamamı (boş repodan `4d93434`'e)
> Plan kaynağı: [PLAN.md](PLAN.md) ve [biletler/](biletler/) 01-08
>
> İki inceleme birbirinden bağımsız yapıldı ve bulgular bilerek birleştirilmedi. Kod standartlara uyup yanlış şeyi yapabilir, ya da doğru şeyi yapıp standartları çiğneyebilir.

## Standartlar

Repoda yazılı bir kodlama standardı yok (CLAUDE.md, CONTRIBUTING, lint ayarı yok). Bu yüzden kesin ihlal yok. Aşağıdakiler yalnızca genel kod kokularına (Fowler, *Refactoring*) göre yorum.

1. **Aynı kod tekrar tekrar yazılmış, bir değişiklik birçok dosyaya dağılıyor.** `src/data/sync.ts` içinde aynı döngü her tablo için ayrı ayrı yazılmış: push'ta `lists` ve `tasks` için birer kez, pull'da bir kez daha. Aynı tekrar `remote.ts`'in push kısmında ve `syncController.ts`'teki bekleyen değişiklik sayımında da var. Yeni bir tablo eklemek types, db, sync, remote, syncController ve schema.sql'de ayrı ayrı düzenleme gerektiriyor.
2. **Tekrarlanan kod (`store.ts`).** "Başlık boşsa hata ver, değilse kırp" kontrolü dört yerde tekrarlanıyor. Yeni satırın zaman damgası ve `dirty` alanlarını dolduran blok da iki yerde aynı.
3. **Tekrarlanan kod (tarih ve düğmeler).** Tarih metnini parçalayan kod `today.ts` ve `format.ts`'te ayrı ayrı yazılmış. "Yarına ertele" işlemi de `MorningReview` ve `TaskItem` içinde kopyalanmış.
4. **Alan kavramları düz metinle temsil ediliyor.** `DateString` aslında düz `string` ile aynı, derleyici karıştırmayı engellemiyor. `'reviewedOn'` ve `'syncCursor'` anahtarları da serbest metin.
5. **Hep birlikte taşınan alanlar.** `List` ve `Task` aynı beş alanı paylaşıyor (id, sıra, zaman damgaları, silinme tarihi). Bunlar ortak bir tipte toplanabilir.
6. **Aynı eşleme iki yerde.** Senkron durumunun ekranda nasıl yazılacağı hem `SyncBadge`'de hem `AccountScreen`'de ayrı ayrı tanımlanmış.
7. **Belirsiz isimler.**
   - `set`, `again`, `debounce`, `run`, `sent`, `PAGE`
   - `clean` ve `strip` aynı işi yapıyor ama adları farklı
   - `ui/context.ts` bir React context değil
   - `store.lists()` ile `store.allTasks()` tutarsız adlandırılmış
8. **İş mantığı yanlış yerde.** Açık görev sayısı arayüz bileşeninde hesaplanıyor. `TaskItem` her satırda tüm listeleri çekip kendi liste adını arıyor.
9. **Tek dosya birden fazla iş yapıyor.** `ui/syncController.ts` durum saklama, zamanlayıcı, pencere olay dinleyicileri ve React hook'unu bir arada tutuyor. Üstelik arayüz katmanında duruyor.

## Plana uygunluk

### (a) Eksik veya kısmi

1. **05, "Kart o gün bir daha görünmez":** Gün yalnızca "Sonra bakarım"a basınca işaretleniyor. Görevleri tek tek halletsen bile, aynı gün yeni bir gecikmiş görev gelirse kart yeniden açılıyor.
2. **07, "Silmeler de senkronize":** Bir liste silinince yalnızca o cihazdaki görevleri siliniyor. Diğer cihazda çevrimdışıyken o listeye eklenen görevler kalıyor. Bu görevler hiçbir listede görünmüyor ama Bugün ekranında görünüyor. Silinmiş liste başka bir cihazda yeniden adlandırılırsa liste geri geliyor ama görevleri silinmiş kalıyor.
3. **01 ve 08:** Yayına alma ve uçtan uca uçak modu testi, SETUP.md'de anlatıldığı gibi kullanıcının yapacağı adımlar. Kodda eksik yok.

### (b) İstenmemiş davranış (küçük)

- Görev başlığını düzenleme
- "Şimdi senkronize et" düğmesi ve yalnızca yerel mod
- "Sonra bakarım" düğmesi
- Bugün ekranındaki hızlı ekleme görevi bugünün tarihiyle ekliyor
- Sabah kartı sadece dünden kalanları değil, tüm gecikmiş görevleri gösteriyor
- `.claude/launch.json` repoya eklenmiş

### (c) Uygulanmış ama yanlış görünen

4. **06, "Oturum kalıcı":** `signOut()` varsayılan olarak tüm cihazlardan çıkış yapıyor. Sadece o cihazdan çıkış yapmalı. Çıkış sırasındaki hata da kontrol edilmiyor.
5. **08, durum rozeti:** Çıkış yapıldığı anda bir senkron sürüyorsa, bittiğinde rozet "Giriş yap" yerine "Güncel" gösteriyor. "Çevrimdışı" durumu da aynı şekilde ezilebiliyor.
6. **07, "Son yazan kazanır":** Yeni zaman damgasının öncekinden büyük olduğu garanti edilmiyor. Saati geri kalmış cihazın düzenlemesini sunucu sessizce reddediyor, cihaz ise bunu gönderilmiş sayıyor. Sonuçta cihazlar kalıcı olarak farklı veri gösterebilir. Olasılığı düşük.
7. **Sayfalama:** Aynı sunucu zamanına sahip satırlar sayfa sınırına denk gelirse atlanabilir. Olasılığı düşük.

### Doğru bulunanlar

- Upsert, "son yazan kazanır" tetikleyicisi ve satır güvenliği (RLS) birlikte doğru çalışıyor.
- Sunucu zamanını imleç olarak kullanmak ve 10 sn örtüşme mantıklı. Birleştirme idempotent.
- Service worker çevrimdışı açılışı sağlıyor.
- Uygulama Bugün ekranında açılıyor. Gelen Kutusu silinemiyor. Görev taşıma çalışıyor.
- Giriş `shouldCreateUser: false` ile yapılıyor; giriş yapmadan yerel kullanım sürüyor.
- Güvenli alan boşlukları ve `apple-touch-icon` var.

## Özet

- **Standartlar:** 9 bulgu, hepsi yorum. En önemlisi, senkron kodunun her tablo için tekrarlanması.
- **Plana uygunluk:** 7 bulgu ve birkaç küçük "istenmemiş" davranış. En önemlisi, silinen listenin görevlerinin diğer cihazda sahipsiz kalması.
