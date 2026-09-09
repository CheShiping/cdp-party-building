<script setup lang="ts">
import AppEmpty from '@/components/AppEmpty/AppEmpty.vue';
</script>

<template>
  <view class="placeholder-page">
    <AppEmpty
      title="电子档案建设中"
      description="党员电子档案即将开放，档案数据仅本人可见"
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
