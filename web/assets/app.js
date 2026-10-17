/**
 * 见趣 Web 基线入口（T03）。
 *
 * 入口只做一件事：装配**一个**共享场景壳，把 H01 / V02 / A01 / E01 / G00 五个既有场景
 * 接到同一套导航与主题状态上。场景正文只在首次进入时构建并缓存，导航返回或切换主题
 * 不会重建它们，因此场景里的选集、说话方式、输入内容、板书讲法等演示状态不会丢。
 *
 * 主题状态仍是唯一一份（根元素 `data-dir` + tokens.css），不引入第二份状态处理；
 * 也不携带原型调试球或整页缩放。
 */
import { createThemePreferences, resolveInitialTheme } from '../data/preferences.js';
import { describeRoute } from '../data/notices.js';
import {
  getAiContent,
  getCourseContent,
  getHomeContent,
  getPublicContent,
  getVideoContent,
} from '../data/api.js';
import { createSceneShell, NO_PREFERENCES } from '../components/app-shell.js';
import { mountHome, renderHomeBody } from '../pages/home.js';
import { renderVideoBody } from '../pages/video.js';
import { renderAiBody } from '../pages/ai.js';
import { renderCourseBody } from '../pages/course.js';
import { renderPublicBody } from '../pages/public.js';

export { mountHome };

/** 有正式演示页面的路由；其余路由仍走共享壳里的诚实「示例 / 未接入」反馈。 */
const NAVIGABLE_ROUTES = new Set(['home', 'video', 'ai', 'course', 'public']);

/** 公共模式路由：进入后顶栏不显示个人身份与设置入口。 */
const PUBLIC_ROUTE = 'public';

/**
 * Preview-only device selection; production hosts must supply trusted deployment
 * configuration instead of treating this query argument as authentication.
 * @returns {'personal' | 'public'}
 */
function readDeviceModeFromLocation() {
  if (typeof location === 'undefined') return 'personal';
  return new URLSearchParams(location.search).get('device') === 'public' ? 'public' : 'personal';
}

/**
 * 既有评审/截图参数：`?dir=b` 直接以 B 主题预览。
 * 它只作初始主题来源之一，不写入存储；个人已保存偏好优先，见 `resolveInitialTheme`。
 * @returns {'a' | 'b' | undefined}
 */
function readThemeFromLocation() {
  if (typeof location === 'undefined') return undefined;
  const dir = new URLSearchParams(location.search).get('dir');
  return dir === 'a' || dir === 'b' ? dir : undefined;
}

/**
 * 装配并挂载整站演示。返回共享壳与路由函数，便于验证。
 * @param {Document} documentRef
 * @param {import('../data/preferences.js').ThemePreferences} [preferences]
 * @param {{ deviceMode?: 'personal' | 'public' }} [options]
 * @returns {{ shell: import('../components/app-shell.js').SceneShell, show: (route: string) => string }}
 */
export function mountApp(documentRef, preferences, options = {}) {
  const outlet = documentRef.getElementById('app');
  if (!outlet) {
    throw new Error('Required application outlet #app is missing');
  }

  // Public terminals must not read an injected personal preference.
  const deviceMode = options.deviceMode ?? 'personal';
  const effectivePreferences =
    deviceMode === 'public' ? NO_PREFERENCES : (preferences ?? createThemePreferences());
  const home = getHomeContent();
  const publicContent = getPublicContent();
  const initialTheme = resolveInitialTheme({
    stored: deviceMode === 'public' ? null : effectivePreferences.read(),
    param: readThemeFromLocation(),
  });

  /** @type {Map<string, HTMLElement>} Lazy scene bodies preserve local interaction state. */
  const bodies = new Map();
  /** @type {Map<string, number>} Independent scroll position for each scene. */
  const scrollPositions = new Map();
  /** @type {string | null} */
  let activeRoute = null;

  /** @type {import('../components/app-shell.js').SceneShell} */
  let shell;

  /**
   * 构建（或复用）场景正文。复用保证「导航返回不清空场景的演示状态」。
   * @param {string} route
   * @returns {HTMLElement}
   */
  function bodyFor(route) {
    const cached = bodies.get(route);
    if (cached) return cached;
    /** @type {HTMLElement} */
    let body;
    if (route === 'video') body = renderVideoBody(documentRef, getVideoContent(), shell.activate);
    else if (route === 'ai') body = renderAiBody(documentRef, getAiContent(), shell.activate);
    else if (route === 'course') {
      body = renderCourseBody(documentRef, getCourseContent(), shell.activate);
    } else if (route === PUBLIC_ROUTE) {
      body = renderPublicBody(documentRef, publicContent, shell.activate);
    } else body = renderHomeBody(documentRef, home, shell.activate);
    bodies.set(route, body);
    return body;
  }

  /**
   * 切到某个场景：先切模式（个人 / 公共），再替换正文。主题不变、导航当前项更新。
   * @param {string} route
   * @returns {string}
   */
  function show(route) {
    // Deployment mode is immutable. Even a stale or synthetic private route
    // cannot expose the private shell on a public terminal.
    if (deviceMode === 'public' && route !== PUBLIC_ROUTE) return PUBLIC_ROUTE;
    const target = NAVIGABLE_ROUTES.has(route) ? route : 'home';
    if (activeRoute === target) return target;

    if (activeRoute !== null) {
      scrollPositions.set(activeRoute, shell.body.scrollTop);
    }
    shell.setMode(target === PUBLIC_ROUTE ? 'public' : 'personal');
    shell.setScene(target);
    shell.body.replaceChildren(bodyFor(target));
    shell.body.scrollTop = scrollPositions.get(target) ?? 0;
    activeRoute = target;
    return target;
  }

  shell = createSceneShell(documentRef, {
    rootClass: 'jq-home',
    theme: initialTheme,
    preferences: effectivePreferences,
    canLeavePublicPreview: deviceMode === 'personal',
    describeRoute,
    isNavigable: (route) => NAVIGABLE_ROUTES.has(route),
    onNavigate: show,
    personal: {
      brand: { logo: '见趣', sub: '闺蜜机 · 客厅里的好伙伴' },
      viewer: home.viewer,
      nav: home.nav,
      companion: home.companion,
    },
    publicConfig: {
      brand: publicContent.brand,
      note: publicContent.note,
      dateLabel: publicContent.dateLabel,
    },
  });

  show(deviceMode === 'public' ? PUBLIC_ROUTE : 'home');
  outlet.replaceChildren(shell.element);
  return { shell, show };
}

if (typeof document !== 'undefined') {
  // Preview selector only; real deployment must use trusted device activation.
  mountApp(document, undefined, { deviceMode: readDeviceModeFromLocation() });
}
