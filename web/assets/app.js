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
import { createSceneShell } from '../components/app-shell.js';
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
 * @returns {{ shell: import('../components/app-shell.js').SceneShell, show: (route: string) => string }}
 */
export function mountApp(documentRef, preferences = createThemePreferences()) {
  const outlet = documentRef.getElementById('app');
  if (!outlet) {
    throw new Error('Required application outlet #app is missing');
  }

  const home = getHomeContent();
  const publicContent = getPublicContent();
  // 个人已保存偏好优先；仅在没有个人偏好时使用 `?dir` 评审参数，默认 A。
  const initialTheme = resolveInitialTheme({
    stored: preferences.read(),
    param: readThemeFromLocation(),
  });

  /** @type {Map<string, HTMLElement>} 首次进入即缓存，返回时原样复用，保留场景状态。 */
  const bodies = new Map();

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
    const target = NAVIGABLE_ROUTES.has(route) ? route : 'home';
    shell.setMode(target === PUBLIC_ROUTE ? 'public' : 'personal');
    shell.setScene(target);
    shell.body.replaceChildren(bodyFor(target));
    return target;
  }

  shell = createSceneShell(documentRef, {
    rootClass: 'jq-home',
    theme: initialTheme,
    preferences,
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

  show('home');
  outlet.replaceChildren(shell.element);
  return { shell, show };
}

if (typeof document !== 'undefined') {
  // 本试点按个人会话接入本地偏好。公共设备模式（G00）不读取也不写入个人存储，
  // 公共设备默认主题与访客改主题权限仍未确定，由设备部署规则另行确认。
  mountApp(document, createThemePreferences());
}
