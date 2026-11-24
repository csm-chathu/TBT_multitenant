"use client";

import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import PopupModal from "../../../components/Molecules/ui/PopupModal";
import DataTable from "../../../components/Molecules/DataTable";
import DateRangeFilter, { DateRangeFilterState } from "@/components/Molecules/DateRangeFilter";
import useToast from '@/hooks/useToast'
import CustomerTagBadge from "@/components/Molecules/ui/CustomerTagBadge";
import {
  getAllMessages,
  sendMessage,
  type MessageRecord,
} from "@/services/messageService";

const AllMessages: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const { success: toastSuccess, error: toastError} = useToast()
  const [filters, setFilters] = useState<DateRangeFilterState>({
    dateRange: "Last 30 Days",
  });

  // Send SMS modal state
  const [sendOpen, setSendOpen] = useState(false);
  const [sendTo, setSendTo] = useState("");
  const [sendBody, setSendBody] = useState("");
  const [sendTicketId, setSendTicketId] = useState<string>("");
  const [sending, setSending] = useState(false);
  const formatDateTime = useCallback((value?: string) => {
    if (!value) return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "N/A";
    }
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  const formatNullableText = useCallback((value: unknown): string => {
    if (value === null || value === undefined) return "N/A";

    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : "N/A";
    }

    if (typeof value === "object") {
      const record = value as Record<string, unknown>;
      const composed = [record.first_name, record.last_name]
        .filter(Boolean)
        .join(" ");
      if (composed.trim().length > 0) return composed.trim();
      if (typeof record.name === "string" && record.name.trim().length > 0) {
        return record.name.trim();
      }
    }

    return String(value);
  }, []);

  const renderStatus = (status?: MessageRecord["status"]) => {
    if (!status) return <span className="text-textColor-muted">N/A</span>;

    const baseClasses = "inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold uppercase tracking-wide";
    type MessageStatus = NonNullable<MessageRecord["status"]>
    const variantClasses: Record<MessageStatus, string> = {
      SENT: "bg-green-100 text-green-700",
      RECEIVED: "bg-blue-100 text-blue-700",
      FAILED: "bg-red-100 text-red-700",
      QUEUED: "bg-amber-100 text-amber-700",
      STORED: "bg-slate-100 text-slate-700",
    };

    return (
      <span className={`${baseClasses} ${variantClasses[status] ?? "bg-primary-100 text-primary-700"}`}>
        {status.toLowerCase()}
      </span>
    );
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const list = await getAllMessages();
        setMessages(Array.isArray(list) ? list : []);
      } catch (e) {
        try { toastError('Failed to load messages') } catch {}
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const onRefresh = async () => {
    setLoading(true);
    try {
      const list = await getAllMessages();
      setMessages(Array.isArray(list) ? list : []);
    } catch (e) {
      try { toastError('Failed to refresh messages') } catch {}
    } finally {
      setLoading(false);
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

  // Filter messages based on filter state
  const filteredMessages = useMemo(() => {
    let filtered = [...messages];

    // Filter by date range
    if (filters.dateRange && filters.dateRange !== "All") {
      const { start, end } = getDateRange(filters.dateRange);
      filtered = filtered.filter((message) => {
        // Try multiple date fields
        const dateValue = message.createdAt || message.dateCreated || message.updatedAt || (message as any).created_at;
        if (!dateValue) return false;

        try {
          const messageDate = new Date(dateValue);
          if (isNaN(messageDate.getTime())) return false;
          return messageDate >= start && messageDate <= end;
        } catch {
          return false;
        }
      });
    }

    return filtered;
  }, [messages, filters]);

  const columns = useMemo(() => [
    {
      key: "createdAt",
      title: "Date Created",
      render: (_: unknown, row: MessageRecord) => {
        const dateValue = row.createdAt || row.dateCreated || row.updatedAt;
        return <span>{formatDateTime(dateValue)}</span>;
      },
      cellClassName: "whitespace-nowrap align-top",
    },
    {
      key: "from",
      title: "From",
      render: (value: unknown) => <span>{formatNullableText(value)}</span>,
      cellClassName: "whitespace-nowrap align-top",
    },
    {
      key: "to",
      title: "To",
      render: (value: unknown) => <span>{formatNullableText(value)}</span>,
      cellClassName: "whitespace-nowrap align-top",
    },
    {
      key: "type",
      title: "Type",
      render: (value: unknown) => <span className="uppercase text-xs font-semibold text-textColor-muted">{formatNullableText(value)}</span>,
      cellClassName: "align-top",
    },
    {
      key: "message",
      title: "Message",
      render: (value: string) => (
        value ? (
          <p className="py-2 whitespace-pre-line break-words leading-relaxed text-sm">
            {value}
          </p>
        ) : (
          <span className="text-textColor-muted">N/A</span>
        )
      ),
      cellClassName: "align-top whitespace-pre-line break-words max-w-[420px]",
    },
    {
      key: "customer",
      title: "Customer",
      render: (_: unknown, row: MessageRecord) => {
        const customerObj = (row.Customer && typeof row.Customer === 'object' ? row.Customer : null) as any;
        const tag = customerObj?.tag || (row as any)?.customer_tag;
        let displayName = 'N/A';
        if (row.customer_name) {
          displayName = row.customer_name;
        } else if (customerObj) {
          displayName = [customerObj.first_name, customerObj.last_name].filter(Boolean).join(' ') || 'N/A';
        } else if (row.customer) {
          displayName = formatNullableText(row.customer);
        }
        return (
          <div className="flex items-center gap-2 flex-wrap">
            <span>{displayName}</span>
            {tag && <CustomerTagBadge tag={tag} size="sm" />}
          </div>
        );
      },
      cellClassName: "align-top",
    },
    {
      key: "direction",
      title: "Direction",
      render: (_: unknown, row: MessageRecord) => {
        // Use direction if available, otherwise fall back to status
        if (row.direction) {
          const baseClasses = "inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold uppercase tracking-wide";
          const variantClasses: Record<string, string> = {
            inbound: "bg-blue-100 text-blue-700",
            outbound: "bg-green-100 text-green-700",
          };
          return (
            <span className={`${baseClasses} ${variantClasses[row.direction] || "bg-primary-100 text-primary-700"}`}>
              {row.direction}
            </span>
          );
        }
        return renderStatus(row.status);
      },
      cellClassName: "align-top whitespace-nowrap",
    },
    {
      key: "application",
      title: "Application",
      render: (_: unknown, row: MessageRecord) => {
        // Prefer Application object, then application string
        if (row.Application && typeof row.Application === 'object') {
          const app = row.Application as { name?: string; [key: string]: any };
          return <span>{app.name || formatNullableText(row.Application)}</span>;
        }
        return <span>{formatNullableText(row.application)}</span>;
      },
      cellClassName: "align-top",
    },
    {
      key: "ticket_id",
      title: "Ticket ID",
      render: (_: any, row: MessageRecord) => row.ticket_id ?? "N/A",
      cellClassName: "align-top",
    },
  ], [formatDateTime, formatNullableText]);

  const handleSend = async () => {
    const body = sendBody.trim();
    if (!body) return;
    setSending(true);
    try {
      const payload: any = { message: body };
      if (sendTo.trim()) payload.to = sendTo.trim();
      const parsedId = Number(sendTicketId);
      if (!Number.isNaN(parsedId) && parsedId > 0) payload.ticket_id = parsedId;
      await sendMessage(payload);
      try { toastSuccess('SMS sent and stored') } catch {}
      setSendOpen(false);
      setSendTo("");
      setSendBody("");
      setSendTicketId("");
      await onRefresh();
    } catch (e: any) {
      const msg = (e instanceof Error ? e.message : e?.message) || "Failed to send message";
      try { toastError(String(msg)) } catch {}
    } finally {
      setSending(false);
    }
  };

  const handleExport = () => {
    if (filteredMessages.length === 0 || isExporting) return;
    
    setIsExporting(true);
    try {
      const headers = [
        "Date Created",
        "From",
        "To",
        "Type",
        "Message",
        "Customer",
        "Direction",
        "Application",
        "Ticket ID",
        "Status",
      ];

      const escapeCsvValue = (value: unknown): string => {
        const stringValue =
          value === null || value === undefined ? "" : String(value).replace(/\r?\n/g, " ");
        if (/[",]/.test(stringValue)) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      };

      const csvRows = filteredMessages.map((message) => {
        // Format date
        const dateValue = message.createdAt || message.dateCreated || message.updatedAt;
        const formattedDate = dateValue
          ? formatDateTime(dateValue)
          : "N/A";

        // Get customer name
        let customerName = "N/A";
        if (message.customer_name) {
          customerName = message.customer_name;
        } else if (message.Customer && typeof message.Customer === 'object') {
          const customer = message.Customer as { first_name?: string; last_name?: string };
          customerName = [customer.first_name, customer.last_name].filter(Boolean).join(' ') || 'N/A';
        } else if (message.customer) {
          customerName = formatNullableText(message.customer);
        }

        // Get application name
        let applicationName = "N/A";
        if (message.Application && typeof message.Application === 'object') {
          const app = message.Application as { name?: string; [key: string]: any };
          applicationName = app.name || formatNullableText(message.Application);
        } else if (message.application) {
          applicationName = formatNullableText(message.application);
        }

        // Get direction/status
        const direction = message.direction || message.status || "N/A";
        const status = message.status || "N/A";

        return [
          formattedDate,
          formatNullableText(message.from),
          formatNullableText(message.to),
          formatNullableText(message.type),
          message.message || "",
          customerName,
          direction,
          applicationName,
          message.ticket_id?.toString() || "N/A",
          status,
        ];
      });

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
        `messages_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      try { toastError('Failed to export messages') } catch {}
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title and Actions */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <p className="text-xl font-medium tracking-tighter">All messages ({visibleCount})</p>
        <div className="flex gap-4">
          <button
            onClick={onRefresh}
            disabled={loading}
            className={`h-10 rounded-xl px-3 flex items-center gap-x-2 text-base font-medium border border-primary-100 ${loading ? 'opacity-60 cursor-not-allowed' : 'hover:bg-primary-100'}`}
          >
            <span className="material-symbols-outlined">refresh</span>
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || filteredMessages.length === 0}
            className="h-10 rounded-xl px-3 flex items-center gap-x-2 text-base font-medium border border-primary-100 hover:bg-primary-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <img src="/src/assets/Images/Dashboard/doc/exl-icon.svg" alt="" />
            {isExporting ? "Exporting..." : "Export messages"}
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mt-6 flex flex-wrap gap-2 items-center justify-between">
        <DateRangeFilter onFilterChange={setFilters} />
      </div>

      {/* Table */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-surface-primary/70 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2 text-sm text-textColor-muted">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
              <span>Loading messages…</span>
            </div>
          </div>
        )}
        <DataTable
          columns={columns}
          data={filteredMessages}
          searchPlaceholder="Search by any Customer details..."
          showSearch={true}
          showPagination={true}
          onCountChange={setVisibleCount}
          className={loading ? "pointer-events-none opacity-60" : ""}
        />
      </div>

      {/* Delete Confirmation Modal */}
      <PopupModal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title="Confirm Delete"
      >
        <p>
          Are you sure you want to delete this Customer? You CAN NOT view
          this Customer in your list anymore if you delete.
        </p>
      </PopupModal>

      {/* Send SMS Modal */}
      <PopupModal
        open={sendOpen}
        onClose={() => !sending && setSendOpen(false)}
        title="Send SMS"
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">To (E.164, optional)</label>
            <input
              className="w-full border border-borderColor-secondary rounded-md px-3 py-2"
              placeholder="+16262098347"
              value={sendTo}
              onChange={(e) => setSendTo(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Ticket ID (optional)</label>
            <input
              className="w-full border border-borderColor-secondary rounded-md px-3 py-2"
              placeholder="e.g. 91"
              inputMode="numeric"
              value={sendTicketId}
              onChange={(e) => setSendTicketId(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Message</label>
            <textarea
              className="w-full border border-borderColor-secondary rounded-md px-3 py-2 min-h-[100px]"
              placeholder="Your text"
              value={sendBody}
              onChange={(e) => setSendBody(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              className="h-9 rounded-md px-3 border border-borderColor-secondary"
              onClick={() => setSendOpen(false)}
              disabled={sending}
            >
              Cancel
            </button>
            <button
              className={`h-9 rounded-md px-3 text-base-white ${sendBody.trim() && !sending ? 'bg-secondary-500 hover:bg-secondary-600' : 'bg-secondary-300 cursor-not-allowed'}`}
              onClick={handleSend}
              disabled={!sendBody.trim() || sending}
            >
              {sending ? 'Sending…' : 'Send SMS'}
            </button>
          </div>
        </div>
      </PopupModal>

      {/* toasts handled programmatically via useToast */}
    </div>
  );
};

export default AllMessages;
