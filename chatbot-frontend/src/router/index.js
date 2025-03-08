import { createRouter, createWebHistory } from 'vue-router';
import ChatBox from '../components/ChatBox.vue';
import LoginForm from '../components/LoginForm.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: ChatBox,
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginForm
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 导航守卫，检查用户是否已登录
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  
  if (to.matched.some(record => record.meta.requiresAuth)) {
    // 需要认证的路由
    if (!token) {
      // 未登录，重定向到登录页
      next({ name: 'Login' });
    } else {
      // 已登录，允许访问
      next();
    }
  } else {
    // 不需要认证的路由，直接访问
    next();
  }
});

export default router;