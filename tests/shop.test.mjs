import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { mountApp } from '../web/assets/app.js';
import { getShopContent, searchShopProducts } from '../web/data/api.js';
import { renderShopBody } from '../web/pages/shop.js';
import { collect, createFakeDocument } from './helpers/fake-dom.mjs';

/** Flush the page's async data-adapter chain (microtasks) before asserting. */
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

/** @param {import('./helpers/fake-dom.mjs').FakeNode} root */
const find = (root, predicate) => collect(root, predicate);

/** @param {import('./helpers/fake-dom.mjs').FakeNode} body */
const resultsNode = (body) => find(body, (node) => node.classList.contains('jq-shop__results'))[0];

/** @param {import('./helpers/fake-dom.mjs').FakeNode} body */
const stateOf = (body) => resultsNode(body).getAttribute('data-state');

/** @param {import('./helpers/fake-dom.mjs').FakeNode} body */
const productIds = (body) =>
  find(resultsNode(body), (node) => node.hasAttribute('data-product')).map((node) =>
    node.getAttribute('data-product'),
  );

/** @param {import('./helpers/fake-dom.mjs').FakeNode} body */
const pressedCategory = (body) => {
  const pressed = find(
    body,
    (node) => node.hasAttribute('data-category') && node.getAttribute('aria-pressed') === 'true',
  )[0];
  return pressed ? pressed.getAttribute('data-category') : null;
};

/** @param {import('./helpers/fake-dom.mjs').FakeNode} body */
const pressedStore = (body) => {
  const pressed = find(
    body,
    (node) => node.hasAttribute('data-store') && node.getAttribute('aria-pressed') === 'true',
  )[0];
  return pressed ? pressed.getAttribute('data-store') : null;
};

/** @param {import('./helpers/fake-dom.mjs').FakeNode} body */
const searchField = (body) => find(body, (node) => node.classList.contains('jq-search__field'))[0];

/** @param {import('./helpers/fake-dom.mjs').FakeNode} body */
const searchForm = (body) => find(body, (node) => node.classList.contains('jq-programs-search'))[0];

/** @param {import('./helpers/fake-dom.mjs').FakeNode} body */
const detailNode = (body) => find(body, (node) => node.classList.contains('jq-shop-detail'))[0];

/** @param {import('./helpers/fake-dom.mjs').FakeNode} body */
const detailTitle = (body) =>
  find(body, (node) => node.classList.contains('jq-shop-detail__title'))[0]?.textContent ?? null;

/** @param {import('./helpers/fake-dom.mjs').FakeNode} body */
const stateTitle = (body) =>
  find(body, (node) => node.classList.contains('jq-programs__state-title'))[0]?.textContent ?? '';

/** @param {import('./helpers/fake-dom.mjs').FakeNode} body @param {string} id */
function clickCategory(body, id) {
  const tab = find(body, (node) => node.getAttribute('data-category') === id)[0];
  assert.ok(tab, 'expected a category tab for ' + id);
  tab.dispatch('click');
}

/** @param {import('./helpers/fake-dom.mjs').FakeNode} body @param {string} id */
function clickStore(body, id) {
  const chip = find(body, (node) => node.getAttribute('data-store') === id)[0];
  assert.ok(chip, 'expected a store entry for ' + id);
  chip.dispatch('click');
}

/** @param {import('./helpers/fake-dom.mjs').FakeNode} body @param {string} keyword */
function submitKeyword(body, keyword) {
  searchField(body).value = keyword;
  searchForm(body).dispatch('submit', { preventDefault() {} });
}

/** @param {import('./helpers/fake-dom.mjs').FakeNode} body @param {string} id */
function clickProduct(body, id) {
  const card = find(body, (node) => node.getAttribute('data-product') === id)[0];
  assert.ok(card, 'expected a product card for ' + id);
  card.dispatch('click');
  return card;
}

/** @param {import('../web/components/app-shell.js').SceneShell} shell @param {string} route */
function clickRoute(shell, route) {
  const entry = find(shell.element, (node) => node.getAttribute('data-route') === route)[0];
  assert.ok(entry, 'expected a formal navigation entry for route ' + route);
  entry.dispatch('click');
  return entry;
}

const content = getShopContent();
const storeOf = (id) => content.stores.find((store) => store.id === id);
const categoryOf = (id) => content.products.find((product) => product.id === id)?.category;

test('M01 fixture is explicit sample data with categories, stores and stable product ids', () => {
  assert.equal(content.demo.level, 'S1');
  assert.match(content.demo.notice, /示例/);
  assert.match(content.searchHint, /示例/);

  assert.deepEqual(
    content.categories.map((entry) => entry.id),
    ['all', 'daily', 'craft', 'service', 'member'],
  );

  const storeIds = new Set();
  for (const store of content.stores) {
    assert.equal(storeIds.has(store.id), false, 'store ids must be unique');
    storeIds.add(store.id);
    assert.match(store.name, /虚构|示例/, store.id + ' must be labelled as sample');
    assert.ok(store.kind, store.id + ' must define a store kind');
  }

  const seen = new Set();
  let featured = 0;
  for (const product of content.products) {
    assert.equal(seen.has(product.id), false, 'product ids must be unique');
    seen.add(product.id);
    assert.ok(['daily', 'craft', 'service', 'member'].includes(product.category));
    assert.ok(storeIds.has(product.storeId), product.id + ' must reference a listed store');
    for (const field of ['title', 'meta', 'summary', 'price', 'tags']) {
      assert.ok(product[field], product.id + ' must define ' + field);
    }
    assert.match(product.price, /示例/, product.id + ' price must be labelled');
    assert.match(product.image, /^art-.+\.jpg$/);
    assert.match(product.imageAlt, /氛围画面/);
    // 不编造库存、销量、评分或限时抢购等真实交易压力。
    assert.doesNotMatch(product.meta + product.summary + product.tags, /库存|销量|评分|抢购|仅剩/);
    if (product.featured) featured += 1;
  }
  assert.ok(featured >= 2, 'the platform needs a real 平台精选 section');

  // 每个类目至少有一个可浏览的示例商品，避免空壳类目。
  for (const category of ['daily', 'craft', 'service', 'member']) {
    assert.ok(
      content.products.some((product) => product.category === category),
      category + ' must contain sample products',
    );
  }
});

test('searchShopProducts applies category, store and keyword as one combined filter', async () => {
  const all = await searchShopProducts({ category: 'all' });
  assert.equal(all.status, 'ok');
  assert.equal(all.items.length, content.products.length);

  const daily = await searchShopProducts({ category: 'daily' });
  assert.ok(daily.items.length >= 2);
  assert.ok(daily.items.every((product) => product.category === 'daily'));

  const store = await searchShopProducts({ category: 'all', store: 'wenyu-studio' });
  assert.ok(store.items.length >= 3);
  assert.ok(store.items.every((product) => product.storeId === 'wenyu-studio'));

  const combined = await searchShopProducts({ category: 'craft', store: 'yunqi-life' });
  assert.equal(combined.status, 'empty');
  assert.equal(combined.items.length, 0);

  const hit = await searchShopProducts({ category: 'all', store: 'all', keyword: '茶具' });
  assert.deepEqual(
    hit.items.map((product) => product.id),
    ['tea-set'],
  );

  const trimmed = await searchShopProducts({ category: 'all', keyword: '  血压计  ' });
  assert.equal(trimmed.keyword, '血压计');
  assert.deepEqual(
    trimmed.items.map((product) => product.id),
    ['blood-pressure'],
  );

  const miss = await searchShopProducts({ category: 'service', keyword: '茶具' });
  assert.equal(miss.status, 'empty');
  assert.equal(miss.items.length, 0);
});

test('the mall renders one h1, featured products, categories, stores and all sample products', async () => {
  const doc = createFakeDocument();
  const body = renderShopBody(doc, content, () => {});
  await flush();

  assert.equal(find(body, (node) => node.tagName === 'H1').length, 1);
  assert.equal(find(body, (node) => node.hasAttribute('data-category')).length, 5);
  assert.equal(pressedCategory(body), 'all');
  assert.equal(find(body, (node) => node.hasAttribute('data-store')).length, 5);
  assert.equal(pressedStore(body), 'all');

  const featured = find(body, (node) => node.classList.contains('jq-shop-featured'))[0];
  assert.ok(featured, '平台精选 must be a real section');
  assert.equal(
    find(featured, (node) => node.hasAttribute('data-product')).length,
    content.products.filter((product) => product.featured).length,
  );

  assert.equal(stateOf(body), 'ok');
  assert.deepEqual(
    productIds(body),
    content.products.map((product) => product.id),
  );

  // 商品卡上写清楚店铺来源与「示例」边界。
  const storeLines = find(resultsNode(body), (node) =>
    node.classList.contains('jq-shop-card__store'),
  );
  assert.equal(storeLines.length, content.products.length);
  for (const line of storeLines) assert.match(line.textContent, /入驻商家 · .+示例/);

  const badges = find(resultsNode(body), (node) => node.classList.contains('jq-shop-card__badge'));
  assert.equal(badges.length, content.products.length);
  for (const badge of badges) assert.match(badge.textContent, /示例/);

  // 主题不分叉 DOM，类名仍是单一 jq- 体系。
  assert.equal(find(body, (node) => node.hasAttribute('data-dir')).length, 0);
  const classes = find(body, () => true).flatMap((node) =>
    node.className.split(/\s+/).filter(Boolean),
  );
  assert.ok(classes.length > 10);
  assert.ok(classes.every((name) => name.startsWith('jq-')));
});

test('category switching really changes the list and keeps the highlighted scope honest', async () => {
  const doc = createFakeDocument();
  const body = renderShopBody(doc, content, () => {});
  await flush();

  clickCategory(body, 'daily');
  await flush();
  assert.equal(pressedCategory(body), 'daily');
  assert.deepEqual(
    productIds(body),
    content.products.filter((product) => product.category === 'daily').map((p) => p.id),
  );

  clickCategory(body, 'craft');
  await flush();
  assert.equal(pressedCategory(body), 'craft');
  assert.ok(productIds(body).every((id) => categoryOf(id) === 'craft'));

  clickCategory(body, 'all');
  await flush();
  assert.equal(productIds(body).length, content.products.length);
});

test('store entries filter by source, combine with categories and offer a real way back', async () => {
  const doc = createFakeDocument();
  const body = renderShopBody(doc, content, () => {});
  await flush();

  clickStore(body, 'yunqi-life');
  await flush();
  assert.equal(pressedStore(body), 'yunqi-life');
  assert.deepEqual(
    productIds(body),
    content.products.filter((product) => product.storeId === 'yunqi-life').map((p) => p.id),
  );
  assert.ok(
    find(resultsNode(body), (node) => node.classList.contains('jq-shop-card__store')).every(
      (line) => line.textContent.includes(storeOf('yunqi-life').name),
    ),
  );

  // 店铺 + 类目组合无结果：不是空壳，必须写出范围并提供恢复路径。
  clickCategory(body, 'service');
  await flush();
  assert.equal(stateOf(body), 'empty');
  assert.match(stateTitle(body), /本地服务/);
  assert.ok(stateTitle(body).includes(storeOf('yunqi-life').name));
  assert.equal(productIds(body).length, 0);

  find(body, (node) => node.textContent === '看全部店铺')[0].dispatch('click');
  await flush();
  assert.equal(pressedStore(body), 'all');
  assert.equal(stateOf(body), 'ok');
  assert.ok(productIds(body).every((id) => categoryOf(id) === 'service'));

  clickCategory(body, 'all');
  await flush();
  assert.equal(pressedCategory(body), 'all');
  assert.equal(productIds(body).length, content.products.length);
});

test('keyword filtering has a real hit, an explicit empty state and a reset', async () => {
  const doc = createFakeDocument();
  const body = renderShopBody(doc, content, () => {});
  await flush();

  submitKeyword(body, '茶具');
  await flush();
  assert.equal(stateOf(body), 'ok');
  assert.deepEqual(productIds(body), ['tea-set']);

  // 关键词保持时切到本地服务：如实无结果，并写出类目与关键词。
  clickCategory(body, 'service');
  await flush();
  assert.equal(stateOf(body), 'empty');
  assert.match(stateTitle(body), /本地服务/);
  assert.match(stateTitle(body), /茶具/);
  assert.equal(productIds(body).length, 0);

  find(body, (node) => node.textContent === '清除筛选')[0].dispatch('click');
  await flush();
  assert.equal(searchField(body).value, '');
  assert.equal(pressedCategory(body), 'all');
  assert.equal(pressedStore(body), 'all');
  assert.equal(stateOf(body), 'ok');
  assert.equal(productIds(body).length, content.products.length);
});

test('the loading state is real and shown while the mall adapter is pending', async () => {
  const doc = createFakeDocument();
  /** @type {(value: import('../web/data/api.js').ShopSearchResult) => void} */
  let resolveSearch = () => {};
  const pending = new Promise((resolve) => {
    resolveSearch = resolve;
  });
  const body = renderShopBody(doc, content, () => {}, { search: () => pending });

  assert.equal(stateOf(body), 'loading');
  assert.match(stateTitle(body), /正在/);

  resolveSearch({
    status: 'ok',
    keyword: '',
    category: 'all',
    store: 'all',
    items: content.products,
  });
  await flush();
  assert.equal(stateOf(body), 'ok');
  assert.equal(productIds(body).length, content.products.length);
});

test('a failing mall adapter shows an explicit failure state that can retry', async () => {
  const doc = createFakeDocument();
  let attempts = 0;
  const body = renderShopBody(doc, content, () => {}, {
    search: (query) => {
      attempts += 1;
      if (attempts === 1) return Promise.reject(new Error('example mall adapter unavailable'));
      return searchShopProducts(query);
    },
  });
  await flush();

  assert.equal(stateOf(body), 'error');
  assert.match(stateTitle(body), /读不到/);

  find(body, (node) => node.textContent === '重试')[0].dispatch('click');
  await flush();
  assert.equal(attempts, 2);
  assert.equal(stateOf(body), 'ok');
});

test('the product detail entry is honest about M02 and never offers a fake checkout', async () => {
  const doc = createFakeDocument();
  const body = renderShopBody(doc, content, () => {});
  await flush();

  const detail = detailNode(body);
  assert.equal(detail.hidden, true, 'the detail entry starts closed');

  const card = clickProduct(body, 'blood-pressure');
  assert.equal(detail.hidden, false);
  assert.equal(detailTitle(body), '上臂式电子血压计');
  assert.equal(doc.activeElement, detail, 'opening moves focus into the detail entry');

  const note = find(detail, (node) => node.classList.contains('jq-shop-detail__note'))[0];
  assert.match(note.textContent, /M02/);
  assert.match(note.textContent, /不能加入购物车、下单或付款/);
  const storeValue = find(detail, (node) => node.classList.contains('jq-shop-detail__value'))[0];
  assert.equal(storeValue.textContent, '云栖优选生活馆（虚构示例）');
  assert.equal(find(detail, (node) => node.textContent === '加入购物车').length, 0);
  assert.equal(find(detail, (node) => node.textContent === '去结算').length, 0);

  find(detail, (node) => node.classList.contains('jq-shop-detail__close'))[0].dispatch('click');
  assert.equal(detail.hidden, true);
  assert.equal(doc.activeElement, card, 'returning hands focus back to the triggering card');

  // 新的筛选会让旧商品入口失效，避免旧上下文留在新结果里。
  clickProduct(body, 'tea-set');
  assert.equal(detail.hidden, false);
  clickCategory(body, 'service');
  await flush();
  assert.equal(detail.hidden, true);
  assert.equal(detailTitle(body), null);
  assert.equal(doc.activeElement, resultsNode(body));
});

test('H01 mall navigation opens M01, survives theme switching and returns home', async () => {
  const doc = createFakeDocument();
  const { shell } = mountApp(doc, undefined);

  clickRoute(shell, 'shop');
  await flush();
  const shopBody = shell.body.childNodes[0];
  assert.equal(find(shell.element, (node) => node.classList.contains('jq-scene--shop')).length, 1);
  assert.equal(find(shell.element, (node) => node.classList.contains('jq-home-body')).length, 0);
  assert.equal(find(shopBody, (node) => node.tagName === 'H1')[0].textContent, '平台商城');
  assert.equal(pressedCategory(shopBody), 'all');

  shell.applyTheme('b');
  assert.equal(doc.documentElement.getAttribute('data-dir'), 'b');
  assert.equal(shell.body.childNodes[0], shopBody, 'theme switch must not rebuild the mall');

  // M01 的返回按钮回到来源页面（首页），而不是落在无路可退的空场景。
  const back = find(shopBody, (node) => node.classList.contains('jq-scene__back'))[0];
  assert.equal(back.getAttribute('data-route'), 'home');
  back.dispatch('click');
  await flush();
  assert.equal(find(shell.element, (node) => node.classList.contains('jq-home-body')).length, 1);

  // 返回后再次进入复用同一个商城场景（筛选与滚动状态不重置）。
  clickRoute(shell, 'shop');
  await flush();
  assert.equal(shell.body.childNodes[0], shopBody);
});

test('the AI product card enters M01 and its return path goes back to 小暖', async () => {
  const doc = createFakeDocument();
  const { shell } = mountApp(doc, undefined);

  clickRoute(shell, 'ai');
  const aiBody = shell.body.childNodes[0];
  const productEntry = find(aiBody, (node) => node.getAttribute('data-route') === 'shop')[0];
  assert.ok(productEntry, 'the AI product card must enter the platform mall');
  assert.equal(productEntry.textContent, '去平台商城看看');

  productEntry.dispatch('click');
  await flush();
  const shopBody = shell.body.childNodes[0];
  assert.equal(find(shell.element, (node) => node.classList.contains('jq-scene--shop')).length, 1);
  const back = find(shopBody, (node) => node.classList.contains('jq-scene__back'))[0];
  assert.equal(back.getAttribute('data-route'), 'ai');
  assert.match(back.textContent, /返回小暖/);

  back.dispatch('click');
  await flush();
  assert.equal(shell.body.childNodes[0], aiBody, 'the mall must return to the AI source scene');
});

test('a public terminal cannot navigate into the personal mall', async () => {
  const doc = createFakeDocument();
  const { shell, show } = mountApp(doc, undefined, { deviceMode: 'public' });
  assert.equal(show('shop'), 'public');
  assert.equal(shell.getMode(), 'public');
  assert.equal(find(shell.element, (node) => node.classList.contains('jq-scene--shop')).length, 0);
});

test('mall styles stay theme-variable driven with visible state styles', () => {
  const css = readFileSync(new URL('../web/assets/components.css', import.meta.url), 'utf8');
  assert.match(css, /\.jq-shop__grid \{/);
  assert.match(css, /\.jq-shop-featured \{/);
  assert.match(css, /\.jq-shop-stores \{/);
  assert.match(css, /\.jq-shop-detail \{/);
  assert.match(css, /\.jq-programs__state--loading \{/);
  assert.match(css, /\.jq-programs__state--empty \{/);
  assert.match(css, /\.jq-programs__state--error \{/);
  // 主题差异只允许来自 tokens 变量，不新增按主题分叉的页面类。
  assert.equal(/\.(a|b)-[a-z]/.test(css), false, 'no per-theme page classes may enter the styles');
});
