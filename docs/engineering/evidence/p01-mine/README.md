# P01「我的」个人中心 · Worker 验证记录

- 工作项：Issue #18（实现切片，基于 `dev` `77229ee`）
- 执行范围：仅实现「我的」个人中心、记录返回路径与设置入口；不接真实登录 / 支付 / 会员。
- 主题：沿用 A「日光客厅」/ B「暖夜剧场」同一份 DOM 与 `tokens.css` 变量。

## 质量门禁

在工作区执行：

```bash
npm ci --no-audit --no-fund
npm run check
```

结果：ESLint、Prettier、`tsc`、`node --check` 和 `node --test tests/*.test.mjs` 全部通过；
共 **145** 个 Node 测试通过（含新增的 `tests/mine.test.mjs`）。

## 浏览器验证

环境：Chromium **155.0.8059.0**（headless），本地 `npm run preview`（`http://127.0.0.1:4173/`），
视口 **1600×900**。验证环境安装了 `fonts-noto-cjk` 以正确显示中文，不涉及仓库运行依赖。

实际点击路径：

1. 个人首页 `?dir=a` → 顶栏「我的」；
2. 「我的」展示样例身份、会员权益、追剧历史、我的作品、收藏、报名记录、订单示例、
   人格与记忆入口、外观与主题入口；
3. 「打开外观设置」→ 复用 T02 设置面板（A/B 两个选项）；
4. 关闭设置 → 点「追剧历史」记录 → 进入既有 V02 视频场景；
5. 返回「我的」→ 点「我的作品」记录 → 进入既有 C02 作品结果场景；
6. 顶部切换到 B 主题 → 仍是同一个 `.jq-scene--mine`（`sceneCount: 1`）；
7. 「‹ 返回首页」→ 恢复首页；
8. 「社区版预览」→ 公共模式顶栏没有「我的」入口，也没有 `.jq-scene--mine`、
   个人姓名 / 头像或设置入口。

浏览器控制台 **0** 个 `console.error`，**0** 个未捕获异常。

截图：

| 文件 | 内容 |
| --- | --- |
| `p01-home-a.png` / `p01-home-b.png` | 个人首页 A/B，顶栏出现「我的」 |
| `p01-mine-a.png` / `p01-mine-b.png` | 「我的」A/B 首屏 |
| `p01-mine-a-full.png` / `p01-mine-b-full.png` | 「我的」A/B 完整内容（1600×2500 评审截图） |
| `p01-settings-a.png` | 从「我的」复用 T02 外观设置面板 |
| `p01-history-a.png` | 追剧历史记录 → 既有 V02 场景 |
| `p01-works-a.png` | 我的作品记录 → 既有 C02 场景 |
| `p01-activity-a.png` | 「我的」报名记录到活动目录的去向 |
| `p01-return-home-b.png` | 从「我的」返回首页（B 主题保持） |
| `p01-public-a.png` | 公共模式无「我的」/ 私人记录入口 |

机器可读的点击与 DOM 检查结果见 `results.json`。

## 边界与未覆盖

- 以上为桌面 headless Chromium 证据；**不等于** Android 真机 / WebView、触摸或横竖屏验收。
- 会员、订单、报名、观看记录均为显式 S1 示例，不会产生真实购买、订单、报名或播放。
- 空记录状态由单元测试以空数组注入验证；页面默认展示样例记录。
- 本记录不是 Issue 验收、PR 合并、发布或环境晋级授权。
