/**
 * 见趣 Web 基线唯一数据出口（ENG-01 §4）。
 *
 * 页面与组件不得直接 import fixtures，也不得散落 fetch / 硬编码业务数据。
 * 真实后端接入前，这里的适配器返回显式标注的 S1 示例数据；
 * 真实与示例的切换将来集中在这一个配置点，不由各页面自行判断。
 */
import { homeFixture } from './fixtures/home.fixture.js';
import { videoFixture } from './fixtures/video.fixture.js';
import { aiFixture } from './fixtures/ai.fixture.js';
import { courseFixture } from './fixtures/course.fixture.js';
import { publicFixture } from './fixtures/public.fixture.js';
import { programFixture } from './fixtures/programs.fixture.js';

/** @typedef {import('./fixtures/home.fixture.js').HomeFixture} HomeContent */
/** @typedef {import('./fixtures/video.fixture.js').VideoFixture} VideoContent */
/** @typedef {import('./fixtures/ai.fixture.js').AiFixture} AiContent */
/** @typedef {import('./fixtures/course.fixture.js').CourseFixture} CourseContent */
/** @typedef {import('./fixtures/public.fixture.js').PublicFixture} PublicContent */
/** @typedef {import('./fixtures/programs.fixture.js').ProgramFixture} ProgramContent */
/** @typedef {import('./fixtures/programs.fixture.js').ProgramItem} ProgramItem */

/**
 * H01 个人首页内容。
 * @returns {HomeContent} 单一结构的首页数据，A/B 主题共用。
 */
export function getHomeContent() {
  return homeFixture;
}

/**
 * V02 视频观看内容。
 * @returns {VideoContent} 单一结构的示例数据，A/B 主题共用。
 */
export function getVideoContent() {
  return videoFixture;
}

/**
 * A01 AI 伙伴内容。
 * @returns {AiContent} 单一结构的示例数据，A/B 主题共用。
 */
export function getAiContent() {
  return aiFixture;
}

/**
 * E01 数字人课程内容。
 * @returns {CourseContent} 单一结构的示例数据，A/B 主题共用。
 */
export function getCourseContent() {
  return courseFixture;
}

/**
 * G00 公共服务首页内容（公共终端，不含个人内容）。
 * @returns {PublicContent} 单一结构的示例数据，A/B 主题共用。
 */
export function getPublicContent() {
  return publicFixture;
}

/**
 * 「看节目」节目目录内容（分类 + 节目海报）。
 * @returns {ProgramContent} 单一结构的示例数据，A/B 主题共用。
 */
export function getProgramContent() {
  return programFixture;
}

/**
 * @typedef {object} ProgramSearchResult
 * @property {'ok' | 'empty'} status
 * @property {string} keyword 规范化后的关键词（空串表示未按关键词过滤）。
 * @property {string} category 生效的分类（`all` / `recommend` / 节目自身分类）。
 * @property {ProgramItem[]} items
 */

/**
 * 在示例节目库中检索。异步契约与真实搜索服务一致，页面据此展示加载 / 命中 /
 * 无结果 / 失败状态；当前由本地 S1 样本数据实现，**不做真实网络请求**，
 * 也不能被当成真实服务器成功响应。接入真实后端时只替换本函数实现。
 *
 * 分类与搜索是**组合筛选**：`category` 与 `keyword` 同时生效，返回的每一项都满足
 * 当前分类，且（若有关键词）命中该关键词。`category: 'all'` 表示不做分类限制。
 * 这样页面高亮的分类与可见结果永远一致（Review PR #38 Finding 1）。
 *
 * @param {{ keyword?: string, category?: string }} [query]
 * @returns {Promise<ProgramSearchResult>}
 */
export function searchPrograms(query = {}) {
  const keyword = String(query.keyword ?? '').trim();
  const category = query.category ?? 'all';
  // 微任务即真实的异步数据适配边界，不伪造网络延迟或服务器成功响应。
  return Promise.resolve().then(() => {
    const items = matchPrograms(keyword, category);
    return {
      status: items.length > 0 ? 'ok' : 'empty',
      keyword,
      category,
      items,
    };
  });
}

/**
 * @param {string} keyword 已 trim 的关键词。
 * @param {string} category
 * @returns {ProgramItem[]}
 */
function matchPrograms(keyword, category) {
  /** @type {(id: string) => string} */
  const label = (id) => programFixture.categories.find((entry) => entry.id === id)?.label ?? '';
  return programFixture.programs.filter((program) => {
    if (category === 'recommend') {
      if (!program.recommended) return false;
    } else if (category !== 'all' && program.category !== category) {
      return false;
    }
    if (!keyword) return true;
    const haystack = [
      program.title,
      program.meta,
      program.summary,
      program.keywords,
      label(program.category),
    ].join(' ');
    return haystack.includes(keyword);
  });
}
