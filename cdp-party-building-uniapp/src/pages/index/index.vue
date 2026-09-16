<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import AppEmpty from '@/components/AppEmpty/AppEmpty.vue';
import AppButton from '@/components/AppButton/AppButton.vue';
import {
  apiTuwenFuliebiao,
  apiTuwenLeibie,
  apiTuwenLiebiao,
  envelopeOssdir,
  resolveFileUrl,
  type TuwenCategory,
  type TuwenItem,
} from '@/api/modules/tuwen';
import { TUWEN_CATEGORY } from '@/constants/api';
import { requireLogin } from '@/services/auth.service';

// ---------------------------------------------------------------------------
// 状态
// ---------------------------------------------------------------------------
const statusBarHeight = ref(uni.getSystemInfoSync().statusBarHeight || 0);

const loading = ref(true);
const loadError = ref('');

const banners = ref<TuwenItem[]>([]);
const aiPushItems = ref<TuwenItem[]>([]);
const latestItems = ref<TuwenItem[]>([]);
const topicCategories = ref<TuwenCategory[]>([]);
/**
 * 文件前缀：列表接口的 `list` 项不含 ossdir，前缀只在 `obj.ossdir` 里（2026-09-16 实测），
 * 漏取会拼出 `/tuwen/x.png` → 404，图片全部落到静态兜底图（不变式 4）。
 */
const ossdir = ref('');

/** 专题宫格图标（装饰性静态图标，图标自带底色，容器不再加背景） */
const TOPIC_ICONS: Record<number, string> = {
  4: '/static/icons/study-book.png',
  5: '/static/icons/party-flag.png',
  6: '/static/icons/party-emblem.png',
  7: '/static/icons/education-cap.png',
  8: '/static/icons/knowledge-doc-blue.png',
  9: '/static/icons/notice-doc-red.png',
};

function topicIcon(id: number): string {
  return TOPIC_ICONS[id] || '/static/icons/party-emblem.png';
}

/** 缩略图错误兜底（不变式 9：接口值优先，失败才落静态兜底图） */
const thumbError = reactive<Record<number, boolean>>({});

function thumbSrc(item: TuwenItem): string {
  if (thumbError[item.settuwenid]) {
    return '/static/images/cover-greatwall.png';
  }
  const url = resolveFileUrl(ossdir.value, item.wenjianurl);
  return url || '/static/images/cover-greatwall.png';
}

function bannerSrc(item: TuwenItem): string {
  return resolveFileUrl(ossdir.value, item.wenjianurl);
}

function onThumbError(item: TuwenItem) {
  thumbError[item.settuwenid] = true;
}

function formatDate(riqi?: string | null): string {
  return riqi ? riqi.slice(0, 10) : '';
}

function formatReads(dianjishu?: number | null): string {
  return `${dianjishu || 0}阅读`;
}

// ---------------------------------------------------------------------------
// 数据加载（apituwen/tuwenleibie + tuwenliebiao，全部需用户 token）
// ---------------------------------------------------------------------------
async function loadData() {
  loading.value = true;
  loadError.value = '';
  try {
    const [categoryRes, bannerRes, aiRes, latestRes] = await Promise.all([
      apiTuwenLeibie(),
      apiTuwenLiebiao(TUWEN_CATEGORY.BANNER, 1, 5),
      apiTuwenLiebiao(TUWEN_CATEGORY.AI_PUSH, 1, 6),
      // 最新内容取「专题学习」父类别下全部子类图文（实测类别 3 自身无直接图文）
      apiTuwenFuliebiao(TUWEN_CATEGORY.TOPIC, 1, 10),
    ]);

    ossdir.value = envelopeOssdir(bannerRes) || envelopeOssdir(aiRes) || envelopeOssdir(latestRes);

    const allCategories = categoryRes.list || [];
    // 专题学习宫格：专题学习（id=3）的子类别
    topicCategories.value = allCategories.filter((c) => c.shangjiiid === TUWEN_CATEGORY.TOPIC);
    banners.value = bannerRes.list || [];
    aiPushItems.value = (aiRes.list || []).filter((it) => resolveFileUrl(it.ossdir, it.wenjianurl));
    latestItems.value = latestRes.list || [];
  } catch (err) {
    loadError.value = (err as Error).message || '加载失败';
  } finally {
    loading.value = false;
  }
}

function retry() {
  loadData();
}

onShow(() => {
  if (!requireLogin()) return;
  if (!banners.value.length && !latestItems.value.length) {
    loadData();
  }
});

// ---------------------------------------------------------------------------
// 交互（详情/搜索/更多属于后续功能批次，统一提示，不 mock 跳转）
// ---------------------------------------------------------------------------
function tip(title: string) {
  uni.showToast({ title, icon: 'none' });
}

/** 搜索：跳 AI 学习页（其搜索框走 apituwen biaoti 模糊搜索，真实可用） */
function goSearch() {
  uni.switchTab({ url: '/pages/ai/index' });
}

function openTopic(cat: TuwenCategory) {
  uni.navigateTo({
    url: `/pages/topic/index?categoryId=${cat.settuwenleibieid}&title=${encodeURIComponent(cat.mingcheng)}`,
  });
}

/** 内容详情（feat-008）：tuwenleibieid 必须是图文真实类别，否则详情接口返回残缺对象 */
function openDetail(item: TuwenItem) {
  const leibieid = item.settuwenleibieid || 0;
  if (!leibieid) {
    uni.showToast({ title: '内容信息不完整', icon: 'none' });
    return;
  }
  const query = [
    `tuwenid=${item.settuwenid}`,
    `tuwenleibieid=${leibieid}`,
    `biaoti=${encodeURIComponent(item.biaoti || '')}`,
    `ossdir=${encodeURIComponent(ossdir.value)}`,
    `riqi=${encodeURIComponent(item.riqi || '')}`,
  ].join('&');
  uni.navigateTo({ url: `/pages/detail/index?${query}` });
}

const quickEntries = [
  { key: 'activity', label: '活动报名', icon: '/static/icons/activity-signup-red.png', tip: '活动报名签到暂未开放' },
  { key: 'report', label: '思想汇报', icon: '/static/icons/thought-report-red.png', tip: '思想汇报暂未开放' },
  { key: 'notice', label: '通知公告', icon: '/static/icons/notice-plane-orange.png', tip: '通知公告即将上线' },
  { key: 'know', label: '应知应会', icon: '/static/icons/manual-book-green.png', tip: '应知应会暂未开放' },
];

const hasContent = computed(
  () => banners.value.length > 0 || aiPushItems.value.length > 0 || latestItems.value.length > 0,
);
</script>

<template>
  <view class="home-page">
    <!-- 顶部：红渐变底图（bg-header-red）铺满 导航+搜索+轮播 整个区域 -->
    <view class="home-page__top">
      <image
        class="home-page__top-bg"
        src="/static/images/bg-header-red.png"
        mode="aspectFill"
      />
      <view class="home-page__top-body">
        <view
          class="home-page__nav"
          :style="{ paddingTop: `${statusBarHeight}px` }"
        >
          <text class="home-page__nav-title">
            首页
          </text>
        </view>

        <!-- 搜索条（白底胶囊 + 红色搜索按钮） + VR基地入口 -->
        <view class="home-page__search-row">
          <view
            class="home-page__search"
            @tap="goSearch"
          >
            <image
              class="home-page__search-icon"
              src="/static/icons/search-red.png"
              mode="aspectFit"
            />
            <text class="home-page__search-placeholder">
              输入或说出党建问题
            </text>
            <view class="home-page__search-btn">
              搜索
            </view>
          </view>
          <text
            class="home-page__vr"
            @tap="tip('VR基地暂未开放')"
          >
            VR基地
          </text>
        </view>

        <!-- 轮播图（接口：tuwenliebiao 类别=轮播图；缩略图接口值优先） -->
        <view
          v-if="loading"
          class="home-page__skeleton home-page__skeleton--banner"
        />
        <swiper
          v-else-if="banners.length"
          class="home-page__banner"
          circular
          autoplay
          :interval="4000"
          :duration="500"
        >
          <swiper-item
            v-for="item in banners"
            :key="item.settuwenid"
            @tap="openDetail(item)"
          >
            <image
              class="home-page__banner-img"
              :src="bannerSrc(item)"
              mode="aspectFill"
            />
          </swiper-item>
        </swiper>
        <view
          v-else
          class="home-page__banner home-page__banner--fallback"
          @tap="tip('暂无内容')"
        >
          <image
            class="home-page__banner-img"
            src="/static/images/banner-party-history.png"
            mode="aspectFill"
          />
        </view>
      </view>
    </view>

    <!-- 加载失败 -->
    <view
      v-if="loadError && !loading"
      class="home-page__error"
    >
      <AppEmpty
        title="加载失败"
        :description="loadError"
      />
      <AppButton
        class="home-page__retry"
        type="primary"
        @click="retry"
      >
        重新加载
      </AppButton>
    </view>

    <template v-else>
      <!-- AI智能推送（接口：tuwenliebiao 类别=人工智能推送） -->
      <view class="home-page__section">
        <view class="home-page__section-header">
          <text class="home-page__section-title">
            AI智能推送
          </text>
          <text
            class="home-page__section-more"
            @tap="tip('更多内容即将上线')"
          >
            更多 ›
          </text>
        </view>

        <view
          v-if="loading"
          class="home-page__skeleton-row"
        >
          <view class="home-page__skeleton home-page__skeleton--card" />
          <view class="home-page__skeleton home-page__skeleton--card" />
          <view class="home-page__skeleton home-page__skeleton--card" />
        </view>
        <scroll-view
          v-else-if="aiPushItems.length"
          class="home-page__push-scroll"
          scroll-x
          :show-scrollbar="false"
        >
          <view class="home-page__push-row">
            <view
              v-for="item in aiPushItems"
              :key="item.settuwenid"
              class="home-page__push-card"
              @tap="openDetail(item)"
            >
              <view class="home-page__push-cover">
                <image
                  class="home-page__push-img"
                  :src="thumbSrc(item)"
                  mode="aspectFill"
                  @error="onThumbError(item)"
                />
                <text class="home-page__push-tag">
                  图文
                </text>
              </view>
              <text class="home-page__push-title">
                {{ item.biaoti }}
              </text>
            </view>
          </view>
        </scroll-view>
        <AppEmpty
          v-else
          title="暂无推送内容"
          description="去看看其他内容吧"
        />
      </view>

      <!-- 专题学习（接口：tuwenleibie 专题学习子类别；图标自带底色，容器无背景） -->
      <view
        v-if="topicCategories.length"
        class="home-page__section"
      >
        <view class="home-page__section-header">
          <text class="home-page__section-title">
            专题学习
          </text>
          <text
            class="home-page__section-more"
            @tap="tip('更多内容即将上线')"
          >
            更多 ›
          </text>
        </view>
        <view class="home-page__topic-grid">
          <view
            v-for="cat in topicCategories"
            :key="cat.settuwenleibieid"
            class="home-page__topic-item"
            @tap="openTopic(cat)"
          >
            <image
              class="home-page__topic-icon"
              :src="topicIcon(cat.settuwenleibieid)"
              mode="aspectFit"
            />
            <text class="home-page__topic-label">
              {{ cat.mingcheng }}
            </text>
          </view>
        </view>
      </view>

      <!-- 快捷服务（红渐变大卡 + 2x2 白色子卡；背景 bg-card-tiananmen） -->
      <view class="home-page__quick">
        <image
          class="home-page__quick-bg"
          src="/static/images/bg-card-tiananmen.png"
          mode="aspectFill"
        />
        <view class="home-page__quick-body">
          <text class="home-page__quick-title">
            快捷服务
          </text>
          <view class="home-page__quick-grid">
            <view
              v-for="entry in quickEntries"
              :key="entry.key"
              class="home-page__quick-item"
              @tap="tip(entry.tip)"
            >
              <text class="home-page__quick-label">
                {{ entry.label }}
              </text>
              <image
                class="home-page__quick-icon"
                :src="entry.icon"
                mode="aspectFit"
              />
            </view>
          </view>
        </view>
      </view>

      <!-- 最新内容（接口：tuwenliebiao 类别=专题学习） -->
      <view class="home-page__section home-page__section--last">
        <view class="home-page__section-header">
          <text class="home-page__section-title">
            最新内容
          </text>
          <text
            class="home-page__section-more"
            @tap="tip('更多内容即将上线')"
          >
            更多 ›
          </text>
        </view>

        <view
          v-if="loading"
          class="home-page__skeleton home-page__skeleton--row"
        />
        <template v-else-if="latestItems.length">
          <view
            v-for="item in latestItems"
            :key="item.settuwenid"
            class="home-page__list-item"
            @tap="openDetail(item)"
          >
            <image
              class="home-page__list-thumb"
              :src="thumbSrc(item)"
              mode="aspectFill"
              @error="onThumbError(item)"
            />
            <view class="home-page__list-body">
              <text class="home-page__list-title">
                {{ item.biaoti }}
              </text>
              <text
                v-if="item.zhaiyao"
                class="home-page__list-summary"
              >
                {{ item.zhaiyao }}
              </text>
              <view class="home-page__list-meta">
                <text class="home-page__list-tag">
                  图文
                </text>
                <text class="home-page__list-date">
                  {{ formatDate(item.riqi) }} {{ formatReads(item.dianjishu) }}
                </text>
              </view>
            </view>
          </view>
        </template>
        <AppEmpty
          v-else
          title="暂无内容"
          description="去看看其他内容吧"
        />
      </view>

      <!-- 全空兜底 -->
      <AppEmpty
        v-if="!loading && !hasContent && !loadError"
        title="暂无数据"
        description="内容正在建设中"
      />
    </template>

    <view class="safe-area-bottom" />
  </view>
</template>

<style lang="scss" scoped>
.home-page {
  min-height: 100vh;
  background: $color-bg-page;
  padding-bottom: $spacing-2xl;
}

// ---------------------------------------------------------------------------
// 顶部：红渐变底图 + 导航 + 搜索 + 轮播
// ---------------------------------------------------------------------------
.home-page__top {
  position: relative;
}

.home-page__top-bg {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.home-page__top-body {
  position: relative;
  z-index: 1;
  padding-bottom: $spacing-lg;
}

.home-page__nav {
  @include flex-center;
  height: $comp-navbar-height;
  box-sizing: border-box;

  .home-page__nav-title {
    font-size: $comp-navbar-title-size;
    font-weight: $font-weight-semibold;
    color: $comp-navbar-title-color;
  }
}

.home-page__search-row {
  display: flex;
  align-items: center;
  padding: $spacing-xs $page-gutter 0;

  .home-page__search {
    display: flex;
    flex: 1;
    align-items: center;
    height: 72rpx;
    padding: 0 8rpx 0 $spacing-lg;
    background: $color-bg-card;
    border-radius: $radius-full;
  }

  .home-page__search-icon {
    width: 36rpx;
    height: 36rpx;
    flex-shrink: 0;
  }

  .home-page__search-placeholder {
    flex: 1;
    margin-left: $spacing-sm;
    overflow: hidden;
    font-size: $font-sm;
    color: $color-text-placeholder;
    white-space: nowrap;
  }

  .home-page__search-btn {
    @include flex-center;
    flex-shrink: 0;
    height: 58rpx;
    padding: 0 $spacing-lg;
    margin-left: $spacing-sm;
    font-size: $font-sm;
    color: $color-text-inverse;
    background: $color-primary;
    border-radius: $radius-full;
  }

  .home-page__vr {
    margin-left: $spacing-lg;
    font-size: $font-md;
    font-weight: $font-weight-semibold;
    color: $color-text-inverse;
  }
}

.home-page__banner {
  height: 400rpx;
  margin: $spacing-lg $page-gutter 0;
  border-radius: $radius-md;
  overflow: hidden;

  &--fallback {
    // 接口无轮播数据时的兜底静态 Banner（不变式 9：仅兜底）
  }

  .home-page__banner-img {
    width: 100%;
    height: 100%;
  }
}

// ---------------------------------------------------------------------------
// 通用白色区块
// ---------------------------------------------------------------------------
.home-page__section {
  margin: $section-margin $page-gutter 0;
  padding: $section-padding;
  background: $color-bg-card;
  border-radius: $radius-md;

  &--last {
    margin-bottom: 0;
  }
}

.home-page__section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $spacing-lg;

  .home-page__section-title {
    font-size: $font-lg;
    font-weight: $font-weight-semibold;
    color: $color-text-primary;
  }

  .home-page__section-more {
    font-size: $font-sm;
    color: $color-text-tertiary;
  }
}

// ---------------------------------------------------------------------------
// AI智能推送
// ---------------------------------------------------------------------------
.home-page__push-scroll {
  width: 100%;
  white-space: nowrap;
}

.home-page__push-row {
  display: inline-flex;
  gap: $spacing-md;
}

.home-page__push-card {
  width: 216rpx;
  flex-shrink: 0;
}

.home-page__push-cover {
  position: relative;
  width: 216rpx;
  height: 256rpx;
  border-radius: $radius-sm;
  overflow: hidden;

  .home-page__push-img {
    width: 100%;
    height: 100%;
    background: $color-bg-tertiary;
  }

  .home-page__push-tag {
    position: absolute;
    right: $spacing-sm;
    bottom: $spacing-sm;
    padding: 2rpx $spacing-sm;
    font-size: $font-xs;
    color: $color-text-inverse;
    background: $color-primary;
    border-radius: $radius-xs;
  }
}

.home-page__push-title {
  display: block;
  margin-top: $spacing-sm;
  font-size: $font-sm;
  line-height: $line-height-normal;
  color: $color-text-primary;
  @include multi-ellipsis(2);
  white-space: normal;
}

// ---------------------------------------------------------------------------
// 专题学习宫格（图标自带底色，直接渲染）
// ---------------------------------------------------------------------------
.home-page__topic-grid {
  display: flex;
  flex-wrap: wrap;

  .home-page__topic-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 33.3333%;
    margin-bottom: $spacing-lg;

    &:nth-last-child(-n + 3) {
      margin-bottom: 0;
    }
  }

  .home-page__topic-icon {
    width: 104rpx;
    height: 104rpx;
  }

  .home-page__topic-label {
    margin-top: $comp-grid-label-gap;
    font-size: $comp-grid-label-size;
    color: $color-text-primary;
  }
}

// ---------------------------------------------------------------------------
// 快捷服务：红渐变大卡（bg-card-tiananmen 底图）+ 2x2 白色子卡
// ---------------------------------------------------------------------------
.home-page__quick {
  position: relative;
  margin: $section-margin $page-gutter 0;
  border-radius: $radius-md;
  overflow: hidden;

  .home-page__quick-bg {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  .home-page__quick-body {
    position: relative;
    z-index: 1;
    padding: $spacing-lg;
  }

  .home-page__quick-title {
    display: block;
    margin-bottom: $spacing-md;
    font-size: $font-lg;
    font-weight: $font-weight-semibold;
    color: $color-text-inverse;
  }

  .home-page__quick-grid {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-md;
  }

  .home-page__quick-item {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: space-between;
    min-width: calc(50% - #{$spacing-md});
    padding: $spacing-md $spacing-lg;
    background: $color-bg-card;
    border-radius: $radius-sm;

    &:active {
      opacity: 0.85;
    }
  }

  .home-page__quick-label {
    font-size: $font-md;
    font-weight: $font-weight-medium;
    color: $color-text-primary;
  }

  .home-page__quick-icon {
    width: 68rpx;
    height: 68rpx;
    flex-shrink: 0;
  }
}

// ---------------------------------------------------------------------------
// 最新内容列表
// ---------------------------------------------------------------------------
.home-page__list-item {
  display: flex;
  padding: $spacing-md 0;
  border-bottom: $comp-hairline-width solid $color-border-light;

  &:last-child {
    border-bottom: none;
  }

  &:active {
    opacity: 0.8;
  }
}

.home-page__list-thumb {
  width: 200rpx;
  height: 140rpx;
  flex-shrink: 0;
  border-radius: $radius-sm;
  background: $color-bg-tertiary;
}

.home-page__list-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: space-between;
  margin-left: $spacing-md;
  min-width: 0;
}

.home-page__list-title {
  font-size: $font-md;
  font-weight: $font-weight-medium;
  line-height: $line-height-tight;
  color: $color-text-primary;
  @include multi-ellipsis(2);
}

.home-page__list-summary {
  margin-top: $spacing-xs;
  font-size: $font-sm;
  color: $color-text-secondary;
  @include text-ellipsis;
}

.home-page__list-meta {
  display: flex;
  align-items: center;
  margin-top: $spacing-xs;

  .home-page__list-tag {
    padding: 2rpx $spacing-sm;
    font-size: $font-xs;
    color: $color-primary;
    background: $color-primary-soft;
    border-radius: $radius-xs;
  }

  .home-page__list-date {
    margin-left: $spacing-sm;
    font-size: $font-xs;
    color: $color-text-tertiary;
  }
}

// ---------------------------------------------------------------------------
// 错误 / 骨架屏
// ---------------------------------------------------------------------------
.home-page__error {
  padding-top: $spacing-3xl;
}

.home-page__retry {
  display: flex;
  width: 240rpx;
  margin: 0 auto;
}

.home-page__skeleton {
  background: $color-bg-tertiary;
  border-radius: $radius-sm;
  overflow: hidden;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: -100%;
    bottom: 0;
    left: 0;
    width: 100%;
    background: $color-bg-card;
    opacity: 0.6;
    animation: anim-shimmer 1.2s $ease-in-out infinite;
  }

  &--banner {
    height: 400rpx;
    margin: $spacing-lg $page-gutter 0;
    border-radius: $radius-md;
  }

  &--card {
    width: 216rpx;
    height: 256rpx;
  }

  &--row {
    height: 140rpx;
  }
}

.home-page__skeleton-row {
  display: flex;
  gap: $spacing-md;
}
</style>
