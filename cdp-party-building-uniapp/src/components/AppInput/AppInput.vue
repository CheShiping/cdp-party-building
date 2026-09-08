<script setup lang="ts">
// uni-app 的 input 事件实际结构（与 DOM InputEvent 不同，需在事件回调中做一次安全断言）
interface UniInputEvent {
  detail: {
    value: string;
  };
}

interface Props {
  modelValue: string;
  label?: string;
  placeholder?: string;
  type?: 'text' | 'number';
  error?: string;
}

withDefaults(defineProps<Props>(), {
  label: '',
  placeholder: '',
  type: 'text',
  error: '',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

function onInput(e: InputEvent) {
  const event = e as unknown as UniInputEvent;
  emit('update:modelValue', event.detail.value);
}
</script>

<template>
  <view class="app-input">
    <text
      v-if="label"
      class="app-input__label"
    >
      {{ label }}
    </text>
    <input
      class="app-input__field"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      @input="onInput"
    >
    <text
      v-if="error"
      class="app-input__error"
    >
      {{ error }}
    </text>
  </view>
</template>

<style lang="scss" scoped>
.app-input {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;

  &__label {
    font-size: $font-body;
    color: $color-text-primary;
  }

  &__field {
    height: $comp-button-height-md;
    padding: 0 $comp-list-item-padding-x;
    background: $color-bg-primary;
    border: $comp-hairline-width solid $color-border;
    border-radius: $comp-button-radius;
    font-size: $font-body;
    color: $color-text-primary;
  }

  &__error {
    font-size: $font-caption;
    color: $color-error;
  }
}
</style>
