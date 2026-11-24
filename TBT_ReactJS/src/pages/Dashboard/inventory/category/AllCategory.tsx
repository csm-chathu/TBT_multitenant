"use client";

import type React from "react";
import { useEffect, useState, useMemo } from "react";
import Button from "@/components/Atomic/Button";
import PopupModal from "@/components/Molecules/ui/PopupModal";
import DataTable from "@/components/Molecules/DataTable";
import DateRangeFilter, { DateRangeFilterState } from "@/components/Molecules/DateRangeFilter";
import { getDateRange } from "@/utils/dateRangeUtils";
import { Category } from "@/redux/category/categoryTypes";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchCategories, removeCategory } from "@/redux/category/categorySlice";
import { NOT_AVAILABLE, truncateText } from "@/constants/commonConstants";

const AllCategory: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const categories = useAppSelector((state) => state.categories.categories);
  const [filters, setFilters] = useState<DateRangeFilterState>({
    dateRange: "Last 30 Days",
  });

  const renderActionsColumn = (category: Category) => {
    const categoryHash = category.hash || (category as any).hash;
    const hashOrId = categoryHash || category.id;
    return (
      <div className="flex gap-x-2 justify-end pt-2">
        <Button
          style="Icon"
          href={`/dashboard/inventory/category/edit/${hashOrId}`}
          icon="edit"
        />
      <Button
        style="IconDelete"
        icon="delete"
        onClick={() => {
          setSelectedCategory(category);
          setDeleteError(null);
          setIsModalOpen(true);
        }}
      />
    </div>
    );
  };

  const columns = [
    {
      key: "createdAt",
      title: "Date Created",
      render: (value: string) => {
        if (!value) return <span>{NOT_AVAILABLE}</span>;
        const date = new Date(value);
        const formattedDate = `${date.toLocaleString("en-US", {
          month: "short",
        })}${date.getDate()}, ${date.getFullYear()}  ${date.toLocaleTimeString(
          "en-US",
          {
            hour12: false,
          }
        )}`;
        return <span>{formattedDate}</span>;
      },
    },
    {
      key: "name",
      title: "Category",
    },
    {
      key: "description",
      title: "Description",
      render: (value: string) => {
        if (!value) return <span>{NOT_AVAILABLE}</span>;
        const truncated = truncateText(value);
        return <span title={value}>{truncated}</span>;
      },
    },
    {
      key: "remarks",
      title: "Remark",
      render: (value: string) => {
        if (!value) return <span>{NOT_AVAILABLE}</span>;
        const truncated = truncateText(value);
        return <span title={value}>{truncated}</span>;
      },
    },
    {
      key: "actions",
      title: "Action",
      align: "right" as const,
      render: (_: any, category: Category) => renderActionsColumn(category),
    },
  ];

  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const handleDelete = async () => {
    if (!selectedCategory || !selectedCategory.id) {
      setDeleteError("No category selected for deletion");
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await dispatch(removeCategory(selectedCategory.id)).unwrap();
      setIsModalOpen(false);
      setSelectedCategory(null);
      // Refresh the categories list
      dispatch(fetchCategories());
    } catch (error: any) {
      console.error("Delete error:", error);
      setDeleteError(
        error?.message || "Failed to delete category. Please try again."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter categories based on filter state
  const filteredCategories = useMemo(() => {
    let filtered = [...categories];

    // Filter by date range
    if (filters.dateRange && filters.dateRange !== "All") {
      const { start, end } = getDateRange(filters.dateRange);
      filtered = filtered.filter((category) => {
        const dateValue = category.createdAt;
        if (!dateValue) return false;

        try {
          const categoryDate = new Date(dateValue);
          if (isNaN(categoryDate.getTime())) return false;
          return categoryDate >= start && categoryDate <= end;
        } catch {
          return false;
        }
      });
    }

    return filtered;
  }, [categories, filters]);

  const formatDateTime = (value: string | Date | number | undefined): string => {
    if (!value) return "";
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) return "";
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const handleExport = () => {
    if (!filteredCategories.length || isExporting) return;
    setIsExporting(true);
    try {
      const headers = [
        "ID",
        "Date Created",
        "Name",
        "Description",
        "Remarks",
      ];

      const csvRows = filteredCategories.map((category) => {
        return [
          category.id || "",
          formatDateTime(category.createdAt),
          category.name || "",
          category.description || "",
          category.remarks || "",
        ];
      });

      const escapeCsvValue = (value: unknown): string => {
        const stringValue =
          value === null || value === undefined ? "" : String(value).replace(/\r?\n/g, " ");
        if (/[",]/.test(stringValue)) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      };

      const csvContent = [
        headers.join(","),
        ...csvRows.map((row) => row.map(escapeCsvValue).join(",")),
      ].join("\r\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `categories_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title and Actions */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <p className="text-xl font-medium tracking-tighter">All Category ({visibleCount})</p>
        <div className="flex gap-4">
          <button
            onClick={handleExport}
            disabled={isExporting || filteredCategories.length === 0}
            className="h-10 rounded-xl px-3 flex items-center gap-x-2 text-base font-medium border border-primary-100 hover:bg-primary-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <img src="/src/assets/Images/Dashboard/doc/exl-icon.svg" alt="" />
            {isExporting ? "Exporting..." : "Export Category"}
          </button>
          <Button
            style="Secondary"
            href="/dashboard/inventory/category/add"
            text="Add New Category"
            icon="add"
          />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mt-6 flex flex-wrap gap-2 items-center justify-between">
        <DateRangeFilter onFilterChange={setFilters} />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredCategories}
        searchPlaceholder="Search by any category details..."
        showSearch={true}
        showPagination={true}
        onCountChange={setVisibleCount}
      />

      {/* Delete Confirmation Modal */}
      <PopupModal
        open={isModalOpen}
        onClose={() => {
          if (!isDeleting) {
            setIsModalOpen(false);
            setSelectedCategory(null);
            setDeleteError(null);
          }
        }}
        onConfirm={handleDelete}
        title="Confirm Delete"
        customFooter={
          <div className="flex justify-end gap-2 w-full">
            <Button
              style="Tertiary"
              text="No, Don't Delete"
              onClick={() => {
                setIsModalOpen(false);
                setSelectedCategory(null);
                setDeleteError(null);
              }}
              disabled={isDeleting}
            />
            <Button
              style="Danger"
              text={isDeleting ? "Deleting..." : "Yes, Delete"}
              onClick={handleDelete}
              disabled={isDeleting}
            />
          </div>
        }
      >
        <div className="space-y-4">
          <p>
            Are you sure you want to delete this category? You CAN NOT view this
            category in your list anymore if you delete.
          </p>
          {selectedCategory && (
            <p className="font-medium text-textColor-primary">
              Category: {selectedCategory.name || `Category #${selectedCategory.id}`}
            </p>
          )}
          {deleteError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
              {deleteError}
            </div>
          )}
        </div>
      </PopupModal>
    </div>
  );
};

export default AllCategory;
