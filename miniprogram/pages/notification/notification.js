Page({
  data: {
    activeTab: 'system',
    systemNotifications: [
      {
        id: 1,
        icon: '📢',
        title: '系统维护通知',
        message: '系统将于今晚23:00-次日01:00进行维护，期间可能无法正常使用部分功能。',
        time: '2026-03-02 10:30',
        read: false
      },
      {
        id: 2,
        icon: '🎉',
        title: '新功能上线',
        message: '校园置换平台新增收藏功能，现在可以收藏喜欢的物品了！',
        time: '2026-03-01 15:20',
        read: true
      },
      {
        id: 3,
        icon: '⚠️',
        title: '安全提示',
        message: '请在交易时注意个人财物安全，建议选择公共场所进行线下交易。',
        time: '2026-02-28 09:15',
        read: true
      }
    ],
    tradeNotifications: [],
    interactNotifications: []
  },
  
  onLoad: function() {
    // 页面加载时的初始化操作
    console.log('通知页面加载');
    this.getUserPublishItems();
    this.getUserCollections();
    this.getUserFollowing();
  },
  
  // 获取用户发布的物品
  getUserPublishItems: function() {
    wx.showLoading({ title: '加载中...' });
    
    wx.cloud.callFunction({
      name: 'exchangeFunctions',
      data: {
        type: 'getUserPublishItems',
        page: 1,
        pageSize: 10
      }
    }).then(res => {
      console.log('获取发布物品结果:', res);
      if (res.result?.success) {
        const publishItems = res.result.data.items;
        const tradeNotifications = publishItems.map((item, index) => ({
          id: item._id || index + 1,
          icon: '📦',
          title: '物品发布成功',
          message: `您发布了"${item.name || '物品'}"，价格：¥${item.price || 0}`,
          time: this.formatTime(item.createdAt),
          read: false
        }));
        this.setData({ tradeNotifications });
      }
    }).catch(err => {
      console.error('获取发布物品失败:', err);
    }).finally(() => {
      wx.hideLoading();
    });
  },
  
  // 获取用户收藏的物品
  getUserCollections: function() {
    wx.showLoading({ title: '加载中...' });
    
    wx.cloud.callFunction({
      name: 'exchangeFunctions',
      data: {
        type: 'getUserCollections',
        page: 1,
        pageSize: 10
      }
    }).then(res => {
      console.log('获取收藏物品结果:', res);
      if (res.result?.success) {
        const collections = res.result.data.items;
        const collectionNotifications = collections.map((item, index) => ({
          id: 'collect_' + (item._id || index + 1),
          icon: '❤️',
          title: '收藏成功',
          message: `您收藏了"${item.itemName || '物品'}"，发布者：${item.publisher || '未知'}`,
          time: this.formatTime(item.createdAt),
          read: false
        }));
        this.updateInteractNotifications(collectionNotifications);
      }
    }).catch(err => {
      console.error('获取收藏物品失败:', err);
    }).finally(() => {
      wx.hideLoading();
    });
  },
  
  getUserFollowing: function() {
    wx.showLoading({ title: '加载中...' });
    
    wx.cloud.callFunction({
      name: 'followFunctions',
      data: {
        action: 'getFollowing',
        page: 1,
        pageSize: 10
      }
    }).then(res => {
      console.log('获取关注列表结果:', res);
      if (res.result?.success) {
        const follows = res.result.data.following || [];
        const followNotifications = follows.map((item, index) => ({
          id: 'follow_' + (item._id || index + 1),
          icon: '👤',
          title: '关注成功',
          message: `您关注了${item.publisher || '用户'}`,
          time: this.formatTime(item.createdAt),
          read: false
        }));
        this.updateInteractNotifications(followNotifications);
      }
    }).catch(err => {
      console.error('获取关注列表失败:', err);
    }).finally(() => {
      wx.hideLoading();
    });
  },
  
  updateInteractNotifications: function(newNotifications) {
    const currentNotifications = this.data.interactNotifications || [];
    const merged = [...currentNotifications, ...newNotifications];
    
    merged.sort((a, b) => {
      const timeA = new Date(a.time);
      const timeB = new Date(b.time);
      return timeB - timeA;
    });
    
    this.setData({ interactNotifications: merged });
  },
  
  // 格式化时间
  formatTime: function(date) {
    if (!date) return '';
    if (typeof date === 'string') return date;
    
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const hour = d.getHours().toString().padStart(2, '0');
    const minute = d.getMinutes().toString().padStart(2, '0');
    
    return `${year}-${month}-${day} ${hour}:${minute}`;
  },
  
  // 切换标签
  switchTab: function(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      activeTab: tab
    });
  },
  
  // 标记通知为已读
  markAsRead: function(e) {
    const id = e.currentTarget.dataset.id;
    const tab = this.data.activeTab;
    const notifications = this.data[`${tab}Notifications`];
    
    const updatedNotifications = notifications.map(item => {
      if (item.id === id) {
        return { ...item, read: true };
      }
      return item;
    });
    
    this.setData({
      [`${tab}Notifications`]: updatedNotifications
    });
  },
  
  // 点击通知项
  onNotificationTap: function(e) {
    const id = e.currentTarget.dataset.id;
    const tab = this.data.activeTab;
    
    // 标记为已读
    this.markAsRead(e);
    
    // 可以根据通知类型进行不同的跳转或操作
    console.log('点击通知:', id, tab);
    
    // 示例：根据通知类型跳转
    if (tab === 'trade') {
      // 跳转到交易详情
      // wx.navigateTo({ url: '/pages/tradeDetail/tradeDetail?id=' + id });
    }
  },
  
  // 下拉刷新
  onPullDownRefresh: function() {
    // 重置互动通知
    this.setData({ interactNotifications: [] });
    
    // 重新加载数据
    this.getUserPublishItems();
    this.getUserCollections();
    this.getUserFollowing();
    
    // 模拟刷新数据
    setTimeout(() => {
      wx.stopPullDownRefresh();
      wx.showToast({
        title: '刷新成功',
        icon: 'success'
      });
    }, 1000);
  }
});