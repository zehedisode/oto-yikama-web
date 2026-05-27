---
inclusion: always
---

# Deploy / Push Kuralı

Bu repo GitHub Pages ile yayınlanıyor ve **`master`** branch'inden serve ediliyor.
Geliştirme `main` branch'inde yapılıyor.

Push ederken her zaman ikisini birden güncelle:

```
git push origin main
git push origin main:master
```

Yalnızca `main`'e push edilirse canlı site (https://zehedisode.github.io/oto-yikama-web/) güncellenmez.
