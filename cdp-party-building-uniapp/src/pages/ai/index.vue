<script setup lang="ts">
import { reactive, ref } from 'vue';
import { onReachBottom, onShow } from '@dcloudio/uni-app';
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

/**
 * AI 学习（feat-011 原型界面，prototype/ai学习.png）。
 * 原型 = 红底头部（搜索）+ 分类 chips + 图文卡片列表；本页用 apituwen 真实接口落地：
 * - chips：推荐（专题学习父类别）+ 其子类别（党史学习 / 主体党日 / 二十大精神 …）
 * - 列表：推荐用 tuwenfuliebiao（父类聚合），选中子类用 tuwenliebiao
 * - 搜索：接口 biaoti 模糊搜索（真实可用）
 * - 数智党建手册 / AI 问答等无接口能力不做假数据，仅保留原型界面元素
 */
const statusBarHeight = ref(uni.getSystemInfoSync().statusBarHeight || 0);

interface Chip {
  id: number;
  mingcheng: string;
}

const chips = ref<Chip[]>([{ id: TUWEN_CATEGORY.TOPIC, mingcheng: '推荐' }]);
const activeId = ref<number>(TUWEN_CATEGORY.TOPIC);

const keyword = ref('');
const activeKeyword = ref('');

const list = ref<TuwenItem[]>([]);
const page = ref(1);
const pageSize = 10;
const finished = ref(false);
const loading = ref(false);
const loadError = ref('');
const ossdir = ref('');
const thumbError = reactive<Record<number, boolean>>({});

function thumbSrc(item: TuwenItem): string {
  if (thumbError[item.settuwenid]) return '/static/images/cover-party-story.png';
  return resolveFileUrl(ossdir.value, item.wenjianurl) || '/static/images/cover-party-story.png';
}

function onThumbError(item: TuwenItem) {
  thumbError[item.settuwenid] = true;
}

function formatDate(riqi?: string | null): string {
  return riqi ? riqi.slice(0, 10) : '';
}

/** 阅读数：接口为空时不显示（不造数据） */
function reads(item: TuwenItem): string {
  const count = item.dianjishu;
  return count && count > 0 ? `${count}阅读` : '';
}

// ---------------------------------------------------------------------------
// 分类 chips（专题学习子类别，按后端 paixu 倒序，与原型顺序一致）
// ---------------------------------------------------------------------------
async function loadChips() {
  try {
    const res = await apiTuwenLeibie();
    const children = (res.list || [])
      .filter((c: TuwenCategory) => c.shangjiiid === TUWEN_CATEGORY.TOPIC)
      .sort((a, b) => (b.paixu || 0) - (a.paixu || 0));
    chips.value = [
      { id: TUWEN_CATEGORY.TOPIC, mingcheng: '推荐' },
      ...children.map((c) => ({ id: c.settuwenleibieid, mingcheng: c.mingcheng })),
    ];
  } catch {
    // 分类失败保留「推荐」，不影响列表
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
    const isParent = activeId.value === TUWEN_CATEGORY.TOPIC;
    const res = isParent
      ? await apiTuwenFuliebiao(activeId.value, targetPage, pageSize, activeKeyword.value || undefined)
      : await apiTuwenLiebiao(activeId.value, targetPage, pageSize, activeKeyword.value || undefined);
    ossdir.value = envelopeOssdir(res) || ossdir.value;
    const items = res.list || [];
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

function selectChip(chip: Chip) {
  if (chip.id === activeId.value && !activeKeyword.value) return;
  activeId.value = chip.id;
  activeKeyword.value = '';
  keyword.value = '';
  reload();
}

function onSearch() {
  activeKeyword.value = keyword.value.trim();
  reload();
}

function openDetail(item: TuwenItem) {
  const leibieid = item.settuwenleibieid || activeId.value;
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
  if (chips.value.length <= 1) loadChips();
  if (!list.value.length) loadPage(1);
});

onReachBottom(() => {
  if (!finished.value && !loadError.value) loadPage(page.value + 1);
});
</script>

<template>
  <view class="ai-page">
    <!-- 红底头部：标题 + 搜索 + 分类（prototype/ai学习.png @0–240） -->
    <view
      class="ai-page__top"
      :style="{ paddingTop: `${statusBarHeight}px` }"
    >
      <view class="ai-page__nav">
        <text class="ai-page__nav-title">
          AI学习
        </text>
      </view>

      <view class="ai-page__search-row">
        <view class="ai-page__search">
          <input
            v-model="keyword"
            class="ai-page__search-input"
            type="text"
            placeholder="输入或说出党建问题"
            confirm-type="search"
            @confirm="onSearch"
          >
        </view>
        <view
          class="ai-page__search-btn"
          @tap="onSearch"
        >
          搜索
        </view>
      </view>

      <scroll-view
        class="ai-page__chips"
        scroll-x
        :show-scrollbar="false"
      >
        <view class="ai-page__chip-list">
          <view
            v-for="chip in chips"
            :key="chip.id"
            class="ai-page__chip"
            :class="{ 'ai-page__chip--active': chip.id === activeId }"
            @tap="selectChip(chip)"
          >
            {{ chip.mingcheng }}
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 内容卡片列表 -->
    <view class="ai-page__list">
      <view
        v-if="loadError && !list.length"
        class="ai-page__error"
      >
        <AppEmpty
          title="加载失败"
          :description="loadError"
        />
        <AppButton
          class="ai-page__retry"
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
          :key="item.settuwenid"
          class="ai-page__card"
          @tap="openDetail(item)"
        >
          <image
            class="ai-page__cover"
            :src="thumbSrc(item)"
            mode="aspectFill"
            @error="onThumbError(item)"
          />
          <view class="ai-page__body">
            <text class="ai-page__title">
              {{ item.biaoti }}
            </text>
            <text
              v-if="item.zhaiyao"
              class="ai-page__summary"
            >
              {{ item.zhaiyao }}
            </text>
            <view class="ai-page__meta">
              <text class="ai-page__tag">
                图文
              </text>
              <text class="ai-page__date">
                {{ formatDate(item.riqi) }}
              </text>
              <text
                v-if="reads(item)"
                class="ai-page__reads"
              >
                {{ reads(item) }}
              </text>
            </view>
          </view>
        </view>

        <AppEmpty
          v-if="!loading && !list.length && !loadError"
          title="暂无学习内容"
          :description="activeKeyword ? '没有匹配的内容，换个关键词试试' : '该分类下暂无内容'"
        />

        <view
          v-if="loading"
          class="ai-page__tip"
        >
          <text class="ai-page__tip-text">
            加载中…
          </text>
        </view>
        <view
          v-else-if="finished && list.length"
          class="ai-page__tip"
        >
          <text class="ai-page__tip-text">
            没有更多了
          </text>
        </view>
      </template>
    </view>

    <view class="safe-area-bottom" />
  </view>
</template>

<style lang="scss" scoped>
.ai-page {
  min-height: 100vh;
  background: $color-bg-page;
}

// ---------------------------------------------------------------------------
// 头部
// ---------------------------------------------------------------------------
.ai-page__top {
  background: $color-primary;
  padding-bottom: $spacing-lg;
}

.ai-page__nav {
  @include flex-center;
  height: $comp-navbar-height;

  .ai-page__nav-title {
    font-size: $comp-navbar-title-size;
    font-weight: $font-weight-semibold;
    color: $comp-navbar-title-color;
  }
}

.ai-page__search-row {
  display: flex;
  align-items: center;
  padding: $spacing-xs $page-gutter 0;
}

.ai-page__search {
  display: flex;
  flex: 1;
  align-items: center;
  height: 72rpx;
  padding: 0 $spacing-lg;
  background: $color-bg-card;
  border-radius: $radius-full;
}

.ai-page__search-input {
  flex: 1;
  font-size: $font-sm;
  color: $color-text-primary;
}

.ai-page__search-btn {
  @include flex-center;
  flex-shrink: 0;
  height: 58rpx;
  padding: 0 $spacing-lg;
  margin-left: $spacing-sm;
  font-size: $font-sm;
  color: $color-text-inverse;
  background: $color-primary;
  border: $comp-hairline-width solid $color-text-inverse;
  border-radius: $radius-full;
}

.ai-page__chips {
  width: 100%;
  margin-top: $spacing-lg;
  white-space: nowrap;
}

.ai-page__chip-list {
  display: inline-flex;
  gap: $spacing-md;
  padding: 0 $page-gutter;
}

.ai-page__chip {
  flex-shrink: 0;
  padding: $spacing-sm $spacing-xl;
  font-size: $font-sm;
  color: $color-text-inverse;
  background: rgba-with-alpha($color-text-inverse, 0.16);
  border: $comp-hairline-width solid rgba-with-alpha($color-text-inverse, 0.6);
  border-radius: $radius-full;

  &--active {
    color: $color-primary;
    background: $color-bg-card;
    border-color: $color-bg-card;
  }
}

// ---------------------------------------------------------------------------
// 卡片列表
// ---------------------------------------------------------------------------
.ai-page__list {
  padding: $section-margin $page-gutter 0;
}

.ai-page__card {
  display: flex;
  padding: $comp-card-padding;
  margin-bottom: $section-margin;
  background: $color-bg-card;
  border-radius: $radius-md;
  box-shadow: $shadow-1;

  &:active {
    opacity: 0.9;
  }
}

.ai-page__cover {
  width: 240rpx;
  height: 168rpx;
  flex-shrink: 0;
  background: $color-bg-tertiary;
  border-radius: $radius-sm;
}

.ai-page__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  margin-left: $spacing-lg;
  min-width: 0;
}

.ai-page__title {
  font-size: $font-md;
  font-weight: $font-weight-semibold;
  line-height: $line-height-tight;
  color: $color-text-primary;
  @include multi-ellipsis(2);
}

.ai-page__summary {
  margin-top: $spacing-xs;
  font-size: $font-sm;
  line-height: $line-height-normal;
  color: $color-text-secondary;
  @include multi-ellipsis(2);
}

.ai-page__meta {
  display: flex;
  align-items: center;
  margin-top: auto;
  padding-top: $spacing-sm;
}

.ai-page__tag {
  padding: 2rpx $spacing-sm;
  font-size: $font-xs;
  color: $color-primary;
  border: $comp-hairline-width solid $color-primary;
  border-radius: $radius-xs;
}

.ai-page__date {
  margin-left: $spacing-sm;
  font-size: $font-xs;
  color: $color-text-tertiary;
}

.ai-page__reads {
  margin-left: $spacing-sm;
  font-size: $font-xs;
  color: $color-text-tertiary;
}

.ai-page__error {
  padding-top: $spacing-3xl;
}

.ai-page__retry {
  display: flex;
  width: 240rpx;
  margin: 0 auto;
}

.ai-page__tip {
  @include flex-center;
  padding: $spacing-lg 0;

  .ai-page__tip-text {
    font-size: $font-sm;
    color: $color-text-tertiary;
  }
}
</style>
