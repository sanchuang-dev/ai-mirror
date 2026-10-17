/**
 * V02 视频观看示例数据（S1 可操作演示，非真实播放）。
 *
 * 视觉与内容层级参照 OpenDesign 原型（`feat/jianqu-opendesign-v02`）的「02 视频观看」，
 * 但这里是重写的单套结构：A/B 主题共用同一份数据与 DOM，只有 CSS 变量不同。
 * 影像为原型开放授权素材（web/assets/img/CREDITS.md）的氛围示意，不冒充真实剧照。
 * 集名同为示例文本，不表示存在真实剧集。
 *
 * 边界（Issue #10）：`episodes` 是《朝夕巷》**示例可播放范围**的唯一事实源，节目详情页
 * 的选集与这里的播放器选集都经 `web/data/api.js` 的 `getProgramDetail` 读取同一份，
 * 不再另存第二份；真实版权片源、DRM 与跨设备同步均未接入。
 *
 * @typedef {object} VideoEpisode
 * @property {string} id 集号（两位数字，可与节目详情页的选集对齐）。
 * @property {string} label 选集按钮显示文本。
 * @property {string} title 示例集名。
 *
 * @typedef {object} VideoStill
 * @property {string} tone
 * @property {string} image
 * @property {string} imageAlt
 *
 * @typedef {object} VideoBuddy
 * @property {string} avatar
 * @property {string} text
 *
 * @typedef {object} VideoFixture
 * @property {{ level: string, notice: string }} demo
 * @property {string} title
 * @property {string} programId 与节目目录一致映射的节目 id。
 * @property {string} defaultEpisodeId 无观看会话时的默认集。
 * @property {number} defaultProgress 无本地进度时的示例进度（百分比）。
 * @property {VideoStill} still
 * @property {{ name: string, text: string }} aiNote
 * @property {VideoEpisode[]} episodes
 * @property {VideoStill} nextStill
 * @property {VideoBuddy[]} buddies
 */

/** @type {VideoFixture} */
export const videoFixture = {
  demo: {
    level: 'S1',
    notice: 'V02 视频观看：示例演示页，未接入真实播放器与真实剧集素材。',
  },
  title: '朝夕巷',
  programId: 'zhaoxi-xiang',
  defaultEpisodeId: '08',
  defaultProgress: 28,
  still: {
    tone: 'warm',
    image: 'art-reading.jpg',
    imageAlt: '《朝夕巷》第 8 集画面：公园长椅上的读报日常',
  },
  aiNote: {
    name: '小暖说',
    text: '这一集讲的是：老周把母亲留下的面馆重新开张，邻居们悄悄来帮忙。看到 12:36 处，后面会出现那段呼应的「阳春面」。',
  },
  episodes: [
    { id: '05', label: '05', title: '老周的账本' },
    { id: '06', label: '06', title: '对面的新招牌' },
    { id: '07', label: '07', title: '汤要趁热喝' },
    { id: '08', label: '08', title: '一碗阳春面' },
    { id: '09', label: '09', title: '老街坊' },
    { id: '10', label: '10', title: '抽屉里的信' },
    { id: '11', label: '11', title: '巷口那盏灯' },
    { id: '12', label: '12', title: '年夜饭之前' },
  ],
  nextStill: {
    tone: 'calm',
    image: 'art-teahouse.jpg',
    imageAlt: '下一集预告氛围画面：老街茶馆',
  },
  buddies: [
    { avatar: '李', text: '这面条看着就香，回头我也做一碗。' },
    { avatar: '张', text: '老周这脾气，跟我家那口子一模一样。' },
  ],
};
