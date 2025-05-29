// src/services/containerApi.js
import axios from "axios";

// 使用相对路径，这样在同一服务上就能正常工作
const API_URL = "/api/container";

// 加载集装箱记录数据
export const loadContainers = async () => {
  try {
    const response = await axios.get(`${API_URL}`);
    return response.data;
  } catch (error) {
    console.error("加载集装箱记录失败:", error);
    return [];
  }
};

// 获取单个集装箱记录
export const getContainerById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error("获取集装箱记录失败:", error);
    return null;
  }
};

// 添加新集装箱记录
export const addContainer = async (newData) => {
  try {
    const response = await axios.post(`${API_URL}`, newData);
    return response.data;
  } catch (error) {
    console.error("添加集装箱记录失败:", error);
    return null;
  }
};

// 更新集装箱记录
export const updateContainer = async (id, updatedData) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, updatedData);
    return response.data;
  } catch (error) {
    console.error("更新集装箱记录失败:", error);
    return null;
  }
};

// 删除集装箱记录
export const deleteContainer = async (id) => {
  try {
    await axios.delete(`${API_URL}/${id}`);
    return true;
  } catch (error) {
    console.error("删除集装箱记录失败:", error);
    return false;
  }
};
