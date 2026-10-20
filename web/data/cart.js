/**
 * M03 购物车与订单预览的示例状态与金额计算（Issue #17）。
 *
 * 这里只维护**一个内存中的示例购物车条目**：页面刷新或重新挂载即清空，不写
 * localStorage、不建订单、不连接库存 / 地址 / 账号 / 支付服务。商品、规格、店铺与
 * 运费规则仍来自 M01/M02 的同一份商城事实（`web/data/api.js`），本模块不复制商品数据。
 *
 * 运费规则沿用 M02 商品详情已经展示的示例：未满 ¥299 收 ¥12，满 ¥299 示例包邮。
 * 金额只在页面内计算，任何「提交」都只能产生演示回执。
 */
import { getShopProductDetail } from './api.js';

/** @typedef {import('./fixtures/shop.fixture.js').ShopProductDetail} ShopProductDetail */
/** @typedef {import('./fixtures/shop.fixture.js').ShopProductSpec} ShopProductSpec */
/** @typedef {import('./api.js').ShopProductDetailEntry} ShopProductDetailEntry */

/**
 * 一条示例购物车条目：商品 + 规格 + 数量，不携带价格快照（金额始终按当前示例事实重算）。
 * @typedef {object} CartItem
 * @property {string} productId 指向 M01/M02 的稳定商品 id。
 * @property {string} specId 指向该商品 M02 详情中的规格 id。
 * @property {number} quantity 演示数量（至少 1，上限由详情数据声明）。
 */

/**
 * @typedef {object} OrderTotals
 * @property {number} unitPrice 示例单价。
 * @property {number} quantity 已按详情上限收敛的数量。
 * @property {number} subtotal 商品小计。
 * @property {number} shipping 示例运费。
 * @property {number} total 示例合计。
 * @property {number} freeShippingShortfall 距离示例包邮门槛还差多少（已达成为 0）。
 */

/**
 * @typedef {object} CartController
 * @property {(productId: string, specId: string, quantity: number) => CartItem} setItem
 * @property {(quantity: number) => CartItem | null} setQuantity
 * @property {() => CartItem | null} getItem
 * @property {() => void} clear
 */

/**
 * 把输入数量收敛为正整数；真正的数量上限由 `calculateOrderTotals` 按商品详情处理。
 * @param {number} quantity
 * @returns {number}
 */
function normalizeQuantity(quantity) {
  if (!Number.isFinite(quantity)) return 1;
  return Math.max(1, Math.trunc(quantity));
}

/**
 * 按 M02 的示例规则计算订单金额。金额与运费只在这里计算一次，购物车和订单预览共用，
 * 避免两个区域各算一套导致显示不一致。
 * @param {ShopProductDetail} detail
 * @param {number} quantity
 * @returns {OrderTotals}
 */
export function calculateOrderTotals(detail, quantity) {
  const limit = Math.max(1, detail.pricing.quantityLimit);
  const effectiveQuantity = Math.min(normalizeQuantity(quantity), limit);
  const unitPrice = detail.pricing.unitPrice;
  const subtotal = unitPrice * effectiveQuantity;
  const shipping = subtotal >= detail.shipping.freeFrom ? 0 : detail.shipping.fee;
  return {
    unitPrice,
    quantity: effectiveQuantity,
    subtotal,
    shipping,
    total: subtotal + shipping,
    freeShippingShortfall: Math.max(0, detail.shipping.freeFrom - subtotal),
  };
}

/**
 * 创建一个只存在于当前页面会话中的示例购物车。
 * 它不写存储、不跨设备同步，也不暴露商品事实之外的交易状态。
 * @returns {CartController}
 */
export function createCart() {
  /** @type {CartItem | null} */
  let item = null;

  return {
    setItem(productId, specId, quantity) {
      item = { productId, specId, quantity: normalizeQuantity(quantity) };
      return { ...item };
    },
    setQuantity(quantity) {
      if (!item) return null;
      item = { ...item, quantity: normalizeQuantity(quantity) };
      return { ...item };
    },
    getItem() {
      return item ? { ...item } : null;
    },
    clear() {
      item = null;
    },
  };
}

/**
 * @typedef {object} ResolvedCartLine
 * @property {'empty' | 'ok' | 'out-of-stock' | 'unavailable'} status
 * @property {ShopProductDetailEntry | null} entry
 * @property {ShopProductSpec | null} spec
 * @property {OrderTotals | null} totals 只在 `ok` 状态提供，避免无货时仍显示可结算金额。
 */

/**
 * 把购物车条目解析为页面可直接使用的商品 / 规格 / 金额事实。
 * 找不到商品、缺少详情、规格不存在或为无货示例时，一律返回不可结算状态；
 * 页面据此拦截进入订单确认，绝不把无货规格重新算成可支付金额。
 * @param {CartItem | null} item
 * @returns {ResolvedCartLine}
 */
export function resolveCartLine(item) {
  if (!item) return { status: 'empty', entry: null, spec: null, totals: null };

  const entry = getShopProductDetail(item.productId);
  if (!entry || !entry.detail) {
    return { status: 'unavailable', entry, spec: null, totals: null };
  }
  const spec = entry.detail.specs.find((candidate) => candidate.id === item.specId) ?? null;
  if (!spec) return { status: 'unavailable', entry, spec: null, totals: null };
  if (spec.availability !== 'sample') {
    return { status: 'out-of-stock', entry, spec, totals: null };
  }
  return {
    status: 'ok',
    entry,
    spec,
    totals: calculateOrderTotals(entry.detail, item.quantity),
  };
}
