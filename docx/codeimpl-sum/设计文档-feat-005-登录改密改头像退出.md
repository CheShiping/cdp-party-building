# 设计文档 feat-005 登录、改密、改头像、退出（注册暂不实现）

| 项目 | 内容 |
|---|---|
| 功能编号 | feat-005 |
| 文档版本 / 状态 | v1.0，已实施并验证（2026-09-09） |
| 依赖 | feat-002 / feat-003 / feat-004 |
| 原型 | `prototype/个人中心.jpg`（验收标准） |
| 权威输入 | `docx/接口文档.md`（apiuser 模块） |

## 1. 目标与范围

- 登录页：用户名 + 密码 → HMAC-MD5 → `apiuser/login` → 缓存 token/登录时间/凭据 → 回跳
- 个人中心页（按原型复刻）：红头部 + 头像/姓名/支部、积分卡、8 项菜单、账号操作
- 改头像：`apiuser/touxiang`（multipart 文件流 + Header token），返回路径回写 Storage/Store
- 改密码：`apiuser/xiugaimima`（`mima` 加密提交，≥6 位校验）
- 退出：`apiuser/exit` + 本地清理 + reLaunch 登录页
- **不做（无接口，禁止 mock）**：注册、账号信息修改（`xiugaimima` 仅支持改密码）

## 2. 涉及接口

| 接口 | 参数 | 返回关键字段 |
|---|---|---|
| `apiuser/login` | `username`、`password`（HMAC-MD5, key=cds） | `obj`: yonghuid/dengluming/yonghuxingming/jueseming/bumenming/touxiang/token |
| `apiuser/userinfo` | 无 | 同上（实测含 `touxiang`） |
| `apiuser/touxiang` | multipart 文件流（name=file） | `obj`: 文件路径 |
| `apiuser/xiugaimima` | `mima`（加密） | msg: 保存成功 / 密码不能小于6位 |
| `apiuser/exit` | 无 | msg: 退出成功 |

## 3. 文件结构与关键实现

| 文件 | 说明 |
|---|---|
| `src/pages/login/index.vue` | 红渐变品牌区 + 白卡表单（AppInput/AppButton）；`validate()` → `login()` → `redirectAfterLogin()`；提交中禁重复提交 |
| `src/pages/profile/index.vue` | 复刻原型：状态栏 + 自定义导航（标题/编辑）、头像区（点击上传）、积分卡（`$color-bg-warm` + 金色描边；积分体系未开放显示"—"，不 mock）、8 项菜单（全部"点击提示"——对应 feat-009/010/011/012/013 后续批次）、修改密码弹窗（AppPopup center）、退出（showModal 确认） |
| `src/services/auth.service.ts` | `login/logout/updateAvatar` 复用（feat-003 收口） |

细节：
- 头像展示优先级：`touxiang` 接口值（`resolveFileUrl` 拼接）→ `avatar-placeholder.png`（不变式 9）
- 改密成功后同步更新本地续期凭据（加密形态），避免下次静默续期用旧密码失败
- 菜单八项与原型一致；未实现项点击 toast 明确提示（不跳转、不占位假数据）

## 4. 状态与数据流

```
profile onShow → requireLogin() → apiUserinfo() 刷新本地缓存
头像：chooseImage → apiTouxiang → obj 路径 → updateAvatar()（Storage+Store）
改密：AppPopup → 校验≥6位 → encryptPassword → apiXiugaimima → 更新凭据 → toast 保存成功
退出：confirm → apiExit（忽略失败）→ clearAuthStorage → reLaunch 登录页
```

## 5. 验证证据

- `login`/`userinfo` 真实接口通过（见 feat-003 证据）
- `type-check` 0 error；`lint` 0/0；`build:mp-weixin` DONE；页面 usingComponents 自检通过（app-input/app-button/app-popup）
- 改密/头像上传为**写操作**，为避免污染 admin 账号未在真实库执行；契约逐字段核对 `docx/接口文档.md`；待用户在开发者工具实测（真实注册 AppID 环境下验证）
- 页面与 `prototype/个人中心.jpg` 对照：头部/用户区/积分卡/菜单项位置一致

## 6. 遗留问题

- L1：原型"编辑"按钮对应账号信息修改，接口缺失 → 点击提示暂未开放
- L2：改密无"原密码"校验（后端接口本身不要求）
- L3：真实改密/头像上传需用户在开发者工具联调确认（本会话不执行写操作）
