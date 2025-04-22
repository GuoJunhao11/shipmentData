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
  Statistic,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import { useExpressData } from "../hooks/useExpressData";
import ExpressDataForm from "./ExpressDataForm";
import ServerStatus from "./ServerStatus";
import moment from "moment";

const { Option } = Select;

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

const ExpressDataManagement = () => {
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
  } = useExpressData();

  const [formVisible, setFormVisible] = useState(false);
  const [currentData, setCurrentData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [timeRange, setTimeRange] = useState("all"); // 默认显示所有数据
  const [filteredData, setFilteredData] = useState([]);

  // 设置工作起始时间为09:00
  const workStartTime = "09:00";

  useEffect(() => {
    if (error) {
      message.error(error);
    }
  }, [error]);

  // 根据时间范围筛选数据
  useEffect(() => {
    if (!data || data.length === 0) {
      setFilteredData([]);
      return;
    }

    const currentDate = moment();
    let filteredResult = [...data];

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
      case "halfYear":
        // 过去六个月的数据
        filteredResult = data.filter((item) => {
          const itemDate = parseDateForSort(item.日期);
          return itemDate && currentDate.diff(moment(itemDate), "days") < 180;
        });
        break;
      case "year":
        // 过去一年的数据
        filteredResult = data.filter((item) => {
          const itemDate = parseDateForSort(item.日期);
          return itemDate && currentDate.diff(moment(itemDate), "days") < 365;
        });
        break;
      default:
        // 全部数据
        filteredResult = [...data];
    }

    // 按日期排序（新的在前）
    filteredResult.sort((a, b) => {
      const dateA = parseDateForSort(a.日期);
      const dateB = parseDateForSort(b.日期);
      if (!dateA || !dateB) return 0;
      return dateB - dateA;
    });

    setFilteredData(filteredResult);
  }, [data, timeRange]);

  // 计算效率（完成时间与上班时间的差值）
  const calculateEfficiency = (record) => {
    if (!record.完成时间 || !record.日期) return "N/A";

    const completionTime = moment(record.完成时间, "HH:mm");
    const startTime = moment(workStartTime, "HH:mm");

    // 如果完成时间早于上班时间，显示特殊提示
    if (completionTime.isBefore(startTime)) {
      return "提前完成";
    }

    const diffMinutes = completionTime.diff(startTime, "minutes");
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;

    return `${hours}小时${minutes}分钟`;
  };

  // 计算平均效率
  const calculateAverageEfficiency = () => {
    if (filteredData.length === 0) return "N/A";

    let totalMinutes = 0;
    let count = 0;

    filteredData.forEach((record) => {
      if (record.完成时间) {
        const completionTime = moment(record.完成时间, "HH:mm");
        const startTime = moment(workStartTime, "HH:mm");

        // 只计算有效的完成时间
        if (completionTime.isValid() && completionTime.isAfter(startTime)) {
          const diffMinutes = completionTime.diff(startTime, "minutes");
          totalMinutes += diffMinutes;
          count++;
        }
      }
    });

    if (count === 0) return "N/A";

    const avgMinutes = Math.round(totalMinutes / count);
    const hours = Math.floor(avgMinutes / 60);
    const minutes = avgMinutes % 60;

    return `${hours}小时${minutes}分钟`;
  };

  // 计算人均处理量
  const calculateAverageHandling = () => {
    if (filteredData.length === 0) return "N/A";

    let totalPackages = 0;
    let totalPeople = 0;

    filteredData.forEach((record) => {
      const totalCount = (record.FedEx总数量 || 0) + (record.UPS总数量 || 0);
      totalPackages += totalCount;
      totalPeople += record.人数 || 0;
    });

    if (totalPeople === 0) return "N/A";

    return (totalPackages / totalPeople).toFixed(1);
  };

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
      message.success("数据删除成功");
    }
  };

  const handleFormSubmit = async (values) => {
    if (isEditing && currentData) {
      const success = await updateData(currentData._id, values);
      if (success) {
        setFormVisible(false);
        message.success("数据更新成功");
      }
    } else {
      const success = await addData(values);
      if (success) {
        setFormVisible(false);
        message.success("数据添加成功");
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

  // 表格列定义 - 展示所有字段
  const columns = [
    {
      title: "日期",
      dataIndex: "日期",
      key: "日期",
      fixed: "left",
      width: 120,
      render: (text) => formatDisplayDate(text),
      sorter: (a, b) => {
        const dateA = parseDateForSort(a.日期);
        const dateB = parseDateForSort(b.日期);
        return dateA - dateB;
      },
    },
    {
      title: "易仓系统总量",
      dataIndex: "易仓系统总量",
      key: "易仓系统总量",
      width: 120,
      sorter: (a, b) => a.易仓系统总量 - b.易仓系统总量,
    },
    {
      title: "新系统总量",
      dataIndex: "新系统总量",
      key: "新系统总量",
      width: 120,
      sorter: (a, b) => a.新系统总量 - b.新系统总量,
    },
    {
      title: "FedEx总数量",
      dataIndex: "FedEx总数量",
      key: "FedEx总数量",
      width: 120,
      sorter: (a, b) => a.FedEx总数量 - b.FedEx总数量,
    },
    {
      title: "UPS总数量",
      dataIndex: "UPS总数量",
      key: "UPS总数量",
      width: 120,
      sorter: (a, b) => a.UPS总数量 - b.UPS总数量,
    },
    {
      title: "FedEx中A008订单数",
      dataIndex: "FedEx中A008订单数",
      key: "FedEx中A008订单数",
      width: 150,
      sorter: (a, b) => a.FedEx中A008订单数 - b.FedEx中A008订单数,
    },
    {
      title: "UPS中A008订单数",
      dataIndex: "UPS中A008订单数",
      key: "UPS中A008订单数",
      width: 150,
      sorter: (a, b) => a.UPS中A008订单数 - b.UPS中A008订单数,
    },
    {
      title: "电池板数",
      dataIndex: "电池板数",
      key: "电池板数",
      width: 100,
      sorter: (a, b) => a.电池板数 - b.电池板数,
    },
    {
      title: "FedEx含库板数",
      dataIndex: "FedEx含库板数",
      key: "FedEx含库板数",
      width: 130,
      sorter: (a, b) => a.FedEx含库板数 - b.FedEx含库板数,
    },
    {
      title: "UPS含库板数",
      dataIndex: "UPS含库板数",
      key: "UPS含库板数",
      width: 130,
      sorter: (a, b) => a.UPS含库板数 - b.UPS含库板数,
    },
    {
      title: "完成时间",
      dataIndex: "完成时间",
      key: "完成时间",
      width: 100,
      sorter: (a, b) => {
        const timeA = a.完成时间 ? moment(a.完成时间, "HH:mm") : null;
        const timeB = b.完成时间 ? moment(b.完成时间, "HH:mm") : null;
        if (!timeA || !timeB) return 0;
        return timeA - timeB;
      },
    },
    {
      title: "工作效率",
      key: "efficiency",
      width: 120,
      render: (_, record) => (
        <Tooltip title={`从上班时间(${workStartTime})到完成时间的耗时`}>
          {calculateEfficiency(record)}
        </Tooltip>
      ),
      sorter: (a, b) => {
        const timeA = a.完成时间 ? moment(a.完成时间, "HH:mm") : null;
        const timeB = b.完成时间 ? moment(b.完成时间, "HH:mm") : null;
        const startTime = moment(workStartTime, "HH:mm");
        if (!timeA || !timeB) return 0;
        return timeA.diff(startTime) - timeB.diff(startTime);
      },
    },
    {
      title: "人数",
      dataIndex: "人数",
      key: "人数",
      width: 80,
      sorter: (a, b) => a.人数 - b.人数,
    },
    {
      title: "人均处理",
      key: "averageHandling",
      width: 100,
      render: (_, record) => {
        const totalCount = (record.FedEx总数量 || 0) + (record.UPS总数量 || 0);
        return record.人数 ? (totalCount / record.人数).toFixed(1) : "N/A";
      },
      sorter: (a, b) => {
        const totalA = (a.FedEx总数量 || 0) + (a.UPS总数量 || 0);
        const totalB = (b.FedEx总数量 || 0) + (b.UPS总数量 || 0);
        const avgA = a.人数 ? totalA / a.人数 : 0;
        const avgB = b.人数 ? totalB / b.人数 : 0;
        return avgA - avgB;
      },
    },
    {
      title: "备注",
      dataIndex: "备注",
      key: "备注",
      width: 150,
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
            title="确定要删除此条数据吗?"
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

      {/* 统计卡片 */}
      <Card title="数据统计" style={{ marginBottom: 20 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="数据总条数"
              value={filteredData.length}
              suffix={`/${data.length}`}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="平均工作效率"
              value={calculateAverageEfficiency()}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="平均人均处理量"
              value={calculateAverageHandling()}
              suffix="单/人"
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="FedEx/UPS比例"
              value={(() => {
                const fedexTotal = filteredData.reduce(
                  (sum, item) => sum + (item.FedEx总数量 || 0),
                  0
                );
                const upsTotal = filteredData.reduce(
                  (sum, item) => sum + (item.UPS总数量 || 0),
                  0
                );
                return upsTotal ? (fedexTotal / upsTotal).toFixed(2) : "∞";
              })()}
            />
          </Col>
        </Row>
      </Card>

      <Card title="快递数据管理" style={{ marginBottom: 20 }}>
        <div
          style={{
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddClick}
            >
              添加数据
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
              刷新数据
            </Button>
          </Space>
          <Space>
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
              <Option value="halfYear">半年</Option>
              <Option value="year">一年</Option>
            </Select>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={filteredData.map((item) => ({ ...item, key: item._id }))}
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1800 }}
          bordered
        />
      </Card>

      <ExpressDataForm
        visible={formVisible}
        initialValues={currentData}
        onSubmit={handleFormSubmit}
        onCancel={handleFormCancel}
        title={isEditing ? "编辑快递数据" : "添加快递数据"}
      />
    </div>
  );
};

export default ExpressDataManagement;
