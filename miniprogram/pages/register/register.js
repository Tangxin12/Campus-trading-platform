Page({
  data: {
    username: '',
    password: '',
    confirmPassword: '',
    nickname: '',
    passwordVisible: false,
    confirmPasswordVisible: false,
    agreementChecked: false
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
  
  // 确认密码输入变化
  onConfirmPasswordChange: function(e) {
    this.setData({
      confirmPassword: e.detail.value
    });
  },
  
  // 昵称输入变化
  onNicknameChange: function(e) {
    this.setData({
      nickname: e.detail.value
    });
  },
  
  // 切换密码可见性
  togglePasswordVisible: function() {
    this.setData({
      passwordVisible: !this.data.passwordVisible
    });
  },
  
  // 切换确认密码可见性
  toggleConfirmPasswordVisible: function() {
    this.setData({
      confirmPasswordVisible: !this.data.confirmPasswordVisible
    });
  },
  
  // 协议勾选变化
  onAgreementChange: function(e) {
    this.setData({
      agreementChecked: e.detail.value.includes('agreement')
    });
  },
  
  // 注册
  register: function() {
    const { username, password, confirmPassword, nickname, agreementChecked } = this.data;
    
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
        title: '请设置密码',
        icon: 'none'
      });
      return;
    }
    
    if (password.length < 6 || password.length > 20) {
      wx.showToast({
        title: '密码长度应在6-20位之间',
        icon: 'none'
      });
      return;
    }
    
    if (password !== confirmPassword) {
      wx.showToast({
        title: '两次输入的密码不一致',
        icon: 'none'
      });
      return;
    }
    
    if (!nickname) {
      wx.showToast({
        title: '请设置昵称',
        icon: 'none'
      });
      return;
    }
    
    if (!agreementChecked) {
      wx.showToast({
        title: '请阅读并同意用户协议和隐私政策',
        icon: 'none'
      });
      return;
    }
    
    // 显示加载状态
    wx.showLoading({
      title: '注册中...',
      mask: true
    });
    
    // 调用注册云函数
    wx.cloud.callFunction({
      name: 'register',
      data: {
        username,
        password,
        nickname
      },
      success: res => {
        wx.hideLoading();
        if (res.result.success) {
          wx.showToast({
            title: '注册成功',
            icon: 'success'
          });
          
          // 跳转到登录页面
          setTimeout(() => {
            wx.navigateTo({
              url: '../login/login'
            });
          }, 1500);
        } else {
          wx.showToast({
            title: res.result.message || '注册失败',
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
        console.error('注册失败:', err);
      }
    });
  },
  
  // 跳转到登录页面
  goLogin: function() {
    wx.navigateTo({
      url: '../login/login'
    });
  },
  
  // 跳转到用户协议页面
  goUserAgreement: function() {
    wx.showToast({
      title: '用户协议页面暂未开放',
      icon: 'none'
    });
  },
  
  // 跳转到隐私政策页面
  goPrivacyPolicy: function() {
    wx.showToast({
      title: '隐私政策页面暂未开放',
      icon: 'none'
    });
  }
});
