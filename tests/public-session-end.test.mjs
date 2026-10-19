import assert from 'node:assert/strict';
import test from 'node:test';
import { mountApp } from '../web/assets/app.js';
import { createPublicSessionEnd } from '../web/components/public-session-end.js';
import { collect, createFakeDocument } from './helpers/fake-dom.mjs';

/** @param {import('./helpers/fake-dom.mjs').FakeNode} root @param {(node: import('./helpers/fake-dom.mjs').FakeNode) => boolean} predicate */
const find = (root, predicate) => collect(root, predicate);

/** @param {import('./helpers/fake-dom.mjs').FakeNode} root @param {string} action */
const actionNode = (root, action) =>
  find(root, (node) => node.getAttribute('data-action') === action)[0];

/** @param {import('./helpers/fake-dom.mjs').FakeNode} root @param {string} action */
function clickAction(root, action) {
  const node = actionNode(root, action);
  assert.ok(node, 'expected a visible action for ' + action);
  node.dispatch('click');
  return node;
}

/** @param {import('./helpers/fake-dom.mjs').FakeNode} root @param {string} route */
function clickRoute(root, route) {
  const entry = find(root, (node) => node.getAttribute('data-route') === route)[0];
  assert.ok(entry, 'expected a navigation entry for route ' + route);
  entry.dispatch('click');
  return entry;
}

/** @param {import('./helpers/fake-dom.mjs').FakeNode} root @param {string} className */
const nodeOfClass = (root, className) =>
  find(root, (node) => node.classList.contains(className))[0];

/** @param {import('./helpers/fake-dom.mjs').FakeNode} root */
const textOf = (root) =>
  collect(root, () => true)
    .map((node) => node.textContent ?? '')
    .join(' ');

/** @param {import('./helpers/fake-dom.mjs').FakeNode} body @param {string} keyword */
function submitKeyword(body, keyword) {
  const field = nodeOfClass(body, 'jq-search__field');
  field.value = keyword;
  nodeOfClass(body, 'jq-programs-search').dispatch('submit', { preventDefault() {} });
}

/** @param {import('./helpers/fake-dom.mjs').FakeNode} body */
const resultsNode = (body) => nodeOfClass(body, 'jq-activities__results');
/** @param {import('./helpers/fake-dom.mjs').FakeNode} body */
const detailNode = (body) => nodeOfClass(body, 'jq-activity-detail');

/** @param {import('./helpers/fake-dom.mjs').FakeNode} root */
const activityScene = (root) => nodeOfClass(root, 'jq-scene--activities');

/**
 * 进入公共活动目录并留下可验证的访客临时状态：关键词 + 打开的详情。
 * @param {import('../web/components/app-shell.js').SceneShell} shell
 */
function leaveGuestState(shell) {
  clickRoute(shell.element, 'activity');
  const scene = activityScene(shell.element);
  assert.ok(scene, 'the public terminal can enter the shared activity directory');
  submitKeyword(scene, '太极');
  assert.equal(nodeOfClass(scene, 'jq-search__field').value, '太极');
  clickAction(scene, 'activity-detail');
  assert.equal(detailNode(scene).hidden, false, 'a guest detail is left open');
  return scene;
}

test('the end surface offers cancel, confirm and a simulated idle-timeout entry', () => {
  const doc = createFakeDocument();
  /** @type {string[]} */
  const reasons = [];
  const surface = createPublicSessionEnd(doc, {
    onEnd: (reason) => reasons.push(reason),
  });

  assert.equal(surface.entry.getAttribute('data-action'), 'public-session-end');
  assert.equal(surface.entry.textContent, '结束体验并清除');
  assert.equal(surface.overlay.hidden, true);
  assert.equal(surface.overlay.getAttribute('role'), 'dialog');
  assert.equal(surface.overlay.getAttribute('aria-modal'), 'true');

  // 入口打开二次确认；面板说明会清除什么、不会保存什么，以及设备级清理边界。
  surface.entry.dispatch('click');
  assert.equal(surface.overlay.hidden, false);
  const dialogText = textOf(surface.overlay);
  assert.match(dialogText, /结束本次体验并清除/);
  assert.match(dialogText, /活动筛选、详情与报名接力草稿/);
  assert.match(dialogText, /不会保存账户记忆/);
  assert.match(dialogText, /设备级缓存/);
  assert.match(dialogText, /摄像头 \/ 麦克风复位尚未接入/);
  assert.ok(actionNode(surface.overlay, 'public-session-end-cancel'));
  assert.ok(actionNode(surface.overlay, 'public-session-end-timeout'));
  assert.ok(actionNode(surface.overlay, 'public-session-end-confirm'));

  // 取消：只关面板，不触发清理。
  clickAction(surface.overlay, 'public-session-end-cancel');
  assert.equal(surface.overlay.hidden, true);
  assert.deepEqual(reasons, []);

  // 模拟空闲超时与主动确认走同一个 onEnd，只带不同的原因。
  surface.entry.dispatch('click');
  clickAction(surface.overlay, 'public-session-end-timeout');
  assert.equal(surface.overlay.hidden, true);
  assert.deepEqual(reasons, ['timeout']);

  surface.entry.dispatch('click');
  clickAction(surface.overlay, 'public-session-end-confirm');
  assert.equal(surface.overlay.hidden, true);
  assert.deepEqual(reasons, ['timeout', 'manual']);
});

test('a public terminal always exposes the end entry and cancel keeps the guest session', () => {
  const doc = createFakeDocument();
  const { shell } = mountApp(doc, undefined, { deviceMode: 'public' });
  const entry = actionNode(shell.element, 'public-session-end');
  assert.ok(entry, 'G00 carries an always-visible end entry');
  assert.equal(entry.hidden, false);
  assert.equal(shell.getMode(), 'public');

  const scene = leaveGuestState(shell);
  assert.equal(entry.hidden, false, 'the entry stays available inside the activity detail');

  entry.dispatch('click');
  assert.equal(shell.isPublicSessionEndOpen(), true);
  clickAction(shell.element, 'public-session-end-cancel');

  assert.equal(shell.isPublicSessionEndOpen(), false);
  assert.equal(activityScene(shell.element), scene, 'cancel keeps the same guest scene');
  assert.equal(nodeOfClass(scene, 'jq-search__field').value, '太极');
  assert.equal(detailNode(scene).hidden, false);
});

test('confirm ends the public session, returns G00 and the next visit starts clean', () => {
  const doc = createFakeDocument();
  const { shell } = mountApp(doc, undefined, { deviceMode: 'public' });
  const scene = leaveGuestState(shell);

  clickAction(shell.element, 'public-session-end');
  clickAction(shell.element, 'public-session-end-confirm');

  const notice = nodeOfClass(shell.element, 'jq-public-session-notice');
  assert.equal(notice.getAttribute('data-session-feedback'), 'cleared');
  assert.match(notice.textContent, /清除临时内容/);
  assert.match(notice.textContent, /下一位使用者/);
  assert.ok(nodeOfClass(shell.element, 'jq-scene--public'), 'the terminal returns to G00');
  assert.equal(activityScene(shell.element), undefined, 'the old guest scene is no longer mounted');
  assert.ok(
    actionNode(shell.element, 'guest-clear'),
    'the fresh G00 restores its clean guest sample',
  );
  assert.equal(shell.isPublicSessionEndOpen(), false);

  // 下一位访客重新进入：新的目录正文，筛选、详情和报名接力都不再保留。
  clickRoute(shell.element, 'activity');
  const revisited = activityScene(shell.element);
  assert.ok(revisited);
  assert.notEqual(revisited, scene, 'the cleaned scene must be rebuilt, not reused');
  assert.equal(
    nodeOfClass(revisited, 'jq-search__field').value,
    '',
    'the previous keyword is gone',
  );
  assert.equal(resultsNode(revisited).getAttribute('data-state'), 'ok');
  assert.equal(detailNode(revisited).hidden, true, 'the previous open detail is gone');
  assert.equal(
    actionNode(revisited, 'activity-signup'),
    undefined,
    'no previous signup view survives',
  );
  assert.equal(actionNode(shell.element, 'public-session-end').hidden, false);

  // 私人领域仍不可达。
  shell.activate('mine');
  assert.equal(shell.getMode(), 'public');
  assert.equal(find(shell.element, (node) => node.classList.contains('jq-user')).length, 0);
});

test('simulated idle timeout runs the same cleanup and reports its own reason', () => {
  const doc = createFakeDocument();
  const { shell } = mountApp(doc, undefined, { deviceMode: 'public' });
  const scene = leaveGuestState(shell);

  clickAction(shell.element, 'public-session-end');
  clickAction(shell.element, 'public-session-end-timeout');

  const notice = nodeOfClass(shell.element, 'jq-public-session-notice');
  assert.equal(notice.getAttribute('data-session-feedback'), 'timeout');
  assert.match(notice.textContent, /空闲超时/);
  assert.match(notice.textContent, /同一清理规则/);
  assert.ok(nodeOfClass(shell.element, 'jq-scene--public'));
  assert.equal(activityScene(shell.element), undefined);
  assert.equal(shell.isPublicSessionEndOpen(), false);

  clickRoute(shell.element, 'activity');
  const revisited = activityScene(shell.element);
  assert.notEqual(revisited, scene);
  assert.equal(nodeOfClass(revisited, 'jq-search__field').value, '');
  assert.equal(detailNode(revisited).hidden, true);
});

test('the end entry is not exposed on a personal device', () => {
  const doc = createFakeDocument();
  const { shell } = mountApp(doc, undefined);
  assert.equal(
    actionNode(shell.element, 'public-session-end'),
    undefined,
    'the private shell never mounts the public end entry',
  );
  shell.openPublicSessionEnd();
  assert.equal(shell.isPublicSessionEndOpen(), false);

  // 个人设备进入「社区版预览」后，公共上下文的结束入口才出现。
  shell.activate('public');
  assert.equal(shell.getMode(), 'public');
  const entry = actionNode(shell.element, 'public-session-end');
  assert.ok(entry);
  assert.equal(entry.hidden, false);
});
