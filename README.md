# Zehedisode Oto Yıkama

Sunucu gerektirmeyen, tarayıcıda doğrudan açılabilen yerel oto yıkama yönetim ve CRM paneli.

## Çalıştırma

`index.html` dosyasını tarayıcıda açmanız yeterlidir. Veriler tarayıcının `localStorage` alanında saklanır. Service worker sayesinde ilk açılıştan sonra çevrimdışı çalışır ve "Ana ekrana ekle" ile uygulama olarak kurulabilir.

## Yayınlama (GitHub Pages)

Bu repo statik bir sitedir. GitHub Pages ile yayınlamak için:

1. Bu repo zaten `master` dalında derlenmiş `index.html` ve `assets/` içerir.
2. GitHub'da repo → **Settings → Pages** → **Source: Deploy from a branch** → **Branch: master / (root)**.
3. Birkaç dakika içinde `https://zehedisode.github.io/oto-yikama-web/` adresinde yayında olur.

## Dosya Yapısı

- `index.html`: Sayfa kabuğu, manifest ve service worker kaydı.
- `manifest.webmanifest` + `assets/icons/icon.svg`: PWA / "Ana ekrana ekle" desteği.
- `service-worker.js`: Çevrimdışı önbellek.
- `assets/css/tailwind.css`: Derlenmiş Tailwind sınıfları.
- `assets/css/styles.css`: Uygulama stilleri.
- `assets/vendor/`: React ve ReactDOM yerel kopyaları.
- `assets/js/app.js`: Derlenmiş uygulama bundle'ı (esbuild + minify).
- `src/app.jsx`: Ana React bileşeni, yönlendirme, state yönetimi.
- `src/core/`: Veri katmanı (`db.js`), yardımcı fonksiyonlar (`app-core.js`), ikonlar, güvenlik.
- `src/ui/`: Tekrar kullanılabilir bileşenler (Modal, Header, Logo vb.).
- `src/tabs/`: Sekme bileşenleri (Dashboard, Sales, Campaigns, Backup vb.).
- `tailwind.config.cjs`: Tailwind tema ve içerik tarama ayarları.

## Kaynaktan Derleme

`src/` altında değişiklik yapıldıktan sonra:

```powershell
npm ci
npm run build
```

Daha hızlı geri-bildirim için: `npm run build:fast` (graph raporu çalıştırmaz).

Mimari notlar için `docs/architecture.md` dosyasına bakın.

## Veri Güvenliği

- Tüm veri tarayıcının `localStorage`'ında. Tarayıcı temizliği veya farklı cihaz/profil = veri kaybı.
- Sistem & Yedekleme sekmesinden günde bir kez JSON yedeği indirin. Kontrol Paneli, son yedeklemenin üzerinden 7 gün geçmişse uyarı gösterir.
- Hassas işlemler PIN ile korunur. PIN kodu Sistem & Yedekleme sekmesinden değiştirilebilir.
