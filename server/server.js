const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
require("dotenv").config();

// 连接数据库
connectDB();

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 路由
app.use("/api/express", require("./routes/expressRoutes"));

// 服务器状态检查
app.get("/api/status", (req, res) => {
  res.json({ status: "online", message: "MongoDB服务器运行正常" });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => console.log(`服务器运行在端口: ${PORT}`));
console.log("环境变量 MONGODB_URI =", process.env.MONGODB_URI);