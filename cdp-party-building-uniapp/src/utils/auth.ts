import { STORAGE_KEYS } from '@/constants/storage';
import { TOKEN_TTL_MS } from '@/constants/api';

/** 登录凭据（password 为 HMAC-MD5 加密结果，禁止存明文，A03） */
export interface StoredCredentials {
  username: string;
  /** 已加密密码（hexHmacMd5 结果） */
  password: string;
}

export interface StoredUserInfo {
  yonghuid: number;
  dengluming: string;
  yonghuxingming: string;
  jueseid?: number;
  jueseming?: string;
  bumenid?: number;
  bumenming?: string;
  qiyong?: number;
  /** 头像路径（接口返回则用接口值，不变式 9） */
  touxiang?: string | null;
}

export function getToken(): string {
  try {
    return (uni.getStorageSync(STORAGE_KEYS.TOKEN) as string) || '';
  } catch {
    return '';
  }
}

export function setToken(token: string): void {
  uni.setStorageSync(STORAGE_KEYS.TOKEN, token);
  uni.setStorageSync(STORAGE_KEYS.LOGIN_TIME, Date.now());
}

export function getLoginTime(): number {
  try {
    return (uni.getStorageSync(STORAGE_KEYS.LOGIN_TIME) as number) || 0;
  } catch {
    return 0;
  }
}

/** token 是否在一天有效期内（feat-003：登录缓存登录时间，超一天需重新获取） */
export function isTokenFresh(): boolean {
  const loginTime = getLoginTime();
  if (!loginTime) return false;
  return Date.now() - loginTime < TOKEN_TTL_MS;
}

export function getUserInfo(): StoredUserInfo | null {
  try {
    const raw = uni.getStorageSync(STORAGE_KEYS.USER_INFO) as string;
    return raw ? (JSON.parse(raw) as StoredUserInfo) : null;
  } catch {
    return null;
  }
}

export function setUserInfo(info: StoredUserInfo): void {
  uni.setStorageSync(STORAGE_KEYS.USER_INFO, JSON.stringify(info));
}

export function getCredentials(): StoredCredentials | null {
  try {
    const raw = uni.getStorageSync(STORAGE_KEYS.CREDENTIALS) as string;
    return raw ? (JSON.parse(raw) as StoredCredentials) : null;
  } catch {
    return null;
  }
}

export function setCredentials(credentials: StoredCredentials): void {
  // 仅存 HMAC 加密后的密码，禁止明文（A03）
  uni.setStorageSync(STORAGE_KEYS.CREDENTIALS, JSON.stringify(credentials));
}

export function clearAuthStorage(): void {
  // 保留 LOGIN_REDIRECT，避免回跳丢失（A05）
  [STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER_INFO, STORAGE_KEYS.LOGIN_TIME, STORAGE_KEYS.CREDENTIALS]
    .forEach((key) => {
      try {
        uni.removeStorageSync(key);
      } catch {
        // 忽略清理失败
      }
    });
}

// ---------------------------------------------------------------------------
// 登录回跳
// ---------------------------------------------------------------------------

export function resolveLoginRedirect(): string {
  const pages = getCurrentPages();
  if (!pages.length) return '';
  const current = pages[pages.length - 1]!;
  const options = (current as unknown as { options?: Record<string, string> }).options;
  return `/${current.route}${options ? `?${Object.entries(options).map(([k, v]) => `${k}=${v}`).join('&')}` : ''}`;
}

export function saveLoginRedirect(url: string): void {
  if (!url || !url.startsWith('/pages/')) return;
  try {
    uni.setStorageSync(STORAGE_KEYS.LOGIN_REDIRECT, url);
  } catch {
    // 忽略
  }
}

export function consumeLoginRedirect(): string {
  let url = '';
  try {
    url = (uni.getStorageSync(STORAGE_KEYS.LOGIN_REDIRECT) as string) || '';
    uni.removeStorageSync(STORAGE_KEYS.LOGIN_REDIRECT);
  } catch {
    // 忽略
  }
  return typeof url === 'string' ? url : '';
}

// ---------------------------------------------------------------------------
// 401 统一处理（A04：并发去重，3 秒窗口内只执行一次）
// ---------------------------------------------------------------------------

const UNAUTHORIZED_LOCK_MS = 3000;
let unauthorizedLockUntil = 0;

/** 判断业务错误信息是否属于登录态失效 */
export function isAuthErrorMessage(msg: string): boolean {
  if (!msg) return false;
  return /token|令牌|登录|请先登录|身份/i.test(msg);
}

/** 登录态失效统一入口：保存回跳 → 清理 → 跳登录页 */
export function handleUnauthorized(): void {
  const now = Date.now();
  if (now < unauthorizedLockUntil) return;
  unauthorizedLockUntil = now + UNAUTHORIZED_LOCK_MS;

  const redirectUrl = resolveLoginRedirect();
  if (redirectUrl && !redirectUrl.startsWith('/pages/login')) {
    saveLoginRedirect(redirectUrl);
  }

  clearAuthStorage();

  uni.showToast({ title: '登录已过期，请重新登录', icon: 'none' });
  setTimeout(() => {
    uni.reLaunch({ url: '/pages/login/index' });
  }, 600);
}
