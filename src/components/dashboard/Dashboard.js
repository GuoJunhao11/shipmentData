// 解析日期字符串为moment对象 - 统一处理各种格式
const parseDate = (dateStr) => {
  if (!dateStr) return null;

  // 处理 MM/DD/YYYY 格式
  if (dateStr.includes("/")) {
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      // MM/DD/YYYY 格式
      return moment(`${parts[2]}-${parts[0]}-${parts[1]}`, "YYYY-MM-DD");
    } else if (parts.length === 2) {
      // M/D 格式，添加当前年份
      const currentYear = moment().year();
      return moment(`${currentYear}-${parts[0]}-${parts[1]}`, "YYYY-MM-DD");
    }
  }
  // 处理ISO格式
  else if (dateStr.includes("T")) {
    return moment(dateStr);
  }

  return null;
};
