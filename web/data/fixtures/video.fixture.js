/**
 * V02 视频观看示例数据（S1 可操作演示，非真实播放）。
 *
 * 视觉与内容层级参照 OpenDesign 原型（`feat/jianqu-opendesign-v02`）的「02 视频观看」，
 * 但这里是重写的单套结构：A/B 主题共用同一份数据与 DOM，只有 CSS 变量不同。
 * 影像为原型开放授权素材（web/assets/img/CREDITS.md）的氛围示意，不冒充真实剧照。
 *
 * @typedef {object} VideoStill
 * @property {string} tone
 * @property {string} image
 * @property {string} imageAlt
 *
 * @typedef {object} VideoEpisode
 * @property {string} label
 * @property {boolean} [current]
 *
 * @typedef {object} VideoBuddy
 * @property {string} avatar
 * @property {string} text
 *
 * @typedef {object} VideoFixture
 * @property {{ level: string, notice: string }} demo
 * @property {string} title
 * @property {string} episode
 * @property {number} progress
 * @property {string} timecode
 * @property {VideoStill} still
 * @property {{ name: string, text: string }} aiNote
 * @property {string} followLabel
 * @property {VideoEpisode[]} episodes
 * @property {{ name: string, label: string }} next
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
  episode: '第 8 集 · 一碗阳春面',
  progress: 28,
  timecode: '12:36 / 45:00',
  still: {
    tone: 'warm',
    image: 'art-reading.jpg',
    imageAlt: '《朝夕巷》第 8 集画面：公园长椅上的读报日常',
  },
  aiNote: {
    name: '小暖说',
    text: '这一集讲的是：老周把母亲留下的面馆重新开张，邻居们悄悄来帮忙。看到 12:36 处，后面会出现那段呼应的「阳春面」。',
  },
  followLabel: '已追 8 集',
  episodes: [
    { label: '05' },
    { label: '06' },
    { label: '07' },
    { label: '08', current: true },
    { label: '09' },
    { label: '10' },
    { label: '11' },
    { label: '12' },
  ],
  next: { name: '第 9 集 · 老街坊', label: '45 分钟 · 后天更新' },
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
