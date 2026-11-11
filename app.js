/* Doğum Günü Sevkiyatı — ekran durum makinesi ve üç oyun.
 * Kullanıcı/AYAR metinleri DOM'a yalnız textContent ile yazılır (innerHTML yok).
 */
(function () {
  'use strict';

  var A = window.AYAR;
  var M = window.Motor;

  function $(id) { return document.getElementById(id); }
  function yazi(el, metin) { el.textContent = metin; }
  function yap(etiket, sinif, metin) {
    var e = document.createElement(etiket);
    if (sinif) e.className = sinif;
    if (metin !== undefined) e.textContent = metin;
    return e;
  }
  function svgYap(etiket, ozellikler) {
    var e = document.createElementNS('http://www.w3.org/2000/svg', etiket);
    for (var k in ozellikler) e.setAttribute(k, ozellikler[k]);
    return e;
  }
  function rnd(n) { return Math.floor(Math.random() * n); }
  function azHareket() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  function tr(n, o) { return M.trSayi(n, o || 0); }

  /* ---------- Hata ekranı (sessiz başarısızlık yok) ---------- */
  function hataGoster(metin) {
    var kap = $('ekran-hata');
    if (!kap) return;
    yazi($('hataMetni'), metin);
    var tum = document.querySelectorAll('section[data-ekran]');
    for (var i = 0; i < tum.length; i++) tum[i].hidden = tum[i] !== kap;
    kap.hidden = false;
  }
  window.addEventListener('error', function (e) {
    hataGoster('Beklenmeyen hata: ' + (e && e.message ? e.message : 'bilinmiyor'));
  });

  /* ---------- AYAR doğrulama ---------- */
  function ayarKontrol() {
    var s = [];
    if (!A || typeof A !== 'object') return ['ayar.js yüklenemedi (window.AYAR yok).'];
    if (!M) return ['motor.js yüklenemedi (window.Motor yok).'];
    if (!A.alici || !A.alici.ad) s.push('AYAR.alici.ad eksik.');
    if (!A.sevkiyatNo) s.push('AYAR.sevkiyatNo eksik.');
    if (!A.tarihMetni) s.push('AYAR.tarihMetni eksik.');
    if (!A.konteynerOnek || !/^[A-Za-z]{4}$/.test(A.konteynerOnek)) s.push('AYAR.konteynerOnek 4 harf olmalı (ör. SYDU).');
    var su = A.sure;
    if (!su || !(su.temel > 0) || !(su.serbest > 0) || !(su.atlaCezasi >= 0) || !(su.bonusCarpan >= 0)) {
      s.push('AYAR.sure alanları (temel, serbest, atlaCezasi, bonusCarpan) sayı olmalı.');
    }
    if (!Array.isArray(A.paletler) || A.paletler.length === 0) {
      s.push('AYAR.paletler boş.');
    } else {
      A.paletler.forEach(function (p, i) {
        if (!(Number.isInteger(p.en) && p.en > 0 && Number.isInteger(p.derinlik) && p.derinlik > 0) ||
            !(p.t > 0) || !(p.m2 >= 0) || !p.sinif || !p.kisa || !p.ad || !(p.agirlik > 0)) {
          s.push('AYAR.paletler[' + i + '] geçersiz (en, derinlik, t, m2, sinif, kisa, ad, agirlik).');
        }
      });
    }
    var k = A.konteynerler;
    if (!k || !k["20'"]) s.push('AYAR.konteynerler["20\'"] eksik.');
    else {
      Object.keys(k).forEach(function (ad) {
        var c = k[ad];
        if (!(Number.isInteger(c.sira) && c.sira > 0 && Number.isInteger(c.sutun) && c.sutun > 0 && c.azamiT > 0)) {
          s.push('AYAR.konteynerler["' + ad + '"] geçersiz (sira, sutun, azamiT).');
        }
      });
    }
    if (Array.isArray(A.paletler) && k) {
      Object.keys(k).forEach(function (ad) {
        A.paletler.forEach(function (p) {
          if (Math.min(p.en, p.derinlik) > k[ad].sutun) s.push('Palet "' + p.ad + '" ' + ad + ' genişliğine sığmaz.');
        });
      });
    }
    if (!Array.isArray(A.dilekler)) s.push('AYAR.dilekler dizi olmalı.');
    else A.dilekler.forEach(function (d, i) {
      if (!d || !d.durak || !d.kisi || !d.mesaj) s.push('AYAR.dilekler[' + i + '] için durak, kisi, mesaj gerekli.');
    });
    if (!Array.isArray(A.bahaneler)) s.push('AYAR.bahaneler dizi olmalı.');
    else A.bahaneler.forEach(function (b, i) {
      if (!b || !b.metin || !(Number.isInteger(b.inandiricilik) && b.inandiricilik >= 1 && b.inandiricilik <= 5)) {
        s.push('AYAR.bahaneler[' + i + '] için metin ve 1–5 arası tam sayı inandiricilik gerekli.');
      }
    });
    return s;
  }

  /* ---------- Depo (localStorage; yoksa bellekte) ---------- */
  var ANAHTAR = 'dgs.v1';
  var SKOR_ANAHTAR = 'dgs.skor.v1';
  var depoSorunlu = false;
  var bellek = {};
  function depoOku(anahtar) {
    try {
      var ham = window.localStorage.getItem(anahtar);
      if (ham === null) return anahtar in bellek ? bellek[anahtar] : null;
      return JSON.parse(ham);
    } catch (e) {
      depoSorunlu = true;
      return anahtar in bellek ? bellek[anahtar] : null;
    }
  }
  function depoYaz(anahtar, deger) {
    bellek[anahtar] = deger;
    try { window.localStorage.setItem(anahtar, JSON.stringify(deger)); }
    catch (e) { depoSorunlu = true; }
  }

  var VARSAYILAN = { ekran: 'e0', bahane: null, takip: 0, muhur: null };
  var durum = (function () {
    var d = depoOku(ANAHTAR);
    if (!d || typeof d !== 'object' || typeof d.ekran !== 'string') return Object.assign({}, VARSAYILAN);
    return Object.assign({}, VARSAYILAN, d);
  })();
  function kaydet() { depoYaz(ANAHTAR, durum); }
  function skorlariOku() {
    var l = depoOku(SKOR_ANAHTAR);
    if (!Array.isArray(l)) return [];
    return l.filter(function (k) { return k && typeof k.puan === 'number' && typeof k.konteyner === 'string'; });
  }

  /* ---------- Ekran yönetimi ---------- */
  var ADIM = { e0: -1, e1: 0, e2: 1, e2b: 1, e3: 2, e4: 3, ser: 3, hata: -1 };
  var KALICI = { e0: 1, e1: 1, e2: 1, e2b: 1, e3: 1, e4: 1 };
  var mevcut = null;

  function adimlariCiz(ad) {
    var i = ADIM[ad];
    var lis = $('adimlar').querySelectorAll('li');
    for (var j = 0; j < lis.length; j++) {
      lis[j].classList.toggle('tamam', i >= 0 && j < i);
      lis[j].classList.toggle('simdi', j === i);
      if (j === i) lis[j].setAttribute('aria-current', 'step'); else lis[j].removeAttribute('aria-current');
    }
  }

  function git(ad, odak) {
    mevcut = ad;
    var tum = document.querySelectorAll('section[data-ekran]');
    for (var i = 0; i < tum.length; i++) tum[i].hidden = tum[i].getAttribute('data-ekran') !== ad;
    adimlariCiz(ad);
    var serbestOyun = o && o.mod === 'serbest' && (ad === 'e2' || ad === 'e2b');
    if (KALICI[ad] && !serbestOyun) { durum.ekran = ad; kaydet(); }
    window.scrollTo(0, 0);
    if (odak) {
      var h = $('ekran-' + ad).querySelector('h2');
      if (h) h.focus({ preventScroll: true });
    }
  }

  /* ---------- Onay penceresi ---------- */
  function onay(metin) {
    return new Promise(function (coz) {
      var d = $('onay');
      if (typeof d.showModal !== 'function') { coz(window.confirm(metin)); return; }
      yazi($('onayMetin'), metin);
      d.returnValue = '';
      d.addEventListener('close', function () { coz(d.returnValue === 'evet'); }, { once: true });
      d.showModal();
    });
  }

  /* ---------- E0 ---------- */
  function alici() { return A.alici.ad; }
  function e0Kur() {
    yazi($('b-no'), A.sevkiyatNo);
    yazi($('b-alici'), alici().trim());
    yazi($('b-gonderen'), A.gonderen || '');
    yazi($('b-icerik'), A.icerik || '');
    yazi($('b-tarih'), A.tarihMetni);
    yazi($('b-yonlendirme'), 'Bahane bul, konteyneri yükle, yolculuğu takip et.');
    $('btn-devam').hidden = durum.ekran === 'e0';
    $('depoUyari').hidden = !depoSorunlu;
  }

  function sifirla() {
    durum = Object.assign({}, VARSAYILAN);
    kaydet();
  }

  /* ---------- E1 çark ---------- */
  var carkSayi = 0;
  var cevriliyor = false;

  function carkKur() {
    var liste = A.bahaneler;
    carkSayi = liste.length >= 3 ? liste.length : 0;
    var rotor = $('carkRotor');
    rotor.replaceChildren();
    $('cark').setAttribute('aria-label', 'Bahane çarkı, ' + carkSayi + ' dilim: ' + liste.map(function (b) { return b.kisa || b.metin.split(' ')[0]; }).join(', '));
    if (!carkSayi) return;
    var g = svgYap('g', { transform: 'translate(104 104)' });
    rotor.appendChild(g);
    var d = (2 * Math.PI) / carkSayi, r = 100;
    for (var i = 0; i < carkSayi; i++) {
      var a1 = i * d, a2 = (i + 1) * d;
      var yol = 'M0 0 L' + (r * Math.sin(a1)).toFixed(2) + ' ' + (-r * Math.cos(a1)).toFixed(2) +
        ' A' + r + ' ' + r + ' 0 0 1 ' + (r * Math.sin(a2)).toFixed(2) + ' ' + (-r * Math.cos(a2)).toFixed(2) + ' Z';
      g.appendChild(svgYap('path', { d: yol, 'class': 'dilim d' + (i % 2) }));
      var b = liste[i];
      var etiket = (b.kisa && String(b.kisa).trim()) || String(b.metin).trim().split(/\s+/)[0];
      var t = svgYap('text', { 'class': 'dilim-no', transform: 'rotate(' + ((((i + 0.5) * 360) / carkSayi) - 90).toFixed(2) + ') translate(58 0)' });
      t.textContent = etiket;
      g.appendChild(t);
    }
  }

  /* Uzunluk × genişlik (m) · azami yük; genişlik iç ölçü payıyla (+5 cm): 23 hücre → 2,35 m. */
  function olcuMetin(k) {
    return tr(k.sira / 10, 1) + ' × ' + tr(k.sutun / 10 + 0.05, 2) + ' m · azami ' + tr(k.azamiT, 1) + ' t';
  }

  function bonusSn(b) { return b.inandiricilik * A.sure.bonusCarpan; }

  function carkSonucGoster() {
    var b = A.bahaneler[durum.bahane.idx];
    yazi($('bahaneMetin'), b.metin);
    var noktalar = $('noktalar');
    noktalar.replaceChildren();
    for (var i = 1; i <= 5; i++) noktalar.appendChild(yap('span', 'nokta' + (i <= b.inandiricilik ? ' dolu' : '')));
    noktalar.setAttribute('aria-label', 'İnandırıcılık ' + b.inandiricilik + ' / 5');
    yazi($('inandMetin'), 'İnandırıcılık ' + b.inandiricilik + ' / 5');
    yazi($('bonusMetin'), '+' + tr(durum.bahane.bonus) + ' sn');
    yazi($('bahaneMeta'), 'Aylık kota ' + tr(b.aylikKota || 0) + ' · bu ay ' + tr(b.ekipteKullanim || 0) + ' kez kullanıldı.');
    $('carkSonuc').hidden = false;
    $('btn-cevir').hidden = true;
    $('btn-yukle').hidden = false;
    $('btn-mail').hidden = false;
    $('btn-yukle').focus({ preventScroll: true });
  }

  function e1Kur() {
    carkKur();
    var rotor = $('carkRotor');
    cevriliyor = false;
    $('carkSonuc').hidden = true;
    $('mailAlan').hidden = true;
    $('btn-mail').hidden = true;
    $('btn-yukle').hidden = true;
    $('btn-cevir').hidden = false;
    $('btn-cevir').disabled = false;
    $('carkBos').hidden = carkSayi > 0;
    $('cark').parentNode.hidden = carkSayi === 0;
    rotor.classList.remove('donuyor');
    rotor.style.transform = 'rotate(0deg)';
    if (!carkSayi) {
      durum.bahane = { idx: 0, aci: 0, bonus: 0, yok: true };
      kaydet();
      $('btn-cevir').hidden = true;
      $('btn-yukle').hidden = false;
      return;
    }
    if (durum.bahane && !durum.bahane.yok && durum.bahane.idx < carkSayi) {
      rotor.style.transform = 'rotate(' + durum.bahane.aci + 'deg)';
      carkSonucGoster();
    } else if (durum.bahane) {
      durum.bahane = null; kaydet();
    }
  }

  function cevir() {
    if (cevriliyor || durum.bahane || !carkSayi) return;
    cevriliyor = true;
    $('btn-cevir').disabled = true;
    var idx = rnd(carkSayi);
    var aci = M.carkAcisi(carkSayi, idx, 4 + rnd(3), (Math.random() - 0.5) * (360 / carkSayi) * 0.6);
    durum.bahane = { idx: idx, aci: aci, bonus: bonusSn(A.bahaneler[idx]) };
    kaydet();
    var rotor = $('carkRotor');
    var azalt = azHareket();
    if (!azalt) rotor.classList.add('donuyor');
    void rotor.getBoundingClientRect();
    rotor.style.transform = 'rotate(' + aci + 'deg)';
    window.setTimeout(function () { cevriliyor = false; carkSonucGoster(); }, azalt ? 300 : 3900);
  }

  function mailMetni() {
    var b = A.bahaneler[durum.bahane.idx];
    return 'Konu: ' + A.sevkiyatNo + ' — teslim planı güncellemesi\n\n' +
      'Merhaba,\n\n' + b.metin + '\nYükleme yaklaşık ' + durum.bahane.bonus +
      ' saniye uzayabilir; gelişmeyi en kısa sürede paylaşacağız.\n\nSaygılarımla,\n' + (A.gonderen || '');
  }

  function mailKopyala() {
    if (!durum.bahane || durum.bahane.yok) return;
    var metin = mailMetni();
    var alan = $('mailMetin');
    var dugme = $('btn-mail');
    function secilebilir() {
      alan.value = metin;
      $('mailAlan').hidden = false;
      alan.focus();
      alan.select();
      yazi(dugme, 'Kopyalanamadı — metni seçin');
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(metin).then(function () {
        yazi(dugme, 'Kopyalandı');
      }, secilebilir);
    } else {
      secilebilir();
    }
  }

  /* ---------- E2 yükleme ---------- */
  var PANEL = 116;
  var KENAR = 40;
  var PENCERE = 48;
  var o = null;            // aktif oyun
  var renkler = {};
  var oyunSayac = null;
  var sonGolgeNeden = 'x';
  var tahtaC = null, tahtaX = null, miniC = null, miniX = null;

  function renkOku() {
    var stil = getComputedStyle(document.documentElement);
    A.paletler.forEach(function (p) { renkler[p.sinif] = (stil.getPropertyValue('--' + p.sinif) || '#dddddd').trim(); });
    renkler.lacivert = stil.getPropertyValue('--lacivert').trim() || '#0f2747';
    renkler.vurgu = stil.getPropertyValue('--vurgu').trim() || '#f2a33a';
    renkler.kirmizi = stil.getPropertyValue('--kirmizi').trim() || '#b42318';
  }

  function canvasBoyutla(c, w, h) {
    var dpr = window.devicePixelRatio || 1;
    c.width = Math.round(w * dpr);
    c.height = Math.round(h * dpr);
    c.style.width = w + 'px';
    c.style.height = h + 'px';
    var x = c.getContext('2d');
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    return x;
  }

  function olcekle() {
    if (!o) return;
    var W = Math.min(document.documentElement.clientWidth || window.innerWidth, 520);
    o.gor = Math.min(o.sira, PENCERE);
    var kullanilan = $('ust').offsetHeight + $('ekran-e2').querySelector('h2').offsetHeight + $('ekran-e2').querySelector('.yuk-ust').offsetHeight +
      $('kumanda').offsetHeight + $('durumMetni').offsetHeight + 2 * 18 + 8 + 3 * 14 + 24;
    var yukseklikHp = Math.floor((window.innerHeight - kullanilan) / o.gor);
    var genislikHp = M.hucrePx(W, PANEL, KENAR, o.sutun);
    o.hp = Math.max(3, Number.isFinite(yukseklikHp) && yukseklikHp > 0 ? Math.min(genislikHp, yukseklikHp) : genislikHp);
    tahtaX = canvasBoyutla(tahtaC, o.sutun * o.hp, o.gor * o.hp);
    var onizleX = canvasBoyutla($('siradaki'), 104, 64);
    o.onizleX = onizleX;
    if (o.sira > PENCERE) {
      $('miniBlok').hidden = false;
      miniX = canvasBoyutla(miniC, o.sutun * 2, o.sira * 2);
    } else {
      $('miniBlok').hidden = true;
    }
    cizOnizlemeler();
    ciz();
  }

  function paletCiz(x, px, py, w, h, p, alfa) {
    x.save();
    x.globalAlpha = alfa === undefined ? 1 : alfa;
    x.fillStyle = renkler[p.sinif] || '#ddd';
    x.fillRect(px, py, w, h);
    x.lineWidth = 1;
    x.strokeStyle = renkler.lacivert;
    x.strokeRect(px + 0.5, py + 0.5, w - 1, h - 1);
    var punto = Math.max(8, Math.min(12, Math.floor(Math.min(w / 5.2, h / 1.4))));
    if (w >= 30 && h >= 14) {
      x.fillStyle = renkler.lacivert;
      x.font = '600 ' + punto + 'px system-ui, sans-serif';
      x.textAlign = 'center';
      x.textBaseline = 'middle';
      x.fillText(p.kisa, px + w / 2, py + h / 2, w - 4);
    }
    x.restore();
  }

  function onizle(x, w, h, p) {
    x.clearRect(0, 0, w, h);
    var hucre = Math.min((w - 4) / p.en, (h - 4) / p.derinlik);
    var pw = p.en * hucre, ph = p.derinlik * hucre;
    paletCiz(x, (w - pw) / 2, (h - ph) / 2, pw, ph, p);
  }

  function cizOnizlemeler() {
    if (!o || !o.aktif) return;
    onizle(o.onizleX, 104, 64, o.aktif.palet);
    var kap = $('sonraki');
    kap.replaceChildren();
    for (var i = 0; i < 3 && i < o.kuyruk.length; i++) {
      var c = yap('canvas');
      kap.appendChild(c);
      onizle(canvasBoyutla(c, 32, 28), 32, 28, o.kuyruk[i]);
    }
    var p = o.aktif.palet;
    yazi($('siradakiAd'), p.ad + ' · ' + p.en + '×' + p.derinlik + ' hücre · ' + tr(p.t, 2) + ' t');
  }

  function golge() {
    var p = o.aktif.palet;
    var y = M.inisSirasi(o.tahta, p, o.aktif.x);
    if (y === null) return { y: null, neden: 'sigmaz' };
    if (!M.tonajSigarMi(M.toplamTonaj(o.yerlesen), p.t, o.azami)) return { y: y, neden: 'aks' };
    return { y: y, neden: null };
  }

  function etiketCiz(x, metin, px, py) {
    x.save();
    x.font = '700 11px system-ui, sans-serif';
    var gen = x.measureText(metin).width + 8;
    var sol = Math.max(0, Math.min(px, o.sutun * o.hp - gen));
    x.fillStyle = 'rgba(255,255,255,.95)';
    x.fillRect(sol, py, gen, 16);
    x.strokeStyle = renkler.kirmizi;
    x.lineWidth = 1;
    x.strokeRect(sol + 0.5, py + 0.5, gen - 1, 15);
    x.fillStyle = renkler.kirmizi;
    x.textBaseline = 'middle';
    x.textAlign = 'left';
    x.fillText(metin, sol + 4, py + 8.5);
    x.restore();
  }

  function ciz() {
    if (!o || !tahtaX) return;
    var x = tahtaX, hp = o.hp, W = o.sutun * hp, H = o.gor * hp, ust = o.ust, i;
    x.clearRect(0, 0, W, H);
    x.fillStyle = '#eef1f5';
    x.fillRect(0, 0, W, H);
    x.strokeStyle = '#d3d9e2';
    x.lineWidth = 1;
    x.beginPath();
    for (i = 0; i <= o.sutun; i += 10) { x.moveTo(i * hp + 0.5, 0); x.lineTo(i * hp + 0.5, H); }
    for (i = Math.ceil(ust / 10) * 10; i <= ust + o.gor; i += 10) { x.moveTo(0, (i - ust) * hp + 0.5); x.lineTo(W, (i - ust) * hp + 0.5); }
    x.stroke();

    o.yerlesen.forEach(function (k) {
      if (k.y + k.palet.derinlik < ust || k.y > ust + o.gor) return;
      paletCiz(x, k.x * hp, (k.y - ust) * hp, k.palet.en * hp, k.palet.derinlik * hp, k.palet);
    });

    if (o.anim) {
      var a = o.anim;
      paletCiz(x, a.x * hp, (a.simdi - ust) * hp, a.palet.en * hp, a.palet.derinlik * hp, a.palet, 0.9);
      return;
    }
    if (o.bitti || !o.aktif) return;

    var p = o.aktif.palet, ax = o.aktif.x;
    var g = golge();
    x.save();
    x.setLineDash([4, 3]);
    x.lineWidth = 2;
    if (g.y !== null) {
      var gy = (g.y - ust) * hp;
      x.fillStyle = g.neden ? 'rgba(180,35,24,.16)' : 'rgba(15,39,71,.16)';
      x.strokeStyle = g.neden ? renkler.kirmizi : renkler.lacivert;
      x.fillRect(ax * hp, gy, p.en * hp, p.derinlik * hp);
      x.strokeRect(ax * hp + 1, gy + 1, p.en * hp - 2, p.derinlik * hp - 2);
      x.restore();
      if (g.neden) etiketCiz(x, 'binmez', ax * hp + 2, Math.max(0, gy + 2));
    } else {
      var by = (o.gor - p.derinlik) * hp;
      x.strokeStyle = renkler.kirmizi;
      x.strokeRect(ax * hp + 1, by + 1, p.en * hp - 2, p.derinlik * hp - 2);
      x.restore();
      etiketCiz(x, 'sığmaz', ax * hp + 2, by + 2);
    }
    // sıradaki palet kapıda (pencerenin altında)
    paletCiz(x, ax * hp, (o.gor - p.derinlik) * hp, p.en * hp, p.derinlik * hp, p, 0.88);
    x.save();
    x.strokeStyle = renkler.vurgu;
    x.lineWidth = 2;
    x.strokeRect(ax * hp + 1, (o.gor - p.derinlik) * hp + 1, p.en * hp - 2, p.derinlik * hp - 2);
    x.restore();

    if (g.neden !== sonGolgeNeden) {
      sonGolgeNeden = g.neden;
      if (g.neden === 'sigmaz') durumYaz('Buraya sığmaz — kaydır ya da döndür.');
      else if (g.neden === 'aks') durumYaz('Aks sınırı — bu palet binmez. Atla.');
    }
  }

  function miniCiz() {
    if (!miniX || o.sira <= PENCERE) return;
    var x = miniX;
    x.clearRect(0, 0, o.sutun * 2, o.sira * 2);
    x.fillStyle = '#eef1f5';
    x.fillRect(0, 0, o.sutun * 2, o.sira * 2);
    x.fillStyle = renkler.lacivert;
    o.yerlesen.forEach(function (k) { x.fillRect(k.x * 2, k.y * 2, k.palet.en * 2, k.palet.derinlik * 2); });
    x.strokeStyle = renkler.vurgu;
    x.lineWidth = 2;
    x.strokeRect(1, o.ust * 2 + 1, o.sutun * 2 - 2, PENCERE * 2 - 2);
  }

  function durumYaz(metin) { yazi($('durumMetni'), metin); }

  function sureYaz() {
    var s = Math.max(0, Math.ceil(o.kalan));
    var dk = Math.floor(s / 60), sn = s % 60;
    yazi($('sureDeger'), (dk < 10 ? '0' : '') + dk + ':' + (sn < 10 ? '0' : '') + sn);
  }

  function istatistik() {
    var doluluk = M.dolulukYuzdesi(o.tahta);
    var tonaj = M.toplamTonaj(o.yerlesen);
    var m2 = o.yerlesen.reduce(function (t, k) { return t + k.palet.m2; }, 0);
    yazi($('dolulukDeger'), '%' + tr(doluluk, 1));
    yazi($('tonajDeger'), tr(tonaj, 1) + ' / ' + tr(o.azami, 1) + ' t');
    var oran = Math.min(100, (tonaj / o.azami) * 100);
    var cubuk = $('tonajCubuk');
    cubuk.style.width = oran.toFixed(1) + '%';
    var etiket = $('tonajEtiket');
    cubuk.className = 'olcer-dolgu' + (oran >= 95 ? ' tehlike' : oran >= 85 ? ' uyari' : '');
    etiket.className = 'durum-etiket' + (oran >= 95 ? ' tehlike' : '');
    yazi(etiket, oran >= 95 ? 'Azami yakın' : oran >= 85 ? 'Yüksek' : 'Rahat');
    yazi($('puanDeger'), tr(M.puanHesapla(m2, doluluk)));
    $('k-muhur').disabled = o.yerlesen.length < 3;
    tahtaC.setAttribute('aria-label', 'Konteyner tahtası: ' + o.yerlesen.length + ' palet yüklendi, taban doluluğu yüzde ' + tr(doluluk, 1) + ', tonaj ' + tr(tonaj, 1) + ' ton');
    return { doluluk: doluluk, tonaj: tonaj, m2: m2 };
  }

  function kamera() {
    o.ust = o.sira > PENCERE ? M.kameraUstu(M.enBuyukDoluSira(o.tahta), o.sira, PENCERE) : 0;
    $('tahtaKap').style.borderTopStyle = o.ust > 0 ? 'dashed' : 'solid';
  }

  function kuyrukDoldur() {
    while (o.kuyruk.length < 4) o.kuyruk.push(M.agirlikliSec(A.paletler, Math.random));
  }

  function siradakiAl() {
    kuyrukDoldur();
    var p = o.kuyruk.shift();
    kuyrukDoldur();
    o.aktif = { palet: p, x: Math.max(0, Math.floor((o.sutun - p.en) / 2)) };
    sonGolgeNeden = 'x';
    cizOnizlemeler();
    $('k-atla').classList.remove('vurgu-nabiz');
    var yuklu = M.toplamTonaj(o.yerlesen);
    if (!M.tonajSigarMi(yuklu, p.t, o.azami)) {
      durumYaz('Aks sınırı — bu palet binmez. Atla.');
      $('k-atla').classList.add('vurgu-nabiz');
    } else if (!M.sigabilirMi(o.tahta, p)) {
      durumYaz('Bu palet hiçbir yere sığmıyor — Atla ya da Mühürle.');
      $('k-atla').classList.add('vurgu-nabiz');
    }
  }

  function kaydir(d) {
    if (!oyunAcik()) return;
    var p = o.aktif.palet;
    o.aktif.x = Math.max(0, Math.min(o.sutun - p.en, o.aktif.x + d));
    ciz();
  }
  function xAyarla(x) {
    var p = o.aktif.palet;
    o.aktif.x = Math.max(0, Math.min(o.sutun - p.en, x));
    ciz();
  }
  function dondurAksiyon() {
    if (!oyunAcik()) return;
    o.aktif.palet = M.dondur(o.aktif.palet);
    o.aktif.x = Math.max(0, Math.min(o.sutun - o.aktif.palet.en, o.aktif.x));
    cizOnizlemeler();
    ciz();
  }
  function oyunAcik() { return !!(o && !o.bitti && !o.anim && o.aktif && mevcut === 'e2'); }

  function kaydetPalet(p, x, y) {
    o.kimlikSayac++;
    o.tahta = M.yerlestir(o.tahta, p, x, y, o.kimlikSayac);
    o.yerlesen.push({ kimlik: o.kimlikSayac, palet: p, x: x, y: y, t: p.t });
    kamera();
    var s = istatistik();
    durumYaz(p.ad + ' yüklendi · ' + tr(p.t, 2) + ' t');
    siradakiAl();
    miniCiz();
    ciz();
  }

  function animBitir() {
    if (!o || !o.anim) return;
    var a = o.anim;
    o.anim = null;
    kaydetPalet(a.palet, a.x, a.y);
  }

  function animDongu() {
    if (!o || !o.anim) return;
    var a = o.anim;
    var t = Math.min(1, (performance.now() - a.t0) / a.sure);
    a.simdi = a.bas + (a.y - a.bas) * t * t;
    ciz();
    if (t >= 1) animBitir(); else window.requestAnimationFrame(animDongu);
  }

  function birak() {
    if (!oyunAcik()) return;
    var g = golge();
    if (g.neden === 'sigmaz') { durumYaz('Buraya sığmaz — kaydır ya da döndür.'); return; }
    if (g.neden === 'aks') { durumYaz('Aks sınırı — bu palet binmez. Atla.'); $('k-atla').classList.add('vurgu-nabiz'); return; }
    var p = o.aktif.palet, x = o.aktif.x;
    var bas = o.ust + o.gor - p.derinlik;
    if (azHareket() || bas <= g.y) { kaydetPalet(p, x, g.y); return; }
    o.anim = { palet: p, x: x, y: g.y, bas: bas, simdi: bas, t0: performance.now(), sure: Math.min(260, 60 + (bas - g.y) * 4) };
    window.requestAnimationFrame(animDongu);
  }

  function atla() {
    if (!oyunAcik()) return;
    o.kalan -= A.sure.atlaCezasi;
    sureYaz();
    if (o.kalan <= 0) { muhurle(); return; }
    durumYaz('Atlandı (−' + tr(A.sure.atlaCezasi) + ' sn).');
    siradakiAl();
    ciz();
  }

  function tik() {
    if (!o || o.bitti || mevcut !== 'e2') return;
    var simdi = performance.now();
    var dt = Math.min(simdi - o.sonTik, 1000) / 1000;
    o.sonTik = simdi;
    if (document.hidden) return;
    o.kalan -= dt;
    sureYaz();
    if (o.kalan <= 0) muhurle();
  }

  function oyunBaslat(mod, kAd) {
    var k = A.konteynerler[kAd];
    if (oyunSayac) { window.clearInterval(oyunSayac); oyunSayac = null; }
    var ekBonus = mod === 'hikaye' && durum.bahane ? durum.bahane.bonus || 0 : 0;
    o = {
      mod: mod, kAd: kAd, sira: k.sira, sutun: k.sutun, azami: k.azamiT,
      tahta: M.yeniTahta(k.sira, k.sutun), yerlesen: [], kimlikSayac: 0, kuyruk: [], aktif: null,
      kalan: (mod === 'hikaye' ? A.sure.temel : A.sure.serbest) + ekBonus,
      bitti: false, anim: null, ust: 0, hp: 8, gor: Math.min(k.sira, PENCERE), sonTik: performance.now()
    };
    renkOku();
    git('e2', true);
    yazi($('e2Baslik'), (mod === 'hikaye' ? 'Konteyner yükleme' : 'Serbest yükleme') + ' · ' + kAd);
    yazi($('siraBilgi'), olcuMetin(k));
    yazi($('k-atla'), 'Atla (−' + tr(A.sure.atlaCezasi) + ' sn)');
    durumYaz('Palet kapıdan girer. Kaydır, döndür, bırak.');
    kamera();
    olcekle();
    siradakiAl();
    istatistik();
    sureYaz();
    miniCiz();
    ciz();
    oyunSayac = window.setInterval(tik, 250);
  }

  function konteynerNoUret() {
    return M.konteynerNo(A.konteynerOnek, rnd(1000000)).metin;
  }

  function muhurle() {
    if (!o || o.bitti) return;
    animBitir();
    o.bitti = true;
    if (oyunSayac) { window.clearInterval(oyunSayac); oyunSayac = null; }
    var s = istatistik();
    var sonuc = {
      no: konteynerNoUret(), konteyner: o.kAd, m2: s.m2, doluluk: s.doluluk, tonaj: s.tonaj, azami: o.azami,
      puan: M.puanHesapla(s.m2, s.doluluk), palet: o.yerlesen.length
    };
    if (o.mod === 'hikaye') {
      durum.muhur = sonuc;
      git('e2b', true);
    } else {
      var kayit = { puan: sonuc.puan, konteyner: o.kAd, tarih: new Date().toLocaleDateString('tr-TR') };
      depoYaz(SKOR_ANAHTAR, M.skorEkle(skorlariOku(), kayit, 5));
      git('e2b', true);
    }
    muhurGoster(sonuc, o.mod);
  }

  function muhurGoster(s, mod) {
    yazi($('m-no'), s.no);
    yazi($('m-m2'), tr(s.m2) + ' m²');
    yazi($('m-doluluk'), '%' + tr(s.doluluk, 1));
    yazi($('m-tonaj'), tr(s.tonaj, 1) + ' t');
    yazi($('m-puan'), tr(s.puan));
    var hikaye = mod === 'hikaye';
    $('btn-gumruk').hidden = !hikaye;
    $('btn-tekrar').hidden = hikaye;
    $('btn-teslime').hidden = hikaye;
    yazi($('m-not'), hikaye
      ? tr(s.palet) + ' palet · gümrüğe hazır.'
      : tr(s.palet) + ' palet · ' + s.konteyner + ' · skor kaydedildi.');
  }

  /* ---------- Girdi: tahta, düğmeler, klavye ---------- */
  function kurGirdi() {
    var ptr = null;
    tahtaC.addEventListener('pointerdown', function (e) {
      if (!oyunAcik()) return;
      e.preventDefault();
      tahtaC.setPointerCapture(e.pointerId);
      ptr = { id: e.pointerId, x0: e.clientX, y0: e.clientY, px0: o.aktif.x, t0: performance.now(), hareket: false, dustu: false };
    });
    tahtaC.addEventListener('pointermove', function (e) {
      if (!ptr || e.pointerId !== ptr.id || !oyunAcik()) return;
      var dx = e.clientX - ptr.x0, dy = e.clientY - ptr.y0;
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) ptr.hareket = true;
      if (!ptr.dustu && dy > 36 && dy > Math.abs(dx) * 1.2) { ptr.dustu = true; birak(); return; }
      if (!ptr.dustu && Math.abs(dx) >= Math.abs(dy)) xAyarla(ptr.px0 + Math.round(dx / o.hp));
    });
    function bitir(e) {
      if (!ptr || e.pointerId !== ptr.id) return;
      var p = ptr;
      ptr = null;
      if (e.type === 'pointerup' && !p.hareket && performance.now() - p.t0 < 400) dondurAksiyon();
    }
    tahtaC.addEventListener('pointerup', bitir);
    tahtaC.addEventListener('pointercancel', bitir);

    function basiliTut(dugme, yon) {
      var z1 = null, z2 = null;
      function dur() { window.clearTimeout(z1); window.clearInterval(z2); z1 = null; z2 = null; }
      dugme.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        kaydir(yon);
        dur();
        z1 = window.setTimeout(function () { z2 = window.setInterval(function () { kaydir(yon); }, 70); }, 350);
      });
      ['pointerup', 'pointercancel', 'pointerleave', 'blur'].forEach(function (ad) { dugme.addEventListener(ad, dur); });
      dugme.addEventListener('click', function (e) { if (e.detail === 0) kaydir(yon); });
      dugme.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    }
    basiliTut($('k-sol'), -1);
    basiliTut($('k-sag'), 1);
    $('k-dondur').addEventListener('click', dondurAksiyon);
    $('k-birak').addEventListener('click', birak);
    $('k-atla').addEventListener('click', atla);
    $('k-muhur').addEventListener('click', function () { if (o && !o.bitti && o.yerlesen.length >= 3) muhurle(); });

    document.addEventListener('keydown', function (e) {
      if (mevcut !== 'e2' || !oyunAcik() || $('onay').open) return;
      var hedefDugme = e.target && e.target.tagName === 'BUTTON';
      if (e.key === 'ArrowLeft') { kaydir(-1); e.preventDefault(); }
      else if (e.key === 'ArrowRight') { kaydir(1); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { dondurAksiyon(); e.preventDefault(); }
      else if (e.key === 'ArrowDown') { birak(); e.preventDefault(); }
      else if (e.key === ' ' && !hedefDugme) { dondurAksiyon(); e.preventDefault(); }
    });

    window.addEventListener('resize', function () { if (mevcut === 'e2' && o) olcekle(); });
    document.addEventListener('visibilitychange', function () { if (o) o.sonTik = performance.now(); });
  }

  /* ---------- E3 takip ---------- */
  var taraniyor = false;

  function takipCiz(odakli) {
    var L = A.dilekler;
    var zaman = $('zaman');
    zaman.replaceChildren();
    yazi($('taramaSayac'), durum.takip + '/' + L.length);
    $('takipBos').hidden = L.length > 0;
    $('takipEylem').hidden = !(L.length === 0 || durum.takip >= L.length);
    if (odakli === 'bitti') $('btn-teslimGit').focus({ preventScroll: true });
    var odakKart = null;
    L.forEach(function (d, i) {
      var tarandi = i < durum.takip, acik = i === durum.takip;
      var li = yap('li', tarandi ? 'tarandi' : acik ? 'acik' : 'kilitli');
      li.appendChild(yap('div', 'durak-ad', d.durak));
      li.appendChild(yap('div', 'durak-durum', tarandi ? 'Tarandı' : acik ? 'Sıradaki durak' : 'Kilitli'));
      if (tarandi) {
        var kart = yap('div', 'dilek-kart');
        kart.appendChild(yap('div', 'kisi', d.kisi));
        kart.appendChild(yap('div', 'mesaj-metin', d.mesaj));
        if (i === durum.takip - 1 && odakli) { kart.tabIndex = -1; kart.setAttribute('role', 'status'); odakKart = kart; }
        li.appendChild(kart);
      } else if (acik) {
        var alan = yap('div', 'barkod-alan');
        var bk = yap('div', 'barkod');
        bk.setAttribute('aria-hidden', 'true');
        var dugme = yap('button', 'btn ana', 'Barkodu tara');
        dugme.type = 'button';
        dugme.setAttribute('aria-label', 'Barkodu tara: ' + d.durak);
        dugme.addEventListener('click', function () {
          if (taraniyor) return;
          taraniyor = true;
          dugme.disabled = true;
          bk.classList.add('taraniyor');
          window.setTimeout(function () {
            taraniyor = false;
            durum.takip = Math.min(L.length, durum.takip + 1);
            kaydet();
            takipCiz(durum.takip >= L.length ? 'bitti' : 'kart');
          }, azHareket() ? 0 : 1000);
        });
        alan.appendChild(bk);
        alan.appendChild(dugme);
        li.appendChild(alan);
      }
      zaman.appendChild(li);
    });
    if (odakKart && odakli !== 'bitti') odakKart.focus({ preventScroll: false });
  }

  /* ---------- E4 teslim ---------- */
  function konfetiBaslat() {
    if (azHareket()) return;
    var c = $('konfeti');
    var dpr = window.devicePixelRatio || 1;
    var W = window.innerWidth, H = window.innerHeight;
    c.width = Math.round(W * dpr);
    c.height = Math.round(H * dpr);
    var x = c.getContext('2d');
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.classList.add('acik');
    var tonlar = [renkler.vurgu || '#f2a33a', renkler.lacivert || '#0f2747', '#7fb3e6', '#f2c97d', '#8fcf9c', '#e8a5b0'];
    var parca = [];
    for (var i = 0; i < 140; i++) {
      parca.push({
        x: Math.random() * W, y: -20 - Math.random() * H * 0.5, vx: (Math.random() - 0.5) * 2.2, vy: 2 + Math.random() * 3.2,
        r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, w: 6 + Math.random() * 6, h: 4 + Math.random() * 5, renk: tonlar[rnd(tonlar.length)]
      });
    }
    var t0 = performance.now();
    (function kare(now) {
      var gecen = now - t0;
      x.clearRect(0, 0, W, H);
      if (gecen >= 3000) { c.classList.remove('acik'); return; }
      x.globalAlpha = gecen > 2400 ? Math.max(0, 1 - (gecen - 2400) / 600) : 1;
      parca.forEach(function (p) {
        p.x += p.vx; p.y += p.vy; p.r += p.vr;
        x.save();
        x.translate(p.x, p.y);
        x.rotate(p.r);
        x.fillStyle = p.renk;
        x.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        x.restore();
      });
      window.requestAnimationFrame(kare);
    })(t0);
  }

  function teslimKur(konfeti) {
    yazi($('t-ad'), A.alici.ad);
    yazi($('t-no'), A.sevkiyatNo);
    yazi($('t-alici'), alici().trim());
    yazi($('t-gonderen'), A.gonderen || '');
    yazi($('t-tarih'), A.tarihMetni);
    yazi($('t-imza'), alici().trim());
    yazi($('t-not'), A.belgeNotu || '');
    $('t-kont-satir').hidden = !durum.muhur;
    if (durum.muhur) yazi($('t-kont'), durum.muhur.no + ' (' + durum.muhur.konteyner + ')');
    var liste = $('t-dilekler');
    liste.replaceChildren();
    if (!A.dilekler.length) liste.appendChild(yap('li', '', 'Dilek listesi boş (app/ayar.js).'));
    A.dilekler.forEach(function (d) {
      var li = yap('li');
      li.appendChild(yap('span', 'kisi', d.kisi + ': '));
      li.appendChild(document.createTextNode(d.mesaj));
      liste.appendChild(li);
    });
    if (konfeti) konfetiBaslat();
  }

  /* ---------- Serbest mod ---------- */
  function serbestKur() {
    yazi($('serSure'), tr(A.sure.serbest));
    var sec = $('konteynerSecim');
    sec.replaceChildren();
    Object.keys(A.konteynerler).forEach(function (ad) {
      var k = A.konteynerler[ad];
      var d = yap('button', 'btn ikinci');
      d.type = 'button';
      d.appendChild(yap('span', '', ad));
      d.appendChild(yap('small', '', olcuMetin(k)));
      d.setAttribute('aria-label', ad + ' konteyner, ' + olcuMetin(k));
      d.addEventListener('click', function () { oyunBaslat('serbest', ad); });
      sec.appendChild(d);
    });
    var sk = skorlariOku();
    var l = $('skorListe');
    l.replaceChildren();
    $('skorBos').hidden = sk.length > 0;
    sk.forEach(function (k) {
      var li = yap('li');
      li.appendChild(yap('span', '', k.konteyner + ' · ' + (k.tarih || '')));
      li.appendChild(yap('span', 'puan sayi', tr(k.puan)));
      l.appendChild(li);
    });
  }

  /* ---------- Başlatma ---------- */
  function ekranAc(ad, odak) {
    if (ad === 'e0') { e0Kur(); git('e0', odak); }
    else if (ad === 'e1') { git('e1', odak); e1Kur(); }
    else if (ad === 'e2') { oyunBaslat('hikaye', "20'"); }
    else if (ad === 'e2b') {
      if (!durum.muhur) { ekranAc('e1', odak); return; }
      git('e2b', odak);
      muhurGoster(durum.muhur, 'hikaye');
    }
    else if (ad === 'e3') { git('e3', odak); takipCiz(false); }
    else if (ad === 'e4') { teslimKur(!!odak); git('e4', odak); }
    else if (ad === 'ser') { serbestKur(); git('ser', odak); }
    else { e0Kur(); git('e0', odak); }
  }

  function baglaDugmeler() {
    $('btn-basla').addEventListener('click', function () {
      var devam = durum.ekran !== 'e0';
      var basla = function () { sifirla(); ekranAc('e1', true); };
      if (devam) {
        onay('Kayıtlı ilerleme silinecek ve sevkiyat baştan başlayacak. Emin misiniz?').then(function (ok) { if (ok) basla(); });
      } else basla();
    });
    $('btn-devam').addEventListener('click', function () { ekranAc(durum.ekran, true); });
    $('btn-cevir').addEventListener('click', cevir);
    $('btn-mail').addEventListener('click', mailKopyala);
    $('btn-yukle').addEventListener('click', function () { ekranAc('e2', true); });
    $('btn-gumruk').addEventListener('click', function () { ekranAc('e3', true); });
    $('btn-teslimGit').addEventListener('click', function () { ekranAc('e4', true); });
    $('btn-serbest').addEventListener('click', function () { ekranAc('ser', true); });
    $('btn-yazdir').addEventListener('click', function () { window.print(); });
    $('btn-bastan').addEventListener('click', function () {
      onay('İlerleme sıfırlanacak ve oyun baştan başlayacak. Emin misiniz? (En iyi skorlar kalır.)').then(function (ok) {
        if (ok) { sifirla(); ekranAc('e0', true); }
      });
    });
    $('btn-serGeri').addEventListener('click', function () { ekranAc('e4', true); });
    $('btn-tekrar').addEventListener('click', function () { ekranAc('ser', true); });
    $('btn-teslime').addEventListener('click', function () { ekranAc('e4', true); });
  }

  function baslat() {
    var sorunlar = ayarKontrol();
    if (sorunlar.length) {
      if (A && A.sevkiyatNo) yazi($('sevNo'), A.sevkiyatNo);
      hataGoster('Ayar sorunu: ' + sorunlar.join(' '));
      return;
    }
    yazi($('sevNo'), A.sevkiyatNo);
    tahtaC = $('tahta');
    miniC = $('mini');
    kurGirdi();
    baglaDugmeler();
    var ad = durum.ekran;
    if (!KALICI[ad]) ad = 'e0';
    ekranAc(ad, false);
  }

  baslat();
})();
