// src/components/ExceptionRecordManagement.js
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
import { useExceptionData } from "../hooks/useExceptionData";
import ExceptionForm from "./ExceptionForm";
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

// 解析日期用于排序和按月分组
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

// 获取异常类型标签
const getExceptionTypeTag = (type) => {
  switch (type) {
    case "无轨迹":
      return <Tag color="warning">{type}</Tag>;
    case "缺货":
      return <Tag color="error">{type}</Tag>;
    case "错发":
      return <Tag color="processing">{type}</Tag>;
    default:
      return <Tag>{type}</Tag>;
  }
};

// 快递公司判断
const getCourierCompany = (trackingNumber) => {
  if (!trackingNumber) return "未知";
  
  if (trackingNumber.startsWith('1Z') || /^[A-Z0-9]{18}$/.test(trackingNumber)) {
    return "UPS";
  } else if (/^\d{12}$/.test(trackingNumber) || /^\d{15}$/.test(trackingNumber)) {
    return "FedEx";
  } else {
    return "未知";
  }
};

// 获取快递公司标签
const getCourierCompanyTag = (trackingNumber) => {
  const company = getCourierCompany(trackingNumber);
  switch (company) {
    case "FedEx":
      return <Tag color="purple">{company}</Tag>;
    case "UPS":
      return <Tag color="blue">{company}</Tag>;
    default:
      return <Tag>{company}</Tag>;
  }
};

const ExceptionRecordManagement = () => {
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
  } = useExceptionData();

  const [formVisible, setFormVisible] = useState(false);
  const [currentData, setCurrentData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all"); // 默认显示所有类型
  const [courierFilter, setCourierFilter] = useState("all"); // 默认显示所有快递公司
  const [searchText, setSearchText] = useState(""); // 搜索文本
  const [filteredData, setFilteredData] = useState([]);
  const [groupedByMonth, setGroupedByMonth] = useState({}); // 按月份分组的数据

  useEffect(() => {
    if (error) {
      message.error(error);
    }
  }, [error]);

  // 根据类型和搜索文本筛选数据
  useEffect(() => {
    if (!data || data.length === 0) {
      setFilteredData([]);
      setGroupedByMonth({});
      return;
    }

    let filteredResult = [...data];

    // 类型筛选
    if (typeFilter !== "all") {
      filteredResult = filteredResult.filter(
        (item) => item.异常类型 === typeFilter
      );
    }

    // 快递公司筛选
    if (courierFilter !== "all") {
      filteredResult = filteredResult.filter(
        (item) => getCourierCompany(item.跟踪号码) === courierFilter
      );
    }

    // 搜索文本筛选
    if (searchText) {
      const lowerSearchText = searchText.toLowerCase();
      filteredResult = filteredResult.filter(
        (item) =>
          (item.客户代码 &&
            item.客户代码.toLowerCase().includes(lowerSearchText)) ||
          (item.跟踪号码 &&
            item.跟踪号码.toLowerCase().includes(lowerSearchText)) ||
          (item.SKU && item.SKU.toLowerCase().includes(lowerSearchText)) ||
          (item.备注 && item.备注.toLowerCase().includes(lowerSearchText))
      );
    }

    setFilteredData(filteredResult);

    // 按月份分组
    const grouped = {};
    filteredResult.forEach((item) => {
      const date = parseDateForSort(item.日期);
      if (date) {
        const monthYear = `${date.getFullYear()}年${date.getMonth() + 1}月`;
        if (!grouped[monthYear]) {
          grouped[monthYear] = [];
        }
        grouped[monthYear].push(item);
      }
    });
    
    // 对每个月内的记录按日期降序排序
    Object.keys(grouped).forEach(monthYear => {
      grouped[monthYear].sort((a, b) => {
        const dateA = parseDateForSort(a.日期);
        const dateB = parseDateForSort(b.日期);
        return dateB - dateA;
      });
    });
    
    // 按月份降序排序
    const sortedMonths = Object.keys(grouped).sort((a, b) => {
      const [yearA, monthA] = a.replace(/[^0-9]/g, ' ').trim().split(' ');
      const [yearB, monthB] = b.replace(/[^0-9]/g, ' ').trim().split(' ');
      
      if (yearA !== yearB) {
        return parseInt(yearB) - parseInt(yearA);
      }
      return parseInt(monthB) - parseInt(monthA);
    });
    
    const sortedGrouped = {};
    sortedMonths.forEach(month => {
      sortedGrouped[month] = grouped[month];
    });
    
    setGroupedByMonth(sortedGrouped);
  }, [data, typeFilter, courierFilter, searchText]);

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
      message.success("异常记录删除成功");
    }
  };

  const handleFormSubmit = async (values) => {
    if (isEditing && currentData) {
      const success = await updateData(currentData._id, values);
      if (success) {
        setFormVisible(false);
        message.success("异常记录更新成功");
      }
    } else {
      const success = await addData(values);
      if (success) {
        setFormVisible(false);
        message.success("异常记录添加成功");
      }
    }
  };

  const handleFormCancel = () => {
    setFormVisible(false);
  };

  const handleRefresh = () => {
    fetchData();
  };

  const handleTypeFilterChange = (value) => {
    setTypeFilter(value);
  };

  const handleCourierFilterChange = (value) => {
    setCourierFilter(value);
  };

  // 表格列定义
  const columns = [
    {
      title: "异常类型",
      dataIndex: "异常类型",
      key: "异常类型",
      render: (text) => getExceptionTypeTag(text),
      width: 90,
    },
    {
      title: "快递公司",
      key: "快递公司",
      render: (_, record) => getCourierCompanyTag(record.跟踪号码),
      width: 80,
    },
    {
      title: "日期",
      dataIndex: "日期",
      key: "日期",
      render: (text) => formatDisplayDate(text),
      width: 90,
    },
    {
      title: "客户代码",
      dataIndex: "客户代码",
      key: "客户代码",
      width: 120,
    },
    {
      title: "跟踪号码",
      dataIndex: "跟踪号码",
      key: "跟踪号码",
      width: 150,
    },
    {
      title: "SKU",
      dataIndex: "SKU",
      key: "SKU",
      width: 150,
    },
    {
      title: "备注",
      dataIndex: "备注",
      key: "备注",
      ellipsis: true,
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
            title="确定要删除此条异常记录吗?"
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
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "16px",
        paddingBottom: "8px",
        borderBottom: "1px solid #f0f0f0"
      }}>
        <Title level={4} style={{ margin: 0 }}>异常记录管理</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddClick}
        >
          添加异常记录
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
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
          <Input
            placeholder="搜索客户代码/跟踪号/SKU"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
          <span>
            <FilterOutlined /> 异常类型:{" "}
          </span>
          <Select
            value={typeFilter}
            onChange={handleTypeFilterChange}
            style={{ width: 120 }}
          >
            <Option value="all">全部</Option>
            <Option value="无轨迹">无轨迹</Option>
            <Option value="缺货">缺货</Option>
            <Option value="错发">错发</Option>
          </Select>
          <span>
            <FilterOutlined /> 快递公司:{" "}
          </span>
          <Select
            value={courierFilter}
            onChange={handleCourierFilterChange}
            style={{ width: 120 }}
          >
            <Option value="all">全部</Option>
            <Option value="FedEx">FedEx</Option>
            <Option value="UPS">UPS</Option>
            <Option value="未知">未知</Option>
          </Select>
        </div>
      </div>

      {/* 按月份分组显示异常记录 */}
      {Object.keys(groupedByMonth).length === 0 ? (
        <div style={{ 
          textAlign: "center", 
          padding: "50px 20px", 
          background: "#fff", 
          border: "1px solid #f0f0f0", 
          borderRadius: "2px" 
        }}>
          <Text type="secondary">没有符合条件的异常记录</Text>
        </div>
      ) : (
        Object.entries(groupedByMonth).map(([month, records]) => (
          <div key={month} style={{ 
            marginBottom: 24, 
            background: "#fff", 
            border: "1px solid #f0f0f0", 
            borderRadius: "2px" 
          }}>
            <div style={{ 
              padding: "10px 16px", 
              fontWeight: "bold", 
              fontSize: "16px", 
              borderBottom: "1px solid #f0f0f0",
              backgroundColor: "#fafafa" 
            }}>
              {month} ({records.length}条记录)
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
                scroll={{ x: 800 }}
                bordered
              />
            </div>
          </div>
        ))
      )}

      <ExceptionForm
        visible={formVisible}
        initialValues={currentData}
        onSubmit={handleFormSubmit}
        onCancel={handleFormCancel}
        title={isEditing ? "编辑异常记录" : "添加异常记录"}
      />
    </div>
  );
};

export default ExceptionRecordManagement;