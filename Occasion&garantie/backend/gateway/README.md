# Passerelle SMS auto-hebergee (Android + SIM marocaine)

Kola SMS li kaysefto l-site kaydkhol f file d'attente f MySQL, w tel Android
kay-polli l-serveur kol 5 secondes w kaysefto b SIM dyalo. **Zero API payante,
zero IP publique, auto-heberge.**

## 1. Materiel

- Tel Android qdim (5.0+) + chargeur
- Carte SIM marocaine m3a **pack SMS** (IAM / Orange / inwi)
- WiFi wla 4G dyal l-tel

## 2. Apps (men **F-Droid** machi Play Store)

1. **Termux** — https://f-droid.org/packages/com.termux/
2. **Termux:API** — https://f-droid.org/packages/com.termux.api/
3. **Termux:Boot** (l démarrage automatique) — https://f-droid.org/packages/com.termux.boot/

Moraha:
- 7el **Termux:API** w 3tiha permission **SMS** + **Telephone**
- Désactivi **optimisation de batterie** l Termux + Termux:API + Termux:Boot
- 7el **Termux:Boot** mera wa7da (bach yt-activa)

## 3. Installation f Termux

```bash
pkg update -y && pkg upgrade -y
pkg install -y jq termux-api curl
mkdir -p ~/.termux/boot
```

Sawb l-fichier:

```bash
nano ~/gateway.sh
```

Kopï l-contenu dyal `gateway.sh` (f nafs had dossier), moraha bddel:

```bash
GATEWAY_KEY="<l-cle-li-ghat3tik>"
API_URL="https://occasionetgarantie.store/api/sms-gateway"
```

Sauvegarder (`Ctrl+O`, `Enter`, `Ctrl+X`) w:

```bash
chmod +x ~/gateway.sh
bash ~/gateway.sh
```

Ila ban `{"ok":true,...}` → kolchi mzyan.

## 4. Démarrage automatique m3a l-tel

```bash
cp ~/gateway.sh ~/.termux/boot/start-gateway.sh
chmod +x ~/.termux/boot/start-gateway.sh
```

Mor reboot dyal l-tel, l-script kaytla3 bo7do.

## 5. Test men l-site

Admin → `GET /api/admin/sms/queue` kay3tik l-état (pending / sent / failed + dernier device).
Wla `POST /api/admin/sms/test` b `{ "phone": "0669017295", "message": "Test" }`.

## Notes

- L-message kaywsal f **5–15 seconde** (polling).
- Ila l-tel ma-connectich, l-serveur kayt3ref w kayrje3 l-email automatiquement
  (inscription + reset password).
- Retry: 3 tentatives, moraha `failed` (kayban f admin).
- Historique kaytmsa7 mor 7 iyam.
- **Ma t7tajch** port forwarding wla IP fixe.
