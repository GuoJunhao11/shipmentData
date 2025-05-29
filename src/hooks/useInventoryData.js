// src/hooks/useInventoryData.js
import { useState, useEffect, useCallback } from "react";
import {
  loadInventoryExceptions,
  addInventoryException,
  updateInventoryException,
  deleteInventoryException,
} from "../services/inventoryApi";
import { checkServerStatus } from "../services/api";
import { message } from "antd";

export const useInventoryData = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [serverStatus, setServerStatus] = useState({
    status: "unknown",
    message: "检查服务器状态中...",
  });

  // 检查服务器状态
  const checkStatus = useCallback(async () => {
    try {
      const status = await checkServerStatus();
      setServerStatus(status);
      return status.status === "online";
    } catch (err) {
      setServerStatus({ status: "offline", message: "服务器连接失败" });
      return false;
    }
  }, []);

  // 加载库存异常记录数据
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const isServerOnline = await checkStatus();
      if (!isServerOnline) {
        setError("服务器连接失败，请检查MongoDB服务是否运行");
        setLoading(false);
        return;
      }

      const inventoryData = await loadInventoryExceptions();
      setData(inventoryData);
      setError(null);
    } catch (err) {
      setError("加载库存异常记录失败：" + err.message);
      message.error("加载库存异常记录失败");
    } finally {
      setLoading(false);
    }
  }, [checkStatus]);

  // 添加库存异常记录
  const addData = useCallback(async (newData) => {
    setLoading(true);
    try {
      const result = await addInventoryException(newData);
      if (result) {
        setData((prevData) => [result, ...prevData]);
        message.success("添加库存异常记录成功");
        return true;
      }
      return false;
    } catch (err) {
      setError("添加库存异常记录失败：" + err.message);
      message.error("添加库存异常记录失败");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // 更新库存异常记录
  const updateData = useCallback(async (id, updatedData) => {
    setLoading(true);
    try {
      const result = await updateInventoryException(id, updatedData);
      if (result) {
        setData((prevData) =>
          prevData.map((item) => (item._id === id ? result : item))
        );
        message.success("更新库存异常记录成功");
        return true;
      }
      return false;
    } catch (err) {
      setError("更新库存异常记录失败：" + err.message);
      message.error("更新库存异常记录失败");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // 删除库存异常记录
  const removeData = useCallback(async (id) => {
    setLoading(true);
    try {
      const success = await deleteInventoryException(id);
      if (success) {
        setData((prevData) => prevData.filter((item) => item._id !== id));
        message.success("删除库存异常记录成功");
        return true;
      }
      return false;
    } catch (err) {
      setError("删除库存异常记录失败：" + err.message);
      message.error("删除库存异常记录失败");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始加载
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    serverStatus,
    fetchData,
    addData,
    updateData,
    removeData,
    checkStatus,
  };
};
