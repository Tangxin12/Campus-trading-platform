const imageUtils = require('../../utils/imageUtils.js');

Page({
    data: {
  item: {},
  loading: true,
  isFollowing: false,
  isCollected: false
  },
  
    onLoad: function(options) {
      const itemId = options.id || options.itemId;
      console.log('【调试】详情页加载，itemId:', itemId);
      
      if (itemId) {
        this.getItemDetail(itemId);
      }
    },
  
    // 获取物品详情
    getItemDetail: function(itemId) {
      wx.showLoading({
        title: '加载中...'
      });
      
      wx.cloud.callFunction({
        name: 'exchangeFunctions',
        data: {
          type: 'getItemDetail',
          itemId: itemId
        }
      }).then(res => {
        wx.hideLoading();
        console.log('【调试】获取详情结果:', res);
        
        if (res.result.success) {
        let item = res.result.data;
        console.log('【调试】原始物品数据:', item);
        
        // 修复：批量转换所有图片（主图+轮播图数组）
        imageUtils.convertAllImageUrls(item).then(convertedItem => {
          console.log('【调试】转换后物品数据:', convertedItem);
          
          convertedItem.originalImages = item.images || [item.image];
          
          this.setData({
            item: convertedItem,
            loading: false
          });
          
          // 检查是否已关注发布者
          this.checkIsFollowing();
          // 检查是否已收藏
          this.checkCollectionStatus();
          
          // 记录浏览历史（用于智能推荐）- 使用原始数据的cloud://路径
          this.recordBrowseHistory(item);
        });
      } else {
          wx.showToast({
            title: res.result.errMsg || '获取物品详情失败',
            icon: 'none'
          });
          this.setData({ loading: false });
        }
      }).catch(err => {
        wx.hideLoading();
        console.error('获取物品详情失败:', err);
        wx.showToast({
          title: '获取物品详情失败',
          icon: 'none'
        });
        this.setData({ loading: false });
      });
    },
    
    // 检查收藏状态
    checkCollectionStatus: function() {
      const itemId = this.data.item._id;
      
      wx.cloud.callFunction({
        name: 'exchangeFunctions',
        data: {
          type: 'checkCollectionStatus',
          itemId: itemId
        }
      }).then(res => {
        console.log('【调试】检查收藏状态结果:', res);
        if (res.result.success) {
          this.setData({
            isCollected: res.result.data.isCollected
          });
        }
      }).catch(err => {
        console.error('【调试】检查收藏状态失败:', err);
      });
    },
  
    // 修复：图片预览逻辑（使用原始cloud://路径重新获取临时链接）
    previewImage: function(e) {
      const currentIndex = e.currentTarget.dataset.index;
      const item = this.data.item;
      
      const originalImages = item.originalImages || item.images || [item.image];
      const urls = [];
      const promises = [];
      
      for (let i = 0; i < originalImages.length; i++) {
        const img = originalImages[i];
        promises.push(imageUtils.getTempFileUrl(img).then(url => {
          urls[i] = url;
        }).catch(() => {
          urls[i] = img;
        }));
      }
      
      Promise.all(promises).then(() => {
        wx.previewImage({
          current: urls[currentIndex],
          urls: urls
        });
      });
    },
  
    // 收藏物品
    collectItem: function() {
      const isCollected = this.data.isCollected;
      const itemId = this.data.item._id;
      
      wx.showLoading({
        title: isCollected ? '取消收藏中...' : '收藏中...',
        mask: true
      });
      
      wx.cloud.callFunction({
        name: 'exchangeFunctions',
        data: {
          type: isCollected ? 'uncollectItem' : 'collectItem',
          itemId: itemId
        }
      }).then(res => {
        wx.hideLoading();
        console.log('【调试】收藏操作结果:', res);
        if (res.result.success) {
          this.setData({
            isCollected: !isCollected
          });
          wx.showToast({
            title: isCollected ? '已取消收藏' : '收藏成功',
            icon: 'success'
          });
        } else {
          wx.showToast({
            title: res.result.errMsg || '操作失败',
            icon: 'none'
          });
        }
      }).catch(err => {
        wx.hideLoading();
        console.error('【调试】收藏操作失败:', err);
        wx.showToast({
          title: '操作失败，请重试',
          icon: 'none'
        });
      });
    },
  
    // 举报物品
    reportItem: function() {
      wx.showToast({
        title: '举报已提交',
        icon: 'none'
      });
    },
  
    // 推荐物品
    recommendItem: function() {
      wx.showToast({
        title: '推荐成功',
        icon: 'success'
      });
    },
  
      // 检查是否已关注（功能待实现）
  checkIsFollowing: function() {
      const item = this.data.item;
      const publisherId = item.publisherId || item.publisher;
      
      wx.cloud.callFunction({
        name: 'followFunctions',
        data: {
          action: 'isFollowing',
          publisherId: publisherId
        }
      }).then(res => {
        if (res.result.success) {
          this.setData({
            isFollowing: res.result.data.isFollowing
          });
        } else {
          console.error('检查关注状态失败:', res.result.errMsg);
          this.setData({ isFollowing: false });
        }
      }).catch(err => {
        console.error('检查关注状态失败:', err);
        this.setData({ isFollowing: false });
      });
    },

    followPublisher: function() {
      const item = this.data.item;
      const publisherId = item.publisherId || item.publisher;
      const action = this.data.isFollowing ? 'unfollow' : 'follow';
      
      wx.cloud.callFunction({
        name: 'followFunctions',
        data: {
          action: action,
          publisherId: publisherId,
          publisher: item.publisher
        }
      }).then(res => {
        if (res.result.success) {
          this.setData({
            isFollowing: !this.data.isFollowing
          });
          wx.showToast({
            title: action === 'follow' ? '关注成功' : '取消关注成功',
            icon: 'success'
          });
        } else {
          wx.showToast({
            title: res.result.errMsg || '操作失败',
            icon: 'none'
          });
        }
      }).catch(err => {
        console.error('关注操作失败:', err);
        wx.showToast({
          title: '操作失败',
          icon: 'none'
        });
      });
    },
  
    // 立即沟通
    contactPublisher: function() {
      const item = this.data.item;
      const chatData = {
        userId: item.publisherId || item.publisher,
        userName: item.publisher,
        userAvatar: item.avatar || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=user%20avatar%20placeholder%20circular%20portrait&image_size=square',
        itemId: item._id,
        itemName: item.name,
        itemImage: item.image,
        price: item.price,
        condition: item.condition
      };
      
      wx.navigateTo({
        url: '../chat/chat?chatData=' + encodeURIComponent(JSON.stringify(chatData))
      });
    },
  
    // 分享
    onShareAppMessage: function() {
      return {
        title: this.data.item.name || '校园置换物品',
        path: `pages/detail/detail?id=${this.data.item._id}`,
        imageUrl: this.data.item.image
      };
    },

    // 返回上一页
    goBack: function() {
      wx.navigateBack();
    },

    // 记录浏览历史（用于智能推荐）
    recordBrowseHistory: function(item) {
      try {
        const history = wx.getStorageSync('browseHistory') || [];
        
        const filteredHistory = history.filter(h => h.itemId !== item._id);
        
        const itemImage = item.image || (item.images && item.images.length > 0 ? item.images[0] : '');
        
        const newHistory = [{
          itemId: item._id,
          itemName: item.name,
          category: item.category,
          price: item.price,
          image: itemImage,
          time: Date.now()
        }, ...filteredHistory].slice(0, 20);
        
        wx.setStorageSync('browseHistory', newHistory);
        console.log('【智能推荐】浏览历史记录成功:', newHistory.length, '条');
        
        const userInfo = wx.getStorageSync('userInfo');
        wx.cloud.callFunction({
          name: 'exchangeFunctions',
          data: {
            type: 'recordBrowseHistory',
            itemId: item._id,
            itemName: item.name,
            category: item.category,
            price: item.price,
            image: itemImage,
            userId: userInfo ? userInfo._id : ''
          }
        }).then(res => {
          console.log('【智能推荐】浏览历史保存到数据库成功');
        }).catch(err => {
          console.error('【智能推荐】浏览历史保存到数据库失败:', err);
        });
      } catch (err) {
        console.error('【智能推荐】记录浏览历史失败:', err);
      }
    }
  });