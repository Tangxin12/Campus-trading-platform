Page({
  data: {
    userInfo: {
      _id: '',
      nickname: '',
      username: '',
      avatar: '',
      phone: '',
      isVerified: false,
      college: '',
      major: '',
      studentId: ''
    },
    password: '',
    confirmPassword: ''
  },
  
  onLoad: function(options) {
    this.getUserInfo();
    
    if (options.scrollTo === 'verification') {
      setTimeout(() => {
        wx.createSelectorQuery().select('#verification-section').boundingClientRect((rect) => {
          if (rect) {
            wx.pageScrollTo({
              scrollTop: rect.top - 100,
              duration: 300
            });
          }
        }).exec();
      }, 500);
    }
  },
  
  getUserInfo: function() {
    const userInfo = wx.getStorageSync('userInfo');
    
    if (userInfo && userInfo._id) {
      this.convertAvatarUrl(userInfo).then(convertedUserInfo => {
        this.setData({ userInfo: convertedUserInfo });
      });
    } else {
      const defaultUserInfo = {
        _id: '',
        nickname: '昵称',
        username: '',
        avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=user%20avatar%20placeholder%20circular%20portrait&image_size=square',
        phone: '',
        isVerified: false,
        college: '',
        major: '',
        studentId: ''
      };
      this.setData({ userInfo: defaultUserInfo });
      wx.showToast({
        title: '请先完成登录',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateTo({
          url: '../login/login'
        });
      }, 1500);
    }
  },
  
  getTempFileUrl: function(fileID) {
    return new Promise((resolve, reject) => {
      if (!fileID || !fileID.startsWith('cloud://')) {
        resolve(fileID);
        return;
      }
      
      wx.cloud.callFunction({
        name: 'getTempFileUrl',
        data: { fileID: fileID }
      }).then(res => {
        if (res.result.success) {
          resolve(res.result.tempFileURL);
        } else {
          reject(new Error(res.result.message || '获取临时链接失败'));
        }
      }).catch(err => {
        reject(new Error('云函数调用失败: ' + err.message));
      });
    });
  },
  
  convertAvatarUrl: async function(userInfo) {
    const convertedUserInfo = Object.assign({}, userInfo);
    
    if (convertedUserInfo.avatar && convertedUserInfo.avatar.startsWith('cloud://')) {
      try {
        convertedUserInfo.avatar = await this.getTempFileUrl(convertedUserInfo.avatar);
      } catch (err) {
        console.error('转换头像URL失败:', err);
        convertedUserInfo.avatar = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=user%20avatar%20placeholder%20circular%20portrait&image_size=square';
      }
    }
    
    return convertedUserInfo;
  },
  
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
        
        wx.cloud.uploadFile({
          cloudPath: 'avatars/' + Date.now() + '.jpg',
          filePath: tempFilePaths[0],
          success: (uploadResult) => {
            const userInfo = this.data.userInfo;
            userInfo.avatar = uploadResult.fileID;
            
            this.setData({ userInfo });
            wx.setStorageSync('userInfo', userInfo);
            
            wx.cloud.callFunction({
              name: 'exchangeFunctions',
              data: {
                type: 'updateUserInfo',
                userInfo: userInfo
              }
            }).then(res => {
              console.log('头像更新结果:', res);
            }).catch(err => {
              console.error('头像更新失败:', err);
            });
            
            wx.showToast({
              title: '头像更新成功',
              icon: 'success'
            });
          },
          fail: (err) => {
            console.error('头像上传失败:', err);
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
        console.error('选择头像失败:', err);
      }
    });
  },
  
  onNicknameChange: function(e) {
    const userInfo = this.data.userInfo;
    userInfo.username = e.detail.value;
    this.setData({ userInfo });
  },
  
  onCollegeChange: function(e) {
    const userInfo = this.data.userInfo;
    userInfo.college = e.detail.value;
    this.setData({ userInfo });
  },
  
  onMajorChange: function(e) {
    const userInfo = this.data.userInfo;
    userInfo.major = e.detail.value;
    this.setData({ userInfo });
  },
  
  onStudentIdChange: function(e) {
    const userInfo = this.data.userInfo;
    userInfo.studentId = e.detail.value;
    this.setData({ userInfo });
  },
  
  onPhoneChange: function(e) {
    const userInfo = this.data.userInfo;
    userInfo.phone = e.detail.value;
    this.setData({ userInfo });
  },
  
  onPasswordChange: function(e) {
    this.setData({ password: e.detail.value });
  },
  
  onConfirmPasswordChange: function(e) {
    this.setData({ confirmPassword: e.detail.value });
  },
  
  saveProfile: async function() {
    const userInfo = this.data.userInfo;
    const password = this.data.password;
    const confirmPassword = this.data.confirmPassword;
    
    if (!userInfo._id) {
      wx.showToast({
        title: '用户ID缺失，请重新登录',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateTo({
          url: '../login/login'
        });
      }, 1500);
      return;
    }
    
    if (!userInfo.nickname.trim()) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      });
      return;
    }
    
    if (password || confirmPassword) {
      if (password !== confirmPassword) {
        wx.showToast({
          title: '两次输入的密码不一致',
          icon: 'none'
        });
        return;
      }
      if (password.length < 6) {
        wx.showToast({
          title: '密码长度不能少于6位',
          icon: 'none'
        });
        return;
      }
    }
    
    wx.showLoading({
      title: '保存中...',
      mask: true
    });
    
    try {
      wx.setStorageSync('userInfo', userInfo);
      
      const res = await wx.cloud.callFunction({
        name: 'exchangeFunctions',
        data: {
          type: 'updateUserInfo',
          userInfo: userInfo
        }
      });
      
      if (res.result && res.result.success) {
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        });
        
        this.setData({
          password: '',
          confirmPassword: ''
        });
        
        setTimeout(() => {
          wx.switchTab({
            url: '../mine/mine'
          });
        }, 1500);
      } else {
        const errMsg = res.result?.errMsg || '更新失败';
        wx.showToast({
          title: '保存失败: ' + errMsg,
          icon: 'none'
        });
      }
    } catch (err) {
      console.error('更新用户信息失败:', err);
      wx.showToast({
        title: '网络错误，请检查云开发环境',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },
  
  startVerification: async function() {
    const userInfo = this.data.userInfo;
    
    if (!userInfo.college || !userInfo.major || !userInfo.studentId) {
      wx.showToast({
        title: '请填写学院、专业和学号信息',
        icon: 'none'
      });
      return;
    }
    
    if (!userInfo._id) {
      wx.showToast({
        title: '用户ID缺失，请重新登录',
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({
      title: '认证中...',
      mask: true
    });
    
    try {
      userInfo.isVerified = true;
      this.setData({ userInfo });
      
      wx.setStorageSync('userInfo', userInfo);
      
      const res = await wx.cloud.callFunction({
        name: 'exchangeFunctions',
        data: {
          type: 'updateUserInfo',
          userInfo: userInfo
        }
      });
      
      if (res.result && res.result.success) {
        wx.showToast({
          title: '认证成功',
          icon: 'success'
        });
      } else {
        userInfo.isVerified = false;
        this.setData({ userInfo });
        wx.setStorageSync('userInfo', userInfo);
        
        wx.showToast({
          title: '认证失败: ' + (res.result?.errMsg || '未知错误'),
          icon: 'none'
        });
      }
    } catch (err) {
      userInfo.isVerified = false;
      this.setData({ userInfo });
      wx.setStorageSync('userInfo', userInfo);
      
      console.error('认证失败:', err);
      wx.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },
  
  viewVerification: function() {
    wx.showToast({
      title: '您已完成认证',
      icon: 'none'
    });
  },
  
  changePassword: function() {
    wx.showToast({
      title: '修改密码功能开发中',
      icon: 'none'
    });
  },
  
  bindPhone: function() {
    wx.showToast({
      title: '绑定手机功能开发中',
      icon: 'none'
    });
  },
  
  goBack: function() {
    wx.navigateBack();
  }
});