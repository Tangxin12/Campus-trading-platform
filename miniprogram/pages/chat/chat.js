Page({
    data: {
      // 聊天对象信息
      userId: '',
      userName: '',
      userAvatar: '',
      
      // 物品信息
      itemId: '',
      itemName: '',
      itemImage: '',
      itemPrice: '',
      itemCondition: '9成新',
      itemStatus: 'pending', // pending, confirmed, completed
      showItemCard: true,
      
      // 自己的信息
      myAvatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=user%20avatar%20placeholder%20circular%20portrait&image_size=square',
      myUserId: '', // 当前用户ID
      
      // 消息相关
      messages: [],
      inputValue: '',
      
      // 快捷语
      showQuickPhrases: false,
      quickPhrases: [
        '我想用 XX 换你的 XX',
        '什么时候可以当面交换？',
        '能看看物品实拍吗？',
        '我对这个很感兴趣'
      ],
      
      // 预设的欢迎消息模板
      welcomeMessages: [
        '你好，对我的物品感兴趣吗？',
        '嗨，看到你对我的东西感兴趣，想了解更多吗？',
        '你好，有什么可以帮到你的吗？',
        '嗨，很高兴认识你，关于这个物品你有什么问题吗？'
      ],
      
      // 预设的回复消息模板
      replyMessages: [
        '好的，我考虑一下',
        '这个物品状态怎么样？',
        '你想怎么置换呢？',
        '可以约个时间当面看看吗？',
        '这个价格还能商量吗？',
        '好的，没问题',
        '我对这个很感兴趣',
        '请问这个物品还在吗？'
      ]
    },
  
    onLoad: function(options) {
      console.log('【调试】聊天页面加载，options:', options);
      
      // 获取当前登录用户的信息
      const userInfo = wx.getStorageSync('userInfo');
      console.log('【调试】当前登录用户信息:', userInfo);
      
      if (userInfo) {
        this.setData({
          myAvatar: userInfo.avatar || this.data.myAvatar,
          myUserId: userInfo._id || '' // 存储当前用户ID
        });
      }
      
      if (options.chatData) {
        try {
          const chatData = JSON.parse(decodeURIComponent(options.chatData));
          console.log('【调试】解析chatData:', chatData);
          
          // 判断当前用户是否是卖家
          const isSeller = userInfo && userInfo._id === chatData.userId;
          
          this.setData({
            userId: chatData.userId || '', // 卖家ID（商品发布者ID）
            userName: chatData.userName || '未知用户',
            userAvatar: chatData.userAvatar || this.data.myAvatar,
            itemId: chatData.itemId || '',
            itemName: chatData.itemName || '未知物品',
            itemImage: chatData.itemImage || '',
            itemPrice: chatData.price || '0',
            itemCondition: chatData.condition || '9成新',
            isSeller: isSeller
          });
          
          // 设置导航栏标题
          wx.setNavigationBarTitle({
            title: chatData.userName || '聊天'
          });
          
          // 生成随机欢迎消息
          this.generateWelcomeMessage(chatData.itemName || '商品');
        } catch (e) {
          console.error('【调试】解析chatData失败:', e);
          // 如果解析失败，使用默认数据
          this.setData({
            userId: options.userId || '',
            userName: '用户',
            userAvatar: this.data.myAvatar,
            itemId: '',
            itemName: '商品名称',
            itemImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=vintage%20camera&image_size=square',
            itemPrice: '0',
            itemCondition: '9成新',
            isSeller: false
          });
          
          // 生成随机欢迎消息
          this.generateWelcomeMessage('商品');
        }
      } else if (options.userId) {
        // 兼容旧的传参方式
        this.setData({
          userId: options.userId || '',
          userName: '用户',
          userAvatar: this.data.myAvatar,
          itemId: '',
          itemName: '商品名称',
          itemImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=vintage%20camera&image_size=square',
          itemPrice: '0',
          itemCondition: '9成新',
          isSeller: false
        });
        
        // 设置导航栏标题
        wx.setNavigationBarTitle({
          title: '用户'
        });
        
        // 生成随机欢迎消息
        this.generateWelcomeMessage('商品');
      }
    },
    
    // 生成随机欢迎消息
    generateWelcomeMessage: function(itemName) {
      const welcomeMessages = this.data.welcomeMessages;
      const randomIndex = Math.floor(Math.random() * welcomeMessages.length);
      const welcomeMessage = welcomeMessages[randomIndex].replace('物品', itemName).replace('东西', itemName);
      
      const messages = [{
        type: 'received',
        content: welcomeMessage,
        time: this.getCurrentTime()
      }];
      
      this.setData({ messages });
    },
  
    // 发送消息
    sendMessage: function() {
      const content = this.data.inputValue.trim();
      if (!content) return;
      
      const newMessage = {
        type: 'sent',
        content: content,
        time: this.getCurrentTime()
      };
      
      this.setData({
        messages: [...this.data.messages, newMessage],
        inputValue: '',
        showQuickPhrases: false
      });
      
      // 模拟对方回复
      setTimeout(() => {
        const replyMessages = this.data.replyMessages;
        const randomIndex = Math.floor(Math.random() * replyMessages.length);
        const replyMessage = {
          type: 'received',
          content: replyMessages[randomIndex],
          time: this.getCurrentTime()
        };
        this.setData({
          messages: [...this.data.messages, replyMessage]
        });
      }, 1000);
    },
  
    // 发送快捷语
    sendQuickPhrase: function(e) {
      const phrase = e.currentTarget.dataset.phrase;
      const newMessage = {
        type: 'sent',
        content: phrase,
        time: this.getCurrentTime()
      };
      
      this.setData({
        messages: [...this.data.messages, newMessage],
        showQuickPhrases: false
      });
    },
  
    // 切换快捷语显示
    toggleQuickPhrases: function() {
      this.setData({
        showQuickPhrases: !this.data.showQuickPhrases
      });
    },
  
    // 输入框内容变化
    onInputChange: function(e) {
      this.setData({
        inputValue: e.detail.value
      });
    },
  
    // 输入框聚焦
    onInputFocus: function() {
      this.setData({
        showQuickPhrases: false
      });
    },
  
    // 输入框失焦
    onInputBlur: function() {
      // 可以添加相关逻辑
    },
  
    // 选择图片
    chooseImage: function() {
      wx.chooseImage({
        count: 1,
        sizeType: ['original', 'compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const tempFilePaths = res.tempFilePaths;
          // 这里可以上传图片到云存储，然后发送图片消息
          const imageMessage = {
            type: 'sent',
            content: '[图片]',
            time: this.getCurrentTime(),
            imageUrl: tempFilePaths[0]
          };
          this.setData({
            messages: [...this.data.messages, imageMessage]
          });
        }
      });
    },
  
    // 拍照
    takePhoto: function() {
      wx.chooseImage({
        count: 1,
        sizeType: ['original', 'compressed'],
        sourceType: ['camera'],
        success: (res) => {
          const tempFilePaths = res.tempFilePaths;
          // 这里可以上传图片到云存储，然后发送图片消息
          const imageMessage = {
            type: 'sent',
            content: '[图片]',
            time: this.getCurrentTime(),
            imageUrl: tempFilePaths[0]
          };
          this.setData({
            messages: [...this.data.messages, imageMessage]
          });
        }
      });
    },
  
    // 查看物品详情
    viewItemDetail: function() {
      if (!this.data.itemId) {
        wx.showToast({
          title: '物品ID无效',
          icon: 'none'
        });
        return;
      }
      
      wx.navigateTo({
        url: '../detail/detail?id=' + this.data.itemId
      });
    },
  
    // 发起交易（最终版：从商品表读取商品图片+卖家头像的cloud://路径）
    createOrder: async function() {
      const { itemId, userId, itemName } = this.data;
      const userInfo = wx.getStorageSync('userInfo');
      
      console.log('【发起交易】物品ID:', itemId, '卖家ID:', userId);
      
      // 1. 基础校验
      if (!userInfo || !userInfo._id) {
        wx.showToast({ title: '请先登录', icon: 'none' });
        return;
      }
      if (!itemId || !userId) {
        wx.showToast({ title: '信息无效', icon: 'none' });
        return;
      }
  
      // 2. 核心逻辑：从商品表读取原生cloud://路径（商品图片+卖家头像）
      wx.showLoading({ title: '加载中...' });
      let finalItemImage = ''; // 商品图片cloud://路径
      let finalSellerAvatar = ''; // 卖家头像cloud://路径
      try {
        // 强制转字符串，避免ID格式不匹配
        const itemIdStr = String(itemId).trim();
        // 只查商品表，不查users表（避免卖家ID不存在报错）
        const itemRes = await wx.cloud.database().collection('exchangeItem').doc(itemIdStr).get();
        const itemData = itemRes.data || {};
  
        // 从商品表直接读取：image=商品图，avatar=卖家头像（都是cloud://）
        finalItemImage = itemData.image || '';
        finalSellerAvatar = itemData.avatar || '';
        
        console.log('【发起交易】读取到的cloud路径：', {
          itemImage: finalItemImage,
          sellerAvatar: finalSellerAvatar
        });
      } catch (err) {
        wx.hideLoading();
        console.error('读取商品表失败:', err);
        wx.showToast({ title: '加载图片路径失败', icon: 'none' });
        return;
      }
      wx.hideLoading();
  
      // 3. 确认发起交易
      wx.showModal({
        title: '发起交易',
        content: `确定要向 ${this.data.userName} 发起"${itemName}"的交易请求吗？`,
        success: (res) => {
          if (!res.confirm) return;
          wx.showLoading({ title: '创建中...' });
  
          // 4. 构建订单参数（全部使用原生cloud://路径）
          const params = {
            type: 'createOrder',
            itemId: String(itemId).trim(),
            sellerId: String(userId).trim(),
            buyerId: String(userInfo._id).trim(),
            buyerInfo: userInfo,
            itemName: itemName || '未知物品',
            itemImage: finalItemImage, // ✅ 商品图片：cloud://
            itemPrice: this.data.itemPrice || 0,
            sellerName: this.data.userName || '未知卖家',
            sellerAvatar: finalSellerAvatar // ✅ 卖家头像：cloud://
          };
  
          console.log('【发起交易】最终订单参数:', params);
  
          // 5. 调用云函数创建订单
          wx.cloud.callFunction({
            name: 'orderFunctions',
            data: params
          }).then(res => {
            wx.hideLoading();
            console.log('【发起交易】云函数返回结果:', res);
            
            if (res.result && res.result.success) {
              wx.showToast({ title: '交易请求已发送', icon: 'success' });
              
              // 发送系统消息
              const orderMessage = {
                type: 'sent',
                content: `我发起了"${itemName}"的交易请求，请查看订单确认`,
                time: this.getCurrentTime()
              };
              this.setData({
                messages: [...this.data.messages, orderMessage]
              });
              
              // 跳转到我的订单页
              setTimeout(() => {
                wx.navigateTo({ url: '../myOrders/myOrders' });
              }, 1500);
            } else {
              const errorMsg = res.result?.message || '创建订单失败';
              console.error('【发起交易】创建失败:', errorMsg);
              wx.showToast({ title: errorMsg, icon: 'none' });
            }
          }).catch(err => {
            wx.hideLoading();
            console.error('【发起交易】云函数调用失败:', err);
            wx.showToast({ title: '创建失败，请重试', icon: 'none' });
          });
        }
      });
    },
  
    // 标记为完成
    markAsCompleted: function() {
      wx.showModal({
        title: '标记完成',
        content: '确定要标记这个置换为完成吗？',
        success: (res) => {
          if (res.confirm) {
            this.setData({
              itemStatus: 'completed'
            });
            wx.showToast({ title: '置换已完成', icon: 'success' });
          }
        }
      });
    },
  
    // 加载更多消息
    loadMoreMessages: function() {
      // 这里可以添加加载历史消息的逻辑
      console.log('加载更多消息');
    },
  
    // 返回上一页
    goBack: function() {
      wx.navigateBack();
    },
  
    // 获取当前时间
    getCurrentTime: function() {
      const date = new Date();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }
  });