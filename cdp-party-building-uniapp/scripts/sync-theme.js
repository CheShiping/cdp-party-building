const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const themePath = path.join(root, 'theme.json');

const theme = JSON.parse(fs.readFileSync(themePath, 'utf8'));

// ---------------------------------------------------------------------------
// 色阶生成：与 src/styles/_functions.scss 中的 primary-palette()/gold-palette()
// 保持同一套 mix 公式，确保 JS / SCSS / 校验三方同源。
//   level < 500：混白，权重 ratio = (1000 - level) / 1000 * 0.9（白色占比）
//   level = 500：本色
//   level > 500：混黑，权重 ratio = (level - 500) / 1000 * 0.9（黑色占比）
// 中性阶（neutral）为 theme.json 显式声明的 10 阶（ADR-002），不参与生成。
// ---------------------------------------------------------------------------
const LEVELS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
const MIX_RATIO = 0.9;

function hexToRgb(hex) {
  let s = hex.replace('#', '').trim();
  if (s.length === 3) {
    s = s.split('').map((c) => c + c).join('');
  }
  return {
    r: parseInt(s.slice(0, 2), 16),
    g: parseInt(s.slice(2, 4), 16),
    b: parseInt(s.slice(4, 6), 16),
  };
}

function rgbToHex({ r, g, b }) {
  const to = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

// c1 * w + c2 * (1 - w)，w 为 c1 的权重（对齐 Sass color.mix）
function mixChannel(c1, c2, w) {
  return c1 * w + c2 * (1 - w);
}

function palette(baseHex, level) {
  const base = hexToRgb(baseHex);
  if (level === 500) return rgbToHex(base);
  if (level < 500) {
    const w = ((1000 - level) / 1000) * MIX_RATIO; // 白色权重
    return rgbToHex({
      r: mixChannel(255, base.r, w),
      g: mixChannel(255, base.g, w),
      b: mixChannel(255, base.b, w),
    });
  }
  const w = ((level - 500) / 1000) * MIX_RATIO; // 黑色权重
  return rgbToHex({
    r: mixChannel(0, base.r, w),
    g: mixChannel(0, base.g, w),
    b: mixChannel(0, base.b, w),
  });
}

function buildScale(baseHex) {
  const scale = {};
  for (const level of LEVELS) {
    scale[level] = palette(baseHex, level);
  }
  return scale;
}

// 中性阶：优先 theme.json.colors.neutral 显式 10 阶；否则回退 grayBase 生成（兼容旧配置）
function resolveNeutral(colors) {
  if (colors.neutral) {
    const neutral = {};
    for (const level of LEVELS) {
      const v = colors.neutral[String(level)];
      if (!v) {
        console.error(`[sync-theme] theme.json colors.neutral 缺少 ${level} 阶`);
        process.exit(1);
      }
      neutral[level] = v.toLowerCase();
    }
    return { explicit: true, scale: neutral };
  }
  if (colors.grayBase) {
    console.warn('[sync-theme] 检测到 grayBase（已废弃），回退为生成式灰阶；请迁移到 colors.neutral');
    return { explicit: false, scale: buildScale(colors.grayBase) };
  }
  console.error('[sync-theme] theme.json 缺少 colors.neutral（或 grayBase）');
  process.exit(1);
}

function generateThemeConfig(neutral) {
  const { colors, spacing, font, radius } = theme;

  const lines = [
    '// 主题唯一人工配置入口：由 theme.json 自动生成',
    '// 修改 theme.json 后运行 npm run theme:sync 同步',
    '',
    '// 主色',
    `$theme-primary: ${colors.primary};`,
    '',
    '// 金色（荣誉/档案，党徽金）',
    `$theme-gold: ${colors.gold};`,
    `$theme-gold-light: ${colors.goldLight};`,
    '',
    '// 功能色（原型基色；承载文字时必须用 textSafe 文本安全变体）',
    `$theme-success: ${colors.success};`,
    `$theme-warning: ${colors.warning};`,
    `$theme-error: ${colors.error};`,
    `$theme-info: ${colors.info};`,
    '',
    '// 功能色文本安全变体（WCAG AA，D34）',
    `$theme-text-safe-success: ${colors.textSafe.success};`,
    `$theme-text-safe-warning: ${colors.textSafe.warning};`,
    `$theme-text-safe-error: ${colors.textSafe.error};`,
    `$theme-text-safe-info: ${colors.textSafe.info};`,
    '',
    '// 宫格强调色（仅图标/图形，禁止作文字色）',
    `$theme-accent-red: ${colors.accent.red};`,
    `$theme-accent-amber: ${colors.accent.amber};`,
    `$theme-accent-purple: ${colors.accent.purple};`,
    `$theme-accent-blue: ${colors.accent.blue};`,
    `$theme-accent-coral: ${colors.accent.coral};`,
    `$theme-accent-gold: ${colors.accent.gold};`,
    '',
    '// 浅底色（原型实测）',
    `$theme-soft-primary: ${colors.soft.primary};`,
    `$theme-soft-warm: ${colors.soft.warm};`,
    `$theme-soft-page: ${colors.soft.page};`,
    `$theme-soft-page-alt: ${colors.soft.pageAlt};`,
    `$theme-soft-success: ${colors.soft.success};`,
    '',
    '// 中性显式 10 阶（ADR-002：锚点优先，非生成式）',
    ...LEVELS.map((l) => `$theme-gray-${l}: ${neutral.scale[l]};`),
    '',
    '// 间距基数',
    `$theme-spacing-base: ${spacing.base};`,
    '',
    '// 字体基数',
    `$theme-font-base: ${font.base};`,
    '',
    '// 圆角基数',
    `$theme-radius-base: ${radius.base};`,
    '',
  ];

  const target = path.join(root, 'src/styles/config/_theme-config.scss');
  fs.writeFileSync(target, lines.join('\n'));
  console.log('[sync-theme] generated src/styles/config/_theme-config.scss');
}

function generateColors(primary, gold, neutral) {
  const { colors } = theme;

  const scaleLines = (name, scale) =>
    LEVELS.map((l) => `export const ${name}_${l} = '${scale[l]}';`).join('\n');

  const mapLines = (name) =>
    [`export const ${name} = {`, ...LEVELS.map((l) => `  ${l}: ${name}_${l},`), '};'].join('\n');

  const lines = [
    '// JS 侧主题色常量，由 theme.json 自动生成',
    '// 修改 theme.json 后运行 npm run theme:sync 同步',
    '// 色阶与 SCSS 端 primary-palette()/gold-palette() 同源，禁止手动修改。',
    '',
    '// 主色阶 50 ~ 900（生成式）',
    scaleLines('PRIMARY', primary),
    '',
    mapLines('PRIMARY'),
    '',
    '// 金色阶 50 ~ 900（生成式，基色 gold）',
    scaleLines('GOLD', gold),
    '',
    mapLines('GOLD'),
    '',
    '// 中性显式 10 阶（theme.json.colors.neutral，ADR-002）',
    scaleLines('GRAY', neutral.scale),
    '',
    mapLines('GRAY'),
    '',
    '// 功能色（基色：仅图标/底色/边框；文字一律用 TEXT_SAFE 变体，D34）',
    `export const COLOR_SUCCESS = '${colors.success}';`,
    `export const COLOR_WARNING = '${colors.warning}';`,
    `export const COLOR_ERROR = '${colors.error}';`,
    `export const COLOR_INFO = '${colors.info}';`,
    '',
    '// 功能色文本安全变体（WCAG AA）',
    `export const TEXT_SAFE_SUCCESS = '${colors.textSafe.success}';`,
    `export const TEXT_SAFE_WARNING = '${colors.textSafe.warning}';`,
    `export const TEXT_SAFE_ERROR = '${colors.textSafe.error}';`,
    `export const TEXT_SAFE_INFO = '${colors.textSafe.info}';`,
    '',
    '// 宫格强调色（仅图标/图形）',
    `export const ACCENT_RED = '${colors.accent.red}';`,
    `export const ACCENT_AMBER = '${colors.accent.amber}';`,
    `export const ACCENT_PURPLE = '${colors.accent.purple}';`,
    `export const ACCENT_BLUE = '${colors.accent.blue}';`,
    `export const ACCENT_CORAL = '${colors.accent.coral}';`,
    `export const ACCENT_GOLD = '${colors.accent.gold}';`,
    '',
    '// 浅底色（原型实测）',
    `export const SOFT_PRIMARY = '${colors.soft.primary}';`,
    `export const SOFT_WARM = '${colors.soft.warm}';`,
    `export const SOFT_PAGE = '${colors.soft.page}';`,
    `export const SOFT_PAGE_ALT = '${colors.soft.pageAlt}';`,
    `export const SOFT_SUCCESS = '${colors.soft.success}';`,
    '',
    '// 语义色（全部由色阶/配置派生，禁止写死）',
    'export const COLOR_PRIMARY = PRIMARY_500;',
    'export const COLOR_PRIMARY_LIGHT = PRIMARY_100;',
    'export const COLOR_PRIMARY_DARK = PRIMARY_700;',
    `export const COLOR_GOLD = '${colors.gold}';`,
    `export const COLOR_GOLD_LIGHT = '${colors.goldLight}';`,
    '',
    'export const COLOR_TEXT_PRIMARY = GRAY_900;',
    'export const COLOR_TEXT_SECONDARY = GRAY_600;',
    'export const COLOR_TEXT_TERTIARY = GRAY_500;',
    'export const COLOR_TEXT_DISABLED = GRAY_400;',
    'export const COLOR_TEXT_PLACEHOLDER = GRAY_400;',
    'export const COLOR_TEXT_INVERSE = \'#ffffff\';',
    '',
    `export const COLOR_BG_CARD = '#ffffff';`,
    'export const COLOR_BG_PAGE = SOFT_PAGE;',
    'export const COLOR_BG_PAGE_ALT = SOFT_PAGE_ALT;',
    'export const COLOR_BG_TERTIARY = GRAY_100;',
    'export const COLOR_BG_WARM = SOFT_WARM;',
    'export const COLOR_PRIMARY_SOFT = SOFT_PRIMARY;',
    '',
    'export const COLOR_BORDER = GRAY_200;',
    'export const COLOR_BORDER_LIGHT = GRAY_100;',
    '',
    'export const COLORS = {',
    '  primary: COLOR_PRIMARY,',
    '  primaryLight: COLOR_PRIMARY_LIGHT,',
    '  primaryDark: COLOR_PRIMARY_DARK,',
    '  gold: COLOR_GOLD,',
    '  goldLight: COLOR_GOLD_LIGHT,',
    '  success: COLOR_SUCCESS,',
    '  warning: COLOR_WARNING,',
    '  error: COLOR_ERROR,',
    '  info: COLOR_INFO,',
    '  textPrimary: COLOR_TEXT_PRIMARY,',
    '  textSecondary: COLOR_TEXT_SECONDARY,',
    '  textTertiary: COLOR_TEXT_TERTIARY,',
    '  textDisabled: COLOR_TEXT_DISABLED,',
    '  textInverse: COLOR_TEXT_INVERSE,',
    '  bgCard: COLOR_BG_CARD,',
    '  bgPage: COLOR_BG_PAGE,',
    '  bgPageAlt: COLOR_BG_PAGE_ALT,',
    '  bgTertiary: COLOR_BG_TERTIARY,',
    '  bgWarm: COLOR_BG_WARM,',
    '  border: COLOR_BORDER,',
    '  borderLight: COLOR_BORDER_LIGHT,',
    '};',
    '',
  ];

  const target = path.join(root, 'src/constants/colors.ts');
  fs.writeFileSync(target, lines.join('\n'));
  console.log('[sync-theme] generated src/constants/colors.ts');
}

function generateScaleManifest(primary, gold, neutral) {
  const { colors } = theme;
  const set = new Set();

  for (const level of LEVELS) {
    set.add(primary[level].toLowerCase());
    set.add(gold[level].toLowerCase());
    set.add(String(neutral.scale[level]).toLowerCase());
  }
  for (const key of ['success', 'warning', 'error', 'info', 'gold', 'goldLight']) {
    set.add(String(colors[key]).toLowerCase());
  }
  for (const key of Object.keys(colors.textSafe || {})) {
    set.add(String(colors.textSafe[key]).toLowerCase());
  }
  for (const key of Object.keys(colors.accent || {})) {
    set.add(String(colors.accent[key]).toLowerCase());
  }
  for (const key of Object.keys(colors.soft || {})) {
    set.add(String(colors.soft[key]).toLowerCase());
  }

  const manifest = {
    _comment: '由 sync-theme.js 生成，check-colors.js 用作白名单，禁止手动修改。',
    generatedFrom: 'theme.json',
    allowed: Array.from(set).sort(),
  };

  const target = path.join(root, 'scripts/.theme-scale.json');
  fs.writeFileSync(target, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log('[sync-theme] generated scripts/.theme-scale.json');
  return manifest;
}

// S6 自检：白名单必须覆盖 neutral + 功能色 + textSafe + accent + soft + primary/gold 色阶
function verifyManifest(manifest, primary, gold, neutral) {
  const allowed = new Set(manifest.allowed);
  const missing = [];
  for (const level of LEVELS) {
    for (const [name, scale] of [['primary', primary], ['gold', gold], ['neutral', neutral.scale]]) {
      if (!allowed.has(String(scale[level]).toLowerCase())) {
        missing.push(`${name}-${level}`);
      }
    }
  }
  const { colors } = theme;
  for (const key of ['success', 'warning', 'error', 'info', 'gold', 'goldLight']) {
    if (!allowed.has(String(colors[key]).toLowerCase())) missing.push(`colors.${key}`);
  }
  for (const group of ['textSafe', 'accent', 'soft']) {
    for (const key of Object.keys(colors[group] || {})) {
      if (!allowed.has(String(colors[group][key]).toLowerCase())) missing.push(`${group}.${key}`);
    }
  }
  if (missing.length) {
    console.error(`[sync-theme] 白名单自检失败，缺少：${missing.join(', ')}`);
    process.exit(1);
  }
  console.log('[sync-theme] 白名单自检 OK（neutral + 功能色 + textSafe + accent + soft + primary/gold 色阶）');
}

function main() {
  if (!fs.existsSync(themePath)) {
    console.error('[sync-theme] theme.json not found');
    process.exit(1);
  }

  const neutral = resolveNeutral(theme.colors);
  const primary = buildScale(theme.colors.primary);
  const gold = buildScale(theme.colors.gold);

  generateThemeConfig(neutral);
  generateColors(primary, gold, neutral);
  const manifest = generateScaleManifest(primary, gold, neutral);
  verifyManifest(manifest, primary, gold, neutral);
  console.log('[sync-theme] done');
}

main();
