import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { getHomeContent } from '../web/data/api.js';
import { describeRoute, renderHome } from '../web/pages/home.js';
import { collect, createFakeDocument } from './helpers/fake-dom.mjs';

test('H01 fixture is explicitly labeled S1 sample data and carries the home entries', () => {
  const content = getHomeContent();
  assert.equal(content.demo.level, 'S1');
  assert.match(content.demo.notice, /示例/);
  assert.ok(content.nav.length >= 5);
  assert.ok(content.continueWatching.length >= 1);
  assert.ok(content.recommendations.length >= 3);
  assert.ok(content.activities.length >= 1);
  assert.ok(content.creations.length >= 1);
  assert.match(content.companion.name, /小暖/);
  assert.equal(content.featured.progress, 64);
});

test('H01 renders one shared DOM with a single h1 and no per-theme business DOM', () => {
  const doc = createFakeDocument();
  const content = getHomeContent();
  const view = renderHome(doc, content);

  assert.equal(collect(view.element, (node) => node.tagName === 'MAIN').length, 1);
  const headings = collect(view.element, (node) => node.tagName === 'H1');
  assert.equal(headings.length, 1);
  assert.equal(headings[0].textContent, content.featured.title);

  // Themes must never fork the DOM: no element owns a data-dir container.
  assert.equal(collect(view.element, (node) => node.hasAttribute('data-dir')).length, 0);
  // Every entry reports its own route on one shared verb.
  assert.ok(collect(view.element, (node) => node.hasAttribute('data-route')).length >= 10);
});

test('every home entry is operable and answers with an honest demo notice', () => {
  const doc = createFakeDocument();
  const view = renderHome(doc, getHomeContent());
  const routes = [
    ...new Set(
      collect(view.element, (node) => node.hasAttribute('data-route')).map((node) =>
        node.getAttribute('data-route'),
      ),
    ),
  ];
  assert.ok(routes.length >= 8, 'expected the H01 entry set');

  for (const route of routes) {
    const entry = collect(view.element, (node) => node.getAttribute('data-route') === route)[0];
    entry.dispatch('click');
    assert.match(view.controller.getStatus(), /示例|演示/, 'route ' + route + ' must stay honest');
  }

  assert.match(describeRoute('unmapped-route'), /示例/);
});

test('rendered classes never fork by theme (no a-/b- page classes)', () => {
  const doc = createFakeDocument();
  const view = renderHome(doc, getHomeContent());
  const classes = collect(view.element, () => true).flatMap((node) =>
    node.className.split(/\s+/).filter(Boolean),
  );
  assert.ok(classes.length > 20);
  assert.ok(classes.every((name) => name.startsWith('jq-')));
});

test('theme switch only swaps the root token marker and keeps the home state', () => {
  const doc = createFakeDocument();
  const view = renderHome(doc, getHomeContent());
  const buttonsBefore = collect(view.element, (node) => node.tagName === 'BUTTON').length;

  const aiEntry = collect(view.element, (node) => node.getAttribute('data-route') === 'ai')[0];
  aiEntry.dispatch('click');
  const statusBefore = view.controller.getStatus();
  assert.ok(statusBefore.length > 0);

  view.applyTheme('b');
  assert.equal(doc.documentElement.getAttribute('data-dir'), 'b');
  const toggle = collect(view.element, (node) => node.hasAttribute('data-theme-toggle'))[0];
  assert.equal(toggle.getAttribute('data-theme-current'), 'b');
  assert.equal(toggle.getAttribute('aria-label'), '切换至日光客厅');

  // Switching a theme changes no business DOM and no interaction state.
  assert.equal(collect(view.element, (node) => node.tagName === 'BUTTON').length, buttonsBefore);
  const statusNode = collect(view.element, (node) => node.getAttribute('role') === 'status')[0];
  assert.equal(statusNode.textContent, statusBefore);
  assert.equal(view.controller.getStatus(), statusBefore);
});

test('entry feedback is a viewport-fixed toast outside the scrolling area', () => {
  const doc = createFakeDocument();
  const view = renderHome(doc, getHomeContent());

  const toast = collect(view.element, (node) => node.classList.contains('jq-toast'))[0];
  assert.ok(toast, 'toast container must exist');
  assert.equal(toast.hidden, true, 'toast starts hidden');

  // 反馈挂在滚动区之外：页面滚到哪里都还在视口内（配合 CSS 的 position: fixed）。
  const scroll = collect(view.element, (node) => node.classList.contains('jq-scroll'))[0];
  assert.ok(scroll);
  assert.equal(collect(scroll, (node) => node === toast).length, 0);

  // 模拟页面已滚动到下方后点击活动「报名」：反馈必须立即可见，且仍是诚实的示例文案。
  // L01-A 起「报名」先进入示例目录（不显示报名成功），目录入口文案仍须如实标注示例。
  const signup = collect(view.element, (node) => node.getAttribute('data-route') === 'activity')[0];
  signup.dispatch('click');
  assert.equal(toast.hidden, false, 'toast must appear right after a below-the-fold click');
  const status = collect(view.element, (node) => node.getAttribute('role') === 'status')[0];
  assert.match(status.textContent, /示例|演示/);

  // 可关闭：关闭后隐藏，但已经发生的操作状态不丢。
  const close = collect(toast, (node) => node.classList.contains('jq-toast__close'))[0];
  assert.ok(close, 'toast must be dismissible');
  close.dispatch('click');
  assert.equal(toast.hidden, true);
  assert.match(view.controller.getStatus(), /示例|演示/);

  // 主题切换不清空反馈：重新打开后切到 B，提示仍可见且文案不变。
  const aiEntry = collect(view.element, (node) => node.getAttribute('data-route') === 'ai')[0];
  aiEntry.dispatch('click');
  const shown = status.textContent;
  view.applyTheme('b');
  assert.equal(toast.hidden, false, 'theme switch must not dismiss the feedback');
  assert.equal(status.textContent, shown);
});

test('toast styling keeps the feedback fixed on screen and clear of the AI entry', () => {
  const css = readFileSync(new URL('../web/assets/components.css', import.meta.url), 'utf8');
  const toastRule = css.match(/\.jq-toast \{[^}]+\}/);
  assert.ok(toastRule, 'toast rule must exist');
  assert.match(toastRule[0], /position: fixed/, 'feedback must stay inside the viewport');
  // 宽度上限为右下角固定「问小暖」入口留出空间。
  assert.match(toastRule[0], /max-width: min\(620px, calc\(100vw - 460px\)\)/);
  assert.match(css, /\.jq-toast\[hidden\] \{\s*display: none;/);
});

test('H01 reuses the OpenDesign imagery as labelled sample media', () => {
  const doc = createFakeDocument();
  const view = renderHome(doc, getHomeContent());
  const images = collect(view.element, (node) => node.tagName === 'IMG');
  assert.ok(images.length >= 15, 'hero, rails, activities and creations must carry imagery');
  for (const image of images) {
    assert.match(image.getAttribute('src'), /^\.\/assets\/img\/art-.+\.jpg$/);
    assert.match(image.getAttribute('alt'), /^示例画面：/);
  }

  // 素材来源与授权必须随影像一起维护（CC BY-SA 署名要求）。
  assert.ok(existsSync(new URL('../web/assets/img/CREDITS.md', import.meta.url)));
  const content = getHomeContent();
  for (const card of [...content.continueWatching, ...content.recommendations]) {
    assert.ok(card.image && card.imageAlt, card.title + ' must reference an attributed image');
  }
  for (const activity of content.activities) {
    assert.ok(activity.image && activity.imageAlt);
  }
  for (const creation of content.creations) {
    assert.ok(creation.image && creation.imageAlt);
  }
  assert.ok(content.featured.image && content.featured.imageAlt);
});
