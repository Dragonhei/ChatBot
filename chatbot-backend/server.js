const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const deepseekService = require('./services/deepseekService');
const authService = require('./services/authService');
const messageService = require('./services/messageService');

// 加载环境变量
dotenv.config();

// 连接到MongoDB数据库
connectDB().then(() => {
  console.log('已连接到MongoDB数据库');
}).catch(err => {
  console.error('数据库连接失败:', err.message);
});

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// JWT验证中间件
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    
    try {
      // 使用authService验证JWT令牌
      const decoded = authService.verifyToken(token);
      req.user = decoded; // 包含用户ID和其他信息
      next();
    } catch (error) {
      return res.status(403).json({ error: '无效的令牌' });
    }
  } else {
    return res.status(401).json({ error: '未提供认证令牌' });
  }
};

// 路由
app.get('/', (req, res) => {
  res.send('ChatBot API 正在运行');
});

// 用户认证路由
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: '请提供所有必要的注册信息' });
    }
    
    // 使用authService注册新用户
    const result = await authService.register({ username, email, password });
    
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: '请提供邮箱和密码' });
    }
    
    // 使用authService进行用户登录
    const result = await authService.login(email, password);
    
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// 智能消息API（需要认证）
app.post('/api/message', authenticateJWT, async (req, res) => {
  const { message } = req.body;
  const userId = req.user.id;
  
  try {
    // 保存用户消息到MongoDB
    await messageService.saveMessage(userId, message, 'user');
    
    // 调用DeepSeek API获取智能回复
    const response = await deepseekService.generateResponse(message);
    
    // 保存机器人回复到MongoDB
    await messageService.saveMessage(userId, response, 'bot');
    
    res.json({ response });
  } catch (error) {
    console.error('处理消息失败:', error);
    res.status(500).json({ error: '无法获取AI回复，请稍后重试' });
  }
});

// 获取消息历史
app.get('/api/messages/history', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    const skip = parseInt(req.query.skip) || 0;
    
    // 从MongoDB获取消息历史
    const userMessages = await messageService.getUserMessages(userId, limit, skip);
    res.json(userMessages);
  } catch (error) {
    console.error('获取消息历史失败:', error);
    res.status(500).json({ error: '获取消息历史失败' });
  }
});

// Socket.io 连接处理
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('未提供认证令牌'));
  }
  
  try {
    // 使用authService验证JWT令牌
    const decoded = authService.verifyToken(token);
    socket.user = decoded; // 包含用户ID和其他信息
    next();
  } catch (error) {
    next(new Error('无效的令牌'));
  }
});

io.on('connection', (socket) => {
  console.log('用户已连接:', socket.id);
  
  socket.on('sendMessage', async (message) => {
    console.log('收到消息:', message);
    
    try {
      const userId = socket.user.id;
      
      // 保存用户消息到MongoDB
      await messageService.saveMessage(userId, message, 'user');
      
      // 调用DeepSeek API获取智能回复
      const reply = await deepseekService.generateResponse(message);
      
      // 保存机器人回复到MongoDB
      await messageService.saveMessage(userId, reply, 'bot');
      
      // 发送回复给客户端
      socket.emit('receiveMessage', reply);
    } catch (error) {
      console.error('处理Socket消息失败:', error);
      socket.emit('receiveMessage', '抱歉，我暂时无法回答，请稍后再试。');
    }
  });
  
  socket.on('disconnect', () => {
    console.log('用户已断开连接:', socket.id);
  });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});