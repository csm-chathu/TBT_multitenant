/**
 * Calculate date range based on filter string
 */
export const getDateRange = (dateRange: string): { start: Date; end: Date } => {
  const end = new Date();
  end.setHours(23, 59, 59, 999); // End of today
  const start = new Date();

  switch (dateRange) {
    case "All":
      start.setTime(0);
      break;
    case "Last 7 Days":
      start.setDate(start.getDate() - 7);
      break;
    case "Last 30 Days":
      start.setDate(start.getDate() - 30);
      break;
    case "Last 90 Days":
      start.setDate(start.getDate() - 90);
      break;
    case "This Month":
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
    case "This Year":
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      break;
    default:
      start.setDate(start.getDate() - 30);
  }

  start.setHours(0, 0, 0, 0);
  return { start, end };
};

