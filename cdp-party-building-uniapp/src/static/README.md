# 静态资源目录

本目录存放小程序静态资源。**命名规则**：全小写、kebab-case、无空格、无括号（AGENTS.md 不变式 6）。

## 目录结构

| 目录 | 内容 |
|---|---|
| `icons/` | 页面内小图标（线性/面性 PNG，透明底，≤ 20KB） |
| `tab-bar/` | 底部 tabBar 图标（含激活/未激活态） |
| `images/` | Banner、内容封面、卡片底图、头像、空状态图 |

## 资源与原型图位置对照表

> 位置列格式：`原型图 @ y≈纵向像素`（750px 稿 = 750rpx，像素值可直接当 rpx）。
> 标注「接口缺失/暂不实现」的资源为预留资产，feat 解锁前不得在页面引用。

### 1. tabBar 图标（`tab-bar/`）

| 文件 | 原型位置 | 说明 |
|---|---|---|
| `tab-home.png` / `tab-home-active.png` | 底部 tabBar 第 1 项 | 首页（灰=未选中，红=选中） |
| `tab-service.png` / `tab-service-active.png` | 底部 tabBar 第 2 项 | 党员服务 |
| `tab-ai.png` / `tab-ai-active.png` | 底部 tabBar 第 3 项 | AI 学习 |
| `tab-archive.png` / `tab-archive-active.png` | 底部 tabBar 第 4 项 | 电子档案 |
| `tab-mine.png` / `tab-mine-active.png` | 底部 tabBar 第 5 项 | 我的 |
| `home/data/profile`(+`-active`) | — | **工程自带默认图标**，feat-006 建 5-tab 框架时由上表替换 |

### 2. 页面图标（`icons/`）

| 文件 | 原型位置 | 语义 | 关联功能 |
|---|---|---|---|
| `star-favorite-red.png` | 个人中心 @y≈588（菜单第 1 项） | 我的收藏（红星） | feat-013 |
| `history-folder-orange.png` | 个人中心 @y≈686（菜单第 2 项） | 浏览记录（橙文件夹） | feat-013 |
| `my-activity-star-purple.png` | 个人中心 @y≈784（菜单第 3 项） | 我的活动（紫星票） | feat-009（暂不实现，预留） |
| `thought-report-red.png` / `-active` | 个人中心 @y≈882（菜单第 4 项）；党员服务宫格第 4 项「思想会地」 | 思想汇报（红文件+星；`-active` 为渐变选中态） | feat-010（思想汇报暂不实现，图标可复用） |
| `study-ledger-purple.png` | 个人中心 @y≈966（菜单第 5 项） | 学习台账（紫台账/报纸） | feat-011（暂不实现，预留） |
| `my-archive-orange.png` | 个人中心 @y≈1064（菜单第 6 项） | 我的档案（橙书立） | feat-012 |
| `manual-book-green.png` | 个人中心 @y≈1162（菜单第 7 项） | 数智党建手册（绿书本） | feat-011（暂不实现，预留） |
| `knowledge-doc-blue.png` | 个人中心 @y≈1162 之后（菜单第 8 项） | 应知应会（蓝文档） | feat-011（暂不实现，预留） |
| `points-trophy.png` | 个人中心 积分卡（@y≈280–420） | 我的积分（红奖杯） | feat-014（暂不实现，预留） |
| `member-chat-purple.png` | 党员服务 宫格第 2 项「党员交流」@y≈180–260 | 党员交流（紫气泡） | feat-010 |
| `activity-signup-red.png` | 党员服务 宫格第 1 项「活动报名」@y≈180–260 | 活动报名（红渐变方块白笔） | feat-009（暂不实现，预留） |
| `notice-plane-orange.png` | 党员服务 宫格第 3 项「通知公告」@y≈180–260 | 通知公告（橙纸飞机） | feat-010 |
| `feedback-chat-blue.png` | 党员服务 宫格第 5 项「意见反馈」@y≈180–260 | 意见反馈（蓝气泡） | feat-010（意见反馈暂不实现，预留） |
| `notice-doc-red.png` | 党务公告列表 | 党务公告（红底文件+星） | feat-010 |
| `news-list-orange.png` | 图文/要闻列表 | 要闻列表（橙文档列表） | feat-007 |
| `party-emblem.png` | 党建专题专栏 | 党徽 | feat-007 |
| `party-flag.png` | 党建专题专栏 | 红旗 | feat-007 |
| `study-book.png` | 学习/图文入口 | 学习（红书本） | feat-007 / feat-008 |
| `education-cap.png` | 教育培训入口 | 教育培训（红学士帽） | feat-007 |
| `favorite-bookmark.png` | 收藏/书签 | 收藏（红书签，红星标的备用态） | feat-013 |
| `search-red.png` | 首页 @y≈120 搜索框；AI 学习 @y≈130 搜索框 | 搜索（红放大镜） | feat-007 |
| `arrow-right-gray.png` | 个人中心/电子档案 列表项右侧 | 列表右箭头（›） | 通用 |
| `arrow-right-gray-alt.png` | 同上（备用态） | 列表右箭头备用 | 通用 |
| `arrow-right-dark.png` | 列表「更多」 | 深灰右箭头 | 通用 |
| `arrow-back-white.png` | 自定义导航栏左侧 | 返回左箭头（白） | feat-006 |

### 3. Banner / 封面 / 背景 / 头像（`images/`）

| 文件 | 原型位置 | 语义 | 关联功能 |
|---|---|---|---|
| `banner-party-history.png` | 首页 @y≈200–420 主 Banner「铭记峥嵘党史 赓续红色薪火」 | 首页主 Banner（**接口优先，仅兜底**） | feat-007 |
| `banner-20th-congress.png` | 党员服务 活动卡「红色教育基地参观学习」 | 活动封面 | feat-009（暂不实现，也可作文创封面） |
| `banner-fourth-plenum.png` | 党员服务 活动卡「学习贯彻二十届四中全会精神」 | 活动封面 | feat-009（暂不实现） |
| `banner-ai-tech.png` | AI 学习 / VR 入口 | AI 科技 Banner | feat-011 / feat-015（暂不实现，预留） |
| `cover-party-story.png` | AI 学习 列表缩略图「峥嵘岁月 不忘初心」 | 图文封面（**接口优先，仅兜底**） | feat-008 |
| `cover-tech-focus.png` | 图文列表封面「智启·科技聚焦」 | 图文/视频封面（**接口优先，仅兜底**） | feat-007 |
| `cover-slogan-red.png` | 图文列表封面「踔厉奋发 勇毅前行」 | 图文封面（**接口优先，仅兜底**） | feat-007 |
| `cover-greatwall.png` | 图文列表封面（长城日出） | 图文封面（**接口优先，仅兜底**） | feat-007 |
| `bg-header-red.png` | 各页头部红渐变底 | 头部背景 | feat-006/007 |
| `bg-card-tiananmen.png` | 红色卡片底（天安门） | 卡片背景 | feat-007 |
| `bg-card-gradient.png` | 电子档案 @y≈415–510 四张统计卡底；个人中心 积分卡底 | 统计卡/积分卡背景 | feat-012 |
| `card-idea-quill.png` | 留言/建议输入卡插画（卷轴+笔） | 卡片插画 | feat-010 |
| `card-report-doc.png` | 汇报类卡片插画（红文件+笔） | 卡片插画 | feat-010 |
| `card-notice-bell.png` | 通知类卡片插画（红铃铛） | 卡片插画 | feat-010 |
| `card-study-edit.png` | 学习类卡片插画（红书+铅笔） | 卡片插画 | feat-007 |
| `avatar-pioneer-boy.png` | 档案详情 @y≈160 用户头像「张\*\*」；电子档案 列表「刘\*\*」 | 默认头像（红领巾少年） | feat-012 |
| `avatar-soldier-girl.png` | 电子档案 列表头像「杨\*\*」 | 默认头像（军帽少女） | feat-012 |
| `avatar-salute-girl.png` | 电子档案 列表头像 | 默认头像（敬礼少女） | feat-012 |
| `avatar-placeholder.png` | — | 头像占位（工程自带，被 `pages/profile` 引用） | feat-005 |
| `empty-data.png` | — | 空状态图（工程自带，被 `AppEmpty` 引用） | 通用 |

## 引用规则

1. **接口图片优先（AGENTS.md 不变式 9，最高优先级）**：凡接口已返回图片/图标的字段，必须渲染接口返回值，**禁止用本目录静态图占位或充当默认内容**。
   静态图只允许三类用途：① 加载中占位/骨架屏；② 加载失败、字段为空、空数据兜底；③ 纯装饰（背景底图、卡片底纹、tabBar 与功能图标、箭头等 UI 图标）。

   | 场景 | 来源 | 本目录静态图 |
   |---|---|---|
   | 图文/视频/音频列表缩略图 | `apituwen/tuwenliebiao`、`tuwenfuliebiao` 的 `ossdir` + `wenjianurl` | 仅加载/失败兜底 |
   | 图文详情头图 | `apituwen/tuwenxiangqing` 的 `wenjianurl` | 仅加载/失败兜底 |
   | 收藏 / 浏览记录缩略图 | `apituwen/tuwencaozuojilu` 的 `ossdir` + `wenjianurl` | 仅加载/失败兜底 |
   | 首页轮播 / 专题专栏 Banner | 走 `apituwen` 图文类别接口，有数据用接口 | 接口无数据时兜底 |
   | 用户头像 | `apiuser/userinfo` **未返回头像字段**（仅有上传接口 `apiuser/touxiang`）→ 用 `avatar-*` 作默认头像；用户上传后展示其选择/接口返回图 | 允许（接口未返回） |
   | tabBar / 功能 / 箭头 / 搜索等 UI 图标 | 接口无对应字段 | 允许（装饰性） |

2. 页面/组件引用一律写**绝对路径**：`/static/...`（小程序端 `/static/` 映射到 `src/static/`）。
3. 远程图片（接口返回）必须拼 `ossdir` + `wenjianurl`，禁止拼裸域名，禁止与本目录本地图混用同一字段。
4. 使用 `<image>` 必须带 `mode` + 占位 + `error` 兜底（D28）：`src` 优先取接口值，`error` 事件回落到本目录兜底图。
5. 新增资源必须先在本表登记，再在页面引用；禁止直接丢 png 到目录里不登记。
6. 暂不实现功能对应的资源**只登记不引用**，避免"假数据占位"被误判为已实现。
7. 若后续接口新增图片字段，对应静态资源必须在对照表中标注为「仅兜底」，并按不变式 9 更新 AGENTS.md 的字段清单。
