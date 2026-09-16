# 设计文档 · feat-010 服务互动：党务公告与支部留言

- 功能编号：feat-010（依赖 feat-006，复用 feat-007 列表页与 feat-008 详情页）
- 状态：**已实施（2026-09-16）**
- 目标端：微信小程序（首要），H5 / App 兼容
- 关联原型：`prototype/党员服务.jpg`（红底导航 + 5 项功能宫格 + 「近期活动」卡片区）
- 需求来源：`docx/项目描述.md`「服务互动」模块；接口契约：`docx/接口文档.md`（图文 / 留言）

---

## 1. 目标与范围

### 1.1 实现

1. **党员服务页**（按原型复刻）：红底导航、5 项宫格（活动报名 / 党员交流 / 通知公告 / 思想会地 / 意见反馈）、「近期活动」区块；
2. **党务公告**：宫格「通知公告」→ 复用 `pages/topic` 列表页（类别 11 通知公告，父类别聚合 12 支部公告 / 13 评优评先 / 14 组织关系）→ 复用 `pages/detail` 详情页；
3. **支部留言 / 党员交流**：新增 `pages/message`，支持列表、发布、回复、删除（仅本人）；
4. **图文留言**：详情页底部新增「留言」入口 → `pages/message?leixing=4&tuwenid=x`。

### 1.2 暂不实现（接口文档无对应接口，禁止 mock）

| 项 | 原因 |
|---|---|
| 活动报名 / 签到（宫格第 1 项、「近期活动」报名按钮） | `docx/接口文档.md` 无活动/报名/签到接口（feat-009 blocked）；「近期活动」仅以 `apituwen` 类别只读展示并标注"报名暂未开放" |
| 思想汇报（宫格「思想会地」） | 无接口 |
| 意见反馈 / 意见建议 | 无接口 |
| 支部圈子动态 | 无接口 |
| 实名 / 匿名留言开关 | `liuyancaozuo` 无匿名参数，不臆造；留言人姓名取接口 `xingming` |
| 我的留言聚合（`yonghuliuyan`） | 实测该接口忽略 `sopliuyanid` 返回全量留言，行为与文档不符 → **不使用** |

---

## 2. 接口（对照 `docx/接口文档.md` 第 1~5 条，2026-09-16 实测）

| 用途 | 接口 | 参数 | 实测结论 |
|---|---|---|---|
| 留言列表 | `GET apiliuyan/liuyanliebiao` | `leixing`(1 党员交流 / 4 图文留言)、`page`、`pagesize`、`tuwenid`(leixing=4 必传) | 返回 **一级留言与回复混排**（靠 `shangjiid` 区分，0 = 一级）；字段含接口文档未列出的 **`xingming`**（姓名）；`leixing=1` 当前无数据（空 list） |
| 回复列表 | `GET apiliuyan/liuyanhuifuliebiao` | `sopliuyanid`、`leixing`、`page`、`pagesize` | 返回该留言**之后的全部回复**（实测 sopliuyanid=38 → 1 条回复） |
| 留言 / 回复 | `GET apiliuyan/liuyancaozuo` | `leixing`、`neirong`、`tuwenid`、`shangjiid` | 发布成功 `obj.sopliuyanid` 为新 id；回复返回 `obj.shangjiids`；`shangjiid` 错误时后端强制置 0 |
| 删除留言 | `GET apiliuyan/liuyanshanchu` | `sopliuyanid` | 成功 `obj:1`；**仅能删自己的留言**（后端校验） |
| 党务公告列表 | `GET apituwen/tuwenfuliebiao` | `tuwenleibieid=11`、`page`、`pagesize` | 父类别聚合子类公告（当前 0 条为数据侧为空，非接口问题） |
| 近期活动 | `GET apituwen/tuwenliebiao` | `tuwenleibieid=10`、`page`、`pagesize` | 类别「最新活动」（当前 0 条） |

### 2.1 实测补充的类别结构（`tuwenleibie`，14 类）

```
1 轮播图          2 人工智能推送     3 专题学习(父) → 4 党史学习 5 主体党日 6 二十大精神 7 红色思政 8 AI党建 9 党章党规
10 最新活动(父,无子类)                 11 通知公告(父) → 12 支部公告 13 评优评先 14 组织关系
```

- **父类别**用 `tuwenfuliebiao`，**子类别**用 `tuwenliebiao`（实测 `tuwenfuliebiao(6)=0 条`）→ 已抽取常量 `TUWEN_PARENT_CATEGORY = [3, 10, 11]`，`pages/topic` 依据类别 id 自动选择接口。

---

## 3. 文件结构与关键实现

| 文件 | 类型 | 说明 |
|---|---|---|
| `src/api/modules/liuyan.ts` | 新增 | `LiuyanItem`、`LIUYAN_LEIXING`、列表 / 回复 / 发布 / 删除 4 个接口，注释记录实测差异 |
| `src/pages/message/index.vue` | 新增 | 留言页：一级留言卡片 + 按需展开回复 + 底部输入条（发布 / 回复）+ 删除 |
| `src/pages/service/index.vue` | 重写 | 按 `prototype/党员服务.jpg` 复刻：红底导航 + 5 项宫格 + 「近期活动」区块 |
| `src/pages/topic/index.vue` | 修改 | 父类别自动改用 `tuwenfuliebiao`（公告类 11 生效） |
| `src/pages/detail/index.vue` | 修改 | 底部操作条新增「留言」入口（`leixing=4` + `tuwenid`）；「查看原文」移到正文卡内 |
| `src/constants/api.ts` | 修改 | 新增 `TUWEN_CATEGORY.ACTIVITY=10`、`NOTICE=11` 与 `TUWEN_PARENT_CATEGORY` |
| `src/pages.json` / `src/constants/pages.ts` | 修改 | 注册 `pages/message/index`（下拉刷新） |

### 3.1 留言页数据流

```
onLoad({ leixing, tuwenid, title })
  ├─ leixing=4 且无 tuwenid → 直接错误态（接口强制要求）
  ↓
loadPage(1..n)   apiLiuyanLiebiao(leixing, page, 20, tuwenid)
  ├─ 前端取 shangjiid=0 作为一级留言（roots）
  └─ 触底 / 下拉刷新复用同一分页逻辑
      ↓ 点击「查看回复」
      apiLiuyanHuiFuLiebiao(sopliuyanid) → replyMap[id]（按需、可缓存，重复点击不重复请求）
```

- **层级策略**：接口返回混排，前端只把 `shangjiid=0` 当一级渲染；回复**按需**拉取并在卡片内展开，避免 N+1 请求，也避免后端分页口径混乱导致的错位；
- **发布 / 回复**：同一 `liuyancaozuo`，`shangjiid` 存在即为回复；成功后回复态则刷新该条回复并保持展开，否则重置列表到第 1 页；
- **删除**：仅本人可删（`sysyonghuid === userStore.userInfo.yonghuid` 才显示按钮，后端二次校验），`showModal` 二次确认，成功后本地移除并重载首页避免分页错位；
- **内容校验**：非空 + ≤3000 字（接口文档 `neirong` 上限）。

### 3.2 党员服务页

| 宫格项 | 行为 |
|---|---|
| 活动报名 | toast「活动报名与签到暂未开放」（feat-009 blocked） |
| 党员交流 | → `pages/message?leixing=1` |
| 通知公告 | → `pages/topic?categoryId=11`（父类别自动走 `tuwenfuliebiao`） |
| 思想会地 | toast「思想汇报暂未开放」 |
| 意见反馈 | toast「意见建议反馈暂未开放」 |

「近期活动」区块：`apituwen` 类别 10 图文卡片（封面 / 标题 / 摘要 / 日期，接口值优先 + 静态兜底），点击进详情（只读）；空数据显示空态并注明"活动报名与签到暂未开放"，**不造假数据**。

---

## 4. 验证证据

| 检查项 | 命令（`cdp-party-building-uniapp/`） | 结果 |
|---|---|---|
| 类型检查 | `npx vue-tsc --noEmit` | 0 error |
| Lint | `npm run lint` | 0 error 0 warning |
| 主题门禁 | `npm run theme:sync` + `theme:check` | 白名单自检 OK；69 文件 0 违规 |
| 构建 | `npm run build:mp-weixin` | `DONE Build complete.` |
| 产物自检 | `npm run check:pages` | 10 页 `ALL PAGES OK`（含新增 message） |
| 留言写操作实测 | node fetch（admin/123456，图文 5） | 发布 → `obj.sopliuyanid=38`；回复（`shangjiid=38`）→ `sopliuyanid=39` 且 `liuyanhuifuliebiao(38)` 返回 39；删除 39 / 38 → `obj:1`；复查残留 **0**（净效果为 0，未污染测试数据） |
| 类别结构实测 | `tuwenleibie` | 14 类两级结构；`tuwenfuliebiao(11)` / `tuwenliebiao(10)` 当前均 0 条（数据侧为空） |

---

## 5. 遗留问题

1. **公告与活动当前无数据**：类别 10 / 11 后端暂无图文，页面按空态呈现；待后台录入后自动展示。
2. **`yonghuliuyan` 不可用**：实测返回全量留言（忽略 `sopliuyanid`），已弃用；若后续需要"我的留言"需后端修正该接口。
3. **`liuyanliebiao` 排序不稳定**：实测第 2 页返回包含一级与深层回复混排，前端只渲染一级并分页，深层回复统一通过 `liuyanhuifuliebiao` 按需获取；如需严格时间序应由后端修正。
4. **回复不支持 @ 提及与折叠层级**：接口仅返回 `shangjiid`（无被回复人昵称），当前回复列表扁平展示；如需"回复 @某某"需前端用父留言 `xingming` 反查（已具备数据，暂未做）。
5. **匿名留言未支持**：接口无匿名参数，需后端扩展。
6. **活动报名、思想汇报、意见反馈**：仍然"暂不实现"，等待接口。
