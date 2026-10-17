/**
 * E01 数字人课程场景正文（复用共享场景壳）。
 *
 * 单套 DOM + 单套数据：A/B 主题只改 CSS 变量。讲师形象、声线未真实接入，
 * 页面显著标注示例；「换个讲法」只在本地切换选中项与展示文案，不伪造数字人。
 * 选中讲法与播放板书状态随共享壳保留，切主题或返回首页不重置。
 */
import { createMedia, createNode, createRouteButton } from '../components/kit.js';

/** @typedef {import('../data/fixtures/course.fixture.js').CourseFixture} CourseContent */

/**
 * @param {Document} documentRef
 * @param {CourseContent} content
 * @param {(route: string) => void} activate
 * @returns {HTMLElement}
 */
export function renderCourseBody(documentRef, content, activate) {
  const body = createNode(documentRef, 'div', 'jq-scene jq-scene--course');

  const head = createNode(documentRef, 'header', 'jq-scene__head');
  const titleBlock = createNode(documentRef, 'div', 'jq-scene__title');
  titleBlock.append(
    createNode(documentRef, 'h1', 'jq-scene__h1', content.title),
    createNode(documentRef, 'p', 'jq-scene__sub', content.sub),
  );
  head.append(
    createRouteButton(documentRef, 'jq-scene__back', '‹ 返回首页', 'home', activate),
    titleBlock,
    createNode(documentRef, 'span', 'jq-chip', content.progressLabel),
  );
  body.append(head);

  const wrap = createNode(documentRef, 'div', 'jq-course-wrap');

  // ---------- 板书（示例教学图 + 三分法辅助线） ----------
  const stage = createNode(documentRef, 'article', 'jq-course-stage');
  const board = createNode(documentRef, 'div', 'jq-course-board');
  board.append(createMedia(documentRef, content.board, true));
  const rule = createNode(documentRef, 'div', 'jq-course-rule');
  rule.setAttribute('aria-hidden', 'true');
  const pin = createNode(documentRef, 'span', 'jq-course-pin', content.board.pin.label);
  pin.setAttribute('style', 'left:' + content.board.pin.left + ';top:' + content.board.pin.top);
  board.append(rule, pin);
  stage.append(
    board,
    createNode(documentRef, 'p', 'jq-course-board__note', '示例板书：教学姿势与画面为氛围示意。'),
  );
  wrap.append(stage);

  // ---------- 侧栏：讲师 / 换个讲法 / 本讲要讲 / 上下节 ----------
  const side = createNode(documentRef, 'aside', 'jq-course-side');

  const presenter = createNode(documentRef, 'div', 'jq-presenter');
  const presenterAvatar = createNode(
    documentRef,
    'span',
    'jq-presenter__ava',
    content.presenter.avatar,
  );
  presenterAvatar.setAttribute('aria-hidden', 'true');
  const presenterText = createNode(documentRef, 'div', 'jq-presenter__text');
  const presenterName = createNode(documentRef, 'p', 'jq-presenter__name', content.presenter.name);
  const presenterStyle = createNode(
    documentRef,
    'p',
    'jq-presenter__style',
    content.presenter.desc,
  );
  presenterText.append(presenterName, presenterStyle);
  presenter.append(presenterAvatar, presenterText);
  side.append(presenter);

  const pick = createNode(documentRef, 'div', 'jq-teacher-pick');
  pick.setAttribute('role', 'group');
  pick.setAttribute('aria-label', '换个讲法');
  pick.append(createNode(documentRef, 'p', 'jq-teacher-label', '换个讲法'));
  /** @type {HTMLButtonElement[]} */
  const teacherButtons = content.teachers.map((teacher, index) => {
    const button = /** @type {HTMLButtonElement} */ (
      createNode(documentRef, 'button', 'jq-teacher')
    );
    button.setAttribute('type', 'button');
    button.setAttribute('aria-pressed', index === 0 ? 'true' : 'false');
    const ava = createNode(documentRef, 'span', 'jq-tava', teacher.avatar);
    ava.setAttribute('aria-hidden', 'true');
    const info = createNode(documentRef, 'span', 'jq-teacher__info');
    info.append(
      createNode(documentRef, 'span', 'jq-teacher__name', teacher.name),
      createNode(documentRef, 'span', 'jq-teacher__desc', teacher.desc),
    );
    button.append(ava, info, createNode(documentRef, 'span', 'jq-teacher__voice', teacher.voice));
    button.addEventListener('click', () => {
      for (const sibling of teacherButtons) sibling.setAttribute('aria-pressed', 'false');
      button.setAttribute('aria-pressed', 'true');
      // 本地更新展示文案，不重建场景；真实数字人讲师尚未接入。
      presenterName.textContent = teacher.name;
      presenterStyle.textContent = teacher.desc + ' · ' + teacher.voice;
    });
    pick.append(button);
    return button;
  });
  side.append(pick);

  const outline = createNode(documentRef, 'div', 'jq-outline');
  outline.append(createNode(documentRef, 'p', 'jq-teacher-label', '本讲要讲'));
  const list = createNode(documentRef, 'ol', 'jq-outline__list');
  content.outline.forEach((line, index) => {
    const li = createNode(
      documentRef,
      'li',
      index === 0 ? 'jq-outline__item jq-outline__item--on' : 'jq-outline__item',
      line,
    );
    list.append(li);
  });
  outline.append(list);
  side.append(outline);

  const controls = createNode(documentRef, 'div', 'jq-course-controls');
  controls.append(
    createRouteButton(
      documentRef,
      'jq-btn jq-btn--ghost jq-btn--sm',
      content.prevLabel,
      'course',
      activate,
    ),
    createRouteButton(
      documentRef,
      'jq-btn jq-btn--primary jq-btn--sm',
      content.nextLabel,
      'course',
      activate,
    ),
  );
  side.append(controls);

  wrap.append(side);
  body.append(wrap);
  return body;
}
