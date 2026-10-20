import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { mountApp } from '../web/assets/app.js';
import { calculateOrderTotals, createCart, resolveCartLine } from '../web/data/cart.js';
import { getShopProductDetail } from '../web/data/api.js';
import { renderCartBody } from '../web/pages/cart.js';
import { collect, createFakeDocument } from './helpers/fake-dom.mjs';

/** @param {import('./helpers/fake-dom.mjs').FakeNode} root @param {(node: import('./helpers/fake-dom.mjs').FakeNode) => boolean} predicate */
const find = (root, predicate) => collect(root, predicate);

/** @param {import('./helpers/fake-dom.mjs').FakeNode} root @param {string} className */
const byClass = (root, className) => find(root, (node) => node.classList.contains(className));

/** @param {import('./helpers/fake-dom.mjs').FakeNode} root @param {string} text */
const byText = (root, text) => find(root, (node) => node.textContent === text);

/** @param {import('./helpers/fake-dom.mjs').FakeNode} root @param {string} name */
const value = (root, name) => {
  const nodes = find(root, (node) => node.getAttribute(name) !== null);
  return nodes.map((node) => node.textContent).join(' ');
};

/** @param {import('./helpers/fake-dom.mjs').FakeNode} root */
const textOf = (root) =>
  find(root, () => true)
    .map((node) => node.textContent)
    .join(' ');

const detail = /** @type {import('../web/data/fixtures/shop.fixture.js').ShopProductDetail} */ (
  getShopProductDetail('blood-pressure')?.detail
);

test('M03 amount math keeps subtotal, shipping and total consistent with the M02 sample rules', () => {
  assert.equal(detail.pricing.unitPrice, 199);
  assert.equal(detail.shipping.fee, 12);
  assert.equal(detail.shipping.freeFrom, 299);

  const one = calculateOrderTotals(detail, 1);
  assert.deepEqual(one, {
    unitPrice: 199,
    quantity: 1,
    subtotal: 199,
    shipping: 12,
    total: 211,
    freeShippingShortfall: 100,
  });

  const two = calculateOrderTotals(detail, 2);
  assert.equal(two.subtotal, 398);
  assert.equal(two.shipping, 0);
  assert.equal(two.total, 398);
  assert.equal(two.freeShippingShortfall, 0);

  // 数量按声明上限收敛，不允许用合成输入算出库存外的金额。
  assert.equal(calculateOrderTotals(detail, 0).quantity, 1);
  assert.equal(calculateOrderTotals(detail, 99).quantity, detail.pricing.quantityLimit);
});

test('the in-memory cart keeps one line, updates quantity and clears without persistence', () => {
  const cart = createCart();
  assert.equal(cart.getItem(), null);

  cart.setItem('blood-pressure', 'standard', 2);
  assert.deepEqual(cart.getItem(), {
    productId: 'blood-pressure',
    specId: 'standard',
    quantity: 2,
  });

  cart.setQuantity(3);
  assert.equal(cart.getItem()?.quantity, 3);

  // 返回的是副本：页面修改不会绕过控制器改掉购物车事实。
  const copy = cart.getItem();
  if (copy) copy.quantity = 9;
  assert.equal(cart.getItem()?.quantity, 3);

  cart.clear();
  assert.equal(cart.getItem(), null);
});

test('the cart page renders an honest empty state with no order or address', () => {
  const doc = createFakeDocument();
  const body = renderCartBody(doc, () => {}, { cart: createCart() });

  assert.equal(byClass(body, 'jq-scene--cart').length, 1);
  const empty = byClass(body, 'jq-cart__empty')[0];
  assert.equal(empty.hidden, false);
  assert.match(textOf(empty), /购物车还是空的/);
  assert.match(textOf(empty), /没有订单、没有支付/);
  assert.equal(byClass(body, 'jq-cart__order').length, 0);
  assert.equal(byClass(body, 'jq-cart__confirm').length, 0);
  assert.equal(byClass(body, 'jq-cart__receipt').length, 0);
  assert.doesNotMatch(textOf(body), /示例路/);
});

test('quantity and shipping changes update the cart line and order preview together', () => {
  const doc = createFakeDocument();
  const cart = createCart();
  cart.setItem('blood-pressure', 'standard', 1);
  const body = renderCartBody(doc, () => {}, { cart });

  assert.match(byClass(body, 'jq-cart__line-title')[0].textContent, /上臂式电子血压计/);
  assert.match(byClass(body, 'jq-cart__spec')[0].textContent, /标准装/);
  assert.match(textOf(body), /云栖优选生活馆（虚构示例）/);
  assert.match(textOf(body), /收货人：示例用户（虚构）/);
  assert.match(textOf(body), /138\*\*\*\*0000/);
  assert.match(textOf(body), /示例会员价 ¥179/);

  assert.equal(value(body, 'data-cart-subtotal'), '¥199');
  assert.equal(value(body, 'data-cart-shipping'), '¥12');
  assert.equal(value(body, 'data-cart-total'), '¥211');
  assert.match(
    find(body, (node) => node.getAttribute('data-cart-shipping-hint') !== null)[0].textContent,
    /再买 ¥100/,
  );

  const plus = find(body, (node) => node.getAttribute('aria-label') === '增加购物车示例数量')[0];
  plus.dispatch('click');
  assert.equal(byClass(body, 'jq-cart__qty-value')[0].textContent, '2');
  assert.equal(value(body, 'data-cart-subtotal'), '¥398');
  assert.equal(value(body, 'data-cart-shipping'), '¥0（示例包邮）');
  assert.equal(value(body, 'data-cart-total'), '¥398');
  assert.match(
    find(body, (node) => node.getAttribute('data-cart-shipping-hint') !== null)[0].textContent,
    /已满示例包邮门槛 ¥299/,
  );
  assert.match(byClass(body, 'jq-cart__status')[0].textContent, /示例金额已更新/);
  assert.match(byClass(body, 'jq-cart__status')[0].textContent, /未生成订单/);

  const minus = find(body, (node) => node.getAttribute('aria-label') === '减少购物车示例数量')[0];
  minus.dispatch('click');
  assert.equal(byClass(body, 'jq-cart__qty-value')[0].textContent, '1');
  assert.equal(value(body, 'data-cart-total'), '¥211');
});

test('only an explicit personal confirmation produces a demo receipt; cancel creates no order', () => {
  const doc = createFakeDocument();
  const cart = createCart();
  cart.setItem('blood-pressure', 'standard', 1);
  const body = renderCartBody(doc, () => {}, { cart });

  const confirmInput = find(body, (node) => node.getAttribute('type') === 'checkbox')[0];
  const confirm = byText(body, '确认模拟提交（不会真实成交）')[0];
  const cancel = byText(body, '取消确认')[0];
  const receipt = byClass(body, 'jq-cart__receipt')[0];
  const status = byClass(body, 'jq-cart__status')[0];

  assert.equal(confirm.disabled, true);
  assert.equal(receipt.hidden, true);
  assert.match(textOf(body), /本人确认/);
  assert.match(textOf(body), /模拟订单 · 未支付 · 未发货/);

  confirm.dispatch('click');
  assert.match(status.textContent, /请先勾选/);
  assert.equal(receipt.hidden, true);

  confirmInput.checked = true;
  confirmInput.dispatch('change');
  assert.equal(confirm.disabled, false);
  confirm.dispatch('click');

  assert.equal(receipt.hidden, false);
  const receiptText = textOf(receipt);
  assert.match(receiptText, /模拟回执/);
  assert.match(receiptText, /DEMO-M03-BLOOD-PRESSURE/);
  assert.match(receiptText, /未支付 · 未发货 · 未生成真实订单/);
  assert.match(receiptText, /不是订单凭证/);
  assert.doesNotMatch(receiptText, /已支付|已发货/);
  assert.match(status.textContent, /没有扣款、没有发货/);
  assert.equal(cart.getItem()?.productId, 'blood-pressure');

  cancel.dispatch('click');
  assert.equal(receipt.hidden, true);
  assert.equal(confirmInput.checked, false);
  assert.equal(confirm.disabled, true);
  assert.match(status.textContent, /已取消确认/);
  assert.match(status.textContent, /没有生成订单/);
  assert.equal(cart.getItem()?.productId, 'blood-pressure');

  // 金额变化会让上一份演示回执失效，避免回执金额与最新预览不一致。
  confirmInput.checked = true;
  confirmInput.dispatch('change');
  confirm.dispatch('click');
  assert.equal(receipt.hidden, false);
  find(body, (node) => node.getAttribute('aria-label') === '增加购物车示例数量')[0].dispatch(
    'click',
  );
  assert.equal(receipt.hidden, true);
  assert.equal(confirmInput.checked, false);
  assert.equal(value(body, 'data-cart-total'), '¥398');
});

test('the failure demo and clearing the cart never create an order', () => {
  const doc = createFakeDocument();
  const cart = createCart();
  cart.setItem('blood-pressure', 'standard', 1);
  const body = renderCartBody(doc, () => {}, { cart });

  const failure = byClass(body, 'jq-cart__failure')[0];
  const receipt = byClass(body, 'jq-cart__receipt')[0];
  assert.equal(failure.hidden, true);

  byText(body, '查看模拟失败示例')[0].dispatch('click');
  assert.equal(failure.hidden, false);
  assert.match(textOf(failure), /模拟库存校验未通过/);
  assert.match(textOf(failure), /未生成订单、未扣款、未发货/);
  assert.equal(receipt.hidden, true);
  assert.equal(cart.getItem()?.productId, 'blood-pressure');

  const order = byClass(body, 'jq-cart__order')[0];
  const cartSection = byClass(body, 'jq-cart__section')[0];
  byText(body, '清空购物车（示例）')[0].dispatch('click');
  assert.equal(cart.getItem(), null);
  assert.equal(cartSection.hidden, true);
  assert.equal(order.hidden, true);
  assert.equal(byClass(body, 'jq-cart__empty')[0].hidden, false);
  assert.equal(
    byClass(body, 'jq-cart__status')[0].textContent,
    '已清空示例购物车：没有生成订单，也没有发起支付。',
  );
  assert.doesNotMatch(textOf(body), /示例路/);
  assert.doesNotMatch(textOf(body), /模拟回执/);
});

test('an out-of-stock or unavailable cart line is blocked before any amount or address is shown', () => {
  const outOfStockDoc = createFakeDocument();
  const outOfStockCart = createCart();
  outOfStockCart.setItem('blood-pressure', 'gift', 2);
  const outOfStockBody = renderCartBody(outOfStockDoc, () => {}, { cart: outOfStockCart });

  const unavailable = byClass(outOfStockBody, 'jq-cart__unavailable')[0];
  assert.equal(unavailable.hidden, false);
  assert.match(textOf(unavailable), /无货示例/);
  assert.match(textOf(unavailable), /不会显示可结算金额/);
  assert.equal(byClass(outOfStockBody, 'jq-cart__order').length, 0);
  assert.equal(byClass(outOfStockBody, 'jq-cart__confirm').length, 0);
  assert.equal(
    find(outOfStockBody, (node) => node.getAttribute('data-cart-total') !== null).length,
    0,
  );
  assert.doesNotMatch(textOf(outOfStockBody), /示例路/);

  const missingDoc = createFakeDocument();
  const missingCart = createCart();
  missingCart.setItem('reading-lamp', 'standard', 1);
  const missingBody = renderCartBody(missingDoc, () => {}, { cart: missingCart });
  assert.match(textOf(byClass(missingBody, 'jq-cart__unavailable')[0]), /当前不能结算/);
  assert.equal(byClass(missingBody, 'jq-cart__order').length, 0);
});

test('a public terminal gets a block notice instead of private address or confirmation', () => {
  const doc = createFakeDocument();
  const cart = createCart();
  cart.setItem('blood-pressure', 'standard', 1);
  const body = renderCartBody(doc, () => {}, { cart, isPublicMode: () => true });

  const blocked = byClass(body, 'jq-cart__blocked')[0];
  assert.equal(blocked.hidden, false);
  assert.match(textOf(blocked), /公共终端不展示购物车与收货信息/);
  assert.match(textOf(blocked), /不会展示私人地址/);
  assert.equal(byClass(body, 'jq-cart__order').length, 0);
  assert.equal(byClass(body, 'jq-cart__confirm').length, 0);
  assert.doesNotMatch(textOf(body), /示例路/);
  assert.doesNotMatch(textOf(body), /138\*\*\*\*0000/);
});

test('M02 detail hands off to M03, and the cart can return to the same product detail', () => {
  const doc = createFakeDocument();
  const { shell, show } = mountApp(doc, undefined);

  show('product:blood-pressure');
  const productBody = shell.body.childNodes[0];
  find(productBody, (node) => node.getAttribute('aria-label') === '增加演示数量')[0].dispatch(
    'click',
  );
  byText(productBody, '加入购物车（示例）')[0].dispatch('click');

  const cartBody = shell.body.childNodes[0];
  assert.equal(byClass(cartBody, 'jq-scene--cart').length, 1);
  assert.equal(value(cartBody, 'data-cart-subtotal'), '¥398');
  assert.equal(value(cartBody, 'data-cart-total'), '¥398');

  const back = byClass(cartBody, 'jq-scene__back')[0];
  assert.equal(back.getAttribute('data-route'), 'product:blood-pressure');
  assert.match(back.textContent, /返回商品详情/);
  back.dispatch('click');

  const returned = shell.body.childNodes[0];
  assert.equal(byClass(returned, 'jq-scene--product').length, 1);
  const backToCart = byClass(returned, 'jq-scene__back')[0];
  assert.equal(backToCart.getAttribute('data-route'), 'cart');
  assert.match(backToCart.textContent, /返回购物车/);
});

test('a public terminal cannot open the cart route', () => {
  const doc = createFakeDocument();
  const { shell, show } = mountApp(doc, undefined, { deviceMode: 'public' });

  assert.equal(show('cart'), 'public');
  assert.equal(shell.getMode(), 'public');
  assert.equal(byClass(shell.element, 'jq-scene--cart').length, 0);
});

test('M03 cart styles are theme-variable driven and cover its real states', () => {
  const css = readFileSync(new URL('../web/assets/components.css', import.meta.url), 'utf8');
  for (const selector of [
    '.jq-cart__line {',
    '.jq-cart__order-head {',
    '.jq-cart__badge {',
    '.jq-cart__totals {',
    '.jq-cart__confirm {',
    '.jq-cart__checkbox {',
    '.jq-cart__failure {',
    '.jq-cart__failure[hidden],',
    '.jq-cart__receipt {',
    '.jq-cart__receipt-state {',
    '.jq-cart__blocked,',
    '.jq-cart__boundary {',
  ]) {
    assert.ok(css.includes(selector), 'missing cart style ' + selector);
  }
  assert.equal(/\.(a|b)-[a-z]/.test(css), false, 'no per-theme page classes may enter the styles');
});

test('the cart resolution boundary trusts the current M02 spec state, not a stale cart line', () => {
  const ok = resolveCartLine({ productId: 'blood-pressure', specId: 'standard', quantity: 1 });
  assert.equal(ok.status, 'ok');
  assert.equal(ok.totals?.total, 211);

  const gift = resolveCartLine({ productId: 'blood-pressure', specId: 'gift', quantity: 1 });
  assert.equal(gift.status, 'out-of-stock');
  assert.equal(gift.totals, null);

  const missing = resolveCartLine({ productId: 'blood-pressure', specId: 'nope', quantity: 1 });
  assert.equal(missing.status, 'unavailable');
  assert.equal(resolveCartLine(null).status, 'empty');
});
