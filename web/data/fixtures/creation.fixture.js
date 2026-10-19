/**
 * AI 趣玩 C01（主题选择 + 素材授权 + 模拟生成入口）示例数据（S1 可操作演示，非真实模型）。
 *
 * 单套数据、单套 DOM：A「日光客厅」/ B「暖夜剧场」只影响 `tokens.css` 变量，不复制这份内容。
 * 所有文案都如实标注「S1 演示 / 未接入真实模型」。素材复用 OpenDesign 原型（PR #1）
 * 已署名授权的氛围示意图片（见 `web/assets/img/CREDITS.md`），不冒充真实照片、作品或 AI 输出。
 *
 * 本卡（C01）只到「生成前 / 模拟发起」为止：作品结果、保存与分享属于 C02，不在这里伪造完成。
 *
 * @typedef {object} CreationTheme
 * @property {string} id
 * @property {string} title
 * @property {string} subtitle
 * @property {string} tone
 * @property {string} image
 * @property {string} imageAlt
 * @property {boolean} [featured] 是否为本次完整示范主题（默认展开整条流程）。
 * @property {string} [featuredNote] 示范主题角标文案。
 *
 * @typedef {object} CreationSource
 * @property {string} id 素材来源：`example`（示例素材）/ `local`（本地图片，仅本机预览）/ `text`（文字描述）。
 * @property {string} label
 * @property {string} desc
 *
 * @typedef {object} CreationSample
 * @property {string} id
 * @property {string} title
 * @property {string} tone
 * @property {string} image
 * @property {string} imageAlt
 *
 * @typedef {object} CreationStep
 * @property {string} id
 * @property {string} label
 *
 * @typedef {object} CreationFixture
 * @property {{ level: string, notice: string }} demo
 * @property {string} title
 * @property {CreationStep[]} steps
 * @property {CreationTheme[]} themes
 * @property {CreationSource[]} sources
 * @property {CreationSample[]} samples
 * @property {{ title: string, body: string, agree: string, refuse: string }} consent
 * @property {{ note: string, cta: string, pendingTitle: string, pendingText: string, pendingRoute: string }} generate
 * @property {Record<string, string>} messages 流程反馈文案（唯一事实源，页面不另写一份）。
 */

/** @type {CreationFixture} */
export const creationFixture = {
  demo: {
    level: 'S1',
    notice:
      'AI 趣玩 C01 为 S1 演示：主题、素材与「模拟生成」都在本机页面内演示，未接入真实模型；素材不上传、不保存。',
  },
  title: 'AI 趣玩',
  steps: [
    { id: 'theme', label: '1 · 选主题' },
    { id: 'source', label: '2 · 选素材' },
    { id: 'preview', label: '3 · 确认预览' },
    { id: 'done', label: '4 · 模拟生成' },
  ],
  themes: [
    {
      id: 'portrait',
      title: 'AI 写真',
      subtitle: '给家里人拍一张新照片',
      tone: 'warm',
      image: 'art-living.jpg',
      imageAlt: 'AI 写真氛围画面：客厅里的生活场景',
      featured: true,
      featuredNote: '本次示范主题',
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
      id: 'calligraphy',
      title: '写福字 · 书画',
      subtitle: '提笔写一副自己的字',
      tone: 'calm',
      image: 'art-calligraphy.jpg',
      imageAlt: '书画创作氛围画面：文房四宝',
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
  sources: [
    { id: 'example', label: '示例素材', desc: '用一张演示图片试试（最省事）' },
    { id: 'local', label: '本地图片', desc: '从本机选一张，只在本机预览' },
    { id: 'text', label: '文字描述', desc: '说说你想要什么画面' },
  ],
  samples: [
    {
      id: 'sample-living',
      title: '客厅合影',
      tone: 'warm',
      image: 'art-living.jpg',
      imageAlt: '示例素材：客厅里的生活场景',
    },
    {
      id: 'sample-reading',
      title: '公园读报',
      tone: 'calm',
      image: 'art-reading.jpg',
      imageAlt: '示例素材：公园长椅上的读报日常',
    },
    {
      id: 'sample-tea',
      title: '老友茶席',
      tone: 'gold',
      image: 'art-tea.jpg',
      imageAlt: '示例素材：茶席上的茶具',
    },
  ],
  consent: {
    title: '素材使用许可',
    body: '你选的素材只用于本次本机预览：不会上传到网络、不会保存到设备，撤销后立即丢弃。',
    agree: '我同意，仅本机演示使用',
    refuse: '拒绝授权',
  },
  generate: {
    note: 'S1 演示：这里尚未连接任何真实 AI 模型，点「模拟生成」不会真的产出作品。',
    cta: '模拟生成（S1 演示）',
    pendingTitle: '等待真实模型接入',
    pendingText:
      '作品结果、保存与分享属于 C02，本卡（C01）只演示到「发起创作」之前，不会伪造生成完成。',
    pendingRoute: 'create-result',
  },
  messages: {
    themeNext: '已选好主题，接着选素材来源。',
    pickSource: '先选一种素材来源：示例素材、本地图片或文字描述。',
    noMaterial: '还没有选好素材：先挑一张示例图、选一张本地图片，或写一句描述。',
    localChosen: '已在本机预览选中的图片；不会上传，也不会保存。',
    localMissing: '没有拿到文件：请重新选择一张本机图片。',
    sampleChosen: '已选好示例素材，可以确认授权了。',
    textChosen: '已记下你的描述，可以确认授权了。',
    agreed: '已确认授权：素材只用于本次本机演示，可以预览了。',
    refused: '已拒绝授权：你选的素材已经丢弃，没有保留。',
    revoked: '已撤销：素材与本机预览都已经清除，可以重新选择。',
    generated: 'S1 演示：这里只停留在发起前的说明，没有真实生成结果。',
    pending: '作品结果、保存与分享（C02）尚未实现：本卡不会伪造生成完成。',
    reset: '已清空本次演示，可以从头再选一次。',
  },
};
