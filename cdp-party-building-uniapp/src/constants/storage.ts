/** 本地存储 Key 统一管理（uniapp-components-skill A02：Token 只存 Storage） */
const PREFIX = 'cdp_';

export const STORAGE_KEYS = {
  /** 登录返回的用户 token */
  TOKEN: `${PREFIX}token`,
  /** 登录用户信息（JSON） */
  USER_INFO: `${PREFIX}user_info`,
  /** 登录时间戳（毫秒），用于 token 一天有效期判定 */
  LOGIN_TIME: `${PREFIX}login_time`,
  /** 登录凭据（username + 已 HMAC 加密的密码，禁止存明文），用于超 24h 静默续期 */
  CREDENTIALS: `${PREFIX}credentials`,
  /** 401/登出前的页面回跳地址 */
  LOGIN_REDIRECT: `${PREFIX}login_redirect`,
} as const;
