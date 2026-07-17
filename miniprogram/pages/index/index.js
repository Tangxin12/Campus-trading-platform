const imageUtils = require('../../utils/imageUtils.js');

Page({
    data: {
      // 校区数据
      campuses: ['康美', '美林'],
      currentCampus: '康美',
      // 搜索关键词
      searchKeyword: '',
      // 顶部导航数据
      categories: ['全部', '数码产品', '服饰箱包', '图书文具', '生活用品', '美妆', '运动器材'],
      // 轮播图数据
      swiperList: [
        {
          image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=campus%20exchange%20activity%20banner%20with%20blue%20and%20purple%20gradient%20theme%20modern%20design&image_size=landscape_16_9',
          title: '新学期置换季',
          subtitle: '发现更多精彩物品'
        },
        {
          image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=second%20hand%20goods%20exchange%20banner%20with%20modern%20design%20vibrant%20colors&image_size=landscape_16_9',
          title: '环保生活新方式',
          subtitle: '让闲置物品重获新生'
        },
        {
          image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=campus%20life%20exchange%20event%20with%20vibrant%20colors%20modern%20style&image_size=landscape_16_9',
          title: '校园生活好帮手',
          subtitle: '轻松置换所需物品'
        }
      ],
      // 热门置换数据
      hotList: [],
      // 猜你喜欢推荐数据
      guessRecommendList: [],
      // 热门推荐数据
      hotRecommendList: [],
      // 当前推荐标签
      recommendTab: 'guess',
      // 物品列表数据
      goodsList: [],
      // 加载状态
      loading: true,
      // 当前分类
      currentCategory: '',
      // 当前排序
      currentSort: 'createdAt',
      // 当前页码
      currentPage: 1,
      // 顶部测试图片的临时链接
      testImageUrl: ''
    },
  
    onLoad: function() {
      // 页面加载时初始化
      this.getExchangeItems();
      this.getHotItems();
      this.getRecommendItems();
      // 加载顶部测试图片
      this.loadTestImage();
    },
  
    // 加载顶部测试图片（你的bag.jpg）
    loadTestImage() {
      const fileID = 'cloud://cloud1-7gc4fmm813ecee0f.636c-cloud1-7gc4fmm813ecee0f-1404634949/goods/bag.jpg';
      imageUtils.getTempFileUrl(fileID).then(tempUrl => {
        this.setData({
          testImageUrl: tempUrl
        });
      }).catch(err => {
        console.error('测试图片加载失败:', err);
        this.setData({
          testImageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beige%20handbag&image_size=square'
        });
      });
    },

    // 获取置换物品列表（返回Promise便于调试）
    getExchangeItems: function() {
      return new Promise((resolve, reject) => {
        wx.showLoading({
          title: '加载中...'
        });
        
        wx.cloud.callFunction({
          name: 'exchangeFunctions',
          data: {
            type: 'getExchangeItems',
            page: this.data.currentPage,
            pageSize: 10,
            category: this.data.currentCategory,
            sortBy: this.data.currentSort,
            campus: this.data.currentCampus
          }
        }).then(res => {
          wx.hideLoading();
          console.log('【列表调试】云函数返回:', res);
          
          if (res.result.success) {
            let items = res.result.data.items || [];
            console.log('【列表调试】获取到物品:', items.length, '条', '分类:', this.data.currentCategory, '排序:', this.data.currentSort);
            
            imageUtils.convertImageUrls(items).then(convertedItems => {
              this.setData({
                goodsList: this.data.currentPage === 1 ? convertedItems : [...this.data.goodsList, ...convertedItems],
                loading: false
              });
              resolve(convertedItems);
            });
          } else {
            wx.showToast({
              title: res.result.errMsg || '加载失败',
              icon: 'none'
            });
            this.setData({ loading: false });
            reject(res.result.errMsg);
          }
        }).catch(err => {
          wx.hideLoading();
          console.error('【列表调试】调用失败:', err);
          wx.showToast({
            title: '加载失败',
            icon: 'none'
          });
          this.setData({ loading: false });
          reject(err);
        });
      });
    },
  
    // 获取热门置换物品
    getHotItems: function() {
      wx.cloud.callFunction({
        name: 'exchangeFunctions',
        data: {
          type: 'getExchangeItems',
          page: 1,
          pageSize: 6,
          sortBy: 'hot'
        }
      }).then(res => {
        if (res.result.success) {
          let items = res.result.data.items;
          imageUtils.convertImageUrls(items).then(convertedItems => {
            this.setData({
              hotList: convertedItems
            });
          });
        }
      }).catch(err => {
        console.error('获取热门物品失败:', err);
      });
    },

    // 获取猜你喜欢推荐物品（从云数据库读取浏览历史）
    getRecommendItems: function() {
      const userInfo = wx.getStorageSync('userInfo');
      
      wx.cloud.callFunction({
        name: 'exchangeFunctions',
        data: {
          type: 'getUserBrowseHistory',
          userId: userInfo ? userInfo._id : ''
        }
      }).then(historyRes => {
        if (historyRes.result.success) {
          const browseHistory = historyRes.result.data.items || [];
          const categories = [...new Set(browseHistory.map(item => item.category))].filter(Boolean);
          const excludeIds = browseHistory.map(item => item.itemId);
          
          console.log('【智能推荐】浏览历史分类:', categories);
          
          wx.cloud.callFunction({
            name: 'exchangeFunctions',
            data: {
              type: 'getRecommendItems',
              categories: categories,
              excludeIds: excludeIds,
              limit: 6
            }
          }).then(res => {
            if (res.result.success) {
              let items = res.result.data.items;
              console.log('【智能推荐】获取到推荐物品:', items.length, '条');
              imageUtils.convertImageUrls(items).then(convertedItems => {
                this.setData({
                  guessRecommendList: convertedItems
                });
              });
            }
          }).catch(err => {
            console.error('获取推荐物品失败:', err);
          });
        }
      }).catch(err => {
        console.error('获取浏览历史失败:', err);
        this.getHotRecommendItems();
      });
    },
    
    // 获取热门推荐
    getHotRecommendItems: function() {
      wx.cloud.callFunction({
        name: 'exchangeFunctions',
        data: {
          type: 'getExchangeItems',
          page: 1,
          pageSize: 6,
          sortBy: 'hot'
        }
      }).then(res => {
        if (res.result.success) {
          let items = res.result.data.items;
          imageUtils.convertImageUrls(items).then(convertedItems => {
            this.setData({
              hotRecommendList: convertedItems
            });
          });
        }
      }).catch(err => {
        console.error('获取热门推荐失败:', err);
      });
    },

    // 切换推荐标签
    switchRecommendTab: function(e) {
      const tab = e.currentTarget.dataset.tab;
      if (tab === this.data.recommendTab) return;
      
      this.setData({
        recommendTab: tab
      });
      
      if (tab === 'guess') {
        if (this.data.guessRecommendList.length === 0) {
          this.getRecommendItems();
        }
      } else if (tab === 'hot') {
        if (this.data.hotRecommendList.length === 0) {
          this.getHotRecommendItems();
        }
      }
    },
  
    // 搜索功能（修复逻辑+调试日志）
    onSearch: function(e) {
      // 1. 优先从事件对象取关键词，兜底从data取
      let keyword = e?.detail?.value || this.data.searchKeyword;
      // 去除首尾空格，避免空搜索
      keyword = keyword?.trim() || '';
      
      // 调试日志：打印原始关键词
      console.log('【搜索调试】原始输入:', e?.detail?.value, '最终关键词:', keyword);
      
      // 空关键词：重置为全部物品
      if (!keyword) {
        wx.showToast({
          title: '请输入搜索关键词',
          icon: 'none'
        });
        // 空关键词时重新加载全部物品
        this.setData({
          currentPage: 1,
          currentCategory: '' // 重置分类
        });
        this.getExchangeItems();
        return;
      }
  
      wx.showLoading({
        title: '搜索中...'
      });
      
      wx.cloud.callFunction({
        name: 'exchangeFunctions',
        data: {
          type: 'searchItems',
          keyword: keyword,
          page: 1,
          pageSize: 10,
          campus: this.data.currentCampus
        }
      }).then(res => {
        wx.hideLoading();
        console.log('【搜索调试】云函数返回:', res);
        
        if (res.result.success) {
          let items = res.result.data.items || [];
          console.log('【搜索调试】匹配到物品数量:', items.length, '物品列表:', items);
          
          // 转换图片链接
          imageUtils.convertImageUrls(items).then(convertedItems => {
            this.setData({
              goodsList: convertedItems, // 覆盖原有列表
              currentPage: 1 // 重置页码
            });
            
            // 无数据提示
            if (convertedItems.length === 0) {
              wx.showToast({
                title: '未找到相关物品',
                icon: 'none'
              });
            }
          });
        } else {
          wx.showToast({
            title: '搜索失败：' + (res.result.errMsg || '未知错误'),
            icon: 'none'
          });
        }
      }).catch(err => {
        wx.hideLoading();
        console.error('【搜索调试】调用失败:', err);
        wx.showToast({
          title: '网络错误，搜索失败',
          icon: 'none'
        });
      });
    },
    
    // 搜索按钮点击
    onSearchClick: function() {
      console.log('【调试】搜索按钮被点击');
      this.onSearch();
    },
  
    // 输入框内容变化
    onInputChange: function(e) {
      const value = e.detail.value;
      this.setData({
        searchKeyword: value
      });
      console.log('【搜索调试】输入框内容:', value);
    },
  
    // 校区切换
    onCampusChange: function(e) {
      const campus = this.data.campuses[e.detail.value];
      this.setData({
        currentCampus: campus,
        currentPage: 1
      });
      this.getExchangeItems();
    },
  
    // 分类点击（修复逻辑+调试日志）
    onCategoryClick: function(e) {
      const category = e.currentTarget.dataset.category;
      console.log('【分类调试】点击分类:', category, '当前分类:', this.data.currentCategory);
      
      // 处理"全部"分类
      const newCategory = category === '全部' ? '' : category;
      
      this.setData({
        currentCategory: newCategory,
        currentPage: 1, // 重置页码
        goodsList: [] // 清空原有列表，避免加载延迟
      });
      
      // 显示加载提示
      wx.showLoading({
        title: '加载' + category + '...'
      });
      
      // 重新获取物品列表
      this.getExchangeItems().then(() => {
        wx.hideLoading();
      }).catch(() => {
        wx.hideLoading();
        wx.showToast({
          title: '加载分类失败',
          icon: 'none'
        });
      });
    },
  
    // 排序点击（补充日志）
    onSortClick: function(e) {
      const sortType = e.currentTarget.dataset.type;
      const newSort = this.data.currentSort === 'createdAt' ? 'hot' : 'createdAt';
      console.log('【排序调试】切换排序:', this.data.currentSort, '→', newSort);
      
      this.setData({
        currentSort: newSort,
        currentPage: 1,
        goodsList: []
      });
      
      wx.showLoading({
        title: '按' + (newSort === 'hot' ? '热度' : '最新') + '排序...'
      });
      
      this.getExchangeItems().then(() => {
        wx.hideLoading();
      }).catch(() => {
        wx.hideLoading();
      });
    },
  
    // 加载更多
    onLoadMore: function() {
      this.setData({
        currentPage: this.data.currentPage + 1
      });
      this.getExchangeItems();
    },
  
    // 物品点击
    onGoodsClick: function(e) {
      const goodsId = e.currentTarget.dataset.id;
      wx.navigateTo({
        url: `../detail/detail?id=${goodsId}`
      });
    },
  
    // 热门物品点击
    onHotItemClick: function(e) {
      const itemId = e.currentTarget.dataset.id;
      wx.navigateTo({
        url: `../detail/detail?id=${itemId}`
      });
    },
  
    // 轮播图点击
    onSwiperClick: function(e) {
      const index = e.currentTarget.dataset.index;
      console.log('点击轮播图:', index);
    },
  
    // 下拉刷新
    onPullDownRefresh: function() {
      this.setData({
        currentPage: 1
      });
      this.getExchangeItems();
      wx.stopPullDownRefresh();
    },
  
    // 上拉加载
    onReachBottom: function() {
      this.onLoadMore();
    },
  
    // 补充缺失的事件方法
    onLocationClick() {
      console.log('校区选择点击');
      // 可自行实现校区选择逻辑
    },
    onMoreHotClick() {
      console.log('热门置换更多点击');
    },
    onMoreRecommendClick() {
      console.log('猜你喜欢换一批点击');
      this.getRecommendItems();
    },
    onFilterClick() {
      console.log('筛选按钮点击');
    },
    onPublishClick() {
      console.log('发布置换点击');
    },
    onCollectionClick() {
      console.log('我的收藏点击');
    },
    onRequestClick() {
      console.log('求换专区点击');
    }
  });