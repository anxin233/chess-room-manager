# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个基于 Electron + Vite + Vue 3 + TypeScript 开发的棋牌室管理系统桌面应用。

## 技术栈

- **Electron** ^33.2.0 - 跨平台桌面应用框架
- **Vite** ^6.0.0 - 前端构建工具
- **Vue 3** ^3.5.0 + Composition API
- **Element Plus** ^2.13.2 - UI 组件库
- **Vue Router** ^4.5.0 - 使用 Hash 模式（适合 Electron）
- **Pinia** ^2.3.0 - 状态管理（使用 Setup Store 模式）
- **TypeScript** ^5.7.0
- **SQLite** (better-sqlite3) - 本地数据库

## 常用命令

```bash
# 开发模式（启动 Vite 开发服务器和 Electron）
npm run dev

# 类型检查
npm run type-check

# 代码检查和修复
npm run lint

# 构建应用
npm run build        # 通用构建
npm run build:win    # Windows 构建
npm run build:mac    # macOS 构建
npm run build:linux  # Linux 构建
```

## 项目架构

### 目录结构

- `electron/` - Electron 主进程和预加载脚本
  - `main/index.ts` - 主进程入口，负责窗口创建和 IPC 通信
  - `main/database/` - SQLite 数据库模块
    - `index.ts` - 数据库初始化和连接管理
    - `types.ts` - 数据库类型定义
    - `services.ts` - 数据库 CRUD 操作
  - `preload/index.ts` - 预加载脚本，通过 contextBridge 暴露安全的 API
- `src/` - Vue 渲染进程代码
  - `views/` - 页面组件
  - `components/` - 可复用组件
  - `stores/` - Pinia 状态管理
  - `router/` - Vue Router 路由配置
  - `main.ts` - Vue 应用入口

### 进程通信架构

- **主进程 → 渲染进程**: 通过 `ipcMain.handle()` 注册处理器
- **渲染进程 → 主进程**: 通过 `window.electronAPI` 调用（由 preload 脚本暴露）
- **安全模式**: 启用 `contextIsolation`，禁用 `nodeIntegration`

### 状态管理模式

使用 Pinia Setup Store 模式（Composition API 风格）：
- `useAppStore` - 应用全局状态（主题、版本信息、加载状态）
- `useUserStore` - 用户信息管理
- `useCounterStore` - 示例计数器 store

### 路由配置

- 使用 `createWebHashHistory()` 模式（Electron 应用推荐）
- 路由懒加载：所有页面组件使用动态导入
- 路由守卫：自动设置页面标题

### 路径别名

```typescript
@/      → src/
@main/  → electron/main/
@preload/ → electron/preload/
```

## 构建配置

- **开发环境**: Vite 开发服务器运行在 5173 端口，Electron 加载该 URL
- **生产环境**: 构建输出到 `dist/`（渲染进程）和 `dist-electron/`（主进程）
- **打包输出**: `release/${version}/` 目录

## 开发注意事项

- 主进程代码修改需要重启 `npm run dev`
- 渲染进程代码支持热更新
- 新增 IPC 通信需要同时修改 `electron/main/index.ts` 和 `electron/preload/index.ts`
- TypeScript 严格模式已启用

## 数据库架构

### 数据存储位置

- 数据库文件：`{userData}/data/chess-room.db`
- Windows: `C:\Users\{用户名}\AppData\Roaming\chess-room-manager\data\`
- macOS: `~/Library/Application Support/chess-room-manager/data/`
- Linux: `~/.config/chess-room-manager/data/`

### 数据表结构

1. **rooms** - 房间信息
   - 字段：id, name, type, hourly_rate, status, created_at, updated_at
   - 状态：available（空闲）、occupied（使用中）、maintenance（维护中）

2. **members** - 会员信息
   - 字段：id, name, phone, balance, points, level, created_at, updated_at
   - 等级：normal、silver、gold、platinum

3. **orders** - 订单信息
   - 字段：id, room_id, member_id, start_time, end_time, duration, amount, payment_method, status
   - 状态：ongoing（进行中）、completed（已完成）、cancelled（已取消）

4. **products** - 商品信息
   - 字段：id, name, category, price, stock, unit, status

5. **product_sales** - 商品销售记录
   - 字段：id, product_id, order_id, quantity, amount, created_at

6. **recharges** - 充值记录
   - 字段：id, member_id, amount, bonus, payment_method, created_at

### 数据库操作

- 所有数据库操作在主进程中执行（`electron/main/database/services.ts`）
- 渲染进程通过 `window.electronAPI.db.*` 调用数据库 API
- 使用事务确保数据一致性（如充值操作）
- 字段命名：数据库使用下划线命名，API 返回驼峰命名（自动转换）

### 添加新的数据库操作

1. 在 `electron/main/database/services.ts` 中添加服务函数
2. 在 `electron/main/index.ts` 中注册 IPC 处理器
3. 在 `electron/preload/index.ts` 中暴露 API 接口
4. 渲染进程通过 `window.electronAPI.db.*` 调用

