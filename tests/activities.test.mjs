import assert from 'node:assert/strict';
import test from 'node:test';
import { mountApp } from '../web/assets/app.js';
import { getActivityContent } from '../web/data/api.js';
import { renderActivitiesBody } from '../web/pages/activities.js';
import { collect, createFakeDocument } from './helpers/fake-dom.mjs';

/** @param {import('./helpers/fake-dom.mjs').FakeNode} root */
const find = (root, predicate) => collect(root, predicate);

/** @param {import('./helpers/fake-dom.mjs').FakeNode} root */
const textOf = (root) =>
  collect(root, () => true)
    .map((node) => node.textContent ?? '')
    .join(' ');

/** @param {import('./helpers/fake-dom.mjs').FakeNode} body */
const resultsNode = (body) =>
  find(body, (node) => node.classList.contains('jq-activities__results'))[0];

/** @param {import('./helpers/fake-dom.mjs').FakeNode} body */
const directoryNode = (body) =>
  find(body, (node) => node.classList.contains('jq-activities__directory'))[0];

/** @param {import('./helpers/fake-dom.mjs').FakeNode} body */
const detailNode = (body) => find(body, (node) => node.classList.contains('jq-activity-detail'))[0];

/** @param {import('./helpers/fake-dom.mjs').FakeNode} body */
const stateOf = (body) => resultsNode(body).getAttribute('data-state');

/** @param {import('./helpers/fake-dom.mjs').FakeNode} body */
const itemIds = (body) =>
  find(body, (node) => node.hasAttribute('data-activity')).map((node) =>
    node.getAttribute('data-activity'),
  );

/** @param {import('./helpers/fake-dom.mjs').FakeNode} body */
const pressedCategory = (body) => {
  const pressed = find(
    body,
    (node) => node.hasAttribute('data-category') && node.getAttribute('aria-pressed') === 'true',
  )[0];
  return pressed ? pressed.getAttribute('data-category') : null;
};

/** @param {import('./helpers/fake-dom.mjs').FakeNode} body */
const searchField = (body) => find(body, (node) => node.classList.contains('jq-search__field'))[0];

/** @param {import('./helpers/fake-dom.mjs').FakeNode} body */
const searchForm = (body) => find(body, (node) => node.classList.contains('jq-programs-search'))[0];

/** @param {import('./helpers/fake-dom.mjs').FakeNode} body */
const stateTitle = (body) =>
  find(body, (node) => node.classList.contains('jq-programs__state-title'))[0]?.textContent ?? '';

/** @param {import('./helpers/fake-dom.mjs').FakeNode} body */
const signupView = (body) => find(body, (node) => node.classList.contains('jq-activity-signup'))[0];

/** @param {import('./helpers/fake-dom.mjs').FakeNode} root @param {string} action */
function clickAction(root, action) {
  const entry = find(root, (node) => node.getAttribute('data-action') === action)[0];
  assert.ok(entry, 'expected a visible action for ' + action);
  entry.dispatch('click');
  return entry;
}

/** @param {import('./helpers/fake-dom.mjs').FakeNode} body */
const detailMain = (body) =>
  find(body, (node) => node.classList.contains('jq-activity-detail__main'))[0];

/** @param {import('./helpers/fake-dom.mjs').FakeNode} body @param {string} id */
function clickCategory(body, id) {
  const tab = find(body, (node) => node.getAttribute('data-category') === id)[0];
  assert.ok(tab, 'expected a category tab for ' + id);
  tab.dispatch('click');
}

/** @param {import('./helpers/fake-dom.mjs').FakeNode} body @param {string} keyword */
function submitKeyword(body, keyword) {
  searchField(body).value = keyword;
  searchForm(body).dispatch('submit', { preventDefault() {} });
}

/** @param {import('./helpers/fake-dom.mjs').FakeNode} body @param {number} [index] */
function clickDetail(body, index = 0) {
  const entry = find(body, (node) => node.getAttribute('data-action') === 'activity-detail')[index];
  assert.ok(entry, 'expected a detail entry on the sample cards');
  entry.dispatch('click');
}

/** @param {import('../web/components/app-shell.js').SceneShell} shell @param {string} route */
function clickRoute(shell, route) {
  const entry = find(shell.element, (node) => node.getAttribute('data-route') === route)[0];
  assert.ok(entry, 'expected a formal navigation entry for route ' + route);
  entry.dispatch('click');
  return entry;
}

const content = getActivityContent();

test('L01-A fixture is explicit sample data with stable ids and required fields', () => {
  assert.equal(content.demo.level, 'S1');
  assert.match(content.demo.notice, /示例/);
  assert.deepEqual(
    content.categories.map((entry) => entry.id),
    ['all', 'activity', 'welfare'],
  );

  const seen = new Set();
  let activities = 0;
  let welfare = 0;
  for (const item of content.items) {
    assert.ok(['activity', 'welfare'].includes(item.category));
    assert.equal(seen.has(item.id), false, 'activity ids must be unique');
    seen.add(item.id);
    for (const field of [
      'title',
      'summary',
      'time',
      'place',
      'area',
      'audience',
      'provider',
      'price',
    ]) {
      assert.ok(item[field], item.id + ' must define ' + field);
    }
    assert.match(item.provider, /虚构/, item.id + ' provider must be labelled fictional');
    assert.match(item.price, /免费|示例/, item.id + ' price must be labelled');
    assert.match(item.image, /^art-.+\.jpg$/);
    assert.match(item.imageAlt, /氛围画面/);
    // 不编造剩余名额、距离或步行时间。
    assert.doesNotMatch(item.price, /余\s*\d+/);
    assert.doesNotMatch(item.place + item.audience, /步行|距离|米|公里/);
    if (item.category === 'activity') activities += 1;
    else welfare += 1;
  }
  assert.ok(activities >= 2, 'the directory needs activities');
  assert.ok(welfare >= 2, 'the directory needs welfare entries');

  // L02 报名是显式 S1 演示：既有可报名样本，也有三种演示异常状态。
  assert.match(content.signup.notice, /不提交真实身份/);
  assert.match(content.signup.notice, /不占用真实名额/);
  const states = content.items.map((item) => item.signupState ?? 'available');
  for (const state of ['available', 'full', 'joined', 'cancelled']) {
    assert.ok(states.includes(state), 'the sample needs a ' + state + ' signup state');
  }
});

test('the directory renders one h1, three categories and all sample items by default', () => {
  const doc = createFakeDocument();
  const body = renderActivitiesBody(doc, content, () => {});

  assert.equal(find(body, (node) => node.tagName === 'H1').length, 1);
  assert.equal(find(body, (node) => node.hasAttribute('data-category')).length, 3);
  assert.equal(pressedCategory(body), 'all');
  assert.equal(stateOf(body), 'ok');
  assert.deepEqual(
    itemIds(body),
    content.items.map((item) => item.id),
  );

  // 示例标注可见：每张卡片都带「示例」徽标与虚构提供方。
  const badges = find(body, (node) => node.classList.contains('jq-activity-card__badge'));
  assert.equal(badges.length, content.items.length);
  for (const badge of badges) assert.match(badge.textContent, /示例/);

  // 主题不分叉 DOM。
  assert.equal(find(body, (node) => node.hasAttribute('data-dir')).length, 0);
  const classes = find(body, () => true).flatMap((node) =>
    node.className.split(/\s+/).filter(Boolean),
  );
  assert.ok(classes.every((name) => name.startsWith('jq-')));
});

test('category switching really changes the list', () => {
  const doc = createFakeDocument();
  const body = renderActivitiesBody(doc, content, () => {});

  clickCategory(body, 'activity');
  assert.equal(pressedCategory(body), 'activity');
  assert.equal(stateOf(body), 'ok');
  assert.deepEqual(
    itemIds(body),
    content.items.filter((item) => item.category === 'activity').map((item) => item.id),
  );

  clickCategory(body, 'welfare');
  assert.equal(pressedCategory(body), 'welfare');
  assert.deepEqual(
    itemIds(body),
    content.items.filter((item) => item.category === 'welfare').map((item) => item.id),
  );

  clickCategory(body, 'all');
  assert.equal(itemIds(body).length, content.items.length);
});

test('keyword filtering has a real hit, an explicit empty state and a way back', () => {
  const doc = createFakeDocument();
  const body = renderActivitiesBody(doc, content, () => {});

  submitKeyword(body, '太极');
  assert.equal(stateOf(body), 'ok');
  assert.deepEqual(itemIds(body), ['taiji']);

  // 分类内无命中：福利 + 太极 → 清楚的空状态。
  clickCategory(body, 'welfare');
  assert.equal(stateOf(body), 'empty');
  assert.match(stateTitle(body), /福利/);
  assert.match(stateTitle(body), /太极/);
  assert.equal(itemIds(body).length, 0);

  const reset = find(body, (node) => node.getAttribute('data-action') === 'activity-clear')[0];
  assert.ok(reset, 'the empty state must offer a real recovery path');
  reset.dispatch('click');
  assert.equal(searchField(body).value, '');
  assert.equal(pressedCategory(body), 'all');
  assert.equal(stateOf(body), 'ok');
  assert.equal(itemIds(body).length, content.items.length);

  // 清空按钮同样恢复列表。
  submitKeyword(body, '查无此活动zzz');
  assert.equal(stateOf(body), 'empty');
  find(body, (node) => node.textContent === '清除筛选')[0].dispatch('click');
  assert.equal(stateOf(body), 'ok');
});

test('a sample opens one shared detail and its personal signup confirmation', () => {
  const doc = createFakeDocument();
  const body = renderActivitiesBody(doc, content, () => {});
  const first = content.items[0];

  clickDetail(body);
  const detail = detailNode(body);
  const directory = directoryNode(body);
  assert.equal(detail.hidden, false, 'the detail view must be visible after clicking a sample');
  assert.equal(directory.hidden, true, 'the directory is hidden but kept for its state');

  const detailText = textOf(detail);
  for (const expected of [
    first.title,
    first.time,
    first.place,
    first.area,
    first.audience,
    first.provider,
    first.price,
  ]) {
    assert.ok(detailText.includes(expected), 'the shared detail must show ' + expected);
  }
  assert.match(detailText, /活动 · 示例/);
  assert.match(detailText, /虚构示例/);
  assert.match(detailText, /未提供 \/ 演示待确认/);
  assert.match(detailText, /演示报名状态：可报名（演示）/);

  // 个人设备：详情 → 大屏报名 → 确认摘要；取消不产生报名状态。
  const signup = find(detail, (node) => node.getAttribute('data-action') === 'activity-signup')[0];
  assert.ok(signup, 'the detail must offer a real signup entry');
  assert.match(signup.textContent, /大屏报名/);
  signup.dispatch('click');
  const view = signupView(detail);
  assert.equal(view.hidden, false);
  assert.equal(view.getAttribute('data-signup-stage'), 'confirm');
  assert.equal(detailMain(detail).hidden, true, 'the summary replaces the detail body');
  const confirmText = textOf(view);
  assert.match(confirmText, /确认报名信息/);
  assert.ok(confirmText.includes(first.title), 'the summary uses the same selected activity');
  assert.match(confirmText, /模拟/);
  assert.doesNotMatch(confirmText, /报名成功|真实报名回执/);

  clickAction(view, 'signup-cancel');
  const detailFeedback = find(detail, (node) =>
    node.classList.contains('jq-activity-detail__feedback'),
  )[0];
  assert.equal(view.hidden, true, 'cancelling closes the confirmation view');
  assert.equal(detailMain(detail).hidden, false);
  assert.match(detailFeedback.textContent, /取消模拟报名/);
  assert.match(detailFeedback.textContent, /没有提交报名/);
  assert.doesNotMatch(textOf(detail), /模拟报名结果/);
  assert.equal(resultsNode(body).getAttribute('data-state'), 'ok');

  // 返回目录：详情关闭，目录与列表状态仍在。
  const back = find(
    detail,
    (node) => node.getAttribute('data-action') === 'activity-detail-back',
  )[0];
  assert.ok(back, 'the detail must provide a real return path');
  back.dispatch('click');
  assert.equal(detail.hidden, true);
  assert.equal(directory.hidden, false);
  assert.deepEqual(
    itemIds(body),
    content.items.map((item) => item.id),
  );
});

test('personal confirmation reaches a simulated result and leaves no signup state behind', () => {
  const doc = createFakeDocument();
  const body = renderActivitiesBody(doc, content, () => {});
  const first = content.items[0];

  clickDetail(body);
  const detail = detailNode(body);
  clickAction(detail, 'activity-signup');
  const view = signupView(detail);
  clickAction(view, 'signup-confirm');

  assert.equal(view.getAttribute('data-signup-stage'), 'result');
  const resultText = textOf(view);
  assert.match(resultText, /模拟报名结果/);
  assert.match(resultText, /未接入真实报名/);
  assert.match(resultText, /非真实报名回执/);
  assert.match(resultText, /没有发送报名请求/);
  assert.doesNotMatch(resultText, /报名成功|已生成核销凭证/);
  assert.equal(resultsNode(body).getAttribute('data-state'), 'ok');

  // 返回详情：模拟结果只是页面演示，不持久化任何报名状态。
  clickAction(view, 'signup-result-back');
  assert.equal(view.hidden, true);
  assert.equal(detailMain(detail).hidden, false);
  assert.match(
    find(detail, (node) => node.classList.contains('jq-activity-detail__feedback'))[0].textContent,
    /没有保存为报名记录/,
  );

  // 关闭再打开同一条活动：仍回到可报名的确认摘要，不残留上一次结果。
  clickAction(detail, 'activity-detail-back');
  clickDetail(body);
  const reopened = detailNode(body);
  assert.equal(signupView(reopened).hidden, true);
  clickAction(reopened, 'activity-signup');
  assert.equal(signupView(reopened).getAttribute('data-signup-stage'), 'confirm');
  assert.match(textOf(signupView(reopened)), new RegExp(first.title));
});

test('full, already-joined and cancelled samples give explicit demo exceptions', () => {
  const cases = [
    ['chayi', 'full', /名额已满/],
    ['dubao', 'joined', /已报名/],
    ['liangxueya', 'cancelled', /活动已取消/],
  ];
  for (const [id, state, titlePattern] of cases) {
    const doc = createFakeDocument();
    const body = renderActivitiesBody(doc, content, () => {});
    const index = content.items.findIndex((item) => item.id === id);
    assert.ok(index >= 0, 'fixture must contain ' + id);

    clickDetail(body, index);
    const detail = detailNode(body);
    assert.match(textOf(detail), titlePattern, id + ' must announce its demo state before signup');
    clickAction(detail, 'activity-signup');

    const view = signupView(detail);
    assert.equal(view.getAttribute('data-signup-stage'), 'exception');
    assert.equal(view.getAttribute('data-signup-exception'), state);
    assert.match(textOf(view), titlePattern);
    assert.match(textOf(view), /演示状态/);
    assert.match(textOf(view), /未接入真实报名服务/);
    assert.doesNotMatch(textOf(view), /报名成功/);
    assert.equal(
      find(view, (node) => node.getAttribute('data-action') === 'signup-confirm').length,
      0,
      'an exception sample must not reach the confirmation form',
    );

    clickAction(view, 'signup-back-detail');
    assert.equal(view.hidden, true);
    assert.equal(detailMain(detail).hidden, false);
  }
});

test('returning from a detail keeps the selected category and keyword', () => {
  const doc = createFakeDocument();
  const body = renderActivitiesBody(doc, content, () => {});

  clickCategory(body, 'welfare');
  submitKeyword(body, '理发');
  const filtered = itemIds(body);
  assert.deepEqual(filtered, ['lifa']);

  clickDetail(body);
  assert.equal(stateOf(body), 'ok');
  const back = find(
    detailNode(body),
    (node) => node.getAttribute('data-action') === 'activity-detail-back',
  )[0];
  back.dispatch('click');

  assert.equal(pressedCategory(body), 'welfare');
  assert.equal(searchField(body).value, '理发');
  assert.deepEqual(itemIds(body), filtered);
});

test('missing detail data is labelled as not provided instead of invented', () => {
  const doc = createFakeDocument();
  const sparse = {
    ...content,
    items: [{ ...content.items[0], place: '', provider: '' }],
  };
  const body = renderActivitiesBody(doc, sparse, () => {});

  clickDetail(body);
  const detailText = textOf(detailNode(body));
  const fallbacks = detailText.match(/未提供 \/ 演示待确认/g) ?? [];
  assert.ok(fallbacks.length >= 2, 'each missing fact must show the shared fallback text');
  assert.doesNotMatch(detailText, /余\s*\d+|步行|距离|米|公里/);
});

test('H01 activity entries open the real directory inside the shared shell', () => {
  const doc = createFakeDocument();
  const { shell } = mountApp(doc, undefined);

  // 首页「家门口的活动 · 全部」与活动卡片都进入目录。
  clickRoute(shell, 'activity');
  const scene = find(shell.element, (node) => node.classList.contains('jq-scene--activities'))[0];
  assert.ok(scene, 'the activity entry must open the L01-A directory');
  assert.equal(find(shell.element, (node) => node.classList.contains('jq-home-body')).length, 0);
  assert.equal(find(scene, (node) => node.tagName === 'H1').length, 1);

  // 目录返回首页后，首页仍在。
  clickRoute(shell, 'home');
  assert.equal(find(shell.element, (node) => node.classList.contains('jq-home-body')).length, 1);

  // 首页活动卡片的画面入口同样指向目录，而不是只发一条 Toast。
  const openers = find(shell.element, (node) => node.classList.contains('jq-activity__open'));
  assert.ok(openers.length >= 1);
  for (const opener of openers) assert.equal(opener.getAttribute('data-route'), 'activity');

  // 报名按钮不再指向 signup 提示，而是先到示例目录（L02 未接入）。
  const signups = find(shell.element, (node) => node.classList.contains('jq-activity__signup'));
  assert.ok(signups.length >= 1);
  for (const signup of signups) assert.equal(signup.getAttribute('data-route'), 'activity');
});

test('a public terminal enters the same directory and detail inside the public shell', () => {
  const doc = createFakeDocument();
  const { show, shell } = mountApp(doc, undefined, { deviceMode: 'public' });

  assert.equal(show('activity'), 'activity');
  assert.equal(shell.getMode(), 'public');
  const scene = find(shell.element, (node) => node.classList.contains('jq-scene--activities'))[0];
  assert.ok(scene, 'the public terminal may browse the shared L01 directory');

  // 公共壳仍不含个人身份、私人数据、设置或 AI 常驻入口。
  assert.equal(find(shell.element, (node) => node.classList.contains('jq-home-body')).length, 0);
  assert.equal(find(shell.element, (node) => node.classList.contains('jq-user')).length, 0);
  assert.equal(find(shell.element, (node) => node.hasAttribute('data-open-settings')).length, 0);
  assert.equal(find(shell.element, (node) => node.classList.contains('jq-ai-fab'))[0].hidden, true);

  // 同一份详情：标题与数据来自同一活动 fixture。
  clickDetail(scene);
  const detail = detailNode(scene);
  assert.equal(detail.hidden, false);
  assert.ok(textOf(detail).includes(content.items[0].title));

  const detailBack = find(
    detail,
    (node) => node.getAttribute('data-action') === 'activity-detail-back',
  )[0];
  detailBack.dispatch('click');
  assert.equal(directoryNode(scene).hidden, false);
  assert.equal(detailNode(scene).hidden, true);

  // 目录的「返回」在公共设备回到 G00，而不是个人首页。
  const sceneBack = find(scene, (node) => node.classList.contains('jq-scene__back'))[0];
  assert.equal(sceneBack.getAttribute('data-route'), 'public');
  sceneBack.dispatch('click');
  assert.equal(shell.getMode(), 'public');
  assert.equal(
    find(shell.element, (node) => node.classList.contains('jq-scene--public')).length,
    1,
  );
  assert.equal(find(shell.element, (node) => node.classList.contains('jq-home-body')).length, 0);
});

test('a public terminal only sees the phone handoff concept with demo feedback', () => {
  const doc = createFakeDocument();
  const { show, shell } = mountApp(doc, undefined, { deviceMode: 'public' });

  assert.equal(show('activity'), 'activity');
  const scene = find(shell.element, (node) => node.classList.contains('jq-scene--activities'))[0];
  clickDetail(scene);
  const detail = detailNode(scene);

  // 公共设备不展示本人确认表单，只说明转到自有手机 H5。
  const signup = find(detail, (node) => node.getAttribute('data-action') === 'activity-signup')[0];
  assert.match(signup.textContent, /手机/);
  assert.doesNotMatch(signup.textContent, /大屏报名/);
  clickAction(detail, 'activity-signup');

  const view = signupView(detail);
  assert.equal(view.getAttribute('data-signup-stage'), 'handoff');
  const handoffText = textOf(view);
  assert.match(handoffText, /转到你自己的手机继续/);
  assert.match(handoffText, /不采集姓名、手机号或身份会话/);
  assert.match(handoffText, /本公共屏幕不收集手机号/);
  assert.doesNotMatch(handoffText, /报名成功/);

  // 示例二维码必须标明不可真实扫码，也不得采集手机号 / 姓名等隐私字段。
  const qr = find(view, (node) => node.hasAttribute('data-qr-sample'))[0];
  assert.ok(qr, 'the handoff must show a sample QR concept');
  assert.match(qr.getAttribute('aria-label'), /不可真实扫码/);
  assert.match(qr.getAttribute('aria-label'), /不会建立身份会话/);
  assert.match(textOf(qr), /示例/);
  assert.equal(
    find(view, (node) => ['INPUT', 'TEXTAREA', 'FORM'].includes(node.tagName)).length,
    0,
  );

  // 不可用 / 超时 / 失败反馈都能看到，并明确没有真实连接。
  const status = find(view, (node) => node.hasAttribute('data-signup-feedback'))[0];
  assert.match(status.textContent, /暂不可用/);
  clickAction(view, 'signup-demo-timeout');
  assert.equal(status.getAttribute('data-signup-feedback'), 'timeout');
  assert.match(status.textContent, /超时/);
  assert.match(status.textContent, /没有建立身份会话/);
  clickAction(view, 'signup-demo-failure');
  assert.equal(status.getAttribute('data-signup-feedback'), 'failure');
  assert.match(status.textContent, /失败/);
  assert.match(status.textContent, /没有保存手机号/);
  clickAction(view, 'signup-demo-unavailable');
  assert.equal(status.getAttribute('data-signup-feedback'), 'unavailable');

  // 取消接力：回到详情，没有建立会话，也没有个人信息留在公共屏幕。
  clickAction(view, 'signup-handoff-cancel');
  assert.equal(view.hidden, true);
  assert.equal(detailMain(detail).hidden, false);
  assert.match(
    find(detail, (node) => node.classList.contains('jq-activity-detail__feedback'))[0].textContent,
    /没有建立身份会话/,
  );
  assert.equal(find(scene, (node) => node.classList.contains('jq-user')).length, 0);
  assert.equal(find(scene, (node) => node.hasAttribute('data-open-settings')).length, 0);

  // 离开公共场景再回来：详情收起，接力视图不会被下一位访客看到。
  find(scene, (node) => node.classList.contains('jq-scene__back'))[0].dispatch('click');
  assert.equal(show('activity'), 'activity');
  const revisited = find(shell.element, (node) =>
    node.classList.contains('jq-scene--activities'),
  )[0];
  assert.equal(detailNode(revisited).hidden, true);
  clickDetail(revisited);
  const freshDetail = detailNode(revisited);
  assert.equal(signupView(freshDetail).hidden, true);
  assert.equal(signupView(freshDetail).getAttribute('data-signup-stage'), null);
});

test('switching A/B theme keeps the open signup confirmation', () => {
  const doc = createFakeDocument();
  const { shell } = mountApp(doc, undefined);

  clickRoute(shell, 'activity');
  const scene = find(shell.element, (node) => node.classList.contains('jq-scene--activities'))[0];
  clickDetail(scene);
  const detail = detailNode(scene);
  clickAction(detail, 'activity-signup');
  const view = signupView(detail);
  assert.equal(view.getAttribute('data-signup-stage'), 'confirm');

  shell.applyTheme('b');
  assert.equal(doc.documentElement.getAttribute('data-dir'), 'b');
  assert.equal(signupView(detail), view, 'theme switching must not rebuild the signup view');
  assert.equal(view.getAttribute('data-signup-stage'), 'confirm');
  assert.equal(find(view, (node) => node.hasAttribute('data-dir')).length, 0);
});

test('leaving the scene from an open detail closes it for the next visit', () => {
  const doc = createFakeDocument();
  const { shell } = mountApp(doc, undefined);

  clickRoute(shell, 'activity');
  const scene = find(shell.element, (node) => node.classList.contains('jq-scene--activities'))[0];
  clickDetail(scene);
  assert.equal(detailNode(scene).hidden, false);

  find(scene, (node) => node.classList.contains('jq-scene__back'))[0].dispatch('click');
  assert.equal(find(shell.element, (node) => node.classList.contains('jq-home-body')).length, 1);

  clickRoute(shell, 'activity');
  const revisited = find(shell.element, (node) =>
    node.classList.contains('jq-scene--activities'),
  )[0];
  assert.equal(detailNode(revisited).hidden, true, 'a fresh directory visit starts on the list');
  assert.equal(directoryNode(revisited).hidden, false);
});

test('switching A/B theme keeps the same open detail DOM', () => {
  const doc = createFakeDocument();
  const { shell } = mountApp(doc, undefined);

  clickRoute(shell, 'activity');
  const scene = find(shell.element, (node) => node.classList.contains('jq-scene--activities'))[0];
  clickDetail(scene);
  const detail = detailNode(scene);

  shell.applyTheme('b');
  assert.equal(doc.documentElement.getAttribute('data-dir'), 'b');
  assert.equal(detailNode(scene), detail, 'theme switching must not rebuild the detail');
  assert.equal(detail.hidden, false);
  assert.equal(find(detail, (node) => node.hasAttribute('data-dir')).length, 0);
});
