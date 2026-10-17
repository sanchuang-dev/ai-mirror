/**
 * 见趣 Web 基线入口。
 *
 * 当前实现 H01 个人首页（单套 DOM + A/B 主题）。其它路由为示例反馈，
 * 详见 web/pages/home.js。入口只负责挂载与读取试点用的初始主题。
 */
import { mountHome } from '../pages/home.js';

export { mountHome };

/**
 * 试点用初始主题：`?dir=b` 便于评审与截图；正式「设置 → 外观与主题」入口待实现。
 * @returns {'a' | 'b' | undefined}
 */
function readThemeFromLocation() {
  if (typeof location === 'undefined') return undefined;
  const dir = new URLSearchParams(location.search).get('dir');
  return dir === 'a' || dir === 'b' ? dir : undefined;
}

if (typeof document !== 'undefined') {
  mountHome(document, readThemeFromLocation());
}
