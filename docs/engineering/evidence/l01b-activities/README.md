# L01-B 活动 / 福利共用详情与 G00 公共入口 · 验收证据（Issue #49）

> 采集日期：2026-10-19 · 基线：`dev` @ `4f1b204dd4ef4e46ae4804275767a45765c2eb37`（L01-A #13 / #54 合并后）
> 采集环境：本 Worker runner，Chromium 155（`--headless=new`）+ 一次性 CDP 客户端（按组织 browser-verification Skill，**不入库**），安装 `fonts-noto-cjk` 渲染中文；视口 1600×900。
> 这些是**评审证据快照**，不是产品源码；源码见 [`web/`](../../../../web/)，视觉契约见 [`design.md`](../../../../design.md)，主题 Token 见 [`web/assets/tokens.css`](../../../../web/assets/tokens.css)。
> 本卡只交付「目录 → 同一份详情 → 返回」的 S1 浏览闭环与 G00 公共入口；**不做** L02 报名确认 / 手机接力 / 二维码 / 核销，不接真实 API / GPS / 支付，不迁移框架。

## 交付内容

- 在 [`web/pages/activities.js`](../../../../web/pages/activities.js) 内补齐**一套共用详情视图**：目录卡片「查看详情 ›」在场景内展开详情，`‹ 返回目录` 回到原列表；分类与关键词筛选状态保留（DOM 不重建）。
- 详情展示名称、时间、地点、区域、参加资格、提供方、免费 / 示例价格；空白字段统一显示「未提供 / 演示待确认」；固定提示名额、实时余量与到达时间未提供，不编造机构背书或真实余量。
- 数据仍来自唯一活动事实源 [`web/data/fixtures/activities.fixture.js`](../../../../web/data/fixtures/activities.fixture.js)，个人与公共设备使用同一 `id` 与同一份字段，不另建公共详情或第二份 Fixture。
- **G00 公共入口**：[`web/pages/public.js`](../../../../web/pages/public.js) 的「现在可报名」与「便民福利」各加一个目录入口（`全部活动 ›` / `全部福利 ›`），进入同一 L01 目录与同一详情。
- **公共权限边界**：[`web/assets/app.js`](../../../../web/assets/app.js) 仅放行 `public` 与 `activity` 两个非个人路由；`?device=public` 进入目录 / 详情时 `jq-header--public` 保持不变，无个人姓名、设置、AI 常驻入口或私人数据；目录返回按钮回到 G00。
- **报名衔接**：详情提供「报名（L02 待实现）」入口，点击只说明不会提交身份、不会生成核销凭证、不会记录任何报名状态，不显示报名成功。

## 复现命令

```bash
npm ci --no-audit --no-fund
npm run check      # ESLint + Prettier + tsc(checkJs,strict) + node --check + node --test
npm run preview    # http://127.0.0.1:4173/
```

浏览器关键路径经一次性 CDP 客户端完成（按 browser-verification Skill **不入库**）：
个人 `?dir=a` → 首页 `[data-route="activity"]` → 选「福利」+ 关键词「理发」→ `[data-action="activity-detail"]`
→ 读详情字段 / `[data-action="activity-signup"]` 反馈 / 切 B 主题 → `[data-action="activity-detail-back"]`
→ 校验分类、关键词与列表；公共 `?device=public` → G00 `[data-route="activity"]` → 详情 → 返回目录 → 返回 G00。
原始断言结果见 [`results.json`](results.json)；采集时 `Runtime.exceptionThrown` 与 `console.error` 均为空。

## 结果

- **质量门禁**：`npm ci --no-audit --no-fund && npm run check` 真实执行、退出码 0；Node 测试器 **99/99** 通过（既有检查未删除、未弱化；新增覆盖共用详情字段、返回保留筛选、缺失字段回退、公共壳内详情、G00 入口与离开场景时收起详情）。
- **个人路径（验收 1）**：首页 → L01 目录 → 任选样本详情 → 返回；详情显示时间 / 地点 / 区域 / 参加资格 / 提供方 / 示例价格，返回后分类仍为「福利」、关键词仍为「理发」、列表仍为 `lifa`。
- **公共路径（验收 2）**：G00「全部活动 ›」进入同一目录，打开「晨练太极」同一详情，再返回目录与 G00；全程 `jq-header--public`、无 `.jq-user` / 设置入口 / 个人首页。
- **A/B 与示例边界（验收 3）**：A/B 主题下详情均可读，切换主题不重建详情、不丢状态；所有数据显著标注「示例 / 虚构」；点击「报名（L02 待实现）」不产生已报名状态或报名成功。
- **无 JS 错误**：`Runtime.exceptionThrown` / `console.error` 为空。

## 截图（均真实视口 1600×900）

| 文件 | 内容 |
| --- | --- |
| [l01b-personal-directory-filtered-a.png](l01b-personal-directory-filtered-a.png) | 个人 A：目录筛选「福利 + 理发」命中 `lifa`，卡片有「查看详情 ›」 |
| [l01b-personal-detail-a.png](l01b-personal-detail-a.png) | 个人 A：`便民理发` 共用详情与全部必填字段、示例边界 |
| [l01b-personal-detail-b.png](l01b-personal-detail-b.png) | 个人 B：同一详情在「暖夜剧场」下可读，状态未丢 |
| [l01b-public-g00-a.png](l01b-public-g00-a.png) | G00 公共首页：「现在可报名」首屏可见「全部活动 ›」入口 |
| [l01b-public-directory-a.png](l01b-public-directory-a.png) | 公共壳内打开同一目录，返回按钮为「‹ 返回公共首页」 |
| [l01b-public-detail-a.png](l01b-public-detail-a.png) | 公共 A：G00 → 目录 → 同一详情，无个人身份 / 设置入口 |
| [l01b-public-detail-b.png](l01b-public-detail-b.png) | 公共 B：同一详情在公共壳内可读 |

## 未覆盖 / 验证缺口

- 浏览器截图**不能**替代真实 Android 大屏 / WebView 触摸、对比度与读屏器实机验收（`design.md` §7）。
- 交互证据来自一次性 CDP 客户端，未入库为可重复执行的浏览器测试；`npm test` 只在 Fake DOM 层断言结构与状态。
- 「便民福利」目录入口在 G00 首屏下方，需向下滚动可见；本次仅截图首屏，未单独截图其视口位置。
- 字体为 Noto Sans/Serif CJK SC，与目标设备实际字体（苹方 / 宋体）可能有细微差异。
- L02 报名确认、手机接力、二维码与核销仍属后续卡；公共设备清屏 / 空闲复位仍属 X01。
