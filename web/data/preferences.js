/**
 * 外观主题个人偏好的本地持久化（T02 · Issue #7）。
 *
 * 这是**外观主题偏好**的唯一读写模块：页面与组件不得各自散落 localStorage 逻辑，
 * 也不得把主题偏好混进 `data/api.js` 的业务数据出口（ENG-01 §4 管的是内容数据）。
 * 观看进度 / 追剧收藏是另一类个人数据，见 `web/data/watch.js`；本模块只负责主题。
 *
 * 边界（design.md §4、frontend-baseline §3）：
 * - 只保存用户本人的 A/B 外观选择；不保存内容、记忆、身份或任何业务数据；
 * - 公共设备默认主题与访客能否修改由设备部署规则另行确认：本模块不提供管理员入口，
 *   也不把个人偏好伪装成公共设备设置；调用方只有在个人会话下才应接入它；
 * - 存储缺失、被禁用、配额溢出或值非法时返回 null / false，让调用方给出清晰回退，
 *   不抛错、不白屏。
 *
 * `?dir=a|b` 是既有评审/截图参数，与个人偏好的优先级见 `resolveInitialTheme`。
 */

/** localStorage 中保存个人主题偏好的键。 */
export const THEME_PREFERENCE_KEY = 'jianqu.theme-preference';

/** 允许的外观主题取值，与 tokens.css 的 `[data-dir]` 一一对应。 */
export const THEME_CHOICES = ['a', 'b'];

/**
 * @param {unknown} value
 * @returns {value is 'a' | 'b'}
 */
export function isThemeChoice(value) {
  return value === 'a' || value === 'b';
}

/**
 * 读取可用的 localStorage。隐私模式或禁用存储时访问属性本身就可能抛错，故包一层。
 * @returns {Storage | null}
 */
export function resolveSafeStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/**
 * @param {Storage | null | undefined} storage
 * @returns {'a' | 'b' | null} 合法偏好，或 null（无存储 / 无偏好 / 值非法 / 读取失败）
 */
export function readStoredTheme(storage) {
  if (!storage) return null;
  try {
    const raw = storage.getItem(THEME_PREFERENCE_KEY);
    return isThemeChoice(raw) ? raw : null;
  } catch {
    return null;
  }
}

/**
 * @param {Storage | null | undefined} storage
 * @param {'a' | 'b'} theme
 * @returns {boolean} 是否真的写入成功（失败时调用方须给出回退提示）
 */
export function writeStoredTheme(storage, theme) {
  if (!storage || !isThemeChoice(theme)) return false;
  try {
    storage.setItem(THEME_PREFERENCE_KEY, theme);
    return true;
  } catch {
    return false;
  }
}

/**
 * @typedef {object} ThemePreferences
 * @property {boolean} available 存储是否可用（可用≠已有偏好）
 * @property {() => ('a' | 'b' | null)} read
 * @property {(theme: 'a' | 'b') => boolean} save
 */

/**
 * 个人主题偏好访问器。`storage` 可注入，便于测试与未来的设备模式切换。
 * @param {Storage | null} [storage]
 * @returns {ThemePreferences}
 */
export function createThemePreferences(storage = resolveSafeStorage()) {
  return {
    available: Boolean(storage),
    read: () => readStoredTheme(storage),
    save: (theme) => writeStoredTheme(storage, theme),
  };
}

/**
 * 初始主题优先级（T02 明确契约）：
 * 1. **个人已保存偏好**：用户显式选择过，刷新后必须保持，即使 URL 还带着旧参数；
 * 2. 既有 `?dir=a|b` 评审/截图参数：仅在**没有个人偏好**时生效，且不写入存储，
 *    这样评审可用 URL 直接对照 A/B，而用户的选择不会被下一次评审参数顶掉；
 * 3. 默认 `a`（日光客厅）。
 *
 * 任一来源非法（非 a/b）都被忽略，回落到下一优先级，保证不白屏。
 * @param {{ stored?: unknown, param?: unknown }} [sources]
 * @returns {'a' | 'b'}
 */
export function resolveInitialTheme(sources = {}) {
  if (isThemeChoice(sources.stored)) return sources.stored;
  if (isThemeChoice(sources.param)) return sources.param;
  return 'a';
}
