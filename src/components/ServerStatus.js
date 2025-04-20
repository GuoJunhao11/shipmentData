import React from "react";
import { Alert, Button, Space } from "antd";
import { ReloadOutlined } from "@ant-design/icons";

const ServerStatus = ({ status, onCheckStatus }) => {
  const getStatusType = () => {
    switch (status.status) {
      case "online":
        return "success";
      case "offline":
        return "error";
      default:
        return "warning";
    }
  };

  const getMessage = () => {
    if (status.status === "online") {
      return `MongoDB服务状态: ${status.message}`;
    } else if (status.status === "offline") {
      return `MongoDB连接失败: ${status.message}。请确保MongoDB服务已启动。`;
    } else {
      return "正在检查MongoDB连接状态...";
    }
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <Alert
        message="数据库状态"
        description={
          <Space>
            {getMessage()}
            <Button
              type="primary"
              size="small"
              icon={<ReloadOutlined />}
              onClick={onCheckStatus}
            >
              检查连接
            </Button>
          </Space>
        }
        type={getStatusType()}
        showIcon
      />
    </div>
  );
};

export default ServerStatus;
