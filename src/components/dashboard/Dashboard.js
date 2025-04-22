// src/components/dashboard/Dashboard.js - 改进版本
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
} from "antd";
import { FilterOutlined } from "@ant-design/icons";
import ReactECharts from "echarts-for-react";
import { useExpressData } from "../../hooks/useExpressData";
import ServerStatus from "../ServerStatus";
import moment from "moment";

const { Option } = Select;
const parseDate = (dateStr) => {
  if (!dateStr) return null;

  // 处理 MM/DD/YYYY 格式
  if (dateStr.includes("/")) {
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      // MM/DD/YYYY 格式
      return moment(`${parts[2]}-${parts[0]}-${parts[1]}`, "YYYY-MM-DD");
    } else if (parts.length === 2) {
      // M/D 格式，添加当前年份
      const currentYear = moment().year();
      return moment(`${currentYear}-${parts[0]}-${parts[1]}`, "YYYY-MM-DD");
    }
  }
  // 处理ISO格式
  else if (dateStr.includes("T")) {
    return moment(dateStr);
  }

  return null;
};
function Dashboard() {
  const [activeTab, setActiveTab] = useState("daily");
  const [timeRange, setTimeRange] = useState("all"); // 默认显示所有数据
  const { data, loading, error, serverStatus, checkStatus } = useExpressData();
  const [filteredData, setFilteredData] = useState([]);

  // 设置工作起始时间为09:00
  const workStartTime = "09:00";

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

  // 解析日期字符串为moment对象
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const currentYear = moment().year();
    const [month, day] = dateStr.split("/").map(Number);
    return moment()
      .year(currentYear)
      .month(month - 1)
      .date(day);
  };

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

    // 计算平均工作效率（从9:00到完成时间）
    let totalEfficiencyMinutes = 0;
    let efficiencyCount = 0;

    rawData.forEach((row) => {
      if (row.完成时间) {
        const completionTime = moment(row.完成时间, "HH:mm");
        const startTime = moment(workStartTime, "HH:mm");

        if (completionTime.isValid() && startTime.isValid()) {
          // 只计算在工作时间后完成的情况
          if (completionTime.isAfter(startTime)) {
            const diffMinutes = completionTime.diff(startTime, "minutes");
            totalEfficiencyMinutes += diffMinutes;
            efficiencyCount++;
          }
        }
      }
    });

    let avgEfficiency = "N/A";
    if (efficiencyCount > 0) {
      const avgEffMinutes = Math.round(
        totalEfficiencyMinutes / efficiencyCount
      );
      const effHours = Math.floor(avgEffMinutes / 60);
      const effMins = avgEffMinutes % 60;
      avgEfficiency = `${effHours}小时${effMins}分钟`;
    }

    // 计算人均处理单量
    const totalStaff = rawData.reduce((sum, row) => sum + (row.人数 || 0), 0);

    const avgOrdersPerPerson =
      totalStaff > 0 ? Math.round(totalOrderCount / totalStaff) : 0;

    // 准备每日趋势数据
    const dailyTrend = rawData.map((row) => {
      // 计算每日A008占比
      const dailyTotal = (row.FedEx总数量 || 0) + (row.UPS总数量 || 0);
      const dailyA008Total =
        (row.FedEx中A008订单数 || 0) + (row.UPS中A008订单数 || 0);
      const dailyA008Percentage =
        dailyTotal > 0 ? (dailyA008Total / dailyTotal) * 100 : 0;

      // 计算工作效率（从9:00到完成时间）
      let efficiency = null;
      if (row.完成时间) {
        const completionTime = moment(row.完成时间, "HH:mm");
        const startTime = moment(workStartTime, "HH:mm");

        if (completionTime.isValid() && startTime.isValid()) {
          if (completionTime.isAfter(startTime)) {
            const diffMinutes = completionTime.diff(startTime, "minutes");
            efficiency = diffMinutes;
          } else {
            efficiency = 0; // 完成时间早于上班时间
          }
        }
      }

      // 计算人均处理效率
      const staffCount = row.人数 || 0;
      const perPersonHandling =
        staffCount > 0 ? Math.round(dailyTotal / staffCount) : 0;
      return {
        date: row.日期,
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
        staffCount: staffCount,
        perPersonHandling: perPersonHandling,
        efficiency: efficiency,
      };
    });

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
      avgOrdersPerPerson,
      avgEfficiency,
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
      data: analysisData.dailyTrend.map((item) => item.date),
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
      data: analysisData.dailyTrend.map((item) => item.date),
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
  // 准备A008订单分析图表 - 修改为占比分析
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
      data: analysisData.dailyTrend.map((item) => item.date),
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
      data: analysisData.dailyTrend.map((item) => item.date),
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

  // 准备工作效率分析图表 - 新增
  const efficiencyOption = {
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
      formatter: function (params) {
        const idx = params[0].dataIndex;
        const item = analysisData.dailyTrend[idx];

        // 格式化效率展示
        let efficiencyStr = "N/A";
        if (item.efficiency !== null) {
          if (item.efficiency === 0) {
            efficiencyStr = "提前完成";
          } else {
            const hours = Math.floor(item.efficiency / 60);
            const mins = item.efficiency % 60;
            efficiencyStr = `${hours}小时${mins}分钟`;
          }
        }

        return `${params[0].name}<br/>
                工作效率: ${efficiencyStr}<br/>
                完成时间: ${item.completionTime}<br/>
                开始时间: ${workStartTime}<br/>
                总单量: ${item.totalOrderCount}<br/>
                人数: ${item.staffCount}`;
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
      data: analysisData.dailyTrend.map((item) => item.date),
    },
    yAxis: {
      type: "value",
      name: "工作时长(分钟)",
    },
    series: [
      {
        name: "工作效率",
        type: "bar",
        data: analysisData.dailyTrend.map((item) =>
          item.efficiency !== null
            ? item.efficiency === 0
              ? null
              : item.efficiency
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
                formatter: "平均: {c}分钟",
                position: "end",
              },
            },
          ],
        },
      },
    ],
  };

  // 准备人效分析图表 - 修改
  const perPersonOption = {
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
      formatter: function (params) {
        const idx = params[0].dataIndex;
        const item = analysisData.dailyTrend[idx];
        return `${params[0].name}<br/>
                人均处理: ${item.perPersonHandling} 单/人<br/>
                总单量: ${item.totalOrderCount}<br/>
                人数: ${item.staffCount}`;
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
      data: analysisData.dailyTrend.map((item) => item.date),
    },
    yAxis: {
      type: "value",
      name: "人均处理单量",
    },
    series: [
      {
        name: "人均处理单量",
        type: "bar",
        data: analysisData.dailyTrend.map((item) => item.perPersonHandling),
        itemStyle: {
          color: "#3498db",
        },
        markLine: {
          data: [
            {
              name: "平均人效",
              type: "average",
              label: {
                formatter: "平均: {c}单/人",
                position: "end",
              },
            },
          ],
        },
      },
    ],
  };

  // Tabs项目 - 增加了效率分析
  const items = [
    {
      key: "daily",
      label: "每日趋势",
      children: (
        <ReactECharts option={dailyTrendOption} style={{ height: 400 }} />
      ),
    },
    {
      key: "system",
      label: "系统对比",
      children: (
        <ReactECharts option={systemComparisonOption} style={{ height: 400 }} />
      ),
    },
    {
      key: "courier",
      label: "快递公司对比",
      children: (
        <ReactECharts
          option={courierComparisonOption}
          style={{ height: 400 }}
        />
      ),
    },
    {
      key: "a008",
      label: "A008订单分析",
      children: (
        <ReactECharts option={a008OrdersOption} style={{ height: 400 }} />
      ),
    },
    {
      key: "storage",
      label: "库板与电池分析",
      children: <ReactECharts option={storageOption} style={{ height: 400 }} />,
    },
    {
      key: "efficiency",
      label: "工作效率分析",
      children: (
        <ReactECharts option={efficiencyOption} style={{ height: 400 }} />
      ),
    },
    {
      key: "perPerson",
      label: "人效分析",
      children: (
        <ReactECharts option={perPersonOption} style={{ height: 400 }} />
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
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={8} md={6} lg={6}>
            <Card>
              <Statistic
                title="总单量"
                value={analysisData.totalOrderCount}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6} lg={6}>
            <Card>
              <Statistic
                title="易仓系统总量"
                value={analysisData.ecSystemTotal}
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6} lg={6}>
            <Card>
              <Statistic
                title="新系统总量"
                value={analysisData.newSystemTotal}
                valueStyle={{ color: "#fa8c16" }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6} lg={6}>
            <Card>
              <Statistic
                title="平均人效"
                value={analysisData.avgOrdersPerPerson}
                suffix="单/人"
                valueStyle={{ color: "#3498db" }}
              />
            </Card>
          </Col>
        </Row>

        {/* 第二行统计 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={8} md={6} lg={6}>
            <Card>
              <Statistic
                title="FedEx 总量"
                value={analysisData.fedexCount}
                valueStyle={{ color: "#722ed1" }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6} lg={6}>
            <Card>
              <Statistic
                title="UPS 总量"
                value={analysisData.upsCount}
                valueStyle={{ color: "#13c2c2" }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6} lg={6}>
            <Card>
              <Statistic
                title="A008占比"
                value={analysisData.a008Percentage}
                suffix="%"
                precision={1}
                valueStyle={{ color: "#eb2f96" }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6} lg={6}>
            <Card>
              <Statistic
                title="平均工作效率"
                value={analysisData.avgEfficiency}
                valueStyle={{ color: "#2ecc71" }}
              />
            </Card>
          </Col>
        </Row>

        {/* 第三行统计 - 增加更多详细信息 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={8} md={6} lg={6}>
            <Card>
              <Statistic
                title="电池板数"
                value={analysisData.batteryCount}
                valueStyle={{ color: "#faad14" }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6} lg={6}>
            <Card>
              <Statistic
                title="FedEx库板数"
                value={analysisData.fedexStorageCount}
                valueStyle={{ color: "#722ed1" }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6} lg={6}>
            <Card>
              <Statistic
                title="UPS库板数"
                value={analysisData.upsStorageCount}
                valueStyle={{ color: "#13c2c2" }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6} lg={6}>
            <Card>
              <Statistic
                title="平均完成时间"
                value={analysisData.averageCompletionTime}
                valueStyle={{ color: "#3f8600" }}
              />
            </Card>
          </Col>
        </Row>

        {/* 图表分析 */}
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={items} />
      </Card>
    </div>
  );
}

export default Dashboard;
