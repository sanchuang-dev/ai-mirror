# M01 平台商城首页 · 证据（Issue #15）

> 采集日期：2026-10-19 · 基线：`dev` @ `4f1b204dd4ef4e46ae4804275767a45765c2eb37`（工作树实现）
> 采集环境：本 Worker runner，Chromium 155（`--headless=new`，ChromeDriver 155 WebDriver），安装 `fonts-noto-cjk` 渲染中文，窗口 1600×900（视口 1600×757）。
> 这些是**评审证据快照**，不是产品源码；源码见 [`web/`](../../../../web/)，视觉契约见 [`design.md`](../../../../design.md)，主题 Token 见 [`web/assets/tokens.css`](../../../../web/assets/tokens.css)。
> 本卡只交付 M01 商城首页；商品详情（含规格 / 运费 / 履约 / 售后）归 [M02 #16](https://github.com/sanchuang-dev/ai-mirror/issues/16)，购物车与订单确认归 [M03 #17](https://github.com/sanchuang-dev/ai-mirror/issues/17)。
> **后续变更（M02 #16）**：AI 商品卡已改为直接进入统一 `product:blood-pressure` 详情路由；本文件保留为 M01 当次验收的历史证据。

## 交付内容

- 新增 [`web/data/fixtures/shop.fixture.js`](../../../../web/data/fixtures/shop.fixture.js)：**唯一一份** M01 示例数据（平台精选、`全部 / 生活好物 / 作品制作 / 本地服务 / 会员权益` 五类目、4 家入驻店铺（来源）、9 件示例商品；含稳定 `id` / `storeId`、示例价格与检索关键词）。店铺名一律标注「虚构示例 / 平台自营示例」，价格一律标注「示例价 / 示例权益」。
- 新增 [`web/pages/shop.js`](../../../../web/pages/shop.js)：单套 DOM 的商城首页正文（平台精选区、类目切换、店铺来源筛选、关键词筛选、命中计数、加载 / 无结果 / 失败状态与恢复路径、商品详情入口）。
- [`web/data/api.js`](../../../../web/data/api.js)：新增 `getShopContent()` 与异步 `searchShopProducts({ keyword, category, store })`；类目、店铺与关键词是**组合筛选**，返回结果与高亮条件永远一致。
- [`web/assets/app.js`](../../../../web/assets/app.js)：`shop` 成为正式可导航路由并接入共享场景壳；从首页或 AI 商品卡进入时，商城「返回」按钮按实际来源回到对应场景（`setShopReturnRoute`）。公共设备模式仍被 `deviceMode === 'public'` 边界拦在 G00。
- [`web/data/fixtures/ai.fixture.js`](../../../../web/data/fixtures/ai.fixture.js) + [`web/pages/ai.js`](../../../../web/pages/ai.js)：AI 商品卡（上臂式电子血压计）的「去平台商城看看」进入 M01；活动卡的示例按钮行为不变。
- [`web/data/notices.js`](../../../../web/data/notices.js)：`shop` 入口文案更新为「M01 示例目录 + M02 / M03 未接入」。
- [`web/assets/components.css`](../../../../web/assets/components.css)：只补商城浏览所需的内容卡、店铺来源卡与详情入口样式；颜色 / 留白全部来自 `tokens.css`，无 `a-*` / `b-*` 页面类。
- 新增 [`tests/shop.test.mjs`](../../../../tests/shop.test.mjs)：13 项覆盖 fixture 示例标注与稳定 id、组合筛选（类目 / 店铺 / 关键词）、加载与失败状态、详情入口的 M02 边界、首页与 AI 两条入口、公共设备隔离、CSS 主题安全。

### 边界（按 Issue #15 收口）

- **不做**商品详情页（规格 / 数量 / 运费 / 可送达区域 / 履约方 / 售后），只在列表打开「商品详情入口」并明确「商品详情页由 M02 接入；当前不能加入购物车、下单或付款」。
- **不做**购物车、订单确认与支付（M03）；页面内不存在「加入购物车」「去结算」等假动作。
- 不开发店铺入驻后台、不接真实商品 / 库存 / 营销算法、不外链其它电商；不编造库存、销量、评分或限时抢购。
- 不重画 H01 首页、不新增第三套视觉；仅复用既有 `jq-` 组件与 OpenDesign 授权素材（`web/assets/img/CREDITS.md`），影像 `alt` 一律标注「示例画面」。

## 复现命令

```bash
npm ci --no-audit --no-fund
npm run check      # ESLint + Prettier + tsc(checkJs,strict) + node --check + node --test
npm run preview    # http://127.0.0.1:4173/
```

浏览器交互与截图经一次性 ChromeDriver（WebDriver）脚本驱动（按 browser-verification 约束**不入库**）：
`?dir=a|b` 打开 → 顶栏「商城」进 M01 → 切「生活好物」→ 选店铺「云栖优选生活馆」→ 筛选「茶具」（组合空状态）→「清除筛选」→ 打开「上臂式电子血压计」详情入口 →「返回商品列表」→「返回首页」→ 进 AI 场景点商品卡「去平台商城看看」→ 商城「返回小暖」；B 主题再走「作品制作」/ 空状态 / 详情入口，每步读取状态并截图。

## 结果

- **质量门禁**：`npm ci --no-audit --no-fund && npm run check` 真实执行、退出码 0；Node 测试器 **106/106** 通过（既有 93 项未删除、未弱化；新增 13 项）。`typecheck`（`checkJs` + `strict`）与 `format:check` 均通过。
- **验收 1（入口 / 类目 / 店铺来源 / 示例商品）**：A/B 两主题从首页顶栏「商城」进入 `jq-scene--shop`，`h1=平台商城`、`h1Count=1`；`平台精选` 固定 2 件；默认 `state=ok`、`pressedCategory=all`、`pressedStore=all`、9 件示例商品；每张卡都显示「入驻商家 · …（虚构示例）」与「<类目> · 示例」。AI 场景商品卡按钮文字「去平台商城看看」进入同一 M01，返回按钮变为「‹ 返回小暖」且确实回到 AI 场景。
- **验收 2（类目 / 无结果 / 加载 / 失败不是空壳，可返回源页面）**：A 主题「生活好物」+「云栖优选生活馆」→ 2 件商品且店铺行全部为该店铺；保持该组合筛选「茶具」→ `state=empty`，标题写出「『生活好物』·『云栖优选生活馆（虚构示例）』里没有找到与『茶具』相关的示例商品」，「清除筛选」恢复 9 件。B 主题「作品制作」+「查无此商品zzz」→ 同样的可见空状态。加载与失败状态由 `tests/shop.test.mjs` 注入 pending / reject 数据出口真实触发并断言（`loading → ok`、`error → 重试 → ok`），真实预览里适配器在同一微任务内完成，无法稳定截图，见「未覆盖 / 验证缺口」。商城「‹ 返回首页」把场景交还 H01，M01 场景被缓存复用。
- **验收 3（两主题一套结构 + 开放设计内容视觉）**：两主题同一状态推进下 `products` / `count` / `stateTitle` 完全一致（`parity.sameProductList=true`，9 件商品；`aFeatured=bFeatured=2`）；页面无 `data-dir` 分叉、无 `a-*` / `b-*` 页面类；结构为平台精选 + 类目 + 店铺来源 + 商品列表，未出现后台统计卡片或外部电商跳转。
- **无溢出 / 无 JS 错误**：A/B 所有步骤 `overflowX=false`；ChromeDriver browser log 过滤 `SEVERE` / `WARNING` 后为空数组。

## 截图（真实视口 1600×757）

| 文件 | 内容 |
| --- | --- |
| [m01-home-a.png](m01-home-a.png) / [m01-home-b.png](m01-home-b.png) | H01 首页入口上下文（顶栏「商城」）A / B |
| [m01-shop-all-a.png](m01-shop-all-a.png) / [m01-shop-all-b.png](m01-shop-all-b.png) | M01「平台精选」+ 商城首页 A / B |
| [m01-category-daily-a.png](m01-category-daily-a.png) | 类目 / 关键词筛选控件与店铺来源卡（含「生活好物」命中 2 件） |
| [m01-category-craft-b.png](m01-category-craft-b.png) | B 主题「作品制作」类目 3 件示例商品 |
| [m01-empty-store-keyword-a.png](m01-empty-store-keyword-a.png) | 「生活好物」+「云栖优选生活馆」+「茶具」组合空状态与「清除筛选」 |
| [m01-empty-keyword-b.png](m01-empty-keyword-b.png) | B 主题关键词无结果状态 |
| [m01-detail-a.png](m01-detail-a.png) / [m01-detail-b.png](m01-detail-b.png) | 商品详情入口（店铺 / 类目 / 示例价格 + M02 未接入边界）A / B |
| [m01-ai-entry-shop-a.png](m01-ai-entry-shop-a.png) | 从 AI 商品卡进入 M01，「返回小暖」来源路径 |
| [results.json](results.json) | 两主题每个交互步骤的 `scene / state / pressedCategory / pressedStore / products / count / stateTitle / detailOpen / backRoute / storeLines / overflowX`，以及 `parity` 与 browser log |

## 未覆盖 / 验证缺口

- 浏览器截图**不能**替代真实 Android 大屏 / WebView 触摸、对比度与读屏器实机验收（`design.md` §7）；本轮只截横屏 1600×900。
- 交互证据来自一次性 WebDriver 驱动脚本，未入库为可重复执行的浏览器测试；`npm test` 覆盖的是 Fake DOM 层的结构与状态断言。
- **M01 加载 / 失败状态**在真实预览中因示例适配器同步完成（微任务）而无法稳定截图；已由 `tests/shop.test.mjs` 注入 pending / reject 出口真实触发。真实后端接入后应以真实网络状态复核。
- 字体为本环境 Noto Sans/Serif CJK SC，与目标设备实际字体（苹方 / 宋体）可能有细微差异。
- 商品详情（M02 #16）、购物车与订单确认（M03 #17）**未实现**，按合同留给后续卡；本卡不宣称已可下单或支付。
- 合并、验收、关闭 Issue、环境晋级与下张卡派工均需维护者另行授权。
