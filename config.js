/* =========================================================
   Altıdünya Parti Defteri — YAPILANDIRMA ÖRNEĞİ
   Bu dosyayı "config.js" adıyla KOPYALA ve değerleri doldur.
   config.js repoya GİRMEZ (.gitignore'da) — anahtarlar gizli kalır.
   =========================================================

   İKİ MOD:
   1) YEREL MOD (Supabase alanları boş): veriler yalnız bu cihazın
      tarayıcısında durur. Test için yeterli; cihazlar arası senkron YOK.
   2) SUPABASE MODU: SETUP.md'deki kurulumdan sonra URL + anon key gir.
      Şifreler Supabase kullanıcılarının şifreleridir; aşağıdaki
      DM_SIFRE / OYUNCU_SIFRE alanları Supabase modunda YOK SAYILIR
      (gerçek doğrulama sunucuda olur).                              */

window.ALT_CONFIG = {
  /* --- Supabase (boşsa yerel mod) --- */
  SUPABASE_URL: "",          // örn: "https://abcdefgh.supabase.co"
  SUPABASE_ANON_KEY: "",     // Project Settings → API → anon public

  /* --- Yalnız YEREL MOD şifreleri (gerçek güvenlik değildir!) --- */
  DM_SIFRE: "dm",
  OYUNCU_SIFRE: "parti"
};
