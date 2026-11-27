// Dashboard inicializálás
function initDashboard() {
  setupDashboardEventListeners();
  loadProjects();
  checkPendingTaskMove();
}

// Projekt oldalról érkező "Hozzáadás új projekthez" kérés:
// dashboard.html?moveFrom=<projektId>&tasks=<id1,id2,...>
let pendingTaskMove = null;

function checkPendingTaskMove() {
  const params = new URLSearchParams(window.location.search);
  const from = params.get('moveFrom');
  const ids = (params.get('tasks') || '').split(',').filter(Boolean);
  if (!from || ids.length === 0) return;

  const source = getProjects().find(p => p.id === from);
  if (!source) return;
  const count = source.tasks.filter(t => ids.includes(t.id)).length;
  if (count === 0) return;

  pendingTaskMove = { from, ids };
  showAddProjectModal();
  const title = document.querySelector('#addProjectModal h3');
  if (title) title.textContent = `Új projekt (${count} feladat átkerül ide)`;
}

// Vissza a kiinduló projektbe (Mégse vagy létrehozás után)
function returnToSourceProject() {
  window.location.href = 'project.html?id=' + encodeURIComponent(pendingTaskMove.from);
}

// Új projekt ablak bezárása felhasználói megszakításkor
function cancelAddProject() {
  if (pendingTaskMove) {
    returnToSourceProject();
    return;
  }
  hideAddProjectModal();
}

// Event listenerek beállítása iOS kompatibilitáshoz
function setupDashboardEventListeners() {
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

  // Az "Projekt hozzáadása" gomb mostantól az aktív projektek rácsába ágyazott
  // csempe (lásd createAddProjectTileElement), ezért a saját eseményfigyelőjét
  // a létrehozásakor kapja meg, nem itt.

  // Add Project Modal gombok
  const addImageTabFile = document.getElementById('addImageTabFile');
  if (addImageTabFile) {
    addImageTabFile.addEventListener('click', function (e) {
      e.preventDefault();
      switchAddImageTab('file');
    });
  }

  const addImageTabUrl = document.getElementById('addImageTabUrl');
  if (addImageTabUrl) {
    addImageTabUrl.addEventListener('click', function (e) {
      e.preventDefault();
      switchAddImageTab('url');
    });
  }

  const projectImage = document.getElementById('projectImage');
  if (projectImage) {
    projectImage.addEventListener('change', function (e) {
      previewImage();
    });
  }

  const loadAddImageUrlBtn = document.getElementById('loadAddImageUrlBtn');
  if (loadAddImageUrlBtn) {
    loadAddImageUrlBtn.addEventListener('click', function (e) {
      e.preventDefault();
      loadAddImageFromUrl();
    });
  }

  const removeImageBtn = document.getElementById('removeImageBtn');
  if (removeImageBtn) {
    removeImageBtn.addEventListener('click', function (e) {
      e.preventDefault();
      removeImage();
    });
  }

  const cancelAddProjectBtn = document.getElementById('cancelAddProjectBtn');
  if (cancelAddProjectBtn) {
    cancelAddProjectBtn.addEventListener('click', function (e) {
      e.preventDefault();
      cancelAddProject();
    });
  }

  const confirmAddProjectBtn = document.getElementById('confirmAddProjectBtn');
  if (confirmAddProjectBtn) {
    confirmAddProjectBtn.addEventListener('click', function (e) {
      e.preventDefault();
      addProject();
    });
  }

  // Edit Project Modal gombok
  const editImageTabFile = document.getElementById('editImageTabFile');
  if (editImageTabFile) {
    editImageTabFile.addEventListener('click', function (e) {
      e.preventDefault();
      switchEditImageTab('file');
    });
  }

  const editImageTabUrl = document.getElementById('editImageTabUrl');
  if (editImageTabUrl) {
    editImageTabUrl.addEventListener('click', function (e) {
      e.preventDefault();
      switchEditImageTab('url');
    });
  }

  const loadEditImageUrlBtn = document.getElementById('loadEditImageUrlBtn');
  if (loadEditImageUrlBtn) {
    loadEditImageUrlBtn.addEventListener('click', function (e) {
      e.preventDefault();
      loadEditImageFromUrl();
    });
  }

  const removeEditImageBtn = document.getElementById('removeEditImageBtn');
  if (removeEditImageBtn) {
    removeEditImageBtn.addEventListener('click', function (e) {
      e.preventDefault();
      removeEditImage();
    });
  }

  const cancelEditProjectBtn = document.getElementById('cancelEditProjectBtn');
  if (cancelEditProjectBtn) {
    cancelEditProjectBtn.addEventListener('click', function (e) {
      e.preventDefault();
      hideEditProjectModal();
    });
  }

  const confirmEditProjectBtn = document.getElementById('confirmEditProjectBtn');
  if (confirmEditProjectBtn) {
    confirmEditProjectBtn.addEventListener('click', function (e) {
      e.preventDefault();
      saveEditedProject();
    });
  }

  // Modal backdrop kattintás kezelése
  const addProjectModal = document.getElementById('addProjectModal');
  if (addProjectModal) {
    addProjectModal.addEventListener('click', function (e) {
      if (e.target === addProjectModal) {
        cancelAddProject();
      }
    });
  }

  const editProjectModal = document.getElementById('editProjectModal');
  if (editProjectModal) {
    editProjectModal.addEventListener('click', function (e) {
      if (e.target === editProjectModal) {
        hideEditProjectModal();
      }
    });
  }

  // ---- Stepper gombok: Új projekt kezdési időpont ----
  const addProjectStartDec = document.getElementById('addProjectStartDec');
  if (addProjectStartDec) {
    addProjectStartDec.addEventListener('click', function (e) {
      e.preventDefault();
      adjustDateTimeInput('projectStartDate', -15);
    });
  }
  const addProjectStartInc = document.getElementById('addProjectStartInc');
  if (addProjectStartInc) {
    addProjectStartInc.addEventListener('click', function (e) {
      e.preventDefault();
      adjustDateTimeInput('projectStartDate', 15);
    });
  }

  // ---- Stepper gombok: Szerkesztés projekt kezdési időpont ----
  const editProjectStartDec = document.getElementById('editProjectStartDec');
  if (editProjectStartDec) {
    editProjectStartDec.addEventListener('click', function (e) {
      e.preventDefault();
      adjustDateTimeInput('editProjectStartDate', -15);
    });
  }
  const editProjectStartInc = document.getElementById('editProjectStartInc');
  if (editProjectStartInc) {
    editProjectStartInc.addEventListener('click', function (e) {
      e.preventDefault();
      adjustDateTimeInput('editProjectStartDate', 15);
    });
  }

  // ---- Címke bevitel: Add / Edit projekt ----
  setupTagInput('addProjectTagInput', addProjectTagsDraft, 'addProjectTagsChips');
  setupTagInput('editProjectTagInput', editProjectTagsDraft, 'editProjectTagsChips');
}

// Projektek betöltése és megjelenítése
// Épp kiválasztott címke-szűrők (csak a munkamenetre él, nem mentjük)
let activeTagFilters = new Set();

function loadProjects() {
  const projects = getProjects();

  // Ha egy projektben már csak kész feladatok maradtak (pl. a hátralévőket
  // törölték vagy átmozgatták), az is befejezett projekt.
  let normalized = false;
  projects.forEach(p => {
    const running = p.state && p.state.isRunning;
    if (!p.completed && !running && p.tasks.length > 0 && p.tasks.every(t => t.completed)) {
      p.completed = true;
      normalized = true;
    }
  });
  if (normalized) saveProjects(projects);
  const activeContainer = document.getElementById('active-projects');
  const completedContainer = document.getElementById('completed-projects');
  const tagFiltersContainer = document.getElementById('tagFilters');

  activeContainer.innerHTML = '';
  completedContainer.innerHTML = '';

  // Szétválasztás aktív és befejezett projektekre
  const activeProjectsAll = projects.filter(p => !p.completed);
  const completedProjects = projects.filter(p => p.completed);

  // Címkék összegyűjtése az aktív projektekből, elavult szűrők törlése
  const allTags = [];
  activeProjectsAll.forEach(p => {
    (p.tags || []).forEach(t => { if (!allTags.includes(t)) allTags.push(t); });
  });
  Array.from(activeTagFilters).forEach(t => {
    if (!allTags.includes(t)) activeTagFilters.delete(t);
  });
  renderTagFilters(tagFiltersContainer, allTags);

  const activeProjects = activeTagFilters.size === 0
    ? activeProjectsAll
    : activeProjectsAll.filter(p => (p.tags || []).some(t => activeTagFilters.has(t)));

  // Aktív projektek megjelenítése
  if (activeProjectsAll.length === 0) {
    activeContainer.innerHTML = `
      <div class="col-span-full text-center py-8">
        <p class="text-gray-500 dark:text-gray-400">Még nincsenek projektjeid. Hozz létre egyet a lenti csempével!</p>
      </div>
    `;
  } else if (activeProjects.length === 0) {
    activeContainer.innerHTML = `
      <div class="col-span-full text-center py-8">
        <p class="text-gray-500 dark:text-gray-400">Nincs a kiválasztott címké(k)nek megfelelő aktív projekt</p>
      </div>
    `;
  } else {
    activeProjects.forEach(project => {
      const card = createProjectCardElement(project);
      activeContainer.appendChild(card);
    });
  }
  activeContainer.appendChild(createAddProjectTileElement());
  activeContainer.appendChild(createImportProjectTileElement());

  // Befejezett projektek megjelenítése
  if (completedProjects.length === 0) {
    completedContainer.innerHTML = `
      <div class="col-span-full text-center py-8">
        <p class="text-gray-500 dark:text-gray-400">Nincs befejezett projekt</p>
      </div>
    `;
  } else {
    completedProjects.forEach(project => {
      const card = createProjectCardElement(project, true);
      completedContainer.appendChild(card);
    });
  }
}

// Címke-szűrő gombsor renderelése az Aktív projektek fölé
function renderTagFilters(container, tags) {
  if (!container) return;
  container.innerHTML = '';
  if (tags.length === 0) return;

  const chipClass = function (on) {
    return 'px-3 py-1 text-sm rounded-full border transition-colors ' +
      (on
        ? 'bg-primary text-white border-primary'
        : 'bg-gray-100 dark:bg-[#1c2127] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-[#3b4754] hover:border-primary');
  };

  const allBtn = document.createElement('button');
  allBtn.type = 'button';
  allBtn.textContent = 'Mind';
  allBtn.className = chipClass(activeTagFilters.size === 0);
  allBtn.addEventListener('click', function () {
    activeTagFilters.clear();
    loadProjects();
  });
  container.appendChild(allBtn);

  tags.forEach(tag => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = tag;
    btn.className = chipClass(activeTagFilters.has(tag));
    btn.addEventListener('click', function () {
      if (activeTagFilters.has(tag)) activeTagFilters.delete(tag);
      else activeTagFilters.add(tag);
      loadProjects();
    });
    container.appendChild(btn);
  });
}

// "Projekt hozzáadása" csempe — a rács utolsó eleme, ugyanúgy, ahogy az
// Életszervező hub is a saját csemperácsába ágyazza az "Új csempe" gombot
// (nem lebegő gomb, hogy ne ütközzön a hub jobb alsó sarki gombjával).
function createAddProjectTileElement() {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.id = 'addProjectBtn';
  btn.className = 'flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-300 dark:border-[#3b4754] text-gray-400 dark:text-gray-500 hover:border-primary hover:text-primary dark:hover:border-primary dark:hover:text-primary transition-colors';
  btn.innerHTML = `
    <span class="material-symbols-outlined text-5xl font-light">add</span>
    <span class="text-lg font-semibold">Projekt hozzáadása</span>
  `;
  btn.addEventListener('click', function (e) {
    e.preventDefault();
    showAddProjectModal();
  });
  btn.addEventListener('touchend', function (e) {
    e.preventDefault();
    showAddProjectModal();
  });
  return btn;
}

// "Projekt betöltése" csempe — fájlból hozzáad egy (vagy több) projektet,
// a meglévőket nem érinti
function createImportProjectTileElement() {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.id = 'importProjectBtn';
  btn.className = 'flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-300 dark:border-[#3b4754] text-gray-400 dark:text-gray-500 hover:border-primary hover:text-primary dark:hover:border-primary dark:hover:text-primary transition-colors';
  btn.innerHTML = `
    <span class="material-symbols-outlined text-5xl font-light">upload_file</span>
    <span class="text-lg font-semibold">Projekt betöltése</span>
    <span class="text-xs px-6 text-center">Mentett projektfájl hozzáadása</span>
  `;
  const open = function (e) {
    e.preventDefault();
    pickProjectFile();
  };
  btn.addEventListener('click', open);
  btn.addEventListener('touchend', open);
  return btn;
}

// --- Egyedi projekt mentése / betöltése ---

const PROJECT_FILE_TYPE = 'adhdo-project';

// Fájlnévbe illő változat (ékezetek és írásjelek nélkül)
function safeFileName(name) {
  return (name || 'projekt')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .slice(0, 50) || 'projekt';
}

// Egy projekt mentése JSON fájlba. Telefonon a megosztás menü nyílik meg
// (Fájlokba mentés, AirDrop, e-mail…), gépen letöltés.
async function exportSingleProject(projectId) {
  const project = getProjects().find(p => p.id === projectId);
  if (!project) {
    alert('A projekt nem található!');
    return;
  }

  const data = {
    type: PROJECT_FILE_TYPE,
    version: '1.0',
    exportDate: new Date().toISOString(),
    project: project
  };
  const fileName = `adhdo-projekt-${safeFileName(project.name)}.json`;
  const json = JSON.stringify(data, null, 2);

  const isTouch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  if (isTouch && navigator.canShare && typeof File === 'function') {
    const file = new File([json], fileName, { type: 'application/json' });
    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: project.name });
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') return; // a felhasználó bezárta
        // egyéb hiba esetén letöltéssel próbálkozunk
      }
    }
  }

  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Fájlválasztó megnyitása
function pickProjectFile() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.style.display = 'none';
  input.addEventListener('change', function () {
    const file = input.files && input.files[0];
    input.remove();
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => importProjectsFromText(e.target.result);
    reader.onerror = () => alert('A fájl nem olvasható!');
    reader.readAsText(file);
  });
  document.body.appendChild(input);
  input.click();
}

// Projekt(ek) hozzáadása fájlból. Elfogad egyedi projektfájlt és a
// Beállítások teljes mentését is — a meglévő projektek nem változnak.
function importProjectsFromText(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch (err) {
    alert('A fájl nem érvényes ADH-Do mentés!');
    return;
  }

  let incoming = [];
  if (data && data.type === PROJECT_FILE_TYPE && data.project) {
    incoming = [data.project];
  } else if (data && Array.isArray(data.projects)) {
    incoming = data.projects;
  }
  incoming = incoming.filter(p => p && typeof p === 'object' && Array.isArray(p.tasks));

  if (incoming.length === 0) {
    alert('A fájlban nem található ADH-Do projekt!');
    return;
  }

  const projects = getProjects();
  const existingIds = new Set(projects.map(p => p.id));
  const added = [];

  for (const src of incoming) {
    const p = JSON.parse(JSON.stringify(src)); // mély másolat

    if (existingIds.has(p.id)) {
      const current = projects.find(x => x.id === p.id);
      const ok = confirm(`A(z) "${p.name}" projekt már megvan ("${current.name}").\n\nHozzáadjam másolatként? (A meglévő nem változik.)`);
      if (!ok) continue;
      p.id = generateUUID();
      p.tasks.forEach(t => { t.id = generateUUID(); });
    }
    if (!p.id) p.id = generateUUID();

    // Betöltött projekt sosem "fut" — álló állapotból indul
    p.state = {
      isRunning: false, isPaused: false, currentTaskIndex: -1, elapsedSeconds: 0,
      startTime: null, endTime: null, segmentStartTime: null, pauseStartTime: null,
      totalPauseDuration: 0, isOnBreak: false, breakDurationSeconds: 0, breakElapsedSeconds: 0
    };

    projects.push(p);
    existingIds.add(p.id);
    added.push(p.name);
  }

  if (added.length === 0) return;

  saveProjects(projects);
  loadProjects();
  alert(added.length === 1
    ? `A(z) "${added[0]}" projekt hozzáadva!`
    : `${added.length} projekt hozzáadva:\n\n• ${added.join('\n• ')}`);
}

// Projekt kártya DOM elem létrehozása (iOS kompatibilis)
function createProjectCardElement(project, isCompleted = false) {
  const progress = calculateProjectProgress(project);
  const totalTime = calculateTotalTime(project);
  const completedTasks = project.tasks.filter(t => t.completed).length;
  const totalTasks = project.tasks.length;

  // Projekt kezdési dátum megjelenítése
  let startDate = 'Nincs megadva';
  if (project.startDate) {
    startDate = new Date(project.startDate).toLocaleString('hu-HU', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } else if (project.plannedStartDate) {
    startDate = new Date(project.plannedStartDate).toLocaleString('hu-HU', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) + ' (tervezett)';
  }

  // Háttér meghatározása
  let backgroundStyle = '';
  if (project.backgroundImage) {
    backgroundStyle = `background-image: url('${project.backgroundImage}'); background-size: cover; background-position: center;`;
  } else if (project.color) {
    backgroundStyle = `background: linear-gradient(135deg, ${project.color} 0%, ${adjustColorBrightness(project.color, -20)} 100%);`;
  } else {
    backgroundStyle = `background: linear-gradient(135deg, #137fec 0%, #0d5fb8 100%);`;
  }

  // Címke-chipek
  const tagsHtml = (project.tags && project.tags.length)
    ? `<div class="flex flex-wrap gap-1.5">${project.tags.map(t => `<span class="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">${t}</span>`).join('')}</div>`
    : '';

  const card = document.createElement('div');
  card.className = `flex flex-col overflow-hidden rounded-xl bg-white dark:bg-[#283039] shadow-sm transition-all hover:shadow-lg ${isCompleted ? 'opacity-70 grayscale' : ''}`;

  card.innerHTML = `
    <div class="relative flex h-40 flex-col justify-between p-4" style="${backgroundStyle}">
      <div class="flex justify-between gap-2">
        ${isCompleted ? `
          <button class="restart-btn flex h-8 w-8 items-center justify-center rounded-full bg-black/30 hover:bg-black/50 transition-colors backdrop-blur-sm" title="Újra" data-project-id="${project.id}">
            <span class="material-symbols-outlined text-white text-lg">refresh</span>
          </button>
        ` : '<div></div>'}
        <div class="flex gap-2">
          <button class="save-btn flex h-8 w-8 items-center justify-center rounded-full bg-black/30 hover:bg-black/50 transition-colors backdrop-blur-sm" title="Projekt mentése fájlba" data-project-id="${project.id}">
            <span class="material-symbols-outlined text-white text-lg">download</span>
          </button>
          <button class="edit-btn flex h-8 w-8 items-center justify-center rounded-full bg-black/30 hover:bg-black/50 transition-colors backdrop-blur-sm" title="Szerkesztés" data-project-id="${project.id}">
            <span class="material-symbols-outlined text-white text-lg">edit</span>
          </button>
          <button class="delete-btn flex h-8 w-8 items-center justify-center rounded-full bg-black/30 hover:bg-black/50 transition-colors backdrop-blur-sm" title="Törlés" data-project-id="${project.id}">
            <span class="material-symbols-outlined text-white text-lg">delete</span>
          </button>
        </div>
      </div>
      <div class="flex items-end justify-between gap-2">
        <div class="open-project cursor-pointer flex-1 min-w-0" data-project-id="${project.id}">
          <h3 class="text-white text-lg font-bold leading-tight drop-shadow-lg">${project.name}</h3>
        </div>
        <button type="button" class="info-btn flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/30 hover:bg-black/50 transition-colors backdrop-blur-sm" title="Feladatok" aria-label="Feladatok">
          <span class="material-symbols-outlined text-white text-lg">info</span>
        </button>
      </div>
    </div>
    <div class="open-project cursor-pointer flex flex-col gap-4 p-4" data-project-id="${project.id}">
      <p class="text-gray-500 dark:text-gray-400 text-sm">
        Kezdés: ${startDate}
      </p>
      ${tagsHtml}
      <div class="flex flex-col gap-2">
        <div class="flex justify-between text-sm">
          <p class="font-medium">Haladás</p>
          <p class="text-gray-500 dark:text-gray-400">${progress}%</p>
        </div>
        <div class="h-2 rounded-full bg-gray-200 dark:bg-[#101922]">
          <div class="h-2 rounded-full bg-primary" style="width: ${progress}%;"></div>
        </div>
      </div>
      <div class="flex items-center gap-4 text-gray-500 dark:text-gray-400 text-sm">
        <span class="flex items-center gap-1.5">
          <span class="material-symbols-outlined text-base">check_box</span>
          ${completedTasks}/${totalTasks}
        </span>
        <span class="flex items-center gap-1.5">
          <span class="material-symbols-outlined text-base">timer</span>
          ${formatTime(totalTime)}
        </span>
      </div>
    </div>
  `;

  // Event listenerek hozzáadása
  const openProjectElements = card.querySelectorAll('.open-project');
  openProjectElements.forEach(el => {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      openProject(project.id);
    });
    el.addEventListener('touchend', function (e) {
      e.preventDefault();
      e.stopPropagation();
      openProject(project.id);
    });
  });

  const editBtn = card.querySelector('.edit-btn');
  if (editBtn) {
    editBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      editProject(project.id);
    });
    editBtn.addEventListener('touchend', function (e) {
      e.preventDefault();
      e.stopPropagation();
      editProject(project.id);
    });
  }

  const deleteBtn = card.querySelector('.delete-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      deleteProject(project.id);
    });
    deleteBtn.addEventListener('touchend', function (e) {
      e.preventDefault();
      e.stopPropagation();
      deleteProject(project.id);
    });
  }

  const restartBtn = card.querySelector('.restart-btn');
  if (restartBtn) {
    restartBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      restartProject(project.id);
    });
    restartBtn.addEventListener('touchend', function (e) {
      e.preventDefault();
      e.stopPropagation();
      restartProject(project.id);
    });
  }

  const saveBtn = card.querySelector('.save-btn');
  if (saveBtn) {
    const save = function (e) {
      e.preventDefault();
      e.stopPropagation();
      exportSingleProject(project.id);
    };
    saveBtn.addEventListener('click', save);
    saveBtn.addEventListener('touchend', save);
  }

  const infoBtn = card.querySelector('.info-btn');
  if (infoBtn) {
    // Egér: ráhúzásra megjelenik, elhúzásra eltűnik (kattintással rögzíthető)
    infoBtn.addEventListener('mouseenter', function () {
      if (!pinnedInfoBtn) showTaskBubble(infoBtn, project);
    });
    infoBtn.addEventListener('mouseleave', function () {
      if (!pinnedInfoBtn) hideTaskBubble();
    });
    const toggle = function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (pinnedInfoBtn === infoBtn) {
        hideTaskBubble();
      } else {
        showTaskBubble(infoBtn, project);
        pinnedInfoBtn = infoBtn;
      }
    };
    infoBtn.addEventListener('click', toggle);
    infoBtn.addEventListener('touchend', toggle); // telefon: koppintásra ki/be
  }

  return card;
}

// Feladatlista buborék — egyetlen, a body-hoz csatolt elem, hogy a kártya
// overflow-hidden / szürkítése ne vágja le és ne halványítsa
let taskBubbleEl = null;
let pinnedInfoBtn = null;

function showTaskBubble(anchor, project) {
  if (!taskBubbleEl) {
    taskBubbleEl = document.createElement('div');
    taskBubbleEl.id = 'taskBubble';
    taskBubbleEl.className = 'fixed z-50 max-w-[280px] max-h-[60vh] overflow-y-auto rounded-lg bg-white dark:bg-[#1c2127] text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-[#3b4754] shadow-xl p-3 text-sm';
    taskBubbleEl.addEventListener('click', e => e.stopPropagation());
    taskBubbleEl.addEventListener('touchend', e => e.stopPropagation());
    document.body.appendChild(taskBubbleEl);
  }
  pinnedInfoBtn = null;
  taskBubbleEl.innerHTML = '';

  const title = document.createElement('p');
  title.className = 'font-semibold mb-2';
  title.textContent = `Feladatok (${project.tasks.length})`;
  taskBubbleEl.appendChild(title);

  if (project.tasks.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'text-gray-500 dark:text-gray-400';
    empty.textContent = 'Nincs feladat';
    taskBubbleEl.appendChild(empty);
  } else {
    const list = document.createElement('ul');
    list.className = 'flex flex-col gap-1';
    project.tasks.forEach(t => {
      const li = document.createElement('li');
      li.className = 'flex items-start gap-1.5' + (t.completed ? ' text-gray-400 dark:text-gray-500 line-through' : '');
      const icon = document.createElement('span');
      icon.className = 'material-symbols-outlined text-base leading-5 ' + (t.completed ? 'text-green-500' : 'text-gray-400');
      icon.textContent = t.completed ? 'check_circle' : 'radio_button_unchecked';
      const name = document.createElement('span');
      name.textContent = t.name;
      li.append(icon, name);
      list.appendChild(li);
    });
    taskBubbleEl.appendChild(list);
  }

  // Elhelyezés: az ikon alá, jobb élhez igazítva; ha nem fér ki, fölé
  taskBubbleEl.style.display = 'block';
  taskBubbleEl.style.visibility = 'hidden';
  const r = anchor.getBoundingClientRect();
  const b = taskBubbleEl.getBoundingClientRect();
  const margin = 8;
  let left = Math.min(r.right - b.width, window.innerWidth - b.width - margin);
  left = Math.max(margin, left);
  let top = r.bottom + 6;
  if (top + b.height > window.innerHeight - margin && r.top - 6 - b.height >= margin) {
    top = r.top - 6 - b.height;
  }
  taskBubbleEl.style.left = left + 'px';
  taskBubbleEl.style.top = top + 'px';
  taskBubbleEl.style.visibility = '';
}

function hideTaskBubble() {
  pinnedInfoBtn = null;
  if (taskBubbleEl) taskBubbleEl.style.display = 'none';
}

// Máshová kattintás / görgetés bezárja a buborékot
document.addEventListener('click', hideTaskBubble);
document.addEventListener('touchend', function (e) {
  if (!e.target.closest || !e.target.closest('.info-btn')) hideTaskBubble();
});
window.addEventListener('scroll', function (e) {
  if (e.target !== taskBubbleEl) hideTaskBubble(); // a buborékon belüli görgetés ne zárja be
}, true);

// Projekt haladás számítása
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

// Összes idő számítása
function calculateTotalTime(project) {
  return project.tasks.reduce((total, task) => total + task.duration, 0);
}

// Projekt megnyitása
function openProject(projectId) {
  window.location.href = `project.html?id=${projectId}`;
}

// ---- Címkék (projektenként rendelhető, opcionális szűrők) ----
let addProjectTagsDraft = [];
let editProjectTagsDraft = [];

// Címke-chipek renderelése egy modal belsejébe (hozzáadás/szerkesztés közös)
function renderDraftTagChips(chipsContainerId, tagsArray) {
  const container = document.getElementById(chipsContainerId);
  if (!container) return;
  renderTagSuggestions(chipsContainerId, tagsArray);
  container.innerHTML = '';
  tagsArray.forEach((tag, idx) => {
    const chip = document.createElement('span');
    chip.className = 'inline-flex items-center gap-1 px-3 py-1 text-sm rounded-full bg-primary/10 text-primary border border-primary/30';
    const label = document.createElement('span');
    label.textContent = tag;
    chip.appendChild(label);
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'text-primary/70 hover:text-primary font-bold leading-none';
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', function () {
      tagsArray.splice(idx, 1);
      renderDraftTagChips(chipsContainerId, tagsArray);
    });
    chip.appendChild(removeBtn);
    container.appendChild(chip);
  });
}

// Meglévő címkék felsorolása a beviteli mező alatt: egy koppintással hozzáadhatók
function renderTagSuggestions(chipsContainerId, tagsArray) {
  const wrap = document.getElementById(chipsContainerId.replace('Chips', 'Suggestions'));
  if (!wrap) return;
  const list = wrap.querySelector('.tag-suggestion-list');
  const allTags = [];
  getProjects().forEach(p => (p.tags || []).forEach(t => {
    if (!allTags.some(a => a.toLowerCase() === t.toLowerCase())) allTags.push(t);
  }));
  const available = allTags
    .filter(t => !tagsArray.some(d => d.toLowerCase() === t.toLowerCase()))
    .sort((a, b) => a.localeCompare(b, 'hu'));
  list.innerHTML = '';
  wrap.classList.toggle('hidden', available.length === 0);
  available.forEach(tag => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'inline-flex items-center gap-0.5 px-2.5 py-1 text-sm rounded-full border border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-primary hover:text-primary transition-colors';
    btn.textContent = '+ ' + tag;
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      if (!tagsArray.some(d => d.toLowerCase() === tag.toLowerCase())) tagsArray.push(tag);
      renderDraftTagChips(chipsContainerId, tagsArray);
    });
    list.appendChild(btn);
  });
}

// Beírt szöveg chip-pé alakítása (Enterre VAGY mentés előtt, ha még benne maradt)
function commitTagInput(inputId, tagsArray, chipsContainerId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const val = input.value.trim();
  if (val && !tagsArray.some(t => t.toLowerCase() === val.toLowerCase())) {
    tagsArray.push(val);
    if (chipsContainerId) renderDraftTagChips(chipsContainerId, tagsArray);
  }
  input.value = '';
}

// Címke-beviteli mező: Enterre chip-pé alakítja a beírt szöveget
function setupTagInput(inputId, tagsArray, chipsContainerId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    commitTagInput(inputId, tagsArray, chipsContainerId);
  });
}

// Modal megjelenítése
function showAddProjectModal() {
  document.getElementById('addProjectModal').classList.remove('hidden');
  switchAddImageTab('file'); // Reset tab selection
  addProjectTagsDraft.length = 0;
  renderDraftTagChips('addProjectTagsChips', addProjectTagsDraft);
  const tagInput = document.getElementById('addProjectTagInput');
  if (tagInput) tagInput.value = '';
}

// Modal elrejtése
function hideAddProjectModal() {
  document.getElementById('addProjectModal').classList.add('hidden');
  document.getElementById('projectName').value = '';
  document.getElementById('projectStartDate').value = '';
  document.getElementById('projectImage').value = '';
  document.getElementById('projectImageUrl').value = '';
  document.getElementById('imagePreview').classList.add('hidden');
  addProjectTagsDraft.length = 0;
  renderDraftTagChips('addProjectTagsChips', addProjectTagsDraft);
  const tagInput = document.getElementById('addProjectTagInput');
  if (tagInput) tagInput.value = '';
}

// Kép tab váltás (Add Project)
function switchAddImageTab(tab) {
  const fileTab = document.getElementById('addImageTabFile');
  const urlTab = document.getElementById('addImageTabUrl');
  const fileUpload = document.getElementById('addImageFileUpload');
  const urlInput = document.getElementById('addImageUrlInput');

  if (tab === 'file') {
    fileTab.classList.add('bg-primary', 'text-white');
    fileTab.classList.remove('bg-gray-200', 'dark:bg-gray-700', 'text-gray-800', 'dark:text-gray-200');

    urlTab.classList.remove('bg-primary', 'text-white');
    urlTab.classList.add('bg-gray-200', 'dark:bg-gray-700', 'text-gray-800', 'dark:text-gray-200');

    fileUpload.classList.remove('hidden');
    urlInput.classList.add('hidden');
  } else {
    urlTab.classList.add('bg-primary', 'text-white');
    urlTab.classList.remove('bg-gray-200', 'dark:bg-gray-700', 'text-gray-800', 'dark:text-gray-200');

    fileTab.classList.remove('bg-primary', 'text-white');
    fileTab.classList.add('bg-gray-200', 'dark:bg-gray-700', 'text-gray-800', 'dark:text-gray-200');

    urlInput.classList.remove('hidden');
    fileUpload.classList.add('hidden');
  }
}

// Kép tab váltás (Edit Project)
function switchEditImageTab(tab) {
  const fileTab = document.getElementById('editImageTabFile');
  const urlTab = document.getElementById('editImageTabUrl');
  const fileUpload = document.getElementById('editImageFileUpload');
  const urlInput = document.getElementById('editImageUrlInput');

  if (tab === 'file') {
    fileTab.classList.add('bg-primary', 'text-white');
    fileTab.classList.remove('bg-gray-200', 'dark:bg-gray-700', 'text-gray-800', 'dark:text-gray-200');

    urlTab.classList.remove('bg-primary', 'text-white');
    urlTab.classList.add('bg-gray-200', 'dark:bg-gray-700', 'text-gray-800', 'dark:text-gray-200');

    fileUpload.classList.remove('hidden');
    urlInput.classList.add('hidden');
  } else {
    urlTab.classList.add('bg-primary', 'text-white');
    urlTab.classList.remove('bg-gray-200', 'dark:bg-gray-700', 'text-gray-800', 'dark:text-gray-200');

    fileTab.classList.remove('bg-primary', 'text-white');
    fileTab.classList.add('bg-gray-200', 'dark:bg-gray-700', 'text-gray-800', 'dark:text-gray-200');

    urlInput.classList.remove('hidden');
    fileUpload.classList.add('hidden');
  }
}

// Kép betöltése URL-ből (Add Project)
function loadAddImageFromUrl() {
  const url = document.getElementById('projectImageUrl').value.trim();

  if (!url) {
    alert('Kérlek adj meg egy képet URL-t!');
    return;
  }

  try {
    new URL(url);
  } catch (e) {
    alert('Érvénytelen URL formátum!');
    return;
  }

  document.getElementById('imagePreview').classList.remove('hidden');
  document.getElementById('previewImg').src = url;

  const testImg = new Image();
  testImg.onerror = function () {
    alert('A kép nem tölthető be erről az URL-ről. Ellenőrizd, hogy elérhető-e és képfájl-e.');
    document.getElementById('imagePreview').classList.add('hidden');
  };
  testImg.src = url;
}

// Kép betöltése URL-ből (Edit Project)
function loadEditImageFromUrl() {
  const url = document.getElementById('editProjectImageUrl').value.trim();

  if (!url) {
    alert('Kérlek adj meg egy képet URL-t!');
    return;
  }

  try {
    new URL(url);
  } catch (e) {
    alert('Érvénytelen URL formátum!');
    return;
  }

  document.getElementById('editImagePreview').classList.remove('hidden');
  document.getElementById('editPreviewImg').src = url;

  const testImg = new Image();
  testImg.onerror = function () {
    alert('A kép nem tölthető be erről az URL-ről. Ellenőrizd, hogy elérhető-e és képfájl-e.');
    document.getElementById('editImagePreview').classList.add('hidden');
  };
  testImg.src = url;
}

// Új projekt hozzáadása
function addProject() {
  let name = document.getElementById('projectName').value.trim();
  const startDate = document.getElementById('projectStartDate').value;
  const imageFile = document.getElementById('projectImage').files[0];

  // Ha nincs név és van dátum, akkor a dátum lesz a név
  if (!name && startDate) {
    const date = new Date(startDate);
    name = date.toLocaleString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  }

  if (!name) {
    alert('Kérlek add meg a projekt nevét vagy válassz dátumot!');
    return;
  }

  // Ha maradt be nem küldött (Entert nem kapott) szöveg a címke mezőben, azt is mentjük
  commitTagInput('addProjectTagInput', addProjectTagsDraft, null);

  const projects = getProjects();
  const newProject = {
    id: generateUUID(),
    name: name,
    startDate: null, // Tényleges projekt kezdés (amikor Start gombot nyomnak)
    plannedStartDate: startDate || null, // Tervezett kezdési időpont
    completed: false,
    tasks: [],
    tags: addProjectTagsDraft.slice(),
    backgroundImage: null,
    color: null,
    settings: {
      prepTime: 0,
      autoNext: true,
      pomodoro: {
        enabled: false,
        workMinutes: 25,
        breakMinutes: 5,
        longBreakMinutes: 15,
        cyclesBeforeLongBreak: 4
      }
    },
    createdAt: new Date().toISOString()
  };

  // Mentés + (ha a projekt oldalról jöttünk) a kijelölt feladatok áthelyezése
  function finish() {
    let movedCount = 0;
    if (pendingTaskMove) {
      const source = projects.find(p => p.id === pendingTaskMove.from);
      if (source) {
        const ids = new Set(pendingTaskMove.ids);
        newProject.tasks = source.tasks.filter(t => ids.has(t.id));
        source.tasks = source.tasks.filter(t => !ids.has(t.id));
        movedCount = newProject.tasks.length;
      }
    }
    projects.push(newProject);
    saveProjects(projects);
    if (pendingTaskMove) {
      alert(`${movedCount} feladat átkerült a(z) "${newProject.name}" projektbe!`);
      returnToSourceProject();
      return;
    }
    hideAddProjectModal();
    loadProjects();
  }

  // Ha van kép, akkor azt dolgozzuk fel
  if (imageFile) {
    const reader = new FileReader();
    reader.onload = function (e) {
      newProject.backgroundImage = e.target.result;
      finish();
    };
    reader.readAsDataURL(imageFile);
  } else {
    // URL-ből betöltött kép kezelése
    const imageUrl = document.getElementById('projectImageUrl').value.trim();
    const imagePreview = document.getElementById('imagePreview');
    if (imageUrl && imagePreview && !imagePreview.classList.contains('hidden')) {
      newProject.backgroundImage = imageUrl;
    } else {
      // Nincs kép, random szín generálása
      newProject.color = generateRandomProjectColor();
    }
    finish();
  }
}

// Datetime-local input értékének módosítása percekkel
function adjustDateTimeInput(inputId, minutesDelta) {
  const input = document.getElementById(inputId);
  if (!input) return;

  let date;
  if (input.value) {
    date = new Date(input.value);
  } else {
    date = new Date();
    // Kerekítés a legközelebbi 15 percre
    const mins = date.getMinutes();
    const remainder = mins % 15;
    date.setMinutes(mins - remainder, 0, 0);
  }

  date.setMinutes(date.getMinutes() + minutesDelta);

  // datetime-local formátum: YYYY-MM-DDTHH:MM
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  input.value = `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Oldal betöltésekor
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDashboard);
} else {
  initDashboard();
}

// Szín fényesség módosítása
function adjustColorBrightness(color, percent) {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;
  return (
    '#' +
    (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
  );
}

// Projekt törlése
function deleteProject(projectId) {
  const projects = getProjects();
  const project = projects.find(p => p.id === projectId);

  if (
    !confirm(
      `Biztosan törölni szeretnéd a "${project.name}" projektet?\n\nEz a művelet nem visszafordítható!`
    )
  ) {
    return;
  }

  const updatedProjects = projects.filter(p => p.id !== projectId);
  saveProjects(updatedProjects);
  loadProjects();
}

// Projekt szerkesztése
function editProject(projectId) {
  const projects = getProjects();
  const project = projects.find(p => p.id === projectId);

  if (!project) {
    alert('A projekt nem található!');
    return;
  }

  // Modal megjelenítése
  document.getElementById('editProjectModal').classList.remove('hidden');

  // Adatok betöltése
  document.getElementById('editProjectId').value = project.id;
  document.getElementById('editProjectName').value = project.name;

  // Tervezett kezdési dátum betöltése
  if (project.plannedStartDate) {
    const date = new Date(project.plannedStartDate);
    const formattedDate = date.toISOString().slice(0, 16);
    document.getElementById('editProjectStartDate').value = formattedDate;
  } else if (project.startDate) {
    // Ha nincs plannedStartDate, de van startDate (régi projektek kompatibilitás)
    const date = new Date(project.startDate);
    const formattedDate = date.toISOString().slice(0, 16);
    document.getElementById('editProjectStartDate').value = formattedDate;
  }

  // Kép előnézet
  if (project.backgroundImage) {
    document.getElementById('editImagePreview').classList.remove('hidden');
    document.getElementById('editPreviewImg').src = project.backgroundImage;
  } else {
    document.getElementById('editImagePreview').classList.add('hidden');
  }

  // Címkék betöltése
  editProjectTagsDraft.length = 0;
  (project.tags || []).forEach(t => editProjectTagsDraft.push(t));
  renderDraftTagChips('editProjectTagsChips', editProjectTagsDraft);
  const editTagInput = document.getElementById('editProjectTagInput');
  if (editTagInput) editTagInput.value = '';
}

// Szerkesztés modal elrejtése
function hideEditProjectModal() {
  document.getElementById('editProjectModal').classList.add('hidden');
  document.getElementById('editProjectName').value = '';
  document.getElementById('editProjectStartDate').value = '';
  document.getElementById('editProjectImage').value = '';
  document.getElementById('editImagePreview').classList.add('hidden');
  editProjectTagsDraft.length = 0;
  renderDraftTagChips('editProjectTagsChips', editProjectTagsDraft);
  const editTagInput = document.getElementById('editProjectTagInput');
  if (editTagInput) editTagInput.value = '';
}

// Szerkesztett projekt mentése
function saveEditedProject() {
  const projectId = document.getElementById('editProjectId').value;
  let name = document.getElementById('editProjectName').value.trim();
  const startDate = document.getElementById('editProjectStartDate').value;
  const imageFile = document.getElementById('editProjectImage').files[0];

  // Ha nincs név és van dátum, akkor a dátum lesz a név
  if (!name && startDate) {
    const date = new Date(startDate);
    name = date.toLocaleString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  }

  if (!name) {
    alert('Kérlek add meg a projekt nevét vagy válassz dátumot!');
    return;
  }

  // Ha maradt be nem küldött (Entert nem kapott) szöveg a címke mezőben, azt is mentjük
  commitTagInput('editProjectTagInput', editProjectTagsDraft, null);

  const projects = getProjects();
  const projectIndex = projects.findIndex(p => p.id === projectId);

  if (projectIndex === -1) {
    alert('A projekt nem található!');
    return;
  }

  // Ha van új kép, akkor azt dolgozzuk fel
  if (imageFile) {
    const reader = new FileReader();
    reader.onload = function (e) {
      projects[projectIndex].name = name;
      projects[projectIndex].plannedStartDate = startDate || null;
      projects[projectIndex].tags = editProjectTagsDraft.slice();
      projects[projectIndex].backgroundImage = e.target.result;
      projects[projectIndex].color = null; // Töröljük a színt ha van kép
      saveProjects(projects);
      hideEditProjectModal();
      loadProjects();
    };
    reader.readAsDataURL(imageFile);
  } else {
    // Nincs új kép, csak az adatokat frissítjük
    projects[projectIndex].name = name;
    projects[projectIndex].plannedStartDate = startDate || null;
    projects[projectIndex].tags = editProjectTagsDraft.slice();

    // URL-ből betöltött kép kezelése
    const editImageUrl = document.getElementById('editProjectImageUrl').value.trim();
    const editImagePreview = document.getElementById('editImagePreview');
    if (editImageUrl && editImagePreview && !editImagePreview.classList.contains('hidden')) {
      projects[projectIndex].backgroundImage = editImageUrl;
      projects[projectIndex].color = null;
    }

    saveProjects(projects);
    hideEditProjectModal();
    loadProjects();
  }
}

// Szerkesztési kép eltávolítása
function removeEditImage() {
  const projectId = document.getElementById('editProjectId').value;
  const projects = getProjects();
  const project = projects.find(p => p.id === projectId);

  if (project) {
    project.backgroundImage = null;
    // Random szín generálása
    project.color = generateRandomProjectColor();
    saveProjects(projects);
  }

  document.getElementById('editImagePreview').classList.add('hidden');
  document.getElementById('editProjectImage').value = '';
}

// Kép előnézet (új projekt)
function previewImage() {
  const file = document.getElementById('projectImage').files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      document.getElementById('imagePreview').classList.remove('hidden');
      document.getElementById('previewImg').src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
}

// Kép eltávolítása (új projekt)
function removeImage() {
  document.getElementById('projectImage').value = '';
  document.getElementById('imagePreview').classList.add('hidden');
}

// Random projekt szín generálása
function generateRandomProjectColor() {
  const colors = [
    '#137fec', // Kék
    '#10b981', // Zöld
    '#8b5cf6', // Lila
    '#f59e0b', // Sárga
    '#ef4444', // Piros
    '#ec4899', // Rózsaszín
    '#06b6d4', // Cyan
    '#f97316', // Narancs
    '#84cc16', // Lime
    '#6366f1' // Indigo
  ];

  const projects = getProjects();
  const usedColors = projects
    .map(p => p.color)
    .filter(c => c); // Csak azokat amelyeknek van színe

  // Keresünk olyan színt ami még nincs használva
  const availableColors = colors.filter(c => !usedColors.includes(c));

  if (availableColors.length > 0) {
    return availableColors[Math.floor(Math.random() * availableColors.length)];
  }

  // Ha minden szín használva van, akkor random választunk
  return colors[Math.floor(Math.random() * colors.length)];
}

// Projekt újraindítása
function restartProject(projectId) {
  const projects = getProjects();
  const project = projects.find(p => p.id === projectId);

  if (!project) {
    alert('A projekt nem található!');
    return;
  }

  if (
    !confirm(
      `Biztosan újraindítod a "${project.name}" projektet?\n\nA projekt és az összes feladat 0%-ra áll vissza.`
    )
  ) {
    return;
  }

  // Projekt alaphelyzetbe állítása
  project.completed = false;
  project.startDate = null; // Tényleges kezdés törlése
  // plannedStartDate megmarad!
  project.state = {
    isRunning: false,
    isPaused: false,
    currentTaskIndex: -1,
    elapsedSeconds: 0,
    startTime: null,
    endTime: null,
    pauseStartTime: null,
    totalPauseDuration: 0
  };

  // Összes feladat visszaállítása
  project.tasks.forEach(task => {
    task.completed = false;
    task.progress = 0;
  });

  saveProjects(projects);
  loadProjects();
}