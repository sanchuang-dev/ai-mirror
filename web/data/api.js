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
import { creationFixture } from './fixtures/creation.fixture.js';
import { creationResultFixture } from './fixtures/creation-result.fixture.js';
import { activityFixture } from './fixtures/activities.fixture.js';

/** @typedef {import('./fixtures/home.fixture.js').HomeContent} HomeContent */
/** @typedef {import('./fixtures/video.fixture.js').VideoFixture} VideoContent */
/** @typedef {import('./fixtures/ai.fixture.js').AiFixture} AiContent */
/** @typedef {import('./fixtures/course.fixture.js').CourseFixture} CourseContent */
/** @typedef {import('./fixtures/public.fixture.js').PublicFixture} PublicContent */
/** @typedef {import('./fixtures/programs.fixture.js').ProgramFixture} ProgramContent */
/** @typedef {import('./fixtures/programs.fixture.js').ProgramItem} ProgramItem */
/** @typedef {import('./fixtures/creation.fixture.js').CreationFixture} CreationContent */
/** @typedef {import('./fixtures/creation-result.fixture.js').CreationResultFixture} CreationResultContent */
/** @typedef {import('./fixtures/activities.fixture.js').ActivityFixture} ActivityContent */

/**
 * H01 首页数据：在首页 fixture 之上，把「家门口的活动」接到 L01-A 的唯一活动事实源。
 * 首页只取目录条目中的活动（不含福利），字段与目录卡片保持一致。
 * @type {HomeContent}
 */
const homeContent = {
  ...homeFixture,
  activities: activityFixture.items
    .filter((item) => item.category === 'activity')
    .map((item) => ({
      id: item.id,
      title: item.title,
      time: item.time,
      place: item.place,
      price: item.price,
      free: item.free,
      tone: item.tone,
      image: item.image,
      imageAlt: item.imageAlt,
    })),
};
/**
 * H01 个人首页内容。
 *
 * 「家门口的活动」不再在首页 fixture 里维护第二份：它由 L01-A 的活动数据
 * （`activities.fixture.js`）组合成首页需要的精简字段，因此首页卡片与本地生活目录
 * 永远指向同一批示例条目。
 * @returns {HomeContent} 单一结构的首页数据，A/B 主题共用。
 */
export function getHomeContent() {
  return homeContent;
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
 * AI 趣玩 C01 内容（主题 / 素材来源 / 授权与模拟生成文案）。
 * @returns {CreationContent} 单一结构的示例数据，A/B 主题共用。
 */
export function getCreationContent() {
  return creationFixture;
}

/**
 * AI 趣玩 C02 作品结果内容（预生成示例作品 / 私密保存 / 主动分享确认文案）。
 * @returns {CreationResultContent} 单一结构的示例数据，A/B 主题共用。
 */
export function getCreationResultContent() {
  return creationResultFixture;
}

/**
 * L01-A 本地活动与福利目录内容（分类 + 示例条目）。
 * @returns {ActivityContent} 单一结构的示例数据，A/B 主题共用。
 */
export function getActivityContent() {
  return activityFixture;
}

/**
 * @typedef {object} ProgramEpisode
 * @property {string} id 集号（两位数字）。
 * @property {string} label 选集按钮显示文本。
 * @property {string} [title] 示例集名（仅示例可播放范围内的集有）。
 * @property {string} [image] 该集示例画面（复用授权素材，非真实剧照）。
 * @property {string} [imageAlt] 该集示例画面说明。
 * @property {string} [aiNote] 该集示例解说文本（S1 演示，非真实 AI）。
 * @property {boolean} available 是否在示例可播放范围内（可进入 V02 示例播放器）。
 *
 * @typedef {object} ProgramDetail
 * @property {ProgramItem} program
 * @property {ProgramEpisode[]} episodes 全部集（含未接入片源的集）；无集数标注时为空。
 * @property {boolean} playable 是否存在示例可播放资源。
 * @property {{ from: string, to: string } | null} sampleRange 示例可播放集号范围。
 */

/**
 * 单个节目的示例详情（简介 / 全集 / 示例可播放范围）。
 *
 * 同步组合本地 S1 数据：节目与集数来自节目目录，示例可播放范围来自 `video.fixture`，
 * 两者只在这里汇合，页面不再自行拼接。接入真实详情服务时应把本函数改为异步，
 * 并在页面补加载 / 失败态；当前不伪造异步与网络成功。
 *
 * @param {string} programId
 * @returns {ProgramDetail | null} 未找到该节目时返回 null，由界面给出明确反馈。
 */
export function getProgramDetail(programId) {
  const program = programFixture.programs.find((item) => item.id === programId) ?? null;
  if (!program) return null;

  const sample = program.demoRoute === 'video' ? videoFixture.episodes : [];
  const total = typeof program.episodeCount === 'number' ? program.episodeCount : 0;
  /** @type {ProgramEpisode[]} */
  const episodes = [];
  for (let index = 0; index < total; index += 1) {
    const id = String(index + 1).padStart(2, '0');
    const match = sample.find((episode) => episode.id === id);
    episodes.push({
      id,
      label: id,
      ...(match?.title ? { title: match.title } : {}),
      ...(match?.image ? { image: match.image } : {}),
      ...(match?.imageAlt ? { imageAlt: match.imageAlt } : {}),
      ...(match?.aiNote ? { aiNote: match.aiNote } : {}),
      available: Boolean(match),
    });
  }

  const playable = sample.length > 0 && episodes.some((episode) => episode.available);
  return {
    program,
    episodes,
    playable,
    sampleRange:
      sample.length > 0 ? { from: sample[0].id, to: sample[sample.length - 1].id } : null,
  };
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
