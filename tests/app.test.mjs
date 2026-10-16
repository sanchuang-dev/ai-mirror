import assert from 'node:assert/strict';
import test from 'node:test';
import { mountShell } from '../web/assets/app.js';

function fakeElement(tagName) {
  return {
    tagName,
    textContent: '',
    className: '',
    children: [],
    append(...children) {
      this.children.push(...children);
    },
    replaceChildren(...children) {
      this.children = children;
    },
  };
}

test('entry renders an honestly unfinished shell into the expected root', () => {
  const outlet = fakeElement('div');
  const documentRef = {
    getElementById: (id) => (id === 'app' ? outlet : null),
    createElement: fakeElement,
  };
  mountShell(documentRef);
  assert.equal(outlet.children.length, 1);
  const main = outlet.children[0];
  assert.equal(main.tagName, 'main');
  assert.equal(main.className, 'jq-shell');
  assert.equal(main.children[0].tagName, 'h1');
  assert.equal(main.children[0].textContent, '见趣');
  assert.match(main.children[1].textContent, /业务页面尚未接入/);
});

test('missing application outlet fails visibly instead of succeeding silently', () => {
  assert.throws(
    () => mountShell({ getElementById: () => null }),
    /Required application outlet #app is missing/,
  );
});
