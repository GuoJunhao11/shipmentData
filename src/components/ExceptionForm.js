// src/components/ExceptionForm.js - 修改为手动日期输入版本
import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Select,
  message,
  Modal,
} from "antd";

const { Option } = Select;
const { TextArea } = Input;

const ExceptionForm = ({
  initialValues,
  onSubmit,
  onCancel,
  visible,
  title,
}) => {
  const [form] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);

  // 日期格式验证函数
  const validateDateFormat = (_, value) => {
    if (!value) {
      return Promise.reject(new Error("请输入日期"));
    }

    // 检查基本格式 MM/DD 或 MM/DD/YYYY
    const datePattern = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?$/;
    const match = value.match(datePattern);

    if (!match) {
      return Promise.reject(new Error("日期格式不正确，请使用 MM/DD 或 MM/DD/YYYY 格式"));
    }

    const month = parseInt(match[1], 10);
    const day = parseInt(match[2], 10);
    const year = match[3] ? parseInt(match[3], 10) : new Date().getFullYear();

    // 验证月份
    if (month < 1 || month > 12) {
      return Promise.reject(new Error("月份必须在 1-12 之间"));
    }

    // 验证日期
    if (day < 1 || day > 31) {
      return Promise.reject(new Error("日期必须在 1-31 之间"));
    }

    // 验证年份（如果提供）
    if (match[3] && (year < 2020 || year > 2030)) {
      return Promise.reject(new Error("年份必须在 2020-2030 之间"));
    }

    // 验证日期是否有效（例如2月不能有30号）
    const testDate = new Date(year, month - 1, day);
    if (testDate.getMonth() !== month - 1 || testDate.getDate() !== day) {
      return Promise.reject(new Error("输入的日期无效"));
    }

    return Promise.resolve();
  };

  // 格式化日期字符串
  const formatDateString = (dateStr) => {
    if (!dateStr) return "";

    try {
      // 处理 MM/DD/YYYY 格式
      if (dateStr.includes("/")) {
        const parts = dateStr.split("/");
        if (parts.length === 2) {
          // MM/DD 格式，添加当前年份
          const month = parts[0].padStart(2, "0");
          const day = parts[1].padStart(2, "0");
          const year = new Date().getFullYear();
          return `${month}/${day}/${year}`;
        } else if (parts.length === 3) {
          // MM/DD/YYYY 格式，标准化
          const month = parts[0].padStart(2, "0");
          const day = parts[1].padStart(2, "0");
          const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
          return `${month}/${day}/${year}`;
        }
      }

      // 处理ISO格式
      if (dateStr.includes("T")) {
        const date = new Date(dateStr);
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
      }

      return dateStr;
    } catch (e) {
      console.error("日期格式化错误:", e);
      return dateStr;
    }
  };

  useEffect(() => {
    if (visible && initialValues) {
      // 如果有初始值，格式化日期
      const formattedValues = { ...initialValues };

      // 格式化日期字段
      if (initialValues.日期) {
        formattedValues.日期 = formatDateString(initialValues.日期);
      }

      form.setFieldsValue(formattedValues);
    } else if (visible) {
      form.resetFields();
      
      // 设置默认值
      const today = new Date();
      const currentDate = `${(today.getMonth() + 1).toString().padStart(2, "0")}/${today.getDate().toString().padStart(2, "0")}/${today.getFullYear()}`;
      
      form.setFieldsValue({
        日期: currentDate,
        异常类型: "无轨迹"
      });

      // 设置焦点到日期输入框
      setTimeout(() => {
        const dateInput = document.querySelector('input[placeholder*="MM/DD"]');
        if (dateInput) {
          dateInput.focus();
          dateInput.select(); // 选中默认日期，方便用户直接输入
        }
      }, 100);
    }
  }, [visible, initialValues, form]);

  // 快捷键支持
  useEffect(() => {
    if (!visible) return;

    const handleKeyPress = (event) => {
      // Ctrl/Cmd + Enter 提交表单
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        form.submit();
      }
      // Escape 取消
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [visible, form, onCancel]);

  const handleSubmit = async (values) => {
    try {
      setSubmitLoading(true);

      // 确保日期格式为 MM/DD/YYYY
      let formattedValues = { ...values };

      if (values.日期) {
        formattedValues.日期 = formatDateString(values.日期);
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
      title={title || "添加异常记录"}
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
          rules={[
            { required: true, message: "请输入日期" },
            { validator: validateDateFormat }
          ]}
          extra="格式：MM/DD 或 MM/DD/YYYY (例如：12/25 或 12/25/2024)"
        >
          <Input
            placeholder="请输入日期，如：12/25 或 12/25/2024"
            style={{ width: "100%" }}
            onPressEnter={(e) => {
              // Enter键跳转到异常类型选择框
              const nextSelect = document.querySelector('.ant-select-selector');
              if (nextSelect) nextSelect.click();
            }}
          />
        </Form.Item>

        <Form.Item
          name="异常类型"
          label="异常类型"
          rules={[{ required: true, message: "请选择异常类型" }]}
        >
          <Select placeholder="选择异常类型">
            <Option value="无轨迹">无轨迹</Option>
            <Option value="缺货">缺货</Option>
            <Option value="错发">错发</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="客户代码"
          label="客户代码"
          rules={[{ required: true, message: "请输入客户代码" }]}
        >
          <Input 
            placeholder="输入客户代码" 
            onPressEnter={(e) => {
              const nextInput = document.querySelector('input[placeholder*="跟踪号码"]');
              if (nextInput) nextInput.focus();
            }}
          />
        </Form.Item>

        <Form.Item
          name="跟踪号码"
          label="跟踪号码"
          rules={[{ required: true, message: "请输入跟踪号码" }]}
        >
          <Input 
            placeholder="输入跟踪号码" 
            onPressEnter={(e) => {
              const nextInput = document.querySelector('input[placeholder*="SKU"]');
              if (nextInput) nextInput.focus();
            }}
          />
        </Form.Item>

        <Form.Item
          name="SKU"
          label="SKU"
          rules={[{ required: true, message: "请输入SKU" }]}
        >
          <Input 
            placeholder="输入SKU" 
            onPressEnter={(e) => {
              const nextTextarea = document.querySelector('textarea[placeholder*="备注"]');
              if (nextTextarea) nextTextarea.focus();
            }}
          />
        </Form.Item>

        <Form.Item name="备注" label="备注">
          <TextArea 
            rows={3} 
            placeholder="输入备注信息（可选）" 
            onPressEnter={(e) => {
              if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                form.submit();
              }
            }}
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={submitLoading}
            style={{ marginRight: 8 }}
          >
            提交 (Ctrl+Enter)
          </Button>
          <Button onClick={onCancel}>取消 (Esc)</Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ExceptionForm;