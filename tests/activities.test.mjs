import assert from 'node:assert/strict';
import test from 'node:test';
import { mountApp } from '../web/assets/app.js';
import { getActivityContent } from '../web/data/api.js';
import { renderActivitiesBody } from '../web/pages/activities.js';
import { collect, createFakeDocument } from './helpers/fake-dom.mjs';

/** @param {import('./helpers/fake-dom.mjs').FakeNode} root */
const find = (root, predicate) => collect(root, predicate);

/** @param {import('./helpers/fake-dom.mjs').FakeNode} body */
const resultsNode = (body) =>
  find(body, (node) => node.classList.contains('jq-activities__results'))[0];

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

test('a detail entry is honest about L01-B and never claims signup success', () => {
  const doc = createFakeDocument();
  const body = renderActivitiesBody(doc, content, () => {});
  const feedback = find(body, (node) => node.classList.contains('jq-activities__feedback'))[0];

  find(body, (node) => node.getAttribute('data-action') === 'activity-detail')[0].dispatch('click');
  assert.match(feedback.textContent, /L01-B/);
  assert.match(feedback.textContent, /尚未接入|不会产生/);
  assert.doesNotMatch(feedback.textContent, /报名成功|已报名/);

  // 注入详情去向时交给调用方（L01-B 接入点），不在本卡伪造详情。
  const opened = [];
  const withDetail = renderActivitiesBody(doc, content, () => {}, {
    onOpenDetail: (item) => opened.push(item.id),
  });
  find(withDetail, (node) => node.getAttribute('data-action') === 'activity-detail')[0].dispatch(
    'click',
  );
  assert.deepEqual(opened, [content.items[0].id]);
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

test('public device mode still cannot reach the personal directory', () => {
  const doc = createFakeDocument();
  const { show, shell } = mountApp(doc, undefined, { deviceMode: 'public' });
  assert.equal(show('activity'), 'public');
  assert.equal(shell.getMode(), 'public');
  assert.equal(
    find(shell.element, (node) => node.classList.contains('jq-scene--activities')).length,
    0,
  );
});
