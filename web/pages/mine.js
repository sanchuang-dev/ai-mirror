/**
 * P01「我的」个人中心正文（复用共享场景壳）。
 *
 * 单套语义 DOM、单一示例数据来源与事件逻辑；A/B 主题只切 `tokens.css` 变量，
 * 不复制页面、不另建一份记录。页面只展示显式示例：样例身份、追剧历史、作品、
 * 收藏、报名、订单示例与会员权益，并用清晰入口回到既有演示场景。
 *
 * 边界（Issue #18）：
 * - 不接真实登录、账号云同步、支付、订单或会员订阅；
 * - 会员状态固定为「未开通会员（示例）」，权益只作说明，不表现为已购买；
 * - 空记录显示明确说明，不编造历史 / 订单 / 收藏；
 * - 公共模式不渲染本页（由 `web/assets/app.js` 的设备守卫与共享壳共同保证）；
 * - 深层人格 / 记忆数据库管理不在本卡范围，只提供现有 AI 角色演示入口。
 */
import { createMedia, createNode, createProgress, createRouteButton } from '../components/kit.js';

/** @typedef {import('../data/fixtures/mine.fixture.js').MineFixture} MineContent */
/** @typedef {import('../data/fixtures/mine.fixture.js').MineRecord} MineRecord */
/** @typedef {import('../data/fixtures/mine.fixture.js').MineSection} MineSection */

/** 个人中心固定分组顺序；数据仍只有 fixture 一份。 */
/** @type {Array<'history' | 'works' | 'favorites' | 'signups' | 'orders'>} */
const SECTION_ORDER = ['history', 'works', 'favorites', 'signups', 'orders'];

/**
 * @typedef {object} MineOptions
 * @property {() => void} [openSettings] 打开共享壳里的 T02「外观与主题」设置面板。
 */

/**
 * 构建 P01「我的」正文（不含顶栏 / 设置面板）。
 * @param {Document} documentRef
 * @param {MineContent} content
 * @param {(route: string) => void} activate 共享壳的统一入口动作。
 * @param {MineOptions} [options]
 * @returns {HTMLElement}
 */
export function renderMineBody(documentRef, content, activate, options = {}) {
  const body = createNode(documentRef, 'div', 'jq-scene jq-scene--mine');

  // ---------- 场景头：返回首页 + 标题 + 示例边界 ----------
  const head = createNode(documentRef, 'header', 'jq-scene__head');
  const titleBlock = createNode(documentRef, 'div', 'jq-scene__title');
  titleBlock.append(
    createNode(documentRef, 'h1', 'jq-scene__h1', '我的'),
    createNode(
      documentRef,
      'p',
      'jq-scene__sub',
      content.profile.name + ' · ' + content.profile.label,
    ),
    createNode(documentRef, 'p', 'jq-scene__demo', content.demo.notice),
  );
  head.append(createRouteButton(documentRef, 'jq-scene__back', '‹ 返回首页', 'home', activate));
  head.append(titleBlock);
  body.append(head);

  // ---------- 样例身份 ----------
  const profile = createNode(documentRef, 'section', 'jq-mine__profile');
  const avatar = createNode(documentRef, 'span', 'jq-mine__avatar', content.profile.avatarText);
  avatar.setAttribute('aria-hidden', 'true');
  const profileText = createNode(documentRef, 'div', 'jq-mine__profile-text');
  profileText.append(
    createNode(documentRef, 'p', 'jq-mine__eyebrow', content.profile.deviceLabel),
    createNode(documentRef, 'h2', 'jq-mine__name', content.profile.name),
    createNode(documentRef, 'p', 'jq-mine__note', content.profile.note),
  );
  profile.append(avatar, profileText);
  body.append(profile);

  // ---------- 会员权益：明确未开通，不伪造已付款 ----------
  const membership = createNode(documentRef, 'section', 'jq-mine__membership');
  const membershipHead = createNode(documentRef, 'header', 'jq-mine__membership-head');
  const membershipTitleBlock = createNode(documentRef, 'div', 'jq-mine__title-block');
  membershipTitleBlock.append(
    createNode(documentRef, 'h2', 'jq-mine__section-title', content.membership.title),
    createNode(documentRef, 'p', 'jq-mine__note', content.membership.description),
  );
  const membershipBadge = createNode(
    documentRef,
    'span',
    'jq-mine__badge',
    content.membership.badge,
  );
  membershipHead.append(membershipTitleBlock, membershipBadge);
  membership.append(membershipHead);

  const membershipStatus = createNode(
    documentRef,
    'p',
    'jq-mine__membership-status',
    content.membership.status,
  );
  membershipStatus.setAttribute('data-membership-status', 'sample');
  const benefits = createNode(documentRef, 'ul', 'jq-mine__benefits');
  for (const benefit of content.membership.benefits) {
    const item = createNode(documentRef, 'li', 'jq-mine__benefit');
    item.append(
      createNode(documentRef, 'span', 'jq-mine__benefit-title', benefit.title),
      createNode(documentRef, 'span', 'jq-mine__benefit-text', benefit.text),
    );
    benefits.append(item);
  }
  membership.append(
    membershipStatus,
    benefits,
    createRouteButton(
      documentRef,
      'jq-btn jq-btn--ghost jq-btn--sm',
      content.membership.action.label,
      content.membership.action.route,
      activate,
    ),
  );
  body.append(membership);

  // ---------- 记录分组：历史 / 作品 / 收藏 / 报名 / 订单 ----------
  const grid = createNode(documentRef, 'div', 'jq-mine__grid');
  for (const key of SECTION_ORDER) {
    grid.append(renderSection(documentRef, key, content.sections[key], activate));
  }
  body.append(grid);

  // ---------- 入口卡片：人格 / 记忆说明 + 外观主题设置 ----------
  const entries = createNode(documentRef, 'div', 'jq-mine__grid jq-mine__grid--entries');

  const persona = createNode(documentRef, 'section', 'jq-mine__card jq-mine__card--entry');
  persona.setAttribute('data-mine-entry', 'persona');
  persona.append(
    createNode(documentRef, 'h2', 'jq-mine__section-title', content.persona.title),
    createNode(documentRef, 'p', 'jq-mine__note', content.persona.description),
    createRouteButton(
      documentRef,
      'jq-btn jq-btn--primary jq-btn--sm',
      content.persona.action.label,
      content.persona.action.route,
      activate,
    ),
  );

  const settings = createNode(documentRef, 'section', 'jq-mine__card jq-mine__card--entry');
  settings.setAttribute('data-mine-entry', 'settings');
  const settingsButton = /** @type {HTMLButtonElement} */ (
    createNode(documentRef, 'button', 'jq-btn jq-btn--primary jq-btn--sm', content.settings.action)
  );
  settingsButton.setAttribute('type', 'button');
  settingsButton.setAttribute('data-action', 'mine-open-settings');
  if (typeof options.openSettings === 'function') {
    settingsButton.addEventListener('click', options.openSettings);
  } else {
    settingsButton.disabled = true;
  }
  settings.append(
    createNode(documentRef, 'h2', 'jq-mine__section-title', content.settings.title),
    createNode(documentRef, 'p', 'jq-mine__note', content.settings.description),
    settingsButton,
  );

  entries.append(persona, settings);
  body.append(entries);

  return body;
}

/**
 * 渲染一个记录分组。没有记录时显示 `emptyText`，而不是空白或伪造条目。
 * @param {Document} documentRef
 * @param {'history' | 'works' | 'favorites' | 'signups' | 'orders'} key
 * @param {MineSection} section
 * @param {(route: string) => void} activate
 * @returns {HTMLElement}
 */
function renderSection(documentRef, key, section, activate) {
  const node = createNode(documentRef, 'section', 'jq-mine__card');
  node.setAttribute('data-mine-section', key);

  const head = createNode(documentRef, 'header', 'jq-mine__card-head');
  const titleBlock = createNode(documentRef, 'div', 'jq-mine__title-block');
  titleBlock.append(
    createNode(documentRef, 'h2', 'jq-mine__section-title', section.title),
    createNode(documentRef, 'p', 'jq-mine__sub', section.sub),
  );
  head.append(
    titleBlock,
    createRouteButton(documentRef, 'jq-more', section.action.label, section.action.route, activate),
  );
  node.append(head);

  if (section.items.length === 0) {
    const empty = createNode(documentRef, 'p', 'jq-mine__empty', section.emptyText);
    empty.setAttribute('data-mine-empty', key);
    node.append(empty);
    return node;
  }

  const list = createNode(documentRef, 'ul', 'jq-mine__records');
  for (const record of section.items) {
    list.append(renderRecord(documentRef, key, record, activate));
  }
  node.append(list);
  return node;
}

/**
 * @param {Document} documentRef
 * @param {string} key
 * @param {MineRecord} record
 * @param {(route: string) => void} activate
 * @returns {HTMLElement}
 */
function renderRecord(documentRef, key, record, activate) {
  const item = createNode(documentRef, 'li', 'jq-mine__record');
  item.setAttribute('data-mine-record', record.id);

  const thumb = createNode(documentRef, 'div', 'jq-mine__thumb');
  thumb.append(
    createMedia(documentRef, {
      tone: record.tone,
      image: record.image,
      imageAlt: record.imageAlt,
      title: record.title,
    }),
  );

  const info = createNode(documentRef, 'div', 'jq-mine__record-body');
  info.append(
    createNode(documentRef, 'p', 'jq-mine__record-title', record.title),
    createNode(documentRef, 'p', 'jq-mine__record-meta', record.meta),
    createNode(documentRef, 'p', 'jq-mine__record-note', record.note),
  );
  if (record.state) {
    info.append(createNode(documentRef, 'span', 'jq-mine__record-state', record.state));
  }
  if (typeof record.progress === 'number') {
    info.append(createProgress(documentRef, record.progress, 'jq-progress jq-progress--mine'));
  }

  const action = createRouteButton(
    documentRef,
    'jq-btn jq-btn--ghost jq-btn--sm',
    record.cta,
    record.route,
    activate,
  );
  action.setAttribute('data-mine-action', key);

  item.append(thumb, info, action);
  return item;
}
