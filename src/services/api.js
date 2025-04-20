import axios from "axios";

const API_URL = "http://localhost:5000/api";

// 加载数据
export const loadExpressData = async () => {
  try {
    const response = await axios.get(`${API_URL}/express`);
    return response.data;
  } catch (error) {
    console.error("加载数据失败:", error);
    return [];
  }
};

// 获取单个数据
export const getExpressDataById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/express/${id}`);
    return response.data;
  } catch (error) {
    console.error("获取数据失败:", error);
    return null;
  }
};

// 添加新数据
export const addExpressData = async (newData) => {
  try {
    const response = await axios.post(`${API_URL}/express`, newData);
    return response.data;
  } catch (error) {
    console.error("添加数据失败:", error);
    return null;
  }
};

// 更新数据
export const updateExpressData = async (id, updatedData) => {
  try {
    const response = await axios.put(`${API_URL}/express/${id}`, updatedData);
    return response.data;
  } catch (error) {
    console.error("更新数据失败:", error);
    return null;
  }
};

// 删除数据
export const deleteExpressData = async (id) => {
  try {
    await axios.delete(`${API_URL}/express/${id}`);
    return true;
  } catch (error) {
    console.error("删除数据失败:", error);
    return false;
  }
};

// 检查服务器状态
export const checkServerStatus = async () => {
  try {
    const response = await axios.get(`${API_URL}/status`);
    return response.data;
  } catch (error) {
    console.error("服务器连接失败:", error);
    return { status: "offline", message: "无法连接到服务器" };
  }
};
