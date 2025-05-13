// server/models/ExceptionRecord.js
const mongoose = require("mongoose");

/**
 * 异常记录数据模型
 * - 日期: 格式化为 MM/DD/YYYY 的日期字符串
 * - 异常类型: 限定为 '无轨迹', '缺货', '错发' 三种类型
 * - 客户代码: 客户的唯一标识码
 * - 跟踪号码: 快递的跟踪号
 * - SKU: 商品的SKU编码
 * - 备注: 可选的备注信息
 * - createdAt: 记录创建时间
 */
const ExceptionRecordSchema = new mongoose.Schema({
  日期: {
    type: String,
    required: true,
    set: function (val) {
      // 标准化日期为 MM/DD/YYYY 格式
      if (!val) return val;

      try {
        // 处理ISO格式日期
        if (typeof val === "string" && val.includes("T")) {
          const date = new Date(val);
          const month = (date.getMonth() + 1).toString().padStart(2, "0");
          const day = date.getDate().toString().padStart(2, "0");
          const year = date.getFullYear();
          return `${month}/${day}/${year}`;
        }

        // 处理简单 M/D 格式
        if (typeof val === "string" && val.includes("/")) {
          const parts = val.split("/");
          if (parts.length === 2) {
            const month = parts[0].padStart(2, "0");
            const day = parts[1].padStart(2, "0");
            const year = new Date().getFullYear();
            return `${month}/${day}/${year}`;
          } else if (parts.length === 3) {
            // 已经是完整日期，但确保格式正确
            const month = parts[0].padStart(2, "0");
            const day = parts[1].padStart(2, "0");
            const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
            return `${month}/${day}/${year}`;
          }
        }
      } catch (e) {
        console.error("日期格式化错误:", e);
      }

      return val; // 如果无法处理，返回原值
    },
  },
  异常类型: {
    type: String,
    required: true,
    enum: ["无轨迹", "缺货", "错发"],
  },
  客户代码: {
    type: String,
    required: true,
  },
  跟踪号码: {
    type: String,
    required: true,
  },
  SKU: {
    type: String,
    required: true,
  },
  备注: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("ExceptionRecord", ExceptionRecordSchema);