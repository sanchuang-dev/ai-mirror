/**
 * 「看节目」节目频道 / 分类浏览 / 搜索场景正文（V01 · Issue #9，复用共享场景壳）。
 *
 * 单套 DOM + 单套数据：A/B 主题只改 CSS 变量，不为两套主题各写一份列表。
 * 分类与节目来自示例节目库，搜索走 `web/data/api.js` 的异步适配器，页面据此展示
 * 加载 / 命中 / 无结果 / 失败四种状态，不做装饰性假搜索框。
 *
 * 分类与搜索的组合语义（Review PR #38 Finding 1）：
 * **关键词只在当前选中的分类里检索**（组合筛选）。结果区每次都显示生效范围，
 * 因此高亮的分类与可见结果永远一致；带关键词时切换分类会真正改变检索范围，
 * 「先搜『梁祝』再点『老歌』」这类不匹配组合会如实给出无结果，而不是假装命中。
 *
 * 详情入口与状态同步（Review PR #38 Finding 2）：
 * 打开某节目的示例详情入口后，任何一次新的分类切换 / 关键词提交 / 清空 / 重试都会
 * 先关闭旧详情并清空其内容，因此旧的 V02 播放入口一并失效；若读屏 / 键盘焦点仍落在
 * 旧详情内，焦点会恢复到结果区，再次点击节目才展示对应详情。不重建整个场景，只清这一段。
 *
 * 边界（Issue #9）：真实节目详情 / 选集 / 播放器不在本卡范围内。仅《朝夕巷》与已有
 * V02 示例播放页存在一致映射，其余节目如实标注「详情待接入（V02 后续 Issue #10）」，
 * 不冒充任何一集。
 */
import { createMedia, createNode, createRouteButton } from '../components/kit.js';
import { searchPrograms } from '../data/api.js';

/** A program scene owns its search/category state; the shell only asks it to change. */
/** @type {WeakMap<HTMLElement, {selectCategory: (category: string) => void, focusSearch: () => void}>} */
const programControls = new WeakMap();

/** @param {HTMLElement} body @param {string} category */
export function selectProgramsCategory(body, category) {
  programControls.get(body)?.selectCategory(category);
}

/** Call only after the search scene has been inserted into the mounted shell. */
/** @param {HTMLElement} body */
export function focusProgramsSearch(body) {
  programControls.get(body)?.focusSearch();
}

/** @typedef {import('../data/fixtures/programs.fixture.js').ProgramFixture} ProgramContent */
/** @typedef {import('../data/fixtures/programs.fixture.js').ProgramItem} ProgramItem */
/** @typedef {import('../data/api.js').ProgramSearchResult} ProgramSearchResult */

/**
 * @typedef {object} ProgramsOptions
 * @property {string} [category] 初始分类，缺省为「全部」。
 * @property {boolean} [searchOpen] 从「搜一搜」进入时标记搜索视图（聚焦由挂载后的外壳执行）。
 * @property {(category: string) => void} [onCategoryChange] 分类被用户改变时同步外壳导航状态。
 * @property {(query: { keyword?: string, category?: string }) => Promise<ProgramSearchResult>} [search]
 *   可注入的数据出口（测试用）；缺省使用 `web/data/api.js` 的 `searchPrograms`。
 */

/**
 * @param {Document} documentRef
 * @param {ProgramContent} content
 * @param {(route: string) => void} activate
 * @param {ProgramsOptions} [options]
 * @returns {HTMLElement}
 */
export function renderProgramsBody(documentRef, content, activate, options = {}) {
  const search = options.search ?? searchPrograms;
  const body = createNode(documentRef, 'div', 'jq-scene jq-scene--programs');
  if (options.searchOpen) body.classList.add('jq-programs--search');

  // ---------- 场景子头：返回首页 + 标题 + 示例边界 ----------
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

  // ---------- 关键词搜索：输入 / 提交 / 清空都有真实反馈 ----------
  const form = createNode(documentRef, 'form', 'jq-programs-search');
  form.setAttribute('role', 'search');
  form.setAttribute('aria-label', '搜索节目');
  const field = /** @type {HTMLInputElement} */ (
    createNode(documentRef, 'input', 'jq-search__field')
  );
  field.setAttribute('type', 'search');
  field.setAttribute('placeholder', content.inputPlaceholder);
  field.setAttribute('aria-label', '输入节目关键词（示例搜索）');
  field.value = '';
  const submit = createNode(documentRef, 'button', 'jq-btn jq-btn--primary jq-btn--sm', '搜索');
  submit.setAttribute('type', 'submit');
  const clear = createNode(documentRef, 'button', 'jq-btn jq-btn--ghost jq-btn--sm', '清空');
  clear.setAttribute('type', 'button');
  form.append(
    field,
    submit,
    clear,
    createNode(documentRef, 'p', 'jq-programs-search__hint', content.searchHint),
  );
  body.append(form);

  // ---------- 分类筛选：始终有一个明确选中项（组合筛选的当前范围） ----------
  let category = options.category ?? 'all';
  const tabs = createNode(documentRef, 'div', 'jq-programs__tabs');
  tabs.setAttribute('role', 'group');
  tabs.setAttribute('aria-label', '节目分类');
  const tabButtons = content.categories.map((entry) => {
    const button = createNode(documentRef, 'button', 'jq-program-tab', entry.label);
    button.setAttribute('type', 'button');
    button.setAttribute('data-category', entry.id);
    button.addEventListener('click', () => {
      selectCategory(entry.id);
      options.onCategoryChange?.(entry.id);
    });
    tabs.append(button);
    return { id: entry.id, node: button };
  });
  body.append(tabs);

  // ---------- 节目详情入口（示例边界，可返回列表；放在结果之前保证可见） ----------
  const detail = createNode(documentRef, 'aside', 'jq-program-detail');
  detail.setAttribute('aria-label', '节目详情入口（示例）');
  detail.setAttribute('tabindex', '-1');
  detail.hidden = true;
  body.append(detail);

  // ---------- 结果区：加载 / 命中 / 无结果 / 失败 ----------
  // tabindex=-1：详情被新检索关闭时，键盘 / 读屏焦点可恢复到结果区。
  const results = createNode(documentRef, 'section', 'jq-programs__results');
  results.setAttribute('aria-live', 'polite');
  results.setAttribute('aria-label', '节目列表与搜索结果');
  results.setAttribute('tabindex', '-1');
  body.append(results);

  /** 请求序号：晚到的旧结果不得覆盖新一次筛选 / 搜索。 */
  let seq = 0;
  /** 本次渲染后是否需要把焦点从已关闭的详情恢复到结果区。 */
  let restoreFocus = false;
  /** 打开详情时接收焦点的卡片，用于「返回列表」时把焦点交回。 */
  /** @type {HTMLElement | null} */
  let openedCard = null;

  /** @param {string} id @returns {string} */
  function categoryLabel(id) {
    const entry = content.categories.find((item) => item.id === id);
    return entry ? entry.label : id;
  }

  function updateTabs() {
    for (const tab of tabButtons) {
      tab.node.setAttribute('aria-pressed', tab.id === category ? 'true' : 'false');
    }
  }

  /** Preserve the one mounted scene and any entered keyword during route changes. */
  function selectCategory(next) {
    if (category === next) return;
    category = next;
    updateTabs();
    load();
  }

  function focusResults() {
    if (typeof results.focus === 'function') results.focus();
  }

  /**
   * 关闭示例详情入口并清空其内容：旧节目信息与旧 V02 播放链接都随之失效。
   * 只清这一段，不重建整个场景。
   */
  function closeDetail() {
    openedCard = null;
    if (detail.hidden) return;
    detail.hidden = true;
    detail.replaceChildren();
  }

  /**
   * 统一落状态：写入 `data-state`、替换结果内容；若详情刚被关闭且焦点原本在详情内，
   * 则把焦点恢复到结果区（有效控件）。
   * @param {'loading' | 'ok' | 'empty' | 'error'} state
   * @param {HTMLElement[]} children
   */
  function renderState(state, children) {
    results.setAttribute('data-state', state);
    results.replaceChildren(...children);
    if (restoreFocus) {
      restoreFocus = false;
      focusResults();
    }
  }

  /** 统一取数：分类浏览与关键词搜索都经过同一个异步数据出口。 */
  function load() {
    const keyword = field.value.trim();
    // 新一次有效检索：先让旧详情与旧播放入口失效，并判断是否需要交回焦点。
    const focusWasInDetail =
      !detail.hidden && isFocusWithin(detail, documentRef.activeElement ?? null);
    closeDetail();
    restoreFocus = focusWasInDetail;

    const token = (seq += 1);
    renderState('loading', [renderLoading(documentRef, keyword, categoryLabel(category))]);
    Promise.resolve()
      .then(() => search({ category, keyword }))
      .then((result) => {
        if (token !== seq) return; // 过期结果：多次快速切换时只保留最后一次。
        const items = result && Array.isArray(result.items) ? result.items : [];
        const scope = result?.category ?? category;
        const shownKeyword = result?.keyword ?? keyword;
        if (!result || result.status === 'empty' || items.length === 0) {
          renderState('empty', [
            renderEmpty(documentRef, {
              keyword: shownKeyword,
              scope: categoryLabel(scope),
              category: scope,
              onClear: clearSearch,
              onScopeAll: () => {
                selectCategory('all');
                options.onCategoryChange?.('all');
              },
            }),
          ]);
          return;
        }
        renderState('ok', [
          renderCount(documentRef, result, categoryLabel(result.category)),
          renderGrid(documentRef, items, openDetail),
        ]);
      })
      .catch(() => {
        if (token !== seq) return;
        renderState('error', [renderError(documentRef, load)]);
      });
  }

  function clearSearch() {
    field.value = '';
    load();
  }

  /** 打开示例详情入口：展示节目信息与接入边界，并保留可返回路径。 */
  /** @param {ProgramItem} program @param {HTMLElement} card */
  function openDetail(program, card) {
    openedCard = card;
    detail.replaceChildren(...renderDetail(documentRef, program, activate, closeDetailFromButton));
    detail.hidden = false;
    if (typeof detail.scrollIntoView === 'function') detail.scrollIntoView({ block: 'nearest' });
    if (typeof detail.focus === 'function') detail.focus();
  }

  /** 「返回节目列表」：关闭详情并把焦点交回触发的卡片，卡片不在时回到结果区。 */
  function closeDetailFromButton() {
    const card = openedCard;
    closeDetail();
    if (card && isFocusWithin(body, card) && typeof card.focus === 'function') card.focus();
    else focusResults();
  }

  form.addEventListener('submit', (event) => {
    if (typeof event.preventDefault === 'function') event.preventDefault();
    load();
  });
  clear.addEventListener('click', () => clearSearch());

  programControls.set(body, {
    selectCategory,
    focusSearch: () => {
      if (typeof field.focus === 'function') field.focus();
    },
  });
  updateTabs();
  load();
  return body;
}

/**
 * 判断某节点是否位于容器内（用于关闭详情前判断焦点归属）。
 * @param {HTMLElement} container
 * @param {Node | null} node
 * @returns {boolean}
 */
function isFocusWithin(container, node) {
  if (!node) return false;
  if (container === node) return true;
  for (const child of /** @type {any} */ (container).childNodes ?? []) {
    if (isFocusWithin(child, node)) return true;
  }
  return false;
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
      keyword
        ? '正在「' + scope + '」里查找「' + keyword + '」…'
        : '正在读取「' + scope + '」示例节目…',
    ),
  );
  return node;
}

/**
 * @param {Document} documentRef
 * @param {ProgramSearchResult} result
 * @param {string} scope 生效分类的可视名称。
 * @returns {HTMLElement}
 */
function renderCount(documentRef, result, scope) {
  const label = result.keyword
    ? '在「' +
      scope +
      '」里找到 ' +
      result.items.length +
      ' 个与「' +
      result.keyword +
      '」相关的示例节目'
    : '「' + scope + '」共 ' + result.items.length + ' 个示例节目';
  return createNode(documentRef, 'p', 'jq-programs__count', label);
}

/**
 * @param {Document} documentRef
 * @param {ProgramItem[]} programs
 * @param {(program: ProgramItem, card: HTMLElement) => void} onOpen
 * @returns {HTMLElement}
 */
function renderGrid(documentRef, programs, onOpen) {
  const grid = createNode(documentRef, 'div', 'jq-programs__grid');
  for (const program of programs) grid.append(renderProgramCard(documentRef, program, onOpen));
  return grid;
}

/**
 * @param {Document} documentRef
 * @param {ProgramItem} program
 * @param {(program: ProgramItem, card: HTMLElement) => void} onOpen
 * @returns {HTMLElement}
 */
function renderProgramCard(documentRef, program, onOpen) {
  const card = createNode(documentRef, 'button', 'jq-card jq-program-card');
  card.setAttribute('type', 'button');
  card.setAttribute('data-program', program.id);
  card.setAttribute('aria-label', program.title + '，' + program.meta + '（示例节目）');
  const media = createMedia(documentRef, program);
  if (program.tag) media.append(createNode(documentRef, 'span', 'jq-card__badge', program.tag));
  card.append(
    media,
    createNode(documentRef, 'span', 'jq-card__name', program.title),
    createNode(documentRef, 'span', 'jq-card__meta', program.meta),
  );
  if (program.demoRoute) {
    card.append(createNode(documentRef, 'span', 'jq-chip jq-program-card__chip', '示例播放'));
  }
  card.addEventListener('click', () => onOpen(program, card));
  return card;
}

/**
 * 空结果：明确写出生效的分类与关键词，并给出可操作的回退路径。
 * @param {Document} documentRef
 * @param {{ keyword: string, scope: string, category: string, onClear: () => void, onScopeAll: () => void }} spec
 * @returns {HTMLElement}
 */
function renderEmpty(documentRef, spec) {
  const node = createNode(documentRef, 'div', 'jq-programs__state jq-programs__state--empty');
  const actions = createNode(documentRef, 'div', 'jq-programs__state-actions');
  if (spec.keyword) {
    node.append(
      createNode(
        documentRef,
        'p',
        'jq-programs__state-title',
        '「' + spec.scope + '」里没有找到与「' + spec.keyword + '」相关的节目',
      ),
      createNode(
        documentRef,
        'p',
        'jq-programs__state-text',
        '关键词只在选中的分类里查找。可以清空关键词，或换一个分类再找。',
      ),
    );
    actions.append(
      renderAction(documentRef, 'jq-btn jq-btn--ghost jq-btn--sm', '清空关键词', spec.onClear),
    );
    if (spec.category !== 'all') {
      actions.append(
        renderAction(
          documentRef,
          'jq-btn jq-btn--primary jq-btn--sm',
          '在全部节目里找「' + spec.keyword + '」',
          spec.onScopeAll,
        ),
      );
    }
  } else {
    node.append(
      createNode(
        documentRef,
        'p',
        'jq-programs__state-title',
        '「' + spec.scope + '」暂时没有示例节目',
      ),
      createNode(documentRef, 'p', 'jq-programs__state-text', '可以看看全部示例节目。'),
    );
    if (spec.category !== 'all') {
      actions.append(
        renderAction(documentRef, 'jq-btn jq-btn--ghost jq-btn--sm', '看全部节目', spec.onScopeAll),
      );
    }
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
    createNode(documentRef, 'p', 'jq-programs__state-title', '示例节目库暂时读不到'),
    createNode(
      documentRef,
      'p',
      'jq-programs__state-text',
      '这是示例环境的读取失败状态：真实内容服务尚未接入，可以重试。',
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

/**
 * 示例详情入口：节目信息 + 明确的接入边界 + 可返回路径。
 * @param {Document} documentRef
 * @param {ProgramItem} program
 * @param {(route: string) => void} activate
 * @param {() => void} onClose
 * @returns {HTMLElement[]}
 */
function renderDetail(documentRef, program, activate, onClose) {
  const head = createNode(documentRef, 'div', 'jq-program-detail__head');
  const close = createNode(documentRef, 'button', 'jq-program-detail__close', '‹ 返回节目列表');
  close.setAttribute('type', 'button');
  close.addEventListener('click', onClose);
  head.append(close);

  const main = createNode(documentRef, 'div', 'jq-program-detail__main');
  const info = createNode(documentRef, 'div', 'jq-program-detail__body');
  info.append(
    createNode(documentRef, 'h2', 'jq-program-detail__title', program.title),
    createNode(documentRef, 'p', 'jq-program-detail__meta', program.meta),
    createNode(documentRef, 'p', 'jq-program-detail__summary', program.summary),
    createNode(
      documentRef,
      'p',
      'jq-program-detail__note',
      '节目详情与选集尚未接入：按当前计划由 V02 后续（Issue #10）落地，此处为示例入口。',
    ),
  );
  if (program.demoRoute) {
    const actions = createNode(documentRef, 'div', 'jq-program-detail__actions');
    actions.append(
      createRouteButton(
        documentRef,
        'jq-btn jq-btn--primary jq-btn--sm',
        '去看 V02 示例播放',
        program.demoRoute,
        activate,
      ),
    );
    info.append(
      createNode(
        documentRef,
        'p',
        'jq-program-detail__text',
        '仅《' + program.title + '》与现有 V02 示例播放页关联；其余节目等待详情页接入。',
      ),
      actions,
    );
  }
  main.append(createMedia(documentRef, program), info);
  return [head, main];
}
