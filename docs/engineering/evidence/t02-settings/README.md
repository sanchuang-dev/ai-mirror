# T02 设置页外观主题切换与偏好保存 · 验收证据（Issue #7）

> 采集日期：2026-10-17 · 基线：`dev` @ `7150eae8b39d4507cfece44eaf582e4e8c145fd4`（H01 竖屏适配已合入）
> 采集环境：本 Worker runner，Chromium 155（`--headless=new`）+ CDP 直连，安装 `fonts-noto-cjk`（Noto Sans/Serif CJK SC）渲染中文。
> 这些是**评审证据快照**，不是产品源码；源码见 `web/`，视觉契约见 [`design.md`](../../../design.md)，主题 Token 见 [`web/assets/tokens.css`](../../../../web/assets/tokens.css)。
> 本 Issue 只交付「外观主题切换与偏好保存」；不做 P01 个人中心、不做 T03 全站路由、不做公共设备管理员策略。

## 交付内容

- 新增真实用户入口：顶栏「设置」→ 覆盖层「设置 → 外观与主题」。顶部「演示主题」仍是**评审试点控件**，不再冒充设置入口。
- 选择 A「日光客厅」/ B「暖夜剧场」**即时**作用在已有 H01 单套 DOM 上（只切根元素 `data-dir` 与 `tokens.css` 变量），并写入本地个人偏好；返回首页不重建业务 DOM，因此**不丢滚动位置和已显示的入口反馈**。
- 新增 [`web/data/preferences.js`](../../../../web/data/preferences.js)：唯一读写 `localStorage` 的模块。初始主题优先级：**个人已保存偏好 > `?dir=a|b` 评审参数 > 默认 A**。
- 无存储权限 / 无偏好 / 存储值非法均有清晰、可恢复的行为，不白屏。

## 复现命令

```bash
npm ci --no-audit --no-fund
npm run check      # ESLint + Prettier + tsc(checkJs,strict) + node --check + node --test
npm run preview    # http://127.0.0.1:4173/
```

浏览器路径验证经 Chrome DevTools Protocol 完成（一次性客户端，按 browser-verification 约束**不入库**）：
navigate → 点「设置」→ 选 A/B → 点「返回首页」→ 刷新，读取 `documentElement[data-dir]`、
`localStorage['jianqu.theme-preference']`、`.jq-settings__status` 文案、`aria-pressed`、
`.jq-scroll` 的 `scrollTop`、`.jq-toast` 可见性与文案，并收集 `Runtime.exceptionThrown` /
`console.error` / `Log.entryAdded`。

## 结果

- **质量门禁**：`npm ci --no-audit --no-fund && npm run check` 真实执行、退出码 0；Node 测试器 **26/26** 通过（既有 11 项未删除、未弱化，新增 15 项覆盖偏好读写、优先级与设置交互）。
- **入口与返回（验收 1）**：`[data-open-settings]` 有且仅有 1 个；点开 `.jq-settings` 后 `role=dialog` `aria-modal=true` `hidden=false`，背景 `.jq-header`/`.jq-scroll`/`.jq-fab`/`.jq-toast` 置为 `inert`；点「返回首页」后 `hidden=true`、`inert` 撤除、焦点回到「设置」入口。`Escape` 同样可关闭。
- **即时切换 + 持久化（验收 1）**：在设置里选 B → `data-dir=b`、`localStorage='b'`、选中卡 `aria-pressed=true` 且「当前使用」可见、状态文案「已保存你的选择，刷新后仍会使用。」随后刷新仍为 `b`。
- **评审参数优先级（验收 3 / 跟进点 3）**：已保存 B 后仍带 `?dir=a` 刷新 → `data-dir` 保持 `b`（**不跳回旧主题**）；无个人偏好时 `?dir=b` 正常生效且 `localStorage` 仍为空（评审参数不写存储）。
- **异常/缺失可恢复（验收 3）**：存储值非法（`'night'`）时忽略该值、回落到参数/默认；页面仍有 1 个 `main.jq-home`、1 个 `h1`，不白屏。无存储时打开设置显示「本机不能保存外观偏好：选择会立即生效，但刷新后会恢复默认。」，选择仍即时生效但明确不持久化（`save()` 返回 `false` → 「本机无法保存偏好…」）。
- **不丢路由/演示状态（验收 2）**：打开设置前把 `.jq-scroll` 滚到 `scrollTop=260` 并点「报名」弹出提示；选择主题并返回后：`panelHidden=true`、`scrollTop` 仍 `260`、`.jq-toast` 可见且文案仍为「报名 L02 尚未实现：不会产生真实报名凭证，仅为示例。」、`inert=false`。
- **单套 DOM / 视觉继承（验收 2、design.md §7）**：设置面板不按 A/B 分叉，全套类名均为 `jq-`；主题差异仍只来自 `tokens.css`。两主题截图内容层级与区块顺序一致。
- **适龄触控/竖屏（验收 3、跟进点 5）**：1080×1920 CSS 视口下无横向溢出，主题卡片高 108px、返回按钮高 52px（≥48px）。
- **无 JS 错误**：`Runtime.exceptionThrown` 与 `console.error` 为空；仅 1 条资源 404，为浏览器自动请求的 `/favicon.ico`，非应用脚本/样式/图片错误。

## 截图（均真实视口）

| 文件 | 视口 | 内容 |
| --- | --- | --- |
| [t02-home-a.png](t02-home-a.png) | 1600×900 | H01 首页 A「日光客厅」，顶栏新增「设置」入口 |
| [t02-settings-a.png](t02-settings-a.png) | 1600×900 | 「设置 → 外观与主题」，当前 A，尚无已保存偏好 |
| [t02-settings-b-selected.png](t02-settings-b-selected.png) | 1600×900 | 选择 B 后：即时变暗、B 卡选中 +「当前使用」、已保存文案 |
| [t02-home-b.png](t02-home-b.png) | 1600×900 | 返回首页后 B 主题，滚动与「报名」提示均保留 |
| [t02-settings-portrait-a.png](t02-settings-portrait-a.png) | 1080×1920 | 竖屏预览下设置面板可用、无横向溢出 |

## 未覆盖 / 验证缺口

- 浏览器截图**不能**替代真实 Android 大屏 / WebView 触摸、对比度与读屏器实机验收（`design.md` §7）。
- 设置面板采用「焦点移入 + 背景 `inert`」而非完整焦点陷阱；键盘往返已由 `inert` 与 `Escape` 覆盖，读屏器实机表现未验收。
- 交互证据来自一次性 CDP 客户端，未入库为可重复执行的浏览器测试；`npm test` 只覆盖 Fake DOM 层的结构与状态断言。
- 公共设备的默认主题与访客改主题权限仍未确定：本卡只在设置面板内如实标注该边界，未实现任何管理员设置或公共会话开关。
- 字体为 Noto Sans/Serif CJK SC，与目标设备实际字体（苹方 / 宋体）可能有细微差异。
