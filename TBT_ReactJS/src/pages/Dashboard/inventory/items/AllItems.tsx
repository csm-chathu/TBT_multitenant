"use client";

import type React from "react";
import { useEffect, useState, useMemo, useRef } from "react";
import Button from "@/components/Atomic/Button";
import PopupModal from "@/components/Molecules/ui/PopupModal";
import DataTable from "@/components/Molecules/DataTable";
import DateRangeFilter, { DateRangeFilterState } from "@/components/Molecules/DateRangeFilter";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchItems, removeItem } from "@/redux/item/itemSlice";
import { Item } from "@/redux/item/itemTypes";
import { uploadInventoryCsv, CsvUploadResponse } from "@/services/itemService";
import { NOT_AVAILABLE, truncateText } from "@/constants/commonConstants";

const AllItems: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCsvUploadModalOpen, setIsCsvUploadModalOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<CsvUploadResponse | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const items = useAppSelector((state) => state.items.items);
  const [filters, setFilters] = useState<DateRangeFilterState>({
    dateRange: "Last 30 Days",
  });

  const renderActionsColumn = (item: Item) => {
    const itemHash = item.hash || (item as any).hash;
    const hashOrId = itemHash || item.id;
    return (
      <div className="flex gap-x-2 justify-end pt-2">
        <Button
          style="Icon"
          href={`/dashboard/inventory/items/edit/${hashOrId}`}
          icon="edit"
        />
      <Button
        style="IconDelete"
        icon="delete"
        onClick={() => {
          setSelectedItem(item);
          setDeleteError(null);
          setIsModalOpen(true);
        }}
      />
    </div>
    );
  };

  const columns = [
    { key: "name", title: "Item Name" },
    { key: "user", title: "User" },
    {
      key: "category",
      title: "Category",
      render: (_: any, item: Item) => {
        const categoryName = item.category || item.InventoryItemCategory?.name || NOT_AVAILABLE;
        const capitalized = categoryName !== NOT_AVAILABLE && categoryName 
          ? categoryName.charAt(0).toUpperCase() + categoryName.slice(1)
          : categoryName;
        return <span>{capitalized}</span>;
      },
    },
    {
      key: "brand",
      title: "Brand",
      render: (_: any, item: Item) => {
        const brandName = item.brand || item.InventoryItemBrand?.name || NOT_AVAILABLE;
        const capitalized = brandName !== NOT_AVAILABLE && brandName 
          ? brandName.charAt(0).toUpperCase() + brandName.slice(1)
          : brandName;
        return <span>{capitalized}</span>;
      },
    },
    { key: "ipAddress", title: "IP address" },
    { key: "serialNo", title: "Serial number" },
    {
      key: "purchasedAt",
      title: "Purchased Date",
      render: (value: string) => {
        if (!value) return <span>{NOT_AVAILABLE}</span>;
        const date = new Date(value);
        const formattedDate = `${date.toLocaleString("en-US", {
          month: "short",
        })} ${date.getDate()}, ${date.getFullYear()}`;
        return <span>{formattedDate}</span>;
      },
    },
    {
      key: "location",
      title: "Location",
      render: (_: any, item: Item) => {
        const locationName = item.location?.name || item.InventoryItemLocation?.name || NOT_AVAILABLE;
        const capitalized = locationName !== NOT_AVAILABLE && locationName 
          ? locationName.charAt(0).toUpperCase() + locationName.slice(1)
          : locationName;
        return <span>{capitalized}</span>;
      },
    },
    { key: "ownership", title: "Ownership" },
    { key: "condition", title: "Condition" },
    {
      key: "description",
      title: "Item Description",
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
      key: "createdAt",
      title: "Date Created",
      render: (value: string) => {
        if (!value) return <span>{NOT_AVAILABLE}</span>;
        const date = new Date(value);
        const formattedDate = `${date.toLocaleString("en-US", {
          month: "short",
        })} ${date.getDate()}, ${date.getFullYear()}  ${date.toLocaleTimeString(
          "en-US",
          {
            hour12: false,
          }
        )}`;
        return <span>{formattedDate}</span>;
      },
    },
    {
      key: "actions",
      title: "Action",
      align: "right" as const,
      render: (_: any, item: Item) => renderActionsColumn(item),
    },
  ];

  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchItems());
  }, [dispatch]);

  const handleDelete = async () => {
    if (!selectedItem || !selectedItem.id) {
      setDeleteError("No item selected for deletion");
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await dispatch(removeItem(selectedItem.id)).unwrap();
      setIsModalOpen(false);
      setSelectedItem(null);
      // Refresh the items list
      dispatch(fetchItems());
    } catch (error: any) {
      console.error("Delete error:", error);
      setDeleteError(
        error?.message || "Failed to delete item. Please try again."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculate date range based on filter
  const getDateRange = (dateRange: string): { start: Date; end: Date } => {
    const end = new Date();
    end.setHours(23, 59, 59, 999); // End of today
    const start = new Date();

    switch (dateRange) {
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

  // Filter items based on filter state
  const filteredItems = useMemo(() => {
    let filtered = [...items];

    // Filter by date range
    if (filters.dateRange && filters.dateRange !== "All") {
      const { start, end } = getDateRange(filters.dateRange);
      filtered = filtered.filter((item) => {
        const dateValue = item.createdAt || item.purchasedAt;
        if (!dateValue) return false;

        try {
          const itemDate = new Date(dateValue);
          if (isNaN(itemDate.getTime())) return false;
          return itemDate >= start && itemDate <= end;
        } catch {
          return false;
        }
      });
    }

    return filtered;
  }, [items, filters]);

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

  const firstUploadError = useMemo(() => {
    if (uploadResult?.errors?.length) {
      return uploadResult.errors[0].message;
    }
    if (uploadResult?.errorRows?.length) {
      return uploadResult.errorRows[0].errors || "Validation error";
    }
    return null;
  }, [uploadResult]);

  const handleExport = () => {
    if (!filteredItems.length || isExporting) return;
    setIsExporting(true);
    try {
      const headers = [
        "ID",
        "Item Name",
        "User",
        "Category",
        "Brand",
        "IP Address",
        "Serial Number",
        "Purchased Date",
        "Location",
        "Ownership",
        "Condition",
        "Item Description",
        "Date Created",
      ];

      const csvRows = filteredItems.map((item) => {
        // Format purchased date without time
        const formatDateOnly = (value: string | Date | number | undefined): string => {
          if (!value) return "";
          try {
            const date = new Date(value);
            if (isNaN(date.getTime())) return "";
            return date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
          } catch {
            return "";
          }
        };

        // Capitalize first letter helper
        const capitalize = (str: string | undefined): string => {
          if (!str || str === NOT_AVAILABLE) return str || NOT_AVAILABLE;
          return str.charAt(0).toUpperCase() + str.slice(1);
        };

        return [
          item.id || "",
          item.name || "",
          item.user || "",
          capitalize(item.category || item.InventoryItemCategory?.name),
          capitalize(item.brand || item.InventoryItemBrand?.name),
          item.ipAddress || "",
          item.serialNo || "",
          formatDateOnly(item.purchasedAt),
          capitalize(item.location?.name || item.InventoryItemLocation?.name),
          item.ownership || "",
          item.condition || "",
          item.description || "",
          formatDateTime(item.createdAt),
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
        `items_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.name.endsWith('.csv')) {
        setUploadError('Please select a CSV file');
        return;
      }
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setUploadError('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
      setUploadError(null);
      setUploadResult(null);
    }
  };

  const handleDownloadSample = async () => {
    try {
      const csvUrl = '/inventory/sample.csv';
      const link = document.createElement('a');
      link.href = csvUrl;
      link.setAttribute('download', 'inventory_sample.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download sample CSV:', error);
      setUploadError('Failed to download sample CSV file');
    }
  };

  
  const handleCsvUpload = async () => {
    if (!selectedFile) {
      setUploadError("Please select a CSV file");
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadResult(null);

    try {
      const result = await uploadInventoryCsv(selectedFile);
      setUploadResult(result);
      
      // Refresh items if we imported at least one record
      if ((result.successRecords || 0) > 0) {
        dispatch(fetchItems());
      }
      
      // Only close modal if there are no errors
      if ((result.errorRecords || 0) === 0 && (!result.errors || result.errors.length === 0) && (!result.errorRows || result.errorRows.length === 0)) {
        handleCloseCsvModal();
      }
    } catch (error: any) {
      console.error("CSV upload error:", error);
      setUploadError(
        error.response?.data?.message || 
        error.message || 
        "Failed to upload CSV file. Please try again."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleCloseCsvModal = () => {
    setIsCsvUploadModalOpen(false);
    setSelectedFile(null);
    setUploadResult(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDownloadResult = () => {
    if (uploadResult?.resultFilename) {
      const url = `/api/v1/inventory/csv/${uploadResult.resultFilename}`;
      window.open(url, "_blank");
    }
  };

  return (
    <div className="space-y-6">
      {/* Title and Actions */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <p className="text-xl font-medium tracking-tighter">All Items ({visibleCount})</p>
        <div className="flex gap-4">
          <button
            onClick={handleExport}
            disabled={isExporting || filteredItems.length === 0}
            className="h-10 rounded-xl px-3 flex items-center gap-x-2 text-base font-medium border border-primary-100 hover:bg-primary-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <img src="/src/assets/Images/Dashboard/doc/exl-icon.svg" alt="" />
            {isExporting ? "Exporting..." : "Export Items"}
          </button>
          <button
            onClick={() => setIsCsvUploadModalOpen(true)}
            className="h-10 rounded-xl px-3 flex items-center gap-x-2 text-base font-medium border border-primary-100 hover:bg-primary-100"
          >
            <img src="/src/assets/Images/Dashboard/doc/exl-icon.svg" alt="" />
            Upload CSV
          </button>
          <Button
            style="Secondary"
            href="/dashboard/inventory/items/add"
            text="Add New Items"
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
        data={filteredItems}
        searchPlaceholder="Search by any items details..."
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
            setSelectedItem(null);
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
                setSelectedItem(null);
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
            Are you sure you want to delete this item? You CAN NOT view this
            item in your list anymore if you delete.
          </p>
          {selectedItem && (
            <p className="font-medium text-textColor-primary">
              Item: {selectedItem.name || `Item #${selectedItem.id}`}
            </p>
          )}
          {deleteError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
              {deleteError}
            </div>
          )}
        </div>
      </PopupModal>

      {/* CSV Upload Modal */}
      <PopupModal
        open={isCsvUploadModalOpen}
        onClose={handleCloseCsvModal}
        title="Upload Inventory CSV"
        hideFooter={false}
        customFooter={
          <div className="flex justify-end gap-2 w-full">
            <Button
              style="Tertiary"
              text="Cancel"
              onClick={handleCloseCsvModal}
              disabled={isUploading}
            />
            <Button
              style="Primary"
              text={isUploading ? "Uploading..." : "Upload"}
              onClick={handleCsvUpload}
              disabled={isUploading || !selectedFile}
            />
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-textColor-muted">Need a template?</p>
            <Button
              style="Secondary"
              text="Download Sample CSV"
              onClick={handleDownloadSample}
              disabled={isUploading}
            />
          </div>

          {uploadError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
              {uploadError}
            </div>
          )}

          {uploadResult && (
            <div className="space-y-4">
              <div className="space-y-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="text-sm">
                  <p className="font-medium text-blue-900">
                    {(() => {
                      const hasSuccess = (uploadResult.successRecords || 0) > 0;
                      const hasErrors = (uploadResult.errorRecords || 0) > 0;
                      if (hasSuccess && !hasErrors) return "Upload Completed";
                      if (hasSuccess && hasErrors) return "Upload Completed with warnings";
                      return "Upload Failed";
                    })()}
                  </p>
                  {uploadResult.totalRecords > 0 && (
                    <p className="text-blue-700 mt-1">
                      Errors in Records: {uploadResult.errorRecords} / {uploadResult.totalRecords}
                    </p>
                  )}
                  {uploadResult.successRecords > 0 && (
                    <p className="text-blue-700">
                      Successfully imported: {uploadResult.successRecords} records
                    </p>
                  )}
                  {uploadResult.resultFilename && (
                    <button
                      onClick={handleDownloadResult}
                      className="mt-2 text-primary-500 hover:underline text-sm"
                    >
                      Download Result File
                    </button>
                  )}
                </div>
              </div>

              {/* Display a single condensed error message */}
              {((uploadResult.errors?.length ?? 0) > 0 || (uploadResult.errorRows?.length ?? 0) > 0) && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                  Error found: {firstUploadError || "Validation error"}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium">CSV File</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              disabled={isUploading}
              className="w-full border border-borderColor-secondary rounded-md px-3 py-2 text-sm"
            />
            {selectedFile && (
              <p className="text-sm text-textColor-muted">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>
        </div>
      </PopupModal>
    </div>
  );
};

export default AllItems;
