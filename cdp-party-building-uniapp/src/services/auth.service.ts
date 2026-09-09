import { apiExit, apiLogin, type LoginResult } from '@/api/modules/user';
import { registerReloginHook } from '@/utils/request';
import { encryptPassword } from '@/utils/md5';
import {
  clearAuthStorage,
  consumeLoginRedirect,
  getCredentials,
  getToken,
  getUserInfo,
  isTokenFresh,
  resolveLoginRedirect,
  saveLoginRedirect,
  setCredentials,
  setToken,
  setUserInfo,
  type StoredUserInfo,
} from '@/utils/auth';
import { useUserStore } from '@/stores/modules/user';

/**
 * 认证服务（feat-003 / uniapp-components-skill A01：登录态统一收口）。
 * 登录态规则：登录成功缓存登录时间；token 有效期一天，超期静默重新获取，
 * 获取失败走 401 统一处理（清登录态 → 跳登录页）。
 */

export interface LoginPayload {
  username: string;
  /** 明文密码（仅在内存中短暂存在，提交前已加密，存储/日志均不含明文） */
  password: string;
  /** 是否记住登录凭据（用于超 24h 静默续期），默认 true */
  remember?: boolean;
}

function applyLoginResult(result: LoginResult, remember: boolean, encryptedPwd: string): LoginResult {
  setToken(result.token);
  const info: StoredUserInfo = {
    yonghuid: result.yonghuid,
    dengluming: result.dengluming,
    yonghuxingming: result.yonghuxingming,
    jueseid: result.jueseid,
    jueseming: result.jueseming,
    bumenid: result.bumenid,
    bumenming: result.bumenming,
    qiyong: result.qiyong,
    touxiang: result.touxiang,
  };
  setUserInfo(info);
  if (remember) {
    // 仅存加密后的密码（A03：禁止明文入库）
    setCredentials({ username: result.dengluming || '', password: encryptedPwd });
  }
  useUserStore().setLoginState(result.token, info);
  return result;
}

/** 账号密码登录 */
export async function login(payload: LoginPayload): Promise<LoginResult> {
  const encrypted = encryptPassword(payload.password);
  const res = await apiLogin(payload.username, encrypted);
  const result = res.obj;
  if (!result || !result.token) {
    throw new Error(res.msg || '登录失败');
  }
  return applyLoginResult(result, payload.remember !== false, encrypted);
}

/** 静默续期：用存储的加密凭据重新登录（不出现明文） */
export async function silentRelogin(): Promise<boolean> {
  const credentials = getCredentials();
  if (!credentials || !credentials.username || !credentials.password) return false;
  const res = await apiLogin(credentials.username, credentials.password);
  const result = res.obj;
  if (!result || !result.token) return false;
  setToken(result.token);
  const info: StoredUserInfo = {
    yonghuid: result.yonghuid,
    dengluming: result.dengluming,
    yonghuxingming: result.yonghuxingming,
    jueseid: result.jueseid,
    jueseming: result.jueseming,
    bumenid: result.bumenid,
    bumenming: result.bumenming,
    qiyong: result.qiyong,
    touxiang: result.touxiang,
  };
  setUserInfo(info);
  useUserStore().setLoginState(result.token, info);
  return true;
}

/** 退出登录：服务端 exit + 本地清理（A05：登出必清理） */
export async function logout(): Promise<void> {
  try {
    await apiExit();
  } catch {
    // 服务端退出失败不阻塞本地清理
  }
  clearAuthStorage();
  useUserStore().clearLoginState();
  uni.reLaunch({ url: '/pages/login/index' });
}

/** 启动引导：恢复登录态；token 超期时静默续期 */
export async function bootstrap(): Promise<{ needLogin: boolean }> {
  registerReloginHook(silentRelogin);

  const store = useUserStore();
  const token = getToken();
  const info = getUserInfo();
  store.restoreFromStorage(token, info);

  if (!token) return { needLogin: true };

  if (isTokenFresh()) return { needLogin: false };

  // 超过一天：尝试静默重新获取 token
  try {
    const ok = await silentRelogin();
    return { needLogin: !ok };
  } catch {
    clearAuthStorage();
    store.clearLoginState();
    return { needLogin: true };
  }
}

/** 页面守卫：未登录保存回跳并跳登录页 */
export function requireLogin(): boolean {
  const store = useUserStore();
  if (store.isLogin) return true;

  const redirectUrl = resolveLoginRedirect();
  if (redirectUrl && !redirectUrl.startsWith('/pages/login')) {
    saveLoginRedirect(redirectUrl);
  }
  uni.reLaunch({ url: '/pages/login/index' });
  return false;
}

/** 更新头像（touxiang 接口返回的文件路径），同步 Storage 与 Store（A02） */
export function updateAvatar(url: string): void {
  const info = getUserInfo();
  if (info) {
    const next = { ...info, touxiang: url };
    setUserInfo(next);
    useUserStore().setAvatar(url);
  }
}

/** 登录成功后的回跳 */
export function redirectAfterLogin(): void {
  const redirectUrl = consumeLoginRedirect();
  if (redirectUrl) {
    uni.reLaunch({ url: redirectUrl });
  } else {
    uni.switchTab({ url: '/pages/index/index' });
  }
}
