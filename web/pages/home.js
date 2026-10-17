/**
 * H01 个人首页 —— 单套语义 DOM、单一数据与事件逻辑，A/B 主题只切 CSS 变量。
 *
 * T03 起 H01 不再自建顶栏 / 主题控件 / 设置面板：它与 V02 / A01 / E01 / G00 一起
 * 复用 `components/app-shell.js` 的共享场景壳（同一份导航、主题状态、设置与反馈），
 * 本文件只负责首页正文内容。仍不为 A/B 各写一份 DOM，也不用 `a-*` / `b-*` 分叉类名。
 *
 * 影像复用 OpenDesign 原型的开放授权素材（web/assets/img/CREDITS.md）。
 * 未接入真实的入口只给出明确的「示例 / 未接入」反馈，不伪造结果。
 */
import { getHomeContent } from '../data/api.js';
import { describeRoute } from '../data/notices.js';
import {
  createMedia,
  createNode,
  createProgress,
  createRouteButton,
  createSectionHead,
} from '../components/kit.js';
import { createSceneShell, NO_PREFERENCES } from '../components/app-shell.js';

/** @typedef {import('../data/fixtures/home.fixture.js').HomeCard} HomeCard */
/** @typedef {import('../data/fixtures/home.fixture.js').HomeActivity} HomeActivity */
/** @typedef {import('../data/fixtures/home.fixture.js').HomeCreation} HomeCreation */
/** @typedef {import('../data/fixtures/home.fixture.js').HomeFixture} HomeContent */
/** @typedef {import('../data/preferences.js').ThemePreferences} ThemePreferences */

// describeRoute 的既有公开出口仍保留在这里（其它页面从 web/data/notices.js 取同一份文案）。
export { describeRoute };

/** 首页顶栏品牌文案，与 OpenDesign 个人首页一致。 */
const HOME_BRAND = { logo: '见趣', sub: '闺蜜机 · 客厅里的好伙伴' };

/** 首页单独渲染（非公共模式）时占位的公共配置；真实公共品牌见 public 场景数据。 */
const HOME_PUBLIC_PLACEHOLDER = {
  brand: { logo: '见趣 · 社区版', sub: '公共终端' },
  note: '本机为公共终端，不含个人内容',
  dateLabel: '',
};

/**
 * 首页交互状态：主题与最后一次入口反馈。仅为向后兼容保留；正式状态在共享壳里。
 * @returns {{ getTheme: () => 'a' | 'b', setTheme: (dir: string) => 'a' | 'b', getStatus: () => string, activate: (route: string) => string }}
 */
export function createHomeController() {
  /** @type {'a' | 'b'} */
  let theme = 'a';
  let status = '';
  return {
    getTheme: () => theme,
    setTheme: (dir) => {
      if (dir === 'a' || dir === 'b') theme = dir;
      return theme;
    },
    getStatus: () => status,
    activate: (route) => {
      status = describeRoute(route);
      return status;
    },
  };
}

/**
 * 构建 H01 首页正文（不含顶栏 / 设置 / 反馈），供共享壳与独立预览共用。
 * @param {Document} documentRef
 * @param {HomeContent} content
 * @param {(route: string) => void} activate 共享壳的统一入口动作
 * @returns {HTMLElement}
 */
export function renderHomeBody(documentRef, content, activate) {
  const body = createNode(documentRef, 'div', 'jq-home-body');

  body.append(createNode(documentRef, 'p', 'jq-banner', content.demo.notice));

  // 继续观看：全页唯一 h1。
  const featured = content.featured;
  const heroSection = createNode(documentRef, 'section', 'jq-hero-section');
  heroSection.setAttribute('aria-labelledby', 'jq-hero-title');
  const hero = createNode(documentRef, 'article', 'jq-hero');
  const heroMedia = createMedia(
    documentRef,
    {
      tone: featured.tone,
      image: featured.image,
      imageAlt: featured.imageAlt,
      title: featured.title,
    },
    true,
  );
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
  body.append(heroSection);

  // 接着看
  const continueSection = createNode(documentRef, 'section', 'jq-section');
  continueSection.setAttribute('aria-labelledby', 'jq-continue-title');
  continueSection.append(
    createSectionHead(documentRef, '接着看', activate, {
      sub: '你追到一半的都在这里',
      titleId: 'jq-continue-title',
      more: { label: '全部 ›', route: 'video' },
    }),
  );
  const continueRail = createNode(documentRef, 'div', 'jq-rail jq-rail--continue');
  for (const card of content.continueWatching) {
    continueRail.append(renderCard(documentRef, card, activate, true));
  }
  continueSection.append(continueRail);
  body.append(continueSection);

  // 今日精选
  const pickSection = createNode(documentRef, 'section', 'jq-section');
  pickSection.setAttribute('aria-labelledby', 'jq-pick-title');
  pickSection.append(
    createSectionHead(documentRef, '今日精选', activate, {
      sub: '按你常看的口味挑的',
      titleId: 'jq-pick-title',
      more: { label: '全部 ›', route: 'video' },
    }),
  );
  const pickRail = createNode(documentRef, 'div', 'jq-rail');
  for (const card of content.recommendations) {
    pickRail.append(renderCard(documentRef, card, activate, false));
  }
  pickSection.append(pickRail);
  body.append(pickSection);

  // 家门口的活动
  const activitySection = createNode(documentRef, 'section', 'jq-section');
  activitySection.setAttribute('aria-labelledby', 'jq-activity-title');
  activitySection.append(
    createSectionHead(documentRef, '家门口的活动', activate, {
      sub: '云栖社区 · 本周末',
      titleId: 'jq-activity-title',
      more: { label: '全部 ›', route: 'activity' },
    }),
  );
  const activityGrid = createNode(documentRef, 'div', 'jq-grid jq-grid--activity');
  for (const activity of content.activities) {
    activityGrid.append(renderActivity(documentRef, activity, activate));
  }
  activitySection.append(activityGrid);
  body.append(activitySection);

  // 随手玩点新花样
  const createSection = createNode(documentRef, 'section', 'jq-section');
  createSection.setAttribute('aria-labelledby', 'jq-create-title');
  createSection.append(
    createSectionHead(documentRef, '随手玩点新花样', activate, {
      sub: '把日子过成作品',
      titleId: 'jq-create-title',
    }),
  );
  const createGrid = createNode(documentRef, 'div', 'jq-grid jq-grid--create');
  for (const creation of content.creations) {
    createGrid.append(renderCreation(documentRef, creation, activate));
  }
  createSection.append(createGrid);
  body.append(createSection);

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
  body.append(companionSection);

  return body;
}

/**
 * 构建 H01 首页：共享壳 + 首页正文。返回单棵 DOM 与可验证的控制器，不做全局副作用。
 * @param {Document} documentRef
 * @param {HomeContent} content
 * @param {'a' | 'b'} [initialTheme]
 * @param {ThemePreferences} [preferences] 个人主题偏好存储；缺省时不读写存储
 * @param {{ isNavigable?: (route: string) => boolean, onNavigate?: (route: string) => void }} [options]
 */
export function renderHome(
  documentRef,
  content,
  initialTheme,
  preferences = NO_PREFERENCES,
  options = {},
) {
  const shell = createSceneShell(documentRef, {
    rootClass: 'jq-home',
    theme: initialTheme,
    preferences,
    describeRoute,
    isNavigable: options.isNavigable,
    onNavigate: options.onNavigate,
    personal: {
      brand: HOME_BRAND,
      viewer: content.viewer,
      nav: content.nav,
      companion: content.companion,
    },
    publicConfig: HOME_PUBLIC_PLACEHOLDER,
  });
  shell.body.append(renderHomeBody(documentRef, content, shell.activate));
  return shell;
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
  const media = createMedia(documentRef, {
    tone: card.tone,
    image: card.image,
    imageAlt: card.imageAlt,
    title: card.title,
  });
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
  const media = createMedia(documentRef, {
    tone: activity.tone,
    image: activity.image,
    imageAlt: activity.imageAlt,
    title: activity.title,
  });
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
    createMedia(documentRef, {
      tone: creation.tone,
      image: creation.image,
      imageAlt: creation.imageAlt,
      title: creation.title,
    }),
    createNode(documentRef, 'span', 'jq-creation__name', creation.title),
    createNode(documentRef, 'span', 'jq-creation__sub', creation.subtitle),
  );
  return node;
}

/**
 * 挂载 H01 到 `#app`。缺少出口时显式失败，不静默吞掉。
 * @param {Document} documentRef
 * @param {'a' | 'b'} [initialTheme]
 * @param {ThemePreferences} [preferences] 个人主题偏好存储；缺省时不读写存储
 */
export function mountHome(documentRef, initialTheme, preferences) {
  const outlet = documentRef.getElementById('app');
  if (!outlet) {
    throw new Error('Required application outlet #app is missing');
  }
  const view = renderHome(documentRef, getHomeContent(), initialTheme, preferences);
  outlet.replaceChildren(view.element);
  return view;
}
