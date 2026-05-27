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

### Ortak UI Primitifleri

Tab'larda kopyala-yapistir className zincirleri yerine asagidaki bilesenler kullanilir:

| Bilesen / Sinif         | Yeri                            | Amac                                                  |
| ----------------------- | ------------------------------- | ----------------------------------------------------- |
| `<Modal />`             | `src/ui/Modal.jsx`              | Cam backdrop, sol renk rayi, sticky footer            |
| `<StatTile />`          | `src/ui/StatTile.jsx`           | KPI tile (label / value / sub / icon / accent)        |
| `<PageHeader />`        | `src/ui/PageHeader.jsx`         | Display baslik + brand kicker + brand alt vurgu       |
| `<NavButton />`         | `src/ui/NavButton.jsx`          | Sidebar navigasyonu, sol rail + glow                  |
| `<NotificationBadge />` | `src/ui/NotificationBadge.jsx`  | Sag-ust toast (success / warning / error)             |
| `.field`, `.field-label`| `assets/css/styles.css`         | Form alani + ust etiket (uppercase kicker)            |
| `.btn` + variantlar     | `assets/css/styles.css`         | `btn-primary`, `btn-success`, `btn-danger`, `btn-ghost`, `btn-soft`, `btn-icon` |
| `.data-table`           | `assets/css/styles.css`         | Hairline tablolar + sticky header + hover satir       |
| `.segment`              | `assets/css/styles.css`         | Pill-button group (filtre/segment kontrolu)           |
| `.pill-*`               | `assets/css/styles.css`         | Status pill'leri (`brand`/`emerald`/`amber`/`rose`/`neutral`) |
| `.surface-card`         | `assets/css/styles.css`         | Hairline kart yuzeyi + ust sheen                      |
| `.kpi-card`, `.kpi-value`| `assets/css/styles.css`        | KPI bloomlu tile + display agirligi sayilar           |
| `.plate-chip`           | `assets/css/styles.css`         | Plaka rozeti (mono + brand cerceve)                   |
| `.font-mono-num`        | `assets/css/styles.css`         | Tabular-num mono sayilar (tutar / telefon / tarih)    |
| `.modal-backdrop`       | `assets/css/styles.css`         | Cam blur + radial bloom backdrop                      |

### Tipografi

| Rol            | Font                                     | Kullanim                           |
| -------------- | ---------------------------------------- | ---------------------------------- |
| Display        | `Bricolage Grotesque` (500..800)         | `<h1>`, `<h2>`, `<h3>`, KPI degerleri |
| Body           | `Plus Jakarta Sans` (300..800)           | `<body>` ve metinler               |
| Mono / Numerik | `JetBrains Mono` (500..700)              | Plaka, tutar, PIN, telefon, tarih  |

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

### Yeni Ekran Eklerken

1. `tabs/` altinda dosyayi olustur, ust kismi `<PageHeader />` ile cer.
2. KPI'lar icin `<StatTile />` kullan; ozel kart gerekirse `surface-card kpi-card` siniflarini elle ekle.
3. Form alanlarinda her zaman `.field` + `.field-label` (uppercase kicker).
4. Buton stilini `.btn` + variant ile uygula; yan yana isim ikon kombinasyonlari icin gap-2 yeterli.
5. Tablolarda `.data-table`; status icin `.pill-*` ve `.status-dot-*`.
6. Modallar icin daima `<Modal />` kullan; sol rayda dogru `accent` (brand/emerald/amber/rose) sec.
7. Plaka -> `<span className="plate-chip">{plate}</span>`. Tutar / sayilar -> `font-mono-num` veya `kpi-value`.
8. Tema tokenlari (`brand-*`, `darkBg-*`) disinda renk hardcode etme.

### Erisilebilirlik

- `:focus-visible` brand renginde 2px outline + 4px halka (`box-shadow`).
- Tum modallarda `role="dialog"` ve `aria-modal="true"` korundu.
- Lock ekrani arka plan icerikten focus kacisini engelleyen tab-trap'a sahiptir.

