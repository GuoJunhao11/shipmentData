export const loadExpressData = () => {
  try {
    const savedData = localStorage.getItem("expressData");
    if (savedData) {
      return JSON.parse(savedData);
    }
    return []; // 如果没有保存的数据，返回空数组
  } catch (error) {
    console.error("加载数据失败:", error);
    return [];
  }
};

// 保存数据到本地存储
export const saveExpressData = (data) => {
  try {
    localStorage.setItem("expressData", JSON.stringify(data));
    return true;
  } catch (error) {
    console.error("保存数据失败:", error);
    return false;
  }
};

// 添加新数据
export const addExpressData = (newData) => {
  try {
    const currentData = loadExpressData();
    const updatedData = [...currentData, newData];
    return saveExpressData(updatedData) ? updatedData : currentData;
  } catch (error) {
    console.error("添加数据失败:", error);
    return loadExpressData();
  }
};

// 更新数据
export const updateExpressData = (index, updatedData) => {
  try {
    const currentData = loadExpressData();
    if (index < 0 || index >= currentData.length) {
      return currentData;
    }
    const newData = [...currentData];
    newData[index] = updatedData;
    return saveExpressData(newData) ? newData : currentData;
  } catch (error) {
    console.error("更新数据失败:", error);
    return loadExpressData();
  }
};

// 删除数据
export const deleteExpressData = (index) => {
  try {
    const currentData = loadExpressData();
    if (index < 0 || index >= currentData.length) {
      return currentData;
    }
    const newData = currentData.filter((_, i) => i !== index);
    return saveExpressData(newData) ? newData : currentData;
  } catch (error) {
    console.error("删除数据失败:", error);
    return loadExpressData();
  }
};
