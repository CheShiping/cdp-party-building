# CDP 智慧党建（uni-app 小程序端）

基于 **uni-app + Vue3 + TypeScript + Vite + Pinia** 的党建小程序，**微信小程序为首要目标端**，同时保留 H5 / App 编译能力。

当前进度：**feat-001 ~ feat-013、feat-017 已完成并验证**（截至 2026-09-16）；feat-018 文档交接进行中。
无后端接口的功能**仍按原型呈现界面**，但**不做 mock、不编造接口、不编造数据**（详见「开发约定」）。

## 仓库结构

```
cdp-party-building/
├── cdp-party-building-uniapp/   # uni-app 工程（唯一工程目录，所有 npm 命令在此执行）
├── docx/                        # 需求与契约 + 归档文档
│   ├── 项目描述.md              # 6 大需求模块与功能点（需求唯一来源）
│   ├── 接口文档.md              # 后端接口契约（图文 / 留言 / 用户三类）
│   ├── codeimpl-sum/            # 设计实现文档 + 页面/接口/原型对照说明
│   └── bugfix/                  # Bug 修复文档（BUG修复-YYYYMMDD-*.md）
├── prototype/                   # 6 张原型图（首页 / 党员服务 / 电子档案 / 档案详情 / 个人中心 / ai学习）
└── md5.js                       # 密码加密算法（提供 hex_hmac_md5）
```

工程细节见 [`cdp-party-building-uniapp/README.md`](cdp-party-building-uniapp/README.md)；页面 ↔ 接口 ↔ 原型对照见 [`docx/codeimpl-sum/页面-接口-原型对照说明.md`](docx/codeimpl-sum/页面-接口-原型对照说明.md)。

## 技术栈

| 项 | 值 |
|---|---|
| 框架 | uni-app 3.x（Vue 3） |
| 语言 | TypeScript 5.x |
| 构建 | Vite 5.x |
| 状态管理 | Pinia 2.x |
| 样式 | SCSS + 设计令牌（`theme.json` 驱动） |
| 目标端 | mp-weixin（首要）/ h5 / app |

## 快速开始

```bash
cd cdp-party-building-uniapp

npm install                # 安装依赖
npm run theme:sync         # 主题令牌同步（改 theme.json 后必跑）
npm run theme:check        # 色阶门禁：越界颜色直接失败

npm run type-check         # vue-tsc --noEmit
npm run lint               # eslint

npm run dev:mp-weixin      # 开发监听，产物 dist/dev/mp-weixin
npm run build:mp-weixin    # 生产构建，产物 dist/build/mp-weixin
npm run check:pages        # 产物自检：页面 JSON 的 usingComponents 覆盖 WXML 组件标签（需先构建）
```

**微信开发者工具**：导入目录 `cdp-party-building-uniapp/dist/dev/mp-weixin`。小程序 appid 配置在 `cdp-party-building-uniapp/src/manifest.json` 的 `mp-weixin.appid`（属环境配置，本文档不展示、不随文档传播）。改源码后监听会自动重编，在开发者工具点「编译」即可。

**主包体积**：当前产物 1684.4 KB / 上限 2048 KB（2026-09-16 审计后）。新增静态资源前请先确认是否会被代码引用——`src/static/` 下**所有**文件都会被打入主包。

## 需求模块与实现状态

| 需求模块 | 对应功能 | 状态 |
|---|---|---|
| 工程基础 | feat-001 脚手架、feat-002 设计规范与主题、feat-003 请求层与鉴权、feat-004 静态资源与原型接入、feat-006 框架与导航 | ✅ done |
| 登录与个人 | feat-005 登录 / 改密 / 改头像 / 退出（注册无接口不实现） | ✅ done |
| 新闻与学习 | feat-007 首页与专题专栏、feat-008 内容详情与互动 | ✅ done |
| 党员服务互动 | feat-010 党务公告与支部留言 | ✅ done |
| 党员电子档案 | feat-012 个人档案查看、feat-013 我的收藏与浏览记录 | ✅ done |
| 收尾 | feat-017 跨平台与代码审计收尾 | ✅ done |
| 收尾 | feat-018 文档与交接 | ⏳ 进行中 |
| 党员服务互动 | feat-009 活动报名与签到 | 🚫 blocked（无接口）**界面已按原型呈现**：活动卡 + 报名入口（点击说明未开放），不编造地点/人数/状态 |
| 数智党建手册 | feat-011 知识库与电子手册 | 🚫 blocked（无接口）**AI 学习页已按原型实现**（图文真实数据 + 分类 + 搜索）；手册/知识库/学习进度不实现 |
| 积分体系 | feat-014 积分贯通 | 🚫 blocked（无接口）**积分卡已按原型呈现**（数值占位「—」） |
| VR 特色党建 | feat-015 720° 全景漫游 | 🚫 blocked（无资源与接口）**首页入口已保留**（点击说明未开放） |
| 通用基础后台 | feat-016 | 🚫 blocked（需求未提供功能点） |

状态口径以 `feature_list.json`（本地 harness，不入库）为准：`blocked` 表示接口或需求缺失——**界面按原型做，数据不编造**。

## 接口与鉴权约定

- 基址 `https://szdj.cdszxjc.com/`，模块前缀 `apituwen`（图文）、`apiliuyan`（留言）、`apiuser`（用户）。
- 登录接口传 **API token**，其余业务接口传**登录返回的用户 token**，token 走 **HTTP Header `token`（纯值）**。
- 密码传输统一 `hex_hmac_md5(pwd, 'cds')`（见 `md5.js`），禁止明文或裸 MD5。
- **图片路径**：`ossdir` 在响应 **`obj` 内**（`obj.ossdir`），`list` 项**不含**该字段；必须 `obj.ossdir` + `wenjianurl` 拼全（实测 `/{ossdir}/tuwen/x.png` → 200，`/tuwen/x.png` → 404）。
- **图文详情**：`tuwenxiangqing` 的 `tuwenleibieid` 必须与该图文**真实类别**一致，否则返回残缺对象；`tuwenneirong` 直接返回 HTML（非 JSON 信封）。
- 字段口径一律以 `docx/接口文档.md` 为准；已实测差异记录在对应设计文档中。

## 开发约定

- UI 以 `prototype/` 原型图为验收标准，布局不得自由发挥。
- **无接口 ≠ 不做界面**：暂不实现/无接口的功能同样要按原型把入口、区块、卡片、按钮做出来；限制只作用于数据——接口无值显示空态/占位（"—"），按钮点击给出明确说明。**禁止 mock 假数据、禁止编造原型字段值**。
- 只用 `view` / `text` / `image` 等 uni-app 组件，不用 `div` / `span`；尺寸统一 `rpx`。
- 颜色只能用主题令牌（`theme.json` → SCSS/TS 令牌），`npm run theme:check` 会拦截色阶外颜色。
- 页面模板使用自定义组件时必须直接 `import X from '@/components/X/X.vue'`；经目录桶文件导入会导致小程序产物页面 JSON 缺失 `usingComponents`，微信开发者工具编译直接中断。
- 党员电子档案、实名认证属敏感数据，仅本人可见，禁止写入日志或出现在列表、mock 数据；手机号等一律脱敏。
- 小程序 appid、API token 等环境配置不写入文档与提交说明。

## 文档索引

| 文档 | 用途 |
|---|---|
| `docx/项目描述.md` | 需求范围（6 大模块与功能点） |
| `docx/接口文档.md` | 后端接口契约 |
| `docx/codeimpl-sum/` | 各功能的设计实现归档、页面/接口/原型对照说明 |
| `docx/bugfix/` | Bug 修复归档 |
| `prototype/` | 原型图（UI 验收标准） |
| `AGENTS.md`（本地） | 协作入口路由：不变式、范围边界、验证命令 |

## 已知阻塞与风险

- **`apiuser/listinfo` 后端未鉴权**：实测可读取任意用户档案 → 前端已强制「仅本人可请求」并脱敏展示；建议后端补校验。
- **小程序 `web-view` 业务域名未配置**：外链（12371.cn 等）在 `pages/webview` 内大概率打不开，详情页已提供「复制链接」通道。
- **正文内 `<a>` 不可点击**：`rich-text` 不支持节点事件，统一经「查看原文」跳转。
- **活动 / 公告暂无数据**：`apituwen` 类别 10（最新活动）、11（通知公告）当前为空，页面按空态呈现。
- **`yonghuliuyan` 接口行为与文档不符**（忽略参数返回全量留言）→ 已弃用。
- 改密 / 头像上传等写操作未在真实库长期验证（避免污染测试账号）。
