"use client";

import type React from "react";
import { useEffect, useState, useMemo } from "react";
import Button from "@/components/Atomic/Button";
import PopupModal from "@/components/Molecules/ui/PopupModal";
import DataTable from "@/components/Molecules/DataTable";
import DateRangeFilter, { DateRangeFilterState } from "@/components/Molecules/DateRangeFilter";
import { getDateRange } from "@/utils/dateRangeUtils";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchBrands, removeBrand } from "@/redux/brand/brandSlice";
import { Brand } from "@/redux/brand/brandTypes";
import { NOT_AVAILABLE, truncateText } from "@/constants/commonConstants";

const AllBrand: React.FC = () => {
  const [isModelOpen, setIsModalOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const brands = useAppSelector((state) => state.brands.brands);
  const [filters, setFilters] = useState<DateRangeFilterState>({
    dateRange: "Last 30 Days",
  });

  const renderActionsColumn = (brand: Brand) => {
    const brandHash = brand.hash || (brand as any).hash;
    const hashOrId = brandHash || brand.id;
    return (
      <div className="flex gap-x-2 justify-end pt-2">
        <Button
          style="Icon"
          href={`/dashboard/inventory/brands/edit/${hashOrId}`}
          icon="edit"
        />
      <Button
        style="IconDelete"
        icon="delete"
        onClick={() => {
          setSelectedBrand(brand);
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
      title: "Brands",
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
      render: (_: any, brand: Brand) => renderActionsColumn(brand),
    },
  ];

  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchBrands());
  }, [dispatch]);

  const handleDelete = async () => {
    if (!selectedBrand || !selectedBrand.id) {
      setDeleteError("No brand selected for deletion");
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await dispatch(removeBrand(selectedBrand.id)).unwrap();
      setIsModalOpen(false);
      setSelectedBrand(null);
      // Refresh the brands list
      dispatch(fetchBrands());
    } catch (error: any) {
      console.error("Delete error:", error);
      setDeleteError(
        error?.message || "Failed to delete brand. Please try again."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter brands based on filter state
  const filteredBrands = useMemo(() => {
    let filtered = [...brands];

    // Filter by date range
    if (filters.dateRange && filters.dateRange !== "All") {
      const { start, end } = getDateRange(filters.dateRange);
      filtered = filtered.filter((brand) => {
        const dateValue = brand.createdAt;
        if (!dateValue) return false;

        try {
          const brandDate = new Date(dateValue);
          if (isNaN(brandDate.getTime())) return false;
          return brandDate >= start && brandDate <= end;
        } catch {
          return false;
        }
      });
    }

    return filtered;
  }, [brands, filters]);

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
    if (!filteredBrands.length || isExporting) return;
    setIsExporting(true);
    try {
      const headers = [
        "ID",
        "Date Created",
        "Name",
        "Description",
        "Remarks",
      ];

      const csvRows = filteredBrands.map((brand) => {
        return [
          brand.id || "",
          formatDateTime(brand.createdAt),
          brand.name || "",
          brand.description || "",
          brand.remarks || "",
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
        `brands_${new Date().toISOString().slice(0, 10)}.csv`
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
        <p className="text-xl font-medium tracking-tighter">All Brand ({visibleCount})</p>
        <div className="flex gap-4">
          <button
            onClick={handleExport}
            disabled={isExporting || filteredBrands.length === 0}
            className="h-10 rounded-xl px-3 flex items-center gap-x-2 text-base font-medium border border-primary-100 hover:bg-primary-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <img src="/src/assets/Images/Dashboard/doc/exl-icon.svg" alt="" />
            {isExporting ? "Exporting..." : "Export Brand"}
          </button>
          <Button
            style="Secondary"
            href="/dashboard/inventory/brands/add"
            text="Add New Brand"
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
        data={filteredBrands}
        searchPlaceholder="Search by any Brand details..."
        showSearch={true}
        showPagination={true}
        onCountChange={setVisibleCount}
      />

      {/* Delete Confirmation Modal */}
      <PopupModal
        open={isModelOpen}
        onClose={() => {
          if (!isDeleting) {
            setIsModalOpen(false);
            setSelectedBrand(null);
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
                setSelectedBrand(null);
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
            Are you sure you want to delete this brand? You CAN NOT view this
            brand in your list anymore if you delete.
          </p>
          {selectedBrand && (
            <p className="font-medium text-textColor-primary">
              Brand: {selectedBrand.name || `Brand #${selectedBrand.id}`}
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

export default AllBrand;
