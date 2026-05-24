# Oto Yikama Pro

Sunucu gerektirmeyen, tarayicida dogrudan acilabilen yerel oto yikama yonetim paneli.

## Calistirma

`index.html` dosyasini tarayicida acmaniz yeterlidir. Veri tarayicinin `localStorage` alaninda saklanir.

## Dosya Yapisi

- `index.html`: Sayfa kabugu ve CDN baglantilari.
- `assets/css/tailwind.css`: Derlenmis Tailwind arayuz siniflari.
- `assets/css/styles.css`: Uygulamaya ozel stiller.
- `assets/vendor/`: React ve ReactDOM yerel tarayici kutuphaneleri.
- `src/app.jsx`: Ana React bileseni (devre yonlendirme, state yonetimi).
- `src/core/`: Veri katmani, yardimci fonksiyonlar, ikonlar.
- `src/ui/`: Tekrar kullanilabilir arayuz bilesenleri.
- `src/tabs/`: Her sekme icin ayri bilesen dosyalari.
- `tailwind.config.cjs`: Tailwind tema ve icerik tarama ayarlari.

## Kaynaktan Derleme

`src/` altinda degisiklik yapildiktan sonra:

```powershell
npm ci
npm run build
```

Daha fazla mimari not icin `docs/architecture.md` dosyasina bakabilirsiniz.
