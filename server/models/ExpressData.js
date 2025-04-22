const mongoose = require("mongoose");

const ExpressDataSchema = new mongoose.Schema({
  日期: {
    type: String,
    required: true,
    set: function (val) {
      // 将各种日期格式转换为 MM/DD/YYYY
      if (!val) return val;

      // 处理ISO格式日期 (2025-04-21T07:00:00.000Z)
      if (val && typeof val === "string" && val.includes("T")) {
        const date = new Date(val);
        return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(
          date.getDate()
        ).padStart(2, "0")}/${date.getFullYear()}`;
      }

      // 处理简单的 M/D 格式 (4/21)
      if (val && typeof val === "string" && val.includes("/")) {
        const parts = val.split("/");
        if (parts.length === 2) {
          const month = String(parseInt(parts[0])).padStart(2, "0");
          const day = String(parseInt(parts[1])).padStart(2, "0");
          const year = new Date().getFullYear();
          return `${month}/${day}/${year}`;
        }
        // 已经是 MM/DD/YYYY 格式
        if (parts.length === 3) {
          const month = String(parseInt(parts[0])).padStart(2, "0");
          const day = String(parseInt(parts[1])).padStart(2, "0");
          return `${month}/${day}/${parts[2]}`;
        }
      }

      return val;
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
