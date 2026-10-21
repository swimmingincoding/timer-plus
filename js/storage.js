/**
 * TimerPlus Preset & Local Storage Management
 */
const DEFAULT_PRESETS = [
  {
    id: 'tabata-classic',
    name: '타바타 4분 (Tabata)',
    tag: '타바타',
    color: '#00E676',
    prepare: 10,
    work: 20,
    rest: 10,
    rounds: 8,
    sets: 1,
    setRest: 60,
    cooldown: 0,
    isBuiltin: true
  },
  {
    id: 'boxing-3min',
    name: '복싱 3분 5라운드 (Boxing)',
    tag: '복싱/격투기',
    color: '#FF9100',
    prepare: 10,
    work: 180,
    rest: 60,
    rounds: 5,
    sets: 1,
    setRest: 60,
    cooldown: 0,
    isBuiltin: true
  },
  {
    id: 'hiit-circuit',
    name: '고강도 HIIT 서킷 (45s / 15s)',
    tag: 'HIIT',
    color: '#00C2FF',
    prepare: 10,
    work: 45,
    rest: 15,
    rounds: 4,
    sets: 3,
    setRest: 60,
    cooldown: 30,
    isBuiltin: true
  },
  {
    id: 'emom-10min',
    name: 'EMOM 10분 트레이닝',
    tag: 'EMOM',
    color: '#B388FF',
    prepare: 5,
    work: 50,
    rest: 10,
    rounds: 10,
    sets: 1,
    setRest: 0,
    cooldown: 0,
    isBuiltin: true
  },
  {
    id: 'stretching-flow',
    name: '스트레칭 & 폼롤러 (30s)',
    tag: '스트레칭',
    color: '#26A69A',
    prepare: 5,
    work: 30,
    rest: 5,
    rounds: 12,
    sets: 1,
    setRest: 0,
    cooldown: 0,
    isBuiltin: true
  }
];

class StorageManager {
  constructor() {
    this.STORAGE_KEY = 'timerplus_presets_v1';
    this.ACTIVE_ID_KEY = 'timerplus_active_preset_id';
    this.LAST_WORKOUT_KEY = 'timerplus_last_active_workout';
    this.presets = [];
    this.activePresetId = null;

    this.init();
  }

  init() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.presets = JSON.parse(stored);
      } else {
        this.presets = [...DEFAULT_PRESETS];
        this.savePresets();
      }

      // 1. Check if an explicit last configured/used workout is saved
      const lastWorkoutRaw = localStorage.getItem(this.LAST_WORKOUT_KEY);
      if (lastWorkoutRaw) {
        try {
          const lastWorkout = JSON.parse(lastWorkoutRaw);
          if (lastWorkout && lastWorkout.id) {
            this.activePresetId = lastWorkout.id;
            // Ensure presets list has the latest version of this workout
            const existingIdx = this.presets.findIndex(p => p.id === lastWorkout.id);
            if (existingIdx !== -1) {
              this.presets[existingIdx] = { ...this.presets[existingIdx], ...lastWorkout };
            } else {
              this.presets.unshift(lastWorkout);
            }
            this.savePresets();
          }
        } catch (err) {
          console.warn('Failed to parse last workout', err);
        }
      }

      if (!this.activePresetId) {
        this.activePresetId = localStorage.getItem(this.ACTIVE_ID_KEY) || this.presets[0].id;
      }

      if (!this.getActivePreset()) {
        this.activePresetId = this.presets[0]?.id || 'tabata-classic';
      }
    } catch (e) {
      console.warn('Storage init failed, using defaults', e);
      this.presets = [...DEFAULT_PRESETS];
      this.activePresetId = 'tabata-classic';
    }
  }

  savePresets() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.presets));
    } catch (e) {
      console.error('Failed to save presets to localStorage', e);
    }
  }

  getPresets() {
    return this.presets;
  }

  getActivePreset() {
    // Check presets by activePresetId
    const found = this.presets.find(p => p.id === this.activePresetId);
    if (found) return found;

    // Fallback to last workout or first preset
    try {
      const saved = localStorage.getItem(this.LAST_WORKOUT_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}

    return this.presets[0];
  }

  setActivePresetId(id) {
    const preset = this.presets.find(p => p.id === id);
    if (preset) {
      this.activePresetId = id;
      localStorage.setItem(this.ACTIVE_ID_KEY, id);
      localStorage.setItem(this.LAST_WORKOUT_KEY, JSON.stringify(preset));
      return preset;
    }
    return null;
  }

  savePreset(presetData) {
    let targetPreset = null;

    if (presetData.id) {
      // Update existing
      const index = this.presets.findIndex(p => p.id === presetData.id);
      if (index !== -1) {
        this.presets[index] = { ...this.presets[index], ...presetData };
        targetPreset = this.presets[index];
      }
    }

    if (!targetPreset) {
      // Create new
      targetPreset = {
        ...presetData,
        id: 'custom-' + Date.now(),
        isBuiltin: false,
        tag: presetData.tag || '커스텀'
      };
      this.presets.push(targetPreset);
    }

    this.activePresetId = targetPreset.id;
    this.savePresets();
    localStorage.setItem(this.ACTIVE_ID_KEY, targetPreset.id);
    localStorage.setItem(this.LAST_WORKOUT_KEY, JSON.stringify(targetPreset));
    return targetPreset;
  }

  saveLastWorkout(workout) {
    if (!workout) return;
    try {
      localStorage.setItem(this.LAST_WORKOUT_KEY, JSON.stringify(workout));
      if (workout.id) {
        this.activePresetId = workout.id;
        localStorage.setItem(this.ACTIVE_ID_KEY, workout.id);
      }
    } catch (e) {
      console.warn('Failed to save last workout', e);
    }
  }

  deletePreset(id) {
    const target = this.presets.find(p => p.id === id);
    if (!target || target.isBuiltin) return false;

    this.presets = this.presets.filter(p => p.id !== id);
    if (this.activePresetId === id) {
      this.activePresetId = this.presets[0].id;
      localStorage.setItem(this.ACTIVE_ID_KEY, this.activePresetId);
    }
    this.savePresets();
    return true;
  }

  duplicatePreset(id) {
    const original = this.presets.find(p => p.id === id);
    if (!original) return null;

    const copy = {
      ...original,
      id: 'custom-' + Date.now(),
      name: `${original.name} (복사본)`,
      tag: '커스텀',
      isBuiltin: false
    };

    this.presets.push(copy);
    this.activePresetId = copy.id;
    this.savePresets();
    localStorage.setItem(this.ACTIVE_ID_KEY, copy.id);
    return copy;
  }

  resetToDefaults() {
    this.presets = [...DEFAULT_PRESETS];
    this.activePresetId = this.presets[0].id;
    this.savePresets();
    localStorage.setItem(this.ACTIVE_ID_KEY, this.activePresetId);
    return this.presets;
  }
}

window.storageManager = new StorageManager();
