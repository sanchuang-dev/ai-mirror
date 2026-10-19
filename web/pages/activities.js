/**
 * L01 本地活动与福利目录 + 共用详情（L01-A #13 / L01-B #49）。
 *
 * 目录保留 L01-A 已交付的分类（全部 / 活动 / 福利）+ 关键词筛选 + 空状态；
 * L01-B 在同一份 DOM 内补齐一套活动 / 福利详情视图，个人模式与公共设备共用，
 * 不另建公共详情，也不新增第二份样本数据。
 *
 * 边界：
 * - 详情从 `web/data/api.js` 的活动事实源读取，返回目录时保留原分类与关键词；
 * - 报名确认 / 手机接力 / 二维码 / 核销归 L02（Issue #14）：详情只提供「L02 待实现」
 *   的示例入口与说明，不显示报名成功、不保存身份、不生成核销凭证；
 * - 公共设备（`?device=public`）进入同一目录与详情，但始终留在公共壳，不出现个人
 *   身份、私人数据、设置或「我的」入口；
 * - 所有活动、福利、提供方、时间、地点与价格均为虚构示例；名额、实时余量与到达
 *   时间未提供的一律标注「未提供 / 演示待确认」，不编造机构背书或真实余量。
 */
import { createMedia, createNode } from '../components/kit.js';

/** @typedef {import('../data/fixtures/activities.fixture.js').ActivityFixture} ActivityContent */
/** @typedef {import('../data/fixtures/activities.fixture.js').ActivityItem} ActivityItem */

/** 未接入真实供给时，缺失字段的统一占位文案。 */
const MISSING_VALUE = '未提供 / 演示待确认';

/** 详情页的示例边界：不声称真实余量、到达时间或机构背书。 */
const DETAIL_NOTICE =
  '以上时间、地点、区域、参加资格、提供方与费用均为虚构示例；名额、实时余量与到达时间：未提供 / 演示待确认。';

/** 报名入口的诚实说明：L02 尚未实现，不产生任何真实报名状态。 */
const SIGNUP_NOTICE =
  '报名（L02）尚未实现：这里不会提交真实身份、不会生成核销凭证，也不会记录任何报名状态。';

/**
 * @typedef {object} ActivitiesOptions
 * @property {'all' | 'activity' | 'welfare'} [category] 初始分类，缺省为「全部」。
 * @property {(item: ActivityItem) => void} [onOpenDetail] 自定义详情去向（测试 / 跨场景接入）；
 *   缺省时打开本场景内的共用详情视图。
 * @property {string} [backRoute] 场景「返回」按钮的路由，缺省为个人首页。
 * @property {string} [backLabel] 场景「返回」按钮文案。
 * @property {() => string} [resolveBackRoute] 点击返回时解析目标路由；公共设备据此回到
 *   公共首页，而不是个人首页。
 */

/**
 * @param {Document} documentRef
 * @param {ActivityContent} content
 * @param {(route: string) => void} activate
 * @param {ActivitiesOptions} [options]
 * @returns {HTMLElement}
 */
export function renderActivitiesBody(documentRef, content, activate, options = {}) {
  const body = createNode(documentRef, 'div', 'jq-scene jq-scene--activities');

  // ---------- 场景子头：返回 + 标题 + 示例边界 ----------
  const head = createNode(documentRef, 'header', 'jq-scene__head');
  const titleBlock = createNode(documentRef, 'div', 'jq-scene__title');
  titleBlock.append(
    createNode(documentRef, 'h1', 'jq-scene__h1', content.title),
    createNode(documentRef, 'p', 'jq-scene__sub', content.sub),
    createNode(documentRef, 'p', 'jq-scene__demo', content.demo.notice),
  );
  const backRoute = options.backRoute ?? 'home';
  const back = createNode(
    documentRef,
    'button',
    'jq-scene__back',
    options.backLabel ?? '‹ 返回首页',
  );
  back.setAttribute('type', 'button');
  back.setAttribute('data-route', backRoute);
  back.addEventListener('click', () => {
    // 离开场景时先收起详情，避免下次进入目录仍停在上一条样本详情。
    if (openedItem) closeDetail();
    activate(options.resolveBackRoute ? options.resolveBackRoute() : backRoute);
  });
  head.append(back, titleBlock);
  body.append(head);

  // ---------- 共用详情视图：个人与公共设备共用同一份字段与数据 ----------
  const detail = createNode(documentRef, 'aside', 'jq-activity-detail');
  detail.setAttribute('aria-label', '活动或福利详情（示例）');
  detail.setAttribute('tabindex', '-1');
  detail.hidden = true;
  body.append(detail);

  // ---------- 目录本体：详情打开时整体隐藏，但 DOM / 输入状态保留 ----------
  const directory = createNode(documentRef, 'div', 'jq-activities__directory');

  // 关键词筛选
  const form = createNode(documentRef, 'form', 'jq-programs-search');
  form.setAttribute('role', 'search');
  form.setAttribute('aria-label', '筛选本地活动与福利');
  const field = /** @type {HTMLInputElement} */ (
    createNode(documentRef, 'input', 'jq-search__field')
  );
  field.setAttribute('type', 'search');
  field.setAttribute('placeholder', content.inputPlaceholder);
  field.setAttribute('aria-label', '输入活动或福利关键词（示例筛选）');
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
  directory.append(form);

  // 分类：全部 / 活动 / 福利
  let category = options.category ?? 'all';
  const tabs = createNode(documentRef, 'div', 'jq-programs__tabs');
  tabs.setAttribute('role', 'group');
  tabs.setAttribute('aria-label', '活动与福利分类');
  const tabButtons = content.categories.map((entry) => {
    const button = createNode(documentRef, 'button', 'jq-program-tab', entry.label);
    button.setAttribute('type', 'button');
    button.setAttribute('data-category', entry.id);
    button.addEventListener('click', () => {
      if (category === entry.id) return;
      category = entry.id;
      render();
    });
    tabs.append(button);
    return { id: entry.id, node: button };
  });
  directory.append(tabs);

  // 结果区：命中 / 无结果
  const results = createNode(documentRef, 'section', 'jq-activities__results');
  results.setAttribute('aria-live', 'polite');
  results.setAttribute('aria-label', '活动与福利列表');
  results.setAttribute('tabindex', '-1');
  directory.append(results);

  // 详情 / 报名的诚实提示（不再堆在列表末尾：详情直接展开在当前场景内）
  const feedback = createNode(documentRef, 'p', 'jq-activities__feedback');
  feedback.setAttribute('role', 'status');
  feedback.setAttribute('aria-live', 'polite');
  directory.append(feedback);

  body.append(directory);

  /** 当前打开详情的条目；为 null 表示详情关闭。 */
  /** @type {ActivityItem | null} */
  let openedItem = null;
  /** 打开详情时触发的卡片，用于返回目录时交回焦点。 */
  /** @type {HTMLElement | null} */
  let openedCard = null;

  /** @param {string} id @returns {string} */
  function categoryLabel(id) {
    return content.categories.find((entry) => entry.id === id)?.label ?? id;
  }

  /** 当前分类 + 关键词的组合筛选结果（两者同时生效）。 */
  function matches() {
    const keyword = field.value.trim();
    return content.items.filter((item) => {
      if (category !== 'all' && item.category !== category) return false;
      if (!keyword) return true;
      return [item.title, item.summary, item.area, item.place, item.provider, item.tags]
        .join(' ')
        .includes(keyword);
    });
  }

  /** 依据当前分类 / 关键词重绘列表；不重建整个场景。 */
  function render() {
    for (const tab of tabButtons) {
      tab.node.setAttribute('aria-pressed', tab.id === category ? 'true' : 'false');
    }
    const keyword = field.value.trim();
    const items = matches();
    if (items.length === 0) {
      results.setAttribute('data-state', 'empty');
      results.replaceChildren(
        renderEmpty(documentRef, {
          keyword,
          scope: categoryLabel(category),
          onClear: () => {
            field.value = '';
            category = 'all';
            feedback.textContent = '';
            render();
          },
        }),
      );
      return;
    }
    results.setAttribute('data-state', 'ok');
    const count = keyword
      ? '在「' +
        categoryLabel(category) +
        '」里找到 ' +
        items.length +
        ' 条与「' +
        keyword +
        '」相关的示例'
      : '「' + categoryLabel(category) + '」共 ' + items.length + ' 条示例';
    const grid = createNode(documentRef, 'div', 'jq-activities__grid');
    for (const item of items) grid.append(renderCard(documentRef, item, handleDetail));
    results.replaceChildren(createNode(documentRef, 'p', 'jq-programs__count', count), grid);
  }

  /**
   * 卡片详情入口：默认打开本场景共用详情；外部注入时交给调用方。
   * @param {ActivityItem} item
   * @param {HTMLElement} card
   */
  function handleDetail(item, card) {
    if (options.onOpenDetail) {
      options.onOpenDetail(item);
      return;
    }
    openDetail(item, card);
  }

  /**
   * 打开详情：先清空列表末尾的旧提示，再隐藏目录、展示同一份详情并移动焦点，
   * 避免点击后反馈落在当前视口之外。
   * @param {ActivityItem} item
   * @param {HTMLElement} card
   */
  function openDetail(item, card) {
    openedItem = item;
    openedCard = card;
    feedback.textContent = '';
    renderDetail(item);
    directory.hidden = true;
    detail.hidden = false;
    if (typeof detail.scrollIntoView === 'function') detail.scrollIntoView({ block: 'start' });
    if (typeof detail.focus === 'function') detail.focus();
  }

  /** 返回目录：分类、关键词与结果 DOM 原样保留。 */
  function closeDetail() {
    const card = openedCard;
    openedItem = null;
    openedCard = null;
    detail.hidden = true;
    detail.replaceChildren();
    directory.hidden = false;
    if (card && typeof card.focus === 'function') card.focus();
    else if (typeof results.focus === 'function') results.focus();
  }

  /**
   * 详情内容：名称、时间、地点、区域 / 适用条件、提供方、免费或示例价格、参加资格。
   * 缺失字段统一显示「未提供 / 演示待确认」，不编造真实数据。
   * @param {ActivityItem} item
   */
  function renderDetail(item) {
    const card = createNode(documentRef, 'article', 'jq-activity-detail__card');

    const detailHead = createNode(documentRef, 'header', 'jq-activity-detail__head');
    const close = createNode(documentRef, 'button', 'jq-activity-detail__back', '‹ 返回目录');
    close.setAttribute('type', 'button');
    close.setAttribute('data-action', 'activity-detail-back');
    close.addEventListener('click', closeDetail);
    const badge = createNode(
      documentRef,
      'span',
      'jq-activity-detail__badge',
      item.category === 'welfare' ? '福利 · 示例' : '活动 · 示例',
    );
    detailHead.append(close, badge);

    const main = createNode(documentRef, 'div', 'jq-activity-detail__main');
    const media = createNode(documentRef, 'div', 'jq-activity-detail__media');
    media.append(createMedia(documentRef, item));
    const info = createNode(documentRef, 'div', 'jq-activity-detail__body');
    const title = createNode(documentRef, 'h2', 'jq-activity-detail__title', item.title);
    title.setAttribute('data-activity-detail-title', item.id);
    info.append(
      title,
      createNode(documentRef, 'p', 'jq-activity-detail__summary', item.summary),
      renderFacts(documentRef, item),
      createNode(documentRef, 'p', 'jq-activity-detail__notice', DETAIL_NOTICE),
    );

    const detailFeedback = createNode(documentRef, 'p', 'jq-activity-detail__feedback');
    detailFeedback.setAttribute('role', 'status');
    detailFeedback.setAttribute('aria-live', 'polite');

    // L02 的示例入口：点击只解释未接入，不写入身份、不改变报名状态。
    const signup = createNode(
      documentRef,
      'button',
      'jq-btn jq-btn--ghost jq-btn--sm',
      '报名（L02 待实现）',
    );
    signup.setAttribute('type', 'button');
    signup.setAttribute('data-action', 'activity-signup');
    signup.addEventListener('click', () => {
      detailFeedback.textContent = SIGNUP_NOTICE;
    });
    const actions = createNode(documentRef, 'div', 'jq-activity-detail__actions');
    actions.append(signup);
    info.append(actions, detailFeedback);

    main.append(media, info);
    card.append(detailHead, main);
    detail.replaceChildren(card);
  }

  form.addEventListener('submit', (event) => {
    if (typeof event.preventDefault === 'function') event.preventDefault();
    if (openedItem) closeDetail();
    render();
  });
  clear.addEventListener('click', () => {
    field.value = '';
    category = 'all';
    feedback.textContent = '';
    if (openedItem) closeDetail();
    render();
  });

  render();
  return body;
}

/**
 * @param {Document} documentRef
 * @param {ActivityItem} item
 * @param {(item: ActivityItem, card: HTMLElement) => void} onOpenDetail
 * @returns {HTMLElement}
 */
function renderCard(documentRef, item, onOpenDetail) {
  const article = createNode(documentRef, 'article', 'jq-panel jq-activity-card');
  article.setAttribute('data-activity', item.id);

  const media = createMedia(documentRef, item);
  media.append(
    createNode(
      documentRef,
      'span',
      'jq-activity-card__badge',
      item.category === 'welfare' ? '福利 · 示例' : '活动 · 示例',
    ),
  );

  const cardBody = createNode(documentRef, 'div', 'jq-activity-card__body');
  const chip = createNode(documentRef, 'span', 'jq-chip', item.price);
  if (item.free) chip.classList.add('jq-chip--free');

  const facts = createNode(documentRef, 'dl', 'jq-activity-card__facts');
  for (const [label, value] of [
    ['时间', item.time],
    ['地点', item.place],
    ['区域', item.area],
    ['条件', item.audience],
    ['提供方', item.provider],
  ]) {
    const row = createNode(documentRef, 'div', 'jq-activity-card__fact');
    row.append(
      createNode(documentRef, 'dt', 'jq-activity-card__label', label),
      createNode(documentRef, 'dd', 'jq-activity-card__value', displayValue(value)),
    );
    facts.append(row);
  }

  const foot = createNode(documentRef, 'div', 'jq-activity__foot');
  const detailButton = createNode(
    documentRef,
    'button',
    'jq-btn jq-btn--ghost jq-btn--sm',
    '查看详情 ›',
  );
  detailButton.setAttribute('type', 'button');
  detailButton.setAttribute('data-action', 'activity-detail');
  detailButton.addEventListener('click', () => onOpenDetail(item, article));
  foot.append(chip, detailButton);

  cardBody.append(
    createNode(documentRef, 'h2', 'jq-activity-card__name', item.title),
    createNode(documentRef, 'p', 'jq-activity-card__summary', item.summary),
    facts,
    foot,
  );
  article.append(media, cardBody);
  return article;
}

/**
 * 详情事实列表：沿用目录卡的事实层级，字段缺失时不伪造内容。
 * @param {Document} documentRef
 * @param {ActivityItem} item
 * @returns {HTMLElement}
 */
function renderFacts(documentRef, item) {
  const facts = createNode(documentRef, 'dl', 'jq-activity-card__facts jq-activity-detail__facts');
  for (const [label, value] of [
    ['时间', item.time],
    ['地点', item.place],
    ['区域', item.area],
    ['参加资格', item.audience],
    ['提供方', item.provider],
    ['费用', item.price],
  ]) {
    const row = createNode(documentRef, 'div', 'jq-activity-card__fact');
    row.append(
      createNode(documentRef, 'dt', 'jq-activity-card__label', label),
      createNode(documentRef, 'dd', 'jq-activity-card__value', displayValue(value)),
    );
    facts.append(row);
  }
  return facts;
}

/**
 * @param {string | undefined | null} value
 * @returns {string}
 */
function displayValue(value) {
  const text = String(value ?? '').trim();
  return text.length > 0 ? text : MISSING_VALUE;
}

/**
 * 无结果空状态：写出生效的分类与关键词，并给出「清除筛选」的恢复路径。
 * @param {Document} documentRef
 * @param {{ keyword: string, scope: string, onClear: () => void }} spec
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
        ? '「' + spec.scope + '」里没有找到与「' + spec.keyword + '」相关的示例'
        : '「' + spec.scope + '」暂时没有示例',
    ),
    createNode(
      documentRef,
      'p',
      'jq-programs__state-text',
      '关键词只在当前分类里查找。可以清除筛选，回到全部示例目录。',
    ),
  );
  const actions = createNode(documentRef, 'div', 'jq-programs__state-actions');
  const reset = createNode(documentRef, 'button', 'jq-btn jq-btn--primary jq-btn--sm', '清除筛选');
  reset.setAttribute('type', 'button');
  reset.setAttribute('data-action', 'activity-clear');
  reset.addEventListener('click', spec.onClear);
  actions.append(reset);
  node.append(actions);
  return node;
}
