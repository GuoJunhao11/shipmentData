// src/components/InventoryExceptionManagement.js - 支持多选筛选版本
import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Space,
  Popconfirm,
  message,
  Input,
  Select,
  Typography,
  Tag,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  FilterOutlined,
  SearchOutlined,
  DownloadOutlined,
  ClearOutlined,
} from "@ant-design/icons";
import { useInventoryData } from "../hooks/useInventoryData";
import InventoryExceptionForm from "./InventoryExceptionForm";
import ServerStatus from "./ServerStatus";
import moment from "moment";
import * as XLSX from "xlsx";

const { Option } = Select;
const { Title, Text } = Typography;

// 日期格式化辅助函数
const formatDisplayDate = (dateStr) => {
  if (!dateStr) return "";

  try {
    if (dateStr.includes("T")) {
      const date = new Date(dateStr);
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      const year = date.getFullYear();
      return `${month}/${day}/${year}`;
    }

    if (dateStr.includes("/")) {
      const parts = dateStr.split("/");
      if (parts.length === 3) {
        return dateStr;
      } else if (parts.length === 2) {
        const month = parts[0].padStart(2, "0");
        const day = parts[1].padStart(2, "0");
        const year = new Date().getFullYear();
        return `${month}/${day}/${year}`;
      }
    }

    return dateStr;
  } catch (e) {
    console.error("日期显示格式化错误:", e);
    return dateStr;
  }
};

// 解析日期用于排序
const parseDateForSort = (dateStr) => {
  if (!dateStr) return new Date(0);

  try {
    if (dateStr.includes("T")) {
      return new Date(dateStr);
    }

    if (dateStr.includes("/")) {
      const parts = dateStr.split("/");
      if (parts.length === 3) {
        return new Date(parts[2], parts[0] - 1, parts[1]);
      } else if (parts.length === 2) {
        const currentYear = new Date().getFullYear();
        return new Date(currentYear, parts[0] - 1, parts[1]);
      }
    }

    return new Date(dateStr);
  } catch (e) {
    console.error("日期解析错误:", e);
    return new Date(0);
  }
};

// 获取差异显示标签
const getDifferenceDisplay = (actual, system) => {
  const difference = actual - system;
  if (difference > 0) {
    return (
      <span
        style={{
          color: "#52c41a",
          fontWeight: "bold",
          padding: "2px 6px",
          backgroundColor: "#f6ffed",
          borderRadius: "4px",
          border: "1px solid #b7eb8f",
        }}
      >
        +{difference}
      </span>
    );
  } else if (difference < 0) {
    return (
      <span
        style={{
          color: "#ff4d4f",
          fontWeight: "bold",
          padding: "2px 6px",
          backgroundColor: "#fff2f0",
          borderRadius: "4px",
          border: "1px solid #ffccc7",
          fontSize: "14px",
          textShadow: "0 0 2px rgba(255, 77, 79, 0.3)",
        }}
      >
        {difference}
      </span>
    );
  } else {
    return (
      <span
        style={{
          color: "#8c8c8c",
          fontWeight: "normal",
        }}
      >
        0
      </span>
    );
  }
};

// 快速筛选按钮组
const QuickFilterButtons = ({
  data,
  differenceFilter,
  onDifferenceFilterChange,
}) => {
  const getDifferenceCount = (type) => {
    if (type === "all") return data.length;
    return data.filter((item) => {
      const diff = item.实际库存 - item.系统库存;
      switch (type) {
        case "surplus":
          return diff > 0;
        case "shortage":
          return diff < 0;
        case "normal":
          return diff === 0;
        default:
          return true;
      }
    }).length;
  };

  const filterButtons = [
    { key: "all", label: "全部" },
    { key: "surplus", label: "盈余" },
    { key: "shortage", label: "亏损" },
    { key: "normal", label: "正常" },
  ];

  return (
    <div style={{ marginBottom: 16 }}>
      <Space wrap>
        {filterButtons.map((button) => {
          const count = getDifferenceCount(button.key);
          const isActive = differenceFilter === button.key;

          return (
            <Button
              key={button.key}
              type={isActive ? "primary" : "default"}
              size="small"
              onClick={() => onDifferenceFilterChange(button.key)}
            >
              {button.label} ({count})
            </Button>
          );
        })}
      </Space>
    </div>
  );
};

// 筛选标签显示组件
const FilterTags = ({ selectedCustomerCodes, selectedLocations, onRemoveCustomerCode, onRemoveLocation, onClearAll }) => {
  const hasFilters = selectedCustomerCodes.length > 0 || selectedLocations.length > 0;
  
  if (!hasFilters) return null;

  return (
    <div style={{ marginBottom: 16, padding: "8px", backgroundColor: "#f5f5f5", borderRadius: "4px" }}>
      <Space wrap>
        <Text strong>当前筛选条件：</Text>
        
        {selectedCustomerCodes.map(code => (
          <Tag
            key={`customer-${code}`}
            closable
            onClose={() => onRemoveCustomerCode(code)}
            color="blue"
          >
            客户: {code}
          </Tag>
        ))}
        
        {selectedLocations.map(location => (
          <Tag
            key={`location-${location}`}
            closable
            onClose={() => onRemoveLocation(location)}
            color="green"
          >
            库位: {location}
          </Tag>
        ))}
        
        {hasFilters && (
          <Button
            type="link"
            size="small"
            icon={<ClearOutlined />}
            onClick={onClearAll}
            style={{ padding: 0 }}
          >
            清除所有筛选
          </Button>
        )}
      </Space>
    </div>
  );
};

// Excel导出功能
const exportToExcel = (data, filters) => {
  if (!data || data.length === 0) {
    message.warning("没有数据可导出");
    return;
  }

  // 准备Excel数据
  const excelData = data.map((item, index) => {
    const difference = item.实际库存 - item.系统库存;
    return {
      序号: index + 1,
      日期: formatDisplayDate(item.日期),
      客户代码: item.客户代码,
      SKU: item.SKU,
      产品名: item.产品名,
      实际库存: item.实际库存,
      系统库存: item.系统库存,
      差异: difference > 0 ? `+${difference}` : difference,
      库位: item.库位,
      备注: item.备注 || "",
    };
  });

  // 创建工作簿
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(excelData);

  // 设置列宽
  ws["!cols"] = [
    { wch: 6 }, { wch: 12 }, { wch: 12 }, { wch: 20 }, { wch: 30 },
    { wch: 10 }, { wch: 10 }, { wch: 8 }, { wch: 10 }, { wch: 20 },
  ];

  // 添加工作表
  XLSX.utils.book_append_sheet(wb, ws, "库存异常记录");

  // 生成文件名
  const now = moment().format("YYYY-MM-DD_HH-mm");
  let filename = `库存异常记录_${now}`;

  if (filters.selectedCustomerCodes?.length > 0) {
    filename += `_客户${filters.selectedCustomerCodes.length}个`;
  }
  if (filters.selectedLocations?.length > 0) {
    filename += `_库位${filters.selectedLocations.length}个`;
  }

  filename += ".xlsx";

  // 导出文件
  XLSX.writeFile(wb, filename);
  message.success(`Excel文件已导出: ${filename}`);
};

const InventoryExceptionManagement = () => {
  const {
    data,
    loading,
    error,
    serverStatus,
    fetchData,
    addData,
    updateData,
    removeData,
    checkStatus,
  } = useInventoryData();

  const [formVisible, setFormVisible] = useState(false);
  const [currentData, setCurrentData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // 修改为数组形式，支持多选
  const [selectedCustomerCodes, setSelectedCustomerCodes] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  
  const [differenceFilter, setDifferenceFilter] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [skuSearchText, setSkuSearchText] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [groupedByCustomer, setGroupedByCustomer] = useState({});

  // 获取唯一的客户代码列表
  const getUniqueCustomerCodes = () => {
    const codes = [...new Set(data.map((item) => item.客户代码))].filter(Boolean);
    return codes.sort();
  };

  // 获取唯一的库位列表
  const getUniqueLocations = () => {
    const locations = [...new Set(data.map((item) => item.库位))].filter(Boolean);
    return locations.sort();
  };

  useEffect(() => {
    if (error) {
      message.error(error);
    }
  }, [error]);

  // 根据筛选条件筛选数据
  useEffect(() => {
    if (!data || data.length === 0) {
      setFilteredData([]);
      setGroupedByCustomer({});
      return;
    }

    let filteredResult = [...data];

    // 客户代码筛选（多选）
    if (selectedCustomerCodes.length > 0) {
      filteredResult = filteredResult.filter((item) =>
        selectedCustomerCodes.includes(item.客户代码)
      );
    }

    // 库位筛选（多选）
    if (selectedLocations.length > 0) {
      filteredResult = filteredResult.filter((item) =>
        selectedLocations.includes(item.库位)
      );
    }

    // 差异类型筛选
    if (differenceFilter !== "all") {
      filteredResult = filteredResult.filter((item) => {
        const diff = item.实际库存 - item.系统库存;
        switch (differenceFilter) {
          case "surplus":
            return diff > 0;
          case "shortage":
            return diff < 0;
          case "normal":
            return diff === 0;
          default:
            return true;
        }
      });
    }

    // 搜索文本筛选
    if (searchText) {
      const lowerSearchText = searchText.toLowerCase();
      filteredResult = filteredResult.filter(
        (item) =>
          (item.产品名 &&
            item.产品名.toLowerCase().includes(lowerSearchText)) ||
          (item.备注 && item.备注.toLowerCase().includes(lowerSearchText))
      );
    }

    // SKU搜索筛选
    if (skuSearchText) {
      const lowerSkuSearch = skuSearchText.toLowerCase();
      const skuList = lowerSkuSearch
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s);
      if (skuList.length > 0) {
        filteredResult = filteredResult.filter(
          (item) =>
            item.SKU &&
            skuList.some((sku) => item.SKU.toLowerCase().includes(sku))
        );
      }
    }

    setFilteredData(filteredResult);

    // 按客户代码分组
    const grouped = {};
    filteredResult.forEach((item) => {
      const customerCode = item.客户代码 || "未知客户";
      if (!grouped[customerCode]) {
        grouped[customerCode] = [];
      }
      grouped[customerCode].push(item);
    });

    // 对每个客户内的记录按日期降序排序
    Object.keys(grouped).forEach((customerCode) => {
      grouped[customerCode].sort((a, b) => {
        const dateA = parseDateForSort(a.日期);
        const dateB = parseDateForSort(b.日期);
        return dateB - dateA;
      });
    });

    // 按客户代码排序
    const sortedCustomers = Object.keys(grouped).sort();
    const sortedGrouped = {};
    sortedCustomers.forEach((customer) => {
      sortedGrouped[customer] = grouped[customer];
    });

    setGroupedByCustomer(sortedGrouped);
  }, [
    data,
    selectedCustomerCodes,
    selectedLocations,
    differenceFilter,
    searchText,
    skuSearchText,
  ]);

  // 处理客户代码多选变化
  const handleCustomerCodeChange = (values) => {
    setSelectedCustomerCodes(values || []);
  };

  // 处理库位多选变化
  const handleLocationChange = (values) => {
    setSelectedLocations(values || []);
  };

  // 移除单个客户代码筛选
  const handleRemoveCustomerCode = (codeToRemove) => {
    setSelectedCustomerCodes(prev => prev.filter(code => code !== codeToRemove));
  };

  // 移除单个库位筛选
  const handleRemoveLocation = (locationToRemove) => {
    setSelectedLocations(prev => prev.filter(location => location !== locationToRemove));
  };

  // 清除所有筛选条件
  const handleClearAllFilters = () => {
    setSelectedCustomerCodes([]);
    setSelectedLocations([]);
    setDifferenceFilter("all");
    setSearchText("");
    setSkuSearchText("");
  };

  const handleAddClick = () => {
    setCurrentData(null);
    setIsEditing(false);
    setFormVisible(true);
  };

  const handleEditClick = (record) => {
    setCurrentData(record);
    setIsEditing(true);
    setFormVisible(true);
  };

  const handleDeleteClick = async (id) => {
    const success = await removeData(id);
    if (success) {
      message.success("库存异常记录删除成功");
    }
  };

  const handleFormSubmit = async (values) => {
    if (isEditing && currentData) {
      const success = await updateData(currentData._id, values);
      if (success) {
        setFormVisible(false);
        message.success("库存异常记录更新成功");
      }
    } else {
      const success = await addData(values);
      if (success) {
        setFormVisible(false);
        message.success("库存异常记录添加成功");
      }
    }
  };

  const handleFormCancel = () => {
    setFormVisible(false);
  };

  const handleRefresh = () => {
    fetchData();
  };

  const handleExport = () => {
    exportToExcel(filteredData, {
      selectedCustomerCodes,
      selectedLocations,
      difference: differenceFilter,
      search: searchText,
      skuSearch: skuSearchText,
    });
  };

  // 表格列定义
  const columns = [
    {
      title: "日期",
      dataIndex: "日期",
      key: "日期",
      render: (text) => formatDisplayDate(text),
      width: 100,
      sorter: (a, b) => {
        const dateA = parseDateForSort(a.日期);
        const dateB = parseDateForSort(b.日期);
        return dateA - dateB;
      },
    },
    {
      title: "SKU",
      dataIndex: "SKU",
      key: "SKU",
      width: 150,
    },
    {
      title: "产品名",
      dataIndex: "产品名",
      key: "产品名",
      width: 200,
      ellipsis: true,
    },
    {
      title: "实际库存",
      dataIndex: "实际库存",
      key: "实际库存",
      width: 100,
      sorter: (a, b) => a.实际库存 - b.实际库存,
    },
    {
      title: "系统库存",
      dataIndex: "系统库存",
      key: "系统库存",
      width: 100,
      sorter: (a, b) => a.系统库存 - b.系统库存,
    },
    {
      title: "差异",
      key: "差异",
      width: 80,
      render: (_, record) =>
        getDifferenceDisplay(record.实际库存, record.系统库存),
      sorter: (a, b) => a.实际库存 - a.系统库存 - (b.实际库存 - b.系统库存),
    },
    {
      title: "库位",
      dataIndex: "库位",
      key: "库位",
      width: 100,
    },
    {
      title: "备注",
      dataIndex: "备注",
      key: "备注",
      ellipsis: true,
      width: 150,
      render: (text) => text || "-",
    },
    {
      title: "操作",
      key: "action",
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEditClick(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除此条库存异常记录吗?"
            onConfirm={() => handleDeleteClick(record._id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              size="small"
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <ServerStatus status={serverStatus} onCheckStatus={checkStatus} />

      {/* 管理标题和添加按钮 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
          paddingBottom: "8px",
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          库存异常记录管理
        </Title>
        <Space>
          <Button
            type="default"
            icon={<DownloadOutlined />}
            onClick={handleExport}
            disabled={filteredData.length === 0}
          >
            导出Excel ({filteredData.length}条)
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddClick}
          >
            添加库存异常记录
          </Button>
        </Space>
      </div>

      {/* 快速筛选按钮组 */}
      <QuickFilterButtons
        data={data}
        differenceFilter={differenceFilter}
        onDifferenceFilterChange={setDifferenceFilter}
      />

      {/* 操作按钮和筛选器 */}
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
              刷新数据
            </Button>
            <Button
              icon={<ClearOutlined />}
              onClick={handleClearAllFilters}
              disabled={selectedCustomerCodes.length === 0 && selectedLocations.length === 0 && differenceFilter === 'all' && !searchText && !skuSearchText}
            >
              清除筛选
            </Button>
          </Space>
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            alignItems: "center",
          }}
        >
          <Input
            placeholder="搜索产品名/备注"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 150 }}
            allowClear
          />
          <Input
            placeholder="搜索SKU(多个用逗号分隔)"
            prefix={<SearchOutlined />}
            value={skuSearchText}
            onChange={(e) => setSkuSearchText(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
          <span>
            <FilterOutlined /> 客户代码:
          </span>
          <Select
            mode="multiple"
            value={selectedCustomerCodes}
            onChange={handleCustomerCodeChange}
            placeholder="选择客户代码"
            style={{ minWidth: 200, maxWidth: 300 }}
            maxTagCount="responsive"
            allowClear
            showSearch
            filterOption={(input, option) =>
              option.children.toLowerCase().includes(input.toLowerCase())
            }
          >
            {getUniqueCustomerCodes().map((code) => (
              <Option key={code} value={code}>
                {code}
              </Option>
            ))}
          </Select>
          <span>
            <FilterOutlined /> 库位:
          </span>
          <Select
            mode="multiple"
            value={selectedLocations}
            onChange={handleLocationChange}
            placeholder="选择库位"
            style={{ minWidth: 150, maxWidth: 250 }}
            maxTagCount="responsive"
            allowClear
            showSearch
            filterOption={(input, option) =>
              option.children.toLowerCase().includes(input.toLowerCase())
            }
          >
            {getUniqueLocations().map((location) => (
              <Option key={location} value={location}>
                {location}
              </Option>
            ))}
          </Select>
        </div>
      </div>

      {/* 筛选标签显示 */}
      <FilterTags
        selectedCustomerCodes={selectedCustomerCodes}
        selectedLocations={selectedLocations}
        onRemoveCustomerCode={handleRemoveCustomerCode}
        onRemoveLocation={handleRemoveLocation}
        onClearAll={handleClearAllFilters}
      />

      {/* 按客户分组显示库存异常记录 */}
      {Object.keys(groupedByCustomer).length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "50px 20px",
            background: "#fff",
            border: "1px solid #f0f0f0",
            borderRadius: "2px",
          }}
        >
          <Text type="secondary">没有符合条件的库存异常记录</Text>
        </div>
      ) : (
        Object.entries(groupedByCustomer).map(([customerCode, records]) => (
          <div
            key={customerCode}
            style={{
              marginBottom: 24,
              background: "#fff",
              border: "1px solid #f0f0f0",
              borderRadius: "2px",
            }}
          >
            <div
              style={{
                padding: "10px 16px",
                fontWeight: "bold",
                fontSize: "16px",
                borderBottom: "1px solid #f0f0f0",
                backgroundColor: "#fafafa",
              }}
            >
              客户代码: {customerCode} ({records.length}条记录)
            </div>
            <div style={{ padding: "16px" }}>
              <Table
                columns={columns}
                dataSource={records.map((item) => ({
                  ...item,
                  key: item._id,
                }))}
                loading={loading}
                pagination={records.length > 10 ? { pageSize: 10 } : false}
                size="small"
                scroll={{ x: 1300 }}
                bordered
                onRow={(record) => ({
                  onDoubleClick: () => {
                    handleEditClick(record);
                  },
                  style: { cursor: "pointer" },
                })}
              />
            </div>
          </div>
        ))
      )}

      <InventoryExceptionForm
        visible={formVisible}
        initialValues={currentData}
        onSubmit={handleFormSubmit}
        onCancel={handleFormCancel}
        title={isEditing ? "编辑库存异常记录" : "添加库存异常记录"}
      />
    </div>
  );
};

export default InventoryExceptionManagement;