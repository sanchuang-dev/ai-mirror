/**
 * M02 商品详情与履约信息（Issue #16）。
 *
 * 商城列表与 AI 示例商品推荐都进入**同一个** `product:<id>` 路由，本页是该路由唯一的
 * 商品详情语义页。它复用 M01 的同一批商品 / 店铺事实（经 `web/data/api.js`），只补
 * 规格、数量、示例单价、运费、适用区域、店铺 / 履约方、预计配送 / 服务说明与售后说明。
 *
 * 边界：
 * - 规格、价格、运费、区域、配送与售后都是显式 S1 示例，不冒充真实商家、库存或时效；
 * - 「加入购物车 / 查看订单预览」只是 M03 待实现的诚实示例入口，不写购物车、不建订单、
 *   不接支付；点击后给出可取消的说明，并为无货示例规格禁用入口；
 * - 只为「上臂式电子血压计」补充完整详情资料；其它商品仍可进入同一路由，但页面会如实
 *   说明资料未补充，不编造规格、库存或履约条件。
 */
import { createMedia, createNode } from '../components/kit.js';
import { getShopProductDetail } from '../data/api.js';

/** 商品详情路由前缀；列表卡片与 AI 卡片共用这一个入口格式。 */
export const PRODUCT_ROUTE_PREFIX = 'product:';

/**
 * @param {string} productId
 * @returns {string}
 */
export function productRoute(productId) {
  return PRODUCT_ROUTE_PREFIX + productId;
}

/**
 * @param {string} route
 * @returns {string | null} 非商品详情路由返回 null。
 */
export function productIdFromRoute(route) {
  if (!route.startsWith(PRODUCT_ROUTE_PREFIX)) return null;
  const productId = route.slice(PRODUCT_ROUTE_PREFIX.length);
  return productId || null;
}

/**
 * @typedef {object} ProductDetailOptions
 * @property {string} [returnRoute] 返回去向：shop 回商品列表，ai 回小暖。
 */

/**
 * 商品详情正文。
 * @param {Document} documentRef
 * @param {string} productId
 * @param {(route: string) => void} activate
 * @param {ProductDetailOptions} [options]
 * @returns {HTMLElement}
 */
export function renderProductDetailBody(documentRef, productId, activate, options = {}) {
  const entry = getShopProductDetail(productId);
  const returnRoute = options.returnRoute ?? 'shop';
  const body = createNode(documentRef, 'div', 'jq-scene jq-scene--product');

  const head = createNode(documentRef, 'header', 'jq-scene__head');
  const back = createNode(
    documentRef,
    'button',
    'jq-scene__back',
    returnRoute === 'ai' ? '‹ 返回小暖' : '‹ 返回商品列表',
  );
  back.setAttribute('type', 'button');
  back.setAttribute('data-route', returnRoute);
  back.addEventListener('click', () => activate(returnRoute));

  const titleBlock = createNode(documentRef, 'div', 'jq-scene__title');
  head.append(back, titleBlock);
  body.append(head);

  if (!entry) {
    titleBlock.append(
      createNode(documentRef, 'h1', 'jq-scene__h1', '找不到这个示例商品'),
      createNode(
        documentRef,
        'p',
        'jq-scene__demo',
        'M02 示例详情：没有找到 id 为「' + productId + '」的商品，可能链接不完整或商品已下架。',
      ),
    );
    body.append(
      renderUnavailable(
        documentRef,
        '没有可展示的商品事实',
        '请返回商品列表重新选择。本页不会编造一个不存在的商品、店铺、价格或履约条件。',
      ),
    );
    return body;
  }

  const { product, store, categoryLabel, detail } = entry;
  titleBlock.append(
    createNode(documentRef, 'h1', 'jq-scene__h1', product.title),
    createNode(documentRef, 'p', 'jq-scene__sub', product.meta),
    createNode(documentRef, 'p', 'jq-scene__demo', product.summary),
    createNode(
      documentRef,
      'p',
      'jq-product__source',
      returnRoute === 'ai'
        ? '来自小暖的示例商品推荐（未做真实比价）'
        : '来自平台商城的示例商品列表',
    ),
  );

  const main = createNode(documentRef, 'div', 'jq-product__main');
  const media = createNode(documentRef, 'aside', 'jq-product__media');
  media.append(
    createMedia(documentRef, product, true),
    createNode(documentRef, 'p', 'jq-product__media-note', '示例画面 · 非真实商品图'),
  );

  const info = createNode(documentRef, 'div', 'jq-product__info');
  info.append(
    createNode(
      documentRef,
      'p',
      'jq-product__demo',
      detail
        ? detail.intro
        : 'M02 示例详情：这件商品还没有补充规格、运费与履约资料；页面只展示 M01 已有的商品事实。',
    ),
  );

  const facts = createNode(documentRef, 'dl', 'jq-product__facts');
  appendFact(facts, documentRef, '入驻店铺', store.name + ' · ' + store.kind);
  appendFact(facts, documentRef, '商品类目', categoryLabel + ' · 示例');
  appendFact(
    facts,
    documentRef,
    '示例价格',
    product.price + (product.priceNote ? ' · ' + product.priceNote : ''),
  );
  appendFact(
    facts,
    documentRef,
    '库存 / 可供数量',
    detail ? detail.stockNote : '未接入真实库存；该商品也未补充 M02 示例详情。',
  );
  info.append(facts);
  main.append(media, info);

  if (detail) {
    const purchase = buildPurchaseSection(documentRef, detail, product.price);
    info.append(
      buildSpecSection(documentRef, detail, (outOfStock) => purchase.setOutOfStock(outOfStock)),
    );
    info.append(purchase.node);
    body.append(main);
    body.append(buildFulfillmentSection(documentRef, detail));
  } else {
    body.append(main);
    body.append(
      renderUnavailable(
        documentRef,
        '该示例商品的详情资料尚未补充',
        'M02 只为一个样例商品提供了完整的规格、运费与履约示例；当前不提供加入购物车或订单预览入口，也不会编造库存、配送时效或售后政策。',
      ),
    );
  }

  body.append(
    createNode(
      documentRef,
      'p',
      'jq-product__boundary',
      '以上商品、店铺、价格、规格、运费、区域、履约方、配送与售后均为虚构示例；真实库存、时效、订单与支付尚未接入。',
    ),
  );
  return body;
}

/**
 * @param {Document} documentRef
 * @param {import('../data/fixtures/shop.fixture.js').ShopProductDetail} detail
 * @param {(outOfStock: boolean) => void} onSpecChange
 * @returns {HTMLElement}
 */
function buildSpecSection(documentRef, detail, onSpecChange) {
  const section = createNode(documentRef, 'section', 'jq-product__section');
  section.append(createNode(documentRef, 'h2', 'jq-product__section-title', '规格选择'));

  const list = createNode(documentRef, 'div', 'jq-product__specs');
  list.setAttribute('role', 'group');
  list.setAttribute('aria-label', '示例商品规格');

  /** @type {HTMLButtonElement[]} */
  const buttons = [];
  let selected = detail.specs.find((spec) => spec.id === detail.defaultSpecId) ?? detail.specs[0];

  const warning = createNode(documentRef, 'p', 'jq-product__stock');
  warning.setAttribute('role', 'status');
  warning.setAttribute('aria-live', 'polite');

  for (const spec of detail.specs) {
    const button = /** @type {HTMLButtonElement} */ (
      createNode(documentRef, 'button', 'jq-product__spec')
    );
    button.setAttribute('type', 'button');
    button.setAttribute('data-spec', spec.id);
    button.setAttribute('data-availability', spec.availability);
    button.setAttribute('aria-pressed', spec.id === selected.id ? 'true' : 'false');
    button.append(
      createNode(documentRef, 'span', 'jq-product__spec-name', spec.label),
      createNode(documentRef, 'span', 'jq-product__spec-note', spec.contents),
      createNode(documentRef, 'span', 'jq-product__spec-state', spec.availabilityLabel),
    );
    button.addEventListener('click', () => {
      selected = spec;
      syncSpecs();
    });
    buttons.push(button);
    list.append(button);
  }

  section.append(list, warning);

  /** 规格状态变化：高亮选中项、提示无货示例，并通知购买区同步入口状态。 */
  function syncSpecs() {
    for (const button of buttons) {
      button.setAttribute(
        'aria-pressed',
        button.getAttribute('data-spec') === selected.id ? 'true' : 'false',
      );
    }
    const outOfStock = selected.availability === 'out-of-stock-example';
    warning.textContent = outOfStock
      ? '无货示例状态：当前规格仅用于演示不可购买的情况，真实库存未接入；加入购物车与订单预览都不可用。'
      : '当前为正常示例状态：库存未接入，本页不显示剩余件数，也不保证真实可售。';
    onSpecChange(outOfStock);
  }

  syncSpecs();
  return section;
}

/**
 * @typedef {object} PurchaseSection
 * @property {HTMLElement} node
 * @property {(outOfStock: boolean) => void} setOutOfStock 规格切换时同步示例入口可用性。
 */

/**
 * 购买区：示例单价、数量、运费与 M03 待实现入口。
 * @param {Document} documentRef
 * @param {import('../data/fixtures/shop.fixture.js').ShopProductDetail} detail
 * @param {string} priceLabel
 * @returns {PurchaseSection}
 */
function buildPurchaseSection(documentRef, detail, priceLabel) {
  const section = createNode(documentRef, 'section', 'jq-product__section');
  section.append(createNode(documentRef, 'h2', 'jq-product__section-title', '价格与数量'));

  const price = createNode(documentRef, 'p', 'jq-product__price');
  price.append(
    createNode(documentRef, 'span', 'jq-product__amount', priceLabel),
    createNode(documentRef, 'span', 'jq-product__price-note', '示例单价，非真实售价'),
  );
  section.append(price);

  let quantity = 1;
  const quantityRow = createNode(documentRef, 'div', 'jq-product__quantity');
  quantityRow.setAttribute('role', 'group');
  quantityRow.setAttribute('aria-label', '演示数量');
  const minus = /** @type {HTMLButtonElement} */ (
    createNode(documentRef, 'button', 'jq-product__qty-button', '−')
  );
  minus.setAttribute('type', 'button');
  minus.setAttribute('aria-label', '减少演示数量');
  const value = createNode(documentRef, 'output', 'jq-product__qty-value', '1');
  value.setAttribute('aria-live', 'polite');
  const plus = /** @type {HTMLButtonElement} */ (
    createNode(documentRef, 'button', 'jq-product__qty-button', '+')
  );
  plus.setAttribute('type', 'button');
  plus.setAttribute('aria-label', '增加演示数量');
  quantityRow.append(
    createNode(documentRef, 'span', 'jq-product__label', '数量'),
    minus,
    value,
    plus,
  );
  section.append(
    quantityRow,
    createNode(documentRef, 'p', 'jq-product__note', detail.pricing.quantityNote),
  );

  const total = createNode(documentRef, 'p', 'jq-product__total');
  total.setAttribute('role', 'status');
  total.setAttribute('aria-live', 'polite');
  section.append(total);

  const actions = createNode(documentRef, 'div', 'jq-product__actions');
  const add = /** @type {HTMLButtonElement} */ (
    createNode(documentRef, 'button', 'jq-btn jq-btn--primary', '加入购物车（示例入口）')
  );
  add.setAttribute('type', 'button');
  const preview = /** @type {HTMLButtonElement} */ (
    createNode(documentRef, 'button', 'jq-btn jq-btn--ghost', '查看订单预览（示例入口）')
  );
  preview.setAttribute('type', 'button');
  actions.append(add, preview);
  section.append(
    actions,
    createNode(
      documentRef,
      'p',
      'jq-product__note',
      'M03 待接入：这两个入口只演示取消 / 无货状态，不写入购物车、不生成订单，也不发起支付。',
    ),
  );

  const panel = createNode(documentRef, 'div', 'jq-product__action-panel');
  panel.setAttribute('role', 'status');
  panel.setAttribute('aria-live', 'polite');
  panel.hidden = true;
  const panelTitle = createNode(documentRef, 'p', 'jq-product__action-title');
  const panelText = createNode(documentRef, 'p', 'jq-product__action-text');
  const cancel = createNode(documentRef, 'button', 'jq-btn jq-btn--ghost jq-btn--sm', '取消演示');
  cancel.setAttribute('type', 'button');
  panel.append(panelTitle, panelText, cancel);
  section.append(panel);

  const status = createNode(documentRef, 'p', 'jq-product__status');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  section.append(status);

  let lastAction = 'cart';

  /**
   * 规格切换时同步入口状态：无货示例规格不允许继续演示购买。
   * @param {boolean} outOfStock
   */
  function setOutOfStock(outOfStock) {
    add.disabled = outOfStock;
    preview.disabled = outOfStock;
    if (outOfStock) {
      panel.hidden = true;
      status.textContent = '';
      total.textContent =
        '无货示例状态：不提供加入购物车或订单合计。示例单价与示例运费规则仅用于说明。';
    } else {
      renderQuantity();
    }
  }

  minus.addEventListener('click', () => {
    if (quantity <= 1) return;
    quantity -= 1;
    renderQuantity();
  });
  plus.addEventListener('click', () => {
    if (quantity >= detail.pricing.quantityLimit) return;
    quantity += 1;
    renderQuantity();
  });

  add.addEventListener('click', () => {
    if (add.disabled) return;
    openAction('cart');
  });
  preview.addEventListener('click', () => {
    if (preview.disabled) return;
    openAction('order');
  });
  cancel.addEventListener('click', () => {
    panel.hidden = true;
    status.textContent =
      lastAction === 'cart'
        ? '已取消演示：没有写入购物车，也没有生成订单。'
        : '已取消演示：没有生成订单预览，也没有发起支付。';
    const trigger = lastAction === 'cart' ? add : preview;
    if (typeof trigger.focus === 'function') trigger.focus();
  });

  /**
   * M03 待实现入口的可见反馈；只切页面状态，不做任何真实交易动作。
   * @param {'cart' | 'order'} kind
   */
  function openAction(kind) {
    lastAction = kind;
    panel.hidden = false;
    status.textContent = '';
    if (kind === 'cart') {
      panelTitle.textContent = 'M03 待实现：加入购物车';
      panelText.textContent =
        '这次点击没有写入购物车，也没有创建订单或发起支付。M03 接入后才会提供真实购物车。';
    } else {
      panelTitle.textContent = 'M03 待实现：订单预览';
      panelText.textContent =
        '没有生成订单预览、价格确认单或支付请求。真实订单与结算归 M03，本页只演示入口与取消状态。';
    }
    if (typeof cancel.focus === 'function') cancel.focus();
  }

  /** 数量变化只更新演示小计，不产生真实占库存或价格承诺。 */
  function renderQuantity() {
    value.textContent = String(quantity);
    minus.disabled = quantity <= 1;
    plus.disabled = quantity >= detail.pricing.quantityLimit;
    const subtotal = detail.pricing.unitPrice * quantity;
    const shipping = subtotal >= detail.shipping.freeFrom ? 0 : detail.shipping.fee;
    total.textContent =
      '示例小计：¥' +
      detail.pricing.unitPrice +
      ' × ' +
      quantity +
      ' = ¥' +
      subtotal +
      '；示例运费：' +
      (shipping === 0 ? '免运费（示例满 ¥' + detail.shipping.freeFrom + '）' : '¥' + shipping) +
      '；示例合计：¥' +
      (subtotal + shipping) +
      '（仅演示计算，未接入真实结算）';
  }

  renderQuantity();
  return { node: section, setOutOfStock };
}

/**
 * @param {Document} documentRef
 * @param {import('../data/fixtures/shop.fixture.js').ShopProductDetail} detail
 * @returns {HTMLElement}
 */
function buildFulfillmentSection(documentRef, detail) {
  const section = createNode(documentRef, 'section', 'jq-product__fulfillment');
  section.append(createNode(documentRef, 'h2', 'jq-product__section-title', '履约与服务信息'));
  const grid = createNode(documentRef, 'div', 'jq-product__fulfillment-grid');
  for (const [title, text] of [
    ['适用区域', detail.region],
    ['示例运费', detail.shipping.note],
    ['预计配送 / 服务说明', detail.delivery],
    ['售后说明', detail.afterSales],
    ['店铺与履约方', detail.fulfillmentParty],
  ]) {
    const card = createNode(documentRef, 'article', 'jq-product__card');
    card.append(
      createNode(documentRef, 'h3', 'jq-product__card-title', title),
      createNode(documentRef, 'p', 'jq-product__card-text', text),
    );
    grid.append(card);
  }
  section.append(grid);
  return section;
}

/**
 * @param {Document} documentRef
 * @param {string} title
 * @param {string} text
 * @returns {HTMLElement}
 */
function renderUnavailable(documentRef, title, text) {
  const node = createNode(documentRef, 'section', 'jq-product__fallback');
  node.append(
    createNode(documentRef, 'h2', 'jq-product__section-title', title),
    createNode(documentRef, 'p', 'jq-product__card-text', text),
  );
  return node;
}

/**
 * @param {HTMLElement} facts
 * @param {Document} documentRef
 * @param {string} label
 * @param {string} value
 */
function appendFact(facts, documentRef, label, value) {
  const row = createNode(documentRef, 'div', 'jq-product__fact');
  row.append(
    createNode(documentRef, 'dt', 'jq-product__label', label),
    createNode(documentRef, 'dd', 'jq-product__value', value),
  );
  facts.append(row);
}
