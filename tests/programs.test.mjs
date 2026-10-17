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

/** @param {import('./helpers/fake-dom.mjs').FakeNode} body */
const resultsNode = (body) =>
  find(body, (node) => node.classList.contains('jq-programs__results'))[0];

/** @param {import('./helpers/fake-dom.mjs').FakeNode} body */
const stateOf = (body) => resultsNode(body).getAttribute('data-state');

/** @param {import('./helpers/fake-dom.mjs').FakeNode} body */
const programIds = (body) =>
  find(body, (node) => node.hasAttribute('data-program')).map((node) =>
    node.getAttribute('data-program'),
  );

/** @param {import('./helpers/fake-dom.mjs').FakeNode} body */
const pressedCategory = (body) => {
  const pressed = find(
    body,
    (node) => node.hasAttribute('data-category') && node.getAttribute('aria-pressed') === 'true',
  )[0];
  return pressed ? pressed.getAttribute('data-category') : null;
};

/** @param {import('./helpers/fake-dom.mjs').FakeNode} body */
const searchField = (body) => find(body, (node) => node.classList.contains('jq-search__field'))[0];

/** @param {import('./helpers/fake-dom.mjs').FakeNode} body */
const searchForm = (body) => find(body, (node) => node.classList.contains('jq-programs-search'))[0];

/** @param {import('./helpers/fake-dom.mjs').FakeNode} body */
const detailNode = (body) => find(body, (node) => node.classList.contains('jq-program-detail'))[0];

/** @param {import('./helpers/fake-dom.mjs').FakeNode} body */
const detailTitle = (body) =>
  find(body, (node) => node.classList.contains('jq-program-detail__title'))[0]?.textContent ?? null;

/** @param {import('./helpers/fake-dom.mjs').FakeNode} body */
const stateTitle = (body) =>
  find(body, (node) => node.classList.contains('jq-programs__state-title'))[0]?.textContent ?? '';

/**
 * @param {import('./helpers/fake-dom.mjs').FakeNode} body
 * @param {string} id
 */
function clickCategory(body, id) {
  const tab = find(body, (node) => node.getAttribute('data-category') === id)[0];
  assert.ok(tab, 'expected a category tab for ' + id);
  tab.dispatch('click');
}

/**
 * @param {import('./helpers/fake-dom.mjs').FakeNode} body
 * @param {string} keyword
 */
function submitKeyword(body, keyword) {
  searchField(body).value = keyword;
  searchForm(body).dispatch('submit', { preventDefault() {} });
}

/** @param {import('./helpers/fake-dom.mjs').FakeNode} body @param {string} id */
function clickProgram(body, id) {
  const card = find(body, (node) => node.getAttribute('data-program') === id)[0];
  assert.ok(card, 'expected a program card for ' + id);
  card.dispatch('click');
  return card;
}

/** @param {import('../web/components/app-shell.js').SceneShell} shell */
function clickRoute(shell, route) {
  const entry = find(shell.element, (node) => node.getAttribute('data-route') === route)[0];
  assert.ok(entry, 'expected a formal navigation entry for route ' + route);
  entry.dispatch('click');
  return entry;
}

const content = getProgramContent();
const categoryOf = (id) => content.programs.find((program) => program.id === id)?.category;

test('program fixture is explicit S1 sample data with attributed posters', () => {
  assert.equal(content.demo.level, 'S1');
  assert.match(content.demo.notice, /示例/);
  assert.match(content.searchHint, /示例/);

  const categoryIds = content.categories.map((entry) => entry.id);
  assert.deepEqual(categoryIds, ['all', 'recommend', 'drama', 'opera', 'oldies']);

  const seen = new Set();
  let mapped = 0;
  for (const program of content.programs) {
    assert.ok(['drama', 'opera', 'oldies'].includes(program.category));
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

test('searchPrograms applies category and keyword as one combined filter', async () => {
  const all = await searchPrograms({ category: 'all' });
  assert.equal(all.status, 'ok');
  assert.equal(all.items.length, content.programs.length);

  const opera = await searchPrograms({ category: 'opera' });
  assert.ok(opera.items.length >= 3);
  assert.ok(opera.items.every((program) => program.category === 'opera'));

  // 分类内命中：戏曲 + 梁祝
  const operaHit = await searchPrograms({ category: 'opera', keyword: '梁祝' });
  assert.deepEqual(
    operaHit.items.map((program) => program.id),
    ['liangzhu'],
  );

  // 分类内无命中：老歌 + 梁祝（Review PR #38 Finding 1 的关键场景）
  const operaMiss = await searchPrograms({ category: 'oldies', keyword: '梁祝' });
  assert.equal(operaMiss.status, 'empty');
  assert.equal(operaMiss.items.length, 0);

  // 关键词可按分类标签命中：戏曲 → 全部戏曲节目
  const labelHit = await searchPrograms({ category: 'all', keyword: '戏曲' });
  assert.equal(labelHit.items.length, 3);
  assert.ok(labelHit.items.every((program) => program.category === 'opera'));

  const trimmed = await searchPrograms({ category: 'all', keyword: '  茶馆  ' });
  assert.equal(trimmed.keyword, '茶馆');
  assert.deepEqual(
    trimmed.items.map((program) => program.id),
    ['chaguan-chunqiu'],
  );

  const recommend = await searchPrograms({ category: 'recommend' });
  assert.ok(recommend.items.length >= 1);
  assert.ok(recommend.items.every((program) => program.recommended));

  const empty = await searchPrograms({ category: 'all', keyword: '查无此节目zzz' });
  assert.equal(empty.status, 'empty');
  assert.equal(empty.items.length, 0);
});

test('programs scene renders one h1, a real search form and a default category', async () => {
  const doc = createFakeDocument();
  const body = renderProgramsBody(doc, content, () => {});
  await flush();

  assert.equal(find(body, (node) => node.tagName === 'H1').length, 1);
  assert.equal(find(body, (node) => node.classList.contains('jq-search__field')).length, 1);
  assert.equal(find(body, (node) => node.textContent === '搜索').length, 1);
  assert.equal(find(body, (node) => node.textContent === '清空').length, 1);

  const tabs = find(body, (node) => node.hasAttribute('data-category'));
  assert.equal(tabs.length, content.categories.length);
  assert.equal(pressedCategory(body), 'all', 'the directory defaults to 全部');

  // 默认分类的有效结果：来自异步数据出口，而不是静态占位。
  assert.equal(stateOf(body), 'ok');
  assert.equal(programIds(body).length, content.programs.length);

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
  const body = renderProgramsBody(doc, content, () => {});
  await flush();

  submitKeyword(body, '梁祝');
  // 提交后先进入加载态，再落到命中结果。
  assert.equal(stateOf(body), 'loading');
  assert.match(stateTitle(body), /正在/);
  await flush();
  assert.equal(stateOf(body), 'ok');
  assert.deepEqual(programIds(body), ['liangzhu']);
  assert.match(
    find(body, (node) => node.classList.contains('jq-programs__count'))[0].textContent,
    /全部/,
  );

  submitKeyword(body, '查无此节目zzz');
  await flush();
  assert.equal(stateOf(body), 'empty');
  assert.match(stateTitle(body), /没有找到/);

  const clear = find(body, (node) => node.textContent === '清空')[0];
  clear.dispatch('click');
  await flush();
  assert.equal(searchField(body).value, '');
  assert.equal(stateOf(body), 'ok');
  assert.equal(programIds(body).length, content.programs.length);
});

test('the loading state is real and shown while the data adapter is pending', async () => {
  const doc = createFakeDocument();
  /** @type {(value: import('../web/data/api.js').ProgramSearchResult) => void} */
  let resolveSearch = () => {};
  const pending = new Promise((resolve) => {
    resolveSearch = resolve;
  });
  const body = renderProgramsBody(doc, content, () => {}, { search: () => pending });

  assert.equal(stateOf(body), 'loading');
  assert.match(stateTitle(body), /正在/);

  resolveSearch({ status: 'ok', keyword: '', category: 'all', items: content.programs });
  await flush();
  assert.equal(stateOf(body), 'ok');
  assert.ok(programIds(body).length >= 1);
});

test('a failing search shows an explicit failure state that can retry', async () => {
  const doc = createFakeDocument();
  let attempts = 0;
  const body = renderProgramsBody(doc, content, () => {}, {
    search: (query) => {
      attempts += 1;
      if (attempts === 1) return Promise.reject(new Error('example adapter unavailable'));
      return searchPrograms(query);
    },
  });
  await flush();

  assert.equal(stateOf(body), 'error');
  assert.match(stateTitle(body), /读不到/);

  const retry = find(body, (node) => node.textContent === '重试')[0];
  retry.dispatch('click');
  await flush();
  assert.equal(attempts, 2);
  assert.equal(stateOf(body), 'ok');
});

test('keyword search stays inside the selected category and highlight always matches results', async () => {
  const doc = createFakeDocument();
  const body = renderProgramsBody(doc, content, () => {});
  await flush();

  // 先全库搜索「梁祝」→ 命中越剧《梁祝》。
  submitKeyword(body, '梁祝');
  await flush();
  assert.deepEqual(programIds(body), ['liangzhu']);

  // 关键词保持时切到「戏曲」→ 仍是《梁祝》，且结果全部属于戏曲。
  clickCategory(body, 'opera');
  await flush();
  assert.equal(pressedCategory(body), 'opera');
  assert.deepEqual(programIds(body), ['liangzhu']);
  assert.equal(categoryOf('liangzhu'), 'opera');

  // 关键词保持时切到「老歌」→ 如实无结果，且提示写出「老歌」与「梁祝」。
  clickCategory(body, 'oldies');
  await flush();
  assert.equal(pressedCategory(body), 'oldies');
  assert.equal(stateOf(body), 'empty');
  assert.equal(programIds(body).length, 0, 'no program may leak across the selected category');
  assert.match(stateTitle(body), /老歌/);
  assert.match(stateTitle(body), /梁祝/);

  // 「在全部节目里找『梁祝』」把范围切回全部并重新命中，高亮同步为「全部」。
  const broaden = find(body, (node) => node.textContent.includes('在全部节目里找'))[0];
  assert.ok(broaden, 'the empty state must offer a real way out of the mismatch');
  broaden.dispatch('click');
  await flush();
  assert.equal(pressedCategory(body), 'all');
  assert.deepEqual(programIds(body), ['liangzhu']);

  // 清空关键词 → 回到当前分类的完整列表。
  clickCategory(body, 'oldies');
  await flush();
  submitKeyword(body, '梁祝');
  await flush();
  assert.equal(stateOf(body), 'empty');
  find(body, (node) => node.textContent === '清空')[0].dispatch('click');
  await flush();
  assert.equal(searchField(body).value, '');
  assert.equal(pressedCategory(body), 'oldies');
  assert.deepEqual(programIds(body).sort(), ['jingdian-laoge', 'minyue-laoge']);
});

test('category browsing has a real hit and a real miss inside the same category', async () => {
  const doc = createFakeDocument();
  const body = renderProgramsBody(doc, content, () => {});
  await flush();

  // 戏曲分类命中：3 个戏曲节目。
  clickCategory(body, 'opera');
  await flush();
  assert.equal(stateOf(body), 'ok');
  assert.deepEqual(programIds(body).sort(), ['chaoyanggou', 'liangzhu', 'tianxianpei']);

  // 戏曲分类内搜索「茶馆」→ 无命中，提示写出分类与关键词。
  submitKeyword(body, '茶馆');
  await flush();
  assert.equal(stateOf(body), 'empty');
  assert.match(stateTitle(body), /戏曲/);
  assert.match(stateTitle(body), /茶馆/);

  // 推荐分类是策展集合，不是节目自身分类。
  clickCategory(body, 'recommend');
  await flush();
  assert.equal(stateOf(body), 'ok');
  assert.ok(programIds(body).every((id) => content.programs.find((p) => p.id === id).recommended));
});

test('opening a sample detail then changing category or search invalidates the old detail', async () => {
  const doc = createFakeDocument();
  const activated = [];
  const body = renderProgramsBody(doc, content, (route) => activated.push(route));
  await flush();

  const detail = detailNode(body);
  const results = resultsNode(body);
  assert.equal(detail.hidden, true, 'detail entry starts closed');

  // 打开《朝夕巷》：可见详情 + 与 V02 的一致映射。
  clickProgram(body, 'zhaoxi-xiang');
  assert.equal(detail.hidden, false);
  assert.equal(detailTitle(body), '朝夕巷');
  assert.equal(find(detail, (node) => node.getAttribute('data-route') === 'video').length, 1);
  assert.equal(doc.activeElement, detail, 'opening moves focus into the sample detail');

  // 切换分类：旧详情与旧 V02 播放入口必须失效，焦点交回结果区。
  clickCategory(body, 'opera');
  assert.equal(detail.hidden, true, 'a new filter must close the stale detail');
  assert.equal(detailTitle(body), null, 'stale detail content must be cleared');
  assert.equal(
    find(body, (node) => node.getAttribute('data-route') === 'video').length,
    0,
    'the stale V02 play entry must disappear',
  );
  assert.equal(doc.activeElement, results, 'focus returns to the results region');
  await flush();
  assert.deepEqual(programIds(body).sort(), ['chaoyanggou', 'liangzhu', 'tianxianpei']);

  // 随后点击节目 B 才展示对应详情，且无伪造的 V02 关联。
  clickProgram(body, 'liangzhu');
  assert.equal(detail.hidden, false);
  assert.equal(detailTitle(body), '越剧《梁祝》');
  assert.equal(find(detail, (node) => node.getAttribute('data-route') === 'video').length, 0);

  // 提交新关键词同样先让旧详情失效（此处戏曲分类 + 老歌 → 如实无命中）。
  submitKeyword(body, '老歌');
  assert.equal(detail.hidden, true, 'a new keyword search must close the stale detail');
  assert.equal(detailTitle(body), null);
  await flush();
  assert.equal(stateOf(body), 'empty');
  assert.equal(pressedCategory(body), 'opera');

  // 回到全部并打开某个节目后，「清空」也是一次新的检索：先失效旧详情。
  clickCategory(body, 'all');
  await flush();
  clickProgram(body, 'minyue-laoge');
  assert.equal(detail.hidden, false);
  find(body, (node) => node.textContent === '清空')[0].dispatch('click');
  assert.equal(detail.hidden, true);
  assert.equal(detailTitle(body), null);
  await flush();
  assert.equal(searchField(body).value, '');
  assert.equal(programIds(body).length, content.programs.length);

  assert.deepEqual(activated, [], 'closing/re-filtering must not trigger playback navigation');
});

test('the detail return path hands focus back to the triggering card', async () => {
  const doc = createFakeDocument();
  const body = renderProgramsBody(doc, content, () => {});
  await flush();

  const detail = detailNode(body);
  const card = clickProgram(body, 'chaguan-chunqiu');
  assert.equal(detail.hidden, false);
  assert.equal(doc.activeElement, detail);

  find(detail, (node) => node.classList.contains('jq-program-detail__close'))[0].dispatch('click');
  assert.equal(detail.hidden, true);
  assert.equal(doc.activeElement, card, 'return must hand focus back to the opener');
});

test('rapid filter changes keep only the last result (stale responses are dropped)', async () => {
  const doc = createFakeDocument();
  const body = renderProgramsBody(doc, content, () => {}, {
    search: async (query) => {
      const slow = query.keyword === '梁祝';
      await new Promise((resolve) => setTimeout(resolve, slow ? 30 : 1));
      return searchPrograms(query);
    },
  });

  // 第一次搜索慢、第二次快：晚到的旧结果不得覆盖新结果。
  submitKeyword(body, '梁祝');
  submitKeyword(body, '茶馆');
  await new Promise((resolve) => setTimeout(resolve, 60));
  assert.equal(stateOf(body), 'ok');
  assert.deepEqual(programIds(body), ['chaguan-chunqiu']);
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
  assert.equal(pressedCategory(shell.body.childNodes[0]), 'drama', '短剧 entry opens 短剧');

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
  assert.equal(
    doc.activeElement,
    searchField(shell.body.childNodes[0]),
    'the 搜一搜 entry must land ready to type',
  );
});

test('search focus happens only after mounting and again on cached re-entry', async () => {
  // Browser focus() ignores detached nodes: the old pre-mount call must not pass this test.
  const doc = createFakeDocument({ requireMountedFocus: true });
  const { shell } = mountApp(doc, undefined);
  clickRoute(shell, 'search');
  await flush();
  const body = shell.body.childNodes[0];
  const field = searchField(body);
  assert.equal(doc.activeElement, field, 'newly mounted search field must receive focus');

  clickRoute(shell, 'home');
  doc.activeElement = null; // Browser drops focus when the active input is detached.
  clickRoute(shell, 'search');
  assert.equal(shell.body.childNodes[0], body, 'search scene must remain cached');
  assert.equal(doc.activeElement, field, 'cached search field must receive focus on re-entry');
});

test('program tabs and header navigation share one route, category and search state', async () => {
  const doc = createFakeDocument();
  const { shell } = mountApp(doc, undefined);

  clickRoute(shell, 'programs-drama');
  const body = shell.body.childNodes[0];
  assert.equal(pressedCategory(body), 'drama');
  assert.equal(
    find(shell.element, (node) => node.getAttribute('data-route') === 'programs-drama' && node.getAttribute('aria-current') === 'page').length,
    1,
  );

  submitKeyword(body, '梁祝');
  await flush();
  assert.equal(stateOf(body), 'empty', 'keyword should not match inside drama');

  clickCategory(body, 'opera');
  await flush();
  assert.equal(shell.body.childNodes[0], body, 'changing a tab must not rebuild the page');
  assert.equal(pressedCategory(body), 'opera');
  assert.equal(searchField(body).value, '梁祝', 'tab switch preserves the keyword');
  assert.deepEqual(programIds(body), ['liangzhu']);
  assert.equal(
    find(shell.element, (node) => node.getAttribute('data-route') === 'programs-opera' && node.getAttribute('aria-current') === 'page').length,
    1,
    'the header must reflect the in-page opera selection',
  );

  clickRoute(shell, 'programs-drama');
  await flush();
  assert.equal(shell.body.childNodes[0], body, 'header navigation reuses the scene');
  assert.equal(pressedCategory(body), 'drama', 'header drama entry must restore drama selection');
  assert.equal(searchField(body).value, '梁祝', 'header navigation must not discard the keyword');
  assert.equal(stateOf(body), 'empty');
  assert.equal(
    find(shell.element, (node) => node.getAttribute('data-route') === 'programs-drama' && node.getAttribute('aria-current') === 'page').length,
    1,
  );

  clickRoute(shell, 'home');
  clickRoute(shell, 'programs-opera');
  await flush();
  assert.equal(shell.body.childNodes[0], body, 'all program header routes share the same cache');
  assert.equal(pressedCategory(body), 'opera');
  assert.deepEqual(programIds(body), ['liangzhu']);
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
  assert.match(css, /\.jq-program-detail \{/);
  // 主题差异只允许来自 tokens 变量，不新增按主题分叉的页面类。
  assert.equal(/\.(a|b)-[a-z]/.test(css), false, 'no per-theme page classes may enter the styles');
});
