# H01 · 闺蜜机屏幕方向／触控预览补充（2026-10-17）

> 对照：已签收的 H01 / Issue #6（PR #30）和 OpenDesign A/B；本轮只补布局响应与浏览器模拟，不重新设计首页或实现其他业务。
> 设计基准是大型 Android 平板。21.5–32 英寸及竖屏能力来自样机／建议规格讨论，不等于已经确认某台闺蜜机的实际参数。
> 不能用截图或 CSS px 推断实体屏幕大小、观看距离和 Android WebView 运行效果。

## 为什么补测

H01 原来只有横屏 1600×900 的浏览器截图。由于 Android 设备可能采用高 DPR，物理 1080px 宽的屏幕也可能只向 CSS 布局暴露 540px 宽度，必须检查两个层次的竖屏：

| 方向与模拟 CSS 视口 | 主题 | 截图 |
| --- | --- | --- |
| 1080×1920，DPR=1 | A 日光客厅 | [portrait-a-1080x1920.jpg](portrait-a-1080x1920.jpg) |
| 1080×1920，DPR=1 | B 暖夜剧场 | [portrait-b-1080x1920.jpg](portrait-b-1080x1920.jpg) |
| 1920×1080，DPR=1 | A 日光客厅 | [landscape-a-1920x1080.jpg](landscape-a-1920x1080.jpg) |
| 1920×1080，DPR=1 | B 暖夜剧场 | [landscape-b-1920x1080.jpg](landscape-b-1920x1080.jpg) |
| 540×960，DPR=2（等效 1080×1920 物理像素，但非实机） | A 日光客厅 | [portrait-density-a-540x960-css-2x.jpg](portrait-density-a-540x960-css-2x.jpg) |
| 同上 | B 暖夜剧场 | [portrait-density-b-540x960-css-2x.jpg](portrait-density-b-540x960-css-2x.jpg) |

截图由 macOS Google Chrome Headless 的 CDP Emulation.setDeviceMetricsOverride + Page.captureScreenshot 产生；原始 PNG 转为 JPEG（质量 84，尺寸不缩放）方便评审。不会把截图冒充实机拍摄。模拟采用 mobile:false，没有模拟 Android WebView 的独立特性。

## 本轮实际执行

- 检出候选 commit：38b6fcec8db89d75259e74d870dee42f78a06a3f。
- npm ci --no-audit --no-fund，npm run check：均退出 0；现有 ESLint / Prettier / tsc / syntax / Node tests 11/11。
- 六种模拟均验证：window.innerWidth/innerHeight 与目标 CSS 视口一致；根文档、body 和主滚动区无横向溢出；H01 仍有 31 个路由入口、17 张示例影像正常加载；检查 16 个典型可交互目标高度不小于 48 CSS px。
- 六种模拟均用页面 JS 操作：滚动至活动区 → 点击「报名」 → jq-toast 在视口内、不与固定 AI 入口重叠 → 切换 A/B 后反馈仍在 → 关闭按钮生效。Runtime.exceptionThrown 与 console.error 未记录异常。
- 细节数据见 [results.json](results.json)，含各视口实际滚动位置与触控目标数量。
- 测试期间发现 540px CSS 视口下 grid 自动最小内容宽度造成页面 29px 横向溢出，已通过给竖屏 grid 明确 minmax(0, 1fr) 和子项 min-width:0 修复，并重新跑完整六组合格。

## 仍需确认

- 真正的屏幕尺寸、屏幕 DPI、Android CSS 视口与系统字体／缩放设置尚未从指定样机上读取。
- 真实 Android WebView、手指触摸、可触控范围、设备旋转、无障碍读屏、真实观看距离没有验收。
- 540 CSS px 宽度时，导航变为水平可滑动的一行；这是避免拥挤的竖屏预览方案，需要产品负责人在真实设备上感受是否符合适龄体验。
- 此处仅保证布局与操作的浏览器可用性，不宣称老人可读字号已完成可用性验收。
- 为保留 H01 现有演示契约，入口仍提示“示例／未接入”，不制造真实报名或 AI 结果。

本 PR 仅合入后由既有 Pages 流程更新 /ai-mirror/dev/ 线上预览；合并之前 Pages 仍展示当前已签收的旧 dev，截图可先用于评审。
