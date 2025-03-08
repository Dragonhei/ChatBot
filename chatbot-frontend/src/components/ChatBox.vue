<template>
  <div class="chat-container">
    <div class="chat-header">
      <div class="header-left">
        <h2>智能聊天机器人</h2>
      </div>
      <div class="user-info" v-if="user">
        <el-avatar :size="32" :src="user.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'"></el-avatar>
        <span class="username">{{ user.username }}</span>
        <el-button type="primary" @click="logout" size="small" plain>退出</el-button>
      </div>
    </div>
    
    <div class="chat-messages" ref="messagesContainer">
      <el-empty v-if="messages.length === 0" description="暂无消息，开始聊天吧！" />
      <div v-for="(msg, index) in messages" :key="index" :class="['message', msg.type]">
        <div class="message-avatar" v-if="msg.type === 'user' || msg.type === 'bot'">
          <el-avatar :size="36" v-if="msg.type === 'user'" :src="user?.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'"></el-avatar>
          <el-avatar :size="36" v-else icon="el-icon-s-custom" class="bot-avatar">AI</el-avatar>
        </div>
        <div class="message-bubble">
          <div class="message-content" v-if="msg.type !== 'bot'" v-html="renderMarkdown(msg.content)"></div>
          <TypewriterEffect v-else :content="msg.content" :key="index" @complete="onTypewriterComplete" />
          <div class="message-time">{{ formatTime(msg.timestamp) }}</div>
        </div>
      </div>
      <div v-if="loading" class="message bot loading">
        <div class="message-avatar">
          <el-avatar :size="36" class="bot-avatar">AI</el-avatar>
        </div>
        <div class="message-bubble">
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="chat-input">
      <el-input
        v-model="newMessage"
        placeholder="请输入消息..."
        @keyup.enter="sendMessage"
        :disabled="loading"
        class="message-input"
        clearable
      >
        <template #append>
          <el-button @click="sendMessage" :loading="loading" type="primary" class="send-button" :disabled="!newMessage.trim()">
            <el-icon><el-icon-position /></el-icon> 发送
          </el-button>
        </template>
      </el-input>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, onBeforeUnmount, computed } from 'vue';
import { ElMessage } from 'element-plus';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useRouter } from 'vue-router';
import { marked } from 'marked';
import TypewriterEffect from './TypewriterEffect.vue';

const API_URL = 'http://localhost:3000';
const socket = ref(null);
const messages = ref([]);
const newMessage = ref('');
const loading = ref(false);
const messagesContainer = ref(null);
const router = useRouter();

// 获取用户信息
const user = computed(() => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
});

// 初始化Socket.io连接
const initSocket = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/login');
    return;
  }
  
  socket.value = io(API_URL, {
    auth: { token }
  });
  
  socket.value.on('connect', () => {
    console.log('已连接到服务器');
    messages.value.push({
      content: '已连接到聊天服务器',
      type: 'system',
      timestamp: new Date()
    });
    
    // 连接成功后加载历史消息
    loadMessageHistory();
  });
  
  socket.value.on('connect_error', (error) => {
    console.error('连接错误:', error);
    if (error.message.includes('认证')) {
      ElMessage.error('认证失败，请重新登录');
      logout();
    }
  });
  
  socket.value.on('receiveMessage', (message) => {
    messages.value.push({
      content: message,
      type: 'bot',
      timestamp: new Date()
    });
    scrollToBottom();
    loading.value = false;
  });
  
  socket.value.on('disconnect', () => {
    console.log('与服务器断开连接');
    messages.value.push({
      content: '与服务器断开连接',
      type: 'system',
      timestamp: new Date()
    });
  });
};

// 加载历史消息
const loadMessageHistory = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    const response = await axios.get(`${API_URL}/api/messages/history`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data && response.data.length > 0) {
      // 清空欢迎消息
      messages.value = [];
      
      // 添加历史消息
      response.data.forEach(msg => {
        messages.value.push({
          content: msg.content,
          type: msg.type,
          timestamp: new Date(msg.timestamp)
        });
      });
      
      scrollToBottom();
    }
  } catch (error) {
    console.error('加载历史消息失败:', error);
    if (error.response && error.response.status === 401) {
      ElMessage.error('认证已过期，请重新登录');
      logout();
    }
  }
};

// 发送消息
const sendMessage = async () => {
  if (!newMessage.value.trim()) return;
  
  const messageText = newMessage.value;
  newMessage.value = '';
  loading.value = true;
  
  // 添加用户消息到聊天记录
  messages.value.push({
    content: messageText,
    type: 'user',
    timestamp: new Date()
  });
  
  scrollToBottom();
  
  try {
    if (socket.value && socket.value.connected) {
      // 使用Socket.io发送消息
      socket.value.emit('sendMessage', messageText);
    } else {
      // 使用REST API作为备选
      const token = localStorage.getItem('token');
      if (!token) {
        ElMessage.error('未登录或会话已过期');
        router.push('/login');
        return;
      }
      
      const response = await axios.post(`${API_URL}/api/message`, 
        { message: messageText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      messages.value.push({
        content: response.data.response,
        type: 'bot',
        timestamp: new Date()
      });
      scrollToBottom();
      loading.value = false;
    }
  } catch (error) {
    console.error('发送消息失败:', error);
    if (error.response && error.response.status === 401) {
      ElMessage.error('认证已过期，请重新登录');
      logout();
    } else {
      ElMessage.error('发送消息失败，请稍后重试');
    }
    loading.value = false;
  }
};

// 退出登录
const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  router.push('/login');
};

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
};

// 格式化时间
const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// 渲染Markdown
const renderMarkdown = (text) => {
  return marked(text);
};

// 打字机效果完成回调
const onTypewriterComplete = () => {
  console.log('打字效果完成');
  // 可以在这里添加额外的逻辑，比如播放声音等
};

onMounted(() => {
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/login');
    return;
  }
  
  initSocket();
  
  // 添加欢迎消息
  messages.value.push({
    content: '你好！我是智能助手，有什么可以帮助你的吗？',
    type: 'bot',
    timestamp: new Date()
  });
});

onBeforeUnmount(() => {
  if (socket.value) {
    socket.value.disconnect();
  }
});
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  background-color: #f9fafb;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  position: relative;
  transition: all 0.3s ease;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.75rem;
  background-color: #ffffff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
  position: relative;
  z-index: 10;
}

.header-left h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
  font-weight: 600;
  background: linear-gradient(90deg, #4361ee, #3a0ca3);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.username {
  font-weight: 500;
  color: #333;
}

.chat-messages {
  flex: 1;
  padding: 1.75rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  background-color: #f9fafb;
  background-image: radial-gradient(#e9ecef 1px, transparent 1px);
  background-size: 25px 25px;
  scroll-behavior: smooth;
}

.message {
  display: flex;
  margin-bottom: 1.25rem;
  max-width: 70%;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.message.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message.bot {
  align-self: flex-start;
}

.message.system {
  align-self: center;
  background-color: rgba(0, 0, 0, 0.04);
  padding: 0.5rem 1.25rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  color: #666;
  max-width: 50%;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.02);
}

.message-avatar {
  margin: 0 0.75rem;
  align-self: flex-start;
}

.bot-avatar {
  background: linear-gradient(135deg, #4361ee, #3a0ca3) !important;
  color: white;
  font-weight: 600;
}

.message-bubble {
  padding: 1rem 1.25rem;
  border-radius: 1.25rem;
  max-width: calc(100% - 3.5rem);
  word-break: break-word;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
}

.user .message-bubble {
  background: linear-gradient(135deg, #4361ee, #3a0ca3);
  color: white;
  border-top-right-radius: 4px;
}

.bot .message-bubble {
  background-color: #ffffff;
  color: #333;
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-top-left-radius: 4px;
}

.message-content {
  line-height: 1.6;
  font-size: 1rem;
}

.message-time {
  font-size: 0.75rem;
  color: #999;
  margin-top: 0.5rem;
  text-align: right;
}

.user .message-time {
  color: rgba(255, 255, 255, 0.8);
}

.chat-input {
  padding: 1.25rem 1.75rem;
  background-color: #ffffff;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 -4px 15px rgba(0, 0, 0, 0.03);
  position: relative;
  z-index: 10;
}

.message-input {
  width: 100%;
}

.message-input :deep(.el-input__wrapper) {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border-radius: 8px;
  padding: 0.5rem;
  transition: all 0.3s ease;
}

.message-input :deep(.el-input__wrapper:hover) {
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.send-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(90deg, #4361ee, #3a0ca3);
  border: none;
  transition: all 0.3s ease;
}

.send-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(67, 97, 238, 0.3);
}

/* 打字指示器样式 */
.typing-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 0;
}

.typing-indicator span {
  height: 8px;
  width: 8px;
  margin: 0 2px;
  background-color: #4361ee;
  border-radius: 50%;
  display: inline-block;
  animation: bounce 1.5s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) {
  animation-delay: 0s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes bounce {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-6px);
  }
}

/* 响应式设计 */
@media (max-width: 1400px) {
  .chat-container {
    max-width: 90%;
    margin: 1rem auto;
    height: calc(100vh - 2rem);
  }
}

@media (max-width: 768px) {
  .chat-container {
    max-width: 100%;
    margin: 0;
    height: 100vh;
    border-radius: 0;
    box-shadow: none;
  }

  .chat-header {
    padding: 0.75rem 1rem;
  }

  .header-left h2 {
    font-size: 1.25rem;
  }

  .message {
    max-width: 85%;
  }

  .user-info .username {
    display: none;
  }

  .chat-messages {
    padding: 1rem;
    background-size: 20px 20px;
  }

  .message-bubble {
    padding: 0.75rem 1rem;
  }

  .chat-input {
    padding: 0.75rem 1rem;
  }
}

@media (max-width: 480px) {
  .message {
    max-width: 90%;
  }

  .message-content {
    font-size: 0.875rem;
  }
  
  .message-avatar {
    margin: 0 0.5rem;
  }
  
  .bot-avatar, .user .el-avatar {
    transform: scale(0.9);
  }
}
</style>