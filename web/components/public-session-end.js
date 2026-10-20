/**
 * 公共终端「结束体验并清除」入口、二次确认面板与示例空闲超时入口（X01 · Issue #19）。
 *
 * 公共设备上的体验是**访客临时状态**：示例对话、素材、作品草稿、活动筛选 / 详情 /
 * 报名接力都只存在于当前页面会话。这个组件只负责把「怎么结束」讲清楚、把确认和取消
 * 分开、并把模拟空闲超时放进同一条清理入口；真正的清理由调用方在 `onEnd` 中执行，
 * 且主动结束与模拟超时使用同一个回调，避免出现两套清理规则。
 *
 * 边界：
 * - 只清理当前页面会话，**不**声称已清理设备缓存、系统账号、摄像头 / 麦克风；
 * - 不读写 localStorage / sessionStorage，不发起网络请求；
 * - 公共设备与个人设备上的「社区版预览」共用同一套结构和 A/B token。
 */
import { createNode } from './kit.js';

/** 面板与入口文案集中在一处，避免入口、确认层和结果反馈各写一套。 */
export const PUBLIC_SESSION_END_COPY = {
  entryCta: '结束体验并清除',
  eyebrow: '公共终端 · 访客隐私',
  title: '结束本次体验并清除？',
  note: '确认后会立即清除本次演示留下的临时内容，并回到公共首页。',
  clearTitle: '会清除本次访客的临时内容',
  clearItems: [
    'AI 趣玩、示例对话与临时展示',
    '已选素材、预览与本机临时地址',
    '临时作品草稿与分享演示状态',
    '活动筛选、详情与报名接力草稿',
    '示例购物车与各场景停留位置',
  ],
  keepNote: '不会保存账户记忆，也不会把任何内容留给下一位使用者。',
  deviceNote: '设备级缓存、系统账号与摄像头 / 麦克风复位尚未接入；本演示只清理当前页面会话。',
  cancelCta: '取消，继续体验',
  timeoutCta: '模拟空闲超时',
  timeoutNote: '模拟长时间无操作后自动回到公共首页；它与主动结束使用同一清理规则。',
  confirmCta: '确认结束并清除',
  clearedNotice: '已结束本次公共体验并清除临时内容。下一位使用者将从干净的公共首页重新开始。',
  timeoutNotice: '已模拟空闲超时：按同一清理规则清除临时内容，并回到公共首页。',
};

/** @typedef {'manual' | 'timeout'} PublicSessionEndReason */

/**
 * @typedef {object} PublicSessionEndOptions
 * @property {(reason: PublicSessionEndReason) => void} [onEnd] 主动结束 / 模拟超时共用的清理回调。
 * @property {(open: boolean) => void} [onOpenChange] 打开 / 关闭时同步背景 inert。
 */

/**
 * @typedef {object} PublicSessionEndSurface
 * @property {HTMLButtonElement} entry 公共顶栏里的结束入口（滚动区之外）。
 * @property {HTMLElement} overlay 二次确认与示例空闲超时面板（默认隐藏）。
 * @property {() => void} open
 * @property {(restoreFocus?: boolean) => void} close
 * @property {() => boolean} isOpen
 */

/**
 * 构建入口与确认面板；只返回 DOM 和动作，不做全局副作用。
 * @param {Document} documentRef
 * @param {PublicSessionEndOptions} [options]
 * @returns {PublicSessionEndSurface}
 */
export function createPublicSessionEnd(documentRef, options = {}) {
  const onEnd = options.onEnd ?? (() => {});
  const onOpenChange = options.onOpenChange ?? (() => {});
  /** @type {HTMLElement | null} */
  let lastFocused = null;

  // ---------- 顶栏入口：由共享壳放入公共顶栏，滚动区之外始终可见 ----------
  const entry = /** @type {HTMLButtonElement} */ (
    createNode(documentRef, 'button', 'jq-session-end-entry', PUBLIC_SESSION_END_COPY.entryCta)
  );
  entry.setAttribute('type', 'button');
  entry.setAttribute('data-action', 'public-session-end');
  entry.setAttribute('aria-haspopup', 'dialog');
  entry.setAttribute('aria-controls', 'jq-session-end-dialog');
  entry.hidden = true;
  entry.addEventListener('click', () => open());

  // ---------- 二次确认面板 ----------
  const overlay = createNode(documentRef, 'div', 'jq-session-end');
  overlay.setAttribute('id', 'jq-session-end-dialog');
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'jq-session-end-title');
  overlay.setAttribute('aria-describedby', 'jq-session-end-note');
  overlay.hidden = true;

  const panel = createNode(documentRef, 'div', 'jq-session-end__panel');
  const head = createNode(documentRef, 'header', 'jq-session-end__head');
  const title = createNode(
    documentRef,
    'h2',
    'jq-session-end__title',
    PUBLIC_SESSION_END_COPY.title,
  );
  title.setAttribute('id', 'jq-session-end-title');
  const note = createNode(documentRef, 'p', 'jq-session-end__note', PUBLIC_SESSION_END_COPY.note);
  note.setAttribute('id', 'jq-session-end-note');
  head.append(
    createNode(documentRef, 'p', 'jq-session-end__eyebrow', PUBLIC_SESSION_END_COPY.eyebrow),
    title,
    note,
  );

  const clearSection = createNode(documentRef, 'section', 'jq-session-end__section');
  clearSection.append(
    createNode(
      documentRef,
      'h3',
      'jq-session-end__section-title',
      PUBLIC_SESSION_END_COPY.clearTitle,
    ),
  );
  const list = createNode(documentRef, 'ul', 'jq-session-end__list');
  for (const item of PUBLIC_SESSION_END_COPY.clearItems) {
    list.append(createNode(documentRef, 'li', 'jq-session-end__list-item', item));
  }
  clearSection.append(list);

  const keepNote = createNode(
    documentRef,
    'p',
    'jq-session-end__keep',
    PUBLIC_SESSION_END_COPY.keepNote,
  );
  const deviceNote = createNode(
    documentRef,
    'p',
    'jq-session-end__device',
    PUBLIC_SESSION_END_COPY.deviceNote,
  );

  // 模拟空闲超时是演示入口，不与「确认结束」混成同一个按钮；两者最终调用同一个 onEnd。
  const timeout = createNode(
    documentRef,
    'button',
    'jq-btn jq-btn--ghost jq-session-end__timeout',
    PUBLIC_SESSION_END_COPY.timeoutCta,
  );
  timeout.setAttribute('type', 'button');
  timeout.setAttribute('data-action', 'public-session-end-timeout');
  timeout.addEventListener('click', () => finish('timeout'));
  const timeoutNote = createNode(
    documentRef,
    'p',
    'jq-session-end__timeout-note',
    PUBLIC_SESSION_END_COPY.timeoutNote,
  );

  const cancel = createNode(
    documentRef,
    'button',
    'jq-btn jq-btn--ghost jq-session-end__cancel',
    PUBLIC_SESSION_END_COPY.cancelCta,
  );
  cancel.setAttribute('type', 'button');
  cancel.setAttribute('data-action', 'public-session-end-cancel');
  cancel.addEventListener('click', () => close());
  const confirm = createNode(
    documentRef,
    'button',
    'jq-btn jq-btn--primary jq-session-end__confirm',
    PUBLIC_SESSION_END_COPY.confirmCta,
  );
  confirm.setAttribute('type', 'button');
  confirm.setAttribute('data-action', 'public-session-end-confirm');
  confirm.addEventListener('click', () => finish('manual'));
  const actions = createNode(documentRef, 'div', 'jq-session-end__actions');
  actions.append(cancel, confirm);

  const timeoutBlock = createNode(documentRef, 'div', 'jq-session-end__demo');
  timeoutBlock.append(timeout, timeoutNote);

  panel.append(head, clearSection, keepNote, deviceNote, timeoutBlock, actions);
  overlay.append(panel);

  overlay.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    }
  });
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) close();
  });

  /** @returns {boolean} */
  function isOpen() {
    return !overlay.hidden;
  }

  function open() {
    if (isOpen()) return;
    lastFocused = /** @type {HTMLElement | null} */ (documentRef.activeElement ?? null);
    overlay.hidden = false;
    onOpenChange(true);
    if (typeof cancel.focus === 'function') cancel.focus();
  }

  /** @param {boolean} [restoreFocus] */
  function close(restoreFocus = true) {
    if (!isOpen()) return;
    overlay.hidden = true;
    onOpenChange(false);
    const target = lastFocused ?? entry;
    if (restoreFocus && target && typeof target.focus === 'function') target.focus();
    lastFocused = null;
  }

  /** @param {PublicSessionEndReason} reason */
  function finish(reason) {
    close(false);
    onEnd(reason);
  }

  return { entry, overlay, open, close, isOpen };
}
