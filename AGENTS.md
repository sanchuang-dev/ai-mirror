# 本仓库协作约束

继承 [三创组织 AGENTS.md](https://github.com/sanchuang-dev/.github/blob/main/AGENTS.md) 及工作项生命周期规范。

1. **单一事实源**：产品决策在 docs/product/；工程工作结果在 Issue；代码与运行配置是技术现实。Word/PDF 仅作导出，不与 Markdown 双重维护。
2. **项目范围**：AI 镜面五端及共享用户/会员/商家服务能力；闺蜜机为首要交付。这里是独立项目源仓库，不是 base-prototype 多项目展示仓库。
3. **当前为原型/设计阶段**：ENG-02（Issue #5）仅授权搭建工程骨架和质量门禁；未经对应卡明确授权，不开展业务页面、真实支付/AI 接入或部署。
4. **环境与分支例外**：`dev`/`test`/`prod` 已建立，按 `feat/* → dev → test → prod` 分离研发、验收和发布；`main` 是文档/默认分支，**不是工程环境或生产发布落点**。ENG-01 的 bootstrap-only 例外仅允许 Issue #4 在 `main` 交付文档 PR，不得复用于 ENG-02 或任何业务开发。后续工程方案与发布边界见 [前端与工程基线契约](docs/engineering/frontend-baseline.md)，正式工程入门见 [ENG-02](docs/engineering/web-bootstrap.md)。所有开发 PR 以 `dev` 为 base，晋级另行授权。
5. **数据与可信演示**：公共设备与私人设备的数据/记忆隔离；AI 服务能力如为 Mock 必须可见标记；健康/新闻/付费内容须遵循对应合法合规约束。
6. **外部合作**：不开发养老院内部基建；外部内容/服务商通过我们的平台提供供给，商品与服务经平台商城交易；交易授权和履约责任不混淆。
