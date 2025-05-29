// server/models/Container.js
const mongoose = require("mongoose");

/**
 * 集装箱/托盘到柜记录数据模型
 * - 日期: 格式化为 MM/DD/YYYY 的日期字符串
 * - 柜号: 集装箱/托盘编号
 * - 类型: 限定为 '整柜', '散货', '托盘' 三种类型
 * - 客户代码: 客户的唯一标识码
 * - 到达时间: 到达时间（可选）
 * - 状态: 限定为 '已完成', '待拆柜', '待核实', '有问题' 四种状态
 * - 问题: 问题描述（必填）
 * - createdAt: 记录创建时间
 */
const ContainerSchema = new mongoose.Schema({
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
  柜号: {
    type: String,
    required: true,
  },
  类型: {
    type: String,
    required: true,
    enum: ["整柜", "散货", "托盘"],
  },
  客户代码: {
    type: String,
    required: true,
  },
  到达时间: {
    type: String,
    required: false, // 改为可选
    default: "",
  },
  状态: {
    type: String,
    required: true,
    enum: ["已完成", "待拆柜", "待核实", "有问题"],
  },
  问题: {
    type: String,
    required: true, // 改为必填
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Container", ContainerSchema);