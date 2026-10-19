/**
 * G00 公共服务首页场景正文（复用共享场景壳）。
 *
 * 这是公共终端场景：**不含**个人姓名、私人聊天 / 记忆入口或用户订单。
 * 公共模式的顶栏（app-shell）同样不显示设置、个人身份与「我的」等入口，
 * 普通访客无法从这里进入个人空间。报名 / 服务都未真实接入，界面如实标注示例。
 */
import { createMedia, createNode, createRouteButton } from '../components/kit.js';

/** @typedef {import('../data/fixtures/public.fixture.js').PublicFixture} PublicContent */
/** @typedef {import('../data/fixtures/public.fixture.js').PublicSignup} PublicSignup */
/** @typedef {import('../data/fixtures/public.fixture.js').PublicGuestAi} PublicGuestAi */

/**
 * @param {Document} documentRef
 * @param {PublicContent} content
 * @param {(route: string) => void} activate
 * @returns {HTMLElement}
 */
export function renderPublicBody(documentRef, content, activate) {
  const body = createNode(documentRef, 'div', 'jq-scene jq-scene--public');

  // 社区头图横幅
  const band = createNode(documentRef, 'section', 'jq-public-band');
  band.append(createNode(documentRef, 'p', 'jq-scene__demo', content.demo.notice));
  const bandText = createNode(documentRef, 'div', 'jq-public-band__text');
  bandText.append(
    createNode(documentRef, 'p', 'jq-eyebrow', content.band.eyebrow),
    createNode(documentRef, 'h1', 'jq-public-title', content.band.title),
    createNode(documentRef, 'p', 'jq-public-desc', content.band.desc),
  );
  const stats = createNode(documentRef, 'div', 'jq-public-band__stats');
  for (const stat of content.band.stats) {
    const item = createNode(documentRef, 'div', 'jq-stat');
    item.append(
      createNode(documentRef, 'span', 'jq-stat__num', stat.num),
      createNode(documentRef, 'span', 'jq-stat__cap', stat.cap),
    );
    stats.append(item);
  }
  band.append(bandText, stats);
  body.append(band);

  // 现在可报名
  const signupSection = createNode(documentRef, 'section', 'jq-section');
  signupSection.append(publicSectionHead(documentRef, '现在可报名', '点一下即可登记（示例）'));
  const signupGrid = createNode(documentRef, 'div', 'jq-grid jq-grid--signup');
  for (const item of content.signups) {
    signupGrid.append(renderSignup(documentRef, item, activate));
  }
  signupSection.append(signupGrid);
  body.append(signupSection);

  // 便民福利
  const welfareSection = createNode(documentRef, 'section', 'jq-section');
  welfareSection.append(publicSectionHead(documentRef, '便民福利', ''));
  const welfareRow = createNode(documentRef, 'div', 'jq-welfare-row');
  for (const item of content.welfare) {
    const node = createNode(documentRef, 'div', 'jq-welfare');
    const icon = createNode(documentRef, 'span', 'jq-welfare__ico', item.icon);
    icon.setAttribute('aria-hidden', 'true');
    node.append(
      icon,
      createNode(documentRef, 'p', 'jq-welfare__name', item.name),
      createNode(documentRef, 'p', 'jq-welfare__sub', item.sub),
    );
    welfareRow.append(node);
  }
  welfareSection.append(welfareRow);
  body.append(welfareSection);

  // 公共课程
  const courseSection = createNode(documentRef, 'section', 'jq-section');
  courseSection.append(publicSectionHead(documentRef, '公共课程', '数字人讲师（示例）'));
  const courseRail = createNode(documentRef, 'div', 'jq-rail jq-rail--courses');
  for (const course of content.courses) {
    courseRail.append(renderPublicCourse(documentRef, course));
  }
  courseSection.append(courseRail);
  body.append(courseSection);

  // AI 趣玩 · 公共体验（C02）：只在本次页面会话展示虚构样本，随时可结束清除。
  const guestSection = createNode(documentRef, 'section', 'jq-section jq-public-guest');
  guestSection.setAttribute('aria-labelledby', 'jq-public-guest-title');
  const guestHead = createNode(documentRef, 'header', 'jq-section__head');
  const guestHeading = createNode(documentRef, 'h2', 'jq-section__title', content.guestAi.title);
  guestHeading.setAttribute('id', 'jq-public-guest-title');
  guestHead.append(
    guestHeading,
    createNode(documentRef, 'span', 'jq-section__sub', '示例 · 可试玩'),
  );
  guestSection.append(guestHead, renderGuestAi(documentRef, content.guestAi));
  body.append(guestSection);

  // 常用服务
  const serviceSection = createNode(documentRef, 'section', 'jq-section');
  serviceSection.append(publicSectionHead(documentRef, '常用服务', '示例入口，尚未接入'));
  const serviceRow = createNode(documentRef, 'div', 'jq-service-row');
  for (const label of content.services) {
    serviceRow.append(createRouteButton(documentRef, 'jq-service', label, 'service', activate));
  }
  serviceSection.append(serviceRow);
  body.append(serviceSection);

  return body;
}

/**
 * 公共设备 / 游客的 AI 趣玩临时体验（C02）：只在页面会话展示**虚构样本**，并提供
 * 「结束体验并清除」。它不读取也不写入个人作品、联系人或任何持久化记录；清除后
 * 页面明确反馈没有保留内容，避免把上一位使用者的痕迹留给下一位。
 * @param {Document} documentRef
 * @param {PublicGuestAi} guest
 * @returns {HTMLElement}
 */
function renderGuestAi(documentRef, guest) {
  const wrap = createNode(documentRef, 'div', 'jq-guest-ai');
  const feedback = createNode(documentRef, 'p', 'jq-guest-ai__feedback');
  feedback.setAttribute('role', 'status');
  feedback.setAttribute('aria-live', 'polite');
  feedback.hidden = true;
  const stage = createNode(documentRef, 'div', 'jq-guest-ai__stage');

  let cleared = false;

  /** @param {string} message */
  function setFeedback(message) {
    feedback.textContent = message;
    feedback.hidden = message.length === 0;
  }

  /** 依据 `cleared` 重绘体验卡：未清除时展示示例，清除后只留「已清除」反馈。 */
  function renderStage() {
    const nodes = [];
    if (cleared) {
      const clearedBox = createNode(documentRef, 'div', 'jq-guest-ai__cleared');
      clearedBox.append(
        createNode(documentRef, 'p', 'jq-guest-ai__cleared-title', guest.clearedTitle),
        createNode(documentRef, 'p', 'jq-result__note', guest.clearedText),
      );
      const reopen = createNode(documentRef, 'button', 'jq-btn jq-btn--ghost', guest.reopenCta);
      reopen.setAttribute('type', 'button');
      reopen.setAttribute('data-action', 'guest-reopen');
      reopen.addEventListener('click', () => {
        cleared = false;
        renderStage();
        setFeedback('');
      });
      clearedBox.append(reopen);
      nodes.push(clearedBox);
    } else {
      const card = createNode(documentRef, 'article', 'jq-panel jq-guest-ai__card');
      const media = createMedia(documentRef, guest.artwork);
      media.append(createNode(documentRef, 'span', 'jq-result__watermark', guest.artworkLabel));
      const cardBody = createNode(documentRef, 'div', 'jq-guest-ai__body');
      const clear = createNode(documentRef, 'button', 'jq-btn jq-btn--primary', guest.clearCta);
      clear.setAttribute('type', 'button');
      clear.setAttribute('data-action', 'guest-clear');
      clear.addEventListener('click', () => {
        cleared = true;
        renderStage();
        setFeedback(guest.clearedText);
      });
      cardBody.append(
        createNode(documentRef, 'h3', 'jq-guest-ai__name', guest.artwork.title),
        createNode(documentRef, 'p', 'jq-result__note', guest.note),
        clear,
      );
      card.append(media, cardBody);
      nodes.push(card);
    }
    stage.replaceChildren(...nodes);
  }

  wrap.append(createNode(documentRef, 'p', 'jq-scene__demo', guest.notice), feedback, stage);
  renderStage();
  return wrap;
}

/**
 * @param {Document} documentRef
 * @param {string} title
 * @param {string} sub
 * @returns {HTMLElement}
 */
function publicSectionHead(documentRef, title, sub) {
  const head = createNode(documentRef, 'header', 'jq-section__head');
  head.append(createNode(documentRef, 'h2', 'jq-section__title', title));
  if (sub) head.append(createNode(documentRef, 'span', 'jq-section__sub', sub));
  return head;
}

/**
 * @param {Document} documentRef
 * @param {PublicSignup} item
 * @param {(route: string) => void} activate
 * @returns {HTMLElement}
 */
function renderSignup(documentRef, item, activate) {
  const article = createNode(documentRef, 'article', 'jq-panel jq-act');
  const media = createMedia(documentRef, item);
  const body = createNode(documentRef, 'div', 'jq-act__body');
  const foot = createNode(documentRef, 'div', 'jq-act__foot');
  const chip = createNode(documentRef, 'span', 'jq-chip', item.price);
  if (item.free) chip.classList.add('jq-chip--free');
  foot.append(
    chip,
    createRouteButton(documentRef, 'jq-btn jq-btn--primary jq-btn--sm', '报名', 'signup', activate),
  );
  body.append(
    createNode(documentRef, 'h3', 'jq-act__name', item.title),
    createNode(documentRef, 'p', 'jq-act__meta', item.meta),
    foot,
  );
  article.append(media, body);
  return article;
}

/**
 * @param {Document} documentRef
 * @param {import('../data/fixtures/public.fixture.js').PublicCourse} course
 * @returns {HTMLElement}
 */
function renderPublicCourse(documentRef, course) {
  const article = createNode(documentRef, 'article', 'jq-course-card');
  article.append(createMedia(documentRef, course));
  const body = createNode(documentRef, 'div', 'jq-course-card__body');
  body.append(
    createNode(documentRef, 'h3', 'jq-course-card__name', course.title),
    createNode(documentRef, 'p', 'jq-course-card__meta', course.meta),
  );
  article.append(body);
  return article;
}
