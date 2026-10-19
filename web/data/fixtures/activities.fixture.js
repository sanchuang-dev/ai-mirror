/**
 * L01-A 本地活动与福利目录示例数据（S1 演示，非真实社区服务）。
 *
 * 这是本地生活 L01 唯一的一份示例数据：H01 首页的活动条目、L01 目录与详情
 * 都从这里取数，经 `web/data/api.js` 出口消费，页面不另写第二份列表或公共详情。
 * L01-B 详情继续复用同一批 `id`，不另建一套活动事实源。
 *
 * 边界：
 * - 活动、福利、提供方、时间、地点、价格与参加条件全部为**虚构示例**；
 * - 不声称真实机构合作，不编造剩余名额、距离 / 步行时间、定位或已报名状态；
 * - 报名确认归 L02；本数据只提供目录与详情展示所需字段。
 *
 * 影像复用 OpenDesign 原型的开放授权素材（web/assets/img/CREDITS.md），只是氛围示意。
 *
 * @typedef {'activity' | 'welfare'} ActivityCategory
 *
 * @typedef {object} ActivityItem
 * @property {string} id 稳定 id；L01-B 详情与 L02 报名都以它为准。
 * @property {ActivityCategory} category `activity` 活动 / `welfare` 福利。
 * @property {string} title
 * @property {string} summary 一句话说明，也是示例检索可命中的文本。
 * @property {string} time 示例时间。
 * @property {string} place 示例地点（不含距离 / 步行时间）。
 * @property {string} area 适用区域。
 * @property {string} audience 参加条件（示例）。
 * @property {string} provider 示例提供方（明确标注虚构）。
 * @property {string} price 免费或示例价格；不得写成剩余名额。
 * @property {boolean} free
 * @property {string} tone 示例画面色调（warm / calm / gold / cool）。
 * @property {string} image 复用 OpenDesign 授权素材（web/assets/img/）。
 * @property {string} imageAlt
 * @property {string} tags 供示例检索命中的附加关键词（空格分隔）。
 *
 * @typedef {object} ActivityCategoryEntry
 * @property {'all' | ActivityCategory} id `all` 表示不做分类限制。
 * @property {string} label
 *
 * @typedef {object} ActivityFixture
 * @property {{ level: string, notice: string }} demo
 * @property {string} title
 * @property {string} sub
 * @property {string} inputPlaceholder
 * @property {string} searchHint
 * @property {string} boundary 目录页的接入边界说明。
 * @property {ActivityCategoryEntry[]} categories
 * @property {ActivityItem[]} items
 */

/** @type {ActivityFixture} */
export const activityFixture = {
  demo: {
    level: 'S1',
    notice:
      'L01-A 本地生活：活动、福利、提供方与价格均为虚构示例，未接入真实社区合作方、名额、地图定位或报名服务。',
  },
  title: '本地活动与福利',
  sub: '云栖社区 · 示例目录',
  inputPlaceholder: '找活动或福利，比如「太极」「理发」',
  searchHint: '关键词只在示例目录里查找；时间、地点、提供方与价格都是演示数据。',
  boundary:
    '本页提供示例目录与共用详情：分类、关键词筛选与资料查看可用；报名（L02）尚未接入，不会产生报名凭证或真实预约。',
  categories: [
    { id: 'all', label: '全部' },
    { id: 'activity', label: '活动' },
    { id: 'welfare', label: '福利' },
  ],
  items: [
    {
      id: 'taiji',
      category: 'activity',
      title: '晨练太极',
      summary: '跟着社区文体小组慢慢舒展，适合第一次参加的邻居。',
      time: '周六 7:00',
      place: '云栖公园东门',
      area: '云栖社区',
      audience: '社区居民均可参加（示例条件）',
      provider: '云栖社区文体小组（虚构示例）',
      price: '免费（示例）',
      free: true,
      tone: 'warm',
      image: 'art-taichi.jpg',
      imageAlt: '晨练太极氛围画面：公园里的太极晨练',
      tags: '太极 晨练 公园 免费',
    },
    {
      id: 'chayi',
      category: 'activity',
      title: '邻里茶艺课',
      summary: '一起认茶具、泡一壶茶，边喝边聊。',
      time: '周日 15:00',
      place: '社区活动中心 2 层',
      area: '云栖社区',
      audience: '社区居民均可参加（示例条件）',
      provider: '云栖社区活动中心（虚构示例）',
      price: '示例价 ¥5',
      free: false,
      tone: 'calm',
      image: 'art-tea.jpg',
      imageAlt: '邻里茶艺课氛围画面：茶艺课上的茶具',
      tags: '茶艺 茶 手工 活动中心',
    },
    {
      id: 'dubao',
      category: 'activity',
      title: '老友读报会',
      summary: '读读当天的新闻，聊聊身边的新鲜事。',
      time: '每天 9:30',
      place: '社区书屋',
      area: '云栖社区',
      audience: '社区居民均可参加（示例条件）',
      provider: '社区书屋志愿组（虚构示例）',
      price: '免费（示例）',
      free: true,
      tone: 'cool',
      image: 'art-reading.jpg',
      imageAlt: '老友读报会氛围画面：社区书屋的读报场景',
      tags: '读报 新闻 书屋 免费',
    },
    {
      id: 'liangxueya',
      category: 'welfare',
      title: '免费量血压',
      summary: '顺路量个血压，问问日常注意事项。',
      time: '每日 9:00–11:00',
      place: '社区卫生服务站',
      area: '云栖社区',
      audience: '社区居民均可参加（示例条件）',
      provider: '社区卫生服务站（虚构示例）',
      price: '免费（示例）',
      free: true,
      tone: 'calm',
      image: 'art-living.jpg',
      imageAlt: '免费量血压氛围画面：客厅里的生活场景',
      tags: '血压 健康 卫生服务站 免费',
    },
    {
      id: 'lifa',
      category: 'welfare',
      title: '便民理发',
      summary: '社区里的便民理发点，剪个清爽的短发。',
      time: '周三下午',
      place: '社区活动中心 1 层',
      area: '云栖社区',
      audience: '社区居民均可参加（示例条件）',
      provider: '社区便民服务点（虚构示例）',
      price: '示例价 ¥5',
      free: false,
      tone: 'gold',
      image: 'art-festival.jpg',
      imageAlt: '便民理发氛围画面：夜色中的民俗演出',
      tags: '理发 便民 活动中心',
    },
    {
      id: 'shoujike',
      category: 'welfare',
      title: '手机课堂',
      summary: '教挂号、缴费和视频通话，一步一步来。',
      time: '周五 14:00',
      place: '社区活动中心 多功能厅',
      area: '云栖社区',
      audience: '社区居民均可参加（示例条件）',
      provider: '社区志愿者（虚构示例）',
      price: '免费（示例）',
      free: true,
      tone: 'cool',
      image: 'art-calligraphy.jpg',
      imageAlt: '手机课堂氛围画面：文房四宝',
      tags: '手机 课堂 挂号 缴费 免费',
    },
  ],
};
