/**
 * AI 趣玩 C02（作品结果 / 私密保存 / 主动分享确认）示例数据
 * （S1 可操作演示，**非真实模型生成**）。
 *
 * 单套数据、单套 DOM：A「日光客厅」/ B「暖夜剧场」只影响 `tokens.css` 变量，不复制这份内容。
 * 作品画面全部复用 OpenDesign 原型（PR #1）已署名授权的氛围示意图（见
 * `web/assets/img/CREDITS.md`），一律标注「预生成示例作品 / 非真实 AI 生成」，
 * 不冒充真实照片、模型输出或已发送的分享回执。
 *
 * 隐私边界（Issue #12 / C02）：作品默认仅自己可见；分享对象是**虚构演示联系人**；
 * 确认后只更新页面上的演示态可见范围，从不伪造真实发送、网络回执或持久化记录。
 *
 * @typedef {object} CreationResultArtwork
 * @property {string} title 示例作品名。
 * @property {string} tone 画面色调（复用 `createMedia` 的 tone）。
 * @property {string} image 公开授权示例图（`web/assets/img/`）。
 * @property {string} imageAlt 画面说明（标注为示例）。
 *
 * @typedef {object} CreationResultContact
 * @property {string} id
 * @property {string} name 虚构演示联系人名。
 * @property {string} relation 关系标签（子女 / 老友等）。
 * @property {string} avatarText 头像文字。
 * @property {string} demo 明确标注为演示联系人的说明。
 *
 * @typedef {object} CreationResultFixture
 * @property {{ level: string, notice: string, badge: string }} demo
 * @property {string} title
 * @property {string} artworkNote
 * @property {string} selectLabel
 * @property {{ title: string, defaultLabel: string, saveCta: string, savedLabel: string, note: string }} privacy
 * @property {{ title: string, note: string, confirmTitle: string, confirmBody: string, confirmCta: string, cancelCta: string, sharedTitle: string, sharedScope: string, sharedNote: string, unshareCta: string }} share
 * @property {CreationResultContact[]} contacts
 * @property {{ restart: string, backToCreation: string, discard: string }} actions
 * @property {Record<string, string>} messages 流程反馈文案（唯一事实源）。
 * @property {Record<string, CreationResultArtwork>} artworks 按主题 id 的预生成示例作品。
 * @property {CreationResultArtwork} fallbackArtwork 主题未知时的共用示例作品结构。
 * @property {Record<string, string>} sourceLabels 素材来源说明（含隐私说明）。
 */

/** @type {CreationResultFixture} */
export const creationResultFixture = {
  demo: {
    level: 'S1',
    notice:
      'AI 趣玩 C02 为 S1 演示：这是预生成的示例作品，未接入真实模型；保存与分享都只在页面上演示，不会上传或发送。',
    badge: '预生成示例作品 · 非真实 AI 生成',
  },
  title: '这是你的作品',
  artworkNote:
    '这是一张公开授权的示例画面，用来演示作品结果的样子；它不来自你的照片或文字，也不是真实 AI 生成结果。',
  selectLabel: '来自你的选择',
  privacy: {
    title: '可见范围',
    defaultLabel: '默认仅自己可见（未公开）',
    saveCta: '保存到我的作品（本机演示）',
    savedLabel: '已保存到我的作品（本机演示）',
    note: '保存只在本次演示里标记「已保存」：不会上传、不写入本机存储、不跨设备同步。',
  },
  share: {
    title: '想分享给谁？（虚构演示联系人）',
    note: '下面都是演示用的虚构联系人，不是真实好友。分享只在本页显示结果，不会真的发送任何消息。',
    confirmTitle: '再确认一次',
    confirmBody: '确认要分享给「{name}」吗？确认后只在本页显示模拟分享结果。',
    confirmCta: '确认分享',
    cancelCta: '取消',
    sharedTitle: '模拟已分享给 {name}（演示）',
    sharedScope: '可见范围：仅「{name}」可见（演示）',
    sharedNote: 'S1 演示：没有真实发送，也没有网络回执。',
    unshareCta: '取消分享，恢复仅自己可见',
  },
  contacts: [
    { id: 'daughter', name: '小敏', relation: '女儿', avatarText: '敏', demo: '虚构演示联系人' },
    { id: 'son', name: '小刚', relation: '儿子', avatarText: '刚', demo: '虚构演示联系人' },
    { id: 'friend', name: '老李', relation: '老友', avatarText: '李', demo: '虚构演示联系人' },
    { id: 'colleague', name: '秀珍', relation: '老同事', avatarText: '珍', demo: '虚构演示联系人' },
  ],
  actions: {
    restart: '再做一次',
    backToCreation: '返回创作',
    discard: '放弃这次创作',
  },
  messages: {
    saved: '已保存到我的作品（本机演示）：没有上传，也不会跨设备同步。',
    contactPicked: '已选择分享对象，请再确认一次；取消不会改变「仅自己可见」。',
    shareCancelled: '已取消分享：作品仍仅自己可见，没有发送任何消息。',
    shared: '已确认：这里只显示模拟分享结果，没有真的发送任何消息。',
    unshared: '已取消分享：作品恢复为仅自己可见。',
  },
  artworks: {
    portrait: {
      title: '客厅里的新合影（示例）',
      tone: 'warm',
      image: 'art-living.jpg',
      imageAlt: '预生成示例作品：客厅里的生活场景',
    },
    restore: {
      title: '重新清晰的老照片（示例）',
      tone: 'cool',
      image: 'art-classic.jpg',
      imageAlt: '预生成示例作品：古典人物画像',
    },
    calligraphy: {
      title: '一副写好的福字（示例）',
      tone: 'calm',
      image: 'art-calligraphy.jpg',
      imageAlt: '预生成示例作品：文房四宝',
    },
    story: {
      title: '一段老故事（示例）',
      tone: 'gold',
      image: 'art-tea.jpg',
      imageAlt: '预生成示例作品：安静的茶席场景',
    },
  },
  fallbackArtwork: {
    title: '一张示例作品（示例）',
    tone: 'warm',
    image: 'art-living.jpg',
    imageAlt: '预生成示例作品：示例画面',
  },
  sourceLabels: {
    example: '示例素材',
    local: '本机图片（未使用你的图片内容）',
    text: '文字描述（本页演示）',
    none: '未选择素材',
  },
};
