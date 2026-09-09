<script setup lang="ts">
import AppEmpty from '@/components/AppEmpty/AppEmpty.vue';
</script>

<template>
  <view class="placeholder-page">
    <AppEmpty
      title="AI 学习建设中"
      description="数智党建手册暂未开放，敬请期待"
    />
  </view>
</template>

<style lang="scss" scoped>
.placeholder-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: $color-bg-page;
}
</style>
