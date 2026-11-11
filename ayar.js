/* Doğum Günü Sevkiyatı — AYAR
 * Aslan'ın elle dolduracağı TEK yer. Yaş / doğum yılı YAZMAYIN.
 * YER TUTUCU olarak işaretli alanlar (dilekler, bahaneler) gerçek metinlerle değiştirilecek.
 * Palet ölçüleri hücre cinsindendir (1 hücre = 10 cm): en = yan yana (sütun), derinlik = sıra.
 */
window.AYAR = {
  alici: { ad: "Şeyda", soyad: "" },
  gonderen: "İhracat Lojistik Departmanı",
  icerik: "1 × 40'HC iyi dilek · 12 palet kahkaha",
  tarihMetni: "11 Kasım",
  sevkiyatNo: "AKG-1111-2026",
  konteynerOnek: "SYDU", // ISO 6346 sahip kodu (3 harf + U)

  // Dilekler: DILEKLER.md metinleriyle aynı (kısaltılmış sürüm). Sayı serbest (4–10).
  dilekler: [
    { durak: "Pazaryeri fabrikası", kisi: "Forklift operatörü", mesaj: "12 palet kahkaha, 1 palet huzur yüklendi. Sevgimiz sığmadı, ayrı konteynerle geliyor. İyi ki doğdun Şeyda!" },
    { durak: "Bozüyük gümrük", kisi: "Gümrük memuru", mesaj: "Beyanname tamam: 365 gün sağlık, 12 ay neşe. Kırmızı hat bu yıl sana kapalı. Nice yıllara!" },
    { durak: "Gemlik limanı", kisi: "Vinç operatörü", mesaj: "Konteynerin ilk gemiye bindi, roll-over yok. Yeni yaşın da böyle olsun: aktarmasız, beklemesiz." },
    { durak: "Ege açıkları", kisi: "Kaptan", mesaj: "Rota: mutluluk limanı, ETA: hemen şimdi. Rüzgâr hep arkandan essin." },
    { durak: "Pire aktarma", kisi: "Forwarder", mesaj: "Sistemde eksiksiz görünen ilk sevkiyat: doğum günün. Bu yıl her şey zamanında gelsin, senin yüklerin gibi." },
    { durak: "Hamburg limanı", kisi: "Depo sorumlusu", mesaj: "Teslim alındı: hasar yok, eksik yok, fazlalık var: bir yıl neşe. Navlun peşin ödendi." },
    { durak: "Son kilometre", kisi: "Şoför", mesaj: "Takograf doldu ama bu teslimata mola yok. Yollar açık, varışlar hep erken olsun." },
    { durak: "Teslim adresi", kisi: "İhracat Lojistik ekibi", mesaj: "Senin Incoterm'in DAP: her şeyi kapıya kadar götürürsün. Bu kez biz getirdik. İyi ki ekibimizdesin Şeyda!" }
  ],
  belgeNotu: "Navlun peşin ödendi · hasar yok · eksik yok · fazlalık: bir yıl neşe",

  // YER TUTUCU — 8 adet; kisa = çark dilimi etiketi (≤ 10 karakter); inandiricilik 1–5 → bonus sn = × sure.bonusCarpan. Aslan iç şakalarla değiştirecek
  bahaneler: [
    { kisa: "Roll-over", metin: "Armatör roll-over yaptı, gemi haftaya.", inandiricilik: 4, aylikKota: 1, ekipteKullanim: 14 },
    { kisa: "Gümrük", metin: "Gümrük sistemi bakımda.", inandiricilik: 3, aylikKota: 2, ekipteKullanim: 9 },
    { kisa: "Takograf", metin: "Şoförün takografı doldu, yasal mola.", inandiricilik: 5, aylikKota: 2, ekipteKullanim: 21 },
    { kisa: "Süveyş", metin: "Süveyş'te konvoy sırası.", inandiricilik: 2, aylikKota: 1, ekipteKullanim: 3 },
    { kisa: "Liman", metin: "Limanda yoğunluk, boş konteyner yok.", inandiricilik: 4, aylikKota: 1, ekipteKullanim: 11 },
    { kisa: "ATR", metin: "ATR henüz odadan onaylı gelmedi.", inandiricilik: 3, aylikKota: 1, ekipteKullanim: 7 },
    { kisa: "Hava", metin: "Hava muhalefeti, feribot iptal.", inandiricilik: 3, aylikKota: 1, ekipteKullanim: 5 },
    { kisa: "Forwarder", metin: "Forwarder 'sistemde görünmüyor' dedi.", inandiricilik: 2, aylikKota: 3, ekipteKullanim: 17 }
  ],

  // kimlik: benzersiz ad; kisa: tahtadaki etiket; agirlik: çekilme sıklığı (hafifler biraz daha sık)
  paletler: [
    { kimlik: "duvar",    ad: "30×60 duvar",        kisa: "30×60",   en: 12, derinlik: 8,  t: 0.85, m2: 64, sinif: "p-duvar",    agirlik: 3 },
    { kimlik: "yer",      ad: "60×60 yer",          kisa: "60×60",   en: 12, derinlik: 8,  t: 1.25, m2: 46, sinif: "p-yer",      agirlik: 3 },
    { kimlik: "porselen", ad: "60×120 porselen",    kisa: "60×120",  en: 12, derinlik: 10, t: 1.45, m2: 50, sinif: "p-porselen", agirlik: 2 },
    { kimlik: "teras",    ad: "2 cm teras",         kisa: "2 cm",    en: 12, derinlik: 10, t: 1.95, m2: 30, sinif: "p-teras",    agirlik: 1 },
    { kimlik: "buyuk",    ad: "120×120 büyük ebat", kisa: "120×120", en: 13, derinlik: 13, t: 1.65, m2: 40, sinif: "p-buyuk",    agirlik: 2 }
  ],

  // sira = uzunluk (10 cm), sutun = genişlik (10 cm), azamiT = azami yük (ton)
  konteynerler: {
    "20'":   { sira: 59,  sutun: 23, azamiT: 21.5 },
    "40'HC": { sira: 120, sutun: 23, azamiT: 26.5 },
    "Tır":   { sira: 136, sutun: 24, azamiT: 24 }
  },

  sure: { temel: 60, serbest: 90, atlaCezasi: 5, bonusCarpan: 10 }
};
