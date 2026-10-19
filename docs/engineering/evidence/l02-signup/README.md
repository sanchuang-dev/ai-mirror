# L02 活动报名确认与公共设备手机接力 · 验收证据（Issue #14）

> 采集日期：2026-10-19 · 基线：`dev` @ `85db89670f91966c47ce61d0e20c0d95a508e7ec`（L01-B #49 / M01 #15 合并后）
> 采集环境：本 Worker runner，Chromium 155（`--headless=new --disable-software-rasterizer`）+ 一次性 CDP 客户端（按组织 browser-verification Skill，**不入库**）；安装 `Noto Sans CJK SC` 渲染中文；视口 1600×900。
> 这些是**评审证据快照**，不是产品源码；源码见 [`web/`](../../../../web/)，视觉契约见 [`design.md`](../../../../design.md)，主题 Token 见 [`web/assets/tokens.css`](../../../../web/assets/tokens.css)。

## 交付内容

- 在 [`web/pages/activities.js`](../../../../web/pages/activities.js) 的既有共用详情内补齐 **L02 报名子视图**，个人 / 公共设备仍使用 L01-B 的**同一条活动对象**与同一份字段，不另建公共详情或第二份 Fixture。
- **个人设备**：详情 →「大屏报名」→ 确认摘要（活动、时间、地点、资格、提供方、费用）→「本人确认报名（模拟）」→ 明确标注的模拟结果；「取消，不报名」回到详情并说明没有提交报名、没有产生报名状态、没有占用名额或生成核销凭证。
- **模拟结果**固定标注「S1 演示结果 · 非真实报名回执」，并写明没有发送报名请求、没有占用真实名额、没有生成核销凭证；离开详情不保留结果。
- **公共设备**：不出现本人确认表单，只展示「转到你自己的手机继续」的接力概念、示例二维码、手机侧步骤与隐私说明；二维码标注「不可真实扫码 · 不会建立身份会话」，并提供**超时 / 失败 / 不可用**三个演示反馈和可取消入口。公共屏幕没有任何手机号 / 姓名输入，也不读取或保存身份会话。
- **模拟异常**：名额已满、已报名、活动已取消分别由 [`activities.fixture.js`](../../../../web/data/fixtures/activities.fixture.js) 的 `signupState` 显式标注为演示状态，进入报名前就拦下并说明未接入真实服务，不显示虚假成功。
- **隐私与状态**：报名流程只存在于当前详情 DOM；取消、返回目录或离开活动场景都会移除报名子视图与临时状态，下一位访客重新进入时回到干净详情。公共全局空闲清屏 / 复位仍由 X01 #19 负责，本卡未实施。
- [`web/assets/app.js`](../../../../web/assets/app.js) 传入动态 `isPublicMode`：实际公共设备与个人设备上的「社区版预览」都只走手机接力，避免预览态误显示本人确认表单。
- 报名文案与异常状态集中在 [`activities.fixture.js`](../../../../web/data/fixtures/activities.fixture.js)；[`web/data/notices.js`](../../../../web/data/notices.js) 的旧「L02 尚未实现」提示已同步为 S1 模拟说明。

## 复现命令

```bash
npm ci --no-audit --no-fund
npm run check      # ESLint + Prettier + tsc(checkJs,strict) + node --check + node --test
npm run preview    # http://127.0.0.1:4173/
```

浏览器关键路径经一次性 CDP 客户端完成（按 browser-verification Skill **不入库**）：

- 个人 `?dir=a` → 首页/顶栏 `[data-route="activity"]` → 第一条活动 `[data-action="activity-detail"]`
  → `[data-action="activity-signup"]` → `[data-action="signup-cancel"]` / `[data-action="signup-confirm"]`
  → `[data-action="signup-result-back"]`；并在 B 主题复查同一结果视图。
- 异常：目录中第 2 / 3 / 4 条样本分别演示名额已满、已报名、活动已取消。
- 公共 `?device=public&dir=a` → G00 `[data-route="activity"]` → 详情 → `[data-action="activity-signup"]`
  → `[data-action="signup-demo-timeout" / "signup-demo-failure" / "signup-demo-unavailable"]`
  → `[data-action="signup-handoff-cancel"]` → 返回 G00 → 再次进入活动详情，确认接力视图已清除。

原始断言结果见 [`results.json`](results.json)；本次采集 `Runtime.exceptionThrown` 与 `console.error` 均为空，`passed: true`。

## 结果

- **质量门禁**：`npm ci --no-audit --no-fund && npm run check` 真实执行、退出码 0；Node 测试器 **116/116** 通过（新增覆盖：个人确认 / 取消 / 模拟结果、再次进入不残留状态、三种演示异常、公共手机接力与无输入隐私、超时 / 失败 / 不可用反馈、离开后清除接力视图、A/B 主题不重建确认视图）。
- **验收 1（个人确认 / 取消）**：详情 → 大屏报名 → 确认摘要可读且使用同一条活动；取消后反馈明确「没有提交报名」，DOM 中没有模拟结果，也没有报名状态。
- **验收 2（公共接力与隐私）**：公共壳内只展示手机接力概念与示例二维码；`inputsInSignup` 为 0，无 `.jq-user` / 设置入口；超时、失败、不可用都能切换并说明没有建立身份会话；取消后再次进入详情，`signupStage` 为 `null`。
- **验收 3（异常与真实性）**：名额已满 / 已报名 / 活动取消均为显式演示异常，页面全文不含「报名成功」；模拟结果不含真实回执或核销凭证。
- **A/B 主题**：A「日光客厅」与 B「暖夜剧场」共用同一 DOM、同一状态；切换主题不重建确认 / 结果 / 接力视图。

## 截图（均真实视口 1600×900）

| 文件 | 内容 |
| --- | --- |
| [l02-personal-confirm-a.png](l02-personal-confirm-a.png) | 个人 A：详情 → 大屏报名 → 确认摘要与取消入口 |
| [l02-personal-cancel-a.png](l02-personal-cancel-a.png) | 个人 A：取消后回到详情，明确没有产生报名状态 |
| [l02-personal-result-a.png](l02-personal-result-a.png) | 个人 A：本人确认后的 S1 模拟结果，标注非真实回执 |
| [l02-personal-result-b.png](l02-personal-result-b.png) | 个人 B：同一模拟结果在暖夜剧场下可读，状态未丢 |
| [l02-exception-full-b.png](l02-exception-full-b.png) | B：名额已满演示状态与返回路径 |
| [l02-exception-joined-b.png](l02-exception-joined-b.png) | B：已报名演示状态，不创建重复报名 |
| [l02-exception-cancelled-b.png](l02-exception-cancelled-b.png) | B：活动已取消演示状态，不显示虚假结果 |
| [l02-public-g00-a.png](l02-public-g00-a.png) | 公共 A：G00 公共壳与活动目录入口 |
| [l02-public-handoff-a.png](l02-public-handoff-a.png) | 公共 A：手机接力概念、示例二维码、隐私说明与演示反馈按钮 |
| [l02-public-timeout-a.png](l02-public-timeout-a.png) | 公共 A：演示超时反馈，明确没有建立身份会话 |
| [l02-public-failure-a.png](l02-public-failure-a.png) | 公共 A：演示失败反馈，明确没有保存手机号 / 姓名 / 会话信息 |
| [l02-public-handoff-b.png](l02-public-handoff-b.png) | 公共 B：同一接力视图在暖夜剧场下可读 |
| [l02-public-cancel-b.png](l02-public-cancel-b.png) | 公共 B：取消接力后回到详情，临时状态已清除 |
| [l02-public-revisited-b.png](l02-public-revisited-b.png) | 公共 B：再次进入同一条活动，只看到干净详情，无上一位访客痕迹 |

## 未覆盖 / 验证缺口

- **公共全局清屏 / 空闲复位未实施**：由 X01 #19 负责；本卡只保证报名 / 接力临时 DOM 不持久化、不采集个人信息，离开活动场景后详情与报名视图收起。无法证明无操作空闲后整机自动回 G00。
- 浏览器截图**不能**替代真实 Android 大屏 / WebView 触摸、对比度与读屏器实机验收（`design.md` §7）。
- 交互证据来自一次性 CDP 客户端，未入库为可重复执行的浏览器测试；`npm test` 只在 Fake DOM 层断言结构与状态。
- 示例二维码是 CSS 纹样，不是可解析二维码；这正符合「不可真实扫码 / 不建立身份会话」的 demo 边界。
- 未接入真实手机 H5、身份会话、报名 API、名额、核销或小程序；所有“可报名 / 已满 / 已报名 / 已取消”均为 S1 演示状态。
- 字体为 Noto Sans CJK SC，与目标设备实际字体（苹方 / 宋体）可能有细微差异。
