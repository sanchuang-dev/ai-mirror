import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { mountApp } from '../web/assets/app.js';
import { getShopProductDetail } from '../web/data/api.js';
import { renderProductDetailBody } from '../web/pages/product.js';
import { collect, createFakeDocument } from './helpers/fake-dom.mjs';

/** @param {import('./helpers/fake-dom.mjs').FakeNode} root @param {(node: import('./helpers/fake-dom.mjs').FakeNode) => boolean} predicate */
const find = (root, predicate) => collect(root, predicate);

/** @param {import('./helpers/fake-dom.mjs').FakeNode} root @param {string} className */
const byClass = (root, className) => find(root, (node) => node.classList.contains(className));

/** @param {import('./helpers/fake-dom.mjs').FakeNode} root @param {string} text */
const byText = (root, text) => find(root, (node) => node.textContent === text);

/** @param {import('./helpers/fake-dom.mjs').FakeNode} root @param {string} specId */
const specButton = (root, specId) =>
  find(root, (node) => node.getAttribute('data-spec') === specId)[0];

/** @param {import('../web/components/app-shell.js').SceneShell} shell @param {string} route */
function clickRoute(shell, route) {
  const entry = find(shell.element, (node) => node.getAttribute('data-route') === route)[0];
  assert.ok(entry, 'expected a navigation entry for route ' + route);
  entry.dispatch('click');
  return entry;
}

const entry = getShopProductDetail('blood-pressure');

test('M02 detail reuses the M01 product/store facts and labels every sample condition', () => {
  assert.ok(entry, 'blood-pressure must be readable through the single shop API');
  assert.ok(entry.detail, 'the sample product must have M02 detail data');
  assert.equal(entry.product.id, 'blood-pressure');
  assert.equal(entry.store.id, 'yunqi-life');
  assert.match(entry.store.name, /虚构示例/);

  const detail = entry.detail;
  assert.ok(detail.specs.length >= 2, 'spec selection needs at least two sample specs');
  assert.ok(detail.specs.some((spec) => spec.id === detail.defaultSpecId));
  const outOfStock = detail.specs.find((spec) => spec.availability === 'out-of-stock-example');
  assert.ok(outOfStock, 'the page needs an explicit out-of-stock sample state');
  assert.match(outOfStock.availabilityLabel, /无货示例/);

  // 价格只维护一份事实：详情中的示例单价必须出现在 M01 商品价格字符串里。
  assert.ok(
    entry.product.price.includes('¥' + detail.pricing.unitPrice),
    'detail unitPrice and the M01 price label must describe the same sample price',
  );
  assert.match(entry.product.price, /示例/);
  assert.ok(detail.pricing.quantityLimit >= 2);
  assert.match(detail.pricing.quantityNote, /不是库存限制/);
  assert.equal(detail.shipping.freeFrom, 299);
  assert.equal(detail.shipping.fee, 12);
  assert.match(detail.shipping.note, /示例规则/);
  assert.match(detail.shipping.note, /M03/);

  for (const field of ['region', 'fulfillmentParty', 'delivery', 'afterSales', 'stockNote']) {
    assert.ok(detail[field], field + ' must be present');
    assert.match(detail[field], /示例|未接入|虚构/, field + ' must stay explicitly sample');
  }
  assert.match(detail.stockNote, /未接入真实库存/);
  assert.match(detail.delivery, /不承诺真实送达时间/);
  assert.match(detail.afterSales, /以商家确认为准/);

  assert.equal(getShopProductDetail('missing-product'), null);
  const bare = getShopProductDetail('reading-lamp');
  assert.ok(bare);
  assert.equal(bare.detail, null, 'only the sample product has complete M02 detail data');
});

test('the detail page shows specs, quantity, sample price, shipping, region, party and after-sales', () => {
  const doc = createFakeDocument();
  const body = renderProductDetailBody(doc, 'blood-pressure', () => {}, { returnRoute: 'shop' });

  assert.equal(byClass(body, 'jq-scene--product').length, 1);
  assert.equal(find(body, (node) => node.tagName === 'H1').length, 1);
  assert.equal(byText(body, '上臂式电子血压计')[0].tagName, 'H1');
  assert.match(byClass(body, 'jq-product__source')[0].textContent, /来自平台商城的示例商品列表/);

  const specs = byClass(body, 'jq-product__spec');
  assert.equal(specs.length, 2);
  assert.equal(specButton(body, 'standard').getAttribute('aria-pressed'), 'true');
  assert.equal(specButton(body, 'gift').getAttribute('aria-pressed'), 'false');

  const pageText = find(body, () => true)
    .map((node) => node.textContent)
    .join(' ');
  for (const expected of [
    '云栖优选生活馆（虚构示例）',
    '示例单价，非真实售价',
    '数量',
    '示例运费',
    '适用区域',
    '预计配送 / 服务说明',
    '售后说明',
    '店铺与履约方',
    '未接入真实库存',
    '示例画面',
  ]) {
    assert.ok(pageText.includes(expected), 'detail page must show ' + expected);
  }

  const total = byClass(body, 'jq-product__total')[0];
  assert.match(total.textContent, /¥199/);
  assert.match(total.textContent, /示例运费：¥12/);
  assert.match(total.textContent, /示例合计：¥211/);
  assert.match(total.textContent, /未接入真实结算/);

  // M02 不提供真实结算动作。
  assert.equal(byText(body, '去结算').length, 0);
  assert.equal(byText(body, '立即购买').length, 0);
  assert.equal(byText(body, '提交订单').length, 0);
  assert.ok(byText(body, '加入购物车（示例入口）')[0]);
  assert.ok(byText(body, '查看订单预览（示例入口）')[0]);
});

test('quantity is a bounded demo control and updates the sample subtotal honestly', () => {
  const doc = createFakeDocument();
  const body = renderProductDetailBody(doc, 'blood-pressure', () => {});
  const plus = find(body, (node) => node.getAttribute('aria-label') === '增加演示数量')[0];
  const minus = find(body, (node) => node.getAttribute('aria-label') === '减少演示数量')[0];
  const value = byClass(body, 'jq-product__qty-value')[0];
  const total = byClass(body, 'jq-product__total')[0];

  assert.equal(value.textContent, '1');
  assert.equal(minus.disabled, true, 'quantity cannot go below one');
  plus.dispatch('click');
  assert.equal(value.textContent, '2');
  assert.match(total.textContent, /× 2 = ¥398/);
  assert.match(total.textContent, /免运费（示例满 ¥299）/);
  assert.equal(minus.disabled, false);

  for (let index = 0; index < 20; index += 1) plus.dispatch('click');
  assert.equal(value.textContent, '9', 'demo quantity respects the declared sample limit');
  assert.equal(plus.disabled, true);

  minus.dispatch('click');
  assert.equal(value.textContent, '8');
  assert.equal(plus.disabled, false);
});

test('the out-of-stock sample spec disables both M03 placeholder entries', () => {
  const doc = createFakeDocument();
  const body = renderProductDetailBody(doc, 'blood-pressure', () => {});
  const add = byText(body, '加入购物车（示例入口）')[0];
  const preview = byText(body, '查看订单预览（示例入口）')[0];
  const warning = byClass(body, 'jq-product__stock')[0];

  assert.match(warning.textContent, /当前为正常示例状态/);
  assert.match(warning.textContent, /库存未接入/);
  assert.equal(add.disabled, false);
  assert.equal(preview.disabled, false);

  specButton(body, 'gift').dispatch('click');
  assert.equal(specButton(body, 'gift').getAttribute('aria-pressed'), 'true');
  assert.equal(specButton(body, 'standard').getAttribute('aria-pressed'), 'false');
  assert.match(warning.textContent, /无货示例状态/);
  assert.equal(add.disabled, true);
  assert.equal(preview.disabled, true);
  assert.match(byClass(body, 'jq-product__total')[0].textContent, /不提供加入购物车或订单合计/);

  // 即使合成事件绕过浏览器禁用，也不能打开购买演示。
  add.dispatch('click');
  assert.equal(byClass(body, 'jq-product__action-panel')[0].hidden, true);

  specButton(body, 'standard').dispatch('click');
  assert.match(warning.textContent, /当前为正常示例状态/);
  assert.equal(add.disabled, false);
  assert.equal(preview.disabled, false);
  assert.match(byClass(body, 'jq-product__total')[0].textContent, /示例合计：¥211/);
});

test('cart / order entries stay honest M03 placeholders and can be cancelled', () => {
  const doc = createFakeDocument();
  const body = renderProductDetailBody(doc, 'blood-pressure', () => {});
  const add = byText(body, '加入购物车（示例入口）')[0];
  const preview = byText(body, '查看订单预览（示例入口）')[0];
  const panel = byClass(body, 'jq-product__action-panel')[0];
  const cancel = byText(body, '取消演示')[0];
  const status = byClass(body, 'jq-product__status')[0];

  assert.equal(panel.hidden, true, 'the M03 placeholder starts closed');
  add.dispatch('click');
  assert.equal(panel.hidden, false);
  assert.match(byClass(body, 'jq-product__action-title')[0].textContent, /M03 待实现/);
  assert.match(byClass(body, 'jq-product__action-text')[0].textContent, /没有写入购物车/);
  assert.match(byClass(body, 'jq-product__action-text')[0].textContent, /没有创建订单/);
  assert.equal(doc.activeElement, cancel, 'the cancel action receives focus');

  cancel.dispatch('click');
  assert.equal(panel.hidden, true);
  assert.match(status.textContent, /已取消演示/);
  assert.match(status.textContent, /没有写入购物车/);
  assert.equal(doc.activeElement, add, 'cancel returns focus to the triggering entry');

  preview.dispatch('click');
  assert.equal(panel.hidden, false);
  assert.match(byClass(body, 'jq-product__action-title')[0].textContent, /订单预览/);
  assert.match(byClass(body, 'jq-product__action-text')[0].textContent, /没有生成订单预览/);
  cancel.dispatch('click');
  assert.equal(panel.hidden, true);
  assert.match(status.textContent, /没有生成订单预览/);
  assert.equal(doc.activeElement, preview);
});

test('products without M02 detail data get an honest unavailable state, not invented facts', () => {
  const doc = createFakeDocument();
  const body = renderProductDetailBody(doc, 'reading-lamp', () => {});

  assert.equal(byText(body, '大字阅读灯')[0].tagName, 'H1');
  assert.equal(byClass(body, 'jq-product__spec').length, 0);
  assert.equal(byText(body, '加入购物车（示例入口）').length, 0);
  assert.equal(byText(body, '查看订单预览（示例入口）').length, 0);
  const fallback = byClass(body, 'jq-product__fallback')[0];
  const fallbackText = find(fallback, () => true)
    .map((node) => node.textContent)
    .join(' ');
  assert.match(fallbackText, /详情资料尚未补充/);
  assert.match(fallbackText, /不会编造库存/);
  assert.match(fallbackText, /不提供加入购物车或订单预览入口/);

  const unknownDoc = createFakeDocument();
  const unknown = renderProductDetailBody(unknownDoc, 'does-not-exist', () => {});
  assert.match(byText(unknown, '找不到这个示例商品')[0].textContent, /找不到/);
  const unknownText = find(byClass(unknown, 'jq-product__fallback')[0], () => true)
    .map((node) => node.textContent)
    .join(' ');
  assert.match(unknownText, /不会编造/);
});

test('mall card and AI card open the same detail page; back returns to each source', async () => {
  const doc = createFakeDocument();
  const { shell } = mountApp(doc, undefined);

  clickRoute(shell, 'shop');
  await new Promise((resolve) => setTimeout(resolve, 0));
  const shopBody = shell.body.childNodes[0];
  const card = find(shopBody, (node) => node.getAttribute('data-product') === 'blood-pressure')[0];
  assert.ok(card);
  shell.body.scrollTop = 520;
  card.dispatch('click');
  await new Promise((resolve) => setTimeout(resolve, 0));

  const fromShop = shell.body.childNodes[0];
  assert.equal(shell.body.scrollTop, 0, 'a detail entry always starts at the page head');
  assert.equal(byClass(shell.element, 'jq-scene--product').length, 1);
  assert.equal(byText(fromShop, '上臂式电子血压计')[0].tagName, 'H1');
  assert.match(byClass(fromShop, 'jq-product__source')[0].textContent, /平台商城的示例商品列表/);
  const shopBack = byClass(fromShop, 'jq-scene__back')[0];
  assert.equal(shopBack.getAttribute('data-route'), 'shop');
  assert.match(shopBack.textContent, /返回商品列表/);

  shopBack.dispatch('click');
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(shell.body.childNodes[0], shopBody, 'back must restore the cached mall body');
  assert.equal(doc.activeElement, card, 'back hands focus to the triggering product card');

  clickRoute(shell, 'ai');
  const aiBody = shell.body.childNodes[0];
  const aiCard = find(
    aiBody,
    (node) => node.getAttribute('data-route') === 'product:blood-pressure',
  )[0];
  aiCard.dispatch('click');
  await new Promise((resolve) => setTimeout(resolve, 0));

  const fromAi = shell.body.childNodes[0];
  assert.equal(byText(fromAi, '上臂式电子血压计')[0].tagName, 'H1');
  assert.match(byClass(fromAi, 'jq-product__source')[0].textContent, /未做真实比价/);
  assert.ok(byClass(fromAi, 'jq-product__spec').length >= 2);
  const aiBack = byClass(fromAi, 'jq-scene__back')[0];
  assert.equal(aiBack.getAttribute('data-route'), 'ai');
  assert.match(aiBack.textContent, /返回小暖/);

  aiBack.dispatch('click');
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(shell.body.childNodes[0], aiBody, 'the detail must return to the AI source scene');

  // 主题切换只改 Token，不重建详情 DOM。
  find(shell.element, (node) => node.getAttribute('data-route') === 'shop')[0].dispatch('click');
  await new Promise((resolve) => setTimeout(resolve, 0));
  find(
    shell.body.childNodes[0],
    (node) => node.getAttribute('data-product') === 'blood-pressure',
  )[0].dispatch('click');
  await new Promise((resolve) => setTimeout(resolve, 0));
  const productBody = shell.body.childNodes[0];
  shell.applyTheme('b');
  assert.equal(doc.documentElement.getAttribute('data-dir'), 'b');
  assert.equal(shell.body.childNodes[0], productBody, 'theme switch must not rebuild the detail');
});

test('a public terminal cannot open a product detail route', () => {
  const doc = createFakeDocument();
  const { shell, show } = mountApp(doc, undefined, { deviceMode: 'public' });

  assert.equal(show('product:blood-pressure'), 'public');
  assert.equal(shell.getMode(), 'public');
  assert.equal(byClass(shell.element, 'jq-scene--product').length, 0);
});

test('product detail styles are theme-variable driven and cover its real states', () => {
  const css = readFileSync(new URL('../web/assets/components.css', import.meta.url), 'utf8');
  for (const selector of [
    '.jq-product__main {',
    ".jq-product__spec[aria-pressed='true'] {",
    ".jq-product__spec[data-availability='out-of-stock-example'] {",
    '.jq-product__action-panel {',
    '.jq-product__action-panel[hidden] {',
    '.jq-product__fulfillment-grid {',
    '.jq-product__boundary {',
  ]) {
    assert.ok(css.includes(selector), 'missing product detail style ' + selector);
  }
  assert.equal(/\.(a|b)-[a-z]/.test(css), false, 'no per-theme page classes may enter the styles');
});
