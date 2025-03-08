const axios = require('axios');
const dotenv = require('dotenv');

// 确保环境变量已加载
dotenv.config();

class DeepSeekService {
  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY;
    if (!this.apiKey) {
      console.error('DeepSeek API密钥未设置，请在.env文件中配置DEEPSEEK_API_KEY');
    }

    this.apiUrl = 'https://api.deepseek.com/v1/chat/completions';
    this.client = axios.create({
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * 发送消息到DeepSeek API并获取回复
   * @param {string} userMessage - 用户发送的消息
   * @returns {Promise<string>} - DeepSeek的回复
   */
  async generateResponse(userMessage) {
    try {
      const response = await this.client.post(this.apiUrl, {
        model: 'deepseek-reasoner', // 使用DeepSeek的聊天模型
        messages: [
          { role: 'system', content: '你是一个有帮助的AI助手，请提供友好、准确的回答。' },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      // 从响应中提取AI的回复
      if (response.data && response.data.choices && response.data.choices.length > 0) {
        return response.data.choices[0].message.content;
      } else {
        throw new Error('无效的API响应格式');
      }
    } catch (error) {
      console.error('调用DeepSeek API失败:', error.message);
      if (error.response) {
        console.error('API响应状态:', error.response.status);
        console.error('API响应数据:', error.response.data);
      }
      throw new Error(`无法获取AI回复: ${error.message}`);
    }
  }
}

module.exports = new DeepSeekService();