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
  getActivityContent,
  getAiContent,
  getCourseContent,
  getCreationContent,
  getCreationResultContent,
  getHomeContent,
  getProgramContent,
  getProgramDetail,
  getPublicContent,
  getVideoContent,
} from '../data/api.js';
import { createSceneShell, NO_PREFERENCES } from '../components/app-shell.js';
import { mountHome, renderHomeBody } from '../pages/home.js';
import { applyVideoWatchSelection, renderVideoBody } from '../pages/video.js';
import { renderAiBody } from '../pages/ai.js';
import { renderCourseBody } from '../pages/course.js';
import { renderPublicBody } from '../pages/public.js';
import { renderCreationBody, resetCreationFlow } from '../pages/creation.js';
import { renderCreationResultBody } from '../pages/creation-result.js';
import { renderActivitiesBody } from '../pages/activities.js';
import { clearCreationDraft } from '../data/creation-draft.js';
import { createWatchLibrary } from '../data/watch.js';
import {
  focusProgramsSearch,
  openProgramDetail,
  refreshProgramDetail,
  renderProgramsBody,
  selectProgramsCategory,
} from '../pages/programs.js';

export { mountHome };

/**
 * 「看节目」分类路由 → 节目目录初始分类。
 * 顶栏的短剧 / 戏曲 / 老歌入口都落在同一套节目列表的合理默认状态，
 * 不再直接跳进固定的 V02 播放场景。
 * @type {Record<string, string>}
 */
const PROGRAM_ROUTES = {
  programs: 'all',
  'programs-drama': 'drama',
  'programs-opera': 'opera',
  'programs-music': 'oldies',
};

/** Program tabs have one canonical shell route; 推荐 shares the generic directory. */
/** @type {Record<string, string>} */
const PROGRAM_CATEGORY_ROUTES = {
  all: 'programs',
  recommend: 'programs',
  drama: 'programs-drama',
  opera: 'programs-opera',
  oldies: 'programs-music',
};

/** 搜索入口：打开「看节目」目录的搜索视图（全部范围）。 */
const SEARCH_ROUTE = 'search';

/** 有正式演示页面的路由；其余路由仍走共享壳里的诚实「示例 / 未接入」反馈。 */
const NAVIGABLE_ROUTES = new Set([
  'home',
  'video',
  'ai',
  'course',
  'public',
  // 首页「随手玩点新花样」的 AI 趣玩入口：进入 C01 主题选择 / 素材授权演示页。
  'create',
  // C01「模拟生成」后的 C02 作品结果页：预生成示例作品 → 私密保存 → 分享确认。
  'create-result',
  SEARCH_ROUTE,
  // 首页「继续观看」是正式续播入口：按正确节目 / 集进入既有 V02 播放器，
  // 不再只是发出一条 Toast。
  'continue',
  // L01-A 本地活动与福利示例目录（分类 + 关键词筛选 + 空状态）。
  'activity',
  ...Object.keys(PROGRAM_ROUTES),
]);

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
 * @param {{ deviceMode?: 'personal' | 'public', watch?: import('../data/watch.js').WatchLibrary }} [options]
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
  // 观看进度 / 收藏同属个人数据：公共设备只用内存实例，绝不读取本机存储。
  const watch =
    deviceMode === 'public' ? createWatchLibrary(null) : (options.watch ?? createWatchLibrary());
  const home = getHomeContent();
  const publicContent = getPublicContent();
  const programContent = getProgramContent();
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
  /** 需要进入目录后打开示例详情的节目（首页指向未接入片源的节目时使用）。 */
  /** @type {string | null} */
  let pendingProgramDetail = null;

  /** @type {import('../components/app-shell.js').SceneShell} */
  let shell;

  /**
   * 构建（或复用）场景正文。复用保证「导航返回不清空场景的演示状态」。
   * `create-result` 例外：它按最新一次 C01 交接数据重建，不复用缓存，
   * 因此不会把上一次 / 上一位使用者的作品与分享状态留在页面里。
   * @param {string} route
   * @returns {HTMLElement}
   */
  function bodyFor(route) {
    // All directory routes share one list DOM, retaining keyword, details and scroll state.
    const cacheKey = Object.hasOwn(PROGRAM_ROUTES, route) ? 'programs' : route;
    const cacheable = route !== 'create-result';
    if (cacheable) {
      const cached = bodies.get(cacheKey);
      if (cached) return cached;
    }
    /** @type {HTMLElement} */
    let body;
    if (route === 'video') {
      body = renderVideoBody(documentRef, getVideoContent(), shell.activate, { library: watch });
    } else if (route === 'ai') body = renderAiBody(documentRef, getAiContent(), shell.activate);
    else if (route === 'course') {
      body = renderCourseBody(documentRef, getCourseContent(), shell.activate);
    } else if (route === 'create') {
      // 首页「随手玩点新花样」的 AI 趣玩入口（C01）：主题选择 + 素材授权 + 模拟生成。
      body = renderCreationBody(documentRef, getCreationContent(), shell.activate);
    } else if (route === 'create-result') {
      // C02 作品结果：默认仅自己可见 → 保存（演示）→ 选分享对象 → 二次确认 / 取消。
      body = renderCreationResultBody(documentRef, getCreationResultContent(), shell.activate, {
        onRestart: () => {
          // 再做一次：清空 C01 场景与其交接数据，从第 1 步重新开始。
          resetCreationFlow(bodyFor('create'));
          show('create');
        },
        onReturnToCreation: () => show('create'),
        onDiscard: () => {
          // 放弃：丢弃交接数据，不保存、不分享，回首页。
          clearCreationDraft();
          show('home');
        },
      });
    } else if (route === PUBLIC_ROUTE) {
      body = renderPublicBody(documentRef, publicContent, shell.activate);
    } else if (route === 'activity') {
      // L01-A 示例目录：详情（L01-B）与报名（L02）尚未接入，卡片只给诚实提示。
      body = renderActivitiesBody(documentRef, getActivityContent(), shell.activate);
    } else if (route === SEARCH_ROUTE) {
      body = renderProgramsBody(documentRef, programContent, shell.activate, {
        category: 'all',
        searchOpen: true,
        library: watch,
      });
    } else if (Object.hasOwn(PROGRAM_ROUTES, route)) {
      body = renderProgramsBody(documentRef, programContent, shell.activate, {
        category: PROGRAM_ROUTES[route],
        library: watch,
        onCategoryChange: (category) => {
          const nextRoute = PROGRAM_CATEGORY_ROUTES[category] ?? 'programs';
          if (activeRoute !== null && Object.hasOwn(PROGRAM_ROUTES, activeRoute)) {
            shell.setScene(nextRoute);
            activeRoute = nextRoute;
          }
        },
      });
    } else body = renderHomeBody(documentRef, home, shell.activate, { openProgram });
    if (cacheable) bodies.set(cacheKey, body);
    return body;
  }

  /**
   * 首页节目卡片的真实去向解析：可播节目按最近观看集进既有 V02 播放器；
   * 未接入示例片源的节目进入目录中该节目的示例详情并给出明确不可播反馈，
   * 绝不把《茶馆春秋》《团圆饭》等错播成《朝夕巷》。
   * @param {string} programId
   * @returns {string} 实际进入的路由
   */
  function openProgram(programId) {
    const detail = getProgramDetail(programId);
    if (detail && detail.playable) {
      const resume = watch.getResume(programId);
      // 有最近观看记录时按该节目 / 集续播；否则不注入会话选择，播放器用示例默认集。
      if (resume) watch.setSelection({ programId, episodeId: resume.episodeId });
      return show('video');
    }
    // 未接入片源（或目录中不存在该节目）：转到节目目录，随后打开对应示例详情。
    pendingProgramDetail = programId;
    return show('programs');
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
    // 首页主按钮「继续观看」：按正确节目 / 集进入既有 V02 播放器，而不是空入口。
    if (route === 'continue') return openProgram(home.featured.id);
    const target = NAVIGABLE_ROUTES.has(route) ? route : 'home';
    if (activeRoute === target) return target;

    if (activeRoute !== null) {
      scrollPositions.set(activeRoute, shell.body.scrollTop);
    }
    const previous = activeRoute;
    shell.setMode(target === PUBLIC_ROUTE ? 'public' : 'personal');
    shell.setScene(target);
    const body = bodyFor(target);
    shell.body.replaceChildren(body);
    if (Object.hasOwn(PROGRAM_ROUTES, target)) {
      // External header navigation must also select the category on the cached scene.
      selectProgramsCategory(body, PROGRAM_ROUTES[target]);
      // 返回节目场景时刷新已打开详情的续播 / 追剧状态（详情未打开是空操作）。
      refreshProgramDetail(body);
    }
    if (target === SEARCH_ROUTE) {
      // Search focus is only valid after the body is connected to the mounted shell.
      focusProgramsSearch(body);
      refreshProgramDetail(body);
    }
    if (pendingProgramDetail && Object.hasOwn(PROGRAM_ROUTES, target)) {
      // 首页指向未接入片源的节目：进入目录后打开其示例详情，给出明确的不可播反馈。
      openProgramDetail(body, pendingProgramDetail);
      pendingProgramDetail = null;
    }
    if (target === 'video') {
      // 只有从节目目录 / 搜索进入时才提供「返回节目详情」，并记住原路由以恢复详情状态。
      const fromPrograms =
        previous !== null && (Object.hasOwn(PROGRAM_ROUTES, previous) || previous === SEARCH_ROUTE);
      applyVideoWatchSelection(body, { returnRoute: fromPrograms ? previous : null });
    }
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
