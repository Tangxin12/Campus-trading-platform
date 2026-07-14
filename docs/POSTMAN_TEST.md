# 二手交易平台小程序 - Postman测试示例

## 测试环境说明

- **云开发环境ID**：cloud1-7gc4fmm813ecee0f
- **云函数HTTP访问地址格式**：`https://{envId}.tcloudbaseapp.com/{functionName}`
- **Content-Type**：application/json

---

## 一、用户认证接口测试

### 1. 用户登录

**请求信息**：
- **URL**：`https://cloud1-7gc4fmm813ecee0f.tcloudbaseapp.com/login`
- **Method**：POST

**请求体**：
```json
{
  "username": "testuser",
  "password": "123456"
}
```

**预期成功响应**：
```json
{
  "success": true,
  "message": "登录成功",
  "userInfo": {
    "_id": "xxx",
    "username": "testuser",
    "nickname": "测试用户",
    "avatar": "",
    "token": "xxx"
  }
}
```

**预期失败响应（密码错误）**：
```json
{
  "success": false,
  "message": "账号或密码错误"
}
```

### 2. 用户注册

**请求信息**：
- **URL**：`https://cloud1-7gc4fmm813ecee0f.tcloudbaseapp.com/register`
- **Method**：POST

**请求体**：
```json
{
  "username": "newuser2024",
  "password": "123456",
  "nickname": "新用户测试"
}
```

**预期成功响应**：
```json
{
  "success": true,
  "message": "注册成功",
  "userInfo": {
    "_id": "xxx",
    "username": "newuser2024",
    "nickname": "新用户测试",
    "token": "xxx"
  }
}
```

**预期失败响应（用户名已存在）**：
```json
{
  "success": false,
  "message": "该用户名已注册"
}
```

---

## 二、商品管理接口测试

### 1. 获取商品列表

**请求信息**：
- **URL**：`https://cloud1-7gc4fmm813ecee0f.tcloudbaseapp.com/exchangeFunctions`
- **Method**：POST

**请求体**：
```json
{
  "type": "getExchangeItems",
  "page": 1,
  "pageSize": 10,
  "category": "",
  "campus": "康美"
}
```

**预期成功响应**：
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "xxx",
        "name": "商品名称",
        "price": 99,
        "image": "cloud://...",
        "category": "数码产品",
        "publisher": "发布者",
        "views": 10,
        "likes": 5,
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 10
  }
}
```

### 2. 搜索商品

**请求信息**：
- **URL**：`https://cloud1-7gc4fmm813ecee0f.tcloudbaseapp.com/exchangeFunctions`
- **Method**：POST

**请求体**：
```json
{
  "type": "searchItems",
  "keyword": "手机",
  "page": 1,
  "pageSize": 10
}
```

**预期成功响应**：
```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 5,
    "page": 1,
    "pageSize": 10
  }
}
```

### 3. 获取商品详情

**请求信息**：
- **URL**：`https://cloud1-7gc4fmm813ecee0f.tcloudbaseapp.com/exchangeFunctions`
- **Method**：POST

**请求体**：
```json
{
  "type": "getItemDetail",
  "itemId": "xxx"
}
```

**预期成功响应**：
```json
{
  "success": true,
  "data": {
    "_id": "xxx",
    "name": "商品名称",
    "description": "商品描述",
    "price": 99,
    "image": "cloud://...",
    "images": ["cloud://..."],
    "category": "数码产品",
    "condition": "9成新",
    "publisher": "发布者",
    "views": 11,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## 三、订单管理接口测试

### 1. 创建订单

**请求信息**：
- **URL**：`https://cloud1-7gc4fmm813ecee0f.tcloudbaseapp.com/orderFunctions`
- **Method**：POST

**请求体**：
```json
{
  "type": "createOrder",
  "itemId": "xxx",
  "sellerId": "sellerIdxxx",
  "buyerId": "buyerIdxxx",
  "buyerInfo": {
    "_id": "buyerIdxxx",
    "username": "买家昵称",
    "avatar": ""
  },
  "itemName": "iPhone 13",
  "itemImage": "cloud://cloud1-7gc4fmm813ecee0f/goods/iphone13.jpg",
  "itemPrice": 3500,
  "sellerName": "卖家昵称",
  "sellerAvatar": ""
}
```

**预期成功响应**：
```json
{
  "success": true,
  "message": "订单创建成功",
  "data": {
    "orderId": "orderxxx",
    "orderData": {
      "status": "pending",
      "createdAt": "2024-01-15T11:00:00.000Z"
    }
  }
}
```

### 2. 获取订单列表

**请求信息**：
- **URL**：`https://cloud1-7gc4fmm813ecee0f.tcloudbaseapp.com/orderFunctions`
- **Method**：POST

**请求体**：
```json
{
  "type": "getOrders",
  "userId": "xxx",
  "status": "all",
  "page": 1,
  "pageSize": 20
}
```

**预期成功响应**：
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "_id": "orderxxx",
        "itemName": "iPhone 13",
        "itemPrice": 3500,
        "sellerName": "卖家昵称",
        "buyerName": "买家昵称",
        "status": "pending",
        "createdAt": "2024-01-15T11:00:00.000Z"
      }
    ],
    "total": 5,
    "page": 1,
    "pageSize": 20
  }
}
```

### 3. 更新订单状态（确认订单）

**请求信息**：
- **URL**：`https://cloud1-7gc4fmm813ecee0f.tcloudbaseapp.com/orderFunctions`
- **Method**：POST

**请求体**：
```json
{
  "type": "updateOrderStatus",
  "orderId": "orderxxx",
  "status": "confirmed",
  "userId": "sellerIdxxx"
}
```

**预期成功响应**：
```json
{
  "success": true,
  "message": "订单状态更新成功",
  "data": {
    "orderId": "orderxxx",
    "newStatus": "confirmed"
  }
}
```

### 4. 更新订单状态（完成订单）

**请求信息**：
- **URL**：`https://cloud1-7gc4fmm813ecee0f.tcloudbaseapp.com/orderFunctions`
- **Method**：POST

**请求体**：
```json
{
  "type": "updateOrderStatus",
  "orderId": "orderxxx",
  "status": "completed",
  "userId": "sellerIdxxx"
}
```

**预期成功响应**：
```json
{
  "success": true,
  "message": "订单状态更新成功",
  "data": {
    "orderId": "orderxxx",
    "newStatus": "completed"
  }
}
```

### 5. 删除订单

**请求信息**：
- **URL**：`https://cloud1-7gc4fmm813ecee0f.tcloudbaseapp.com/orderFunctions`
- **Method**：POST

**请求体**：
```json
{
  "type": "deleteOrder",
  "orderId": "orderxxx",
  "userId": "sellerIdxxx"
}
```

**预期成功响应**：
```json
{
  "success": true,
  "message": "订单删除成功"
}
```

---

## 四、云函数部署说明

### 部署步骤

1. **打开微信开发者工具**
2. **右键点击云函数目录**（如 `login`）
3. **选择"上传并部署：云端安装依赖"**
4. **等待部署完成**

### 需要部署的云函数列表

| 云函数名称 | 功能 | 部署状态 |
|-----------|------|---------|
| login | 用户登录 | ✅ |
| register | 用户注册 | ✅ |
| exchangeFunctions | 商品管理 | ✅ |
| orderFunctions | 订单管理 | ✅ |
| followFunctions | 关注功能 | ✅ |
| getTempFileUrl | 获取临时链接 | ✅ |

### 验证部署成功

部署完成后，右键点击云函数 → 选择"云端测试"，输入测试参数验证功能是否正常。

---

## 五、线上可访问性说明

### 小程序访问方式

1. **预览二维码**：
   - 在微信开发者工具中点击"预览"
   - 生成二维码，使用微信扫码访问

2. **体验版**：
   - 提交小程序审核
   - 获取体验版二维码

3. **正式版**：
   - 审核通过后上线
   - 用户可以在微信搜索小程序名称访问

### 云函数HTTP访问

所有云函数部署后均可通过HTTP访问：

| 云函数 | HTTP地址 |
|--------|---------|
| login | `https://cloud1-7gc4fmm813ecee0f.tcloudbaseapp.com/login` |
| register | `https://cloud1-7gc4fmm813ecee0f.tcloudbaseapp.com/register` |
| exchangeFunctions | `https://cloud1-7gc4fmm813ecee0f.tcloudbaseapp.com/exchangeFunctions` |
| orderFunctions | `https://cloud1-7gc4fmm813ecee0f.tcloudbaseapp.com/orderFunctions` |

### 本地启动验证（替代方案）

如果无法部署到线上，可采用以下方式验证：

1. **启动微信开发者工具**
2. **开启云开发环境**
3. **确保所有云函数已上传部署**
4. **使用真机调试功能**
5. **录制屏幕视频，展示所有功能正常运行**

---

## 六、前端路由说明

### 独立路由列表

| 路由 | 页面 | 功能描述 |
|------|------|---------|
| `/pages/index/index` | 首页 | 商品列表展示、搜索、分类筛选 |
| `/pages/detail/detail` | 商品详情页 | 商品详情、收藏、发起交易 |
| `/pages/publish/publish` | 发布页 | 发布二手商品 |
| `/pages/login/login` | 登录页 | 用户登录 |
| `/pages/register/register` | 注册页 | 用户注册 |
| `/pages/mine/mine` | 个人中心 | 用户信息、我的发布、我的订单 |
| `/pages/myOrders/myOrders` | 订单页 | 订单列表、订单管理 |
| `/pages/myPublish/myPublish` | 我的发布 | 已发布商品管理 |
| `/pages/myCollection/myCollection` | 我的收藏 | 收藏商品列表 |
| `/pages/notification/notification` | 通知页 | 交易通知、互动通知 |
| `/pages/chat/chat` | 聊天页 | 买卖双方沟通 |

### 路由配置文件

路由配置位于 `miniprogram/app.json` 文件中：

```json
{
  "pages": [
    "pages/index/index",
    "pages/detail/detail",
    "pages/publish/publish",
    "pages/login/login",
    "pages/register/register",
    "pages/mine/mine",
    "pages/myOrders/myOrders",
    "pages/myPublish/myPublish",
    "pages/myCollection/myCollection",
    "pages/notification/notification",
    "pages/chat/chat"
  ],
  "tabBar": {
    "list": [
      { "pagePath": "pages/index/index", "text": "首页" },
      { "pagePath": "pages/mine/mine", "text": "我的" }
    ]
  }
}
```

---

## 七、功能完整性检查清单

### 用户认证模块 ✅
- [x] 用户注册
- [x] 用户登录
- [x] 登录状态缓存
- [x] Token验证

### 商品管理模块 ✅
- [x] 商品发布
- [x] 商品列表展示
- [x] 商品详情
- [x] 商品搜索
- [x] 分类筛选
- [x] 收藏功能
- [x] 商品编辑
- [x] 商品删除

### 订单管理模块 ✅
- [x] 创建订单
- [x] 订单列表
- [x] 订单状态更新
- [x] 删除订单
- [x] 交易评价

### 消息通知模块 ✅
- [x] 交易通知
- [x] 系统通知
- [x] 互动通知

### 界面体验 ✅
- [x] 响应式布局
- [x] 加载状态
- [x] 错误提示
- [x] 用户反馈

### 健壮性 ✅
- [x] 参数验证
- [x] 权限检查
- [x] 异常捕获
- [x] 错误处理