import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import test from 'node:test';
import { getMineContent } from '../web/data/api.js';
import { mountApp } from '../web/assets/app.js';
import { renderMineBody } from '../web/pages/mine.js';
import { collect, createFakeDocument } from './helpers/fake-dom.mjs';

/** @param {import('./helpers/fake-dom.mjs').FakeNode} root @param {(node: import('./helpers/fake-dom.mjs').FakeNode) => boolean} predicate */
function find(root, predicate) {
  return collect(root, predicate);
}

/** @param {import('./helpers/fake-dom.mjs').FakeNode} root @param {string} route */
function clickRoute(root, route) {
  const entry = find(root, (node) => node.getAttribute('data-route') === route)[0];
  assert.ok(entry, 'expected a clickable entry for route ' + route);
  entry.dispatch('click');
  return entry;
}

test('P01 fixture is an explicit S1 sample and never pretends membership was purchased', () => {
  const content = getMineContent();
  assert.equal(content.demo.level, 'S1');
  assert.match(content.demo.notice, /示例/);
  assert.match(content.profile.name, /王秀兰/);

  assert.match(content.membership.status, /未开通/);
  assert.match(content.membership.status, /示例/);
  assert.match(content.membership.badge, /示例/);
  assert.match(content.membership.description, /没有购买/);

  for (const key of ['history', 'works', 'favorites', 'signups', 'orders']) {
    const section = content.sections[key];
    assert.ok(section.items.length >= 1, key + ' needs visible sample records');
    for (const record of section.items) {
      assert.ok(record.image && record.imageAlt, key + ' record imagery must be attributed');
      assert.match(record.note, /示例/);
      assert.ok(
        existsSync(new URL('../web/assets/img/' + record.image, import.meta.url)),
        key + ' / ' + record.id + ' must reference an existing local image',
      );
    }
  }

  // 记录和权益回到已有的演示场景，而不是只在「我的」里停住。
  assert.equal(content.sections.history.items[0].route, 'video');
  assert.equal(content.sections.works.items[0].route, 'create-result');
  assert.equal(content.sections.signups.items[0].route, 'activity');
  assert.equal(content.sections.orders.items[0].route, 'cart');
  assert.equal(content.persona.action.route, 'ai');
});

test('P01 renders all required records with a single h1 and no per-theme DOM', () => {
  const doc = createFakeDocument();
  const body = renderMineBody(doc, getMineContent(), () => {});

  assert.equal(find(body, (node) => node.tagName === 'H1').length, 1);
  assert.equal(find(body, (node) => node.classList.contains('jq-scene--mine')).length, 1);
  assert.equal(find(body, (node) => node.hasAttribute('data-dir')).length, 0);

  for (const key of ['history', 'works', 'favorites', 'signups', 'orders']) {
    const section = find(body, (node) => node.getAttribute('data-mine-section') === key)[0];
    assert.ok(section, key + ' section must render');
    assert.equal(
      find(section, (node) => node.hasAttribute('data-mine-empty')).length,
      0,
      key + ' has sample content, so no empty state is shown',
    );
    assert.ok(
      find(section, (node) => node.hasAttribute('data-mine-record')).length >= 1,
      key + ' must show its sample records',
    );
  }

  // 会员权益明确是未开通示例，不出现「已开通 / 已购买」。
  const status = find(body, (node) => node.hasAttribute('data-membership-status'))[0];
  assert.match(status.textContent, /未开通会员（示例）/);
  assert.equal(find(body, (node) => /已开通|已购买/.test(node.textContent)).length, 0);

  const classes = find(body, () => true).flatMap((node) =>
    node.className.split(/\s+/).filter(Boolean),
  );
  assert.ok(classes.length > 20);
  assert.ok(classes.every((name) => name.startsWith('jq-')));
});

test('empty record groups explain the gap instead of fabricating entries', () => {
  const content = structuredClone(getMineContent());
  for (const key of ['history', 'works', 'favorites', 'signups', 'orders']) {
    content.sections[key].items = [];
  }

  const doc = createFakeDocument();
  const body = renderMineBody(doc, content, () => {});

  for (const key of ['history', 'works', 'favorites', 'signups', 'orders']) {
    const empty = find(body, (node) => node.getAttribute('data-mine-empty') === key)[0];
    assert.ok(empty, key + ' needs an explicit empty state');
    assert.match(empty.textContent, /还没有/);
    assert.equal(
      find(body, (node) => node.getAttribute('data-mine-record')).length,
      0,
      'empty groups must not render fake records',
    );
  }
});

test('personal navigation opens 我的 and every record returns to an existing demo scene', () => {
  const doc = createFakeDocument();
  const { shell, show } = mountApp(doc, undefined);

  const mineNav = find(
    shell.element,
    (node) => node.getAttribute('data-route') === 'mine' && node.classList.contains('jq-nav__item'),
  )[0];
  assert.ok(mineNav, 'personal navigation must expose 我的');
  mineNav.dispatch('click');
  assert.equal(find(shell.element, (node) => node.classList.contains('jq-scene--mine')).length, 1);

  const body = shell.body.childNodes[0];
  for (const route of ['video', 'create-result', 'activity', 'cart', 'programs', 'create', 'ai']) {
    assert.ok(
      find(body, (node) => node.getAttribute('data-route') === route).length >= 1,
      '我的 must link back to the existing ' + route + ' demo',
    );
  }

  // 记录动作真的能离开「我的」并回到既有场景；返回个人中心仍复用同一份页面。
  clickRoute(body, 'activity');
  assert.equal(
    find(shell.element, (node) => node.classList.contains('jq-scene--activities')).length,
    1,
  );
  show('mine');
  assert.equal(find(shell.element, (node) => node.classList.contains('jq-scene--mine')).length, 1);
  clickRoute(shell.body.childNodes[0], 'cart');
  assert.equal(find(shell.element, (node) => node.classList.contains('jq-scene--cart')).length, 1);
});

test('我的 appearance entry opens the same T02 settings panel and theme state survives', () => {
  const doc = createFakeDocument();
  const { shell, show } = mountApp(doc, undefined);
  show('mine');

  const body = shell.body.childNodes[0];
  const settingsEntry = find(
    body,
    (node) => node.getAttribute('data-action') === 'mine-open-settings',
  )[0];
  assert.ok(settingsEntry, '我的 must expose an appearance settings entry');

  const panel = find(shell.element, (node) => node.classList.contains('jq-settings'))[0];
  assert.equal(panel.hidden, true);
  settingsEntry.dispatch('click');
  assert.equal(panel.hidden, false, 'the shared T02 panel opens from 我的');

  // 主题切换只改根标记，不重建「我的」页面。
  const before = shell.body.childNodes[0];
  shell.applyTheme('b');
  assert.equal(doc.documentElement.getAttribute('data-dir'), 'b');
  assert.equal(shell.body.childNodes[0], before);
  assert.equal(find(before, (node) => node.hasAttribute('data-dir')).length, 0);

  find(shell.element, (node) => node.classList.contains('jq-settings__back'))[0].dispatch('click');
  assert.equal(panel.hidden, true);
  assert.equal(settingsEntry.focused, true, 'focus must return to the 我的 settings entry');
});

test('公共终端不能进入我的，也不会渲染私人记录入口', () => {
  const doc = createFakeDocument();
  const { shell, show } = mountApp(doc, undefined, { deviceMode: 'public' });

  assert.equal(show('mine'), 'public');
  assert.equal(shell.getMode(), 'public');
  assert.equal(
    find(shell.element, (node) => node.getAttribute('data-route') === 'mine').length,
    0,
    'public shell must not offer 我的',
  );
  assert.equal(find(shell.element, (node) => node.classList.contains('jq-mine')).length, 0);
  assert.equal(find(shell.element, (node) => node.classList.contains('jq-user')).length, 0);
  assert.equal(find(shell.element, (node) => node.hasAttribute('data-open-settings')).length, 0);
});

test('个人设备进入社区版预览后同样不展示我的入口', () => {
  const doc = createFakeDocument();
  const { shell, show } = mountApp(doc, undefined);

  clickRoute(shell.element, 'public');
  assert.equal(shell.getMode(), 'public');
  assert.equal(
    find(shell.element, (node) => node.getAttribute('data-route') === 'mine').length,
    0,
    'public preview must hide 我的',
  );
  assert.equal(
    show('mine'),
    'public',
    'a synthetic private route may not leave the public preview for 我的',
  );
  assert.equal(find(shell.element, (node) => node.classList.contains('jq-mine')).length, 0);
});
