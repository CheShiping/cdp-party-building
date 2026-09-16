# 设计文档 · feat-012 党员电子档案

- 功能编号：feat-012（依赖 feat-006）
- 状态：**已实施（2026-09-16）**
- 目标端：微信小程序（首要），H5 / App 兼容
- 关联原型：`prototype/电子档案.jpg`（列表 + 统计卡）、`prototype/档案详情.jpg`（详情，仅本人可见）
- 隐私约束：AGENTS.md「隐私红线」——党员电子档案、实名认证数据**仅本人可见**，不得出现在列表、日志、mock 数据或外泄路径

---

## 1. 目标与范围

### 1.1 实现

1. **电子档案 tab**（`pages/archive`，按原型复刻）：红底导航 + 搜索（姓名 / 支部）+ 权限提示条 + 4 张统计卡 + 本支部党员列表 + 「档案导出」按钮；
2. **档案详情**（`pages/archive-detail`，按原型复刻）：红底用户区 + 「基本信息」卡（9 项）+ 「档案材料」卡；
3. **个人中心「我的档案」** 菜单由 blocked 改为可用，跳转自己的档案详情；
4. 列表姓名**脱敏**（张\*\*）、详情手机号**脱敏**（138\*\*\*\*1236）。

### 1.2 暂不实现（无接口 / 隐私约束）

| 项 | 原因 |
|---|---|
| 「档案材料」（入党申请书 / 思想汇报归档） | `docx/接口文档.md` 无档案材料接口 → 仅展示空态说明，不造假数据 |
| 「档案导出」 | 无接口；且导出会扩大敏感数据外泄面 → 点击仅提示"暂未开放" |
| 党员实名认证、账号信息修改 | 无接口（`xiugaimima` 仅支持改密码） |
| 他人档案详情 | 隐私红线：**仅本人可见**（见 §4 安全实测，后端未鉴权，前端强制拦截） |

---

## 2. 接口（对照 `docx/接口文档.md` 第 1~3 条，2026-09-16 实测）

| 用途 | 接口 | 参数 | 实测结论 |
|---|---|---|---|
| 本机构党员列表 | `GET apiuser/jigouyonghu` | `page`、`pagesize`、`xingming`、`jigouming` | 返回 3 条；字段 `sysyonghuid / xingming / sysjiegouid / dangneizhiwu / xingzhengzhwu / jigouming`，**不含** `dengluming`、`chushengriqi` 等敏感字段（列表侧无泄漏风险）；`xingming` 与 `jigouming` 为独立参数，可分别模糊搜索（实测"张"命中 1 条、"教职工"命中 3 条） |
| 全部用户列表 | `GET apiuser/quanbuyonghu` | 同上 | 返回 5 条，用于统计聚合（党支部去重 2） |
| 党员档案详情 | `GET apiuser/listinfo` | `sysyonghuid`、`sysjiegouid` | 返回 `dengluming / xingming / xingbie / minzu / rudangriqi / chushengriqi / xueli / dangneizhiwu / xingzhengzhwu / jigouming` |
| ⚠ 鉴权实测 | 同上 | 传**他人** `sysyonghuid=9` | **`success:true` 且返回他人档案（范泽熙）→ 后端未做"仅本人"鉴权，必须由前端强制拦截**（已写入 AGENTS.md 隐私红线） |

> 统计卡口径（**无统计接口**，全部由 `quanbuyonghu` 真实聚合，非 mock）：
> 党员总数 = 全部用户条数；党支部数 = `jigouming` 去重数；教职工党员 / 学生党员 = 机构名含「教职工/教师」/「学生」的条数。
> 注意：聚合基于单次 `pagesize=500` 拉取，用户量超过该值会低估，属已知局限。

---

## 3. 文件结构与关键实现

| 文件 | 类型 | 说明 |
|---|---|---|
| `src/pages/archive/index.vue` | 重写 | 电子档案列表页（原为骨架页）：搜索 / 权限提示 / 统计卡 / 党员列表 / 导出按钮 |
| `src/pages/archive-detail/index.vue` | 新增 | 档案详情（基本信息 + 档案材料空态） |
| `src/api/modules/user.ts` | 修改 | 新增 `OrgMember`、`UserArchive`、`apiJigouYonghu`、`apiQuanbuYonghu`、`maskName`、`maskPhone`；`apiListinfo` 返回类型由 `StoredUserInfo` 更正为 `UserArchive` |
| `src/pages/profile/index.vue` | 修改 | 「我的档案」菜单启用 → `pages/archive-detail` |
| `src/pages.json` / `src/constants/pages.ts` | 修改 | 注册 `pages/archive-detail`（custom 导航） |

### 3.1 隐私保护实现（重点）

```
列表页 pages/archive
  ├─ 数据源 jigouyonghu：接口本身不含敏感字段
  ├─ 姓名 maskName() → 张**（首字保留）
  └─ 点击他人 → toast「档案详情仅本人可见」，不跳转、不发请求

详情页 pages/archive-detail
  ├─ onLoad：targetId !== 当前登录 yonghuid → 直接拦截，不调用 listinfo
  ├─ 手机号（dengluming）经 maskPhone() 脱敏
  └─ 不打印任何档案字段到日志/console
```

`apiListinfo` 的 JSDoc 与 `UserArchive` 类型上均标注"敏感字段，禁止写入日志/列表/外泄路径"，便于后续维护者识别。

### 3.2 交互

- 搜索：`xingming` 优先，无命中时以 `jigouming` 再搜一次（接口两参数独立）；
- 列表：触底分页（20/页）、下拉刷新由页面返回后 `onShow` 重载；
- 统计卡：`onShow` 首次加载，成功即缓存（`statsLoaded`）；
- 空态：搜索无命中 / 本支部暂无档案分别给出不同文案。

---

## 4. 验证证据

| 检查项 | 命令（`cdp-party-building-uniapp/`） | 结果 |
|---|---|---|
| 类型检查 | `npx vue-tsc --noEmit` | 0 error |
| Lint | `npm run lint` | 0 error 0 warning |
| 主题门禁 | `npm run theme:sync` + `theme:check` | 白名单自检 OK；70 文件 0 违规 |
| 构建 | `npm run build:mp-weixin` | `DONE Build complete.` |
| 产物自检 | `npm run check:pages` | **11 页** `ALL PAGES OK`（含 archive-detail） |
| 接口实测（只读） | node fetch（admin/123456） | `jigouyonghu` 3 条且**无敏感字段**；`quanbuyonghu` 5 条、支部去重 2；`xingming=张` 命中 1、`jigouming=教职工` 命中 3 |
| 隐私鉴权实测 | `listinfo?sysyonghuid=9` | 后端返回他人档案（`success:true`，姓名 范泽熙）→ **确认必须前端拦截**，本实现已在 `onLoad` 拦截且列表侧不提供入口 |

> 本功能全部为只读接口，未产生任何写操作，无数据污染。

---

## 5. 遗留问题

1. **后端未做档案鉴权**：`apiuser/listinfo` 对任意 `sysyonghuid` 均返回数据。当前由前端拦截；**建议后端补充"仅本人/本支部"校验**（已在 AGENTS.md 登记该风险）。
2. **统计口径受 pagesize 限制**：超过 500 名用户时统计值会低估，需后端提供统计接口或返回总数。
3. **人员类别标签缺失**：原型列表/详情中的「教职工 / 学生」标签无接口字段，已省略（不臆造）；详情头部的白描边标签改用 `dangneizhiwu`（党内职务）。
4. **档案材料与导出**：等接口与需求澄清。
5. **头像**：列表他人头像接口无字段，按 `avatar-pioneer-boy / soldier-girl / salute-girl` 轮换作装饰性兜底（`src/static/README.md` 已登记）；本人若有 `touxiang` 接口值则优先使用（不变式 9）。
