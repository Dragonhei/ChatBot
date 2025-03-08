# 智能聊天机器人系统

一个基于DeepSeek API的智能聊天机器人系统，包含前后端完整实现，支持实时对话、用户认证和消息历史记录等功能。

## 项目预览

![项目预览](./preview.png)

## 功能特点

- **智能对话**：集成DeepSeek API，提供智能、自然的对话体验
- **实时通信**：基于Socket.io的实时消息传输
- **用户认证**：完整的注册、登录功能，JWT令牌认证
- **消息存储**：支持MongoDB数据库和内存存储两种模式
- **消息历史**：自动加载和显示历史对话记录
- **响应式设计**：适配不同设备屏幕的前端界面

## 技术栈

### 后端

- **Node.js** + **Express**：RESTful API服务
- **Socket.io**：实时双向通信
- **MongoDB** + **Mongoose**：数据持久化
- **JWT**：用户认证
- **Axios**：HTTP请求处理
- **Bcrypt**：密码加密

### 前端

- **Vue 3**：响应式UI框架
- **Vite**：构建工具
- **Element Plus**：UI组件库
- **Vue Router**：前端路由
- **Pinia**：状态管理
- **Socket.io Client**：实时通信客户端
- **Axios**：HTTP请求

## 快速开始

### 环境要求

- Node.js 14.0+
- MongoDB (可选，支持内存存储模式)
- DeepSeek API密钥

### 安装与配置

1. 克隆仓库

```bash
git clone https://github.com/yourusername/chatbot-system.git
cd chatbot-system
```

2. 后端配置

```bash
cd chatbot-backend
npm install
```

创建`.env`文件，配置环境变量：

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/chatbot
JWT_SECRET=your_jwt_secret_key
DEEPSEEK_API_KEY=your_deepseek_api_key
```

3. 前端配置

```bash
cd ../chatbot-frontend
npm install
```

### 启动应用

1. 启动后端服务

```bash
cd chatbot-backend
npm run dev
```

2. 启动前端应用

```bash
cd chatbot-frontend
npm run dev
```

访问 http://localhost:5173 即可使用应用

## 贡献指南

1. Fork 本仓库
2. 创建您的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开一个 Pull Request

## 许可证

ISC License

## 联系方式

如有任何问题或建议，请通过 Issues 与我们联系。