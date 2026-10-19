/**
 * 共享场景壳（T03）：一套页面壳 + 一套主题状态 + 一套模式导航。
 *
 * 关系与边界（design.md §4、frontend-baseline §2/§3）：
 * - H01 / V02 / A01 / E01 / G00 五个既有场景共用这一个壳：
 *   同一份顶栏、导航、演示主题控件、设置面板与入口反馈；场景只向 `body` 注入内容。
 * - 主题只有一份状态（`data-dir`）且只落在 `tokens.css` 的变量上；切换主题不重建
 *   业务 DOM，因此场景里已选的集数、已输入的话、正在讲的一节都不会被重置。
 * - 个人 / 公共是两个显式模式：公共模式不读取个人主题偏好、不显示个人姓名、设置入口
 *   与「我的」等私人入口，普通访客无法从公共壳进入个人空间。
 * - 不携带原型调试球、不做整页 `scale()`，也不为 A/B 各写一份 DOM。
 */
import { createNode, createRouteButton } from './kit.js';
import { createPublicSessionEnd } from './public-session-end.js';

/** @typedef {import('../data/preferences.js').ThemePreferences} ThemePreferences */

/** @type {Array<'a' | 'b'>} */
export const THEMES = ['a', 'b'];

/** 主题名称与气质说明，只沿用 OpenDesign 既有的 A/B，不新造第三套。 */
/** @type {Record<'a' | 'b', { name: string, desc: string }>} */
export const THEME_META = {
  a: { name: '日光客厅', desc: '明亮、有呼吸感的客厅杂志式' },
  b: { name: '暖夜剧场', desc: '深色暖金的沉浸式剧场' },
};

/** 设置面板里的偏好保存反馈：区分「已保存 / 保存失败 / 无存储 / 尚无偏好」。 */
export const PREFERENCE_MESSAGES = {
  saved: '已保存你的选择，刷新后仍会使用。',
  saveFailed: '本机无法保存偏好：本次选择只在当前页面有效，刷新后会恢复。',
  noStorage: '本机不能保存外观偏好：选择会立即生效，但刷新后会恢复默认。',
  noPreference: '还没有保存过外观偏好：选一个就记住，下次打开还在。',
};

/** 未注入偏好时的空实现（测试 / 纯渲染预览用）：不读取也不写入任何存储。 */
/** @type {ThemePreferences} */
export const NO_PREFERENCES = { available: false, read: () => null, save: () => false };

/**
 * @typedef {object} ShellBrand
 * @property {string} logo
 * @property {string} sub
 *
 * @typedef {object} ShellViewer
 * @property {string} dateLabel
 * @property {string} greeting
 * @property {string} name
 * @property {string} avatarText
 *
 * @typedef {object} ShellNavItem
 * @property {string} id
 * @property {string} label
 * @property {string} route
 *
 * @typedef {object} ShellPersonal
 * @property {ShellBrand} brand
 * @property {ShellViewer} viewer
 * @property {ShellNavItem[]} nav
 * @property {{ name: string, status: string, line: string }} companion
 *
 * @typedef {object} ShellPublic
 * @property {ShellBrand} brand
 * @property {string} note
 * @property {string} dateLabel
 *
 * @typedef {object} ShellConfig
 * @property {string} [rootClass]
 * @property {'personal' | 'public'} [mode]
 * @property {string} [scene]
 * @property {'a' | 'b'} [theme]
 * @property {boolean} [canLeavePublicPreview] Only personal-device previews may exit to private.
 * @property {ThemePreferences} [preferences]
 * @property {(route: string) => string} describeRoute
 * @property {(route: string) => boolean} [isNavigable]
 * @property {(route: string) => void} [onNavigate]
 * @property {(reason: 'manual' | 'timeout') => void} [onEndPublicSession]
 * @property {ShellPersonal} personal
 * @property {ShellPublic} publicConfig
 *
 * @typedef {object} ShellController
 * @property {() => 'a' | 'b'} getTheme
 * @property {(dir: string) => 'a' | 'b'} setTheme
 * @property {() => string} getStatus
 * @property {(route: string) => string} activate
 *
 * @typedef {object} SceneShell
 * @property {HTMLElement} element
 * @property {HTMLElement} body 场景内容注入点（`jq-scroll`），不随主题切换重建
 * @property {ShellController} controller
 * @property {(dir: string, options?: { persist?: boolean }) => 'a' | 'b'} applyTheme
 * @property {(route: string) => string} activate
 * @property {() => void} openSettings
 * @property {() => void} closeSettings
 * @property {() => void} clearToast
 * @property {() => void} openPublicSessionEnd
 * @property {() => boolean} isPublicSessionEndOpen
 * @property {(route: string) => void} setScene
 * @property {(mode: 'personal' | 'public') => void} setMode
 * @property {() => 'personal' | 'public'} getMode
 */

/**
 * 构建共享场景壳。返回单棵 DOM 与可验证的控制器，不做全局副作用。
 * @param {Document} documentRef
 * @param {ShellConfig} config
 * @returns {SceneShell}
 */
export function createSceneShell(documentRef, config) {
  const preferences = config.preferences ?? NO_PREFERENCES;
  const describe = config.describeRoute;
  const onNavigate = config.onNavigate;
  const isNavigable = config.isNavigable ?? (() => false);
  const personal = config.personal;
  const publicConfig = config.publicConfig;

  /** @type {'personal' | 'public'} */
  let mode = config.mode ?? 'personal';
  let sceneRoute = config.scene ?? 'home';
  /** @type {'a' | 'b'} */
  let theme = config.theme ?? 'a';
  let status = '';

  const controller = {
    /** @returns {'a' | 'b'} */
    getTheme: () => theme,
    /**
     * @param {string} dir
     * @returns {'a' | 'b'}
     */
    setTheme: (dir) => {
      if (dir === 'a' || dir === 'b') theme = dir;
      return theme;
    },
    /** @returns {string} */
    getStatus: () => status,
    /**
     * @param {string} route
     * @returns {string}
     */
    activate: (route) => {
      status = describe(route);
      return status;
    },
  };

  // ---------- 顶栏（个人 / 公共两种模式，同一份构建代码） ----------
  const header = createNode(documentRef, 'header', 'jq-header');
  /** @type {Array<{ route: string, node: HTMLButtonElement }>} */
  let navButtons = [];
  /** @type {Array<{ dir: 'a' | 'b', node: HTMLButtonElement }>} */
  let themeButtons = [];
  /** @type {HTMLButtonElement | null} */
  let settingsEntry = null;

  /**
   * 演示主题控件（评审用的试点控件，不写存储；个人与公共都保留，供对照 A/B）。
   * @returns {HTMLElement}
   */
  function buildThemeGroup() {
    const group = createNode(documentRef, 'div', 'jq-theme');
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', '演示主题切换（试点控件，非正式设置）');
    group.append(createNode(documentRef, 'span', 'jq-theme__label', '演示主题'));
    for (const dir of THEMES) {
      const label = dir === 'a' ? 'A · 日光客厅' : 'B · 暖夜剧场';
      const node = /** @type {HTMLButtonElement} */ (
        createNode(documentRef, 'button', 'jq-theme__option', label)
      );
      node.setAttribute('type', 'button');
      node.setAttribute('data-dir-option', dir);
      node.addEventListener('click', () => applyTheme(dir));
      themeButtons.push({ dir, node });
      group.append(node);
    }
    return group;
  }

  /**
   * 正式用户入口：设置。它打开真实的设置面板（外观与主题），只出现在个人模式。
   * @returns {HTMLButtonElement}
   */
  function buildSettingsEntry() {
    const entry = /** @type {HTMLButtonElement} */ (
      createNode(documentRef, 'button', 'jq-settings-entry', '设置')
    );
    entry.setAttribute('type', 'button');
    entry.setAttribute('data-open-settings', '');
    entry.addEventListener('click', openSettings);
    return entry;
  }

  /** 依据当前模式重建顶栏；不触碰场景 body，因此导航/返回不丢业务内容。 */
  function renderHeader() {
    header.replaceChildren();
    navButtons = [];
    themeButtons = [];
    settingsEntry = null;
    header.className = mode === 'public' ? 'jq-header jq-header--public' : 'jq-header';

    const brand = createNode(documentRef, 'div', 'jq-brand');
    const headerEnd = createNode(documentRef, 'div', 'jq-header__end');

    if (mode === 'public') {
      // 公共终端：只保留公共标识、时间和演示主题；仅个人设备上的社区预览可返回。
      brand.append(
        createNode(documentRef, 'span', 'jq-brand__logo', publicConfig.brand.logo),
        createNode(documentRef, 'span', 'jq-brand__sub', publicConfig.brand.sub),
      );
      headerEnd.append(
        createNode(documentRef, 'span', 'jq-public-note', publicConfig.note),
        createNode(documentRef, 'span', 'jq-greeting', publicConfig.dateLabel),
        buildThemeGroup(),
        // 顶栏在共享壳的滚动区之外，公共设备滚到任何场景都能看到并结束体验。
        publicSessionEnd.entry,
      );
      if (config.canLeavePublicPreview) {
        // Real public terminals never expose a switch to personal space.
        headerEnd.append(
          createRouteButton(documentRef, 'jq-public-back', '‹ 退出社区预览', 'home', activate),
        );
      }
      header.append(brand, headerEnd);
    } else {
      brand.append(
        createNode(documentRef, 'span', 'jq-brand__logo', personal.brand.logo),
        createNode(documentRef, 'span', 'jq-brand__sub', personal.brand.sub),
      );

      const nav = createNode(documentRef, 'nav', 'jq-nav');
      nav.setAttribute('aria-label', '内容分区');
      for (const item of personal.nav) {
        const link = createRouteButton(
          documentRef,
          'jq-nav__item',
          item.label,
          item.route,
          activate,
        );
        navButtons.push({ route: item.route, node: link });
        nav.append(link);
      }

      settingsEntry = buildSettingsEntry();
      const user = createNode(documentRef, 'div', 'jq-user');
      const avatar = createNode(documentRef, 'span', 'jq-avatar', personal.viewer.avatarText);
      avatar.setAttribute('aria-hidden', 'true');
      user.append(avatar, createNode(documentRef, 'span', 'jq-user__name', personal.viewer.name));

      headerEnd.append(
        createNode(
          documentRef,
          'p',
          'jq-greeting',
          personal.viewer.dateLabel +
            ' · ' +
            personal.viewer.greeting +
            '，' +
            personal.viewer.name,
        ),
        buildThemeGroup(),
        createRouteButton(documentRef, 'jq-search', '搜一搜', 'search', activate),
        // 正式演示入口：从个人设备进入公共（社区）模式；公共模式不再提供任何个人入口。
        createRouteButton(documentRef, 'jq-public-entry', '社区版预览 ›', 'public', activate),
        settingsEntry,
        user,
      );
      header.append(brand, nav, headerEnd);
    }
    updateNavCurrent();
    updateThemeState();
  }

  /** 标记当前场景对应的导航项；AI / 公共等未列入导航的场景不误标。 */
  function updateNavCurrent() {
    for (const entry of navButtons) {
      if (entry.route === sceneRoute) entry.node.setAttribute('aria-current', 'page');
      else entry.node.removeAttribute('aria-current');
    }
  }

  // ---------- 场景内容注入点 ----------
  // 固定在滚动区之外、且在主题切换时不重建，保证「状态不随主题重置」。
  const scroll = createNode(documentRef, 'div', 'jq-scroll');

  // ---------- 入口反馈（视口内轻提示，挂在滚动区之外） ----------
  const toast = createNode(documentRef, 'div', 'jq-toast');
  toast.setAttribute('role', 'group');
  toast.setAttribute('aria-label', '入口反馈提示');
  toast.hidden = true;
  const toastText = createNode(documentRef, 'p', 'jq-toast__text');
  toastText.setAttribute('role', 'status');
  toastText.setAttribute('aria-live', 'polite');
  const toastClose = createNode(documentRef, 'button', 'jq-toast__close', '关闭');
  toastClose.setAttribute('type', 'button');
  toastClose.addEventListener('click', () => {
    toast.hidden = true;
  });
  toast.append(toastText, toastClose);

  // ---------- 常驻 AI 入口（仅个人模式；公共设备不出现在此） ----------
  const fab = createRouteButton(documentRef, 'jq-ai-fab', '问问小暖', 'ai', activate);
  const fabOrb = createNode(documentRef, 'span', 'jq-orb jq-orb--xs');
  fabOrb.setAttribute('aria-hidden', 'true');
  fab.prepend(fabOrb);

  // ---------- 设置 → 外观与主题 ----------
  const settings = createNode(documentRef, 'div', 'jq-settings');
  settings.setAttribute('role', 'dialog');
  settings.setAttribute('aria-modal', 'true');
  settings.setAttribute('aria-labelledby', 'jq-settings-title');
  settings.hidden = true;

  const settingsPanel = createNode(documentRef, 'div', 'jq-settings__panel');
  const settingsHead = createNode(documentRef, 'header', 'jq-settings__head');
  const settingsTitle = createNode(documentRef, 'h2', 'jq-settings__title', '设置');
  settingsTitle.setAttribute('id', 'jq-settings-title');
  const settingsBack = createNode(documentRef, 'button', 'jq-settings__back', '返回首页');
  settingsBack.setAttribute('type', 'button');
  settingsBack.addEventListener('click', closeSettings);
  settingsHead.append(settingsTitle, settingsBack);

  const themeGroupSettings = createNode(documentRef, 'section', 'jq-settings__group');
  themeGroupSettings.setAttribute('aria-labelledby', 'jq-settings-theme-title');
  const themeHeading = createNode(documentRef, 'h3', 'jq-settings__group-title', '外观与主题');
  themeHeading.setAttribute('id', 'jq-settings-theme-title');

  const themePicker = createNode(documentRef, 'div', 'jq-theme-picker');
  themePicker.setAttribute('role', 'group');
  themePicker.setAttribute('aria-label', '外观与主题');
  /** @type {Array<{ dir: 'a' | 'b', node: HTMLButtonElement, state: HTMLElement }>} */
  const themeChoices = THEMES.map((dir) => {
    const meta = THEME_META[dir];
    const node = /** @type {HTMLButtonElement} */ (
      createNode(documentRef, 'button', 'jq-theme-card')
    );
    node.setAttribute('type', 'button');
    node.setAttribute('data-theme-choice', dir);
    node.setAttribute('aria-pressed', 'false');
    const swatch = createNode(documentRef, 'span', 'jq-theme-card__swatch');
    swatch.setAttribute('aria-hidden', 'true');
    const body = createNode(documentRef, 'span', 'jq-theme-card__body');
    body.append(
      createNode(documentRef, 'span', 'jq-theme-card__name', meta.name),
      createNode(documentRef, 'span', 'jq-theme-card__desc', meta.desc),
    );
    // 选中态不只靠颜色：同时给「当前使用」文字与 aria-pressed。
    const state = createNode(documentRef, 'span', 'jq-theme-card__state', '当前使用');
    state.hidden = true;
    node.append(swatch, body, state);
    node.addEventListener('click', () => applyTheme(dir, { persist: true }));
    return { dir, node, state };
  });
  for (const choice of themeChoices) themePicker.append(choice.node);

  const settingsStatus = createNode(documentRef, 'p', 'jq-settings__status');
  settingsStatus.setAttribute('aria-live', 'polite');
  settingsStatus.setAttribute('aria-atomic', 'true');

  const themeHint = createNode(
    documentRef,
    'p',
    'jq-settings__hint',
    '选一个你看着舒服的，马上就能看到变化。',
  );
  const scopeNote = createNode(
    documentRef,
    'p',
    'jq-settings__note',
    '本页只保存你自己的外观选择。公共设备是否允许改主题、默认用哪套，尚未确定。',
  );
  themeGroupSettings.append(themeHeading, themeHint, themePicker, settingsStatus, scopeNote);
  settingsPanel.append(settingsHead, themeGroupSettings);
  settings.append(settingsPanel);

  // ---------- 公共终端：结束体验并清除（X01） ----------
  const publicSessionEnd = createPublicSessionEnd(documentRef, {
    onOpenChange: (open) => setBackgroundInert(open),
    onEnd: (reason) => {
      if (config.onEndPublicSession) config.onEndPublicSession(reason);
    },
  });

  settings.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeSettings();
    }
  });

  const root = createNode(documentRef, 'main', config.rootClass ?? 'jq-home');
  root.append(header, scroll, fab, toast, settings, publicSessionEnd.overlay);

  /**
   * 更新主题选择态（不重建 DOM）。
   */
  function updateThemeState() {
    for (const entry of themeButtons) {
      entry.node.setAttribute('aria-pressed', entry.dir === theme ? 'true' : 'false');
    }
    for (const choice of themeChoices) {
      const selected = choice.dir === theme;
      choice.node.setAttribute('aria-pressed', selected ? 'true' : 'false');
      choice.state.hidden = !selected;
    }
  }

  /**
   * 应用主题：只改根元素 token 标记与选择状态，不重建业务 DOM，
   * 因此当前滚动位置与场景状态都不会丢。
   * `persist` 仅在用户于设置面板显式选择时为真；顶部「演示主题」是评审试点控件，不写存储。
   * @param {string} dir
   * @param {{ persist?: boolean }} [options]
   * @returns {'a' | 'b'}
   */
  function applyTheme(dir, options = {}) {
    const current = controller.setTheme(dir);
    if (documentRef.documentElement) {
      documentRef.documentElement.setAttribute('data-dir', current);
    }
    updateThemeState();
    if (options.persist) {
      const saved = preferences.save(current);
      settingsStatus.textContent = saved
        ? PREFERENCE_MESSAGES.saved
        : PREFERENCE_MESSAGES.saveFailed;
    }
    return current;
  }

  /**
   * 入口统一动作：可导航路由交给应用壳（不打断场景状态），其余给出诚实反馈。
   * @param {string} route
   * @returns {string}
   */
  function activate(route) {
    const message = controller.activate(route);
    if (onNavigate && isNavigable(route)) {
      onNavigate(route);
      return message;
    }
    toastText.textContent = message;
    toast.hidden = false;
    return message;
  }

  /** @returns {string} */
  function describePreferenceState() {
    if (!preferences.available) return PREFERENCE_MESSAGES.noStorage;
    const stored = preferences.read();
    if (stored) return '已保存你的偏好：' + THEME_META[stored].name + '。';
    return PREFERENCE_MESSAGES.noPreference;
  }

  /** 打开设置：显示覆盖层、说明偏好状态，并把焦点移到当前选中项。 */
  function openSettings() {
    settingsStatus.textContent = describePreferenceState();
    settings.hidden = false;
    setBackgroundInert(true);
    const selected = themeChoices.filter((choice) => choice.dir === theme)[0];
    const focusTarget = selected ? selected.node : settingsBack;
    if (typeof focusTarget.focus === 'function') focusTarget.focus();
  }

  /** 关闭设置并返回首页，把焦点交回「设置」入口。 */
  function closeSettings() {
    settings.hidden = true;
    setBackgroundInert(false);
    if (settingsEntry && typeof settingsEntry.focus === 'function') settingsEntry.focus();
  }

  /**
   * 设置打开时把背景移出键盘/读屏顺序，避免焦点进入被遮住的内容。
   * @param {boolean} inert
   */
  function setBackgroundInert(inert) {
    for (const node of [header, scroll, fab, publicSessionEnd.entry, toast]) {
      if (inert) node.setAttribute('inert', '');
      else node.removeAttribute('inert');
    }
  }

  /**
   * 切换场景：只更新滚动区修饰类与导航当前项，不重建 body 内容（调用方负责填内容）。
   * @param {string} route
   */
  function setScene(route) {
    sceneRoute = route;
    scroll.className = route === 'home' ? 'jq-scroll' : 'jq-scroll jq-scroll--' + route;
    updateNavCurrent();
  }

  /**
   * 切换个人 / 公共模式：重建顶栏并隐藏或恢复私人入口。
   * 公共模式不接入个人主题偏好存储，也不显示设置、「我的」或个人姓名。
   * @param {'personal' | 'public'} next
   */
  function setMode(next) {
    mode = next;
    renderHeader();
    fab.hidden = mode !== 'personal';
    publicSessionEnd.entry.hidden = mode !== 'public';
    if (mode !== 'public') publicSessionEnd.close(false);
  }

  /** 结束面板只在公共上下文开放；个人模式不提供这条入口。 */
  function openPublicSessionEnd() {
    if (mode === 'public') publicSessionEnd.open();
  }

  /** 清除入口反馈，避免结束体验后仍留着上一条「未接入」提示。 */
  function clearToast() {
    toast.hidden = true;
    toastText.textContent = '';
  }

  renderHeader();
  applyTheme(config.theme ?? 'a');
  fab.hidden = mode !== 'personal';
  publicSessionEnd.entry.hidden = mode !== 'public';
  setScene(sceneRoute);

  return {
    element: root,
    body: scroll,
    controller,
    applyTheme,
    activate,
    openSettings,
    closeSettings,
    clearToast,
    openPublicSessionEnd,
    isPublicSessionEndOpen: publicSessionEnd.isOpen,
    setScene,
    setMode,
    getMode: () => mode,
  };
}
