// src/components/ContainerManagement.js - 完整优化版
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
import "./ContainerManagement.css";

const { Option } = Select;
const { Title, Text } = Typography;

// 日期格式化辅助函数
const formatDisplayDate = (dateStr) => {
  if (!dateStr) return "";

  try {
    if (dateStr.includes("T")) {
      const date = new Date(dateStr);
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      const year = date.getFullYear();
      return `${month}/${day}/${year}`;
    }

    if (dateStr.includes("/")) {
      const parts = dateStr.split("/");
      if (parts.length === 3) {
        return dateStr;
      } else if (parts.length === 2) {
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
        return new Date(parts[2], parts[0] - 1, parts[1]);
      } else if (parts.length === 2) {
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

// 可点击切换的状态标签
const QuickStatusTag = ({ status, record, onStatusChange }) => {
  const statusFlow = {
    还未到仓库: "待拆柜",
    待拆柜: "已完成",
    已完成: "还未到仓库",
    有问题: "待拆柜",
  };

  const handleClick = async (e) => {
    e.stopPropagation();
    const nextStatus = statusFlow[status];
    if (nextStatus) {
      try {
        await onStatusChange(record._id, { ...record, 状态: nextStatus });
        message.success(`状态已更新为: ${nextStatus}`);
      } catch (error) {
        message.error("状态更新失败");
      }
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case "还未到仓库":
        return {
          color: "default",
          cursor: "pointer",
          title: "点击切换到 '待拆柜'",
        };
      case "已完成":
        return {
          color: "success",
          cursor: "pointer",
          title: "点击切换到 '还未到仓库'",
        };
      case "待拆柜":
        return {
          color: "processing",
          cursor: "pointer",
          title: "点击切换到 '已完成'",
        };
      case "有问题":
        return {
          color: "error",
          cursor: "pointer",
          title: "点击切换到 '待拆柜'",
        };
      default:
        return { color: "default", cursor: "default" };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Tag
      {...config}
      onClick={handleClick}
      style={{ cursor: config.cursor }}
      title={config.title}
      className="quick-status-tag"
    >
      {status}
    </Tag>
  );
};

// 快速筛选按钮组
const QuickFilterButtons = ({ data, statusFilter, onStatusFilterChange }) => {
  const getStatusCount = (status) => {
    if (status === "all") return data.length;
    return data.filter((item) => item.状态 === status).length;
  };

  const filterButtons = [
    { key: "all", label: "全部" },
    { key: "还未到仓库", label: "还未到仓库" },
    { key: "待拆柜", label: "待拆柜" },
    { key: "已完成", label: "已完成" },
    { key: "有问题", label: "有问题" },
  ];

  return (
    <div style={{ marginBottom: 16 }} className="quick-filter-buttons">
      <Space wrap>
        {filterButtons.map((button) => {
          const count = getStatusCount(button.key);
          const isActive = statusFilter === button.key;

          return (
            <Button
              key={button.key}
              type={isActive ? "primary" : "default"}
              size="small"
              onClick={() => onStatusFilterChange(button.key)}
              className="quick-filter-btn"
            >
              {button.label} ({count})
            </Button>
          );
        })}
      </Space>
    </div>
  );
};

// 工作周标题组件
const WorkWeekHeader = ({ weekData }) => {
  const statusCounts = {
    还未到仓库: 0,
    待拆柜: 0,
    已完成: 0,
    有问题: 0,
  };

  weekData.records.forEach((record) => {
    if (statusCounts.hasOwnProperty(record.状态)) {
      statusCounts[record.状态]++;
    }
  });

  return (
    <div
      className="work-week-header"
      style={{
        padding: "10px 16px",
        fontWeight: "bold",
        fontSize: "16px",
        borderBottom: "1px solid #f0f0f0",
        backgroundColor: "#fafafa",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "8px",
      }}
    >
      <span>
        工作周: {weekData.workWeekRange} ({weekData.records.length}条记录)
      </span>
      <Space wrap className="work-week-stats">
        {statusCounts["还未到仓库"] > 0 && (
          <Tag color="default">还未到仓库: {statusCounts["还未到仓库"]}</Tag>
        )}
        {statusCounts["待拆柜"] > 0 && (
          <Tag color="processing">待拆柜: {statusCounts["待拆柜"]}</Tag>
        )}
        {statusCounts["已完成"] > 0 && (
          <Tag color="success">已完成: {statusCounts["已完成"]}</Tag>
        )}
        {statusCounts["有问题"] > 0 && (
          <Tag color="error">有问题: {statusCounts["有问题"]}</Tag>
        )}
      </Space>
    </div>
  );
};

// 浮动添加按钮
const FloatingAddButton = ({ onClick }) => {
  return (
    <Button
      type="primary"
      icon={<PlusOutlined />}
      size="large"
      shape="circle"
      onClick={onClick}
      className="floating-add-btn"
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        width: "56px",
        height: "56px",
        zIndex: 1000,
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        fontSize: "20px",
      }}
      title="添加集装箱记录 (快捷键: N)"
    />
  );
};

// 检查是否有工作记录（用于判断周六是否工作）
const hasWorkRecords = (data, date) => {
  const dateStr = moment(date).format("MM/DD/YYYY");
  return data.some((record) => {
    const recordDate = formatDisplayDate(record.日期);
    return recordDate === dateStr;
  });
};

// 获取工作周范围字符串
const getWorkWeekRange = (date, allData) => {
  const momentDate = moment(date);
  const dayOfWeek = momentDate.day();

  let startOfWorkWeek, endOfWorkWeek;

  if (dayOfWeek === 0) {
    startOfWorkWeek = momentDate.clone().add(1, "day");
    endOfWorkWeek = startOfWorkWeek.clone().add(4, "days");
  } else {
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startOfWorkWeek = momentDate.clone().subtract(daysFromMonday, "days");
    endOfWorkWeek = startOfWorkWeek.clone().add(4, "days");

    const saturday = startOfWorkWeek.clone().add(5, "days");
    if (hasWorkRecords(allData, saturday)) {
      endOfWorkWeek = saturday;
    }
  }

  const startStr = startOfWorkWeek.format("MM/DD");
  const endStr = endOfWorkWeek.format("MM/DD/YYYY");

  return `${startStr} - ${endStr}`;
};

// 获取工作周的键值，用于排序和分组
const getWorkWeekKey = (date, allData) => {
  const momentDate = moment(date);
  const dayOfWeek = momentDate.day();

  let startOfWorkWeek;

  if (dayOfWeek === 0) {
    startOfWorkWeek = momentDate.clone().add(1, "day");
  } else {
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startOfWorkWeek = momentDate.clone().subtract(daysFromMonday, "days");
  }

  const year = startOfWorkWeek.year();
  const week = startOfWorkWeek.week();

  return `${year}-W${week.toString().padStart(2, "0")}`;
};

// 判断记录是否属于某个工作周
const belongsToWorkWeek = (recordDate, weekStartDate, allData) => {
  const record = moment(recordDate);
  const weekStart = moment(weekStartDate);
  const weekEnd = weekStart.clone().add(4, "days");

  const saturday = weekStart.clone().add(5, "days");
  const hasSaturdayWork = hasWorkRecords(allData, saturday);

  if (hasSaturdayWork) {
    weekEnd.add(1, "day");
  }

  return record.isBetween(weekStart, weekEnd, "day", "[]");
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
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [groupedByWorkWeek, setGroupedByWorkWeek] = useState({});

  // 快捷键支持
  useEffect(() => {
    const handleKeyPress = (event) => {
      const isInInput = ["INPUT", "TEXTAREA", "SELECT"].includes(
        event.target.tagName
      );
      const hasModifier = event.ctrlKey || event.metaKey || event.altKey;

      if (!isInInput && !hasModifier) {
        switch (event.key.toLowerCase()) {
          case "n":
            event.preventDefault();
            handleAddClick();
            break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, []);

  useEffect(() => {
    if (error) {
      message.error(error);
    }
  }, [error]);

  // 根据筛选条件和搜索文本筛选数据，并按工作周分组
  useEffect(() => {
    if (!data || data.length === 0) {
      setFilteredData([]);
      setGroupedByWorkWeek({});
      return;
    }

    let filteredResult = [...data];

    if (statusFilter !== "all") {
      filteredResult = filteredResult.filter(
        (item) => item.状态 === statusFilter
      );
    }

    if (typeFilter !== "all") {
      filteredResult = filteredResult.filter(
        (item) => item.类型 === typeFilter
      );
    }

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

    const workWeekGroups = {};

    filteredResult.forEach((item) => {
      const date = parseDateForSort(item.日期);
      if (date) {
        const workWeekKey = getWorkWeekKey(date, filteredResult);

        if (!workWeekGroups[workWeekKey]) {
          workWeekGroups[workWeekKey] = {
            workWeekRange: getWorkWeekRange(date, filteredResult),
            records: [],
            startDate: null,
          };
        }

        workWeekGroups[workWeekKey].records.push(item);

        if (!workWeekGroups[workWeekKey].startDate) {
          const momentDate = moment(date);
          const dayOfWeek = momentDate.day();
          let startOfWorkWeek;

          if (dayOfWeek === 0) {
            startOfWorkWeek = momentDate.clone().add(1, "day");
          } else {
            const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            startOfWorkWeek = momentDate
              .clone()
              .subtract(daysFromMonday, "days");
          }

          workWeekGroups[workWeekKey].startDate = startOfWorkWeek;
        }
      }
    });

    const finalGroups = {};

    Object.keys(workWeekGroups).forEach((weekKey) => {
      const group = workWeekGroups[weekKey];
      const validRecords = group.records.filter((record) => {
        const recordDate = parseDateForSort(record.日期);
        return belongsToWorkWeek(recordDate, group.startDate, filteredResult);
      });

      if (validRecords.length > 0) {
        finalGroups[weekKey] = {
          ...group,
          records: validRecords,
        };
      }
    });

    Object.keys(finalGroups).forEach((weekKey) => {
      finalGroups[weekKey].records.sort((a, b) => {
        const dateA = parseDateForSort(a.日期);
        const dateB = parseDateForSort(b.日期);
        return dateB - dateA;
      });
    });

    const sortedWeeks = Object.keys(finalGroups).sort((a, b) => {
      return b.localeCompare(a);
    });

    const sortedGrouped = {};
    sortedWeeks.forEach((weekKey) => {
      sortedGrouped[weekKey] = finalGroups[weekKey];
    });

    setGroupedByWorkWeek(sortedGrouped);
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

  // 状态快速更新
  const handleQuickStatusChange = async (id, updatedRecord) => {
    const success = await updateData(id, updatedRecord);
    if (!success) {
      throw new Error("更新失败");
    }
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
      render: (text, record) => (
        <QuickStatusTag
          status={text}
          record={record}
          onStatusChange={handleQuickStatusChange}
        />
      ),
      width: 120,
    },
    {
      title: "问题/备注",
      dataIndex: "问题",
      key: "问题",
      ellipsis: true,
      width: 200,
      render: (text) => text || "-",
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

  // 获取行的样式类名
  const getRowClassName = (record) => {
    switch (record.状态) {
      case "有问题":
        return "row-has-issue";
      case "已完成":
        return "row-completed";
      case "还未到仓库":
        return "row-pending";
      default:
        return "";
    }
  };

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
          集装箱/托盘到柜管理 (按工作周分组)
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddClick}>
          添加集装箱记录
        </Button>
      </div>

      {/* 快速筛选按钮组 */}
      <QuickFilterButtons
        data={filteredData}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
      />

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

      {/* 按工作周分组显示集装箱记录 */}
      {Object.keys(groupedByWorkWeek).length === 0 ? (
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
        Object.entries(groupedByWorkWeek).map(([weekKey, weekData]) => (
          <div
            key={weekKey}
            style={{
              marginBottom: 24,
              background: "#fff",
              border: "1px solid #f0f0f0",
              borderRadius: "2px",
            }}
          >
            <WorkWeekHeader weekData={weekData} />
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
                onRow={(record) => ({
                  onDoubleClick: () => {
                    handleEditClick(record);
                  },
                  style: { cursor: "pointer" },
                })}
                rowClassName={getRowClassName}
              />
            </div>
          </div>
        ))
      )}

      {/* 浮动添加按钮 */}
      <FloatingAddButton onClick={handleAddClick} />

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
