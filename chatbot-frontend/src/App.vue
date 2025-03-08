<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import ChatBox from './components/ChatBox.vue';
import LoginForm from './components/LoginForm.vue';

const router = useRouter();
const isAuthenticated = ref(false);

const handleLoginSuccess = (data) => {
  isAuthenticated.value = true;
  // 确保在设置完认证状态后再跳转
  setTimeout(() => {
    router.push('/');
  }, 100);
};

onMounted(() => {
  // 检查本地存储中是否有token
  const token = localStorage.getItem('token');
  if (token) {
    isAuthenticated.value = true;
    router.push('/');
  } else {
    router.push('/login');
  }
});
</script>

<template>
  <div class="app-container">
    <router-view v-slot="{ Component }">
      <component :is="Component" @login-success="handleLoginSuccess" />
    </router-view>
  </div>
</template>

<style>
:root {
  --primary-color: #4361ee;
  --secondary-color: #3f37c9;
  --accent-color: #4895ef;
  --text-color: #333;
  --bg-color: #f8f9fa;
  --card-bg: #ffffff;
  --border-radius: 12px;
  --box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  background-color: var(--bg-color);
  color: var(--text-color);
  line-height: 1.6;
  min-height: 100vh;
  margin: 0;
  padding: 0;
}

.app-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .app-container {
    padding: 0;
  }
}

@media (min-width: 769px) {
  .app-container {
    max-width: 100%;
    margin: 0 auto;
  }
}
</style>
