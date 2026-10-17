import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { mountApp } from '../web/assets/app.js';
import { getProgramContent, searchPrograms } from '../web/data/api.js';
import { renderProgramsBody } from '../web/pages/programs.js';
import { collect, createFakeDocument } from './helpers/fake-dom.mjs';

/** Flush the page's async data-adapter chain (microtasks) before asserting. */
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

/** @param {import('./helpers/fake-dom.mjs').FakeNode} root */
const find = (root, predicate) => collect(root, predicate);

/** @param {import('../web/components/app-shell.js').SceneShell} shell */
function clickRoute(shell, route) {
  const entry = find(shell.element, (node) => node.getAttribute('data-route') === route)[0];
  assert.ok(entry, 'expected a formal entry for route ' + route);
  entry.dispatch('click');
  return entry;
}

/** @param {import('../web/components/app-shell.js').SceneShell} shell */
function pressedCategory(shell) {
  const pressed = find(
    shell.element,
    (node) => node.hasAttribute('data-category') && node.getAttribute('aria-pressed') === 'true',
  )[0];
  return pressed ? pressed.getAttribute('data-category') : null;
}

test('program fixture is explicit S1 sample data with attributed posters', () => {
  const content = getProgramContent();
  assert.equal(content.demo.level, 'S1');
  assert.match(content.demo.notice, /示例/);
  assert.match(content.searchHint, /示例/);

  const categoryIds = new Set(content.categories.map((entry) => entry.id));
  assert.ok(categoryIds.size >= 4, 'expected 推荐 / 短剧 / 戏曲 / 老歌');
  assert.ok(categoryIds.has('recommend'));

  const seen = new Set();
  let mapped = 0;
  for (const program of content.programs) {
    assert.ok(categoryIds.has(program.category), program.title + ' must use a known category');
    assert.ok(program.title && program.meta && program.summary && program.keywords);
    assert.match(program.image, /^art-.+\.jpg$/);
    assert.match(program.imageAlt, /氛围画面/);
    assert.equal(seen.has(program.id), false, 'program ids must be unique');
    seen.add(program.id);
    if (program.demoRoute) {
      mapped += 1;
      assert.equal(program.demoRoute, 'video');
      assert.equal(program.id, 'zhaoxi-xiang');
    }
  }
  assert.equal(mapped, 1, 'only 《朝夕巷》 may map to the existing V02 demo');
});

test('searchPrograms returns real hits, category filters and an explicit empty result', async () => {
  const hit = await searchPrograms({ keyword: '梁祝', category: 'all' });
  assert.equal(hit.status, 'ok');
  assert.deepEqual(
    hit.items.map((program) => program.id),
    ['liangzhu'],
  );

  const byCategory = await searchPrograms({ category: 'opera' });
  assert.ok(byCategory.items.length >= 3);
  assert.ok(byCategory.items.every((program) => program.category === 'opera'));

  // 分类标签也可作为关键词命中，避免搜索像装饰输入框。
  const byLabel = await searchPrograms({ keyword: '老歌', category: 'all' });
  assert.ok(byLabel.items.some((program) => program.id === 'jingdian-laoge'));

  const trimmed = await searchPrograms({ keyword: '  茶馆  ', category: 'all' });
  assert.equal(trimmed.keyword, '茶馆');
  assert.deepEqual(
    trimmed.items.map((program) => program.id),
    ['chaguan-chunqiu'],
  );

  const recommend = await searchPrograms({ category: 'recommend' });
  assert.ok(recommend.items.length >= 1);
  assert.ok(recommend.items.every((program) => program.recommended));

  const empty = await searchPrograms({ keyword: '查无此节目zzz', category: 'all' });
  assert.equal(empty.status, 'empty');
  assert.equal(empty.items.length, 0);
});

test('programs scene renders one h1, a real search form and a default category', async () => {
  const doc = createFakeDocument();
  const body = renderProgramsBody(doc, getProgramContent(), () => {});
  await flush();

  assert.equal(find(body, (node) => node.tagName === 'H1').length, 1);
  assert.equal(find(body, (node) => node.classList.contains('jq-search__field')).length, 1);
  assert.equal(find(body, (node) => node.textContent === '搜索').length, 1);
  assert.equal(find(body, (node) => node.textContent === '清空').length, 1);

  const tabs = find(body, (node) => node.hasAttribute('data-category'));
  assert.ok(tabs.length >= 4);
  const pressed = tabs.filter((node) => node.getAttribute('aria-pressed') === 'true');
  assert.equal(pressed.length, 1);
  assert.equal(pressed[0].getAttribute('data-category'), 'recommend');

  // 默认分类的有效结果：来自异步数据出口，而不是静态占位。
  assert.equal(find(body, (node) => node.getAttribute('data-state') === 'ok').length, 1);
  assert.ok(find(body, (node) => node.hasAttribute('data-program')).length >= 1);

  // 主题不得分叉 DOM，类名仍是单一 jq- 体系。
  assert.equal(find(body, (node) => node.hasAttribute('data-dir')).length, 0);
  const classes = find(body, () => true).flatMap((node) =>
    node.className.split(/\s+/).filter(Boolean),
  );
  assert.ok(classes.length > 10);
  assert.ok(classes.every((name) => name.startsWith('jq-')));
});

test('submitting a keyword shows hits, a miss shows the empty state, clear resets', async () => {
  const doc = createFakeDocument();
  const body = renderProgramsBody(doc, getProgramContent(), () => {});
  await flush();

  const field = find(body, (node) => node.classList.contains('jq-search__field'))[0];
  const form = find(body, (node) => node.classList.contains('jq-programs-search'))[0];

  field.value = '梁祝';
  form.dispatch('submit', { preventDefault() {} });
  // 提交后先进入加载态，再落到命中结果。
  assert.equal(find(body, (node) => node.getAttribute('data-state') === 'loading').length, 1);
  await flush();
  assert.equal(find(body, (node) => node.getAttribute('data-state') === 'ok').length, 1);
  assert.deepEqual(
    find(body, (node) => node.hasAttribute('data-program')).map((node) =>
      node.getAttribute('data-program'),
    ),
    ['liangzhu'],
  );

  field.value = '查无此节目zzz';
  form.dispatch('submit', { preventDefault() {} });
  await flush();
  assert.equal(find(body, (node) => node.getAttribute('data-state') === 'empty').length, 1);
  assert.match(
    find(body, (node) => node.classList.contains('jq-programs__state-title'))[0].textContent,
    /没有找到/,
  );

  const clear = find(body, (node) => node.textContent === '清空')[0];
  clear.dispatch('click');
  await flush();
  assert.equal(field.value, '');
  assert.equal(find(body, (node) => node.getAttribute('data-state') === 'ok').length, 1);
});

test('the loading state is real and shown while the data adapter is pending', async () => {
  const doc = createFakeDocument();
  /** @type {(value: import('../web/data/api.js').ProgramSearchResult) => void} */
  let resolveSearch = () => {};
  const pending = new Promise((resolve) => {
    resolveSearch = resolve;
  });
  const body = renderProgramsBody(doc, getProgramContent(), () => {}, {
    search: () => pending,
  });

  assert.equal(find(body, (node) => node.getAttribute('data-state') === 'loading').length, 1);
  assert.match(
    find(body, (node) => node.classList.contains('jq-programs__state-title'))[0].textContent,
    /正在/,
  );

  resolveSearch({
    status: 'ok',
    keyword: '',
    category: 'recommend',
    items: getProgramContent().programs,
  });
  await flush();
  assert.equal(find(body, (node) => node.getAttribute('data-state') === 'ok').length, 1);
  assert.ok(find(body, (node) => node.hasAttribute('data-program')).length >= 1);
});

test('a failing search shows an explicit failure state that can retry', async () => {
  const doc = createFakeDocument();
  let attempts = 0;
  const body = renderProgramsBody(doc, getProgramContent(), () => {}, {
    search: (query) => {
      attempts += 1;
      if (attempts === 1) return Promise.reject(new Error('example adapter unavailable'));
      return searchPrograms(query);
    },
  });
  await flush();

  assert.equal(find(body, (node) => node.getAttribute('data-state') === 'error').length, 1);
  assert.match(
    find(body, (node) => node.classList.contains('jq-programs__state-title'))[0].textContent,
    /读不到/,
  );

  const retry = find(body, (node) => node.textContent === '重试')[0];
  retry.dispatch('click');
  await flush();
  assert.equal(attempts, 2);
  assert.equal(find(body, (node) => node.getAttribute('data-state') === 'ok').length, 1);
});

test('clicking a program opens an explicit detail entry with a return path', async () => {
  const doc = createFakeDocument();
  const activated = [];
  const body = renderProgramsBody(doc, getProgramContent(), (route) => activated.push(route));
  await flush();

  const detail = find(body, (node) => node.classList.contains('jq-program-detail'))[0];
  assert.equal(detail.hidden, true, 'detail entry starts closed');

  // 与 V02 有明确映射的《朝夕巷》：给出边界说明并链接到已有示例播放页。
  find(body, (node) => node.getAttribute('data-program') === 'zhaoxi-xiang')[0].dispatch('click');
  assert.equal(detail.hidden, false);
  assert.match(
    find(detail, (node) => node.classList.contains('jq-program-detail__note'))[0].textContent,
    /Issue #10/,
  );
  const v02 = find(detail, (node) => node.getAttribute('data-route') === 'video')[0];
  assert.ok(v02, 'the mapped sample must link to the existing V02 demo');
  v02.dispatch('click');
  assert.deepEqual(activated, ['video']);

  find(detail, (node) => node.classList.contains('jq-program-detail__close'))[0].dispatch('click');
  assert.equal(detail.hidden, true, 'return path closes the detail entry');

  // 其它节目：不伪造 V02 关联，只给明确的「详情待接入」边界。
  find(body, (node) => node.getAttribute('data-category') === 'opera')[0].dispatch('click');
  await flush();
  find(body, (node) => node.getAttribute('data-program') === 'liangzhu')[0].dispatch('click');
  assert.equal(detail.hidden, false);
  assert.equal(
    find(detail, (node) => node.getAttribute('data-route') === 'video').length,
    0,
    'unmapped programs must not impersonate the 《朝夕巷》 episode',
  );
  assert.equal(
    find(detail, (node) => node.classList.contains('jq-program-detail__title'))[0].textContent,
    '越剧《梁祝》',
  );
});

test('H01 category entries open the program directory and stay theme-safe', async () => {
  const doc = createFakeDocument();
  const app = mountApp(doc, undefined);
  const shell = app.shell;

  clickRoute(shell, 'programs-drama');
  await flush();
  assert.equal(
    find(shell.element, (node) => node.classList.contains('jq-scene--programs')).length,
    1,
  );
  assert.equal(find(shell.element, (node) => node.classList.contains('jq-scene--video')).length, 0);
  assert.equal(pressedCategory(shell), 'drama', 'the 短剧 entry must open the 短剧 category');

  const body = shell.body.childNodes[0];
  shell.applyTheme('b');
  assert.equal(doc.documentElement.getAttribute('data-dir'), 'b');
  assert.equal(shell.body.childNodes[0], body, 'theme switch must not rebuild the list');

  clickRoute(shell, 'home');
  assert.equal(find(shell.element, (node) => node.classList.contains('jq-home-body')).length, 1);
  clickRoute(shell, 'programs-drama');
  assert.equal(shell.body.childNodes[0], body, 'returning reuses the cached list state');

  clickRoute(shell, 'search');
  await flush();
  assert.equal(
    find(shell.element, (node) => node.classList.contains('jq-programs--search')).length,
    1,
  );
  assert.equal(find(shell.element, (node) => node.getAttribute('data-state') === 'ok').length, 1);
});

test('a public terminal cannot navigate into the personal program directory', () => {
  const doc = createFakeDocument();
  const { shell, show } = mountApp(doc, undefined, { deviceMode: 'public' });
  for (const route of ['programs', 'programs-drama', 'programs-music', 'search', 'home']) {
    assert.equal(show(route), 'public', route + ' must stay inside the public terminal');
  }
  assert.equal(
    find(shell.element, (node) => node.classList.contains('jq-scene--programs')).length,
    0,
  );
  assert.equal(find(shell.element, (node) => node.classList.contains('jq-home-body')).length, 0);
});

test('program styles stay theme-variable driven with visible state styles', () => {
  const css = readFileSync(new URL('../web/assets/components.css', import.meta.url), 'utf8');
  assert.match(css, /\.jq-programs__grid \{/);
  assert.match(css, /\.jq-programs__state--loading \{/);
  assert.match(css, /\.jq-programs__state--empty \{/);
  assert.match(css, /\.jq-programs__state--error \{/);
  // 主题差异只允许来自 tokens 变量，不新增按主题分叉的页面类。
  assert.equal(/\.(a|b)-[a-z]/.test(css), false, 'no per-theme page classes may enter the styles');
});
