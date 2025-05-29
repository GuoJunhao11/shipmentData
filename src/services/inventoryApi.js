// src/services/inventoryApi.js
import axios from "axios";

// 使用相对路径，这样在同一服务上就能正常工作
const API_URL = "/api/inventory-exception";

// 加载库存异常记录数据
export const loadInventoryExceptions = async () => {
  try {
    const response = await axios.get(`${API_URL}`);
    return response.data;
  } catch (error) {
    console.error("加载库存异常记录失败:", error);
    return [];
  }
};

// 获取单个库存异常记录
export const getInventoryExceptionById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error("获取库存异常记录失败:", error);
    return null;
  }
};

// 添加新库存异常记录
export const addInventoryException = async (newData) => {
  try {
    const response = await axios.post(`${API_URL}`, newData);
    return response.data;
  } catch (error) {
    console.error("添加库存异常记录失败:", error);
    return null;
  }
};

// 更新库存异常记录
export const updateInventoryException = async (id, updatedData) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, updatedData);
    return response.data;
  } catch (error) {
    console.error("更新库存异常记录失败:", error);
    return null;
  }
};

// 删除库存异常记录
export const deleteInventoryException = async (id) => {
  try {
    await axios.delete(`${API_URL}/${id}`);
    return true;
  } catch (error) {
    console.error("删除库存异常记录失败:", error);
    return false;
  }
};
