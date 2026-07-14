Page({
  data: {
    username: '',
    password: '',
    passwordVisible: false
  },
  
  onLoad: function () {
    // 页面加载时的初始化操作
  },
  
  // 用户名输入变化
  onUsernameChange: function(e) {
    this.setData({
      username: e.detail.value
    });
  },
  
  // 密码输入变化
  onPasswordChange: function(e) {
    this.setData({
      password: e.detail.value
    });
  },
  
  // 切换密码可见性
  togglePasswordVisible: function() {
    this.setData({
      passwordVisible: !this.data.passwordVisible
    });
  },
  
  // 登录
  login: function() {
    const { username, password } = this.data;
    
    // 表单验证
    if (!username) {
      wx.showToast({
        title: '请输入用户名',
        icon: 'none'
      });
      return;
    }
    
    if (!password) {
      wx.showToast({
        title: '请输入密码',
        icon: 'none'
      });
      return;
    }
    
    // 显示加载状态
    wx.showLoading({
      title: '登录中...',
      mask: true
    });
    
    // 调用登录云函数
    wx.cloud.callFunction({
      name: 'login',
      data: {
        username,
        password
      },
      success: res => {
        wx.hideLoading();
        if (res.result.success) {
          // 登录成功，存储用户信息
          wx.setStorageSync('userInfo', res.result.userInfo);
          wx.setStorageSync('token', res.result.token);
          
          wx.showToast({
            title: '登录成功',
            icon: 'success'
          });
          
          // 跳转到首页
          setTimeout(() => {
            wx.switchTab({
              url: '../index/index'
            });
          }, 1500);
        } else {
          wx.showToast({
            title: res.result.message || '登录失败',
            icon: 'none'
          });
        }
      },
      fail: err => {
        wx.hideLoading();
        wx.showToast({
          title: '网络错误，请稍后重试',
          icon: 'none'
        });
        console.error('登录失败:', err);
      }
    });
  },
  
  // 跳转到忘记密码页面
  goForgotPassword: function() {
    wx.showToast({
      title: '忘记密码功能暂未开放',
      icon: 'none'
    });
  },
  
  // 跳转到注册页面
  goRegister: function() {
    wx.navigateTo({
      url: '../register/register'
    });
  }
});
