const imageUtils = require('../../utils/imageUtils.js');

Page({
    data: {
      browseHistory: []
    },
  
    onLoad: function () {
      this.loadBrowseHistory();
    },
  
    onShow: function() {
      this.loadBrowseHistory();
    },
  
    loadBrowseHistory: function() {
      wx.showLoading({ title: '加载中...' });
      
      const userInfo = wx.getStorageSync('userInfo');
      wx.cloud.callFunction({
        name: 'exchangeFunctions',
        data: {
          type: 'getUserBrowseHistory',
          userId: userInfo ? userInfo._id : ''
        }
      }).then(res => {
        wx.hideLoading();
        if (res.result.success) {
          let history = res.result.data.items || [];
          imageUtils.convertImageUrls(history).then(convertedHistory => {
            this.setData({
              browseHistory: convertedHistory
            });
          });
        } else {
          console.error('获取浏览历史失败:', res.result.errMsg);
          this.setData({ browseHistory: [] });
        }
      }).catch(err => {
        wx.hideLoading();
        console.error('获取浏览历史失败:', err);
        this.setData({ browseHistory: [] });
      });
    },

    viewItemDetail: function(e) {
      const id = e.currentTarget.dataset.id;
      if (!id) return wx.showToast({ title: 'ID缺失', icon: 'none' });
      wx.navigateTo({ url: '../detail/detail?id=' + id });
    },
  
    deleteItem: async function(e) {
      const id = e.currentTarget.dataset.id;
      const historyId = e.currentTarget.dataset.historyId;
      if (!id) return wx.showToast({ title: 'ID缺失', icon: 'none' });
  
      const confirm = await wx.showModal({
        title: '删除记录',
        content: '确定要删除这条浏览记录吗？'
      });
  
      if (!confirm.confirm) return;
  
      const userInfo = wx.getStorageSync('userInfo');
      wx.showLoading({ title: '删除中...' });
      
      wx.cloud.callFunction({
        name: 'exchangeFunctions',
        data: {
          type: 'deleteBrowseHistoryItem',
          historyId: historyId,
          userId: userInfo ? userInfo._id : ''
        }
      }).then(res => {
        wx.hideLoading();
        if (res.result.success) {
          wx.showToast({ title: '删除成功', icon: 'success' });
          this.loadBrowseHistory();
        } else {
          wx.showToast({ title: '删除失败', icon: 'none' });
        }
      }).catch(err => {
        wx.hideLoading();
        wx.showToast({ title: '网络错误', icon: 'none' });
      });
    },
  
    clearHistory: async function() {
      const confirm = await wx.showModal({
        title: '清空历史',
        content: '确定要清空所有浏览记录吗？'
      });
  
      if (!confirm.confirm) return;
  
      const userInfo = wx.getStorageSync('userInfo');
      wx.showLoading({ title: '清空中...' });
      
      wx.cloud.callFunction({
        name: 'exchangeFunctions',
        data: {
          type: 'clearBrowseHistory',
          userId: userInfo ? userInfo._id : ''
        }
      }).then(res => {
        wx.hideLoading();
        if (res.result.success) {
          wx.showToast({ title: '清空成功', icon: 'success' });
          this.setData({ browseHistory: [] });
        } else {
          wx.showToast({ title: '清空失败', icon: 'none' });
        }
      }).catch(err => {
        wx.hideLoading();
        wx.showToast({ title: '网络错误', icon: 'none' });
      });
    },
  
    formatTime: function(time) {
      if (!time) return '';
      const d = new Date(time);
      const now = new Date();
      const diff = now.getTime() - d.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      
      if (days === 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours === 0) {
          const minutes = Math.floor(diff / (1000 * 60));
          return minutes <= 0 ? '刚刚' : minutes + '分钟前';
        }
        return hours + '小时前';
      } else if (days === 1) {
        return '昨天';
      } else if (days < 7) {
        return days + '天前';
      } else {
        const y = d.getFullYear();
        const m = (d.getMonth() + 1).toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        return `${y}-${m}-${day}`;
      }
    },
  
    goBack: function() {
      wx.navigateBack();
    }
  });