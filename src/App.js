// src/App.js - 确保样例数据正确导入和加载
import React, { useState, useEffect, useContext } from "react";
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
} from "@ant-design/icons";
import { AuthProvider, AuthContext } from "./contexts/AuthContext";
import Login from "./components/auth/Login";
import AdminRoute from "./components/auth/AdminRoute";
import Dashboard from "./components/dashboard/Dashboard";
import DataEntry from "./components/data/DataEntry";
import DataTable from "./components/data/DataTable";
import UnauthorizedPage from "./components/UnauthorizedPage";
import "./App.css";
import { sampleData } from "./sampleData";

const { Header, Sider, Content } = Layout;

// 主布局组件
function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [expressData, setExpressData] = useState([]);
  const { isAdmin, adminLogout } = useContext(AuthContext);

  // 初始化加载样例数据 - 确保在组件挂载时只执行一次
  useEffect(() => {
    console.log("尝试加载数据...");
    // 从本地存储获取数据
    const savedData = localStorage.getItem("expressData");
    if (savedData) {
      console.log("从localStorage加载数据");
      try {
        const parsedData = JSON.parse(savedData);
        setExpressData(parsedData);
      } catch (error) {
        console.error("解析localStorage数据出错:", error);
        // 解析出错时，使用样例数据
        console.log("使用样例数据作为后备:", sampleData);
        setExpressData(sampleData);
        // 保存样例数据到localStorage
        localStorage.setItem("expressData", JSON.stringify(sampleData));
      }
    } else {
      // 如果没有保存的数据，使用样例数据
      console.log("没有保存的数据，使用样例数据:", sampleData);
      setExpressData(sampleData);
      // 保存样例数据到localStorage
      localStorage.setItem("expressData", JSON.stringify(sampleData));
    }
  }, []);

  // 调试查看数据状态
  useEffect(() => {
    console.log("当前数据状态:", expressData);
  }, [expressData]);

  // 当数据变化时保存到本地存储
  useEffect(() => {
    if (expressData.length > 0) {
      console.log("保存数据到localStorage");
      localStorage.setItem("expressData", JSON.stringify(expressData));
    }
  }, [expressData]);

  // 添加数据
  const handleAddData = (newData) => {
    console.log("添加新数据:", newData);
    setExpressData((prevData) => [...prevData, newData]);
  };

  // 更新数据
  const handleUpdateData = (oldData, newData) => {
    console.log("更新数据:", oldData, "->", newData);
    const updatedData = expressData.map((item) =>
      item === oldData ? newData : item
    );
    setExpressData(updatedData);
  };

  // 删除数据
  const handleDeleteData = (dataToDelete) => {
    console.log("删除数据:", dataToDelete);
    const filteredData = expressData.filter((item) => item !== dataToDelete);
    setExpressData(filteredData);
  };

  // 手动重置数据（仅用于调试）
  const resetToSampleData = () => {
    console.log("重置为样例数据");
    setExpressData(sampleData);
    message.success("数据已重置为样例数据");
  };

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
            {/* 仅在开发环境显示的调试按钮 */}
            {process.env.NODE_ENV === "development" && (
              <Button onClick={resetToSampleData} style={{ marginRight: 10 }}>
                重置数据
              </Button>
            )}
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
            <Route
              path="/dashboard"
              element={<Dashboard data={expressData} />}
            />
            <Route
              path="/data"
              element={
                <div>
                  <DataEntry onDataAdded={handleAddData} />
                  <DataTable
                    data={expressData}
                    onDataUpdated={handleUpdateData}
                    onDataDeleted={handleDeleteData}
                  />
                </div>
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
