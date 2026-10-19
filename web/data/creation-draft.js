/**
 * C01 → C02 的最少演示交接（**仅内存**，刷新即消失）。
 *
 * C01「模拟生成」后，作品结果页（C02）要知道用户选过什么，才能诚实地说明「输入已抵达结果」。
 * 这里只承载主题与来源类别这类非媒体演示数据，**不包含**：
 * - 本机图片的字节、`blob:` 对象地址或本机文件名；
 * - 任何持久化（localStorage / sessionStorage）或日志。
 *
 * 结果页据此显示「来自你的选择」，但页面上的作品始终是公开授权的**预生成示例作品**，
 * 不会拿私有媒体去伪造生成结果（Issue #12 / C02 输入隐私边界）。
 *
 * @typedef {object} CreationDraft
 * @property {string} themeId C01 选中的主题 id。
 * @property {string} themeTitle C01 选中的主题名（用于结果页说明）。
 * @property {'example' | 'local' | 'text' | null} sourceKind 素材来源类别；未选为 null。
 * @property {string} sampleTitle 示例素材名（仅示例素材来源时有值，仍是公开示例数据）。
 */

/** @type {CreationDraft | null} */
let currentDraft = null;

/**
 * 记录本次创作的交接数据（覆盖上一条，页面刷新即清空）。
 * @param {CreationDraft} draft
 * @returns {void}
 */
export function setCreationDraft(draft) {
  currentDraft = {
    themeId: String(draft.themeId ?? ''),
    themeTitle: String(draft.themeTitle ?? ''),
    sourceKind: draft.sourceKind ?? null,
    sampleTitle: String(draft.sampleTitle ?? ''),
  };
}

/**
 * 读取本次创作交接数据（返回副本，调用方无法改动内部状态）。
 * @returns {CreationDraft | null}
 */
export function readCreationDraft() {
  return currentDraft ? { ...currentDraft } : null;
}

/** 丢弃交接数据：离开结果页 / 放弃 / 重新开始都调用它，避免留下上一位使用者的痕迹。 */
export function clearCreationDraft() {
  currentDraft = null;
}
