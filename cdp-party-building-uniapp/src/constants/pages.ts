export const PagePaths = {
  HOME: 'pages/index/index',
  SERVICE: 'pages/service/index',
  AI: 'pages/ai/index',
  ARCHIVE: 'pages/archive/index',
  PROFILE: 'pages/profile/index',
  LOGIN: 'pages/login/index',
  TOPIC: 'pages/topic/index',
  DETAIL: 'pages/detail/index',
  WEBVIEW: 'pages/webview/index',
  MESSAGE: 'pages/message/index',
  ARCHIVE_DETAIL: 'pages/archive-detail/index',
} as const;

export type PagePath = typeof PagePaths[keyof typeof PagePaths];

export const PageTitles: Record<PagePath, string> = {
  [PagePaths.HOME]: '首页',
  [PagePaths.SERVICE]: '党员服务',
  [PagePaths.AI]: 'AI学习',
  [PagePaths.ARCHIVE]: '电子档案',
  [PagePaths.PROFILE]: '个人中心',
  [PagePaths.LOGIN]: '登录',
  [PagePaths.TOPIC]: '专题专栏',
  [PagePaths.DETAIL]: '内容详情',
  [PagePaths.WEBVIEW]: '原文链接',
  [PagePaths.MESSAGE]: '党员交流',
  [PagePaths.ARCHIVE_DETAIL]: '档案详情',
};
