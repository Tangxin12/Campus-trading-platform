Page({
  data: {
    userInfo: {
        _id: '', // 新增：必须保留用户ID
        username: '昵称',
        nickname: '', // 新增：和编辑页字段对齐
        avatar: '',
        isVerified: false,
        college: '', // 新增：学院
        major: '',   // 新增：专业
        studentId: '', // 新增：学号
        phone: '',   // 新增：手机号
        exchangeCount: 0,
        publishCount: 0
    }
  },
  
  onLoad: function () {
    // 页面加载时获取用户信息
    this.getUserInfo();
  },
  
  // 获取用户信息
  getUserInfo: function() {
    // 从本地存储获取用户信息
    const userInfo = wx.getStorageSync('userInfo');
    
    if (userInfo) {
      this.setData({ userInfo });
    } else {
      // 如果没有用户信息，使用默认数据
      const defaultUserInfo = {
        username: '昵称',
        avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=user%20avatar%20placeholder%20circular%20portrait&image_size=square',
        isVerified: false,
        exchangeCount: 0,
        publishCount: 0
      };
      this.setData({ userInfo: defaultUserInfo });
    }
  },
  
  // 显示更多选项
  showMore: function() {
    wx.showActionSheet({
      itemList: ['分享给朋友', '举报', '反馈'],
      success: function(res) {
        console.log(res.tapIndex);
      },
      fail: function(res) {
        console.log(res.errMsg);
      }
    });
  },
  
  // 跳转到设置页面
  goSettings: function() {
    wx.showToast({
      title: '跳转到设置页面',
      icon: 'none'
    });
  },
  
  // 选择头像
  chooseAvatar: function() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePaths = res.tempFilePaths;
        
        wx.showLoading({
          title: '上传中...',
          mask: true
        });
        
        // 上传图片到云存储
        wx.cloud.uploadFile({
          cloudPath: 'avatars/' + Date.now() + '.jpg',
          filePath: tempFilePaths[0],
          success: (uploadResult) => {
            console.log('【调试】头像上传成功:', uploadResult);
            
            // 更新用户信息
            const userInfo = this.data.userInfo;
            userInfo.avatar = uploadResult.fileID;
            
            this.setData({ userInfo });
            
            // 保存到本地存储
            wx.setStorageSync('userInfo', userInfo);
            
            // 调用云函数更新数据库中的用户信息
            wx.cloud.callFunction({
              name: 'exchangeFunctions',
              data: {
                type: 'updateUserInfo',
                userInfo: userInfo
              }
            }).then(res => {
              console.log('【调试】更新用户头像结果:', res);
            }).catch(err => {
              console.error('【调试】更新用户头像失败:', err);
            });
            
            wx.showToast({
              title: '头像更新成功',
              icon: 'success'
            });
          },
          fail: (err) => {
            console.error('【调试】头像上传失败:', err);
            wx.showToast({
              title: '上传失败，请重试',
              icon: 'none'
            });
          },
          complete: () => {
            wx.hideLoading();
          }
        });
      },
      fail: (err) => {
        console.error('【调试】选择头像失败:', err);
      }
    });
  },
  
  // 编辑资料
  editProfile: function() {
    wx.navigateTo({
      url: '../profile/profile'
    });
  },
  
  // 查看置换数
  viewExchangeCount: function() {
    wx.showToast({
      title: '查看我的置换记录',
      icon: 'none'
    });
  },
  
  // 查看发布数
  viewPublishCount: function() {
    wx.showToast({
      title: '查看我的发布记录',
      icon: 'none'
    });
  },
  
  // 查看我的发布
  viewMyPublish: function() {
    wx.navigateTo({
      url: '../myPublish/myPublish'
    });
  },
  
  // 查看我的匹配
  viewMyMatch: function() {
    wx.showToast({
      title: '查看我的匹配',
      icon: 'none'
    });
  },
  
  // 查看我的收藏
  viewMyCollection: function() {
    wx.navigateTo({
      url: '../myCollection/myCollection'
    });
  },
  
  // 查看我的订单
  viewMyOrders: function() {
    wx.navigateTo({
      url: '../myOrders/myOrders'
    });
  },
  
  // 查看我的求换
  viewMyRequest: function() {
    wx.showToast({
      title: '查看我的求换',
      icon: 'none'
    });
  },
  
  // 查看我的消息
  viewMyMessage: function() {
    wx.showToast({
      title: '跳转到消息页面',
      icon: 'none'
    });
  },
  
  // 校园认证
  goVerification: function() {
    wx.navigateTo({
      url: '../profile/profile?scrollTo=verification'
    });
  },
  
  // 地址管理
  goAddressManagement: function() {
    wx.showToast({
      title: '跳转到地址管理页面',
      icon: 'none'
    });
  },
  
  // 帮助中心
  goHelpCenter: function() {
    wx.showToast({
      title: '跳转到帮助中心页面',
      icon: 'none'
    });
  },
  
  // 意见反馈
  goFeedback: function() {
    wx.showToast({
      title: '跳转到意见反馈页面',
      icon: 'none'
    });
  },
  
  // 置换规则指南
  goExchangeRules: function() {
    wx.showToast({
      title: '跳转到置换规则指南页面',
      icon: 'none'
    });
  },
  
  // 防欺诈提醒
  goAntiFraud: function() {
    wx.showToast({
      title: '跳转到防欺诈提醒页面',
      icon: 'none'
    });
  },
  
  // 关于我们
  goAboutUs: function() {
    wx.showToast({
      title: '跳转到关于我们页面',
      icon: 'none'
    });
  },
  
  // 退出登录
  logout: function() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: function(res) {
        if (res.confirm) {
          // 清除登录状态
          wx.removeStorageSync('userInfo');
          wx.removeStorageSync('token');
          
          wx.showToast({
            title: '已退出登录',
            icon: 'none'
          });
          
          // 跳转到登录页面
          setTimeout(() => {
            wx.navigateTo({
              url: '../login/login'
            });
          }, 1500);
        }
      }
    });
  }
});
