/** 后端接口契约常量（来源：docx/接口文档.md，AGENTS.md 不变式 1） */

/** 去除首尾斜杠 */
const cleanBase = (v?: string) => (v || '').replace(/\/+$/, '');

/**
 * 接口基址（.env VITE_BASE_URL）
 * - H5 端用 VITE_H5_BASE_URL：开发态为空（走 vite server.proxy 同源代理，规避后端无 CORS 头）
 * - 小程序/App 端用 VITE_BASE_URL：绝对地址直连
 */
export const API_BASE_URL =
  import.meta.env.UNI_PLATFORM === 'h5'
    ? cleanBase(import.meta.env.VITE_H5_BASE_URL)
    : cleanBase(import.meta.env.VITE_BASE_URL);

/** 模块前缀 */
export const API_MODULE = {
  /** 图文模块 */
  TUWEN: 'apituwen',
  /** 留言模块 */
  LIUYAN: 'apiliuyan',
  /** 用户模块 */
  USER: 'apiuser',
} as const;

/** token 在 HTTP Header 中的字段名（后端要求：Header 传入，2026-09-09 实测确认） */
export const TOKEN_HEADER = 'token';

/** 登录返回 token 的有效期（feat-003：缓存登录时间，超过一天重新获取 token） */
export const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

/** 图文类别 ID（后端真实数据，2026-09-09 tuwenleibie 实测） */
export const TUWEN_CATEGORY = {
  /** 首页轮播图 */
  BANNER: 1,
  /** AI 智能推送 */
  AI_PUSH: 2,
  /** 党建专题专栏（父类别，子类 4~9） */
  TOPIC: 3,
  /** 最新活动（党员服务「近期活动」，2026-09-16 实测类别） */
  ACTIVITY: 10,
  /** 通知公告（党务公告，父类别，子类 12 支部公告 / 13 评优评先 / 14 组织关系） */
  NOTICE: 11,
} as const;

/** 图文类别层级说明（tuwenleibie 实测） */
export const TUWEN_PARENT_CATEGORY = [3, 10, 11] as const;
