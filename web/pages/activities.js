/**
 * L01-A 本地活动与福利目录（Issue #13 收窄后的目录卡）。
 *
 * 只交付一张真正能浏览的目录：分类（全部 / 活动 / 福利）+ 一种简单筛选（关键词）+
 * 清楚的空状态与恢复路径，并复用既有共享壳、`jq-` 视觉与 A/B Token。
 *
 * 边界：
 * - 详情页与公共 G00 入口归 L01-B（Issue #49），这里只在卡片上给出「详情将由 L01-B
 *   衔接」的诚实提示，不伪造详情或报名成功；
 * - 报名确认 / 手机接力 / 二维码归 L02（Issue #14），本页不做；
 * - 数据只来自 `web/data/api.js` 的示例出口，所有条目在页面上显著标注为示例。
 */
import { createMedia, createNode, createRouteButton } from '../components/kit.js';

/** @typedef {import('../data/fixtures/activities.fixture.js').ActivityFixture} ActivityContent */
/** @typedef {import('../data/fixtures/activities.fixture.js').ActivityItem} ActivityItem */

/**
 * @typedef {object} ActivitiesOptions
 * @property {'all' | 'activity' | 'welfare'} [category] 初始分类，缺省为「全部」。
 * @property {(item: ActivityItem) => void} [onOpenDetail] 详情去向（L01-B 接入点）；
 *   缺省时只给出诚实的「详情将由 L01-B 衔接」提示。
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

  // ---------- 场景子头：返回首页 + 标题 + 示例边界 ----------
  const head = createNode(documentRef, 'header', 'jq-scene__head');
  const titleBlock = createNode(documentRef, 'div', 'jq-scene__title');
  titleBlock.append(
    createNode(documentRef, 'h1', 'jq-scene__h1', content.title),
    createNode(documentRef, 'p', 'jq-scene__sub', content.sub),
    createNode(documentRef, 'p', 'jq-scene__demo', content.demo.notice),
  );
  head.append(
    createRouteButton(documentRef, 'jq-scene__back', '‹ 返回首页', 'home', activate),
    titleBlock,
  );
  body.append(head);

  // ---------- 关键词筛选 ----------
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
  body.append(form);

  // ---------- 分类：全部 / 活动 / 福利 ----------
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
  body.append(tabs);

  // ---------- 结果区：命中 / 无结果 ----------
  const results = createNode(documentRef, 'section', 'jq-activities__results');
  results.setAttribute('aria-live', 'polite');
  results.setAttribute('aria-label', '活动与福利列表');
  results.setAttribute('tabindex', '-1');
  body.append(results);

  // ---------- 详情 / 报名的诚实提示（L01-B、L02 的接入点） ----------
  const feedback = createNode(documentRef, 'p', 'jq-activities__feedback');
  feedback.setAttribute('role', 'status');
  feedback.setAttribute('aria-live', 'polite');
  body.append(feedback);

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
    for (const item of items) grid.append(renderCard(documentRef, item, openDetail));
    results.replaceChildren(createNode(documentRef, 'p', 'jq-programs__count', count), grid);
  }

  /** @param {ActivityItem} item */
  function openDetail(item) {
    if (options.onOpenDetail) {
      options.onOpenDetail(item);
      return;
    }
    feedback.textContent =
      '《' +
      item.title +
      '》的详情页将由 L01-B 衔接；当前只有示例目录，报名（L02）也尚未接入，不会产生报名凭证。';
  }

  form.addEventListener('submit', (event) => {
    if (typeof event.preventDefault === 'function') event.preventDefault();
    render();
  });
  clear.addEventListener('click', () => {
    field.value = '';
    category = 'all';
    feedback.textContent = '';
    render();
  });

  render();
  return body;
}

/**
 * @param {Document} documentRef
 * @param {ActivityItem} item
 * @param {(item: ActivityItem) => void} onOpenDetail
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
      createNode(documentRef, 'dd', 'jq-activity-card__value', value),
    );
    facts.append(row);
  }

  const foot = createNode(documentRef, 'div', 'jq-activity__foot');
  const detail = createNode(
    documentRef,
    'button',
    'jq-btn jq-btn--ghost jq-btn--sm',
    '详情（L01-B 待接入）',
  );
  detail.setAttribute('type', 'button');
  detail.setAttribute('data-action', 'activity-detail');
  detail.addEventListener('click', () => onOpenDetail(item));
  foot.append(chip, detail);

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
