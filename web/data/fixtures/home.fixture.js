/**
 * H01 个人首页示例数据（S1 可操作演示，非真实服务）。
 *
 * 视觉与内容层级参照 OpenDesign `feat/jianqu-opendesign-v02` 的个人首页（只读对照），
 * 但这里是本项目重写的**单套**结构：不再按 A/B 各写一份业务数据或 DOM，
 * 主题只影响 `tokens.css` 的 CSS 变量。
 *
 * 所有条目均为示例：不得据此声称存在真实短剧、活动、商品或 AI 结果
 * （见 docs/engineering/frontend-baseline.md §4、design.md §6）。
 *
 * 影像素材：`image` 指向 `web/assets/img/` 下**从 OpenDesign 原型（PR #1）原样复用**的
 * 开放授权图片，署名与授权见 `web/assets/img/CREDITS.md`；它们只是氛围示意，
 * 不得据此声称拥有真实剧照、人物、活动或商品素材。
 *
 * @typedef {object} HomeCard
 * @property {string} id
 * @property {string} title
 * @property {string} meta
 * @property {string} tone
 * @property {string} image
 * @property {string} imageAlt
 * @property {number} [progress]
 * @property {string} [tag]
 *
 * @typedef {object} HomeActivity
 * @property {string} id
 * @property {string} title
 * @property {string} time
 * @property {string} place
 * @property {string} price
 * @property {boolean} free
 * @property {string} tone
 * @property {string} image
 * @property {string} imageAlt
 *
 * @typedef {object} HomeCreation
 * @property {string} id
 * @property {string} title
 * @property {string} subtitle
 * @property {string} tone
 * @property {string} image
 * @property {string} imageAlt
 *
 * @typedef {object} HomeNavItem
 * @property {string} id
 * @property {string} label
 * @property {string} route
 *
 * @typedef {object} HomeFeatured
 * @property {string} id
 * @property {string} title
 * @property {string} eyebrow
 * @property {string} description
 * @property {number} progress
 * @property {string} progressText
 * @property {string} tag
 * @property {string} tone
 * @property {string} image
 * @property {string} imageAlt
 *
 * @typedef {object} HomeFixture
 * @property {{ level: string, notice: string }} demo
 * @property {{ dateLabel: string, greeting: string, name: string, avatarText: string }} viewer
 * @property {HomeNavItem[]} nav
 * @property {HomeFeatured} featured
 * @property {HomeCard[]} continueWatching
 * @property {HomeCard[]} recommendations
 * @property {HomeActivity[]} activities
 * @property {HomeCreation[]} creations
 * @property {{ name: string, status: string, line: string }} companion
 */

/** @type {HomeFixture} */
export const homeFixture = {
  demo: {
    level: 'S1',
    notice: 'H01 试点：本页内容、进度、活动与 AI 均为示例数据，未接入真实内容 / AI / 交易服务。',
  },
  viewer: {
    dateLabel: '10月15日 周三',
    greeting: '下午好',
    name: '王秀兰',
    avatarText: '兰',
  },
  nav: [
    { id: 'home', label: '推荐', route: 'home' },
    { id: 'video', label: '短剧', route: 'video' },
    { id: 'opera', label: '戏曲', route: 'video' },
    { id: 'music', label: '音乐', route: 'video' },
    { id: 'activity', label: '活动', route: 'activity' },
    { id: 'course', label: '课程', route: 'course' },
    { id: 'shop', label: '商城', route: 'shop' },
  ],
  featured: {
    id: 'zhaoxi-xiang',
    title: '朝夕巷',
    eyebrow: '第 8 集 · 家庭生活',
    description: '老巷子里的柴米油盐，一段谁都绕不开的邻里情。',
    progress: 64,
    progressText: '看到 12:36 · 共 45 分钟',
    tag: '继续追剧',
    tone: 'warm',
    image: 'art-reading.jpg',
    imageAlt: '短剧《朝夕巷》氛围画面：两位老人在公园长椅上读报聊天',
  },
  continueWatching: [
    {
      id: 'zhaoxi-xiang',
      title: '朝夕巷',
      meta: '第 8 集 · 还剩 32 分钟',
      progress: 64,
      tone: 'warm',
      image: 'art-reading.jpg',
      imageAlt: '《朝夕巷》氛围画面：公园长椅上的读报日常',
    },
    {
      id: 'chaguan-chunqiu',
      title: '茶馆春秋',
      meta: '第 14 集 · 还剩 40 分钟',
      progress: 30,
      tone: 'calm',
      image: 'art-teahouse.jpg',
      imageAlt: '《茶馆春秋》氛围画面：茶馆里的慢生活',
    },
    {
      id: 'tuanyuan-fan',
      title: '团圆饭',
      meta: '第 2 集 · 刚开始',
      progress: 12,
      tone: 'gold',
      image: 'art-food.jpg',
      imageAlt: '《团圆饭》氛围画面：一桌家常菜',
    },
  ],
  recommendations: [
    {
      id: 'chaguan-chunqiu',
      title: '茶馆春秋',
      meta: '年代 · 全 46 集',
      tag: '更新 3 集',
      tone: 'warm',
      image: 'art-teahouse.jpg',
      imageAlt: '年代短剧《茶馆春秋》氛围画面：茶馆内景',
    },
    {
      id: 'laolaiqui',
      title: '老来俏',
      meta: '生活喜剧 · 26 集',
      tag: '热播',
      tone: 'gold',
      image: 'art-festival.jpg',
      imageAlt: '生活喜剧《老来俏》氛围画面：夜色中的民俗演出',
    },
    {
      id: 'tuanyuan-fan',
      title: '团圆饭',
      meta: '家庭 · 全 30 集',
      tone: 'calm',
      image: 'art-food.jpg',
      imageAlt: '家庭短剧《团圆饭》氛围画面：家常菜',
    },
    {
      id: 'chaoyanggou',
      title: '豫剧《朝阳沟》',
      meta: '戏曲 · 经典选段',
      tone: 'cool',
      image: 'art-opera.jpg',
      imageAlt: '豫剧《朝阳沟》氛围画面：传统戏曲舞台',
    },
    {
      id: 'liangzhu',
      title: '越剧《梁祝》',
      meta: '戏曲 · 全本',
      tone: 'warm',
      image: 'art-classic.jpg',
      imageAlt: '越剧《梁祝》氛围画面：古典仕女画',
    },
    {
      id: 'minyue-laoge',
      title: '民乐老歌',
      meta: '音乐 · 歌单',
      tone: 'gold',
      image: 'art-guzheng.jpg',
      imageAlt: '民乐老歌氛围画面：传统民乐合奏',
    },
  ],
  activities: [
    {
      id: 'taiji',
      title: '晨练太极',
      time: '周六 7:00',
      place: '云栖公园',
      price: '免费',
      free: true,
      tone: 'warm',
      image: 'art-taichi.jpg',
      imageAlt: '晨练太极氛围画面：公园里的太极晨练',
    },
    {
      id: 'chayi',
      title: '邻里茶艺课',
      time: '周日 15:00',
      place: '活动中心',
      price: '余 8 位',
      free: false,
      tone: 'calm',
      image: 'art-tea.jpg',
      imageAlt: '邻里茶艺课氛围画面：茶艺课上的茶具',
    },
    {
      id: 'dubao',
      title: '老友读报会',
      time: '每天 9:30',
      place: '社区书屋',
      price: '免费',
      free: true,
      tone: 'cool',
      image: 'art-reading.jpg',
      imageAlt: '老友读报会氛围画面：社区书屋的读报场景',
    },
  ],
  creations: [
    {
      id: 'portrait',
      title: 'AI 写真',
      subtitle: '给你的家拍一张全家福',
      tone: 'warm',
      image: 'art-living.jpg',
      imageAlt: 'AI 写真氛围画面：客厅里的生活场景',
    },
    {
      id: 'calligraphy',
      title: '写福字 · 书画',
      subtitle: '提笔写一副自己的字',
      tone: 'calm',
      image: 'art-calligraphy.jpg',
      imageAlt: '书画创作氛围画面：文房四宝',
    },
    {
      id: 'restore',
      title: '老照片修复',
      subtitle: '让旧时光重新清晰',
      tone: 'cool',
      image: 'art-classic.jpg',
      imageAlt: '老照片修复氛围画面：古典人物画像',
    },
    {
      id: 'story',
      title: '人生故事',
      subtitle: '说说你的老故事，替你留存',
      tone: 'gold',
      image: 'art-tea.jpg',
      imageAlt: '人生故事氛围画面：安静的茶席场景',
    },
  ],
  companion: {
    name: '小暖',
    status: '在线',
    line: '找不到想看的，跟我说一句就行。',
  },
};
