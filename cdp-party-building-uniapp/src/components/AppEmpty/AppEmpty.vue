<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
    description?: string;
  }>(),
  {
    title: '暂无数据',
    description: '去看看其他内容吧',
  },
);
</script>

<template>
  <view class="app-empty">
    <image
      class="app-empty__image"
      src="/static/images/empty-data.png"
      mode="aspectFit"
    />
    <text class="app-empty__title">
      {{ title }}
    </text>
    <text class="app-empty__desc">
      {{ description }}
    </text>
  </view>
</template>

<style lang="scss" scoped>
.app-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $spacing-3xl;

  &__image {
    width: $comp-empty-image-size;
    height: $comp-empty-image-size;
    margin-bottom: $spacing-lg;
  }

  &__title {
    font-size: $font-title;
    color: $color-text-primary;
    margin-bottom: $spacing-xs;
  }

  &__desc {
    margin-top: $comp-empty-text-margin-top;
    font-size: $comp-empty-text-size;
    color: $color-text-tertiary;
  }
}
</style>
