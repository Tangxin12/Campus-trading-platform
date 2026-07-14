Page({
    data: {
      collections: []
    },
  
    onLoad: function () {
      this.getCollections();
    },
  
    onPullDownRefresh: function () {
      this.getCollections().finally(() => {
        wx.stopPullDownRefresh();
      });
    },
  
    // 👇 和首页完全一样的获取临时链接方法
    getTempFileUrl(fileID) {
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
            reject(res.result.message);
          }
        }).catch(err => {
          reject(err);
        });
      });
    },
  
    // 👇 和首页一样批量转图片
    async convertImageUrls(items) {
      const list = JSON.parse(JSON.stringify(items));
      for (let i = 0; i < list.length; i++) {
        const item = list[i];
        const img = item.itemImage || item.image;
        try {
          item.imageUrl = await this.getTempFileUrl(img);
        } catch (e) {
          item.imageUrl = "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=product%20placeholder%20image&image_size=square";
        }
      }
      return list;
    },
  
    // 👇 获取收藏列表
    async getCollections() {
      wx.showLoading({ title: '加载中...', mask: true });
      try {
        const res = await wx.cloud.callFunction({
          name: 'exchangeFunctions',
          data: {
            type: 'getUserCollections',
            page: 1,
            pageSize: 20
          }
        });
  
        if (!res.result?.success) {
          wx.showToast({ title: '获取失败', icon: 'none' });
          return;
        }
  
        let collections = res.result.data.items || [];
        // ✅ 关键：用首页的方式转图片
        collections = await this.convertImageUrls(collections);
        this.setData({ collections });
  
      } catch (err) {
        console.error(err);
        wx.showToast({ title: '网络错误', icon: 'none' });
      } finally {
        wx.hideLoading();
      }
    },
  
    // 查看详情
    viewItemDetail(e) {
      const id = e.currentTarget.dataset.id;
      if (!id) return wx.showToast({ title: 'ID缺失', icon: 'none' });
      wx.navigateTo({ url: '../detail/detail?id=' + id });
    },
  
    // 取消收藏
    async uncollectItem(e) {
      const id = e.currentTarget.dataset.id;
      if (!id) return wx.showToast({ title: 'ID缺失', icon: 'none' });
  
      const confirm = await wx.showModal({
        title: '取消收藏',
        content: '确定要取消收藏吗？'
      });
  
      if (!confirm.confirm) return;
  
      wx.showLoading({ title: '取消中...' });
      try {
        const res = await wx.cloud.callFunction({
          name: 'exchangeFunctions',
          data: { type: 'uncollectItem', itemId: id }
        });
        if (res.result?.success) {
          wx.showToast({ title: '取消成功', icon: 'success' });
          this.getCollections();
        } else {
          wx.showToast({ title: '取消失败', icon: 'none' });
        }
      } catch (err) {
        wx.showToast({ title: '网络错误', icon: 'none' });
      } finally {
        wx.hideLoading();
      }
    },
  
    // 时间格式化
    formatTime(time) {
      if (!time) return '';
      const d = new Date(time);
      const y = d.getFullYear();
      const m = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      return `${y}-${m}-${day}`;
    },
  
    // 返回
    goBack() {
      wx.navigateBack();
    }
  });