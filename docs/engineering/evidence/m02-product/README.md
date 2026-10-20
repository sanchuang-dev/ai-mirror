# M02 商品详情与履约信息 · 证据（Issue #16）

> 采集日期：2026-10-19 · 基线：`dev` @ `63c6dfdee0b1947eafb8f987ffec1fcf4e4d0010`（工作树实现）
> 采集环境：本 Worker runner，Chromium 155（`--headless=new`，ChromeDriver 155 WebDriver），安装 `fonts-noto-cjk` 渲染中文，窗口 1600×900（视口 1600×757）。
> 这些是**评审证据快照**，不是产品源码；源码见 [`web/`](../../../../web/)，视觉契约见 [`design.md`](../../../../design.md)，主题 Token 见 [`web/assets/tokens.css`](../../../../web/assets/tokens.css)。
> 本卡只交付 M02 商品详情与履约信息；购物车、订单确认与真实支付仍归 [M03 #17](https://github.com/sanchuang-dev/ai-mirror/issues/17)。

## 交付内容

- 新增 [`web/pages/product.js`](../../../../web/pages/product.js)：单套商品详情语义页，路由格式为 `product:<id>`；商城列表卡片与 AI 商品推荐卡进入**同一个**详情路由。
- [`web/data/fixtures/shop.fixture.js`](../../../../web/data/fixtures/shop.fixture.js)：在 M01 唯一商品 / 店铺事实源上补 `details`，只为一个样例商品「上臂式电子血压计」提供完整示例规格、数量、单价、运费、区域、履约方、配送与售后说明；店铺、商品、价格继续复用 M01 的稳定 `id` / `storeId`。
- [`web/data/api.js`](../../../../web/data/api.js)：新增 `getShopProductDetail(productId)`，商品、店铺、类目与详情只从这里汇合；找不到商品返回 `null`，商品存在但未补详情时返回 `detail: null`，由页面如实说明。
- [`web/pages/shop.js`](../../../../web/pages/shop.js)：M01 列表卡片改为进入统一 `product:<id>` 路由，删除列表内嵌的第二份详情语义；从详情返回时把焦点交回触发卡片。
- [`web/assets/app.js`](../../../../web/assets/app.js)：`product:<id>` 成为正式可导航路由；详情按来源返回 `shop` / `ai`，每次进入从页头开始；公共设备仍无法进入任何个人商城路由。
- [`web/data/fixtures/ai.fixture.js`](../../../../web/data/fixtures/ai.fixture.js)：AI 商品卡改为进入同一详情路由，按钮文案「查看示例商品详情」，并明确「未做真实比价」。
- [`web/assets/components.css`](../../../../web/assets/components.css)：新增 `.jq-product__*` 详情 / 规格 / 数量 / 履约 / M03 占位状态样式，删除 M01 内嵌详情样式；颜色与留白全部来自 `tokens.css`，无 `a-*` / `b-*` 页面类。
- [`web/data/notices.js`](../../../../web/data/notices.js)：补商品详情入口的诚实示例文案。
- 新增 [`tests/product.test.mjs`](../../../../tests/product.test.mjs)：9 项覆盖同一路由、数据示例边界、规格 / 数量 / 运费、返回焦点、无货 / 取消、未补详情、公共隔离与 A/B 主题安全；原 M01 测试同步改为验证路由接入。

### 边界（按 Issue #16 收口）

- **不做**购物车结算、真实订单、支付或外部商城跳转；「加入购物车（示例入口）」「查看订单预览（示例入口）」只展示 M03 待实现的诚实反馈与可取消状态，不写购物车、不建订单。
- **不假定**真实库存与配送时效：库存一律写「未接入真实库存」，配送页明确「不承诺真实送达时间」；礼盒装是**无货示例状态**，只用于演示禁用入口，不代表真实库存。
- 只为「上臂式电子血压计」补完整示例详情；其它商品进入同一路由时展示「详情资料尚未补充」，不编造规格、运费、履约或售后事实。
- AI 商品卡只做示例推荐，文案明确「未做真实比价」，不声称实时推荐或真实比价结果。
- 不重画 H01 / M01，不新增第三套视觉；影像复用 OpenDesign 授权素材（`web/assets/img/CREDITS.md`），`alt` 与角标都标注「示例画面」。

## 复现命令

```bash
npm ci --no-audit --no-fund
npm run check      # ESLint + Prettier + tsc(checkJs,strict) + node --check + node --test
npm run preview    # http://127.0.0.1:4173/
```

浏览器交互与截图经一次性 ChromeDriver（WebDriver）脚本驱动（按 browser-verification 约束**不入库**）：
`?dir=a` 打开 → 顶栏「商城」→「生活好物」→ 打开「上臂式电子血压计」→ 切「礼盒装」（无货示例）→ 切回「标准装」→「加入购物车（示例入口）」→「取消演示」→ 数量 +1 →「返回商品列表」→ 打开「大字阅读灯」（未补详情）→「返回商品列表」→ 右下「问问小暖」→ AI 商品卡「查看示例商品详情」→ 详情内切 B 主题 → 无货示例 →「查看订单预览（示例入口）」→「取消演示」→「返回小暖」。

## 结果

- **质量门禁**：`npm ci --no-audit --no-fund && npm run check` 真实执行、退出码 0；Node 测试器 **125/125** 通过。基线 116 项测试未被删除；M01 中与内嵌详情相关的断言按统一路由改写，新增 9 项 M02 测试。
- **验收 1（列表与 AI 商品卡进入同一详情语义页）**：A 主题商城「生活好物」列表 `products=[blood-pressure, reading-lamp]`；点击商品卡与 AI 商品卡都进入 `jq-scene--product`，`h1=上臂式电子血压计`、`h1Count=1`；来源标签分别为「来自平台商城的示例商品列表」和「来自小暖的示例商品推荐（未做真实比价）」。
- **验收 2（店铺 / 单价 / 规格 / 运费 / 服务条件明确，不伪造库存）**：详情包含 `标准装 / 礼盒装` 两个规格、示例单价 `¥199`、数量 1–9 演示控制、示例运费 `满 ¥299 免运费，未满 ¥12`、示例适用区域、店铺与履约方、配送 / 服务说明、售后说明；页面同时写出「库存：未接入真实库存」「不承诺真实送达时间」「以商家确认为准」。数量 1 时示例合计 `¥211`，数量 2 时 `¥398` 且示例运费变为免运费。
- **验收 3（加入购物车 / 订单预览入口与取消 / 无货状态）**：标准规格下两个入口可点，点击只显示「M03 待实现」说明；「取消演示」后状态写「没有写入购物车 / 没有生成订单」或「没有发起支付」。切到礼盒装，页面显示无货示例状态，两个入口 `disabled=true`，再次点击不会打开购买演示。
- **验收 4（返回路径与 M01 状态保留）**：从详情返回商城后仍保留 `pressedCategory=daily` 与 M01 列表，焦点回到 `data-product=blood-pressure` 的商品卡；从 AI 进入详情后「返回小暖」回到原 AI 场景。商城自身「返回首页」没有被详情来源覆盖。
- **验收 5（A/B 主题一致性）**：`b_theme_same_dom=true`（切主题不重建详情 DOM）；A/B 的 `h1` 与规格标签完全一致；两主题 `overflowX=false`；页面无 `data-dir` 分叉、无 `a-*` / `b-*` 页面类。
- **无 JS 错误**：浏览器内捕获的 `error` / `unhandledrejection` / `console.error` 为空数组（`errors=[]`）。

## 截图（真实视口 1600×757）

| 文件 | 内容 |
| --- | --- |
| [m02-shop-list-a.png](m02-shop-list-a.png) | M01「生活好物」列表入口上下文（示例商品卡） |
| [m02-product-detail-a.png](m02-product-detail-a.png) | A 主题商品详情：来源、店铺 / 类目 / 价格、规格与购买区 |
| [m02-product-detail-b.png](m02-product-detail-b.png) | B 主题同一详情：同一 DOM，只切 Token |
| [m02-product-out-of-stock-a.png](m02-product-out-of-stock-a.png) | A 主题礼盒装「无货示例状态」与禁用入口说明 |
| [m02-product-out-of-stock-b.png](m02-product-out-of-stock-b.png) | B 主题同一无货示例状态 |
| [m02-product-cart-placeholder-a.png](m02-product-cart-placeholder-a.png) | 「加入购物车（示例入口）」→ M03 待实现 / 取消演示 |
| [m02-product-order-placeholder-b.png](m02-product-order-placeholder-b.png) | B 主题「查看订单预览（示例入口）」→ M03 待实现 / 取消演示 |
| [m02-product-unavailable-a.png](m02-product-unavailable-a.png) | 未补详情商品进入同一路由时如实说明，不编造事实 |
| [m02-product-from-ai-a.png](m02-product-from-ai-a.png) | 从 AI 商品卡进入同一详情，来源与返回小暖路径 |
| [m02-return-shop-a.png](m02-return-shop-a.png) | 从详情返回 M01，类目筛选保留、焦点回到触发卡片 |
| [results.json](results.json) | 每步 `scene / h1 / source / specs / quantity / total / disabled / panel / status / backRoute / focus / overflowX`，以及 `parity`、`errors` |

## 未覆盖 / 验证缺口

- 浏览器截图**不能**替代真实 Android 大屏 / WebView 触摸、对比度与读屏器实机验收（`design.md` §7）；本轮只截横屏 1600×900。
- 交互证据来自一次性 WebDriver 驱动脚本，未入库为可重复执行的浏览器测试；`npm test` 覆盖的是 Fake DOM 层的结构与状态断言。
- M02 详情数据是同步本地示例，不存在真实网络加载 / 失败态；未补详情的商品与未知商品 id 已覆盖「不可用 / 找不到」状态，但真实详情服务接入后仍需补异步加载、失败与重试。
- 真实商家、库存、配送时效、运费规则、售后政策与支付均**未接入**；「礼盒装无货」只是显式示例状态，不代表任何真实库存。
- 商品详情只为一个样例商品提供了完整资料；其它商品是同一路由下的诚实「资料未补充」状态。
- 字体为本环境 Noto Sans/Serif CJK SC，与目标设备实际字体（苹方 / 宋体）可能有细微差异。
- 合并、验收、关闭 Issue、环境晋级与下张卡派工均需维护者另行授权。
