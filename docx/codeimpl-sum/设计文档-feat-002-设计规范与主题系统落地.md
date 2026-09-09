# 设计文档 feat-002 设计规范与主题系统落地

| 项目 | 内容 |
|---|---|
| 功能编号 | feat-002 |
| 功能名称 | 设计规范与主题系统落地（设计令牌 / 党建红主题色 / 全局样式 / 组件样式基座） |
| 文档版本 | v1.0（设计态，未实施） |
| 编写日期 | 2026-09-09 |
| 文档状态 | **待评审 → 评审通过后按第 11 章分步实施** |
| 依赖 | feat-001（uni-app 工程脚手架，已 done） |
| 被依赖 | feat-005 登录、feat-006 框架导航、feat-007 首页、feat-010 留言、feat-012 档案、feat-013 收藏 |
| 权威输入 | `prototype/`（6 张原型图，取色唯一来源）、`uniapp-style-skill`（D01–D34）、`uniapp-theme-skill`（色阶/尺寸/圆角/硬编码治理） |
| 代码基线 | `cdp-party-building-uniapp/`（feat-001 产物，install/type-check/lint/build 全绿） |

---

## 0. 阅读指引

| 你是 | 建议读 |
|---|---|
| 只想知道最终色板 | 第 3.4 节（色板总表）+ 附录 B（速查表） |
| 要实现本功能 | 第 8、9、10、11 章（组件基座 / 全局样式 / 工具链改造 / 分步计划） |
| 要做 Code Review | 第 2.3 节（现状缺陷清单）+ 第 12 章（验证方案）+ 第 14 章（决策记录） |
| 后续写页面（feat-007 起） | 第 4–7 章（色彩/排版/间距/圆角）+ 第 9 章（全局类） |

**本文档的三条硬约束（来自 AGENTS.md 不变式与本 skill 红线）**：

1. **原型即验收标准**：色值与关键尺寸必须能回溯到 `prototype/` 的实测数据（第 3 章）。
2. **业务代码零硬编码**：`src/` 下除 `styles/` 与 `constants/colors.ts` 外，禁止出现任何颜色/字号/间距/圆角/z-index 字面量，否则 `npm run theme:check` 与 style-skill 审计（D01/D06/D09/D18/D33）拦截。
3. **单一配置入口**：所有"可换肤"的色值只写在 `theme.json`，经 `npm run theme:sync` 生成 SCSS / TS / 白名单三方产物；**禁止手改生成物**。

---

## 1. 目标与范围

### 1.1 目标（Done 定义）

| # | 目标 | 验收方式 |
|---|---|---|
| G1 | 建立四层 Design Token 架构（config → primitive → semantic → components） | `src/styles/` 目录结构与第 10.5 节产物一致 |
| G2 | 主色定为**党建红**，色值与 `prototype/` 实测一致（误差 ≤ ±3/通道） | 第 3 章实测表 + `theme.json` + `theme:check` |
| G3 | 中性色阶 / 功能色 / 金色 / 宫格强调色全部落到语义 Token | 第 4 章色板总表逐项可 grep 到变量 |
| G4 | 修正现有字号/间距/圆角阶梯缺陷（第 2.3 节 B1–B3） | 编译后页面字号 ≥ 20rpx；`grep` 无裸 rpx |
| G5 | 补齐全局样式基座（文本层级 / 工具类 / 布局 zone / 动画预设） | `App.vue` 引入后四类全局类可用 |
| G6 | 补齐组件样式基座（`$comp-*`，覆盖 15 类组件） | 现有 7 个组件 + 后续组件均只引用 Token |
| G7 | 工具链闭环：`theme.json → theme:sync → theme:check` 覆盖新 Token | 三条命令全绿 |
| G8 | 全量回归：type-check / lint / build:mp-weixin 通过 + 产物 `usingComponents` 自检 | 第 12 章命令与证据 |

### 1.2 非目标（明确不做）

| 不做 | 原因 |
|---|---|
| 运行时换肤（`data-theme` / `--primary-500` CSS 变量） | 单品牌党建应用无换肤需求；小程序 `pages.json`/tabBar 不支持 CSS 变量；YAGNI（ADR-003） |
| 深色模式（Dark Mode） | 原型无深色稿；`uniapp-theme-skill` 明确不负责；列入遗留问题 |
| 写业务页面 | 属 feat-006/007；本文档只提供基座 |
| 动图 / 插画 / 图标资源制作 | 属 feat-004 静态资源 |
| 改业务逻辑（props / 生命周期 / 接口） | style-skill 约束红线 |
| 引入第三方 UI 库（uView / Vant / ColorUI） | D29 明令禁止 |

### 1.3 与 feature_list 的关系

feat-002 是 **feat-005 → feat-013 的前置**（`dependencies: ["feat-002"]`）。本文档只产出设计；实施完成后才把 `feature_list.json` 置 `done` 并写证据。

---

## 2. 输入与依据

### 2.1 原型图清单（取色唯一来源）

| 文件 | 尺寸(px) | 对应功能 | 取色用途 |
|---|---|---|---|
| `prototype/首页.jpg` | 750 × 2289 | feat-007 首页 | 头部红渐变、暖底卡片、页面底色 |
| `prototype/党员服务.jpg` | 750 × 1540 | feat-009/010 | 宫格图标强调色、冷底页面 |
| `prototype/电子档案.jpg` | 750 × 1353 | feat-012 | 冷底页面、暖色档案卡、金色 |
| `prototype/档案详情.jpg` | 750 × 1353 | feat-012 | 深红、浅绿（成功态） |
| `prototype/个人中心.jpg` | 750 × 1353 | feat-005/013 | 头部红、头像区、列表项 |
| `prototype/ai学习.png` | 750 × 1335 | feat-011（blocked） | 头部红、亮红图标 |

> **换算基准**：6 张图宽均为 **750px**，而 uni-app 以 **750rpx = 屏宽**，因此 **原型 1px = 1rpx**，实测像素值可直接当 rpx 使用（第 6.4、5.1 节的尺寸测量基于此）。

### 2.2 技能规范依据

| 规范 | 来源 | 本文落地位置 |
|---|---|---|
| 四层 Token 架构、自动注入 | style-skill §2 | 第 10.5 节 |
| 34 条红线 D01–D34 | style-skill §1 | 附录 C + 全文标注 |
| 排版系统（字号/行高/字重/文本层级） | style-skill §4 | 第 5 章 |
| 间距系统 + Page Gutter + 模块间距 | style-skill §5 | 第 6 章 |
| 语义变量（中性色阶/文字/背景/边框/圆角/阴影/Z 层级） | style-skill §6 | 第 4、7 章 |
| 组件级 Token（D33） | style-skill §6.9 | 第 8 章 |
| 混入（布局/文本/安全区/1px 细线） | style-skill §7.3–7.7 | 第 9 章 |
| 动画 Token 与 6 个预设类 | style-skill §8 | 第 7.4、9.1 节 |
| 按钮/底部固定按钮规范 | style-skill §9 | 第 8.3 节 |
| Utility 全局工具类 | style-skill §16 | 第 9.1 节 |
| 页面布局 zone 类 + 5 种骨架 | style-skill §18 | 第 9.1 节 |
| WCAG AA 对比度（D34） | style-skill §17 | 第 4.10 节 |
| 色阶 50–900、尺寸阶梯、圆角阶梯、硬编码按上下文替换（A–E 类） | theme-skill | 第 4.2、6、7.2、10.4 节 |

### 2.3 现状基线盘点与缺陷清单

**现有文件矩阵**（`cdp-party-building-uniapp/src/styles/`）

| 文件 | 现状 | 评价 |
|---|---|---|
| `config/_theme-config.scss` | 由 `sync-theme.js` 生成：`$theme-primary` 等 8 个变量 | ✅ 单一入口，需扩字段 |
| `tokens/_primitive.scss` | 主色阶/灰阶（函数生成）+ 间距/字号/圆角/阴影阶梯 | ⚠️ 阶梯值有缺陷，见 B1–B3 |
| `tokens/_semantic.scss` | 颜色/间距/字体/圆角语义别名 | ⚠️ 缺 Z 层级、缺功能色文本变体、缺背景/暖色/金色 |
| `tokens/_components.scss` | 15 组 `$comp-*`（按钮/导航/Tab/Popup/头像/列表/空态/页面/卡片） | ⚠️ 覆盖不足，缺 Tag/Badge/Grid/Divider/Input/Skeleton/FixedButton |
| `_functions.scss` | `rgba-with-alpha()` / `primary-palette()` / `gray-palette()` | ✅ 与 JS 同源，保留；需加 `gold-palette()` |
| `_mixins.scss` | `flex-center` / 文本省略 / 安全区 | ⚠️ 缺布局混入、hairline、卡片混入 |
| `variables.scss` | 统一出口（`@import` 三件套） | ✅ 需追加 `_animations/_utilities/_layout/_typography` |
| `global.scss` | 仅 `.page/.safe-area-*/.text-*/.flex*/.ellipsis` 共 6 类 | ❌ 远不足以支撑 D19–D32 |
| 无 | `_typography` / `_animations` / `_utilities` / `_layout` / `_page` | ❌ 需新增 |
| `App.vue` | `@import '@/styles/global.scss'` | ✅ 需改为引入统一出口 |
| `vite.config.ts` | `additionalData: '@import "@/styles/variables.scss";'` | ✅ 已全局注入（注意：非 `@use ... as *`，沿用即可） |

**缺陷清单（本次必须修）**

| 编号 | 缺陷 | 证据 | 影响 |
|---|---|---|---|
| **B1** | 字号基数错误：`theme.json.font.base = 12rpx` → 生成 12/14/16/18/24/30rpx | `theme.json` + `_primitive.scss:39-44` | 正文 16rpx(≈8px) 远低于可读下限与 style-skill 的 28rpx，**页面文字过小** |
| **B2** | 圆角基数偏小：`radius.base = 4rpx` → sm4/md8/lg12/xl16 | `_primitive.scss:47-51` | 标签/按钮圆角 4–8rpx 偏尖；但**卡片 12rpx 与原型实测吻合**，需保留该值 |
| **B3** | 间距阶梯缺档：无 20rpx、无 64rpx；`space-5=24` 与"×5=20"语义不符 | `_primitive.scss:29-36` | 语义与数值错位，难维护 |
| **B4** | 无 Z 层级 Token | 全局 grep 无 `$z-` | 违反 D09 |
| **B5** | 无动效 Token（时长/缓动）与动画预设类 | 全局 grep 无 `$transition-`/`@keyframes` | 违反 D08 精神，各页面会各自写动画 |
| **B6** | 主色 `#c62828` 与原型实测 `#c82028` 偏差（G 通道 +8） | 第 3.2 节实测 | 与"原型即验收标准"冲突 |
| **B7** | 灰阶由 `grayBase #6b7280` 生成，得 `#c4c4c4/#525252` 等，与原型 `#acacac/#808080/#666/#333` 不吻合 | 第 4.3 节计算 | 文字灰度层级与原型不一致 |
| **B8** | 功能色无"文本安全变体"：success 2.78:1、warning 1.84:1、info 3.27:1（白底） | 第 4.10 节计算 | 违反 D34 |
| **B9** | 无 `$page-gutter`；`$comp-page-padding = 16rpx`，而原型实测页边距为 **24rpx** | 第 6.4 节实测 | 违反 D14，且视觉偏窄 |
| **B10** | `pages.json` tabBar：`selectedColor #c62828`、`color #9ca3af` | `src/pages.json:37-38` | 与实测选中红 `#c52329`、未选中 `#acacac` 不符 |
| **B11** | 全局类缺文本层级/工具/布局类 | `global.scss` 仅 6 类 | D19–D23、D30、D32 无载体 |
| **B12** | `$comp-navbar-title-height` 在 TS 侧硬编码 `TITLE_ROW_RPX = 88` | `AppNavbar.vue:23` | 双份真相，改 token 易漏（D01 精神） |

---

## 3. 原型取色

### 3.1 方法

用 .NET `System.Drawing`（本机 Windows PowerShell 5.1，无需装依赖）对 6 张原型图做四类分析：

1. **分区精确直方图**：把每张图按 `HEADER(0–10%)` / `BODY-TOP(10–30%)` / `BODY-MID(45–70%)` / `FOOTER(92–100%)` 分区，统计**未量化**的精确色值频次 Top6。
2. **头部红均值**：筛选 `R>120 且 G<110 且 B<110 且 R−G>55` 的像素求均值，并拆上下半段检测渐变。
3. **底部 tabBar**：统计 `y∈[0.93h, h]` 内的灰色像素（|R−G|<14 且 |G−B|<14 且 120<R<210）与红色像素均值。
4. **内容区强调色**：在 `y∈[0.08h, 0.35h]` 内过滤掉低饱和（max−min<60）与红色系后取 Top N。

附加测量：**页边距**（卡片左边缘 x）、**卡片圆角**（左上角像素剖面）、**文字行高**（暗像素连续段高度）、**头部红高度**（逐行红色占比剖面）。

### 3.2 原始数据（摘录）

**① 头部党建红（各图实测均值 / 上下半段）**

| 原型图 | 头部红均值 | 上半段 | 下半段 | 结论 |
|---|---|---|---|---|
| 首页.jpg | `#CC2428` | `#C42026` | `#DA2A2B` | 存在纵向渐变（上深下浅，Δ≈10） |
| 党员服务.jpg | `#C72126` | `#C52026` | `#C92326` | 近似纯色 |
| 个人中心.jpg | `#C72128` | `#C72128` | `#C72028` | 纯色 |
| 档案详情.jpg | `#C72128` | `#C72128` | `#C72028` | 纯色 |
| 电子档案.jpg | `#C62027` | `#C51F26` | `#C72028` | 纯色 |
| ai学习.png | `#C62126` | `#C62026` | `#C62226` | 纯色 |

**② 头部红众数簇（各图 Top1–Top6，未量化）**

```
#C82026  #C92027  #D12428  #C41D24  #CB2127  #C51E25
#C61F26  #CC2129  #C81F26  #C72027  #D02327  #D02329
```
簇心 ≈ **R200 / G32 / B38**。

**③ 底部 tabBar**

| 原型图 | 未选中灰 | 选中红 |
|---|---|---|
| 首页 | `#ABABAB` | `#C41D24` |
| 党员服务 | `#ABABAB` | `#C52329` |
| 个人中心 | `#ABABAB` | `#C52127` |
| 档案详情 / 电子档案 | `#ACACAC` | `#C52329` |
| ai学习 | `#ABABAB` | `#C6252C` |

**④ 页面底色 / 卡片 / 文字（分区 Top）**

| 类别 | 实测值 | 出现位置 |
|---|---|---|
| 页面底（中性） | `#F5F5F5`(33493) `#F6F6F6` | 首页、ai学习 |
| 页面底（冷调） | `#F2F5FA`(13656) `#F1F4F9` | 电子档案、党员服务、个人中心 |
| 卡片底 | `#FFFFFF` | 全部 |
| 暖色卡底 | `#FDF4ED`(5250) `#FCF3EA` `#FEF7E5`(6706) `#F6DCBB` | 首页、电子档案、个人中心 |
| 主色浅底 | `#FFEEEE`(2579) `#FFE4E3`(1790) `#F8C8C0` | 首页、电子档案 |
| 标题文字 | `#333333` `#2E2E2E` `#000000` | 全部 |
| 次级文字 | `#666666` | 全部 |
| 三级文字 | `#808080` | 全部 |
| 禁用/tabBar | `#ACACAC` `#ABABAB` | 全部 |
| 分割/边框 | `#D4D4D4` `#D8D8D8` `#D0D0D0` `#F0F0F0` | 党员服务、档案详情 |
| 成功浅绿 | `#D8F0D0`(254) | 档案详情 |

**⑤ 强调色（图标/标签，非红）**

| 色 | 实测 | 位置 |
|---|---|---|
| 琥珀/橙 | `#FFAF10` / `#E0A000`(2135) | 党员服务宫格 |
| 紫 | `#D895F2` / `#C080E0` | 党员服务宫格 |
| 蓝 | `#7087F1` / `#6080E0`(1197) | 党员服务宫格 |
| 珊瑚 | `#F47451` / `#E06040` | 首页、党员服务 |
| 亮红 | `#F55A56` / `#ED3B39`(1126) | 首页、ai学习、党员服务 |
| 深金 | `#BB7600`(172) / `#B97700` | 电子档案 |
| 浅金 | `#CD9C5A` / `#DEBD90` | 电子档案 |
| 深红 | `#A01820`(279) | 档案详情 |

### 3.3 误差与容差说明（重要）

- 原型为 **JPEG 有损压缩**（`ai学习.png` 为 PNG，噪声最小），同一平面色会有 ±8/通道 的抖动（如 `#C41D24`~`#D12428` 实为同一色）。
- 因此**不能**直接用单点取色值，必须取**众数簇心 / 分区均值**，本文所有结论色均标注来源与该来源的抖动范围。
- 归一化规则：簇心落在 `(200±3, 32±3, 38±3)` 时取 **`#C82028`**（同时落在各图均值 `#C72128` / `#C62027` 的 1 个通道步内）。
- 与现网主题色 `#C62828`（Material Red 800）的差异：**G 通道 +8、R 通道 −2**，即现网偏"砖红/柔和"，原型偏"正红/饱和"。**以原型为准**。

### 3.4 结论：色板总表（唯一权威）

| 分组 | Token（语义层） | 值 | 来源 |
|---|---|---|---|
| 主色 | `$color-primary` | **`#C82028`** | 头部红簇心 |
| 主色深 | `$color-primary-dark` | `#A41A21`（= primary-700） | 色阶 |
| 主色浅 | `$color-primary-light` | `#F5D5D6`（= primary-100） | 色阶 |
| 主色浅底 | `$color-primary-soft` | `#FFEEEE` | 首页/电子档案实测 |
| 头部渐变 | `$color-primary-gradient` | `linear-gradient(180deg,#C42026,#DA2A2B)` | 首页实测（其余页为纯色） |
| 页面底 | `$color-bg-page` | `#F5F5F5` | 首页/ai学习 |
| 页面底（冷） | `$color-bg-page-alt` | `#F2F5FA` | 电子档案/党员服务 |
| 卡片底 | `$color-bg-card` | `#FFFFFF` | 全部 |
| 暖底 | `$color-bg-warm` | `#FDF4ED` | 首页/电子档案/个人中心 |
| 三级底 | `$color-bg-tertiary` | `#F0F0F0` | 实测 `#F0F0F0/#F0F0F8` |
| 遮罩 | `$color-bg-mask` | `rgba(#333333, .6)` | 派生 |
| 文字主 | `$color-text-primary` | `#333333` | 实测（12.63:1 ✅） |
| 文字次 | `$color-text-secondary` | `#666666` | 实测（5.74:1 ✅） |
| 文字三 | `$color-text-tertiary` | `#808080` | 实测（3.95:1 ⚠️ 见 4.10） |
| 文字禁用 | `$color-text-disabled` | `#ACACAC` | 实测（2.27:1，D34 豁免） |
| 反白 | `$color-text-inverse` | `#FFFFFF` | 全部（头部红底白字 5.69:1 ✅） |
| 边框 | `$color-border` | `#E5E5E5` | 实测域内（`#D4D4D4`~`#F0F0F0`）取中 |
| 弱边框 | `$color-border-light` | `#F0F0F0` | 实测 |
| 成功 | `$color-success` / `$color-success-text` | `#4CAF50` / `#2E7D32` | 由 `#D8F0D0` 反推 / D34 派生 |
| 警告 | `$color-warning` / `$color-warning-text` | `#FFAF10` / `#A86400` | 实测 / D34 派生 |
| 错误 | `$color-error` / `$color-error-text` | `#F55A56` / `#D32F2F` | 实测 / D34 派生 |
| 信息 | `$color-info` / `$color-info-text` | `#7087F1` / `#4A5FC1` | 实测 / D34 派生 |
| 金色 | `$color-gold` / `$color-gold-light` | `#BB7600` / `#CD9C5A` | 电子档案实测 |
| 宫格强调 | `$color-accent-{amber,purple,blue,coral,red,gold}` | 见 4.8 | 党员服务/首页实测 |

---

## 4. 色彩系统

### 4.1 三层治理模型

```
第 1 层  色阶层（primitive，$primary-* / $gray-* / $gold-*）
         ↑ 由 theme.json + 生成函数产出，禁止业务引用
第 2 层  语义层（semantic，$color-* / $text-* / $bg-* / $border-*）
         ↑ 业务代码唯一引用入口（D01）
第 3 层  组件层（components，$comp-*）
         ↑ 组件内部唯一引用入口（D33）
```

规则：
- 页面 / 组件 **只能**引用第 2、3 层；引用第 1 层视为违规（灰度/换肤会失效）。
- 第 1 层改动 → 第 2 层自动跟随；第 2 层语义不得跨类借用（如背景色不得用 `$color-text-*`）。

### 4.2 主色：党建红

**基色**：`#C82028`（primary-500）

**色阶**（沿用工程现有 `mix` 公式，与 `scripts/sync-theme.js`、`_functions.scss` 三方同源；`level<500` 混白 `(1000-level)/1000*0.9`，`level>500` 混黑 `(level-500)/1000*0.9`）：

| Level | 值 | 用途 |
|---|---|---|
| 50 | `#F7DFE0` | 主色极浅底（选中行 hover） |
| 100 | `#F5D5D6` | `$color-primary-light`（浅色按钮底 / 标签底） |
| 200 | `#F0C1C3` | 图标底、分割 |
| 300 | `#EBACAF` | 禁用态主色 |
| 400 | `#E6989C` | 悬停过渡 |
| **500** | **`#C82028`** | **主色（按钮/导航/tabBar 选中/链接）** |
| 600 | `#B61D24` | `:active` 按压态 |
| 700 | `#A41A21` | `$color-primary-dark`（深底/强调文字） |
| 800 | `#92171D` | 头部渐变深色端 |
| 900 | `#80141A` | 极深强调（与 `#A01820` 实测同域） |

**场景映射**

| 场景 | 用色 |
|---|---|
| 顶部导航/头部背景 | `$color-primary`（纯色）或 `$color-primary-gradient`（首页） |
| 主按钮底 | `$color-primary`，文字 `$color-text-inverse`（5.69:1 ✅） |
| 主按钮按压 | `$primary-600` |
| 次要按钮底 | `$color-primary-light`，文字 `$color-primary-dark` |
| 描边按钮 | 底透明 + `$comp-hairline-width solid $color-primary` + 字 `$color-primary` |
| tabBar 选中 | `$color-primary`；未选中 `$color-text-disabled`（`#ACACAC`） |
| 标签/胶囊底 | `$color-primary-soft`（`#FFEEEE`）+ 字 `$color-primary` |
| 链接/可点文字 | `$color-primary`（白底 5.69:1 ✅） |

**禁用**
- 禁止把 `#C62828` / `#E02020` / `#F44336` 等"近似红"当主色（唯一入口 `$color-primary`）。
- 禁止在红色底上用 `$color-text-tertiary`（对比度不足），一律 `$color-text-inverse`。

### 4.3 中性色阶（显式 10 阶）

**决策**：放弃 `grayBase` 生成式（B7），改为 **theme.json 中显式声明 10 阶**，保证与原型锚点逐点吻合（ADR-002）。

| Level | 值 | 依据 | 语义绑定 |
|---|---|---|---|
| 50 | `#F5F5F5` | 实测（页面底） | `$color-bg-page` |
| 100 | `#F0F0F0` | 实测（`#F0F0F0/#F0F0F8`） | `$color-bg-tertiary` / `$color-border-light` |
| 200 | `#E5E5E5` | 域内插值（实测 `#D4D4D4`~`#F0F0F0`） | `$color-border` |
| 300 | `#D4D4D4` | 实测 | 输入框描边 / 占位图形 |
| 400 | `#ACACAC` | **实测锚点**（tabBar 未选中） | `$color-text-disabled` / `$color-text-placeholder` |
| 500 | `#808080` | **实测锚点**（三级文字） | `$color-text-tertiary` |
| 600 | `#666666` | **实测锚点**（次级文字） | `$color-text-secondary` |
| 700 | `#4D4D4D` | 插值 | 次级强调 |
| 800 | `#3D3D3D` | 插值 | 标题备选 |
| 900 | `#333333` | **实测锚点**（标题文字） | `$color-text-primary` |

> 阶差容差说明：本阶梯为"原型锚点优先"，阶差非等距（200→300→400 跨度较大）。这是**刻意选择**：保真优先于数学平滑；若后续需要中间灰，只能新增 `250/350` 子阶，不得改动锚点。

### 4.4 语义文字色

| Token | 值 | 对比度(白底) | 适用 | D34 |
|---|---|---|---|---|
| `$color-text-primary` | `#333333` | 12.63 ✅ | 标题、正文、列表标题 | 通过 |
| `$color-text-secondary` | `#666666` | 5.74 ✅ | 副标题、描述、表单标签 | 通过 |
| `$color-text-tertiary` | `#808080` | 3.95 ⚠️ | 时间戳、作者、辅助说明（**仅限 ≥28rpx 或 24rpx 加粗**） | **受控例外** |
| `$color-text-disabled` | `#ACACAC` | 2.27 | 禁用态、占位符 | D34 明示豁免 |
| `$color-text-placeholder` | `#ACACAC` | 2.27 | 输入框 placeholder | 豁免 |
| `$color-text-inverse` | `#FFFFFF` | — | 红/深色底反白（红底 5.69 ✅） | 通过 |

**受控例外说明（D34 vs 原型冲突）**：原型三级文字实测 `#808080`（3.95:1），不满足正文 4.5:1。处理：
1. 保留 `#808080` 作为 `$color-text-tertiary`，但**强制**其只用于大字号场景（`≥28rpx` 或 `24rpx + 600`），并在 `_typography.scss` 的 `.text-caption` 中把字号提到 `24rpx`；
2. 正文一律用 `$color-text-secondary`；
3. 该例外写入 `scripts/color-allowlist.json` 注释与本文档，避免审计误判。

### 4.5 背景色

| Token | 值 | 场景 |
|---|---|---|
| `$color-bg-card` | `#FFFFFF` | 卡片、弹窗、列表项、输入区 |
| `$color-bg-page` | `#F5F5F5` | 默认页面底（首页 / AI 学习 / 详情） |
| `$color-bg-page-alt` | `#F2F5FA` | 冷调页面底（电子档案 / 党员服务 / 个人中心） |
| `$color-bg-tertiary` | `#F0F0F0` | 输入区、骨架屏、未激活段 |
| `$color-bg-warm` | `#FDF4ED` | 专题卡片、档案卡、荣誉卡 |
| `$color-primary-soft` | `#FFEEEE` | 主色标签/徽标底 |
| `$color-bg-mask` | `rgba(#333333, 0.6)` | Popup / Modal 遮罩 |

> 两种页面底并存是**原型事实**（首页 `#F5F5F5`、档案类 `#F2F5FA`）。规则：一个页面只用一种底，禁止混用；新页面默认 `$color-bg-page`。

### 4.6 功能色

| 语义 | 基色（原型） | 文本安全变体 | 浅底 | 说明 |
|---|---|---|---|---|
| success | `#4CAF50` | `#2E7D32`（5.13 ✅） | `#D8F0D0`（实测） | 基色由实测 `#D8F0D0` 反推（混白 80% → `#DBEFDC`，误差 ±3） |
| warning | `#FFAF10`（实测） | `#A86400`（4.68 ✅） | `$color-bg-warm` | 基色白底仅 1.84:1，**禁止直接做文字色** |
| error | `#F55A56`（实测） | `#D32F2F`（4.98 ✅） | `$color-primary-soft`（实测 `#FFEEEE`） | 深红 `#A01820`（实测）用于错误深底 |
| info | `#7087F1`（实测） | `#4A5FC1`（5.68 ✅） | `$color-bg-page-alt`（实测 `#F2F5FA`） | — |

规则：**凡承载文字，一律用"文本安全变体"；基色只用于图标、底色、边框、图形**（D34）。

### 4.7 金色（荣誉/档案，党徽金）

| Token | 值 | 用途 |
|---|---|---|
| `$color-gold` | `#BB7600`（实测，金-500） | 荣誉标签字/描边 |
| `$color-gold-light` | `#CD9C5A`（实测） | 金色描边、星级 |
| `$color-gold-dark` | `#8F5700`（5.95 ✅） | 金色文字（暖底 3.39 ⚠️ → 暖底上用 `#8D5B00` 5.33 ✅） |
| `$color-gold-50` | `#F5EBDA`（色阶） | 金色卡片底 |

色阶（`gold-palette()`，同 mix 公式，基色 `#BB7600`）：
`50 #F5EBDA / 100 #F2E5CF / 200 #ECD9B8 / 300 #E6CCA1 / 400 #E0C08A / 500 #BB7600 / 600 #AA6B00 / 700 #996100 / 800 #895600 / 900 #784C00`

### 4.8 宫格强调色（服务入口图标，feat-010 / feat-007 用）

| Token | 值 | 原型出处 |
|---|---|---|
| `$color-accent-red` | `#F55A56` | 首页 / ai学习 / 党员服务 |
| `$color-accent-amber` | `#FFAF10` | 党员服务 |
| `$color-accent-purple` | `#D895F2` | 党员服务 |
| `$color-accent-blue` | `#7087F1` | 党员服务 |
| `$color-accent-coral` | `#F47451` | 首页 |
| `$color-accent-gold` | `#BB7600` | 电子档案 |

> 这 6 色只用于**宫格图标与分类标记**，不得用于文字（对比度 1.84–3.68，均 <4.5）。图标为图形，D34 不约束（"纯装饰元素"豁免），但**图标下方文字必须用 `$color-text-primary/secondary`**。

### 4.9 边框与分割

| Token | 值 | 场景 |
|---|---|---|
| `$color-border` | `#E5E5E5` | 卡片描边、列表项分隔 |
| `$color-border-light` | `#F0F0F0` | 弱分割（同一卡片内） |
| `$comp-hairline-width` | `1rpx` | 所有细线（D20） |

### 4.10 对比度校验总表（WCAG 2.1 AA，实测计算）

| 前景 | 背景 | 比值 | 判定 |
|---|---|---|---|
| `#FFFFFF` | `#C82028` | **5.69** | ✅ AA（正文可用） |
| `#C82028` | `#FFFFFF` | **5.69** | ✅ |
| `#C82028` | `#F5F5F5` | 5.22 | ✅ |
| `#333333` | `#FFFFFF` | 12.63 | ✅ |
| `#333333` | `#F5F5F5` | 11.59 | ✅ |
| `#333333` | `#F2F5FA` | 11.56 | ✅ |
| `#333333` | `#FDF4ED` | 11.63 | ✅ |
| `#666666` | `#FFFFFF` | 5.74 | ✅ |
| `#666666` | `#F5F5F5` | 5.27 | ✅ |
| `#808080` | `#FFFFFF` | 3.95 | ⚠️ 仅大字（受控例外） |
| `#ACACAC` | `#FFFFFF` | 2.27 | 豁免（禁用/占位） |
| `#2E7D32` | `#FFFFFF` | 5.13 | ✅ |
| `#A86400` | `#FFFFFF` | 4.68 | ✅ |
| `#8F5700` | `#FFFFFF` | 5.95 | ✅ |
| `#D32F2F` | `#FFFFFF` | 4.98 | ✅ |
| `#4A5FC1` | `#FFFFFF` | 5.68 | ✅ |
| `#BB7600` | `#FFFFFF` | 3.68 | ⚠️ 仅大字/图形 |
| `#BB7600` | `#FDF4ED` | 3.39 | ⚠️ 用 `#8D5B00` 替代（5.33 ✅） |
| `#FFFFFF` | `#F55A56` | 3.24 | ⚠️ 仅大字/图形 |
| `#FFFFFF` | `#FFAF10` | 1.84 | ❌ 禁止（白字不可用于琥珀底） |

### 4.11 色彩使用规则（正反例）

```scss
/* ✅ 正确：语义层 */
.badge--hot { background: $color-primary-soft; color: $color-primary; }
.tag--draft { color: $color-text-secondary; background: $color-bg-tertiary; }

/* ❌ 错误 1：写死色值（theme:check 拦截 + D01） */
.badge--hot { background: #ffeeee; color: #c82028; }

/* ❌ 错误 2：跨类借用 */
.card { background: $color-text-inverse; } // 应用 $color-bg-card

/* ❌ 错误 3：低对比文字 */
.tip { color: $color-warning; } // 1.84:1，应用 $color-warning-text
```

---

## 5. 排版系统

### 5.1 字号阶梯（修复 B1）

`theme.json.font.base` 由 `12rpx` 改为 **`4rpx`**，阶乘得到 style-skill 标准值：

| Token | 计算 | 值(≈px) | 场景 | 原型实测支撑 |
|---|---|---|---|---|
| `$font-xs` | base×5 | **20rpx** (10px) | 角标、极小说明 | 实测行高 17–20px |
| `$font-sm` | base×6 | **24rpx** (12px) | 标签、时间戳、`.text-caption` | 实测行高 20–24px（最集中） |
| `$font-md` | base×7 | **28rpx** (14px) | 正文、列表项、表单 | 与 24 相邻，skill 默认 |
| `$font-lg` | base×8 | **32rpx** (16px) | 区块标题、按钮 | 实测行高 29–32px |
| `$font-xl` | base×9 | **36rpx** (18px) | 页面主标题 | 实测行高 37–39px |
| `$font-xxl` | base×10 | **40rpx** (20px) | 大标题/营销数字 | 同上 |
| `$font-xxxl` | base×12 | **48rpx** (24px) | 数字、特殊场景 | skill 默认 |

**语义别名**：`$font-caption`(sm) `$font-body`(md) `$font-subtitle`(md) `$font-title`(lg) `$font-headline`(xl) `$font-display`(xxl)

**迁移影响（必须知悉）**：现有 `$font-*` 值 12/14/16/18/24/30rpx 全部变大；7 个组件与 4 个示例页文字会明显增大——这是**修缺陷**，不是回归。实施后需在开发者工具目视复核一次。

### 5.2 行高 / 字重 / 字体族

```scss
$line-height-tight: 1.2;    // 标题
$line-height-normal: 1.5;   // 正文
$line-height-relaxed: 1.8;  // 长文、说明

$font-weight-normal: 400;
$font-weight-medium: 500;
$font-weight-semibold: 600;
$font-weight-bold: 700;

$font-family-base: -apple-system, BlinkMacSystemFont, "PingFang SC",
                   "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
$font-family-number: "DIN Alternate", "Helvetica Neue", Arial, sans-serif;
```

> 小程序端 `font-weight: 500` 在部分安卓机型不生效 → 需要 500 视觉时用 600。

### 5.3 文本层级类（`_typography.scss`，D23）

| 类 | 字号 | 字重 | 行高 | 颜色 |
|---|---|---|---|---|
| `.text-h1` | `$font-xxl` | 700 | tight | `$color-text-primary` |
| `.text-h2` | `$font-xl` | 600 | tight | `$color-text-primary` |
| `.text-h3` | `$font-lg` | 600 | normal | `$color-text-primary` |
| `.text-h4` | `$font-md` | 500 | normal | `$color-text-primary` |
| `.text-body` | `$font-md` | 400 | relaxed | `$color-text-secondary` |
| `.text-caption` | `$font-sm`(24rpx) | 400 | normal | `$color-text-tertiary`（大字豁免口径） |
| `.text-price` | `$font-xl` | 700 | tight | `$color-error-text` |

规则：**禁止裸写 `font-size`/`font-weight`**（D06/D23），一律用上表或 `$font-*` Token。

---

## 6. 间距与尺寸系统

### 6.1 间距阶梯（修复 B3）

`theme.json.spacing.base = 4rpx`，阶乘取标准 4 的倍数：

| Token | 值 | 旧值 | 说明 |
|---|---|---|---|
| `$space-0` | 0 | 0 | — |
| `$space-1` | 4rpx | 4 | — |
| `$space-2` | 8rpx | 8 | — |
| `$space-3` | 12rpx | 12 | — |
| `$space-4` | 16rpx | 16 | — |
| `$space-5` | 20rpx | **24** | 修复（旧值与语义不符） |
| `$space-6` | 24rpx | **32** | 修复 |
| `$space-8` | 32rpx | **48** | 修复 |
| `$space-10` | 40rpx | — | 新增 |
| `$space-12` | 48rpx | — | 新增 |
| `$space-16` | 64rpx | — | 新增 |

**语义别名（重排）**：`$spacing-xs`(4) `$spacing-sm`(8) `$spacing-md`(12) `$spacing-lg`(16) `$spacing-xl`(20) `$spacing-2xl`(24) `$spacing-3xl`(32) `$spacing-4xl`(48)

**零视觉变更迁移**：页面只用 `$comp-*`，语义别名只在 `_components.scss` 内被引用 → 迁移时按"旧值等价"改写即可（表 6.3），**页面与组件视觉不变**。

| 旧引用（旧值） | 新引用（同值） |
|---|---|
| `$spacing-lg`(24) | `$spacing-2xl`(24) |
| `$spacing-xl`(32) | `$spacing-3xl`(32) |
| `$spacing-xxl`(48) | `$spacing-4xl`(48) |
| `$spacing-md`(16) | `$spacing-lg`(16) |
| `$spacing-default`(12) | `$spacing-md`(12) |

### 6.2 Page Gutter 与模块间距（修复 B9）

```scss
$page-gutter: $space-6;        // 24rpx —— 原型实测 24~25px（6 张图一致）
$section-padding: $space-6;    // 24rpx —— 模块内边距，全局唯一
$section-margin: $space-4;     // 16rpx —— 模块间距，全局唯一
```

实测证据：

| 原型图 | 卡片左边缘 x | 结论 |
|---|---|---|
| ai学习 | 24（143 次） | 24rpx |
| 个人中心 | 25（170 次） | 24rpx |
| 党员服务 | 24（221 次） | 24rpx |
| 电子档案 | 25（136 次） | 24rpx |
| 首页 | 24（84 次） | 24rpx |

> style-skill 默认 32rpx；本项目以**原型实测 24rpx** 为准（ADR-004），并同步把 `$comp-page-padding` 由 16rpx 改为 `$page-gutter`。

### 6.3 尺寸实测（rpx，750 稿 1:1）

| 对象 | 实测 | 采用 Token |
|---|---|---|
| 头部红区总高（个人中心，含状态栏+导航+用户区） | 0–264px | 分解：状态栏 48 + 导航 88 + 用户区 128 |
| 导航栏高度 | — | `$comp-navbar-height: 88rpx`（保留） |
| 底部 tabBar 内容区（距底 17–73px + 底部安全 17px） | ≈ 90–100px | `$comp-tab-bar-height: 100rpx`（保留） |
| 卡片圆角（左上像素剖面拟合） | 10–15px（IMG2≈15、IMG5≈9、IMG6≈11） | `$radius-md: 12rpx` |
| 正文行高（暗像素连续段） | 20–24px | `$font-sm/md` + `$line-height-normal` |
| 标题行高 | 29–32px / 37–39px | `$font-lg` / `$font-xl` |

### 6.4 最小点击区（D24）

所有可点元素 ≥ **88rpx × 88rpx**（44pt）。图标类用 `padding` 或透明 `::after` 扩区，不得改小。

---

## 7. 圆角 / 阴影 / 层级 / 动效

### 7.1 圆角（修复 B2，保留实测 12rpx）

`theme.json.radius.base = 4rpx` 保留，阶乘重排：

| Token | 值 | 场景 |
|---|---|---|
| `$radius-none` | 0 | 通栏元素 |
| `$radius-xs` | 4rpx | 内部小元素、进度条 |
| `$radius-sm` | 8rpx | 标签、小按钮、输入框 |
| `$radius-md` | **12rpx** | **卡片、宫格图标底、图片**（原型实测） |
| `$radius-lg` | 16rpx | 大卡片、底部弹窗顶部 |
| `$radius-xl` | 24rpx | 居中弹窗 |
| `$radius-full` | 9999rpx | 胶囊按钮、圆形头像 |

规则：**禁止任何元素使用上表之外的圆角**（D18）。

### 7.2 阴影

```scss
$shadow-none: none;
$shadow-1: 0 2rpx 8rpx  rgba-with-alpha($gray-900, 0.04);  // 卡片静态
$shadow-2: 0 4rpx 12rpx rgba-with-alpha($gray-900, 0.08);  // 悬浮/吸顶
$shadow-3: 0 8rpx 24rpx rgba-with-alpha($gray-900, 0.12);  // 弹窗
```

### 7.3 Z 层级（修复 B4，D09）

| Token | 值 | 场景 |
|---|---|---|
| `$z-base` | 0 | 内容 |
| `$z-dropdown` | 100 | 下拉 |
| `$z-sticky` | 200 | 吸顶 header / tab |
| `$z-overlay` | 300 | 遮罩 |
| `$z-modal` | 400 | 弹窗 |
| `$z-toast` | 500 | Toast |
| `$z-tooltip` | 600 | 气泡 |
| `$z-max` | 999 | 全屏 loading |

### 7.4 动效 Token 与预设类（修复 B5）

```scss
$duration-fast: 150ms;   // hover / active
$duration-normal: 250ms; // 展开收起
$duration-slow: 400ms;   // 弹窗出入
$ease-in: cubic-bezier(0.4, 0, 1, 1);
$ease-out: cubic-bezier(0, 0, 0.2, 1);
$ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
$ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
```

预设类（只做 `transform`/`opacity`，D08）：`.animate-fade-in` `.animate-fade-out` `.animate-slide-up` `.animate-slide-down` `.animate-scale-in` `.animate-shimmer` `.animate-spin`

规则：**项目内禁止新定义 `@keyframes`**（Popup 组件级除外）；交互动画用 `v-if` 重新挂载触发。

---

## 8. 组件样式基座

### 8.1 现有 7 个组件的 Token 使用现状

| 组件 | 已用 Token | 缺口 |
|---|---|---|
| `AppButton` | `$comp-button-height-{sm,md,lg}`、`$comp-button-padding-x-*`、`$comp-button-radius`、`$comp-hairline-width`、`$font-body` | 无 `loading` 态 Token；按压态写死 `opacity` |
| `AppCard` | `$comp-card-padding` `$comp-card-radius` | 无描边/阴影/头部/底部 Token |
| `AppInput` | `$comp-button-height-md`（复用按钮高度，语义越界）、`$comp-list-item-padding-x`、`$comp-hairline-width` | 缺 `$comp-input-*` 专属 |
| `AppNavbar` | `$comp-navbar-height`、`$comp-navbar-title-height`（TS 侧硬编码 88） | B12 |
| `AppTab` | `$comp-tab-height` `$comp-tab-item-padding-x` `$comp-tab-indicator-{width,height}` | 缺选中色 Token（现写 `$color-primary`） |
| `AppPopup` | `$comp-popup-{radius,padding,width-center,sheet-max-height,mask-bg}` | 缺 header/footer/动画时长 |
| `AppEmpty` | `$comp-empty-image-size` | 缺文案间距/字号 |

### 8.2 命名规范与 skill 映射表

**决策**：保留项目既有 **`$comp-{component}-{property}-{variant}`** 前缀作为唯一组件级命名空间（ADR-005）。理由：7 个组件已在用、重命名为 skill 的 `$btn-height-normal` 之类属无收益 churn；D33 约束的是"禁止硬编码"，不约束命名。给出映射表以便 skill 审计对照：

| style-skill 规范名 | 本项目 Token |
|---|---|
| `$btn-height-normal` | `$comp-button-height-md` |
| `$btn-radius-normal` | `$comp-button-radius` |
| `$card-padding` / `$card-radius` | `$comp-card-padding` / `$comp-card-radius` |
| `$input-height` / `$input-padding` | `$comp-input-height` / `$comp-input-padding-x` |
| `$navbar-back-hit-area` | `$comp-navbar-btn-hit` |
| `$popup-content-padding` | `$comp-popup-padding` |
| `$list-item-min-height` | `$comp-list-item-min-height` |
| `$avatar-size-md` | `$comp-avatar-size-md` |
| `$empty-icon-size` | `$comp-empty-image-size` |
| `$btn-fixed-height` | `$comp-btn-fixed-height` |
| `$modal-radius` / `$modal-width-ratio` | `$comp-popup-radius` / `$comp-popup-width-center` |
| `$skeleton-row-height` / `-gap` | `$comp-skeleton-row-height` / `$comp-skeleton-row-gap` |
| `$tag-padding` / `$badge-dot-size` | `$comp-tag-padding` / `$comp-badge-dot-size` |
| `$control-size` / `$control-hit-min` | `$comp-control-size` / `$comp-control-hit-min` |
| `$divider-color` / `$divider-height` | `$color-border-light` / `$comp-hairline-width` |

### 8.3 需补齐的组件级 Token（本次新增）

```scss
/* ---- 卡片 ---- */
$comp-card-gap: $spacing-lg;              // 16rpx，卡片之间
$comp-card-border-width: $comp-hairline-width;
$comp-card-shadow: $shadow-1;
$comp-card-header-padding: $spacing-2xl $spacing-2xl 0;
$comp-card-footer-padding: 0 $spacing-2xl $spacing-2xl;

/* ---- 输入框（解除对按钮高度的借用）---- */
$comp-input-height: 88rpx;
$comp-input-padding-x: $spacing-md;
$comp-input-font-size: $font-body;
$comp-input-radius: $radius-sm;
$comp-input-placeholder-color: $color-text-placeholder;
$comp-input-icon-size: 40rpx;
$comp-input-clear-size: 36rpx;

/* ---- 列表项 ---- */
$comp-list-item-padding-y: $spacing-xl;   // 20rpx
$comp-list-item-icon-size: 48rpx;
$comp-list-item-icon-gap: $spacing-md;
$comp-list-item-arrow-size: 32rpx;
$comp-list-item-title-size: $font-body;
$comp-list-item-desc-size: $font-caption;

/* ---- 标签 / 徽标 ---- */
$comp-tag-padding: 4rpx $spacing-sm;
$comp-tag-font-size: $font-xs;
$comp-tag-radius: $radius-sm;
$comp-badge-dot-size: 16rpx;
$comp-badge-number-min-width: 32rpx;

/* ---- 宫格 ---- */
$comp-grid-columns: 4;
$comp-grid-gap: $spacing-2xl;
$comp-grid-icon-size: 88rpx;
$comp-grid-icon-radius: $radius-md;
$comp-grid-label-size: $font-caption;
$comp-grid-label-gap: $spacing-sm;

/* ---- 分割线 ---- */
$comp-divider-height: $comp-hairline-width;
$comp-divider-margin: $section-margin 0;

/* ---- 底部固定按钮 ---- */
$comp-btn-fixed-height: 96rpx;
$comp-btn-fixed-offset: $spacing-3xl;
$comp-btn-fixed-radius: $radius-full;
$comp-btn-fixed-font-size: $font-title;

/* ---- 骨架屏 / 加载 ---- */
$comp-skeleton-row-height: 32rpx;
$comp-skeleton-row-gap: $spacing-lg;
$comp-skeleton-row-radius: $radius-xs;
$comp-skeleton-padding: $spacing-2xl;
$comp-loading-spinner-size: 64rpx;
$comp-loading-spinner-border: 4rpx;
$comp-loading-content-padding: $spacing-3xl $spacing-xl;

/* ---- 表单控件 ---- */
$comp-control-size: 40rpx;
$comp-control-hit-min: 88rpx;
$comp-control-gap: $spacing-lg;

/* ---- 头像 ---- */
$comp-avatar-radius: $radius-full;
$comp-avatar-border-width: $comp-hairline-width;
$comp-avatar-border-color: $color-border-light;
$comp-avatar-bg: $color-bg-tertiary;

/* ---- 空态 ---- */
$comp-empty-text-margin-top: $spacing-2xl;
$comp-empty-text-size: $font-body;

/* ---- 导航 ---- */
$comp-navbar-btn-size: 48rpx;
$comp-navbar-btn-hit: 64rpx;
$comp-navbar-title-size: $font-title;
$comp-navbar-bg: $color-primary;
$comp-navbar-title-color: $color-text-inverse;

/* ---- Tab ---- */
$comp-tab-font-size: $font-body;
$comp-tab-active-color: $color-primary;
$comp-tab-inactive-color: $color-text-secondary;
$comp-tab-indicator-color: $color-primary;
```

### 8.4 组件视觉规范要点（摘要）

| 组件 | 关键规范 |
|---|---|
| Button | 高 64/88/104rpx（sm/md/lg）→ 现 56/80/104，本次不改（保持既有视觉）；胶囊 `$radius-full` 用于底部固定按钮，`$radius-sm` 用于小按钮；按压 `$primary-600`；禁用 `opacity .5` 走 Token |
| Card | padding 24rpx、radius 12rpx、`$shadow-1`；通栏卡片负 margin 破 `$page-gutter` |
| Input | 高 88rpx（不再借用按钮高度）、radius 8rpx、placeholder `$color-text-placeholder` |
| NavBar | 高 88rpx、底 `$color-primary`、字 `$color-text-inverse`（5.69 ✅）；**TS 常量改为从 SCSS 注释同步 + 单测兜底**（B12） |
| Tab | 高 88rpx、指示条 40×4rpx、选中 `$color-primary` |
| Popup | 圆角 24rpx（居中）/ 顶部 24rpx（底部 sheet）、遮罩 `rgba(#333,.6)`、**必须有滑入滑出动画**（D13） |
| Empty | 图 240rpx、文案 `$font-body` + `$color-text-tertiary`、上间距 24rpx（D32） |
| ListItem | 最小高 96rpx、左右 12rpx（现）→ 统一为 `$comp-list-item-padding-x`；分隔用 `$color-border-light` |
| Grid | 4 列、间距 24rpx、图标 88rpx 圆角 12rpx、文字 24rpx |
| Divider | 复用 `.divider` 公共类（D20） |
| Skeleton | 行高 32rpx、间距 16rpx、`.animate-shimmer` |
| Avatar | 80/120/160rpx、圆形、占位底 `$color-bg-tertiary` |
| Checkbox/Radio/Switch | 控件 40rpx、点击区 ≥88rpx、激活色 `$color-primary` |
| Badge/Tag | 复用 `.badge` / `.tag-*`（D21） |

---

## 9. 全局样式基座

### 9.1 文件矩阵与新增文件

| 文件 | 状态 | 内容 |
|---|---|---|
| `styles/config/_theme-config.scss` | 生成（改造） | 见 10.2 |
| `styles/tokens/_primitive.scss` | 改造 | 色阶（primary/gray/gold）+ 间距/字号/圆角/阴影/层级/动效 |
| `styles/tokens/_semantic.scss` | 改造 | 颜色/文字/背景/边框/功能色/金色/强调色/间距别名 |
| `styles/tokens/_components.scss` | 改造 | 8.3 全量 `$comp-*` |
| `styles/_functions.scss` | 改造 | 增加 `gold-palette()`；保留 `rgba-with-alpha()` |
| `styles/_mixins.scss` | 改造 | 增加 `flex-between` / `flex-col-center` / `card-container` / `hairline()` |
| `styles/_typography.scss` | **新增** | `.text-h1~h4` `.text-body` `.text-caption` `.text-price`（D23） |
| `styles/_utilities.scss` | **新增** | flex / gap / 文本 / 颜色 / 字号 / 字重 / 背景 / 圆角 / 阴影 / padding / margin（D30） |
| `styles/_layout.scss` | **新增** | `.lyt-page` `.lyt-header` `.lyt-hero` `.lyt-body` `.lyt-section` `.lyt-cell` `.lyt-footer` `.lyt-col2/3` `.lyt-sticky-top` |
| `styles/_page.scss` | **新增** | `.page-container` `.page-section[-first|-last]` `.page-fullwidth` `.section` `.section-plain` `.divider` |
| `styles/_animations.scss` | **新增** | 7 个预设类 + `@keyframes`（唯一允许定义处） |
| `styles/global.scss` | 改造 | 引入上述全部 + 保留 `.page` `.safe-area-*` |
| `styles/variables.scss` | 改造 | 出口追加 5 个新文件 |
| `App.vue` | 改造 | `@import '@/styles/global.scss'`（保持不变即可，global 内聚） |

### 9.2 引入链路

```
vite.config.ts  additionalData: '@import "@/styles/variables.scss";'
        └─> variables.scss ──> tokens/semantic ──> tokens/primitive ──> config/theme-config
                          ├──> tokens/components
                          ├──> _functions / _mixins
                          └──> _typography / _utilities / _layout / _page / _animations
App.vue ──> @import '@/styles/global.scss'（生成一次全局类，供非 scss 场景使用）
```

> 注意：`additionalData` 用的是 `@import` 而非 skill 建议的 `@use ... as *`。`sass` 1.72 下 `@import` 仍可用但会打印弃用警告；**本次不切换**（切换会要求所有文件改用 `@use` 且 `@import` 与 `@use` 不能混用，风险高），列入遗留问题 L3。

### 9.3 全局类清单（必须提供）

- **文本层级**：`.text-h1`~`.text-h4` `.text-body` `.text-caption` `.text-price`
- **工具类**：`.flex` `.flex-col` `.flex-center` `.flex-between` `.flex-1` `.gap-{1,2,3,4,6,8}` `.text-{left,center,right}` `.text-ellipsis{-2,-3}` `.text-{primary,secondary,tertiary,disabled,inverse}` `.font-{normal,medium,semibold,bold}` `.bg-{white,gray,mask}` `.rounded-*` `.shadow-*` `.p-{3,4,6}` `.px-*` `.py-*` `.mt/mb/ml/mr-*`
- **布局**：`.lyt-*` 10 个 zone + `.page-container` `.page-section*` `.page-fullwidth` `.section` `.section-plain`
- **分割**：`.divider`（D20）
- **徽标**：`.badge` `.tag-*` （D21）
- **按钮**：`.btn-fixed-bottom` `.btn-fixed-bottom-double`（D19）
- **动画**：`.animate-*`（7 个）

---

## 10. theme.json 与工具链改造

### 10.1 现状

```
theme.json
  ├─ colors: primary / success / warning / error / info / grayBase
  ├─ spacing.base: 4rpx
  ├─ font.base: 12rpx      ← 缺陷 B1
  └─ radius.base: 4rpx
        │
        │  node scripts/sync-theme.js
        ▼
  src/styles/config/_theme-config.scss   （8 个 $theme-* 变量）
  src/constants/colors.ts                （PRIMARY_* / GRAY_* / 语义常量 / COLORS）
  scripts/.theme-scale.json              （色阶白名单）
        │
        │  node scripts/check-colors.js
        ▼
  扫描 src/**(vue|scss|ts)，豁免 src/styles/** 与 src/constants/colors.ts
  违规 → exit 1
```

### 10.2 theme.json 目标 Schema

```json
{
  "colors": {
    "primary": "#c82028",
    "gold": "#bb7600",
    "success": "#4caf50",
    "warning": "#ffaf10",
    "error": "#f55a56",
    "info": "#7087f1",
    "neutral": {
      "50": "#f5f5f5", "100": "#f0f0f0", "200": "#e5e5e5", "300": "#d4d4d4",
      "400": "#acacac", "500": "#808080", "600": "#666666", "700": "#4d4d4d",
      "800": "#3d3d3d", "900": "#333333"
    },
    "textSafe": {
      "success": "#2e7d32", "warning": "#a86400", "error": "#d32f2f", "info": "#4a5fc1"
    },
    "accent": {
      "red": "#f55a56", "amber": "#ffaf10", "purple": "#d895f2",
      "blue": "#7087f1", "coral": "#f47451", "gold": "#bb7600"
    },
    "soft": {
      "primary": "#ffeeee",
      "warm": "#fdf4ed",
      "page": "#f5f5f5",
      "pageAlt": "#f2f5fa",
      "success": "#d8f0d0"
    }
  },
  "spacing": { "base": "4rpx" },
  "font": { "base": "4rpx" },
  "radius": { "base": "4rpx" }
}
```

> `grayBase` 字段**废弃**（由 `neutral` 取代）；`sync-theme.js` 需兼容读取：有 `neutral` 用 `neutral`，否则回退 `grayBase` 生成（避免一次性断裂）。

### 10.3 sync-theme.js 改造点

| # | 改动 | 说明 |
|---|---|---|
| S1 | 读 `colors.neutral`（回退 `grayBase`） | 显式 10 阶 → `$gray-50..900` + `GRAY_*` + 白名单 |
| S2 | 新增 `colors.gold` → `gold-palette()` 与 `GOLD_*` | 供金色 Token |
| S3 | 新增 `colors.textSafe.*` / `colors.accent.*` / `colors.soft.*` | 写入 `_theme-config.scss`（`$theme-*` 前缀）+ `colors.ts`（`COLOR_*`）+ 白名单 |
| S4 | `font.base` 12rpx → 4rpx | 阶梯随 `_primitive.scss` 的乘数变化 |
| S5 | 生成物头部注释保留"自动生成，禁止手改" | 现有已满足 |
| S6 | 生成后**自检**：白名单必须包含 `neutral + 功能色 + accent + soft + primary 色阶`，缺一即 exit 1 | 防漏 |

产物保持三份不变：`src/styles/config/_theme-config.scss`、`src/constants/colors.ts`、`scripts/.theme-scale.json`。

### 10.4 check-colors.js 门禁规则（保持不变 + 两点增强）

- 保持：扫描 `src/**.{vue,scss,ts}`，豁免 `src/styles/**`、`src/constants/colors.ts`；`#fff/#000` 归一；`rgba(...,0)` 允许；其余 `rgb()/hsl()` 一律要求改 Token；违规 exit 1。
- 增强 1（P1）：新增**例外清单文件** `scripts/color-allowlist.json`（已支持但文件不存在），把 `.text-caption` 三级文字等受控例外显式登记并写注释。
- 增强 2（P2，可选）：新增**非颜色硬编码扫描**（字号 `font-size:\s*\d+rpx`、圆角 `border-radius:\s*\d+rpx`、间距 `padding/margin:\s*\d+rpx`、层级 `z-index:\s*\d+`），先以 warning 输出，D06/D09/D18 稳定后再改 exit 1（避免一次性阻断）。

### 10.5 生成物与手写文件边界

| 文件 | 生成/手写 | 说明 |
|---|---|---|
| `config/_theme-config.scss` | **生成** | 唯一人工入口是 `theme.json` |
| `constants/colors.ts` | **生成** | JS 侧取色唯一来源 |
| `scripts/.theme-scale.json` | **生成** | 白名单 |
| `tokens/_primitive.scss` | 手写（引用生成变量） | 阶梯乘数与派生 |
| `tokens/_semantic.scss` | 手写 | 语义映射 |
| `tokens/_components.scss` | 手写 | 组件级 Token |
| `_functions/_mixins/_typography/_utilities/_layout/_page/_animations/global` | 手写 | 基座 |

---

## 11. 分步实施计划

| Step | 内容 | 产出 | 验收 |
|---|---|---|---|
| **0** | 备份：`theme.json`、`_primitive.scss`、`_semantic.scss`、`_components.scss` → `*.bak` | 4 个 .bak | 可回滚 |
| **1** | 改 `theme.json`（10.2 全量字段） | theme.json | `node -e "JSON.parse(...)"` 通过 |
| **2** | 改 `scripts/sync-theme.js`（S1–S6） | 脚本 | `npm run theme:sync` 成功，三份产物更新 |
| **3** | 改 `_functions.scss`（加 `gold-palette`）、`_primitive.scss`（间距/字号/圆角/层级/动效 + gold 阶） | 2 文件 | 编译无错 |
| **4** | 改 `_semantic.scss`（4.4–4.9 全部语义色 + 间距别名重排） | 1 文件 | 变量齐全 |
| **5** | 改 `_components.scss`（8.3 全量，按 6.3 迁移表保视觉） | 1 文件 | `$comp-*` 无缺失 |
| **6** | 新增 `_typography/_utilities/_layout/_page/_animations` + 改 `global.scss` / `variables.scss` | 6 文件 | 全局类可用 |
| **7** | 改 `pages.json` tabBar：`selectedColor #C82028`、`color #ACACAC`；`globalStyle.backgroundColor #F5F5F5` | pages.json | 与实测一致 |
| **8** | 组件/页面适配：`AppInput` 改用 `$comp-input-*`；`AppNavbar` TS 常量加同步注释；7 组件 + 4 页 grep 裸值归零 | 组件 | `theme:check` + 目视 |
| **9** | 全量验证（第 12 章） | 证据 | 全绿 |

**回滚**：`mv *.bak` 还原 + `git checkout -- src/pages.json`。

---

## 12. 验证方案

### 12.1 必跑命令（在 `cdp-party-building-uniapp/` 下）

```bash
npm run theme:sync      # 期望：生成 3 份产物，无报错
npm run theme:check     # 期望：[check-colors] OK：扫描 N 个文件，颜色均在色阶白名单内。
npm run type-check      # 期望：0 error
npm run lint            # 期望：0 error 0 warning
npm run build:mp-weixin # 期望：DONE Build complete.
./init.ps1              # 仓库根：全绿
```

### 12.2 产物自检（不变式 7）

`dist/build/mp-weixin` 中每个页面 JSON 的 `usingComponents` 必须覆盖其 WXML 使用的全部自定义组件标签（缺一会导致开发者工具 `The "path" argument must be of type string`）。

### 12.3 Token 自检脚本（一次性，验证后删除或保留为 `scripts/verify-tokens.js`）

- 断言 `$color-primary == #C82028`
- 断言 `theme.json.colors.primary` 与 `constants/colors.ts` 的 `PRIMARY_500` 与 `_theme-config.scss` 的 `$theme-primary` 三处一致
- 断言 `pages.json.tabBar.selectedColor` == `colors.primary`
- 断言 `$page-gutter == 24rpx`
- 断言 10 个中性阶与 `theme.json.neutral` 一致

### 12.4 目视回归清单（开发者工具）

| 页面 | 检查项 |
|---|---|
| 首页 / 列表 / 表单 / 我的 | 字号可读（≥20rpx）、卡片圆角 12rpx、页边距 24rpx、主色为 `#C82028`、tabBar 选中红 |
| AppButton | 三档高度、主/次/描边三态、禁用 |
| AppPopup | 有滑入滑出动画、遮罩、圆角 |
| AppEmpty | 空列表渲染（D32） |

---

## 13. 风险与遗留问题

| # | 风险/遗留 | 影响 | 处置 |
|---|---|---|---|
| L1 | 原型为 JPEG，色值有 ±8 抖动 | 色板为簇心取值 | 已在 3.3 说明；PNG 图（ai学习）作交叉验证 |
| L2 | `#808080` 三级文字不满足 AA 4.5:1 | D34 冲突 | 受控例外 + 仅大字（4.4） |
| L3 | `additionalData` 用 `@import`（sass 弃用警告） | 构建噪音，未来版本可能失效 | 本次不切换，列入技术债 |
| L4 | 字号修复后 7 组件 + 4 页视觉放大 | 需重新目视 | Step 9 目视清单 |
| L5 | 两种页面底色（`#F5F5F5` / `#F2F5FA`） | 页面间轻微不一致 | 文档规定"一页一底"，不混用 |
| L6 | 原型未覆盖组件态（hover/disabled/loading） | 需设计补全 | 按 skill 规范 + 主色阶派生，待产品确认 |
| L7 | 卡片圆角实测 9–15px 离散 | 取 12rpx | 待 feat-007 复刻时按首页再校一次 |
| L8 | 深色模式未做 | 无深色稿 | 不实现；若后续需要，走 `_semantic.scss` + `prefers-color-scheme` |
| L9 | `AppNavbar` TS 侧 88rpx 硬编码 | 双份真相 | Step 8 加同步注释 + 注释标明"改此值须同步 `$comp-navbar-title-height`" |

---

## 14. 决策记录（ADR）

| ID | 决策 | 理由 | 备选（否决） |
|---|---|---|---|
| ADR-001 | 主色取 `#C82028`（非现网 `#C62828`） | 6 图头部红簇心 (200,32,38)，AGENTS 不变式 5"原型即验收标准" | 沿用 `#C62828`（G 偏 +8，与原型不符） |
| ADR-002 | 中性色阶改**显式 10 阶**，废弃 `grayBase` 生成 | 生成式得 `#C4C4C4/#525252`，与实测 `#ACACAC/#333333` 不符 | 调 `grayBase` 拟合（无法同时命中 4 个锚点） |
| ADR-003 | **不引入**运行时 CSS 变量换肤 | 单品牌无需求；`pages.json`/tabBar 不支持 CSS 变量；YAGNI | theme-skill 的 `data-theme` 方案 |
| ADR-004 | Page Gutter = **24rpx**（非 skill 默认 32rpx） | 6 图卡片左边缘实测 24–25px，一致性极高 | 用 32rpx（与原型不符） |
| ADR-005 | 组件 Token 保留 `$comp-*` 前缀 | 7 组件在用；D33 约束硬编码不约束命名 | 全量重命名为 skill 名（无收益 churn） |
| ADR-006 | 功能色双轨：基色（原型）+ 文本安全变体（D34） | 原型基色对比度 1.84–3.27 全不达标 | 直接改基色为安全色（丢失原型视觉） |
| ADR-007 | 色阶生成沿用现有 `mix` 公式（非 theme-skill 的 HSL） | 工程 JS/SCSS/校验三方已同源；换算法会使白名单与历史证据失效 | 切 HSL（收益不足以抵消断裂） |
| ADR-008 | 保留 `#808080` 三级文字（受控例外） | 原型事实 + 视觉层级需要 | 强制改 `#666666`（与次级同色，层级消失） |

---

## 附录 A：取色脚本（可复现）

> 环境：Windows PowerShell 5.1 + .NET `System.Drawing`，无需安装依赖。在仓库根执行。

**A1 分区精确直方图（HEADER/BODY-TOP/BODY-MID/FOOTER）**

```powershell
Add-Type -AssemblyName System.Drawing
Get-ChildItem prototype -File | ForEach-Object {
  $img=[System.Drawing.Bitmap]::FromFile($_.FullName); $w=$img.Width; $h=$img.Height
  foreach($bd in @(@(0,0.10,'HEADER'),@(0.10,0.30,'BODY-TOP'),@(0.45,0.70,'BODY-MID'),@(0.92,1.0,'FOOTER'))){
    $y0=[int]($h*[double]$bd[0]); $y1=[int]($h*[double]$bd[1]); $hist=@{}
    for($y=$y0;$y -lt $y1;$y+=2){ for($x=0;$x -lt $w;$x+=2){
      $p=$img.GetPixel($x,$y); $k='{0:X2}{1:X2}{2:X2}' -f $p.R,$p.G,$p.B
      if($hist.ContainsKey($k)){$hist[$k]=[int]$hist[$k]+1}else{$hist[$k]=1} } }
    Write-Output ('  [' + $bd[2] + ']')
    $hist.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 6 |
      ForEach-Object { Write-Output ('    #' + $_.Key + '  x' + $_.Value) }
  }
  $img.Dispose()
}
```

**A2 头部红均值与渐变检测**

```powershell
# 筛选条件：R>120 且 G<110 且 B<110 且 (R-G)>55；分上下半段比较得到渐变
```

**A3 页边距 / 圆角 / 文字行高**

```powershell
# 页边距：在 y∈[0.35h,0.80h] 内逐行找"页面底色 → 纯白"的 x，取众数
# 圆角  ：找卡片顶行 y0，扫描 y0..y0+24 行的最左侧白像素 x(k)，用 x0 + r - sqrt(r^2-(r-k)^2) 拟合 r
# 行高  ：统计暗像素（R/G/B<130）连续段的高度分布
```

**A4 色阶与对比度计算（Node，与 `sync-theme.js` 同公式）**

```js
const mix=(a,b,w)=>({r:a.r*w+b.r*(1-w),g:a.g*w+b.g*(1-w),b:a.b*w+b.b*(1-w)});
// level<500 混白 w=(1000-level)/1000*0.9；level>500 混黑 w=(level-500)/1000*0.9
// 对比度：WCAG 相对亮度 L=0.2126R+0.7152G+0.0722B（线性化后），比值=(Lmax+0.05)/(Lmin+0.05)
```

## 附录 B：色值速查表

```
主色   #C82028  ▉  主色深 #A41A21 ▉  主色浅 #F5D5D6 ▉  主色底 #FFEEEE ▉
文字   #333333 ▉ #666666 ▉ #808080 ▉ #ACACAC ▉ #FFFFFF ▉
背景   #FFFFFF ▉ #F5F5F5 ▉ #F2F5FA ▉ #F0F0F0 ▉ #FDF4ED ▉
边框   #E5E5E5 ▉ #F0F0F0 ▉
功能   #4CAF50 ▉ #FFAF10 ▉ #F55A56 ▉ #7087F1 ▉
       #2E7D32 ▉ #A86400 ▉ #D32F2F ▉ #4A5FC1 ▉ (文本安全变体)
金     #BB7600 ▉ #CD9C5A ▉ #F5EBDA ▉
强调   #F55A56 ▉ #FFAF10 ▉ #D895F2 ▉ #7087F1 ▉ #F47451 ▉ #BB7600 ▉
```

## 附录 C：D01–D34 红线对照（本功能相关）

| 编号 | 要求 | 本文落点 |
|---|---|---|
| D01 | SCSS 必须用 Token | 4.1 三层模型、10.4 门禁 |
| D02 | 组件样式 scoped | 8.4（组件改造时保持） |
| D06 | 字号禁止硬编码 | 5.1、10.4 增强 2 |
| D08 | 动画限 transform/opacity | 7.4 |
| D09 | z-index 用 Token | 7.3 |
| D11 | 全页滚动禁 scroll-view | 9.1 `.lyt-body` |
| D13 | Popup 必须有动画 | 8.4 |
| D14 | 页面外边距统一 | 6.2 `$page-gutter` |
| D17 | 模块间距一致 | 6.2 `$section-padding/margin` |
| D18 | 圆角统一 | 7.1 |
| D19 | 底部按钮走公共样式 | 9.3 `.btn-fixed-bottom` |
| D20 | 分割线统一 | 9.3 `.divider` |
| D21 | 徽标标签统一 | 9.3 `.badge/.tag-*` |
| D22 | 列表项统一 | 8.3 `$comp-list-item-*` |
| D23 | 文本层级统一 | 5.3 |
| D24 | 点击区 ≥44pt | 6.4 |
| D25 | 头像统一 | 8.3 `$comp-avatar-*` |
| D26 | 表单控件统一 | 8.3 `$comp-control-*` |
| D27 | 宫格统一 | 8.3 `$comp-grid-*` |
| D29 | 禁第三方 UI 库 | 1.2 |
| D30 | Utility 类统一 | 9.3 |
| D31 | 文字色从基色派生 | 4.3/4.4（显式锚点 + 派生） |
| D32 | 空列表用 Empty | 8.4 |
| D33 | 组件尺寸用组件级 Token | 8.2/8.3 |
| D34 | 对比度 ≥4.5:1 | 4.10 + 4.4 受控例外 |

## 附录 D：术语

| 术语 | 含义 |
|---|---|
| Token | 设计令牌，本文指 SCSS 变量（`$primary-500` / `$color-primary` / `$comp-card-padding`） |
| 色阶（Scale） | 由基色生成的 50–900 明度序列 |
| 语义层 | 面向用途的命名（`$color-text-primary`），业务唯一引用入口 |
| 组件层 | 面向组件内部的尺寸命名（`$comp-button-height-md`） |
| Page Gutter | 页面左右外边距，本项目 24rpx |
| 受控例外 | 与规范冲突但由原型/平台强制、并在文档与工具中显式登记的偏差 |
| 文本安全变体 | 为满足 D34 而从原型基色派生出的深色版本（如 `#A86400`） |
