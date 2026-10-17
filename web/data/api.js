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

/** @typedef {import('./fixtures/home.fixture.js').HomeFixture} HomeContent */
/** @typedef {import('./fixtures/video.fixture.js').VideoFixture} VideoContent */
/** @typedef {import('./fixtures/ai.fixture.js').AiFixture} AiContent */
/** @typedef {import('./fixtures/course.fixture.js').CourseFixture} CourseContent */
/** @typedef {import('./fixtures/public.fixture.js').PublicFixture} PublicContent */

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
