# 见趣 · 三创免费 Worker V2 接入审查

状态：**标准接入 PR 待审查、待合并；无自动派工**。

## 双重分支约束

- GitHub 默认分支 `main` 仍是文档/工作流登记入口，**不是工程开发或发布环境**。本新入口仅在 GitHub Actions 中从审核后的默认分支手动运行，施工基线必须为已经存在的 `dev`，交付目标只允许 `dev`。
- 原 `.github/workflows/jianqu-free-worker-f01.yml` 是已关闭 Issue #4 的**单次文档型 main bootstrap 例外**，不得解除 #4 限制、不得用于 ENG-02，也不修改/删除它。
- 新入口 `.github/workflows/sanchuang-free-worker.yml` 采用组织安全版固定 SHA `985ff50c297b844af65a920bd38f9c0b1ae31098`。调用器 `ENROLLED=true` 仅表示**本 PR 经独立审查并合并后可以手动派工**；不是授权执行某个 Issue，任何从未审查分支启动的运行也会被组织执行器强制拒绝。
- 当前 `dev` 只有已验收工程决策文档，**不是已完成的前端脚手架**；`test/prod` 也不因本 PR 发生任何晋级或发布。

## 可信质量关卡

该仓库首期采用原生 HTML/CSS/JS ES Modules、零构建。ENG-02（Issue #5）计划建立 `web/`、质量脚本、锁文件及 CI，新 Worker 验证命令不假装这些文件已经存在：

- 先运行 `git diff --cached --check`，再要求 `package.json`、`package-lock.json`、`web/index.html`、`web/assets/app.js`、`web/assets/tokens.css` 存在；
- 检查真实 `lint`、`format:check`、`typecheck` 脚本存在且不是明显的恒真占位，再用 `npm ci --no-audit --no-fund` 安装依赖，运行三项质量检查，最后使用 `node --check web/assets/app.js` 核查 JavaScript 语法；
- **在 ENG-02 真正生成脚手架之前，这些命令必然失败，这是预期的失败保护**。质量脚本真实有效性的反例注入、完整 CI 和浏览器静态预览仍须在对应 Issue 及审查中验证，不声称本 PR 已通过这些工程验收。

## 任务与发布边界

[Issue #5](https://github.com/sanchuang-dev/ai-mirror/issues/5) 仍需维护者**另行授权施工**。本 PR 不是派工指令：只为标准 Worker 建立未来入口，不主动运行、重试、合并、关闭 Issue 或部署。AI 交付只有针对 `dev` 的 Draft PR；AI Review、验收和环境晋级仍需独立操作。

保留原 `pages.yml` 不变，公开站继续是视觉评审原型；新标准入口没有 `pages: write` 或发布作业。
