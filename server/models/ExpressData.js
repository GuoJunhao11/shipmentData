// server/models/ExpressData.js
const mongoose = require("mongoose");

const ExpressDataSchema = new mongoose.Schema({
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
  易仓系统总量: {
    type: Number,
    required: true,
  },
  新系统总量: {
    type: Number,
    required: true,
  },
  FedEx总数量: {
    type: Number,
    required: true,
  },
  UPS总数量: {
    type: Number,
    required: true,
  },
  FedEx中A008订单数: {
    type: Number,
    required: true,
  },
  UPS中A008订单数: {
    type: Number,
    required: true,
  },
  电池板数: {
    type: Number,
    required: true,
  },
  FedEx含库板数: {
    type: Number,
    required: true,
  },
  UPS含库板数: {
    type: Number,
    required: true,
  },
  完成时间: {
    type: String,
    required: true,
  },
  人数: {
    type: Number,
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

module.exports = mongoose.model("ExpressData", ExpressDataSchema);
