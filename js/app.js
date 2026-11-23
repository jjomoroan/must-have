(function () {
  'use strict';

  const params = new URLSearchParams(window.location.search);
  const IS_TEST = params.get('mode') === 'test';
  const IS_SELFTEST = params.has('selftest');
  const TEST_RUN = (params.get('run') || 'session').replace(/[^a-z0-9_-]/gi, '').slice(0, 40) || 'session';
  const STORAGE_KEY = IS_SELFTEST
    ? 'must-have.selftest.v1'
    : IS_TEST
      ? 'must-have.test.' + TEST_RUN + '.v1'
      : 'must-have.v1';
  const DEFAULT_THEME = 'paper';
  const DEFAULT_BG = 'bamboo';
  const TEST_PASSWORD = '0211';
  const MAX_MONEY = 999999;
  const ZOOMS = [0.5, 0.75, 1, 1.25, 1.5];

  const THEMES = [
    { id: 'paper', name: 'Бумага', fill: '#f4eee2', border: '#b47b5c', text: '#393832' },
    { id: 'peach', name: 'Персик', fill: '#f4dfd1', border: '#d08768', text: '#4d3831' },
    { id: 'sage', name: 'Полынь', fill: '#e4ecdc', border: '#789267', text: '#384436' },
    { id: 'mist', name: 'Туман', fill: '#e0eae9', border: '#6e9097', text: '#32464a' },
    { id: 'indigo', name: 'Керамика', fill: '#d5e6ed', border: '#4e7f96', text: '#263c46' },
    { id: 'pine', name: 'Хвоя', fill: '#cad8ce', border: '#547663', text: '#26362e' },
    { id: 'night', name: 'Тушь', fill: '#3e3f3f', border: '#c9a87a', text: '#f2ecdf' }
  ];

  const BACKGROUNDS = [
    {
      id: 'bamboo', name: 'Бамбук',
      base: 'assets/backgrounds/bamboo-base.webp',
      motion: 'assets/backgrounds/motion/bamboo.svg',
      thumb: 'assets/backgrounds/thumbs/bamboo.jpg'
    },
    {
      id: 'rain', name: 'Дождь',
      base: 'assets/backgrounds/rain-base.webp',
      motion: 'assets/backgrounds/motion/rain.svg',
      thumb: 'assets/backgrounds/thumbs/rain.jpg'
    },
    {
      id: 'waves', name: 'Волны',
      base: 'assets/backgrounds/waves-base.webp',
      motion: 'assets/backgrounds/motion/waves.svg',
      thumb: 'assets/backgrounds/thumbs/waves.jpg'
    },
    {
      id: 'castle', name: 'Терем',
      base: 'assets/backgrounds/castle-base.webp',
      motion: 'assets/backgrounds/motion/castle.svg',
      thumb: 'assets/backgrounds/thumbs/castle.jpg'
    },
    {
      id: 'petals', name: 'Лепестки',
      base: 'assets/backgrounds/petals-base.webp',
      motion: 'assets/backgrounds/motion/petals.svg',
      thumb: 'assets/backgrounds/thumbs/petals.jpg'
    },
    {
      id: 'hills', name: 'Террасы',
      base: 'assets/backgrounds/hills-base.webp',
      motion: 'assets/backgrounds/motion/hills.svg',
      thumb: 'assets/backgrounds/thumbs/hills.jpg'
    }
  ];

  const BLOCK_NAMES = { a: 'А', b: 'Б', c: 'В' };
  const nf = new Intl.NumberFormat('ru-RU');
  const dateFmt = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });

  const $ = (selector, root) => (root || document).querySelector(selector);
  const $$ = (selector, root) => Array.from((root || document).querySelectorAll(selector));

  const els = {
    body: document.body,
    haveInput: $('#haveInput'),
    haveHint: $('#haveHint'),
    needValue: $('#needValue'),
    needHint: $('#needHint'),
    aSub: $('#aSub'),
    bSub: $('#bSub'),
    cSub: $('#cSub'),
    goalPercent: $('#goalPercent'),
    goalRemain: $('#goalRemain'),
    goalBar: $('#goalBar'),
    goalFill: $('#goalFill'),
    wishList: $('#wishList'),
    wishEmpty: $('#wishEmpty'),
    stepList: $('#stepList'),
    stepEmpty: $('#stepEmpty'),
    addWishBtn: $('#addWishBtn'),
    addStepBtn: $('#addStepBtn'),
    wishDialog: $('#wishDialog'),
    stepDialog: $('#stepDialog'),
    wishForm: $('#wishForm'),
    stepForm: $('#stepForm'),
    confirmDialog: $('#confirmDialog'),
    confirmYes: $('#confirmYes'),
    confirmNo: $('#confirmNo'),
    pinDialog: $('#pinDialog'),
    pinForm: $('#pinForm'),
    pinInput: $('#pinInput'),
    pinError: $('#pinError'),
    settingsDialog: $('#settingsDialog'),
    themeGrid: $('#themeGrid'),
    bgGrid: $('#bgGrid'),
    customBgInput: $('#customBgInput'),
    toast: $('#toast'),
    savePill: $('#savePill'),
    savePillText: $('#savePillText'),
    zoomValue: $('#zoomValue'),
    settingsZoomValue: $('#settingsZoomValue'),
    testBanner: $('#testBanner'),
    testResetBtn: $('#testResetBtn'),
    testCloseBtn: $('#testCloseBtn'),
    archiveWishes: $('#archiveWishes'),
    archiveSteps: $('#archiveSteps'),
    archiveSaved: $('#archiveSaved'),
    archiveMode: $('#archiveMode'),
    applyVisualBtn: $('#applyVisualBtn'),
    visualResetBtn: $('#visualResetBtn')
  };

  let state = loadState();
  let draft = null;
  let confirmResolver = null;
  let toastTimer = 0;
  let savePillTimer = 0;
  let bgActive = 0;
  let currentBgSrc = '';
  let lastSaveFailed = false;

  /* ---------------- Данные ---------------- */

  function createDefaultState() {
    return {
      version: 1,
      manualAmount: 0,
      wishes: [],
      steps: [],
      visual: {
        theme: DEFAULT_THEME,
        background: DEFAULT_BG,
        customBackground: null
      },
      zoom: 1,
      ui: {
        collapsed: { a: false, b: false, c: false },
        closed: { a: false, b: false, c: false }
      },
      updatedAt: null
    };
  }

  function onlyDigits(value) {
    return String(value == null ? '' : value).replace(/\D/g, '').slice(0, 6);
  }

  function clampMoney(value) {
    const n = parseInt(onlyDigits(value), 10);
    return Number.isFinite(n) ? Math.min(n, MAX_MONEY) : 0;
  }

  function uid() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
  }

  function normalizeState(input) {
    const out = createDefaultState();
    if (!input || typeof input !== 'object') return out;

    out.manualAmount = clampMoney(input.manualAmount != null ? input.manualAmount : input.baseAmount);
    out.updatedAt = typeof input.updatedAt === 'string' ? input.updatedAt : null;

    const seenWishes = new Set();
    if (Array.isArray(input.wishes)) {
      out.wishes = input.wishes.slice(0, 300).map((item) => {
        if (!item || typeof item !== 'object') return null;
        let id = typeof item.id === 'string' && item.id ? item.id : uid();
        if (seenWishes.has(id)) id = uid();
        seenWishes.add(id);
        return {
          id,
          name: String(item.name || '').slice(0, 54),
          description: String(item.description || '').slice(0, 3000),
          price: clampMoney(item.price),
          createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString()
        };
      }).filter((item) => item && item.name);
    }

    const seenSteps = new Set();
    if (Array.isArray(input.steps)) {
      out.steps = input.steps.slice(0, 300).map((item) => {
        if (!item || typeof item !== 'object') return null;
        let id = typeof item.id === 'string' && item.id ? item.id : uid();
        if (seenSteps.has(id)) id = uid();
        seenSteps.add(id);
        return {
          id,
          name: String(item.name || '').slice(0, 54),
          description: String(item.description || '').slice(0, 3000),
          amount: clampMoney(item.amount),
          time: String(item.time || '').slice(0, 40),
          done: item.done === true,
          createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString()
        };
      }).filter((item) => item && item.name);
    }

    const visual = input.visual && typeof input.visual === 'object' ? input.visual : {};
    const themeOk = THEMES.some((theme) => theme.id === visual.theme);
    const bgOk = BACKGROUNDS.some((bg) => bg.id === visual.background);
    const customOk = typeof visual.customBackground === 'string' && /^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(visual.customBackground);
    out.visual.theme = themeOk ? visual.theme : DEFAULT_THEME;
    out.visual.customBackground = customOk && visual.customBackground.length < 4500000 ? visual.customBackground : null;
    out.visual.background = visual.background === 'custom' && out.visual.customBackground
      ? 'custom'
      : bgOk
        ? visual.background
        : DEFAULT_BG;

    const zoom = Number(input.zoom);
    out.zoom = ZOOMS.indexOf(zoom) >= 0 ? zoom : 1;

    if (input.ui && typeof input.ui === 'object') {
      ['a', 'b', 'c'].forEach((key) => {
        if (input.ui.collapsed && typeof input.ui.collapsed[key] === 'boolean') {
          out.ui.collapsed[key] = input.ui.collapsed[key];
        }
        if (input.ui.closed && typeof input.ui.closed[key] === 'boolean') {
          out.ui.closed[key] = input.ui.closed[key];
        }
      });
    }
    return out;
  }

  function loadState() {
    let raw = null;
    try {
      raw = window.localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      return createDefaultState();
    }
    if (!raw) return createDefaultState();
    try {
      return normalizeState(JSON.parse(raw));
    } catch (error) {
      try {
        window.localStorage.setItem(STORAGE_KEY + '.broken.' + Date.now(), raw.slice(0, 100000));
      } catch (ignored) { /* no-op */ }
      return createDefaultState();
    }
  }

  function persist(options) {
    const settings = options || {};
    state.updatedAt = new Date().toISOString();
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      lastSaveFailed = false;
      if (!settings.silent) showSavePill('Сохранено локально');
      return true;
    } catch (error) {
      lastSaveFailed = true;
      showSavePill('Не удалось сохранить');
      showToast('Хранилище браузера заполнено. Уменьшите свой фон или экспортируйте архив.');
      return false;
    }
  }

  function showSavePill(text) {
    if (!els.savePill) return;
    els.savePillText.textContent = text || 'Сохранено локально';
    els.savePill.classList.add('is-visible');
    window.clearTimeout(savePillTimer);
    savePillTimer = window.setTimeout(() => els.savePill.classList.remove('is-visible'), 1700);
  }

  function showToast(text) {
    if (!els.toast) return;
    window.clearTimeout(toastTimer);
    els.toast.textContent = text;
    els.toast.hidden = false;
    toastTimer = window.setTimeout(() => {
      els.toast.hidden = true;
    }, 3200);
  }

  function plural(n, one, few, many) {
    const abs = Math.abs(n) % 100;
    const last = abs % 10;
    if (abs > 10 && abs < 20) return many;
    if (last > 1 && last < 5) return few;
    if (last === 1) return one;
    return many;
  }

  function formatMoney(value) {
    return nf.format(Math.max(0, Math.round(Number(value) || 0)));
  }

  function escapeHTML(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[char]);
  }

  function icon(name) {
    return '<svg aria-hidden="true"><use href="#i-' + name + '"></use></svg>';
  }

  function checkedTotal() {
    return state.steps.reduce((sum, step) => sum + (step.done ? step.amount : 0), 0);
  }

  function haveTotal() {
    return state.manualAmount + checkedTotal();
  }

  function needTotal() {
    return state.wishes.reduce((sum, wish) => sum + wish.price, 0);
  }

  function findWish(id) {
    return state.wishes.find((item) => item.id === id);
  }

  function findStep(id) {
    return state.steps.find((item) => item.id === id);
  }

  /* ---------------- Отрисовка ---------------- */

  function renderAll() {
    renderTotals();
    renderWishes();
    renderSteps();
    renderBlockState();
    renderZoom();
    updateArchiveStats();
  }

  function sizeHaveInput() {
    const value = els.haveInput.value || '0';
    const style = getComputedStyle(els.haveInput);
    if (!sizeHaveInput._canvas) sizeHaveInput._canvas = document.createElement('canvas');
    const ctx = sizeHaveInput._canvas.getContext('2d');
    ctx.font = style.font || (style.fontStyle + ' ' + style.fontWeight + ' ' + style.fontSize + ' ' + style.fontFamily);
    const width = ctx.measureText(value).width;
    els.haveInput.style.width = Math.max(20, Math.ceil(width + 2)) + 'px';
  }

  function renderTotals() {
    const have = haveTotal();
    const need = needTotal();
    const checked = checkedTotal();

    if (document.activeElement !== els.haveInput) {
      els.haveInput.value = formatMoney(have);
    }
    sizeHaveInput();

    els.needValue.textContent = formatMoney(need);
    els.haveHint.textContent = checked > 0
      ? 'Включая выполненные шаги: ' + formatMoney(checked) + ' ₽'
      : 'Можно ввести до 6 цифр';
    els.needHint.textContent = state.wishes.length
      ? 'Складывается из ' + state.wishes.length + ' ' + plural(state.wishes.length, 'желание', 'желания', 'желаний')
      : 'Складывается из желаний в блоке Б';

    els.aSub.textContent = checked > 0
      ? 'Шаги добавили ' + formatMoney(checked) + ' ₽'
      : 'Сколько есть и сколько нужно';

    const percent = need > 0 ? Math.min(100, Math.round((have / need) * 100)) : 0;
    els.goalPercent.textContent = need > 0 ? percent + '% цели' : 'Цель пока не задана';
    els.goalRemain.textContent = need === 0
      ? 'Добавь желания в блок Б'
      : have >= need
        ? 'Цель достигнута'
        : 'Осталось ' + formatMoney(need - have) + ' ₽';
    els.goalFill.style.width = percent + '%';
    els.goalBar.setAttribute('aria-valuenow', String(percent));
  }

  function renderWishes() {
    const total = needTotal();
    const count = state.wishes.length;
    els.bSub.textContent = count
      ? count + ' ' + plural(count, 'желание', 'желания', 'желаний') + ' · ' + formatMoney(total) + ' ₽'
      : '0 желаний · 0 ₽';
    els.wishEmpty.hidden = count > 0;

    if (!count) {
      els.wishList.innerHTML = '';
      return;
    }

    els.wishList.innerHTML = state.wishes.map((wish) => {
      const desc = wish.description
        ? '<p class="item-desc">' + escapeHTML(wish.description) + '</p>'
        : '';
      return '' +
        '<article class="item wish-item" data-id="' + escapeHTML(wish.id) + '">' +
          '<div class="item-main">' +
            '<h3 class="item-title">' + escapeHTML(wish.name) + '</h3>' +
            desc +
          '</div>' +
          '<div class="item-side">' +
            '<span class="item-price">' + formatMoney(wish.price) + ' ₽</span>' +
            '<div class="item-actions">' +
              '<button class="icon-btn" type="button" data-action="edit-wish" data-id="' + escapeHTML(wish.id) + '" aria-label="Редактировать желание «' + escapeHTML(wish.name) + '»" title="Редактировать">' + icon('pencil') + '</button>' +
              '<button class="icon-btn" type="button" data-action="delete-wish" data-id="' + escapeHTML(wish.id) + '" aria-label="Удалить желание «' + escapeHTML(wish.name) + '»" title="Удалить">' + icon('trash') + '</button>' +
            '</div>' +
          '</div>' +
        '</article>';
    }).join('');
  }

  function renderSteps() {
    const amount = state.steps.reduce((sum, step) => sum + step.amount, 0);
    const done = state.steps.filter((step) => step.done).length;
    els.cSub.textContent = state.steps.length
      ? state.steps.length + ' ' + plural(state.steps.length, 'шаг', 'шага', 'шагов') + ' · ' + formatMoney(amount) + ' ₽' + (done ? ' · готово ' + done : '')
      : '0 шагов · 0 ₽';
    els.stepEmpty.hidden = state.steps.length > 0;

    if (!state.steps.length) {
      els.stepList.innerHTML = '';
      return;
    }

    els.stepList.innerHTML = state.steps.map((step) => {
      const desc = step.description
        ? '<p class="item-desc">' + escapeHTML(step.description) + '</p>'
        : '';
      const time = step.time
        ? '<span class="item-time">' + icon('clock') + '<span>' + escapeHTML(step.time) + '</span></span>'
        : '';
      return '' +
        '<article class="item step-item' + (step.done ? ' is-done' : '') + '" data-id="' + escapeHTML(step.id) + '">' +
          '<button class="check" type="button" role="checkbox" aria-checked="' + (step.done ? 'true' : 'false') + '" data-action="toggle-step" data-id="' + escapeHTML(step.id) + '" aria-label="' + (step.done ? 'Снять отметку с шага' : 'Отметить шаг выполненным') + ' «' + escapeHTML(step.name) + '»">' + icon('check') + '</button>' +
          '<div class="item-main">' +
            '<h3 class="item-title">' + escapeHTML(step.name) + '</h3>' +
            desc +
            (time ? '<div class="item-meta">' + time + '</div>' : '') +
          '</div>' +
          '<div class="item-side">' +
            '<span class="item-price">' + (step.done ? '+' : '') + formatMoney(step.amount) + ' ₽</span>' +
            '<div class="item-actions">' +
              '<button class="icon-btn" type="button" data-action="edit-step" data-id="' + escapeHTML(step.id) + '" aria-label="Редактировать шаг «' + escapeHTML(step.name) + '»" title="Редактировать">' + icon('pencil') + '</button>' +
              '<button class="icon-btn" type="button" data-action="delete-step" data-id="' + escapeHTML(step.id) + '" aria-label="Удалить шаг «' + escapeHTML(step.name) + '»" title="Удалить">' + icon('trash') + '</button>' +
            '</div>' +
          '</div>' +
        '</article>';
    }).join('');
  }

  function renderBlockState() {
    ['a', 'b', 'c'].forEach((key) => {
      const card = $('.card-' + key);
      const railBtn = $('[data-open-block="' + key + '"]');
      const collapseBtn = $('[data-collapse="' + key + '"]');
      if (!card) return;
      card.classList.toggle('is-collapsed', state.ui.collapsed[key]);
      card.classList.toggle('is-closed', state.ui.closed[key]);
      if (collapseBtn) {
        collapseBtn.setAttribute('aria-expanded', String(!state.ui.collapsed[key]));
        collapseBtn.setAttribute('aria-label', state.ui.collapsed[key] ? 'Развернуть блок ' + BLOCK_NAMES[key] : 'Свернуть блок ' + BLOCK_NAMES[key]);
        collapseBtn.title = state.ui.collapsed[key] ? 'Развернуть' : 'Свернуть';
      }
      if (railBtn) railBtn.setAttribute('aria-pressed', String(!state.ui.closed[key]));
    });
  }

  function applyTheme(themeId) {
    const theme = THEMES.some((item) => item.id === themeId) ? themeId : DEFAULT_THEME;
    document.documentElement.classList.add('theme-switching');
    window.clearTimeout(applyTheme._timer);
    applyTheme._timer = window.setTimeout(() => {
      document.documentElement.classList.remove('theme-switching');
    }, 360);
    els.body.dataset.theme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      const map = {
        paper: '#f4eee2', peach: '#f4dfd1', sage: '#e4ecdc', mist: '#e0eae9',
        indigo: '#d5e6ed', pine: '#cad8ce', night: '#3e3f3f'
      };
      meta.setAttribute('content', map[theme] || '#f4eee2');
    }
  }

  function backgroundAssets(visual) {
    if (visual.background === 'custom' && visual.customBackground) {
      return {
        key: 'custom:' + visual.customBackground.length + ':' + visual.customBackground.slice(-48),
        scene: 'custom',
        base: visual.customBackground,
        motion: null
      };
    }
    const found = BACKGROUNDS.find((item) => item.id === visual.background) || BACKGROUNDS[0];
    return { key: found.id, scene: found.id, base: found.base, motion: found.motion };
  }

  function prepareLayer(layer, assets, done) {
    if (!layer) return;
    layer.dataset.scene = assets.scene;
    const base = $('.scene-base', layer);
    const motion = $('.scene-motion', layer);
    let finished = false;
    let baseReady = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      if (base) base.removeEventListener('load', onBase);
      done();
    };
    const onBase = () => {
      baseReady = true;
      finish();
    };

    if (base) {
      base.onload = onBase;
      base.onerror = onBase;
      base.src = assets.base;
      if (base.complete && base.naturalWidth > 0) baseReady = true;
    }

    if (motion) {
      motion.classList.remove('is-ready');
      if (assets.motion) {
        motion.hidden = false;
        motion.onload = () => motion.classList.add('is-ready');
        motion.onerror = () => motion.classList.remove('is-ready');
        motion.src = assets.motion;
        if (motion.complete && motion.naturalWidth > 0) {
          window.setTimeout(() => motion.classList.add('is-ready'), 80);
        }
      } else {
        motion.hidden = true;
        motion.removeAttribute('src');
      }
    }

    if (baseReady) finish();
    window.setTimeout(finish, 900);
  }

  function applyBackground(visual, immediate) {
    const assets = backgroundAssets(visual);
    if (!assets.base) return;
    const active = $('.wallpaper-layer.is-active');
    if (assets.key === currentBgSrc) {
      if (immediate && active) active.dataset.scene = assets.scene;
      return;
    }
    if (immediate || !currentBgSrc) {
      const first = $('[data-bg-layer="a"]');
      prepareLayer(first, assets, () => {
        first.classList.add('is-active');
        $('[data-bg-layer="b"]').classList.remove('is-active');
        bgActive = 0;
        currentBgSrc = assets.key;
      });
      currentBgSrc = assets.key;
      return;
    }

    const nextIndex = bgActive === 0 ? 1 : 0;
    const nextLayer = $('[data-bg-layer="' + (nextIndex === 0 ? 'a' : 'b') + '"]');
    const currentLayer = $('[data-bg-layer="' + (bgActive === 0 ? 'a' : 'b') + '"]');
    prepareLayer(nextLayer, assets, () => {
      nextLayer.classList.add('is-active');
      currentLayer.classList.remove('is-active');
      bgActive = nextIndex;
      currentBgSrc = assets.key;
    });
    currentBgSrc = assets.key;
  }

  function applyVisual() {
    applyTheme(state.visual.theme);
    applyBackground(state.visual, false);
    applyZoom(state.zoom);
  }

  function renderZoom() {
    const value = Math.round(state.zoom * 100) + '%';
    if (els.zoomValue) els.zoomValue.textContent = value;
    if (els.settingsZoomValue) els.settingsZoomValue.textContent = Math.round((draft ? draft.zoom : state.zoom) * 100) + '%';
  }

  function applyZoom(scale) {
    const safe = ZOOMS.indexOf(scale) >= 0 ? scale : 1;
    document.documentElement.style.setProperty('--text-scale', String(safe));
    window.requestAnimationFrame(sizeHaveInput);
    els.zoomValue.textContent = Math.round(safe * 100) + '%';
    els.settingsZoomValue.textContent = Math.round((draft ? draft.zoom : safe) * 100) + '%';
  }

  function stepZoom(delta, target) {
    if (target === 'draft') {
      if (!draft) return;
      const index = ZOOMS.indexOf(draft.zoom);
      const next = Math.min(ZOOMS.length - 1, Math.max(0, index + delta));
      draft.zoom = ZOOMS[next];
      els.settingsZoomValue.textContent = Math.round(draft.zoom * 100) + '%';
      return;
    }
    const index = ZOOMS.indexOf(state.zoom);
    const next = Math.min(ZOOMS.length - 1, Math.max(0, index + delta));
    state.zoom = ZOOMS[next];
    applyZoom(state.zoom);
    persist();
  }

  /* ---------------- Блок А ---------------- */

  function onHaveInput() {
    const checked = checkedTotal();
    let digits = onlyDigits(els.haveInput.value);
    if (els.haveInput.value !== digits) els.haveInput.value = digits;
    if (digits.length > 6) digits = digits.slice(0, 6);
    let value = digits ? parseInt(digits, 10) : 0;
    if (checked > 0 && value < checked) {
      value = Math.min(checked, MAX_MONEY);
      digits = String(value);
      els.haveInput.value = digits;
    }
    if (value > MAX_MONEY) {
      value = MAX_MONEY;
      els.haveInput.value = String(value);
    }
    state.manualAmount = Math.max(0, value - checked);
    renderTotals();
    sizeHaveInput();
    persist();
  }

  /* ---------------- Желания ---------------- */

  function openWishDialog(wish) {
    const editing = Boolean(wish);
    $('#wishDialogTitle').textContent = 'Я хочу:';
    $('#wishId').value = editing ? wish.id : '';
    $('#wishName').value = editing ? wish.name : '';
    $('#wishDesc').value = editing ? wish.description : '';
    $('#wishPrice').value = editing ? String(wish.price) : '';
    clearFieldError('wishName');
    clearFieldError('wishDesc');
    clearFieldError('wishPrice');
    updateCount('wishName', 54);
    updateCount('wishDesc', 3000);
    if (els.wishDialog.open) els.wishDialog.close();
    els.wishDialog.showModal();
    window.setTimeout(() => $('#wishName').focus(), 50);
  }

  function validateWish() {
    const name = $('#wishName').value.trim();
    const price = onlyDigits($('#wishPrice').value);
    let valid = true;
    if (!name) {
      setFieldError('wishName', 'Введите название желания');
      valid = false;
    } else if (name.length > 54) {
      setFieldError('wishName', 'Не больше 54 символов');
      valid = false;
    } else {
      clearFieldError('wishName');
    }
    if (!price || Number(price) <= 0) {
      setFieldError('wishPrice', 'Введите сумму больше нуля');
      valid = false;
    } else {
      clearFieldError('wishPrice');
    }
    return valid ? { name, price: clampMoney(price), description: $('#wishDesc').value.trim().slice(0, 3000) } : null;
  }

  function saveWish(event) {
    event.preventDefault();
    const data = validateWish();
    if (!data) return;
    const id = $('#wishId').value;
    if (id) {
      const wish = findWish(id);
      if (wish) {
        wish.name = data.name;
        wish.description = data.description;
        wish.price = data.price;
        showToast('Желание обновлено');
      }
    } else {
      state.wishes.unshift({
        id: uid(),
        name: data.name,
        description: data.description,
        price: data.price,
        createdAt: new Date().toISOString()
      });
      showToast('Желание добавлено');
    }
    persist();
    renderAll();
    els.wishDialog.close();
  }

  async function deleteWish(id) {
    const wish = findWish(id);
    if (!wish) return;
    const ok = await askConfirm({
      title: 'Удалить желание?',
      text: '«' + wish.name + '» исчезнет из списка, а ' + formatMoney(wish.price) + ' ₽ вычтутся из «Сколько нужно».',
      confirmLabel: 'Да',
      cancelLabel: 'Нет'
    });
    if (!ok) return;
    state.wishes = state.wishes.filter((item) => item.id !== id);
    persist();
    renderAll();
    showToast('Желание удалено');
  }

  /* ---------------- Шаги ---------------- */

  function openStepDialog(step) {
    const editing = Boolean(step);
    $('#stepDialogTitle').textContent = 'Нужно:';
    $('#stepId').value = editing ? step.id : '';
    $('#stepName').value = editing ? step.name : '';
    $('#stepDesc').value = editing ? step.description : '';
    $('#stepAmount').value = editing ? String(step.amount) : '';
    $('#stepTime').value = editing ? step.time : '';
    clearFieldError('stepName');
    clearFieldError('stepDesc');
    clearFieldError('stepAmount');
    updateCount('stepName', 54);
    updateCount('stepDesc', 3000);
    updateCount('stepTime', 40);
    if (els.stepDialog.open) els.stepDialog.close();
    els.stepDialog.showModal();
    window.setTimeout(() => $('#stepName').focus(), 50);
  }

  function validateStep() {
    const name = $('#stepName').value.trim();
    const amount = onlyDigits($('#stepAmount').value);
    let valid = true;
    if (!name) {
      setFieldError('stepName', 'Введите, как заработать');
      valid = false;
    } else if (name.length > 54) {
      setFieldError('stepName', 'Не больше 54 символов');
      valid = false;
    } else {
      clearFieldError('stepName');
    }
    if (!amount || Number(amount) <= 0) {
      setFieldError('stepAmount', 'Введите сумму больше нуля');
      valid = false;
    } else {
      clearFieldError('stepAmount');
    }
    return valid ? {
      name,
      description: $('#stepDesc').value.trim().slice(0, 3000),
      amount: clampMoney(amount),
      time: $('#stepTime').value.trim().slice(0, 40)
    } : null;
  }

  function saveStep(event) {
    event.preventDefault();
    const data = validateStep();
    if (!data) return;
    const id = $('#stepId').value;
    if (id) {
      const step = findStep(id);
      if (step) {
        step.name = data.name;
        step.description = data.description;
        step.amount = data.amount;
        step.time = data.time;
        showToast('Шаг обновлён');
      }
    } else {
      state.steps.push({
        id: uid(),
        name: data.name,
        description: data.description,
        amount: data.amount,
        time: data.time,
        done: false,
        createdAt: new Date().toISOString()
      });
      showToast('Шаг добавлен');
    }
    persist();
    renderAll();
    els.stepDialog.close();
  }

  function toggleStep(id) {
    const step = findStep(id);
    if (!step) return;
    step.done = !step.done;
    persist();
    renderSteps();
    renderTotals();
    const node = $('.step-item[data-id="' + cssEscape(id) + '"]', els.stepList);
    if (node && step.done) {
      node.classList.add('is-just-done');
      window.setTimeout(() => node.classList.remove('is-just-done'), 500);
    }
    showToast(step.done
      ? 'Шаг выполнен: +' + formatMoney(step.amount) + ' ₽ в «Есть сейчас»'
      : 'Отметка снята: −' + formatMoney(step.amount) + ' ₽ из «Есть сейчас»');
  }

  async function deleteStep(id) {
    const step = findStep(id);
    if (!step) return;
    const ok = await askConfirm({
      title: 'Удалить шаг?',
      text: step.done
        ? '«' + step.name + '» исчезнет из списка, а ' + formatMoney(step.amount) + ' ₽ больше не будут учитываться в «Есть сейчас».'
        : '«' + step.name + '» исчезнет из плана. Суммы в блоке А не изменятся.',
      confirmLabel: 'Да',
      cancelLabel: 'Нет'
    });
    if (!ok) return;
    state.steps = state.steps.filter((item) => item.id !== id);
    persist();
    renderAll();
    showToast('Шаг удалён');
  }

  function cssEscape(value) {
    if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(value);
    return String(value).replace(/["\\]/g, '\\$&');
  }

  /* ---------------- Ошибки полей ---------------- */

  function setFieldError(id, message) {
    const input = $('#' + id);
    const wrap = input ? input.closest('.field') : null;
    if (wrap) wrap.classList.add('has-error');
    const error = $('#' + id + 'Error');
    if (error) error.textContent = message;
    if (input) input.setAttribute('aria-invalid', 'true');
  }

  function clearFieldError(id) {
    const input = $('#' + id);
    const wrap = input ? input.closest('.field') : null;
    if (wrap) wrap.classList.remove('has-error');
    const error = $('#' + id + 'Error');
    if (error) error.textContent = '';
    if (input) input.removeAttribute('aria-invalid');
  }

  function updateCount(id, max) {
    const input = $('#' + id);
    const counter = $('#' + id + 'Count');
    if (counter && input) counter.textContent = input.value.length + ' / ' + max;
  }

  /* ---------------- Подтверждения ---------------- */

  function askConfirm(options) {
    return new Promise((resolve) => {
      if (confirmResolver) {
        const old = confirmResolver;
        confirmResolver = null;
        old(false);
      }
      $('#confirmTitle').textContent = options.title || 'Подтвердить действие?';
      $('#confirmText').textContent = options.text || '';
      $('#confirmYes').textContent = options.confirmLabel || 'Да';
      $('#confirmNo').textContent = options.cancelLabel || 'Нет';
      confirmResolver = resolve;
      if (els.confirmDialog.open) els.confirmDialog.close();
      els.confirmDialog.showModal();
    });
  }

  function settleConfirm(value) {
    if (!confirmResolver) return;
    const resolver = confirmResolver;
    confirmResolver = null;
    if (els.confirmDialog.open) els.confirmDialog.close();
    resolver(value);
  }

  /* ---------------- Настройки ---------------- */

  function openSettings() {
    draft = {
      theme: state.visual.theme,
      background: state.visual.background,
      customBackground: state.visual.customBackground,
      zoom: state.zoom
    };
    renderThemeGrid();
    renderBgGrid();
    els.settingsZoomValue.textContent = Math.round(draft.zoom * 100) + '%';
    switchSettingsTab('visual');
    updateArchiveStats();
    if (els.settingsDialog.open) els.settingsDialog.close();
    els.settingsDialog.showModal();
  }

  function closeSettings() {
    if (els.settingsDialog.open) els.settingsDialog.close();
  }

  function switchSettingsTab(tab) {
    $$('.settings-tab').forEach((button) => {
      const active = button.dataset.tab === tab;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
    });
    $$('.settings-panel').forEach((panel) => {
      panel.hidden = panel.dataset.panel !== tab;
    });
    const visual = tab === 'visual';
    els.visualResetBtn.hidden = !visual;
    els.applyVisualBtn.hidden = !visual;
    if (tab === 'archive') updateArchiveStats();
  }

  function renderThemeGrid() {
    els.themeGrid.innerHTML = THEMES.map((theme) => {
      const selected = draft && draft.theme === theme.id;
      return '' +
        '<button class="theme-card' + (selected ? ' is-selected' : '') + '" type="button" data-theme-id="' + theme.id + '" aria-pressed="' + selected + '" title="' + theme.name + '">' +
          '<span class="theme-swatch" style="--sw-bg:' + theme.fill + ';--sw-border:' + theme.border + ';--sw-text:' + theme.text + '">Т</span>' +
          '<span class="theme-name">' + theme.name + '</span>' +
        '</button>';
    }).join('');
  }

  function renderBgGrid() {
    const selectedId = draft ? draft.background : state.visual.background;
    const custom = draft ? draft.customBackground : state.visual.customBackground;
    const cards = BACKGROUNDS.map((bg) => {
      const selected = selectedId === bg.id;
      return '' +
        '<button class="bg-card' + (selected ? ' is-selected' : '') + '" type="button" data-bg-id="' + bg.id + '" aria-pressed="' + selected + '" title="' + bg.name + '">' +
          '<img src="' + bg.thumb + '" alt="" loading="lazy" draggable="false">' +
          '<span class="bg-card-label">' + bg.name + '</span>' +
        '</button>';
    });
    const customSelected = selectedId === 'custom';
    cards.push('' +
      '<button class="bg-card bg-upload' + (custom ? ' has-image' : '') + (customSelected ? ' is-selected' : '') + '" type="button" id="customBgCard" aria-pressed="' + customSelected + '" title="Загрузить свой фон">' +
        (custom ? '<img src="' + escapeHTML(custom) + '" alt="" draggable="false">' : '') +
        icon('plus') +
        '<span class="upload-label">Свой фон</span>' +
      '</button>');
    els.bgGrid.innerHTML = cards.join('');
  }

  function applySettings() {
    if (!draft) return;
    if (draft.background === 'custom' && !draft.customBackground) {
      showToast('Сначала выберите картинку для фона');
      return;
    }
    const previous = {
      visual: { ...state.visual },
      zoom: state.zoom
    };
    state.visual = {
      theme: draft.theme,
      background: draft.background,
      customBackground: draft.customBackground
    };
    state.zoom = draft.zoom;
    applyTheme(state.visual.theme);
    applyZoom(state.zoom);
    applyBackground(state.visual, false);
    if (!persist()) {
      state.visual = previous.visual;
      state.zoom = previous.zoom;
      applyVisual();
      return;
    }
    closeSettings();
    showToast('Визуал обновлён и сохранён');
  }

  function resetVisualSettings() {
    const previous = {
      visual: { ...state.visual },
      zoom: state.zoom
    };
    state.visual = { theme: DEFAULT_THEME, background: DEFAULT_BG, customBackground: null };
    state.zoom = 1;
    applyVisual();
    if (!persist()) {
      state.visual = previous.visual;
      state.zoom = previous.zoom;
      applyVisual();
      return;
    }
    draft = {
      theme: DEFAULT_THEME,
      background: DEFAULT_BG,
      customBackground: null,
      zoom: 1
    };
    renderThemeGrid();
    renderBgGrid();
    els.settingsZoomValue.textContent = '100%';
    showToast('Тема, фон и масштаб сброшены');
  }

  async function handleCustomBackground(file) {
    if (!file) return;
    if (!/^image\//.test(file.type)) {
      showToast('Выберите файл изображения');
      return;
    }
    if (file.size > 18 * 1024 * 1024) {
      showToast('Файл больше 18 МБ — выберите картинку поменьше');
      return;
    }
    try {
      const dataUrl = await resizeImage(file);
      if (dataUrl.length > 3800000) {
        showToast('Не удалось достаточно сжать картинку. Попробуйте другую.');
        return;
      }
      draft.customBackground = dataUrl;
      draft.background = 'custom';
      renderBgGrid();
      showToast('Свой фон выбран. Нажмите «Применить»');
    } catch (error) {
      showToast('Не удалось прочитать картинку');
    } finally {
      els.customBgInput.value = '';
    }
  }

  function resizeImage(file) {
    return new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        try {
          const maxSide = 1920;
          let width = image.naturalWidth || 1600;
          let height = image.naturalHeight || 1000;
          const scale = Math.min(1, maxSide / Math.max(width, height));
          width = Math.max(1, Math.round(width * scale));
          height = Math.max(1, Math.round(height * scale));
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#f4eee2';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(image, 0, 0, width, height);
          let quality = 0.86;
          let dataUrl = canvas.toDataURL('image/jpeg', quality);
          while (dataUrl.length > 3200000 && quality > 0.45) {
            quality -= 0.12;
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
          URL.revokeObjectURL(objectUrl);
          resolve(dataUrl);
        } catch (error) {
          URL.revokeObjectURL(objectUrl);
          reject(error);
        }
      };
      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('image'));
      };
      image.src = objectUrl;
    });
  }

  function updateArchiveStats() {
    if (!els.archiveWishes) return;
    els.archiveWishes.textContent = String(state.wishes.length);
    els.archiveSteps.textContent = String(state.steps.length);
    els.archiveSaved.textContent = state.updatedAt ? dateFmt.format(new Date(state.updatedAt)) : 'ещё не сохранялось';
    els.archiveMode.textContent = IS_TEST ? 'Тестовое' : 'Основное';
  }

  function exportData() {
    const payload = {
      app: 'must-have',
      version: 1,
      exportedAt: new Date().toISOString(),
      data: state
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = 'must-have-' + (IS_TEST ? 'test-' : '') + date + '.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1200);
    showToast('Архив сохранён в файл');
  }

  async function importData(file) {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const data = parsed && parsed.data ? parsed.data : parsed;
      if (!data || typeof data !== 'object' || !Array.isArray(data.wishes) || !Array.isArray(data.steps)) {
        throw new Error('shape');
      }
      const next = normalizeState(data);
      const ok = await askConfirm({
        title: 'Импортировать данные?',
        text: 'Текущие желания, шаги и суммы будут заменены содержимым архива.',
        confirmLabel: 'Да, импортировать',
        cancelLabel: 'Нет'
      });
      if (!ok) return;
      state = next;
      applyVisual();
      renderAll();
      persist();
      updateArchiveStats();
      showToast('Данные импортированы');
    } catch (error) {
      showToast('Это не похоже на архив Must Have');
    } finally {
      const input = $('#importInput');
      if (input) input.value = '';
    }
  }

  async function resetAllData() {
    const ok = await askConfirm({
      title: 'Сбросить все данные?',
      text: 'Желания, шаги и введённые суммы будут удалены. Экспортированный архив останется у вас в файле.',
      confirmLabel: 'Да, сбросить',
      cancelLabel: 'Нет'
    });
    if (!ok) return;
    const visual = { ...state.visual };
    const zoom = state.zoom;
    state = createDefaultState();
    state.visual = visual;
    state.zoom = zoom;
    applyVisual();
    renderAll();
    persist();
    updateArchiveStats();
    showToast('Данные сброшены');
  }

  /* ---------------- Режим тестировщика ---------------- */

  function openPinDialog() {
    els.pinInput.value = '';
    els.pinError.textContent = '';
    els.pinInput.closest('.field').classList.remove('has-error');
    els.pinInput.removeAttribute('aria-invalid');
    if (els.pinDialog.open) els.pinDialog.close();
    els.pinDialog.showModal();
    window.setTimeout(() => els.pinInput.focus(), 50);
  }

  function submitPin(event) {
    event.preventDefault();
    if (els.pinInput.value !== TEST_PASSWORD) {
      els.pinError.textContent = 'Неверный пароль. Попробуйте ещё раз.';
      els.pinInput.closest('.field').classList.add('has-error');
      els.pinInput.setAttribute('aria-invalid', 'true');
      els.pinInput.select();
      return;
    }
    els.pinError.textContent = '';
    els.pinInput.closest('.field').classList.remove('has-error');
    els.pinInput.removeAttribute('aria-invalid');
    const url = new URL(window.location.href);
    url.search = '';
    url.searchParams.set('mode', 'test');
    url.searchParams.set('run', Date.now().toString(36) + Math.random().toString(36).slice(2, 6));
    const left = Math.max(0, Math.round((window.screen.width - 1320) / 2));
    const top = Math.max(0, Math.round((window.screen.height - 900) / 2));
    const popup = window.open(url.toString(), 'must_have_test_' + Date.now(), 'popup=yes,width=1320,height=900,left=' + left + ',top=' + top);
    if (!popup) {
      els.pinError.textContent = 'Браузер заблокировал окно. Разрешите всплывающие окна.';
      els.pinInput.closest('.field').classList.add('has-error');
      return;
    }
    els.pinDialog.close();
    showToast('Тестовое окно открыто. Данные основного окна не затронуты.');
  }

  async function resetTestWindow() {
    const ok = await askConfirm({
      title: 'Сбросить настройки теста?',
      text: 'Все данные этого тестового окна вернутся к базовым. Основное окно не изменится.',
      confirmLabel: 'Да, сбросить',
      cancelLabel: 'Нет'
    });
    if (!ok) return;
    state = createDefaultState();
    applyVisual();
    renderAll();
    persist();
    updateArchiveStats();
    showToast('Тестовые данные сброшены');
  }

  function closeTestWindow() {
    window.close();
    window.setTimeout(() => {
      if (!window.closed) showToast('Браузер не разрешил закрыть окно. Закройте вкладку вручную.');
    }, 220);
  }

  /* ---------------- Обработчики ---------------- */

  function bindEvents() {
    els.haveInput.addEventListener('input', onHaveInput);
    els.haveInput.addEventListener('focus', () => {
      els.haveInput.value = onlyDigits(els.haveInput.value);
      els.haveInput.select();
      sizeHaveInput();
    });
    els.haveInput.addEventListener('blur', renderTotals);

    els.addWishBtn.addEventListener('click', () => openWishDialog(null));
    els.addStepBtn.addEventListener('click', () => openStepDialog(null));
    els.wishForm.addEventListener('submit', saveWish);
    els.stepForm.addEventListener('submit', saveStep);

    els.wishList.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-action]');
      if (!button) return;
      const id = button.dataset.id;
      if (button.dataset.action === 'edit-wish') {
        const wish = findWish(id);
        if (wish) openWishDialog(wish);
      } else if (button.dataset.action === 'delete-wish') {
        deleteWish(id);
      }
    });

    els.stepList.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-action]');
      if (!button) return;
      const id = button.dataset.id;
      if (button.dataset.action === 'toggle-step') {
        toggleStep(id);
      } else if (button.dataset.action === 'edit-step') {
        const step = findStep(id);
        if (step) openStepDialog(step);
      } else if (button.dataset.action === 'delete-step') {
        deleteStep(id);
      }
    });

    $$('[data-collapse]').forEach((button) => {
      button.addEventListener('click', () => {
        const key = button.dataset.collapse;
        state.ui.collapsed[key] = !state.ui.collapsed[key];
        persist();
        renderBlockState();
        const card = $('.card-' + key);
        if (card) {
          card.classList.add('is-bouncing');
          window.setTimeout(() => card.classList.remove('is-bouncing'), 260);
        }
      });
    });

    $$('[data-close]').forEach((button) => {
      button.addEventListener('click', () => {
        const key = button.dataset.close;
        state.ui.closed[key] = true;
        persist();
        renderBlockState();
        const rail = $('[data-open-block="' + key + '"]');
        if (rail) rail.focus();
        showToast('Блок ' + BLOCK_NAMES[key] + ' закрыт. Вернуть — на панели слева.');
      });
    });

    $$('[data-open-block]').forEach((button) => {
      button.addEventListener('click', () => {
        const key = button.dataset.openBlock;
        const wasClosed = state.ui.closed[key];
        state.ui.closed[key] = false;
        state.ui.collapsed[key] = false;
        if (wasClosed) persist();
        renderBlockState();
        const card = $('.card-' + key);
        if (card) {
          card.setAttribute('tabindex', '-1');
          card.focus({ preventScroll: true });
          card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      });
    });

    $('#zoomIn').addEventListener('click', () => stepZoom(1));
    $('#zoomOut').addEventListener('click', () => stepZoom(-1));
    $('#settingsZoomIn').addEventListener('click', () => stepZoom(1, 'draft'));
    $('#settingsZoomOut').addEventListener('click', () => stepZoom(-1, 'draft'));

    $('#settingsBtn').addEventListener('click', openSettings);
    $('#testBtn').addEventListener('click', openPinDialog);
    els.pinForm.addEventListener('submit', submitPin);

    $$('[data-close-dialog]').forEach((button) => {
      button.addEventListener('click', () => {
        const dialog = button.closest('dialog');
        if (dialog) dialog.close();
      });
    });

    $$('[data-close-settings]').forEach((button) => {
      button.addEventListener('click', closeSettings);
    });

    els.confirmYes.addEventListener('click', () => settleConfirm(true));
    els.confirmNo.addEventListener('click', () => settleConfirm(false));
    els.confirmDialog.addEventListener('close', () => settleConfirm(false));

    $$('.settings-tab').forEach((button) => {
      button.addEventListener('click', () => switchSettingsTab(button.dataset.tab));
    });

    els.themeGrid.addEventListener('click', (event) => {
      const button = event.target.closest('[data-theme-id]');
      if (!button || !draft) return;
      draft.theme = button.dataset.themeId;
      renderThemeGrid();
    });

    els.bgGrid.addEventListener('click', (event) => {
      const upload = event.target.closest('#customBgCard');
      if (upload) {
        els.customBgInput.click();
        return;
      }
      const button = event.target.closest('[data-bg-id]');
      if (!button || !draft) return;
      draft.background = button.dataset.bgId;
      renderBgGrid();
    });

    els.customBgInput.addEventListener('change', () => {
      handleCustomBackground(els.customBgInput.files && els.customBgInput.files[0]);
    });

    els.applyVisualBtn.addEventListener('click', applySettings);
    els.visualResetBtn.addEventListener('click', resetVisualSettings);

    $('#exportBtn').addEventListener('click', exportData);
    $('#importBtn').addEventListener('click', () => $('#importInput').click());
    $('#importInput').addEventListener('change', () => {
      importData($('#importInput').files && $('#importInput').files[0]);
    });
    $('#resetAllBtn').addEventListener('click', resetAllData);

    // Backdrop click closes a dialog; Esc is handled by the browser.
    $$('dialog').forEach((dialog) => {
      dialog.addEventListener('click', (event) => {
        if (event.target === dialog) dialog.close();
      });
    });

    ['wishName', 'wishDesc', 'wishPrice', 'stepName', 'stepDesc', 'stepAmount', 'stepTime'].forEach((id) => {
      const input = $('#' + id);
      if (!input) return;
      const max = id === 'wishDesc' || id === 'stepDesc' ? 3000 : id === 'stepTime' ? 40 : id === 'wishName' || id === 'stepName' ? 54 : 6;
      input.addEventListener('input', () => {
        if (input.value.length > max) input.value = input.value.slice(0, max);
        if (input.maxLength === 6) {
          const digits = onlyDigits(input.value);
          if (input.value !== digits) input.value = digits;
        }
        if ($('#' + id + 'Count')) updateCount(id, max);
        if (input.closest('.field').classList.contains('has-error')) clearFieldError(id);
      });
    });

    els.pinInput.addEventListener('input', () => {
      els.pinInput.value = els.pinInput.value.replace(/\D/g, '').slice(0, 4);
      els.pinError.textContent = '';
    });

    if (IS_TEST) {
      els.testBanner.hidden = false;
      els.testResetBtn.addEventListener('click', resetTestWindow);
      els.testCloseBtn.addEventListener('click', closeTestWindow);
    }

    // Avoid losing the last input when the window is closed.
    window.addEventListener('resize', () => window.requestAnimationFrame(sizeHaveInput));
    window.addEventListener('pagehide', () => persist({ silent: true }));
  }

  function init() {
    applyTheme(state.visual.theme);
    applyZoom(state.zoom);
    applyBackground(state.visual, true);
    renderAll();
    bindEvents();
    if (IS_TEST) {
      document.title = 'Must have Test';
      els.testBanner.hidden = false;
      document.body.classList.add('is-test');
    } else {
      document.title = 'Must Have';
    }
    if (IS_SELFTEST) {
      document.title = 'Must Have Test Runner';
      window.__mustHaveTest = {
        getState: () => JSON.parse(JSON.stringify(state)),
        getTotals: () => ({ have: haveTotal(), need: needTotal(), checked: checkedTotal() }),
        reset: () => {
          state = createDefaultState();
          applyVisual();
          renderAll();
          persist({ silent: true });
          updateArchiveStats();
        },
        seedDemo: () => {
          state = createDefaultState();
          state.manualAmount = 24000;
          state.wishes = [
            { id: uid(), name: 'Ноутбук для работы', description: 'Чтобы брать заказы в любом месте и не зависеть от старого компьютера.', price: 78000, createdAt: new Date().toISOString() },
            { id: uid(), name: 'Подушка для спины', description: 'Маленькое, но важное.', price: 4200, createdAt: new Date().toISOString() }
          ];
          state.steps = [
            { id: uid(), name: 'Сдать лендинг', description: 'Первый платёж от постоянного клиента.', amount: 18000, time: '2 дня', done: true, createdAt: new Date().toISOString() },
            { id: uid(), name: 'Собрать портфолио', description: 'Три кейса и короткое описание.', amount: 12000, time: 'до пятницы', done: false, createdAt: new Date().toISOString() },
            { id: uid(), name: 'Написать трём клиентам', description: 'Тёплые контакты из старого списка.', amount: 9000, time: '1 час', done: false, createdAt: new Date().toISOString() }
          ];
          state.visual.background = 'bamboo';
          applyVisual();
          renderAll();
          persist({ silent: true });
          updateArchiveStats();
        },
        storageKey: STORAGE_KEY
      };
      const script = document.createElement('script');
      script.src = 'js/selftest.js';
      script.defer = true;
      document.body.appendChild(script);
    }
    if ('serviceWorker' in navigator && /^https?:$/.test(window.location.protocol) && !IS_SELFTEST) {
      navigator.serviceWorker.register('sw.js').catch(() => { /* offline shell is optional */ });
    }
  }

  init();
})();
