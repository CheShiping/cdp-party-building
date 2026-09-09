<script setup lang="ts">
import AppEmpty from '@/components/AppEmpty/AppEmpty.vue';
</script>

<template>
  <view class="placeholder-page">
    <AppEmpty
      title="党员服务建设中"
      description="党务公告与支部留言即将开放"
    />
  </view>
</template>

<style lang="scss" scoped>
.placeholder-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: $color-bg-page-alt;
}
</style>
