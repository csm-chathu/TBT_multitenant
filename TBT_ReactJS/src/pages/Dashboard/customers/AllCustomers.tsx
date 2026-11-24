"use client";

import type React from "react";
import { useEffect, useState, useMemo } from "react";
import useToast from '@/hooks/useToast';
import * as yup from 'yup'

const deleteSchema = yup.object({
  reason: yup.string().trim().required('Reason is required'),
})
import Button from "../../../components/Atomic/Button";
import { Link } from "react-router-dom";
import PopupModal from "../../../components/Molecules/ui/PopupModal";
import DataTable from "../../../components/Molecules/DataTable";
import DateRangeFilter, { DateRangeFilterState } from "@/components/Molecules/DateRangeFilter";
import UserAvatar from "@/components/Molecules/ui/UserAvatar";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchCustomers, removeCustomer } from "@/redux/customer/customerSlice";
import { Customer } from "@/redux/customer/customerTypes";
import { ENTITY_STATUS } from "@/constants/entityStatus";
import { getOrFallback, formatPhone } from "@/utils/textUtils";
import CustomerTagBadge from "@/components/Molecules/ui/CustomerTagBadge";

const AllCustomers: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const applications = useAppSelector((state) => state.customers.customers);
  const meta = useAppSelector((state) => state.customers.meta);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<DateRangeFilterState>({
    dateRange: "Last 30 Days",
  });


  const renderNameColumn = (customer: Customer) => {
    const customerHash = (customer as any).hash || (customer as any).hash;
    const hashOrId = customerHash || customer.id;
    const customerCode = customer.customer_code || (customer.id ? `CUST-${String(customer.id).padStart(4, '0')}${customer.first_ticket_id ? String(customer.first_ticket_id).padStart(5, '0') : '00000'}` : '');
    return (
      <Link to={`/dashboard/customers/details/${hashOrId}`} className="flex gap-3 items-center">
        <UserAvatar name={customer?.first_name} background="#FFA15D" small />
        <div>
          <div className="flex items-center gap-2">
            <p className="text-primary-500">{(() => {
              const name = `${customer?.first_name || ''} ${customer?.last_name && customer?.last_name !== "null" ? customer?.last_name : ''}`.trim();
              return /^\+?[\d\s\-().]{7,}$/.test(name) ? formatPhone(name) : name;
            })()}</p>
            {customer.tag && <CustomerTagBadge tag={customer.tag} size="sm" />}
          </div>
          {customerCode && <p className="text-xs text-textColor-muted">{customerCode}</p>}
        </div>
      </Link>
    );
  };

  const renderActionsColumn = (customer: Customer) => {
    const customerHash = customer.hash || (customer as any).hash;
    const hashOrId = customerHash || customer.id;
    return (
    <div className="flex gap-x-2 justify-end pt-2">
      <Button
        style="Icon"
          href={`/dashboard/customers/details/${hashOrId}`}
        icon="visibility"
      />
      <Button
        style="Icon"
          href={`/dashboard/customers/edit/${hashOrId}`}
        icon="edit"
      />
      <Button
        style="IconDelete"
        icon="delete"
        onClick={() => {
          setSelectedCustomerId(customer.id || null);
          setDeleteReason("");
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
        if (!value) return <span>N/A</span>;
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
      key: "first_name",
      title: "Name",
      render: (_: any, customer: Customer) => renderNameColumn(customer),
    },
    {
      key: "email",
      title: "Email",
      render: (value: string | null | undefined) => <span>{getOrFallback(value)}</span>,
    },
    {
      key: "phone_number",
      title: "Phone Number",
      render: (value: string | null | undefined) => <span>{value ? formatPhone(value) : 'N/A'}</span>,
    },
    {
      key: "sex",
      title: "Gender",
      width: "max-w-28",
    },
    {
      key: "status",
      title: "Status",
      render: (value: string) => {
        // Backend sometimes returns lowercase (e.g. "active"), so normalize before comparing
        const normalized = (value || "").toLowerCase();
        if (normalized === ENTITY_STATUS.ACTIVE.toLowerCase()) {
          return <span className="priority-chip priority-low">Active</span>;
        }
        if (normalized === ENTITY_STATUS.DISABLED.toLowerCase()) {
          return <span className="priority-chip priority-critical">Disabled</span>;
        }
        return <span>{value || "N/A"}</span>;
      },
    },
    {
      key: "address_line1",
      title: "Address",
    },
    {
      key: "actions",
      title: "Action",
      align: "right" as const,
      render: (_: any, customer: Customer) => renderActionsColumn(customer),
    },
  ];

  const dispatch = useAppDispatch();
  const { error: showError, success: showSuccess } = useToast();

  useEffect(() => {
    const timeout = setTimeout(() => {
      dispatch(fetchCustomers({ page, limit, search: search.trim() || undefined }));
    }, search ? 400 : 0);
    return () => clearTimeout(timeout);
  }, [dispatch, page, limit, search]);

  const selectedCustomer = applications.find((c) => c.id === selectedCustomerId);

  const handleDeleteCustomer = async () => {
    if (!selectedCustomerId) return;
    try {
      await deleteSchema.validate({ reason: deleteReason })
      setDeleteError('')
    } catch (err: any) {
      const message = err?.message || 'Reason is required to delete a customer'
      setDeleteError(message)
      throw new Error(message)
    }

    try {
      setIsDeleting(true);
      await dispatch(removeCustomer({ id: selectedCustomerId, reason: deleteReason })).unwrap();
      dispatch(fetchCustomers({ page, limit, search: search.trim() || undefined }));
      setSelectedCustomerId(null);
      setDeleteReason("");
      showSuccess('Customer deleted successfully');
    } catch (err) {
      console.error("Failed to delete customer:", err);
      showError(err);
      setSelectedCustomerId(null);
      setDeleteReason("");
      return;
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculate date range based on filter
  const getDateRange = (dateRange: string): { start: Date; end: Date } => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
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

  // Filter customers based on filter state
  const filteredCustomers = useMemo(() => {
    let filtered = [...applications];

    // Filter by date range
    if (filters.dateRange && filters.dateRange !== "All") {
      const { start, end } = getDateRange(filters.dateRange);
      filtered = filtered.filter((customer) => {
        // Try multiple date fields (some may come from legacy responses)
        const dateValue = customer.createdAt || (customer as any).dateCreated || (customer as any).created_at;
        if (!dateValue) return false;

        try {
          const customerDate = new Date(dateValue);
          if (isNaN(customerDate.getTime())) return false;
          
          // Compare dates - customer date should be between start (inclusive) and end (inclusive)
          // Start is already set to 0:0:0:0, end is set to 23:59:59:999
          return customerDate >= start && customerDate <= end;
        } catch {
          return false;
        }
      });
    }

    return filtered;
  }, [applications, filters]);

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
    if (!applications.length || isExporting) return;
    setIsExporting(true);
    try {
      const headers = [
        "ID",
        "Date Created",
        "First Name",
        "Last Name",
        "Email",
        "Phone Number",
        "Gender",
        "Status",
        "Customer Tag",
        "Address",
      ];

      const csvRows = applications.map((customer) => {
        return [
          customer.id || "",
          formatDateTime(customer.createdAt),
          customer.first_name || "",
          customer.last_name || "",
          customer.email || "",
          customer.phone_number || "",
          customer.sex || "",
          customer.status || "",
          customer.tag || "",
          customer.address_line1 || "",
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
        `customers_${new Date().toISOString().slice(0, 10)}.csv`
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
        <p className="text-xl font-medium tracking-tighter">All Customers ({visibleCount})</p>
        <div className="flex gap-4">
          <button
            onClick={handleExport}
            disabled={isExporting || filteredCustomers.length === 0}
            className="h-10 rounded-xl px-3 flex items-center gap-x-2 text-base font-medium border border-primary-100 hover:bg-primary-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <img src="/src/assets/Images/Dashboard/doc/exl-icon.svg" alt="" />
            {isExporting ? "Exporting..." : "Export Customers"}
          </button>
          <Button
            style="Secondary"
            href="/dashboard/customers/add"
            text="Add New Customer"
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
        data={applications}
        searchPlaceholder="Search by any Customer details..."
        showSearch={true}
        showPagination={true}
        onCountChange={setVisibleCount}
        searchValue={search}
        onSearchChange={(term) => { setSearch(term); setPage(1); }}
        serverPagination={{
          page: meta.page,
          limit: meta.limit,
          total: meta.total,
          totalPages: meta.totalPages,
          onPageChange: setPage,
          onLimitChange: (l) => { setLimit(l); setPage(1); },
        }}
      />

      {/* Delete Confirmation Modal */}
      <PopupModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCustomerId(null);
          setDeleteReason("");
        }}
        onConfirm={handleDeleteCustomer}
        title="Confirm Delete"
      >
        <p className="mb-4">
          Are you sure you want to delete{' '}
          <strong>{selectedCustomer ? `${selectedCustomer.first_name} ${selectedCustomer.last_name}` : 'this customer'}</strong>?
          You will not be able to view this customer in the list after deletion.
        </p>

        <label className="block text-sm font-medium mb-1">Reason (required)</label>
        <textarea
          value={deleteReason}
          onChange={(e) => { setDeleteReason(e.target.value); setDeleteError('') }}
          className="w-full min-h-[80px] border rounded p-2 bg-white text-black"
          placeholder="Provide a reason for deletion"
          disabled={isDeleting}
        />
        {deleteError && (
          <p className="mt-2 text-sm text-red-600">{deleteError}</p>
        )}
      </PopupModal>
    </div>
  );
};

export default AllCustomers;
