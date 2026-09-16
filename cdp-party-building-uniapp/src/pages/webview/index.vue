<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { requireLogin } from '@/services/auth.service';

/**
 * 外链承载页（feat-008）：图文 `wailian` 原文跳转。
 * 注意：微信小程序 web-view 要求目标域名在「业务域名」白名单内，
 * 未配置时页面无法打开 → 详情页已提供「复制链接」兜底入口。
 */
const url = ref('');

onLoad((options) => {
  if (!requireLogin()) return;
  const raw = options?.url ? decodeURIComponent(options.url) : '';
  // 仅允许 http(s)，避免注入 file:// 等非预期 scheme
  if (/^https?:\/\//i.test(raw)) {
    url.value = raw;
  } else {
    uni.showToast({ title: '链接无效', icon: 'none' });
  }
});
</script>

<template>
  <view class="webview-page">
    <web-view
      v-if="url"
      :src="url"
    />
  </view>
</template>

<style lang="scss" scoped>
.webview-page {
  min-height: 100vh;
  background: $color-bg-page;
}
</style>
