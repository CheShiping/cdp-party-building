<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import AppEmpty from '@/components/AppEmpty/AppEmpty.vue';
import AppButton from '@/components/AppButton/AppButton.vue';
import {
  apiTuwenLiebiao,
  envelopeOssdir,
  resolveFileUrl,
  type TuwenItem,
} from '@/api/modules/tuwen';
import { LIUYAN_LEIXING } from '@/api/modules/liuyan';
import { TUWEN_CATEGORY } from '@/constants/api';
import { requireLogin } from '@/services/auth.service';

/**
 * 党员服务（feat-010，prototype/党员服务.jpg）。
 * - 宫格 5 项：活动报名 / 党员交流（留言）/ 通知公告（图文列表）/ 思想会地 / 意见反馈
 * - 活动报名（feat-009）、思想汇报、意见反馈：接口文档无对应接口 → 暂不实现，点击仅提示
 * - 「近期活动」走 apituwen 类别「最新活动」（有接口，只读展示；报名能力未开放）
 */
const statusBarHeight = ref(uni.getSystemInfoSync().statusBarHeight || 0);

const loading = ref(true);
const loadError = ref('');
const activities = ref<TuwenItem[]>([]);
const ossdir = ref('');
const thumbError = reactive<Record<number, boolean>>({});

const gridEntries = [
  {
    key: 'activity',
    label: '活动报名',
    icon: '/static/icons/activity-signup-red.png',
    tip: '活动报名与签到暂未开放',
  },
  {
    key: 'exchange',
    label: '党员交流',
    icon: '/static/icons/member-chat-purple.png',
    tip: '',
  },
  {
    key: 'notice',
    label: '通知公告',
    icon: '/static/icons/notice-plane-orange.png',
    tip: '',
  },
  {
    key: 'report',
    label: '思想会地',
    icon: '/static/icons/thought-report-red.png',
    tip: '思想汇报暂未开放',
  },
  {
    key: 'feedback',
    label: '意见反馈',
    icon: '/static/icons/feedback-chat-blue.png',
    tip: '意见建议反馈暂未开放',
  },
];

function tipNotOpen() {
  uni.showToast({ title: '活动报名与签到暂未开放', icon: 'none' });
}

function onGridTap(entry: (typeof gridEntries)[number]) {
  if (entry.key === 'exchange') {
    uni.navigateTo({
      url: `/pages/message/index?leixing=${LIUYAN_LEIXING.EXCHANGE}&title=${encodeURIComponent('党员交流')}`,
    });
    return;
  }
  if (entry.key === 'notice') {
    uni.navigateTo({
      url: `/pages/topic/index?categoryId=${TUWEN_CATEGORY.NOTICE}&title=${encodeURIComponent('通知公告')}`,
    });
    return;
  }
  uni.showToast({ title: entry.tip, icon: 'none' });
}

function thumbSrc(item: TuwenItem): string {
  if (thumbError[item.settuwenid]) return '/static/images/cover-tech-focus.png';
  return resolveFileUrl(ossdir.value, item.wenjianurl) || '/static/images/cover-tech-focus.png';
}

function onThumbError(item: TuwenItem) {
  thumbError[item.settuwenid] = true;
}

function formatDate(riqi?: string | null): string {
  return riqi ? riqi.slice(0, 10) : '';
}

const hasActivities = computed(() => activities.value.length > 0);

async function loadActivities() {
  loading.value = true;
  loadError.value = '';
  try {
    const res = await apiTuwenLiebiao(TUWEN_CATEGORY.ACTIVITY, 1, 5);
    ossdir.value = envelopeOssdir(res) || ossdir.value;
    activities.value = res.list || [];
  } catch (err) {
    loadError.value = (err as Error).message || '加载失败';
  } finally {
    loading.value = false;
  }
}

function retry() {
  loadActivities();
}

function openDetail(item: TuwenItem) {
  const leibieid = item.settuwenleibieid || TUWEN_CATEGORY.ACTIVITY;
  const query = [
    `tuwenid=${item.settuwenid}`,
    `tuwenleibieid=${leibieid}`,
    `biaoti=${encodeURIComponent(item.biaoti || '')}`,
    `ossdir=${encodeURIComponent(ossdir.value)}`,
    `riqi=${encodeURIComponent(item.riqi || '')}`,
  ].join('&');
  uni.navigateTo({ url: `/pages/detail/index?${query}` });
}

onShow(() => {
  if (!requireLogin()) return;
  if (!activities.value.length) loadActivities();
});
</script>

<template>
  <view class="service-page">
    <!-- 红底头部（prototype/党员服务.jpg @0–180） -->
    <view
      class="service-page__header"
      :style="{ paddingTop: `${statusBarHeight}px` }"
    >
      <view class="service-page__nav">
        <text class="service-page__nav-title">
          党员服务
        </text>
      </view>
    </view>

    <!-- 功能宫格（5 项） -->
    <view class="service-page__grid-card">
      <view class="service-page__grid">
        <view
          v-for="entry in gridEntries"
          :key="entry.key"
          class="service-page__grid-item"
          @tap="onGridTap(entry)"
        >
          <image
            class="service-page__grid-icon"
            :src="entry.icon"
            mode="aspectFit"
          />
          <text class="service-page__grid-label">
            {{ entry.label }}
          </text>
        </view>
      </view>
    </view>

    <!-- 近期活动（apituwen 类别「最新活动」；活动报名签到暂未实现） -->
    <view class="service-page__section">
      <view class="service-page__section-header">
        <text class="service-page__section-title">
          近期活动
        </text>
        <text
          class="service-page__section-note"
          @tap="tipNotOpen"
        >
          报名暂未开放
        </text>
      </view>

      <view
        v-if="loading"
        class="service-page__skeleton"
      >
        <view class="service-page__skeleton-line" />
        <view class="service-page__skeleton-line service-page__skeleton-line--short" />
      </view>

      <view
        v-else-if="loadError"
        class="service-page__error"
      >
        <AppEmpty
          title="加载失败"
          :description="loadError"
        />
        <AppButton
          class="service-page__retry"
          type="primary"
          size="small"
          @click="retry"
        >
          重新加载
        </AppButton>
      </view>

      <!-- 活动卡（原型样式：封面 + 标签 + 标题 + 摘要 + 日期 + 报名按钮） -->
      <template v-else-if="hasActivities">
        <view
          v-for="item in activities"
          :key="item.settuwenid"
          class="service-page__activity"
          @tap="openDetail(item)"
        >
          <image
            class="service-page__activity-cover"
            :src="thumbSrc(item)"
            mode="aspectFill"
            @error="onThumbError(item)"
          />
          <view class="service-page__activity-body">
            <view class="service-page__activity-head">
              <text class="service-page__activity-tag">
                活动
              </text>
              <text class="service-page__activity-title">
                {{ item.biaoti }}
              </text>
            </view>
            <text
              v-if="item.zhaiyao"
              class="service-page__activity-summary"
            >
              {{ item.zhaiyao }}
            </text>
            <view class="service-page__activity-foot">
              <text class="service-page__activity-date">
                {{ formatDate(item.riqi) }}
              </text>
              <view
                class="service-page__activity-btn"
                @tap.stop="tipNotOpen"
              >
                报名
              </view>
            </view>
          </view>
        </view>
      </template>

      <AppEmpty
        v-else
        title="暂无活动"
        description="活动报名与签到暂未开放"
      />
    </view>

    <view class="safe-area-bottom" />
  </view>
</template>

<style lang="scss" scoped>
.service-page {
  min-height: 100vh;
  background: $color-bg-page-alt;
}

.service-page__header {
  background: $color-primary;
}

.service-page__nav {
  @include flex-center;
  height: $comp-navbar-height;

  .service-page__nav-title {
    font-size: $comp-navbar-title-size;
    font-weight: $font-weight-semibold;
    color: $comp-navbar-title-color;
  }
}

.service-page__grid-card {
  margin: -$spacing-3xl $page-gutter 0;
  padding: $section-padding;
  background: $color-bg-card;
  border-radius: $radius-md;
  box-shadow: $shadow-2;
  position: relative;
  z-index: 1;
}

.service-page__grid {
  display: flex;
  flex-wrap: wrap;
}

.service-page__grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 33.3333%;
  padding: $spacing-md 0;

  &:active {
    opacity: 0.8;
  }
}

.service-page__grid-icon {
  width: 88rpx;
  height: 88rpx;
}

.service-page__grid-label {
  margin-top: $comp-grid-label-gap;
  font-size: $comp-grid-label-size;
  color: $color-text-primary;
}

.service-page__section {
  margin: $section-margin $page-gutter 0;
  padding: $section-padding;
  background: $color-bg-card;
  border-radius: $radius-md;
}

.service-page__section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $spacing-lg;

  .service-page__section-title {
    font-size: $font-lg;
    font-weight: $font-weight-semibold;
    color: $color-text-primary;
  }

  .service-page__section-note {
    font-size: $font-sm;
    color: $color-text-secondary;
  }
}

.service-page__activity {
  margin-bottom: $section-margin;
  overflow: hidden;
  background: $color-bg-page;
  border-radius: $radius-sm;

  &:last-child {
    margin-bottom: 0;
  }

  &:active {
    opacity: 0.9;
  }
}

.service-page__activity-cover {
  display: block;
  width: 100%;
  height: 240rpx;
  background: $color-bg-tertiary;
}

.service-page__activity-body {
  padding: $spacing-md;
}

.service-page__activity-head {
  display: flex;
  align-items: center;
}

.service-page__activity-tag {
  flex-shrink: 0;
  padding: 2rpx $spacing-sm;
  font-size: $font-xs;
  color: $color-primary;
  background: $color-primary-soft;
  border-radius: $radius-xs;
}

.service-page__activity-title {
  flex: 1;
  margin-left: $spacing-sm;
  font-size: $font-md;
  font-weight: $font-weight-semibold;
  color: $color-text-primary;
  @include text-ellipsis;
}

.service-page__activity-summary {
  display: block;
  margin-top: $spacing-xs;
  font-size: $font-sm;
  line-height: $line-height-normal;
  color: $color-text-secondary;
  @include multi-ellipsis(2);
}

.service-page__activity-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: $spacing-md;
}

.service-page__activity-date {
  font-size: $font-sm;
  color: $color-text-secondary;
}

.service-page__activity-btn {
  @include flex-center;
  height: 56rpx;
  padding: 0 $spacing-lg;
  font-size: $font-sm;
  color: $color-text-inverse;
  background: $color-primary;
  border-radius: $radius-full;
}

.service-page__skeleton {
  padding: $spacing-md 0;
}

.service-page__skeleton-line {
  height: $comp-skeleton-row-height;
  margin-bottom: $comp-skeleton-row-gap;
  background: $color-bg-tertiary;
  border-radius: $comp-skeleton-row-radius;

  &--short {
    width: 60%;
  }
}

.service-page__error {
  padding-top: $spacing-xl;
}

.service-page__retry {
  display: flex;
  width: 240rpx;
  margin: 0 auto;
}
</style>
