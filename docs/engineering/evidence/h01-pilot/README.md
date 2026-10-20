# H01 试点验收证据（Issue #6）

> 采集日期：2026-10-17 · 基线：`dev` @ `2460535df78020eef1839fda5d560f49f10034d7` · 隔离分支 `feat/worker-*`
> 采集环境：本 Worker runner，Chromium 155（headless=new），系统安装 `fonts-noto-cjk`（Noto Sans/Serif CJK SC）渲染中文。
> 这些是**评审证据快照**，不是产品源码；页面源码见 `web/`，视觉契约见 [`design.md`](../../../design.md)，影像署名见 [`web/assets/img/CREDITS.md`](../../../../web/assets/img/CREDITS.md)。

## 本轮返工修正的三点

1. **影像恢复**：H01 的英雄剧照、节目推荐、社区活动、AI 趣玩画面全部改用**从 OpenDesign 原型（PR #1）原样复用的开放授权影像**（`web/assets/img/`，11 张），不再是整片 CSS 渐变占位；`alt` 一律以「示例画面：」开头，不冒充真实剧照。
2. **视口内反馈**：入口反馈改为固定在滚动区之外的轻提示 `jq-toast`（`role=status` + 可聚焦「关闭」按钮），从页面下方点「报名」/「问小暖」也立即可见，且不遮挡右下角固定入口；切主题不清空反馈。
3. **横屏验收**：两主题均在**真实 1600×900 视口**下截图并做点击回放（此前是 1600×1900 长截图）。

## 复现命令

```bash
npm ci --no-audit --no-fund
npm run check
npm run preview   # http://127.0.0.1:4173/

# 关键坑：headless=new 的 --window-size 含 87px 窗口预留。
# 直接 --window-size=1600,900 时视口只有 1600×813；要得到 1600×900 视口须用 987 并校验：
chromium --headless=new --no-sandbox --disable-gpu --window-size=1600,987 --virtual-time-budget=1500 \
  --dump-dom "data:text/html,<script>document.documentElement.textContent=innerWidth+'x'+innerHeight</script>"
# → 1600x900
```

截图与点击回放经 Chrome DevTools Protocol 完成（runner 无 Playwright，Node 22 内置 WebSocket 直连
`/json/new` 与 `/json/list` 返回的 `webSocketDebuggerUrl`）：`Page.captureScreenshot` 出图、
`Runtime.evaluate` 点击与读取 `getBoundingClientRect()`、`Input.dispatchKeyEvent` 验证键盘关闭、
`Runtime.exceptionThrown` / `Runtime.consoleAPICalled` / `Log.entryAdded` / `Network.responseReceived`
收集 JS 与资源错误。该一次性客户端按 browser-verification 约束**不入库**，命令与结果完整记录于本文。

## 结果

- **质量门禁**：`npm ci --no-audit --no-fund && npm run check` 真实执行，退出码 0（ESLint、Prettier、`tsc --strict`、`node --check`、Node 测试器 11 项全过）。既有测试未删除、未弱化；新增 4 项回归覆盖影像引用、提示可见位置、可关闭与切主题不丢状态。
- **单套 DOM（验收 1）**：A 与 B 的 `#app` 序列化 DOM **逐字符一致**，唯一差异是两个演示主题按钮的 `aria-pressed`；`data-route` 节点 31 vs 31，`main.jq-home` 1 个，`h1` 1 个。主题切换只改根元素 `data-dir` 与 `tokens.css` 变量。
- **视觉继承（验收 2）**：A「日光客厅」图文并排英雄区、竖版海报轨、宋体大标题、浅色杂志式；B「暖夜剧场」英雄剧照铺满并压文案、横版续看卡、暖金强调、深色沉浸。差异全部来自 `tokens.css` 的主题变量（留白、画面比例、遮罩、影像处理）与同一套组件样式，无第三套主题、无后台卡片大厅化。
- **影像（返工 1）**：17 个 `<img>` 全部 `complete && naturalWidth > 0`，无破图；来源为 PR #1 的开放授权素材，署名随 `web/assets/img/CREDITS.md` 一起维护。
- **滚动后点击回放（返工 2）**：两主题各自滚动到活动区（`scrollTop` 1329 / 1142）后点「报名」，提示立即出现且矩形完全在 1600×900 视口内（`top 802 → bottom 876`），与右下角「问问小暖」（`left 1436`）**无重叠**；再点固定 AI 入口反馈更新为 AI 示例文案。
- **键盘 / 读屏（返工 2）**：`role=status` 节点文本与提示一致，`aria-live="polite"`；关闭按钮可聚焦，回车触发关闭（`hidden` 变 `true`）且已发生的反馈文案保留在状态中。
- **主题切换不破坏状态（验收 3）**：A→B、B→A 各执行一次：`data-dir` 切换、`aria-pressed` 正确、提示仍可见且文案不变、业务 DOM 不变。
- **无 JS 错误**：两主题 `Runtime.exceptionThrown` 与 `console.error` 均为空；唯一 404 是浏览器自动请求的 `/favicon.ico`（非应用脚本错误），无 `Network.loadingFailed`。

## 截图（均 1600×900 真实视口）

- `theme-a-daylight-living.png` — A · 日光客厅首屏
- `theme-b-warm-night.png` — B · 暖夜剧场首屏
- `theme-a-signup-feedback.png` — A · 滚动到活动区并点「报名」后的视口内提示
- `theme-b-signup-feedback.png` — B · 同上

两主题内容层级、区块顺序与入口完全一致，差异在留白、英雄区图文关系、画面比例、影像遮罩/处理、字体与色彩，符合 `design.md` §4「一套页面、两套主题」。

## 未覆盖 / 验证缺口

- 浏览器截图**不能**替代真实 Android 大屏 / 横竖屏 / WebView 触摸与对比度实机验收（`design.md` §7）。
- 除 H01 之外的业务路由尚未实现；页面只给出示例反馈，不代表真实内容 / AI / 交易 / 报名服务。
- runner 无 Playwright：交互证据来自一次性 CDP 客户端，未入库为可重复执行的测试脚本；`npm test` 只能覆盖 Fake DOM 层的结构与状态断言。
- 字体为 Noto Sans/Serif CJK SC，与目标设备实际字体（苹方 / 宋体）可能有细微差异。
- 影像为开放授权的氛围示意图，正式商用前须逐张复核署名与衍生授权。
