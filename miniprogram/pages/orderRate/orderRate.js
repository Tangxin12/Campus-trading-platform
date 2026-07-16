const imageUtils = require('../../utils/imageUtils.js');

Page({
  data: {
    orderId: '',
    userId: '',
    order: {},
    currentRating: 0,
    comment: '',
    isSeller: false,
    targetUserName: '',
    targetUserAvatar: ''
  },

  onLoad: function(options) {
    const { orderId, userId } = options;
    this.setData({ orderId, userId });
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
        const isSeller = order.sellerId === this.data.userId;
        const targetUserName = isSeller ? order.buyerName : order.sellerName;
        const targetUserAvatar = isSeller ? order.buyerAvatar : order.sellerAvatar;
        
        imageUtils.convertOrderImageUrls([order]).then(convertedOrders => {
          const convertedOrder = convertedOrders[0];
          this.setData({
            order: convertedOrder,
            isSeller: isSeller,
            targetUserName: targetUserName,
            targetUserAvatar: convertedOrder[isSeller ? 'buyerAvatar' : 'sellerAvatar']
          });
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

  selectStar: function(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ currentRating: index + 1 });
  },

  onCommentInput: function(e) {
    this.setData({ comment: e.detail.value });
  },

  submitRate: function() {
    if (this.data.currentRating === 0) {
      wx.showToast({ title: '请选择评分', icon: 'none' });
      return;
    }
    
    wx.showModal({
      title: '确认评价',
      content: `确定提交${this.data.currentRating}星评价吗？`,
      success: (res) => {
        if (res.confirm) {
          this.doSubmitRate();
        }
      }
    });
  },

  doSubmitRate: function() {
    wx.showLoading({ title: '提交中...' });
    
    wx.cloud.callFunction({
      name: 'orderFunctions',
      data: {
        type: 'rateOrder',
        orderId: this.data.orderId,
        rating: this.data.currentRating,
        comment: this.data.comment,
        isSeller: this.data.isSeller,
        userId: this.data.userId
      }
    }).then(res => {
      wx.hideLoading();
      
      if (res.result.success) {
        wx.showToast({ title: '评价成功', icon: 'success' });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        wx.showToast({ title: res.result.message || '评价失败', icon: 'none' });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('评价失败:', err);
      wx.showToast({ title: '评价失败', icon: 'none' });
    });
  },

  goBack: function() {
    wx.navigateBack();
  }
});