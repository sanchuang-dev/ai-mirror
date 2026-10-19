/**
 * AI 趣玩 C01 场景正文（复用共享场景壳）：主题选择 → 素材来源 → 授权 / 拒绝 → 预览 → 模拟生成说明。
 *
 * 单套 DOM + 单套状态：A「日光客厅」/ B「暖夜剧场」只改 `tokens.css` 变量，不复制页面，
 * 也不为 A/B 各写一份流程；切换主题不重建本场景，因此选中的主题、素材与已写下的文字都保留。
 *
 * 边界（Issue #11 · C01 / design.md §5 的「AI 趣玩」组；Issue #12 · C02 续接）：
 * - 做到**生成前**：`模拟生成` 是明确标注「S1 演示、未接入真实模型」的入口，点它把
 *   最少演示数据（主题 + 来源类别，不含本机图片字节 / 文件名 / 对象地址）交给 C02 结果页
 *   （`data/creation-draft.js`），由作品结果页继续「预生成示例作品 → 私密保存 → 分享确认」。
 * - 使用真实本机图片时只在浏览器内用对象地址预览：**不上传、不持久化**，
 *   授权被拒绝 / 撤销 / 更换素材 / 离开本页都会释放对象地址并清空素材，
 *   不会在页面缓存里悄悄保留私人素材。
 * - 三个素材来源都可用；示例素材与文字描述不需要任何本机文件，因此演示不依赖摄像头 / 真实 AI。
 */
import { createMedia, createNode, createRouteButton } from '../components/kit.js';
import { clearCreationDraft, setCreationDraft } from '../data/creation-draft.js';

/** @typedef {import('../data/fixtures/creation.fixture.js').CreationFixture} CreationContent */
/** @typedef {import('../data/fixtures/creation.fixture.js').CreationSample} CreationSample */
/** @typedef {'theme' | 'source' | 'preview'} CreationStepId */

/** @type {WeakMap<HTMLElement, { reset: () => void }>} 供外壳「再做一次」重置本场景。 */
const creationControls = new WeakMap();

/**
 * 外壳在切到「AI 趣玩」时按需调用：把本场景恢复到第 1 步，并清空素材与 C01→C02 交接数据。
 * @param {HTMLElement} body
 */
export function resetCreationFlow(body) {
  creationControls.get(body)?.reset();
}

/**
 * 构建 AI 趣玩正文（不含顶栏 / 设置 / 反馈），供共享壳渲染。返回单棵 DOM，不做全局副作用。
 * @param {Document} documentRef
 * @param {CreationContent} content
 * @param {(route: string) => void} activate 共享壳的统一入口动作
 * @returns {HTMLElement}
 */
export function renderCreationBody(documentRef, content, activate) {
  const body = createNode(documentRef, 'div', 'jq-scene jq-scene--create');
  const initialTheme = content.themes.find((theme) => theme.featured) ?? content.themes[0];

  /** 本场景唯一的状态：选中的主题 / 来源 / 素材与授权。主题切换不重建它，所以不会丢。 */
  const state = {
    /** @type {CreationStepId} */
    step: 'theme',
    themeId: initialTheme ? initialTheme.id : '',
    /** @type {string | null} */
    sourceId: null,
    /** @type {string | null} */
    sampleId: null,
    text: '',
    /** @type {string | null} */
    localFileName: null,
    /** @type {string | null} 本机对象地址，仅存活到撤销 / 更换 / 离开本页。 */
    localPreviewUrl: null,
    authorized: false,
  };

  // ---------- 场景头：返回首页 + 标题 + 示例边界 ----------
  const head = createNode(documentRef, 'header', 'jq-scene__head');
  const titleBlock = createNode(documentRef, 'div', 'jq-scene__title');
  titleBlock.append(
    createNode(documentRef, 'h1', 'jq-scene__h1', content.title),
    createNode(documentRef, 'p', 'jq-scene__demo', content.demo.notice),
  );
  head.append(
    createRouteButton(documentRef, 'jq-scene__back', '‹ 返回首页', 'home', leaveToHome),
    titleBlock,
  );
  body.append(head);

  // ---------- 步骤指示 ----------
  const steps = createNode(documentRef, 'ol', 'jq-create__steps');
  steps.setAttribute('aria-label', '创作步骤');
  const stepItems = content.steps.map((entry) => {
    const node = createNode(documentRef, 'li', 'jq-create__step', entry.label);
    node.setAttribute('data-step', entry.id);
    steps.append(node);
    return { id: entry.id, node };
  });
  body.append(steps);

  // ---------- 流程反馈（拒绝 / 未提供素材 / 撤销都有明确说明） ----------
  const feedback = createNode(documentRef, 'p', 'jq-create__feedback');
  feedback.setAttribute('role', 'status');
  feedback.setAttribute('aria-live', 'polite');
  feedback.hidden = true;
  body.append(feedback);

  const stage = createNode(documentRef, 'div', 'jq-create__stage');
  body.append(stage);

  /**
   * @param {CreationStepId} id
   * @param {string} title
   * @returns {HTMLElement}
   */
  function createPanel(id, title) {
    const panel = createNode(documentRef, 'section', 'jq-create__panel');
    panel.setAttribute('data-step', id);
    panel.setAttribute('tabindex', '-1');
    panel.setAttribute('aria-labelledby', 'jq-create-' + id + '-title');
    const heading = createNode(documentRef, 'h2', 'jq-create__h2', title);
    heading.setAttribute('id', 'jq-create-' + id + '-title');
    panel.append(heading);
    return panel;
  }

  /**
   * @param {HTMLElement[]} nodes
   * @returns {HTMLElement}
   */
  function createActions(nodes) {
    const actions = createNode(documentRef, 'div', 'jq-create__actions');
    actions.append(...nodes);
    return actions;
  }

  /** @param {string} label @param {boolean} primary */
  function createButton(label, primary) {
    const node = /** @type {HTMLButtonElement} */ (
      createNode(documentRef, 'button', 'jq-btn ' + (primary ? 'jq-btn--primary' : 'jq-btn--ghost'))
    );
    node.setAttribute('type', 'button');
    node.textContent = label;
    return node;
  }

  // ---------- 步骤 1：主题选择 ----------
  const themePanel = createPanel('theme', '选个想玩的主题');
  const themeGrid = createNode(documentRef, 'div', 'jq-grid jq-create__themes');
  /** @type {Array<{ id: string, node: HTMLButtonElement }>} */
  const themeButtons = content.themes.map((theme) => {
    const node = /** @type {HTMLButtonElement} */ (
      createNode(documentRef, 'button', 'jq-panel jq-creation jq-create__theme')
    );
    node.setAttribute('type', 'button');
    node.setAttribute('data-theme', theme.id);
    node.setAttribute('aria-pressed', 'false');
    node.append(
      createMedia(documentRef, {
        tone: theme.tone,
        image: theme.image,
        imageAlt: theme.imageAlt,
        title: theme.title,
      }),
      createNode(documentRef, 'span', 'jq-creation__name', theme.title),
      createNode(documentRef, 'span', 'jq-creation__sub', theme.subtitle),
    );
    if (theme.featured && theme.featuredNote) {
      node.append(createNode(documentRef, 'span', 'jq-create__badge', theme.featuredNote));
    }
    node.addEventListener('click', () => {
      state.themeId = theme.id;
      updateThemeSelection();
      setFeedback(content.messages.themeNext);
    });
    themeGrid.append(node);
    return { id: theme.id, node };
  });
  const themeNext = createButton('下一步：选素材', true);
  themeNext.setAttribute('data-action', 'next');
  themeNext.addEventListener('click', () => goTo('source'));
  themePanel.append(
    themeGrid,
    createActions([
      createNode(documentRef, 'p', 'jq-create__hint', '先挑一个主题，后面几步都能随时返回。'),
      themeNext,
    ]),
  );

  // ---------- 步骤 2：素材来源 + 许可 ----------
  const sourcePanel = createPanel('source', '素材从哪里来');
  const sourceGroup = createNode(documentRef, 'div', 'jq-create__sources');
  sourceGroup.setAttribute('role', 'group');
  sourceGroup.setAttribute('aria-label', '素材来源');
  /** @type {Array<{ id: string, node: HTMLButtonElement }>} */
  const sourceButtons = content.sources.map((source) => {
    const node = /** @type {HTMLButtonElement} */ (
      createNode(documentRef, 'button', 'jq-create__source')
    );
    node.setAttribute('type', 'button');
    node.setAttribute('data-source', source.id);
    node.setAttribute('aria-pressed', 'false');
    node.append(
      createNode(documentRef, 'span', 'jq-create__source-name', source.label),
      createNode(documentRef, 'span', 'jq-create__source-desc', source.desc),
    );
    node.addEventListener('click', () => selectSource(source.id));
    sourceGroup.append(node);
    return { id: source.id, node };
  });

  const picker = createNode(documentRef, 'div', 'jq-create__picker');

  const consent = createNode(documentRef, 'section', 'jq-create__consent');
  consent.setAttribute('aria-labelledby', 'jq-create-consent-title');
  const consentTitle = createNode(documentRef, 'h3', 'jq-create__h3', content.consent.title);
  consentTitle.setAttribute('id', 'jq-create-consent-title');
  const agree = createButton(content.consent.agree, true);
  agree.setAttribute('data-consent', 'agree');
  agree.addEventListener('click', () => {
    if (!hasMaterial()) {
      setFeedback(content.messages.noMaterial);
      return;
    }
    state.authorized = true;
    setFeedback(content.messages.agreed);
    goTo('preview');
  });
  const refuse = createButton(content.consent.refuse, false);
  refuse.setAttribute('data-consent', 'refuse');
  refuse.addEventListener('click', () => {
    // 拒绝授权：立即丢弃素材与本机预览地址，不留下任何私人素材。
    clearMaterial();
    renderPicker();
    setFeedback(content.messages.refused);
    goTo('source');
  });
  consent.append(
    consentTitle,
    createNode(documentRef, 'p', 'jq-create__note', content.consent.body),
    createActions([agree, refuse]),
  );

  const sourceBack = createButton('上一步：换主题', false);
  sourceBack.addEventListener('click', () => goTo('theme'));
  sourcePanel.append(sourceGroup, picker, consent, createActions([sourceBack]));

  // ---------- 步骤 3：预览 + 模拟生成入口 ----------
  const previewPanel = createPanel('preview', '确认要创作的样子');
  const previewBox = createNode(documentRef, 'div', 'jq-create__preview');
  const revoke = createButton('撤销授权并清除素材', false);
  revoke.setAttribute('data-action', 'revoke');
  revoke.addEventListener('click', () => {
    // 撤销：清除素材与授权，回到素材步骤，并如实说明没有保留。
    clearMaterial();
    renderPicker();
    setFeedback(content.messages.revoked);
    goTo('source');
  });
  const generate = createButton(content.generate.cta, true);
  generate.setAttribute('data-action', 'generate');
  generate.addEventListener('click', () => {
    // C02：把**不含私有媒体**的最少演示数据交给作品结果页，再切到 `create-result`。
    // 主题之外只传来源类别与示例素材名；本机图片字节 / 文件名 / blob: 地址一律不传。
    setCreationDraft({
      themeId: state.themeId,
      themeTitle: (content.themes.find((entry) => entry.id === state.themeId) ?? {}).title ?? '',
      sourceKind: /** @type {'example' | 'local' | 'text' | null} */ (state.sourceId),
      sampleTitle: selectedSample()?.title ?? '',
    });
    activate('create-result');
  });
  previewPanel.append(
    previewBox,
    createNode(documentRef, 'p', 'jq-create__note', content.generate.note),
    createActions([revoke, generate]),
  );

  /** @type {Array<{ id: CreationStepId, panel: HTMLElement }>} */
  const panels = [
    { id: 'theme', panel: themePanel },
    { id: 'source', panel: sourcePanel },
    { id: 'preview', panel: previewPanel },
  ];
  stage.append(themePanel, sourcePanel, previewPanel);

  /** @param {string} message */
  function setFeedback(message) {
    feedback.textContent = message;
    feedback.hidden = message.length === 0;
  }

  /** @returns {CreationSample | null} */
  function selectedSample() {
    return content.samples.find((sample) => sample.id === state.sampleId) ?? null;
  }

  /** @returns {boolean} 当前来源下是否已有可用于演示的素材。 */
  function hasMaterial() {
    if (state.sourceId === 'example') return selectedSample() !== null;
    if (state.sourceId === 'local') return state.localFileName !== null;
    if (state.sourceId === 'text') return state.text.trim().length > 0;
    return false;
  }

  /** 释放本机对象地址：只保留到撤销 / 更换 / 离开本页。 */
  function revokePreview() {
    if (!state.localPreviewUrl) return;
    if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
      URL.revokeObjectURL(state.localPreviewUrl);
    }
    state.localPreviewUrl = null;
  }

  /** 清空一切素材痕迹（含本机预览地址），并让授权失效。 */
  function clearMaterial() {
    revokePreview();
    state.sampleId = null;
    state.text = '';
    state.localFileName = null;
    state.authorized = false;
  }

  /** 素材变化后必须重新授权：不允许把上一次的许可套用到新素材上。 */
  function materialChanged() {
    state.authorized = false;
  }

  /** @param {string} id */
  function selectSource(id) {
    if (state.sourceId === id) return;
    state.sourceId = id;
    // 换来源即换素材：旧素材、旧授权与旧本机预览都不能带过来。
    clearMaterial();
    updateSourceSelection();
    renderPicker();
    setFeedback(content.messages.pickSource);
  }

  function updateThemeSelection() {
    for (const entry of themeButtons) {
      entry.node.setAttribute('aria-pressed', entry.id === state.themeId ? 'true' : 'false');
    }
  }

  function updateSourceSelection() {
    for (const entry of sourceButtons) {
      entry.node.setAttribute('aria-pressed', entry.id === state.sourceId ? 'true' : 'false');
    }
  }

  /** 素材选择区按当前来源重建；示例 / 本机图片 / 文字三条路径都真实可操作。 */
  function renderPicker() {
    picker.replaceChildren(...buildPickerNodes());
  }

  /** @returns {HTMLElement[]} */
  function buildPickerNodes() {
    if (state.sourceId === null) {
      return [createNode(documentRef, 'p', 'jq-create__empty', content.messages.pickSource)];
    }
    if (state.sourceId === 'example') return [buildSampleGrid()];
    if (state.sourceId === 'local') return [buildLocalPicker()];
    return [buildTextPicker()];
  }

  /** @returns {HTMLElement} */
  function buildSampleGrid() {
    const grid = createNode(documentRef, 'div', 'jq-grid jq-create__samples');
    /** @type {Array<{ id: string, node: HTMLButtonElement }>} */
    const buttons = content.samples.map((sample) => {
      const node = /** @type {HTMLButtonElement} */ (
        createNode(documentRef, 'button', 'jq-panel jq-create__sample')
      );
      node.setAttribute('type', 'button');
      node.setAttribute('data-sample', sample.id);
      node.setAttribute('aria-pressed', state.sampleId === sample.id ? 'true' : 'false');
      node.append(
        createMedia(documentRef, {
          tone: sample.tone,
          image: sample.image,
          imageAlt: sample.imageAlt,
          title: sample.title,
        }),
        createNode(documentRef, 'span', 'jq-create__sample-name', sample.title),
      );
      node.addEventListener('click', () => {
        state.sampleId = sample.id;
        materialChanged();
        for (const entry of buttons) {
          entry.node.setAttribute('aria-pressed', entry.id === sample.id ? 'true' : 'false');
        }
        setFeedback(content.messages.sampleChosen);
      });
      grid.append(node);
      return { id: sample.id, node };
    });
    return grid;
  }

  /** @returns {HTMLElement} */
  function buildLocalPicker() {
    const wrap = createNode(documentRef, 'div', 'jq-create__local');
    // 原生 file 控件的外观无法与既有体系统一：用 label 承担可点击外观，
    // input 保持可见焦点与实际取文件能力（只在本机预览，不上传）。
    const label = createNode(documentRef, 'label', 'jq-create__file-label');
    const input = /** @type {HTMLInputElement} */ (
      createNode(documentRef, 'input', 'jq-create__file')
    );
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.setAttribute('aria-label', '从本机选择一张图片（只在本机预览）');
    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      if (!file) {
        setFeedback(content.messages.localMissing);
        return;
      }
      revokePreview();
      state.localFileName = file.name;
      // 仅创建浏览器内的对象地址用于预览；不上传、不写入存储、不持久化。
      state.localPreviewUrl =
        typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function'
          ? URL.createObjectURL(file)
          : null;
      materialChanged();
      renderPicker();
      setFeedback(content.messages.localChosen);
    });
    label.append(input, createNode(documentRef, 'span', 'jq-create__file-text', '选择本机图片'));
    wrap.append(
      label,
      createNode(
        documentRef,
        'p',
        'jq-create__hint',
        '只在本机浏览器里看看：不会上传到网络，也不会保存到设备。',
      ),
    );
    if (state.localFileName) {
      wrap.append(
        createNode(documentRef, 'p', 'jq-create__file-name', '已选：' + state.localFileName),
      );
      if (state.localPreviewUrl) {
        const image = createNode(documentRef, 'img', 'jq-create__thumb');
        image.setAttribute('src', state.localPreviewUrl);
        image.setAttribute('alt', '本机预览：' + state.localFileName);
        wrap.append(image);
      }
    }
    return wrap;
  }

  /** @returns {HTMLElement} */
  function buildTextPicker() {
    const wrap = createNode(documentRef, 'div', 'jq-create__text');
    const area = /** @type {HTMLTextAreaElement} */ (
      createNode(documentRef, 'textarea', 'jq-create__text-field')
    );
    area.setAttribute('rows', '5');
    area.setAttribute('aria-label', '用一句话描述你想要的画面（示例）');
    area.setAttribute('placeholder', '比如：想把家里那张老照片修清楚一点');
    area.value = state.text;
    area.addEventListener('input', () => {
      state.text = area.value;
      materialChanged();
    });
    wrap.append(
      area,
      createNode(documentRef, 'p', 'jq-create__hint', '只作为本页演示描述，不会发送给任何服务。'),
    );
    return wrap;
  }

  /** 预览区按当前素材重建：图片直接可看，文字用一张清楚的示意卡。 */
  function renderPreview() {
    const nodes = [];
    const theme = content.themes.find((entry) => entry.id === state.themeId);
    if (theme) {
      nodes.push(createNode(documentRef, 'p', 'jq-create__hint', '主题：' + theme.title));
    }
    if (state.sourceId === 'text' && state.text.trim().length > 0) {
      const card = createNode(documentRef, 'div', 'jq-panel jq-create__card');
      card.append(
        createNode(documentRef, 'p', 'jq-create__text-quoted', '“' + state.text.trim() + '”'),
        createNode(documentRef, 'p', 'jq-create__hint', '文字描述（示例）'),
      );
      nodes.push(card);
    } else if (state.sourceId === 'local' && state.localPreviewUrl) {
      const image = createNode(documentRef, 'img', 'jq-create__preview-img');
      image.setAttribute('src', state.localPreviewUrl);
      image.setAttribute('alt', '本机预览：' + (state.localFileName ?? ''));
      nodes.push(
        image,
        createNode(
          documentRef,
          'p',
          'jq-create__hint',
          '本地图片：' + (state.localFileName ?? '') + '（只在本机预览）',
        ),
      );
    } else {
      const sample = selectedSample();
      if (sample) {
        nodes.push(
          createMedia(documentRef, {
            tone: sample.tone,
            image: sample.image,
            imageAlt: sample.imageAlt,
            title: sample.title,
          }),
          createNode(documentRef, 'p', 'jq-create__hint', '示例素材：' + sample.title),
        );
      } else {
        nodes.push(createNode(documentRef, 'p', 'jq-create__empty', content.messages.noMaterial));
      }
    }
    previewBox.replaceChildren(...nodes);
  }

  /**
   * 离开本页即丢弃素材：共享壳会缓存本场景，不重置就会在再次进入时既留下旧 DOM、
   * 又悄悄保留私人素材。因此这里同时清空状态与重建素材区，再从第 1 步开始。
   */
  function leaveToHome() {
    resetFlow();
    goTo('theme');
    activate('home');
  }

  /** 回到最初状态，用于「再做一次」与离开本页。 */
  function resetFlow() {
    clearMaterial();
    clearCreationDraft();
    state.sourceId = null;
    state.themeId = initialTheme ? initialTheme.id : '';
    updateThemeSelection();
    updateSourceSelection();
    renderPicker();
  }

  /**
   * 切到某一步：只切换面板可见性与步骤标记，不重建已填充的表单内容。
   * @param {CreationStepId} step
   */
  function goTo(step) {
    state.step = step;
    const order = content.steps.map((entry) => entry.id);
    const index = order.indexOf(step);
    for (const entry of panels) entry.panel.hidden = entry.id !== step;
    stepItems.forEach((item, position) => {
      if (item.id === step) item.node.setAttribute('aria-current', 'step');
      else item.node.removeAttribute('aria-current');
      if (position < index) item.node.classList.add('jq-create__step--done');
      else item.node.classList.remove('jq-create__step--done');
    });
    if (step === 'preview') renderPreview();
    const active = panels.find((entry) => entry.id === step);
    if (active && typeof active.panel.focus === 'function') active.panel.focus();
  }

  updateThemeSelection();
  updateSourceSelection();
  renderPicker();
  goTo('theme');

  // 外壳「再做一次」通过这个受控入口重置本场景（回到第 1 步并清空素材 / 交接数据）。
  creationControls.set(body, {
    reset: () => {
      resetFlow();
      goTo('theme');
    },
  });

  return body;
}
