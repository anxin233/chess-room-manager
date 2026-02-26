# 棋牌室管理系统

基于 Electron + Vite + Vue 3 + Element Plus + SQLite 开发的棋牌室管理系统。

## 技术栈

- **Electron** ^33.2.0 - 跨平台桌面应用框架
- **Vite** ^6.0.0 - 下一代前端构建工具
- **Vue 3** ^3.5.0 - 渐进式 JavaScript 框架
- **Element Plus** ^2.13.2 - Vue 3 UI 组件库
- **Vue Router** ^4.5.0 - Vue 官方路由管理器
- **Pinia** ^2.3.0 - Vue 官方状态管理库
- **TypeScript** ^5.7.0 - 类型安全的 JavaScript 超集
- **SQLite** (better-sqlite3) - 本地数据库

## 功能模块

- 房间管理 - 房间信息、状态管理、费率设置
- 会员管理 - 会员信息、余额管理、等级系统
- 订单管理 - 开单结算、订单记录、支付方式
- 商品管理 - 商品信息、库存管理、销售记录
- 充值管理 - 会员充值、充值记录、赠送规则
- 数据统计 - 营业数据、报表分析

## 数据存储

- **离线运行**: 完全本地化，无需网络连接
- **数据库**: SQLite，存储在用户数据目录
  - Windows: `C:\Users\{用户名}\AppData\Roaming\chess-room-manager\data\`
  - macOS: `~/Library/Application Support/chess-room-manager/data/`
  - Linux: `~/.config/chess-room-manager/data/`
- **数据备份**: 支持数据库文件备份和迁移

## 安装依赖

```bash
npm install
```

## 开发

```bash
npm run dev
```

启动后会自动：
1. 初始化 SQLite 数据库
2. 启动 Vite 开发服务器（端口 5173）
3. 启动 Electron 应用窗口

## 构建

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

构建产物位于 `release/{version}/` 目录。

## 项目结构

```
chess-room-manager/
├── electron/                 # Electron 主进程
│   ├── main/
│   │   ├── index.ts         # 主进程入口
│   │   └── database/        # 数据库模块
│   │       ├── index.ts     # 数据库初始化
│   │       ├── types.ts     # 类型定义
│   │       └── services.ts  # CRUD 操作
│   └── preload/
│       └── index.ts         # 预加载脚本
├── src/                     # Vue 渲染进程
│   ├── views/              # 页面组件
│   ├── components/         # 可复用组件
│   ├── stores/             # Pinia 状态管理
│   ├── router/             # 路由配置
│   └── main.ts             # Vue 入口
└── package.json
```

## 开发指南

### 添加新的数据库操作

1. 在 `electron/main/database/services.ts` 中添加服务函数
2. 在 `electron/main/index.ts` 中注册 IPC 处理器
3. 在 `electron/preload/index.ts` 中暴露 API 接口
4. 在渲染进程中通过 `window.electronAPI.db.*` 调用

### 数据库表结构

- **rooms** - 房间信息（id, name, type, hourly_rate, status）
- **members** - 会员信息（id, name, phone, balance, points, level）
- **orders** - 订单信息（id, room_id, member_id, start_time, end_time, amount, status）
- **products** - 商品信息（id, name, category, price, stock）
- **product_sales** - 销售记录（id, product_id, order_id, quantity, amount）
- **recharges** - 充值记录（id, member_id, amount, bonus, payment_method）

## 许可证

MIT
