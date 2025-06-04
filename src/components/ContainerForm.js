// src/components/ContainerForm.js - 修复日期问题版本
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
      const history = JSON.parse(localStorage.getItem('customerCodeHistory') || '[]');
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
      const newHistory = [code, ...history.filter(c => c !== code)].slice(0, 20); // 保持最新20个
      localStorage.setItem('customerCodeHistory', JSON.stringify(newHistory));
    } catch (error) {
      console.error('保存客户代码历史失败:', error);
    }
  };

  // 客户代码搜索处理
  const handleCustomerCodeSearch = (value) => {
    const history = getHistoryCustomerCodes();
    const filtered = history.filter(code => 
      code.toLowerCase().includes(value.toLowerCase())
    );
    setCustomerCodeSuggestions(filtered.map(code => ({ value: code })));
  };

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

      // 到达时间保持字符串格式
      formattedValues.到达时间 = initialValues.到达时间 || "";

      form.setFieldsValue(formattedValues);
    } else if (visible) {
      form.resetFields();
      // 设置默认值 - 确保日期是有效的moment对象
      form.setFieldsValue({
        日期: moment(), // 使用当前日期的moment对象
        类型: "整柜",
        状态: "还未到仓库",
        到达时间: "",
        问题: "",
      });
      
      // 设置焦点到柜号输入框
      setTimeout(() => {
        const containerInput = document.querySelector('input[placeholder="输入柜号"]');
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

      // 格式化到达时间
      if (values.到达时间 && values.到达时间.trim() !== "") {
        const timeStr = values.到达时间.toString().trim();
        
        if (/^\d{1,2}$/.test(timeStr)) {
          const hour = parseInt(timeStr);
          if (hour >= 0 && hour <= 23) {
            formattedValues.到达时间 = `${hour.toString().padStart(2, "0")}:00`;
          }
        }
        else if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
          const parts = timeStr.split(":");
          const hour = parseInt(parts[0]);
          const minute = parseInt(parts[1]);
          if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
            formattedValues.到达时间 = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
          }
        }
        else if (/^\d{2}:\d{2}$/.test(timeStr)) {
          formattedValues.到达时间 = timeStr;
        }
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
          name="柜号"
          label="柜号"
          rules={[{ required: true, message: "请输入柜号" }]}
        >
          <Input 
            placeholder="输入柜号"
            onPressEnter={(e) => {
              // Enter键跳转到下一个输入框
              const nextInput = e.target.parentElement.parentElement.nextElementSibling?.querySelector('input');
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
          rules={[
            { max: 500, message: "问题描述不能超过500字符" }
          ]}
        >
          <TextArea 
            rows={3} 
            placeholder="输入问题描述或备注信息（可选）" 
            showCount
            maxLength={500}
          />
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

export default ContainerForm;