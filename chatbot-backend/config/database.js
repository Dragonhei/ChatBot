const mongoose = require('mongoose');
const dotenv = require('dotenv');

// 确保环境变量已加载
dotenv.config();

// 获取MongoDB连接URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot';

// 内存数据存储（用于在没有MongoDB的情况下运行）
const memoryDB = {
  users: [],
  messages: []
};

// 连接MongoDB数据库或使用内存存储
const connectDB = async () => {
  try {
    // 尝试连接MongoDB
    const conn = await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`MongoDB 连接成功: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB 连接失败: ${error.message}`);
    console.log('使用内存存储作为备选方案');
    return { connection: { host: 'memory-storage' }, memoryDB };
  }
};

module.exports = connectDB;