// publish.js
Page({
  data: {
    // 用户信息
    userInfo: null,
    
    // 物品图片
    images: [],
    
    // 自有物品信息
    itemName: '',
    selectedCategory: '',
    selectedCondition: '',
    itemDescription: '',
    price: '',
    
    // 发布设置
    selectedCampus: '',
    selectedExchangeMethod: '',
    exchangeAddress: '',
    selectedOfflineTime: '',
    
    // 选项数据
    categories: ['数码产品', '服饰箱包', '图书文具', '生活用品', '美妆', '运动器材'],
    conditions: ['全新', '9成新', '8成新', '7成新', '破旧'],
    exchangeMethods: ['仅本校自提', '指定校园地点当面交换'],
    campuses: ['康美', '美林'],
    offlineTimes: ['7天', '15天', '30天'],
    
    // 编辑模式
    isEdit: false,
    editItemId: ''
  },

//   onLoad: function(options) {
//     // 设置默认校区为康美
//     this.setData({
//       selectedCampus: '康美'
//     });
    
//     // 获取用户信息
//     this.getUserInfo();
    
//     // 检查是否是编辑模式
//     if (options && options.edit === 'true' && options.id) {
//       this.setData({
//         isEdit: true,
//         editItemId: options.id
//       });
//       // 获取物品详情并填充表单
//       this.loadItemDetail(options.id);
//     }
//   },
onLoad: function(options) {
    // 设置默认校区为康美
    this.setData({
      selectedCampus: '康美'
    });
    
    // 获取用户信息
    this.getUserInfo();
  
    let editId = '';
    let isEditFlag = false;
  
    // 1. 普通跳转携带参数（备用）
    if (options && options.edit === 'true' && options.id) {
      editId = options.id;
      isEditFlag = true;
    } else {
      // 2. Tab切换，从缓存读取编辑ID
      const cacheEdit = wx.getStorageSync('isEditMode');
      const cacheId = wx.getStorageSync('editItemId');
      if (cacheEdit && cacheId) {
        editId = cacheId;
        isEditFlag = true;
        // 读取完清空缓存，防止下次新建发布误触发编辑
        wx.removeStorageSync('isEditMode');
        wx.removeStorageSync('editItemId');
      }
    }
  
    if (isEditFlag && editId) {
      this.setData({
        isEdit: true,
        editItemId: editId
      });
      // 加载商品回填表单
      this.loadItemDetail(editId);
    } else {
      // 新建发布模式，清空编辑标记
      this.setData({
        isEdit: false,
        editItemId: '',
        // 清空表单，避免上次编辑残留数据
        itemName: '',
        selectedCategory: '',
        selectedCondition: '',
        itemDescription: '',
        price: '',
        images: [],
        selectedCampus: '康美',
        exchangeAddress: ''
      });
    }
  },
  // 获取用户信息
  getUserInfo: function() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      console.log('【调试】获取到用户信息:', userInfo);
      this.setData({ userInfo });
    } else {
      console.log('【调试】未找到用户信息，需要登录');
      // 如果是编辑模式，不自动跳转，让用户手动登录
      if (!this.data.isEdit) {
        wx.navigateTo({
          url: '../login/login'
        });
      }
    }
  },

  // 加载物品详情（编辑模式）
  loadItemDetail: function(itemId) {
    const that = this;
    wx.showLoading({ title: '加载中...' });
    
    wx.cloud.callFunction({
      name: 'exchangeFunctions',
      data: {
        type: 'getItemDetail',
        itemId: itemId
      }
    }).then(res => {
      wx.hideLoading();
      if (res.result && res.result.success) {
        const item = res.result.data;
        console.log('【调试】加载物品详情:', item);
        
        // 填充表单数据
        that.setData({
          itemName: item.name || '',
          selectedCategory: item.category || '',
          selectedCondition: item.condition || '',
          itemDescription: item.description || '',
          price: item.price ? String(item.price) : '',
          selectedCampus: item.campus || '康美',
          selectedExchangeMethod: item.exchangeMethod || '仅本校自提',
          exchangeAddress: item.exchangeAddress || '',
          selectedOfflineTime: item.offlineTime || '30天',
          images: item.images || []
        });
        
        console.log('【调试】表单已填充完成');
      } else {
        wx.showToast({
          title: '加载物品失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('【调试】加载物品详情失败:', err);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    });
  },

  // 选择图片
  chooseImage: function() {
    const that = this;
    const currentCount = that.data.images.length;
    const maxCount = 9 - currentCount;
    
    wx.chooseImage({
      count: maxCount,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: function(res) {
        const tempFilePaths = res.tempFilePaths;
        const newImages = that.data.images.concat(tempFilePaths);
        
        that.setData({
          images: newImages
        });
      }
    });
  },

  // 删除图片
  deleteImage: function(e) {
    const index = e.currentTarget.dataset.index;
    const images = this.data.images;
    images.splice(index, 1);
    this.setData({
      images: images
    });
  },

  // 物品名称变化
  onItemNameChange: function(e) {
    this.setData({
      itemName: e.detail.value
    });
  },

  // 价格变化
  onPriceChange: function(e) {
    this.setData({
      price: e.detail.value
    });
  },

  // 物品分类选择器
  showCategoryPicker: function() {
    const that = this;
    wx.showActionSheet({
      itemList: that.data.categories,
      success: function(res) {
        that.setData({
          selectedCategory: that.data.categories[res.tapIndex]
        });
      }
    });
  },

  // 新旧程度选择
  selectCondition: function(e) {
    const condition = e.currentTarget.dataset.condition;
    this.setData({
      selectedCondition: condition
    });
  },

  // 物品详情描述变化
  onItemDescriptionChange: function(e) {
    this.setData({
      itemDescription: e.detail.value
    });
  },

  // 发布校区选择器
  showCampusPicker: function() {
    const that = this;
    wx.showActionSheet({
      itemList: that.data.campuses,
      success: function(res) {
        that.setData({
          selectedCampus: that.data.campuses[res.tapIndex]
        });
      }
    });
  },

  // 置换方式选择
  selectExchangeMethod: function(e) {
    const method = e.currentTarget.dataset.method;
    this.setData({
      selectedExchangeMethod: method
    });
  },

  // 自提/交换地址变化
  onExchangeAddressChange: function(e) {
    this.setData({
      exchangeAddress: e.detail.value
    });
  },

  // 自动下架时间选择器
  showOfflineTimePicker: function() {
    const that = this;
    wx.showActionSheet({
      itemList: that.data.offlineTimes,
      success: function(res) {
        that.setData({
          selectedOfflineTime: that.data.offlineTimes[res.tapIndex]
        });
      }
    });
  },

  // 保存草稿
  saveDraft: function() {
    const formData = this.collectFormData();
    
    // 保存到本地存储
    wx.setStorageSync('draft_' + Date.now(), formData);
    
    wx.showToast({
      title: '草稿保存成功',
      icon: 'success'
    });
  },

  // 发布物品（支持新增和编辑）
  publishItem: function() {
    // 检查用户是否登录
    if (!this.data.userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      wx.navigateTo({
        url: '../login/login'
      });
      return;
    }
    
    const formData = this.collectFormData();
    
    // 验证必填项（编辑模式下图片可以为空，保留原有图片）
    if (!this.validateForm(formData, this.data.isEdit)) {
      return;
    }
    
    const isEdit = this.data.isEdit;
    wx.showLoading({
      title: isEdit ? '更新中...' : '发布中...'
    });
    
    // 上传图片到云存储（编辑模式下如果没有新图片，不上传）
    this.uploadImages().then(uploadedImages => {
      console.log('【调试】图片上传成功:', uploadedImages);
      
      // 构建发布数据
      const publishData = {
        itemName: formData.itemName,
        description: formData.description,
        category: formData.category,
        condition: formData.condition,
        price: parseFloat(formData.price) || 0,
        campus: formData.campus,
        exchangeMethod: formData.exchangeMethod,
        exchangeAddress: formData.exchangeAddress,
        offlineTime: formData.offlineTime,
        images: uploadedImages
      };
      
      // 确保用户信息包含正确的字段名
      const userInfo = this.data.userInfo;
      console.log('【调试】发布数据:', publishData);
      console.log('【调试】用户信息:', userInfo);
      
      // 根据模式选择调用的云函数
      const cloudFunctionData = {
        itemData: publishData,
        userInfo: userInfo
      };
      
      let functionType = 'publishItem';
      if (isEdit) {
        functionType = 'updateItem';
        cloudFunctionData.itemId = this.data.editItemId;
      }
      
      wx.cloud.callFunction({
        name: 'exchangeFunctions',
        data: {
          type: functionType,
          ...cloudFunctionData
        }
      }).then(res => {
        wx.hideLoading();
        console.log('【调试】云函数返回:', res);
        
        if (res.result.success) {
          wx.showToast({
            title: isEdit ? '更新成功' : '发布成功',
            icon: 'success'
          });
          
          // 编辑成功后返回上一页，发布成功后跳转到首页
          setTimeout(() => {
            if (isEdit) {
              wx.navigateBack();
            } else {
              wx.switchTab({
                url: '../index/index'
              });
            }
          }, 1500);
        } else {
          wx.showToast({
            title: res.result.errMsg || (isEdit ? '更新失败' : '发布失败'),
            icon: 'none'
          });
        }
      }).catch(err => {
        wx.hideLoading();
        console.error('操作失败:', err);
        wx.showToast({
          title: isEdit ? '更新失败，请重试' : '发布失败，请重试',
          icon: 'none'
        });
      });
    }).catch(err => {
      wx.hideLoading();
      console.error('图片上传失败:', err);
      wx.showToast({
        title: '图片上传失败',
        icon: 'none'
      });
    });
  },

  // 上传图片到云存储（编辑模式下保留原有cloud://路径）
  uploadImages: function() {
    return new Promise((resolve, reject) => {
      if (this.data.images.length === 0) {
        resolve([]);
        return;
      }
      
      const uploadPromises = this.data.images.map((image, index) => {
        return new Promise((resolveOne, rejectOne) => {
          // 如果是云存储路径（编辑模式下的原有图片），直接返回，不上传
          if (image.startsWith('cloud://')) {
            console.log('【调试】保留原有云存储图片:', image);
            resolveOne(image);
            return;
          }
          
          // 本地路径需要上传
          const fileName = 'exchange/' + Date.now() + '_' + index + '.jpg';
          
          wx.cloud.uploadFile({
            cloudPath: fileName,
            filePath: image,
            success: res => {
              console.log('【调试】图片上传成功:', res.fileID);
              resolveOne(res.fileID);
            },
            fail: err => {
              console.error('【调试】图片上传失败:', err);
              rejectOne(err);
            }
          });
        });
      });
      
      Promise.all(uploadPromises).then(fileIDs => {
        resolve(fileIDs);
      }).catch(err => {
        reject(err);
      });
    });
  },

  // 收集表单数据
  collectFormData: function() {
    return {
      images: this.data.images,
      itemName: this.data.itemName,
      category: this.data.selectedCategory,
      condition: this.data.selectedCondition,
      description: this.data.itemDescription,
      price: this.data.price,
      campus: this.data.selectedCampus,
      exchangeMethod: this.data.selectedExchangeMethod,
      exchangeAddress: this.data.exchangeAddress,
      offlineTime: this.data.selectedOfflineTime
    };
  },

  // 验证表单
  validateForm: function(formData, isEdit) {
    // 编辑模式下图片可以为空（保留原有图片）
    if (!isEdit && (!formData.images || formData.images.length === 0)) {
      wx.showToast({
        title: '请至少上传一张物品图片',
        icon: 'none'
      });
      return false;
    }
    
    if (!formData.itemName || formData.itemName.trim().length === 0) {
      wx.showToast({
        title: '请输入物品名称',
        icon: 'none'
      });
      return false;
    }
    
    if (!formData.category) {
      wx.showToast({
        title: '请选择物品分类',
        icon: 'none'
      });
      return false;
    }
    
    if (!formData.condition) {
      wx.showToast({
        title: '请选择物品新旧程度',
        icon: 'none'
      });
      return false;
    }
    
    if (!formData.price || formData.price.trim() === '') {
      wx.showToast({
        title: '请输入物品价格',
        icon: 'none'
      });
      return false;
    }
    
    if (!formData.campus) {
      wx.showToast({
        title: '请选择发布校区',
        icon: 'none'
      });
      return false;
    }
    
    if (!formData.exchangeMethod) {
      wx.showToast({
        title: '请选择置换方式',
        icon: 'none'
      });
      return false;
    }
    
    return true;
  }
});
