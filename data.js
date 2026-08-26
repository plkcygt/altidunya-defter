/* Altıdünya Parti Defteri — tohum verisi (S8 sonu, STATE.md'den)
   Eşya detayları: 5e 2024 kuralları + ev kuralları (universe/kurallar.md) */
window.ALT_SEED = {
  surum: 2,

  parti: {
    kasa: { temiz_gumus: 33, isaretli_gumus: 95, bakir: 0, altin: 0 },
    kasa_notu: "Kesedeki gümüşün büyük kısmı Yontur mührü taşıyor — Orman tapınağının adak parası. Bilen bir göz görürse soru sorar; önce temiz sikkeleri harcayın. · 1 altın = 10 gümüş = 100 bakır · Şifa iksiri ≈ 50 gümüş",
    envanter: [
      { id:"potion1", ad:"Şifa İksiri (Potion of Healing)", adet:1, tip:"ic", etiket:"",
        detay:"<b>Kendin içersen: Bonus Action</b> (2024 kuralı) · başkasına içirmek: Action.<br><b>2d4+2 HP</b> iyileşir. Baygın (0 HP) birine içirilirse ayılır.<br>Kırmızı, hafif ışıltılı sıvı; şişe cam, mantar mühürlü. Değeri: 50 gümüş." },
      { id:"yag", ad:"Zombi-Canlı Yağı", adet:1, tip:"detay", etiket:"riskli",
        detay:"Dev deniz canlısından hasat edilen yoğun, amber kokulu yağ — balina yağı eşdeğeri; fener/lamba yakıtı olarak da üstün (aynı miktar yağın 2 katı süre yanar).<br><b>Değer:</b> tamamı ~150-250 gümüş (alıcısına göre).<br><b>⚠ Sorulu mal:</b> Sular'da dindar bir göz tanırsa \"kutsal canlının yağı bu — nereden?\" sorusu doğar. Uygun alıcı: kasaba tüccarı, alşimist, kayıt sormayan pazar." },
      { id:"recine", ad:"Koruyucu Reçine", adet:2, tip:"ic", etiket:"",
        detay:"Yontur tapınağından çıkan saklama yağı. <b>1 doz = 1 uygulama, tek kişiye, 1 saat sürer.</b><br>Etki: orman yırtıcılarına karşı <b>Stealth zarlarında avantaj</b>; vahşi bir hayvan sana <b>ilk saldırıyı başlatmaz</b> (seni \"numune değil, bakıcı dokunuşu\" sanır).<br>İnsanlara ve canavar-dışı tehditlere etkisi yoktur." },
      { id:"mercek", ad:"Kürator'un Merceği", adet:1, tip:"detay", etiket:"",
        detay:"Pirinç çerçeveli, avuç içi büyüklüğünde usta işi mercek.<br>• Gizli/saklı/korunmuş şeyleri ararken <b>Investigation zarlarında avantaj</b>.<br>• Güneşte 1 dakika odaklanırsa kuru kavı tutuşturur (çakmaktaşı gerekmez) ya da uzağa <b>ışık sinyali</b> çakar (açık havada ~1 km'den görülür)." },
      { id:"mektup", ad:"Mühürlü Mektup (Talas)", adet:1, tip:"mektup", etiket:"onemli",
        detay:"Talas'ın S1'de bıraktığı ikinci mektup. Mühür büyülü: yırtılmaz, zorla/merakla/planla <b>açılmaz</b>.<br><b>Bilinen kural (ateistlerden öğrenildi):</b> mühür yalnız, bir ekip üyesi <b>gerçek bir çaresizlik anında</b> ona uzanırsa çözülür. Bu bir ateist geleneğidir." },
      { id:"atlar", ad:"Binek Atı (Sezgir spiral damgalı)", adet:3, tip:"detay", etiket:"riskli",
        detay:"S6 ganimetinden üç sağlıklı binek (Riding Horse).<br>• <b>Hız 60 ft</b> — yürüyen insandan iki kat; günlük yol mesafesini ~2 katına çıkarır.<br>• Taşıma: binici + ~200 kg yük.<br>• Savaşta eğitimsiz binek <b>ürkebilir</b> (DM takdiri; dizginlemek Animal Handling).<br><b>⚠ Damga:</b> sağrılarında Sezgir spirali — asayiş malı. Binmek görünür olmak, satmak soru işareti satın almaktır." },
      { id:"emir", ad:"Sergen'in Emir Kâğıdı", adet:1, tip:"detay", etiket:"onemli",
        detay:"Vadi asayiş emri, karakol mühürlü: <i>\"İzinsiz yerleşim: tespit, sayım, tasfiye. Öğreten/örgütleyen varsa: kimlik tespit, merkeze bildir.\"</i><br>O \"öğreten\" sizsiniz. Kanıt olarak iki tarafı da keser: asayişe karşı koz, asayişin elinde idam gerekçesi." },
      { id:"harita", ad:"Karakol Haritası + Haftalık Parola", adet:1, tip:"detay", etiket:"",
        detay:"Vadi asayiş karakollarının yerleri ve devriye hatları (S6 ganimeti).<br><b>Parola: \"gölge sayıldı\"</b> — alındığı hafta geçerliydi; aradan geçen zamanda <b>değişmiş olabilir</b>. Eski parola yanlış kulakta alarm demektir." },
      { id:"duduk", ad:"Korlan'ın Kemik Düdüğü", adet:1, tip:"duduk", etiket:"",
        detay:"Asayiş izcilerinin sinyal düdüğü — üç perde:<br>• <b>Tehlike</b> (kısa-kısa-uzun): birlik silaha davranır, mevzilenir.<br>• <b>Toplan</b> (uzun-uzun): dağınık devriye toplanma noktasına döner.<br>• <b>Temiz</b> (tek düşen ton): bölge güvenli, ilerleyin.<br>Asayişin kendi dilidir: doğru perde yanlış kulakta <b>kapı açar ya da tuzak kurar</b> — ama yakından gören, çalanın asker olmadığını anlar." },
      { id:"arbalet", ad:"Hafif Arbalet", adet:5, tip:"detay", etiket:"",
        detay:"<b>1d8 delici</b> · menzil 80/320 ft · iki el.<br>• <b>Loading:</b> ne kadar saldırın olursa olsun turda <b>en fazla 1 atış</b> (doldurma yavaş).<br>• <b>Ammunition:</b> ok (bolt) gerekir; savaştan sonra okların yarısı geri toplanır.<br>Beş adet — müttefik silahlandırmak ya da satmak (tanesi ~25 gümüş) için." },
      { id:"cift", ad:"Sergen'in Çift-Tetikli Arbaleti", adet:1, tip:"detay", etiket:"onemli",
        detay:"Usta işi, iki yuvalı hafif arbalet. <b>1d8 delici · 80/320 ft.</b><br>• <b>Kuzgun kullanırsa +1 isabet</b> (dengesine alıştı).<br>• <b>İki tetik (ev kuralı):</b> iki yuva doluyken Loading özelliğini bir kez yok sayar — <b>aynı turda 2 atış</b> yapılabilir; sonra iki yuvayı doldurmak 1 Action sürer." },
      { id:"ag", ad:"Ağ", adet:3, tip:"detay", etiket:"",
        detay:"Vadi usulü yakalama ağı (asayiş standardı).<br>• Fırlatma: menzil <b>5/15 ft</b>; isabette <b>Large ve altı</b> hedef <b>Restrained</b> olur (hasar yok).<br>• Kurtulma: Action + <b>STR (Athletics) DC 10</b>, ya da ağa <b>5 kesme hasarı</b> (AC 10) — ağ yırtılır.<br>• Ağ atan, o turda <b>başka saldırı yapamaz</b> (kaç saldırısı olursa olsun)." },
      { id:"erzak", ad:"Erzak (kişi-gün)", adet:4, tip:"detay", etiket:"",
        detay:"Kuru yol yemeği: peksimet, kurutulmuş et/balık, kuru meyve. <b>1 birim = 1 kişinin 1 günü.</b><br>Masada gün sayısı takip edilmez (ev kuralı) — ama erzak sıfırdaysa açlık sahne konusu olur: avlanma, köyden alma, aç yolculuk (exhaustion riski DM takdiri)." }
    ]
  },

  /* Dükkân kataloğu — DM envantere ekler; fiyatlar kurallar.md (gp = gümüş) */
  katalog: [
    { id:"k_potion", ad:"Şifa İksiri", fiyat:"50 g", tip:"ic", envId:"potion1",
      detay:"<b>Kendin içersen Bonus Action</b>, başkasına Action: <b>2d4+2 HP</b>. Baygını ayıltır." },
    { id:"k_kit", ad:"Şifacı Çantası (Healer's Kit)", fiyat:"5 g", tip:"detay", envId:"kit",
      detay:"10 kullanım. Action: 0 HP'deki yaratığı <b>zar atmadan stabilize</b> eder (death save biter, 1 HP'de ayılmaz — güvende bekler)." },
    { id:"k_fener", ad:"Kapaklı Fener", fiyat:"5 g", tip:"fener", envId:"fener",
      detay:"1 şişe yağ = <b>6 saat</b>. <b>Açık:</b> 30 ft parlak + 30 ft loş ışık. <b>Kısık:</b> yalnız 5 ft loş — süzülen tek şerit; uzaktan fark edilmesi zor." },
    { id:"k_yagsise", ad:"Fener Yağı (şişe)", fiyat:"1 b", tip:"detay", envId:"yagsise",
      detay:"Fenerde 6 saat yanar. Dökülüp tutuşturulursa: 5 ft karede 1 tur <b>1d4 ateş</b>." },
    { id:"k_halat", ad:"Halat (50 ft, kendir)", fiyat:"1 g", tip:"detay", envId:"halat",
      detay:"AC 11, 2 HP; STR DC 17 ile koparılır. Tırmanışta düğümlü halat: Athletics gerekmez (yavaş tırmanış)." },
    { id:"k_lapa", ad:"Folk-Şifacı Lapası", fiyat:"15 g", tip:"ic", envId:"lapa",
      detay:"İksir değil, halk otu (Sular usulü). <b>Kısa dinlenmede</b> yenirse hit die iyileşmesine <b>+1d4</b> ekler. Savaş ortasında işe yaramaz." },
    { id:"k_mesale", ad:"Meşale (5'li)", fiyat:"1 b", tip:"detay", envId:"mesale",
      detay:"1 saat yanar: 20 ft parlak + 20 ft loş. Vurursan 1 ateş hasarı. Rüzgârda söner, feneri tercih et." }
  ],

  notlar: [
    { t:"2026-08-26", kim:"DM", metin:"Parti Defteri açıldı. Karakter sayfaları 'Karakterler' sekmesinde; HP, büyü, kaynak, dinlenme — her değişiklik ortak kayda yazılır ve herkeste görünür.", onemli:false }
  ]
};
