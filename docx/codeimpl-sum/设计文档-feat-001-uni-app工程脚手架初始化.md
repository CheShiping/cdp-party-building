# 设计文档：feat-001 uni-app 工程脚手架初始化

## 1. 目标与范围

按 `.workbuddy/skills/uniapp/uniapp-app-generate-skill/SKILL.md` 生成可安装依赖、可运行构建的 uni-app（Vue3 + TS + Vite）工程，**微信小程序为首要目标端**，同时保留 H5 / App 编译能力。工程落地在 `cdp-party-building/`。

**范围内**

- 从技能自带 `assets/boilerplate/` 复制标准脚手架并替换占位符
- 目录结构、Pinia、请求层、平台抽象层、公共组件（App* 系列）
- 主题系统：theme.json → SCSS / TS 令牌 + 色阶白名单硬卡
- 静态资源：既有 54 张 png 迁入 `src/static/`
- 验证：npm install / type-check / lint / build:mp-weixin 全绿

**范围外（后续功能）**

- 主题取色与原型图逐像素对齐（feat-002）
- 请求层对接真实接口、HMAC-MD5 封装（feat-003）
- 静态资源重命名规范化与原型映射（feat-004）
- 业务页面（feat-005 起）

## 2. 涉及的接口

本功能为纯工程脚手架，**不调用任何后端接口**。`docx/接口文档.md` 的基址与模块前缀仅写入环境变量备用：

- 基址 `https://szdj.cdszxjc.com/` → `.env` 的 `VITE_BASE_URL` / `VITE_H5_BASE_URL` / `VITE_APP_BASE_URL`
- 模块前缀 `apituwen` / `apiliuyan` / `apiuser` 将在 feat-003 的请求层与 api 模块中拼接，本功能未引入

## 3. 文件结构与关键实现

```
cdp-party-building/
├── scripts/
│   ├── sync-theme.js       # theme.json → SCSS 配置 + colors.ts + 色阶白名单
│   ├── check-colors.js     # 色阶外颜色硬卡（exit 1）
│   └── verify.js           # 一键自检
├── src/
│   ├── api/{index.ts,modules/,types/}
│   ├── components/         # AppButton/AppCard/AppEmpty/AppInput/AppNavbar/AppPopup/AppTab
│   ├── constants/          # colors.ts（生成物，禁改）/enums/env/pages
│   ├── pages/              # index（首页）/list/form/profile（脚手架示例页）
│   ├── static/             # 54 张业务 png + avatar-placeholder + empty-data + tab-bar/
│   ├── stores/{index.ts,modules/{user,app}.ts}
│   ├── styles/             # config/ tokens/ _functions _mixins global variables
│   ├── types/              # index.ts（ApiResponse）+ env.d.ts（新增）
│   ├── utils/              # platform*/request/storage/date/format/validate/pexels
│   ├── App.vue / main.ts / manifest.json / pages.json
├── theme.json              # 主题唯一人工源头（主色 #c62828 党建红）
├── index.html / vite.config.ts / tsconfig.json / .eslintrc.cjs
└── .env / .env.example
```

关键实现点

1. **构建链**：`@dcloudio/vite-plugin-uni` + Vite 5；`vite.config.ts` 配置 `@` → `src` 别名，并自动注入 `@import "@/styles/variables.scss"`，业务样式零样板引用令牌。
2. **主题系统**：`theme.json` 主色改为党建红 `#c62828`（feat-002 再按原型图取色校准）；`npm run theme:sync` 生成 50~900 色阶（JS 与 SCSS 同源 mix 公式）；`npm run theme:check` 扫描 `src/` 拦截任何色阶外颜色。
3. **构建前置**：`predev:*` / `prebuild:*` 自动跑 `theme:sync`，保证令牌与 theme.json 永不漂移。
4. **manifest.json**：`mp-weixin.appid` 与根 `appid` 留空（待用户提供微信小程序 appid），`vueVersion: 3`。
5. **静态资源**：仓库根 `static/`（54 张 png）迁入 `src/static/`，符合 uni-app Vite 工程的资源目录约定（根级 static 不会被编译拷贝）。
6. **环境变量**：新增 `src/env.d.ts` 声明 `ImportMetaEnv`，使 `import.meta.env.*` 通过 vue-tsc 严格检查。
7. **启动脚本**：`init.sh` / `init.ps1` 增加"自动进入子工程目录 `cdp-party-building/`"分支，保持标准启动路径可用。

## 4. 状态与数据流

- 主题：theme.json（人工源）→ sync-theme.js → `src/styles/config/_theme-config.scss` + `src/constants/colors.ts` + `scripts/.theme-scale.json` → 业务代码消费 `$color-*` / `COLOR_*`。
- 状态：Pinia（`stores/modules/user.ts`、`app.ts`）在 `main.ts` 注册，`createSSRApp` 保证小程序端生命周期正确。
- 请求：`utils/request.ts` 按端选择 baseURL（H5 / App / 其他），统一注入 token 与错误提示；本功能未接业务接口。
- 页面：脚手架示例 4 页（首页 / 列表 / 表单 / 我的）+ 3 项 tabBar，后续功能替换。

## 5. 验证证据

在 `cdp-party-building/` 下执行：

| 命令 | 结果 |
|---|---|
| `npm install` | `added 1095 packages`（首次安装曾因并发安装导致 node_modules 损坏，已清空重装后完整） |
| `npm run theme:sync` | 生成 `_theme-config.scss`、`colors.ts`、`.theme-scale.json` |
| `npm run theme:check` | `[check-colors] OK：扫描 51 个文件，颜色均在色阶白名单内。` |
| `npm run type-check` | `vue-tsc --noEmit` 无输出，0 error |
| `npm run lint` | `eslint src --ext .ts,.vue` 0 error 0 warning |
| `npm run build:mp-weixin` | `DONE Build complete.`，产物 `dist/build/mp-weixin/` 含 `app.json` / `project.config.json` / `static`（63 个文件） |
| `../init.ps1` | 标准基线脚本：install → type-check → lint → build:mp-weixin 全绿 |

构建产物校验：`app.json` 中 `navigationBarTitleText = "CDP 智慧党建"`，tabBar `selectedColor = #c62828`，pages 与 tabBar list 与 `src/pages.json` 一致。

修复的两处脚手架缺陷（模板自带）

1. `AppNavbar.vue`：`const props =` 定义为未使用变量 → 去掉赋值；`AppPopup.vue`：`closeOnMask` 未定义（`no-undef`）→ 改为 `props.closeOnMask`；`pages/form/index.vue`：移除未使用 `onMounted` 导入。
2. `AppInput.vue` 的 `@input` 事件与 DOM `InputEvent` 类型冲突 → 回调参数按 `InputEvent` 接收、内部断言为 uni 事件结构；`utils/platform-image.ts` 的 `tempFilePaths` 跨端类型 `string | string[]` → 归一为数组。

## 6. 遗留问题

- **微信小程序 appid 未提供**：`src/manifest.json` 的 `mp-weixin.appid` 与根 `appid` 为空，导入开发者工具时可用测试号，正式发布前需填入。
- **主色待校准**：`#c62828` 为脚手架初值，feat-002 需按 `prototype/` 原型图取色对齐。
- **静态资源命名未规范化**：54 张 png 仍带空格与括号（如 `icon1 (2).png`），feat-004 统一重命名并同步引用。
- **Sass `@import` 弃用告警**：Dart Sass 3.0 将移除 `@import`，属脚手架模板既有实现，暂不影响构建；可在 feat-017 收尾时迁移到 `@use`。
- **示例页含 mock 数据**：`src/api/modules/demo.ts` 与 `pages/list`、`pages/form` 为脚手架演示页，后续功能实现时应整体替换，不得作为业务数据来源。
