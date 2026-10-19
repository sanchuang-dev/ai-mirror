import assert from 'node:assert/strict';
import test from 'node:test';
import { mountApp } from '../web/assets/app.js';
import { getPublicContent } from '../web/data/api.js';
import { renderPublicBody } from '../web/pages/public.js';
import { collect, createFakeDocument } from './helpers/fake-dom.mjs';

/** @param {import('./helpers/fake-dom.mjs').FakeNode} root @param {(node: import('./helpers/fake-dom.mjs').FakeNode) => boolean} predicate */
function find(root, predicate) {
  return collect(root, predicate);
}

/** @param {import('./helpers/fake-dom.mjs').FakeNode} root @param {string} action */
function actionButton(root, action) {
  return find(root, (node) => node.getAttribute('data-action') === action)[0];
}

test('the public AI 趣玩 guest fixture is honest and session-only', () => {
  const guest = getPublicContent().guestAi;
  assert.match(guest.notice, /不接真实模型/);
  assert.match(guest.notice, /不读取/);
  assert.match(guest.artworkLabel, /预生成/);
  assert.match(guest.artworkLabel, /非真实/);
  assert.match(guest.note, /本次页面会话|清除/);
  assert.match(guest.clearedText, /没有保存|没有保留/);
});

test('a public-device guest sees only an in-session sample and can end & clear it', () => {
  const doc = createFakeDocument();
  const body = renderPublicBody(doc, getPublicContent(), () => {});

  // 结束前：能看到一张预生成示例作品，但明确标注为演示。
  const guest = find(body, (node) => node.classList.contains('jq-guest-ai'))[0];
  assert.ok(guest, 'the public page renders the guest AI block');
  assert.ok(
    find(guest, (node) => node.classList.contains('jq-media__img'))[0],
    'the guest sample must render a visible image, not a blank placeholder',
  );
  assert.ok(actionButton(guest, 'guest-clear'), 'the guest experience exposes 结束体验并清除');

  // 结束体验并清除：示例被清除，页面明确反馈没有保留内容。
  actionButton(guest, 'guest-clear').dispatch('click');
  assert.equal(actionButton(guest, 'guest-clear'), undefined, 'the sample is cleared');
  assert.ok(
    find(guest, (node) => node.classList.contains('jq-guest-ai__cleared-title'))[0],
    'the cleared state is shown',
  );
  assert.match(
    find(guest, (node) => node.classList.contains('jq-guest-ai__feedback'))[0].textContent,
    /没有保存/,
  );

  // 可再体验一次，且仍处于公共（游客）上下文。
  actionButton(guest, 'guest-reopen').dispatch('click');
  assert.ok(actionButton(guest, 'guest-clear'), 'reopen restores the session-only sample');
});

test('a public terminal boots into G00 with the guest AI demo and no private surface', () => {
  const doc = createFakeDocument();
  const { shell } = mountApp(doc, undefined, { deviceMode: 'public' });
  assert.equal(shell.getMode(), 'public');
  assert.ok(actionButton(shell.element, 'guest-clear'), 'the public page carries the guest demo');
  assert.equal(
    find(shell.element, (node) => node.classList.contains('jq-home-body')).length,
    0,
    'the public terminal never mounts the personal home',
  );
});

test('G00 exposes visible entries into the shared L01 activity directory', () => {
  const doc = createFakeDocument();
  const body = renderPublicBody(doc, getPublicContent(), () => {});

  const entries = find(body, (node) => node.getAttribute('data-route') === 'activity');
  assert.ok(entries.length >= 2, 'both 现在可报名 and 便民福利 need a directory entry');
  const labels = entries.map((entry) => entry.textContent).join(' ');
  assert.match(labels, /全部活动/);
  assert.match(labels, /全部福利/);
});

test('a public terminal can enter the shared directory from G00 and open the same detail', () => {
  const doc = createFakeDocument();
  const { shell } = mountApp(doc, undefined, { deviceMode: 'public' });

  const entry = find(shell.element, (node) => node.getAttribute('data-route') === 'activity')[0];
  assert.ok(entry, 'G00 must expose a visible activity directory entry');
  entry.dispatch('click');

  const scene = find(shell.element, (node) => node.classList.contains('jq-scene--activities'))[0];
  assert.ok(scene, 'the G00 entry opens the shared directory');
  assert.equal(shell.getMode(), 'public');

  const detailEntry = find(
    scene,
    (node) => node.getAttribute('data-action') === 'activity-detail',
  )[0];
  assert.ok(detailEntry, 'the shared directory renders sample detail entries');
  detailEntry.dispatch('click');
  assert.equal(
    find(scene, (node) => node.classList.contains('jq-activity-detail'))[0].hidden,
    false,
  );
  assert.equal(find(shell.element, (node) => node.classList.contains('jq-user')).length, 0);
  assert.equal(find(shell.element, (node) => node.hasAttribute('data-open-settings')).length, 0);
});
