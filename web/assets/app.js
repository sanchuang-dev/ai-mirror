/**
 * 见趣 Web 基线入口。
 *
 * 当前实现 H01 个人首页（单套 DOM + A/B 主题）。其它路由为示例反馈，
 * 详见 web/pages/home.js。入口负责挂载、解析初始主题，并接入个人主题偏好存储。
 */
import { createThemePreferences, resolveInitialTheme } from '../data/preferences.js';
import { mountHome } from '../pages/home.js';

export { mountHome };

/**
 * 既有评审/截图参数：`?dir=b` 直接以 B 主题预览。
 * 它只作初始主题来源之一，不写入存储；个人已保存偏好优先，见 `resolveInitialTheme`。
 * @returns {'a' | 'b' | undefined}
 */
function readThemeFromLocation() {
  if (typeof location === 'undefined') return undefined;
  const dir = new URLSearchParams(location.search).get('dir');
  return dir === 'a' || dir === 'b' ? dir : undefined;
}

if (typeof document !== 'undefined') {
  // 本试点按个人会话接入本地偏好。公共设备的主题权限与默认值仍未确定，
  // 届时应在这一处（或设备模式配置）决定是否提供/读取个人存储，页面无需改动。
  const preferences = createThemePreferences();
  const initialTheme = resolveInitialTheme({
    stored: preferences.read(),
    param: readThemeFromLocation(),
  });
  mountHome(document, initialTheme, preferences);
}
