# X01 公共模式结束体验与临时状态清理 · 验收证据（Issue #19）

> 采集日期：2026-10-19 · 基线：`dev` @ `87ad41d5914abe0364579dd67b7d6a84f4a0c2e1`
> 采集环境：本 Worker runner，Chromium 155（`--headless=new`）+ 一次性 CDP 客户端（按组织 browser-verification Skill，**不入库**），安装 `fonts-noto-cjk` 渲染中文。
> 这些是**评审证据快照**，不是产品源码；源码见 [`web/`](../../../../web/)，视觉基线见 [`design.md`](../../../../design.md)。

## 交付内容

- **公共顶栏的常驻结束入口**：共享壳在公共模式的顶栏（滚动区之外）放入「结束体验并清除」；G00 首页、活动目录、活动详情都能看到并点击，个人模式不渲染该入口。
- **人人看得懂的二次确认面板**：说明确认后会清除的临时内容、不会保存的内容，以及「设备级缓存、系统账号、摄像头 / 麦克风复位尚未接入」的边界；提供「取消，继续体验」与「确认结束并清除」两条明确路径。
- **示例空闲超时入口**：面板内单独提供「模拟空闲超时」，并说明它与主动结束使用同一条清理规则；不是真实设备空闲计时器。
- **统一清理规则**：主动确认与模拟超时都调用 [`web/assets/app.js`](../../../../web/assets/app.js) 的同一个 `endPublicSession(reason)`：
  - 释放 C01 本机预览状态、清空 C01 → C02 交接草稿；
  - 清空示例购物车与会话内观看选择；
  - 清空所有场景 DOM 缓存、各场景滚动位置和待打开详情；
  - 用**新建的** G00 正文替换页面，并在页面顶部显示「已结束 / 已模拟超时」的可见反馈。
- **下一位访客的干净状态**：结束后重新进入活动目录，关键词、筛选结果、打开的详情和报名接力都不会恢复；G00 的 AI 趣玩示例也回到干净的会话内样本。
- **公共 / 私人边界不变**：公共终端仍不能进入 `home`、`mine`、`create`、`shop`、`cart` 等私人路由；面板与 G00 都不渲染个人姓名、设置入口或私人订单。
- **示例标识不变**：公共 AI 趣玩仍是「预生成示例作品 · 非真实 AI 生成」；所有活动 / 福利仍是虚构示例，报名仍是 S1 模拟。
- **C02 卡片按钮去歧义**：原 G00 AI 趣玩卡片里的「结束体验并清除」改为「清除本示例作品」，避免它看起来像整机清理；整次体验结束统一走顶栏入口。C02 证据是当时行为的历史快照，X01 以本页为准。

## 改动表面

- [`web/components/public-session-end.js`](../../../../web/components/public-session-end.js)：新增入口、二次确认面板、取消 / 模拟超时 / 确认动作；不读写存储、不发请求。
- [`web/components/app-shell.js`](../../../../web/components/app-shell.js)：公共顶栏挂入结束入口；打开面板时把背景设为 `inert`；暴露结束面板方法；结束前后保持同一套公共壳和主题。
- [`web/assets/app.js`](../../../../web/assets/app.js)：新增 `endPublicSession(reason)` 统一清理规则，接入共享壳回调；G00 结束反馈。
- [`web/pages/public.js`](../../../../web/pages/public.js)：G00 接收并显示结束 / 超时反馈。
- [`web/data/fixtures/public.fixture.js`](../../../../web/data/fixtures/public.fixture.js)：公共体验卡片按钮改为「清除本示例作品」，并指引整次结束入口。
- [`web/assets/components.css`](../../../../web/assets/components.css)：入口、确认面板、反馈与窄屏样式；只使用既有语义 token，无 A/B 分叉。
- [`tests/public-session-end.test.mjs`](../../../../tests/public-session-end.test.mjs)：确认 / 取消 / 模拟超时、入口可见性、下一访客干净状态、私人路由隔离。

## 复现命令

```bash
npm ci --no-audit --no-fund
npm run check      # ESLint + Prettier + tsc(checkJs,strict) + node --check + node --test
npm run preview    # http://127.0.0.1:4173/
```

浏览器关键路径（一次性 CDP 客户端，**不入库**；点击使用真实指针事件，读取计算样式与可见矩形）：

`?device=public&dir=a` → G00 读取顶栏入口 → 进活动目录 → 筛选「太极」→ 打开详情 →
点「结束体验并清除」→ 读取确认面板 / 背景 `inert` → 取消并验证筛选与详情仍在 →
切 B 主题重复确认面板 → 回 A → 确认结束 → G00 读取清除反馈 → 再进活动目录验证干净状态 →
重新留下筛选 / 详情 → 打开面板点「模拟空闲超时」→ G00 读取超时反馈 → 再进活动目录验证干净状态。

原始断言结果见 [`results.json`](results.json)。

## 结果

- **质量门禁**：`npm ci --no-audit --no-fund` + `npm run check` 真实执行、退出码 0；Node 测试器 **150/150** 通过（新增 5 项 X01 覆盖，既有 145 项未删除、未弱化）。
- **入口与确认（验收 1）**：G00、活动目录、活动详情都可见并真实点击「结束体验并清除」；面板列出会清除的访客临时内容，三个动作（取消 / 模拟超时 / 确认）都可见，背景 `inert`；取消后筛选「太极」、打开的详情原样保留；确认后回到 G00。
- **统一清理与下一位访客（验收 2）**：确认后 `data-session-feedback="cleared"`；重新进入活动目录时关键词为空、6 条示例全部恢复、详情收起、报名视图不存在。模拟空闲超时后 `data-session-feedback="timeout"`，再次进入同样干净；两条路径都走同一 `endPublicSession`。
- **公私边界与示例真实性（验收 3）**：公共流程全程没有挂载 `.jq-home-body`、`.jq-user` 或 `[data-open-settings]`；公共 AI 趣玩仍显示「预生成示例作品 · 非真实 AI 生成」；无真实订单 / 账户 / 活动报名写入。
- **A/B 单套结构**：B「暖夜剧场」下确认面板仍是同一套 `.jq-session-end__` DOM，只切换根 `data-dir`；取消 / 确认、文案和边界不变。
- **浏览器健康**：31 项浏览器断言全部通过；`Runtime.exceptionThrown`、`console.error`、浏览器 `Log.entryAdded(error)` 均为 0；网络请求全部为本机 `127.0.0.1:4173` 静态资源，无外部域名、无上传请求；公共模式启动后 `localStorage` 为 0。

## 截图（真实视口 1600×900）

| 文件 | 内容 |
| --- | --- |
| [x01-public-g00-a.png](x01-public-g00-a.png) | G00 公共首页：顶栏常驻「结束体验并清除」，无个人身份 / 设置入口 |
| [x01-public-activity-filtered-a.png](x01-public-activity-filtered-a.png) | 访客留下的真实临时状态：关键词「太极」+ 1 条命中 |
| [x01-public-activity-detail-a.png](x01-public-activity-detail-a.png) | 访客打开的公共活动详情，顶栏结束入口仍可见 |
| [x01-public-end-confirm-a.png](x01-public-end-confirm-a.png) | A 主题二次确认面板：清除范围、设备级边界、取消 / 模拟超时 / 确认 |
| [x01-public-end-confirm-b.png](x01-public-end-confirm-b.png) | B「暖夜剧场」下同一套确认面板，只换主题 token |
| [x01-public-cleared-a.png](x01-public-cleared-a.png) | 主动确认后回到 G00，显示「已结束并清除」反馈与干净示例 |
| [x01-public-timeout-a.png](x01-public-timeout-a.png) | 模拟空闲超时后回到 G00，显示「同一清理规则」反馈 |
| [x01-public-revisited-clean-a.png](x01-public-revisited-clean-a.png) | 下一位访客重新进入活动目录：关键词、详情、筛选都从干净状态开始 |

## 未覆盖 / 验证缺口

- **不做真实 Android 设备级清理**：未实现系统缓存、WebView 存储、系统账号、摄像头 / 麦克风或进程级复位；面板明确写出该边界。
- **模拟空闲超时是显式入口，不是真实空闲计时器**：没有后台 `setTimeout` 自动清屏，也没有真机休眠 / 息屏联动；这属于设备部署策略，当前卡不假设。
- **不承诺远端删除**：没有账户、后端或远端作品存储，清理只影响当前页面会话。
- 浏览器截图不能替代真实大屏 / WebView 触摸、横竖屏、对比度与读屏器实机验收（`design.md` §7）。
- 交互证据来自一次性 CDP 客户端，未入库为可重复执行的浏览器测试；`npm test` 在 Fake DOM 层断言结构、状态与清理规则。
- 字体为 Noto Sans/Serif CJK SC，与目标设备实际字体可能有细微差异。
