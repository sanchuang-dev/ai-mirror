/**
 * 「看节目」节目目录与搜索示例数据（S1 可操作演示，非真实内容服务）。
 *
 * 这是节目频道唯一的一份示例数据：分类、节目海报层级与关键词都由这里集中维护，
 * 经 `web/data/api.js` 出口消费；页面不自行硬编码节目，也不另建第二份列表。
 *
 * 视觉与内容层级参照 OpenDesign 原型（`feat/jianqu-opendesign-v02`）的节目海报与推荐大图，
 * 但这里是重写的单套结构：A/B 主题共用同一份数据与 DOM，只有 CSS 变量不同。
 * 影像为原型开放授权素材（web/assets/img/CREDITS.md）的氛围示意，不冒充真实剧照。
 *
 * 边界：节目、分类、简介均为示例，不表示存在真实短剧 / 戏曲 / 音乐版权内容；
 * 仅 `zhaoxi-xiang`（《朝夕巷》）与现有 V02 示例播放页存在明确的一致映射，
 * 其余节目在详情页接入前只做示例入口，不冒充《朝夕巷》某一集。
 *
 * @typedef {object} ProgramCategory
 * @property {string} id `all` 表示不带分类限制的浏览范围，`recommend` 表示推荐集合。
 * @property {string} label 分类可视名称，也是关键词可命中的文本之一。
 *
 * @typedef {object} ProgramItem
 * @property {string} id
 * @property {string} title
 * @property {string} category 节目自身分类（drama / opera / oldies）。
 * @property {string} meta 内容层级（类型 · 集数 / 歌单规模）。
 * @property {string} summary 一句话简介。
 * @property {string} keywords 供示例检索命中的附加关键词（空格分隔）。
 * @property {string} tone 示例画面色调（warm / calm / gold / cool）。
 * @property {string} image 复用 OpenDesign 授权素材（web/assets/img/）。
 * @property {string} imageAlt
 * @property {string} [tag]
 * @property {boolean} [recommended] 是否属于「推荐」集合。
 * @property {'video'} [demoRoute] 已有示例场景的一致映射；目前仅《朝夕巷》→ V02。
 *
 * @typedef {object} ProgramFixture
 * @property {{ level: string, notice: string }} demo
 * @property {string} title
 * @property {string} inputPlaceholder
 * @property {string} searchHint
 * @property {ProgramCategory[]} categories
 * @property {ProgramItem[]} programs
 */

/** @type {ProgramFixture} */
export const programFixture = {
  demo: {
    level: 'S1',
    notice:
      '看节目 V01：分类、节目与搜索结果均为示例数据，未接入真实内容服务、版权素材或推荐算法。',
  },
  title: '看节目',
  inputPlaceholder: '想看什么？输入节目名或类型，比如「戏曲」',
  searchHint: '关键词只在当前选中的分类（示例节目库）里查找；未接入真实内容服务。',
  categories: [
    { id: 'all', label: '全部' },
    { id: 'recommend', label: '推荐' },
    { id: 'drama', label: '短剧' },
    { id: 'opera', label: '戏曲' },
    { id: 'oldies', label: '老歌' },
  ],
  programs: [
    {
      id: 'zhaoxi-xiang',
      title: '朝夕巷',
      category: 'drama',
      meta: '家庭短剧 · 全 12 集',
      summary: '老巷子里的柴米油盐，一段谁都绕不开的邻里情。',
      keywords: '邻里 家庭 面馆 老巷 生活',
      tone: 'warm',
      image: 'art-reading.jpg',
      imageAlt: '《朝夕巷》氛围画面：公园长椅上的读报日常',
      tag: '继续追剧',
      recommended: true,
      demoRoute: 'video',
    },
    {
      id: 'chaguan-chunqiu',
      title: '茶馆春秋',
      category: 'drama',
      meta: '年代短剧 · 全 46 集',
      summary: '一间茶馆，半条街的人情来往。',
      keywords: '年代 茶馆 市井 老北京',
      tone: 'calm',
      image: 'art-teahouse.jpg',
      imageAlt: '《茶馆春秋》氛围画面：茶馆里的慢生活',
      tag: '更新 3 集',
      recommended: true,
    },
    {
      id: 'laolaiqui',
      title: '老来俏',
      category: 'drama',
      meta: '生活喜剧 · 26 集',
      summary: '几位老伙伴的逗趣日常，越看越热闹。',
      keywords: '喜剧 老年 欢乐 生活',
      tone: 'gold',
      image: 'art-festival.jpg',
      imageAlt: '《老来俏》氛围画面：夜色中的民俗演出',
      tag: '热播',
      recommended: true,
    },
    {
      id: 'tuanyuan-fan',
      title: '团圆饭',
      category: 'drama',
      meta: '家庭短剧 · 全 30 集',
      summary: '一桌家常菜，聚起一家人的故事。',
      keywords: '家庭 团圆 家常菜 年夜饭',
      tone: 'calm',
      image: 'art-food.jpg',
      imageAlt: '《团圆饭》氛围画面：一桌家常菜',
    },
    {
      id: 'chaoyanggou',
      title: '豫剧《朝阳沟》',
      category: 'opera',
      meta: '戏曲 · 经典选段',
      summary: '河南梆子腔里的经典唱段。',
      keywords: '河南 豫剧 唱段 经典',
      tone: 'cool',
      image: 'art-opera.jpg',
      imageAlt: '豫剧《朝阳沟》氛围画面：传统戏曲舞台',
      tag: '经典选段',
      recommended: true,
    },
    {
      id: 'liangzhu',
      title: '越剧《梁祝》',
      category: 'opera',
      meta: '戏曲 · 全本',
      summary: '江南软语里的千古爱情。',
      keywords: '浙江 越剧 爱情 化蝶',
      tone: 'warm',
      image: 'art-classic.jpg',
      imageAlt: '越剧《梁祝》氛围画面：古典仕女画',
      tag: '全本',
    },
    {
      id: 'tianxianpei',
      title: '黄梅戏《天仙配》',
      category: 'opera',
      meta: '戏曲 · 经典选段',
      summary: '树上的鸟儿成双对。',
      keywords: '安徽 黄梅戏 唱段 夫妻',
      tone: 'gold',
      image: 'art-festival.jpg',
      imageAlt: '黄梅戏《天仙配》氛围画面：舞台演出',
    },
    {
      id: 'minyue-laoge',
      title: '民乐老歌',
      category: 'oldies',
      meta: '音乐 · 歌单 32 首',
      summary: '古筝、二胡伴着熟悉的老调子。',
      keywords: '民歌 红歌 怀旧 民乐 古筝',
      tone: 'gold',
      image: 'art-guzheng.jpg',
      imageAlt: '民乐老歌氛围画面：传统民乐合奏',
      tag: '歌单 32 首',
      recommended: true,
    },
    {
      id: 'jingdian-laoge',
      title: '经典老歌联唱',
      category: 'oldies',
      meta: '音乐 · 歌单 48 首',
      summary: '一首接一首，跟着哼就对了。',
      keywords: '怀旧 老歌 联唱 经典',
      tone: 'warm',
      image: 'art-festival.jpg',
      imageAlt: '经典老歌氛围画面：夜色中的演出',
    },
  ],
};
