# CDP 智慧党建（uni-app 小程序端）

基于 **uni-app + Vue3 + TypeScript + Vite + Pinia** 的党建小程序，**微信小程序为首要目标端**，同时保留 H5 / App 编译能力。

当前进度：`feat-001 工程脚手架` 已完成并通过基线验证；业务模块（首页专题、党务公告与留言、党员电子档案等）按功能清单逐项推进。无后端接口支撑的功能统一标记「暂不实现」，不做 mock、不编造接口。

## 仓库结构

```
cdp-party-building/
├── cdp-party-building-uniapp/   # uni-app 工程（唯一工程目录，所有 npm 命令在此执行）
├── docx/                        # 需求与契约 + 归档文档
│   ├── 项目描述.md              # 6 大需求模块与功能点（需求唯一来源）
│   ├── 接口文档.md              # 后端接口契约（图文 / 留言 / 用户三类）
│   ├── codeimpl-sum/            # 设计实现文档（设计文档-feat-XXX-*.md）
│   └── bugfix/                  # Bug 修复文档（BUG修复-YYYYMMDD-*.md）
├── prototype/                   # 6 张原型图（首页 / 党员服务 / 电子档案 / 档案详情 / 个人中心 / ai学习）
└── md5.js                       # 密码加密算法（提供 hex_hmac_md5）
```

工程细节见 [`cdp-party-building-uniapp/README.md`](cdp-party-building-uniapp/README.md)。

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
```

**微信开发者工具**：导入目录 `cdp-party-building-uniapp/dist/dev/mp-weixin`。小程序 appid 配置在 `cdp-party-building-uniapp/src/manifest.json` 的 `mp-weixin.appid`（属环境配置，本文档不展示、不随文档传播）。改源码后监听会自动重编，在开发者工具点「编译」即可。

## 需求模块与实现状态

| 需求模块 | 对应功能 | 状态 |
|---|---|---|
| 工程基础 | feat-001 脚手架 | ✅ done |
| 工程基础 | feat-002 设计规范与主题、feat-003 请求层与鉴权、feat-004 静态资源与原型接入、feat-006 框架与导航 | ⏳ not-started |
| 新闻与学习 | feat-007 首页与专题专栏、feat-008 内容详情与互动 | ⏳ not-started |
| 党员服务互动 | feat-010 党务公告与支部留言 | ⏳ not-started |
| 党员服务互动 | feat-009 活动报名与签到 | 🚫 blocked（无对应接口） |
| 数智党建手册 | feat-011 知识库与电子手册 | 🚫 blocked（无对应接口） |
| 党员电子档案 | feat-012 个人档案查看、feat-013 我的收藏与浏览记录 | ⏳ not-started |
| VR 特色党建 | feat-015 720° 全景漫游 | 🚫 blocked（无资源与接口） |
| 通用基础后台 | feat-016 | 🚫 blocked（需求未提供功能点） |
| 收尾 | feat-014 积分体系、feat-017 跨平台审计、feat-018 文档交接 | 积分 blocked；其余 not-started |

状态口径以功能追踪文件为准：`blocked` 表示接口或需求缺失，禁止 mock、禁止编造接口、禁止用假数据占位。

## 接口与鉴权约定

- 基址 `https://szdj.cdszxjc.com/`，模块前缀 `apituwen`（图文）、`apiliuyan`（留言）、`apiuser`（用户）。
- 登录接口传 **API token**，其余业务接口传**登录返回的用户 token**。
- 密码传输统一 `hex_hmac_md5(pwd, 'cds')`（见 `md5.js`），禁止明文或裸 MD5。
- 列表接口图片必须拼接 `ossdir` + `wenjianurl`，禁止直接拼裸域名。
- 字段口径一律以 `docx/接口文档.md` 为准。

## 开发约定

- UI 以 `prototype/` 原型图为验收标准，布局不得自由发挥。
- 只用 `view` / `text` / `image` 等 uni-app 组件，不用 `div` / `span`；尺寸统一 `rpx`。
- 颜色只能用主题令牌（`theme.json` → SCSS/TS 令牌），`npm run theme:check` 会拦截色阶外颜色。
- 页面模板使用自定义组件时必须直接 `import X from '@/components/X/X.vue'`；经目录桶文件导入会导致小程序产物页面 JSON 缺失 `usingComponents`，微信开发者工具编译直接中断。
- 党员电子档案、实名认证属敏感数据，仅本人可见，禁止写入日志或出现在列表、mock 数据。
- 小程序 appid、API token 等环境配置不写入文档与提交说明。

## 文档索引

| 文档 | 用途 |
|---|---|
| `docx/项目描述.md` | 需求范围（6 大模块与功能点） |
| `docx/接口文档.md` | 后端接口契约 |
| `docx/codeimpl-sum/` | 各功能的设计实现归档 |
| `docx/bugfix/` | Bug 修复归档 |
| `prototype/` | 原型图（UI 验收标准） |

## 已知阻塞

- API token 的获取方式后端文档未说明，未解决前请求层与登录鉴权不标记为完成。
- `src/static/` 中原始资源文件名含空格与括号，需在资源规范化环节统一重命名后引用。
- 开发者工具首次渲染待确认（此前编译崩溃已修复并重编产物）。
