<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import AppEmpty from '@/components/AppEmpty/AppEmpty.vue';
import AppButton from '@/components/AppButton/AppButton.vue';
import { apiListinfo, maskName, maskPhone, type UserArchive } from '@/api/modules/user';
import { resolveFileUrl } from '@/api/modules/tuwen';
import { requireLogin } from '@/services/auth.service';
import { useUserStore } from '@/stores/modules/user';

/**
 * 党员档案详情（feat-012，prototype/档案详情.jpg）。
 * ⚠ 隐私红线（AGENTS.md）：党员档案仅**本人**可见，前端强制校验 sysyonghuid === 当前登录用户，
 * 不匹配直接拦截；页面不打印任何敏感字段日志。
 */
const userStore = useUserStore();

const statusBarHeight = ref(uni.getSystemInfoSync().statusBarHeight || 0);

const archive = ref<UserArchive | null>(null);
const loading = ref(true);
const loadError = ref('');

const myUserId = computed(() => userStore.userInfo?.yonghuid || 0);

const avatarUrl = computed(() => {
  const remote = userStore.avatar;
  if (!remote) return '/static/images/avatar-pioneer-boy.png';
  return /^https?:\/\//i.test(remote) ? remote : resolveFileUrl('', remote);
});

function formatDate(value?: string | null): string {
  return value ? value.slice(0, 10) : '—';
}

function formatGender(value?: number | null): string {
  if (value === 1) return '男';
  if (value === 2) return '女';
  return '—';
}

/** 基本信息行（全部来自 apiuser/listinfo） */
const infoRows = computed(() => {
  const data = archive.value;
  if (!data) return [] as Array<{ label: string; value: string }>;
  return [
    { label: '姓名', value: maskName(data.xingming) },
    { label: '性别', value: formatGender(data.xingbie) },
    { label: '民族', value: data.minzu || '—' },
    { label: '出生日期', value: formatDate(data.chushengriqi) },
    { label: '入党时间', value: formatDate(data.rudangriqi) },
    { label: '所属支部', value: data.jigouming || '—' },
    { label: '党内职务', value: data.dangneizhiwu || '—' },
    { label: '行政职务', value: data.xingzhengzhwu || '—' },
    // 联系电话：登录名（手机号）脱敏展示
    { label: '联系电话', value: maskPhone(data.dengluming) },
  ];
});

async function loadArchive(targetId: number, jiegouid?: number) {
  loading.value = true;
  loadError.value = '';
  try {
    const res = await apiListinfo(targetId, jiegouid);
    if (!res.obj || !res.obj.sysyonghuid) {
      loadError.value = '档案不存在或无权查看';
      return;
    }
    archive.value = res.obj;
  } catch (err) {
    loadError.value = (err as Error).message || '加载失败';
  } finally {
    loading.value = false;
  }
}

function retry() {
  loadArchive(myUserId.value, archive.value?.sysjiegouid || undefined);
}

function goBack() {
  const pages = getCurrentPages();
  if (pages.length > 1) {
    uni.navigateBack();
  } else {
    uni.switchTab({ url: '/pages/archive/index' });
  }
}

onLoad((options) => {
  if (!requireLogin()) return;

  const targetId = Number(options?.sysyonghuid || 0) || myUserId.value;
  const jiegouid = Number(options?.sysjiegouid || 0) || undefined;

  // 隐私红线：仅本人可查看
  if (!targetId || targetId !== myUserId.value) {
    loading.value = false;
    loadError.value = '党员档案仅本人可见';
    uni.showToast({ title: '党员档案仅本人可见', icon: 'none' });
    return;
  }

  loadArchive(targetId, jiegouid);
});
</script>

<template>
  <view class="archive-detail">
    <!-- 红底头部 + 用户区（prototype/档案详情.jpg @0–300） -->
    <view
      class="archive-detail__header"
      :style="{ paddingTop: `${statusBarHeight}px` }"
    >
      <view class="archive-detail__nav">
        <view
          class="archive-detail__back"
          @tap="goBack"
        >
          <text class="archive-detail__back-icon">
            ←
          </text>
        </view>
        <text class="archive-detail__nav-title">
          档案详情
        </text>
      </view>

      <view class="archive-detail__user">
        <image
          class="archive-detail__avatar"
          :src="avatarUrl"
          mode="aspectFill"
        />
        <view class="archive-detail__user-meta">
          <text class="archive-detail__name">
            {{ maskName(archive?.xingming || userStore.displayName) }}
          </text>
          <text
            v-if="archive?.dangneizhiwu"
            class="archive-detail__role"
          >
            {{ archive?.dangneizhiwu }}
          </text>
          <text
            v-if="archive?.jigouming"
            class="archive-detail__org"
          >
            {{ archive?.jigouming }}
          </text>
        </view>
      </view>
    </view>

    <!-- 加载失败 / 无权查看 -->
    <view
      v-if="loadError && !loading"
      class="archive-detail__error"
    >
      <AppEmpty
        title="无法查看档案"
        :description="loadError"
      />
      <AppButton
        v-if="myUserId"
        class="archive-detail__retry"
        type="primary"
        size="small"
        @click="retry"
      >
        查看我的档案
      </AppButton>
    </view>

    <template v-else>
      <!-- 基本信息 -->
      <view class="archive-detail__card">
        <view class="archive-detail__card-header">
          <view class="archive-detail__card-bar" />
          <text class="archive-detail__card-title">
            基本信息
          </text>
        </view>

        <view
          v-if="loading"
          class="archive-detail__skeleton"
        >
          <view class="archive-detail__skeleton-line" />
          <view class="archive-detail__skeleton-line" />
          <view class="archive-detail__skeleton-line archive-detail__skeleton-line--short" />
        </view>

        <view
          v-for="row in infoRows"
          v-else
          :key="row.label"
          class="archive-detail__row"
        >
          <text class="archive-detail__row-label">
            {{ row.label }}
          </text>
          <text class="archive-detail__row-value">
            {{ row.value }}
          </text>
        </view>
      </view>

      <!-- 档案材料（接口文档无对应接口 → 暂不实现） -->
      <view class="archive-detail__card">
        <view class="archive-detail__card-header">
          <view class="archive-detail__card-bar" />
          <text class="archive-detail__card-title">
            档案材料
          </text>
        </view>
        <AppEmpty
          title="暂无档案材料"
          description="档案材料接口暂未开放"
        />
      </view>
    </template>

    <view class="safe-area-bottom" />
  </view>
</template>

<style lang="scss" scoped>
.archive-detail {
  min-height: 100vh;
  background: $color-bg-page-alt;
}

// ---------------------------------------------------------------------------
// 头部
// ---------------------------------------------------------------------------
.archive-detail__header {
  padding-bottom: $spacing-3xl;
  background: $color-primary;
}

.archive-detail__nav {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: $comp-navbar-height;

  .archive-detail__nav-title {
    font-size: $comp-navbar-title-size;
    font-weight: $font-weight-semibold;
    color: $comp-navbar-title-color;
  }
}

.archive-detail__back {
  position: absolute;
  left: $spacing-lg;
  display: flex;
  align-items: center;
  justify-content: center;
  width: $comp-navbar-btn-hit;
  height: $comp-navbar-btn-hit;
}

.archive-detail__back-icon {
  font-size: $font-title;
  line-height: 1;
  color: $color-text-inverse;
}

.archive-detail__user {
  display: flex;
  align-items: center;
  padding: $spacing-lg $page-gutter 0;
}

.archive-detail__avatar {
  width: $comp-avatar-size-md;
  height: $comp-avatar-size-md;
  flex-shrink: 0;
  background: $color-bg-tertiary;
  border-radius: $comp-avatar-radius;
  border: $comp-avatar-border-width solid $color-text-inverse;
}

.archive-detail__user-meta {
  display: flex;
  flex-direction: column;
  margin-left: $spacing-lg;
}

.archive-detail__name {
  font-size: $font-xl;
  font-weight: $font-weight-bold;
  color: $color-text-inverse;
}

.archive-detail__role {
  align-self: flex-start;
  padding: 2rpx $spacing-sm;
  margin-top: $spacing-xs;
  font-size: $font-xs;
  color: $color-text-inverse;
  border: $comp-hairline-width solid $color-text-inverse;
  border-radius: $radius-xs;
}

.archive-detail__org {
  margin-top: $spacing-xs;
  font-size: $font-sm;
  color: $color-text-inverse;
  opacity: 0.9;
}

// ---------------------------------------------------------------------------
// 卡片
// ---------------------------------------------------------------------------
.archive-detail__card {
  margin: $section-margin $page-gutter 0;
  padding: $comp-card-padding;
  background: $color-bg-card;
  border-radius: $radius-md;
}

.archive-detail__card-header {
  display: flex;
  align-items: center;
  margin-bottom: $spacing-lg;
}

.archive-detail__card-bar {
  width: 8rpx;
  height: 32rpx;
  margin-right: $spacing-sm;
  background: $color-primary;
  border-radius: $radius-xs;
}

.archive-detail__card-title {
  font-size: $font-lg;
  font-weight: $font-weight-semibold;
  color: $color-text-primary;
}

.archive-detail__row {
  display: flex;
  align-items: flex-start;
  padding: $spacing-md 0;
  border-bottom: $comp-hairline-width solid $color-border-light;

  &:last-child {
    border-bottom: none;
  }
}

.archive-detail__row-label {
  width: 160rpx;
  flex-shrink: 0;
  font-size: $font-md;
  color: $color-text-secondary;
}

.archive-detail__row-value {
  flex: 1;
  font-size: $font-md;
  color: $color-text-primary;
  word-break: break-all;
}

// ---------------------------------------------------------------------------
// 骨架 / 错误
// ---------------------------------------------------------------------------
.archive-detail__skeleton {
  padding-top: $spacing-sm;
}

.archive-detail__skeleton-line {
  height: $comp-skeleton-row-height;
  margin-bottom: $comp-skeleton-row-gap;
  background: $color-bg-tertiary;
  border-radius: $comp-skeleton-row-radius;

  &--short {
    width: 60%;
  }
}

.archive-detail__error {
  padding-top: $spacing-3xl;
}

.archive-detail__retry {
  display: flex;
  width: 280rpx;
  margin: 0 auto;
}
</style>
