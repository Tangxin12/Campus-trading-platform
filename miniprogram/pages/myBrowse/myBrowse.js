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
      try {
        const history = wx.getStorageSync('browseHistory') || [];
        this.setData({
          browseHistory: history
        });
      } catch (err) {
        console.error('加载浏览历史失败:', err);
      }
    },
  
    viewItemDetail: function(e) {
      const id = e.currentTarget.dataset.id;
      if (!id) return wx.showToast({ title: 'ID缺失', icon: 'none' });
      wx.navigateTo({ url: '../detail/detail?id=' + id });
    },
  
    deleteItem: async function(e) {
      const id = e.currentTarget.dataset.id;
      if (!id) return wx.showToast({ title: 'ID缺失', icon: 'none' });
  
      const confirm = await wx.showModal({
        title: '删除记录',
        content: '确定要删除这条浏览记录吗？'
      });
  
      if (!confirm.confirm) return;
  
      try {
        const history = wx.getStorageSync('browseHistory') || [];
        const newHistory = history.filter(item => item._id !== id);
        wx.setStorageSync('browseHistory', newHistory);
        this.setData({
          browseHistory: newHistory
        });
        wx.showToast({ title: '删除成功', icon: 'success' });
      } catch (err) {
        console.error('删除浏览记录失败:', err);
        wx.showToast({ title: '删除失败', icon: 'none' });
      }
    },
  
    clearHistory: async function() {
      const confirm = await wx.showModal({
        title: '清空历史',
        content: '确定要清空所有浏览记录吗？'
      });
  
      if (!confirm.confirm) return;
  
      try {
        wx.setStorageSync('browseHistory', []);
        this.setData({
          browseHistory: []
        });
        wx.showToast({ title: '清空成功', icon: 'success' });
      } catch (err) {
        console.error('清空浏览历史失败:', err);
        wx.showToast({ title: '清空失败', icon: 'none' });
      }
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