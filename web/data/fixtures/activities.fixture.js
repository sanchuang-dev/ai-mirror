/**
 * L01-A 本地活动与福利目录示例数据（S1 演示，非真实社区服务）。
 *
 * 这是本地生活 L01 唯一的一份示例数据：H01 首页的活动条目、L01 目录与详情
 * 都从这里取数，经 `web/data/api.js` 出口消费，页面不另写第二份列表或公共详情。
 * L01-B 详情继续复用同一批 `id`，不另建一套活动事实源。
 *
 * 边界：
 * - 活动、福利、提供方、时间、地点、价格与参加条件全部为**虚构示例**；
 * - 不声称真实机构合作，不编造剩余名额、距离 / 步行时间或定位；
 * - L02 报名确认 / 手机接力都在这份数据上演示；`signupState` 是显式的 S1 演示状态，
 *   不是服务端库存、用户报名记录或真实活动状态。
 *
 * 影像复用 OpenDesign 原型的开放授权素材（web/assets/img/CREDITS.md），只是氛围示意。
 *
 * @typedef {'activity' | 'welfare'} ActivityCategory
 *
 * @typedef {'available' | 'full' | 'joined' | 'cancelled'} SignupState
 * 报名演示状态：只有 `available` 能进入确认摘要；其余只展示明确的演示异常，
 * 不伪造服务端余量、报名记录或活动状态。
 *
 * @typedef {object} SignupException
 * @property {string} title
 * @property {string} text
 *
 * @typedef {object} SignupContent
 * @property {string} demoLabel
 * @property {string} notice
 * @property {string} stateLabel
 * @property {string} backToDetailCta
 * @property {string} backToDirectoryCta
 * @property {Record<SignupState, string>} stateLabels
 * @property {Record<'full' | 'joined' | 'cancelled', SignupException>} exceptions
 * @property {{ title: string, intro: string, summaryTitle: string, confirmCta: string,
 *   cancelCta: string, cancelled: string, resultTitle: string, resultBadge: string,
 *   resultText: string, resultClosed: string, resultBackCta: string }} personal
 * @property {{ title: string, intro: string, summaryTitle: string, steps: string[],
 *   qrLabel: string, qrHint: string, statusLabel: string, unavailable: string,
 *   timeout: string, failure: string, demoLabel: string, timeoutCta: string,
 *   failureCta: string, unavailableCta: string, cancelCta: string, cancelled: string,
 *   privacy: string }} handoff
 *
 * @typedef {object} ActivityItem
 * @property {string} id 稳定 id；L01-B 详情与 L02 报名都以它为准。
 * @property {SignupState} [signupState] 报名演示状态；缺省为 `available`。
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
 * @property {SignupContent} signup 报名确认与手机接力的 S1 演示文案。
 * @property {ActivityItem[]} items
 */

/** @type {ActivityFixture} */
export const activityFixture = {
  demo: {
    level: 'S1',
    notice:
      '本地生活：活动、福利、提供方与价格均为虚构示例；报名确认与手机接力是 S1 模拟，未接入真实社区合作方、名额、地图定位、报名或身份服务。',
  },
  title: '本地活动与福利',
  sub: '云栖社区 · 示例目录',
  inputPlaceholder: '找活动或福利，比如「太极」「理发」',
  searchHint: '关键词只在示例目录里查找；时间、地点、提供方与价格都是演示数据。',
  boundary:
    '本页提供示例目录、共用详情与 S1 模拟报名：个人设备可本人确认或取消，公共设备只演示手机接力；不会产生真实报名、凭证、名额或身份会话。',
  categories: [
    { id: 'all', label: '全部' },
    { id: 'activity', label: '活动' },
    { id: 'welfare', label: '福利' },
  ],
  signup: {
    demoLabel: 'S1 模拟报名',
    notice:
      '报名为 S1 演示：不提交真实身份、不占用真实名额、不生成核销凭证，也不建立手机身份会话。',
    stateLabel: '演示报名状态',
    backToDetailCta: '返回活动详情',
    backToDirectoryCta: '查看其他活动',
    stateLabels: {
      available: '可报名（演示）',
      full: '名额已满（演示）',
      joined: '已报名（演示）',
      cancelled: '活动已取消（演示）',
    },
    exceptions: {
      full: {
        title: '名额已满（演示状态）',
        text: '这个示例活动的名额演示为已满，不能继续报名。当前未接入真实报名服务，因此不会排队、不会占用席位，也不会显示虚假的成功结果。可以返回目录查看其他活动。',
      },
      joined: {
        title: '已报名（演示状态）',
        text: '这个示例活动演示为已报名，不需要重复报名。当前未接入真实报名服务，因此不会读取或创建真实报名记录，也不会生成核销凭证。',
      },
      cancelled: {
        title: '活动已取消（演示状态）',
        text: '这个示例活动演示为已取消，无法报名。当前未接入真实报名服务，因此不会提交请求，也不会显示虚假的报名结果。可以返回目录查看其他活动。',
      },
    },
    personal: {
      title: '确认报名信息',
      intro: '请先核对下面这一条示例活动，再由本人确认。确认后只显示本页的模拟结果。',
      summaryTitle: '报名摘要',
      confirmCta: '本人确认报名（模拟）',
      cancelCta: '取消，不报名',
      cancelled: '已取消模拟报名：没有提交报名、没有产生报名状态，也没有占用名额或生成核销凭证。',
      resultTitle: '模拟报名结果 · 未接入真实报名',
      resultBadge: 'S1 演示结果 · 非真实报名回执',
      resultText:
        '本次只完成页面上的模拟确认：没有发送报名请求、没有占用真实名额、没有生成核销凭证。离开详情后不会保留报名状态。',
      resultClosed: '已返回活动详情：模拟结果没有保存为报名记录，也没有改变活动名额。',
      resultBackCta: '返回活动详情',
    },
    handoff: {
      title: '转到你自己的手机继续',
      intro:
        '公共屏幕不采集姓名、手机号或身份会话。真实接入后，报名会在你自己的手机 H5 上继续；当前只演示这条接力路径。',
      summaryTitle: '要接力的活动',
      steps: [
        '在手机上核对同一条活动信息',
        '由本人在手机上确认报名',
        '在手机上查看结果（当前未接入）',
      ],
      qrLabel: '示例二维码 · 不可真实扫码 · 不会建立身份会话',
      qrHint:
        '真实 H5 报名接入前，这个二维码只是接力概念示意，扫不出报名页，也不会上传或保存任何个人信息。',
      statusLabel: '手机接力状态',
      unavailable: '手机接力暂不可用（演示）：真实 H5 报名尚未接入，没有建立身份会话。',
      timeout: '等待手机确认超时（演示）：没有建立身份会话，也没有提交报名；请取消后重试。',
      failure: '手机接力失败（演示）：没有提交报名，也没有保存手机号、姓名或会话信息。',
      demoLabel: '演示反馈（不会真的连接手机）',
      timeoutCta: '演示超时',
      failureCta: '演示失败',
      unavailableCta: '演示不可用',
      cancelCta: '取消，返回活动详情',
      cancelled: '已取消手机接力演示：没有建立身份会话，也没有保留任何报名信息。',
      privacy: '本公共屏幕不收集手机号、姓名或身份会话；离开本页时会清除临时演示状态。',
    },
  },
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
      signupState: 'full',
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
      signupState: 'joined',
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
      signupState: 'cancelled',
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
