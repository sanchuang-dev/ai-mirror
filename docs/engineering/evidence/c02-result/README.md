# AI 趣玩 C02（作品结果 + 私密保存 + 主动分享确认）· 验收证据（Issue #12）

> 采集日期：2026-10-19 · 基线：`dev` @ `d96e8442269aaff226bd2fbf5ab4721417a2ce6a`（C01 #47）
> 采集环境：本 Worker runner，Chromium 155（`--headless=new`）+ 一次性 CDP 客户端（按组织 browser-verification Skill，**不入库**），安装 `fonts-noto-cjk` 渲染中文。
> 这些是**评审证据快照**，不是产品源码；源码见 [`web/`](../../../../web/)，视觉契约见 [`design.md`](../../../../design.md)，主题 Token 见 [`web/assets/tokens.css`](../../../../web/assets/tokens.css)。
> 本卡只交付「预生成示例作品结果 → 默认私密保存 → 选分享对象 → 二次确认 / 取消」与公共设备上的诚实体验；**不接入真实模型、不上传、不伪造真实发送或网络回执、不持久化**。

## 交付内容

- 首页「随手玩点新花样」进入的 C01 在点「模拟生成」后，直接把**不含私有媒体**的最少演示数据交接给新的 **C02 作品结果**场景（`create-result` 路由），正文在 [`web/pages/creation-result.js`](../../../../web/pages/creation-result.js)。
- 一条代表性结果流程、单套 DOM、单套状态：**可见的预生成示例作品 → 默认仅自己可见 → 保存（本机演示）→ 选分享对象 → 二次确认或取消 → 再做一次 / 返回创作 / 放弃**。示范主题为 **AI 写真**，其余主题（老照片修复 / 写福字 · 书画 / 人生故事）共用同一套结果结构与逻辑，只换预生成示例画面。
- **隐私与诚实边界**：
  - 作品结果始终是**公开授权的预生成示例画面**，页面显眼标注「预生成示例作品 · 非真实 AI 生成」+ 图内水印；不拿用户私有媒体伪造生成结果。
  - 作品**默认仅自己可见**；保存只在本次页面演示里标记「已保存」，**不上传、不写本机存储、不跨设备同步**。
  - 分享对象是**虚构演示联系人**；必须**二次确认**后才更新页面上的演示态可见范围，且明确「没有真实发送，也没有网络回执」；取消 / 未确认不改变私密状态、不发送任何消息。
- **C01 → C02 交接**只经 [`web/data/creation-draft.js`](../../../../web/data/creation-draft.js)（**仅内存、刷新即消失**），只承载主题 id / 主题名 / 来源类别 / 示例素材名；**不含**本机图片字节、`blob:` 对象地址或本机文件名，也不写 localStorage / sessionStorage / 日志。
- **公共设备诚实体验**：G00 公共服务首页新增「AI 趣玩 · 公共体验」示例（[`web/pages/public.js`](../../../../web/pages/public.js) + [`web/data/fixtures/public.fixture.js`](../../../../web/data/fixtures/public.fixture.js) 的 `guestAi`），只展示本次页面会话的虚构样本，并提供显眼的「结束体验并清除」操作与反馈；不进入私人作品 / 分享空间，也清不掉别人的东西。
- 数据出口：[`web/data/fixtures/creation-result.fixture.js`](../../../../web/data/fixtures/creation-result.fixture.js) + [`web/data/api.js`](../../../../web/data/api.js) 的 `getCreationResultContent()`；路由接线只在 [`web/assets/app.js`](../../../../web/assets/app.js)（`create-result` 入 `NAVIGABLE_ROUTES` + 一个 `bodyFor` 分支，且**不复用缓存**，每次进入都按最新交接数据重建）。

## 复现命令

```bash
npm ci --no-audit --no-fund
npm run check      # ESLint + Prettier + tsc(checkJs,strict) + node --check + node --test
npm run preview    # http://127.0.0.1:4173/
```

浏览器关键路径与 A/B 截图经一次性 CDP 客户端完成（按 browser-verification Skill **不入库**）：
`?dir=a` → 点 `[data-route="create"]` → 选主题 → 逐步入素材 / 预览 → 点 `[data-action="generate"]` →
读 C02 `create-result`：示例图 `naturalWidth`、`[data-scope="visibility"]` 文案、点 `[data-action="save"]` 反馈、
点 `[data-contact]` 触发二次确认 → 点 `[data-action="cancel-share"]` 验证仍私密 → 再选对象点 `[data-action="confirm-share"]` 验证只更新演示态可见范围 →
点 `[data-action="unshare"]` → 点 `[data-action="restart"]` 验证回到 C01 第 1 步并清空选择；另 `?device=public` 验证公共体验与清除。
全程收集 `Runtime.exceptionThrown` / `Runtime.consoleAPICalled(error)` / `Log.entryAdded(error)` 与网络请求。原始断言结果见 [`results.json`](results.json)。

## 结果

- **质量门禁**：`npm ci --no-audit --no-fund && npm run check` 真实执行、退出码 0；Node 测试器 **86/86** 通过（既有 74 项未删除、未弱化；新增 12 项：C02 结果页 8 项、公共体验 3 项、C01 流程 1 项）。lint / format / typecheck / `node --check` 全部通过。
- **结果与诚实标注（验收 1）**：C01「模拟生成」直接进入 `create-result`；页面出现可见且**已加载**的示例图（`naturalWidth=1280`，非空白），并显示「预生成示例作品 · 非真实 AI 生成」角标与图内水印；「来自你的选择：主题「AI 写真」 · 示例素材 · 客厅合影」证明输入已抵达结果。
- **默认私密与保存（验收 2）**：初始 `[data-scope="visibility"]` 为「默认仅自己可见（未公开）」；点保存后反馈「已保存到我的作品（本机演示）：没有上传，也不会跨设备同步。」，**不产生任何网络上传请求**。
- **分享二次确认（验收 3）**：点某个联系人后出现二次确认「再确认一次 · 确认要分享给「小敏」吗？…」；点「取消」→「已取消分享：作品仍仅自己可见，没有发送任何消息。」；再选对象点「确认分享」→ 只显示「模拟已分享给 老李（演示）」+「可见范围：仅「老李」可见（演示）」+「S1 演示：没有真实发送，也没有网络回执。」，并可用「取消分享，恢复仅自己可见」。CDP 对 `globalThis.fetch` 的探针证明全程 0 次外发。
- **简单路径（验收 4）**：`再做一次` 回到 C01 第 1 步（`data-step=theme`）并清空上一轮选择；`返回创作` 回到 C01 当前步骤；`放弃这次创作` 丢弃交接数据并回首页。
- **A/B 单套 DOM（design.md §4）**：A 可读，切到 B「暖夜剧场」只改根 `data-dir`，**同一套结果 DOM 与文案、同一标注**，保存 / 分享演示状态保留；无 `a-*` / `b-*` 分叉。全套类名均为 `jq-`。
- **公共设备（验收 5）**：`?device=public` 进入 G00，出现「AI 趣玩 · 公共体验」示例（图已加载、「预生成示例作品 · 非真实 AI 生成」）与显眼「结束体验并清除」；点后反馈「本次公共体验的示例已清除，没有保存、没有保留任何内容。」；公共壳仍把 `create` / `create-result` 强制留在 `public`，**不能从公共意外进入私人空间**。
- **无 JS 错误 / 无外发**：`Runtime.exceptionThrown` / `console.error` / `Log.entryAdded(error)` 为空；网络请求全部为本机 `127.0.0.1:4173` 静态资源，无外部域名、无上传 / `blob:` 请求（偶发 `/favicon.ico` 404 为本机静态缺省，非功能错误）。

## 截图（均真实视口 1600×900）

| 文件 | 内容 |
| --- | --- |
| [c02-result-a.png](c02-result-a.png) | C02 结果页 A：预生成示例作品 + 「非真实 AI 生成」标注 + 默认仅自己可见 + 保存（本机演示）+ 虚构演示联系人 + 再做一次 / 返回创作 / 放弃 |
| [c02-result-b.png](c02-result-b.png) | B「暖夜剧场」下同一套结果 DOM，主题切换不重建、标注与边界不变 |
| [c02-share-confirm-a.png](c02-share-confirm-a.png) | 选中「小敏」后的二次确认卡（确认分享 / 取消） |
| [c02-shared-a.png](c02-shared-a.png) | 确认后的模拟分享结果：只更新演示态可见范围，无真实发送 / 网络回执，并提供取消分享 |
| [c02-public-guest-a.png](c02-public-guest-a.png) | G00 公共终端「AI 趣玩 · 公共体验」示例 + 「结束体验并清除」 |
| [c02-public-cleared-a.png](c02-public-cleared-a.png) | 公共体验清除后的反馈：没有保存、没有保留任何内容 |

## 未覆盖 / 验证缺口

- 浏览器截图**不能**替代真实 Android 大屏 / WebView 触摸、对比度与读屏器实机验收（`design.md` §7）。
- 交互证据来自一次性 CDP 客户端，未入库为可重复执行的浏览器测试；`npm test` 在 Fake DOM 层断言结构与状态（含「确认分享不发起请求」「结果页不写存储」）。
- **无真实模型**：作品画面全部是公开授权示意图；未验证真实生成链路、生成时延与失败态（本卡明确不做）。
- **无真实分享通道**：没有后端、没有社交 / 消息接入，确认分享只改页面演示态；未验证真实发送、失败重试、撤回与服务端可见性策略（属 S2/S3）。
- 公共体验只覆盖「本次会话展示 + 结束清除」；公共设备上的真机复位策略（如超时自动清除）仍需后续卡确认。
- 字体为 Noto Sans/Serif CJK SC，与目标设备实际字体（苹方 / 宋体）可能有细微差异。
