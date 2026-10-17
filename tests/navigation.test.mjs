import assert from 'node:assert/strict';
import test from 'node:test';
import { mountApp } from '../web/assets/app.js';
import { getPublicContent } from '../web/data/api.js';
import { createThemePreferences } from '../web/data/preferences.js';
import { collect, createFakeDocument } from './helpers/fake-dom.mjs';
import { createFakeStorage } from './helpers/fake-storage.mjs';

/**
 * @param {import('./helpers/fake-dom.mjs').FakeNode} root
 * @param {(node: import('./helpers/fake-dom.mjs').FakeNode) => boolean} predicate
 */
function find(root, predicate) {
  return collect(root, predicate);
}

/** @param {import('./helpers/fake-dom.mjs').FakeNode} root @param {string} route */
function clickRoute(root, route) {
  const entry = find(root, (node) => node.getAttribute('data-route') === route)[0];
  assert.ok(entry, 'expected a formal navigation entry for route ' + route);
  entry.dispatch('click');
  return entry;
}

function setup() {
  const doc = createFakeDocument();
  const storage = createFakeStorage();
  const app = mountApp(doc, undefined);
  return { doc, storage, app, shell: app.shell };
}

test('mountApp mounts one shared shell whose initial scene is H01', () => {
  const { doc, shell } = setup();
  assert.equal(doc.root.childNodes.length, 1);
  assert.equal(shell.element.tagName, 'MAIN');
  assert.equal(shell.element.className, 'jq-home');

  // 共享壳：一个 h1（首页标题）、一个导航、一套设置入口。
  assert.equal(find(shell.element, (node) => node.tagName === 'H1').length, 1);
  assert.equal(find(shell.element, (node) => node.classList.contains('jq-nav')).length, 1);
  assert.equal(find(shell.element, (node) => node.hasAttribute('data-open-settings')).length, 1);
  // 主题只落在根元素上，场景 DOM 不携带 data-dir。
  assert.equal(doc.documentElement.getAttribute('data-dir'), 'a');
  assert.equal(
    find(shell.element, (node) => node.hasAttribute('data-dir')).length,
    0,
    'theme must not fork scene DOM',
  );
});

test('the four existing scenes are reachable and returnable through formal navigation', () => {
  const { shell } = setup();
  const sceneClass = {
    video: 'jq-scene--video',
    course: 'jq-scene--course',
    ai: 'jq-scene--ai',
    public: 'jq-scene--public',
  };

  // 个人模式内可达的三个场景：从顶栏 / 常驻入口进入，再从场景返回首页。
  for (const scene of ['video', 'course', 'ai']) {
    clickRoute(shell.element, scene);
    assert.equal(
      find(shell.element, (node) => node.classList.contains(sceneClass[scene])).length,
      1,
      scene + ' scene must open',
    );
    assert.equal(
      find(shell.element, (node) => node.tagName === 'H1').length,
      1,
      scene + ' must expose a single h1',
    );
    clickRoute(shell.element, 'home');
    assert.equal(
      find(shell.element, (node) => node.classList.contains('jq-home-body')).length,
      1,
      'returning must restore the home body',
    );
  }

  // 公共场景：从个人顶栏进入「社区版预览」，只有个人设备预览能返回；公共设备无此按钮。
  clickRoute(shell.element, 'public');
  assert.equal(
    find(shell.element, (node) => node.classList.contains('jq-scene--public')).length,
    1,
  );
  clickRoute(shell.element, 'home');
  assert.equal(find(shell.element, (node) => node.classList.contains('jq-home-body')).length, 1);
});

test('personal-device public preview hides private surfaces and can exit the preview', () => {
  const { doc, shell } = setup();
  const publicContent = getPublicContent();
  const personalName = '王秀兰';

  clickRoute(shell.element, 'public');

  // 公共模式：没有设置入口 / 个人头像、「我的」或 AI 常驻入口。
  assert.equal(find(shell.element, (node) => node.hasAttribute('data-open-settings')).length, 0);
  assert.equal(find(shell.element, (node) => node.classList.contains('jq-user')).length, 0);
  assert.equal(find(shell.element, (node) => node.classList.contains('jq-ai-fab'))[0].hidden, true);
  assert.equal(
    find(shell.element, (node) => node.textContent === personalName).length,
    0,
    'public mode must not render the personal name',
  );
  assert.equal(
    find(shell.element, (node) => node.classList.contains('jq-public-note'))[0].textContent,
    publicContent.note,
  );

  // 公共场景仍可切主题（评审对照），但只改根标记，不写入个人存储。
  shell.applyTheme('b');
  assert.equal(doc.documentElement.getAttribute('data-dir'), 'b');

  clickRoute(shell.element, 'home');
  assert.equal(find(shell.element, (node) => node.hasAttribute('data-open-settings')).length, 1);
  assert.equal(find(shell.element, (node) => node.classList.contains('jq-user')).length, 1);
  assert.equal(
    find(shell.element, (node) => node.classList.contains('jq-ai-fab'))[0].hidden,
    false,
  );
});

test('switching theme never rebuilds the active scene nor resets its local state', () => {
  const { doc, shell } = setup();
  clickRoute(shell.element, 'video');

  const body = shell.body.childNodes[0];
  const note = find(body, (node) => node.classList.contains('jq-ai-note'))[0];
  const askButton = find(body, (node) => node.classList.contains('jq-ask-ai'))[0];
  askButton.dispatch('click');
  assert.equal(note.hidden, false, 'the local AI note opens');

  const episode = find(
    body,
    (node) => node.classList.contains('jq-ep') && node.textContent === '09',
  )[0];
  episode.dispatch('click');
  assert.equal(episode.getAttribute('aria-pressed'), 'true');

  shell.applyTheme('b');

  assert.equal(doc.documentElement.getAttribute('data-dir'), 'b');
  assert.equal(shell.body.childNodes[0], body, 'theme switch must keep the same scene element');
  assert.equal(note.hidden, false, 'theme switch must not collapse the local note');
  assert.equal(episode.getAttribute('aria-pressed'), 'true', 'theme switch must keep selection');
  // 主题控件反映新状态，且没有第二份主题状态。
  const themeB = find(shell.element, (node) => node.getAttribute('data-dir-option') === 'b')[0];
  assert.equal(themeB.getAttribute('aria-pressed'), 'true');
});

test('navigating away and back preserves the cached scene state', () => {
  const { shell } = setup();
  clickRoute(shell.element, 'video');
  const videoBody = shell.body.childNodes[0];
  find(videoBody, (node) => node.classList.contains('jq-ask-ai'))[0].dispatch('click');
  const note = find(videoBody, (node) => node.classList.contains('jq-ai-note'))[0];
  assert.equal(note.hidden, false);

  clickRoute(shell.element, 'course');
  assert.equal(
    find(shell.element, (node) => node.classList.contains('jq-scene--course')).length,
    1,
  );

  clickRoute(shell.element, 'video');
  assert.equal(shell.body.childNodes[0], videoBody, 'the same video body must be restored');
  assert.equal(note.hidden, false, 'expanded state must survive a navigation round-trip');
});

test('scene bodies stay a single jq- structure with no per-theme classes', () => {
  const { shell } = setup();
  for (const scene of ['video', 'course', 'ai', 'public']) {
    clickRoute(shell.element, scene);
    const body = shell.body.childNodes[0];
    const classes = collect(body, () => true).flatMap((node) =>
      node.className.split(/\s+/).filter(Boolean),
    );
    assert.ok(classes.length > 3, scene + ' should render real content, not a placeholder');
    assert.ok(
      classes.every((name) => name.startsWith('jq-')),
      scene + ' must not fork by theme class',
    );
  }
});

test('personal theme preference is applied on mount and public mode never writes it', () => {
  const doc = createFakeDocument();
  const storage = createFakeStorage();
  storage.setItem('jianqu.theme-preference', 'b');
  const app = mountApp(doc, createThemePreferences(storage));
  assert.equal(doc.documentElement.getAttribute('data-dir'), 'b', 'saved preference wins on mount');

  // 公共模式只做会话内对照：不改个人偏好，也不写入存储。
  clickRoute(app.shell.element, 'public');
  app.shell.applyTheme('a');
  assert.equal(doc.documentElement.getAttribute('data-dir'), 'a');
  assert.equal(storage.getItem('jianqu.theme-preference'), 'b');
});

test('a public-terminal launch cannot navigate to private routes or read personal preferences', () => {
  const doc = createFakeDocument();
  const secretPreferences = {
    available: true,
    read: () => {
      throw new Error('public bootstrap accessed private preferences');
    },
    save: () => {
      throw new Error('public bootstrap wrote private preferences');
    },
  };
  const { shell, show } = mountApp(doc, secretPreferences, { deviceMode: 'public' });

  assert.equal(shell.getMode(), 'public');
  assert.equal(
    find(shell.element, (node) => node.classList.contains('jq-scene--public')).length,
    1,
  );
  assert.equal(find(shell.element, (node) => node.classList.contains('jq-home-body')).length, 0);
  assert.equal(find(shell.element, (node) => node.classList.contains('jq-public-back')).length, 0);
  assert.equal(find(shell.element, (node) => node.classList.contains('jq-user')).length, 0);
  assert.equal(find(shell.element, (node) => node.hasAttribute('data-open-settings')).length, 0);
  assert.equal(find(shell.element, (node) => node.classList.contains('jq-ai-fab'))[0].hidden, true);

  for (const route of ['home', 'video', 'ai', 'course', 'mine', 'garbage']) {
    assert.equal(show(route), 'public', 'no synthetic route may cross the public boundary');
    shell.activate(route);
    assert.equal(shell.getMode(), 'public');
    assert.equal(find(shell.element, (node) => node.classList.contains('jq-home-body')).length, 0);
    assert.equal(find(shell.element, (node) => node.classList.contains('jq-user')).length, 0);
  }
  shell.applyTheme('b');
  assert.equal(doc.documentElement.getAttribute('data-dir'), 'b');
});

test('each scene starts at top then independently restores its last scroll position', () => {
  const { shell } = setup();
  shell.body.scrollTop = 1300;
  clickRoute(shell.element, 'video');
  assert.equal(shell.body.scrollTop, 0, 'first video visit must not inherit home offset');
  shell.body.scrollTop = 70;
  clickRoute(shell.element, 'course');
  assert.equal(shell.body.scrollTop, 0, 'first course visit starts at the top');
  shell.body.scrollTop = 40;
  clickRoute(shell.element, 'home');
  assert.equal(shell.body.scrollTop, 1300, 'returning restores the exact home scroll');
  clickRoute(shell.element, 'video');
  assert.equal(shell.body.scrollTop, 70, 'video has its own independent scroll position');
  clickRoute(shell.element, 'course');
  assert.equal(shell.body.scrollTop, 40, 'course restores its own independent scroll position');
});
