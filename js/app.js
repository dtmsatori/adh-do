// LocalStorage kulcsok
const STORAGE_KEYS = {
  PROJECTS: 'adhdo_projects',
  SETTINGS: 'adhdo_settings',
  USER: 'adhdo_user'
};

// Alapértelmezett beállítások
const DEFAULT_SETTINGS = {
  theme: 'dark',
  soundEnabled: true,
  timeFormat: '24h'
};

// Inicializálás
function initApp() {
  // Beállítások betöltése
  loadSettings();
  // Témához igazodás
  applyTheme();
}

// Beállítások betöltése
function loadSettings() {
  const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  if (!settings) {
    localStorage.setItem(
      STORAGE_KEYS.SETTINGS,
      JSON.stringify(DEFAULT_SETTINGS)
    );
  }
}

// Téma alkalmazása
function applyTheme() {
  const settings = getSettings();
  if (settings.theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

// Téma váltás gombról (header-ből)
function toggleThemeFromButton() {
  const settings = getSettings();
  settings.theme = settings.theme === 'dark' ? 'light' : 'dark';
  saveSettings(settings);
}

// Beállítások lekérése
function getSettings() {
  const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  return settings ? JSON.parse(settings) : DEFAULT_SETTINGS;
}

// Beállítások mentése
function saveSettings(newSettings) {
  localStorage.setItem(
    STORAGE_KEYS.SETTINGS,
    JSON.stringify(newSettings)
  );
  applyTheme();
}

// Projektek lekérése
function getProjects() {
  const projects = localStorage.getItem(STORAGE_KEYS.PROJECTS);
  return projects ? JSON.parse(projects) : [];
}

// Projektek mentése
function saveProjects(projects) {
  localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
}

// Időformázás
function formatTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}ó ${mins}p`;
}

// Időformázás hh:mm:ss formátumban (másodpercekből)
function formatTimeHMS(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Idő konvertálás (perc -> óra:perc:másodperc)
function minutesToHMS(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.floor(totalMinutes % 60);
  const seconds = Math.floor((totalMinutes % 1) * 60);
  return {
    hours: hours.toString().padStart(2, '0'),
    minutes: minutes.toString().padStart(2, '0'),
    seconds: seconds.toString().padStart(2, '0')
  };
}

// Random HEX szín generálás (vizuálisan kellemes, élénk színek)
function generateRandomHexColor() {
  // HSL-ből generálunk, hogy szép, élénk színeket kapjunk
  const h = Math.floor(Math.random() * 360);
  const s = 50 + Math.floor(Math.random() * 40); // 50-90% szaturáció
  const l = 35 + Math.floor(Math.random() * 25); // 35-60% világosság
  return hslToHex(h, s, l);
}

// Random szín generálás
function getRandomColor() {
  return generateRandomHexColor();
}

// Egyedi szín lekérése ami még nem szerepel a projektben (SOHA nem ismétlődik)
function getAvailableColor(usedColors) {
  let color;
  let attempts = 0;
  do {
    color = generateRandomHexColor();
    attempts++;
  } while (usedColors.includes(color) && attempts < 1000);
  return color;
}

// HSL -> HEX konverzió
function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// UUID generálás
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Projekt állapot inicializálása (ha még nincs)
function initializeProjectState(project) {
  if (!project.state) {
    project.state = {
      isRunning: false,
      isPaused: false,
      currentTaskIndex: -1,
      elapsedSeconds: 0,
      startTime: null
    };
  }
  return project;
}

// Oldal betöltésekor
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
// Offline működés telepített appként (csak weboldalként kiszolgálva;
// fájlként megnyitva, pl. az Életszervezőben, a böngésző nem engedi).
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js').catch(function (err) {
      console.warn('Service worker regisztráció sikertelen:', err);
    });
  });
}
