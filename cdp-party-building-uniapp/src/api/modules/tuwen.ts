import { requestClient, type Envelope } from '@/utils/request';
import { API_BASE_URL, API_MODULE } from '@/constants/api';

/** 图文类别（apituwen/tuwenleibie 返回字段，docx/接口文档.md） */
export interface TuwenCategory {
  settuwenleibieid: number;
  mingcheng: string;
  beizhu?: string | null;
  shangjiiid?: number;
  paixu?: number;
  riqi?: string;
}

/** 图文列表项（apituwen/tuwenliebiao 返回字段） */
export interface TuwenItem {
  settuwenid: number;
  settuwenleibieid?: number;
  biaoti: string;
  zhaiyao?: string | null;
  wailian?: string | null;
  wenjianurl?: string | null;
  dianjishu?: number | null;
  riqi: string;
  /** 文件前缀（可能为空；wenjianurl 已带 / 前缀时无需拼接） */
  ossdir?: string | null;
}

const TUWEN = `/${API_MODULE.TUWEN}`;

/** 图文类别列表（需用户 token） */
export function apiTuwenLeibie(): Promise<Envelope<TuwenCategory>> {
  return requestClient.get<TuwenCategory>(`${TUWEN}/tuwenleibie`);
}

/** 图文列表（需用户 token；tuwenleibieid 必传，biaoti 模糊搜索） */
export function apiTuwenLiebiao(
  tuwenleibieid: number,
  page = 1,
  pagesize = 10,
  biaoti?: string,
): Promise<Envelope<TuwenItem>> {
  return requestClient.get<TuwenItem>(`${TUWEN}/tuwenliebiao`, {
    page,
    pagesize,
    tuwenleibieid,
    ...(biaoti ? { biaoti } : {}),
  });
}

/**
 * 拼接接口文件完整地址（AGENTS.md 不变式 4）：
 * - wenjianurl 已是完整 http(s) 地址 → 原样返回
 * - 否则 基址 + ossdir + wenjianurl（自动处理斜杠），禁止直接拼裸域名
 */
export function resolveFileUrl(ossdir?: string | null, wenjianurl?: string | null): string {
  if (!wenjianurl) return '';
  if (/^https?:\/\//i.test(wenjianurl)) return wenjianurl;
  const prefix = (ossdir || '').replace(/\/+$/, '');
  const file = wenjianurl.startsWith('/') ? wenjianurl : `/${wenjianurl}`;
  return `${API_BASE_URL}${prefix}${file}`;
}
