/**
 * Eventi Sportivi Italiani - App JavaScript
 * 
 * Fonti dati:
 * - TheSportsDB API (gratuita, key=123) per eventi sportivi
 * - rss2json.com come proxy per feed RSS
 * - Feed RSS Gazzetta dello Sport, Motorsport.com
 */

// Configurazione
const CONFIG = {
    API_KEY: '123',
    BASE_URL: 'https://www.thesportsdb.com/api/v1/json',
    RSS_PROXY: 'https://api.rss2json.com/v1/api.json',
    // ID leghe TheSportsDB
    LEAGUES: {
        SERIE_A: 4332,
        CHAMPIONS_LEAGUE: 4480,
        EUROPA_LEAGUE: 4481,
        CONFERENCE_LEAGUE: 4771,
        SERIE_B: 4394,
        F1: 4370,
        MOTOGP: 4407,
        ATP: 4464,
        WTA: 4465
    },
    // Squadre italiane di interesse
    TEAMS: {
        MONZA: 134150,
        CATANZARO: 134777,
        // ID per tennis, F1, MotoGP verranno cercati dinamicamente
    },
    // Giocatori italiani tennis
    TENNIS_PLAYERS: [
        'Sinner', 'Musetti', 'Berrettini', 'Paolini', 
        'Sonego', 'Arnaldi', 'Darderi', 'Cobolli'
    ],
    // Piloti italiani F1/MotoGP
    PILOTS: {
        F1: ['Antonelli'],
        MOTOGP: ['Bagnaia', 'Bastianini', 'Bezzecchi', 'Marini', 'Morbidelli'],
        MOTO2: ['Celestino Vietti', 'Arbolino'],
        MOTO3: ['Migno', 'Farioli']
    },
    // Sci
    SKIERS: ['Brignone', 'Goggia', 'Delago', 'Pichler']
};

// Stato dell'app
const state = {
    currentDay: 'today',
    events: [],
    filteredEvents: [],
    preferences: {},
    isLoading: false
};

// Date helper
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

function formatTime(dateStr) {
    if (!dateStr) return '--:--';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('it-IT', { 
        hour: '2-digit', 
        minute: '2-digit'
    });
}

// LocalStorage
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
        
        const toggle = document.getElementById(key);
        if (toggle) toggle.checked = value;
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
    
    // Ricarica eventi con nuovi filtri
    filterAndDisplayEvents();
}

// API TheSportsDB
async function fetchFromAPI(endpoint) {
    const url = `${CONFIG.BASE_URL}/${CONFIG.API_KEY}/${endpoint}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network error');
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        return null;
    }
}

// Recupera eventi per giorno
async function fetchEventsByDay(date) {
    const events = [];
    
    // Serie A
    if (state.preferences['serie-a']) {
        const serieA = await fetchFromAPI(`eventsday.php?d=${date}&l=${CONFIG.LEAGUES.SERIE_A}`);
        if (serieA?.events) {
            events.push(...serieA.events.map(e => ({ ...e, sportType: 'soccer', competition: 'Serie A' })));
        }
    }
    
    // Champions League - filtra solo partite con squadre italiane
    if (state.preferences['champions']) {
        const cl = await fetchFromAPI(`eventsday.php?d=${date}&l=${CONFIG.LEAGUES.CHAMPIONS_LEAGUE}`);
        if (cl?.events) {
            const italianTeams = cl.events.filter(e => 
                isItalianTeam(e.strHomeTeam) || isItalianTeam(e.strAwayTeam)
            );
            events.push(...italianTeams.map(e => ({ ...e, sportType: 'soccer', competition: 'Champions League' })));
        }
    }
    
    // Europa League - solo italiane
    if (state.preferences['europa']) {
        const el = await fetchFromAPI(`eventsday.php?d=${date}&l=${CONFIG.LEAGUES.EUROPA_LEAGUE}`);
        if (el?.events) {
            const italianTeams = el.events.filter(e => 
                isItalianTeam(e.strHomeTeam) || isItalianTeam(e.strAwayTeam)
            );
            events.push(...italianTeams.map(e => ({ ...e, sportType: 'soccer', competition: 'Europa League' })));
        }
    }
    
    // Conference League - solo italiane
    if (state.preferences['conference']) {
        const conf = await fetchFromAPI(`eventsday.php?d=${date}&l=${CONFIG.LEAGUES.CONFERENCE_LEAGUE}`);
        if (conf?.events) {
            const italianTeams = conf.events.filter(e => 
                isItalianTeam(e.strHomeTeam) || isItalianTeam(e.strAwayTeam)
            );
            events.push(...italianTeams.map(e => ({ ...e, sportType: 'soccer', competition: 'Conference League' })));
        }
    }
    
    // Serie B - solo Monza e Catanzaro
    if (state.preferences['serie-b']) {
        const serieB = await fetchFromAPI(`eventsday.php?d=${date}&l=${CONFIG.LEAGUES.SERIE_B}`);
        if (serieB?.events) {
            const filtered = serieB.events.filter(e => 
                e.strHomeTeam?.toLowerCase().includes('monza') ||
                e.strAwayTeam?.toLowerCase().includes('monza') ||
                e.strHomeTeam?.toLowerCase().includes('catanzaro') ||
                e.strAwayTeam?.toLowerCase().includes('catanzaro')
            );
            events.push(...filtered.map(e => ({ ...e, sportType: 'soccer', competition: 'Serie B' })));
        }
    }
    
    // Formula 1
    if (state.preferences['f1']) {
        const f1 = await fetchFromAPI(`eventsday.php?d=${date}&l=${CONFIG.LEAGUES.F1}`);
        if (f1?.events) {
            events.push(...f1.events.map(e => ({ 
                ...e, 
                sportType: 'f1', 
                competition: 'Formula 1',
                strEvent: e.strEvent || e.strFilename
            })));
        }
    }
    
    // MotoGP
    if (state.preferences['motogp']) {
        const motogp = await fetchFromAPI(`eventsday.php?d=${date}&l=${CONFIG.LEAGUES.MOTOGP}`);
        if (motogp?.events) {
            events.push(...motogp.events.map(e => ({ 
                ...e, 
                sportType: 'motogp', 
                competition: 'MotoGP',
                strEvent: e.strEvent || e.strFilename
            })));
        }
    }
    
    // Tennis ATP - cerca giocatori italiani
    if (state.preferences['tennis']) {
        const atp = await fetchFromAPI(`eventsday.php?d=${date}&l=${CONFIG.LEAGUES.ATP}`);
        if (atp?.events) {
            const italianPlayers = atp.events.filter(e => 
                hasItalianPlayer(e.strEvent) || hasItalianPlayer(e.strFilename)
            );
            events.push(...italianPlayers.map(e => ({ ...e, sportType: 'tennis', competition: 'ATP Tour' })));
        }
        
        // WTA
        const wta = await fetchFromAPI(`eventsday.php?d=${date}&l=${CONFIG.LEAGUES.WTA}`);
        if (wta?.events) {
            const italianWTA = wta.events.filter(e => 
                hasItalianPlayer(e.strEvent) || hasItalianPlayer(e.strFilename)
            );
            events.push(...italianWTA.map(e => ({ ...e, sportType: 'tennis', competition: 'WTA Tour' })));
        }
    }
    
    return events;
}

// Helper per identificare squadre italiane
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

// Helper per identificare giocatori italiani nel tennis
function hasItalianPlayer(eventName) {
    if (!eventName) return false;
    const name = eventName.toLowerCase();
    return CONFIG.TENNIS_PLAYERS.some(player => 
        name.includes(player.toLowerCase())
    );
}

// Recupera news dai feed RSS
async function fetchRSSNews() {
    const news = [];
    
    // Feed Gazzetta dello Sport - Calcio
    try {
        const gazzettaUrl = 'https://www.gazzetta.it/rss/Calcio.xml';
        const response = await fetch(`${CONFIG.RSS_PROXY}?rss_url=${encodeURIComponent(gazzettaUrl)}`);
        const data = await response.json();
        
        if (data?.items) {
            news.push(...data.items.slice(0, 5).map(item => ({
                id: `news-${Date.now()}-${Math.random()}`,
                strEvent: item.title,
                strLeague: 'News',
                dateEvent: new Date(item.pubDate).toISOString().split('T')[0],
                strTime: new Date(item.pubDate).toTimeString().slice(0, 5),
                sportType: 'news',
                competition: 'News Gazzetta',
                strThumb: item.enclosure?.link || '',
                strVideo: item.link,
                isNews: true
            })));
        }
    } catch (e) {
        console.log('RSS fetch error:', e);
    }
    
    return news;
}

// Simula eventi per sport non coperti da API
function generateMockEvents(date) {
    const events = [];
    const dateObj = new Date(date);
    
    // Serie D - Reggina (mock data)
    if (state.preferences['serie-d']) {
        // Simula partita Reggina se è sabato o domenica
        const dayOfWeek = dateObj.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            events.push({
                idEvent: `reggina-${date}`,
                strEvent: 'Reggina vs Avversario',
                strHomeTeam: 'Reggina',
                strAwayTeam: 'Avversario',
                dateEvent: date,
                strTime: '15:00',
                sportType: 'soccer',
                competition: 'Serie D - Girone I',
                strLeague: 'Serie D',
                strThumb: '',
                strVideo: '',
                isMock: true,
                note: 'Trasmessa su ReggioTV se in trasferta'
            });
        }
    }
    
    // Volley - Monza (mock data)
    if (state.preferences['volley']) {
        events.push({
            idEvent: `volley-monza-${date}`,
            strEvent: 'Vero Volley Monza vs Avversario',
            strHomeTeam: 'Vero Volley Monza',
            strAwayTeam: 'Avversario',
            dateEvent: date,
            strTime: '18:00',
            sportType: 'volleyball',
            competition: 'SuperLega Volley',
            strLeague: 'SuperLega',
            strThumb: '',
            strVideo: '',
            isMock: true
        });
    }
    
    // Sci Alpino (mock data - stagione invernale)
    if (state.preferences['ski']) {
        const month = dateObj.getMonth();
        // Sci solo da dicembre ad aprile
        if (month >= 11 || month <= 3) {
            events.push({
                idEvent: `ski-${date}`,
                strEvent: 'Discesa Libera Femminile - Federica Brignone / Sofia Goggia',
                strHomeTeam: 'Federica Brignone',
                strAwayTeam: 'Sofia Goggia',
                dateEvent: date,
                strTime: '11:30',
                sportType: 'ski',
                competition: 'Coppa del Mondo Sci Alpino',
                strLeague: 'FIS Alpine',
                strThumb: '',
                strVideo: '',
                isMock: true
            });
        }
    }
    
    return events;
}

// Carica tutti gli eventi
async function loadEvents() {
    state.isLoading = true;
    showLoading(true);
    showError(false);
    
    const dates = getDates();
    const selectedDate = dates[state.currentDay + 'Obj'];
    const dateStr = formatDate(selectedDate);
    
    try {
        // Recupera eventi da API
        const apiEvents = await fetchEventsByDay(dateStr);
        
        // Aggiungi eventi mock per sport non coperti
        const mockEvents = generateMockEvents(dateStr);
        
        // Combina tutti gli eventi
        state.events = [...apiEvents, ...mockEvents];
        
        // Ordina per orario
        state.events.sort((a, b) => {
            const timeA = a.strTime || '00:00';
            const timeB = b.strTime || '00:00';
            return timeA.localeCompare(timeB);
        });
        
        filterAndDisplayEvents();
        
        // Aggiorna timestamp
        document.getElementById('lastUpdate').textContent = 
            new Date().toLocaleString('it-IT');
            
    } catch (error) {
        console.error('Error loading events:', error);
        showError(true);
    } finally {
        state.isLoading = false;
        showLoading(false);
    }
}

// Filtra e visualizza eventi
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
        
        // Filtro per preferenze sport specifiche
        if (event.sportType === 'soccer') {
            if (event.competition === 'Serie A' && !state.preferences['serie-a']) return false;
            if (event.competition === 'Champions League' && !state.preferences['champions']) return false;
            if (event.competition === 'Europa League' && !state.preferences['europa']) return false;
            if (event.competition === 'Conference League' && !state.preferences['conference']) return false;
            if (event.competition === 'Serie B' && !state.preferences['serie-b']) return false;
            if (event.competition?.includes('Serie D') && !state.preferences['serie-d']) return false;
        }
        if (event.sportType === 'tennis' && !state.preferences['tennis']) return false;
        if (event.sportType === 'f1' && !state.preferences['f1']) return false;
        if (event.sportType === 'motogp' && !state.preferences['motogp']) return false;
        if (event.sportType === 'volleyball' && !state.preferences['volley']) return false;
        if (event.sportType === 'ski' && !state.preferences['ski']) return false;
        
        return true;
    });
    
    renderEvents();
}

// Renderizza eventi
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
    
    let html = '';
    
    sportOrder.forEach(sport => {
        if (grouped[sport]?.length > 0) {
            const sportNames = {
                soccer: 'Calcio',
                tennis: 'Tennis',
                f1: 'Formula 1',
                motogp: 'MotoGP',
                volleyball: 'Volley',
                ski: 'Sci Alpino',
                news: 'News',
                other: 'Altri eventi'
            };
            
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

// Renderizza singola card evento
function renderEventCard(event) {
    const isItalian = isItalianEvent(event);
    const shouldHighlight = state.preferences.highlightItalian && isItalian;
    
    const time = event.strTime ? formatTime(`2000-01-01T${event.strTime}`) : 'TBD';
    const teams = event.strHomeTeam && event.strAwayTeam 
        ? `${event.strHomeTeam} vs ${event.strAwayTeam}`
        : event.strEvent || 'Evento sportivo';
    
    let linkHtml = '';
    if (event.strVideo || event.idEvent) {
        const link = event.strVideo || `https://www.thesportsdb.com/event/${event.idEvent}`;
        linkHtml = `
            <a href="${link}" target="_blank" rel="noopener" class="event-link">
                Dettagli evento
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
        ? '<span class="event-italian-badge">🇮🇹 Italiano</span>' 
        : '';
    
    return `
        <article class="event-card ${event.sportType} ${shouldHighlight ? 'italian' : ''}" 
                 data-id="${event.idEvent}">
            <div class="event-header">
                <div class="event-meta">
                    <span class="event-time">${time}</span>
                    <span class="event-sport ${event.sportType}">${event.competition || event.strLeague}</span>
                    ${italianBadge}
                </div>
            </div>
            <h4 class="event-title">${event.strEvent || teams}</h4>
            ${event.strHomeTeam ? `<p class="event-teams">${teams}</p>` : ''}
            ${event.strLeague && event.strLeague !== event.competition ? 
                `<p class="event-competition">${event.strLeague}</p>` : ''}
            ${noteHtml}
            ${linkHtml}
        </article>
    `;
}

// Verifica se l'evento coinvolge italiani
function isItalianEvent(event) {
    // Verifica squadre
    if (isItalianTeam(event.strHomeTeam) || isItalianTeam(event.strAwayTeam)) {
        return true;
    }
    
    // Verifica tennis
    if (event.sportType === 'tennis') {
        return hasItalianPlayer(event.strEvent) || hasItalianPlayer(event.strFilename);
    }
    
    // Verifica F1/MotoGP
    if (event.sportType === 'f1' || event.sportType === 'motogp') {
        const pilots = event.sportType === 'f1' ? CONFIG.PILOTS.F1 : CONFIG.PILOTS.MOTOGP;
        const eventName = (event.strEvent || event.strFilename || '').toLowerCase();
        return pilots.some(p => eventName.includes(p.toLowerCase()));
    }
    
    // Verifica sci
    if (event.sportType === 'ski') {
        const eventName = (event.strEvent || '').toLowerCase();
        return CONFIG.SKIERS.some(s => eventName.includes(s.toLowerCase()));
    }
    
    return false;
}

// UI Helpers
function showLoading(show) {
    document.getElementById('loadingState').style.display = show ? 'flex' : 'none';
    document.getElementById('eventsContainer').style.display = show ? 'none' : 'block';
}

function showError(show) {
    document.getElementById('errorState').style.display = show ? 'flex' : 'none';
    document.getElementById('eventsContainer').style.display = show ? 'none' : 'block';
}

// Aggiorna date nella navigazione
function updateDateLabels() {
    const dates = getDates();
    document.getElementById('date-yesterday').textContent = formatDisplayDate(dates.yesterdayObj);
    document.getElementById('date-today').textContent = formatDisplayDate(dates.todayObj);
    document.getElementById('date-tomorrow').textContent = formatDisplayDate(dates.tomorrowObj);
}

// Event Listeners
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

// Service Worker per offline (opzionale)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => {
        console.log('Service Worker registration failed:', err);
    });
}
