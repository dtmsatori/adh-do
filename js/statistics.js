// Statisztikák inicializálása
function initStatistics() {
  setupStatisticsEventListeners();
  loadStatistics();
}

// Event listenerek beállítása iOS/Xcode kompatibilitáshoz
function setupStatisticsEventListeners() {
  // Header gombok
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

  const settingsBtn = document.getElementById('settingsBtn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', function (e) {
      e.preventDefault();
      window.location.href = 'settings.html';
    });
    settingsBtn.addEventListener('touchend', function (e) {
      e.preventDefault();
      window.location.href = 'settings.html';
    });
  }
}

// Statisztikák betöltése
function loadStatistics() {
  const projects = getProjects();

  // Összesített statisztikák
  const totalProjects = projects.length;
  const completedProjects = projects.filter(p => p.completed).length;
  const totalTasks = projects.reduce((sum, p) => sum + p.tasks.length, 0);

  document.getElementById('totalProjects').textContent = totalProjects;
  document.getElementById('completedProjects').textContent = completedProjects;
  document.getElementById('totalTasks').textContent = totalTasks;

  // Projektek listája
  const projectsList = document.getElementById('projectsList');

  if (projects.length === 0) {
    projectsList.innerHTML = `
      <div class="text-center py-8">
        <p class="text-gray-500 dark:text-gray-400">Még nincsenek projektjeid.</p>
      </div>
    `;
    return;
  }

  projectsList.innerHTML = '';
  projects.forEach(project => {
    const progress = calculateProjectProgress(project);
    const totalTime = calculateTotalTime(project);
    const completedTasks = project.tasks.filter(t => t.completed).length;

    projectsList.innerHTML += `
      <div class="flex flex-col gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg ${project.completed ? 'opacity-60' : ''
      }">
        <div class="flex justify-between items-start">
          <div>
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">${project.name
      }</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              ${completedTasks}/${project.tasks.length} feladat befejezve
            </p>
          </div>
          <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${project.completed
        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400'
      }">
            ${project.completed ? 'Befejezett' : 'Aktív'}
          </span>
        </div>
        <div class="flex items-center gap-4">
          <div class="flex-1">
            <div class="flex justify-between text-sm mb-1">
              <span class="text-gray-600 dark:text-gray-400">Haladás</span>
              <span class="font-semibold">${progress}%</span>
            </div>
            <div class="h-2 rounded-full bg-gray-200 dark:bg-gray-700">
              <div class="h-2 rounded-full bg-primary transition-all" style="width: ${progress}%;"></div>
            </div>
          </div>
          <div class="text-sm text-gray-600 dark:text-gray-400">
            <span class="material-symbols-outlined text-base align-middle">timer</span>
            ${formatTime(totalTime)}
          </div>
        </div>
      </div>
    `;
  });
}

// Projekt haladás számítása (ha nincs már definiálva)
if (typeof calculateProjectProgress === 'undefined') {
  function calculateProjectProgress(project) {
    if (project.tasks.length === 0) return 0;

    const totalDuration = project.tasks.reduce(
      (sum, task) => sum + task.duration,
      0
    );

    if (totalDuration === 0) return 0;

    let weightedProgress = 0;

    project.tasks.forEach(task => {
      const taskWeight = task.duration / totalDuration;
      const taskProgress = task.completed ? 100 : task.progress || 0;
      weightedProgress += taskWeight * taskProgress;
    });

    return Math.round(weightedProgress);
  }
}

// Összes idő számítása (ha nincs már definiálva)
if (typeof calculateTotalTime === 'undefined') {
  function calculateTotalTime(project) {
    return project.tasks.reduce((total, task) => total + task.duration, 0);
  }
}

// Vissza gomb
function goBack() {
  window.location.href = 'settings.html';
}

// Oldal betöltésekor
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initStatistics);
} else {
  initStatistics();
}