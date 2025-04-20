import React from "react";
import { Button, Result } from "antd";
import { Link } from "react-router-dom";

function UnauthorizedPage() {
  return (
    <Result
      status="403"
      title="无权访问"
      subTitle="抱歉，您没有权限访问此页面。请先进行管理员登录。"
      extra={[
        <Button type="primary" key="login">
          <Link to="/login">管理员登录</Link>
        </Button>,
        <Button key="dashboard">
          <Link to="/dashboard">返回仪表盘</Link>
        </Button>,
      ]}
    />
  );
}

export default UnauthorizedPage;
