const ExpressData = require("../models/ExpressData");

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

// a添加快递数据
exports.createExpressData = async (req, res) => {
  try {
    const newExpressData = new ExpressData(req.body);
    const savedData = await newExpressData.save();
    res.status(201).json(savedData);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 更新快递数据
exports.updateExpressData = async (req, res) => {
  try {
    const updatedData = await ExpressData.findByIdAndUpdate(
      req.params.id,
      req.body,
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
