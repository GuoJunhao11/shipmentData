const mongoose = require("mongoose");
require("dotenv").config({ path: "../../.env" }); // 确保能找到环境变量文件

const connectDB = async () => {
  try {
    // 移除不再需要的选项
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB 连接成功: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB 连接失败: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
