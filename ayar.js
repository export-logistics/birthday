/* Doğum Günü Sevkiyatı — AYAR
 * Aslan'ın elle dolduracağı TEK yer. Yaş / doğum yılı YAZMAYIN.
 * YER TUTUCU olarak işaretli alanlar (dilekler, bahaneler) gerçek metinlerle değiştirilecek.
 * Palet ölçüleri hücre cinsindendir (1 hücre = 10 cm): en = yan yana (sütun), derinlik = sıra.
 * alici.ad açılışta gelen addır; oyuncu açılış kartında değiştirebilir (bağlantıya ?ad=… eklenerek de verilir).
 * Dilek metinlerindeki {ad} seçilen ada dönüşür. hikayeKonteyner: hikâyede yüklenen konteyner (konteynerler anahtarı).
 */
window.AYAR = {
  alici: { ad: "Şeyda", soyad: "" },
  gonderen: "İhracat Lojistik Departmanı",
  icerik: "1 × 10' · 5 palet 60×120N Neo Calacatta Silver · 1 palet iyi dilek",
  tarihMetni: "11 Kasım",
  sevkiyatNo: "AKG-1111-2026",
  konteynerOnek: "SYDU", // ISO 6346 sahip kodu (3 harf + U)

  // Dilekler: DILEKLER.md ile aynı (4 durak; 4 yedek aşağıda yorumda). {ad} = seçilen alıcı adı.
  dilekler: [
    { durak: "Pazaryeri fabrikası", kisi: "Forklift operatörü", mesaj: "5 palet kahkaha, 1 palet huzur yüklendi. Sevgimiz sığmadı, ayrı konteynerle geliyor. İyi ki doğdun {ad}!" },
    { durak: "Bozüyük gümrük", kisi: "Gümrük memuru", mesaj: "Beyanname tamam: 365 gün sağlık, 12 ay neşe. Kırmızı hat bu yıl sana kapalı. Nice yıllara!" },
    { durak: "Ege açıkları", kisi: "Kaptan", mesaj: "Rota: mutluluk limanı, ETA: hemen şimdi. Rüzgâr hep arkandan essin." },
    { durak: "Teslim adresi", kisi: "İhracat Lojistik ekibi", mesaj: "Senin Incoterm'in DAP: her şeyi kapıya kadar götürürsün. Bu kez biz getirdik. İyi ki ekibimizdesin {ad}!" }
  ],
  // Yedek duraklar (istenirse dilekler'e taşı):
  // { durak: "Gemlik limanı", kisi: "Vinç operatörü", mesaj: "Konteynerin ilk gemiye bindi, roll-over yok. Yeni yaşın da böyle olsun: aktarmasız, beklemesiz." },
  // { durak: "Pire aktarma", kisi: "Forwarder", mesaj: "Sistemde eksiksiz görünen ilk sevkiyat: doğum günün. Bu yıl her şey zamanında gelsin, senin yüklerin gibi." },
  // { durak: "Hamburg limanı", kisi: "Depo sorumlusu", mesaj: "Teslim alındı: hasar yok, eksik yok, fazlalık var: bir yıl neşe. Navlun peşin ödendi." },
  // { durak: "Son kilometre", kisi: "Şoför", mesaj: "Takograf doldu ama bu teslimata mola yok. Yollar açık, varışlar hep erken olsun." },
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

  // Akgün'ün 6 ana ebadı; ad = gerçek ürün (Netsis adından kısaltma), m2 = m²/palet (Akgün üretim kaydı ortalaması),
  // t = yaklaşık (kg/m² varsayımı × m²/palet + 25 kg palet). en × derinlik hücre; agirlik = çekilme sıklığı (üretim payına yakın).
  paletler: [
    { kimlik: "nc60120", ad: "60×120N Neo Calacatta Silver", kisa: "60×120N", en: 12, derinlik: 10, t: 1.38, m2: 64.54, sinif: "p-porselen", agirlik: 3 },
    { kimlik: "cal3060", ad: "30×60 Calacatta Grey",         kisa: "30×60",   en: 12, derinlik: 8,  t: 0.92, m2: 64.17, sinif: "p-duvar",    agirlik: 3 },
    { kimlik: "raf6161", ad: "61×61 Rafael White",           kisa: "61×61",   en: 13, derinlik: 13, t: 1.10, m2: 56.74, sinif: "p-buyuk",    agirlik: 1 },
    { kimlik: "arya6060", ad: "60×60 Arya Light Grey",       kisa: "60×60",   en: 12, derinlik: 12, t: 1.00, m2: 51.48, sinif: "p-yer",      agirlik: 2 },
    { kimlik: "cal4545", ad: "45×45 Calacatta Weiss",        kisa: "45×45",   en: 10, derinlik: 10, t: 1.42, m2: 87.02, sinif: "p-teras",    agirlik: 1 },
    { kimlik: "ikicm",   ad: "60×60×20 Durastone 2 cm",      kisa: "2 cm",    en: 12, derinlik: 8,  t: 0.95, m2: 21.69, sinif: "p-ikicm",    agirlik: 1 }
  ],

  // sira = uzunluk (10 cm), sutun = genişlik (10 cm), azamiT = azami yük (ton)
  konteynerler: {
    "10'":   { sira: 28,  sutun: 23, azamiT: 9 },
    "20'":   { sira: 59,  sutun: 23, azamiT: 21.5 },
    "40'HC": { sira: 120, sutun: 23, azamiT: 26.5 },
    "Tır":   { sira: 136, sutun: 24, azamiT: 24 }
  },
  hikayeKonteyner: "10'", // hikâye modu (kısa oyun); serbest modda hepsi seçilebilir

  sure: { temel: 60, serbest: 90, atlaCezasi: 5, bonusCarpan: 10 }
};
