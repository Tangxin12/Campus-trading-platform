const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

// 主入口函数
exports.main = async (event, context) => {
  const { type } = event;
  
  try {
    switch (type) {
      case 'createOrder':
        return await createOrder(event);
      case 'getOrders':
        return await getOrders(event);
      case 'getOrderDetail':
        return await getOrderDetail(event);
      case 'updateOrderStatus':
        return await updateOrderStatus(event);
      case 'deleteOrder':
        return await deleteOrder(event);
      case 'rateOrder':
        return await rateOrder(event);
      default:
        return {
          success: false,
          message: '未知操作类型'
        };
    }
  } catch (error) {
    console.error('云函数执行失败:', error);
    return {
      success: false,
      message: '操作失败: ' + error.message
    };
  }
};

// 创建订单
const createOrder = async (event) => {
  try {
    console.log('【创建订单】收到的event:', JSON.stringify(event));
    
    const { itemId, sellerId, buyerId, buyerInfo, itemName, itemImage, itemPrice, sellerName, sellerAvatar } = event;
    
    console.log('【创建订单】解析后的参数:', {
      itemId, sellerId, buyerId, buyerInfo, itemName, itemImage, itemPrice, sellerName, sellerAvatar
    });
    
    // 处理买家信息
    let buyer;
    if (buyerInfo && buyerInfo._id) {
      buyer = buyerInfo;
    } else if (buyerId) {
      buyer = {
        _id: buyerId,
        username: '买家',
        avatar: ''
      };
    } else {
      return {
        success: false,
        message: '缺少买家信息'
      };
    }
    
    // 检查核心必填参数（全部基于 _id）
    if (!buyer._id || !itemId || !sellerId) {
      return {
        success: false,
        message: '缺少必填参数（买家ID/物品ID/卖家ID）',
        debug: {
          buyerId: buyer._id,
          itemId: itemId,
          sellerId: sellerId
        }
      };
    }
    
    // 构建订单数据（全部用 _id 存储）
    const orderData = {
      itemId: String(itemId).trim(),
      itemName: (itemName || '物品').trim(),
      itemImage: (itemImage || '').trim(),
      itemPrice: Number(itemPrice) || 0,
      sellerId: String(sellerId).trim(),
      sellerName: (sellerName || '匿名用户').trim(),
      sellerAvatar: (sellerAvatar || '').trim(),
      buyerId: String(buyer._id).trim(),
      buyerName: (buyer.username || '买家').trim(),
      buyerAvatar: (buyer.avatar || '').trim(),
      status: 'pending',
      createdAt: db.serverDate(),
      updatedAt: db.serverDate()
    };
    
    console.log('【创建订单】要写入的orderData:', JSON.stringify(orderData));
    
    // 直接创建订单（使用 data 包裹）
    const result = await db.collection('exchangeOrders').add({
      data: orderData
    });
    
    console.log('【创建订单】成功，result:', JSON.stringify(result));
    
    return {
      success: true,
      message: '订单创建成功',
      data: {
        orderId: result._id,
        orderData: orderData
      }
    };
    
  } catch (error) {
    console.error('创建订单失败:', error);
    return {
      success: false,
      message: '创建订单失败: ' + (error.message || '未知错误')
    };
  }
};

// 获取订单列表（纯 _id 匹配，无 openId 依赖）
const getOrders = async (event) => {
  const { status, page = 1, pageSize = 10, userId } = event;
  
  // 查询所有订单（不限制）
  const allOrders = await db.collection('exchangeOrders').get();
  const totalCount = allOrders.data.length;
  
  let matchedOrders = [];
  
  if (totalCount > 0) {
    // 临时：直接返回所有订单（不做任何过滤），验证数据是否存在
    matchedOrders = allOrders.data;
    
    // 排序和分页
    matchedOrders.sort((a, b) => {
      const timeA = a.createdAt ? (a.createdAt.$date || a.createdAt) : 0;
      const timeB = b.createdAt ? (b.createdAt.$date || b.createdAt) : 0;
      return timeB - timeA;
    });
    
    const start = (page - 1) * pageSize;
    matchedOrders = matchedOrders.slice(start, start + pageSize);
  }
  
  return {
    success: true,
    debug: {
      totalOrdersInDB: totalCount,
      receivedUserId: userId,
      userIdType: typeof userId,
      sampleOrders: allOrders.data.slice(0, 5).map(o => ({
        _id: o._id,
        sellerId: o.sellerId,
        buyerId: o.buyerId,
        status: o.status,
        sellerIdType: typeof o.sellerId,
        buyerIdType: typeof o.buyerId
      }))
    },
    data: {
      orders: matchedOrders,
      total: matchedOrders.length,
      page: page,
      pageSize: pageSize
    }
  };
};

// 获取订单详情
const getOrderDetail = async (event) => {
  const { orderId } = event;
  
  if (!orderId) {
    return {
      success: false,
      message: '缺少订单ID'
    };
  }
  
  const orderRes = await db.collection('exchangeOrders').doc(orderId).get();
  
  if (!orderRes.data) {
    return {
      success: false,
      message: '订单不存在'
    };
  }
  
  const order = orderRes.data;
  
  const formatDate = (date) => {
    if (!date) return '';
    let d;
    if (date instanceof Date) {
      d = date;
    } else if (date.$date) {
      d = new Date(date.$date);
    } else if (typeof date === 'string') {
      d = new Date(date.replace(/\(中国标准时间\)/g, ''));
    } else if (typeof date === 'number') {
      d = new Date(date);
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
  };
  
  order.createdAt = formatDate(order.createdAt);
  order.confirmedAt = formatDate(order.confirmedAt);
  order.completedAt = formatDate(order.completedAt);
  order.updatedAt = formatDate(order.updatedAt);
  
  return {
    success: true,
    data: {
      order: order
    }
  };
};

// 更新订单状态（纯 _id 校验）
const updateOrderStatus = async (event) => {
  const { orderId, status, userId } = event;
  
  // 参数校验
  if (!orderId || !status || !userId) {
    return {
      success: false,
      message: '参数不完整'
    };
  }
  
  // 合法状态校验
  const validStatus = ['pending', 'confirmed', 'completed', 'cancelled'];
  if (!validStatus.includes(status)) {
    return {
      success: false,
      message: '无效的订单状态'
    };
  }
  
  // 获取订单信息
  const orderRes = await db.collection('exchangeOrders').doc(orderId).get();
  
  if (!orderRes.data) {
    return {
      success: false,
      message: '订单不存在'
    };
  }
  
  const order = orderRes.data;
  
  // 权限校验（纯 _id 匹配）
  if (status === 'confirmed') {
    // 只有卖家可以确认
    if (order.sellerId !== userId) {
      return {
        success: false,
        message: '只有卖家可以确认订单'
      };
    }
    if (order.status !== 'pending') {
      return {
        success: false,
        message: '只有待确认的订单可以确认'
      };
    }
  } else if (status === 'completed') {
    // 买卖双方都可以标记完成（允许直接从待确认变为已完成）
    if (order.sellerId !== userId && order.buyerId !== userId) {
      return {
        success: false,
        message: '只有交易双方可以完成订单'
      };
    }
    // 允许从待确认或已确认状态变为已完成
    if (order.status !== 'pending' && order.status !== 'confirmed') {
      return {
        success: false,
        message: '只有待确认或已确认的订单可以标记完成'
      };
    }
  } else if (status === 'cancelled') {
    // 买卖双方都可以取消
    if (order.sellerId !== userId && order.buyerId !== userId) {
      return {
        success: false,
        message: '无权操作此订单'
      };
    }
    if (order.status === 'completed') {
      return {
        success: false,
        message: '已完成的订单无法取消'
      };
    }
  }
  
  // 构建更新数据
  const updateData = {
    status: status,
    updatedAt: db.serverDate()
  };
  
  if (status === 'confirmed') {
    updateData.confirmedAt = db.serverDate();
  } else if (status === 'completed') {
    updateData.completedAt = db.serverDate();
  } else if (status === 'cancelled') {
    updateData.cancelledAt = db.serverDate();
    updateData.cancelledBy = userId;
  }
  
  // 执行更新
  await db.collection('exchangeOrders').doc(orderId).update({
    data: updateData
  });
  
  return {
    success: true,
    message: '订单状态更新成功',
    data: {
      orderId: orderId,
      newStatus: status
    }
  };
};

// 删除订单（纯 _id 校验）
const deleteOrder = async (event) => {
  const { orderId, userId } = event;
  
  if (!orderId || !userId) {
    return {
      success: false,
      message: '参数不完整'
    };
  }
  
  // 获取订单信息
  const orderRes = await db.collection('exchangeOrders').doc(orderId).get();
  
  if (!orderRes.data) {
    return {
      success: false,
      message: '订单不存在'
    };
  }
  
  const order = orderRes.data;
  
  // 权限校验
  if (order.sellerId !== userId && order.buyerId !== userId) {
    return {
      success: false,
      message: '无权删除此订单'
    };
  }
  
  // 执行删除（允许删除任何状态的订单）
  await db.collection('exchangeOrders').doc(orderId).remove();
  
  return {
    success: true,
    message: '订单删除成功'
  };
};

// 评价订单（纯 _id 校验）
const rateOrder = async (event) => {
  const { orderId, rating, comment, isSeller, userId } = event;
  
  // 参数校验
  if (!orderId || rating === undefined || !userId) {
    return {
      success: false,
      message: '参数不完整'
    };
  }
  
  if (rating < 1 || rating > 5) {
    return {
      success: false,
      message: '评分必须在1-5之间'
    };
  }
  
  // 获取订单信息
  const orderRes = await db.collection('exchangeOrders').doc(orderId).get();
  
  if (!orderRes.data) {
    return {
      success: false,
      message: '订单不存在'
    };
  }
  
  const order = orderRes.data;
  
  // 订单状态校验
  if (order.status !== 'completed') {
    return {
      success: false,
      message: '只能评价已完成的订单'
    };
  }
  
  // 权限校验
  if (isSeller) {
    if (order.sellerId !== userId) {
      return {
        success: false,
        message: '只有卖家可以评价买家'
      };
    }
  } else {
    if (order.buyerId !== userId) {
      return {
        success: false,
        message: '只有买家可以评价卖家'
      };
    }
  }
  
  // 构建更新数据
  const updateData = {
    updatedAt: db.serverDate()
  };
  
  if (isSeller) {
    updateData.sellerRating = rating;
    updateData.sellerComment = comment || '';
    updateData.sellerRatedAt = db.serverDate();
  } else {
    updateData.buyerRating = rating;
    updateData.buyerComment = comment || '';
    updateData.buyerRatedAt = db.serverDate();
  }
  
  // 执行更新
  await db.collection('exchangeOrders').doc(orderId).update({
    data: updateData
  });
  
  return {
    success: true,
    message: '评价提交成功',
    data: {
      orderId: orderId,
      rating: rating
    }
  };
};