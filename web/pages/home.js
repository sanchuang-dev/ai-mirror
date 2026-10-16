/**
 * H01 个人首页 —— 单套语义 DOM、单一数据与事件逻辑，A/B 主题只切 CSS 变量。
 *
 * 与 OpenDesign 两份原型（A 日光客厅 / B 暖夜剧场）的关系：
 * - 内容层级、入口与文案意图继承原型的个人首页；
 * - 但不为 A/B 各写一份 DOM，也不使用 `a-*` / `b-*` 分叉类名；
 * - 视觉差异全部落在 tokens.css（颜色、字体、阴影、遮罩），布局与交互只有一份。
 *
 * 本卡是 H01 试点：其它业务路由（V01/V02/L01/M01/E01/A01/C01…）尚未实现，
 * 相关入口仍可操作，但只给出明确的「示例 / 未接入」反馈，不伪造结果。
 */
import { getHomeContent } from '../data/api.js';

/** @typedef {import('../data/fixtures/home.fixture.js').HomeCard} HomeCard */
/** @typedef {import('../data/fixtures/home.fixture.js').HomeActivity} HomeActivity */
/** @typedef {import('../data/fixtures/home.fixture.js').HomeCreation} HomeCreation */
/** @typedef {import('../data/fixtures/home.fixture.js').HomeFixture} HomeContent */

/** @type {Array<'a' | 'b'>} */
const THEMES = ['a', 'b'];

/** 每个首页入口对应的诚实反馈；未列出的路由回落到 FALLBACK_NOTICE。 */
/** @type {Record<string, string>} */
const ROUTE_NOTICES = {
  home: '推荐内容就是当前 H01 首页（示例数据）。',
  video: '看节目 V01 / 播放器 V02 尚未实现：H01 试点只交付首页，本入口为示例演示。',
  activity: '本地生活 L01 尚未实现：本入口为示例演示。',
  course: '数字人课程 E01 尚未实现：本入口为示例演示。',
  shop: '商城 M01 尚未实现：本入口为示例演示。',
  mine: '个人中心 P01 尚未实现：本入口为示例演示。',
  search: '搜索尚未实现：本入口为示例演示。',
  continue: '续播 V02 尚未实现：这里只演示首页「继续观看」入口，为示例。',
  favorite: '片单 / 收藏的登录存储尚未接入：本次只给出示例反馈。',
  ai: 'AI 伙伴 A01 尚未实现：本入口为示例，不是真实 AI 服务。',
  create: 'AI 趣玩 C01 尚未实现：本入口为示例演示。',
  signup: '报名 L02 尚未实现：不会产生真实报名凭证，仅为示例。',
};

const FALLBACK_NOTICE = '该入口尚未实现：H01 试点只交付首页，此处为示例。';

/**
 * 入口反馈文案（纯函数，便于直接验证演示契约）。
 * @param {string} route
 * @returns {string}
 */
export function describeRoute(route) {
  return ROUTE_NOTICES[route] ?? FALLBACK_NOTICE;
}

/**
 * 首页交互状态：主题与最后一次入口反馈。
 * 主题只保存选择结果，不读写 localStorage —— 正式「设置 → 外观与主题」入口是待实现功能。
 */
export function createHomeController() {
  /** @type {'a' | 'b'} */
  let theme = 'a';
  let status = '';
  return {
    /** @returns {'a' | 'b'} */
    getTheme() {
      return theme;
    },
    /**
     * @param {string} dir
     * @returns {'a' | 'b'}
     */
    setTheme(dir) {
      if (dir === 'a' || dir === 'b') theme = dir;
      return theme;
    },
    /** @returns {string} */
    getStatus() {
      return status;
    },
    /**
     * @param {string} route
     * @returns {string}
     */
    activate(route) {
      status = describeRoute(route);
      return status;
    },
  };
}

/**
 * @param {Document} documentRef
 * @param {string} tagName
 * @param {string} [className]
 * @param {string} [text]
 * @returns {HTMLElement}
 */
function createNode(documentRef, tagName, className, text) {
  const node = documentRef.createElement(tagName);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/**
 * @param {Document} documentRef
 * @param {string} className
 * @param {string} label
 * @param {string} route
 * @param {(route: string) => void} onActivate
 * @returns {HTMLButtonElement}
 */
function createRouteButton(documentRef, className, label, route, onActivate) {
  const node = createNode(documentRef, 'button', className, label);
  node.setAttribute('type', 'button');
  node.setAttribute('data-route', route);
  node.addEventListener('click', () => onActivate(route));
  return /** @type {HTMLButtonElement} */ (node);
}

/**
 * 无版权素材的示例画面占位：只表达层级，不冒充真实剧照 / 商品图。
 * @param {Document} documentRef
 * @param {string} tone
 * @param {string} label
 * @param {boolean} [showNote]
 * @returns {HTMLElement}
 */
function createMedia(documentRef, tone, label, showNote) {
  const media = createNode(documentRef, 'div', 'jq-media jq-media--' + tone);
  media.setAttribute('role', 'img');
  media.setAttribute('aria-label', '示例画面：' + label);
  if (showNote) {
    media.append(createNode(documentRef, 'span', 'jq-media__note', '示例画面'));
  }
  return media;
}

/**
 * @param {Document} documentRef
 * @param {number} progress
 * @param {string} className
 * @returns {HTMLElement}
 */
function createProgress(documentRef, progress, className) {
  const bar = createNode(documentRef, 'div', className);
  bar.setAttribute('role', 'progressbar');
  bar.setAttribute('aria-valuemin', '0');
  bar.setAttribute('aria-valuemax', '100');
  bar.setAttribute('aria-valuenow', String(progress));
  const fill = createNode(documentRef, 'span');
  fill.setAttribute('style', '--jq-progress:' + progress + '%');
  bar.append(fill);
  return bar;
}

/**
 * @param {Document} documentRef
 * @param {string} title
 * @param {string} sub
 * @param {string} titleId
 * @param {(route: string) => void} onActivate
 * @param {{ label: string, route: string }} [more]
 * @returns {HTMLElement}
 */
function createSectionHead(documentRef, title, sub, titleId, onActivate, more) {
  const head = createNode(documentRef, 'header', 'jq-section__head');
  const heading = createNode(documentRef, 'h2', 'jq-section__title', title);
  heading.setAttribute('id', titleId);
  head.append(heading, createNode(documentRef, 'span', 'jq-section__sub', sub));
  if (more) {
    head.append(createRouteButton(documentRef, 'jq-more', more.label, more.route, onActivate));
  }
  return head;
}

/**
 * 构建 H01 首页。返回单棵 DOM 与可验证的控制器，不做全局副作用。
 * @param {Document} documentRef
 * @param {HomeContent} content
 * @param {'a' | 'b'} [initialTheme]
 */
export function renderHome(documentRef, content, initialTheme) {
  const controller = createHomeController();

  const banner = createNode(documentRef, 'p', 'jq-banner', content.demo.notice);
  const status = createNode(documentRef, 'p', 'jq-status');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');

  /** @param {string} route */
  const activate = (route) => {
    status.textContent = controller.activate(route);
  };

  // ---------- 顶栏：品牌 + 一级导航 + 问候 / 演示主题 / 搜索 / 用户 ----------
  const header = createNode(documentRef, 'header', 'jq-header');

  const brand = createNode(documentRef, 'div', 'jq-brand');
  brand.append(
    createNode(documentRef, 'span', 'jq-brand__logo', '见趣'),
    createNode(documentRef, 'span', 'jq-brand__sub', '闺蜜机 · 客厅里的好伙伴'),
  );

  const nav = createNode(documentRef, 'nav', 'jq-nav');
  nav.setAttribute('aria-label', '内容分区');
  for (const item of content.nav) {
    const link = createRouteButton(documentRef, 'jq-nav__item', item.label, item.route, activate);
    if (item.route === 'home') link.setAttribute('aria-current', 'page');
    nav.append(link);
  }

  const headerEnd = createNode(documentRef, 'div', 'jq-header__end');
  const viewer = content.viewer;
  headerEnd.append(
    createNode(
      documentRef,
      'p',
      'jq-greeting',
      viewer.dateLabel + ' · ' + viewer.greeting + '，' + viewer.name,
    ),
  );

  const themeGroup = createNode(documentRef, 'div', 'jq-theme');
  themeGroup.setAttribute('role', 'group');
  themeGroup.setAttribute('aria-label', '演示主题切换（试点控件，非正式设置）');
  /** @type {Array<{ dir: 'a' | 'b', node: HTMLButtonElement }>} */
  const themeButtons = THEMES.map((dir) => {
    const label = dir === 'a' ? 'A · 日光客厅' : 'B · 暖夜剧场';
    const node = createNode(documentRef, 'button', 'jq-theme__option', label);
    node.setAttribute('type', 'button');
    node.setAttribute('data-dir-option', dir);
    node.addEventListener('click', () => applyTheme(dir));
    return { dir, node: /** @type {HTMLButtonElement} */ (node) };
  });
  themeGroup.append(createNode(documentRef, 'span', 'jq-theme__label', '演示主题'));
  for (const entry of themeButtons) themeGroup.append(entry.node);

  const search = createRouteButton(documentRef, 'jq-search', '搜一搜', 'search', activate);
  const user = createNode(documentRef, 'div', 'jq-user');
  const avatar = createNode(documentRef, 'span', 'jq-avatar', viewer.avatarText);
  avatar.setAttribute('aria-hidden', 'true');
  user.append(avatar, createNode(documentRef, 'span', 'jq-user__name', viewer.name));

  headerEnd.append(themeGroup, search, user);
  header.append(brand, nav, headerEnd);

  // ---------- 主体滚动区 ----------
  const scroll = createNode(documentRef, 'div', 'jq-scroll');
  scroll.append(banner, status);

  // 继续观看：全页唯一 h1。
  const featured = content.featured;
  const heroSection = createNode(documentRef, 'section', 'jq-hero-section');
  heroSection.setAttribute('aria-labelledby', 'jq-hero-title');
  const hero = createNode(documentRef, 'article', 'jq-hero');
  const heroMedia = createMedia(documentRef, featured.tone, featured.title, true);
  const heroTag = createNode(documentRef, 'span', 'jq-hero__tag', featured.tag);
  heroMedia.append(heroTag);
  const heroBody = createNode(documentRef, 'div', 'jq-hero__body');
  const heroTitle = createNode(documentRef, 'h1', 'jq-hero__title', featured.title);
  heroTitle.setAttribute('id', 'jq-hero-title');
  const heroActions = createNode(documentRef, 'div', 'jq-hero__actions');
  heroActions.append(
    createRouteButton(documentRef, 'jq-btn jq-btn--primary', '继续观看', 'continue', activate),
    createRouteButton(documentRef, 'jq-btn jq-btn--ghost', '加入片单', 'favorite', activate),
  );
  heroBody.append(
    createNode(documentRef, 'p', 'jq-eyebrow', featured.eyebrow),
    heroTitle,
    createNode(documentRef, 'p', 'jq-hero__desc', featured.description),
    createProgress(documentRef, featured.progress, 'jq-progress jq-progress--hero'),
    createNode(documentRef, 'p', 'jq-hero__progresstext', featured.progressText),
    heroActions,
  );
  hero.append(heroMedia, heroBody);
  heroSection.append(hero);
  scroll.append(heroSection);

  // 接着看
  const continueSection = createNode(documentRef, 'section', 'jq-section');
  continueSection.setAttribute('aria-labelledby', 'jq-continue-title');
  continueSection.append(
    createSectionHead(
      documentRef,
      '接着看',
      '你追到一半的都在这里',
      'jq-continue-title',
      activate,
      { label: '全部 ›', route: 'video' },
    ),
  );
  const continueRail = createNode(documentRef, 'div', 'jq-rail');
  for (const card of content.continueWatching) {
    continueRail.append(renderCard(documentRef, card, activate, true));
  }
  continueSection.append(continueRail);
  scroll.append(continueSection);

  // 今日精选
  const pickSection = createNode(documentRef, 'section', 'jq-section');
  pickSection.setAttribute('aria-labelledby', 'jq-pick-title');
  pickSection.append(
    createSectionHead(documentRef, '今日精选', '按你常看的口味挑的', 'jq-pick-title', activate, {
      label: '全部 ›',
      route: 'video',
    }),
  );
  const pickRail = createNode(documentRef, 'div', 'jq-rail');
  for (const card of content.recommendations) {
    pickRail.append(renderCard(documentRef, card, activate, false));
  }
  pickSection.append(pickRail);
  scroll.append(pickSection);

  // 家门口的活动
  const activitySection = createNode(documentRef, 'section', 'jq-section');
  activitySection.setAttribute('aria-labelledby', 'jq-activity-title');
  activitySection.append(
    createSectionHead(
      documentRef,
      '家门口的活动',
      '云栖社区 · 本周末',
      'jq-activity-title',
      activate,
      { label: '全部 ›', route: 'activity' },
    ),
  );
  const activityGrid = createNode(documentRef, 'div', 'jq-grid jq-grid--activity');
  for (const activity of content.activities) {
    activityGrid.append(renderActivity(documentRef, activity, activate));
  }
  activitySection.append(activityGrid);
  scroll.append(activitySection);

  // 随手玩点新花样
  const createSection = createNode(documentRef, 'section', 'jq-section');
  createSection.setAttribute('aria-labelledby', 'jq-create-title');
  createSection.append(
    createSectionHead(documentRef, '随手玩点新花样', '把日子过成作品', 'jq-create-title', activate),
  );
  const createGrid = createNode(documentRef, 'div', 'jq-grid jq-grid--create');
  for (const creation of content.creations) {
    createGrid.append(renderCreation(documentRef, creation, activate));
  }
  createSection.append(createGrid);
  scroll.append(createSection);

  // AI 伙伴入口（常驻，不占据整页）
  const companion = content.companion;
  const companionSection = createNode(documentRef, 'section', 'jq-companion');
  companionSection.setAttribute('aria-label', 'AI 伙伴 ' + companion.name);
  const orb = createNode(documentRef, 'span', 'jq-orb jq-orb--sm');
  orb.setAttribute('aria-hidden', 'true');
  const companionText = createNode(documentRef, 'div', 'jq-companion__text');
  companionText.append(
    createNode(documentRef, 'p', 'jq-companion__name', companion.name + ' · ' + companion.status),
    createNode(documentRef, 'p', 'jq-companion__line', companion.line),
  );
  companionSection.append(
    orb,
    companionText,
    createRouteButton(documentRef, 'jq-btn jq-btn--ghost jq-btn--sm', '问小暖', 'ai', activate),
  );
  scroll.append(companionSection);

  const fab = createRouteButton(documentRef, 'jq-ai-fab', '问问小暖', 'ai', activate);
  const fabOrb = createNode(documentRef, 'span', 'jq-orb jq-orb--xs');
  fabOrb.setAttribute('aria-hidden', 'true');
  fab.prepend(fabOrb);

  const root = createNode(documentRef, 'main', 'jq-home');
  root.append(header, scroll, fab);

  /**
   * 应用主题：只改根元素 token 标记与演示控件状态，不改任何业务 DOM。
   * @param {string} dir
   */
  function applyTheme(dir) {
    const current = controller.setTheme(dir);
    if (documentRef.documentElement) {
      documentRef.documentElement.setAttribute('data-dir', current);
    }
    for (const entry of themeButtons) {
      entry.node.setAttribute('aria-pressed', entry.dir === current ? 'true' : 'false');
    }
  }

  applyTheme(initialTheme ?? controller.getTheme());

  return { element: root, controller, applyTheme, activate };
}

/**
 * @param {Document} documentRef
 * @param {HomeCard} card
 * @param {(route: string) => void} onActivate
 * @param {boolean} withProgress
 * @returns {HTMLElement}
 */
function renderCard(documentRef, card, onActivate, withProgress) {
  const node = createRouteButton(documentRef, 'jq-card', '', 'video', onActivate);
  const media = createMedia(documentRef, card.tone, card.title, false);
  if (card.tag) media.append(createNode(documentRef, 'span', 'jq-card__badge', card.tag));
  if (withProgress && typeof card.progress === 'number') {
    media.append(createProgress(documentRef, card.progress, 'jq-progress jq-progress--card'));
  }
  node.setAttribute('aria-label', card.title + '，' + card.meta + '（示例内容）');
  node.append(
    media,
    createNode(documentRef, 'span', 'jq-card__name', card.title),
    createNode(documentRef, 'span', 'jq-card__meta', card.meta),
  );
  return node;
}

/**
 * @param {Document} documentRef
 * @param {HomeActivity} activity
 * @param {(route: string) => void} onActivate
 * @returns {HTMLElement}
 */
function renderActivity(documentRef, activity, onActivate) {
  const article = createNode(documentRef, 'article', 'jq-panel jq-activity');
  const media = createMedia(documentRef, activity.tone, activity.title, false);
  const body = createNode(documentRef, 'div', 'jq-activity__body');
  const foot = createNode(documentRef, 'div', 'jq-activity__foot');
  const chip = createNode(documentRef, 'span', 'jq-chip', activity.price);
  if (activity.free) chip.classList.add('jq-chip--free');
  foot.append(
    chip,
    createRouteButton(documentRef, 'jq-btn jq-btn--ghost jq-btn--sm', '报名', 'signup', onActivate),
  );
  body.append(
    createNode(documentRef, 'h3', 'jq-activity__name', activity.title),
    createNode(documentRef, 'p', 'jq-activity__meta', activity.place + ' · ' + activity.time),
    foot,
  );
  article.append(media, body);
  return article;
}

/**
 * @param {Document} documentRef
 * @param {HomeCreation} creation
 * @param {(route: string) => void} onActivate
 * @returns {HTMLElement}
 */
function renderCreation(documentRef, creation, onActivate) {
  const node = createRouteButton(documentRef, 'jq-panel jq-creation', '', 'create', onActivate);
  node.setAttribute('aria-label', creation.title + '：' + creation.subtitle + '（示例）');
  node.append(
    createMedia(documentRef, creation.tone, creation.title, false),
    createNode(documentRef, 'span', 'jq-creation__name', creation.title),
    createNode(documentRef, 'span', 'jq-creation__sub', creation.subtitle),
  );
  return node;
}

/**
 * 挂载 H01 到 `#app`。缺少出口时显式失败，不静默吞掉。
 * @param {Document} documentRef
 * @param {'a' | 'b'} [initialTheme]
 */
export function mountHome(documentRef, initialTheme) {
  const outlet = documentRef.getElementById('app');
  if (!outlet) {
    throw new Error('Required application outlet #app is missing');
  }
  const view = renderHome(documentRef, getHomeContent(), initialTheme);
  outlet.replaceChildren(view.element);
  return view;
}
