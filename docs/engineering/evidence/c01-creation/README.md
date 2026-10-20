# AI 趣玩 C01（主题选择 + 素材授权 + 模拟生成入口）· 验收证据（Issue #11）

> 采集日期：2026-10-19 · 基线：`dev` @ `4364cd3942950f7f71086654a77f6d24896f8f45`（V02 #45）
> 采集环境：本 Worker runner，Chromium 155（`--headless=new`）+ 一次性 CDP 客户端（按组织 browser-verification Skill，**不入库**），安装 `fonts-noto-cjk` 渲染中文。
> 这些是**评审证据快照**，不是产品源码；源码见 [`web/`](../../../../web/)，视觉契约见 [`design.md`](../../../../design.md)，主题 Token 见 [`web/assets/tokens.css`](../../../../web/assets/tokens.css)。
> 本卡只交付「AI 趣玩主题选择 → 素材授权 → 预览 → 模拟生成说明」；不做 C02 的作品结果 / 保存 / 分享，不接入真实模型，不读取摄像头。

## 交付内容

- 首页「随手玩点新花样」的四个创作入口（AI 写真 / 写福字 · 书画 / 老照片修复 / 人生故事）接入新的 **AI 趣玩 C01** 场景：`create` 路由，正文在 [`web/pages/creation.js`](../../../../web/pages/creation.js)。
- 一条代表性创作前流程，四步、单套 DOM、单套状态：**选主题 → 选素材来源（示例素材 / 本地图片 / 文字描述）→ 许可提示（同意或拒绝）→ 确认预览 → 「模拟生成」说明**。示范主题为 **AI 写真**（默认选中、带「本次示范主题」角标），其余主题共用同一套流程与逻辑。
- **权限与隐私边界**：本机图片只在本机用对象地址预览，**不上传、不持久化**；拒绝授权 / 撤销 / 更换素材 / 返回首页都会释放对象地址并清空素材，页面缓存里不留私人素材。没有素材时点「同意」不会进入下一步。
- **诚实边界**：`模拟生成` 是显式标注「S1 演示、未接入真实模型」的入口，落到「等待真实模型接入」待衔接态，并提供「查看作品（C02 待实现）」入口，不伪造生成完成。
- 数据出口：[`web/data/fixtures/creation.fixture.js`](../../../../web/data/fixtures/creation.fixture.js) + [`web/data/api.js`](../../../../web/data/api.js) 的 `getCreationContent()`；路由接线只在 [`web/assets/app.js`](../../../../web/assets/app.js)（新增 `create` 路由 + 一个 `bodyFor` 分支）。

## 复现命令

```bash
npm ci --no-audit --no-fund
npm run check      # ESLint + Prettier + tsc(checkJs,strict) + node --check + node --test
npm run preview    # http://127.0.0.1:4173/
```

浏览器关键路径与 A/B 截图经一次性 CDP 客户端完成（按 browser-verification Skill **不入库**）：
navigate `?dir=a` → 点 `[data-route="create"]` → 选主题 → `[data-action="next"]` → 选来源 →
点「拒绝授权」/ 点「同意」→ 预览 → `[data-action="generate"]` → 读 `aria-pressed`、可见步骤、
`.jq-create__feedback` 文案、`blob:` 预览地址、`section[data-step]` 可见性；并收集
`Runtime.exceptionThrown` / `Runtime.consoleAPICalled(error)` / `Log.entryAdded(error)`。原始断言结果见 [`results.json`](results.json)。

## 结果

- **质量门禁**：`npm ci --no-audit --no-fund && npm run check` 真实执行、退出码 0；Node 测试器 **74/74** 通过（既有 64 项未删除、未弱化；新增 10 项覆盖流程、拒绝 / 撤销 / 无素材、本机预览释放、A/B 不丢状态与入口可达）。
- **浏览器关键路径（验收 1）**：首页入口进入 C01（`jq-scene--create`，单 h1「AI 趣玩」、四步指示）；选主题 `aria-pressed=true`；「下一步」进入素材步骤。全部 32 项 CDP 断言 `ok`。
- **授权与拒绝（验收 1、2）**：示例素材可选中；「拒绝授权」→ 反馈「已拒绝授权：你选的素材已经丢弃，没有保留。」，选中项归零、仍停在素材步骤；无素材点「同意」→ 反馈「还没有选好素材…」且不进入预览。
- **预览与撤销（验收 1、2）**：同意后进入预览，显示素材 / 示意卡与「S1 演示：这里尚未连接任何真实 AI 模型」；「撤销授权并清除素材」→ 反馈「已撤销…清除」，本机缩略图归零并回到素材步骤。
- **本机图片隐私边界（验收 2）**：真实 `DataTransfer` 注入本机文件后，素材步骤与本机 `blob:` 预览可见；撤销后对象地址被 `URL.revokeObjectURL` 释放（脚本计数 = 1），不再有缩略图。全过程无任何网络上传请求。
- **模拟生成与 C02 衔接（验收 3）**：`模拟生成（S1 演示）` 落到「等待真实模型接入」，反馈「S1 演示：这里只停留在发起前的说明，没有真实生成结果。」，页面明确「作品结果、保存与分享属于 C02…不会伪造生成完成」，并只提供 `[data-route="create-result"]` 的诚实衔接入口。
- **A/B 与状态保留（验收 3、design.md §4）**：A/B 均可读；在预览步骤切到 B 只改根 `data-dir`，**不重建场景**，已选主题与素材、当前步骤都保留。全套类名均为 `jq-`，无 `a-*`/`b-*` 分叉、无第三套视觉语言。
- **竖屏可读 / 触控（验收 3）**：1080×1920 下无横向溢出，素材来源按钮高度 ≥ 48px。
- **无 JS 错误**：`Runtime.exceptionThrown` / `console.error` / `Log.entryAdded(error)` 均为空（本次运行 favicon 也未报错）。

## 截图（均真实视口）

| 文件 | 视口 | 内容 |
| --- | --- | --- |
| [c01-home-a-entry.png](c01-home-a-entry.png) | 1600×900 | H01 首页 A（入口在首屏下方） |
| [c01-home-a-creations.png](c01-home-a-creations.png) | 1600×900 | 「随手玩点新花样」四个入口，均进入 C01 |
| [c01-theme-a.png](c01-theme-a.png) | 1600×900 | 步骤 1 选主题，AI 写真为「本次示范主题」 |
| [c01-source-a.png](c01-source-a.png) | 1600×900 | 步骤 2 素材来源 + 许可提示（未选素材） |
| [c01-source-local-a.png](c01-source-local-a.png) | 1600×900 | 本机图片已选：本机预览 + 「不会上传」说明 |
| [c01-preview-a.png](c01-preview-a.png) | 1600×900 | 步骤 3 预览本机图片 + 「模拟生成」入口与 S1 说明 |
| [c01-done-a.png](c01-done-a.png) | 1600×900 | 步骤 4「等待真实模型接入」+ C02 衔接入口 |
| [c01-preview-b.png](c01-preview-b.png) | 1600×900 | B「暖夜剧场」下同一预览步骤，状态未丢 |
| [c01-source-b.png](c01-source-b.png) | 1600×900 | B 主题素材步骤可读 |
| [c01-source-portrait-b.png](c01-source-portrait-b.png) | 1080×1920 | 竖屏素材步骤无横向溢出、按钮可触控 |

## 未覆盖 / 验证缺口

- 浏览器截图**不能**替代真实 Android 大屏 / WebView 触摸、对比度与读屏器实机验收（`design.md` §7）。
- 本机图片路径的 `blob:` 预览用浏览器内生成的 PNG 模拟，未用真实手机照片；未验证超大图 / 非图片文件的边界（`accept="image/*"` 之外由浏览器自行拦截）。
- 交互证据来自一次性 CDP 客户端，未入库为可重复执行的浏览器测试；`npm test` 只在 Fake DOM 层断言结构与状态。
- 未接入真实模型 / 摄像头 / 云端上传；公共设备与私人设备的素材策略、C02 作品结果与分享范围仍需后续卡确认。
- 字体为 Noto Sans/Serif CJK SC，与目标设备实际字体（苹方 / 宋体）可能有细微差异。
