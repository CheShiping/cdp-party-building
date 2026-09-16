<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
import AppEmpty from '@/components/AppEmpty/AppEmpty.vue';
import AppButton from '@/components/AppButton/AppButton.vue';
import {
  apiLiuyanCaozuo,
  apiLiuyanHuiFuLiebiao,
  apiLiuyanLiebiao,
  apiLiuyanShanchu,
  LIUYAN_LEIXING,
  type LiuyanItem,
} from '@/api/modules/liuyan';
import { requireLogin } from '@/services/auth.service';
import { useUserStore } from '@/stores/modules/user';

/**
 * 支部留言 / 图文留言（feat-010）。
 * - leixing=1 党员交流（无 tuwenid）；leixing=4 图文留言（tuwenid 必传）
 * - 列表接口返回「一级留言 + 回复」混排，前端按 shangjiid=0 取一级；回复按需拉 liuyanhuifuliebiao
 * - 发布/回复走 liuyancaozuo，删除走 liuyanshanchu（仅本人，后端二次校验）
 */
const userStore = useUserStore();

const leixing = ref<number>(LIUYAN_LEIXING.EXCHANGE);
const tuwenid = ref(0);
const pageTitle = ref('党员交流');

const list = ref<LiuyanItem[]>([]);
const page = ref(1);
const pageSize = 20;
const finished = ref(false);
const loading = ref(false);
const loadError = ref('');

const replyMap = ref<Record<number, LiuyanItem[]>>({});
const replyOpen = ref<Record<number, boolean>>({});
const replyLoading = ref<Record<number, boolean>>({});

const draft = ref('');
const submitting = ref(false);
const replyTarget = ref<{ id: number; name: string } | null>(null);

/** 一级留言（shangjiid=0） */
const roots = computed(() => list.value.filter((it) => !it.shangjiid));

const myUserId = computed(() => userStore.userInfo?.yonghuid || 0);

function formatDate(riqi?: string | null): string {
  return riqi ? riqi.slice(0, 16) : '';
}

function isMine(item: LiuyanItem): boolean {
  return !!myUserId.value && item.sysyonghuid === myUserId.value;
}

function replyCount(item: LiuyanItem): number {
  return (replyMap.value[item.sopliuyanid] || []).length;
}

// ---------------------------------------------------------------------------
// 数据加载
// ---------------------------------------------------------------------------
async function loadPage(targetPage: number) {
  if (loading.value || finished.value) return;
  loading.value = true;
  loadError.value = '';
  try {
    const res = await apiLiuyanLiebiao(
      leixing.value,
      targetPage,
      pageSize,
      tuwenid.value || undefined,
    );
    const items = res.list || [];
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

async function toggleReplies(item: LiuyanItem) {
  const id = item.sopliuyanid;
  if (replyOpen.value[id]) {
    replyOpen.value[id] = false;
    return;
  }
  replyOpen.value[id] = true;
  if (replyMap.value[id] || replyLoading.value[id]) return;
  replyLoading.value[id] = true;
  try {
    const res = await apiLiuyanHuiFuLiebiao(id, leixing.value);
    replyMap.value[id] = res.list || [];
  } catch {
    replyMap.value[id] = [];
  } finally {
    replyLoading.value[id] = false;
  }
}

// ---------------------------------------------------------------------------
// 发布 / 回复 / 删除
// ---------------------------------------------------------------------------
function startReply(item: LiuyanItem) {
  replyTarget.value = { id: item.sopliuyanid, name: item.xingming || '该党员' };
  draft.value = '';
}

function cancelReply() {
  replyTarget.value = null;
  draft.value = '';
}

async function submit() {
  if (submitting.value) return;
  const content = draft.value.trim();
  if (!content) {
    uni.showToast({ title: '请输入留言内容', icon: 'none' });
    return;
  }
  if (content.length > 3000) {
    uni.showToast({ title: '留言不能超过3000字', icon: 'none' });
    return;
  }

  submitting.value = true;
  try {
    await apiLiuyanCaozuo({
      leixing: leixing.value,
      neirong: content,
      tuwenid: tuwenid.value || undefined,
      shangjiid: replyTarget.value?.id,
    });
    const targetId = replyTarget.value?.id;
    draft.value = '';
    replyTarget.value = null;
    uni.showToast({ title: '发表成功', icon: 'success' });
    if (targetId) {
      // 刷新该条的回复并保持展开
      delete replyMap.value[targetId];
      replyOpen.value[targetId] = true;
      const res = await apiLiuyanHuiFuLiebiao(targetId, leixing.value).catch(() => null);
      replyMap.value[targetId] = res?.list || [];
    } else {
      finished.value = false;
      await loadPage(1);
    }
  } catch (err) {
    uni.showToast({ title: (err as Error).message || '发表失败', icon: 'none' });
  } finally {
    submitting.value = false;
  }
}

function confirmDelete(item: LiuyanItem) {
  uni.showModal({
    title: '删除留言',
    content: '确定删除这条留言吗？',
    success: (res) => {
      if (res.confirm) doDelete(item);
    },
  });
}

async function doDelete(item: LiuyanItem) {
  try {
    await apiLiuyanShanchu(item.sopliuyanid);
    uni.showToast({ title: '已删除', icon: 'none' });
    // 本地移除（含其回复）后重新拉取首页，避免分页错位
    list.value = list.value.filter((it) => it.sopliuyanid !== item.sopliuyanid);
    finished.value = false;
    await loadPage(1);
  } catch (err) {
    uni.showToast({ title: (err as Error).message || '删除失败', icon: 'none' });
  }
}

onLoad((options) => {
  if (!requireLogin()) return;
  const lx = Number(options?.leixing || LIUYAN_LEIXING.EXCHANGE);
  leixing.value = lx === LIUYAN_LEIXING.MESSAGE ? LIUYAN_LEIXING.MESSAGE : LIUYAN_LEIXING.EXCHANGE;
  tuwenid.value = Number(options?.tuwenid || 0);

  const title = options?.title ? decodeURIComponent(options.title) : '';
  pageTitle.value = title || (leixing.value === LIUYAN_LEIXING.MESSAGE ? '留言' : '党员交流');
  uni.setNavigationBarTitle({ title: pageTitle.value });

  if (leixing.value === LIUYAN_LEIXING.MESSAGE && !tuwenid.value) {
    loadError.value = '缺少图文参数';
    return;
  }
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
  <view class="message-page">
    <!-- 加载失败 -->
    <view
      v-if="loadError && !list.length"
      class="message-page__error"
    >
      <AppEmpty
        title="加载失败"
        :description="loadError"
      />
      <AppButton
        class="message-page__retry"
        type="primary"
        @click="retry"
      >
        重新加载
      </AppButton>
    </view>

    <template v-else>
      <view
        v-for="item in roots"
        :key="item.sopliuyanid"
        class="message-page__card"
      >
        <view class="message-page__head">
          <view class="message-page__avatar">
            <text class="message-page__avatar-text">
              {{ (item.xingming || '党').slice(0, 1) }}
            </text>
          </view>
          <view class="message-page__meta">
            <text class="message-page__name">
              {{ item.xingming || '党员干部' }}
            </text>
            <text class="message-page__date">
              {{ formatDate(item.riqi) }}
            </text>
          </view>
          <text
            v-if="isMine(item)"
            class="message-page__delete"
            @tap="confirmDelete(item)"
          >
            删除
          </text>
        </view>

        <text class="message-page__content">
          {{ item.neirong }}
        </text>

        <view class="message-page__actions">
          <text
            class="message-page__action"
            @tap="toggleReplies(item)"
          >
            {{ replyOpen[item.sopliuyanid] ? '收起回复' : '查看回复' }}
            <text
              v-if="replyCount(item)"
            >
              （{{ replyCount(item) }}）
            </text>
          </text>
          <text
            class="message-page__action"
            @tap="startReply(item)"
          >
            回复
          </text>
        </view>

        <!-- 回复列表（按需拉取） -->
        <view
          v-if="replyOpen[item.sopliuyanid]"
          class="message-page__replies"
        >
          <view
            v-for="reply in replyMap[item.sopliuyanid] || []"
            :key="reply.sopliuyanid"
            class="message-page__reply"
          >
            <view class="message-page__reply-head">
              <text class="message-page__reply-name">
                {{ reply.xingming || '党员干部' }}
              </text>
              <text class="message-page__reply-date">
                {{ formatDate(reply.riqi) }}
              </text>
            </view>
            <text class="message-page__reply-content">
              {{ reply.neirong }}
            </text>
            <view class="message-page__reply-actions">
              <text
                class="message-page__action"
                @tap="startReply(reply)"
              >
                回复
              </text>
              <text
                v-if="isMine(reply)"
                class="message-page__action message-page__action--danger"
                @tap="confirmDelete(reply)"
              >
                删除
              </text>
            </view>
          </view>

          <text
            v-if="replyLoading[item.sopliuyanid]"
            class="message-page__reply-empty"
          >
            加载中…
          </text>
          <text
            v-else-if="!replyCount(item)"
            class="message-page__reply-empty"
          >
            暂无回复
          </text>
        </view>
      </view>

      <AppEmpty
        v-if="!loading && !roots.length && !loadError"
        title="暂无留言"
        description="发表第一条留言，和同志们交流吧"
      />

      <view
        v-if="loading"
        class="message-page__tip"
      >
        <text class="message-page__tip-text">
          加载中…
        </text>
      </view>
      <view
        v-else-if="finished && roots.length"
        class="message-page__tip"
      >
        <text class="message-page__tip-text">
          没有更多了
        </text>
      </view>
    </template>

    <!-- 发布 / 回复 -->
    <view class="message-page__editor">
      <view
        v-if="replyTarget"
        class="message-page__reply-hint"
      >
        <text class="message-page__reply-hint-text">
          回复 @{{ replyTarget.name }}
        </text>
        <text
          class="message-page__reply-hint-cancel"
          @tap="cancelReply"
        >
          取消
        </text>
      </view>
      <view class="message-page__editor-row">
        <input
          v-model="draft"
          class="message-page__input"
          type="text"
          :placeholder="replyTarget ? `回复 @${replyTarget.name}` : '说点什么…'"
          confirm-type="send"
          maxlength="3000"
          @confirm="submit"
        >
        <AppButton
          class="message-page__submit"
          type="primary"
          size="small"
          :disabled="submitting"
          @click="submit"
        >
          {{ submitting ? '发送中' : '发送' }}
        </AppButton>
      </view>
    </view>
    <view class="message-page__editor-placeholder" />
  </view>
</template>

<style lang="scss" scoped>
.message-page {
  min-height: 100vh;
  background: $color-bg-page;
  padding: $section-margin $page-gutter 0;
  box-sizing: border-box;
}

.message-page__card {
  padding: $comp-card-padding;
  margin-bottom: $section-margin;
  background: $color-bg-card;
  border-radius: $radius-md;
  box-shadow: $shadow-1;
}

.message-page__head {
  display: flex;
  align-items: center;
}

.message-page__avatar {
  @include flex-center;
  width: $comp-avatar-size-sm;
  height: $comp-avatar-size-sm;
  background: $color-primary-soft;
  border-radius: $comp-avatar-radius;
}

.message-page__avatar-text {
  font-size: $font-md;
  font-weight: $font-weight-semibold;
  color: $color-primary;
}

.message-page__meta {
  display: flex;
  flex: 1;
  flex-direction: column;
  margin-left: $spacing-md;
  min-width: 0;
}

.message-page__name {
  font-size: $font-md;
  font-weight: $font-weight-medium;
  color: $color-text-primary;
}

.message-page__date {
  margin-top: $spacing-xs;
  font-size: $font-xs;
  color: $color-text-tertiary;
}

.message-page__delete {
  padding: $spacing-xs $spacing-sm;
  font-size: $font-sm;
  color: $color-error-text;
}

.message-page__content {
  display: block;
  margin-top: $spacing-md;
  font-size: $font-md;
  line-height: $line-height-relaxed;
  color: $color-text-primary;
  word-break: break-all;
}

.message-page__actions {
  display: flex;
  align-items: center;
  margin-top: $spacing-md;
}

.message-page__action {
  margin-right: $spacing-xl;
  font-size: $font-sm;
  color: $color-text-secondary;

  &--danger {
    color: $color-error-text;
  }
}

.message-page__replies {
  padding: $spacing-md;
  margin-top: $spacing-md;
  background: $color-bg-page;
  border-radius: $radius-sm;
}

.message-page__reply {
  padding-bottom: $spacing-md;
  margin-bottom: $spacing-md;
  border-bottom: $comp-hairline-width solid $color-border-light;

  &:last-child {
    padding-bottom: 0;
    margin-bottom: 0;
    border-bottom: none;
  }
}

.message-page__reply-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.message-page__reply-name {
  font-size: $font-sm;
  font-weight: $font-weight-medium;
  color: $color-text-primary;
}

.message-page__reply-date {
  font-size: $font-xs;
  color: $color-text-tertiary;
}

.message-page__reply-content {
  display: block;
  margin-top: $spacing-xs;
  font-size: $font-sm;
  line-height: $line-height-normal;
  color: $color-text-secondary;
  word-break: break-all;
}

.message-page__reply-actions {
  display: flex;
  align-items: center;
  margin-top: $spacing-xs;
}

.message-page__reply-empty {
  font-size: $font-sm;
  color: $color-text-tertiary;
}

.message-page__editor {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: $z-sticky;
  padding: $spacing-md $page-gutter;
  padding-bottom: calc(#{$spacing-md} + env(safe-area-inset-bottom));
  background: $color-bg-card;
  border-top: $comp-hairline-width solid $color-border-light;
}

.message-page__editor-placeholder {
  height: 140rpx;
}

.message-page__reply-hint {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $spacing-sm;
}

.message-page__reply-hint-text {
  font-size: $font-sm;
  color: $color-primary;
}

.message-page__reply-hint-cancel {
  font-size: $font-sm;
  color: $color-text-secondary;
}

.message-page__editor-row {
  display: flex;
  align-items: center;
}

.message-page__input {
  flex: 1;
  height: $comp-input-height;
  padding: 0 $comp-input-padding-x;
  font-size: $comp-input-font-size;
  color: $color-text-primary;
  background: $color-bg-tertiary;
  border-radius: $comp-input-radius;
}

.message-page__submit {
  margin-left: $spacing-md;
}

.message-page__error {
  padding-top: $spacing-4xl;
}

.message-page__retry {
  display: flex;
  width: 240rpx;
  margin: 0 auto;
}

.message-page__tip {
  @include flex-center;
  padding: $spacing-lg 0;

  .message-page__tip-text {
    font-size: $font-sm;
    color: $color-text-tertiary;
  }
}
</style>
