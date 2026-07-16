# 二手交易平台小程序 - API接口文档

## 文档说明

本文档描述了二手交易平台小程序的后端API接口，所有接口均基于微信云开发云函数实现。

### 接口调用方式

**云函数调用（前端）**：
```javascript
wx.cloud.callFunction({
  name: '云函数名称',
  data: {
    type: '接口类型',
    // 其他参数...
  }
}).then(res => {
  // 处理响应
});
```

**HTTP调用（Postman测试）**：
- 方法：POST
- URL：云函数HTTP访问地址
- Content-Type：application/json

---

## 一、用户认证接口

### 1. 用户登录

**云函数名称**：`login`

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |

**请求示例**：
```json
{
  "username": "testuser",
  "password": "123456"
}
```

**成功响应**：
```json
{
  "success": true,
  "message": "登录成功",
  "userInfo": {
    "_id": "abc123",
    "username": "testuser",
    "nickname": "测试用户",
    "avatar": "",
    "isVerified": false,
    "college": "",
    "major": "",
    "studentId": "",
    "phone": "",
    "exchangeCount": 0,
    "publishCount": 0,
    "token": "abcdef123456..."
  }
}
```

**失败响应**：
```json
{
  "success": false,
  "message": "账号或密码错误"
}
```

### 2. 用户注册

**云函数名称**：`register`

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码（6-20位） |
| nickname | string | 是 | 昵称 |

**请求示例**：
```json
{
  "username": "newuser",
  "password": "123456",
  "nickname": "新用户"
}
```

**成功响应**：
```json
{
  "success": true,
  "message": "注册成功",
  "userInfo": {
    "_id": "def456",
    "username": "newuser",
    "nickname": "新用户",
    "avatar": "",
    "token": "ghijkl789012..."
  }
}
```

**失败响应**：
```json
{
  "success": false,
  "message": "该用户名已注册"
}
```

---

## 二、商品管理接口

### 云函数名称：`exchangeFunctions`

所有商品管理接口通过 `type` 参数区分操作类型。

### 1. 发布商品

**接口类型**：`publishItem`

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| type | string | 是 | 固定值：`publishItem` |
| itemData | object | 是 | 商品数据 |
| itemData.itemName | string | 是 | 商品名称 |
| itemData.description | string | 否 | 商品描述 |
| itemData.images | array | 是 | 图片路径数组（cloud://） |
| itemData.category | string | 是 | 分类（数码产品/服饰箱包/图书文具/生活用品/美妆/运动器材） |
| itemData.condition | string | 是 | 成色（全新/9成新/8成新/7成新/破旧） |
| itemData.price | number | 是 | 价格 |
| itemData.campus | string | 是 | 校区（康美/美林） |
| itemData.exchangeMethod | string | 否 | 交换方式（默认：仅本校自提） |
| itemData.exchangeAddress | string | 否 | 交换地址 |
| itemData.offlineTime | string | 否 | 下架时间（默认：30天） |
| userInfo | object | 是 | 用户信息 |
| userInfo._id | string | 是 | 用户ID |
| userInfo.username | string | 是 | 用户名 |
| userInfo.avatar | string | 否 | 头像 |

**请求示例**：
```json
{
  "type": "publishItem",
  "itemData": {
    "itemName": "iPhone 13",
    "description": "9成新，电池健康85%",
    "images": ["cloud://cloud1-xxx/goods/iphone13.jpg"],
    "category": "数码产品",
    "condition": "9成新",
    "price": 3500,
    "campus": "康美"
  },
  "userInfo": {
    "_id": "abc123",
    "username": "testuser"
  }
}
```

**成功响应**：
```json
{
  "success": true,
  "data": {
    "_id": "item001",
    "name": "iPhone 13",
    "price": 3500,
    "category": "数码产品",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**失败响应**：
```json
{
  "success": false,
  "errMsg": "缺少必要参数"
}
```

### 2. 获取商品列表

**接口类型**：`getExchangeItems`

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| type | string | 是 | 固定值：`getExchangeItems` |
| page | number | 否 | 页码（默认：1） |
| pageSize | number | 否 | 每页数量（默认：10） |
| category | string | 否 | 分类筛选 |
| campus | string | 否 | 校区筛选 |
| sortBy | string | 否 | 排序方式（createdAt/hot） |

**请求示例**：
```json
{
  "type": "getExchangeItems",
  "page": 1,
  "pageSize": 10,
  "category": "数码产品",
  "campus": "康美"
}
```

**成功响应**：
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "item001",
        "name": "iPhone 13",
        "price": 3500,
        "image": "cloud://cloud1-xxx/goods/iphone13.jpg",
        "category": "数码产品",
        "publisher": "testuser",
        "views": 100,
        "likes": 10,
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "total": 50,
    "page": 1,
    "pageSize": 10
  }
}
```

### 3. 获取商品详情

**接口类型**：`getItemDetail`

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| type | string | 是 | 固定值：`getItemDetail` |
| itemId | string | 是 | 商品ID |

**请求示例**：
```json
{
  "type": "getItemDetail",
  "itemId": "item001"
}
```

**成功响应**：
```json
{
  "success": true,
  "data": {
    "_id": "item001",
    "name": "iPhone 13",
    "description": "9成新，电池健康85%",
    "price": 3500,
    "image": "cloud://cloud1-xxx/goods/iphone13.jpg",
    "images": ["cloud://cloud1-xxx/goods/iphone13.jpg"],
    "category": "数码产品",
    "condition": "9成新",
    "publisher": "testuser",
    "publisherId": "abc123",
    "avatar": "",
    "views": 101,
    "likes": 10,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 4. 搜索商品

**接口类型**：`searchItems`

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| type | string | 是 | 固定值：`searchItems` |
| keyword | string | 是 | 搜索关键词 |
| page | number | 否 | 页码（默认：1） |
| pageSize | number | 否 | 每页数量（默认：10） |
| campus | string | 否 | 校区筛选 |

**请求示例**：
```json
{
  "type": "searchItems",
  "keyword": "iPhone",
  "page": 1,
  "pageSize": 10
}
```

**成功响应**：
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "item001",
        "name": "iPhone 13",
        "price": 3500,
        "image": "cloud://cloud1-xxx/goods/iphone13.jpg"
      }
    ],
    "total": 5,
    "page": 1,
    "pageSize": 10
  }
}
```

### 5. 收藏商品

**接口类型**：`collectItem`

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| type | string | 是 | 固定值：`collectItem` |
| itemId | string | 是 | 商品ID |

**请求示例**：
```json
{
  "type": "collectItem",
  "itemId": "item001"
}
```

**成功响应**：
```json
{
  "success": true,
  "data": {
    "message": "收藏成功"
  }
}
```

**失败响应**：
```json
{
  "success": false,
  "errMsg": "已经收藏过该物品"
}
```

### 6. 智能推荐

**接口类型**：`getRecommendItems`

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| type | string | 是 | 固定值：`getRecommendItems` |
| categories | array | 否 | 分类列表（基于浏览历史提取） |
| excludeIds | array | 否 | 排除的商品ID列表（已浏览过的） |
| limit | number | 否 | 推荐数量（默认：6） |

**请求示例**：
```json
{
  "type": "getRecommendItems",
  "categories": ["数码产品", "图书文具"],
  "excludeIds": ["item001", "item002"],
  "limit": 6
}
```

**成功响应**：
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "item003",
        "name": "iPad Pro",
        "price": 4500,
        "image": "cloud://cloud1-xxx/goods/ipad.jpg",
        "category": "数码产品",
        "likes": 20,
        "views": 150
      }
    ],
    "total": 6
  }
}
```

### 7. 记录浏览历史

**接口类型**：`recordBrowseHistory`

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| type | string | 是 | 固定值：`recordBrowseHistory` |
| itemId | string | 是 | 商品ID |
| itemName | string | 是 | 商品名称 |
| category | string | 是 | 商品分类 |
| price | number | 是 | 商品价格 |
| image | string | 是 | 商品图片（cloud://） |
| userId | string | 否 | 用户ID（可选，不传则使用openid） |

**请求示例**：
```json
{
  "type": "recordBrowseHistory",
  "itemId": "item001",
  "itemName": "iPhone 13",
  "category": "数码产品",
  "price": 3500,
  "image": "cloud://cloud1-xxx/goods/iphone13.jpg",
  "userId": "abc123"
}
```

**成功响应**：
```json
{
  "success": true,
  "data": {
    "message": "浏览记录保存成功"
  }
}
```

### 8. 获取浏览历史

**接口类型**：`getUserBrowseHistory`

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| type | string | 是 | 固定值：`getUserBrowseHistory` |
| userId | string | 否 | 用户ID（可选，不传则使用openid） |

**请求示例**：
```json
{
  "type": "getUserBrowseHistory",
  "userId": "abc123"
}
```

**成功响应**：
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "history001",
        "itemId": "item001",
        "itemName": "iPhone 13",
        "category": "数码产品",
        "price": 3500,
        "image": "cloud://cloud1-xxx/goods/iphone13.jpg",
        "createdAt": "2024-01-15T12:00:00.000Z"
      }
    ],
    "total": 10
  }
}
```

### 9. 删除单条浏览记录

**接口类型**：`deleteBrowseHistoryItem`

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| type | string | 是 | 固定值：`deleteBrowseHistoryItem` |
| historyId | string | 是 | 浏览记录ID |
| userId | string | 否 | 用户ID（可选，不传则使用openid） |

**请求示例**：
```json
{
  "type": "deleteBrowseHistoryItem",
  "historyId": "history001",
  "userId": "abc123"
}
```

**成功响应**：
```json
{
  "success": true,
  "data": {
    "message": "删除成功"
  }
}
```

### 10. 清空浏览历史

**接口类型**：`clearBrowseHistory`

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| type | string | 是 | 固定值：`clearBrowseHistory` |
| userId | string | 否 | 用户ID（可选，不传则使用openid） |

**请求示例**：
```json
{
  "type": "clearBrowseHistory",
  "userId": "abc123"
}
```

**成功响应**：
```json
{
  "success": true,
  "data": {
    "message": "清空成功",
    "deletedCount": 10
  }
}
```

---

## 三、订单管理接口

### 云函数名称：`orderFunctions`

所有订单管理接口通过 `type` 参数区分操作类型。

### 1. 创建订单

**接口类型**：`createOrder`

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| type | string | 是 | 固定值：`createOrder` |
| itemId | string | 是 | 商品ID |
| sellerId | string | 是 | 卖家ID |
| buyerId | string | 是 | 买家ID |
| buyerInfo | object | 是 | 买家信息 |
| buyerInfo._id | string | 是 | 买家ID |
| buyerInfo.username | string | 是 | 买家昵称 |
| buyerInfo.avatar | string | 否 | 买家头像 |
| itemName | string | 是 | 商品名称 |
| itemImage | string | 是 | 商品图片（cloud://） |
| itemPrice | number | 是 | 商品价格 |
| sellerName | string | 是 | 卖家昵称 |
| sellerAvatar | string | 否 | 卖家头像（cloud://） |

**请求示例**：
```json
{
  "type": "createOrder",
  "itemId": "item001",
  "sellerId": "abc123",
  "buyerId": "def456",
  "buyerInfo": {
    "_id": "def456",
    "username": "买家昵称",
    "avatar": ""
  },
  "itemName": "iPhone 13",
  "itemImage": "cloud://cloud1-xxx/goods/iphone13.jpg",
  "itemPrice": 3500,
  "sellerName": "卖家昵称",
  "sellerAvatar": ""
}
```

**成功响应**：
```json
{
  "success": true,
  "message": "订单创建成功",
  "data": {
    "orderId": "order001",
    "orderData": {
      "status": "pending",
      "createdAt": "2024-01-15T11:00:00.000Z"
    }
  }
}
```

**失败响应**：
```json
{
  "success": false,
  "message": "缺少必填参数（买家ID/物品ID/卖家ID）"
}
```

### 2. 获取订单列表

**接口类型**：`getOrders`

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| type | string | 是 | 固定值：`getOrders` |
| userId | string | 是 | 用户ID（买家或卖家） |
| status | string | 否 | 状态筛选（pending/confirmed/completed/cancelled/all） |
| page | number | 否 | 页码（默认：1） |
| pageSize | number | 否 | 每页数量（默认：10） |

**请求示例**：
```json
{
  "type": "getOrders",
  "userId": "abc123",
  "status": "pending",
  "page": 1,
  "pageSize": 20
}
```

**成功响应**：
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "_id": "order001",
        "itemId": "item001",
        "itemName": "iPhone 13",
        "itemImage": "cloud://cloud1-xxx/goods/iphone13.jpg",
        "itemPrice": 3500,
        "sellerId": "abc123",
        "sellerName": "卖家昵称",
        "buyerId": "def456",
        "buyerName": "买家昵称",
        "status": "pending",
        "createdAt": "2024-01-15T11:00:00.000Z"
      }
    ],
    "total": 10,
    "page": 1,
    "pageSize": 20
  }
}
```

### 3. 更新订单状态

**接口类型**：`updateOrderStatus`

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| type | string | 是 | 固定值：`updateOrderStatus` |
| orderId | string | 是 | 订单ID |
| status | string | 是 | 新状态（pending/confirmed/completed/cancelled） |
| userId | string | 是 | 当前操作用户ID |

**请求示例**：
```json
{
  "type": "updateOrderStatus",
  "orderId": "order001",
  "status": "confirmed",
  "userId": "abc123"
}
```

**成功响应**：
```json
{
  "success": true,
  "message": "订单状态更新成功",
  "data": {
    "orderId": "order001",
    "newStatus": "confirmed"
  }
}
```

**失败响应**：
```json
{
  "success": false,
  "message": "只有卖家可以确认订单"
}
```

### 4. 删除订单

**接口类型**：`deleteOrder`

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| type | string | 是 | 固定值：`deleteOrder` |
| orderId | string | 是 | 订单ID |
| userId | string | 是 | 当前操作用户ID |

**请求示例**：
```json
{
  "type": "deleteOrder",
  "orderId": "order001",
  "userId": "abc123"
}
```

**成功响应**：
```json
{
  "success": true,
  "message": "订单删除成功"
}
```

**失败响应**：
```json
{
  "success": false,
  "message": "无权删除此订单"
}
```

### 5. 评价订单

**接口类型**：`rateOrder`

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| type | string | 是 | 固定值：`rateOrder` |
| orderId | string | 是 | 订单ID |
| rating | number | 是 | 评分（1-5） |
| comment | string | 否 | 评价内容 |
| isSeller | boolean | 是 | 是否卖家评价 |
| userId | string | 是 | 当前操作用户ID |

**请求示例**：
```json
{
  "type": "rateOrder",
  "orderId": "order001",
  "rating": 5,
  "comment": "交易愉快！",
  "isSeller": false,
  "userId": "def456"
}
```

**成功响应**：
```json
{
  "success": true,
  "message": "评价成功"
}
```

**失败响应**：
```json
{
  "success": false,
  "message": "只能评价已完成的订单"
}
```

---

## 四、其他辅助接口

### 1. 获取云存储临时链接

**云函数名称**：`getTempFileUrl`

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| fileID | string | 是 | 云存储文件ID（cloud://开头） |

**请求示例**：
```json
{
  "fileID": "cloud://cloud1-xxx/goods/iphone13.jpg"
}
```

**成功响应**：
```json
{
  "success": true,
  "tempFileURL": "https://xxx.tcloudbaseapp.com/xxx.jpg"
}
```

---

## 五、状态码说明

| 状态 | 值 | 说明 |
|------|-----|------|
| success | true | 操作成功 |
| success | false | 操作失败 |

### 订单状态

| 状态值 | 说明 |
|--------|------|
| pending | 待确认 |
| confirmed | 已确认 |
| completed | 已完成 |
| cancelled | 已取消 |

### 商品成色

| 值 | 说明 |
|----|------|
| 全新 | 未使用过 |
| 9成新 | 轻微使用痕迹 |
| 8成新 | 明显使用痕迹 |
| 7成新 | 较多使用痕迹 |
| 破旧 | 严重磨损 |

---

## 六、错误处理规范

所有接口返回统一的错误格式：

```json
{
  "success": false,
  "message": "错误描述"
}
```

或

```json
{
  "success": false,
  "errMsg": "错误描述"
}
```

---

## 七、Postman测试说明

### 测试步骤

1. **获取云函数HTTP访问地址**：
   - 打开微信开发者工具
   - 右键点击云函数 → 复制HTTP访问地址

2. **配置Postman请求**：
   - 方法：POST
   - URL：云函数HTTP地址
   - Headers：`Content-Type: application/json`
   - Body：raw JSON格式，填入对应接口参数

### 测试示例（用户登录）

- **URL**：`https://xxx.tcloudbaseapp.com/login`
- **Method**：POST
- **Body**：
```json
{
  "username": "testuser",
  "password": "123456"
}
```

---

## 八、线上可访问性

### 小程序访问

1. **预览二维码**：在微信开发者工具中点击"预览"生成二维码
2. **体验版**：提交审核后获取体验版二维码
3. **正式版**：审核通过后上线

### 云函数访问

所有云函数均可通过HTTP方式访问，用于接口测试和验证。