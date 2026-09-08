# CDP 智慧党建（uni-app 小程序端）

基于 **uni-app + Vue3 + TypeScript + Vite + Pinia** 的党建小程序工程，**微信小程序为首要目标端**，同时保留 H5 / App 编译能力。

## 技术栈

| 项 | 值 |
|---|---|
| 框架 | uni-app 3.x（Vue 3） |
| 语言 | TypeScript 5.x |
| 构建 | Vite 5.x |
| 状态管理 | Pinia 2.x |
| 样式 | SCSS + 设计令牌（theme.json 驱动） |
| 目标端 | mp-weixin（首要）/ h5 / app |

## 快速开始

```bash
# 安装依赖
npm install

# 主题令牌同步（改 theme.json 后必跑）
npm run theme:sync
npm run theme:check   # 色阶外颜色硬卡，必须无违规

# 类型检查 / lint
npm run type-check
npm run lint

# 微信小程序
npm run dev:mp-weixin     # 开发，产物 dist/dev/mp-weixin
npm run build:mp-weixin   # 生产，产物 dist/build/mp-weixin

# H5 / App
npm run dev:h5
npm run build:app
```

用微信开发者工具打开 `dist/dev/mp-weixin` 即可预览。

## 目录结构

```
cdp-party-building/
├── scripts/              # 主题同步、色阶校验、一键验证
├── src/
│   ├── api/              # 接口封装（modules/ 按业务模块，types/ DTO）
│   ├── components/       # 全局公共组件（App* 系列，页面必须复用）
│   ├── constants/        # 常量（colors.ts 由主题生成，禁止手改）
│   ├── pages/            # 业务页面
│   ├── static/           # 静态资源（54 张业务 png + 占位图 + tabBar 图标）
│   ├── stores/           # Pinia（modules/user、modules/app）
│   ├── styles/           # 设计令牌与全局样式
│   ├── types/            # 全局类型
│   ├── utils/            # 平台抽象、请求、存储、日期等工具
│   ├── App.vue
│   ├── main.ts
│   ├── manifest.json
│   └── pages.json
├── theme.json            # 主题唯一人工源头
└── vite.config.ts
```

## 主题系统

- `theme.json` 是唯一人工编辑的主题源（当前主色 `#c62828` 党建红）。
- 运行 `npm run theme:sync` 生成 `src/styles/config/_theme-config.scss`、`src/constants/colors.ts`、`scripts/.theme-scale.json`。
- 业务代码只能使用 `$primary-*/$gray-*/$color-*`（SCSS）或 `PRIMARY_*/GRAY_*/COLOR_*`（TS），`npm run theme:check` 会拦截任何色阶外颜色。

## 接口约定

- 基址 `https://szdj.cdszxjc.com/`，模块前缀 `apituwen` / `apiliuyan` / `apiuser`，统一在 `.env` 的 `VITE_BASE_URL` 配置。
- 登录接口传 API token，其余业务接口传登录返回的用户 token。
- 密码传输统一 `hex_hmac_md5(pwd, 'cds')`，禁止明文或裸 MD5。

## 静态资源

- 业务图片位于 `src/static/`（54 张 png 已迁入，重命名规范化见后续功能）。
- 列表接口图片必须拼接 `ossdir` + `wenjianurl`，禁止直接拼裸域名。

## 开发红线

- 不使用 `div`/`span`/`p` 等 H5 标签，只用 `view`/`text`/`image` 等 uni-app 组件。
- 不使用 CSS 变量 `var(--x)`，统一用 SCSS 变量。
- 重要图片用 `image` 组件，不用 `background-image`。
- 尺寸统一 `rpx`，刘海屏做安全区适配。
- UI 以 `prototype/` 原型图为验收标准；接口以 `docx/接口文档.md` 为唯一契约。
