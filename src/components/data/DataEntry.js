// 方案1: 如果您想保持使用原生JavaScript Date对象，需要安装moment库
// 首先运行: npm install moment --save

// 然后在组件中使用moment
import React, { useState, useContext } from "react";
import {
  Form,
  Input,
  Button,
  DatePicker,
  TimePicker,
  InputNumber,
  Card,
  message,
  Row,
  Col,
  Alert,
} from "antd";
import { AuthContext } from "../../contexts/AuthContext";
import moment from "moment"; // 引入moment

const { TextArea } = Input;

// 添加日期验证函数
const isValidDate = (date) => {
  return date && moment(date).isValid();
};

function DataEntry({ onDataAdded }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { isAdmin } = useContext(AuthContext);

  // 如果不是管理员，显示无权限信息
  if (!isAdmin) {
    return (
      <Card title="数据录入" className="card">
        <Alert
          message="管理员功能"
          description="此功能仅对管理员开放。请点击右上角'管理员登录'按钮进行认证。"
          type="info"
          showIcon
        />
      </Card>
    );
  }

  const onFinish = (values) => {
    setLoading(true);

    // 使用moment格式化日期和时间
    const formattedDate = values.date.format("M/D"); // 格式为 "4/8"
    const formattedTime = values.completionTime.format("HH:mm"); // 格式为 "14:20"

    // 准备新数据
    const newData = {
      日期: formattedDate,
      易仓系统总量: values.totalShipments,
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
      setLoading(false);

      // 调用父组件的回调函数传递新数据
      if (onDataAdded) {
        onDataAdded(newData);
      }

      message.success("数据添加成功");
      form.resetFields();
    }, 1000);
  };

  return (
    <Card title="数据录入" className="card">
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          date: moment(), // 使用moment()
          completionTime: moment(), // 使用moment()
          peopleCount: 6,
        }}
      >
        <Row gutter={16}>
          <Col span={6}>
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
          </Col>

          <Col span={6}>
            <Form.Item
              name="totalShipments"
              label="易仓系统总量"
              rules={[{ required: true, message: "请输入易仓系统总量" }]}
            >
              <InputNumber style={{ width: "100%" }} min={0} />
            </Form.Item>
          </Col>

          <Col span={6}>
            <Form.Item
              name="newSystemTotal"
              label="新系统总量"
              rules={[{ required: true, message: "请输入新系统总量" }]}
            >
              <InputNumber style={{ width: "100%" }} min={0} />
            </Form.Item>
          </Col>

          <Col span={6}>
            <Form.Item
              name="fedexTotal"
              label="FedEx 总单数"
              rules={[{ required: true, message: "请输入FedEx总单数" }]}
            >
              <InputNumber style={{ width: "100%" }} min={0} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={6}>
            <Form.Item
              name="upsTotal"
              label="UPS 总单数"
              rules={[{ required: true, message: "请输入UPS总单数" }]}
            >
              <InputNumber style={{ width: "100%" }} min={0} />
            </Form.Item>
          </Col>

          <Col span={6}>
            <Form.Item
              name="fedexA008"
              label="FedEx中A008订单数"
              rules={[{ required: true, message: "请输入FedEx中A008订单数" }]}
            >
              <InputNumber style={{ width: "100%" }} min={0} />
            </Form.Item>
          </Col>

          <Col span={6}>
            <Form.Item
              name="upsA008"
              label="UPS中A008订单数"
              rules={[{ required: true, message: "请输入UPS中A008订单数" }]}
            >
              <InputNumber style={{ width: "100%" }} min={0} />
            </Form.Item>
          </Col>

          <Col span={6}>
            <Form.Item
              name="batteryPanels"
              label="电池板数"
              rules={[{ required: true, message: "请输入电池板数" }]}
            >
              <InputNumber style={{ width: "100%" }} min={0} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={6}>
            <Form.Item
              name="fedexStoragePanels"
              label="FedEx含库板数"
              rules={[{ required: true, message: "请输入FedEx含库板数" }]}
            >
              <InputNumber style={{ width: "100%" }} min={0} />
            </Form.Item>
          </Col>

          <Col span={6}>
            <Form.Item
              name="upsStoragePanels"
              label="UPS含库板数"
              rules={[{ required: true, message: "请输入UPS含库板数" }]}
            >
              <InputNumber style={{ width: "100%" }} min={0} />
            </Form.Item>
          </Col>

          <Col span={6}>
            <Form.Item
              name="completionTime"
              label="完成时间"
              rules={[{ required: true, message: "请选择完成时间" }]}
            >
              <TimePicker style={{ width: "100%" }} format="HH:mm" />
            </Form.Item>
          </Col>

          <Col span={6}>
            <Form.Item
              name="peopleCount"
              label="人数"
              rules={[{ required: true, message: "请输入人数" }]}
            >
              <InputNumber style={{ width: "100%" }} min={1} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="remarks" label="备注">
          <TextArea rows={3} placeholder="请输入备注信息（选填）" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            添加数据
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}

export default DataEntry;
