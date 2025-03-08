<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <img src="/vite.svg" alt="Logo" class="auth-logo">
        <h2 class="auth-title">{{ isLogin ? '登录' : '注册' }}</h2>
        <p class="auth-subtitle">欢迎使用智能聊天机器人</p>
      </div>
      
      <el-form :model="formData" :rules="rules" ref="authForm" @submit.prevent class="auth-form">
        <!-- 注册时显示用户名字段 -->
        <el-form-item v-if="!isLogin" prop="username" label="用户名">
          <el-input 
            v-model="formData.username" 
            placeholder="请输入用户名" 
            prefix-icon="el-icon-user"
            size="large"
          ></el-input>
        </el-form-item>
        
        <el-form-item prop="email" label="邮箱">
          <el-input 
            v-model="formData.email" 
            placeholder="请输入邮箱" 
            prefix-icon="el-icon-message"
            size="large"
          ></el-input>
        </el-form-item>
        
        <el-form-item prop="password" label="密码">
          <el-input 
            v-model="formData.password" 
            type="password" 
            placeholder="请输入密码" 
            show-password 
            prefix-icon="el-icon-lock"
            size="large"
          ></el-input>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" :loading="loading" class="auth-button" @click="submitForm" size="large">
            {{ isLogin ? '登录' : '注册' }}
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="auth-switch">
        {{ isLogin ? '还没有账号？' : '已有账号？' }}
        <a href="javascript:;" @click="toggleAuthMode">{{ isLogin ? '立即注册' : '立即登录' }}</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { ElMessage } from 'element-plus';
import axios from 'axios';
import { useRouter } from 'vue-router';

const props = defineProps({
  onSuccess: Function
});

const emit = defineEmits(['login-success']);

const router = useRouter();
const authForm = ref(null);
const loading = ref(false);
const isLogin = ref(true);

const formData = reactive({
  username: '',
  email: '',
  password: ''
});

const rules = reactive({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度应在3到20个字符之间', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少为6个字符', trigger: 'blur' }
  ]
});

const API_URL = 'http://localhost:3000';

const toggleAuthMode = () => {
  isLogin.value = !isLogin.value;
};

const submitForm = async () => {
  if (!authForm.value) return;
  
  await authForm.value.validate(async (valid) => {
    if (!valid) return;
    
    loading.value = true;
    
    try {
      const endpoint = isLogin.value ? '/api/login' : '/api/register';
      const response = await axios.post(`${API_URL}${endpoint}`, formData);
      
      // 保存令牌到本地存储
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      ElMessage.success({
        message: isLogin.value ? '登录成功' : '注册成功',
        type: 'success',
        duration: 2000
      });
      
      // 触发登录成功事件
      emit('login-success', response.data);
      
      // 确保在状态更新后再跳转
      setTimeout(() => {
        router.push('/');
      }, 300);
    } catch (error) {
      console.error('认证失败:', error);
      const errorMessage = error.response?.data?.error || '认证失败，请稍后重试';
      ElMessage.error(errorMessage);
    } finally {
      loading.value = false;
    }
  });
};
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%);
  padding: 1rem;
}

.auth-card {
  width: 100%;
  max-width: 400px;
  padding: 2.5rem;
  border-radius: 16px;
  background-color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
  backdrop-filter: blur(10px);
  transition: transform 0.3s ease;
}

.auth-card:hover {
  transform: translateY(-5px);
}

.auth-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.auth-logo {
  width: 60px;
  height: 60px;
  margin-bottom: 1rem;
}

.auth-title {
  text-align: center;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 600;
}

.auth-subtitle {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
}

.auth-form {
  margin-bottom: 1rem;
}

.auth-button {
  width: 100%;
  padding: 12px;
  font-size: 16px;
  border-radius: 8px;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  border: none;
  color: white;
  font-weight: 600;
  transition: all 0.3s ease;
}

.auth-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(79, 172, 254, 0.4);
}

.auth-button:active {
  transform: translateY(0);
}

.auth-switch {
  text-align: center;
  margin-top: 1.5rem;
  font-size: 14px;
  color: #666;
  padding: 1rem;
  border-top: 1px solid #eee;
}

.auth-switch a {
  color: #4facfe;
  text-decoration: none;
  margin-left: 5px;
  font-weight: 500;
  transition: color 0.3s ease;
}

.auth-switch a:hover {
  color: #00f2fe;
}

@media (max-width: 768px) {
  .auth-card {
    max-width: 90%;
    padding: 1.5rem;
  }
}
</style>