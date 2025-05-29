// src/components/ContainerManagement.js
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
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  FilterOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useContainerData } from "../hooks/useContainerData";
import ContainerForm from "./ContainerForm";
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

// 解析日期用于排序和分组
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

// 获取类型标签
const getTypeTag = (type) => {
  switch (type) {
    case "整柜":
      return <Tag color="blue">{type}</Tag>;
    case "散货":
      return <Tag color="orange">{type}</Tag>;
    case "托盘":
      return <Tag color="green">{type}</Tag>;
    default:
      return <Tag>{type}</Tag>;
  }
};

// 获取状态标签
const getStatusTag = (status) => {
  switch (status) {
    case "已完成":
      return <Tag color="success">{status}</Tag>;
    case "待拆柜":
      return <Tag color="processing">{status}</Tag>;
    case "待核实":
      return <Tag color="warning">{status}</Tag>;
    case "有问题":
      return <Tag color="error">{status}</Tag>;
    default:
      return <Tag>{status}</Tag>;
  }
};

// 获取周范围字符串
const getWeekRange = (date) => {
  const momentDate = moment(date);
  const startOfWeek = momentDate.clone().startOf("week"); // 默认周日开始
  const endOfWeek = momentDate.clone().endOf("week");

  return `${startOfWeek.format("MM/DD")} - ${endOfWeek.format("MM/DD/YYYY")}`;
};

// 获取周的年份和周数，用于排序
const getWeekKey = (date) => {
  const momentDate = moment(date);
  const year = momentDate.year();
  const week = momentDate.week();
  return `${year}-W${week.toString().padStart(2, "0")}`;
};

const ContainerManagement = () => {
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
  } = useContainerData();

  const [formVisible, setFormVisible] = useState(false);
  const [currentData, setCurrentData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all"); // 状态筛选
  const [typeFilter, setTypeFilter] = useState("all"); // 类型筛选
  const [searchText, setSearchText] = useState(""); // 搜索文本
  const [filteredData, setFilteredData] = useState([]);
  const [groupedByWeek, setGroupedByWeek] = useState({}); // 按周分组的数据

  useEffect(() => {
    if (error) {
      message.error(error);
    }
  }, [error]);

  // 根据筛选条件和搜索文本筛选数据
  useEffect(() => {
    if (!data || data.length === 0) {
      setFilteredData([]);
      setGroupedByWeek({});
      return;
    }

    let filteredResult = [...data];

    // 状态筛选
    if (statusFilter !== "all") {
      filteredResult = filteredResult.filter(
        (item) => item.状态 === statusFilter
      );
    }

    // 类型筛选
    if (typeFilter !== "all") {
      filteredResult = filteredResult.filter(
        (item) => item.类型 === typeFilter
      );
    }

    // 搜索文本筛选
    if (searchText) {
      const lowerSearchText = searchText.toLowerCase();
      filteredResult = filteredResult.filter(
        (item) =>
          (item.柜号 && item.柜号.toLowerCase().includes(lowerSearchText)) ||
          (item.客户代码 &&
            item.客户代码.toLowerCase().includes(lowerSearchText)) ||
          (item.问题 && item.问题.toLowerCase().includes(lowerSearchText))
      );
    }

    setFilteredData(filteredResult);

    // 按周分组
    const grouped = {};
    filteredResult.forEach((item) => {
      const date = parseDateForSort(item.日期);
      if (date) {
        const weekKey = getWeekKey(date);
        const weekRange = getWeekRange(date);

        if (!grouped[weekKey]) {
          grouped[weekKey] = {
            weekRange,
            records: [],
          };
        }
        grouped[weekKey].records.push(item);
      }
    });

    // 对每周内的记录按日期降序排序
    Object.keys(grouped).forEach((weekKey) => {
      grouped[weekKey].records.sort((a, b) => {
        const dateA = parseDateForSort(a.日期);
        const dateB = parseDateForSort(b.日期);
        return dateB - dateA;
      });
    });

    // 按周降序排序（最新的周在前）
    const sortedWeeks = Object.keys(grouped).sort((a, b) => {
      return b.localeCompare(a);
    });

    const sortedGrouped = {};
    sortedWeeks.forEach((weekKey) => {
      sortedGrouped[weekKey] = grouped[weekKey];
    });

    setGroupedByWeek(sortedGrouped);
  }, [data, statusFilter, typeFilter, searchText]);

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
      message.success("集装箱记录删除成功");
    }
  };

  const handleFormSubmit = async (values) => {
    if (isEditing && currentData) {
      const success = await updateData(currentData._id, values);
      if (success) {
        setFormVisible(false);
        message.success("集装箱记录更新成功");
      }
    } else {
      const success = await addData(values);
      if (success) {
        setFormVisible(false);
        message.success("集装箱记录添加成功");
      }
    }
  };

  const handleFormCancel = () => {
    setFormVisible(false);
  };

  const handleRefresh = () => {
    fetchData();
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
  };

  const handleTypeFilterChange = (value) => {
    setTypeFilter(value);
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
      title: "柜号",
      dataIndex: "柜号",
      key: "柜号",
      width: 150,
    },
    {
      title: "类型",
      dataIndex: "类型",
      key: "类型",
      render: (text) => getTypeTag(text),
      width: 80,
    },
    {
      title: "客户代码",
      dataIndex: "客户代码",
      key: "客户代码",
      width: 120,
    },
    {
      title: "到达时间",
      dataIndex: "到达时间",
      key: "到达时间",
      width: 100,
    },
    {
      title: "状态",
      dataIndex: "状态",
      key: "状态",
      render: (text) => getStatusTag(text),
      width: 100,
    },
    {
      title: "问题",
      dataIndex: "问题",
      key: "问题",
      ellipsis: true,
      width: 200,
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
            title="确定要删除此条集装箱记录吗?"
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
          集装箱/托盘到柜管理
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddClick}>
          添加集装箱记录
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
            placeholder="搜索柜号/客户代码/问题"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
          <span>
            <FilterOutlined /> 状态:{" "}
          </span>
          <Select
            value={statusFilter}
            onChange={handleStatusFilterChange}
            style={{ width: 120 }}
          >
            <Option value="all">全部</Option>
            <Option value="已完成">已完成</Option>
            <Option value="待拆柜">待拆柜</Option>
            <Option value="待核实">待核实</Option>
            <Option value="有问题">有问题</Option>
          </Select>
          <span>
            <FilterOutlined /> 类型:{" "}
          </span>
          <Select
            value={typeFilter}
            onChange={handleTypeFilterChange}
            style={{ width: 120 }}
          >
            <Option value="all">全部</Option>
            <Option value="整柜">整柜</Option>
            <Option value="散货">散货</Option>
            <Option value="托盘">托盘</Option>
          </Select>
        </div>
      </div>

      {/* 按周分组显示集装箱记录 */}
      {Object.keys(groupedByWeek).length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "50px 20px",
            background: "#fff",
            border: "1px solid #f0f0f0",
            borderRadius: "2px",
          }}
        >
          <Text type="secondary">没有符合条件的集装箱记录</Text>
        </div>
      ) : (
        Object.entries(groupedByWeek).map(([weekKey, weekData]) => (
          <div
            key={weekKey}
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
              {weekData.weekRange} ({weekData.records.length}条记录)
            </div>
            <div style={{ padding: "16px" }}>
              <Table
                columns={columns}
                dataSource={weekData.records.map((item) => ({
                  ...item,
                  key: item._id,
                }))}
                loading={loading}
                pagination={
                  weekData.records.length > 10 ? { pageSize: 10 } : false
                }
                size="small"
                scroll={{ x: 1000 }}
                bordered
              />
            </div>
          </div>
        ))
      )}

      <ContainerForm
        visible={formVisible}
        initialValues={currentData}
        onSubmit={handleFormSubmit}
        onCancel={handleFormCancel}
        title={isEditing ? "编辑集装箱记录" : "添加集装箱记录"}
      />
    </div>
  );
};

export default ContainerManagement;
