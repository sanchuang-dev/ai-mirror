/**
 * AI 趣玩 C02 作品结果场景正文（复用共享场景壳）：
 * 预生成示例作品 → 默认仅自己可见 → 保存（本机演示）→ 选择分享对象 → 二次确认 / 取消。
 *
 * 单套 DOM + 单套状态：A「日光客厅」/ B「暖夜剧场」只改 `tokens.css` 变量，不复制页面，
 * 也不为 A/B 各写一份流程；切换主题不重建本场景，因此保存 / 分享的演示状态都保留。
 *
 * 边界（Issue #12 · C02 / design.md §5 的「AI 趣玩」组）：
 * - 展示的是**预生成示例作品**（公开授权示意图），页面明确标注「非真实 AI 生成」；
 *   不接真实模型、不上传、不把私有媒体交给「分享接收方」。
 * - 作品默认**仅自己可见**；分享对象是**虚构演示联系人**，确认后只在页面上显示
 *   「模拟已分享给 XX」与演示态可见范围，**绝不伪造真实发送或网络回执**；
 *   取消 / 未确认不会改变私密状态，也不会发送任何消息。
 * - 交接数据来自 `data/creation-draft.js`（仅内存、不含本机图片字节 / 文件名 / 对象地址）。
 */
import { createMedia, createNode, createRouteButton } from '../components/kit.js';
import { readCreationDraft } from '../data/creation-draft.js';

/** @typedef {import('../data/fixtures/creation-result.fixture.js').CreationResultFixture} CreationResultContent */
/** @typedef {import('../data/fixtures/creation-result.fixture.js').CreationResultArtwork} CreationResultArtwork */
/** @typedef {import('../data/fixtures/creation-result.fixture.js').CreationResultContact} CreationResultContact */

/**
 * @typedef {object} CreationResultOptions
 * @property {() => void} [onRestart] 再做一次：回到创作第 1 步并重新开始。
 * @property {() => void} [onReturnToCreation] 返回创作：回到 C01 当前步骤。
 * @property {() => void} [onDiscard] 放弃这次创作：不保存、不分享，直接离开。
 */

/**
 * 结果页状态：保存与分享都只是**页面内**演示态，从不写入存储或发送。
 * @param {Document} documentRef
 * @param {CreationResultContent} content
 * @param {(route: string) => void} activate 共享壳的统一入口动作（返回首页用）。
 * @param {CreationResultOptions} [options]
 * @returns {HTMLElement}
 */
export function renderCreationResultBody(documentRef, content, activate, options = {}) {
  const body = createNode(documentRef, 'div', 'jq-scene jq-scene--create-result');
  const draft = readCreationDraft();
  const artwork = resolveArtwork(content, draft);

  const state = {
    saved: false,
    /** @type {string | null} */
    contactId: null,
    /** @type {string | null} */
    sharedTo: null,
  };

  // ---------- 场景头：返回首页 + 标题 + 示例边界 ----------
  const head = createNode(documentRef, 'header', 'jq-scene__head');
  const titleBlock = createNode(documentRef, 'div', 'jq-scene__title');
  titleBlock.append(
    createNode(documentRef, 'h1', 'jq-scene__h1', content.title),
    createNode(documentRef, 'p', 'jq-scene__demo', content.demo.notice),
  );
  head.append(
    createRouteButton(documentRef, 'jq-scene__back', '‹ 返回首页', 'home', activate),
    titleBlock,
  );
  body.append(head);

  // 结果页最显眼的诚实标注：这是预生成示例作品，不是真实 AI 生成。
  const badge = createNode(documentRef, 'p', 'jq-result__badge', content.demo.badge);
  body.append(badge);

  // ---------- 流程反馈（保存 / 取消 / 确认都有明确说明） ----------
  const feedback = createNode(documentRef, 'p', 'jq-result__feedback');
  feedback.setAttribute('role', 'status');
  feedback.setAttribute('aria-live', 'polite');
  feedback.hidden = true;
  body.append(feedback);

  /** @param {string} message */
  function setFeedback(message) {
    feedback.textContent = message;
    feedback.hidden = message.length === 0;
  }

  // ---------- 作品结果：看得见的示意图，不是空白占位 ----------
  const layout = createNode(documentRef, 'div', 'jq-result');
  const card = createNode(documentRef, 'article', 'jq-panel jq-result__artwork');
  const media = createMedia(documentRef, {
    tone: artwork.tone,
    image: artwork.image,
    imageAlt: artwork.imageAlt,
    title: artwork.title,
  });
  media.append(createNode(documentRef, 'span', 'jq-result__watermark', content.demo.badge));
  const meta = createNode(documentRef, 'div', 'jq-result__meta');
  meta.append(
    createNode(documentRef, 'h2', 'jq-result__name', artwork.title),
    createNode(documentRef, 'p', 'jq-result__origin', describeSelection(content, draft)),
    createNode(documentRef, 'p', 'jq-result__note', content.artworkNote),
  );
  card.append(media, meta);

  // ---------- 私密默认 + 保存（本机演示） ----------
  const aside = createNode(documentRef, 'div', 'jq-result__aside');

  const privacyCard = createNode(documentRef, 'section', 'jq-result__card jq-result__privacy');
  privacyCard.setAttribute('aria-labelledby', 'jq-result-privacy-title');
  const privacyTitle = createNode(documentRef, 'h2', 'jq-result__h2', content.privacy.title);
  privacyTitle.setAttribute('id', 'jq-result-privacy-title');
  const scope = createNode(documentRef, 'p', 'jq-result__scope');
  scope.setAttribute('data-scope', 'visibility');
  const saveButton = /** @type {HTMLButtonElement} */ (
    createNode(documentRef, 'button', 'jq-btn jq-btn--primary')
  );
  saveButton.setAttribute('type', 'button');
  saveButton.setAttribute('data-action', 'save');
  saveButton.textContent = content.privacy.saveCta;
  saveButton.addEventListener('click', () => {
    // 只在本页演示：不改可见范围、不上传、不写入本机存储。
    state.saved = true;
    updateSaveState();
    setFeedback(content.messages.saved);
  });
  privacyCard.append(
    privacyTitle,
    scope,
    saveButton,
    createNode(documentRef, 'p', 'jq-result__note', content.privacy.note),
  );

  // ---------- 分享范围：先选对象，再二次确认 ----------
  const shareCard = createNode(documentRef, 'section', 'jq-result__card jq-result__share');
  shareCard.setAttribute('aria-labelledby', 'jq-result-share-title');
  const shareTitle = createNode(documentRef, 'h2', 'jq-result__h2', content.share.title);
  shareTitle.setAttribute('id', 'jq-result-share-title');
  const contacts = createNode(documentRef, 'div', 'jq-result__contacts');
  contacts.setAttribute('role', 'group');
  contacts.setAttribute('aria-label', content.share.title);

  /** @type {Array<{ contact: CreationResultContact, node: HTMLButtonElement }>} */
  const contactButtons = content.contacts.map((contact) => {
    const node = /** @type {HTMLButtonElement} */ (
      createNode(documentRef, 'button', 'jq-result__contact')
    );
    node.setAttribute('type', 'button');
    node.setAttribute('data-contact', contact.id);
    node.setAttribute('aria-pressed', 'false');
    const avatar = createNode(documentRef, 'span', 'jq-result__avatar', contact.avatarText);
    avatar.setAttribute('aria-hidden', 'true');
    const label = createNode(documentRef, 'span', 'jq-result__contact-body');
    label.append(
      createNode(
        documentRef,
        'span',
        'jq-result__contact-name',
        contact.relation + ' · ' + contact.name,
      ),
      createNode(documentRef, 'span', 'jq-result__contact-demo', contact.demo),
    );
    node.append(avatar, label);
    node.addEventListener('click', () => pickContact(contact));
    contacts.append(node);
    return { contact, node };
  });

  // 二次确认（选择对象后才出现，取消不改变私密状态）。
  const confirm = createNode(documentRef, 'div', 'jq-result__confirm');
  confirm.hidden = true;
  const confirmTitle = createNode(documentRef, 'p', 'jq-result__h3', content.share.confirmTitle);
  const confirmBody = createNode(documentRef, 'p', 'jq-result__note');
  const confirmButton = /** @type {HTMLButtonElement} */ (
    createNode(documentRef, 'button', 'jq-btn jq-btn--primary')
  );
  confirmButton.setAttribute('type', 'button');
  confirmButton.setAttribute('data-action', 'confirm-share');
  confirmButton.textContent = content.share.confirmCta;
  confirmButton.addEventListener('click', confirmShare);
  const cancelButton = /** @type {HTMLButtonElement} */ (
    createNode(documentRef, 'button', 'jq-btn jq-btn--ghost')
  );
  cancelButton.setAttribute('type', 'button');
  cancelButton.setAttribute('data-action', 'cancel-share');
  cancelButton.textContent = content.share.cancelCta;
  cancelButton.addEventListener('click', cancelShare);
  const confirmActions = createNode(documentRef, 'div', 'jq-result__actions-inline');
  confirmActions.append(confirmButton, cancelButton);
  confirm.append(confirmTitle, confirmBody, confirmActions);

  // 确认后的演示态结果（只在本页显示，不伪造真实发送 / 网络回执）。
  const shared = createNode(documentRef, 'div', 'jq-result__shared');
  shared.hidden = true;
  const sharedTitle = createNode(documentRef, 'p', 'jq-result__h3');
  const sharedScope = createNode(documentRef, 'p', 'jq-result__scope');
  sharedScope.setAttribute('data-scope', 'shared');
  const unshareButton = /** @type {HTMLButtonElement} */ (
    createNode(documentRef, 'button', 'jq-btn jq-btn--ghost jq-btn--sm')
  );
  unshareButton.setAttribute('type', 'button');
  unshareButton.setAttribute('data-action', 'unshare');
  unshareButton.textContent = content.share.unshareCta;
  unshareButton.addEventListener('click', unshare);
  shared.append(
    sharedTitle,
    sharedScope,
    createNode(documentRef, 'p', 'jq-result__note', content.share.sharedNote),
    unshareButton,
  );

  shareCard.append(
    shareTitle,
    createNode(documentRef, 'p', 'jq-result__note', content.share.note),
    contacts,
    confirm,
    shared,
  );

  aside.append(privacyCard, shareCard);
  layout.append(card, aside);
  body.append(layout);

  // ---------- 简单路径：再做一次 / 返回创作 / 放弃 ----------
  const actions = createNode(documentRef, 'div', 'jq-result__actions');
  const restartButton = createButton(content.actions.restart, 'jq-btn--primary');
  restartButton.setAttribute('data-action', 'restart');
  restartButton.addEventListener('click', () => call(options.onRestart));
  const backButton = createButton(content.actions.backToCreation, 'jq-btn--ghost');
  backButton.setAttribute('data-action', 'back-to-create');
  backButton.addEventListener('click', () => call(options.onReturnToCreation));
  const discardButton = createButton(content.actions.discard, 'jq-btn--ghost');
  discardButton.setAttribute('data-action', 'discard');
  discardButton.addEventListener('click', () => call(options.onDiscard));
  actions.append(restartButton, backButton, discardButton);
  body.append(actions);

  /** @param {string} label @param {string} modifier @returns {HTMLButtonElement} */
  function createButton(label, modifier) {
    const node = /** @type {HTMLButtonElement} */ (
      createNode(documentRef, 'button', 'jq-btn ' + modifier)
    );
    node.setAttribute('type', 'button');
    node.textContent = label;
    return node;
  }

  /** @param {(() => void) | undefined} handler */
  function call(handler) {
    if (typeof handler === 'function') handler();
  }

  /** @param {CreationResultContact} contact */
  function pickContact(contact) {
    if (state.sharedTo) return; // 已经模拟分享：先取消分享再改对象。
    state.contactId = contact.id;
    confirmBody.textContent = content.share.confirmBody.replace('{name}', contact.name);
    confirm.hidden = false;
    shared.hidden = true;
    updateContactSelection();
    setFeedback(content.messages.contactPicked);
  }

  /** 取消二次确认：不改变私密状态、不发送任何消息。 */
  function cancelShare() {
    state.contactId = null;
    confirm.hidden = true;
    updateContactSelection();
    setFeedback(content.messages.shareCancelled);
  }

  /** 确认分享：仅更新页面上的演示态可见范围。 */
  function confirmShare() {
    const selected = contactButtons.find((entry) => entry.contact.id === state.contactId);
    if (!selected) return;
    state.sharedTo = selected.contact.name;
    confirm.hidden = true;
    sharedTitle.textContent = content.share.sharedTitle.replace('{name}', state.sharedTo);
    sharedScope.textContent = content.share.sharedScope.replace('{name}', state.sharedTo);
    shared.hidden = false;
    updateContactSelection();
    updateVisibility();
    setFeedback(content.messages.shared);
  }

  /** 取消分享：恢复为仅自己可见，并清除演示态分享对象。 */
  function unshare() {
    state.sharedTo = null;
    state.contactId = null;
    shared.hidden = true;
    updateContactSelection();
    updateVisibility();
    setFeedback(content.messages.unshared);
  }

  function updateContactSelection() {
    for (const entry of contactButtons) {
      entry.node.setAttribute(
        'aria-pressed',
        entry.contact.id === state.contactId ? 'true' : 'false',
      );
    }
  }

  function updateSaveState() {
    saveButton.hidden = state.saved;
    saveButton.textContent = state.saved ? content.privacy.savedLabel : content.privacy.saveCta;
  }

  /** 可见范围只反映演示态分享结果；默认始终是「仅自己可见」。 */
  function updateVisibility() {
    scope.textContent = state.sharedTo
      ? content.share.sharedScope.replace('{name}', state.sharedTo)
      : content.privacy.defaultLabel;
  }

  updateSaveState();
  updateContactSelection();
  updateVisibility();

  return body;
}

/**
 * 主题 → 预生成示例作品；非默认主题共用同一套示例结果结构，不铺开多个生成引擎。
 * @param {CreationResultContent} content
 * @param {import('../data/creation-draft.js').CreationDraft | null} draft
 * @returns {CreationResultArtwork}
 */
function resolveArtwork(content, draft) {
  const key = draft ? draft.themeId : '';
  return content.artworks[key] ?? content.fallbackArtwork;
}

/**
 * 「来自你的选择」：只显示主题 / 素材来源类别，不暴露本机图片内容或文件名。
 * @param {CreationResultContent} content
 * @param {import('../data/creation-draft.js').CreationDraft | null} draft
 * @returns {string}
 */
function describeSelection(content, draft) {
  if (!draft) return content.selectLabel + '：未收到创作选择（示例作品）。';
  const theme = draft.themeTitle ? '主题「' + draft.themeTitle + '」' : '未选主题';
  const sourceKey = draft.sourceKind ?? 'none';
  const source = content.sourceLabels[sourceKey] ?? content.sourceLabels.none;
  const sample =
    draft.sourceKind === 'example' && draft.sampleTitle ? ' · ' + draft.sampleTitle : '';
  return content.selectLabel + '：' + theme + ' · ' + source + sample;
}
