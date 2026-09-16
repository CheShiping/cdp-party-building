<script setup lang="ts">
import { reactive, ref } from 'vue';
import { onLoad, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
import AppEmpty from '@/components/AppEmpty/AppEmpty.vue';
import AppButton from '@/components/AppButton/AppButton.vue';
import {
  apiTuwenCaozuoLiebiao,
  envelopeOssdir,
  resolveFileUrl,
  TUWEN_ACTION,
  type TuwenActionItem,
} from '@/api/modules/tuwen';
import { requireLogin } from '@/services/auth.service';

/**
 * 我的收藏 / 浏览记录（feat-013，prototype/个人中心.jpg 菜单第 1、2 项）。
 * - 我的收藏：tuwencaozuoliebiao leixing=1
 * - 浏览记录：leixing=0（查看）+ 2（推送点开）合并去重，按操作时间倒序
 * - 缩略图一律取接口 obj.ossdir + wenjianurl（不变式 4/9），静态图仅兜底
 */
type ListType = 'favorite' | 'history';

const listType = ref<ListType>('favorite');

const list = ref<TuwenActionItem[]>([]);
const page = ref(1);
const pageSize = 20;
const finished = ref(false);
const loading = ref(false);
const loadError = ref('');
const ossdir = ref('');
const thumbError = reactive<Record<number, boolean>>({});

function thumbSrc(item: TuwenActionItem): string {
  if (thumbError[item.settuwenid]) return '/static/images/cover-greatwall.png';
  return resolveFileUrl(ossdir.value, item.wenjianurl) || '/static/images/cover-greatwall.png';
}

function onThumbError(item: TuwenActionItem) {
  thumbError[item.settuwenid] = true;
}

function formatDate(riqi?: string | null): string {
  return riqi ? riqi.slice(0, 16) : '';
}

/** 浏览记录：查看(0) + 推送点开(2) 合并去重（同图文保留最新操作时间） */
function mergeActions(items: TuwenActionItem[]): TuwenActionItem[] {
  const map = new Map<number, TuwenActionItem>();
  for (const item of items) {
    const exist = map.get(item.settuwenid);
    if (!exist || (item.caozuoriqi || '') > (exist.caozuoriqi || '')) {
      map.set(item.settuwenid, item);
    }
  }
  return [...map.values()].sort((a, b) => (b.caozuoriqi || '').localeCompare(a.caozuoriqi || ''));
}

async function loadPage(targetPage: number) {
  if (loading.value || finished.value) return;
  loading.value = true;
  loadError.value = '';
  try {
    let items: TuwenActionItem[] = [];

    if (listType.value === 'favorite') {
      const res = await apiTuwenCaozuoLiebiao(TUWEN_ACTION.FAVORITE, targetPage, pageSize);
      ossdir.value = envelopeOssdir(res) || ossdir.value;
      items = res.list || [];
    } else {
      const [viewRes, pushRes] = await Promise.all([
        apiTuwenCaozuoLiebiao(TUWEN_ACTION.VIEW, targetPage, pageSize),
        apiTuwenCaozuoLiebiao(TUWEN_ACTION.PUSH_OPEN, targetPage, pageSize),
      ]);
      ossdir.value = envelopeOssdir(viewRes) || envelopeOssdir(pushRes) || ossdir.value;
      items = mergeActions([...(viewRes.list || []), ...(pushRes.list || [])]);
    }

    list.value = targetPage === 1 ? items : list.value.concat(items);
    if (items.length < pageSize) finished.value = true;
    page.value = targetPage;
  } catch (err) {
    loadError.value = (err as Error).message || '加载失败';
  } finally {
    loading.value = false;
    uni.stopPullDownRefresh();
  }
}

function retry() {
  finished.value = false;
  loadPage(1);
}

function openDetail(item: TuwenActionItem) {
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

onLoad((options) => {
  if (!requireLogin()) return;
  listType.value = options?.type === 'history' ? 'history' : 'favorite';
  uni.setNavigationBarTitle({ title: listType.value === 'history' ? '浏览记录' : '我的收藏' });
  loadPage(1);
});

onPullDownRefresh(() => {
  finished.value = false;
  loadPage(1);
});

onReachBottom(() => {
  if (!finished.value && !loadError.value) loadPage(page.value + 1);
});
</script>

<template>
  <view class="collection-page">
    <view
      v-if="loadError && !list.length"
      class="collection-page__error"
    >
      <AppEmpty
        title="加载失败"
        :description="loadError"
      />
      <AppButton
        class="collection-page__retry"
        type="primary"
        size="small"
        @click="retry"
      >
        重新加载
      </AppButton>
    </view>

    <template v-else>
      <view
        v-for="item in list"
        :key="`${item.settuwenid}-${item.caozuoriqi || ''}`"
        class="collection-page__item"
        @tap="openDetail(item)"
      >
        <image
          class="collection-page__thumb"
          :src="thumbSrc(item)"
          mode="aspectFill"
          @error="onThumbError(item)"
        />
        <view class="collection-page__body">
          <text class="collection-page__title">
            {{ item.biaoti }}
          </text>
          <text
            v-if="item.zhaiyao"
            class="collection-page__summary"
          >
            {{ item.zhaiyao }}
          </text>
          <view class="collection-page__meta">
            <text class="collection-page__tag">
              {{ listType === 'history' ? '浏览' : '收藏' }}
            </text>
            <text class="collection-page__date">
              {{ formatDate(item.caozuoriqi || item.riqi) }}
            </text>
          </view>
        </view>
      </view>

      <AppEmpty
        v-if="!loading && !list.length && !loadError"
        :title="listType === 'history' ? '暂无浏览记录' : '暂无收藏'"
        :description="listType === 'history' ? '浏览过的内容会出现在这里' : '在内容详情页点击收藏即可加入'"
      />

      <view
        v-if="loading"
        class="collection-page__tip"
      >
        <text class="collection-page__tip-text">
          加载中…
        </text>
      </view>
      <view
        v-else-if="finished && list.length"
        class="collection-page__tip"
      >
        <text class="collection-page__tip-text">
          没有更多了
        </text>
      </view>
    </template>

    <view class="safe-area-bottom" />
  </view>
</template>

<style lang="scss" scoped>
.collection-page {
  min-height: 100vh;
  background: $color-bg-page;
  padding: $section-margin $page-gutter;
  box-sizing: border-box;
}

.collection-page__item {
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

.collection-page__thumb {
  width: 200rpx;
  height: 140rpx;
  flex-shrink: 0;
  background: $color-bg-tertiary;
  border-radius: $radius-sm;
}

.collection-page__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: space-between;
  margin-left: $spacing-md;
  min-width: 0;
}

.collection-page__title {
  font-size: $font-md;
  font-weight: $font-weight-medium;
  line-height: $line-height-tight;
  color: $color-text-primary;
  @include multi-ellipsis(2);
}

.collection-page__summary {
  margin-top: $spacing-xs;
  font-size: $font-sm;
  color: $color-text-secondary;
  @include text-ellipsis;
}

.collection-page__meta {
  display: flex;
  align-items: center;
  margin-top: $spacing-xs;
}

.collection-page__tag {
  padding: 2rpx $spacing-sm;
  font-size: $font-xs;
  color: $color-primary;
  background: $color-primary-soft;
  border-radius: $radius-xs;
}

.collection-page__date {
  margin-left: $spacing-sm;
  font-size: $font-xs;
  color: $color-text-tertiary;
}

.collection-page__error {
  padding-top: $spacing-3xl;
}

.collection-page__retry {
  display: flex;
  width: 240rpx;
  margin: 0 auto;
}

.collection-page__tip {
  @include flex-center;
  padding: $spacing-lg 0;

  .collection-page__tip-text {
    font-size: $font-sm;
    color: $color-text-tertiary;
  }
}
</style>
