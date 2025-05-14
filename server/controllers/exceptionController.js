// server/controllers/exceptionController.js
const ExceptionRecord = require("../models/ExceptionRecord");
const moment = require("moment");

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

// 解析日期从 MM/DD/YYYY 格式
const parseDate = (dateStr) => {
  if (!dateStr) return null;
  
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    // MM/DD/YYYY 格式
    return new Date(parts[2], parts[0] - 1, parts[1]);
  }
  return null;
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

// 获取异常统计数据(修改版)
exports.getExceptionStats = async (req, res) => {
  try {
    // 获取当前日期
    const now = new Date();
    
    // 当月的开始和结束
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    
    // 上个月的开始和结束
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // 格式化为 MM/DD/YYYY 格式的字符串，便于查询
    const currentMonthStartStr = `${(currentMonthStart.getMonth() + 1).toString().padStart(2, "0")}/${currentMonthStart.getDate().toString().padStart(2, "0")}/${currentMonthStart.getFullYear()}`;
    const currentMonthEndStr = `${(currentMonthEnd.getMonth() + 1).toString().padStart(2, "0")}/${currentMonthEnd.getDate().toString().padStart(2, "0")}/${currentMonthEnd.getFullYear()}`;
    
    const lastMonthStartStr = `${(lastMonthStart.getMonth() + 1).toString().padStart(2, "0")}/${lastMonthStart.getDate().toString().padStart(2, "0")}/${lastMonthStart.getFullYear()}`;
    const lastMonthEndStr = `${(lastMonthEnd.getMonth() + 1).toString().padStart(2, "0")}/${lastMonthEnd.getDate().toString().padStart(2, "0")}/${lastMonthEnd.getFullYear()}`;

    // 获取总订单数（从快递数据中获取）
    const ExpressData = require("../models/ExpressData");
    
    // 获取所有快递数据
    const expressData = await ExpressData.find();
    
    // 过滤当月和上月的快递数据
    const currentMonthExpressData = expressData.filter(item => {
      const date = parseDate(item.日期);
      return date && date >= currentMonthStart && date <= currentMonthEnd;
    });
    
    const lastMonthExpressData = expressData.filter(item => {
      const date = parseDate(item.日期);
      return date && date >= lastMonthStart && date <= lastMonthEnd;
    });
    
    // 计算总订单数
    const currentMonthTotalOrders = currentMonthExpressData.reduce(
      (sum, item) => sum + ((item.FedEx总数量 || 0) + (item.UPS总数量 || 0)),
      0
    );
    
    const lastMonthTotalOrders = lastMonthExpressData.reduce(
      (sum, item) => sum + ((item.FedEx总数量 || 0) + (item.UPS总数量 || 0)),
      0
    );

    // 获取所有异常记录
    const allExceptionRecords = await ExceptionRecord.find();
    
    // 过滤当月和上月的异常记录
    const currentMonthExceptions = allExceptionRecords.filter(item => {
      const date = parseDate(item.日期);
      return date && date >= currentMonthStart && date <= currentMonthEnd;
    });
    
    const lastMonthExceptions = allExceptionRecords.filter(item => {
      const date = parseDate(item.日期);
      return date && date >= lastMonthStart && date <= lastMonthEnd;
    });
    
    // 计算当月各类型异常数量
    const currentMonthTotal = currentMonthExceptions.length;
    const currentNoTracking = currentMonthExceptions.filter(item => item.异常类型 === "无轨迹").length;
    const currentOutOfStock = currentMonthExceptions.filter(item => item.异常类型 === "缺货").length;
    const currentWrongShipment = currentMonthExceptions.filter(item => item.异常类型 === "错发").length;
    
    // 计算上月各类型异常数量
    const lastMonthTotal = lastMonthExceptions.length;
    const lastNoTracking = lastMonthExceptions.filter(item => item.异常类型 === "无轨迹").length;
    const lastOutOfStock = lastMonthExceptions.filter(item => item.异常类型 === "缺货").length;
    const lastWrongShipment = lastMonthExceptions.filter(item => item.异常类型 === "错发").length;
    
    // 计算同比变化率
    const totalChangeRate = lastMonthTotal === 0 ? 100 : ((currentMonthTotal - lastMonthTotal) / lastMonthTotal * 100);
    const noTrackingChangeRate = lastNoTracking === 0 ? 100 : ((currentNoTracking - lastNoTracking) / lastNoTracking * 100);
    const outOfStockChangeRate = lastOutOfStock === 0 ? 100 : ((currentOutOfStock - lastOutOfStock) / lastOutOfStock * 100);
    const wrongShipmentChangeRate = lastWrongShipment === 0 ? 100 : ((currentWrongShipment - lastWrongShipment) / lastWrongShipment * 100);
    
    // 计算异常率
    const currentMonthExceptionRate = currentMonthTotalOrders > 0 ? (currentMonthTotal / currentMonthTotalOrders * 100) : 0;
    const lastMonthExceptionRate = lastMonthTotalOrders > 0 ? (lastMonthTotal / lastMonthTotalOrders * 100) : 0;
    
    // 计算历史平均每月异常数
    const monthlyAverageExceptions = await calculateMonthlyAverageExceptions();

    res.json({
      currentMonth: {
        totalExceptions: currentMonthTotal,
        exceptionRate: currentMonthExceptionRate.toFixed(1),
        noTracking: currentNoTracking,
        outOfStock: currentOutOfStock,
        wrongShipment: currentWrongShipment,
      },
      lastMonth: {
        totalExceptions: lastMonthTotal,
        exceptionRate: lastMonthExceptionRate.toFixed(1),
        noTracking: lastNoTracking,
        outOfStock: lastOutOfStock,
        wrongShipment: lastWrongShipment,
      },
      changeRate: {
        total: totalChangeRate.toFixed(1),
        noTracking: noTrackingChangeRate.toFixed(1),
        outOfStock: outOfStockChangeRate.toFixed(1),
        wrongShipment: wrongShipmentChangeRate.toFixed(1),
      },
      monthlyAverage: monthlyAverageExceptions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 计算历史平均每月异常数量
async function calculateMonthlyAverageExceptions() {
  try {
    const allExceptions = await ExceptionRecord.find();
    
    if (allExceptions.length === 0) {
      return 0;
    }
    
    // 获取最早和最晚的异常记录日期
    const dates = allExceptions
      .map(exception => parseDate(exception.日期))
      .filter(date => date !== null);
    
    if (dates.length === 0) {
      return 0;
    }
    
    const earliestDate = new Date(Math.min.apply(null, dates));
    const latestDate = new Date(Math.max.apply(null, dates));
    
    // 计算月数差
    const monthsDiff = (latestDate.getFullYear() - earliestDate.getFullYear()) * 12 + 
                       (latestDate.getMonth() - earliestDate.getMonth()) + 1;
    
    // 如果数据少于一个月，返回总数
    if (monthsDiff <= 1) {
      return allExceptions.length;
    }
    
    return (allExceptions.length / monthsDiff).toFixed(1);
  } catch (error) {
    console.error("计算平均每月异常数量失败:", error);
    return 0;
  }
}

// 获取异常统计分析
exports.getExceptionAnalysis = async (req, res) => {
  try {
    const exceptionRecords = await ExceptionRecord.find();
    
    // SKU异常频率统计
    const skuFrequency = {};
    exceptionRecords.forEach(record => {
      if (record.SKU) {
        skuFrequency[record.SKU] = (skuFrequency[record.SKU] || 0) + 1;
      }
    });
    
    // 按出现频率排序
    const sortedSkuFrequency = Object.entries(skuFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)  // 取前10个出现频率最高的SKU
      .map(([sku, count]) => ({ sku, count }));
    
    // 统计快递公司异常情况
    let fedexCount = 0;
    let upsCount = 0;
    let unknownCount = 0;
    
    exceptionRecords.forEach(record => {
      const trackingNumber = record.跟踪号码 || '';
      if (trackingNumber.startsWith('1Z') || /^[A-Z0-9]{18}$/.test(trackingNumber)) {
        upsCount++;
      } else if (/^\d{12}$/.test(trackingNumber) || /^\d{15}$/.test(trackingNumber)) {
        fedexCount++;
      } else {
        unknownCount++;
      }
    });
    
    // 异常类型统计
    const typeCount = {
      无轨迹: exceptionRecords.filter(r => r.异常类型 === '无轨迹').length,
      缺货: exceptionRecords.filter(r => r.异常类型 === '缺货').length,
      错发: exceptionRecords.filter(r => r.异常类型 === '错发').length
    };
    
    // 按日期分组的异常统计
    const dailyStats = {};
    exceptionRecords.forEach(record => {
      if (record.日期) {
        if (!dailyStats[record.日期]) {
          dailyStats[record.日期] = {
            total: 0,
            无轨迹: 0,
            缺货: 0,
            错发: 0
          };
        }
        dailyStats[record.日期].total++;
        dailyStats[record.日期][record.异常类型]++;
      }
    });
    
    // 按日期排序
    const sortedDailyStats = Object.entries(dailyStats)
      .sort((a, b) => {
        const dateA = parseDate(a[0]);
        const dateB = parseDate(b[0]);
        return dateB - dateA;  // 降序排列
      })
      .slice(0, 30)  // 只返回最近30天
      .reduce((acc, [date, stats]) => {
        acc[date] = stats;
        return acc;
      }, {});
    
    res.json({
      topSKUs: sortedSkuFrequency,
      courierStats: {
        fedex: fedexCount,
        ups: upsCount,
        unknown: unknownCount
      },
      typeStats: typeCount,
      dailyStats: sortedDailyStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};