const jwt = require('jsonwebtoken');
const User = require('../models/User');
const connectDB = require('../config/database');
const bcrypt = require('bcrypt');

// JWT密钥，应该存储在环境变量中
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

class AuthService {
  constructor() {
    // 初始化时获取数据库连接
    this.dbConnection = null;
    this.initDB();
  }

  async initDB() {
    this.dbConnection = await connectDB();
  }
  
  /**
   * 生成JWT令牌
   * @param {Object} user - 用户对象
   * @returns {String} - JWT令牌
   */
  generateToken(user) {
    const payload = {
      id: user._id,
      username: user.username,
      email: user.email
    };
    
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
  }
  
  /**
   * 验证JWT令牌
   * @param {String} token - JWT令牌
   * @returns {Object} - 解码后的用户信息
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('无效的令牌');
    }
  }
  
  /**
   * 注册新用户
   * @param {Object} userData - 用户注册数据
   * @returns {Object} - 注册成功的用户和令牌
   */
  async register(userData) {
    try {
      // 检查是否使用内存存储
      if (this.dbConnection && this.dbConnection.connection.host === 'memory-storage') {
        // 检查用户名是否已存在
        const existingUsername = this.dbConnection.memoryDB.users.find(u => u.username === userData.username);
        if (existingUsername) {
          throw new Error('用户名已被使用');
        }
        
        // 检查邮箱是否已存在
        const existingEmail = this.dbConnection.memoryDB.users.find(u => u.email === userData.email);
        if (existingEmail) {
          throw new Error('邮箱已被注册');
        }
        
        // 生成盐值并哈希密码
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);
        
        // 创建新用户
        const user = {
          _id: Date.now().toString(),
          username: userData.username,
          email: userData.email,
          password: hashedPassword,
          avatar: '',
          createdAt: new Date(),
          lastLogin: null
        };
        
        // 添加到内存存储
        this.dbConnection.memoryDB.users.push(user);
        
        // 生成令牌
        const token = this.generateToken(user);
        
        return {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            createdAt: user.createdAt
          },
          token
        };
      } else {
        // 使用MongoDB
        // 检查用户名是否已存在
        const existingUsername = await User.findOne({ username: userData.username });
        if (existingUsername) {
          throw new Error('用户名已被使用');
        }
        
        // 检查邮箱是否已存在
        const existingEmail = await User.findOne({ email: userData.email });
        if (existingEmail) {
          throw new Error('邮箱已被注册');
        }
        
        // 创建新用户
        const user = new User(userData);
        await user.save();
        
        // 生成令牌
        const token = this.generateToken(user);
        
        return {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            createdAt: user.createdAt
          },
          token
        };
      }
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * 用户登录
   * @param {String} email - 用户邮箱
   * @param {String} password - 用户密码
   * @returns {Object} - 登录成功的用户和令牌
   */
  async login(email, password) {
    try {
      let user;
      
      // 检查是否使用内存存储
      if (this.dbConnection && this.dbConnection.connection.host === 'memory-storage') {
        // 查找用户
        user = this.dbConnection.memoryDB.users.find(u => u.email === email);
        if (!user) {
          throw new Error('用户不存在');
        }
        
        // 验证密码
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          throw new Error('密码错误');
        }
        
        // 更新最后登录时间
        user.lastLogin = new Date();
      } else {
        // 使用MongoDB
        // 查找用户
        user = await User.findOne({ email });
        if (!user) {
          throw new Error('用户不存在');
        }
        
        // 验证密码
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
          throw new Error('密码错误');
        }
        
        // 更新最后登录时间
        user.lastLogin = new Date();
        await user.save();
      }
      
      // 生成令牌
      const token = this.generateToken(user);
      
      return {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        },
        token
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new AuthService();