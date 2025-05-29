// src/components/dashboard/Dashboard.js
import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Tabs,
  Spin,
  Alert,
  Select,
  Space,
  Tooltip,
  Empty,
} from "antd";
import {
  FilterOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from "@ant-design/icons";
import ReactECharts from "echarts-for-react";
import { useExpressData } from "../../hooks/useExpressData";
import { useExceptionData } from "../../hooks/useExceptionData";
import { useInventoryData } from "../../hooks/useInventoryData";
import ServerStatus from "../ServerStatus";
import moment from "moment";

const { Option } = Select;

// 日期格式化辅助函数
const formatDisplayDate = (dateStr) => {
  if (!dateStr) return "";

  try {
    // 处理ISO格式
    if (dateStr.includes("T")) {
      const date = new Date(dateStr);
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      const year = date.getFullYear();
      return `${month}/${day}/${year}`;
    }

    // 处理MM/DD/YYYY格式
    if (dateStr.includes("/")) {
      const parts = dateStr.split("/");
      if (parts.length === 3) {
        return dateStr; // 已经是正确格式
      } else if (parts.length === 2) {
        // M/D格式，添加年份并标准化
        const month = parts[0].padStart(2, "0");
        const day = parts[1].padStart(2, "0");
        const year = new Date().getFullYear();
        return `${month}/${day}/${year}`;
      }
    }

    return dateStr;
  } catch (e) {
    console.error("日期显示格式化错误:", e);
    return dateStr;
  }
};

// 解析日期用于排序和比较
const parseDate = (dateStr) => {
  if (!dateStr) return null;

  try {
    // 处理ISO格式
    if (dateStr.includes("T")) {
      return moment(dateStr);
    }

    // 处理MM/DD/YYYY格式
    if (dateStr.includes("/")) {
      const parts = dateStr.split("/");
      if (parts.length === 3) {
        return moment(`${parts[2]}-${parts[0]}-${parts[1]}`, "YYYY-MM-DD");
      } else if (parts.length === 2) {
        const currentYear = moment().year();
        return moment(`${currentYear}-${parts[0]}-${parts[1]}`, "YYYY-MM-DD");
      }
    }

    return moment(dateStr);
  } catch (e) {
    console.error("日期解析错误:", e);
    return null;
  }
};

function Dashboard() {
  const [activeTab, setActiveTab] = useState("daily");
  const [timeRange, setTimeRange] = useState("all"); // 默认显示所有数据
  const { data, loading, error, serverStatus, checkStatus } = useExpressData();
  const {
    stats: exceptionStats,
    analysis: exceptionAnalysis,
    statsLoading: exceptionStatsLoading,
    analysisLoading: exceptionAnalysisLoading,
    fetchStats: fetchExceptionStats,
    fetchAnalysis: fetchExceptionAnalysis,
  } = useExceptionData();

  // 添加库存异常数据
  const { data: inventoryData, loading: inventoryLoading } = useInventoryData();

  const [filteredData, setFilteredData] = useState([]);

  // 设置工作起始时间为09:00
  const workStartTime = "09:00";

  // 确保加载异常分析数据
  useEffect(() => {
    fetchExceptionAnalysis();
  }, [fetchExceptionAnalysis]);

  // 根据时间范围筛选数据
  useEffect(() => {
    if (!data || data.length === 0) {
      setFilteredData([]);
      return;
    }

    const currentDate = moment();
    let filteredResult = [...data];

    switch (timeRange) {
      case "week":
        // 过去一周的数据
        filteredResult = data.filter((item) => {
          const itemDate = parseDate(item.日期);
          return itemDate && currentDate.diff(itemDate, "days") < 7;
        });
        break;
      case "month":
        // 过去一个月的数据
        filteredResult = data.filter((item) => {
          const itemDate = parseDate(item.日期);
          return itemDate && currentDate.diff(itemDate, "days") < 30;
        });
        break;
      case "quarter":
        // 过去三个月的数据
        filteredResult = data.filter((item) => {
          const itemDate = parseDate(item.日期);
          return itemDate && currentDate.diff(itemDate, "days") < 90;
        });
        break;
      case "halfYear":
        // 过去六个月的数据
        filteredResult = data.filter((item) => {
          const itemDate = parseDate(item.日期);
          return itemDate && currentDate.diff(itemDate, "days") < 180;
        });
        break;
      case "year":
        // 过去一年的数据
        filteredResult = data.filter((item) => {
          const itemDate = parseDate(item.日期);
          return itemDate && currentDate.diff(itemDate, "days") < 365;
        });
        break;
      default:
        // 全部数据
        filteredResult = [...data];
    }

    // 按日期排序
    filteredResult.sort((a, b) => {
      const dateA = parseDate(a.日期);
      const dateB = parseDate(b.日期);
      if (!dateA || !dateB) return 0;
      return dateA - dateB;
    });

    setFilteredData(filteredResult);
  }, [data, timeRange]);

  // 计算当月库存异常统计
  const calculateInventoryMonthlyStats = () => {
    const currentMonth = moment().format("YYYY-MM");
    const monthlyData = inventoryData.filter((item) => {
      const itemDate = parseDate(item.日期);
      return itemDate && itemDate.format("YYYY-MM") === currentMonth;
    });

    const totalCount = monthlyData.length;
    return { totalCount };
  };

  const inventoryStats = calculateInventoryMonthlyStats();

  // 加载状态
  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" />
        <p style={{ marginTop: "20px" }}>数据加载中...</p>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <Alert message="数据加载失败" description={error} type="error" showIcon />
    );
  }

  // 确保数据可用
  if (!filteredData || filteredData.length === 0) {
    return (
      <div style={{ padding: "20px" }}>
        <ServerStatus status={serverStatus} onCheckStatus={checkStatus} />
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: "16px",
          }}
        >
          <Space>
            <span>
              <FilterOutlined /> 时间范围:{" "}
            </span>
            <Select
              value={timeRange}
              onChange={(value) => setTimeRange(value)}
              style={{ width: 120 }}
            >
              <Option value="all">全部</Option>
              <Option value="week">一周</Option>
              <Option value="month">一个月</Option>
              <Option value="quarter">三个月</Option>
              <Option value="halfYear">半年</Option>
              <Option value="year">一年</Option>
            </Select>
          </Space>
        </div>
        <Card title="仪表盘" className="card">
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <p>
              所选时间范围内暂无数据。请在数据管理页面添加快递数据或选择其他时间范围。
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // 处理数据
  const processData = (rawData) => {
    // 计算FedEx总量和UPS总量
    const fedexCount = rawData.reduce(
      (sum, row) => sum + (row.FedEx总数量 || 0),
      0
    );

    const upsCount = rawData.reduce(
      (sum, row) => sum + (row.UPS总数量 || 0),
      0
    );

    // 计算总订单量（FedEx + UPS）
    const totalOrderCount = fedexCount + upsCount;

    // 易仓系统总量
    const ecSystemTotal = rawData.reduce(
      (sum, row) => sum + (row.易仓系统总量 || 0),
      0
    );

    // 新系统总量
    const newSystemTotal = rawData.reduce(
      (sum, row) => sum + (row.新系统总量 || 0),
      0
    );

    // 计算A008订单数
    const fedexA008Count = rawData.reduce(
      (sum, row) => sum + (row.FedEx中A008订单数 || 0),
      0
    );

    const upsA008Count = rawData.reduce(
      (sum, row) => sum + (row.UPS中A008订单数 || 0),
      0
    );

    // A008总数
    const totalA008Count = fedexA008Count + upsA008Count;

    // A008占总订单比例
    const a008Percentage =
      totalOrderCount > 0
        ? ((totalA008Count / totalOrderCount) * 100).toFixed(1)
        : "0.0";

    // 计算电池板和库板数
    const batteryCount = rawData.reduce(
      (sum, row) => sum + (row.电池板数 || 0),
      0
    );

    const fedexStorageCount = rawData.reduce(
      (sum, row) => sum + (row.FedEx含库板数 || 0),
      0
    );

    const upsStorageCount = rawData.reduce(
      (sum, row) => sum + (row.UPS含库板数 || 0),
      0
    );

    // 计算平均完成时间
    let totalMinutes = 0;
    let timeEntryCount = 0;

    rawData.forEach((row) => {
      if (row.完成时间) {
        const timeParts = row.完成时间.split(":");
        if (timeParts.length === 2) {
          const hours = parseInt(timeParts[0]);
          const minutes = parseInt(timeParts[1]);
          totalMinutes += hours * 60 + minutes;
          timeEntryCount++;
        }
      }
    });

    const avgMinutes = timeEntryCount > 0 ? totalMinutes / timeEntryCount : 0;
    const avgHours = Math.floor(avgMinutes / 60);
    const avgMins = Math.floor(avgMinutes % 60);
    const averageCompletionTime = `${avgHours
      .toString()
      .padStart(2, "0")}:${avgMins.toString().padStart(2, "0")}`;

    // 添加单位时间处理效率计算
    let totalUnitTimeEfficiency = 0;
    let validEntryCount = 0;

    // 准备每日趋势数据
    const dailyTrend = rawData.map((row) => {
      // 计算每日A008占比
      const dailyTotal = (row.FedEx总数量 || 0) + (row.UPS总数量 || 0);
      const dailyA008Total =
        (row.FedEx中A008订单数 || 0) + (row.UPS中A008订单数 || 0);
      const dailyA008Percentage =
        dailyTotal > 0 ? (dailyA008Total / dailyTotal) * 100 : 0;

      // 计算单位时间处理效率
      let unitTimeEfficiency = null;

      if (row.完成时间 && row.人数 > 0) {
        const completionTime = moment(row.完成时间, "HH:mm");
        const startTime = moment(workStartTime, "HH:mm");

        if (completionTime.isValid() && completionTime.isAfter(startTime)) {
          const diffHours = completionTime.diff(startTime, "minutes") / 60; // 转换为小时

          if (diffHours > 0) {
            unitTimeEfficiency = dailyTotal / (diffHours * row.人数);
            totalUnitTimeEfficiency += unitTimeEfficiency;
            validEntryCount++;
          }
        }
      }

      // 格式化日期显示
      const formattedDate = formatDisplayDate(row.日期);

      return {
        date: row.日期,
        displayDate: formattedDate,
        totalOrderCount: dailyTotal,
        fedexCount: row.FedEx总数量 || 0,
        upsCount: row.UPS总数量 || 0,
        ecSystemCount: row.易仓系统总量 || 0,
        newSystemCount: row.新系统总量 || 0,
        fedexA008Count: row.FedEx中A008订单数 || 0,
        upsA008Count: row.UPS中A008订单数 || 0,
        totalA008Count: dailyA008Total,
        a008Percentage: dailyA008Percentage,
        batteryCount: row.电池板数 || 0,
        fedexStorageCount: row.FedEx含库板数 || 0,
        upsStorageCount: row.UPS含库板数 || 0,
        completionTime: row.完成时间 || "-",
        staffCount: row.人数 || 0,
        unitTimeEfficiency: unitTimeEfficiency,
      };
    });

    // 计算平均单位时间处理效率
    const avgUnitTimeEfficiency =
      validEntryCount > 0
        ? (totalUnitTimeEfficiency / validEntryCount).toFixed(2)
        : "N/A";

    return {
      totalOrderCount,
      fedexCount,
      upsCount,
      ecSystemTotal,
      newSystemTotal,
      fedexA008Count,
      upsA008Count,
      totalA008Count,
      a008Percentage,
      batteryCount,
      fedexStorageCount,
      upsStorageCount,
      averageCompletionTime,
      avgUnitTimeEfficiency,
      dailyTrend,
    };
  };

  // 处理数据
  const analysisData = processData(filteredData);

  // 准备每日趋势图表
  const dailyTrendOption = {
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: analysisData.dailyTrend.map((item) => item.displayDate),
      name: "日期",
      nameLocation: "middle",
      nameGap: 30,
    },
    yAxis: {
      type: "value",
      name: "订单量",
      nameLocation: "middle",
      nameGap: 30,
    },
    tooltip: {
      trigger: "axis",
      formatter: function (params) {
        const idx = params[0].dataIndex;
        const item = analysisData.dailyTrend[idx];
        return `${params[0].name}<br/>
                总单量: ${item.totalOrderCount}<br/>
                FedEx: ${item.fedexCount}<br/>
                UPS: ${item.upsCount}<br/>
                易仓系统: ${item.ecSystemCount}<br/>
                新系统: ${item.newSystemCount}<br/>
                完成时间: ${item.completionTime}`;
      },
    },
    legend: {
      data: ["总单量", "FedEx", "UPS", "易仓系统", "新系统"],
    },
    series: [
      {
        name: "总单量",
        data: analysisData.dailyTrend.map((item) => item.totalOrderCount),
        type: "line",
        areaStyle: {},
        smooth: true,
        color: "#1890ff",
      },
      {
        name: "FedEx",
        data: analysisData.dailyTrend.map((item) => item.fedexCount),
        type: "line",
        smooth: true,
        color: "#722ed1",
      },
      {
        name: "UPS",
        data: analysisData.dailyTrend.map((item) => item.upsCount),
        type: "line",
        smooth: true,
        color: "#13c2c2",
      },
      {
        name: "易仓系统",
        data: analysisData.dailyTrend.map((item) => item.ecSystemCount),
        type: "line",
        smooth: true,
        color: "#52c41a",
      },
      {
        name: "新系统",
        data: analysisData.dailyTrend.map((item) => item.newSystemCount),
        type: "line",
        smooth: true,
        color: "#fa8c16",
      },
    ],
  };

  // 添加单位时间处理效率图表
  const unitTimeEfficiencyOption = {
    tooltip: {
      trigger: "axis",
      formatter: function (params) {
        const idx = params[0].dataIndex;
        const item = analysisData.dailyTrend[idx];
        return `${params[0].name}<br/>
                单位时间处理效率: ${
                  item.unitTimeEfficiency
                    ? item.unitTimeEfficiency.toFixed(2)
                    : "N/A"
                } 单/人时<br/>
                总单量: ${item.totalOrderCount}<br/>
                人数: ${item.staffCount}<br/>
                完成时间: ${item.completionTime}`;
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: analysisData.dailyTrend.map((item) => item.displayDate),
    },
    yAxis: {
      type: "value",
      name: "单位时间处理效率 (单/人时)",
    },
    series: [
      {
        name: "单位时间处理效率",
        type: "bar",
        data: analysisData.dailyTrend.map((item) =>
          item.unitTimeEfficiency
            ? parseFloat(item.unitTimeEfficiency.toFixed(2))
            : null
        ),
        itemStyle: {
          color: "#2ecc71",
        },
        markLine: {
          data: [
            {
              name: "平均效率",
              type: "average",
              label: {
                formatter: "平均: {c}单/人时",
                position: "end",
              },
            },
          ],
        },
      },
    ],
  };

  // 准备快递公司占比图表
  const courierComparisonOption = {
    tooltip: {
      trigger: "item",
      formatter: "{b}: {c} ({d}%)",
    },
    legend: {
      orient: "vertical",
      left: "left",
      data: ["FedEx", "UPS"],
    },
    series: [
      {
        type: "pie",
        radius: "70%",
        center: ["50%", "50%"],
        data: [
          { value: analysisData.fedexCount, name: "FedEx" },
          { value: analysisData.upsCount, name: "UPS" },
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.5)",
          },
        },
      },
    ],
  };

  // 准备系统对比图表（易仓系统vs新系统）
  const systemComparisonOption = {
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
    },
    legend: {
      data: ["易仓系统", "新系统"],
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: analysisData.dailyTrend.map((item) => item.displayDate),
    },
    yAxis: {
      type: "value",
      name: "订单数",
    },
    series: [
      {
        name: "易仓系统",
        type: "bar",
        stack: "系统",
        data: analysisData.dailyTrend.map((item) => item.ecSystemCount),
        color: "#52c41a",
      },
      {
        name: "新系统",
        type: "bar",
        stack: "系统",
        data: analysisData.dailyTrend.map((item) => item.newSystemCount),
        color: "#fa8c16",
      },
    ],
  };

  // 准备A008订单分析图表
  const a008OrdersOption = {
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
      formatter: function (params) {
        const idx = params[0].dataIndex;
        const item = analysisData.dailyTrend[idx];
        return `${params[0].name}<br/>
                A008占比: ${item.a008Percentage.toFixed(1)}%<br/>
                A008订单数: ${item.totalA008Count}<br/>
                总订单数: ${item.totalOrderCount}<br/>
                FedEx A008: ${item.fedexA008Count}<br/>
                UPS A008: ${item.upsA008Count}`;
      },
    },
    legend: {
      data: ["A008订单占比(%)"],
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: analysisData.dailyTrend.map((item) => item.displayDate),
    },
    yAxis: [
      {
        type: "value",
        name: "占比(%)",
        max: 100,
        axisLabel: {
          formatter: "{value}%",
        },
      },
    ],
    series: [
      {
        name: "A008订单占比(%)",
        type: "line",
        data: analysisData.dailyTrend.map((item) =>
          item.a008Percentage.toFixed(1)
        ),
        markLine: {
          data: [
            {
              name: "平均占比",
              type: "average",
              label: {
                formatter: "平均: {c}%",
                position: "end",
              },
            },
          ],
        },
        symbol: "circle",
        symbolSize: 8,
        lineStyle: {
          width: 3,
        },
        itemStyle: {
          color: "#eb2f96",
        },
      },
    ],
  };

  // 准备库板与电池分析图表
  const storageOption = {
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
    },
    legend: {
      data: ["电池板数", "FedEx 库板数", "UPS 库板数"],
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: analysisData.dailyTrend.map((item) => item.displayDate),
    },
    yAxis: {
      type: "value",
      name: "板数",
    },
    series: [
      {
        name: "电池板数",
        type: "bar",
        data: analysisData.dailyTrend.map((item) => item.batteryCount),
        color: "#faad14",
      },
      {
        name: "FedEx 库板数",
        type: "bar",
        stack: "库板",
        data: analysisData.dailyTrend.map((item) => item.fedexStorageCount),
        color: "#722ed1",
      },
      {
        name: "UPS 库板数",
        type: "bar",
        stack: "库板",
        data: analysisData.dailyTrend.map((item) => item.upsStorageCount),
        color: "#13c2c2",
      },
    ],
  };

  // 准备异常SKU分析图表
  const exceptionSKUAnalysisOption = {
    title: {
      text: "异常频率最高的SKU分析",
      left: "center",
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
      formatter: function (params) {
        const skuData = params[0];
        return `${skuData.name}<br/>
                ${params
                  .map((param) => `${param.seriesName}: ${param.value || 0}次`)
                  .join("<br/>")}`;
      },
    },
    legend: {
      data: ["无轨迹", "缺货", "错发"],
      bottom: 0,
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "10%",
      top: "10%",
      containLabel: true,
    },
    xAxis: {
      type: "value",
      name: "异常数量",
    },
    yAxis: {
      type: "category",
      data: (exceptionAnalysis.topSKUs || []).map((item) => item.sku).reverse(),
      axisLabel: {
        width: 120,
        overflow: "truncate",
        interval: 0,
      },
    },
    series: [
      {
        name: "无轨迹",
        type: "bar",
        stack: "总量",
        emphasis: {
          focus: "series",
        },
        data: (exceptionAnalysis.topSKUs || [])
          .map((item) => item.noTrackingCount || 0)
          .reverse(),
        itemStyle: {
          color: "#faad14",
        },
      },
      {
        name: "缺货",
        type: "bar",
        stack: "总量",
        emphasis: {
          focus: "series",
        },
        data: (exceptionAnalysis.topSKUs || [])
          .map((item) => item.outOfStockCount || 0)
          .reverse(),
        itemStyle: {
          color: "#f5222d",
        },
      },
      {
        name: "错发",
        type: "bar",
        stack: "总量",
        emphasis: {
          focus: "series",
        },
        data: (exceptionAnalysis.topSKUs || [])
          .map((item) => item.wrongShipmentCount || 0)
          .reverse(),
        itemStyle: {
          color: "#1890ff",
        },
      },
    ],
  };

  // 异常统计卡片行
  const exceptionStatsRow = (
    <Row gutter={16} style={{ marginBottom: 24 }} className="stats-row">
      <Col xs={24} sm={12} md={6} lg={6}>
        <Card className="stat-card">
          <Statistic
            title="当月异常记录总数"
            value={exceptionStats.currentMonth?.totalExceptions || 0}
            valueStyle={{
              color:
                parseFloat(exceptionStats.changeRate?.total) < 0
                  ? "#3f8600"
                  : "#cf1322",
            }}
            prefix={
              parseFloat(exceptionStats.changeRate?.total) < 0 ? (
                <ArrowDownOutlined />
              ) : (
                <ArrowUpOutlined />
              )
            }
            suffix={`${exceptionStats.changeRate?.total || 0}%`}
            loading={exceptionStatsLoading}
          />
          <div style={{ fontSize: 12, color: "rgba(0, 0, 0, 0.45)" }}>
            上月: {exceptionStats.lastMonth?.totalExceptions || 0}
          </div>
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6} lg={6}>
        <Card className="stat-card">
          <Statistic
            title="当月无轨迹"
            value={exceptionStats.currentMonth?.noTracking || 0}
            valueStyle={{
              color:
                parseFloat(exceptionStats.changeRate?.noTracking) < 0
                  ? "#3f8600"
                  : "#cf1322",
            }}
            prefix={
              parseFloat(exceptionStats.changeRate?.noTracking) < 0 ? (
                <ArrowDownOutlined />
              ) : (
                <ArrowUpOutlined />
              )
            }
            suffix={`${exceptionStats.changeRate?.noTracking || 0}%`}
            loading={exceptionStatsLoading}
          />
          <div style={{ fontSize: 12, color: "rgba(0, 0, 0, 0.45)" }}>
            上月: {exceptionStats.lastMonth?.noTracking || 0}
          </div>
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6} lg={6}>
        <Card className="stat-card">
          <Statistic
            title="当月缺货"
            value={exceptionStats.currentMonth?.outOfStock || 0}
            valueStyle={{
              color:
                parseFloat(exceptionStats.changeRate?.outOfStock) < 0
                  ? "#3f8600"
                  : "#cf1322",
            }}
            prefix={
              parseFloat(exceptionStats.changeRate?.outOfStock) < 0 ? (
                <ArrowDownOutlined />
              ) : (
                <ArrowUpOutlined />
              )
            }
            suffix={`${exceptionStats.changeRate?.outOfStock || 0}%`}
            loading={exceptionStatsLoading}
          />
          <div style={{ fontSize: 12, color: "rgba(0, 0, 0, 0.45)" }}>
            上月: {exceptionStats.lastMonth?.outOfStock || 0}
          </div>
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6} lg={6}>
        <Card className="stat-card">
          <Statistic
            title="平均每月异常数"
            value={exceptionStats.monthlyAverage || 0}
            valueStyle={{ color: "#1890ff" }}
            loading={exceptionStatsLoading}
          />
          <div style={{ fontSize: 12, color: "rgba(0, 0, 0, 0.45)" }}>
            当月错发: {exceptionStats.currentMonth?.wrongShipment || 0}
          </div>
        </Card>
      </Col>
    </Row>
  );

  // 库存异常统计卡片行 - 只保留总数
  const inventoryStatsRow = (
    <Row gutter={16} style={{ marginBottom: 24 }} className="stats-row">
      <Col xs={24} sm={12} md={6} lg={6}>
        <Card className="stat-card">
          <Statistic
            title="当月库存异常总数"
            value={inventoryStats.totalCount}
            valueStyle={{ color: "#1890ff" }}
            loading={inventoryLoading}
          />
        </Card>
      </Col>
      {/* 空的占位列，保持布局一致 */}
      <Col xs={24} sm={12} md={6} lg={6}></Col>
      <Col xs={24} sm={12} md={6} lg={6}></Col>
      <Col xs={24} sm={12} md={6} lg={6}></Col>
    </Row>
  );

  // Tabs项目
  const items = [
    {
      key: "daily",
      label: "每日趋势",
      children: (
        <ReactECharts
          option={dailyTrendOption}
          style={{ height: "100%", width: "100%" }}
          className="chart-container"
        />
      ),
    },
    {
      key: "unitTimeEfficiency",
      label: "单位时间处理效率",
      children: (
        <ReactECharts
          option={unitTimeEfficiencyOption}
          style={{ height: "100%", width: "100%" }}
          className="chart-container"
        />
      ),
    },
    {
      key: "system",
      label: "系统对比",
      children: (
        <ReactECharts
          option={systemComparisonOption}
          style={{ height: "100%", width: "100%" }}
          className="chart-container"
        />
      ),
    },
    {
      key: "courier",
      label: "快递公司对比",
      children: (
        <ReactECharts
          option={courierComparisonOption}
          style={{ height: "100%", width: "100%" }}
          className="chart-container"
        />
      ),
    },
    {
      key: "a008",
      label: "A008订单分析",
      children: (
        <ReactECharts
          option={a008OrdersOption}
          style={{ height: "100%", width: "100%" }}
          className="chart-container"
        />
      ),
    },
    {
      key: "storage",
      label: "库板与电池分析",
      children: (
        <ReactECharts
          option={storageOption}
          style={{ height: "100%", width: "100%" }}
          className="chart-container"
        />
      ),
    },
    {
      key: "exceptionSKU",
      label: "异常SKU分析",
      children: exceptionAnalysisLoading ? (
        <div
          style={{
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Spin size="large" />
        </div>
      ) : (exceptionAnalysis.topSKUs || []).length === 0 ? (
        <Empty description="暂无异常SKU数据" style={{ marginTop: 100 }} />
      ) : (
        <ReactECharts
          option={exceptionSKUAnalysisOption}
          style={{ height: "100%", width: "100%", minHeight: 400 }}
          className="chart-container"
        />
      ),
    },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <ServerStatus status={serverStatus} onCheckStatus={checkStatus} />

      {/* 时间范围选择器 */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "16px",
        }}
        className="management-actions"
      >
        <Space>
          <span>
            <FilterOutlined /> 时间范围:{" "}
          </span>
          <Select
            value={timeRange}
            onChange={(value) => setTimeRange(value)}
            style={{ width: 120 }}
          >
            <Option value="all">全部</Option>
            <Option value="week">一周</Option>
            <Option value="month">一个月</Option>
            <Option value="quarter">三个月</Option>
            <Option value="halfYear">半年</Option>
            <Option value="year">一年</Option>
          </Select>
        </Space>
      </div>

      <Card title="仪表盘" className="card">
        {/* 顶部统计 */}
        <Row gutter={16} style={{ marginBottom: 24 }} className="stats-row">
          <Col xs={24} sm={12} md={6} lg={6}>
            <Card className="stat-card">
              <Statistic
                title="总单量"
                value={analysisData.totalOrderCount}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6} lg={6}>
            <Card className="stat-card">
              <Statistic
                title="易仓系统总量"
                value={analysisData.ecSystemTotal}
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6} lg={6}>
            <Card className="stat-card">
              <Statistic
                title="新系统总量"
                value={analysisData.newSystemTotal}
                valueStyle={{ color: "#fa8c16" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6} lg={6}>
            <Card className="stat-card">
              <Tooltip title="每人每小时处理的单量，数值越高表示效率越高">
                <Statistic
                  title="单位时间处理效率"
                  value={analysisData.avgUnitTimeEfficiency}
                  suffix="单/人时"
                  valueStyle={{ color: "#2ecc71" }}
                />
              </Tooltip>
            </Card>
          </Col>
        </Row>

        {/* 第二行统计 */}
        <Row gutter={16} style={{ marginBottom: 24 }} className="stats-row">
          <Col xs={24} sm={12} md={6} lg={6}>
            <Card className="stat-card">
              <Statistic
                title="FedEx 总量"
                value={analysisData.fedexCount}
                valueStyle={{ color: "#722ed1" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6} lg={6}>
            <Card className="stat-card">
              <Statistic
                title="UPS 总量"
                value={analysisData.upsCount}
                valueStyle={{ color: "#13c2c2" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6} lg={6}>
            <Card className="stat-card">
              <Statistic
                title="A008占比"
                value={analysisData.a008Percentage}
                suffix="%"
                precision={1}
                valueStyle={{ color: "#eb2f96" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6} lg={6}>
            <Card className="stat-card">
              <Statistic
                title="平均完成时间"
                value={analysisData.averageCompletionTime}
                valueStyle={{ color: "#3f8600" }}
              />
            </Card>
          </Col>
        </Row>

        {/* 第三行统计 */}
        <Row gutter={16} style={{ marginBottom: 24 }} className="stats-row">
          <Col xs={24} sm={12} md={6} lg={6}>
            <Card className="stat-card">
              <Statistic
                title="电池板数"
                value={analysisData.batteryCount}
                valueStyle={{ color: "#faad14" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6} lg={6}>
            <Card className="stat-card">
              <Statistic
                title="FedEx库板数"
                value={analysisData.fedexStorageCount}
                valueStyle={{ color: "#722ed1" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6} lg={6}>
            <Card className="stat-card">
              <Statistic
                title="UPS库板数"
                value={analysisData.upsStorageCount}
                valueStyle={{ color: "#13c2c2" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6} lg={6}>
            <Card className="stat-card">
              <Statistic
                title="FedEx/UPS比例"
                value={(() => {
                  if (analysisData.upsCount === 0) return "∞";
                  return (
                    analysisData.fedexCount / analysisData.upsCount
                  ).toFixed(2);
                })()}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
        </Row>

        {/* 异常统计行 */}
        {exceptionStatsRow}

        {/* 库存异常统计行 - 只显示总数 */}
        {inventoryStatsRow}

        {/* 图表分析 */}
        <div className="chart-container">
          <Tabs activeKey={activeTab} onChange={setActiveTab} items={items} />
        </div>
      </Card>
    </div>
  );
}

export default Dashboard;
