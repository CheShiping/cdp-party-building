# 设计文档 · feat-013 我的收藏与浏览记录

- 功能编号：feat-013（依赖 feat-012）
- 状态：**已实施（2026-09-16）**
- 目标端：微信小程序（首要），H5 / App 兼容
- 关联原型：`prototype/个人中心.jpg`（菜单第 1 项「我的收藏」、第 2 项「浏览记录」）；列表样式复用 feat-007 专题列表卡片语言（原型未提供收藏/浏览列表稿）

---

## 1. 目标与范围

### 1.1 实现

1. 新增 `pages/collection` 通用列表页，按 `type` 区分「我的收藏」/「浏览记录」；
2. 个人中心「我的收藏」「浏览记录」两项菜单由 blocked 置为可用并接入路由；
3. 列表项展示接口缩略图（`obj.ossdir` + `wenjianurl`）、标题、摘要、操作时间；点击进入内容详情（复用 feat-008）；
4. 支持分页、下拉刷新、触底加载、空态、错误重试。

### 1.2 暂不实现（无接口）

| 项 | 原因 |
|---|---|
| 我的活动 | 无活动/报名接口（feat-009 blocked） |
| 我的积分 | 无积分接口与规则（feat-014 blocked） |
| 消息通知 | 无通知接口 |

---

## 2. 接口（对照 `docx/接口文档.md` 第 8 条，2026-09-16 实测）

| 用途 | 接口 | 参数 | 实测结论 |
|---|---|---|---|
| 我的收藏 | `GET apituwen/tuwencaozuoliebiao` | `page`、`pagesize`、`leixing=1` | 4 条；字段 `settuwenid / settuwenleibieid / biaoti / zhaiyao / wailian / wenjianurl / dianjishu / riqi / caozuoriqi`；`obj.ossdir="ossdir"` |
| 浏览记录（查看） | 同上 | `leixing=0` | 5 条（同字段） |
| 浏览记录（推送点开） | 同上 | `leixing=2` | 4 条（同字段） |
| 收藏态判断（详情页用） | `apituwen/tuwencaozuojilu` | `leixing=1` | 返回 CSV（feat-008 已实现） |

要点：
- **`tuwenleibieid` 实测非必传**（接口文档标注"必须传"，实际不传也返回数据）→ 本实现不传，避免多类别场景漏数据；
- 列表项自带 `settuwenleibieid`，可直接跳详情（详情接口要求真实类别，见设计文档 feat-008 §2.1）；
- `caozuoriqi` 为该条操作时间，列表按此展示与去重排序。

---

## 3. 文件结构与关键实现

| 文件 | 类型 | 说明 |
|---|---|---|
| `src/pages/collection/index.vue` | 新增 | 收藏 / 浏览记录列表页（`?type=favorite\|history`） |
| `src/api/modules/tuwen.ts` | 修改 | 新增 `TuwenActionItem`（含 `caozuoriqi`）与 `apiTuwenCaozuoLiebiao(leixing, page, pagesize)` |
| `src/pages/profile/index.vue` | 修改 | 「我的收藏」「浏览记录」置为可用；菜单路由改为 `MENU_ROUTES` 映射（含 feat-012 的「我的档案」） |
| `src/pages.json` / `src/constants/pages.ts` | 修改 | 注册 `pages/collection/index`（下拉刷新） |

### 3.1 数据流

```
onLoad({ type })
  ├─ favorite → apiTuwenCaozuoLiebiao(1, page, 20)
  └─ history  → Promise.all[ leixing=0, leixing=2 ] → mergeActions()
                     │  按 settuwenid 去重（保留最新 caozuoriqi）
                     └  按 caozuoriqi 倒序
  ↓
列表渲染（缩略图 resolveFileUrl(obj.ossdir, wenjianurl)，失败落 cover-greatwall.png）
  ↓ 点击
pages/detail（带 tuwenid + settuwenleibieid + ossdir + biaoti + riqi）
```

浏览记录合并去重的必要性：查看（0）与推送点开（2）是两条独立流水，同一条图文会同时出现；不合并会出现重复卡片。

---

## 4. 验证证据

| 检查项 | 命令（`cdp-party-building-uniapp/`） | 结果 |
|---|---|---|
| 类型检查 | `npx vue-tsc --noEmit` | 0 error |
| Lint | `npm run lint` | 0 error 0 warning |
| 主题门禁 | `npm run theme:sync` + `theme:check` | 白名单自检 OK；颜色 0 违规 |
| 构建 | `npm run build:mp-weixin` | `DONE Build complete.` |
| 产物自检 | `npm run check:pages` | **12 页** `ALL PAGES OK`（含 collection） |
| 接口实测（只读） | node fetch（admin/123456） | 收藏 `leixing=1` 4 条；浏览 `leixing=0` 5 条、`leixing=2` 4 条；三条链路字段均含 `settuwenleibieid` / `caozuoriqi` / `wenjianurl`，`obj.ossdir="ossdir"` |

> 本功能全部为只读接口，未产生写操作。

---

## 5. 遗留问题

1. **浏览记录合并口径**：同一图文在查看与推送点开流水各一条，前端按 `settuwenid` 去重保留最新；若后端希望保留完整流水（含每条操作时间），需接口侧聚合或分页口径调整。
2. **分页与去重叠加**：浏览记录每页各取 20 条后合并，去重后单页条数可能少于 20，触底判断以原始返回条数为准（与 feat-007 列表策略一致），极端情况下需多点一次「加载更多」。
3. **无「清空记录」「取消收藏」入口**：原型未要求；取消收藏可在详情页操作（feat-008）。
4. **我的活动 / 我的积分 / 消息通知**：仍然"暂不实现"，等接口。
