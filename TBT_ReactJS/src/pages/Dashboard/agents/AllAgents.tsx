"use client";

import type React from "react";
import { useEffect, useState, useMemo } from "react";
import useToast from '@/hooks/useToast';
import * as yup from 'yup'

const deleteSchema = yup.object({
  reason: yup.string().trim().required('Reason is required'),
})
import { Link } from "react-router-dom";
import DataTable from "@/components/Molecules/DataTable";
import Button from "@/components/Atomic/Button";
import UserAvatar from "@/components/Molecules/ui/UserAvatar";
import PopupModal from "@/components/Molecules/ui/PopupModal";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchAgents, removeAgent } from "@/redux/agent/agentSlice";
import { Agent } from "@/redux/agent/agentTypes";
import { ENTITY_STATUS } from "@/constants/entityStatus";
import { fetchCountries } from "@/redux/country/countrySlice";
import { getAllTeams } from "@/services/teamService";

const AllAgents: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<number | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [teamsCache, setTeamsCache] = useState<Map<number, string>>(new Map());
  const agents = useAppSelector((state) => state.agents.agents);
  const dispatch = useAppDispatch();
  const { error: showError, success: showSuccess } = useToast();

  const renderNameColumn = (agent: Agent) => (
    <div className="flex gap-3 py-2">
      <UserAvatar name={agent?.first_name} background="#FFA15D" small />
      <div className="space-y-1">
        <p>{`${agent?.first_name} ${agent?.last_name}`}</p>
        <span className="px-2 bg-primary-500 text-white rounded inline-block text-xs">
          {agent?.first_name}
        </span>
      </div>
    </div>
  );

  const renderTeamsColumn = (agent: Agent) => {
    const teams = agent?.teamLinks
      ?.map((link: any) => {
        const teamId = link?.Team?.id;
        const teamHash = link?.Team?.hash || (link?.Team as any)?.hash || (teamId ? teamsCache.get(teamId) : null);
        return {
          name: link?.Team?.name,
          hash: teamHash,
          id: teamId,
        };
      })
      .filter((team: any) => team.name) || [];

    if (!teams || teams.length === 0) {
      return <span className="text-textColor-muted">N/A</span>;
    }

    return (
      <div className="max-w-[240px] space-x-2">
        {teams.map((team: any, index: number) => {
          // Always use hash if available, otherwise fall back to ID
          const teamHash = team.hash;
          const hashOrId = teamHash || team.id;
          return (
            <Link
              key={index}
              to={`/dashboard/team/details/${hashOrId}`}
              className="chip hover:underline cursor-pointer"
            >
              {team.name}
            </Link>
          );
        })}
      </div>
    );
  };

  const renderActionsColumn = (agent: Agent) => {
    const agentHash = agent.hash || (agent as any).hash;
    const hashOrId = agentHash || agent.id;
    return (
      <div className="flex gap-x-2 justify-end pt-2">
        <Button style="Icon" href={`/dashboard/agents/details/${hashOrId}`} icon="visibility" />
        <Button
          style="Icon"
          href={`/dashboard/agents/edit/${hashOrId}`}
          icon="edit"
        />
      <Button
        style="IconDelete"
        icon="delete"
        onClick={() => {
          if (agent.id) {
            setAgentToDelete(agent.id);
            setDeleteReason("");
            setIsModalOpen(true);
          }
        }}
      />
    </div>
    );
  };

  const renderAddressColumn = (agent: Agent) => {
    const addressParts = [];
    
    // Add address_line1
    if (agent.address_line1) {
      addressParts.push(agent.address_line1);
    }
    
    // Add address_line2 if exists
    if (agent.address_line2) {
      addressParts.push(agent.address_line2);
    }
    
    // Add state name (from nested object or lookup)
    const stateName = agent.State?.name || 
      (agent.state_id && states.find(s => s.id === agent.state_id)?.name);
    if (stateName) {
      addressParts.push(stateName);
    }
    
    // Add country name (from nested object or lookup)
    const countryName = agent.Country?.name || 
      (agent.country_id && countries.find(c => c.id === agent.country_id)?.name);
    if (countryName) {
      addressParts.push(countryName);
    }
    
    if (addressParts.length === 0) {
      return <span className="text-textColor-muted">N/A</span>;
    }
    
    return <span>{addressParts.join(", ")}</span>;
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
      key: "first_name",
      title: "Name",
      render: (_: any, agent: Agent) => renderNameColumn(agent),
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
      key: "sex",
      title: "Gender",
      width: "max-w-28",
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
      key: "teamLinks",
      title: "Assigned Teams",
      render: (_: any, agent: Agent) => renderTeamsColumn(agent),
    },
    {
      key: "address_line1",
      title: "Address",
      width: "max-w-28",
      render: (_: any, agent: Agent) => renderAddressColumn(agent),
    },
    {
      key: "actions",
      title: "Action",
      align: "right" as const,
      render: (_: any, agent: Agent) => renderActionsColumn(agent),
    },
  ];

  const countries = useAppSelector((state) => state.countries.list);
  const states = useAppSelector((state) => state.states.list);

  useEffect(() => {
    dispatch(fetchAgents());
    dispatch(fetchCountries());
    
    // Pre-fetch teams to get hashes for teams that don't have hash in teamLinks
    const loadTeams = async () => {
      try {
        const allTeams = await getAllTeams();
        const hashMap = new Map<number, string>();
        allTeams.forEach((team: any) => {
          if (team.id && team.hash) {
            hashMap.set(team.id, team.hash);
          }
        });
        setTeamsCache(hashMap);
      } catch (error) {
        console.error("Failed to load teams for hash mapping:", error);
      }
    };
    loadTeams();
  }, [dispatch]);

  const handleDeleteAgent = async () => {
    if (!agentToDelete) return;
    try {
      await deleteSchema.validate({ reason: deleteReason })
      setDeleteError('')
    } catch (err: any) {
      const message = err?.message || 'Reason is required to delete an agent'
      setDeleteError(message)
      // Throw so PopupModal doesn't auto-close
      throw new Error(message)
    }

    try {
      setIsDeleting(true);
      await dispatch(removeAgent({ id: agentToDelete, reason: deleteReason })).unwrap();
      setAgentToDelete(null);
      setDeleteReason("");
      showSuccess('Agent deleted successfully');
    } catch (error) {
      console.error("Failed to delete agent:", error);
      showError(error);
      setAgentToDelete(null);
      setDeleteReason("");
      return;
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDateTime = (date: string | Date | number | undefined): string => {
    if (!date) return "";
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return "";
      return d.toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const handleExport = () => {
    if (!filteredAgents.length || isExporting) return;
    setIsExporting(true);
    try {
      const headers = [
        "ID",
        "First Name",
        "Last Name",
        "Nickname",
        "Email",
        "Date of Birth",
        "Phone Number",
        "Mobile Number",
        "Address",
        "Country",
        "State",
        "Gender",
        "Status",
        "Created At",
      ];

      const csvRows = filteredAgents.map((agent) => {
        const countryName = agent.country_id
          ? countries.find((c) => c.id === agent.country_id)?.name || ""
          : "";
        const stateName = agent.state_id
          ? states.find((s) => s.id === agent.state_id)?.name || ""
          : "";

        return [
          agent.id || "",
          agent.first_name || "",
          agent.last_name || "",
          agent.nickname || "",
          agent.email || "",
          agent.dob || "",
          agent.phone_number || "",
          agent.mobile_number || "",
          agent.address_line1 || "",
          countryName,
          stateName,
          agent.sex || "",
          agent.status || "",
          formatDateTime(agent.createdAt),
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
        `agents_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  // Filter agents - no date range filtering
  const filteredAgents = useMemo(() => {
    return [...agents];
  }, [agents]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <p className="text-xl font-medium tracking-tighter">Agents ({visibleCount})</p>
        <div className="flex gap-4">
          <button 
            onClick={handleExport}
            disabled={isExporting || filteredAgents.length === 0}
            className="h-10 rounded-md px-3 flex items-center gap-x-2 text-base font-medium border border-primary-100 hover:bg-primary-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <img src="/src/assets/Images/Dashboard/doc/exl-icon.svg" alt="" />
            {isExporting ? "Exporting..." : "Export Agents"}
          </button>
          <Button
            style="Secondary"
            href="/dashboard/agents/add"
            text="Add New Agent"
            icon="add"
          />
        </div>
      </div>


      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredAgents}
        searchPlaceholder="Search by any agent details..."
        className="mt-6"
        onCountChange={setVisibleCount}
      />

      {/* Delete Modal */}
      <PopupModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setAgentToDelete(null);
          setDeleteReason("");
        }}
        onConfirm={handleDeleteAgent}
        title="Confirm Delete"
      >
        <p className="mb-4">
          Are you sure you want to delete this Agent? You CAN NOT view this
          Agent in your list anymore if you delete.
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

export default AllAgents;
