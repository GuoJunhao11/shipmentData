const mongoose = require("mongoose");

const ExpressDataSchema = new mongoose.Schema({
  日期: {
    type: String,
    required: true,
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
