/**
 * 见趣 Web 基线唯一数据出口（ENG-01 §4）。
 *
 * 页面与组件不得直接 import fixtures，也不得散落 fetch / 硬编码业务数据。
 * 真实后端接入前，这里的适配器返回显式标注的 S1 示例数据；
 * 真实与示例的切换将来集中在这一个配置点，不由各页面自行判断。
 */
import { homeFixture } from './fixtures/home.fixture.js';

/** @typedef {import('./fixtures/home.fixture.js').HomeFixture} HomeContent */

/**
 * H01 个人首页内容。
 * @returns {HomeContent} 单一结构的首页数据，A/B 主题共用。
 */
export function getHomeContent() {
  return homeFixture;
}
