import assert from 'node:assert/strict';
import test from 'node:test';
import { mountApp } from '../web/assets/app.js';
import { getCreationContent } from '../web/data/api.js';
import { describeRoute } from '../web/data/notices.js';
import { renderCreationBody } from '../web/pages/creation.js';
import { collect, createFakeDocument } from './helpers/fake-dom.mjs';

/** @param {import('./helpers/fake-dom.mjs').FakeNode} root @param {(node: import('./helpers/fake-dom.mjs').FakeNode) => boolean} predicate */
function find(root, predicate) {
  return collect(root, predicate);
}

/** @param {import('./helpers/fake-dom.mjs').FakeNode} root @param {string} className */
function byClass(root, className) {
  return find(root, (node) => node.classList.contains(className))[0];
}

/** @param {import('./helpers/fake-dom.mjs').FakeNode} root @returns {string} */
function feedbackText(root) {
  return byClass(root, 'jq-create__feedback').textContent;
}

/** 当前可见的步骤面板（`data-step` 面板本身，不含面板内的许可区块）。 */
/** @param {import('./helpers/fake-dom.mjs').FakeNode} root @returns {import('./helpers/fake-dom.mjs').FakeNode} */
function visiblePanel(root) {
  return find(
    root,
    (node) => node.tagName === 'SECTION' && node.hasAttribute('data-step') && !node.hidden,
  )[0];
}

/** @param {import('./helpers/fake-dom.mjs').FakeNode} root @param {string} step */
function hidden(root, step) {
  const found = find(
    root,
    (node) => node.getAttribute('data-step') === step && node.tagName === 'SECTION',
  )[0];
  return Boolean(found && found.hidden);
}

function render() {
  const doc = createFakeDocument();
  const body = renderCreationBody(doc, getCreationContent(), () => {});
  return { doc, body };
}

/** 点「下一步」进入素材步骤，返回该正文节点。 */
/** @param {import('./helpers/fake-dom.mjs').FakeNode} body */
function toSourceStep(body) {
  find(body, (node) => node.textContent === '下一步：选素材')[0].dispatch('click');
}

test('C01 fixture is explicitly S1 and carries the themes, sources and consent copy', () => {
  const content = getCreationContent();
  assert.equal(content.demo.level, 'S1');
  assert.match(content.demo.notice, /示例|演示/);
  assert.match(content.demo.notice, /不保存/);
  assert.deepEqual(
    content.themes.map((theme) => theme.id),
    ['portrait', 'restore', 'calligraphy', 'story'],
  );
  const featured = content.themes.filter((theme) => theme.featured);
  assert.equal(featured.length, 1, 'exactly one theme must carry the full demo path');
  assert.equal(featured[0].id, 'portrait', 'AI 写真 is the preferred demo theme');
  assert.deepEqual(
    content.sources.map((source) => source.id),
    ['example', 'local', 'text'],
  );
  assert.ok(content.samples.length >= 1);
  assert.match(content.consent.body, /不会上传/);
  assert.match(content.generate.note, /尚未连接|未.*连接/);
  for (const theme of content.themes) {
    assert.ok(theme.image && theme.imageAlt, theme.id + ' must reference attributed sample media');
  }
});

test('the route notices stay honest for C01 and the not-yet-built C02 result', () => {
  assert.match(describeRoute('create'), /示例|演示/);
  assert.match(describeRoute('create'), /未接入真实模型/);
  assert.match(describeRoute('create-result'), /C02/);
  assert.match(describeRoute('create-result'), /尚未实现|不会伪造/);
});

test('C01 renders one single-theme flow: one h1, one stepper, only the first step visible', () => {
  const { body } = render();
  assert.equal(find(body, (node) => node.tagName === 'H1').length, 1);
  assert.equal(find(body, (node) => node.hasAttribute('data-dir')).length, 0);
  assert.equal(
    byClass(body, 'jq-create__steps').childNodes.length,
    getCreationContent().steps.length,
  );
  assert.equal(
    find(body, (node) => node.hasAttribute('data-step') && node.tagName === 'SECTION').length,
    4,
  );
  assert.equal(visiblePanel(body).getAttribute('data-step'), 'theme');
  assert.equal(find(body, (node) => node.hasAttribute('data-theme')).length, 4);
  // 默认选中示范主题 AI 写真。
  const selected = find(
    body,
    (node) => node.hasAttribute('data-theme') && node.getAttribute('aria-pressed') === 'true',
  );
  assert.equal(selected[0].getAttribute('data-theme'), 'portrait');
  const classes = collect(body, () => true).flatMap((node) =>
    node.className.split(/\s+/).filter(Boolean),
  );
  assert.ok(classes.length > 30);
  assert.ok(classes.every((name) => name.startsWith('jq-')));
});

test('a missing material is refused with a clear message and no authorization happens', () => {
  const { body } = render();
  toSourceStep(body);
  assert.equal(visiblePanel(body).getAttribute('data-step'), 'source');
  assert.match(byClass(body, 'jq-create__picker').childNodes[0].textContent, /先选一种/);

  find(body, (node) => node.getAttribute('data-consent') === 'agree')[0].dispatch('click');
  assert.match(feedbackText(body), /还没有选好素材/);
  assert.equal(visiblePanel(body).getAttribute('data-step'), 'source');
  assert.equal(hidden(body, 'preview'), true);
});

test('refusing authorization drops the selected material instead of keeping it', () => {
  const { body } = render();
  toSourceStep(body);
  find(body, (node) => node.getAttribute('data-source') === 'example')[0].dispatch('click');
  const sample = find(body, (node) => node.hasAttribute('data-sample'))[1];
  sample.dispatch('click');
  assert.equal(sample.getAttribute('aria-pressed'), 'true');

  find(body, (node) => node.getAttribute('data-consent') === 'refuse')[0].dispatch('click');
  assert.match(feedbackText(body), /已拒绝授权/);
  assert.match(feedbackText(body), /没有保留/);
  assert.equal(visiblePanel(body).getAttribute('data-step'), 'source');
  const stillSelected = find(
    body,
    (node) => node.hasAttribute('data-sample') && node.getAttribute('aria-pressed') === 'true',
  );
  assert.equal(stillSelected.length, 0, 'refusal must not keep the private material selected');
});

test('the example-material path previews the asset and ends before any real generation', () => {
  const { body } = render();
  toSourceStep(body);
  find(body, (node) => node.getAttribute('data-source') === 'example')[0].dispatch('click');
  find(body, (node) => node.hasAttribute('data-sample'))[0].dispatch('click');
  find(body, (node) => node.getAttribute('data-consent') === 'agree')[0].dispatch('click');

  const previewPanel = visiblePanel(body);
  assert.equal(previewPanel.getAttribute('data-step'), 'preview');
  const previewBox = byClass(previewPanel, 'jq-create__preview');
  assert.ok(previewBox.childNodes.length >= 3);
  assert.match(
    find(previewBox, (node) => node.classList.contains('jq-create__hint'))[1].textContent,
    /示例素材/,
  );
  assert.match(
    find(previewPanel, (node) => node.classList.contains('jq-create__note'))[0].textContent,
    /S1/,
  );

  const generate = find(body, (node) => node.getAttribute('data-action') === 'generate')[0];
  assert.match(generate.textContent, /模拟生成/);
  generate.dispatch('click');

  const donePanel = visiblePanel(body);
  assert.equal(donePanel.getAttribute('data-step'), 'done');
  assert.match(feedbackText(body), /没有真实生成结果/);
  assert.match(
    find(donePanel, (node) => node.classList.contains('jq-create__note'))[0].textContent,
    /不会伪造生成完成/,
  );
  // 下一步衔接入口指向未实现的 C02，而不是伪造的作品页。
  assert.ok(
    find(donePanel, (node) => node.getAttribute('data-route') === 'create-result')[0],
    'the C02 hand-off entry must exist and stay labelled as not implemented',
  );
});

test('revoking from the preview clears the material and returns to the source step', () => {
  const { body } = render();
  toSourceStep(body);
  find(body, (node) => node.getAttribute('data-source') === 'example')[0].dispatch('click');
  find(body, (node) => node.hasAttribute('data-sample'))[0].dispatch('click');
  find(body, (node) => node.getAttribute('data-consent') === 'agree')[0].dispatch('click');
  find(body, (node) => node.getAttribute('data-action') === 'revoke')[0].dispatch('click');

  assert.match(feedbackText(body), /已撤销/);
  assert.match(feedbackText(body), /清除/);
  assert.equal(visiblePanel(body).getAttribute('data-step'), 'source');
  assert.equal(
    find(
      body,
      (node) => node.hasAttribute('data-sample') && node.getAttribute('aria-pressed') === 'true',
    ).length,
    0,
  );
});

test('the text-description path shows a clear specimen card instead of fake artwork', () => {
  const { body } = render();
  toSourceStep(body);
  find(body, (node) => node.getAttribute('data-source') === 'text')[0].dispatch('click');
  const area = byClass(body, 'jq-create__text-field');
  area.value = '想把家里那张老照片修清楚一点';
  area.dispatch('input');
  find(body, (node) => node.getAttribute('data-consent') === 'agree')[0].dispatch('click');

  const previewPanel = visiblePanel(body);
  assert.equal(previewPanel.getAttribute('data-step'), 'preview');
  assert.equal(
    byClass(previewPanel, 'jq-create__text-quoted').textContent,
    '“想把家里那张老照片修清楚一点”',
  );
});

test('a local picture is previewed in-browser and released on revoke, never uploaded', () => {
  const revoked = [];
  const originalRevoke = URL.revokeObjectURL;
  URL.revokeObjectURL = (url) => {
    revoked.push(url);
    originalRevoke(url);
  };
  try {
    const { body } = render();
    toSourceStep(body);
    find(body, (node) => node.getAttribute('data-source') === 'local')[0].dispatch('click');
    const localPicker = byClass(body, 'jq-create__local');
    assert.match(
      find(localPicker, (node) => node.classList.contains('jq-create__hint'))[0].textContent,
      /不会上传/,
    );

    const input = byClass(body, 'jq-create__file');
    const file = new Blob(['sample']);
    Object.defineProperty(file, 'name', { value: 'laozhaopian.jpg' });
    input.files = [file];
    input.dispatch('change');
    assert.match(feedbackText(body), /本机预览/);
    assert.equal(byClass(body, 'jq-create__file-name').textContent, '已选：laozhaopian.jpg');
    assert.match(byClass(body, 'jq-create__thumb').getAttribute('src'), /^blob:/);

    find(body, (node) => node.getAttribute('data-consent') === 'agree')[0].dispatch('click');
    const previewImage = byClass(visiblePanel(body), 'jq-create__preview-img');
    assert.match(previewImage.getAttribute('src'), /^blob:/);

    find(body, (node) => node.getAttribute('data-action') === 'revoke')[0].dispatch('click');
    assert.equal(revoked.length, 1, 'the object URL must be released on revoke');
    assert.equal(find(body, (node) => node.classList.contains('jq-create__thumb')).length, 0);
    assert.match(feedbackText(body), /清除|没有保留/);
  } finally {
    URL.revokeObjectURL = originalRevoke;
  }
});

test('the AI 趣玩 entry is reachable from H01 and keeps its flow state across theme switches', () => {
  const doc = createFakeDocument();
  const { shell } = mountApp(doc, undefined);

  const entry = find(shell.element, (node) => node.getAttribute('data-route') === 'create')[0];
  assert.ok(entry, 'H01 must expose the AI 趣玩 entry');
  entry.dispatch('click');
  const body = shell.body.childNodes[0];
  assert.equal(body.classList.contains('jq-scene--create'), true);
  assert.equal(find(shell.element, (node) => node.tagName === 'H1').length, 1);

  // 选主题 → 选示例素材 → 确认授权 → 预览。
  find(body, (node) => node.hasAttribute('data-theme'))[1].dispatch('click');
  toSourceStep(body);
  find(body, (node) => node.getAttribute('data-source') === 'example')[0].dispatch('click');
  find(body, (node) => node.hasAttribute('data-sample'))[0].dispatch('click');
  find(body, (node) => node.getAttribute('data-consent') === 'agree')[0].dispatch('click');
  assert.equal(visiblePanel(body).getAttribute('data-step'), 'preview');

  // 切主题只改 Token，不重建场景，也不丢失已完成的素材 / 主题操作。
  shell.applyTheme('b');
  assert.equal(doc.documentElement.getAttribute('data-dir'), 'b');
  assert.equal(shell.body.childNodes[0], body, 'theme switch must not rebuild the C01 scene');
  assert.equal(visiblePanel(body).getAttribute('data-step'), 'preview');
  assert.equal(
    find(
      body,
      (node) => node.hasAttribute('data-theme') && node.getAttribute('aria-pressed') === 'true',
    )[0].getAttribute('data-theme'),
    'restore',
  );

  // 返回首页后再进入：不保留任何私人素材，回到第 1 步重新开始。
  find(body, (node) => node.classList.contains('jq-scene__back'))[0].dispatch('click');
  assert.equal(find(shell.element, (node) => node.classList.contains('jq-home-body')).length, 1);
  find(shell.element, (node) => node.getAttribute('data-route') === 'create')[0].dispatch('click');
  assert.equal(visiblePanel(body).getAttribute('data-step'), 'theme');
  assert.equal(
    find(
      body,
      (node) => node.hasAttribute('data-sample') && node.getAttribute('aria-pressed') === 'true',
    ).length,
    0,
  );
});
