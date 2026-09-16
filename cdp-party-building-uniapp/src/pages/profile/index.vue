<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import AppInput from '@/components/AppInput/AppInput.vue';
import AppButton from '@/components/AppButton/AppButton.vue';
import AppPopup from '@/components/AppPopup/AppPopup.vue';
import { useUserStore } from '@/stores/modules/user';
import { requireLogin, logout, updateAvatar } from '@/services/auth.service';
import { apiUserinfo, apiXiugaimima, apiTouxiang, type LoginResult } from '@/api/modules/user';
import { encryptPassword } from '@/utils/md5';
import { setCredentials } from '@/utils/auth';
import { chooseImage } from '@/utils/platform-image';
import { resolveFileUrl } from '@/api/modules/tuwen';

const userStore = useUserStore();

// ---------------------------------------------------------------------------
// 菜单（对照 prototype/个人中心.jpg 八项；未实现项点击提示，不 mock 数据）
// ---------------------------------------------------------------------------
interface MenuItem {
  key: string;
  label: string;
  icon: string;
  /** available = 已实现/后续批次解锁；blocked = 接口缺失暂不实现 */
  status: 'available' | 'blocked';
  tip: string;
}

const menuItems: MenuItem[] = [
  { key: 'favorite', label: '我的收藏', icon: '/static/icons/star-favorite-red.png', status: 'blocked', tip: '我的收藏即将上线' },
  { key: 'history', label: '浏览记录', icon: '/static/icons/history-folder-orange.png', status: 'blocked', tip: '浏览记录即将上线' },
  { key: 'activity', label: '我的活动', icon: '/static/icons/my-activity-star-purple.png', status: 'blocked', tip: '活动报名签到暂未开放' },
  { key: 'report', label: '思想汇报', icon: '/static/icons/thought-report-red.png', status: 'blocked', tip: '思想汇报暂未开放' },
  { key: 'ledger', label: '学习台账', icon: '/static/icons/study-ledger-purple.png', status: 'blocked', tip: '学习台账暂未开放' },
  { key: 'archive', label: '我的档案', icon: '/static/icons/my-archive-orange.png', status: 'available', tip: '' },
  { key: 'manual', label: '数智党建手册', icon: '/static/icons/manual-book-green.png', status: 'blocked', tip: '数智党建手册暂未开放' },
  { key: 'knowledge', label: '应知应会', icon: '/static/icons/knowledge-doc-blue.png', status: 'blocked', tip: '应知应会暂未开放' },
];

function onMenuTap(item: MenuItem) {
  if (item.status === 'available' && item.key === 'archive') {
    // 我的档案（feat-012）：档案详情仅本人可见
    uni.navigateTo({ url: '/pages/archive-detail/index' });
    return;
  }
  uni.showToast({ title: item.tip, icon: 'none' });
}

// ---------------------------------------------------------------------------
// 用户信息
// ---------------------------------------------------------------------------
const displayName = computed(() => userStore.displayName || '未登录');
const branchName = computed(() => userStore.userInfo?.bumenming || '');
const avatarUrl = computed(() => {
  const remote = userStore.avatar;
  if (!remote) return '/static/avatar-placeholder.png';
  return /^https?:\/\//i.test(remote) ? remote : resolveFileUrl('', remote);
});

const statusBarHeight = ref(0);
statusBarHeight.value = uni.getSystemInfoSync().statusBarHeight || 0;

async function refreshUserInfo() {
  if (!userStore.isLogin) return;
  try {
    const res = await apiUserinfo();
    if (res.obj) {
      const info: LoginResult = res.obj;
      userStore.setLoginState(userStore.token, {
        yonghuid: info.yonghuid,
        dengluming: info.dengluming,
        yonghuxingming: info.yonghuxingming || userStore.userInfo?.yonghuxingming || '',
        jueseid: info.jueseid,
        jueseming: info.jueseming,
        bumenid: info.bumenid,
        bumenming: info.bumenming || userStore.userInfo?.bumenming || '',
        qiyong: info.qiyong,
        touxiang: info.touxiang ?? userStore.userInfo?.touxiang ?? null,
      });
    }
  } catch {
    // 静默失败：展示本地缓存信息
  }
}

onShow(() => {
  if (!requireLogin()) return;
  refreshUserInfo();
});

// ---------------------------------------------------------------------------
// 修改头像
// ---------------------------------------------------------------------------
async function handleChangeAvatar() {
  try {
    const paths = await chooseImage(1);
    const filePath = paths[0];
    if (!filePath) return;
    uni.showLoading({ title: '上传中…' });
    const res = await apiTouxiang(filePath);
    uni.hideLoading();
    if (res.obj) {
      updateAvatar(res.obj);
      uni.showToast({ title: '头像已更新', icon: 'success' });
    }
  } catch (err) {
    uni.hideLoading();
    uni.showToast({ title: (err as Error).message || '头像更新失败', icon: 'none' });
  }
}

// ---------------------------------------------------------------------------
// 修改密码（apiuser/xiugaimima：token + mima，≥6 位）
// ---------------------------------------------------------------------------
const pwdPopupVisible = ref(false);
const newPassword = ref('');
const newPasswordError = ref('');
const changingPwd = ref(false);

function openPwdPopup() {
  newPassword.value = '';
  newPasswordError.value = '';
  pwdPopupVisible.value = true;
}

async function handleChangePassword() {
  if (changingPwd.value) return;
  const pwd = newPassword.value;
  if (!pwd || pwd.length < 6) {
    newPasswordError.value = '密码不能小于6位';
    return;
  }
  newPasswordError.value = '';
  changingPwd.value = true;
  try {
    const encrypted = encryptPassword(pwd);
    await apiXiugaimima(encrypted);
    // 同步更新本地续期凭据（加密形态，不存明文）
    setCredentials({ username: userStore.userInfo?.dengluming || '', password: encrypted });
    pwdPopupVisible.value = false;
    uni.showToast({ title: '保存成功', icon: 'success' });
  } catch (err) {
    uni.showToast({ title: (err as Error).message || '修改失败', icon: 'none' });
  } finally {
    changingPwd.value = false;
  }
}

// ---------------------------------------------------------------------------
// 退出登录
// ---------------------------------------------------------------------------
function handleLogout() {
  uni.showModal({
    title: '退出登录',
    content: '确定退出当前账号吗？',
    success: (res) => {
      if (res.confirm) {
        logout();
      }
    },
  });
}
</script>

<template>
  <view class="profile-page">
    <!-- 红色头部 + 用户区（prototype/个人中心.jpg @0–264） -->
    <view
      class="profile-page__header"
      :style="{ paddingTop: `${statusBarHeight}px` }"
    >
      <view class="profile-page__nav">
        <text class="profile-page__nav-title">
          个人中心
        </text>
        <text
          class="profile-page__nav-edit"
          @tap="onMenuTap({ key: 'edit', label: '编辑', icon: '', status: 'blocked', tip: '账号信息修改暂未开放' })"
        >
          编辑
        </text>
      </view>

      <view class="profile-page__user">
        <image
          class="profile-page__avatar"
          :src="avatarUrl"
          mode="aspectFill"
          @tap="handleChangeAvatar"
        />
        <view class="profile-page__user-meta">
          <text class="profile-page__name">
            {{ displayName }}
          </text>
          <text
            v-if="branchName"
            class="profile-page__branch"
          >
            {{ branchName }}
          </text>
          <text
            class="profile-page__avatar-tip"
            @tap="handleChangeAvatar"
          >
            点击头像更换
          </text>
        </view>
      </view>
    </view>

    <!-- 积分卡（暖底；积分体系暂未开放，禁止假数据） -->
    <view class="profile-page__points">
      <view class="profile-page__points-left">
        <text class="profile-page__points-label">
          我的积分
        </text>
        <text class="profile-page__points-value">
          —
        </text>
        <text class="profile-page__points-note">
          积分体系暂未开放
        </text>
      </view>
      <view class="profile-page__points-divider" />
      <view class="profile-page__points-right">
        <text class="profile-page__points-label">
          支部排名
        </text>
        <text class="profile-page__points-value">
          —
        </text>
        <text class="profile-page__points-note">
          随积分体系一并开放
        </text>
      </view>
    </view>

    <!-- 菜单列表（8 项） -->
    <view class="profile-page__menu">
      <view
        v-for="item in menuItems"
        :key="item.key"
        class="profile-page__menu-item"
        @tap="onMenuTap(item)"
      >
        <image
          class="profile-page__menu-icon"
          :src="item.icon"
          mode="aspectFit"
        />
        <text class="profile-page__menu-label">
          {{ item.label }}
        </text>
        <image
          class="profile-page__menu-arrow"
          src="/static/icons/arrow-right-gray.png"
          mode="aspectFit"
        />
      </view>
    </view>

    <!-- 账号操作 -->
    <view class="profile-page__menu profile-page__menu--account">
      <view
        class="profile-page__menu-item"
        @tap="openPwdPopup"
      >
        <image
          class="profile-page__menu-icon"
          src="/static/icons/favorite-bookmark.png"
          mode="aspectFit"
        />
        <text class="profile-page__menu-label">
          修改密码
        </text>
        <image
          class="profile-page__menu-arrow"
          src="/static/icons/arrow-right-gray.png"
          mode="aspectFit"
        />
      </view>
      <view
        class="profile-page__menu-item"
        @tap="handleLogout"
      >
        <text class="profile-page__menu-label profile-page__menu-label--danger profile-page__menu-label--no-icon">
          退出登录
        </text>
      </view>
    </view>

    <!-- 修改密码弹窗 -->
    <AppPopup
      v-model="pwdPopupVisible"
      position="center"
      title="修改密码"
    >
      <AppInput
        v-model="newPassword"
        label="新密码"
        type="password"
        placeholder="请输入不少于6位的新密码"
        :error="newPasswordError"
      />
      <AppButton
        class="profile-page__pwd-submit"
        type="primary"
        :disabled="changingPwd"
        @click="handleChangePassword"
      >
        {{ changingPwd ? '提交中…' : '确定' }}
      </AppButton>
    </AppPopup>

    <view class="safe-area-bottom" />
  </view>
</template>

<style lang="scss" scoped>
.profile-page {
  min-height: 100vh;
  background: $color-bg-page-alt;
}

.profile-page__header {
  background: $color-primary;
}

.profile-page__nav {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: $comp-navbar-height;

  .profile-page__nav-title {
    font-size: $comp-navbar-title-size;
    font-weight: $font-weight-semibold;
    color: $comp-navbar-title-color;
  }

  .profile-page__nav-edit {
    position: absolute;
    right: $page-gutter;
    font-size: $font-sm;
    color: $color-text-inverse;
    padding: $spacing-xs $spacing-sm;
  }
}

.profile-page__user {
  display: flex;
  align-items: center;
  padding: $spacing-lg $page-gutter $spacing-3xl;

  .profile-page__avatar {
    width: $comp-avatar-size-lg;
    height: $comp-avatar-size-lg;
    border-radius: $comp-avatar-radius;
    border: $comp-avatar-border-width solid $comp-avatar-border-color;
    background: $comp-avatar-bg;
  }

  .profile-page__user-meta {
    display: flex;
    flex-direction: column;
    margin-left: $spacing-lg;
  }

  .profile-page__name {
    font-size: $font-xl;
    font-weight: $font-weight-bold;
    color: $color-text-inverse;
  }

  .profile-page__branch {
    margin-top: $spacing-xs;
    font-size: $font-sm;
    color: $color-text-inverse;
    opacity: 0.9;
  }

  .profile-page__avatar-tip {
    margin-top: $spacing-xs;
    font-size: $font-xs;
    color: $color-text-inverse;
    opacity: 0.7;
  }
}

.profile-page__points {
  display: flex;
  align-items: stretch;
  margin: -$spacing-3xl $page-gutter 0;
  padding: $spacing-lg $spacing-xl;
  background: $color-bg-warm;
  border: $comp-hairline-width solid $color-gold-light;
  border-radius: $radius-md;
  position: relative;
  z-index: 1;

  .profile-page__points-left,
  .profile-page__points-right {
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
  }

  .profile-page__points-divider {
    width: $comp-hairline-width;
    background: $color-border-light;
  }

  .profile-page__points-label {
    font-size: $font-sm;
    color: $color-text-secondary;
  }

  .profile-page__points-value {
    margin-top: $spacing-xs;
    font-size: $font-xxl;
    font-weight: $font-weight-bold;
    font-family: $font-family-number;
    color: $color-gold-dark;
  }

  .profile-page__points-note {
    margin-top: $spacing-xs;
    font-size: $font-xs;
    color: $color-text-tertiary;
  }
}

.profile-page__menu {
  margin: $section-margin $page-gutter 0;
  background: $color-bg-card;
  border-radius: $radius-md;
  overflow: hidden;

  &--account {
    margin-bottom: $spacing-2xl;
  }
}

.profile-page__menu-item {
  display: flex;
  align-items: center;
  min-height: $comp-list-item-min-height;
  padding: $comp-list-item-padding-y $comp-list-item-padding-x;
  border-bottom: $comp-list-item-border-width solid $color-border-light;

  &:last-child {
    border-bottom: none;
  }

  &:active {
    background: $color-bg-tertiary;
  }
}

.profile-page__menu-icon {
  width: $comp-list-item-icon-size;
  height: $comp-list-item-icon-size;
}

.profile-page__menu-label {
  flex: 1;
  margin-left: $comp-list-item-icon-gap;
  font-size: $comp-list-item-title-size;
  color: $color-text-primary;

  &--danger {
    color: $color-error-text;
  }

  &--no-icon {
    margin-left: 0;
  }
}

.profile-page__menu-arrow {
  width: $comp-list-item-arrow-size;
  height: $comp-list-item-arrow-size;
}

.profile-page__pwd-submit {
  display: flex;
  width: 100%;
  margin-top: $spacing-xl;
}
</style>
