// JS 侧主题色常量，由 theme.json 自动生成
// 修改 theme.json 后运行 npm run theme:sync 同步
// 色阶与 SCSS 端 primary-palette()/gold-palette() 同源，禁止手动修改。

// 主色阶 50 ~ 900（生成式）
export const PRIMARY_50 = '#f7dfe0';
export const PRIMARY_100 = '#f5d5d6';
export const PRIMARY_200 = '#f0c1c3';
export const PRIMARY_300 = '#ebacaf';
export const PRIMARY_400 = '#e6989c';
export const PRIMARY_500 = '#c82028';
export const PRIMARY_600 = '#b61d24';
export const PRIMARY_700 = '#a41a21';
export const PRIMARY_800 = '#92171d';
export const PRIMARY_900 = '#80141a';

export const PRIMARY = {
  50: PRIMARY_50,
  100: PRIMARY_100,
  200: PRIMARY_200,
  300: PRIMARY_300,
  400: PRIMARY_400,
  500: PRIMARY_500,
  600: PRIMARY_600,
  700: PRIMARY_700,
  800: PRIMARY_800,
  900: PRIMARY_900,
};

// 金色阶 50 ~ 900（生成式，基色 gold）
export const GOLD_50 = '#f5ebda';
export const GOLD_100 = '#f2e5cf';
export const GOLD_200 = '#ecd9b8';
export const GOLD_300 = '#e6cca1';
export const GOLD_400 = '#e0c08a';
export const GOLD_500 = '#bb7600';
export const GOLD_600 = '#aa6b00';
export const GOLD_700 = '#996100';
export const GOLD_800 = '#895600';
export const GOLD_900 = '#784c00';

export const GOLD = {
  50: GOLD_50,
  100: GOLD_100,
  200: GOLD_200,
  300: GOLD_300,
  400: GOLD_400,
  500: GOLD_500,
  600: GOLD_600,
  700: GOLD_700,
  800: GOLD_800,
  900: GOLD_900,
};

// 中性显式 10 阶（theme.json.colors.neutral，ADR-002）
export const GRAY_50 = '#f5f5f5';
export const GRAY_100 = '#f0f0f0';
export const GRAY_200 = '#e5e5e5';
export const GRAY_300 = '#d4d4d4';
export const GRAY_400 = '#acacac';
export const GRAY_500 = '#808080';
export const GRAY_600 = '#666666';
export const GRAY_700 = '#4d4d4d';
export const GRAY_800 = '#3d3d3d';
export const GRAY_900 = '#333333';

export const GRAY = {
  50: GRAY_50,
  100: GRAY_100,
  200: GRAY_200,
  300: GRAY_300,
  400: GRAY_400,
  500: GRAY_500,
  600: GRAY_600,
  700: GRAY_700,
  800: GRAY_800,
  900: GRAY_900,
};

// 功能色（基色：仅图标/底色/边框；文字一律用 TEXT_SAFE 变体，D34）
export const COLOR_SUCCESS = '#4caf50';
export const COLOR_WARNING = '#ffaf10';
export const COLOR_ERROR = '#f55a56';
export const COLOR_INFO = '#7087f1';

// 功能色文本安全变体（WCAG AA）
export const TEXT_SAFE_SUCCESS = '#2e7d32';
export const TEXT_SAFE_WARNING = '#a86400';
export const TEXT_SAFE_ERROR = '#d32f2f';
export const TEXT_SAFE_INFO = '#4a5fc1';

// 宫格强调色（仅图标/图形）
export const ACCENT_RED = '#f55a56';
export const ACCENT_AMBER = '#ffaf10';
export const ACCENT_PURPLE = '#d895f2';
export const ACCENT_BLUE = '#7087f1';
export const ACCENT_CORAL = '#f47451';
export const ACCENT_GOLD = '#bb7600';

// 浅底色（原型实测）
export const SOFT_PRIMARY = '#ffeeee';
export const SOFT_WARM = '#fdf4ed';
export const SOFT_PAGE = '#f5f5f5';
export const SOFT_PAGE_ALT = '#f2f5fa';
export const SOFT_SUCCESS = '#d8f0d0';

// 语义色（全部由色阶/配置派生，禁止写死）
export const COLOR_PRIMARY = PRIMARY_500;
export const COLOR_PRIMARY_LIGHT = PRIMARY_100;
export const COLOR_PRIMARY_DARK = PRIMARY_700;
export const COLOR_GOLD = '#bb7600';
export const COLOR_GOLD_LIGHT = '#cd9c5a';

export const COLOR_TEXT_PRIMARY = GRAY_900;
export const COLOR_TEXT_SECONDARY = GRAY_600;
export const COLOR_TEXT_TERTIARY = GRAY_500;
export const COLOR_TEXT_DISABLED = GRAY_400;
export const COLOR_TEXT_PLACEHOLDER = GRAY_400;
export const COLOR_TEXT_INVERSE = '#ffffff';

export const COLOR_BG_CARD = '#ffffff';
export const COLOR_BG_PAGE = SOFT_PAGE;
export const COLOR_BG_PAGE_ALT = SOFT_PAGE_ALT;
export const COLOR_BG_TERTIARY = GRAY_100;
export const COLOR_BG_WARM = SOFT_WARM;
export const COLOR_PRIMARY_SOFT = SOFT_PRIMARY;

export const COLOR_BORDER = GRAY_200;
export const COLOR_BORDER_LIGHT = GRAY_100;

export const COLORS = {
  primary: COLOR_PRIMARY,
  primaryLight: COLOR_PRIMARY_LIGHT,
  primaryDark: COLOR_PRIMARY_DARK,
  gold: COLOR_GOLD,
  goldLight: COLOR_GOLD_LIGHT,
  success: COLOR_SUCCESS,
  warning: COLOR_WARNING,
  error: COLOR_ERROR,
  info: COLOR_INFO,
  textPrimary: COLOR_TEXT_PRIMARY,
  textSecondary: COLOR_TEXT_SECONDARY,
  textTertiary: COLOR_TEXT_TERTIARY,
  textDisabled: COLOR_TEXT_DISABLED,
  textInverse: COLOR_TEXT_INVERSE,
  bgCard: COLOR_BG_CARD,
  bgPage: COLOR_BG_PAGE,
  bgPageAlt: COLOR_BG_PAGE_ALT,
  bgTertiary: COLOR_BG_TERTIARY,
  bgWarm: COLOR_BG_WARM,
  border: COLOR_BORDER,
  borderLight: COLOR_BORDER_LIGHT,
};
