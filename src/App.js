import React from "react";
import { Layout } from "antd";
import Header from "./components/Header";
import FileUpload from "./components/FileUpload";
import DataAnalysis from "./components/DataAnalysis";
import { useState } from "react";
import "./App.css";

const { Content } = Layout;

function App() {
  const [analysisData, setAnalysisData] = useState(null);

  // Handle file upload and data analysis
  const handleDataAnalysis = (data) => {
    try {
      // Sample data structure from the image:
      // - 日期 (Date) - like 4/8, 4/9, etc.
      // - 寄件总量 (Total shipments)
      // - 新系统总量 (New system total)
      // - FedEx 总数量 (FedEx total)
      // - UPS 总数量 (UPS total)
      // - FedEx 中 A008 订单数 (FedEx A008 orders)
      // - UPS 中 A008 订单数 (UPS A008 orders)
      // - 电池板数 (Battery panel count)
      // - FedEx 含库板数 (FedEx with storage panel)
      // - UPS含库板数 (UPS with storage panel)
      // - 完成时间 (Completion time)
      // - 人数 (People count)
      // - 备注 (Remarks)

      // Process data and generate analysis
      // Map column names (check if they exist, otherwise use defaults)
      const findColumnName = (possibleNames) => {
        for (const name of possibleNames) {
          const key = Object.keys(data[0] || {}).find((k) =>
            k.toLowerCase().includes(name.toLowerCase())
          );
          if (key) return key;
        }
        return null;
      };

      const dateColumn = findColumnName(["日期", "date", "日", "时间"]);
      const totalColumn = findColumnName([
        "寄件总量",
        "总量",
        "total",
        "shipments",
      ]);
      const newSystemColumn = findColumnName([
        "新系统总量",
        "新系统",
        "new system",
      ]);
      const fedexColumn = findColumnName(["fedex总数量", "fedex总数", "fedex"]);
      const upsColumn = findColumnName(["ups总数量", "ups总数", "ups"]);
      const fedexA008Column = findColumnName(["fedex中a008", "fedex a008"]);
      const upsA008Column = findColumnName(["ups中a008", "ups a008"]);
      const batteryColumn = findColumnName(["电池板数", "电池"]);
      const fedexStorageColumn = findColumnName(["fedex含库板数", "fedex库板"]);
      const upsStorageColumn = findColumnName(["ups含库板数", "ups库板"]);
      const completionTimeColumn = findColumnName(["完成时间", "完成"]);
      const peopleCountColumn = findColumnName(["人数", "人员"]);
      const remarksColumn = findColumnName(["备注", "remarks", "notes"]);

      // Convert to numeric values where needed
      const processedData = data.map((row) => {
        const newRow = { ...row };

        // Convert numeric columns to numbers
        [
          totalColumn,
          newSystemColumn,
          fedexColumn,
          upsColumn,
          fedexA008Column,
          upsA008Column,
          batteryColumn,
          fedexStorageColumn,
          upsStorageColumn,
          peopleCountColumn,
        ].forEach((col) => {
          if (col && newRow[col]) {
            newRow[col] = parseFloat(newRow[col]) || 0;
          }
        });

        return newRow;
      });

      // 修正1：总寄件量应该是FedEx总量加UPS总量
      const fedexCount = processedData.reduce(
        (sum, row) =>
          sum + (fedexColumn && row[fedexColumn] ? row[fedexColumn] : 0),
        0
      );

      const upsCount = processedData.reduce(
        (sum, row) => sum + (upsColumn && row[upsColumn] ? row[upsColumn] : 0),
        0
      );

      const totalShipments = fedexCount + upsCount;

      // Calculate A008 orders for both couriers
      const fedexA008Count = processedData.reduce(
        (sum, row) =>
          sum +
          (fedexA008Column && row[fedexA008Column] ? row[fedexA008Column] : 0),
        0
      );

      const upsA008Count = processedData.reduce(
        (sum, row) =>
          sum + (upsA008Column && row[upsA008Column] ? row[upsA008Column] : 0),
        0
      );

      // Calculate battery panel and storage panel counts
      const batteryCount = processedData.reduce(
        (sum, row) =>
          sum + (batteryColumn && row[batteryColumn] ? row[batteryColumn] : 0),
        0
      );

      const fedexStorageCount = processedData.reduce(
        (sum, row) =>
          sum +
          (fedexStorageColumn && row[fedexStorageColumn]
            ? row[fedexStorageColumn]
            : 0),
        0
      );

      const upsStorageCount = processedData.reduce(
        (sum, row) =>
          sum +
          (upsStorageColumn && row[upsStorageColumn]
            ? row[upsStorageColumn]
            : 0),
        0
      );

      // 修正2：计算完成率（六点前完成视为完成，六点后视为未完成）
      const completedCount = processedData.filter((row) => {
        if (!completionTimeColumn || !row[completionTimeColumn]) return false;

        // 解析完成时间
        const timeString = row[completionTimeColumn].toString();
        const timeParts = timeString.split(":");
        if (timeParts.length < 2) return false;

        const hours = parseInt(timeParts[0]);
        return hours < 18; // 18:00之前视为完成
      }).length;

      const completionRate = (
        (completedCount / processedData.length) *
        100
      ).toFixed(1);

      // 格式化日期，确保是YYYY-MM-DD格式
      const formatDate = (dateStr) => {
        if (!dateStr) return "Unknown";

        // 如果日期格式是"4/8"这样的格式，添加年份
        if (/^\d+\/\d+$/.test(dateStr)) {
          return dateStr + "/2025";
        }

        return dateStr;
      };

      // Group data by date for daily trend
      const dailyTrend = processedData.map((row) => {
        return {
          date:
            dateColumn && row[dateColumn]
              ? formatDate(row[dateColumn].toString())
              : "Unknown",
          totalCount:
            fedexColumn && upsColumn
              ? (row[fedexColumn] || 0) + (row[upsColumn] || 0)
              : totalColumn && row[totalColumn]
              ? row[totalColumn]
              : 0,
          fedexCount: fedexColumn && row[fedexColumn] ? row[fedexColumn] : 0,
          upsCount: upsColumn && row[upsColumn] ? row[upsColumn] : 0,
          fedexA008Count:
            fedexA008Column && row[fedexA008Column] ? row[fedexA008Column] : 0,
          upsA008Count:
            upsA008Column && row[upsA008Column] ? row[upsA008Column] : 0,
          batteryCount:
            batteryColumn && row[batteryColumn] ? row[batteryColumn] : 0,
          fedexStorageCount:
            fedexStorageColumn && row[fedexStorageColumn]
              ? row[fedexStorageColumn]
              : 0,
          upsStorageCount:
            upsStorageColumn && row[upsStorageColumn]
              ? row[upsStorageColumn]
              : 0,
          completionTime:
            completionTimeColumn && row[completionTimeColumn]
              ? row[completionTimeColumn].toString()
              : "-",
        };
      });

      // Sort by date if possible
      if (dateColumn) {
        dailyTrend.sort((a, b) => {
          if (a.date < b.date) return -1;
          if (a.date > b.date) return 1;
          return 0;
        });
      }

      // Calculate average shipments per day
      const averageShipmentsPerDay = Math.round(
        totalShipments / (dailyTrend.length || 1)
      );

      // Generate analysis data
      const analysisResult = {
        totalShipments,
        fedexCount,
        upsCount,
        fedexA008Count,
        upsA008Count,
        batteryCount,
        fedexStorageCount,
        upsStorageCount,
        completionRate,
        averageShipmentsPerDay,
        dailyTrend,
        rawData: processedData,
        columnMapping: {
          dateColumn,
          totalColumn,
          fedexColumn,
          upsColumn,
          fedexA008Column,
          upsA008Column,
          batteryColumn,
          fedexStorageColumn,
          upsStorageColumn,
          completionTimeColumn,
          peopleCountColumn,
          remarksColumn,
        },
      };

      setAnalysisData(analysisResult);
    } catch (error) {
      console.error("Error analyzing data:", error);
      // Show a simplified analysis for any valid data
      const totalShipments = data.length;
      setAnalysisData({
        totalShipments,
        fedexCount: 0,
        upsCount: 0,
        completionRate: "0.0",
        dailyTrend: [],
        rawData: data,
      });
    }
  };

  return (
    <Layout className="app-layout">
      <Header />
      <Content className="app-content">
        <div className="container">
          <FileUpload onDataAnalysis={handleDataAnalysis} />
          {analysisData && <DataAnalysis data={analysisData} />}
        </div>
      </Content>
    </Layout>
  );
}

export default App;
