/**
 * M03 购物车与订单预览 / 模拟确认（Issue #17）。
 *
 * 这是一个清晰可点击的示例场景：商品详情选择规格与数量后进入本页，本页只维护
 * 一条内存购物车记录，并始终按 M02 的同一份示例单价与运费规则重算金额。
 *
 * 边界：
 * - 不接支付、库存、地址、账号或物流；没有真实订单，也没有已支付 / 已发货状态；
 * - 只有本人勾选确认并点击「确认模拟提交」后才出现演示回执；
 * - 取消确认、清空购物车都不会生成订单；
 * - 公共终端不进入本页；即便被直接渲染，也只显示拦截说明，绝不渲染私人收货信息；
 * - 无货示例规格不能进入购物车或订单确认，也不会回退成可结算金额。
 */
import { createMedia, createNode } from '../components/kit.js';
import { calculateOrderTotals, createCart, resolveCartLine } from '../data/cart.js';
import { productRoute } from './product.js';

/** @typedef {import('../data/cart.js').CartController} CartController */

/**
 * @typedef {object} CartOptions
 * @property {CartController} [cart] 共享的示例购物车；缺省为当前页面新建的空车。
 * @property {() => boolean} [isPublicMode] 公共终端守卫；缺省视为个人设备。
 */

/**
 * 购物车 / 订单预览正文。
 * @param {Document} documentRef
 * @param {(route: string) => void} activate
 * @param {CartOptions} [options]
 * @returns {HTMLElement}
 */
export function renderCartBody(documentRef, activate, options = {}) {
  const cart = options.cart ?? createCart();
  const isPublicMode = options.isPublicMode ?? (() => false);
  const body = createNode(documentRef, 'div', 'jq-scene jq-scene--cart');
  const item = cart.getItem();
  const productId = item?.productId ?? null;

  // ---------- 场景子头：返回商品详情或商品列表 ----------
  const head = createNode(documentRef, 'header', 'jq-scene__head');
  const back = createNode(documentRef, 'button', 'jq-scene__back');
  back.setAttribute('type', 'button');
  back.addEventListener('click', () => activate(back.getAttribute('data-route') ?? 'shop'));
  const titleBlock = createNode(documentRef, 'div', 'jq-scene__title');
  titleBlock.append(
    createNode(documentRef, 'h1', 'jq-scene__h1', '购物车与订单预览'),
    createNode(documentRef, 'p', 'jq-scene__sub', '示例商品 · 示例运费 · 模拟确认'),
    createNode(
      documentRef,
      'p',
      'jq-scene__demo',
      'M03 示例流程：商品、店铺、价格、收货信息与优惠均为虚构演示；不会创建真实订单、扣款或发货。',
    ),
  );
  head.append(back, titleBlock);
  body.append(head);

  /** @param {string} route @param {string} label */
  function setBack(route, label) {
    back.textContent = label;
    back.setAttribute('data-route', route);
  }
  setBack(
    productId ? productRoute(productId) : 'shop',
    productId ? '‹ 返回商品详情' : '‹ 返回商品列表',
  );

  const status = createNode(documentRef, 'p', 'jq-cart__status');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');

  // ---------- 公共终端：只给拦截说明，不渲染任何私人收货信息 ----------
  if (isPublicMode()) {
    setBack('public', '‹ 返回公共首页');
    const blocked = createNode(documentRef, 'section', 'jq-cart__blocked');
    blocked.hidden = false;
    blocked.append(
      createNode(documentRef, 'h2', 'jq-cart__section-title', '公共终端不展示购物车与收货信息'),
      createNode(
        documentRef,
        'p',
        'jq-cart__text',
        '购物车、订单预览与收货地址只在个人设备上演示。公共终端不会展示私人地址，也不会伪造手机号接力；请在本人手机或家庭个人设备上继续。',
      ),
    );
    body.append(blocked);
    return body;
  }

  const line = resolveCartLine(item);

  // ---------- 空车：可返回商城，不产生订单 ----------
  const empty = createNode(documentRef, 'section', 'jq-cart__empty');
  empty.hidden = false;
  const shopButton = createNode(
    documentRef,
    'button',
    'jq-btn jq-btn--ghost',
    '去商城挑选示例商品',
  );
  shopButton.setAttribute('type', 'button');
  shopButton.addEventListener('click', () => activate('shop'));
  empty.append(
    createNode(documentRef, 'h2', 'jq-cart__section-title', '购物车还是空的（示例）'),
    createNode(
      documentRef,
      'p',
      'jq-cart__text',
      '还没有加入示例商品，因此没有订单、没有支付。请先从商品详情选择规格与数量。',
    ),
    shopButton,
  );

  if (line.status === 'empty') {
    body.append(empty);
    return body;
  }

  // ---------- 无法结算：缺详情、规格不存在或无货示例 ----------
  if (line.status !== 'ok' || !line.entry || !line.entry.detail || !line.spec || !line.totals) {
    empty.hidden = true;
    const unavailable = createNode(documentRef, 'section', 'jq-cart__unavailable');
    unavailable.hidden = false;
    const unavailableTitle =
      line.status === 'out-of-stock'
        ? '无货示例：该规格不能进入购物车或订单确认'
        : '这个示例商品当前不能结算';
    const unavailableText =
      line.status === 'out-of-stock'
        ? '当前规格在 M02 中标记为「无货示例」。本页不会显示可结算金额，也不会生成订单；请返回商品详情重新选择有货的示例规格。'
        : '没有找到可用的商品规格与示例运费资料，因此不显示金额、不进入订单确认，也不编造库存或价格。';
    const invalidActions = createNode(documentRef, 'div', 'jq-cart__actions');
    const reselect = createNode(
      documentRef,
      'button',
      'jq-btn jq-btn--primary',
      '返回商品详情重选',
    );
    reselect.setAttribute('type', 'button');
    reselect.addEventListener('click', () => {
      if (productId) activate(productRoute(productId));
      else activate('shop');
    });
    const clearInvalid = createNode(
      documentRef,
      'button',
      'jq-btn jq-btn--ghost',
      '清空购物车（示例）',
    );
    clearInvalid.setAttribute('type', 'button');
    clearInvalid.addEventListener('click', () => {
      cart.clear();
      unavailable.hidden = true;
      empty.hidden = false;
      setBack('shop', '‹ 返回商品列表');
      status.textContent = '已清空示例购物车：没有生成订单，也没有发起支付。';
    });
    invalidActions.append(reselect, clearInvalid);
    unavailable.append(
      createNode(documentRef, 'h2', 'jq-cart__section-title', unavailableTitle),
      createNode(documentRef, 'p', 'jq-cart__text', unavailableText),
      invalidActions,
    );
    body.append(unavailable, empty, status);
    return body;
  }

  const entry = line.entry;
  /** @type {import('../data/fixtures/shop.fixture.js').ShopProductDetail} */
  const detail = /** @type {import('../data/fixtures/shop.fixture.js').ShopProductDetail} */ (
    entry.detail
  );
  const spec = line.spec;
  empty.hidden = true;

  // ---------- 购物车条目：规格、数量与单项金额 ----------
  const cartSection = createNode(documentRef, 'section', 'jq-cart__section');
  cartSection.append(createNode(documentRef, 'h2', 'jq-cart__section-title', '购物车（示例）'));

  const lineNode = createNode(documentRef, 'article', 'jq-cart__line');
  const media = createNode(documentRef, 'div', 'jq-cart__line-media');
  media.append(
    createMedia(documentRef, entry.product, true),
    createNode(documentRef, 'p', 'jq-cart__note', '示例画面 · 非真实商品图'),
  );

  const lineInfo = createNode(documentRef, 'div', 'jq-cart__line-info');
  lineInfo.append(
    createNode(documentRef, 'h3', 'jq-cart__line-title', entry.product.title),
    createNode(documentRef, 'p', 'jq-cart__note', entry.product.meta),
    createNode(documentRef, 'p', 'jq-cart__store', entry.store.name + ' · ' + entry.store.kind),
    createNode(
      documentRef,
      'p',
      'jq-cart__spec',
      '已选规格：' + spec.label + ' · ' + spec.contents,
    ),
    createNode(
      documentRef,
      'p',
      'jq-cart__unit-price',
      '示例单价 ¥' + detail.pricing.unitPrice + '（非真实售价）',
    ),
  );

  const quantityBlock = createNode(documentRef, 'div', 'jq-cart__quantity');
  quantityBlock.setAttribute('role', 'group');
  quantityBlock.setAttribute('aria-label', '购物车示例数量');
  const minus = /** @type {HTMLButtonElement} */ (
    createNode(documentRef, 'button', 'jq-cart__qty-button', '−')
  );
  minus.setAttribute('type', 'button');
  minus.setAttribute('aria-label', '减少购物车示例数量');
  const quantityValue = createNode(documentRef, 'output', 'jq-cart__qty-value', '1');
  quantityValue.setAttribute('aria-live', 'polite');
  const plus = /** @type {HTMLButtonElement} */ (
    createNode(documentRef, 'button', 'jq-cart__qty-button', '+')
  );
  plus.setAttribute('type', 'button');
  plus.setAttribute('aria-label', '增加购物车示例数量');
  quantityBlock.append(
    createNode(documentRef, 'span', 'jq-cart__label', '数量'),
    minus,
    quantityValue,
    plus,
  );

  const lineTotal = createNode(documentRef, 'p', 'jq-cart__line-total');
  lineTotal.setAttribute('role', 'status');
  lineTotal.setAttribute('aria-live', 'polite');

  const lineActions = createNode(documentRef, 'div', 'jq-cart__actions');
  const clearButton = createNode(
    documentRef,
    'button',
    'jq-btn jq-btn--ghost',
    '清空购物车（示例）',
  );
  clearButton.setAttribute('type', 'button');
  lineActions.append(clearButton);
  lineInfo.append(quantityBlock, lineTotal, lineActions);
  lineNode.append(media, lineInfo);
  cartSection.append(lineNode);

  // ---------- 订单预览：收货 / 优惠 / 金额 / 本人确认 ----------
  const orderSection = createNode(documentRef, 'section', 'jq-cart__order');
  const orderHead = createNode(documentRef, 'header', 'jq-cart__order-head');
  orderHead.append(
    createNode(documentRef, 'h2', 'jq-cart__section-title', '订单预览（示例）'),
    createNode(documentRef, 'span', 'jq-cart__badge', '模拟订单 · 未支付 · 未发货'),
  );
  orderSection.append(orderHead);

  const infoGrid = createNode(documentRef, 'div', 'jq-cart__grid');
  const addressCard = createNode(documentRef, 'article', 'jq-cart__card');
  addressCard.append(
    createNode(documentRef, 'h3', 'jq-cart__card-title', '收货信息（虚构示例）'),
    createNode(documentRef, 'p', 'jq-cart__card-text', '收货人：示例用户（虚构）'),
    createNode(documentRef, 'p', 'jq-cart__card-text', '手机号：138****0000（示例）'),
    createNode(
      documentRef,
      'p',
      'jq-cart__card-text',
      '地址：云栖市示例区示例路 1 号 2 单元 301（虚构）',
    ),
    createNode(
      documentRef,
      'p',
      'jq-cart__note',
      '只在个人设备展示；不会把地址写入订单、发送给商家或用于真实配送。',
    ),
  );

  const discountCard = createNode(documentRef, 'article', 'jq-cart__card');
  discountCard.append(
    createNode(documentRef, 'h3', 'jq-cart__card-title', '优惠说明（示例）'),
    createNode(
      documentRef,
      'p',
      'jq-cart__card-text',
      '当前未接入真实优惠或会员权益，本单不叠加折扣。',
    ),
    createNode(
      documentRef,
      'p',
      'jq-cart__note',
      'M01 展示的示例会员价 ¥179 只作说明，不参与本次示例计算。',
    ),
  );

  const storeCard = createNode(documentRef, 'article', 'jq-cart__card');
  storeCard.append(
    createNode(documentRef, 'h3', 'jq-cart__card-title', '店铺与履约（虚构示例）'),
    createNode(documentRef, 'p', 'jq-cart__card-text', entry.store.name),
    createNode(documentRef, 'p', 'jq-cart__note', detail.fulfillmentParty),
  );
  infoGrid.append(addressCard, discountCard, storeCard);
  orderSection.append(infoGrid);

  const totals = createNode(documentRef, 'dl', 'jq-cart__totals');
  const subtotalValue = createNode(documentRef, 'dd', 'jq-cart__amount');
  subtotalValue.setAttribute('data-cart-subtotal', '');
  const shippingValue = createNode(documentRef, 'dd', 'jq-cart__amount');
  shippingValue.setAttribute('data-cart-shipping', '');
  const totalValue = createNode(documentRef, 'dd', 'jq-cart__amount jq-cart__amount--total');
  totalValue.setAttribute('data-cart-total', '');
  totals.append(
    renderTotalRow(documentRef, '商品小计', subtotalValue),
    renderTotalRow(documentRef, '示例运费', shippingValue),
    renderTotalRow(documentRef, '示例合计', totalValue, true),
  );
  const shippingHint = createNode(documentRef, 'p', 'jq-cart__shipping-hint');
  shippingHint.setAttribute('data-cart-shipping-hint', '');
  orderSection.append(
    totals,
    shippingHint,
    createNode(
      documentRef,
      'p',
      'jq-cart__note',
      '示例运费规则：满 ¥299 包邮，未满收 ¥12；真实运费、结算与支付未接入。',
    ),
  );

  const confirmBlock = createNode(documentRef, 'div', 'jq-cart__confirm');
  const confirmLabel = createNode(documentRef, 'label', 'jq-cart__checkbox');
  const confirmInput = /** @type {HTMLInputElement} */ (
    createNode(documentRef, 'input', 'jq-cart__checkbox-input')
  );
  confirmInput.setAttribute('type', 'checkbox');
  confirmInput.checked = false;
  confirmLabel.append(
    confirmInput,
    createNode(
      documentRef,
      'span',
      'jq-cart__checkbox-text',
      '本人确认：以上均为虚构示例，确认后只生成演示回执。',
    ),
  );

  const confirmActions = createNode(documentRef, 'div', 'jq-cart__actions');
  const confirmButton = /** @type {HTMLButtonElement} */ (
    createNode(documentRef, 'button', 'jq-btn jq-btn--primary', '确认模拟提交（不会真实成交）')
  );
  confirmButton.setAttribute('type', 'button');
  confirmButton.disabled = true;
  const cancelButton = createNode(documentRef, 'button', 'jq-btn jq-btn--ghost', '取消确认');
  cancelButton.setAttribute('type', 'button');
  const failureButton = createNode(
    documentRef,
    'button',
    'jq-btn jq-btn--ghost',
    '查看模拟失败示例',
  );
  failureButton.setAttribute('type', 'button');
  confirmActions.append(confirmButton, cancelButton, failureButton);
  confirmBlock.append(
    createNode(documentRef, 'p', 'jq-cart__confirm-title', '提交前请由本人明确确认'),
    confirmLabel,
    confirmActions,
  );
  orderSection.append(confirmBlock);

  const failure = createNode(documentRef, 'section', 'jq-cart__failure');
  failure.hidden = true;
  failure.setAttribute('role', 'alert');
  const failureText = createNode(documentRef, 'p', 'jq-cart__text');
  failure.append(
    createNode(documentRef, 'h3', 'jq-cart__card-title', '模拟提交失败（演示）'),
    failureText,
  );
  orderSection.append(failure);

  const receipt = createNode(documentRef, 'section', 'jq-cart__receipt');
  receipt.hidden = true;
  receipt.setAttribute('role', 'status');
  receipt.setAttribute('aria-live', 'polite');
  const receiptTitle = createNode(
    documentRef,
    'h3',
    'jq-cart__card-title',
    '模拟回执（演示，不是真实订单）',
  );
  const receiptLines = createNode(documentRef, 'div', 'jq-cart__receipt-lines');
  receipt.append(receiptTitle, receiptLines);
  orderSection.append(receipt);

  body.append(cartSection, orderSection, empty, status, renderBoundary(documentRef));

  /**
   * 把当前示例金额同步到购物车行、订单预览与包邮提示。
   * @param {import('../data/cart.js').OrderTotals} current
   */
  function renderTotals(current) {
    quantityValue.textContent = String(current.quantity);
    minus.disabled = current.quantity <= 1;
    plus.disabled = current.quantity >= detail.pricing.quantityLimit;
    lineTotal.textContent =
      '示例小计 ¥' + current.subtotal + '（¥' + current.unitPrice + ' × ' + current.quantity + '）';
    subtotalValue.textContent = '¥' + current.subtotal;
    shippingValue.textContent = current.shipping === 0 ? '¥0（示例包邮）' : '¥' + current.shipping;
    totalValue.textContent = '¥' + current.total;
    shippingHint.textContent =
      current.shipping === 0
        ? '已满示例包邮门槛 ¥' + detail.shipping.freeFrom + '，本单按 ¥0 示例运费计算。'
        : '再买 ¥' +
          current.freeShippingShortfall +
          '（示例）可享包邮；当前未满 ¥' +
          detail.shipping.freeFrom +
          '，示例运费 ¥' +
          detail.shipping.fee +
          '。';
  }

  /**
   * 数量变化后重算金额，并使此前的模拟回执 / 确认失效。
   * @param {boolean} resetConfirmation
   */
  function syncAmounts(resetConfirmation) {
    const currentItem = cart.getItem();
    if (!currentItem) return;
    renderTotals(calculateOrderTotals(detail, currentItem.quantity));
    if (!resetConfirmation) return;
    confirmInput.checked = false;
    confirmInput.disabled = false;
    confirmButton.disabled = true;
    receipt.hidden = true;
    failure.hidden = true;
    status.textContent = '示例金额已更新：未生成订单，也未发起支付。';
  }

  /** @param {number} delta */
  function changeQuantity(delta) {
    const current = cart.getItem();
    if (!current) return;
    const next = Math.min(Math.max(current.quantity + delta, 1), detail.pricing.quantityLimit);
    if (next === current.quantity) return;
    cart.setQuantity(next);
    syncAmounts(true);
  }

  minus.addEventListener('click', () => changeQuantity(-1));
  plus.addEventListener('click', () => changeQuantity(1));

  confirmInput.addEventListener('change', () => {
    confirmButton.disabled = !confirmInput.checked;
  });

  confirmButton.addEventListener('click', () => {
    if (confirmButton.disabled || !confirmInput.checked) {
      status.textContent = '请先勾选「本人确认」，再提交模拟订单。';
      return;
    }
    const current = calculateOrderTotals(detail, cart.getItem()?.quantity ?? 1);
    const demoNumber = 'DEMO-M03-' + entry.product.id.toUpperCase();
    receiptLines.replaceChildren(
      createNode(documentRef, 'p', 'jq-cart__receipt-line', '回执编号：' + demoNumber),
      createNode(
        documentRef,
        'p',
        'jq-cart__receipt-line',
        '商品：' + entry.product.title + ' · ' + spec.label + ' × ' + current.quantity,
      ),
      createNode(
        documentRef,
        'p',
        'jq-cart__receipt-line',
        '示例合计：¥' + current.total + '（含示例运费 ¥' + current.shipping + '）',
      ),
      createNode(
        documentRef,
        'p',
        'jq-cart__receipt-line jq-cart__receipt-state',
        '状态：未支付 · 未发货 · 未生成真实订单',
      ),
      createNode(
        documentRef,
        'p',
        'jq-cart__note',
        '此回执仅用于演示确认流程，不是订单凭证，不能用于提货、退款或售后。',
      ),
    );
    receipt.hidden = false;
    failure.hidden = true;
    confirmInput.disabled = true;
    confirmButton.disabled = true;
    status.textContent = '已生成演示回执：没有扣款、没有发货，也没有创建真实订单。';
  });

  cancelButton.addEventListener('click', () => {
    confirmInput.checked = false;
    confirmInput.disabled = false;
    confirmButton.disabled = true;
    receipt.hidden = true;
    failure.hidden = true;
    status.textContent = '已取消确认：没有生成订单、没有支付，也没有发货。';
    if (typeof confirmInput.focus === 'function') confirmInput.focus();
  });

  failureButton.addEventListener('click', () => {
    confirmInput.checked = false;
    confirmInput.disabled = false;
    confirmButton.disabled = true;
    receipt.hidden = true;
    failure.hidden = false;
    failureText.textContent =
      '模拟库存校验未通过（示例）：本次提交失败，未生成订单、未扣款、未发货；购物车内容仍保留，可重试或取消。';
    status.textContent = '演示失败状态：没有生成订单或支付。';
  });

  clearButton.addEventListener('click', () => {
    cart.clear();
    // 清空后把条目与订单预览从 DOM 一并移除，避免私人收货示例留在隐藏区域。
    cartSection.replaceChildren();
    orderSection.replaceChildren();
    cartSection.hidden = true;
    orderSection.hidden = true;
    empty.hidden = false;
    setBack('shop', '‹ 返回商品列表');
    status.textContent = '已清空示例购物车：没有生成订单，也没有发起支付。';
  });

  syncAmounts(false);
  return body;
}

/**
 * @param {Document} documentRef
 * @param {string} label
 * @param {HTMLElement} value
 * @param {boolean} [strong]
 * @returns {HTMLElement}
 */
function renderTotalRow(documentRef, label, value, strong = false) {
  const row = createNode(
    documentRef,
    'div',
    strong ? 'jq-cart__row jq-cart__row--total' : 'jq-cart__row',
  );
  row.append(createNode(documentRef, 'dt', 'jq-cart__label', label), value);
  return row;
}

/**
 * @param {Document} documentRef
 * @returns {HTMLElement}
 */
function renderBoundary(documentRef) {
  return createNode(
    documentRef,
    'p',
    'jq-cart__boundary',
    '以上购物车、订单预览、收货信息、优惠、金额与回执均为 S1 虚构示例；没有真实订单、库存、支付、物流或账号地址服务。',
  );
}
