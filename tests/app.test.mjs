import assert from 'node:assert/strict';
import test from 'node:test';
import { mountHome } from '../web/assets/app.js';
import { createFakeDocument } from './helpers/fake-dom.mjs';

test('entry mounts the single H01 home into the expected root', () => {
  const doc = createFakeDocument();
  mountHome(doc, 'b');
  assert.equal(doc.root.childNodes.length, 1);
  const home = doc.root.childNodes[0];
  assert.equal(home.tagName, 'MAIN');
  assert.equal(home.className, 'jq-home');
  assert.equal(doc.documentElement.getAttribute('data-dir'), 'b');
});

test('missing application outlet fails visibly instead of succeeding silently', () => {
  assert.throws(
    () => mountHome({ getElementById: () => null }),
    /Required application outlet #app is missing/,
  );
});
