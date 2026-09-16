<script setup lang="ts">
import { computed, ref } from 'vue';
import { onReachBottom, onShow } from '@dcloudio/uni-app';
import AppEmpty from '@/components/AppEmpty/AppEmpty.vue';
import AppButton from '@/components/AppButton/AppButton.vue';
import {
  apiJigouYonghu,
  apiQuanbuYonghu,
  maskName,
  type OrgMember,
} from '@/api/modules/user';
import { resolveFileUrl } from '@/api/modules/tuwen';
import { requireLogin } from '@/services/auth.service';
import { useUserStore } from '@/stores/modules/user';

/**
 * 党员电子档案（feat-012，prototype/电子档案.jpg）。
 * - 列表：本机构党员（apiuser/jigouyonghu），姓名脱敏，不含敏感字段（隐私红线）
 * - 详情：仅本人可见（apiuser/listinfo），见 pages/archive-detail
 * - 统计卡：由 apiuser/quanbuyonghu 真实聚合（口径见设计文档）
 */
const userStore = useUserStore();

const statusBarHeight = ref(uni.getSystemInfoSync().statusBarHeight || 0);

const keyword = ref('');
const activeKeyword = ref('');
const list = ref<OrgMember[]>([]);
const page = ref(1);
const pageSize = 20;
const finished = ref(false);
const loading = ref(false);
const loadError = ref('');

const stats = ref({ total: 0, staff: 0, student: 0, branches: 0 });
const statsLoaded = ref(false);

/** 静态兜底头像（接口无头像字段时的装饰性轮换，不变式 9 例外场景） */
const AVATAR_FALLBACKS = [
  '/static/images/avatar-pioneer-boy.png',
  '/static/images/avatar-soldier-girl.png',
  '/static/images/avatar-salute-girl.png',
];

const myUserId = computed(() => userStore.userInfo?.yonghuid || 0);

function avatarSrc(item: OrgMember, index: number): string {
  if (item.sysyonghuid === myUserId.value && userStore.avatar) {
    const remote = userStore.avatar;
    return /^https?:\/\//i.test(remote) ? remote : resolveFileUrl('', remote);
  }
  return AVATAR_FALLBACKS[index % AVATAR_FALLBACKS.length];
}

// ---------------------------------------------------------------------------
// 统计聚合（口径：全部用户列表；「教职工/学生」按机构名归类）
// ---------------------------------------------------------------------------
async function loadStats() {
  if (statsLoaded.value) return;
  try {
    const res = await apiQuanbuYonghu(1, 500);
    const users = res.list || [];
    stats.value = {
      total: users.length,
      staff: users.filter((u) => /教职工|教师/.test(u.jigouming || '')).length,
      student: users.filter((u) => /学生/.test(u.jigouming || '')).length,
      branches: new Set(users.map((u) => u.jigouming).filter(Boolean)).size,
    };
    statsLoaded.value = true;
  } catch {
    // 统计失败不影响列表主流程
  }
}

// ---------------------------------------------------------------------------
// 列表
// ---------------------------------------------------------------------------
async function loadPage(targetPage: number) {
  if (loading.value || finished.value) return;
  loading.value = true;
  loadError.value = '';
  try {
    const res = await apiJigouYonghu(targetPage, pageSize, activeKeyword.value || undefined);
    let items = res.list || [];

    // 姓名无命中时按机构名再搜一次（接口 xingming / jigouming 为独立参数）
    if (targetPage === 1 && activeKeyword.value && !items.length) {
      const byOrg = await apiJigouYonghu(1, pageSize, undefined, activeKeyword.value);
      items = byOrg.list || [];
    }

    list.value = targetPage === 1 ? items : list.value.concat(items);
    if (items.length < pageSize) finished.value = true;
    page.value = targetPage;
  } catch (err) {
    loadError.value = (err as Error).message || '加载失败';
  } finally {
    loading.value = false;
  }
}

function reload() {
  list.value = [];
  finished.value = false;
  loadPage(1);
}

function retry() {
  reload();
}

function onSearch() {
  activeKeyword.value = keyword.value.trim();
  reload();
}

function openArchive(item: OrgMember) {
  if (item.sysyonghuid !== myUserId.value) {
    // 隐私红线：档案详情仅本人可见
    uni.showToast({ title: '档案详情仅本人可见', icon: 'none' });
    return;
  }
  uni.navigateTo({
    url: `/pages/archive-detail/index?sysyonghuid=${item.sysyonghuid}&sysjiegouid=${item.sysjiegouid || 0}`,
  });
}

function tipExport() {
  uni.showToast({ title: '档案导出暂未开放', icon: 'none' });
}

function formatRole(item: OrgMember): string {
  return item.dangneizhiwu || item.xingzhengzhwu || '';
}

onShow(() => {
  if (!requireLogin()) return;
  loadStats();
  if (!list.value.length) loadPage(1);
});

onReachBottom(() => {
  if (!finished.value && !loadError.value) loadPage(page.value + 1);
});
</script>

<template>
  <view class="archive-page">
    <!-- 红底头部：导航 + 搜索（prototype/电子档案.jpg @0–260） -->
    <view
      class="archive-page__header"
      :style="{ paddingTop: `${statusBarHeight}px` }"
    >
      <view class="archive-page__nav">
        <text class="archive-page__nav-title">
          电子档案
        </text>
      </view>

      <view class="archive-page__search-row">
        <view class="archive-page__search">
          <image
            class="archive-page__search-icon"
            src="/static/icons/search-red.png"
            mode="aspectFit"
          />
          <input
            v-model="keyword"
            class="archive-page__search-input"
            type="text"
            placeholder="搜索党员姓名/支部"
            confirm-type="search"
            @confirm="onSearch"
          >
        </view>
        <view
          class="archive-page__search-btn"
          @tap="onSearch"
        >
          搜索
        </view>
      </view>
    </view>

    <!-- 权限提示（原型黄底提示条） -->
    <view class="archive-page__notice">
      <text class="archive-page__notice-text">
        当前权限：支部管理员（可查看本支部档案，详情仅本人可见）
      </text>
    </view>

    <!-- 统计卡（数据来自 apiuser/quanbuyonghu 聚合） -->
    <view class="archive-page__stats">
      <view class="archive-page__stat">
        <image
          class="archive-page__stat-bg"
          src="/static/images/bg-card-gradient.png"
          mode="aspectFill"
        />
        <view class="archive-page__stat-body">
          <text class="archive-page__stat-value">
            {{ stats.total }}
          </text>
          <text class="archive-page__stat-label">
            党员总数
          </text>
        </view>
      </view>
      <view class="archive-page__stat">
        <image
          class="archive-page__stat-bg"
          src="/static/images/bg-card-gradient.png"
          mode="aspectFill"
        />
        <view class="archive-page__stat-body">
          <text class="archive-page__stat-value">
            {{ stats.staff }}
          </text>
          <text class="archive-page__stat-label">
            教职工党员
          </text>
        </view>
      </view>
      <view class="archive-page__stat">
        <image
          class="archive-page__stat-bg"
          src="/static/images/bg-card-gradient.png"
          mode="aspectFill"
        />
        <view class="archive-page__stat-body">
          <text class="archive-page__stat-value">
            {{ stats.student }}
          </text>
          <text class="archive-page__stat-label">
            学生党员
          </text>
        </view>
      </view>
      <view class="archive-page__stat">
        <image
          class="archive-page__stat-bg"
          src="/static/images/bg-card-gradient.png"
          mode="aspectFill"
        />
        <view class="archive-page__stat-body">
          <text class="archive-page__stat-value">
            {{ stats.branches }}
          </text>
          <text class="archive-page__stat-label">
            党支部数
          </text>
        </view>
      </view>
    </view>

    <!-- 党员列表 -->
    <view class="archive-page__list">
      <view
        v-if="loadError && !list.length"
        class="archive-page__error"
      >
        <AppEmpty
          title="加载失败"
          :description="loadError"
        />
        <AppButton
          class="archive-page__retry"
          type="primary"
          size="small"
          @click="retry"
        >
          重新加载
        </AppButton>
      </view>

      <template v-else>
        <view
          v-for="(item, index) in list"
          :key="item.sysyonghuid"
          class="archive-page__item"
          @tap="openArchive(item)"
        >
          <image
            class="archive-page__avatar"
            :src="avatarSrc(item, index)"
            mode="aspectFill"
          />
          <view class="archive-page__item-body">
            <view class="archive-page__item-row">
              <text class="archive-page__name">
                {{ maskName(item.xingming) }}
              </text>
              <text
                v-if="formatRole(item)"
                class="archive-page__role"
              >
                {{ formatRole(item) }}
              </text>
            </view>
            <text class="archive-page__org">
              {{ item.jigouming || '—' }}
            </text>
          </view>
          <image
            class="archive-page__arrow"
            src="/static/icons/arrow-right-gray.png"
            mode="aspectFit"
          />
        </view>

        <AppEmpty
          v-if="!loading && !list.length && !loadError"
          title="暂无档案"
          :description="activeKeyword ? '没有匹配的党员，换个关键词试试' : '本支部暂无党员档案'"
        />

        <view
          v-if="loading"
          class="archive-page__tip"
        >
          <text class="archive-page__tip-text">
            加载中…
          </text>
        </view>
        <view
          v-else-if="finished && list.length"
          class="archive-page__tip"
        >
          <text class="archive-page__tip-text">
            没有更多了
          </text>
        </view>
      </template>
    </view>

    <!-- 档案导出（接口未提供，仅提示） -->
    <view class="archive-page__footer">
      <AppButton
        class="archive-page__export"
        type="primary"
        size="large"
        @click="tipExport"
      >
        档案导出
      </AppButton>
    </view>
    <view class="archive-page__footer-placeholder" />
  </view>
</template>

<style lang="scss" scoped>
.archive-page {
  min-height: 100vh;
  background: $color-bg-page-alt;
}

// ---------------------------------------------------------------------------
// 头部
// ---------------------------------------------------------------------------
.archive-page__header {
  background: $color-primary;
  padding-bottom: $spacing-lg;
}

.archive-page__nav {
  @include flex-center;
  height: $comp-navbar-height;

  .archive-page__nav-title {
    font-size: $comp-navbar-title-size;
    font-weight: $font-weight-semibold;
    color: $comp-navbar-title-color;
  }
}

.archive-page__search-row {
  display: flex;
  align-items: center;
  padding: $spacing-xs $page-gutter 0;
}

.archive-page__search {
  display: flex;
  flex: 1;
  align-items: center;
  height: 72rpx;
  padding: 0 $spacing-lg;
  background: $color-bg-card;
  border-radius: $radius-full;
}

.archive-page__search-icon {
  width: 36rpx;
  height: 36rpx;
  flex-shrink: 0;
}

.archive-page__search-input {
  flex: 1;
  margin-left: $spacing-sm;
  font-size: $font-sm;
  color: $color-text-primary;
}

.archive-page__search-btn {
  @include flex-center;
  flex-shrink: 0;
  height: 72rpx;
  padding: 0 $spacing-xl;
  margin-left: $spacing-md;
  font-size: $font-sm;
  color: $color-primary;
  background: $color-bg-card;
  border-radius: $radius-full;
}

// ---------------------------------------------------------------------------
// 权限提示
// ---------------------------------------------------------------------------
.archive-page__notice {
  padding: $spacing-md $page-gutter;
  margin: $section-margin $page-gutter 0;
  background: $color-bg-warm;
  border-radius: $radius-sm;
  border: $comp-hairline-width solid $color-gold-light;
}

.archive-page__notice-text {
  font-size: $font-sm;
  color: $color-warning-text;
}

// ---------------------------------------------------------------------------
// 统计卡
// ---------------------------------------------------------------------------
.archive-page__stats {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-md;
  padding: $section-margin $page-gutter 0;
}

.archive-page__stat {
  position: relative;
  width: calc(50% - #{$spacing-md} / 2);
  overflow: hidden;
  border-radius: $radius-md;
}

.archive-page__stat-bg {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.archive-page__stat-body {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $spacing-lg 0;
}

.archive-page__stat-value {
  font-size: $font-xxl;
  font-weight: $font-weight-bold;
  font-family: $font-family-number;
  color: $color-primary;
}

.archive-page__stat-label {
  margin-top: $spacing-xs;
  font-size: $font-xs;
  color: $color-text-secondary;
}

// ---------------------------------------------------------------------------
// 列表
// ---------------------------------------------------------------------------
.archive-page__list {
  margin: $section-margin $page-gutter 0;
  padding: 0 $section-padding;
  background: $color-bg-card;
  border-radius: $radius-md;
}

.archive-page__item {
  display: flex;
  align-items: center;
  padding: $spacing-lg 0;
  border-bottom: $comp-hairline-width solid $color-border-light;

  &:last-of-type {
    border-bottom: none;
  }

  &:active {
    opacity: 0.85;
  }
}

.archive-page__avatar {
  width: $comp-avatar-size-sm;
  height: $comp-avatar-size-sm;
  flex-shrink: 0;
  background: $color-bg-tertiary;
  border-radius: $comp-avatar-radius;
}

.archive-page__item-body {
  flex: 1;
  margin-left: $spacing-md;
  min-width: 0;
}

.archive-page__item-row {
  display: flex;
  align-items: center;
}

.archive-page__name {
  font-size: $font-md;
  font-weight: $font-weight-semibold;
  color: $color-text-primary;
}

.archive-page__role {
  margin-left: $spacing-sm;
  font-size: $font-sm;
  color: $color-accent-amber;
}

.archive-page__org {
  display: block;
  margin-top: $spacing-xs;
  font-size: $font-sm;
  color: $color-text-secondary;
}

.archive-page__arrow {
  width: $comp-list-item-arrow-size;
  height: $comp-list-item-arrow-size;
}

.archive-page__tip {
  @include flex-center;
  padding: $spacing-lg 0;

  .archive-page__tip-text {
    font-size: $font-sm;
    color: $color-text-tertiary;
  }
}

.archive-page__error {
  padding: $spacing-xl 0;
}

.archive-page__retry {
  display: flex;
  width: 240rpx;
  margin: 0 auto;
}

// ---------------------------------------------------------------------------
// 底部导出
// ---------------------------------------------------------------------------
.archive-page__footer {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: $z-sticky;
  padding: $spacing-md $page-gutter;
  padding-bottom: calc(#{$spacing-md} + env(safe-area-inset-bottom));
  background: $color-bg-page-alt;
}

.archive-page__footer-placeholder {
  height: 140rpx;
}

.archive-page__export {
  width: 100%;
  border-radius: $comp-btn-fixed-radius;
}
</style>
