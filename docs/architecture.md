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
