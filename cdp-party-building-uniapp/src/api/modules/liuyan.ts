import { requestClient } from '@/utils/request';
import { API_MODULE } from '@/constants/api';
import type { Envelope } from '@/utils/request';

/**
 * 留言模块（apiliuyan，docx/接口文档.md 第 1~5 条）。
 * 2026-09-16 实测：
 * - `liuyanliebiao` 的 list 含**一级留言与回复混排**（靠 `shangjiid` 区分层级，0 为一级），
 *   且返回字段含 `xingming`（姓名，接口文档未列出）；
 * - `liuyanhuifuliebiao?sopliuyanid=x` 返回该留言**之后的所有回复**（实测 sopliuyanid=12 → 1 条回复）；
 * - `yonghuliuyan` 实测忽略 sopliuyanid 返回全量留言，行为与文档不符 → 不使用。
 */
const LIUYAN = `/${API_MODULE.LIUYAN}`;

/** 留言操作类型（leixing） */
export const LIUYAN_LEIXING = {
  /** 党员交流 */
  EXCHANGE: 1,
  /** 图文留言 */
  MESSAGE: 4,
} as const;

/** 留言项（apiliuyan/liuyanliebiao 返回字段） */
export interface LiuyanItem {
  sopliuyanid: number;
  settuwenid?: number | null;
  leixing: number;
  neirong: string;
  paixu?: number | null;
  /** 上级留言 id，0 = 一级留言 */
  shangjiid: number;
  sysyonghuid: number;
  /** 是否删除(0否1是) */
  shanchu?: number | null;
  riqi: string;
  /** 留言人姓名（实测返回） */
  xingming?: string | null;
}

/** 留言列表（leixing=1 党员交流无需 tuwenid；leixing=4 图文留言必须传 tuwenid） */
export function apiLiuyanLiebiao(
  leixing: number,
  page = 1,
  pagesize = 20,
  tuwenid?: number,
): Promise<Envelope<LiuyanItem>> {
  return requestClient.get<LiuyanItem>(`${LIUYAN}/liuyanliebiao`, {
    leixing,
    page,
    pagesize,
    ...(tuwenid ? { tuwenid } : {}),
  });
}

/** 某条留言之后的全部回复（仅一级） */
export function apiLiuyanHuiFuLiebiao(
  sopliuyanid: number,
  leixing: number,
  page = 1,
  pagesize = 20,
): Promise<Envelope<LiuyanItem>> {
  return requestClient.get<LiuyanItem>(`${LIUYAN}/liuyanhuifuliebiao`, {
    sopliuyanid,
    leixing,
    page,
    pagesize,
  });
}

/** 留言 / 回复（shangjiid 为被回复留言 id；设置错误后端会强制置 0） */
export function apiLiuyanCaozuo(params: {
  leixing: number;
  neirong: string;
  tuwenid?: number;
  shangjiid?: number;
}): Promise<Envelope<unknown>> {
  const { leixing, neirong, tuwenid, shangjiid } = params;
  return requestClient.get<unknown>(`${LIUYAN}/liuyancaozuo`, {
    leixing,
    neirong,
    ...(tuwenid ? { tuwenid } : {}),
    ...(shangjiid ? { shangjiid } : {}),
  });
}

/** 删除留言（仅能删除自己的留言） */
export function apiLiuyanShanchu(sopliuyanid: number): Promise<Envelope<unknown>> {
  return requestClient.get<unknown>(`${LIUYAN}/liuyanshanchu`, { sopliuyanid });
}
