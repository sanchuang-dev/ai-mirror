/**
 * A01 AI 伙伴示例数据（S1 可操作演示，非真实 AI 服务）。
 *
 * 参照 OpenDesign 原型「03 AI 伙伴」，但为单套结构；A/B 主题共用同一份数据与 DOM。
 * 所有回复、卡片与价格都是示例，不代表真实 AI 生成或真实商品。
 *
 * @typedef {object} AiUserMessage
 * @property {'user'} type
 * @property {string} text
 *
 * @typedef {object} AiReplyMessage
 * @property {'ai'} type
 * @property {string} text
 *
 * @typedef {object} AiServiceCard
 * @property {'card'} type
 * @property {string} name
 * @property {string} meta
 * @property {string} desc
 * @property {string} [price]
 * @property {string} [priceNote]
 * @property {string} [route] 卡片动作去向；商品卡进入 M01 平台商城，缺省沿用示例提示。
 * @property {string} [actionLabel] 卡片按钮文字。
 * @property {string} tone
 * @property {string} image
 * @property {string} imageAlt
 *
 * @typedef {AiUserMessage | AiReplyMessage | AiServiceCard} AiStreamItem
 *
 * @typedef {object} AiFixture
 * @property {{ level: string, notice: string }} demo
 * @property {string} name
 * @property {string} role
 * @property {string} statusLabel
 * @property {string} statusText
 * @property {string[]} styles
 * @property {AiStreamItem[]} stream
 * @property {string[]} quick
 * @property {string} inputHint
 * @property {string} sendLabel
 */

/** @type {AiFixture} */
export const aiFixture = {
  demo: {
    level: 'S1',
    notice: 'A01 AI 伙伴：示例演示页，对话与结果均为预设样例，不是真实 AI 服务。',
  },
  name: '小暖',
  role: '你的生活搭子 · 一直在',
  statusLabel: '正在帮你找',
  statusText: '周末能报名的太极课',
  styles: ['慢慢讲', '说重点', '唠家常'],
  stream: [
    { type: 'user', text: '帮我找个周末能报的太极课' },
    {
      type: 'ai',
      text: '找着了，云栖公园周六早上有晨练太极，免费，实际距离请以地图和场地信息为准。要不要我直接替你报上？',
    },
    {
      type: 'card',
      name: '晨练太极 · 入门班',
      meta: '云栖公园 · 周六 7:00–8:00 · 免费',
      desc: '零基础可上，跟着教练一招一式来。已报 12 人，还差 6 人开课。',
      tone: 'warm',
      image: 'art-taichi.jpg',
      imageAlt: '晨练太极活动氛围画面',
    },
    { type: 'user', text: '顺便看看有没有好用的血压计' },
    { type: 'ai', text: '挑了两款适合家里用的，字大、能存测量记录。' },
    {
      type: 'card',
      name: '上臂式电子血压计',
      meta: '大屏大字 · 一键测量 · 支持语音播报',
      desc: '示例商品，未接入真实商城与库存。',
      price: '¥199',
      priceNote: '会员价 ¥179',
      // 商品卡进入 M01 平台商城的示例商品目录；M02 再统一商品详情。
      route: 'shop',
      actionLabel: '去平台商城看看',
      tone: 'cool',
      image: 'art-living.jpg',
      imageAlt: '家用电子血压计氛围画面',
    },
  ],
  quick: ['找附近活动', '查一件商品', '讲讲这门课', '用手机帮我做'],
  inputHint: '跟小暖说句话…',
  sendLabel: '说给它听',
};
