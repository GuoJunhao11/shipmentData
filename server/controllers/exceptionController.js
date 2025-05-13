// server/controllers/exceptionController.js
const ExceptionRecord = require("../models/ExceptionRecord");

// 日期格式化函数 - 标准化为 MM/DD/YYYY
const formatDate = (dateStr) => {
  if (!dateStr) return dateStr;

  try {
    // 处理ISO格式日期
    if (typeof dateStr === "string" && dateStr.includes("T")) {
      const date = new Date(dateStr);
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      const year = date.getFullYear();
      return `${month}/${day}/${year}`;
    }

    // 处理简单 M/D 格式
    if (typeof dateStr === "string" && dateStr.includes("/")) {
      const parts = dateStr.split("/");
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

  return dateStr; // 如果无法处理，返回原值
};

// 获取所有异常记录
exports.getAllExceptionRecords = async (req, res) => {
  try {
    const exceptionRecords = await ExceptionRecord.find().sort({ createdAt: -1 });
    res.json(exceptionRecords);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 获取单个异常记录
exports.getExceptionRecordById = async (req, res) => {
  try {
    const exceptionRecord = await ExceptionRecord.findById(req.params.id);
    if (!exceptionRecord) {
      return res.status(404).json({ message: "找不到此异常记录" });
    }
    res.json(exceptionRecord);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 添加异常记录
exports.createExceptionRecord = async (req, res) => {
  try {
    // 格式化日期
    const data = { ...req.body };
    if (data.日期) {
      data.日期 = formatDate(data.日期);
    }

    const newExceptionRecord = new ExceptionRecord(data);
    const savedRecord = await newExceptionRecord.save();
    res.status(201).json(savedRecord);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 更新异常记录
exports.updateExceptionRecord = async (req, res) => {
  try {
    // 格式化日期
    const data = { ...req.body };
    if (data.日期) {
      data.日期 = formatDate(data.日期);
    }

    const updatedRecord = await ExceptionRecord.findByIdAndUpdate(
      req.params.id,
      data,
      { new: true, runValidators: true }
    );
    if (!updatedRecord) {
      return res.status(404).json({ message: "找不到此异常记录" });
    }
    res.json(updatedRecord);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 删除异常记录
exports.deleteExceptionRecord = async (req, res) => {
  try {
    const exceptionRecord = await ExceptionRecord.findByIdAndDelete(req.params.id);
    if (!exceptionRecord) {
      return res.status(404).json({ message: "找不到此异常记录" });
    }
    res.json({ message: "异常记录删除成功" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 获取异常统计数据
exports.getExceptionStats = async (req, res) => {
  try {
    // 获取总订单数（从快递数据中获取）
    const ExpressData = require("../models/ExpressData");
    const expressData = await ExpressData.find();
    const totalOrders = expressData.reduce(
      (sum, item) => sum + ((item.FedEx总数量 || 0) + (item.UPS总数量 || 0)),
      0
    );

    // 获取异常记录总数及各类型异常数
    const totalExceptions = await ExceptionRecord.countDocuments();
    const noTrackingCount = await ExceptionRecord.countDocuments({ 异常类型: "无轨迹" });
    const outOfStockCount = await ExceptionRecord.countDocuments({ 异常类型: "缺货" });
    const wrongShipmentCount = await ExceptionRecord.countDocuments({ 异常类型: "错发" });

    // 计算异常率
    const exceptionRate = totalOrders > 0 ? (totalExceptions / totalOrders) * 100 : 0;

    // 计算各类型异常占比
    const noTrackingPercentage = totalExceptions > 0 ? (noTrackingCount / totalExceptions) * 100 : 0;
    const outOfStockPercentage = totalExceptions > 0 ? (outOfStockCount / totalExceptions) * 100 : 0;
    const wrongShipmentPercentage = totalExceptions > 0 ? (wrongShipmentCount / totalExceptions) * 100 : 0;

    res.json({
      totalOrders,
      totalExceptions,
      exceptionRate: exceptionRate.toFixed(1),
      noTracking: {
        count: noTrackingCount,
        percentage: noTrackingPercentage.toFixed(1)
      },
      outOfStock: {
        count: outOfStockCount,
        percentage: outOfStockPercentage.toFixed(1)
      },
      wrongShipment: {
        count: wrongShipmentCount,
        percentage: wrongShipmentPercentage.toFixed(1)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};