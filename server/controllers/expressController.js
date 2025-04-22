// server/controllers/expressController.js
const ExpressData = require("../models/ExpressData");

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

// 获取所有快递数据
exports.getAllExpressData = async (req, res) => {
  try {
    const expressData = await ExpressData.find().sort({ createdAt: -1 });
    res.json(expressData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 获取单个快递数据
exports.getExpressDataById = async (req, res) => {
  try {
    const expressData = await ExpressData.findById(req.params.id);
    if (!expressData) {
      return res.status(404).json({ message: "找不到此数据" });
    }
    res.json(expressData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 添加快递数据
exports.createExpressData = async (req, res) => {
  try {
    // 格式化日期
    const data = { ...req.body };
    if (data.日期) {
      data.日期 = formatDate(data.日期);
    }

    const newExpressData = new ExpressData(data);
    const savedData = await newExpressData.save();
    res.status(201).json(savedData);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 更新快递数据
exports.updateExpressData = async (req, res) => {
  try {
    // 格式化日期
    const data = { ...req.body };
    if (data.日期) {
      data.日期 = formatDate(data.日期);
    }

    const updatedData = await ExpressData.findByIdAndUpdate(
      req.params.id,
      data,
      { new: true, runValidators: true }
    );
    if (!updatedData) {
      return res.status(404).json({ message: "找不到此数据" });
    }
    res.json(updatedData);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 删除快递数据
exports.deleteExpressData = async (req, res) => {
  try {
    const expressData = await ExpressData.findByIdAndDelete(req.params.id);
    if (!expressData) {
      return res.status(404).json({ message: "找不到此数据" });
    }
    res.json({ message: "数据删除成功" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
