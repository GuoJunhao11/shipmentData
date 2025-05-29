// server/controllers/containerController.js
const Container = require("../models/Container");

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

// 时间格式化函数 - 标准化为 HH:mm
const formatTime = (timeStr) => {
  if (!timeStr) return timeStr;

  try {
    const timeString = timeStr.toString().trim();

    // 如果是简单数字格式如 "12" 或 "15"
    if (/^\d{1,2}$/.test(timeString)) {
      const hour = parseInt(timeString);
      if (hour >= 0 && hour <= 23) {
        return `${hour.toString().padStart(2, "0")}:00`;
      }
    }

    // 如果是 "12:30" 格式
    if (/^\d{1,2}:\d{2}$/.test(timeString)) {
      const parts = timeString.split(":");
      const hour = parseInt(parts[0]);
      const minute = parseInt(parts[1]);
      if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
        return `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`;
      }
    }

    // 如果已经是 HH:mm 格式
    if (/^\d{2}:\d{2}$/.test(timeString)) {
      return timeString;
    }
  } catch (e) {
    console.error("时间格式化错误:", e);
  }

  return timeStr; // 如果无法处理，返回原值
};

// 获取所有集装箱记录
exports.getAllContainers = async (req, res) => {
  try {
    const containers = await Container.find().sort({ createdAt: -1 });
    res.json(containers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 获取单个集装箱记录
exports.getContainerById = async (req, res) => {
  try {
    const container = await Container.findById(req.params.id);
    if (!container) {
      return res.status(404).json({ message: "找不到此集装箱记录" });
    }
    res.json(container);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 添加集装箱记录
exports.createContainer = async (req, res) => {
  try {
    // 格式化日期和时间
    const data = { ...req.body };
    if (data.日期) {
      data.日期 = formatDate(data.日期);
    }
    if (data.到达时间) {
      data.到达时间 = formatTime(data.到达时间);
    }

    const newContainer = new Container(data);
    const savedRecord = await newContainer.save();
    res.status(201).json(savedRecord);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 更新集装箱记录
exports.updateContainer = async (req, res) => {
  try {
    // 格式化日期和时间
    const data = { ...req.body };
    if (data.日期) {
      data.日期 = formatDate(data.日期);
    }
    if (data.到达时间) {
      data.到达时间 = formatTime(data.到达时间);
    }

    const updatedRecord = await Container.findByIdAndUpdate(
      req.params.id,
      data,
      { new: true, runValidators: true }
    );
    if (!updatedRecord) {
      return res.status(404).json({ message: "找不到此集装箱记录" });
    }
    res.json(updatedRecord);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 删除集装箱记录
exports.deleteContainer = async (req, res) => {
  try {
    const container = await Container.findByIdAndDelete(req.params.id);
    if (!container) {
      return res.status(404).json({ message: "找不到此集装箱记录" });
    }
    res.json({ message: "集装箱记录删除成功" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
