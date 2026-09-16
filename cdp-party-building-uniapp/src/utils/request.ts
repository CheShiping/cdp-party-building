import { isH5 } from './platform';
import { API_BASE_URL, TOKEN_HEADER } from '@/constants/api';
import {
  getToken,
  handleUnauthorized,
  isAuthErrorMessage,
  isTokenFresh,
} from './auth';

/**
 * 统一请求层（feat-003）：
 * - 基址来自 .env VITE_BASE_URL（https://szdj.cdszxjc.com/），模块前缀由调用方拼接
 * - 鉴权：登录返回的用户 token 放 HTTP Header `token`（2026-09-09 后端实测确认）
 * - token 超过一天有效期时，通过 relogin 钩子静默重新获取（auth.service 注册）
 * - 响应信封：{ success, msg, obj, list, js }
 */

export interface ApiResponse<T = unknown> {
  success: boolean | string;
  msg?: string | null;
  obj?: T | null;
  list?: T[] | null;
  js?: string | null;
}

export interface Envelope<T = unknown> {
  /** 单对象数据 */
  obj: T | null;
  /** 列表数据 */
  list: T[] | null;
  /** 解释信息 */
  js: string;
  msg: string;
}

type RequestData = Record<string, unknown>;

export interface RequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: RequestData;
  headers?: Record<string, string>;
  /** 是否携带用户 token（默认 true；登录接口传 false） */
  withAuth?: boolean;
  /** 是否自动 toast 错误信息（默认 true） */
  showError?: boolean;
  timeout?: number;
}

function isSuccess(success: ApiResponse['success']): boolean {
  return success === true || success === 'true';
}

function toEnvelope<T>(data: ApiResponse<T>): Envelope<T> {
  return {
    obj: (data.obj ?? null) as T | null,
    list: (data.list ?? null) as T[] | null,
    js: data.js || '',
    msg: data.msg || '',
  };
}

// ---------------------------------------------------------------------------
// 静默续期钩子：由 auth.service 注册，避免 request ↔ api 循环依赖
// ---------------------------------------------------------------------------
type ReloginHook = () => Promise<boolean>;
let reloginHook: ReloginHook | null = null;

export function registerReloginHook(hook: ReloginHook | null): void {
  reloginHook = hook;
}

async function ensureFreshToken(): Promise<boolean> {
  const token = getToken();
  if (!token) {
    handleUnauthorized();
    return false;
  }
  if (isTokenFresh()) return true;
  // token 超过一天：静默重新获取；失败则走 401 统一处理
  if (reloginHook) {
    try {
      const ok = await reloginHook();
      if (ok) return true;
    } catch {
      // 落入统一处理
    }
  }
  handleUnauthorized();
  return false;
}

async function request<T>(options: RequestOptions): Promise<Envelope<T>> {
  const { withAuth = true, showError = true } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (withAuth) {
    const ok = await ensureFreshToken();
    if (!ok) {
      return Promise.reject(new Error('未登录或登录已过期'));
    }
    headers[TOKEN_HEADER] = getToken();
  }

  return new Promise<Envelope<T>>((resolve, reject) => {
    uni.request({
      url: `${API_BASE_URL}${options.url}`,
      method: options.method || 'GET',
      data: options.data,
      header: headers,
      timeout: options.timeout || 15000,
      success: (res) => {
        if (res.statusCode === 401 || res.statusCode === 403) {
          handleUnauthorized();
          reject(new Error('未登录或登录已过期'));
          return;
        }
        if (res.statusCode < 200 || res.statusCode >= 300) {
          const message = `请求失败: ${res.statusCode}`;
          if (showError) uni.showToast({ title: message, icon: 'none' });
          reject(new Error(message));
          return;
        }

        const body = res.data as ApiResponse<T>;
        if (isSuccess(body?.success)) {
          resolve(toEnvelope(body));
          return;
        }

        const message = body?.msg || '操作失败';
        if (withAuth && isAuthErrorMessage(message)) {
          handleUnauthorized();
          reject(new Error(message));
          return;
        }
        if (showError) uni.showToast({ title: message, icon: 'none' });
        reject(new Error(message));
      },
      fail: (err) => {
        const message = isH5()
          ? '网络异常，请检查跨域或代理配置'
          : '网络异常，请稍后重试';
        if (showError) uni.showToast({ title: message, icon: 'none' });
        reject(new Error(`${message}(${err.errMsg || ''})`));
      },
    });
  });
}

/**
 * 裸文本请求：`apituwen/tuwenneirong` 直接返回 HTML（Content-Type: text/html，非 JSON 信封，2026-09-16 实测），
 * 因此不能走信封解析。dataType: 'text' 避免小程序端自动 JSON.parse 导致内容丢失。
 */
async function requestText(url: string, options: Partial<RequestOptions> = {}): Promise<string> {
  const { withAuth = true, showError = true } = options;

  const headers: Record<string, string> = { ...options.headers };

  if (withAuth) {
    const ok = await ensureFreshToken();
    if (!ok) {
      return Promise.reject(new Error('未登录或登录已过期'));
    }
    headers[TOKEN_HEADER] = getToken();
  }

  return new Promise<string>((resolve, reject) => {
    uni.request({
      url: `${API_BASE_URL}${url}`,
      method: 'GET',
      header: headers,
      dataType: 'text',
      timeout: options.timeout || 15000,
      success: (res) => {
        if (res.statusCode === 401 || res.statusCode === 403) {
          handleUnauthorized();
          reject(new Error('未登录或登录已过期'));
          return;
        }
        if (res.statusCode < 200 || res.statusCode >= 300) {
          const message = `请求失败: ${res.statusCode}`;
          if (showError) uni.showToast({ title: message, icon: 'none' });
          reject(new Error(message));
          return;
        }
        const body = res.data;
        resolve(typeof body === 'string' ? body : body ? JSON.stringify(body) : '');
      },
      fail: (err) => {
        const message = isH5()
          ? '网络异常，请检查跨域或代理配置'
          : '网络异常，请稍后重试';
        if (showError) uni.showToast({ title: message, icon: 'none' });
        reject(new Error(`${message}(${err.errMsg || ''})`));
      },
    });
  });
}

export const requestClient = {
  /** GET：data 作为 query 参数 */
  get: <T = unknown>(url: string, data?: RequestData, options?: Partial<RequestOptions>) =>
    request<T>({ url, method: 'GET', data, ...options }),
  /** GET 裸文本（HTML 等非信封响应） */
  text: (url: string, options?: Partial<RequestOptions>) => requestText(url, options),
  post: <T = unknown>(url: string, data?: RequestData, options?: Partial<RequestOptions>) =>
    request<T>({ url, method: 'POST', data, ...options }),
  put: <T = unknown>(url: string, data?: RequestData, options?: Partial<RequestOptions>) =>
    request<T>({ url, method: 'PUT', data, ...options }),
  delete: <T = unknown>(url: string, data?: RequestData, options?: Partial<RequestOptions>) =>
    request<T>({ url, method: 'DELETE', data, ...options }),
};

export { request };
