"use client";

import type React from "react";
import { useEffect, useState, useMemo } from "react";
import Button from "../../../components/Atomic/Button";
import PopupModal from "../../../components/Molecules/ui/PopupModal";
import DataTable from "../../../components/Molecules/DataTable";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchApplications, removeApplication } from "@/redux/applications/applicationSlice";
import { Application } from "@/redux/applications/applicationTypes";
import { ENTITY_STATUS } from "@/constants/entityStatus";
import useToast from '@/hooks/useToast'
import * as yup from 'yup'

const deleteSchema = yup.object({
  reason: yup.string().trim().required('Reason is required'),
})

const AllApplications: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState<number | null>(null);
  const [deleteReason, setDeleteReason] = useState<string>('');
  const [deleteError, setDeleteError] = useState<string>('');
  const [visibleCount, setVisibleCount] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const applications = useAppSelector(
    (state) => state.applications.applications
  );
  const dispatch = useAppDispatch();

  const renderActionsColumn = (application: Application) => {
    const appHash = application.hash || (application as any).hash;
    const hashOrId = appHash || application.id;
    return (
      <div className="flex gap-x-2 justify-end pt-2">
        <Button
          style="Icon"
          href={`/dashboard/applications/details/${hashOrId}`}
          icon="visibility"
        />
        <Button
          style="Icon"
          href={`/dashboard/applications/edit/${hashOrId}`}
          icon="edit"
        />
      <Button
        style="IconDelete"
        icon="delete"
        onClick={() => {
          setSelectedApplicationId(application.id || null);
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
      key: "name",
      title: "Name",
    },
    {
      key: "service_email",
      title: "Email",
    },
    {
      key: "service_phone_number",
      title: "Phone Number",
    },
    {
      key: "status",
      title: "Status",
      render: (value: string) => (
        <>
          {value === ENTITY_STATUS.ACTIVE && (
            <span className="priority-chip priority-low">Active</span>
          )}
          {value === ENTITY_STATUS.DISABLED && (
            <span className="priority-chip priority-critical">Disabled</span>
          )}
        </>
      ),
    },
    {
      key: "organization",
      title: "Organization",
      width: "max-w-28",
      render: (_: any, application: Application) => (
        <span>{application?.organization?.name ?? "N/A"}</span>
      ),
    },
    {
      key: "description",
      title: "Application Description",
      render: (value: string) => (
        <div className="max-w-xs truncate" title={value}>
          {value}
        </div>
      ),
    },
    {
      key: "actions",
      title: "Action",
      align: "right" as const,
      render: (_: any, application: Application) =>
        renderActionsColumn(application),
    },
  ];

  useEffect(() => {
    dispatch(fetchApplications());
  }, [dispatch]);

  const toasts = useToast()

  const handleDelete = async () => {
    if (!selectedApplicationId) return

    try {
      await deleteSchema.validate({ reason: deleteReason })
      setDeleteError('')
    } catch (err: any) {
      const message = err?.message || 'Reason is required to delete an application'
      setDeleteError(message)
      // Throw so PopupModal doesn't auto-close; modal will remain open and show the inline error
      throw new Error(message)
    }

    try {
      await dispatch(removeApplication({ id: selectedApplicationId, reason: deleteReason })).unwrap()
      toasts.success('Application deleted successfully')
      setIsModalOpen(false)
      setSelectedApplicationId(null)
      setDeleteReason('')
    } catch (error: any) {
      toasts.error(error)
      setIsModalOpen(false)
      setSelectedApplicationId(null)
      setDeleteReason('')
    }
  };

  const handleExport = () => {
    if (filteredApplications.length === 0) return;
    
    setIsExporting(true);
    try {
      const headers = [
        "Date Created",
        "Name",
        "Email",
        "Phone Number",
        "Status",
        "Organization",
        "Description",
        "Remarks",
        "Created At",
        "Updated At"
      ];

      const csvRows = filteredApplications.map((app) => {
        const createdAt = app.createdAt
          ? new Date(app.createdAt).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "";
        const updatedAt = app.updatedAt
          ? new Date(app.updatedAt).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "";

        return [
          createdAt,
          app.name || "",
          app.service_email || "",
          app.service_phone_number || "",
          app.status || "",
          app.organization?.name || "",
          app.description || "",
          app.remarks || "",
          createdAt,
          updatedAt,
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
        `applications_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  // Get unique organizations for filter options


  // Filter applications - no filtering applied
  const filteredApplications = useMemo(() => {
    return [...applications];
  }, [applications]);

  return (
    <div className="space-y-6">
      {/* Title and Actions */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <p className="text-xl font-medium tracking-tighter">
          All Applications ({visibleCount})
        </p>
        <div className="flex gap-4">
          <button 
            className="h-10 rounded-xl px-3 flex items-center gap-x-2 text-base font-medium border border-primary-100 hover:bg-primary-100 disabled:opacity-60"
            onClick={handleExport}
            disabled={isExporting || filteredApplications.length === 0}
          >
            <img src="/src/assets/Images/Dashboard/doc/exl-icon.svg" alt="" />
            {isExporting ? "Preparing..." : "Export Application"}
          </button>
          <Button
            style="Secondary"
            href="/dashboard/applications/add"
            text="Add New Application"
            icon="add"
          />
        </div>
      </div>


      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredApplications}
        searchPlaceholder="Search by any application details..."
        showSearch={true}
        showPagination={true}
        onCountChange={setVisibleCount}
      />

      {/* Delete Confirmation Modal */}
      <PopupModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedApplicationId(null);
          setDeleteReason('')
        }}
        onConfirm={handleDelete}
        title="Confirm Delete"
      >
        <div className="space-y-3">
          <p>
            Are you sure you want to delete this Application? You CAN NOT view
            this Application in your list anymore if you delete.
          </p>
          <div>
            <label className="block text-sm font-medium mb-1">Reason (required)</label>
            <textarea
              value={deleteReason}
              onChange={(e) => { setDeleteReason(e.target.value); setDeleteError('') }}
              className="w-full border rounded-md p-2 bg-white text-black"
              rows={3}
              placeholder="Provide a reason for deletion"
            />
            {deleteError && (
              <p className="mt-2 text-sm text-red-600">{deleteError}</p>
            )}
          </div>
        </div>
      </PopupModal>
    </div>
  );
};

export default AllApplications;
