// src/hooks/useExceptionData.js
import { useState, useEffect, useCallback } from "react";
import {
  loadExceptionRecords,
  addExceptionRecord,
  updateExceptionRecord,
  deleteExceptionRecord,
  getExceptionStats,
  getExceptionAnalysis
} from "../services/exceptionApi";
import { checkServerStatus } from "../services/api";
import { message } from "antd";

export const useExceptionData = () => {
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({
    currentMonth: {
      totalExceptions: 0,
      exceptionRate: "0.0",
      noTracking: 0,
      outOfStock: 0,
      wrongShipment: 0,
    },
    lastMonth: {
      totalExceptions: 0,
      exceptionRate: "0.0",
      noTracking: 0,
      outOfStock: 0,
      wrongShipment: 0,
    },
    changeRate: {
      total: "0.0",
      noTracking: "0.0",
      outOfStock: "0.0",
      wrongShipment: "0.0",
    },
    monthlyAverage: "0.0"
  });
  const [analysis, setAnalysis] = useState({
    topSKUs: [],
    courierStats: { fedex: 0, ups: 0, unknown: 0 },
    typeStats: { 无轨迹: 0, 缺货: 0, 错发: 0 },
    dailyStats: {}
  });
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
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

  // 加载异常记录数据
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const isServerOnline = await checkStatus();
      if (!isServerOnline) {
        setError("服务器连接失败，请检查MongoDB服务是否运行");
        setLoading(false);
        return;
      }

      const exceptionData = await loadExceptionRecords();
      setData(exceptionData);
      setError(null);
    } catch (err) {
      setError("加载异常记录失败：" + err.message);
      message.error("加载异常记录失败");
    } finally {
      setLoading(false);
    }
  }, [checkStatus]);

  // 加载异常统计数据
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const isServerOnline = await checkStatus();
      if (!isServerOnline) {
        setStatsLoading(false);
        return;
      }

      const statsData = await getExceptionStats();
      setStats(statsData);
    } catch (err) {
      console.error("加载异常统计数据失败：", err.message);
    } finally {
      setStatsLoading(false);
    }
  }, [checkStatus]);

  // 加载异常分析数据
  const fetchAnalysis = useCallback(async () => {
    setAnalysisLoading(true);
    try {
      const isServerOnline = await checkStatus();
      if (!isServerOnline) {
        setAnalysisLoading(false);
        return;
      }

      const analysisData = await getExceptionAnalysis();
      setAnalysis(analysisData);
    } catch (err) {
      console.error("加载异常分析数据失败：", err.message);
    } finally {
      setAnalysisLoading(false);
    }
  }, [checkStatus]);

  // 添加异常记录
  const addData = useCallback(async (newData) => {
    setLoading(true);
    try {
      const result = await addExceptionRecord(newData);
      if (result) {
        setData((prevData) => [result, ...prevData]);
        fetchStats(); // 更新统计数据
        fetchAnalysis(); // 更新分析数据
        message.success("添加异常记录成功");
        return true;
      }
      return false;
    } catch (err) {
      setError("添加异常记录失败：" + err.message);
      message.error("添加异常记录失败");
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchStats, fetchAnalysis]);

  // 更新异常记录
  const updateData = useCallback(async (id, updatedData) => {
    setLoading(true);
    try {
      const result = await updateExceptionRecord(id, updatedData);
      if (result) {
        setData((prevData) =>
          prevData.map((item) => (item._id === id ? result : item))
        );
        fetchStats(); // 更新统计数据
        fetchAnalysis(); // 更新分析数据
        message.success("更新异常记录成功");
        return true;
      }
      return false;
    } catch (err) {
      setError("更新异常记录失败：" + err.message);
      message.error("更新异常记录失败");
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchStats, fetchAnalysis]);

  // 删除异常记录
  const removeData = useCallback(async (id) => {
    setLoading(true);
    try {
      const success = await deleteExceptionRecord(id);
      if (success) {
        setData((prevData) => prevData.filter((item) => item._id !== id));
        fetchStats(); // 更新统计数据
        fetchAnalysis(); // 更新分析数据
        message.success("删除异常记录成功");
        return true;
      }
      return false;
    } catch (err) {
      setError("删除异常记录失败：" + err.message);
      message.error("删除异常记录失败");
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchStats, fetchAnalysis]);

  // 初始加载
  useEffect(() => {
    fetchData();
    fetchStats();
    fetchAnalysis();
  }, [fetchData, fetchStats, fetchAnalysis]);

  return {
    data,
    stats,
    analysis,
    loading,
    statsLoading,
    analysisLoading,
    error,
    serverStatus,
    fetchData,
    fetchStats,
    fetchAnalysis,
    addData,
    updateData,
    removeData,
    checkStatus,
  };
};