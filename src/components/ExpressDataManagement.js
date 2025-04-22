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
import { useExpressData } from "../../hooks/useExpressData";
import ExpressDataForm from "./ExpressDataForm";
import ServerStatus from "./ServerStatus";
import moment from "moment";

const { Option } = Select;

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
  const [timeRange, setTimeRange] = useState("all");
  const [filteredData, setFilteredData] = useState([]);

  const workStartTime = "09:00";

  useEffect(() => {
    if (error) {
      message.error(error);
    }
  }, [error]);

  // 解析各种日期格式为 JS Date 对象（用于排序和过滤）
  const parseDateString = (dateStr) => {
    if (!dateStr) return new Date(0);
    if (dateStr.includes("T")) {
      return new Date(dateStr);
    }
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      return new Date(parts[2], parts[0] - 1, parts[1]);
    }
    if (parts.length === 2) {
      const currentYear = new Date().getFullYear();
      return new Date(currentYear, parts[0] - 1, parts[1]);
    }
    return new Date(dateStr);
  };

  useEffect(() => {
    if (!data || data.length === 0) {
      setFilteredData([]);
      return;
    }

    const now = moment();
    let filtered = [...data];

    const rangeInDays = {
      week: 7,
      month: 30,
      quarter: 90,
      halfYear: 180,
      year: 365,
    };

    if (timeRange !== "all") {
      const days = rangeInDays[timeRange];
      filtered = data.filter((item) => {
        const date = moment(parseDateString(item.日期));
        return now.diff(date, "days") < days;
      });
    }

    filtered.sort((a, b) => {
      return parseDateString(b.日期) - parseDateString(a.日期);
    });

    setFilteredData(filtered);
  }, [data, timeRange]);

  const calculateEfficiency = (record) => {
    if (!record.完成时间 || !record.日期) return "N/A";
    const completion = moment(record.完成时间, "HH:mm");
    const start = moment(workStartTime, "HH:mm");
    if (completion.isBefore(start)) return "提前完成";
    const diff = completion.diff(start, "minutes");
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return `${h}小时${m}分钟`;
  };

  const calculateAverageEfficiency = () => {
    let total = 0,
      count = 0;
    filteredData.forEach((r) => {
      const c = moment(r.完成时间, "HH:mm");
      const s = moment(workStartTime, "HH:mm");
      if (c.isValid() && c.isAfter(s)) {
        total += c.diff(s, "minutes");
        count++;
      }
    });
    if (!count) return "N/A";
    const avg = Math.round(total / count);
    return `${Math.floor(avg / 60)}小时${avg % 60}分钟`;
  };

  const calculateAverageHandling = () => {
    let totalP = 0,
      totalPeople = 0;
    filteredData.forEach((r) => {
      totalP += (r.FedEx总数量 || 0) + (r.UPS总数量 || 0);
      totalPeople += r.人数 || 0;
    });
    return totalPeople === 0 ? "N/A" : (totalP / totalPeople).toFixed(1);
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
    if (await removeData(id)) {
      message.success("数据删除成功");
    }
  };

  const handleFormSubmit = async (values) => {
    const success = isEditing
      ? await updateData(currentData._id, values)
      : await addData(values);
    if (success) {
      setFormVisible(false);
      message.success(isEditing ? "数据更新成功" : "数据添加成功");
    }
  };

  const columns = [
    {
      title: "日期",
      dataIndex: "日期",
      key: "日期",
      fixed: "left",
      width: 100,
      render: (text) => {
        if (!text) return "";
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) return text;
        const date = parseDateString(text);
        return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(
          date.getDate()
        ).padStart(2, "0")}/${date.getFullYear()}`;
      },
      sorter: (a, b) => parseDateString(a.日期) - parseDateString(b.日期),
    },
    {
      title: "易仓系统总量",
      dataIndex: "易仓系统总量",
      sorter: (a, b) => a.易仓系统总量 - b.易仓系统总量,
    },
    {
      title: "新系统总量",
      dataIndex: "新系统总量",
      sorter: (a, b) => a.新系统总量 - b.新系统总量,
    },
    {
      title: "FedEx总数量",
      dataIndex: "FedEx总数量",
      sorter: (a, b) => a.FedEx总数量 - b.FedEx总数量,
    },
    {
      title: "UPS总数量",
      dataIndex: "UPS总数量",
      sorter: (a, b) => a.UPS总数量 - b.UPS总数量,
    },
    {
      title: "FedEx中A008订单数",
      dataIndex: "FedEx中A008订单数",
      sorter: (a, b) => a.FedEx中A008订单数 - b.FedEx中A008订单数,
    },
    {
      title: "UPS中A008订单数",
      dataIndex: "UPS中A008订单数",
      sorter: (a, b) => a.UPS中A008订单数 - b.UPS中A008订单数,
    },
    {
      title: "电池板数",
      dataIndex: "电池板数",
      sorter: (a, b) => a.电池板数 - b.电池板数,
    },
    {
      title: "FedEx含库板数",
      dataIndex: "FedEx含库板数",
      sorter: (a, b) => a.FedEx含库板数 - b.FedEx含库板数,
    },
    {
      title: "UPS含库板数",
      dataIndex: "UPS含库板数",
      sorter: (a, b) => a.UPS含库板数 - b.UPS含库板数,
    },
    {
      title: "完成时间",
      dataIndex: "完成时间",
      sorter: (a, b) => {
        const aT = moment(a.完成时间, "HH:mm");
        const bT = moment(b.完成时间, "HH:mm");
        return aT - bT;
      },
    },
    {
      title: "工作效率",
      render: (_, record) => (
        <Tooltip title="从上班时间到完成时间的耗时">
          {calculateEfficiency(record)}
        </Tooltip>
      ),
      sorter: (a, b) => {
        const aT = moment(a.完成时间, "HH:mm");
        const bT = moment(b.完成时间, "HH:mm");
        const s = moment(workStartTime, "HH:mm");
        return aT.diff(s) - bT.diff(s);
      },
    },
    {
      title: "人数",
      dataIndex: "人数",
      sorter: (a, b) => a.人数 - b.人数,
    },
    {
      title: "人均处理",
      render: (_, r) => {
        const total = (r.FedEx总数量 || 0) + (r.UPS总数量 || 0);
        return r.人数 ? (total / r.人数).toFixed(1) : "N/A";
      },
      sorter: (a, b) => {
        const aVal = a.人数
          ? ((a.FedEx总数量 || 0) + (a.UPS总数量 || 0)) / a.人数
          : 0;
        const bVal = b.人数
          ? ((b.FedEx总数量 || 0) + (b.UPS总数量 || 0)) / b.人数
          : 0;
        return aVal - bVal;
      },
    },
    {
      title: "备注",
      dataIndex: "备注",
    },
    {
      title: "操作",
      key: "action",
      fixed: "right",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditClick(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除吗？"
            onConfirm={() => handleDeleteClick(record._id)}
          >
            <Button
              type="primary"
              danger
              size="small"
              icon={<DeleteOutlined />}
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

      <Card title="数据统计" style={{ marginBottom: 20 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic title="数据总条数" value={filteredData.length} />
          </Col>
          <Col span={6}>
            <Statistic title="平均效率" value={calculateAverageEfficiency()} />
          </Col>
          <Col span={6}>
            <Statistic
              title="人均处理量"
              value={calculateAverageHandling()}
              suffix="单/人"
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="FedEx/UPS 比例"
              value={() => {
                const f = filteredData.reduce(
                  (s, r) => s + (r.FedEx总数量 || 0),
                  0
                );
                const u = filteredData.reduce(
                  (s, r) => s + (r.UPS总数量 || 0),
                  0
                );
                return u ? (f / u).toFixed(2) : "∞";
              }}
            />
          </Col>
        </Row>
      </Card>

      <Card title="快递数据管理">
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
            <Button icon={<ReloadOutlined />} onClick={fetchData}>
              刷新
            </Button>
          </Space>
          <Space>
            <FilterOutlined /> 时间范围:
            <Select
              value={timeRange}
              onChange={setTimeRange}
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
          dataSource={filteredData.map((d) => ({ ...d, key: d._id }))}
          loading={loading}
          scroll={{ x: 1800 }}
          bordered
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <ExpressDataForm
        visible={formVisible}
        initialValues={currentData}
        onSubmit={handleFormSubmit}
        onCancel={() => setFormVisible(false)}
        title={isEditing ? "编辑数据" : "添加数据"}
      />
    </div>
  );
};

export default ExpressDataManagement;
