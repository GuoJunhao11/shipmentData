const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
require("dotenv").config();

// 连接数据库
connectDB();

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// API 路由
app.use("/api/express", require("./routes/expressRoutes"));
// 添加新的异常记录路由
app.use("/api/exception", require("./routes/exceptionRoutes"));

// 服务器状态检查
app.get("/api/status", (req, res) => {
  res.json({ status: "online", message: "MongoDB服务器运行正常" });
});

// 重要修改: 添加静态文件服务
// Serve static files from the React build
app.use(express.static(path.join(__dirname, "../build")));

// 重要修改: 处理所有其他请求，返回React应用的index.html
// Handle React routing, return all requests to React app
app.get("*", function (req, res) {
  if (!req.path.startsWith("/api")) {
    res.sendFile(path.join(__dirname, "../build", "index.html"));
  }
});

// 重要修改: 使用Render提供的PORT环境变量
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => console.log(`服务器运行在端口: ${PORT}`));
console.log("环境变量 MONGODB_URI =", process.env.MONGODB_URI);