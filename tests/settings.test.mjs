import assert from 'node:assert/strict';
import test from 'node:test';
import { createThemePreferences } from '../web/data/preferences.js';
import { getHomeContent } from '../web/data/api.js';
import { renderHome } from '../web/pages/home.js';
import { collect, createFakeDocument } from './helpers/fake-dom.mjs';
import { createFakeStorage } from './helpers/fake-storage.mjs';

const SAVED_MESSAGE = '已保存你的选择，刷新后仍会使用。';
const SAVE_FAILED_MESSAGE = '本机无法保存偏好：本次选择只在当前页面有效，刷新后会恢复。';
const NO_STORAGE_MESSAGE = '本机不能保存外观偏好：选择会立即生效，但刷新后会恢复默认。';
const NO_PREFERENCE_MESSAGE = '还没有保存过外观偏好：选一个就记住，下次打开还在。';

/** @param {{ element: import('./helpers/fake-dom.mjs').FakeNode }} view */
function find(view, predicate) {
  return collect(view.element, predicate);
}

function setup(options = {}) {
  const doc = createFakeDocument();
  const storage = createFakeStorage(options.storage);
  const preferences = createThemePreferences(options.noStorage ? null : storage);
  const view = renderHome(doc, getHomeContent(), options.initialTheme, preferences);
  return { doc, storage, preferences, view };
}

test('settings entry opens a real 外观与主题 panel, not the demo quick buttons', () => {
  const { view } = setup();
  const entry = find(view, (node) => node.hasAttribute('data-open-settings'))[0];
  assert.ok(entry, 'a 设置 entry must exist');
  assert.equal(entry.hasAttribute('data-route'), false, '设置 is a real feature, not a demo route');

  const panel = find(view, (node) => node.classList.contains('jq-settings'))[0];
  assert.ok(panel, 'settings panel must exist');
  assert.equal(panel.hidden, true, 'settings starts closed');
  assert.equal(panel.getAttribute('role'), 'dialog');
  assert.equal(panel.getAttribute('aria-modal'), 'true');
  assert.equal(panel.getAttribute('aria-labelledby'), 'jq-settings-title');

  const picker = find(view, (node) => node.classList.contains('jq-theme-picker'))[0];
  assert.equal(picker.getAttribute('role'), 'group');
  assert.equal(picker.getAttribute('aria-label'), '外观与主题');
  const cards = find(view, (node) => node.hasAttribute('data-theme-choice'));
  assert.deepEqual(
    cards.map((card) => card.getAttribute('data-theme-choice')),
    ['a', 'b'],
  );
  assert.ok(
    cards.every((card) => card.hasAttribute('aria-pressed')),
    'selection state must be exposed via aria-pressed',
  );
  const names = find(view, (node) => node.classList.contains('jq-theme-card__name'));
  assert.deepEqual(
    names.map((node) => node.textContent),
    ['日光客厅', '暖夜剧场'],
  );

  entry.dispatch('click');
  assert.equal(panel.hidden, false, '设置 must open the panel');
  assert.equal(find(view, (node) => node.classList.contains('jq-settings__back')).length, 1);
});

test('choosing a theme applies instantly, marks selection and persists it', () => {
  const { doc, storage, view } = setup();
  const panel = find(view, (node) => node.classList.contains('jq-settings'))[0];
  find(view, (node) => node.hasAttribute('data-open-settings'))[0].dispatch('click');
  assert.equal(panel.hidden, false);

  const themeB = find(view, (node) => node.getAttribute('data-theme-choice') === 'b')[0];
  themeB.dispatch('click');

  assert.equal(doc.documentElement.getAttribute('data-dir'), 'b', 'theme applies immediately');
  assert.equal(themeB.getAttribute('aria-pressed'), 'true');
  const themeA = find(view, (node) => node.getAttribute('data-theme-choice') === 'a')[0];
  assert.equal(themeA.getAttribute('aria-pressed'), 'false');
  assert.equal(storage.getItem('jianqu.theme-preference'), 'b', 'preference must be persisted');
  const status = find(view, (node) => node.classList.contains('jq-settings__status'))[0];
  assert.equal(status.textContent, SAVED_MESSAGE);
  // 选中态不只靠颜色：唯一可见的「当前使用」文字落在选中的卡片上。
  const visibleState = find(
    view,
    (node) => node.classList.contains('jq-theme-card__state') && node.hidden === false,
  );
  assert.equal(visibleState.length, 1);
  assert.equal(visibleState[0].textContent, '当前使用');
});

test('a failed save is reported while the choice still applies this session', () => {
  const { doc, storage, view } = setup({ storage: { failWrites: true } });
  find(view, (node) => node.hasAttribute('data-open-settings'))[0].dispatch('click');
  find(view, (node) => node.getAttribute('data-theme-choice') === 'a')[0].dispatch('click');

  assert.equal(doc.documentElement.getAttribute('data-dir'), 'a');
  assert.equal(storage.getItem('jianqu.theme-preference'), null);
  const status = find(view, (node) => node.classList.contains('jq-settings__status'))[0];
  assert.equal(status.textContent, SAVE_FAILED_MESSAGE);
});

test('no storage permission is stated plainly and never blanks the page', () => {
  const { doc, view } = setup({ noStorage: true });
  find(view, (node) => node.hasAttribute('data-open-settings'))[0].dispatch('click');
  const status = find(view, (node) => node.classList.contains('jq-settings__status'))[0];
  assert.equal(status.textContent, NO_STORAGE_MESSAGE);

  // 仍然可以切换：只是不持久化。
  find(view, (node) => node.getAttribute('data-theme-choice') === 'b')[0].dispatch('click');
  assert.equal(doc.documentElement.getAttribute('data-dir'), 'b');
  assert.equal(status.textContent, SAVE_FAILED_MESSAGE);
});

test('opening settings states when no preference has been saved yet', () => {
  const { view } = setup();
  find(view, (node) => node.hasAttribute('data-open-settings'))[0].dispatch('click');
  const status = find(view, (node) => node.classList.contains('jq-settings__status'))[0];
  assert.equal(status.textContent, NO_PREFERENCE_MESSAGE);
});

test('returning from settings keeps the home DOM, scroll area and pending feedback', () => {
  const { view } = setup();
  const scrollBefore = find(view, (node) => node.classList.contains('jq-scroll'))[0];
  find(view, (node) => node.getAttribute('data-route') === 'signup')[0].dispatch('click');
  const toast = find(view, (node) => node.classList.contains('jq-toast'))[0];
  const toastText = find(view, (node) => node.getAttribute('role') === 'status')[0];
  const shown = toastText.textContent;
  assert.equal(toast.hidden, false);

  find(view, (node) => node.hasAttribute('data-open-settings'))[0].dispatch('click');
  find(view, (node) => node.getAttribute('data-theme-choice') === 'b')[0].dispatch('click');
  find(view, (node) => node.classList.contains('jq-settings__back'))[0].dispatch('click');

  const panel = find(view, (node) => node.classList.contains('jq-settings'))[0];
  assert.equal(panel.hidden, true, '返回首页 closes the panel');
  assert.equal(find(view, (node) => node.classList.contains('jq-scroll'))[0], scrollBefore);
  assert.equal(find(view, (node) => node.classList.contains('jq-scroll')).length, 1);
  assert.equal(toast.hidden, false, 'theme switch must not dismiss the feedback');
  assert.equal(toastText.textContent, shown, 'feedback text must survive the round-trip');
});

test('settings modal makes the background inert while open and restores it on return', () => {
  const { view } = setup();
  const header = find(view, (node) => node.classList.contains('jq-header'))[0];
  const scroll = find(view, (node) => node.classList.contains('jq-scroll'))[0];

  find(view, (node) => node.hasAttribute('data-open-settings'))[0].dispatch('click');
  assert.equal(header.hasAttribute('inert'), true);
  assert.equal(scroll.hasAttribute('inert'), true);

  find(view, (node) => node.classList.contains('jq-settings__back'))[0].dispatch('click');
  assert.equal(header.hasAttribute('inert'), false);
  assert.equal(scroll.hasAttribute('inert'), false);
});

test('Escape closes settings and hands focus back to the entry', () => {
  const { view } = setup();
  const entry = find(view, (node) => node.hasAttribute('data-open-settings'))[0];
  entry.dispatch('click');
  const panel = find(view, (node) => node.classList.contains('jq-settings'))[0];
  assert.equal(panel.hidden, false);

  panel.dispatch('keydown', { key: 'Escape' });
  assert.equal(panel.hidden, true);
  assert.equal(entry.focused, true, 'focus must return to the 设置 entry');
});

test('the demo quick buttons stay a session-only pilot control', () => {
  const { doc, storage, view } = setup();
  const demoB = find(view, (node) => node.getAttribute('data-dir-option') === 'b')[0];
  demoB.dispatch('click');
  assert.equal(doc.documentElement.getAttribute('data-dir'), 'b');
  assert.equal(
    storage.getItem('jianqu.theme-preference'),
    null,
    'demo control must not impersonate the persisted user setting',
  );
});

test('settings panel adds no per-theme page classes and no second h1', () => {
  const { view } = setup();
  assert.equal(find(view, (node) => node.tagName === 'H1').length, 1);
  const classes = find(view, () => true).flatMap((node) =>
    node.className.split(/\s+/).filter(Boolean),
  );
  assert.ok(classes.some((name) => name.startsWith('jq-settings')));
  assert.ok(classes.every((name) => name.startsWith('jq-')));
});
