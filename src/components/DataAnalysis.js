// src/components/DataAnalysis.js 修复版本
import React, { useState } from "react";
import { Card, Row, Col, Statistic, Tabs, Button, Table } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import ReactECharts from "echarts-for-react";
import * as XLSX from "xlsx";

function DataAnalysis({ data }) {
  const [activeTab, setActiveTab] = useState("daily");

  // Prepare data for daily trend chart
  const dailyTrendOption = {
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: data.dailyTrend.map((item) => item.date.split("/2025")[0]), // 修复：移除年份显示，只显示月/日
      name: "日期",
      nameLocation: "middle",
      nameGap: 30,
    },
    yAxis: {
      type: "value",
      name: "寄件量",
      nameLocation: "middle",
      nameGap: 30,
    },
    tooltip: {
      trigger: "axis",
      formatter: function (params) {
        const pointData = params[0].data;
        return `${params[0].name}<br/>
                总量: ${params[0].value}<br/>
                FedEx: ${params.length > 1 ? params[1].value : "-"}<br/>
                UPS: ${params.length > 2 ? params[2].value : "-"}<br/>
                完成时间: ${
                  data.dailyTrend[params[0].dataIndex]?.completionTime || "-"
                }`;
      },
    },
    legend: {
      data: ["总量", "FedEx", "UPS"],
    },
    series: [
      {
        name: "总量",
        data: data.dailyTrend.map((item) => item.totalCount),
        type: "line",
        areaStyle: {},
        smooth: true,
        color: "#1890ff",
      },
      {
        name: "FedEx",
        data: data.dailyTrend.map((item) => item.fedexCount),
        type: "line",
        smooth: true,
        color: "#722ed1",
      },
      {
        name: "UPS",
        data: data.dailyTrend.map((item) => item.upsCount),
        type: "line",
        smooth: true,
        color: "#13c2c2",
      },
    ],
  };

  // Prepare data for courier comparison
  const courierComparisonOption = {
    tooltip: {
      trigger: "item",
      formatter: "{b}: {c} ({d}%)",
    },
    legend: {
      orient: "vertical",
      left: "left",
      data: ["FedEx", "UPS", "其他"],
    },
    series: [
      {
        type: "pie",
        radius: "70%",
        center: ["50%", "50%"],
        data: [
          { value: data.fedexCount, name: "FedEx" },
          { value: data.upsCount, name: "UPS" },
          {
            value: data.totalShipments - data.fedexCount - data.upsCount,
            name: "其他",
          },
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

  // Prepare data for A008 orders analysis
  const a008OrdersOption = {
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
    },
    legend: {
      data: ["FedEx A008", "UPS A008"],
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: data.dailyTrend.map((item) => item.date.split("/2025")[0]), // 修复：移除年份显示，只显示月/日
    },
    yAxis: {
      type: "value",
      name: "订单数",
    },
    series: [
      {
        name: "FedEx A008",
        type: "bar",
        data: data.dailyTrend.map((item) => item.fedexA008Count),
        color: "#722ed1",
      },
      {
        name: "UPS A008",
        type: "bar",
        data: data.dailyTrend.map((item) => item.upsA008Count),
        color: "#13c2c2",
      },
    ],
  };

  // Prepare data for efficiency analysis
  const efficiencyOption = {
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
      data: data.dailyTrend.map((item) => item.date.split("/2025")[0]), // 修复：移除年份显示，只显示月/日
    },
    yAxis: {
      type: "value",
      name: "板数",
    },
    series: [
      {
        name: "电池板数",
        type: "bar",
        data: data.dailyTrend.map((item) => item.batteryCount),
        color: "#faad14",
      },
      {
        name: "FedEx 库板数",
        type: "bar",
        stack: "库板",
        data: data.dailyTrend.map((item) => item.fedexStorageCount),
        color: "#722ed1",
      },
      {
        name: "UPS 库板数",
        type: "bar",
        stack: "库板",
        data: data.dailyTrend.map((item) => item.upsStorageCount),
        color: "#13c2c2",
      },
    ],
  };

  // Prepare columns for raw data table
  const getColumns = () => {
    if (!data.rawData || !data.rawData[0]) return [];

    return Object.keys(data.rawData[0]).map((key) => ({
      title: key.charAt(0).toUpperCase() + key.slice(1),
      dataIndex: key,
      key: key,
      sorter: (a, b) => {
        if (typeof a[key] === "string" && typeof b[key] === "string") {
          return a[key].localeCompare(b[key]);
        }
        return a[key] - b[key];
      },
    }));
  };

  // Function to export analysis report
  const exportReport = () => {
    // Create a workbook
    const wb = XLSX.utils.book_new();

    // Create worksheets for different data
    const summaryData = [
      ["总寄件量", data.totalShipments],
      ["FedEx 总量", data.fedexCount],
      ["UPS 总量", data.upsCount],
      ["FedEx A008 订单量", data.fedexA008Count || 0],
      ["UPS A008 订单量", data.upsA008Count || 0],
      ["电池板数", data.batteryCount || 0],
      ["FedEx 库板数", data.fedexStorageCount || 0],
      ["UPS 库板数", data.upsStorageCount || 0],
      ["平均每日发货量", data.averageShipmentsPerDay || 0],
      ["完成率", `${data.completionRate}%`],
    ];
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);

    // Convert daily trend data to worksheet
    const trendHeaders = [
      "日期",
      "总量",
      "FedEx",
      "UPS",
      "FedEx A008",
      "UPS A008",
      "电池板数",
      "完成时间",
    ];
    const trendData = [
      trendHeaders,
      ...data.dailyTrend.map((item) => [
        item.date,
        item.totalCount,
        item.fedexCount,
        item.upsCount,
        item.fedexA008Count,
        item.upsA008Count,
        item.batteryCount,
        item.completionTime,
      ]),
    ];
    const trendWs = XLSX.utils.aoa_to_sheet(trendData);

    // Convert raw data to worksheet
    const rawWs = XLSX.utils.json_to_sheet(data.rawData);

    // Add worksheets to workbook
    XLSX.utils.book_append_sheet(wb, summaryWs, "概览");
    XLSX.utils.book_append_sheet(wb, trendWs, "每日趋势");
    XLSX.utils.book_append_sheet(wb, rawWs, "原始数据");

    // Export workbook
    XLSX.writeFile(wb, "快递数据分析报告.xlsx");
  };

  // Tabs for different views
  const items = [
    {
      key: "daily",
      label: "每日趋势",
      children: (
        <ReactECharts option={dailyTrendOption} style={{ height: 400 }} />
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
      key: "efficiency",
      label: "库板与电池分析",
      children: (
        <ReactECharts option={efficiencyOption} style={{ height: 400 }} />
      ),
    },
    {
      key: "raw",
      label: "数据表格",
      children: (
        <Table
          columns={getColumns()}
          dataSource={data.rawData.map((item, index) => ({
            ...item,
            key: index,
          }))}
          scroll={{ x: true }}
          pagination={{ pageSize: 10 }}
        />
      ),
    },
  ];

  return (
    <div>
      <Card
        title="快递数据分析"
        className="card"
        extra={
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={exportReport}
          >
            导出报告
          </Button>
        }
      >
        {/* Summary Cards */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={8} md={6} lg={6}>
            <Card>
              <Statistic
                title="总寄件量"
                value={data.totalShipments}
                valueStyle={{ color: "#3f8600" }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6} lg={6}>
            <Card>
              <Statistic
                title="FedEx 总量"
                value={data.fedexCount}
                valueStyle={{ color: "#722ed1" }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6} lg={6}>
            <Card>
              <Statistic
                title="UPS 总量"
                value={data.upsCount}
                valueStyle={{ color: "#13c2c2" }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6} lg={6}>
            <Card>
              <Statistic
                title="平均完成率"
                value={data.completionRate}
                suffix="%"
                precision={1}
                valueStyle={{
                  color:
                    parseFloat(data.completionRate) > 90
                      ? "#3f8600"
                      : "#cf1322",
                }}
              />
            </Card>
          </Col>
        </Row>

        {/* Additional metrics */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={8} md={6} lg={6}>
            <Card>
              <Statistic
                title="FedEx A008 订单"
                value={data.fedexA008Count || 0}
                valueStyle={{ color: "#722ed1" }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6} lg={6}>
            <Card>
              <Statistic
                title="UPS A008 订单"
                value={data.upsA008Count || 0}
                valueStyle={{ color: "#13c2c2" }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6} lg={6}>
            <Card>
              <Statistic
                title="电池板数"
                value={data.batteryCount || 0}
                valueStyle={{ color: "#faad14" }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6} lg={6}>
            <Card>
              <Statistic
                title="平均每日发货量"
                value={data.averageShipmentsPerDay || 0}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
        </Row>

        {/* Analysis Tabs */}
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={items} />
      </Card>
    </div>
  );
}

export default DataAnalysis;
