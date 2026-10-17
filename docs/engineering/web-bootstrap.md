# 见趣 ENG-02 · 最小 Web 工程启动说明

工作项：[Issue #5](https://github.com/sanchuang-dev/ai-mirror/issues/5)。本任务实现 [ENG-01 工程基线](frontend-baseline.md)，只提供开发骨架；H01 个人首页试点见 [Issue #6](https://github.com/sanchuang-dev/ai-mirror/issues/6)。当前只有 H01 首页，**不是完成的闺蜜机 UI**。

## 从新检出到本地运行

使用 Node.js **22 LTS**（CI 固定 22）和 npm，唯一锁文件为 `package-lock.json`。

1. `npm ci --no-audit --no-fund`：从锁文件安装校验工具。
2. `npm run preview`：在 `http://127.0.0.1:4173/` 预览真实 `web/index.html`。
3. `npm run check`：依次执行 ESLint、Prettier、JS+JSDoc 类型检查、原生语法检查和 Node 内建测试器。

可单独运行 `npm run lint`、`npm run format:check`、`npm run typecheck`、`npm run syntax`、`npm test`，用于定位失败。

**零构建**：`web/` 即可由静态服务提供，不安装运行时框架，不生成 `dist/`。所以**不设置虚假的 `npm run build`**。本地预览服务器监听 `127.0.0.1`，不能用于生产部署。

## 文件与职责

| 位置 | 职责 |
| --- | --- |
| `web/index.html` | 唯一正式前端入口 |
| `web/assets/tokens.css` | 从 `design.md`、OpenDesign CSS 逐项提取的 A/B 颜色与字体（主题唯一事实源） |
| `web/assets/base.css` | 重置与基础排版 |
| `web/assets/components.css` | H01 首页组件样式（`jq-` 前缀，不按 A/B 分叉页面） |
| `web/assets/app.js` | 可测试的原生 ES Module 入口，挂载 H01 |
| `web/pages/home.js` | H01 个人首页：单套语义 DOM、单一事件与主题切换逻辑 |
| `web/assets/img/` | 复用 OpenDesign 原型（PR #1）的开放授权示例影像；署名与授权见同目录 `CREDITS.md` |
| `web/data/api.js` | 数据访问唯一出口（ENG-01 §4） |
| `web/data/fixtures/*.fixture.js` | 显式命名的示例数据（当前为 H01） |
| `scripts/preview.mjs` | 开发期 Node 静态文件服务 |
| `tests/*.test.mjs` | 检查实际挂载、错误分支和真实 HTTP 资源访问 |
| `.github/workflows/web-baseline.yml` | `dev` PR / push 的只读质量检查 |

## H01 试点（Issue #6）

`web/pages/home.js` 是个人首页 H01 的首版：继续观看、今日精选、家门口的活动、AI 趣玩入口与 AI 伙伴入口共用**一份** DOM 与事件逻辑，A/B 只切换 `data-dir` 与 `tokens.css` 变量（[design.md](../../design.md) §4、ENG-01 §3）。

- 页面顶部「演示主题」是**试点控件**，方便评审即时对照 A/B；正式「我的 → 设置 → 外观与主题」及持久化仍是待实现功能（design.md §4）。
- `http://127.0.0.1:4173/?dir=b` 可直接以暖夜剧场主题预览，供截图与评审。
- A/B 的差异不只换底色：留白、英雄区图文关系、画面比例、影像遮罩与处理都由 `tokens.css` 的主题变量驱动（数值取自 OpenDesign 原型），DOM 与交互仍是一份。
- 入口反馈是**视口内可见**的固定轻提示（`jq-toast`）：滚动后点「报名」/「问小暖」也能立刻看到，可关闭、键盘可达、`role=status` 播报；切换主题不清空已发生的反馈。
- 其它业务路由（V01/V02/L01/M01/E01/A01/C01…）尚未实现：首页入口均可操作，但只给出明确的「示例 / 未接入」反馈，不伪造结果。
- 内容、进度与活动都是标注过的示例数据；画面影像**原样复用** OpenDesign 原型的开放授权素材（`web/assets/img/`，署名见 `CREDITS.md`），`alt` 一律标注「示例画面」，不冒充真实剧照 / 商品图。

后续在有真实业务需求时才建立 `web/components/` 等复用层；不为目录完整性提前造空壳。后续页面的数据访问须统一经 `data/api.js` 适配，Mock 与真实行为分隔。演示订单、AI、报名必须明确标识，不得伪装真实结果。

## 分支与 Pages

- 工程基础：本任务从 `dev` 的 `4d03709ea6572ce3fe76090bd21785b6035d7819` 创建 `feat/eng-02-web-baseline`，仅提 PR 到 `dev`。
- `dev`、`test`、`prod` 最初均来自已验收的 ENG-01 文档基线 `03f3ce1375403342ae59ccc3dd6f7200cebabb91`；随后 `dev` 单独合入 Review Profile。
- 晋级规则：`feat/* → dev → test → prod`。晋级、发布、保护策略均是另外的授权动作，本卡不改。
- 公开 Pages 工作流仍从 `feat/jianqu-opendesign-v02` 发布**视觉评审样稿**。本卡不改动 `pages.yml`、OpenDesign 文件或 Draft PR #1。

## 检查边界

`npm test` 检查真实入口的挂载逻辑、本地静态服务器返回的页面、JS 与 Token 以及缺失/越界文件。它不等于浏览器视觉验收，也不能证明真实 AI、交易、报名或 Android WebView 已可用。真实大屏触摸、竖屏及 WebView 兼容性留待对应功能卡实测。
