/**
 * TimerPlus Application Controller
 * Orchestrates Timer, Audio Engine, Storage, Screen WakeLock, and PWA Installation.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Core Instances
  const timer = new WorkoutTimer();
  const storage = window.storageManager;
  const sound = window.soundEngine;

  // 2. DOM Elements
  const ambientGlow = document.getElementById('ambientGlow');
  const toastMsg = document.getElementById('toastMsg');
  const headerRoutineName = document.getElementById('headerRoutineName');
  const soundQuickBtn = document.getElementById('soundQuickBtn');
  const soundIconOn = document.getElementById('soundIconOn');
  const soundIconOff = document.getElementById('soundIconOff');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const openPresetsBtn = document.getElementById('openPresetsBtn');
  const openSettingsBtn = document.getElementById('openSettingsBtn');

  // Main Timer Display Elements
  const phasePill = document.getElementById('phasePill');
  const roundDisplay = document.getElementById('roundDisplay');
  const setDisplay = document.getElementById('setDisplay');
  const setDisplayWrapper = document.getElementById('setDisplayWrapper');
  const dialProgressRing = document.getElementById('dialProgressRing');
  const mainTimeDisplay = document.getElementById('mainTimeDisplay');
  const totalRemainingDisplay = document.getElementById('totalRemainingDisplay');
  const nextUpText = document.getElementById('nextUpText');
  const nextUpCard = document.getElementById('nextUpCard');
  const overallPercentText = document.getElementById('overallPercentText');
  const overallProgressBar = document.getElementById('overallProgressBar');

  // Controls
  const prevBtn = document.getElementById('prevBtn');
  const playBtn = document.getElementById('playBtn');
  const playIcon = document.getElementById('playIcon');
  const pauseIcon = document.getElementById('pauseIcon');
  const nextBtn = document.getElementById('nextBtn');
  const resetBtn = document.getElementById('resetBtn');
  const editCurrentRoutineBtn = document.getElementById('editCurrentRoutineBtn');
  const wakelockStatus = document.getElementById('wakelockStatus');
  const wakelockText = document.getElementById('wakelockText');

  // Modals
  const presetsModal = document.getElementById('presetsModal');
  const closePresetsBtn = document.getElementById('closePresetsBtn');
  const presetsListContainer = document.getElementById('presetsListContainer');
  const createNewRoutineBtn = document.getElementById('createNewRoutineBtn');

  const editorModal = document.getElementById('editorModal');
  const editorModalTitle = document.getElementById('editorModalTitle');
  const closeEditorBtn = document.getElementById('closeEditorBtn');
  const editNameInput = document.getElementById('editNameInput');
  const saveRoutineBtn = document.getElementById('saveRoutineBtn');
  const deleteRoutineBtn = document.getElementById('deleteRoutineBtn');

  const settingsModal = document.getElementById('settingsModal');
  const closeSettingsModalBtn = document.getElementById('closeSettingsModalBtn');
  const volumeSlider = document.getElementById('volumeSlider');
  const volumePercentText = document.getElementById('volumePercentText');
  const testBellBtn = document.getElementById('testBellBtn');
  const testBeepBtn = document.getElementById('testBeepBtn');
  const resetDefaultsBtn = document.getElementById('resetDefaultsBtn');
  const openIosGuideBtn = document.getElementById('openIosGuideBtn');

  const iosGuideModal = document.getElementById('iosGuideModal');
  const closeIosGuideBtn = document.getElementById('closeIosGuideBtn');
  const confirmIosGuideBtn = document.getElementById('confirmIosGuideBtn');

  // PWA Banner
  const pwaBanner = document.getElementById('pwaBanner');
  const pwaInstallBtn = document.getElementById('pwaInstallBtn');
  const pwaDismissBtn = document.getElementById('pwaDismissBtn');

  // Constants
  const DIAL_CIRCUMFERENCE = 2 * Math.PI * 115; // r=115 -> 722.56
  dialProgressRing.style.strokeDasharray = `${DIAL_CIRCUMFERENCE}`;

  // State Variables
  let wakeLockSentinel = null;
  let deferredInstallPrompt = null;
  let editingPreset = null; // null if creating new
  let currentEditorConfig = {
    work: 20,
    rest: 10,
    rounds: 8,
    sets: 1,
    setRest: 60,
    prepare: 10,
    cooldown: 0
  };

  // Phase Definitions & Styling
  const PHASE_THEMES = {
    prepare: {
      label: '준비',
      color: '#00C2FF',
      glow: 'rgba(0, 194, 255, 0.35)'
    },
    work: {
      label: '운동 (WORK)',
      color: '#00E676',
      glow: 'rgba(0, 230, 118, 0.4)'
    },
    rest: {
      label: '휴식 (REST)',
      color: '#FF9100',
      glow: 'rgba(255, 145, 0, 0.35)'
    },
    setRest: {
      label: '세트 휴식',
      color: '#B388FF',
      glow: 'rgba(179, 136, 255, 0.35)'
    },
    cooldown: {
      label: '마무리 쿨다운',
      color: '#00B4D8',
      glow: 'rgba(0, 180, 216, 0.35)'
    },
    finished: {
      label: '운동 완료! 🎉',
      color: '#FFD600',
      glow: 'rgba(255, 214, 0, 0.45)'
    }
  };

  // =========================================================================
  // Screen Wake Lock API (Crucial for mobile workouts)
  // =========================================================================
  async function requestWakeLock() {
    if ('wakeLock' in navigator) {
      try {
        wakeLockSentinel = await navigator.wakeLock.request('screen');
        wakelockText.textContent = '화면 유지 ON';
        wakelockStatus.style.color = 'var(--color-work)';
        wakeLockSentinel.addEventListener('release', () => {
          if (timer.status !== 'running') {
            wakelockText.textContent = '화면 유지 대기';
            wakelockStatus.style.color = 'var(--text-muted)';
          }
        });
      } catch (err) {
        console.warn('Wake Lock request error:', err);
      }
    }
  }

  function releaseWakeLock() {
    if (wakeLockSentinel) {
      wakeLockSentinel.release().catch(() => {});
      wakeLockSentinel = null;
    }
    wakelockText.textContent = '화면 유지 대기';
    wakelockStatus.style.color = 'var(--text-muted)';
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && timer.status === 'running') {
      requestWakeLock();
    }
  });

  // =========================================================================
  // Mobile Haptic Feedback
  // =========================================================================
  function triggerHaptic(pattern = [60]) {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Ignore vibration errors
      }
    }
  }

  // =========================================================================
  // Formatting Utilities
  // =========================================================================
  function formatTime(totalSeconds) {
    const sec = Math.max(0, Math.round(totalSeconds));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function showToast(text) {
    toastMsg.textContent = text;
    toastMsg.classList.add('show');
    setTimeout(() => {
      toastMsg.classList.remove('show');
    }, 2400);
  }

  // =========================================================================
  // Timer Event Handlers
  // =========================================================================
  timer.onTick = (data) => {
    // 1. Time display
    mainTimeDisplay.textContent = formatTime(data.phaseRemaining);
    totalRemainingDisplay.textContent = formatTime(data.totalRemaining);

    // 2. Radial Progress Ring
    // Progress starts full and reduces to 0 like an athletic countdown dial
    const remainingFraction = data.phaseDuration > 0
      ? data.phaseRemainingPrecise / data.phaseDuration
      : 0;
    const offset = DIAL_CIRCUMFERENCE * (1 - remainingFraction);
    dialProgressRing.style.strokeDashoffset = `${offset}`;

    // 3. Rounds and Sets display
    roundDisplay.textContent = `${data.round} / ${data.rounds}`;
    setDisplay.textContent = `${data.set} / ${data.sets}`;
    setDisplayWrapper.style.display = data.sets > 1 ? 'block' : 'none';

    // 4. Overall Linear Progress
    const pct = Math.min(100, Math.round(data.totalProgress * 100));
    overallPercentText.textContent = `${pct}%`;
    overallProgressBar.style.width = `${pct}%`;

    // 5. Next Phase preview
    if (data.status === 'finished') {
      nextUpText.textContent = '운동 완료!';
    } else if (data.nextInfo) {
      nextUpText.textContent = `${data.nextInfo.label} (${formatTime(data.nextInfo.duration)})`;
    }

    // 6. Play/Pause Button State
    if (data.status === 'running') {
      playIcon.style.display = 'none';
      pauseIcon.style.display = 'block';
    } else {
      playIcon.style.display = 'block';
      pauseIcon.style.display = 'none';
    }
  };

  timer.onPhaseChange = (phaseInfo) => {
    const theme = PHASE_THEMES[phaseInfo.phase] || PHASE_THEMES.work;

    // Update CSS variables for dynamic color changing theme
    document.documentElement.style.setProperty('--active-phase-color', theme.color);
    document.documentElement.style.setProperty('--active-phase-glow', theme.glow);
    phasePill.textContent = theme.label;

    // Audio & Haptic reactions
    if (phaseInfo.phase === 'work') {
      sound.playWorkStart();
      triggerHaptic([100, 50, 100]);
    } else if (phaseInfo.phase === 'rest') {
      sound.playRestStart();
      triggerHaptic([80]);
    } else if (phaseInfo.phase === 'setRest') {
      sound.playSetRestStart();
      triggerHaptic([100, 100, 100]);
    } else if (phaseInfo.phase === 'cooldown') {
      sound.playRestStart();
      triggerHaptic([60]);
    }
  };

  timer.onCountdownBeep = (sec) => {
    sound.playCountdownBeep(sec);
    triggerHaptic([40]);
  };

  timer.onComplete = () => {
    releaseWakeLock();
    sound.playComplete();
    triggerHaptic([200, 100, 200, 100, 400]);

    const theme = PHASE_THEMES.finished;
    document.documentElement.style.setProperty('--active-phase-color', theme.color);
    document.documentElement.style.setProperty('--active-phase-glow', theme.glow);
    phasePill.textContent = theme.label;
    showToast('🎉 운동을 성공적으로 완료했습니다!');
  };

  // =========================================================================
  // Load Active Routine
  // =========================================================================
  function loadActivePreset() {
    const preset = storage.getActivePreset();
    if (!preset) return;

    headerRoutineName.textContent = preset.name;
    timer.setConfig(preset);

    const theme = PHASE_THEMES[timer.currentPhase] || PHASE_THEMES.work;
    document.documentElement.style.setProperty('--active-phase-color', theme.color);
    document.documentElement.style.setProperty('--active-phase-glow', theme.glow);
    phasePill.textContent = theme.label;
  }

  // =========================================================================
  // Button Event Listeners
  // =========================================================================
  playBtn.addEventListener('click', () => {
    sound.playTap();
    if (timer.status === 'running') {
      timer.pause();
      releaseWakeLock();
    } else {
      timer.start();
      requestWakeLock();
    }
  });

  nextBtn.addEventListener('click', () => {
    sound.playTap();
    timer.skipNext();
  });

  prevBtn.addEventListener('click', () => {
    sound.playTap();
    timer.skipPrev();
  });

  resetBtn.addEventListener('click', () => {
    sound.playTap();
    timer.reset();
    releaseWakeLock();
    showToast('타이머가 초기화되었습니다.');
  });

  // Sound Quick Toggle in Header
  function updateSoundIcon() {
    if (sound.isMuted || sound.soundMode === 'mute') {
      soundIconOn.style.display = 'none';
      soundIconOff.style.display = 'block';
      soundQuickBtn.classList.remove('active');
    } else {
      soundIconOn.style.display = 'block';
      soundIconOff.style.display = 'none';
      soundQuickBtn.classList.add('active');
    }
  }

  soundQuickBtn.addEventListener('click', () => {
    sound.isMuted = !sound.isMuted;
    sound.saveSettings();
    updateSoundIcon();
    showToast(sound.isMuted ? '소리 꺼짐 (무음)' : '소리 켜짐');
  });

  // Fullscreen Toggle
  fullscreenBtn.addEventListener('click', () => {
    sound.playTap();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });

  // =========================================================================
  // Routine Presets Drawer
  // =========================================================================
  function renderPresetsList() {
    const presets = storage.getPresets();
    const activeId = storage.activePresetId;

    presetsListContainer.innerHTML = '';

    presets.forEach((p) => {
      const card = document.createElement('div');
      card.className = `preset-card ${p.id === activeId ? 'active' : ''}`;

      // Calculate total duration for badge
      const totalSec = (p.prepare || 0) + (p.cooldown || 0) +
        (p.sets * ((p.work * p.rounds) + (p.rest * (p.rounds - 1)))) +
        ((p.sets - 1) * (p.setRest || 0));

      card.innerHTML = `
        <div class="preset-info">
          <div class="preset-title-row">
            <span class="preset-name">${p.name}</span>
            <span class="preset-tag" style="${p.color ? `background:${p.color}22; color:${p.color}; border:1px solid ${p.color}44;` : ''}">${p.tag || '루틴'}</span>
          </div>
          <div class="preset-meta">
            <span>운동: ${formatTime(p.work)}</span>
            <span>휴식: ${formatTime(p.rest)}</span>
            <span>${p.rounds}R ${p.sets > 1 ? `× ${p.sets}S` : ''}</span>
            <span>총 ${formatTime(totalSec)}</span>
          </div>
        </div>
        <div class="preset-card-actions">
          <button class="icon-btn edit-preset-btn" data-id="${p.id}" title="편집">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
          </button>
        </div>
      `;

      // Select preset on card click
      card.addEventListener('click', (e) => {
        if (e.target.closest('.edit-preset-btn')) return;
        sound.playTap();
        storage.setActivePresetId(p.id);
        loadActivePreset();
        presetsModal.classList.remove('active');
        showToast(`'${p.name}' 루틴이 선택되었습니다.`);
      });

      // Edit preset button
      const editBtn = card.querySelector('.edit-preset-btn');
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sound.playTap();
        presetsModal.classList.remove('active');
        openEditorForPreset(p);
      });

      presetsListContainer.appendChild(card);
    });
  }

  openPresetsBtn.addEventListener('click', () => {
    sound.playTap();
    renderPresetsList();
    presetsModal.classList.add('active');
  });

  closePresetsBtn.addEventListener('click', () => {
    presetsModal.classList.remove('active');
  });

  presetsModal.addEventListener('click', (e) => {
    if (e.target === presetsModal) presetsModal.classList.remove('active');
  });

  // =========================================================================
  // Routine Editor Logic
  // =========================================================================
  function updateEditorDisplay() {
    document.getElementById('valEditWork').textContent = formatTime(currentEditorConfig.work);
    document.getElementById('valEditRest').textContent = formatTime(currentEditorConfig.rest);
    document.getElementById('valEditRounds').textContent = currentEditorConfig.rounds;
    document.getElementById('valEditSets').textContent = currentEditorConfig.sets;
    document.getElementById('valEditSetRest').textContent = formatTime(currentEditorConfig.setRest);
    document.getElementById('valEditPrepare').textContent = formatTime(currentEditorConfig.prepare);
  }

  function openEditorForPreset(preset = null) {
    editingPreset = preset;
    if (preset) {
      editorModalTitle.textContent = `루틴 수정: ${preset.name}`;
      editNameInput.value = preset.name;
      currentEditorConfig = {
        work: preset.work,
        rest: preset.rest,
        rounds: preset.rounds,
        sets: preset.sets,
        setRest: preset.setRest ?? 60,
        prepare: preset.prepare ?? 10,
        cooldown: preset.cooldown ?? 0
      };
      deleteRoutineBtn.style.display = preset.isBuiltin ? 'none' : 'block';
    } else {
      editorModalTitle.textContent = '새로운 루틴 만들기';
      editNameInput.value = '나만의 운동 루틴';
      currentEditorConfig = {
        work: 30,
        rest: 15,
        rounds: 6,
        sets: 1,
        setRest: 60,
        prepare: 10,
        cooldown: 0
      };
      deleteRoutineBtn.style.display = 'none';
    }

    updateEditorDisplay();
    editorModal.classList.add('active');
  }

  // Stepper buttons in Editor
  document.querySelectorAll('.step-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      sound.playTap();
      const step = parseInt(btn.dataset.step, 10);
      const target = btn.dataset.target;

      if (target === 'editWork') {
        currentEditorConfig.work = Math.max(5, currentEditorConfig.work + step);
      } else if (target === 'editRest') {
        currentEditorConfig.rest = Math.max(0, currentEditorConfig.rest + step);
      } else if (target === 'editRounds') {
        currentEditorConfig.rounds = Math.max(1, Math.min(99, currentEditorConfig.rounds + step));
      } else if (target === 'editSets') {
        currentEditorConfig.sets = Math.max(1, Math.min(20, currentEditorConfig.sets + step));
      } else if (target === 'editSetRest') {
        currentEditorConfig.setRest = Math.max(0, currentEditorConfig.setRest + step);
      } else if (target === 'editPrepare') {
        currentEditorConfig.prepare = Math.max(0, Math.min(60, currentEditorConfig.prepare + step));
      }

      updateEditorDisplay();
    });
  });

  createNewRoutineBtn.addEventListener('click', () => {
    presetsModal.classList.remove('active');
    openEditorForPreset(null);
  });

  editCurrentRoutineBtn.addEventListener('click', () => {
    const active = storage.getActivePreset();
    openEditorForPreset(active);
  });

  saveRoutineBtn.addEventListener('click', () => {
    sound.playTap();
    const name = editNameInput.value.trim() || '운동 루틴';
    const presetData = {
      ...currentEditorConfig,
      name,
      id: editingPreset ? editingPreset.id : undefined
    };

    const saved = storage.savePreset(presetData);
    storage.setActivePresetId(saved.id);
    loadActivePreset();
    editorModal.classList.remove('active');
    showToast(`'${name}' 루틴이 저장 및 적용되었습니다.`);
  });

  deleteRoutineBtn.addEventListener('click', () => {
    if (!editingPreset || editingPreset.isBuiltin) return;
    if (confirm(`'${editingPreset.name}' 루틴을 정말 삭제하시겠습니까?`)) {
      storage.deletePreset(editingPreset.id);
      loadActivePreset();
      editorModal.classList.remove('active');
      showToast('루틴이 삭제되었습니다.');
    }
  });

  closeEditorBtn.addEventListener('click', () => {
    editorModal.classList.remove('active');
  });

  editorModal.addEventListener('click', (e) => {
    if (e.target === editorModal) editorModal.classList.remove('active');
  });

  // =========================================================================
  // Settings & Audio Modal
  // =========================================================================
  openSettingsBtn.addEventListener('click', () => {
    sound.playTap();
    // Sync UI with current sound settings
    volumeSlider.value = Math.round(sound.volume * 100);
    volumePercentText.textContent = `${Math.round(sound.volume * 100)}%`;

    document.querySelectorAll('.seg-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.mode === sound.soundMode);
    });

    settingsModal.classList.add('active');
  });

  closeSettingsModalBtn.addEventListener('click', () => {
    settingsModal.classList.remove('active');
  });

  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) settingsModal.classList.remove('active');
  });

  // Segmented sound mode buttons
  document.querySelectorAll('.seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      sound.playTap();
      document.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      sound.soundMode = btn.dataset.mode;
      sound.isMuted = (sound.soundMode === 'mute');
      sound.saveSettings();
      updateSoundIcon();
    });
  });

  // Volume slider
  volumeSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    sound.volume = val / 100;
    volumePercentText.textContent = `${val}%`;
    sound.saveSettings();
  });

  // Test sound triggers
  testBellBtn.addEventListener('click', () => {
    sound.playBoxingBell();
  });

  testBeepBtn.addEventListener('click', () => {
    sound.playCountdownBeep(3);
    setTimeout(() => sound.playCountdownBeep(2), 500);
    setTimeout(() => sound.playCountdownBeep(1), 1000);
  });

  resetDefaultsBtn.addEventListener('click', () => {
    if (confirm('모든 루틴을 초기 기본 설정으로 되돌리시겠습니까?')) {
      storage.resetToDefaults();
      loadActivePreset();
      settingsModal.classList.remove('active');
      showToast('기본 루틴으로 복원되었습니다.');
    }
  });

  // iOS Guide Modal
  openIosGuideBtn.addEventListener('click', () => {
    settingsModal.classList.remove('active');
    iosGuideModal.classList.add('active');
  });

  closeIosGuideBtn.addEventListener('click', () => {
    iosGuideModal.classList.remove('active');
  });

  confirmIosGuideBtn.addEventListener('click', () => {
    iosGuideModal.classList.remove('active');
  });

  // =========================================================================
  // PWA Service Worker & Installation
  // =========================================================================
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then((reg) => {
          console.log('[PWA] Service Worker registered with scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('[PWA] Service Worker registration failed:', err);
        });
    });
  }

  // Handle Chrome / Android PWA beforeinstallprompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    pwaBanner.classList.add('show');
  });

  pwaInstallBtn.addEventListener('click', async () => {
    if (deferredInstallPrompt) {
      pwaBanner.classList.remove('show');
      deferredInstallPrompt.prompt();
      const choice = await deferredInstallPrompt.userChoice;
      console.log('User installation choice:', choice.outcome);
      deferredInstallPrompt = null;
    }
  });

  if (pwaDismissBtn) {
    pwaDismissBtn.addEventListener('click', () => {
      pwaBanner.classList.remove('show');
    });
  }

  window.addEventListener('appinstalled', () => {
    pwaBanner.classList.remove('show');
    showToast('앱이 성공적으로 설치되었습니다!');
  });

  // Detect iOS Safari to show helpful tip
  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
  if (isIos && !isStandalone) {
    console.log('iOS Safari detected without standalone mode');
  }

  // =========================================================================
  // Initialize App
  // =========================================================================
  loadActivePreset();
  updateSoundIcon();
});
