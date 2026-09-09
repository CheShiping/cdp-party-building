# 设计文档 feat-004 原型图接入（资源规范化 + 页面映射收口）

| 项目 | 内容 |
|---|---|
| 功能编号 | feat-004 |
| 文档版本 / 状态 | v1.0，已收口（2026-09-09） |
| 依赖 | feat-001；设计基线并入 feat-002 |
| 权威输入 | `prototype/`（6 张）、`src/static/`（62 张 png） |

## 1. 目标与范围

- 原始 png 规范化命名（去空格/括号、小写 kebab-case）——前次会话已完成（54 张重命名，残留 0）
- 本批收口：① 5-tab 图标（`tab-home/service/ai/archive/mine ±active`）由 feat-006 落地引用；② 头像规则按接口实测修正；③ 页面级原型映射与取色基线收口到 feat-002 设计文档（第 3 章取色、第 6 章尺寸）与 `pages.json`/全局样式

## 2. 原型 → 页面映射（最终版）

| 原型图 | 页面 | 状态 |
|---|---|---|
| 首页.jpg | `pages/index`（feat-007） | ✅ 已实现 |
| 个人中心.jpg | `pages/profile`（feat-005） | ✅ 已实现 |
| 党员服务.jpg | `pages/service`（骨架；feat-010 待实现） | 骨架 |
| ai学习.png | `pages/ai`（骨架；feat-011 blocked） | 骨架 |
| 电子档案.jpg / 档案详情.jpg | `pages/archive`（骨架；feat-012 待实现） | 骨架 |

取色/尺寸基线：主色 `#C82028`、中性 10 阶、Gutter 24rpx、卡片圆角 12rpx、正文 28rpx（详见 `设计文档-feat-002` 第 3/4/6 章）。

## 3. 资源引用规则更新（对照表见 `src/static/README.md`）

- **头像规则实测修正**：`apiuser/login`/`userinfo` 实际返回 `touxiang` 字段（可能为 null）——非空用接口值（`resolveFileUrl` 拼基址），为空才用 `avatar-placeholder.png` 兜底；上传成功展示接口返回路径（不变式 9）
- 装饰性图标（宫格/菜单/箭头/搜索/tabBar）允许静态引用；接口有对应图片字段的场景一律接口值优先、静态图仅兜底

## 4. 验证证据

- 空格/括号文件复查 = 0（前次证据沿用）
- `build:mp-weixin` 产物 `static/` 完整（63 文件）；7 页面 usingComponents 自检通过
- 首页/个人中心分别与 `首页.jpg`/`个人中心.jpg` 对照复刻（结构/配色/布局一致，见 feat-005/007 设计文档）
