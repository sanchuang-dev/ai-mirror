# V01 看节目 · 节目频道 / 分类浏览 / 搜索 · 证据（Issue #9，替代候选）

> 采集日期：2026-10-17 · 基线：`dev` @ `2cc28a9fc147f417da65dd37f75a1de29a55e692`
> 采集环境：本 Worker runner，Chromium 155（`--headless=new`，ChromeDriver 155 WebDriver），安装 `fonts-noto-cjk` 渲染中文，窗口 1600×900（视口 1600×757）。
> 这些是**评审证据快照**，不是产品源码；源码见 [`web/`](../../../../web/)，视觉契约见 [`design.md`](../../../../design.md)，主题 Token 见 [`web/assets/tokens.css`](../../../../web/assets/tokens.css)。
> 本卡只交付「看节目」节目目录 / 分类浏览 / 搜索；不扩建 Issue #10 的节目详情 / 选集 / 播放器，也不改首页视觉与公共模式安全边界。

## 交付内容

- 新增 [`web/data/fixtures/programs.fixture.js`](../../../../web/data/fixtures/programs.fixture.js)：**唯一一份** S1 示例节目数据（`全部 / 推荐 / 短剧 / 戏曲 / 老歌` 分类 + 9 个节目海报 + 关键词），经 `web/data/api.js` 出口消费。
- [`web/data/api.js`](../../../../web/data/api.js) 新增 `getProgramContent()` 与异步 `searchPrograms()`：分类与关键词是**组合筛选**（结果同时满足当前分类与关键词），`category: 'all'` 不限制分类。
- 新增 [`web/pages/programs.js`](../../../../web/pages/programs.js)：单套 DOM 的节目目录正文（搜索输入 / 提交 / 清空、分类标签、加载 / 命中 / 无结果 / 失败四态、示例详情入口）。
- [`web/assets/app.js`](../../../../web/assets/app.js) 新增 `programs` / `programs-drama` / `programs-opera` / `programs-music` / `search` 五个正式路由，接入共享场景壳（顶栏分类不再直接跳进固定的 V02 播放场景）。
- [`web/data/fixtures/home.fixture.js`](../../../../web/data/fixtures/home.fixture.js) H01 顶栏「短剧 / 戏曲 / 老歌」改接节目列表；[`web/pages/home.js`](../../../../web/pages/home.js)「今日精选 · 全部」进入 `programs`。
- [`web/assets/components.css`](../../../../web/assets/components.css) 新增海报网格、分类标签、四态与详情样式；颜色 / 留白全部来自 `tokens.css` 变量，无 `a-*` / `b-*` 页面类。

### 本次修复（Review PR #38 两处 P2）

- **Finding 1 · 分类与搜索不一致**：关键词改为**只在当前选中分类内检索**，结果区每次都写出生效分类（如「『老歌』里没有找到与『梁祝』相关的节目」），高亮分类与可见结果永远一致；空结果提供「清空关键词 / 在全部节目里找」真实回退。
- **Finding 2 · 旧详情不失效**：任意一次分类切换 / 关键词提交 / 清空 / 重试都会先关闭旧示例详情并清空其内容，旧 V02 播放入口一并消失；焦点若落在旧详情内则恢复到结果区，`‹ 返回节目列表` 把焦点交回触发的节目卡。

## 复现命令

```bash
npm ci --no-audit --no-fund
npm run check      # ESLint + Prettier + tsc(checkJs,strict) + node --check + node --test
npm run preview    # http://127.0.0.1:4173/
```

交互与截图经一次性 ChromeDriver（WebDriver）脚本驱动（按 browser-verification 约束**不入库**）：`?dir=a|b` 打开 → 点顶栏「短剧」→ 点「戏曲」→ 打开《梁祝》详情 → 切「全部」并搜索「梁祝」→ 切「老歌」（不匹配）→ 清空 → 打开《民乐老歌》→ 返回列表 → 进「搜一搜」→ 打开《朝夕巷》→ 点「去看 V02 示例播放」，每步读取状态并截图。

## 结果

- **质量门禁**：`npm ci --no-audit --no-fund && npm run check` 真实执行、退出码 0；Node 测试器 **49/49** 通过（既有 35 项未删除、未弱化；新增 14 项覆盖分类内搜索命中 / 无命中、清空 / 重试 / 快速切换、旧详情失效与焦点恢复、公共设备隔离、主题不分叉 DOM）。
- **验收 1（首页 → 节目列表 → 筛选 / 搜索 → 详情入口）**：H01 顶栏「短剧」→ `pressedCategory=drama`、4 个短剧海报；「今日精选 · 全部」与「搜一搜」进入目录；搜索「梁祝」命中 `liangzhu`；点节目卡打开示例详情并可返回。A/B 两主题实测相同。
- **Finding 1（分类 / 搜索组合一致）**：`hit` 步骤「在『全部』里找到 1 个与『梁祝』相关的示例节目」；随后切「老歌」得到 `state=empty`、`cards=[]`、`stateTitle=「老歌」里没有找到与「梁祝」相关的节目`，高亮仍为 `oldies`；清空后回到「『老歌』共 2 个示例节目」。分类浏览「短剧」4 项、「戏曲」3 项、「老歌」2 项均与高亮一致。
- **Finding 2（旧详情失效 / 焦点恢复）**：打开《梁祝》详情（`detailOpen=true`、`activeElement=jq-program-detail`）后切「全部」并提交「梁祝」，`detailOpen=false`、`detailTitle=null`、`activeElement=jq-programs__results`，无残留旧内容；点《民乐老歌》后再点「‹ 返回节目列表」，`activeElement=jq-card jq-program-card`（焦点交回触发卡）。
- **详情映射边界**：《朝夕巷》详情 `detailHasV02=true` 且「去看 V02 示例播放」真实跳入 `route=video`、`h1=朝夕巷第 8 集 · 一碗阳春面`；《越剧《梁祝》》《民乐老歌》详情 `detailHasV02=false`，不冒充《朝夕巷》任何一集。
- **主题一致（单套逻辑）**：A/B 两主题 `dir` 分别 `a`/`b`，同一状态推进下类名与结构一致；页面无 `data-dir` 分叉、无 `a-*` / `b-*` 页面类。
- **不溢出 / 无 JS 错误**：所有步骤 `horizontalOverflow=false`；A 主题 `consoleSevere` 唯一一条为浏览器自动请求 `/favicon.ico` 的 404，B 主题为空，无应用脚本 / 样式 / 图片错误。

## 截图（真实视口 1600×757）

| 文件 | 内容 |
| --- | --- |
| [v01-programs-drama-a.png](v01-programs-drama-a.png) / [v01-programs-drama-b.png](v01-programs-drama-b.png) | 短剧分类节目海报墙 A / B（「短剧」高亮） |
| [v01-search-view-a.png](v01-search-view-a.png) / [v01-search-view-b.png](v01-search-view-b.png) | 「搜一搜」进入的全部分类 A / B（9 个示例节目） |
| [v01-search-hit-a.png](v01-search-hit-a.png) / [v01-search-hit-b.png](v01-search-hit-b.png) | 搜索「梁祝」命中《越剧《梁祝》》A / B |
| [v01-search-miss-a.png](v01-search-miss-a.png) / [v01-search-miss-b.png](v01-search-miss-b.png) | 关键词「梁祝」+ 切「老歌」不匹配：无结果状态与回退动作 A / B |
| [v01-program-detail-a.png](v01-program-detail-a.png) / [v01-program-detail-b.png](v01-program-detail-b.png) | 《越剧《梁祝》》示例详情（无 V02 关联）A / B |
| [v01-detail-zhaoxi-a.png](v01-detail-zhaoxi-a.png) / [v01-detail-zhaoxi-b.png](v01-detail-zhaoxi-b.png) | 《朝夕巷》示例详情（有「去看 V02 示例播放」一致映射）A / B |
| [results.json](results.json) | 两主题每个交互步骤的 `route / state / pressedCategory / cards / count / stateTitle / detailOpen / detailTitle / detailHasV02 / activeElement / horizontalOverflow / dir / consoleSevere` |

## 未覆盖 / 验证缺口

- 浏览器截图**不能**替代真实 Android 大屏 / WebView 触摸、对比度与读屏器实机验收（`design.md` §7）。
- 交互证据来自一次性 WebDriver 驱动脚本，未入库为可重复执行的浏览器测试；`npm test` 覆盖的是 Fake DOM 层的结构与状态断言（含焦点恢复）。
- 本轮只截取横屏 1600×900；竖屏 / 大屏触控布局沿用 H01 / T03 已验证的 `orientation: portrait` 收敛规则，未在本卡重复出图。
- 失败态（`error`）由注入式适配器在 Node 测试中验证；真实 `searchPrograms` 为本地 S1 数据，不会失败，接入真实内容服务后才会真实产生该态。
- 字体为本环境 Noto Sans/Serif CJK SC，与目标设备实际字体（苹方 / 宋体）可能有细微差异。
- 本卡为 #9 的**替代候选**；旧 [PR #38](https://github.com/sanchuang-dev/ai-mirror/pull/38) 保持未合并，等待人工验收后另行处理。
