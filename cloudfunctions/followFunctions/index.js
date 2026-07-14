const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();
const _ = db.command;

// 检查并创建集合
const ensureCollectionExists = async (collectionName) => {
  try {
    await db.createCollection(collectionName);
    console.log(`【云函数】创建集合 ${collectionName} 成功`);
  } catch (e) {
    // 集合已存在时会抛出错误，这是正常的
    if (e.errCode !== -50200) {
      console.error(`【云函数】创建集合 ${collectionName} 失败:`, e);
    }
  }
};

// 关注用户
const followUser = async (event) => {
  try {
    console.log('【云函数】followUser被调用，event:', event);
    
    // 确保follows集合存在
    await ensureCollectionExists("follows");
    
    const { followeeOpenId, publisherId, publisher } = event;
    const wxContext = cloud.getWXContext();
    const followerId = wxContext.OPENID;
    
    console.log('【云函数】参数解析:', { followeeOpenId, publisherId, publisher, followerId });
    
    // 确定关注标识，优先使用publisherId，其次使用followeeOpenId，最后使用publisher
    const followeeId = publisherId || followeeOpenId || publisher;
    
    console.log('【云函数】确定的followeeId:', followeeId);
    
    if (!followeeId) {
      console.error('【云函数】缺少发布者信息');
      return {
        success: false,
        errMsg: "缺少发布者信息"
      };
    }
    
    // 不能关注自己
    if (followeeId === followerId) {
      return {
        success: false,
        errMsg: "不能关注自己"
      };
    }
    
    // 检查是否已经关注
    const existingFollow = await db.collection("follows").where({
      followerId,
      followeeId: followeeId,
      status: "active"
    }).get();
    
    console.log('【云函数】检查是否已关注结果:', existingFollow);
    
    if (existingFollow.data.length > 0) {
      return {
        success: false,
        errMsg: "已经关注过该用户"
      };
    }
    
    // 创建关注关系
    const followData = {
      followerId,
      followeeId: followeeId,
      publisher: event.publisher || "",
      publisherId: publisherId || "",
      status: "active",
      createdAt: new Date()
    };
    
    console.log('【云函数】创建关注关系，数据:', followData);
    
    await db.collection("follows").add({
      data: followData
    });
    
    return {
      success: true,
      data: {
        message: "关注成功"
      }
    };
  } catch (e) {
    console.error('关注用户失败:', e);
    return {
      success: false,
      errMsg: e.message
    };
  }
};

// 取消关注
const unfollowUser = async (event) => {
  try {
    console.log('【云函数】unfollowUser被调用，event:', event);
    
    // 确保follows集合存在
    await ensureCollectionExists("follows");
    
    const { followeeOpenId, publisherId, publisher } = event;
    const wxContext = cloud.getWXContext();
    const followerId = wxContext.OPENID;
    
    console.log('【云函数】参数解析:', { followeeOpenId, publisherId, publisher, followerId });
    
    // 确定关注标识，优先使用publisherId，其次使用followeeOpenId，最后使用publisher
    const followeeId = publisherId || followeeOpenId || publisher;
    
    console.log('【云函数】确定的followeeId:', followeeId);
    
    if (!followeeId) {
      console.error('【云函数】缺少发布者信息');
      return {
        success: false,
        errMsg: "缺少发布者信息"
      };
    }
    
    // 取消关注
    const result = await db.collection("follows").where({
      followerId,
      followeeId: followeeId,
      status: "active"
    }).update({
      data: {
        status: "inactive",
        updatedAt: new Date()
      }
    });
    
    console.log('【云函数】取消关注结果:', result);
    
    if (result.stats.updated === 0) {
      return {
        success: false,
        errMsg: "未找到关注关系"
      };
    }
    
    return {
      success: true,
      data: {
        message: "取消关注成功"
      }
    };
  } catch (e) {
    console.error('取消关注失败:', e);
    return {
      success: false,
      errMsg: e.message
    };
  }
};

// 检查是否已关注
const isFollowing = async (event) => {
  try {
    console.log('【云函数】isFollowing被调用，event:', event);
    
    // 确保follows集合存在
    await ensureCollectionExists("follows");
    
    const { followeeOpenId, publisherId, publisher } = event;
    const wxContext = cloud.getWXContext();
    const followerId = wxContext.OPENID;
    
    console.log('【云函数】参数解析:', { followeeOpenId, publisherId, publisher, followerId });
    
    // 确定关注标识，优先使用publisherId，其次使用followeeOpenId，最后使用publisher
    const followeeId = publisherId || followeeOpenId || publisher;
    
    console.log('【云函数】确定的followeeId:', followeeId);
    
    if (!followeeId) {
      console.log('【云函数】没有followeeId，返回未关注');
      return {
        success: true,
        data: {
          isFollowing: false
        }
      };
    }
    
    const follow = await db.collection("follows").where({
      followerId,
      followeeId: followeeId,
      status: "active"
    }).get();
    
    console.log('【云函数】检查关注状态结果:', follow);
    
    return {
      success: true,
      data: {
        isFollowing: follow.data.length > 0
      }
    };
  } catch (e) {
    console.error('检查关注状态失败:', e);
    return {
      success: false,
      errMsg: e.message
    };
  }
};

// 获取关注列表
const getFollowingList = async (event) => {
  try {
    console.log('【云函数】getFollowingList被调用，event:', event);
    
    // 确保follows集合存在
    await ensureCollectionExists("follows");
    
    const { page = 1, pageSize = 10 } = event;
    const wxContext = cloud.getWXContext();
    const followerId = wxContext.OPENID;
    
    console.log('【云函数】参数解析:', { page, pageSize, followerId });
    
    // 查询关注的用户
    const follows = await db.collection("follows").where({
      followerId,
      status: "active"
    }).skip((page - 1) * pageSize).limit(pageSize).orderBy("createdAt", "desc").get();
    
    console.log('【云函数】获取关注列表结果:', follows);
    
    return {
      success: true,
      data: {
        following: follows.data,
        total: follows.data.length,
        page,
        pageSize
      }
    };
  } catch (e) {
    console.error('获取关注列表失败:', e);
    return {
      success: false,
      errMsg: e.message
    };
  }
};

// 云函数入口
exports.main = async (event, context) => {
  const { action } = event;
  
  try {
    switch (action) {
      case 'follow':
        return await followUser(event);
      case 'unfollow':
        return await unfollowUser(event);
      case 'isFollowing':
        return await isFollowing(event);
      case 'getFollowing':
        return await getFollowingList(event);
      default:
        return {
          success: false,
          errMsg: '未知操作'
        };
    }
  } catch (e) {
    console.error('云函数执行失败:', e);
    return {
      success: false,
      errMsg: e.message
    };
  }
};
