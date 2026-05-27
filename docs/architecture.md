# Proje Yapisi

Bu proje sunucu gerektirmeden `index.html` uzerinden calismaya devam eder.
Gelistirme kaynaklari `src/` altindadir; tarayicinin calistirdigi dosya `assets/js/app.js` olarak derlenir.

## Katmanlar

- `index.html`: Statik uygulama kabugu ve CDN baglantilari.
- `assets/css/tailwind.css`: Derlenmis Tailwind cikisi.
- `assets/css/styles.css`: Ortak gorunum, erisilebilirlik ve responsive duzeltmeler.
- `assets/vendor/`: Sunucu gerektirmeyen kullanim icin yerel React UMD dosyalari.
- `tailwind.config.cjs`: Tailwind tema tokenlari ve kaynak tarama ayarlari.

### Kaynak Kodu Klasorleri

```
src/
  app.jsx              -> Ana App bileseni (devre yonlendirme, kilit ekrani, state)
  core/
    app-core.js        -> Ortak ayarlar, VEHICLE_TYPES, plaka/para yardimcilari
    db.js              -> localStorage CRUD, DB_KEYS, seed fonksiyonu, generateUUID
    seed.js            -> Varsayilan admin, hizmet ve urun verileri
    icons.jsx          -> Tum SVG ikonlar (Icons nesnesi)
  ui/
    AppLogo.jsx        -> Uygulama logosu
    NavButton.jsx      -> Yan menü butonu
    PageHeader.jsx     -> Sayfa basligi (title + description + actions)
    ConfirmModal.jsx   -> Onay diyalogu (native confirm() yerine)
    LockScreen.jsx     -> PIN kilit ekrani
    PinGateModal.jsx   -> PIN dogrulama modali (hassas islemler icin)
    NotificationBadge.jsx -> Bildirim cubugu
    FinanceChart.jsx   -> Kasa analizi SVG grafigi
  tabs/
    DashboardTab.jsx   -> Kontor Paneli
    SalesTab.jsx       -> Hizmet / Satis Girisi
    AppointmentsTab.jsx -> Randevular
    CustomersTab.jsx   -> Musteri Portfoyu (CRM)
    ServicesTab.jsx    -> Hizmet Katalogu
    ProductsTab.jsx    -> Stok & Market
    FinanceTab.jsx     -> Kasa & Giderler
    CampaignsTab.jsx   -> Kampanyalar
    BackupTab.jsx      -> Sistem & Yedekleme
```

## Derleme

`src/` altinda bir degisiklik yapildiktan sonra:

```powershell
npm run build
```

esbuild tum import'lari takip ederek tek bir `assets/js/app.js` dosyasi uretir.

## Buyume Notlari

- Yeni ekranlar `src/tabs/` altina eklenebilir ve `app.jsx`'deki routing'e eklenebilir.
- Tekrarlanan UI parcasi `src/ui/` altina alinmalidir.
- Veri semasi degisirse yedek JSON import/export akisi geriye uyumlu tutulmalidir.
- Sunucusuz kullanim korunacaksa `assets/js/app.js` her kaynak degisikliginden sonra yeniden derlenmelidir.


## Bagimlilik Grafi (madge)

`madge` ile `src/` altindaki modul grafini analiz edebilirsiniz. Komutlar:

```powershell
npm run graph            # Konsola modul -> import edilenler tablosu
npm run graph:circular   # Dairesel bagimlilik var mi?
npm run graph:orphans    # Hicbir yerden import edilmeyen dosyalar
npm run graph:html       # docs/dependency-graph.html (interaktif, offline)
npm run graph:report     # JSON + ozet metin + HTML hepsini birden uretir
```

Uretilen dosyalar:

- `.codegraph/dependency-graph.json` - Her modulun import ettigi dosyalarin tam haritasi.
- `.codegraph/dependency-summary.txt` - Her modulun kac dosya tarafindan import edildigi.
- `.codegraph/dependency-graph.html` - Tarayicida cift tiklayip acabileceginiz interaktif gorsel.
  Dugume tikladiginizda import zinciri vurgulanir; sol kenar cubugundan modul listesi.

Not: `.codegraph/` klasoru `.gitignore` icindedir. Raporlar yerel cache'tir, commit edilmez;
her gelistirici `npm run graph:report` ile kendi makinesinde uretir.

Mevcut durum:
- Dairesel bagimlilik yok.
- Tek "yetim" modul `app.jsx` (bundle giris noktasi - normal).
- En cok kullanilan utility'ler: `core/icons.jsx`, `core/app-core.js`, `ui/PageHeader.jsx`.

## Tasarim Sistemi

Tasarim yonu: **refined automotive operations console**. Endustriyel ama lukstur;
gece servisi atmosferi, soft brand-bloom ve parlatilmis hairline kenarlar.
Ozellikle plaka, tutar ve PIN gibi sayisal alanlar mono ile vurgulanir.

### Tipografi

| Rol            | Font                                     | Kullanim                           |
| -------------- | ---------------------------------------- | ---------------------------------- |
| Display        | `Bricolage Grotesque` (500..800)         | `<h1>`, `<h2>`, `<h3>`, KPI degerleri |
| Body           | `Plus Jakarta Sans` (300..800)           | `<body>` ve metinler               |
| Mono / Numerik | `JetBrains Mono` (500..700)              | Plaka, tutar, PIN, telefon, tarih  |

Yardimci siniflar:

- `.font-mono-num` -> mono numerik (tabular-num + lining figures).
- `.kpi-value` -> Bricolage agirligi + tabular-num + sikilastirilmis tracking.
- `.plate-chip` -> Markaya uygun plaka rozeti (ic gradyan + brand cerceve).
- `.surface-card` -> Hairline ust highlight + yumusak govde golgesi.
- `.kpi-card` -> Sag-ust kosede yumusak brand bloom (radial-gradient pseudo).
- `.modal-backdrop` -> Cam gibi blur + saturate edilmis modal arka plani.

### Renkler

Tailwind tema tokenlari `tailwind.config.cjs` icinde sabittir. Onemli olanlar:

- `brand.50..950` -> Cyan ailesi (ana marka). 400-500 vurgu, 600 buton.
- `darkBg.deep`   -> `#0a0f14` (en derin yuzey, body backdrop).
- `darkBg.card`   -> `#101820` (kart yuzeyi, sheen ile katmanli).
- `darkBg.border` -> `#1f2a33` (hairline cerceve).
- `darkBg.hover`  -> `#172430` (hover yuzeyi).
- `accent.amber`  -> uyari, `accent.emerald` -> gelir, `accent.rose` -> gider.

### Atmosfer

`assets/css/styles.css` body uzerinde sabit (fixed) bir katmanli arka plan kurar:

1. Sol-ust kose: `radial-gradient` ile 10% opasiteli cyan bulutsu.
2. Sag-alt kose: 6% opasiteli emerald karsi-bulutsu.
3. Tum yuzey: 32px x 32px ince muhendislik gridi (~2% beyaz).

`prefers-reduced-motion` etkinse tum animasyonlar 0.01ms'e dusurulur.

### Bilesen Notlari

- `AppLogo` -> Gradyan badge + sheen + brand glow. Wordmark display fontunda.
- `NavButton` -> Sol "rail" gostergesi + brand glow nokta. Aktif durum
  gradyan ile vurgulanir, hover hairline gosterir.
- `PageHeader` -> Display baslik + brand kicker etiketi + 56px alt vurgu cizgisi.
- `NotificationBadge` -> Sol renk rayi + ikon nisi + uppercase rol etiketi.
- `ConfirmModal`, `PinGateModal` -> Sol renk rayi (amber/brand) + cam backdrop.
- `LockScreen` -> Tum ekran modal-backdrop + dekoratif grid + sayisal tuslar
  mono font ile. Klavye kisayollari (0-9, Backspace, Esc, Enter) korunur.
- `FinanceChart` -> Coklu durakli gradyan barlar + zemin yatay grid.
  Hassas mod aktifken yukseklikler esitlenir; tutarlar `font-mono-num` + blur ile gizlenir.
- `DashboardTab` KPI tile'lari `kpi-card` + `kpi-value` ile yenilendi.

### Erisilebilirlik

- `:focus-visible` brand renginde 2px outline + 4px halka (`box-shadow`).
- Tum modallarda `role="dialog"` ve `aria-modal="true"` korundu.
- Lock ekrani arka plan icerikten focus kacisini engelleyen tab-trap'a sahiptir.
- Renk kontrastlari: brand-300 / emerald-300 / rose-300 / amber-300 koyu zemin
  uzerinde WCAG AA gereksinimini karsilar; hassas tutarlar blur + select-none
  ile bilgisel olarak da maskelenir.

### Yeni Ekran Eklerken

1. `tabs/` altinda tab dosyasini olustur, ust kismini `<PageHeader />` ile cer.
2. KPI tile'lari icin `surface-card kpi-card` + `kpi-value` siniflarini kullan.
3. Plaka gosteriminde `<span className="plate-chip">{plate}</span>`.
4. Tutar / sayisal alanlarda `font-mono-num` veya `kpi-value` siniflari.
5. Tema tokenlari (`brand-*`, `darkBg-*`) disinda renk hardcode etme.

