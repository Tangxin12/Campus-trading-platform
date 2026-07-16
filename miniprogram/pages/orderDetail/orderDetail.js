const imageUtils = require('../../utils/imageUtils.js');

Page({
  data: {
    orderId: '',
    order: null,
    userInfo: null
  },

  onLoad: function(options) {
    const { orderId } = options;
    const userInfo = wx.getStorageSync('userInfo');
    
    this.setData({ orderId, userInfo });
    this.loadOrderDetail();
  },

  loadOrderDetail: function() {
    wx.showLoading({ title: '加载中...' });
    
    wx.cloud.callFunction({
      name: 'orderFunctions',
      data: {
        type: 'getOrderDetail',
        orderId: this.data.orderId
      }
    }).then(res => {
      wx.hideLoading();
      
      if (res.result.success) {
        const order = res.result.data.order;
        
        console.log('【订单详情】返回的订单数据:', JSON.stringify(order));
        console.log('【订单详情】createdAt:', order.createdAt, typeof order.createdAt);
        console.log('【订单详情】completedAt:', order.completedAt, typeof order.completedAt);
        
        imageUtils.convertOrderImageUrls([order]).then(convertedOrders => {
          this.setData({ order: convertedOrders[0] });
        });
      } else {
        wx.showToast({ title: res.result.message || '加载失败', icon: 'none' });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('加载订单失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    });
  },

  getStatusText: function(status) {
    const statusMap = {
      'pending': '待确认',
      'confirmed': '进行中',
      'completed': '已完成',
      'cancelled': '已取消'
    };
    return statusMap[status] || status;
  },

  formatTime: function(date) {
    if (!date) return '';
    
    let d;
    if (typeof date === 'object' && date.$date) {
      d = new Date(date.$date);
    } else if (typeof date === 'string') {
      d = new Date(date);
    } else if (typeof date === 'number') {
      d = new Date(date);
    } else if (date instanceof Date) {
      d = date;
    } else {
      d = new Date(date);
    }
    
    if (isNaN(d.getTime())) return '';
    
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const hour = d.getHours().toString().padStart(2, '0');
    const minute = d.getMinutes().toString().padStart(2, '0');
    
    return `${year}-${month}-${day} ${hour}:${minute}`;
  },

  viewItemDetail: function() {
    if (this.data.order && this.data.order.itemId) {
      wx.navigateTo({
        url: '../detail/detail?id=' + this.data.order.itemId
      });
    }
  },

  contactUser: function() {
    const order = this.data.order;
    if (!order) return;
    
    const isSeller = order.sellerId === this.data.userInfo._id;
    const targetUser = isSeller ? {
      userId: order.buyerId,
      userName: order.buyerName,
      userAvatar: order.buyerAvatar
    } : {
      userId: order.sellerId,
      userName: order.sellerName,
      userAvatar: order.sellerAvatar
    };
    
    const chatData = {
      userId: targetUser.userId,
      userName: targetUser.userName,
      userAvatar: targetUser.userAvatar,
      itemId: order.itemId,
      itemName: order.itemName,
      itemImage: order.itemImage,
      price: order.itemPrice
    };
    
    wx.navigateTo({
      url: '../chat/chat?chatData=' + encodeURIComponent(JSON.stringify(chatData))
    });
  },

  goBack: function() {
    wx.navigateBack();
  }
});