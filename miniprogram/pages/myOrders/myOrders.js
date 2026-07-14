Page({
    data: {
      activeTab: 'all',
      orders: [],
      page: 1,
      pageSize: 10,
      hasMore: true,
      loading: false,
      userInfo: null
    },
  
    onLoad: function() {
      // 获取用户信息（确保包含 _id）
      const userInfo = wx.getStorageSync('userInfo');
      this.setData({ userInfo });
      
      // 加载订单列表
      this.loadOrders();
    },
  
    onShow: function() {
      // 每次显示页面时刷新订单
      this.setData({ page: 1, orders: [] });
      this.loadOrders();
    },
  
    // 【核心复用】通用获取临时链接的方法（和首页完全一致）
    getTempFileUrl(fileID) {
      return new Promise((resolve, reject) => {
        // 如果不是cloud://路径，直接返回
        if (!fileID || !fileID.startsWith('cloud://')) {
          resolve(fileID);
          return;
        }
  
        wx.cloud.callFunction({
          name: 'getTempFileUrl', // 你部署的云函数名称
          data: {
            fileID: fileID
          }
        }).then(res => {
          console.log('获取临时链接结果:', res);
          if (res.result.success) {
            resolve(res.result.tempFileURL);
          } else {
            reject(new Error(res.result.message || '获取临时链接失败'));
          }
        }).catch(err => {
          reject(new Error('云函数调用失败: ' + err.message));
        });
      });
    },
  
    // 【核心复用】批量转换订单图片URL（参考首页convertImageUrls逻辑）
    convertOrderImageUrls: async function(orders) {
      const convertedOrders = JSON.parse(JSON.stringify(orders));
      
      // 遍历所有订单，转换图片链接
      for (let i = 0; i < convertedOrders.length; i++) {
        const order = convertedOrders[i];
        
        // 转换商品图片
        if (order.itemImage) {
          try {
            order.itemImage = await this.getTempFileUrl(order.itemImage);
          } catch (err) {
            console.error(`订单${i}商品图片转换失败:`, err);
            // 失败时使用默认图片兜底
            order.itemImage = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=vintage%20camera&image_size=square';
          }
        }
        
        // 转换卖家头像
        if (order.sellerAvatar) {
          try {
            order.sellerAvatar = await this.getTempFileUrl(order.sellerAvatar);
          } catch (err) {
            console.error(`订单${i}卖家头像转换失败:`, err);
            order.sellerAvatar = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=user%20avatar%20placeholder%20circular%20portrait&image_size=square';
          }
        }
        
        // 转换买家头像
        if (order.buyerAvatar) {
          try {
            order.buyerAvatar = await this.getTempFileUrl(order.buyerAvatar);
          } catch (err) {
            console.error(`订单${i}买家头像转换失败:`, err);
            order.buyerAvatar = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=user%20avatar%20placeholder%20circular%20portrait&image_size=square';
          }
        }
      }
      
      console.log('【订单调试】转换后的图片数据:', convertedOrders);
      return convertedOrders;
    },
  
    // 切换标签
    switchTab: function(e) {
      const tab = e.currentTarget.dataset.tab;
      this.setData({
        activeTab: tab,
        page: 1,
        orders: [],
        hasMore: true
      });
      this.loadOrders();
    },
  
    // 加载订单列表（复用首页逻辑改造）
    loadOrders: function() {
      if (this.data.loading || !this.data.hasMore) return;
      
      this.setData({ loading: true });
      wx.showLoading({ title: '加载中...' });
      
      // 核心：只传递 users 表的 _id
      const userInfo = this.data.userInfo;
      const userId = userInfo ? userInfo._id : '';
      
      wx.cloud.callFunction({
        name: 'orderFunctions',
        data: {
          type: 'getOrders',
          status: this.data.activeTab === 'all' ? '' : this.data.activeTab,
          page: this.data.page,
          pageSize: this.data.pageSize,
          userId: userId // 只传 _id，无 openId
        }
      }).then(res => {
        wx.hideLoading();
        
        if (res.result.success) {
          let newOrders = res.result.data.orders;
          console.log('【订单调试】获取到订单:', newOrders.length, '条');
          
          // 转换订单中的所有图片链接（复用首页逻辑）
          this.convertOrderImageUrls(newOrders).then(convertedOrders => {
            const orders = this.data.page === 1 ? convertedOrders : [...this.data.orders, ...convertedOrders];
            
            this.setData({
              orders: orders,
              hasMore: newOrders.length === this.data.pageSize,
              page: this.data.page + 1,
              loading: false
            });
          });
        } else {
          wx.showToast({
            title: res.result.message || '加载失败',
            icon: 'none'
          });
          this.setData({ loading: false });
        }
      }).catch(err => {
        wx.hideLoading();
        console.error('加载订单失败:', err);
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
        this.setData({ loading: false });
      });
    },
  
    // 加载更多
    loadMore: function() {
      if (this.data.hasMore && !this.data.loading) {
        this.loadOrders();
      }
    },
  
    // 获取状态文本
    getStatusText: function(status) {
      const statusMap = {
        'pending': '待确认',
        'confirmed': '进行中',
        'completed': '已完成',
        'cancelled': '已取消'
      };
      return statusMap[status] || status;
    },
  
    // 判断当前用户是否是卖家（纯 _id 匹配）
    isSeller: function(order) {
      const userInfo = this.data.userInfo;
      return userInfo && order.sellerId === userInfo._id;
    },
  
    // 判断是否已评价
    hasRated: function(order) {
      const userInfo = this.data.userInfo;
      if (!userInfo) return false;
      
      if (this.isSeller(order)) {
        return !!order.sellerRating;
      } else {
        return !!order.buyerRating;
      }
    },
  
    // 确认订单（卖家）
    confirmOrder: function(e) {
      const orderId = e.currentTarget.dataset.id;
      const userId = this.data.userInfo._id;
      
      wx.showModal({
        title: '确认交易',
        content: '确认接受此交易请求吗？',
        success: (res) => {
          if (res.confirm) {
            this.updateOrderStatus(orderId, 'confirmed', userId);
          }
        }
      });
    },
  
    // 完成订单
    completeOrder: function(e) {
      const orderId = e.currentTarget.dataset.id;
      const userId = this.data.userInfo._id;
      
      wx.showModal({
        title: '确认完成',
        content: '确认交易已完成吗？',
        success: (res) => {
          if (res.confirm) {
            this.updateOrderStatus(orderId, 'completed', userId);
          }
        }
      });
    },
  
    // 取消订单（直接删除订单）
    cancelOrder: function(e) {
      const orderId = e.currentTarget.dataset.id;
      const userId = this.data.userInfo._id;
      
      wx.showModal({
        title: '取消订单',
        content: '确定要取消并删除此订单吗？删除后不可恢复。',
        success: (res) => {
          if (res.confirm) {
            this.doDeleteOrder(orderId, userId);
          }
        }
      });
    },
  
    // 更新订单状态（传递 userId）
    updateOrderStatus: function(orderId, status, userId) {
      wx.showLoading({ title: '处理中...' });
      
      wx.cloud.callFunction({
        name: 'orderFunctions',
        data: {
          type: 'updateOrderStatus',
          orderId: orderId,
          status: status,
          userId: userId // 传递 _id
        }
      }).then(res => {
        wx.hideLoading();
        
        if (res.result.success) {
          wx.showToast({
            title: '操作成功',
            icon: 'success'
          });
          // 从本地数组中移除该订单
          const orders = this.data.orders.filter(order => order._id !== orderId);
          this.setData({ orders: orders });
        } else {
          wx.showToast({
            title: res.result.message || '操作失败',
            icon: 'none'
          });
        }
      }).catch(err => {
        wx.hideLoading();
        console.error('更新订单状态失败:', err);
        wx.showToast({
          title: '操作失败',
          icon: 'none'
        });
      });
    },
  
    // 联系对方
    contactUser: function(e) {
      const orderId = e.currentTarget.dataset.id;
      const order = this.data.orders.find(item => item._id === orderId);
      
      if (!order) return;
      
      // 判断当前用户角色，获取对方信息（纯 _id 匹配）
      const isSeller = this.isSeller(order);
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
  
    // 查看物品详情
    viewItemDetail: function(e) {
      const itemId = e.currentTarget.dataset.id;
      wx.navigateTo({
        url: '../detail/detail?id=' + itemId
      });
    },
  
    // 评价订单
    rateOrder: function(e) {
      const orderId = e.currentTarget.dataset.id;
      wx.navigateTo({
        url: '../orderRate/orderRate?orderId=' + orderId + '&userId=' + this.data.userInfo._id
      });
    },
  
    // 查看订单详情
    viewDetail: function(e) {
      const orderId = e.currentTarget.dataset.id;
      wx.navigateTo({
        url: '../orderDetail/orderDetail?orderId=' + orderId
      });
    },
  
    // 删除订单
    deleteOrder: function(e) {
      const orderId = e.currentTarget.dataset.id;
      const userId = this.data.userInfo._id;
      
      wx.showModal({
        title: '删除订单',
        content: '确定要删除此订单吗？删除后不可恢复。',
        success: (res) => {
          if (res.confirm) {
            this.doDeleteOrder(orderId, userId);
          }
        }
      });
    },
  
    // 执行删除订单（传递 userId）
    doDeleteOrder: function(orderId, userId) {
      wx.showLoading({ title: '删除中...' });
      
      wx.cloud.callFunction({
        name: 'orderFunctions',
        data: {
          type: 'deleteOrder',
          orderId: orderId,
          userId: userId // 传递 _id
        }
      }).then(res => {
        wx.hideLoading();
        
        if (res.result.success) {
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
          // 从本地数组中移除该订单，不刷新整个页面
          const orders = this.data.orders.filter(order => order._id !== orderId);
          this.setData({ orders: orders });
        } else {
          wx.showToast({
            title: res.result.message || '删除失败',
            icon: 'none'
          });
        }
      }).catch(err => {
        wx.hideLoading();
        console.error('删除订单失败:', err);
        wx.showToast({
          title: '删除失败',
          icon: 'none'
        });
      });
    },
  
    // 格式化时间
    formatTime: function(date) {
      if (!date) return '';
      
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      
      const year = d.getFullYear();
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      const hour = d.getHours().toString().padStart(2, '0');
      const minute = d.getMinutes().toString().padStart(2, '0');
      
      return `${year}-${month}-${day} ${hour}:${minute}`;
    },
  
    // 返回上一页
    goBack: function() {
      wx.navigateBack();
    }
  });