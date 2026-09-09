<script setup lang="ts">
import { ref, computed } from 'vue';
import AppInput from '@/components/AppInput/AppInput.vue';
import AppButton from '@/components/AppButton/AppButton.vue';
import { login, redirectAfterLogin } from '@/services/auth.service';

const username = ref('');
const password = ref('');
const usernameError = ref('');
const passwordError = ref('');
const submitting = ref(false);

const canSubmit = computed(() => !!username.value.trim() && !!password.value);

function validate(): boolean {
  usernameError.value = username.value.trim() ? '' : '请输入用户名';
  passwordError.value = password.value ? '' : '请输入密码';
  return !usernameError.value && !passwordError.value;
}

async function handleLogin() {
  if (!validate() || submitting.value) return;
  submitting.value = true;
  try {
    await login({ username: username.value.trim(), password: password.value });
    uni.showToast({ title: '登录成功', icon: 'success' });
    setTimeout(() => {
      redirectAfterLogin();
    }, 600);
  } catch (err) {
    // 失败信息已由请求层统一 toast，这里仅终止流程
    console.warn('[login] failed:', (err as Error).message);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <view class="login-page">
    <!-- 顶部品牌区（红底反白） -->
    <view class="login-page__hero">
      <image
        class="login-page__emblem"
        src="/static/icons/party-emblem.png"
        mode="aspectFit"
      />
      <text class="login-page__title">
        CDP 智慧党建
      </text>
      <text class="login-page__subtitle">
        铭记峥嵘党史 · 赓续红色薪火
      </text>
    </view>

    <!-- 登录表单卡 -->
    <view class="login-page__card">
      <text class="login-page__card-title">
        账号登录
      </text>
      <AppInput
        v-model="username"
        label="用户名"
        placeholder="请输入用户名"
        :error="usernameError"
      />
      <AppInput
        v-model="password"
        label="密码"
        type="password"
        placeholder="请输入密码"
        :error="passwordError"
      />
      <AppButton
        class="login-page__submit"
        type="primary"
        size="large"
        :disabled="!canSubmit || submitting"
        @click="handleLogin"
      >
        {{ submitting ? '登录中…' : '登 录' }}
      </AppButton>
      <text class="login-page__tip">
        忘记密码请联系支部管理员重置
      </text>
    </view>

    <view class="safe-area-bottom" />
  </view>
</template>

<style lang="scss" scoped>
.login-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: $color-bg-page;
}

.login-page__hero {
  @include flex-center;
  flex-direction: column;
  padding: 120rpx $page-gutter 100rpx;
  background: $color-primary-gradient;

  .login-page__emblem {
    width: 128rpx;
    height: 128rpx;
  }

  .login-page__title {
    margin-top: $spacing-lg;
    font-size: $font-xl;
    font-weight: $font-weight-bold;
    color: $color-text-inverse;
  }

  .login-page__subtitle {
    margin-top: $spacing-sm;
    font-size: $font-sm;
    color: $color-text-inverse;
    opacity: 0.85;
  }
}

.login-page__card {
  margin: -48rpx $page-gutter 0;
  padding: $spacing-2xl;
  background: $color-bg-card;
  border-radius: $radius-lg;
  box-shadow: $shadow-2;

  .login-page__card-title {
    display: block;
    margin-bottom: $spacing-xl;
    font-size: $font-lg;
    font-weight: $font-weight-semibold;
    color: $color-text-primary;
    text-align: center;
  }

  .login-page__submit {
    display: flex;
    width: 100%;
    margin-top: $spacing-xl;
  }

  .login-page__tip {
    display: block;
    margin-top: $spacing-lg;
    font-size: $font-sm;
    color: $color-text-tertiary;
    text-align: center;
  }
}
</style>
