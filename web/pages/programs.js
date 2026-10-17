/**
 * 「看节目」节目频道 / 分类浏览 / 搜索场景正文（复用共享场景壳）。
 *
 * 单套 DOM + 单套数据：A/B 主题只改 CSS 变量，不为两套主题各写一份列表。
 * 数据只经 `web/data/api.js` 出口消费：分类与节目来自示例节目库，搜索走异步适配器，
 * 页面据此展示**加载 / 命中 / 无结果 / 失败**四种状态，不做装饰性假搜索框。
 *
 * 边界（Issue #9）：真实节目详情 / 选集 / 播放器不在本卡范围内。点击节目卡进入的是
 * 明确的示例详情入口：仅《朝夕巷》与已有 V02 示例播放页存在一致映射，其余节目如实
 * 标注「详情待接入（V02 后续 Issue #10）」，不冒充任何一集。
 */
import { createMedia, createNode, createRouteButton } from '../components/kit.js';
import { searchPrograms } from '../data/api.js';

/** @typedef {import('../data/fixtures/programs.fixture.js').ProgramFixture} ProgramContent */
/** @typedef {import('../data/fixtures/programs.fixture.js').ProgramItem} ProgramItem */
/** @typedef {import('../data/api.js').ProgramSearchResult} ProgramSearchResult */

/**
 * @typedef {object} ProgramsOptions
 * @property {string} [category] 初始分类，缺省为「推荐」。
 * @property {boolean} [searchOpen] 从「搜一搜」进入时标记搜索视图。
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

  // ---------- 分类筛选：默认状态明确 ----------
  let category = options.category ?? 'recommend';
  const tabs = createNode(documentRef, 'div', 'jq-programs__tabs');
  tabs.setAttribute('role', 'group');
  tabs.setAttribute('aria-label', '节目分类');
  const tabButtons = content.categories.map((entry) => {
    const button = createNode(documentRef, 'button', 'jq-program-tab', entry.label);
    button.setAttribute('type', 'button');
    button.setAttribute('data-category', entry.id);
    button.addEventListener('click', () => {
      category = entry.id;
      updateTabs();
      load();
    });
    tabs.append(button);
    return { id: entry.id, node: button };
  });
  body.append(tabs);

  // ---------- 结果区：加载 / 命中 / 无结果 / 失败 ----------
  const results = createNode(documentRef, 'section', 'jq-programs__results');
  results.setAttribute('aria-live', 'polite');
  results.setAttribute('aria-label', '节目列表与搜索结果');
  body.append(results);

  // ---------- 节目详情入口（示例边界，可返回列表） ----------
  const detail = createNode(documentRef, 'aside', 'jq-program-detail');
  detail.setAttribute('aria-label', '节目详情入口（示例）');
  detail.setAttribute('tabindex', '-1');
  detail.hidden = true;
  body.append(detail);

  /** 请求序号：晚到的旧结果不得覆盖新一次筛选 / 搜索。 */
  let seq = 0;

  function updateTabs() {
    for (const tab of tabButtons) {
      tab.node.setAttribute('aria-pressed', tab.id === category ? 'true' : 'false');
    }
  }

  /** 统一取数：分类浏览与关键词搜索都经过同一个异步数据出口。 */
  function load() {
    const keyword = field.value.trim();
    // 关键词搜索面向整个示例节目库；分类标签只决定无关键词时的浏览范围。
    const scope = keyword ? 'all' : category;
    const token = (seq += 1);
    results.setAttribute('data-state', 'loading');
    results.replaceChildren(renderLoading(documentRef, keyword));
    Promise.resolve()
      .then(() => search({ category: scope, keyword }))
      .then((result) => {
        if (token !== seq) return;
        if (!result || result.status === 'empty' || result.items.length === 0) {
          results.setAttribute('data-state', 'empty');
          results.replaceChildren(
            renderEmpty(documentRef, (result?.keyword ?? keyword) || keyword, clearSearch),
          );
          return;
        }
        results.setAttribute('data-state', 'ok');
        results.replaceChildren(
          renderCount(documentRef, result),
          renderGrid(documentRef, result.items, openDetail),
        );
      })
      .catch(() => {
        if (token !== seq) return;
        results.setAttribute('data-state', 'error');
        results.replaceChildren(renderError(documentRef, load));
      });
  }

  function clearSearch() {
    field.value = '';
    load();
  }

  /** 打开示例详情入口：先展示节目信息与接入边界，再给出可返回的路径。 */
  /** @param {ProgramItem} program */
  function openDetail(program) {
    detail.replaceChildren(...renderDetail(documentRef, program, activate, () => closeDetail()));
    detail.hidden = false;
    if (typeof detail.focus === 'function') detail.focus();
  }

  function closeDetail() {
    detail.hidden = true;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    load();
  });
  clear.addEventListener('click', () => clearSearch());

  updateTabs();
  load();
  return body;
}

/**
 * @param {Document} documentRef
 * @param {string} keyword
 * @returns {HTMLElement}
 */
function renderLoading(documentRef, keyword) {
  const node = createNode(documentRef, 'div', 'jq-programs__state jq-programs__state--loading');
  const spinner = createNode(documentRef, 'span', 'jq-programs__spinner');
  spinner.setAttribute('aria-hidden', 'true');
  node.append(
    spinner,
    createNode(
      documentRef,
      'p',
      'jq-programs__state-title',
      keyword ? '正在示例节目库中查找「' + keyword + '」…' : '正在读取示例节目目录…',
    ),
  );
  return node;
}

/**
 * @param {Document} documentRef
 * @param {ProgramSearchResult} result
 * @returns {HTMLElement}
 */
function renderCount(documentRef, result) {
  const label = result.keyword
    ? '找到 ' + result.items.length + ' 个与「' + result.keyword + '」相关的节目'
    : '共 ' + result.items.length + ' 个示例节目';
  return createNode(documentRef, 'p', 'jq-programs__count', label);
}

/**
 * @param {Document} documentRef
 * @param {ProgramItem[]} programs
 * @param {(program: ProgramItem) => void} onOpen
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
 * @param {(program: ProgramItem) => void} onOpen
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
  card.addEventListener('click', () => onOpen(program));
  return card;
}

/**
 * @param {Document} documentRef
 * @param {string} keyword
 * @param {() => void} onClear
 * @returns {HTMLElement}
 */
function renderEmpty(documentRef, keyword, onClear) {
  const node = createNode(documentRef, 'div', 'jq-programs__state jq-programs__state--empty');
  node.append(
    createNode(
      documentRef,
      'p',
      'jq-programs__state-title',
      '没有找到与「' + keyword + '」相关的节目',
    ),
    createNode(documentRef, 'p', 'jq-programs__state-text', '换个词试试，或清空关键词看全部分类。'),
    renderStateActions(documentRef, 'jq-btn jq-btn--ghost jq-btn--sm', '清空关键词', onClear),
  );
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
    renderStateActions(documentRef, 'jq-btn jq-btn--primary jq-btn--sm', '重试', onRetry),
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
function renderStateActions(documentRef, className, label, onClick) {
  const actions = createNode(documentRef, 'div', 'jq-programs__state-actions');
  const button = createNode(documentRef, 'button', className, label);
  button.setAttribute('type', 'button');
  button.addEventListener('click', onClick);
  actions.append(button);
  return actions;
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
