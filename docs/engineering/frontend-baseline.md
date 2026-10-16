# 见趣 ENG-01 · 前端技术栈与工程环境基线契约

> 状态：**已定基线（工程决策文档）** · 决策日期：2026-10-16 · 适用：闺蜜机首期，五端复用
> 工作项：[Issue #4](https://github.com/sanchuang-dev/ai-mirror/issues/4)（父：[Issue #3](https://github.com/sanchuang-dev/ai-mirror/issues/3)）
> 工程阶段编号：**ENG-01**（Issue #4 的历史标题仍称「F01」）；下一工程卡为 **ENG-02**。这两个工程编号与 [产品功能 F01（娱乐到交易）、F02（AI 购物）](../product/elder-companion-v0.1.md) 完全独立，后续派工以 **Issue 编号** 为准。
> 上游约束：[design.md](../../design.md)（视觉基线，唯一事实源）· [仓库 AGENTS.md](../../AGENTS.md) · [组织环境模型](https://github.com/sanchuang-dev/.github/blob/main/docs/engineering/environment-model.md)
> 本文是**当前阶段的工程决定**，不是脚手架，也不创建任何实现代码。它约束首期能力，供 ENG-02 起施工时执行。

## 0. 范围与不做什么

本文件只回答四件事，且只约束首期：

1. 首期用什么前端技术，为什么，并排除多套并存；
2. 文件、组件、命名和主题 Token 的边界；
3. Mock / API 边界与可信演示规则；
4. 基础可访问性、代码质量（Lint / Format / 类型）以及分支/环境/Pages 权限契约。

**不做**（对应 Issue Non-goals）：

- 不创建脚手架、`package.json`、构建产物或任何生产代码；
- 不引入完整 UI 组件库或设计系统；
- 不修改 OpenDesign 原页面（`design/prototypes/jianqu-v02/**`）与 `design.md`；
- 不授权任何自动发布、部署、合并或环境晋级。

## 1. 首期前端技术选择（唯一决定）

**决定：首期采用原生 Web 平台——HTML + CSS + 原生 JavaScript（ES Modules）——不引入任何前端框架，不引入完整 UI 组件库，以“零构建（zero-build）”为默认。**

这不是“暂定”，而是首期唯一可执行选择。任何页面、组件、脚本都不得同时引入 React / Vue / Angular / Svelte 等框架中的任意一套或混用。

### 理由（取舍）

| 取舍 | 采用原生 Web 平台 | 不用框架的代价与缓解 |
| --- | --- | --- |
| 视觉继承 | 已验收的 A「日光客厅」/ B「暖夜剧场」就是原生 HTML/CSS/JS；直接继承即延续视觉基线，不重画 | — |
| 一致性 | design.md 要求「一套页面结构、两套主题外观」；框架重写会制造第二套实现，与目标冲突 | 组件复用靠约定与小模块，不靠框架运行时 |
| 交付窗口 | 五端两周、闺蜜机为重点，内容呈现型页面状态简单，框架收益低、迁移成本高 | 已知复杂交互（播放器、AI 流式）用原生状态机 + 事件即可覆盖 |
| 目标设备 | 目标是大尺寸 Android 平板 / WebView；原生平台在无网络、无 npm 环境仍可直接运行 | 无虚拟 DOM，注意手动、最小化 DOM 更新 |
| 主题 | 主题只通过 CSS 自定义属性切换，与渲染框架无关 | 主题差异必须落在 Token，不得复制页面 |

**明确排除的方案及原因**：

- React / Vue 等 SPA 框架：与已验收视觉基线重复实现，制造多栈并存的验收风险，超出首期范围。
- 完整 UI 库（Ant Design、Element、Vant 等）：Non-goal，且会替换既有视觉语言。
- 预处理器强制（Sass/Less）、强制打包器（Webpack/Vite）：首期不强制。若后续出现真实需求（例如模块数量、构建优化、多页面产物），只能通过第 8 节的评审入口新增，不得默默引入。

### 运行时与语言契约

- 运行环境：现代浏览器 / Android WebView（Chrome 内核）。
- 脚本：原生 **ES Modules**（`<script type="module">`，`import`/`export`），不再新增 IIFE + `var` 旧写法；语言特性以 ES2020 为下限、以目标 WebView 实测为准。
- 不设服务端渲染；页面为静态托管（见第 7 节）。
- Node.js LTS 仅作开发期工具（Lint / Format / 类型检查），不作为运行时依赖。

## 2. 文件、组件与命名边界

施工开始后（ENG-02+），实现代码与评审原型**分离存放**，评审原型继续留在 `design/prototypes/`，不得当作生产源码。

目标源码布局（ENG-02 建立，本卡不创建）：

```text
web/                     # 首期实现根，零构建，可作为 Pages 发布根
├── index.html           # 大屏入口（闺蜜机）
├── mobile.html          # 自有手机 H5 接力入口（如首期需要）
├── assets/
│   ├── tokens.css       # 主题 Token 唯一事实源（见第 3 节）
│   ├── base.css         # 重置与基础排版
│   ├── components.css   # 复用组件样式
│   └── app.js           # 应用装配 / 路由入口
├── components/          # 可复用 UI 模块，kebab-case.js
├── pages/               # 页面级视图与脚本
└── data/
    ├── api.js           # 数据访问唯一出口（见第 4 节）
    └── fixtures/        # 明确命名的示例数据 *.fixture.js
```

命名规则：

- 文件与目录：`kebab-case`；页面编号沿用 IA（如 `h01`、`v02`、`m02`）仅作为文档标识，不强制写进文件名。
- 组件模块：`kebab-case.js`，只提供具名导出；工厂函数用动词前缀 camelCase，例如 `createContentCard()`；共享组件不使用 `default export`。
- 产品 CSS 类名：`jq-<语义>` 前缀（如 `jq-content-card`、`jq-ai-orb`），避免与 OpenDesign 原型的 `a-*` / `b-*` 评测类冲突。
- **禁止** `a-*` / `b-*` 这类“按主题分叉页面”的命名进入实现代码；主题差异只能体现在 Token，不得复制页面结构或另建一份 DOM。
- 资源：图片、字体等静态文件放 `assets/`；确需警示的示例素材遵循原型 `CREDITS.md` 的署名与授权约束。

页面与组件边界：

- 一个页面只维护一份语义 DOM、一处数据来源、一套业务事件与加载/空/失败/确认状态；不得为 A/B 各写一套。
- 跨页面复用的 UI 抽到 `components/`；只在一个页面出现的结构留在 `pages/`，不提前抽象。

## 3. 主题 Token 契约

**Token 的唯一事实源**是 `assets/tokens.css`（ENG-02 建立），其初始值**只能从 [design.md](../../design.md) 与已实现原型 `assets/app.css` 提取**，不得凭空新造品牌色、字体家族、间距量表、固定栅格或大圆角（design.md §6）。

首期主题 Token＝现有 CSS 自定义属性，两套主题值如下（来源：`design/prototypes/jianqu-v02/assets/app.css`）：

| 语义变量 | A · 日光客厅（`[data-dir="a"]`） | B · 暖夜剧场（`[data-dir="b"]`） |
| --- | --- | --- |
| `--bg` | `#F5F6F8` | `#16141C` |
| `--surface` | `#FFFFFF` | `#211E2A` |
| `--surface-2` | `#ECEFF3` | `#2A2635` |
| `--ink` | `#1B1E23` | `#F3EFE8` |
| `--muted` | `#5C6470` | `#A9A2B5` |
| `--border` | `#E3E6EB` | `#35303F` |
| `--accent` | `#E4572E` | `#E9B25C` |
| `--accent-strong` | `#C9401B` | `#E9B25C` |
| `--accent-ink` | `#FFFFFF` | `#1A1520` |
| `--accent-2` | `#1F9E8F` | `#4FC3B5` |
| `--orb-core` | `#FFD9C9` | `#FFF3D8` |
| `--orb-edge` | `#E4572E` | `#E9B25C` |
| `--font-body` | 苹方/系统中文无衬线族 | 苹方/系统中文无衬线族 |
| `--font-display` | `Songti SC` 等宋体/衬线回退 | 苹方等无衬线回退 |

规则：

- 主题切换只改 Token（作用于根元素上的主题标记），**不改变页面结构、功能范围、用户权限或交互状态**。
- 保留 A/B 既有的字体差异（A 衬线大标题、B 无衬线标题），不得为“统一”强行删除。
- 用户在「我的 → 设置 → 外观与主题」选择 A/B 并即时生效、个人模式持久化（该入口本身是待实现功能，见 design.md §4）。
- 需要新增 Token 时，只补现有体系缺失的语义；确需突破既有视觉框架的组件，先走第 8 节评审，不默认合并。

## 4. Mock / API 边界与可信演示

**所有数据访问必须经过唯一出口 `data/api.js`**；页面与组件不得直接散落 `fetch` 或硬编码业务数据。

- 未接入真实的接口一律以适配器返回示例数据，示例数据放在 `data/fixtures/*.fixture.js`，命名显式含 `fixture`。
- 真实与示例的切换只允许通过**单一配置点**（构建期常量或单一运行时标志）控制，禁止页面各处自行判断。
- **Mock 不得伪装真实交易或真实 AI**：
  - 不得生成“支付成功 / 已下单 / 已报名核销 / 有名额 / 有库存”等真实回执；接入前按钮必须表达为“查看订单示例 / 模拟提交”，并给出明确的样本/演示标识。
  - 不得把预生成音频、视频、图片或话术当作实时 AI / 数字人 / 语音识别结果；未接入时页面显著标注“概念演示，非真实服务”。
  - 不得用无授权短剧、模糊版权图片冒充真实业务素材；示例内容与真实内容可辨认。
- 深度等级沿用产品评审 S1（可操作演示）/ S2（真实 AI PoC）/ S3（真实业务接入）定义，UI 标签须如实对应实际接入程度（见 [功能评审 V0.2](../product/elder-companion-functional-review-v0.2.md)）。
- 对外动作（下单/支付、报名、公开分享）必须由用户本人确认；Mock 不得绕过确认或伪造履约结果。

## 5. 基础可访问性要求

首期最低门槛（大屏、适龄、触控优先）：

- `<html lang="zh-CN">`；每页一个 `<h1>`，标题层级有序。
- 语义化地标（`header` / `nav` / `main` / `section` + `aria-label`）；可交互元素使用真实的 `<button>` / `<a>`，不用可点击 `div`。
- 键盘可达：`Tab` 顺序合理，`:focus-visible` 可见焦点环；不依赖悬停完成关键任务。
- 触控目标不小于 **48×48 CSS px**；正文不小于 18px（1080p 原型尺度），字号、字幕、音量、播报速度可调。
- 对比度：正文 ≥ 4.5:1，大字/UI 元素 ≥ 3:1；**不用颜色单独表达状态**（选中/禁用/错误需同时有文字、图标或 `aria-*`）。
- 尊重 `prefers-reduced-motion`；装饰性动画可关闭。
- 图片：有意义的图给 `alt`，纯装饰用 `aria-hidden="true"`。

以上为**页面级最低基线**；实机横竖屏、Android WebView 兼容、读屏器验证属于独立验收，不用桌面浏览器截图代替（design.md §7）。

## 6. Lint / Format / 类型要求

施工开始时（ENG-02）仓库必须提供以下质量门槛；本卡只定义，不安装：

- **Format**：Prettier 为唯一格式化事实源；CI 执行 `format:check`，失败即阻塞。
- **Lint**：ESLint 扁平配置（`eslint.config.js`），`eslint:recommended` + 浏览器全局；不安装框架插件（首期无框架）。
- **类型**：源码为原生 JS，类型信息以 **JSDoc** 标注在导出模块/函数上；使用 TypeScript **仅作为检查器**（`tsc --noEmit --allowJs --checkJs`），不产出 `.ts` 编译链。
- **语法检查**：保留现有工作流对脚本的 `node --check` 校验。
- 约定脚本：`npm run lint`、`npm run format:check`、`npm run typecheck`；Node LTS + 单一 npm lockfile。
- 测试：首期不强制引入测试框架；但任何行为改动须按 [组织测试标准](https://github.com/sanchuang-dev/.github/blob/main/docs/engineering/testing-standard.md) 提供与风险相称的证据，且**不得**用跳过、删除、弱化检查或扩大 Mock 来制造绿色。

## 7. 分支、环境与 Pages 权限契约

### 7.1 现状（技术现实）

- `main`：产品定义阶段的**文档基线**，`main` **不是工程环境**，不得作为实现开发或发布的落点。
- `feat/jianqu-opendesign-v02`：承载未合并的 OpenDesign 改造原型（Draft PR #1）；**PR #1 未合并，不得视为 main 已有代码**。
- **阶段更新（2026-10-16）**：`dev`、`test`、`prod` 均已创建，三者起源可追溯到 ENG-01 合并提交 `03f3ce1375403342ae59ccc3dd6f7200cebabb91`。其后 ENG-02 [PR #25](https://github.com/sanchuang-dev/ai-mirror/pull/25) 已完成工程骨架及质量门禁并合入 `dev`，随 [PR #27](https://github.com/sanchuang-dev/ai-mirror/pull/27) 晋级 `test`；`prod` 未晋级。**分支/源码存在不代表产品 UI 已实现、设备验收完成、已部署或发布**。
- `.github/workflows/pages.yml`：从 `feat/jianqu-opendesign-v02` 取静态文件发布到公开 GitHub Pages，是**设计评审演示站**，不是产品生产环境。

### 7.2 组织默认与仓库例外

组织默认流程为 `feat/* -> dev -> test -> prod`（`main` 不是环境名）。本仓库在产品定义阶段记录如下**正式例外**：

- **Bootstrap-only 分支例外（ENG-01）**：`.github/workflows/jianqu-free-worker-f01.yml` 允许**仅 Issue #4** 产出面向 `main` 的**文档型** Draft PR，并做双重护栏：
  - 守卫 `issue_number == 4` 且 `DISPATCH_REF == main`；
  - 校验变更路径只允许 `AGENTS.md`、`README.md`、`docs/engineering/*`。
- 该例外的**目的**：在 `dev` 存在之前，先建立本工程基线文档。
- 该例外的**可变性/边界**：**ENG-01 专用，不得复用于 ENG-02 或任何功能开发**；它是临时例外，不新增任何生产能力、不替代 `dev`。
- 该例外相对 `dev/test/prod` 的位置：**低于**正常流程，只服务文档基线，不参与环境晋级。

### 7.3 后续实现基线（ENG-02 起）

- ENG-02 的工程分支前提已满足：`dev`、`test`、`prod` 已按组织环境模型建立。**ENG-02 已通过真实检查并合入 `dev`、晋级 `test`**；后续功能只能从当前 `dev` 开 `feat/*` 并向 `dev` 提 PR。质量门禁已建立，分支保护与产品级 WebView/真机验收仍应分别验证；不得把源代码晋级误报为部署或发布。
- 实现工作一律基于 `dev` 开 `feat/*`，走 PR；**不得用默认 `main` 代替工程环境**。
- `main` 的定位保持为文档/历史基线；发布只能在获授权环境分支上进行。

### 7.4 合并与发布边界

- 禁止直接向 `main` 推送或将任何业务实现合入 `main`。仅允许经明确授权、PR 与审查的文档基线及默认分支专用工作流登记；这些变更**不是**环境晋级或产品发布。实际施工一律向 `dev` 提 PR。
- Draft PR #1 在视觉验收完成、且存在合适基线（`dev`）之前保持**未合并**；不得绕过评审直接进入 `main`。
- 本卡不授权合并、验收、关闭、发布或环境晋级。

### 7.5 Pages 权限策略

- 仅 `.github/workflows/pages.yml` 持有 `pages: write` 与 `id-token: write`；ENG-01 Worker 工作流的守卫作业只有 `contents: read`，产出 PR 的作业授予 `contents: write` + `pull-requests: write`，且其校验脚本把可改动路径限制在 `AGENTS.md`、`README.md`、`docs/engineering/*`。
- 当前发布源是设计分支，属评审演示；**Pages 可访问 ≠ 产品通过验收**。
- 即便 `dev` 已存在，只有当工程实现已完成必要评审、另获发布授权后，才可**经独立 PR 评审修改工作流**把 Pages 发布源切到获授权的环境分支。**本次 Worker 接入不改动任何发布工作流，也不授权自动发布。**

## 8. 变更与评审入口

- 本文件是首期前端/工程基线的**唯一事实源**。修改本文件的任何决定（三选一：框架、打包器/预处理器、UI 组件库；类型策略；发布拓扑）必须通过引用本文件的 PR，并经维护者评审，**不得静默采用**。
- 出现现有体系无法覆盖的新场景：先提出差异与方案交产品负责人评审，未经确认不自行引入另一套视觉或技术语言（design.md §1、§6）。
- 视觉/页面级变更仍按 [design.md](../../design.md) §7 验收顺序执行：产品行为 → 视觉继承 → 主题一致性 → 触控与设备适配 → 示例真实性。

---

### 验收对照（本卡）

| Issue 验收项 | 落点 |
| --- | --- |
| 1. 唯一可执行技术选择，避免 React/Vue 并存，只约束首期 | §1 |
| 2. 明确 bootstrap-only 分支例外、后续实现基线、合并/发布边界，不用 main 代替工程环境 | §7 + 仓库 `AGENTS.md` 第 4 条 |
| 3. 设计规范引用 `design.md`；Mock 不伪装真实交易/AI；技术变更变更评审入口 | §3/§4 引用 design.md；§4 Mock 边界；§8 评审入口 |
