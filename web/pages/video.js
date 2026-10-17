/**
 * V02 视频观看场景正文（复用共享场景壳）。
 *
 * 单套 DOM + 单套数据：A/B 主题只改 CSS 变量，不为两套主题各写一份播放页。
 * 播放器、画质、字幕都未真实接入：所有相关控件给诚实的示例反馈，不伪造播放。
 * 本页保留的场景内状态（选中集数、小暖解说是否展开）不会因切主题或导航返回被重置，
 * 因为正文由共享壳原样保留，切主题也不重建 DOM。
 */
import { createMedia, createNode, createProgress, createRouteButton } from '../components/kit.js';

/** @typedef {import('../data/fixtures/video.fixture.js').VideoFixture} VideoContent */
/** @typedef {import('../data/fixtures/video.fixture.js').VideoEpisode} VideoEpisode */

/**
 * @param {Document} documentRef
 * @param {VideoContent} content
 * @param {(route: string) => void} activate
 * @returns {HTMLElement}
 */
export function renderVideoBody(documentRef, content, activate) {
  const body = createNode(documentRef, 'div', 'jq-scene jq-scene--video');

  // 场景子头：返回首页 + 标题 + 追剧 / 分享。返回入口是正式演示导航的一部分。
  const head = createNode(documentRef, 'header', 'jq-scene__head');
  const titleBlock = createNode(documentRef, 'div', 'jq-scene__title');
  const heading = createNode(documentRef, 'h1', 'jq-scene__h1', content.title);
  heading.append(createNode(documentRef, 'span', 'jq-scene__ep', content.episode));
  titleBlock.append(heading, createNode(documentRef, 'p', 'jq-scene__demo', content.demo.notice));
  const actions = createNode(documentRef, 'div', 'jq-scene__actions');
  actions.append(
    createRouteButton(documentRef, 'jq-btn jq-btn--ghost jq-btn--sm', '追剧', 'favorite', activate),
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
  const play = createNode(documentRef, 'button', 'jq-playbtn');
  play.setAttribute('type', 'button');
  play.setAttribute('aria-label', '播放（示例演示，不会真的播放）');
  play.textContent = '▶';
  play.addEventListener('click', () => activate('play'));
  media.append(play);
  player.append(media);

  const bar = createNode(documentRef, 'div', 'jq-player__bar');
  const controls = createNode(documentRef, 'div', 'jq-player__controls');
  controls.append(createNode(documentRef, 'span', 'jq-player__time', content.timecode));
  const spacer = createNode(documentRef, 'div', 'jq-player__fill');
  controls.append(
    spacer,
    createRouteButton(documentRef, 'jq-player__btn', '画质 · 高清', 'player', activate),
    createRouteButton(documentRef, 'jq-player__btn', '字幕', 'player', activate),
    createRouteButton(documentRef, 'jq-player__btn', '全屏', 'player', activate),
  );
  bar.append(
    createProgress(documentRef, content.progress, 'jq-progress jq-progress--player'),
    controls,
  );
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
  note.append(
    createNode(documentRef, 'p', 'jq-ai-note__name', content.aiNote.name),
    createNode(documentRef, 'p', 'jq-ai-note__text', content.aiNote.text),
  );
  noteToggle.addEventListener('click', () => {
    note.hidden = !note.hidden;
    noteToggle.setAttribute('aria-expanded', note.hidden ? 'false' : 'true');
  });
  player.append(noteToggle, note);
  wrap.append(player);

  // ---------- 侧栏：选集 / 预告 / 看剧搭子 ----------
  const side = createNode(documentRef, 'aside', 'jq-video-side');

  const sideHead = createNode(documentRef, 'div', 'jq-video-side__head');
  sideHead.append(
    createNode(documentRef, 'h2', 'jq-video-side__title', '接着看'),
    createNode(documentRef, 'span', 'jq-chip', content.followLabel),
  );
  side.append(sideHead);

  const strip = createNode(documentRef, 'div', 'jq-episode-strip');
  strip.setAttribute('role', 'group');
  strip.setAttribute('aria-label', '选集');
  for (const episode of content.episodes) {
    strip.append(createEpisodeButton(documentRef, episode));
  }
  side.append(strip);

  const next = createNode(documentRef, 'div', 'jq-video-next');
  next.append(createNode(documentRef, 'p', 'jq-video-next__label', '下一集预告'));
  const nextRow = createNode(documentRef, 'div', 'jq-video-next__row');
  const nextThumb = createMedia(documentRef, content.nextStill);
  nextThumb.classList.add('jq-video-next__thumb');
  const nextText = createNode(documentRef, 'div', 'jq-video-next__text');
  nextText.append(
    createNode(documentRef, 'p', 'jq-video-next__name', content.next.name),
    createNode(documentRef, 'p', 'jq-video-next__meta', content.next.label),
  );
  nextRow.append(nextThumb, nextText);
  next.append(nextRow);
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
  return body;
}

/**
 * 选集按钮：点击只切换本页选中态（示例），不冒充真实播放跳转。
 * @param {Document} documentRef
 * @param {VideoEpisode} episode
 * @returns {HTMLButtonElement}
 */
function createEpisodeButton(documentRef, episode) {
  const node = /** @type {HTMLButtonElement} */ (
    createNode(documentRef, 'button', 'jq-ep', episode.label)
  );
  node.setAttribute('type', 'button');
  node.setAttribute('aria-pressed', episode.current ? 'true' : 'false');
  if (episode.current) node.classList.add('jq-ep--current');
  node.addEventListener('click', () => {
    // 本地状态：只修改本按钮的选中态，不重建场景，因此切主题不会丢。
    const pressed = node.getAttribute('aria-pressed') === 'true';
    node.setAttribute('aria-pressed', pressed ? 'false' : 'true');
    if (pressed) node.classList.remove('jq-ep--current');
    else node.classList.add('jq-ep--current');
  });
  return node;
}
