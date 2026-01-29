/**
 * Eventi Sportivi Italiani - App JavaScript
 * 
 * Fonti dati:
 * - OpenLigaDB API per alcuni eventi internazionali
 * - Dati mock realistici per Serie A e sport italiani
 * - RSS feed per news sportive
 */

// Configurazione
const CONFIG = {
    RSS_PROXY: 'https://api.rss2json.com/v1/api.json?rss_url=',
    // Feed RSS italiani
    RSS_FEEDS: {
        GAZZETTA_CALCIO: 'https://www.gazzetta.it/rss/Calcio.xml',
        GAZZETTA_SPORT: 'https://www.gazzetta.it/rss/Sport.xml',
        SKY_SPORT: 'https://sport.sky.it/rss/sport.xml',
        CORRIERE_SPORT: 'https://www.corrieredellosport.it/rss/calcio.xml'
    },
    // Giocatori italiani tennis
    TENNIS_PLAYERS: [
        'Sinner', 'Musetti', 'Berrettini', 'Paolini', 
        'Sonego', 'Arnaldi', 'Darderi', 'Cobolli'
    ],
    // Piloti italiani
    PILOTS: {
        F1: ['Antonelli'],
        MOTOGP: ['Bagnaia', 'Bastianini', 'Bezzecchi', 'Marini', 'Morbidelli']
    },
    // Sciatrici italiane
    SKIERS: ['Brignone', 'Goggia', 'Delago', 'Pichler']
};

// Stato dell'app
const state = {
    currentDay: 'today',
    events: [],
    filteredEvents: [],
    preferences: {},
    isLoading: false,
    lastUpdate: null
};

// ============ DATE HELPERS ============
function getDates() {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return {
        yesterday: formatDate(yesterday),
        today: formatDate(today),
        tomorrow: formatDate(tomorrow),
        yesterdayObj: yesterday,
        todayObj: today,
        tomorrowObj: tomorrow
    };
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function formatDisplayDate(date) {
    return date.toLocaleDateString('it-IT', { 
        day: 'numeric', 
        month: 'short'
    });
}

function formatTime(dateStr, timeStr) {
    if (timeStr) return timeStr.substring(0, 5);
    if (!dateStr) return '--:--';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('it-IT', { 
        hour: '2-digit', 
        minute: '2-digit'
    });
}

// ============ LOCALSTORAGE ============
function loadPreferences() {
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
    
    try {
        const saved = localStorage.getItem('sportPreferences');
        state.preferences = saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    } catch (e) {
        state.preferences = defaults;
    }
    
    // Applica preferenze alla UI
    Object.entries(state.preferences).forEach(([key, value]) => {
        const checkbox = document.querySelector(`[data-sport="${key}"]`);
        if (checkbox) checkbox.checked = value;
    });
    
    const highlightToggle = document.getElementById('highlightItalian');
    if (highlightToggle) highlightToggle.checked = state.preferences.highlightItalian;
}

function savePreferences() {
    const checkboxes = document.querySelectorAll('[data-sport]');
    checkboxes.forEach(cb => {
        state.preferences[cb.dataset.sport] = cb.checked;
    });
    
    const highlightToggle = document.getElementById('highlightItalian');
    if (highlightToggle) {
        state.preferences.highlightItalian = highlightToggle.checked;
    }
    
    localStorage.setItem('sportPreferences', JSON.stringify(state.preferences));
    filterAndDisplayEvents();
}

// ============ MOCK DATA GENERATORS ============

// Genera eventi Serie A realistici per una data
function generateSerieAEvents(date) {
    const events = [];
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();
    
    // Serie A: partite principalmente il weekend e alcune di sabato
    if (dayOfWeek === 6 || dayOfWeek === 0) {
        // Partite della giornata
        const matches = [
            { home: 'Inter', away: 'Napoli', time: '18:00' },
            { home: 'Juventus', away: 'Milan', time: '20:45' },
            { home: 'Atalanta', away: 'Roma', time: '15:00' },
            { home: 'Lazio', away: 'Fiorentina', time: '18:00' },
            { home: 'Bologna', away: 'Torino', time: '15:00' },
            { home: 'Genoa', away: 'Udinese', time: '12:30' },
            { home: 'Empoli', away: 'Lecce', time: '15:00' },
            { home: 'Parma', away: 'Como', time: '18:00' },
            { home: 'Cagliari', away: 'Verona', time: '15:00' },
            { home: 'Monza', away: 'Venezia', time: '12:30' }
        ];
        
        // Seleziona 3-5 partite casuali per questa giornata
        const numMatches = 3 + Math.floor(Math.random() * 3);
        const shuffled = [...matches].sort(() => 0.5 - Math.random());
        
        shuffled.slice(0, numMatches).forEach((match, idx) => {
            events.push({
                id: `seriea-${date}-${idx}`,
                title: `${match.home} vs ${match.away}`,
                homeTeam: match.home,
                awayTeam: match.away,
                date: date,
                time: match.time,
                sportType: 'soccer',
                competition: 'Serie A',
                league: 'Serie A TIM',
                isItalian: true,
                icon: '⚽'
            });
        });
    }
    
    return events;
}

// Genera eventi Champions League (solo italiane)
function generateChampionsLeagueEvents(date) {
    const events = [];
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();
    
    // Champions: martedì e mercoledì
    if (dayOfWeek === 2 || dayOfWeek === 3) {
        const matches = [
            { home: 'Inter', away: 'Bayern Monaco', time: '21:00' },
            { home: 'Milan', away: 'Real Madrid', time: '21:00' },
            { home: 'Juventus', away: 'PSG', time: '21:00' },
            { home: 'Atalanta', away: 'Arsenal', time: '21:00' },
            { home: 'Liverpool', away: 'Napoli', time: '21:00' },
            { home: 'Barcelona', away: 'Roma', time: '18:45' }
        ];
        
        // Solo partite con squadre italiane
        const italianMatches = matches.filter(m => 
            isItalianTeam(m.home) || isItalianTeam(m.away)
        );
        
        italianMatches.slice(0, 2).forEach((match, idx) => {
            events.push({
                id: `ucl-${date}-${idx}`,
                title: `${match.home} vs ${match.away}`,
                homeTeam: match.home,
                awayTeam: match.away,
                date: date,
                time: match.time,
                sportType: 'soccer',
                competition: 'Champions League',
                league: 'UEFA Champions League',
                isItalian: true,
                icon: '🏆'
            });
        });
    }
    
    return events;
}

// Genera eventi Europa League (solo italiane)
function generateEuropaLeagueEvents(date) {
    const events = [];
    const dateOfWeek = new Date(date).getDay();
    
    // Europa League: giovedì
    if (dateOfWeek === 4) {
        const matches = [
            { home: 'Lazio', away: 'Ajax', time: '21:00' },
            { home: 'Roma', away: 'Manchester United', time: '18:45' },
            { home: 'Fiorentina', away: 'Real Betis', time: '21:00' }
        ];
        
        matches.forEach((match, idx) => {
            events.push({
                id: `uel-${date}-${idx}`,
                title: `${match.home} vs ${match.away}`,
                homeTeam: match.home,
                awayTeam: match.away,
                date: date,
                time: match.time,
                sportType: 'soccer',
                competition: 'Europa League',
                league: 'UEFA Europa League',
                isItalian: true,
                icon: '🏆'
            });
        });
    }
    
    return events;
}

// Genera eventi Conference League (solo italiane)
function generateConferenceLeagueEvents(date) {
    const events = [];
    const dayOfWeek = new Date(date).getDay();
    
    // Conference League: giovedì
    if (dayOfWeek === 4) {
        events.push({
            id: `conf-${date}`,
            title: 'Fiorentina vs Gent',
            homeTeam: 'Fiorentina',
            awayTeam: 'Gent',
            date: date,
            time: '18:45',
            sportType: 'soccer',
            competition: 'Conference League',
            league: 'UEFA Conference League',
            isItalian: true,
            icon: '🏆'
        });
    }
    
    return events;
}

// Genera eventi Serie B (Monza e Catanzaro)
function generateSerieBEvents(date) {
    const events = [];
    const dayOfWeek = new Date(date).getDay();
    
    if (dayOfWeek === 6 || dayOfWeek === 0) {
        const matches = [
            { home: 'Monza', away: 'Brescia', time: '14:00' },
            { home: 'Catanzaro', away: 'Palermo', time: '16:15' },
            { home: 'Sampdoria', away: 'Monza', time: '20:30' },
            { home: 'Cremonese', away: 'Catanzaro', time: '14:00' }
        ];
        
        matches.filter(m => 
            m.home.toLowerCase().includes('monza') || 
            m.away.toLowerCase().includes('monza') ||
            m.home.toLowerCase().includes('catanzaro') || 
            m.away.toLowerCase().includes('catanzaro')
        ).forEach((match, idx) => {
            events.push({
                id: `serieb-${date}-${idx}`,
                title: `${match.home} vs ${match.away}`,
                homeTeam: match.home,
                awayTeam: match.away,
                date: date,
                time: match.time,
                sportType: 'soccer',
                competition: 'Serie B',
                league: 'Serie BKT',
                isItalian: true,
                icon: '⚽'
            });
        });
    }
    
    return events;
}

// Genera eventi Serie D (Reggina)
function generateSerieDEvents(date) {
    const events = [];
    const dayOfWeek = new Date(date).getDay();
    
    if (dayOfWeek === 0) {
        const isHome = Math.random() > 0.5;
        events.push({
            id: `seried-${date}`,
            title: isHome ? 'Reggina vs Messina' : 'Vibonese vs Reggina',
            homeTeam: isHome ? 'Reggina' : 'Vibonese',
            awayTeam: isHome ? 'Messina' : 'Reggina',
            date: date,
            time: '15:00',
            sportType: 'soccer',
            competition: 'Serie D',
            league: 'Serie D - Girone I',
            isItalian: true,
            note: isHome ? '' : 'Trasmessa su ReggioTV',
            icon: '⚽'
        });
    }
    
    return events;
}

// Genera eventi Tennis
function generateTennisEvents(date) {
    const events = [];
    const dayOfWeek = new Date(date).getDay();
    
    // Tornei ATP/WTA - tutti i giorni durante i tornei
    const players = ['Sinner', 'Musetti', 'Berrettini', 'Paolini', 'Sonego', 'Arnaldi'];
    const tournaments = ['Australian Open', 'Roland Garros', 'Wimbledon', 'US Open', 'Roma Masters'];
    
    // 30% probabilità di avere un match di tennis
    if (Math.random() > 0.7) {
        const player = players[Math.floor(Math.random() * players.length)];
        const tournament = tournaments[Math.floor(Math.random() * tournaments.length)];
        const isSingles = Math.random() > 0.3;
        
        events.push({
            id: `tennis-${date}`,
            title: isSingles 
                ? `${player} vs Avversario (Singolare)` 
                : `${player} / Partner vs Avversari (Doppio)`,
            player: player,
            date: date,
            time: ['11:00', '14:00', '17:00', '20:00'][Math.floor(Math.random() * 4)],
            sportType: 'tennis',
            competition: isSingles ? 'ATP/WTA Singolare' : 'ATP/WTA Doppio',
            league: tournament,
            isItalian: true,
            icon: '🎾'
        });
    }
    
    return events;
}

// Genera eventi Formula 1
function generateF1Events(date) {
    const events = [];
    const dayOfWeek = new Date(date).getDay();
    const dateObj = new Date(date);
    
    // F1: venerdì (prove), sabato (prove/qualifiche), domenica (gara)
    const races = [
        'GP Italia - Monza', 'GP Monaco', 'GP Spagna', 'GP Canada',
        'GP Austria', 'GP Gran Bretagna', 'GP Ungheria', 'GP Belgio'
    ];
    
    // Simula un weekend di gara ogni 2 settimane circa
    const weekNum = Math.floor(dateObj.getDate() / 7);
    if (weekNum % 2 === 0) {
        const race = races[weekNum % races.length];
        
        if (dayOfWeek === 5) {
            events.push({
                id: `f1-fp-${date}`,
                title: `F1 - Prove Libere 1 & 2 - ${race}`,
                date: date,
                time: '12:30',
                sportType: 'f1',
                competition: 'Formula 1',
                league: 'F1 World Championship',
                isItalian: race.includes('Italia'),
                icon: '🏎️'
            });
        } else if (dayOfWeek === 6) {
            events.push({
                id: `f1-qual-${date}`,
                title: `F1 - Prove Libere 3 & Qualifiche - ${race}`,
                date: date,
                time: '12:00',
                sportType: 'f1',
                competition: 'Formula 1',
                league: 'F1 World Championship',
                isItalian: race.includes('Italia'),
                icon: '🏎️'
            });
        } else if (dayOfWeek === 0) {
            events.push({
                id: `f1-race-${date}`,
                title: `F1 - GARA - ${race}`,
                date: date,
                time: '15:00',
                sportType: 'f1',
                competition: 'Formula 1',
                league: 'F1 World Championship',
                isItalian: race.includes('Italia'),
                icon: '🏎️'
            });
        }
    }
    
    return events;
}

// Genera eventi MotoGP
function generateMotoGPEvents(date) {
    const events = [];
    const dayOfWeek = new Date(date).getDay();
    const dateObj = new Date(date);
    
    const races = [
        'GP Italia - Mugello', 'GP Catalunya', 'GP Francia', 'GP Olanda',
        'GP Germania', 'GP Austria', 'GP San Marino', 'GP Valencia'
    ];
    
    const weekNum = Math.floor(dateObj.getDate() / 7);
    if (weekNum % 2 === 1) {
        const race = races[weekNum % races.length];
        
        if (dayOfWeek === 5) {
            events.push({
                id: `motogp-fp-${date}`,
                title: `MotoGP - Prove Libere - ${race}`,
                date: date,
                time: '10:00',
                sportType: 'motogp',
                competition: 'MotoGP',
                league: 'MotoGP World Championship',
                isItalian: race.includes('Italia') || race.includes('San Marino'),
                icon: '🏍️'
            });
        } else if (dayOfWeek === 6) {
            events.push({
                id: `motogp-qual-${date}`,
                title: `MotoGP - Prove Libere & Qualifiche - ${race}`,
                date: date,
                time: '10:00',
                sportType: 'motogp',
                competition: 'MotoGP',
                league: 'MotoGP World Championship',
                isItalian: race.includes('Italia') || race.includes('San Marino'),
                icon: '🏍️'
            });
        } else if (dayOfWeek === 0) {
            events.push({
                id: `motogp-race-${date}`,
                title: `MotoGP - GARA - ${race}`,
                date: date,
                time: '14:00',
                sportType: 'motogp',
                competition: 'MotoGP',
                league: 'MotoGP World Championship',
                isItalian: race.includes('Italia') || race.includes('San Marino'),
                icon: '🏍️'
            });
        }
    }
    
    return events;
}

// Genera eventi Volley (Monza)
function generateVolleyEvents(date) {
    const events = [];
    const dayOfWeek = new Date(date).getDay();
    
    // SuperLega: partite di sabato o domenica
    if (dayOfWeek === 6 || dayOfWeek === 0) {
        const isHome = Math.random() > 0.5;
        events.push({
            id: `volley-${date}`,
            title: isHome ? 'Vero Volley Monza vs Perugia' : 'Trento vs Vero Volley Monza',
            homeTeam: isHome ? 'Vero Volley Monza' : 'Trento',
            awayTeam: isHome ? 'Perugia' : 'Vero Volley Monza',
            date: date,
            time: dayOfWeek === 6 ? '18:00' : '17:00',
            sportType: 'volleyball',
            competition: 'SuperLega',
            league: 'SuperLega Credem Banca',
            isItalian: true,
            icon: '🏐'
        });
    }
    
    return events;
}

// Genera eventi Sci Alpino
function generateSkiEvents(date) {
    const events = [];
    const dateObj = new Date(date);
    const month = dateObj.getMonth();
    const dayOfWeek = dateObj.getDay();
    
    // Sci: dicembre - marzo, principalmente weekend
    if ((month >= 11 || month <= 2) && (dayOfWeek === 6 || dayOfWeek === 0)) {
        const disciplines = ['Discesa Libera', 'Super-G', 'Slalom Gigante', 'Slalom'];
        const discipline = disciplines[Math.floor(Math.random() * disciplines.length)];
        
        events.push({
            id: `ski-${date}`,
            title: `${discipline} Femminile - Brignone, Goggia`,
            date: date,
            time: '11:30',
            sportType: 'ski',
            competition: 'Sci Alpino',
            league: 'Coppa del Mondo FIS',
            isItalian: true,
            icon: '⛷️'
        });
    }
    
    return events;
}

// ============ HELPER FUNCTIONS ============
function isItalianTeam(teamName) {
    if (!teamName) return false;
    const name = teamName.toLowerCase();
    const italianTeams = [
        'juventus', 'inter', 'milan', 'napoli', 'roma', 'lazio', 'fiorentina',
        'atalanta', 'bologna', 'torino', 'genoa', 'sassuolo', 'udinese',
        'empoli', 'lecce', 'frosinone', 'cagliari', 'verona', 'monza',
        'salernitana', 'spezia', 'cremonese', 'venezia', 'benevento',
        'parma', 'como', 'catanzaro', 'reggina', 'palermo', 'bari',
        'taranto', 'catania', 'messina', 'perugia', 'pisa', 'pescara',
        'cesena', 'modena', 'reggiana', 'sampdoria'
    ];
    return italianTeams.some(team => name.includes(team));
}

// ============ RSS FEED FETCHER ============
async function fetchRSSNews() {
    const news = [];
    
    try {
        const response = await fetch(CONFIG.RSS_PROXY + encodeURIComponent(CONFIG.RSS_FEEDS.GAZZETTA_CALCIO));
        const data = await response.json();
        
        if (data?.items) {
            news.push(...data.items.slice(0, 5).map((item, idx) => ({
                id: `news-${idx}`,
                title: item.title,
                date: new Date(item.pubDate).toISOString().split('T')[0],
                time: new Date(item.pubDate).toTimeString().slice(0, 5),
                sportType: 'news',
                competition: 'News',
                league: 'Gazzetta dello Sport',
                link: item.link,
                isNews: true,
                icon: '📰'
            })));
        }
    } catch (e) {
        console.log('RSS fetch error:', e);
    }
    
    return news;
}

// ============ MAIN DATA LOADER ============
async function loadEvents() {
    state.isLoading = true;
    showLoading(true);
    showError(false);
    
    const dates = getDates();
    const selectedDate = dates[state.currentDay + 'Obj'];
    const dateStr = formatDate(selectedDate);
    
    try {
        const allEvents = [];
        
        // Genera eventi in base alle preferenze
        if (state.preferences['serie-a']) {
            allEvents.push(...generateSerieAEvents(dateStr));
        }
        if (state.preferences['champions']) {
            allEvents.push(...generateChampionsLeagueEvents(dateStr));
        }
        if (state.preferences['europa']) {
            allEvents.push(...generateEuropaLeagueEvents(dateStr));
        }
        if (state.preferences['conference']) {
            allEvents.push(...generateConferenceLeagueEvents(dateStr));
        }
        if (state.preferences['serie-b']) {
            allEvents.push(...generateSerieBEvents(dateStr));
        }
        if (state.preferences['serie-d']) {
            allEvents.push(...generateSerieDEvents(dateStr));
        }
        if (state.preferences['tennis']) {
            allEvents.push(...generateTennisEvents(dateStr));
        }
        if (state.preferences['f1']) {
            allEvents.push(...generateF1Events(dateStr));
        }
        if (state.preferences['motogp']) {
            allEvents.push(...generateMotoGPEvents(dateStr));
        }
        if (state.preferences['volley']) {
            allEvents.push(...generateVolleyEvents(dateStr));
        }
        if (state.preferences['ski']) {
            allEvents.push(...generateSkiEvents(dateStr));
        }
        
        // Aggiungi news da RSS
        const news = await fetchRSSNews();
        allEvents.push(...news);
        
        // Ordina per orario
        allEvents.sort((a, b) => {
            const timeA = a.time || '00:00';
            const timeB = b.time || '00:00';
            return timeA.localeCompare(timeB);
        });
        
        state.events = allEvents;
        filterAndDisplayEvents();
        
        // Aggiorna timestamp
        state.lastUpdate = new Date();
        document.getElementById('lastUpdate').textContent = 
            state.lastUpdate.toLocaleString('it-IT');
            
    } catch (error) {
        console.error('Error loading events:', error);
        showError(true);
    } finally {
        state.isLoading = false;
        showLoading(false);
    }
}

// ============ FILTER & DISPLAY ============
function filterAndDisplayEvents() {
    const sportFilter = document.getElementById('sportFilter').value;
    
    state.filteredEvents = state.events.filter(event => {
        // Filtro per sport
        if (sportFilter !== 'all') {
            if (sportFilter === 'soccer' && event.sportType !== 'soccer') return false;
            if (sportFilter === 'tennis' && event.sportType !== 'tennis') return false;
            if (sportFilter === 'motorsport' && !['f1', 'motogp'].includes(event.sportType)) return false;
            if (sportFilter === 'volleyball' && event.sportType !== 'volleyball') return false;
            if (sportFilter === 'ski' && event.sportType !== 'ski') return false;
        }
        
        return true;
    });
    
    renderEvents();
}

function renderEvents() {
    const container = document.getElementById('eventsContainer');
    const emptyState = document.getElementById('emptyState');
    
    if (state.filteredEvents.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'flex';
        return;
    }
    
    emptyState.style.display = 'none';
    
    // Raggruppa per sport
    const grouped = state.filteredEvents.reduce((acc, event) => {
        const key = event.sportType || 'other';
        if (!acc[key]) acc[key] = [];
        acc[key].push(event);
        return acc;
    }, {});
    
    // Ordine sport
    const sportOrder = ['soccer', 'tennis', 'f1', 'motogp', 'volleyball', 'ski', 'news', 'other'];
    const sportNames = {
        soccer: '⚽ Calcio',
        tennis: '🎾 Tennis',
        f1: '🏎️ Formula 1',
        motogp: '🏍️ MotoGP',
        volleyball: '🏐 Volley',
        ski: '⛷️ Sci Alpino',
        news: '📰 News',
        other: 'Altri eventi'
    };
    
    let html = '';
    
    sportOrder.forEach(sport => {
        if (grouped[sport]?.length > 0) {
            html += `
                <div class="section-header">
                    <h3>${sportNames[sport]}</h3>
                    <span class="section-count">${grouped[sport].length}</span>
                </div>
            `;
            
            grouped[sport].forEach(event => {
                html += renderEventCard(event);
            });
        }
    });
    
    container.innerHTML = html;
}

function renderEventCard(event) {
    const shouldHighlight = state.preferences.highlightItalian && event.isItalian;
    
    const time = event.time || 'TBD';
    const title = event.title || `${event.homeTeam} vs ${event.awayTeam}`;
    
    let linkHtml = '';
    if (event.link) {
        linkHtml = `
            <a href="${event.link}" target="_blank" rel="noopener" class="event-link">
                Leggi articolo
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M7 17L17 7M17 7H7M17 7V17"/>
                </svg>
            </a>
        `;
    }
    
    let noteHtml = '';
    if (event.note) {
        noteHtml = `<p class="event-note" style="margin-top: 0.5rem; font-size: 0.8125rem; color: var(--accent);">📺 ${event.note}</p>`;
    }
    
    const italianBadge = shouldHighlight 
        ? '<span class="event-italian-badge">🇮🇹 ITA</span>' 
        : '';
    
    return `
        <article class="event-card ${event.sportType} ${shouldHighlight ? 'italian' : ''}" 
                 data-id="${event.id}">
            <div class="event-header">
                <div class="event-meta">
                    <span class="event-time">${time}</span>
                    <span class="event-sport ${event.sportType}">${event.competition}</span>
                    ${italianBadge}
                </div>
            </div>
            <h4 class="event-title">${title}</h4>
            ${event.league && event.league !== event.competition ? 
                `<p class="event-competition">🏆 ${event.league}</p>` : ''}
            ${noteHtml}
            ${linkHtml}
        </article>
    `;
}

// ============ UI HELPERS ============
function showLoading(show) {
    document.getElementById('loadingState').style.display = show ? 'flex' : 'none';
    document.getElementById('eventsContainer').style.display = show ? 'none' : 'block';
}

function showError(show) {
    document.getElementById('errorState').style.display = show ? 'flex' : 'none';
    document.getElementById('eventsContainer').style.display = show ? 'none' : 'block';
}

function updateDateLabels() {
    const dates = getDates();
    document.getElementById('date-yesterday').textContent = formatDisplayDate(dates.yesterdayObj);
    document.getElementById('date-today').textContent = formatDisplayDate(dates.todayObj);
    document.getElementById('date-tomorrow').textContent = formatDisplayDate(dates.tomorrowObj);
}

// ============ EVENT LISTENERS ============
document.addEventListener('DOMContentLoaded', () => {
    // Carica preferenze
    loadPreferences();
    
    // Aggiorna date
    updateDateLabels();
    
    // Carica eventi iniziali
    loadEvents();
    
    // Navigazione giorni
    document.querySelectorAll('.day-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.day-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.currentDay = btn.dataset.day;
            loadEvents();
        });
    });
    
    // Filtro sport
    document.getElementById('sportFilter').addEventListener('change', filterAndDisplayEvents);
    
    // Bottone refresh
    document.getElementById('btnRefresh').addEventListener('click', loadEvents);
    
    // Bottone retry
    document.getElementById('btnRetry').addEventListener('click', loadEvents);
    
    // Modal impostazioni
    const modal = document.getElementById('settingsModal');
    
    document.getElementById('btnSettings').addEventListener('click', () => {
        modal.classList.add('active');
    });
    
    document.getElementById('btnCloseSettings').addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    document.getElementById('btnSaveSettings').addEventListener('click', () => {
        savePreferences();
        modal.classList.remove('active');
    });
    
    // Chiudi modal cliccando fuori
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            modal.classList.remove('active');
        }
        if (e.key === 'r' && e.ctrlKey) {
            e.preventDefault();
            loadEvents();
        }
    });
});

// Service Worker per offline
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => {
        console.log('Service Worker registration failed:', err);
    });
}
