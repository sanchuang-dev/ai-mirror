# 见趣 · 三创免费 Worker V2 接入审查

状态：标准手工派工入口契约；是否已启用以默认分支 `main` 的实际工作流为准。没有自动派工。

## 双重分支约束

- GitHub 默认分支 `main` 仍是文档/工作流登记入口，**不是工程开发或发布环境**。本新入口仅在 GitHub Actions 中从审核后的默认分支手动运行，施工基线必须为已经存在的 `dev`，交付目标只允许 `dev`。
- 原 `.github/workflows/jianqu-free-worker-f01.yml` 是已关闭 Issue #4 的**单次文档型 main bootstrap 例外**，不得解除 #4 限制、不得用于 ENG-02，也不修改/删除它。
- 新入口 `.github/workflows/sanchuang-free-worker.yml` 采用组织安全版固定 SHA `985ff50c297b844af65a920bd38f9c0b1ae31098`。调用器 `ENROLLED=true` 仅表示**本 PR 经独立审查并合并后可以手动派工**；不是授权执行某个 Issue，任何从未审查分支启动的运行也会被组织执行器强制拒绝。
- ENG-02 工程骨架已由 [PR #25](https://github.com/sanchuang-dev/ai-mirror/pull/25) 合入 `dev`，并经 [PR #27](https://github.com/sanchuang-dev/ai-mirror/pull/27) 晋级 `test`；本接入不推进 `prod`、Pages 或任何业务发布。

## 可信质量关卡

该仓库首期采用原生 HTML/CSS/JS ES Modules、零构建。ENG-02（Issue #5）已验收，`dev` 中已有 `web/`、锁文件、质量脚本及 CI。新 Worker 必须验证真实工程而非文档占位：

- 先运行 `git diff --cached --check`，再要求 `package.json`、`package-lock.json`、`web/index.html`、`web/assets/app.js`、`web/assets/tokens.css` 存在；
- 检查 `lint`、`format:check`、`typecheck`、`syntax`、`test`、`check` 脚本有实质内容，再执行 `npm ci --no-audit --no-fund`、`npm run check`；它包括 Lint、格式、JSDoc 类型、JS 语法和 Node 内置测试，与工程 CI 共用同一质量入口；
- ENG-02 的验证和错误注入证据见 [Issue #5](https://github.com/sanchuang-dev/ai-mirror/issues/5) 与 [CI](https://github.com/sanchuang-dev/ai-mirror/actions/runs/38885174532)。本 Worker 新版本仍需针对**另一张仍 Open 的真实 Issue**单独执行端到端烟测；不能把历史 #4 的通过直接当成新入口已通过。

## 任务与发布边界

[Issue #5](https://github.com/sanchuang-dev/ai-mirror/issues/5) 已关闭 completed，不得重新作为 Worker 派工对象。只有针对**仍 Open 的具体 Issue**取得维护者明确实施授权，才可从默认分支手工运行此入口；本接入不自动执行、重试、合并、关闭 Issue 或部署。AI 交付只有针对 `dev` 的 Draft PR；AI Review、验收和环境晋级仍需独立操作。

保留原 `pages.yml` 不变，公开站继续是视觉评审原型；新标准入口没有 `pages: write` 或发布作业。
