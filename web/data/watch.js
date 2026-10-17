/**
 * 「示例播放进度 / 追剧收藏」的本地状态（V02 · Issue #10）。
 *
 * 这是**唯一**保存观看进度与追剧收藏的模块，与主题偏好（`preferences.js`）分开：
 * 进度与收藏是个人数据，只在个人设备上写入浏览器本地存储；主题偏好是外观选择，
 * 两者不混存，也不进 `data/api.js` 的内容数据出口。
 *
 * 边界（AGENTS.md 第 5 条、design.md §4、Issue #10）：
 * - 存储不可用（隐私模式 / 禁用 / 配额满 / 值非法）时退回**当前页面内存**，并如实返回
 *   `persisted: false`，由界面给出清晰回退提示；不抛错、不白屏、不静默假装已保存；
 * - 这里保存的是 **S1 示例进度**：不冒充真实播放时间、版权片源或跨设备账户同步，
 *   因此不记录时间戳、不参与任何服务端同步；
 * - 当前观看会话（选中的节目 / 集 / 返回路由）是**会话内**状态，不写入存储。
 * - 公共设备不得读取个人进度/收藏：调用方只在个人模式注入本模块（见 `web/assets/app.js`）。
 */
import { resolveSafeStorage } from './preferences.js';

/** localStorage 中保存观看进度与收藏的键。 */
export const WATCH_STATE_KEY = 'jianqu.watch-state';

/** 示例进度的调整步长（百分比），供播放器「前进 / 后退」动作复用。 */
export const PROGRESS_STEP = 10;

/** @returns {{ favorites: Record<string, boolean>, progress: Record<string, Record<string, number>>, resume: Record<string, string> }} */
function emptyState() {
  return { favorites: {}, progress: {}, resume: {} };
}

/**
 * @param {Storage | null | undefined} storage
 * @returns {{ favorites: Record<string, boolean>, progress: Record<string, Record<string, number>>, resume: Record<string, string> }}
 */
function readState(storage) {
  if (!storage) return emptyState();
  try {
    const raw = storage.getItem(WATCH_STATE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    const state = emptyState();
    if (parsed && typeof parsed === 'object') {
      if (parsed.favorites && typeof parsed.favorites === 'object') {
        state.favorites = { ...parsed.favorites };
      }
      if (parsed.progress && typeof parsed.progress === 'object') {
        state.progress = { ...parsed.progress };
      }
      if (parsed.resume && typeof parsed.resume === 'object') {
        state.resume = { ...parsed.resume };
      }
    }
    return state;
  } catch {
    // 值非法或读取被拒：当作没有记录，而不是让页面崩掉。
    return emptyState();
  }
}

/**
 * @typedef {object} WatchSelection
 * @property {string} programId
 * @property {string} episodeId
 *
 * @typedef {object} WatchProgress
 * @property {string} episodeId
 * @property {number} percent
 *
 * @typedef {object} WatchLibrary
 * @property {boolean} available 本地存储是否可用（可用≠已有记录）
 * @property {(programId: string) => boolean} isFavorite
 * @property {(programId: string) => { favorite: boolean, persisted: boolean }} toggleFavorite
 * @property {(programId: string, episodeId: string) => number | null} getProgress
 * @property {(programId: string, episodeId: string, percent: number) => { percent: number, persisted: boolean }} saveProgress
 * @property {(programId: string) => WatchProgress | null} getResume
 * @property {(selection: WatchSelection | null) => void} setSelection
 * @property {() => WatchSelection | null} getSelection
 */

/**
 * 创建观看进度 / 收藏访问器。`storage` 可注入，便于测试与设备模式切换；
 * 传入 `null` 时只保留当前页面内存，界面据此给出「无法保存」的回退提示。
 * @param {Storage | null} [storage]
 * @returns {WatchLibrary}
 */
export function createWatchLibrary(storage = resolveSafeStorage()) {
  let state = readState(storage);
  /** @type {WatchSelection | null} */
  let selection = null;

  /** @returns {boolean} 是否真的写入成功。 */
  function persist() {
    if (!storage) return false;
    try {
      storage.setItem(WATCH_STATE_KEY, JSON.stringify(state));
      return true;
    } catch {
      return false;
    }
  }

  /** @param {string} programId */
  function isFavorite(programId) {
    return state.favorites[programId] === true;
  }

  /** @param {string} programId */
  function toggleFavorite(programId) {
    const favorite = !isFavorite(programId);
    if (favorite) state.favorites[programId] = true;
    else delete state.favorites[programId];
    return { favorite, persisted: persist() };
  }

  /**
   * @param {string} programId
   * @param {string} episodeId
   * @returns {number | null}
   */
  function getProgress(programId, episodeId) {
    const value = state.progress[programId]?.[episodeId];
    return typeof value === 'number' ? value : null;
  }

  /**
   * @param {string} programId
   * @param {string} episodeId
   * @param {number} percent
   */
  function saveProgress(programId, episodeId, percent) {
    const clamped = Math.max(0, Math.min(100, Math.round(percent)));
    if (!state.progress[programId]) state.progress[programId] = {};
    state.progress[programId][episodeId] = clamped;
    state.resume[programId] = episodeId;
    return { percent: clamped, persisted: persist() };
  }

  /** @param {string} programId @returns {WatchProgress | null} */
  function getResume(programId) {
    const episodeId = state.resume[programId];
    if (!episodeId) return null;
    return { episodeId, percent: getProgress(programId, episodeId) ?? 0 };
  }

  return {
    available: Boolean(storage),
    isFavorite,
    toggleFavorite,
    getProgress,
    saveProgress,
    getResume,
    setSelection: (next) => {
      selection =
        next && next.programId && next.episodeId
          ? { programId: next.programId, episodeId: next.episodeId }
          : null;
    },
    getSelection: () => (selection ? { ...selection } : null),
  };
}
