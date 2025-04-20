import React, { useState } from "react";
import { Upload, Button, message, Card, Space } from "antd";
import { InboxOutlined, DatabaseOutlined } from "@ant-design/icons";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { sampleData } from "../sampleData";

const { Dragger } = Upload;

function FileUpload({ onDataAnalysis }) {
  const [loading, setLoading] = useState(false);

  // Configure the file upload component
  const uploadProps = {
    name: "file",
    multiple: false,
    accept: ".xlsx,.xls,.csv",
    showUploadList: false,
    beforeUpload: (file) => {
      const isExcelOrCsv =
        file.type ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.type === "application/vnd.ms-excel" ||
        file.type === "text/csv" ||
        /\.(xlsx|xls|csv)$/i.test(file.name);

      if (!isExcelOrCsv) {
        message.error("只支持上传Excel和CSV文件!");
        return Upload.LIST_IGNORE;
      }

      // Process the file
      processFile(file);
      return false; // Prevent default upload behavior
    },
    customRequest: () => {}, // Prevent default upload request
  };

  // Process the uploaded file
  const processFile = (file) => {
    setLoading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const fileType = file.name.split(".").pop().toLowerCase();
        let parsedData = [];

        if (fileType === "csv") {
          // Parse CSV
          const result = Papa.parse(data, { header: true });
          parsedData = result.data;
        } else {
          // Parse Excel
          const workbook = XLSX.read(data, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          parsedData = XLSX.utils.sheet_to_json(worksheet);
        }

        // Filter out empty rows
        parsedData = parsedData.filter((row) =>
          Object.values(row).some((value) => value)
        );

        if (parsedData.length === 0) {
          message.error("文件中没有有效数据!");
          setLoading(false);
          return;
        }

        // Send data for analysis
        onDataAnalysis(parsedData);
        message.success(`成功处理 ${parsedData.length} 条记录`);
      } catch (error) {
        console.error("File processing error:", error);
        message.error("处理文件时出错，请检查文件格式是否正确");
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = () => {
      message.error("读取文件失败");
      setLoading(false);
    };

    if (file.type === "text/csv" || file.name.endsWith(".csv")) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  };

  // Load sample data for demo
  const loadSampleData = () => {
    setLoading(true);

    try {
      // Send sample data for analysis
      onDataAnalysis(sampleData);
      message.success(`成功载入样例数据 (${sampleData.length} 条记录)`);
    } catch (error) {
      console.error("Sample data loading error:", error);
      message.error("加载样例数据时出错");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="文件导入" className="card">
      <Dragger {...uploadProps} disabled={loading}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined style={{ color: "#1890ff", fontSize: 56 }} />
        </p>
        <p className="ant-upload-text">
          拖拽Excel文件到这里，或点击下方按钮上传
        </p>
        <p className="ant-upload-hint">支持Excel(.xlsx, .xls)和CSV文件格式</p>
        <Space>
          <Button type="primary" loading={loading} style={{ marginTop: 16 }}>
            选择文件
          </Button>
          <Button
            icon={<DatabaseOutlined />}
            onClick={loadSampleData}
            disabled={loading}
            style={{ marginTop: 16 }}
          >
            载入样例数据
          </Button>
        </Space>
      </Dragger>
    </Card>
  );
}

export default FileUpload;
