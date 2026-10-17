import assert from 'node:assert/strict';
import test from 'node:test';
import {
  THEME_PREFERENCE_KEY,
  createThemePreferences,
  isThemeChoice,
  readStoredTheme,
  resolveInitialTheme,
  writeStoredTheme,
} from '../web/data/preferences.js';
import { createFakeStorage } from './helpers/fake-storage.mjs';

test('theme choices are strictly limited to a/b', () => {
  assert.equal(isThemeChoice('a'), true);
  assert.equal(isThemeChoice('b'), true);
  assert.equal(isThemeChoice('c'), false);
  assert.equal(isThemeChoice(''), false);
  assert.equal(isThemeChoice(undefined), false);
  assert.equal(isThemeChoice('A'), false);
});

test('stored preference round-trips and rejects illegal values', () => {
  const storage = createFakeStorage();
  assert.equal(readStoredTheme(storage), null);
  assert.equal(writeStoredTheme(storage, 'b'), true);
  assert.equal(storage.getItem(THEME_PREFERENCE_KEY), 'b');
  assert.equal(readStoredTheme(storage), 'b');

  // 非法值必须当作「无偏好」，可恢复、不抛错、不白屏。
  storage.setItem(THEME_PREFERENCE_KEY, 'night');
  assert.equal(readStoredTheme(storage), null);
  assert.equal(writeStoredTheme(storage, 'c'), false);
});

test('missing or throwing storage degrades to null/false instead of crashing', () => {
  assert.equal(readStoredTheme(null), null);
  assert.equal(readStoredTheme(undefined), null);
  assert.equal(writeStoredTheme(null, 'a'), false);

  const blockedReads = createFakeStorage({ failReads: true });
  assert.equal(readStoredTheme(blockedReads), null);

  const blockedWrites = createFakeStorage({ failWrites: true });
  assert.equal(writeStoredTheme(blockedWrites, 'a'), false);
});

test('theme preferences expose availability and never throw to callers', () => {
  const available = createThemePreferences(createFakeStorage());
  assert.equal(available.available, true);
  assert.equal(available.read(), null);
  assert.equal(available.save('a'), true);
  assert.equal(available.read(), 'a');

  const blocked = createThemePreferences(createFakeStorage({ failWrites: true }));
  assert.equal(blocked.available, true, 'storage object exists even when writes fail');
  assert.equal(blocked.save('b'), false, 'a failed write must be reported, not hidden');

  const none = createThemePreferences(null);
  assert.equal(none.available, false);
  assert.equal(none.read(), null);
  assert.equal(none.save('a'), false);
});

test('initial theme prefers the saved preference over the review ?dir param', () => {
  // 用户显式保存过偏好：刷新（即使 URL 还带旧参数）必须保持自己的选择。
  assert.equal(resolveInitialTheme({ stored: 'a', param: 'b' }), 'a');
  assert.equal(resolveInitialTheme({ stored: 'b', param: 'a' }), 'b');
  // 没有保存过偏好：?dir 评审参数生效，方便截图对照。
  assert.equal(resolveInitialTheme({ param: 'b' }), 'b');
  assert.equal(resolveInitialTheme({ stored: null, param: 'a' }), 'a');
  // 都没有或值非法：回到默认 A，不白屏。
  assert.equal(resolveInitialTheme({}), 'a');
  assert.equal(resolveInitialTheme({ stored: 'x', param: 'y' }), 'a');
});
