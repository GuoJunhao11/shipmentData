// server/controllers/inventoryController.js
const InventoryException = require("../models/InventoryException");

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

// 获取所有库存异常记录
exports.getAllInventoryExceptions = async (req, res) => {
  try {
    const inventoryExceptions = await InventoryException.find().sort({
      createdAt: -1,
    });
    res.json(inventoryExceptions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 获取单个库存异常记录
exports.getInventoryExceptionById = async (req, res) => {
  try {
    const inventoryException = await InventoryException.findById(req.params.id);
    if (!inventoryException) {
      return res.status(404).json({ message: "找不到此库存异常记录" });
    }
    res.json(inventoryException);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 添加库存异常记录
exports.createInventoryException = async (req, res) => {
  try {
    // 格式化日期
    const data = { ...req.body };
    if (data.日期) {
      data.日期 = formatDate(data.日期);
    }

    const newInventoryException = new InventoryException(data);
    const savedRecord = await newInventoryException.save();
    res.status(201).json(savedRecord);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 更新库存异常记录
exports.updateInventoryException = async (req, res) => {
  try {
    // 格式化日期
    const data = { ...req.body };
    if (data.日期) {
      data.日期 = formatDate(data.日期);
    }

    const updatedRecord = await InventoryException.findByIdAndUpdate(
      req.params.id,
      data,
      { new: true, runValidators: true }
    );
    if (!updatedRecord) {
      return res.status(404).json({ message: "找不到此库存异常记录" });
    }
    res.json(updatedRecord);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 删除库存异常记录
exports.deleteInventoryException = async (req, res) => {
  try {
    const inventoryException = await InventoryException.findByIdAndDelete(
      req.params.id
    );
    if (!inventoryException) {
      return res.status(404).json({ message: "找不到此库存异常记录" });
    }
    res.json({ message: "库存异常记录删除成功" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
