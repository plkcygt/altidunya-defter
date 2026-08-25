# Parti Defteri — Kurulum (≈20 dakika, bir kez)

Site iki modda çalışır:
- **Yerel mod** (kurulumsuz): `site/` klasörünü herhangi bir sunucuyla aç → çalışır; veriler o cihazın tarayıcısında kalır. Test için.
- **Bulut modu** (hedef): Supabase (ücretsiz) + Cloudflare Pages (ücretsiz) → dört cihazdan aynı veriye erişim, iki şifre.

## 1) Supabase (veri + şifreler) — ~10 dk
1. https://supabase.com → New project (ücretsiz plan; bölge: eu-central). Veritabanı şifresini bir yere yaz (bir daha gerekmiyor ama kaybolmasın).
2. **Authentication → Sign In / Up → Email**: "Confirm email" KAPAT.
3. **Authentication → Users → Add user** (iki kez):
   - `dm@altidunya.local` — şifre: **senin DM şifren**
   - `parti@altidunya.local` — şifre: **ortak oyuncu şifresi**
   - İkisinde de "Auto Confirm User" işaretli.
4. **SQL Editor** → `site/sql/schema.sql` içeriğini yapıştır → Run.
5. **Project Settings → API**'den iki değeri kopyala: `Project URL` ve `anon public` key.

## 2) config.js — ~1 dk
`site/config.example.js` dosyasını `site/config.js` adıyla kopyala; URL + anon key alanlarını doldur. (config.js repoya girmez — .gitignore'da.)

## 3) Yayınlama — Cloudflare Pages (~8 dk)
GitHub Pages private repoda ücretsiz çalışmaz; **Cloudflare Pages private repoya ücretsiz bağlanır**:
1. https://pages.cloudflare.com → Sign up → **Connect to Git** → GitHub → `plkcygt/altidunya` seç.
2. Build settings: Framework **None** · Build command **boş** · Build output directory: **site**
3. Deploy. Adres: `https://<proje>.pages.dev` — dört kişiye bu adres + kendi şifreleri verilir.
4. ⚠ `config.js` repoda olmadığı için Pages'e ayrıca eklenmeli. En kolay yol: repoya `site/config.js` yerine **anahtarları Pages ortamında tutmak yerine** şu istisnayı kullan → `.gitignore`'daki `site/config.js` satırını silip config.js'i commit'le. (Anon key zaten tarayıcıya inen halka açık bir anahtardır; güvenlik RLS + şifrelerdedir. Repo private olduğu için ekstra risk yok.)

## 4) Doğrulama
- Siteye gir → DM şifresiyle: sağ üstte **DM** rozeti + DM sekmesi.
- Oyuncu şifresiyle ikinci cihazdan gir → kasadan 1 gümüş düş → DM cihazında ~8 sn içinde güncellenir.
- Karakterler sekmesinde yapılan her değişiklik (HP, level-up, büyü) otomatik ortak kayda yazılır.

## Sorun giderme
- "Şifre yanlış" (bulut modunda): Supabase'de kullanıcı e-postaları birebir `dm@altidunya.local` / `parti@altidunya.local` mı, "Confirm email" kapalı mı?
- Senkron rozeti kırmızı: internet yok ya da RLS politikaları eksik (schema.sql yeniden Run).
- Karakterler boş geldi: ilk açan cihaz motoru tohumdan başlatır ve kaydeder; sorun sürerse sekmeyi yenile.

## Sınırlar (bilinçli)
- Bu sitede yalnız **[O] oyuncu-bilir** içerik yaşar; GM sırları repodadır, siteye girmez.
- Işık/fener görselleştirmesi bilgilendirme amaçlı — masada yük takibi yapılmaz (kurallar.md).
