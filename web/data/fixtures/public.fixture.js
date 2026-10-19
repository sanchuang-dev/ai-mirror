/**
 * G00 公共服务首页示例数据（S1 可操作演示，公共终端）。
 *
 * 参照 OpenDesign 原型「05 公共服务模式」，但为单套结构；A/B 主题共用同一份数据与 DOM。
 * 这是公共设备首页：**不得**出现个人姓名、私人聊天 / 记忆入口或用户订单。所有活动、
 * 福利与课程均为示例，报名不产生真实凭证。
 *
 * @typedef {object} PublicSignup
 * @property {string} title
 * @property {string} meta
 * @property {string} price
 * @property {boolean} free
 * @property {string} tone
 * @property {string} image
 * @property {string} imageAlt
 *
 * @typedef {object} PublicWelfare
 * @property {string} icon
 * @property {string} name
 * @property {string} sub
 *
 * @typedef {object} PublicCourse
 * @property {string} title
 * @property {string} meta
 * @property {string} tone
 * @property {string} image
 * @property {string} imageAlt
 *
 * @typedef {object} PublicGuestAi
 * @property {string} title
 * @property {string} notice
 * @property {{ title: string, tone: string, image: string, imageAlt: string }} artwork
 * @property {string} artworkLabel
 * @property {string} note
 * @property {string} clearCta
 * @property {string} clearedTitle
 * @property {string} clearedText
 * @property {string} reopenCta
 *
 * @typedef {object} PublicFixture
 * @property {{ level: string, notice: string }} demo
 * @property {{ logo: string, sub: string }} brand
 * @property {string} dateLabel
 * @property {string} note
 * @property {{ eyebrow: string, title: string, desc: string, stats: Array<{ num: string, cap: string }> }} band
 * @property {PublicSignup[]} signups
 * @property {PublicWelfare[]} welfare
 * @property {PublicCourse[]} courses
 * @property {string[]} services
 * @property {PublicGuestAi} guestAi
 */

/** @type {PublicFixture} */
export const publicFixture = {
  demo: {
    level: 'S1',
    notice: 'G00 公共服务：公共终端示例演示，不含个人内容；报名与福利均未真实接入。',
  },
  brand: { logo: '见趣 · 社区版', sub: '云栖社区活动中心 · 1 号厅' },
  dateLabel: '10月15日 周三 · 14:20',
  note: '本机为公共终端，不含个人内容',
  band: {
    eyebrow: '本周社区',
    title: '重阳节·邻里敬老周',
    desc: '义诊、理发、文艺演出陆续开场，凭社区卡即可参加。',
    stats: [
      { num: '12', cap: '场活动' },
      { num: '6', cap: '项免费福利' },
      { num: '3', cap: '门公共课' },
    ],
  },
  signups: [
    {
      title: '太极入门课',
      meta: '周六 7:00 · 广场东侧',
      price: '余 6 位',
      free: false,
      tone: 'warm',
      image: 'art-taichi.jpg',
      imageAlt: '太极入门课氛围画面',
    },
    {
      title: '防诈骗讲座',
      meta: '周五 10:00 · 多功能厅',
      price: '免费',
      free: true,
      tone: 'cool',
      image: 'art-reading.jpg',
      imageAlt: '防诈骗讲座氛围画面',
    },
    {
      title: '茶艺体验',
      meta: '周日 15:00 · 茶室',
      price: '余 8 位',
      free: false,
      tone: 'calm',
      image: 'art-tea.jpg',
      imageAlt: '茶艺体验氛围画面',
    },
    {
      title: '重阳文艺演出',
      meta: '周六 18:30 · 中心广场',
      price: '免费',
      free: true,
      tone: 'gold',
      image: 'art-festival.jpg',
      imageAlt: '重阳文艺演出氛围画面',
    },
  ],
  welfare: [
    { icon: '＋', name: '免费量血压', sub: '每日 9:00–11:00' },
    { icon: '✂', name: '便民理发', sub: '周三下午 · 5 元' },
    { icon: '☎', name: '手机课堂', sub: '教挂号、缴费' },
    { icon: '☂', name: '爱心雨伞', sub: '前台自助借用' },
  ],
  courses: [
    {
      title: '书法入门',
      meta: '数字人讲师 · 8 节',
      tone: 'gold',
      image: 'art-calligraphy.jpg',
      imageAlt: '书法课氛围画面',
    },
    {
      title: '民乐欣赏',
      meta: '数字人讲师 · 6 节',
      tone: 'warm',
      image: 'art-guzheng.jpg',
      imageAlt: '民乐欣赏氛围画面',
    },
    {
      title: '居家养生',
      meta: '数字人讲师 · 10 节',
      tone: 'calm',
      image: 'art-taichi.jpg',
      imageAlt: '居家养生氛围画面',
    },
  ],
  services: ['社保查询', '医院挂号', '公交卡充值', '政务办事', '紧急呼叫'],
  // 公共设备 / 游客的 AI 趣玩临时体验（C02）：只在本次页面会话展示虚构样本，
  // 不读取也不写入个人作品、联系人或持久化记录；随时可「结束体验并清除」。
  guestAi: {
    title: 'AI 趣玩 · 公共体验',
    notice:
      'AI 趣玩公共体验（S1 演示）：只展示预生成的示例作品，不接真实模型、不读取任何个人信息。',
    artwork: {
      title: '预生成示例作品（示例）',
      tone: 'warm',
      image: 'art-living.jpg',
      imageAlt: '公共体验预生成示例作品：客厅里的生活场景',
    },
    artworkLabel: '预生成示例作品 · 非真实 AI 生成',
    note: '公共体验只在本次页面会话展示：结束整次体验后立即清除，不留到下一位使用者。',
    clearCta: '清除本示例作品',
    clearedTitle: '示例作品已清除',
    clearedText: '这张示例作品已从当前页面移除。要结束整次公共体验，请用「结束体验并清除」。',
    reopenCta: '再看一次示例',
  },
};
