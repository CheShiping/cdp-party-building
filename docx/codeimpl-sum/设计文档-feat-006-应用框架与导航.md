# 设计文档 feat-006 应用框架与导航

| 项目 | 内容 |
|---|---|
| 功能编号 | feat-006 |
| 文档版本 / 状态 | v1.0，已实施并验证（2026-09-09） |
| 依赖 | feat-005 |
| 权威输入 | `src/static/README.md`（tab 图标对照表）、feat-002 设计基线 |

## 1. 目标与范围

- tabBar 五页主框架：首页 / 党员服务 / AI学习 / 电子档案 / 个人中心（图标取 `static/tab-bar/tab-*`）
- 页面路由：登录页、专题列表页注册；删除模板 `pages/list`、`pages/form` 与 demo mock
- 通用骨架：党员服务 / AI学习 / 电子档案三页为"建设中"骨架页（对应功能后续批次）
- 启动引导与守卫：App.vue `bootstrap()`（登录态恢复/静默续期/未登录跳登录页）+ 业务页 `onShow requireLogin()`
- 空态（AppEmpty）/加载（骨架 shimmer）/错误（重试按钮）三态齐备

## 2. pages.json 要点

- `globalStyle`：导航栏 `#c82028` 白字、窗体底 `#f5f5f5`（feat-002 校准值）
- `tabBar`：`selectedColor #c82028`、`color #acacac`、5 项图标 `static/tab-bar/tab-{home,service,ai,archive,mine}{,-active}.png`
- 首页/个人中心/登录页 `navigationStyle: custom`（原型为红头部）；专题列表页开启 `enablePullDownRefresh`
- 路由常量同步：`src/constants/pages.ts`（PagePaths/PageTitles）

## 3. 文件结构与关键实现

| 文件 | 说明 |
|---|---|
| `src/pages.json` | 5-tab 框架 + 路由注册（见上） |
| `src/pages/ai/index.vue`、`src/pages/service/index.vue`、`src/pages/archive/index.vue` | 骨架页（AppEmpty；底色按原型：AI/首页系 `#F5F5F5`，服务/档案系 `#F2F5FA`） |
| `src/App.vue` | `bootstrap()`：needLogin 且当前非登录页 → `reLaunch('/pages/login/index')` |
| 删除 | `pages/list/`、`pages/form/`、`api/modules/demo.ts`（mock 清理） |

守卫规则（uniapp-components-skill）：tab 页与业务页 `onShow` 先 `requireLogin()`；未登录保存回跳 → reLaunch 登录页；登录成功 `redirectAfterLogin()` 消费回跳。

## 4. 验证证据

- `type-check` 0 error；`lint` 0/0；`build:mp-weixin` DONE Build complete
- **产物自检（不变式 7）**：脚本遍历 `dist/build/mp-weixin` 全部 7 页 JSON，`usingComponents` 覆盖 WXML 全部自定义组件标签 → `ALL PAGES OK`
- 全库 grep `pages/list|pages/form|PagePaths.LIST|modules/demo` → 0 命中（无死引用）

## 5. 遗留问题

- L1：党员服务/AI学习/电子档案为骨架页，分别待 feat-010 / feat-011(blocked) / feat-012 解锁
- L2：未做"启动页/引导页"（原型未提供，不臆造）
