/**
 * V02 视频观看场景正文（复用共享场景壳）：把「选集 / 继续观看」接入示例播放器。
 *
 * 单套 DOM + 单套数据：A/B 主题只改 CSS 变量，不为两套主题各写一份播放页。
 * 播放器、画质、字幕都未真实接入：所有相关控件给诚实的示例反馈，不伪造播放。
 *
 * 边界（Issue #10）：
 * - 复用本页既有播放器，不另建第二套；选集、集名、示例可播放范围经 `data/api.js`
 *   的 `getProgramDetail` 读取，与节目详情页共用同一份数据。
 * - 本地只保存**示例进度**与**追剧收藏**（`data/watch.js`），不冒充真实播放时间、
 *   版权片源或跨设备账户同步；集内没有资源时给出明确反馈而不是假装能播。
 * - 观看会话（选中集 / 返回节目详情的路由）由外壳在挂载后注入，不是第二份主题或路由状态。
 */
import { createMedia, createNode, createProgress, createRouteButton } from '../components/kit.js';
import { getProgramDetail } from '../data/api.js';
import { createWatchLibrary, PROGRESS_STEP } from '../data/watch.js';

/** @typedef {import('../data/fixtures/video.fixture.js').VideoFixture} VideoContent */
/** @typedef {import('../data/api.js').ProgramDetail} ProgramDetail */
/** @typedef {import('../data/api.js').ProgramEpisode} ProgramEpisode */
/** @typedef {import('../data/watch.js').WatchLibrary} WatchLibrary */
/** @typedef {import('../data/watch.js').WatchSelection} WatchSelection */

/**
 * @typedef {object} VideoApplyOptions
 * @property {string | null} [returnRoute] 从节目详情进入时记住的返回路由；为空表示没有详情可返回。
 *
 * @typedef {object} PlayerController
 * @property {(options?: VideoApplyOptions) => void} apply
 */

/** @type {WeakMap<HTMLElement, PlayerController>} */
const playerControls = new WeakMap();

/**
 * 外壳把正文挂到共享壳之后调用：应用当前观看会话（选中集 / 返回路由）。
 * @param {HTMLElement} body
 * @param {VideoApplyOptions} [options]
 */
export function applyVideoWatchSelection(body, options = {}) {
  playerControls.get(body)?.apply(options);
}

/**
 * @param {Document} documentRef
 * @param {VideoContent} content
 * @param {(route: string) => void} activate
 * @param {{ library?: WatchLibrary }} [options]
 * @returns {HTMLElement}
 */
export function renderVideoBody(documentRef, content, activate, options = {}) {
  const library = options.library ?? createWatchLibrary(null);
  const body = createNode(documentRef, 'div', 'jq-scene jq-scene--video');

  // ---------- 场景子头：返回首页 + 节目 / 集 + 追剧 / 返回详情 ----------
  const head = createNode(documentRef, 'header', 'jq-scene__head');
  const titleBlock = createNode(documentRef, 'div', 'jq-scene__title');
  const heading = createNode(documentRef, 'h1', 'jq-scene__h1');
  const epLabel = createNode(documentRef, 'span', 'jq-scene__ep');
  heading.append(epLabel);
  titleBlock.append(heading, createNode(documentRef, 'p', 'jq-scene__demo', content.demo.notice));

  const favoriteBtn = createNode(documentRef, 'button', 'jq-btn jq-btn--ghost jq-btn--sm', '追剧');
  favoriteBtn.setAttribute('type', 'button');
  favoriteBtn.setAttribute('aria-pressed', 'false');
  const backDetail = createNode(
    documentRef,
    'button',
    'jq-btn jq-btn--ghost jq-btn--sm',
    '返回节目详情',
  );
  backDetail.setAttribute('type', 'button');
  backDetail.hidden = true;
  const actions = createNode(documentRef, 'div', 'jq-scene__actions');
  actions.append(
    favoriteBtn,
    backDetail,
    createRouteButton(documentRef, 'jq-btn jq-btn--ghost jq-btn--sm', '分享', 'favorite', activate),
  );
  head.append(
    createRouteButton(documentRef, 'jq-scene__back', '‹ 返回首页', 'home', activate),
    titleBlock,
    actions,
  );
  body.append(head);

  const wrap = createNode(documentRef, 'div', 'jq-video-wrap');

  // ---------- 播放器（示例画面，不做真实播放） ----------
  const player = createNode(documentRef, 'article', 'jq-player');
  const media = createMedia(documentRef, content.still, true);
  /** 该集示例画面：随选集更新 src / alt，避免切到第 10 集仍标成第 08 集。 */
  const stillImage = content.still.image
    ? /** @type {HTMLImageElement} */ (/** @type {unknown} */ (media.childNodes[0]))
    : undefined;
  const play = createNode(documentRef, 'button', 'jq-playbtn');
  play.setAttribute('type', 'button');
  play.setAttribute('aria-label', '播放（示例演示，不会真的播放）');
  play.textContent = '▶';
  play.addEventListener('click', () => activate('play'));
  media.append(play);
  player.append(media);

  // 未找到示例资源：与正常控件互斥显示，给出明确反馈与回退动作。
  const notFound = createNode(documentRef, 'div', 'jq-player__notice');
  notFound.hidden = true;
  player.append(notFound);

  const bar = createNode(documentRef, 'div', 'jq-player__bar');
  const progressBar = createProgress(documentRef, 0, 'jq-progress jq-progress--player');
  const progressFill = /** @type {HTMLElement} */ (progressBar.childNodes[0]);
  const controls = createNode(documentRef, 'div', 'jq-player__controls');
  const timeLabel = createNode(documentRef, 'span', 'jq-player__time', '');
  const stepGroup = createNode(documentRef, 'div', 'jq-player__progress-actions');
  stepGroup.setAttribute('role', 'group');
  stepGroup.setAttribute('aria-label', '示例进度（演示，非真实播放）');
  const backStep = progressButton(documentRef, '后退 10%', -PROGRESS_STEP);
  const forwardStep = progressButton(documentRef, '前进 10%', PROGRESS_STEP);
  stepGroup.append(backStep, forwardStep);
  controls.append(
    timeLabel,
    createNode(documentRef, 'div', 'jq-player__fill'),
    stepGroup,
    createRouteButton(documentRef, 'jq-player__btn', '画质 · 高清', 'player', activate),
    createRouteButton(documentRef, 'jq-player__btn', '字幕', 'player', activate),
    createRouteButton(documentRef, 'jq-player__btn', '全屏', 'player', activate),
  );
  const resumeNote = createNode(documentRef, 'p', 'jq-player__resume', '');
  resumeNote.hidden = true;
  const progressFeedback = createNode(documentRef, 'p', 'jq-player__feedback', '');
  progressFeedback.setAttribute('role', 'status');
  progressFeedback.setAttribute('aria-live', 'polite');
  // 存储不可用时明确显示内存回退，不伪造持久化。
  const storageNote = createNode(documentRef, 'p', 'jq-player__fallback', '');
  storageNote.hidden = library.available;
  if (!library.available) {
    storageNote.textContent =
      '本机无法保存示例进度 / 追剧：本次只在当前页面内有效，刷新后会从头开始。';
  }
  bar.append(progressBar, controls, resumeNote, storageNote, progressFeedback);
  player.append(bar);

  // 小暖解说：本地展开状态，用于验证「切主题 / 导航返回不清空场景状态」。
  const noteToggle = createNode(documentRef, 'button', 'jq-ask-ai');
  noteToggle.setAttribute('type', 'button');
  noteToggle.setAttribute('aria-expanded', 'false');
  const noteOrb = createNode(documentRef, 'span', 'jq-orb jq-orb--xs');
  noteOrb.setAttribute('aria-hidden', 'true');
  noteToggle.append(noteOrb, createNode(documentRef, 'span', '', '问问小暖：这段讲了啥'));
  const note = createNode(documentRef, 'aside', 'jq-ai-note');
  note.hidden = true;
  const noteText = createNode(documentRef, 'p', 'jq-ai-note__text', content.aiNote.text);
  note.append(createNode(documentRef, 'p', 'jq-ai-note__name', content.aiNote.name), noteText);
  noteToggle.addEventListener('click', () => {
    note.hidden = !note.hidden;
    noteToggle.setAttribute('aria-expanded', note.hidden ? 'false' : 'true');
  });
  player.append(noteToggle, note);
  wrap.append(player);

  // ---------- 侧栏：选集 / 下一集 / 看剧搭子 ----------
  const side = createNode(documentRef, 'aside', 'jq-video-side');

  const sideHead = createNode(documentRef, 'div', 'jq-video-side__head');
  const sideChip = createNode(documentRef, 'span', 'jq-chip', '未追剧（示例）');
  sideHead.append(createNode(documentRef, 'h2', 'jq-video-side__title', '接着看'), sideChip);
  side.append(sideHead);

  const strip = createNode(documentRef, 'div', 'jq-episode-strip');
  strip.setAttribute('role', 'group');
  strip.setAttribute('aria-label', '选集');
  side.append(strip);

  const next = createNode(documentRef, 'div', 'jq-video-next');
  side.append(next);

  const buddy = createNode(documentRef, 'div', 'jq-buddy');
  buddy.append(createNode(documentRef, 'p', 'jq-buddy__title', '看剧搭子（示例）'));
  const list = createNode(documentRef, 'ul', 'jq-buddy__list');
  for (const item of content.buddies) {
    const li = createNode(documentRef, 'li', 'jq-buddy__item');
    const avatar = createNode(documentRef, 'span', 'jq-buddy__ava', item.avatar);
    avatar.setAttribute('aria-hidden', 'true');
    li.append(avatar, createNode(documentRef, 'p', 'jq-buddy__text', item.text));
    list.append(li);
  }
  buddy.append(list);
  side.append(buddy);

  wrap.append(side);
  body.append(wrap);

  // ---------- 播放器状态 ----------
  /** @type {string | null} */
  let returnRoute = null;
  /** 选集按钮的节目 / 集签名：只在集合变化时重建，同一节目内只更新选中态。 */
  let stripSignature = '';
  /** @type {Map<string, HTMLElement>} */
  let episodeButtons = new Map();

  /** 当前观看会话：优先外壳注入的选集，其次回到最近观看记录，最后才是示例默认集。 */
  /** @returns {WatchSelection} */
  function currentSelection() {
    const stored = library.getSelection();
    if (stored) return stored;
    // 刷新 / 重新 mount 后会话选择为空，但最近观看记录仍在本地：必须恢复到该集，
    // 而不是固定退回默认第 08 集（与详情页续播使用同一份 getResume 规则）。
    const resume = library.getResume(content.programId);
    if (resume) return { programId: content.programId, episodeId: resume.episodeId };
    return { programId: content.programId, episodeId: content.defaultEpisodeId };
  }

  /** @param {number} percent */
  function applyProgress(percent) {
    progressBar.setAttribute('aria-valuenow', String(percent));
    progressFill.setAttribute('style', '--jq-progress:' + percent + '%');
  }

  /** @param {WatchSelection} selection @returns {number} */
  function progressFor(selection) {
    const saved = library.getProgress(selection.programId, selection.episodeId);
    if (saved !== null) return saved;
    if (
      selection.programId === content.programId &&
      selection.episodeId === content.defaultEpisodeId
    ) {
      return content.defaultProgress;
    }
    return 0;
  }

  /** @param {string} message @param {boolean} persisted */
  function setProgressFeedback(message, persisted) {
    progressFeedback.textContent = persisted
      ? message
      : message + ' 本机无法保存，本次只在当前页面有效。';
  }

  /**
   * 应用当前集的示例画面与解说：切集后画面 alt 与「小暖说」必须对应当前集，
   * 不能继续描述上一集（Review PR #44 内容一致性）。
   * @param {ProgramEpisode} episode
   */
  function applyEpisodeContent(episode) {
    if (stillImage) {
      if (episode.image) stillImage.setAttribute('src', './assets/img/' + episode.image);
      stillImage.setAttribute('alt', '示例画面：' + (episode.imageAlt ?? content.still.imageAlt));
    }
    noteToggle.hidden = false;
    noteText.textContent = episode.aiNote ?? content.aiNote.text;
  }

  /** 选中某集：只更新会话与播放器，不重建场景，因此切主题不会丢。 */
  /** @param {string} programId @param {string} episodeId */
  function selectEpisode(programId, episodeId) {
    library.setSelection({ programId, episodeId });
    progressFeedback.textContent = '';
    renderPlayerState();
  }

  /** @param {ProgramDetail} detail */
  function ensureStrip(detail) {
    const signature =
      detail.program.id +
      ':' +
      detail.episodes.map((item) => item.id + (item.available ? '1' : '0')).join(',');
    if (signature === stripSignature) return;
    stripSignature = signature;
    strip.replaceChildren();
    episodeButtons = new Map();
    for (const episode of detail.episodes) {
      const node = episodeButton(documentRef, episode, {
        onSelect: () => selectEpisode(detail.program.id, episode.id),
        onUnavailable: () => {
          const range = detail.sampleRange
            ? detail.sampleRange.from + '–' + detail.sampleRange.to
            : '';
          progressFeedback.textContent =
            '第 ' +
            episode.label +
            ' 集不在示例可播放范围（第 ' +
            range +
            ' 集）内，未接入真实片源。';
        },
      });
      episodeButtons.set(episode.id, node);
      strip.append(node);
    }
  }

  /** @param {ProgramDetail | null} detail @param {ProgramEpisode | undefined} nextEpisode */
  function renderNext(detail, nextEpisode) {
    next.replaceChildren();
    if (!detail || !detail.playable) {
      next.append(createNode(documentRef, 'p', 'jq-video-next__label', '示例资源未接入'));
      return;
    }
    if (!nextEpisode) {
      const to = detail.sampleRange ? detail.sampleRange.to : '';
      next.append(
        createNode(documentRef, 'p', 'jq-video-next__label', '已经是最后一集'),
        createNode(
          documentRef,
          'p',
          'jq-video-next__done',
          '示例可播放范围到第 ' + to + ' 集为止，后面没有更多示例资源。',
        ),
      );
      return;
    }
    next.append(createNode(documentRef, 'p', 'jq-video-next__label', '下一集'));
    const row = createNode(documentRef, 'button', 'jq-video-next__row');
    row.setAttribute('type', 'button');
    row.setAttribute('data-episode', nextEpisode.id);
    const thumb = createMedia(documentRef, content.nextStill);
    thumb.classList.add('jq-video-next__thumb');
    const text = createNode(documentRef, 'div', 'jq-video-next__text');
    text.append(
      createNode(
        documentRef,
        'p',
        'jq-video-next__name',
        '第 ' + nextEpisode.label + ' 集 · ' + (nextEpisode.title ?? ''),
      ),
      createNode(documentRef, 'p', 'jq-video-next__meta', '示例可播放 · 点击切到下一集'),
    );
    row.append(thumb, text);
    row.addEventListener('click', () => selectEpisode(detail.program.id, nextEpisode.id));
    next.append(row);
  }

  /** @param {WatchSelection} selection @param {ProgramDetail | null} detail */
  function renderNotFound(selection, detail) {
    bar.hidden = true;
    play.hidden = true;
    notFound.hidden = false;
    notFound.replaceChildren();
    // 未接入片源的集没有专属示例内容：隐藏可能不匹配的「小暖说」，画面退回通用说明。
    noteToggle.hidden = true;
    noteToggle.setAttribute('aria-expanded', 'false');
    note.hidden = true;
    if (stillImage) stillImage.setAttribute('alt', '示例画面：' + content.still.imageAlt);
    heading.textContent = detail ? detail.program.title : content.title;
    heading.append(epLabel);
    epLabel.textContent = '第 ' + selection.episodeId + ' 集（示例资源未接入）';
    const range =
      detail && detail.sampleRange ? detail.sampleRange.from + '–' + detail.sampleRange.to : '';
    notFound.append(
      createNode(
        documentRef,
        'p',
        'jq-player__notice-title',
        detail ? '未找到示例播放资源' : '未找到该节目的示例详情',
      ),
      createNode(
        documentRef,
        'p',
        'jq-player__notice-text',
        detail
          ? '第 ' +
              selection.episodeId +
              ' 集不在示例可播放范围（第 ' +
              range +
              ' 集）内，未接入真实片源。'
          : '示例节目目录里没有这个节目，无法进入示例播放。',
      ),
    );
    const available = detail ? detail.episodes.filter((episode) => episode.available) : [];
    if (detail && available.length > 0) {
      const start = available[0];
      const startButton = createNode(
        documentRef,
        'button',
        'jq-btn jq-btn--primary jq-btn--sm',
        '从第 ' + start.label + ' 集开始（示例）',
      );
      startButton.setAttribute('type', 'button');
      startButton.addEventListener('click', () => selectEpisode(detail.program.id, start.id));
      notFound.append(startButton);
    }
  }

  function renderPlayerState() {
    const selection = currentSelection();
    const detail = getProgramDetail(selection.programId);
    const episode =
      detail && detail.playable
        ? detail.episodes.find((item) => item.id === selection.episodeId)
        : undefined;
    if (!detail || !detail.playable || !episode || !episode.available) {
      renderNext(detail, undefined);
      renderNotFound(selection, detail);
      return;
    }

    ensureStrip(detail);
    notFound.hidden = true;
    bar.hidden = false;
    play.hidden = false;

    heading.textContent = detail.program.title;
    heading.append(epLabel);
    epLabel.textContent =
      '第 ' + episode.label + ' 集' + (episode.title ? ' · ' + episode.title : '');
    applyEpisodeContent(episode);

    for (const [id, node] of episodeButtons) {
      const current = id === episode.id;
      node.setAttribute('aria-pressed', current ? 'true' : 'false');
      if (current) node.classList.add('jq-ep--current');
      else node.classList.remove('jq-ep--current');
    }

    const saved = library.getProgress(selection.programId, selection.episodeId);
    const percent = progressFor(selection);
    applyProgress(percent);
    timeLabel.textContent = '示例进度 ' + percent + '%';
    if (saved === null) {
      resumeNote.hidden = true;
    } else {
      resumeNote.hidden = false;
      resumeNote.textContent = '已记录示例进度 ' + percent + '%（演示，非真实播放时间）。';
    }

    const favorite = library.isFavorite(selection.programId);
    favoriteBtn.setAttribute('aria-pressed', favorite ? 'true' : 'false');
    favoriteBtn.textContent = favorite ? '已追剧' : '追剧';
    sideChip.textContent = favorite ? '已追剧（示例）' : '未追剧（示例）';

    const availableEpisodes = detail.episodes.filter((item) => item.available);
    const index = availableEpisodes.findIndex((item) => item.id === episode.id);
    renderNext(detail, index >= 0 ? availableEpisodes[index + 1] : undefined);
  }

  /** @param {number} delta */
  function stepProgress(delta) {
    const selection = currentSelection();
    const result = library.saveProgress(
      selection.programId,
      selection.episodeId,
      progressFor(selection) + delta,
    );
    setProgressFeedback(
      '示例进度已记录到 ' + result.percent + '%（演示，非真实播放时间）。',
      result.persisted,
    );
    renderPlayerState();
  }

  backStep.addEventListener('click', () => stepProgress(-PROGRESS_STEP));
  forwardStep.addEventListener('click', () => stepProgress(PROGRESS_STEP));

  favoriteBtn.addEventListener('click', () => {
    const selection = currentSelection();
    const result = library.toggleFavorite(selection.programId);
    setProgressFeedback(
      result.favorite ? '已加入追剧片单（示例）。' : '已取消追剧（示例）。',
      result.persisted,
    );
    renderPlayerState();
  });

  backDetail.addEventListener('click', () => {
    if (returnRoute) activate(returnRoute);
  });

  playerControls.set(body, {
    apply: (applyOptions = {}) => {
      returnRoute = applyOptions.returnRoute ?? null;
      backDetail.hidden = !returnRoute;
      renderPlayerState();
    },
  });

  return body;
}

/**
 * 选集按钮：示例可播放的集可切换（本地状态，不重建场景）；未接入的集给明确反馈。
 * @param {Document} documentRef
 * @param {ProgramEpisode} episode
 * @param {{ onSelect: () => void, onUnavailable: () => void }} handlers
 * @returns {HTMLButtonElement}
 */
function episodeButton(documentRef, episode, handlers) {
  const node = /** @type {HTMLButtonElement} */ (
    createNode(documentRef, 'button', 'jq-ep', episode.label)
  );
  node.setAttribute('type', 'button');
  node.setAttribute('data-episode', episode.id);
  node.setAttribute('aria-pressed', 'false');
  if (!episode.available) {
    node.classList.add('jq-ep--unavailable');
    node.setAttribute('aria-disabled', 'true');
    node.setAttribute('aria-label', '第 ' + episode.label + ' 集：示例资源未接入');
    node.addEventListener('click', () => handlers.onUnavailable());
    return node;
  }
  node.addEventListener('click', () => handlers.onSelect());
  return node;
}

/**
 * 示例进度步进按钮。
 * @param {Document} documentRef
 * @param {string} label
 * @param {number} delta
 * @returns {HTMLButtonElement}
 */
function progressButton(documentRef, label, delta) {
  const node = /** @type {HTMLButtonElement} */ (
    createNode(documentRef, 'button', 'jq-player__btn', label)
  );
  node.setAttribute('type', 'button');
  node.setAttribute('data-progress-step', String(delta));
  return node;
}
