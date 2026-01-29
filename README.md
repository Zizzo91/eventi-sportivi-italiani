# 🏆 Eventi Sportivi Italiani

Un'applicazione web moderna e leggera per tracciare e visualizzare gli eventi sportivi più rilevanti per i tifosi italiani.

![Screenshot](screenshot.png)

## ✨ Caratteristiche

- 📅 **Visualizzazione per giorni**: Ieri, Oggi, Domani
- ⚽ **Calcio**: Serie A, Champions League, Europa League, Conference League (solo squadre italiane), Serie B (Monza, Catanzaro), Serie D (Reggina)
- 🎾 **Tennis**: ATP/WTA con giocatori italiani (Sinner, Musetti, Berrettini, Paolini, ecc.)
- 🏎️ **Formula 1**: Prove, qualifiche, gare
- 🏍️ **MotoGP**: Prove, qualifiche, gare
- 🏐 **Volley**: Partite del Vero Volley Monza
- ⛷️ **Sci Alpino**: Gare di Federica Brignone e Sofia Goggia
- 🇮🇹 **Evidenziazione eventi italiani**
- 💾 **Salvataggio preferenze** in localStorage
- 📱 **Responsive design** per smartphone
- 🔄 **Aggiornamento manuale** dei dati

## 🚀 Demo

Visita la demo live: [https://tuousername.github.io/eventi-sportivi-italiani](https://tuousername.github.io/eventi-sportivi-italiani)

## 🛠️ Tecnologie

- **HTML5** semantico
- **CSS3** con variabili CSS e Grid/Flexbox
- **JavaScript ES6+** (vanilla, no framework)
- **TheSportsDB API** (gratuita) per dati sportivi
- **rss2json.com** come proxy per feed RSS
- **Service Worker** per supporto offline

## 📋 Prerequisiti

- Un browser moderno (Chrome, Firefox, Safari, Edge)
- Connessione internet per caricare i dati

## 🚀 Installazione e Deploy su GitHub Pages

### Passo 1: Crea un repository GitHub

1. Vai su [GitHub](https://github.com) e accedi
2. Clicca su **"New repository"** (pulsante verde)
3. Nome del repository: `eventi-sportivi-italiani`
4. Seleziona **"Public"** (necessario per GitHub Pages)
5. Clicca **"Create repository"**

### Passo 2: Carica i file

#### Opzione A: Upload manuale

1. Nella pagina del repository, clicca su **"Add file"** → **"Upload files"**
2. Trascina i file `index.html`, `styles.css`, `app.js`, `sw.js`
3. Clicca **"Commit changes"**

#### Opzione B: Usando Git (consigliato)

```bash
# Clona il repository (sostituisci TUO_USERNAME)
git clone https://github.com/TUO_USERNAME/eventi-sportivi-italiani.git
cd eventi-sportivi-italiani

# Copia i file nella cartella
cp /percorso/dei/tuoi/file/* .

# Commit e push
git add .
git commit -m "Initial commit"
git push origin main
```

### Passo 3: Abilita GitHub Pages

1. Nel repository, vai su **"Settings"** (tab in alto)
2. Nel menu laterale sinistro, clicca su **"Pages"**
3. Sezione **"Source"**, seleziona:
   - Branch: `main` (o `master`)
   - Folder: `/ (root)`
4. Clicca **"Save"**
5. Attendi 1-2 minuti e ricarica la pagina
6. Vedrai l'URL del tuo sito: `https://TUO_USERNAME.github.io/eventi-sportivi-italiani`

### Passo 4: Verifica

1. Clicca sull'URL fornito da GitHub Pages
2. L'app dovrebbe caricarsi correttamente
3. Prova a cambiare giorno e a filtrare per sport

## 📁 Struttura del progetto

```
eventi-sportivi-italiani/
├── index.html          # Struttura HTML principale
├── styles.css          # Stili CSS con tema scuro moderno
├── app.js             # Logica JavaScript e API calls
├── sw.js              # Service Worker (opzionale, per offline)
└── README.md          # Questo file
```

## 🔌 Fonti Dati

L'app utilizza le seguenti fonti dati:

| Fonte | Tipo | Descrizione |
|-------|------|-------------|
| [TheSportsDB](https://www.thesportsdb.com) | API | Eventi sportivi programmati (gratuita) |
| [rss2json.com](https://rss2json.com) | Proxy | Conversione RSS in JSON (bypass CORS) |

### Endpoint API utilizzati

```javascript
// Eventi per giorno e lega
https://www.thesportsdb.com/api/v1/json/123/eventsday.php?d=YYYY-MM-DD&l=LEAGUE_ID

// Leghe supportate:
// Serie A: 4332
// Champions League: 4480
// Europa League: 4481
// Conference League: 4771
// Serie B: 4394
// Formula 1: 4370
// MotoGP: 4407
// ATP Tour: 4464
// WTA Tour: 4465
```

## ⚙️ Configurazione

Le preferenze utente vengono salvate automaticamente in `localStorage`. Puoi modificare lo sport predefinito nel file `app.js`:

```javascript
const defaults = {
    'serie-a': true,
    'champions': true,
    'europa': true,
    'conference': true,
    'serie-b': true,
    'serie-d': true,
    'tennis': true,
    'f1': true,
    'motogp': true,
    'volley': true,
    'ski': true,
    'highlightItalian': true
};
```

## 🎨 Personalizzazione

### Colori

Modifica le variabili CSS in `styles.css`:

```css
:root {
    --primary: #0066cc;        /* Colore principale */
    --secondary: #00d4aa;      /* Colore secondario */
    --accent: #ff6b35;         /* Evidenziazione italiani */
    --background: #0a0e17;     /* Sfondo */
    --surface: #141b2d;        /* Card background */
    /* ... */
}
```

### Sport colors

```css
--soccer: #00c853;      /* Calcio - Verde */
--tennis: #ffeb3b;      /* Tennis - Giallo */
--f1: #ff5722;          /* F1 - Arancione */
--motogp: #e91e63;      /* MotoGP - Rosa */
--volley: #2196f3;      /* Volley - Blu */
--ski: #00bcd4;         /* Sci - Ciano */
```

## 🐳 Struttura Dati

### Esempio JSON Evento

```json
{
    "idEvent": "123456",
    "strEvent": "Juventus vs Inter",
    "strHomeTeam": "Juventus",
    "strAwayTeam": "Inter",
    "dateEvent": "2024-01-15",
    "strTime": "20:45",
    "strLeague": "Italian Serie A",
    "strThumb": "https://...",
    "strVideo": "https://...",
    "sportType": "soccer",
    "competition": "Serie A"
}
```

### Schema dati interno

```javascript
{
    idEvent: string,        // ID univoco evento
    strEvent: string,       // Nome evento
    strHomeTeam: string,    // Squadra casa
    strAwayTeam: string,    // Squadra ospite
    dateEvent: string,      // Data (YYYY-MM-DD)
    strTime: string,        // Ora (HH:MM)
    strLeague: string,      // Nome lega
    strThumb: string,       // URL immagine
    strVideo: string,       // URL dettagli
    sportType: string,      // Tipo sport (soccer, tennis, f1, ...)
    competition: string,    // Competizione specifica
    isMock: boolean,        // true se dato simulato
    note: string            // Note aggiuntive
}
```

## ⌨️ Scorciatoie da tastiera

| Tasto | Azione |
|-------|--------|
| `ESC` | Chiudi modal impostazioni |
| `Ctrl + R` | Aggiorna dati |

## 🔧 Troubleshooting

### L'app non carica i dati

1. Verifica la connessione internet
2. Controlla la console del browser (F12 → Console)
3. Potrebbe essere un problema di rate limiting dell'API (30 req/min)

### CORS Error

L'app utilizza rss2json.com come proxy. Se non funziona:
1. Verifica che il servizio sia online
2. Alternativa: usa `allorigins.win` modificando `CONFIG.RSS_PROXY`

### GitHub Pages non si aggiorna

1. Le modifiche possono richiedere fino a 5 minuti
2. Prova a svuotare la cache del browser (Ctrl+Shift+R)
3. Verifica che i file siano stati pushati correttamente

## 📝 TODO / Miglioramenti futuri

- [ ] Aggiungere notifiche push per eventi importanti
- [ ] Implementare cache locale più robusta
- [ ] Aggiungere statistiche squadre/giocatori
- [ ] Supporto per più lingue
- [ ] Tema chiaro/scuro toggle
- [ ] Aggiungere risultati in tempo reale (richiede API premium)

## 📄 Licenza

Questo progetto è rilasciato sotto licenza MIT. Sentiti libero di usarlo, modificarlo e distribuirlo.

## 🙏 Crediti

- Dati forniti da [TheSportsDB](https://www.thesportsdb.com)
- Icone e font da [Google Fonts](https://fonts.google.com)
- Design ispirato a moderne app sportive

---

**Creato con ❤️ per gli appassionati di sport italiani**
