# 设计文档 feat-003 请求层与登录鉴权（含 HMAC-MD5）

| 项目 | 内容 |
|---|---|
| 功能编号 | feat-003 |
| 文档版本 / 状态 | v1.0，已实施并验证（2026-09-09） |
| 依赖 | feat-001 |
| 被依赖 | feat-005/006/007 及全部业务模块 |
| 权威输入 | `docx/接口文档.md`、`uniapp-request-skill`、`uniapp-components-skill`、根目录 `md5.js` |

## 1. 目标与范围

- 统一请求封装：基址 `https://szdj.cdszxjc.com/`（模块前缀 `apituwen/apiliuyan/apiuser`）、响应信封解析、错误与网络异常统一 toast
- 鉴权：登录返回的用户 token 管理（Storage 唯一持久化）、401 统一处理（并发去重）、登录回跳
- **token 一天有效期**：登录缓存登录时间，超过一天经静默续期重新获取 token，失败走登出流程
- `md5.js` 改造为 TS/ESM：`encryptPassword(pwd) = hex_hmac_md5('cds', pwd)`
- 不做：注册（接口缺失）、Mock

## 2. 涉及接口（对照 docx/接口文档.md）

| 接口 | 用途 | 鉴权 |
|---|---|---|
| `apiuser/login` | 登录，`username` + `password`（HMAC-MD5） | 无需预置 API token（用户 2026-09-09 确认：登录后返回 token） |
| `apiuser/userinfo` / `exit` / `xiugaimima` / `touxiang` | 用户信息/退出/改密/改头像 | Header `token` |
| `apituwen/*`、`apiliuyan/*` | 业务接口 | Header `token` |

**实测关键结论（2026-09-09）**：
1. token 传参方式为 **HTTP Header，字段名 `token`（纯值）**——query 参数与 `Authorization`/`Bearer` 均被后端拒绝（"APP必须在HTTP Header中传入token"）
2. 响应信封 `success` 为**布尔值**（文档标注 "true成功false失败"），代码同时兼容字符串 `"true"`
3. 密码算法 `HMAC-MD5(key='cds', msg=pwd)`（md5.js 与 Node crypto 三方比对一致；AGENTS 不变式 3 中 `hex_hmac_md5(pwd,'cds')` 的参数顺序表述与实际实现不符，以实现为准并在代码注释说明）

## 3. 文件结构与关键实现

| 文件 | 职责 |
|---|---|
| `src/utils/md5.ts` | md5.js 逐行 TS 移植；导出 `hexHmacMd5(key,data)`、`encryptPassword(pwd)` |
| `src/constants/storage.ts` | 存储 Key 统一管理（`cdp_` 前缀）：TOKEN/USER_INFO/LOGIN_TIME/CREDENTIALS/LOGIN_REDIRECT |
| `src/constants/api.ts` | 基址、模块前缀、`TOKEN_HEADER='token'`、`TOKEN_TTL_MS=24h`、图文类别 ID 常量 |
| `src/utils/auth.ts` | token/凭据/用户信息的 Storage 读写、`isTokenFresh()`、登录回跳、`handleUnauthorized()`（3s 锁 + 清理 + reLaunch 登录页）、`isAuthErrorMessage()` |
| `src/utils/request.ts` | 请求层：Header token 注入、信封解析、401/业务鉴权错误统一处理、`registerReloginHook()`（由 auth.service 注册静默续期钩子，避免 request↔api 循环依赖） |
| `src/services/auth.service.ts` | 认证服务收口（A01）：`login/silentRelogin/logout/bootstrap/requireLogin/redirectAfterLogin/updateAvatar` |
| `src/stores/modules/user.ts` | 运行时镜像（Pinia），持久化只走 Storage（A02） |
| `src/api/modules/user.ts` | login/userinfo/exit/xiugaimima/listinfo/touxiang（uploadFile） |
| `src/App.vue` | onLaunch 接入 `bootstrap()`：恢复登录态 → 超期静默续期 → 未登录跳登录页 |

**安全要点**：CREDENTIALS 只存 HMAC 加密后的密码（非明文，A03）；日志不输出 token/密码（A06）；登出清理全部登录态但保留 LOGIN_REDIRECT（A05）。

## 4. 状态与数据流

```
登录页 → login() → encryptPassword → apiuser/login → setToken(+LOGIN_TIME)/setUserInfo/setCredentials
       → redirectAfterLogin()（回跳或 switchTab 首页）
业务请求 → ensureFreshToken()：无 token → handleUnauthorized；超 24h → silentRelogin()（存储凭据重登）→ 失败 handleUnauthorized
401/业务"请登录"类错误 → handleUnauthorized（3s 去重）→ 保存回跳 → 清登录态 → reLaunch /pages/login/index
```

## 5. 验证证据

- `node crypto` 与移植后 `md5.ts` 对拍：`encryptPassword('123456') = 64d53bde5d769763153159245c619185` ✅
- 真实登录（2026-09-09）：`GET apiuser/login?username=admin&password=64d5…` → `{"success":true,"obj":{yonghuid:2,yonghuxingming:"管理员",token:"u_****",…}}` ✅
- Header token 实测：`token: u_****` → `tuwenleibie`/`tuwenliebiao` 均 `success:true`；query/Authorization 方式均失败 ✅
- `type-check` 0 error；`lint` 0/0；`build:mp-weixin` DONE

## 6. 遗留问题

- L1：后端无 token 刷新接口，静默续期依赖本地加密凭据重登；用户改密后旧凭据会在下次续期时失败并走重新登录（可接受）
- L2：`success` 字段类型后端不统一（布尔/文档描述为字符串），已做双兼容；如后续出现其他信封变体需扩展 `isSuccess`
