<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad, onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app';
import AppEmpty from '@/components/AppEmpty/AppEmpty.vue';
import AppButton from '@/components/AppButton/AppButton.vue';
import {
  apiTuwenCaozuo,
  apiTuwenCaozuoJilu,
  apiTuwenNeirong,
  apiTuwenXiangqing,
  resolveFileUrl,
  TUWEN_ACTION,
  type TuwenDetail,
} from '@/api/modules/tuwen';
import { normalizeRichText } from '@/utils/richtext';
import { LIUYAN_LEIXING } from '@/api/modules/liuyan';
import { requireLogin } from '@/services/auth.service';

/**
 * 内容详情（feat-008）：元数据（tuwenxiangqing）+ HTML 正文（tuwenneirong）
 * - 图片一律取接口 ossdir + wenjianurl（不变式 4/9），静态图仅作加载失败兜底
 * - 收藏/取消收藏、浏览记录上报走 tuwencaozuo（0 查看 / 1 收藏 / -1 取消收藏）
 * - 正文 HTML 由 utils/richtext 预处理后交 rich-text 渲染（排版交页面 token）
 */
const COVER_FALLBACK = '/static/images/cover-party-story.png';

const statusBarHeight = ref(uni.getSystemInfoSync().statusBarHeight || 0);

const tuwenid = ref(0);
const tuwenleibieid = ref(0);
/** 列表页带入的首屏占位信息（详情接口返回前先渲染，避免白屏） */
const routeTitle = ref('');
const routeOssdir = ref('');
const routeDate = ref('');
const routeDanwei = ref('');

const detail = ref<TuwenDetail | null>(null);
const contentHtml = ref('');
const loading = ref(true);
const contentLoading = ref(true);
const loadError = ref('');
const coverError = ref(false);
const favorited = ref(false);
const favoriteBusy = ref(false);

// ---------------------------------------------------------------------------
// 展示字段（接口优先，列表页带参兜底）
// ---------------------------------------------------------------------------
const ossdir = computed(() => detail.value?.ossdir || routeOssdir.value);
const navTitle = computed(() => detail.value?.tuwenleibie || '内容详情');
const title = computed(() => detail.value?.biaoti || routeTitle.value || '内容详情');
const danwei = computed(() => detail.value?.danwei || routeDanwei.value);
const date = computed(() => formatDate(detail.value?.riqi || routeDate.value));
const reads = computed(() => {
  const count = detail.value?.dianjishu;
  return count && count > 0 ? `${count}阅读` : '';
});
const externalUrl = computed(() => detail.value?.wailian || '');

const coverUrl = computed(() =>
  detail.value?.wenjianurl ? resolveFileUrl(ossdir.value, detail.value.wenjianurl) : '',
);
const coverSrc = computed(() => (coverError.value ? COVER_FALLBACK : coverUrl.value || COVER_FALLBACK));
/** 正文已包含同一张图时不重复展示头图 */
const showCover = computed(() => {
  const name = coverUrl.value.split('/').pop() || '';
  return !!coverUrl.value && (!name || !contentHtml.value.includes(name));
});

function formatDate(riqi?: string | null): string {
  return riqi ? riqi.slice(0, 10) : '';
}

function decodeParam(value?: string): string {
  if (!value) return '';
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function onCoverError() {
  coverError.value = true;
}

// ---------------------------------------------------------------------------
// 加载
// ---------------------------------------------------------------------------
async function loadFavoriteState() {
  try {
    const csv = await apiTuwenCaozuoJilu(TUWEN_ACTION.FAVORITE);
    favorited.value = csv
      .split(',')
      .map((id) => id.trim())
      .includes(String(tuwenid.value));
  } catch {
    // 收藏态查询失败不影响阅读
  }
}

function reportView() {
  // 浏览记录：失败静默（不打扰阅读）
  apiTuwenCaozuo(tuwenid.value, TUWEN_ACTION.VIEW, { showError: false }).catch(() => undefined);
}

async function loadDetail() {
  if (!tuwenid.value || !tuwenleibieid.value) {
    loadError.value = '缺少图文参数，无法打开详情';
    loading.value = false;
    contentLoading.value = false;
    return;
  }

  loading.value = true;
  contentLoading.value = true;
  loadError.value = '';
  coverError.value = false;

  try {
    const res = await apiTuwenXiangqing(tuwenid.value, tuwenleibieid.value);
    if (!res.obj || !res.obj.settuwenid) {
      loadError.value = '内容不存在或已下架';
      return;
    }
    detail.value = res.obj;
    uni.setNavigationBarTitle({ title: title.value });
  } catch (err) {
    loadError.value = (err as Error).message || '加载失败';
    return;
  } finally {
    loading.value = false;
  }

  reportView();
  loadFavoriteState();

  try {
    const html = await apiTuwenNeirong(tuwenid.value, tuwenleibieid.value);
    contentHtml.value = normalizeRichText(html, ossdir.value);
  } catch {
    contentHtml.value = '';
  } finally {
    contentLoading.value = false;
  }
}

function retry() {
  loadDetail();
}

// ---------------------------------------------------------------------------
// 收藏 / 分享 / 外链
// ---------------------------------------------------------------------------
async function toggleFavorite() {
  if (favoriteBusy.value) return;
  favoriteBusy.value = true;
  const next = favorited.value ? TUWEN_ACTION.UNFAVORITE : TUWEN_ACTION.FAVORITE;
  try {
    await apiTuwenCaozuo(tuwenid.value, next);
    favorited.value = next === TUWEN_ACTION.FAVORITE;
    uni.showToast({ title: favorited.value ? '已收藏' : '已取消收藏', icon: 'none' });
  } catch (err) {
    uni.showToast({ title: (err as Error).message || '操作失败', icon: 'none' });
  } finally {
    favoriteBusy.value = false;
  }
}

/** 非微信端的手动分享入口（微信端由 button open-type="share" 直接拉起系统分享） */
function handleShare() {
  const link = externalUrl.value;
  if (!link) {
    uni.showToast({ title: '暂无可分享的链接', icon: 'none' });
    return;
  }
  uni.setClipboardData({
    data: link,
    success: () => uni.showToast({ title: '链接已复制', icon: 'none' }),
  });
}

/** 外链跳转：小程序内 web-view 需后端域名进业务域名白名单，故提供复制链接兜底 */
function openSource() {
  const url = externalUrl.value;
  if (!url) return;

  // #ifdef H5
  window.open(url, '_blank');
  // #endif

  // #ifndef H5
  uni.showActionSheet({
    itemList: ['复制链接到浏览器打开', '在小程序内打开'],
    success: (res) => {
      if (res.tapIndex === 0) {
        uni.setClipboardData({
          data: url,
          success: () => uni.showToast({ title: '链接已复制', icon: 'none' }),
        });
      } else {
        uni.navigateTo({ url: `/pages/webview/index?url=${encodeURIComponent(url)}` });
      }
    },
  });
  // #endif
}

/** 图文留言（feat-010）：leixing=4 + tuwenid 必传 */
function openMessage() {
  uni.navigateTo({
    url: `/pages/message/index?leixing=${LIUYAN_LEIXING.MESSAGE}&tuwenid=${tuwenid.value}&title=${encodeURIComponent('留言交流')}`,
  });
}

function goBack() {
  const pages = getCurrentPages();
  if (pages.length > 1) {
    uni.navigateBack();
  } else {
    uni.switchTab({ url: '/pages/index/index' });
  }
}

// ---------------------------------------------------------------------------
// 分享（微信小程序）
// ---------------------------------------------------------------------------
const sharePath = computed(
  () => `/pages/detail/index?tuwenid=${tuwenid.value}&tuwenleibieid=${tuwenleibieid.value}`,
);

onShareAppMessage(() => ({
  title: title.value,
  path: sharePath.value,
  imageUrl: coverUrl.value || undefined,
}));

onShareTimeline(() => ({
  title: title.value,
  query: `tuwenid=${tuwenid.value}&tuwenleibieid=${tuwenleibieid.value}`,
  imageUrl: coverUrl.value || undefined,
}));

onLoad((options) => {
  if (!requireLogin()) return;

  // #ifdef MP-WEIXIN
  // 打开「转发 / 分享到朋友圈」菜单项（部分基础库默认不展示朋友圈入口）
  uni.showShareMenu({ withShareTicket: true, menus: ['shareAppMessage', 'shareTimeline'] });
  // #endif

  tuwenid.value = Number(options?.tuwenid || 0);
  tuwenleibieid.value = Number(options?.tuwenleibieid || 0);
  routeTitle.value = decodeParam(options?.biaoti);
  routeOssdir.value = decodeParam(options?.ossdir);
  routeDate.value = decodeParam(options?.riqi);
  routeDanwei.value = decodeParam(options?.danwei);
  loadDetail();
});
</script>

<template>
  <view class="detail-page">
    <!-- 顶部导航（红底固定，内容区用等高占位撑开） -->
    <view
      class="detail-page__nav"
      :style="{ paddingTop: `${statusBarHeight}px` }"
    >
      <view class="detail-page__nav-inner">
        <view
          class="detail-page__nav-back"
          @tap="goBack"
        >
          <text class="detail-page__nav-back-icon">
            ←
          </text>
        </view>
        <text class="detail-page__nav-title">
          {{ navTitle }}
        </text>
      </view>
    </view>
    <view
      class="detail-page__nav-placeholder"
      :style="{ paddingTop: `${statusBarHeight}px` }"
    >
      <view class="detail-page__nav-placeholder-inner" />
    </view>

    <!-- 加载失败 -->
    <view
      v-if="loadError && !loading"
      class="detail-page__error"
    >
      <AppEmpty
        title="加载失败"
        :description="loadError"
      />
      <AppButton
        class="detail-page__retry"
        type="primary"
        @click="retry"
      >
        重新加载
      </AppButton>
    </view>

    <template v-else>
      <view class="detail-page__article">
        <text class="detail-page__title">
          {{ title }}
        </text>

        <view
          v-if="danwei || date || reads"
          class="detail-page__meta"
        >
          <text
            v-if="danwei"
            class="detail-page__meta-item"
          >
            {{ danwei }}
          </text>
          <text
            v-if="date"
            class="detail-page__meta-item"
          >
            {{ date }}
          </text>
          <text
            v-if="reads"
            class="detail-page__meta-item"
          >
            {{ reads }}
          </text>
        </view>

        <!-- 头图（接口 ossdir + wenjianurl，失败落静态兜底） -->
        <image
          v-if="showCover"
          class="detail-page__cover"
          :src="coverSrc"
          mode="widthFix"
          @error="onCoverError"
        />

        <!-- 正文（tuwenneirong 返回 HTML；加载中骨架，空/失败给空态） -->
        <view
          v-if="contentLoading"
          class="detail-page__skeleton"
        >
          <view class="detail-page__skeleton-line" />
          <view class="detail-page__skeleton-line" />
          <view class="detail-page__skeleton-line detail-page__skeleton-line--short" />
        </view>
        <rich-text
          v-else-if="contentHtml"
          class="detail-page__content"
          :nodes="contentHtml"
        />
        <AppEmpty
          v-else
          title="暂无正文"
          description="该图文暂无正文内容，可查看原文链接"
        />

        <!-- 外链原文（小程序 web-view 受业务域名白名单限制，提供复制链接通道） -->
        <view
          v-if="externalUrl"
          class="detail-page__source"
          @tap="openSource"
        >
          <text class="detail-page__source-text">
            查看原文
          </text>
          <text class="detail-page__source-arrow">
            ›
          </text>
        </view>
      </view>
    </template>

    <!-- 底部操作条 -->
    <view
      v-if="!loading && !loadError"
      class="detail-page__bar"
    >
      <view
        class="detail-page__bar-item"
        @tap="toggleFavorite"
      >
        <image
          class="detail-page__bar-icon"
          :src="favorited ? '/static/icons/star-favorite-red.png' : '/static/icons/favorite-bookmark.png'"
          mode="aspectFit"
        />
        <text
          class="detail-page__bar-label"
          :class="{ 'detail-page__bar-label--active': favorited }"
        >
          {{ favorited ? '已收藏' : '收藏' }}
        </text>
      </view>

      <!-- #ifdef MP-WEIXIN -->
      <button
        class="detail-page__bar-item detail-page__bar-button"
        open-type="share"
      >
        <text class="detail-page__bar-icon-text">
          ↗
        </text>
        <text class="detail-page__bar-label">
          分享
        </text>
      </button>
      <!-- #endif -->

      <!-- #ifndef MP-WEIXIN -->
      <view
        class="detail-page__bar-item"
        @tap="handleShare"
      >
        <text class="detail-page__bar-icon-text">
          ↗
        </text>
        <text class="detail-page__bar-label">
          分享
        </text>
      </view>
      <!-- #endif -->

      <!-- 留言（apiliuyan：leixing=4 图文留言，tuwenid 必传） -->
      <view
        class="detail-page__bar-item"
        @tap="openMessage"
      >
        <image
          class="detail-page__bar-icon"
          src="/static/icons/member-chat-purple.png"
          mode="aspectFit"
        />
        <text class="detail-page__bar-label">
          留言
        </text>
      </view>
    </view>

    <view
      v-if="!loading && !loadError"
      class="detail-page__bar-placeholder"
    />
  </view>
</template>

<style lang="scss" scoped>
.detail-page {
  min-height: 100vh;
  background: $color-bg-page;
}

// ---------------------------------------------------------------------------
// 顶部导航
// ---------------------------------------------------------------------------
.detail-page__nav {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: $z-max;
  background: $color-primary;
}

.detail-page__nav-inner {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: $comp-navbar-height;
  padding: 0 $page-gutter;
  box-sizing: border-box;
}

.detail-page__nav-back {
  position: absolute;
  left: $page-gutter;
  display: flex;
  align-items: center;
  justify-content: center;
  width: $comp-navbar-btn-hit;
  height: $comp-navbar-btn-hit;
}

.detail-page__nav-back-icon {
  font-size: $font-title;
  line-height: 1;
  color: $color-text-inverse;
}

.detail-page__nav-title {
  max-width: 60%;
  overflow: hidden;
  font-size: $comp-navbar-title-size;
  font-weight: $font-weight-semibold;
  color: $comp-navbar-title-color;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-page__nav-placeholder-inner {
  height: $comp-navbar-height;
}

// ---------------------------------------------------------------------------
// 正文
// ---------------------------------------------------------------------------
.detail-page__article {
  margin: $section-margin $page-gutter 0;
  padding: $comp-card-padding;
  background: $color-bg-card;
  border-radius: $radius-md;
  box-shadow: $shadow-1;
}

.detail-page__title {
  font-size: $font-xl;
  font-weight: $font-weight-bold;
  line-height: $line-height-tight;
  color: $color-text-primary;
}

.detail-page__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin-top: $spacing-md;
}

.detail-page__meta-item {
  margin-right: $spacing-lg;
  font-size: $font-sm;
  color: $color-text-secondary;
}

.detail-page__cover {
  width: 100%;
  margin-top: $spacing-lg;
  background: $color-bg-tertiary;
  border-radius: $radius-sm;
}

.detail-page__content {
  display: block;
  margin-top: $spacing-lg;
  font-size: $font-md;
  line-height: $line-height-relaxed;
  color: $color-text-primary;
  word-break: break-all;
}

// ---------------------------------------------------------------------------
// 正文骨架屏
// ---------------------------------------------------------------------------
.detail-page__skeleton {
  margin-top: $spacing-lg;
}

.detail-page__skeleton-line {
  height: $comp-skeleton-row-height;
  margin-bottom: $comp-skeleton-row-gap;
  background: $color-bg-tertiary;
  border-radius: $comp-skeleton-row-radius;

  &--short {
    width: 60%;
  }
}

// ---------------------------------------------------------------------------
// 底部操作条
// ---------------------------------------------------------------------------
.detail-page__bar {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: $z-sticky;
  display: flex;
  align-items: center;
  padding: $spacing-md $page-gutter;
  padding-bottom: calc(#{$spacing-md} + env(safe-area-inset-bottom));
  background: $color-bg-card;
  border-top: $comp-hairline-width solid $color-border-light;
}

.detail-page__bar-placeholder {
  height: $comp-btn-fixed-height;
}

.detail-page__bar-item {
  display: flex;
  align-items: center;
  margin-right: $spacing-xl;
}

// 微信分享按钮是原生 button，需抹掉默认样式
.detail-page__bar-button {
  display: flex;
  align-items: center;
  height: auto;
  padding: 0;
  margin-right: $spacing-xl;
  font-size: $font-sm;
  line-height: 1;
  background: transparent;
  border: none;

  &::after {
    display: none;
  }
}

.detail-page__bar-icon {
  width: 40rpx;
  height: 40rpx;
}

.detail-page__bar-icon-text {
  width: 40rpx;
  font-size: $font-lg;
  line-height: 1;
  text-align: center;
  color: $color-text-secondary;
}

.detail-page__bar-label {
  margin-left: $spacing-xs;
  font-size: $font-sm;
  color: $color-text-secondary;

  &--active {
    color: $color-primary;
  }
}

.detail-page__source {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $spacing-md;
  margin-top: $spacing-xl;
  background: $color-bg-page;
  border-radius: $radius-sm;

  &:active {
    opacity: 0.85;
  }
}

.detail-page__source-text {
  font-size: $font-md;
  color: $color-primary;
}

.detail-page__source-arrow {
  margin-left: $spacing-xs;
  font-size: $font-md;
  color: $color-primary;
}

// ---------------------------------------------------------------------------
// 错误态
// ---------------------------------------------------------------------------
.detail-page__error {
  padding-top: $spacing-4xl;
}

.detail-page__retry {
  display: flex;
  width: 240rpx;
  margin: 0 auto;
}
</style>
