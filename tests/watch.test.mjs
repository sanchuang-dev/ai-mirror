import assert from 'node:assert/strict';
import test from 'node:test';
import { mountApp } from '../web/assets/app.js';
import { getProgramContent, getProgramDetail } from '../web/data/api.js';
import { renderProgramsBody } from '../web/pages/programs.js';
import { createWatchLibrary } from '../web/data/watch.js';
import { collect, createFakeDocument } from './helpers/fake-dom.mjs';
import { createFakeStorage } from './helpers/fake-storage.mjs';

/** Flush the directory's async data-adapter chain (microtasks) before asserting. */
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

/** @param {import('./helpers/fake-dom.mjs').FakeNode} root */
const find = (root, predicate) => collect(root, predicate);

/** @param {import('./helpers/fake-dom.mjs').FakeNode} root @param {string} id */
function clickProgram(root, id) {
  const card = find(root, (node) => node.getAttribute('data-program') === id)[0];
  assert.ok(card, 'expected a program card for ' + id);
  card.dispatch('click');
  return card;
}

/** @param {import('./helpers/fake-dom.mjs').FakeNode} shell @param {string} route */
function clickRoute(shell, route) {
  const entry = find(shell, (node) => node.getAttribute('data-route') === route)[0];
  assert.ok(entry, 'expected a formal navigation entry for route ' + route);
  entry.dispatch('click');
  return entry;
}

/** @param {import('./helpers/fake-dom.mjs').FakeNode} root */
const detailNode = (root) => find(root, (node) => node.classList.contains('jq-program-detail'))[0];

/** @param {import('./helpers/fake-dom.mjs').FakeNode} root @param {string} id */
const episodeButton = (root, id) =>
  find(root, (node) => node.getAttribute('data-episode') === id)[0];

/** @param {import('./helpers/fake-dom.mjs').FakeNode} root */
const noticeText = (root) =>
  find(root, (node) => node.classList.contains('jq-program-detail__notice'))[0]?.textContent ?? '';

/** @param {import('./helpers/fake-dom.mjs').FakeNode} root */
const feedbackText = (root) =>
  find(root, (node) => node.classList.contains('jq-program-detail__feedback'))[0]?.textContent ??
  '';

const content = getProgramContent();

test('getProgramDetail composes one program, its episodes and the sample range', () => {
  const detail = getProgramDetail('zhaoxi-xiang');
  assert.ok(detail);
  assert.equal(detail.program.title, '朝夕巷');
  assert.equal(detail.playable, true);
  assert.equal(detail.episodes.length, 12);
  assert.deepEqual(
    detail.episodes.filter((episode) => episode.available).map((episode) => episode.id),
    ['05', '06', '07', '08', '09', '10', '11', '12'],
  );
  assert.deepEqual(detail.sampleRange, { from: '05', to: '12' });

  const other = getProgramDetail('chaguan-chunqiu');
  assert.ok(other);
  assert.equal(other.playable, false, 'a program without the sample mapping is not playable');
  assert.equal(other.episodes.length, 0);

  assert.equal(getProgramDetail('no-such-program'), null);
});

test('the watch library persists sample progress and favorites with an in-memory fallback', () => {
  const storage = createFakeStorage();
  const library = createWatchLibrary(storage);
  assert.equal(library.available, true);
  assert.equal(library.isFavorite('zhaoxi-xiang'), false);

  const favorite = library.toggleFavorite('zhaoxi-xiang');
  assert.deepEqual(favorite, { favorite: true, persisted: true });
  assert.equal(library.isFavorite('zhaoxi-xiang'), true);

  const saved = library.saveProgress('zhaoxi-xiang', '10', 40);
  assert.deepEqual(saved, { percent: 40, persisted: true });
  assert.equal(library.getProgress('zhaoxi-xiang', '10'), 40);
  assert.deepEqual(library.getResume('zhaoxi-xiang'), { episodeId: '10', percent: 40 });

  // 同一存储的新实例读回同一条记录（本地持久化，不是进程内假象）。
  const reloaded = createWatchLibrary(storage);
  assert.equal(reloaded.isFavorite('zhaoxi-xiang'), true);
  assert.equal(reloaded.getProgress('zhaoxi-xiang', '10'), 40);

  // 无存储 / 写入失败：如实退回内存并报告 persisted:false，不抛错、不白屏。
  const memory = createWatchLibrary(null);
  assert.equal(memory.available, false);
  assert.deepEqual(memory.toggleFavorite('x'), { favorite: true, persisted: false });
  assert.equal(memory.isFavorite('x'), true);

  const blocked = createWatchLibrary(createFakeStorage({ failWrites: true }));
  assert.equal(blocked.saveProgress('x', '01', 50).persisted, false);
  assert.equal(blocked.getProgress('x', '01'), 50, 'the session value must survive a failed write');
});

test('program detail shows the sample range and gives honest feedback for what cannot play', async () => {
  const doc = createFakeDocument();
  const library = createWatchLibrary(createFakeStorage());
  const activated = [];
  const body = renderProgramsBody(doc, content, (route) => activated.push(route), { library });
  await flush();

  clickProgram(body, 'zhaoxi-xiang');
  const detail = detailNode(body);
  assert.equal(detail.hidden, false);
  assert.equal(find(detail, (node) => node.hasAttribute('data-episode')).length, 12);
  const available = find(detail, (node) => node.hasAttribute('data-episode')).filter(
    (node) => node.getAttribute('aria-disabled') !== 'true',
  );
  assert.equal(available.length, 8, 'only 05–12 are in the sample playable range');
  assert.match(
    find(detail, (node) => node.classList.contains('jq-program-detail__range'))[0].textContent,
    /示例可播放范围：第 05–12 集/,
  );

  // 未接入片源的集：明确反馈且不跳转。
  episodeButton(detail, '03').dispatch('click');
  assert.deepEqual(activated, []);
  assert.match(feedbackText(detail), /第 03 集不在示例可播放范围（第 05–12 集）内/);

  // 示例可播放的集：记录观看会话并进入既有播放器。
  episodeButton(detail, '09').dispatch('click');
  assert.deepEqual(activated, ['video']);
  assert.deepEqual(library.getSelection(), { programId: 'zhaoxi-xiang', episodeId: '09' });

  // 没有示例资源的节目：如实说明，不出现选集与观看入口。
  clickProgram(body, 'chaguan-chunqiu');
  const other = detailNode(body);
  assert.match(noticeText(other), /暂无示例可播放资源/);
  assert.equal(find(other, (node) => node.hasAttribute('data-episode')).length, 0);
  assert.equal(find(other, (node) => node.getAttribute('data-route') === 'video').length, 0);
  assert.equal(find(other, (node) => node.getAttribute('data-program')).length, 0);
});

test('the detail favorite toggle is reflected in place and persisted', async () => {
  const doc = createFakeDocument();
  const storage = createFakeStorage();
  const library = createWatchLibrary(storage);
  const body = renderProgramsBody(doc, content, () => {}, { library });
  await flush();

  clickProgram(body, 'zhaoxi-xiang');
  const favorite = () =>
    find(body, (node) => node.classList.contains('jq-program-detail__favorite'))[0];
  assert.equal(favorite().getAttribute('aria-pressed'), 'false');

  favorite().dispatch('click');
  assert.equal(library.isFavorite('zhaoxi-xiang'), true);
  assert.equal(favorite().getAttribute('aria-pressed'), 'true');
  assert.match(feedbackText(body), /已加入追剧片单/);
  assert.match(storage.getItem('jianqu.watch-state'), /zhaoxi-xiang/);
});

test('list → detail → episode → existing player → return → continue watching survives A/B themes', async () => {
  const doc = createFakeDocument();
  const storage = createFakeStorage();
  const library = createWatchLibrary(storage);
  const { shell } = mountApp(doc, undefined, { watch: library });

  clickRoute(shell.element, 'programs-drama');
  await flush();
  const programsBody = shell.body.childNodes[0];

  clickProgram(programsBody, 'zhaoxi-xiang');
  episodeButton(detailNode(programsBody), '10').dispatch('click');
  await flush();

  // 进入的是既有 V02 播放器，而不是第二套播放器。
  assert.equal(find(shell.element, (node) => node.classList.contains('jq-scene--video')).length, 1);
  const videoBody = shell.body.childNodes[0];
  assert.match(
    find(videoBody, (node) => node.classList.contains('jq-scene__ep'))[0].textContent,
    /第 10 集/,
  );
  assert.equal(find(videoBody, (node) => node.classList.contains('jq-player')).length, 1);

  // 本地模拟进度可操作并保存。
  find(videoBody, (node) => node.getAttribute('data-progress-step') === '10')[0].dispatch('click');
  assert.equal(library.getProgress('zhaoxi-xiang', '10'), 10);
  const bar = find(videoBody, (node) => node.classList.contains('jq-progress--player'))[0];
  assert.equal(bar.getAttribute('aria-valuenow'), '10');

  // 切主题：不重建播放器、进度不丢。
  shell.applyTheme('b');
  assert.equal(doc.documentElement.getAttribute('data-dir'), 'b');
  assert.equal(shell.body.childNodes[0], videoBody);
  assert.equal(bar.getAttribute('aria-valuenow'), '10');

  // 返回节目详情：续播入口反映刚记录的进度，且仍在原分类详情里。
  const back = find(videoBody, (node) => node.textContent === '返回节目详情')[0];
  assert.ok(back, 'the player must offer a way back to the detail');
  back.dispatch('click');
  assert.equal(shell.body.childNodes[0], programsBody);
  const detail = detailNode(programsBody);
  assert.equal(detail.hidden, false);
  assert.match(
    find(detail, (node) => node.classList.contains('jq-btn--primary'))[0].textContent,
    /继续观看 第 10 集（示例进度 10%）/,
  );
});

test('the last sample episode reports "no next" instead of pretending more content', () => {
  const doc = createFakeDocument();
  const library = createWatchLibrary(createFakeStorage());
  const { shell, show } = mountApp(doc, undefined, { watch: library });
  library.setSelection({ programId: 'zhaoxi-xiang', episodeId: '12' });
  show('video');

  const videoBody = shell.body.childNodes[0];
  assert.match(
    find(videoBody, (node) => node.classList.contains('jq-scene__ep'))[0].textContent,
    /第 12 集/,
  );
  assert.match(
    find(videoBody, (node) => node.classList.contains('jq-video-next__label'))[0].textContent,
    /已经是最后一集/,
  );
  assert.match(
    find(videoBody, (node) => node.classList.contains('jq-video-next__done'))[0].textContent,
    /到第 12 集为止/,
  );
  assert.equal(find(videoBody, (node) => node.getAttribute('data-episode') === '13').length, 0);
});

test('a not-found episode selection in the player gives explicit feedback and a way back', () => {
  const doc = createFakeDocument();
  const library = createWatchLibrary(createFakeStorage());
  const { shell, show } = mountApp(doc, undefined, { watch: library });
  library.setSelection({ programId: 'zhaoxi-xiang', episodeId: '01' });
  show('video');

  const videoBody = shell.body.childNodes[0];
  const notice = find(videoBody, (node) => node.classList.contains('jq-player__notice'))[0];
  assert.equal(notice.hidden, false);
  assert.equal(
    find(notice, (node) => node.classList.contains('jq-player__notice-title'))[0].textContent,
    '未找到示例播放资源',
  );
  assert.match(
    find(notice, (node) => node.classList.contains('jq-player__notice-text'))[0].textContent,
    /第 01 集/,
  );
  assert.equal(
    find(videoBody, (node) => node.classList.contains('jq-player__bar'))[0].hidden,
    true,
    'the normal controls must not pretend to play a missing resource',
  );

  const start = find(notice, (node) => node.textContent.includes('从第 05 集开始'))[0];
  assert.ok(start, 'the not-found state must offer a playable start');
  start.dispatch('click');
  assert.deepEqual(library.getSelection(), { programId: 'zhaoxi-xiang', episodeId: '05' });
  assert.equal(
    find(videoBody, (node) => node.classList.contains('jq-player__notice'))[0].hidden,
    true,
  );
});

test('a public terminal never mounts or reads injected personal watch state', () => {
  const doc = createFakeDocument();
  const throwing = {
    available: true,
    isFavorite: () => {
      throw new Error('public device read personal watch state');
    },
    toggleFavorite: () => {
      throw new Error('public device wrote personal watch state');
    },
    getProgress: () => {
      throw new Error('public device read personal watch state');
    },
    saveProgress: () => {
      throw new Error('public device wrote personal watch state');
    },
    getResume: () => {
      throw new Error('public device read personal watch state');
    },
    setSelection: () => {},
    getSelection: () => null,
  };
  const { shell, show } = mountApp(doc, undefined, { deviceMode: 'public', watch: throwing });

  assert.equal(shell.getMode(), 'public');
  for (const route of ['programs', 'programs-drama', 'search', 'video']) {
    assert.equal(show(route), 'public', route + ' must stay inside the public terminal');
  }
  assert.equal(
    find(shell.element, (node) => node.classList.contains('jq-scene--programs')).length,
    0,
  );
  assert.equal(find(shell.element, (node) => node.classList.contains('jq-scene--video')).length, 0);
});
