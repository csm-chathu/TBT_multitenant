"use client";

import type React from "react";
import { useEffect, useState, useMemo } from "react";
import useToast from '@/hooks/useToast';
import * as yup from 'yup'

const deleteSchema = yup.object({
  reason: yup.string().trim().required('Reason is required'),
})
import Button from "../../../components/Atomic/Button";
import RoleGuard from '../../../components/Atomic/RoleGuard'
import PopupModal from "../../../components/Molecules/ui/PopupModal";
import DataTable from "../../../components/Molecules/DataTable";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchTeams, removeTeam } from "@/redux/team/teamSlice";
import { Team } from "@/redux/team/teamTypes";
import { ENTITY_STATUS } from "@/constants/entityStatus";
import { USER_TYPE_NAMES } from '@/constants/userTypes'

const AllTeam: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<number | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const teams = useAppSelector((state) => state.teams.teams);
  const dispatch = useAppDispatch();
  const { error: showError, success: showSuccess } = useToast();

  

 
  const renderApplicationColumn = (application: Team["Application"]) => (
    <div className="max-w-[240px] space-x-2">
      <span className="chip">{application?.name ?? "N/A"}</span>
    </div>
  );

  const renderActionsColumn = (team: Team) => {
    const teamHash = team.hash || (team as any).hash;
    const hashOrId = teamHash || team.id;
    return (
      <div className="flex gap-x-2 justify-end pt-2">
        <Button
          style="Icon"
          href={`/dashboard/team/details/${hashOrId}`}
          icon="visibility"
        />
        <Button
          style="Icon"
          href={`/dashboard/team/edit/${hashOrId}`}
          icon="edit"
        />
      <Button
        style="IconDelete"
        icon="delete"
        onClick={() => {
          if (team.id) {
            setTeamToDelete(team.id);
            setIsModalOpen(true);
          }
        }}
      />
    </div>
    );
  };

  const columns = [
    {
      key: "createdAt",
      title: "Started on",
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
      title: "Team Name",
    },
    {
      key: "email",
      title: "Email",
    },
    {
      key: "phone_number",
      title: "Phone Number",
    },
    {
      key: "city",
      title: "City",
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
      key: "Application",
      title: "Application",
      render: renderApplicationColumn,
    },
    {
      key: "actions",
      title: "Action",
      align: "right" as const,
      render: (_: any, team: Team) => renderActionsColumn(team),
    },
  ];

  useEffect(() => {
    dispatch(fetchTeams());
  }, [dispatch]);

  const handleDeleteTeam = async () => {
    if (!teamToDelete) return;
    try {
      await deleteSchema.validate({ reason: deleteReason })
      setDeleteError('')
    } catch (err: any) {
      const message = err?.message || 'Reason is required to delete a team'
      setDeleteError(message)
      throw new Error(message)
    }

    try {
      setIsDeleting(true);
      await dispatch(removeTeam({ id: teamToDelete, reason: deleteReason })).unwrap();
      setTeamToDelete(null);
      setDeleteReason("");
      showSuccess('Team deleted successfully');
    } catch (error) {
      console.error("Failed to delete team:", error);
      showError(error);
      setTeamToDelete(null);
      setDeleteReason("");
      return;
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter teams - no date range filtering
  const filteredTeams = useMemo(() => {
    return [...teams];
  }, [teams]);

  const formatDateTime = (value: any): string => {
    if (!value) return "";
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) return "";
      return `${date.toLocaleString("en-US", {
        month: "short",
      })}${date.getDate()}, ${date.getFullYear()} ${date.toLocaleTimeString("en-US", {
        hour12: false,
      })}`;
    } catch {
      return "";
    }
  };

  const handleExport = () => {
    if (!filteredTeams.length || isExporting) return;
    setIsExporting(true);
    try {
      const headers = [
        "ID",
        "Team Name",
        "Email",
        "Phone Number",
        "City",
        "Status",
        "Application",
        "Created At",
      ];

      const csvRows = filteredTeams.map((team) => {
        return [
          team.id || "",
          team.name || "",
          team.email || "",
          team.phone_number || "",
          team.city || "",
          team.status || "",
          team.Application?.name || "N/A",
          formatDateTime(team.createdAt),
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
        `teams_${new Date().toISOString().slice(0, 10)}.csv`
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
        <p className="text-xl font-medium tracking-tighter">Teams ({visibleCount})</p>
        <div className="flex gap-4">
          <button 
            onClick={handleExport}
            disabled={isExporting || filteredTeams.length === 0}
            className="h-10 rounded-xl px-3 flex items-center gap-x-2 text-base font-medium border border-primary-100 hover:bg-primary-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <img src="/src/assets/Images/Dashboard/doc/exl-icon.svg" alt="" />
            {isExporting ? "Exporting..." : "Export Team"}
          </button>
          <RoleGuard allowedRoles={[USER_TYPE_NAMES.TEAM_LEAD,USER_TYPE_NAMES.SUPER_ADMIN]}>
            <Button
              style="Secondary"
              href="/dashboard/team/add"
              text="Add New Team"
              icon="add"
            />
          </RoleGuard>
        </div>
      </div>


      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredTeams}
        searchPlaceholder="Search by any team details..."
        showSearch={true}
        showPagination={true}
        onCountChange={setVisibleCount}
      />

      {/* Delete Confirmation Modal */}
      <PopupModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setTeamToDelete(null);
          setDeleteReason("");
        }}
        onConfirm={handleDeleteTeam}
        title="Confirm Delete"
      >
        <p className="mb-4">
          Are you sure you want to delete this Team? You CAN NOT view this
          Team in your list anymore if you delete.
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

export default AllTeam;
