/**
 * M01 平台商城首页示例数据（S1 演示，非真实商城）。
 *
 * 这是商城 M01 唯一的一份示例数据：平台精选、类目、入驻店铺（来源）与商品列表都从这里取数，
 * 经 `web/data/api.js` 出口消费，页面不另写第二份商品列表。M02 的商品详情继续复用同一批
 * `id` / `storeId`，不另建一套商品事实源。
 *
 * 边界（Issue #15 / #16）：
 * - 店铺、商品、价格、配送与服务条件全部为**虚构示例**；
 * - 不编造库存、销量、评分、优惠倒计时或真实履约时效；
 * - `details` 只为「上臂式电子血压计」补充 M02 详情资料，其余商品由详情页如实说明未补充；
 * - 购物车与订单预览（M03）复用本文件的商品 / 规格 / 运费事实，只做页面内示例计算；
 * - 不外链其它电商，商品与店铺都在本平台商城内展示。
 *
 * 影像复用 OpenDesign 原型的开放授权素材（web/assets/img/CREDITS.md），只是氛围示意。
 *
 * @typedef {'daily' | 'craft' | 'service' | 'member'} ShopCategory
 *
 * @typedef {object} ShopStore
 * @property {string} id 稳定 id；商品以 `storeId` 指向它。
 * @property {string} name 店铺显示名，明确标注为虚构示例。
 * @property {string} kind 店铺供给类型（生活好物 / 作品制作 / 本地服务 / 平台权益）。
 *
 * @typedef {object} ShopProduct
 * @property {string} id 稳定 id；M02 商品详情以它为准。
 * @property {ShopCategory} category
 * @property {string} storeId 入驻店铺来源，必须存在于 `stores`。
 * @property {string} title
 * @property {string} meta 规格 / 服务形式摘要。
 * @property {string} summary 一句话说明，也是示例检索可命中的文本。
 * @property {string} price 示例价格或示例权益；不得写成真实售价。
 * @property {string} [priceNote] 示例会员价 / 补充说明。
 * @property {boolean} featured 是否进入「平台精选」。
 * @property {string} tone 示例画面色调（warm / calm / gold / cool）。
 * @property {string} image 复用 OpenDesign 授权素材（web/assets/img/）。
 * @property {string} imageAlt
 * @property {string} tags 供示例检索命中的附加关键词（空格分隔）。
 *
 * @typedef {object} ShopCategoryEntry
 * @property {'all' | ShopCategory} id `all` 表示不做分类限制。
 * @property {string} label
 *
 * @typedef {object} ShopProductSpec
 * @property {string} id 规格 id；M02 详情页以它维护当前选择。
 * @property {string} label 规格名称。
 * @property {string} contents 该规格包含什么。
 * @property {'sample' | 'out-of-stock-example'} availability 示例状态；后者只用于演示无货提示。
 * @property {string} availabilityLabel 用户可读的示例状态说明。
 *
 * @typedef {object} ShopProductDetail
 * @property {string} productId 指向 `products` 中的稳定 id。
 * @property {string} intro 详情页的示例边界说明。
 * @property {ShopProductSpec[]} specs 可选规格。
 * @property {string} defaultSpecId 默认规格，必须存在于 `specs`。
 * @property {{ unitPrice: number, quantityLimit: number, quantityNote: string }} pricing
 *   示例单价（用于演示小计，必须与商品 `price` 中的数字一致）、演示数量上限与说明。
 * @property {{ fee: number, freeFrom: number, note: string }} shipping 示例运费规则。
 * @property {string} region 示例适用区域。
 * @property {string} fulfillmentParty 店铺 / 履约方与责任边界。
 * @property {string} delivery 预计配送 / 服务说明。
 * @property {string} afterSales 售后说明。
 * @property {string} stockNote 库存未接入的显式说明。
 *
 * @typedef {object} ShopFixture
 * @property {{ level: string, notice: string }} demo
 * @property {string} title
 * @property {string} sub
 * @property {string} inputPlaceholder
 * @property {string} searchHint
 * @property {string} boundary 目录页的接入边界说明。
 * @property {ShopCategoryEntry[]} categories
 * @property {ShopStore[]} stores
 * @property {ShopProduct[]} products
 * @property {ShopProductDetail[]} details 只为提供完整示例资料的商品补充详情；其余商品由详情页如实说明未补充。
 */

/** @type {ShopFixture} */
export const shopFixture = {
  demo: {
    level: 'S1',
    notice:
      'M01 平台商城：店铺、商品、价格与服务条件均为虚构示例，未接入真实商家、库存、支付或履约服务。',
  },
  title: '平台商城',
  sub: '平台精选 · 入驻店铺 · 示例商品',
  inputPlaceholder: '找商品，比如「血压计」「茶具」',
  searchHint: '关键词只在示例商城目录里查找；店铺、价格与商品均为演示数据。',
  boundary:
    '本页只提供商城浏览：商品详情（M02）与购物车 / 订单预览（M03）均为示例演示，不会产生真实订单或支付。',
  categories: [
    { id: 'all', label: '全部' },
    { id: 'daily', label: '生活好物' },
    { id: 'craft', label: '作品制作' },
    { id: 'service', label: '本地服务' },
    { id: 'member', label: '会员权益' },
  ],
  stores: [
    { id: 'yunqi-life', name: '云栖优选生活馆（虚构示例）', kind: '生活好物' },
    { id: 'wenyu-studio', name: '文玉手作工作室（虚构示例）', kind: '作品制作' },
    { id: 'linli-service', name: '邻里帮生活服务（虚构示例）', kind: '本地服务' },
    { id: 'jianqu-member', name: '见趣会员权益（平台自营示例）', kind: '会员权益' },
  ],
  products: [
    {
      id: 'blood-pressure',
      category: 'daily',
      storeId: 'yunqi-life',
      title: '上臂式电子血压计',
      meta: '大屏大字 · 一键测量 · 语音播报',
      summary: '适合家里日常测量，读数可用大字显示；测量结果仅供参考，不能替代医生诊断。',
      price: '示例价 ¥199',
      priceNote: '示例会员价 ¥179',
      featured: true,
      tone: 'cool',
      image: 'art-living.jpg',
      imageAlt: '家用电子血压计氛围画面：客厅里的生活场景',
      tags: '血压计 健康 大字 语音 测量',
    },
    {
      id: 'reading-lamp',
      category: 'daily',
      storeId: 'yunqi-life',
      title: '大字阅读灯',
      meta: '三档亮度 · 暖光 · 可调角度',
      summary: '放在沙发边看书读报，光线柔和不刺眼。',
      price: '示例价 ¥129',
      featured: false,
      tone: 'warm',
      image: 'art-reading.jpg',
      imageAlt: '阅读灯氛围画面：老人读报的日常',
      tags: '阅读灯 台灯 看书 读报 暖光',
    },
    {
      id: 'tea-set',
      category: 'craft',
      storeId: 'wenyu-studio',
      title: '手作茶具套装',
      meta: '一壶两杯 · 手作釉色 · 每套略有不同',
      summary: '工作室手作示例，适合两个人慢慢喝茶；釉色与尺寸以确认稿为准。',
      price: '示例价 ¥168',
      featured: true,
      tone: 'calm',
      image: 'art-tea.jpg',
      imageAlt: '手作茶具氛围画面：茶席上的茶具',
      tags: '茶具 手作 茶杯 茶壶 釉色',
    },
    {
      id: 'calligraphy-fan',
      category: 'craft',
      storeId: 'wenyu-studio',
      title: '手写福字折扇',
      meta: '手写 · 折扇 · 可选字样',
      summary: '示例作品制作：可预约写一把自己的折扇，字样与扇面以确认稿为准。',
      price: '示例价 ¥88',
      featured: false,
      tone: 'gold',
      image: 'art-calligraphy.jpg',
      imageAlt: '手写书画氛围画面：文房四宝',
      tags: '福字 折扇 书画 手写 作品',
    },
    {
      id: 'family-photo',
      category: 'craft',
      storeId: 'wenyu-studio',
      title: '全家福相框冲印',
      meta: '相框装裱 · 照片冲印 · 示例尺寸',
      summary: '把喜欢的照片冲洗装框；示例作品制作，不包含上门拍摄服务。',
      price: '示例价 ¥69',
      featured: false,
      tone: 'warm',
      image: 'art-festival.jpg',
      imageAlt: '全家福相框氛围画面：夜色中的民俗演出',
      tags: '全家福 相框 冲印 照片 作品',
    },
    {
      id: 'home-tidy',
      category: 'service',
      storeId: 'linli-service',
      title: '上门收纳整理（2 小时）',
      meta: '预约上门 · 2 小时 · 示例服务范围',
      summary: '示例本地服务：整理衣柜与常用物品；实际范围、时间和费用需与商家确认。',
      price: '示例价 ¥199',
      featured: false,
      tone: 'cool',
      image: 'art-living.jpg',
      imageAlt: '居家整理氛围画面：客厅里的生活场景',
      tags: '收纳 整理 上门 家政 服务',
    },
    {
      id: 'phone-tutor',
      category: 'service',
      storeId: 'linli-service',
      title: '手机使用一对一辅导',
      meta: '1 小时 · 面对面 · 示例预约',
      summary: '教挂号、缴费、视频通话等常用操作，按你的节奏来。',
      price: '示例价 ¥59',
      featured: false,
      tone: 'calm',
      image: 'art-classic.jpg',
      imageAlt: '手机辅导氛围画面：古典人物画像',
      tags: '手机 教学 挂号 缴费 视频通话',
    },
    {
      id: 'member-opera',
      category: 'member',
      storeId: 'jianqu-member',
      title: '会员 · 戏曲专区畅看',
      meta: '示例会员权益 · 按月',
      summary: '会员权益示例：戏曲专区内容畅看；真实权益、价格与有效期尚未接入。',
      price: '示例价 ¥19/月',
      featured: false,
      tone: 'warm',
      image: 'art-opera.jpg',
      imageAlt: '戏曲专区氛围画面：传统戏曲舞台',
      tags: '会员 戏曲 权益 畅看',
    },
    {
      id: 'member-delivery',
      category: 'member',
      storeId: 'jianqu-member',
      title: '会员 · 商城免运费',
      meta: '示例会员权益 · 每月 2 次',
      summary: '会员权益示例：商城订单免运费；真实门槛与次数尚未接入。',
      price: '示例权益',
      featured: false,
      tone: 'gold',
      image: 'art-teahouse.jpg',
      imageAlt: '商城权益氛围画面：茶馆里的慢生活',
      tags: '会员 免运费 权益 商城',
    },
  ],
  details: [
    {
      productId: 'blood-pressure',
      intro:
        '这是 M02 的商品详情示例：规格、单价、数量、运费、区域、履约方与售后都只用于说明信息如何呈现，不是真实商品页，也不代表商家真实在售。',
      specs: [
        {
          id: 'standard',
          label: '标准装',
          contents: '主机 1 台 · 袖带 1 条 · 说明书 1 份',
          availability: 'sample',
          availabilityLabel: '正常示例状态（未接入真实库存）',
        },
        {
          id: 'gift',
          label: '礼盒装',
          contents: '主机 1 台 · 收纳包 1 个 · 礼盒 1 个',
          availability: 'out-of-stock-example',
          availabilityLabel: '无货示例状态（仅演示，不代表真实库存）',
        },
      ],
      defaultSpecId: 'standard',
      pricing: {
        unitPrice: 199,
        quantityLimit: 9,
        quantityNote: '数量只为演示加减；演示上限 9 件不是库存限制，也不校验真实可供数量。',
      },
      shipping: {
        fee: 12,
        freeFrom: 299,
        note: '示例规则：满 ¥299 免运费，未满收 ¥12。真实运费、包邮门槛与结算金额尚未接入；购物车与订单预览仅按此示例规则计算。',
      },
      region:
        '示例适用区域：云栖市主城区（虚构）。其它区域是否可送：未提供 / 演示待确认；真实配送范围以商家确认为准。',
      fulfillmentParty:
        '云栖优选生活馆（虚构示例）负责发货、配送协调与售后；平台提供商品展示与交易入口，实际责任以正式协议为准。',
      delivery:
        '预计配送 / 服务说明：本页不承诺真实送达时间；M03 订单预览也只是示例，不产生真实配送。当前未接入真实物流或上门服务。',
      afterSales:
        '示例售后：签收后 7 天内可申请退换（虚构规则）。真实售后政策、运费承担、上门取件与退款时间均未接入，以商家确认为准。',
      stockNote: '库存：未接入真实库存，本页不显示剩余件数，也不保证下单成功。',
    },
  ],
};
