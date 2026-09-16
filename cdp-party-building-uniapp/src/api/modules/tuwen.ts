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

/** 图文详情（apituwen/tuwenxiangqing 返回字段，2026-09-16 实测） */
export interface TuwenDetail {
  settuwenid: number;
  biaoti: string;
  settuwenleibieid: number;
  wailian?: string | null;
  wenjianurl?: string | null;
  /** 是否公开(0否1是) */
  gongkai?: number | null;
  /** 发布单位 */
  danwei?: string | null;
  riqi: string;
  dianjishu?: number | null;
  /** 内容长度（正文由 tuwenneirong 单独返回） */
  neirong_len?: number | null;
  /** 类别名称 */
  tuwenleibie?: string | null;
  /** 文件前缀：实测后端返回字面量 "ossdir"（`/ossdir/tuwen/x.png` 200，`/tuwen/x.png` 404） */
  ossdir?: string | null;
}

/** 图文操作类型（docx/接口文档.md 第 6 条） */
export const TUWEN_ACTION = {
  /** 查看（浏览记录） */
  VIEW: 0,
  /** 收藏 */
  FAVORITE: 1,
  /** 推送点开 */
  PUSH_OPEN: 2,
  /** 取消收藏 */
  UNFAVORITE: -1,
} as const;

/**
 * 取列表接口响应的文件前缀：`list` 项**不含** `ossdir`，前缀只在 `obj.ossdir` 里（2026-09-16 实测）。
 * 漏取会拼出 `/tuwen/x.png` → 404，缩略图全部落到静态兜底图。
 */
export function envelopeOssdir(res: Envelope<unknown>): string {
  const obj = res.obj as { ossdir?: string } | null;
  return (obj && obj.ossdir) || '';
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

/** 父图文全部列表（父类别下所有子类图文，如父类别 3「专题学习」） */
export function apiTuwenFuliebiao(
  tuwenleibieid: number,
  page = 1,
  pagesize = 10,
  biaoti?: string,
): Promise<Envelope<TuwenItem>> {
  return requestClient.get<TuwenItem>(`${TUWEN}/tuwenfuliebiao`, {
    page,
    pagesize,
    tuwenleibieid,
    ...(biaoti ? { biaoti } : {}),
  });
}

/**
 * 图文详情（apituwen/tuwenxiangqing）。
 * 注意：`tuwenleibieid` 必须是图文**真实**类别，与图文不匹配时后端返回残缺对象（仅 ossdir）。
 */
export function apiTuwenXiangqing(
  tuwenid: number,
  tuwenleibieid: number,
): Promise<Envelope<TuwenDetail>> {
  return requestClient.get<TuwenDetail>(`${TUWEN}/tuwenxiangqing`, { tuwenid, tuwenleibieid });
}

/** 图文内容（apituwen/tuwenneirong）：接口直接返回 HTML 正文，非 JSON 信封 */
export function apiTuwenNeirong(tuwenid: number, tuwenleibieid: number): Promise<string> {
  return requestClient.text(`${TUWEN}/tuwenneirong?tuwenid=${tuwenid}&tuwenleibieid=${tuwenleibieid}`);
}

/** 图文操作（0查看 1收藏 2推送点开 -1取消收藏） */
export function apiTuwenCaozuo(
  tuwenid: number,
  leixing: number,
  options?: { showError?: boolean },
): Promise<Envelope<unknown>> {
  return requestClient.get<unknown>(`${TUWEN}/tuwencaozuo`, { tuwenid, leixing }, options);
}

/**
 * 图文操作记录（tuwencaozuojilu）：接口返回逗号分隔的图文 id 字符串（如 `"17,16,5"`），
 * 用于判断当前图文是否已收藏（leixing=1）。失败静默（仅辅助状态查询）。
 */
export function apiTuwenCaozuoJilu(leixing: number): Promise<string> {
  return requestClient
    .get<unknown>(`${TUWEN}/tuwencaozuojilu`, { leixing }, { showError: false })
    .then((res) => {
      const obj = res.obj;
      if (typeof obj === 'string') return obj;
      return '';
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
