import { requestClient, type ApiResponse, type Envelope } from '@/utils/request';
import { API_BASE_URL, API_MODULE } from '@/constants/api';
import { STORAGE_KEYS } from '@/constants/storage';
import type { StoredUserInfo } from '@/utils/auth';

/** 登录返回的用户对象（2026-09-09 真实接口实测字段） */
export interface LoginResult {
  yonghuid: number;
  dengluming: string;
  yonghuxingming: string;
  jueseid?: number;
  jueseming?: string;
  bumenid?: number;
  bumenming?: string;
  qiyong?: number;
  touxiang?: string | null;
  token: string;
  debug?: boolean;
}

const USER = `/${API_MODULE.USER}`;

/**
 * 登录（apiuser/login）
 * @param username 用户名
 * @param encryptedPassword 已加密密码（hexHmacMd5('cds', pwd)），禁止明文入参
 */
export function apiLogin(username: string, encryptedPassword: string): Promise<Envelope<LoginResult>> {
  return requestClient.get<LoginResult>(`${USER}/login`, {
    username,
    password: encryptedPassword,
  }, { withAuth: false });
}

/** 用户信息（apiuser/userinfo，需用户 token） */
export function apiUserinfo(): Promise<Envelope<LoginResult>> {
  return requestClient.get<LoginResult>(`${USER}/userinfo`);
}

/** 退出系统（apiuser/exit，需用户 token） */
export function apiExit(): Promise<Envelope<null>> {
  return requestClient.get<null>(`${USER}/exit`);
}

/** 修改密码（apiuser/xiugaimima，需用户 token；mima 为已加密密码，后端要求 ≥6 位明文长度） */
export function apiXiugaimima(encryptedPassword: string): Promise<Envelope<null>> {
  return requestClient.get<null>(`${USER}/xiugaimima`, { mima: encryptedPassword });
}

/** 用户详情（apiuser/listinfo，仅本人可见） */
export function apiListinfo(sysyonghuid: number, sysjiegouid?: number): Promise<Envelope<StoredUserInfo>> {
  return requestClient.get<StoredUserInfo>(`${USER}/listinfo`, {
    sysyonghuid,
    ...(sysjiegouid ? { sysjiegouid } : {}),
  });
}

/**
 * 修改头像（apiuser/touxiang）
 * 多部分 MIME 文件流上传，Header 带用户 token；返回 obj=文件路径
 */
export function apiTouxiang(filePath: string): Promise<Envelope<string>> {
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: `${API_BASE_URL}${USER}/touxiang`,
      filePath,
      name: 'file',
      header: { token: (uni.getStorageSync(STORAGE_KEYS.TOKEN) as string) || '' },
      success: (res) => {
        try {
          const body = JSON.parse(res.data) as ApiResponse<string>;
          if (body.success === true || body.success === 'true') {
            resolve({ obj: body.obj ?? '', list: null, js: body.js || '', msg: body.msg || '' });
          } else {
            reject(new Error(body.msg || '头像上传失败'));
          }
        } catch {
          reject(new Error('头像上传响应解析失败'));
        }
      },
      fail: (err) => reject(new Error(err.errMsg || '头像上传失败')),
    });
  });
}
