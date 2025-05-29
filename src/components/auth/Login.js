import React, { useState, useContext } from "react";
import { Form, Input, Button, Card } from "antd";
import { LockOutlined } from "@ant-design/icons";
import { AuthContext } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const { adminLogin } = useContext(AuthContext);
  const navigate = useNavigate();

  // ✅ 在组件顶层调用 useForm()
  const [form] = Form.useForm();

  const onFinish = (values) => {
    setLoading(true);

    setTimeout(() => {
      const success = adminLogin(values.password);
      if (success) {
        navigate("/dashboard");
      } else {
        // ✅ 正确地使用 form.setFields()
        form.setFields([
          {
            name: "password",
            errors: ["管理员密码错误"],
          },
        ]);
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "#f0f2f5",
      }}
    >
      <Card title="JEC仓库数据分析系统 - 管理员登录" style={{ width: 400 }}>
        <Form
          form={form} // ✅ 将 form 绑定到表单中
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
        >
          <Form.Item
            name="password"
            rules={[{ required: true, message: "请输入管理员密码!" }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="管理员密码"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
            >
              管理员登录
            </Button>
          </Form.Item>

          <div style={{ textAlign: "center" }}>
            <Button type="link" onClick={() => navigate("/dashboard")}>
              返回查看数据 (无需登录)
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
