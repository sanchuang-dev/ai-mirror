# T03 既有视频 / AI / 课程 / 公共场景共享主题壳与导航状态 · 验收证据（Issue #8）

> 采集日期：2026-10-17 · 基线：`dev` @ `dc6053d70a8e406d6a0ff151a7f18b2dd6b3cfdf`
> 采集环境：本 Worker runner，Chromium 155（`--headless=new`）+ ChromeDriver WebDriver，安装 `fonts-noto-cjk` 渲染中文，视口 1600×900。
> 这些是**评审证据快照**，不是产品源码；源码见 `web/`，视觉契约见 [`design.md`](../../../design.md)，主题 Token 见 [`web/assets/tokens.css`](../../../../web/assets/tokens.css)。
> 本卡只交付「共享主题壳 + 模式导航 + 四个既有场景」，不扩建选集 / 购物 / 报名 / 创作等其它 Issue 的详情链，也不实现公共清屏 / 会话删除（X01 范围）。

## 交付内容

- 新增 [`web/components/app-shell.js`](../../../../web/components/app-shell.js)：**唯一**共享场景壳。H01 / V02 / A01 / E01 / G00 共用同一份顶栏、导航、演示主题控件、设置面板与入口反馈；主题只有一份状态（根元素 `data-dir`），切换主题不重建场景 DOM。
- 新增 [`web/components/kit.js`](../../../../web/components/kit.js)：共享 DOM 原语（`createNode` / `createRouteButton` / `createMedia` / `createProgress` / `createSectionHead`）。
- 新增 [`web/data/notices.js`](../../../../web/data/notices.js)：入口反馈文案唯一事实源；所有未接入入口都显式含「示例 / 演示」。
- 新增四个既有场景正文： [`web/pages/video.js`](../../../../web/pages/video.js)（V02 视频观看）、[`web/pages/ai.js`](../../../../web/pages/ai.js)（A01 AI 伙伴）、[`web/pages/course.js`](../../../../web/pages/course.js)（E01 数字人课程）、[`web/pages/public.js`](../../../../web/pages/public.js)（G00 公共服务首页），及对应 fixtures。
- [`web/assets/app.js`](../../../../web/assets/app.js) 改为装配单一共享壳的 [`mountApp`](../../../../web/assets/app.js)，用 `feat/worker-*` 验证导航：正文首次进入即缓存，导航返回原样复用，切主题只改根标记，因此场景状态不被重置。
- 个人 / 公共是两个显式模式：公共顶栏**不**渲染个人姓名、设置入口、AI 常驻入口；公共场景不含私人聊天 / 记忆入口或用户订单。个人已保存主题偏好仍按 T02 生效。
- 未引入框架 / 打包器；未携带原型调试球、`scale()` 或 A/B 两份 DOM；未改动 `design.md` 与 OpenDesign 原型。

## 复现命令

```bash
npm ci --no-audit --no-fund
npm run check      # ESLint + Prettier + tsc(checkJs,strict) + node --check + node --test
npm run preview    # http://127.0.0.1:4173/
```

浏览器路径验证经 ChromeDriver（WebDriver，一次性驱动脚本，按 browser-verification 约束**不入库**）完成：
navigate `?dir=a|b` → 点顶栏 / 常驻入口进入场景 → 读取 `documentElement[data-dir]`、可见 `h1`、场景类名、个人 / 公共可见面、横向溢出、`browser` 日志，并逐场景截图；另验证「视频 → 返回首页」返回路径与「视频内展开小暖解说 → 切 B 主题仍保持」。

## 结果

- **质量门禁**：`npm ci --no-audit --no-fund && npm run check` 真实执行、退出码 0；Node 测试器 **33/33** 通过（既有 26 项未删除、未弱化；新增 7 项覆盖四场景导航、返回、模式隔离、主题保持与偏好优先级）。
- **四场景可达并可返回（验收 1）**：`[data-route="video|course|ai|public"]` 均为真实 `<button>`；进入后每场景恰好 1 个 `h1`，`⌃返回首页` / 公共顶栏`‹ 返回家庭版` 回到 `jq-home-body`。`returnPath.enteredVideo=true` 且返回后恢复首页。
- **主题一致生效、单套逻辑（验收 2）**：所有场景共用 `tokens.css` 的 A/B 变量；场景正文类名**全部**为 `jq-`，无 `a-*` / `b-*` 分叉，无元素携带 `data-dir`（主题只在根元素）。切换 A/B 后 `documentElement[data-dir]` 变化，场景元素引用**不变**（`sameBody=true`）。
- **状态不随主题 / 导航重置（验收 3、跟进点 2）**：视频场景展开「问问小暖」后切到 B，`noteOpen=true` 保持、`sameBody=true`、`h1` 不变；导航离开再返回仍是同一视频正文元素（本地选集 / 解说状态保留）。
- **个人 / 公共边界（验收 3、跟进点 2）**：公共模式 `user=false`、`settingsEntry=0`、`fabHidden=true`、`publicNote="本机为公共终端，不含个人内容"`，且页面不含个人姓名；返回个人模式后设置入口、用户块与 AI 入口恢复。公共场景报名 / 服务只给「示例 / 未接入」反馈。
- **不溢出 / 无 JS 错误（跟进点 4）**：各场景 `horizontalOverflow=false`（1600 视口）；`browser` 日志唯一 SEVERE 为浏览器自动请求 `/favicon.ico` 的 404，非应用脚本 / 样式 / 图片错误；无 `Runtime` 异常。
- **真实演示（跟进点 3）**：V02 标注「未接入真实播放器与真实剧集」、A01 标注「不是真实 AI 服务」且发送只回显用户输入、E01 标注「讲师形象与语音尚未真实接入」、G00 标注「公共终端示例演示」。素材全部复用仓库既有 OpenDesign 开放授权影像（署名见 [`web/assets/img/CREDITS.md`](../../../../web/assets/img/CREDITS.md)）。

## 截图（均真实视口 1600×757）

| 文件 | 内容 |
| --- | --- |
| [t03-home-a.png](t03-home-a.png) / [t03-home-b.png](t03-home-b.png) | H01 首页 A / B，顶栏新增「社区版 ›」正式入口 |
| [t03-video-a.png](t03-video-a.png) / [t03-video-b.png](t03-video-b.png) | V02 视频观看 A / B（播放器示例画面 + 选集 / 预告 / 看剧搭子） |
| [t03-ai-a.png](t03-ai-a.png) / [t03-ai-b.png](t03-ai-b.png) | A01 AI 伙伴 A / B（小暖存在感 + 对话流 + 示例卡片） |
| [t03-course-a.png](t03-course-a.png) / [t03-course-b.png](t03-course-b.png) | E01 数字人课程 A / B（三分法板书 + 换个讲法） |
| [t03-public-a.png](t03-public-a.png) / [t03-public-b.png](t03-public-b.png) | G00 公共服务首页 A / B（公共顶栏，无个人身份 / 设置） |
| [t03-video-return-home-a.png](t03-video-return-home-a.png) | 从视频场景经「返回首页」回到 H01 首页 |
| [t03-video-theme-switch-keeps-note.png](t03-video-theme-switch-keeps-note.png) | 视频内展开小暖解说后切到 B，解说仍展开 |
| [results.json](results.json) | 各场景读取的 `dir` / `h1` / 场景类名 / 个人公共可见面 / 溢出 / 控制台日志 |

## 未覆盖 / 验证缺口

- 浏览器截图**不能**替代真实 Android 大屏 / WebView 触摸、对比度与读屏器实机验收（`design.md` §7）。
- 交互证据来自一次性 WebDriver 驱动脚本，未入库为可重复执行的浏览器测试；`npm test` 只覆盖 Fake DOM 层的结构与状态断言。
- 公共清屏 / 会话删除属 X01，本卡未实现；公共设备默认主题与访客改主题权限仍未确定，公共模式不读取也不写入个人 `localStorage` 偏好。
- 公共模式未接入个人 `localStorage`；`?dir=` 仍是既有评审参数，个人已保存偏好优先。
- 字体为 Noto Sans/Serif CJK SC，与目标设备实际字体（苹方 / 宋体）可能有细微差异。
