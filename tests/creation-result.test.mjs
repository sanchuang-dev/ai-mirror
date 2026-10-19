import assert from 'node:assert/strict';
import test from 'node:test';
import { mountApp } from '../web/assets/app.js';
import { getCreationResultContent } from '../web/data/api.js';
import {
  clearCreationDraft,
  readCreationDraft,
  setCreationDraft,
} from '../web/data/creation-draft.js';
import { renderCreationResultBody } from '../web/pages/creation-result.js';
import { collect, createFakeDocument } from './helpers/fake-dom.mjs';

/** @param {import('./helpers/fake-dom.mjs').FakeNode} root @param {(node: import('./helpers/fake-dom.mjs').FakeNode) => boolean} predicate */
function find(root, predicate) {
  return collect(root, predicate);
}

/** @param {import('./helpers/fake-dom.mjs').FakeNode} root @param {string} className */
function byClass(root, className) {
  return find(root, (node) => node.classList.contains(className))[0];
}

/** @param {import('./helpers/fake-dom.mjs').FakeNode} root @param {string} contactId */
function contactButton(root, contactId) {
  return find(root, (node) => node.getAttribute('data-contact') === contactId)[0];
}

/** @param {import('./helpers/fake-dom.mjs').FakeNode} root @param {string} action */
function actionButton(root, action) {
  return find(root, (node) => node.getAttribute('data-action') === action)[0];
}

/** @param {import('./helpers/fake-dom.mjs').FakeNode} root @returns {string} */
function feedbackText(root) {
  return byClass(root, 'jq-result__feedback').textContent;
}

/** @param {import('./helpers/fake-dom.mjs').FakeNode} root @param {string} scope */
function scopeText(root, scope) {
  return find(root, (node) => node.getAttribute('data-scope') === scope)[0].textContent;
}

/** @param {import('../web/pages/creation-result.js').CreationResultOptions} [options] */
function render(options = {}) {
  const doc = createFakeDocument();
  const body = renderCreationResultBody(doc, getCreationResultContent(), () => {}, options);
  return { doc, body };
}

test('the C02 fixture marks the sample artwork as a non-real generation with demo contacts', () => {
  const content = getCreationResultContent();
  assert.equal(content.demo.level, 'S1');
  assert.match(content.demo.badge, /预生成/);
  assert.match(content.demo.badge, /非真实/);
  assert.match(content.demo.notice, /演示|示例/);
  assert.match(content.share.note, /虚构|演示/);
  assert.ok(content.contacts.length >= 2);
  for (const contact of content.contacts) {
    assert.match(contact.demo, /演示/);
  }
  for (const key of ['portrait', 'restore', 'calligraphy', 'story']) {
    const artwork = content.artworks[key];
    assert.ok(artwork && artwork.image && artwork.imageAlt, key + ' needs attributed sample media');
  }
});

test('the result page shows a visible sample artwork labelled as a demo generation', () => {
  setCreationDraft({
    themeId: 'portrait',
    themeTitle: 'AI 写真',
    sourceKind: 'example',
    sampleTitle: '客厅合影',
  });
  try {
    const { body } = render();
    assert.equal(find(body, (node) => node.tagName === 'H1').length, 1);
    assert.match(byClass(body, 'jq-result__badge').textContent, /非真实 AI 生成/);
    // 作品示意图必须真的存在，而不是空白占位。
    const image = byClass(body, 'jq-media__img');
    assert.ok(image, 'the result must render a visible artwork image');
    assert.match(image.getAttribute('src'), /assets\/img\/art-/);
    assert.match(byClass(body, 'jq-result__name').textContent, /示例/);
    assert.match(byClass(body, 'jq-result__origin').textContent, /AI 写真/);
    assert.match(byClass(body, 'jq-result__origin').textContent, /客厅合影/);
    assert.match(byClass(body, 'jq-result__note').textContent, /不是真实 AI 生成结果/);
  } finally {
    clearCreationDraft();
  }
});

test('an unknown theme falls back to the shared sample artwork structure', () => {
  setCreationDraft({
    themeId: 'nope',
    themeTitle: '未知主题',
    sourceKind: 'text',
    sampleTitle: '',
  });
  try {
    const { body } = render();
    assert.ok(byClass(body, 'jq-media__img'), 'a shared sample artwork is still shown');
    assert.match(byClass(body, 'jq-result__origin').textContent, /文字描述/);
  } finally {
    clearCreationDraft();
  }
});

test('the artwork defaults to private and saving is a page-only demo without storage', () => {
  const originalLocalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() {
      throw new Error('C02 must not persist to localStorage');
    },
  });
  try {
    const { body } = render();
    assert.equal(scopeText(body, 'visibility'), getCreationResultContent().privacy.defaultLabel);
    assert.equal(byClass(body, 'jq-result__feedback').hidden, true);

    const save = actionButton(body, 'save');
    assert.match(save.textContent, /保存/);
    save.dispatch('click');
    assert.equal(save.textContent, getCreationResultContent().privacy.savedLabel);
    assert.equal(save.hidden, true);
    assert.match(feedbackText(body), /没有上传/);
  } finally {
    if (originalLocalStorage)
      Object.defineProperty(globalThis, 'localStorage', originalLocalStorage);
    else delete (/** @type {Record<string, unknown>} */ (globalThis).localStorage);
  }
});

test('cancelling the share confirmation keeps the artwork private and sends nothing', () => {
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (...args) => {
    calls.push(args);
    return Promise.reject(new Error('C02 must not perform network requests'));
  };
  try {
    const { body } = render();
    const contact = contactButton(body, 'daughter');
    contact.dispatch('click');
    const confirm = byClass(body, 'jq-result__confirm');
    assert.equal(confirm.hidden, false, 'picking a contact shows the second confirmation');
    assert.equal(contact.getAttribute('aria-pressed'), 'true');
    assert.match(
      find(body, (node) => node.classList.contains('jq-result__confirm'))[0].childNodes[1]
        .textContent,
      /小敏/,
    );

    actionButton(body, 'cancel-share').dispatch('click');
    assert.equal(byClass(body, 'jq-result__confirm').hidden, true);
    assert.equal(byClass(body, 'jq-result__shared').hidden, true);
    assert.equal(contact.getAttribute('aria-pressed'), 'false');
    assert.equal(scopeText(body, 'visibility'), getCreationResultContent().privacy.defaultLabel);
    assert.match(feedbackText(body), /已取消分享/);
    assert.match(feedbackText(body), /没有发送任何消息/);
    assert.equal(calls.length, 0, 'cancelling must not trigger any network request');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('confirming a share only updates the on-page demo scope and fakes no receipt', () => {
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (...args) => {
    calls.push(args);
    return Promise.reject(new Error('C02 must not perform network requests'));
  };
  try {
    const { body } = render();
    contactButton(body, 'friend').dispatch('click');
    actionButton(body, 'confirm-share').dispatch('click');

    const shared = byClass(body, 'jq-result__shared');
    assert.equal(shared.hidden, false);
    assert.match(
      find(shared, (node) => node.classList.contains('jq-result__h3'))[0].textContent,
      /模拟已分享给 老李/,
    );
    assert.match(
      find(shared, (node) => node.classList.contains('jq-result__note'))[0].textContent,
      /没有真实发送/,
    );
    assert.equal(scopeText(body, 'visibility'), '可见范围：仅「老李」可见（演示）');
    assert.match(feedbackText(body), /已确认/);
    assert.equal(calls.length, 0, 'confirming a demo share must not perform any network request');

    // 取消分享后恢复仅自己可见。
    actionButton(body, 'unshare').dispatch('click');
    assert.equal(byClass(body, 'jq-result__shared').hidden, true);
    assert.equal(scopeText(body, 'visibility'), getCreationResultContent().privacy.defaultLabel);
    assert.match(feedbackText(body), /已取消分享/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('restart, return-to-creation and discard use the shell-provided paths', () => {
  const events = [];
  const { body } = render({
    onRestart: () => events.push('restart'),
    onReturnToCreation: () => events.push('back'),
    onDiscard: () => events.push('discard'),
  });
  actionButton(body, 'restart').dispatch('click');
  actionButton(body, 'back-to-create').dispatch('click');
  actionButton(body, 'discard').dispatch('click');
  assert.deepEqual(events, ['restart', 'back', 'discard']);
});

test('C01 生成 → C02 结果，并且「再做一次」把创作流程重置回第 1 步', () => {
  clearCreationDraft();
  const doc = createFakeDocument();
  const { shell } = mountApp(doc, undefined);

  find(shell.element, (node) => node.getAttribute('data-route') === 'create')[0].dispatch('click');
  const createBody = shell.body.childNodes[0];
  find(createBody, (node) => node.textContent === '下一步：选素材')[0].dispatch('click');
  find(createBody, (node) => node.getAttribute('data-source') === 'example')[0].dispatch('click');
  find(createBody, (node) => node.hasAttribute('data-sample'))[0].dispatch('click');
  find(createBody, (node) => node.getAttribute('data-consent') === 'agree')[0].dispatch('click');
  find(createBody, (node) => node.getAttribute('data-action') === 'generate')[0].dispatch('click');

  const resultBody = shell.body.childNodes[0];
  assert.equal(resultBody.classList.contains('jq-scene--create-result'), true);
  assert.match(byClass(resultBody, 'jq-result__badge').textContent, /非真实 AI 生成/);
  assert.equal(
    find(resultBody, (node) => node.getAttribute('data-scope') === 'visibility')[0].textContent,
    getCreationResultContent().privacy.defaultLabel,
  );

  // 再做一次：复用同一份 C01 DOM，重置回第 1 步，并清空交接数据。
  actionButton(resultBody, 'restart').dispatch('click');
  assert.equal(shell.body.childNodes[0], createBody, 'the C01 scene is reused, not rebuilt');
  const visible = find(
    createBody,
    (node) => node.tagName === 'SECTION' && node.hasAttribute('data-step') && !node.hidden,
  )[0];
  assert.equal(visible.getAttribute('data-step'), 'theme');
  assert.equal(readCreationDraft(), null, 'restart discards the C01 → C02 draft');
});
