import { requestClient, type ApiResponse, type Envelope } from '@/utils/request';
import { API_BASE_URL, API_MODULE } from '@/constants/api';
import { STORAGE_KEYS } from '@/constants/storage';

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

/** 党员列表项（apiuser/jigouyonghu、apiuser/quanbuyonghu 返回字段，不含敏感信息） */
export interface OrgMember {
  sysyonghuid: number;
  xingming: string;
  sysjiegouid?: number | null;
  dangneizhiwu?: string | null;
  xingzhengzhwu?: string | null;
  jigouming?: string | null;
}

/**
 * 党员档案（apiuser/listinfo 返回字段，2026-09-16 实测）。
 * ⚠ 含敏感信息（登录名/手机号、出生日期等），**仅本人可见**：禁止写入日志、
 * 列表、mock 数据或外泄路径（AGENTS.md 隐私红线）。
 */
export interface UserArchive {
  sysyonghuid: number;
  /** 登录名（手机号）—— 敏感，展示需脱敏 */
  dengluming?: string | null;
  xingming?: string | null;
  /** 性别 1 男 2 女 */
  xingbie?: number | null;
  sysjiegouid?: number | null;
  minzu?: string | null;
  rudangriqi?: string | null;
  chushengriqi?: string | null;
  xueli?: string | null;
  dangneizhiwu?: string | null;
  xingzhengzhwu?: string | null;
  jigouming?: string | null;
}

/** 用户详情（apiuser/listinfo，仅本人可见） */
export function apiListinfo(sysyonghuid: number, sysjiegouid?: number): Promise<Envelope<UserArchive>> {
  return requestClient.get<UserArchive>(`${USER}/listinfo`, {
    sysyonghuid,
    ...(sysjiegouid ? { sysjiegouid } : {}),
  });
}

/** 当前机构用户（apiuser/jigouyonghu，本机构党员列表；xingming/jigouming 支持模糊搜索） */
export function apiJigouYonghu(
  page = 1,
  pagesize = 20,
  xingming?: string,
  jigouming?: string,
): Promise<Envelope<OrgMember>> {
  return requestClient.get<OrgMember>(`${USER}/jigouyonghu`, {
    page,
    pagesize,
    ...(xingming ? { xingming } : {}),
    ...(jigouming ? { jigouming } : {}),
  });
}

/** 全部用户列表（apiuser/quanbuyonghu，用于档案统计聚合） */
export function apiQuanbuYonghu(
  page = 1,
  pagesize = 20,
  xingming?: string,
  jigouming?: string,
): Promise<Envelope<OrgMember>> {
  return requestClient.get<OrgMember>(`${USER}/quanbuyonghu`, {
    page,
    pagesize,
    ...(xingming ? { xingming } : {}),
    ...(jigouming ? { jigouming } : {}),
  });
}

/**
 * 姓名脱敏（列表展示）：保留姓氏首字，其余以 * 代替。
 * 例：张三 → 张**；欧阳修 → 欧**；王 → 王*
 */
export function maskName(name?: string | null): string {
  const value = (name || '').trim();
  if (!value) return '党员';
  if (value.length === 1) return `${value}*`;
  return `${value.slice(0, 1)}**`;
}

/** 手机号脱敏（档案详情）：11 位手机号保留 3+4 位；非手机号原样返回 */
export function maskPhone(value?: string | null): string {
  const phone = (value || '').trim();
  if (!phone) return '—';
  if (/^\d{11}$/.test(phone)) return `${phone.slice(0, 3)}****${phone.slice(7)}`;
  return phone;
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
