import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { StoredUserInfo } from '@/utils/auth';

/**
 * 用户状态（feat-003）：token / 登录时间 / 用户信息。
 * 持久化只走 Storage（A02），Store 仅作运行时镜像。
 */
export const useUserStore = defineStore('user', () => {
  const token = ref('');
  const userInfo = ref<StoredUserInfo | null>(null);

  const isLogin = computed(() => !!token.value);
  /** 展示名：优先真实姓名 */
  const displayName = computed(() => userInfo.value?.yonghuxingming || userInfo.value?.dengluming || '');
  /** 头像（接口返回的 touxiang 优先，不变式 9；为空由页面用静态兜底） */
  const avatar = computed(() => userInfo.value?.touxiang || '');

  function setLoginState(newToken: string, info: StoredUserInfo) {
    token.value = newToken;
    userInfo.value = info;
  }

  function setAvatar(url: string) {
    if (userInfo.value) {
      userInfo.value = { ...userInfo.value, touxiang: url };
    }
  }

  function clearLoginState() {
    token.value = '';
    userInfo.value = null;
  }

  function restoreFromStorage(storageToken: string, info: StoredUserInfo | null) {
    token.value = storageToken;
    userInfo.value = info;
  }

  return {
    token,
    userInfo,
    isLogin,
    displayName,
    avatar,
    setLoginState,
    setAvatar,
    clearLoginState,
    restoreFromStorage,
  };
});
