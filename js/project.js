console.log('🔥 PROJECT.JS FRISSÍTVE - VERZIÓ 3.0');

let currentProject = null;
let currentTaskIndex = -1;
let isPlaying = false;
let isPaused = false;
let timerInterval = null;
let elapsedSeconds = 0;
let sortable = null;
let projectStartTime = null;
let projectEndTime = null;
let pauseStartTime = null;
let totalPauseDuration = 0;
let timeUpdateInterval = null;
let soundsPlayed = {
  tenMin: false,
  fiveMin: false,
  oneMin: false,
  lastTwelve: false
};
let audioInitialized = false;
let audioElements = {};
let wakeLock = null; // ÚJ: Wake Lock referencia
let isOnBreak = false;
let breakDurationSeconds = 0;
let breakElapsedSeconds = 0;
let tempBreakMode = 'percent';
let tempBreakValue = 0;
// Az aktuális feladat/szünet szegmens fali órás kezdőidőpontja — ebből
// számoljuk vissza az eltelt időt, hogy alvás/lecsukás után is pontos legyen.
let segmentStartTime = null;
// Beszúró mód: az "Új feladat" gomb után + jelek jelennek meg a feladatok
// között; a kiválasztott hely (aktív-feladat index) ide kerül.
let insertMode = false;
let pendingInsertIndex = null;

// Projekt betöltése
function initProject() {
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('id');

  if (!projectId) {
    alert('Nincs projekt azonosító!');
    window.location.href = 'dashboard.html';
    return;
  }

  const projects = getProjects();
  currentProject = projects.find(p => p.id === projectId);

  if (!currentProject) {
    alert('A projekt nem található!');
    window.location.href = 'dashboard.html';
    return;
  }

  console.log('🔵 Projekt betöltve:', currentProject.name);

  // Állapot inicializálása ha nem létezik
  if (!currentProject.state) {
    currentProject.state = {
      isRunning: false,
      isPaused: false,
      currentTaskIndex: -1,
      elapsedSeconds: 0,
      startTime: null,
      endTime: null,
      pauseStartTime: null,
      totalPauseDuration: 0
    };
    console.log('🔵 Új state létrehozva');
  } else {
    console.log('🔵 Meglévő state:', currentProject.state);
  }

  // iOS kompatibilitás: Event listenerek beállítása
  setupProjectEventListeners();

  restoreProjectState();
  loadProjectData();
  initSortable();
  startTimeUpdateInterval();
  updateMuteButton();
}

// Event listenerek beállítása iOS/Xcode kompatibilitáshoz
function setupProjectEventListeners() {
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

  // Projekt info szerkesztése
  const editProjectInfoBtn = document.getElementById('editProjectInfoBtn');
  if (editProjectInfoBtn) {
    editProjectInfoBtn.addEventListener('click', function (e) {
      e.preventDefault();
      editProjectInfo();
    });
    editProjectInfoBtn.addEventListener('touchend', function (e) {
      e.preventDefault();
      editProjectInfo();
    });
  }

  // Projekt újraindítása gomb
  const restartProjectBtn = document.getElementById('restartProjectBtn');
  if (restartProjectBtn) {
    restartProjectBtn.addEventListener('click', function (e) {
      e.preventDefault();
      restartCurrentProject();
    });
    restartProjectBtn.addEventListener('touchend', function (e) {
      e.preventDefault();
      restartCurrentProject();
    });
  }

  // Vezérlő gombok
  const stopBtn = document.getElementById('stopBtn');
  if (stopBtn) {
    stopBtn.addEventListener('click', function (e) {
      e.preventDefault();
      stopProject();
    });
    stopBtn.addEventListener('touchend', function (e) {
      e.preventDefault();
      stopProject();
    });
  }

  const playPauseBtn = document.getElementById('playPauseBtn');
  if (playPauseBtn) {
    playPauseBtn.addEventListener('click', function (e) {
      e.preventDefault();
      togglePlayPause();
    });
    playPauseBtn.addEventListener('touchend', function (e) {
      e.preventDefault();
      togglePlayPause();
    });
  }

  const muteBtn = document.getElementById('muteBtn');
  if (muteBtn) {
    muteBtn.addEventListener('click', function (e) {
      e.preventDefault();
      toggleMute();
    });
    muteBtn.addEventListener('touchend', function (e) {
      e.preventDefault();
      toggleMute();
    });
  }

  // Feladat hozzáadása
  const addTaskBtn = document.getElementById('addTaskBtn');
  if (addTaskBtn) {
    addTaskBtn.addEventListener('click', function (e) {
      e.preventDefault();
      toggleInsertMode();
    });
    addTaskBtn.addEventListener('touchend', function (e) {
      e.preventDefault();
      toggleInsertMode();
    });
  }

  // Add Task Modal gombok
  const cancelAddTaskBtn = document.getElementById('cancelAddTaskBtn');
  if (cancelAddTaskBtn) {
    cancelAddTaskBtn.addEventListener('click', function (e) {
      e.preventDefault();
      hideAddTaskModal();
    });
  }

  const confirmAddTaskBtn = document.getElementById('confirmAddTaskBtn');
  if (confirmAddTaskBtn) {
    confirmAddTaskBtn.addEventListener('click', function (e) {
      e.preventDefault();
      addTask();
    });
  }

  // Több feladat hozzáadása
  const addMultipleTasksBtn = document.getElementById('addMultipleTasksBtn');
  if (addMultipleTasksBtn) {
    addMultipleTasksBtn.addEventListener('click', function (e) {
      e.preventDefault();
      showAddMultipleTasksModal();
    });
    addMultipleTasksBtn.addEventListener('touchend', function (e) {
      e.preventDefault();
      showAddMultipleTasksModal();
    });
  }

  const cancelMultipleTasksBtn = document.getElementById('cancelMultipleTasksBtn');
  if (cancelMultipleTasksBtn) {
    cancelMultipleTasksBtn.addEventListener('click', function (e) {
      e.preventDefault();
      hideAddMultipleTasksModal();
    });
  }

  const confirmMultipleTasksBtn = document.getElementById('confirmMultipleTasksBtn');
  if (confirmMultipleTasksBtn) {
    confirmMultipleTasksBtn.addEventListener('click', function (e) {
      e.preventDefault();
      addMultipleTasks();
    });
  }

  const multipleTasksInput = document.getElementById('multipleTasksInput');
  if (multipleTasksInput) {
    multipleTasksInput.addEventListener('input', function () {
      updateMultipleTasksPreview();
    });
  }

  // Multiple tasks modal backdrop
  const addMultipleTasksModal = document.getElementById('addMultipleTasksModal');
  if (addMultipleTasksModal) {
    addMultipleTasksModal.addEventListener('click', function (e) {
      if (e.target === addMultipleTasksModal) {
        hideAddMultipleTasksModal();
      }
    });
  }

  // ---- Szünet beállítások ----
  const breakSettingsBtn = document.getElementById('breakSettingsBtn');
  if (breakSettingsBtn) {
    breakSettingsBtn.addEventListener('click', function (e) {
      e.preventDefault();
      showBreakSettingsModal();
    });
    breakSettingsBtn.addEventListener('touchend', function (e) {
      e.preventDefault();
      showBreakSettingsModal();
    });
  }

  const breakModePercent = document.getElementById('breakModePercent');
  if (breakModePercent) {
    breakModePercent.addEventListener('click', function (e) {
      e.preventDefault();
      switchBreakMode('percent');
    });
  }

  const breakModeMinutes = document.getElementById('breakModeMinutes');
  if (breakModeMinutes) {
    breakModeMinutes.addEventListener('click', function (e) {
      e.preventDefault();
      switchBreakMode('minutes');
    });
  }

  const breakValueDec = document.getElementById('breakValueDec');
  if (breakValueDec) {
    breakValueDec.addEventListener('click', function (e) {
      e.preventDefault();
      tempBreakValue = Math.max(0, tempBreakValue - 5);
      updateBreakSettingsDisplay();
    });
  }

  const breakValueInc = document.getElementById('breakValueInc');
  if (breakValueInc) {
    breakValueInc.addEventListener('click', function (e) {
      e.preventDefault();
      tempBreakValue = tempBreakValue + 5;
      updateBreakSettingsDisplay();
    });
  }

  const cancelBreakSettingsBtn = document.getElementById('cancelBreakSettingsBtn');
  if (cancelBreakSettingsBtn) {
    cancelBreakSettingsBtn.addEventListener('click', function (e) {
      e.preventDefault();
      hideBreakSettingsModal();
    });
  }

  const confirmBreakSettingsBtn = document.getElementById('confirmBreakSettingsBtn');
  if (confirmBreakSettingsBtn) {
    confirmBreakSettingsBtn.addEventListener('click', function (e) {
      e.preventDefault();
      saveBreakSettings();
    });
  }

  const breakSettingsModal = document.getElementById('breakSettingsModal');
  if (breakSettingsModal) {
    breakSettingsModal.addEventListener('click', function (e) {
      if (e.target === breakSettingsModal) {
        hideBreakSettingsModal();
      }
    });
  }

  // Edit Task Modal gombok
  const moveTaskBtn = document.getElementById('moveTaskBtn');
  if (moveTaskBtn) {
    moveTaskBtn.addEventListener('click', function (e) {
      e.preventDefault();
      moveTask();
    });
  }

  const copyTaskBtn = document.getElementById('copyTaskBtn');
  if (copyTaskBtn) {
    copyTaskBtn.addEventListener('click', function (e) {
      e.preventDefault();
      copyTask();
    });
  }

  const cancelEditTaskBtn = document.getElementById('cancelEditTaskBtn');
  if (cancelEditTaskBtn) {
    cancelEditTaskBtn.addEventListener('click', function (e) {
      e.preventDefault();
      hideEditTaskModal();
    });
  }

  const confirmEditTaskBtn = document.getElementById('confirmEditTaskBtn');
  if (confirmEditTaskBtn) {
    confirmEditTaskBtn.addEventListener('click', function (e) {
      e.preventDefault();
      saveEditedTask();
    });
  }

  // Edit Project Info Modal gombok
  const imageTabFile = document.getElementById('imageTabFile');
  if (imageTabFile) {
    imageTabFile.addEventListener('click', function (e) {
      e.preventDefault();
      switchImageTab('file');
    });
  }

  const imageTabUrl = document.getElementById('imageTabUrl');
  if (imageTabUrl) {
    imageTabUrl.addEventListener('click', function (e) {
      e.preventDefault();
      switchImageTab('url');
    });
  }

  const loadImageFromUrlBtn = document.getElementById('loadImageFromUrlBtn');
  if (loadImageFromUrlBtn) {
    loadImageFromUrlBtn.addEventListener('click', function (e) {
      e.preventDefault();
      loadImageFromUrl();
    });
  }

  const removeProjectInfoImageBtn = document.getElementById('removeProjectInfoImageBtn');
  if (removeProjectInfoImageBtn) {
    removeProjectInfoImageBtn.addEventListener('click', function (e) {
      e.preventDefault();
      removeProjectInfoImage();
    });
  }

  const cancelEditProjectInfoBtn = document.getElementById('cancelEditProjectInfoBtn');
  if (cancelEditProjectInfoBtn) {
    cancelEditProjectInfoBtn.addEventListener('click', function (e) {
      e.preventDefault();
      hideEditProjectInfoModal();
    });
  }

  const confirmEditProjectInfoBtn = document.getElementById('confirmEditProjectInfoBtn');
  if (confirmEditProjectInfoBtn) {
    confirmEditProjectInfoBtn.addEventListener('click', function (e) {
      e.preventDefault();
      saveProjectInfo();
    });
  }

  // Modal backdrop kattintás kezelése
  const addTaskModal = document.getElementById('addTaskModal');
  if (addTaskModal) {
    addTaskModal.addEventListener('click', function (e) {
      if (e.target === addTaskModal) {
        hideAddTaskModal();
      }
    });
  }

  const editTaskModal = document.getElementById('editTaskModal');
  if (editTaskModal) {
    editTaskModal.addEventListener('click', function (e) {
      if (e.target === editTaskModal) {
        hideEditTaskModal();
      }
    });
  }

  const editProjectInfoModal = document.getElementById('editProjectInfoModal');
  if (editProjectInfoModal) {
    editProjectInfoModal.addEventListener('click', function (e) {
      if (e.target === editProjectInfoModal) {
        hideEditProjectInfoModal();
      }
    });
  }

  // Batch delete gomb
  const batchDeleteBtn = document.getElementById('batchDeleteBtn');
  if (batchDeleteBtn) {
    batchDeleteBtn.addEventListener('click', function (e) {
      e.preventDefault();
      batchDeleteTasks();
    });
  }

  // Batch "Kész" gomb
  const batchCompleteBtn = document.getElementById('batchCompleteBtn');
  if (batchCompleteBtn) {
    batchCompleteBtn.addEventListener('click', function (e) {
      e.preventDefault();
      batchCompleteTasks();
    });
  }

  // Hozzáadás új projekthez gomb
  const batchNewProjectBtn = document.getElementById('batchNewProjectBtn');
  if (batchNewProjectBtn) {
    batchNewProjectBtn.addEventListener('click', function (e) {
      e.preventDefault();
      batchMoveToNewProject();
    });
  }

  // Batch move gomb
  const batchMoveBtn = document.getElementById('batchMoveBtn');
  if (batchMoveBtn) {
    batchMoveBtn.addEventListener('click', function (e) {
      e.preventDefault();
      batchMoveTasks();
    });
  }

  // Batch copy gomb
  const batchCopyBtn = document.getElementById('batchCopyBtn');
  if (batchCopyBtn) {
    batchCopyBtn.addEventListener('click', function (e) {
      e.preventDefault();
      batchCopyTasks();
    });
  }

  // Select all checkbox
  const selectAllCheckbox = document.getElementById('selectAllCheckbox');
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener('change', function () {
      toggleSelectAllTasks(this.checked);
    });
  }

  // Toggle move/copy section
  const toggleMoveCopyBtn = document.getElementById('toggleMoveCopyBtn');
  if (toggleMoveCopyBtn) {
    toggleMoveCopyBtn.addEventListener('click', function (e) {
      e.preventDefault();
      toggleMoveCopySection();
    });
  }

  // ---- Stepper gombok: Új feladat modal ----
  const taskHoursDec = document.getElementById('taskHoursDec');
  if (taskHoursDec) {
    taskHoursDec.addEventListener('click', function (e) {
      e.preventDefault();
      const input = document.getElementById('taskHours');
      input.value = Math.max(0, parseInt(input.value || 0) - 1);
    });
  }
  const taskHoursInc = document.getElementById('taskHoursInc');
  if (taskHoursInc) {
    taskHoursInc.addEventListener('click', function (e) {
      e.preventDefault();
      const input = document.getElementById('taskHours');
      input.value = parseInt(input.value || 0) + 1;
    });
  }
  const taskMinutesDec = document.getElementById('taskMinutesDec');
  if (taskMinutesDec) {
    taskMinutesDec.addEventListener('click', function (e) {
      e.preventDefault();
      const input = document.getElementById('taskMinutes');
      input.value = Math.max(0, parseInt(input.value || 0) - 1);
    });
  }
  const taskMinutesInc = document.getElementById('taskMinutesInc');
  if (taskMinutesInc) {
    taskMinutesInc.addEventListener('click', function (e) {
      e.preventDefault();
      const input = document.getElementById('taskMinutes');
      input.value = Math.min(59, parseInt(input.value || 0) + 1);
    });
  }

  // ---- Stepper gombok: Szerkesztés modal ----
  const editTaskHoursDec = document.getElementById('editTaskHoursDec');
  if (editTaskHoursDec) {
    editTaskHoursDec.addEventListener('click', function (e) {
      e.preventDefault();
      const input = document.getElementById('editTaskHours');
      input.value = Math.max(0, parseInt(input.value || 0) - 1);
    });
  }
  const editTaskHoursInc = document.getElementById('editTaskHoursInc');
  if (editTaskHoursInc) {
    editTaskHoursInc.addEventListener('click', function (e) {
      e.preventDefault();
      const input = document.getElementById('editTaskHours');
      input.value = parseInt(input.value || 0) + 1;
    });
  }
  const editTaskMinutesDec = document.getElementById('editTaskMinutesDec');
  if (editTaskMinutesDec) {
    editTaskMinutesDec.addEventListener('click', function (e) {
      e.preventDefault();
      const input = document.getElementById('editTaskMinutes');
      input.value = Math.max(0, parseInt(input.value || 0) - 1);
    });
  }
  const editTaskMinutesInc = document.getElementById('editTaskMinutesInc');
  if (editTaskMinutesInc) {
    editTaskMinutesInc.addEventListener('click', function (e) {
      e.preventDefault();
      const input = document.getElementById('editTaskMinutes');
      input.value = Math.min(59, parseInt(input.value || 0) + 1);
    });
  }

  // ---- Több feladat: elhelyezés (lista teteje / alja) ----
  const multiplePositionTop = document.getElementById('multiplePositionTop');
  const multiplePositionBottom = document.getElementById('multiplePositionBottom');
  if (multiplePositionTop && multiplePositionBottom) {
    multiplePositionTop.addEventListener('click', function (e) {
      e.preventDefault();
      setMultiplePosition('top');
    });
    multiplePositionBottom.addEventListener('click', function (e) {
      e.preventDefault();
      setMultiplePosition('bottom');
    });
  }

  // ---- Stepper gombok: Projekt szerkesztés kezdési időpont ----
  const editProjectInfoStartDec = document.getElementById('editProjectInfoStartDec');
  if (editProjectInfoStartDec) {
    editProjectInfoStartDec.addEventListener('click', function (e) {
      e.preventDefault();
      adjustDateTimeInput('editProjectInfoStartDate', -15);
    });
  }
  const editProjectInfoStartInc = document.getElementById('editProjectInfoStartInc');
  if (editProjectInfoStartInc) {
    editProjectInfoStartInc.addEventListener('click', function (e) {
      e.preventDefault();
      adjustDateTimeInput('editProjectInfoStartDate', 15);
    });
  }
}

// Projekt állapot visszaállítása
function restoreProjectState() {
  if (!currentProject.state) return;

  const state = currentProject.state;
  console.log('🟢 Állapot visszaállítása:', state);

  if (state.isRunning || state.isPaused) {
    isPlaying = state.isRunning;
    isPaused = state.isPaused;
    currentTaskIndex = state.currentTaskIndex;
    elapsedSeconds = state.elapsedSeconds;
    projectStartTime = state.startTime ? new Date(state.startTime) : null;
    projectEndTime = state.endTime ? new Date(state.endTime) : null;
    // Régi mentésekben (a wall-clock javítás előtt) még nincs segmentStartTime —
    // ilyenkor a projekt indulási idejére esünk vissza.
    segmentStartTime = state.segmentStartTime
      ? new Date(state.segmentStartTime)
      : (projectStartTime ? new Date(projectStartTime.getTime()) : null);
    pauseStartTime = state.pauseStartTime
      ? new Date(state.pauseStartTime)
      : null;
    totalPauseDuration = state.totalPauseDuration || 0;
    isOnBreak = state.isOnBreak || false;
    breakDurationSeconds = state.breakDurationSeconds || 0;
    breakElapsedSeconds = state.breakElapsedSeconds || 0;

    console.log('🟢 Folytatás:', {
      isPlaying,
      isPaused,
      currentTaskIndex,
      elapsedSeconds,
      totalPauseDuration,
      isOnBreak,
      breakDurationSeconds,
      breakElapsedSeconds
    });

    const activeTasks = currentProject.tasks.filter(t => !t.completed);
    if (currentTaskIndex >= 0 && currentTaskIndex < activeTasks.length) {
      if (isOnBreak) {
        document.getElementById('currentTaskStatus').textContent = 'Szünet';
        document.getElementById('currentTaskName').textContent =
          '☕ ' + formatBreakDuration(breakDurationSeconds) + ' szünet';
      } else {
        document.getElementById('currentTaskName').textContent =
          activeTasks[currentTaskIndex].name;
      }

      if (isPaused) {
        document.getElementById('currentTaskStatus').textContent =
          isOnBreak ? 'Szünet (szüneteltetve)' : 'Szüneteltetve';
        updatePlayPauseButton();
        document.getElementById('stopBtn').disabled = false;
        if (!pauseStartTime) {
          pauseStartTime = new Date();
        }
        // Wake Lock visszaállítása szünet esetén is
        requestWakeLock();
      } else if (isPlaying) {
        document.getElementById('currentTaskStatus').textContent = isOnBreak ? 'Szünet' : 'Fut';
        updatePlayPauseButton();
        document.getElementById('stopBtn').disabled = false;
        initAudio();
        // Wake Lock visszaállítása futó projekt esetén
        requestWakeLock();
        // Először szinkronizálunk a fali órával (pl. alvás/lecsukás után),
        // csak utána indul a vizuális timer a friss állapottal.
        resyncFromWallClock();
        if (isPlaying) {
          startTimer();
          stopTimeUpdateInterval();
        }
      }
    }
  }
}

// Élő időfrissítés indítása
function startTimeUpdateInterval() {
  if (timeUpdateInterval) {
    clearInterval(timeUpdateInterval);
  }

  timeUpdateInterval = setInterval(() => {
    if (!isPlaying) {
      updateTimeLabels(); // Ez már tartalmazza az updateTaskStartTimes()-t is
    }
  }, 1000);
}

// Élő időfrissítés leállítása
function stopTimeUpdateInterval() {
  if (timeUpdateInterval) {
    clearInterval(timeUpdateInterval);
    timeUpdateInterval = null;
  }
}

// Projekt adatok betöltése
function loadProjectData() {
  document.getElementById('projectTitle').textContent = currentProject.name;
  updateProjectProgress();
  updateTotalTime();
  updateRemainingTime();
  loadTasks();
  updateTimeline();
  updateTimeLabels();

  // Szünet gomb vizuális állapota
  const breakBtn = document.getElementById('breakSettingsBtn');
  if (breakBtn) {
    const bs = currentProject.breakSettings;
    if (bs && bs.value > 0) {
      breakBtn.classList.remove('border-gray-300', 'dark:border-gray-700', 'text-gray-500', 'dark:text-gray-400');
      breakBtn.classList.add('border-primary', 'dark:border-primary', 'text-primary', 'dark:text-primary', 'bg-primary/5');
    } else {
      breakBtn.classList.add('border-gray-300', 'dark:border-gray-700', 'text-gray-500', 'dark:text-gray-400');
      breakBtn.classList.remove('border-primary', 'dark:border-primary', 'text-primary', 'dark:text-primary', 'bg-primary/5');
    }
  }

  // Restart gomb megjelenítése ha minden feladat kész
  const restartBtn = document.getElementById('restartProjectBtn');
  if (restartBtn) {
    const allCompleted = currentProject.tasks.length > 0 && currentProject.tasks.every(t => t.completed);
    if (allCompleted) {
      restartBtn.classList.remove('hidden');
      restartBtn.classList.add('flex');
    } else {
      restartBtn.classList.add('hidden');
      restartBtn.classList.remove('flex');
    }
  }
}

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

// Projekt haladás frissítése
function updateProjectProgress() {
  const progress = calculateProjectProgress(currentProject);
  document.getElementById('projectProgress').textContent = `${progress}%`;
}

// Összes idő frissítése
function updateTotalTime() {
  const activeTasks = currentProject.tasks.filter(t => !t.completed);
  const totalSeconds = activeTasks.reduce(
    (sum, task) => sum + task.duration * 60,
    0
  ) + getTotalBreakSeconds();
  document.getElementById('totalTime').textContent =
    formatTimeHMS(totalSeconds);
}

// Hátralévő idő frissítése
function updateRemainingTime() {
  const activeTasks = currentProject.tasks.filter(t => !t.completed);

  if (
    !isPlaying ||
    currentTaskIndex === -1 ||
    currentTaskIndex >= activeTasks.length
  ) {
    const totalSeconds = activeTasks.reduce(
      (sum, task) => sum + task.duration * 60,
      0
    ) + getTotalBreakSeconds();
    document.getElementById('remainingTime').textContent =
      formatTimeHMS(totalSeconds);
    return;
  }

  const currentTask = activeTasks[currentTaskIndex];

  if (!currentTask) {
    document.getElementById('remainingTime').textContent = '00:00:00';
    return;
  }

  let totalRemainingSeconds = 0;

  if (isOnBreak) {
    // Szünetben: hátralévő szünet + összes aktív feladat + jövőbeli szünetek
    const breakRemaining = Math.max(0, breakDurationSeconds - breakElapsedSeconds);
    const allTasksSeconds = activeTasks.reduce((sum, task) => sum + task.duration * 60, 0);
    // Jövőbeli szünetek (aktív feladatok között, kivéve az utolsó után)
    let futureBreaks = 0;
    for (let i = 0; i < activeTasks.length - 1; i++) {
      futureBreaks += getBreakDurationForTask(activeTasks[i]);
    }
    totalRemainingSeconds = breakRemaining + allTasksSeconds + futureBreaks;
  } else {
    const currentTaskRemainingSeconds = Math.max(0, currentTask.duration * 60 - elapsedSeconds);
    const remainingTasksSeconds = activeTasks
      .slice(currentTaskIndex + 1)
      .reduce((sum, task) => sum + task.duration * 60, 0);
    const remainingBreakSec = getRemainingBreakSeconds();
    totalRemainingSeconds = currentTaskRemainingSeconds + remainingTasksSeconds + remainingBreakSec;
  }

  document.getElementById('remainingTime').textContent = formatTimeHMS(
    totalRemainingSeconds
  );
}

// Feladatok betöltése (iOS kompatibilis DOM-alapú verzió)
function loadTasks() {
  const tasksList = document.getElementById('tasksList');
  const completedTasksList = document.getElementById('completedTasksList');
  const completedSection = document.getElementById('completedTasksSection');

  tasksList.innerHTML = '';
  completedTasksList.innerHTML = '';

  // Batch toolbar visszaállítása
  const batchToolbar = document.getElementById('batchDeleteToolbar');
  if (batchToolbar) {
    batchToolbar.classList.add('hidden');
    batchToolbar.style.display = '';
  }
  const selectAllCb = document.getElementById('selectAllCheckbox');
  if (selectAllCb) {
    selectAllCb.checked = false;
    selectAllCb.indeterminate = false;
  }

  const activeTasks = currentProject.tasks.filter(t => !t.completed);
  const completedTasks = currentProject.tasks.filter(t => t.completed);

  if (activeTasks.length === 0) {
    if (insertMode) {
      insertMode = false;
      updateAddTaskButton();
    }
    tasksList.innerHTML = `
      <div class="text-center py-8">
        <p class="text-gray-500 dark:text-gray-400">
          Még nincsenek feladatok. Kattints az "Új feladat hozzáadása" gombra!
        </p>
      </div>
    `;
  } else {
    activeTasks.forEach((task, index) => {
      // Szünet kártya beszúrása a feladat ELÉ (ha épp szünetben vagyunk ennél az indexnél)
      if (isOnBreak && isPlaying && index === currentTaskIndex) {
        const breakCard = createBreakCardElement(task, index, true);
        tasksList.appendChild(breakCard);
      }

      if (insertMode && index >= getMinInsertIndex()) {
        tasksList.appendChild(createInsertMarkerElement(index));
      }

      const cardElement = createTaskCardElement(task, index);
      tasksList.appendChild(cardElement);

      // Szünet kártya beszúrása a feladat UTÁN (ha van szünet beállítás és nem az utolsó feladat)
      if (index < activeTasks.length - 1) {
        const breakSec = getBreakDurationForTask(task);
        if (breakSec > 0 && !(isOnBreak && isPlaying && index === currentTaskIndex)) {
          const breakCard = createBreakCardElement(task, index, false);
          tasksList.appendChild(breakCard);
        }
      }
    });

    if (insertMode) {
      tasksList.appendChild(createInsertMarkerElement(activeTasks.length));
    }
  }

  if (completedTasks.length > 0) {
    completedSection.classList.remove('hidden');
    completedTasks.forEach(task => {
      const completedCard = createCompletedTaskCard(task);
      completedTasksList.appendChild(completedCard);
    });
  } else {
    completedSection.classList.add('hidden');
  }
}

// Feladat kártya DOM elem létrehozása (iOS kompatibilis)
function createTaskCardElement(task, index) {
  const isRunning = isPlaying && currentTaskIndex === index && !isOnBreak;
  const progress = task.progress || 0;
  const remainingWidth = 100 - progress;

  // Feladat kezdési idejének kiszámítása
  let taskStartTime = null;
  const activeTasks = currentProject.tasks.filter(t => !t.completed);

  if (isPlaying && projectStartTime) {
    // Futó vagy szüneteltetett projekt
    let pauseTime = totalPauseDuration;
    if (isPaused && pauseStartTime) {
      pauseTime += new Date().getTime() - pauseStartTime.getTime();
    }

    if (index === currentTaskIndex && !isOnBreak) {
      // Aktuális feladat
      taskStartTime = new Date(projectStartTime.getTime() +
        activeTasks.slice(0, currentTaskIndex).reduce((sum, t) => sum + t.duration * 60 * 1000, 0) +
        totalPauseDuration);
    } else if (index > currentTaskIndex || (isOnBreak && index === currentTaskIndex)) {
      // Következő feladatok (vagy aktuális feladat szünet alatt)
      let accumulatedSeconds = 0;

      if (isOnBreak) {
        accumulatedSeconds += Math.max(0, breakDurationSeconds - breakElapsedSeconds);
        for (let i = currentTaskIndex; i < index; i++) {
          accumulatedSeconds += activeTasks[i].duration * 60;
          if (i < index - 1) accumulatedSeconds += getBreakDurationForTask(activeTasks[i]);
        }
      } else {
        const curTask = activeTasks[currentTaskIndex];
        accumulatedSeconds = curTask.duration * 60 - elapsedSeconds;
        accumulatedSeconds += getBreakDurationForTask(curTask);
        for (let i = currentTaskIndex + 1; i < index; i++) {
          accumulatedSeconds += activeTasks[i].duration * 60;
          if (i < index - 1) accumulatedSeconds += getBreakDurationForTask(activeTasks[i]);
        }
      }

      if (isPaused) {
        taskStartTime = new Date(
          pauseStartTime.getTime() + (accumulatedSeconds * 1000)
        );
      } else {
        taskStartTime = new Date(
          new Date().getTime() + (accumulatedSeconds * 1000) + pauseTime
        );
      }
    }
  } else {
    // Megállított projekt vagy tervezett projekt
    const baseTime = currentProject.plannedStartDate
      ? new Date(currentProject.plannedStartDate)
      : new Date();

    let accumulatedSeconds = 0;
    for (let i = 0; i < index; i++) {
      accumulatedSeconds += activeTasks[i].duration * 60;
      if (i < index - 1 || index < activeTasks.length) {
        accumulatedSeconds += getBreakDurationForTask(activeTasks[i]);
      }
    }
    taskStartTime = new Date(baseTime.getTime() + (accumulatedSeconds * 1000));
  }

  // Időpont formázása
  let taskStartLabel = '';
  if (taskStartTime) {
    const settings = getSettings();
    const timeFormat = settings.timeFormat || '24h';
    taskStartLabel = formatTimeLabel(taskStartTime, timeFormat);
  }

  // DOM elem létrehozása
  const card = document.createElement('div');
  card.className = `relative bg-white dark:bg-gray-900/50 rounded-lg shadow-sm overflow-hidden border ${isRunning
    ? 'border-green-500/50 ring-2 ring-green-500/30'
    : 'border-gray-200 dark:border-gray-800'
    }`;
  card.setAttribute('data-task-id', task.id);

  card.innerHTML = `
    <div class="relative p-4 flex flex-wrap sm:flex-nowrap items-center justify-between gap-x-4 gap-y-2">
      <div class="flex items-center gap-3 flex-1 min-w-0">
        <span class="material-symbols-outlined text-gray-400 dark:text-gray-500 cursor-grab drag-handle ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}">drag_indicator</span>
        <div class="task-move-arrows hidden flex-col items-center shrink-0 -my-2">
          <button type="button" class="task-move-up-btn size-6 flex items-center justify-center rounded text-primary hover:bg-primary/10 disabled:opacity-30 disabled:pointer-events-none transition-colors" title="Feljebb">
            <span class="material-symbols-outlined text-xl leading-none">keyboard_arrow_up</span>
          </button>
          <button type="button" class="task-move-down-btn size-6 flex items-center justify-center rounded text-primary hover:bg-primary/10 disabled:opacity-30 disabled:pointer-events-none transition-colors" title="Lejjebb">
            <span class="material-symbols-outlined text-xl leading-none">keyboard_arrow_down</span>
          </button>
        </div>
        <input type="checkbox" class="task-checkbox w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary cursor-pointer shrink-0 ${isRunning ? 'opacity-50 pointer-events-none' : ''}" data-task-id="${task.id}" ${isRunning ? 'disabled' : ''}>
        <div class="flex-1 min-w-0 break-words">
          <p class="font-bold ${isRunning
      ? 'text-green-700 dark:text-green-400'
      : 'text-gray-800 dark:text-gray-200'
    }">${task.name}</p>
          ${task.note
      ? `<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">${formatNoteHtml(task.note)}</p>`
      : ''
    }
          ${isRunning
      ? `<p class="text-sm text-green-600 dark:text-green-400 mt-1 font-semibold">Folyamatban...</p>`
      : ''
    }
        </div>
      </div>
      <div class="flex items-center gap-1 sm:gap-3 shrink-0 ml-auto">
        ${taskStartLabel
      ? `<p class="task-start-time text-gray-400 dark:text-gray-500 font-medium text-sm whitespace-nowrap">▶ ${taskStartLabel}</p>`
      : ''
    }
        <p class="task-time font-medium ${isRunning
      ? 'text-green-700 dark:text-green-400'
      : 'text-gray-700 dark:text-gray-300'
    } sm:min-w-[90px] text-right whitespace-nowrap">
          ${isRunning
      ? formatTimeRemaining(task.duration * 60 - elapsedSeconds)
      : formatTimeRemaining(task.duration * 60)
    }
        </p>
        ${isRunning
      ? `<button class="complete-task-btn size-8 flex items-center justify-center text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-md transition-colors" title="Kész vagyok" data-task-id="${task.id}">
            <span class="material-symbols-outlined text-xl">check_circle</span>
          </button>`
      : ''
    }
        <button class="duplicate-task-btn size-8 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 rounded-md transition-colors ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}" ${isRunning ? 'disabled' : ''} data-task-id="${task.id}" title="Duplikálás">
          <span class="material-symbols-outlined text-xl">content_copy</span>
        </button>
        <button class="edit-task-btn size-8 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}" ${isRunning ? 'disabled' : ''} data-task-id="${task.id}">
          <span class="material-symbols-outlined text-xl">edit</span>
        </button>
        <button class="delete-task-btn size-8 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}" ${isRunning ? 'disabled' : ''} data-task-id="${task.id}">
          <span class="material-symbols-outlined text-xl">delete</span>
        </button>
      </div>
    </div>
    <div class="absolute bottom-0 left-0 right-0 task-progress-bar bg-gray-200 dark:bg-gray-700">
      <div class="h-full transition-all duration-300" style="width: ${remainingWidth}%; background-color: ${task.color};"></div>
    </div>
  `;

  // Checkbox event listener
  const checkbox = card.querySelector('.task-checkbox');
  if (checkbox) {
    checkbox.addEventListener('change', function () {
      updateBatchDeleteToolbar();
    });
  }

  // Kijelölt feladatok mozgatása nyilakkal
  const upBtn = card.querySelector('.task-move-up-btn');
  const downBtn = card.querySelector('.task-move-down-btn');
  [[upBtn, -1], [downBtn, 1]].forEach(([btn, dir]) => {
    if (!btn) return;
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      moveSelectedTasks(dir);
    });
  });

  // Event listenerek hozzáadása
  const completeBtn = card.querySelector('.complete-task-btn');
  if (completeBtn) {
    completeBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      completeTaskEarly(task.id);
    });
    completeBtn.addEventListener('touchend', function (e) {
      e.preventDefault();
      e.stopPropagation();
      completeTaskEarly(task.id);
    });
  }

  const duplicateBtn = card.querySelector('.duplicate-task-btn');
  if (duplicateBtn && !isRunning) {
    duplicateBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      duplicateTask(task.id);
    });
    duplicateBtn.addEventListener('touchend', function (e) {
      e.preventDefault();
      e.stopPropagation();
      duplicateTask(task.id);
    });
  }

  const editBtn = card.querySelector('.edit-task-btn');
  if (editBtn && !isRunning) {
    editBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      editTask(task.id);
    });
    editBtn.addEventListener('touchend', function (e) {
      e.preventDefault();
      e.stopPropagation();
      editTask(task.id);
    });
  }

  const deleteBtn = card.querySelector('.delete-task-btn');
  if (deleteBtn && !isRunning) {
    deleteBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      deleteTask(task.id);
    });
    deleteBtn.addEventListener('touchend', function (e) {
      e.preventDefault();
      e.stopPropagation();
      deleteTask(task.id);
    });
  }

  return card;
}

// Régi createTaskCard megtartva kompatibilitás miatt (nem használjuk)
function createTaskCard(task, index) {
  // Ez a függvény már nem használt, de megtartjuk a kompatibilitás miatt
  return createTaskCardElement(task, index).outerHTML;
}

// Szünet kártya DOM elem létrehozása
function createBreakCardElement(task, index, isActive) {
  const breakSec = getBreakDurationForTask(task);
  const card = document.createElement('div');
  card.className = 'relative rounded-lg overflow-hidden border-2 border-dashed ' +
    (isActive
      ? 'border-yellow-400 dark:border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 ring-2 ring-yellow-400/30'
      : 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800/50');
  card.setAttribute('data-break-card', 'true');

  let timeDisplay = '';
  if (isActive) {
    const remaining = Math.max(0, breakDurationSeconds - breakElapsedSeconds);
    timeDisplay = formatTimeRemaining(remaining);
  } else {
    timeDisplay = formatBreakDuration(breakSec);
  }

  card.innerHTML = `
    <div class="relative px-4 py-2 flex items-center justify-between gap-3">
      <div class="flex items-center gap-2 flex-1">
        <span class="material-symbols-outlined text-gray-400 dark:text-gray-500 text-base">coffee</span>
        <p class="text-xs font-medium ${isActive ? 'text-yellow-700 dark:text-yellow-400' : 'text-gray-500 dark:text-gray-400'}">
          ${isActive ? 'Szünet folyamatban...' : 'Szünet'}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <p class="text-xs font-medium ${isActive ? 'text-yellow-700 dark:text-yellow-400' : 'text-gray-400 dark:text-gray-500'}">${timeDisplay}</p>
        ${isActive
      ? `<button type="button" class="skip-break-btn flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold text-yellow-800 dark:text-yellow-300 bg-yellow-200/70 dark:bg-yellow-800/40 hover:bg-yellow-300 dark:hover:bg-yellow-700/60 transition-colors" title="Szünet átugrása">
            <span class="material-symbols-outlined text-base">skip_next</span>Átugrás
          </button>`
      : ''}
      </div>
    </div>
  `;

  const skipBtn = card.querySelector('.skip-break-btn');
  if (skipBtn) {
    const skip = function (e) {
      e.preventDefault();
      e.stopPropagation();
      skipBreak();
    };
    skipBtn.addEventListener('click', skip);
    skipBtn.addEventListener('touchend', skip);
  }

  return card;
}

// Audio inicializálása
function initAudio() {
  if (audioInitialized) return;

  console.log('Audio inicializálása...');

  audioElements['10min'] = new Audio('snd/10min.mp3');
  audioElements['5min'] = new Audio('snd/5min.mp3');
  audioElements['1min'] = new Audio('snd/1min.mp3');
  audioElements.timer = new Audio('snd/timer.mp3');
  audioElements.completed = new Audio('snd/completed.mp3'); // ÚJ SOR

  audioElements['10min'].load();
  audioElements['5min'].load();
  audioElements['1min'].load();
  audioElements.timer.load();
  audioElements.completed.load(); // ÚJ SOR

  audioElements['10min'].volume = 0.5;
  audioElements['5min'].volume = 0.5;
  audioElements['1min'].volume = 0.5;
  audioElements.timer.volume = 0.5;
  audioElements.completed.volume = 0.7; // ÚJ SOR - kicsit hangosabb

  audioInitialized = true;
  console.log('Audio inicializálva!');
}

// Hang lejátszása
function playSound(soundFile) {
  const settings = getSettings();
  if (!settings.soundEnabled) return;
  if (!audioInitialized) return;

  const soundName = soundFile.replace('.mp3', '');
  const audio = audioElements[soundName];

  if (!audio) return;

  audio.currentTime = 0;
  audio.play().catch(err => console.error('Hang hiba:', err));
}

// Hangok visszaállítása
function resetSounds() {
  soundsPlayed = {
    tenMin: false,
    fiveMin: false,
    oneMin: false,
    lastTwelve: false
  };
}

// Időformázás hátralévő időhöz (HH:MM:SS formátum)
function formatTimeRemaining(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Befejezett feladat kártya DOM elem létrehozása
function createCompletedTaskCard(task) {
  const card = document.createElement('div');
  card.className = 'relative bg-white dark:bg-gray-900/50 rounded-lg shadow-sm overflow-hidden';
  card.setAttribute('data-completed-task-id', task.id);

  card.innerHTML = `
    <div class="absolute inset-0" style="background: linear-gradient(90deg, ${task.color}20 0%, transparent 100%);"></div>
    <div class="relative p-4 flex items-center justify-between gap-4">
      <div class="flex items-center gap-3 flex-1 min-w-0">
        <span class="material-symbols-outlined text-gray-400 dark:text-gray-500">drag_indicator</span>
        <p class="font-medium text-gray-500 dark:text-gray-400 line-through truncate">${task.name}</p>
        <span class="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap shrink-0">${formatTime(task.duration)}</span>
      </div>
      <div class="flex items-center gap-2">
        <button class="restart-task-btn size-8 flex items-center justify-center text-orange-500 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-md transition-colors" title="Újra elvégzés" data-task-id="${task.id}">
          <span class="material-symbols-outlined text-xl">refresh</span>
        </button>
        <span class="material-symbols-outlined text-green-500">check_circle</span>
      </div>
    </div>
  `;

  // Event listener az újraindítás gombhoz
  const restartBtn = card.querySelector('.restart-task-btn');
  if (restartBtn) {
    restartBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      restartSingleTask(task.id);
    });
    restartBtn.addEventListener('touchend', function (e) {
      e.preventDefault();
      e.stopPropagation();
      restartSingleTask(task.id);
    });
  }

  return card;
}

// Timeline frissítése
function updateTimeline() {
  const timelineBar = document.getElementById('timelineBar');
  const timelineProgress = document.getElementById('timelineProgress');
  const timelineMarker = document.getElementById('timelineMarker');

  timelineBar.innerHTML = '';

  const allTasks = currentProject.tasks;
  const taskTotalSeconds = allTasks.reduce((sum, t) => sum + t.duration * 60, 0);

  // Szünetek össz. ideje a timeline-hoz (minden feladat után, kivéve az utolsó)
  let breakTotalSeconds = 0;
  for (let i = 0; i < allTasks.length - 1; i++) {
    breakTotalSeconds += getBreakDurationForTask(allTasks[i]);
  }
  const totalSeconds = taskTotalSeconds + breakTotalSeconds;

  if (totalSeconds === 0) {
    timelineProgress.style.width = '0%';
    timelineMarker.style.left = '0%';
    return;
  }

  allTasks.forEach((task, idx) => {
    // Feladat szegmens
    const percentage = (task.duration * 60 / totalSeconds) * 100;
    const div = document.createElement('div');
    div.className = 'h-full';
    div.style.width = `${percentage}%`;
    div.style.backgroundColor = task.color;
    if (task.completed) {
      div.style.opacity = '0.3';
    }
    timelineBar.appendChild(div);

    // Szünet szegmens a feladat után (kivéve az utolsó)
    if (idx < allTasks.length - 1) {
      const breakSec = getBreakDurationForTask(task);
      if (breakSec > 0) {
        const breakPercentage = (breakSec / totalSeconds) * 100;
        const breakDiv = document.createElement('div');
        breakDiv.className = 'h-full';
        breakDiv.style.width = `${breakPercentage}%`;
        breakDiv.style.backgroundColor = '#9ca3af';
        if (task.completed) {
          breakDiv.style.opacity = '0.3';
        }
        timelineBar.appendChild(breakDiv);
      }
    }
  });

  if (isPlaying && currentTaskIndex >= 0) {
    let elapsedTotalSeconds = 0;

    for (let i = 0; i < allTasks.length; i++) {
      if (allTasks[i].completed) {
        elapsedTotalSeconds += allTasks[i].duration * 60;
        // Befejezett feladat utáni szünet is eltelt
        if (i < allTasks.length - 1) {
          elapsedTotalSeconds += getBreakDurationForTask(allTasks[i]);
        }
      } else {
        const activeTasks = allTasks.filter(t => !t.completed);
        const currentActiveTask = activeTasks[currentTaskIndex];

        if (allTasks[i].id === currentActiveTask.id) {
          if (isOnBreak) {
            // A szünet az előző (befejezett) feladat után van, tehát az aktuális feladat
            // előtt a szünet fut — a szünetet az előző szegmenshez számítjuk
            elapsedTotalSeconds += breakElapsedSeconds;
          } else {
            elapsedTotalSeconds += elapsedSeconds;
          }
          break;
        }
      }
    }

    const progressPercentage = Math.min(
      (elapsedTotalSeconds / totalSeconds) * 100,
      100
    );
    timelineProgress.style.width = `${progressPercentage}%`;
    timelineMarker.style.left = `${progressPercentage}%`;
  } else {
    let completedSeconds = allTasks
      .filter(t => t.completed)
      .reduce((sum, t) => sum + t.duration * 60, 0);

    const progressPercentage =
      totalSeconds > 0
        ? Math.min((completedSeconds / totalSeconds) * 100, 100)
        : 0;

    timelineProgress.style.width = `${progressPercentage}%`;
    timelineMarker.style.left = `${progressPercentage}%`;
  }
}

// Sortable inicializálás
function initSortable() {
  const tasksList = document.getElementById('tasksList');
  if (sortable) {
    sortable.destroy();
  }
  sortable = Sortable.create(tasksList, {
    animation: 150,
    handle: '.drag-handle',
    draggable: '[data-task-id]',
    filter: function (evt, target) {
      // Szünet kártyák nem mozgathatók
      if (target.hasAttribute('data-break-card')) return true;
      if (isPlaying) {
        const taskCards = Array.from(tasksList.querySelectorAll('[data-task-id]'));
        const runningIndex = taskCards.findIndex(card =>
          card.querySelector('.border-green-500\\/50')
        );
        const draggedIndex = taskCards.indexOf(target);
        return draggedIndex === runningIndex;
      }
      return false;
    },
    onEnd: function (evt) {
      // evt.item a ténylegesen mozgatott elem — ebből indulunk ki, nem az
      // evt.oldIndex-ből, mert az a DOM-ban már az ÁTHELYEZÉS UTÁNI állapotra
      // mutatna, ha szünet kártyák is vannak a listában.
      const movedEl = evt.item;
      if (!movedEl || !movedEl.hasAttribute('data-task-id')) {
        loadTasks();
        return;
      }

      const taskId = movedEl.getAttribute('data-task-id');
      const activeTasks = currentProject.tasks.filter(t => !t.completed);
      const oldTaskIndex = activeTasks.findIndex(t => t.id === taskId);

      const newChildren = Array.from(tasksList.children);
      const newTaskChildren = newChildren.filter(el => el.hasAttribute('data-task-id'));
      const newTaskIndex = newTaskChildren.indexOf(movedEl);

      if (oldTaskIndex === -1 || newTaskIndex === -1) {
        loadTasks();
        return;
      }

      if (isPlaying && oldTaskIndex === currentTaskIndex) {
        sortable.option('disabled', false);
        loadTasks();
        return;
      }
      reorderTasks(oldTaskIndex, newTaskIndex);
    }
  });
}

// Feladatok sorrendjének megváltoztatása
function reorderTasks(oldIndex, newIndex) {
  const activeTasks = currentProject.tasks.filter(t => !t.completed);
  if (oldIndex < 0 || oldIndex >= activeTasks.length || newIndex < 0 || newIndex >= activeTasks.length) {
    loadTasks();
    return;
  }
  const [movedTask] = activeTasks.splice(oldIndex, 1);
  activeTasks.splice(newIndex, 0, movedTask);

  const completedTasks = currentProject.tasks.filter(t => t.completed);
  currentProject.tasks = [...activeTasks, ...completedTasks];

  saveCurrentProject();
  loadTasks();
  updateTimeline();
}

// Modal megjelenítése
function showAddTaskModal(insertIndex) {
  pendingInsertIndex = typeof insertIndex === 'number' ? insertIndex : null;
  document.getElementById('addTaskModal').classList.remove('hidden');
  const nameInput = document.getElementById('taskName');
  if (nameInput) nameInput.focus();
}

// Beszúró mód be/ki — üres listánál egyből a modal nyílik
function toggleInsertMode() {
  const activeTasks = currentProject.tasks.filter(t => !t.completed);
  if (activeTasks.length === 0) {
    if (insertMode) setInsertMode(false);
    showAddTaskModal(0);
    return;
  }
  setInsertMode(!insertMode);
}

function setInsertMode(on) {
  insertMode = on;
  updateAddTaskButton();
  loadTasks();
  initSortable();
}

function updateAddTaskButton() {
  const on = insertMode;
  const btn = document.getElementById('addTaskBtn');
  if (btn) {
    btn.classList.toggle('border-primary', on);
    btn.classList.toggle('text-primary', on);
    btn.classList.toggle('bg-primary/10', on);
    const label = btn.querySelector('.font-medium');
    if (label) label.textContent = on ? 'Válassz helyet…' : 'Új feladat';
    const icon = btn.querySelector('.material-symbols-outlined');
    if (icon) icon.textContent = on ? 'close' : 'add';
  }
}

// A legkisebb aktív-index, ahová futó projekt mellett még beszúrhatunk:
// a futó feladat elé nem, szünet alatt viszont a következő feladat elé igen.
function getMinInsertIndex() {
  if (!isPlaying || currentTaskIndex < 0) return 0;
  return isOnBreak ? currentTaskIndex : currentTaskIndex + 1;
}

// Új feladatok beszúrása az aktív feladatok listájának adott pozíciójára
function insertTasksAtActiveIndex(newTasks, activeIndex) {
  const activeTasks = currentProject.tasks.filter(t => !t.completed);
  const pos = Math.max(getMinInsertIndex(), Math.min(activeIndex, activeTasks.length));

  let fullIndex;
  if (pos < activeTasks.length) {
    fullIndex = currentProject.tasks.indexOf(activeTasks[pos]);
  } else if (activeTasks.length > 0) {
    fullIndex = currentProject.tasks.indexOf(activeTasks[activeTasks.length - 1]) + 1;
  } else {
    fullIndex = currentProject.tasks.length;
  }
  currentProject.tasks.splice(fullIndex, 0, ...newTasks);

  // Ha a futó/következő feladat elé került valami, az index eltolódik
  if (isPlaying && currentTaskIndex >= 0 && pos < currentTaskIndex) {
    currentTaskIndex += newTasks.length;
    saveProjectState();
  }
}

// + jel a feladatlistában (beszúró módban)
function createInsertMarkerElement(activeIndex) {
  const wrap = document.createElement('div');
  wrap.className = 'flex justify-center -my-1';
  wrap.setAttribute('data-insert-marker', 'true');
  wrap.innerHTML = `
    <button type="button" class="insert-marker-btn flex items-center justify-center w-8 h-8 rounded-full border-2 border-dashed border-primary text-primary bg-primary/10 hover:bg-primary hover:text-white transition-colors" title="Új feladat ide">
      <span class="material-symbols-outlined text-xl">add</span>
    </button>
  `;
  const btn = wrap.querySelector('button');
  const open = function (e) {
    e.preventDefault();
    e.stopPropagation();
    showAddTaskModal(activeIndex);
  };
  btn.addEventListener('click', open);
  btn.addEventListener('touchend', open);
  return wrap;
}

// Modal elrejtése
function hideAddTaskModal() {
  document.getElementById('addTaskModal').classList.add('hidden');
  document.getElementById('taskName').value = '';
  document.getElementById('taskHours').value = '0';
  document.getElementById('taskMinutes').value = '3';
  document.getElementById('taskNote').value = '';
  pendingInsertIndex = null;
}

// Új feladat hozzáadása
function addTask() {
  const name = document.getElementById('taskName').value.trim();
  const hours = parseInt(document.getElementById('taskHours').value) || 0;
  const minutes = parseInt(document.getElementById('taskMinutes').value) || 0;
  const note = document.getElementById('taskNote').value.trim();

  if (!name) {
    alert('Kérlek add meg a feladat nevét!');
    return;
  }

  const duration = hours * 60 + minutes;
  if (duration <= 0) {
    alert('Az időtartamnak nagyobbnak kell lennie 0 percnél!');
    return;
  }

  const usedColors = currentProject.tasks.map(t => t.color);
  const newTask = {
    id: generateUUID(),
    name: name,
    duration: duration,
    note: note,
    color: getAvailableColor(usedColors),
    completed: false,
    progress: 0
  };

  // Pozíció: a kiválasztott + jel helye, ennek hiányában a lista alja
  const activeCount = currentProject.tasks.filter(t => !t.completed).length;
  const insertIndex = pendingInsertIndex !== null ? pendingInsertIndex : activeCount;
  insertTasksAtActiveIndex([newTask], insertIndex);
  saveCurrentProject();

  // Ha a + jelek egyikével adtuk hozzá, maradunk beszúró módban (több feladathoz)
  const keepInsertMode = insertMode;
  hideAddTaskModal();
  setInsertMode(keepInsertMode);

  loadTasks();
  updateProjectProgress();
  updateTotalTime();
  updateRemainingTime();
  updateTimeline();
  initSortable();

  if (isPlaying && projectStartTime) {
    updateEndTime();
  }
}

// Feladat törlése
function deleteTask(taskId) {
  if (!confirm('Biztosan törölni szeretnéd ezt a feladatot?')) {
    return;
  }

  currentProject.tasks = currentProject.tasks.filter(t => t.id !== taskId);
  saveCurrentProject();
  loadProjectData();
  initSortable();

  if (isPlaying && projectStartTime) {
    updateEndTime();
  }
}

// Feladat szerkesztése modal megnyitása
// Mozgatás/másolás célpontjai: csak a többi, még aktív (nem befejezett) projekt
function getActiveTargetProjects() {
  return getProjects().filter(p =>
    p.id !== currentProject.id &&
    !p.completed &&
    !(p.tasks && p.tasks.length > 0 && p.tasks.every(t => t.completed))
  );
}

function editTask(taskId) {
  const task = currentProject.tasks.find(t => t.id === taskId);
  if (!task) {
    alert('A feladat nem található!');
    return;
  }

  document.getElementById('editTaskModal').classList.remove('hidden');
  document.getElementById('editTaskId').value = task.id;
  document.getElementById('editTaskName').value = task.name;

  const hours = Math.floor(task.duration / 60);
  const minutes = task.duration % 60;
  document.getElementById('editTaskHours').value = hours;
  document.getElementById('editTaskMinutes').value = minutes;
  document.getElementById('editTaskNote').value = task.note || '';

  const targetSelect = document.getElementById('editTaskTargetProject');
  targetSelect.innerHTML = '<option value="">Válassz projektet...</option>';

  getActiveTargetProjects()
    .forEach(p => {
      targetSelect.innerHTML += `<option value="${p.id}">${p.name}</option>`;
    });
}

// Szerkesztett feladat mentése
function saveEditedTask() {
  const taskId = document.getElementById('editTaskId').value;
  const name = document.getElementById('editTaskName').value.trim();
  const hours = parseInt(document.getElementById('editTaskHours').value) || 0;
  const minutes =
    parseInt(document.getElementById('editTaskMinutes').value) || 0;
  const note = document.getElementById('editTaskNote').value.trim();

  if (!name) {
    alert('Kérlek add meg a feladat nevét!');
    return;
  }

  const duration = hours * 60 + minutes;
  if (duration <= 0) {
    alert('Az időtartamnak nagyobbnak kell lennie 0 percnél!');
    return;
  }

  const task = currentProject.tasks.find(t => t.id === taskId);
  if (task) {
    task.name = name;
    task.duration = duration;
    task.note = note;

    saveCurrentProject();
    hideEditTaskModal();
    loadProjectData();

    if (isPlaying && projectStartTime) {
      updateEndTime();
    }
  }
}

// Feladat mozgatása másik projektbe
function moveTask() {
  const taskId = document.getElementById('editTaskId').value;
  const targetProjectId = document.getElementById(
    'editTaskTargetProject'
  ).value;

  if (!targetProjectId) {
    alert('Kérlek válassz egy projektet!');
    return;
  }

  const task = currentProject.tasks.find(t => t.id === taskId);
  if (!task) {
    alert('A feladat nem található!');
    return;
  }

  const projects = getProjects();
  const targetProject = projects.find(p => p.id === targetProjectId);

  if (!targetProject) {
    alert('A célprojekt nem található!');
    return;
  }

  currentProject.tasks = currentProject.tasks.filter(t => t.id !== taskId);
  targetProject.tasks.push(task);

  const projectIndex = projects.findIndex(p => p.id === currentProject.id);
  const targetIndex = projects.findIndex(p => p.id === targetProjectId);
  projects[projectIndex] = currentProject;
  projects[targetIndex] = targetProject;
  saveProjects(projects);

  hideEditTaskModal();
  loadProjectData();
  alert(`Feladat átmozgatva a(z) "${targetProject.name}" projektbe!`);
}

// Feladat másolása másik projektbe
function copyTask() {
  const taskId = document.getElementById('editTaskId').value;
  const targetProjectId = document.getElementById(
    'editTaskTargetProject'
  ).value;

  if (!targetProjectId) {
    alert('Kérlek válassz egy projektet!');
    return;
  }

  const task = currentProject.tasks.find(t => t.id === taskId);
  if (!task) {
    alert('A feladat nem található!');
    return;
  }

  const projects = getProjects();
  const targetProject = projects.find(p => p.id === targetProjectId);

  if (!targetProject) {
    alert('A célprojekt nem található!');
    return;
  }

  const usedColors = targetProject.tasks.map(t => t.color);
  const taskCopy = {
    ...task,
    id: generateUUID(),
    color: getAvailableColor(usedColors),
    completed: false,
    progress: 0
  };

  targetProject.tasks.push(taskCopy);

  const targetIndex = projects.findIndex(p => p.id === targetProjectId);
  projects[targetIndex] = targetProject;
  saveProjects(projects);

  hideEditTaskModal();
  alert(`Feladat másolva a(z) "${targetProject.name}" projektbe!`);
}

// Edit modal elrejtése
function hideEditTaskModal() {
  document.getElementById('editTaskModal').classList.add('hidden');
  document.getElementById('editTaskName').value = '';
  document.getElementById('editTaskHours').value = '0';
  document.getElementById('editTaskMinutes').value = '30';
  document.getElementById('editTaskNote').value = '';
  document.getElementById('editTaskTargetProject').value = '';

  // Mozgatás/másolás szekció becsukása
  const moveCopyContent = document.getElementById('moveCopyContent');
  const moveCopyArrow = document.getElementById('moveCopyArrow');
  if (moveCopyContent) moveCopyContent.classList.add('hidden');
  if (moveCopyArrow) moveCopyArrow.style.transform = 'rotate(0deg)';
}

// Projekt info szerkesztése modal megnyitása
function editProjectInfo() {
  document.getElementById('editProjectInfoModal').classList.remove('hidden');
  document.getElementById('editProjectInfoName').value = currentProject.name;

  if (currentProject.plannedStartDate) {
    const date = new Date(currentProject.plannedStartDate);
    const formattedDate = date.toISOString().slice(0, 16);
    document.getElementById('editProjectInfoStartDate').value = formattedDate;
  }

  // Reset tab selection
  switchImageTab('file');

  if (currentProject.backgroundImage) {
    document.getElementById('editProjectInfoImagePreview').classList.remove('hidden');
    document.getElementById('editProjectInfoPreviewImg').src = currentProject.backgroundImage;
  } else {
    document.getElementById('editProjectInfoImagePreview').classList.add('hidden');
  }
}

// Kép tab váltás
function switchImageTab(tab) {
  const fileTab = document.getElementById('imageTabFile');
  const urlTab = document.getElementById('imageTabUrl');
  const fileUpload = document.getElementById('imageFileUpload');
  const urlInput = document.getElementById('imageUrlInput');

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

// Kép betöltése URL-ből
function loadImageFromUrl() {
  const url = document.getElementById('editProjectInfoImageUrl').value.trim();

  if (!url) {
    alert('Kérlek adj meg egy képet URL-t!');
    return;
  }

  // URL validáció
  try {
    new URL(url);
  } catch (e) {
    alert('Érvénytelen URL formátum!');
    return;
  }

  // Előnézet megjelenítése
  document.getElementById('editProjectInfoImagePreview').classList.remove('hidden');
  document.getElementById('editProjectInfoPreviewImg').src = url;

  // Teszt betöltés - ha nem sikerül, akkor hibát jelzünk
  const testImg = new Image();
  testImg.onload = function () {
    console.log('Kép sikeresen betöltve az URL-ről');
  };
  testImg.onerror = function () {
    alert('A kép nem tölthető be erről az URL-ről. Ellenőrizd, hogy elérhető-e és képfájl-e.');
    document.getElementById('editProjectInfoImagePreview').classList.add('hidden');
  };
  testImg.src = url;
}

// Projekt info modal elrejtése
function hideEditProjectInfoModal() {
  document.getElementById('editProjectInfoModal').classList.add('hidden');
  document.getElementById('editProjectInfoName').value = '';
  document.getElementById('editProjectInfoStartDate').value = '';
  document.getElementById('editProjectInfoImage').value = '';
  document.getElementById('editProjectInfoImagePreview').classList.add('hidden');
}

// Projekt info mentése
function saveProjectInfo() {
  let name = document.getElementById('editProjectInfoName').value.trim();
  const startDate = document.getElementById('editProjectInfoStartDate').value;
  const imageFile = document.getElementById('editProjectInfoImage').files[0];
  const imageUrl = document.getElementById('editProjectInfoImageUrl').value.trim();

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

  if (imageFile) {
    const reader = new FileReader();
    reader.onload = function (e) {
      currentProject.name = name;
      currentProject.plannedStartDate = startDate || null;
      currentProject.backgroundImage = e.target.result;
      currentProject.color = null;

      // Frissítjük a projekt objektumot a projects listában is
      const projects = getProjects();
      const index = projects.findIndex(p => p.id === currentProject.id);
      if (index !== -1) {
        projects[index] = currentProject;
        saveProjects(projects);
      }

      hideEditProjectInfoModal();
      loadProjectData();
    };
    reader.readAsDataURL(imageFile);
  } else {
    currentProject.name = name;
    currentProject.plannedStartDate = startDate || null;

    // URL-ből betöltött kép kezelése
    const previewImg = document.getElementById('editProjectInfoPreviewImg');
    if (imageUrl && previewImg && !document.getElementById('editProjectInfoImagePreview').classList.contains('hidden')) {
      currentProject.backgroundImage = imageUrl;
      currentProject.color = null;
    }

    // Frissítjük a projekt objektumot a projects listában is
    const projects = getProjects();
    const index = projects.findIndex(p => p.id === currentProject.id);
    if (index !== -1) {
      projects[index] = currentProject;
      saveProjects(projects);
    }

    hideEditProjectInfoModal();
    loadProjectData();
  }
}

// Projekt info kép eltávolítása
function removeProjectInfoImage() {
  currentProject.backgroundImage = null;
  currentProject.color = generateRandomProjectColor();
  saveCurrentProject();
  document.getElementById('editProjectInfoImagePreview').classList.add('hidden');
  document.getElementById('editProjectInfoImage').value = '';
  document.getElementById('editProjectInfoImageUrl').value = '';
}

// Random projekt szín generálása
function generateRandomProjectColor() {
  const colors = [
    '#137fec',
    '#10b981',
    '#8b5cf6',
    '#f59e0b',
    '#ef4444',
    '#ec4899',
    '#06b6d4',
    '#f97316',
    '#84cc16',
    '#6366f1'
  ];

  const projects = getProjects();
  const usedColors = projects
    .map(p => p.color)
    .filter(c => c);

  const availableColors = colors.filter(c => !usedColors.includes(c));

  if (availableColors.length > 0) {
    return availableColors[Math.floor(Math.random() * availableColors.length)];
  }

  return colors[Math.floor(Math.random() * colors.length)];
}

// Play/Pause kapcsoló
function togglePlayPause() {
  if (!isPlaying) {
    startProject();
  } else if (isPaused) {
    resumeProject();
  } else {
    pauseProject();
  }
}

// Befejezési idő frissítése
function updateEndTime() {
  if (!projectStartTime) return;

  const activeTasks = currentProject.tasks.filter(t => !t.completed);

  // CSAK a hátralévő feladatok idejét számoljuk
  let remainingSeconds = 0;

  if (isOnBreak) {
    // Szünetben: hátralévő szünet + összes aktív feladat + jövőbeli szünetek
    remainingSeconds += Math.max(0, breakDurationSeconds - breakElapsedSeconds);
    for (let i = 0; i < activeTasks.length; i++) {
      remainingSeconds += activeTasks[i].duration * 60;
    }
    for (let i = 0; i < activeTasks.length - 1; i++) {
      remainingSeconds += getBreakDurationForTask(activeTasks[i]);
    }
  } else {
    for (let i = currentTaskIndex; i < activeTasks.length; i++) {
      if (i === currentTaskIndex) {
        const currentTask = activeTasks[i];
        remainingSeconds += (currentTask.duration * 60) - elapsedSeconds;
      } else {
        remainingSeconds += activeTasks[i].duration * 60;
      }
    }
    // Hátralévő szünetek hozzáadása
    remainingSeconds += getRemainingBreakSeconds();
  }

  // Jelenlegi szünet ideje (ha épp szünetel)
  let currentPauseDuration = totalPauseDuration;
  if (isPaused && pauseStartTime) {
    currentPauseDuration += new Date().getTime() - pauseStartTime.getTime();
  }

  // Befejezési idő = JELENLEGI IDŐ + hátralévő másodpercek + összes szünet
  projectEndTime = new Date(
    new Date().getTime() + (remainingSeconds * 1000) + currentPauseDuration
  );

  console.log('🕐 Befejezési idő frissítve:', projectEndTime, 'Hátralévő mp:', remainingSeconds);
}

// Wake Lock aktiválása (megakadályozza az alvó módot)
async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
      console.log('✅ Wake Lock aktiválva - a Mac nem megy alvó módba');

      // Vizuális indikátor megjelenítése
      const statusElement = document.getElementById('wakeLockStatus');
      if (statusElement) {
        statusElement.classList.remove('hidden');
      }

      // Figyeljük, ha a Wake Lock felszabadul (pl. tab váltás)
      wakeLock.addEventListener('release', () => {
        console.log('⚠️ Wake Lock felszabadult');
        if (statusElement) {
          statusElement.classList.add('hidden');
        }
      });
    } else {
      console.warn('⚠️ Wake Lock API nem támogatott ebben a böngészőben');
      alert('Figyelem: A böngésző nem támogatja az alvás megelőzését. Kérlek, állítsd be a Mac-et, hogy ne menjen alvó módba a projekt futása alatt.\n\nRendszerbeállítások → Lakat és képernyővédő → Képernyővédő indítása: Soha');
    }
  } catch (err) {
    console.error('❌ Wake Lock hiba:', err);
  }
}

// Wake Lock felszabadítása
async function releaseWakeLock() {
  if (wakeLock !== null) {
    try {
      await wakeLock.release();
      wakeLock = null;
      console.log('🔓 Wake Lock felszabadítva - a Mac most már mehet alvó módba');

      // Vizuális indikátor elrejtése
      const statusElement = document.getElementById('wakeLockStatus');
      if (statusElement) {
        statusElement.classList.add('hidden');
      }
    } catch (err) {
      console.error('❌ Wake Lock felszabadítás hiba:', err);
    }
  }
}

// Projekt indítása
function startProject() {
  const activeTasks = currentProject.tasks.filter(t => !t.completed);
  if (activeTasks.length === 0) {
    alert('Nincsenek feladatok a projektben!');
    return;
  }

  initAudio();
  requestWakeLock(); // ÚJ: Wake Lock aktiválása

  isPlaying = true;
  isPaused = false;
  currentTaskIndex = 0;
  elapsedSeconds = 0;
  projectStartTime = new Date(); // TÉNYLEGES projekt start időpont
  segmentStartTime = new Date(projectStartTime.getTime());
  totalPauseDuration = 0;
  pauseStartTime = null;
  resetSounds();

  // Befejezési idő kiszámítása - feladatok + szünetek
  const totalSeconds = activeTasks.reduce((sum, t) => sum + t.duration * 60, 0) + getTotalBreakSeconds();
  projectEndTime = new Date(projectStartTime.getTime() + totalSeconds * 1000);

  console.log('🚀 Projekt indítva');
  console.log('⏰ Kezdés:', projectStartTime);
  console.log('🏁 Tervezett befejezés:', projectEndTime);
  console.log('⏱️ Összes idő:', totalSeconds, 'mp');

  updatePlayPauseButton();
  document.getElementById('stopBtn').disabled = false;
  document.getElementById('currentTaskStatus').textContent = 'Fut';
  document.getElementById('currentTaskName').textContent =
    activeTasks[currentTaskIndex].name;

  saveProjectState();

  startTimer();
  updateTimeLabels();
  initSortable();
  stopTimeUpdateInterval();
}

// Projekt szüneteltetése
function pauseProject() {
  isPaused = true;
  pauseStartTime = new Date();
  stopTimer();
  updatePlayPauseButton();
  document.getElementById('currentTaskStatus').textContent = isOnBreak ? 'Szünet (szüneteltetve)' : 'Szüneteltetve';
  saveProjectState();
  startTimeUpdateInterval();

  // Wake Lock megtartása szünet közben is
  console.log('⏸️ Szünet kezdete:', pauseStartTime);
}

// Projekt folytatása
function resumeProject() {
  if (pauseStartTime) {
    const pauseDuration = new Date().getTime() - pauseStartTime.getTime();
    totalPauseDuration += pauseDuration;
    if (segmentStartTime) segmentStartTime = new Date(segmentStartTime.getTime() + pauseDuration);
    console.log('▶️ Szünet vége. Időtartam:', pauseDuration, 'ms');
    console.log('📊 Összes szünet:', totalPauseDuration, 'ms');

    // A befejezési időt az updateEndTime() fogja frissíteni
    // amikor a timer elindul
  }

  isPaused = false;
  pauseStartTime = null;
  updatePlayPauseButton();
  document.getElementById('currentTaskStatus').textContent = isOnBreak ? 'Szünet' : 'Fut';
  saveProjectState();
  startTimer(); // Ez fogja frissíteni az endTime-ot
  stopTimeUpdateInterval();

  // Azonnal frissítjük a befejezési időt
  updateEndTime();
  updateTimeLabels();
}

// Projekt leállítása
function stopProject(skipConfirmation = false) {
  if (
    !skipConfirmation &&
    !confirm('Biztosan leállítod a projektet? A haladás elvész.')
  ) {
    return;
  }

  releaseWakeLock(); // ÚJ: Wake Lock felszabadítása

  isPlaying = false;
  isPaused = false;
  currentTaskIndex = -1;
  elapsedSeconds = 0;
  projectStartTime = null;
  projectEndTime = null;
  segmentStartTime = null;
  pauseStartTime = null;
  totalPauseDuration = 0;
  isOnBreak = false;
  breakDurationSeconds = 0;
  breakElapsedSeconds = 0;

  if (!currentProject.completed) {
    currentProject.tasks.forEach(task => {
      if (!task.completed) {
        task.progress = 0;
      }
    });
  }

  currentProject.state = {
    isRunning: false,
    isPaused: false,
    currentTaskIndex: -1,
    elapsedSeconds: 0,
    startTime: null,
    endTime: null,
    segmentStartTime: null,
    pauseStartTime: null,
    totalPauseDuration: 0,
    isOnBreak: false,
    breakDurationSeconds: 0,
    breakElapsedSeconds: 0
  };

  stopTimer();
  updatePlayPauseButton();
  document.getElementById('stopBtn').disabled = true;
  document.getElementById('currentTaskStatus').textContent =
    'Nincs futó feladat';
  document.getElementById('currentTaskName').textContent = '-';
  saveCurrentProject();
  loadProjectData();
  initSortable();
  startTimeUpdateInterval();
}

// Fali órás szinkronizálás: a segmentStartTime és a jelenlegi idő különbségéből
// számolja ki, hol tartunk — így alvás/lecsukás után is pontos marad, nem csak
// a másodpercenkénti setInterval-tikkeléstől függ. Ha időközben egy vagy több
// feladat/szünet is lejárt volna, sorban "végigmegy" rajtuk (cascade), és a
// többletidőt (overshoot) átviszi a következő szegmens kezdőidejébe.
function resyncFromWallClock() {
  if (!isPlaying || isPaused || !segmentStartTime) return;

  let cascaded = false;

  for (let step = 0; step < 1000; step++) {
    const elapsedMs = Math.max(0, new Date().getTime() - segmentStartTime.getTime());
    const elapsed = Math.floor(elapsedMs / 1000);

    if (isOnBreak) {
      if (elapsed < breakDurationSeconds) {
        breakElapsedSeconds = elapsed;
        break;
      }

      const overshootMs = elapsedMs - breakDurationSeconds * 1000;
      breakElapsedSeconds = breakDurationSeconds;
      endBreak();
      if (!isPlaying) return; // közben nem maradt több feladat
      segmentStartTime = new Date(new Date().getTime() - overshootMs);
      cascaded = true;
      continue;
    }

    const activeTasks = currentProject.tasks.filter(t => !t.completed);
    if (currentTaskIndex >= activeTasks.length) break;

    const currentTask = activeTasks[currentTaskIndex];
    const totalSeconds = currentTask.duration * 60;

    if (elapsed < totalSeconds) {
      elapsedSeconds = elapsed;
      break;
    }

    const overshootMs = elapsedMs - totalSeconds * 1000;
    elapsedSeconds = totalSeconds;
    completeCurrentTask();
    if (!isPlaying) return; // a projekt közben befejeződött
    segmentStartTime = new Date(new Date().getTime() - overshootMs);
    cascaded = true;
  }

  if (cascaded) {
    saveProjectState();
  }
}

// Timer indítása
function startTimer() {
  timerInterval = setInterval(() => {
    resyncFromWallClock();
    if (!isPlaying) return; // a projekt közben befejeződött

    updateCurrentTaskProgress();

    const saveCounter = isOnBreak ? breakElapsedSeconds : elapsedSeconds;
    if (saveCounter % 10 === 0) {
      saveProjectState();
    }

    updateTimeLabels(); // Ez már tartalmazza az updateTaskStartTimes()-t is
  }, 1000);
}

// Timer leállítása
function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

// Aktuális feladat haladásának frissítése
// (Az elapsedSeconds/breakElapsedSeconds értékét és a feladat/szünet váltást
// már a resyncFromWallClock() döntötte el — ez a függvény csak a haladás
// százalékát, a hangjelzéseket és a UI frissítését végzi.)
function updateCurrentTaskProgress() {
  // Ha szünetben vagyunk, csak a szünet kártyáit frissítjük
  if (isOnBreak) {
    loadTasks();
    updateRemainingTime();
    updateTimeline();
    return;
  }

  const activeTasks = currentProject.tasks.filter(t => !t.completed);
  if (currentTaskIndex >= activeTasks.length) {
    return;
  }

  const currentTask = activeTasks[currentTaskIndex];
  const totalSeconds = currentTask.duration * 60;
  const remainingSeconds = totalSeconds - elapsedSeconds;
  const progress = Math.min((elapsedSeconds / totalSeconds) * 100, 100);

  const originalTaskIndex = currentProject.tasks.findIndex(
    t => t.id === currentTask.id
  );
  if (originalTaskIndex !== -1) {
    currentProject.tasks[originalTaskIndex].progress = progress;
  }

  if (
    !soundsPlayed.tenMin &&
    remainingSeconds <= 600 &&
    remainingSeconds > 300 &&
    totalSeconds >= 600
  ) {
    playSound('10min.mp3');
    soundsPlayed.tenMin = true;
  }

  if (
    !soundsPlayed.fiveMin &&
    remainingSeconds <= 300 &&
    remainingSeconds > 60 &&
    totalSeconds >= 300
  ) {
    playSound('5min.mp3');
    soundsPlayed.fiveMin = true;
  }

  if (
    !soundsPlayed.oneMin &&
    remainingSeconds <= 60 &&
    remainingSeconds > 12 &&
    totalSeconds >= 60
  ) {
    playSound('1min.mp3');
    soundsPlayed.oneMin = true;
  }

  if (
    !soundsPlayed.lastTwelve &&
    remainingSeconds <= 11 &&
    remainingSeconds > 0
  ) {
    playSound('timer.mp3');
    soundsPlayed.lastTwelve = true;
  }

  // Feladat kártyák frissítése (beleértve a kezdési időket is)
  loadTasks();
  updateTimeline();
  updateRemainingTime();
  updateProjectProgress();
}

// Feladat korai befejezése (felhasználó kész lett hamarabb)
function completeTaskEarly(taskId) {
  if (isOnBreak) {
    alert('Szünet alatt nem fejezhető be feladat!');
    return;
  }

  const activeTasks = currentProject.tasks.filter(t => !t.completed);
  const currentTask = activeTasks[currentTaskIndex];

  // Ellenőrizzük, hogy a megfelelő feladatot próbáljuk befejezni
  if (currentTask.id !== taskId) {
    alert('Csak a futó feladatot lehet befejezni!');
    return;
  }

  // Megerősítés kérése
  if (!confirm(`Biztosan befejezted a(z) "${currentTask.name}" feladatot?\n\nHa igen, a következő feladat azonnal elindul, és az időzítés újraszámolódik.`)) {
    return;
  }

  console.log('⏩ Feladat korai befejezése:', currentTask.name);
  console.log('⏰ Megspórolt idő:', Math.floor((currentTask.duration * 60 - elapsedSeconds) / 60), 'perc');

  // Befejezzük a feladatot
  completeCurrentTask();
}

// Aktuális feladat befejezése
function completeCurrentTask() {
  const activeTasks = currentProject.tasks.filter(t => !t.completed);
  const currentTask = activeTasks[currentTaskIndex];

  currentTask.completed = true;
  currentTask.progress = 100;

  console.log('✅ Feladat befejezve:', currentTask.name);

  const remainingActiveTasks = currentProject.tasks.filter(t => !t.completed);

  if (remainingActiveTasks.length === 0) {
    currentProject.completed = true;
    isOnBreak = false;
    breakElapsedSeconds = 0;
    breakDurationSeconds = 0;
    releaseWakeLock();

    // ÚJ: Befejezés hang lejátszása
    playSound('completed.mp3');

    currentTaskIndex++;
    elapsedSeconds = 0;
    resetSounds();
    saveProjectState();

    stopProject(true);

    // ÚJ: Késleltetett alert, hogy a hang lejátszódjon
    setTimeout(() => {
      alert('Gratulálunk! A projekt befejezve!');
    }, 500);
  } else {
    // Van még feladat — ellenőrizzük, kell-e szünet
    const breakSec = getBreakDurationForTask(currentTask);
    if (breakSec > 0) {
      // Szünet indítása a befejezett feladat után
      isOnBreak = true;
      breakDurationSeconds = breakSec;
      breakElapsedSeconds = 0;
      // A currentTaskIndex-et nem növeljük, mert a szünet az előző feladathoz tartozik
      // De a feladat már completed, szóval a currentTaskIndex a következő aktív feladatra mutat
      currentTaskIndex = 0; // A remaining aktív feladatok közül az első
      elapsedSeconds = 0;
      segmentStartTime = new Date();
      resetSounds();

      document.getElementById('currentTaskStatus').textContent = 'Szünet';
      document.getElementById('currentTaskName').textContent =
        '☕ ' + formatBreakDuration(breakSec) + ' szünet';

      updateEndTime();
      saveProjectState();

      console.log('☕ Szünet indítva:', formatBreakDuration(breakSec));
    } else {
      currentTaskIndex = 0;
      elapsedSeconds = 0;
      segmentStartTime = new Date();
      resetSounds();

      document.getElementById('currentTaskName').textContent =
        remainingActiveTasks[0].name;

      updateEndTime();
      console.log('🔄 Következő feladat:', remainingActiveTasks[0].name);
      console.log('🏁 Frissített befejezési idő:', projectEndTime);

      saveProjectState();
    }
  }

  saveCurrentProject();
  loadProjectData();
  initSortable();
}

// Szünet átugrása — a következő feladat azonnal indul
function skipBreak() {
  if (!isOnBreak || !isPlaying) return;
  console.log('⏭️ Szünet átugorva');
  const wasPaused = isPaused;
  endBreak();
  if (!isPlaying) return;
  if (wasPaused && pauseStartTime) {
    // Szüneteltetve ugrottunk: a feladat a folytatáskor induljon 0-ról
    segmentStartTime = new Date(pauseStartTime.getTime());
    document.getElementById('currentTaskStatus').textContent = 'Szüneteltetve';
    saveProjectState();
  }
}

// Szünet befejezése — következő feladatra lépés
function endBreak() {
  console.log('☕ Szünet vége, következő feladat indul');

  isOnBreak = false;
  breakDurationSeconds = 0;
  breakElapsedSeconds = 0;
  elapsedSeconds = 0;
  segmentStartTime = new Date();
  resetSounds();

  const activeTasks = currentProject.tasks.filter(t => !t.completed);

  if (activeTasks.length === 0) {
    stopProject(true);
    return;
  }

  currentTaskIndex = 0;
  document.getElementById('currentTaskStatus').textContent = 'Fut';
  document.getElementById('currentTaskName').textContent =
    activeTasks[0].name;

  updateEndTime();
  saveProjectState();
  saveCurrentProject();
  loadProjectData();
  initSortable();

  console.log('🔄 Következő feladat:', activeTasks[0].name);
}

// Play/Pause gomb frissítése
function updatePlayPauseButton() {
  const btn = document.getElementById('playPauseBtn');
  const icon = btn.querySelector('.material-symbols-outlined');

  if (!isPlaying) {
    icon.textContent = 'play_arrow';
  } else if (isPaused) {
    icon.textContent = 'play_arrow';
  } else {
    icon.textContent = 'pause';
  }
}

// Mute gomb kapcsolása
function toggleMute() {
  const settings = getSettings();
  settings.soundEnabled = !settings.soundEnabled;
  saveSettings(settings);
  updateMuteButton();
}

// Mute gomb frissítése
function updateMuteButton() {
  const settings = getSettings();
  const btn = document.getElementById('muteBtn');
  const icon = btn.querySelector('.material-symbols-outlined');

  if (settings.soundEnabled) {
    icon.textContent = 'volume_up';
    btn.title = 'Hang kikapcsolása';
  } else {
    icon.textContent = 'volume_off';
    btn.title = 'Hang bekapcsolása';
  }
}

// Projekt mentése
function saveCurrentProject() {
  const projects = getProjects();
  const index = projects.findIndex(p => p.id === currentProject.id);
  if (index !== -1) {
    projects[index] = currentProject;
    saveProjects(projects);
  }
}

// Vissza gomb
function goBack() {
  console.log('🔴 Visszalépés - állapot mentése');

  // Ha a projekt fut, figyelmeztetés
  if (isPlaying && !isPaused) {
    if (!confirm('A projekt jelenleg fut. Biztosan el akarod hagyni az oldalt? A projekt futása folytatódik.')) {
      return;
    }
  }

  saveProjectState();
  saveCurrentProject();
  console.log('🔴 Mentett state:', currentProject.state);

  // Ne szabadítsuk fel a Wake Lock-ot, ha a projekt fut
  // Ez lehetővé teszi, hogy háttérben is folytatódjon

  window.location.href = 'dashboard.html';
}

// Projekt állapot mentése
function saveProjectState() {
  if (!currentProject) return;

  currentProject.state = {
    isRunning: isPlaying,
    isPaused: isPaused,
    currentTaskIndex: currentTaskIndex,
    elapsedSeconds: elapsedSeconds,
    startTime: projectStartTime ? projectStartTime.toISOString() : null,
    endTime: projectEndTime ? projectEndTime.toISOString() : null,
    segmentStartTime: segmentStartTime ? segmentStartTime.toISOString() : null,
    pauseStartTime: pauseStartTime ? pauseStartTime.toISOString() : null,
    totalPauseDuration: totalPauseDuration,
    isOnBreak: isOnBreak,
    breakDurationSeconds: breakDurationSeconds,
    breakElapsedSeconds: breakElapsedSeconds
  };

  console.log('💾 Állapot mentve:', currentProject.state);
}

// Idő címkék frissítése
function updateTimeLabels() {
  const settings = getSettings();
  const timeFormat = settings.timeFormat || '24h';

  if (isPlaying && projectStartTime && projectEndTime) {
    // Futó projekt: FIXÁLT kezdési és befejezési idő
    document.getElementById('startTime').textContent = formatTimeLabel(
      projectStartTime,
      timeFormat
    );

    // Befejezési idő - ez fix marad, NEM csökken!
    // Csak akkor változik, ha szüneteltetés van
    let displayEndTime = projectEndTime;
    if (isPaused && pauseStartTime) {
      // Ha épp szünetel, megmutatjuk, hogy mennyivel tolódna
      const currentPauseDuration =
        new Date().getTime() - pauseStartTime.getTime();
      displayEndTime = new Date(
        projectEndTime.getTime() + currentPauseDuration
      );
    }

    document.getElementById('endTime').textContent = formatTimeLabel(
      displayEndTime,
      timeFormat
    );
  } else if (currentProject.plannedStartDate && !isPlaying) {
    // Tervezett projekt: tervezett kezdési idő és számított befejezés
    const plannedStart = new Date(currentProject.plannedStartDate);
    document.getElementById('startTime').textContent = formatTimeLabel(
      plannedStart,
      timeFormat
    );

    const activeTasks = currentProject.tasks.filter(t => !t.completed);
    const totalMinutes = activeTasks.reduce((sum, t) => sum + t.duration, 0);
    const breakSeconds = getTotalBreakSeconds();

    const plannedEnd = new Date(plannedStart.getTime() + totalMinutes * 60 * 1000 + breakSeconds * 1000);
    document.getElementById('endTime').textContent = formatTimeLabel(
      plannedEnd,
      timeFormat
    );
  } else {
    // Alapértelmezett: jelenlegi idő + összes hátralévő idő
    const now = new Date();
    document.getElementById('startTime').textContent = formatTimeLabel(
      now,
      timeFormat
    );

    const activeTasks = currentProject.tasks.filter(t => !t.completed);
    const totalMinutes = activeTasks.reduce((sum, t) => sum + t.duration, 0);
    const breakSeconds = getTotalBreakSeconds();

    const endDate = new Date(now.getTime() + totalMinutes * 60 * 1000 + breakSeconds * 1000);
    document.getElementById('endTime').textContent = formatTimeLabel(
      endDate,
      timeFormat
    );
  }

  // Feladat kezdési idők frissítése
  updateTaskStartTimes();
}

// Feladat kezdési idők frissítése (DOM manipuláció nélkül)
function updateTaskStartTimes() {
  const activeTasks = currentProject.tasks.filter(t => !t.completed);
  const settings = getSettings();
  const timeFormat = settings.timeFormat || '24h';

  activeTasks.forEach((task, index) => {
    const taskCard = document.querySelector(`[data-task-id="${task.id}"]`);
    if (!taskCard) return;

    const startTimeElement = taskCard.querySelector('.task-start-time');
    if (!startTimeElement) return;

    // Feladat kezdési idejének kiszámítása
    let taskStartTime = null;

    if (isPlaying && projectStartTime) {
      // Futó vagy szüneteltetett projekt
      let pauseTime = totalPauseDuration;
      if (isPaused && pauseStartTime) {
        pauseTime += new Date().getTime() - pauseStartTime.getTime();
      }

      if (index === currentTaskIndex) {
        // Aktuális feladat
        taskStartTime = new Date(projectStartTime.getTime() +
          activeTasks.slice(0, currentTaskIndex).reduce((sum, t) => sum + t.duration * 60 * 1000, 0) +
          totalPauseDuration);
      } else if (index > currentTaskIndex) {
        // Következő feladatok
        let accumulatedSeconds = 0;

        if (isOnBreak) {
          // Ha szünetben vagyunk, a szünet hátralévő ideje + az összes közbülső feladat és szünet
          accumulatedSeconds += Math.max(0, breakDurationSeconds - breakElapsedSeconds);
          for (let i = currentTaskIndex; i < index; i++) {
            accumulatedSeconds += activeTasks[i].duration * 60;
            if (i < index - 1) {
              accumulatedSeconds += getBreakDurationForTask(activeTasks[i]);
            }
          }
        } else {
          const currentTask = activeTasks[currentTaskIndex];
          accumulatedSeconds = currentTask.duration * 60 - elapsedSeconds;
          // Szünet az aktuális feladat után
          accumulatedSeconds += getBreakDurationForTask(currentTask);

          for (let i = currentTaskIndex + 1; i < index; i++) {
            accumulatedSeconds += activeTasks[i].duration * 60;
            if (i < index - 1) {
              accumulatedSeconds += getBreakDurationForTask(activeTasks[i]);
            }
          }
        }

        if (isPaused) {
          taskStartTime = new Date(
            pauseStartTime.getTime() + (accumulatedSeconds * 1000)
          );
        } else {
          taskStartTime = new Date(
            new Date().getTime() + (accumulatedSeconds * 1000) + pauseTime
          );
        }
      }
    } else {
      // Megállított projekt vagy tervezett projekt
      const baseTime = currentProject.plannedStartDate
        ? new Date(currentProject.plannedStartDate)
        : new Date();

      let accumulatedSeconds = 0;
      for (let i = 0; i < index; i++) {
        accumulatedSeconds += activeTasks[i].duration * 60;
        // Szünetek hozzáadása (minden feladat után, kivéve az utolsó előtti)
        if (i < index - 1 || index < activeTasks.length) {
          accumulatedSeconds += getBreakDurationForTask(activeTasks[i]);
        }
      }
      taskStartTime = new Date(baseTime.getTime() + (accumulatedSeconds * 1000));
    }

    // Időpont formázása és frissítése
    if (taskStartTime) {
      const taskStartLabel = formatTimeLabel(taskStartTime, timeFormat);
      startTimeElement.textContent = `▶ ${taskStartLabel}`;
    }
  });
}

// Idő formázása címkéhez
function formatTimeLabel(date, format) {
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');

  if (format === '12h') {
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes} ${period}`;
  } else {
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  }
}

// Teljes projekt újraindítása (project.html oldalról)
function restartCurrentProject() {
  if (!currentProject) return;

  if (!confirm(`Biztosan újraindítod a "${currentProject.name}" projektet?\n\nA projekt és az összes feladat 0%-ra áll vissza.`)) {
    return;
  }

  // Projekt alaphelyzetbe állítása
  currentProject.completed = false;
  currentProject.startDate = null;
  currentProject.state = {
    isRunning: false,
    isPaused: false,
    currentTaskIndex: -1,
    elapsedSeconds: 0,
    startTime: null,
    endTime: null,
    segmentStartTime: null,
    pauseStartTime: null,
    totalPauseDuration: 0,
    isOnBreak: false,
    breakDurationSeconds: 0,
    breakElapsedSeconds: 0
  };

  // Összes feladat visszaállítása
  currentProject.tasks.forEach(task => {
    task.completed = false;
    task.progress = 0;
  });

  // Lokális változók visszaállítása
  isPlaying = false;
  isPaused = false;
  currentTaskIndex = -1;
  elapsedSeconds = 0;
  projectStartTime = null;
  projectEndTime = null;
  pauseStartTime = null;
  totalPauseDuration = 0;
  isOnBreak = false;
  breakDurationSeconds = 0;
  breakElapsedSeconds = 0;

  stopTimer();
  updatePlayPauseButton();
  document.getElementById('stopBtn').disabled = true;
  document.getElementById('currentTaskStatus').textContent = 'Nincs futó feladat';
  document.getElementById('currentTaskName').textContent = '-';

  saveCurrentProject();
  loadProjectData();
  initSortable();
  startTimeUpdateInterval();

  console.log('🔄 Projekt újraindítva:', currentProject.name);
}

// Egyetlen befejezett feladat újraindítása
function restartSingleTask(taskId) {
  const task = currentProject.tasks.find(t => t.id === taskId);
  if (!task) {
    alert('A feladat nem található!');
    return;
  }

  // Feladat visszaállítása
  task.completed = false;
  task.progress = 0;

  // Ha a projekt befejezettként volt megjelölve, visszaállítjuk
  if (currentProject.completed) {
    currentProject.completed = false;
  }

  saveCurrentProject();
  loadProjectData();
  initSortable();

  console.log('🔄 Feladat újraindítva:', task.name);
}

// Feladat duplikálása (az eredeti alá helyezi)
function duplicateTask(taskId) {
  const activeTasks = currentProject.tasks.filter(t => !t.completed);
  const taskIndex = currentProject.tasks.findIndex(t => t.id === taskId);
  const task = currentProject.tasks[taskIndex];

  if (!task) {
    alert('A feladat nem található!');
    return;
  }

  const usedColors = currentProject.tasks.map(t => t.color);
  const duplicatedTask = {
    id: generateUUID(),
    name: task.name,
    duration: task.duration,
    note: task.note || '',
    color: getAvailableColor(usedColors),
    completed: false,
    progress: 0
  };

  // Az eredeti feladat után szúrjuk be
  currentProject.tasks.splice(taskIndex + 1, 0, duplicatedTask);

  // Ha a projekt fut és az aktuális feladat indexe módosul
  if (isPlaying && currentTaskIndex >= 0) {
    const activeIndex = activeTasks.findIndex(t => t.id === taskId);
    if (activeIndex >= 0 && activeIndex < currentTaskIndex) {
      currentTaskIndex++;
      saveProjectState();
    }
  }

  saveCurrentProject();
  loadProjectData();
  initSortable();

  if (isPlaying && projectStartTime) {
    updateEndTime();
  }

  console.log('📋 Feladat duplikálva:', task.name);
}

// Batch action toolbar frissítése
function updateBatchDeleteToolbar() {
  const checkboxes = document.querySelectorAll('.task-checkbox:checked');
  const toolbar = document.getElementById('batchDeleteToolbar');
  const countEl = document.getElementById('selectedCount');
  const selectAllCheckbox = document.getElementById('selectAllCheckbox');
  const allCheckboxes = document.querySelectorAll('.task-checkbox');

  updateMoveArrows();

  if (checkboxes.length > 0) {
    toolbar.classList.remove('hidden');
    toolbar.style.display = 'flex';
    countEl.textContent = checkboxes.length;

    // Populate batch target project dropdown
    const batchTargetSelect = document.getElementById('batchTargetProject');
    if (batchTargetSelect) {
      const currentValue = batchTargetSelect.value;
      batchTargetSelect.innerHTML = '<option value="">Válassz projektet...</option>';
      getActiveTargetProjects()
        .forEach(p => {
          batchTargetSelect.innerHTML += `<option value="${p.id}">${p.name}</option>`;
        });
      // Restore previous selection if still valid
      if (currentValue) {
        batchTargetSelect.value = currentValue;
      }
    }
  } else {
    toolbar.classList.add('hidden');
    toolbar.style.display = '';
  }

  // Select all checkbox állapot frissítése
  if (selectAllCheckbox && allCheckboxes.length > 0) {
    const enabledCheckboxes = document.querySelectorAll('.task-checkbox:not(:disabled)');
    const checkedEnabled = document.querySelectorAll('.task-checkbox:not(:disabled):checked');
    selectAllCheckbox.checked = enabledCheckboxes.length > 0 && checkedEnabled.length === enabledCheckboxes.length;
    selectAllCheckbox.indeterminate = checkedEnabled.length > 0 && checkedEnabled.length < enabledCheckboxes.length;
  }
}

// Kijelölt (aktív) feladatok indexei az aktív listában
function getSelectedActiveIndices() {
  const ids = new Set(
    Array.from(document.querySelectorAll('.task-checkbox:checked')).map(cb => cb.getAttribute('data-task-id'))
  );
  const activeTasks = currentProject.tasks.filter(t => !t.completed);
  const indices = [];
  activeTasks.forEach((t, i) => { if (ids.has(t.id)) indices.push(i); });
  return indices;
}

// Fel/le nyilak megjelenítése a kijelölt kártyákon + tiltás, ha nincs hova mozdulni
function updateMoveArrows() {
  const activeTasks = currentProject.tasks.filter(t => !t.completed);
  const indices = getSelectedActiveIndices();
  const minIdx = getMinInsertIndex();
  const sel = new Set(indices);

  // Akkor mozdulhat, ha van olyan kijelölt, ami fölött/alatt szabad (nem kijelölt) hely van
  const canUp = indices.some(i => i - 1 >= minIdx && !sel.has(i - 1));
  const canDown = indices.some(i => i + 1 < activeTasks.length && !sel.has(i + 1));

  document.querySelectorAll('#tasksList [data-task-id]').forEach(card => {
    const cb = card.querySelector('.task-checkbox');
    const arrows = card.querySelector('.task-move-arrows');
    if (!cb || !arrows) return;
    const show = cb.checked;
    arrows.classList.toggle('hidden', !show);
    arrows.classList.toggle('flex', show);
    card.querySelector('.task-move-up-btn').disabled = !canUp;
    card.querySelector('.task-move-down-btn').disabled = !canDown;
  });
}

// Kijelölt feladatok együttes mozgatása egy hellyel fel (-1) vagy le (+1)
function moveSelectedTasks(direction) {
  const activeTasks = currentProject.tasks.filter(t => !t.completed);
  const indices = getSelectedActiveIndices();
  if (indices.length === 0) return;
  const selectedIds = indices.map(i => activeTasks[i].id);
  const minIdx = getMinInsertIndex();
  const sel = new Array(activeTasks.length).fill(false);
  indices.forEach(i => { sel[i] = true; });

  if (direction < 0) {
    for (let i = minIdx + 1; i < activeTasks.length; i++) {
      if (sel[i] && !sel[i - 1]) {
        [activeTasks[i - 1], activeTasks[i]] = [activeTasks[i], activeTasks[i - 1]];
        sel[i - 1] = true; sel[i] = false;
      }
    }
  } else {
    for (let i = activeTasks.length - 2; i >= minIdx; i--) {
      if (sel[i] && !sel[i + 1]) {
        [activeTasks[i + 1], activeTasks[i]] = [activeTasks[i], activeTasks[i + 1]];
        sel[i + 1] = true; sel[i] = false;
      }
    }
  }

  const completedTasks = currentProject.tasks.filter(t => t.completed);
  currentProject.tasks = [...activeTasks, ...completedTasks];

  // Animáció (FLIP): régi pozíciók rögzítése az újrarajzolás előtt
  const oldTops = getTaskCardTops();

  saveCurrentProject();
  loadTasks();
  updateTimeline();
  initSortable();

  // Kijelölés visszaállítása, hogy tovább lehessen léptetni
  selectedIds.forEach(id => {
    const cb = document.querySelector(`.task-checkbox[data-task-id="${id}"]`);
    if (cb && !cb.disabled) cb.checked = true;
  });
  updateBatchDeleteToolbar();

  animateTaskCardsFrom(oldTops, new Set(selectedIds));
}

// Feladatkártyák aktuális (látható) függőleges pozíciója, azonosító szerint
function getTaskCardTops() {
  const tops = new Map();
  Array.from(document.getElementById('tasksList').children)
    .filter(el => el.hasAttribute('data-task-id'))
    .forEach(el => tops.set(el.getAttribute('data-task-id'), el.getBoundingClientRect().top));
  return tops;
}

// A kártyák a régi helyükről csússzanak át az újra
function animateTaskCardsFrom(oldTops, raisedIds) {
  const cards = Array.from(document.getElementById('tasksList').children)
    .filter(el => el.hasAttribute('data-task-id'));
  const moving = [];
  cards.forEach(card => {
    const id = card.getAttribute('data-task-id');
    if (!oldTops.has(id)) return;
    const dy = oldTops.get(id) - card.getBoundingClientRect().top;
    if (Math.abs(dy) < 1) return;
    card.style.transition = 'none';
    card.style.transform = `translateY(${dy}px)`;
    // A kijelöltek a többi fölött csússzanak
    if (raisedIds.has(id)) card.style.zIndex = '10';
    moving.push(card);
  });
  if (moving.length === 0) return;

  void document.body.offsetHeight; // reflow, hogy a kezdő állapot érvényesüljön
  moving.forEach(card => {
    card.style.transition = 'transform 250ms ease-in-out';
    card.style.transform = '';
    card.addEventListener('transitionend', function done(e) {
      if (e.propertyName !== 'transform') return;
      card.style.transition = '';
      card.style.zIndex = '';
      card.removeEventListener('transitionend', done);
    });
  });
}

// Összes feladat kijelölése/kijelölés megszüntetése
function toggleSelectAllTasks(checked) {
  const checkboxes = document.querySelectorAll('.task-checkbox:not(:disabled)');
  checkboxes.forEach(cb => {
    cb.checked = checked;
  });
  updateBatchDeleteToolbar();
}

// Kijelölt feladatok törlése
function batchDeleteTasks() {
  const checkedBoxes = document.querySelectorAll('.task-checkbox:checked');
  const taskIds = Array.from(checkedBoxes).map(cb => cb.getAttribute('data-task-id'));

  if (taskIds.length === 0) return;

  if (!confirm(`Biztosan törölni szeretnéd a kijelölt ${taskIds.length} feladatot?`)) {
    return;
  }

  currentProject.tasks = currentProject.tasks.filter(t => !taskIds.includes(t.id));
  saveCurrentProject();
  loadProjectData();
  initSortable();

  if (isPlaying && projectStartTime) {
    updateEndTime();
  }

  // Toolbar elrejtése
  const toolbar = document.getElementById('batchDeleteToolbar');
  toolbar.classList.add('hidden');
  toolbar.style.display = '';

  console.log('🗑️ Batch törlés:', taskIds.length, 'feladat törölve');
}

// Kijelölt feladatok késznek jelölése lefuttatás nélkül
function batchCompleteTasks() {
  const checkedBoxes = document.querySelectorAll('.task-checkbox:checked');
  const taskIds = new Set(Array.from(checkedBoxes).map(cb => cb.getAttribute('data-task-id')));

  if (taskIds.size === 0) return;

  if (!confirm(`Biztosan késznek jelölöd a kijelölt ${taskIds.size} feladatot?`)) {
    return;
  }

  // A futó feladat checkboxa le van tiltva, így az nem kerülhet ide.
  // A kijelöltek mind a futó/következő feladat helyén vagy utána vannak,
  // ezért a currentTaskIndex érvényes marad, amíg marad aktív feladat.
  currentProject.tasks.forEach(t => {
    if (taskIds.has(t.id) && !t.completed) {
      t.completed = true;
      t.progress = 100;
    }
  });

  const remainingActive = currentProject.tasks.filter(t => !t.completed);

  if (remainingActive.length === 0) {
    // Minden feladat kész → a projekt is kész
    currentProject.completed = true;
    if (isPlaying) {
      releaseWakeLock();
      playSound('completed.mp3');
      stopProject(true); // ment és újrarajzol
    } else {
      saveCurrentProject();
      loadProjectData();
      initSortable();
    }
    setTimeout(() => {
      alert('Gratulálunk! A projekt befejezve!');
    }, 500);
  } else {
    if (isPlaying) saveProjectState();
    saveCurrentProject();
    loadProjectData();
    initSortable();
    if (isPlaying && projectStartTime) {
      updateEndTime();
    }
  }

  const toolbar = document.getElementById('batchDeleteToolbar');
  toolbar.classList.add('hidden');
  toolbar.style.display = '';

  console.log('✅ Batch kész:', taskIds.size, 'feladat késznek jelölve');
}

// Kijelölt feladatok áthelyezése egy most létrehozandó projektbe:
// a dashboard "Új projekt" ablaka nyílik meg, ami létrehozás után átveszi a
// feladatokat, majd visszahoz ide (Mégse esetén is).
function batchMoveToNewProject() {
  const taskIds = Array.from(document.querySelectorAll('.task-checkbox:checked'))
    .map(cb => cb.getAttribute('data-task-id'));
  if (taskIds.length === 0) return;

  saveProjectState();
  saveCurrentProject();

  const params = new URLSearchParams({ moveFrom: currentProject.id, tasks: taskIds.join(',') });
  window.location.href = 'dashboard.html?' + params.toString();
}

// Kijelölt feladatok mozgatása másik projektbe
function batchMoveTasks() {
  const checkedBoxes = document.querySelectorAll('.task-checkbox:checked');
  const taskIds = Array.from(checkedBoxes).map(cb => cb.getAttribute('data-task-id'));
  const targetProjectId = document.getElementById('batchTargetProject').value;

  if (taskIds.length === 0) return;

  if (!targetProjectId) {
    alert('Kérlek válassz egy célprojektet!');
    return;
  }

  const projects = getProjects();
  const targetProject = projects.find(p => p.id === targetProjectId);

  if (!targetProject) {
    alert('A célprojekt nem található!');
    return;
  }

  if (!confirm(`Biztosan át szeretnéd mozgatni a kijelölt ${taskIds.length} feladatot a(z) "${targetProject.name}" projektbe?`)) {
    return;
  }

  // Feladatok mozgatása
  const tasksToMove = currentProject.tasks.filter(t => taskIds.includes(t.id));
  tasksToMove.forEach(task => {
    targetProject.tasks.push(task);
  });
  currentProject.tasks = currentProject.tasks.filter(t => !taskIds.includes(t.id));

  const projectIndex = projects.findIndex(p => p.id === currentProject.id);
  const targetIndex = projects.findIndex(p => p.id === targetProjectId);
  projects[projectIndex] = currentProject;
  projects[targetIndex] = targetProject;
  saveProjects(projects);

  loadProjectData();
  initSortable();

  if (isPlaying && projectStartTime) {
    updateEndTime();
  }

  // Toolbar elrejtése
  const toolbar = document.getElementById('batchDeleteToolbar');
  toolbar.classList.add('hidden');
  toolbar.style.display = '';

  alert(`${tasksToMove.length} feladat átmozgatva a(z) "${targetProject.name}" projektbe!`);
  console.log('📦 Batch mozgatás:', tasksToMove.length, 'feladat mozgatva →', targetProject.name);
}

// Kijelölt feladatok másolása másik projektbe
function batchCopyTasks() {
  const checkedBoxes = document.querySelectorAll('.task-checkbox:checked');
  const taskIds = Array.from(checkedBoxes).map(cb => cb.getAttribute('data-task-id'));
  const targetProjectId = document.getElementById('batchTargetProject').value;

  if (taskIds.length === 0) return;

  if (!targetProjectId) {
    alert('Kérlek válassz egy célprojektet!');
    return;
  }

  const projects = getProjects();
  const targetProject = projects.find(p => p.id === targetProjectId);

  if (!targetProject) {
    alert('A célprojekt nem található!');
    return;
  }

  if (!confirm(`Biztosan másolni szeretnéd a kijelölt ${taskIds.length} feladatot a(z) "${targetProject.name}" projektbe?`)) {
    return;
  }

  // Feladatok másolása
  const tasksToCopy = currentProject.tasks.filter(t => taskIds.includes(t.id));
  const usedColors = targetProject.tasks.map(t => t.color);
  let copiedCount = 0;

  tasksToCopy.forEach(task => {
    const taskCopy = {
      ...task,
      id: generateUUID(),
      color: getAvailableColor(usedColors),
      completed: false,
      progress: 0
    };
    usedColors.push(taskCopy.color);
    targetProject.tasks.push(taskCopy);
    copiedCount++;
  });

  const targetIndex = projects.findIndex(p => p.id === targetProjectId);
  projects[targetIndex] = targetProject;
  saveProjects(projects);

  // Checkboxok visszaállítása
  checkedBoxes.forEach(cb => { cb.checked = false; });
  updateBatchDeleteToolbar();

  alert(`${copiedCount} feladat másolva a(z) "${targetProject.name}" projektbe!`);
  console.log('📋 Batch másolás:', copiedCount, 'feladat másolva →', targetProject.name);
}

// Mozgatás/Másolás szekció ki/becsukása
function toggleMoveCopySection() {
  const content = document.getElementById('moveCopyContent');
  const arrow = document.getElementById('moveCopyArrow');

  if (content.classList.contains('hidden')) {
    content.classList.remove('hidden');
    arrow.style.transform = 'rotate(180deg)';
  } else {
    content.classList.add('hidden');
    arrow.style.transform = 'rotate(0deg)';
  }
}

// Több feladat modal megjelenítése
function showAddMultipleTasksModal() {
  const hasTasks = currentProject.tasks.some(t => !t.completed);
  document.getElementById('multiplePositionRow').classList.toggle('hidden', !hasTasks);
  setMultiplePosition('bottom');
  document.getElementById('addMultipleTasksModal').classList.remove('hidden');
  document.getElementById('multipleTasksInput').value = '';
  document.getElementById('multipleTasksPreview').textContent = '';
  document.getElementById('multipleTasksInput').focus();
}

// Több feladat modal elrejtése
function hideAddMultipleTasksModal() {
  document.getElementById('addMultipleTasksModal').classList.add('hidden');
  document.getElementById('multipleTasksInput').value = '';
  document.getElementById('multipleTasksPreview').textContent = '';
}

// Több feladat: elhelyezés gombok állapota
function setMultiplePosition(pos) {
  const active = 'border-primary bg-primary/10 text-primary';
  const inactive = 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-primary hover:text-primary';
  [['multiplePositionTop', 'top'], ['multiplePositionBottom', 'bottom']].forEach(([id, p]) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    const on = p === pos;
    btn.setAttribute('data-active', on ? 'true' : 'false');
    btn.className = 'multi-pos-btn flex-1 flex items-center justify-center gap-1 h-10 rounded-lg border-2 text-sm font-medium transition-colors ' + (on ? active : inactive);
  });
}

// Szöveg feldarabolása pontosvesszőknél, de az idézőjelben lévőket
// (pl. a megjegyzésen belülieket) nem bontja szét.
function splitTopLevelSemicolons(text) {
  const parts = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      current += ch;
    } else if (ch === ';' && !inQuotes) {
      parts.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current);

  return parts;
}

// Több feladat szöveg elemzése
// Formátum: Feladatnév (percek) "opcionális megjegyzés" — a megjegyzésben
// **félkövér**, *dőlt* és __aláhúzott__ jelölés is használható.
function parseMultipleTasks(text) {
  if (!text.trim()) return [];

  const tasks = [];
  const parts = splitTopLevelSemicolons(text);

  parts.forEach(part => {
    part = part.trim();
    if (!part) return;

    // Regex: "Feladatnév (percek)" vagy "Feladatnév (percek) \"megjegyzés\"" formátum
    const match = part.match(/^(.+?)\s*\((\d+)\)\s*(?:"([^"]*)")?\s*$/);
    if (match) {
      const name = match[1].trim();
      const duration = parseInt(match[2]);
      const note = match[3] ? match[3].trim() : '';
      if (name && duration > 0) {
        tasks.push({ name, duration, note });
      }
    }
  });

  return tasks;
}

// Egyszerű jelölőnyelv (a beírt szöveg escape-elve, utána alkalmazott
// formázás) — így biztonságos HTML-ként megjeleníteni a megjegyzést:
// **félkövér**, *dőlt*, __aláhúzott__
function formatNoteHtml(note) {
  if (!note) return '';
  let html = note
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  html = html
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<u>$1</u>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');

  return html;
}

// Több feladat előnézet frissítése
function updateMultipleTasksPreview() {
  const text = document.getElementById('multipleTasksInput').value;
  const preview = document.getElementById('multipleTasksPreview');
  const parsed = parseMultipleTasks(text);

  if (text.trim() === '') {
    preview.textContent = '';
    return;
  }

  if (parsed.length === 0) {
    preview.textContent = '⚠️ Nem sikerült feladatot felismerni. Használd a formátumot: Feladatnév (perc) "megjegyzés"';
    preview.className = 'text-xs text-red-500 dark:text-red-400 mb-4 min-h-[20px]';
  } else {
    const totalMinutes = parsed.reduce((sum, t) => sum + t.duration, 0);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const timeStr = hours > 0 ? `${hours}ó ${mins}p` : `${mins}p`;
    const noteCount = parsed.filter(t => t.note).length;
    const noteStr = noteCount > 0 ? ` (${noteCount} megjegyzéssel)` : '';
    preview.textContent = `✅ ${parsed.length} feladat felismerve${noteStr} — Összes idő: ${timeStr}`;
    preview.className = 'text-xs text-green-600 dark:text-green-400 mb-4 min-h-[20px]';
  }
}

// Több feladat hozzáadása
function addMultipleTasks() {
  const text = document.getElementById('multipleTasksInput').value;
  const parsed = parseMultipleTasks(text);

  if (parsed.length === 0) {
    alert('Nem sikerült feladatot felismerni!\n\nKérlek használd a formátumot:\nFeladatnév (idő percben) "opcionális megjegyzés"\n\nA feladatokat pontosvesszővel (;) válaszd el.\n\nPl: Tervezés (30); Kódolás (60) "**Fontos**: nézd át *alaposan*"');
    return;
  }

  const usedColors = currentProject.tasks.map(t => t.color);
  const newTasks = [];

  parsed.forEach(taskData => {
    const newTask = {
      id: generateUUID(),
      name: taskData.name,
      duration: taskData.duration,
      note: taskData.note || '',
      color: getAvailableColor(usedColors),
      completed: false,
      progress: 0
    };
    usedColors.push(newTask.color); // Az újonnan adott színt is hozzáadjuk
    newTasks.push(newTask);
  });

  const topBtn = document.getElementById('multiplePositionTop');
  const atTop = topBtn && topBtn.getAttribute('data-active') === 'true';
  const activeCount = currentProject.tasks.filter(t => !t.completed).length;
  insertTasksAtActiveIndex(newTasks, atTop ? 0 : activeCount);

  saveCurrentProject();
  hideAddMultipleTasksModal();

  loadTasks();
  updateProjectProgress();
  updateTotalTime();
  updateRemainingTime();
  updateTimeline();
  initSortable();

  if (isPlaying && projectStartTime) {
    updateEndTime();
  }

  console.log('📋 Több feladat hozzáadva:', parsed.length, 'db');
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

// ---- Szünet (break) beállítások ----

// Szünet időtartam kiszámítása egy feladathoz (másodpercben)
function getBreakDurationForTask(task) {
  if (!currentProject.breakSettings) return 0;
  const bs = currentProject.breakSettings;
  if (!bs.value || bs.value <= 0) return 0;

  if (bs.mode === 'percent') {
    return Math.round(task.duration * 60 * (bs.value / 100));
  } else {
    return bs.value * 60;
  }
}

// Szünet időtartam formázása olvasható formátumba
function formatBreakDuration(seconds) {
  if (seconds < 60) return `${seconds} mp`;
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} perc`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}ó ${m}p` : `${h}ó`;
}

// Összes szünet idő az aktív feladatokhoz (másodpercben)
function getTotalBreakSeconds() {
  if (!currentProject.breakSettings || !currentProject.breakSettings.value) return 0;
  const activeTasks = currentProject.tasks.filter(t => !t.completed);
  let total = 0;
  // Szünet minden feladat UTÁN, kivéve az utolsó
  for (let i = 0; i < activeTasks.length - 1; i++) {
    total += getBreakDurationForTask(activeTasks[i]);
  }
  return total;
}

// Hátralévő szünet idő (másodpercben) — összes jövőbeli szünet
function getRemainingBreakSeconds() {
  if (!currentProject.breakSettings || !currentProject.breakSettings.value) return 0;
  const activeTasks = currentProject.tasks.filter(t => !t.completed);
  let total = 0;

  if (isOnBreak) {
    // Jelenlegi szünet hátralévő ideje
    total += Math.max(0, breakDurationSeconds - breakElapsedSeconds);
    // Összes jövőbeli szünet (minden aktív feladat után, kivéve az utolsó)
    for (let i = 0; i < activeTasks.length - 1; i++) {
      total += getBreakDurationForTask(activeTasks[i]);
    }
  } else {
    // Szünet az aktuális és az utána következő feladatok után (kivéve az utolsó)
    for (let i = currentTaskIndex; i < activeTasks.length - 1; i++) {
      total += getBreakDurationForTask(activeTasks[i]);
    }
  }
  return total;
}

// Modal megnyitása
function showBreakSettingsModal() {
  const bs = currentProject.breakSettings || { mode: 'percent', value: 0 };
  tempBreakMode = bs.mode || 'percent';
  tempBreakValue = bs.value || 0;

  document.getElementById('breakSettingsModal').classList.remove('hidden');
  switchBreakMode(tempBreakMode);
  updateBreakSettingsDisplay();
}

// Modal elrejtése
function hideBreakSettingsModal() {
  document.getElementById('breakSettingsModal').classList.add('hidden');
}

// Mód váltás (percent / minutes)
function switchBreakMode(mode) {
  tempBreakMode = mode;

  const percentBtn = document.getElementById('breakModePercent');
  const minutesBtn = document.getElementById('breakModeMinutes');

  if (mode === 'percent') {
    percentBtn.classList.add('bg-primary', 'text-white');
    percentBtn.classList.remove('bg-gray-200', 'dark:bg-gray-700', 'text-gray-800', 'dark:text-gray-200');
    minutesBtn.classList.remove('bg-primary', 'text-white');
    minutesBtn.classList.add('bg-gray-200', 'dark:bg-gray-700', 'text-gray-800', 'dark:text-gray-200');
  } else {
    minutesBtn.classList.add('bg-primary', 'text-white');
    minutesBtn.classList.remove('bg-gray-200', 'dark:bg-gray-700', 'text-gray-800', 'dark:text-gray-200');
    percentBtn.classList.remove('bg-primary', 'text-white');
    percentBtn.classList.add('bg-gray-200', 'dark:bg-gray-700', 'text-gray-800', 'dark:text-gray-200');
  }

  updateBreakSettingsDisplay();
}

// Kijelző frissítése
function updateBreakSettingsDisplay() {
  document.getElementById('breakValueDisplay').textContent = tempBreakValue;
  document.getElementById('breakValueUnit').textContent = tempBreakMode === 'percent' ? '%' : 'p';

  const infoEl = document.getElementById('breakInfoText');
  if (tempBreakValue === 0) {
    infoEl.textContent = 'Nincs szünet a feladatok között.';
  } else if (tempBreakMode === 'percent') {
    infoEl.textContent = `Pl. 25 perces feladat után ${formatBreakDuration(Math.round(25 * 60 * (tempBreakValue / 100)))} szünet.`;
  } else {
    infoEl.textContent = `Minden feladat után ${tempBreakValue} perc szünet.`;
  }
}

// Beállítások mentése
function saveBreakSettings() {
  currentProject.breakSettings = {
    mode: tempBreakMode,
    value: tempBreakValue
  };
  saveCurrentProject();
  hideBreakSettingsModal();
  loadProjectData();

  if (isPlaying && projectStartTime) {
    updateEndTime();
  }

  console.log('☕ Szünet beállítások mentve:', currentProject.breakSettings);
}

// Inicializálás
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProject);
} else {
  initProject();
}