// 在表格列定义中修改日期列处理
const columns = [
  {
    title: "日期",
    dataIndex: "日期",
    key: "日期",
    fixed: "left",
    width: 100,
    render: (text) => {
      // 确保显示标准的 MM/DD/YYYY 格式
      if (!text) return "";

      // 已经是 MM/DD/YYYY 格式
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) {
        return text;
      }

      // 处理ISO格式
      if (text.includes("T")) {
        const date = new Date(text);
        return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(
          date.getDate()
        ).padStart(2, "0")}/${date.getFullYear()}`;
      }

      // 处理简单的 M/D 格式
      if (text.includes("/")) {
        const parts = text.split("/");
        if (parts.length === 2) {
          const month = String(parseInt(parts[0])).padStart(2, "0");
          const day = String(parseInt(parts[1])).padStart(2, "0");
          return `${month}/${day}/${new Date().getFullYear()}`;
        }
      }

      return text;
    },
    sorter: (a, b) => {
      const dateA = parseDateString(a.日期);
      const dateB = parseDateString(b.日期);
      return dateA - dateB;
    },
  },
  // 其他列保持不变...
];

// 帮助函数，将各种日期格式转换为日期对象用于排序
const parseDateString = (dateStr) => {
  if (!dateStr) return new Date(0);

  // ISO格式
  if (dateStr.includes("T")) {
    return new Date(dateStr);
  }

  // MM/DD/YYYY 格式
  if (dateStr.includes("/")) {
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      return new Date(parts[2], parts[0] - 1, parts[1]);
    }
    // M/D 格式
    if (parts.length === 2) {
      const currentYear = new Date().getFullYear();
      return new Date(currentYear, parts[0] - 1, parts[1]);
    }
  }

  return new Date(dateStr);
};
