// src/components/ExceptionRecordManagement.js
import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Space,
  Popconfirm,
  message,
  Card,
  Row,
  Col,
  Select,
  Tag,
  Typography,
  Divider,
  Input,
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
  const [timeRange, setTimeRange] = useState("all"); // 默认显示所有数据
  const [typeFilter, setTypeFilter] = useState("all"); // 默认显示所有类型
  const [searchText, setSearchText] = useState(""); // 搜索文本
  const [filteredData, setFilteredData] = useState([]);
  const [groupedData, setGroupedData] = useState({}); // 按日期分组的数据

  useEffect(() => {
    if (error) {
      message.error(error);
    }
  }, [error]);

  // 根据时间范围、类型和搜索文本筛选数据
  useEffect(() => {
    if (!data || data.length === 0) {
      setFilteredData([]);
      setGroupedData({});
      return;
    }

    const currentDate = moment();
    let filteredResult = [...data];

    // 时间范围筛选
    switch (timeRange) {
      case "week":
        // 过去一周的数据
        filteredResult = data.filter((item) => {
          const itemDate = parseDateForSort(item.日期);
          return itemDate && currentDate.diff(moment(itemDate), "days") < 7;
        });
        break;
      case "month":
        // 过去一个月的数据
        filteredResult = data.filter((item) => {
          const itemDate = parseDateForSort(item.日期);
          return itemDate && currentDate.diff(moment(itemDate), "days") < 30;
        });
        break;
      case "quarter":
        // 过去三个月的数据
        filteredResult = data.filter((item) => {
          const itemDate = parseDateForSort(item.日期);
          return itemDate && currentDate.diff(moment(itemDate), "days") < 90;
        });
        break;
      default:
        // 全部数据
        filteredResult = [...data];
    }

    // 类型筛选
    if (typeFilter !== "all") {
      filteredResult = filteredResult.filter(
        (item) => item.异常类型 === typeFilter
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

    // 按日期排序（新的在前）
    filteredResult.sort((a, b) => {
      const dateA = parseDateForSort(a.日期);
      const dateB = parseDateForSort(b.日期);
      if (!dateA || !dateB) return 0;
      return dateB - dateA;
    });

    setFilteredData(filteredResult);

    // 按日期分组
    const grouped = {};
    filteredResult.forEach((item) => {
      const date = item.日期;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(item);
    });
    
    // 按日期排序（新的在前）
    const sortedGroupedData = Object.keys(grouped)
      .sort((a, b) => {
        const dateA = parseDateForSort(a);
        const dateB = parseDateForSort(b);
        return dateB - dateA;
      })
      .reduce((acc, key) => {
        acc[key] = grouped[key];
        return acc;
      }, {});

    setGroupedData(sortedGroupedData);
  }, [data, timeRange, typeFilter, searchText]);

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

  const handleTimeRangeChange = (value) => {
    setTimeRange(value);
  };

  const handleTypeFilterChange = (value) => {
    setTypeFilter(value);
  };

  // 表格列定义
  const columns = [
    {
      title: "异常类型",
      dataIndex: "异常类型",
      key: "异常类型",
      render: (text) => getExceptionTypeTag(text),
      filters: [
        { text: "无轨迹", value: "无轨迹" },
        { text: "缺货", value: "缺货" },
        { text: "错发", value: "错发" },
      ],
      onFilter: (value, record) => record.异常类型.indexOf(value) === 0,
      width: 100,
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
      fixed: "right",
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

      <Card title="异常记录管理" style={{ marginBottom: 20 }}>
        <div
          style={{
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
          className="management-actions"
        >
          <Space wrap>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddClick}
            >
              添加异常记录
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
              刷新数据
            </Button>
          </Space>
          <Space wrap>
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
          </Space>
        </div>

        {/* 按日期分组显示异常记录 */}
        {Object.keys(groupedData).length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <Text type="secondary">没有符合条件的异常记录</Text>
          </div>
        ) : (
          Object.entries(groupedData).map(([date, records]) => (
            <div key={date} style={{ marginBottom: 24 }}>
              <Divider orientation="left">
                <Title level={5} style={{ margin: 0 }}>
                  {formatDisplayDate(date)}
                </Title>
              </Divider>
              <Table
                columns={columns}
                dataSource={records.map((item) => ({
                  ...item,
                  key: item._id,
                }))}
                loading={loading}
                pagination={false}
                size="small"
                scroll={{ x: 800 }}
                bordered
              />
            </div>
          ))
        )}
      </Card>

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