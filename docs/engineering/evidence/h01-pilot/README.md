# H01 试点验收证据（Issue #6）

> 采集日期：2026-10-16 · 基线：`dev` @ `2460535df78020eef1839fda5d560f49f10034d7` · 隔离分支 `feat/worker-*`
> 采集环境：GitHub Actions runner，headless Chromium，安装 `fonts-noto-cjk` 后截图。
> 这些是**评审证据快照**，不是产品源码；页面源码见 `web/`，视觉契约见 [`design.md`](../../../design.md)。

## 复现命令

```bash
npm ci --no-audit --no-fund
npm run check
npm run preview   # http://127.0.0.1:4173/

# 两主题截图（?dir=a 为默认日光客厅，?dir=b 为暖夜剧场）
chromium --headless=new --no-sandbox --disable-gpu --hide-scrollbars \
  --window-size=1600,1900 --virtual-time-budget=2500 \
  --screenshot=theme-a-daylight-living.png "http://127.0.0.1:4173/?dir=a"
chromium --headless=new --no-sandbox --disable-gpu --hide-scrollbars \
  --window-size=1600,1900 --virtual-time-budget=2500 \
  --screenshot=theme-b-warm-night.png "http://127.0.0.1:4173/?dir=b"

# DOM 对照
chromium --headless=new --no-sandbox --disable-gpu --virtual-time-budget=2500 \
  --dump-dom "http://127.0.0.1:4173/?dir=a" > dom-a.html
chromium --headless=new --no-sandbox --disable-gpu --virtual-time-budget=2500 \
  --dump-dom "http://127.0.0.1:4173/?dir=b" > dom-b.html
diff dom-a.html dom-b.html
```

## 结果

- **质量门禁**：`npm run check` 全部通过（ESLint、Prettier、`tsc` 类型检查、`node --check`、Node 测试器共 8 项全过），未弱化既有门禁。
- **单套 DOM（验收 1）**：A 与 B 的序列化 DOM 仅差 `<html data-dir>` 与两个演示主题按钮的 `aria-pressed`；业务节点完全一致（`data-route` 节点 31 vs 31，`main.jq-home` 1 个，`h1` 1 个）。不存在 A/B 两套独立业务 DOM。
- **入口点击回放（验收 3）**：11 类首页入口 `home / video / activity / course / shop / search / continue / favorite / signup / create / ai` 逐个点击后均有非空、明确的「示例 / 未接入」反馈；未实现路由被如实标注，不伪造结果。
- **主题切换不破坏状态（验收 3）**：点击切换后 `data-dir` 变为 `b`、`aria-pressed` 正确、按钮数 `33 → 33` 不变、上一次入口反馈文案保持不变。
- **无 JS 错误**：`Runtime.exceptionThrown` 为空，`console.error` 为空；唯一 404 是浏览器自动请求的 `/favicon.ico`，非应用脚本错误。

## 截图

- `theme-a-daylight-living.png` — A · 日光客厅（浅色杂志式，橙色强调、宋体大标题）
- `theme-b-warm-night.png` — B · 暖夜剧场（深色沉浸，暖金强调、无衬线标题）

两图内容层级、区块顺序与入口完全相同，差异只在颜色、字体、阴影与影像遮罩，符合 `design.md` §4「一套页面、两套主题」。

## 未覆盖 / 验证缺口

- 浏览器截图**不能**替代真实 Android 大屏 / 横竖屏 / WebView 触摸与对比度实机验收（`design.md` §7）。
- 除 H01 之外的业务路由尚未实现；页面只给出示例反馈，不代表真实内容 / AI / 交易 / 报名服务。
- 截图由 runner 内 headless Chromium 生成，字体为 `fonts-noto-cjk`，与目标设备实际字体（苹方 / 宋体）可能有细微差异。
