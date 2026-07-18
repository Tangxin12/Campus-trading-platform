# 校园二手交易平台小程序

## 项目介绍

校园二手交易平台是一款基于微信小程序开发的二手物品置换平台，旨在帮助在校学生方便快捷地进行二手物品交易，促进资源循环利用，打造绿色环保的校园生活方式。

### 核心功能

| 功能模块 | 功能描述 |
|----------|----------|
| **用户模块** | 用户注册、登录、个人信息管理（头像、昵称、学院、专业、学号）、缓存登录状态 |
| **商品模块** | 商品发布、编辑、删除、搜索、分类浏览、收藏/取消收藏 |
| **交易订单模块** | 订单创建、状态更新（待确认/已确认/已完成）、双向评价、交易记录管理 |
| **消息通知模块** | 系统通知、交易通知、互动通知 |
| **智能推荐模块** | 基于浏览历史的个性化推荐、热门商品推荐、浏览历史管理 |

### UI/UX体验

- 统一的蓝紫色渐变主题，卡片式布局，圆润的按钮和边框
- 流畅的交互体验，包括点击反馈、下拉刷新、页面跳转过渡动画
- 智能推荐功能，基于用户浏览历史提供个性化推荐
- 完善的异常场景处理，包括集合不存在、用户信息缺失、图片加载失败等

---

## 线上部署与访问

### 小程序码

![小程序码](docs/qrcode.png)



## 技术栈

### 前端技术

| 技术 | 版本 | 说明 |
|------|------|------|
| 微信小程序 | 基础库 2.24.0+ | 小程序开发框架 |
| WXML | - | 页面结构描述语言 |
| WXSS | - | 页面样式描述语言 |
| JavaScript ES6+ | - | 脚本语言 |

### 后端技术

| 技术 | 说明 |
|------|------|
| 微信云开发 | 云函数、云数据库、云存储 |
| Node.js | 云函数运行环境 |

### 开发工具

| 工具 | 说明 |
|------|------|
| 微信开发者工具 | 小程序开发调试工具 |
| Trae AI | AI辅助开发工具 |

---



### 环境要求

- 微信开发者工具（最新版本）
- 微信小程序账号（已开通云开发功能）

### 安装步骤

1. **克隆项目**：
   ```bash
   git clone <https://github.com/Tangxin12/Campus-trading-platform.git>
   cd preUsed
   ```

2. **打开项目**：
   - 打开微信开发者工具
   - 选择"导入项目"
   - 选择项目目录，填写AppID（测试可使用测试号）

3. **初始化云开发环境**：
   - 在微信开发者工具中点击"云开发"按钮
   - 创建云开发环境（选择按量付费或包年包月）
   - 记录环境ID

4. **配置云开发环境**：
   - 修改 `cloudfunctions/exchangeFunctions/index.js` 和 `cloudfunctions/orderFunctions/index.js` 中的 `env` 配置
   - 或使用 `cloud.DYNAMIC_CURRENT_ENV` 自动获取当前环境

5. **部署云函数**：
   - 右键点击 `cloudfunctions/exchangeFunctions` → "上传并部署：云端安装依赖"
   - 右键点击 `cloudfunctions/orderFunctions` → "上传并部署：云端安装依赖"
   - 右键点击 `cloudfunctions/getTempFileUrl` → "上传并部署：云端安装依赖"

6. **运行项目**：
   - 点击"编译"按钮
   - 在模拟器中预览效果

---

## 项目结构

```
preUsed/
├── cloudfunctions/              # 云函数目录
│   ├── exchangeFunctions/      # 商品管理云函数
│   │   └── index.js
│   ├── orderFunctions/         # 订单管理云函数
│   │   └── index.js
│   └── getTempFileUrl/         # 获取临时链接云函数
│       └── index.js
├── miniprogram/                # 小程序前端目录
│   ├── pages/                  # 页面目录
│   │   ├── index/              # 首页
│   │   ├── detail/             # 商品详情页
│   │   ├── publish/            # 发布商品页
│   │   ├── myOrders/           # 订单列表页
│   │   ├── orderDetail/        # 订单详情页
│   │   ├── orderRate/          # 订单评价页
│   │   ├── chat/               # 聊天页面
│   │   ├── mine/               # 个人中心页
│   │   ├── profile/            # 个人资料页
│   │   ├── myCollection/       # 我的收藏页
│   │   ├── myPublish/          # 我的发布页
│   │   ├── myBrowse/           # 浏览历史页
│   │   ├── search/             # 搜索页
│   │   └── message/            # 消息页
│   ├── utils/                  # 工具类
│   │   └── imageUtils.js       # 图片处理工具
│   ├── images/                 # 图片资源
│   ├── app.js                  # 小程序入口文件
│   ├── app.json                # 小程序配置文件
│   └── app.wxss                # 全局样式文件
├── docs/                       # 文档目录
│   ├── API_DOC.md              # API接口文档
│   ├── POSTMAN_TEST.md         # Postman测试说明
│   └── PROMPT_LOG.md           # AI工具运用日志
└── project.config.json         # 项目配置文件
```

---

## API文档

详细的API接口文档请参考：[API_DOC.md](docs/API_DOC.md)

### 云函数列表

| 云函数名称 | 功能 |
|------------|------|
| `exchangeFunctions` | 商品管理、收藏、智能推荐、浏览历史 |
| `orderFunctions` | 订单管理、评价 |
| `getTempFileUrl` | 获取云存储临时链接 |

---

## AI工具运用

本项目开发过程中，AI工具（Trae）辅助完成了约60%的代码实现和问题解决。详细的AI运用日志请参考：[PROMPT_LOG.md](docs/PROMPT_LOG.md)

---

## 参考文档

- [微信小程序官方文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [微信云开发文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)
