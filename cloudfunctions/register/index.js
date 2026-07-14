// register/index.js
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const usersCollection = db.collection('users');

// 密码加密函数
function hashPassword(password) {
  // 这里使用简单的加密方式，实际项目中应该使用更安全的加密算法
  return require('crypto').createHash('md5').update(password).digest('hex');
}

// 生成随机token
function generateToken() {
  return require('crypto').randomBytes(32).toString('hex');
}

exports.main = async (event, context) => {
  const { username, password, nickname } = event;
  
  try {
    // 验证参数
    if (!username || !password || !nickname) {
      return {
        success: false,
        message: '缺少必要参数'
      };
    }
    
    // 验证密码长度
    if (password.length < 6 || password.length > 20) {
      return {
        success: false,
        message: '密码长度应在6-20位之间'
      };
    }
    
    // 检查用户是否已存在
    const existingUser = await usersCollection.where({ username }).get();
    if (existingUser.data.length > 0) {
      return {
        success: false,
        message: '该用户名已注册'
      };
    }
    
    // 加密密码
    const hashedPassword = hashPassword(password);
    
    // 生成token
    const token = generateToken();
    
    // 获取openid
    const wxContext = cloud.getWXContext();
    
    // 创建用户记录
    const userInfo = {
      username,
      nickname,
      password: hashedPassword,
      token,
      avatar: '',
      isVerified: false,
      exchangeCount: 0,
      publishCount: 0,
      _openid: wxContext.OPENID,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // 插入用户记录
    const result = await usersCollection.add({
      data: userInfo
    });
    
    // 返回成功结果
    return {
      success: true,
      message: '注册成功',
      userInfo: {
        _id: result._id,
        username,
        nickname,
        avatar: '',
        isVerified: false,
        exchangeCount: 0,
        publishCount: 0
      },
      token
    };
    
  } catch (error) {
    console.error('注册失败:', error);
    return {
      success: false,
      message: '注册失败，请稍后重试'
    };
  }
};
