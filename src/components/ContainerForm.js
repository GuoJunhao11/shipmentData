// src/components/ContainerForm.js - 修改为手动日期输入版本
import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Select,
  message,
  Modal,
  AutoComplete,
  Space,
} from "antd";

const { Option } = Select;
const { TextArea } = Input;

const ContainerForm = ({
  initialValues,
  onSubmit,
  onCancel,
  visible,
  title,
}) => {
  const [form] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [customerCodeSuggestions, setCustomerCodeSuggestions] = useState([]);

  // 日期格式验证函数
  const validateDateFormat = (_, value) => {
    if (!value) {
      return Promise.reject(new Error("请输入日期"));
    }

    // 检查基本格式 MM/DD 或 MM/DD/YYYY
    const datePattern = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?$/;
    const match = value.match(datePattern);

    if (!match) {
      return Promise.reject(
        new Error("日期格式不正确，请使用 MM/DD 或 MM/DD/YYYY 格式")
      );
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

  // 时间格式验证函数
  const validateTimeFormat = (_, value) => {
    if (!value || value.trim() === "") {
      return Promise.resolve(); // 时间是可选的
    }

    const timeString = value.toString().trim();

    // 验证时间格式
    if (/^\d{1,2}$/.test(timeString)) {
      const hour = parseInt(timeString);
      if (hour < 0 || hour > 23) {
        return Promise.reject(new Error("小时必须在 0-23 之间"));
      }
    } else if (/^\d{1,2}:\d{2}$/.test(timeString)) {
      const parts = timeString.split(":");
      const hour = parseInt(parts[0]);
      const minute = parseInt(parts[1]);
      if (hour < 0 || hour > 23) {
        return Promise.reject(new Error("小时必须在 0-23 之间"));
      }
      if (minute < 0 || minute > 59) {
        return Promise.reject(new Error("分钟必须在 0-59 之间"));
      }
    } else if (/^\d{2}:\d{2}$/.test(timeString)) {
      const parts = timeString.split(":");
      const hour = parseInt(parts[0]);
      const minute = parseInt(parts[1]);
      if (hour < 0 || hour > 23) {
        return Promise.reject(new Error("小时必须在 0-23 之间"));
      }
      if (minute < 0 || minute > 59) {
        return Promise.reject(new Error("分钟必须在 0-59 之间"));
      }
    } else {
      return Promise.reject(
        new Error("时间格式不正确，请使用 HH:mm 格式，如：14:30")
      );
    }

    return Promise.resolve();
  };

  // 从localStorage获取历史客户代码
  const getHistoryCustomerCodes = () => {
    try {
      const history = JSON.parse(
        localStorage.getItem("customerCodeHistory") || "[]"
      );
      return [...new Set(history)]; // 去重
    } catch {
      return [];
    }
  };

  // 保存客户代码到历史记录
  const saveCustomerCodeToHistory = (code) => {
    if (!code) return;
    try {
      const history = getHistoryCustomerCodes();
      const newHistory = [code, ...history.filter((c) => c !== code)].slice(
        0,
        20
      ); // 保持最新20个
      localStorage.setItem("customerCodeHistory", JSON.stringify(newHistory));
    } catch (error) {
      console.error("保存客户代码历史失败:", error);
    }
  };

  // 客户代码搜索处理
  const handleCustomerCodeSearch = (value) => {
    const history = getHistoryCustomerCodes();
    const filtered = history.filter((code) =>
      code.toLowerCase().includes(value.toLowerCase())
    );
    setCustomerCodeSuggestions(filtered.map((code) => ({ value: code })));
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

  // 格式化时间字符串
  const formatTimeString = (timeStr) => {
    if (!timeStr || timeStr.trim() === "") return "";

    try {
      const timeString = timeStr.toString().trim();

      // 如果是简单数字格式如 "12" 或 "15"
      if (/^\d{1,2}$/.test(timeString)) {
        const hour = parseInt(timeString);
        if (hour >= 0 && hour <= 23) {
          return `${hour.toString().padStart(2, "0")}:00`;
        }
      }
      // 如果是 "12:30" 或 "15:45" 格式
      else if (/^\d{1,2}:\d{2}$/.test(timeString)) {
        const parts = timeString.split(":");
        const hour = parseInt(parts[0]);
        const minute = parseInt(parts[1]);
        if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
          return `${hour.toString().padStart(2, "0")}:${minute
            .toString()
            .padStart(2, "0")}`;
        }
      }
      // 如果已经是 HH:mm 格式
      else if (/^\d{2}:\d{2}$/.test(timeString)) {
        return timeString;
      }

      return timeStr;
    } catch (e) {
      console.error("时间格式化错误:", e);
      return timeStr;
    }
  };

  useEffect(() => {
    if (visible && initialValues) {
      // 如果有初始值，格式化数据
      const formattedValues = { ...initialValues };

      // 格式化日期字段
      if (initialValues.日期) {
        formattedValues.日期 = formatDateString(initialValues.日期);
      }

      // 到达时间保持原格式
      formattedValues.到达时间 = initialValues.到达时间 || "";

      form.setFieldsValue(formattedValues);
    } else if (visible) {
      form.resetFields();

      // 设置默认值
      const today = new Date();
      const currentDate = `${(today.getMonth() + 1)
        .toString()
        .padStart(2, "0")}/${today
        .getDate()
        .toString()
        .padStart(2, "0")}/${today.getFullYear()}`;

      form.setFieldsValue({
        日期: currentDate,
        类型: "整柜",
        状态: "还未到仓库",
        到达时间: "",
        问题: "",
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

      // 格式化数据
      let formattedValues = { ...values };

      // 确保日期格式为 MM/DD/YYYY
      if (values.日期) {
        formattedValues.日期 = formatDateString(values.日期);
      }

      // 格式化到达时间
      if (values.到达时间 && values.到达时间.trim() !== "") {
        formattedValues.到达时间 = formatTimeString(values.到达时间);
      } else {
        formattedValues.到达时间 = "";
      }

      // 确保问题字段不为空
      if (!formattedValues.问题) {
        formattedValues.问题 = "";
      }

      // 保存客户代码到历史记录
      saveCustomerCodeToHistory(formattedValues.客户代码);

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
      title={title || "添加集装箱记录"}
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
            { validator: validateDateFormat },
          ]}
          extra="格式：MM/DD 或 MM/DD/YYYY (例如：12/25 或 12/25/2024)"
        >
          <Input
            placeholder="请输入日期，如：12/25 或 12/25/2024"
            style={{ width: "100%" }}
            onPressEnter={(e) => {
              // Enter键跳转到下一个输入框
              const nextInput =
                e.target.parentElement.parentElement.nextElementSibling?.querySelector(
                  "input"
                );
              if (nextInput) nextInput.focus();
            }}
          />
        </Form.Item>

        <Form.Item
          name="柜号"
          label="柜号"
          rules={[{ required: true, message: "请输入柜号" }]}
        >
          <Input
            placeholder="输入柜号"
            onPressEnter={(e) => {
              // Enter键跳转到类型选择框
              const nextSelect = document.querySelector(".ant-select-selector");
              if (nextSelect) nextSelect.click();
            }}
          />
        </Form.Item>

        <Form.Item
          name="类型"
          label="类型"
          rules={[{ required: true, message: "请选择类型" }]}
        >
          <Select placeholder="选择类型">
            <Option value="整柜">整柜</Option>
            <Option value="散货">散货</Option>
            <Option value="托盘">托盘</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="客户代码"
          label="客户代码"
          rules={[{ required: true, message: "请输入客户代码" }]}
        >
          <AutoComplete
            options={customerCodeSuggestions}
            onSearch={handleCustomerCodeSearch}
            placeholder="输入客户代码"
            filterOption={false}
            onPressEnter={(e) => {
              const nextInput = document.querySelector(
                'input[placeholder*="到达时间"]'
              );
              if (nextInput) nextInput.focus();
            }}
          />
        </Form.Item>

        <Form.Item
          name="到达时间"
          label="到达时间"
          rules={[{ validator: validateTimeFormat }]}
          extra="格式：HH:mm 或 HH (例如：14:30 或 14，可选)"
        >
          <Input
            placeholder="输入到达时间，如：14:30 或 14（可选）"
            style={{ width: "100%" }}
            onPressEnter={(e) => {
              // Enter键跳转到状态选择框
              const statusSelect = document.querySelectorAll(
                ".ant-select-selector"
              )[1];
              if (statusSelect) statusSelect.click();
            }}
          />
        </Form.Item>

        <Form.Item
          name="状态"
          label="状态"
          rules={[{ required: true, message: "请选择状态" }]}
        >
          <Select placeholder="选择状态">
            <Option value="还未到仓库">还未到仓库</Option>
            <Option value="已完成">已完成</Option>
            <Option value="待拆柜">待拆柜</Option>
            <Option value="待核实">待核实</Option>
            <Option value="有问题">有问题</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="问题"
          label="问题/备注"
          rules={[{ max: 500, message: "问题描述不能超过500字符" }]}
        >
          <TextArea
            rows={3}
            placeholder="输入问题描述或备注信息（可选）"
            showCount
            maxLength={500}
            onPressEnter={(e) => {
              if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                form.submit();
              }
            }}
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
          <Space>
            <Button onClick={onCancel}>取消 (Esc)</Button>
            <Button type="primary" htmlType="submit" loading={submitLoading}>
              提交 (Ctrl+Enter)
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ContainerForm;
