# 设计文档 · feat-008 内容详情与互动

- 功能编号：feat-008（依赖 feat-007）
- 状态：**已实施（2026-09-16）**
- 目标端：微信小程序（首要），H5 / App 兼容
- 关联原型：**无独立详情页原型图**。详情页布局沿用 `prototype/首页.jpg` 的头部与卡片语言（红底导航、白卡正文、gutter 24rpx、圆角 12rpx），并按 `uniapp-style-skill` 设计系统 token 落地，未自由发挥配色与尺寸。原型 → 功能映射中的 `prototype/ai学习.png` 列表项即"图文列表 → 详情"的入口形态。

---

## 1. 目标与范围

### 1.1 目标

打通"列表 → 详情 → 互动"闭环：

1. 详情元数据 + HTML 正文渲染，排版与设计系统一致（字号/行高/图片宽度由 token 与工具统一）；
2. 收藏 / 取消收藏（`tuwencaozuo` 1 / -1），进入详情上报浏览（`tuwencaozuo` 0）；
3. 微信小程序分享（`onShareAppMessage` / `onShareTimeline` + `button open-type="share"`）；
4. 外链跳转（`wailian`）：小程序内 `web-view` 页 + 复制链接兜底；
5. 首页（轮播 / AI 推送 / 最新内容）与专题列表页三处入口全部接入详情。

### 1.2 范围外（本次不做）

| 项 | 原因 |
|---|---|
| 评论 / 留言 | 属 feat-010（`apiliuyan`），本次不混入 |
| 我的收藏列表、浏览记录列表 | 属 feat-013（`tuwencaozuoliebiao`） |
| 搜索 | 接口文档无搜索接口，首页搜索条保持"即将上线"提示 |
| 正文内 `<a>` 标签点击跳转 | 小程序 `rich-text` 不支持标签级事件，统一由"查看原文"兜底（见 §7） |

---

## 2. 涉及的接口（对照 `docx/接口文档.md`）

| 用途 | 接口 | 参数 | token | 实测结论（2026-09-16，admin/123456） |
|---|---|---|---|---|
| 详情元数据 | `GET apituwen/tuwenxiangqing` | `tuwenid`、`tuwenleibieid`（均必传） | 用户 token（Header `token`） | `tuwenleibieid` **必须与图文真实类别一致**；不一致时只返回 `{"ossdir":"ossdir"}` 残缺对象（用 5/1 传错类别复现） |
| HTML 正文 | `GET apituwen/tuwenneirong` | 同上 | 用户 token | 返回 **`text/html` 裸 HTML**（非 `{success,obj,list}` 信封），长度 3229～14771 字符 |
| 收藏 / 取消 / 浏览 | `GET apituwen/tuwencaozuo` | `tuwenid`、`leixing`（0 查看 / 1 收藏 / 2 推送点开 / -1 取消） | 用户 token | `leixing=1` → `msg:"已经收藏过"`；`leixing=-1` → `msg:"已经取消收藏"`；`success:true` |
| 收藏态 | `GET apituwen/tuwencaozuojilu` | `leixing=1` | 用户 token | `obj` 为 **CSV 字符串**（`"17,16,5,1"`），非数组 |
| 列表（父类别全部图文） | `GET apituwen/tuwenfuliebiao` | `page`、`pagesize`、`tuwenleibieid` | 用户 token | 父类别 3 返回 5 条（子类别 4~9 内容）；`tuwenliebiao(3)` 实测 **0 条** |

### 2.1 关键实测差异（务必遵守）

1. **`ossdir` 只在响应 `obj` 内**，`list` 项不含该字段：
   - `tuwenliebiao` / `tuwenfuliebiao` / `tuwencaozuoliebiao` 的 `obj` 均返回 `{"ossdir":"ossdir"}`；
   - 拼接验证：`https://szdj.cdszxjc.com/ossdir/tuwen/732d…png` → **200 image/png**；`https://szdj.cdszxjc.com/tuwen/732d…png` → **404**；
   - 结论：必须 `obj.ossdir` + 项 `wenjianurl`（已回写 `AGENTS.md` 不变式 4 与不变式 9 字段清单）。
2. **`tuwenneirong` 不是信封响应**：`requestClient` 的 JSON 信封解析不适用，新增 `requestClient.text()`。
3. **`tuwenxiangqing` 不返回 `neirong`**，正文单独取；返回字段：`biaoti / settuwenleibieid / wailian / wenjianurl / gongkai / danwei / riqi / dianjishu / neirong_len / tuwenleibie / ossdir`。
4. `dianjishu` 实测为 `null`（无阅读数），详情页 meta 仅在 >0 时展示"阅读"。

---

## 3. 文件结构与关键实现

### 3.1 新增／修改文件

| 文件 | 类型 | 说明 |
|---|---|---|
| `src/pages/detail/index.vue` | 新增 | 内容详情页（正文 / 头图 / meta / 收藏 / 分享 / 原文） |
| `src/pages/webview/index.vue` | 新增 | 外链承载页（`web-view`，仅放行 http(s)） |
| `src/utils/richtext.ts` | 新增 | 正文 HTML 预处理（版式归一 + 图片绝对化 + 防御清理） |
| `src/api/modules/tuwen.ts` | 修改 | 新增 5 个接口与 `envelopeOssdir()`、`TuwenDetail`、`TUWEN_ACTION` |
| `src/utils/request.ts` | 修改 | 新增 `requestClient.text()`（裸文本，`dataType: 'text'`） |
| `src/pages/index/index.vue` | 修改 | 三处入口跳详情；缩略图改用 `obj.ossdir`；最新内容改 `tuwenfuliebiao(3)` |
| `src/pages/topic/index.vue` | 修改 | 跳详情；缩略图改用 `obj.ossdir` |
| `src/pages.json` | 修改 | 注册 `pages/detail/index`（custom 导航）、`pages/webview/index` |
| `src/constants/pages.ts` | 修改 | 新增 `DETAIL` / `WEBVIEW` 路由常量与标题 |
| `scripts/check-pages.mjs` | 新增 | 产物自检（不变式 7）：`usingComponents` 覆盖 WXML 自定义组件标签 |
| `package.json` | 修改 | 新增 `npm run check:pages` |

### 3.2 请求层：`requestClient.text()`

```ts
// 与 request() 同构：token 注入 → 401 统一处理 → 状态码校验
uni.request({ url, method: 'GET', header, dataType: 'text', ... })
```

- 与 `request()` 一致的鉴权链路（`ensureFreshToken` + `handleUnauthorized`），因此正文请求同样享受"token 超 24h 静默续期"；
- `dataType: 'text'` 关键：小程序端默认 `dataType:'json'` 会对 HTML 响应体做 JSON.parse，解析失败时行为不可控。

### 3.3 正文归一化：`utils/richtext.ts`

输入第三方采集 HTML，做四件事（顺序固定）：

1. 移除 `<script>` 与内联 `on*` 事件（防御性，`rich-text` 本身不执行脚本）；
2. 剥离 `font-size / line-height / font-family / text-wrap-mode / white-space / width / height` 内联声明 —— 源站是 18px/42px 的 PC 排版，会与 28rpx 正文冲突；
3. 重写 `<img>`：相对路径按 `resolveFileUrl(ossdir, src)` 绝对化，移除死宽高属性，统一 `display:block;width:100%;height:auto;border-radius:6px`；
4. 保留 `color / margin / padding` —— 源文红色强调色与段落间距属内容语义，保留后与设计系统 `#333333` 主体一致。

另导出 `richTextToPlainText()`（正文纯文本，供后续摘要/分享场景复用）。

### 3.4 详情页数据流

```
onLoad(options) → requireLogin()
  ├─ tuwenid / tuwenleibieid（必传）；biaoti / ossdir / riqi / danwei 作首屏占位（避免白屏）
  ↓
loadDetail()
  ├─ apiTuwenXiangqing()  ── 失败 → 错误态 + 重试按钮
  ├─ 成功后（相互独立，不阻塞）
  │    ├─ reportView()            tuwencaozuo leixing=0（showError:false，静默）
  │    ├─ loadFavoriteState()     tuwencaozuojilu leixing=1 → CSV 含当前 id ?
  │    └─ apiTuwenNeirong()       → normalizeRichText(html, ossdir) → <rich-text :nodes>
  └─ 占位：正文骨架屏；正文为空/失败 → AppEmpty（提示可看原文）
```

展示字段一律"接口优先、路由参数兜底"：`title / danwei / date / ossdir / cover`。头图在**正文已包含同名图片时自动隐藏**（避免与正文首图重复）。

### 3.5 互动实现

| 交互 | 实现 |
|---|---|
| 收藏 / 取消 | `favorited` 由 `tuwencaozuojilu(1)` 初始化；点击按当前态发 `leixing = 1 / -1`，成功后本地翻转 + toast；`favoriteBusy` 防连点 |
| 浏览记录 | 详情加载成功后发 `leixing=0`；失败静默，不打扰阅读 |
| 分享（微信） | `onShareAppMessage`（`path` 带 tuwenid+类别，`imageUrl` 用接口头图）+ `onShareTimeline`；按钮用 `button open-type="share"` |
| 分享（其他端） | `handleShare()` 复制链接 + toast |
| 外链跳转 | `openSource()`：H5 直接 `window.open`；小程序 `showActionSheet` →「复制链接到浏览器打开」/「在小程序内打开」（`pages/webview`） |

`webview` 页只放行 `^https?://`，拦截 `file://` 等非预期 scheme。

---

## 4. 状态与数据流（图片兜底链，不变式 9）

```
接口 wenjianurl + obj.ossdir → resolveFileUrl() → <image>
      │ onerror
      └→ 详情头图 → static/images/cover-party-story.png（登记为"仅兜底"）
         列表缩略图 → static/images/cover-greatwall.png
         两者都无 → AppEmpty（images/empty-data.png）
```

静态图仅用于：加载中骨架、加载失败/字段为空兜底、纯装饰（导航、底部条图标）。

---

## 5. 验证证据

| 检查项 | 命令（均在 `cdp-party-building-uniapp/`） | 结果 |
|---|---|---|
| 类型检查 | `npx vue-tsc --noEmit` | `TYPECHECK_OK`（0 error） |
| Lint | `npm run lint` | 0 error 0 warning |
| 主题门禁 | `npm run theme:sync` + `npm run theme:check` | 白名单自检 OK；扫描 67 文件 0 违规 |
| 构建 | `npm run build:mp-weixin` | `DONE Build complete.` |
| 产物自检（不变式 7） | `npm run check:pages` | 9 页 `usingComponents` 全覆盖（`ALL PAGES OK`），含新增 detail/webview |
| 接口契约实测 | node fetch（admin/123456） | 见 §2 表格；收藏 1/-1 往返后 `tuwencaozuojilu` 恢复为原值 `17,16,5,1` |
| 正文归一化对拍 | 真实 `tuwenneirong`（tuwenid 17/16/15） | `font-size` 声明 9/23/57 → **0**；`line-height` → **0**；img 1/6/6 全部保留且为绝对地址；无 script / 内联事件残留 |

> 页面渲染（真机 / 开发者工具）需用户目视回归，见 §7。

---

## 6. 与需求 / 规范的对应

| 要求 | 落地 |
|---|---|
| 多形态内容详情 | 元数据 + HTML 正文 + 头图 + 单位/日期/阅读数 + 原文入口 |
| 排版优美 | 剥离源站 PC 内联版式，改由 `$font-md / $line-height-relaxed / $color-text-primary` 控制；图片通栏圆角 |
| 分享 | `onShareAppMessage` + `onShareTimeline` + 原生分享按钮 |
| 收藏 | `tuwencaozuo` 1 / -1，状态由接口记录初始化 |
| 浏览记录 | 进入详情上报 `leixing=0`（列表展示归 feat-013） |
| 外链跳转 | ActionSheet 双通道（复制链接 / web-view） |
| 不变式 9 | 头图与缩略图一律接口值优先，失败才落静态兜底 |

---

## 7. 遗留问题

1. **`web-view` 业务域名**：`12371.cn` 等外链域名未加入小程序"业务域名"白名单，`pages/webview` 内大概率打不开；因此详情页默认提供「复制链接」通道。待后台配置域名后无需改码。
2. **正文内 `<a>` 不可点击**：小程序 `rich-text` 不支持节点级跳转事件，用户需经"查看原文"；如需正文内跳转，需改为 `mp-html` 类组件（引入第三方依赖，暂不评估）。
3. **正文图片域名**：源文图片来自 `p2.img.cctvpic.com` 等第三方域名，`<image>` / `rich-text` 加载此类图片在部分网络环境可能失败；未做逐图兜底（代价大于收益）。
4. **收藏态为全量拉取**：`tuwencaozuojilu(1)` 返回全量收藏 id 的 CSV，收藏量极大时字符串会变长；当前数据量（<100）无问题，如后续增长可改为本地缓存 + 增量。
5. **`dianjishu` 恒为 null**：阅读数由后端口径决定，前端仅在 >0 时展示，不做假数据。
6. **首页"更多"仍是提示**：`更多 ›` 需要"按类别聚合列表"页，接口支持（`tuwenliebiao` 已具备分页），但属需求外，未实现。
7. **H5 端外链**：`window.open` 受浏览器拦截策略影响，可能被拦为弹窗；小程序为首要端，未额外处理。
