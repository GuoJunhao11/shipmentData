// src/components/InventoryExceptionForm.js - 修复日期问题版本
import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  DatePicker,
  InputNumber,
  message,
  Modal,
  Space,
} from "antd";
import moment from "moment";

const { TextArea } = Input;

const InventoryExceptionForm = ({
  initialValues,
  onSubmit,
  onCancel,
  visible,
  title,
}) => {
  const [form] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);

  // 修复日期解析函数
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    
    try {
      // 如果已经是moment对象，直接返回
      if (moment.isMoment(dateStr)) {
        return dateStr.isValid() ? dateStr : null;
      }

      // 处理字符串格式
      if (typeof dateStr === "string") {
        // 处理ISO格式
        if (dateStr.includes("T")) {
          return moment(dateStr);
        }

        // 处理 MM/DD/YYYY 格式
        if (dateStr.includes("/")) {
          const parts = dateStr.split("/");
          if (parts.length === 3) {
            // MM/DD/YYYY 格式 - 重要：moment构造函数需要正确的参数顺序
            const month = parseInt(parts[0], 10) - 1; // moment的月份是0-11
            const day = parseInt(parts[1], 10);
            const year = parseInt(parts[2], 10);
            return moment([year, month, day]);
          } else if (parts.length === 2) {
            // M/D 格式，添加当前年份
            const month = parseInt(parts[0], 10) - 1;
            const day = parseInt(parts[1], 10);
            const year = moment().year();
            return moment([year, month, day]);
          }
        }

        // 尝试直接解析
        const parsed = moment(dateStr);
        return parsed.isValid() ? parsed : null;
      }

      return null;
    } catch (error) {
      console.error('日期解析错误:', error);
      return null;
    }
  };

  useEffect(() => {
    if (visible && initialValues) {
      // 如果有初始值，格式化日期
      const formattedValues = { ...initialValues };

      // 处理日期字段
      if (initialValues.日期) {
        const dateMoment = parseDate(initialValues.日期);
        formattedValues.日期 = dateMoment;
      } else {
        formattedValues.日期 = null;
      }

      form.setFieldsValue(formattedValues);
    } else if (visible) {
      form.resetFields();
      // 设置默认值 - 确保日期是有效的moment对象
      form.setFieldsValue({
        日期: moment(), // 使用当前日期的moment对象
      });
    }
  }, [visible, initialValues, form]);

  // 快捷键支持
  useEffect(() => {
    if (!visible) return;

    const handleKeyPress = (event) => {
      // Ctrl/Cmd + Enter 提交表单
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        form.submit();
      }
      // Escape 取消
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [visible, form, onCancel]);

  const handleSubmit = async (values) => {
    try {
      setSubmitLoading(true);

      // 确保日期格式为 MM/DD/YYYY
      let formattedValues = { ...values };

      if (values.日期) {
        // 处理moment对象
        if (moment.isMoment(values.日期) && values.日期.isValid()) {
          formattedValues.日期 = values.日期.format("MM/DD/YYYY");
        }
        // 处理其他格式
        else {
          const dateMoment = parseDate(values.日期);
          if (dateMoment && dateMoment.isValid()) {
            formattedValues.日期 = dateMoment.format("MM/DD/YYYY");
          } else {
            throw new Error("无效的日期格式");
          }
        }
      }

      await onSubmit(formattedValues);
      form.resetFields();
    } catch (error) {
      message.error("提交失败: " + (error.message || "未知错误"));
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <Modal
      title={title || "添加库存异常记录"}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={600}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="日期"
          label="日期"
          rules={[{ required: true, message: "请选择日期" }]}
        >
          <DatePicker
            format="MM/DD/YYYY"
            placeholder="选择日期"
            style={{ width: "100%" }}
            allowClear={false}
          />
        </Form.Item>

        <Form.Item
          name="客户代码"
          label="客户代码"
          rules={[{ required: true, message: "请输入客户代码" }]}
        >
          <Input placeholder="输入客户代码" />
        </Form.Item>

        <Form.Item
          name="SKU"
          label="SKU"
          rules={[{ required: true, message: "请输入SKU" }]}
        >
          <Input placeholder="输入SKU" />
        </Form.Item>

        <Form.Item
          name="产品名"
          label="产品名"
          rules={[{ required: true, message: "请输入产品名" }]}
        >
          <Input placeholder="输入产品名" />
        </Form.Item>

        <Form.Item
          name="实际库存"
          label="实际库存"
          rules={[{ required: true, message: "请输入实际库存" }]}
        >
          <InputNumber
            min={0}
            style={{ width: "100%" }}
            placeholder="输入实际库存数量"
          />
        </Form.Item>

        <Form.Item
          name="系统库存"
          label="系统库存"
          rules={[{ required: true, message: "请输入系统库存" }]}
        >
          <InputNumber
            min={0}
            style={{ width: "100%" }}
            placeholder="输入系统库存数量"
          />
        </Form.Item>

        <Form.Item
          name="库位"
          label="库位"
          rules={[{ required: true, message: "请输入库位" }]}
        >
          <Input placeholder="输入库位" />
        </Form.Item>

        <Form.Item name="备注" label="备注">
          <TextArea rows={3} placeholder="输入备注信息（可选）" />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
          <Space>
            <Button onClick={onCancel}>
              取消 (Esc)
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitLoading}
            >
              提交 (Ctrl+Enter)
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default InventoryExceptionForm;