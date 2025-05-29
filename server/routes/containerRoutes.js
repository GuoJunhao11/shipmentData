// server/routes/containerRoutes.js
const express = require("express");
const router = express.Router();
const containerController = require("../controllers/containerController");

// 获取所有集装箱记录
router.get("/", containerController.getAllContainers);

// 获取单个集装箱记录
router.get("/:id", containerController.getContainerById);

// 添加集装箱记录
router.post("/", containerController.createContainer);

// 更新集装箱记录
router.put("/:id", containerController.updateContainer);

// 删除集装箱记录
router.delete("/:id", containerController.deleteContainer);

module.exports = router;
