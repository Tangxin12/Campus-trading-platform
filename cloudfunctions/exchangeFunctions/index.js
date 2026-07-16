const cloud = require("wx-server-sdk");
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();
const _ = db.command;

// 创建物品集合
const createCollections = async () => {
  try {
    await db.createCollection("exchangeItem");
    await db.createCollection("users");
    await db.createCollection("collections");
    await db.createCollection("exchangeRequests");
    await db.createCollection("browseHistory");
    return {
      success: true,
      message: "创建集合成功"
    };
  } catch (e) {
    return {
      success: true,
      message: "集合可能已存在",
      error: e.message
    };
  }
};

// 发布物品
const publishItem = async (event) => {
  try {
    const { itemData, userInfo } = event;
    const wxContext = cloud.getWXContext();
    
    console.log('【云函数】publishItem被调用，event:', event);
    console.log('【云函数】itemData:', itemData);
    console.log('【云函数】userInfo:', userInfo);
    
    let publisher = "匿名用户";
    let publisherId = wxContext.OPENID;
    let avatar = "";
    let college = "";
    
    // 优先使用前端传递的用户信息
    if (userInfo) {
      console.log('【云函数】使用前端传递的用户信息');
      publisher = userInfo.username || "匿名用户";
      publisherId = userInfo._id || wxContext.OPENID;
      avatar = userInfo.avatar || "";
      college = userInfo.college || "";
    }
    
    // 如果前端没有传递完整信息，尝试从数据库查询
    if (publisher === "匿名用户" || !avatar) {
      try {
        let queryUsername = "";
        if (userInfo) {
          queryUsername = userInfo.username || userInfo.nickname;
        }
        
        console.log('【云函数】尝试通过用户名查询用户:', queryUsername);
        
        if (queryUsername) {
          const userResult = await db.collection("users").where({
            username: queryUsername
          }).get();
          
          console.log('【云函数】用户名查询结果:', userResult);
          
          if (userResult.data.length > 0) {
            console.log('【云函数】通过用户名查询到用户');
            publisher = userResult.data[0].username || "匿名用户";
            publisherId = userResult.data[0]._id;
            avatar = userResult.data[0].avatar || "";
            college = userResult.data[0].college || "";
          }
        }
      } catch (e) {
        console.error('【云函数】查询用户失败:', e);
      }
    }
    
    console.log('【云函数】最终的publisher:', publisher);
    console.log('【云函数】最终的avatar:', avatar);
    console.log('【云函数】最终的college:', college);
    
    // 构建物品数据
    const newItem = {
      name: itemData.itemName,
      description: itemData.description || "",
      image: itemData.images && itemData.images.length > 0 ? itemData.images[0] : "",
      images: itemData.images || [],
      category: itemData.category,
      condition: itemData.condition,
      price: itemData.price || 0,
      campus: itemData.campus,
      college: college,
      exchangeMethod: itemData.exchangeMethod || "仅本校自提",
      exchangeAddress: itemData.exchangeAddress || "",
      offlineTime: itemData.offlineTime || "30天",
      status: "active",
      publisher: publisher,
      publisherId: publisherId,
      avatar: avatar,
      views: 0,
      likes: 0,
      createdAt: db.serverDate(),
      updatedAt: db.serverDate(),
      _openid: wxContext.OPENID
    };
    
    // 插入数据库
    const result = await db.collection("exchangeItem").add({
      data: newItem
    });
    
    console.log('【云函数】发布成功，itemId:', result._id);
    
    return {
      success: true,
      data: {
        _id: result._id,
        ...newItem
      }
    };
  } catch (e) {
    console.error('【云函数】publishItem错误:', e);
    return {
      success: false,
      errMsg: e.message
    };
  }
};

// 获取置换物品列表（修复筛选逻辑）
const getExchangeItems = async (event) => {
  try {
    const { page = 1, pageSize = 10, category, sortBy = "createdAt", campus } = event;
    
    console.log('【云函数】getExchangeItems参数:', { 
      page, pageSize, category, sortBy, campus 
    });
    
    // 初始化查询条件（解决多次where叠加的问题）
    let whereCondition = { status: "active" }; // 只查有效物品
    
    // 按分类筛选
    if (category && category.trim() !== "") {
      whereCondition.category = category;
    }
    
    // 按校区筛选
    if (campus && campus.trim() !== "") {
      whereCondition.campus = campus;
    }
    
    // 构建查询
    let query = db.collection("exchangeItem").where(whereCondition);
    
    // 排序
    let sortedQuery;
    switch (sortBy) {
      case "hot":
        sortedQuery = query.orderBy("likes", "desc").orderBy("views", "desc");
        break;
      default:
        sortedQuery = query.orderBy("createdAt", "desc");
    }
    
    // 分页
    const skip = (page - 1) * pageSize;
    const items = await sortedQuery.skip(skip).limit(pageSize).get();
    
    console.log('【云函数】查询结果:', {
      总数量: items.data.length,
      分页: `第${page}页，每页${pageSize}条`,
      数据: items.data
    });
    
    return {
      success: true,
      data: {
        items: items.data,
        total: items.data.length,
        page,
        pageSize
      }
    };
  } catch (e) {
    console.error('【云函数】getExchangeItems错误:', e);
    return {
      success: false,
      errMsg: e.message
    };
  }
};

// 获取物品详情
const getItemDetail = async (event) => {
  try {
    const { itemId } = event;
    
    console.log('【云函数】getItemDetail被调用，itemId:', itemId);
    
    // 获取物品详情
    const item = await db.collection("exchangeItem").doc(itemId).get();
    
    // 增加浏览量
    await db.collection("exchangeItem").doc(itemId).update({
      data: {
        views: _.inc(1)
      }
    });
    
    console.log('【云函数】获取详情成功:', item.data);
    
    return {
      success: true,
      data: item.data
    };
  } catch (e) {
    console.error('【云函数】getItemDetail错误:', e);
    return {
      success: false,
      errMsg: e.message
    };
  }
};

// 搜索物品（优化正则+筛选）
const searchItems = async (event) => {
  try {
    const { keyword, page = 1, pageSize = 10, campus } = event;
    
    console.log('【云函数】searchItems参数:', { 
      keyword, page, pageSize, campus 
    });
    
    // 空关键词直接返回空
    if (!keyword || keyword.trim() === "") {
      return {
        success: true,
        data: {
          items: [],
          total: 0,
          page,
          pageSize
        }
      };
    }
    
    // 构建查询条件
    let whereCondition = {
      status: "active", // 只查有效物品
      $or: [
        { name: db.RegExp({ regexp: keyword, options: 'i' }) },
        { description: db.RegExp({ regexp: keyword, options: 'i' }) }
      ]
    };
    
    // 按校区筛选
    if (campus && campus.trim() !== "") {
      whereCondition.campus = campus;
    }
    
    // 执行查询
    let query = db.collection("exchangeItem").where(whereCondition);
    const skip = (page - 1) * pageSize;
    const items = await query.orderBy("createdAt", "desc").skip(skip).limit(pageSize).get();
    
    console.log('【云函数】搜索结果:', {
      关键词: keyword,
      匹配数量: items.data.length,
      数据: items.data
    });
    
    return {
      success: true,
      data: {
        items: items.data,
        total: items.data.length,
        page,
        pageSize
      }
    };
  } catch (e) {
    console.error('【云函数】searchItems错误:', e);
    return {
      success: false,
      errMsg: e.message
    };
  }
};

// 收藏物品
const collectItem = async (event) => {
  try {
    const { itemId } = event;
    const wxContext = cloud.getWXContext();
    const userId = wxContext.OPENID;
    
    console.log('【云函数】collectItem被调用，itemId:', itemId, 'userId:', userId);
    
    // 检查物品是否存在
    const item = await db.collection("exchangeItem").doc(itemId).get();
    if (!item.data) {
      return {
        success: false,
        errMsg: "物品不存在"
      };
    }
    
    // 检查是否已经收藏
    const existingCollection = await db.collection("collections").where({
      userId,
      itemId,
      status: "active"
    }).get();
    
    if (existingCollection.data.length > 0) {
      return {
        success: false,
        errMsg: "已经收藏过该物品"
      };
    }
    
    // 创建收藏记录
    const collectionData = {
      userId,
      itemId,
      itemName: item.data.name,
      itemImage: item.data.image,
      itemPrice: item.data.price,
      publisher: item.data.publisher,
      status: "active",
      createdAt: db.serverDate()
    };
    
    await db.collection("collections").add({
      data: collectionData
    });
    
    // 增加物品的收藏数
    await db.collection("exchangeItem").doc(itemId).update({
      data: {
        likes: _.inc(1)
      }
    });
    
    return {
      success: true,
      data: {
        message: "收藏成功"
      }
    };
  } catch (e) {
    console.error('【云函数】collectItem错误:', e);
    return {
      success: false,
      errMsg: e.message
    };
  }
};

// 取消收藏
const uncollectItem = async (event) => {
  try {
    const { itemId, collectionId } = event;
    const wxContext = cloud.getWXContext();
    const userId = wxContext.OPENID;
    
    console.log('【云函数】uncollectItem被调用，itemId:', itemId, 'collectionId:', collectionId, 'userId:', userId);
    
    let collectionRecord = null;
    
    if (collectionId) {
      // 使用collectionId直接查找
      console.log('【云函数】使用collectionId查找收藏记录:', collectionId);
      const result = await db.collection("collections").doc(collectionId).get();
      if (result.data) {
        collectionRecord = result.data;
      }
    } else if (itemId) {
      // 查找收藏记录
      const collection = await db.collection("collections").where({
        userId,
        itemId,
        status: "active"
      }).get();
      
      if (collection.data.length > 0) {
        collectionRecord = collection.data[0];
      }
    }
    
    if (!collectionRecord) {
      return {
        success: false,
        errMsg: "未找到收藏记录"
      };
    }
    
    // 删除收藏记录
    console.log('【云函数】更新收藏记录状态:', collectionRecord._id);
    await db.collection("collections").doc(collectionRecord._id).update({
      data: {
        status: "inactive",
        updatedAt: db.serverDate()
      }
    });
    
    // 减少物品的收藏数（如果有itemId）
    if (collectionRecord.itemId) {
      try {
        console.log('【云函数】减少物品收藏数:', collectionRecord.itemId);
        await db.collection("exchangeItem").doc(collectionRecord.itemId).update({
          data: {
            likes: _.inc(-1)
          }
        });
      } catch (e) {
        console.error('【云函数】减少物品收藏数失败:', e);
        // 不影响取消收藏的结果
      }
    }
    
    return {
      success: true,
      data: {
        message: "取消收藏成功"
      }
    };
  } catch (e) {
    console.error('【云函数】uncollectItem错误:', e);
    return {
      success: false,
      errMsg: e.message
    };
  }
};

// 检查是否已收藏
const checkCollectionStatus = async (event) => {
  try {
    const { itemId } = event;
    const wxContext = cloud.getWXContext();
    const userId = wxContext.OPENID;
    
    console.log('【云函数】checkCollectionStatus被调用，itemId:', itemId, 'userId:', userId);
    
    const collection = await db.collection("collections").where({
      userId,
      itemId,
      status: "active"
    }).get();
    
    return {
      success: true,
      data: {
        isCollected: collection.data.length > 0
      }
    };
  } catch (e) {
    console.error('【云函数】checkCollectionStatus错误:', e);
    return {
      success: false,
      errMsg: e.message
    };
  }
};

// 获取用户收藏列表
const getUserCollections = async (event) => {
  try {
    const { page = 1, pageSize = 10 } = event;
    const wxContext = cloud.getWXContext();
    const userId = wxContext.OPENID;
    
    console.log('【云函数】getUserCollections被调用，userId:', userId);
    
    const skip = (page - 1) * pageSize;
    const collections = await db.collection("collections").where({
      userId,
      status: "active"
    }).orderBy("createdAt", "desc").skip(skip).limit(pageSize).get();
    
    // 直接使用收藏记录中的字段
    const collectionItems = collections.data.map(collection => ({
      ...collection,
      collectedAt: collection.createdAt
    }));
    
    return {
      success: true,
      data: {
        items: collectionItems,
        total: collectionItems.length,
        page,
        pageSize
      }
    };
  } catch (e) {
    console.error('【云函数】getUserCollections错误:', e);
    return {
      success: false,
      errMsg: e.message
    };
  }
};

// 获取用户发布的物品列表
const getUserPublishItems = async (event) => {
  try {
    const { page = 1, pageSize = 10, publisher } = event;
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;
    
    console.log('【云函数】getUserPublishItems被调用，openid:', openid, 'publisher:', publisher);
    
    const skip = (page - 1) * pageSize;
    let publishItems = { data: [] };
    
    // 如果前端传递了publisher参数，优先使用publisher查询
    if (publisher) {
      console.log('【云函数】使用publisher查询:', publisher);
      publishItems = await db.collection("exchangeItem").where({
        publisher: publisher
      }).orderBy("createdAt", "desc").skip(skip).limit(pageSize).get();
      
      console.log('【云函数】使用publisher查询结果:', publishItems.data.length, '条记录');
    }
    
    // 如果publisher查询没有结果，尝试使用_openid查询
    if (publishItems.data.length === 0) {
      console.log('【云函数】使用_openid查询');
      publishItems = await db.collection("exchangeItem").where({
        _openid: openid
      }).orderBy("createdAt", "desc").skip(skip).limit(pageSize).get();
      
      console.log('【云函数】使用_openid查询结果:', publishItems.data.length, '条记录');
    }
    
    // 如果_openid查询也没有结果，尝试使用publisherId查询
    if (publishItems.data.length === 0) {
      console.log('【云函数】使用_openid未找到记录，尝试使用publisherId查询');
      
      // 获取当前用户的用户信息
      const userResult = await db.collection("users").where({
        _openid: openid
      }).get();
      
      console.log('【云函数】用户查询结果:', userResult.data.length, '条记录');
      
      if (userResult.data.length > 0) {
        const user = userResult.data[0];
        const userId = user._id;
        console.log('【云函数】用户ID:', userId);
        
        publishItems = await db.collection("exchangeItem").where({
          publisherId: userId
        }).orderBy("createdAt", "desc").skip(skip).limit(pageSize).get();
        
        console.log('【云函数】使用publisherId查询结果:', publishItems.data.length, '条记录');
      }
    }
    
    return {
      success: true,
      data: {
        items: publishItems.data,
        total: publishItems.data.length,
        page,
        pageSize
      }
    };
  } catch (e) {
    console.error('【云函数】getUserPublishItems错误:', e);
    return {
      success: false,
      errMsg: e.message
    };
  }
};

// 智能推荐物品（基于浏览历史、收藏记录、热门商品）
const getRecommendItems = async (event) => {
  try {
    const { categories = [], excludeIds = [], limit = 6 } = event;
    
    console.log('【智能推荐】getRecommendItems被调用，categories:', categories, 'excludeIds:', excludeIds);
    
    let recommendItems = [];
    const usedIds = new Set(excludeIds);
    
    // 策略1：基于浏览/收藏的分类推荐
    if (categories && categories.length > 0) {
      console.log('【智能推荐】策略1：基于分类推荐');
      for (let i = 0; i < categories.length && recommendItems.length < limit; i++) {
        const category = categories[i];
        const categoryItems = await db.collection("exchangeItem").where({
          status: "active",
          category: category,
          _id: _.nin([...usedIds])
        }).orderBy("likes", "desc").limit(limit - recommendItems.length).get();
        
        categoryItems.data.forEach(item => {
          if (!usedIds.has(item._id)) {
            usedIds.add(item._id);
            recommendItems.push(item);
          }
        });
      }
    }
    
    // 策略2：热门商品补充（如果推荐数量不足）
    if (recommendItems.length < limit) {
      console.log('【智能推荐】策略2：热门商品补充');
      const hotItems = await db.collection("exchangeItem").where({
        status: "active",
        _id: _.nin([...usedIds])
      }).orderBy("likes", "desc").orderBy("views", "desc").limit(limit - recommendItems.length).get();
      
      hotItems.data.forEach(item => {
        if (!usedIds.has(item._id)) {
          recommendItems.push(item);
        }
      });
    }
    
    console.log('【智能推荐】推荐结果:', recommendItems.length, '条');
    
    return {
      success: true,
      data: {
        items: recommendItems,
        total: recommendItems.length
      }
    };
  } catch (e) {
    console.error('【智能推荐】getRecommendItems错误:', e);
    return {
      success: false,
      errMsg: e.message
    };
  }
};

// 删除物品
const deleteItem = async (event) => {
  try {
    const { itemId } = event;
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;
    
    console.log('【云函数】deleteItem被调用，itemId:', itemId, 'openid:', openid);
    
    // 查找物品
    const itemResult = await db.collection("exchangeItem").doc(itemId).get();
    
    if (!itemResult.data) {
      return {
        success: false,
        errMsg: "物品不存在"
      };
    }
    
    // 检查权限（只有物品发布者可以删除）
    if (itemResult.data._openid !== openid) {
      return {
        success: false,
        errMsg: "没有权限删除此物品"
      };
    }
    
    // 删除物品
    await db.collection("exchangeItem").doc(itemId).remove();
    
    return {
      success: true,
      data: {
        message: "删除成功"
      }
    };
  } catch (e) {
    console.error('【云函数】deleteItem错误:', e);
    return {
      success: false,
      errMsg: e.message
    };
  }
};

// 更新物品
const updateItem = async (event) => {
  try {
    const { itemId, itemData } = event;
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;
    
    console.log('【云函数】updateItem被调用，itemId:', itemId, 'openid:', openid);
    
    if (!itemId) {
      return {
        success: false,
        errMsg: "物品ID不能为空"
      };
    }
    
    // 查找物品
    const itemResult = await db.collection("exchangeItem").doc(itemId).get();
    
    if (!itemResult.data) {
      return {
        success: false,
        errMsg: "物品不存在"
      };
    }
    
    // 检查权限（只有物品发布者可以更新）
    if (itemResult.data._openid !== openid) {
      return {
        success: false,
        errMsg: "没有权限更新此物品"
      };
    }
    
    // 构建更新数据
    const updateData = {
      name: itemData.itemName,
      description: itemData.description || "",
      category: itemData.category,
      condition: itemData.condition,
      price: itemData.price || 0,
      campus: itemData.campus,
      exchangeMethod: itemData.exchangeMethod || "仅本校自提",
      exchangeAddress: itemData.exchangeAddress || "",
      offlineTime: itemData.offlineTime || "30天",
      updatedAt: db.serverDate()
    };
    
    // 如果有新图片，更新图片字段
    if (itemData.images && itemData.images.length > 0) {
      updateData.image = itemData.images[0];
      updateData.images = itemData.images;
    }
    
    console.log('【云函数】更新数据:', updateData);
    
    // 更新物品
    const result = await db.collection("exchangeItem").doc(itemId).update({
      data: updateData
    });
    
    console.log('【云函数】更新结果:', result);
    
    return {
      success: true,
      data: {
        message: "更新成功",
        result: result
      }
    };
  } catch (e) {
    console.error('【云函数】updateItem错误:', e);
    return {
      success: false,
      errMsg: e.message
    };
  }
};

// // 更新用户信息
// const updateUserInfo = async (event) => {
//   try {
//     console.log('【云函数】updateUserInfo被调用，event:', event);
    
//     const { userInfo } = event;
//     const wxContext = cloud.getWXContext();
    
//     console.log('【云函数】用户openid:', wxContext.OPENID);
//     console.log('【云函数】要更新的userInfo:', userInfo);
    
//     // 检查用户是否存在（使用userId查询）
//     console.log('【云函数】userInfo完整数据:', userInfo);
//     console.log('【云函数】userInfo._id:', userInfo._id);
//     console.log('【云函数】userInfo.id:', userInfo.id);
    
//     const userId = userInfo.id || userInfo._id;
    
//     if (!userId) {
//       console.error('【云函数】用户ID不存在');
//       return {
//         success: false,
//         errMsg: "用户ID不存在"
//       };
//     }
    
//     console.log('【云函数】最终使用的用户ID:', userId);
    
//     try {
//       const userResult = await db.collection("users").doc(userId).get();
//       console.log('【云函数】用户查询结果:', userResult);
      
//       if (!userResult.data) {
//         console.error('【云函数】用户不存在');
//         return {
//           success: false,
//           errMsg: "用户不存在"
//         };
//       }
      
//       console.log('【云函数】用户数据:', userResult.data);
//     } catch (e) {
//       console.error('【云函数】查询用户失败:', e);
//       return {
//         success: false,
//         errMsg: "查询用户失败: " + e.message
//       };
//     }
    
//     console.log('【云函数】用户ID:', userId);
    
//     // 更新用户信息
//     const updateData = {
//       nickname: userInfo.nickname,
//       avatar: userInfo.avatar,
//       phone: userInfo.phone,
//       college: userInfo.college,
//       major: userInfo.major,
//       studentId: userInfo.studentId,
//       isVerified: userInfo.isVerified,
//       updatedAt: db.serverDate()
//     };
    
//     console.log('【云函数】要更新的数据:', updateData);
    
//     const updateResult = await db.collection("users").doc(userId).update({
//       data: updateData
//     });
    
//     console.log('【云函数】更新结果:', updateResult);
    
//     return {
//       success: true,
//       data: {
//         message: "用户信息更新成功",
//         updateResult: updateResult
//       }
//     };
//   } catch (e) {
//     console.error('【云函数】updateUserInfo错误:', e);
//     return {
//       success: false,
//       errMsg: e.message
//     };
//   }
// };
// 记录浏览历史
const recordBrowseHistory = async (event) => {
  try {
    const { itemId, itemName, category, price, image, userId } = event;
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;
    
    console.log('【云函数】recordBrowseHistory被调用，itemId:', itemId, 'userId:', userId);
    
    const userToUse = userId || openid;
    
    // 先删除该用户之前浏览过的同一件物品的记录（避免重复）
    try {
      await db.collection("browseHistory").where({
        userId: userToUse,
        itemId: itemId
      }).remove();
    } catch (e) {
      console.log('【云函数】删除重复记录失败（可能集合不存在）:', e.message);
      if (e.errCode === -502005 || e.errMsg && e.errMsg.includes('not exists')) {
        await db.createCollection("browseHistory");
      }
    }
    
    // 添加新的浏览记录
    await db.collection("browseHistory").add({
      data: {
        userId: userToUse,
        itemId: itemId,
        itemName: itemName,
        category: category,
        price: price || 0,
        image: image || '',
        createdAt: db.serverDate()
      }
    });
    
    // 保留最近20条浏览记录
    const historyList = await db.collection("browseHistory").where({
      userId: userToUse
    }).orderBy("createdAt", "desc").get();
    
    if (historyList.data.length > 20) {
      const toDelete = historyList.data.slice(20);
      for (const item of toDelete) {
        await db.collection("browseHistory").doc(item._id).remove();
      }
    }
    
    return {
      success: true,
      data: {
        message: "浏览记录保存成功"
      }
    };
  } catch (e) {
    console.error('【云函数】recordBrowseHistory错误:', e);
    return {
      success: false,
      errMsg: e.message
    };
  }
};

// 获取用户浏览历史
const getUserBrowseHistory = async (event) => {
  try {
    const { userId } = event;
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;
    
    console.log('【云函数】getUserBrowseHistory被调用，userId:', userId);
    
    const userToUse = userId || openid;
    
    const history = await db.collection("browseHistory").where({
      userId: userToUse
    }).orderBy("createdAt", "desc").limit(20).get();
    
    return {
      success: true,
      data: {
        items: history.data,
        total: history.data.length
      }
    };
  } catch (e) {
    console.error('【云函数】getUserBrowseHistory错误:', e);
    if (e.errCode === -502005 || e.errMsg && e.errMsg.includes('not exists')) {
      await db.createCollection("browseHistory");
      return {
        success: true,
        data: {
          items: [],
          total: 0
        }
      };
    }
    return {
      success: false,
      errMsg: e.message
    };
  }
};

// 删除单条浏览记录
const deleteBrowseHistoryItem = async (event) => {
  try {
    const { historyId, userId } = event;
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;
    
    console.log('【云函数】deleteBrowseHistoryItem被调用，historyId:', historyId);
    
    const userToUse = userId || openid;
    
    const record = await db.collection("browseHistory").doc(historyId).get();
    
    if (!record.data || record.data.userId !== userToUse) {
      return {
        success: false,
        errMsg: "无权限删除此记录"
      };
    }
    
    await db.collection("browseHistory").doc(historyId).remove();
    
    return {
      success: true,
      data: {
        message: "删除成功"
      }
    };
  } catch (e) {
    console.error('【云函数】deleteBrowseHistoryItem错误:', e);
    if (e.errCode === -502005 || e.errMsg && e.errMsg.includes('not exists')) {
      return {
        success: false,
        errMsg: "记录不存在"
      };
    }
    return {
      success: false,
      errMsg: e.message
    };
  }
};

// 清空浏览历史
const clearBrowseHistory = async (event) => {
  try {
    const { userId } = event;
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;
    
    console.log('【云函数】clearBrowseHistory被调用，userId:', userId);
    
    const userToUse = userId || openid;
    
    await db.collection("browseHistory").where({
      userId: userToUse
    }).remove();
    
    return {
      success: true,
      data: {
        message: "清空成功"
      }
    };
  } catch (e) {
    console.error('【云函数】clearBrowseHistory错误:', e);
    if (e.errCode === -502005 || e.errMsg && e.errMsg.includes('not exists')) {
      return {
        success: true,
        data: {
          message: "清空成功"
        }
      };
    }
    return {
      success: false,
      errMsg: e.message
    };
  }
};

// 更新用户信息（修复版）
const updateUserInfo = async (event) => {
    try {
      console.log('【云函数】updateUserInfo被调用，event:', event);
      
      const { userInfo } = event;
      const wxContext = cloud.getWXContext();
      
      console.log('【云函数】用户openid:', wxContext.OPENID);
      console.log('【云函数】要更新的userInfo:', userInfo);
      
      // 优先使用 _id，兼容 id（修复ID获取逻辑）
      const userId = userInfo._id || userInfo.id;
      
      if (!userId) {
        console.error('【云函数】用户ID不存在');
        return {
          success: false,
          errMsg: "用户ID不存在"
        };
      }
      
      console.log('【云函数】最终使用的用户ID:', userId);
      
      // 先检查用户是否存在（优化错误处理）
      let userExists = false;
      try {
        const userResult = await db.collection("users").doc(userId).get();
        userExists = !!userResult.data;
        console.log('【云函数】用户查询结果:', userResult);
      } catch (e) {
        // 专门处理记录不存在的错误码
        if (e.errCode === -502002) {
          console.error('【云函数】用户不存在');
          return {
            success: false,
            errMsg: "用户不存在"
          };
        }
        console.error('【云函数】查询用户失败:', e);
        return {
          success: false,
          errMsg: "查询用户失败: " + e.message
        };
      }
      
      if (!userExists) {
        console.error('【云函数】用户不存在');
        return {
          success: false,
          errMsg: "用户不存在"
        };
      }
      
      // 构建更新数据（只更新有值的字段，避免覆盖空值）
      const updateData = {};
    //   if (userInfo.nickname !== undefined) updateData.nickname = userInfo.nickname;
    if (userInfo.nickname !== undefined) updateData.nickname = userInfo.nickname;
      if (userInfo.avatar !== undefined) updateData.avatar = userInfo.avatar;
      if (userInfo.phone !== undefined) updateData.phone = userInfo.phone;
      if (userInfo.college !== undefined) updateData.college = userInfo.college;
      if (userInfo.major !== undefined) updateData.major = userInfo.major;
      if (userInfo.studentId !== undefined) updateData.studentId = userInfo.studentId;
      if (userInfo.isVerified !== undefined) updateData.isVerified = userInfo.isVerified;
      updateData.updatedAt = db.serverDate(); // 始终更新修改时间
      
      console.log('【云函数】要更新的数据:', updateData);
      
      // 执行更新
      const updateResult = await db.collection("users").doc(userId).update({
        data: updateData
      });
      
      console.log('【云函数】更新结果:', updateResult);
      
      // 检查是否真的更新了数据
      if (updateResult.stats.updated === 0) {
        return {
          success: false,
          errMsg: "没有数据被更新（可能数据未变化）"
        };
      }
      
      return {
        success: true,
        data: {
          message: "用户信息更新成功",
          updateResult: updateResult
        }
      };
    } catch (e) {
      console.error('【云函数】updateUserInfo错误:', e);
      return {
        success: false,
        errMsg: e.message || '更新失败'
      };
    }
  };
  
// 云函数入口
exports.main = async (event, context) => {
  const { type } = event;
  
  console.log('【云函数】入口被调用，type:', type);
  console.log('【云函数】完整event:', event);
  
  switch (type) {
    case "createCollections":
      return await createCollections();
    case "publishItem":
      return await publishItem(event);
    case "getExchangeItems":
      return await getExchangeItems(event);
    case "getItemDetail":
      return await getItemDetail(event);
    case "searchItems":
      console.log('【云函数】调用searchItems');
      return await searchItems(event);
    case "collectItem":
      return await collectItem(event);
    case "uncollectItem":
      return await uncollectItem(event);
    case "checkCollectionStatus":
      return await checkCollectionStatus(event);
    case "getUserCollections":
      return await getUserCollections(event);
    case "getUserPublishItems":
      return await getUserPublishItems(event);
    case "getRecommendItems":
      return await getRecommendItems(event);
    case "deleteItem":
      return await deleteItem(event);
    case "updateItem":
      return await updateItem(event);
    case "updateUserInfo":
      return await updateUserInfo(event);
    case "recordBrowseHistory":
      return await recordBrowseHistory(event);
    case "getUserBrowseHistory":
      return await getUserBrowseHistory(event);
    case "deleteBrowseHistoryItem":
      return await deleteBrowseHistoryItem(event);
    case "clearBrowseHistory":
      return await clearBrowseHistory(event);
    default:
      console.error('【云函数】未知操作类型:', type);
      return {
        success: false,
        errMsg: "未知操作类型: " + type
      };
  }
};