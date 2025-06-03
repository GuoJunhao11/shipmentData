// src/components/ContainerManagement.js - 修改为按工作周分组
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

// 检查是否有工作记录（用于判断周六是否工作）
const hasWorkRecords = (data, date) => {
  const dateStr = moment(date).format("MM/DD/YYYY");
  return data.some(record => {
    const recordDate = formatDisplayDate(record.日期);
    return recordDate === dateStr;
  });
};

// 获取工作周范围字符串
const getWorkWeekRange = (date, allData) => {
  const momentDate = moment(date);
  const dayOfWeek = momentDate.day(); // 0=周日, 1=周一, ..., 6=周六
  
  let startOfWorkWeek, endOfWorkWeek;
  
  if (dayOfWeek === 0) {
    // 如果是周日，归到下一周
    startOfWorkWeek = momentDate.clone().add(1, 'day'); // 下周一
    endOfWorkWeek = startOfWorkWeek.clone().add(4, 'days'); // 下周五
  } else {
    // 找到当前工作周的周一
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startOfWorkWeek = momentDate.clone().subtract(daysFromMonday, 'days');
    
    // 工作周结束默认是周五
    endOfWorkWeek = startOfWorkWeek.clone().add(4, 'days');
    
    // 检查周六是否有工作记录
    const saturday = startOfWorkWeek.clone().add(5, 'days');
    if (hasWorkRecords(allData, saturday)) {
      endOfWorkWeek = saturday; // 如果周六有工作，延长到周六
    }
  }
  
  // 格式化显示
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
    // 如果是周日，归到下一周
    startOfWorkWeek = momentDate.clone().add(1, 'day');
  } else {
    // 找到当前工作周的周一
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startOfWorkWeek = momentDate.clone().subtract(daysFromMonday, 'days');
  }
  
  const year = startOfWorkWeek.year();
  const week = startOfWorkWeek.week();
  
  return `${year}-W${week.toString().padStart(2, "0")}`;
};

// 判断记录是否属于某个工作周
const belongsToWorkWeek = (recordDate, weekStartDate, allData) => {
  const record = moment(recordDate);
  const weekStart = moment(weekStartDate);
  const weekEnd = weekStart.clone().add(4, 'days'); // 默认周五结束
  
  // 检查周六是否有工作记录
  const saturday = weekStart.clone().add(5, 'days');
  const hasSaturdayWork = hasWorkRecords(allData, saturday);
  
  if (hasSaturdayWork) {
    weekEnd.add(1, 'day'); // 延长到周六
  }
  
  return record.isBetween(weekStart, weekEnd, 'day', '[]'); // 包含边界
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
  const [groupedByWorkWeek, setGroupedByWorkWeek] = useState({}); // 按工作周分组的数据

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

    // 按工作周分组
    const workWeekGroups = {};
    
    filteredResult.forEach((item) => {
      const date = parseDateForSort(item.日期);
      if (date) {
        const workWeekKey = getWorkWeekKey(date, filteredResult);
        
        if (!workWeekGroups[workWeekKey]) {
          workWeekGroups[workWeekKey] = {
            workWeekRange: getWorkWeekRange(date, filteredResult),
            records: [],
            startDate: null
          };
        }
        
        workWeekGroups[workWeekKey].records.push(item);
        
        // 记录这个工作周的开始日期，用于后续判断
        if (!workWeekGroups[workWeekKey].startDate) {
          const momentDate = moment(date);
          const dayOfWeek = momentDate.day();
          let startOfWorkWeek;
          
          if (dayOfWeek === 0) {
            startOfWorkWeek = momentDate.clone().add(1, 'day');
          } else {
            const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            startOfWorkWeek = momentDate.clone().subtract(daysFromMonday, 'days');
          }
          
          workWeekGroups[workWeekKey].startDate = startOfWorkWeek;
        }
      }
    });

    // 重新检查每个记录是否真正属于其工作周（处理跨周边界情况）
    const finalGroups = {};
    
    Object.keys(workWeekGroups).forEach(weekKey => {
      const group = workWeekGroups[weekKey];
      const validRecords = group.records.filter(record => {
        const recordDate = parseDateForSort(record.日期);
        return belongsToWorkWeek(recordDate, group.startDate, filteredResult);
      });
      
      if (validRecords.length > 0) {
        finalGroups[weekKey] = {
          ...group,
          records: validRecords
        };
      }
    });

    // 对每个工作周内的记录按日期降序排序
    Object.keys(finalGroups).forEach((weekKey) => {
      finalGroups[weekKey].records.sort((a, b) => {
        const dateA = parseDateForSort(a.日期);
        const dateB = parseDateForSort(b.日期);
        return dateB - dateA;
      });
    });

    // 按工作周降序排序（最新的工作周在前）
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
          集装箱/托盘到柜管理 (按工作周分组)
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
            <div
              style={{
                padding: "10px 16px",
                fontWeight: "bold",
                fontSize: "16px",
                borderBottom: "1px solid #f0f0f0",
                backgroundColor: "#fafafa",
              }}
            >
              工作周: {weekData.workWeekRange} ({weekData.records.length}条记录)
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