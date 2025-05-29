// src/components/InventoryExceptionManagement.js
import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Space,
  Popconfirm,
  message,
  Input,
  Select,
  Typography,
  Tag,
  Divider,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  FilterOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useInventoryData } from "../hooks/useInventoryData";
import InventoryExceptionForm from "./InventoryExceptionForm";
import ServerStatus from "./ServerStatus";
import moment from "moment";

const { Option } = Select;
const { Title, Text } = Typography;

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

// 解析日期用于排序
const parseDateForSort = (dateStr) => {
  if (!dateStr) return new Date(0);

  try {
    if (dateStr.includes("T")) {
      return new Date(dateStr);
    }

    if (dateStr.includes("/")) {
      const parts = dateStr.split("/");
      if (parts.length === 3) {
        // MM/DD/YYYY
        return new Date(parts[2], parts[0] - 1, parts[1]);
      } else if (parts.length === 2) {
        // M/D
        const currentYear = new Date().getFullYear();
        return new Date(currentYear, parts[0] - 1, parts[1]);
      }
    }

    return new Date(dateStr);
  } catch (e) {
    console.error("日期解析错误:", e);
    return new Date(0);
  }
};

// 获取差异状态标签
const getDifferenceTag = (actual, system) => {
  const difference = actual - system;
  if (difference > 0) {
    return <Tag color="success">盈余 +{difference}</Tag>;
  } else if (difference < 0) {
    return <Tag color="error">亏损 {difference}</Tag>;
  } else {
    return <Tag color="default">正常 0</Tag>;
  }
};

const InventoryExceptionManagement = () => {
  const {
    data,
    loading,
    error,
    serverStatus,
    fetchData,
    addData,
    updateData,
    removeData,
    checkStatus,
  } = useInventoryData();

  const [formVisible, setFormVisible] = useState(false);
  const [currentData, setCurrentData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [timeRange, setTimeRange] = useState("all"); // 默认显示所有数据
  const [searchText, setSearchText] = useState(""); // 搜索文本
  const [filteredData, setFilteredData] = useState([]);
  const [groupedByCustomer, setGroupedByCustomer] = useState({}); // 按客户分组的数据

  useEffect(() => {
    if (error) {
      message.error(error);
    }
  }, [error]);

  // 根据时间范围和搜索文本筛选数据
  useEffect(() => {
    if (!data || data.length === 0) {
      setFilteredData([]);
      setGroupedByCustomer({});
      return;
    }

    const currentDate = moment();
    let filteredResult = [...data];

    // 时间范围筛选
    switch (timeRange) {
      case "week":
        filteredResult = data.filter((item) => {
          const itemDate = parseDateForSort(item.日期);
          return itemDate && currentDate.diff(moment(itemDate), "days") < 7;
        });
        break;
      case "month":
        filteredResult = data.filter((item) => {
          const itemDate = parseDateForSort(item.日期);
          return itemDate && currentDate.diff(moment(itemDate), "days") < 30;
        });
        break;
      case "quarter":
        filteredResult = data.filter((item) => {
          const itemDate = parseDateForSort(item.日期);
          return itemDate && currentDate.diff(moment(itemDate), "days") < 90;
        });
        break;
      default:
        filteredResult = [...data];
    }

    // 搜索文本筛选
    if (searchText) {
      const lowerSearchText = searchText.toLowerCase();
      filteredResult = filteredResult.filter(
        (item) =>
          (item.客户代码 &&
            item.客户代码.toLowerCase().includes(lowerSearchText)) ||
          (item.SKU && item.SKU.toLowerCase().includes(lowerSearchText)) ||
          (item.产品名 &&
            item.产品名.toLowerCase().includes(lowerSearchText)) ||
          (item.库位 && item.库位.toLowerCase().includes(lowerSearchText)) ||
          (item.备注 && item.备注.toLowerCase().includes(lowerSearchText))
      );
    }

    setFilteredData(filteredResult);

    // 按客户代码分组
    const grouped = {};
    filteredResult.forEach((item) => {
      const customerCode = item.客户代码 || "未知客户";
      if (!grouped[customerCode]) {
        grouped[customerCode] = [];
      }
      grouped[customerCode].push(item);
    });

    // 对每个客户内的记录按日期降序排序
    Object.keys(grouped).forEach((customerCode) => {
      grouped[customerCode].sort((a, b) => {
        const dateA = parseDateForSort(a.日期);
        const dateB = parseDateForSort(b.日期);
        return dateB - dateA;
      });
    });

    // 按客户代码排序
    const sortedCustomers = Object.keys(grouped).sort();
    const sortedGrouped = {};
    sortedCustomers.forEach((customer) => {
      sortedGrouped[customer] = grouped[customer];
    });

    setGroupedByCustomer(sortedGrouped);
  }, [data, timeRange, searchText]);

  const handleAddClick = () => {
    setCurrentData(null);
    setIsEditing(false);
    setFormVisible(true);
  };

  const handleEditClick = (record) => {
    setCurrentData(record);
    setIsEditing(true);
    setFormVisible(true);
  };

  const handleDeleteClick = async (id) => {
    const success = await removeData(id);
    if (success) {
      message.success("库存异常记录删除成功");
    }
  };

  const handleFormSubmit = async (values) => {
    if (isEditing && currentData) {
      const success = await updateData(currentData._id, values);
      if (success) {
        setFormVisible(false);
        message.success("库存异常记录更新成功");
      }
    } else {
      const success = await addData(values);
      if (success) {
        setFormVisible(false);
        message.success("库存异常记录添加成功");
      }
    }
  };

  const handleFormCancel = () => {
    setFormVisible(false);
  };

  const handleRefresh = () => {
    fetchData();
  };

  const handleTimeRangeChange = (value) => {
    setTimeRange(value);
  };

  // 表格列定义
  const columns = [
    {
      title: "日期",
      dataIndex: "日期",
      key: "日期",
      render: (text) => formatDisplayDate(text),
      width: 100,
      sorter: (a, b) => {
        const dateA = parseDateForSort(a.日期);
        const dateB = parseDateForSort(b.日期);
        return dateA - dateB;
      },
    },
    {
      title: "SKU",
      dataIndex: "SKU",
      key: "SKU",
      width: 150,
    },
    {
      title: "产品名",
      dataIndex: "产品名",
      key: "产品名",
      width: 200,
      ellipsis: true,
    },
    {
      title: "实际库存",
      dataIndex: "实际库存",
      key: "实际库存",
      width: 100,
      sorter: (a, b) => a.实际库存 - b.实际库存,
    },
    {
      title: "系统库存",
      dataIndex: "系统库存",
      key: "系统库存",
      width: 100,
      sorter: (a, b) => a.系统库存 - b.系统库存,
    },
    {
      title: "差异",
      key: "差异",
      width: 120,
      render: (_, record) => getDifferenceTag(record.实际库存, record.系统库存),
      sorter: (a, b) => a.实际库存 - a.系统库存 - (b.实际库存 - b.系统库存),
    },
    {
      title: "库位",
      dataIndex: "库位",
      key: "库位",
      width: 100,
    },
    {
      title: "备注",
      dataIndex: "备注",
      key: "备注",
      ellipsis: true,
      width: 150,
    },
    {
      title: "操作",
      key: "action",
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEditClick(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除此条库存异常记录吗?"
            onConfirm={() => handleDeleteClick(record._id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              size="small"
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <ServerStatus status={serverStatus} onCheckStatus={checkStatus} />

      {/* 管理标题和添加按钮 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
          paddingBottom: "8px",
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          库存异常记录管理
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddClick}>
          添加库存异常记录
        </Button>
      </div>

      {/* 操作按钮和筛选器 */}
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <div>
          <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
            刷新数据
          </Button>
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            alignItems: "center",
          }}
        >
          <Input
            placeholder="搜索客户代码/SKU/产品名/库位"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250 }}
            allowClear
          />
          <span>
            <FilterOutlined /> 时间范围:{" "}
          </span>
          <Select
            value={timeRange}
            onChange={handleTimeRangeChange}
            style={{ width: 120 }}
          >
            <Option value="all">全部</Option>
            <Option value="week">一周</Option>
            <Option value="month">一个月</Option>
            <Option value="quarter">三个月</Option>
          </Select>
        </div>
      </div>

      {/* 按客户分组显示库存异常记录 */}
      {Object.keys(groupedByCustomer).length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "50px 20px",
            background: "#fff",
            border: "1px solid #f0f0f0",
            borderRadius: "2px",
          }}
        >
          <Text type="secondary">没有符合条件的库存异常记录</Text>
        </div>
      ) : (
        Object.entries(groupedByCustomer).map(([customerCode, records]) => (
          <div
            key={customerCode}
            style={{
              marginBottom: 24,
              background: "#fff",
              border: "1px solid #f0f0f0",
              borderRadius: "2px",
            }}
          >
            <div
              style={{
                padding: "10px 16px",
                fontWeight: "bold",
                fontSize: "16px",
                borderBottom: "1px solid #f0f0f0",
                backgroundColor: "#fafafa",
              }}
            >
              客户代码: {customerCode} ({records.length}条记录)
            </div>
            <div style={{ padding: "16px" }}>
              <Table
                columns={columns}
                dataSource={records.map((item) => ({
                  ...item,
                  key: item._id,
                }))}
                loading={loading}
                pagination={records.length > 10 ? { pageSize: 10 } : false}
                size="small"
                scroll={{ x: 1200 }}
                bordered
              />
            </div>
          </div>
        ))
      )}

      <InventoryExceptionForm
        visible={formVisible}
        initialValues={currentData}
        onSubmit={handleFormSubmit}
        onCancel={handleFormCancel}
        title={isEditing ? "编辑库存异常记录" : "添加库存异常记录"}
      />
    </div>
  );
};

export default InventoryExceptionManagement;
