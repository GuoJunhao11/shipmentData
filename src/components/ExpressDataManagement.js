import React, { useState, useEffect } from "react";
import { Table, Button, Space, Popconfirm, message, Card } from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useExpressData } from "../hooks/useExpressData";
import ExpressDataForm from "./ExpressDataForm";
import ServerStatus from "./ServerStatus";

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

  useEffect(() => {
    if (error) {
      message.error(error);
    }
  }, [error]);

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

  const columns = [
    {
      title: "日期",
      dataIndex: "日期",
      key: "日期",
      sorter: (a, b) => {
        const dateA = new Date(`2023/${a.日期}`);
        const dateB = new Date(`2023/${b.日期}`);
        return dateA - dateB;
      },
    },
    {
      title: "易仓系统总量",
      dataIndex: "易仓系统总量",
      key: "易仓系统总量",
      sorter: (a, b) => a.易仓系统总量 - b.易仓系统总量,
    },
    {
      title: "FedEx总数量",
      dataIndex: "FedEx总数量",
      key: "FedEx总数量",
      sorter: (a, b) => a.FedEx总数量 - b.FedEx总数量,
    },
    {
      title: "UPS总数量",
      dataIndex: "UPS总数量",
      key: "UPS总数量",
      sorter: (a, b) => a.UPS总数量 - b.UPS总数量,
    },
    {
      title: "电池板数",
      dataIndex: "电池板数",
      key: "电池板数",
      sorter: (a, b) => a.电池板数 - b.电池板数,
    },
    {
      title: "完成时间",
      dataIndex: "完成时间",
      key: "完成时间",
    },
    {
      title: "人数",
      dataIndex: "人数",
      key: "人数",
    },
    {
      title: "操作",
      key: "action",
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

      <Card title="快递数据管理" style={{ marginBottom: 20 }}>
        <div style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddClick}
            style={{ marginRight: 8 }}
          >
            添加数据
          </Button>
          <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
            刷新数据
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={data.map((item) => ({ ...item, key: item._id }))}
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: true }}
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
