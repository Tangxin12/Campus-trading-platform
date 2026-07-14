// Page({
//   data: {
//     userInfo: {
//       nickname: '',
//       username: '',
//       avatar: '',
//       phone: '',
//       isVerified: false,
//       college: '',
//       major: '',
//       studentId: ''
//     },
//     password: '',
//     confirmPassword: ''
//   },
  
//   onLoad: function(options) {
//     // 页面加载时获取用户信息
//     this.getUserInfo();
    
//     // 检查是否需要滚动到认证部分
//     if (options.scrollTo === 'verification') {
//       // 延迟执行，确保页面已经渲染完成
//       setTimeout(() => {
//         wx.createSelectorQuery().select('#verification-section').boundingClientRect((rect) => {
//           if (rect) {
//             wx.pageScrollTo({
//               scrollTop: rect.top - 100, // 减去顶部导航栏高度
//               duration: 300
//             });
//           }
//         }).exec();
//       }, 500);
//     }
//   },
  
//   // 获取用户信息
//   getUserInfo: function() {
//     // 从本地存储获取用户信息
//     const userInfo = wx.getStorageSync('userInfo');
    
//     console.log('【调试】获取到的用户信息:', userInfo);
    
//     if (userInfo) {
//       this.setData({ userInfo });
//       console.log('【调试】设置用户信息后:', this.data.userInfo);
//     } else {
//       // 如果没有用户信息，使用默认数据
//       const defaultUserInfo = {
//         nickname: '昵称',
//         username: '',
//         avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=user%20avatar%20placeholder%20circular%20portrait&image_size=square',
//         phone: '',
//         isVerified: false,
//         college: '',
//         major: '',
//         studentId: ''
//       };
//       this.setData({ userInfo: defaultUserInfo });
//     }
//   },
  
//   // 选择头像
//   chooseAvatar: function() {
//     wx.chooseImage({
//       count: 1,
//       sizeType: ['compressed'],
//       sourceType: ['album', 'camera'],
//       success: (res) => {
//         const tempFilePaths = res.tempFilePaths;
        
//         wx.showLoading({
//           title: '上传中...',
//           mask: true
//         });
        
//         // 上传图片到云存储
//         wx.cloud.uploadFile({
//           cloudPath: 'avatars/' + Date.now() + '.jpg',
//           filePath: tempFilePaths[0],
//           success: (uploadResult) => {
//             console.log('【调试】头像上传成功:', uploadResult);
            
//             // 更新用户信息
//             const userInfo = this.data.userInfo;
//             userInfo.avatar = uploadResult.fileID;
            
//             this.setData({ userInfo });
            
//             wx.showToast({
//               title: '头像更新成功',
//               icon: 'success'
//             });
//           },
//           fail: (err) => {
//             console.error('【调试】头像上传失败:', err);
//             wx.showToast({
//               title: '上传失败，请重试',
//               icon: 'none'
//             });
//           },
//           complete: () => {
//             wx.hideLoading();
//           }
//         });
//       },
//       fail: (err) => {
//         console.error('【调试】选择头像失败:', err);
//       }
//     });
//   },
  
//   // 昵称输入变化
//   onNicknameChange: function(e) {
//     const userInfo = this.data.userInfo;
//     userInfo.nickname = e.detail.value;
//     this.setData({ userInfo });
//   },
  
//   // 学院输入变化
//   onCollegeChange: function(e) {
//     const userInfo = this.data.userInfo;
//     userInfo.college = e.detail.value;
//     this.setData({ userInfo });
//   },
  
//   // 专业输入变化
//   onMajorChange: function(e) {
//     const userInfo = this.data.userInfo;
//     userInfo.major = e.detail.value;
//     this.setData({ userInfo });
//   },
  
//   // 学号输入变化
//   onStudentIdChange: function(e) {
//     const userInfo = this.data.userInfo;
//     userInfo.studentId = e.detail.value;
//     this.setData({ userInfo });
//   },
  
//   // 手机号输入变化
//   onPhoneChange: function(e) {
//     const userInfo = this.data.userInfo;
//     userInfo.phone = e.detail.value;
//     this.setData({ userInfo });
//   },
  
//   // 密码输入变化
//   onPasswordChange: function(e) {
//     this.setData({ password: e.detail.value });
//   },
  
//   // 确认密码输入变化
//   onConfirmPasswordChange: function(e) {
//     this.setData({ confirmPassword: e.detail.value });
//   },
  
//   // 保存个人资料
//   saveProfile: function() {
//     const userInfo = this.data.userInfo;
//     const password = this.data.password;
//     const confirmPassword = this.data.confirmPassword;
    
//     console.log('【调试】保存前的用户信息:', userInfo);
    
//     // 简单验证
//     if (!userInfo.nickname.trim()) {
//       wx.showToast({
//         title: '请输入昵称',
//         icon: 'none'
//       });
//       return;
//     }
    
//     // 确保username字段存在
//     if (!userInfo.username) {
//       wx.showToast({
//         title: '用户信息不完整，请重新登录',
//         icon: 'none'
//       });
//       // 跳转到登录页面
//       wx.navigateTo({
//         url: '../login/login'
//       });
//       return;
//     }
    
//     // 密码验证
//     if (password || confirmPassword) {
//       if (password !== confirmPassword) {
//         wx.showToast({
//           title: '两次输入的密码不一致',
//           icon: 'none'
//         });
//         return;
//       }
//       if (password.length < 6) {
//         wx.showToast({
//           title: '密码长度不能少于6位',
//           icon: 'none'
//         });
//         return;
//       }
//       // 这里可以添加密码加密逻辑
//       // userInfo.password = encryptPassword(password);
//     }
    
//     wx.showLoading({
//       title: '保存中...',
//       mask: true
//     });
    
//     // 保存到本地存储
//     wx.setStorageSync('userInfo', userInfo);
    
//     // 调用云函数更新数据库中的用户信息
//     console.log('【调试】准备调用云函数，userInfo:', JSON.stringify(userInfo));
//     console.log('【调试】userInfo._id:', userInfo._id);
    
//     // 检查云开发环境是否可用
//     wx.cloud.callFunction({
//       name: 'exchangeFunctions',
//       data: {
//         type: 'updateUserInfo',
//         userInfo: userInfo
//       }
//     }).then(res => {
//       console.log('【调试】更新用户信息结果:', JSON.stringify(res));
//       if (res.result) {
//         if (res.result.success) {
//           console.log('【调试】用户信息更新成功');
//           wx.showToast({
//             title: '数据库更新成功',
//             icon: 'success'
//           });
//         } else {
//           console.error('【调试】用户信息更新失败:', res.result.errMsg);
//           wx.showToast({
//             title: '数据库更新失败: ' + res.result.errMsg,
//             icon: 'none'
//           });
//         }
//       } else {
//         console.error('【调试】云函数返回结果格式错误:', res);
//         wx.showToast({
//           title: '云函数返回结果错误',
//           icon: 'none'
//         });
//       }
//     }).catch(err => {
//       console.error('【调试】更新用户信息失败:', err);
//       wx.showToast({
//         title: '网络错误，请检查云开发环境',
//         icon: 'none'
//       });
//     });
    
//     setTimeout(() => {
//       wx.hideLoading();
//       wx.showToast({
//         title: '保存成功',
//         icon: 'success'
//       });
      
//       // 重置密码字段
//       this.setData({
//         password: '',
//         confirmPassword: ''
//       });
      
//       // 跳转到"我的"页面
//       setTimeout(() => {
//         wx.redirectTo({
//           url: '../mine/mine'
//         });
//       }, 1500);
//     }, 1000);
//   },
  
//   // 开始认证
//   startVerification: function() {
//     const userInfo = this.data.userInfo;
    
//     // 简单验证
//     if (!userInfo.college || !userInfo.major || !userInfo.studentId) {
//       wx.showToast({
//         title: '请填写学院、专业和学号信息',
//         icon: 'none'
//       });
//       return;
//     }
    
//     wx.showLoading({
//       title: '认证中...',
//       mask: true
//     });
    
//     // 模拟认证过程
//     setTimeout(() => {
//       userInfo.isVerified = true;
//       this.setData({ userInfo });
      
//       // 保存到本地存储
//       wx.setStorageSync('userInfo', userInfo);
      
//       // 调用云函数更新数据库中的用户信息
//       wx.cloud.callFunction({
//         name: 'exchangeFunctions',
//         data: {
//           type: 'updateUserInfo',
//           userInfo: userInfo
//         }
//       }).then(res => {
//         console.log('【调试】更新用户信息结果:', res);
//       }).catch(err => {
//         console.error('【调试】更新用户信息失败:', err);
//       });
      
//       wx.hideLoading();
//       wx.showToast({
//         title: '认证成功',
//         icon: 'success'
//       });
//     }, 1000);
//   },
  
//   // 查看认证信息
//   viewVerification: function() {
//     wx.showToast({
//       title: '查看认证信息',
//       icon: 'none'
//     });
//   },
  
//   // 修改密码
//   changePassword: function() {
//     wx.showToast({
//       title: '跳转到修改密码页面',
//       icon: 'none'
//     });
//   },
  
//   // 绑定手机
//   bindPhone: function() {
//     wx.showToast({
//       title: '跳转到绑定手机页面',
//       icon: 'none'
//     });
//   },
  
//   // 返回上一页
//   goBack: function() {
//     wx.navigateBack();
//   },
  
//   // 测试云函数连接
//   testCloudFunction: function() {
//     console.log('【调试】开始测试云函数连接');
//     wx.showLoading({
//       title: '测试中...',
//       mask: true
//     });
    
//     wx.cloud.callFunction({
//       name: 'exchangeFunctions',
//       data: {
//         type: 'updateUserInfo',
//         userInfo: this.data.userInfo
//       }
//     }).then(res => {
//       wx.hideLoading();
//       console.log('【调试】云函数测试结果:', JSON.stringify(res));
//       if (res.result) {
//         if (res.result.success) {
//           wx.showToast({
//             title: '云函数连接成功',
//             icon: 'success'
//           });
//         } else {
//           wx.showToast({
//             title: '云函数调用失败: ' + res.result.errMsg,
//             icon: 'none'
//           });
//         }
//       } else {
//         wx.showToast({
//           title: '云函数返回结果错误',
//           icon: 'none'
//         });
//       }
//     }).catch(err => {
//       wx.hideLoading();
//       console.error('【调试】云函数测试失败:', err);
//       wx.showToast({
//         title: '网络错误，请检查云开发环境',
//         icon: 'none'
//       });
//     });
//   }
// });
Page({
    data: {
      userInfo: {
        _id: '', // 新增：存储用户ID，必须要有
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
    
    // 获取用户信息 - 修复：确保获取并保留 _id
    getUserInfo: function() {
      const userInfo = wx.getStorageSync('userInfo');
      
      console.log('【调试】获取到的用户信息:', userInfo);
      
      if (userInfo && userInfo._id) { // 检查是否有 _id
        this.setData({ userInfo });
        console.log('【调试】设置用户信息后:', this.data.userInfo);
      } else {
        // 如果没有用户信息，使用默认数据（但提醒需要登录）
        const defaultUserInfo = {
          _id: '', // 空ID，后续需要登录获取
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
        // 跳转到登录页面
        wx.navigateTo({
          url: '../login/login'
        });
      }
    },
    
    // 选择头像 - 保持不变
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
              console.log('【调试】头像上传成功:', uploadResult);
              
              const userInfo = this.data.userInfo;
              userInfo.avatar = uploadResult.fileID;
              
              this.setData({ userInfo });
              
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
    
    // 各种输入变化处理 - 保持不变
    onNicknameChange: function(e) {
      const userInfo = this.data.userInfo;
      userInfo.nickname = e.detail.value;
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
    
    // 保存个人资料 - 重点修复
    saveProfile: async function() { // 改为async函数
      const userInfo = this.data.userInfo;
      const password = this.data.password;
      const confirmPassword = this.data.confirmPassword;
      
      console.log('【调试】保存前的用户信息:', userInfo);
      
      // 验证用户ID是否存在
      if (!userInfo._id) {
        wx.showToast({
          title: '用户ID缺失，请重新登录',
          icon: 'none'
        });
        wx.navigateTo({
          url: '../login/login'
        });
        return;
      }
      
      // 简单验证
      if (!userInfo.nickname.trim()) {
        wx.showToast({
          title: '请输入昵称',
          icon: 'none'
        });
        return;
      }
      
      // 密码验证
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
        // 先保存到本地
        wx.setStorageSync('userInfo', userInfo);
        
        // 调用云函数更新数据库 - 改为await方式，确保执行完成
        console.log('【调试】准备调用云函数，userInfo:', JSON.stringify(userInfo));
        console.log('【调试】userInfo._id:', userInfo._id);
        
        const res = await wx.cloud.callFunction({
          name: 'exchangeFunctions',
          data: {
            type: 'updateUserInfo',
            userInfo: userInfo
          }
        });
        
        console.log('【调试】更新用户信息结果:', JSON.stringify(res));
        
        if (res.result && res.result.success) {
          // 数据库更新成功
          wx.showToast({
            title: '保存成功',
            icon: 'success'
          });
          
          // 重置密码字段
          this.setData({
            password: '',
            confirmPassword: ''
          });
          
          // 延迟跳转
          setTimeout(() => {
            wx.redirectTo({
              url: '../mine/mine'
            });
          }, 1500);
        } else {
          // 数据库更新失败
          const errMsg = res.result?.errMsg || '更新失败';
          wx.showToast({
            title: '保存失败: ' + errMsg,
            icon: 'none'
          });
        }
      } catch (err) {
        // 调用云函数异常
        console.error('【调试】更新用户信息失败:', err);
        wx.showToast({
          title: '网络错误，请检查云开发环境',
          icon: 'none'
        });
      } finally {
        // 无论成功失败，都隐藏loading
        wx.hideLoading();
      }
    },
    
    // 开始认证 - 修复异步逻辑
    startVerification: async function() {
      const userInfo = this.data.userInfo;
      
      if (!userInfo.college || !userInfo.major || !userInfo.studentId) {
        wx.showToast({
          title: '请填写学院、专业和学号信息',
          icon: 'none'
        });
        return;
      }
      
      // 验证用户ID
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
        // 更新认证状态
        userInfo.isVerified = true;
        this.setData({ userInfo });
        
        // 保存到本地
        wx.setStorageSync('userInfo', userInfo);
        
        // 调用云函数更新数据库
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
          // 回滚认证状态
          userInfo.isVerified = false;
          this.setData({ userInfo });
          wx.setStorageSync('userInfo', userInfo);
          
          wx.showToast({
            title: '认证失败: ' + (res.result?.errMsg || '未知错误'),
            icon: 'none'
          });
        }
      } catch (err) {
        // 回滚认证状态
        userInfo.isVerified = false;
        this.setData({ userInfo });
        wx.setStorageSync('userInfo', userInfo);
        
        console.error('【调试】认证失败:', err);
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
      } finally {
        wx.hideLoading();
      }
    },
    
    // 其他方法保持不变
    viewVerification: function() {
      wx.showToast({
        title: '查看认证信息',
        icon: 'none'
      });
    },
    
    changePassword: function() {
      wx.showToast({
        title: '跳转到修改密码页面',
        icon: 'none'
      });
    },
    
    bindPhone: function() {
      wx.showToast({
        title: '跳转到绑定手机页面',
        icon: 'none'
      });
    },
    
    goBack: function() {
      wx.navigateBack();
    },
    
    testCloudFunction: async function() {
      console.log('【调试】开始测试云函数连接');
      wx.showLoading({
        title: '测试中...',
        mask: true
      });
      
      try {
        const res = await wx.cloud.callFunction({
          name: 'exchangeFunctions',
          data: {
            type: 'updateUserInfo',
            userInfo: this.data.userInfo
          }
        });
        
        console.log('【调试】云函数测试结果:', JSON.stringify(res));
        if (res.result) {
          if (res.result.success) {
            wx.showToast({
              title: '云函数连接成功',
              icon: 'success'
            });
          } else {
            wx.showToast({
              title: '云函数调用失败: ' + res.result.errMsg,
              icon: 'none'
            });
          }
        } else {
          wx.showToast({
            title: '云函数返回结果错误',
            icon: 'none'
          });
        }
      } catch (err) {
        console.error('【调试】云函数测试失败:', err);
        wx.showToast({
          title: '网络错误，请检查云开发环境',
          icon: 'none'
        });
      } finally {
        wx.hideLoading();
      }
    }
  });