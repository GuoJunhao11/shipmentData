// src/components/dashboard/Dashboard.js - 使用MongoDB数据
import React, { useState } from "react";
import { Card, Row, Col, Statistic, Tabs, Spin, Alert } from "antd";
import ReactECharts from "echarts-for-react";
import { useExpressData } from "../../hooks/useExpressData";
import ServerStatus from "../ServerStatus";

function Dashboard() {
  const [activeTab, setActiveTab] = useState("daily");
  const { data, loading, error, serverStatus, checkStatus } = useExpressData();

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
  if (!data || data.length === 0) {
    return (
      <div style={{ padding: "20px" }}>
        <ServerStatus status={serverStatus} onCheckStatus={checkStatus} />
        <Card title="仪表盘" className="card">
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <p>暂无数据。请在数据管理页面添加快递数据。</p>
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
        staffCount: row.人数 || 0,
      };
    });

    // 排序日期
    dailyTrend.sort((a, b) => {
      // 提取日期部分进行比较
      const partsA = a.date.split("/").map(Number);
      const partsB = b.date.split("/").map(Number);

      // 比较月份和日期
      if (partsA[0] !== partsB[0]) return partsA[0] - partsB[0];
      return partsA[1] - partsB[1];
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
      dailyTrend,
    };
  };

  // 处理数据
  const analysisData = processData(data);

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

  // 准备人效分析图表
  const efficiencyOption = {
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
      formatter: function (params) {
        const idx = params[0].dataIndex;
        const item = analysisData.dailyTrend[idx];
        const efficiency =
          item.staffCount > 0
            ? Math.round(item.totalOrderCount / item.staffCount)
            : 0;
        return `${params[0].name}<br/>
                人均处理: ${efficiency} 单/人<br/>
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
        data: analysisData.dailyTrend.map((item) =>
          item.staffCount > 0
            ? Math.round(item.totalOrderCount / item.staffCount)
            : 0
        ),
        itemStyle: {
          color: "#2ecc71",
        },
      },
    ],
  };

  // Tabs项目
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
      label: "人效分析",
      children: (
        <ReactECharts option={efficiencyOption} style={{ height: 400 }} />
      ),
    },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <ServerStatus status={serverStatus} onCheckStatus={checkStatus} />

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
                valueStyle={{ color: "#2ecc71" }}
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
