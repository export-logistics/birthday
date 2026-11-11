/* Doğum Günü Sevkiyatı — motor (saf fonksiyonlar, durum tutmaz).
 * Tahta: tahta[sıra][sütun]; 0 = boş, >0 = yerleşen paletin sayısal kimliği.
 * Sıra 0 = ön duvar, büyük indeks = kapı tarafı. Palet kapıdan girer, ön duvara doğru düşer.
 */
(function (kok) {
  'use strict';

  function tamSayiMi(n) { return Number.isInteger(n); }

  function yeniTahta(sira, sutun) {
    if (!tamSayiMi(sira) || !tamSayiMi(sutun) || sira < 1 || sutun < 1) {
      throw new RangeError('yeniTahta: sira ve sutun pozitif tam sayı olmalı');
    }
    var t = [];
    for (var r = 0; r < sira; r++) {
      var satir = [];
      for (var c = 0; c < sutun; c++) satir.push(0);
      t.push(satir);
    }
    return t;
  }

  function dondur(palet) {
    var k = {};
    for (var a in palet) if (Object.prototype.hasOwnProperty.call(palet, a)) k[a] = palet[a];
    k.en = palet.derinlik;
    k.derinlik = palet.en;
    return k;
  }

  /* Paletin x sütunundan bırakılınca oturacağı sıra (en küçük indeks).
   * x..x+en-1 sütunlarındaki dolu hücrelerin en büyük sıra indeksinin bir altı (+1);
   * hiç dolu yoksa 0. Tahtaya sığmıyorsa (yan sınır ya da kapıdan taşma) null. */
  function inisSirasi(tahta, palet, x) {
    var sira = tahta.length;
    var sutun = tahta[0].length;
    if (!tamSayiMi(x) || x < 0 || x + palet.en > sutun) return null;
    var enBuyuk = -1;
    for (var r = sira - 1; r >= 0 && enBuyuk < 0; r--) {
      for (var c = x; c < x + palet.en; c++) {
        if (tahta[r][c] !== 0) { enBuyuk = r; break; }
      }
    }
    var y = enBuyuk + 1;
    if (y + palet.derinlik > sira) return null;
    return y;
  }

  /* Girdi değişmez; geçersiz/çakışan yerleşimde RangeError fırlatır (sessiz yutma yok). */
  function yerlestir(tahta, palet, x, y, kimlik) {
    var sira = tahta.length;
    var sutun = tahta[0].length;
    if (!tamSayiMi(kimlik) || kimlik < 1) throw new RangeError('yerlestir: kimlik >= 1 tam sayı olmalı');
    if (!tamSayiMi(x) || !tamSayiMi(y) || x < 0 || y < 0 || x + palet.en > sutun || y + palet.derinlik > sira) {
      throw new RangeError('yerlestir: palet tahta dışında');
    }
    var yeni = tahta.map(function (s) { return s.slice(); });
    for (var r = y; r < y + palet.derinlik; r++) {
      for (var c = x; c < x + palet.en; c++) {
        if (yeni[r][c] !== 0) throw new RangeError('yerlestir: hücre dolu (' + r + ',' + c + ')');
        yeni[r][c] = kimlik;
      }
    }
    return yeni;
  }

  function dolulukYuzdesi(tahta) {
    var dolu = 0, toplam = 0;
    for (var r = 0; r < tahta.length; r++) {
      for (var c = 0; c < tahta[r].length; c++) {
        toplam++;
        if (tahta[r][c] !== 0) dolu++;
      }
    }
    return toplam === 0 ? 0 : (dolu * 100) / toplam;
  }

  function yuvarla2(n) { return Math.round(n * 100) / 100; }

  function toplamTonaj(yerlesenler) {
    var s = 0;
    for (var i = 0; i < yerlesenler.length; i++) {
      var t = yerlesenler[i].t !== undefined ? yerlesenler[i].t : yerlesenler[i].palet.t;
      s += t;
    }
    return yuvarla2(s);
  }

  /* Palet eklenince azami yük aşılmıyor mu? */
  function tonajSigarMi(yuklu, paletT, azami) {
    return yuvarla2(yuklu + paletT) <= azami;
  }

  /* doluluk: 0–100 yüzde. >= 90 → +%20, >= 80 → +%10. */
  function puanHesapla(m2, doluluk) {
    var carpan = 1;
    if (doluluk >= 90) carpan = 1.2;
    else if (doluluk >= 80) carpan = 1.1;
    return Math.round(m2 * carpan);
  }

  /* ISO 6346: harf değerleri A=10 … Z=38, 11'in katları atlanır; ağırlık 2^i; mod 11; 10 → 0. */
  var HARF_DEGERLERI = (function () {
    var tablo = {}, deger = 10, h = 0, harfler = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (h = 0; h < harfler.length; h++) {
      if (deger % 11 === 0) deger++;
      tablo[harfler[h]] = deger;
      deger++;
    }
    return tablo;
  })();

  function kontrolHanesi(kod) {
    var k = String(kod).trim().toUpperCase();
    if (!/^[A-Z]{4}[0-9]{6}$/.test(k)) throw new TypeError('kontrolHanesi: 4 harf + 6 rakam bekleniyor: ' + kod);
    var toplam = 0;
    for (var i = 0; i < 10; i++) {
      var ch = k[i];
      var v = i < 4 ? HARF_DEGERLERI[ch] : Number(ch);
      toplam += v * Math.pow(2, i);
    }
    var kalan = toplam % 11;
    return kalan === 10 ? 0 : kalan;
  }

  function konteynerNo(onek, seri) {
    var o = String(onek).trim().toUpperCase();
    var s = String(seri);
    while (s.length < 6) s = '0' + s;
    return { sahip: o, seri: s, kontrol: kontrolHanesi(o + s), metin: o + ' ' + s + ' ' + kontrolHanesi(o + s) };
  }

  function trSayi(n, ondalik) {
    var sayi = Number(n);
    if (!Number.isFinite(sayi)) throw new TypeError('trSayi: sayı bekleniyor: ' + n);
    var o = ondalik || 0;
    return sayi.toLocaleString('tr-TR', { minimumFractionDigits: o, maximumFractionDigits: o });
  }

  /* Tahtada dolu hücrelerin en büyük sıra indeksi (hiç yoksa -1). */
  function enBuyukDoluSira(tahta) {
    for (var r = tahta.length - 1; r >= 0; r--) {
      for (var c = 0; c < tahta[r].length; c++) if (tahta[r][c] !== 0) return r;
    }
    return -1;
  }

  /* Kamera: görünür pencere 48 sıra; pencere üstü = clamp(cephe - 36, 0, sira - 48). */
  function kameraUstu(dolulukCephesi, sira, pencere) {
    var p = pencere || 48;
    var ust = dolulukCephesi - 36;
    var azami = Math.max(0, sira - p);
    return Math.min(Math.max(ust, 0), azami);
  }

  /* Palet bu tahtada (iki yönde, her x) en az bir yere sığar mı? */
  function sigabilirMi(tahta, palet) {
    var yonler = [palet, dondur(palet)];
    var sutun = tahta[0].length;
    for (var i = 0; i < yonler.length; i++) {
      for (var x = 0; x + yonler[i].en <= sutun; x++) {
        if (inisSirasi(tahta, yonler[i], x) !== null) return true;
      }
    }
    return false;
  }

  /* Ağırlıklı seçim; rastgele() [0,1) döndürür (test için dışarıdan verilir). */
  function agirlikliSec(paletler, rastgele) {
    var toplam = 0, i;
    for (i = 0; i < paletler.length; i++) toplam += paletler[i].agirlik > 0 ? paletler[i].agirlik : 0;
    if (toplam <= 0) throw new RangeError('agirlikliSec: ağırlık toplamı sıfır');
    var hedef = rastgele() * toplam;
    for (i = 0; i < paletler.length; i++) {
      var a = paletler[i].agirlik > 0 ? paletler[i].agirlik : 0;
      if (hedef < a) return paletler[i];
      hedef -= a;
    }
    return paletler[paletler.length - 1];
  }

  /* Hücre boyutu (px) = min(8, floor((ekranGenişliği − yanPanel − kenar) / sütun)), en az 3. */
  function hucrePx(ekranGenisligi, yanPanel, kenar, sutun) {
    var h = Math.floor((ekranGenisligi - yanPanel - kenar) / sutun);
    return Math.max(3, Math.min(8, h));
  }

  /* Çark: n dilim, ibre üstte sabit. dilim i, üstten saat yönünde [i*d, (i+1)*d) aralığı. */
  function carkAcisi(n, dilim, tur, sapma) {
    var d = 360 / n;
    return tur * 360 - (dilim + 0.5) * d + (sapma || 0);
  }
  function carkDilimi(n, aci) {
    var d = 360 / n;
    var yerel = (((-aci) % 360) + 360) % 360;
    return Math.floor(yerel / d) % n;
  }

  /* En iyi N skor (puan azalan; eşitte eski kayıt önde). Girdi değişmez. */
  function skorEkle(liste, kayit, azami) {
    var n = azami || 5;
    var kopya = liste.slice();
    kopya.push(kayit);
    var sirali = kopya
      .map(function (k, i) { return { k: k, i: i }; })
      .sort(function (a, b) { return (b.k.puan - a.k.puan) || (a.i - b.i); })
      .map(function (o) { return o.k; });
    return sirali.slice(0, n);
  }

  var Motor = {
    yeniTahta: yeniTahta, dondur: dondur, inisSirasi: inisSirasi, yerlestir: yerlestir,
    dolulukYuzdesi: dolulukYuzdesi, toplamTonaj: toplamTonaj, tonajSigarMi: tonajSigarMi,
    puanHesapla: puanHesapla, kontrolHanesi: kontrolHanesi, konteynerNo: konteynerNo,
    trSayi: trSayi, enBuyukDoluSira: enBuyukDoluSira, kameraUstu: kameraUstu,
    sigabilirMi: sigabilirMi, agirlikliSec: agirlikliSec, hucrePx: hucrePx,
    carkAcisi: carkAcisi, carkDilimi: carkDilimi, skorEkle: skorEkle
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = Motor;
  else kok.Motor = Motor;
})(typeof window !== 'undefined' ? window : globalThis);
