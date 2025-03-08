const Message = require('../models/Message');
const connectDB = require('../config/database');
const mongoose = require('mongoose');

class MessageService {
  constructor() {
    // 初始化时获取数据库连接
    this.dbConnection = null;
    this.initDB();
  }

  async initDB() {
    this.dbConnection = await connectDB();
  }

  /**
   * 保存消息到数据库或内存存储
   * @param {String} userId - 用户ID
   * @param {String} content - 消息内容
   * @param {String} type - 消息类型 (user/bot)
   * @returns {Object} - 保存的消息对象
   */
  async saveMessage(userId, content, type) {
    try {
      // 检查是否使用内存存储
      if (this.dbConnection && this.dbConnection.connection.host === 'memory-storage') {
        const message = {
          _id: Date.now().toString(),
          userId,
          content,
          type,
          timestamp: new Date()
        };
        
        this.dbConnection.memoryDB.messages.push(message);
        return message;
      } else {
        // 使用MongoDB
        // 检查userId是否为字符串格式，如果是，则转换为MongoDB可接受的格式
        let processedUserId = userId;
        
        // 如果userId是字符串但不是有效的ObjectId格式，则使用内存存储方式
        if (typeof userId === 'string' && !mongoose.Types.ObjectId.isValid(userId)) {
          const message = {
            _id: Date.now().toString(),
            userId,
            content,
            type,
            timestamp: new Date()
          };
          
          // 如果memoryDB不存在，初始化它
          if (!this.dbConnection.memoryDB) {
            this.dbConnection.memoryDB = { messages: [] };
          }
          
          this.dbConnection.memoryDB.messages.push(message);
          return message;
        }
        
        const message = new Message({
          userId: processedUserId,
          content,
          type,
          timestamp: new Date()
        });
        
        await message.save();
        return message;
      }
    } catch (error) {
      console.error('保存消息失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取用户的消息历史
   * @param {String} userId - 用户ID
   * @param {Number} limit - 限制返回的消息数量
   * @param {Number} skip - 跳过的消息数量，用于分页
   * @returns {Array} - 消息历史数组
   */
  async getUserMessages(userId, limit = 50, skip = 0) {
    try {
      // 检查是否使用内存存储
      if (this.dbConnection && this.dbConnection.connection.host === 'memory-storage') {
        const allMessages = this.dbConnection.memoryDB.messages.filter(msg => msg.userId === userId);
        const sortedMessages = allMessages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const paginatedMessages = sortedMessages.slice(skip, skip + limit);
        return paginatedMessages.reverse(); // 返回按时间正序排列的消息
      } else {
        // 使用MongoDB
        // 检查userId是否为字符串格式且不是有效的ObjectId
        if (typeof userId === 'string' && !mongoose.Types.ObjectId.isValid(userId)) {
          // 如果userId不是有效的ObjectId，使用内存存储中的消息
          if (this.dbConnection.memoryDB && this.dbConnection.memoryDB.messages) {
            const allMessages = this.dbConnection.memoryDB.messages.filter(msg => msg.userId === userId);
            const sortedMessages = allMessages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            const paginatedMessages = sortedMessages.slice(skip, skip + limit);
            return paginatedMessages.reverse(); // 返回按时间正序排列的消息
          }
          return []; // 如果没有内存存储或消息，返回空数组
        }
        
        // 使用MongoDB查询
        const messages = await Message.find({ userId })
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limit)
          .lean();
        
        return messages.reverse(); // 返回按时间正序排列的消息
      }
    } catch (error) {
      console.error('获取用户消息历史失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取用户的最近对话
   * @param {String} userId - 用户ID
   * @param {Number} count - 返回的消息对数
   * @returns {Array} - 最近的对话消息数组
   */
  async getRecentConversation(userId, count = 10) {
    try {
      // 检查userId是否为字符串格式且不是有效的ObjectId
      if (typeof userId === 'string' && !mongoose.Types.ObjectId.isValid(userId)) {
        // 如果userId不是有效的ObjectId，使用内存存储中的消息
        if (this.dbConnection.memoryDB && this.dbConnection.memoryDB.messages) {
          const allMessages = this.dbConnection.memoryDB.messages.filter(msg => msg.userId === userId);
          const sortedMessages = allMessages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          const limitedMessages = sortedMessages.slice(0, count * 2); // 获取用户和机器人消息对
          return limitedMessages.reverse(); // 返回按时间正序排列的消息
        }
        return []; // 如果没有内存存储或消息，返回空数组
      }
      
      // 使用MongoDB查询
      const messages = await Message.find({ userId })
        .sort({ timestamp: -1 })
        .limit(count * 2) // 获取用户和机器人消息对
        .lean();
      
      return messages.reverse(); // 返回按时间正序排列的消息
    } catch (error) {
      console.error('获取最近对话失败:', error);
      throw error;
    }
  }
  
  /**
   * 删除用户的所有消息
   * @param {String} userId - 用户ID
   * @returns {Object} - 删除操作结果
   */
  async deleteUserMessages(userId) {
    try {
      const result = await Message.deleteMany({ userId });
      return result;
    } catch (error) {
      console.error('删除用户消息失败:', error);
      throw error;
    }
  }
}

module.exports = new MessageService();