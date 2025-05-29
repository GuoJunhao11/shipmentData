// src/App.js - 已修改以使用MongoDB而非localStorage
import React, { useState, useContext } from "react";
import { Layout, Menu, Button, message } from "antd";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
} from "react-router-dom";
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  LockOutlined,
  UnlockOutlined,
  ExceptionOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { AuthProvider, AuthContext } from "./contexts/AuthContext";
import Login from "./components/auth/Login";
import AdminRoute from "./components/auth/AdminRoute";
import Dashboard from "./components/dashboard/Dashboard";
import ExpressDataManagement from "./components/ExpressDataManagement";
import ExceptionRecordManagement from "./components/ExceptionRecordManagement";
import InventoryExceptionManagement from "./components/InventoryExceptionManagement";
import UnauthorizedPage from "./components/UnauthorizedPage";
import "./App.css";

const { Header, Sider, Content } = Layout;

// 主布局组件
function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { isAdmin, adminLogout } = useContext(AuthContext);

  // 处理管理员操作
  const handleAdminAction = () => {
    if (isAdmin) {
      // 登出
      adminLogout();
      message.success("已退出管理员模式");
    } else {
      // 跳转到登录页
      window.location.href = "/login";
    }
  };

  const [selectedKey, setSelectedKey] = useState("1");

  return (
    <Layout className="app-layout">
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div className="logo">
          <span>{collapsed ? "📊" : "📊 快递数据分析"}</span>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          onSelect={({ key }) => setSelectedKey(key)}
        >
          <Menu.Item key="1" icon={<DashboardOutlined />}>
            <Link to="/dashboard">数据仪表盘</Link>
          </Menu.Item>
          <Menu.Item key="2" icon={<DatabaseOutlined />}>
            <Link to="/data">数据管理</Link>
          </Menu.Item>
          <Menu.Item key="3" icon={<ExceptionOutlined />}>
            <Link to="/exceptions">异常记录</Link>
          </Menu.Item>
          <Menu.Item key="4" icon={<WarningOutlined />}>
            <Link to="/inventory-exceptions">库存异常</Link>
          </Menu.Item>
        </Menu>
      </Sider>
      <Layout className="site-layout">
        <Header className="site-header">
          {React.createElement(
            collapsed ? MenuUnfoldOutlined : MenuFoldOutlined,
            {
              className: "trigger",
              onClick: () => setCollapsed(!collapsed),
            }
          )}
          <div className="header-right">
            <Button
              icon={isAdmin ? <UnlockOutlined /> : <LockOutlined />}
              type={isAdmin ? "primary" : "default"}
              onClick={handleAdminAction}
            >
              {isAdmin ? "退出管理员模式" : "管理员登录"}
            </Button>
          </div>
        </Header>
        <Content className="site-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route
              path="/data"
              element={
                isAdmin ? (
                  <ExpressDataManagement />
                ) : (
                  <Navigate to="/unauthorized" replace />
                )
              }
            />
            <Route
              path="/exceptions"
              element={
                isAdmin ? (
                  <ExceptionRecordManagement />
                ) : (
                  <Navigate to="/unauthorized" replace />
                )
              }
            />
            <Route
              path="/inventory-exceptions"
              element={
                isAdmin ? (
                  <InventoryExceptionManagement />
                ) : (
                  <Navigate to="/unauthorized" replace />
                )
              }
            />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

// 应用程序主组件
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<MainLayout />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
