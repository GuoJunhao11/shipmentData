// src/services/exceptionApi.js
import axios from "axios";

// 使用相对路径，这样在同一服务上就能正常工作
const API_URL = "/api/exception";

// 加载异常记录数据
export const loadExceptionRecords = async () => {
  try {
    const response = await axios.get(`${API_URL}`);
    return response.data;
  } catch (error) {
    console.error("加载异常记录失败:", error);
    return [];
  }
};

// 获取单个异常记录
export const getExceptionRecordById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error("获取异常记录失败:", error);
    return null;
  }
};

// 添加新异常记录
export const addExceptionRecord = async (newData) => {
  try {
    const response = await axios.post(`${API_URL}`, newData);
    return response.data;
  } catch (error) {
    console.error("添加异常记录失败:", error);
    return null;
  }
};

// 更新异常记录
export const updateExceptionRecord = async (id, updatedData) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, updatedData);
    return response.data;
  } catch (error) {
    console.error("更新异常记录失败:", error);
    return null;
  }
};

// 删除异常记录
export const deleteExceptionRecord = async (id) => {
  try {
    await axios.delete(`${API_URL}/${id}`);
    return true;
  } catch (error) {
    console.error("删除异常记录失败:", error);
    return false;
  }
};

// 获取异常统计数据
export const getExceptionStats = async () => {
  try {
    const response = await axios.get(`${API_URL}/stats/summary`);
    return response.data;
  } catch (error) {
    console.error("获取异常统计数据失败:", error);
    return {
      totalExceptions: 0,
      exceptionRate: "0.0",
      noTracking: { count: 0, percentage: "0.0" },
      outOfStock: { count: 0, percentage: "0.0" },
      wrongShipment: { count: 0, percentage: "0.0" }
    };
  }
};