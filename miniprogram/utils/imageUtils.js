const DEFAULT_GOODS_IMAGE = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=product%20placeholder%20image&image_size=square';
const DEFAULT_AVATAR_IMAGE = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=user%20avatar%20placeholder%20circular%20portrait&image_size=square';

const getTempFileUrl = function(fileID) {
  return new Promise(function(resolve, reject) {
    if (!fileID || !fileID.startsWith('cloud://')) {
      resolve(fileID);
      return;
    }

    wx.cloud.callFunction({
      name: 'getTempFileUrl',
      data: { fileID: fileID }
    }).then(function(res) {
      if (res.result.success) {
        resolve(res.result.tempFileURL);
      } else {
        reject(new Error(res.result.message || '获取临时链接失败'));
      }
    }).catch(function(err) {
      reject(new Error('云函数调用失败: ' + (err.message || err)));
    });
  });
};

const cloneObject = function(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(function(item) {
      return cloneObject(item);
    });
  }
  const cloned = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = cloneObject(obj[key]);
    }
  }
  return cloned;
};

const convertImageUrls = async function(items) {
  const list = cloneObject(items);
  
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    
    if (item.image) {
      try {
        item.image = await getTempFileUrl(item.image);
      } catch (err) {
        console.error('物品图片转换失败:', err);
        item.image = DEFAULT_GOODS_IMAGE;
      }
    }
    
    if (item.avatar) {
      try {
        item.avatar = await getTempFileUrl(item.avatar);
      } catch (err) {
        console.error('头像转换失败:', err);
        item.avatar = DEFAULT_AVATAR_IMAGE;
      }
    }
  }
  
  return list;
};

const convertOrderImageUrls = async function(orders) {
  const list = cloneObject(orders);
  
  for (let i = 0; i < list.length; i++) {
    const order = list[i];
    
    if (order.itemImage) {
      try {
        order.itemImage = await getTempFileUrl(order.itemImage);
      } catch (err) {
        console.error('订单商品图片转换失败:', err);
        order.itemImage = DEFAULT_GOODS_IMAGE;
      }
    }
    
    if (order.sellerAvatar) {
      try {
        order.sellerAvatar = await getTempFileUrl(order.sellerAvatar);
      } catch (err) {
        console.error('卖家头像转换失败:', err);
        order.sellerAvatar = DEFAULT_AVATAR_IMAGE;
      }
    }
    
    if (order.buyerAvatar) {
      try {
        order.buyerAvatar = await getTempFileUrl(order.buyerAvatar);
      } catch (err) {
        console.error('买家头像转换失败:', err);
        order.buyerAvatar = DEFAULT_AVATAR_IMAGE;
      }
    }
  }
  
  return list;
};

const convertAllImageUrls = async function(item) {
  const convertedItem = cloneObject(item);
  
  if (convertedItem.image && convertedItem.image.startsWith('cloud://')) {
    try {
      convertedItem.image = await getTempFileUrl(convertedItem.image);
    } catch (err) {
      console.error('主图转换失败:', err);
      convertedItem.image = DEFAULT_GOODS_IMAGE;
    }
  }
  
  if (convertedItem.images && Array.isArray(convertedItem.images) && convertedItem.images.length > 0) {
    const convertedImages = [];
    for (let img of convertedItem.images) {
      if (img && img.startsWith('cloud://')) {
        try {
          convertedImages.push(await getTempFileUrl(img));
        } catch (err) {
          convertedImages.push(DEFAULT_GOODS_IMAGE);
        }
      } else {
        convertedImages.push(img || DEFAULT_GOODS_IMAGE);
      }
    }
    convertedItem.images = convertedImages;
  } else {
    convertedItem.images = [convertedItem.image || DEFAULT_GOODS_IMAGE];
  }
  
  if (convertedItem.avatar && convertedItem.avatar.startsWith('cloud://')) {
    try {
      convertedItem.avatar = await getTempFileUrl(convertedItem.avatar);
    } catch (err) {
      console.error('头像转换失败:', err);
      convertedItem.avatar = DEFAULT_AVATAR_IMAGE;
    }
  }
  
  return convertedItem;
};

module.exports = {
  getTempFileUrl: getTempFileUrl,
  convertImageUrls: convertImageUrls,
  convertOrderImageUrls: convertOrderImageUrls,
  convertAllImageUrls: convertAllImageUrls,
  DEFAULT_GOODS_IMAGE: DEFAULT_GOODS_IMAGE,
  DEFAULT_AVATAR_IMAGE: DEFAULT_AVATAR_IMAGE
};