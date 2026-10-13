# 👑 Fly Bird - Royal Flight

Joc arcade Flappy Bird cu tematică regală, realizat 100% în HTML5, Vanilla CSS și JavaScript. Optimizat complet pentru ecrane tactile de telefon (iOS & Android) și desktop.

---

## 📱 Cum îl încarci pe GitHub și joci pe telefon (GitHub Pages)

### Pasul 1: Încarcă fișierele pe GitHub
1. Mergi pe [github.com](https://github.com/) și creează un depozit nou (de exemplu `fly-bird`), selectat ca **Public**.
2. Încarcă fișierele din acest folder:
   - `index.html` (esențial pentru GitHub Pages)
   - `gamefly.html`
   - `style.css`
   - `game.js`
   - `README.md`

*(Sau folosește Git din terminal:)*
```bash
git init
git add .
git commit -m "Fly Bird Royal Flight release"
git branch -M main
git remote add origin https://github.com/<UTILIZATORUL_TAU>/fly-bird.git
git push -u origin main
```

---

### Pasul 2: Activează GitHub Pages (Gratuit)
1. În depozitul tău pe GitHub, apasă pe tab-ul **Settings** (sus în dreapta).
2. În meniul din stânga, apasă pe **Pages**.
3. La secțiunea **Build and deployment**:
   - Source: **Deploy from a branch**
   - Branch: alege **`main`** și folderul **`/ (root)`**.
4. Apasă pe **Save**.

După 1-2 minute, vei primi link-ul tău live oficial:
👉 `https://<UTILIZATORUL_TAU>.github.io/fly-bird/`

Deschide link-ul pe telefon în **Safari** sau **Chrome** și bucură-te de joc cu touch! Poți chiar apăsa pe *„Adaugă pe ecranul principal”* (Add to Home Screen) pentru a juca fullscreen ca o aplicație nativă!

---

## 🎮 Caracteristici & Niveluri
- **☀️ Regatul Zilei (0-9 puncte)**: Cer însorit, soare radiant, dealuri de smarald și castele.
- **🌅 Nivel 2: Apus Regal (10-24 puncte)**: Tranziție lină la 10 puncte cu fanfară, cer amurg violet/auriu și licurici.
- **🌙 Nivel 3: Noapte Regală (25+ puncte)**: Cer cosmic, semilună strălucitoare, constelații, stele căzătoare și ferestre luminate.
- **👑 Pasărea Regală**: Grafică vectorială detaliată (ochi expresivi Pixar, coroană aurie cu rubine sclipitoare, pelerină fluturândă cu blană de hermină, dâră de steluțe aurii).
- **🔊 Sunete Autonome (Web Audio API)**: Zero fișiere audio externe, fără erori de rețea.
