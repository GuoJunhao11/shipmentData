// src/hooks/useContainerData.js
import { useState, useEffect, useCallback } from "react";
import {
  loadContainers,
  addContainer,
  updateContainer,
  deleteContainer,
} from "../services/containerApi";
import { checkServerStatus } from "../services/api";
import { message } from "antd";

export const useContainerData = () => {
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

  // 加载集装箱记录数据
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const isServerOnline = await checkStatus();
      if (!isServerOnline) {
        setError("服务器连接失败，请检查MongoDB服务是否运行");
        setLoading(false);
        return;
      }

      const containerData = await loadContainers();
      setData(containerData);
      setError(null);
    } catch (err) {
      setError("加载集装箱记录失败：" + err.message);
      message.error("加载集装箱记录失败");
    } finally {
      setLoading(false);
    }
  }, [checkStatus]);

  // 添加集装箱记录
  const addData = useCallback(async (newData) => {
    setLoading(true);
    try {
      const result = await addContainer(newData);
      if (result) {
        setData((prevData) => [result, ...prevData]);
        message.success("添加集装箱记录成功");
        return true;
      }
      return false;
    } catch (err) {
      setError("添加集装箱记录失败：" + err.message);
      message.error("添加集装箱记录失败");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // 更新集装箱记录
  const updateData = useCallback(async (id, updatedData) => {
    setLoading(true);
    try {
      const result = await updateContainer(id, updatedData);
      if (result) {
        setData((prevData) =>
          prevData.map((item) => (item._id === id ? result : item))
        );
        message.success("更新集装箱记录成功");
        return true;
      }
      return false;
    } catch (err) {
      setError("更新集装箱记录失败：" + err.message);
      message.error("更新集装箱记录失败");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // 删除集装箱记录
  const removeData = useCallback(async (id) => {
    setLoading(true);
    try {
      const success = await deleteContainer(id);
      if (success) {
        setData((prevData) => prevData.filter((item) => item._id !== id));
        message.success("删除集装箱记录成功");
        return true;
      }
      return false;
    } catch (err) {
      setError("删除集装箱记录失败：" + err.message);
      message.error("删除集装箱记录失败");
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
