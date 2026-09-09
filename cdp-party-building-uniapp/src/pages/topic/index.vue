<script setup lang="ts">
import { reactive, ref } from 'vue';
import { onLoad, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
import AppEmpty from '@/components/AppEmpty/AppEmpty.vue';
import AppButton from '@/components/AppButton/AppButton.vue';
import { apiTuwenLiebiao, resolveFileUrl, type TuwenItem } from '@/api/modules/tuwen';
import { requireLogin } from '@/services/auth.service';

const categoryId = ref(0);
const pageTitle = ref('专题专栏');

const list = ref<TuwenItem[]>([]);
const page = ref(1);
const pageSize = 10;
const finished = ref(false);
const loading = ref(false);
const loadError = ref('');

const thumbError = reactive<Record<number, boolean>>({});

function thumbSrc(item: TuwenItem): string {
  if (thumbError[item.settuwenid]) {
    return '/static/images/cover-greatwall.png';
  }
  return resolveFileUrl(item.ossdir, item.wenjianurl) || '/static/images/cover-greatwall.png';
}

function onThumbError(item: TuwenItem) {
  thumbError[item.settuwenid] = true;
}

function formatDate(riqi?: string | null): string {
  return riqi ? riqi.slice(0, 10) : '';
}

async function loadPage(targetPage: number) {
  if (loading.value || finished.value) return;
  loading.value = true;
  loadError.value = '';
  try {
    const res = await apiTuwenLiebiao(categoryId.value, targetPage, pageSize);
    const items = res.list || [];
    if (targetPage === 1) {
      list.value = items;
    } else {
      list.value = list.value.concat(items);
    }
    if (items.length < pageSize) {
      finished.value = true;
    }
    page.value = targetPage;
  } catch (err) {
    loadError.value = (err as Error).message || '加载失败';
  } finally {
    loading.value = false;
    uni.stopPullDownRefresh();
  }
}

function retry() {
  loadPage(1);
}

function openDetail() {
  uni.showToast({ title: '内容详情即将上线', icon: 'none' });
}

onLoad((options) => {
  if (!requireLogin()) return;
  const id = Number(options?.categoryId || 0);
  categoryId.value = id;
  const title = options?.title ? decodeURIComponent(options.title) : '';
  pageTitle.value = title || '专题专栏';
  uni.setNavigationBarTitle({ title: pageTitle.value });
  if (id > 0) {
    loadPage(1);
  } else {
    loadError.value = '缺少类别参数';
  }
});

onPullDownRefresh(() => {
  finished.value = false;
  loadPage(1);
});

onReachBottom(() => {
  if (!finished.value && !loadError.value) {
    loadPage(page.value + 1);
  }
});
</script>

<template>
  <view class="topic-page">
    <!-- 加载失败 -->
    <view
      v-if="loadError && !list.length"
      class="topic-page__error"
    >
      <AppEmpty
        title="加载失败"
        :description="loadError"
      />
      <AppButton
        class="topic-page__retry"
        type="primary"
        @click="retry"
      >
        重新加载
      </AppButton>
    </view>

    <template v-else>
      <view
        v-for="item in list"
        :key="item.settuwenid"
        class="topic-page__item"
        @tap="openDetail"
      >
        <image
          class="topic-page__thumb"
          :src="thumbSrc(item)"
          mode="aspectFill"
          @error="onThumbError(item)"
        />
        <view class="topic-page__body">
          <text class="topic-page__title">
            {{ item.biaoti }}
          </text>
          <text
            v-if="item.zhaiyao"
            class="topic-page__summary"
          >
            {{ item.zhaiyao }}
          </text>
          <view class="topic-page__meta">
            <text class="topic-page__tag">
              图文
            </text>
            <text class="topic-page__date">
              {{ formatDate(item.riqi) }}
            </text>
          </view>
        </view>
      </view>

      <AppEmpty
        v-if="!loading && !list.length && !loadError"
        title="暂无内容"
        description="该专题下暂无图文内容"
      />

      <view
        v-if="loading"
        class="topic-page__loading"
      >
        <text class="topic-page__loading-text">
          加载中…
        </text>
      </view>
      <view
        v-else-if="finished && list.length"
        class="topic-page__loading"
      >
        <text class="topic-page__loading-text">
          没有更多了
        </text>
      </view>
    </template>

    <view class="safe-area-bottom" />
  </view>
</template>

<style lang="scss" scoped>
.topic-page {
  min-height: 100vh;
  background: $color-bg-page;
  padding: $section-margin $page-gutter;
  box-sizing: border-box;
}

.topic-page__item {
  display: flex;
  padding: $spacing-md;
  margin-bottom: $section-margin;
  background: $color-bg-card;
  border-radius: $radius-md;
  box-shadow: $shadow-1;

  &:active {
    opacity: 0.85;
  }
}

.topic-page__thumb {
  width: 200rpx;
  height: 140rpx;
  flex-shrink: 0;
  border-radius: $radius-sm;
  background: $color-bg-tertiary;
}

.topic-page__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: space-between;
  margin-left: $spacing-md;
  min-width: 0;
}

.topic-page__title {
  font-size: $font-md;
  font-weight: $font-weight-medium;
  line-height: $line-height-tight;
  color: $color-text-primary;
  @include multi-ellipsis(2);
}

.topic-page__summary {
  margin-top: $spacing-xs;
  font-size: $font-sm;
  color: $color-text-secondary;
  @include text-ellipsis;
}

.topic-page__meta {
  display: flex;
  align-items: center;
  margin-top: $spacing-xs;

  .topic-page__tag {
    padding: 2rpx $spacing-sm;
    font-size: $font-xs;
    color: $color-primary;
    background: $color-primary-soft;
    border-radius: $radius-xs;
  }

  .topic-page__date {
    margin-left: $spacing-sm;
    font-size: $font-xs;
    color: $color-text-tertiary;
  }
}

.topic-page__error {
  padding-top: $spacing-3xl;
}

.topic-page__retry {
  display: flex;
  width: 240rpx;
  margin: 0 auto;
}

.topic-page__loading {
  @include flex-center;
  padding: $spacing-lg 0;

  .topic-page__loading-text {
    font-size: $font-sm;
    color: $color-text-tertiary;
  }
}
</style>
