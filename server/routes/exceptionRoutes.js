// server/routes/exceptionRoutes.js
const express = require("express");
const router = express.Router();
const exceptionController = require("../controllers/exceptionController");

// 获取所有异常记录
router.get("/", exceptionController.getAllExceptionRecords);

// 获取单个异常记录
router.get("/:id", exceptionController.getExceptionRecordById);

// 添加异常记录
router.post("/", exceptionController.createExceptionRecord);

// 更新异常记录
router.put("/:id", exceptionController.updateExceptionRecord);

// 删除异常记录
router.delete("/:id", exceptionController.deleteExceptionRecord);

// 获取异常统计数据
router.get("/stats/summary", exceptionController.getExceptionStats);

// 新增：获取异常分析数据
router.get("/stats/analysis", exceptionController.getExceptionAnalysis);

module.exports = router;