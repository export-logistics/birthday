# Doğum Günü Sevkiyatı

Doğum günü hediyesi: telefonda açılan, kurulumsuz, bağımlılıksız mini oyun: çark, 10' konteyner yükleme, 4 duraklı gönderi takip, teslim. Alıcı adı açılış kartında değiştirilir (varsayılan `AYAR.alici.ad` = "Şeyma"; bağlantıya `?ad=…` eklenerek de verilir, cihazda saklanır).

## Açmak

```
cd ~/atolye/araclar/dogum-gunu-sevkiyati/app
python3 -m http.server 8080
```

Sonra tarayıcıda `http://localhost:8080`. Telefondan denemek için aynı Wi-Fi'da `http://<Mac-IP>:8080`. `index.html` dosyasına çift tıklayıp doğrudan da açılır (dış istek yok).

## Testler

```
cd ~/atolye/araclar/dogum-gunu-sevkiyati
node --test tests/motor.test.js
```

Not: Node 22+ sürümünde `node --test tests/` klasörü modül sanıp hata verir; dosya adıyla ya da `node --test` (otomatik bulma) kullanın.

## AYAR (app/ayar.js)

Elle dolduracağın tek yer. Yaş/doğum yılı yazma.

- `dilekler`: DILEKLER.md ile aynı kısa metinler (4 durak; 4 yedek durak yorum satırında). Sayı serbest (4–10); her kayıt `durak`, `kisi`, `mesaj`; `mesaj` içindeki `{ad}` seçilen ada dönüşür.
- `belgeNotu`: teslim tesellüm belgesinin alt notu.
- `bahaneler`: hâlâ YER TUTUCU (8 adet). `inandiricilik` 1–5 tam sayı; bonus süre = inandırıcılık × `sure.bonusCarpan`. En az 3 bahane gerekir, yoksa çark atlanır.
- `paletler`: Akgün'ün 6 ana ebadı (60×120N Neo Calacatta Silver, 30×60 Calacatta Grey, 61×61 Rafael White, 60×60 Arya Light Grey, 45×45 Calacatta Weiss, 60×60×20 Durastone 2 cm); `m2` = m²/palet (Akgün üretim kaydı ortalaması), `t` yaklaşık.
- `konteynerler`, `hikayeKonteyner`, `sure`: boyutlar 10 cm hücre; `en` yan yana, `derinlik` sıra yönü. Hikâye 10' konteynerde oynanır (28 × 23 hücre, 9 t); serbest modda 10' · 20' · 40'HC · Tır.
- `konteynerOnek`: konteyner numarası sahip kodu (4 harf).
- Eksik/hatalı ayar varsa oyun açılışta nedenini ekranda yazar.

## Davranış notları

- Sayfa yenilenince ekran ve ilerleme (bahane, tarama sayısı, mühür) korunur; yükleme oyunu yarım kaldıysa baştan başlar (bonus süre kalır).
- Durum `localStorage`'dadır; kullanılamazsa oyun çalışır ve açılış ekranında uyarı çıkar.
- Telefon düzeni 360 px ve üstü için ayarlıdır; hücre boyutu ekrana göre hesaplanır (en çok 8 px).
- Yazdırma: teslim ekranında "Belgeyi yazdır" ya da tarayıcının yazdır komutu yalnız belgeyi basar.

## Yayın

- Adres: `https://export-logistics.github.io/birthday/` (GitHub Pages proje sayfası, alt dizin; depo `export-logistics/birthday`).
- Yalnız `app/` klasörü yayınlanır; `tests/`, `BRIF.md`, `DILEKLER.md` yayına girmez.
- Tüm bağlantılar göreli (baştaki `/` yok), alt dizinde çalışır. `manifest.webmanifest` ve `favicon.svg` vardır; service worker yoktur.
- Yayın yalnız Aslan "yayınla" deyince yapılır; bu işin kapsamında değildir.

## Değişiklikler

- 11.11.2026 akşam (Aslan): paletler Akgün ürünleri oldu; içerik satırı "1 × 10' · 5 palet 60×120N Neo Calacatta Silver · 1 palet iyi dilek"; alıcı adı açılışta "Şeyma" ve değiştirilebilir; hikâye konteyneri 10' (kısa oyun); takip 4 durak.
