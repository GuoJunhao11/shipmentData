// server/routes/inventoryRoutes.js
const express = require("express");
const router = express.Router();
const inventoryController = require("../controllers/inventoryController");

// 获取所有库存异常记录
router.get("/", inventoryController.getAllInventoryExceptions);

// 获取单个库存异常记录
router.get("/:id", inventoryController.getInventoryExceptionById);

// 添加库存异常记录
router.post("/", inventoryController.createInventoryException);

// 更新库存异常记录
router.put("/:id", inventoryController.updateInventoryException);

// 删除库存异常记录
router.delete("/:id", inventoryController.deleteInventoryException);

module.exports = router;
