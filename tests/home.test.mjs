import assert from 'node:assert/strict';
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
  const themeB = collect(view.element, (node) => node.getAttribute('data-dir-option') === 'b')[0];
  const themeA = collect(view.element, (node) => node.getAttribute('data-dir-option') === 'a')[0];
  assert.equal(themeB.getAttribute('aria-pressed'), 'true');
  assert.equal(themeA.getAttribute('aria-pressed'), 'false');

  // Switching a theme changes no business DOM and no interaction state.
  assert.equal(collect(view.element, (node) => node.tagName === 'BUTTON').length, buttonsBefore);
  const statusNode = collect(view.element, (node) => node.getAttribute('role') === 'status')[0];
  assert.equal(statusNode.textContent, statusBefore);
  assert.equal(view.controller.getStatus(), statusBefore);
});
