/**
 * A01 AI 伙伴场景正文（复用共享场景壳）。
 *
 * 单套 DOM + 单套数据：A/B 主题只改 CSS 变量。这里的对话是**预设示例**，
 * 输入框发送只回显用户自己的话并明确标注「真实 AI 尚未接入」，不伪造 AI 生成结果。
 * 说话方式选择、输入内容、已发送的回显都会随共享壳保留，切主题或返回首页不丢失。
 */
import { createMedia, createNode, createRouteButton } from '../components/kit.js';

/** @typedef {import('../data/fixtures/ai.fixture.js').AiFixture} AiContent */
/** @typedef {import('../data/fixtures/ai.fixture.js').AiStreamItem} AiStreamItem */

/**
 * @param {Document} documentRef
 * @param {AiContent} content
 * @param {(route: string) => void} activate
 * @returns {HTMLElement}
 */
export function renderAiBody(documentRef, content, activate) {
  const body = createNode(documentRef, 'div', 'jq-scene jq-scene--ai');
  const grid = createNode(documentRef, 'div', 'jq-ai-grid');

  // ---------- 左侧：小暖存在感 ----------
  const presence = createNode(documentRef, 'aside', 'jq-ai-presence');
  const orb = createNode(documentRef, 'span', 'jq-orb jq-orb--lg');
  orb.setAttribute('aria-hidden', 'true');
  presence.append(
    createRouteButton(documentRef, 'jq-scene__back', '‹ 返回首页', 'home', activate),
    orb,
    createNode(documentRef, 'h1', 'jq-ai-name', content.name),
    createNode(documentRef, 'p', 'jq-ai-role', content.role),
  );

  const wave = createNode(documentRef, 'div', 'jq-wave');
  wave.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 7; i += 1) wave.append(createNode(documentRef, 'i'));
  presence.append(wave);

  const status = createNode(documentRef, 'div', 'jq-ai-status');
  status.append(
    createNode(documentRef, 'span', 'jq-chip', content.statusLabel),
    createNode(documentRef, 'p', 'jq-ai-status__text', content.statusText),
  );
  presence.append(status);

  const styles = createNode(documentRef, 'div', 'jq-ai-styles');
  styles.setAttribute('role', 'group');
  styles.setAttribute('aria-label', '说话方式');
  styles.append(createNode(documentRef, 'p', 'jq-ai-styles__label', '说话方式'));
  /** @type {HTMLButtonElement[]} */
  const styleChips = content.styles.map((label, index) => {
    const chip = /** @type {HTMLButtonElement} */ (
      createNode(documentRef, 'button', 'jq-stylechip', label)
    );
    chip.setAttribute('type', 'button');
    chip.setAttribute('aria-pressed', index === 0 ? 'true' : 'false');
    chip.addEventListener('click', () => {
      for (const sibling of styleChips) sibling.setAttribute('aria-pressed', 'false');
      chip.setAttribute('aria-pressed', 'true');
    });
    styles.append(chip);
    return chip;
  });
  presence.append(styles);
  grid.append(presence);

  // ---------- 右侧：对话流 + 快捷入口 + 输入 ----------
  const stream = createNode(documentRef, 'section', 'jq-ai-stream');
  stream.setAttribute('aria-label', '与小暖的对话（示例）');
  const messages = createNode(documentRef, 'div', 'jq-ai-messages');
  messages.append(createNode(documentRef, 'p', 'jq-scene__demo', content.demo.notice));
  for (const item of content.stream) messages.append(renderStreamItem(documentRef, item, activate));
  stream.append(messages);

  const quick = createNode(documentRef, 'div', 'jq-ai-quick');
  for (const label of content.quick) {
    quick.append(createRouteButton(documentRef, 'jq-qchip', label, 'search', activate));
  }
  stream.append(quick);

  const input = createNode(documentRef, 'div', 'jq-ai-input');
  const field = /** @type {HTMLInputElement} */ (
    createNode(documentRef, 'input', 'jq-ai-input__field')
  );
  field.setAttribute('type', 'text');
  field.setAttribute('placeholder', content.inputHint);
  field.setAttribute('aria-label', '给小暖说话（示例演示）');
  field.value = '';
  const send = createNode(documentRef, 'button', 'jq-ai-send', content.sendLabel);
  send.setAttribute('type', 'button');
  send.addEventListener('click', () => {
    const text = field.value ?? '';
    if (!text.trim()) {
      activate('ai');
      return;
    }
    // 只回显用户自己输入的话，并明确标注真实 AI 尚未接入，不生成任何 AI 内容。
    const echo = createNode(documentRef, 'div', 'jq-bubble jq-bubble--user');
    echo.append(createNode(documentRef, 'p', '', text));
    const notice = createNode(
      documentRef,
      'p',
      'jq-ai-input__notice',
      '示例演示：真实 AI 回复尚未接入，这里只回显你的输入。',
    );
    messages.append(echo, notice);
    field.value = '';
  });
  input.append(field, send);
  stream.append(input);
  grid.append(stream);

  body.append(grid);
  return body;
}

/**
 * @param {Document} documentRef
 * @param {AiStreamItem} item
 * @param {(route: string) => void} activate
 * @returns {HTMLElement}
 */
function renderStreamItem(documentRef, item, activate) {
  if (item.type === 'user') {
    const bubble = createNode(documentRef, 'div', 'jq-bubble jq-bubble--user');
    bubble.append(createNode(documentRef, 'p', '', item.text));
    return bubble;
  }
  if (item.type === 'ai') {
    const bubble = createNode(documentRef, 'div', 'jq-bubble jq-bubble--ai');
    bubble.append(createNode(documentRef, 'p', '', item.text));
    return bubble;
  }
  const card = createNode(documentRef, 'article', 'jq-panel jq-svc-card');
  card.append(createMedia(documentRef, item, true));
  const cardBody = createNode(documentRef, 'div', 'jq-svc-card__body');
  cardBody.append(
    createNode(documentRef, 'h3', 'jq-svc-card__name', item.name),
    createNode(documentRef, 'p', 'jq-svc-card__meta', item.meta),
    createNode(documentRef, 'p', 'jq-svc-card__desc', item.desc),
  );
  if (item.price) {
    const price = createNode(documentRef, 'p', 'jq-svc-card__price', item.price);
    if (item.priceNote) {
      price.append(createNode(documentRef, 'span', 'jq-svc-card__price-note', item.priceNote));
    }
    cardBody.append(price);
  }
  const cardActions = createNode(documentRef, 'div', 'jq-svc-card__actions');
  cardActions.append(
    createRouteButton(
      documentRef,
      'jq-btn jq-btn--ghost jq-btn--sm',
      item.actionLabel ?? '看看示例',
      item.route ?? 'signup',
      activate,
    ),
  );
  cardBody.append(cardActions);
  card.append(cardBody);
  return card;
}
