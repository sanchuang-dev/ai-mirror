# L01-A 本地活动与福利目录 · 证据（Issue #13）

> 采集日期：2026-10-19 · 基线：`dev` @ `4576caad46cbb4e1c3ad72792773af34723627ba`
> 采集环境：本 Worker runner，Chromium 155（`--headless=new`，ChromeDriver 155 WebDriver），安装 `fonts-noto-cjk` 渲染中文，窗口 1600×900（视口 1600×757）。
> 这些是**评审证据快照**，不是产品源码；源码见 [`web/`](../../../../web/)，视觉契约见 [`design.md`](../../../../design.md)，主题 Token 见 [`web/assets/tokens.css`](../../../../web/assets/tokens.css)。
> 本卡只交付 L01-A 目录；活动详情与公共 G00 入口归 [L01-B #49](https://github.com/sanchuang-dev/ai-mirror/issues/49)，报名 / 手机接力归 [L02 #14](https://github.com/sanchuang-dev/ai-mirror/issues/14)。

## 交付内容

- 新增 [`web/data/fixtures/activities.fixture.js`](../../../../web/data/fixtures/activities.fixture.js)：**唯一一份** L01 示例数据（`全部 / 活动 / 福利` 分类 + 6 条示例，含稳定 `id`、类别、名称、示例时间 / 地点 / 区域 / 条件 / 提供方 / 价格、示意图与检索关键词）。所有提供方标注「虚构示例」，价格标注「免费（示例）」或「示例价」。
- 新增 [`web/pages/activities.js`](../../../../web/pages/activities.js)：单套 DOM 的目录正文（分类切换、关键词筛选、命中计数、空状态与「清除筛选」恢复路径、详情/报名的诚实提示）。
- [`web/data/api.js`](../../../../web/data/api.js)：新增 `getActivityContent()`；`getHomeContent()` 改为在首页 fixture 之上组合 L01 活动条目，首页与目录共用同一批活动，不再维护第二份活动数据。
- [`web/data/fixtures/home.fixture.js`](../../../../web/data/fixtures/home.fixture.js)：移除首页自带的第二份 `activities`（`HomeContent = HomeFixture & { activities }`）。
- [`web/pages/home.js`](../../../../web/pages/home.js)：H01「家门口的活动」卡片画面/标题进入目录；「报名」改为进入目录（L02 未接入，不显示报名成功）。
- [`web/assets/app.js`](../../../../web/assets/app.js)：`activity` 成为正式可导航路由，接入共享场景壳；公共设备模式仍被 `deviceMode === 'public'` 边界拦在 G00。
- [`web/data/notices.js`](../../../../web/data/notices.js)：`activity` 入口文案更新为 L01-A 示例目录 + L01-B / L02 未接入说明。
- [`web/assets/components.css`](../../../../web/assets/components.css)：只补目录卡事实列表与首页活动卡入口样式；颜色 / 留白全部来自 `tokens.css`，无 `a-*` / `b-*` 页面类。

### 边界（按 Issue 收窄后的合同）

- **不做**活动详情页、公共 G00 接线、L02 报名确认 / 手机接力 / 二维码 / 核销。
- 详情按钮显示「详情（L01-B 待接入）」，点击后只给出「详情页将由 L01-B 衔接；报名（L02）尚未接入，不会产生报名凭证」的说明，不伪造详情或报名成功。
- 不接真实活动 / 合作方 API、地图定位、库存、支付、账户或后台；不出现剩余名额、距离 / 步行分钟或真实定位。

## 复现命令

```bash
npm ci --no-audit --no-fund
npm run check      # ESLint + Prettier + tsc(checkJs,strict) + node --check + node --test
npm run preview    # http://127.0.0.1:4173/
```

浏览器交互与截图经一次性 ChromeDriver（WebDriver）脚本驱动（按 browser-verification 约束**不入库**）：
`?dir=a|b` 打开 → 滚到「家门口的活动」→ 点「全部」进目录 → 切「福利」→ 切「活动」→ 筛选「太极」（命中）→ 切「福利」（不匹配空状态）→「清除筛选」→「‹ 返回首页」→ 点首页活动卡画面进目录 → 点「详情（L01-B 待接入）」，每步读取状态并截图。

## 结果

- **质量门禁**：`npm ci --no-audit --no-fund && npm run check` 真实执行、退出码 0；Node 测试器 **93/93** 通过（既有测试未删除、未弱化；新增 7 项覆盖 fixture 示例标注 / 稳定 id、分类切换、关键词命中与空状态恢复、详情诚实提示、H01 → 目录路由、公共设备隔离）。
  - 两处既有测试只改了「点击哪个入口」：`tests/home.test.mjs` 与 `tests/settings.test.mjs` 原来点击 `data-route="signup"` 的「报名」以验证 Toast，现按 L01-A 改为点击仍会产生诚实提示的入口（`activity` / `favorite`），断言（Toast 可见、文案含「示例 / 演示」、DOM 与滚动区不重建）保持原样。
- **验收 1（H01 → 目录；分类真实改变列表）**：A/B 两主题均 `homeVisible=true` → 点「活动」后 `scene=jq-scene--activities`、`h1=本地活动与福利`、`pressedCategory=all`、6 张卡；切「福利」→ `cards=[liangxueya, lifa, shoujike]`、计数「『福利』共 3 条示例」；切「活动」→ `cards=[taiji, chayi, dubao]`、计数「『活动』共 3 条示例」。
- **验收 2（筛选命中 / 空状态 / 恢复）**：筛选「太极」（分类「活动」）→ `state=ok`、`cards=[taiji]`、「在『活动』里找到 1 条与『太极』相关的示例」；再切「福利」→ `state=empty`、`cards=[]`、「『福利』里没有找到与『太极』相关的示例」；点「清除筛选」→ `state=ok`、`pressedCategory=all`、6 张卡恢复。
- **验收 3（示例标注 / 不伪称详情与报名）**：每张卡带「活动 · 示例」或「福利 · 示例」徽标；提供方为「…（虚构示例）」、价格为「免费（示例）」/「示例价 ¥5」；点「详情（L01-B 待接入）」只出现「《晨练太极》的详情页将由 L01-B 衔接；当前只有示例目录，报名（L02）也尚未接入，不会产生报名凭证。」，页面无「报名成功 / 已报名」文案。
- **A/B 共享 DOM**：两主题同一状态推进下 `cards` / `count` / `stateTitle` 完全一致，页面无 `data-dir` 分叉、无 `a-*` / `b-*` 页面类；主题只改根标记与 Token。
- **无溢出 / 无 JS 错误**：所有步骤 `horizontalOverflow=false`；A/B 两主题 `window.onerror` 收集结果均为空数组。

## 截图（真实视口 1600×757）

| 文件                                                                                                                                    | 内容                                                                                                                                       |
| --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| [l01-home-activity-section-a.png](l01-home-activity-section-a.png) / [l01-home-activity-section-b.png](l01-home-activity-section-b.png) | H01「家门口的活动」：卡片画面/标题进目录，「报名」进目录 A / B                                                                             |
| [l01-directory-a.png](l01-directory-a.png) / [l01-directory-b.png](l01-directory-b.png)                                                 | 目录「全部」：6 条示例、分类高亮、示例徽标 A / B                                                                                           |
| [l01-welfare-a.png](l01-welfare-a.png)                                                                                                  | 分类切到「福利」：3 条福利示例                                                                                                             |
| [l01-cards-a.png](l01-cards-a.png)                                                                                                      | 目录卡事实列表（时间 / 地点 / 区域 / 条件 / 提供方 / 价格）与「详情（L01-B 待接入）」                                                      |
| [l01-hit-a.png](l01-hit-a.png) / [l01-hit-b.png](l01-hit-b.png)                                                                         | 筛选「太极」命中 1 条 A / B                                                                                                                |
| [l01-miss-a.png](l01-miss-a.png) / [l01-miss-b.png](l01-miss-b.png)                                                                     | 「福利」+「太极」不匹配的空状态与「清除筛选」A / B                                                                                         |
| [l01-home-a.png](l01-home-a.png)                                                                                                        | H01 首屏（入口上下文）                                                                                                                     |
| [results.json](results.json)                                                                                                            | 两主题每个交互步骤的 `scene / state / pressedCategory / cards / count / stateTitle / feedback / homeVisible / horizontalOverflow / errors` |

## 未覆盖 / 验证缺口

- 浏览器截图**不能**替代真实 Android 大屏 / WebView 触摸、对比度与读屏器实机验收（`design.md` §7）；本轮只截横屏 1600×900。
- 交互证据来自一次性 WebDriver 驱动脚本，未入库为可重复执行的浏览器测试；`npm test` 覆盖的是 Fake DOM 层的结构与状态断言。
- 字体为本环境 Noto Sans/Serif CJK SC，与目标设备实际字体（苹方 / 宋体）可能有细微差异。
- 活动详情（L01-B #49）与公共 G00 入口、报名（L02 #14）**未实现**，按合同留给后续卡；本卡不宣称已完成。
- 合并、验收、关闭 Issue、环境晋级与下张卡派工均需维护者另行授权。
