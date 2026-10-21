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

      this.activePresetId = localStorage.getItem(this.ACTIVE_ID_KEY) || this.presets[0].id;
      // If active preset doesn't exist anymore, pick first
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
    return this.presets.find(p => p.id === this.activePresetId) || this.presets[0];
  }

  setActivePresetId(id) {
    if (this.presets.some(p => p.id === id)) {
      this.activePresetId = id;
      localStorage.setItem(this.ACTIVE_ID_KEY, id);
      return this.getActivePreset();
    }
    return null;
  }

  savePreset(presetData) {
    if (presetData.id) {
      // Update existing
      const index = this.presets.findIndex(p => p.id === presetData.id);
      if (index !== -1) {
        this.presets[index] = { ...this.presets[index], ...presetData };
        this.savePresets();
        return this.presets[index];
      }
    }

    // Create new
    const newPreset = {
      ...presetData,
      id: 'custom-' + Date.now(),
      isBuiltin: false,
      tag: presetData.tag || '커스텀'
    };
    this.presets.push(newPreset);
    this.activePresetId = newPreset.id;
    this.savePresets();
    localStorage.setItem(this.ACTIVE_ID_KEY, newPreset.id);
    return newPreset;
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
