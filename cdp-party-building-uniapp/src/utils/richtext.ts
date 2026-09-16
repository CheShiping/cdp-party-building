import { resolveFileUrl } from '@/api/modules/tuwen';

/**
 * rich-text 正文预处理（feat-008）。
 * 后端 `apituwen/tuwenneirong` 返回的是第三方采集 HTML，存在两类问题：
 * 1. 内联 `font-size/line-height/font-family` 与设计系统冲突（如 18px/42px），
 *    会破坏详情页排版一致性 → 统一剥离，由页面容器样式控制；
 * 2. `img` 相对路径缺少 ossdir 前缀、且带死宽高 → 改为绝对地址 + 宽度自适应。
 * 另外做一次防御性清理（script / on* 事件），rich-text 本身不执行脚本，此处仅收敛输入。
 */

/** 富文本图片统一样式（rich-text 内联样式，单位用 px 更稳） */
export const RICH_TEXT_IMAGE_STYLE =
  'display:block;width:100%;height:auto;margin:12px 0;border-radius:6px;';

/** 被剥离的内联样式声明（版式由页面 token 统一控制） */
const STRIPPED_STYLE_PROPS = /^\s*(font-size|line-height|font-family|text-wrap-mode|white-space|width|height)\s*:/i;

function absolutizeSrc(src: string, ossdir?: string | null): string {
  if (!src) return '';
  if (/^(https?:)?\/\//i.test(src) || src.startsWith('data:')) return src;
  return resolveFileUrl(ossdir, src);
}

function stripInlineStyles(html: string): string {
  return html.replace(/\sstyle\s*=\s*(["'])([\s\S]*?)\1/gi, (_match, _quote, style: string) => {
    const kept = style
      .split(';')
      .filter((decl) => decl.trim() && !STRIPPED_STYLE_PROPS.test(decl))
      .join(';');
    return kept.trim() ? ` style="${kept}"` : '';
  });
}

function normalizeImages(html: string, ossdir?: string | null): string {
  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    const srcMatch = tag.match(/\ssrc\s*=\s*(["'])([^"']*)\1/i);
    const src = absolutizeSrc(srcMatch ? srcMatch[2] : '', ossdir);
    if (!src) return '';
    // 原生宽高（如 width="750"）会撑破容器，统一交给 CSS
    return `<img src="${src}" style="${RICH_TEXT_IMAGE_STYLE}">`;
  });
}

/**
 * 归一化正文 HTML，供 `<rich-text :nodes="html">` 渲染。
 * @param html 接口原始 HTML
 * @param ossdir 文件前缀（详情接口 obj.ossdir，实测为 "ossdir"）
 */
export function normalizeRichText(html: string, ossdir?: string | null): string {
  if (!html) return '';
  let out = html.replace(/<script[\s\S]*?<\/script>/gi, '');
  out = out.replace(/\son[a-z]+\s*=\s*(["'])[\s\S]*?\1/gi, '');
  out = stripInlineStyles(out);
  out = normalizeImages(out, ossdir);
  return out;
}

/** 正文纯文本（用于分享摘要等场景，去掉标签与多余空白） */
export function richTextToPlainText(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&[a-z]+;/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}
