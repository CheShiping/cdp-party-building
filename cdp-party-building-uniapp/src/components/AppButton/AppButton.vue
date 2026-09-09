<script setup lang="ts">
withDefaults(
  defineProps<{
    type?: 'primary' | 'secondary' | 'ghost';
    size?: 'small' | 'medium' | 'large';
    disabled?: boolean;
  }>(),
  {
    type: 'primary',
    size: 'medium',
    disabled: false,
  },
);

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void;
}>();

function handleClick(event: MouseEvent) {
  emit('click', event);
}
</script>

<template>
  <button
    class="app-button"
    :class="[`app-button--${type}`, `app-button--${size}`, { 'app-button--disabled': disabled }]"
    :disabled="disabled"
    @click="handleClick"
  >
    <slot />
  </button>
</template>

<style lang="scss" scoped>
.app-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: $comp-button-radius;
  font-size: $font-body;
  // 500 在部分安卓机型不生效，需要视觉 500 一律用 600（设计文档 5.2）
  font-weight: $font-weight-semibold;
  transition: opacity $duration-fast $ease-out;

  &::after {
    display: none;
  }

  &--primary {
    background: $color-primary;
    color: $color-text-inverse;

    &:active {
      background: $primary-600;
    }
  }

  &--secondary {
    background: $color-primary-light;
    color: $color-primary-dark;
  }

  &--ghost {
    background: transparent;
    color: $color-primary;
    border: $comp-hairline-width solid $color-primary;
  }

  &--small {
    height: $comp-button-height-sm;
    padding: 0 $comp-button-padding-x-sm;
  }

  &--medium {
    height: $comp-button-height-md;
    padding: 0 $comp-button-padding-x-md;
  }

  &--large {
    height: $comp-button-height-lg;
    padding: 0 $comp-button-padding-x-lg;
    font-size: $font-title;
  }

  &--disabled {
    opacity: $comp-button-disabled-opacity;
  }

  &:active {
    opacity: 0.8;
  }
}
</style>
