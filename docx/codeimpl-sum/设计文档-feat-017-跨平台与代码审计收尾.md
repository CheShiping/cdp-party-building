# 设计文档 · feat-017 跨平台兼容与代码审计收尾

- 功能编号：feat-017（依赖 feat-013）
- 状态：**已实施（2026-09-16）**
- 审计依据：`uniapp-crossplatform-audit-skill`（6 维）、`uniapp-code-audit-skill`（10 维）
- 目标平台：微信小程序（首要）、H5、App
- 覆盖范围：**仅已实现功能**（feat-005 ~ feat-013），不含 blocked 功能的能力实现

---

## 1. 审计结论概览

| 维度 | 结论 | 说明 |
|---|---|---|
| 模板标签（跨端） | ✅ 通过 | 全库扫描 `<div\|span\|p\|h1-6\|img\|ul\|li\|section\|a>` → **0 命中**；模板统一使用 `view / text / image / input / button / rich-text / web-view` |
| 浏览器 API（跨端） | ✅ 通过 | `window.` 仅出现在 `pages/detail` 的 `#ifdef H5` 分支（`window.open`）；无 `document` / `localStorage` / `fetch` 直用 |
| 条件编译（跨端） | ✅ 通过 | `#ifdef MP-WEIXIN`（分享按钮、showShareMenu、更新检查）、`#ifndef MP-WEIXIN`（复制链接分享）、`#ifdef H5`（外链打开）均成对且语义正确 |
| 平台配置 | ✅ 通过 | `manifest.json` 的 `mp-weixin.appid`、`h5`、`app-plus` 字段齐备；`pages.json` 各页 style 明确 |
| 安全合规 | ⚠ 已登记风险 | 无硬编码密钥（Pexels 残留已删）；密码仅以 HMAC-MD5 形态传输与存储；**后勤风险**：`apiuser/listinfo` 后端未鉴权（已在 AGENTS.md 隐私红线登记，前端双重拦截） |
| 性能 / 小程序专项 | ❌→✅ **已修复** | **P0：小程序主包 2582.6KB 超 2MB 上限**（详见 §2） |
| 代码质量 | ⚠ 已清理 | 调试日志（`App.vue` console.log）、死代码（3 个脚手架残留文件）已移除 |
| 冗余与死代码 | ❌→✅ 已修复 | `utils/pexels.ts`、`constants/env.ts`、`utils/platform-share.ts` 均无引用（详见 §2） |
| UI/主题一致性 | ✅ 通过 | `theme:check` 扫描 68 文件 0 违规；表单/字号/间距全部走 token（feat-002 门禁持续生效） |
| API 契约 | ✅ 通过 | 请求层统一 `requestClient`，未发现业务代码直连 `uni.request`（仅上传头像与裸文本两处封装内使用） |

---

## 2. 问题与修复

### 2.1 【P0】小程序主包超限（2582.6 KB > 2048 KB）

- 维度：性能 / 小程序专项
- 位置：`src/static/`、`src/utils/`、`src/constants/`
- 风险描述：微信小程序主包上限 2MB，超限无法上传/预览；静态目录下**所有**文件都会被打入主包，未被代码引用的大图同样计入。
- 根因：feat-004 规范化阶段把原型用到的**全部** png 迁入工程（含 feat-009/011/015 等暂不实现功能的预留图），但"暂不实现"的页面并未引用它们。
- 修复：移出 7 张**无任何代码引用**的资源，并删除 3 个脚手架残留死代码文件：

| 处置 | 对象 | 体积/说明 |
|---|---|---|
| 移出静态资源 | `banner-20th-congress.png` | 408.7 KB（feat-009 预留） |
| 移出静态资源 | `banner-fourth-plenum.png` | 401.5 KB（feat-009 预留） |
| 移出静态资源 | `banner-ai-tech.png` | feat-011 / feat-015 预留 |
| 移出静态资源 | `card-idea-quill.png`、`card-report-doc.png`、`card-notice-bell.png` | 预留插画（未被引用） |
| 移出静态资源 | `card-study-edit.png` | 预留插画（未被引用） |
| 删除死代码 | `src/utils/pexels.ts` | 脚手架残留（Pexels 图片搜索，未被引用） |
| 删除死代码 | `src/constants/env.ts` | 仅被 pexels 引用；同时移除 `env.d.ts` 的 `VITE_PEXELS_API_KEY` 声明与 `constants/index.ts` 的导出 |
| 删除死代码 | `src/utils/platform-share.ts` | 未被引用，且含 `console.log` 与 `window.location`（小程序端不可用） |
| 清理日志 | `src/App.vue` | 移除 `onShow/onHide` 的 `console.log('App Show/Hide')` |

- 同步更新：`src/static/README.md` 新增第 8 条规则（预留资源不进产物，解锁对应 feat 时再迁入）。
- **验证**：产物总大小 **2582.6 KB → 1684.4 KB**（降幅 34.8%），低于 2MB 上限。

### 2.2 【P2】脚手架残留死代码

- `pexels.ts` / `env.ts` / `platform-share.ts` 均为工程初始化模板遗留，无任何引用；`platform-share.ts` 内含小程序端不可用的 `window.location` 与调试日志。
- 已删除，`constants/index.ts` 桶导出同步收敛。

### 2.3 【P3】调试日志残留

- `App.vue` 的 `App Show` / `App Hide` 日志在真机控制台无信息量，已移除。

### 2.4 未修复（登记为遗留）

| 项 | 说明 |
|---|---|
| 首屏并发请求 | 首页 `onShow` 并发 4 个请求（类别 + 轮播 + AI 推送 + 最新内容），实测响应正常；如需进一步优化可改为分类缓存或骨架分级加载（未做） |
| Sass `@import` 弃用告警 | 构建输出大量 `DEPRECATION WARNING [import]`（Dart Sass 3.0 将移除 `@import`），迁移 `@use` 涉及全局样式出口重构，属已登记技术债（feat-002 L3） |
| `apiuser/listinfo` 后端鉴权缺失 | 前端已在列表点击与详情 `onLoad` 双重拦截，仍建议后端补校验 |

---

## 3. 用户新要求落地：无接口功能同样呈现原型界面

> 2026-09-16 用户明确要求：**"有些暂没有接口的，界面效果还是要做出来的"**。此前做法（无接口 → 整页空态 / 区块省略）作废，已写入 `AGENTS.md` 范围边界。

### 3.1 AI 学习页（对应 feat-011 原型）

- 原状：`pages/ai` 仅为 `AppEmpty` 骨架页（"AI 学习建设中"）。
- 现状：按 `prototype/ai学习.png` 完整复刻 —— 红底头部 + 搜索框 + 分类 chips 横滑 + 图文卡片列表（封面 + 标题 + 摘要 + 图文标签 + 日期 + 阅读数）+ 分页/空态/错误重试，并**用 apituwen 真实接口落地**：
  - chips = 「推荐」（专题学习父类别）+ 子类别（按后端 `paixu` 倒序：党史学习 / 主体党日 / 二十大精神 / 红色思政 / AI党建 / 党章党规），与原型 chips 顺序一致；
  - 列表 = 推荐态 `tuwenfuliebiao(3)`、选中子类 `tuwenliebiao(id)`；
  - 搜索 = 接口 `biaoti` 模糊搜索（真实可用，非占位）。
- 仍然不做（无接口）：数智党建手册、知识库专区、学习进度、AI 问答对话。

### 3.2 党员服务「近期活动」活动卡

- 现状：按 `prototype/党员服务.jpg` 活动卡样式重做 —— 封面上图 + 活动标签 + 标题 + 摘要 + 日期行 + 「报名」按钮（原型元素齐备），数据取 `apituwen` 类别 10（最新活动）。
- 仍然不做：报名、签到、我的活动参与记录；地点 / 人数 / 报名状态等无接口字段**不编造**（不显示或显示占位），报名按钮点击提示"活动报名与签到暂未开放"。

### 3.3 首页搜索

- 首页搜索条由"提示即将上线"改为 `switchTab` 至 AI 学习页（该页搜索走真实接口）。

### 3.4 其他已符合要求的界面（复核）

| 位置 | 原型元素 | 状态 |
|---|---|---|
| 个人中心 积分卡 | 我的积分 / 支部排名（数值占位"—" + 说明） | 已按原型呈现 |
| 首页 VR 基地入口 | 入口 + 点击说明"VR 基地暂未开放" | 已按原型呈现 |
| 党员服务 宫格 | 5 项（活动报名 / 党员交流 / 通知公告 / 思想会地 / 意见反馈） | 已按原型呈现，未解锁项点击说明 |
| 档案详情 档案材料 | 区块 + 空态说明 | 已按原型呈现 |
| 电子档案 档案导出 | 底部按钮 + 点击说明 | 已按原型呈现 |

---

## 4. 验证证据

| 检查项 | 命令（`cdp-party-building-uniapp/`） | 结果 |
|---|---|---|
| 类型检查 | `npx vue-tsc --noEmit` | 0 error（修复 `constants/index.ts` 对已删 `env` 的引用后） |
| Lint | `npm run lint` | 0 error 0 warning |
| 主题门禁 | `npm run theme:sync` + `theme:check` | 白名单自检 OK；68 文件 0 违规 |
| 构建 | `npm run build:mp-weixin` | `DONE Build complete.` |
| **包体积** | `Get-ChildItem dist/build/mp-weixin -Recurse \| Measure-Object Length -Sum` | **1684.4 KB**（修复前 2582.6 KB）→ 低于 2MB 主包上限 |
| 产物自检 | `npm run check:pages` | 12 页 `ALL PAGES OK`（ai 页 usingComponents: app-empty, app-button） |
| 跨平台扫描 | H5 标签 / 浏览器 API / 条件编译 三类正则扫描 | 0 违规（仅 H5 条件编译块内使用 `window.open`） |

---

## 5. 遗留问题

1. AI 学习页的"视频"类型标签：接口无媒体类型字段，统一显示「图文」，不臆造视频标识。
2. 分类 chips 依赖 `tuwenleibie` 返回顺序（`paixu` 倒序），若后端调整排序，前端顺序随之变化。
3. 报名按钮 / 报名状态 / 活动地点与人数：等 feat-009 接口解锁后再填真实字段，UI 无需改动。
4. 包体已降至 1.64MB，后续新增资源（如 feat-009 活动封面）需重新评估（建议先压缩再做，且仅迁入被引用的文件）。
