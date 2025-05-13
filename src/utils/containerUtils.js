// src/utils/containerUtils.js

import moment from "moment";

/**
 * Utility functions for container tracking
 */

/**
 * Parse a date string into a moment object
 * @param {string} dateStr Date string
 * @returns {moment.Moment|null} Moment object or null if invalid
 */
export const parseDate = (dateStr) => {
  if (!dateStr) return null;

  try {
    // Handle ISO format
    if (dateStr.includes("T")) {
      return moment(dateStr);
    }

    // Handle MM/DD/YYYY format
    if (dateStr.includes("/")) {
      const parts = dateStr.split("/");
      if (parts.length === 3) {
        return moment(`${parts[2]}-${parts[0]}-${parts[1]}`, "YYYY-MM-DD");
      } else if (parts.length === 2) {
        const currentYear = moment().year();
        return moment(`${currentYear}-${parts[0]}-${parts[1]}`, "YYYY-MM-DD");
      }
    }

    return moment(dateStr);
  } catch (error) {
    console.error("Failed to parse date:", error.message);
    return null;
  }
};

/**
 * Format a date string for display
 * @param {string} dateStr Date string
 * @returns {string} Formatted date string
 */
export const formatDisplayDate = (dateStr) => {
  if (!dateStr) return "";

  try {
    const momentDate = parseDate(dateStr);
    if (momentDate && momentDate.isValid()) {
      return momentDate.format("YYYY-MM-DD");
    }
    return dateStr;
  } catch (error) {
    console.error("Failed to format date:", error.message);
    return dateStr;
  }
};

/**
 * Determine the resolution status based on container data
 * @param {Object} data Container data
 * @param {Object} originalRecord Original container record
 * @returns {string|undefined} Resolution status
 */
export const determineResolutionStatus = (data, originalRecord) => {
  // If explicit resolution status is provided, use it
  if (data.resolutionStatus) {
    return data.resolutionStatus;
  }
  
  // If status is "completed" and there's an issue, mark as resolved
  if (data.status === "completed" && data.issue && data.issue.trim() !== "") {
    return "resolved";
  }
  
  // If status is "issue" and there's an issue, mark as issue
  if (data.status === "issue" && data.issue && data.issue.trim() !== "") {
    return "issue";
  }
  
  // Preserve original resolution status if available
  if (originalRecord && originalRecord.resolutionStatus) {
    return originalRecord.resolutionStatus;
  }
  
  // Default behavior
  return undefined;
};

/**
 * Get container type display name
 * @param {string} type Container type
 * @returns {Object} Type display name and color
 */
export const getContainerTypeInfo = (type) => {
  const typeMap = {
    whole: { color: "#1890ff", text: "整柜" },
    pallet: { color: "#52c41a", text: "托盘" },
    bulk: { color: "#fa8c16", text: "散货" },
  };
  
  return typeMap[type] || { color: "default", text: type || "未知" };
};

/**
 * Get status display name
 * @param {string} status Container status
 * @returns {Object} Status display name and color
 */
export const getStatusInfo = (status) => {
  const statusMap = {
    pending: { color: "blue", text: "待拆柜" },
    completed: { color: "green", text: "已完成" },
    issue: { color: "red", text: "有问题" },
  };
  
  return statusMap[status] || { color: "default", text: status || "未知" };
};

/**
 * Get resolution status display name
 * @param {string} status Resolution status
 * @returns {Object} Resolution status display name and color
 */
export const getResolutionStatusInfo = (status) => {
  const statusMap = {
    resolved: { color: "success", text: "已解决" },
    inProgress: { color: "warning", text: "处理中" },
    issue: { color: "error", text: "有问题" },
  };
  
  return statusMap[status] || { color: "default", text: status || "未知" };
};

/**
 * Filter issues from container data
 * @param {Array} data Container data
 * @returns {Array} Issue records
 */
export const filterIssuesFromData = (data) => {
  if (!Array.isArray(data)) return [];
  
  return data.filter(item => 
    item.status === "issue" && 
    item.issue && 
    item.issue.trim() !== ""
  );
};

/**
 * Calculate container statistics
 * @param {Array} data Container data
 * @returns {Object} Statistics
 */
export const calculateContainerStats = (data) => {
  if (!Array.isArray(data)) {
    return {
      totalContainers: 0,
      wholeContainers: 0,
      palletContainers: 0,
      bulkContainers: 0,
      issueContainers: 0,
    };
  }
  
  return {
    totalContainers: data.length,
    wholeContainers: data.filter(item => item.type === "whole").length,
    palletContainers: data.filter(item => item.type === "pallet").length,
    bulkContainers: data.filter(item => item.type === "bulk").length,
    issueContainers: data.filter(item => 
      item.issue && item.issue.trim() !== ""
    ).length,
  };
};