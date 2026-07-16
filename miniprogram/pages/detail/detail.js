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
          this.setData({
            item: convertedItem,
            loading: false
          });
          
          // 检查是否已关注发布者
          this.checkIsFollowing();
          // 检查是否已收藏
          this.checkCollectionStatus();
          
          // 记录浏览历史（用于智能推荐）
          this.recordBrowseHistory(convertedItem);
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
  
    // 修复：图片预览逻辑（绑定正确的src）
    previewImage: function(e) {
      // 获取当前点击的图片链接
      const current = e.currentTarget.dataset.src;
      // 获取所有轮播图链接
      const urls = this.data.item.images || [this.data.item.image];
      console.log('【调试】预览图片:', { current, urls });
      
      wx.previewImage({
        current: current, // 当前显示图片的链接
        urls: urls        // 需要预览的图片链接列表
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
  
    // 检查是否已关注
  checkIsFollowing: function() {
    const item = this.data.item;
    // 优先使用publisherId，其次使用publisher作为关注标识
    const publisherId = item.publisherId;
    const publisher = item.publisher;
    
    if (!publisherId && !publisher) {
      console.log('【调试】没有发布者信息，无法检查关注状态');
      return;
    }
    
    console.log('【调试】检查关注状态，publisherId:', publisherId, 'publisher:', publisher);
    
    wx.cloud.callFunction({
      name: 'followFunctions',
      data: {
        action: 'isFollowing',
        publisherId: publisherId,
        publisher: publisher
      }
    }).then(res => {
      console.log('【调试】检查关注状态结果:', res);
      if (res.result.success) {
        this.setData({
          isFollowing: res.result.data.isFollowing
        });
      }
    }).catch(err => {
      console.error('【调试】检查关注状态失败:', err);
    });
  },

  // 关注/取消关注发布者
  followPublisher: function() {
    const item = this.data.item;
    const isFollowing = this.data.isFollowing;
    
    // 优先使用publisherId，其次使用publisher作为关注标识
    const publisherId = item.publisherId;
    const publisher = item.publisher;
    
    console.log('【调试】关注操作前，item数据:', item);
    console.log('【调试】关注操作前，publisherId:', publisherId, 'publisher:', publisher);
    
    if (!publisherId && !publisher) {
      wx.showToast({
        title: '无法获取发布者信息',
        icon: 'none'
      });
      return;
    }
    
    console.log('【调试】关注操作，publisherId:', publisherId, 'publisher:', publisher, '当前状态:', isFollowing);
    
    wx.cloud.callFunction({
      name: 'followFunctions',
      data: {
        action: isFollowing ? 'unfollow' : 'follow',
        publisherId: publisherId,
        publisher: publisher
      }
    }).then(res => {
      console.log('【调试】关注操作结果:', res);
      if (res.result.success) {
        this.setData({
          isFollowing: !isFollowing
        });
        wx.showToast({
          title: isFollowing ? '已取消关注' : '关注成功',
          icon: 'success'
        });
      } else {
        wx.showToast({
          title: res.result.errMsg || '操作失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      console.error('【调试】关注操作失败:', err);
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
        
        // 移除重复的物品
        const filteredHistory = history.filter(h => h._id !== item._id);
        
        // 添加新物品到开头
        const newHistory = [{
          _id: item._id,
          name: item.name,
          category: item.category,
          price: item.price,
          image: item.image,
          time: Date.now()
        }, ...filteredHistory].slice(0, 20); // 只保留最近20条
        
        wx.setStorageSync('browseHistory', newHistory);
        console.log('【智能推荐】浏览历史记录成功:', newHistory.length, '条');
        
        // 同时保存到数据库（持久化）
        const userInfo = wx.getStorageSync('userInfo');
        wx.cloud.callFunction({
          name: 'exchangeFunctions',
          data: {
            type: 'recordBrowseHistory',
            itemId: item._id,
            itemName: item.name,
            category: item.category,
            price: item.price,
            image: item.image,
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