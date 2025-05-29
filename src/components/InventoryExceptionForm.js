// src/components/InventoryExceptionForm.js
import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  DatePicker,
  InputNumber,
  message,
  Modal,
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

  useEffect(() => {
    if (visible && initialValues) {
      // 如果有初始值，格式化日期
      const formattedValues = { ...initialValues };

      // 处理日期字段，转换为moment对象
      if (initialValues.日期 && typeof initialValues.日期 === "string") {
        let dateMoment = null;

        // 处理 MM/DD/YYYY 格式
        if (initialValues.日期.includes("/")) {
          const parts = initialValues.日期.split("/");
          if (parts.length === 3) {
            // MM/DD/YYYY 格式
            dateMoment = moment(
              `${parts[2]}-${parts[0]}-${parts[1]}`,
              "YYYY-MM-DD"
            );
          } else if (parts.length === 2) {
            // M/D 格式，添加当前年份
            const currentYear = moment().year();
            dateMoment = moment(
              `${currentYear}-${parts[0]}-${parts[1]}`,
              "YYYY-MM-DD"
            );
          }
        }
        // 处理ISO格式
        else if (initialValues.日期.includes("T")) {
          dateMoment = moment(initialValues.日期);
        }

        if (dateMoment && dateMoment.isValid()) {
          formattedValues.日期 = dateMoment;
        } else {
          formattedValues.日期 = null;
        }
      } else {
        formattedValues.日期 = null;
      }

      form.setFieldsValue(formattedValues);
    } else if (visible) {
      form.resetFields();
      // 设置默认值
      form.setFieldsValue({
        日期: moment(),
      });
    }
  }, [visible, initialValues, form]);

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
        // 处理字符串格式
        else if (typeof values.日期 === "string") {
          // 如果已经是 MM/DD/YYYY 格式
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(values.日期)) {
            formattedValues.日期 = values.日期;
          }
          // ISO格式转换
          else if (values.日期.includes("T")) {
            const date = new Date(values.日期);
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            formattedValues.日期 = `${month}/${day}/${date.getFullYear()}`;
          }
          // 简单 M/D 格式
          else if (values.日期.includes("/")) {
            const parts = values.日期.split("/");
            if (parts.length === 2) {
              const month = String(parseInt(parts[0])).padStart(2, "0");
              const day = String(parseInt(parts[1])).padStart(2, "0");
              formattedValues.日期 = `${month}/${day}/${new Date().getFullYear()}`;
            }
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

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={submitLoading}
            style={{ marginRight: 8 }}
          >
            提交
          </Button>
          <Button onClick={onCancel}>取消</Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default InventoryExceptionForm;
