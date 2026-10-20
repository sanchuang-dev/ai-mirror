/**
 * 共享 DOM 构建原语（`jq-` 前缀，见 frontend-baseline §2）。
 *
 * 页面只组合这些具名工厂，不自建第二套结构，也不按 A/B 分叉 DOM / 数据。
 * 这里不读写存储、不引用主题值：主题只由 `tokens.css` 的 CSS 变量表达。
 */

/**
 * @param {Document} documentRef
 * @param {string} tagName
 * @param {string} [className]
 * @param {string} [text]
 * @returns {HTMLElement}
 */
export function createNode(documentRef, tagName, className, text) {
  const node = documentRef.createElement(tagName);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/**
 * 真实可点击入口：导航与场景共用同一个 `activate`，保证「一处状态处理」。
 * @param {Document} documentRef
 * @param {string} className
 * @param {string} label
 * @param {string} route
 * @param {(route: string) => void} onActivate
 * @returns {HTMLButtonElement}
 */
export function createRouteButton(documentRef, className, label, route, onActivate) {
  const node = createNode(documentRef, 'button', className, label);
  node.setAttribute('type', 'button');
  node.setAttribute('data-route', route);
  node.addEventListener('click', () => onActivate(route));
  return /** @type {HTMLButtonElement} */ (node);
}

/**
 * 示例画面：优先铺 OpenDesign 原型（PR #1）原样复用的开放授权影像
 * （署名见 `web/assets/img/CREDITS.md`），渐变只作为图片载入前的底色。
 * 影像是氛围示意，alt 一律标注「示例画面」，不冒充真实剧照 / 商品图。
 * @param {Document} documentRef
 * @param {{ tone: string, image?: string, imageAlt?: string, title?: string }} spec
 * @param {boolean} [showNote]
 * @returns {HTMLElement}
 */
export function createMedia(documentRef, spec, showNote) {
  const media = createNode(documentRef, 'div', 'jq-media jq-media--' + spec.tone);
  const alt = '示例画面：' + (spec.imageAlt ?? spec.title ?? '');
  if (spec.image) {
    const image = createNode(documentRef, 'img', 'jq-media__img');
    image.setAttribute('src', './assets/img/' + spec.image);
    image.setAttribute('alt', alt);
    image.setAttribute('decoding', 'async');
    media.append(image);
  } else {
    // 没有可复用影像时仍保留可读的画面语义，不用纯色块冒充内容。
    media.setAttribute('role', 'img');
    media.setAttribute('aria-label', alt);
  }
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
export function createProgress(documentRef, progress, className) {
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
 * @typedef {object} SectionHeadOptions
 * @property {string} [sub]
 * @property {string} [titleId]
 * @property {{ label: string, route: string }} [more]
 *
 * @param {Document} documentRef
 * @param {string} title
 * @param {(route: string) => void} onActivate
 * @param {SectionHeadOptions} [options]
 * @returns {HTMLElement}
 */
export function createSectionHead(documentRef, title, onActivate, options = {}) {
  const head = createNode(documentRef, 'header', 'jq-section__head');
  const heading = createNode(documentRef, 'h2', 'jq-section__title', title);
  if (options.titleId) heading.setAttribute('id', options.titleId);
  head.append(heading);
  if (options.sub) head.append(createNode(documentRef, 'span', 'jq-section__sub', options.sub));
  if (options.more) {
    head.append(
      createRouteButton(documentRef, 'jq-more', options.more.label, options.more.route, onActivate),
    );
  }
  return head;
}
