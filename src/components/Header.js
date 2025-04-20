import React from "react";
import { Layout } from "antd";

const { Header: AntHeader } = Layout;

function Header() {
  return (
    <AntHeader className="app-header">
      <span className="app-logo">🚚</span>
      <h1>快递数据分析系统</h1>
    </AntHeader>
  );
}

export default Header;
