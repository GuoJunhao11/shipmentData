# 快递数据分析系统

这是一个用于分析快递数据的 React 应用程序，使用 MongoDB 作为数据库。

## 功能特点

- 快递数据的 CRUD 操作
- 数据可视化和分析
- MongoDB 数据持久化
- 管理员数据输入界面

## 技术栈

- 前端: React, Ant Design, ECharts
- 后端: Express, Node.js
- 数据库: MongoDB

## 安装指南

### 前提条件

- Node.js (v14+)
- MongoDB (v4+)

### 安装 MongoDB

#### Windows

1. 从 [MongoDB 官网](https://www.mongodb.com/try/download/community) 下载并安装 MongoDB Community Server
2. 安装时选择"Complete"安装方式，并选择"Install MongoDB as a Service"
3. 安装完成后，MongoDB 服务应已自动启动

#### macOS

1. 使用 Homebrew 安装:
   ```
   brew tap mongodb/brew
   brew install mongodb-community
   ```
2. 启动服务:
   ```
   brew services start mongodb-community
   ```

#### Linux (Ubuntu)

1. 导入 MongoDB 公钥:
   ```
   wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | sudo apt-key add -
   ```
2. 创建列表文件:
   ```
   echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/4.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.4.list
   ```
3. 更新软件包列表:
   ```
   sudo apt-get update
   ```
4. 安装 MongoDB:
   ```
   sudo apt-get install -y mongodb-org
   ```
5. 启动服务:
   ```
   sudo systemctl start mongod
   ```

### 安装和运行应用

1. 克隆项目:

   ```
   git clone <仓库URL>
   cd 快递
   ```

2. 安装依赖:

   ```
   npm install
   ```

3. 修改 MongoDB 连接信息:
   打开 `.env` 文件，根据您的 MongoDB 配置修改 `MONGODB_URI` 变量。
   默认连接字符串是:

   ```
   MONGODB_URI=mongodb://localhost:27017/courier_db
   ```

4. 启动应用:

   ```
   npm run dev
   ```

   这将同时启动前端和后端服务。

5. 访问应用:
   浏览器打开 [http://localhost:3000](http://localhost:3000)

## 数据管理

系统没有预设数据，所有数据需要由管理员通过系统界面手动输入。

## API 端点

- `GET /api/express` - 获取所有快递数据
- `GET /api/express/:id` - 获取单个快递数据
- `POST /api/express` - 创建新的快递数据
- `PUT /api/express/:id` - 更新快递数据
- `DELETE /api/express/:id` - 删除快递数据
- `GET /api/status` - 检查服务器状态

## MongoDB 数据模型

快递数据的 MongoDB 模型包含以下字段:

- 日期 (String): 快递处理日期
- 易仓系统总量 (Number): 易仓系统的总订单数
- 新系统总量 (Number): 新系统的总订单数
- FedEx 总数量 (Number): FedEx 的总订单数
- UPS 总数量 (Number): UPS 的总订单数
- FedEx 中 A008 订单数 (Number): FedEx 中 A008 类型的订单数
- UPS 中 A008 订单数 (Number): UPS 中 A008 类型的订单数
- 电池板数 (Number): 电池类型的板数
- FedEx 含库板数 (Number): FedEx 中含库板的数量
- UPS 含库板数 (Number): UPS 中含库板的数量
- 完成时间 (String): 任务完成时间
- 人数 (Number): 处理任务的人数
- 备注 (String, 可选): 额外备注信息
- createdAt (Date): 记录创建时间

## 故障排除

- **无法连接到 MongoDB**:

  - 检查 MongoDB 服务是否运行
  - 验证`.env`文件中的连接字符串是否正确
  - 确保防火墙未阻止 MongoDB 端口(默认 27017)

- **数据加载问题**:
  - 检查网络连接
  - 查看浏览器控制台是否有错误
  - 确认 API 服务器正在运行

## 许可证

[MIT](LICENSE)
