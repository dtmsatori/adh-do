// Beállítások inicializálása
function initSettings() {
  setupSettingsEventListeners();
  loadSettingsUI();
}

// Event listenerek beállítása iOS/Xcode kompatibilitáshoz
function setupSettingsEventListeners() {
  // Header gombok
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', function (e) {
      e.preventDefault();
      toggleThemeFromButton();
    });
    themeToggleBtn.addEventListener('touchend', function (e) {
      e.preventDefault();
      toggleThemeFromButton();
    });
  }

  const dashboardBtn = document.getElementById('dashboardBtn');
  if (dashboardBtn) {
    dashboardBtn.addEventListener('click', function (e) {
      e.preventDefault();
      window.location.href = 'dashboard.html';
    });
    dashboardBtn.addEventListener('touchend', function (e) {
      e.preventDefault();
      window.location.href = 'dashboard.html';
    });
  }

  const backBtn = document.getElementById('backBtn');
  if (backBtn) {
    backBtn.addEventListener('click', function (e) {
      e.preventDefault();
      goBack();
    });
    backBtn.addEventListener('touchend', function (e) {
      e.preventDefault();
      goBack();
    });
  }

  // Hang toggle
  const soundToggle = document.getElementById('soundToggle');
  if (soundToggle) {
    soundToggle.addEventListener('change', function (e) {
      toggleSound();
    });
  }

  // Időformátum gombok
  const format12h = document.getElementById('format12h');
  if (format12h) {
    format12h.addEventListener('click', function (e) {
      e.preventDefault();
      setTimeFormat('12h');
    });
    format12h.addEventListener('touchend', function (e) {
      e.preventDefault();
      setTimeFormat('12h');
    });
  }

  const format24h = document.getElementById('format24h');
  if (format24h) {
    format24h.addEventListener('click', function (e) {
      e.preventDefault();
      setTimeFormat('24h');
    });
    format24h.addEventListener('touchend', function (e) {
      e.preventDefault();
      setTimeFormat('24h');
    });
  }

  // Export gomb
  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', function (e) {
      e.preventDefault();
      exportData();
    });
    exportBtn.addEventListener('touchend', function (e) {
      e.preventDefault();
      exportData();
    });
  }

  // Import gomb
  const importBtn = document.getElementById('importBtn');
  if (importBtn) {
    importBtn.addEventListener('click', function (e) {
      e.preventDefault();
      document.getElementById('importFileInput').click();
    });
    importBtn.addEventListener('touchend', function (e) {
      e.preventDefault();
      document.getElementById('importFileInput').click();
    });
  }

  // Import file input
  const importFileInput = document.getElementById('importFileInput');
  if (importFileInput) {
    importFileInput.addEventListener('change', function (e) {
      importData(e);
    });
  }

  // Clear data gomb
  const clearDataBtn = document.getElementById('clearDataBtn');
  if (clearDataBtn) {
    clearDataBtn.addEventListener('click', function (e) {
      e.preventDefault();
      clearAllData();
    });
    clearDataBtn.addEventListener('touchend', function (e) {
      e.preventDefault();
      clearAllData();
    });
  }
}

// UI elemek betöltése az aktuális beállításokkal
function loadSettingsUI() {
  const settings = getSettings();

  // Hang toggle
  const soundToggle = document.getElementById('soundToggle');
  const soundIndicator = document.getElementById('soundToggleIndicator');
  if (settings.soundEnabled) {
    soundToggle.checked = true;
    soundIndicator.style.transform = 'translateX(20px)';
  } else {
    soundToggle.checked = false;
    soundIndicator.style.transform = 'translateX(0)';
  }

  // Időformátum
  updateTimeFormatButtons(settings.timeFormat);
}

// Téma váltás
function toggleTheme() {
  const settings = getSettings();
  const themeToggle = document.getElementById('themeToggle');
  const themeIndicator = document.getElementById('themeToggleIndicator');

  if (themeToggle.checked) {
    settings.theme = 'dark';
    themeIndicator.style.transform = 'translateX(20px)';
  } else {
    settings.theme = 'light';
    themeIndicator.style.transform = 'translateX(0)';
  }

  saveSettings(settings);
}

// Hang váltás
function toggleSound() {
  const settings = getSettings();
  const soundToggle = document.getElementById('soundToggle');
  const soundIndicator = document.getElementById('soundToggleIndicator');

  if (soundToggle.checked) {
    settings.soundEnabled = true;
    soundIndicator.style.transform = 'translateX(20px)';
  } else {
    settings.soundEnabled = false;
    soundIndicator.style.transform = 'translateX(0)';
  }

  saveSettings(settings);
}

// Időformátum beállítása
function setTimeFormat(format) {
  const settings = getSettings();
  settings.timeFormat = format;
  saveSettings(settings);
  updateTimeFormatButtons(format);
}

// Időformátum gombok frissítése
function updateTimeFormatButtons(format) {
  const format12h = document.getElementById('format12h');
  const format24h = document.getElementById('format24h');

  if (format === '12h') {
    format12h.classList.add('bg-primary', 'text-white', 'shadow-sm');
    format12h.classList.remove('text-gray-800', 'dark:text-gray-200');
    format24h.classList.remove('bg-primary', 'text-white', 'shadow-sm');
    format24h.classList.add('text-gray-800', 'dark:text-gray-200');
  } else {
    format24h.classList.add('bg-primary', 'text-white', 'shadow-sm');
    format24h.classList.remove('text-gray-800', 'dark:text-gray-200');
    format12h.classList.remove('bg-primary', 'text-white', 'shadow-sm');
    format12h.classList.add('text-gray-800', 'dark:text-gray-200');
  }
}

// Összes adat törlése
function clearAllData() {
  if (
    !confirm(
      'FIGYELEM! Ez törölni fogja az összes projektet és beállítást. Biztosan folytatod?'
    )
  ) {
    return;
  }

  if (
    !confirm(
      'Ez a művelet nem visszafordítható! Utoljára kérdezem: biztosan törlöd az összes adatot?'
    )
  ) {
    return;
  }

  localStorage.removeItem(STORAGE_KEYS.PROJECTS);
  localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  localStorage.removeItem(STORAGE_KEYS.USER);

  alert('Az összes adat törölve lett. Az oldal újratöltődik.');
  window.location.href = 'index.html';
}

// Adatok exportálása
function exportData() {
  const projects = getProjects();
  const settings = getSettings();
  const user = localStorage.getItem(STORAGE_KEYS.USER);

  const exportData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    projects: projects,
    settings: settings,
    user: user ? JSON.parse(user) : null
  };

  const dataStr = JSON.stringify(exportData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });

  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `adhdo-backup-${new Date().toISOString().split('T')[0]
    }.json`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  alert('Adatok sikeresen exportálva!');
}

// Adatok importálása
function importData(event) {
  const file = event.target.files[0];
  if (!file) {
    return;
  }

  if (!file.name.endsWith('.json')) {
    alert('Kérlek, csak JSON fájlt tölts fel!');
    return;
  }

  const reader = new FileReader();

  reader.onload = function (e) {
    try {
      const importedData = JSON.parse(e.target.result);

      // Validáció
      if (!importedData.version || !importedData.projects) {
        alert('Érvénytelen backup fájl formátum!');
        return;
      }

      // Megerősítés kérése
      const projectCount = importedData.projects.length;
      const confirmMsg = `Importálás megerősítése:\n\n${projectCount} projekt lesz betöltve.\n\nEz felülírja a jelenlegi adatokat. Folytatod?`;

      if (!confirm(confirmMsg)) {
        return;
      }

      // Adatok importálása
      if (importedData.projects) {
        localStorage.setItem(
          STORAGE_KEYS.PROJECTS,
          JSON.stringify(importedData.projects)
        );
      }

      if (importedData.settings) {
        localStorage.setItem(
          STORAGE_KEYS.SETTINGS,
          JSON.stringify(importedData.settings)
        );
      }

      if (importedData.user) {
        localStorage.setItem(
          STORAGE_KEYS.USER,
          JSON.stringify(importedData.user)
        );
      }

      alert(
        'Adatok sikeresen importálva! Az oldal újratöltődik a változások alkalmazásához.'
      );
      window.location.reload();
    } catch (error) {
      console.error('Import hiba:', error);
      alert('Hiba történt az adatok importálásakor. Ellenőrizd a fájlt!');
    }
  };

  reader.onerror = function () {
    alert('Hiba történt a fájl olvasása közben!');
  };

  reader.readAsText(file);

  // Input reset
  event.target.value = '';
}

// Vissza navigáció
function goBack() {
  // Ha van history, akkor visszalépünk
  if (window.history.length > 1) {
    window.history.back();
  } else {
    // Ha nincs history (pl. direkt URL-ről jött), akkor Dashboard-ra
    window.location.href = 'dashboard.html';
  }
}

// Oldal betöltésekor
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSettings);
} else {
  initSettings();
}