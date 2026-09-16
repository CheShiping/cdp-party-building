<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app';
import { bootstrap } from '@/services/auth.service';

onLaunch(() => {
  // 启动引导：恢复登录态；token 超过一天则静默重新获取（feat-003）
  bootstrap().then(({ needLogin }) => {
    if (!needLogin) return;
    const pages = getCurrentPages();
    const currentRoute = pages.length ? `/${pages[pages.length - 1]!.route}` : '';
    if (currentRoute !== '/pages/login/index') {
      uni.reLaunch({ url: '/pages/login/index' });
    }
  });

  // #ifdef MP-WEIXIN
  // 版本更新检查（仅微信小程序）
  const updateManager = uni.getUpdateManager();
  updateManager.onUpdateReady(() => {
    uni.showModal({
      title: '更新提示',
      content: '新版本已准备好，是否重启应用？',
      success: (res) => {
        if (res.confirm) {
          updateManager.applyUpdate();
        }
      },
    });
  });
  // #endif
});

// 说明：onShow/onHide 的调试日志已移除（feat-017 审计：生产环境不输出无意义日志）
</script>

<style lang="scss">
@import '@/styles/global.scss';
</style>
