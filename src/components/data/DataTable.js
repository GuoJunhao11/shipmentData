// src/components/data/DataTable.js - 引入moment修复
import React, { useContext, useState } from "react";
import {
  Table,
  Card,
  Button,
  Popconfirm,
  Space,
  Modal,
  Form,
  Input,
  DatePicker,
  TimePicker,
  InputNumber,
  message,
} from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { AuthContext } from "../../contexts/AuthContext";
import moment from "moment"; // 引入moment

const { TextArea } = Input;

// 添加日期验证函数
const isValidDate = (date) => {
  return date && moment(date).isValid();
};

function DataTable({ data, onDataUpdated, onDataDeleted }) {
  const { isAdmin } = useContext(AuthContext);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // 打开编辑模态框
  const showEditModal = (record) => {
    setCurrentRecord(record);

    // 设置表单的初始值
    const dateString = record.日期.split("/");
    const month = parseInt(dateString[0]);
    const day = parseInt(dateString[1]);

    // 使用moment创建日期对象
    const dateObj = moment()
      .month(month - 1)
      .date(day);

    // 解析时间
    const timeString = record.完成时间.split(":");
    const hours = parseInt(timeString[0]);
    const minutes = parseInt(timeString[1]);
    const timeObj = moment().hour(hours).minute(minutes);

    form.setFieldsValue({
      date: dateObj,
      totalShipments: record.易仓系统总量, // 注意字段名已修改
      newSystemTotal: record.新系统总量,
      fedexTotal: record.FedEx总数量,
      upsTotal: record.UPS总数量,
      fedexA008: record.FedEx中A008订单数,
      upsA008: record.UPS中A008订单数,
      batteryPanels: record.电池板数,
      fedexStoragePanels: record.FedEx含库板数,
      upsStoragePanels: record.UPS含库板数,
      completionTime: timeObj,
      peopleCount: record.人数,
      remarks: record.备注,
    });

    setEditModalVisible(true);
  };

  // 处理表单提交
  const handleEditSubmit = () => {
    form.validateFields().then((values) => {
      setLoading(true);

      // 使用moment格式化日期和时间
      const formattedDate = values.date.format("M/D");
      const formattedTime = values.completionTime.format("HH:mm");

      // 准备更新后的数据
      const updatedData = {
        ...currentRecord,
        日期: formattedDate,
        易仓系统总量: values.totalShipments, // 注意字段名已修改
        新系统总量: values.newSystemTotal,
        FedEx总数量: values.fedexTotal,
        UPS总数量: values.upsTotal,
        FedEx中A008订单数: values.fedexA008,
        UPS中A008订单数: values.upsA008,
        电池板数: values.batteryPanels,
        FedEx含库板数: values.fedexStoragePanels,
        UPS含库板数: values.upsStoragePanels,
        完成时间: formattedTime,
        人数: values.peopleCount,
        备注: values.remarks || "",
      };

      // 模拟API调用
      setTimeout(() => {
        if (onDataUpdated) {
          onDataUpdated(currentRecord, updatedData);
        }

        setLoading(false);
        setEditModalVisible(false);
        message.success("数据更新成功");
      }, 1000);
    });
  };

  // 处理删除
  const handleDelete = (record) => {
    if (onDataDeleted) {
      onDataDeleted(record);
      message.success("数据删除成功");
    }
  };

  // 表格列定义
  const columns = [
    {
      title: "日期",
      dataIndex: "日期",
      key: "日期",
      sorter: (a, b) => {
        const dateA = a.日期.split("/").map(Number);
        const dateB = b.日期.split("/").map(Number);
        if (dateA[0] !== dateB[0]) return dateA[0] - dateB[0];
        return dateA[1] - dateB[1];
      },
    },
    {
      title: "易仓系统总量", // 字段名已修改
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
      title: "FedEx中A008订单数",
      dataIndex: "FedEx中A008订单数",
      key: "FedEx中A008订单数",
    },
    {
      title: "UPS中A008订单数",
      dataIndex: "UPS中A008订单数",
      key: "UPS中A008订单数",
    },
    {
      title: "电池板数",
      dataIndex: "电池板数",
      key: "电池板数",
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
  ];

  // 只有管理员才有操作列
  if (isAdmin) {
    columns.push({
      title: "操作",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => showEditModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除此条数据吗？"
            onConfirm={() => handleDelete(record)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    });
  }

  return (
    <>
      <Card title="快递数据列表" className="card">
        <Table
          columns={columns}
          dataSource={data.map((item, index) => ({ ...item, key: index }))}
          pagination={{ pageSize: 10 }}
          scroll={{ x: true }}
        />
      </Card>

      {/* 编辑数据的模态框 */}
      <Modal
        title="编辑快递数据"
        visible={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setEditModalVisible(false)}>
            取消
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={loading}
            onClick={handleEditSubmit}
          >
            保存
          </Button>,
        ]}
        width={800}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="date"
            label="日期"
            rules={[
              { required: true, message: "请选择日期" },
              {
                validator: (_, value) =>
                  isValidDate(value)
                    ? Promise.resolve()
                    : Promise.reject("请输入有效的日期"),
              },
            ]}
          >
            <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
          </Form.Item>

          <Form.Item
            name="totalShipments"
            label="易仓系统总量" // 标签已修改
            rules={[{ required: true, message: "请输入易仓系统总量" }]}
          >
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>

          <Form.Item
            name="newSystemTotal"
            label="新系统总量"
            rules={[{ required: true, message: "请输入新系统总量" }]}
          >
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>

          <Form.Item
            name="fedexTotal"
            label="FedEx 总单数"
            rules={[{ required: true, message: "请输入FedEx总单数" }]}
          >
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>

          <Form.Item
            name="upsTotal"
            label="UPS 总单数"
            rules={[{ required: true, message: "请输入UPS总单数" }]}
          >
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>

          <Form.Item
            name="fedexA008"
            label="FedEx中A008订单数"
            rules={[{ required: true, message: "请输入FedEx中A008订单数" }]}
          >
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>

          <Form.Item
            name="upsA008"
            label="UPS中A008订单数"
            rules={[{ required: true, message: "请输入UPS中A008订单数" }]}
          >
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>

          <Form.Item
            name="batteryPanels"
            label="电池板数"
            rules={[{ required: true, message: "请输入电池板数" }]}
          >
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>

          <Form.Item
            name="fedexStoragePanels"
            label="FedEx含库板数"
            rules={[{ required: true, message: "请输入FedEx含库板数" }]}
          >
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>

          <Form.Item
            name="upsStoragePanels"
            label="UPS含库板数"
            rules={[{ required: true, message: "请输入UPS含库板数" }]}
          >
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>

          <Form.Item
            name="completionTime"
            label="完成时间"
            rules={[{ required: true, message: "请选择完成时间" }]}
          >
            <TimePicker style={{ width: "100%" }} format="HH:mm" />
          </Form.Item>

          <Form.Item
            name="peopleCount"
            label="人数"
            rules={[{ required: true, message: "请输入人数" }]}
          >
            <InputNumber style={{ width: "100%" }} min={1} />
          </Form.Item>

          <Form.Item name="remarks" label="备注">
            <TextArea rows={3} placeholder="请输入备注信息（选填）" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default DataTable;
