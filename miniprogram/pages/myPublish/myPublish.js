Page({
  data: {
    publishItems: [],
    userInfo: null
  },
  
  onLoad: function() {
    // 获取用户信息
    this.getUserInfo();
  },
  
  // 获取用户信息
  getUserInfo: function() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      console.log('【调试】获取到用户信息:', userInfo);
      this.setData({ userInfo });
      // 获取发布列表
      this.getPublishItems();
    } else {
      console.log('【调试】未找到用户信息，需要登录');
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
    }
  },
  
  // 获取发布列表
  getPublishItems: function() {
    const userInfo = this.data.userInfo;
    if (!userInfo) {
      console.log('【调试】用户信息不存在，无法获取发布列表');
      return;
    }
    
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    
    // 获取当前用户的用户名
    const publisher = userInfo.username;
    console.log('【调试】当前用户publisher:', publisher);
    
    wx.cloud.callFunction({
      name: 'exchangeFunctions',
      data: {
        type: 'getUserPublishItems',
        page: 1,
        pageSize: 20,
        publisher: publisher
      }
    }).then(res => {
      wx.hideLoading();
      console.log('【调试】获取发布列表结果:', res);
      
      if (res.result && res.result.success) {
        const publishItems = res.result.data.items;
        console.log('【调试】获取到发布列表:', publishItems.length, '条记录');
        
        // 处理图片路径
        const handleImages = async () => {
          for (let i = 0; i < publishItems.length; i++) {
            const item = publishItems[i];
            if (item.image && item.image.startsWith('cloud://')) {
              try {
                const tempUrl = await this.getTempImageUrl(item.image);
                if (tempUrl) {
                  item.image = tempUrl;
                }
              } catch (e) {
                console.error('【调试】处理图片路径失败:', e);
              }
            }
            if (item.images && item.images.length > 0) {
              for (let j = 0; j < item.images.length; j++) {
                if (item.images[j].startsWith('cloud://')) {
                  try {
                    const tempUrl = await this.getTempImageUrl(item.images[j]);
                    if (tempUrl) {
                      item.images[j] = tempUrl;
                    }
                  } catch (e) {
                    console.error('【调试】处理图片路径失败:', e);
                  }
                }
              }
            }
          }
          
          this.setData({
            publishItems: publishItems
          });
          
          console.log('【调试】设置发布列表到data:', publishItems);
        };
        
        handleImages();
      } else {
        console.error('【调试】获取发布列表失败:', res.result);
        wx.showToast({
          title: '获取发布列表失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('【调试】获取发布列表失败:', err);
      wx.showToast({
        title: '网络错误，请稍后重试',
        icon: 'none'
      });
    });
  },
  
  // 获取临时图片URL
  getTempImageUrl: function(url) {
    return new Promise((resolve, reject) => {
      console.log('【调试】获取临时图片URL:', url);
      
      if (!url || !url.startsWith('cloud://')) {
        resolve(url);
        return;
      }
      
      // 使用云函数获取临时文件URL
      wx.cloud.getTempFileURL({
        fileList: [url],
        success: res => {
          console.log('【调试】获取临时URL成功:', res);
          if (res.fileList && res.fileList.length > 0 && res.fileList[0].tempFileURL) {
            resolve(res.fileList[0].tempFileURL);
          } else {
            resolve(url);
          }
        },
        fail: err => {
          console.error('【调试】获取临时URL失败:', err);
          resolve(url);
        }
      });
    });
  },
  
  // 查看物品详情
  viewItemDetail: function(e) {
    const itemId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '../detail/detail?id=' + itemId
    });
  },
  
//   // 编辑物品
//   editItem: function(e) {
//     const itemId = e.currentTarget.dataset.id;
//     wx.navigateTo({
//       url: '../publish/publish?edit=true&id=' + itemId
//     });
//   },
// 编辑物品
editItem: function(e) {
    const itemId = e.currentTarget.dataset.id;
    // 存入本地缓存传递编辑参数
    wx.setStorageSync('editItemId', itemId);
    wx.setStorageSync('isEditMode', true);
    // 切换到底部发布Tab
    wx.switchTab({
      url: '../publish/publish'
    });
  },
  
  // 删除物品
  deleteItem: function(e) {
    const itemId = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '删除发布',
      content: '确定要删除这个发布吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '删除中...',
            mask: true
          });
          
          wx.cloud.callFunction({
            name: 'exchangeFunctions',
            data: {
              type: 'deleteItem',
              itemId: itemId
            }
          }).then(res => {
            wx.hideLoading();
            console.log('【调试】删除发布结果:', res);
            
            if (res.result && res.result.success) {
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              });
              
              // 重新获取发布列表
              this.getPublishItems();
            } else {
              wx.showToast({
                title: '删除失败',
                icon: 'none'
              });
            }
          }).catch(err => {
            wx.hideLoading();
            console.error('【调试】删除发布失败:', err);
            wx.showToast({
              title: '网络错误，请稍后重试',
              icon: 'none'
            });
          });
        }
      }
    });
  },
  
  // 去发布页面
  goToPublish: function() {
    wx.switchTab({
      url: '../publish/publish'
    });
  },
  
  // 获取状态文本
  getStatusText: function(status) {
    switch (status) {
      case 'active':
        return '在售';
      case 'sold':
        return '已售出';
      case 'offline':
        return '已下线';
      default:
        return '未知';
    }
  },
  
  // 格式化时间
  formatTime: function(time) {
    if (!time) return '';
    
    const date = new Date(time);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  },
  
  // 返回上一页
  goBack: function() {
    wx.navigateBack();
  },
  
  // 下拉刷新
  onPullDownRefresh: function() {
    this.getPublishItems();
    wx.stopPullDownRefresh();
  }
});