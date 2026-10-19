/**
 * L01 本地活动与福利目录 + 共用详情（L01-A #13 / L01-B #49）+
 * L02 报名确认与公共设备手机接力（Issue #14）。
 *
 * 目录保留 L01-A 已交付的分类（全部 / 活动 / 福利）+ 关键词筛选 + 空状态；
 * L01-B 在同一份 DOM 内补齐一套活动 / 福利详情视图，个人模式与公共设备共用，
 * 不另建公共详情，也不新增第二份样本数据。
 *
 * 边界：
 * - 详情从 `web/data/api.js` 的活动事实源读取，返回目录时保留原分类与关键词；
 * - 个人设备在详情里进入确认摘要，由本人确认或取消；结果只在本页标注为 S1 模拟，
 *   不提交报名、不占用名额、不生成核销凭证；
 * - 公共设备不展示个人确认表单，只给出「转到自有手机 H5 继续」的接力概念与
 *   不可用 / 超时 / 失败演示反馈；不采集手机号、姓名或身份会话；
 * - 名额满、已报名、活动取消都是显式 S1 演示状态，不伪装真实服务端返回；
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

/** 报名演示的默认状态；fixture 未声明时按可报名处理。 */
const DEFAULT_SIGNUP_STATE = 'available';

/**
 * @typedef {object} ActivitiesOptions
 * @property {'all' | 'activity' | 'welfare'} [category] 初始分类，缺省为「全部」。
 * @property {(item: ActivityItem) => void} [onOpenDetail] 自定义详情去向（测试 / 跨场景接入）；
 *   缺省时打开本场景内的共用详情视图。
 * @property {string} [backRoute] 场景「返回」按钮的路由，缺省为个人首页。
 * @property {string} [backLabel] 场景「返回」按钮文案。
 * @property {() => string} [resolveBackRoute] 点击返回时解析目标路由；公共设备据此回到
 *   公共首页，而不是个人首页。
 * @property {() => boolean} [isPublicMode] 打开报名时的动态公共 / 个人判断。公共设备与
 *   个人设备上的「社区版预览」都只展示手机接力，不展示本人确认表单。
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
  const isPublicMode = options.isPublicMode ?? (() => false);

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

    const signupContent = content.signup;
    const signupState = item.signupState ?? DEFAULT_SIGNUP_STATE;

    // 报名确认与手机接力共用这一条活动对象；公共模式只给接力概念，不给本人确认表单。
    const signup = createNode(
      documentRef,
      'button',
      'jq-btn jq-btn--primary jq-btn--sm',
      isPublicMode() ? '报名 · 转到手机继续' : '大屏报名',
    );
    signup.setAttribute('type', 'button');
    signup.setAttribute('data-action', 'activity-signup');
    signup.addEventListener('click', openSignup);
    const actions = createNode(documentRef, 'div', 'jq-activity-detail__actions');
    actions.append(signup);

    const stateNote = createNode(
      documentRef,
      'p',
      'jq-activity-detail__state',
      signupContent.stateLabel + '：' + signupContent.stateLabels[signupState],
    );
    stateNote.setAttribute('data-signup-state-note', signupState);
    info.append(actions, stateNote, detailFeedback);

    const signupView = createNode(documentRef, 'div', 'jq-activity-signup');
    signupView.setAttribute('role', 'region');
    signupView.setAttribute('aria-label', '报名确认与模拟结果');
    signupView.setAttribute('tabindex', '-1');
    signupView.hidden = true;

    main.append(media, info);
    card.append(detailHead, main, signupView);
    detail.replaceChildren(card);

    /**
     * 进入报名子视图。个人设备显示确认摘要；公共设备只显示手机接力；
     * 名额满 / 已报名 / 活动取消在进入前就以显式演示状态拦下。
     */
    function openSignup() {
      detailFeedback.textContent = '';
      main.hidden = true;
      signupView.hidden = false;
      signupView.replaceChildren();
      if (signupState !== DEFAULT_SIGNUP_STATE) renderSignupException(signupState);
      else if (isPublicMode()) renderSignupHandoff();
      else renderSignupConfirm();
      if (typeof signupView.focus === 'function') signupView.focus();
    }

    /**
     * 从报名子视图回到详情；取消文案来自同一份 fixture。
     * @param {string} [message]
     */
    function backToDetail(message) {
      signupView.hidden = true;
      signupView.replaceChildren();
      signupView.removeAttribute('data-signup-stage');
      main.hidden = false;
      detailFeedback.textContent = message ?? '';
      if (typeof signup.focus === 'function') signup.focus();
    }

    /** 个人设备：核对同一条活动后由本人确认，或取消且不产生报名状态。 */
    function renderSignupConfirm() {
      signupView.setAttribute('data-signup-stage', 'confirm');
      const personal = signupContent.personal;
      const confirm = createNode(
        documentRef,
        'button',
        'jq-btn jq-btn--primary',
        personal.confirmCta,
      );
      confirm.setAttribute('type', 'button');
      confirm.setAttribute('data-action', 'signup-confirm');
      confirm.addEventListener('click', renderSignupResult);
      const cancel = createNode(documentRef, 'button', 'jq-btn jq-btn--ghost', personal.cancelCta);
      cancel.setAttribute('type', 'button');
      cancel.setAttribute('data-action', 'signup-cancel');
      cancel.addEventListener('click', () => backToDetail(personal.cancelled));
      const controls = createNode(documentRef, 'div', 'jq-signup__actions');
      controls.append(confirm, cancel);
      signupView.append(
        signupHead(personal.title, signupContent.demoLabel),
        createNode(documentRef, 'p', 'jq-signup__intro', personal.intro),
        renderSignupSummary(personal.summaryTitle),
        createNode(documentRef, 'p', 'jq-signup__notice', signupContent.notice),
        controls,
      );
    }

    /** 模拟结果：只在本页显示，明确不是报名回执，也不持久化。 */
    function renderSignupResult() {
      signupView.replaceChildren();
      signupView.setAttribute('data-signup-stage', 'result');
      const personal = signupContent.personal;
      const back = createNode(
        documentRef,
        'button',
        'jq-btn jq-btn--primary',
        personal.resultBackCta,
      );
      back.setAttribute('type', 'button');
      back.setAttribute('data-action', 'signup-result-back');
      back.addEventListener('click', () => backToDetail(personal.resultClosed));
      signupView.append(
        signupHead(personal.resultTitle, personal.resultBadge),
        createNode(
          documentRef,
          'p',
          'jq-signup__result-activity',
          item.title + ' · ' + item.time + ' · ' + item.place,
        ),
        createNode(documentRef, 'p', 'jq-signup__result-text', personal.resultText),
        createNode(documentRef, 'p', 'jq-signup__notice', signupContent.notice),
        back,
      );
    }

    /**
     * 演示异常：名额满 / 已报名 / 活动取消都不是真实服务端结果。
     * @param {'full' | 'joined' | 'cancelled'} state
     */
    function renderSignupException(state) {
      signupView.setAttribute('data-signup-stage', 'exception');
      signupView.setAttribute('data-signup-exception', state);
      const exception = signupContent.exceptions[state];
      const back = createNode(
        documentRef,
        'button',
        'jq-btn jq-btn--ghost',
        signupContent.backToDetailCta,
      );
      back.setAttribute('type', 'button');
      back.setAttribute('data-action', 'signup-back-detail');
      back.addEventListener('click', () => backToDetail(''));
      const directory = createNode(
        documentRef,
        'button',
        'jq-btn jq-btn--ghost',
        signupContent.backToDirectoryCta,
      );
      directory.setAttribute('type', 'button');
      directory.setAttribute('data-action', 'signup-back-directory');
      directory.addEventListener('click', closeDetail);
      const controls = createNode(documentRef, 'div', 'jq-signup__actions');
      controls.append(back, directory);
      signupView.append(
        signupHead(exception.title, signupContent.stateLabels[state]),
        createNode(documentRef, 'p', 'jq-signup__result-text', exception.text),
        createNode(documentRef, 'p', 'jq-signup__notice', signupContent.notice),
        renderSignupSummary(signupContent.personal.summaryTitle),
        controls,
      );
    }

    /** 公共设备：只呈现「转到自己的手机 H5」概念、示例二维码与演示反馈。 */
    function renderSignupHandoff() {
      signupView.setAttribute('data-signup-stage', 'handoff');
      const handoff = signupContent.handoff;

      const qr = createNode(documentRef, 'div', 'jq-signup__qr');
      qr.setAttribute('data-qr-sample', 'true');
      qr.setAttribute('role', 'img');
      qr.setAttribute('aria-label', handoff.qrLabel);
      qr.append(createNode(documentRef, 'span', 'jq-signup__qr-mark', '示例'));

      const relayBody = createNode(documentRef, 'div', 'jq-signup__relay-body');
      relayBody.append(
        createNode(documentRef, 'p', 'jq-signup__qr-label', handoff.qrLabel),
        createNode(documentRef, 'p', 'jq-signup__qr-hint', handoff.qrHint),
      );
      const steps = createNode(documentRef, 'ol', 'jq-signup__steps');
      for (const step of handoff.steps) steps.append(createNode(documentRef, 'li', '', step));
      relayBody.append(steps);
      const relay = createNode(documentRef, 'div', 'jq-signup__relay');
      relay.append(qr, relayBody);

      const status = createNode(documentRef, 'p', 'jq-signup__status', handoff.unavailable);
      status.setAttribute('aria-label', handoff.statusLabel);
      status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite');
      status.setAttribute('data-signup-feedback', 'unavailable');

      const demo = createNode(documentRef, 'div', 'jq-signup__demo');
      demo.append(createNode(documentRef, 'p', 'jq-signup__demo-label', handoff.demoLabel));
      const demoActions = createNode(documentRef, 'div', 'jq-signup__actions');
      for (const [action, label, message, key] of [
        ['signup-demo-timeout', handoff.timeoutCta, handoff.timeout, 'timeout'],
        ['signup-demo-failure', handoff.failureCta, handoff.failure, 'failure'],
        ['signup-demo-unavailable', handoff.unavailableCta, handoff.unavailable, 'unavailable'],
      ]) {
        const button = createNode(documentRef, 'button', 'jq-btn jq-btn--ghost jq-btn--sm', label);
        button.setAttribute('type', 'button');
        button.setAttribute('data-action', action);
        button.addEventListener('click', () => {
          status.textContent = message;
          status.setAttribute('data-signup-feedback', key);
        });
        demoActions.append(button);
      }
      demo.append(demoActions);

      const cancel = createNode(documentRef, 'button', 'jq-btn jq-btn--ghost', handoff.cancelCta);
      cancel.setAttribute('type', 'button');
      cancel.setAttribute('data-action', 'signup-handoff-cancel');
      cancel.addEventListener('click', () => backToDetail(handoff.cancelled));

      signupView.append(
        signupHead(handoff.title, signupContent.demoLabel),
        createNode(documentRef, 'p', 'jq-signup__intro', handoff.intro),
        createNode(documentRef, 'p', 'jq-signup__notice', handoff.privacy),
        renderSignupSummary(handoff.summaryTitle),
        relay,
        status,
        demo,
        cancel,
      );
    }

    /**
     * @param {string} title
     * @param {string} badgeText
     * @returns {HTMLElement}
     */
    function signupHead(title, badgeText) {
      const head = createNode(documentRef, 'header', 'jq-signup__head');
      head.append(
        createNode(documentRef, 'h2', 'jq-signup__title', title),
        createNode(documentRef, 'span', 'jq-signup__badge', badgeText),
      );
      return head;
    }

    /**
     * 同一条活动对象的确认摘要；不另建第二份报名数据。
     * @param {string} title
     * @returns {HTMLElement}
     */
    function renderSignupSummary(title) {
      const summary = createNode(documentRef, 'section', 'jq-signup__summary');
      summary.append(
        createNode(documentRef, 'h3', 'jq-signup__h3', title),
        createNode(documentRef, 'p', 'jq-signup__summary-name', item.title),
      );
      const facts = renderFacts(documentRef, item);
      facts.classList.add('jq-signup__facts');
      summary.append(facts);
      return summary;
    }
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
