const express = require("express");
const router = express.Router();
const expressController = require("../controllers/expressController");

// 获取所有快递数据
router.get("/", expressController.getAllExpressData);

// 获取单个快递数据
router.get("/:id", expressController.getExpressDataById);

// 添加快递数据
router.post("/", expressController.createExpressData);

// 更新快递数据
router.put("/:id", expressController.updateExpressData);

// 删除快递数据
router.delete("/:id", expressController.deleteExpressData);

module.exports = router;
