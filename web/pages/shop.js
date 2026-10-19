/**
 * M01 平台商城首页（Issue #15，复用共享场景壳）。
 *
 * 只交付商城浏览本身：平台精选、类目、店铺来源、示例商品列表、基本筛选
 * （类目 + 店铺 + 关键词）以及进入商品详情的入口。A/B 主题只改 CSS 变量，
 * 不为两套主题各写一份列表。
 *
 * 商品详情（规格 / 数量 / 运费 / 履约 / 售后）归 M02，由列表卡片进入统一
 * `product:<id>` 路由；本页不再内嵌第二份详情语义。
 *
 * 数据只来自 `web/data/api.js` 的异步示例出口；页面据此展示加载 / 命中 /
 * 无结果 / 失败四种状态，不做装饰性假搜索框。
 *
 * 边界：
 * - 购物车、订单与支付归 M03，本页不显示「加入购物车」「去结算」等假动作；
 * - 店铺入驻后台、真实库存 / 营销算法与外部电商跳转不在本卡范围。
 */
import { createMedia, createNode } from '../components/kit.js';
import { searchShopProducts } from '../data/api.js';
import { productRoute } from './product.js';

/** @typedef {import('../data/fixtures/shop.fixture.js').ShopFixture} ShopContent */
/** @typedef {import('../data/fixtures/shop.fixture.js').ShopProduct} ShopProduct */
/** @typedef {import('../data/fixtures/shop.fixture.js').ShopStore} ShopStore */
/** @typedef {import('../data/api.js').ShopSearchResult} ShopSearchResult */

/** A shop scene owns its filter state; the shell only asks it to update the return path. */
/** @type {WeakMap<HTMLElement, {setReturnRoute: (route: string) => void}>} */
const shopControls = new WeakMap();

/**
 * 更新「返回」去向：从首页进来回首页，从 AI 商品卡进来回小暖。
 * Call only after the body is inserted into the mounted shell.
 * @param {HTMLElement} body
 * @param {string} route
 */
export function setShopReturnRoute(body, route) {
  shopControls.get(body)?.setReturnRoute(route);
}

/**
 * @param {string} route
 * @returns {string}
 */
function returnLabel(route) {
  if (route === 'ai') return '‹ 返回小暖';
  if (route === 'activity') return '‹ 返回活动目录';
  if (route === 'video') return '‹ 返回看节目';
  if (route === 'search' || route.startsWith('programs')) return '‹ 返回节目目录';
  if (route === 'home' || route === 'shop') return '‹ 返回首页';
  return '‹ 返回上一页';
}

/**
 * @typedef {object} ShopOptions
 * @property {string} [returnRoute] 返回去向（首页 / AI 等源页面），缺省回首页。
 * @property {(query: { keyword?: string, category?: string, store?: string }) => Promise<ShopSearchResult>} [search]
 *   可注入的数据出口（测试用）；缺省使用 `web/data/api.js` 的 `searchShopProducts`。
 */

/**
 * @param {Document} documentRef
 * @param {ShopContent} content
 * @param {(route: string) => void} activate
 * @param {ShopOptions} [options]
 * @returns {HTMLElement}
 */
export function renderShopBody(documentRef, content, activate, options = {}) {
  const search = options.search ?? searchShopProducts;
  const body = createNode(documentRef, 'div', 'jq-scene jq-scene--shop');

  /** @type {string} */
  let returnRoute = options.returnRoute ?? 'home';

  // ---------- 场景子头：返回源页面 + 标题 + 示例边界 ----------
  const head = createNode(documentRef, 'header', 'jq-scene__head');
  const back = createNode(documentRef, 'button', 'jq-scene__back');
  back.setAttribute('type', 'button');
  back.addEventListener('click', () => activate(returnRoute));
  const titleBlock = createNode(documentRef, 'div', 'jq-scene__title');
  titleBlock.append(
    createNode(documentRef, 'h1', 'jq-scene__h1', content.title),
    createNode(documentRef, 'p', 'jq-scene__sub', content.sub),
    createNode(documentRef, 'p', 'jq-scene__demo', content.demo.notice),
  );
  head.append(back, titleBlock);
  body.append(head);

  /** 同步「返回」按钮的文字与去向；跨场景入口（首页 / AI）复用同一份控件。 */
  function syncReturn() {
    back.textContent = returnLabel(returnRoute);
    back.setAttribute('data-route', returnRoute);
  }
  syncReturn();

  // ---------- 平台精选：沿用内容优先的视觉层级，不做后台统计卡片 ----------
  const featured = content.products.filter((product) => product.featured);
  if (featured.length > 0) {
    const featuredSection = createNode(documentRef, 'section', 'jq-shop-featured');
    const featuredHead = createNode(documentRef, 'header', 'jq-shop-section-head');
    featuredHead.append(
      createNode(documentRef, 'h2', 'jq-shop-section-head__title', '平台精选'),
      createNode(
        documentRef,
        'span',
        'jq-shop-section-head__sub',
        '平台与入驻商家共同供给（示例）',
      ),
    );
    const featuredGrid = createNode(documentRef, 'div', 'jq-shop-featured__grid');
    for (const product of featured) {
      featuredGrid.append(
        renderProductCard(
          documentRef,
          product,
          storeOf(product),
          categoryLabel(product.category),
          openProduct,
          true,
        ),
      );
    }
    featuredSection.append(featuredHead, featuredGrid);
    body.append(featuredSection);
  }

  // ---------- 关键词筛选：输入 / 提交 / 清除都有真实反馈 ----------
  const form = createNode(documentRef, 'form', 'jq-programs-search');
  form.setAttribute('role', 'search');
  form.setAttribute('aria-label', '筛选商城示例商品');
  const field = /** @type {HTMLInputElement} */ (
    createNode(documentRef, 'input', 'jq-search__field')
  );
  field.setAttribute('type', 'search');
  field.setAttribute('placeholder', content.inputPlaceholder);
  field.setAttribute('aria-label', '输入商品或店铺关键词（示例筛选）');
  field.value = '';
  const submit = createNode(documentRef, 'button', 'jq-btn jq-btn--primary jq-btn--sm', '筛选');
  submit.setAttribute('type', 'submit');
  const clear = createNode(documentRef, 'button', 'jq-btn jq-btn--ghost jq-btn--sm', '清除筛选');
  clear.setAttribute('type', 'button');
  form.append(
    field,
    submit,
    clear,
    createNode(documentRef, 'p', 'jq-programs-search__hint', content.searchHint),
  );
  body.append(form);

  // ---------- 类目筛选：始终有一个明确选中项 ----------
  let category = 'all';
  const tabs = createNode(documentRef, 'div', 'jq-programs__tabs');
  tabs.setAttribute('role', 'group');
  tabs.setAttribute('aria-label', '商城类目');
  const tabButtons = content.categories.map((entry) => {
    const button = createNode(documentRef, 'button', 'jq-program-tab', entry.label);
    button.setAttribute('type', 'button');
    button.setAttribute('data-category', entry.id);
    button.addEventListener('click', () => selectCategory(entry.id));
    tabs.append(button);
    return { id: entry.id, node: button };
  });
  body.append(tabs);

  // ---------- 入驻店铺入口：店铺来源清楚可查，可只看某一家 ----------
  let store = 'all';
  const storeSection = createNode(documentRef, 'section', 'jq-shop-stores');
  const storeHead = createNode(documentRef, 'header', 'jq-shop-section-head');
  storeHead.append(
    createNode(documentRef, 'h2', 'jq-shop-section-head__title', '入驻店铺'),
    createNode(documentRef, 'span', 'jq-shop-section-head__sub', '商品来自哪家店，写在每张卡上'),
  );
  const storeList = createNode(documentRef, 'div', 'jq-shop-stores__list');
  storeList.setAttribute('role', 'group');
  storeList.setAttribute('aria-label', '入驻店铺筛选');
  const storeButtons = [
    storeChip(documentRef, 'all', '全部店铺', '不限店铺', content.products.length),
    ...content.stores.map((entry) =>
      storeChip(
        documentRef,
        entry.id,
        entry.name,
        entry.kind,
        content.products.filter((product) => product.storeId === entry.id).length,
      ),
    ),
  ];
  for (const entry of storeButtons) {
    entry.node.addEventListener('click', () => selectStore(entry.id));
    storeList.append(entry.node);
  }
  storeSection.append(storeHead, storeList);
  body.append(storeSection);

  // ---------- 结果区：加载 / 命中 / 无结果 / 失败 ----------
  const results = createNode(documentRef, 'section', 'jq-shop__results');
  results.setAttribute('aria-live', 'polite');
  results.setAttribute('aria-label', '商城商品列表与筛选结果');
  results.setAttribute('tabindex', '-1');
  body.append(results);

  body.append(createNode(documentRef, 'p', 'jq-shop__boundary', content.boundary));

  /** 请求序号：晚到的旧结果不得覆盖新一次筛选。 */
  let seq = 0;

  /** @param {string} id @returns {string} */
  function categoryLabel(id) {
    return content.categories.find((entry) => entry.id === id)?.label ?? id;
  }

  /** @param {ShopProduct} product @returns {ShopStore} */
  function storeOf(product) {
    return (
      content.stores.find((entry) => entry.id === product.storeId) ?? {
        id: product.storeId,
        name: '示例店铺（未登记）',
        kind: '示例',
      }
    );
  }

  /** @param {string} id @returns {string} */
  function storeLabel(id) {
    if (id === 'all') return '全部店铺';
    return content.stores.find((entry) => entry.id === id)?.name ?? id;
  }

  function updateFilters() {
    for (const tab of tabButtons) {
      tab.node.setAttribute('aria-pressed', tab.id === category ? 'true' : 'false');
    }
    for (const entry of storeButtons) {
      entry.node.setAttribute('aria-pressed', entry.id === store ? 'true' : 'false');
    }
  }

  /**
   * 所有商品卡共用同一个详情路由；列表不再内嵌第二份详情语义。
   * @param {ShopProduct} product
   */
  function openProduct(product) {
    activate(productRoute(product.id));
  }

  /**
   * @param {'loading' | 'ok' | 'empty' | 'error'} state
   * @param {HTMLElement[]} children
   */
  function renderState(state, children) {
    results.setAttribute('data-state', state);
    results.replaceChildren(...children);
  }

  /** 统一取数：类目、店铺与关键词都经过同一个异步数据出口。 */
  function load() {
    const keyword = field.value.trim();
    const token = (seq += 1);
    const scope = scopeLabel(categoryLabel(category), storeLabel(store));
    renderState('loading', [renderLoading(documentRef, keyword, scope)]);
    Promise.resolve()
      .then(() => search({ category, store, keyword }))
      .then((result) => {
        if (token !== seq) return; // 过期结果：多次快速切换时只保留最后一次。
        const items = result && Array.isArray(result.items) ? result.items : [];
        const shownKeyword = result?.keyword ?? keyword;
        const shownCategory = result?.category ?? category;
        const shownStore = result?.store ?? store;
        if (!result || result.status === 'empty' || items.length === 0) {
          renderState('empty', [
            renderEmpty(documentRef, {
              keyword: shownKeyword,
              scope: scopeLabel(categoryLabel(shownCategory), storeLabel(shownStore)),
              category: shownCategory,
              store: shownStore,
              onClear: resetFilters,
              onScopeAllCategory: () => {
                selectCategory('all');
              },
              onScopeAllStore: () => {
                selectStore('all');
              },
            }),
          ]);
          return;
        }
        renderState('ok', [
          renderCount(
            documentRef,
            result,
            scopeLabel(categoryLabel(shownCategory), storeLabel(shownStore)),
          ),
          renderGrid(documentRef, items, storeOf, categoryLabel, openProduct),
        ]);
      })
      .catch(() => {
        if (token !== seq) return;
        renderState('error', [renderError(documentRef, load)]);
      });
  }

  /** @param {string} next */
  function selectCategory(next) {
    if (category === next) return;
    category = next;
    updateFilters();
    load();
  }

  /** @param {string} next */
  function selectStore(next) {
    if (store === next) return;
    store = next;
    updateFilters();
    load();
  }

  function resetFilters() {
    field.value = '';
    category = 'all';
    store = 'all';
    updateFilters();
    load();
  }

  form.addEventListener('submit', (event) => {
    if (typeof event.preventDefault === 'function') event.preventDefault();
    load();
  });
  clear.addEventListener('click', resetFilters);

  shopControls.set(body, {
    setReturnRoute: (route) => {
      returnRoute = route || 'home';
      syncReturn();
    },
  });
  updateFilters();
  load();
  return body;
}

/**
 * @typedef {object} ShopStoreChip
 * @property {string} id
 * @property {HTMLButtonElement} node
 */

/**
 * @param {Document} documentRef
 * @param {string} id
 * @param {string} name
 * @param {string} kind
 * @param {number} count
 * @returns {ShopStoreChip}
 */
function storeChip(documentRef, id, name, kind, count) {
  const node = /** @type {HTMLButtonElement} */ (
    createNode(documentRef, 'button', 'jq-shop-store')
  );
  node.setAttribute('type', 'button');
  node.setAttribute('data-store', id);
  node.append(
    createNode(documentRef, 'span', 'jq-shop-store__name', name),
    createNode(documentRef, 'span', 'jq-shop-store__kind', kind),
    createNode(documentRef, 'span', 'jq-shop-store__count', count + ' 件示例商品'),
  );
  return { id, node };
}

/**
 * @param {string} category
 * @param {string} store
 * @returns {string}
 */
function scopeLabel(category, store) {
  return '「' + category + '」·「' + store + '」';
}

/**
 * @param {Document} documentRef
 * @param {string} keyword
 * @param {string} scope
 * @returns {HTMLElement}
 */
function renderLoading(documentRef, keyword, scope) {
  const node = createNode(documentRef, 'div', 'jq-programs__state jq-programs__state--loading');
  const spinner = createNode(documentRef, 'span', 'jq-programs__spinner');
  spinner.setAttribute('aria-hidden', 'true');
  node.append(
    spinner,
    createNode(
      documentRef,
      'p',
      'jq-programs__state-title',
      keyword ? '正在' + scope + '里查找「' + keyword + '」…' : '正在读取' + scope + '的示例商品…',
    ),
  );
  return node;
}

/**
 * @param {Document} documentRef
 * @param {ShopSearchResult} result
 * @param {string} scope
 * @returns {HTMLElement}
 */
function renderCount(documentRef, result, scope) {
  const label = result.keyword
    ? '在' +
      scope +
      '里找到 ' +
      result.items.length +
      ' 件与「' +
      result.keyword +
      '」相关的示例商品'
    : scope + '共 ' + result.items.length + ' 件示例商品';
  return createNode(documentRef, 'p', 'jq-programs__count', label);
}

/**
 * @param {Document} documentRef
 * @param {ShopProduct[]} products
 * @param {(product: ShopProduct) => ShopStore} storeOf
 * @param {(id: string) => string} categoryLabel
 * @param {(product: ShopProduct) => void} onOpen
 * @returns {HTMLElement}
 */
function renderGrid(documentRef, products, storeOf, categoryLabel, onOpen) {
  const grid = createNode(documentRef, 'div', 'jq-shop__grid');
  for (const product of products) {
    grid.append(
      renderProductCard(
        documentRef,
        product,
        storeOf(product),
        categoryLabel(product.category),
        onOpen,
        false,
      ),
    );
  }
  return grid;
}

/**
 * @param {Document} documentRef
 * @param {ShopProduct} product
 * @param {ShopStore} store
 * @param {string} categoryName
 * @param {(product: ShopProduct) => void} onOpen
 * @param {boolean} isFeatured
 * @returns {HTMLElement}
 */
function renderProductCard(documentRef, product, store, categoryName, onOpen, isFeatured) {
  const card = createNode(
    documentRef,
    'button',
    isFeatured ? 'jq-shop-card jq-shop-card--featured' : 'jq-shop-card',
  );
  card.setAttribute('type', 'button');
  card.setAttribute('data-product', product.id);
  card.setAttribute(
    'aria-label',
    product.title + '，' + product.price + '，入驻商家 ' + store.name + '（示例商品，查看详情）',
  );

  const media = createMedia(documentRef, product);
  media.append(
    createNode(
      documentRef,
      'span',
      'jq-shop-card__badge',
      isFeatured ? '平台精选 · 示例' : '示例商品',
    ),
  );

  const cardBody = createNode(documentRef, 'span', 'jq-shop-card__body');
  const price = createNode(documentRef, 'span', 'jq-shop-card__price');
  price.append(createNode(documentRef, 'span', 'jq-shop-card__amount', product.price));
  if (product.priceNote) {
    price.append(createNode(documentRef, 'span', 'jq-shop-card__price-note', product.priceNote));
  }
  cardBody.append(
    createNode(documentRef, 'span', 'jq-shop-card__name', product.title),
    createNode(documentRef, 'span', 'jq-shop-card__meta', product.meta),
    price,
    createNode(documentRef, 'span', 'jq-shop-card__store', '入驻商家 · ' + store.name),
    createNode(documentRef, 'span', 'jq-chip jq-shop-card__category', categoryName + ' · 示例'),
  );
  card.append(media, cardBody);
  card.addEventListener('click', () => onOpen(product));
  return card;
}

/**
 * 从商品详情返回列表时，把焦点交回触发详情的同一张卡。
 * 卡片可能位于精选区或结果区；找不到时保持当前焦点，不强行滚动。
 * @param {HTMLElement} body
 * @param {string} productId
 */
export function focusShopProduct(body, productId) {
  const card = findProductCard(body, productId);
  if (card && typeof card.focus === 'function') card.focus();
}

/**
 * @param {HTMLElement} node
 * @param {string} productId
 * @returns {HTMLElement | null}
 */
function findProductCard(node, productId) {
  if (node.getAttribute?.('data-product') === productId) return node;
  for (const child of /** @type {any} */ (node).childNodes ?? []) {
    const found = findProductCard(child, productId);
    if (found) return found;
  }
  return null;
}

/**
 * 无结果空状态：写出生效的类目 / 店铺 / 关键词，并给出可操作的回退路径。
 * @param {Document} documentRef
 * @param {{ keyword: string, scope: string, category: string, store: string, onClear: () => void, onScopeAllCategory: () => void, onScopeAllStore: () => void }} spec
 * @returns {HTMLElement}
 */
function renderEmpty(documentRef, spec) {
  const node = createNode(documentRef, 'div', 'jq-programs__state jq-programs__state--empty');
  node.append(
    createNode(
      documentRef,
      'p',
      'jq-programs__state-title',
      spec.keyword
        ? spec.scope + '里没有找到与「' + spec.keyword + '」相关的示例商品'
        : spec.scope + '暂时没有示例商品',
    ),
    createNode(
      documentRef,
      'p',
      'jq-programs__state-text',
      '类目、店铺与关键词同时生效。可以清除筛选，或换一个类目 / 店铺再看。',
    ),
  );
  const actions = createNode(documentRef, 'div', 'jq-programs__state-actions');
  actions.append(
    renderAction(documentRef, 'jq-btn jq-btn--primary jq-btn--sm', '清除筛选', spec.onClear),
  );
  if (spec.category !== 'all') {
    actions.append(
      renderAction(
        documentRef,
        'jq-btn jq-btn--ghost jq-btn--sm',
        '看全部类目',
        spec.onScopeAllCategory,
      ),
    );
  }
  if (spec.store !== 'all') {
    actions.append(
      renderAction(
        documentRef,
        'jq-btn jq-btn--ghost jq-btn--sm',
        '看全部店铺',
        spec.onScopeAllStore,
      ),
    );
  }
  node.append(actions);
  return node;
}

/**
 * @param {Document} documentRef
 * @param {() => void} onRetry
 * @returns {HTMLElement}
 */
function renderError(documentRef, onRetry) {
  const node = createNode(documentRef, 'div', 'jq-programs__state jq-programs__state--error');
  node.append(
    createNode(documentRef, 'p', 'jq-programs__state-title', '示例商城暂时读不到'),
    createNode(
      documentRef,
      'p',
      'jq-programs__state-text',
      '这是示例环境的读取失败状态：真实商城服务尚未接入，可以重试。',
    ),
    renderAction(documentRef, 'jq-btn jq-btn--primary jq-btn--sm', '重试', onRetry),
  );
  return node;
}

/**
 * @param {Document} documentRef
 * @param {string} className
 * @param {string} label
 * @param {() => void} onClick
 * @returns {HTMLElement}
 */
function renderAction(documentRef, className, label, onClick) {
  const button = createNode(documentRef, 'button', className, label);
  button.setAttribute('type', 'button');
  button.addEventListener('click', onClick);
  return button;
}
