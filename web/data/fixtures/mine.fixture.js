/**
 * P01「我的」个人中心示例数据（S1 可操作演示，非真实账号 / 交易 / 会员服务）。
 *
 * 这是个人中心唯一的一份示例事实源：追剧历史、我的作品、收藏、报名记录、
 * 订单示例、会员权益与设置入口都从这里取数，经 `web/data/api.js` 出口消费。
 * 页面不另写第二份记录，也不为 A/B 主题复制数据或 DOM。
 *
 * 边界（Issue #18、docs/design/elder-companion-ia-v0.1.md §4）：
 * - 用户身份是**样例身份**，不接真实登录、账号云同步或家庭关系；
 * - 追剧历史 / 收藏 / 报名 / 订单都是显式示例，不伪造真实观看、报名、支付或履约；
 * - 会员状态固定为**未开通会员（示例）**，不得表现为已购买；
 * - 公共设备不渲染本页；深层人格 / 记忆管理不在本卡范围。
 *
 * 影像复用 OpenDesign 原型的开放授权素材（web/assets/img/CREDITS.md），只是氛围示意。
 *
 * @typedef {object} MineRecord
 * @property {string} id
 * @property {string} title
 * @property {string} meta
 * @property {string} note 明确标注示例边界。
 * @property {string} [state] 记录状态（已报名 / 未支付等，必须含示例）。
 * @property {number} [progress] 追剧示例进度（0–100）。
 * @property {string} tone 示例画面色调（warm / calm / gold / cool）。
 * @property {string} image 复用 OpenDesign 授权素材（web/assets/img/）。
 * @property {string} imageAlt
 * @property {string} route 点击记录后进入的既有演示场景。
 * @property {string} cta 记录上的明确动作文案。
 *
 * @typedef {object} MineSection
 * @property {string} title
 * @property {string} sub
 * @property {string} emptyText 没有记录时的诚实说明（不伪造记录）。
 * @property {{ label: string, route: string }} action 该组记录对应的一级演示入口。
 * @property {MineRecord[]} items
 *
 * @typedef {object} MineFixture
 * @property {{ level: string, notice: string }} demo
 * @property {{ name: string, avatarText: string, label: string, deviceLabel: string, note: string }} profile
 * @property {{ title: string, status: string, badge: string, description: string,
 *   benefits: Array<{ title: string, text: string }>,
 *   action: { label: string, route: string } }} membership
 * @property {Record<'history' | 'works' | 'favorites' | 'signups' | 'orders', MineSection>} sections
 * @property {{ title: string, description: string, action: { label: string, route: string } }} persona
 * @property {{ title: string, description: string, action: string }} settings
 */

/** @type {MineFixture} */
export const mineFixture = {
  demo: {
    level: 'S1',
    notice:
      '个人中心 P01 示例页：身份、追剧历史、作品、收藏、报名、订单与会员权益均为示例数据；未接入真实登录、账号云同步、支付或会员订阅。',
  },
  profile: {
    name: '王秀兰',
    avatarText: '兰',
    label: '样例用户 · 个人中心',
    deviceLabel: '家庭个人设备 · 未接入真实登录',
    note: '这里展示的是你的样例身份与本机演示记录；公共设备不会显示本页，也不会展示这些私人数据。',
  },
  membership: {
    title: '会员权益',
    status: '未开通会员（示例）',
    badge: '示例权益 · 非真实订阅',
    description:
      '当前没有购买或订阅会员。下面只说明平台计划的演示权益，不会产生扣款、订单或会员状态。',
    benefits: [
      { title: '示例会员价', text: '商品详情里的会员价只作演示，不参与本次示例订单计算。' },
      { title: '内容权益占位', text: '真实版权片库尚未接入，不承诺可观看范围。' },
      { title: '服务权益占位', text: '客服与优先服务尚未接入，不会生成真实工单。' },
    ],
    action: { label: '去商城看会员权益（示例）', route: 'shop' },
  },
  sections: {
    history: {
      title: '追剧历史',
      sub: '样例观看进度',
      emptyText: '还没有观看记录：在「看节目」里打开一集后，示例进度会在这里显示。',
      action: { label: '看节目目录 ›', route: 'programs' },
      items: [
        {
          id: 'zhaoxi-xiang',
          title: '朝夕巷',
          meta: '第 8 集 · 看到 12:36',
          note: '示例观看进度，未接入真实播放器与剧集。',
          progress: 64,
          tone: 'warm',
          image: 'art-reading.jpg',
          imageAlt: '短剧《朝夕巷》氛围画面：两位老人在公园长椅上读报聊天',
          route: 'video',
          cta: '继续看（示例）',
        },
        {
          id: 'chaguan-chunqiu',
          title: '茶馆春秋',
          meta: '第 14 集 · 还剩 40 分钟',
          note: '示例观看进度，未接入真实片源。',
          progress: 30,
          tone: 'calm',
          image: 'art-teahouse.jpg',
          imageAlt: '《茶馆春秋》氛围画面：茶馆里的慢生活',
          route: 'video',
          cta: '继续看（示例）',
        },
        {
          id: 'tuanyuan-fan',
          title: '团圆饭',
          meta: '第 2 集 · 刚开始',
          note: '示例观看进度，未接入真实片源。',
          progress: 12,
          tone: 'gold',
          image: 'art-food.jpg',
          imageAlt: '《团圆饭》氛围画面：一桌家常菜',
          route: 'video',
          cta: '继续看（示例）',
        },
      ],
    },
    works: {
      title: '我的作品',
      sub: '预生成示例作品',
      emptyText: '还没有作品：去「AI 趣玩」完成一次模拟创作后，示例作品会出现在这里。',
      action: { label: '再做一件 ›', route: 'create' },
      items: [
        {
          id: 'family-portrait',
          title: '全家福写真',
          meta: 'AI 写真 · 预生成示例作品',
          note: '默认仅自己可见（示例），未调用真实模型，也没有上传或云同步。',
          state: '仅自己可见（示例）',
          tone: 'warm',
          image: 'art-living.jpg',
          imageAlt: 'AI 写真氛围画面：客厅里的生活场景',
          route: 'create-result',
          cta: '打开作品结果',
        },
        {
          id: 'fu-calligraphy',
          title: '手写福字',
          meta: '书画 · 预生成示例作品',
          note: '默认仅自己可见（示例），画面是开放授权示意图。',
          state: '仅自己可见（示例）',
          tone: 'calm',
          image: 'art-calligraphy.jpg',
          imageAlt: '书画创作氛围画面：文房四宝',
          route: 'create-result',
          cta: '打开作品结果',
        },
      ],
    },
    favorites: {
      title: '我的收藏',
      sub: '收藏的示例节目',
      emptyText: '还没有收藏：在「看节目」里点收藏后，示例节目会出现在这里。',
      action: { label: '去节目目录 ›', route: 'programs' },
      items: [
        {
          id: 'liangzhu',
          title: '越剧《梁祝》',
          meta: '戏曲 · 全本',
          note: '收藏状态为示例，未接入真实账号片单。',
          tone: 'warm',
          image: 'art-classic.jpg',
          imageAlt: '越剧《梁祝》氛围画面：古典仕女画',
          route: 'video',
          cta: '去看示例',
        },
        {
          id: 'minyue-laoge',
          title: '民乐老歌',
          meta: '音乐 · 歌单',
          note: '收藏状态为示例，未接入真实账号片单。',
          tone: 'gold',
          image: 'art-guzheng.jpg',
          imageAlt: '民乐老歌氛围画面：传统民乐合奏',
          route: 'video',
          cta: '去看示例',
        },
      ],
    },
    signups: {
      title: '报名记录',
      sub: '本地活动示例',
      emptyText: '还没有报名记录：从活动详情完成一次模拟报名后，示例记录会出现在这里。',
      action: { label: '看活动目录 ›', route: 'activity' },
      items: [
        {
          id: 'taiji',
          title: '晨练太极',
          meta: '周六 7:00 · 云栖公园东门',
          note: '示例记录，不占用真实名额，也没有核销凭证。',
          state: '已报名（示例）',
          tone: 'warm',
          image: 'art-taichi.jpg',
          imageAlt: '晨练太极氛围画面：公园里的太极晨练',
          route: 'activity',
          cta: '查看活动',
        },
        {
          id: 'chayi',
          title: '邻里茶艺课',
          meta: '周日 15:00 · 社区活动中心 2 层',
          note: '示例记录只演示名额已满状态，没有真实报名请求。',
          state: '名额已满（示例）',
          tone: 'calm',
          image: 'art-tea.jpg',
          imageAlt: '邻里茶艺课氛围画面：茶艺课上的茶具',
          route: 'activity',
          cta: '查看活动',
        },
      ],
    },
    orders: {
      title: '订单示例',
      sub: 'M03 购物车与订单预览',
      emptyText: '还没有订单示例：从商城商品详情加入购物车后，可在这里查看示例订单预览。',
      action: { label: '去商城 ›', route: 'shop' },
      items: [
        {
          id: 'blood-pressure',
          title: '上臂式电子血压计',
          meta: '示例商品 × 1 · 示例合计 ¥199',
          note: '示例订单未支付、未发货，也没有生成真实订单或扣款。',
          state: '示例订单 · 未支付 · 未发货',
          tone: 'cool',
          image: 'art-living.jpg',
          imageAlt: '家用电子血压计氛围画面：客厅里的生活场景',
          route: 'cart',
          cta: '查看订单示例',
        },
      ],
    },
  },
  persona: {
    title: '人格与记忆',
    description:
      '先看现有 AI 伙伴演示里的角色与说话方式。完整的人格、声线与记忆管理属于后续评审卡片，本页不开放私人记忆数据库。',
    action: { label: '打开 AI 角色演示（示例）', route: 'ai' },
  },
  settings: {
    title: '外观与主题',
    description:
      '沿用设置里的「日光客厅 / 暖夜剧场」两套外观；个人设备会记住你的选择，公共设备不读取这份偏好。',
    action: '打开外观设置',
  },
};
