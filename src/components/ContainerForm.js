// src/components/ContainerForm.js - 优化版
import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  DatePicker,
  Select,
  message,
  Modal,
  AutoComplete,
  Space,
} from "antd";
import moment from "moment";

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

      // 到达时间保持字符串格式，不需要转换为moment
      formattedValues.到达时间 = initialValues.到达时间 || "";

      form.setFieldsValue(formattedValues);
    } else if (visible) {
      form.resetFields();
      // 设置默认值
      form.setFieldsValue({
        日期: moment(),
        类型: "整柜",
        状态: "还未到仓库",
        到达时间: "",
        问题: "",
      });

      // 设置焦点到柜号输入框
      setTimeout(() => {
        const containerInput = document.querySelector(
          'input[placeholder="输入柜号"]'
        );
        if (containerInput) {
          containerInput.focus();
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

      // 格式化到达时间 - 确保是 HH:mm 格式（如果有输入的话）
      if (values.到达时间 && values.到达时间.trim() !== "") {
        const timeStr = values.到达时间.toString().trim();

        // 如果用户输入的是简单格式如 "12" 或 "15"，自动补充 ":00"
        if (/^\d{1,2}$/.test(timeStr)) {
          const hour = parseInt(timeStr);
          if (hour >= 0 && hour <= 23) {
            formattedValues.到达时间 = `${hour.toString().padStart(2, "0")}:00`;
          }
        }
        // 如果用户输入的是 "12:30" 或 "15:45" 格式
        else if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
          const parts = timeStr.split(":");
          const hour = parseInt(parts[0]);
          const minute = parseInt(parts[1]);
          if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
            formattedValues.到达时间 = `${hour
              .toString()
              .padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
          }
        }
        // 如果已经是正确格式，保持不变
        else if (/^\d{2}:\d{2}$/.test(timeStr)) {
          formattedValues.到达时间 = timeStr;
        }
      } else {
        // 如果没有输入到达时间，设置为空字符串
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
          rules={[{ required: true, message: "请选择日期" }]}
        >
          <DatePicker
            format="MM/DD/YYYY"
            placeholder="选择日期"
            style={{ width: "100%" }}
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
          />
        </Form.Item>

        <Form.Item
          name="到达时间"
          label="到达时间"
          rules={[
            {
              pattern: /^(\d{1,2}(:\d{2})?|\d{2}:\d{2})?$/,
              message: "请输入正确的时间格式，如：12:00 或 15",
            },
          ]}
        >
          <Input
            placeholder="输入到达时间，如：12:00 或 15（可选）"
            style={{ width: "100%" }}
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
