<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import AppEmpty from '@/components/AppEmpty/AppEmpty.vue';
import AppButton from '@/components/AppButton/AppButton.vue';
import { apiTuwenLeibie, apiTuwenLiebiao, resolveFileUrl, type TuwenCategory, type TuwenItem } from '@/api/modules/tuwen';
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

/** 专题宫格图标（装饰性静态图标，接口无对应字段） */
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
  const url = resolveFileUrl(item.ossdir, item.wenjianurl);
  return url || '/static/images/cover-greatwall.png';
}

function bannerSrc(item: TuwenItem): string {
  return resolveFileUrl(item.ossdir, item.wenjianurl);
}

function onThumbError(item: TuwenItem) {
  thumbError[item.settuwenid] = true;
}

function formatDate(riqi?: string | null): string {
  return riqi ? riqi.slice(0, 10) : '';
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
      apiTuwenLiebiao(TUWEN_CATEGORY.TOPIC, 1, 10),
    ]);

    const allCategories = categoryRes.list || [];
    // 党建专题专栏：专题学习（id=3）的子类别
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

function openTopic(cat: TuwenCategory) {
  uni.navigateTo({
    url: `/pages/topic/index?categoryId=${cat.settuwenleibieid}&title=${encodeURIComponent(cat.mingcheng)}`,
  });
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
    <!-- 红色渐变头部（prototype/首页.jpg 顶部） -->
    <view
      class="home-page__header"
      :style="{ paddingTop: `${statusBarHeight}px` }"
    >
      <view class="home-page__nav">
        <text class="home-page__nav-title">
          首页
        </text>
      </view>

      <!-- 搜索条 + VR基地入口 -->
      <view class="home-page__search-row">
        <view
          class="home-page__search"
          @tap="tip('搜索功能即将上线')"
        >
          <image
            class="home-page__search-icon"
            src="/static/icons/search-red.png"
            mode="aspectFit"
          />
          <text class="home-page__search-placeholder">
            请输入关键词
          </text>
        </view>
        <text
          class="home-page__vr"
          @tap="tip('VR基地暂未开放')"
        >
          VR基地
        </text>
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
          @tap="tip('内容详情即将上线')"
        >
          <image
            class="home-page__banner-img"
            :src="bannerSrc(item)"
            mode="aspectFill"
          />
        </swiper-item>
      </swiper>

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
              @tap="tip('内容详情即将上线')"
            >
              <image
                class="home-page__push-img"
                :src="thumbSrc(item)"
                mode="aspectFill"
                @error="onThumbError(item)"
              />
              <text class="home-page__push-tag">
                图文
              </text>
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

      <!-- 党建专题专栏（接口：tuwenleibie 专题学习子类别） -->
      <view
        v-if="topicCategories.length"
        class="home-page__section"
      >
        <view class="home-page__section-header">
          <text class="home-page__section-title">
            党建专题专栏
          </text>
        </view>
        <view class="home-page__topic-grid">
          <view
            v-for="cat in topicCategories"
            :key="cat.settuwenleibieid"
            class="home-page__topic-item"
            @tap="openTopic(cat)"
          >
            <view class="home-page__topic-icon-wrap">
              <image
                class="home-page__topic-icon"
                :src="topicIcon(cat.settuwenleibieid)"
                mode="aspectFit"
              />
            </view>
            <text class="home-page__topic-label">
              {{ cat.mingcheng }}
            </text>
          </view>
        </view>
      </view>

      <!-- 快捷服务（入口展示；对应功能未解锁，点击提示） -->
      <view class="home-page__quick">
        <view
          v-for="entry in quickEntries"
          :key="entry.key"
          class="home-page__quick-item"
          @tap="tip(entry.tip)"
        >
          <image
            class="home-page__quick-icon"
            :src="entry.icon"
            mode="aspectFit"
          />
          <text class="home-page__quick-label">
            {{ entry.label }}
          </text>
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
            @tap="tip('内容详情即将上线')"
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
                  {{ formatDate(item.riqi) }}
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

.home-page__header {
  background: $color-primary-gradient;
  padding-bottom: $spacing-lg;
}

.home-page__nav {
  display: flex;
  align-items: center;
  justify-content: center;
  height: $comp-navbar-height;

  .home-page__nav-title {
    font-size: $comp-navbar-title-size;
    font-weight: $font-weight-semibold;
    color: $comp-navbar-title-color;
  }
}

.home-page__search-row {
  display: flex;
  align-items: center;
  padding: 0 $page-gutter;

  .home-page__search {
    display: flex;
    flex: 1;
    align-items: center;
    height: 72rpx;
    padding: 0 $spacing-lg;
    background: $color-bg-card;
    border-radius: $radius-full;
  }

  .home-page__search-icon {
    width: 36rpx;
    height: 36rpx;
  }

  .home-page__search-placeholder {
    margin-left: $spacing-sm;
    font-size: $font-sm;
    color: $color-text-placeholder;
  }

  .home-page__vr {
    margin-left: $spacing-lg;
    font-size: $font-md;
    font-weight: $font-weight-semibold;
    color: $color-text-inverse;
  }
}

.home-page__banner {
  height: 340rpx;
  margin: $spacing-lg $page-gutter 0;
  border-radius: $radius-md;
  overflow: hidden;

  .home-page__banner-img {
    width: 100%;
    height: 100%;
  }
}

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

.home-page__push-scroll {
  width: 100%;
  white-space: nowrap;
}

.home-page__push-row {
  display: inline-flex;
  gap: $spacing-md;
}

.home-page__push-card {
  position: relative;
  width: 240rpx;
  flex-shrink: 0;

  .home-page__push-img {
    width: 240rpx;
    height: 150rpx;
    border-radius: $radius-sm;
    background: $color-bg-tertiary;
  }

  .home-page__push-tag {
    position: absolute;
    top: $spacing-sm;
    left: $spacing-sm;
    padding: 2rpx $spacing-sm;
    font-size: $font-xs;
    color: $color-text-inverse;
    background: $color-primary;
    border-radius: $radius-xs;
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
}

.home-page__topic-grid {
  display: flex;
  flex-wrap: wrap;

  .home-page__topic-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 33.3333%;
    margin-bottom: $spacing-lg;
  }

  .home-page__topic-icon-wrap {
    @include flex-center;
    width: $comp-grid-icon-size;
    height: $comp-grid-icon-size;
    background: $color-primary-soft;
    border-radius: $comp-grid-icon-radius;
  }

  .home-page__topic-icon {
    width: 48rpx;
    height: 48rpx;
  }

  .home-page__topic-label {
    margin-top: $comp-grid-label-gap;
    font-size: $comp-grid-label-size;
    color: $color-text-primary;
  }
}

.home-page__quick {
  display: flex;
  flex-wrap: wrap;
  margin: $section-margin $page-gutter 0;
  padding: $section-padding 0;
  background: $color-primary;
  border-radius: $radius-md;

  .home-page__quick-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 25%;
  }

  .home-page__quick-icon {
    width: 56rpx;
    height: 56rpx;
  }

  .home-page__quick-label {
    margin-top: $comp-grid-label-gap;
    font-size: $comp-grid-label-size;
    color: $color-text-inverse;
  }
}

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
    height: 340rpx;
    margin: $spacing-lg $page-gutter 0;
    border-radius: $radius-md;
  }

  &--card {
    width: 240rpx;
    height: 150rpx;
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
