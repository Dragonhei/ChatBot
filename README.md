# 智能聊天机器人系统

一个基于DeepSeek API的智能聊天机器人系统，包含前后端完整实现，支持实时对话、用户认证和消息历史记录等功能。本项目采用前后端分离架构，提供流畅的用户体验和强大的AI对话能力。

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

## 系统架构

项目采用前后端分离架构：

- **chatbot-frontend**：Vue 3开发的前端应用
- **chatbot-backend**：Node.js开发的后端服务

### 数据流向

1. 用户在前端输入消息
2. 消息通过Socket.io或HTTP请求发送到后端
3. 后端调用DeepSeek API获取AI回复
4. 回复通过Socket.io或HTTP响应返回给前端
5. 所有对话记录保存到MongoDB或内存存储中

## 安装与配置

### 环境要求

- Node.js 14.0+
- MongoDB (可选，支持内存存储模式)
- DeepSeek API密钥

### 后端配置

1. 进入后端目录：

```bash
cd chatbot-backend
```

2. 安装依赖：

```bash
npm install
```

3. 创建`.env`文件，配置环境变量：

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/chatbot
JWT_SECRET=your_jwt_secret_key
DEEPSEEK_API_KEY=your_deepseek_api_key
```

4. 启动服务：

```bash
npm run dev
```

### 前端配置

1. 进入前端目录：

```bash
cd chatbot-frontend
```

2. 安装依赖：

```bash
npm install
```

3. 启动开发服务器：

```bash
npm run dev
```

## 使用说明

### 用户注册与登录

1. 访问前端应用（默认为 http://localhost:5173）
2. 首次使用需要注册账号
3. 使用注册的邮箱和密码登录系统

### 聊天功能

- 在输入框中输入消息，按回车键或点击发送按钮
- 系统会实时显示AI的回复
- 历史消息会自动加载显示

## API文档

### 认证API

- `POST /api/register` - 用户注册
  - 请求体：`{ username, email, password }`
  - 响应：`{ user, token }`

- `POST /api/login` - 用户登录
  - 请求体：`{ email, password }`
  - 响应：`{ user, token }`

### 消息API

- `POST /api/message` - 发送消息（需要认证）
  - 请求头：`Authorization: Bearer {token}`
  - 请求体：`{ message }`
  - 响应：`{ response }`

- `GET /api/messages/history` - 获取消息历史（需要认证）
  - 请求头：`Authorization: Bearer {token}`
  - 查询参数：`limit`, `skip`
  - 响应：消息数组

### WebSocket事件

- `connection` - 建立连接（需要认证）
- `sendMessage` - 发送消息
- `receiveMessage` - 接收消息
- `disconnect` - 断开连接

## 数据存储

系统支持两种数据存储模式：

1. **MongoDB存储**：生产环境推荐，持久化存储所有用户和消息数据
2. **内存存储**：当MongoDB连接失败时自动启用，适用于开发和测试环境

## 安全特性

- 密码加密存储（bcrypt）
- JWT令牌认证
- 请求验证和错误处理

## 扩展与定制

- 可通过修改`deepseekService.js`更换其他AI服务提供商
- 可自定义系统提示词，调整AI回复风格
- 支持添加更多用户属性和消息类型

## 许可证

ISC License