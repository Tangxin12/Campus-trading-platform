// login/index.js
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
  const { username, password } = event;
  
  try {
    // 验证参数
    if (!username || !password) {
      return {
        success: false,
        message: '缺少必要参数'
      };
    }
    
    // 查找用户（使用用户名登录）
    const query = { username };
    
    // 查找用户
    const user = await usersCollection.where(query).get();
    if (user.data.length === 0) {
      return {
        success: false,
        message: '账号或密码错误'
      };
    }
    
    // 验证密码
    const hashedPassword = hashPassword(password);
    if (user.data[0].password !== hashedPassword) {
      return {
        success: false,
        message: '账号或密码错误'
      };
    }
    
    // 生成新的token
    const token = generateToken();
    
    // 更新用户token
    await usersCollection.doc(user.data[0]._id).update({
      data: {
        token,
        updatedAt: new Date()
      }
    });
    
    // 返回成功结果
    return {
      success: true,
      message: '登录成功',
      userInfo: {
        _id: user.data[0]._id,
        username: user.data[0].username,
        nickname: user.data[0].nickname,
        avatar: user.data[0].avatar || '',
        isVerified: user.data[0].isVerified || false,
        college: user.data[0].college || '',
        major: user.data[0].major || '',
        studentId: user.data[0].studentId || '',
        phone: user.data[0].phone || '',
        exchangeCount: user.data[0].exchangeCount || 0,
        publishCount: user.data[0].publishCount || 0
      },
      token
    };
    
  } catch (error) {
    console.error('登录失败:', error);
    return {
      success: false,
      message: '登录失败，请稍后重试'
    };
  }
};
