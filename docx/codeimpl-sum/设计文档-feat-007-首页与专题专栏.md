# 设计文档 feat-007 新闻与学习：首页与专题专栏

| 项目 | 内容 |
|---|---|
| 功能编号 | feat-007 |
| 文档版本 / 状态 | v1.0，已实施并验证（2026-09-09） |
| 依赖 | feat-006 |
| 原型 | `prototype/首页.jpg`（验收标准） |
| 权威输入 | `docx/接口文档.md`（apituwen 模块） |

## 1. 目标与范围

按原型复刻首页：轮播图、AI智能推送、党建专题专栏入口、快捷入口、图文/视频多形态内容列表；专题专栏入口落地为专题列表页（分页）。

**不做（无接口或属后续功能，仅入口/提示，不 mock）**：
- VR 基地（feat-015 blocked）→ 文字入口 + toast
- 快捷服务四项：活动报名（feat-009 blocked）、思想汇报（feat-010 无接口部分）、通知公告列表页（feat-010）、应知应会（feat-011 blocked）→ 点击 toast
- 内容详情页（feat-008）→ 列表项点击 toast "内容详情即将上线"
- 搜索（feat-008 范围）→ toast

## 2. 涉及接口（2026-09-09 真实验证）

| 接口 | 参数 | 用途 |
|---|---|---|
| `apituwen/tuwenleibie` | Header token | 类别树；实测 14 类：1轮播图(pid0)、2人工智能推送(pid0)、3专题学习(pid0)、4-9 专题子类(pid=3)、10最新活动、11通知公告、12支部公告、14组织关系、13评优评先 |
| `apituwen/tuwenliebiao` | `page/pagesize/tuwenleibieid/biaoti` | 轮播（类别1）、AI推送（类别2）、最新内容（类别3）、专题列表页（按类别） |

返回字段：`settuwenid/biaoti/zhaiyao/wailian/wenjianurl/dianjishu/riqi/ossdir`。

## 3. 文件结构与关键实现

| 文件 | 说明 |
|---|---|
| `src/pages/index/index.vue` | 首页：红渐变头部（状态栏 + 标题 + 搜索条 + VR 入口）→ 轮播 swiper（340rpx、圆角 12、自动轮播）→ AI智能推送（scroll-x 横滑卡，仅展示有缩略图的项）→ 党建专题专栏宫格（3 列，`tuwenleibie` 动态过滤 `shangjiiid===3`，图标映射 4-9 → `study-book/party-flag/party-emblem/education-cap/knowledge-doc-blue/notice-doc-red`）→ 快捷服务红卡（2x2 白字）→ 最新内容列表（缩略图 + 标题/摘要 + 「图文」标签 + 日期） |
| `src/pages/topic/index.vue` | 专题列表页：`onLoad(categoryId,title)` → 分页加载（10/页）→ 触底加载、下拉刷新、空态/错误重试/没有更多 |
| `src/api/modules/tuwen.ts` | `apiTuwenLeibie/apiTuwenLiebiao/resolveFileUrl` |

**不变式 9 落地**：`resolveFileUrl(ossdir, wenjianurl)`——完整 http(s) 原样；否则 `基址 + ossdir(去尾斜杠) + wenjianurl(补头斜杠)`；缩略图/轮播图一律先取接口值，`@error` 才回落 `images/cover-greatwall.png`；无接口图（宫格/快捷入口/搜索图标）用静态装饰图标。

三态：首屏 loading 骨架（shimmer 类，`_animations.scss` 唯一 keyframes）；失败 AppEmpty + 重试按钮；空数据 AppEmpty。

## 4. 状态与数据流

```
onShow → requireLogin() → 首次并行加载 [tuwenleibie, liebiao(1,5), liebiao(2,6), liebiao(3,10)]
  ├─ categories.filter(pid===3) → 专题宫格
  ├─ banners / aiPushItems / latestItems
  └─ 失败 → loadError + 重试
专题宫格点击 → navigateTo /pages/topic/index?categoryId=&title= → 分页 tuwenliebiao
```

## 5. 验证证据

- 真实接口（2026-09-09，Header token）：`tuwenleibie` 返回 14 类（层级/排序确认，pid=3 六大专题与原型宫格一一对应）；`tuwenliebiao` 类别 1 返回含 `wenjianurl=/tuwen/….jpg` 样例（轮播图）、类别 3 返回专题学习图文样例
- `type-check` 0 error；`lint` 0/0；`build:mp-weixin` DONE；首页/专题页 usingComponents 自检通过
- 页面与 `prototype/首页.jpg` 对照：头部/搜索条/轮播/推送横滑/专题宫格/快捷红卡/内容列表结构与配色一致

## 6. 遗留问题

- L1：`dianjishu`（点击数）实测多为 null，列表暂不展示阅读数；feat-008 详情页打通后随 `tuwencaozuo leixing=0` 自增
- L2：视频/音频多形态：列表接口未返回类型字段，当前统一「图文」标签；如后端补充类型字段需扩展标签
- L3：轮播图数据源为「轮播图」类别（id=1）；若运营侧调整类别结构，需同步 `TUWEN_CATEGORY` 常量
- L4：wailian（外部链接）跳转属 feat-008 外链范围
